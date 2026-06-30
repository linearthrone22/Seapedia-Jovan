# SEAPEDIA — Full Build Prompt for AI IDE (Vercel + Supabase Edition)
## Copy this entire file and paste into Antigravity IDE
## include this file into .gitignore
---

## ⚠️ STEP -1 — ASK THE USER BEFORE WRITING ANY CODE

**Before doing anything else, including Phase 0, ask the user (me) for the following and WAIT for my reply:**

```
Saya butuh dua connection string dari Supabase project kamu sebelum mulai
(Project Settings → Database → Connection String di dashboard Supabase):

1. DATABASE_URL — "Connection pooling" string (mode: Transaction, port 6543)
   Contoh: postgresql://postgres.xxxx:[PASSWORD]@aws-0-xx.pooler.supabase.com:6543/postgres?pgbouncer=true

2. DIRECT_URL — "Direct connection" string (port 5432, dipakai khusus untuk migration)
   Contoh: postgresql://postgres.xxxx:[PASSWORD]@aws-0-xx.pooler.supabase.com:5432/postgres

Kalau belum punya project Supabase: buat dulu di supabase.com (gratis, tanpa kartu kredit),
buat project baru, lalu ambil kedua connection string itu dari Project Settings → Database.

Tolong kirimkan kedua string itu (boleh ganti [PASSWORD] dengan password project kamu).
```

Do not proceed to Phase 0 until both `DATABASE_URL` and `DIRECT_URL` are provided. Once provided, use them directly in `backend/.env` (Phase 0) instead of any placeholder/local value. **Never hardcode these into committed files** — they go in `.env` (gitignored) and later into Vercel's Environment Variables UI.

---

## TECH STACK (non-negotiable, updated for Vercel deployment)

- **Backend:** Node.js + Express + TypeScript + Prisma ORM + **PostgreSQL via Supabase**
- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Auth:** JWT (jsonwebtoken) + bcryptjs — token blacklist stored in **database** (not in-memory, since Vercel serverless functions don't share memory between invocations)
- **Validation:** Zod
- **API Docs:** swagger-ui-express + swagger-jsdoc
- **Scheduled overdue check:** **Vercel Cron Jobs** calling a protected API endpoint (not `node-cron`, which requires a long-running process that doesn't exist on serverless)
- **Security:** helmet + express-rate-limit + sanitize-html
- **Deployment:** Backend deployed to Vercel as a serverless function (via `api/index.ts` catch-all wrapping the Express app); Frontend deployed to Vercel as a standard Next.js project. **Two separate Vercel projects, same monorepo.**

---

## PROJECT STRUCTURE

```
seapedia/
├── backend/
│   ├── api/
│   │   └── index.ts          ← Vercel serverless entrypoint (wraps Express app)
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── app.ts             ← Express app (exported, no app.listen here)
│   ├── vercel.json
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── .env.local
│   ├── .env.example
│   └── package.json
└── README.md
```

---

## BEFORE YOU START

Create a GitHub repository named `seapedia` and set it to public. Then:

```bash
mkdir seapedia && cd seapedia
git init
git branch -M main
git remote add origin https://github.com/linearthrone22/Seapedia-Jovan.git


```

---

## ═══════════════════════════════════════
## PHASE 0 — PROJECT INITIALIZATION
## ═══════════════════════════════════════

### BACKEND SETUP

Create `backend/package.json`:
```json
{
  "name": "seapedia-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/dev-server.ts",
    "build": "tsc && npx prisma generate",
    "start": "node dist/dev-server.js",
    "seed": "ts-node --compiler-options '{\"module\":\"CommonJS\"}' prisma/seed.ts",
    "vercel-build": "npx prisma generate && npx prisma migrate deploy"
  },
  "dependencies": {
    "@prisma/client": "^5.0.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0",
    "express": "^4.18.2",
    "express-rate-limit": "^7.0.0",
    "helmet": "^7.0.0",
    "jsonwebtoken": "^9.0.0",
    "sanitize-html": "^2.11.0",
    "swagger-jsdoc": "^6.2.8",
    "swagger-ui-express": "^5.0.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.0",
    "@types/cors": "^2.8.0",
    "@types/express": "^4.17.0",
    "@types/jsonwebtoken": "^9.0.0",
    "@types/node": "^20.0.0",
    "@types/sanitize-html": "^2.9.0",
    "@types/swagger-jsdoc": "^6.0.0",
    "@types/swagger-ui-express": "^4.1.0",
    "prisma": "^5.0.0",
    "ts-node": "^10.9.0",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.0.0"
  }
}
```

> Note: `node-cron` is **deliberately not included** — it cannot run reliably on Vercel serverless. The overdue scheduler is implemented later as a Vercel Cron Job hitting an API route (see Level 6).

Create `backend/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*", "api/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

Create `backend/.env` — **fill in with the DATABASE_URL and DIRECT_URL the user gave you in Step -1**:
```
DATABASE_URL="<paste pooled connection string from user, port 6543, with ?pgbouncer=true>"
DIRECT_URL="<paste direct connection string from user, port 5432>"
JWT_SECRET="seapedia_super_secret_key_change_in_production"
PORT=4000
NODE_ENV=development
CRON_SECRET="seapedia_cron_secret_change_in_production"
```

Create `backend/.env.example`:
```
DATABASE_URL="postgresql://postgres.xxxx:[PASSWORD]@aws-0-xx.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxxx:[PASSWORD]@aws-0-xx.pooler.supabase.com:5432/postgres"
JWT_SECRET="your_jwt_secret_here"
PORT=4000
NODE_ENV=development
CRON_SECRET="your_cron_secret_here"
FRONTEND_URL="https://your-frontend.vercel.app"
```

Create `backend/prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

> `directUrl` is required because Supabase's pooled connection (port 6543, pgbouncer) cannot run schema migrations — only the direct connection (port 5432) can. Prisma uses `DATABASE_URL` for normal queries (fast, pooled, serverless-safe) and `DIRECT_URL` only for `migrate dev` / `migrate deploy`.

Run in backend/:
```bash
cd backend && npm install
```

Create `backend/api/index.ts` (Vercel serverless entrypoint):
```typescript
import app from '../src/app';
export default app;
```

Create `backend/vercel.json`:
```json
{
  "version": 2,
  "builds": [
    { "src": "api/index.ts", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/(.*)", "dest": "api/index.ts" }
  ]
}
```

Install the Vercel Node runtime types:
```bash
npm install -D @vercel/node
```

### FRONTEND SETUP

```bash
cd ../frontend
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"
npm install axios react-hook-form @hookform/resolvers zod
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input card badge toast dialog sheet separator
```

Create `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

Create `frontend/.env.example`:
```
NEXT_PUBLIC_API_URL=https://your-backend.vercel.app/api
```

### INITIAL COMMIT

```bash
cd ..
echo "node_modules/" >> .gitignore
echo "dist/" >> .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".next/" >> .gitignore
echo ".vercel" >> .gitignore
git add .
git commit -m "chore: initialize monorepo with backend (Express+Prisma+Supabase) and frontend (Next.js), configured for Vercel"
git push origin main
```

---

## ═══════════════════════════════════════
## LEVEL 1 — PUBLIC MARKETPLACE, AUTH & REVIEWS (20 pts)
## ═══════════════════════════════════════

### STEP 1.1 — PRISMA SCHEMA (Full schema for Level 1)

Append to `backend/prisma/schema.prisma` (keep the `generator`/`datasource` block from Phase 0):

```prisma
enum RoleType {
  ADMIN
  SELLER
  BUYER
  DRIVER
}

model User {
  id          String    @id @default(cuid())
  username    String    @unique
  email       String    @unique
  password    String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  roles       UserRole[]
  reviews     ApplicationReview[]
}

model UserRole {
  id        String    @id @default(cuid())
  userId    String
  role      RoleType
  createdAt DateTime  @default(now())

  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, role])
}

model ApplicationReview {
  id           String   @id @default(cuid())
  reviewerName String
  rating       Int
  comment      String
  userId       String?
  createdAt    DateTime @default(now())

  user         User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
}

model TokenBlacklist {
  id        String   @id @default(cuid())
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
}
```

> `TokenBlacklist` is a DB table (not an in-memory `Set`) because Vercel serverless functions are stateless between invocations — an in-memory blacklist would be silently ignored on the next cold start or different instance.

Run in backend/ (this uses `DIRECT_URL` automatically because of the `directUrl` field in schema.prisma):
```bash
npx prisma migrate dev --name level1_init
```

### STEP 1.2 — SEED FILE

Create `backend/prisma/seed.ts`:
```typescript
import { PrismaClient, RoleType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('Admin123!', 12);
  await prisma.user.upsert({
    where: { email: 'admin@seapedia.com' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@seapedia.com',
      password: adminPassword,
      roles: { create: [{ role: RoleType.ADMIN }] },
    },
  });

  console.log('Seed complete: admin@seapedia.com / Admin123!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
```

Run:
```bash
npm run seed
```

### STEP 1.3 — BACKEND CORE FILES

Create `backend/src/utils/prisma.ts`. **Important for serverless**: instantiate Prisma Client as a singleton to avoid exhausting Supabase's connection pool across repeated cold starts.
```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

Create `backend/src/middlewares/auth.middleware.ts`:
```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';

const JWT_SECRET = process.env.JWT_SECRET!;

export interface JwtPayload {
  userId: string;
  activeRole?: string;
  roles: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const blacklistToken = async (token: string, expiresAt: Date) => {
  await prisma.tokenBlacklist.upsert({
    where: { token },
    create: { token, expiresAt },
    update: {},
  });
};

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];

  const blacklisted = await prisma.tokenBlacklist.findUnique({ where: { token } });
  if (blacklisted) {
    return res.status(401).json({ error: 'Token has been invalidated' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const requireRole = (role: string) => (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.user.activeRole !== role) {
    return res.status(403).json({ error: `This action requires ${role} role. Your active role is ${req.user.activeRole || 'none'}.` });
  }
  next();
};

export const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.split(' ')[1];
};
```

Create `backend/src/controllers/auth.controller.ts`:
```typescript
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { blacklistToken, extractToken, JwtPayload } from '../middlewares/auth.middleware';
import { RoleType } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET!;
const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

const registerSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(6),
  roles: z.array(z.enum(['SELLER', 'BUYER', 'DRIVER'])).min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const register = async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { username, email, password, roles } = parsed.data;

  const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
  if (existing) return res.status(409).json({ error: 'Email or username already taken' });

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      username, email, password: hashed,
      roles: { create: roles.map(r => ({ role: r as RoleType })) },
    },
    include: { roles: true },
  });
  res.status(201).json({ message: 'Registered successfully', user: { id: user.id, username: user.username, email: user.email, roles: user.roles.map(r => r.role) } });
};

export const login = async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email }, include: { roles: true } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const roles = user.roles.map(r => r.role);
  const payload: JwtPayload = { userId: user.id, roles };
  if (roles.length === 1) payload.activeRole = roles[0];

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL_SECONDS });
  res.json({
    token,
    user: { id: user.id, username: user.username, email: user.email, roles },
    requiresRoleSelection: roles.length > 1 && !roles.includes('ADMIN'),
  });
};

export const selectRole = async (req: Request, res: Response) => {
  const { role } = req.body;
  if (!role) return res.status(400).json({ error: 'Role is required' });
  if (!req.user!.roles.includes(role)) return res.status(403).json({ error: 'You do not have this role' });

  const newToken = jwt.sign({ ...req.user, activeRole: role }, JWT_SECRET, { expiresIn: TOKEN_TTL_SECONDS });
  res.json({ token: newToken, activeRole: role });
};

export const logout = async (req: Request, res: Response) => {
  const token = extractToken(req);
  if (token) {
    const expiresAt = new Date(Date.now() + TOKEN_TTL_SECONDS * 1000);
    await blacklistToken(token, expiresAt);
  }
  res.json({ message: 'Logged out successfully' });
};

export const me = async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    include: { roles: true },
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({
    id: user.id, username: user.username, email: user.email,
    roles: user.roles.map(r => r.role),
    activeRole: req.user!.activeRole,
  });
};
```

Create `backend/src/controllers/review.controller.ts`:
```typescript
import { Request, Response } from 'express';
import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';
import { prisma } from '../utils/prisma';

const reviewSchema = z.object({
  reviewerName: z.string().min(1).max(100),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1).max(500),
});

const sanitize = (str: string) => sanitizeHtml(str, { allowedTags: [], allowedAttributes: {} });

export const createReview = async (req: Request, res: Response) => {
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { reviewerName, rating, comment } = parsed.data;

  const review = await prisma.applicationReview.create({
    data: {
      reviewerName: sanitize(reviewerName),
      rating,
      comment: sanitize(comment),
      userId: req.user?.userId ?? null,
    },
  });
  res.status(201).json(review);
};

export const getReviews = async (_req: Request, res: Response) => {
  const reviews = await prisma.applicationReview.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json(reviews);
};
```

Create `backend/src/routes/index.ts`:
```typescript
import { Router } from 'express';
import { register, login, selectRole, logout, me } from '../controllers/auth.controller';
import { createReview, getReviews } from '../controllers/review.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/select-role', verifyToken, selectRole);
router.post('/auth/logout', verifyToken, logout);
router.get('/auth/me', verifyToken, me);

router.post('/reviews', async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) return verifyToken(req, res, next);
  next();
}, createReview);
router.get('/reviews', getReviews);

router.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }));

export default router;
```

Create `backend/src/app.ts` — **the Express app, exported but NOT listening here** (Vercel handles invocation):
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import 'dotenv/config';
import router from './routes';

const app = express();

app.use(helmet());
app.use(cors({
  origin: [process.env.FRONTEND_URL || '', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: { error: 'Too many requests' } });
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

const generalLimiter = rateLimit({ windowMs: 60 * 1000, max: 100 });
app.use('/api', generalLimiter);

app.use('/api', router);

export default app;
```

Create `backend/src/dev-server.ts` — **local-only entrypoint, runs `app.listen`**, separate from the Vercel handler so local dev still works exactly like a normal Express app:
```typescript
import app from './app';

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running locally on http://localhost:${PORT}`));
```

### STEP 1.4 — FRONTEND LEVEL 1

(Identical to a standard build — no Vercel-specific changes needed on the frontend side beyond the env var.)

Create `frontend/lib/api.ts`:
```typescript
import axios from 'axios';

const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL });

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('seapedia_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('seapedia_token');
      localStorage.removeItem('seapedia_user');
      window.location.href = '/auth/login';
    }
    return Promise.reject(err);
  }
);

export default api;
```

Create `frontend/lib/auth.ts`:
```typescript
export interface AuthUser {
  id: string; username: string; email: string;
  roles: string[]; activeRole?: string;
}

export const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('seapedia_token') : null;
export const getUser = (): AuthUser | null => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('seapedia_user');
  return raw ? JSON.parse(raw) : null;
};
export const setAuth = (token: string, user: AuthUser) => {
  localStorage.setItem('seapedia_token', token);
  localStorage.setItem('seapedia_user', JSON.stringify(user));
};
export const clearAuth = () => {
  localStorage.removeItem('seapedia_token');
  localStorage.removeItem('seapedia_user');
};
export const isLoggedIn = () => !!getToken();
export const getActiveRole = () => getUser()?.activeRole;
```

Now build the following pages and components (full working implementations, same as a normal build):

**`frontend/components/layout/Navbar.tsx`** — logo left, Home/Products/Reviews nav, guest shows Login+Register, logged-in shows username + activeRole badge + Dashboard + Logout, responsive hamburger on mobile.

**`frontend/components/layout/Footer.tsx`** — simple footer.

**`frontend/app/layout.tsx`** — wraps Navbar + Footer + Toaster.

**`frontend/app/page.tsx`** — Landing page: hero, 3 feature cards (Buyer/Seller/Driver), Reviews section (fetch GET /api/reviews, ReviewCard grid, ReviewForm with name/rating 1-5/comment).

**`frontend/app/products/page.tsx`** — Product listing with search, 6 hardcoded dummy products for now (real data in Level 2).

**`frontend/app/products/[id]/page.tsx`** — Product detail, "Add to Cart" button gated to BUYER role.

**`frontend/app/auth/login/page.tsx`** — email+password form, redirect logic based on role count.

**`frontend/app/auth/register/page.tsx`** — username/email/password/confirm + role checkboxes (Buyer/Seller/Driver).

**`frontend/app/auth/select-role/page.tsx`** — role cards, POST /api/auth/select-role on click.

**Dashboard shells**, each protected (redirect to /auth/login if no token/wrong role):
- `frontend/app/buyer/dashboard/page.tsx`
- `frontend/app/seller/dashboard/page.tsx`
- `frontend/app/driver/dashboard/page.tsx`
- `frontend/app/admin/dashboard/page.tsx`

Create `frontend/components/layout/DashboardLayout.tsx` (reusable sidebar shell) and `frontend/components/auth/ProtectedRoute.tsx` (auth guard HOC).

---

### CHECK — VERIFY LEVEL 1 BEFORE COMMITTING

```bash
# Terminal 1:
cd backend && npm run dev

# Terminal 2:
cd frontend && npm run dev
```

Verify:
- [ ] http://localhost:3000 loads landing page with hero, features, reviews
- [ ] http://localhost:3000/products and /products/1 work with dummy data
- [ ] Register, login, role-select (if multi-role), correct dashboard
- [ ] Submit review with `<script>alert(1)</script>` shows as plain text, no execution
- [ ] Logout works, blacklisted token rejected on reuse
- [ ] GET http://localhost:4000/api/health returns `{ "status": "ok" }`
- [ ] Open Supabase dashboard, Table Editor, confirm User/UserRole/ApplicationReview/TokenBlacklist tables exist with data

### GIT — LEVEL 1

```bash
cd /path/to/seapedia
git add .
git commit -m "feat: level 1 - public marketplace, auth with multi-role, application reviews, dashboard shells (Supabase + Vercel-ready)"
git push origin main
```

---

## ═══════════════════════════════════════
## LEVEL 2 — SELLER EXPERIENCE (15 pts)
## ═══════════════════════════════════════

### STEP 2.1 — UPDATE PRISMA SCHEMA

Add to `backend/prisma/schema.prisma`:

```prisma
model Store {
  id          String    @id @default(cuid())
  name        String    @unique
  description String?
  sellerId    String    @unique
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  seller      User      @relation("SellerStore", fields: [sellerId], references: [id])
  products    Product[]
}

model Product {
  id          String    @id @default(cuid())
  name        String
  description String
  price       Float
  stock       Int       @default(0)
  imageUrl    String?
  isActive    Boolean   @default(true)
  storeId     String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  store       Store     @relation(fields: [storeId], references: [id])
}
```

Add `stores Store? @relation("SellerStore")` to the `User` model.

Run:
```bash
cd backend && npx prisma migrate dev --name level2_store_product
```

### STEP 2.2 — SELLER BACKEND ENDPOINTS

Create `backend/src/controllers/store.controller.ts`:
- `POST /api/seller/store` requireRole SELLER. Body name/description. Validate name non-empty max 100 chars. Unique violation returns 409. One store per seller, 400 if exists. Return created store.
- `GET /api/seller/store` requireRole SELLER. Own store plus product count, 404 if none.
- `PUT /api/seller/store` requireRole SELLER. Update fields, re-validate uniqueness excluding own store.
- `GET /api/stores/:id` public. Store info plus paginated active products.

Create `backend/src/controllers/product.controller.ts`:
- `POST /api/seller/products` requireRole SELLER. Validate price greater than 0, stock at least 0. Seller must own a store. Associate with seller storeId.
- `GET /api/seller/products` requireRole SELLER. All own products newest first.
- `PUT /api/seller/products/:id` requireRole SELLER. Verify ownership, update.
- `DELETE /api/seller/products/:id` requireRole SELLER. Verify ownership, soft delete isActive false.
- `GET /api/products` public. Active products with store info, search query, pagination.
- `GET /api/products/:id` public. Product plus store info, 404 if missing or inactive.

Add routes to `backend/src/routes/index.ts`.

### STEP 2.3 — UPDATE SEED

Update `backend/prisma/seed.ts`: add seller1@seapedia.com / Seller123! role SELLER, store "Toko Elektronik Jaya", 5 products. Run `npm run seed`.

### STEP 2.4 — SELLER FRONTEND PAGES

- `frontend/app/seller/store/page.tsx` create/edit store form plus info card.
- `frontend/app/seller/products/page.tsx` product table with Edit/Delete, Add Product button.
- `frontend/app/seller/products/new/page.tsx` create form.
- `frontend/app/seller/products/[id]/edit/page.tsx` pre-filled edit form.
- Update `frontend/app/products/page.tsx` and `/products/[id]/page.tsx` to use real API instead of dummy data, add search.
- `frontend/app/stores/[id]/page.tsx` public store page.

---

### CHECK — VERIFY LEVEL 2

- [ ] Seller1 login, create/view store, CRUD products
- [ ] Duplicate store name returns 409 error shown
- [ ] /products shows real DB data, search works
- [ ] Unauthorized product edit attempt returns 403
- [ ] Check Supabase Table Editor: Store and Product rows present

### GIT — LEVEL 2

```bash
git add .
git commit -m "feat: level 2 - seller store management, product CRUD, public catalog connected to Supabase"
git push origin main
```

---

## ═══════════════════════════════════════
## LEVEL 3 — BUYER WALLET, CART & CHECKOUT (20 pts)
## ═══════════════════════════════════════

### STEP 3.1 — UPDATE PRISMA SCHEMA

Add to schema.prisma:

```prisma
enum DeliveryMethod {
  INSTANT
  NEXT_DAY
  REGULAR
}

enum OrderStatus {
  SEDANG_DIKEMAS
  MENUNGGU_PENGIRIM
  SEDANG_DIKIRIM
  PESANAN_SELESAI
  DIKEMBALIKAN
}

enum TransactionType {
  TOPUP
  PAYMENT
  REFUND
  INCOME
  INCOME_REVERSAL
}

model Wallet {
  id           String             @id @default(cuid())
  buyerId      String             @unique
  balance      Float              @default(0)
  buyer        User               @relation("BuyerWallet", fields: [buyerId], references: [id])
  transactions WalletTransaction[]
}

model WalletTransaction {
  id          String          @id @default(cuid())
  walletId    String
  type        TransactionType
  amount      Float
  description String
  orderId     String?
  createdAt   DateTime        @default(now())
  wallet      Wallet          @relation(fields: [walletId], references: [id])
}

model DeliveryAddress {
  id            String   @id @default(cuid())
  buyerId       String
  label         String
  recipientName String
  phone         String
  addressLine   String
  city          String
  province      String
  postalCode    String
  isDefault     Boolean  @default(false)
  createdAt     DateTime @default(now())
  buyer         User     @relation("BuyerAddresses", fields: [buyerId], references: [id])
  orders        Order[]
}

model Cart {
  id      String     @id @default(cuid())
  buyerId String     @unique
  storeId String?
  buyer   User       @relation("BuyerCart", fields: [buyerId], references: [id])
  store   Store?     @relation(fields: [storeId], references: [id])
  items   CartItem[]
}

model CartItem {
  id        String  @id @default(cuid())
  cartId    String
  productId String
  quantity  Int
  cart      Cart    @relation(fields: [cartId], references: [id], onDelete: Cascade)
  product   Product @relation(fields: [productId], references: [id])
  @@unique([cartId, productId])
}

model Order {
  id                String          @id @default(cuid())
  buyerId           String
  sellerId          String
  storeId           String
  deliveryMethod    DeliveryMethod
  deliveryAddressId String
  subtotal          Float
  discountAmount    Float           @default(0)
  deliveryFee       Float
  taxAmount         Float
  totalAmount       Float
  status            OrderStatus     @default(SEDANG_DIKEMAS)
  voucherId         String?
  promoId           String?
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  buyer             User                 @relation("BuyerOrders", fields: [buyerId], references: [id])
  seller            User                 @relation("SellerOrders", fields: [sellerId], references: [id])
  store             Store                @relation(fields: [storeId], references: [id])
  deliveryAddress   DeliveryAddress      @relation(fields: [deliveryAddressId], references: [id])
  items             OrderItem[]
  statusHistory     OrderStatusHistory[]
}

model OrderItem {
  id          String  @id @default(cuid())
  orderId     String
  productId   String
  productName String
  price       Float
  quantity    Int
  order       Order   @relation(fields: [orderId], references: [id])
  product     Product @relation(fields: [productId], references: [id])
}

model OrderStatusHistory {
  id        String      @id @default(cuid())
  orderId   String
  status    OrderStatus
  note      String?
  createdAt DateTime    @default(now())
  order     Order       @relation(fields: [orderId], references: [id])
}
```

Add relations to existing models:
- User: `wallet Wallet? @relation("BuyerWallet")`, `addresses DeliveryAddress[] @relation("BuyerAddresses")`, `cart Cart? @relation("BuyerCart")`, `buyerOrders Order[] @relation("BuyerOrders")`, `sellerOrders Order[] @relation("SellerOrders")`
- Store: `cart Cart[]`, `orders Order[]`
- Product: `cartItems CartItem[]`, `orderItems OrderItem[]`

Run:
```bash
npx prisma migrate dev --name level3_wallet_cart_order
```

### STEP 3.2 — WALLET & ADDRESS ENDPOINTS

`backend/src/controllers/wallet.controller.ts`:
- `GET /api/buyer/wallet` requireRole BUYER. Upsert wallet if missing. Return balance plus last 20 transactions.
- `POST /api/buyer/wallet/topup` requireRole BUYER. Body amount positive max 10000000. Transaction: increment balance, create WalletTransaction TOPUP.

`backend/src/controllers/address.controller.ts`:
- GET/POST/PUT/DELETE/PATCH default for buyer addresses, all requireRole BUYER, ownership checked, isDefault logic resets other addresses first.

### STEP 3.3 — CART ENDPOINTS

`backend/src/controllers/cart.controller.ts`:
- `GET /api/buyer/cart` upsert cart if missing, return with items/products/store, computed subtotal.
- `POST /api/buyer/cart/items` body productId/quantity. SINGLE-STORE RULE: if cart storeId set and differs from product storeId, return 409 with clear message. Check stock. Upsert CartItem.
- `PUT /api/buyer/cart/items/:itemId` update quantity 1 to stock.
- `DELETE /api/buyer/cart/items/:itemId` remove item, reset storeId if cart empty.
- `DELETE /api/buyer/cart` clear all items, reset storeId.

### STEP 3.4 — CHECKOUT ENDPOINT

Create `backend/src/services/checkout.service.ts`:
```typescript
export const DELIVERY_FEES: Record<string, number> = {
  INSTANT: 25000,
  NEXT_DAY: 15000,
  REGULAR: 9000,
};
// PPN 12% BASE: subtotal - discount + deliveryFee
```

Implement checkout logic in a single `prisma.$transaction`:
1. Validate cart not empty, address belongs to buyer
2. subtotal sum of price times qty; deliveryFee from method; discountAmount 0 for now
3. taxBase = subtotal minus discount plus deliveryFee; taxAmount = taxBase times 0.12; totalAmount = taxBase plus taxAmount
4. Check wallet balance covers totalAmount, throw insufficient balance error if not
5. Decrement stock per item, never negative
6. Create Order status SEDANG_DIKEMAS plus OrderItems snapshot plus OrderStatusHistory entry
7. Deduct wallet balance, create WalletTransaction PAYMENT
8. Clear cart

`backend/src/controllers/order.controller.ts`:
- `POST /api/buyer/checkout` calls checkout service.
- `GET /api/buyer/orders`, `GET /api/buyer/orders/:id` buyer order history/detail ownership-checked.
- `GET /api/seller/orders`, `GET /api/seller/orders/:id` seller incoming orders ownership-checked.

### STEP 3.5 — BUYER FRONTEND PAGES

- `frontend/app/buyer/wallet/page.tsx` balance, top-up form, transaction history.
- `frontend/app/buyer/addresses/page.tsx` address CRUD UI.
- `frontend/app/buyer/cart/page.tsx` cart items, single-store info banner, checkout button.
- `frontend/app/buyer/checkout/page.tsx` address/method selection, order summary, wallet balance check, confirm.
- `frontend/app/buyer/orders/page.tsx` order list.
- `frontend/app/buyer/orders/[id]/page.tsx` order detail with status timeline.
- `frontend/app/seller/orders/page.tsx`, `frontend/app/seller/orders/[id]/page.tsx` seller order views.

Update product detail page: add-to-cart button for BUYER, handle 409 single-store conflict with a modal.

---

### CHECK — VERIFY LEVEL 3

- [ ] Top-up, add address, add to cart (single-store rule enforced), checkout
- [ ] Wallet balance decreases, stock decreases, order appears for buyer and seller
- [ ] Insufficient balance shows error, no order created
- [ ] Check Supabase Table Editor: Wallet, Order, OrderItem, OrderStatusHistory populated correctly

### GIT — LEVEL 3

```bash
git add .
git commit -m "feat: level 3 - buyer wallet, addresses, cart with single-store rule, checkout with PPN 12% (Supabase)"
git push origin main
```

---

## ═══════════════════════════════════════
## LEVEL 4 — DISCOUNTS & SELLER ORDER PROCESSING (15 pts)
## ═══════════════════════════════════════

### STEP 4.1 — UPDATE PRISMA SCHEMA

```prisma
enum DiscountType {
  PERCENTAGE
  FIXED
}

model Voucher {
  id             String       @id @default(cuid())
  code           String       @unique
  description    String
  discountType   DiscountType
  discountValue  Float
  minOrderAmount Float        @default(0)
  maxUsage       Int
  usedCount      Int          @default(0)
  expiresAt      DateTime
  createdAt      DateTime     @default(now())
  orders         Order[]      @relation("OrderVoucher")
}

model Promo {
  id             String       @id @default(cuid())
  code           String       @unique
  description    String
  discountType   DiscountType
  discountValue  Float
  minOrderAmount Float        @default(0)
  expiresAt      DateTime
  createdAt      DateTime     @default(now())
  orders         Order[]      @relation("OrderPromo")
}
```

Replace plain `voucherId`/`promoId` fields on Order with proper relations:
```prisma
voucher Voucher? @relation("OrderVoucher", fields: [voucherId], references: [id])
promo   Promo?   @relation("OrderPromo", fields: [promoId], references: [id])
```

Run:
```bash
npx prisma migrate dev --name level4_voucher_promo
```

Update seed: add voucher SAVE10 (10 percent, min 50k, max 100 uses, plus 1 year), voucher HEMAT20000 (fixed 20k, min 100k, max 50 uses), promo PROMO5 (5 percent, no min, unlimited, plus 1 year). Run `npm run seed`.

### STEP 4.2 — DISCOUNT ENDPOINTS

`backend/src/controllers/discount.controller.ts`:
- Admin requireRole ADMIN: POST/GET vouchers, GET voucher detail, POST/GET promos, GET promo detail.
- Public: GET vouchers/validate, GET promos/validate, check expiry, usage, min order.

### STEP 4.3 — UPDATE CHECKOUT SERVICE

Accept voucherCode/promoCode. Apply voucher discount to subtotal first, then promo to the remainder. Cap combined discount at subtotal. taxBase = subtotal minus discountAmount plus deliveryFee. Increment voucher usedCount inside the transaction. Document the stacking and PPN-base rule in README.

### STEP 4.4 — SELLER ORDER PROCESSING

Add `PATCH /api/seller/orders/:id/process` verify ownership, verify status SEDANG_DIKEMAS, transition to MENUNGGU_PENGIRIM, log OrderStatusHistory.

### STEP 4.5 — REPORTS ENDPOINTS

- `GET /api/buyer/reports` totalSpent, orderCount, breakdown.
- `GET /api/seller/reports` totalIncome, monthly breakdown.

### STEP 4.6 — FRONTEND UPDATES

Update checkout page with voucher/promo code inputs plus summary lines. Update seller order pages with Proses Pesanan action plus status timeline. Add `frontend/app/buyer/reports/page.tsx` and `frontend/app/seller/reports/page.tsx` (recharts bar chart, `npm install recharts`).

---

### CHECK — VERIFY LEVEL 4

- [ ] Admin creates voucher, buyer applies at checkout, discount plus PPN calculated correctly
- [ ] Voucher plus promo stack correctly
- [ ] Seller processes order, status plus timeline update
- [ ] Reports pages show correct totals

### GIT — LEVEL 4

```bash
git add .
git commit -m "feat: level 4 - voucher/promo discounts with stacking, seller order processing, reports"
git push origin main
```

---

## ═══════════════════════════════════════
## LEVEL 5 — DELIVERY & DRIVER WORKFLOW (10 pts)
## ═══════════════════════════════════════

### STEP 5.1 — UPDATE PRISMA SCHEMA

```prisma
enum JobStatus {
  AVAILABLE
  TAKEN
  COMPLETED
}

model DeliveryJob {
  id           String    @id @default(cuid())
  orderId      String    @unique
  driverId     String?
  status       JobStatus @default(AVAILABLE)
  earnedAmount Float?
  takenAt      DateTime?
  completedAt  DateTime?
  createdAt    DateTime  @default(now())

  order        Order     @relation(fields: [orderId], references: [id])
  driver       User?     @relation("DriverJobs", fields: [driverId], references: [id])
}
```

Add `driverJobs DeliveryJob[] @relation("DriverJobs")` to User, `deliveryJob DeliveryJob?` to Order.

Run:
```bash
npx prisma migrate dev --name level5_delivery_job
```

### STEP 5.2 — AUTO-CREATE JOB ON SELLER PROCESSING

Inside the seller-process transaction, also create `DeliveryJob { orderId, status: 'AVAILABLE' }`.

### STEP 5.3 — DRIVER ENDPOINTS

`backend/src/controllers/driver.controller.ts`:
- `GET /api/driver/jobs/available` AVAILABLE jobs with order/store/address info, potentialEarning = deliveryFee times 0.7.
- `GET /api/driver/jobs/:id` job detail.
- `POST /api/driver/jobs/:id/take` transaction: re-check status AVAILABLE inside transaction, 409 if not, set driverId/status TAKEN/takenAt, order status SEDANG_DIKIRIM, log history.
- `POST /api/driver/jobs/:id/complete` verify ownership plus status TAKEN, set status COMPLETED, earnedAmount = deliveryFee times 0.7, order status PESANAN_SELESAI, log history, credit seller wallet with totalAmount minus deliveryFee as INCOME.
- `GET /api/driver/jobs/history`, `GET /api/driver/earnings`.

Update buyer/seller order detail endpoints to include deliveryJob.

### STEP 5.4 — DRIVER FRONTEND PAGES

- `frontend/app/driver/jobs/page.tsx` available jobs, take action.
- `frontend/app/driver/jobs/[id]/page.tsx` job detail, confirm-complete action.
- `frontend/app/driver/history/page.tsx`, `frontend/app/driver/earnings/page.tsx`.
- Update buyer/seller order detail pages to show delivery/driver tracking.

---

### CHECK — VERIFY LEVEL 5

- [ ] Full flow: buyer checkout, seller process, driver finds/takes/completes job
- [ ] Two drivers racing for same job, second gets 409
- [ ] Seller wallet credited correctly on completion
- [ ] Driver earnings/history correct

### GIT — LEVEL 5

```bash
git add .
git commit -m "feat: level 5 - driver job workflow (find, take, complete) with earnings, delivery tracking"
git push origin main
```

---

## ═══════════════════════════════════════
## LEVEL 6 — ADMIN MONITORING & OVERDUE HANDLING (10 pts)
## ═══════════════════════════════════════

> Vercel-specific change: the original plan used `node-cron` running inside a long-lived process. That does not work on Vercel serverless functions, there is no persistent process to host the scheduler. Instead, the overdue check is triggered by Vercel Cron Jobs, which call a protected API route on a schedule. The route itself does the same processOverdueOrders work, only the trigger mechanism changes.

### STEP 6.1 — UPDATE PRISMA SCHEMA

```prisma
model SystemConfig {
  id    String @id @default(cuid())
  key   String @unique
  value String
}
```

Run:
```bash
npx prisma migrate dev --name level6_system_config
```

### STEP 6.2 — ADMIN MONITORING ENDPOINTS

`backend/src/controllers/admin.controller.ts`:
- `GET /api/admin/dashboard` aggregated stats (users by role, stores, products, orders by status, voucher/promo active counts, delivery job counts, overdue count).
- `GET /api/admin/users`, `/stores`, `/products`, `/orders`, `/delivery-jobs`, `/overdue-orders` all requireRole ADMIN, paginated where relevant.

### STEP 6.3 — OVERDUE SERVICE

Create `backend/src/services/overdue.service.ts`:
```typescript
import { prisma } from '../utils/prisma';
import { OrderStatus } from '@prisma/client';

export const SLA_DAYS: Record<string, number> = {
  INSTANT: 1,
  NEXT_DAY: 2,
  REGULAR: 5,
};

export async function getSimulatedDate(): Promise<Date> {
  const config = await prisma.systemConfig.findUnique({ where: { key: 'SIMULATED_DATE' } });
  return config ? new Date(config.value) : new Date();
}

export async function setSimulatedDate(date: Date): Promise<void> {
  await prisma.systemConfig.upsert({
    where: { key: 'SIMULATED_DATE' },
    create: { key: 'SIMULATED_DATE', value: date.toISOString() },
    update: { value: date.toISOString() },
  });
}

export async function processOverdueOrders(simulatedNow: Date) {
  const orders = await prisma.order.findMany({
    where: { status: { notIn: [OrderStatus.PESANAN_SELESAI, OrderStatus.DIKEMBALIKAN] } },
    include: { statusHistory: { orderBy: { createdAt: 'asc' } }, items: true, deliveryJob: true },
  });

  const processed: any[] = [];

  for (const order of orders) {
    const slaReferenceStatus = order.deliveryMethod === 'INSTANT' ? OrderStatus.SEDANG_DIKIRIM : OrderStatus.MENUNGGU_PENGIRIM;
    const referenceEntry = order.statusHistory.find(h => h.status === slaReferenceStatus);
    if (!referenceEntry) continue;

    const deadline = new Date(referenceEntry.createdAt);
    deadline.setDate(deadline.getDate() + SLA_DAYS[order.deliveryMethod]);
    if (simulatedNow <= deadline) continue;

    try {
      await prisma.$transaction(async (tx) => {
        await tx.order.update({ where: { id: order.id }, data: { status: OrderStatus.DIKEMBALIKAN } });
        await tx.orderStatusHistory.create({
          data: { orderId: order.id, status: OrderStatus.DIKEMBALIKAN, note: 'Auto-return: melewati batas waktu pengiriman' },
        });

        const buyerWallet = await tx.wallet.upsert({
          where: { buyerId: order.buyerId },
          create: { buyerId: order.buyerId, balance: order.totalAmount },
          update: { balance: { increment: order.totalAmount } },
        });
        await tx.walletTransaction.create({
          data: { walletId: buyerWallet.id, type: 'REFUND', amount: order.totalAmount, description: `Refund otomatis pesanan #${order.id.slice(-8)}`, orderId: order.id },
        });

        const sellerWallet = await tx.wallet.findUnique({ where: { buyerId: order.sellerId } });
        if (sellerWallet) {
          const income = order.totalAmount - order.deliveryFee;
          await tx.wallet.update({ where: { id: sellerWallet.id }, data: { balance: { decrement: income } } });
          await tx.walletTransaction.create({
            data: { walletId: sellerWallet.id, type: 'INCOME_REVERSAL', amount: income, description: `Pembatalan pendapatan pesanan #${order.id.slice(-8)}`, orderId: order.id },
          });
        }

        for (const item of order.items) {
          await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
        }

        if (order.deliveryJob?.status === 'TAKEN') {
          await tx.deliveryJob.update({ where: { id: order.deliveryJob.id }, data: { status: 'AVAILABLE', driverId: null, takenAt: null } });
        }
      });
      processed.push({ orderId: order.id, action: 'REFUNDED_AND_RETURNED' });
    } catch (err) {
      console.error(`Failed to process overdue order ${order.id}:`, err);
    }
  }

  return { processed: processed.length, details: processed };
}
```

### STEP 6.4 — ADMIN/CRON ENDPOINTS

Add to admin controller:
- `GET /api/admin/current-date` returns simulated or real date.
- `POST /api/admin/simulate-next-day` requireRole ADMIN. Advance simulated date by 1 day, run processOverdueOrders, return result.
- `POST /api/admin/reset-simulation` requireRole ADMIN. Delete SIMULATED_DATE config.

Create `backend/src/controllers/cron.controller.ts`, the Vercel Cron target, protected by a shared secret instead of a user JWT since cron jobs have no user session:
```typescript
import { Request, Response } from 'express';
import { processOverdueOrders, getSimulatedDate } from '../services/overdue.service';

export const runOverdueCheck = async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized cron call' });
  }
  const now = await getSimulatedDate();
  const result = await processOverdueOrders(now);
  res.json({ ranAt: new Date(), ...result });
};
```

Add route: `router.post('/cron/overdue-check', runOverdueCheck);` in `backend/src/routes/index.ts`.

Create/update `backend/vercel.json` to add the cron schedule:
```json
{
  "version": 2,
  "builds": [
    { "src": "api/index.ts", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/(.*)", "dest": "api/index.ts" }
  ],
  "crons": [
    { "path": "/api/cron/overdue-check", "schedule": "0 0 * * *" }
  ]
}
```

> Vercel automatically attaches a valid Authorization Bearer CRON_SECRET header when it calls a cron path if CRON_SECRET is set as an environment variable on the project, set this in Vercel's dashboard during deployment (see Deployment section below). Vercel Cron Jobs are available on the Hobby free plan with a minimum daily interval, that is enough for this challenge's simulate-next-day requirement, and the manual Admin "Maju 1 Hari" button remains the primary demo path regardless.

### STEP 6.5 — ADMIN FRONTEND PAGES

- `frontend/app/admin/dashboard/page.tsx` stats grid, recent orders, quick links.
- `frontend/app/admin/users/page.tsx`, `/stores`, `/products`, `/orders`, `/delivery-jobs`, `/overdue` monitoring tables.
- `frontend/app/admin/vouchers/page.tsx`, `/promos/page.tsx` full CRUD UI with create dialog.
- `frontend/app/admin/time-simulation/page.tsx` current date display, Maju 1 Hari button calling POST simulate-next-day, result summary, Reset Simulasi button.

---

### CHECK — VERIFY LEVEL 6

- [ ] Admin dashboard shows correct live stats
- [ ] Voucher/Promo CRUD works from UI
- [ ] Click Maju 1 Hari repeatedly until an order passes SLA, order auto-returns, buyer refunded, stock restored, seller income reversed, idempotent on repeat calls
- [ ] Manually test the cron endpoint locally with curl, correct secret returns a result, wrong secret returns 401

### GIT — LEVEL 6

```bash
git add .
git commit -m "feat: level 6 - admin monitoring, voucher/promo UI, overdue auto-refund via Vercel Cron + manual time simulation"
git push origin main
```

---

## ═══════════════════════════════════════
## LEVEL 7 — SECURITY HARDENING & FINALIZATION (10 pts)
## ═══════════════════════════════════════

### STEP 7.1 — SECURITY AUDIT & HARDENING

Create `backend/src/middlewares/sanitize.middleware.ts`:
```typescript
import sanitizeHtml from 'sanitize-html';
export const sanitize = (value: string): string =>
  sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });
```

Apply to all free-text user input before saving: review comments, store name/description, product name/description, address fields, voucher/promo descriptions.

Audit all controllers for:
1. SQL Injection: Prisma model methods only, no raw string-interpolated queryRaw.
2. XSS: sanitize applied everywhere listed above.
3. Zod validation on every endpoint, including price positive, stock int min 0, quantity int 1-100, rating int 1-5, discountValue, phone regex, postalCode regex.
4. Ownership guards: buyer/order, seller/store-order, driver/job checks present everywhere.
5. Token blacklist already DB-backed, confirm it is checked on every verifyToken call.
6. helmet and rate limiting already present in app.ts.

### STEP 7.2 — SWAGGER DOCUMENTATION

Update `backend/src/app.ts` to mount Swagger:
```typescript
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SEAPEDIA API',
      version: '1.0.0',
      description: `
        SEAPEDIA Multi-Role E-Commerce API (Supabase + Vercel)

        Business Rules:
        - Single-store checkout per cart
        - PPN 12% base: (subtotal - discount + deliveryFee) x 0.12
        - Discount stacking: voucher first, then promo on remainder
        - Driver earning: 70% of delivery fee
        - Overdue SLA: INSTANT=1 day, NEXT_DAY=2 days, REGULAR=5 days
        - Overdue check runs via Vercel Cron (/api/cron/overdue-check) and manual Admin trigger

        Authentication: Bearer JWT. Roles: ADMIN, SELLER, BUYER, DRIVER.
      `,
    },
    servers: [{ url: '/api', description: 'API Base' }],
    components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs));
```

Add swagger JSDoc comments to at least: register, login, select-role, products list/detail, wallet topup, cart add, checkout, seller process, driver take/complete, admin simulate-next-day.

> Note: Swagger UI static assets can be flaky on some serverless platforms, verify /api/docs actually renders correctly once deployed (see Deployment Verification checklist). If it fails to render on Vercel specifically, fall back to exposing the raw spec at /api/docs.json and document that in the README as the documentation entrypoint.

### STEP 7.3 — COMPLETE SEED DATA

Update `backend/prisma/seed.ts` with all demo accounts: admin, seller1 (plus store plus products), buyer1 (plus wallet 5jt plus address), driver1, multi (Buyer+Seller+Driver). Add vouchers SAVE10/HEMAT20000 and promo PROMO5. Run `npm run seed` against Supabase.

### STEP 7.4 — FINAL README

Create root `README.md` covering: quick start (local, with .env setup pointing at Supabase), demo accounts table, business rules (single-store, PPN, discount stacking, delivery fees, driver earning, SLA plus cron mechanism), security notes (Prisma/SQLi, sanitize-html/XSS, Zod validation, rate limiting, helmet, DB-backed token blacklist, RBAC), API docs link, deployment links (filled in after the Deployment section below), end-to-end testing guide.

### STEP 7.5 — FRONTEND SECURITY AUDIT

Confirm no dangerouslySetInnerHTML anywhere on user content, all comments/descriptions render via plain text interpolation, add matching frontend Zod schemas on every form, show clear API error messages.

---

### CHECK — VERIFY LEVEL 7

- [ ] /api/docs (or /api/docs.json fallback) loads
- [ ] npm run seed runs cleanly against Supabase
- [ ] XSS test on review comment, safely rendered as text
- [ ] SQLi-style login payload returns plain Invalid credentials, no DB error leak
- [ ] Role-restricted endpoints return 403 for wrong roles
- [ ] Logout token rejected on reuse
- [ ] All 5 demo accounts log in successfully

### GIT — LEVEL 7

```bash
git add .
git commit -m "feat: level 7 - XSS sanitization, Zod validation, ownership guards, swagger docs, complete seed and README"
git push origin main
```

---

## ═══════════════════════════════════════
## DEPLOYMENT — VERCEL (Backend + Frontend, two projects, one repo)
## ═══════════════════════════════════════

### DEPLOY BACKEND FIRST

1. Go to vercel.com, Add New Project, import the seapedia repo
2. Root Directory: `backend`
3. Framework Preset: Other (Vercel should detect the vercel.json and @vercel/node builder)
4. Build & Output Settings: leave as defined by vercel.json, do not override
5. Environment Variables, add all of these (Production, Preview, and Development scopes):
   ```
   DATABASE_URL   = <the pooled Supabase connection string the user provided in Step -1>
   DIRECT_URL     = <the direct Supabase connection string the user provided in Step -1>
   JWT_SECRET     = <generate a long random string>
   CRON_SECRET    = <generate a long random string>
   NODE_ENV       = production
   FRONTEND_URL   = (leave blank for now, will update after frontend is deployed)
   ```
6. Deploy. Vercel will run vercel-build from package.json (prisma generate plus prisma migrate deploy) using DIRECT_URL for the migration step.
7. Once live, note the backend URL, e.g. https://seapedia-backend.vercel.app
8. Test: open https://seapedia-backend.vercel.app/api/health, should return status ok
9. Run the seed once, locally, pointed at the same Supabase database (Vercel does not run npm run seed automatically):
   ```bash
   cd backend
   # ensure backend/.env has the same DATABASE_URL/DIRECT_URL as the Vercel project
   npm run seed
   ```

### DEPLOY FRONTEND SECOND

1. Go to vercel.com, Add New Project, import the same seapedia repo again (as a second project)
2. Root Directory: `frontend`
3. Framework Preset: Next.js (auto-detected)
4. Environment Variables:
   ```
   NEXT_PUBLIC_API_URL = https://seapedia-backend.vercel.app/api
   ```
5. Deploy. Note the frontend URL, e.g. https://seapedia.vercel.app

### CONNECT THEM (CORS)

1. Go back to the backend Vercel project, Settings, Environment Variables
2. Update FRONTEND_URL to the real frontend URL: https://seapedia.vercel.app
3. Trigger a redeploy (Deployments tab, latest, Redeploy) so the new env var takes effect

### ENABLE VERCEL CRON

Vercel Cron Jobs are configured via vercel.json (already added in Level 6) and activate automatically once the backend project is deployed. Confirm under the backend project's Settings, Cron Jobs tab that /api/cron/overdue-check is listed and scheduled. No extra UI step needed beyond having CRON_SECRET set as an env var.

### DEPLOYMENT VERIFICATION CHECKLIST

- [ ] https://<frontend>.vercel.app loads landing page, reviews fetch correctly
- [ ] Register plus login plus role-select works end to end against the deployed backend
- [ ] Browse products, add to cart, checkout completes successfully
- [ ] Login as seller1/driver1/admin demo accounts and confirm each dashboard works
- [ ] https://<backend>.vercel.app/api/docs (or /api/docs.json) loads
- [ ] No CORS errors in browser console (check Network tab on any API call)
- [ ] Supabase Table Editor shows live data changing as you interact with the deployed app
- [ ] Backend project's Vercel Settings, Cron Jobs tab shows the overdue-check job scheduled

### UPDATE README

```bash
git add README.md
git commit -m "docs: add Vercel deployment links (frontend, backend, Supabase-backed) and cron notes"
git push origin main
```

---

## ═══════════════════════════════════════
## FINAL GIT HISTORY SUMMARY
## ═══════════════════════════════════════

```
chore: initialize monorepo with backend (Express+Prisma+Supabase) and frontend (Next.js), configured for Vercel
feat: level 1 - public marketplace, auth with multi-role, application reviews, dashboard shells (Supabase + Vercel-ready)
feat: level 2 - seller store management, product CRUD, public catalog connected to Supabase
feat: level 3 - buyer wallet, addresses, cart with single-store rule, checkout with PPN 12% (Supabase)
feat: level 4 - voucher/promo discounts with stacking, seller order processing, reports
feat: level 5 - driver job workflow (find, take, complete) with earnings, delivery tracking
feat: level 6 - admin monitoring, voucher/promo UI, overdue auto-refund via Vercel Cron + manual time simulation
feat: level 7 - XSS sanitization, Zod validation, ownership guards, swagger docs, complete seed and README
docs: add Vercel deployment links (frontend, backend, Supabase-backed) and cron notes
```

---

## IMPORTANT NOTES FOR AI IDE

1. Do not proceed past Step -1 until the user has provided DATABASE_URL and DIRECT_URL. Everything downstream depends on these.
2. Never skip a CHECK verification before running git commands for that level.
3. Keep backend/src/dev-server.ts (local) and backend/api/index.ts (Vercel) both in sync with backend/src/app.ts, never put app.listen() inside app.ts itself, or the Vercel deployment will hang/fail.
4. Every Prisma migration command (migrate dev) uses DIRECT_URL automatically because of the directUrl field in schema.prisma, do not try to run migrations against the pooled DATABASE_URL, it will fail.
5. The Prisma Client singleton pattern in backend/src/utils/prisma.ts is required, without it repeated serverless cold starts can exhaust Supabase's connection limit on the free tier.
6. If a migration fails locally, do not run prisma migrate reset carelessly against the shared Supabase database without confirming with the user first, it wipes all data including other levels' seed data.
7. .env, .env.local, and .vercel must stay in .gitignore, never commit real Supabase credentials, JWT secrets, or cron secrets to the repo. They live only in local .env files and in each Vercel project's Environment Variables UI.
8. All amounts/prices are Float, all timestamps are real DateTime, Postgres handles both natively, no special handling needed unlike SQLite.
