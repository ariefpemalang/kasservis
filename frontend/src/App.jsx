import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import Login from './components/Login';
import HeaderCard from './components/HeaderCard';
import TransactionList from './components/TransactionList';
import TransactionModal from './components/TransactionModal';
import UserManagementModal from './components/UserManagementModal';
import ReportModal from './components/ReportModal';
import BottomNav from './components/BottomNav';
import SupabaseSetupModal from './components/SupabaseSetupModal';

export default function App() {
  const { user, profile, loading: authLoading, isOwner, isKasir, isTeknisi } = useAuth();

  // Supabase Config Modal
  const [configModalOpen, setConfigModalOpen] = useState(!isSupabaseConfigured());

  // Active book state
  const [currentBook, setCurrentBook] = useState('ALL');

  // Filter states
  const [filterType, setFilterType] = useState('ALL'); // ALL, INCOME, EXPENSE
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Data states
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  // Modal states
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [modalType, setModalType] = useState('INCOME');
  const [editingTx, setEditingTx] = useState(null);
  const [userMgmtOpen, setUserMgmtOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  // Set default book based on user role upon login
  useEffect(() => {
    if (profile) {
      if (isKasir) setCurrentBook('WIFI');
      else if (isTeknisi) setCurrentBook('SERVIS');
      else if (isOwner) setCurrentBook('ALL');
    }
  }, [profile, isKasir, isTeknisi, isOwner]);

  // Fetch transactions and calculate summary directly from Supabase
  const fetchData = useCallback(async () => {
    if (!user || !supabase) return;
    setLoading(true);

    try {
      let query = supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      // RBAC Filter
      if (isKasir) {
        query = query.eq('book', 'WIFI');
      } else if (isTeknisi) {
        query = query.eq('book', 'SERVIS');
      } else if (isOwner) {
        if (currentBook !== 'ALL') {
          query = query.eq('book', currentBook);
        }
      }

      // Filter Type
      if (filterType !== 'ALL') {
        query = query.eq('type', filterType);
      }

      // Filter Search
      if (search) {
        query = query.ilike('notes', `%${search}%`);
      }

      // Filter Date
      if (startDate) {
        query = query.gte('date', new Date(startDate).toISOString());
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query = query.lte('date', end.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      setTransactions(data || []);

      // Hitung Summary secara dinamis
      // Ambil seluruh data transaksi (tanpa paginasi/search) untuk ringkasan akurat
      let sumQuery = supabase.from('transactions').select('book, type, amount, date');
      if (startDate) sumQuery = sumQuery.gte('date', new Date(startDate).toISOString());
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        sumQuery = sumQuery.lte('date', end.toISOString());
      }

      const { data: allTx, error: sumErr } = await sumQuery;
      if (!sumErr && allTx) {
        const calc = {
          WIFI: { totalIncome: 0, totalExpense: 0, balance: 0 },
          SERVIS: { totalIncome: 0, totalExpense: 0, balance: 0 },
          PRIBADI: { totalIncome: 0, totalExpense: 0, balance: 0 }
        };

        allTx.forEach((t) => {
          const amt = parseFloat(t.amount) || 0;
          if (calc[t.book]) {
            if (t.type === 'INCOME') calc[t.book].totalIncome += amt;
            else if (t.type === 'EXPENSE') calc[t.book].totalExpense += amt;
            calc[t.book].balance = calc[t.book].totalIncome - calc[t.book].totalExpense;
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
      console.error('Error fetching data from Supabase:', err);
    } finally {
      setLoading(false);
    }
  }, [user, profile, currentBook, filterType, search, startDate, endDate, isKasir, isTeknisi, isOwner]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // SUPABASE REALTIME SUBSCRIPTION
  useEffect(() => {
    if (!supabase || !user) return;

    const channel = supabase
      .channel('realtime:transactions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        (payload) => {
          console.log('Realtime change detected in Supabase:', payload);
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

  // Actions
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
    setModalType(tx.type);
    setTxModalOpen(true);
  };

  const handleDelete = async (txId) => {
    if (!window.confirm('Hapus transaksi ini?')) return;
    try {
      const { error } = await supabase
        .from('transactions')
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
    <div className="min-h-screen bg-slate-100 flex justify-center">
      {/* Mobile container - optimized for phone screens and responsive on desktop */}
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative flex flex-col">
        
        {/* Header Card with Realtime Balance */}
        <HeaderCard
          currentBook={currentBook}
          setCurrentBook={setCurrentBook}
          summary={summary}
          realtimeConnected={realtimeConnected}
          onOpenReport={() => setReportOpen(true)}
          onOpenUserMgmt={() => setUserMgmtOpen(true)}
          onOpenConfig={() => setConfigModalOpen(true)}
        />

        {/* Transaction List */}
        <TransactionList
          transactions={transactions}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          filterType={filterType}
          setFilterType={setFilterType}
          search={search}
          setSearch={setSearch}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
        />

        {/* Bottom Floating Bar with [+] Pemasukan & [-] Pengeluaran */}
        <BottomNav
          currentBook={currentBook}
          setCurrentBook={setCurrentBook}
          onAddIncome={handleAddIncome}
          onAddExpense={handleAddExpense}
          onOpenReport={() => setReportOpen(true)}
        />

        {/* Modals */}
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

        <SupabaseSetupModal
          isOpen={configModalOpen}
          onClose={() => setConfigModalOpen(false)}
        />

      </div>
    </div>
  );
}
