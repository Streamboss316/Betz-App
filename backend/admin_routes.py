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
ADMIN_EMAIL = "admin@betz.app"
ADMIN_PASSWORD_HASH = bcrypt.hashpw("admin123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

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
