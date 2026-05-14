# BETZ — P2P Betting App PRD

## Original Problem Statement
Refine and implement a P2P betting application ("Betz-App") with fintech-grade UX similar to CashApp, Stripe, Venmo. Drag-racing themed authentication, green "Bet Secure. Get Paid." tagline. Cloned from user's `Betz2` GitHub branch.

## Stack
- **Frontend**: React + Tailwind + PWA, Axios
- **Backend**: FastAPI + Motor (MongoDB async) + JWT + bcrypt
- **DB**: MongoDB
- **Payments**: Stripe (pending user API key)
- **Email**: SMTP (pending user domain)

## Brand / Visual Language (locked)
- **Wordmark**: Bebas Neue uppercase, purple→gold gradient (`#a855f7 → #c084fc → #fbbf24 → #f59e0b`)
- **Tagline "Bet Secure. Get Paid."**: GREEN (`#22c55e`), Bebas Neue, wide tracking
- **Drag-racing aesthetic** on AuthPage (night drag-strip image + animated smoke + scan line + grid + staging lights)
- **Surfaces**: `.brand-surface` (radial purple+gold ambient on dark base) for balance hero / hero cards
- **CTA**: `.btn-premium` and `.auth-cta` use the same purple→gold gradient
- **Fonts**: Bebas Neue (headings, big numerals), Outfit (body)

## Core Features
Wallet (deposit, withdraw), P2P bet creation w/ optional DP, Punk-out (10% of pot penalty), Friends + DMs + public chat, Notifications, Reviews, Achievements, Admin dashboard (separate JWT).

## Architecture
```
/app/backend/
  server.py           # FastAPI main (~3100 lines — TODO: split)
  admin_routes.py     # /api/admin/* (separate admin JWT)
  email_service.py    # mocked SMTP
  tests/test_betz_backend.py  # 24-case regression
/app/frontend/src/
  pages/AuthPage.js   # cinematic drag-strip auth, top-centered gradient BETZ
  pages/HomePage.js   # brand-surface balance + Bebas Neue numerals
  pages/WalletPage.js # matching brand-surface balance hero
  components/GlobalHeader.js  # gradient BETZ + green tagline
  components/BottomNav.js     # bold gradient "+" button, brand-text labels
  index.css           # .brand-text, .brand-surface, .btn-premium (gradient), auth-* utilities
```

## Changelog
- 2026-02 — Backend: fixed 9 endpoints (Pydantic JSON bodies for messages/send + chat/public/send; `find_one(...).sort()` → `find().sort().limit()` for chat/conversations; reordered `/users/me/achievements` ahead of `/users/{user_id}/achievements`; cleaned `accept_punk_out` math). 24-case pytest regression at 100%.
- 2026-02 — AuthPage redesign v1: cinematic drag-strip background, neon-green accents, marquee ticker, staging lights, glass card.
- 2026-02 — AuthPage redesign v2: **BETZ wordmark moved to top center**, **green replaced with purple→gold blend** (tagline stays green).
- 2026-02 — App-wide visual continuity: HomePage, WalletPage, GlobalHeader, and BottomNav now all use the purple→gold brand language (gradient text, brand-surface, Bebas Neue numerals, upgraded `.btn-premium`).

## Roadmap

### P1 — Waiting on user
- Stripe API key (BETZ-specific)
- BETZ email domain for SMTP

### P2 — Security hardening
- Move admin creds/JWT_SECRET from `admin_routes.py` to env
- Fail-fast on missing JWT_SECRET (currently defaults to literal `'your-secret-key'`)
- Remove hardcoded demo passwords from `AdminDashboard.js` / `AdminDemoMode.js`

### P2 — Refactor
- Split `server.py` into `routes/{auth,bets,messages,chat,friends,profiles,payments}.py` via APIRouter
- Extract shared `db` instance into a separate module to break the `admin_routes → server` import coupling

### P2 — Polish
- High-res custom PWA app icons (favicon, 192, 512 PNG)
- Standardise `/friends/request` to JSON body
- `PUT /admin/users/{user_id}` should 400 on empty body
- Apply the brand language to remaining pages (PlaceBetPage, BetDetailsPage, ProfilePage, MessagesPage)

## Test Credentials
See `/app/memory/test_credentials.md`.

## Health
- Backend: ✅ 24/24 pytest passing
- Frontend: ✅ lint clean, smoke-tested on mobile + desktop
- Stripe: pending key
- Email: mocked
