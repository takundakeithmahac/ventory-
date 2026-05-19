import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import type { SKU, PortfolioSummary } from '../types';

interface Props {
  skus: SKU[];
  summary: PortfolioSummary;
}

function generateRevenueData(skus: SKU[]) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  let base = skus.reduce((s, k) => s + k.monthlySales * k.sellingPrice, 0);
  return months.map((month, i) => ({
    month,
    revenue: Math.round(base * (0.85 + i * 0.05 + Math.random() * 0.08)),
    forecast: Math.round(base * (0.9 + i * 0.06)),
  }));
}

function generateSavingsOpportunities(summary: PortfolioSummary) {
  return [
    {
      label: 'Reorder consolidation',
      description: 'Batch Acceleration SKU orders to reduce freight costs',
      saving: '$1,200–$2,400/mo',
      icon: '📦',
    },
    {
      label: 'Liquidation event',
      description: `Clear ${summary.buckets.risk_monetization + summary.buckets.end_of_life} SKUs to free $${(summary.capitalAtRisk / 1000).toFixed(0)}K`,
      saving: `$${(summary.capitalAtRisk * 0.65 / 1000).toFixed(0)}K one-time`,
      icon: '💰',
    },
    {
      label: 'Lead time reduction',
      description: 'Qualify 2nd supplier for top-5 Acceleration SKUs',
      saving: '18% stockout reduction',
      icon: '⚡',
    },
    {
      label: 'Markdown prevention',
      description: 'Act on Erosion SKUs now vs forced markdown later',
      saving: '$800–$3,200 margin saved',
      icon: '🛡',
    },
  ];
}

export default function Scaling({ skus, summary }: Props) {
  const revenueData = generateRevenueData(skus);
  const savings = generateSavingsOpportunities(summary);

  const monthlyRevenue = skus.reduce((s, k) => s + k.monthlySales * k.sellingPrice, 0);
  const avgMargin = skus.reduce((s, k) => s + k.margin, 0) / skus.length;
  const projectedGrowth = 0.08;

  // Tier benchmarks
  const tiers = [
    { label: 'Tier 1 – Drop Ship', price: 49, description: 'AliExpress, Wayfair' },
    { label: 'Tier 2 – In-House Storage', price: 99, description: 'LA Apparel, Bella+Canvas' },
    { label: 'Tier 3 – Digital Fulfillment', price: 149, description: 'Shopify, Streetwear (Current)', current: true },
    { label: 'Tier 4 – DC + E-Commerce', price: 499, description: 'Zara, Best Buy' },
    { label: 'Tier 5 – DC + Retail Store', price: null, description: 'Walmart, Target, Apple' },
  ];

  return (
    <div className="px-4 pt-4 pb-4">
      <div className="mb-4">
        <p className="text-xs text-slate-500 uppercase tracking-wider">Financial Intelligence</p>
        <h1 className="text-xl font-bold text-slate-900 mt-0.5">Scaling</h1>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-[#0f172a] rounded-xl p-3">
          <p className="text-[10px] text-slate-400">Est. Monthly Revenue</p>
          <p className="text-xl font-bold text-white mt-0.5">${(monthlyRevenue / 1000).toFixed(0)}K</p>
          <p className="text-[10px] text-emerald-400 mt-0.5">+{(projectedGrowth * 100).toFixed(0)}% MoM est.</p>
        </div>
        <div className="bg-[#1a56db] rounded-xl p-3">
          <p className="text-[10px] text-blue-200">Portfolio Avg Margin</p>
          <p className="text-xl font-bold text-white mt-0.5">{(avgMargin * 100).toFixed(0)}%</p>
          <p className="text-[10px] text-blue-200 mt-0.5">Across {summary.totalSKUs} SKUs</p>
        </div>
        <div className="bg-emerald-600 rounded-xl p-3">
          <p className="text-[10px] text-emerald-100">30d Revenue Forecast</p>
          <p className="text-xl font-bold text-white mt-0.5">${(summary.projectedRevenue30d / 1000).toFixed(0)}K</p>
          <p className="text-[10px] text-emerald-100 mt-0.5">Based on current velocity</p>
        </div>
        <div className="bg-amber-500 rounded-xl p-3">
          <p className="text-[10px] text-amber-100">Avg Days of Stock</p>
          <p className="text-xl font-bold text-white mt-0.5">{summary.avgDaysOfStock}d</p>
          <p className="text-[10px] text-amber-100 mt-0.5">Portfolio average</p>
        </div>
      </div>

      {/* Revenue chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 mb-4">
        <p className="text-xs font-semibold text-slate-600 mb-3">Revenue Trajectory</p>
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={revenueData}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1a56db" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#1a56db" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              formatter={(v: number) => [`$${(v / 1000).toFixed(0)}K`, '']}
              contentStyle={{ fontSize: 11, borderRadius: 8, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
            />
            <Area type="monotone" dataKey="revenue" stroke="#1a56db" strokeWidth={2} fill="url(#revGrad)" dot={false} />
            <Line type="monotone" dataKey="forecast" stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 3" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex gap-3 mt-1">
          <span className="flex items-center gap-1 text-[10px] text-slate-500">
            <span className="w-3 h-0.5 bg-[#1a56db] inline-block" /> Actual
          </span>
          <span className="flex items-center gap-1 text-[10px] text-slate-400">
            <span className="w-3 h-0.5 bg-slate-400 inline-block" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #94a3b8 0, #94a3b8 3px, transparent 3px, transparent 6px)' }} /> Forecast
          </span>
        </div>
      </div>

      {/* Savings opportunities */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Savings Opportunities</p>
        <div className="flex flex-col gap-2">
          {savings.map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-3 flex gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-xl shrink-0">
                {s.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{s.label}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{s.description}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs font-bold text-emerald-600">{s.saving}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tier ladder */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Ventory Network Tiers</p>
        <div className="flex flex-col gap-1.5">
          {tiers.map((t) => (
            <div
              key={t.label}
              className={`rounded-xl border p-3 flex items-center gap-3 ${
                t.current
                  ? 'border-[#1a56db] bg-[#eff6ff]'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex-1">
                <p className={`text-sm font-semibold ${t.current ? 'text-[#1a56db]' : 'text-slate-700'}`}>
                  {t.label}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{t.description}</p>
              </div>
              <div className="shrink-0">
                {t.price ? (
                  <p className={`text-sm font-bold ${t.current ? 'text-[#1a56db]' : 'text-slate-600'}`}>
                    ${t.price}/mo
                  </p>
                ) : (
                  <p className="text-sm font-bold text-slate-400">Custom</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ROI card */}
      <div className="mt-4 bg-[#0f172a] rounded-xl p-4">
        <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">The Math</p>
        <p className="text-slate-200 text-sm leading-relaxed">
          Avoid one bad reorder → cover a full year of Ventory.
        </p>
        <p className="text-2xl font-bold text-[#1a56db] mt-2">3–33× return</p>
        <p className="text-xs text-slate-500 mt-1">At 5% inventory improvement on $1M–$5M GMV</p>
      </div>
    </div>
  );
}
