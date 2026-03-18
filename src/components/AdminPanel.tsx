import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, getDocs } from 'firebase/firestore';
import { OperationType, handleFirestoreError } from '../firebase';
import { 
  Users, 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Search,
  Filter,
  MoreVertical,
  Trash2,
  Lock,
  Unlock,
  Eye,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';
import { cn } from '../utils';

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'transactions'>('users');
  const [searchTerm, setSearchTerm] = useState('');

  const isAdmin = auth.currentUser?.email === 'badhon223466@gmail.com';

  useEffect(() => {
    if (!isAdmin) return;

    const unsubUsers = onSnapshot(collection(db, 'profiles'), (snap) => {
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubTrx = onSnapshot(query(collection(db, 'salamis'), orderBy('createdAt', 'desc')), (snap) => {
      setTransactions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => {
      unsubUsers();
      unsubTrx();
    };
  }, [isAdmin]);

  const handleVerify = async (id: string, status: 'verified' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'salamis', id), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `salamis/${id}`);
    }
  };

  if (!isAdmin) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
        <Shield size={40} />
      </div>
      <h1 className="text-2xl font-bold text-white">অ্যাক্সেস ডিনাইড</h1>
      <p className="text-slate-400 text-center max-w-md">আপনার এই পেজটি দেখার অনুমতি নেই। শুধুমাত্র অ্যাডমিনরা এখানে প্রবেশ করতে পারেন।</p>
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20">
      {/* Background Glows */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full -z-10 animate-pulse" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-secondary/10 blur-[120px] rounded-full -z-10 animate-pulse" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
            <Shield size={12} />
            অ্যাডমিন কন্ট্রোল
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter leading-none">
            সিস্টেম <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-secondary">ম্যানেজমেন্ট</span>
          </h1>
          <p className="text-slate-400 text-lg font-medium max-w-xl">সিস্টেমের সকল ইউজার এবং লেনদেন রিয়েল-টাইমে ম্যানেজ করুন।</p>
        </div>
        
        <div className="flex bg-slate-900/80 p-1.5 rounded-2xl border border-white/10 backdrop-blur-2xl shadow-2xl">
          <button 
            onClick={() => setActiveTab('users')}
            className={cn(
              "px-8 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 relative overflow-hidden group",
              activeTab === 'users' 
                ? "bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg shadow-primary/25" 
                : "text-slate-500 hover:text-white hover:bg-white/5"
            )}
          >
            <div className="flex items-center gap-2">
              <Users size={16} />
              <span>ইউজারসমূহ ({users.length})</span>
            </div>
          </button>
          <button 
            onClick={() => setActiveTab('transactions')}
            className={cn(
              "px-8 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 relative overflow-hidden group",
              activeTab === 'transactions' 
                ? "bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg shadow-primary/25" 
                : "text-slate-500 hover:text-white hover:bg-white/5"
            )}
          >
            <div className="flex items-center gap-2">
              <Clock size={16} />
              <span>লেনদেনসমূহ ({transactions.length})</span>
            </div>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <AdminStatCard 
          title="মোট ইউজার" 
          value={users.length} 
          icon={<Users size={24} />} 
          color="primary"
          trend="+১২% এই মাসে"
        />
        <AdminStatCard 
          title="মোট লেনদেন" 
          value={transactions.length} 
          icon={<Clock size={24} />} 
          color="secondary"
          trend="+৮% আজ"
        />
        <AdminStatCard 
          title="ভেরিফাইড" 
          value={transactions.filter(t => t.status === 'verified').length} 
          icon={<CheckCircle2 size={24} />} 
          color="green"
          trend="৯২% সাকসেস রেট"
        />
        <AdminStatCard 
          title="পেন্ডিং" 
          value={transactions.filter(t => t.status === 'pending').length} 
          icon={<Clock size={24} />} 
          color="amber"
          trend="অ্যাকশন প্রয়োজন"
        />
      </div>

      {/* Content Section */}
      <div className="glass-card overflow-hidden border-white/10 shadow-2xl relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
        
        <div className="p-8 border-b border-white/5 bg-white/[0.02] flex flex-col md:flex-row gap-6 justify-between items-center relative z-10">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
            <input 
              type="text" 
              placeholder={activeTab === 'users' ? "নাম বা ইউজারনেম দিয়ে খুঁজুন..." : "TrxID বা প্রেরক দিয়ে খুঁজুন..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-14 py-4 bg-slate-950/50 border-white/10 focus:border-primary/50 focus:ring-primary/20"
            />
          </div>
          <div className="flex items-center gap-3">
            <button className="px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all flex items-center gap-3">
              <Filter size={16} />
              ফিল্টার
            </button>
          </div>
        </div>

        <div className="overflow-x-auto relative z-10">
          {activeTab === 'users' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/5">
                  <th className="p-8 text-[10px] font-black uppercase tracking-widest text-slate-500">ইউজার প্রোফাইল</th>
                  <th className="p-8 text-[10px] font-black uppercase tracking-widest text-slate-500">ইউজারনেম</th>
                  <th className="p-8 text-[10px] font-black uppercase tracking-widest text-slate-500">ইমেইল অ্যাড্রেস</th>
                  <th className="p-8 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.filter(u => u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || u.username.toLowerCase().includes(searchTerm.toLowerCase())).map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.03] transition-colors group">
                    <td className="p-8">
                      <div className="flex items-center gap-5">
                        <div className="relative">
                          <div className="w-14 h-14 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center text-primary font-black text-xl shadow-2xl border border-white/10 group-hover:border-primary/50 transition-all duration-500 overflow-hidden">
                            {u.photoURL ? (
                              <img src={u.photoURL} alt="" className="w-full h-full object-cover" />
                            ) : (
                              u.displayName[0]
                            )}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-slate-950 rounded-full" />
                        </div>
                        <div>
                          <p className="text-lg font-black text-white tracking-tight leading-none mb-1">{u.displayName}</p>
                          <p className="text-xs text-slate-500 font-medium">মেম্বার সিন্স: {format(new Date(), 'MMM yyyy')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-8">
                      <div className="inline-flex items-center px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-black text-slate-400 font-mono tracking-widest">
                        @{u.username}
                      </div>
                    </td>
                    <td className="p-8">
                      <span className="text-sm font-medium text-slate-400">{u.email}</span>
                    </td>
                    <td className="p-8 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button className="p-3.5 bg-white/5 hover:bg-primary/20 text-slate-500 hover:text-primary rounded-xl transition-all border border-white/5 hover:border-primary/30 group/btn">
                          <Eye size={20} className="group-hover/btn:scale-110 transition-transform" />
                        </button>
                        <button className="p-3.5 bg-white/5 hover:bg-red-500/20 text-slate-500 hover:text-red-500 rounded-xl transition-all border border-white/5 hover:border-red-500/30 group/btn">
                          <Trash2 size={20} className="group-hover/btn:scale-110 transition-transform" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/5">
                  <th className="p-8 text-[10px] font-black uppercase tracking-widest text-slate-500">প্রেরক ও প্রাপক</th>
                  <th className="p-8 text-[10px] font-black uppercase tracking-widest text-slate-500">পরিমাণ</th>
                  <th className="p-8 text-[10px] font-black uppercase tracking-widest text-slate-500">TrxID ও গেটওয়ে</th>
                  <th className="p-8 text-[10px] font-black uppercase tracking-widest text-slate-500">স্ট্যাটাস</th>
                  <th className="p-8 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transactions.filter(t => t.trxId.toLowerCase().includes(searchTerm.toLowerCase()) || t.senderName.toLowerCase().includes(searchTerm.toLowerCase())).map((t) => (
                  <tr key={t.id} className="hover:bg-white/[0.03] transition-colors group">
                    <td className="p-8">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-slate-500 group-hover:bg-primary/20 group-hover:text-primary transition-all duration-500 border border-white/5 group-hover:border-primary/30">
                          <User size={28} />
                        </div>
                        <div>
                          <p className="text-lg font-black text-white tracking-tight leading-none mb-2">{t.senderName || 'অজ্ঞাত'}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">To:</span>
                            <span className="text-[10px] font-black text-primary font-mono">{t.receiverUid.slice(0, 12)}...</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-8">
                      <div className="flex flex-col">
                        <span className="text-3xl font-black text-white tracking-tighter">৳{t.amount}</span>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">টাকা</span>
                      </div>
                    </td>
                    <td className="p-8">
                      <div className="space-y-2">
                        <div className="inline-flex items-center px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-black text-primary font-mono tracking-widest">
                          {t.trxId}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          <span className={cn(
                            "px-2 py-0.5 rounded bg-slate-800",
                            t.gateway === 'bkash' ? "text-pink-500" : t.gateway === 'nagad' ? "text-orange-500" : "text-blue-500"
                          )}>{t.gateway}</span>
                          <span>•</span>
                          <span>{format(t.createdAt.toDate(), 'd MMM, p', { locale: bn })}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-8">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="p-8 text-right">
                      {t.status === 'pending' && (
                        <div className="flex items-center justify-end gap-3">
                          <button 
                            onClick={() => handleVerify(t.id, 'verified')}
                            className="p-4 bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white rounded-2xl transition-all border border-green-500/20 shadow-xl shadow-green-500/0 hover:shadow-green-500/20 group/btn"
                          >
                            <CheckCircle2 size={22} className="group-hover/btn:scale-110 transition-transform" />
                          </button>
                          <button 
                            onClick={() => handleVerify(t.id, 'rejected')}
                            className="p-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl transition-all border border-red-500/20 shadow-xl shadow-red-500/0 hover:shadow-red-500/20 group/btn"
                          >
                            <XCircle size={22} className="group-hover/btn:scale-110 transition-transform" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

const AdminStatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; color: string; trend?: string }> = ({ title, value, icon, color, trend }) => {
  const colors = {
    primary: 'from-primary/20 to-primary/5 text-primary border-primary/20 shadow-primary/10',
    secondary: 'from-secondary/20 to-secondary/5 text-secondary border-secondary/20 shadow-secondary/10',
    green: 'from-green-500/20 to-green-500/5 text-green-500 border-green-500/20 shadow-green-500/10',
    amber: 'from-amber-500/20 to-amber-500/5 text-amber-500 border-amber-500/20 shadow-amber-500/10'
  }[color as keyof typeof colors] || '';

  return (
    <div className={cn(
      "glass-card p-8 relative overflow-hidden group border-white/10 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl",
      "bg-gradient-to-br",
      colors
    )}>
      {/* Glow Effect */}
      <div className={cn(
        "absolute -right-10 -top-10 w-32 h-32 blur-[60px] rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-500",
        color === 'primary' ? 'bg-primary' : color === 'secondary' ? 'bg-secondary' : color === 'green' ? 'bg-green-500' : 'bg-amber-500'
      )} />

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-6">
          <div className="p-4 bg-slate-950/50 rounded-2xl shadow-inner border border-white/5 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
            {icon}
          </div>
          {trend && (
            <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400">
              {trend}
            </div>
          )}
        </div>
        
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-black text-white tracking-tighter">{value}</p>
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          </div>
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

export default AdminPanel;
