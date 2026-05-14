"""
BETZ Backend Regression Tests
Covers the 9 endpoints previously failing + auth, bets, friends.
Run: pytest /app/backend/tests/test_betz_backend.py -v
"""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Fallback: read from frontend .env so pytest can run without env injection
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
                    break
    except Exception:
        pass

API = f"{BASE_URL}/api"
ADMIN_EMAIL = "streamboss316@gmail.com"
ADMIN_PASSWORD = "sanaa3030"


def _rand(prefix="TEST"):
    return f"{prefix}_{uuid.uuid4().hex[:10]}"


# ---------- Fixtures ----------

@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_token(session):
    r = session.post(f"{API}/admin/login",
                     json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "access_token" in data
    return data["access_token"]


@pytest.fixture(scope="session")
def user_a(session):
    return _register_user(session, "userA")


@pytest.fixture(scope="session")
def user_b(session):
    return _register_user(session, "userB")


def _register_user(session, label):
    email = f"test_{label}_{uuid.uuid4().hex[:8]}@betztest.com"
    payload = {
        "email": email,
        "phone": f"+1555{uuid.uuid4().int % 10000000:07d}",
        "password": "Pass1234!",
        "name": f"TEST_{label}",
    }
    r = session.post(f"{API}/auth/register", json=payload)
    assert r.status_code == 200, f"Register failed: {r.status_code} {r.text}"
    data = r.json()
    return {
        "email": email,
        "password": payload["password"],
        "token": data["access_token"],
        "user": data["user"],
        "user_id": data["user"]["user_id"],
        "headers": {"Authorization": f"Bearer {data['access_token']}",
                    "Content-Type": "application/json"},
    }


def _set_balance(session, admin_token, user_id, balance):
    r = session.put(
        f"{API}/admin/users/{user_id}",
        json={"balance": balance},
        headers={"Authorization": f"Bearer {admin_token}",
                 "Content-Type": "application/json"},
    )
    assert r.status_code == 200, f"set_balance failed: {r.text}"


# ---------- Auth basics ----------

class TestAuth:
    def test_register_login_me(self, session):
        u = _register_user(session, "auth")
        # /auth/me
        r = session.get(f"{API}/auth/me", headers=u["headers"])
        assert r.status_code == 200
        body = r.json()
        assert body["email"] == u["email"]
        assert body["user_id"] == u["user_id"]
        # login
        r2 = session.post(f"{API}/auth/login",
                          json={"email": u["email"], "password": u["password"]})
        assert r2.status_code == 200
        assert "access_token" in r2.json()

    def test_login_bad_password(self, session, user_a):
        r = session.post(f"{API}/auth/login",
                         json={"email": user_a["email"], "password": "wrongpw"})
        assert r.status_code == 401


# ---------- Profile route ordering ----------

class TestProfileRoutes:
    def test_users_profile_returns_current_user(self, session, user_a):
        r = session.get(f"{API}/users/profile", headers=user_a["headers"])
        assert r.status_code == 200, f"GET /users/profile failed: {r.status_code} {r.text}"
        data = r.json()
        assert data["user_id"] == user_a["user_id"]
        assert data["email"] == user_a["email"]

    def test_users_me_achievements_not_shadowed(self, session, user_a):
        r = session.get(f"{API}/users/me/achievements", headers=user_a["headers"])
        assert r.status_code == 200, f"/users/me/achievements failed: {r.status_code} {r.text}"
        body = r.json()
        assert "earned" in body and "earned_count" in body and "total_possible" in body
        # If shadowed it would 404 due to "me" not being a user_id
        assert isinstance(body["earned"], list)

    def test_user_id_achievements_still_works(self, session, user_a):
        r = session.get(f"{API}/users/{user_a['user_id']}/achievements",
                        headers=user_a["headers"])
        assert r.status_code == 200
        assert "earned" in r.json()


# ---------- Messaging ----------

class TestMessages:
    def test_send_message_json_body(self, session, user_a, user_b):
        r = session.post(f"{API}/messages/send",
                         headers=user_a["headers"],
                         json={"receiver_id": user_b["user_id"],
                               "content": "Hello from A"})
        assert r.status_code == 200, f"send msg failed: {r.status_code} {r.text}"
        body = r.json()
        assert body["content"] == "Hello from A"
        assert body["sender_id"] == user_a["user_id"]
        assert body["receiver_id"] == user_b["user_id"]

    def test_send_message_empty_content_rejected(self, session, user_a, user_b):
        r = session.post(f"{API}/messages/send",
                         headers=user_a["headers"],
                         json={"receiver_id": user_b["user_id"], "content": "   "})
        assert r.status_code == 400

    def test_send_message_self_rejected(self, session, user_a):
        r = session.post(f"{API}/messages/send",
                         headers=user_a["headers"],
                         json={"receiver_id": user_a["user_id"], "content": "hi"})
        assert r.status_code == 400

    def test_send_message_unknown_receiver_404(self, session, user_a):
        r = session.post(f"{API}/messages/send",
                         headers=user_a["headers"],
                         json={"receiver_id": "nonexistent-user-id",
                               "content": "hi"})
        assert r.status_code == 404


# ---------- Public Chat ----------

class TestPublicChat:
    def test_send_public_message(self, session, user_a):
        r = session.post(f"{API}/chat/public/send",
                         headers=user_a["headers"],
                         json={"content": "Public hello"})
        assert r.status_code == 200, f"public chat send failed: {r.text}"
        body = r.json()
        assert body["content"] == "Public hello"
        assert body["sender_id"] == user_a["user_id"]
        assert "sender" in body
        assert body["sender"]["user_id"] == user_a["user_id"]

    def test_send_public_empty_rejected(self, session, user_a):
        r = session.post(f"{API}/chat/public/send",
                         headers=user_a["headers"],
                         json={"content": ""})
        assert r.status_code == 400

    def test_get_public_messages(self, session, user_a):
        # ensure at least 1 exists
        session.post(f"{API}/chat/public/send",
                     headers=user_a["headers"],
                     json={"content": "msg-for-list"})
        r = session.get(f"{API}/chat/public", headers=user_a["headers"])
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ---------- Conversations ----------

class TestConversations:
    def test_conversations_listed_with_last_message(self, session, user_a, user_b):
        # A sends a message to B then B replies, ensure both see conversation
        session.post(f"{API}/messages/send",
                     headers=user_a["headers"],
                     json={"receiver_id": user_b["user_id"], "content": "msg1"})
        time.sleep(0.05)
        session.post(f"{API}/messages/send",
                     headers=user_b["headers"],
                     json={"receiver_id": user_a["user_id"], "content": "msg2-reply"})

        r = session.get(f"{API}/chat/conversations", headers=user_a["headers"])
        assert r.status_code == 200, f"conversations failed: {r.status_code} {r.text}"
        convos = r.json()
        assert isinstance(convos, list)
        # Find conversation with user_b
        match = [c for c in convos if c["user"]["user_id"] == user_b["user_id"]]
        assert match, f"Expected conversation with user_b, got: {convos}"
        last = match[0]["last_message"]
        # Last must be the most recent one (msg2-reply)
        assert last["content"] == "msg2-reply"


# ---------- Admin endpoints ----------

class TestAdmin:
    def test_admin_login_returns_token(self, admin_token):
        assert isinstance(admin_token, str) and len(admin_token) > 20

    def test_admin_login_bad_creds(self, session):
        r = session.post(f"{API}/admin/login",
                         json={"email": ADMIN_EMAIL, "password": "wrong"})
        assert r.status_code == 401

    def test_admin_stats_with_admin_token(self, session, admin_token):
        r = session.get(f"{API}/admin/stats",
                        headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200, f"admin/stats failed: {r.text}"
        data = r.json()
        for key in ("total_users", "total_bets", "active_bets",
                    "completed_bets", "total_revenue"):
            assert key in data

    def test_admin_users_with_admin_token(self, session, admin_token):
        r = session.get(f"{API}/admin/users",
                        headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_admin_bets_with_admin_token(self, session, admin_token):
        r = session.get(f"{API}/admin/bets",
                        headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_admin_endpoints_reject_user_token(self, session, user_a):
        for path in ("/admin/stats", "/admin/users", "/admin/bets"):
            r = session.get(f"{API}{path}", headers=user_a["headers"])
            # user JWT lacks role=admin → verify_admin_token raises 403
            assert r.status_code in (401, 403), f"{path} should reject user token, got {r.status_code}"

    def test_admin_endpoints_reject_no_token(self, session):
        for path in ("/admin/stats", "/admin/users", "/admin/bets"):
            r = session.get(f"{API}{path}")
            assert r.status_code == 401


# ---------- Bet creation & punk-out math ----------

class TestBetsAndPunkOut:
    def test_create_bet_self_blocked(self, session, user_a):
        r = session.post(f"{API}/bets/create",
                         headers=user_a["headers"],
                         json={"opponent_id": user_a["user_id"], "amount": 10})
        assert r.status_code == 400

    def test_create_bet_punk_out_is_10pct_of_total_pot(self, session, admin_token):
        # Fresh users with funded balances
        u1 = _register_user(session, "betA")
        u2 = _register_user(session, "betB")
        _set_balance(session, admin_token, u1["user_id"], 500.0)
        _set_balance(session, admin_token, u2["user_id"], 500.0)

        amount = 100.0
        r = session.post(f"{API}/bets/create",
                         headers=u1["headers"],
                         json={"opponent_id": u2["user_id"],
                               "amount": amount,
                               "stipulation": "TEST punk math"})
        assert r.status_code == 200, f"create bet failed: {r.text}"
        bet = r.json()
        # 10% of (100*2) = 20
        expected = amount * 2 * 0.10
        assert bet.get("punk_out_amount") == pytest.approx(expected), (
            f"expected punk_out_amount {expected}, got {bet.get('punk_out_amount')}"
        )

    def test_accept_punk_out_math(self, session, admin_token):
        u1 = _register_user(session, "pkA")
        u2 = _register_user(session, "pkB")
        _set_balance(session, admin_token, u1["user_id"], 500.0)
        _set_balance(session, admin_token, u2["user_id"], 500.0)

        amount = 100.0
        # Create bet (u1 creator, u2 opponent)
        rc = session.post(f"{API}/bets/create",
                          headers=u1["headers"],
                          json={"opponent_id": u2["user_id"],
                                "amount": amount,
                                "stipulation": "punk-out math"})
        assert rc.status_code == 200
        bet = rc.json()
        bet_id = bet["bet_id"]
        punk_amount = bet["punk_out_amount"]
        assert punk_amount == pytest.approx(20.0)

        # u2 accepts the bet (≤1000 → active immediately)
        ra = session.put(f"{API}/bets/{bet_id}/accept",
                         headers=u2["headers"], json={"race_now": True})
        assert ra.status_code == 200, f"accept failed: {ra.text}"

        # Capture balances pre-punk-out
        bal_u1_pre = session.get(f"{API}/auth/me", headers=u1["headers"]).json()["balance"]
        bal_u2_pre = session.get(f"{API}/auth/me", headers=u2["headers"]).json()["balance"]

        # u1 claims punk-out
        rclaim = session.put(f"{API}/bets/{bet_id}/claim-punk-out",
                             headers=u1["headers"])
        assert rclaim.status_code == 200, f"claim failed: {rclaim.text}"

        # u2 accepts the punk-out
        racc = session.put(f"{API}/bets/{bet_id}/accept-punk-out",
                           headers=u2["headers"])
        assert racc.status_code == 200, f"accept-punk-out failed: {racc.text}"
        body = racc.json()
        assert body["punk_out_amount"] == pytest.approx(punk_amount)
        assert body["claimer_receives"] == pytest.approx(amount + punk_amount)  # 120
        assert body["accepter_receives"] == pytest.approx(amount - punk_amount)  # 80

        # Verify balances reflect the math
        bal_u1_post = session.get(f"{API}/auth/me", headers=u1["headers"]).json()["balance"]
        bal_u2_post = session.get(f"{API}/auth/me", headers=u2["headers"]).json()["balance"]
        # claimer (u1) gained amount + punk = 120
        assert bal_u1_post - bal_u1_pre == pytest.approx(amount + punk_amount)
        # accepter (u2) gained amount - punk = 80
        assert bal_u2_post - bal_u2_pre == pytest.approx(amount - punk_amount)


# ---------- Friends ----------

class TestFriends:
    def test_self_friend_request_blocked(self, session, user_a):
        r = session.post(
            f"{API}/friends/request",
            params={"friend_id": user_a["user_id"]},
            headers=user_a["headers"],
        )
        assert r.status_code == 400
