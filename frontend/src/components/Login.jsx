import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { BookOpen, Lock, User, Wifi, Wrench, ShieldCheck, ArrowRight, Settings } from 'lucide-react';

export default function Login({ onOpenConfig }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoCreateDefaultAccounts = async () => {
    if (!supabase) return;
    setSeeding(true);
    setError('');

    try {
      const defaults = [
        { email: 'admin@bukukas.local', password: 'admin123', name: 'Owner Superadmin', role: 'owner', username: 'admin' },
        { email: 'kasir@bukukas.local', password: 'kasir123', name: 'Kasir WiFi', role: 'kasir_wifi', username: 'kasir' },
        { email: 'teknisi@bukukas.local', password: 'teknisi123', name: 'Teknisi Servis', role: 'teknisi', username: 'teknisi' }
      ];

      for (const d of defaults) {
        const { data: signUpData } = await supabase.auth.signUp({
          email: d.email,
          password: d.password,
          options: {
            data: { name: d.name, role: d.role, username: d.username }
          }
        });

        if (signUpData?.user) {
          await supabase.from('bukukas_profiles').upsert({
            id: signUpData.user.id,
            username: d.username,
            name: d.name,
            role: d.role
          });
        }
      }

      alert('Berhasil membuat akun bawaan: admin, kasir, dan teknisi! Silakan klik tombol akun untuk login.');
    } catch (err) {
      setError('Gagal membuat akun otomatis: ' + err.message);
    } finally {
      setSeeding(false);
    }
  };

  const setPreset = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-600 via-teal-700 to-slate-900 flex flex-col justify-center items-center px-4 py-8 relative">
      <button
        onClick={onOpenConfig}
        className="absolute top-4 right-4 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl backdrop-blur-md transition flex items-center gap-1.5 text-xs"
        title="Pengaturan URL & Key Supabase"
      >
        <Settings className="w-4 h-4" />
        <span className="hidden sm:inline">Koneksi Supabase</span>
      </button>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/20">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/30">
            <BookOpen className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Buku Kas Digital</h1>
          <p className="text-xs text-slate-500 mt-1">Realtime Supabase • WiFi, Servis & Pribadi</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <span className="font-semibold">Perhatian:</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Username
            </label>
            <div className="relative">
              <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Contoh: admin / kasir / teknisi"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium rounded-xl shadow-lg shadow-emerald-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
          >
            {loading ? (
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
            ) : (
              <>
                <span>Masuk ke Buku Kas</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
            Akun Login Cepat (Klik untuk coba):
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPreset('admin', 'admin123')}
              className="p-2.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl flex flex-col items-center transition text-center"
            >
              <ShieldCheck className="w-5 h-5 text-emerald-600 mb-1" />
              <span className="text-[11px] font-bold text-slate-800">Owner</span>
              <span className="text-[9px] text-slate-400">admin123</span>
            </button>

            <button
              type="button"
              onClick={() => setPreset('kasir', 'kasir123')}
              className="p-2.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl flex flex-col items-center transition text-center"
            >
              <Wifi className="w-5 h-5 text-blue-600 mb-1" />
              <span className="text-[11px] font-bold text-slate-800">Kasir</span>
              <span className="text-[9px] text-slate-400">kasir123</span>
            </button>

            <button
              type="button"
              onClick={() => setPreset('teknisi', 'teknisi123')}
              className="p-2.5 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-xl flex flex-col items-center transition text-center"
            >
              <Wrench className="w-5 h-5 text-amber-600 mb-1" />
              <span className="text-[11px] font-bold text-slate-800">Teknisi</span>
              <span className="text-[9px] text-slate-400">teknisi123</span>
            </button>
          </div>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={handleAutoCreateDefaultAccounts}
              disabled={seeding}
              className="text-[11px] text-emerald-600 hover:underline font-medium"
            >
              {seeding ? 'Membuat akun bawaan...' : 'Akun belum ada di Supabase? Buat Akun Bawaan Otomatis'}
            </button>
          </div>
        </div>
      </div>
      
      <p className="text-[11px] text-emerald-100/70 mt-6 text-center">
        Buku Kas Realtime • Supabase Database
      </p>
    </div>
  );
}
