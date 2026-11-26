import React from 'react';
import { 
  ClipboardList, 
  PieChart, 
  Plus, 
  FileSpreadsheet, 
  Settings 
} from 'lucide-react';

export default function BottomNav({ 
  activeTab = 'RIWAYAT',
  setActiveTab,
  currentBook,
  currentTheme,
  onAddNew, 
  onOpenReport, 
  onOpenCategoryReport,
  onOpenSettings
}) {
  const activeColor = currentTheme?.activeTab || 'text-blue-600';
  const fabBg = currentTheme?.fabGradient || 'from-blue-600 to-sky-500';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-1 shadow-2xl safe-area-bottom">
      <div className="max-w-md mx-auto flex items-center justify-around relative">
        
        {/* Tab 1: Riwayat */}
        <button
          onClick={() => {
            if (setActiveTab) setActiveTab('RIWAYAT');
          }}
          className={`flex-1 py-1.5 flex flex-col items-center justify-center transition ${
            activeTab === 'RIWAYAT' ? `${activeColor} font-bold` : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <ClipboardList className="w-5 h-5 stroke-[2]" />
          <span className="text-[10px] mt-0.5">Riwayat</span>
        </button>

        {/* Tab 2: Center Elevated Floating [+] Button */}
        <div className="flex-1 flex justify-center -mt-6">
          <button
            onClick={onAddNew}
            className={`w-14 h-14 rounded-full bg-gradient-to-tr ${fabBg} ${currentTheme?.fabTextColor || 'text-white'} shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform border-4 ${currentTheme?.fabBorder || 'border-white'}`}
            title="Tambah Catatan Transaksi"
          >
            <Plus className={`w-8 h-8 stroke-[3.5] ${currentTheme?.fabTextColor || 'text-white'}`} />
          </button>
        </div>

        {/* Tab 3: Laporan */}
        <button
          onClick={() => {
            if (onOpenReport) onOpenReport();
          }}
          className="flex-1 py-1.5 flex flex-col items-center justify-center text-slate-500 hover:text-slate-800 transition"
        >
          <FileSpreadsheet className="w-5 h-5 stroke-[2]" />
          <span className="text-[10px] mt-0.5">Laporan</span>
        </button>

        {/* Tab 4: Pengaturan (Hanya muncul jika bukan Buku Servis dan bukan Buku WiFi) */}
        {currentBook !== 'SERVIS' && currentBook !== 'WIFI' && (
          <button
            onClick={() => {
              if (onOpenSettings) onOpenSettings();
            }}
            className="flex-1 py-1.5 flex flex-col items-center justify-center text-slate-500 hover:text-slate-800 transition"
          >
            <Settings className="w-5 h-5 stroke-[2]" />
            <span className="text-[10px] mt-0.5">Pengaturan</span>
          </button>
        )}

      </div>
    </div>
  );
}