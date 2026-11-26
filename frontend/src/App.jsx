import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import Login from './components/Login';
import HeaderCard from './components/HeaderCard';
import TransactionList from './components/TransactionList';
import TransactionModal from './components/TransactionModal';
import UserManagementModal from './components/UserManagementModal';
import ReportModal from './components/ReportModal';
import CategoryManagementModal from './components/CategoryManagementModal';
import BottomNav from './components/BottomNav';
import SupabaseSetupModal from './components/SupabaseSetupModal';
import ThemeModal from './components/ThemeModal';
import { getCurrentTheme, getStoredPribadiTheme, savePribadiTheme } from './utils/theme';

export default function App() {
  const { user, profile, loading: authLoading, isOwner, isKasir, isTeknisi } = useAuth();

  const [configModalOpen, setConfigModalOpen] = useState(!isSupabaseConfigured());
  const [currentBook, setCurrentBook] = useState('SERVIS');

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [searchVisible, setSearchVisible] = useState(false);
  const [bottomNavTab, setBottomNavTab] = useState('RIWAYAT');
  const [pribadiTheme, setPribadiTheme] = useState(getStoredPribadiTheme());
  const [themeModalOpen, setThemeModalOpen] = useState(false);

  const currentTheme = getCurrentTheme(currentBook, pribadiTheme);

  const handleSelectPribadiTheme = (themeId) => {
    setPribadiTheme(themeId);
    savePribadiTheme(themeId);
  };

  const [filterType, setFilterType] = useState('ALL'); // ALL, INCOME, EXPENSE
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Mengatur startDate & endDate otomatis berdasarkan bulan yang dipilih
  const handleChangeMonth = (year, month) => {
    setSelectedYear(year);
    setSelectedMonth(month);
    const lastDay = new Date(year, month, 0).getDate();
    setStartDate(`${year}-${String(month).padStart(2, '0')}-01`);
    setEndDate(`${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`);
  };

  // Set rentang tanggal bulan berjalan saat pertama load
  useEffect(() => {
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const lastDay = new Date(y, m, 0).getDate();
    setStartDate(`${y}-${String(m).padStart(2, '0')}-01`);
    setEndDate(`${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`);
  }, []);

  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  const [txModalOpen, setTxModalOpen] = useState(false);
  const [modalType, setModalType] = useState('INCOME');
  const [editingTx, setEditingTx] = useState(null);
  const [userMgmtOpen, setUserMgmtOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  useEffect(() => {
    if (profile) {
      if (isKasir) setCurrentBook('WIFI');
      else if (isTeknisi) setCurrentBook('SERVIS');
      else if (isOwner && currentBook === 'ALL') setCurrentBook('SERVIS');
    }
  }, [profile, isKasir, isTeknisi, isOwner]);

  const fetchData = useCallback(async () => {
    if (!user || !supabase) return;
    setLoading(true);

    try {
      let query = supabase
        .from('bukukas_transactions')
        .select('*')
        .order('date', { ascending: false });

      if (isKasir) {
        query = query.eq('book', 'WIFI');
      } else if (isTeknisi) {
        query = query.eq('book', 'SERVIS');
      } else if (isOwner) {
        if (currentBook !== 'ALL') {
          query = query.eq('book', currentBook);
        }
      }

      if (filterType !== 'ALL') {
        const typeFilter = filterType === 'INCOME' ? ['in', 'INCOME'] : ['out', 'EXPENSE'];
        query = query.in('type', typeFilter);
      }

      if (search) {
        query = query.or(`notes.ilike.%${search}%,category.ilike.%${search}%`);
      }

      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;

      setTransactions(data || []);

      // Hitung ringkasan dinamis dari tabel bukukas_transactions
      const { data: allTx, error: sumErr } = await supabase
        .from('bukukas_transactions')
        .select('book, type, amount, date');

      if (!sumErr && allTx) {
        const calc = {
          WIFI: { totalIncome: 0, totalExpense: 0, balance: 0 },
          SERVIS: { totalIncome: 0, totalExpense: 0, balance: 0 },
          PRIBADI: { totalIncome: 0, totalExpense: 0, balance: 0 }
        };

        allTx.forEach((t) => {
          const amt = parseFloat(t.amount) || 0;
          const targetBook = t.book || 'PRIBADI';
          const isInc = t.type === 'INCOME' || t.type === 'in';
          const isExp = t.type === 'EXPENSE' || t.type === 'out';

          if (calc[targetBook]) {
            if (isInc) calc[targetBook].totalIncome += amt;
            else if (isExp) calc[targetBook].totalExpense += amt;
            calc[targetBook].balance = calc[targetBook].totalIncome - calc[targetBook].totalExpense;
          }
        });

        const grandIncome = calc.WIFI.totalIncome + calc.SERVIS.totalIncome + calc.PRIBADI.totalIncome;
        const grandExpense = calc.WIFI.totalExpense + calc.SERVIS.totalExpense + calc.PRIBADI.totalExpense;

        setSummary({
          books: calc,
          grandTotal: {
            totalIncome: grandIncome,
            totalExpense: grandExpense,
            balance: grandIncome - grandExpense
          }
        });
      }

    } catch (err) {
      console.error('Error fetching data from Supabase bukukas_transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [user, profile, currentBook, filterType, search, startDate, endDate, isKasir, isTeknisi, isOwner]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!supabase || !user) return;

    const channel = supabase
      .channel('realtime:bukukas_transactions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bukukas_transactions' },
        () => {
          fetchData();
        }
      )
      .subscribe((status) => {
        setRealtimeConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchData]);

  const handleAddIncome = () => {
    setEditingTx(null);
    setModalType('INCOME');
    setTxModalOpen(true);
  };

  const handleAddExpense = () => {
    setEditingTx(null);
    setModalType('EXPENSE');
    setTxModalOpen(true);
  };

  const handleEdit = (tx) => {
    setEditingTx(tx);
    setModalType(tx.type === 'in' || tx.type === 'INCOME' ? 'INCOME' : 'EXPENSE');
    setTxModalOpen(true);
  };

  const handleDelete = async (txId) => {
    if (!window.confirm('Hapus transaksi ini?')) return;
    try {
      const { error } = await supabase
        .from('bukukas_transactions')
        .delete()
        .eq('id', txId);

      if (error) throw error;
      fetchData();
    } catch (err) {
      alert('Gagal menghapus: ' + err.message);
    }
  };

  if (!isSupabaseConfigured()) {
    return (
      <SupabaseSetupModal 
        isOpen={true} 
        onClose={() => {}} 
      />
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Login onOpenConfig={() => setConfigModalOpen(true)} />;
  }

  return (
    <div className={`min-h-screen ${currentTheme?.isDark ? 'bg-black' : 'bg-slate-100'} flex justify-center`}>
      <div className={`w-full max-w-md ${currentTheme?.isDark ? 'bg-[#121212]' : 'bg-white'} min-h-screen shadow-2xl relative flex flex-col`}>
        <HeaderCard
          currentBook={currentBook}
          setCurrentBook={setCurrentBook}
          currentTheme={currentTheme}
          summary={summary}
          realtimeConnected={realtimeConnected}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          onChangeMonth={handleChangeMonth}
          searchVisible={searchVisible}
          setSearchVisible={setSearchVisible}
          onOpenReport={() => setReportOpen(true)}
          onOpenUserMgmt={() => setUserMgmtOpen(true)}
          onOpenConfig={() => setConfigModalOpen(true)}
          onOpenCategories={() => setCategoryModalOpen(true)}
          onOpenThemeModal={() => setThemeModalOpen(true)}
        />

        <TransactionList
          transactions={transactions}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          search={search}
          setSearch={setSearch}
          searchVisible={searchVisible}
          currentTheme={currentTheme}
        />

        <BottomNav
          activeTab={bottomNavTab}
          setActiveTab={setBottomNavTab}
          currentTheme={currentTheme}
          onAddNew={() => {
            setEditingTx(null);
            setModalType('INCOME');
            setTxModalOpen(true);
          }}
          onOpenReport={() => setReportOpen(true)}
          onOpenCategoryReport={() => setReportOpen(true)}
          onOpenSettings={() => {
            if (isOwner) {
              setCategoryModalOpen(true);
            } else {
              alert('Hanya Superadmin / Owner yang memiliki izin untuk mengelola kategori.');
            }
          }}
        />

        <TransactionModal
          isOpen={txModalOpen}
          onClose={() => setTxModalOpen(false)}
          initialType={modalType}
          currentBook={currentBook}
          editingTx={editingTx}
          onSuccess={fetchData}
        />

        <UserManagementModal
          isOpen={userMgmtOpen}
          onClose={() => setUserMgmtOpen(false)}
        />

        <ReportModal
          isOpen={reportOpen}
          onClose={() => setReportOpen(false)}
          transactions={transactions}
          currentBook={currentBook}
          summary={summary}
        />

        <CategoryManagementModal
          isOpen={categoryModalOpen}
          onClose={() => setCategoryModalOpen(false)}
        />

        <ThemeModal
          isOpen={themeModalOpen}
          onClose={() => setThemeModalOpen(false)}
          selectedTheme={pribadiTheme}
          onSelectTheme={handleSelectPribadiTheme}
        />

        <SupabaseSetupModal
          isOpen={configModalOpen}
          onClose={() => setConfigModalOpen(false)}
        />
      </div>
    </div>
  );
}
