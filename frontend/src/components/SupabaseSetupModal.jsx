import React, { useState } from 'react';
import { saveSupabaseConfig, getSupabaseConfig } from '../supabaseClient';
import { Database, Key, Globe, ArrowRight } from 'lucide-react';

export default function SupabaseSetupModal({ isOpen, onClose }) {
  const current = getSupabaseConfig();
  const [url, setUrl] = useState(current.url);
  const [key, setKey] = useState(current.key);
  const [error, setError] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    if (!url || !key) {
      setError('Project URL dan Anon Key wajib diisi.');
      return;
    }
    if (!url.startsWith('https://') && !url.startsWith('http://')) {
      setError('URL Supabase harus dimulai dengan https:// atau http://');
      return;
    }

    saveSupabaseConfig(url, key);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 border border-slate-200">
        <div className="text-center mb-5">
          <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/30 text-white">
            <Database className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Hubungkan Supabase</h2>
          <p className="text-xs text-slate-500 mt-1">
            Database PostgreSQL Realtime & Serverless
          </p>
        </div>

        {error && (
          <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-600 mb-1">
              Supabase Project URL
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="https://xyzcompany.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-[11px]"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Ditemukan di Supabase: Project Settings - API - Project URL</p>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">
              Supabase Anon Public Key
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <textarea
                rows={2}
                required
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-[10px]"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Ditemukan di Supabase: Project Settings - API - Project API Keys (anon public)</p>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 mt-4 transition"
          >
            <span>Simpan & Hubungkan</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
