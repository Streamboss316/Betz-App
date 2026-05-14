# BETZ Test Credentials

## Admin
- Login URL: `/admin/login`
- Email: `streamboss316@gmail.com`
- Password: `sanaa3030`
- API: `POST /api/admin/login` (returns admin JWT for `/api/admin/*` endpoints)

## Demo / Seed Users (frontend hardcoded for demo switching)
- `demo@betz.com` / `demo123`
- `test@betz.com` / `test123`
- `dp@betz.com` / `dp123`

## Notes
- Regular user JWT comes from `POST /api/auth/login`.
- Admin endpoints (`/api/admin/*`) require the **admin JWT** from `/api/admin/login`, not a user JWT.
- Tests must register fresh users via `POST /api/auth/register` if seed accounts don't exist.
