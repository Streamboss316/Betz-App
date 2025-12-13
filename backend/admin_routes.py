from fastapi import APIRouter, HTTPException, Depends, Header
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, ConfigDict
from typing import List, Optional
import os
import jwt
from datetime import datetime, timezone, timedelta
import bcrypt

admin_router = APIRouter(prefix="/api/admin")

# Admin credentials - in production, store securely
ADMIN_EMAIL = "streamboss316@gmail.com"
# Pre-generated hash for password: sanaa3030
ADMIN_PASSWORD_HASH = "$2b$12$GBoeQgBEpvKXwkXGKv5dX.nuUuwHb0HGpDj8ozXds0dsHiCCDCgMm"

JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key')
ALGORITHM = "HS256"

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_admin_token(email: str):
    expire = datetime.now(timezone.utc) + timedelta(hours=24)
    to_encode = {"sub": email, "role": "admin", "exp": expire}
    return jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)

async def verify_admin_token(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Admin authentication required")
    
    token = authorization.replace("Bearer ", "")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        if payload.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

class AdminLoginInput(BaseModel):
    email: EmailStr
    password: str

class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str

class UserUpdateInput(BaseModel):
    balance: Optional[float] = None
    suspended: Optional[bool] = None

class BetUpdateInput(BaseModel):
    status: Optional[str] = None
    winner_id: Optional[str] = None

class PlatformSettings(BaseModel):
    platform_fee_percentage: float
    punk_out_percentage: float = 10.0
    min_bet_amount: float
    max_bet_amount: float
    bank_account_holder: str
    bank_account_number: str
    bank_routing_number: str
    stripe_publishable_key: str
    stripe_secret_key: str

# Get database connection
from server import db

@admin_router.post("/login", response_model=AdminLoginResponse)
async def admin_login(input_data: AdminLoginInput):
    if input_data.email != ADMIN_EMAIL:
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    
    if not verify_password(input_data.password, ADMIN_PASSWORD_HASH):
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    
    access_token = create_admin_token(input_data.email)
    return AdminLoginResponse(access_token=access_token, token_type="bearer")

@admin_router.get("/stats")
async def get_admin_stats(admin: dict = Depends(verify_admin_token)):
    total_users = await db.users.count_documents({})
    total_bets = await db.bets.count_documents({})
    active_bets = await db.bets.count_documents({"status": "active"})
    completed_bets = await db.bets.count_documents({"status": "completed"})
    scheduled_bets = await db.bets.count_documents({"status": "scheduled"})
    punk_out_bets = await db.bets.count_documents({"punk_out_claim_status": {"$ne": None}})
    
    # Calculate total platform revenue
    fees = await db.platform_fees.find({}, {"_id": 0}).to_list(1000)
    total_revenue = sum(fee["amount"] for fee in fees)
    
    # Get total deposits
    deposits = await db.payment_transactions.find(
        {"payment_status": "paid"},
        {"_id": 0}
    ).to_list(1000)
    total_deposits = sum(t["amount"] for t in deposits)
    
    return {
        "total_users": total_users,
        "total_bets": total_bets,
        "active_bets": active_bets,
        "completed_bets": completed_bets,
        "scheduled_bets": scheduled_bets,
        "punk_out_bets": punk_out_bets,
        "total_revenue": total_revenue,
        "total_deposits": total_deposits
    }

@admin_router.get("/users")
async def get_all_users(admin: dict = Depends(verify_admin_token)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return users

@admin_router.get("/users/{user_id}")
async def get_user_details(user_id: str, admin: dict = Depends(verify_admin_token)):
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user's bets
    bets = await db.bets.find({
        "$or": [
            {"creator_id": user_id},
            {"opponent_id": user_id}
        ]
    }, {"_id": 0}).to_list(100)
    
    # Get user's transactions
    transactions = await db.payment_transactions.find(
        {"user_id": user_id},
        {"_id": 0}
    ).to_list(100)
    
    return {
        "user": user,
        "bets": bets,
        "transactions": transactions
    }

@admin_router.put("/users/{user_id}")
async def update_user(user_id: str, update_data: UserUpdateInput, admin: dict = Depends(verify_admin_token)):
    update_fields = {}
    if update_data.balance is not None:
        update_fields["balance"] = update_data.balance
    if update_data.suspended is not None:
        update_fields["suspended"] = update_data.suspended
    
    if update_fields:
        result = await db.users.update_one(
            {"user_id": user_id},
            {"$set": update_fields}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
    
    return {"success": True}

@admin_router.delete("/users/{user_id}")
async def delete_user(user_id: str, admin: dict = Depends(verify_admin_token)):
    result = await db.users.delete_one({"user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"success": True}

@admin_router.get("/bets")
async def get_all_bets(status: Optional[str] = None, admin: dict = Depends(verify_admin_token)):
    query = {}
    if status:
        query["status"] = status
    
    bets = await db.bets.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    # Get user details for each bet
    user_ids = set()
    for bet in bets:
        user_ids.add(bet["creator_id"])
        user_ids.add(bet["opponent_id"])
        if bet.get("dp_id"):
            user_ids.add(bet["dp_id"])
    
    users = await db.users.find(
        {"user_id": {"$in": list(user_ids)}},
        {"_id": 0, "password_hash": 0}
    ).to_list(1000)
    user_map = {u["user_id"]: u for u in users}
    
    for bet in bets:
        bet["creator"] = user_map.get(bet["creator_id"], {})
        bet["opponent"] = user_map.get(bet["opponent_id"], {})
        bet["dp"] = user_map.get(bet["dp_id"]) if bet.get("dp_id") else None
    
    return bets

@admin_router.put("/bets/{bet_id}")
async def update_bet(bet_id: str, update_data: BetUpdateInput, admin: dict = Depends(verify_admin_token)):
    update_fields = {}
    if update_data.status:
        update_fields["status"] = update_data.status
    if update_data.winner_id:
        update_fields["winner_id"] = update_data.winner_id
    
    if update_fields:
        update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()
        result = await db.bets.update_one(
            {"bet_id": bet_id},
            {"$set": update_fields}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Bet not found")
    
    return {"success": True}

@admin_router.delete("/bets/{bet_id}")
async def cancel_bet(bet_id: str, admin: dict = Depends(verify_admin_token)):
    result = await db.bets.delete_one({"bet_id": bet_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bet not found")
    return {"success": True}

@admin_router.get("/revenue")
async def get_revenue_stats(admin: dict = Depends(verify_admin_token)):
    fees = await db.platform_fees.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    total_revenue = sum(fee["amount"] for fee in fees)
    
    # Group by date
    daily_revenue = {}
    for fee in fees:
        date = fee["created_at"][:10]
        if date not in daily_revenue:
            daily_revenue[date] = 0
        daily_revenue[date] += fee["amount"]
    
    return {
        "total_revenue": total_revenue,
        "fees": fees,
        "daily_revenue": daily_revenue
    }

@admin_router.get("/transactions")
async def get_all_transactions(admin: dict = Depends(verify_admin_token)):
    transactions = await db.payment_transactions.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    return transactions

@admin_router.get("/settings")
async def get_platform_settings(admin: dict = Depends(verify_admin_token)):
    settings = await db.platform_settings.find_one({}, {"_id": 0})
    if not settings:
        # Return default settings
        return {
            "platform_fee_percentage": 3.0,
            "punk_out_percentage": 10.0,
            "min_bet_amount": 10.0,
            "max_bet_amount": 100000.0,
            "bank_account_holder": "",
            "bank_account_number": "",
            "bank_routing_number": "",
            "stripe_publishable_key": "",
            "stripe_secret_key": "sk_test_emergent"
        }
    return settings

@admin_router.put("/settings")
async def update_platform_settings(settings: PlatformSettings, admin: dict = Depends(verify_admin_token)):
    await db.platform_settings.delete_many({})
    await db.platform_settings.insert_one(settings.model_dump())
    return {"success": True, "message": "Platform settings updated"}

# Legal Content Management
@admin_router.get("/legal-content")
async def get_legal_content(admin: dict = Depends(verify_admin_token)):
    """Get legal content (Privacy, Terms, Contact)"""
    content = await db.legal_content.find_one({}, {"_id": 0})
    return content or {}

@admin_router.put("/legal-content")
async def update_legal_content(content: dict, admin: dict = Depends(verify_admin_token)):
    """Update legal content"""
    await db.legal_content.delete_many({})
    await db.legal_content.insert_one(content)
    return {"success": True, "message": "Legal content updated"}

# Admin settle quick bet dispute
@admin_router.put("/quick-bets/{bet_id}/settle")
async def admin_settle_quick_bet(bet_id: str, winner_id: str, admin: dict = Depends(verify_admin_token)):
    """Admin settles disputed quick bet"""
    bet = await db.bets.find_one({"bet_id": bet_id, "bet_type": "quick"}, {"_id": 0})
    if not bet:
        raise HTTPException(status_code=404, detail="Quick bet not found")
    
    if bet["status"] != "disputed":
        raise HTTPException(status_code=400, detail="Bet is not disputed")
    
    if winner_id not in [bet["creator_id"], bet["opponent_id"]]:
        raise HTTPException(status_code=400, detail="Invalid winner")
    
    # Settle the bet
    total_pool = bet["amount"] * 2
    platform_fee = total_pool * 0.03
    winner_payout = total_pool - platform_fee
    
    # Pay winner
    await db.users.update_one(
        {"user_id": winner_id},
        {"$inc": {"balance": winner_payout, "win_count": 1}}
    )
    
    # Record loser
    loser_id = bet["opponent_id"] if winner_id == bet["creator_id"] else bet["creator_id"]
    await db.users.update_one(
        {"user_id": loser_id},
        {"$inc": {"loss_count": 1}}
    )
    
    # Record transaction
    import uuid
    await db.transactions.insert_one({
        "transaction_id": str(uuid.uuid4()),
        "user_id": winner_id,
        "type": "quick_bet_won_admin",
        "amount": winner_payout,
        "description": f"Quick bet won (Admin settled)",
        "bet_id": bet_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Record platform fee
    await db.platform_fees.insert_one({
        "fee_id": str(uuid.uuid4()),
        "bet_id": bet_id,
        "amount": platform_fee,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Update bet
    await db.bets.update_one(
        {"bet_id": bet_id},
        {"$set": {
            "status": "completed",
            "winner_id": winner_id,
            "winner_payout": winner_payout,
            "platform_fee": platform_fee,
            "settled_by_admin": True,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Notify both parties
    winner = await db.users.find_one({"user_id": winner_id}, {"_id": 0, "name": 1})
    for user_id in [bet["creator_id"], bet["opponent_id"]]:
        notif_doc = {
            "notification_id": str(uuid.uuid4()),
            "user_id": user_id,
            "type": "quick_bet_settled",
            "content": f"Admin settled your quick bet. {winner.get('name', 'Winner')} wins ${winner_payout:.2f}!",
            "bet_id": bet_id,
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.notifications.insert_one(notif_doc)
    
    return {"success": True, "winner_id": winner_id, "payout": winner_payout}

# Get disputed quick bets for admin
@admin_router.get("/quick-bets/disputed")
async def get_disputed_quick_bets(admin: dict = Depends(verify_admin_token)):
    """Get all disputed quick bets that need admin settlement"""
    bets = await db.bets.find(
        {"bet_type": "quick", "status": "disputed"},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Get user info
    user_ids = set()
    for bet in bets:
        user_ids.add(bet["creator_id"])
        user_ids.add(bet["opponent_id"])
    
    users = await db.users.find(
        {"user_id": {"$in": list(user_ids)}},
        {"_id": 0, "password_hash": 0}
    ).to_list(100)
    user_map = {u["user_id"]: u for u in users}
    
    result = []
    for bet in bets:
        bet["creator"] = user_map.get(bet["creator_id"], {})
        bet["opponent"] = user_map.get(bet["opponent_id"], {})
        result.append(bet)
    
    return result


@admin_router.post("/demo/reset")
async def reset_demo_data(admin: dict = Depends(verify_admin_token)):
    """Reset and repopulate demo data with sample users, bets, and interactions"""
    import uuid
    
    # Clear existing demo data (keep admin)
    await db.bets.delete_many({})
    await db.messages.delete_many({})
    await db.chat_messages.delete_many({})
    await db.notifications.delete_many({})
    await db.friendships.delete_many({})
    await db.reviews.delete_many({})
    await db.gallery_photos.delete_many({})
    
    # Delete all users except the ones we'll recreate
    await db.users.delete_many({})
    
    # Helper function for password hashing
    import bcrypt
    def hash_password(password: str) -> str:
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    def generate_betz_id() -> str:
        return f"BETZ{str(uuid.uuid4())[:8].upper()}"
    
    # Create demo users
    demo_users = [
        {
            "user_id": str(uuid.uuid4()),
            "email": "demo@betz.com",
            "phone": "+1234567890",
            "password_hash": hash_password("demo123"),
            "betz_id": generate_betz_id(),
            "name": "Demo Racer",
            "display_name": "DemoKing",
            "avatar": None,
            "balance": 5000.0,
            "win_count": 15,
            "loss_count": 5,
            "win_streak": 3,
            "trust_score": 85,
            "review_count": 10,
            "racing_team": "Demo Racing Team",
            "bio": "Professional street racer with 10+ years experience. Love high-stakes racing!",
            "location": "Los Angeles, CA",
            "car_make": "Nissan",
            "car_model": "GT-R",
            "car_year": "2023",
            "car_mods": "Twin turbo, custom exhaust, racing suspension, Stage 3 tune",
            "instagram": "@demoracer",
            "youtube": "@DemoRacing",
            "privacy_settings": {
                "profile_public": True,
                "show_gallery_preview": True,
                "show_contact": True,
                "show_location": True,
                "allow_bet_requests": True
            },
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_active": datetime.now(timezone.utc).isoformat()
        },
        {
            "user_id": str(uuid.uuid4()),
            "email": "test@betz.com",
            "phone": "+0987654321",
            "password_hash": hash_password("test123"),
            "betz_id": generate_betz_id(),
            "name": "Test Driver",
            "display_name": "TurboTest",
            "avatar": None,
            "balance": 3000.0,
            "win_count": 8,
            "loss_count": 7,
            "win_streak": 1,
            "trust_score": 72,
            "review_count": 5,
            "racing_team": "Test Racing Crew",
            "bio": "Weekend warrior. Love the thrill of street racing!",
            "location": "Miami, FL",
            "car_make": "Toyota",
            "car_model": "Supra",
            "car_year": "2021",
            "car_mods": "Stage 2 tune, lowered coilovers, cold air intake",
            "instagram": "@testdriver",
            "youtube": "@TestRacing",
            "privacy_settings": {
                "profile_public": False,
                "show_gallery_preview": False,
                "show_contact": False,
                "show_location": False,
                "allow_bet_requests": True
            },
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_active": datetime.now(timezone.utc).isoformat()
        },
        {
            "user_id": str(uuid.uuid4()),
            "email": "speed@betz.com",
            "phone": "+1122334455",
            "password_hash": hash_password("speed123"),
            "betz_id": generate_betz_id(),
            "name": "Speed Master",
            "display_name": "SpeedDemon",
            "avatar": None,
            "balance": 7500.0,
            "win_count": 22,
            "loss_count": 3,
            "win_streak": 5,
            "trust_score": 95,
            "review_count": 18,
            "racing_team": "Elite Speed Squad",
            "bio": "Undefeated in last 5 races. Come challenge me if you dare!",
            "location": "Las Vegas, NV",
            "car_make": "Lamborghini",
            "car_model": "Huracán",
            "car_year": "2024",
            "car_mods": "Supercharged, carbon fiber body, custom ECU",
            "instagram": "@speedmaster_lv",
            "youtube": "@SpeedMasterRacing",
            "privacy_settings": {
                "profile_public": True,
                "show_gallery_preview": True,
                "show_contact": True,
                "show_location": True,
                "allow_bet_requests": True
            },
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_active": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    # Insert demo users
    await db.users.insert_many(demo_users)
    
    # Create friendships between demo users
    demo_user_ids = [u["user_id"] for u in demo_users]
    for i, user_id in enumerate(demo_user_ids):
        for other_id in demo_user_ids[i+1:]:
            friendship_doc = {
                "friendship_id": str(uuid.uuid4()),
                "user_id": user_id,
                "friend_id": other_id,
                "status": "accepted",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.friendships.insert_one(friendship_doc)
    
    # Create sample bets
    sample_bets = [
        {
            "bet_id": str(uuid.uuid4()),
            "creator_id": demo_users[0]["user_id"],
            "opponent_id": demo_users[1]["user_id"],
            "amount": 500.0,
            "status": "active",
            "stipulation": "Quarter mile drag race on Sunset Blvd",
            "punk_out_amount": 100.0,
            "dp_id": demo_users[2]["user_id"],
            "dp_status": "accepted",
            "winner_id": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "bet_id": str(uuid.uuid4()),
            "creator_id": demo_users[1]["user_id"],
            "opponent_id": demo_users[2]["user_id"],
            "amount": 1000.0,
            "status": "pending",
            "stipulation": "Highway 101 race, first to finish line wins",
            "punk_out_amount": 200.0,
            "dp_id": None,
            "dp_status": None,
            "winner_id": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.bets.insert_many(sample_bets)
    
    # Create sample notifications
    notifications = [
        {
            "notification_id": str(uuid.uuid4()),
            "user_id": demo_users[1]["user_id"],
            "type": "bet_request",
            "content": f"{demo_users[0]['name']} wants to bet $500 with you",
            "bet_id": sample_bets[0]["bet_id"],
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "notification_id": str(uuid.uuid4()),
            "user_id": demo_users[2]["user_id"],
            "type": "bet_request",
            "content": f"{demo_users[1]['name']} wants to bet $1,000 with you",
            "bet_id": sample_bets[1]["bet_id"],
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.notifications.insert_many(notifications)
    
    # Create sample chat messages
    chat_messages = [
        {
            "message_id": str(uuid.uuid4()),
            "content": f"Welcome to BETZ! {demo_users[0]['name']} just joined.",
            "sender_id": demo_users[0]["user_id"],
            "sender_name": demo_users[0]["name"],
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "message_id": str(uuid.uuid4()),
            "content": "Who wants to race tonight? I'm feeling lucky!",
            "sender_id": demo_users[2]["user_id"],
            "sender_name": demo_users[2]["name"],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.chat_messages.insert_many(chat_messages)
    
    return {
        "success": True,
        "message": "Demo data reset successfully",
        "users_created": len(demo_users),
        "bets_created": len(sample_bets),
        "friendships_created": len(demo_user_ids) * (len(demo_user_ids) - 1) // 2
    }
