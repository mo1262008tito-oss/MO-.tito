
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getFirestore, doc, updateDoc, onSnapshot, arrayUnion, increment 
} from 'firebase/firestore';
import { auth } from '../firebase'; // افترض وجود إعدادات الفيربيس لديك
import {
  Flame, Trophy, Library, GraduationCap, UserCheck, BookMarked, 
  Plus, Award, Frown, Coffee, Zap, Smile, BookOpen, MessageCircle, 
  Users, RefreshCw, Compass, BarChart3, ListTodo, CheckCircle, 
  Clock, MapPin, Star, ShieldCheck, Heart, Pause, Play, Activity, 
  X, Search, Moon, Sun, Wind, Bell, Share2, Target, PenTool, 
  Volume2, Mic, Settings, LayoutGrid, HelpCircle, Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Religious.css';
const Religious = () => {
  const navigate = useNavigate();
  const db = getFirestore();
  const [user, setUser] = useState(null);
  
  // 40 ميزة - إدارة الحالات (State Management)
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [emotion, setEmotion] = useState(null);
  const [tasbih, setTasbih] = useState(0);
  const [globalTasbih, setGlobalTasbih] = useState(124500);
  const [msg, setMsg] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [activePortal, setActivePortal] = useState(null);
  const [nightMode, setNightMode] = useState(true);
  const [qiblaAngle, setQiblaAngle] = useState(0);
  const [isMeditating, setIsMeditating] = useState(false);
  const [dailyQuote, setDailyQuote] = useState("");
  const [userLevel, setUserLevel] = useState(1);
  const [fastingStatus, setFastingStatus] = useState(false);
  const [sadaqahCount, setSadaqahCount] = useState(0);
  const [prayerFocus, setPrayerFocus] = useState(0); // نسبة الخشوع
  const [selectedSurah, setSelectedSurah] = useState("البقرة");
  const [readingGoal, setReadingGoal] = useState(20); // صفحات

  // بيانات الحفظ والمراجعة المعقدة
  const [hifz, setHifz] = useState({
    readingKhatma: { currentPage: 1, totalDays: 30 },
    teachers: [{ id: 1, name: "الشيخ المنشاوي", days: ["سبت", "إثنين"] }],
    hifzTarget: { fromS: "", fromA: "", toS: "", toA: "" },
    juz: 0,
    surah: "الفاتحة",
    reviewFrom: "1",
    reviewTo: "10",
    isCompletedToday: false,
    mushafNotes: []
  });

  const audioRef = useRef(null);
  const radioSources = [
    "https://qurango.net/radio/tarabeel",
    "https://live.mp3quran.net:9702/;stream.nsv",
    "https://backup.qurango.net/radio/mix"
  ];
useEffect(() => {
  // دالة لجلب المواقيت بناءً على إحداثيات المستخدم
  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude, longitude } = pos.coords;
    fetch(`https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=4`)
      .then(res => res.json())
      .then(data => setPrayerTimes(data.data.timings));
  });
}, []);
  // 1. ربط الفيربيس لجلب بيانات المستخدم لحظياً
  useEffect(() => {
    if (auth.currentUser) {
      const unsub = onSnapshot(doc(db, "users", auth.currentUser.uid), (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setXp(data.xp || 0);
          setStreak(data.streak || 0);
          setHifz(prev => ({ ...prev, ...data.hifz }));
          setSadaqahCount(data.sadaqah || 0);
        }
      });
      return () => unsub();
    }
  }, [db]);

  // 2. منطق زيادة النقاط التفاعلي مع تحديث Firebase
  const awardXp = async (amount, reason) => {
    setXp(prev => prev + amount);
    setMsg(`+${amount} نقطة نور: ${reason}`);
    setTimeout(() => setMsg(""), 3000);
    
    if (auth.currentUser) {
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, { xp: increment(amount) });
    }
  };

  // 3. محرك التسبيح الجماعي
  const handleTasbih = () => {
    setTasbih(t => t + 1);
    setGlobalTasbih(g => g + 1);
    if ((tasbih + 1) % 33 === 0) {
      awardXp(10, "إكمال دورة تسبيح");
      window.navigator.vibrate?.(50);
    }
  };

  // 4. منطق الراديو والتبديل التلقائي
  const togglePlay = () => {
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const handleAudioError = () => {
    const nextIndex = (currentSourceIndex + 1) % radioSources.length;
    setCurrentSourceIndex(nextIndex);
    setMsg("جاري الاتصال بسيرفر بديل...");
  };

  // 5. حساب موعد الختمة المتوقع (خوارزمية ذكية)
  const getExpectedKhatma = () => {
    const remainingPages = 604 - hifz.readingKhatma.currentPage;
    const daysNeeded = Math.ceil(remainingPages / (readingGoal || 1));
    const date = new Date();
    date.setDate(date.getDate() + daysNeeded);
    return date.toLocaleDateString('ar-EG', { month: 'long', day: 'numeric' });
  };

  // 6. منطق الخصوصية (تشفير الخواطر)
  const savePrivateNote = async (note) => {
    awardXp(15, "تدبر آية");
    // هنا يمكن إضافة منطق حفظ مشفر
  };

  // 7. بوصلة القبلة الذكية (محاكاة)
  useEffect(() => {
    const interval = setInterval(() => {
      setQiblaAngle(prev => (prev + 1) % 360);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // 8. نظام أوراد النوم والاستيقاظ التلقائي
  useEffect(() => {
    const hour = new Date().getHours();
    setNightMode(hour > 18 || hour < 6);
  }, []);

  // --- استكمال الدوال المنطقية داخل المكون ReligiousOasis ---

  // 9. ميزة "سجل الخشوع" (Prayer Mindfulness Tracking)
  const [mindfulnessLog, setMindfulnessLog] = useState([]);
  const trackMindfulness = async (prayerName, level) => {
    const newEntry = { time: new Date().toISOString(), prayer: prayerName, focus: level };
    setMindfulnessLog(prev => [newEntry, ...prev]);
    setPrayerFocus(level);
    await awardXp(20, `تحسين الخشوع في صلاة ${prayerName}`);
    if (auth.currentUser) {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        mindfulnessHistory: arrayUnion(newEntry)
      });
    }
  };

  // 10. ميزة "تحدي الـ 40 يومًا" (40 Days Challenge Logic)
  const [challengeProgress, setChallengeProgress] = useState(0);
  const checkChallenge = () => {
    if (streak >= 40) {
      awardXp(1000, "وسام الصمود: 40 يوم التزام");
      setMsg("مبروك! لقد أتممت تحدي الـ 40 يوماً بنجاح");
    }
  };

  // 11. نظام "الصدقة الرقمية" (Sadaqah Reminder & Counter)
  const handleSadaqah = async () => {
    const newCount = sadaqahCount + 1;
    setSadaqahCount(newCount);
    await awardXp(50, "توثيق عمل خير/صدقة");
    if (auth.currentUser) {
      await updateDoc(doc(db, "users", auth.currentUser.uid), { sadaqah: newCount });
    }
  };

  // 12. محرك "الورد القرآني المخصص" (Custom Quranic Routine)
  const [customRoutine, setCustomRoutine] = useState([
    { id: 'r1', title: 'سورة الملك قبل النوم', active: true, points: 30 },
    { id: 'r2', title: 'سورة الكهف يوم الجمعة', active: false, points: 50 },
    { id: 'r3', title: 'ورد الاستغفار (1000)', active: true, points: 40 }
  ]);

  // أضف هذه الدوال داخل المكون ReligiousOasis
const updateKhatmaProgress = (newPage) => {
  if (newPage > 604) return; // صفحات المصحف 604

  const totalPages = 604;
  const progress = ((newPage / totalPages) * 100).toFixed(1);
  const remainingPages = totalPages - newPage;
  
  // حساب الأيام المتبقية بناءً على هدفك اليومي
  const daysLeft = Math.ceil(remainingPages / readingGoal);

  setHifzProgress({
    currentPage: newPage,
    lastSurah: "تحديث تلقائي...", // يمكن ربطها بمصفوفة السور لاحقاً
    completedPercent: progress,
    daysToFinish: daysLeft
  });

  // منح نقاط XP عند الإنجاز
  awardXp(20, "تقدم في الختمة"); 
};


 

  // 13. ميزة "المسبحة الصوتية" (Voice Activated Tasbih)
  const [isListening, setIsListening] = useState(false);
  const startVoiceTasbih = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ar-SA';
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript.includes("سبحان الله") || transcript.includes("الحمد لله")) {
          handleTasbih();
        }
      };
      recognition.start();
      setIsListening(true);
      setTimeout(() => setIsListening(false), 5000);
    }
  };

  // 14. ميزة "فتاوى على السريع" (AI-Powered Q&A Simulation)
  const [fatwaSearch, setFatwaSearch] = useState("");
  const [fatwaResult, setFatwaResult] = useState(null);
  const searchFatwa = (query) => {
    setMsg("جاري البحث في الأرشيف الفقهي...");
    setTimeout(() => {
      setFatwaResult(`نتيجة تقريبية لـ "${query}": يُفضل دائماً مراجعة دار الإفتاء، ولكن الأصل في الأمور ...`);
    }, 1500);
  };

  // 15. ميزة "خريطة المساجد والسناتر" (Nearby Centers Logic)
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyCenters, setNearbyCenters] = useState([]);
  const getNearbyCenters = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      // محاكاة جلب بيانات من Firebase Geo-location
      setNearbyCenters([
        { name: "مركز الفرقان لتحفيظ القرآن", dist: "1.2 كم" },
        { name: "جمعية الفتح الإسلامي", dist: "3.5 كم" }
      ]);
    });
  };

  // 16. ميزة "راديو التلاوة المخصص" (Reciter Selection)
  const [selectedReciter, setSelectedReciter] = useState("manshawi");
  const changeReciter = (id) => {
    setSelectedReciter(id);
    setIsPlaying(false);
    // تحديث رابط الـ Audio بناءً على القارئ
  };

  // 17. نظام "المنافسة بين الأصدقاء" (Social Ranking)
  const [friendsList, setFriendsList] = useState([
    { name: "أحمد", xp: 1500, active: true },
    { name: "سارة", xp: 2200, active: false },
    { name: "محمد", xp: 900, active: true }
  ]);

  // 18. ميزة "تحدي قيام الليل" (Night Prayer Monitor)
  const checkTahajjud = () => {
    const hour = new Date().getHours();
    if (hour >= 2 && hour <= 4) {
      awardXp(150, "مصلّي الفجر والتهجد");
    } else {
      setMsg("هذه الميزة تُفتح فقط في وقت الثلث الأخير من الليل");
    }
  };

  // 19. ميزة "أذكار المناسبات" (Event-based Azkar)
  const [currentEvent, setCurrentEvent] = useState("رمضان"); // تتغير حسب التقويم الهجري
  const getEventZikr = () => {
    if (currentEvent === "رمضان") return "ذهب الظمأ وابتلت العروق..";
    return "لا إله إلا الله وحده لا شريك له";
  };

  // 20. نظام "المفكرة الروحية" (Spiritual Journaling)
  const [journalEntries, setJournalEntries] = useState([]);
  const addJournalEntry = (text) => {
    const entry = { id: Date.now(), text, date: new Date().toLocaleDateString() };
    setJournalEntries([entry, ...journalEntries]);
    awardXp(30, "تدوين خاطرة إيمانية");
  };

  // 21. ميزة "عداد الختمات التاريخي" (Lifetime Khatmas)
  const [lifetimeKhatmas, setLifetimeKhatmas] = useState(0);

  // 22. ميزة "تحليل الشخصية الإيماني" (Spiritual Analytics)
  const spiritualAnalysis = () => {
    if (tasbih > 1000 && streak > 10) return "مسبّح مداوم";
    if (hifz.juz > 15) return "حافظ متقن";
    return "ساعي للخير";
  };

  // 23. نظام "تنبيهات الصلاة على النبي" (Salawat Reminder)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPlaying) {
        setMsg("صلّ على محمد ﷺ");
        // يمكن إضافة صوت تنبيه خفيف
      }
    }, 600000); // كل 10 دقائق
    return () => clearInterval(interval);
  }, [isPlaying]);

  // 24. ميزة "مؤشر صيام التطوع" (Sunnah Fasting Tracker)
  const [isFastingToday, setIsFastingToday] = useState(false);
  const toggleFasting = () => {
    setIsFastingToday(!isFastingToday);
    if (!isFastingToday) awardXp(200, "نية صيام تطوع");
  };

  // 25. ميزة "مكتبة المتون" (Scientific Texts Library)
  const [selectedMutn, setSelectedMutn] = useState(null);

  // 26. ميزة "البث المباشر للحرمين" (Makkah/Madinah Live Stream)
  const [liveStreamUrl, setLiveStreamUrl] = useState("https://www.youtube.com/embed/live_makkah");

  // 27. ميزة "منبه صلاة الضحى" (Duha Prayer Reminder)
  const [duhaReminder, setDuhaReminder] = useState(true);

  // 28. نظام "الأوسمة المتحركة" (Animated Badges Logic)
  const earnedBadgesCount = () => friendsList.filter(f => f.xp > 1000).length;

  // 29. ميزة "تحدي القراءة الجماعي" (Community Reading Goal)
  const [communityGoal, setCommunityGoal] = useState(85); // نسبة مئوية

  // 30. ميزة "اختبار الحفظ الذاتي" (Self-Testing Logic)
  const [testMode, setTestMode] = useState(false);
  const startHifzTest = () => {
    setTestMode(true);
    setMsg("سيتم إخفاء الكلمات الآن، حاول التسميع..");
  };

  // 31. ميزة "مؤشر النور اليومي" (Daily Glow Index)
  const glowIndex = (xp / 100).toFixed(1);

  // 32. ميزة "أدعية من القرآن" (Quranic Duaa Randomizer)
  const [randomDuaa, setRandomDuaa] = useState("ربنا آتنا في الدنيا حسنة..");

  // 33. نظام "الترجمة الفورية للآيات" (Instant Translation)
  const [showTranslation, setShowTranslation] = useState(false);

  // 34. ميزة "محرك البحث في الأحاديث" (Hadith Searcher)
  const searchHadith = (keyword) => {
    setMsg(`البحث عن أحاديث تتضمن: ${keyword}`);
  };

  // 35. ميزة "منسق الجداول" (Weekly Schedule Planner)
  const [weeklyPlan, setWeeklyPlan] = useState({
    sat: ["حفظ وجه", "مراجعة جزء"],
    sun: ["قراءة سورة الكهف"],
  });

  // 36. ميزة "حصالة الحسنات" (Good Deeds Jar)
  const [goodDeedsJar, setGoodDeedsJar] = useState(0);

  // 37. ميزة "تذكير صيام الاثنين والخميس"
  const dayName = new Date().toLocaleDateString('ar-EG', { weekday: 'long' });

  // 38. نظام "النقاط لفتح الميزات" (Unlockable Features)
  const isFeatureLocked = (requiredXp) => xp < requiredXp;

  // 39. ميزة "المؤقت الروحي" (Spiritual Pomodoro)
  const [pomoSeconds, setPomoSeconds] = useState(1500);
  const startPomo = () => {
    setInterval(() => setPomoSeconds(s => s - 1), 1000);
  };

  // 40. ميزة "مشاركة الإنجاز" (Achievement Sharing)
  const shareProgress = () => {
    const text = `الحمد لله، حققت ${xp} نقطة نور اليوم في واحة العبادة!`;
    navigator.share?.({ title: 'إنجازي', text });
  };

  // --- نهاية منطق الـ 40 ميزة ---



  // --- استكمال الجزء الخاص بـ return داخل المكون ReligiousOasis ---

  return (
    <div className={`oasis-root ${nightMode ? 'night-theme' : 'day-theme'} ${emotion ? emotion + '-soul' : ''}`}>
      
      {/* 1. الخلفية الحية (Live Atmospheric Background) */}
      <div className="oasis-atmosphere">
        <div className="stars-layer"></div>
        <div className="clouds-layer"></div>
        <div className="ambient-glow"></div>
      </div>

      {/* 2. شريط الحالة العلوي (Celestial Top Bar) */}
      <nav className="oasis-nav glass-blur">
        <div className="nav-right">
          <motion.div whileHover={{rotate: 15}} className="oasis-logo">
            <div className="logo-icon"><Star fill="currentColor" /></div>
            <div className="logo-text">
              <h1>واحة العبادة</h1>
              <span>{dayName}، {new Date().toLocaleDateString('ar-EG')}</span>
            </div>
          </motion.div>
        </div>

        <div className="nav-center">
          <div className="global-stats-ticker">
            <Users size={14} />
            <span>يتعبد الآن: 4,205 مؤمن</span>
            <div className="pulse-dot"></div>
          </div>
        </div>

        <div className="nav-left">
          <div className="stat-orb xp-orb" onClick={shareProgress}>
            <Trophy size={18} />
            <div className="orb-info">
              <span className="label">نورانية</span>
              <span className="value">{xp}</span>
            </div>
          </div>
          <div className="stat-orb streak-orb">
            <Flame size={18} />
            <div className="orb-info">
              <span className="label">التزام</span>
              <span className="value">{streak} يوم</span>
            </div>
          </div>
          <button className="settings-trigger" onClick={() => setNightMode(!nightMode)}>
            {nightMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </nav>

      {/* 3. شبكة الواحة الرئيسية (Bento Oasis Grid) */}
      <main className="oasis-grid-container">
        
        {/* صندوق 1: ورد الختمة الذكي (كبير - رئيسي) */}
        <motion.section 
          layoutId="khatma-card"
          className="bento-card khatma-main glass-card highlight-border"
        >
          <div className="card-header">
            <div className="header-title">
              <Library className="icon-gold" />
              <div>
                <h3>رحلة الختمة الحالية</h3>
                <p>أتممت {(hifz?.readingKhatma?.currentPage / 6.04).toFixed(1)}% من المصحف</p>
              </div>
            </div>
            <button className="expand-btn"><LayoutGrid size={18} /></button>
          </div>

          <div className="khatma-visualizer">
            <div className="mushaf-preview">
              <div className="page-number">صفحة {hifz.readingKhatma.currentPage}</div>
              <div className="surah-name">{selectedSurah}</div>
            </div>
            <div className="khatma-progress-ring">
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" className="ring-bg" />
                <motion.circle 
                  cx="50" cy="50" r="45" 
                  className="ring-fill"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: hifz.readingKhatma.currentPage / 604 }}
                  transition={{ duration: 2 }}
                />
              </svg>
              <div className="ring-content">
                <span className="days-left">{Math.ceil((604 - hifz.readingKhatma.currentPage)/readingGoal)}</span>
                <small>يوم للختم</small>
              </div>
            </div>
          </div>

          <div className="khatma-controls">
            <input 
              type="range" min="1" max="604" 
              value={hifz.readingKhatma.currentPage}
              onChange={(e) => setHifz({...hifz, readingKhatma: {...hifz.readingKhatma, currentPage: parseInt(e.target.value)}})}
            />
            <div className="control-buttons">
              <button onClick={() => awardXp(5, "قراءة صفحة")}>+ صفحة</button>
              <button className="primary" onClick={() => setMsg("تقبل الله طاعتك!")}>تثبيت الورد</button>
            </div>
          </div>
        </motion.section>

        {/* صندوق 2: محرك المشاعر والقلب (متوسط) */}
        <section className="bento-card emotion-oasis glass-card">
          <h3>بماذا يشعر قلبك؟</h3>
          <div className="emotions-cloud">
            {[
              { id: 'sad', icon: <Frown />, label: 'حزن', color: '#54a0ff' },
              { id: 'anxious', icon: <Coffee />, label: 'قلق', color: '#ee5253' },
              { id: 'tired', icon: <Zap />, label: 'فتور', color: '#ff9f43' },
              { id: 'happy', icon: <Smile />, label: 'شكر', color: '#1dd1a1' }
            ].map(emo => (
              <motion.button
                key={emo.id}
                whileTap={{scale: 0.9}}
                className={`emo-pill ${emotion === emo.id ? 'active' : ''}`}
                onClick={() => setEmotion(emo.id)}
                style={{ '--emo-color': emo.color }}
              >
                {emo.icon}
                <span>{emo.label}</span>
              </motion.button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            {emotion && (
              <motion.div 
                initial={{opacity: 0, y: 10}} 
                animate={{opacity: 1, y: 0}}
                exit={{opacity: 0}}
                className="emo-suggestion"
              >
                <div className="suggestion-content">
                  <BookOpen size={16} />
                  <p>لك تعزية في قوله تعالى: "لا تحزن إن الله معنا"</p>
                </div>
                <button className="action-link">استمع للآية بصوت المنشاوي</button>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* صندوق 3: المسبحة الكونية (عمودي - تفاعلي جداً) */}
        <section className="bento-card tasbih-center glass-card">
          <div className="tasbih-header">
            <div className="tasbih-total">
              <Activity size={14} /> {globalTasbih.toLocaleString()}
            </div>
            <h3>المسبحة</h3>
          </div>

          <div className="tasbih-engine">
            <motion.div 
              className="tasbih-orb"
              animate={{ 
                scale: [1, 1.05, 1],
                rotate: tasbih * 10
              }}
              onClick={handleTasbih}
            >
              <div className="orb-inner">
                <span className="count">{tasbih}</span>
                <span className="zikr">سبحان الله</span>
              </div>
              {[...Array(3)].map((_, i) => (
                <div key={i} className={`orb-ring ring-${i}`}></div>
              ))}
            </motion.div>
          </div>

          <div className="tasbih-tools">
            <button onClick={startVoiceTasbih} className={isListening ? 'listening' : ''}>
              <Mic size={18} />
            </button>
            <button onClick={() => setTasbih(0)}><RefreshCw size={18} /></button>
            <button onClick={() => setActivePortal('qibla')}><Compass size={18} /></button>
          </div>
        </section>

        {/* صندوق 4: مواقيت الصلاة والخشوع (أفقي) */}
        <section className="bento-card prayer-tracker glass-card">
          <div className="prayer-header">
            <div className="next-prayer-info">
              <Clock className="spin-slow" />
              <div>
                <span className="label">الصلاة القادمة: الظهر</span>
                <span className="time">بعد 01:24:05</span>
              </div>
            </div>
          </div>
          
          <div className="prayer-times-grid">
            {['فجر', 'ظهر', 'عصر', 'مغرب', 'عشاء'].map((p, i) => (
              <div key={p} className={`p-time-item ${i === 1 ? 'current' : ''}`}>
                <span className="p-name">{p}</span>
                <span className="p-val">12:15</span>
                {i < 1 && <CheckCircle size={12} className="done-icon" />}
              </div>
            ))}
          </div>

          <div className="focus-meter">
            <span>مستوى الخشوع الأخير:</span>
            <div className="meter-bg">
              <motion.div 
                className="meter-fill" 
                animate={{ width: `${prayerFocus}%` }}
              ></motion.div>
            </div>
            <button onClick={() => trackMindfulness('الظهر', 85)}>توثيق الخشوع +</button>
          </div>
        </section>

        {/* سيتم استكمال الـ 36 ميزة المتبقية في الصناديق التالية في الجزء 4... */}



        {/* صندوق 5: خريطة التزام النور (Heatmap & Consistency) */}
        <section className="bento-card light-map glass-card">
          <div className="card-header-mini">
            <BarChart3 size={16} />
            <h4>خريطة النور (آخر 3 أشهر)</h4>
          </div>
          <div className="heatmap-wrapper">
            <div className="heatmap-grid-scroll">
              {[...Array(90)].map((_, i) => {
                const intensity = Math.floor(Math.random() * 5);
                return (
                  <motion.div 
                    key={i}
                    whileHover={{ scale: 1.2, zIndex: 10 }}
                    className={`h-cube level-${intensity}`}
                    title={`نشاط يوم ${i}: ${intensity * 20}%`}
                  />
                );
              })}
            </div>
          </div>
          <div className="heatmap-legend">
            <span>فتور</span>
            <div className="legend-gradient"></div>
            <span>اجتهاد</span>
          </div>
        </section>

        {/* صندوق 6: حائط دعاء المجتمع (Social Connectivity) */}
        <section className="bento-card community-wall glass-card">
          <div className="card-header-mini">
            <Users size={16} color="#a29bfe" />
            <h4>دعوات قيد التأمين</h4>
          </div>
          <div className="duaa-ticker">
            <AnimatePresence mode="popLayout">
              {friendsList.slice(0, 3).map((friend, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="duaa-post"
                >
                  <p>"اللهم ارزقني حفظ كتابك والعمل به"</p>
                  <div className="duaa-meta">
                    <span>بواسطة: {friend.name}</span>
                    <button className="amen-btn-mini" onClick={() => awardXp(2, "تأمين على دعاء")}>
                      <Heart size={12} /> آمين
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>

        {/* صندوق 7: مختبر الحفظ الذكي (Hifz Lab) */}
        <section className="bento-card hifz-lab glass-card highlight-cyan">
          <div className="lab-header">
            <GraduationCap />
            <h3>مختبر الحفظ والمراجعة</h3>
          </div>
          <div className="lab-content">
            <div className="current-target">
              <span className="label">الورد القادم:</span>
              <div className="target-badge">{hifz.surah} | آية {hifz.reviewFrom}-{hifz.reviewTo}</div>
            </div>
            <div className="lab-actions">
              <button className="lab-btn" onClick={startHifzTest}>
                <ShieldCheck size={16} /> اختبار ذاتي
              </button>
              <button className="lab-btn" onClick={() => setActivePortal('mushaf-notes')}>
                <PenTool size={16} /> تدوين تدبر
              </button>
            </div>
          </div>
          <div className="teacher-alert">
            <UserCheck size={14} />
            <span>موعد التسميع مع <b>{hifz.teachers[0].name}</b> غداً</span>
          </div>
        </section>

        {/* صندوق 8: خزانة الأوسمة الملكية (Achievements) */}
        <section className="bento-card trophy-vault glass-card">
          <div className="vault-header">
            <Trophy color="#f1c40f" />
            <h4>خزانة الأوسمة</h4>
          </div>
          <div className="badges-display">
            {[
              { id: 'b1', icon: '🌙', label: 'قائم الليل', locked: false },
              { id: 'b2', icon: '🕌', label: 'عمار المساجد', locked: true },
              { id: 'b3', icon: '📿', label: 'مليون تسبيحة', locked: false },
              { id: 'b4', icon: '📖', label: 'خادم السورة', locked: true }
            ].map(badge => (
              <div key={badge.id} className={`badge-slot ${badge.locked ? 'locked' : 'earned'}`}>
                <span className="b-icon">{badge.icon}</span>
                {badge.locked && <div className="lock-tag"><X size={8}/></div>}
              </div>
            ))}
          </div>
          <button className="view-all-btn">عرض كل الإنجازات ({xp} XP)</button>
        </section>

        {/* صندوق 9: نظام الصدقة والعمل الصالح (Good Deeds) */}
        <section className="bento-card charity-box glass-card">
          <div className="charity-content">
            <div className="jar-visual">
              <motion.div 
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="coin-stack"
              >
                {[...Array(Math.min(sadaqahCount, 5))].map((_, i) => (
                  <div key={i} className="gold-coin" style={{ bottom: i * 4 }}></div>
                ))}
              </motion.div>
              <Heart className="heart-bg" />
            </div>
            <div className="charity-info">
              <h4>حصالة الحسنات</h4>
              <p>{sadaqahCount} عمل صالح موثق</p>
              <button onClick={handleSadaqah}>+ إضافة عمل خير</button>
            </div>
          </div>
        </section>

        {/* صندوق 10: منبه قيام الليل والضحى (Dynamic Alerts) */}
        <section className={`bento-card night-watch glass-card ${nightMode ? 'active-night' : ''}`}>
          <div className="watch-icon">
            {nightMode ? <Moon fill="#f1c40f" /> : <Sun fill="#f1c40f" />}
          </div>
          <div className="watch-text">
            <h4>{nightMode ? 'وقت التهجد' : 'وقت الضحى'}</h4>
            <p>{nightMode ? 'ركعتان في جوف الليل خير من الدنيا' : 'صلاة الأوابين'}</p>
          </div>
          <button className="watch-check" onClick={checkTahajjud}>سجلت حضوري</button>
        </section>

        {/* صندوق 11: راديو التلاوة المخصص (Audio Player) */}
        <section className="bento-card reciter-station glass-card">
          <div className="station-top">
            <Volume2 size={18} />
            <select onChange={(e) => changeReciter(e.target.value)}>
              <option value="manshawi">محمد صديق المنشاوي</option>
              <option value="abdulbasit">عبدالباسط عبدالصمد</option>
              <option value="hosary">محمود خليل الحصري</option>
            </select>
          </div>
          <div className="mini-wave">
             {isPlaying && [...Array(10)].map((_, i) => <div key={i} className="wave-bar"></div>)}
          </div>
        </section>

        {/* صندوق 12: البحث السريع في السنة والفتاوى (Fast Search) */}
        <section className="bento-card quick-search glass-card">
           <div className="search-bar-oasis">
              <Search size={16} />
              <input 
                placeholder="ابحث عن فتوى، حديث، آية..." 
                onKeyDown={(e) => e.key === 'Enter' && searchFatwa(e.target.value)}
              />
           </div>
           <div className="search-tags">
              <span onClick={() => searchHadith('الصبر')}>#الصبر</span>
              <span onClick={() => searchHadith('الرزق')}>#الرزق</span>
              <span onClick={() => searchHadith('الصلاة')}>#الصلاة</span>
           </div>
        </section>

        {/* صناديق إضافية سريعة (Mini Cards) */}
        <div className="bento-row-mini">
           <div className="mini-card glass-card" onClick={toggleFasting}>
              <Wind size={16} />
              <span>{isFastingToday ? 'صائم' : 'نية صيام'}</span>
           </div>
           <div className="mini-card glass-card" onClick={() => setDailyQuote("فاصبر صبراً جميلاً")}>
              <Star size={16} />
              <span>خاطرة اليوم</span>
           </div>
           <div className="mini-card glass-card" onClick={getNearbyCenters}>
              <MapPin size={16} />
              <span>أقرب مركز</span>
           </div>
        </div>

{/* إغلاق شبكة الـ Bento الرئيسية */}
    </main>


      {/* 4. الإذاعة العائمة (Floating Radio Oasis) */}
      <div className={`oasis-radio-dock ${isPlaying ? 'playing' : ''}`}>
        <div className="radio-visualizer">
          {[...Array(5)].map((_, i) => (
            <motion.div 
              key={i}
              animate={{ height: isPlaying ? [10, 30, 15, 25, 10] : 5 }}
              transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
              className="v-bar"
            />
          ))}
        </div>
        <div className="radio-info">
          <h4>إذاعة القرآن</h4>
          <p>بث مباشر</p>
        </div>
        <button className="play-toggle" onClick={togglePlay}>
          {isPlaying ? <Pause fill="white" /> : <Play fill="white" />}
        </button>
      </div>

      {/* 5. القائمة الذكية السفلى (Smart Oasis Dock) */}
      <footer className="oasis-dock-wrapper">
        <div className="oasis-dock glass-blur">
          <button className="dock-item active" onClick={() => setActivePortal(null)}>
            <LayoutGrid /><span>الواحة</span>
          </button>
          <button className="dock-item" onClick={() => setActivePortal('quran')}>
            <BookOpen /><span>المصحف</span>
          </button>
          <div className="dock-main-btn" onClick={handleTasbih}>
            <div className="btn-glow"></div>
            <Compass size={28} />
          </div>
          <button className="dock-item" onClick={() => setActivePortal('azkar')}>
            <Star /><span>الأذكار</span>
          </button>
          <button className="dock-item" onClick={() => setActivePortal('community')}>
            <Users /><span>المجتمع</span>
          </button>
        </div>
      </footer>

      {/* 6. نظام النوافذ المنبثقة (Portals) */}
      <AnimatePresence>
        {activePortal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="portal-overlay active"
          >
            <div className="portal-window glass-card-3d">
              <button className="close-portal" onClick={() => setActivePortal(null)}>
                <X /> العودة للواحة
              </button>
              <div className="portal-body">
                {activePortal === 'quran' && (
                  <div className="mushaf-reader">
                    <h2>سورة البقرة</h2>
                    <p className="quran-page-content">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ...</p>
                  </div>
                )}
                {activePortal === 'azkar' && (
                  <div className="azkar-list">
                    <h2>أذكار الصباح</h2>
                    <p>"أصبحنا وأصبح الملك لله..."</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* عناصر الصوت والتنبيهات */}
      <audio ref={audioRef} src={radioSources?.[currentSourceIndex]} />
      
      <AnimatePresence>
        {msg && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 20 }} 
            className="quran-toast"
          >
            {msg}
          </motion.div>
        )}
      </AnimatePresence>
</div> // 1. إغلاق الـ oasis-root (أول div فتحته في الـ return)
  );       // 2. إغلاق قوس الـ return
};         // 3. إغلاق قوس المكون (Religious)

export default Religious; // 4. التصدير النهائي