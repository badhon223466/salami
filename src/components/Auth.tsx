import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle, signUpWithEmail, signInWithEmail, auth, db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { OperationType, handleFirestoreError } from '../firebase';
import { Gift, LogIn, CheckCircle2, AlertCircle, Loader2, Wallet, Share2, Mail, Lock, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';

const FeatureItem: React.FC<{ icon: React.ReactNode; title: string; desc: string }> = ({ icon, title, desc }) => (
  <div className="flex items-start gap-4 p-4 bg-slate-900/50 rounded-2xl border border-slate-800/50">
    <div className="p-2 bg-slate-800 rounded-xl">{icon}</div>
    <div>
      <h3 className="text-sm font-bold text-white">{title}</h3>
      <p className="text-xs text-slate-500">{desc}</p>
    </div>
  </div>
);

const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [showUsernameStep, setShowUsernameStep] = useState(false);
  const [pendingUser, setPendingUser] = useState<any>(null);
  const [authMode, setAuthMode] = useState<'google' | 'email'>('google');
  const [emailMode, setEmailMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const checkExistingUser = async () => {
      if (auth.currentUser) {
        setLoading(true);
        try {
          const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.username) {
              const profileDoc = await getDoc(doc(db, 'profiles', userData.username));
              if (profileDoc.exists()) {
                navigate('/dashboard');
              } else {
                setPendingUser(auth.currentUser);
                setUsername(userData.username);
                setUsernameAvailable(true);
                setShowUsernameStep(true);
              }
            } else {
              setPendingUser(auth.currentUser);
              setShowUsernameStep(true);
            }
          } else {
            setPendingUser(auth.currentUser);
            setShowUsernameStep(true);
          }
        } catch (err) {
          console.error("Auth check error:", err);
        } finally {
          setLoading(false);
        }
      }
    };
    checkExistingUser();
  }, [navigate]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithGoogle();
      const user = result.user;
      await handleUserAuth(user);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.GET, 'users/google-auth');
      setError('লগইন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    try {
      let user;
      if (emailMode === 'signup') {
        if (!fullName) {
          setError('আপনার পুরো নাম দিন।');
          setLoading(false);
          return;
        }
        const result = await signUpWithEmail(email, password);
        user = result.user;
        // Store temporary display name for profile creation
        (user as any).tempDisplayName = fullName;
      } else {
        const result = await signInWithEmail(email, password);
        user = result.user;
      }
      await handleUserAuth(user);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('ইমেইল বা পাসওয়ার্ড ভুল।');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('এই ইমেইলটি ইতিমধ্যে ব্যবহার করা হয়েছে।');
      } else if (err.code === 'auth/weak-password') {
        setError('পাসওয়ার্ড কমপক্ষে ৬টি অক্ষর হতে হবে।');
      } else {
        setError('কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUserAuth = async (user: any) => {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (userData.username) {
        const profileDoc = await getDoc(doc(db, 'profiles', userData.username));
        if (profileDoc.exists()) {
          navigate('/dashboard');
        } else {
          setPendingUser(user);
          setUsername(userData.username);
          setUsernameAvailable(true);
          setShowUsernameStep(true);
        }
      } else {
        setPendingUser(user);
        setShowUsernameStep(true);
      }
    } else {
      setPendingUser(user);
      setShowUsernameStep(true);
    }
  };

  const checkUsername = async (val: string) => {
    if (val.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    setCheckingUsername(true);
    try {
      const docRef = doc(db, 'profiles', val.toLowerCase());
      const docSnap = await getDoc(docRef);
      setUsernameAvailable(!docSnap.exists());
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `profiles/${val}`);
    } finally {
      setCheckingUsername(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (username) checkUsername(username);
    }, 500);
    return () => clearTimeout(timer);
  }, [username]);

  const handleCompleteSetup = async () => {
    if (!usernameAvailable || !pendingUser) return;
    setLoading(true);
    try {
      const uid = pendingUser.uid;
      const lowerUsername = username.toLowerCase();

      // Create User Doc
      await setDoc(doc(db, 'users', uid), {
        uid,
        email: pendingUser.email,
        username: lowerUsername,
        createdAt: serverTimestamp()
      });

      // Create Profile Doc
      await setDoc(doc(db, 'profiles', lowerUsername), {
        uid,
        username: lowerUsername,
        displayName: pendingUser.tempDisplayName || pendingUser.displayName || lowerUsername,
        photoURL: pendingUser.photoURL || `https://ui-avatars.com/api/?name=${pendingUser.tempDisplayName || lowerUsername}&background=8B5CF6&color=fff`,
        bio: 'সালামি পাঠাতে নিচের বাটনে ক্লিক করুন!',
        totalSalami: 0,
        verifiedSalami: 0,
        pendingSalami: 0,
        viewsCount: 0
      });

      navigate('/dashboard');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${pendingUser.uid}/profiles/${username}`);
      setError('প্রোফাইল সেটআপ করতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="glow-primary top-[-10%] left-[-10%] opacity-30" />
      <div className="glow-secondary bottom-[-10%] right-[-10%] opacity-30" />
      <div className="glow-accent top-[40%] left-[40%] opacity-10" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="glass-card p-6 sm:p-10 max-w-lg w-full relative z-10 border-white/10 shadow-[0_0_50px_-12px_rgba(139,92,246,0.3)]"
      >
        <div className="text-center mb-8 sm:mb-10">
          <motion.div 
            initial={{ rotate: -10, scale: 0.8 }}
            animate={{ rotate: 3, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary to-secondary rounded-[24px] sm:rounded-[28px] flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-2xl shadow-primary/40"
          >
            <Gift className="text-white w-10 h-10 sm:w-12 sm:h-12" />
          </motion.div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-2 sm:mb-3 tracking-tighter">সালামির পাতা</h1>
          <p className="text-slate-400 text-sm sm:text-base font-medium">আপনার ঈদের সালামি সংগ্রহ করুন ডিজিটাল উপায়ে!</p>
        </div>

        {!showUsernameStep ? (
          <div className="space-y-8">
            {/* Auth Mode Toggle */}
            <div className="flex p-1 bg-slate-900/50 rounded-2xl border border-white/5">
              <button 
                onClick={() => setAuthMode('google')}
                className={cn(
                  "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all",
                  authMode === 'google' ? "bg-primary text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                )}
              >
                গুগল লগইন
              </button>
              <button 
                onClick={() => setAuthMode('email')}
                className={cn(
                  "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all",
                  authMode === 'email' ? "bg-primary text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                )}
              >
                ইমেইল লগইন
              </button>
            </div>

            <AnimatePresence mode="wait">
              {authMode === 'google' ? (
                <motion.div 
                  key="google"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full btn-primary flex items-center justify-center gap-4 py-5 text-lg group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    {loading ? <Loader2 className="animate-spin" /> : <LogIn size={22} className="group-hover:translate-x-1 transition-transform" />}
                    <span className="relative z-10">গুগল দিয়ে লগইন করুন</span>
                  </button>
                  <p className="text-center text-slate-500 text-xs">দ্রুত এবং নিরাপদ লগইন।</p>
                </motion.div>
              ) : (
                <motion.div 
                  key="email"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-5"
                >
                  <form onSubmit={handleEmailAuth} className="space-y-4">
                    {emailMode === 'signup' && (
                      <div className="relative">
                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input 
                          type="text" 
                          placeholder="আপনার পুরো নাম" 
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="input-field pl-12"
                          required
                        />
                      </div>
                    )}
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input 
                        type="email" 
                        placeholder="আপনার ইমেইল" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input-field pl-12"
                        required
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input 
                        type="password" 
                        placeholder="পাসওয়ার্ড" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input-field pl-12"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full btn-primary py-4 text-lg"
                    >
                      {loading ? <Loader2 className="animate-spin mx-auto" /> : (emailMode === 'signin' ? 'লগইন করুন' : 'সাইন আপ করুন')}
                    </button>
                  </form>
                  <div className="text-center">
                    <button 
                      onClick={() => setEmailMode(emailMode === 'signin' ? 'signup' : 'signin')}
                      className="text-sm text-primary font-bold hover:underline"
                    >
                      {emailMode === 'signin' ? 'নতুন অ্যাকাউন্ট তৈরি করুন' : 'ইতিমধ্যে অ্যাকাউন্ট আছে? লগইন করুন'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 text-red-400 text-sm bg-red-500/10 p-4 rounded-2xl border border-red-500/20"
              >
                <AlertCircle size={18} />
                <span className="font-bold">{error}</span>
              </motion.div>
            )}

            <div className="grid grid-cols-1 gap-4 pt-8 border-t border-white/5">
              <FeatureItem 
                icon={<Wallet className="text-secondary" size={20} />} 
                title="পেমেন্ট মেথড সেটআপ" 
                desc="বিকাশ, নগদ বা রকেট নম্বর যোগ করুন।" 
              />
              <FeatureItem 
                icon={<Share2 className="text-primary" size={20} />} 
                title="লিঙ্ক শেয়ার করুন" 
                desc="আপনার প্রোফাইল লিঙ্কটি বন্ধুদের পাঠান।" 
              />
            </div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white tracking-tight">আপনার ইউজারনেম বেছে নিন</h2>
              <p className="text-slate-400 font-medium">এই ইউজারনেমটি আপনার পাবলিক প্রোফাইল লিঙ্কে ব্যবহার করা হবে।</p>
            </div>
            
            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">@</div>
                <input
                  type="text"
                  placeholder="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                  className="input-field pl-10 pr-12 lowercase text-lg font-bold"
                  maxLength={20}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {checkingUsername ? (
                    <Loader2 className="animate-spin text-primary" size={22} />
                  ) : usernameAvailable === true ? (
                    <CheckCircle2 className="text-green-500" size={22} />
                  ) : usernameAvailable === false ? (
                    <AlertCircle className="text-red-500" size={22} />
                  ) : null}
                </div>
              </div>

              {usernameAvailable === false && (
                <p className="text-sm text-red-400 font-bold ml-1">এই ইউজারনেমটি ইতিমধ্যে নেওয়া হয়েছে। অন্য একটি চেষ্টা করুন।</p>
              )}
              {username && username.length < 3 && (
                <p className="text-sm text-slate-500 font-medium ml-1">কমপক্ষে ৩টি অক্ষর হতে হবে।</p>
              )}
            </div>

            <button
              onClick={handleCompleteSetup}
              disabled={!usernameAvailable || loading}
              className="w-full btn-primary py-5 text-xl shadow-2xl shadow-primary/20"
            >
              {loading ? <Loader2 className="animate-spin mx-auto" /> : 'সেটআপ সম্পন্ন করুন'}
            </button>

            <button 
              onClick={() => setShowUsernameStep(false)}
              className="w-full text-slate-500 hover:text-white transition-colors text-sm font-bold"
            >
              পিছনে যান
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Auth;
