# SEAPEDIA — Task Breakdown

**Version:** 1.0.0  
**Format:** Each task has estimated time, dependencies, and implementation notes.  
**Convention:** Tasks are ordered by implementation priority within each level.

---

## Project Setup (Before Level 1)

### SETUP-01: Initialize Monorepo

- [x] Create root `package.json` with workspaces config
- [x] Create `apps/frontend/` and `apps/backend/` directories
- [x] Initialize Git repository + `.gitignore`
- [ ] Create root `README.md` skeleton

### SETUP-02: Backend Setup

- [x] `cd apps/backend && npm init -y`
- [x] Install dependencies:
  ```
  express typescript ts-node-dev @types/node @types/express
  prisma @prisma/client
  jsonwebtoken @types/jsonwebtoken
  bcryptjs @types/bcryptjs
  cors @types/cors
  helmet
  express-rate-limit
  zod
  sanitize-html @types/sanitize-html
  cookie-parser @types/cookie-parser
  swagger-jsdoc swagger-ui-express
  dotenv
  ```
- [x] Configure `tsconfig.json` (strict mode, paths)
- [x] Create `src/app.ts` (Express app) and `src/server.ts` (entry)
- [x] Set up `prisma/schema.prisma` with all models
- [x] Run `npx prisma init` and configure DATABASE_URL (configured directly with Supabase pooled `DATABASE_URL` + direct `DIRECT_URL` for migrations, instead of running `prisma init`)
- [x] Create `.env.example` with all required variables

### SETUP-03: Frontend Setup

- [x] `cd apps/frontend && npx create-next-app@latest . --typescript --tailwind --app --src-dir=false` (scaffolded with Next.js 16 + Tailwind 4, latest at time of setup — see ARCHITECTURE.md deviation note)
- [x] Install additional dependencies:
  ```
  axios zustand
  react-hook-form @hookform/resolvers zod
  react-hot-toast
  lucide-react
  clsx tailwind-merge
  dompurify @types/dompurify
  ```
  (dompurify not yet installed — not needed until user-generated content is rendered)
- [x] Configure Tailwind CSS with custom color palette (Tailwind v4 CSS-based `@theme` tokens in `app/globals.css`, not `tailwind.config.ts`)
- [x] Create `lib/api.ts` (axios instance)
- [x] Create `proxy.ts` (Next.js route protection — renamed from `middleware.ts` per Next.js 16 convention)
- [x] Set up `store/` directory (Zustand stores)
- [x] Create `types/index.ts` (shared TypeScript interfaces)

### SETUP-04: Database

- [x] Provision PostgreSQL on Supabase or Neon
- [x] Copy DATABASE_URL to `.env`
- [x] Run `npx prisma migrate dev --name init` to create all tables
- [x] Verify schema with `npx prisma studio` (verified via direct query against `information_schema.tables` — all 19 model tables confirmed; Studio itself not opened since it's an interactive server)

---

## Level 1: Public Marketplace, Auth & Reviews

### TASK-1.1: Database Schema (Backend)

- [x] Write complete Prisma schema (all models from SDD)
- [x] Run initial migration
- [x] Create `prisma/seed.ts` skeleton (fill in later) — fully implemented, not just a skeleton

### TASK-1.2: Auth Endpoints (Backend)

**File:** `src/routes/auth.routes.ts`, `src/controllers/auth.controller.ts`, `src/services/auth.service.ts`

- [x] `POST /api/auth/register` — register new user
  - Validate: username (unique), email (unique, valid format), password (min 8)
  - Hash password with bcrypt (12 rounds)
  - Create User record
  - Create UserRole records for selected roles
  - Create BuyerProfile/SellerProfile/DriverProfile based on roles
  - Return: user data (no password)

- [x] `POST /api/auth/login` — login
  - Find user by email or username
  - Compare password with bcrypt
  - Generate access token (JWT, 15min) with: sub, username, roles[], active_role
  - If exactly 1 role → set active_role
  - If multiple roles or 0 roles → active_role = null
  - Generate refresh token (JWT, 7days), store in DB
  - Set refresh token as httpOnly cookie
  - Return: access_token, user info

- [x] `POST /api/auth/logout` — logout
  - Read refresh token from cookie
  - Mark refresh token as revoked in DB
  - Clear cookie
  - Return: 200 OK

- [x] `POST /api/auth/refresh` — refresh access token
  - Read refresh token from cookie
  - Verify JWT signature + expiry
  - Check DB: not revoked
  - Issue new access token
  - Return: new access_token

- [x] `POST /api/auth/select-role` — choose active role
  - Verify user owns requested role
  - Issue new access token with active_role set
  - Return: new access_token

- [x] `GET /api/auth/me` — current user profile
  - Return: user data + roles + active_role + financial placeholders

### TASK-1.3: Auth Middleware (Backend)

**File:** `src/middleware/authenticate.ts`, `src/middleware/requireRole.ts`

- [x] `authenticate` middleware — extract + verify JWT from Authorization header
  - Return 401 if missing/invalid/expired
  - Attach `req.user` payload

- [x] `requireRole(role)` middleware — check active_role
  - Return 403 if active_role !== required role

- [x] Input validation middleware using Zod schemas (`validateBody`, `validateQuery`)

### TASK-1.4: Public Catalog Endpoints (Backend)

**File:** `src/routes/public.routes.ts`

- [x] `GET /api/products` — paginated product list
  - Query params: page, limit, search, store_id, min_price, max_price, sort
  - Include store info in response

- [x] `GET /api/products/:id` — product detail
  - Include store info
  - Return 404 if not found

- [x] `GET /api/stores` — store listing
- [x] `GET /api/stores/:id` — store detail with products

### TASK-1.5: App Reviews Endpoints (Backend)

**File:** `src/routes/review.routes.ts`

- [x] `POST /api/reviews` — submit review (no auth required)
  - Validate: reviewer_name, rating (1-5), comment
  - Sanitize reviewer_name and comment (strip HTML)
  - Store in DB

- [x] `GET /api/reviews` — list reviews (paginated, DESC order)

### TASK-1.6: Error Handler & Response Util (Backend)

- [x] Create `src/middleware/errorHandler.ts` — global error handler
- [x] Create `src/utils/response.ts` — standard response envelope
- [x] Create custom error classes: `BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`

### TASK-1.7: Swagger Setup (Backend)

- [x] Configure `swagger-jsdoc` in `src/config/swagger.ts`
- [x] Add JSDoc annotations to all auth + public routes
- [x] Serve Swagger UI at `GET /api/docs`

### TASK-1.8: Landing Page (Frontend)

**File:** `app/(public)/page.tsx` (moved into route group — see TASK-1.9/1.14 notes)

- [x] Hero section (title, subtitle, CTA buttons)
- [x] Featured products section (fetch from /api/products, limit=8)
- [x] "How It Works" section (3 steps)
- [x] App Reviews section (fetch from /api/reviews)
- [x] Review submission form (inline)
- [x] Footer component

### TASK-1.9: Navbar Component (Frontend)

**File:** `components/layout/Navbar.tsx`

- [x] Guest nav: Logo | Products | Login | Register
- [x] Logged-in nav: Logo | Products | 🛒 Cart | [Username + Role] ▼ | Dropdown (switch role, logout)
- [x] Active role badge visible in navbar
- [x] Mobile hamburger menu with drawer
- [x] Cart icon with item count badge (static 0 — wired to real cart state in TASK-3.7)

### TASK-1.10: Auth Pages (Frontend)

- [x] `app/auth/login/page.tsx` — login form
  - react-hook-form + zod validation
  - POST /auth/login → handle multi-role redirect
  - Store access token in Zustand store

- [x] `app/auth/register/page.tsx` — register form
  - Checkboxes for role selection (Buyer, Seller, Driver)
  - POST /auth/register

- [x] `app/auth/select-role/page.tsx` — role selection cards
  - Show only roles user owns
  - POST /auth/select-role → redirect to role dashboard

### TASK-1.11: Auth Store (Frontend)

**File:** `store/auth.store.ts`

- [x] State: user, accessToken, activeRole, isLoading (`isAuthenticated` used in place of `isLoading`; initial auth-check loading state lives in `app/providers.tsx`)
- [x] Actions: login, logout, selectRole, refreshToken, setUser (implemented as `setAuth`/`setAccessToken`/`setActiveRole`/`clearAuth`; login/logout/refresh themselves are page-level API calls, not store actions)
- [x] Persist accessToken in memory (NOT localStorage)
- [x] Auto-refresh token on 401 response (via axios interceptor)

### TASK-1.12: Dashboard Shells (Frontend)

- [x] `app/buyer/layout.tsx` — buyer layout with sidebar
- [x] `app/seller/layout.tsx` — seller layout with sidebar
- [x] `app/driver/layout.tsx` — driver layout with sidebar
- [x] `app/admin/layout.tsx` — admin layout with sidebar
- [x] Each dashboard shell shows placeholder content
- [x] Route protection: redirect to /auth/login if no token
- [x] Route protection: redirect to /auth/select-role if wrong active_role

### TASK-1.13: Reusable UI Components (Frontend)

**File:** `components/ui/`

- [x] `Button.tsx` — variants: primary, secondary, outline, ghost, danger
- [x] `Input.tsx` — with label, error state, helper text
- [x] `Card.tsx` — basic card container
- [x] `Badge.tsx` — status badge with color variants
- [x] `Modal.tsx` — dialog with backdrop
- [x] `Toast.tsx` — using react-hot-toast (configured in `app/providers.tsx`)
- [ ] `Spinner.tsx` — loading indicator
- [x] `Skeleton.tsx` — loading skeleton
- [x] `StarRating.tsx` — interactive + display-only star rating
- [x] `Pagination.tsx` — page number controls
- [x] `EmptyState.tsx` — empty state with icon + message

### TASK-1.14: Next.js Middleware (Frontend)

**File:** `proxy.ts` (renamed from `middleware.ts` — Next.js 16 deprecated the old convention)

- [x] Protect `/buyer/*` routes (check refresh token cookie)
- [x] Protect `/seller/*` routes
- [x] Protect `/driver/*` routes
- [x] Protect `/admin/*` routes
- [x] Redirect to /auth/login if no cookie
- [x] Public routes: /, /products/_, /stores/_, /auth/\* (implicit — only protected prefixes are matched)

---

## Level 2: Seller Experience

### TASK-2.1: Seller Store Endpoints (Backend)

**File:** `src/routes/seller.routes.ts`

- [x] `POST /api/seller/store` — create store
  - Validate: name unique (case-insensitive), 3-100 chars
  - Seller can only have 1 store
  - Return 409 if store name taken or seller already has store

- [x] `GET /api/seller/store` — get own store details
- [x] `PUT /api/seller/store` — update store (name, description, logo_url)

### TASK-2.2: Seller Product Endpoints (Backend)

- [x] `GET /api/seller/products` — paginated list (own products only)
- [x] `GET /api/seller/products/:id` — own product detail
- [x] `POST /api/seller/products` — create product
  - Requires seller to have a store first
  - Validate: name, price > 0, stock >= 0

- [x] `PUT /api/seller/products/:id` — update product
  - Verify ownership (product.store.seller_id === req.user.sub)
  - Return 403 if not owner (implemented as 404 — not-found is used instead of 403 to avoid leaking existence of other sellers' products; see ARCHITECTURE.md IDOR mitigation pattern)

- [x] `DELETE /api/seller/products/:id` — soft delete (set deleted_at)
  - Verify ownership

### TASK-2.3: Seller Dashboard Pages (Frontend)

- [ ] `app/seller/dashboard/page.tsx` — stats + recent orders summary (still placeholder stat cards, not wired to real data)
- [x] `app/seller/store/page.tsx` — store profile form (create/edit)
  - Check if store exists on mount
  - If no store → show create form
  - If store exists → show edit form

- [x] `app/seller/products/page.tsx` — product list with CRUD
- [x] `app/seller/products/new/page.tsx` — create product form
- [x] `app/seller/products/[id]/edit/page.tsx` — edit product form

### TASK-2.4: Public Catalog Connected to Real Data (Frontend)

- [x] `app/(public)/products/page.tsx` — product listing with search/filter/pagination
  - Fetch from /api/products with query params
  - ProductCard component with store name

- [x] `app/(public)/products/[id]/page.tsx` — product detail
  - Show store info block
  - Add to cart button (Buyer only) — calls `POST /buyer/cart`; endpoint not yet implemented (Level 3/TASK-3.3), so this currently surfaces a graceful error toast until that endpoint exists

- [x] `app/(public)/stores/[id]/page.tsx` — store page with product list

---

## Level 3: Buyer Wallet, Cart & Checkout

### TASK-3.1: Buyer Wallet Endpoints (Backend)

- [x] `GET /api/buyer/wallet` — balance + transaction history
- [x] `POST /api/buyer/wallet/topup` — top up
  - Validate amount: min 10000, max 10000000
  - Update balance atomically
  - Create TOP_UP wallet transaction record

### TASK-3.2: Delivery Address Endpoints (Backend)

- [x] `GET /api/buyer/addresses` — list addresses
- [x] `POST /api/buyer/addresses` — create address
- [x] `PUT /api/buyer/addresses/:id` — update (verify ownership)
- [x] `DELETE /api/buyer/addresses/:id` — delete (verify ownership)
- [x] `PUT /api/buyer/addresses/:id/default` — set as default
  - Unset previous default address first

### TASK-3.3: Cart Endpoints (Backend)

- [x] `GET /api/buyer/cart` — cart with items, store info, subtotal
- [x] `POST /api/buyer/cart` — add item
  - Validate product exists and has stock
  - Single-store rule: check if cart has items from different store → 409
  - If same product exists → increment quantity
  - If different product, same store → add

- [x] `PUT /api/buyer/cart/:itemId` — update quantity
  - Validate: quantity >= 1, quantity <= product.stock
  - Verify item belongs to this buyer

- [x] `DELETE /api/buyer/cart/:itemId` — remove item
- [x] `DELETE /api/buyer/cart` — clear all items

### TASK-3.4: Checkout Endpoints (Backend)

- [x] `POST /api/buyer/checkout/preview` — calculate totals without creating order
  - Same validation as checkout
  - Return pricing breakdown

- [x] `POST /api/buyer/checkout` — place order (full transaction in Prisma $transaction)
  - All steps from SDD Section 3.4

- [x] `GET /api/buyer/orders` — order history (paginated, filter by status)
- [x] `GET /api/buyer/orders/:id` — order detail with items + status history

### TASK-3.5: Seller Incoming Orders Endpoint (Backend)

- [x] `GET /api/seller/orders` — orders for this seller's store
- [x] `GET /api/seller/orders/:id` — order detail

### TASK-3.6: Wallet & Address Pages (Frontend)

- [x] `app/buyer/wallet/page.tsx` — balance card + top up button + history list
- [x] `app/buyer/addresses/page.tsx` — address list + CRUD forms

### TASK-3.7: Cart Page (Frontend)

- [x] `app/buyer/cart/page.tsx`
  - Show single-store warning banner
  - Cart items with quantity controls
  - Subtotal calculation (client-side)
  - Empty state
  - "Lanjut ke Checkout" button

- [x] Cart store (Zustand) — sync with backend cart state

### TASK-3.8: Checkout Page (Frontend)

- [x] `app/buyer/checkout/page.tsx`
  - Address selection (from saved addresses)
  - Delivery method selection (radio buttons)
  - Discount code input with validate button
  - Price breakdown display (call /checkout/preview on change)
  - Confirm order button
  - Success → redirect to /buyer/orders/:id

### TASK-3.9: Order Pages (Frontend)

- [x] `app/buyer/orders/page.tsx` — order list with status filter
- [x] `app/buyer/orders/[id]/page.tsx` — order detail
  - Status timeline component (Stepper)
  - Price breakdown
  - Items list

- [x] `app/seller/orders/page.tsx` — seller incoming orders
- [x] `app/seller/orders/[id]/page.tsx` — seller order detail

### TASK-3.10: Pricing Utility (Backend)

- [x] `src/utils/pricing.ts` — calculatePricing(), DELIVERY_FEES constant
- [ ] Unit test pricing calculations (optional but recommended)

---

## Level 4: Discounts & Seller Order Processing

### TASK-4.1: Voucher & Promo Endpoints (Backend)

- [ ] `POST /api/admin/vouchers` — create voucher (Admin only)
  - Validate: code unique, discount_value > 0, expiry_date > now, max_usage > 0

- [ ] `GET /api/admin/vouchers` — list with filters
- [ ] `GET /api/admin/vouchers/:id` — detail

- [ ] `POST /api/admin/promos` — create promo (Admin only)
- [ ] `GET /api/admin/promos` — list
- [ ] `GET /api/admin/promos/:id` — detail

- [ ] `GET /api/vouchers/validate?code=XXX` — validate discount code (Buyer)
  - Check: exists, not expired, usage remaining, is_active
  - Return: discount info + validity + error reason if invalid

### TASK-4.2: Discount Service (Backend)

**File:** `src/services/discount.service.ts`

- [ ] `validateDiscountCode(code, subtotal)` — full validation
- [ ] `calculateDiscount(voucher/promo, subtotal)` — apply discount formula
  - PERCENTAGE: min(subtotal \* rate, maxDiscountAmount ?? Infinity)
  - FIXED_AMOUNT: min(value, subtotal)
- [ ] `applyVoucherUsage(tx, voucherId)` — increment usage in transaction

### TASK-4.3: Update Checkout with Discount (Backend)

- [ ] Integrate discount service into checkout.service.ts
- [ ] Update checkout preview endpoint to accept discount_code
- [ ] Return discount_type, discount_code in order response

### TASK-4.4: Seller Order Processing (Backend)

- [x] `POST /api/seller/orders/:id/process` — process order
  - Validate: order belongs to this seller
  - Validate: status === SEDANG_DIKEMAS
  - Update status → MENUNGGU_PENGIRIM
  - Create OrderStatusHistory entry
  - Create DeliveryJob record (driver_id = null)
  - Return updated order

### TASK-4.5: Reports Endpoints (Backend)

- [ ] `GET /api/buyer/reports` — spending summary
  - Total spent, orders count, by status breakdown
  - Date range filter (from_date, to_date)

- [ ] `GET /api/seller/reports/income` — income summary
  - Total income (from PESANAN_SELESAI orders only)
  - Orders count, average order value
  - Date range filter

### TASK-4.6: Discount UI (Frontend)

- [ ] Discount code input + validate in checkout page
- [ ] Show applied discount in price breakdown
- [ ] Show discount type label (Voucher / Promo)
- [ ] Error messages for invalid codes

### TASK-4.7: Seller Order Processing UI (Frontend)

- [x] Process order button in seller order detail/list (detail page only — order list links to detail, button lives there)
- [x] Confirmation modal before processing
- [x] Status badge updates after processing

### TASK-4.8: Reports Pages (Frontend)

- [ ] `app/buyer/reports/page.tsx` — spending summary with charts
- [ ] `app/seller/reports/page.tsx` — income summary with charts
  - Simple bar chart for monthly income (use recharts or native SVG)

### TASK-4.9: Order Status Timeline Component (Frontend)

**File:** `components/OrderStatusTimeline.tsx`

- [x] Vertical stepper with timestamps
- [x] Different icons per status
- [x] Completed/current/pending visual states
- [x] Used on buyer order detail + seller order detail

---

## Level 5: Delivery & Driver Workflow

### TASK-5.1: Driver Job Endpoints (Backend)

**File:** `src/routes/driver.routes.ts`

- [ ] `GET /api/driver/jobs` — available jobs
  - Only orders with status = MENUNGGU_PENGIRIM and driver_id IS NULL
  - Include order summary, delivery address, delivery method, estimated earning

- [ ] `GET /api/driver/jobs/active` — current taken job (driver_id = this driver, status = SEDANG_DIKIRIM)
- [ ] `GET /api/driver/jobs/history` — completed jobs (status = PESANAN_SELESAI)
- [ ] `GET /api/driver/jobs/:id` — job detail with order info + address

### TASK-5.2: Take Job & Complete (Backend)

**File:** `src/services/driver.service.ts`

- [ ] `POST /api/driver/jobs/:id/take` — take job
  - Prisma $transaction with SELECT FOR UPDATE (raw query)
  - Set delivery_job.driver_id, taken_at
  - Update order status → SEDANG_DIKIRIM
  - Create OrderStatusHistory entry
  - Return 409 if already taken

- [ ] `POST /api/driver/jobs/:id/complete` — confirm completion
  - Validate: driver_id === this driver
  - Update order status → PESANAN_SELESAI
  - Set delivery_job.completed_at
  - Calculate driver earning (80% of delivery fee)
  - Set delivery_job.earning
  - Update DriverProfile.total_earnings += earning
  - Create OrderStatusHistory entry

### TASK-5.3: Driver Earnings (Backend)

- [ ] `GET /api/driver/earnings` — earnings summary
  - Total earnings, completed jobs count, jobs list with earnings per job
  - Date range filter

### TASK-5.4: Driver Dashboard Pages (Frontend)

- [ ] `app/driver/dashboard/page.tsx` — stats: active job, today's earnings
- [ ] `app/driver/jobs/page.tsx` — available jobs list
  - Job cards with estimated earning, delivery method, destination area
  - "Ambil Pekerjaan" button → confirmation modal

- [ ] `app/driver/jobs/active/page.tsx` — active job detail
  - Buyer info, destination address, items summary
  - "Konfirmasi Selesai" button

- [ ] `app/driver/jobs/history/page.tsx` — completed jobs
- [ ] `app/driver/earnings/page.tsx` — earnings summary

### TASK-5.5: Delivery Tracking (Frontend)

- [ ] Update buyer order detail to show driver info when SEDANG_DIKIRIM
- [ ] Update seller order detail to show delivery status
- [ ] Order status timeline auto-updated when polling or navigating

---

## Level 6: Admin Monitoring & Overdue Handling

### TASK-6.1: Admin Middleware & Route Setup (Backend)

- [ ] Ensure all `/api/admin/*` routes require active_role = ADMIN
- [ ] Create seed for admin account

### TASK-6.2: Admin Dashboard Stats (Backend)

- [ ] `GET /api/admin/dashboard/stats` — aggregate counts
  - users (total, by role)
  - stores (total, active)
  - products (total, active, out-of-stock)
  - orders (total, by status)
  - vouchers (total, active, expired)
  - promos (total, active)
  - delivery jobs (total, available, in-progress, completed)
  - overdue orders count

### TASK-6.3: Admin List Endpoints (Backend)

- [ ] `GET /api/admin/users` — paginated user list with roles
- [ ] `GET /api/admin/stores` — paginated store list
- [ ] `GET /api/admin/products` — paginated product list
- [ ] `GET /api/admin/orders` — all orders with status filter
- [ ] `GET /api/admin/delivery-jobs` — all delivery jobs
- [ ] `GET /api/admin/overdue-orders` — overdue orders

### TASK-6.4: Overdue Service (Backend)

**File:** `src/services/overdue.service.ts`

- [ ] `getSystemDate()` — read system_date_offset from DB, apply to current date
- [ ] `simulateNextDay()` — increment offset + trigger processOverdueOrders()
- [ ] `processOverdueOrders()` — find + process all overdue orders
- [ ] `refundOrder(order)` — full refund transaction (as in SDD Section 3.5)

### TASK-6.5: Admin Overdue Endpoints (Backend)

- [ ] `POST /api/admin/simulate-next-day` — increment system day + process overdue
- [ ] `POST /api/admin/process-overdue` — manual trigger for overdue processing

### TASK-6.6: Admin Dashboard Pages (Frontend)

- [ ] `app/admin/dashboard/page.tsx` — stat cards + charts
  - System date display with "Simulate Next Day" button
  - Overdue orders count card (highlighted in red)

- [ ] `app/admin/users/page.tsx` — user table
- [ ] `app/admin/stores/page.tsx` — store table
- [ ] `app/admin/orders/page.tsx` — orders table with status filter
- [ ] `app/admin/delivery-jobs/page.tsx` — delivery jobs table
- [ ] `app/admin/overdue/page.tsx` — overdue orders + processing button

### TASK-6.7: Voucher & Promo Management UI (Frontend)

- [ ] `app/admin/vouchers/page.tsx` — list + create form modal
- [ ] `app/admin/vouchers/[id]/page.tsx` — detail view
- [ ] `app/admin/promos/page.tsx` — list + create form modal
- [ ] `app/admin/promos/[id]/page.tsx` — detail view

---

## Level 7: Security Hardening & Finalization

### TASK-7.1: SQL Injection Prevention Audit (Backend)

- [ ] Audit all Prisma queries — ensure no raw SQL with string interpolation
- [ ] Any `$queryRaw` must use tagged template literals (parameterized)
- [ ] Document in README: "All queries use Prisma ORM which parameterizes automatically"

### TASK-7.2: XSS Prevention (Backend + Frontend)

- [x] Backend: Add `sanitize-html` to review submit handler (done in TASK-1.5, verified with live `<script>`/`onerror` XSS payload via curl — both stripped)
- [ ] Backend: Add sanitization to any other user-submitted text fields (store.name, product.description, etc.)
- [ ] Frontend: Ensure all user-generated content rendered with React (JSX auto-escapes)
- [ ] Frontend: Never use `dangerouslySetInnerHTML` for user content
- [ ] Test: submit `<script>alert('xss')</script>` in review form → should render as plain text

### TASK-7.3: Input Validation Hardening (Backend)

- [ ] Review all Zod schemas — ensure all required fields are validated
- [ ] Add validations: email format, phone format (Indonesian), price > 0, stock >= 0, rating 1-5
- [ ] Return 400 with field-level error details for validation failures
- [ ] Reject oversized payloads (set Express body size limit: 10mb)

### TASK-7.4: Session & Token Security (Backend)

- [ ] Verify refresh token revocation on logout works correctly
- [ ] Verify expired access tokens are rejected
- [ ] Add token cleanup job: `DELETE FROM RefreshToken WHERE expires_at < NOW()`
  - Can be triggered manually or on startup

- [ ] Document token expiry behavior in README

### TASK-7.5: RBAC Audit (Backend)

- [ ] Go through ALL protected endpoints and verify `requireRole()` middleware is applied
- [ ] Verify resource ownership checks exist on all mutating endpoints:
  - Seller: products, orders, store
  - Buyer: cart, orders, addresses, wallet
  - Driver: delivery jobs
- [ ] Admin endpoints: verify no non-admin can access

### TASK-7.6: Rate Limiting (Backend)

- [ ] Apply rate limiter to auth endpoints: 10 requests/minute per IP
- [ ] Apply general rate limiter: 100 requests/minute per IP

### TASK-7.7: Helmet Security Headers (Backend)

- [ ] Verify `helmet()` is applied in app.ts
- [ ] Configure CSP if needed

### TASK-7.8: Seed Data (Backend)

**File:** `prisma/seed.ts`

Complete seed with:

- [x] Admin account: admin@seapedia.com / Admin@123
- [x] Seller account (also Buyer): seller1@seapedia.com / Seller@123
  - Store: "Toko Elektronik Maju"
  - 5+ products with stock

- [x] Buyer account (also Driver): buyer1@seapedia.com / Buyer@123
  - Wallet balance: Rp 1,000,000
  - 1 default address

- [x] Driver-only account: driver1@seapedia.com / Driver@123
- [x] 2 active vouchers (HEMAT10, DISC50K)
- [x] 2 active promos (PROMO15, FLASH25K)
- [x] Run: `npx prisma db seed`

### TASK-7.9: Swagger Annotations (Backend)

- [ ] Add JSDoc Swagger annotations to ALL route files
- [ ] Document all request bodies, query params, responses
- [ ] Document auth requirements (bearerAuth) per endpoint
- [ ] Verify Swagger UI renders at /api/docs

### TASK-7.10: README (Root)

Complete README with sections:

- [ ] Project overview
- [ ] Tech stack
- [ ] Prerequisites
- [ ] Local setup instructions (step by step)
- [ ] Environment variables list (frontend + backend)
- [ ] Database setup + migration + seed commands
- [ ] Demo accounts table (all 4 roles)
- [ ] Single-store checkout rule explanation
- [ ] Discount combination rule (no stacking, 1 code per order)
- [ ] PPN 12% calculation formula (with example)
- [ ] Driver earning rule (80% of delivery fee, per method table)
- [ ] Delivery SLA rules (per method)
- [ ] How to simulate next day
- [ ] Security measures: SQL Injection, XSS, input validation, session, RBAC
- [ ] API documentation URL
- [ ] Deployment URL (if deployed)
- [ ] End-to-end testing guide

### TASK-7.11: End-to-End Testing Guide

Create `docs/TESTING_GUIDE.md`:

- [ ] Guest flow: browse → view product → submit review
- [ ] Buyer flow: register → login → top up → add to cart → checkout → track order
- [ ] Seller flow: login → create store → create product → process order
- [ ] Driver flow: login → find job → take job → complete job
- [ ] Admin flow: login → dashboard → create voucher → simulate day → check overdue
- [ ] Security test: XSS input in review
- [ ] Security test: Wrong role access attempt

### TASK-7.12: Deployment

- [ ] Deploy backend to Railway
  - Set all environment variables in Railway dashboard
  - Add `npx prisma migrate deploy && node dist/server.js` as start command
  - Run seed on first deploy

- [ ] Deploy frontend to Vercel
  - Set NEXT_PUBLIC_API_URL to Railway backend URL
  - Verify CORS is configured correctly

- [ ] Update README with deployment URLs
- [ ] Test full flow on deployed version

---

## Bonus Tasks

### BONUS-01: UI Polish (10 pts)

- [ ] Custom illustrations/icons (SVG)
- [ ] Smooth page transitions
- [ ] Micro-animations on button clicks, card hover
- [ ] Consistent spacing and typography throughout
- [ ] Loading skeletons on all async data
- [ ] Mobile optimization polish
- [ ] Dark mode support (optional)

### BONUS-02: Deployment (15 pts)

- [ ] Frontend accessible at public Vercel URL
- [ ] Backend accessible at public Railway URL
- [ ] Database on Supabase/Neon
- [ ] All seed data loaded on production DB
- [ ] Demo accounts working on production

---

## Implementation Order (Recommended)

```
Week 1:
  Day 1-2: SETUP-01..04, TASK-1.1..1.6 (Backend foundation + Auth)
  Day 3-4: TASK-1.7..1.14 (Frontend foundation + Auth pages)
  Day 5-7: TASK-2.1..2.4 (Level 2: Seller)

Week 2:
  Day 1-2: TASK-3.1..3.5 (Level 3 Backend: Wallet, Cart, Checkout)
  Day 3-4: TASK-3.6..3.10 (Level 3 Frontend)
  Day 5-7: TASK-4.1..4.9 (Level 4: Discounts + Reports)

Week 3:
  Day 1-2: TASK-5.1..5.5 (Level 5: Driver)
  Day 3-4: TASK-6.1..6.7 (Level 6: Admin + Overdue)
  Day 5-7: TASK-7.1..7.12 (Level 7: Security + Finalization)

Final:
  BONUS-01, BONUS-02 (if time permits)
```
