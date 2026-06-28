# SEAPEDIA — Testing Guide

> Panduan end-to-end untuk memverifikasi semua fitur berjalan benar.
> Jalankan setiap skenario secara berurutan karena beberapa bergantung pada state sebelumnya.

---

## Setup Sebelum Testing

```bash
# Reset database ke kondisi seed awal
cd apps/backend
npx prisma migrate reset --force   # drop + migrate + seed
```

Buka dua tab browser:
- Tab 1: http://localhost:3000 (frontend)
- Tab 2: http://localhost:3001/api/docs (Swagger UI)

---

## Skenario 1: Guest Flow

**Tujuan:** Verifikasi halaman publik bisa diakses tanpa login.

### 1.1 Browse Catalog
- [ ] Buka http://localhost:3000
- [ ] Klik "Mulai Belanja" → redirect ke `/products`
- [ ] Verifikasi: daftar produk tampil (dari seed data)
- [ ] Klik salah satu produk → halaman detail muncul
- [ ] Verifikasi: tombol "Tambah ke Keranjang" ada tapi disabled/redirect ke login

### 1.2 Submit App Review
- [ ] Kembali ke landing page `/`
- [ ] Scroll ke section "Apa kata mereka"
- [ ] Klik "Tulis Review"
- [ ] Isi form:
  - Nama: `Tester Satu`
  - Rating: 4 bintang
  - Komentar: `Marketplace yang bagus!`
- [ ] Submit
- [ ] Verifikasi: review muncul di daftar tanpa perlu refresh

### 1.3 XSS Test
- [ ] Submit review dengan komentar: `<script>alert('xss')</script>`
- [ ] Verifikasi: teks muncul sebagai tulisan biasa, BUKAN popup alert
- [ ] Verifikasi di backend: `GET /api/reviews` — field comment sudah di-sanitize

---

## Skenario 2: Seller Flow

**Akun:** seller1@seapedia.com / Seller@123

### 2.1 Login sebagai Seller
- [ ] Buka `/auth/login`
- [ ] Login dengan akun seller1
- [ ] Verifikasi: muncul role selection (karena punya role SELLER + BUYER)
- [ ] Pilih peran "Penjual"
- [ ] Verifikasi: redirect ke `/seller/dashboard`
- [ ] Verifikasi: badge peran "Seller" terlihat di navbar

### 2.2 Kelola Toko
- [ ] Buka `/seller/store`
- [ ] Verifikasi: toko "Toko Elektronik Maju" sudah ada (dari seed)
- [ ] Edit deskripsi toko → simpan
- [ ] Verifikasi: perubahan tersimpan dan tampil

### 2.3 Buat Produk Baru
- [ ] Buka `/seller/products` → klik "+ Tambah Produk"
- [ ] Isi form:
  - Nama: `Headphone Wireless`
  - Deskripsi: `Headphone bluetooth kualitas premium`
  - Harga: `250000`
  - Stok: `15`
- [ ] Simpan
- [ ] Verifikasi: produk muncul di daftar produk seller
- [ ] Verifikasi: produk juga muncul di `/products` (catalog publik)

### 2.4 Edit dan Hapus Produk
- [ ] Edit produk yang baru dibuat → ubah stok jadi 20 → simpan
- [ ] Verifikasi: stok berubah
- [ ] (Opsional) Test hapus produk lain → konfirmasi → produk hilang dari catalog

---

## Skenario 3: Buyer Flow Lengkap

**Akun:** buyer1@seapedia.com / Buyer@123 (saldo Rp 1.000.000)

### 3.1 Login sebagai Buyer
- [ ] Login dengan akun buyer1
- [ ] Pilih peran "Pembeli"
- [ ] Verifikasi: redirect ke `/buyer/dashboard`
- [ ] Verifikasi: saldo dompet Rp 1.000.000 terlihat

### 3.2 Top Up Dompet
- [ ] Buka `/buyer/wallet`
- [ ] Klik "Top Up"
- [ ] Masukkan jumlah: `500000`
- [ ] Konfirmasi
- [ ] Verifikasi: saldo bertambah menjadi Rp 1.500.000
- [ ] Verifikasi: riwayat transaksi menampilkan TOP_UP Rp 500.000

### 3.3 Tambah Alamat
- [ ] Buka `/buyer/addresses`
- [ ] Tambah alamat baru:
  - Label: `Rumah`
  - Nama penerima: `Budi Santoso`
  - HP: `081234567890`
  - Alamat: `Jl. Merdeka No. 10`
  - Kota: `Jakarta Selatan`
  - Provinsi: `DKI Jakarta`
  - Kode pos: `12345`
- [ ] Set sebagai default
- [ ] Verifikasi: alamat tersimpan dan diberi tanda default

### 3.4 Tambah ke Keranjang
- [ ] Buka `/products`
- [ ] Klik produk dari "Toko Elektronik Maju"
- [ ] Klik "Tambah ke Keranjang" (qty: 2)
- [ ] Verifikasi: toast sukses muncul
- [ ] Klik produk kedua dari TOKO YANG SAMA → tambah ke keranjang
- [ ] Verifikasi: keranjang punya 2 item dari 1 toko

### 3.5 Test Single-Store Rule
- [ ] Cari produk dari toko BERBEDA (jika ada toko lain dari seed atau buat lewat akun seller lain)
- [ ] Klik "Tambah ke Keranjang"
- [ ] Verifikasi: muncul modal konfirmasi "Produk dari toko berbeda"
- [ ] Klik "Batal" → item lama tetap ada
- [ ] Test via API (Swagger): `POST /api/buyer/cart` dengan product dari toko beda → verifikasi dapat 409

### 3.6 Checkout dengan Voucher
- [ ] Buka `/buyer/cart`
- [ ] Klik "Lanjut ke Checkout"
- [ ] Di halaman checkout:
  - Pilih alamat "Rumah"
  - Pilih metode: Regular (Rp 6.000)
  - Masukkan kode: `HEMAT10` → klik "Gunakan"
  - Verifikasi: diskon 10% tampil di rincian
- [ ] Verifikasi breakdown harga:
  - Subtotal = harga produk × qty
  - Diskon = 10% dari subtotal
  - Ongkir = Rp 6.000
  - PPN = 12% dari (subtotal_setelah_diskon + ongkir)
  - Total = subtotal_setelah_diskon + ongkir + PPN
- [ ] Klik "Konfirmasi Pesanan"
- [ ] Verifikasi: redirect ke halaman detail pesanan
- [ ] Verifikasi: status awal "Sedang Dikemas"
- [ ] Verifikasi: saldo dompet berkurang sesuai total

### 3.7 Verifikasi Stok Berkurang
- [ ] Buka produk yang dibeli di `/products`
- [ ] Verifikasi: stok berkurang sesuai qty yang dibeli

### 3.8 Test Voucher Kadaluarsa (via API)
- [ ] Di Swagger, gunakan akun admin untuk buat voucher kadaluarsa:
  ```json
  POST /api/admin/vouchers
  { "code": "EXPIRED", "discount_type": "FIXED_AMOUNT", "discount_value": 10000,
    "expiry_date": "2020-01-01", "max_usage": 100 }
  ```
- [ ] Coba gunakan kode `EXPIRED` saat checkout → verifikasi error "Voucher has expired"

---

## Skenario 4: Seller Memproses Pesanan

**Akun:** seller1@seapedia.com (switch ke peran Seller)

### 4.1 Lihat Pesanan Masuk
- [ ] Login seller1, pilih peran Seller
- [ ] Buka `/seller/orders`
- [ ] Verifikasi: pesanan dari buyer1 ada dengan status "Sedang Dikemas"

### 4.2 Proses Pesanan
- [ ] Klik pesanan → halaman detail
- [ ] Klik "Proses Pesanan"
- [ ] Konfirmasi di modal
- [ ] Verifikasi: status berubah ke "Menunggu Pengirim"
- [ ] Verifikasi: timeline pesanan menampilkan dua status dengan timestamp

---

## Skenario 5: Driver Flow

**Akun:** driver1@seapedia.com / Driver@123  
*(atau buyer1@seapedia.com → pilih peran Driver)*

### 5.1 Login sebagai Driver
- [ ] Login driver1, pilih peran Driver (auto karena 1 role)
- [ ] Verifikasi: redirect ke `/driver/dashboard`

### 5.2 Lihat dan Ambil Pekerjaan
- [ ] Buka `/driver/jobs`
- [ ] Verifikasi: pesanan yang sudah diproses seller ada di daftar (status Menunggu Pengirim)
- [ ] Klik "Ambil Pekerjaan" → konfirmasi modal
- [ ] Verifikasi: pesanan hilang dari daftar available jobs
- [ ] Buka `/driver/jobs/active` → verifikasi pesanan ada di sini
- [ ] Verifikasi: di sisi buyer (`/buyer/orders/:id`), status berubah ke "Sedang Dikirim"

### 5.3 Race Condition Test (opsional, butuh dua driver)
- [ ] Login dua akun driver di dua browser/incognito
- [ ] Keduanya lihat pekerjaan yang sama
- [ ] Klik "Ambil Pekerjaan" hampir bersamaan
- [ ] Verifikasi: hanya satu yang berhasil, satu lagi dapat error 409

### 5.4 Konfirmasi Selesai
- [ ] Di halaman `/driver/jobs/active`
- [ ] Klik "Konfirmasi Selesai"
- [ ] Verifikasi: pesanan pindah ke `/driver/jobs/history`
- [ ] Buka `/driver/earnings` → verifikasi pendapatan tercatat (80% dari ongkir)
- [ ] Verifikasi di sisi buyer: status pesanan "Pesanan Selesai"

---

## Skenario 6: Admin Flow

**Akun:** admin@seapedia.com / Admin@123

### 6.1 Login Admin
- [ ] Login admin → langsung ke `/admin/dashboard` (tidak ada role selection)
- [ ] Verifikasi: semua stat card menampilkan angka real

### 6.2 Buat Voucher
- [ ] Buka `/admin/vouchers` → klik "+ Buat Voucher"
- [ ] Isi form:
  - Kode: `TESTV20`
  - Tipe: Persentase
  - Nilai: `20`
  - Maks pemakaian: `5`
  - Kadaluarsa: 30 hari dari sekarang
- [ ] Simpan
- [ ] Verifikasi: voucher muncul di daftar
- [ ] Test: gunakan kode `TESTV20` saat checkout (buka tab buyer)

### 6.3 Buat Promo
- [ ] Buka `/admin/promos` → buat promo:
  - Kode: `TESTPROMO`
  - Nama: `Test Promo`
  - Tipe: Fixed
  - Nilai: `25000`
  - Kadaluarsa: 30 hari
- [ ] Verifikasi: bisa digunakan saat checkout (tanpa limit pemakaian)

### 6.4 Simulasi Hari Berikutnya & Overdue
- [ ] Buat pesanan baru sebagai buyer yang akan expire (perlu setup khusus):
  ```
  Cara termudah: buat pesanan, lalu klik "Simulasi Hari Berikutnya"
  sebanyak SLA hari (mis. Regular = 3x klik) tanpa diproses seller.
  ```
- [ ] Klik "Simulasi Hari Berikutnya" 3x (untuk Regular delivery)
- [ ] Verifikasi: pesanan dengan status "Sedang Dikemas" melewati SLA → auto "Dikembalikan"
- [ ] Verifikasi di `/admin/overdue` → pesanan muncul
- [ ] Verifikasi di sisi buyer: saldo dompet bertambah (refund)
- [ ] Verifikasi: stok produk pulih

---

## Skenario 7: Security Tests

### 7.1 SQL Injection Test
Test via Swagger atau curl:

```bash
# Search parameter injection attempt
curl "http://localhost:3001/api/products?search='; DROP TABLE users; --"
# Expected: normal empty/no results response, NOT an error about SQL

# Login dengan SQL injection
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@seapedia.com'\'' OR 1=1--", "password": "anything"}'
# Expected: 401 Unauthorized (tidak bisa bypass)
```

### 7.2 Unauthorized Access Test
```bash
# Akses endpoint buyer tanpa token
curl http://localhost:3001/api/buyer/wallet
# Expected: 401 Unauthorized

# Akses endpoint admin dengan token buyer
# (gunakan access token dari login buyer)
curl -H "Authorization: Bearer BUYER_TOKEN" http://localhost:3001/api/admin/dashboard/stats
# Expected: 403 Forbidden

# Akses produk seller lain
# (gunakan token seller1, coba edit produk milik seller lain)
curl -X PUT -H "Authorization: Bearer SELLER1_TOKEN" \
  http://localhost:3001/api/seller/products/PRODUCT_FROM_OTHER_SELLER \
  -d '{"price": 1}'
# Expected: 403 Forbidden
```

### 7.3 Input Validation Test
```bash
# Rating di luar range
curl -X POST http://localhost:3001/api/reviews \
  -H "Content-Type: application/json" \
  -d '{"reviewer_name": "Test", "rating": 6, "comment": "test"}'
# Expected: 400 dengan error "rating must be between 1 and 5"

# Harga negatif
curl -X POST http://localhost:3001/api/seller/products \
  -H "Authorization: Bearer SELLER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "price": -1000, "stock": 10}'
# Expected: 400 dengan error validasi harga
```

### 7.4 Checkout Atomic Test
```bash
# Coba checkout dengan saldo tidak cukup
# Set saldo buyer ke Rp 1.000 via Prisma Studio
# lalu checkout produk senilai Rp 500.000
# Expected: 400 "Insufficient wallet balance"
# Verifikasi: stok produk TIDAK berkurang (rollback terjadi)
```

### 7.5 Expired Token Test
```bash
# Gunakan access token yang sudah expired (tunggu >15 menit)
curl -H "Authorization: Bearer EXPIRED_TOKEN" http://localhost:3001/api/buyer/wallet
# Expected: 401 "Invalid or expired token"

# Gunakan refresh endpoint untuk dapat token baru
curl -X POST http://localhost:3001/api/auth/refresh \
  -b "seapedia_refresh_token=VALID_REFRESH_TOKEN"
# Expected: 200 dengan access_token baru
```

---

## Checklist Final Sebelum Submit

### Backend
- [ ] Semua endpoint level 1-7 berjalan
- [ ] Swagger UI menampilkan semua endpoint dengan dokumentasi lengkap
- [ ] Seed data berjalan tanpa error (`npx prisma db seed`)
- [ ] Semua business rule dicek (single-store, price formula, driver earning)
- [ ] Security tests lulus (XSS, SQLi, RBAC)

### Frontend
- [ ] Semua halaman/role dapat diakses
- [ ] Role selection muncul untuk multi-role user
- [ ] Checkout menampilkan breakdown harga yang benar
- [ ] Order status timeline tampil dengan benar
- [ ] Responsive di mobile (375px) dan desktop (1280px)
- [ ] Loading state dan empty state ada di semua halaman

### Dokumentasi
- [ ] README.md lengkap dan akurat
- [ ] Semua env variable terdokumentasi
- [ ] Demo accounts terdaftar di README
- [ ] Business rules terdokumentasi di README
- [ ] Swagger UI bisa diakses di URL publik

### Deployment
- [ ] Frontend live di Vercel
- [ ] Backend live di Render
- [ ] Database sudah di-seed di production
- [ ] Test semua flow di environment production (bukan localhost)
