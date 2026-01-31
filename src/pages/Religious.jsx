import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, BookOpen, Radio, Compass, X, CheckCircle, 
  ListTodo, Play, Pause, RefreshCw, MapPin, Trophy, Sparkles, 
  Clock, Plus, Users, Star, Award, Book, MessageCircle,
  Smile, Frown, Zap, Coffee, BarChart3, TrendingUp, History, 
  UserCheck, Calendar, ShieldCheck, Map, 
  Volume2, Heart, Share2, Search, Settings, 
  Bookmark, Sun, Moon, Info, Bell, ExternalLink, ListChecks, Trash2,
  Library, BookMarked, GraduationCap, Flame, Activity // تم إضافة Activity هنا
} from 'lucide-react';
import { useNavigate } from 'react-router-dom'; 
import { db, rtdb } from '../firebase'; 
import { 
  collection, query, orderBy, limit, onSnapshot, 
  doc, updateDoc, setDoc, serverTimestamp 
} from "firebase/firestore";
import { ref, onValue, increment as rtdbIncrement, update as rtdbUpdate } from "firebase/database";
import './Religious.css';

const Religious = ({ user }) => {
  const navigate = useNavigate();

  const [msg, setMsg] = useState("");

  // --- [1] حالة النظام العام (Global System State) ---
  const [tasbih, setTasbih] = useState(() => Number(localStorage.getItem('n_t')) || 0);
  const [xp, setXp] = useState(() => Number(localStorage.getItem('n_x')) || 0);
  const [streak, setStreak] = useState(() => Number(localStorage.getItem('u_streak')) || 0);
  const [globalTasbih, setGlobalTasbih] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);

  const [prayerTimes, setPrayerTimes] = useState(null);
  const [nextPrayer, setNextPrayer] = useState({ name: "", time: "" });
  const [emotion, setEmotion] = useState(null);
  const [activePortal, setActivePortal] = useState(null);

  // --- [2] نظام الختمة الشامل (Comprehensive Quran System) ---
  const [hifz, setHifz] = useState(() => {
    const saved = JSON.parse(localStorage.getItem('hifz_v2'));


  // 2. أضف هنا حالات مواقيت الصلاة (الجديدة)
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [nextPrayer, setNextPrayer] = useState({ name: 'جاري التحميل...', time: '' });
  const [city] = useState('Cairo');

// 1. حالة الأدعية
const [prayers, setPrayers] = useState([]);

// 2. جلب آخر 3 أدعية من Firestore بشكل حي
useEffect(() => {
  const prayersRef = collection(db, 'social_prayers');
  const q = query(prayersRef, orderBy('createdAt', 'desc'), limit(3));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setPrayers(data);
  });

  return () => unsubscribe();
}, []);

// 3. دالة إضافة دعاء جديد
const handleAddDuaa = async () => {
  const text = prompt("اكتب دعاءك ليؤمن عليه الإخوة:");
  if (!text) return;

  try {
    await addDoc(collection(db, 'social_prayers'), {
      u: user?.displayName || "مستخدم",
      d: text,
      a: 0,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.error("Error adding duaa:", err);
  }
};

// 4. دالة التأمين (آمين)
const handleAmen = async (id) => {
  const docRef = doc(db, 'social_prayers', id);
  await updateDoc(docRef, { a: increment(1) });
};

    
  // 3. أضف هنا الـ useEffect الخاص بالمواقيت
  useEffect(() => {
    const fetchPrayers = async () => {
      try {
        const res = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${city}&country=Egypt&method=5`);
        const data = await res.json();
        const timings = data.data.timings;
        setPrayerTimes(timings);
        calculateNextPrayer(timings);
      } catch (err) { console.error(err); }
    };

    const calculateNextPrayer = (timings) => {
      const prayers = [
        { name: 'الفجر', time: timings.Fajr },
        { name: 'الظهر', time: timings.Dhuhr },
        { name: 'العصر', time: timings.Asr },
        { name: 'المغرب', time: timings.Maghrib },
        { name: 'العشاء', time: timings.Isha },
      ];
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const next = prayers.find(p => {
        const [h, m] = p.time.split(':');
        return (parseInt(h) * 60 + parseInt(m)) > currentTime;
      });
      setNextPrayer(next || prayers[0]);
    };

    fetchPrayers();
  }, [city]);



    
    // الهيكل الافتراضي الكامل
    const defaultState = {
      teacherName: "",
      sessionDay: "الإثنين",
      juz: 1,
      surah: "البقرة",
      page: 1,
      reviewAmount: "جزء واحد",
      reviewFrom: "الفاتحة",
      reviewTo: "البقرة",
      lastSessionDate: "",
      isCompletedToday: false,
      streak: 0,
      history: [],
      teachers: [{ id: 1, name: "", days: [], note: "" }],
      hifzTarget: { fromS: "", fromA: "", toS: "", toA: "" },
      readingKhatma: {
        active: true,
        currentJuz: 1,
        currentPage: 1,
        targetDays: 30,
        lastUpdate: ""
      }
    };

    if (!saved) return defaultState;

    // دمج البيانات المحفوظة مع الهيكل الافتراضي لضمان عدم وجود undefined
    return {
      ...defaultState,
      ...saved,
      readingKhatma: {
        ...defaultState.readingKhatma,
        ...(saved.readingKhatma || {}) // يضمن وجود currentPage حتى لو البيانات قديمة
      }
    };
  });
  // --- [3] نظام الأوراد والتحديات ---
  const [tasks, setTasks] = useState(() => JSON.parse(localStorage.getItem('w_tasks')) || [
    { id: 1, text: "ورد القرآن", points: 500, done: false, type: 'main' },
    { id: 2, text: "أذكار الصباح", points: 200, done: false, type: 'daily' },
    { id: 3, text: "أذكار المساء", points: 200, done: false, type: 'daily' },
    { id: 4, text: "صلاة الضحى", points: 300, done: false, type: 'extra' },
  ]);

  const emotionData = {
    sad: { t: "لَا تَحْزَنْ إِنَّ اللَّهَ مَعَنَا", s: "سورة يوسف", a: "استغفر الله العظيم" },
    anxious: { t: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ", s: "سورة الرعد", a: "لا حول ولا قوة إلا بالله" },
    tired: { t: "وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ", s: "سورة البقرة", a: "سبحان الله وبحمده" },
    happy: { t: "لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ", s: "سورة إبراهيم", a: "الحمد لله رب العالمين" }
  };

  useEffect(() => {
    const lastDate = localStorage.getItem('last_active');
    const today = new Date().toDateString();
    if (lastDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (lastDate === yesterday.toDateString()) {
            setStreak(s => s + 1);
        } else {
            setStreak(1);
        }
        localStorage.setItem('last_active', today);
    }
  }, []);

  const handleHifzProgress = (field, val) => {
    const updated = { ...hifz, [field]: val };
    setHifz(updated);
    localStorage.setItem('hifz_v2', JSON.stringify(updated));
  };

  const markHifzDone = () => {
    if (hifz.isCompletedToday) return;
    const updated = { ...hifz, isCompletedToday: true, streak: hifz.streak + 1 };
    setHifz(updated);
    setXp(prev => prev + 1000);
    setMsg("هنيئاً لك! تم تسجيل ورد الحفظ والمراجعة بنجاح");
    setTimeout(() => setMsg(""), 3000);
    localStorage.setItem('hifz_v2', JSON.stringify(updated));
  };

  const updateReading = (page) => {
    const updated = { ...hifz, readingKhatma: { ...hifz.readingKhatma, currentPage: page }};
    setHifz(updated);
    localStorage.setItem('hifz_v2', JSON.stringify(updated));
  };

  const getExpectedKhatma = () => {
    const remainingPages = (30 - hifz.juz) * 20;
    const days = remainingPages / 1; 
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
  };
// --- [إصلاح] منطق مشغل الإذاعة الموحد ---
  // ملاحظة: تأكد من حذف أي سطر فيه audioRef أو isPlaying أو currentSourceIndex مكرر فوق هذا الكود
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  
  // قائمة الروابط الاحتياطية لضمان عدم الانقطاع
  const radioSources = [
    "https://n02.radiojar.com/8s5u5pbagzzuv", // إذاعة القاهرة الرسمية
    "https://stream.radiojar.com/8s5u5pbagzzuv", // رابط احتياطي 1
    "https://liveradio.mp3quran.net/quraan",    // رابط احتياطي 2
    "https://n06.radiojar.com/8s5u5pbagzzuv"    // رابط احتياطي 3
  ];

  const handleAudioError = () => {
    if (currentSourceIndex < radioSources.length - 1) {
      const nextIndex = currentSourceIndex + 1;
      setCurrentSourceIndex(nextIndex);
      setMsg(`جاري محاولة رابط بديل (${nextIndex + 1})...`);
      
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.load();
          audioRef.current.play()
            .then(() => setIsPlaying(true))
            .catch(() => handleAudioError());
        }
      }, 1000);
    } else {
      setMsg("عذراً، جميع روابط البث لا تعمل حالياً");
      setIsPlaying(false);
      setCurrentSourceIndex(0);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => {
            console.error("فشل الرابط، جارٍ التبديل...");
            handleAudioError();
          });
      }
    }
  };
  const handleTasbih = () => {
      setTasbih(prev => prev + 1);
  };

  return (
    <div className={`rel-master-root select-none ${emotion ? emotion + '-mode' : 'default-mode'}`}>
      <div className="atmospheric-bg"></div>
      
      <AnimatePresence>
        {msg && (
          <motion.div initial={{opacity:0, y:-50}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="quran-toast">
            <Sparkles size={18} /> {msg}
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="rel-top-nav glass">
        <div className="nav-user-area">
          <div className="streak-orb highlight">
             <Flame size={18} fill="#ff4d4d" color="#ff4d4d" />
             <span>{streak} يوم التزام</span>
          </div>
          <div className="xp-container">
            <Trophy size={20} className="gold-glow" />
            <div className="xp-bar-wrapper">
               <div className="xp-label">{xp} نقطة نور</div>
               <div className="xp-bar-bg">
                 <motion.div initial={{width:0}} animate={{width: `${(xp%2000)/20}%`}} className="xp-fill"></motion.div>
               </div>
            </div>
          </div>
        </div>
        <button className="back-btn" onClick={() => navigate(-1)}><ArrowRight /></button>
      </nav>

      <div className="rel-main-grid">
        <aside className="rel-hifz-panel">
          <section className="hifz-card glass reading-focus">
            <div className="hifz-header">
              <Library className="icon-p" />
              <div>
                <h3>ورد الختمة (قراءة)</h3>
                <small>متابعة الختمة الشهرية الحالية</small>
              </div>
            </div>
            <div className="reading-progress-area">
              <div className="reading-stats">
                <div className="stat-pill">الصفحة <b>{hifz.readingKhatma.currentPage}</b></div>
                <div className="stat-pill">الجزء <b>{Math.ceil(hifz.readingKhatma.currentPage / 20)}</b></div>
              </div>
              <input 
                type="range" min="1" max="604" 
                value={hifz.readingKhatma.currentPage} 
                onChange={(e) => updateReading(e.target.value)}
                className="khatma-slider"
              />
              <div className="slider-labels"><span>الفاتحة</span><span>الناس</span></div>
            </div>
          </section>

          <section className="hifz-card glass">
            <div className="hifz-header">
               <GraduationCap className="icon-p" />
               <div>
                 <h3>خطة الحفظ والتسميع</h3>
                 <small>إدارة المشايخ، الحفظ، والمراجعة</small>
               </div>
            </div>

            <div className="hifz-form-scrollable">
               <div className="hifz-sub-section">
                  <div className="sub-title"><UserCheck size={14}/> الجدول الدراسي</div>
                  {hifz.teachers.map((t, i) => (
                    <div key={t.id} className="teacher-entry">
                      <div className="teacher-main">
                        <input 
                          placeholder="اسم الشيخ.." 
                          value={t.name}
                          onChange={(e) => {
                            let list = [...hifz.teachers];
                            list[i].name = e.target.value;
                            handleHifzProgress('teachers', list);
                          }}
                        />
                        <button className="add-t-btn" onClick={() => handleHifzProgress('teachers', [...hifz.teachers, {id: Date.now(), name:"", days:[]}])}><Plus size={14}/></button>
                      </div>
                      <div className="days-row">
                        {["سبت", "أحد", "إثن", "ثلاث", "أربع", "خميس", "جمعة"].map(d => (
                          <span 
                            key={d} 
                            className={`day-chip ${t.days.includes(d) ? 'active' : ''}`}
                            onClick={() => {
                              let list = [...hifz.teachers];
                              list[i].days = list[i].days.includes(d) ? list[i].days.filter(x=>x!==d) : [...list[i].days, d];
                              handleHifzProgress('teachers', list);
                            }}
                          >{d[0]}</span>
                        ))}
                      </div>
                    </div>
                  ))}
               </div>

               <div className="hifz-sub-section">
                  <div className="sub-title"><BookMarked size={14}/> ورد التسميع القادم</div>
                  <div className="range-grid">
                    <div className="range-box">
                      <label>من</label>
                      <input placeholder="سورة" value={hifz.hifzTarget.fromS} onChange={(e)=>handleHifzProgress('hifzTarget', {...hifz.hifzTarget, fromS: e.target.value})} />
                      <input placeholder="آية" value={hifz.hifzTarget.fromA} onChange={(e)=>handleHifzProgress('hifzTarget', {...hifz.hifzTarget, fromA: e.target.value})} />
                    </div>
                    <div className="range-box">
                      <label>إلى</label>
                      <input placeholder="سورة" value={hifz.hifzTarget.toS} onChange={(e)=>handleHifzProgress('hifzTarget', {...hifz.hifzTarget, toS: e.target.value})} />
                      <input placeholder="آية" value={hifz.hifzTarget.toA} onChange={(e)=>handleHifzProgress('hifzTarget', {...hifz.hifzTarget, toA: e.target.value})} />
                    </div>
                  </div>
               </div>

               <div className="hifz-progress-circles">
                  <div className="p-circle">
                     <svg viewBox="0 0 36 36">
                       <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                       <path className="circle-fill" strokeDasharray={`${(hifz.juz/30)*100}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                     </svg>
                     <div className="p-text"><span>{hifz.juz}</span><small>جزء</small></div>
                  </div>
                  <div className="hifz-details">
                     <p>آخر محفوظ: <span>{hifz.surah}</span></p>
                     <p>المراجعة: <span>{hifz.reviewFrom} - {hifz.reviewTo}</span></p>
                  </div>
               </div>

               <div className="ai-prediction">
                  <Sparkles size={16} color="#ffd700" />
                  <span>موعد ختم القرآن كاملاً: <b>{getExpectedKhatma()}</b></span>
               </div>

               <button className={`atmam-btn-pro ${hifz.isCompletedToday ? 'done' : ''}`} onClick={markHifzDone}>
                  {hifz.isCompletedToday ? "تم إنجاز ورد اليوم ✓" : "تأكيد إنجاز الحفظ والمراجعة"}
               </button>
            </div>
          </section>
        </aside>
        
        <main className="rel-core-panel">
           <section className="leader-card glass">
              <div className="h-title"><Award /> قائمة القانتين</div>
              <div className="leader-scroll">
                 {leaderboard.map((u, i) => (
                   <div key={i} className="u-rank-item">
                      <div className="u-rank">{i+1}</div>
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`} alt=""/>
                      <div className="u-n">
                         <p>{u.name}</p>
                         <small>{u.xp} نقطة نور</small>
                      </div>
                   </div>
                 ))}
              </div>
           </section>

           <div className="emotion-engine glass">
              <h3>كيف تجد قلبك الآن؟</h3>
              <div className="emo-grid">
                  {Object.keys(emotionData).map(emo => (
                    <button key={emo} onClick={() => setEmotion(emo)} className={emotion === emo ? 'active' : ''}>
                       {emo === 'sad' && <Frown />}
                       {emo === 'anxious' && <Coffee />}
                       {emo === 'tired' && <Zap />}
                       {emo === 'happy' && <Smile />}
                       <span>{emo === 'sad' ? 'حزين' : emo === 'anxious' ? 'قلق' : emo === 'tired' ? 'مجهد' : 'شاكر'}</span>
                    </button>
                  ))}
              </div>
              <AnimatePresence>
                {emotion && (
                  <motion.div initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}} className="emo-response">
                      <p>"{emotionData[emotion].t}"</p>
                      <div className="emo-advice">
                         <span><BookOpen size={14}/> {emotionData[emotion].s}</span>
                         <span><MessageCircle size={14}/> {emotionData[emotion].a}</span>
                      </div>
                  </motion.div>
                )}
              </AnimatePresence>
           </div>

           <div className="tasbih-universe">
              <div className="global-pulse">
                  <Users size={16} />
                  <span>{globalTasbih.toLocaleString()} تسبيحة جماعية اليوم</span>
              </div>
              
              <motion.div whileTap={{scale:0.92}} className="tasbih-sphere" onClick={handleTasbih}>
                  <div className="sphere-content">
                     <div className="sphere-count">{tasbih}</div>
                     <div className="sphere-label">سبحان الله</div>
                  </div>
                  <div className="sphere-ring"></div>
              </motion.div>

              <div className="tasbih-actions">
                  <button onClick={()=>setTasbih(0)}><RefreshCw size={16}/> تصفير</button>
                  <button onClick={()=>setActivePortal('qibla')}><Compass size={16}/> القبلة</button>
              </div>
           </div>

           <div className="analytics-box glass">
              <div className="a-header"><BarChart3 size={18}/> تقرير الالتزام (Heatmap)</div>
              <div className="heatmap-grid">
                  {[...Array(28)].map((_, i) => (
                    <div key={i} className={`h-box level-${Math.floor(Math.random()*4)}`} title="نشاط عالي"></div>
                  ))}
              </div>
              <div className="a-footer">كلما زاد اللون خضرة زاد نورك وإنجازك</div>
           </div>
        </main>
<aside className="rel-tasks-panel">
            <div className="task-card glass">
               <div className="h-title"><ListTodo /> أورادي اليومية</div>
               <div className="task-list">
                  {tasks.map(t => (
                    <div key={t.id} className={`t-item ${t.done ? 'done' : ''}`} onClick={() => {
                      setTasks(tasks.map(i => i.id === t.id ? {...i, done: !i.done} : i));
                      if(!t.done) setXp(x => x + t.points);
                    }}>
                       <div className="t-check">{t.done && <CheckCircle size={14}/>}</div>
                       <div className="t-info">
                          <p>{t.text}</p>
                          <small>+{t.points} XP</small>
                       </div>
                    </div>
                  ))}
               </div>
               <div className="add-task-min">
                  <input type="text" placeholder="إضافة ورد خاص..." />
                  <button><Plus size={16}/></button>
               </div>
            </div>
        </aside> {/* <--- هذا السطر هو الذي كان ينقصك ويسبب فشل الـ Build */}
            <aside className="religious-sidebar">
  <div className="prayer-card glass-morph">
    <div className="h-title">
      <Clock className="spin-slow" /> 
      <span>مواقيت الصلاة</span>
    </div>
    
    <div className="next-p">
      <div className="next-p-label">الصلاة القادمة</div>
      <motion.h4 
        key={nextPrayer.name}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {nextPrayer.name} <span className="p-time">{nextPrayer.time}</span>
      </motion.h4>
    </div>

    {/* شريط عرض حالة الصلاة الحالية */}
    <div className="prayer-status-bar">
      <div className="status-dot pulse"></div>
      <span>مدينة {city === 'Cairo' ? 'القاهرة' : city}</span>
    </div>

    <div className="location-tag">
      <MapPin size={14} /> 
      <span>مصر، المنطقة الزمنية (+2)</span>
    </div>
  </div>
</aside>
      {/* 1. نظام الأوسمة */}
      <section className="badges-showcase glass-effect">
        <div className="section-title">
          <Award color="#f1c40f" /> <h3>خزانة الأوسمة</h3>
          <small>أكمل التحديات لفتح أوسمة نادرة</small>
        </div>
        <div className="badges-grid-scroll">
          {[
            { n: "خادم القرآن", d: "حفظ 5 أجزاء", icon: "📖", color: "#2ecc71", locked: false },
            { n: "فارس الفجر", d: "صلاة الفجر 7 أيام", icon: "🌅", color: "#3498db", locked: true },
            { n: "المسبّح المحترف", d: "100 ألف تسبيحة", icon: "📿", color: "#9b59b6", locked: false },
            { n: "صديق السنتر", d: "زيارة 5 مواقع تعليمية", icon: "🏫", color: "#e67e22", locked: true },
            { n: "ناشر الخير", d: "مشاركة 10 أذكار", icon: "📢", color: "#e74c3c", locked: false }
          ].map((badge, bi) => (
            <motion.div 
              key={bi} 
              whileHover={{ y: -5 }} 
              className={`badge-item ${badge.locked ? 'is-locked' : 'is-earned'}`}
              style={{ '--badge-clr': badge.color }}
            >
              <div className="badge-icon">{badge.icon}</div>
              <h4>{badge.n}</h4>
              <p>{badge.d}</p>
              {badge.locked && <div className="lock-overlay"><X size={14}/></div>}
            </motion.div>
          ))}
        </div>
      </section>

      {/* 2. مفكرة الخواطر */}
      <div className="spiritual-journal-section glass">
        <div className="journal-header">
          <div className="j-title"><Book size={20} /> <h3>مفكرة الخواطر الإيمانية</h3></div>
          <button className="lock-journal-btn"><ShieldCheck size={16} /> مشفرة</button>
        </div>
        <div className="journal-body">
          <textarea 
            placeholder="اكتب درساً تعلمته اليوم، أو خاطرة حول آية استوقفتك..."
            className="journal-input"
          ></textarea>
          <div className="journal-footer">
            <div className="tags">
              <span className="j-tag">#تفسير</span>
              <span className="j-tag">#تدبر</span>
              <span className="j-tag">#خطبة_الجمعة</span>
            </div>
            <button className="save-journal-btn"><CheckCircle size={16} /> حفظ الخاطرة</button>
          </div>
        </div>
      </div>
      {/* مشغل الصوت المخفي الذي يحتوي على الروابط المتعددة */}
      <audio 
        ref={audioRef} 
        src={radioSources[currentSourceIndex]} 
        onEnded={() => setIsPlaying(false)}
        onError={handleAudioError} // إذا انقطع البث فجأة ينتقل للرابط التالي
        preload="none"
      />

      {/* مشغل الإذاعة المطور الذي قمنا بتصميمه سابقاً */}
      <div className={`floating-radio-player-pro ${isPlaying ? 'is-active' : ''}`}>
        <div className="radio-glass-card">
          <div className="player-main-info">
            <div className={`audio-waves ${isPlaying ? 'playing' : ''}`}>
              <span></span><span></span><span></span><span></span><span></span>
            </div>
            <div className="track-details">
              <span className="live-badge">مباشر</span>
              <h4 className="station-name">إذاعة القرآن الكريم</h4>
              <p className="scrolling-text">
                {isPlaying ? "يتم التشغيل الآن بنجاح" : "اضغط للتشغيل من القاهرة"}
              </p>
            </div>
          </div>

          <div className="pro-controls">
            <motion.button 
              whileHover={{ scale: 1.15 }} 
              whileTap={{ scale: 0.85 }}
              onClick={togglePlay}
              className={`ctrl-btn-main ${isPlaying ? 'playing' : ''}`}
            >
              {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} className="play-icon-offset" fill="currentColor" />}
            </motion.button>
            
            {/* زر لتغيير الرابط يدوياً إذا رغب المستخدم في جودة مختلفة */}
            <motion.button 
              onClick={handleAudioError}
              className="ctrl-btn-secondary"
              title="رابط بديل"
            >
              <RefreshCw size={20} className={isPlaying ? 'spin-anim' : ''} />
            </motion.button>
          </div>
        </div>
      </div>
<div className="social-duaa-wall glass">
  <div className="wall-header">
    <Users size={18} /> <span>دعوات المسلمين الآن</span>
    <div className="live-indicator">
      <span className="dot"></span> مباشر
    </div>
  </div>

  <div className="duaa-cards-container">
    <AnimatePresence mode='popLayout'>
      {prayers.map((post) => (
        <motion.div 
          key={post.id} 
          layout
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="duaa-post-card glass-v2"
        >
          <div className="duaa-user-info">
             <div className="u-avatar">{post.u[0]}</div>
             <small>{post.u}</small>
          </div>
          <p>"{post.d}"</p>
          <div className="duaa-actions">
            <button className="amen-btn" onClick={() => handleAmen(post.id)}>
              <Heart size={14} className={post.a > 0 ? "filled" : ""} /> 
              آمين ({post.a})
            </button>
            <small>منذ قليل</small>
          </div>
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
  
  <button className="write-duaa-trigger" onClick={handleAddDuaa}>
    <Plus /> اطلب دعاءً من الإخوة
  </button>
</div>

          {/* 5. بوابات الخدمات */}
      <AnimatePresence>
        {activePortal && (
          <motion.div 
            className="portal-fullscreen-overlay"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div className="portal-window glass">
              <div className="portal-nav-top">
                <div className="p-brand">
                  <div className="p-dot"></div>
                  <span>{activePortal === 'quran' ? 'المصحف التفاعلي' : 'خريطة السناتر والمساجد'}</span>
                </div>
                <div className="p-actions">
                  <button onClick={() => window.print()} title="طباعة الصفحة"><Plus size={18}/></button>
                  <button onClick={() => setActivePortal(null)} className="p-close"><X /></button>
                </div>
              </div>
              <div className="portal-content-frame">
                <iframe 
                  src={activePortal === 'quran' ? "https://quran.com" : "https://www.islamweb.net/ar/"}
                  className="portal-iframe"
                  title="Islamic Web Portal"
                ></iframe>
              </div>
              <div className="portal-footer-status">
                <div className="status-item"><Activity size={12}/> اتصال آمن SSL</div>
                <div className="status-item"><Clock size={12}/> تحديث لحظي</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
{/* 6. نافبار سفلي - نسخة واحدة فقط سليم */}
      <footer className="smart-bottom-nav">
        <div className="nav-container-pro glass">
          <div className="nav-blob"></div>
          <button className="n-btn" onClick={() => setActivePortal('quran')}>
            <BookOpen />
            <span>المصحف</span>
          </button>
          <button className="n-btn" onClick={() => setActivePortal('map')}>
            <Map />
            <span>السناتر</span>
          </button>
          <div className="n-btn-center-wrapper">
             <button className="n-btn-main" onClick={handleTasbih}>
               <div className="inner-glow"></div>
               <Compass />
             </button>
          </div>
          <button className="n-btn" onClick={() => setActivePortal('azkar')}>
            <Star />
            <span>الأذكار</span>
          </button>
          <button className="n-btn" onClick={() => setActivePortal('qa')}>
            <MessageCircle />
            <span>فتاوى</span>
          </button>
        </div>
      </footer>

    </div> /* إغلاق الـ rel-master-root */
  ); /* إغلاق الـ return */
}; /* إغلاق المكون Religious */

export default Religious;
