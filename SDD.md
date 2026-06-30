# SEAPEDIA — System Design Document (SDD)

**Version:** 1.0.0  
**Project:** COMPFEST 18 — Software Engineering Academy  

---

## 1. System Architecture Overview

### 1.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER (Vercel)                          │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                     Next.js 14 App Router                        │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │  │
│  │  │  Public  │  │  Buyer   │  │  Seller  │  │ Driver/Admin │   │  │
│  │  │  Pages   │  │ Dashboard│  │ Dashboard│  │  Dashboard   │   │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │  │
│  │  ┌──────────────────────────────────────────────────────────┐   │  │
│  │  │  API Client Layer (axios + interceptors + token refresh) │   │  │
│  │  └──────────────────────────────────────────────────────────┘   │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└─────────────────────────┬────────────────────────────────────────────┘
                          │ HTTPS REST API
                          │ (Authorization: Bearer <access_token>)
                          │ (Cookie: seapedia_refresh_token)
┌─────────────────────────▼────────────────────────────────────────────┐
│                    API LAYER (Railway)                                 │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                   Express.js + TypeScript                        │  │
│  │  ┌────────────┐  ┌──────────────┐  ┌──────────────────────┐   │  │
│  │  │  Middleware │  │   Routers    │  │     Swagger UI        │   │  │
│  │  │ (auth,cors,│  │ (auth,buyer, │  │  (/api/docs)          │   │  │
│  │  │ helmet,rate│  │  seller,     │  │                        │   │  │
│  │  │  limit)    │  │  driver,     │  └──────────────────────┘   │  │
│  │  └────────────┘  │  admin,pub.) │                              │  │
│  │                  └──────────────┘                              │  │
│  │  ┌──────────────────────────────────────────────────────────┐   │  │
│  │  │              Service Layer (Business Logic)               │   │  │
│  │  └──────────────────────────────────────────────────────────┘   │  │
│  │  ┌──────────────────────────────────────────────────────────┐   │  │
│  │  │           Prisma ORM (Data Access Layer)                  │   │  │
│  │  └──────────────────────────────────────────────────────────┘   │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└─────────────────────────┬────────────────────────────────────────────┘
                          │ Prisma Client (connection pool)
┌─────────────────────────▼────────────────────────────────────────────┐
│                  DATA LAYER (Supabase/Neon)                            │
│                                                                        │
│              PostgreSQL 14+ (connection via DATABASE_URL)             │
└──────────────────────────────────────────────────────────────────────┘
```

### 1.2 Repository Structure

```
seapedia/
├── apps/
│   ├── frontend/                    # Next.js 14 App
│   │   ├── app/
│   │   │   ├── (public)/           # Public routes (no auth)
│   │   │   │   ├── page.tsx        # Landing page
│   │   │   │   ├── products/
│   │   │   │   └── stores/
│   │   │   ├── auth/               # Auth pages
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   └── select-role/
│   │   │   ├── buyer/              # Buyer dashboard (protected)
│   │   │   ├── seller/             # Seller dashboard (protected)
│   │   │   ├── driver/             # Driver dashboard (protected)
│   │   │   ├── admin/              # Admin dashboard (protected)
│   │   │   ├── layout.tsx
│   │   │   └── providers.tsx       # Context providers
│   │   ├── components/
│   │   │   ├── ui/                 # Reusable UI components
│   │   │   ├── layout/             # Navbar, Footer, Sidebar
│   │   │   ├── buyer/              # Buyer-specific components
│   │   │   ├── seller/
│   │   │   ├── driver/
│   │   │   └── admin/
│   │   ├── lib/
│   │   │   ├── api.ts              # Axios instance + interceptors
│   │   │   ├── auth.ts             # Auth helpers
│   │   │   └── utils.ts
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── store/                  # Zustand state management
│   │   ├── types/                  # TypeScript interfaces
│   │   └── middleware.ts           # Next.js route protection
│   │
│   └── backend/                     # Express.js API
│       ├── src/
│       │   ├── app.ts              # Express app setup
│       │   ├── server.ts           # Server entry point
│       │   ├── routes/
│       │   │   ├── auth.routes.ts
│       │   │   ├── public.routes.ts
│       │   │   ├── buyer.routes.ts
│       │   │   ├── seller.routes.ts
│       │   │   ├── driver.routes.ts
│       │   │   ├── admin.routes.ts
│       │   │   └── review.routes.ts
│       │   ├── controllers/
│       │   │   ├── auth.controller.ts
│       │   │   ├── product.controller.ts
│       │   │   ├── buyer.controller.ts
│       │   │   ├── seller.controller.ts
│       │   │   ├── driver.controller.ts
│       │   │   ├── admin.controller.ts
│       │   │   └── review.controller.ts
│       │   ├── services/
│       │   │   ├── auth.service.ts
│       │   │   ├── checkout.service.ts
│       │   │   ├── discount.service.ts
│       │   │   ├── overdue.service.ts
│       │   │   └── driver.service.ts
│       │   ├── middleware/
│       │   │   ├── authenticate.ts  # JWT verification
│       │   │   ├── requireRole.ts   # Active role check
│       │   │   ├── validate.ts      # Request validation (zod)
│       │   │   ├── rateLimiter.ts
│       │   │   └── errorHandler.ts
│       │   ├── utils/
│       │   │   ├── jwt.ts
│       │   │   ├── bcrypt.ts
│       │   │   ├── sanitize.ts
│       │   │   └── pricing.ts
│       │   ├── config/
│       │   │   ├── swagger.ts
│       │   │   └── cors.ts
│       │   └── prisma/
│       │       └── client.ts        # Prisma singleton
│       ├── prisma/
│       │   ├── schema.prisma
│       │   ├── migrations/
│       │   └── seed.ts
│       └── tsconfig.json
├── package.json                     # Root workspace config
└── README.md
```

---

## 2. Database Design

### 2.1 Complete Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// =====================
// ENUMS
// =====================

enum Role {
  ADMIN
  SELLER
  BUYER
  DRIVER
}

enum OrderStatus {
  SEDANG_DIKEMAS     // Initial status after checkout
  MENUNGGU_PENGIRIM  // After seller processes
  SEDANG_DIKIRIM     // After driver takes job
  PESANAN_SELESAI    // After driver confirms completion
  DIKEMBALIKAN       // Overdue / returned
}

enum DeliveryMethod {
  INSTANT
  NEXT_DAY
  REGULAR
}

enum WalletTransactionType {
  TOP_UP
  PAYMENT
  REFUND
}

enum DiscountType {
  PERCENTAGE
  FIXED_AMOUNT
}

// =====================
// USERS & AUTH
// =====================

model User {
  id         String   @id @default(uuid())
  username   String   @unique
  email      String   @unique
  password   String   // bcrypt hashed
  full_name  String?
  phone      String?
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  // Relations
  user_roles     UserRole[]
  refresh_tokens RefreshToken[]
  buyer_profile  BuyerProfile?
  seller_profile SellerProfile?
  driver_profile DriverProfile?
  reviews        AppReview[]

  @@index([email])
  @@index([username])
}

model UserRole {
  id         String   @id @default(uuid())
  user_id    String
  role       Role
  created_at DateTime @default(now())

  user User @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@unique([user_id, role])  // One role per user (no duplicates)
  @@index([user_id])
}

model RefreshToken {
  id         String   @id @default(uuid())
  user_id    String
  token      String   @unique
  is_revoked Boolean  @default(false)
  expires_at DateTime
  created_at DateTime @default(now())

  user User @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([user_id])
}

// =====================
// BUYER PROFILE
// =====================

model BuyerProfile {
  id         String   @id @default(uuid())
  user_id    String   @unique
  balance    Decimal  @default(0) @db.Decimal(15, 2)
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  user              User               @relation(fields: [user_id], references: [id], onDelete: Cascade)
  addresses         DeliveryAddress[]
  wallet_txns       WalletTransaction[]
  orders            Order[]
  cart_items        CartItem[]
}

model DeliveryAddress {
  id              String   @id @default(uuid())
  buyer_id        String
  label           String   // "Home", "Office", etc.
  recipient_name  String
  phone           String
  street          String
  city            String
  province        String
  postal_code     String
  is_default      Boolean  @default(false)
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  buyer_profile BuyerProfile @relation(fields: [buyer_id], references: [id], onDelete: Cascade)
  orders        Order[]

  @@index([buyer_id])
}

model WalletTransaction {
  id          String               @id @default(uuid())
  buyer_id    String
  type        WalletTransactionType
  amount      Decimal              @db.Decimal(15, 2)
  description String?
  order_id    String?              // Reference to order (for PAYMENT/REFUND)
  created_at  DateTime             @default(now())

  buyer_profile BuyerProfile @relation(fields: [buyer_id], references: [id], onDelete: Cascade)

  @@index([buyer_id])
}

model CartItem {
  id         String   @id @default(uuid())
  buyer_id   String
  product_id String
  quantity   Int
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  buyer_profile BuyerProfile @relation(fields: [buyer_id], references: [id], onDelete: Cascade)
  product       Product      @relation(fields: [product_id], references: [id])

  @@unique([buyer_id, product_id])
  @@index([buyer_id])
}

// =====================
// SELLER PROFILE & STORE
// =====================

model SellerProfile {
  id         String   @id @default(uuid())
  user_id    String   @unique
  total_income Decimal @default(0) @db.Decimal(15, 2)
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  user  User   @relation(fields: [user_id], references: [id], onDelete: Cascade)
  store Store?
}

model Store {
  id          String   @id @default(uuid())
  seller_id   String   @unique  // One store per seller
  name        String   @unique  // Globally unique store name
  description String?
  address     String?
  logo_url    String?
  is_active   Boolean  @default(true)
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  seller_profile SellerProfile @relation(fields: [seller_id], references: [id], onDelete: Cascade)
  products       Product[]

  @@index([name])
}

// =====================
// PRODUCTS
// =====================

model Product {
  id          String    @id @default(uuid())
  store_id    String
  name        String
  description String?
  price       Decimal   @db.Decimal(15, 2)
  stock       Int       @default(0)
  images      String[]  // Array of image URLs
  is_active   Boolean   @default(true)
  deleted_at  DateTime? // Soft delete
  created_at  DateTime  @default(now())
  updated_at  DateTime  @updatedAt

  store      Store       @relation(fields: [store_id], references: [id], onDelete: Cascade)
  cart_items CartItem[]
  order_items OrderItem[]

  @@index([store_id])
  @@index([price])
  @@index([created_at])
}

// =====================
// DRIVER PROFILE
// =====================

model DriverProfile {
  id             String   @id @default(uuid())
  user_id        String   @unique
  total_earnings Decimal  @default(0) @db.Decimal(15, 2)
  created_at     DateTime @default(now())
  updated_at     DateTime @updatedAt

  user          User          @relation(fields: [user_id], references: [id], onDelete: Cascade)
  delivery_jobs DeliveryJob[]
}

// =====================
// ORDERS
// =====================

model Order {
  id                   String         @id @default(uuid())
  buyer_id             String
  store_id             String         // Which store this order is from
  address_id           String
  delivery_method      DeliveryMethod
  status               OrderStatus    @default(SEDANG_DIKEMAS)
  
  // Price breakdown (stored at time of checkout)
  subtotal             Decimal        @db.Decimal(15, 2)
  discount_amount      Decimal        @default(0) @db.Decimal(15, 2)
  delivery_fee         Decimal        @db.Decimal(15, 2)
  ppn_amount           Decimal        @db.Decimal(15, 2)
  final_total          Decimal        @db.Decimal(15, 2)
  
  // Discount tracking
  discount_code        String?
  discount_type        String?        // "VOUCHER" or "PROMO"
  voucher_id           String?
  promo_id             String?
  
  // Overdue handling
  is_overdue_processed Boolean        @default(false)
  
  created_at           DateTime       @default(now())
  updated_at           DateTime       @updatedAt

  buyer_profile    BuyerProfile      @relation(fields: [buyer_id], references: [id])
  delivery_address DeliveryAddress   @relation(fields: [address_id], references: [id])
  order_items      OrderItem[]
  status_history   OrderStatusHistory[]
  delivery_job     DeliveryJob?

  @@index([buyer_id])
  @@index([store_id])
  @@index([status])
  @@index([created_at])
}

model OrderItem {
  id           String  @id @default(uuid())
  order_id     String
  product_id   String
  product_name String  // Snapshot at time of order
  product_price Decimal @db.Decimal(15, 2)  // Snapshot
  quantity     Int
  subtotal     Decimal @db.Decimal(15, 2)   // price × qty

  order   Order   @relation(fields: [order_id], references: [id], onDelete: Cascade)
  product Product @relation(fields: [product_id], references: [id])

  @@index([order_id])
}

model OrderStatusHistory {
  id         String      @id @default(uuid())
  order_id   String
  status     OrderStatus
  note       String?     // Optional note (e.g. "overdue - auto returned")
  created_at DateTime    @default(now())

  order Order @relation(fields: [order_id], references: [id], onDelete: Cascade)

  @@index([order_id])
}

// =====================
// DELIVERY JOBS
// =====================

model DeliveryJob {
  id          String    @id @default(uuid())
  order_id    String    @unique  // One job per order
  driver_id   String?            // null = not yet taken
  earning     Decimal?  @db.Decimal(15, 2)  // Calculated on completion
  taken_at    DateTime?
  completed_at DateTime?
  created_at  DateTime  @default(now())
  updated_at  DateTime  @updatedAt

  order          Order         @relation(fields: [order_id], references: [id], onDelete: Cascade)
  driver_profile DriverProfile? @relation(fields: [driver_id], references: [id])

  @@index([driver_id])
  @@index([order_id])
}

// =====================
// DISCOUNTS
// =====================

model Voucher {
  id                 String      @id @default(uuid())
  code               String      @unique
  discount_type      DiscountType
  discount_value     Decimal     @db.Decimal(10, 2)
  max_discount_amount Decimal?   @db.Decimal(15, 2)  // Cap for PERCENTAGE type
  min_order_amount   Decimal?    @db.Decimal(15, 2)
  expiry_date        DateTime
  max_usage          Int
  current_usage      Int         @default(0)
  is_active          Boolean     @default(true)
  created_at         DateTime    @default(now())
  updated_at         DateTime    @updatedAt

  @@index([code])
}

model Promo {
  id                 String      @id @default(uuid())
  code               String      @unique
  name               String
  description        String?
  discount_type      DiscountType
  discount_value     Decimal     @db.Decimal(10, 2)
  max_discount_amount Decimal?   @db.Decimal(15, 2)
  min_order_amount   Decimal?    @db.Decimal(15, 2)
  expiry_date        DateTime
  is_active          Boolean     @default(true)
  created_at         DateTime    @default(now())
  updated_at         DateTime    @updatedAt

  @@index([code])
}

// =====================
// APP REVIEWS
// =====================

model AppReview {
  id            String   @id @default(uuid())
  reviewer_name String   // Sanitized
  rating        Int      // 1–5
  comment       String   // Sanitized
  user_id       String?  // Optional — if submitted by logged-in user
  created_at    DateTime @default(now())

  user User? @relation(fields: [user_id], references: [id], onDelete: SetNull)

  @@index([created_at])
}

// =====================
// SYSTEM CONFIG
// =====================

model SystemConfig {
  id                 String   @id @default(uuid())
  key                String   @unique
  value              String
  updated_at         DateTime @updatedAt
}
// Used for: system_date_offset (simulating next day)
// Example: key="system_date_offset", value="3" (means system is 3 days ahead)
```

### 2.2 Entity Relationship Diagram (ERD)

```
User ─────────────── UserRole (M:N via UserRole)
  │
  ├── BuyerProfile ── CartItem ── Product
  │       │                         │
  │       ├── WalletTransaction     ├── Store ── SellerProfile ── User
  │       ├── DeliveryAddress       └── OrderItem
  │       └── Order ─────────────────────┤
  │               │                      │
  │               ├── OrderItem ──────── Product
  │               ├── OrderStatusHistory
  │               └── DeliveryJob ── DriverProfile ── User
  │
  ├── SellerProfile ── Store ── Product
  ├── DriverProfile ── DeliveryJob
  └── RefreshToken
```

---

## 3. Backend API Design

### 3.1 Middleware Chain

```typescript
// Every request passes through this chain:
app.use(cors(corsConfig))           // 1. CORS
app.use(helmet())                   // 2. Security headers
app.use(express.json())             // 3. Body parser
app.use(rateLimiter)               // 4. Rate limiting

// Route-specific middleware:
// authenticate → verifyRole(BUYER) → controller
```

### 3.2 Authentication Middleware

```typescript
// middleware/authenticate.ts
export const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ success: false, message: 'No token provided' })
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = payload  // { sub, username, roles, active_role }
    next()
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' })
  }
}

// middleware/requireRole.ts
export const requireRole = (role: Role) => (req, res, next) => {
  if (req.user.active_role !== role) {
    return res.status(403).json({ success: false, message: `Requires ${role} role` })
  }
  next()
}
```

### 3.3 Route Structure

```typescript
// Prefix: /api

// Public routes (no auth)
GET    /api/products                 → product catalog
GET    /api/products/:id             → product detail
GET    /api/stores                   → store listing
GET    /api/stores/:id               → store detail with products
GET    /api/reviews                  → app reviews
POST   /api/reviews                  → submit app review

// Auth routes
POST   /api/auth/register            → register user
POST   /api/auth/register/buyer      → add buyer role
POST   /api/auth/register/seller     → add seller role
POST   /api/auth/register/driver     → add driver role
POST   /api/auth/login               → login
POST   /api/auth/logout              → logout
POST   /api/auth/refresh             → refresh access token
POST   /api/auth/select-role         → choose active role
GET    /api/auth/me                  → current user profile

// Buyer routes (auth + active_role=BUYER)
GET    /api/buyer/wallet             → wallet balance + history
POST   /api/buyer/wallet/topup       → top up wallet
GET    /api/buyer/addresses          → list addresses
POST   /api/buyer/addresses          → create address
PUT    /api/buyer/addresses/:id      → update address
DELETE /api/buyer/addresses/:id      → delete address
PUT    /api/buyer/addresses/:id/default → set default
GET    /api/buyer/cart               → cart summary
POST   /api/buyer/cart               → add to cart
PUT    /api/buyer/cart/:itemId       → update quantity
DELETE /api/buyer/cart/:itemId       → remove item
DELETE /api/buyer/cart              → clear cart
POST   /api/buyer/checkout/preview   → preview price
POST   /api/buyer/checkout           → place order
GET    /api/buyer/orders             → order history
GET    /api/buyer/orders/:id         → order detail
GET    /api/buyer/reports            → spending report

// Seller routes (auth + active_role=SELLER)
GET    /api/seller/store             → my store
POST   /api/seller/store             → create store
PUT    /api/seller/store             → update store
GET    /api/seller/products          → my products
POST   /api/seller/products          → create product
GET    /api/seller/products/:id      → product detail
PUT    /api/seller/products/:id      → update product
DELETE /api/seller/products/:id      → delete product
GET    /api/seller/orders            → incoming orders
GET    /api/seller/orders/:id        → order detail
POST   /api/seller/orders/:id/process → process order
GET    /api/seller/reports/income    → income report

// Driver routes (auth + active_role=DRIVER)
GET    /api/driver/jobs              → available jobs
GET    /api/driver/jobs/active       → current active job
GET    /api/driver/jobs/history      → completed jobs
GET    /api/driver/jobs/:id          → job detail
POST   /api/driver/jobs/:id/take     → take job
POST   /api/driver/jobs/:id/complete → confirm completion
GET    /api/driver/earnings          → earnings summary

// Admin routes (auth + active_role=ADMIN)
GET    /api/admin/dashboard/stats    → marketplace overview
GET    /api/admin/users              → user list
GET    /api/admin/stores             → store list
GET    /api/admin/products           → product list
GET    /api/admin/orders             → all orders
GET    /api/admin/delivery-jobs      → all delivery jobs
GET    /api/admin/overdue-orders     → overdue orders
POST   /api/admin/simulate-next-day  → advance system day
POST   /api/admin/process-overdue    → trigger overdue processing
GET    /api/admin/vouchers           → voucher list
POST   /api/admin/vouchers           → create voucher
GET    /api/admin/vouchers/:id       → voucher detail
GET    /api/admin/promos             → promo list
POST   /api/admin/promos             → create promo
GET    /api/admin/promos/:id         → promo detail

// Swagger docs
GET    /api/docs                     → Swagger UI
GET    /api/docs.json                → OpenAPI spec
```

### 3.4 Checkout Service (Core Business Logic)

```typescript
// services/checkout.service.ts

export class CheckoutService {
  async previewCheckout(buyerId: string, dto: CheckoutDto) {
    // 1. Get cart items
    const cart = await this.getCartWithProducts(buyerId)
    if (cart.items.length === 0) throw new BadRequestError('Cart is empty')
    
    // 2. Validate discount code if provided
    let discountAmount = 0
    if (dto.discount_code) {
      discountAmount = await this.discountService.calculateDiscount(
        dto.discount_code, subtotal
      )
    }
    
    // 3. Calculate pricing
    const pricing = this.calculatePricing(cart, dto.delivery_method, discountAmount)
    
    return { ...pricing, cart_items: cart.items }
  }

  async checkout(buyerId: string, dto: CheckoutDto) {
    return await prisma.$transaction(async (tx) => {
      // 1. Lock buyer profile for update
      const buyer = await tx.buyerProfile.findUnique({
        where: { id: buyerId },
        select: { balance: true }
      })
      
      // 2. Get and validate cart
      const cartItems = await tx.cartItem.findMany({
        where: { buyer_id: buyerId },
        include: { product: { include: { store: true } } }
      })
      if (cartItems.length === 0) throw new BadRequestError('Cart is empty')
      
      // 3. Validate stock (all items)
      for (const item of cartItems) {
        if (item.product.stock < item.quantity) {
          throw new BadRequestError(`Insufficient stock for ${item.product.name}`)
        }
      }
      
      // 4. Calculate pricing
      const subtotal = cartItems.reduce((sum, item) => 
        sum + Number(item.product.price) * item.quantity, 0)
      
      let discountAmount = 0
      let voucherId = null, promoId = null, discountType = null
      if (dto.discount_code) {
        const discountResult = await this.discountService.applyDiscount(
          tx, dto.discount_code, subtotal
        )
        discountAmount = discountResult.amount
        voucherId = discountResult.voucher_id
        promoId = discountResult.promo_id
        discountType = discountResult.type
      }
      
      const deliveryFee = DELIVERY_FEES[dto.delivery_method]
      const taxBase = (subtotal - discountAmount) + deliveryFee
      const ppnAmount = Math.round(taxBase * 0.12)
      const finalTotal = taxBase + ppnAmount
      
      // 5. Check wallet balance
      if (Number(buyer.balance) < finalTotal) {
        throw new BadRequestError('Insufficient wallet balance')
      }
      
      // 6. Deduct wallet
      await tx.buyerProfile.update({
        where: { id: buyerId },
        data: { balance: { decrement: finalTotal } }
      })
      
      // 7. Create wallet transaction
      await tx.walletTransaction.create({
        data: {
          buyer_id: buyerId,
          type: 'PAYMENT',
          amount: finalTotal,
          description: 'Order payment'
        }
      })
      
      // 8. Reduce stock (atomic, no negative)
      for (const item of cartItems) {
        await tx.product.updateMany({
          where: { id: item.product_id, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } }
        })
      }
      
      // 9. Create order
      const order = await tx.order.create({
        data: {
          buyer_id: buyerId,
          store_id: cartItems[0].product.store_id,
          address_id: dto.address_id,
          delivery_method: dto.delivery_method,
          status: 'SEDANG_DIKEMAS',
          subtotal,
          discount_amount: discountAmount,
          delivery_fee: deliveryFee,
          ppn_amount: ppnAmount,
          final_total: finalTotal,
          discount_code: dto.discount_code,
          discount_type: discountType,
          voucher_id: voucherId,
          promo_id: promoId,
          order_items: {
            create: cartItems.map(item => ({
              product_id: item.product_id,
              product_name: item.product.name,
              product_price: item.product.price,
              quantity: item.quantity,
              subtotal: Number(item.product.price) * item.quantity
            }))
          }
        }
      })
      
      // 10. Create status history
      await tx.orderStatusHistory.create({
        data: { order_id: order.id, status: 'SEDANG_DIKEMAS' }
      })
      
      // 11. Increment voucher usage
      if (voucherId) {
        await tx.voucher.update({
          where: { id: voucherId },
          data: { current_usage: { increment: 1 } }
        })
      }
      
      // 12. Clear cart
      await tx.cartItem.deleteMany({ where: { buyer_id: buyerId } })
      
      return order
    })
  }
}
```

### 3.5 Overdue Service

```typescript
// services/overdue.service.ts

const DELIVERY_SLA_DAYS = {
  INSTANT: 1,
  NEXT_DAY: 2,
  REGULAR: 3,
}

export class OverdueService {
  async simulateNextDay() {
    // Increment system date offset
    await prisma.systemConfig.upsert({
      where: { key: 'system_date_offset' },
      update: { value: { increment: 1 } },  // Using raw update
      create: { key: 'system_date_offset', value: '1' }
    })
    
    await this.processOverdueOrders()
  }
  
  async getSystemDate() {
    const config = await prisma.systemConfig.findUnique({
      where: { key: 'system_date_offset' }
    })
    const offset = parseInt(config?.value ?? '0')
    const now = new Date()
    now.setDate(now.getDate() + offset)
    return now
  }
  
  async processOverdueOrders() {
    const systemDate = await this.getSystemDate()
    
    // Find overdue orders
    const overdueOrders = await prisma.order.findMany({
      where: {
        is_overdue_processed: false,
        status: { in: ['SEDANG_DIKEMAS', 'MENUNGGU_PENGIRIM', 'SEDANG_DIKIRIM'] },
      },
      include: { order_items: true, status_history: { orderBy: { created_at: 'asc' } } }
    })
    
    for (const order of overdueOrders) {
      const createdAt = order.created_at
      const slaDays = DELIVERY_SLA_DAYS[order.delivery_method]
      const deadline = new Date(createdAt)
      deadline.setDate(deadline.getDate() + slaDays)
      
      if (systemDate > deadline) {
        await this.refundOrder(order)
      }
    }
  }
  
  async refundOrder(order) {
    await prisma.$transaction(async (tx) => {
      // 1. Mark as processed (prevent double-processing)
      await tx.order.update({
        where: { id: order.id },
        data: {
          is_overdue_processed: true,
          status: 'DIKEMBALIKAN'
        }
      })
      
      // 2. Status history
      await tx.orderStatusHistory.create({
        data: {
          order_id: order.id,
          status: 'DIKEMBALIKAN',
          note: 'Auto-returned due to delivery SLA exceeded'
        }
      })
      
      // 3. Refund to buyer wallet
      await tx.buyerProfile.update({
        where: { id: order.buyer_id },
        data: { balance: { increment: Number(order.final_total) } }
      })
      await tx.walletTransaction.create({
        data: {
          buyer_id: order.buyer_id,
          type: 'REFUND',
          amount: order.final_total,
          description: `Refund for overdue order ${order.id}`,
          order_id: order.id
        }
      })
      
      // 4. Restore product stock
      for (const item of order.order_items) {
        await tx.product.update({
          where: { id: item.product_id },
          data: { stock: { increment: item.quantity } }
        })
      }
      
      // 5. Seller income reversal (if needed - income recorded on completion only)
      // Since income is only recorded on PESANAN_SELESAI, no reversal needed here
    })
  }
}
```

### 3.6 Driver Job Race Condition Prevention

```typescript
// services/driver.service.ts

async takeJob(driverId: string, jobId: string) {
  return await prisma.$transaction(async (tx) => {
    // Pessimistic lock - use raw query for SELECT FOR UPDATE
    const job = await tx.$queryRaw`
      SELECT * FROM "DeliveryJob" 
      WHERE id = ${jobId} 
      AND driver_id IS NULL
      FOR UPDATE SKIP LOCKED
    `
    
    if (!job || job.length === 0) {
      throw new ConflictError('Job already taken or not available')
    }
    
    // Take the job
    await tx.deliveryJob.update({
      where: { id: jobId },
      data: {
        driver_id: driverId,
        taken_at: new Date()
      }
    })
    
    // Update order status
    await tx.order.update({
      where: { id: job[0].order_id },
      data: { status: 'SEDANG_DIKIRIM' }
    })
    
    // Status history
    await tx.orderStatusHistory.create({
      data: {
        order_id: job[0].order_id,
        status: 'SEDANG_DIKIRIM',
        note: `Driver assigned`
      }
    })
    
    return job[0]
  })
}
```

---

## 4. Frontend Design

### 4.1 State Management (Zustand)

```typescript
// store/auth.store.ts
interface AuthStore {
  user: User | null
  accessToken: string | null
  activeRole: Role | null
  
  login: (credentials) => Promise<void>
  logout: () => Promise<void>
  selectRole: (role: Role) => Promise<void>
  refreshToken: () => Promise<void>
  
  setUser: (user: User) => void
  clearAuth: () => void
}
```

### 4.2 Axios Interceptors

```typescript
// lib/api.ts

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,  // Send cookies (refresh token)
})

// Request interceptor: attach access token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor: auto-refresh on 401
let isRefreshing = false
let refreshQueue = []

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject })
        }).then(token => {
          error.config.headers.Authorization = `Bearer ${token}`
          return api(error.config)
        })
      }
      
      error.config._retry = true
      isRefreshing = true
      
      try {
        const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true })
        const newToken = data.data.access_token
        useAuthStore.getState().setAccessToken(newToken)
        refreshQueue.forEach(p => p.resolve(newToken))
        refreshQueue = []
        return api(error.config)
      } catch (refreshError) {
        refreshQueue.forEach(p => p.reject(refreshError))
        useAuthStore.getState().clearAuth()
        window.location.href = '/auth/login'
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)
```

### 4.3 Next.js Route Protection (Middleware)

```typescript
// middleware.ts (Next.js)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED_PREFIXES = {
  '/buyer': 'BUYER',
  '/seller': 'SELLER',
  '/driver': 'DRIVER',
  '/admin': 'ADMIN',
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  
  // Check if path requires protection
  for (const [prefix, role] of Object.entries(PROTECTED_PREFIXES)) {
    if (path.startsWith(prefix)) {
      // Frontend middleware only checks presence of auth cookie
      // Real auth check happens at API level
      const hasRefreshToken = request.cookies.has('seapedia_refresh_token')
      if (!hasRefreshToken) {
        return NextResponse.redirect(new URL('/auth/login', request.url))
      }
    }
  }
  
  return NextResponse.next()
}
```

---

## 5. Security Architecture

### 5.1 JWT Token Design

```
Access Token (15 min):
{
  "sub": "user-uuid",
  "username": "johndoe",
  "email": "john@example.com",
  "roles": ["BUYER", "SELLER"],
  "active_role": "BUYER",
  "iat": 1234567890,
  "exp": 1234568790
}

Refresh Token (7 days):
{
  "sub": "user-uuid",
  "jti": "refresh-token-uuid",  // Stored in DB for revocation
  "iat": 1234567890,
  "exp": 1235172690
}
```

### 5.2 Input Sanitization Pipeline

```typescript
// utils/sanitize.ts
import sanitizeHtml from 'sanitize-html'

export function sanitizeText(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: [],        // No HTML tags allowed
    allowedAttributes: {},  // No attributes
  })
}

// Applied to: review.reviewer_name, review.comment, store.name, 
//             store.description, product.name, product.description
```

### 5.3 Validation Layer (Zod)

```typescript
// All request bodies validated with Zod schemas before reaching controllers
const CheckoutSchema = z.object({
  address_id: z.string().uuid(),
  delivery_method: z.enum(['INSTANT', 'NEXT_DAY', 'REGULAR']),
  discount_code: z.string().optional()
})

const ReviewSchema = z.object({
  reviewer_name: z.string().min(1).max(100),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1).max(1000)
})
```

---

## 6. Deployment Architecture

### 6.1 Environment Variables

**Backend (.env):**
```
DATABASE_URL=postgresql://...
JWT_SECRET=<256-bit-secret>
JWT_REFRESH_SECRET=<different-256-bit-secret>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
FRONTEND_URL=https://seapedia.vercel.app
NODE_ENV=production
PORT=3001
BCRYPT_ROUNDS=12
```

**Frontend (.env.local):**
```
NEXT_PUBLIC_API_URL=https://seapedia-api.railway.app/api
```

### 6.2 CORS Configuration

```typescript
const corsConfig = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}
```

### 6.3 Railway Configuration (Backend)

```json
// railway.json or Procfile
{
  "deploy": {
    "startCommand": "npm run start",
    "buildCommand": "npm run build && npx prisma migrate deploy"
  }
}
```

---

## 7. Pricing Calculation Reference

```typescript
// utils/pricing.ts

export const DELIVERY_FEES: Record<DeliveryMethod, number> = {
  INSTANT: 15000,
  NEXT_DAY: 10000,
  REGULAR: 6000,
}

export const DRIVER_EARNING_RATE = 0.8  // 80% of delivery fee

export const PPN_RATE = 0.12  // 12%

export function calculatePricing(
  items: { price: number; quantity: number }[],
  deliveryMethod: DeliveryMethod,
  discountAmount: number = 0
): PricingBreakdown {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const discountedSubtotal = Math.max(0, subtotal - discountAmount)
  const deliveryFee = DELIVERY_FEES[deliveryMethod]
  const taxBase = discountedSubtotal + deliveryFee
  const ppnAmount = Math.round(taxBase * PPN_RATE)
  const finalTotal = taxBase + ppnAmount

  return {
    subtotal,
    discount_amount: discountAmount,
    discounted_subtotal: discountedSubtotal,
    delivery_fee: deliveryFee,
    ppn_amount: ppnAmount,
    final_total: finalTotal,
  }
}

export function calculateDriverEarning(deliveryMethod: DeliveryMethod): number {
  return DELIVERY_FEES[deliveryMethod] * DRIVER_EARNING_RATE
}

export function applyDiscount(
  discountType: DiscountType,
  discountValue: number,
  subtotal: number,
  maxDiscountAmount?: number
): number {
  let amount: number
  if (discountType === 'PERCENTAGE') {
    amount = subtotal * (discountValue / 100)
    if (maxDiscountAmount) amount = Math.min(amount, maxDiscountAmount)
  } else {
    amount = discountValue
  }
  return Math.min(amount, subtotal)  // Cannot discount more than subtotal
}
```

---

## 8. Seed Data Design

```typescript
// prisma/seed.ts

// Admin account
{
  username: "admin",
  email: "admin@seapedia.com",
  password: hash("Admin@123"),
  roles: [ADMIN]
}

// Seller account (also has Buyer role)
{
  username: "seller1",
  email: "seller1@seapedia.com",
  password: hash("Seller@123"),
  roles: [SELLER, BUYER],
  store: { name: "Toko Elektronik Maju", description: "..." }
  products: [5 sample products with stock]
}

// Buyer account (also has Driver role)
{
  username: "buyer1",
  email: "buyer1@seapedia.com",
  password: hash("Buyer@123"),
  roles: [BUYER, DRIVER],
  wallet_balance: 1,000,000
}

// Driver-only account
{
  username: "driver1",
  email: "driver1@seapedia.com",
  password: hash("Driver@123"),
  roles: [DRIVER]
}

// Vouchers
{ code: "HEMAT10", discount_type: PERCENTAGE, discount_value: 10, max_usage: 100, expiry: +30 days }
{ code: "DISC50K", discount_type: FIXED_AMOUNT, discount_value: 50000, max_usage: 50, expiry: +30 days }

// Promos
{ code: "PROMO15", discount_type: PERCENTAGE, discount_value: 15, expiry: +30 days }
{ code: "FLASH25K", discount_type: FIXED_AMOUNT, discount_value: 25000, expiry: +30 days }
```
