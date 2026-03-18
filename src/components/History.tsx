import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { OperationType, handleFirestoreError } from '../firebase';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  User,
  MessageSquare,
  Wallet
} from 'lucide-react';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';
import { cn } from '../utils';

const History: React.FC = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'verified' | 'pending' | 'rejected'>('all');

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'salamis'),
      where('receiverUid', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setTransactions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'salamis');
    });

    return () => unsubscribe();
  }, []);

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.senderName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.trxId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || t.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20">
      {/* Background Glows */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -z-10" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-secondary/5 blur-[120px] rounded-full -z-10" />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-4">
        <div className="space-y-3">
          <h1 className="text-5xl font-black text-white tracking-tighter leading-none">
            লেনদেনের <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">ইতিহাস</span>
          </h1>
          <p className="text-slate-400 text-lg font-medium max-w-xl">আপনার সকল সালামি প্রাপ্তির খতিয়ান এখানে সংরক্ষিত আছে।</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="glass-card px-8 py-4 border-white/10 flex items-center gap-4 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 relative z-10">
              <Clock size={24} />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">মোট লেনদেন</p>
              <p className="text-3xl font-black text-white leading-none tracking-tighter">{transactions.length}</p>
            </div>
          </div>
          <div className="glass-card px-8 py-4 border-white/10 flex items-center gap-4 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500 border border-green-500/20 relative z-10">
              <CheckCircle2 size={24} />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">সফল</p>
              <p className="text-3xl font-black text-white leading-none tracking-tighter">
                {transactions.filter(t => t.status === 'verified').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-2 relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={22} />
          <input 
            type="text" 
            placeholder="নাম বা TrxID দিয়ে খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-14 py-4 text-lg"
          />
        </div>
        <div className="lg:col-span-1 relative group">
          <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={22} />
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="input-field pl-14 py-4 text-lg appearance-none cursor-pointer"
          >
            <option value="all">সব স্ট্যাটাস</option>
            <option value="verified">ভেরিফাইড</option>
            <option value="pending">পেন্ডিং</option>
            <option value="rejected">রিজেক্টেড</option>
          </select>
        </div>
        <div className="lg:col-span-1">
          <button className="w-full h-full btn-secondary flex items-center justify-center gap-3 py-4">
            <Calendar size={22} />
            <span>তারিখ ফিল্টার</span>
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="glass-card overflow-hidden border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-800">
                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-slate-500">প্রেরক ও আইডি</th>
                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-slate-500">পরিমাণ</th>
                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-slate-500">পদ্ধতি</th>
                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-slate-500">তারিখ ও সময়</th>
                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-slate-500">স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredTransactions.length > 0 ? filteredTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-8">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-slate-500 group-hover:bg-primary/20 group-hover:text-primary transition-all shadow-inner">
                        <User size={24} />
                      </div>
                      <div>
                        <p className="text-lg font-black text-white tracking-tight leading-none mb-1">{t.senderName || 'অজ্ঞাত'}</p>
                        <p className="text-xs text-slate-500 font-mono tracking-wider">{t.trxId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-8">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                        <ArrowDownLeft size={16} />
                      </div>
                      <span className="text-2xl font-black text-white tracking-tighter">৳{t.amount}</span>
                    </div>
                  </td>
                  <td className="p-8">
                    <div className="flex items-center gap-3 bg-slate-900/50 px-4 py-2 rounded-xl border border-white/5 w-fit">
                      <Wallet size={18} className="text-slate-500" />
                      <span className="text-sm font-black text-slate-300 uppercase tracking-widest">{t.gateway}</span>
                    </div>
                  </td>
                  <td className="p-8">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-white font-bold text-sm">
                        <Calendar size={14} className="text-primary" />
                        <span>{format(t.createdAt.toDate(), 'd MMM, yyyy', { locale: bn })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 text-xs font-medium pl-5">
                        <Clock size={12} />
                        <span>{format(t.createdAt.toDate(), 'p', { locale: bn })}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-8">
                    <StatusBadge status={t.status} />
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="p-32 text-center">
                    <div className="flex flex-col items-center gap-6">
                      <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center text-slate-800 shadow-inner">
                        <Filter size={48} />
                      </div>
                      <div className="space-y-2">
                        <p className="text-2xl font-black text-white tracking-tight">কোনো লেনদেন পাওয়া যায়নি</p>
                        <p className="text-slate-500 font-medium">আপনার সার্চ বা ফিল্টার পরিবর্তন করে দেখুন।</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config = {
    verified: {
      color: 'bg-green-500/10 text-green-500 border-green-500/20',
      icon: <CheckCircle2 size={14} />,
      label: 'ভেরিফাইড'
    },
    pending: {
      color: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      icon: <Clock size={14} />,
      label: 'পেন্ডিং'
    },
    rejected: {
      color: 'bg-red-500/10 text-red-500 border-red-500/20',
      icon: <XCircle size={14} />,
      label: 'রিজেক্টেড'
    }
  }[status as keyof typeof config] || {
    color: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    icon: <Clock size={14} />,
    label: status
  };

  return (
    <div className={cn(
      "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
      config.color
    )}>
      {config.icon}
      <span>{config.label}</span>
    </div>
  );
};

export default History;
