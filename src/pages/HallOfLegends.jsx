import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useSpring, useTransform, useMotionValue } from 'framer-motion';
import { db, auth } from '../firebase';
import { 
  collection, query, orderBy, limit, onSnapshot, doc, updateDoc, increment 
} from 'firebase/firestore';
import { 
  Trophy, Crown, Zap, Flame, Star, ShieldCheck, Rocket, Cpu, 
  Target, Award, Globe, Heart, ChevronUp, Search, Sparkles, 
  Share2, Medal, UserCheck, TrendingUp, Radio, Fingerprint,
  ZapOff, Lock, Ghost, Box, Activity, Command
} from 'lucide-react';

// ==========================================================
// 🌌 THE TITAN COLOSSUS CSS (ULTRA-PREMIUM 2026)
// ==========================================================
const TitanStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@200;400;700;900&family=Orbitron:wght@400;600;900&family=Syncopate:wght@400;700&display=swap');

    :root {
      --titan-blue: #3b82f6;
      --titan-cyan: #00f2ff;
      --titan-gold: #fbbf24;
      --titan-bg: #010409;
      --glass: rgba(15, 23, 42, 0.6);
      --border: rgba(255, 255, 255, 0.05);
    }

    body {
      background: var(--titan-bg);
      color: #f8fafc;
      font-family: 'Cairo', sans-serif;
      overflow-x: hidden;
      cursor: crosshair;
    }

    .orbitron { font-family: 'Orbitron', sans-serif; }
    .syncopate { font-family: 'Syncopate', sans-serif; }

    /* 💎 Advanced Holographic Tech */
    .colossus-card {
      background: var(--glass);
      backdrop-filter: blur(40px) saturate(200%);
      border: 1px solid var(--border);
      position: relative;
      overflow: hidden;
      box-shadow: 0 40px 100px -20px rgba(0,0,0,0.8);
      transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .colossus-card::before {
      content: '';
      position: absolute;
      top: -150%; left: -150%; width: 300%; height: 300%;
      background: radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%);
      animation: rotate-slow 20s linear infinite;
    }

    @keyframes rotate-slow {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* 👑 The Sovereign Glow (Rank 1) */
    .emperor-glow {
      border: 2px solid var(--titan-gold) !important;
      box-shadow: 0 0 80px rgba(251, 191, 36, 0.2) !important;
    }

    .xp-shimmer {
      background: linear-gradient(90deg, #60a5fa, #a855f7, #00f2ff, #60a5fa);
      background-size: 300% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: shimmer 4s linear infinite;
      font-weight: 900;
    }

    @keyframes shimmer {
      to { background-position: 300% center; }
    }

    /* 🌊 Cyber Floor Grid */
    .cyber-floor {
      position: fixed;
      inset: 0;
      background-image: 
        linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px);
      background-size: 80px 80px;
      mask-image: radial-gradient(circle at 50% 50%, black, transparent);
      transform: perspective(1000px) rotateX(60deg) translateY(200px);
      z-index: -1;
    }

    /* 📱 Responsive Excellence */
    @media (max-width: 768px) {
      .text-giant { font-size: 3.5rem !important; }
      .colossus-card { border-radius: 30px !important; margin-bottom: 20px; }
    }

    .badge-chip {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.05);
      padding: 4px 12px;
      border-radius: 10px;
      font-size: 10px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
  ` }} />
);

// ==========================================================
// 🏆 THE MASTER COMPONENT: HALL OF LEGENDS (COLOSSUS)
// ==========================================================
const HallOfLegends = () => {
  const [bigFive, setBigFive] = useState([]);
  const [strivers, setStrivers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  // 📡 High-Frequency Data Sync
  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("xp", "desc"), limit(20));
    const unsub = onSnapshot(q, (snapshot) => {
      const allData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBigFive(allData.slice(0, 5));
      setStrivers(allData.slice(5, 15));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // 🖱️ Interaction Handler
  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    mouseX.set(clientX);
    mouseY.set(clientY);
  };

  const getRankData = (rank) => {
    const titles = {
      1: { title: "الإمبراطور الأعظم", color: "var(--titan-gold)", icon: <Crown size={40}/> },
      2: { title: "جنرال النخبة", color: "#e2e8f0", icon: <Trophy size={32}/> },
      3: { title: "قائد الفيلق", color: "#cd7f32", icon: <Medal size={32}/> },
      4: { title: "فارس تيتان", color: "#3b82f6", icon: <ShieldCheck size={28}/> },
      5: { title: "مقاتل النخبة", color: "#3b82f6", icon: <Target size={28}/> },
    };
    return titles[rank] || { title: "مقاتل صاعد", color: "#64748b", icon: <Zap size={20}/> };
  };

  return (
    <div className="min-h-screen relative overflow-hidden" onMouseMove={handleMouseMove}>
      <TitanStyles />
      <div className="cyber-floor" />
      
      {/* Dynamic Background Blobs */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[-1]">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[150px] rounded-full" />
      </div>

      {/* Spotlight Effect */}
      <motion.div 
        className="fixed w-[600px] h-[600px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none z-[-1]"
        style={{ left: mouseX, top: mouseY, transform: 'translate(-50%, -50%)' }}
      />

      {/* Top Navigation Protocol */}
      <nav className="p-10 flex justify-between items-center sticky top-0 z-[500] backdrop-blur-3xl border-b border-white/5">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-[25px] bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
            <Fingerprint className="text-blue-500" size={30} />
          </div>
          <div className="hidden sm:block">
            <h1 className="syncopate font-black text-2xl tracking-tighter">TITAN <span className="text-blue-500">COLOSSUS</span></h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.5em] mt-1">Global Honor Protocol 2.6.0</p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="bg-white/5 px-6 py-3 rounded-2xl border border-white/5 flex items-center gap-4">
            <Activity className="text-green-500 animate-pulse" size={18} />
            <div className="text-right">
               <p className="text-[9px] text-gray-500 font-black uppercase">Sync State</p>
               <p className="text-xs font-bold orbitron">LIVE_DATA</p>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6">
        
        {/* --- MEGA HERO SECTION --- */}
        <header className="py-32 text-center relative">
          <motion.div 
            initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white/5 border border-white/10 mb-10"
          >
            <Box size={14} className="text-blue-500" />
            <span className="orbitron text-[10px] font-black tracking-[0.3em] text-blue-400">AUTHORIZED ACCESS ONLY</span>
          </motion.div>
          
          <h2 className="syncopate text-6xl md:text-[140px] font-black leading-none mb-12 tracking-tighter">
            THE <span className="xp-shimmer">LEGENDS</span>
          </h2>
          
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
            <div className="p-6 rounded-3xl border border-white/5 bg-white/[0.02]">
               <h5 className="orbitron text-gray-500 text-[10px] mb-2 font-black">TOTAL ELIGIBLE</h5>
               <p className="text-3xl font-black orbitron">{strivers.length + bigFive.length + 100}+</p>
            </div>
            <div className="p-6 rounded-3xl border border-white/5 bg-white/[0.02]">
               <h5 className="orbitron text-gray-500 text-[10px] mb-2 font-black">SEASON STATUS</h5>
               <p className="text-3xl font-black orbitron text-blue-500">ACTIVE</p>
            </div>
            <div className="p-6 rounded-3xl border border-white/5 bg-white/[0.02]">
               <h5 className="orbitron text-gray-500 text-[10px] mb-2 font-black">RESET CLOCK</h5>
               <p className="text-3xl font-black orbitron">14D : 22H</p>
            </div>
          </div>
        </header>

        {/* --- THE BIG FIVE: SOVEREIGN GRID --- */}
        <section className="mb-60">
          <div className="flex flex-col items-center mb-24">
             <div className="w-20 h-1 bg-blue-600 rounded-full mb-6" />
             <h3 className="syncopate text-4xl font-black tracking-widest text-center">THE BIG FIVE</h3>
             <p className="text-gray-500 font-bold mt-4 uppercase text-xs tracking-[0.4em]">Elite Commanders of the Season</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
            {bigFive.map((student, index) => {
              const rank = getRankData(index + 1);
              return (
                <motion.div 
                  key={student.id}
                  initial={{ scale: 0.9, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`colossus-card p-10 rounded-[50px] text-center group ${index === 0 ? 'emperor-glow lg:scale-125 z-50' : 'mt-10 lg:mt-20'}`}
                >
                  <div className="absolute top-6 right-6 opacity-20 group-hover:opacity-100 transition-opacity">
                    {rank.icon}
                  </div>
                  
                  <div className="relative mb-8">
                    <div className={`w-36 h-36 mx-auto rounded-[45px] border-4 p-2 relative z-10 ${index === 0 ? 'border-titan-gold shadow-[0_0_30px_rgba(251,191,36,0.3)]' : 'border-white/10'}`}>
                      <img src={student.photoURL} className="w-full h-full object-cover rounded-[35px]" alt="" />
                    </div>
                    {index === 0 && <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border-2 border-dashed border-titan-gold/30 rounded-full scale-150" />}
                  </div>

                  <h4 className="orbitron font-black text-xl mb-2 truncate px-2">{student.displayName}</h4>
                  <p className="text-[10px] font-black tracking-[0.2em] mb-6" style={{ color: rank.color }}>{rank.title}</p>
                  
                  <div className="xp-shimmer text-3xl mb-8">{student.xp?.toLocaleString()}</div>
                  
                  <div className="flex flex-wrap justify-center gap-2 mb-8">
                    <span className="badge-chip">Level {Math.floor((student.xp || 0) / 1000)}</span>
                    <span className="badge-chip">Verified</span>
                  </div>

                  <motion.button 
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    className="w-full py-4 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                  >
                    View Arsenal
                  </motion.button>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* --- THE STRIVERS: RISING CLUB --- */}
        <section className="max-w-6xl mx-auto mb-60">
           <div className="colossus-card p-12 rounded-[60px] border-dashed border-white/10">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-10 mb-20">
                 <div className="text-center lg:text-right">
                    <h3 className="syncopate text-3xl font-black flex items-center gap-4 justify-center lg:justify-start">
                       <TrendingUp className="text-blue-500" size={32} /> THE STRIVERS
                    </h3>
                    <p className="text-gray-500 font-bold mt-2">عشرة فرسان يقتربون من كسر حاجز الـ Big Five</p>
                 </div>
                 
                 <div className="relative w-full lg:w-96">
                    <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-600" />
                    <input 
                      type="text" 
                      placeholder="بحث في البروتوكول..." 
                      className="w-full bg-black/40 border border-white/10 h-16 rounded-3xl pr-16 pl-6 font-bold focus:border-blue-500 outline-none transition-all"
                      onChange={(e) => setSearch(e.target.value)}
                    />
                 </div>
              </div>

              <div className="grid gap-6">
                <AnimatePresence>
                  {strivers.filter(s => s.displayName?.toLowerCase().includes(search.toLowerCase())).map((student, index) => (
                    <motion.div 
                      key={student.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-6 rounded-[30px] bg-white/[0.01] border border-white/5 group hover:bg-white/[0.03] transition-all"
                    >
                      <div className="flex items-center gap-8">
                        <span className="orbitron font-black text-2xl text-gray-800 w-12 text-center group-hover:text-blue-500 transition-colors">#{index + 6}</span>
                        <div className="relative">
                          <img src={student.photoURL} className="w-20 h-20 rounded-[25px] object-cover border border-white/10" alt="" />
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-[10px] font-black">
                            <Zap size={10} />
                          </div>
                        </div>
                        <div>
                          <h5 className="font-black text-xl mb-1">{student.displayName}</h5>
                          <div className="flex gap-4">
                            <span className="text-[10px] font-black text-gray-500 flex items-center gap-1 uppercase"><Command size={10}/> Striver Class</span>
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{student.xp} XP Points</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="hidden md:flex items-center gap-10">
                         <div className="text-right">
                            <p className="text-[9px] font-black text-gray-600 uppercase">Distance to Top 5</p>
                            <p className="text-xs font-black text-white">{Math.abs(student.xp - bigFive[4]?.xp)} XP Needed</p>
                         </div>
                         <button className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                            <Heart size={20} />
                         </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
           </div>
        </section>

        {/* --- GLOBAL TICKER --- */}
        <div className="fixed bottom-0 left-0 right-0 bg-blue-600 py-3 z-[1000] border-t border-white/20">
           <div className="flex whitespace-nowrap animate-marquee">
              {[...Array(20)].map((_, i) => (
                <span key={i} className="mx-16 text-[10px] font-black uppercase tracking-[0.5em] text-white orbitron">
                  System Authorized • Top {bigFive.length} Command the Season • Progress is Mandatory • Glory to the Hardworking •
                </span>
              ))}
           </div>
        </div>
      </div>

      {/* --- FOOTER EXCELLENCE --- */}
      <footer className="mt-40 py-40 border-t border-white/5 text-center relative">
         <div className="flex justify-center gap-12 mb-12 opacity-10">
            <Lock size={40} /> <Ghost size={40} /> <Cpu size={40} /> <ZapOff size={40} />
         </div>
         <p className="orbitron text-[11px] tracking-[1.5em] text-gray-700 mb-6 uppercase">MAFA ACADEMY SECURE NETWORK 2026</p>
         <div className="flex justify-center gap-2">
            <div className="w-1 h-1 bg-blue-600 rounded-full" />
            <div className="w-12 h-1 bg-blue-600 rounded-full" />
            <div className="w-1 h-1 bg-blue-600 rounded-full" />
         </div>
      </footer>
<style dangerouslySetInnerHTML={{ __html: `
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@200;400;700;900&family=Orbitron:wght@400;600;900&family=Syncopate:wght@400;700&display=swap');

    :root {
      --titan-blue: #3b82f6;
      --titan-cyan: #00f2ff;
      --titan-gold: #fbbf24;
      --titan-purple: #8b5cf6;
      --titan-bg: #010409;
      --glass: rgba(15, 23, 42, 0.6);
      --border-glow: rgba(59, 130, 246, 0.3);
    }

    /* 1. نظام الإضاءة المحيطة - World Lighting */
    body {
      background: var(--titan-bg);
      background-image: 
        radial-gradient(circle at 10% 20%, rgba(59, 130, 246, 0.05) 0%, transparent 40%),
        radial-gradient(circle at 90% 80%, rgba(139, 92, 246, 0.05) 0%, transparent 40%);
      cursor: crosshair;
    }

    /* 2. تأثير الهولوجرام العالي الدقة - Ultra-HD Hologram */
    .colossus-card {
      background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%);
      backdrop-filter: blur(30px) saturate(150%);
      border: 1px solid rgba(255, 255, 255, 0.05);
      position: relative;
      overflow: hidden;
      transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .colossus-card::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
      transform: translateX(-100%);
      transition: 0.6s;
    }

    .colossus-card:hover {
      transform: translateY(-15px) scale(1.03) rotateX(5deg);
      border-color: var(--titan-blue);
      box-shadow: 0 30px 60px rgba(0,0,0,0.5), 0 0 20px rgba(59, 130, 246, 0.2);
    }

    .colossus-card:hover::before {
      transform: translateX(100%);
    }

    /* 3. تأثير "توهج الإمبراطور" - The Sovereign Aura */
    .emperor-glow {
      border: 2px solid var(--titan-gold) !important;
      background: radial-gradient(circle at top, rgba(251, 191, 36, 0.1), transparent) !important;
      animation: pulse-gold 4s infinite alternate;
    }

    @keyframes pulse-gold {
      0% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.1); }
      100% { box-shadow: 0 0 60px rgba(251, 191, 36, 0.3); }
    }

    /* 4. محرك الـ XP السيبراني - Cyber XP Shimmer */
    .xp-shimmer {
      background: linear-gradient(90deg, #fff, var(--titan-cyan), var(--titan-purple), #fff);
      background-size: 300% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: shimmer 5s linear infinite;
      font-family: 'Orbitron', sans-serif;
      text-shadow: 0 0 15px rgba(0, 242, 255, 0.3);
    }

    @keyframes shimmer {
      0% { background-position: 0% center; }
      100% { background-position: 300% center; }
    }

    /* 5. الشبكة الأرضية الثلاثية الأبعاد - 3D Cyber Grid */
    .cyber-floor {
      position: fixed;
      bottom: -100px;
      width: 200%;
      height: 400px;
      background-image: 
        linear-gradient(var(--titan-blue) 1px, transparent 1px),
        linear-gradient(90deg, var(--titan-blue) 1px, transparent 1px);
      background-size: 60px 60px;
      transform: rotateX(70deg) translateX(-25%);
      opacity: 0.1;
      z-index: -1;
      mask-image: linear-gradient(to top, black, transparent);
    }

    /* 6. تأثير الأوسمة - Badge Glitch Effect */
    .badge-chip {
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid var(--titan-blue);
      color: var(--titan-cyan);
      padding: 5px 15px;
      border-radius: 8px;
      font-family: 'Orbitron';
      font-size: 9px;
      text-transform: uppercase;
      position: relative;
    }

    .badge-chip:hover {
      background: var(--titan-blue);
      color: white;
      box-shadow: 0 0 15px var(--titan-blue);
    }

    /* 7. شريط التنقل الزجاجي - Frosted Nav */
    nav {
      background: rgba(1, 4, 9, 0.8) !important;
      backdrop-filter: blur(20px) !important;
      border-bottom: 1px solid rgba(255,255,255,0.05) !important;
    }

    /* 8. محرك حركة الصور - Reflection FX */
    .profile-img-container {
      position: relative;
      overflow: hidden;
    }

    .profile-img-container::after {
      content: '';
      position: absolute;
      top: 0; left: -100%; width: 50%; height: 100%;
      background: linear-gradient(to right, transparent, rgba(255,255,255,0.2), transparent);
      transform: skewX(-25deg);
      transition: 0.5s;
    }

    .colossus-card:hover .profile-img-container::after {
      left: 150%;
    }

    /* 9. قسم الطامحين - Strivers Neo-Glass */
    .strivers-panel {
      background: rgba(255,255,255,0.01);
      border: 1px dashed rgba(255,255,255,0.1);
      border-radius: 40px;
      padding: 40px;
      position: relative;
    }

    /* 10. شريط التمرير المخصص - Titan Scrollbar */
    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-track { background: var(--titan-bg); }
    ::-webkit-scrollbar-thumb { 
      background: linear-gradient(transparent, var(--titan-blue), transparent);
      border-radius: 10px;
    }

    /* 11. تأثير النص العملاق - Giant Background Text */
    .bg-text-giant {
      position: absolute;
      font-size: 20vw;
      font-weight: 900;
      color: rgba(255,255,255,0.02);
      z-index: -1;
      pointer-events: none;
      user-select: none;
      white-space: nowrap;
    }

    /* 12. حركات التحميل - Loading States */
    .loading-pulse {
      width: 100%;
      height: 200px;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
      background-size: 200% 100%;
      animation: loading 1.5s infinite;
    }

    @keyframes loading {
      from { background-position: 200% 0; }
      to { background-position: -200% 0; }
    }
  ` }} />
    </div>
  );
};

export default HallOfLegends;
