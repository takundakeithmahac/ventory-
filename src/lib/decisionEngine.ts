import type { SKU, BucketType, ActionType, UrgencyLevel, DailyDecision, PortfolioSummary } from '../types';

// ── Six-Bucket Classifier ──────────────────────────────────────────────────
export function classifySKU(sku: SKU, avgDailySales: number): BucketType {
  const velocityRatio = avgDailySales > 0 ? sku.dailySales / avgDailySales : 0;
  const daysLeft = sku.stockLevel / Math.max(sku.dailySales, 0.01);

  // Priority checks first
  if (sku.returnRate > 0.12) return 'leakage';

  if (sku.ageDays > 150 && velocityRatio < 0.25 && daysLeft > 120)
    return 'end_of_life';

  if (
    (sku.ageDays > 90 && daysLeft > 90 && sku.margin < 0.22) ||
    (velocityRatio < 0.35 && sku.stockLevel * sku.unitCost > 2000)
  )
    return 'risk_monetization';

  if (velocityRatio >= 1.25 && sku.margin >= 0.28) return 'acceleration';

  if (velocityRatio < 0.65 && sku.margin < 0.25) return 'erosion';

  return 'stabilization';
}

// ── Reorder Calculations ───────────────────────────────────────────────────
function calcSafetyStock(sku: SKU): number {
  // Z=1.65 for ~95% service level; σ ≈ 30% of daily sales (typical variability)
  const sigma = sku.dailySales * 0.3;
  return Math.ceil(1.65 * sigma * Math.sqrt(sku.leadTimeDays));
}

function calcReorderPoint(sku: SKU): number {
  return Math.ceil(sku.dailySales * sku.leadTimeDays + calcSafetyStock(sku));
}

function calcEOQ(sku: SKU): number {
  const annualDemand = sku.dailySales * 365;
  const holdingCostPerUnit = sku.unitCost * 0.25; // 25% holding cost rate
  if (holdingCostPerUnit <= 0) return 0;
  return Math.ceil(Math.sqrt((2 * annualDemand * sku.orderCost) / holdingCostPerUnit));
}

function calcReorderQty(sku: SKU): number {
  const eoq = calcEOQ(sku);
  const rp = calcReorderPoint(sku);
  const gap = rp - sku.stockLevel - sku.inTransit;
  return Math.max(eoq, gap > 0 ? gap + calcSafetyStock(sku) : 0);
}

function daysUntilStockout(sku: SKU): number {
  return sku.dailySales > 0
    ? Math.floor((sku.stockLevel + sku.inTransit) / sku.dailySales)
    : 999;
}

function reorderDeadline(sku: SKU): string {
  const daysLeft = daysUntilStockout(sku);
  const daysToOrder = Math.max(0, daysLeft - sku.leadTimeDays);
  const d = new Date();
  d.setDate(d.getDate() + daysToOrder);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Decision Note Generator ────────────────────────────────────────────────
function makeNote(sku: SKU, bucket: BucketType, days: number): string {
  switch (bucket) {
    case 'acceleration':
      return `Top seller with ${(sku.margin * 100).toFixed(0)}% margin. Order before stock runs out in ${days}d.`;
    case 'stabilization':
      return `Steady mover — ${days}d of stock left. Consider a placement or ad boost.`;
    case 'erosion':
      return `Slowing velocity and thin margin. Evaluate markdown or phase-out.`;
    case 'risk_monetization':
      return `$${(sku.stockLevel * sku.unitCost).toLocaleString()} tied up. Liquidation window open now.`;
    case 'leakage':
      return `${(sku.returnRate * 100).toFixed(0)}% return rate — flag for QC or product review.`;
    case 'end_of_life':
      return `${sku.ageDays}d old with near-zero velocity. Recycle or vendor contract close.`;
    default:
      return 'No action needed.';
  }
}

const BUCKET_ACTION: Record<BucketType, ActionType> = {
  acceleration: 'reorder',
  stabilization: 'boost',
  erosion: 'correct',
  risk_monetization: 'liquidate',
  leakage: 'flag',
  end_of_life: 'retire',
};

function urgencyFromBucketAndDays(bucket: BucketType, days: number): UrgencyLevel {
  if (bucket === 'acceleration' && days <= 14) return 'urgent';
  if (bucket === 'risk_monetization') return 'urgent';
  if (bucket === 'leakage') return 'warning';
  if (bucket === 'acceleration' && days <= 30) return 'warning';
  if (bucket === 'erosion') return 'warning';
  if (bucket === 'end_of_life') return 'info';
  if (bucket === 'stabilization') return 'info';
  return 'hold';
}

const BUCKET_HEADLINE: Record<BucketType, (sku: SKU, days: number) => string> = {
  acceleration: (s, d) => `Reorder ${calcReorderQty(s)} units by ${reorderDeadline(s)}`,
  stabilization: (_, d) => `${d} days of stock — monitor or boost`,
  erosion: (s) => `Margin eroding — correct or phase out`,
  risk_monetization: (s) => `$${(s.stockLevel * s.unitCost / 1000).toFixed(0)}K trapped — liquidate now`,
  leakage: (s) => `${(s.returnRate * 100).toFixed(0)}% return rate — flag issue`,
  end_of_life: (s) => `${s.ageDays}d old — end-of-life recovery`,
};

// ── Main Engine: enrich a list of SKUs ────────────────────────────────────
export function runDecisionEngine(skus: SKU[]): SKU[] {
  const avgDailySales =
    skus.reduce((sum, s) => sum + s.dailySales, 0) / Math.max(skus.length, 1);

  return skus.map((sku) => {
    const bucket = classifySKU(sku, avgDailySales);
    const days = daysUntilStockout(sku);
    const rp = calcReorderPoint(sku);
    const rq = bucket === 'acceleration' ? calcReorderQty(sku) : 0;
    const action = BUCKET_ACTION[bucket];
    const urgency = urgencyFromBucketAndDays(bucket, days);
    const confidence = Math.min(
      95,
      Math.round(70 + Math.random() * 20 + (urgency === 'urgent' ? 5 : 0))
    );

    return {
      ...sku,
      bucket,
      action,
      urgency,
      confidence,
      daysOfStock: days,
      reorderPoint: rp,
      reorderQty: rq,
      capitalAtRisk:
        bucket === 'risk_monetization' || bucket === 'end_of_life'
          ? sku.stockLevel * sku.unitCost
          : 0,
      decisionNote: makeNote(sku, bucket, days),
      reorderDeadline: bucket === 'acceleration' ? reorderDeadline(sku) : undefined,
    };
  });
}

// ── Generate Daily Decision Feed ──────────────────────────────────────────
export function generateDecisionFeed(skus: SKU[]): DailyDecision[] {
  return skus
    .filter((s) => s.bucket !== 'hold')
    .sort((a, b) => {
      const order: Record<UrgencyLevel, number> = {
        urgent: 0,
        warning: 1,
        info: 2,
        hold: 3,
      };
      return order[a.urgency!] - order[b.urgency!];
    })
    .map((s) => {
      const days = s.daysOfStock ?? 0;
      return {
        id: `decision-${s.id}`,
        skuId: s.id,
        skuName: s.name,
        sku: s.sku,
        category: s.category,
        urgency: s.urgency!,
        action: s.action!,
        bucket: s.bucket!,
        headline: BUCKET_HEADLINE[s.bucket!](s, days),
        subline: `${s.sku} · ${s.variant ?? s.category}`,
        confidence: s.confidence!,
        reorderQty: s.reorderQty,
        deadline: s.reorderDeadline,
        capitalAtRisk: s.capitalAtRisk,
        dismissed: false,
        favorited: false,
      };
    });
}

// ── Portfolio Summary ──────────────────────────────────────────────────────
export function buildPortfolioSummary(skus: SKU[]): PortfolioSummary {
  const bucketCounts: Record<BucketType, number> = {
    acceleration: 0,
    stabilization: 0,
    erosion: 0,
    risk_monetization: 0,
    leakage: 0,
    end_of_life: 0,
  };

  let urgent = 0;
  let capitalAtRisk = 0;
  let stockoutsIn7Days = 0;
  let totalDays = 0;
  let projectedRevenue = 0;

  for (const s of skus) {
    if (s.bucket) bucketCounts[s.bucket]++;
    if (s.urgency === 'urgent') urgent++;
    capitalAtRisk += s.capitalAtRisk ?? 0;
    if ((s.daysOfStock ?? 999) <= 7) stockoutsIn7Days++;
    totalDays += s.daysOfStock ?? 0;
    projectedRevenue += s.dailySales * 30 * s.sellingPrice;
  }

  return {
    totalSKUs: skus.length,
    urgent,
    capitalAtRisk,
    buckets: bucketCounts,
    stockoutsIn7Days,
    projectedRevenue30d: Math.round(projectedRevenue),
    avgDaysOfStock: Math.round(totalDays / Math.max(skus.length, 1)),
  };
}
