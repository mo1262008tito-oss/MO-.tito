import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { db, auth } from '../firebase';
import { 
  collection, query, orderBy, limit, onSnapshot, doc, 
  updateDoc, increment, addDoc, serverTimestamp, where 
} from 'firebase/firestore';
import { 
  Trophy, Medal, Star, Flame, Zap, Heart, Crown, Target, Award, 
  Share2, TrendingUp, Users, Gift, ChevronRight, Search, 
  ShieldCheck, Headset, Sparkles, Send, Bell, Cpu, MousePointer2,
  Rocket, Globe, Coffee, Ghost
} from 'lucide-react';

// ==========================================================
// 🎨 THE COLOSSAL STYLESHEET (CSS-IN-JS)
// ==========================================================
const MasterStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@200;400;700;900&family=Orbitron:wght@400;900&display=swap');

    :root {
      --primary: #3b82f6;
      --accent: #8b5cf6;
      --success: #22c55e;
      --gold: #eab308;
      --bg: #030303;
      --glass: rgba(255, 255, 255, 0.03);
      --glass-border: rgba(255, 255, 255, 0.07);
    }

    body {
      background: var(--bg);
      color: white;
      font-family: 'Cairo', sans-serif;
      overflow-x: hidden;
      scroll-behavior: smooth;
    }

    /* 🌌 Cosmic Background */
    .cosmic-container {
      position: relative;
      background: radial-gradient(circle at 50% -20%, #1e1b4b 0%, #030303 100%);
      min-height: 200vh;
    }

    .particles {
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none;
      background-image: radial-gradient(white 1px, transparent 1px);
      background-size: 50px 50px;
      opacity: 0.1;
      z-index: 0;
    }

    /* 💎 Ultra Glassmorphism */
    .mega-glass {
      background: var(--glass);
      backdrop-filter: blur(30px) saturate(150%);
      -webkit-backdrop-filter: blur(30px) saturate(150%);
      border: 1px solid var(--glass-border);
      border-radius: 40px;
      transition: all 0.5s cubic-bezier(0.2, 1, 0.3, 1);
    }

    .mega-glass:hover {
      background: rgba(255, 255, 255, 0.06);
      border-color: var(--primary);
      box-shadow: 0 0 40px rgba(59, 130, 246, 0.2);
    }

    /* 👑 Podium 3D */
    .podium-box {
      perspective: 1000px;
    }

    .podium-item {
      transform-style: preserve-3d;
      transition: transform 0.8s ease;
    }

    /* 🔥 Streak Animation */
    .fire-glow {
      position: relative;
    }
    .fire-glow::after {
      content: '';
      position: absolute;
      inset: -5px;
      background: linear-gradient(0deg, #f97316, transparent);
      filter: blur(10px);
      border-radius: inherit;
      z-index: -1;
      animation: flicker 1.5s infinite alternate;
    }

    @keyframes flicker {
      from { opacity: 0.4; }
      to { opacity: 1; }
    }

    /* 📱 Mobile Global Fixes */
    @media (max-width: 768px) {
      .text-giant { font-size: 3rem !important; }
      .mega-glass { border-radius: 30px; padding: 20px !important; }
      .mobile-nav-hide { display: none !important; }
    }

    /* 🖱️ Custom Cursor Glow */
    .cursor-glow {
      width: 400px; height: 400px;
      background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
      position: fixed; pointer-events: none;
      transform: translate(-50%, -50%);
      z-index: 9999;
    }
  ` }} />
);

// ==========================================================
// 🏆 THE MASTER COMPONENT
// ==========================================================
const HallOfLegends = () => {
  // --- States ---
  const [users, setUsers] = useState([]);
  const [category, setCategory] = useState('xp'); // xp, light, exams
  const [search, setSearch] = useState('');
  const [supportMessage, setSupportMessage] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isLive, setIsLive] = useState(true);
  
  const scrollRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  // --- Real-time Data Sync (Firebase) ---
  useEffect(() => {
    const q = query(collection(db, "users"), orderBy(category === 'xp' ? 'xp' : category === 'light' ? 'lightPoints' : 'examScore', 'desc'), limit(50));
    const unsub = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [category]);

  // --- Logic Functions ---
  const handleSupport = async (student) => {
    if (auth.currentUser?.uid === student.id) return alert("لا تدعم نفسك يا أسطورة!");
    const userRef = doc(db, "users", student.id);
    await updateDoc(userRef, {
      lightPoints: increment(10),
      supportCount: increment(1)
    });
    alert(`تم إرسال طاقة نور لـ ${student.displayName} 🌟`);
  };

  const currentTop = users.slice(0, 3);
  const others = users.slice(3).filter(u => u.displayName?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="cosmic-container">
      <MasterStyles />
      <div className="particles" />
      <motion.div className="fixed top-0 left-0 right-0 h-1 bg-primary z-[1000] origin-left" style={{ scaleX }} />

      {/* --- 1. Top Navigation & Stats Bar --- */}
      <nav className="sticky top-0 z-[100] px-6 py-6 lg:px-20 bg-black/40 backdrop-blur-3xl border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 mega-glass flex items-center justify-center border-blue-500/40">
            <Rocket className="text-blue-500" size={24} />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tighter orbitron">MAFA LEAGUE</h1>
            <div className="flex items-center gap-2 text-[10px] font-black text-blue-400">
               <Globe size={12} className="animate-spin-slow" /> متاح عالمياً
            </div>
          </div>
        </div>
        
        <div className="mobile-nav-hide flex items-center gap-10">
          <div className="flex gap-8">
            {['xp', 'light', 'exams'].map(cat => (
              <button 
                key={cat} 
                onClick={() => setCategory(cat)}
                className={`text-[11px] font-black uppercase tracking-[0.2em] transition-all ${category === cat ? 'text-blue-500' : 'text-gray-500 hover:text-white'}`}
              >
                {cat} RANKING
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center pulse-avatar">
              <Users size={18} className="text-success" />
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 lg:px-20 pt-16">
        
        {/* --- 2. Hero Section (World Class) --- */}
        <section className="text-center mb-32">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-black mb-10"
          >
            <Sparkles className="text-yellow-500" size={14} /> قاعة تكريم الدفعة الذهبية
          </motion.div>
          <h2 className="text-giant text-6xl lg:text-[120px] font-black tracking-tighter leading-[0.9] mb-10 orbitron">
            HALL OF <br /> <span className="text-blue-500 neon-text">LEGENDS</span>
          </h2>
          <p className="max-w-2xl mx-auto text-gray-500 font-bold text-lg lg:text-xl">
            هنا نخلد أسماء من تحدوا الصعاب، حصدوا النقاط، وأصبحوا قدوة لغيرهم في طريق العلم.
          </p>
        </section>

        {/* --- 3. The 3D Podium (منصة التكريم) --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-40 items-end">
          {/* المركز الثاني */}
          <motion.div initial={{ x: -100 }} animate={{ x: 0 }} className="order-2 md:order-1">
            <div className="mega-glass p-8 text-center relative pt-20">
              <div className="absolute -top-16 left-1/2 -translate-x-1/2">
                <div className="w-32 h-32 rounded-[35px] border-4 border-slate-400 overflow-hidden shadow-2xl">
                  <img src={currentTop[1]?.photoURL} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-slate-400 text-black font-black px-4 py-1 rounded-full text-xs">RANK 2</div>
              </div>
              <h3 className="text-xl font-black mb-2">{currentTop[1]?.displayName}</h3>
              <p className="text-blue-500 font-black mb-6">{currentTop[1]?.xp || 0} XP</p>
              <button onClick={() => handleSupport(currentTop[1])} className="w-full py-4 bg-white/5 rounded-2xl font-black text-[10px] hover:bg-white hover:text-black transition-all">ادعمه بالقلوب ❤️</button>
            </div>
          </motion.div>

          {/* المركز الأول (الملك) */}
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="order-1 md:order-2">
            <div className="mega-glass p-12 text-center relative pt-28 border-yellow-500/50 gold-glow">
              <div className="absolute -top-24 left-1/2 -translate-x-1/2">
                <Crown size={60} className="text-yellow-500 mb-2 mx-auto animate-bounce" />
                <div className="w-44 h-44 rounded-[50px] border-8 border-yellow-500 overflow-hidden shadow-[0_0_50px_rgba(234,179,8,0.4)]">
                  <img src={currentTop[0]?.photoURL} alt="" className="w-full h-full object-cover" />
                </div>
              </div>
              <h3 className="text-3xl font-black text-yellow-500 mb-2">{currentTop[0]?.displayName}</h3>
              <p className="text-gray-400 font-black tracking-widest text-xs mb-8 uppercase">Absolute Legend</p>
              <div className="flex gap-4">
                <button onClick={() => handleSupport(currentTop[0])} className="flex-1 py-5 bg-yellow-500 text-black rounded-[25px] font-black text-sm shadow-xl shadow-yellow-500/20 active:scale-95 transition-all">ارسل طاقة نور ⚡</button>
              </div>
            </div>
          </motion.div>

          {/* المركز الثالث */}
          <motion.div initial={{ x: 100 }} animate={{ x: 0 }} className="order-3">
            <div className="mega-glass p-8 text-center relative pt-20">
              <div className="absolute -top-16 left-1/2 -translate-x-1/2">
                <div className="w-32 h-32 rounded-[35px] border-4 border-orange-700 overflow-hidden shadow-2xl">
                  <img src={currentTop[2]?.photoURL} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-orange-700 text-white font-black px-4 py-1 rounded-full text-xs">RANK 3</div>
              </div>
              <h3 className="text-xl font-black mb-2">{currentTop[2]?.displayName}</h3>
              <p className="text-blue-500 font-black mb-6">{currentTop[2]?.xp || 0} XP</p>
              <button onClick={() => handleSupport(currentTop[2])} className="w-full py-4 bg-white/5 rounded-2xl font-black text-[10px] hover:bg-white hover:text-black transition-all">ادعمه بالقلوب ❤️</button>
            </div>
          </motion.div>
        </div>

        {/* --- 4. Search & Full Leaderboard --- */}
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-12 px-6">
            <h4 className="text-2xl font-black flex items-center gap-4">
              <TrendingUp className="text-blue-500" /> قائمة الشرف الكاملة
            </h4>
            <div className="relative w-full lg:w-96">
              <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input 
                type="text" 
                placeholder="ابحث عن صديق..." 
                className="w-full h-16 mega-glass rounded-[25px] px-16 font-bold outline-none focus:border-blue-500 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <AnimatePresence>
              {others.map((student, index) => (
                <motion.div 
                  key={student.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mega-glass p-6 flex items-center justify-between group hover:border-blue-500/50 transition-all cursor-pointer"
                  onClick={() => setSelectedStudent(student)}
                >
                  <div className="flex items-center gap-6">
                    <span className="font-black text-gray-700 text-2xl w-10">#{index + 4}</span>
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 group-hover:scale-110 transition-transform">
                        <img src={student.photoURL} alt="" className="w-full h-full object-cover" />
                      </div>
                      {student.streak > 5 && <Flame className="absolute -top-2 -right-2 text-orange-500 animate-pulse" size={20} />}
                    </div>
                    <div>
                      <h5 className="font-black text-lg">{student.displayName}</h5>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 text-[9px] font-black rounded uppercase">Legendary Tier</span>
                        <span className="text-[10px] text-gray-600 font-bold flex items-center gap-1"><Zap size={10} /> {student.xp} pts</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="hidden lg:flex flex-col items-end">
                      <div className="flex gap-1 mb-1">
                        {[1,2,3,4,5].map(s => <Star key={s} size={10} className={s <= (student.rating || 5) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-700'} />)}
                      </div>
                      <span className="text-[9px] text-gray-600 font-black uppercase">Community Rating</span>
                    </div>
                    <button className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-gray-600 group-hover:bg-red-500/10 group-hover:text-red-500 transition-all">
                      <Heart size={20} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* --- 5. Quick Support Floating Mini --- */}
        <div className="fixed bottom-10 right-10 z-[500]">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="mega-glass p-4 flex items-center gap-4 cursor-pointer border-blue-500/50 shadow-2xl bg-black"
          >
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center animate-bounce">
              <Headset className="text-white" />
            </div>
            <div className="pr-4 border-r border-white/10 hidden lg:block">
              <h6 className="font-black text-sm">مساعدة فورية؟</h6>
              <p className="text-[10px] text-gray-500">فريقنا متاح للرد الآن</p>
            </div>
          </motion.div>
        </div>

      </div>

      {/* --- Footer Excellence --- */}
      <footer className="mt-60 py-20 border-t border-white/5 bg-black/50">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center gap-10 mb-10 opacity-30">
            <ShieldCheck size={40} />
            <Cpu size={40} />
            <Award size={40} />
          </div>
          <p className="text-[10px] font-black tracking-[0.6em] text-gray-600 uppercase">
            Designed for Greatness • MAFA ACADEMY SECURE 2026
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HallOfLegends;
