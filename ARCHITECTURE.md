# SEAPEDIA — Architecture Document

**Version:** 1.0.0  
**Project:** COMPFEST 18 — Software Engineering Academy  

---

## 1. Architecture Overview

SEAPEDIA uses a **separated frontend-backend architecture** (not Next.js fullstack) because:
1. The challenge requires an **API-based backend** that could support both web and mobile clients
2. Easier to test and document the API independently (Swagger)
3. Backend can be deployed separately on Render with its own scaling

```
┌─────────────────────────────────────────────────────────────────┐
│                    SEAPEDIA SYSTEM                               │
│                                                                  │
│  ┌──────────────────┐         ┌──────────────────────────────┐  │
│  │   NEXT.JS 14     │  REST   │      EXPRESS.JS API          │  │
│  │   (Vercel)       │◄───────►│      (Render)                 │  │
│  │                  │  + JWT  │                              │  │
│  │  App Router      │  Cookie │  Routes → Controllers →      │  │
│  │  Tailwind CSS    │         │  Services → Prisma → DB      │  │
│  │  Zustand         │         │                              │  │
│  │  Axios           │         │  Swagger UI @ /api/docs      │  │
│  └──────────────────┘         └──────────┬───────────────────┘  │
│                                          │                        │
│                                          │ Prisma Client          │
│                                          ▼                        │
│                               ┌──────────────────┐               │
│                               │   POSTGRESQL 14   │               │
│                               │  (Supabase/Neon)  │               │
│                               └──────────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Backend Architecture

### 2.1 Layered Architecture

The backend follows a strict **4-layer architecture**. Each layer has a single responsibility and communicates only with the layer directly below it.

```
HTTP Request
     │
     ▼
┌─────────────────────────────────────────────┐
│  MIDDLEWARE LAYER                            │
│  cors, helmet, rateLimiter, authenticate,    │
│  requireRole, validate (Zod)                 │
└─────────────────────┬───────────────────────┘
                      │ req (validated, with req.user)
                      ▼
┌─────────────────────────────────────────────┐
│  CONTROLLER LAYER                            │
│  Parse HTTP request params/body              │
│  Call service method                         │
│  Format HTTP response                        │
│  Pass errors to next()                       │
└─────────────────────┬───────────────────────┘
                      │ DTOs (plain objects)
                      ▼
┌─────────────────────────────────────────────┐
│  SERVICE LAYER                               │
│  Business logic ONLY                         │
│  No HTTP awareness (no req/res)              │
│  Calls Prisma directly                       │
│  Throws domain errors                        │
└─────────────────────┬───────────────────────┘
                      │ Prisma queries
                      ▼
┌─────────────────────────────────────────────┐
│  DATA LAYER                                  │
│  Prisma ORM                                  │
│  PostgreSQL                                  │
└─────────────────────────────────────────────┘
```

**Why this architecture:**
- Controllers are thin — easy to test services in isolation
- Services have no HTTP dependencies — can be reused or tested without Express
- Prisma provides type-safe queries — eliminates a whole class of bugs

### 2.2 Error Handling Architecture

Custom error classes propagate from Service → Controller → Global Error Handler:

```typescript
// Custom Error Hierarchy
class AppError extends Error {
  constructor(public message: string, public statusCode: number, public errors?: any[]) {
    super(message)
  }
}

class BadRequestError extends AppError { constructor(msg) { super(msg, 400) } }
class UnauthorizedError extends AppError { constructor(msg) { super(msg, 401) } }
class ForbiddenError extends AppError { constructor(msg) { super(msg, 403) } }
class NotFoundError extends AppError { constructor(msg) { super(msg, 404) } }
class ConflictError extends AppError { constructor(msg) { super(msg, 409) } }

// Global Error Handler (last middleware in Express)
app.use((err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors
    })
  }
  
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
    })
  }
  
  // Unexpected errors
  console.error(err)
  return res.status(500).json({ success: false, message: 'Internal server error' })
})
```

### 2.3 Authentication Architecture

**Decision: JWT + httpOnly Cookie (not session)**

Rationale:
- JWT is stateless for access tokens (good for API scalability)
- httpOnly cookie for refresh token prevents XSS token theft
- Refresh token stored in DB enables true logout (token revocation)
- Short access token expiry (15min) limits damage from token compromise

```
┌─────────────┐    POST /auth/login    ┌───────────────┐
│   FRONTEND  │──────────────────────►│    BACKEND    │
│             │                        │               │
│             │◄── access_token (body)─│ Signs JWT     │
│             │◄── refresh_token (Set- │ Stores in DB  │
│             │    Cookie: httpOnly)   │               │
│             │                        │               │
│  Zustand:   │                        │               │
│  {          │  GET /api/products     │               │
│   accessTk  │──Authorization: Bearer►│ Verifies JWT  │
│  }          │◄── 200 data ──────────│               │
│             │                        │               │
│             │  (after 15min, 401)    │               │
│             │  POST /auth/refresh    │               │
│             │──Cookie auto-sent─────►│               │
│             │◄── new access_token ──│ Verifies RT   │
│             │                        │ Checks DB     │
└─────────────┘                        └───────────────┘
```

**Why access token in memory, not cookie:**
- If both tokens were in cookies, CSRF attacks become a concern
- Access token in memory + CORS restriction provides good security
- Zustand store is cleared on page close (good for security)

### 2.4 Role-Based Authorization Architecture

```
JWT Payload:
{
  "sub": "user-uuid",
  "roles": ["BUYER", "SELLER"],    ← All roles user owns
  "active_role": "BUYER",          ← Currently selected role
}

Middleware chain for protected endpoint:
  authenticate → extract JWT, set req.user
  requireRole('BUYER') → check req.user.active_role === 'BUYER'
  
Controller → Service → always verify resource ownership separately
```

**Why active_role in JWT instead of session:**
- Stateless design (no DB lookup per request for role)
- Role selection issues new token (short-lived anyway)
- Backend enforces active_role on EVERY request — frontend is just UI

### 2.5 Transaction Architecture

**Rule: All multi-step writes use Prisma `$transaction()`**

```typescript
// Pattern for all critical operations
await prisma.$transaction(async (tx) => {
  // All operations use `tx` not `prisma`
  await tx.model.update(...)
  await tx.otherModel.create(...)
  // If any throws, all are rolled back automatically
})
```

Applied to:
1. **Checkout** — wallet deduction + stock reduction + order creation + cart clear + voucher usage increment
2. **Overdue refund** — status update + wallet credit + stock restore + wallet transaction create
3. **Driver job taking** — job assignment + order status update + status history create

---

## 3. Frontend Architecture

### 3.1 Next.js App Router Structure

```
app/
├── (public)/           ← Route group (no auth required)
│   ├── page.tsx        ← / (landing)
│   ├── products/
│   │   ├── page.tsx    ← /products
│   │   └── [id]/
│   │       └── page.tsx ← /products/:id
│   └── stores/
│       └── [id]/
│           └── page.tsx ← /stores/:id
│
├── auth/               ← Auth pages (no dashboard layout)
│   ├── login/
│   ├── register/
│   └── select-role/
│
├── buyer/              ← Protected: requires active_role=BUYER
│   ├── layout.tsx      ← Buyer layout (sidebar + role check)
│   ├── dashboard/
│   ├── wallet/
│   ├── cart/
│   ├── checkout/
│   ├── orders/
│   │   ├── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   └── reports/
│
├── seller/             ← Protected: requires active_role=SELLER
│   ├── layout.tsx
│   ├── dashboard/
│   ├── store/
│   ├── products/
│   │   ├── page.tsx
│   │   ├── new/
│   │   └── [id]/
│   │       └── edit/
│   ├── orders/
│   └── reports/
│
├── driver/             ← Protected: requires active_role=DRIVER
│   ├── layout.tsx
│   ├── dashboard/
│   ├── jobs/
│   │   ├── page.tsx
│   │   ├── active/
│   │   ├── history/
│   │   └── [id]/
│   └── earnings/
│
└── admin/              ← Protected: requires active_role=ADMIN
    ├── layout.tsx
    ├── dashboard/
    ├── users/
    ├── stores/
    ├── orders/
    ├── delivery-jobs/
    ├── overdue/
    ├── vouchers/
    │   ├── page.tsx
    │   └── [id]/
    └── promos/
        ├── page.tsx
        └── [id]/
```

### 3.2 State Management Architecture

**Zustand stores — one per domain:**

```typescript
// store/auth.store.ts
// Handles: user info, access token, active role, auth actions
// Persisted: NO (memory only for security)

// store/cart.store.ts  
// Handles: cart items (optimistic UI + sync with backend)
// Used for: cart count in navbar, quick cart preview

// All other state is fetched on-demand via React hooks (no global store)
```

**Data fetching pattern:**
```typescript
// hooks/useOrders.ts — custom hook per domain
export function useOrders(status?: string) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    api.get('/buyer/orders', { params: { status } })
      .then(r => setOrders(r.data.data))
      .catch(e => setError(e))
      .finally(() => setLoading(false))
  }, [status])
  
  return { orders, loading, error }
}
```

### 3.3 Token Management Architecture

```
Initial load:
  └── App Provider → try POST /auth/refresh (sends cookie)
       ├── Success → set accessToken in Zustand store
       └── Failure → accessToken = null (guest mode)

API Request:
  └── Axios request interceptor → reads accessToken from Zustand
       └── Sets Authorization: Bearer <token>

401 Response:
  └── Axios response interceptor
       ├── Try POST /auth/refresh
       │    ├── Success → retry original request with new token
       │    └── Failure → clear Zustand store, redirect to /auth/login
       └── Queue other 401s during refresh (prevent multiple refresh calls)
```

### 3.4 Form Architecture

All forms use **react-hook-form + zod**:

```typescript
const schema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
})

type FormData = z.infer<typeof schema>

export function LoginForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = 
    useForm<FormData>({ resolver: zodResolver(schema) })
  
  const onSubmit = async (data: FormData) => {
    // data is type-safe and validated
  }
}
```

---

## 4. Database Architecture

### 4.1 Data Integrity Decisions

| Decision | Approach | Reason |
|----------|----------|--------|
| Soft delete products | `deleted_at` timestamp | Preserve order history references |
| Price snapshot in OrderItem | `product_name`, `product_price` stored | Product price may change after order |
| Wallet transactions immutable | Never update/delete | Financial audit trail |
| Order status never rolled back | Only append to history | Full audit trail required |
| Single store per seller | `@unique` on `seller_id` in Store | Business rule enforcement at DB level |
| Unique store name | `@unique` on `name` in Store | Enforced at DB level, not just app level |
| Unique role per user | `@@unique([user_id, role])` in UserRole | Prevent duplicate role assignments |

### 4.2 Index Strategy

```sql
-- High-frequency queries that need indexes:
User.email (login lookup)
User.username (login lookup)
Store.name (uniqueness check + search)
Product.store_id (seller product listing)
Product.price (price range filter)
Product.created_at (newest sort)
Order.buyer_id (buyer order history)
Order.store_id (seller order list)
Order.status (status filter)
CartItem.buyer_id (cart lookup)
DeliveryJob.driver_id (driver job lookup)
RefreshToken.token (token lookup on refresh)
AppReview.created_at (review listing order)
```

### 4.3 Monetary Value Architecture

**Rule: ALL monetary values use `Decimal` type in Prisma, not `Float`**

```prisma
balance    Decimal @default(0) @db.Decimal(15, 2)  // max 999,999,999,999,999.99
price      Decimal @db.Decimal(15, 2)
final_total Decimal @db.Decimal(15, 2)
```

When doing arithmetic in service layer:
```typescript
// Convert to number only for calculations, back to Decimal for storage
const subtotal = cartItems.reduce((sum, item) => 
  sum + Number(item.product.price) * item.quantity, 0
)
const ppn = Math.round(taxBase * 0.12)  // Integer rounding for PPN
```

### 4.4 System Time Architecture

For the "simulate next day" feature, we use a **date offset** approach:

```
DB Table: SystemConfig
key: "system_date_offset"
value: "3"  ← system is 3 simulated days ahead

getSystemDate() {
  const offset = parseInt(config.value ?? '0')
  const now = new Date()
  now.setDate(now.getDate() + offset)
  return now
}
```

**Why offset instead of actual time manipulation:**
- Doesn't affect real timestamps (created_at etc. remain accurate)
- Easy to reason about ("+3 days from now")
- Can be reset by setting offset back to 0
- SLA comparison: `if (systemDate > slaDueDate) → overdue`

---

## 5. API Documentation Architecture

**Decision: swagger-jsdoc (JSDoc inline annotations)**

```typescript
// Route file annotated with JSDoc comments
/**
 * @swagger
 * /buyer/wallet/topup:
 *   post:
 *     summary: Top up buyer wallet balance
 *     tags: [Buyer - Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 10000
 *                 maximum: 10000000
 *                 example: 500000
 *     responses:
 *       200:
 *         description: Top up successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WalletResponse'
 */
```

**Why inline JSDoc over separate YAML:**
- Co-located with code (less likely to go out of sync)
- IDE support for Swagger annotations
- Auto-generated from running server (always current)

---

## 6. Deployment Architecture

```
┌───────────────────────────────────────────────────────────┐
│  PRODUCTION DEPLOYMENT                                     │
│                                                           │
│  ┌──────────────────┐     ┌──────────────────────────┐   │
│  │     VERCEL       │     │         RENDER           │   │
│  │                  │     │                          │   │
│  │  Next.js 14      │     │  Express.js API          │   │
│  │  (Static + SSR)  │────►│  (Node.js web service)   │   │
│  │                  │     │                          │   │
│  │  seapedia.vercel │     │  seapedia-backend         │   │
│  │  .app            │     │  .onrender.com           │   │
│  └──────────────────┘     └──────────┬───────────────┘   │
│                                       │                    │
│                                       ▼                    │
│                            ┌──────────────────────┐       │
│                            │  SUPABASE / NEON     │       │
│                            │  PostgreSQL           │       │
│                            │  (managed, free tier) │       │
│                            └──────────────────────┘       │
└───────────────────────────────────────────────────────────┘
```

### 6.1 CORS Configuration

```typescript
// Backend CORS must allow frontend origin + credentials
cors({
  origin: process.env.FRONTEND_URL,  // https://seapedia.vercel.app
  credentials: true,                  // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
})
```

**Critical:** `credentials: true` and `origin: specific_domain` are required for httpOnly cookies to work cross-origin.

### 6.2 Render Deployment

```yaml
# render.yaml
build: npm run build && npx prisma generate
start: npx prisma migrate deploy && node dist/server.js
```

**On first deployment:** Run seed manually after deploy, via Render's Shell tab on the service:
```bash
npx prisma db seed
```

### 6.3 Environment Separation

| Variable | Development | Production |
|----------|-------------|------------|
| FRONTEND_URL | http://localhost:3000 | https://seapedia.vercel.app |
| NODE_ENV | development | production |
| Cookie Secure | false | true |
| Cookie SameSite | Lax | Strict |
| Logging | verbose | errors only |

---

## 7. Security Architecture

### 7.1 Defense in Depth

```
Layer 1: Network    → HTTPS only (Vercel + Render enforce TLS)
Layer 2: Transport  → CORS whitelist + credential cookie restrictions  
Layer 3: Auth       → JWT verification on every protected request
Layer 4: AuthZ      → Active role check per endpoint
Layer 5: Ownership  → Resource ownership check per mutation
Layer 6: Input      → Zod validation + sanitize-html
Layer 7: Database   → Prisma ORM (parameterized queries)
Layer 8: Headers    → Helmet.js security headers
```

### 7.2 Attack Surface Analysis

| Attack | Mitigation |
|--------|-----------|
| SQL Injection | Prisma ORM parameterized queries |
| XSS | sanitize-html (backend) + React JSX auto-escape (frontend) |
| CSRF | SameSite=Strict cookie + CORS whitelist |
| Brute Force Login | Rate limiting (10 req/min on auth endpoints) |
| Token Theft | Access token in memory, refresh token in httpOnly cookie |
| Privilege Escalation | Active role verified server-side from JWT |
| IDOR | Resource ownership check on every mutation |
| Token Replay after logout | Refresh token revocation in DB |

---

## 8. Key Architecture Decisions (ADR)

### ADR-001: Separate Frontend and Backend Repos vs Monorepo
**Decision:** Monorepo with `apps/frontend` and `apps/backend`
**Reason:** Easier to share TypeScript types between frontend and backend; simpler deployment from one repo

### ADR-002: Prisma vs Raw SQL
**Decision:** Prisma ORM exclusively
**Reason:** Type safety, parameterized queries (SQLi prevention), migration management, better DX

### ADR-003: JWT Memory + httpOnly Cookie vs Session
**Decision:** JWT access token in memory + refresh token in httpOnly cookie
**Reason:** Stateless access token (scalable), XSS-safe refresh token, true logout via revocation

### ADR-004: Zustand vs Redux vs React Context
**Decision:** Zustand
**Reason:** Minimal boilerplate for this project size, no Provider wrapping hell, easy devtools integration

### ADR-005: react-hook-form vs Formik
**Decision:** react-hook-form + zod
**Reason:** Better performance (uncontrolled), native TypeScript support, zod schemas reusable for API validation

### ADR-006: Swagger via JSDoc vs OpenAPI YAML
**Decision:** swagger-jsdoc (inline JSDoc)
**Reason:** Co-located with route code, reduced drift between code and docs

### ADR-007: Time Simulation via DB Offset vs System Time
**Decision:** DB offset (SystemConfig table)
**Reason:** Non-destructive, doesn't affect real timestamps, easy to reason about, reversible

### ADR-008: Soft Delete vs Hard Delete for Products
**Decision:** Soft delete (deleted_at timestamp)
**Reason:** Orders reference products; deleting products would break order history. Soft delete preserves integrity while hiding from catalog.
