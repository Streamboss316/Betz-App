#!/usr/bin/env python3
"""Seed demo users for BETZ app"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import uuid
from datetime import datetime, timezone
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def generate_betz_id() -> str:
    return f"BETZ{str(uuid.uuid4())[:8].upper()}"

async def seed_demo_users():
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Check if demo user exists
    existing_demo = await db.users.find_one({"email": "demo@betz.com"})
    if existing_demo:
        print("Demo user already exists")
    else:
        demo_user = {
            "user_id": str(uuid.uuid4()),
            "email": "demo@betz.com",
            "phone": "+1234567890",
            "password_hash": hash_password("demo123"),
            "betz_id": generate_betz_id(),
            "name": "Demo User",
            "display_name": "DemoRacer",
            "avatar": None,
            "balance": 5000.0,
            "win_count": 15,
            "loss_count": 5,
            "trust_score": 85,
            "review_count": 10,
            "racing_team": "Demo Racing Team",
            "bio": "Professional street racer with 10+ years experience",
            "location": "Los Angeles, CA",
            "car_make": "Nissan",
            "car_model": "GT-R",
            "car_year": "2023",
            "car_mods": "Twin turbo, custom exhaust, racing suspension",
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
        }
        await db.users.insert_one(demo_user)
        print(f"✅ Created demo user: {demo_user['email']} / demo123")
    
    # Check if test user exists
    existing_test = await db.users.find_one({"email": "test@betz.com"})
    if existing_test:
        print("Test user already exists")
    else:
        test_user = {
            "user_id": str(uuid.uuid4()),
            "email": "test@betz.com",
            "phone": "+0987654321",
            "password_hash": hash_password("test123"),
            "betz_id": generate_betz_id(),
            "name": "Test User",
            "display_name": "TestDriver",
            "avatar": None,
            "balance": 3000.0,
            "win_count": 8,
            "loss_count": 7,
            "trust_score": 72,
            "review_count": 5,
            "racing_team": "Test Racing Crew",
            "bio": "Weekend warrior, love high-stakes racing",
            "location": "Miami, FL",
            "car_make": "Toyota",
            "car_model": "Supra",
            "car_year": "2021",
            "car_mods": "Stage 2 tune, lowered coilovers",
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
        }
        await db.users.insert_one(test_user)
        print(f"✅ Created test user: {test_user['email']} / test123")
    
    client.close()
    print("\n🎉 Demo users seeded successfully!")
    print("\nLogin credentials:")
    print("  demo@betz.com / demo123")
    print("  test@betz.com / test123")

if __name__ == "__main__":
    asyncio.run(seed_demo_users())
