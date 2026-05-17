# Matjar Groceries 🥬

> Online halal grocery store for the United States. Fresh produce, fruits, halal meat, dairy, and pantry essentials delivered fast — from farm to your door.

A modern Progressive Web App (PWA) built with Next.js, featuring GPS-based delivery routing, multi-mode receipts, and a zero-cost admin layer powered by Google Apps Script + Sheets.

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **State:** Zustand
- **Maps:** Leaflet + OpenStreetMap (free, no API key)
- **Routing:** OSRM routing engine for real road distance
- **Geocoding:** Nominatim (free reverse geocoding)
- **Backend:** Google Apps Script + Google Sheets (admin layer)
- **Deployment:** Vercel (zero hosting cost for static layer)

## Key Features

✅ **GPS Map Picker** — Customers tap on map to set delivery location, with auto-distance calculation via OSRM (real road distance, not straight-line) and 25 km radius validation
✅ **Multi-mode Receipts** — Buyer receipt (with prices) + Driver receipt (with navigation links) for same order
✅ **WhatsApp Order Auto-Format** — Generated message with order details, items, total, and embedded Google Maps link
✅ **Multi-Payment** — Bank Transfer (Chase, BoA, Wells Fargo), Zelle/Venmo (QR), Cash on Delivery
✅ **Order Tracking** — History via local storage + recovery via phone number
✅ **PWA Installable** — Service Worker + Manifest, works offline-ready
✅ **Sheets-as-Database** — Admin manages products, prices, stock, coupons via Google Sheets

## Halal Compliance

All meat & poultry products are **halal certified** (zabihah hand-slaughtered). The product catalog excludes:
- ❌ Pork and pork products
- ❌ Alcohol-containing items
- ❌ Non-halal meat
- ❌ Gelatin-containing products

Categories follow halal-friendly grocery store norms.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create `.env.local`:
```
NEXT_PUBLIC_GAS_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

> Skip this if you only want to use the bundled demo data in `public/data/*.json`.

### 3. Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Production build

```bash
npm run build
npm run start
```

## Deployment to Vercel

1. Push this repo to GitHub
2. Import on [vercel.com](https://vercel.com)
3. (Optional) Add `NEXT_PUBLIC_GAS_URL` env var
4. Deploy

The build process automatically pre-fetches data from Google Apps Script (if configured) and bundles it into `public/data/`.

## Project Structure

```
matjar-groceries/
├── public/
│   ├── data/              # JSON data (products, categories, etc.)
│   ├── icons/             # PWA icons
│   ├── manifest.json      # PWA manifest
│   └── sw.js              # Service Worker
├── src/
│   ├── app/               # Next.js App Router pages
│   │   ├── cart/          # Shopping cart
│   │   ├── categories/    # Category browse
│   │   ├── checkout/      # Checkout with GPS map
│   │   ├── find-order/    # Order recovery via phone
│   │   ├── history/       # Order history
│   │   ├── product/       # Product detail
│   │   ├── receipt/       # Buyer/driver receipt
│   │   └── print-receipt/ # Print-friendly receipt
│   ├── components/        # Shared UI components
│   ├── lib/               # Utilities, API client, WhatsApp helper
│   ├── stores/            # Zustand stores
│   └── types/             # TypeScript types
├── gas/                   # Google Apps Script admin layer
└── scripts/               # Build helpers (prebuild data fetch)
```

## Configuration

### Store Settings (`public/data/stores.json`)

Update store address, hours, delivery radius, and minimum order:

```json
{
  "alamat": "123 Market Street, Brooklyn, NY 11201, USA",
  "lat": 40.6943,
  "lng": -73.9903,
  "max_jarak_km": 25,
  "min_order": 15.00,
  "gratis_ongkir_diatas": 50.00
}
```

### Categories (`public/data/categories.json`)

8 categories included by default: Fresh Produce, Fruits, Halal Meat & Poultry, Dairy & Eggs, Pantry & Grains, Spices & Herbs, Beverages, Bakery & Snacks.

### Coupons (`public/data/coupons.json`)

3 default coupons:
- `SAVE10` — 10% off, max $8 discount, min $30 order
- `DEAL5` — $5 off, min $25 order
- `FREESHIP` — Free shipping, min $35 order

## License

Private project — all rights reserved.

## Credits

Built by [Jeffri Pamungkas Setiawan](https://wa.me/6281219199323) using AI-augmented development workflow (Claude Code, Kiro IDE, Google Antigravity).
