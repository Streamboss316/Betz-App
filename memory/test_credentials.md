# BETZ Test Credentials

## Admin (production-grade)
- Login URL: `/admin/login`
- Email: `streamboss316@gmail.com`
- Password: `sanaa3030`
- API: `POST /api/admin/login` returns an admin JWT with `role=admin`.
- **Override**: set `ADMIN_EMAIL` and `ADMIN_PASSWORD_HASH` (bcrypt) in `/app/backend/.env` to change creds without code changes.
- **JWT_SECRET**: required in env — backend now fails fast if missing.

## Demo accounts (seeded via `python seed_demo_users.py`)
- `demo@betz.com` (password used only by the seed script)
- `test@betz.com`
- `dp@betz.com`
- `speed@betz.com`

## Admin impersonation (replaces plaintext-password switching)
The frontend Admin Dashboard / Demo Mode no longer keep plaintext passwords. Switching uses an admin-only endpoint:
- `GET  /api/admin/demo-users` — list whitelisted demo accounts (returns user_id, email, name, balance).
- `POST /api/admin/impersonate` — body `{ "email": "demo@betz.com" }` → returns a user JWT for that demo account. Whitelist enforced (`DEMO_USER_EMAILS` in `admin_routes.py`).
- Admin Bearer token required on both endpoints.

## Notes
- Regular user JWT comes from `POST /api/auth/login` (email + password).
- Admin endpoints (`/api/admin/*`) require the **admin JWT** from `/api/admin/login`, not a user JWT.
- Tests should register fresh users via `POST /api/auth/register` (use `@betztest.com` TLD, not `.test`).
