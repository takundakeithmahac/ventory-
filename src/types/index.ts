export type BucketType =
  | 'acceleration'
  | 'stabilization'
  | 'erosion'
  | 'risk_monetization'
  | 'leakage'
  | 'end_of_life';

export type UrgencyLevel = 'urgent' | 'warning' | 'info' | 'hold';

export type ActionType =
  | 'reorder'
  | 'boost'
  | 'correct'
  | 'liquidate'
  | 'flag'
  | 'retire'
  | 'hold';

export interface SKU {
  id: string;
  name: string;
  sku: string;
  category: string;
  variant?: string;
  // Inventory
  stockLevel: number;
  inTransit: number;
  // Sales
  dailySales: number; // avg units/day (last 30d)
  weeklySales: number;
  monthlySales: number;
  salesTrend: number; // % change vs prior period
  // Financials
  unitCost: number;
  sellingPrice: number;
  margin: number; // 0-1
  returnRate: number; // 0-1
  // Metadata
  ageDays: number; // days since launch
  leadTimeDays: number;
  orderCost: number; // cost to place an order
  supplierName: string;
  // Derived (computed by engine)
  daysOfStock?: number;
  reorderPoint?: number;
  reorderQty?: number;
  capitalAtRisk?: number;
  bucket?: BucketType;
  action?: ActionType;
  urgency?: UrgencyLevel;
  confidence?: number;
  decisionNote?: string;
  reorderDeadline?: string;
}

export type ExecutionStatus = 'recommended' | 'approved' | 'dismissed';

export interface DecisionAlternative {
  label: string;      // the alternative action
  tradeoff: string;   // why you might pick it / what you give up
}

// Raw signals carried on the decision so the detail view can run what-if simulations
export interface SimInputs {
  dailySales: number;
  stockLevel: number;
  inTransit: number;
  leadTimeDays: number;
  unitCost: number;
  sellingPrice: number;
  reorderQty: number;
}

export interface DailyDecision {
  id: string;
  skuId: string;
  skuName: string;
  sku: string;
  category: string;
  urgency: UrgencyLevel;
  action: ActionType;
  bucket: BucketType;
  headline: string;
  subline: string;
  confidence: number;
  reorderQty?: number;
  deadline?: string;
  capitalAtRisk?: number;
  dismissed?: boolean;
  favorited?: boolean;
  // ── Structured Decision Object (spec §5.2 / §6 / §9) ──
  // Makes the leap from input (the merchant's data) to output (this action) transparent.
  decisionId: string;       // Stable id for auditability & outcome learning
  entity: string;           // The entity affected (a product in the MVP)
  location: string;         // Where the decision applies
  objective: string;        // What the business is optimizing
  currentState: string;     // Relevant facts at decision time
  problem: string;          // The problem or opportunity
  recommendation: string;   // What should I do — the concrete action
  whyNow: string;           // Why this deserves attention right now
  evidence: string[];       // The signals from the merchant's own data that drove it
  constraints: string[];    // Budget, MOQ, lead time, service level, policy considered
  alternatives: DecisionAlternative[]; // Other viable actions + their trade-offs
  riskIfIgnored: string;    // What happens if I do nothing
  expectedImpact: string;   // The expected financial / operational outcome
  executionStatus: ExecutionStatus;    // recommended → approved / dismissed
  simInputs: SimInputs;     // Raw numbers for the simulation what-ifs
}

export interface PortfolioSummary {
  totalSKUs: number;
  urgent: number;
  capitalAtRisk: number;
  buckets: Record<BucketType, number>;
  stockoutsIn7Days: number;
  projectedRevenue30d: number;
  avgDaysOfStock: number;
}

export interface ScalingMetric {
  label: string;
  value: string;
  change: number;
  positive: boolean;
}
