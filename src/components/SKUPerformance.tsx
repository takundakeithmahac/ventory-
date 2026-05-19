import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { SKU, BucketType, PortfolioSummary } from '../types';

interface Props {
  skus: SKU[];
  summary: PortfolioSummary;
}

const BUCKET_META: Record<BucketType, { label: string; color: string; bg: string; action: string }> = {
  acceleration:     { label: 'Acceleration',     color: '#10b981', bg: '#d1fae5', action: 'Protect + grow' },
  stabilization:    { label: 'Stabilization',    color: '#3b82f6', bg: '#dbeafe', action: 'Boost' },
  erosion:          { label: 'Erosion',           color: '#f97316', bg: '#ffedd5', action: 'Correct' },
  risk_monetization:{ label: 'Risk Monetization', color: '#ef4444', bg: '#fee2e2', action: 'Free capital' },
  leakage:          { label: 'Leakage',           color: '#8b5cf6', bg: '#ede9fe', action: 'Flag issue' },
  end_of_life:      { label: 'End of Life',       color: '#64748b', bg: '#f1f5f9', action: 'Retire' },
};

const BUCKET_ORDER: BucketType[] = [
  'acceleration', 'stabilization', 'erosion', 'risk_monetization', 'leakage', 'end_of_life',
];

function SKUDetailModal({ sku, onClose }: { sku: SKU; onClose: () => void }) {
  const m = BUCKET_META[sku.bucket!];
  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-end"
      onClick={onClose}
    >
      <div
        className="bg-[#0f172a] border-t border-slate-800 w-full max-w-md mx-auto rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-4" />
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="font-bold text-white">{sku.name}</h2>
            <p className="text-xs text-slate-400">{sku.sku} · {sku.variant}</p>
          </div>
          <span
            className="text-xs font-semibold px-2 py-1 rounded-full"
            style={{ background: m.bg, color: m.color }}
          >
            {m.label}
          </span>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { label: 'Stock Level', value: `${sku.stockLevel} units` },
            { label: 'Days of Stock', value: `${sku.daysOfStock}d` },
            { label: 'Daily Sales', value: `${sku.dailySales.toFixed(1)}/day` },
            { label: 'Margin', value: `${(sku.margin * 100).toFixed(0)}%` },
            { label: 'Return Rate', value: `${(sku.returnRate * 100).toFixed(0)}%` },
            { label: 'Lead Time', value: `${sku.leadTimeDays}d` },
            { label: 'Reorder Point', value: `${sku.reorderPoint} units` },
            { label: 'Unit Cost', value: `$${sku.unitCost}` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-slate-800 rounded-lg p-2.5">
              <p className="text-[10px] text-slate-500">{label}</p>
              <p className="text-sm font-semibold text-white mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        {/* Sales trend bar */}
        <div className="bg-slate-800 rounded-lg p-3 mb-3">
          <p className="text-xs text-slate-400 mb-2">Sales velocity trend</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-700 rounded-full h-2">
              <div
                className="h-2 rounded-full"
                style={{
                  width: `${Math.min(100, Math.max(5, (sku.dailySales / 7) * 100))}%`,
                  background: m.color,
                }}
              />
            </div>
            <span className={`text-xs font-semibold ${sku.salesTrend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {sku.salesTrend >= 0 ? '+' : ''}{(sku.salesTrend * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Decision note */}
        <div className="border border-slate-700 bg-slate-800/50 rounded-lg p-3">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Ventory Recommendation
          </p>
          <p className="text-sm text-slate-300 leading-relaxed">{sku.decisionNote}</p>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 py-2.5 bg-[#1a56db] text-white rounded-xl text-sm font-semibold"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default function SKUPerformance({ skus, summary }: Props) {
  const [selectedBucket, setSelectedBucket] = useState<BucketType | null>(null);
  const [selectedSKU, setSelectedSKU] = useState<SKU | null>(null);

  const chartData = BUCKET_ORDER.map((b) => ({
    name: BUCKET_META[b].label.split(' ')[0],
    count: summary.buckets[b],
    color: BUCKET_META[b].color,
  }));

  const displayedSKUs = selectedBucket
    ? skus.filter((s) => s.bucket === selectedBucket)
    : skus;

  return (
    <div className="px-4 pt-4">
      {/* Header */}
      <div className="mb-5">
        <p className="text-[10px] text-slate-600 uppercase tracking-[0.15em] mb-1">Portfolio Health</p>
        <h1 className="text-xl font-bold text-white">SKU Performance</h1>
      </div>

      {/* Summary strip */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 bg-[#0f172a] border border-slate-800 rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-white">{summary.totalSKUs}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">SKUs</p>
        </div>
        <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-red-400">{summary.urgent}</p>
          <p className="text-[10px] text-red-500/70 uppercase tracking-wide">Urgent</p>
        </div>
        <div className="flex-1 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-amber-400">${(summary.capitalAtRisk / 1000).toFixed(0)}K</p>
          <p className="text-[10px] text-amber-500/70 uppercase tracking-wide">At Risk</p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-3 mb-4">
        <p className="text-xs font-semibold text-slate-400 mb-2">Six-Bucket Classifier</p>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={chartData} barCategoryGap="20%">
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #1e293b', background: '#0f172a', color: '#fff' }}
              cursor={{ fill: '#1e293b' }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bucket filter chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-3 scrollbar-hide">
        <button
          onClick={() => setSelectedBucket(null)}
          className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
            selectedBucket === null
              ? 'bg-[#1a56db] text-white'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          All ({skus.length})
        </button>
        {BUCKET_ORDER.map((b) => {
          const m = BUCKET_META[b];
          const count = summary.buckets[b];
          if (count === 0) return null;
          return (
            <button
              key={b}
              onClick={() => setSelectedBucket(selectedBucket === b ? null : b)}
              className="shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors"
              style={
                selectedBucket === b
                  ? { background: m.color, color: 'white' }
                  : { background: m.bg, color: m.color }
              }
            >
              {m.label} ({count})
            </button>
          );
        })}
      </div>

      {/* SKU list */}
      <div className="flex flex-col gap-2 pb-4">
        {displayedSKUs.map((sku) => {
          const m = BUCKET_META[sku.bucket!];
          return (
            <button
              key={sku.id}
              onClick={() => setSelectedSKU(sku)}
              className="bg-[#0f172a] rounded-2xl border border-slate-800 p-3 text-left hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-white truncate">{sku.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{sku.sku} · {sku.variant}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ background: m.bg, color: m.color }}
                  >
                    {m.label}
                  </span>
                  <span className="text-[10px] text-slate-400">{m.action}</span>
                </div>
              </div>
              <div className="flex gap-3 mt-2 text-xs text-slate-500 border-t border-slate-800 pt-2">
                <span>{sku.daysOfStock}d stock</span>
                <span>{(sku.margin * 100).toFixed(0)}% margin</span>
                <span className={sku.salesTrend >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                  {sku.salesTrend >= 0 ? '↑' : '↓'} {Math.abs(sku.salesTrend * 100).toFixed(0)}%
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {selectedSKU && (
        <SKUDetailModal sku={selectedSKU} onClose={() => setSelectedSKU(null)} />
      )}
    </div>
  );
}
