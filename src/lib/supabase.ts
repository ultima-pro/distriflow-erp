import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const DEFAULT_SUPABASE_URL = 'https://xbfyhxjsdwtldfhhwemw.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY =
  'sb_publishable_aemoY5C0WnFaGklSQ70k4w_5aBXWhcK';

export const normalizeSupabaseUrl = (raw: string): string => {
  let url = raw.trim();
  url = url.replace(/\/rest\/v1\/?$/, '');
  url = url.replace(/\/+$/, '');
  return url;
};

const getEnvOrStorage = (envKey: string, storageKey: string, fallback: string = ''): string => {
  // 1. Check Vite environment variables
  const envVal = import.meta.env[envKey];
  if (typeof envVal === 'string' && envVal.trim()) {
    return normalizeSupabaseUrl(envVal.trim());
  }
  // 2. Check localStorage (allows user configuration in browser when env is not set)
  if (typeof window !== 'undefined' && window.localStorage) {
    const stored = window.localStorage.getItem(storageKey);
    if (stored && stored.trim()) {
      return normalizeSupabaseUrl(stored.trim());
    }
  }
  return fallback;
};

export const getSupabaseUrl = (): string =>
  getEnvOrStorage('VITE_SUPABASE_URL', 'distriflow_supabase_url', DEFAULT_SUPABASE_URL);

export const getSupabaseAnonKey = (): string => {
  const envVal = import.meta.env['VITE_SUPABASE_ANON_KEY'];
  if (typeof envVal === 'string' && envVal.trim()) {
    return envVal.trim();
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    const stored = window.localStorage.getItem('distriflow_supabase_anon_key');
    if (stored && stored.trim()) {
      return stored.trim();
    }
  }
  return DEFAULT_SUPABASE_ANON_KEY;
};

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
    window.localStorage.setItem('distriflow_supabase_url', normalizeSupabaseUrl(url.trim()));
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
