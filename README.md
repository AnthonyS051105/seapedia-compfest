# SEAPEDIA 🛒

> Multi-role e-commerce marketplace — COMPFEST 18 Software Engineering Academy

**Live Demo:** https://seapedia-pi.vercel.app/
**API Docs (Swagger):** https://seapediabackend-production-9b3e.up.railway.app/api/docs
**GitHub:** https://github.com/AnthonyS051105/seapedia-compfest

---

## 📋 Table of Contents

1. [Tech Stack](#tech-stack)
2. [Prerequisites](#prerequisites)
3. [Local Setup](#local-setup)
4. [Environment Variables](#environment-variables)
5. [Demo Accounts](#demo-accounts)
6. [Business Rules](#business-rules)
7. [Security](#security)
8. [API Documentation](#api-documentation)
9. [Deployment](#deployment)
10. [Testing Guide](#testing-guide)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Express.js, TypeScript, Prisma ORM |
| Database | PostgreSQL (Supabase) |
| Auth | JWT (access token 15min + refresh token 7 days, httpOnly cookie) |
| API Docs | Swagger/OpenAPI (swagger-jsdoc + swagger-ui-express) |
| Deployment | Vercel (frontend) + Railway (backend) |

---

## Prerequisites

- Node.js v18+
- npm v9+
- PostgreSQL database (or Supabase/Neon free tier)

---

## Local Setup

### 1. Clone and install

```bash
git clone https://github.com/AnthonyS051105/seapedia-compfest.git
cd seapedia-compfest
npm install          # installs all workspace dependencies
```

### 2. Configure environment variables

```bash
# Backend
cp apps/backend/.env.example apps/backend/.env
# Edit apps/backend/.env — fill in DATABASE_URL, DIRECT_URL, and JWT secrets

# Frontend
cp apps/frontend/.env.example apps/frontend/.env.local
# Edit apps/frontend/.env.local — set NEXT_PUBLIC_API_URL
```

### 3. Setup database

```bash
cd apps/backend

# Run migrations
npx prisma migrate dev

# Seed demo data
npx prisma db seed
```

### 4. Run development servers

```bash
# From root, run both in separate terminals:
npm run dev:backend    # http://localhost:3001
npm run dev:frontend   # http://localhost:3000

# Or run individually inside each app:
cd apps/backend  && npm run dev   # http://localhost:3001
cd apps/frontend && npm run dev   # http://localhost:3000
```

### 5. Verify setup

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api/products
- Swagger UI: http://localhost:3001/api/docs

---

## Environment Variables

### Backend (`apps/backend/.env`)

```env
# Pooled connection (pgbouncer, port 6543) — used by the app at runtime
DATABASE_URL=postgresql://user:pass@host:6543/seapedia?pgbouncer=true
# Direct/session connection (port 5432) — required for migrations
DIRECT_URL=postgresql://user:pass@host:5432/seapedia

JWT_SECRET=your-256-bit-random-secret-here
JWT_REFRESH_SECRET=your-different-256-bit-random-secret-here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
PORT=3001
BCRYPT_ROUNDS=12
```

> `DATABASE_URL` and `DIRECT_URL` are both required when using Supabase's connection pooler (pgbouncer): Prisma uses `DATABASE_URL` at runtime and `DIRECT_URL` for migrations, which cannot run through the pooler.

### Frontend (`apps/frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

---

## Demo Accounts

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| Admin | admin@seapedia.com | Admin@123 | Admin role only |
| Seller + Buyer | seller1@seapedia.com | Seller@123 | Has store "Toko Elektronik Maju" + 5 products |
| Buyer + Driver | buyer1@seapedia.com | Buyer@123 | Wallet balance Rp 1.000.000 |
| Driver only | driver1@seapedia.com | Driver@123 | No other roles |

**Active discount codes for testing:**

| Code | Type | Value | Limit |
|------|------|-------|-------|
| HEMAT10 | Voucher (Percentage) | 10% off | 100 uses |
| DISC50K | Voucher (Fixed) | Rp 50.000 off | 50 uses |
| PROMO15 | Promo (Percentage) | 15% off | No limit |
| FLASH25K | Promo (Fixed) | Rp 25.000 off | No limit |

---

## Business Rules

### 1. Single-Store Cart

SEAPEDIA hanya mengizinkan pembelian dari **satu toko dalam satu pesanan**. Jika pembeli menambahkan produk dari toko berbeda, sistem akan menolak dengan error 409 dan meminta pembeli mengosongkan keranjang terlebih dahulu.

**Alasan:** Setiap pesanan harus diproses oleh satu penjual dan dikirim oleh satu kurir. Multi-toko dalam satu pesanan membutuhkan split order yang keluar dari scope proyek ini.

Aturan ini diterapkan di **backend** (bukan hanya frontend) — endpoint `POST /api/buyer/cart` akan menolak jika produk berasal dari toko berbeda dari isi keranjang saat ini.

### 2. Kalkulasi Harga (Urutan Wajib)

```
subtotal         = Σ (harga_produk × jumlah)
discount_amount  = hitung_diskon(kode_diskon, subtotal)   ← diskon dulu
discounted       = subtotal - discount_amount
delivery_fee     = ongkir_sesuai_metode
tax_base         = discounted + delivery_fee
ppn_12           = round(tax_base × 0.12)                ← PPN setelah diskon
final_total      = tax_base + ppn_12
```

**Contoh konkret:**
- Subtotal: Rp 300.000
- Diskon HEMAT10 (10%): -Rp 30.000
- Discounted: Rp 270.000
- Ongkir Regular: +Rp 6.000
- Tax base: Rp 276.000
- PPN 12%: Rp 33.120
- **Total: Rp 309.120**

> Diskon diterapkan SEBELUM PPN. PPN dihitung dari (subtotal setelah diskon + ongkir), bukan dari subtotal mentah.

### 3. Voucher vs Promo

| Atribut | Voucher | Promo |
|---------|---------|-------|
| Batas penggunaan | Ya (`max_usage`) | Tidak |
| Tanggal kadaluarsa | Ya | Ya |
| Dibuat oleh | Admin | Admin |
| Kombinasi | ❌ Tidak bisa digabung | ❌ Tidak bisa digabung |

Hanya **satu kode diskon** (voucher ATAU promo) yang bisa digunakan per pesanan — tidak ada stacking.

### 4. Alur Status Pesanan

```
[Checkout]
    │
    ▼
Sedang Dikemas          ← Status awal setelah checkout berhasil
    │
    │ [Penjual klik "Proses Pesanan"]
    ▼
Menunggu Pengirim       ← Kurir bisa melihat dan mengambil pekerjaan
    │
    │ [Kurir klik "Ambil Pekerjaan"]
    ▼
Sedang Dikirim          ← Kurir sedang mengantar
    │
    │ [Kurir klik "Konfirmasi Selesai"]
    ▼
Pesanan Selesai         ← Selesai normal
    │
    │ [Jika melewati SLA → auto oleh sistem]
    ▼
Dikembalikan            ← Overdue / dikembalikan
```

Setiap perubahan status dicatat di `OrderStatusHistory` dengan timestamp. Status tidak bisa melompat langkah (mis. tidak bisa langsung dari `Sedang Dikemas` ke `Sedang Dikirim`).

### 5. Pendapatan Kurir

Kurir mendapat **80% dari ongkos kirim** untuk setiap pengiriman yang selesai dikonfirmasi.

| Metode | Ongkir | Pendapatan Kurir (80%) |
|--------|--------|------------------------|
| Instant | Rp 15.000 | Rp 12.000 |
| Next Day | Rp 10.000 | Rp 8.000 |
| Regular | Rp 6.000 | Rp 4.800 |

Dicatat di `DeliveryJob.earning` (per pekerjaan) dan diakumulasikan di `DriverProfile.total_earnings`.

### 6. Aturan Overdue (SLA Pengiriman)

Pesanan dianggap overdue jika tidak mencapai status `Pesanan Selesai` dalam batas waktu berikut, dihitung dari waktu checkout (`created_at`):

| Metode | SLA |
|--------|-----|
| Instant | 1 hari |
| Next Day | 2 hari |
| Regular | 3 hari |

**Yang terjadi saat overdue (dalam satu Prisma transaction):**
1. Flag `is_overdue_processed` di-set `true` lebih dulu — mencegah pemrosesan ganda (double refund/restock)
2. Status pesanan berubah → `Dikembalikan`, dicatat di `OrderStatusHistory`
3. Dana `final_total` dikembalikan ke dompet pembeli (tipe transaksi: `REFUND`)
4. Stok produk dipulihkan sesuai jumlah pada `OrderItem`
5. Pendapatan penjual tidak pernah dicatat untuk pesanan ini (income hanya dicatat saat `Pesanan Selesai`)

**Cara mensimulasikan "hari berikutnya":**
1. Login sebagai Admin → buka `/admin/dashboard`
2. Klik tombol **"Simulasi Hari Berikutnya"**
3. Setiap klik memanggil `POST /api/admin/simulate-next-day`, yang menambah `system_date_offset` di tabel `SystemConfig` sebesar 1 hari, lalu otomatis memproses semua pesanan yang sudah melewati SLA-nya
4. Pesanan overdue dapat dilihat di `/admin/overdue`

---

## Security

### SQL Injection Prevention
Semua query database menggunakan **Prisma ORM**, yang secara otomatis memparameterisasi seluruh input. Satu-satunya raw query (`$queryRaw` untuk `SELECT ... FOR UPDATE SKIP LOCKED` saat driver mengambil job) menggunakan tagged template literal sehingga tetap diparameterisasi — tidak ada string interpolation langsung ke SQL di manapun dalam codebase.

### XSS Prevention
- **Backend:** Semua input teks dari pengguna (nama reviewer & komentar review, nama/deskripsi toko, nama/deskripsi produk, nama lengkap user, nama/deskripsi promo) diproses melalui `sanitize-html` sebelum disimpan ke database — menghapus seluruh tag HTML.
- **Frontend:** React JSX secara default meng-escape semua string sehingga konten tidak bisa dieksekusi sebagai HTML. `dangerouslySetInnerHTML` tidak digunakan di manapun pada konten buatan pengguna.

### Input Validation
Semua request body dan query divalidasi menggunakan **Zod schemas** sebelum mencapai controller (lihat `ZOD_SCHEMAS.md`). Field yang tidak valid mengembalikan HTTP 400 dengan detail error per field.

### Session & Token Security
- **Access token:** JWT dengan expiry 15 menit, disimpan di memory (Zustand store) — tidak pernah di localStorage.
- **Refresh token:** JWT dengan expiry 7 hari, disimpan sebagai `httpOnly`, `Secure` (production), `SameSite=Strict` cookie — tidak bisa diakses JavaScript.
- **Logout:** Refresh token ditandai `is_revoked = true` di database, sehingga tidak bisa dipakai lagi walau secara kriptografis masih valid (belum expired).
- **Token cleanup:** Refresh token yang sudah expired dibersihkan secara otomatis saat server start.
- **Rate limiting:** Endpoint `/api/auth/*` dibatasi 10 request/menit per IP; endpoint lain dibatasi 100 request/menit per IP.

### Role-Based Access Control (RBAC)
- Setiap endpoint protected memverifikasi `active_role` dari payload JWT di sisi **server**, bukan dari state frontend.
- Kepemilikan resource diverifikasi pada setiap operasi mutasi (mis. seller hanya bisa edit produk dari tokonya sendiri, buyer hanya bisa lihat pesanannya sendiri, driver hanya bisa menyelesaikan job miliknya).
- Admin bersifat eksklusif (tidak bisa digabung dengan role lain); role non-admin tidak bisa mengakses endpoint `/api/admin/*` (dijaga oleh `requireRole('ADMIN')` di level router).

---

## API Documentation

- **Local:** http://localhost:3001/api/docs
- **Production:** https://seapediabackend-production-9b3e.up.railway.app/api/docs

Semua endpoint terdokumentasi dengan:
- Request body schema
- Query parameters
- Response schema per status code (200/201/400/401/403/404/409)
- Auth requirements (`bearerAuth`)
- Contoh response

---

## Deployment

| Service | Provider | URL |
|---------|----------|-----|
| Frontend | Vercel | https://seapedia-pi.vercel.app/ |
| Backend API | Railway | https://seapediabackend-production-9b3e.up.railway.app/api |
| Database | Supabase (PostgreSQL) | private |

Demo accounts (see [Demo Accounts](#demo-accounts)) are seeded on the production database and are usable directly on the live demo.

---

## Testing Guide

Lihat [TESTING_GUIDE.md](TESTING_GUIDE.md) untuk skenario end-to-end lengkap per role, termasuk security tests (XSS, SQL injection, unauthorized/wrong-role access).

Ringkasan alur test utama:

1. **Guest flow:** Buka `/products` → lihat detail produk → submit review di landing page
2. **Buyer flow:** Register → login → top up dompet → tambah ke keranjang → checkout (dengan voucher) → lacak pesanan
3. **Seller flow:** Login → buat/kelola toko → buat produk → proses pesanan masuk
4. **Driver flow:** Login → ambil pekerjaan → konfirmasi selesai → cek pendapatan
5. **Admin flow:** Login → lihat dashboard → buat voucher/promo → simulasi hari berikutnya → cek pesanan overdue
6. **Security tests:** XSS payload pada form review, SQL injection pada parameter search, akses tanpa token, akses dengan role yang salah
