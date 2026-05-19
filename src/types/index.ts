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
