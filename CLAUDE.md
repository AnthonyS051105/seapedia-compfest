# CLAUDE.md — SEAPEDIA Project Context for Claude Code

> This file provides complete context for Claude Code to understand the SEAPEDIA project.
> Read this file FIRST before reading any other file in this repository.

---

## 🎯 Project Overview

**SEAPEDIA** is a multi-role e-commerce marketplace (similar to Tokopedia/Shopee) built for the **COMPFEST 18 Software Engineering Academy Technical Challenge**. It connects Buyers, Sellers, Delivery Drivers, and Admins in one platform.

**Target:** Complete all 7 levels (100 pts core + 25 pts bonus)

---

## 🏗️ Tech Stack (STRICT — Do not change without explicit instruction)

### Frontend (`apps/frontend/`)
- **Framework:** Next.js 14 with App Router (NOT Pages Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS only (no CSS modules, no styled-components)
- **State Management:** Zustand
- **Forms:** react-hook-form + zod resolver
- **HTTP Client:** axios (with interceptors for JWT refresh)
- **Notifications:** react-hot-toast
- **Icons:** lucide-react
- **Deployment:** Vercel

### Backend (`apps/backend/`)
- **Framework:** Express.js
- **Language:** TypeScript (strict mode)
- **ORM:** Prisma (ONLY use Prisma — no raw pg, no knex)
- **Database:** PostgreSQL (Supabase/Neon)
- **Auth:** JWT (access token 15min + refresh token 7 days in httpOnly cookie)
- **Password:** bcrypt (12 rounds)
- **Validation:** Zod schemas
- **Sanitization:** sanitize-html (for user-generated content)
- **API Docs:** swagger-jsdoc + swagger-ui-express
- **Security:** helmet, express-rate-limit, cors
- **Deployment:** Railway

---

## 📁 Project Structure

```
seapedia/
├── CLAUDE.md              ← You are here
├── PRD.md                 ← Product Requirements
├── SRS.md                 ← Software Requirements Specification
├── SDD.md                 ← System Design Document (DB schema, APIs, services)
├── UI_UX_FLOW.md          ← UI design and page flows
├── TASK_BREAKDOWN.md      ← Detailed implementation tasks per level
├── ARCHITECTURE.md        ← Architecture decisions and patterns
├── README.md              ← User-facing setup guide
├── apps/
│   ├── frontend/          ← Next.js 14 App
│   └── backend/           ← Express.js API
└── docs/
    └── TESTING_GUIDE.md   ← End-to-end test scenarios
```

---

## ⚡ Critical Business Rules (NEVER violate these)

### 1. Single-Store Cart Rule
- One cart can ONLY contain products from ONE store
- If buyer adds product from different store → return 409 with conflict message
- This MUST be enforced in the backend (not just frontend)
- The error message must clearly explain the rule

### 2. Active Role Authorization
- Authorization is based on `active_role` in JWT payload — NOT the list of all roles
- Every protected endpoint MUST check the active role server-side
- Frontend role state is UI-only; backend always re-validates from JWT

### 3. Order Status Lifecycle (EXACT sequence)
```
Sedang Dikemas → Menunggu Pengirim → Sedang Dikirim → Pesanan Selesai
                                                     ↘ Dikembalikan (overdue)
```
- Status transitions must be validated (cannot skip steps)
- Every status change creates an OrderStatusHistory entry with timestamp

### 4. Price Calculation Formula (EXACT order)
```
subtotal        = Σ (price × quantity)
discountAmount  = apply_discount(subtotal)        // if code provided
discounted      = subtotal - discountAmount
deliveryFee     = DELIVERY_FEES[method]
taxBase         = discounted + deliveryFee
ppn12           = round(taxBase × 0.12)          // round to integer
finalTotal      = taxBase + ppn12
```
- Discount is applied BEFORE PPN calculation
- PPN is 12% on (discounted subtotal + delivery fee)
- This must be documented in README

### 5. Checkout is Atomic
- All checkout steps run in a SINGLE Prisma `$transaction()`
- If ANY step fails, the entire checkout is rolled back
- This includes: wallet deduction, stock reduction, order creation, cart clearing

### 6. No Negative Stock
- Stock reduction uses conditional update: only decrement if `stock >= quantity`
- If stock becomes insufficient between cart add and checkout → reject with error

### 7. Driver Race Condition Prevention
- Job claiming uses `SELECT FOR UPDATE SKIP LOCKED` in a transaction
- Two drivers CANNOT take the same job simultaneously

### 8. Overdue is Idempotent
- Each order has `is_overdue_processed` flag
- Overdue processing checks this flag FIRST before doing anything
- Prevents double-refund, double stock restoration, double income reversal

### 9. Driver Earnings Rule
- Driver earns 80% of the delivery fee
- INSTANT (Rp 15,000) → Driver: Rp 12,000
- NEXT_DAY (Rp 10,000) → Driver: Rp 8,000
- REGULAR (Rp 6,000) → Driver: Rp 4,800
- Recorded in DeliveryJob.earning and DriverProfile.total_earnings

### 10. One Discount Per Order
- Buyer can apply either a Voucher OR a Promo — NOT both
- Vouchers have usage limits; Promos do not

---

## 🔒 Security Rules (MUST follow)

1. **SQL Injection:** Use Prisma ORM always. If using `$queryRaw`, use tagged template literals only:
   ```typescript
   // CORRECT ✅
   await prisma.$queryRaw`SELECT * FROM "DeliveryJob" WHERE id = ${jobId} FOR UPDATE`
   
   // WRONG ❌
   await prisma.$queryRaw(`SELECT * FROM "DeliveryJob" WHERE id = '${jobId}'`)
   ```

2. **XSS Prevention:**
   - Backend: Run `sanitize-html` on all user text inputs before storing in DB
   - Frontend: NEVER use `dangerouslySetInnerHTML` for user content
   - React JSX auto-escapes strings (safe by default)

3. **Password Storage:** ALWAYS use bcrypt with 12 rounds minimum

4. **JWT Storage:**
   - Access token: stored in memory (Zustand store) — NEVER localStorage
   - Refresh token: httpOnly cookie ONLY — NEVER accessible to JavaScript

5. **Refresh Token Revocation:** On logout, mark refresh token as `is_revoked = true` in DB

6. **Resource Ownership:** Every mutating endpoint must verify the resource belongs to the requesting user

---

## 📊 Database (Prisma Schema)

The complete schema is in `SDD.md` → Section 2.1. Key tables:

| Table | Purpose |
|-------|---------|
| `User` | Base user accounts |
| `UserRole` | Many-to-many user↔role |
| `RefreshToken` | JWT refresh token storage + revocation |
| `BuyerProfile` | Buyer wallet balance |
| `SellerProfile` | Seller income tracking |
| `DriverProfile` | Driver earnings tracking |
| `Store` | Seller store (unique name) |
| `Product` | Products with soft delete |
| `CartItem` | Buyer cart items |
| `DeliveryAddress` | Buyer addresses |
| `WalletTransaction` | TOP_UP / PAYMENT / REFUND history |
| `Order` | Orders with full price snapshot |
| `OrderItem` | Items with price snapshot at time of order |
| `OrderStatusHistory` | Status changes with timestamps |
| `DeliveryJob` | Driver job assignments |
| `Voucher` | Discount vouchers with usage limit |
| `Promo` | Discount promos (no usage limit) |
| `AppReview` | Public app reviews |
| `SystemConfig` | Key-value config (system_date_offset for time simulation) |

**IMPORTANT:** Always use `Decimal` type for monetary values in Prisma, not `Float`.

---

## 🌐 API Conventions

### Base URL
- Development: `http://localhost:3001/api`
- Production: `https://seapedia-api.railway.app/api`

### Standard Response Envelope
```typescript
// Success
{ success: true, message?: string, data: any, meta?: PaginationMeta }

// Error
{ success: false, message: string, errors?: FieldError[] }
```

### Auth Headers
```
Authorization: Bearer <access_token>
Cookie: seapedia_refresh_token=<token>  (httpOnly, set by server)
```

### Pagination Query Params
All list endpoints support: `?page=1&limit=10`

---

## 🎨 Frontend Conventions

### File Naming
- Pages: `app/[route]/page.tsx`
- Layouts: `app/[route]/layout.tsx`
- Components: `components/[category]/ComponentName.tsx` (PascalCase)
- Hooks: `hooks/useHookName.ts` (camelCase, `use` prefix)
- Stores: `store/name.store.ts` (camelCase)
- Types: `types/index.ts` or `types/[domain].ts`
- Utils: `lib/[name].ts`

### Component Structure
```typescript
// components/ui/Button.tsx
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export function Button({ variant = 'primary', size = 'md', isLoading, children, className, ...props }: ButtonProps) {
  // implementation
}
```

### API Calls Pattern
```typescript
// Always use the api instance from lib/api.ts (NOT fetch, NOT axios directly)
import { api } from '@/lib/api'

const { data } = await api.get('/products')
const { data } = await api.post('/buyer/cart', { product_id, quantity })
```

### Error Handling Pattern
```typescript
try {
  const { data } = await api.post('/buyer/checkout', payload)
  toast.success('Pesanan berhasil dibuat!')
  router.push(`/buyer/orders/${data.data.id}`)
} catch (error: any) {
  const message = error.response?.data?.message || 'Terjadi kesalahan'
  toast.error(message)
}
```

### Route Protection
- Protected routes use `app/[role]/layout.tsx` to check active role
- If wrong role → redirect to `/auth/select-role`
- If not logged in → redirect to `/auth/login`

---

## 🗂️ Backend Conventions

### File Structure Pattern
```
src/
├── routes/
│   └── seller.routes.ts    # Route definitions + Swagger annotations
├── controllers/
│   └── seller.controller.ts # HTTP layer (parse req, call service, send response)
├── services/
│   └── seller.service.ts   # Business logic (no HTTP, no direct DB)
├── middleware/
│   ├── authenticate.ts     # JWT verification
│   └── requireRole.ts      # Active role check
└── utils/
    └── pricing.ts          # Pure calculation functions
```

### Controller Pattern
```typescript
// controllers/seller.controller.ts
export const processOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const sellerId = req.user.sub  // from JWT
    const order = await sellerService.processOrder(sellerId, id)
    return res.status(200).json({ success: true, data: order })
  } catch (error) {
    next(error)  // pass to global error handler
  }
}
```

### Service Pattern
```typescript
// services/seller.service.ts
export class SellerService {
  async processOrder(sellerId: string, orderId: string) {
    // 1. Find order + validate ownership
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { ... } })
    if (!order) throw new NotFoundError('Order not found')
    if (order.store.seller_id !== sellerId) throw new ForbiddenError('Not your order')
    if (order.status !== 'SEDANG_DIKEMAS') throw new BadRequestError('Order cannot be processed')
    
    // 2. Update in transaction
    return await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({ where: { id: orderId }, data: { status: 'MENUNGGU_PENGIRIM' } })
      await tx.orderStatusHistory.create({ data: { order_id: orderId, status: 'MENUNGGU_PENGIRIM' } })
      await tx.deliveryJob.create({ data: { order_id: orderId } })
      return updated
    })
  }
}
```

### Swagger Annotation Pattern
```typescript
/**
 * @swagger
 * /seller/orders/{id}/process:
 *   post:
 *     summary: Process an incoming order
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Order processed successfully
 *       400:
 *         description: Order cannot be processed (wrong status)
 *       403:
 *         description: Not your order
 */
router.post('/:id/process', authenticate, requireRole('SELLER'), sellerController.processOrder)
```

---

## 🌱 Seed Accounts (for testing)

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| Admin | admin@seapedia.com | Admin@123 | Admin role only |
| Seller+Buyer | seller1@seapedia.com | Seller@123 | Has store + 5 products |
| Buyer+Driver | buyer1@seapedia.com | Buyer@123 | Rp 1,000,000 balance |
| Driver only | driver1@seapedia.com | Driver@123 | No other roles |

---

## 🚀 Development Commands

```bash
# Backend
cd apps/backend
npm run dev          # Start with ts-node-dev
npx prisma migrate dev --name <description>  # Create migration
npx prisma db seed   # Run seed file
npx prisma studio    # Open Prisma Studio (DB GUI)

# Frontend
cd apps/frontend
npm run dev          # Start Next.js dev server (port 3000)

# Both simultaneously (from root)
npm run dev          # If concurrently is configured in root package.json
```

---

## 🔧 Environment Variables

### Backend `.env`
```
DATABASE_URL=postgresql://user:pass@host:5432/seapedia
JWT_SECRET=your-256-bit-secret-here
JWT_REFRESH_SECRET=your-different-256-bit-secret-here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
PORT=3001
BCRYPT_ROUNDS=12
```

### Frontend `.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

---

## 📝 README Checklist (Must include all of these)

The README must document:
- [ ] Single-store checkout rule (why and how it works)
- [ ] Discount formula: subtotal → discount → delivery fee → PPN 12% → total
- [ ] Voucher vs Promo distinction (usage limit, no stacking)
- [ ] Driver earning rule (80% of delivery fee, table per method)
- [ ] Delivery SLA per method (Instant=1day, NextDay=2days, Regular=3days)
- [ ] How to simulate next day (Admin dashboard → "Simulasi Hari Berikutnya")
- [ ] Security: Prisma ORM for SQLi, sanitize-html for XSS, Zod for validation
- [ ] Token behavior: 15min access, 7day refresh, revoked on logout
- [ ] RBAC: active_role enforced server-side per endpoint

---

## ⚠️ Common Pitfalls (Avoid these)

1. **NEVER store access token in localStorage** — XSS risk. Use memory (Zustand).
2. **NEVER trust frontend role state for authorization** — always verify from JWT on backend.
3. **NEVER use `Float` for prices in Prisma** — use `Decimal` to avoid floating-point errors.
4. **NEVER allow negative stock** — use conditional decrement with stock check.
5. **NEVER create raw SQL strings with interpolation** — always use Prisma tagged templates.
6. **NEVER skip the Prisma `$transaction()` for checkout** — partial failures must be rolled back.
7. **ALWAYS sanitize user-generated text before storing** — even store names and product descriptions.
8. **ALWAYS check resource ownership** on update/delete — not just role.
9. **ALWAYS store price snapshots in OrderItem** — product price can change after order.
10. **ALWAYS create OrderStatusHistory entry** when order status changes.

---

## 📚 Reference Documents

Read these documents in this order for full context:

1. **CLAUDE.md** (this file) — Start here
2. **PRD.md** — Business requirements and feature list by level
3. **SRS.md** — Technical specifications, API contracts, validation rules
4. **SDD.md** — Database schema, service implementations, code examples
5. **UI_UX_FLOW.md** — Page designs, component layouts, user flows
6. **TASK_BREAKDOWN.md** — Granular implementation tasks per level
7. **ARCHITECTURE.md** — Architecture decisions and patterns
8. **ZOD_SCHEMAS.md** — Complete Zod validation schemas (copy verbatim, don't invent new ones)
9. **SWAGGER_REFERENCE.md** — Swagger annotation patterns and examples (follow exactly)
10. **README.md** — Final user-facing doc (must match this when project is complete)
11. **docs/TESTING_GUIDE.md** — End-to-end test scenarios per role
