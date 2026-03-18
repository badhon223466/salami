import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, onSnapshot, addDoc, serverTimestamp, updateDoc, increment, orderBy, limit } from 'firebase/firestore';
import { OperationType, handleFirestoreError } from '../firebase';
import { 
  Gift, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Copy, 
  Check, 
  ArrowRight, 
  Heart, 
  MessageSquare, 
  Wallet,
  Smartphone,
  QrCode,
  Share2,
  ExternalLink,
  User,
  Clock,
  Send,
  TrendingUp,
  X,
  Moon,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';
import { cn } from '../utils';
import { QRCodeSVG } from 'qrcode.react';

const PublicProfile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [mfsAccounts, setMfsAccounts] = useState<any[]>([]);
  const [recentSalamis, setRecentSalamis] = useState<any[]>([]);
  const [topSalamis, setTopSalamis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Form states
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState('');
  const [senderName, setSenderName] = useState('');
  const [message, setMessage] = useState('');
  const [selectedMFS, setSelectedMFS] = useState<any>(null);
  const [trxId, setTrxId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  const [isMusicPlaying, setIsMusicPlaying] = useState(true);

  useEffect(() => {
    const audio = document.getElementById('bg-music') as HTMLAudioElement;
    if (audio) {
      audio.volume = 0.4;
      const playAudio = () => {
        audio.play().catch(e => console.log("Autoplay blocked:", e));
        document.removeEventListener('click', playAudio);
      };
      document.addEventListener('click', playAudio);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const amt = params.get('amount');
    if (amt && !isNaN(Number(amt))) {
      setAmount(amt);
    }
  }, []);

  useEffect(() => {
    if (!username) return;

    let unsubMFS: (() => void) | null = null;
    let unsubRecent: (() => void) | null = null;
    let unsubTop: (() => void) | null = null;

    const fetchProfile = async () => {
      try {
        const profileRef = doc(db, 'profiles', username.toLowerCase());
        const profileSnap = await getDoc(profileRef);
        
        if (profileSnap.exists()) {
          const data = profileSnap.data();
          setProfile(data);
          
          // Increment views
          await updateDoc(profileRef, { viewsCount: increment(1) });

          // Fetch MFS
          const mfsPath = `users/${data.uid}/mfsAccounts`;
          const mfsQuery = query(collection(db, mfsPath));
          unsubMFS = onSnapshot(mfsQuery, (snap) => {
            setMfsAccounts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          }, (error) => {
            handleFirestoreError(error, OperationType.LIST, mfsPath);
          });

          // Fetch Recent Salamis
          const salamiPath = 'salamis';
          const salamiQuery = query(
            collection(db, salamiPath),
            where('receiverUid', '==', data.uid),
            where('status', '==', 'verified'),
            orderBy('createdAt', 'desc'),
            limit(5)
          );
          unsubRecent = onSnapshot(salamiQuery, (snap) => {
            setRecentSalamis(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          }, (error) => {
            handleFirestoreError(error, OperationType.LIST, salamiPath);
          });

          // Fetch Top Salamis
          const topSalamiQuery = query(
            collection(db, salamiPath),
            where('receiverUid', '==', data.uid),
            where('status', '==', 'verified'),
            orderBy('amount', 'desc'),
            limit(5)
          );
          unsubTop = onSnapshot(topSalamiQuery, (snap) => {
            setTopSalamis(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          }, (error) => {
            handleFirestoreError(error, OperationType.LIST, salamiPath);
          });

        } else {
          setError('প্রোফাইলটি খুঁজে পাওয়া যায়নি।');
        }
      } catch (err) {
        console.error(err);
        setError('কিছু একটা ভুল হয়েছে।');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();

    return () => {
      if (unsubMFS) unsubMFS();
      if (unsubRecent) unsubRecent();
      if (unsubTop) unsubTop();
    };
  }, [username]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNumber(id);
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  const handleSendSalami = async () => {
    if (!amount || !selectedMFS || !trxId) return;
    setSubmitting(true);
    try {
      const salamiPath = 'salamis';
      await addDoc(collection(db, salamiPath), {
        receiverUid: profile.uid,
        senderName: senderName || 'অজ্ঞাত',
        amount: Number(amount),
        message,
        gateway: selectedMFS.type,
        trxId,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      // Update pending stats
      const profilePath = `profiles/${profile.username}`;
      const profileRef = doc(db, 'profiles', profile.username);
      await updateDoc(profileRef, {
        pendingSalami: increment(Number(amount))
      });

      setSuccess(true);
      setStep(4);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'salamis/profiles');
      alert('সালামি পাঠাতে সমস্যা হয়েছে।');
    } finally {
      setSubmitting(false);
    }
  };

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
          title: 'Eid Salami',
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

  const copyNumber = (num: string, id?: string) => {
    navigator.clipboard.writeText(num);
    if (id) {
      setCopiedNumber(id);
      setTimeout(() => setCopiedNumber(null), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !profile) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
      <div className="glass-card p-10 max-w-md w-full text-center">
        <AlertCircle className="text-red-500 w-16 h-16 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-white mb-4">{error || 'প্রোফাইল পাওয়া যায়নি'}</h1>
        <Link to="/" className="btn-primary inline-block">হোম পেজে ফিরে যান</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-20">
      {/* Hero Section */}
      <div className="relative h-64 bg-gradient-to-br from-primary/20 via-slate-900 to-secondary/20 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
        
        {/* Animated Eid Icons */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            animate={{ 
              y: [0, -20, 0],
              rotate: [0, 10, 0],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-10 right-10 text-primary/20"
          >
            <Moon size={100} fill="currentColor" />
          </motion.div>
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.4, 0.1]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-20 left-20 text-secondary/20"
          >
            <Star size={32} fill="currentColor" />
          </motion.div>
          <motion.div 
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-10 left-1/4 text-primary/10"
          >
            <Star size={20} fill="currentColor" />
          </motion.div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <div className="w-24 h-24 bg-slate-800 rounded-full border-4 border-slate-950 mx-auto mb-4 overflow-hidden shadow-2xl">
              <img src={profile.photoURL || ''} alt="" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-1">{profile.displayName}</h1>
            <p className="text-primary font-medium mb-4">@{profile.username}</p>
            <div className="flex items-center justify-center gap-4 mt-2">
              <button 
                onClick={shareLink}
                className="w-14 h-14 bg-primary/20 hover:bg-primary/30 rounded-2xl text-primary flex items-center justify-center transition-all border border-primary/20 shadow-lg shadow-primary/10"
                title="শেয়ার করুন"
              >
                <Share2 size={28} />
              </button>
              <button 
                onClick={() => setShowQR(true)}
                className="w-14 h-14 bg-secondary/20 hover:bg-secondary/30 rounded-2xl text-secondary flex items-center justify-center transition-all border border-secondary/20 shadow-lg shadow-secondary/10"
                title="QR কোড"
              >
                <QrCode size={28} />
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-10 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Bio Section - Second on mobile, Left on desktop */}
          <div className="lg:col-span-1 space-y-6 order-2 lg:order-1">
            <div className="glass-card p-6 text-center">
              <p className="text-slate-400 text-sm mb-4 leading-relaxed italic">"{profile.bio}"</p>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                <div>
                  <p className="text-xs text-slate-500 uppercase">সালামি পেয়েছে</p>
                  <p className="text-xl font-bold text-white">৳{profile.verifiedSalami || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">ভিউস</p>
                  <p className="text-xl font-bold text-white">{profile.viewsCount || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Salami Form - First on mobile, Right on desktop */}
          <div className="lg:col-span-2 order-1 lg:order-2 lg:row-span-2">
            <div className="glass-card p-6 sm:p-8 min-h-[500px] flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Gift className="text-primary" size={28} />
                  সালামি পাঠান
                </h2>
                <div className="flex gap-1">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className={cn(
                      "w-8 h-1.5 rounded-full transition-all",
                      step >= i ? "bg-primary" : "bg-slate-800"
                    )} />
                  ))}
                </div>
              </div>

              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div 
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6 flex-1"
                  >
                    <div>
                      <label className="label-text">পরিমাণ (টাকা)</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                        {[50, 100, 500, 1000].map((amt) => (
                          <button 
                            key={amt}
                            onClick={() => setAmount(amt.toString())}
                            className={cn(
                              "py-2 rounded-lg border transition-all font-bold",
                              amount === amt.toString() ? "bg-primary border-primary text-white" : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                            )}
                          >
                            ৳{amt}
                          </button>
                        ))}
                      </div>
                      <input 
                        type="number" 
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="input-field text-center text-2xl font-bold"
                        placeholder="অন্য পরিমাণ লিখুন"
                      />
                    </div>

                    <div>
                      <label className="label-text">আপনার নাম (ঐচ্ছিক)</label>
                      <input 
                        type="text" 
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        className="input-field"
                        placeholder="আপনার নাম"
                      />
                    </div>

                    <div>
                      <label className="label-text">বার্তা (ঐচ্ছিক)</label>
                      <textarea 
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="input-field min-h-[80px] resize-none"
                        placeholder="একটি সুন্দর বার্তা লিখুন..."
                        maxLength={100}
                      />
                    </div>

                    <button 
                      onClick={() => amount && setStep(2)}
                      disabled={!amount}
                      className="w-full btn-primary py-4 mt-4 flex items-center justify-center gap-2"
                    >
                      <span>পরবর্তী ধাপ</span>
                      <ArrowRight size={20} />
                    </button>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div 
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6 flex-1"
                  >
                    <h3 className="text-lg font-semibold text-white mb-4">পেমেন্ট মেথড বেছে নিন</h3>
                    
                    <div className="space-y-4">
                      {mfsAccounts.length > 0 ? mfsAccounts.map((acc) => (
                        <button
                          key={acc.id}
                          onClick={() => setSelectedMFS(acc)}
                          className={cn(
                            "w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all text-left group relative",
                            selectedMFS?.id === acc.id ? "border-primary bg-primary/5" : "border-slate-800 bg-slate-900/50 hover:border-slate-700"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xs uppercase",
                              acc.type === 'bkash' ? "bg-pink-500/10 text-pink-500" :
                              acc.type === 'nagad' ? "bg-orange-500/10 text-orange-500" :
                              "bg-blue-500/10 text-blue-500"
                            )}>
                              {acc.type}
                            </div>
                            <div>
                              <p className="font-bold text-white">{acc.number}</p>
                              <p className="text-xs text-slate-500 capitalize">{acc.type} Personal</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                copyNumber(acc.number, acc.id);
                              }}
                              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                              title="নম্বর কপি করুন"
                            >
                              {copiedNumber === acc.id ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                            </button>
                            {selectedMFS?.id === acc.id && <CheckCircle2 className="text-primary" size={24} />}
                          </div>
                        </button>
                      )) : (
                        <div className="text-center py-10 border-2 border-dashed border-slate-800 rounded-2xl">
                          <Smartphone className="mx-auto text-slate-700 mb-4" size={40} />
                          <p className="text-slate-500">কোনো পেমেন্ট মেথড পাওয়া যায়নি।</p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 pt-6">
                      <button onClick={() => setStep(1)} className="flex-1 btn-secondary">পিছনে যান</button>
                      <button 
                        onClick={() => selectedMFS && setStep(3)} 
                        disabled={!selectedMFS}
                        className="flex-1 btn-primary"
                      >
                        পরবর্তী ধাপ
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div 
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6 flex-1"
                  >
                    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 text-center">
                      <p className="text-slate-400 text-sm mb-2">নিচের নম্বরে টাকা পাঠিয়ে ট্রানজেকশন আইডি দিন</p>
                      <div className="flex items-center justify-center gap-3 mb-4">
                        <span className="text-2xl font-bold text-white">{selectedMFS?.number}</span>
                        <button 
                          onClick={() => copyNumber(selectedMFS?.number)}
                          className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all"
                        >
                          {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                        </button>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-primary font-bold text-lg">
                        <Wallet size={20} />
                        <span>৳{amount}</span>
                      </div>
                    </div>

                    <div>
                      <label className="label-text">ট্রানজেকশন আইডি (TrxID)</label>
                      <input 
                        type="text" 
                        value={trxId}
                        onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                        className="input-field font-mono"
                        placeholder="ABC123XYZ"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button onClick={() => setStep(2)} className="flex-1 btn-secondary">পিছনে যান</button>
                      <button 
                        onClick={handleSendSalami}
                        disabled={!trxId || submitting}
                        className="flex-1 btn-primary flex items-center justify-center gap-2"
                      >
                        {submitting ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                        <span>সালামি পাঠান</span>
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div 
                    key="step4"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-10 flex-1 flex flex-col items-center justify-center"
                  >
                    <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
                      <CheckCircle2 className="text-green-500 w-12 h-12" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">সালামি পাঠানো হয়েছে!</h2>
                    <p className="text-slate-400 mb-8 max-w-xs mx-auto">
                      আপনার সালামি সফলভাবে পাঠানো হয়েছে। {profile.displayName} এটি ভেরিফাই করলে আপনার নাম পাবলিকলি দেখা যাবে।
                    </p>
                    <button 
                      onClick={() => window.location.reload()}
                      className="btn-primary w-full"
                    >
                      আবার পাঠান
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mt-12">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <AlertCircle size={16} className="text-primary" />
                  কিভাবে সালামি পাঠাবেন?
                </h3>
                <p className="text-xs text-slate-300 mb-4 font-bold">সালামি পাঠাতে নিচের বাটনে ক্লিক করুন!</p>
                <ol className="space-y-3 text-xs text-slate-400 list-decimal list-inside">
                  <li>যেকোনো একটি পেমেন্ট মেথড সিলেক্ট করুন এবং নম্বরটি কপি করুন।</li>
                  <li>আপনার পেমেন্ট অ্যাপ থেকে ওই নম্বরে টাকা পাঠান।</li>
                  <li>টাকা পাঠানোর পর ট্রানজেকশন আইডি (TrxID) সংগ্রহ করুন।</li>
                  <li>নিচের ফর্মে আপনার নাম, টাকার পরিমাণ এবং TrxID দিয়ে সাবমিট করুন।</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Givers Section - Third on mobile, Left on desktop */}
          <div className="lg:col-span-1 space-y-6 order-3 lg:order-3">
            <div className="glass-card p-6">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-primary" />
                টপ দাতাগণ
              </h3>
              <div className="space-y-4">
                {topSalamis.length > 0 ? topSalamis.map((s, idx) => (
                  <div key={s.id} className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl border border-slate-800/50 relative overflow-hidden group">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-xs font-bold text-slate-400">
                      {idx + 1}
                    </div>
                    <div className="overflow-hidden flex-1">
                      <p className="text-sm font-medium text-white truncate">{s.senderName}</p>
                      <p className="text-xs text-slate-500">৳{s.amount}</p>
                    </div>
                    {idx === 0 && <Gift size={16} className="text-amber-500 animate-bounce" />}
                  </div>
                )) : (
                  <p className="text-xs text-slate-500 text-center py-4">এখনো কেউ সালামি দেয়নি।</p>
                )}
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <Heart size={18} className="text-primary" />
                সাম্প্রতিক দাতাগণ
              </h3>
              <div className="space-y-4">
                {recentSalamis.length > 0 ? recentSalamis.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl border border-slate-800/50">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                      <User size={16} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-medium text-white truncate">{s.senderName}</p>
                      <p className="text-xs text-slate-500">৳{s.amount} • {format(s.createdAt.toDate(), 'd MMM', { locale: bn })}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-xs text-slate-500 text-center py-4">এখনো কেউ সালামি দেয়নি। প্রথম হোন!</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQR && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQR(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-8 max-w-sm w-full relative z-10 text-center"
            >
              <button 
                onClick={() => setShowQR(false)}
                className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white"
              >
                <X size={24} />
              </button>
              
              <h3 className="text-xl font-bold text-white mb-6">প্রোফাইল QR কোড</h3>
              
              <div className="bg-white p-4 rounded-2xl inline-block mb-6">
                <QRCodeSVG value={profileUrl} size={200} />
              </div>
              
              <p className="text-slate-400 text-sm mb-6">
                এই QR কোডটি স্ক্যান করে সরাসরি {profile.displayName}-এর প্রোফাইলে আসা যাবে।
              </p>
              
              <button 
                onClick={copyLink}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                {copied ? <Check size={20} /> : <Copy size={20} />}
                <span>লিঙ্ক কপি করুন</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Audio Element */}
      <audio 
        id="bg-music"
        src="https://xn--f6beex4abi.xn--45bl4db.xn--54b7fta0cc/assets/audios/1.mp3" 
        autoPlay 
        loop 
      />

      {/* Music Control */}
      <button 
        onClick={() => {
          const audio = document.getElementById('bg-music') as HTMLAudioElement;
          if (audio) {
            if (isMusicPlaying) audio.pause();
            else audio.play();
            setIsMusicPlaying(!isMusicPlaying);
          }
        }}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-slate-900 border border-white/10 rounded-full flex items-center justify-center text-primary shadow-2xl hover:scale-110 transition-all"
      >
        {isMusicPlaying ? <div className="flex gap-1 items-end"><div className="w-1 h-3 bg-primary animate-pulse" /><div className="w-1 h-5 bg-primary animate-pulse delay-75" /><div className="w-1 h-2 bg-primary animate-pulse delay-150" /></div> : <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-primary border-b-[6px] border-b-transparent ml-1" />}
      </button>

      {/* Footer Branding */}
      <div className="mt-20 text-center">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary transition-colors">
          <Gift size={16} />
          <span className="text-sm font-medium">Eid Salami দিয়ে নিজের পেজ তৈরি করুন</span>
        </Link>
      </div>
    </div>
  );
};

export default PublicProfile;
