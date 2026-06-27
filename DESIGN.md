# SEAPEDIA — Design System
> Version 3.0 — Stripe × Linear, Dual Mode
> Every decision here has a reference. Claude Code MUST read this before touching any file.

---

## The Reference DNA

**Stripe (PRIMARY):** Restrained light-mode base, bold but controlled headline type, bento grid feature cards, large stat numbers, customer-logo marquee, sticky blur navbar, dual CTAs, content-first hierarchy over decoration, subtle hover lift instead of flashy motion.

**Linear (SECONDARY):** Dark mode done right (near-black `#08090a`-equivalent, not gray-800), real product UI in the hero instead of illustrations, extremely tight type, dense but breathable information hierarchy, snappy not decorative motion.

**What SEAPEDIA inherits from both:**
- Light-mode-first marketing language (Stripe) with a genuinely usable, equally considered dark mode (Linear) — not dark-as-an-afterthought.
- Bento grid layouts (Stripe) with real app UI mockups inside cards (Linear).
- Large stat numbers (Stripe) with the kind of high-contrast dark backdrop Linear uses for impact moments.
- Calm, content-first motion: hover lift, scroll reveal, marquee. Nothing decorative for its own sake.

**What makes SEAPEDIA its own:**
- Teal accent instead of Stripe's blue/violet and Linear's cyan — immediately distinct.
- Indonesian copy voice that reads like an actual consumer marketplace (Tokopedia/Shopee-adjacent), not a hackathon submission page.
- Marketplace-context content: products, sellers, orders, delivery — not APIs and billing.

---

## Dual-Mode Strategy

The page supports **light and dark mode**, switchable by the user, persisted across visits. This is not a "dark section for contrast" trick — it is a complete second theme.

- **Strategy:** Tailwind v4 `dark:` variant, gated by a `class="dark"` on `<html>` (not `prefers-color-scheme` alone, since the user can override it).
- **State:** a small Zustand store (`store/theme.store.ts`) holds `theme: 'light' | 'dark'`, persisted to `localStorage` via Zustand's `persist` middleware (already a project dependency, no new packages).
- **Toggle:** lives in the Navbar (desktop and mobile menu), a simple icon button (Sun/Moon), not a decorative switch.
- **No flash-of-wrong-theme:** an inline script in `app/layout.tsx` reads `localStorage` before paint and sets the `dark` class synchronously, so there's no light-mode flash on a dark-mode visit.
- **Token rule:** every color utility in every component must have a `dark:` counterpart. A component is not done until it has been looked at in both modes.

---

## Color System

```css
/* globals.css — Tailwind v4 @theme block */
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');

@custom-variant dark (&:where(.dark, .dark *));

@theme {
  /* Brand — Teal, not blue */
  --color-brand-50:  #E0FAF7;
  --color-brand-100: #B3F3EC;
  --color-brand-200: #7DEADE;
  --color-brand-400: #2DD4C4;
  --color-brand-500: #00BFA8;   /* PRIMARY — all main CTAs, identical in both modes */
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

  /* Neutrals — warm zinc, not cool gray. Used for BOTH modes: */
  /* light mode reads top-down (950 = text, 50 = bg) */
  /* dark mode reads bottom-up (50 = text, 950 = bg) */
  --color-zinc-950: #09090B;
  --color-zinc-900: #18181B;
  --color-zinc-800: #27272A;
  --color-zinc-700: #3F3F46;
  --color-zinc-600: #52525B;
  --color-zinc-500: #71717A;
  --color-zinc-400: #A1A1AA;
  --color-zinc-300: #D4D4D8;
  --color-zinc-200: #E4E4E7;
  --color-zinc-100: #F4F4F5;
  --color-zinc-50:  #FAFAFA;

  /* Surface */
  --color-surface: #FFFFFF;
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
  transition: background-color 200ms ease, color 200ms ease;
}
.dark body {
  color: #E4E4E7;       /* zinc-200 */
  background: #09090B;  /* zinc-950 — true Linear-style near-black */
}
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-family-display, 'Plus Jakarta Sans', sans-serif);
  font-weight: 700;
  color: #09090B;
  letter-spacing: -0.02em;
}
.dark h1, .dark h2, .dark h3, .dark h4, .dark h5, .dark h6 {
  color: #FAFAFA;
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
.dark {
  --shadow-xs:    0 1px 2px 0 rgb(0 0 0 / 0.4);
  --shadow-sm:    0 1px 3px 0 rgb(0 0 0 / 0.5), 0 1px 2px -1px rgb(0 0 0 / 0.4);
  --shadow-md:    0 4px 6px -1px rgb(0 0 0 / 0.5), 0 2px 4px -2px rgb(0 0 0 / 0.4);
  --shadow-lg:    0 10px 15px -3px rgb(0 0 0 / 0.5), 0 4px 6px -4px rgb(0 0 0 / 0.4);
  --shadow-xl:    0 20px 25px -5px rgb(0 0 0 / 0.6), 0 8px 10px -6px rgb(0 0 0 / 0.4);
  --shadow-brand: 0 4px 24px 0 rgb(0 191 168 / 0.25);
  --shadow-card:  0 0 0 1px rgb(255 255 255 / 0.06), 0 2px 8px 0 rgb(0 0 0 / 0.5);
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

**Dark mode mapping cheat sheet** (apply consistently across every component):

| Light | Dark | Used for |
|---|---|---|
| `bg-white` | `dark:bg-zinc-900` | Cards, panels, modals |
| `bg-zinc-50` | `dark:bg-zinc-950` | Page background, subtle section tint |
| `border-zinc-200` | `dark:border-zinc-800` | Card/input borders |
| `text-zinc-950` | `dark:text-zinc-50` | Headings |
| `text-zinc-600` / `700` | `dark:text-zinc-400` | Body text |
| `text-zinc-500` | `dark:text-zinc-500` | Muted/caption (stays same, already neutral enough) |
| `bg-zinc-100` (hover) | `dark:bg-zinc-800` | Hover backgrounds |
| `bg-zinc-950` (existing dark sections, e.g. Stats) | `dark:bg-black/40` or stays `bg-zinc-950` | These sections were already dark; in dark mode they blend into the page rather than standing out |
| `--color-brand-500` | unchanged | Brand teal works identically in both modes |

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
Eyebrow:       font-body text-xs font-semibold uppercase tracking-[0.1em] text-brand-600 dark:text-brand-400
Body Large:    font-body text-base leading-7 text-zinc-700 dark:text-zinc-300
Body:          font-body text-sm leading-6 text-zinc-700 dark:text-zinc-300
Caption:       font-body text-xs leading-5 text-zinc-500 dark:text-zinc-500
Stat Number:   font-display text-5xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50
Stat Label:    font-body text-sm text-zinc-500
Code/Mono:     font-mono text-sm
```

Eyebrow labels keep the same small-caps treatment in both modes, only the color value shifts:
```jsx
<p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-600 dark:text-brand-400 mb-3">
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

## Section Anatomy (Stripe Pattern, Dual-Mode)

```
[Hero]            — bg-zinc-50 dark:bg-zinc-950, gradient accent, real product mockup
[Trust Bar]       — bg-white dark:bg-zinc-900, infinite marquee
[Bento Grid]      — bg-white dark:bg-zinc-900, asymmetric feature cards
[Stats]           — bg-zinc-950 in both modes (this section IS the dark moment, Linear-style)
[Feature 1]       — bg-white dark:bg-zinc-900, 2-col (text left, mockup right)
[Feature 2]       — bg-zinc-50 dark:bg-zinc-950, 2-col (mockup left, text right)
[Reviews]         — bg-white dark:bg-zinc-900, masonry
[CTA]             — bg-brand-500 in both modes (brand color reads fine on either)
[Footer]          — bg-zinc-950 in both modes (already the darkest neutral, no change needed)
```

**Rule:** every section must define both its light and dark background. A section that "just works because dark mode inherits" is a bug, not a feature — verify explicitly.

---

## Hero Section (Stripe Light + Linear Product-in-Hero)

**What we take from each:**
- Stripe: gradient/blob decoration kept subtle, dual CTA, trust line under the fold.
- Linear: a real, working UI mockup as the visual anchor instead of an illustration or empty gradient.

```jsx
<section className="relative overflow-hidden bg-zinc-50 dark:bg-zinc-950 pt-24 pb-20 transition-colors">
  <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-400/20 dark:bg-brand-500/10 rounded-full blur-3xl" />
  <div className="absolute -top-20 right-0 w-80 h-80 bg-accent-300/15 dark:bg-accent-400/10 rounded-full blur-3xl" />

  <div className="container-page relative grid lg:grid-cols-2 gap-12 items-center">
    <div>
      <h1 className="font-display text-5xl lg:text-[60px] font-extrabold tracking-tight leading-[1.08] text-zinc-950 dark:text-zinc-50 mb-6">
        Belanja, jual, dan kirim barang dalam satu aplikasi
      </h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-xl mb-8 leading-relaxed">
        Marketplace yang menghubungkan pembeli, penjual, dan kurir secara langsung, tanpa perantara yang berlebihan.
      </p>
      <div className="flex items-center gap-3 flex-wrap">
        <Button size="lg" variant="primary">Mulai belanja</Button>
        <Button size="lg" variant="outline">Lihat cara kerja</Button>
      </div>
    </div>
    <ProductMockupCard /> {/* real mini UI, not a gradient blob */}
  </div>
</section>
```

---

## Bento Grid (Stripe's Feature Cards Pattern)

Asymmetric bento grid for the 4 roles, identical structure in both modes, only surface colors swap:

```
┌─────────────────────┬──────────────┐
│  BUYER  (wide)       │  SELLER      │
├────────────┬─────────┴──────────────┤
│  DRIVER    │  ADMIN  (wide, always dark) │
└────────────┴────────────────────────┘
```

- Light/white cards: `bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800`
- The Admin card stays near-black in both modes (`bg-zinc-950`) — it was already the "dark card" and works as-is in dark mode without modification.
- The Seller (brand-color) card stays `bg-brand-500` in both modes.

---

## Stats Section (Stripe Numbers + Linear Dark, Mode-Invariant)

This section is dark in both light and dark mode — it's the one deliberate "always dark" moment, same as Linear uses near-black throughout:

```jsx
<section className="bg-zinc-950 py-20">
  <div className="container-page grid grid-cols-2 lg:grid-cols-4 gap-12">
    {stats.map(stat => (
      <div key={stat.label}>
        <p className="font-display text-5xl font-extrabold text-white mb-2">{stat.number}</p>
        <p className="text-sm font-semibold text-zinc-300 mb-1">{stat.label}</p>
        <p className="text-xs text-zinc-500">{stat.sub}</p>
      </div>
    ))}
  </div>
</section>
```

---

## Infinite Marquee / Trust Bar (Stripe Pattern, Dual-Mode)

```jsx
<section className="py-8 border-y border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 transition-colors">
  <div className="flex">
    <div className="flex items-center gap-16 animate-marquee whitespace-nowrap">
      {features.concat(features).map((f, i) => (
        <span key={i} className="flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
          <f.icon className="w-4 h-4 text-brand-500" />
          {f.label}
        </span>
      ))}
    </div>
  </div>
</section>
```

---

## Navbar (Stripe DNA, with Theme Toggle)

```jsx
<nav className="sticky top-0 z-50 w-full bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-transparent
                data-[scrolled=true]:border-zinc-200 dark:data-[scrolled=true]:border-zinc-800 transition-all duration-200">
  <div className="container-page flex items-center h-16 gap-8">
    <a href="/" className="font-display font-bold text-xl shrink-0">
      <span className="text-brand-500">SEA</span>
      <span className="text-zinc-950 dark:text-zinc-50">PEDIA</span>
    </a>

    <div className="hidden md:flex items-center gap-1 flex-1">
      <NavLink href="/products">Produk</NavLink>
    </div>

    <div className="flex items-center gap-3 ml-auto">
      <ThemeToggle /> {/* Sun/Moon icon button, toggles Zustand theme store */}
      {/* cart, user menu, or auth buttons follow */}
    </div>
  </div>
</nav>
```

`ThemeToggle` button style: `p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg transition-colors`.

---

## Dark Section Pattern (Linear DNA)

Sections that are *always* dark (Stats, Footer) don't need a `dark:` variant since they're already at the darkest point of the neutral scale in both modes:

```jsx
<section className="bg-zinc-950 text-white">
  <div className="container-page py-20">
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

## Feature Sections (Alternating 2-Col, Dual-Mode)

```jsx
<section className="py-20 bg-white dark:bg-zinc-900 transition-colors">
  <div className="container-page">
    <div className="grid lg:grid-cols-2 gap-16 items-center">
      <div>
        <h2 className="font-display text-3xl font-bold text-zinc-950 dark:text-zinc-50 mb-4">
          Checkout yang transparan dan adil
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 text-base leading-relaxed mb-6">
          Lihat rincian harga lengkap sebelum bayar: subtotal, diskon, ongkir, dan pajak — semua terhitung otomatis.
        </p>
        <ul className="space-y-3">
          {features.map(f => (
            <li className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-2 shrink-0" />
              {f}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-lg">
        <CheckoutMockup />
      </div>
    </div>
  </div>
</section>
```

---

## UI Mockup Cards (Linear Hero Pattern, Dual-Mode)

```jsx
function CheckoutMockupCard() {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-md overflow-hidden text-left">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
        <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 ml-2">app/checkout</span>
      </div>
      <div className="p-4 space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500 dark:text-zinc-500">Subtotal</span>
          <span className="text-zinc-700 dark:text-zinc-300 font-medium">Rp 450.000</span>
        </div>
        <div className="flex justify-between text-xs text-success-600 dark:text-success-500">
          <span>Diskon HEMAT10</span>
          <span>-Rp 45.000</span>
        </div>
        <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />
        <div className="flex justify-between text-sm font-bold">
          <span className="text-zinc-950 dark:text-zinc-50">Total</span>
          <span className="text-zinc-950 dark:text-zinc-50">Rp 460.320</span>
        </div>
        <button className="w-full mt-2 bg-brand-500 text-white text-xs font-semibold py-2 rounded-lg">
          Bayar sekarang
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
         (identical in both modes — brand color carries its own contrast)

Ghost:   text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg font-medium

Outline: border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300
         hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800
         rounded-lg font-medium bg-white dark:bg-transparent

Dark outline (always-dark sections like Stats/CTA, independent of page theme):
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
Base:    border-[1.5px] border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm
         bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600

Focus:   focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 focus:outline-none
Error:   border-danger-500 ring-2 ring-danger-500/15
Success: border-success-500 ring-2 ring-success-500/15

Label:   text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block
Error msg: text-xs text-danger-600 dark:text-danger-500 mt-1
Helper:  text-xs text-zinc-500 mt-1
```

### Card

```
Default:  bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-card
Interactive: + card-interactive class
Elevated: bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-100 dark:border-zinc-800
Dark:     bg-zinc-900 border border-zinc-800 rounded-xl (already dark, unchanged in dark mode)
```

### Status Badges (Order)

```
SEDANG_DIKEMAS:    bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 rounded-full
MENUNGGU_PENGIRIM: bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 rounded-full
SEDANG_DIKIRIM:    bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 border border-brand-200 dark:border-brand-500/30 rounded-full
PESANAN_SELESAI:   bg-success-50 dark:bg-success-500/10 text-success-700 dark:text-success-400 border border-green-200 dark:border-success-500/30 rounded-full
DIKEMBALIKAN:      bg-danger-50 dark:bg-danger-500/10 text-danger-700 dark:text-danger-400 border border-red-200 dark:border-danger-500/30 rounded-full

All: px-2.5 py-0.5 text-xs font-semibold
```

### Sidebar (Dashboard)

```
Width: 240px desktop, collapse to icon-only (w-16) pada mobile
Bg: bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800

Nav item default: px-3 py-2 rounded-lg text-sm text-zinc-600 dark:text-zinc-400
                  hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100
                  transition-colors flex items-center gap-3

Nav item active:  px-3 py-2 rounded-lg text-sm font-semibold
                  bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400
                  [relative] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2
                  before:w-0.5 before:h-4 before:bg-brand-500 before:rounded-full

Section label:    text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-600
                  px-3 py-2 mb-1 mt-4
```

---

## Animation & Interaction

### Principles (from both references)

**Stripe:** subtle reveal on scroll, hover lift, smooth color/shadow transitions. Nothing loud.
**Linear:** minimal everywhere except one hero moment, otherwise snappy and immediate, no decorative looping.

**SEAPEDIA rule:** Animate to communicate, not to decorate. No new animation library — CSS keyframes, transitions, and `IntersectionObserver`-driven reveal classes only (project has no `framer-motion`/`gsap` dependency, and none should be added without explicit approval).

```css
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

/* Scroll reveal — driven by IntersectionObserver toggling a class, not scroll listeners */
.reveal {
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 600ms cubic-bezier(0.16, 1, 0.3, 1), transform 600ms cubic-bezier(0.16, 1, 0.3, 1);
}
.reveal.is-visible {
  opacity: 1;
  transform: translateY(0);
}

/* Reduced motion — WAJIB */
@media (prefers-reduced-motion: reduce) {
  .animate-marquee,
  .animate-float,
  .reveal { animation: none; transition: none; opacity: 1; transform: none; }
}
```

### Hover micro-interactions (Stripe-level polish)

```css
.card-interactive {
  transition: transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease;
}
.card-interactive:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

button:active { transform: scale(0.98); }

.link-underline {
  background: linear-gradient(currentColor, currentColor) no-repeat left bottom;
  background-size: 0% 1px;
  transition: background-size 200ms ease;
}
.link-underline:hover { background-size: 100% 1px; }
```

---

## Dark / Light Section Contrast Table

| Section | Light bg | Dark bg | Text (light/dark) | Notes |
|---------|----------|---------|--------------------|-------|
| Hero | `zinc-50` + blobs | `zinc-950` + dimmer blobs | `zinc-950` / `zinc-50` | Real product mockup, not just gradient |
| Trust Bar | `white` | `zinc-900` | `zinc-500` / `zinc-400` | Marquee, border `zinc-200`/`zinc-800` |
| Bento Grid | `white` | `zinc-900` | `zinc-950` / `zinc-50` | Admin card stays `zinc-950` always; Seller stays `brand-500` always |
| Stats | `zinc-950` always | `zinc-950` always | `white` always | The one deliberate always-dark moment |
| Feature Alt 1 | `white` | `zinc-900` | `zinc-950` / `zinc-50` | Mockup right |
| Feature Alt 2 | `zinc-50` | `zinc-950` | `zinc-950` / `zinc-50` | Mockup left |
| Reviews | `white` | `zinc-900` | `zinc-950` / `zinc-50` | Masonry cards |
| CTA | `brand-500` always | `brand-500` always | `white` always | Brand color reads fine on either page theme |
| Footer | `zinc-950` always | `zinc-950` always | `zinc-400` always | Already darkest neutral, no change needed |

---

## 7 Aturan Anti-Slop (Hard Rules)

1. **Tidak ada Poppins, Nunito, DM Sans.** Plus Jakarta Sans untuk display, Inter untuk body. Titik.
2. **Tidak ada gradient rainbow.** Hanya satu gradient blob di hero (teal/amber), redup di dark mode.
3. **Tidak ada hero dengan centered text + stock photo.** Split hero: teks di satu sisi, mockup produk nyata di sisi lain.
4. **Tidak ada card grid yang perfectly symmetric everywhere.** Bento asymmetric grid wajib ada minimal satu.
5. **Primary color bukan #3B82F6 (blue-500).** Teal #00BFA8 di kedua mode — identik, tidak berubah.
6. **Tidak ada icon dekoratif yang tidak menjelaskan apa-apa.** Icon hanya jika membantu pemahaman.
7. **Empty states tidak punya SVG ilustrasi generic.** Text actionable + satu icon sederhana.
8. **Dark mode bukan "dark section sebagai aksen."** Setiap komponen harus benar-benar dicek di kedua mode, bukan diasumsikan otomatis kontras.

---

## Fungsionalitas TIDAK BOLEH DISENTUH

Redesign hanya menyentuh:
- `className` props dan CSS dalam `globals.css`
- Struktur JSX visual (wrapper divs, layout grids)
- Font imports
- Animasi dan transitions
- Penambahan theme store/toggle (state UI murni, tidak menyentuh auth/cart/order logic)

Yang TIDAK BOLEH diubah:
- Semua API calls (`api.get`, `api.post`, dll)
- Event handlers (`onClick`, `onChange`, `onSubmit`)
- Form logic dan validation
- Zustand store logic untuk auth/cart/order (theme store baru terpisah, tidak menggantikan yang sudah ada)
- Custom hooks
- Next.js routing (`router.push`, `redirect`, dll)
- Props yang diteruskan ke komponen utility

Setelah setiap file: `npx tsc --noEmit` — fix semua TypeScript error sebelum lanjut.
