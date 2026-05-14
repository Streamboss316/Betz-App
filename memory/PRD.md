# BETZ — P2P Betting App PRD

## Original Problem Statement
Refine and implement a P2P betting application ("Betz-App") with fintech-grade UX similar to CashApp, Stripe, Venmo. Drag-racing themed authentication, green "Bet Secure. Get Paid." tagline. Cloned from user's `Betz2` GitHub branch.

## Stack
- **Frontend**: React + Tailwind + PWA, Axios
- **Backend**: FastAPI + Motor (MongoDB async) + JWT + bcrypt
- **DB**: MongoDB
- **Payments**: Stripe (pending user API key)
- **Email**: SMTP (pending user domain)
- **Image gen**: Gemini Nano Banana (`gemini-3.1-flash-image-preview`) via EMERGENT_LLM_KEY

## Brand / Visual Language (locked)
- **Wordmark**: Bebas Neue uppercase, purple→gold gradient (`#a855f7 → #c084fc → #fbbf24 → #f59e0b`) with a pulsing radial glow halo.
- **Tagline "Bet Secure. Get Paid."**: GREEN (`#22c55e`), Bebas Neue, wide tracking.
- **Drag-racing aesthetic** on AuthPage — hero image generated brand-clean (no NHRA/trademarks).
- **Surfaces**: `.brand-surface` (radial purple+gold ambient on dark base) for balance hero / cards.
- **CTAs**: `.btn-premium` and `.auth-cta-clean` use the purple→gold gradient.
- **Fonts**: Bebas Neue (headings, big numerals), Outfit (body).
- **App icons**: generated PWA icons in purple→gold (`favicon.png`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`).

## Core Features
Wallet (deposit, withdraw), P2P bet creation w/ optional DP, Punk-out (10% of pot penalty), Friends + DMs + public chat, Notifications, Reviews, Achievements, Admin dashboard (separate JWT).

## Architecture
```
/app/backend/
  server.py             # FastAPI main (~3080 lines — TODO: split into routers)
  admin_routes.py       # /api/admin/* (separate admin JWT; env-sourced creds; impersonate)
  email_service.py      # mocked SMTP
  seed_demo_users.py    # creates demo@betz.com + test@betz.com
  scripts/
    gen_auth_hero.py    # one-shot Nano Banana hero image generator (AuthPage)
    gen_app_icons.py    # one-shot PWA icon generator (192/512/favicon/apple-touch)
  tests/test_betz_backend.py   # 38-case regression
/app/frontend/src/
  pages/AuthPage.js     # drag-strip hero, purple/gold gradient wordmark + glow, green tagline, marquee, trust pills
  pages/HomePage.js     # brand-surface balance + Bebas Neue numerals
  pages/WalletPage.js   # brand-surface balance hero
  pages/AdminDashboard.js / AdminDemoMode.js  # use admin-only impersonate API (no plaintext passwords)
  pages/ContactsPage.js # /friends/request now sends JSON body
  components/GlobalHeader.js  # gradient BETZ + green tagline
  components/BottomNav.js     # bold gradient "+" button, brand-text labels
  index.css             # .brand-text, .brand-surface, .btn-premium, auth-* utilities
  public/auth-bg.jpg    # generated brand-clean drag-race hero
  public/icon-*.png     # generated PWA icons
```

## Changelog
- 2026-02 — Backend stability: fixed 9 endpoints (Pydantic JSON bodies for messages/send + chat/public/send; `find_one(...).sort()` → `find().sort().limit()` for chat/conversations; reordered `/users/me/achievements`; cleaned `accept_punk_out` math).
- 2026-02 — AuthPage redesign: cinematic drag-strip background, top-centered gradient BETZ wordmark with halo, purple/gold blend, green tagline.
- 2026-02 — App-wide brand language: HomePage, WalletPage, GlobalHeader, BottomNav now use brand-text + brand-surface + Bebas Neue numerals.
- 2026-02 — Fintech-clean iteration on AuthPage: card refined (clean tabs, inputs, primary CTA, calm trust line). Glow + marquee + trust pills retained.
- 2026-02 — Brand-clean hero: generated `/app/frontend/public/auth-bg.jpg` via Gemini Nano Banana (two dragsters, no NHRA/sponsor logos).
- 2026-02 — **P2 security hardening**:
  - `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` now env-sourced (defaults preserve existing behaviour).
  - `JWT_SECRET` fail-fast in `admin_routes.py` if missing.
  - Removed hardcoded plaintext demo passwords from `AdminDashboard.js` and `AdminDemoMode.js`.
  - Added admin-only `GET /api/admin/demo-users` and `POST /api/admin/impersonate` (whitelist enforced).
- 2026-02 — **P2 backend polish**:
  - `POST /api/friends/request` now accepts JSON body `{friend_id}` (was query param), validates receiver exists.
  - `PUT /api/admin/users/{user_id}` returns 400 on empty body and 404 on unknown user (was silently returning success).
- 2026-02 — **P2 PWA icons**: custom purple→gold "B" monogram icons (192/512/favicon/apple-touch) generated via Nano Banana; manifest + index.html updated.
- 2026-02 — Test suite expanded to 38 cases (24 regression + 14 new) — all passing.

## Roadmap

### P1 — Waiting on user
- Stripe API key (BETZ-specific)
- BETZ email domain for SMTP

### P2 — Refactor (deferred, low risk-of-bugs)
- Split `server.py` (~3080 lines) into `routes/{auth,bets,messages,chat,friends,profiles,payments}.py` via APIRouter.
- Extract shared `db` instance into a module to break the `admin_routes → server` import coupling.

### P2 — Audit / observability (deferred)
- Add `impersonated_by` JWT claim + audit log entry when admin impersonates a demo user.
- Source `DEMO_USER_EMAILS` from env or a DB `is_demo` flag.
- Restrict `POST /admin/demo/reset` (currently wipes all users).

### P3 — Visual continuity (optional)
- Apply the brand language to remaining pages (PlaceBetPage, BetDetailsPage, ProfilePage, MessagesPage).

## Test Credentials
See `/app/memory/test_credentials.md`.

## Health
- Backend: ✅ 38/38 pytest passing
- Frontend: ✅ lint clean, smoke-tested
- Stripe: pending key
- Email: mocked
