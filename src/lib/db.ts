import { supabase } from './supabase';
import type { SKU } from '../types';

// ── SKU data ───────────────────────────────────────────────────────────────
export async function saveSKUs(userId: string, skus: SKU[], source: string) {
  const { error } = await supabase
    .from('brands')
    .upsert({ user_id: userId, skus, source, updated_at: new Date().toISOString() }, {
      onConflict: 'user_id',
    });
  return error;
}

export async function loadSKUs(userId: string): Promise<{ skus: SKU[] | null; source: string | null }> {
  const { data, error } = await supabase
    .from('brands')
    .select('skus, source')
    .eq('user_id', userId)
    .single();

  if (error || !data) return { skus: null, source: null };
  return { skus: data.skus as SKU[], source: data.source };
}

// ── Decision actions (favorites + dismissals) ─────────────────────────────
export async function saveDecisionAction(
  userId: string,
  decisionId: string,
  action: 'favorited' | 'dismissed'
) {
  const { error } = await supabase
    .from('decisions')
    .upsert({ user_id: userId, decision_id: decisionId, action }, {
      onConflict: 'user_id,decision_id',
    });
  return error;
}

export async function removeDecisionAction(userId: string, decisionId: string) {
  const { error } = await supabase
    .from('decisions')
    .delete()
    .eq('user_id', userId)
    .eq('decision_id', decisionId);
  return error;
}

export async function loadDecisionActions(userId: string): Promise<{
  favoritedIds: Set<string>;
  dismissedIds: Set<string>;
}> {
  const { data, error } = await supabase
    .from('decisions')
    .select('decision_id, action')
    .eq('user_id', userId);

  if (error || !data) return { favoritedIds: new Set(), dismissedIds: new Set() };

  const favoritedIds = new Set(data.filter((d) => d.action === 'favorited').map((d) => d.decision_id));
  const dismissedIds = new Set(data.filter((d) => d.action === 'dismissed').map((d) => d.decision_id));
  return { favoritedIds, dismissedIds };
}
