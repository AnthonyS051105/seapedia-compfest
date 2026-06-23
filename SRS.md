# SEAPEDIA — Software Requirements Specification (SRS)

**Version:** 1.0.0  
**Standard:** Based on IEEE 830 SRS Structure  
**Project:** COMPFEST 18 — Software Engineering Academy  
**Stack:** Next.js 14 + Express.js + PostgreSQL + Prisma  

---

## 1. Introduction

### 1.1 Purpose

This SRS defines the complete functional and non-functional requirements for the SEAPEDIA e-commerce marketplace system. It serves as the authoritative technical specification for implementation by Claude Code and any developers involved in the project.

### 1.2 Scope

SEAPEDIA is a fullstack web application consisting of:
- **Frontend:** Next.js 14 (App Router) with TypeScript and Tailwind CSS, deployed to Vercel
- **Backend:** Express.js REST API with TypeScript and Prisma ORM, deployed to Railway
- **Database:** PostgreSQL hosted on Supabase or Neon
- **Auth:** JWT (access token in memory/header + refresh token in httpOnly cookie)
- **API Docs:** Swagger/OpenAPI via swagger-jsdoc and swagger-ui-express

### 1.3 Definitions

| Term | Definition |
|------|------------|
| Active Role | The role a user has selected for the current session, stored in JWT payload |
| Cart | A persistent list of products selected by a Buyer, limited to one store |
| Checkout | The process of converting a cart to an order with payment deduction |
| SLA | Service Level Agreement — delivery time limit before an order is considered overdue |
| Voucher | A discount code with limited usage count and expiry date |
| Promo | A discount code with expiry date but no usage limit |
| Overdue | An order that has not progressed to the next status within its delivery SLA |
| PPN | Pajak Pertambahan Nilai (Value Added Tax) — 12% in Indonesia |

### 1.4 References

- COMPFEST 18 Technical Challenge PDF (SEAPEDIA spec document)
- Next.js 14 App Router documentation
- Prisma ORM documentation
- JWT RFC 7519

---

## 2. Overall Description

### 2.1 System Context

```
┌─────────────────────────────────────────────────────────────┐
│                        SEAPEDIA SYSTEM                       │
│                                                              │
│  ┌──────────────┐    REST API    ┌──────────────────────┐   │
│  │  Next.js 14  │◄─────────────►│  Express.js Backend  │   │
│  │  (Vercel)    │    + Cookie    │  (Railway)           │   │
│  └──────────────┘               └──────────┬───────────┘   │
│                                            │ Prisma ORM     │
│                                            ▼                 │
│                                  ┌──────────────────┐       │
│                                  │   PostgreSQL DB   │       │
│                                  │  (Supabase/Neon) │       │
│                                  └──────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 User Classes

| User Class | Frequency | Technical Level | Notes |
|------------|-----------|-----------------|-------|
| Guest | High | Low | No auth required |
| Buyer | High | Low | Needs active Buyer role |
| Seller | Medium | Medium | Needs active Seller role |
| Driver | Medium | Low | Needs active Driver role |
| Admin | Low | High | Separate admin role, no multi-role |

### 2.3 Operating Environment

- **Browser Support:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile:** Responsive at 375px, 768px, 1280px breakpoints
- **Node.js:** v18+ (LTS)
- **PostgreSQL:** v14+

### 2.4 Design Constraints

1. Backend MUST be API-first (REST), not server-rendered
2. Single-store checkout rule MUST be enforced in backend, not only frontend
3. Active role MUST be verified server-side for every protected endpoint
4. All DB write operations for checkout/refund MUST use Prisma transactions
5. No real payment gateway — dummy top-up flow is acceptable
6. Git commit history must show incremental progress (no squash)

---

## 3. Functional Requirements

### 3.1 Authentication Module

#### 3.1.1 User Registration

**FR-AUTH-001:** The system shall accept registration with the following fields:
- `username` (string, 3–30 chars, alphanumeric + underscore, unique)
- `email` (string, valid email format, unique)
- `password` (string, min 8 chars, requires letter + number)
- `full_name` (string, optional)
- `phone` (string, optional, valid Indonesian phone format)

**FR-AUTH-002:** The system shall hash passwords using bcrypt with minimum 12 salt rounds before storage.

**FR-AUTH-003:** The system shall return 409 Conflict if username or email already exists.

**FR-AUTH-004:** Upon successful registration, the system shall automatically assign the user zero roles. Roles must be added explicitly.

**FR-AUTH-005:** The system shall provide role registration endpoints:
- `POST /auth/register/buyer` — adds Buyer role to existing account
- `POST /auth/register/seller` — adds Seller role to existing account
- `POST /auth/register/driver` — adds Driver role to existing account

#### 3.1.2 User Login

**FR-AUTH-006:** The system shall authenticate users with `email` + `password` or `username` + `password`.

**FR-AUTH-007:** Upon successful login, the system shall:
1. Return an **access token** (JWT, 15-minute expiry) in the response body
2. Set a **refresh token** (JWT, 7-day expiry) as `httpOnly`, `Secure`, `SameSite=Strict` cookie

**FR-AUTH-008:** The access token payload shall include:
```json
{
  "sub": "user_uuid",
  "username": "string",
  "roles": ["BUYER", "SELLER"],
  "active_role": null,
  "iat": 1234567890,
  "exp": 1234568790
}
```

**FR-AUTH-009:** If user has exactly one non-admin role, `active_role` shall be set automatically.

**FR-AUTH-010:** If user has multiple non-admin roles or no roles, `active_role` shall be `null` and frontend must redirect to role selection.

**FR-AUTH-011:** If user has Admin role, `active_role` shall be `ADMIN` automatically (Admin cannot multi-role).

#### 3.1.3 Role Selection

**FR-AUTH-012:** The system shall provide `POST /auth/select-role` endpoint.
- Request body: `{ "role": "BUYER" | "SELLER" | "DRIVER" }`
- Validates that the user owns the requested role
- Issues new access token with `active_role` set
- Returns new access token

**FR-AUTH-013:** Role selection shall fail with 403 if user does not own the requested role.

#### 3.1.4 Token Refresh

**FR-AUTH-014:** The system shall provide `POST /auth/refresh` endpoint.
- Reads refresh token from httpOnly cookie
- Validates refresh token signature and expiry
- Checks refresh token is not in blacklist/revoked table
- Issues new access token (15 min)
- Optionally rotates refresh token

#### 3.1.5 Logout

**FR-AUTH-015:** The system shall provide `POST /auth/logout` endpoint.
- Adds refresh token to revoked_tokens table (or sets `is_revoked = true`)
- Clears httpOnly refresh token cookie
- Returns 200 OK

**FR-AUTH-016:** After logout, any attempt to use the revoked refresh token shall return 401 Unauthorized.

#### 3.1.6 User Profile

**FR-AUTH-017:** The system shall provide `GET /auth/me` endpoint (requires valid access token).
- Returns: user id, username, email, full_name, phone, roles[], active_role
- Returns financial placeholders: wallet_balance (null if no Buyer role), seller_income (null if no Seller role), driver_earnings (null if no Driver role)

---

### 3.2 Public Catalog Module

#### 3.2.1 Product Listing

**FR-CAT-001:** The system shall provide `GET /products` public endpoint with:
- Query params: `page` (default 1), `limit` (default 10), `search` (name/description), `store_id`, `min_price`, `max_price`, `sort` (price_asc, price_desc, newest)
- Returns: paginated list of products with store info embedded

**FR-CAT-002:** Each product in listing shall include:
- `id`, `name`, `description`, `price`, `stock`, `images[]`
- `store.id`, `store.name`, `store.seller_id`
- `created_at`, `updated_at`

**FR-CAT-003:** Products with `stock = 0` shall still be listed but marked as out-of-stock.

#### 3.2.2 Product Detail

**FR-CAT-004:** The system shall provide `GET /products/:id` public endpoint.
- Returns full product detail + store information block
- Returns 404 if product not found or soft-deleted

#### 3.2.3 Store Public View

**FR-CAT-005:** The system shall provide `GET /stores/:id` public endpoint.
- Returns store profile + all products from that store (paginated)

**FR-CAT-006:** The system shall provide `GET /stores` public endpoint.
- Returns paginated list of all active stores

---

### 3.3 Application Reviews Module

**FR-REV-001:** The system shall provide `POST /reviews` endpoint (no auth required).
- Request: `{ "reviewer_name": string, "rating": 1-5, "comment": string }`
- `reviewer_name` must be 1–100 chars
- `rating` must be integer 1–5
- `comment` must be 1–1000 chars

**FR-REV-002:** The system shall sanitize `reviewer_name` and `comment` fields:
- Strip all HTML tags
- Escape special characters: `<`, `>`, `&`, `"`, `'`
- Store sanitized version in DB

**FR-REV-003:** The system shall provide `GET /reviews` public endpoint.
- Returns paginated list of reviews, sorted by created_at DESC
- Query params: `page`, `limit` (default 10)

**FR-REV-004:** Reviews shall NOT require login, purchase history, or any transaction.

---

### 3.4 Seller Module

#### 3.4.1 Store Management

**FR-SELL-001:** The system shall provide `POST /seller/store` (requires active_role = SELLER).
- Creates a store for the authenticated seller
- A seller can only have ONE store
- Returns 409 if seller already has a store

**FR-SELL-002:** Store creation fields:
- `name` (string, 3–100 chars, unique across all stores)
- `description` (string, optional, max 1000 chars)
- `address` (string, optional)
- `logo_url` (string, optional URL)

**FR-SELL-003:** The system shall return 409 if store name already exists (case-insensitive).

**FR-SELL-004:** The system shall provide `PUT /seller/store` to update own store profile.

**FR-SELL-005:** The system shall provide `GET /seller/store` to get own store details.

#### 3.4.2 Product Management

**FR-SELL-006:** The system shall provide `POST /seller/products`.
- Requires: name, description, price (positive number), stock (non-negative integer)
- Optional: images[] (array of URLs), category
- Product is automatically linked to seller's store
- Returns 400 if seller has no store yet

**FR-SELL-007:** The system shall provide `PUT /seller/products/:id`.
- Validates product belongs to authenticated seller's store
- Returns 403 if product belongs to another store

**FR-SELL-008:** The system shall provide `DELETE /seller/products/:id`.
- Soft delete (set `deleted_at` timestamp)
- Validates ownership
- Returns 403 if not owner

**FR-SELL-009:** The system shall provide `GET /seller/products` (paginated, own products only).

**FR-SELL-010:** The system shall provide `GET /seller/products/:id` (own product detail).

#### 3.4.3 Order Processing

**FR-SELL-011:** The system shall provide `GET /seller/orders` — incoming orders list.
- Filters: status, page, limit
- Only orders for this seller's store

**FR-SELL-012:** The system shall provide `GET /seller/orders/:id` — order detail with items and status history.

**FR-SELL-013:** The system shall provide `POST /seller/orders/:id/process`.
- Transitions order: `Sedang Dikemas` → `Menunggu Pengirim`
- Creates delivery job record automatically
- Stores status change in order_status_history
- Returns 400 if order not in Sedang Dikemas status
- Returns 403 if order not from this seller

#### 3.4.4 Seller Income Report

**FR-SELL-014:** The system shall provide `GET /seller/reports/income`.
- Query params: `from_date`, `to_date`
- Returns: total_income, total_orders, breakdown by status
- Includes only orders with status = Pesanan Selesai
- Excludes refunded/returned orders

---

### 3.5 Buyer Module

#### 3.5.1 Wallet Management

**FR-BUY-001:** The system shall provide `POST /buyer/wallet/topup`.
- Request: `{ "amount": number }` (must be positive, max Rp 10,000,000 per topup)
- Creates wallet transaction record (type: TOP_UP)
- Updates buyer wallet balance

**FR-BUY-002:** The system shall provide `GET /buyer/wallet` — returns current balance + transaction history.

**FR-BUY-003:** Wallet transaction types:
- `TOP_UP` — balance increased by dummy top-up
- `PAYMENT` — balance deducted on checkout
- `REFUND` — balance restored on overdue refund

#### 3.5.2 Address Management

**FR-BUY-004:** The system shall provide full CRUD for delivery addresses:
- `POST /buyer/addresses` — create address
- `GET /buyer/addresses` — list all addresses
- `PUT /buyer/addresses/:id` — update address
- `DELETE /buyer/addresses/:id` — delete address
- `PUT /buyer/addresses/:id/set-default` — set as default

**FR-BUY-005:** Address fields: label (e.g. "Home"), recipient_name, phone, street, city, province, postal_code, is_default.

#### 3.5.3 Cart Management

**FR-BUY-006:** The system shall provide `POST /buyer/cart` — add item to cart.
- Request: `{ "product_id": uuid, "quantity": number }`
- **Single-store rule:** If cart already has items from a different store, return 409 with message explaining the conflict
- If cart is empty or from same store, add/update item
- Validates product exists and has sufficient stock

**FR-BUY-007:** The system shall provide `PUT /buyer/cart/:itemId` — update quantity.
- quantity must be ≥ 1
- quantity must not exceed product stock

**FR-BUY-008:** The system shall provide `DELETE /buyer/cart/:itemId` — remove item.

**FR-BUY-009:** The system shall provide `DELETE /buyer/cart` — clear entire cart.

**FR-BUY-010:** The system shall provide `GET /buyer/cart` — cart summary.
- Returns: cart_items[], store_info, subtotal (raw, before discount/fee/tax)

#### 3.5.4 Checkout

**FR-BUY-011:** The system shall provide `POST /buyer/checkout` — create order.

Request body:
```json
{
  "address_id": "uuid",
  "delivery_method": "INSTANT" | "NEXT_DAY" | "REGULAR",
  "discount_code": "string (optional)"
}
```

**FR-BUY-012:** Checkout validation chain:
1. Cart must not be empty
2. All items must be in stock (sufficient quantity)
3. Buyer must have a valid delivery address
4. Wallet balance must be ≥ final_total
5. Discount code (if provided) must be valid (not expired, usage remaining)

**FR-BUY-013:** Checkout price calculation (in this exact order):
```
subtotal        = sum(item.price × item.quantity)
discount_amount = voucher_or_promo_discount(subtotal)
discounted_sub  = subtotal - discount_amount
delivery_fee    = delivery_method_fee()
tax_base        = discounted_sub + delivery_fee
ppn_12          = round(tax_base × 0.12)
final_total     = tax_base + ppn_12
```

**FR-BUY-014:** On successful checkout (within a single DB transaction):
1. Deduct `final_total` from buyer wallet (record PAYMENT transaction)
2. Reduce stock for each product in cart
3. Create order record with status = `Sedang Dikemas`
4. Create order_items records
5. Create order_status_history entry (status=Sedang Dikemas, timestamp=now)
6. Increment voucher usage count (if voucher used)
7. Clear buyer cart

**FR-BUY-015:** If any step in the transaction fails, entire checkout is rolled back.

**FR-BUY-016:** The system shall provide `GET /buyer/orders` — order history (paginated, status filter).

**FR-BUY-017:** The system shall provide `GET /buyer/orders/:id` — order detail with items + full status history.

**FR-BUY-018:** The system shall provide `GET /buyer/orders/checkout-preview` — calculate totals without creating order.
- Accepts same body as checkout
- Returns calculated price breakdown for UI display

---

### 3.6 Driver Module

**FR-DRV-001:** The system shall provide `GET /driver/jobs` — list available delivery jobs.
- Only shows jobs linked to orders with status = `Menunggu Pengirim`
- Only shows jobs not yet taken (driver_id IS NULL)
- Includes order summary, delivery address, delivery method

**FR-DRV-002:** The system shall provide `GET /driver/jobs/:id` — job detail.
- Returns job + linked order details + delivery address

**FR-DRV-003:** The system shall provide `POST /driver/jobs/:id/take` — take a delivery job.
- Uses DB-level transaction with SELECT FOR UPDATE to prevent race conditions
- Sets driver_id on delivery_job
- Transitions order status: `Menunggu Pengirim` → `Sedang Dikirim`
- Creates status history entry
- Returns 409 if job already taken

**FR-DRV-004:** The system shall provide `POST /driver/jobs/:id/complete` — confirm delivery.
- Only the driver who took the job can complete it
- Transitions order status: `Sedang Dikirim` → `Pesanan Selesai`
- Creates status history entry
- Calculates and records driver earning
- Returns 403 if called by different driver

**FR-DRV-005:** The system shall provide `GET /driver/jobs/active` — current active job.

**FR-DRV-006:** The system shall provide `GET /driver/jobs/history` — completed jobs.

**FR-DRV-007:** The system shall provide `GET /driver/earnings` — earnings summary.
- Total earnings, per-job breakdown, date range filter

---

### 3.7 Discount Module

#### 3.7.1 Voucher

**FR-DISC-001:** Voucher model fields:
- `code` (string, unique, uppercase)
- `discount_type` (PERCENTAGE | FIXED_AMOUNT)
- `discount_value` (number — % or Rp amount)
- `max_discount_amount` (optional cap for percentage discounts)
- `min_order_amount` (optional minimum order for eligibility)
- `expiry_date` (datetime)
- `max_usage` (integer)
- `current_usage` (integer, default 0)
- `is_active` (boolean)

**FR-DISC-002:** The system shall provide `POST /admin/vouchers` (Admin only).

**FR-DISC-003:** The system shall provide `GET /admin/vouchers` — list all vouchers.

**FR-DISC-004:** The system shall provide `GET /admin/vouchers/:id` — voucher detail.

**FR-DISC-005:** The system shall provide `GET /vouchers/validate?code=XXX` (Buyer access).
- Returns voucher info + validity status

#### 3.7.2 Promo

**FR-DISC-006:** Promo model fields:
- `code` (string, unique, uppercase)
- `name` (string — promo campaign name)
- `description` (string, optional)
- `discount_type` (PERCENTAGE | FIXED_AMOUNT)
- `discount_value` (number)
- `max_discount_amount` (optional)
- `min_order_amount` (optional)
- `expiry_date` (datetime)
- `is_active` (boolean)

**FR-DISC-007:** The system shall provide `POST /admin/promos`, `GET /admin/promos`, `GET /admin/promos/:id`.

**FR-DISC-008:** Discount validation rules:
- Expired (expiry_date < now) → reject with "Voucher/Promo has expired"
- Voucher usage exhausted (current_usage >= max_usage) → reject with "Voucher usage limit reached"
- Inactive → reject with "Discount code is not active"
- Not found → reject with "Invalid discount code"

**FR-DISC-009:** Only ONE discount code (voucher OR promo) can be applied per order. Combining is not allowed.

---

### 3.8 Admin Module

**FR-ADM-001:** The system shall provide `GET /admin/dashboard/stats` — marketplace overview.
- Returns: user counts (by role), store count, product count, order counts (by status), voucher count, promo count, active delivery jobs, overdue order count

**FR-ADM-002:** The system shall provide `GET /admin/users` — paginated user list with roles.

**FR-ADM-003:** The system shall provide `GET /admin/stores` — paginated store list.

**FR-ADM-004:** The system shall provide `GET /admin/orders` — all orders with filters.

**FR-ADM-005:** The system shall provide `GET /admin/delivery-jobs` — all delivery jobs.

**FR-ADM-006:** The system shall provide `GET /admin/overdue-orders` — orders flagged as overdue.

**FR-ADM-007:** The system shall provide `POST /admin/simulate-next-day` — advance system date by 1 day.
- Increments a `system_date_offset` counter in a `system_config` table
- Triggers overdue check for all active orders

**FR-ADM-008:** The system shall provide `POST /admin/process-overdue` — manually trigger overdue processing.

---

### 3.9 Overdue Module

**FR-OVR-001:** The system shall define SLA per delivery method (counted in "system days"):
- INSTANT: 1 day after `Sedang Dikirim` start
- NEXT_DAY: 2 days after `Sedang Dikemas` start
- REGULAR: 3 days after `Sedang Dikemas` start

**FR-OVR-002:** The system shall check overdue status when "simulate next day" is triggered.

**FR-OVR-003:** For each overdue order, within a single DB transaction:
1. Set order `is_overdue_processed = true` (prevents double-processing)
2. Transition order status → `Dikembalikan`
3. Create status history entry
4. Refund `final_total` to Buyer wallet (create REFUND wallet transaction)
5. Create seller income reversal (if income was recorded)
6. Restore product stock for each order item

**FR-OVR-004:** The system shall NOT process overdue for orders already in status: `Pesanan Selesai`, `Dikembalikan`, or already `is_overdue_processed = true`.

**FR-OVR-005:** The system shall provide `GET /buyer/orders/:id` showing overdue status in status history.

---

## 4. Non-Functional Requirements

### 4.1 Security Requirements

**NFR-SEC-001:** All passwords stored with bcrypt (minimum 12 salt rounds).

**NFR-SEC-002:** JWT access tokens expire in 15 minutes. Refresh tokens expire in 7 days.

**NFR-SEC-003:** Refresh tokens stored in `refresh_tokens` table with `is_revoked` flag. Revoked on logout.

**NFR-SEC-004:** All authenticated endpoints verify JWT signature and expiry before processing.

**NFR-SEC-005:** Active role extracted from JWT payload and verified server-side. Frontend role state is informational only.

**NFR-SEC-006:** All DB queries use Prisma ORM parameterized queries. Raw SQL forbidden unless using `$queryRaw` with parameter binding.

**NFR-SEC-007:** User-generated content (review comments, store names, product descriptions) sanitized using `DOMPurify` (frontend) and `sanitize-html` (backend) before storage and rendering.

**NFR-SEC-008:** Resource ownership validated on every mutating endpoint (seller owns product, buyer owns order, driver owns job).

**NFR-SEC-009:** CORS configured to whitelist only frontend domain. Credentials: true.

**NFR-SEC-010:** Rate limiting on auth endpoints: max 10 requests/minute per IP.

**NFR-SEC-011:** Helmet.js configured on Express for security headers (X-Frame-Options, X-Content-Type-Options, etc.).

### 4.2 Performance Requirements

**NFR-PERF-001:** Product listing API must respond within 500ms (with DB indexes on store_id, price, created_at).

**NFR-PERF-002:** Checkout endpoint must complete within 2 seconds.

**NFR-PERF-003:** All list endpoints support pagination. Default limit: 10. Max limit: 100.

**NFR-PERF-004:** DB indexes required on: `users.email`, `users.username`, `stores.name`, `products.store_id`, `orders.buyer_id`, `orders.status`, `order_items.order_id`.

### 4.3 Reliability Requirements

**NFR-REL-001:** Checkout, refund, and overdue processing use Prisma `$transaction()` for atomicity.

**NFR-REL-002:** Driver job claiming uses `SELECT ... FOR UPDATE` (pessimistic lock) to prevent race conditions.

**NFR-REL-003:** Stock decrement uses conditional update: `WHERE stock >= quantity` to prevent negative stock.

### 4.4 Maintainability Requirements

**NFR-MAINT-001:** Backend uses layered architecture: `routes → middleware → controllers → services → repositories → prisma`.

**NFR-MAINT-002:** All endpoints documented with JSDoc-compatible Swagger annotations.

**NFR-MAINT-003:** Environment variables used for all secrets (DATABASE_URL, JWT_SECRET, etc.). Never hardcoded.

**NFR-MAINT-004:** TypeScript strict mode enabled on both frontend and backend.

---

## 5. Interface Requirements

### 5.1 API Response Format

All API responses follow this standard envelope:

```typescript
// Success
{
  "success": true,
  "message": "string (optional)",
  "data": any,
  "meta": {           // for paginated responses
    "page": number,
    "limit": number,
    "total": number,
    "totalPages": number
  }
}

// Error
{
  "success": false,
  "message": "Human-readable error message",
  "errors": [         // for validation errors
    { "field": "email", "message": "Invalid email format" }
  ]
}
```

### 5.2 HTTP Status Codes

| Status | Usage |
|--------|-------|
| 200 | Success (GET, PUT) |
| 201 | Created (POST) |
| 204 | No Content (DELETE) |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (wrong role, not owner) |
| 404 | Not Found |
| 409 | Conflict (duplicate, business rule violation) |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

### 5.3 Frontend Page Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Landing page |
| `/products` | Public | Product catalog |
| `/products/:id` | Public | Product detail |
| `/stores/:id` | Public | Store page |
| `/auth/login` | Public | Login page |
| `/auth/register` | Public | Register page |
| `/auth/select-role` | Auth | Role selection |
| `/buyer/dashboard` | Buyer | Buyer home |
| `/buyer/wallet` | Buyer | Wallet management |
| `/buyer/cart` | Buyer | Cart page |
| `/buyer/checkout` | Buyer | Checkout page |
| `/buyer/orders` | Buyer | Order history |
| `/buyer/orders/:id` | Buyer | Order detail |
| `/seller/dashboard` | Seller | Seller home |
| `/seller/store` | Seller | Store management |
| `/seller/products` | Seller | Product management |
| `/seller/products/new` | Seller | Create product |
| `/seller/products/:id/edit` | Seller | Edit product |
| `/seller/orders` | Seller | Incoming orders |
| `/seller/orders/:id` | Seller | Order detail |
| `/seller/reports` | Seller | Income reports |
| `/driver/dashboard` | Driver | Driver home |
| `/driver/jobs` | Driver | Available jobs |
| `/driver/jobs/:id` | Driver | Job detail |
| `/driver/earnings` | Driver | Earnings summary |
| `/admin/dashboard` | Admin | Admin overview |
| `/admin/users` | Admin | User management |
| `/admin/orders` | Admin | Order monitoring |
| `/admin/vouchers` | Admin | Voucher management |
| `/admin/promos` | Admin | Promo management |
| `/admin/overdue` | Admin | Overdue orders |

### 5.4 Cookie Specification

```
Name: seapedia_refresh_token
HttpOnly: true
Secure: true (production)
SameSite: Strict
Max-Age: 604800 (7 days in seconds)
Path: /api/auth
```

---

## 6. Data Requirements

### 6.1 Data Retention

- Soft delete for products (deleted_at timestamp)
- Orders never deleted — only status changes
- Wallet transactions never deleted
- Refresh tokens cleaned up 30 days after expiry (scheduled task)

### 6.2 Data Validation Rules

| Field | Validation |
|-------|-----------|
| username | 3–30 chars, `^[a-zA-Z0-9_]+$` |
| email | Valid email format (RFC 5322) |
| password | Min 8 chars, at least 1 letter + 1 number |
| phone | Indonesian format: `^(\+62|62|0)8[0-9]{8,11}$` |
| product price | Positive number, max 999,999,999 |
| product stock | Non-negative integer |
| cart quantity | Integer 1–999 |
| wallet top-up | Min Rp 10,000, max Rp 10,000,000 |
| review rating | Integer 1–5 |
| review comment | 1–1000 chars |
| store name | 3–100 chars |
| voucher code | 4–20 chars, uppercase alphanumeric |

---

## 7. System Constraints

1. No real payment gateway — top-up is dummy (instant balance credit)
2. No file upload — product images stored as URLs
3. No email service — no email verification or password reset
4. Time simulation via DB `system_date_offset` (not actual system time manipulation)
5. Driver earning formula is fixed (80% of delivery fee) — not configurable
6. Only one discount code per order — no stacking
7. Single-store cart rule is strict — no multi-store checkout
