import React, { useState, useEffect } from 'react';
import { auth, db, logout } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, limit, doc, getDoc, updateDoc, addDoc, serverTimestamp, increment } from 'firebase/firestore';
import { OperationType, handleFirestoreError } from '../firebase';
import { Link } from 'react-router-dom';
import { 
  Gift, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Share2, 
  Copy, 
  ExternalLink, 
  Eye, 
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  User,
  MessageSquare,
  CreditCard,
  Check,
  X,
  QrCode,
  AlertCircle,
  Send,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';
import { cn } from '../utils';

import { QRCodeSVG } from 'qrcode.react';

const Dashboard: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [mfsAccounts, setMfsAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileMissing, setProfileMissing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Send Salami Form States
  const [sendRecipient, setSendRecipient] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendSenderName, setSendSenderName] = useState('');
  const [sendMessage, setSendMessage] = useState('');
  const [sendGateway, setSendGateway] = useState('bkash');
  const [sendTrxId, setSendTrxId] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendSalami = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sendRecipient || !sendAmount || !sendTrxId) return;

    setIsSending(true);
    try {
      const recipientUsername = sendRecipient.toLowerCase().trim();
      const recipientRef = doc(db, 'profiles', recipientUsername);
      const recipientSnap = await getDoc(recipientRef);
      
      if (!recipientSnap.exists()) {
        alert('প্রাপক খুঁজে পাওয়া যায়নি। সঠিক ইউজারনেম দিন।');
        setIsSending(false);
        return;
      }

      const recipientData = recipientSnap.data();
      const recipientUid = recipientData.uid;

      // Prevent sending to self
      if (recipientUid === auth.currentUser?.uid) {
        alert('আপনি নিজেকে সালামি পাঠাতে পারবেন না।');
        setIsSending(false);
        return;
      }

      await addDoc(collection(db, 'salamis'), {
        receiverUid: recipientUid,
        senderName: sendSenderName || auth.currentUser?.displayName || 'অজ্ঞাত',
        amount: Number(sendAmount),
        message: sendMessage,
        gateway: sendGateway,
        trxId: sendTrxId,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      await updateDoc(recipientRef, {
        pendingSalami: increment(Number(sendAmount))
      });

      alert('সালামি পাঠানো হয়েছে! প্রাপক ভেরিফাই করলে তা তার অ্যাকাউন্টে জমা হবে।');
      
      // Reset form
      setSendRecipient('');
      setSendAmount('');
      setSendSenderName('');
      setSendMessage('');
      setSendTrxId('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'salamis');
      alert('সালামি পাঠাতে সমস্যা হয়েছে।');
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    if (!auth.currentUser) return;

    // Fetch Profile
    const fetchProfile = () => {
      const q = query(collection(db, 'profiles'), where('uid', '==', auth.currentUser?.uid));
      const unsubscribe = onSnapshot(q, (snap) => {
        if (!snap.empty) {
          setProfile(snap.docs[0].data());
          setProfileMissing(false);
          setLoading(false);
        } else {
          setProfileMissing(true);
          setLoading(false);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'profiles');
        setLoading(false);
      });
      return unsubscribe;
    };

    // Fetch MFS
    const fetchMFS = () => {
      const q = query(collection(db, `users/${auth.currentUser?.uid}/mfsAccounts`));
      const unsubscribe = onSnapshot(q, (snap) => {
        setMfsAccounts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${auth.currentUser?.uid}/mfsAccounts`);
      });
      return unsubscribe;
    };

    // Fetch Transactions
    const fetchTransactions = () => {
      const q = query(
        collection(db, 'salamis'), 
        where('receiverUid', '==', auth.currentUser?.uid),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      const unsubscribe = onSnapshot(q, (snap) => {
        setTransactions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'salamis');
      });
      return unsubscribe;
    };

    const unsubProfile = fetchProfile();
    const unsubMfs = fetchMFS();
    const unsubTx = fetchTransactions();
    return () => {
      unsubProfile();
      unsubMfs();
      unsubTx();
    };
  }, []);

  const profileUrl = `${window.location.origin}/u/${profile?.username}`;

  const copyLink = () => {
    if (!profile) return;
    const textToCopy = `${profile.displayName}-কে সালামি পাঠাতে এই লিঙ্কে ক্লিক করুন: ${profileUrl}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = async () => {
    if (!profile) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'সালামির পাতা',
          text: `${profile.displayName}-কে সালামি পাঠাতে এই লিঙ্কে ক্লিক করুন:`,
          url: profileUrl,
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      copyLink();
    }
  };

  const handleVerify = async (id: string, status: 'verified' | 'rejected', amount: number) => {
    try {
      await updateDoc(doc(db, 'salamis', id), { status });
      
      // Update profile stats
      if (profile) {
        const profileRef = doc(db, 'profiles', profile.username);
        const updates: any = {};
        if (status === 'verified') {
          updates.verifiedSalami = (profile.verifiedSalami || 0) + amount;
          updates.pendingSalami = Math.max(0, (profile.pendingSalami || 0) - amount);
          updates.totalSalami = (profile.totalSalami || 0) + amount;
        } else {
          updates.pendingSalami = Math.max(0, (profile.pendingSalami || 0) - amount);
        }
        await updateDoc(profileRef, updates);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `salamis/${id}`);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (profileMissing) return (
    <div className="max-w-md mx-auto text-center py-20">
      <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <User className="text-amber-500 w-10 h-10" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-4">সেটআপ সম্পন্ন হয়নি!</h2>
      <p className="text-slate-400 mb-8">আপনার প্রোফাইলটি এখনো তৈরি করা হয়নি। অনুগ্রহ করে নিচের বাটনে ক্লিক করে সেটআপ সম্পন্ন করুন।</p>
      <div className="flex flex-col gap-4">
        <Link to="/auth" className="btn-primary">সেটআপ সম্পন্ন করুন</Link>
        <button onClick={() => logout()} className="text-slate-500 hover:text-white transition-colors">লগআউট করুন</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20">
      {/* Top Profile Card */}
      <div className="glass-card p-8 md:p-12 relative overflow-hidden group border-white/10">
        <div className="glow-primary -top-20 -left-20 opacity-20 group-hover:opacity-30 transition-opacity" />
        <div className="glow-secondary -bottom-20 -right-20 opacity-20 group-hover:opacity-30 transition-opacity" />
        
        <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
          <div className="relative">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-[40px] bg-gradient-to-br from-primary to-secondary p-1 shadow-2xl shadow-primary/30">
              <img 
                src={auth.currentUser?.photoURL || `https://ui-avatars.com/api/?name=${auth.currentUser?.displayName}&background=8B5CF6&color=fff`} 
                alt="" 
                className="w-full h-full rounded-[38px] object-cover border-4 border-slate-950" 
              />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-2xl border-4 border-slate-950 flex items-center justify-center shadow-lg">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            </div>
          </div>

          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
                  {auth.currentUser?.displayName}
                </h1>
                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full border border-primary/20">
                  Premium
                </span>
              </div>
              <p className="text-slate-400 text-lg font-medium max-w-xl">
                {profile?.bio || 'আপনার সালামির খতিয়ান এখানে দেখতে পাবেন।'}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
              <div className="flex items-center gap-2 bg-slate-900/50 px-4 py-2 rounded-2xl border border-white/5">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Username:</span>
                <span className="text-sm font-black text-white font-mono">@{profile?.username}</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/50 px-4 py-2 rounded-2xl border border-white/5">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Views:</span>
                <span className="text-sm font-black text-white">{profile?.viewsCount || 0}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full md:w-auto">
            <button 
              onClick={shareLink}
              className="btn-primary flex items-center justify-center gap-3 py-4 px-8 text-lg"
            >
              <Share2 size={22} />
              <span>শেয়ার করুন</span>
            </button>
            <button 
              onClick={() => window.open(profileUrl, '_blank')}
              className="btn-secondary flex items-center justify-center gap-3 py-4 px-8 text-lg"
            >
              <ExternalLink size={22} />
              <span>প্রোফাইল দেখুন</span>
            </button>
          </div>
        </div>
      </div>

      {/* Progress / Step Indicator */}
      {mfsAccounts.length === 0 && (
        <div className="glass-card p-8 border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500">
              <AlertCircle size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">সালামি গ্রহণ শুরু করুন</h2>
              <p className="text-slate-400">মাত্র ৩টি সহজ ধাপে আপনার সালামি সংগ্রহ শুরু করুন।</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepItem 
              number="01" 
              title="পেমেন্ট মেথড" 
              desc="বিকাশ বা নগদ নম্বর যোগ করুন।" 
              active={mfsAccounts.length > 0} 
              link="/settings"
            />
            <StepItem 
              number="02" 
              title="লিঙ্ক শেয়ার" 
              desc="আপনার প্রোফাইল লিঙ্কটি বন্ধুদের পাঠান।" 
              active={false} 
              onClick={shareLink}
            />
            <StepItem 
              number="03" 
              title="সালামি গ্রহণ" 
              desc="সালামি আসলে তা ভেরিফাই করুন।" 
              active={false} 
            />
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard 
          title="মোট সালামি" 
          value={profile?.totalSalami || 0} 
          icon={<Gift className="text-primary" size={28} />} 
          color="primary"
          subtitle="ভেরিফাইড ও পেন্ডিং মিলিয়ে"
        />
        <StatCard 
          title="ভেরিফাইড" 
          value={profile?.verifiedSalami || 0} 
          icon={<CheckCircle2 className="text-green-500" size={28} />} 
          color="green"
          subtitle="আপনার ওয়ালেটে জমা হয়েছে"
        />
        <StatCard 
          title="পেন্ডিং" 
          value={profile?.pendingSalami || 0} 
          icon={<Clock className="text-amber-500" size={28} />} 
          color="amber"
          subtitle="যাচাইয়ের অপেক্ষায় আছে"
        />
      </div>

      {/* Main Grid: Actions & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left: Quick Actions & QR */}
        <div className="lg:col-span-1 space-y-8">
          <div className="glass-card p-8 text-center space-y-6">
            <h3 className="text-xl font-black text-white tracking-tight">আপনার QR কোড</h3>
            <div className="bg-white p-6 rounded-[32px] inline-block shadow-2xl shadow-primary/20">
              <QRCodeSVG value={profileUrl} size={180} />
            </div>
            <p className="text-slate-500 text-sm font-medium px-4">
              বন্ধুদের এই QR কোডটি স্ক্যান করতে বলুন সরাসরি আপনার প্রোফাইলে যেতে।
            </p>
            <button 
              onClick={copyLink}
              className="w-full btn-secondary flex items-center justify-center gap-3 py-4"
            >
              {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
              <span>লিঙ্ক কপি করুন</span>
            </button>
          </div>

          <div className="glass-card p-8 space-y-6">
            <h3 className="text-xl font-black text-white tracking-tight">কুইক অ্যাকশন</h3>
            <div className="space-y-3">
              <Link to="/settings" className="flex items-center justify-between p-4 bg-slate-900/50 hover:bg-slate-900 rounded-2xl border border-white/5 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary">
                    <Wallet size={20} />
                  </div>
                  <span className="font-bold text-slate-300 group-hover:text-white transition-colors">মেথড ম্যানেজ করুন</span>
                </div>
                <ArrowUpRight size={18} className="text-slate-600 group-hover:text-white transition-all" />
              </Link>
              <Link to="/history" className="flex items-center justify-between p-4 bg-slate-900/50 hover:bg-slate-900 rounded-2xl border border-white/5 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <TrendingUp size={20} />
                  </div>
                  <span className="font-bold text-slate-300 group-hover:text-white transition-colors">লেনদেনের ইতিহাস</span>
                </div>
                <ArrowUpRight size={18} className="text-slate-600 group-hover:text-white transition-all" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right: Recent Activity Table & Send Form */}
        <div className="lg:col-span-2 space-y-10">
          {/* Send Salami Form */}
          <div className="glass-card p-8 space-y-8 border-white/10 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full" />
            
            <div className="flex items-center justify-between relative z-10">
              <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <Send size={22} />
                </div>
                সালামি পাঠান
              </h3>
              <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-widest">
                Quick Send
              </div>
            </div>
            
            <form onSubmit={handleSendSalami} className="space-y-6 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">প্রাপকের ইউজারনেম</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                      type="text" 
                      value={sendRecipient}
                      onChange={(e) => setSendRecipient(e.target.value)}
                      className="input-field pl-12 py-4 bg-slate-950/50 border-white/10 focus:border-primary/50"
                      placeholder="username"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">টাকার পরিমাণ</label>
                  <div className="relative">
                    <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                      type="number" 
                      value={sendAmount}
                      onChange={(e) => setSendAmount(e.target.value)}
                      className="input-field pl-12 py-4 bg-slate-950/50 border-white/10 focus:border-primary/50"
                      placeholder="৫০০"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">আপনার নাম (ঐচ্ছিক)</label>
                  <input 
                    type="text" 
                    value={sendSenderName}
                    onChange={(e) => setSendSenderName(e.target.value)}
                    className="input-field py-4 bg-slate-950/50 border-white/10 focus:border-primary/50"
                    placeholder="আপনার নাম"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">ট্রানজেকশন আইডি (TrxID)</label>
                  <input 
                    type="text" 
                    value={sendTrxId}
                    onChange={(e) => setSendTrxId(e.target.value.toUpperCase())}
                    className="input-field py-4 bg-slate-950/50 border-white/10 focus:border-primary/50 font-mono"
                    placeholder="ABC123XYZ"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">গেটওয়ে সিলেক্ট করুন</label>
                <div className="grid grid-cols-3 gap-4">
                  {['bkash', 'nagad', 'rocket'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSendGateway(type)}
                      className={cn(
                        "py-3.5 rounded-xl border-2 transition-all font-black text-[10px] uppercase tracking-widest",
                        sendGateway === type 
                          ? "border-primary bg-primary/10 text-primary shadow-lg shadow-primary/10" 
                          : "border-white/5 bg-white/5 text-slate-500 hover:border-white/10"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">বার্তা (ঐচ্ছিক)</label>
                <textarea 
                  value={sendMessage}
                  onChange={(e) => setSendMessage(e.target.value)}
                  className="input-field min-h-[100px] py-4 resize-none bg-slate-950/50 border-white/10 focus:border-primary/50"
                  placeholder="একটি সুন্দর বার্তা লিখুন..."
                  maxLength={100}
                />
              </div>

              <button 
                type="submit"
                disabled={isSending}
                className="w-full btn-primary py-5 shadow-xl shadow-primary/20 flex items-center justify-center gap-3 group"
              >
                {isSending ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    <span className="font-black uppercase tracking-widest text-xs">সালামি পাঠান</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                <TrendingUp size={24} className="text-primary" />
                সাম্প্রতিক সালামি
              </h2>
            <Link to="/history" className="text-primary text-sm font-bold hover:underline flex items-center gap-1">
              সব দেখুন <ArrowUpRight size={16} />
            </Link>
          </div>

          <div className="glass-card overflow-hidden border-white/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/50 border-b border-slate-800">
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">প্রেরক</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">পরিমাণ</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">স্ট্যাটাস</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {transactions.length > 0 ? transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-white/5 transition-colors group">
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                            <User size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-white">{tx.senderName || 'অজ্ঞাত'}</p>
                            <p className="text-xs text-slate-500 font-mono">{tx.trxId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <span className="text-lg font-black text-white tracking-tight">৳{tx.amount}</span>
                      </td>
                      <td className="p-6">
                        <StatusBadge status={tx.status} />
                      </td>
                      <td className="p-6 text-right">
                        {tx.status === 'pending' && (
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleVerify(tx.id, 'verified', tx.amount)}
                              className="p-2.5 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-xl transition-all shadow-lg shadow-green-500/0 hover:shadow-green-500/20"
                            >
                              <Check size={18} />
                            </button>
                            <button 
                              onClick={() => handleVerify(tx.id, 'rejected', tx.amount)}
                              className="p-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-lg shadow-red-500/0 hover:shadow-red-500/20"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="p-20 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center text-slate-700">
                            <Gift size={32} />
                          </div>
                          <p className="text-slate-500 font-medium">এখনো কোনো সালামি পাওয়া যায়নি।</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

const StepItem: React.FC<{ 
  number: string; 
  title: string; 
  desc: string; 
  active?: boolean; 
  link?: string;
  onClick?: () => void;
}> = ({ number, title, desc, active, link, onClick }) => {
  const content = (
    <div className={cn(
      "p-6 rounded-2xl border transition-all group cursor-pointer",
      active 
        ? "bg-green-500/10 border-green-500/20" 
        : "bg-slate-900/50 border-white/5 hover:border-primary/30"
    )}>
      <div className="flex items-center justify-between mb-4">
        <span className={cn(
          "text-2xl font-black tracking-tighter",
          active ? "text-green-500" : "text-slate-700 group-hover:text-primary transition-colors"
        )}>{number}</span>
        {active ? (
          <CheckCircle2 size={24} className="text-green-500" />
        ) : (
          <ArrowUpRight size={24} className="text-slate-700 group-hover:text-primary transition-colors" />
        )}
      </div>
      <h4 className="font-black text-white mb-1 tracking-tight">{title}</h4>
      <p className="text-xs text-slate-500 font-medium">{desc}</p>
    </div>
  );

  if (link) return <Link to={link}>{content}</Link>;
  return <div onClick={onClick}>{content}</div>;
};

const StatCard: React.FC<{ 
  title: string; 
  value: number; 
  icon: React.ReactNode; 
  color: string;
  subtitle: string;
}> = ({ title, value, icon, color, subtitle }) => (
  <div className="glass-card p-6 relative overflow-hidden group">
    <div className={cn(
      "absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl opacity-20 transition-all group-hover:scale-150",
      color === 'primary' ? "bg-primary" : color === 'green' ? "bg-green-500" : "bg-amber-500"
    )} />
    
    <div className="flex items-start justify-between mb-4 relative z-10">
      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
        {icon}
      </div>
      <TrendingUp size={16} className="text-slate-600" />
    </div>
    
    <div className="relative z-10">
      <p className="text-sm text-slate-400 mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-white mb-2">৳{value.toLocaleString('bn-BD')}</h3>
      <p className="text-xs text-slate-500">{subtitle}</p>
    </div>
  </div>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles = {
    pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    verified: "bg-green-500/10 text-green-500 border-green-500/20",
    rejected: "bg-red-500/10 text-red-500 border-red-500/20"
  };

  const labels = {
    pending: "অপেক্ষমান",
    verified: "নিশ্চিত",
    rejected: "বাতিল"
  };

  return (
    <span className={cn(
      "px-2.5 py-1 rounded-full text-xs font-semibold border",
      styles[status as keyof typeof styles]
    )}>
      {labels[status as keyof typeof labels]}
    </span>
  );
};

export default Dashboard;
