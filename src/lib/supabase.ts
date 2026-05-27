import { createClient } from '@supabase/supabase-js';

// Hardcoded as fallback so the app never hangs when Vercel env vars fail to inject
const SUPABASE_URL = 'https://lecjzzfyiinppqpaoeat.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlY2p6emZ5aWlucHBxcGFvZWF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMjc0MjUsImV4cCI6MjA5NDgwMzQyNX0.QJr8PG6Ov_igtpqv6M8fXZS9xXIeDwpMHytTpKaAp8s';

const url = (import.meta.env.VITE_SUPABASE_URL as string) || SUPABASE_URL;
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || SUPABASE_ANON_KEY;

export const supabase = createClient(url, key);

export type AuthUser = {
  id: string;
  email: string;
};
