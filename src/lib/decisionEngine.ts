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
  acceleration: (s, _d) => `Reorder ${calcReorderQty(s)} units by ${reorderDeadline(s)}`,
  stabilization: (_s, d) => `${d} days of stock — monitor or boost`,
  erosion: (_s) => `Margin eroding — correct or phase out`,
  risk_monetization: (s) => `$${(s.stockLevel * s.unitCost / 1000).toFixed(0)}K trapped — liquidate now`,
  leakage: (s) => `${(s.returnRate * 100).toFixed(0)}% return rate — flag issue`,
  end_of_life: (s) => `${s.ageDays}d old — end-of-life recovery`,
};

// ── Structured Decision Object builders (the Explainability Standard) ────────
// Each returns the plain-language answer to: What? Why now? Evidence? If ignored? Impact?
function buildRecommendation(sku: SKU, bucket: BucketType, _days: number): string {
  switch (bucket) {
    case 'acceleration':      return `Place a purchase order for ${calcReorderQty(sku)} units before ${reorderDeadline(sku)}.`;
    case 'stabilization':     return `Hold current stock and consider a small ad or placement boost to lift velocity.`;
    case 'erosion':           return `Run a markdown or bundle to clear stock while margin still holds.`;
    case 'risk_monetization': return `Open a liquidation channel now to recover trapped cash.`;
    case 'leakage':           return `Flag this product for QC / listing review before reordering.`;
    case 'end_of_life':       return `Retire this product — clearance or vendor close-out.`;
    default:                  return `No action needed right now.`;
  }
}

function buildWhyNow(sku: SKU, bucket: BucketType, days: number): string {
  switch (bucket) {
    case 'acceleration':      return `Only ${days} days of stock left and lead time is ${sku.leadTimeDays} days — ordering later risks a stockout.`;
    case 'stabilization':     return `Velocity is steady with ${days} days of cover — a nudge now protects momentum.`;
    case 'erosion':           return `Demand and margin are both sliding — acting now avoids a forced markdown later.`;
    case 'risk_monetization': return `Cash is sitting idle in slow stock — every week ties it up longer.`;
    case 'leakage':           return `Returns are above threshold and repeat with each order — fix before restocking.`;
    case 'end_of_life':       return `Velocity is near zero and carrying cost keeps compounding.`;
    default:                  return `Nothing time-sensitive detected.`;
  }
}

function buildEvidence(sku: SKU, bucket: BucketType, days: number, velocityRatio: number): string[] {
  const trend = sku.salesTrend >= 0 ? `+${(sku.salesTrend * 100).toFixed(0)}%` : `${(sku.salesTrend * 100).toFixed(0)}%`;
  const base = [
    `Sells ${sku.dailySales.toFixed(1)} units/day (trend ${trend})`,
    `${sku.stockLevel} in stock${sku.inTransit ? ` · ${sku.inTransit} in transit` : ''} → ${days}d of cover`,
    `${(sku.margin * 100).toFixed(0)}% margin · ${sku.leadTimeDays}d supplier lead time`,
  ];
  switch (bucket) {
    case 'risk_monetization':
    case 'end_of_life':
      base.push(`$${(sku.stockLevel * sku.unitCost).toLocaleString()} of capital held in this product`);
      break;
    case 'leakage':
      base.push(`${(sku.returnRate * 100).toFixed(0)}% return rate (above 12% threshold)`);
      break;
    case 'acceleration':
      base.push(`Selling ${velocityRatio.toFixed(1)}× the catalog average`);
      break;
  }
  return base;
}

function buildRiskIfIgnored(sku: SKU, bucket: BucketType, days: number): string {
  switch (bucket) {
    case 'acceleration':      return `Stockout in ~${days} days — lost sales and momentum on a top performer.`;
    case 'stabilization':     return `Velocity may keep drifting toward erosion.`;
    case 'erosion':           return `Deeper markdowns and thinner margin the longer it sits.`;
    case 'risk_monetization': return `$${(sku.stockLevel * sku.unitCost).toLocaleString()} stays locked up and value keeps decaying.`;
    case 'leakage':           return `Return costs and refunds keep eroding profit on every unit sold.`;
    case 'end_of_life':       return `Storage and handling costs accumulate on dead stock.`;
    default:                  return `No material downside.`;
  }
}

const BUCKET_OBJECTIVE: Record<BucketType, string> = {
  acceleration:      'Maximize revenue on a proven winner',
  stabilization:     'Hold service level while protecting margin',
  erosion:           'Recover margin before it decays further',
  risk_monetization: 'Free trapped cash and reduce holding risk',
  leakage:           'Protect margin by fixing return leakage',
  end_of_life:       'Minimize carrying cost on dead stock',
};

const BUCKET_PROBLEM: Record<BucketType, (sku: SKU, days: number) => string> = {
  acceleration:      (_s, d) => `Strong demand is drawing down stock — only ${d} days of cover left.`,
  stabilization:     (_s, d) => `Velocity is flat with ${d} days of cover; momentum is at risk of slipping.`,
  erosion:           (_s) => `Both demand and margin are declining on this product.`,
  risk_monetization: (s) => `$${(s.stockLevel * s.unitCost).toLocaleString()} is tied up in slow-moving stock.`,
  leakage:           (s) => `Return rate of ${(s.returnRate * 100).toFixed(0)}% is eroding profit on every sale.`,
  end_of_life:       (s) => `Product is ${s.ageDays} days old with near-zero velocity.`,
};

function buildCurrentState(sku: SKU, days: number): string {
  return `${sku.stockLevel} on hand${sku.inTransit ? ` + ${sku.inTransit} in transit` : ''}, selling ${sku.dailySales.toFixed(1)}/day → ${days} days of cover at ${(sku.margin * 100).toFixed(0)}% margin.`;
}

function buildConstraints(sku: SKU, bucket: BucketType): string[] {
  const c = [
    `Supplier lead time: ${sku.leadTimeDays} days`,
    `Order cost: $${sku.orderCost} per PO (EOQ-optimized)`,
    `Target service level: 95%`,
  ];
  if (bucket === 'acceleration') c.push(`Reorder sized to economic order quantity, not raw demand`);
  if (bucket === 'risk_monetization' || bucket === 'end_of_life') c.push(`Recovery capped at realistic resale value`);
  return c;
}

function buildAlternatives(_sku: SKU, bucket: BucketType): { label: string; tradeoff: string }[] {
  switch (bucket) {
    case 'acceleration':
      return [
        { label: 'Order a smaller quantity now', tradeoff: 'Lower cash outlay, but higher stockout risk and more frequent POs.' },
        { label: 'Wait one cycle', tradeoff: 'Frees cash short-term, but likely a stockout on a top seller.' },
      ];
    case 'stabilization':
      return [
        { label: 'Do nothing', tradeoff: 'No spend, but velocity may keep drifting down.' },
        { label: 'Run a markdown', tradeoff: 'Moves units faster, at the cost of margin.' },
      ];
    case 'erosion':
      return [
        { label: 'Hold and monitor', tradeoff: 'Avoids markdown now, risks deeper markdown later.' },
        { label: 'Bundle with a winner', tradeoff: 'Preserves price, but ties up a strong SKU.' },
      ];
    case 'risk_monetization':
      return [
        { label: 'Discount gradually', tradeoff: 'Protects more margin, but cash stays trapped longer.' },
        { label: 'Hold for seasonal lift', tradeoff: 'Possible full-price sale, but carries real holding cost.' },
      ];
    case 'leakage':
      return [
        { label: 'Keep selling as-is', tradeoff: 'No disruption, but returns keep eroding margin.' },
        { label: 'Pull the listing', tradeoff: 'Stops the leak, but forgoes the revenue entirely.' },
      ];
    case 'end_of_life':
      return [
        { label: 'Liquidate in bulk', tradeoff: 'Fast clearance, lowest recovery per unit.' },
        { label: 'Donate / write off', tradeoff: 'Clears space and may offer a tax benefit.' },
      ];
    default:
      return [];
  }
}

function buildExpectedImpact(sku: SKU, bucket: BucketType, _days: number): string {
  const rq = calcReorderQty(sku);
  switch (bucket) {
    case 'acceleration':      return `Protects ~$${(rq * sku.sellingPrice / 1000).toFixed(1)}K of at-risk revenue over the next cycle.`;
    case 'stabilization':     return `Small boost can lift units 5–15% with little downside.`;
    case 'erosion':           return `Recovers $${((sku.stockLevel * sku.sellingPrice * 0.4) / 1000).toFixed(1)}K vs. a later forced markdown.`;
    case 'risk_monetization': return `Frees ~$${((sku.stockLevel * sku.unitCost * 0.65) / 1000).toFixed(1)}K in cash to redeploy.`;
    case 'leakage':           return `Cutting returns lifts realized margin on every future sale.`;
    case 'end_of_life':       return `Removes carrying cost and clears shelf space for winners.`;
    default:                  return `Neutral.`;
  }
}

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
  const avgDailySales =
    skus.reduce((sum, s) => sum + s.dailySales, 0) / Math.max(skus.length, 1);

  return skus
    .filter((s) => s.bucket !== undefined)
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
      const bucket = s.bucket!;
      const velocityRatio = avgDailySales > 0 ? s.dailySales / avgDailySales : 0;
      return {
        id: `decision-${s.id}`,
        skuId: s.id,
        skuName: s.name,
        sku: s.sku,
        category: s.category,
        urgency: s.urgency!,
        action: s.action!,
        bucket,
        headline: BUCKET_HEADLINE[bucket](s, days),
        subline: `${s.sku} · ${s.variant ?? s.category}`,
        confidence: s.confidence!,
        reorderQty: s.reorderQty,
        deadline: s.reorderDeadline,
        capitalAtRisk: s.capitalAtRisk,
        dismissed: false,
        favorited: false,
        // Structured Decision Object — the explainability standard (§5.2 / §6 / §9)
        decisionId: `DEC-${s.id}`.toUpperCase(),
        entity: `${s.name}${s.variant ? ` · ${s.variant}` : ''}`,
        location: 'Primary warehouse',
        objective: BUCKET_OBJECTIVE[bucket],
        currentState: buildCurrentState(s, days),
        problem: BUCKET_PROBLEM[bucket](s, days),
        recommendation: buildRecommendation(s, bucket, days),
        whyNow: buildWhyNow(s, bucket, days),
        evidence: buildEvidence(s, bucket, days, velocityRatio),
        constraints: buildConstraints(s, bucket),
        alternatives: buildAlternatives(s, bucket),
        riskIfIgnored: buildRiskIfIgnored(s, bucket, days),
        expectedImpact: buildExpectedImpact(s, bucket, days),
        executionStatus: 'recommended',
        simInputs: {
          dailySales: s.dailySales,
          stockLevel: s.stockLevel,
          inTransit: s.inTransit,
          leadTimeDays: s.leadTimeDays,
          unitCost: s.unitCost,
          sellingPrice: s.sellingPrice,
          reorderQty: s.reorderQty ?? calcReorderQty(s),
        },
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
