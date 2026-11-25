import { createClient } from '@supabase/supabase-js';

const DEFAULT_URL = 'https://umysveuuvouchvnakgwu.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVteXN2ZXV1dm91Y2h2bmFrZ3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM5ODgyNzksImV4cCI6MjEwOTU2NDI3OX0.-H1ZhcT50KXLSlfFN7qCwxzZ1lgyC4-ZjRsLPLoxVOY';

// Ambil konfigurasi: prioritaskan localStorage -> env -> default
const getStoredUrl = () => {
  return localStorage.getItem('bukukas_supabase_url') || import.meta.env.VITE_SUPABASE_URL || DEFAULT_URL;
};

const getStoredKey = () => {
  return localStorage.getItem('bukukas_supabase_anon_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_KEY;
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

export const supabase = createClient(url, key, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});
