from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
SECRET_KEY = JWT_SECRET
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 43200

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

@api_router.get("/")
async def root():
    return {"message": "BETZ API - High Stakes Racing Bets"}

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    phone: str
    betz_id: str
    name: str
    avatar: Optional[str] = None
    balance: float = 0.0
    win_count: int = 0
    loss_count: int = 0
    privacy_settings: dict = {"profile_public": True, "activity_public": True}
    created_at: str

class RegisterInput(BaseModel):
    email: EmailStr
    phone: str
    password: str
    name: str

class LoginInput(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: User

class Bet(BaseModel):
    model_config = ConfigDict(extra="ignore")
    bet_id: str
    creator_id: str
    opponent_id: str
    amount: float
    status: str
    stipulation: str = ""
    punk_out_amount: float = 0.0
    dp_id: Optional[str] = None
    winner_id: Optional[str] = None
    created_at: str
    updated_at: str

class CreateBetInput(BaseModel):
    opponent_id: str
    amount: float

class Message(BaseModel):
    model_config = ConfigDict(extra="ignore")
    message_id: str
    sender_id: str
    receiver_id: str
    content: str
    created_at: str

class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    notification_id: str
    user_id: str
    type: str
    content: str
    bet_id: Optional[str] = None
    read: bool = False
    created_at: str

class ReviewInput(BaseModel):
    bet_id: str
    reviewed_user_id: str
    ratings: List[int]  # Array of 4 ratings (1-4)

class Review(BaseModel):
    model_config = ConfigDict(extra="ignore")
    review_id: str
    bet_id: str
    reviewer_id: str
    reviewed_user_id: str
    ratings: List[int]
    overall_percentage: int
    created_at: str

class ReviewQuestion(BaseModel):
    model_config = ConfigDict(extra="ignore")
    question_id: str
    text: str
    order: int

@api_router.post("/bets/{bet_id}/review")
async def submit_review(bet_id: str, input_data: ReviewInput, current_user: dict = Depends(get_current_user)):
    bet = await db.bets.find_one({"bet_id": bet_id}, {"_id": 0})
    if not bet or bet["status"] != "completed":
        raise HTTPException(status_code=400, detail="Can only review completed bets")
    
    if current_user["user_id"] not in [bet["creator_id"], bet["opponent_id"]]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if already reviewed
    existing = await db.reviews.find_one({
        "bet_id": bet_id,
        "reviewer_id": current_user["user_id"]
    })
    if existing:
        raise HTTPException(status_code=400, detail="Already reviewed this user")
    
    # Calculate overall percentage (average of 4 ratings, each 1-4 becomes 25%-100%)
    ratings = input_data.ratings[:4]  # Ensure max 4 ratings
    avg_rating = sum(ratings) / len(ratings)
    overall_percentage = int((avg_rating / 4) * 100)
    
    review_doc = {
        "review_id": str(uuid.uuid4()),
        "bet_id": bet_id,
        "reviewer_id": current_user["user_id"],
        "reviewed_user_id": input_data.reviewed_user_id,
        "ratings": ratings,
        "overall_percentage": overall_percentage,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.reviews.insert_one(review_doc)
    
    # Update user's trust score
    all_reviews = await db.reviews.find(
        {"reviewed_user_id": input_data.reviewed_user_id},
        {"_id": 0}
    ).to_list(1000)
    
    if all_reviews:
        avg_trust_score = sum(r["overall_percentage"] for r in all_reviews) / len(all_reviews)
        await db.users.update_one(
            {"user_id": input_data.reviewed_user_id},
            {"$set": {"trust_score": round(avg_trust_score), "review_count": len(all_reviews)}}
        )
    
    return {"success": True, "overall_percentage": overall_percentage}

@api_router.get("/users/{user_id}/reviews")
async def get_user_reviews(user_id: str):
    reviews = await db.reviews.find(
        {"reviewed_user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Get reviewer info
    reviewer_ids = [r["reviewer_id"] for r in reviews]
    users = await db.users.find(
        {"user_id": {"$in": reviewer_ids}},
        {"_id": 0, "password_hash": 0}
    ).to_list(100)
    user_map = {u["user_id"]: u for u in users}
    
    for review in reviews:
        review["reviewer"] = user_map.get(review["reviewer_id"], {})
    
    return reviews

@api_router.get("/review-questions")
async def get_review_questions():
    questions = await db.review_questions.find({}, {"_id": 0}).sort("order", 1).to_list(10)
    
    # Default questions if none exist
    if not questions:
        default_questions = [
            {"question_id": "q1", "text": "Was this person fair and honest?", "order": 1},
            {"question_id": "q2", "text": "Did they agree with the outcome gracefully?", "order": 2},
            {"question_id": "q3", "text": "Were they trustworthy throughout?", "order": 3},
            {"question_id": "q4", "text": "Would you bet with them again?", "order": 4}
        ]
        await db.review_questions.insert_many(default_questions)
        return default_questions
    
    return questions

class Friendship(BaseModel):
    model_config = ConfigDict(extra="ignore")
    friendship_id: str
    user_id: str
    friend_id: str
    status: str
    created_at: str

def generate_betz_id() -> str:
    return f"BETZ{str(uuid.uuid4())[:8].upper()}"

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication")
        user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(input_data: RegisterInput):
    existing = await db.users.find_one({"email": input_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    betz_id = generate_betz_id()
    hashed_pw = hash_password(input_data.password)
    
    user_doc = {
        "user_id": user_id,
        "email": input_data.email,
        "phone": input_data.phone,
        "password_hash": hashed_pw,
        "betz_id": betz_id,
        "name": input_data.name,
        "avatar": None,
        "balance": 0.0,
        "win_count": 0,
        "loss_count": 0,
        "privacy_settings": {"profile_public": True, "activity_public": True},
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    user_doc.pop("password_hash")
    user = User(**user_doc)
    access_token = create_access_token({"sub": user_id})
    
    return TokenResponse(access_token=access_token, token_type="bearer", user=user)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(input_data: LoginInput):
    user_doc = await db.users.find_one({"email": input_data.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(input_data.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_doc.pop("password_hash")
    user = User(**user_doc)
    access_token = create_access_token({"sub": user.user_id})
    
    return TokenResponse(access_token=access_token, token_type="bearer", user=user)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    return User(**current_user)

class ForgotPasswordInput(BaseModel):
    email: EmailStr

class ResetPasswordInput(BaseModel):
    email: EmailStr
    betz_id: str
    new_password: str

@api_router.post("/auth/forgot-password")
async def forgot_password(input_data: ForgotPasswordInput):
    user = await db.users.find_one({"email": input_data.email}, {"_id": 0})
    if not user:
        # Don't reveal if email exists for security
        return {"success": True, "message": "If this email exists, you'll receive recovery instructions"}
    
    # In production, send email with reset link
    # For demo, just return success
    return {
        "success": True,
        "message": "Recovery information sent. Use your Betz ID to reset password",
        "betz_id_hint": user["betz_id"][:4] + "****"
    }

@api_router.post("/auth/reset-password")
async def reset_password(input_data: ResetPasswordInput):
    user = await db.users.find_one({
        "email": input_data.email,
        "betz_id": input_data.betz_id
    }, {"_id": 0})
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid email or Betz ID")
    
    hashed_pw = hash_password(input_data.new_password)
    await db.users.update_one(
        {"email": input_data.email},
        {"$set": {"password_hash": hashed_pw}}
    )
    
    return {"success": True, "message": "Password reset successfully"}

@api_router.get("/users/profile", response_model=User)
async def get_profile(current_user: dict = Depends(get_current_user)):
    return User(**current_user)

@api_router.get("/users/{user_id}/profile")
async def get_user_public_profile(user_id: str, current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if users are friends
    friendship = await db.friendships.find_one({
        "$or": [
            {"user_id": current_user["user_id"], "friend_id": user_id, "status": "accepted"},
            {"user_id": user_id, "friend_id": current_user["user_id"], "status": "accepted"}
        ]
    })
    
    are_friends = friendship is not None
    privacy_settings = user.get("privacy_settings", {"profile_public": True, "activity_public": True})
    
    # If profile is private and not friends, return limited info
    if not privacy_settings.get("profile_public", True) and not are_friends:
        return {
            "user_id": user["user_id"],
            "name": user["name"],
            "betz_id": user["betz_id"],
            "avatar": user.get("avatar"),
            "privacy_settings": privacy_settings,
            "is_private": True,
            "are_friends": False
        }
    
    # Get gallery if activity is public or are friends
    gallery = []
    if privacy_settings.get("activity_public", True) or are_friends:
        gallery = await db.gallery.find(
            {"user_id": user_id},
            {"_id": 0}
        ).sort("created_at", -1).limit(20).to_list(20)
    
    return {
        **user,
        "are_friends": are_friends,
        "is_private": False,
        "gallery": gallery
    }

class ProfileUpdateInput(BaseModel):
    name: Optional[str] = None
    avatar: Optional[str] = None

@api_router.put("/users/profile", response_model=User)
async def update_profile(input_data: ProfileUpdateInput, current_user: dict = Depends(get_current_user)):
    update_data = {}
    if input_data.name:
        update_data["name"] = input_data.name
    if input_data.avatar:
        update_data["avatar"] = input_data.avatar
    
    if update_data:
        await db.users.update_one({"user_id": current_user["user_id"]}, {"$set": update_data})
        updated_user = await db.users.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
        return User(**updated_user)
    
    return User(**current_user)

class GalleryItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    item_id: str
    user_id: str
    type: str  # 'image' or 'video'
    data: str  # base64 encoded
    thumbnail: Optional[str] = None
    created_at: str

class UploadMediaInput(BaseModel):
    type: str  # 'image' or 'video'
    data: str  # base64 encoded
    thumbnail: Optional[str] = None

@api_router.post("/users/gallery/upload")
async def upload_media(input_data: UploadMediaInput, current_user: dict = Depends(get_current_user)):
    # Validate file type from base64 header
    allowed_image_types = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/heic"]
    allowed_video_types = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm", "video/mpeg"]
    
    # Extract MIME type from base64 data URL
    if input_data.data.startswith("data:"):
        mime_type = input_data.data.split(";")[0].split(":")[1]
    else:
        raise HTTPException(status_code=400, detail="Invalid file format")
    
    # Validate file type
    if input_data.type == "image" and mime_type not in allowed_image_types:
        raise HTTPException(status_code=400, detail=f"Image type not allowed. Allowed: JPEG, PNG, GIF, WebP, HEIC")
    if input_data.type == "video" and mime_type not in allowed_video_types:
        raise HTTPException(status_code=400, detail=f"Video type not allowed. Allowed: MP4, MOV, AVI, WebM, MPEG")
    
    # Check file size (limit to 10MB for images, 50MB for videos)
    import sys
    data_size = sys.getsizeof(input_data.data)
    
    if input_data.type == "image" and data_size > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large (max 10MB)")
    if input_data.type == "video" and data_size > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Video too large (max 50MB)")
    
    gallery_item = {
        "item_id": str(uuid.uuid4()),
        "user_id": current_user["user_id"],
        "type": input_data.type,
        "data": input_data.data,
        "thumbnail": input_data.thumbnail,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.gallery.insert_one(gallery_item)
    return {"success": True, "item_id": gallery_item["item_id"]}

@api_router.get("/users/gallery")
async def get_gallery(user_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    target_user_id = user_id if user_id else current_user["user_id"]
    
    items = await db.gallery.find(
        {"user_id": target_user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return items

@api_router.delete("/users/gallery/{item_id}")
async def delete_gallery_item(item_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.gallery.delete_one({
        "item_id": item_id,
        "user_id": current_user["user_id"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Gallery item not found")
    
    return {"success": True}

@api_router.get("/users/search")
async def search_users(query: str, current_user: dict = Depends(get_current_user)):
    users = await db.users.find({
        "$or": [
            {"betz_id": {"$regex": query, "$options": "i"}},
            {"phone": {"$regex": query, "$options": "i"}},
            {"name": {"$regex": query, "$options": "i"}}
        ],
        "user_id": {"$ne": current_user["user_id"]}
    }, {"_id": 0, "password_hash": 0}).limit(20).to_list(20)
    
    return users

@api_router.put("/users/privacy")
async def update_privacy(profile_public: bool, activity_public: bool, current_user: dict = Depends(get_current_user)):
    await db.users.update_one(
        {"user_id": current_user["user_id"]},
        {"$set": {"privacy_settings": {"profile_public": profile_public, "activity_public": activity_public}}}
    )
    return {"success": True}

@api_router.post("/friends/request")
async def send_friend_request(friend_id: str, current_user: dict = Depends(get_current_user)):
    existing = await db.friendships.find_one({
        "$or": [
            {"user_id": current_user["user_id"], "friend_id": friend_id},
            {"user_id": friend_id, "friend_id": current_user["user_id"]}
        ]
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Friendship already exists")
    
    friendship_doc = {
        "friendship_id": str(uuid.uuid4()),
        "user_id": current_user["user_id"],
        "friend_id": friend_id,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.friendships.insert_one(friendship_doc)
    
    notif_doc = {
        "notification_id": str(uuid.uuid4()),
        "user_id": friend_id,
        "type": "friend_request",
        "content": f"{current_user['name']} sent you a friend request",
        "bet_id": None,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notif_doc)
    
    return {"success": True}

@api_router.get("/friends")
async def get_friends(current_user: dict = Depends(get_current_user)):
    friendships = await db.friendships.find({
        "$or": [
            {"user_id": current_user["user_id"], "status": "accepted"},
            {"friend_id": current_user["user_id"], "status": "accepted"}
        ]
    }, {"_id": 0}).to_list(100)
    
    friend_ids = []
    for f in friendships:
        if f["user_id"] == current_user["user_id"]:
            friend_ids.append(f["friend_id"])
        else:
            friend_ids.append(f["user_id"])
    
    friends = await db.users.find({"user_id": {"$in": friend_ids}}, {"_id": 0, "password_hash": 0}).to_list(100)
    return friends

@api_router.get("/friends/requests")
async def get_friend_requests(current_user: dict = Depends(get_current_user)):
    requests = await db.friendships.find({
        "friend_id": current_user["user_id"],
        "status": "pending"
    }, {"_id": 0}).to_list(50)
    
    user_ids = [r["user_id"] for r in requests]
    users = await db.users.find({"user_id": {"$in": user_ids}}, {"_id": 0, "password_hash": 0}).to_list(50)
    
    user_map = {u["user_id"]: u for u in users}
    
    result = []
    for r in requests:
        if r["user_id"] in user_map:
            result.append({"friendship": r, "user": user_map[r["user_id"]]})
    
    return result

@api_router.put("/friends/{friend_id}/accept")
async def accept_friend_request(friend_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.friendships.update_one(
        {"user_id": friend_id, "friend_id": current_user["user_id"], "status": "pending"},
        {"$set": {"status": "accepted"}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Friend request not found")
    
    return {"success": True}

@api_router.put("/friends/{friend_id}/reject")
async def reject_friend_request(friend_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.friendships.update_one(
        {"user_id": friend_id, "friend_id": current_user["user_id"], "status": "pending"},
        {"$set": {"status": "rejected"}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Friend request not found")
    
    return {"success": True}

@api_router.delete("/friends/{friend_id}")
async def remove_friend(friend_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.friendships.delete_one({
        "$or": [
            {"user_id": current_user["user_id"], "friend_id": friend_id},
            {"user_id": friend_id, "friend_id": current_user["user_id"]}
        ]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Friendship not found")
    
    return {"success": True}

@api_router.post("/bets/create", response_model=Bet)
async def create_bet(input_data: CreateBetInput, current_user: dict = Depends(get_current_user)):
    if current_user["balance"] < input_data.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")
    
    bet_id = str(uuid.uuid4())
    bet_doc = {
        "bet_id": bet_id,
        "creator_id": current_user["user_id"],
        "opponent_id": input_data.opponent_id,
        "amount": input_data.amount,
        "status": "pending",
        "stipulation": "",
        "punk_out_amount": 0.0,
        "dp_id": None,
        "winner_id": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.bets.insert_one(bet_doc)
    
    notif_doc = {
        "notification_id": str(uuid.uuid4()),
        "user_id": input_data.opponent_id,
        "type": "bet_request",
        "content": f"{current_user['name']} wants to bet ${input_data.amount:.2f} with you",
        "bet_id": bet_id,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notif_doc)
    
    return Bet(**bet_doc)

@api_router.get("/bets")
async def get_bets(status: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {
        "$or": [
            {"creator_id": current_user["user_id"]},
            {"opponent_id": current_user["user_id"]},
            {"dp_id": current_user["user_id"]}
        ]
    }
    
    if status:
        query["status"] = status
    
    bets = await db.bets.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    user_ids = set()
    for bet in bets:
        user_ids.add(bet["creator_id"])
        user_ids.add(bet["opponent_id"])
        if bet.get("dp_id"):
            user_ids.add(bet["dp_id"])
    
    users = await db.users.find({"user_id": {"$in": list(user_ids)}}, {"_id": 0, "password_hash": 0}).to_list(100)
    user_map = {u["user_id"]: u for u in users}
    
    result = []
    for bet in bets:
        bet_data = bet.copy()
        bet_data["creator"] = user_map.get(bet["creator_id"], {})
        bet_data["opponent"] = user_map.get(bet["opponent_id"], {})
        bet_data["dp"] = user_map.get(bet["dp_id"]) if bet.get("dp_id") else None
        result.append(bet_data)
    
    return result

@api_router.get("/bets/{bet_id}")
async def get_bet(bet_id: str, current_user: dict = Depends(get_current_user)):
    bet = await db.bets.find_one({"bet_id": bet_id}, {"_id": 0})
    if not bet:
        raise HTTPException(status_code=404, detail="Bet not found")
    
    user_ids = [bet["creator_id"], bet["opponent_id"]]
    if bet.get("dp_id"):
        user_ids.append(bet["dp_id"])
    
    users = await db.users.find({"user_id": {"$in": user_ids}}, {"_id": 0, "password_hash": 0}).to_list(10)
    user_map = {u["user_id"]: u for u in users}
    
    bet["creator"] = user_map.get(bet["creator_id"], {})
    bet["opponent"] = user_map.get(bet["opponent_id"], {})
    bet["dp"] = user_map.get(bet["dp_id"]) if bet.get("dp_id") else None
    
    return bet

@api_router.put("/bets/{bet_id}/accept")
async def accept_bet(bet_id: str, current_user: dict = Depends(get_current_user)):
    bet = await db.bets.find_one({"bet_id": bet_id}, {"_id": 0})
    if not bet:
        raise HTTPException(status_code=404, detail="Bet not found")
    
    if bet["opponent_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Only opponent can accept")
    
    if bet["status"] != "pending":
        raise HTTPException(status_code=400, detail="Bet is not pending")
    
    if current_user["balance"] < bet["amount"]:
        raise HTTPException(status_code=400, detail="Insufficient balance")
    
    # If bet is $1000 or less, go straight to active (no DP needed)
    # If bet is greater than $1000, status = accepted (DP required)
    new_status = "active" if bet["amount"] <= 1000 else "accepted"
    
    await db.bets.update_one(
        {"bet_id": bet_id},
        {"$set": {"status": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"success": True, "requires_dp": bet["amount"] > 1000}

@api_router.put("/bets/{bet_id}/reject")
async def reject_bet(bet_id: str, current_user: dict = Depends(get_current_user)):
    bet = await db.bets.find_one({"bet_id": bet_id}, {"_id": 0})
    if not bet:
        raise HTTPException(status_code=404, detail="Bet not found")
    
    if bet["opponent_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Only opponent can reject")
    
    await db.bets.update_one(
        {"bet_id": bet_id},
        {"$set": {"status": "rejected", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"success": True}

@api_router.put("/bets/{bet_id}/stipulation")
async def update_stipulation(bet_id: str, stipulation: str, current_user: dict = Depends(get_current_user)):
    bet = await db.bets.find_one({"bet_id": bet_id}, {"_id": 0})
    if not bet:
        raise HTTPException(status_code=404, detail="Bet not found")
    
    if bet["creator_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Only creator can update stipulation")
    
    await db.bets.update_one(
        {"bet_id": bet_id},
        {"$set": {"stipulation": stipulation, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"success": True}

@api_router.put("/bets/{bet_id}/punk-out")
async def set_punk_out(bet_id: str, punk_out_amount: float, current_user: dict = Depends(get_current_user)):
    bet = await db.bets.find_one({"bet_id": bet_id}, {"_id": 0})
    if not bet:
        raise HTTPException(status_code=404, detail="Bet not found")
    
    if bet["creator_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Only creator can set punk out")
    
    await db.bets.update_one(
        {"bet_id": bet_id},
        {"$set": {"punk_out_amount": punk_out_amount, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"success": True}

@api_router.put("/bets/{bet_id}/dp")
async def set_dp(bet_id: str, dp_id: str, current_user: dict = Depends(get_current_user)):
    bet = await db.bets.find_one({"bet_id": bet_id}, {"_id": 0})
    if not bet:
        raise HTTPException(status_code=404, detail="Bet not found")
    
    await db.bets.update_one(
        {"bet_id": bet_id},
        {"$set": {"dp_id": dp_id, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    notif_doc = {
        "notification_id": str(uuid.uuid4()),
        "user_id": dp_id,
        "type": "dp_assigned",
        "content": f"You've been selected as DP for a ${bet['amount']:.2f} bet",
        "bet_id": bet_id,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notif_doc)
    
    return {"success": True}

@api_router.put("/bets/{bet_id}/lock")
async def lock_bet(bet_id: str, current_user: dict = Depends(get_current_user)):
    bet = await db.bets.find_one({"bet_id": bet_id}, {"_id": 0})
    if not bet:
        raise HTTPException(status_code=404, detail="Bet not found")
    
    if bet.get("dp_id") != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Only DP can lock bet")
    
    await db.bets.update_one(
        {"bet_id": bet_id},
        {"$set": {"status": "active", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    for user_id in [bet["creator_id"], bet["opponent_id"]]:
        notif_doc = {
            "notification_id": str(uuid.uuid4()),
            "user_id": user_id,
            "type": "bet_locked",
            "content": f"Your bet is now locked and ready to race!",
            "bet_id": bet_id,
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.notifications.insert_one(notif_doc)
    
    return {"success": True}

@api_router.put("/bets/{bet_id}/winner")
async def declare_winner(bet_id: str, winner_id: str, current_user: dict = Depends(get_current_user)):
    bet = await db.bets.find_one({"bet_id": bet_id}, {"_id": 0})
    if not bet:
        raise HTTPException(status_code=404, detail="Bet not found")
    
    if current_user["user_id"] not in [bet["creator_id"], bet["opponent_id"], bet.get("dp_id")]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if bet["status"] == "completed":
        raise HTTPException(status_code=400, detail="Bet already completed")
    
    # Calculate 3% platform fee
    total_pool = bet["amount"] * 2
    platform_fee = total_pool * 0.03
    winner_payout = total_pool - platform_fee
    
    if bet.get("dp_id"):
        if current_user["user_id"] != bet["dp_id"]:
            await db.bets.update_one(
                {"bet_id": bet_id},
                {"$set": {"status": "disputed", "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
            
            notif_doc = {
                "notification_id": str(uuid.uuid4()),
                "user_id": bet["dp_id"],
                "type": "bet_disputed",
                "content": f"A bet requires your mediation",
                "bet_id": bet_id,
                "read": False,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.notifications.insert_one(notif_doc)
            return {"success": True, "status": "disputed"}
        else:
            await db.bets.update_one(
                {"bet_id": bet_id},
                {"$set": {
                    "winner_id": winner_id,
                    "status": "completed",
                    "platform_fee": platform_fee,
                    "winner_payout": winner_payout,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            loser_id = bet["creator_id"] if winner_id == bet["opponent_id"] else bet["opponent_id"]
            
            # Add winner payout (after 3% fee)
            await db.users.update_one(
                {"user_id": winner_id},
                {"$inc": {"balance": winner_payout, "win_count": 1}}
            )
            
            await db.users.update_one(
                {"user_id": loser_id},
                {"$inc": {"loss_count": 1}}
            )
            
            # Track platform fees for accounting
            fee_record = {
                "fee_id": str(uuid.uuid4()),
                "bet_id": bet_id,
                "amount": platform_fee,
                "winner_id": winner_id,
                "loser_id": loser_id,
                "total_pool": total_pool,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.platform_fees.insert_one(fee_record)
            
            return {"success": True, "status": "completed", "platform_fee": platform_fee, "winner_payout": winner_payout}
    else:
        await db.bets.update_one(
            {"bet_id": bet_id},
            {"$set": {
                "winner_id": winner_id,
                "status": "completed",
                "platform_fee": platform_fee,
                "winner_payout": winner_payout,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        loser_id = bet["creator_id"] if winner_id == bet["opponent_id"] else bet["opponent_id"]
        
        # Add winner payout (after 3% fee)
        await db.users.update_one(
            {"user_id": winner_id},
            {"$inc": {"balance": winner_payout, "win_count": 1}}
        )
        
        await db.users.update_one(
            {"user_id": loser_id},
            {"$inc": {"loss_count": 1}}
        )
        
        # Track platform fees for accounting
        fee_record = {
            "fee_id": str(uuid.uuid4()),
            "bet_id": bet_id,
            "amount": platform_fee,
            "winner_id": winner_id,
            "loser_id": loser_id,
            "total_pool": total_pool,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.platform_fees.insert_one(fee_record)
        
        return {"success": True, "status": "completed", "platform_fee": platform_fee, "winner_payout": winner_payout}

@api_router.get("/messages/{other_user_id}")
async def get_messages(other_user_id: str, current_user: dict = Depends(get_current_user)):
    messages = await db.messages.find({
        "$or": [
            {"sender_id": current_user["user_id"], "receiver_id": other_user_id},
            {"sender_id": other_user_id, "receiver_id": current_user["user_id"]}
        ]
    }, {"_id": 0}).sort("created_at", 1).to_list(200)
    
    return messages

@api_router.post("/messages/send")
async def send_message(receiver_id: str, content: str, current_user: dict = Depends(get_current_user)):
    message_doc = {
        "message_id": str(uuid.uuid4()),
        "sender_id": current_user["user_id"],
        "receiver_id": receiver_id,
        "content": content,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.messages.insert_one(message_doc)
    return Message(**message_doc)

@api_router.get("/notifications")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    notifications = await db.notifications.find(
        {"user_id": current_user["user_id"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    
    return notifications

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    await db.notifications.update_one(
        {"notification_id": notification_id, "user_id": current_user["user_id"]},
        {"$set": {"read": True}}
    )
    return {"success": True}

class CheckoutRequest(BaseModel):
    amount: float
    origin_url: str

@api_router.post("/payments/checkout/session")
async def create_checkout_session(request: CheckoutRequest, current_user: dict = Depends(get_current_user)):
    stripe_api_key = os.environ.get('STRIPE_API_KEY')
    host_url = request.origin_url
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    success_url = f"{host_url}/wallet?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{host_url}/wallet"
    
    checkout_request = CheckoutSessionRequest(
        amount=request.amount,
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={"user_id": current_user["user_id"], "type": "deposit"}
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    payment_doc = {
        "session_id": session.session_id,
        "user_id": current_user["user_id"],
        "amount": request.amount,
        "currency": "usd",
        "status": "pending",
        "payment_status": "initiated",
        "metadata": {"type": "deposit"},
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.payment_transactions.insert_one(payment_doc)
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/payments/checkout/status/{session_id}")
async def get_checkout_status(session_id: str, current_user: dict = Depends(get_current_user)):
    stripe_api_key = os.environ.get('STRIPE_API_KEY')
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url="")
    
    status = await stripe_checkout.get_checkout_status(session_id)
    
    existing_payment = await db.payment_transactions.find_one({"session_id": session_id})
    
    if existing_payment and existing_payment.get("payment_status") != "paid":
        if status.payment_status == "paid":
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"status": status.status, "payment_status": status.payment_status}}
            )
            
            amount = status.amount_total / 100.0
            await db.users.update_one(
                {"user_id": current_user["user_id"]},
                {"$inc": {"balance": amount}}
            )
    
    return status

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    stripe_api_key = os.environ.get('STRIPE_API_KEY')
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url="")
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/wallet/balance")
async def get_balance(current_user: dict = Depends(get_current_user)):
    return {"balance": current_user["balance"]}

@api_router.get("/wallet/transactions")
async def get_transactions(current_user: dict = Depends(get_current_user)):
    transactions = await db.payment_transactions.find(
        {"user_id": current_user["user_id"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    
    return transactions

from admin_routes import admin_router

app.include_router(api_router)
app.include_router(admin_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()