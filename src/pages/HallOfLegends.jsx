import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { db, auth } from '../firebase'; 

import { 
  doc, updateDoc, increment, arrayUnion, 
  onSnapshot, query, collection, orderBy, limit, setDoc, serverTimestamp 
} from 'firebase/firestore';

import confetti from 'canvas-confetti';
import { 
  Trophy, Crown, Shield, Star, Zap, Target, Medal, 
  TrendingUp, Activity, Lock, Eye, Share2, Award, 
  Military, MapPin, School, Flame, Box, Cpu, HardDrive,
  UserCheck, Bell, Sword, Users, BarChart3, Clock ,Search
} from 'lucide-react';

// ==========================================
// 1. الثوابت ونظام الرتب (Constants)
// ==========================================
const RANK_SYSTEM = [
  { level: 0, title: "Recuit - مستجد", icon: "🔰", minXP: 0 },
  { level: 10, title: "Operative - عميل ميداني", icon: "🛡️", minXP: 1000 },
  { level: 30, title: "Sergeant - رقيب", icon: "🎖️", minXP: 5000 },
  { level: 50, title: "Commander - قائد", icon: "🎖️", minXP: 15000 },
  { level: 70, title: "General - جنرال", icon: "🔱", minXP: 50000 },
  { level: 100, title: "MaFa Emperor - إمبراطور Mafa", icon: "👑", minXP: 150000 },
];

// ==========================================
// 2. المكونات البصرية المساعدة (Visual Helpers)
// ==========================================

const GodRays = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    <div className="ray ray-1" />
    <div className="ray ray-2" />
    <div className="ray ray-3" />
  </div>
);

const CustomCursor = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const updatePosition = (e) => setPosition({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", updatePosition);
    return () => window.removeEventListener("mousemove", updatePosition);
  }, []);
  return (
    <motion.div
      className="fixed top-0 left-0 w-8 h-8 rounded-full border-2 border-cyan-500 pointer-events-none z-[9999] mix-blend-difference"
      animate={{ x: position.x - 16, y: position.y - 16 }}
      transition={{ type: "spring", stiffness: 500, damping: 28 }}
    >
      <div className="absolute inset-0 bg-cyan-500/20 rounded-full animate-ping" />
    </motion.div>
  );
};

const getFrameStyle = (rank) => {
  if (rank === 1) return "frame-emperor shadow-gold";
  if (rank <= 3) return "frame-elite shadow-silver";
  if (rank <= 10) return "frame-commander shadow-cyan";
  return "frame-basic";
};

// ==========================================
// 3. المكونات الفرعية (Sub-Components)
// ==========================================

const HeroCard = ({ agent, rank, isEmperor = false }) => (
  <div className="p-6 h-full flex flex-col items-center justify-between relative overflow-hidden group">
    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none" />
    
    <div className="text-center z-10">
       <div className={`w-32 h-32 md:w-40 md:h-40 rounded-full mx-auto p-1.5 border-4 mb-4 relative ${getFrameStyle(rank)}`}>
          <img src={agent.photoURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} alt="" className="w-full h-full object-cover rounded-full grayscale group-hover:grayscale-0 transition-all" />
          <div className="absolute -inset-2 border border-cyan-500/20 rounded-full animate-ping-slow" />
       </div>
       <h4 className="font-zen text-xl md:text-2xl tracking-tighter mb-1 truncate px-2">
         {agent.fullName}
       </h4>
       <div className="flex flex-col gap-1 items-center">
          <span className="text-[10px] bg-white/10 px-3 py-1 rounded-full border border-white/5 flex items-center gap-2">
            <School size={10} /> {agent.school}
          </span>
          <span className="text-[10px] text-gray-400 flex items-center gap-2">
            <MapPin size={10} /> {agent.governorate}
          </span>
       </div>
    </div>

    <div className="w-full space-y-3 z-10">
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-[0.2em]">
        <span className="text-cyan-400">XP Points</span>
        <span>{agent.totalXP?.toLocaleString()}</span>
      </div>
      <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
        <motion.div 
          initial={{ width: 0 }}
          whileInView={{ width: '90%' }}
          className={`h-full ${isEmperor ? 'bg-yellow-500 shadow-[0_0_15px_#ffd700]' : 'bg-cyan-500 shadow-[0_0_10px_#00f3ff]'}`}
        />
      </div>
    </div>

    <div className="absolute top-4 right-4 bg-black/60 border border-white/10 w-10 h-10 rounded-lg flex items-center justify-center font-zen text-sm shadow-xl">
       #{rank}
    </div>
  </div>
);

const AgentRow = ({ agent, index }) => (
  <motion.div
    initial={{ x: -20, opacity: 0 }}
    whileInView={{ x: 0, opacity: 1 }}
    transition={{ delay: index * 0.05 }}
    className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 hover:border-cyan-500/50 transition-all group relative overflow-hidden"
  >
    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    
    <div className="font-zen text-xl w-12 text-center text-gray-500 group-hover:text-cyan-400 font-bold">
      #{index}
    </div>
    <div className="relative w-12 h-12 rounded-full border border-white/10">
      <img src={agent.photoURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} alt={agent.fullName} className="w-full h-full object-cover rounded-full" />
      {index <= 3 && <div className="absolute -top-2 -right-2 text-lg">👑</div>}
    </div>
    <div className="flex-1 z-10">
      <h4 className="font-bold text-white group-hover:text-cyan-400 transition-colors flex items-center gap-2">
        {agent.fullName}
        {agent.isRisingStar && <span className="text-[8px] bg-yellow-500 text-black px-1 rounded animate-pulse">RISING</span>}
      </h4>
      <div className="flex gap-3 text-[10px] text-gray-400">
        <span className="flex items-center gap-1"><School size={10} /> {agent.school}</span>
        <span className="flex items-center gap-1"><MapPin size={10} /> {agent.governorate}</span>
      </div>
    </div>
    <div className="text-right z-10">
      <div className="text-cyan-400 font-zen font-bold text-sm">{agent.totalXP?.toLocaleString()} XP</div>
      <div className="text-[10px] text-gray-500 flex items-center justify-end gap-1">
        <Zap size={8} className="text-yellow-500" /> {agent.streak || 0} Day Streak
      </div>
    </div>
  </motion.div>
);

// ==========================================
// 4. واجهة المستخدم (The Interface)
// ==========================================
const TitanInterface = ({ students, currentUser, activeTab, setActiveTab, logic }) => {
  const topThree = students.slice(0, 3);
  const others = students.slice(3);

  return (
    <div className="relative min-h-screen bg-[#02000d] text-white p-4 md:p-10 font-raj overflow-hidden">
      <GodRays />
      <CustomCursor />

      {/* Header */}
      <header className="relative z-50 flex justify-between items-center mb-20 border-b border-cyan-500/20 pb-6">
        <div className="flex gap-6 items-center">
          <motion.div 
            animate={{ rotate: [0, 90, 180, 270, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-2 border-dashed border-cyan-500 rounded-full flex items-center justify-center"
          >
            <Cpu className="text-cyan-400" size={32} />
          </motion.div>
          <div>
            <h1 className="text-4xl font-zen tracking-tighter uppercase">
              Titan <span className="text-cyan-500">Protocol</span>
            </h1>
            <p className="text-xs text-cyan-500/60 tracking-[0.5em]">SYSTEM_VERSION_3.9.4_STABLE</p>
          </div>
        </div>

        <div className="hidden lg:flex gap-12 text-[10px] font-bold tracking-widest text-gray-400">
          <div className="flex flex-col border-l-2 border-cyan-500 pl-4">
            <span>ACTIVE_AGENTS</span>
            <span className="text-white text-xl font-zen">1,402</span>
          </div>
          <div className="flex flex-col border-l-2 border-purple-500 pl-4">
            <span>TOTAL_XP_BURNED</span>
            <span className="text-white text-xl font-zen">8.4M</span>
          </div>
          <div className="flex flex-col border-l-2 border-yellow-500 pl-4">
            <span>EMPEROR_STATUS</span>
            <span className="text-white text-xl font-zen">PROTECTED</span>
          </div>
        </div>
      </header>

      {/* Podium Section */}
      <section className="relative z-10 mb-60">
        <div className="flex flex-col lg:flex-row justify-center items-end gap-10 lg:gap-20 h-[600px]">
          {/* 2nd Place */}
          {topThree[1] && (
            <motion.div 
              initial={{ x: -100, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              className="w-full lg:w-80 h-[450px] podium-base silver-gradient relative"
            >
              <HeroCard agent={topThree[1]} rank={2} />
              <div className="podium-label">WARLORD</div>
            </motion.div>
          )}

          {/* 1st Place */}
          {topThree[0] && (
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              className="w-full lg:w-[450px] h-[550px] podium-base gold-gradient relative z-30"
            >
              <div className="absolute -top-20 left-1/2 -translate-x-1/2">
                 <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                    <Crown size={80} className="text-yellow-400 filter drop-shadow-[0_0_20px_rgba(255,215,0,0.8)]" />
                 </motion.div>
              </div>
              <HeroCard agent={topThree[0]} rank={1} isEmperor={true} />
              <div className="podium-label text-3xl">THE EMPEROR</div>
              <div className="absolute inset-0 bg-yellow-500/10 blur-[120px] rounded-full -z-10 animate-pulse" />
            </motion.div>
          )}

          {/* 3rd Place */}
          {topThree[2] && (
            <motion.div 
              initial={{ x: 100, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              className="w-full lg:w-80 h-96 podium-base bronze-gradient relative"
            >
              <HeroCard agent={topThree[2]} rank={3} />
              <div className="podium-label">COMMANDER</div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Dashboard & Filters */}
      <main className="max-w-7xl mx-auto pb-20">
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
           <h3 className="font-zen text-3xl flex items-center gap-4">
             <Activity className="text-cyan-400" /> 
             ACTIVE_DASHBOARD 
             <span className="text-[10px] bg-cyan-500/10 text-cyan-500 px-3 py-1 rounded-full border border-cyan-500/20">LIVE DATA</span>
           </h3>
           
           {/* Tab Switcher */}
           <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
              {['global', 'school', 'governorate'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2 rounded-lg text-xs font-bold transition-all uppercase ${activeTab === tab ? 'bg-cyan-500 text-black' : 'hover:bg-white/5 text-gray-400'}`}
                >
                  {tab}
                </button>
              ))}
           </div>
        </div>

        {/* Search HUD */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
           <div className="md:col-span-2 relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
             <input 
               type="text" 
               placeholder="SEARCH AGENTS..." 
               value={logic.searchQuery}
               onChange={(e) => logic.setSearchQuery(e.target.value)}
               className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 text-white font-raj focus:border-cyan-500 outline-none transition-all"
             />
           </div>
           <div className="bg-white/5 border border-white/10 rounded-2xl flex items-center justify-around px-4">
              <span className="text-[10px] text-gray-500 uppercase">Sort by:</span>
              <select className="bg-transparent text-xs font-bold outline-none">
                <option>TOTAL XP</option>
                <option>LIGHT POINTS</option>
              </select>
           </div>
           <div 
              onClick={() => logic.playSound('click')}
              className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl flex items-center justify-center gap-4 cursor-pointer hover:bg-cyan-500 transition-all group"
           >
              <Share2 size={18} className="text-cyan-400 group-hover:text-black" />
              <span className="text-xs font-bold group-hover:text-black uppercase">Share</span>
           </div>
        </div>

        {/* List */}
        <div className="space-y-4">
          <AnimatePresence>
            {others.map((agent, index) => (
              <AgentRow key={agent.id} agent={agent} index={index + 4} />
            ))}
          </AnimatePresence>
        </div>
      </main>

      {/* Floating Notifications */}
      <aside className="fixed bottom-10 right-10 z-[100] hidden md:flex flex-col gap-4">
         <div className="p-4 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl w-80">
            <div className="flex items-center gap-3 mb-3 border-b border-white/5 pb-3">
               <Bell size={16} className="text-yellow-400" />
               <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300">Live Feed</span>
            </div>
            <div className="space-y-3">
               {logic?.liveFeed?.length > 0 ? logic.liveFeed.slice(0, 2).map((event, i) => (
                  <div key={i} className="text-[11px] text-gray-400">
                    <span className="text-cyan-400 font-bold">System:</span> {event.msg}
                  </div>
               )) : (
                 <div className="text-[11px] text-gray-500 italic">Scanning for signals...</div>
               )}
            </div>
         </div>
      </aside>
    </div>
  );
};

// =========================================================
// 5. الـ Hook المنطقي العملاق (Logic Engine)
// =========================================================
const useTitanLogic = (currentUser, globalStudents) => {
  const currentUserUid = currentUser?.uid;
  
  // ---------------------------------------------------------
  // [1] State Management
  // ---------------------------------------------------------
  const [currentUserData, setCurrentUserData] = useState(currentUser || {});
  const [challenges, setChallenges] = useState([]);      
  const [duels, setDuels] = useState({ active: false, opponent: null }); 
  const [liveFeed, setLiveFeed] = useState([]);           
  const [mentorPoints, setMentorPoints] = useState(0);    
  const [searchQuery, setSearchQuery] = useState("");
  
  // AI & Analytics
  const [prediction, setPrediction] = useState({ nextRankIn: 0, status: 'stable' });
  const [predictedPath, setPredictedPath] = useState([]);     
  const [heatMapData, setHeatMapData] = useState([]);         
  const [skillRadar, setSkillRadar] = useState({              
    speed: 0, accuracy: 0, dedication: 0, persistence: 0, strategy: 0, logic: 0
  });

  // Awards
  const [inventory, setInventory] = useState([]);            
  const [lootBoxes, setLootBoxes] = useState(0);              
  const [powerUps, setPowerUps] = useState({                  
    doubleXP: { active: false, timeLeft: 0 },
    ghostMode: { active: false, timeLeft: 0 },
    shield: { active: false, timeLeft: 0 }
  });
  const [digitalCerts, setDigitalCerts] = useState([]);       

  // Gamification
  const [currentStreak, setCurrentStreak] = useState(0);      
  const [prestigeLevel, setPrestigeLevel] = useState(0);      
  const [soundEnabled, setSoundEnabled] = useState(true);     
  const [easterEggsFound, setEasterEggs] = useState([]);      
  const [notifications, setNotifications] = useState([]); 
  const [nemesis, setNemesis] = useState(null); 

  // ---------------------------------------------------------
  // [2] Initialization & Data Sync
  // ---------------------------------------------------------
  useEffect(() => {
    if (globalStudents.length > 0 && currentUserUid) {
      const me = globalStudents.find(s => s.id === currentUserUid);
      if (me) {
        setCurrentUserData(me);
        setCurrentStreak(me.streak || 0);
        const myIndex = globalStudents.indexOf(me);
        if (myIndex > 0) setNemesis(globalStudents[myIndex - 1]);
        
        // Run initial predictions
        runAIPrediction(me);
        checkRankClimb();
      }
    }
  }, [globalStudents, currentUserUid]);

  // Live Feed Listener
  useEffect(() => {
    const q = query(collection(db, "global_events"), orderBy("time", "desc"), limit(5));
    const unsub = onSnapshot(q, (snap) => {
      setLiveFeed(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // ---------------------------------------------------------
  // [3] Core Functions
  // ---------------------------------------------------------
  
  const calculateRank = (xp) => {
    return RANK_SYSTEM.slice().reverse().find(r => xp >= r.minXP) || RANK_SYSTEM[0];
  };

  const getNextLevelProgress = (xp) => {
    const currentRank = calculateRank(xp);
    const nextRank = RANK_SYSTEM[RANK_SYSTEM.indexOf(currentRank) + 1];
    if (!nextRank) return 100;
    const range = nextRank.minXP - currentRank.minXP;
    const progress = ((xp - currentRank.minXP) / range) * 100;
    return Math.min(progress, 100);
  };

  const playSound = (type) => {
    if (!soundEnabled) return;
    const audio = new Audio(`/sounds/${type}.mp3`); // Ensure you have files
    audio.play().catch(() => {});
  };

  // ---------------------------------------------------------
  // [4] Advanced Logic Engines
  // ---------------------------------------------------------

  // AI Prediction
  const runAIPrediction = (student) => {
    const dailyVelocity = student.dailyXP || 100; 
    const currentRank = calculateRank(student.totalXP);
    const nextRank = RANK_SYSTEM[RANK_SYSTEM.indexOf(currentRank) + 1];
    
    if (nextRank) {
      const xpNeeded = nextRank.minXP - student.totalXP;
      const days = Math.ceil(xpNeeded / dailyVelocity);
      
      setPrediction({ 
        nextRankIn: days, 
        status: dailyVelocity > 500 ? 'aggressive' : 'stable' 
      });

      setPredictedPath({
        target: nextRank.title,
        eta: days,
        velocity: dailyVelocity
      });
    }
  };

  // Rank Climb Notification
  const checkRankClimb = () => {
    const oldRank = localStorage.getItem('last_known_rank');
    const newRank = currentUserData.globalRank;
    if (oldRank && newRank < oldRank) {
       setNotifications(prev => [...prev, { msg: `You climbed to #${newRank}!`, type: 'rank_up' }]);
       playSound('rank-up');
    }
    localStorage.setItem('last_known_rank', newRank);
  };

  // Prestige System
  const processPrestige = async () => {
    if (currentUserData.totalXP >= 150000) {
       await updateDoc(doc(db, "users", currentUserUid), {
         totalXP: 0,
         prestigeLevel: increment(1),
         specialFrame: "LEGENDARY_FRAME_V1"
       });
       setPrestigeLevel(prev => prev + 1);
       confetti({ particleCount: 200, spread: 100 });
       playSound('levelup');
    }
  };

  // Achievement System
  const checkAchievements = useCallback((userData) => {
    const badgeDefinitions = [
      { id: 'first_1k', name: 'Alpha Strike', icon: '⚡', criteria: (p) => p.totalXP >= 1000 },
      { id: 'streak_7', name: 'Week on Fire', icon: '🔥', criteria: (p) => p.streak >= 7 },
    ];
    const newBadges = badgeDefinitions.filter(badge => 
      badge.criteria(userData) && !inventory.includes(badge.id)
    );
    if (newBadges.length > 0) {
      newBadges.forEach(b => {
         setNotifications(prev => [...prev, { type: 'badge', content: `Unlocked: ${b.name}` }]);
         updateDoc(doc(db, "users", currentUserUid), { badges: arrayUnion(b.id) });
      });
    }
  }, [inventory, currentUserUid]);

  // Duel System
  const initiateDuel = async (opponentId) => {
    if(!currentUserUid) return;
    const duelId = `duel_${currentUserUid}_${opponentId}`;
    await setDoc(doc(db, "duels", duelId), {
      challenger: currentUserUid,
      target: opponentId,
      status: 'pending',
      timestamp: serverTimestamp()
    });
    setNotifications(prev => [...prev, { msg: "Duel request sent!", type: 'duel' }]);
  };

  // Power Ups
  const activatePowerUp = (type) => {
    const duration = 3600; 
    setPowerUps(prev => ({ ...prev, [type]: { active: true, timeLeft: duration } }));
  };

  // Skill Radar
  const updateSkillRadar = (stats) => {
    const newRadar = {
      speed: (stats.correctAnswers / stats.totalTime) * 100 || 50,
      accuracy: (stats.correctAnswers / stats.totalAttempts) * 100 || 50,
      dedication: (stats.streak / 30) * 100 || 50,
      logic: 80
    };
    setSkillRadar(newRadar);
  };

  // Rank Decay
  const applyRankDecay = useCallback(async () => {
    if(!currentUserData.lastActivity) return;
    const lastSeen = currentUserData.lastActivity?.toDate();
    const daysInactive = (new Date() - lastSeen) / (1000 * 60 * 60 * 24);
    if (daysInactive > 7) {
      console.log("Rank Decay Warning");
      // await updateDoc(...) // Uncomment to enable penalty
    }
  }, [currentUserData]);

  // System Weather (Mood)
  const getSystemWeather = () => {
    if (currentStreak > 5) return "STORM_MODE"; 
    if (currentUserData.globalRank <= 3) return "GOLDEN_HOUR"; 
    return "NIGHT_MODE"; 
  };

  // Easter Egg
  useEffect(() => {
    const handleSecretCode = (e) => {
      if (e.key === 'F9') alert("Easter Egg: Developer Mode Active");
    };
    window.addEventListener('keydown', handleSecretCode);
    return () => window.removeEventListener('keydown', handleSecretCode);
  }, []);

  // ---------------------------------------------------------
  // [5] Return Interface
  // ---------------------------------------------------------
  return {
    currentUserData,
    searchQuery, setSearchQuery,
    skillRadar,
    predictedPath,
    liveFeed,
    inventory,
    powerUps,
    currentStreak,
    prestigeLevel,
    nemesis,
    notifications,
    prediction,
    
    // Functions
    calculateRank,
    getNextLevelProgress,
    initiateDuel,
    activatePowerUp,
    processPrestige,
    updateSkillRadar,
    applyRankDecay,
    checkAchievements,
    playSound,
    getSystemWeather
  };
};

// =========================================================
// 6. المكون الرئيسي (Main Export)
// =========================================================
const HallOfLegends = () => {
  const [globalStudents, setGlobalStudents] = useState([]);
  const [activeTab, setActiveTab] = useState('global');
  const [loading, setLoading] = useState(true);

  // 1. Fetch Data
  useEffect(() => {
    const q = query(
      collection(db, "users"),
      orderBy("totalXP", "desc"),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const students = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fullName: doc.data().fullName || "Unknown Agent",
        school: doc.data().school || "N/A",
        governorate: doc.data().governorate || "N/A",
        photoURL: doc.data().photoURL || null,
        totalXP: doc.data().totalXP || 0
      }));
      setGlobalStudents(students);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Initialize Logic
  const logic = useTitanLogic(auth.currentUser, globalStudents);

  // 3. Filtering
  const displayStudents = useMemo(() => {
    let list = globalStudents;
    
    // Search Filter
    if (logic.searchQuery) {
      list = list.filter(s => 
        s.fullName.toLowerCase().includes(logic.searchQuery.toLowerCase()) ||
        s.governorate.includes(logic.searchQuery)
      );
    }

    // Tab Filter
    if (!logic.currentUserData?.school) return list;
    if (activeTab === 'school') {
      return list.filter(s => s.school === logic.currentUserData.school);
    }
    if (activeTab === 'governorate') {
      return list.filter(s => s.governorate === logic.currentUserData.governorate);
    }
    return list;
  }, [globalStudents, activeTab, logic.currentUserData, logic.searchQuery]);

  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-cyan-500 font-zen gap-4">
      <Cpu className="animate-spin" size={40} />
      <span className="tracking-[0.5em] animate-pulse">INITIALIZING TITAN PROTOCOL...</span>
    </div>
  );

  return (
    <div className={`titan-wrapper ${logic.getSystemWeather() === 'STORM_MODE' ? 'bg-slate-900' : ''}`}>
      <TitanInterface 
        students={displayStudents} 
        currentUser={logic.currentUserData} 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        logic={logic} 
      />
      
      {/* Nemesis Alert Overlay */}
      {logic.nemesis && (
        <div className="fixed top-24 right-4 bg-red-900/80 border border-red-500 p-3 rounded-lg z-40 max-w-[200px] animate-pulse">
           <h5 className="text-[10px] text-red-200 uppercase tracking-widest mb-1">Target Identified</h5>
           <p className="text-xs font-bold text-white">Beat <span className="text-red-400">{logic.nemesis.fullName}</span> to rank up!</p>
           <div className="text-[10px] text-right mt-1 text-red-300">diff: {(logic.nemesis.totalXP - logic.currentUserData.totalXP).toLocaleString()} XP</div>
        </div>
      )}

      {/* Logic Notifications Overlay */}
      <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2">
         {logic.notifications.map((note, idx) => (
           <motion.div 
             key={idx}
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             exit={{ opacity: 0 }}
             className="bg-cyan-900/80 border border-cyan-500 p-2 rounded text-xs text-cyan-100"
           >
             {note.msg || note.content}
           </motion.div>
         ))}
      </div>
    </div>
  );
};

export default HallOfLegends;
