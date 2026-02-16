import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useSpring, useTransform, useMotionValue } from 'framer-motion';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { 
  Trophy, Crown, Zap, Target, Medal, ShieldCheck, 
  Search, TrendingUp, TrendingDown, Fingerprint, Activity, Box, 
  Ghost, Cpu, Lock, ZapOff, Heart, Command, Eye, Share2, MoreHorizontal 
} from 'lucide-react';
import confetti from 'canvas-confetti'; // npm install canvas-confetti (Optional, logic included)
import './TitanV3.css';


// ==========================================
// 🖱️ CUSTOM CURSOR COMPONENT
// ==========================================
const CustomCursor = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const move = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    const addHover = () => setHovered(true);
    const removeHover = () => setHovered(false);

    
    window.addEventListener('mousemove', move);
    document.querySelectorAll('button, a, .interactive').forEach(el => {
      el.addEventListener('mouseenter', addHover);
      el.addEventListener('mouseleave', removeHover);
    });

    return () => window.removeEventListener('mousemove', move);
  }, []);

  
  return (
    <>
      <div className={`custom-cursor ${hovered ? 'hovered' : ''}`} style={{ left: mousePos.x, top: mousePos.y }} />
      <div className="cursor-dot" style={{ left: mousePos.x, top: mousePos.y }} />
    </>
  );
};

// ==========================================
// 🃏 3D TITAN CARD COMPONENT
// ==========================================
const TitanCard = ({ student, index, rankData }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [10, -10]); // Inverse rotation
  const rotateY = useTransform(x, [-100, 100], [-10, 10]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    if (index === 0 && !isFlipped) confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  };

  return (
    <motion.div 
      className={`holo-card relative perspective-1000 ${index === 0 ? 'w-full md:w-[26rem] h-[32rem] z-30' : 'w-full h-[26rem]'} interactive`}
      style={{ rotateX, rotateY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
    >
      <div className={`card-inner w-full h-full relative ${isFlipped ? 'flipped' : ''}`}>
        
        {/* FRONT SIDE */}
        <div className={`card-front bg-white/5 backdrop-blur-xl border border-white/10 p-6 flex flex-col items-center justify-between ${index === 0 ? 'emperor-holo border-yellow-500/50' : ''}`}
             onClick={handleFlip}>
          
          {index === 0 && <div className="rotating-border" />}
          
          <div className="w-full flex justify-between items-center z-10">
            <span className="font-zen text-4xl text-white/20">#{index + 1}</span>
            <div className="p-2 bg-black/50 rounded-full border border-white/10">{rankData.icon}</div>
          </div>

          <div className="relative group">
            <div className={`w-32 h-32 rounded-full p-1 border-2 ${index === 0 ? 'border-yellow-400' : 'border-blue-500'} relative`}>
              <img src={student.photoURL} alt="" className="w-full h-full object-cover rounded-full grayscale group-hover:grayscale-0 transition-all duration-500" />
              {/* Power Ring */}
              <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="2" className="text-transparent" />
                <circle cx="50" cy="50" r="48" fill="none" stroke={index === 0 ? '#ffd700' : '#00f3ff'} strokeWidth="2" strokeDasharray="300" strokeDashoffset="40" strokeLinecap="round" className="opacity-80" />
              </svg>
            </div>
            {index === 0 && <Crown className="absolute -top-6 left-1/2 -translate-x-1/2 text-yellow-400 animate-bounce" size={30} />}
          </div>

          <div className="text-center z-10">
            <h3 className="font-raj font-bold text-2xl glitch-text cursor-pointer">{student.displayName}</h3>
            <p className="text-xs uppercase tracking-[0.3em] opacity-70 mt-1" style={{color: rankData.color}}>{rankData.title}</p>
          </div>

          <div className="w-full bg-black/30 rounded-xl p-3 flex justify-between items-center border border-white/5">
            <div className="flex flex-col text-left">
              <span className="text-[9px] uppercase text-gray-400">Total XP</span>
              <span className="font-zen text-lg">{student.xp?.toLocaleString()}</span>
            </div>
            <div className="flex gap-1 h-4 items-end">
               <div className="audio-bar"></div>
               <div className="audio-bar"></div>
               <div className="audio-bar"></div>
            </div>
          </div>
          
          <div className="absolute bottom-2 text-[9px] text-gray-500 uppercase tracking-widest animate-pulse">Click to Reveal Stats</div>
        </div>

        {/* BACK SIDE (STATS) */}
        <div className="card-back p-8 text-center" onClick={handleFlip}>
          <h3 className="font-zen text-xl text-blue-400 mb-6">Battle Stats</h3>
          
          <div className="w-full space-y-4">
            {[
              { label: "Dedication", val: 95, color: "bg-blue-500" },
              { label: "Accuracy", val: 88, color: "bg-purple-500" },
              { label: "Speed", val: 92, color: "bg-green-500" }
            ].map((stat, i) => (
              <div key={i} className="text-left">
                <div className="flex justify-between text-xs mb-1 uppercase font-bold">
                  <span>{stat.label}</span>
                  <span>{stat.val}%</span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${stat.val}%` }} 
                    className={`h-full ${stat.color}`} 
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 w-full">
            <button className="py-2 bg-white/10 rounded hover:bg-white/20 text-xs font-bold interactive">PROFILE</button>
            <button className="py-2 bg-blue-600 rounded hover:bg-blue-500 text-xs font-bold interactive">MESSAGE</button>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

// ==========================================
// 📜 MAIN COMPONENT
// ==========================================
const HallOfLegends = () => {
  const [bigFive, setBigFive] = useState([]);
  const [strivers, setStrivers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  // 1. Data Fetching
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

  // 2. Rank Logic
  const getRankData = (rank) => {
    const ranks = {
      1: { title: "SUPREME EMPEROR", color: "#ffd700", icon: <Crown size={32} className="text-yellow-400" /> },
      2: { title: "WARLORD", color: "#c0c0c0", icon: <Trophy size={28} className="text-gray-300" /> },
      3: { title: "COMMANDER", color: "#cd7f32", icon: <Medal size={28} className="text-orange-400" /> },
      4: { title: "GUARDIAN", color: "#00f3ff", icon: <ShieldCheck size={24} className="text-cyan-400" /> },
      5: { title: "VANGUARD", color: "#00f3ff", icon: <Target size={24} className="text-cyan-400" /> },
    };
    return ranks[rank] || { title: "OPERATIVE", color: "#64748b", icon: <Zap size={20} /> };
  };
if (loading) return (
    <div className="min-h-screen bg-[#030014] flex flex-col items-center justify-center text-cyan-400 font-raj">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="mb-8"
      >
        <Cpu size={80} strokeWidth={1} />
      </motion.div>
      <motion.h2 
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-2xl tracking-[0.5em] font-zen"
      >
        ESTABLISHING NEURAL LINK...
      </motion.h2>
      <div className="mt-4 w-48 h-[2px] bg-white/10 relative overflow-hidden">
        <motion.div 
          className="absolute inset-0 bg-cyan-500"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen relative overflow-x-hidden transition-colors duration-1000 ${focusMode ? 'grayscale contrast-125' : ''}`}>
      <CustomCursor />
      
      {/* 🚀 Overlays */}
      <motion.div className="scroll-progress" style={{ scaleX }} />
      <div className="scanlines" />
      
      {/* 🌌 Interactive Particle Background */}
      <div className="fixed inset-0 z-[-1] opacity-30">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-blue-500 rounded-full blur-xl"
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: Math.random() * window.innerHeight,
              scale: Math.random() * 0.5 + 0.5
            }}
            animate={{ 
              y: [null, Math.random() * window.innerHeight],
              x: [null, Math.random() * window.innerWidth]
            }}
            transition={{ duration: Math.random() * 20 + 10, repeat: Infinity, repeatType: "reverse" }}
            style={{ width: Math.random() * 100 + 'px', height: Math.random() * 100 + 'px' }}
          />
        ))}
      </div>

      {/* 🧭 NAV BAR */}
      <nav className="p-6 md:p-8 flex justify-between items-center sticky top-0 z-[100] backdrop-blur-lg border-b border-white/5">
        <div className="flex items-center gap-4">
          <Fingerprint className="text-cyan-400" size={30} />
          <div>
            <h1 className="font-zen text-xl tracking-tighter">TITAN <span className="text-cyan-400">V3</span></h1>
            <p className="text-[10px] text-gray-400 tracking-[0.3em]">SECURE CONNECTION</p>
          </div>
        </div>
        
        <div className="flex gap-4">
           <button onClick={() => setFocusMode(!focusMode)} className="p-2 border border-white/10 rounded-full hover:bg-white/10 interactive transition-all">
             <Eye size={18} className={focusMode ? "text-red-500" : "text-cyan-500"} />
           </button>
           <div className="hidden md:flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full border border-white/10">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
             <span className="text-[10px] font-bold text-green-400">{(Math.random() * 50 + 120).toFixed(0)} ONLINE</span>
           </div>
        </div>
      </nav>

      {/* 🏛️ HERO SECTION */}
      <div className="container mx-auto px-4 py-20 relative z-10">
        <header className="text-center mb-24 relative">
          <motion.h1 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="font-zen text-6xl md:text-9xl font-black mb-4 relative inline-block"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-600">LEGENDS</span>
            {/* Glitch Overlay */}
            <span className="absolute top-0 left-0 -ml-1 text-red-500 opacity-50 animate-pulse hidden md:block" style={{clipPath: 'inset(0 0 50% 0)'}}>LEGENDS</span>
          </motion.h1>
          
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="font-raj text-xl text-cyan-400 tracking-[0.5em] uppercase"
          >
            The Ultimate Hall of Fame
          </motion.p>
        </header>

        {/* 🏆 THE BIG FIVE GRID */}
        <div className="flex flex-wrap justify-center items-end gap-8 lg:gap-12 mb-32 perspective-2000">
           {/* Reordering for Podium: 2 - 1 - 3 - 4 - 5 */}
           {[bigFive[1], bigFive[0], bigFive[2], bigFive[3], bigFive[4]].map((student, i) => {
             if (!student) return null;
             // Recover original rank index
             const originalIndex = bigFive.indexOf(student);
             return (
               <TitanCard 
                 key={student.id} 
                 student={student} 
                 index={originalIndex} 
                 rankData={getRankData(originalIndex + 1)} 
               />
             );
           })}
        </div>

        {/* 📜 THE STRIVERS LIST */}
        <section className="max-w-6xl mx-auto">
          <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-[40px] p-8 md:p-12 shadow-2xl relative overflow-hidden">
            {/* Background Grid inside Card */}
            <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(#444 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>

            <div className="flex flex-col md:flex-row justify-between items-end mb-12 relative z-10">
              <div>
                <h3 className="font-zen text-3xl flex items-center gap-3">
                  <Activity className="text-cyan-400" /> ACTIVE AGENTS
                </h3>
                <p className="text-gray-500 mt-2 font-raj font-bold">LIVE DATA STREAM FROM MAFA SERVERS</p>
              </div>
              <div className="relative w-full md:w-96 mt-6 md:mt-0">
                 <input 
                   type="text" 
                   placeholder="SEARCH AGENT ID..." 
                   className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-3 text-white outline-none focus:border-cyan-400 transition-all interactive"
                   onChange={(e) => setSearch(e.target.value)}
                 />
                 <Search className="absolute left-3 top-3.5 text-gray-500" size={18} />
              </div>
            </div>

            <div className="space-y-4 relative z-10">
              <AnimatePresence>
                {strivers.filter(s => s.displayName?.toLowerCase().includes(search.toLowerCase())).map((student, index) => {
                  const isRising = Math.random() > 0.5; // Mock Logic
                  return (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0, x: -50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05 }}
                      className="group flex flex-col md:flex-row items-center p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-cyan-500/30 transition-all duration-300 interactive cursor-none"
                    >
                      {/* Rank & Photo */}
                      <div className="flex items-center gap-6 w-full md:w-1/3">
                        <span className="font-zen text-gray-600 text-xl group-hover:text-cyan-400 transition-colors">
                          {(index + 6).toString().padStart(2, '0')}
                        </span>
                        <div className="relative">
                          <img src={student.photoURL} className="w-14 h-14 rounded-xl border border-white/10 group-hover:scale-110 transition-transform" alt="" />
                          <div className={`absolute -bottom-1 -right-1 p-1 rounded-full ${isRising ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                            {isRising ? <TrendingUp size={10}/> : <TrendingDown size={10}/>}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-bold text-lg group-hover:text-cyan-300 transition-colors">{student.displayName}</h4>
                          <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-400">LEVEL {Math.floor(student.xp/1000)}</span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex justify-between w-full md:w-2/3 items-center mt-4 md:mt-0 px-4">
                         <div className="text-center">
                            <p className="text-[9px] uppercase text-gray-500 mb-1">XP Points</p>
                            <span className="font-zen text-lg">{student.xp?.toLocaleString()}</span>
                         </div>
                         
                         {/* Visual Progress Bar to Next Rank */}
                         <div className="hidden md:block w-1/3">
                            <div className="flex justify-between text-[9px] mb-1 text-gray-500">
                               <span>PROGRESS</span>
                               <span>{(Math.random() * 100).toFixed(0)}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                               <div className="h-full bg-cyan-500 w-[60%] animate-pulse"></div>
                            </div>
                         </div>

                         <div className="flex gap-3">
                            <button className="p-2 rounded-lg hover:bg-white/10 interactive"><Share2 size={16} /></button>
                            <button className="p-2 rounded-lg hover:bg-white/10 interactive"><MoreHorizontal size={16} /></button>
                         </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </div>
        </section>
      </div>

      {/* 🦶 FOOTER HUD */}
      <footer className="mt-32 border-t border-white/5 bg-[#050510] relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
         <div className="container mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center opacity-40 hover:opacity-100 transition-opacity">
            <div className="flex gap-6 mb-4 md:mb-0">
               <Lock size={18} /> <Ghost size={18} /> <ZapOff size={18} />
            </div>
            <p className="font-raj text-xs tracking-[0.5em]">SYSTEM SECURE • ENCRYPTED BY MAFA • V3.0</p>
         </div>
      </footer>
    </div>
  );
};

export default HallOfLegends;
