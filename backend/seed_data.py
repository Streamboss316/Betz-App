import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import uuid
from datetime import datetime, timezone, timedelta
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def generate_betz_id() -> str:
    return f"BETZ{str(uuid.uuid4())[:8].upper()}"

async def seed_database():
    print("🌱 Seeding BETZ database with demo data...")
    
    # Clear existing data
    await db.users.delete_many({})
    await db.friendships.delete_many({})
    await db.bets.delete_many({})
    await db.messages.delete_many({})
    await db.notifications.delete_many({})
    await db.payment_transactions.delete_many({})
    print("✓ Cleared existing data")
    
    # Create demo users
    users_data = [
        {
            "user_id": str(uuid.uuid4()),
            "email": "demo@betz.app",
            "phone": "+1 (555) 100-0001",
            "password_hash": hash_password("demo123"),
            "betz_id": "BETZDEMO1",
            "name": "Demo User",
            "avatar": None,
            "balance": 5000.00,
            "win_count": 12,
            "loss_count": 5,
            "privacy_settings": {"profile_public": True, "activity_public": True},
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "user_id": str(uuid.uuid4()),
            "email": "johnny@betz.app",
            "phone": "+1 (555) 100-0002",
            "password_hash": hash_password("demo123"),
            "betz_id": "BETZRACE1",
            "name": "Johnny Racer",
            "avatar": None,
            "balance": 3500.00,
            "win_count": 8,
            "loss_count": 4,
            "privacy_settings": {"profile_public": True, "activity_public": True},
            "created_at": (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
        },
        {
            "user_id": str(uuid.uuid4()),
            "email": "sarah@betz.app",
            "phone": "+1 (555) 100-0003",
            "password_hash": hash_password("demo123"),
            "betz_id": "BETZSPEED",
            "name": "Sarah Speed",
            "avatar": None,
            "balance": 7200.00,
            "win_count": 15,
            "loss_count": 3,
            "privacy_settings": {"profile_public": True, "activity_public": True},
            "created_at": (datetime.now(timezone.utc) - timedelta(days=45)).isoformat()
        },
        {
            "user_id": str(uuid.uuid4()),
            "email": "mike@betz.app",
            "phone": "+1 (555) 100-0004",
            "password_hash": hash_password("demo123"),
            "betz_id": "BETZTURBO",
            "name": "Mike Turbo",
            "avatar": None,
            "balance": 2800.00,
            "win_count": 6,
            "loss_count": 9,
            "privacy_settings": {"profile_public": True, "activity_public": True},
            "created_at": (datetime.now(timezone.utc) - timedelta(days=20)).isoformat()
        },
        {
            "user_id": str(uuid.uuid4()),
            "email": "alex@betz.app",
            "phone": "+1 (555) 100-0005",
            "password_hash": hash_password("demo123"),
            "betz_id": "BETZNITRO",
            "name": "Alex Nitro",
            "avatar": None,
            "balance": 4100.00,
            "win_count": 10,
            "loss_count": 7,
            "privacy_settings": {"profile_public": True, "activity_public": True},
            "created_at": (datetime.now(timezone.utc) - timedelta(days=60)).isoformat()
        }
    ]
    
    await db.users.insert_many(users_data)
    print(f"✓ Created {len(users_data)} demo users")
    print("  Login credentials: Any email above with password 'demo123'")
    
    demo_user = users_data[0]
    johnny = users_data[1]
    sarah = users_data[2]
    mike = users_data[3]
    alex = users_data[4]
    
    # Create friendships
    friendships_data = [
        {
            "friendship_id": str(uuid.uuid4()),
            "user_id": demo_user["user_id"],
            "friend_id": johnny["user_id"],
            "status": "accepted",
            "created_at": (datetime.now(timezone.utc) - timedelta(days=25)).isoformat()
        },
        {
            "friendship_id": str(uuid.uuid4()),
            "user_id": demo_user["user_id"],
            "friend_id": sarah["user_id"],
            "status": "accepted",
            "created_at": (datetime.now(timezone.utc) - timedelta(days=20)).isoformat()
        },
        {
            "friendship_id": str(uuid.uuid4()),
            "user_id": demo_user["user_id"],
            "friend_id": mike["user_id"],
            "status": "accepted",
            "created_at": (datetime.now(timezone.utc) - timedelta(days=15)).isoformat()
        },
        {
            "friendship_id": str(uuid.uuid4()),
            "user_id": alex["user_id"],
            "friend_id": demo_user["user_id"],
            "status": "pending",
            "created_at": (datetime.now(timezone.utc) - timedelta(hours=5)).isoformat()
        }
    ]
    
    await db.friendships.insert_many(friendships_data)
    print(f"✓ Created {len(friendships_data)} friendships")
    
    # Create bets in various states
    bets_data = [
        # Pending bet
        {
            "bet_id": str(uuid.uuid4()),
            "creator_id": johnny["user_id"],
            "opponent_id": demo_user["user_id"],
            "amount": 500.00,
            "status": "pending",
            "stipulation": "",
            "punk_out_amount": 0.0,
            "dp_id": None,
            "winner_id": None,
            "created_at": (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat(),
            "updated_at": (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat()
        },
        # Accepted bet with stipulation
        {
            "bet_id": str(uuid.uuid4()),
            "creator_id": demo_user["user_id"],
            "opponent_id": sarah["user_id"],
            "amount": 1000.00,
            "status": "accepted",
            "stipulation": "1/8 mile race, green light win, cross double lines lose, red light lose",
            "punk_out_amount": 100.0,
            "dp_id": mike["user_id"],
            "winner_id": None,
            "created_at": (datetime.now(timezone.utc) - timedelta(hours=6)).isoformat(),
            "updated_at": (datetime.now(timezone.utc) - timedelta(hours=4)).isoformat()
        },
        # Active bet (locked by DP)
        {
            "bet_id": str(uuid.uuid4()),
            "creator_id": mike["user_id"],
            "opponent_id": demo_user["user_id"],
            "amount": 750.00,
            "status": "active",
            "stipulation": "Quarter mile, no prep, winner takes all",
            "punk_out_amount": 75.0,
            "dp_id": johnny["user_id"],
            "winner_id": None,
            "created_at": (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat(),
            "updated_at": (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
        },
        # Completed bet
        {
            "bet_id": str(uuid.uuid4()),
            "creator_id": demo_user["user_id"],
            "opponent_id": johnny["user_id"],
            "amount": 2000.00,
            "status": "completed",
            "stipulation": "1/8 mile, heads up race, clean start required",
            "punk_out_amount": 200.0,
            "dp_id": sarah["user_id"],
            "winner_id": demo_user["user_id"],
            "platform_fee": 120.00,
            "winner_payout": 3880.00,
            "created_at": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat(),
            "updated_at": (datetime.now(timezone.utc) - timedelta(days=2, hours=-3)).isoformat()
        },
        # Another completed bet
        {
            "bet_id": str(uuid.uuid4()),
            "creator_id": sarah["user_id"],
            "opponent_id": demo_user["user_id"],
            "amount": 1500.00,
            "status": "completed",
            "stipulation": "Half mile race, rolling start at 40mph",
            "punk_out_amount": 150.0,
            "dp_id": alex["user_id"],
            "winner_id": sarah["user_id"],
            "platform_fee": 90.00,
            "winner_payout": 2910.00,
            "created_at": (datetime.now(timezone.utc) - timedelta(days=5)).isoformat(),
            "updated_at": (datetime.now(timezone.utc) - timedelta(days=5, hours=-2)).isoformat()
        }
    ]
    
    await db.bets.insert_many(bets_data)
    print(f"✓ Created {len(bets_data)} bets (pending, accepted, active, completed)")
    
    # Create messages
    messages_data = [
        {
            "message_id": str(uuid.uuid4()),
            "sender_id": johnny["user_id"],
            "receiver_id": demo_user["user_id"],
            "content": "Hey! Ready for that race tomorrow?",
            "created_at": (datetime.now(timezone.utc) - timedelta(hours=12)).isoformat()
        },
        {
            "message_id": str(uuid.uuid4()),
            "sender_id": demo_user["user_id"],
            "receiver_id": johnny["user_id"],
            "content": "Absolutely! My car is running perfect.",
            "created_at": (datetime.now(timezone.utc) - timedelta(hours=11)).isoformat()
        },
        {
            "message_id": str(uuid.uuid4()),
            "sender_id": sarah["user_id"],
            "receiver_id": demo_user["user_id"],
            "content": "Good race last week! Want a rematch?",
            "created_at": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
        },
        {
            "message_id": str(uuid.uuid4()),
            "sender_id": demo_user["user_id"],
            "receiver_id": sarah["user_id"],
            "content": "Definitely! Let's set it up for next weekend.",
            "created_at": (datetime.now(timezone.utc) - timedelta(hours=18)).isoformat()
        },
        {
            "message_id": str(uuid.uuid4()),
            "sender_id": mike["user_id"],
            "receiver_id": demo_user["user_id"],
            "content": "Can you be DP for my race against Johnny?",
            "created_at": (datetime.now(timezone.utc) - timedelta(hours=8)).isoformat()
        }
    ]
    
    await db.messages.insert_many(messages_data)
    print(f"✓ Created {len(messages_data)} messages")
    
    # Create notifications
    notifications_data = [
        {
            "notification_id": str(uuid.uuid4()),
            "user_id": demo_user["user_id"],
            "type": "bet_request",
            "content": f"{johnny['name']} wants to bet $500.00 with you",
            "bet_id": bets_data[0]["bet_id"],
            "read": False,
            "created_at": (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat()
        },
        {
            "notification_id": str(uuid.uuid4()),
            "user_id": demo_user["user_id"],
            "type": "friend_request",
            "content": f"{alex['name']} sent you a friend request",
            "bet_id": None,
            "read": False,
            "created_at": (datetime.now(timezone.utc) - timedelta(hours=5)).isoformat()
        },
        {
            "notification_id": str(uuid.uuid4()),
            "user_id": demo_user["user_id"],
            "type": "bet_locked",
            "content": "Your bet is now locked and ready to race!",
            "bet_id": bets_data[2]["bet_id"],
            "read": False,
            "created_at": (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
        },
        {
            "notification_id": str(uuid.uuid4()),
            "user_id": demo_user["user_id"],
            "type": "dp_assigned",
            "content": f"You've been selected as DP for a ${bets_data[1]['amount']:.2f} bet",
            "bet_id": bets_data[1]["bet_id"],
            "read": True,
            "created_at": (datetime.now(timezone.utc) - timedelta(hours=4)).isoformat()
        }
    ]
    
    await db.notifications.insert_many(notifications_data)
    print(f"✓ Created {len(notifications_data)} notifications")
    
    # Create payment transactions
    transactions_data = [
        {
            "session_id": f"cs_test_{uuid.uuid4()}",
            "user_id": demo_user["user_id"],
            "amount": 1000.00,
            "currency": "usd",
            "status": "complete",
            "payment_status": "paid",
            "metadata": {"type": "deposit"},
            "created_at": (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        },
        {
            "session_id": f"cs_test_{uuid.uuid4()}",
            "user_id": demo_user["user_id"],
            "amount": 500.00,
            "currency": "usd",
            "status": "complete",
            "payment_status": "paid",
            "metadata": {"type": "deposit"},
            "created_at": (datetime.now(timezone.utc) - timedelta(days=3)).isoformat()
        }
    ]
    
    await db.payment_transactions.insert_many(transactions_data)
    print(f"✓ Created {len(transactions_data)} payment transactions")
    
    # Create platform fees record
    platform_fees_data = [
        {
            "fee_id": str(uuid.uuid4()),
            "bet_id": bets_data[3]["bet_id"],
            "amount": 120.00,
            "winner_id": demo_user["user_id"],
            "loser_id": johnny["user_id"],
            "total_pool": 4000.00,
            "created_at": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat()
        },
        {
            "fee_id": str(uuid.uuid4()),
            "bet_id": bets_data[4]["bet_id"],
            "amount": 90.00,
            "winner_id": sarah["user_id"],
            "loser_id": demo_user["user_id"],
            "total_pool": 3000.00,
            "created_at": (datetime.now(timezone.utc) - timedelta(days=5)).isoformat()
        }
    ]
    
    await db.platform_fees.insert_many(platform_fees_data)
    print(f"✓ Created {len(platform_fees_data)} platform fee records")
    
    print("\n✅ Database seeding complete!")
    print("\n📋 Demo Credentials:")
    print("=" * 50)
    for user in users_data:
        print(f"Email: {user['email']}")
        print(f"Password: demo123")
        print(f"Betz ID: {user['betz_id']}")
        print(f"Balance: ${user['balance']:.2f}")
        print("-" * 50)

if __name__ == "__main__":
    asyncio.run(seed_database())
