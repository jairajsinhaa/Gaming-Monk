# Gaming Monk API — Auth starter

Node.js + Express + PostgreSQL + Prisma ORM 5.22 authentication starter.

## Setup
1. Install Node.js 20+ and PostgreSQL.
2. From this folder run `npm install`.
3. Copy `.env.example` to `.env`, set DATABASE_URL and a private JWT_SECRET (32+ random characters).
4. Run `npx prisma generate`.
5. Run `npx prisma migrate dev --name init`.
6. Run `npm run dev`.

API: `GET /api/health`, `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`.

Register/login JSON: `{"email":"player@example.com","password":"at-least-8-chars"}`.
For /me send `Authorization: Bearer <token>`.

## Security notes
- Public signup always creates PLAYER; never accept role from client input.
- Passwords are bcrypt-hashed; auth tokens expire after 2 hours.
- Configure CLIENT_ORIGIN to your exact deployed frontend origin.
- Use HTTPS, secret manager/environment variables, email verification, password reset, monitoring and backups before production.
- Admin/Super Admin accounts must be provisioned through a controlled trusted process, not public registration.
- This starter does not implement money, deposits, withdrawals, tournament entry fees, or a production wallet.
- If integrating an existing database, inspect and reconcile its current Prisma schema/migrations before running migrations. Do not overwrite an existing schema.
