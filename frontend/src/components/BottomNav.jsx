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
  onAddNew, 
  onOpenReport, 
  onOpenCategoryReport,
  onOpenSettings
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-1 shadow-2xl safe-area-bottom">
      <div className="max-w-md mx-auto flex items-center justify-around relative">
        
        {/* Tab 1: Riwayat */}
        <button
          onClick={() => {
            if (setActiveTab) setActiveTab('RIWAYAT');
          }}
          className={`flex-1 py-1.5 flex flex-col items-center justify-center transition ${
            activeTab === 'RIWAYAT' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <ClipboardList className="w-5 h-5 stroke-[2]" />
          <span className="text-[10px] mt-0.5">Riwayat</span>
        </button>

        {/* Tab 2: Grafik */}
        <button
          onClick={() => {
            if (onOpenCategoryReport) onOpenCategoryReport();
          }}
          className="flex-1 py-1.5 flex flex-col items-center justify-center text-slate-500 hover:text-blue-600 transition"
        >
          <PieChart className="w-5 h-5 stroke-[2]" />
          <span className="text-[10px] mt-0.5">Grafik</span>
        </button>

        {/* Tab 3: Center Elevated Floating [+] Button */}
        <div className="flex-1 flex justify-center -mt-6">
          <button
            onClick={onAddNew}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-sky-500 text-white shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform border-4 border-white"
            title="Tambah Catatan Transaksi"
          >
            <Plus className="w-8 h-8 stroke-[3]" />
          </button>
        </div>

        {/* Tab 4: Laporan */}
        <button
          onClick={() => {
            if (onOpenReport) onOpenReport();
          }}
          className="flex-1 py-1.5 flex flex-col items-center justify-center text-slate-500 hover:text-blue-600 transition"
        >
          <FileSpreadsheet className="w-5 h-5 stroke-[2]" />
          <span className="text-[10px] mt-0.5">Laporan</span>
        </button>

        {/* Tab 5: Pengaturan */}
        <button
          onClick={() => {
            if (onOpenSettings) onOpenSettings();
          }}
          className="flex-1 py-1.5 flex flex-col items-center justify-center text-slate-500 hover:text-blue-600 transition"
        >
          <Settings className="w-5 h-5 stroke-[2]" />
          <span className="text-[10px] mt-0.5">Pengaturan</span>
        </button>

      </div>
    </div>
  );
}