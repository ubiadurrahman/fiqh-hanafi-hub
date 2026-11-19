# Fiqh-e-Hanafi Hub

A web-based Islamic learning and scholar management platform (Final Year Project, University of Buner).

- **frontend/** – React + TypeScript + Vite + Tailwind CSS + Framer Motion
- **backend/** – Node.js + Express + TypeScript + Zod + Prisma + PostgreSQL

## Features
- Holy Quran: all 114 surahs, Arabic (Uthmani) + English translation, **verse-by-verse audio** with 4 reciters,
  speed control, auto-advance, "continue where you left off", adjustable text size
- Hadith, Islamic knowledge, articles, fatwas, Q&A (sample content in `frontend/src/data/content.ts`)
- Verified scholar directory + profile pages (only APPROVED scholars are public)
- Auth: user registration, scholar registration (pending until approved), JWT login
- Admin dashboard: pending/approved/rejected lists, review panel, approve/reject (reason required), login-attempt audit
- Light / Dark / System theme (persisted, no flash on load)
- Responsive, animated UI; respects `prefers-reduced-motion`

## Setup

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env        # then edit DATABASE_URL and JWT_SECRET
npm run prisma:migrate      # creates tables (name the migration "init")
# create the first admin (set ADMIN_EMAIL / ADMIN_PASSWORD in .env first)
npm run setup-admin         # then delete ADMIN_PASSWORD from .env
npm run dev                 # http://localhost:5000/api
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173 (proxies /api to :5000)
```

Production: `npm run build` in both folders; set `VITE_API_URL` to your API URL,
`CORS_ORIGINS` to your site origin, `TRUST_PROXY=1` behind a proxy, and serve over HTTPS.

## API (all under /api)
| Method | Route | Access |
|---|---|---|
| GET | `/`, `/health` | Public |
| POST | `/auth/register`, `/auth/register-scholar`, `/auth/login` | Public |
| GET | `/scholars`, `/scholars/:id` | Public (approved only) |
| GET | `/admin/scholars/pending`, `/admin/scholars?status=`, `/admin/scholars/stats`, `/admin/scholars/:id`, `/admin/scholars/:scholarId/login-attempts` | Admin |
| PATCH | `/admin/scholars/:id/approve`, `/admin/scholars/:id/reject` | Admin |

## Security measures
- bcrypt (cost 12) password hashing; timing-equalised login to resist account enumeration by response time
- JWT (HS256 pinned, 2h expiry); role re-read from the database on every request
- RBAC middleware; admin routes need a valid token **and** ADMIN role
- Scholars cannot sign in until approved; every scholar sign-in attempt is logged (IP, user agent, result)
- Zod validation on all inputs; strong password policy; 10 KB body limit
- Helmet security headers; strict CORS allow-list; rate limiting (global, auth, login)
- Generic 500 errors (no stack traces to clients); secrets only in `.env` (git-ignored)
- No hard-coded admin credentials — `setup-admin` reads them from the environment
- Public scholar API never exposes email addresses

## HCI principles applied
Visibility of system status (skeleton loaders, spinners, toasts), error prevention (inline validation, password
strength meter, confirm-with-reason before rejecting), recognition over recall (clear nav, "continue reading"),
consistency (shared components/tokens), accessibility (skip link, ARIA, focus rings, 44px touch targets, labelled
controls, keyboard support, reduced motion, AA-contrast themes), progressive disclosure (accordions, drawer),
flexibility (text size, reciter, speed, theme).

## Notes
- Quran text & audio are fetched in the browser from alquran.cloud and islamic.network (internet required).
- Hadith/fatwa/knowledge entries are sample educational content: have a qualified scholar verify before public use.
- Auth token is kept in localStorage (matching the proposal's Bearer design). For stricter hardening, move to
  httpOnly cookies + refresh tokens (listed as future work in the proposal).
