# Ventory — The Decision Engine for Inventory

> **Stop guessing. Start deciding.**

Ventory tells e-commerce brands exactly what to reorder, when, and how much. Built for Shopify brands outgrowing spreadsheets ($100K–$20M GMV, 10–500 active SKUs).

---

## What It Does

Most inventory software shows dashboards. Ventory gives **one clear decision per SKU, every day**:

- *Reorder 180 units by April 17* — not "your stock is low"
- *$12K trapped in SKU-33* — not "slow mover detected"
- *19% return rate on SKU-52* — not "returns are elevated"

---

## Six-Bucket Classifier

Every SKU is classified into one of six buckets daily:

| Bucket | Signal | Action |
|---|---|---|
| **Acceleration** | High velocity + high margin | Protect inventory, reorder aggressively |
| **Stabilization** | Mid velocity, healthy margin | Marketing or placement boost |
| **Erosion** | Slowing velocity, margin pressure | Correct pricing or phase out |
| **Risk Monetization** | Aged stock, capital trapped | Liquidate to free cash |
| **Leakage** | High return rate | Flag for QC or product issue |
| **End of Life** | Near-zero velocity, old age | Retire, recycle, vendor contract close |

---

## Decision Engine — The Math

```
Reorder Point  = (Daily Sales × Lead Time) + Safety Stock
Safety Stock   = 1.65 × σ × √Lead Time          (95% service level)
Reorder Qty    = √(2 × Annual Demand × Order Cost / Holding Cost)   (EOQ)
Days of Stock  = Current Stock ÷ Daily Sales
Capital at Risk = Stock Level × Unit Cost        (Risk Monetization + End of Life SKUs)
```

---

## Five Modules

| Tab | What It Shows |
|---|---|
| ⚡ **Recommended** | Daily decision feed sorted by urgency — one tap per decision |
| 🗺 **Footprint** | Supply network map, warehouse status, free capital opportunities |
| 📊 **SKU Performance** | Full portfolio classified into six buckets, drill into any SKU |
| ★ **Favorites** | Saved decisions to review or share with your team |
| 📈 **Scaling** | Revenue trajectory, savings opportunities, tier benchmarks, ROI calculator |

---

## Pricing Tiers

| Tier | Model | Price |
|---|---|---|
| 1 | Drop Ship / D2C | $49/mo |
| 2 | In-House Storage + Holding | $99/mo |
| **3** | **In-House + Digital Fulfillment (Primary Wedge)** | **$149/mo** |
| 4 | DC → Retail + E-Commerce | $499/mo |
| 5 | DC → Retail Store | Custom |

---

## Tech Stack

```
Frontend    React 18 + TypeScript + Vite
Styling     Tailwind CSS v4
Charts      Recharts
Deploy      Vercel (static, zero-config)
Data        Shopify Products + Orders CSV import (client-side, no backend needed)
```

---

## Getting Started

### Run locally
```bash
git clone https://github.com/takundakeithmahac/ventory.git
cd ventory
npm install
npm run dev
# → http://localhost:5173
```

### Deploy to Vercel
```bash
npm run build
npx vercel --prod
```

### Use with your own Shopify data

1. **Shopify Admin → Products → Export → All products → Export products (CSV)**
2. **Shopify Admin → Orders → Export → Last 60 days → Export orders (CSV)**
3. Open the app → upload both files → click **Run Decision Engine →**

Your data is processed entirely in the browser. Nothing is sent to any server.

---

## Project Structure

```
src/
├── components/
│   ├── Layout.tsx            # Top bar + bottom nav shell
│   ├── Onboarding.tsx        # CSV upload gate / data source selector
│   ├── RecommendedFeed.tsx   # Daily decision cards
│   ├── SKUPerformance.tsx    # Six-bucket chart + SKU list + detail modal
│   ├── Footprint.tsx         # Supply network map + warehouse list
│   ├── Favorites.tsx         # Saved decisions
│   └── Scaling.tsx           # Revenue chart + savings + tier ladder
├── lib/
│   ├── decisionEngine.ts     # EOQ, ROP, classifier, decision generator
│   ├── csvParser.ts          # Shopify Products + Orders CSV parser
│   └── mockData.ts           # 25 demo SKUs (streetwear brand)
└── types/
    └── index.ts              # SKU, DailyDecision, PortfolioSummary types
```

---

## Roadmap

- [ ] Shopify OAuth (replace CSV upload with live API)
- [ ] Supabase auth + multi-tenant persistence
- [ ] Push notifications (stockout alerts via Shopify webhooks)
- [ ] CSV export of decision log
- [ ] Supplier contact integration (one-tap PO generation)
- [ ] South Africa warehouse expansion (Phase 2)

---

## Founders

**Takunda Keith Mahachi** — Founder & CEO
Full Stack Systems Architect · ex-Cisco · Zimbabwe → Silicon Valley

**Joshua Rose** — Co-Founder & COO
Supply Chain Systems Architect · Lean Six Sigma Green Belt (Boeing 2022)

---

*© 2025 Ventory Inc. All rights reserved.*
