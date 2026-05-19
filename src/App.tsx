import { useState, useMemo, useEffect } from 'react';
import { runDecisionEngine, generateDecisionFeed, buildPortfolioSummary } from './lib/decisionEngine';
import { MOCK_SKUS } from './lib/mockData';
import Layout from './components/Layout';
import Onboarding from './components/Onboarding';
import RecommendedFeed from './components/RecommendedFeed';
import SKUPerformance from './components/SKUPerformance';
import Footprint from './components/Footprint';
import Favorites from './components/Favorites';
import Scaling from './components/Scaling';
import type { DailyDecision, SKU } from './types';

export type TabId = 'recommended' | 'footprint' | 'skuperf' | 'favorites' | 'scaling';

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveStorage(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export default function App() {
  const [rawSKUs, setRawSKUs] = useState<SKU[] | null>(() =>
    loadStorage<SKU[] | null>('ventory_skus', null)
  );
  const [dataSource, setDataSource] = useState<'csv' | 'demo' | null>(() =>
    loadStorage<'csv' | 'demo' | null>('ventory_source', null)
  );
  const [activeTab, setActiveTab] = useState<TabId>('recommended');
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(
    () => new Set(loadStorage<string[]>('ventory_favorites', []))
  );
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(
    () => new Set(loadStorage<string[]>('ventory_dismissed', []))
  );

  // Persist to localStorage whenever state changes
  useEffect(() => { saveStorage('ventory_skus', rawSKUs); }, [rawSKUs]);
  useEffect(() => { saveStorage('ventory_source', dataSource); }, [dataSource]);
  useEffect(() => { saveStorage('ventory_favorites', [...favoritedIds]); }, [favoritedIds]);
  useEffect(() => { saveStorage('ventory_dismissed', [...dismissedIds]); }, [dismissedIds]);

  function handleData(skus: SKU[], source: 'csv' | 'demo') {
    const resolved = source === 'demo' ? MOCK_SKUS : skus;
    setRawSKUs(resolved);
    setDataSource(source);
    setFavoritedIds(new Set());
    setDismissedIds(new Set());
    setActiveTab('recommended');
  }

  function handleReset() {
    setDataSource(null);
    setRawSKUs(null);
    setFavoritedIds(new Set());
    setDismissedIds(new Set());
    localStorage.removeItem('ventory_skus');
    localStorage.removeItem('ventory_source');
    localStorage.removeItem('ventory_favorites');
    localStorage.removeItem('ventory_dismissed');
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

  function toggleFavorite(id: string) {
    setFavoritedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function dismiss(id: string) {
    setDismissedIds((prev) => new Set([...prev, id]));
  }

  if (!dataSource) {
    return <Onboarding onData={handleData} />;
  }

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      urgentCount={liveUrgentCount}
      onReset={handleReset}
      brandName={dataSource === 'csv' ? 'Your Store' : 'Demo Store'}
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
