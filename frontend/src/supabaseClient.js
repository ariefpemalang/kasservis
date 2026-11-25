import { createClient } from '@supabase/supabase-js';

// Ambil konfigurasi dari Environment Variables (.env) atau dari LocalStorage
const getStoredUrl = () => {
  return import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('bukukas_supabase_url') || '';
};

const getStoredKey = () => {
  return import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('bukukas_supabase_anon_key') || '';
};

export const getSupabaseConfig = () => ({
  url: getStoredUrl(),
  key: getStoredKey()
});

export const saveSupabaseConfig = (url, key) => {
  localStorage.setItem('bukukas_supabase_url', url.trim());
  localStorage.setItem('bukukas_supabase_anon_key', key.trim());
  window.location.reload();
};

export const isSupabaseConfigured = () => {
  const { url, key } = getSupabaseConfig();
  return Boolean(url && key && url.startsWith('http') && key.length > 20);
};

const { url, key } = getSupabaseConfig();

export const supabase = isSupabaseConfigured()
  ? createClient(url, key, {
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  : null;
