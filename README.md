# English Edu Backend

Node.js + PostgreSQL backend for English Edu. It provides authentication, cloud progress sync, mistake review, difficult words, admin statistics and a built-in admin dashboard.

## Requirements

- Node.js 20+
- PostgreSQL 16+ or Docker

## Local start

1. Copy `.env.example` to `.env` and replace `JWT_SECRET`.
2. Start PostgreSQL: `docker compose up -d postgres`
3. Install packages: `npm install`
4. Apply schema: `npm run migrate`
5. Create an admin: set `ADMIN_EMAIL`, `ADMIN_PASSWORD` and optional `ADMIN_NAME`, then run `npm run create-admin`.
6. Start the API: `npm run dev`

API: `http://localhost:4000/api/health`

Admin panel: `http://localhost:4000/admin/`

## API routes

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Create user |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/auth/me` | Current user |
| GET/PUT | `/api/progress` | Read or sync learning progress |
| GET/POST | `/api/progress/mistakes` | Read or save mistakes |
| PATCH | `/api/progress/mistakes/:id/resolve` | Mark mistake resolved |
| GET/POST | `/api/progress/difficult-words` | Read or save difficult words |
| PATCH | `/api/progress/difficult-words/:id` | Update mastery |
| GET | `/api/admin/stats` | Dashboard metrics |
| GET | `/api/admin/users` | Search users |
| PATCH | `/api/admin/users/:id/status` | Enable or disable user |

## Deployment notes

- Use a managed PostgreSQL database.
- Set a long random `JWT_SECRET`.
- Set `CORS_ORIGINS` to the final English Edu frontend domains.
- Run `npm run migrate` during release.
- Deploy the API behind HTTPS.
- Do not commit `.env`.

## Frontend connection

The current English Edu frontend still uses local storage. After the API is deployed, add its public URL to the frontend and map its local progress object to `PUT /api/progress`. Keep local storage as an offline cache.
