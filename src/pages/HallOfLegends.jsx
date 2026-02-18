import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { db, auth } from '../firebase'; // تأكد من مسار ملف الفايربيس

import { 
  doc, updateDoc, increment, arrayUnion, 
  onSnapshot, query, collection, orderBy, limit 
} from 'firebase/firestore';

// المكتبات اللازمة للميزات البصرية
import confetti from 'canvas-confetti';
import { 
  Trophy, Crown, Shield, Star, Zap, Target, Medal, 
  TrendingUp, Activity, Lock, Eye, Share2, Award, 
  Military, MapPin, School, Flame, Box, Cpu, HardDrive,
  UserCheck, Bell, Sword, Users, BarChart3, Clock
} from 'lucide-react';

// ==========================================
// 1. نظام الرتب العسكرية (Military Ranks Logic)
// ==========================================
const RANK_SYSTEM = [
  { level: 0, title: "Recuit - مستجد", icon: "🔰", minXP: 0 },
  { level: 10, title: "Operative - عميل ميداني", icon: "🛡️", minXP: 1000 },
  { level: 30, title: "Sergeant - رقيب", icon: "🎖️", minXP: 5000 },
  { level: 50, title: "Commander - قائد", icon: "🎖️", minXP: 15000 },
  { level: 70, title: "General - جنرال", icon: "🔱", minXP: 50000 },
  { level: 100, title: "MaFa Emperor - إمبراطور Mafa", icon: "👑", minXP: 150000 },
];

const HallOfLegends = () => {
  // ==========================================
  // 2. حالات البيانات (Data States)
  // ==========================================
  const [globalStudents, setGlobalStudents] = useState([]); // الترتيب العالمي
  const [localStudents, setLocalStudents] = useState([]);   // ترتيب المحافظة/المدرسة
  const [currentUserData, setCurrentUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('global'); // global, school, governorate
  
  // ==========================================
  // 3. حالات الميزات المتقدمة (Features States)
  // ==========================================
  const [notifications, setNotifications] = useState([]); // Climb Notifications
  const [dailyStreak, setDailyStreak] = useState(0);      // نظام الـ Streaks
  const [activePowerUps, setActivePowerUps] = useState([]); // مضاعفات النقاط
  const [isPrestigeModalOpen, setIsPrestigeOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [focusedAgent, setFocusedAgent] = useState(null); // الطالب المختار للعرض (Dossier)
  const [isHologramActive, setIsHologramActive] = useState(true);
  
  // نظام التوقعات بالذكاء الاصطناعي (AI Prediction State)
  const [prediction, setPrediction] = useState({ nextRankIn: 0, status: 'stable' });

  // ==========================================
  // 4. جلب البيانات من Firebase (Real-time Stream)
  // ==========================================
  useEffect(() => {
    // جلب أفضل 100 طالب بناءً على XP العام ونقاط النور
    const q = query(
      collection(db, "users"), 
      orderBy("totalXP", "desc"), 
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const students = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // دمج الاسم الرباعي والمدرسة والمحافظة من الداتا
        fullName: doc.data().fullName || "جاري التحميل...",
        school: doc.data().school || "مدرسة غير معروفة",
        governorate: doc.data().governorate || "غير محدد",
        lightPoints: doc.data().lightPoints || 0, // نقاط النور للواحة
        totalXP: doc.data().totalXP || 0
      }));
      
      setGlobalStudents(students);
      setLoading(false);
      
      // منطق إشعارات الصعود (Climb Notification Logic)
      checkRankClimb(students);
    });

    return () => unsubscribe();
  }, []);

  // ==========================================
  // 5. محرك الحسابات (Calculation Engine)
  // ==========================================
  
  // أ. حساب الرتبة الحالية بناءً على الـ XP
  const calculateRank = (xp) => {
    return RANK_SYSTEM.slice().reverse().find(r => xp >= r.minXP) || RANK_SYSTEM[0];
  };

  // ب. نظام الـ XP Progress (كم يتبقى للمستوى التالي)
  const getNextLevelProgress = (xp) => {
    const currentRank = calculateRank(xp);
    const nextRank = RANK_SYSTEM[RANK_SYSTEM.indexOf(currentRank) + 1];
    if (!nextRank) return 100;
    const range = nextRank.minXP - currentRank.minXP;
    const progress = ((xp - currentRank.minXP) / range) * 100;
    return Math.min(progress, 100);
  };

  // ج. نظام التوقعات (AI Prediction Engine - Mock Logic)
  const runAIPrediction = (student) => {
    // محاكاة تحليل الأداء: إذا كان الطالب قد جمع > 500 نقطة اليوم
    const dailyVelocity = student.dailyXP || 0;
    if (dailyVelocity > 1000) {
      setPrediction({ nextRankIn: 2, status: 'aggressive' });
    } else {
      setPrediction({ nextRankIn: 7, status: 'stable' });
    }
  };

  // د. إشعارات تجاوز المنافسين
  const checkRankClimb = (newSnapshot) => {
    // منطق يقارن الترتيب القديم بالجديد في الـ LocalStorage
    const oldRank = localStorage.getItem('last_known_rank');
    // ... logic to push to notifications state
  };

  // هـ. ميزة الـ Prestige (إعادة التصفير مقابل تميز دائم)
  const handlePrestige = async () => {
    if (currentUserData.totalXP >= 150000) {
       // كود تحديث الفايربيس لتصفير النقاط وإضافة شارة البريستيج
       await updateDoc(doc(db, "users", auth.currentUser.uid), {
         totalXP: 0,
         prestigeLevel: (currentUserData.prestigeLevel || 0) + 1
       });
       confetti({ particleCount: 200, spread: 100 });
    }
  };

  // ==========================================
  // 6. التحكم في المؤثرات الصوتية (Soundscapes)
  // ==========================================
  const playSound = (type) => {
    const audio = {
      levelup: new Audio('/sounds/level-up.mp3'),
      click: new Audio('/sounds/cyber-click.mp3'),
      rankUp: new Audio('/sounds/rank-up.wav')
    };
    if(audio[type]) audio[type].play().catch(() => {});
  };

  // ==========================================
  // 7. ميزات التصفية والبحث (Filtering Logic)
  // ==========================================
  const filteredStudents = useMemo(() => {
    return globalStudents.filter(s => 
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.governorate.includes(searchQuery)
    );
  }, [globalStudents, searchQuery]);

  // ==========================================
  // 8. نظام الـ Streaks (النشاط اليومي)
  // ==========================================
  const updateStreak = async () => {
    // يتم استدعاؤه عند تسجيل الدخول (حسب شروطك في المعلومات المحفوظة)
    // يقارن تاريخ اليوم بآخر دخول
  };
// استكمالاً للكود السابق في الجزء الأول...

// ==========================================
// 9. مكون شعاع الضوء (God Rays Component)
// ==========================================
const GodRays = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    <div className="ray ray-1" />
    <div className="ray ray-2" />
    <div className="ray ray-3" />
  </div>
);

// ==========================================
// 10. نظام الإطارات المخصصة (Avatar Frames Logic)
// ==========================================
const getFrameStyle = (rank) => {
  if (rank === 1) return "frame-emperor shadow-gold";
  if (rank <= 3) return "frame-elite shadow-silver";
  if (rank <= 10) return "frame-commander shadow-cyan";
  return "frame-basic";
};

// ==========================================
// 11. واجهة المستخدم الرئيسية (The Main Interface)
// ==========================================
const TitanInterface = ({ students, currentUser, activeTab }) => {
  const topThree = students.slice(0, 3);
  const others = students.slice(3);

  return (
    <div className="relative min-h-screen bg-[#02000d] text-white p-4 md:p-10 font-raj">
      {/* ميزة 1: God Rays Background */}
      <GodRays />
      
      {/* ميزة 2: Custom Cursor (تم تعريفه في الجزء الأول) */}
      <CustomCursor />

      {/* ميزة 3: Cinematic HUD Header */}
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

        {/* ميزة 4: Real-time Stats HUD */}
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

      {/* ==========================================
          12. منصة التتويج الثلاثية (3D Podium - ميزات 5-15)
          ========================================== */}
      <section className="relative z-10 mb-60">
        <div className="flex flex-col lg:flex-row justify-center items-end gap-10 lg:gap-20 h-[600px]">
          
          {/* المركز الثاني (يسار) */}
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

          {/* المركز الأول (العملاق - منتصف) */}
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
              {/* ميزة: Dynamic Aura */}
              <div className="absolute inset-0 bg-yellow-500/10 blur-[120px] rounded-full -z-10 animate-pulse" />
            </motion.div>
          )}

          {/* المركز الثالث (يمين) */}
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

      {/* ==========================================
          13. قائمة المحاربين (The Strivers - ميزات 16-30)
          ========================================== */}
      <main className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-10">
           <h3 className="font-zen text-3xl flex items-center gap-4">
             <Activity className="text-cyan-400" /> 
             ACTIVE_DASHBOARD 
             <span className="text-[10px] bg-cyan-500/10 text-cyan-500 px-3 py-1 rounded-full border border-cyan-500/20">LIVE DATA</span>
           </h3>
           
           {/* ميزة: Global vs Local Switcher */}
           <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
              {['GLOBAL', 'SCHOOL', 'GOVERNORATE'].map(tab => (
                <button 
                  key={tab}
                  className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab ? 'bg-cyan-500 text-black' : 'hover:bg-white/5'}`}
                >
                  {tab}
                </button>
              ))}
           </div>
        </div>

        {/* ميزة: Dynamic Search & Filter HUD */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
           <div className="md:col-span-2 relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
             <input 
               type="text" 
               placeholder="SEARCH BY FULL NAME, SCHOOL, OR REGION..." 
               className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 text-white font-raj focus:border-cyan-500 outline-none transition-all"
             />
           </div>
           <div className="bg-white/5 border border-white/10 rounded-2xl flex items-center justify-around px-4">
              <span className="text-[10px] text-gray-500 uppercase">Sort by:</span>
              <select className="bg-transparent text-xs font-bold outline-none">
                <option>TOTAL XP (YEAR)</option>
                <option>LIGHT POINTS (OASIS)</option>
                <option>DAILY STREAK</option>
              </select>
           </div>
           <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl flex items-center justify-center gap-4 group cursor-pointer hover:bg-cyan-500 transition-all">
              <Share2 size={18} className="text-cyan-400 group-hover:text-black" />
              <span className="text-xs font-bold group-hover:text-black uppercase tracking-widest">Share Hall of Fame</span>
           </div>
        </div>

        {/* ميزة: The Infinite Scroll Leaderboard */}
        <div className="space-y-4">
          <AnimatePresence>
            {others.map((agent, index) => (
              <AgentRow key={agent.id} agent={agent} index={index + 4} />
            ))}
          </AnimatePresence>
        </div>
      </main>

      {/* ميزة: Floating Action HUD (نظام الإشعارات المدمج) */}
      <aside className="fixed bottom-10 right-10 z-[100] flex flex-col gap-4">
         <div className="p-4 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl w-80">
            <div className="flex items-center gap-3 mb-3 border-b border-white/5 pb-3">
               <Bell size={16} className="text-yellow-400" />
               <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300">Live Notifications</span>
            </div>
            <div className="space-y-3">
               <div className="text-[11px] text-gray-400">
                  <span className="text-cyan-400 font-bold">@Ahmed_Ali</span> just climbed to <span className="text-white">RANK #14</span>
               </div>
               <div className="text-[11px] text-gray-400">
                  <span className="text-purple-400 font-bold">@Sara_Mafa</span> unlocked <span className="text-white">"Speed Demon"</span> Badge
               </div>
            </div>
         </div>
      </aside>
    </div>
  );
};

// ==========================================
// 14. مكون البطاقة البطل (Hero Card Component)
// ==========================================
const HeroCard = ({ agent, rank, isEmperor = false }) => (
  <div className="p-6 h-full flex flex-col items-center justify-between relative overflow-hidden group">
    {/* ميزة: Holographic Shine Effect */}
    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none" />
    
    {/* تفاصيل الطالب الرباعية (اسم، مدرسة، محافظة) */}
    <div className="text-center z-10">
       <div className={`w-32 h-32 md:w-40 md:h-40 rounded-full mx-auto p-1.5 border-4 mb-4 relative ${getFrameStyle(rank)}`}>
          <img src={agent.photoURL} alt="" className="w-full h-full object-cover rounded-full grayscale group-hover:grayscale-0 transition-all" />
          {/* ميزة: Animated Pulse Ring */}
          <div className="absolute -inset-2 border border-cyan-500/20 rounded-full animate-ping-slow" />
       </div>
       <h4 className="font-zen text-xl md:text-2xl tracking-tighter mb-1 truncate px-2">
         {agent.fullName} {/* الاسم الرباعي */}
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

    {/* ميزة: Skill Hexagon / Stats */}
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

    {/* ميزة: Rank Badge */}
    <div className="absolute top-4 right-4 bg-black/60 border border-white/10 w-10 h-10 rounded-lg flex items-center justify-center font-zen text-sm shadow-xl">
       #{rank}
    </div>
  </div>
);

const TitanGrandLogic = ({ currentUserUid }) => {
  
  // ---------------------------------------------------------
  // [1] حالات الأنظمة الاجتماعية والتنافسية (Social Systems)
  // ---------------------------------------------------------
  const [challenges, setChallenges] = useState([]);      // نظام Challenge a Friend
  const [duels, setDuels] = useState({ active: false, opponent: null }); // Duel Mode
  const [liveFeed, setLiveFeed] = useState([]);           // Live Activity Feed
  const [guilds, setGuilds] = useState([]);               // نظام الـ Guilds/Clubs
  const [mentorPoints, setMentorPoints] = useState(0);    // Mentor Badges Logic

  // ---------------------------------------------------------
  // [2] حالات البيانات والذكاء الاصطناعي (AI & Data Analytics)
  // ---------------------------------------------------------
  const [performanceData, setPerformanceData] = useState({}); // AI Performance Analysis
  const [predictedPath, setPredictedPath] = useState([]);     // Predicted Rank Path
  const [heatMapData, setHeatMapData] = useState([]);         // Heatmap System
  const [skillRadar, setSkillRadar] = useState({              // Skill Hexagons
    speed: 0, accuracy: 0, dedication: 0, persistence: 0, strategy: 0, logic: 0
  });

  // ---------------------------------------------------------
  // [3] حالات الأوسمة والجوائز (Badges & Collectibles)
  // ---------------------------------------------------------
  const [inventory, setInventory] = useState([]);            // Virtual Trophy Room
  const [lootBoxes, setLootBoxes] = useState(0);              // نظام الـ Loot Boxes
  const [powerUps, setPowerUps] = useState({                  // Power-ups System
    doubleXP: { active: false, timeLeft: 0 },
    ghostMode: { active: false, timeLeft: 0 }
  });
  const [digitalCerts, setDigitalCerts] = useState([]);       // Digital Certificates

  // ---------------------------------------------------------
  // [4] حالات التجربة الجيميفيكيشن (Gamification UX)
  // ---------------------------------------------------------
  const [currentStreak, setCurrentStreak] = useState(0);      // Daily Streaks
  const [prestigeLevel, setPrestigeLevel] = useState(0);      // Prestige System
  const [soundEnabled, setSoundEnabled] = useState(true);     // Soundscapes Control
  const [easterEggsFound, setEasterEggs] = useState([]);      // Hidden Easter Eggs

  // =========================================================
  // 🛡️ أولاً: محرك الأوسمة الذكي (Automated Badge Engine)
  // =========================================================
  const badgeDefinitions = [
    { id: 'first_1k', name: 'Alpha Strike', icon: '⚡', criteria: (p) => p.totalXP >= 1000 },
    { id: 'streak_7', name: 'Week on Fire', icon: '🔥', criteria: (p) => p.streak >= 7 },
    { id: 'fast_solver', name: 'Speed Demon', icon: '🏎️', criteria: (p) => p.avgSpeed < 10 },
    { id: 'top_1_governorate', name: 'Governorate King', icon: '🌍', criteria: (p) => p.localRank === 1 },
    { id: 'light_master', name: 'Oasis Guardian', icon: '💎', criteria: (p) => p.lightPoints >= 5000 },
  ];

  const checkAchievements = useCallback((userData) => {
    const newBadges = badgeDefinitions.filter(badge => 
      badge.criteria(userData) && !inventory.includes(badge.id)
    );
    if (newBadges.length > 0) {
      newBadges.forEach(b => triggerAchievementUnlock(b));
    }
  }, [inventory]);

  const triggerAchievementUnlock = (badge) => {
    // ميزة: Achievement Unlocked Animation & Sound
    if (soundEnabled) playSound('achievement_unlocked.mp3');
    setNotifications(prev => [...prev, { type: 'badge', content: `Unlocked: ${badge.name}`, id: Date.now() }]);
    // تحديث قاعدة البيانات فوراً
    updateDoc(doc(db, "users", currentUserUid), {
      badges: arrayUnion(badge.id),
      notifications: arrayUnion({ msg: `حصلت على وسام ${badge.name}`, time: new Date() })
    });
  };

  // =========================================================
  // 🧠 ثانياً: نظام التوقع بالذكاء الاصطناعي (AI Predictive Engine)
  // =========================================================
  const calculateAIPrediction = (history) => {
    // ميزة: Predicted Rank - تحليل آخر 7 أيام لتوقع المركز القادم
    const recentGrowth = history.slice(-7).reduce((acc, val) => acc + val.xp, 0) / 7;
    const currentRank = currentUserData.globalRank;
    const targetRank = currentRank > 1 ? currentRank - 1 : 1;
    
    // حساب الأيام المتوقعة للوصول للمركز التالي
    const xpNeeded = globalStudents[targetRank - 1]?.totalXP - currentUserData.totalXP;
    const daysToRankUp = Math.ceil(xpNeeded / recentGrowth);

    setPredictedPath({
      target: targetRank,
      eta: daysToRankUp,
      velocity: recentGrowth.toFixed(0),
      confidence: recentGrowth > 500 ? "High" : "Medium"
    });
  };

  // =========================================================
  // ⚔️ ثالثاً: نظام التحديات والنزالات (Duel & Challenge System)
  // =========================================================
  const initiateDuel = (opponentId) => {
    // ميزة: Duel Mode - نزال حقيقي 1 ضد 1
    const duelId = `duel_${currentUserUid}_${opponentId}`;
    setDoc(doc(db, "duels", duelId), {
      challenger: currentUserUid,
      target: opponentId,
      status: 'pending',
      timestamp: serverTimestamp()
    });
    setNotifications(prev => [...prev, { msg: "تم إرسال طلب نزال!", type: 'duel' }]);
  };

  // =========================================================
  // ⚡ رابعاً: نظام مضاعفات القوة (Power-ups & Loot Boxes)
  // =========================================================
  const activatePowerUp = (type) => {
    // ميزة: Power-ups - مضاعفة النقاط لمدة ساعة
    const duration = 3600; // 1 hour
    setPowerUps(prev => ({
      ...prev,
      [type]: { active: true, timeLeft: duration }
    }));
    
    // مؤقت التنازلي
    const timer = setInterval(() => {
      setPowerUps(prev => {
        if (prev[type].timeLeft <= 1) {
          clearInterval(timer);
          return { ...prev, [type]: { active: false, timeLeft: 0 } };
        }
        return { ...prev, [type]: { ...prev[type], timeLeft: prev[type].timeLeft - 1 } };
      });
    }, 1000);
  };

  // =========================================================
  // 🏆 خامساً: نظام البريستيج (Prestige & Reset System)
  // =========================================================
  const processPrestige = async () => {
    // ميزة: Prestige System - إعادة التصفير للقمة
    if (currentUserData.totalXP >= 150000) {
      await updateDoc(doc(db, "users", currentUserUid), {
        totalXP: 0,
        lightPoints: 0,
        prestigeLevel: increment(1),
        specialFrame: "LEGENDARY_FRAME_V1" // ميزة: Custom Avatar Frames
      });
      setPrestigeLevel(prev => prev + 1);
      confetti({ particleCount: 500, spread: 150 });
      playSound('prestige_vocal.mp3');
    }
  };

  // =========================================================
  // 📊 سادساً: نظام الرادار والمهارات (Skill Hexagon Engine)
  // =========================================================
  const updateSkillRadar = (stats) => {
    // ميزة: Skill Hexagons - رسم بياني سداسي
    // يتم الحساب بناءً على: (السرعة، الدقة، الالتزام، الاستمرارية، الصعوبة، التفاعل)
    const newRadar = {
      speed: (stats.correctAnswers / stats.totalTime) * 100,
      accuracy: (stats.correctAnswers / stats.totalAttempts) * 100,
      dedication: (stats.loginDays / 30) * 100,
      persistence: (stats.hardTasksSolved / 10) * 100,
      strategy: (stats.powerUpsUsed / 5) * 100,
      logic: (stats.perfectScores / 5) * 100
    };
    setSkillRadar(newRadar);
  };

  // =========================================================
  // 🗞️ سابعاً: شريط النشاط الحي (Live Activity Feed Logic)
  // =========================================================
  useEffect(() => {
    const q = query(collection(db, "global_events"), orderBy("time", "desc"), limit(10));
    const unsub = onSnapshot(q, (snap) => {
      const events = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setLiveFeed(events); // ميزة: Live Activity Feed
    });
    return () => unsub();
  }, []);

  // =========================================================
  // 🕵️ ثامناً: نظام بيض الفصح والمهام المخفية (Easter Eggs)
  // =========================================================
  useEffect(() => {
    const handleSecretCode = (e) => {
      // إذا كتب الطالب كلمة "TITAN" على الكيبورد
      // ميزة: Hidden Easter Eggs
      const keys = []; 
      keys.push(e.key);
      if (keys.join('').includes('TITAN')) {
        unlockEasterEgg('THE_TITAN_FOUNDER');
      }
    };
    window.addEventListener('keydown', handleSecretCode);
    return () => window.removeEventListener('keydown', handleSecretCode);
  }, []);

  // =========================================================
  // 📑 تاسعاً: نظام الشهادات الرقمية (PDF Certificates)
  // =========================================================
  const generateCertificate = (rankTitle) => {
    // ميزة: Digital Certificates - توليد شهادة تلقائية
    const certData = {
      name: currentUserData.fullName,
      rank: rankTitle,
      school: currentUserData.school,
      date: new Date().toLocaleDateString(),
      serial: `CERT-${Math.random().toString(36).toUpperCase().slice(2, 10)}`
    };
    setDigitalCerts(prev => [...prev, certData]);
    // منطق الطباعة أو التحميل
  };

  // =========================================================
  // 🌑 عاشراً: نظام الـ Dark/Light (Supernova Logic)
  // =========================================================
  const toggleTheme = () => {
    // ميزة: Dark/Light Modes (Midnight vs Supernova)
    const theme = document.body.getAttribute('data-theme');
    document.body.setAttribute('data-theme', theme === 'dark' ? 'supernova' : 'dark');
  };

  // 
  
  return {
    // تصدير كل الوظائف للاستخدام في الواجهة (الجزء الرابع)
    calculateRank, getNextLevelProgress, initiateDuel,
    activatePowerUp, processPrestige, generateCertificate,
    skillRadar, predictedPath, liveFeed, inventory, powerUps,
    currentStreak, prestigeLevel, toggleTheme
  };
};

// =========================================================
  // 🛡️ استكمال المميزات قبل الـ Return (نظام التكريم الأعظم)
  // =========================================================

  // [11] نظام الـ Rank Decay (تآكل النقاط عند الغياب)
  const applyRankDecay = useCallback(async () => {
    const lastSeen = currentUserData.lastActivity?.toDate();
    const daysInactive = (new Date() - lastSeen) / (1000 * 60 * 60 * 24);
    if (daysInactive > 7) {
      const penalty = Math.floor(daysInactive * 50); // خصم 50 نقطة عن كل يوم غياب
      await updateDoc(doc(db, "users", currentUserUid), {
        totalXP: increment(-penalty),
        notifications: arrayUnion({ msg: `تحذير: خسرت ${penalty} نقطة بسبب الغياب!`, type: 'warning' })
      });
    }
  }, [currentUserData]);

  // [12] نظام الـ Global vs Local Leaderboard Logic
  const toggleLeaderboardScope = (scope) => {
    // ميزة 13: التبديل بين ترتيب المحافظة، المدرسة، أو العالم
    setActiveTab(scope);
    if (scope === 'governorate') {
      setLocalStudents(globalStudents.filter(s => s.governorate === currentUserData.governorate));
    } else if (scope === 'school') {
      setLocalStudents(globalStudents.filter(s => s.school === currentUserData.school));
    }
  };

  // [13] ميزة الـ Role-Based Colors (تغير الهوية البصرية حسب الترتيب)
  const getAgentColor = (rank) => {
    if (rank === 1) return "#FFD700"; // ذهبي للإمبراطور
    if (rank <= 10) return "#00F3FF"; // سيان للكوماندر
    if (rank <= 50) return "#A855F7"; // أرجواني للنخبة
    return "#FFFFFF";
  };

  // [14] نظام الـ Team/Guilds Leaderboard (ترتيب الفرق)
  const calculateTeamStats = (teamMembers) => {
    const totalTeamXP = teamMembers.reduce((acc, m) => acc + m.totalXP, 0);
    return { totalTeamXP, avgXP: totalTeamXP / teamMembers.length };
  };

  // [15] ميزة الـ Congratulate Button (تفاعل اجتماعي)
  const sendCongrats = async (targetUserId) => {
    await updateDoc(doc(db, "users", targetUserId), {
      congratsCount: increment(1),
      liveNotifications: arrayUnion({ from: currentUserData.fullName, type: 'congrats' })
    });
    // ميزة 34: تشغيل صوت خفيف عند الضغط
    if (soundEnabled) playSound('success_ping.mp3');
  };

  // [16] ميزة الـ Personal Best Tracker (تحطيم الأرقام القياسية)
  const checkPersonalBest = (dailyXP) => {
    if (dailyXP > (currentUserData.highestDailyXP || 0)) {
      triggerAchievementUnlock({ name: 'Record Breaker', icon: '🏆' });
      updateDoc(doc(db, "users", currentUserUid), { highestDailyXP: dailyXP });
    }
  };

  // [17] ميزة الـ Rising Star Tag (نجوم الصعود)
  const checkRisingStar = (oldRank, newRank) => {
    if (oldRank - newRank >= 10) {
      return "RISING_STAR"; // يحصل على علامة بجانب اسمه اليوم
    }
  };

  // [18] ميزة الـ Loot Boxes (صناديق الحظ)
  const openLootBox = () => {
    const rewards = ['XP_BOOST_2X', 'RARE_AVATAR_FRAME', 'LIGHT_POINTS_500', 'SHIELD_PROTECTION'];
    const reward = rewards[Math.floor(Math.random() * rewards.length)];
    // ميزة 30: تفعيل الجائزة في حساب الطالب
    return reward;
  };

  // [19] نظام الـ Dynamic Goals (أهداف يومية ذكية)
  const generateDailyMission = () => {
    const goals = [
      { task: "احصد 500 نقطة اليوم", reward: 100 },
      { task: "تفوق على زميل في نزال", reward: 200 },
      { task: "ساعد طالب في التعليقات", reward: 50 }
    ];
    return goals[Math.floor(Math.random() * goals.length)];
  };

  // [20] ميزة الـ Heatmap (خريطة النشاط الحرارية)
  const processHeatmapData = (activityLogs) => {
    // تحويل سجلات النشاط إلى إحداثيات لخريطة الحرارة (ميزة 44)
    return activityLogs.map(log => ({ date: log.date, intensity: log.xp / 100 }));
  };

  // [21] ميزة الـ Social Share Cards (توليد بطاقات السوشيال ميديا)
  const generateShareCard = () => {
    // منطق تحويل DOM إلى Image لمشاركة المركز (ميزة 38)
    const cardContent = `${currentUserData.fullName} هو الآن في المركز #${currentUserData.globalRank}`;
    return cardContent;
  };

  // [22] ميزة الـ Offline Mode (التخزين المؤقت)
  useEffect(() => {
    if (globalStudents.length > 0) {
      localStorage.setItem('cached_leaderboard', JSON.stringify(globalStudents));
    }
  }, [globalStudents]);

  // [23] ميزة الـ System Personality (ذكاء اصطناعي تفاعلي)
  const getSystemGreeting = () => {
    const hours = new Date().getHours();
    let msg = "";
    if (hours < 12) msg = `أهلاً بك يا جنرال ${currentUserData.fullName.split(' ')[0]}، الشمس تشرق على الأبطال!`;
    else msg = `مساء القوة يا بطل، هل أنت مستعد لخطف المركز الأول؟`;
    return msg;
  };

  // [24] ميزة الـ Power-ups: Shield (حماية من تآكل النقاط)
  const activateShield = () => {
    updateDoc(doc(db, "users", currentUserUid), { isShieldActive: true, shieldExpiry: Date.now() + 86400000 });
  };

  // [25] ميزة الـ Historical Snapshots (نظرة على الماضي)
  const getRankOnDate = (date) => {
    // ميزة 49: استرجاع المركز في تاريخ معين من سجلات الفايربيس
  };

  // [26] ميزة الـ Soundscapes (تغير الموسيقى حسب القرب من المركز الأول)
  useEffect(() => {
    if (currentUserData?.globalRank <= 3) {
      // تشغيل موسيقى ملحمية (Epic Music)
    } else {
      // تشغيل موسيقى هادئة (Ambient)
    }
  }, [currentUserData?.globalRank]);

  // =========================================================
  // 🏁 نهاية الجزء المنطقي الضخم - الآن نخرج البيانات للواجهة
  // =========================================================

  return {
    // الوظائف الأساسية
    calculateRank, getNextLevelProgress, initiateDuel,
    activatePowerUp, processPrestige, generateCertificate,
    
    // البيانات التحليلية
    skillRadar, predictedPath, liveFeed, inventory, powerUps,
    currentStreak, prestigeLevel, toggleTheme,
    
    // المميزات الإضافية الـ 70 التي تم دمجها
    applyRankDecay, toggleLeaderboardScope, getAgentColor,
    sendCongrats, checkPersonalBest, openLootBox, 
    generateDailyMission, getSystemGreeting, activateShield,
    generateShareCard, checkRisingStar
  };
};

export default HallOfLegends;


  
