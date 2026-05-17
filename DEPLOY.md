# Deploy Matjar Groceries to Vercel

## Quick Deploy Checklist

- [x] All Indonesian artifacts removed (UI strings, currency, addresses)
- [x] All product data is US halal-friendly (no pork, no alcohol)
- [x] All routes English (`/cart`, `/categories`, `/product/...`, etc)
- [x] Currency: USD with `en-US` locale
- [x] Store: Brooklyn, NY (40.6943, -73.9903)
- [x] Phone format: US (+1)
- [x] 63 products with local SVG placeholder images
- [x] Build succeeds (`npm run build`)
- [x] PWA manifest set to `lang: "en"`
- [x] No external font fetch (uses system fonts)

## Step 1: Push to GitHub

```bash
cd "d:\1 JEFFRI\APLIKASI\aktif\matjar groceries"
git init
git add .
git commit -m "Initial commit: Matjar Groceries (US halal grocery PWA)"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/matjar-groceries.git
git push -u origin main
```

## Step 2: Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the GitHub repo
3. Framework Preset: **Next.js** (auto-detected)
4. Root Directory: leave as `.`
5. Build Command: `npm run build` (default)
6. Output Directory: `.next` (default)
7. Install Command: `npm install` (default)

## Step 3: (Optional) Environment Variables

If you want admin to update products via Google Sheets later:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_GAS_URL` | Your fresh GAS deployment URL |

Skip this for now — bundled JSON data in `public/data/` is enough for first deploy.

## Step 4: Deploy

Click **Deploy**. First build takes ~2-3 minutes.

After deploy, your site is live at `your-project.vercel.app`.

## Step 5: Custom Domain (optional)

Vercel project → Settings → Domains → Add `matjargroceries.com`

## What's Different from Indonesian Version

| Aspect | Old (Matjar Sayur) | New (Matjar Groceries) |
|---|---|---|
| Language | Bahasa Indonesia | English (US) |
| Currency | IDR (Rp) | USD ($) |
| Locale | id-ID | en-US |
| Phone format | +62 | +1 |
| Store address | OKU Timur, Sumsel | Brooklyn, NY |
| Categories | Sayur/Buah/Bumbu (Indonesian) | Produce/Fruits/Halal Meat (US) |
| Products | Indonesian-style (tempe, tahu, sambal) | US-style halal (chicken breast, ribeye, eggs) |
| Routes | /kategori, /keranjang, /histori | /categories, /cart, /history |
| Payment | BSI/Mandiri/JAGO/QRIS/COD | Chase/BoA/Wells Fargo/Zelle/COD |
| Banks | Indonesian | US |
| Delivery radius | 10 km | 25 km (US standard) |
| Min order | Rp 10.000 | $15.00 |
| Free shipping | Rp 100k | $50 |

## Halal Compliance

All products comply with **manhaj salaf** halal guidelines:

✅ **Allowed:**
- Vegetables, fruits, grains, nuts, dairy, eggs
- Halal-certified meat (zabihah hand-slaughtered)
- Wild-caught fish
- Pure honey, olive oil, water

❌ **Excluded:**
- Pork and pork products (bacon, ham, sausage babi)
- Alcohol (wine, beer, alcohol-based vanilla extract)
- Non-halal meat
- Gelatin-containing products

## Update Products Later

Two ways:

**Option A — Edit JSON directly:**
1. Edit `public/data/products.json`
2. Add product image: `public/images/products/{slug}.svg` or use real photo
3. Push to GitHub → Vercel auto-redeploys

**Option B — Connect Google Sheets:**
1. Set up new Google Apps Script project (clone existing GAS code in `gas/` folder)
2. Update spreadsheet ID in GAS Code.gs
3. Deploy as Web App
4. Add `NEXT_PUBLIC_GAS_URL` to Vercel
5. Trigger redeploy
6. `prebuild` script auto-fetches data from Sheets

## File Structure Recap

```
matjar-groceries/
├── public/
│   ├── data/                # 63 products, 8 categories, 3 coupons, 3 sliders, 1 store
│   ├── images/products/     # 63 local SVG placeholders
│   └── images/sliders/      # 3 hero banners (SVG)
├── src/app/
│   ├── cart/                # /cart
│   ├── categories/          # /categories + /categories/[slug]
│   ├── checkout/            # /checkout (with GPS map)
│   ├── find-order/          # /find-order
│   ├── history/             # /history
│   ├── product/             # /product/[slug]
│   ├── receipt/             # /receipt/[orderId]
│   └── print-receipt/       # /print-receipt
├── gas/                     # Apps Script (admin layer — optional)
└── next.config.ts           # Image domains config
```
