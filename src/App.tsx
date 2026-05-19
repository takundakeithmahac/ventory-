import { useState, useMemo, useEffect } from 'react';
import { runDecisionEngine, generateDecisionFeed, buildPortfolioSummary } from './lib/decisionEngine';
import { MOCK_SKUS } from './lib/mockData';
import { saveSKUs, loadSKUs, saveDecisionAction, removeDecisionAction, loadDecisionActions } from './lib/db';
import Layout from './components/Layout';
import Onboarding from './components/Onboarding';
import AuthGate from './components/AuthGate';
import RecommendedFeed from './components/RecommendedFeed';
import SKUPerformance from './components/SKUPerformance';
import Footprint from './components/Footprint';
import Favorites from './components/Favorites';
import Scaling from './components/Scaling';
import { useAuth } from './hooks/useAuth';
import type { DailyDecision, SKU } from './types';

export type TabId = 'recommended' | 'footprint' | 'skuperf' | 'favorites' | 'scaling';

function loadLocal<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch { return fallback; }
}
function saveLocal(key: string, v: unknown) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
}

export default function App() {
  const { user, loading: authLoading } = useAuth();

  const [rawSKUs, setRawSKUs] = useState<SKU[] | null>(() => loadLocal('ventory_skus', null));
  const [dataSource, setDataSource] = useState<'csv' | 'demo' | null>(() => loadLocal('ventory_source', null));
  const [activeTab, setActiveTab] = useState<TabId>('recommended');
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(() => new Set(loadLocal<string[]>('ventory_favorites', [])));
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => new Set(loadLocal<string[]>('ventory_dismissed', [])));
  const [dbLoading, setDbLoading] = useState(false);

  // When user logs in — load their data from Supabase, overriding localStorage
  useEffect(() => {
    if (!user) return;
    setDbLoading(true);
    Promise.all([loadSKUs(user.id), loadDecisionActions(user.id)]).then(
      ([{ skus, source }, { favoritedIds: fav, dismissedIds: dis }]) => {
        if (skus && skus.length > 0) {
          setRawSKUs(skus);
          setDataSource((source as 'csv' | 'demo') ?? 'csv');
        }
        setFavoritedIds(fav);
        setDismissedIds(dis);
        setDbLoading(false);
      }
    );
  }, [user]);

  // Sync localStorage always (offline fallback)
  useEffect(() => { saveLocal('ventory_skus', rawSKUs); }, [rawSKUs]);
  useEffect(() => { saveLocal('ventory_source', dataSource); }, [dataSource]);
  useEffect(() => { saveLocal('ventory_favorites', [...favoritedIds]); }, [favoritedIds]);
  useEffect(() => { saveLocal('ventory_dismissed', [...dismissedIds]); }, [dismissedIds]);

  async function handleData(skus: SKU[], source: 'csv' | 'demo') {
    const resolved = source === 'demo' ? MOCK_SKUS : skus;
    setRawSKUs(resolved);
    setDataSource(source);
    setFavoritedIds(new Set());
    setDismissedIds(new Set());
    setActiveTab('recommended');
    if (user) await saveSKUs(user.id, resolved, source);
  }

  function clearAll() {
    setDataSource(null); setRawSKUs(null);
    setFavoritedIds(new Set()); setDismissedIds(new Set());
    ['ventory_skus','ventory_source','ventory_favorites','ventory_dismissed']
      .forEach((k) => localStorage.removeItem(k));
  }

  async function toggleFavorite(id: string) {
    setFavoritedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        if (user) removeDecisionAction(user.id, id);
      } else {
        next.add(id);
        if (user) saveDecisionAction(user.id, id, 'favorited');
      }
      return next;
    });
  }

  async function dismiss(id: string) {
    setDismissedIds((prev) => new Set([...prev, id]));
    if (user) saveDecisionAction(user.id, id, 'dismissed');
  }

  const sourceSKUs = rawSKUs ?? [];
  const enrichedSKUs = useMemo(() => runDecisionEngine(sourceSKUs), [sourceSKUs]);
  const summary = useMemo(() => buildPortfolioSummary(enrichedSKUs), [enrichedSKUs]);
  const allDecisions = useMemo(() => generateDecisionFeed(enrichedSKUs), [enrichedSKUs]);

  const decisions: DailyDecision[] = useMemo(
    () => allDecisions.map((d) => ({
      ...d,
      favorited: favoritedIds.has(d.id),
      dismissed: dismissedIds.has(d.id),
    })),
    [allDecisions, favoritedIds, dismissedIds]
  );

  const visibleDecisions = decisions.filter((d) => !dismissedIds.has(d.id));
  const favoritedDecisions = decisions.filter((d) => favoritedIds.has(d.id));
  const liveUrgentCount = visibleDecisions.filter((d) => d.urgency === 'urgent').length;

  // Loading spinner while checking auth session
  if (authLoading || dbLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#1a56db] font-bold tracking-[0.3em] text-lg mb-3">VENTORY</p>
          <div className="w-5 h-5 border-2 border-[#1a56db] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  // Not logged in → show auth screen
  if (!user) return <AuthGate />;

  // Logged in but no data yet → show onboarding
  if (!dataSource) return <Onboarding onData={handleData} />;

  const brandName = dataSource === 'csv'
    ? (user.email?.split('@')[0] ?? 'Your Store')
    : 'Demo Store';

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      urgentCount={liveUrgentCount}
      onReset={clearAll}
      brandName={brandName}
    >
      {activeTab === 'recommended' && (
        <RecommendedFeed
          decisions={visibleDecisions}
          summary={summary}
          onFavorite={toggleFavorite}
          onDismiss={dismiss}
          urgentCount={liveUrgentCount}
        />
      )}
      {activeTab === 'skuperf' && <SKUPerformance skus={enrichedSKUs} summary={summary} />}
      {activeTab === 'footprint' && <Footprint skus={enrichedSKUs} summary={summary} />}
      {activeTab === 'favorites' && <Favorites decisions={favoritedDecisions} onFavorite={toggleFavorite} />}
      {activeTab === 'scaling' && <Scaling skus={enrichedSKUs} summary={summary} />}
    </Layout>
  );
}
