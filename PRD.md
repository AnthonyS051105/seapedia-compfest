# SEAPEDIA — Product Requirements Document (PRD)

**Version:** 1.0.0  
**Date:** 2025  
**Challenge:** COMPFEST 18 — Software Engineering Academy Technical Challenge  
**Target:** Level 7 (Full Completion) — 100 pts Core + 25 pts Bonus  

---

## 1. Product Overview

### 1.1 Product Vision

SEAPEDIA is a multi-role e-commerce marketplace platform that connects **Buyers**, **Sellers**, **Delivery Drivers**, and **Admins** in one integrated ecosystem. It replicates real-world Indonesian marketplace behavior (similar to Tokopedia/Shopee) with complete transaction lifecycle, discount system, delivery workflow, and administrative oversight.

### 1.2 Product Goals

1. Provide a seamless public browsing experience for guests and registered users
2. Enable Sellers to create stores and manage product inventory
3. Enable Buyers to top up wallet, manage cart (single-store rule), and checkout with tax and discount calculations
4. Enable Drivers to find, accept, and complete delivery jobs
5. Enable Admins to monitor the entire marketplace and handle overdue orders
6. Enforce strong security practices (XSS, SQLi prevention, RBAC, JWT security)

### 1.3 Success Metrics

- All 7 levels completed with full business rule compliance
- End-to-end demo flow works across all 4 roles
- Swagger API docs accessible and complete
- Deployed and accessible on public URL
- Security test cases (XSS, SQLi) pass safely

---

## 2. Stakeholders & User Roles

### 2.1 Role Overview

SEAPEDIA has **4 distinct account roles**. One username (non-admin) may hold multiple roles simultaneously. The active role governs all authorization decisions.

| Role | Description | Key Capabilities |
|------|-------------|------------------|
| **Guest** | Unauthenticated visitor | Browse catalog, view product details, submit app reviews |
| **Buyer** | Registered buyer | Wallet top-up, cart management, checkout, order tracking |
| **Seller** | Registered seller | Store management, product CRUD, order processing |
| **Driver** | Registered delivery driver | Find jobs, take jobs, confirm delivery completion |
| **Admin** | Platform administrator | Monitor marketplace, manage discounts, handle overdue orders |

### 2.2 Multi-Role Rules

- One username can hold Buyer + Seller + Driver roles simultaneously
- Admin role is exclusive (cannot be combined with other roles)
- After login, if a user has multiple non-admin roles → show **Role Selection Modal/Page**
- The **active role** must be stored in JWT payload and enforced server-side
- Switching roles requires re-selecting role (new token issued with new active role)
- Authorization is based on **active role**, NOT the full list of roles owned

### 2.3 User Personas

**Andi (Buyer):** Wants to browse products, top up wallet, add to cart, checkout with discount voucher, and track delivery.

**Budi (Seller):** Wants to create a store, list products with stock management, and process incoming orders before handing to drivers.

**Cici (Driver):** Wants to browse available delivery jobs, take jobs, deliver packages, and track earnings.

**Admin (Super User):** Wants full visibility over the marketplace, ability to create vouchers/promos, monitor overdue orders, and simulate time for testing.

---

## 3. Feature Requirements by Level

### Level 1: Public Marketplace, Authentication & Reviews (20 pts)

#### 3.1.1 Public Marketplace Interface (4 pts)

| # | Requirement | Priority |
|---|-------------|----------|
| L1-01 | Landing/Home page with SEAPEDIA branding and marketplace identity | MUST |
| L1-02 | Product listing page accessible to guests (no login required) | MUST |
| L1-03 | Read-only product detail page for guests | MUST |
| L1-04 | Login page | MUST |
| L1-05 | Register page | MUST |
| L1-06 | Dummy product data fallback if backend not integrated | MUST |
| L1-07 | Guests MUST NOT see checkout, product management, or delivery actions | MUST |
| L1-08 | UI clearly communicates multi-seller marketplace nature | MUST |

#### 3.1.2 Authentication & Role Awareness (8 pts)

| # | Requirement | Priority |
|---|-------------|----------|
| L1-09 | User registration with username, email, password | MUST |
| L1-10 | User login returns JWT access token + refresh token | MUST |
| L1-11 | User logout clears tokens | MUST |
| L1-12 | Passwords stored with bcrypt hashing (min 10 rounds) | MUST |
| L1-13 | JWT access token (15 min expiry) + refresh token (7 days, httpOnly cookie) | MUST |
| L1-14 | Data model supports Admin, Seller, Buyer, Driver roles | MUST |
| L1-15 | One username can own multiple non-admin roles | MUST |
| L1-16 | API returns list of roles owned by logged-in user | MUST |
| L1-17 | Role selection page/modal shown if user has >1 non-admin role | MUST |
| L1-18 | Active role visible in UI (navbar badge/indicator) | MUST |
| L1-19 | Protected routes/endpoints guarded by active role (server-side) | MUST |
| L1-20 | `/auth/me` endpoint returns current user profile + active role | MUST |
| L1-21 | Profile/dashboard summary page shows all owned roles + active role | MUST |
| L1-22 | Placeholder for financial summaries (wallet, income, earnings) | MUST |

#### 3.1.3 Public Application Reviews (4 pts)

| # | Requirement | Priority |
|---|-------------|----------|
| L1-23 | Public review/testimonial section on landing page | MUST |
| L1-24 | Review form: reviewer name, rating (1–5 stars), comment text | MUST |
| L1-25 | Reviews displayable without login or purchase history | MUST |
| L1-26 | Submitted reviews shown in review list/carousel | MUST |
| L1-27 | Comments rendered as plain text (no HTML execution) | MUST |
| L1-28 | Reviews stored in backend database | MUST |

#### 3.1.4 Reusable UI Foundations (4 pts)

| # | Requirement | Priority |
|---|-------------|----------|
| L1-29 | Reusable components: Button, Input, Card, Navbar, Footer | MUST |
| L1-30 | Routing structure supporting public + private dashboard pages | MUST |
| L1-31 | Dashboard shell/placeholder for Admin, Seller, Buyer, Driver | MUST |
| L1-32 | Responsive navigation for desktop and mobile | MUST |
| L1-33 | Clear differentiation: guest nav vs logged-in nav | MUST |

---

### Level 2: Seller Experience (15 pts)

#### 3.2.1 Seller Store Management (5 pts)

| # | Requirement | Priority |
|---|-------------|----------|
| L2-01 | Store data model with name, description, seller reference | MUST |
| L2-02 | Seller can create store with unique store name | MUST |
| L2-03 | Seller can update their store profile | MUST |
| L2-04 | Validation error shown if store name already taken | MUST |
| L2-05 | Public store summary endpoint/display block | MUST |
| L2-06 | Store name uniqueness enforced at DB level (unique constraint) | MUST |

#### 3.2.2 Product Management for Sellers (6 pts)

| # | Requirement | Priority |
|---|-------------|----------|
| L2-07 | Product model: name, description, price, stock, images, store_id | MUST |
| L2-08 | Seller can create product (POST /seller/products) | MUST |
| L2-09 | Seller can update product (PUT /seller/products/:id) | MUST |
| L2-10 | Seller can delete product (DELETE /seller/products/:id) | MUST |
| L2-11 | Seller dashboard lists own products only | MUST |
| L2-12 | Seller cannot create/update/delete products from other stores | MUST |
| L2-13 | Product stock field stored (used in Level 3 checkout) | MUST |

#### 3.2.3 Public Catalog Integration (4 pts)

| # | Requirement | Priority |
|---|-------------|----------|
| L2-14 | Public endpoint: GET /products (list with filters, pagination) | MUST |
| L2-15 | Public endpoint: GET /products/:id (product detail) | MUST |
| L2-16 | Product listing shows store name + store info | MUST |
| L2-17 | Store detail page or store info block in product detail | MUST |
| L2-18 | Guests can view catalog without login | MUST |
| L2-19 | Catalog uses real backend data (not dummy) | MUST |

---

### Level 3: Buyer Wallet, Cart & Checkout (20 pts)

#### 3.3.1 Buyer Wallet & Address Management (5 pts)

| # | Requirement | Priority |
|---|-------------|----------|
| L3-01 | Buyer wallet resource (balance field in DB) | MUST |
| L3-02 | Dummy top-up flow (Buyer inputs amount → balance increases) | MUST |
| L3-03 | Wallet transaction history stored (type: TOP_UP, PAYMENT, REFUND) | MUST |
| L3-04 | Delivery address management (CRUD) | MUST |
| L3-05 | Buyer dashboard shows balance + top-up history | MUST |
| L3-06 | Only active Buyer role can access wallet/address features | MUST |

#### 3.3.2 Cart Management (5 pts)

| # | Requirement | Priority |
|---|-------------|----------|
| L3-07 | Add product to cart (POST /buyer/cart) | MUST |
| L3-08 | Update quantity in cart (PUT /buyer/cart/:itemId) | MUST |
| L3-09 | Remove item from cart (DELETE /buyer/cart/:itemId) | MUST |
| L3-10 | Cart summary endpoint + UI | MUST |
| L3-11 | **Single-store checkout rule**: cart rejects products from different store | MUST |
| L3-12 | UI clearly explains single-store rule with error/confirmation dialog | MUST |
| L3-13 | Single-store rule documented in README | MUST |

#### 3.3.3 Checkout & Basic Orders (10 pts)

| # | Requirement | Priority |
|---|-------------|----------|
| L3-14 | Checkout endpoint: POST /buyer/orders | MUST |
| L3-15 | Delivery methods: Instant, Next Day, Regular (different fees) | MUST |
| L3-16 | Price calculation: subtotal + delivery_fee + PPN 12% = final_total | MUST |
| L3-17 | Checkout summary shown in UI before confirmation | MUST |
| L3-18 | Order created following single-store rule | MUST |
| L3-19 | Product stock reduced atomically after checkout (no negative stock) | MUST |
| L3-20 | Buyer order history + order detail views | MUST |
| L3-21 | Seller incoming order list | MUST |
| L3-22 | Order status history stored with timestamps | MUST |
| L3-23 | Checkout fails if wallet balance insufficient | MUST |
| L3-24 | Initial order status: **Sedang Dikemas** | MUST |
| L3-25 | PPN 12% visible in checkout summary | MUST |

---

### Level 4: Discounts & Seller Order Processing (15 pts)

#### 3.4.1 Voucher & Promo Discounts (6 pts)

| # | Requirement | Priority |
|---|-------------|----------|
| L4-01 | Voucher resource: code, discount_type, discount_value, expiry_date, max_usage, current_usage | MUST |
| L4-02 | Promo resource: code, discount_type, discount_value, expiry_date | MUST |
| L4-03 | Admin endpoint to create vouchers | MUST |
| L4-04 | Admin endpoint to create promos | MUST |
| L4-05 | List/detail endpoints for vouchers and promos | MUST |
| L4-06 | Checkout accepts optional discount code | MUST |
| L4-07 | Discount code validated during checkout (expiry + usage) | MUST |
| L4-08 | Discount effect visible in checkout summary | MUST |
| L4-09 | Full breakdown visible: subtotal, discount, delivery_fee, PPN 12%, final_total | MUST |
| L4-10 | Expired vouchers/promos rejected with clear error | MUST |
| L4-11 | Vouchers with 0 remaining usage rejected | MUST |
| L4-12 | Voucher vs Promo distinction clear in response/summary | MUST |
| L4-13 | Discount position relative to PPN documented in README | MUST |

#### 3.4.2 Seller Order Processing (4 pts)

| # | Requirement | Priority |
|---|-------------|----------|
| L4-14 | Seller can process incoming order (POST /seller/orders/:id/process) | MUST |
| L4-15 | Order status: Sedang Dikemas → **Menunggu Pengirim** | MUST |
| L4-16 | Status change stored in order_status_history with timestamp | MUST |
| L4-17 | Order timeline/status tracker visible on Buyer + Seller pages | MUST |
| L4-18 | Only seller who owns the order can process it | MUST |
| L4-19 | Drivers cannot see order until status = Menunggu Pengirim | MUST |

#### 3.4.3 Buyer & Seller Reports (5 pts)

| # | Requirement | Priority |
|---|-------------|----------|
| L4-20 | Buyer spending report / expense summary | MUST |
| L4-21 | Seller income report / revenue summary | MUST |
| L4-22 | Buyer order history with status history + timestamps | MUST |
| L4-23 | Seller: incoming orders, processed orders, income summary | MUST |
| L4-24 | Transaction details show: discount, delivery_fee, PPN, final_total | MUST |

---

### Level 5: Delivery & Driver Workflow (10 pts)

#### 3.5.1 Delivery Jobs for Drivers (4 pts)

| # | Requirement | Priority |
|---|-------------|----------|
| L5-01 | Delivery job resource linked to order | MUST |
| L5-02 | Driver endpoint: GET /driver/jobs (available jobs only) | MUST |
| L5-03 | Driver endpoint: GET /driver/jobs/:id (job detail) | MUST |
| L5-04 | Only orders with status = Menunggu Pengirim visible to Drivers | MUST |
| L5-05 | Drivers cannot see Sedang Dikemas orders | MUST |

#### 3.5.2 Take Job & Delivery Completion (4 pts)

| # | Requirement | Priority |
|---|-------------|----------|
| L5-06 | Take job: POST /driver/jobs/:id/take → status: **Sedang Dikirim** | MUST |
| L5-07 | Confirm completed: POST /driver/jobs/:id/complete → status: **Pesanan Selesai** | MUST |
| L5-08 | Every status change stored with timestamp | MUST |
| L5-09 | Buyer + Seller can track delivery status in real-time | MUST |
| L5-10 | One order = one active Driver (race condition prevented) | MUST |
| L5-11 | Driver cannot take job already taken | MUST |

#### 3.5.3 Driver Earnings & Job History (2 pts)

| # | Requirement | Priority |
|---|-------------|----------|
| L5-12 | Driver dashboard: active job, job history, earnings | MUST |
| L5-13 | Driver earning rule documented (e.g. % of delivery fee) | MUST |
| L5-14 | Earning shown per completed job | MUST |

---

### Level 6: Admin Monitoring & Overdue Handling (10 pts)

#### 3.6.1 Admin Monitoring Dashboard (3 pts)

| # | Requirement | Priority |
|---|-------------|----------|
| L6-01 | Admin dashboard: user stats | MUST |
| L6-02 | Admin dashboard: store stats | MUST |
| L6-03 | Admin dashboard: product stats | MUST |
| L6-04 | Admin dashboard: order stats (by status) | MUST |
| L6-05 | Admin dashboard: voucher + promo stats | MUST |
| L6-06 | Admin dashboard: delivery job stats | MUST |
| L6-07 | Admin dashboard: overdue order list | MUST |
| L6-08 | Admin pages accessible by Admin role only | MUST |

#### 3.6.2 Voucher & Promo Management UI (2 pts)

| # | Requirement | Priority |
|---|-------------|----------|
| L6-09 | Admin UI to create vouchers | MUST |
| L6-10 | Admin UI to create promos | MUST |
| L6-11 | Admin UI to view voucher list + detail | MUST |
| L6-12 | Admin UI to view promo list + detail | MUST |
| L6-13 | Expiry date + usage info shown | MUST |

#### 3.6.3 Overdue Auto Return/Refund (5 pts)

| # | Requirement | Priority |
|---|-------------|----------|
| L6-14 | Delivery SLA rules defined per method (Instant/Next Day/Regular) | MUST |
| L6-15 | Auto refund/return triggered for overdue orders | MUST |
| L6-16 | Overdue orders → status: **Dikembalikan** | MUST |
| L6-17 | Financial + stock changes applied on overdue | MUST |
| L6-18 | Overdue status change stored with timestamp | MUST |
| L6-19 | Overdue result shown in UI | MUST |
| L6-20 | "Simulate Next Day" feature (Admin trigger or scheduler) | MUST |
| L6-21 | Refunded amount returned to Buyer wallet + recorded in history | MUST |
| L6-22 | Refunded orders excluded from Seller income | MUST |
| L6-23 | Stock restored for refunded/returned items | MUST |
| L6-24 | Double refund/reversal prevention | MUST |
| L6-25 | All overdue actions leave audit trail in status history | MUST |

---

### Level 7: Security Hardening & Finalization (10 pts)

#### 3.7.1 Secure Inputs, Queries & Comments (4 pts)

| # | Requirement | Priority |
|---|-------------|----------|
| L7-01 | SQL Injection prevention via Prisma ORM parameterized queries | MUST |
| L7-02 | XSS prevention: sanitize/escape user-generated content before render | MUST |
| L7-03 | Input validation on all fields (email, phone, rating, qty, price, stock) | MUST |
| L7-04 | Invalid/dangerous input rejected with clear error messages | MUST |
| L7-05 | Review comments rendered as plain text, cannot execute scripts | MUST |

#### 3.7.2 Session & RBAC Hardening (3 pts)

| # | Requirement | Priority |
|---|-------------|----------|
| L7-06 | Logout invalidates refresh token (server-side blacklist or DB flag) | MUST |
| L7-07 | Protected endpoints cannot be bypassed via manual URL change | MUST |
| L7-08 | Active role verified server-side for every protected action | MUST |
| L7-09 | Users cannot access/modify resources owned by other users | MUST |
| L7-10 | Token expiration documented and enforced | MUST |
| L7-11 | Admin endpoints inaccessible to non-admin users | MUST |

#### 3.7.3 Final Documentation & Demo Data (3 pts)

| # | Requirement | Priority |
|---|-------------|----------|
| L7-12 | Swagger/OpenAPI documentation for all endpoints | MUST |
| L7-13 | Seed data: demo accounts for Admin, Seller, Buyer, Driver | MUST |
| L7-14 | README: single-store checkout behavior documented | MUST |
| L7-15 | README: discount combination rule + PPN 12% calculation documented | MUST |
| L7-16 | README: Driver earning rule documented | MUST |
| L7-17 | README: overdue SLA + time simulation documented | MUST |
| L7-18 | README: security measures documented | MUST |
| L7-19 | Short end-to-end testing guide | MUST |

---

## 4. Business Rules (Cross-Cutting)

### 4.1 Order Lifecycle

```
[Checkout] → Sedang Dikemas → [Seller processes] → Menunggu Pengirim 
→ [Driver takes] → Sedang Dikirim → [Driver confirms] → Pesanan Selesai
                                                      ↘ [Overdue] → Dikembalikan
```

All status transitions must be recorded with timestamps in `order_status_history`.

### 4.2 Price Calculation Formula

```
subtotal         = Σ (product_price × quantity)
discount_amount  = apply_voucher_or_promo(subtotal)
discounted       = subtotal - discount_amount
delivery_fee     = fee_by_method(delivery_method)
tax_base         = discounted + delivery_fee
ppn_12           = tax_base × 0.12
final_total      = tax_base + ppn_12
```

> **Note:** Discount applied BEFORE PPN. PPN calculated on (discounted subtotal + delivery fee).

### 4.3 Cart Single-Store Rule

- Cart can only contain products from **one store** at a time
- Adding product from different store → system must either REJECT or prompt user to clear cart
- This rule enforced in backend API, not just frontend
- Documented in README

### 4.4 Delivery Fees

| Method | Fee | SLA (overdue threshold) |
|--------|-----|------------------------|
| Instant | Rp 15,000 | Same day (1 day) |
| Next Day | Rp 10,000 | Next day (2 days) |
| Regular | Rp 6,000 | 3 days |

### 4.5 Driver Earnings Rule

Driver earns **80% of the delivery fee** for each completed delivery.

| Method | Delivery Fee | Driver Earns |
|--------|-------------|--------------|
| Instant | Rp 15,000 | Rp 12,000 |
| Next Day | Rp 10,000 | Rp 8,000 |
| Regular | Rp 6,000 | Rp 4,800 |

### 4.6 Overdue Handling Rules

- Overdue is checked daily (via "Simulate Next Day" Admin trigger)
- Orders not progressed past `Sedang Dikemas` or `Menunggu Pengirim` within SLA → auto-return
- Orders stuck in `Sedang Dikirim` past SLA → auto-return/refund
- On refund: Buyer wallet credited, Seller income reversed, stock restored
- Double-processing prevention: `is_overdue_processed` flag on order
- Final status: `Dikembalikan`

### 4.7 Voucher vs Promo Distinction

| Attribute | Voucher | Promo |
|-----------|---------|-------|
| Has usage limit | YES (max_usage) | NO |
| Has expiry date | YES | YES |
| Code type | Unique code | Campaign code |
| Can combine | NO (only one discount per order) | NO |

---

## 5. Non-Functional Requirements

### 5.1 Performance
- Product listing API responds within 500ms
- Checkout endpoint completes within 1000ms
- Pagination on all list endpoints (default 10 items/page)

### 5.2 Security
- Passwords: bcrypt with min 10 salt rounds
- JWT access token: 15 min expiry
- Refresh token: 7 days expiry, httpOnly, Secure, SameSite=Strict cookie
- Refresh token stored in DB (for invalidation on logout)
- All user input validated and sanitized
- Prisma ORM prevents SQL injection by default
- CORS configured to allow only frontend origin

### 5.3 Reliability
- Database transactions used for checkout, refund, and stock operations
- Race condition prevention for Driver job claiming (DB-level locking)
- Atomic stock decrement (no negative stock allowed)

### 5.4 Usability
- Responsive for mobile (375px) and desktop (1280px+)
- Loading states for all async operations
- Error messages are user-friendly (not raw server errors)
- Empty states for all list pages

### 5.5 Maintainability
- TypeScript throughout (frontend + backend)
- Consistent API response format
- Environment variables for all secrets
- Separation of concerns: routes → controllers → services → repositories

---

## 6. Out of Scope

- Real payment gateway integration (dummy top-up is sufficient)
- Real-time chat between Buyer and Seller
- Product image upload (URLs acceptable)
- Email notifications
- Product ratings/reviews (only app-level reviews required)
- Multi-currency support

---

## 7. Delivery Requirements

- Public GitHub repository
- Detailed README (setup, env vars, admin setup instructions)
- Swagger/OpenAPI documentation
- Seed data for all roles
- Incremental Git commit history (no squashed commits)
- Optional: deployment URL on Vercel + Render
