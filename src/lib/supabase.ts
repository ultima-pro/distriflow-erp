import { createClient, SupabaseClient } from '@supabase/supabase-js';

const getEnvOrStorage = (envKey: string, storageKey: string): string => {
  // 1. Check Vite environment variables
  const envVal = import.meta.env[envKey];
  if (typeof envVal === 'string' && envVal.trim()) {
    return envVal.trim();
  }
  // 2. Check localStorage (allows user configuration in browser when env is not set)
  if (typeof window !== 'undefined' && window.localStorage) {
    const stored = window.localStorage.getItem(storageKey);
    if (stored && stored.trim()) {
      return stored.trim();
    }
  }
  return '';
};

export const getSupabaseUrl = (): string =>
  getEnvOrStorage('VITE_SUPABASE_URL', 'distriflow_supabase_url');

export const getSupabaseAnonKey = (): string =>
  getEnvOrStorage('VITE_SUPABASE_ANON_KEY', 'distriflow_supabase_anon_key');

export const checkIsConfigured = (url?: string, key?: string): boolean => {
  const u = url || getSupabaseUrl();
  const k = key || getSupabaseAnonKey();
  return Boolean(
    u &&
    k &&
    u.startsWith('https://') &&
    u.includes('.supabase.co') &&
    k.length > 20
  );
};

export const isSupabaseConfigured = checkIsConfigured();

const initialUrl = getSupabaseUrl();
const initialKey = getSupabaseAnonKey();

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(initialUrl, initialKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export const setRuntimeSupabaseConfig = (url: string, key: string) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem('distriflow_supabase_url', url.trim());
    window.localStorage.setItem('distriflow_supabase_anon_key', key.trim());
    window.location.reload();
  }
};

export const clearRuntimeSupabaseConfig = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem('distriflow_supabase_url');
    window.localStorage.removeItem('distriflow_supabase_anon_key');
    window.location.reload();
  }
};
