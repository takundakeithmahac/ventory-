import { useRef, useState } from 'react';
import { parsePilotData, parseProductsOnly } from '../lib/csvParser';
import type { SKU } from '../types';

interface Props {
  onData: (skus: SKU[], source: 'csv' | 'demo') => void;
}

const STEPS = [
  {
    n: '1',
    title: 'Export Products CSV',
    detail: 'Shopify Admin → Products → Export → All products → Export products (CSV)',
    file: 'products',
  },
  {
    n: '2',
    title: 'Export Orders CSV',
    detail: 'Shopify Admin → Orders → Export → Last 60 days → Export orders (CSV)',
    file: 'orders',
    optional: true,
  },
  {
    n: '3',
    title: 'Upload below & see your decisions',
    detail: 'Ventory runs entirely in your browser. Your data never leaves your device.',
    file: null,
  },
];

export default function Onboarding({ onData }: Props) {
  const [productsFile, setProductsFile] = useState<File | null>(null);
  const [ordersFile, setOrdersFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const productsRef = useRef<HTMLInputElement>(null);
  const ordersRef = useRef<HTMLInputElement>(null);

  async function readFile(file: File): Promise<string> {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = (e) => res(e.target?.result as string);
      r.onerror = () => rej(new Error('Failed to read file'));
      r.readAsText(file);
    });
  }

  async function handleImport() {
    if (!productsFile) {
      setError('Products CSV is required — upload it first.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const productsCsv = await readFile(productsFile);
      let result;
      if (ordersFile) {
        const ordersCsv = await readFile(ordersFile);
        result = parsePilotData(productsCsv, ordersCsv);
      } else {
        result = parseProductsOnly(productsCsv);
      }
      if (result.skus.length === 0) {
        setError('No SKUs found. Make sure you exported a Shopify Products CSV.');
        setLoading(false);
        return;
      }
      setWarnings(result.warnings);
      onData(result.skus, 'csv');
    } catch (e) {
      setError('Could not parse CSV. Make sure it\'s a Shopify export.');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-start px-5 pt-10 pb-10">
      {/* Logo */}
      <div className="mb-8 text-center">
        <p className="text-[#1a56db] font-bold tracking-[0.3em] text-lg mb-1">VENTORY</p>
        <p className="text-slate-400 text-sm">The Decision Engine for Inventory</p>
      </div>

      {/* Headline */}
      <div className="text-center mb-8">
        <h1 className="text-white text-2xl font-bold leading-tight mb-2">
          Stop guessing.<br />Start deciding.
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
          Upload your Shopify exports and get your first inventory decisions in under 60 seconds.
        </p>
      </div>

      {/* Steps */}
      <div className="w-full max-w-sm space-y-3 mb-6">
        {STEPS.map((step) => (
          <div key={step.n} className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-[#1a56db] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              {step.n}
            </div>
            <div>
              <p className="text-white text-sm font-semibold">
                {step.title}
                {step.optional && (
                  <span className="ml-1.5 text-[10px] text-slate-500 font-normal bg-slate-800 px-1.5 py-0.5 rounded-full">
                    optional
                  </span>
                )}
              </p>
              <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{step.detail}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Upload zone */}
      <div className="w-full max-w-sm space-y-3 mb-5">
        {/* Products CSV */}
        <button
          onClick={() => productsRef.current?.click()}
          className={`w-full border-2 border-dashed rounded-xl p-4 text-left transition-colors ${
            productsFile
              ? 'border-emerald-500 bg-emerald-500/10'
              : 'border-slate-600 hover:border-slate-400'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{productsFile ? '✅' : '📦'}</span>
            <div>
              <p className={`text-sm font-semibold ${productsFile ? 'text-emerald-400' : 'text-slate-300'}`}>
                {productsFile ? productsFile.name : 'Products CSV'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {productsFile ? `${(productsFile.size / 1024).toFixed(1)} KB` : 'Required · Shopify Admin → Products → Export'}
              </p>
            </div>
          </div>
        </button>
        <input
          ref={productsRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => setProductsFile(e.target.files?.[0] ?? null)}
        />

        {/* Orders CSV */}
        <button
          onClick={() => ordersRef.current?.click()}
          className={`w-full border-2 border-dashed rounded-xl p-4 text-left transition-colors ${
            ordersFile
              ? 'border-emerald-500 bg-emerald-500/10'
              : 'border-slate-700 hover:border-slate-500'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{ordersFile ? '✅' : '🧾'}</span>
            <div>
              <p className={`text-sm font-semibold ${ordersFile ? 'text-emerald-400' : 'text-slate-400'}`}>
                {ordersFile ? ordersFile.name : 'Orders CSV'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {ordersFile ? `${(ordersFile.size / 1024).toFixed(1)} KB` : 'Optional · Last 60 days · Shopify Admin → Orders → Export'}
              </p>
            </div>
          </div>
        </button>
        <input
          ref={ordersRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => setOrdersFile(e.target.files?.[0] ?? null)}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="w-full max-w-sm bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="w-full max-w-sm bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 mb-4 space-y-1">
          {warnings.slice(0, 3).map((w, i) => (
            <p key={i} className="text-amber-400 text-xs">{w}</p>
          ))}
        </div>
      )}

      {/* CTA buttons */}
      <div className="w-full max-w-sm space-y-3">
        <button
          onClick={handleImport}
          disabled={!productsFile || loading}
          className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all ${
            productsFile && !loading
              ? 'bg-[#1a56db] text-white hover:bg-blue-600'
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
          }`}
        >
          {loading ? 'Analysing your inventory…' : 'Run Decision Engine →'}
        </button>

        <button
          onClick={() => onData([], 'demo')}
          className="w-full py-3 rounded-xl text-sm text-slate-400 hover:text-slate-200 transition-colors border border-slate-700 hover:border-slate-500"
        >
          Use demo data instead
        </button>
      </div>

      {/* Privacy note */}
      <p className="text-slate-600 text-[11px] text-center mt-6 max-w-xs leading-relaxed">
        🔒 Your CSV data is processed entirely in your browser. Nothing is sent to any server.
      </p>
    </div>
  );
}
