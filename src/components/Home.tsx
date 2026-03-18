import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Gift, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Smartphone, 
  Globe, 
  Lock, 
  Share2, 
  CreditCard,
  CheckCircle2,
  Users,
  LayoutDashboard,
  Play,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';

interface Salami {
  id: string;
  senderName: string;
  amount: number;
  message: string;
  gateway: string;
  status: string;
  createdAt: any;
}

const Home: React.FC = () => {
  const [latestSalami, setLatestSalami] = useState<Salami | null>(null);
  const [totalStats, setTotalStats] = useState({ amount: 0, count: 0 });

  useEffect(() => {
    // Latest Salami listener
    const qLatest = query(
      collection(db, 'salamis'),
      where('status', '==', 'verified'),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const unsubscribeLatest = onSnapshot(qLatest, (snapshot) => {
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        setLatestSalami({ id: doc.id, ...doc.data() } as Salami);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'salamis');
    });

    // Total Stats listener
    const qAll = query(
      collection(db, 'salamis'),
      where('status', '==', 'verified')
    );

    const unsubscribeStats = onSnapshot(qAll, (snapshot) => {
      let totalAmount = 0;
      snapshot.docs.forEach(doc => {
        totalAmount += doc.data().amount || 0;
      });
      setTotalStats({
        amount: totalAmount,
        count: snapshot.size
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'salamis');
    });

    return () => {
      unsubscribeLatest();
      unsubscribeStats();
    };
  }, []);

  // Also fetch total stats dynamically if possible, but let's stick to the latest salami first as requested.

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/50 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
              <Gift className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-black tracking-tighter">Eid Salami</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-400">
            <Link to="/" className="hover:text-white transition-colors">হোম</Link>
            <Link to="/auth" className="hover:text-white transition-colors">লগইন</Link>
            <Link to="/auth" className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-primary/20">
              রেজিস্ট্রেশন
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="glow-primary top-[-10%] left-[-10%] opacity-20" />
        <div className="glow-secondary bottom-[-10%] right-[-10%] opacity-20" />
        
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-8">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              নতুন জেনারেশনের সালামি কালেকশন
            </div>
            <h1 className="text-5xl lg:text-7xl font-black leading-[1.1] mb-8 tracking-tighter">
              আপনার ডিজিটাল <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary bg-300% animate-gradient">Eid Salami</span> <br />
              এখন অনলাইনে
            </h1>
            <p className="text-slate-400 text-lg mb-10 max-w-lg leading-relaxed font-medium">
              আপনার নিজস্ব লিংক তৈরি করুন, প্রিয়জনদের সাথে শেয়ার করুন এবং সরাসরি আপনার বিকাশ বা নগদ অ্যাকাউন্টে সালামি গ্রহণ করুন।
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/auth" className="flex items-center gap-3 bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-primary/20 hover:scale-105 active:scale-95">
                <Zap size={20} />
                অ্যাকাউন্ট তৈরি করুন
              </Link>
              <button className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-4 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95">
                <Play size={20} fill="currentColor" />
                বিস্তারিত দেখুন
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative z-10 grid gap-6">
              <div className="flex gap-6">
                <div className="flex-1 bg-slate-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] shadow-2xl">
                  <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center mb-6">
                    <span className="text-primary font-bold text-xl">৳</span>
                  </div>
                  <p className="text-4xl font-black mb-2 tracking-tighter">৳{totalStats.amount.toLocaleString()}</p>
                  <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">মোট সংগ্রহ</p>
                </div>
                <div className="flex-1 bg-slate-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] shadow-2xl">
                  <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center mb-6">
                    <Users className="text-green-500" size={24} />
                  </div>
                  <p className="text-4xl font-black mb-2 tracking-tighter">{totalStats.count}</p>
                  <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">সালামি প্রাপ্ত</p>
                </div>
              </div>
              
              <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] shadow-2xl min-h-[140px] flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  {latestSalami ? (
                    <motion.div 
                      key={latestSalami.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="flex items-center gap-4"
                    >
                      <div className="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center font-bold text-xl text-white">
                        {latestSalami.senderName?.[0] || 'S'}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold flex items-center gap-2">
                          নতুন সালামি এসেছে!
                          <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-ping" />
                        </p>
                        <p className="text-xs text-slate-500 line-clamp-1">
                          {latestSalami.senderName || 'কেউ একজন'} সালামি পাঠিয়ে উৎসব সমৃদ্ধ করেছেন
                        </p>
                        {latestSalami.message && (
                          <p className="text-[10px] text-slate-400 italic mt-1 line-clamp-1">"{latestSalami.message}"</p>
                        )}
                      </div>
                      <div className="ml-auto text-green-500 font-bold text-lg">+৳{latestSalami.amount}</div>
                    </motion.div>
                  ) : (
                    <div className="flex items-center gap-4 opacity-50">
                      <div className="w-12 h-12 bg-slate-800 rounded-2xl animate-pulse" />
                      <div className="flex-1">
                        <div className="h-4 bg-slate-800 rounded w-24 mb-2 animate-pulse" />
                        <div className="h-3 bg-slate-800 rounded w-48 animate-pulse" />
                      </div>
                    </div>
                  )}
                </AnimatePresence>
                
                {latestSalami && (
                  <div className="flex gap-2 mt-4">
                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {latestSalami.gateway}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Clock size={10} />
                      এখনই
                    </span>
                  </div>
                )}
              </div>
            </div>
            {/* Decorative elements */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/20 blur-[100px] rounded-full" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-secondary/20 blur-[100px] rounded-full" />
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto bg-slate-900/30 backdrop-blur-md border border-white/5 rounded-[2.5rem] p-12 grid md:grid-cols-3 gap-12 text-center">
          <div>
            <p className="text-5xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500 tracking-tighter">১০০%</p>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">নিরাপদ ও সহজ</p>
          </div>
          <div className="border-x border-white/5">
            <p className="text-5xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500 tracking-tighter">৪টি</p>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">MFS মেথড সাপোর্ট</p>
          </div>
          <div>
            <p className="text-5xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500 tracking-tighter">২৪/৭</p>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">সার্ভিস এভেইলএবল</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-xs font-bold mb-6">
              <Zap size={14} />
              আকর্ষণীয় ফিচার
            </div>
            <h2 className="text-4xl lg:text-6xl font-black mb-6 tracking-tighter">
              কেন আমাদের <span className="text-secondary">Eid Salami</span> সেরা?
            </h2>
            <p className="text-slate-400 font-medium">ডিজিটাল যুগে সালামি সংগ্রহ হোক আধুনিক ও ঝামেলামুক্ত।</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Globe className="text-primary" />}
              title="পার্সোনালাইজড লিংক"
              desc="পছন্দমতো ইউজারনেম দিয়ে নিজের 'Eid Salami' লিংক সেট করুন। যেমন: সালামির.পাতা.বাংলা/atikur"
            />
            <FeatureCard 
              icon={<Smartphone className="text-secondary" />}
              title="মাল্টিপল পেমেন্ট"
              desc="বিকাশ, নগদ, রকেট সহ জনপ্রিয় সব মাধ্যম ব্যবহার করে সালামি পাঠানোর সুবিধা।"
            />
            <FeatureCard 
              icon={<LayoutDashboard className="text-green-500" />}
              title="লাইভ ড্যাশবোর্ড"
              desc="কে কত সালামি পাঠিয়েছে এবং মোট কত টাকা হলো তার সব আপডেট লাইভ দেখার সুযোগ।"
            />
            <FeatureCard 
              icon={<Share2 className="text-pink-500" />}
              title="সহজে শেয়ারিং"
              desc="Facebook বা WhatsApp-এ এক ক্লিকে নিজের প্রোফাইল লিংক শেয়ার করে সবাইকে জানিয়ে দিন।"
            />
            <FeatureCard 
              icon={<ShieldCheck className="text-blue-500" />}
              title="টপ নচ সিকিউরিটি"
              desc="আপনার প্রোফাইল এবং ডাটা সুরক্ষিত রাখতে আমরা ব্যবহার করি আধুনিক এনক্রিপশন।"
            />
            <FeatureCard 
              icon={<Zap className="text-yellow-500" />}
              title="সব ডিভাইসে ফ্রেন্ডলি"
              desc="মোবাইল থেকে কম্পিউটার—সবখানেই Eid Salami দেখতে এবং ব্যবহার করতে চমৎকার।"
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-32 px-6 bg-slate-900/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-6">
              ৩টি সহজ ধাপ
            </div>
            <h2 className="text-4xl lg:text-6xl font-black mb-6 tracking-tighter">
              কিভাবে <span className="text-primary">শুরু করবেন?</span>
            </h2>
            <p className="text-slate-400 font-medium">মাত্র এক মিনিটেই আপনার Eid Salami সেটআপ করুন</p>
          </div>

          <div className="relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/5 -translate-y-1/2 hidden lg:block" />
            <div className="grid lg:grid-cols-3 gap-12 relative z-10">
              <StepCard number="১" title="রেজিস্ট্রেশন করুন" desc="ইউজারনেম ও MFS নাম্বার দিয়ে দ্রুত আপনার নিজের একটি অ্যাকাউন্ট খুলুন।" />
              <StepCard number="২" title="লিংক শেয়ার করুন" desc="প্রোফাইল থেকে লিংক কপি করে আপনার বন্ধুদের এবং পরিচিতদের পাঠিয়ে দিন।" />
              <StepCard number="৩" title="সালামি সংগ্রহ করুন" desc="সরাসরি আপনার মোবাইল ব্যাংকিংয়ে টাকা বুঝে নিন এবং ড্যাশবোর্ডে ট্র্যাক করুন।" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-primary/20 via-secondary/20 to-primary/20 border border-white/10 rounded-[3rem] p-16 text-center relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-5xl lg:text-7xl font-black mb-8 tracking-tighter leading-tight">
              আজই সাজিয়ে নিন <br />
              আপনার <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Eid Salami</span>
            </h2>
            <p className="text-slate-400 text-lg mb-12 max-w-2xl mx-auto font-medium">
              দেরি না করে এখনই ফ্রি রেজিস্ট্রেশন করুন এবং আপনার ডিজিটাল সালামি উৎসব শুরু করুন।
            </p>
            <Link to="/auth" className="inline-flex items-center gap-3 bg-primary hover:bg-primary/90 text-white px-10 py-5 rounded-2xl font-bold transition-all shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95">
              <Zap size={24} />
              এখনই শুরু করুন
            </Link>
          </div>
          {/* Decorative glows */}
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1),transparent_70%)]" />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center border border-white/10">
                <Gift className="text-primary w-6 h-6" />
              </div>
              <span className="text-xl font-black tracking-tighter">Eid Salami</span>
            </div>
            <p className="text-slate-500 text-sm font-medium">সহজে সালামি সংগ্রহের আধুনিক প্ল্যাটফর্ম</p>
          </div>

          <div className="flex items-center gap-8 text-slate-500 text-sm font-bold">
            <p>© ২০২৪ Eid Salami • প্রাইভেসি পলিসি • টার্মস অ্যান্ড কন্ডিশনস</p>
            <p className="text-slate-600">সর্বস্বত্ব সংরক্ষিত</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; desc: string }> = ({ icon, title, desc }) => (
  <div className="bg-slate-900/30 backdrop-blur-md border border-white/5 p-10 rounded-[2.5rem] hover:bg-slate-900/50 transition-all hover:border-white/10 group">
    <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h3 className="text-xl font-black mb-4 tracking-tight">{title}</h3>
    <p className="text-slate-500 text-sm leading-relaxed font-medium">{desc}</p>
  </div>
);

const StepCard: React.FC<{ number: string; title: string; desc: string }> = ({ number, title, desc }) => (
  <div className="text-center group">
    <div className="w-20 h-20 bg-slate-900 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-8 relative z-10 group-hover:bg-primary group-hover:border-primary transition-all duration-500">
      <span className="text-2xl font-black group-hover:text-white transition-colors">{number}</span>
    </div>
    <h3 className="text-xl font-black mb-4 tracking-tight">{title}</h3>
    <p className="text-slate-500 text-sm leading-relaxed font-medium max-w-[250px] mx-auto">{desc}</p>
  </div>
);

export default Home;
