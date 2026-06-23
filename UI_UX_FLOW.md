# SEAPEDIA — UI/UX Flow Document

**Version:** 1.0.0  
**Project:** COMPFEST 18 — Software Engineering Academy  
**Frontend:** Next.js 14 App Router + Tailwind CSS  

---

## 1. Design System

### 1.1 Color Palette

```
Primary:      #3B82F6  (blue-500)   — Main CTA, links
Primary Dark: #1D4ED8  (blue-700)   — Hover states
Secondary:    #10B981  (emerald-500) — Success states
Accent:       #F59E0B  (amber-500)   — Warnings, star ratings
Danger:       #EF4444  (red-500)     — Errors, destructive
Surface:      #FFFFFF               — Cards, modals
Background:   #F9FAFB  (gray-50)    — Page background
Border:       #E5E7EB  (gray-200)   — Card borders
Text:         #111827  (gray-900)   — Primary text
TextSub:      #6B7280  (gray-500)   — Secondary text
```

### 1.2 Typography

```
Font Family: Inter (Google Fonts)
Headings:    font-bold, tracking-tight
Body:        font-normal, leading-relaxed
Code:        font-mono
Sizes:       xs(12), sm(14), base(16), lg(18), xl(20), 2xl(24), 3xl(30), 4xl(36)
```

### 1.3 Component Library

All components built with Tailwind CSS + shadcn/ui as reference:

| Component | Variants |
|-----------|---------|
| Button | primary, secondary, outline, ghost, danger (sizes: sm, md, lg) |
| Input | default, error, disabled (with label + helper text) |
| Card | default, hover, selected |
| Badge | blue (info), green (success), yellow (warning), red (danger), gray (neutral) |
| Modal | dialog overlay with backdrop blur |
| Toast | success, error, warning, info (positioned top-right) |
| Skeleton | loading state placeholder |
| Avatar | initials-based, image-based |
| Tabs | underline style, pill style |
| Table | sortable, paginated |
| StarRating | 1-5 stars, interactive + display-only |
| Stepper | order status timeline |

### 1.4 Layout Grid

```
Mobile:  1 column, 16px padding
Tablet:  2 columns, 24px padding  (768px+)
Desktop: 3-4 columns, 32px padding (1280px+)
Max width: 1400px, centered
```

---

## 2. Page-by-Page Flow

### 2.1 Landing Page (`/`)

**Purpose:** Introduce SEAPEDIA as a multi-seller marketplace, show featured products, and collect app reviews.

**Layout:**
```
┌────────────────────────────────────────────────────────┐
│  NAVBAR: Logo | Products | [Login] [Register]           │
├────────────────────────────────────────────────────────┤
│  HERO SECTION                                           │
│  ┌─────────────────────────────┐ ┌──────────────────┐ │
│  │ "Belanja dari ribuan toko   │ │  [Hero Image/    │ │
│  │  terpercaya di SEAPEDIA"   │ │   Illustration]  │ │
│  │                             │ │                  │ │
│  │ [Mulai Belanja] [Jual Sekarang]                  │ │
│  └─────────────────────────────┘ └──────────────────┘ │
├────────────────────────────────────────────────────────┤
│  FEATURED CATEGORIES (scrollable horizontal)           │
│  [Elektronik] [Fashion] [Makanan] [Olahraga] ...       │
├────────────────────────────────────────────────────────┤
│  FEATURED PRODUCTS                                      │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                 │
│  │ Prod │ │ Prod │ │ Prod │ │ Prod │                 │
│  │  1   │ │  2   │ │  3   │ │  4   │                 │
│  └──────┘ └──────┘ └──────┘ └──────┘                 │
│                        [Lihat Semua Produk →]          │
├────────────────────────────────────────────────────────┤
│  HOW IT WORKS (3 steps: Pilih → Beli → Terima)         │
├────────────────────────────────────────────────────────┤
│  APP REVIEWS SECTION                                    │
│  "Apa kata mereka tentang SEAPEDIA?"                   │
│  ┌──────────────────┐ ┌──────────────────┐            │
│  │ ★★★★★            │ │ ★★★★☆            │            │
│  │ "Review text..." │ │ "Review text..." │            │
│  │ — Reviewer Name  │ │ — Reviewer Name  │            │
│  └──────────────────┘ └──────────────────┘            │
│                                                        │
│  [Tulis Review] → Opens inline form or modal           │
├────────────────────────────────────────────────────────┤
│  FOOTER: Links | Social | Copyright                    │
└────────────────────────────────────────────────────────┘
```

**Interactions:**
- "Mulai Belanja" → `/products`
- "Jual Sekarang" → `/auth/register` (with seller intent)
- Product cards → `/products/:id`
- "Tulis Review" → expand inline review form OR scroll to form
- Review form submit → POST /reviews → show success toast → add review to list

**Review Form:**
```
┌────────────────────────────────────────┐
│  Bagikan Pengalamanmu dengan SEAPEDIA  │
│                                        │
│  Nama Kamu *                           │
│  [____________________________________]│
│                                        │
│  Rating *                              │
│  [☆][☆][☆][☆][☆] (clickable stars)   │
│                                        │
│  Komentar *                            │
│  [____________________________________]│
│  [____________________________________]│
│  [____________________________________]│
│                        0/1000 chars    │
│                                        │
│             [Kirim Review]             │
└────────────────────────────────────────┘
```

---

### 2.2 Product Catalog (`/products`)

**Layout:**
```
┌────────────────────────────────────────────────────────┐
│  NAVBAR                                                 │
├────────────────────────────────────────────────────────┤
│  BREADCRUMB: Home > Produk                             │
├──────────────┬─────────────────────────────────────────┤
│  FILTERS     │  PRODUCT GRID                           │
│  (sidebar or │  [Search: ________________________]     │
│   top bar)   │  Sort: [Terbaru ▼]  Filter: [Harga ▼] │
│              │                                         │
│  Harga       │  ┌────┐ ┌────┐ ┌────┐ ┌────┐          │
│  Min: [___]  │  │ P1 │ │ P2 │ │ P3 │ │ P4 │          │
│  Max: [___]  │  └────┘ └────┘ └────┘ └────┘          │
│              │  ┌────┐ ┌────┐ ┌────┐ ┌────┐          │
│  Toko        │  │ P5 │ │ P6 │ │ P7 │ │ P8 │          │
│  [search]    │  └────┘ └────┘ └────┘ └────┘          │
│              │                                         │
│              │  [← 1 2 3 4 5 →]  (pagination)         │
└──────────────┴─────────────────────────────────────────┘
```

**Product Card Component:**
```
┌──────────────────┐
│  [Product Image] │
│  (aspect 1:1)    │
├──────────────────┤
│ Nama Produk      │
│ (max 2 lines)    │
│ 🏪 Nama Toko     │
│ Rp 150.000       │
│ Stok: 24         │
└──────────────────┘
```

**Empty State:** "Belum ada produk yang tersedia" with illustration.

---

### 2.3 Product Detail (`/products/:id`)

**Layout:**
```
┌────────────────────────────────────────────────────────┐
│  NAVBAR                                                 │
├────────────────────────────────────────────────────────┤
│  BREADCRUMB: Home > Produk > [Nama Produk]             │
├─────────────────────────┬──────────────────────────────┤
│  LEFT: Product Images   │  RIGHT: Product Info         │
│  ┌──────────────────┐   │  Nama Produk (h1)            │
│  │   [Main Image]   │   │  Rp 150.000 (price)          │
│  │                  │   │  Stok: 24 tersisa            │
│  └──────────────────┘   │                              │
│  [img][img][img]        │  Kuantitas: [-][3][+]        │
│  (thumbnail gallery)    │  [Tambah ke Keranjang]       │
│                         │  (disabled if guest)         │
│                         │                              │
│                         │  ┌──────────────────────┐   │
│                         │  │ 🏪 Toko: Nama Toko   │   │
│                         │  │ [Lihat Toko →]        │   │
│                         │  └──────────────────────┘   │
├─────────────────────────┴──────────────────────────────┤
│  TABS: [Deskripsi] [Informasi Pengiriman]              │
│  Tab content area                                       │
└────────────────────────────────────────────────────────┘
```

**Guest Behavior:** "Tambah ke Keranjang" → shows tooltip: "Login terlebih dahulu untuk berbelanja" OR redirect to login.

**Add to Cart Flow (Buyer):**
1. Click "Tambah ke Keranjang"
2. If cart empty or same store → add successfully → show toast "Produk ditambahkan ke keranjang 🛒"
3. If different store → show modal:
   ```
   ┌──────────────────────────────────────────┐
   │  ⚠️ Produk dari Toko Berbeda             │
   │                                          │
   │  Keranjangmu saat ini berisi produk dari │
   │  "Toko A". SEAPEDIA hanya mengizinkan   │
   │  pembelian dari 1 toko dalam 1 pesanan. │
   │                                          │
   │  Apakah kamu ingin mengosongkan         │
   │  keranjang dan menambahkan produk ini?  │
   │                                          │
   │  [Batal]          [Ya, Kosongkan]        │
   └──────────────────────────────────────────┘
   ```

---

### 2.4 Auth Pages

#### Login (`/auth/login`)
```
┌──────────────────────────────────────┐
│  [SEAPEDIA Logo]                     │
│                                      │
│  Masuk ke SEAPEDIA                   │
│                                      │
│  Email atau Username                 │
│  [_________________________________] │
│                                      │
│  Password                            │
│  [_________________________________] │
│  (show/hide toggle)                  │
│                                      │
│  [          Masuk          ]         │
│                                      │
│  Belum punya akun? [Daftar di sini] │
└──────────────────────────────────────┘
```

**Login Flow:**
1. Submit → POST /auth/login
2. If success + 1 role → redirect to role dashboard
3. If success + multiple roles → redirect to `/auth/select-role`
4. If success + 0 roles → redirect to `/auth/add-role`
5. If error → show inline error message below field

#### Register (`/auth/register`)
```
┌──────────────────────────────────────┐
│  Buat Akun SEAPEDIA                  │
│                                      │
│  Nama Lengkap                        │
│  [_________________________________] │
│                                      │
│  Username                            │
│  [_________________________________] │
│                                      │
│  Email                               │
│  [_________________________________] │
│                                      │
│  Password                            │
│  [_________________________________] │
│                                      │
│  Daftar sebagai: (checkboxes)        │
│  ☐ Pembeli (Buyer)                   │
│  ☐ Penjual (Seller)                  │
│  ☐ Kurir (Driver)                    │
│                                      │
│  [         Daftar           ]        │
│                                      │
│  Sudah punya akun? [Masuk]          │
└──────────────────────────────────────┘
```

**Note:** User must select at least 1 role. Admin role cannot be self-registered.

#### Role Selection (`/auth/select-role`)
```
┌────────────────────────────────────────────┐
│  Halo, [Username]! 👋                      │
│  Pilih peran yang ingin kamu gunakan:      │
│                                            │
│  ┌──────────────┐  ┌──────────────┐       │
│  │  🛒 Pembeli  │  │ 🏪 Penjual   │       │
│  │              │  │              │       │
│  │  Belanja,    │  │  Kelola toko │       │
│  │  kelola      │  │  dan produk  │       │
│  │  pesanan     │  │              │       │
│  └──────────────┘  └──────────────┘       │
│                                            │
│         ┌──────────────┐                  │
│         │ 🚗 Kurir     │                  │
│         │              │                  │
│         │  Antar paket │                  │
│         │  dan raih    │                  │
│         │  penghasilan │                  │
│         └──────────────┘                  │
└────────────────────────────────────────────┘
```

**Interaction:** Click a role card → POST /auth/select-role → redirect to respective dashboard.

---

### 2.5 Buyer Dashboard

#### Dashboard Home (`/buyer/dashboard`)
```
┌────────────────────────────────────────────────────────┐
│  NAVBAR: Logo | [Produk] | 🛒 Cart(3) | [Andi (Buyer)▼]│
├───────────────────────────────────────────────────────-┤
│  SIDEBAR:                                               │
│  • Dashboard                                            │
│  • Dompet                                               │
│  • Keranjang                                            │
│  • Pesanan                                              │
│  • Alamat                                               │
│  • Laporan                                              │
│  ─────────────                                          │
│  • Ganti Peran                                          │
│  • Keluar                                               │
├───────────────────────────────────────────────────────-┤
│  MAIN CONTENT                                           │
│                                                         │
│  Selamat datang, Andi! 👋                              │
│                                                         │
│  ┌────────────────┐  ┌────────────────┐               │
│  │  💰 Saldo      │  │  📦 Pesanan    │               │
│  │  Rp 850.000    │  │  Aktif: 2      │               │
│  │  [Top Up]      │  │  [Lihat →]     │               │
│  └────────────────┘  └────────────────┘               │
│                                                         │
│  Pesanan Terbaru                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Order #001 | Sedang Dikirim | Rp 250.000        │  │
│  │ [Lihat Detail]                                   │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

#### Wallet (`/buyer/wallet`)
```
┌──────────────────────────────────────────────────┐
│  Dompet Saya                                     │
│                                                  │
│  ┌───────────────────────────────────────────┐  │
│  │  Saldo Tersedia                           │  │
│  │  Rp 850.000                               │  │
│  │                    [+ Top Up]             │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  Riwayat Transaksi                              │
│  ┌──────────────────────────────────────────┐  │
│  │ ↑ TOP_UP   +Rp 500.000   12 Jun 2025   │  │
│  │ ↓ PAYMENT  -Rp 250.000   11 Jun 2025   │  │
│  │ ↑ TOP_UP   +Rp 600.000   10 Jun 2025   │  │
│  └──────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

**Top Up Modal:**
```
┌──────────────────────────┐
│  Top Up Saldo            │
│                          │
│  Jumlah Top Up           │
│  Rp [__________________] │
│                          │
│  Pilih nominal cepat:    │
│  [50K] [100K] [250K]     │
│  [500K] [1JT]            │
│                          │
│  [Batal] [Top Up]        │
└──────────────────────────┘
```

#### Cart (`/buyer/cart`)
```
┌───────────────────────────────────────────────────────┐
│  Keranjang Belanja                                    │
│  ⚠️ Kamu hanya bisa membeli dari 1 toko dalam 1 order │
│                                                       │
│  Dari: 🏪 Toko Elektronik Maju                        │
│                                                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │ ☐ [img] Produk A           Rp 150.000           │ │
│  │          Stok: 24  [-][2][+]  Subtotal: 300.000 │ │
│  │          [🗑 Hapus]                              │ │
│  ├─────────────────────────────────────────────────┤ │
│  │ ☐ [img] Produk B           Rp 75.000            │ │
│  │          Stok: 10  [-][1][+]  Subtotal: 75.000  │ │
│  │          [🗑 Hapus]                              │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │  Subtotal (3 produk): Rp 375.000                │ │
│  │             [Lanjut ke Checkout →]              │ │
│  └─────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────┘
```

#### Checkout (`/buyer/checkout`)
```
┌───────────────────────────────────────────────────────┐
│  Checkout                                             │
│                                                       │
│  1. ALAMAT PENGIRIMAN                                 │
│  ┌──────────────────────────────────────────────┐    │
│  │ 🏠 Rumah — Andi Wijaya, 08123456789          │    │
│  │ Jl. Merdeka No. 10, Jakarta Selatan          │    │
│  │ [Ganti Alamat]                               │    │
│  └──────────────────────────────────────────────┘    │
│                                                       │
│  2. METODE PENGIRIMAN                                 │
│  ○ Instant     — Rp 15.000  (Sampai hari ini)        │
│  ○ Next Day    — Rp 10.000  (Sampai besok)           │
│  ● Regular     — Rp 6.000   (1-3 hari kerja)         │
│                                                       │
│  3. KODE DISKON (Opsional)                           │
│  [_______________________] [Gunakan]                  │
│  ✓ Voucher HEMAT10 berhasil diterapkan (-Rp 37.500)  │
│                                                       │
│  4. RINGKASAN PESANAN                                 │
│  ┌──────────────────────────────────────────────┐    │
│  │  Subtotal (3 produk)          Rp 375.000     │    │
│  │  Diskon (HEMAT10 -10%)       -Rp  37.500     │    │
│  │  Ongkos Kirim (Regular)        Rp   6.000    │    │
│  │  PPN 12%                       Rp  41.220    │    │
│  │  ─────────────────────────────────────────   │    │
│  │  Total Pembayaran              Rp 384.720    │    │
│  │                                              │    │
│  │  Saldo dompet: Rp 850.000 ✓                 │    │
│  │                                              │    │
│  │          [Konfirmasi Pesanan]                │    │
│  └──────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────┘
```

#### Order History (`/buyer/orders`)
```
Pesanan Saya
[Filter: Semua ▼]

┌──────────────────────────────────────────────────────┐
│ #ORDER-001                          11 Jun 2025      │
│ 🏪 Toko Elektronik Maju                             │
│ [img] Produk A x2  [img] Produk B x1               │
│                                                      │
│ 🟡 Sedang Dikirim        Total: Rp 384.720          │
│                          [Lacak Pesanan] [Detail]   │
└──────────────────────────────────────────────────────┘
```

#### Order Detail (`/buyer/orders/:id`)
```
Detail Pesanan #ORDER-001

TIMELINE PESANAN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Sedang Dikemas     11 Jun 2025 14:30
✅ Menunggu Pengirim  11 Jun 2025 15:00
✅ Sedang Dikirim     11 Jun 2025 16:30
⏳ Pesanan Selesai    —
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PRODUK:
[img] Produk A — Rp 150.000 × 2 = Rp 300.000
[img] Produk B — Rp 75.000  × 1 = Rp  75.000

RINCIAN BIAYA:
Subtotal               Rp 375.000
Diskon (HEMAT10)      -Rp  37.500
Ongkos Kirim           Rp   6.000
PPN 12%                Rp  41.220
Total                  Rp 384.720

ALAMAT PENGIRIMAN:
Andi Wijaya, 08123456789
Jl. Merdeka No. 10, Jakarta Selatan
```

---

### 2.6 Seller Dashboard

#### Dashboard Home (`/seller/dashboard`)
```
┌────────────────────────────────────────────────────────┐
│  SIDEBAR: Dashboard | Toko | Produk | Pesanan | Laporan│
├────────────────────────────────────────────────────────┤
│  Dashboard Penjual                                     │
│                                                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│  │Produk   │ │Pesanan  │ │Pesanan  │ │Total    │    │
│  │Aktif: 12│ │Baru: 3  │ │Proses: 5│ │Pend: 2  │    │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘    │
│                                                        │
│  Pesanan Masuk Terbaru                                 │
│  [table: Order | Customer | Total | Status | Action]  │
└────────────────────────────────────────────────────────┘
```

#### Seller Order Processing (`/seller/orders`)
```
Pesanan Masuk

[Filter: Semua | Sedang Dikemas | Menunggu Pengirim]

┌─────────────────────────────────────────────────────┐
│ #ORDER-001   Andi Wijaya   Rp 384.720               │
│ 🟡 Sedang Dikemas          11 Jun 2025              │
│ Produk A x2, Produk B x1                           │
│                            [Proses Pesanan]         │
└─────────────────────────────────────────────────────┘

// After clicking "Proses Pesanan":
// Confirmation modal → POST /seller/orders/:id/process
// Status changes to "Menunggu Pengirim"
// Toast: "Pesanan berhasil diproses. Menunggu kurir."
```

#### Product Management (`/seller/products`)
```
Produk Saya
                                    [+ Tambah Produk]

┌──────────────────────────────────────────────────────┐
│ [img] Produk A   Rp 150.000   Stok: 24   Aktif     │
│                              [Edit] [Hapus]          │
├──────────────────────────────────────────────────────┤
│ [img] Produk B   Rp 75.000    Stok: 0    Habis     │
│                              [Edit] [Hapus]          │
└──────────────────────────────────────────────────────┘
```

#### Add/Edit Product Form:
```
┌────────────────────────────────────────┐
│  Tambah Produk Baru                    │
│                                        │
│  Nama Produk *                         │
│  [____________________________________]│
│                                        │
│  Deskripsi                             │
│  [____________________________________]│
│  [____________________________________]│
│                                        │
│  Harga (Rp) *                          │
│  [____________________________________]│
│                                        │
│  Stok *                                │
│  [____________________________________]│
│                                        │
│  URL Gambar (pisahkan dengan koma)     │
│  [____________________________________]│
│                                        │
│  [Batal]          [Simpan Produk]      │
└────────────────────────────────────────┘
```

---

### 2.7 Driver Dashboard

#### Available Jobs (`/driver/jobs`)
```
Pekerjaan Tersedia

┌─────────────────────────────────────────────────────┐
│ 🚗 ORDER-001                         11 Jun 2025   │
│ 📍 Jl. Merdeka No. 10, Jakarta Selatan             │
│ 📦 Metode: Regular (SLA: 3 hari)                   │
│ 💰 Estimasi Pendapatan: Rp 4.800                   │
│                                   [Ambil Pekerjaan] │
└─────────────────────────────────────────────────────┘
```

**Take Job Confirmation Modal:**
```
┌────────────────────────────────────┐
│  Ambil Pekerjaan?                  │
│                                    │
│  Order: #ORDER-001                 │
│  Tujuan: Jl. Merdeka No. 10       │
│  Pendapatan: Rp 4.800             │
│                                    │
│  [Batal]        [Ya, Ambil]        │
└────────────────────────────────────┘
```

#### Active Job (`/driver/jobs/active`)
```
Pekerjaan Aktif

┌─────────────────────────────────────────────────┐
│ 🚗 Sedang dalam Perjalanan                      │
│                                                 │
│ Order: #ORDER-001                               │
│ Pembeli: Andi Wijaya (08123456789)             │
│ Alamat: Jl. Merdeka No. 10, Jakarta Selatan    │
│ Produk: Produk A x2, Produk B x1              │
│                                                 │
│         [✅ Konfirmasi Selesai]                 │
└─────────────────────────────────────────────────┘
```

---

### 2.8 Admin Dashboard

#### Overview (`/admin/dashboard`)
```
┌────────────────────────────────────────────────────────┐
│  Admin Dashboard — SEAPEDIA                           │
│                                                        │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │
│  │Users │ │Stores│ │Prods │ │Orders│ │Jobs  │       │
│  │ 124  │ │  32  │ │ 287  │ │ 1.2K │ │  45  │       │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘       │
│                                                        │
│  ⚠️ Overdue Orders: 3                                 │
│                                                        │
│  System Date: 12 Jun 2025 (+0 days offset)            │
│  [🔄 Simulasi Hari Berikutnya]                        │
│                                                        │
│  Order Status Breakdown                                │
│  [Bar chart: Dikemas | Menunggu | Dikirim | Selesai]  │
└────────────────────────────────────────────────────────┘
```

#### Voucher Management (`/admin/vouchers`)
```
Kelola Voucher
                                    [+ Buat Voucher]

┌────────────────────────────────────────────────────────┐
│ Code      Type        Value    Usage    Expiry   Status │
│ HEMAT10   Percentage  10%      45/100   30 Jun   Aktif │
│ DISC50K   Fixed Rp    50.000   12/50    25 Jun   Aktif │
└────────────────────────────────────────────────────────┘

// Create Voucher Modal:
┌────────────────────────────────────┐
│  Buat Voucher Baru                 │
│                                    │
│  Kode Voucher *                    │
│  [HEMAT10_____________]            │
│                                    │
│  Tipe Diskon *                     │
│  ○ Persentase (%)                  │
│  ● Nominal (Rp)                    │
│                                    │
│  Nilai Diskon *                    │
│  [50000_______________]            │
│                                    │
│  Maksimal Pemakaian *              │
│  [100_________________]            │
│                                    │
│  Tanggal Kadaluarsa *              │
│  [30 Jun 2025_________]            │
│                                    │
│  [Batal]    [Buat Voucher]         │
└────────────────────────────────────┘
```

#### Overdue Orders (`/admin/overdue`)
```
Pesanan Overdue

┌────────────────────────────────────────────────────────┐
│ Order     Buyer   Method    SLA     Status     Action  │
│ #001      Andi    Regular   3 hari  Dikembalikan  ✓   │
│ #002      Budi    Instant   1 hari  Sedang Dikirim [!] │
└────────────────────────────────────────────────────────┘

[🔄 Proses Semua Overdue]
```

---

## 3. Navigation Flow Diagram

```
GUEST:
  / → /products → /products/:id
     ↓
  /auth/login → [1 role] → /buyer|seller|driver/dashboard
              → [multi]  → /auth/select-role → /[role]/dashboard
              → [0 role] → /auth/add-role

BUYER SESSION:
  /buyer/dashboard
  ↓
  /products → /products/:id → [Add to Cart] → /buyer/cart
  /buyer/cart → /buyer/checkout → [Confirm] → /buyer/orders/:id
  /buyer/wallet → [Top Up Modal]
  /buyer/addresses → [Add/Edit Address]
  /buyer/orders → /buyer/orders/:id

SELLER SESSION:
  /seller/dashboard
  ↓
  /seller/store → [Create/Edit Store]
  /seller/products → [Create/Edit/Delete Product]
  /seller/orders → /seller/orders/:id → [Process Order]
  /seller/reports

DRIVER SESSION:
  /driver/dashboard
  ↓
  /driver/jobs → /driver/jobs/:id → [Take Job]
  /driver/jobs/active → [Confirm Complete]
  /driver/jobs/history
  /driver/earnings

ADMIN SESSION:
  /admin/dashboard
  ↓
  /admin/users
  /admin/stores
  /admin/orders
  /admin/delivery-jobs
  /admin/vouchers → [Create Voucher Modal]
  /admin/promos → [Create Promo Modal]
  /admin/overdue → [Simulate Next Day] → [Process Overdue]
```

---

## 4. Responsive Behavior

### 4.1 Navbar (Mobile)
- Logo + Hamburger menu icon
- Slide-out drawer for navigation links
- Cart icon with badge always visible

### 4.2 Dashboard (Mobile)
- Sidebar collapses to bottom tab bar on mobile
- Bottom tabs: Home | Browse | Cart | Orders | Profile

### 4.3 Product Grid
- Mobile: 2 columns
- Tablet: 3 columns
- Desktop: 4 columns

### 4.4 Dashboard Stats
- Mobile: 2×2 grid
- Desktop: 4-in-a-row

---

## 5. Error & Empty States

### 5.1 Error States
| Scenario | UI Treatment |
|----------|-------------|
| API error (500) | Red banner: "Terjadi kesalahan. Coba lagi." |
| Not found (404) | Custom 404 page with illustration |
| Unauthorized (401) | Auto redirect to login |
| Forbidden (403) | "Kamu tidak memiliki akses ke halaman ini" |
| Validation error | Red text under each invalid field |

### 5.2 Empty States
| Page | Empty State Text |
|------|-----------------|
| Product catalog | "Belum ada produk tersedia. Coba cari dengan kata kunci lain." |
| Cart | "Keranjangmu kosong. Yuk mulai belanja! [Mulai Belanja]" |
| Order history | "Belum ada pesanan. Buat pesanan pertamamu! [Belanja Sekarang]" |
| Driver jobs | "Belum ada pekerjaan tersedia saat ini. Coba lagi nanti." |
| Reviews | "Jadilah yang pertama memberikan ulasan!" |

### 5.3 Loading States
- Skeleton cards on product listing
- Spinner on button click (form submit, checkout)
- Skeleton rows on table loading

---

## 6. Toast Notifications

| Action | Toast | Type |
|--------|-------|------|
| Login success | "Selamat datang, [username]!" | success |
| Logout | "Berhasil keluar" | info |
| Add to cart | "Produk ditambahkan ke keranjang 🛒" | success |
| Checkout success | "Pesanan berhasil dibuat! 🎉" | success |
| Top up success | "Saldo berhasil ditambahkan" | success |
| Order processed | "Pesanan berhasil diproses" | success |
| Job taken | "Pekerjaan berhasil diambil" | success |
| Job completed | "Pengiriman selesai! Pendapatan Rp X dicatat" | success |
| Error (generic) | "Terjadi kesalahan. Silakan coba lagi." | error |
| Cart conflict | "Produk dari toko berbeda tidak bisa digabung" | warning |
| Insufficient balance | "Saldo tidak mencukupi. Silakan top up terlebih dahulu." | error |

---

## 7. Order Status Visual Treatment

```
Sedang Dikemas    → 🟡 Yellow badge   (packing icon)
Menunggu Pengirim → 🔵 Blue badge     (waiting icon)
Sedang Dikirim    → 🟠 Orange badge   (truck icon)
Pesanan Selesai   → 🟢 Green badge    (checkmark icon)
Dikembalikan      → 🔴 Red badge      (return arrow icon)
```

**Status Timeline Component:**
```
✅ Sedang Dikemas       [timestamp]
✅ Menunggu Pengirim    [timestamp]
⏳ Sedang Dikirim       [pending]
○  Pesanan Selesai     —
```
(completed steps = filled circle, current = animated pulse, future = hollow)
