import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  X, 
  UserPlus, 
  Trash2, 
  ShieldCheck 
} from 'lucide-react';

export default function UserManagementModal({ isOpen, onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form create new user
  const [showAddForm, setShowAddForm] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('kasir_wifi');

  const fetchUsers = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error: fetchErr } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setUsers(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      setShowAddForm(false);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const email = `${username.toLowerCase().trim()}@bukukas.local`;
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, role, username }
        }
      });

      if (signUpErr) throw signUpErr;

      if (data?.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          username: username.toLowerCase().trim(),
          name,
          role
        });
      }

      setUsername('');
      setPassword('');
      setName('');
      setShowAddForm(false);
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Hapus profil akun ini?')) return;
    try {
      const { error: delErr } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (delErr) throw delErr;
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const getRoleBadge = (r) => {
    switch (r) {
      case 'owner':
        return <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Owner</span>;
      case 'kasir_wifi':
        return <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">Kasir WiFi</span>;
      case 'teknisi':
        return <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">Teknisi Servis</span>;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">Kelola Akun (Supabase Profiles)</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4">
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          {/* Tombol Buka Form Tambah */}
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Akun Baru (Kasir / Teknisi)</span>
            </button>
          ) : (
            <form onSubmit={handleCreateUser} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Form Akun Baru</span>
                <button 
                  type="button" 
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Batal
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Agus Teknisi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase">Username</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: agusteknisi"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase">Password</label>
                <input
                  type="password"
                  required
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase">Role / Hak Akses</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                >
                  <option value="kasir_wifi">Kasir WiFi (Hanya Kas WiFi)</option>
                  <option value="teknisi">Teknisi Servis (Hanya Kas Servis)</option>
                  <option value="owner">Owner / Superadmin (Semua Kas)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow"
              >
                Simpan Akun
              </button>
            </form>
          )}

          {/* List User */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Daftar Pengguna ({users.length})
            </span>

            {loading ? (
              <p className="text-xs text-slate-400 text-center py-4">Memuat data user...</p>
            ) : (
              users.map((u) => (
                <div 
                  key={u.id}
                  className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-800">{u.name}</span>
                      {getRoleBadge(u.role)}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Username: <code className="bg-slate-100 px-1 rounded">{u.username}</code></p>
                  </div>

                  {u.role !== 'owner' && (
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Hapus Akun"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
