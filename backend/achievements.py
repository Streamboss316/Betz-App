"""
Achievements System for BETZ
"""

ACHIEVEMENTS = {
    # Win-based achievements
    "first_win": {
        "name": "First Victory",
        "description": "Win your first bet",
        "icon": "🏆",
        "condition": lambda user: user.get("win_count", 0) >= 1
    },
    "hot_streak_3": {
        "name": "Hot Streak",
        "description": "Win 3 bets in a row",
        "icon": "🔥",
        "condition": lambda user: user.get("win_streak", 0) >= 3
    },
    "hot_streak_5": {
        "name": "On Fire",
        "description": "Win 5 bets in a row",
        "icon": "🔥🔥",
        "condition": lambda user: user.get("win_streak", 0) >= 5
    },
    "hot_streak_10": {
        "name": "Unstoppable",
        "description": "Win 10 bets in a row",
        "icon": "⚡",
        "condition": lambda user: user.get("win_streak", 0) >= 10
    },
    "win_10": {
        "name": "Veteran Racer",
        "description": "Win 10 total bets",
        "icon": "🏁",
        "condition": lambda user: user.get("win_count", 0) >= 10
    },
    "win_50": {
        "name": "Racing Legend",
        "description": "Win 50 total bets",
        "icon": "👑",
        "condition": lambda user: user.get("win_count", 0) >= 50
    },
    "win_100": {
        "name": "Hall of Fame",
        "description": "Win 100 total bets",
        "icon": "🌟",
        "condition": lambda user: user.get("win_count", 0) >= 100
    },
    
    # High roller achievements
    "high_roller_1k": {
        "name": "High Roller",
        "description": "Win a bet worth $1,000 or more",
        "icon": "💰",
        "condition": lambda user: user.get("highest_win", 0) >= 1000
    },
    "high_roller_5k": {
        "name": "Big Money",
        "description": "Win a bet worth $5,000 or more",
        "icon": "💎",
        "condition": lambda user: user.get("highest_win", 0) >= 5000
    },
    "high_roller_10k": {
        "name": "Whale",
        "description": "Win a bet worth $10,000 or more",
        "icon": "🐋",
        "condition": lambda user: user.get("highest_win", 0) >= 10000
    },
    
    # Trust-based achievements
    "trusted_member": {
        "name": "Trusted Member",
        "description": "Achieve 90%+ trust score",
        "icon": "✅",
        "condition": lambda user: user.get("trust_score", 0) >= 90
    },
    "perfect_reputation": {
        "name": "Perfect Reputation",
        "description": "Achieve 100% trust score with 10+ reviews",
        "icon": "💯",
        "condition": lambda user: user.get("trust_score", 0) == 100 and user.get("review_count", 0) >= 10
    },
    
    # Activity-based achievements
    "social_butterfly": {
        "name": "Social Butterfly",
        "description": "Have 20+ friends",
        "icon": "🦋",
        "condition": lambda user: user.get("friend_count", 0) >= 20
    },
    "bet_master": {
        "name": "Bet Master",
        "description": "Create 50 bets",
        "icon": "📊",
        "condition": lambda user: user.get("bets_created", 0) >= 50
    },
    
    # Win rate achievements
    "sharp_shooter": {
        "name": "Sharp Shooter",
        "description": "Win rate above 70% (min 10 bets)",
        "icon": "🎯",
        "condition": lambda user: (
            user.get("win_count", 0) + user.get("loss_count", 0) >= 10 and
            (user.get("win_count", 0) / max(user.get("win_count", 0) + user.get("loss_count", 0), 1)) >= 0.70
        )
    },
    "elite_racer": {
        "name": "Elite Racer",
        "description": "Win rate above 80% (min 20 bets)",
        "icon": "🏎️",
        "condition": lambda user: (
            user.get("win_count", 0) + user.get("loss_count", 0) >= 20 and
            (user.get("win_count", 0) / max(user.get("win_count", 0) + user.get("loss_count", 0), 1)) >= 0.80
        )
    }
}

def check_user_achievements(user_data: dict) -> list:
    """
    Check which achievements a user has earned
    Returns list of achievement IDs
    """
    earned_achievements = []
    
    for achievement_id, achievement_info in ACHIEVEMENTS.items():
        try:
            if achievement_info["condition"](user_data):
                earned_achievements.append(achievement_id)
        except Exception as e:
            print(f"Error checking achievement {achievement_id}: {e}")
            continue
    
    return earned_achievements

def get_achievement_details(achievement_id: str) -> dict:
    """Get details of a specific achievement"""
    if achievement_id in ACHIEVEMENTS:
        achievement = ACHIEVEMENTS[achievement_id].copy()
        achievement["achievement_id"] = achievement_id
        # Remove the condition function from response
        achievement.pop("condition", None)
        return achievement
    return None

def get_all_achievements() -> list:
    """Get list of all possible achievements"""
    achievements_list = []
    for achievement_id, achievement_info in ACHIEVEMENTS.items():
        achievement = achievement_info.copy()
        achievement["achievement_id"] = achievement_id
        achievement.pop("condition", None)  # Remove condition function
        achievements_list.append(achievement)
    return achievements_list
