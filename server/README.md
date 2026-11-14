# Gaming Monk API — Auth + PostgreSQL

Node.js + Express + PostgreSQL + Prisma ORM 5.22 authentication starter.

## Database setup (first-time, empty database)
1. Install Node.js 20+ and PostgreSQL, and create an empty database named `gaming_monk`.
2. From this folder run `npm install`.
3. Copy `.env.example` to `.env` and set `DATABASE_URL` plus a private `JWT_SECRET` (32+ random characters). Never commit `.env`.
4. Generate the Prisma client: `npm run prisma:generate`.
5. Apply the checked-in migration: `npm run db:deploy`.
6. Start the API: `npm run dev`.

For local schema development only, use `npm run prisma:migrate -- --name describe_change`. Commit the generated migration folder along with schema changes. For production/staging, use `npm run db:deploy`, not `migrate dev`.

## Verify the database
- `npm run db:status` — reports whether migrations are applied.
- `GET /api/health` — API process health only; it does not prove database connectivity.
- `GET /api/health/db` — runs a lightweight database query and returns 200 only when PostgreSQL is reachable.

API routes: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`.

Register/login JSON: `{"email":"player@example.com","password":"at-least-8-chars"}`.
For /me send `Authorization: Bearer <token>`.

## Existing database warning
The checked-in initial migration is intended for a new, empty database. If your PostgreSQL database already contains tables or an older Gaming Monk schema, do not run this migration blindly. First back up the database and reconcile its schema/migration history.

## Security notes
- Public signup always creates PLAYER; never accept role from client input.
- Passwords are bcrypt-hashed; auth tokens expire after 2 hours.
- Configure CLIENT_ORIGIN to your exact deployed frontend origin.
- Use HTTPS, secret manager/environment variables, email verification, password reset, monitoring and backups before production.
- Admin/Super Admin accounts must be provisioned through a controlled trusted process, not public registration.
- This starter does not implement real-money deposits, withdrawals, tournament entry fees, or a production wallet.
