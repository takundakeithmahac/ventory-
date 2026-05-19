import { Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import type { SKU, PortfolioSummary } from '../types';

interface Props {
  skus: SKU[];
  summary: PortfolioSummary;
}

function generateRevenueData(skus: SKU[]) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const base = skus.reduce((s, k) => s + k.monthlySales * k.sellingPrice, 0);
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
      color: 'emerald',
    },
    {
      label: 'Liquidation event',
      description: `Clear ${summary.buckets.risk_monetization + summary.buckets.end_of_life} SKUs to free $${(summary.capitalAtRisk / 1000).toFixed(0)}K`,
      saving: `$${(summary.capitalAtRisk * 0.65 / 1000).toFixed(0)}K one-time`,
      color: 'blue',
    },
    {
      label: 'Lead time reduction',
      description: 'Qualify 2nd supplier for top-5 Acceleration SKUs',
      saving: '18% stockout reduction',
      color: 'amber',
    },
    {
      label: 'Markdown prevention',
      description: 'Act on Erosion SKUs now vs forced markdown later',
      saving: '$800–$3,200 margin saved',
      color: 'purple',
    },
  ];
}

const COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  blue:    { bg: 'bg-blue-500/10',    text: 'text-blue-400',    border: 'border-blue-500/20'    },
  amber:   { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20'   },
  purple:  { bg: 'bg-purple-500/10',  text: 'text-purple-400',  border: 'border-purple-500/20'  },
};

export default function Scaling({ skus, summary }: Props) {
  const revenueData = generateRevenueData(skus);
  const savings = generateSavingsOpportunities(summary);

  const monthlyRevenue = skus.reduce((s, k) => s + k.monthlySales * k.sellingPrice, 0);
  const avgMargin = skus.length > 0 ? skus.reduce((s, k) => s + k.margin, 0) / skus.length : 0;
  const projectedGrowth = 0.08;

  const tiers = [
    { label: 'Tier 1 – Drop Ship',       price: 49,   description: 'AliExpress, Wayfair' },
    { label: 'Tier 2 – In-House Storage', price: 99,   description: 'LA Apparel, Bella+Canvas' },
    { label: 'Tier 3 – Digital Fulfillment', price: 149, description: 'Shopify, Streetwear', current: true },
    { label: 'Tier 4 – DC + E-Commerce', price: 499,  description: 'Zara, Best Buy' },
    { label: 'Tier 5 – DC + Retail',     price: null,  description: 'Walmart, Target, Apple' },
  ];

  return (
    <div className="px-4 pt-5 pb-6">
      <div className="mb-5">
        <p className="text-[10px] text-slate-600 uppercase tracking-[0.15em] mb-1">Financial Intelligence</p>
        <h1 className="text-xl font-bold text-white">Scaling</h1>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4">
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">Est. Monthly Revenue</p>
          <p className="text-2xl font-bold text-white mt-1">${(monthlyRevenue / 1000).toFixed(0)}K</p>
          <p className="text-[10px] text-emerald-400 mt-1">+{(projectedGrowth * 100).toFixed(0)}% MoM est.</p>
        </div>
        <div className="bg-[#1a56db]/12 border border-[#1a56db]/20 rounded-2xl p-4">
          <p className="text-[10px] text-blue-400/70 uppercase tracking-wide">Avg Margin</p>
          <p className="text-2xl font-bold text-white mt-1">{(avgMargin * 100).toFixed(0)}%</p>
          <p className="text-[10px] text-blue-400/60 mt-1">Across {summary.totalSKUs} SKUs</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
          <p className="text-[10px] text-emerald-400/70 uppercase tracking-wide">30d Forecast</p>
          <p className="text-2xl font-bold text-white mt-1">${(summary.projectedRevenue30d / 1000).toFixed(0)}K</p>
          <p className="text-[10px] text-emerald-400/60 mt-1">Based on velocity</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
          <p className="text-[10px] text-amber-400/70 uppercase tracking-wide">Avg Days Stock</p>
          <p className="text-2xl font-bold text-white mt-1">{summary.avgDaysOfStock}d</p>
          <p className="text-[10px] text-amber-400/60 mt-1">Portfolio average</p>
        </div>
      </div>

      {/* Revenue chart */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 mb-5">
        <p className="text-xs font-semibold text-slate-400 mb-3">Revenue Trajectory</p>
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={revenueData}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#1a56db" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#1a56db" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#475569' }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              formatter={(v) => [`$${(Number(v) / 1000).toFixed(0)}K`, '']}
              contentStyle={{ fontSize: 11, borderRadius: 12, border: '1px solid #1e293b', background: '#0a1020', color: '#fff' }}
              cursor={{ stroke: '#1e293b', strokeWidth: 1 }}
            />
            <Area type="monotone" dataKey="revenue" stroke="#1a56db" strokeWidth={2} fill="url(#revGrad)" dot={false} />
            <Line type="monotone" dataKey="forecast" stroke="#334155" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2">
          <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <span className="w-3 h-0.5 bg-[#1a56db] inline-block rounded" /> Actual
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-slate-600">
            <span className="w-3 h-0.5 bg-slate-600 inline-block rounded" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #475569 0, #475569 3px, transparent 3px, transparent 6px)' }} /> Forecast
          </span>
        </div>
      </div>

      {/* Savings opportunities */}
      <div className="mb-5">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Savings Opportunities</p>
        <div className="flex flex-col gap-2.5">
          {savings.map((s) => {
            const c = COLOR_MAP[s.color];
            return (
              <div key={s.label} className={`rounded-2xl border p-4 flex gap-3 ${c.bg} ${c.border}`}>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${c.text}`}>{s.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{s.description}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className={`text-xs font-bold ${c.text}`}>{s.saving}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tier ladder */}
      <div className="mb-5">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Ventory Network Tiers</p>
        <div className="flex flex-col gap-2">
          {tiers.map((t) => (
            <div
              key={t.label}
              className={`rounded-2xl border p-3.5 flex items-center gap-3 transition-all ${
                t.current
                  ? 'border-[#1a56db]/40 bg-[#1a56db]/8'
                  : 'border-slate-800 bg-[#0f172a]'
              }`}
            >
              {t.current && (
                <div className="w-1.5 h-1.5 rounded-full bg-[#1a56db] shrink-0" />
              )}
              <div className="flex-1">
                <p className={`text-sm font-semibold ${t.current ? 'text-blue-400' : 'text-slate-300'}`}>
                  {t.label}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{t.description}</p>
              </div>
              <div className="shrink-0">
                {t.price ? (
                  <p className={`text-sm font-bold ${t.current ? 'text-blue-400' : 'text-slate-500'}`}>
                    ${t.price}/mo
                  </p>
                ) : (
                  <p className="text-sm font-bold text-slate-600">Custom</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ROI card */}
      <div className="bg-gradient-to-br from-[#0f172a] to-[#0d1c3a] rounded-2xl border border-[#1a56db]/20 p-5">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">The Math</p>
        <p className="text-slate-300 text-sm leading-relaxed">
          Avoid one bad reorder → cover a full year of Ventory.
        </p>
        <p className="text-3xl font-bold text-[#3b82f6] mt-3">3–33× return</p>
        <p className="text-xs text-slate-500 mt-1.5">At 5% inventory improvement on $1M–$5M GMV</p>
      </div>
    </div>
  );
}
