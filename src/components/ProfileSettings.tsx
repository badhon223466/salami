import React, { useState, useEffect } from 'react';
import { auth, db, storage } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Link } from 'react-router-dom';
import { OperationType, handleFirestoreError } from '../firebase';
import { 
  User, 
  Wallet, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Save, 
  Smartphone,
  CreditCard,
  Settings as SettingsIcon,
  Info,
  Send,
  X,
  Upload,
  Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';

const ProfileSettings: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [mfsAccounts, setMfsAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [showAddMFS, setShowAddMFS] = useState(false);
  const [newMFS, setNewMFS] = useState({ type: 'bkash', number: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const fetchProfile = () => {
      const q = query(collection(db, 'profiles'), where('uid', '==', auth.currentUser?.uid));
      const unsubscribe = onSnapshot(q, (snap) => {
        if (!snap.empty) {
          const data = snap.docs[0].data();
          setProfile(data);
          setDisplayName(data.displayName || '');
          setBio(data.bio || '');
          setPhotoURL(data.photoURL || '');
        }
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'profiles');
        setLoading(false);
      });
      return unsubscribe;
    };

    const fetchMFS = () => {
      const q = query(collection(db, `users/${auth.currentUser?.uid}/mfsAccounts`));
      const unsubscribe = onSnapshot(q, (snap) => {
        setMfsAccounts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${auth.currentUser?.uid}/mfsAccounts`);
      });
      return unsubscribe;
    };

    const unsubProfile = fetchProfile();
    const unsubMfs = fetchMFS();
    return () => {
      unsubProfile();
      unsubMfs();
    };
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser || !profile) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('অনুগ্রহ করে একটি ছবি ফাইল আপলোড করুন।');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('ছবির সাইজ ২ মেগাবাইটের কম হতে হবে।');
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const storageRef = ref(storage, `profiles/${auth.currentUser.uid}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      
      setPhotoURL(url);
      setSuccess('ছবি আপলোড হয়েছে! সেভ বাটনে ক্লিক করুন।');
    } catch (err) {
      console.error("Upload error:", err);
      setError('ছবি আপলোড করতে সমস্যা হয়েছে।');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!profile) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await updateDoc(doc(db, 'profiles', profile.username), {
        displayName,
        bio,
        photoURL
      });
      setSuccess('প্রোফাইল আপডেট হয়েছে!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `profiles/${profile.username}`);
      setError('আপডেট করতে সমস্যা হয়েছে।');
    } finally {
      setSaving(false);
    }
  };

  const handleAddMFS = async () => {
    if (!newMFS.number || newMFS.number.length < 11) {
      setError('সঠিক নম্বর দিন।');
      return;
    }
    setSaving(true);
    try {
      const path = `users/${auth.currentUser?.uid}/mfsAccounts`;
      await addDoc(collection(db, path), {
        uid: auth.currentUser?.uid,
        type: newMFS.type,
        number: newMFS.number,
        isPrimary: mfsAccounts.length === 0
      });
      setShowAddMFS(false);
      setNewMFS({ type: 'bkash', number: '' });
      setSuccess('অ্যাকাউন্ট যোগ করা হয়েছে!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${auth.currentUser?.uid}/mfsAccounts`);
      setError('অ্যাকাউন্ট যোগ করতে সমস্যা হয়েছে।');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMFS = async (id: string) => {
    const path = `users/${auth.currentUser?.uid}/mfsAccounts/${id}`;
    try {
      await deleteDoc(doc(db, `users/${auth.currentUser?.uid}/mfsAccounts`, id));
      setShowDeleteConfirm(null);
      setSuccess('অ্যাকাউন্ট ডিলিট করা হয়েছে!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!profile) return (
    <div className="max-w-md mx-auto text-center py-20">
      <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <AlertCircle className="text-amber-500 w-10 h-10" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-4">প্রোফাইল পাওয়া যায়নি!</h2>
      <p className="text-slate-400 mb-8">আপনার প্রোফাইলটি এখনো তৈরি করা হয়নি। অনুগ্রহ করে ড্যাশবোর্ডে গিয়ে সেটআপ সম্পন্ন করুন।</p>
      <Link to="/dashboard" className="btn-primary">ড্যাশবোর্ডে যান</Link>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      {/* Background Glows */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -z-10" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-secondary/5 blur-[120px] rounded-full -z-10" />

      <div className="flex flex-col md:flex-row md:items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="p-3 sm:p-4 bg-gradient-to-br from-primary/20 to-purple-600/20 rounded-2xl text-primary border border-primary/20 shadow-xl shadow-primary/10 w-fit">
          <SettingsIcon size={28} className="sm:w-8 sm:h-8" />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter">প্রোফাইল <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">সেটিংস</span></h1>
          <p className="text-slate-400 text-base sm:text-lg font-medium">আপনার ব্যক্তিগত তথ্য ও পেমেন্ট মেথড ম্যানেজ করুন।</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10">
        {/* Left: Profile Info */}
        <div className="lg:col-span-8 space-y-6 sm:space-y-10">
          <section className="glass-card p-6 sm:p-10 relative overflow-hidden border-white/10 shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full" />
            
            <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <User size={22} />
              </div>
              ব্যক্তিগত তথ্য
            </h2>
            
            <div className="space-y-8 relative z-10">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="relative group shrink-0">
                  <img 
                    src={photoURL || `https://ui-avatars.com/api/?name=${displayName}&background=8B5CF6&color=fff`} 
                    alt="Profile" 
                    className="w-32 h-32 rounded-3xl object-cover border-4 border-white/10 group-hover:border-primary/50 transition-all shadow-2xl shadow-black/40"
                  />
                  <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white border-4 border-slate-950 shadow-lg cursor-pointer hover:scale-110 transition-transform active:scale-95">
                    {uploading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                  </label>
                </div>
                <div className="flex-1 space-y-4 w-full">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">প্রোফাইল পিকচার লিঙ্ক (URL)</label>
                    <input 
                      type="url" 
                      value={photoURL} 
                      onChange={(e) => setPhotoURL(e.target.value)}
                      className="input-field py-4 bg-slate-950/50 border-white/10 focus:border-primary/50 focus:ring-primary/20"
                      placeholder="https://example.com/image.jpg"
                    />
                    <p className="text-[10px] text-slate-600 font-medium italic">টিপস: ফেসবুক বা গুগল ড্রাইভ থেকে ইমেজের লিঙ্ক কপি করে এখানে দিন।</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">আপনার নাম</label>
                  <input 
                    type="text" 
                    value={displayName} 
                    onChange={(e) => setDisplayName(e.target.value)}
                    maxLength={50}
                    className="input-field py-4 bg-slate-950/50 border-white/10 focus:border-primary/50 focus:ring-primary/20"
                    placeholder="আপনার নাম"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">ইউজারনেম (অপরিবর্তনযোগ্য)</label>
                  <div className="input-field py-4 bg-slate-900/30 border-white/5 text-slate-500 cursor-not-allowed font-mono">
                    @{profile?.username}
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">বায়ো (সর্বোচ্চ ২০০ অক্ষর)</label>
                <textarea 
                  value={bio} 
                  onChange={(e) => setBio(e.target.value)}
                  className="input-field min-h-[120px] py-4 resize-none bg-slate-950/50 border-white/10 focus:border-primary/50 focus:ring-primary/20"
                  placeholder="আপনার সম্পর্কে কিছু লিখুন..."
                  maxLength={200}
                />
                <div className="flex justify-end">
                  <span className={cn(
                    "text-[10px] font-black tracking-widest px-2 py-1 rounded bg-white/5 border border-white/10",
                    bio.length >= 180 ? "text-amber-500" : "text-slate-500"
                  )}>{bio.length}/২০০</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-white/5">
                <div className="flex-1">
                  <AnimatePresence mode="wait">
                    {success && (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-green-500 text-sm font-bold flex items-center gap-2"
                      >
                        <div className="w-6 h-6 bg-green-500/10 rounded-full flex items-center justify-center">
                          <CheckCircle2 size={14} />
                        </div>
                        {success}
                      </motion.div>
                    )}
                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-red-500 text-sm font-bold flex items-center gap-2"
                      >
                        <div className="w-6 h-6 bg-red-500/10 rounded-full flex items-center justify-center">
                          <AlertCircle size={14} />
                        </div>
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <button 
                  onClick={handleUpdateProfile}
                  disabled={saving}
                  className="btn-primary px-10 py-4 flex items-center gap-3 shadow-xl shadow-primary/20 group"
                >
                  {saving ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <Save size={20} className="group-hover:scale-110 transition-transform" />
                  )}
                  <span className="font-black uppercase tracking-widest text-xs">সেভ করুন</span>
                </button>
              </div>
            </div>
          </section>

          <section className="glass-card p-10 relative overflow-hidden border-white/10 shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 blur-3xl rounded-full" />
            
            <div className="flex items-center justify-between mb-10 relative z-10">
              <h2 className="text-2xl font-black text-white flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary">
                  <Wallet size={22} />
                </div>
                পেমেন্ট মেথড (MFS)
              </h2>
              <button 
                onClick={() => setShowAddMFS(true)}
                className="p-3 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl transition-all border border-primary/20 shadow-lg shadow-primary/0 hover:shadow-primary/20 group"
              >
                <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              {mfsAccounts.length > 0 ? mfsAccounts.map((acc) => (
                <div key={acc.id} className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-2xl group hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300">
                  <div className="flex items-center gap-5">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center font-black text-[10px] uppercase shadow-inner border border-white/5",
                      acc.type === 'bkash' ? "bg-pink-500/10 text-pink-500 border-pink-500/20" :
                      acc.type === 'nagad' ? "bg-orange-500/10 text-orange-500 border-orange-500/20" :
                      "bg-blue-500/10 text-blue-500 border-blue-500/20"
                    )}>
                      {acc.type}
                    </div>
                    <div>
                      <p className="text-xl font-black text-white tracking-tighter">{acc.number}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{acc.type} Personal</span>
                        {acc.isPrimary && (
                          <span className="text-[8px] font-black text-primary uppercase tracking-widest px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">Primary</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowDeleteConfirm(acc.id)}
                    className="p-3 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100 border border-transparent hover:border-red-500/20"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              )) : (
                <div className="col-span-full text-center py-16 border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
                  <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
                    <Smartphone className="text-slate-700" size={40} />
                  </div>
                  <p className="text-slate-500 font-bold">কোনো পেমেন্ট মেথড যোগ করা হয়নি।</p>
                  <p className="text-slate-600 text-sm mt-1">সালামি পেতে অন্তত একটি মেথড যোগ করুন।</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right: Sidebar Info */}
        <div className="lg:col-span-4 space-y-8">
          <div className="glass-card p-8 bg-gradient-to-br from-primary/10 to-transparent border-primary/20 shadow-2xl relative overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-primary/10 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-700" />
            
            <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <Info size={20} />
              </div>
              কেন যোগ করবেন?
            </h3>
            <ul className="space-y-6 relative z-10">
              <li className="flex gap-4">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center shrink-0 border border-white/10">
                  <Send size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-black text-white uppercase tracking-widest mb-1">সরাসরি পেমেন্ট</p>
                  <p className="text-xs text-slate-400 leading-relaxed">প্রেরক সরাসরি আপনার নম্বরে টাকা পাঠাতে পারবে কোনো ঝামেলা ছাড়াই।</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center shrink-0 border border-white/10">
                  <CreditCard size={18} className="text-secondary" />
                </div>
                <div>
                  <p className="text-sm font-black text-white uppercase tracking-widest mb-1">একাধিক মেথড</p>
                  <p className="text-xs text-slate-400 leading-relaxed">বিকাশ, নগদ বা রকেট—সবগুলোই একসাথে যোগ করে রাখতে পারেন।</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center shrink-0 border border-white/10">
                  <CheckCircle2 size={18} className="text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-black text-white uppercase tracking-widest mb-1">সহজ ভেরিফিকেশন</p>
                  <p className="text-xs text-slate-400 leading-relaxed">প্রেরক ট্রানজেকশন আইডি দিলে আপনি তা ড্যাশবোর্ড থেকে ভেরিফাই করতে পারবেন।</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="glass-card p-8 border-white/5 bg-white/[0.01]">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">অ্যাকাউন্ট স্ট্যাটাস</h3>
            <div className="flex items-center justify-between p-4 bg-green-500/5 border border-green-500/10 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-bold text-green-500">অ্যাক্টিভ</span>
              </div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ভেরিফাইড প্রোফাইল</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add MFS Modal */}
      <AnimatePresence>
        {showAddMFS && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddMFS(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-card p-8 max-w-md w-full relative z-10"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-white tracking-tight">নতুন মেথড যোগ করুন</h2>
                <button onClick={() => setShowAddMFS(false)} className="text-slate-500 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block">সার্ভিস টাইপ</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['bkash', 'nagad', 'rocket'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setNewMFS({ ...newMFS, type })}
                        className={cn(
                          "py-3 rounded-xl border-2 transition-all font-black text-[10px] uppercase tracking-widest",
                          newMFS.type === type 
                            ? "border-primary bg-primary/10 text-primary shadow-lg shadow-primary/10" 
                            : "border-white/5 bg-white/5 text-slate-500 hover:border-white/10"
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block">নম্বর (Personal)</label>
                  <input 
                    type="tel" 
                    value={newMFS.number}
                    onChange={(e) => setNewMFS({ ...newMFS, number: e.target.value.replace(/\D/g, '') })}
                    className="input-field py-4 bg-slate-950/50 border-white/10 focus:border-primary/50"
                    placeholder="01XXXXXXXXX"
                    maxLength={11}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setShowAddMFS(false)}
                    className="flex-1 px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all"
                  >
                    বাতিল
                  </button>
                  <button 
                    onClick={handleAddMFS}
                    disabled={saving}
                    className="flex-1 btn-primary py-4 shadow-xl shadow-primary/20"
                  >
                    {saving ? <Loader2 className="animate-spin mx-auto" /> : <span className="text-[10px] font-black uppercase tracking-widest">যোগ করুন</span>}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card p-10 max-w-sm w-full relative z-10 text-center"
            >
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                <Trash2 className="text-red-500 w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2 tracking-tight">নিশ্চিত তো?</h3>
              <p className="text-slate-400 mb-8 font-medium">আপনি কি নিশ্চিত যে এই পেমেন্ট মেথডটি ডিলিট করতে চান?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all">না</button>
                <button onClick={() => handleDeleteMFS(showDeleteConfirm)} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-black py-4 rounded-xl transition-all shadow-xl shadow-red-500/20 text-[10px] uppercase tracking-widest">হ্যাঁ, ডিলিট করুন</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileSettings;
