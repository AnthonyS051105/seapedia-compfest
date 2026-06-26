# SEAPEDIA — Design System
> Version 2.0 — Stripe × Linear Synthesis
> Every decision here has a reference. Claude Code MUST read this before touching any file.

---

## The Reference DNA

**Stripe (PRIMARY):** Bold gradient heroes, bento grid feature cards, large stat numbers, infinite marquee trust bars, alternating dark/light sections, sticky blur navbar, dual CTAs, section eyebrow labels.

**Linear (SECONDARY):** Real UI mockups in hero (not illustrations), numbered feature sections, near-black dark sections for impact, extremely tight typography, dense information hierarchy, changelog-style lists.

**What SEAPEDIA inherits from both:**
- Bento grid layouts (Stripe) + real app UI mockups inside cards (Linear)
- Large stat numbers (Stripe) + numbered section headers (Linear)
- Gradient accent moments (Stripe) + dark section contrast (Linear)
- Dual CTA buttons (Stripe) + tight information density (Linear)

**What makes SEAPEDIA its own:**
- Teal energy instead of Stripe's purple — immediately different
- Indonesian copy voice — specific and human, not corporate-English translated
- Marketplace-context content — products, sellers, orders, not APIs and billing

---

## Color System

```css
/* globals.css — Tailwind v4 @theme block */
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');

@theme {
  /* Brand — Teal, not blue */
  --color-brand-50:  #E0FAF7;
  --color-brand-100: #B3F3EC;
  --color-brand-200: #7DEADE;
  --color-brand-400: #2DD4C4;
  --color-brand-500: #00BFA8;   /* PRIMARY — all main CTAs */
  --color-brand-600: #00A391;
  --color-brand-700: #007D70;
  --color-brand-800: #005A50;
  --color-brand-900: #003D37;

  /* Accent amber — star ratings, promo badges, warnings */
  --color-accent-300: #FDE68A;
  --color-accent-400: #FBBF24;
  --color-accent-500: #F59E0B;

  /* Semantic */
  --color-success-50:  #ECFDF5;
  --color-success-500: #10B981;
  --color-success-700: #047857;
  --color-danger-50:   #FEF2F2;
  --color-danger-500:  #EF4444;
  --color-danger-700:  #B91C1C;

  /* Neutrals — warm zinc, not cool gray */
  --color-zinc-950: #09090B;    /* Near black for dark sections bg */
  --color-zinc-900: #18181B;    /* Dark section text bg */
  --color-zinc-800: #27272A;    /* Dark border, subtle dividers */
  --color-zinc-700: #3F3F46;    /* Body text */
  --color-zinc-600: #52525B;    /* Secondary text */
  --color-zinc-500: #71717A;    /* Placeholder, muted */
  --color-zinc-400: #A1A1AA;    /* Disabled states */
  --color-zinc-300: #D4D4D8;    /* Borders */
  --color-zinc-200: #E4E4E7;    /* Subtle borders */
  --color-zinc-100: #F4F4F5;    /* Card bg tint */
  --color-zinc-50:  #FAFAFA;    /* Page background */

  /* Surface */
  --color-surface:  #FFFFFF;
  --color-surface-raised: #FFFFFF;

  /* Font families */
  --font-family-display: 'Plus Jakarta Sans', sans-serif;
  --font-family-body: 'Inter', sans-serif;

  /* Border radius */
  --radius-xs:   4px;
  --radius-sm:   6px;
  --radius-md:   8px;
  --radius-lg:  12px;
  --radius-xl:  16px;
  --radius-2xl: 24px;
  --radius-full: 9999px;
}

/* Base styles */
*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  font-family: var(--font-family-body, 'Inter', sans-serif);
  color: #3F3F46;
  background: #FAFAFA;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-family-display, 'Plus Jakarta Sans', sans-serif);
  font-weight: 700;
  color: #09090B;
  letter-spacing: -0.02em;
}

/* CSS shadows (can't go in @theme) */
:root {
  --shadow-xs:    0 1px 2px 0 rgb(0 0 0 / 0.04);
  --shadow-sm:    0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.05);
  --shadow-md:    0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.04);
  --shadow-lg:    0 10px 15px -3px rgb(0 0 0 / 0.07), 0 4px 6px -4px rgb(0 0 0 / 0.04);
  --shadow-xl:    0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.04);
  --shadow-brand: 0 4px 20px 0 rgb(0 191 168 / 0.3);
  --shadow-card:  0 0 0 1px rgb(0 0 0 / 0.05), 0 2px 8px 0 rgb(0 0 0 / 0.06);
}

/* Page container */
.container-page {
  max-width: 1200px;
  margin: 0 auto;
  padding-left: 24px;
  padding-right: 24px;
}
@media (min-width: 768px) {
  .container-page { padding-left: 40px; padding-right: 40px; }
}
```

---

## Typography

**Display font:** Plus Jakarta Sans — Indonesian-made, strong personality at 700–800, not yet everywhere (bukan Poppins/DM Sans yang sudah mainstream).
**Body font:** Inter — optimal readability di bawah 16px, standard industri UI.

```
Hero/Display:  font-display text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]
H1 (Page):     font-display text-4xl font-bold tracking-tight leading-[1.15]
H2 (Section):  font-display text-3xl font-bold tracking-tight
H3 (Sub):      font-display text-xl font-semibold
H4 (Card):     font-display text-base font-semibold
Eyebrow:       font-body text-xs font-semibold uppercase tracking-[0.1em] text-brand-600
Body Large:    font-body text-base leading-7 text-zinc-700
Body:          font-body text-sm leading-6 text-zinc-700
Caption:       font-body text-xs leading-5 text-zinc-500
Stat Number:   font-display text-5xl font-extrabold tracking-tight text-zinc-950
Stat Label:    font-body text-sm text-zinc-500
Code/Mono:     font-mono text-sm
```

**Stripe-inspired rule:** Semua eyebrow labels (teks kecil di atas judul section) pakai format ini:
```jsx
<p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-600 mb-3">
  Untuk Semua Kalangan
</p>
```

---

## Spacing & Layout

Grid: 8px base unit.
```
4    — gap dalam satu komponen (icon + teks)
8    — padding internal kecil, gap antar tag
12   — padding kecil komponen
16   — padding standar, gap antar elemen dalam card
20   — padding medium card
24   — gap antar card, padding card standar
32   — padding section kecil, gap antar row
48   — section padding vertical (mobile)
64   — section padding vertical (desktop kecil)
80   — section padding vertical (desktop besar)
96   — hero padding vertical
```

---

## Section Anatomy (Stripe Pattern)

Setiap halaman publik terdiri dari sections dengan **alternating rhythm**:

```
[Hero]         — white bg, gradient accent, full-height impact
[Trust Bar]    — white bg, infinite marquee/logo strip
[Bento Grid]   — white bg, asymmetric feature cards
[Stats]        — dark bg (zinc-950), large numbers, high contrast  ← Linear influence
[Feature 1]    — white bg, 2-col (text left, mockup right)
[Feature 2]    — light zinc-50 bg, 2-col (mockup left, text right)
[Testimonials] — white bg, horizontal quote strip
[CTA]          — brand-500 bg, single focused call to action
[Footer]       — zinc-950 bg, 5-col grid                          ← Linear influence
```

**Rule:** Jangan 3 section putih berturut-turut. Pasti ada section gelap atau tinted di antaranya.

---

## Hero Section (Stripe-Inspired)

**Stripe's hero DNA yang kita ambil:**
- Gradient accent yang bold di background (bukan flat color)
- Tagline yang sangat spesifik dan action-driven (bukan generic "platform terpercaya")
- Dual CTA: Primary (filled) + Secondary (ghost/outline)
- Trust signal langsung di bawah CTA: "Dipercaya oleh X penjual"
- Social proof bar (logo/brand marquee)

**SEAPEDIA hero implementation:**

```jsx
// Gradient: mulai dari zinc-50 (atas), ada accent teal yang subtle di kiri
// Background decoration: blurred circle gradients (seperti Stripe's wave)
<section className="relative overflow-hidden bg-zinc-50 pt-24 pb-20">
  {/* Gradient decoration — Stripe-style blurred blobs */}
  <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-400/20 rounded-full blur-3xl" />
  <div className="absolute -top-20 right-0 w-80 h-80 bg-accent-300/15 rounded-full blur-3xl" />
  
  <div className="container-page relative">
    {/* Eyebrow label */}
    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-600 mb-5">
      Marketplace Multi-Role · Indonesia
    </p>
    
    {/* Headline — spesifik, bukan generic */}
    <h1 className="font-display text-5xl lg:text-[64px] font-extrabold tracking-tight leading-[1.08] text-zinc-950 max-w-3xl mb-6">
      Belanja, jual, antar.<br />
      <span className="text-brand-500">Semua dalam satu platform.</span>
    </h1>
    
    {/* Subtitle — concrete, bukan fluffy */}
    <p className="text-lg text-zinc-600 max-w-xl mb-8 leading-relaxed">
      Dari pembeli hingga penjual, dari kurir hingga admin — 
      SEAPEDIA menghubungkan semua peran dalam satu ekosistem marketplace yang nyata.
    </p>
    
    {/* Dual CTA — Stripe pattern */}
    <div className="flex items-center gap-3 flex-wrap">
      <Button size="lg" variant="primary">Mulai Belanja</Button>
      <Button size="lg" variant="outline">Jadi Penjual</Button>
    </div>
    
    {/* Trust signal */}
    <p className="text-sm text-zinc-400 mt-5">
      Demo: seller@seapedia.com · buyer@seapedia.com · admin@seapedia.com
    </p>
  </div>
</section>
```

---

## Bento Grid (Stripe's Feature Cards Pattern)

Stripe menggunakan **asymmetric bento grid** untuk menampilkan fitur — card berbeda ukuran, bukan grid seragam. Ini adalah signature visual paling kuat dari Stripe.

**SEAPEDIA Bento:** Tampilkan 4 peran dalam bento grid:

```
┌─────────────────────┬──────────────┐
│                     │              │
│  BUYER  (wide)      │  SELLER      │
│  2/3 width          │  1/3 width   │
│                     │              │
├────────────┬────────┴──────────────┤
│            │                       │
│  DRIVER    │  ADMIN  (wide)        │
│  1/3 width │  2/3 width            │
│            │                       │
└────────────┴───────────────────────┘
```

Setiap card bento:
- Header: Role name + icon (lucide)
- Real UI mockup (screenshot style, bukan ilustrasi) — gunakan div yang menyerupai UI actual
- 2-3 bullet fitur utama
- Link "Coba sebagai [role]"
- Background card: gradient subtle dari white ke zinc-50

---

## Stats Section (Stripe Numbers + Linear Dark)

Ambil pattern stat dari Stripe (angka besar) tapi dengan dark background dari Linear:

```jsx
<section className="bg-zinc-950 py-20">
  <div className="container-page">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
      {[
        { number: "4", label: "Peran pengguna", sub: "Buyer, Seller, Driver, Admin" },
        { number: "7", label: "Level fitur", sub: "Dari auth hingga keamanan" },
        { number: "100%", label: "TypeScript", sub: "Frontend & backend" },
        { number: "12%", label: "PPN terkalkulasi", sub: "Otomatis di setiap checkout" },
      ].map(stat => (
        <div key={stat.number}>
          <p className="font-display text-5xl font-extrabold text-white mb-2">{stat.number}</p>
          <p className="text-sm font-semibold text-zinc-300 mb-1">{stat.label}</p>
          <p className="text-xs text-zinc-500">{stat.sub}</p>
        </div>
      ))}
    </div>
  </div>
</section>
```

---

## Infinite Marquee / Trust Bar (Stripe Pattern)

Stripe pakai infinite horizontal scroll untuk logo-logo customer. SEAPEDIA pakai untuk feature list atau "powered by" tech stack:

```jsx
// CSS animation untuk infinite scroll
// @keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
// .animate-marquee { animation: marquee 20s linear infinite; }

<section className="py-8 border-y border-zinc-200 overflow-hidden bg-white">
  <div className="flex">
    <div className="flex items-center gap-16 animate-marquee whitespace-nowrap">
      {/* Duplikat 2x untuk seamless loop */}
      {features.concat(features).map((f, i) => (
        <span key={i} className="flex items-center gap-2 text-sm font-medium text-zinc-500">
          <f.icon className="w-4 h-4 text-brand-500" />
          {f.label}
        </span>
      ))}
    </div>
  </div>
</section>
```

---

## Navbar (Stripe DNA)

```jsx
// Sticky, blur backdrop, border muncul saat scroll
<nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-transparent
                data-[scrolled=true]:border-zinc-200 transition-all duration-200">
  <div className="container-page flex items-center h-16 gap-8">
    {/* Logo */}
    <a href="/" className="font-display font-bold text-xl shrink-0">
      <span className="text-brand-500">SEA</span>
      <span className="text-zinc-950">PEDIA</span>
    </a>
    
    {/* Nav links (desktop) */}
    <div className="hidden md:flex items-center gap-1 flex-1">
      <NavLink href="/products">Produk</NavLink>
      <NavLink href="/stores">Toko</NavLink>
    </div>
    
    {/* Right side */}
    <div className="flex items-center gap-3 ml-auto">
      {/* Cart badge — brand, bukan merah */}
      <button className="relative p-2 text-zinc-600 hover:text-zinc-950 transition-colors">
        <ShoppingBag className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-brand-500 
                           text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {count}
          </span>
        )}
      </button>
      
      {/* User menu or auth buttons */}
      {isAuth ? <UserMenu /> : (
        <>
          <Button variant="ghost" size="sm" href="/auth/login">Masuk</Button>
          <Button variant="primary" size="sm" href="/auth/register">Daftar</Button>
        </>
      )}
    </div>
  </div>
</nav>
```

---

## Dark Section Pattern (Linear DNA)

Linear menggunakan `#08090a` untuk background gelap yang ekstrem. Kita pakai `zinc-950` yang setara:

```jsx
// Dark sections: bg-zinc-950, semua text putih, border zinc-800
// Gunakan untuk: Stats, dark CTA, featured highlights
<section className="bg-zinc-950 text-white">
  <div className="container-page py-20">
    {/* Eyebrow dalam dark section */}
    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-400 mb-4">
      Label Section
    </p>
    <h2 className="font-display text-4xl font-bold text-white mb-4">
      Judul Section
    </h2>
    <p className="text-zinc-400 text-lg max-w-xl">
      Deskripsi section
    </p>
  </div>
</section>
```

---

## Feature Sections (Alternating 2-Col)

Stripe menggunakan alternating left/right untuk feature sections. Setiap section: satu sisi teks, satu sisi UI mockup.

```jsx
// Feature section dengan real UI mockup — Linear style
<section className="py-20 bg-white">
  <div className="container-page">
    <div className="grid lg:grid-cols-2 gap-16 items-center">
      {/* Text side */}
      <div>
        <p className="eyebrow mb-4">Fitur Buyer</p>
        <h2 className="font-display text-3xl font-bold text-zinc-950 mb-4">
          Checkout yang transparan dan adil
        </h2>
        <p className="text-zinc-600 text-base leading-relaxed mb-6">
          Lihat breakdown harga lengkap sebelum bayar: subtotal, diskon, ongkir, 
          dan PPN 12% — semua terhitung otomatis.
        </p>
        <ul className="space-y-3">
          {features.map(f => (
            <li className="flex items-start gap-3 text-sm text-zinc-700">
              <CheckCircle className="w-5 h-5 text-brand-500 shrink-0 mt-0.5" />
              {f}
            </li>
          ))}
        </ul>
      </div>
      
      {/* UI Mockup side — BUKAN gambar stock atau ilustrasi */}
      {/* Gunakan div HTML yang menyerupai actual UI component */}
      <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-4 shadow-lg">
        <CheckoutMockup /> {/* Actual checkout UI mini */}
      </div>
    </div>
  </div>
</section>
```

---

## Numbered Section Headers (Linear DNA)

Linear menggunakan `1.0 Intake`, `2.0 Plan`, `3.0 Build` — numbered section anchors yang navigable.
SEAPEDIA pakai ini untuk halaman marketing role-specific:

```jsx
<div className="flex items-baseline gap-3 mb-8">
  <span className="font-display text-sm font-bold text-brand-500 tabular-nums">01</span>
  <div className="h-px flex-1 bg-zinc-200 max-w-[40px]" />
  <h2 className="font-display text-2xl font-bold text-zinc-950">Keranjang Belanja</h2>
</div>
```

---

## UI Mockup Cards (Linear Hero Pattern)

Linear menampilkan UI asli mereka di hero — **bukan screenshot, tapi styled divs yang terasa seperti screenshot**. Ini yang membedakan dari generik.

Untuk SEAPEDIA, buat mini mockup dari fitur utama sebagai "live preview":

```jsx
// Mini checkout summary mockup — dipakai di feature sections dan bento grid
function CheckoutMockupCard() {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-md overflow-hidden text-left">
      {/* Header bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100 bg-zinc-50">
        <div className="w-2 h-2 rounded-full bg-zinc-300" />
        <div className="w-2 h-2 rounded-full bg-zinc-300" />
        <div className="w-2 h-2 rounded-full bg-zinc-300" />
        <span className="text-[10px] text-zinc-400 ml-2">seapedia.com/checkout</span>
      </div>
      {/* Content */}
      <div className="p-4 space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">Subtotal</span>
          <span className="text-zinc-700 font-medium">Rp 450.000</span>
        </div>
        <div className="flex justify-between text-xs text-success-600">
          <span>Diskon HEMAT10</span>
          <span>-Rp 45.000</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">Ongkir (Regular)</span>
          <span className="text-zinc-700 font-medium">Rp 6.000</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">PPN 12%</span>
          <span className="text-zinc-700 font-medium">Rp 49.320</span>
        </div>
        <div className="h-px bg-zinc-100 my-1" />
        <div className="flex justify-between text-sm font-bold">
          <span className="text-zinc-950">Total</span>
          <span className="text-zinc-950">Rp 460.320</span>
        </div>
        <button className="w-full mt-2 bg-brand-500 text-white text-xs font-semibold py-2 rounded-lg">
          Konfirmasi Pesanan
        </button>
      </div>
    </div>
  )
}
```

---

## Component Patterns

### Button

```
Primary: bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-semibold
         shadow-sm hover:shadow-brand transition-all duration-150
         
Ghost:   text-brand-600 hover:bg-brand-50 rounded-lg font-medium

Outline: border border-zinc-300 text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50
         rounded-lg font-medium bg-white

Dark outline (dalam dark section):
         border border-zinc-700 text-white hover:border-zinc-500 hover:bg-zinc-800
         
Danger:  bg-danger-500 hover:bg-danger-700 text-white rounded-lg

Sizes:
  sm: px-3 py-1.5 text-xs
  md: px-4 py-2 text-sm       ← default
  lg: px-5 py-2.5 text-base

Loading: Spinner inline (white on dark bg), pertahankan width
```

### Input

```
Base:    border-[1.5px] border-zinc-300 rounded-lg px-3 py-2 text-sm
         bg-white text-zinc-900 placeholder:text-zinc-400
         
Focus:   border-brand-500 ring-2 ring-brand-500/15 outline-none
Error:   border-danger-500 ring-2 ring-danger-500/15
Success: border-success-500 ring-2 ring-success-500/15

Label:   text-sm font-medium text-zinc-700 mb-1.5 block
Error msg: text-xs text-danger-600 mt-1
Helper:  text-xs text-zinc-500 mt-1
```

### Card

```
Default:  bg-white border border-zinc-200 rounded-xl shadow-card
Interactive: + hover:border-zinc-300 hover:shadow-md transition-all duration-150
Elevated: bg-white rounded-2xl shadow-xl border border-zinc-100
Dark:     bg-zinc-900 border border-zinc-800 rounded-xl
```

### Status Badges (Order)

```
SEDANG_DIKEMAS:    bg-amber-50 text-amber-700 border border-amber-200 rounded-full
MENUNGGU_PENGIRIM: bg-blue-50 text-blue-700 border border-blue-200 rounded-full  
SEDANG_DIKIRIM:    bg-brand-50 text-brand-700 border border-brand-200 rounded-full
PESANAN_SELESAI:   bg-success-50 text-success-700 border border-green-200 rounded-full
DIKEMBALIKAN:      bg-danger-50 text-danger-700 border border-red-200 rounded-full

All: px-2.5 py-0.5 text-xs font-semibold
```

### Sidebar (Dashboard)

```
Width: 240px desktop, collapse to icon-only (w-16) pada mobile
Bg: bg-white border-r border-zinc-200

Nav item default: px-3 py-2 rounded-lg text-sm text-zinc-600 hover:bg-zinc-100 
                  hover:text-zinc-900 transition-colors flex items-center gap-3

Nav item active:  px-3 py-2 rounded-lg text-sm font-semibold
                  bg-brand-50 text-brand-700
                  [relative] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2
                  before:w-0.5 before:h-4 before:bg-brand-500 before:rounded-full

Section label:    text-[10px] font-semibold uppercase tracking-wider text-zinc-400
                  px-3 py-2 mb-1 mt-4
```

---

## Animation & Interaction

### Prinsip animasi (dari kedua referensi):

**Stripe pakai:** Subtle reveal animations saat scroll, hover gradient shifts, smooth state transitions.
**Linear pakai:** Minimal animation, hanya di hero (floating mockup), sisanya snappy dan langsung.

**SEAPEDIA rule:** Animate to communicate, not to decorate.

```css
/* globals.css — keyframes */

/* Infinite marquee (trust bar) */
@keyframes marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
.animate-marquee { animation: marquee 25s linear infinite; }
.animate-marquee:hover { animation-play-state: paused; }

/* Subtle float (hero mockup) */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-8px); }
}
.animate-float { animation: float 6s ease-in-out infinite; }

/* Fade up (scroll reveal) */
@keyframes fade-up {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-fade-up { animation: fade-up 0.5s ease-out forwards; }

/* Reduced motion — WAJIB */
@media (prefers-reduced-motion: reduce) {
  .animate-marquee,
  .animate-float,
  .animate-fade-up { animation: none; }
}
```

### Hover micro-interactions (Stripe-level polish):

```css
/* Card lift */
.card-interactive {
  transition: transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease;
}
.card-interactive:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* Button press */
button:active { transform: scale(0.98); }

/* Link underline — dari teks, bukan dari kotak */
.link-underline {
  background: linear-gradient(currentColor, currentColor) no-repeat left bottom;
  background-size: 0% 1px;
  transition: background-size 200ms ease;
}
.link-underline:hover { background-size: 100% 1px; }
```

---

## Dark / Light Section Contrast Table

| Section | Background | Text | Border | Notes |
|---------|-----------|------|--------|-------|
| Hero | `zinc-50` + blobs | `zinc-950` | — | Gradient decoration blobs |
| Trust Bar | `white` | `zinc-500` | `zinc-200` top+bottom | Marquee |
| Bento Grid | `white` | `zinc-950` | `zinc-200` | Alternating card heights |
| Stats | `zinc-950` | `white` | `zinc-800` | Dark section — Linear DNA |
| Feature Alt 1 | `white` | `zinc-950` | — | Mockup kanan |
| Feature Alt 2 | `zinc-50` | `zinc-950` | — | Mockup kiri |
| Testimonials | `white` | `zinc-950` | `zinc-100` | Quote cards |
| CTA | `brand-500` | `white` | — | Single focused action |
| Footer | `zinc-950` | `zinc-400` | `zinc-800` | Dense 5-col grid |

---

## 7 Aturan Anti-Slop (Hard Rules)

1. **Tidak ada Poppins, Nunito, DM Sans.** Plus Jakarta Sans untuk display, Inter untuk body. Titik.

2. **Tidak ada gradient rainbow.** Hanya satu gradient blob di hero (teal/amber, bukan merah-kuning-hijau).

3. **Tidak ada hero dengan centered text + stock photo.** Left-aligned hero dengan dual CTA pattern.

4. **Tidak ada card grid yang perfectly symmetric everywhere.** Landing page harus punya minimal satu bento asymmetric grid.

5. **Primary color bukan #3B82F6 (blue-500).** Teal #00BFA8 — satu keputusan visual yang langsung identifiable.

6. **Tidak ada icon dekoratif yang tidak menjelaskan apa-apa.** Icon hanya jika membantu pemahaman, bukan filler.

7. **Empty states tidak punya SVG ilustrasi generic.** Text yang actionable + satu icon sederhana, cukup.

---

## Fungsionalitas TIDAK BOLEH DISENTUH

Redesign hanya menyentuh:
- `className` props dan CSS dalam `globals.css`
- Struktur JSX visual (wrapper divs, layout grids)
- Font imports
- Animasi dan transitions

Yang TIDAK BOLEH diubah:
- Semua API calls (`api.get`, `api.post`, dll)
- Event handlers (`onClick`, `onChange`, `onSubmit`)
- Form logic dan validation
- Zustand store logic
- Custom hooks
- Next.js routing (`router.push`, `redirect`, dll)
- Props yang diteruskan ke komponen utility

Setelah setiap file: `npx tsc --noEmit` — fix semua TypeScript error sebelum lanjut.

