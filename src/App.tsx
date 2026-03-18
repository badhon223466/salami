import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate, useParams } from 'react-router-dom';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, db, signInWithGoogle, logout, testConnection } from './firebase';
import { doc, getDoc, onSnapshot, query, collection, where } from 'firebase/firestore';
import { 
  Gift, 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Share2, 
  Copy, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Plus,
  Trash2,
  ExternalLink,
  QrCode,
  Wallet,
  Coins,
  History as HistoryIcon,
  User,
  Shield,
  Bell,
  Search,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { cn } from './utils';

// --- Components ---
import Dashboard from './components/Dashboard';
import ProfileSettings from './components/ProfileSettings';
import PublicProfile from './components/PublicProfile';
import Auth from './components/Auth';
import History from './components/History';
import AdminPanel from './components/AdminPanel';
import ErrorBoundary from './components/ErrorBoundary';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        // Query profile by UID instead of using UID as doc ID
        const q = query(collection(db, 'profiles'), where('uid', '==', u.uid));
        unsubProfile = onSnapshot(q, (snap) => {
          if (!snap.empty) {
            setProfile(snap.docs[0].data());
          }
          setLoading(false);
        }, (err) => {
          console.error("Profile fetch error:", err);
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });
    return () => {
      unsubscribeAuth();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  const isAdmin = user?.email === 'mdbadhon7734@gmail.com';

  if (loading && !user) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
      />
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background text-slate-200 overflow-hidden">
      {/* Background Glows */}
      <div className="glow-primary top-[-10%] left-[-10%]" />
      <div className="glow-secondary bottom-[-10%] right-[-10%]" />
      <div className="glow-accent top-[40%] left-[40%] opacity-10" />

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-slate-950/80 backdrop-blur-2xl border-r border-white/5 transform transition-all duration-500 lg:relative lg:translate-x-0",
        isSidebarOpen ? "translate-x-0 shadow-2xl shadow-primary/20" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col p-8">
          <Link to="/" className="flex items-center gap-4 mb-12 px-2 group">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/30 group-hover:scale-110 transition-transform duration-500">
              <Gift className="text-white w-7 h-7" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black bg-gradient-to-r from-white via-white to-slate-500 bg-clip-text text-transparent tracking-tighter">
                সালামির পাতা
              </span>
              <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] -mt-1">Premium SaaS</span>
            </div>
          </Link>

          <nav className="flex-1 space-y-3">
            <NavItem to="/dashboard" icon={<LayoutDashboard size={22} />} label="ড্যাশবোর্ড" />
            {profile?.username && (
              <NavItem to={`/u/${profile.username}`} icon={<User size={22} />} label="আমার প্রোফাইল" />
            )}
            <NavItem to="/history" icon={<HistoryIcon size={22} />} label="ইতিহাস" />
            <NavItem to="/settings" icon={<Settings size={22} />} label="সেটিংস" />
            
            {isAdmin && (
              <div className="pt-6 mt-6 border-t border-white/5 space-y-3">
                <p className="px-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">Admin Panel</p>
                <NavItem to="/admin" icon={<Shield size={22} />} label="অ্যাডমিন প্যানেল" />
              </div>
            )}
          </nav>

          {user && (
            <div className="mt-auto pt-8 border-t border-white/5">
              <button 
                onClick={() => logout()}
                className="w-full flex items-center gap-4 px-5 py-4 text-slate-500 hover:text-red-400 hover:bg-red-500/5 rounded-2xl transition-all group"
              >
                <LogOut size={22} className="group-hover:-translate-x-1 transition-transform" />
                <span className="font-bold">লগআউট</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Top Navbar */}
        <header className="h-20 flex items-center justify-between px-8 border-b border-white/5 bg-slate-950/20 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 lg:hidden text-slate-400 hover:text-white transition-colors">
              <Menu size={28} />
            </button>
            <div className="hidden md:flex items-center gap-2 text-slate-500 text-sm font-medium">
              <span>সালামির পাতা</span>
              <span>/</span>
              <span className="text-white capitalize">{window.location.pathname.split('/').pop() || 'Dashboard'}</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center relative group">
              <Search className="absolute left-4 text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="খুঁজুন..." 
                className="bg-slate-900/50 border border-white/5 rounded-2xl pl-12 pr-4 py-2.5 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
              />
            </div>
            
            <button className="relative p-2.5 bg-slate-900/50 border border-white/5 rounded-2xl text-slate-400 hover:text-white transition-all hover:scale-110">
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-slate-950" />
            </button>

            <div className="flex items-center gap-3 pl-6 border-l border-white/5 group cursor-pointer">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{user?.displayName}</p>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{isAdmin ? 'Administrator' : 'Premium User'}</p>
              </div>
              <div className="relative">
                <img 
                  src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName}&background=8B5CF6&color=fff`} 
                  alt="" 
                  className="w-11 h-11 rounded-2xl border-2 border-white/5 group-hover:border-primary/50 transition-all" 
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-950" />
              </div>
              <ChevronDown size={16} className="text-slate-500 group-hover:text-white transition-colors" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 lg:p-12 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={window.location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

const NavItem: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({ to, icon, label }) => {
  const isActive = window.location.pathname === to;

  return (
    <Link 
      to={to}
      className={cn(
        "flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold relative group",
        isActive 
          ? "bg-gradient-to-r from-primary/10 to-secondary/10 text-white shadow-inner shadow-white/5" 
          : "text-slate-500 hover:text-white hover:bg-white/5"
      )}
    >
      {isActive && (
        <motion.div 
          layoutId="active-nav"
          className="absolute left-0 w-1.5 h-8 bg-gradient-to-b from-primary to-secondary rounded-r-full"
        />
      )}
      <span className={cn(
        "transition-transform duration-300",
        isActive ? "text-primary scale-110" : "group-hover:scale-110 group-hover:text-white"
      )}>
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testConnection();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return null;

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/u/:username" element={<PublicProfile />} />
          <Route path="/auth" element={<Auth />} />
          
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Auth />} />
          
          <Route path="/dashboard" element={
            user ? <Layout><Dashboard /></Layout> : <Navigate to="/auth" />
          } />
          <Route path="/settings" element={
            user ? <Layout><ProfileSettings /></Layout> : <Navigate to="/auth" />
          } />
          <Route path="/history" element={
            user ? <Layout><History /></Layout> : <Navigate to="/auth" />
          } />
          <Route path="/admin" element={
            user ? <Layout><AdminPanel /></Layout> : <Navigate to="/auth" />
          } />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
