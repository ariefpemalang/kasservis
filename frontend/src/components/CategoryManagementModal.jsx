import React, { useState } from 'react';
import { 
  getStoredCategories, 
  addCategory, 
  deleteCategory, 
  DEFAULT_CATEGORIES 
} from '../utils/categories';
import { 
  X, 
  Plus, 
  Trash2, 
  Tag, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Wifi, 
  Wrench, 
  User 
} from 'lucide-react';

export default function CategoryManagementModal({ isOpen, onClose, onCategoriesChanged }) {
  const [categories, setCategories] = useState(getStoredCategories());
  const [selectedBook, setSelectedBook] = useState('WIFI');
  const [selectedType, setSelectedType] = useState('INCOME');
  const [newCatName, setNewCatName] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const updated = addCategory(selectedBook, selectedType, newCatName.trim());
    setCategories({ ...updated });
    setNewCatName('');
    if (onCategoriesChanged) onCategoriesChanged();
  };

  const handleDelete = (cat) => {
    const updated = deleteCategory(selectedBook, selectedType, cat);
    setCategories({ ...updated });
    if (onCategoriesChanged) onCategoriesChanged();
  };

  const handleResetDefaults = () => {
    if (!window.confirm('Kembalikan semua kategori ke pengaturan bawaan?')) return;
    localStorage.removeItem('bukukas_custom_categories');
    setCategories(DEFAULT_CATEGORIES);
    if (onCategoriesChanged) onCategoriesChanged();
  };

  const currentList = categories[selectedBook]?.[selectedType] || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">Kelola Kategori Transaksi</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4">
          
          {/* Pilih Buku Kas */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Pilih Buku Kas
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedBook('WIFI')}
                className={`py-2 px-1 text-xs font-semibold rounded-xl border flex flex-col items-center gap-1 transition ${
                  selectedBook === 'WIFI' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'
                }`}
              >
                <Wifi className="w-4 h-4 text-blue-600" />
                WiFi
              </button>
              <button
                type="button"
                onClick={() => setSelectedBook('SERVIS')}
                className={`py-2 px-1 text-xs font-semibold rounded-xl border flex flex-col items-center gap-1 transition ${
                  selectedBook === 'SERVIS' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-600'
                }`}
              >
                <Wrench className="w-4 h-4 text-amber-600" />
                Servis
              </button>
              <button
                type="button"
                onClick={() => setSelectedBook('PRIBADI')}
                className={`py-2 px-1 text-xs font-semibold rounded-xl border flex flex-col items-center gap-1 transition ${
                  selectedBook === 'PRIBADI' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-slate-200 text-slate-600'
                }`}
              >
                <User className="w-4 h-4 text-purple-600" />
                Pribadi
              </button>
            </div>
          </div>

          {/* Toggle Pemasukan (Hijau) / Pengeluaran (Merah) */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setSelectedType('INCOME')}
              className={`py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                selectedType === 'INCOME' ? 'bg-emerald-600 text-white shadow' : 'text-slate-600'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              Pemasukan (Hijau)
            </button>
            <button
              type="button"
              onClick={() => setSelectedType('EXPENSE')}
              className={`py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                selectedType === 'EXPENSE' ? 'bg-rose-600 text-white shadow' : 'text-slate-600'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              Pengeluaran (Merah)
            </button>
          </div>

          {/* Form Tambah Kategori Baru */}
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              type="text"
              placeholder={`Tambah kategori ${selectedType === 'INCOME' ? 'pemasukan' : 'pengeluaran'}...`}
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="submit"
              className={`py-2 px-4 rounded-xl text-white font-bold text-xs flex items-center gap-1 shadow transition ${
                selectedType === 'INCOME' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Tambah</span>
            </button>
          </form>

          {/* Daftar Kategori Saat Ini */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Daftar Kategori ({currentList.length})
              </span>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="text-[10px] text-slate-400 hover:text-slate-600 underline"
              >
                Reset Bawaan
              </button>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
              {currentList.map((cat, idx) => (
                <div key={idx} className="p-2.5 flex items-center justify-between bg-white text-xs">
                  <div className="flex items-center gap-2">
                    <span 
                      className={`w-2.5 h-2.5 rounded-full ${selectedType === 'INCOME' ? 'bg-emerald-500' : 'bg-rose-500'}`}
                    />
                    <span className="font-medium text-slate-700">{cat}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(cat)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Hapus Kategori"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
