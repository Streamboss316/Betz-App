# BETZ — P2P Betting App PRD

## Original Problem Statement
Refine and implement a P2P betting application ("Betz-App") with fintech-grade UX similar to CashApp, Stripe, Venmo. Drag-racing themed authentication, green "Bet Secure. Get Paid." tagline. Cloned from user's `Betz2` GitHub branch.

## Stack
- **Frontend**: React + Tailwind + PWA, Axios
- **Backend**: FastAPI + Motor (MongoDB async) + JWT auth + bcrypt
- **DB**: MongoDB
- **Payments**: Stripe (pending user API key)
- **Email**: SMTP (pending user domain)

## Core Features
- Wallet (deposit, withdraw, balance)
- P2P bet creation with stipulation, optional DP (decision person)
- Punk-out (back out) flow with 10% penalty of total pot
- Friend system + DMs + public chat room
- Notifications + reviews + achievements
- Admin dashboard (separate JWT, role=admin)

## Critical Design Decisions (do not change)
- AuthPage has drag-racing image + GREEN tagline "Bet Secure. Get Paid."
- CashApp-style bottom nav with centered gradient `+` button
- Privacy: profiles private by default

## Architecture
```
/app/backend/
  server.py           # FastAPI main (~3100 lines — TODO: split into routes)
  admin_routes.py     # /api/admin/* APIs (separate admin JWT)
  email_service.py    # mocked SMTP
  seed_*.py
  tests/test_betz_backend.py  # 24-case pytest regression
/app/frontend/src/
  pages/, components/
  public/manifest.json
```

## Changelog
- 2026-02 (this session): Fixed 9 backend endpoints
  - `/messages/send` & `/chat/public/send`: switched query params → Pydantic JSON body (was 422)
  - `/chat/conversations`: fixed `find_one(...).sort()` bug → `find().sort().limit(1).to_list(1)` (was 500)
  - `/users/me/achievements`: reordered before `/users/{user_id}/achievements` to prevent route shadowing (was 404)
  - `accept_punk_out`: cleaned up duplicate/confusing math (logic was already correct)
  - Verified admin login flow: `/api/admin/login` → admin JWT → `/api/admin/*` 200 (the previous "403" was correct rejection of user-token; not a bug)
- 2026-02: Created comprehensive backend test suite (`tests/test_betz_backend.py`, 24 cases, 100% passing)
- Earlier in this session/fork:
  - CashApp-style BottomNav, drag-racing AuthPage with green tagline
  - PWA manifest + SEO meta tags
  - Biometric auth backend storage
  - Self-bet / self-friend-request prevention
  - Removed duplicate headers/nav bars

## Roadmap

### P1 — Awaiting User Input
- Stripe integration (need BETZ Stripe API key)
- Email/SMTP integration (need BETZ domain)

### P2 — Security / Hardening
- Move `ADMIN_EMAIL` / `ADMIN_PASSWORD_HASH` from `admin_routes.py` into `.env`
- Fail-fast on missing `JWT_SECRET` (currently defaults to `'your-secret-key'` in admin_routes)
- Remove hardcoded demo passwords from `AdminDashboard.js` and `AdminDemoMode.js`
- Standardise `/friends/request` to use a Pydantic JSON body

### P2 — Refactor
- Split `server.py` (~3100 lines) into `routes/{auth,bets,messages,chat,friends,profiles,payments}.py` using `APIRouter`
- Extract shared DB instance into a separate module (currently `admin_routes` imports from `server`)

### P2 — Polish
- High-res custom PWA app icons
- `PUT /api/admin/users/{user_id}` should 400 when body is empty (currently returns success)

## Test Credentials
See `/app/memory/test_credentials.md`.

## Health
- All backend endpoints: ✅ green (24/24 pytest)
- Stripe: pending key
- Email: mocked
