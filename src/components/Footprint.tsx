import type { SKU, PortfolioSummary } from '../types';

interface Props {
  skus: SKU[];
  summary: PortfolioSummary;
}

const SUPPLIERS = [
  { name: 'Delta Apparel Co.', city: 'Los Angeles, CA', lat: 34.05, lng: -118.24, type: 'Manufacturer' },
  { name: 'Pacific Knit', city: 'San Francisco, CA', lat: 37.77, lng: -122.41, type: 'Manufacturer' },
  { name: 'GarmentPro', city: 'New York, NY', lat: 40.71, lng: -74.01, type: 'Manufacturer' },
  { name: 'WestCoast Mfg', city: 'Portland, OR', lat: 45.52, lng: -122.68, type: 'Manufacturer' },
  { name: 'AccessoryCo', city: 'Dallas, TX', lat: 32.78, lng: -96.79, type: 'Supplier' },
  { name: 'FootworkCo', city: 'Chicago, IL', lat: 41.88, lng: -87.63, type: 'Supplier' },
  { name: 'LuxeApparel', city: 'Miami, FL', lat: 25.77, lng: -80.19, type: 'Manufacturer' },
];

const WAREHOUSES = [
  { name: 'Primary 3PL – US West', city: 'Los Angeles, CA', type: 'Warehouse', active: true },
  { name: 'Fulfillment Hub – East', city: 'New Jersey, NJ', type: 'Fulfillment', active: true },
  { name: 'SA Expansion (Phase 2)', city: 'Cape Town, SA', type: 'Planned', active: false },
];

export default function Footprint({ skus, summary }: Props) {
  const supplierMap = new Map<string, { count: number; urgent: boolean }>();
  for (const sku of skus) {
    const entry = supplierMap.get(sku.supplierName) ?? { count: 0, urgent: false };
    entry.count++;
    if (sku.urgency === 'urgent') entry.urgent = true;
    supplierMap.set(sku.supplierName, entry);
  }

  const totalSuppliers = SUPPLIERS.length;
  const activeSkus = skus.filter((s) => s.daysOfStock && s.daysOfStock < 30).length;
  const inTransitUnits = skus.reduce((s, k) => s + k.inTransit, 0);

  return (
    <div className="px-4 pt-4 pb-4">
      <div className="mb-5">
        <p className="text-[10px] text-slate-600 uppercase tracking-[0.15em] mb-1">Network Overview</p>
        <h1 className="text-xl font-bold text-white">Supply Footprint</h1>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-3 text-center">
          <p className="text-xl font-bold text-white">{totalSuppliers}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">Suppliers</p>
        </div>
        <div className="bg-[#1a56db]/15 border border-[#1a56db]/25 rounded-2xl p-3 text-center">
          <p className="text-xl font-bold text-blue-400">{inTransitUnits}</p>
          <p className="text-[10px] text-blue-500/70 uppercase tracking-wide">In Transit</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3 text-center">
          <p className="text-xl font-bold text-emerald-400">{activeSkus}</p>
          <p className="text-[10px] text-emerald-500/70 uppercase tracking-wide">Low Stock</p>
        </div>
      </div>

      {/* Visual US map placeholder */}
      <div className="bg-[#0f172a] rounded-xl p-4 mb-4 relative overflow-hidden" style={{ height: 180 }}>
        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Network Map</p>
        {/* Simple SVG dot map */}
        <svg viewBox="0 0 400 200" className="w-full h-full absolute inset-0 opacity-20">
          <rect width="400" height="200" fill="#1e293b" />
          {/* Simplified US outline */}
          <path d="M60,60 L340,60 L360,80 L350,130 L300,150 L250,160 L200,155 L150,160 L100,150 L60,130 Z"
            fill="none" stroke="#334155" strokeWidth="1" />
        </svg>
        {/* Supplier dots */}
        {SUPPLIERS.map((s, i) => {
          const x = ((s.lng + 125) / 60) * 380 + 10;
          const y = ((50 - s.lat) / 30) * 160 + 20;
          const entry = supplierMap.get(s.name);
          return (
            <div
              key={i}
              className="absolute flex flex-col items-center"
              style={{ left: `${Math.min(90, Math.max(5, (x / 400) * 100))}%`, top: `${Math.min(85, Math.max(10, (y / 200) * 100))}%`, transform: 'translate(-50%, -50%)' }}
            >
              <div
                className={`w-2.5 h-2.5 rounded-full border-2 border-white ${entry?.urgent ? 'bg-red-500' : 'bg-[#1a56db]'}`}
              />
            </div>
          );
        })}
        {/* Warehouse dots */}
        <div className="absolute bottom-3 right-3 text-[9px] text-slate-500 flex gap-2">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#1a56db] inline-block" /> Supplier</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" /> Urgent</span>
        </div>
      </div>

      {/* Warehouses */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Warehouses & Fulfillment</p>
        <div className="flex flex-col gap-2">
          {WAREHOUSES.map((w) => (
            <div key={w.name} className="bg-[#0f172a] rounded-2xl border border-slate-800 p-3 flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base ${w.active ? 'bg-blue-500/15' : 'bg-slate-800'}`}>
                {w.active ? '🏭' : '🚧'}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{w.name}</p>
                <p className="text-xs text-slate-500">{w.city}</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${w.active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                {w.active ? 'Active' : 'Planned'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Supplier list */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Supplier Network</p>
        <div className="flex flex-col gap-2">
          {SUPPLIERS.map((s) => {
            const entry = supplierMap.get(s.name) ?? { count: 0, urgent: false };
            return (
              <div key={s.name} className="bg-[#0f172a] rounded-2xl border border-slate-800 p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-base">
                  🏗
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{s.name}</p>
                  <p className="text-xs text-slate-500">{s.city} · {s.type}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-white">{entry.count}</p>
                  <p className="text-[10px] text-slate-500">SKUs</p>
                </div>
                {entry.urgent && (
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Free capital opportunities */}
      <div className="mt-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
        <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">Free Capital Opportunities</p>
        <p className="text-sm text-amber-200/70 leading-relaxed">
          ${(summary.capitalAtRisk / 1000).toFixed(0)}K tied up in slow movers.
          Consolidating Risk Monetization SKUs into a single liquidation event could free{' '}
          <span className="font-bold">${(summary.capitalAtRisk * 0.6 / 1000).toFixed(0)}K–${(summary.capitalAtRisk * 0.8 / 1000).toFixed(0)}K</span>{' '}
          within 30 days.
        </p>
      </div>
    </div>
  );
}
