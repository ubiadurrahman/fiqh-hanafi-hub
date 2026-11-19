# MyProject — Complete Project Documentation

**Fiqh-e-Hanafi Hub / Islamic Guidance and Knowledge Platform**
**Final Year Project — BS Computer Science (BSCS), 7th Semester**
**Govt. Degree College Dagger Buner — Affiliated with the University of Buner**
**Academic Year: 2026**

---

## 1. Project Identity

| Field | Value |
|-------|-------|
| **College** | Govt. Degree College Dagger Buner (Affiliated College of the University of Buner) |
| **Degree Program** | BS Computer Science (BSCS) |
| **Submission** | 7th Semester — FYP Proposal / Final Project |
| **Academic Year** | 2026 |
| **Project Title** | Islamic Guidance and Knowledge Platform — A Web-Based Platform for Structured Questions, Scholar-Reviewed Answers, and Reliable Islamic References |
| **Project Supervisor** | Prof. Zahid Ali |
| **Head of Department** | Prof. Khalil Khan |

### Project Team

| Member | Registration Number |
|--------|--------------------|
| Waseem Abbas | 2023-GCDUoB-127 |
| Ubaid ur Rahman | 2023-GCDUoB-137 |
| Anwar Aziz | 2023-GCDUoB-147 |

---

## 2. Abstract

The Islamic Guidance and Knowledge Platform is a web-based application that provides an organized way for users to submit Islamic questions and receive responses from authorized scholars or moderators. The platform helps users access scholar-reviewed answers supported by references to the Quran and authentic Hadith sources, where applicable.

Key capabilities include:
- User registration and authentication with role-based access control
- Question submission, categorization, and status tracking
- Scholar/moderator profiles, answer drafting, source references, and publication
- Searchable knowledge library of approved answers by category and keyword
- Administrator dashboard for scholar approval, role management, content moderation, and audit records

**Security boundary:** The platform does NOT issue binding religious rulings (fatwas), does NOT replace qualified scholars, and does NOT present AI-generated answers as authoritative religious guidance. Any future AI feature would only retrieve from approved content with human oversight.

---

## 3. Problem Statement

Users seeking Islamic guidance online often encounter:
- Fragmented content across websites, social media, and messaging groups
- Answers without clear citations or traceable references
- Uncertainty about the qualifications or authorization of the person responding
- No consistent question tracking, topic-based search, moderation, or transparent review process

This project addresses these problems with a centralized platform where questions are organized by topic, answered by authorized contributors, and source references are displayed alongside each published answer.

---

## 4. Aim and Objectives

### Aim
To design and develop a secure, user-friendly web platform for submitting Islamic questions and accessing scholar-reviewed answers with references.

### Objectives

1. **Secure account management** — Registration, login, logout, and role-based access for users, scholars/moderators, and administrators.
2. **Question submission & tracking** — Users can submit questions and view their submission status.
3. **Scholar-reviewed answers** — Only authorized scholars/moderators can review questions and publish answers with Quran and Hadith references where applicable.
4. **Organization & search** — Questions and answers organized by categories with keyword search.
5. **Scholar profiles** — Public profiles showing qualifications, specialization, institution, and experience.
6. **Administrative workflow** — Admin approval of contributor accounts, content moderation, and reporting.
7. **Audit trail** — Clear records of question status, answer publication, edits, and moderation actions.
8. **Evaluation** — Functional testing, security checks, and usability feedback.
9. **Future-ready architecture** — Modular design supporting optional AI-assisted retrieval in a later phase (subject to supervisor approval and safeguards).

---

## 5. Scope

### 5.1 Included in Initial Version

- User registration, login, logout, and profile management
- Question submission with category and optional supporting context
- Question status tracking (Submitted, Under Review, Answered, Needs Clarification) — *partially implemented (see Section 13)*
- Scholar/moderator dashboard for reviewing questions
- Answer publishing with source details (surah/ayah, Hadith collection, reference number)
- Public browsing and searching of approved answers by category and keyword
- Administrator dashboard for user roles, scholar approval, categories, reports, and content moderation
- Responsive interface for desktop and mobile browsers

### 5.2 Excluded from Initial Version

- Automatic binding religious rulings or replacement of qualified scholar consultation
- Live video calls, payments, mobile applications, large-scale multilingual support
- AI-generated answers treated as authoritative religious guidance (any later AI feature must retrieve from approved content, show sources, disclose limitations, and allow human review)

---

## 6. Target Users and Stakeholders

---

## 7. System Modules (Proposed vs. Implemented)

| Module | Description | Status |
|--------|-------------|--------|
| **Authentication and Authorization** | Account creation, secure login, password handling, role-based permissions | ✅ Fully implemented |
| **Question Management** | Question submission, categorization, status tracking, clarification requests | ⚠️ Partially (status tracking missing from DB) |
| **Scholar and Answer Management** | Scholar profiles, answer drafting, source references, review, publication | ✅ Fully implemented |
| **Search and Knowledge Library** | Searchable approved answers, categories, keywords, topic pages | ⚠️ Partially (keyword search yes, category browsing partial) |
| **Administration and Moderation** | Scholar approval, role management, content review, reports, audit records | ⚠️ Partially (scholar approval yes; category CRUD and content reporting no) |
| **Future AI-Assisted Retrieval** | Retrieve from approved knowledge collection with citations; not authoritative | ❌ Not implemented (explicitly future/optional) |

---

## 8. Technology Stack

| Component | Technology / Approach |
|-----------|----------------------|
| **Frontend** | React.js with TypeScript, Tailwind CSS, Vite, Framer Motion, Lucide React, React Router DOM |
| **Backend** | Node.js with Express.js, TypeScript, Zod validation |
| **Database** | PostgreSQL |
| **ORM** | Prisma ORM (Prisma Client JS) |
| **Authentication** | bcryptjs (cost 12), JWT (HS256, 2h expiry), role re-read from DB on every request |
| **Security** | Helmet, CORS allow-list, express-rate-limit, environment-based secrets, `X-Content-Type-Options: nosniff` on uploads |
| **File Uploads** | Multer (memory storage), magic-byte image validation (JPG/PNG/WebP), max 4 files, 5 MB each |
| **Translation** | `axios` (HTTP client), `franc` (language detection), MyMemory API (translation), Google Input Tools API (transliteration) |
| **Version Control** | Git and GitHub |
| **Testing** | Manual QA checklist, TypeScript type-checking (`tsc --noEmit`), live HTTP verification, Vitest unit + integration tests |
| **Deployment** | Hosting platform to be selected (cost/availability/departmental requirements) |

---

## 9. Database Schema (Prisma)

**File:** `backend/prisma/schema.prisma`

### Enums

```prisma
enum Role { USER, SCHOLAR, ADMIN }
enum ApplicationStatus { PENDING, APPROVED, REJECTED }
enum ArticleStatus { DRAFT, PUBLISHED }
```

### Models

| Model | Key Fields | Relationships |
|-------|-----------|---------------|
| **User** | id (cuid), name, email (unique), passwordHash, role (default USER), createdAt, updatedAt | scholarProfile (1:1), reviewedProfiles (1:N), questions (1:N), answers (1:N), bookmarks (1:N), loginAttempts (1:N), posts (1:N), postLikes (1:N), articles (1:N) |
| **ScholarProfile** | id, userId (unique), qualification, specialization, institution, experienceYears, city (?), bio, status (default PENDING), rejectionReason (?), reviewedAt (?), reviewedById (?), createdAt, updatedAt | user (N:1), reviewedBy (N:1 to User), loginAttempts (1:N) |
| **LoginAttempt** | id, email, success, reason (?), ip (?), userAgent (?), createdAt, userId (?), scholarProfileId (?) | user (N:1), scholarProfile (N:1) |
| **Category** | id, name (unique), slug (unique) | questions (1:N) |
| **Question** | id, title, body, originalBody, detectedLanguage (?), createdAt, askedById, categoryId (?), answers (1:N) | askedBy (N:1 to User), category (N:1) |
| **Answer** | id, body, reference, createdAt, questionId, scholarId | question (N:1), scholar (N:1 to User) |
| **Bookmark** | id, kind, reference, createdAt, userId | user (N:1) |
| **Post** | id, body, images (String[]), createdAt, authorId | author (N:1 to User), likes (1:N) |
| **PostLike** | id, createdAt, postId, userId | post (N:1), user (N:1) |
| **Article** | id, title, excerpt, body, status (default DRAFT), createdAt, updatedAt, publishedAt (?), authorId | author (N:1 to User) |

### ⚠️ Gap: Question Status Tracking

The proposal specifies question status values: `Submitted`, `Under Review`, `Answered`, `Needs Clarification`. However, the current `Question` model has **no `status` field**. Questions are only filterable by `answered`/`unanswered`. This needs to be added (see Section 13).



| Stakeholder | Role / Capabilities |
|-------------|--------------------|
| **General users** | Submit questions, browse published answers, search by topic, view scholar profiles |
| **Authorized scholars/moderators** | Review questions, prepare answers, add references, request clarification |
| **Administrator** | Verify contributor accounts, manage roles and categories, review reports, maintain platform quality |
| **Project supervisor & department** | Review academic scope, milestones, and final deliverables |

---


---

## 10. Backend Architecture

**Entry point:** `backend/src/index.ts`

### Middleware Stack (applied in order)

1. `helmet()` — Security headers
2. `cors()` — Strict origin allow-list (from `CORS_ORIGINS` env)
3. `express.json({ limit: "100kb" })` — Body parser with size limit
4. `apiLimiter` — Global rate limit: 300 requests / 15 min
5. `/uploads` static — Image serving with `nosniff`, sandboxed CSP, no directory listing
6. Route-specific rate limiters (auth, login, ask, answer, post, article, like)

### Route Mounting (all under `/api`)

| Route File | Mount Path | Purpose |
|------------|-----------|---------|
| `auth.ts` | `/api/auth` | User registration, scholar registration, login |
| `scholars.ts` | `/api/scholars` | Public scholar directory (approved only) |
| `admin.ts` | `/api/admin` | Admin scholar management (approve/reject/delete, stats, login attempts) |
| `questions.ts` | `/api/questions` | Question listing, submission, answering |
| `posts.ts` | `/api/posts` | Scholar feed posts with images and likes |
| `articles.ts` | `/api/articles` | Scholar articles (draft/publish) |

### Key Middleware Functions

- **`requireAuth`** — Validates JWT Bearer token, re-reads role from database, attaches `req.user`
- **`requireRole(...roles)`** — RBAC guard; checks `req.user.role` against allowed roles
- **`requireApprovedScholar`** — Ensures user is SCHOLAR and `ScholarProfile.status === "APPROVED"`
- **`optionalAuth`** — Verifies token if present but never fails (for public endpoints that need viewer context)
- **`rateLimit.ts`** — Multiple limiters: `apiLimiter`, `authLimiter`, `loginLimiter`, `askLimiter`, `answerLimiter`, `postLimiter`, `articleLimiter`, `likeLimiter`

### Error Handling

- `HttpError` class for controlled HTTP errors (400, 401, 403, 404, 409, etc.)
- `ZodError` → 400 with field-level error messages
- `MulterError` → 400 with upload-specific messages
- Generic 500 — never leaks stack traces to clients
- `notFound` → 404 for unmatched routes

### Configuration (`config.ts`)

Validated via Zod at startup; process exits if invalid:

| Variable | Default | Constraint |
|----------|---------|------------|
| `PORT` | 5000 | positive integer |
| `NODE_ENV` | "development" | development \| production \| test |
| `DATABASE_URL` | (required) | non-empty string |
| `JWT_SECRET` | (required) | min 32 characters |
| `JWT_EXPIRES_IN` | "2h" | string |
| `CORS_ORIGINS` | "http://localhost:5173" | comma-separated origins |

---

## 11. API Endpoints (Complete Reference)

All routes are prefixed with `/api`.

### Authentication (`/api/auth`)

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/register` | Public | Register a regular USER account |
| POST | `/register-scholar` | Public | Register as SCHOLAR (creates User + ScholarProfile with status PENDING) |
| POST | `/login` | Public | Authenticate; returns JWT token; blocks unapproved scholars |

**Registration validation (Zod):**
- `name`: 2–80 chars, trimmed
- `email`: valid email, max 254 chars, lowercased
- `password`: 10–128 chars, must include lowercase, uppercase, and digit

**Scholar registration additional fields:**
- `qualification`: 3–150 chars
- `specialization`: must be one of: Hanafi Fiqh, Hadith, Tafsir, Tafseer, Quran Recitation (Tajweed), Aqeedah, Arabic Language
- `institution`: 2–150 chars
- `experienceYears`: integer 0–80
- `city`: optional, 2–80 chars
- `bio`: 50–1000 chars

### Scholars (`/api/scholars`)

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/` | Public | List approved scholars (search by `q`) |
| GET | `/:id` | Public | Get single approved scholar by ID |

### Admin (`/api/admin`) — Requires ADMIN role

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/scholars/pending` | List pending scholar applications |
| GET | `/scholars?status=` | List scholars by status (PENDING/APPROVED/REJECTED) |
| GET | `/scholars/stats` | Count of scholars grouped by status |
| GET | `/scholars/:id` | Get scholar application details |
| GET | `/scholars/:scholarId/login-attempts` | Audit log of sign-in attempts for a scholar |
| PATCH | `/scholars/:id/approve` | Approve scholar (sets status APPROVED, records reviewer) |
| PATCH | `/scholars/:id/reject` | Reject scholar (requires reason ≥ 5 chars) |
| DELETE | `/scholars/:id` | Delete scholar application + user account (PENDING/REJECTED only) |

### Questions (`/api/questions`)

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/` | Public | List questions with pagination, keyword search (`q`), answered/unanswered filter |
| POST | `/` | Authenticated (USER+) | Submit a new question (title ≥ 10, body ≥ 10). Body is auto-translated/transliterated to Urdu; `originalBody` stores the raw input and `detectedLanguage` records the detected source. |
| POST | `/:id/answers` | Authenticated + SCHOLAR + APPROVED | Post an answer to a question (body ≥ 20, reference ≥ 5, max 500) |

### Posts (`/api/posts`) — Scholar social feed

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/` | Public + optional auth | Cursor-paginated feed of posts by approved scholars |
| POST | `/` | Authenticated + APPROVED SCHOLAR | Create post (body + up to 4 images: JPG/PNG/WebP, ≤5 MB each) |
| POST | `/:id/like` | Authenticated | Like/unlike a post |
| DELETE | `/:id` | Author or ADMIN | Delete a post (and its images) |

### Articles (`/api/articles`) — Long-form scholar content

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/` | Public | List published articles by approved scholars (cursor-paginated) |
| GET | `/mine` | Authenticated + APPROVED SCHOLAR | List scholar's own articles (including drafts) |
| GET | `/:id` | Public + optional auth | View article (drafts visible only to author) |
| POST | `/` | Authenticated + APPROVED SCHOLAR | Create article (draft or publish; publish requires ≥ 200 chars body) |
| PATCH | `/:id` | Author or ADMIN | Update article |
| DELETE | `/:id` | Author or ADMIN | Delete article |


---

## 12. Frontend Architecture

**Entry point:** `frontend/src/main.tsx` → `frontend/src/App.tsx`

### Routing (React Router DOM)

| Path | Page Component | Access |
|------|---------------|--------|
| `/` | `Home` | Public |
| `/quran` | `Quran` | Public |
| `/quran/:id` | `SurahReader` | Public |
| `/hadith` | `Hadith` | Public |
| `/knowledge` | `Knowledge` | Public |
| `/articles` | `Articles` | Public |
| `/articles/:id` | `ArticleView` | Public |
| `/feed` | `Feed` | Public |
| `/write` | `ArticleEditor` | Protected (SCHOLAR role) |
| `/write/:id` | `ArticleEditor` | Protected (SCHOLAR role) |
| `/fatwas` | `Fatwas` | Public |
| `/qna` | `QnA` | Public |
| `/scholars` | `Scholars` | Public |
| `/scholars/:id` | `ScholarProfile` | Public |
| `/signin` | `SignIn` | Public |
| `/signup` | `SignUp` | Public |
| `/scholar-register` | `ScholarRegister` | Public |
| `/admin/scholars` | `AdminScholars` | Protected (ADMIN role) |
| `*` | `NotFound` | Public |

### Core Frontend Files

| File | Purpose |
|------|---------|
| `frontend/src/lib/api.ts` | API client wrapper with Bearer token from localStorage (`fh_token`), error handling, TypeScript interfaces |
| `frontend/src/context/AuthContext.tsx` | Authentication state management |
| `frontend/src/context/ThemeContext.tsx` | Light/Dark/System theme persistence |
| `frontend/src/context/ToastContext.tsx` | Toast notifications |
| `frontend/src/components/ProtectedRoute.tsx` | Route guard by role |
| `frontend/src/lib/quran.ts` | Quran API client (alquran.cloud), 4 verified reciters, audio URL whitelist, last-read persistence |
| `frontend/src/lib/hadithApi.ts` | Hadith API integration |
| `frontend/src/data/content.ts` | Sample Islamic knowledge articles |
| `frontend/src/data/hadithBooks.ts` | 11 hadith book collections (6 major + 5 additional) |

### Frontend Components

| Component | Purpose |
|-----------|---------|
| `Navbar` | Top navigation with auth state |
| `Footer` | Site footer |
| `QnAFeed` | Question list + answer display |
| `PostCard` | Feed post display |
| `ProtectedRoute` | Role-based route protection |
| `ThemeToggle` | Light/dark/system theme switcher |
| `QuranArt`, `HadithBooks`, `Field`, `ui.tsx` | Reusable UI primitives |

### Authentication Flow (Frontend)

1. Token stored in `localStorage` under key `fh_token`
2. API client attaches `Bearer <token>` to all requests
3. On 401 response, dispatches `fh:unauthorized` window event
4. `ProtectedRoute` redirects unauthenticated/unauthorized users to sign-in
5. Token expiry: 2 hours (backend JWT)


---

## 13. Implementation Status: What Is Covered vs. Remaining

### ✅ Fully Covered (Implemented and Verified)

| Feature | Section in Proposal | Implementation Location |
|---------|-------------------|------------------------|
| User registration & login | §3 Obj.1, §4.1, §6 Mod.1 | `backend/src/routes/auth.ts`, `frontend/src/pages/SignUp.tsx`, `SignIn.tsx` |
| Role-based access (USER/SCHOLAR/ADMIN) | §3 Obj.1, §9 Req.7 | Prisma `Role` enum, `requireRole()` middleware |
| Scholar registration with credentials | §3 Obj.1, §4.1 | `POST /api/auth/register-scholar`, `ScholarRegister.tsx` |
| Scholar approval workflow (PENDING → APPROVED/REJECTED) | §3 Obj.5, §6 Mod.5, §9 Req.6 | `PATCH /api/admin/scholars/:id/approve` & `/reject`, `AdminScholars.tsx` |
| Only approved scholars publish answers | §3 Obj.3, §9 Req.3 | `requireRole("SCHOLAR")` + `requireApprovedScholar` middleware |
| Answers with source references | §3 Obj.3, §4.1, §9 Req.4 | `Answer.reference` field, `POST /api/questions/:id/answers` |
| Question submission | §3 Obj.2, §4.1 | `POST /api/questions`, `QnA.tsx` |
| Public browsing & search of answers | §3 Obj.4, §4.1, §9 Req.5 | `GET /api/questions` with `q` search + answered/unanswered filter |
| Scholar profiles (public, approved only) | §3 Obj.5, §6 Mod.3 | `GET /api/scholars`, `GET /api/scholars/:id` |
| Responsive UI (Tailwind CSS) | §4.1, §10 Usability | `frontend/src/` all pages |
| Security: bcrypt, JWT, Zod, rate limiting, Helmet, CORS | §10 Security | Backend middleware, `config.ts`, `errors.ts` |
| Technology stack match | §7 | React/TS/Tailwind + Node/Express + PostgreSQL + Prisma |
| Git version control | §7 | `.gitignore`, repository structure |
| Quran audio with 4 verified reciters | (Proposal §4.1 — knowledge features) | `frontend/src/lib/quran.ts`, `SurahReader.tsx` |
| Hadith book library (11 collections) | (Proposal §4.1 — knowledge features) | `frontend/src/data/hadithBooks.ts`, `Hadith.tsx` |
| Articles system (draft/publish) | (Proposal §4.1 — knowledge features) | `backend/src/routes/articles.ts`, `ArticleEditor.tsx`, `ArticleView.tsx` |
| Scholar feed posts with images & likes | (Proposal §4.1 — knowledge features) | `backend/src/routes/posts.ts`, `Feed.tsx` |
| Admin scholar delete (PENDING/REJECTED only) | (§6 Mod.5 — enhancement) | `DELETE /api/admin/scholars/:id` |


### ⚠️ Partially Covered (Implemented but Missing Details)

| Feature | Section in Proposal | Gap |
|---------|-------------------|-----|
| Question status tracking (Submitted / Under Review / Answered / Needs Clarification) | §3 Obj.2, §4.1, §9 Req.2 | **No `status` field on `Question` model.** Only `answered`/`unanswered` filter exists. Needs DB migration + API + UI. |
| Scholar/moderator dashboard for assigned/available questions | §4.1 | Scholars can answer any question, but no dedicated dashboard listing available/assigned questions. |
| Category management (admin CRUD) | §4.1, §9 Req.6 | `Category` model exists and questions link to it, but **no admin routes** to create/edit/delete categories. No category browsing UI. |
| Content moderation & reporting | §6 Mod.5, §9 Req.6 | No flag/report system, no admin content review queue, no moderation audit log (only `LoginAttempt` is audited). |
| User role management (admin changing USER→ADMIN) | §9 Req.6 | No admin route to change a user's role. |
| Records of answer edits & moderation actions | §3 Obj.6 | Answers have `createdAt` and `reference`, but **no edit history** table and no moderation action log. |
| Searchable knowledge library by category | §3 Obj.4, §6 Mod.4 | Keyword search exists, but no dedicated category-based browsing UI separate from Q&A feed. |

### ❌ Not Covered (Remaining Work)

| Feature | Section in Proposal | Notes |
|---------|-------------------|-------|
| Question status enum + workflow | §3 Obj.2, §4.1 | Add `status` field to `Question` model, routes to update it, UI status badges |
| Category CRUD (admin) | §4.1, §9 Req.6 | Admin routes + frontend category management UI |
| Content flagging/reporting | §6 Mod.5, §9 Req.6 | Report content, admin review queue, moderation audit records |
| Scholar dashboard (assigned/available questions) | §4.1 | Dedicated view for scholars |
| Formal automated test suite | §8 Testing, §10 | Validation report exists but no automated unit/integration test files |
| Deployment | §7 Deployment, §8 | Not deployed; PostgreSQL not provisioned in this environment |
| User guide / final report | §8 Final delivery | Not yet produced |
| AI-assisted retrieval | §6 Mod.6, §16 | Explicitly future/optional; not in initial scope |


---

## 14. Risks and Mitigation

| Risk | Mitigation |
|------|-----------|
| Unverified contributors | Administrator approval required before a scholar account can publish answers (`status: PENDING` → `APPROVED`) |
| Incorrect or incomplete references | References are required (≥ 5 chars) on every answer; part of the review workflow; content can be corrected or withdrawn |
| Scope expansion | Core web platform prioritized; AI and other advanced features treated as optional |
| Privacy or access-control errors | Role checks on all protected routes, Zod input validation, secure password hashing (bcrypt cost 12), testing of restricted routes |
| Limited time or team availability | Milestones, Git version control, regular supervisor check-ins, clear task ownership |
| Account enumeration via timing | Timing-equalized login (dummy bcrypt hash when email not found) |
| Token theft | JWT in localStorage (Bearer design); future work: httpOnly cookies + refresh tokens |
| Arbitrary file upload | Magic-byte image validation (JPG/PNG/WebP only), max 4 files, 5 MB each, random filenames, `nosniff` header |

---

## 15. Ethical Considerations

- The platform distinguishes educational information from personal religious rulings; it does **not** claim to settle differences among Islamic schools of thought.
- Contributor credentials and authorization are checked by the administrator according to a process approved by the project supervisor.
- Published answers should cite sources as precisely as possible.
- User data is handled responsibly; only necessary data is collected.
- If AI-assisted retrieval is added later, it must clearly identify itself as a support feature, present source material where available, communicate uncertainty, and direct users to qualified scholars for matters requiring personal or specialist judgment.
- AI-generated answers will **not** be treated as authoritative religious guidance.

---

## 16. Setup and Installation (Step-by-Step)

### Prerequisites

- Node.js (v18+ recommended)
- PostgreSQL database (local or hosted)
- Git

### 1. Clone the Repository

```bash
git clone <repository-url>
cd fiqh-hanafi-hub-main
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file and configure
cp .env.example .env
# Edit .env: set DATABASE_URL, JWT_SECRET (32+ chars), CORS_ORIGINS, ADMIN_EMAIL, ADMIN_PASSWORD

# Generate Prisma client
npm run prisma:generate

# Run migrations (creates all tables)
npm run prisma:migrate
# Name the migration "init" when prompted

# Create the first administrator
npm run setup-admin
# Then remove ADMIN_PASSWORD from .env for security

# Start the development server
npm run dev
# Backend runs on http://localhost:5000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
# Frontend runs on http://localhost:5173
# Vite proxies /api to http://localhost:5000
```

### 4. Verify Installation

- Open `http://localhost:5173`
- Register a user account at `/signup`
- Register as a scholar at `/scholar-register` (application goes to PENDING)
- Sign in as admin (created via `setup-admin`) and approve the scholar at `/admin/scholars`
- Sign in as the approved scholar and post an answer at `/qna`
- Browse questions and answers publicly

### 5. Production Deployment

- Build backend: `npm run build` (runs `prisma generate && tsc`)
- Build frontend: `npm run build` (runs `tsc -b && vite build`)
- Set `NODE_ENV=production`
- Set `CORS_ORIGINS` to your production frontend URL
- Set `TRUST_PROXY=1` if behind a reverse proxy (nginx, Render, etc.)
- Serve over HTTPS
- Never commit `.env` (it is in `.gitignore`)


---

## 17. Validation and Testing Performed

| Check | Result |
|-------|--------|
| TypeScript type-check (backend) | ✅ PASS (`npx tsc --noEmit`) |
| TypeScript type-check (frontend) | ✅ PASS (`npx tsc --noEmit`) |
| Live HTTP: `POST /api/auth/register` | ✅ 201 + JWT token |
| Live HTTP: `POST /api/auth/login` | ✅ 200 + JWT token |
| Live HTTP: `POST /api/auth/register-scholar` | ✅ 201 "Application submitted" |
| Live HTTP: `GET /api/questions` | ✅ 200 with questions list |
| Live HTTP: `GET /api/admin/scholars?status=PENDING` | ✅ 200 returns pending applications |
| Live HTTP: `PATCH /api/admin/scholars/:id/approve` | ✅ 200 flips to APPROVED |
| Live HTTP: `DELETE /api/admin/scholars/:id` | ✅ 200 removes PENDING/REJECTED scholar |
| CDN audio test: alafasy, husary, minshawi, hudhaify | ✅ All HTTP 200 |
| CDN audio test: abdurrahmaansudais | ❌ HTTP 403 (dead — removed) |
| Zod schema edge cases (city: undefined, "", " ", "Peshawar", "A", 81 chars, null) | ✅ All behave correctly |

**Admin credentials:** Created via `npm run setup-admin` using `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env` (default email: `admin@example.com`).


---

## 18. Known Issues and Future Work

### Known Issues

1. **Question status field missing:** The `Question` model has no `status` enum field despite being specified in the proposal (Submitted, Under Review, Answered, Needs Clarification).
2. **No category CRUD:** Admin cannot create, edit, or delete categories through the API or UI.
3. **No content reporting:** Users cannot flag questions/answers; admin has no moderation review queue.
4. **No edit history:** Answers and questions have no revision/audit trail for edits.
5. **Token in localStorage:** Auth token is stored in `localStorage` (Bearer design). For stricter security, migrate to httpOnly cookies + refresh tokens.
6. **No automated tests:** Manual QA checklist exists; no Jest/Vitest test suite is configured.

### Recommended Next Steps (Priority Order)

1. Add `status` field to `Question` model + migration + API endpoints to update status + UI status badges.
2. Add admin category CRUD routes + frontend category management UI.
3. Add content flag/report system with admin review queue.
4. Add scholar dashboard for viewing available/assigned questions.
5. Write automated tests (unit + integration) for critical auth and Q&A flows.
6. Deploy to production hosting and prepare user guide + final report.


---

## 19. File Structure Overview

```
fiqh-hanafi-hub-main/
├── Myproject.md                          # This file — complete project documentation
├── FIXES_AND_VALIDATION_REPORT.md        # (RENAMED → Myproject.md) — previous validation report
├── README.md                             # Project README with setup and API overview
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma                 # Database schema (all models, enums, relations)
│   │   └── migrations/                   # Prisma migration history (4 migrations)
│   ├── src/
│   │   ├── index.ts                      # Express app entry, route mounting, middleware stack
│   │   ├── config.ts                     # Zod-validated environment configuration
│   │   ├── db.ts                         # PrismaClient singleton
│   │   ├── errors.ts                     # HttpError, asyncHandler, errorHandler, notFound
│   │   ├── uploads.ts                    # Multer image upload, magic-byte validation
│   │   ├── scripts/
│   │   │   └── setup-admin.ts            # Creates first admin from env variables
│   │   ├── middleware/
│   │   │   ├── auth.ts                   # JWT verification, requireAuth, requireRole
│   │   │   ├── scholar.ts                # requireApprovedScholar
│   │   │   ├── rateLimit.ts              # All rate limiters
│   │   │   └── optionalAuth.ts           # Optional token verification
│   │   └── routes/
│   │       ├── auth.ts                   # Register, register-scholar, login
│   │       ├── scholars.ts               # Public scholar directory
│   │       ├── admin.ts                  # Admin scholar management (approve/reject/delete/stats)
│   │       ├── questions.ts              # Question list, submit, answer
│   │       ├── posts.ts                  # Scholar feed, posts, likes, images
│   │       └── articles.ts               # Articles (draft/publish/view/edit/delete)
│   │   ├── utils/
│   │   │   └── translateToUrdu.ts        # Language detection + Urdu translation/transliteration
│   ├── .env                              # (git-ignored) Environment variables
│   ├── .env.example                      # Environment variable template
│   ├── package.json                      # Backend dependencies and scripts
│   └── tsconfig.json                     # TypeScript configuration
├── frontend/
│   ├── src/
│   │   ├── App.tsx                       # Route definitions (React Router)
│   │   ├── main.tsx                      # React entry point
│   │   ├── index.css                     # Tailwind CSS base styles
│   │   ├── lib/
│   │   │   ├── api.ts                    # API client, TypeScript interfaces
│   │   │   ├── format.ts                 # Formatting utilities
│   │   │   ├── hadithApi.ts              # Hadith API integration
│   │   │   ├── quran.ts                  # Quran client, reciters, audio URLs
│   │   │   └── useInfiniteList.ts        # Infinite scroll hook
│   │   ├── context/
│   │   │   ├── AuthContext.tsx           # Authentication state
│   │   │   ├── ThemeContext.tsx          # Theme state (light/dark/system)
│   │   │   └── ToastContext.tsx          # Toast notifications
│   │   ├── components/
│   │   │   ├── Navbar.tsx, Footer.tsx, ProtectedRoute.tsx, ThemeToggle.tsx
│   │   │   ├── QnAFeed.tsx, PostCard.tsx, HadithBooks.tsx, QuranArt.tsx
│   │   │   ├── Field.tsx, ui.tsx         # Reusable form/UI primitives
│   │   │   └── ... (other UI components)
│   │   ├── data/
│   │   │   ├── content.ts                # Sample Islamic knowledge articles
│   │   │   └── hadithBooks.ts            # 11 hadith book collections
│   │   ├── pages/
│   │   │   ├── Home.tsx, QnA.tsx, Scholars.tsx, ScholarProfile.tsx
│   │   │   ├── Quran.tsx, SurahReader.tsx, Hadith.tsx, Knowledge.tsx
│   │   │   ├── Articles.tsx, ArticleView.tsx, ArticleEditor.tsx
│   │   │   ├── Feed.tsx, Fatwas.tsx
│   │   │   ├── SignIn.tsx, SignUp.tsx, ScholarRegister.tsx
│   │   │   ├── AdminScholars.tsx
│   │   │   └── NotFound.tsx
│   │   └── vite-env.d.ts
│   ├── .env                              # (git-ignored) VITE_API_URL
│   ├── .env.example                      # Frontend env template
│   ├── package.json                      # Frontend dependencies and scripts
│   ├── tailwind.config.js                # Tailwind configuration
│   ├── postcss.config.js                 # PostCSS configuration
│   ├── vite.config.ts                    # Vite configuration (with /api proxy)
│   └── tsconfig.json                     # TypeScript configuration
└── uploads/                              # Backend image upload directory (created at runtime)
```


---

## 20. How to Use This Document

This file (`Myproject.md`) is the single source of truth for the project. If you return to this project later:

1. **Read Sections 1–5** to understand what the project is and what it aims to achieve.
2. **Read Sections 8–11** to understand the database schema, backend routes, and API contracts.
3. **Read Section 12** to understand the frontend routing and component structure.
4. **Read Section 13** to see what is complete and what still needs to be built.
5. **Read Section 16** to set up and run the project locally.
6. **Read Section 18** for known issues and the recommended priority order for remaining work.

You should not need to open individual source files to understand the overall project architecture unless you are modifying specific implementation details.

---

*Document generated: 2026-11-19 | Project: Fiqh-e-Hanafi Hub / Islamic Guidance and Knowledge Platform | Team: Waseem Abbas, Ubaid ur Rahman, Anwar Aziz*

| `TRUST_PROXY` | 0 | non-negative integer |
