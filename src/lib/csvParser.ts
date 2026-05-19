import type { SKU } from '../types';

// ── Shopify Products CSV columns we care about ─────────────────────────────
// Handle (slug), Title, Variant SKU, Variant Inventory Qty,
// Variant Price, Variant Cost (if present), Published At

// ── Shopify Orders CSV columns we care about ──────────────────────────────
// Name (order #), Created At, Lineitem sku, Lineitem quantity,
// Financial Status, Fulfillment Status

export interface ParseResult {
  skus: SKU[];
  warnings: string[];
}

function parseCSVRows(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  // Handle quoted fields with commas inside
  function splitCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim().replace(/^"|"$/g, ''));
    return result;
  }

  const headers = splitCSVLine(lines[0]).map((h) => h.toLowerCase().trim());
  return lines.slice(1).map((line) => {
    const values = splitCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i] ?? '';
    });
    return row;
  });
}

function col(row: Record<string, string>, ...candidates: string[]): string {
  for (const c of candidates) {
    if (row[c] !== undefined && row[c] !== '') return row[c];
  }
  return '';
}

function num(s: string, fallback = 0): number {
  const n = parseFloat(s.replace(/[^0-9.-]/g, ''));
  return isNaN(n) ? fallback : n;
}

// ── Parse Shopify Products Export ─────────────────────────────────────────
export function parseShopifyProducts(csv: string): { skus: Partial<SKU>[]; warnings: string[] } {
  const rows = parseCSVRows(csv);
  const warnings: string[] = [];
  const skuMap = new Map<string, Partial<SKU>>();

  for (const row of rows) {
    const skuCode = col(row, 'variant sku', 'sku', 'variant_sku');
    if (!skuCode) continue;

    const price = num(col(row, 'variant price', 'price', 'variant_price'), 0);
    const cost = num(col(row, 'variant cost', 'cost', 'cost per item', 'variant_cost'), 0);
    const stock = num(col(row, 'variant inventory qty', 'inventory quantity', 'variant_inventory_qty'), 0);
    const title = col(row, 'title', 'product title') || skuCode;
    const variant = col(row, 'option1 value', 'variant title', 'variant_title', 'option1_value') || '';
    const publishedAt = col(row, 'published at', 'published_at', 'created at', 'created_at');

    const ageDays = publishedAt
      ? Math.max(1, Math.floor((Date.now() - new Date(publishedAt).getTime()) / 86400000))
      : 90;

    const margin = price > 0 && cost > 0 ? (price - cost) / price : cost > 0 ? 0 : 0.65;

    if (margin === 0.65) {
      warnings.push(`${skuCode}: no cost data found — margin estimated at 65%`);
    }

    skuMap.set(skuCode, {
      id: skuCode,
      name: title,
      sku: skuCode,
      category: col(row, 'type', 'product type', 'product_type') || 'Uncategorized',
      variant: variant || undefined,
      stockLevel: stock,
      inTransit: 0,
      unitCost: cost || price * 0.35,
      sellingPrice: price,
      margin,
      returnRate: 0.05,
      ageDays,
      leadTimeDays: 14,
      orderCost: 120,
      supplierName: col(row, 'vendor', 'product vendor', 'product_vendor') || 'Unknown Supplier',
      dailySales: 0,
      weeklySales: 0,
      monthlySales: 0,
      salesTrend: 0,
    });
  }

  return { skus: Array.from(skuMap.values()), warnings };
}

// ── Parse Shopify Orders Export ────────────────────────────────────────────
export function parseShopifyOrders(
  csv: string,
  productSKUs: Partial<SKU>[]
): { skus: SKU[]; warnings: string[] } {
  const rows = parseCSVRows(csv);
  const warnings: string[] = [];

  // Count sales per SKU over the last 60 days
  const now = Date.now();
  const sixtyDaysAgo = now - 60 * 86400000;
  const thirtyDaysAgo = now - 30 * 86400000;

  const sales60: Record<string, number> = {};
  const sales30: Record<string, number> = {};
  const salesPrev30: Record<string, number> = {}; // 60-30 days ago

  let parsedOrders = 0;
  let skippedOrders = 0;

  for (const row of rows) {
    const status = col(row, 'financial status', 'financial_status').toLowerCase();
    if (status === 'refunded' || status === 'voided') continue;

    const fulfillment = col(row, 'fulfillment status', 'fulfillment_status').toLowerCase();
    if (fulfillment === 'restocked') continue;

    const createdAt = col(row, 'created at', 'created_at');
    if (!createdAt) { skippedOrders++; continue; }

    const orderDate = new Date(createdAt).getTime();
    if (isNaN(orderDate)) { skippedOrders++; continue; }
    if (orderDate < sixtyDaysAgo) continue;

    const skuCode = col(row, 'lineitem sku', 'sku', 'lineitem_sku', 'variant sku');
    if (!skuCode) continue;

    const qty = num(col(row, 'lineitem quantity', 'quantity', 'lineitem_quantity'), 1);

    sales60[skuCode] = (sales60[skuCode] ?? 0) + qty;
    if (orderDate >= thirtyDaysAgo) {
      sales30[skuCode] = (sales30[skuCode] ?? 0) + qty;
    } else {
      salesPrev30[skuCode] = (salesPrev30[skuCode] ?? 0) + qty;
    }
    parsedOrders++;
  }

  if (parsedOrders === 0 && skippedOrders > 0) {
    warnings.push('Could not parse order dates — check your orders CSV format');
  }

  // Merge sales data into SKUs
  const skus: SKU[] = productSKUs.map((partial, i) => {
    const skuCode = partial.sku!;
    const monthly = sales30[skuCode] ?? 0;
    const prevMonthly = salesPrev30[skuCode] ?? 0;
    const daily = monthly / 30;
    const trend = prevMonthly > 0 ? (monthly - prevMonthly) / prevMonthly : 0;

    if (monthly === 0 && sales60[skuCode] === undefined) {
      // No sales data for this SKU — it may be new or not in the orders window
    }

    return {
      id: partial.id ?? String(i),
      name: partial.name!,
      sku: skuCode,
      category: partial.category!,
      variant: partial.variant,
      stockLevel: partial.stockLevel ?? 0,
      inTransit: 0,
      dailySales: parseFloat(daily.toFixed(2)),
      weeklySales: Math.round(daily * 7),
      monthlySales: monthly,
      salesTrend: parseFloat(trend.toFixed(3)),
      unitCost: partial.unitCost ?? 0,
      sellingPrice: partial.sellingPrice ?? 0,
      margin: partial.margin ?? 0.65,
      returnRate: partial.returnRate ?? 0.05,
      ageDays: partial.ageDays ?? 90,
      leadTimeDays: partial.leadTimeDays ?? 14,
      orderCost: partial.orderCost ?? 120,
      supplierName: partial.supplierName ?? 'Unknown Supplier',
    } satisfies SKU;
  });

  return { skus, warnings };
}

// ── Main entry: combine both CSVs ─────────────────────────────────────────
export function parsePilotData(
  productsCsv: string,
  ordersCsv: string
): ParseResult {
  const { skus: partial, warnings: w1 } = parseShopifyProducts(productsCsv);
  const { skus, warnings: w2 } = parseShopifyOrders(ordersCsv, partial);
  return { skus, warnings: [...w1, ...w2] };
}

// ── Products-only mode (no orders CSV available) ──────────────────────────
export function parseProductsOnly(productsCsv: string): ParseResult {
  const { skus: partial, warnings } = parseShopifyProducts(productsCsv);
  // Estimate daily sales from stock and age (rough heuristic)
  const skus: SKU[] = partial.map((p, i) => {
    const estimatedDaily = p.stockLevel ? Math.max(0.1, p.stockLevel! / Math.max(p.ageDays ?? 30, 30)) : 0;
    return {
      id: p.id ?? String(i),
      name: p.name!,
      sku: p.sku!,
      category: p.category!,
      variant: p.variant,
      stockLevel: p.stockLevel ?? 0,
      inTransit: 0,
      dailySales: parseFloat(estimatedDaily.toFixed(2)),
      weeklySales: Math.round(estimatedDaily * 7),
      monthlySales: Math.round(estimatedDaily * 30),
      salesTrend: 0,
      unitCost: p.unitCost ?? 0,
      sellingPrice: p.sellingPrice ?? 0,
      margin: p.margin ?? 0.65,
      returnRate: 0.05,
      ageDays: p.ageDays ?? 90,
      leadTimeDays: 14,
      orderCost: 120,
      supplierName: p.supplierName ?? 'Unknown Supplier',
    } satisfies SKU;
  });
  warnings.push('Orders CSV not provided — sales velocity estimated from stock levels. Upload orders CSV for accurate decisions.');
  return { skus, warnings };
}
