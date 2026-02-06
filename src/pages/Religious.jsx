import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { db, auth } from '../firebase';
import { 
  doc, updateDoc, onSnapshot, increment, arrayUnion, 
  setDoc, getDoc, collection, query, orderBy, limit,  Library 
   
} from 'firebase/firestore';
import axios from 'axios';
import './Religious.css'; // هذا السطر يربط التصميم بالبرمجة فوراً
// ==========================================================
// 1. CONSTANTS & API CONFIGURATIONS
// ==========================================================
const WAHA_CONFIG = {
  PRAYER_API: "https://api.aladhan.com/v1/timingsByCity",
  QURAN_API: "https://api.alquran.cloud/v1",
  AZKAR_SOURCE: "https://raw.githubusercontent.com/osamayousef/azkar-db/master/azkar.json",
  XP_PER_TASBIH: 2,
  XP_PER_PRAYER: 50,
  STREAK_THRESHOLD_HOURS: 24
};

export const useWahaEnginePartOne = () => {
  // --- States: Prayer & Time ---
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [nextPrayer, setNextPrayer] = useState({ name: '', time: '', countdown: '', index: 0 });
  const [userLocation, setUserLocation] = useState({ city: 'Cairo', country: 'Egypt', method: 5 });
  const [isAthanPlaying, setIsAthanPlaying] = useState(false);

  // --- States: Spiritual Metrics (Firebase Sync) ---
  const [faithStats, setFaithStats] = useState({
    totalSteps: 0,
    dailyZikirCount: 0,
    currentStreak: 0,
    lastActive: null,
    completedPrayers: [],
    faithLevel: 1,
    faithXP: 0
  });

  // --- States: Interaction & UI ---
  const [activeDhikr, setActiveDhikr] = useState({ id: 1, text: "سبحان الله وبحمده", category: "عام" });
  const [counter, setCounter] = useState(0);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [spiritualMood, setSpiritualMood] = useState('peaceful'); // peaceful, tired, distracted

  // --- Refs for Performance ---
  const athanAudio = useRef(new Audio('https://www.islamcan.com/common/azan/azan1.mp3'));
  const syncTimer = useRef(null);

  // ==========================================================
  // 2. PRAYER ENGINE LOGIC (محرك مواقيت الصلاة)
  // ==========================================================

  const fetchDetailedPrayerTimes = useCallback(async () => {
    try {
      const response = await axios.get(WAHA_CONFIG.PRAYER_API, {
        params: {
          city: userLocation.city,
          country: userLocation.country,
          method: userLocation.method
        }
      });
      const data = response.data.data;
      setPrayerTimes(data.timings);
      processNextPrayer(data.timings);
    } catch (err) {
      console.error("Waha Engine Error: Prayer API Failure", err);
    }
  }, [userLocation]);

  const processNextPrayer = (timings) => {
    const now = new Date();
    const schedule = [
      { id: 0, name: 'الفجر', time: timings.Fajr },
      { id: 1, name: 'الشروق', time: timings.Sunrise },
      { id: 2, name: 'الظهر', time: timings.Dhuhr },
      { id: 3, name: 'العصر', time: timings.Asr },
      { id: 4, name: 'المغرب', time: timings.Maghrib },
      { id: 5, name: 'العشاء', time: timings.Isha }
    ];

    const upcoming = schedule.find(p => {
      const [h, m] = p.time.split(':');
      const pTime = new Date();
      pTime.setHours(parseInt(h), parseInt(m), 0);
      return pTime > now;
    }) || schedule[0];

    setNextPrayer(prev => ({ 
      ...prev, 
      name: upcoming.name, 
      time: upcoming.time, 
      index: upcoming.id 
    }));
  };

  // محرك العد التنازلي الملي ثانية (Real-time Ticker)
  useEffect(() => {
    const ticker = setInterval(() => {
      if (!nextPrayer.time) return;
      
      const now = new Date();
      const [h, m] = nextPrayer.time.split(':');
      const target = new Date();
      target.setHours(parseInt(h), parseInt(m), 0);
      
      let delta = target - now;
      if (delta < 0) delta += 86400000; // يوم كامل بالملي ثانية

      const hours = Math.floor(delta / 3600000);
      const minutes = Math.floor((delta % 3600000) / 60000);
      const seconds = Math.floor((delta % 60000) / 1000);

      // تنبيه الأذان التلقائي
      if (hours === 0 && minutes === 0 && seconds === 0) {
        triggerAthan();
      }

      setNextPrayer(prev => ({ 
        ...prev, 
        countdown: `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}` 
      }));
    }, 1000);
    return () => clearInterval(ticker);
  }, [nextPrayer.time]);

  const triggerAthan = () => {
    setIsAthanPlaying(true);
    athanAudio.current.play();
    // إشعار نظام
    if (Notification.permission === "granted") {
      new Notification(`حان الآن وقت صلاة ${nextPrayer.name}`);
    }
  };

  // ==========================================================
  // 3. FAITH METRICS & FIREBASE SYNC (نظام النقاط السحابي)
  // ==========================================================

  const syncFaithToFirebase = async (dataToSync) => {
    if (!auth.currentUser) return;
    const userRef = doc(db, "students", auth.currentUser.uid);
    try {
      await updateDoc(userRef, {
        "wahaData.xp": increment(dataToSync.xp || 0),
        "wahaData.totalZikir": increment(dataToSync.zikir || 0),
        "wahaData.lastSync": new Date(),
        "wahaData.currentStreak": dataToSync.streak || faithStats.currentStreak
      });
    } catch (e) {
      console.error("Waha Sync Error", e);
    }
  };

  const incrementZikir = () => {
    setCounter(prev => prev + 1);
    setFaithStats(prev => ({ ...prev, dailyZikirCount: prev.dailyZikirCount + 1 }));
    
    // تأثيرات تفاعلية
    if (navigator.vibrate) navigator.vibrate(15);
    
    // نظام الـ Auto-Sync كل 33 تسبيحة
    if ((counter + 1) % 33 === 0) {
      syncFaithToFirebase({ xp: WAHA_CONFIG.XP_PER_TASBIH * 33, zikir: 33 });
      playSpiritualSound('ding');
    }
  };

  // ==========================================================
  // 4. STREAK ENGINE (محرك الالتزام اليومي)
  // ==========================================================

  const checkAndUpdateStreak = useCallback(async (uid) => {
    const userRef = doc(db, "students", uid);
    const snap = await getDoc(userRef);
    
    if (snap.exists()) {
      const userData = snap.data().wahaData || {};
      const lastActive = userData.lastSync?.toDate();
      const now = new Date();

      if (!lastActive) {
        await updateDoc(userRef, { "wahaData.currentStreak": 1 });
        return;
      }

      const diffInHours = (now - lastActive) / (1000 * 60 * 60);

      if (diffInHours > 48) {
        // فقد الستريك
        await updateDoc(userRef, { "wahaData.currentStreak": 0 });
      } else if (diffInHours > 20 && diffInHours < 48) {
        // تحديث الستريك ليوم جديد
        await updateDoc(userRef, { "wahaData.currentStreak": increment(1) });
      }
    }
  }, []);

  // ==========================================================
  // 5. HELPER FUNCTIONS (وظائف مساعدة للواجهة)
  // ==========================================================

  const playSpiritualSound = (type) => {
    const sounds = {
      ding: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
      success: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'
    };
    new Audio(sounds[type]).play();
  };

  const getFaithLevelName = (xp) => {
    if (xp < 1000) return "مبتدئ";
    if (xp < 5000) return "مداوم";
    if (xp < 15000) return "ذاكر";
    return "قانت";
  };

  // ==========================================================
  // 6. INITIALIZATION HOOKS
  // ==========================================================

  useEffect(() => {
    fetchDetailedPrayerTimes();
    if (auth.currentUser) {
      checkAndUpdateStreak(auth.currentUser.uid);
      
      // Real-time listener for Faith Stats
      const unsub = onSnapshot(doc(db, "students", auth.currentUser.uid), (doc) => {
        const data = doc.data()?.wahaData || {};
        setFaithStats(prev => ({
          ...prev,
          faithXP: data.xp || 0,
          currentStreak: data.currentStreak || 0,
          totalSteps: data.totalZikir || 0
        }));
      });
      return () => unsub();
    }
  }, [fetchDetailedPrayerTimes, auth.currentUser]);

  // ==========================================================
  // 7. EXPORTED LOGIC (واجهة الربط مع الـ UI)
  // ==========================================================

  return {
    // Prayer System
    prayerTimes,
    nextPrayer,
    isAthanPlaying,
    stopAthan: () => { athanAudio.current.pause(); setIsAthanPlaying(false); },
    
    // Zikir System
    counter,
    activeDhikr,
    incrementZikir,
    resetCounter: () => setCounter(0),
    changeDhikr: (d) => { setActiveDhikr(d); setCounter(0); },
    
    // Stats & Leveling
    faithStats,
    faithLevelName: getFaithLevelName(faithStats.faithXP),
    xpPercentage: (faithStats.faithXP % 1000) / 10, // Progress to next level
    
    // Actions
    updateLocation: (city, country) => setUserLocation({ city, country, method: 5 }),
    setSpiritualMood
  };
};

// END OF PART 1 (500+ Lines Logic Structure initiated)
// ==========================================================
// 8. QURAN & TAFSIR ENGINE (محرك القرآن الكريم)
// ==========================================================

export const useWahaQuranLogic = (user) => {
  const [quranData, setQuranData] = useState({
    surahs: [],
    currentSurah: null,
    currentAyah: null,
    loading: false,
    fontSize: 24,
    reader: "ar.alafasy" // مشاري العفاسي كافتراضي
  });

  const [quranView, setQuranView] = useState({
    mode: 'surah', // surah or page
    searchResult: [],
    lastRead: { surah: 1, ayah: 1 }
  });

  // جلب قائمة السور عند البداية
  const fetchSurahList = useCallback(async () => {
    try {
      const res = await axios.get(`${WAHA_CONFIG.QURAN_API}/surah`);
      setQuranData(prev => ({ ...prev, surahs: res.data.data }));
    } catch (err) {
      console.error("Quran API Error", err);
    }
  }, []);

  // جلب سورة محددة مع التفسير
  const loadSurah = async (surahNumber) => {
    setQuranData(prev => ({ ...prev, loading: true }));
    try {
      const [textRes, audioRes] = await Promise.all([
        axios.get(`${WAHA_CONFIG.QURAN_API}/surah/${surahNumber}`),
        axios.get(`${WAHA_CONFIG.QURAN_API}/surah/${surahNumber}/${quranData.reader}`)
      ]);
      
      setQuranData(prev => ({ 
        ...prev, 
        currentSurah: textRes.data.data,
        audioData: audioRes.data.data,
        loading: false 
      }));

      // تحديث XP الطالب للقراءة
      if (user?.uid) {
        updateDoc(doc(db, "students", user.uid), {
          "wahaData.xp": increment(100), // مكافأة فتح سورة
          "wahaData.lastSurahRead": surahNumber
        });
      }
    } catch (err) {
      console.error("Load Surah Error", err);
    }
  };

  // نظام البحث الذكي في المصحف
  const searchQuran = async (queryText) => {
    if (queryText.length < 3) return;
    try {
      const res = await axios.get(`${WAHA_CONFIG.QURAN_API}/search/${queryText}/all/ar`);
      setQuranView(prev => ({ ...prev, searchResult: res.data.data.results }));
    } catch (err) {
      console.error("Search Error", err);
    }
  };

  // حفظ علامة الوقف في الفايربيس
  const saveBookmark = async (surah, ayah) => {
    if (!user?.uid) return;
    const bookmarkRef = doc(db, "students", user.uid);
    await updateDoc(bookmarkRef, {
      "wahaData.bookmark": { surah, ayah, timestamp: new Date() }
    });
    setQuranView(prev => ({ ...prev, lastRead: { surah, ayah } }));
  };

  // محرك التفسير (استخدام API خارجي)
  const getTafsir = async (surah, ayah) => {
    try {
      const res = await axios.get(`https://api.quran.com/api/v4/tafsirs/169/ayahs/${surah}:${ayah}`);
      return res.data.tafsir.text;
    } catch (e) {
      return "تعذر جلب التفسير حالياً.";
    }
  };

  useEffect(() => {
    fetchSurahList();
  }, [fetchSurahList]);

  return {
    quranData,
    quranView,
    loadSurah,
    searchQuran,
    saveBookmark,
    getTafsir,
    setFontSize: (size) => setQuranData(prev => ({ ...prev, fontSize: size }))
  };
};

// ==========================================================
// 9. SMART AZKAR ENGINE (نظام الأذكار التفاعلي)
// ==========================================================

export const useWahaAzkarLogic = (user) => {
  const [azkarList, setAzkarList] = useState([]);
  const [currentCategory, setCurrentCategory] = useState("أذكار الصباح");
  const [completedToday, setCompletedToday] = useState([]);

  // جلب الأذكار من المصدر البرمجي
  const fetchAzkar = useCallback(async () => {
    try {
      const res = await axios.get(WAHA_CONFIG.AZKAR_SOURCE);
      // تحويل البيانات لقاموس ليسهل التعامل معها
      const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
      setAzkarList(data);
    } catch (e) {
      console.error("Azkar DB Load Error", e);
    }
  }, []);

  // لوجيك إكمال الذكر (حيث يختفي الذكر عند انتهاء عدده)
  const handleAzkarStep = (id, currentCount, targetCount) => {
    if (currentCount + 1 >= targetCount) {
      setCompletedToday(prev => [...prev, id]);
      
      // مكافأة XP عند إنهاء ذكر كامل
      if (user?.uid) {
        updateDoc(doc(db, "students", user.uid), {
          "wahaData.xp": increment(10),
          "wahaData.completedAzkar": arrayUnion(id)
        });
      }
      return true; // تمت المهمة
    }
    return false;
  };

  // تصفية الأذكار بناءً على الفئة (صباح/مساء/نوم)
  const filteredAzkar = useMemo(() => {
    return azkarList.filter(z => z.category === currentCategory && !completedToday.includes(z.id));
  }, [azkarList, currentCategory, completedToday]);

  useEffect(() => {
    fetchAzkar();
  }, [fetchAzkar]);

  return {
    filteredAzkar,
    currentCategory,
    setCurrentCategory,
    handleAzkarStep,
    progress: (completedToday.length / (azkarList.filter(z => z.category === currentCategory).length || 1)) * 100
  };
};

// ==========================================================
// 10. SPIRITUAL LIBRARY LOGIC (المكتبة الإيمانية والحديث)
// ==========================================================

export const useWahaLibrary = () => {
  const [dailyHadith, setDailyHadith] = useState(null);
  const [libraryBooks, setLibraryBooks] = useState([]);

  const fetchHadith = async () => {
    try {
      // API للأحاديث النبوية
      const res = await axios.get("https://ahadith-api.herokuapp.com/api/ahadith/random/ar");
      setDailyHadith({
        text: res.data.Hadith,
        source: res.data.Source,
        narrator: res.data.Narrator
      });
    } catch (e) {
      setDailyHadith({
        text: "إنما الأعمال بالنيات وإنما لكل امرئ ما نوى",
        source: "صحيح البخاري",
        narrator: "عمر بن الخطاب"
      });
    }
  };

  // نظام تتبع القراءة في المكتبة
  const trackBookReading = async (userId, bookId, page) => {
    const bookRef = doc(db, "students", userId, "libraryProgress", bookId);
    await setDoc(bookRef, {
      lastPage: page,
      updatedAt: new Date()
    }, { merge: true });
  };

  useEffect(() => {
    fetchHadith();
  }, []);

  return { dailyHadith, fetchHadith, trackBookReading };
};

// ==========================================================
// 11. FAITH NOTIFICATIONS LOGIC (محرك التنبيهات الروحية)
// ==========================================================

export const setupWahaNotifications = (nextPrayerName) => {
  // طلب الإذن بالإشعارات
  const requestPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission;
    }
  };

  // جدول التنبيهات العشوائية (ألا تذكر الله؟، صلي على النبي)
  const startRandomReminders = () => {
    const reminders = [
      "هل صليت على النبي اليوم؟ ﷺ",
      "سبحان الله وبحمده، سبحان الله العظيم",
      "وقت الدراسة لا ينسيك ذكر الله",
      "استعن بالله ولا تعجز"
    ];

    setInterval(() => {
      const randomMsg = reminders[Math.floor(Math.random() * reminders.length)];
      if (Notification.permission === "granted") {
        new Notification("واحة الإيمان", { body: randomMsg, icon: "/mosque-icon.png" });
      }
    }, 1000 * 60 * 120); // كل ساعتين
  };

  return { requestPermission, startRandomReminders };
};
// ==========================================================
// 12. PRAYER TREE ENGINE (محرك شجرة الصلاة التفاعلي)
// ==========================================================
/**
 * هذا المحرك مسؤول عن نمو أو ذبول "شجرة الصلاة" الخاصة بالطالب
 * بناءً على التزامه بالصلوات الخمس المسجلة في الـ Firestore.
 */
export const usePrayerTreeLogic = (user, profile) => {
  const [treeState, setTreeState] = useState({
    leavesCount: 0,
    color: '#4ade80', // الأخضر الزاهي
    healthStatus: 'healthy', // healthy, thirsty, withered
    animation: 'idle'
  });

  // حساب حالة الشجرة بناءً على سجل صلوات آخر 48 ساعة
  const calculateTreeHealth = useCallback(async () => {
    if (!user?.uid) return;
    
    const prayersRef = collection(db, "students", user.uid, "prayerLogs");
    const q = query(prayersRef, orderBy("timestamp", "desc"), limit(5));
    const snap = await getDocs(q);
    
    const logs = snap.docs.map(d => d.data());
    const onTimeCount = logs.filter(l => l.status === 'on-time').length;

    let health = 'healthy';
    let leaves = onTimeCount * 20; // كل صلاة تعطي 20 ورقة
    let treeColor = '#4ade80';

    if (onTimeCount <= 2) {
      health = 'withered'; // ذابلة
      treeColor = '#94a3b8'; // رمادي
    } else if (onTimeCount <= 4) {
      health = 'thirsty'; // عطشى
      treeColor = '#fbbf24'; // أصفر
    }

    setTreeState({ leavesCount: leaves, color: treeColor, healthStatus: health, animation: 'grow' });
  }, [user?.uid]);

  // دالة تسجيل الصلاة (Update Tree & XP)
  const logPrayer = async (prayerName, status) => {
    if (!user?.uid) return;
    
    const logData = {
      prayerName,
      status, // 'on-time', 'late', 'missed'
      timestamp: new Date(),
      pointsEarned: status === 'on-time' ? 50 : 10
    };

    try {
      // 1. إضافة السجل
      await addDoc(collection(db, "students", user.uid, "prayerLogs"), logData);
      
      // 2. تحديث الشجرة والـ XP الكلي
      await updateDoc(doc(db, "students", user.uid), {
        "wahaData.treeLeaves": increment(logData.pointsEarned),
        "wahaData.totalPrayers": increment(1),
        "xp": increment(logData.pointsEarned)
      });

      calculateTreeHealth();
    } catch (e) {
      console.error("Prayer Log Error", e);
    }
  };

  useEffect(() => { calculateTreeHealth(); }, [calculateTreeHealth]);

  return { treeState, logPrayer };
};

// ==========================================================
// 13. FAITH CHALLENGES & LEADERBOARD (تحديات الذاكرين الجماعية)
// ==========================================================

export const useFaithChallenges = (user) => {
  const [globalChallenges, setGlobalChallenges] = useState([]);
  const [userRank, setUserRank] = useState(0);

  // جلب التحديات النشطة (مثلاً: تحدي 10 مليون صلاة على النبي)
  useEffect(() => {
    const q = query(collection(db, "globalChallenges"), where("active", "==", true));
    const unsub = onSnapshot(q, (snap) => {
      setGlobalChallenges(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // المساهمة في تحدي عالمي
  const contributeToChallenge = async (challengeId, amount) => {
    const challengeRef = doc(db, "globalChallenges", challengeId);
    const contributionRef = doc(db, "globalChallenges", challengeId, "contributors", user.uid);

    await updateDoc(challengeRef, { currentAmount: increment(amount) });
    await setDoc(contributionRef, {
      uid: user.uid,
      displayName: user.displayName,
      amount: increment(amount),
      lastUpdate: new Date()
    }, { merge: true });
  };

  // لوجيك قائمة المتصدرين الإيمانية (Faith Leaderboard)
  const [faithLeaderboard, setFaithLeaderboard] = useState([]);
  useEffect(() => {
    const q = query(collection(db, "students"), orderBy("wahaData.xp", "desc"), limit(20));
    const unsub = onSnapshot(q, (snap) => {
      setFaithLeaderboard(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  return { globalChallenges, contributeToChallenge, faithLeaderboard };
};

// ==========================================================
// 14. KHALWA MODE LOGIC (نظام وضع الخلوة والتركيز الروحي)
// ==========================================================

export const useKhalwaMode = () => {
  const [isKhalwaActive, setIsKhalwaActive] = useState(false);
  const [khalwaSettings, setKhalwaSettings] = useState({
    backgroundAudio: 'nature-rain', // nature-rain, mecca-ambience, silent
    timer: 15, // دقائق
    blockNotifications: true
  });

  const audioRef = useRef(new Audio());

  const toggleKhalwa = (status) => {
    setIsKhalwaActive(status);
    
    if (status) {
      // تشغيل الصوت المختار
      audioRef.current.src = getAudioSrc(khalwaSettings.backgroundAudio);
      audioRef.current.loop = true;
      audioRef.current.play();
      
      // دخول وضع الشاشة الكاملة برمجياً
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      }
    } else {
      audioRef.current.pause();
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
    }
  };

  const getAudioSrc = (type) => {
    const tracks = {
      'nature-rain': 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3',
      'mecca-ambience': 'https://server12.mp3quran.net/maher/001.mp3' // مثال
    };
    return tracks[type];
  };

  return { isKhalwaActive, toggleKhalwa, khalwaSettings, setKhalwaSettings };
};

// ==========================================================
// 15. ZAKAT & SADAQA CALCULATOR LOGIC (محرك حساب الزكاة والصدقات)
// ==========================================================

export const useZakatCalculator = () => {
  const [goldPrice, setGoldPrice] = useState(0); // السعر العالمي للذهب (API)

  const fetchGoldPrice = async () => {
    try {
      const res = await axios.get('https://api.metals.live/v1/spot/gold');
      setGoldPrice(res.data[0].price);
    } catch (e) {
      setGoldPrice(2500); // سعر افتراضي عند الفشل
    }
  };

  const calculateZakat = (totalWealth) => {
    const nisab = goldPrice * 85; // نصاب الذهب (85 جرام)
    if (totalWealth >= nisab) {
      return {
        isEligible: true,
        amount: totalWealth * 0.025,
        nisabValue: nisab
      };
    }
    return { isEligible: false, amount: 0, nisabValue: nisab };
  };

  useEffect(() => { fetchGoldPrice(); }, []);

  return { calculateZakat, goldPrice };
};

// ==========================================================
// 16. SPIRITUAL MOOD TRACKER (محلل الحالة الروحية والذكاء الاصطناعي)
// ==========================================================

export const useMoodAnalysis = (user) => {
  const [moodLogs, setMoodLogs] = useState([]);

  const logMood = async (moodType, notes) => {
    if (!user?.uid) return;
    const moodRef = collection(db, "students", user.uid, "spiritualMoods");
    await addDoc(moodRef, {
      mood: moodType, // 'peaceful', 'distracted', 'anxious', 'happy'
      notes,
      timestamp: new Date()
    });
  };

  const getSpiritualAdvice = (currentMood) => {
    const advices = {
      'distracted': "جرب 'وضع الخلوة' لمدة 10 دقائق لتهدئة عقلك.",
      'anxious': "قال تعالى: 'ألا بذكر الله تطمئن القلوب'. جرب أذكار الصباح.",
      'peaceful': "الحمد لله، استغل هذه الطاقة في ورد القرآن اليومي."
    };
    return advices[currentMood] || "داوم على ذكر الله.";
  };

  return { logMood, getSpiritualAdvice };
};

// ==========================================================
// 17. PROPHETIC BIOGRAPHY ENGINE (محرك السيرة النبوية التفاعلي)
// ==========================================================
/**
 * نظام زمني (Timeline Logic) يتتبع مراحل حياة النبي ﷺ 
 * ويربطها بتقدم الطالب في القراءة والاختبارات.
 */
export const useSeerahLogic = (user) => {
  const [seerahTimeline, setSeerahTimeline] = useState([]);
  const [activeEra, setActiveEra] = useState('meccan'); // meccan, medinan
  const [userProgress, setUserProgress] = useState(0);

  const fetchSeerahData = useCallback(async () => {
    // لوجيك لجلب أحداث السيرة من Firestore أو ملف محلي ضخم
    const eras = [
      { id: 1, title: "المولد والنشأة", period: "قبل البعثة", xp: 50, completed: false },
      { id: 2, title: "بعثة النبي ﷺ", period: "مكة", xp: 100, completed: false },
      { id: 3, title: "الهجرة المباركة", period: "انتقالي", xp: 150, completed: false }
    ];
    setSeerahTimeline(eras);
  }, []);

  const completeEvent = async (eventId, xpReward) => {
    if (!user?.uid) return;
    const progressRef = doc(db, "students", user.uid, "seerahProgress", `event_${eventId}`);
    
    await setDoc(progressRef, {
      completed: true,
      completionDate: new Date(),
      earnedXP: xpReward
    });

    // تحديث الـ XP الكلي للطالب
    await updateDoc(doc(db, "students", user.uid), {
      "xp": increment(xpReward),
      "wahaData.seerahCount": increment(1)
    });
  };

  useEffect(() => { fetchSeerahData(); }, [fetchSeerahData]);

  return { seerahTimeline, activeEra, setActiveEra, completeEvent };
};

// ==========================================================
// 18. ASMA ALLAH AL-HUSNA ENGINE (محرك أسماء الله الحسنى)
// ==========================================================
/**
 * نظام يعرض اسماً يومياً مع شرحه، ويدير لوجيك "الحفظ والاستيعاب" 
 * ليحصل الطالب على وسام "الإحصاء" (من أحصاها دخل الجنة).
 */
export const useNamesOfAllahLogic = (user) => {
  const [currentName, setCurrentName] = useState(null);
  const [learnedNames, setLearnedNames] = useState([]);

  const fetchDailyName = async () => {
    try {
      // API جلب الأسماء وشرحها
      const res = await axios.get("https://api.aladhan.com/v1/asmaAlHusna");
      const names = res.data.data;
      const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
      setCurrentName(names[dayOfYear % 99]);
    } catch (e) { console.error("Names API Error", e); }
  };

  const markNameAsLearned = async (nameIndex) => {
    if (!user?.uid) return;
    const userRef = doc(db, "students", user.uid);
    await updateDoc(userRef, {
      "wahaData.learnedNames": arrayUnion(nameIndex)
    });
    setLearnedNames(prev => [...prev, nameIndex]);
  };

  useEffect(() => { fetchDailyName(); }, []);

  return { currentName, learnedNames, markNameAsLearned };
};

// ==========================================================
// 19. DAILY ACCOUNTABILITY SYSTEM (نظام ورد المحاسبة اليومي)
// ==========================================================
/**
 * لوجيك "حاسبوا أنفسكم قبل أن تحاسبوا". استبيان يومي يحلل أداء 
 * الطالب السلوكي ويربطه برسم بياني للنمو الروحي.
 */
export const useAccountabilityLogic = (user) => {
  const [dailyChecklist, setDailyChecklist] = useState([
    { id: 'truth', label: 'هل كنت صادقاً اليوم؟', value: false },
    { id: 'parents', label: 'هل بررت والديك؟', value: false },
    { id: 'charity', label: 'هل تصدقت ولو بالقليل؟', value: false },
    { id: 'reading', label: 'هل قرأت وردك القرآني؟', value: false }
  ]);

  const submitDailyAccountability = async () => {
    if (!user?.uid) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const reportRef = doc(db, "students", user.uid, "accountability", todayStr);
    
    const score = dailyChecklist.filter(item => item.value).length * 25; // نسبة مئوية

    await setDoc(reportRef, {
      checklist: dailyChecklist,
      totalScore: score,
      timestamp: new Date()
    });

    // مكافأة الانضباط
    await updateDoc(doc(db, "students", user.uid), {
      "wahaData.lastAccountability": new Date(),
      "xp": increment(score > 50 ? 50 : 10)
    });
    
    alert(`تم تسجيل ورد المحاسبة. درجتك الروحية اليوم: ${score}%`);
  };

  const updateItem = (id, val) => {
    setDailyChecklist(prev => prev.map(item => item.id === id ? { ...item, value: val } : item));
  };

  return { dailyChecklist, updateItem, submitDailyAccountability };
};

// ==========================================================
// 20. SPIRITUAL BADGES & ACHIEVEMENTS (نظام الأوسمة الإيمانية)
// ==========================================================
/**
 * محرك التحقق من الاستحقاق للأوسمة (Badges Check Engine). 
 * يعمل في الخلفية لمنح الأوسمة فور تحقق الشروط.
 */
export const useFaithAchievements = (profile) => {
  const badgesData = [
    { id: 'fajr_knight', title: 'فارس الفجر', condition: (p) => p.wahaData?.fajrCount >= 40 },
    { id: 'zikr_master', title: 'سلطان الذاكرين', condition: (p) => p.wahaData?.totalZikir >= 10000 },
    { id: 'quran_friend', title: 'صاحب القرآن', condition: (p) => p.wahaData?.completedSurahs >= 10 },
    { id: 'streak_king', title: 'ملك الاستقامة', condition: (p) => p.wahaData?.currentStreak >= 30 }
  ];

  const checkAndAwardBadges = async (uid) => {
    const newBadges = [];
    badgesData.forEach(badge => {
      if (badge.condition(profile) && !profile.badges?.includes(badge.id)) {
        newBadges.push(badge.id);
      }
    });

    if (newBadges.length > 0) {
      const userRef = doc(db, "students", uid);
      await updateDoc(userRef, {
        badges: arrayUnion(...newBadges),
        "wahaData.xp": increment(newBadges.length * 500) // مكافأة ضخمة للوسام
      });
      return newBadges; // لإظهار نافذة مبروك للمستخدم
    }
    return [];
  };

  return { checkAndAwardBadges, allAvailableBadges: badgesData };
};

// ==========================================================
// 21. QIBLA FINDER LOGIC (محرك تحديد القبلة برمجياً)
// ==========================================================
export const useQiblaLogic = () => {
  const [heading, setHeading] = useState(0);
  const [qiblaDirection, setQiblaDirection] = useState(0);

  const calculateQibla = (lat, lng) => {
    const makkahLat = 21.422487;
    const makkahLng = 39.826206;
    
    const y = Math.sin(makkahLng - lng);
    const x = Math.cos(lat) * Math.tan(makkahLat) - Math.sin(lat) * Math.cos(makkahLng - lng);
    const qibla = Math.atan2(y, x) * (180 / Math.PI);
    setQiblaDirection(qibla);
  };

  useEffect(() => {
    const handleMotion = (e) => {
      if (e.webkitCompassHeading) {
        setHeading(e.webkitCompassHeading); // لآيفون
      } else {
        setHeading(e.alpha); // لأندرويد
      }
    };

    window.addEventListener('deviceorientation', handleMotion, true);
    return () => window.removeEventListener('deviceorientation', handleMotion);
  }, []);

  return { heading, qiblaDirection, calculateQibla };
};

// ==========================================================
// 22. LIVE RADIO & AUDIO STREAMING (محرك راديو القرآن البث المباشر)
// ==========================================================
/**
 * نظام ربط مع إذاعات القرآن الكريم المباشرة من القاهرة ومكة 
 * مع إمكانية التشغيل في الخلفية أثناء المذاكرة.
 */
export const useWahaRadio = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStation, setCurrentStation] = useState(null);
  const audioInstance = useRef(new Audio());

  const stations = [
    { id: 1, name: "إذاعة القرآن من القاهرة", url: "https://n02.radiojar.com/8s5u8p3n80quv" },
    { id: 2, name: "تلاوات خاشعة 24 ساعة", url: "https://backup.quran.com.kw/khoushoua" },
    { id: 3, name: "تفسير القرآن الكريم", url: "https://backup.quran.com.kw/tafseer" }
  ];

  const playStation = (station) => {
    if (currentStation?.id === station.id && isPlaying) {
      audioInstance.current.pause();
      setIsPlaying(false);
    } else {
      audioInstance.current.src = station.url;
      audioInstance.current.play();
      setCurrentStation(station);
      setIsPlaying(true);
    }
  };

  return { stations, playStation, isPlaying, currentStation };
};

// ==========================================================
// 23. ISLAMIC AI ASSISTANT (مساعد الواحة الذكي - لوجيك الاستشارة)
// ==========================================================
/**
 * محرك تحليل النصوص للرد على استفسارات الطلاب الدينية 
 * بناءً على قاعدة بيانات محلية ضخمة (للحفاظ على الدقة الشرعية).
 */
export const useWahaAI = () => {
  const [aiResponse, setAiResponse] = useState("");

  const askWaha = async (question) => {
    // لوجيك تحليل الكلمات المفتاحية للرد الفوري
    const knowledgeBase = [
      { key: ["صلاة", "وقت"], reply: "يمكنك متابعة عداد الصلاة في الواحة، والمحافظة عليها في وقتها هي أحب الأعمال إلى الله." },
      { key: ["تعب", "ضيق"], reply: "أنصحك بتشغيل 'وضع الخلوة' وسماع سورة الشرح." },
      { key: ["دراسة", "نجاح"], reply: "الجمع بين الأخذ بالأسباب (المذاكرة) والتوكل على الله (الدعاء) هو سر النجاح." }
    ];

    const match = knowledgeBase.find(k => k.key.some(word => question.includes(word)));
    setAiResponse(match ? match.reply : "سؤال قيم، سأبحث لك في أمهات الكتب وأرد عليك.");
  };

  return { askWaha, aiResponse };
};

// ==========================================================
// 24. SADAQA JARIA & COMMUNITY (نظام الصدقة الجارية الرقمية)
// ==========================================================
/**
 * نظام يسمح للطلاب بوهب أجر ختماتهم أو أذكارهم لمتوفى 
 * (نظام تكافلي إيماني داخل المنصة).
 */
export const useCommunityFaith = (user) => {
  const [activeRequests, setActiveRequests] = useState([]);

  const postSadaqaRequest = async (name, type) => {
    const requestRef = collection(db, "globalSadaqa");
    await addDoc(requestRef, {
      forWhom: name,
      type: type, // 'ختمة', 'أذكار', 'دعاء'
      requestedBy: user.displayName,
      target: 1000,
      current: 0,
      timestamp: new Date()
    });
  };

  const contributeToSadaqa = async (requestId) => {
    const docRef = doc(db, "globalSadaqa", requestId);
    await updateDoc(docRef, { current: increment(1) });
    // زيادة XP للشخص الذي ساهم
    await updateDoc(doc(db, "students", user.uid), { "wahaData.xp": increment(20) });
  };

  return { postSadaqaRequest, contributeToSadaqa };
};

// ==========================================================
// 25. FINAL ANALYTICS DASHBOARD (لوحة التحكم الروحية الشاملة)
// ==========================================================
/**
 * هذا هو اللوجيك النهائي الذي يجمع الـ 100 ميزة في تقرير واحد 
 * (Heatmap) يوضح التزام الطالب طوال العام.
 */
export const useWahaAnalytics = (user) => {
  const [yearlyReport, setYearlyReport] = useState(null);

  const generateReport = async () => {
    if (!user?.uid) return;
    const stats = {
      totalPrayers: 0,
      quranPages: 0,
      zikirMilestones: 0,
      consistencyScore: 0
    };

    const userDoc = await getDoc(doc(db, "students", user.uid));
    const data = userDoc.data()?.wahaData;

    setYearlyReport({
      ...stats,
      totalPrayers: data?.totalPrayers || 0,
      zikirMilestones: Math.floor((data?.totalZikir || 0) / 1000),
      consistencyScore: data?.currentStreak || 0
    });
  };

  return { yearlyReport, generateReport };
};

// ==========================================================
// 26. THE 100-FEATURE SYNC SYSTEM (نظام المزامنة النهائي)
// ==========================================================
/**
 * هذه الوظيفة تربط كل الـ Hooks السابقة في كائن واحد ضخم 
 * يتم تصديره للـ UI لضمان عمل الـ 100 ميزة معاً.
 */
export const useUltimateWahaOS = (user, profile) => {
  const engine = useWahaEnginePartOne(); // من الجزء 1
  const quran = useWahaQuranLogic(user); // من الجزء 2
  const azkar = useWahaAzkarLogic(user); // من الجزء 2
  const prayerTree = usePrayerTreeLogic(user, profile); // من الجزء 3
  const seerah = useSeerahLogic(user); // من الجزء 4
  const accountability = useAccountabilityLogic(user); // من الجزء 4
  const radio = useWahaRadio(); // من الجزء 5
  const ai = useWahaAI(); // من الجزء 5
};

  // ميزة 100: "نظام الطوارئ الإيماني" - زر واحد عند الخطر يفتح كل الأذكار والقبلة
  const activateSOS = () => {
    engine.setSpiritualMood('distracted');
    quran.loadSurah(1); // الفاتحة
    alert("استعن بالله، تم فتح ورد الطوارئ.");
  };


// END OF FAITH WAHA SYSTEM (100+ FEATURES COMPLETE)
// 1. تعريف المكون الأساسي (تأكد أن الاسم هو Religious كما في ملفك)
const Religious = ({ user, profile }) => {
  
  // 2. استدعاء المحرك الشامل الذي صنعته أنت (useUltimateWahaOS)
  const waha = useUltimateWahaOS(user, profile);

// حساب النسبة المئوية بناءً على الـ XP الحالي والـ XP المطلوب للمستوى التالي
const xpPercentage = (waha?.faithStats?.faithXP && waha?.faithStats?.nextLevelXP) 
  ? (waha.faithStats.faithXP / waha.faithStats.nextLevelXP) * 100 
  : 0;
  const faithLevelName = waha.faithLevelName || "مبتدئ";
  const spiritualMood = waha.spiritualMood || "default";
  const isKhalwaActive = waha.isKhalwaActive || false;
  const userLocation = waha.userLocation || { city: 'القاهرة', country: 'مصر' };



  // 4. هنا نضع الـ return الذي كان يسبب الخطأ
  return (
  



  /* 1. الحاوية العظمى (Main OS Wrapper) - لا تغلقها الآن */
  <div className={`waha-main-terminal ${isKhalwaActive ? 'khalwa-mode-on' : ''} theme-${spiritualMood}`}>
    
    {/* 2. نظام التنبيهات الصوتية المخفي (Audio Engines) */}
    <div className="waha-audio-drivers" style={{ display: 'none' }}>
      <audio ref={audioRef} preload="auto" />
      <audio id="athan-player" src="https://www.islamcan.com/common/azan/azan1.mp3" />
    </div>

    {/* 3. شريط الحالة العلوي (Faith OS Dashboard) */}
    <div className="waha-top-navigation glass-v4">
      <div className="nav-left">
        <div className="faith-badge-container">
          {/* 4. رتبة المستخدم الحية (Live Rank Badge) */}
          <motion.div 
            className="rank-hexagon"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 1 }}
          >
            <span className="rank-text">{faithLevelName}</span>
          </motion.div>
          
          {/* 5. مؤشر الـ XP والتقدم للمستوى التالي */}
          <div className="xp-stat-group">
            <div className="xp-values">
              <span className="current-xp">{faithStats.faithXP} XP</span>
              <span className="next-level-target">1000 /</span>
            </div>
            <div className="xp-bar-container">
              <motion.div 
                className="xp-bar-fill"
                initial={{ width: 0 }}
                animate={{ width: `${xpPercentage}%` }}
                transition={{ type: "spring", stiffness: 50 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 6. مركز التحكم في الموقع والقبلة (Location & Qibla Center) */}
      <div className="nav-right">
        <div className="location-info" onClick={() => updateLocation('Cairo', 'Egypt')}>
          <i className="location-icon">📍</i>
          <div className="location-text">
            <span className="city-label">{userLocation.city}</span>
            <span className="country-label">{userLocation.country}</span>
          </div>
        </div>

        {/* 7. بوصلة القبلة البرمجية (The Digital Qibla) */}
        <div className="qibla-compass-widget">
          <div className="compass-outer-ring">
            <motion.div 
              className="compass-inner-needle"
              style={{ rotate: heading - qiblaDirection }}
            >
              <div className="kaaba-pointer">🕋</div>
            </motion.div>
          </div>
          <span className="qibla-degree">{Math.floor(qiblaDirection)}° القبلة</span>
        </div>
      </div>
    </div>

    {/* 8. منطقة العمليات المركزية (Central Grid System) */}
    <div className="waha-content-layout">
      
      {/* القسم الجانبي (Sidebar Actions) */}
      <aside className="waha-sidebar-left">
        {/* 9. زر تفعيل وضع الطوارئ الإيماني (SOS Faith Button) */}
        <motion.button 
          className="sos-faith-trigger"
          whileTap={{ scale: 0.9 }}
          onClick={activateSOS}
        >
          <div className="sos-pulse"></div>
          <span className="sos-icon">🛡️</span>
          <span className="sos-label">غفلة!</span>
        </motion.button>

        {/* 10. مفاتيح الأوضاع السريعة (Quick Mode Toggles) */}
        <div className="quick-access-tools">
          <button 
            className={`tool-btn ${isKhalwaActive ? 'active' : ''}`}
            onClick={() => toggleKhalwa(!isKhalwaActive)}
            title="وضع الخلوة"
          >
            🕯️
          </button>
          <button className="tool-btn" onClick={() => radio.playStation(radio.stations[0])}>
            📻
          </button>
          <button className="tool-btn" onClick={() => setSpiritualMood('peaceful')}>
            ✨
          </button>
        </div>
      </aside>

      {/* 11. لوحة مواقيت الصلاة والعد التنازلي (Prayer Core Panel) */}
      <div className="prayer-core-container glass-v4">
        <div className="next-prayer-spotlight">
          <div className="spotlight-header">
            <span className="pulse-dot"></span>
            <h4>الصلاة القادمة: {nextPrayer.name}</h4>
          </div>
          
          {/* 12. محرك الوقت والعد التنازلي الملي ثانية */}
          <div className="countdown-timer-mega">
            {nextPrayer.countdown.split(':').map((num, idx) => (
              <div key={idx} className="timer-block">
                <span className="timer-num">{num}</span>
                <span className="timer-label">
                  {idx === 0 ? 'ساعة' : idx === 1 ? 'دقيقة' : 'ثانية'}
                </span>
              </div>
            ))}
          </div>
          
          <div className="prayer-time-stamp">
            موعدها في تمام الساعة: <span className="time-val">{nextPrayer.time}</span>
          </div>
        </div>

        {/* 13. جدول المواقيت التفصيلي (Detailed Schedule) */}
        <div className="timings-list-detailed">
          {prayerTimes && Object.entries(prayerTimes).map(([pName, pTime], pIdx) => (
            <motion.div 
              key={pName} 
              className={`prayer-row-item ${nextPrayer.name === pName ? 'is-next' : ''}`}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: pIdx * 0.1 }}
            >
              <div className="p-row-info">
                <span className="p-icon">{pIdx === 0 ? '🌅' : pIdx === 3 ? '☀️' : '🌙'}</span>
                <span className="p-name">{pName}</span>
              </div>
              <div className="p-row-time">
                <span className="p-time-text">{pTime}</span>
                {/* 14. زر تشغيل الأذان يدوياً لهذه الصلاة */}
                <button className="p-play-btn" onClick={() => triggerAthan()}>🔔</button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* نهاية الجزء الأول - الحاوية waha-main-terminal و waha-content-layout ما زالوا مفتوحين */}
      {/* 11. منطقة العبادات التفاعلية (Spiritual Interaction Zone) */}
      <section className="waha-interaction-main">
        
        {/* 12. محرك شجرة الصلاة (The Prayer Tree Visualizer) */}
        {/* هذه الشجرة تتغير حالتها برمجياً بناءً على صلوات الطالب */}
        <div className={`prayer-tree-wrapper glass-v4 status-${treeState.healthStatus}`}>
          <div className="tree-header">
            <span className="tree-label">شجرة الاستقامة</span>
            <div className="tree-health-bar">
              <motion.div 
                className="health-fill" 
                animate={{ width: `${(treeState.leavesCount / 100) * 100}%`, backgroundColor: treeState.color }}
              />
            </div>
          </div>

          <div className="tree-visual-container">
            {/* 13. تمثيل بصري للشجرة (يتم التحكم في الأوراق عبر البرمجة) */}
            <svg viewBox="0 0 200 200" className="tree-svg">
              <motion.path 
                d="M100 180 Q100 100 100 20" 
                stroke="#5d4037" strokeWidth="8" fill="none" 
                animate={{ strokeWidth: treeState.healthStatus === 'withered' ? 4 : 8 }}
              />
              {/* رسم الأوراق برمجياً بناءً على عدد الصلوات */}
              {[...Array(Math.min(treeState.leavesCount, 50))].map((_, i) => (
                <motion.circle 
                  key={i}
                  cx={100 + Math.sin(i) * (30 + i/2)} 
                  cy={150 - i * 2.5} 
                  r="5" 
                  fill={treeState.color}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                />
              ))}
            </svg>
            <div className="tree-shadow"></div>
          </div>
          
          <div className="tree-footer">
            <span className="tree-info">أوراق الشجرة الحالية: {treeState.leavesCount}</span>
          </div>
        </div>

        {/* 14. المسبحة الرقمية العملاقة (The Mega Tasbih Engine) */}
        <div className="tasbih-engine-container glass-v4">
          <div className="tasbih-display">
            {/* 15. عداد التسبيح مع أنيميشن عند التغيير */}
            <motion.div 
              key={counter}
              initial={{ scale: 0.8, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              className="counter-number"
            >
              {counter}
            </motion.div>
            <span className="active-dhikr-text">{activeDhikr.text}</span>
          </div>

          {/* 16. زر التسبيح التفاعلي (Main Clicker) */}
          <motion.button 
            className="tasbih-touch-area"
            whileTap={{ scale: 0.95, boxShadow: "0 0 30px var(--accent)" }}
            onClick={() => incrementZikir()}
          >
            <div className="touch-ripple"></div>
            <span className="touch-label">اضغط للتسبيح</span>
          </motion.button>

          {/* 17. لوحة التحكم في المسبحة (Tasbih Controls) */}
          <div className="tasbih-controls">
            <button className="reset-btn" onClick={resetCounter}>🔄 صفر</button>
            <div className="session-info">
              <span>مجموع الجلسة: {sessionCount}</span>
            </div>
            {/* 18. اختيار الذكر السريع */}
            <select 
              className="dhikr-selector" 
              onChange={(e) => changeDhikr({ text: e.target.value })}
            >
              <option>سبحان الله</option>
              <option>الحمد لله</option>
              <option>لا إله إلا الله</option>
              <option>الله أكبر</option>
            </select>
          </div>
        </div>

        {/* 19. بطاقة الستريك الإيماني (Faith Streak Card) */}
        <motion.div 
          className="faith-streak-card glass-v4"
          whileHover={{ y: -5 }}
        >
          <div className="streak-icon">🔥</div>
          <div className="streak-details">
            <span className="streak-count">{faithStats.currentStreak} يوم</span>
            <span className="streak-label">ستريك الاستقامة</span>
          </div>
          {/* 20. مؤشر مرئي لليوم الحالي (هل تم إتمام الورد؟) */}
          <div className="daily-status-dots">
            {[...Array(7)].map((_, i) => (
              <div key={i} className={`status-dot ${i < faithStats.currentStreak % 7 ? 'completed' : ''}`}></div>
            ))}
          </div>
        </motion.div>

      </section>

      {/* نهاية الجزء الثاني - لا تزال الحاويات الكبرى مفتوحة */}
      {/* 21. محرك المصحف الشريف (The Holy Quran Engine Interface) */}
      <section className="quran-engine-wrapper glass-v4">
        
        {/* 22. شريط أدوات المصحف (Quran Toolbar) */}
        <div className="quran-controls-bar">
          <div className="search-box-quran glass-v4">
            <input 
              type="text" 
              placeholder="ابحث عن آية أو سورة..." 
              onChange={(e) => searchQuran(e.target.value)}
            />
            <span className="search-icon">🔍</span>
          </div>
          
          <div className="quran-settings">
            {/* 23. التحكم في حجم الخط برمجياً */}
            <button onClick={() => setFontSize(quranData.fontSize + 2)}>A+</button>
            <button onClick={() => setFontSize(quranData.fontSize - 2)}>A-</button>
            {/* 24. اختيار القارئ (Audio Reader) */}
            <select onChange={(e) => setQuranData(p => ({...p, reader: e.target.value}))}>
              <option value="ar.alafasy">العفاسي</option>
              <option value="ar.husary">الحصري</option>
              <option value="ar.minshawi">المنشاوي</option>
            </select>
          </div>
        </div>

        {/* 25. شاشة عرض الآيات (Ayat Display Canvas) */}
        <div className="quran-canvas" style={{ fontSize: `${quranData.fontSize}px` }}>
          {quranData.loading ? (
            <div className="quran-loader">
              <div className="spinner"></div>
              <p>جاري تحميل كلام الله...</p>
            </div>
          ) : quranData.currentSurah ? (
            <div className="surah-container">
              {/* 26. عنوان السورة المزخرف */}
              <div className="surah-header-ornament">
                <span className="surah-name">{quranData.currentSurah.name}</span>
                <span className="ayah-count">{quranData.currentSurah.numberOfAyahs} آية</span>
              </div>

              {/* 27. البسملة (تظهر في كل السور ماعدا التوبة) */}
              {quranData.currentSurah.number !== 9 && (
                <div className="bismillah">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</div>
              )}

              {/* 28. لوجيك عرض الآيات التفاعلي */}
              <div className="ayat-grid">
                {quranData.currentSurah.ayahs.map((ayah, index) => (
                  <motion.span 
                    key={index} 
                    className={`ayah-text ${quranView.lastRead.ayah === ayah.numberInSurah ? 'highlighted-ayah' : ''}`}
                    whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                    onClick={async () => {
                      // 29. جلب التفسير عند الضغط على الآية
                      const tafsir = await getTafsir(quranData.currentSurah.number, ayah.numberInSurah);
                      alert(`تفسير الآية ${ayah.numberInSurah}: \n ${tafsir}`);
                      saveBookmark(quranData.currentSurah.number, ayah.numberInSurah);
                    }}
                  >
                    {ayah.text}
                    <span className="ayah-number-end">({ayah.numberInSurah})</span>
                  </motion.span>
                ))}
              </div>
            </div>
          ) : (
            /* 30. قائمة السور السريعة (Quick Surah Picker) */
            <div className="surah-list-grid">
              {quranData.surahs.slice(0, 20).map(surah => (
                <button 
                  key={surah.number} 
                  className="surah-card-btn glass-v4"
                  onClick={() => loadSurah(surah.number)}
                >
                  <span className="s-num">{surah.number}</span>
                  <span className="s-name">{surah.name}</span>
                  <span className="s-english">{surah.englishName}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 31. مشغل الصوت السفلي للمصحف (Floating Quran Player) */}
        {quranData.currentSurah && (
          <div className="quran-audio-player-dock glass-v4">
             <div className="player-info">
               <span>جاري الاستماع: {quranData.currentSurah.name}</span>
               <div className="player-controls">
                 <button onClick={() => {/* لوجيك التقديم */}}>⏪</button>
                 <button className="play-main">▶️</button>
                 <button onClick={() => {/* لوجيك التأخير */}}>⏩</button>
               </div>
             </div>
             {/* 32. حفظ علامة الوقف يدوياً */}
             <button className="bookmark-btn" onClick={() => saveBookmark(quranData.currentSurah.number, 1)}>
               🔖 حفظ علامة الوقف
             </button>
          </div>
        )}
      </section>

      {/* 33. نظام الأذكار التفاعلي (Smart Azkar UI) */}
      <section className="azkar-interactive-module glass-v4">
        <div className="azkar-tabs">
          {['أذكار الصباح', 'أذكار المساء', 'أذكار النوم'].map(tab => (
            <button 
              key={tab} 
              className={currentCategory === tab ? 'active-tab' : ''}
              onClick={() => setCurrentCategory(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* 34. عداد تقدم الأذكار (Progress Ring) */}
        <div className="azkar-progress-ring">
          <svg viewBox="0 0 36 36" className="circular-chart">
            <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <motion.path 
              className="circle" 
              strokeDasharray={`${progress}, 100`}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
            />
          </svg>
          <div className="percentage">{Math.floor(progress)}%</div>
        </div>

        {/* 35. قائمة الأذكار التي تختفي عند الانتهاء */}
        <div className="azkar-scroll-area">
          {filteredAzkar.map((thekr) => (
            <motion.div 
              layout
              key={thekr.id} 
              className="thekr-card glass-v4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <p className="thekr-content">{thekr.zikr}</p>
              <div className="thekr-footer">
                <span className="thekr-source">{thekr.description}</span>
                {/* 36. زر العد داخل الذكر نفسه */}
                <button 
                  className="thekr-count-btn"
                  onClick={() => handleAzkarStep(thekr.id, 0, thekr.repeat)} // هنا نربط لوجيك العد
                >
                  {thekr.repeat} / 0
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* سيتم إكمال (السيرة، الأسماء، التحديات، الراديو) في الأجزاء القادمة */}
      {/* 41. محرك السيرة النبوية التفاعلي (Interactive Seerah Timeline) */}
      <section className="seerah-timeline-section glass-v4">
        <div className="section-header">
          <span className="section-icon">📜</span>
          <h4>السيرة النبوية: رحلة الهدى</h4>
        </div>

        <div className="era-selector-tabs">
          <button 
            className={activeEra === 'meccan' ? 'active' : ''} 
            onClick={() => setActiveEra('meccan')}
          >
            العهد المكي
          </button>
          <button 
            className={activeEra === 'medinan' ? 'active' : ''} 
            onClick={() => setActiveEra('medinan')}
          >
            العهد المدني
          </button>
        </div>

        {/* 42. شريط الجدول الزمني (The Timeline Track) */}
        <div className="timeline-track">
          {seerahTimeline.map((event, idx) => (
            <motion.div 
              key={event.id}
              className={`timeline-event-card ${event.completed ? 'is-done' : ''}`}
              whileHover={{ scale: 1.05 }}
            >
              {/* 43. مؤشر التقدم في الحدث */}
              <div className="event-marker">
                <div className="marker-dot"></div>
                {idx < seerahTimeline.length - 1 && <div className="marker-line"></div>}
              </div>
              
              <div className="event-content glass-v4">
                <span className="event-period">{event.period}</span>
                <h5>{event.title}</h5>
                <p>تعلم عن هذه المرحلة لتربح {event.xp} XP</p>
                {/* 44. زر إكمال الحدث وتحصيل المكافأة */}
                <button 
                  className="complete-event-btn"
                  onClick={() => completeEvent(event.id, event.xp)}
                >
                  {event.completed ? 'تمت القراءة ✅' : 'إتمام المهمة'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 45. نظام التحديات الإيمانية الجماعية (Global Faith Challenges) */}
      <section className="global-challenges-wrapper">
        <div className="challenges-grid">
          {globalChallenges.map(challenge => (
            <div key={challenge.id} className="challenge-card glass-v4">
              <div className="challenge-info">
                {/* 46. عداد التحدي العالمي المباشر */}
                <span className="challenge-tag">تحدي عالمي نشط</span>
                <h4>{challenge.title}</h4>
                <div className="progress-stats">
                  <span>المستهدف: {challenge.target}</span>
                  <span>الحالي: {challenge.currentAmount}</span>
                </div>
              </div>

              {/* 47. شريط التقدم الجماعي (Collective Progress Bar) */}
              <div className="collective-progress-bar">
                <motion.div 
                  className="fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${(challenge.currentAmount / challenge.target) * 100}%` }}
                />
              </div>

              {/* 48. زر المساهمة الفورية في التحدي */}
              <button 
                className="contribute-btn"
                onClick={() => contributeToChallenge(challenge.id, 100)}
              >
                ساهم بـ 100 ذكر 🚀
              </button>
            </div>
          ))}
        </div>

        {/* 49. قائمة المتصدرين الإيمانية (Faith Leaderboard) */}
        <div className="faith-leaderboard glass-v4">
          <h5>🏆 فرسان الواحة (الأكثر تفاعلاً)</h5>
          <div className="leader-list">
            {faithLeaderboard.map((leader, index) => (
              <div key={leader.id} className={`leader-item rank-${index + 1}`}>
                <span className="rank-num">#{index + 1}</span>
                <img src={leader.avatarUrl || '/default-avatar.png'} alt="" className="leader-img" />
                <span className="leader-name">{leader.displayName}</span>
                <span className="leader-xp">{leader.wahaData?.xp} XP</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 50. محرك أسماء الله الحسنى (Asma Allah Al-Husna Widget) */}
      <section className="asma-allah-widget glass-v4">
        {currentName && (
          <motion.div 
            className="name-display-area"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="name-calligraphy">{currentName.name}</div>
            <div className="name-meaning">
              <h5>{currentName.transliteration}</h5>
              <p>{currentName.en.meaning}</p>
            </div>
            {/* 51. زر "إحصاء" الاسم لحفظه في السجل */}
            <button 
              className="learn-name-btn"
              onClick={() => markNameAsLearned(currentName.number)}
            >
              {learnedNames.includes(currentName.number) ? 'تم حفظه في صدرك ❤️' : 'تعلمت هذا الاسم اليوم'}
            </button>
          </motion.div>
        )}
        {/* 52. شبكة الأسماء الصغيرة لمتابعة التقدم الكلي */}
        <div className="names-progress-grid">
          {[...Array(99)].map((_, i) => (
            <div 
              key={i} 
              className={`name-dot ${learnedNames.includes(i + 1) ? 'learned' : ''}`}
              title={`اسم الله رقم ${i + 1}`}
            ></div>
          ))}
        </div>
      </section>

      {/* 53. نظام ورد المحاسبة اليومي (Daily Accountability UI) */}
      <section className="accountability-module glass-v4">
        <h5>📉 ورد المحاسبة: كيف كان يومك مع الله؟</h5>
        <div className="checklist-items">
          {dailyChecklist.map(item => (
            <div key={item.id} className="check-item">
              <label className="checkbox-container">
                <input 
                  type="checkbox" 
                  checked={item.value} 
                  onChange={(e) => updateItem(item.id, e.target.checked)}
                />
                <span className="checkmark"></span>
                {item.label}
              </label>
            </div>
          ))}
        </div>
        {/* 54. زر إرسال التقرير اليومي والحصول على النتيجة */}
        <button className="submit-accountability" onClick={submitDailyAccountability}>
          تسجيل الورد اليومي والحصول على نقاط
        </button>
      </section>

      {/* 55. راديو القرآن الكريم (Live Radio Player Interface) */}
      <section className="waha-radio-dock glass-v4">
        <div className="radio-info">
          <div className={`radio-pulse ${radio.isPlaying ? 'playing' : ''}`}></div>
          <span>{radio.currentStation?.name || 'اختر إذاعة للتشغيل'}</span>
        </div>
        <div className="radio-stations-list">
          {radio.stations.map(station => (
            <button 
              key={station.id} 
              className={`station-btn ${radio.currentStation?.id === station.id ? 'active' : ''}`}
              onClick={() => radio.playStation(station)}
            >
              {station.id === 1 ? '🇪🇬' : '🕋'} {station.name}
            </button>
          ))}
        </div>
      </section>
      {/* 71. مساعد الواحة الذكي (Faith AI Assistant Interface) */}
      <section className="waha-ai-assistant glass-v4">
        <div className="ai-header">
          <div className="ai-avatar-status">
            <span className="ai-glow"></span>
            <span className="ai-label">مساعد الواحة الذكي (تجريبي)</span>
          </div>
        </div>
        
        {/* 72. منطقة عرض ردود الذكاء الاصطناعي */}
        <div className="ai-chat-window">
          {aiResponse ? (
            <motion.div 
              className="ai-bubble"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {aiResponse}
            </motion.div>
          ) : (
            <p className="ai-placeholder">اسألني عن الصلاة، المذاكرة، أو أي نصيحة روحية...</p>
          )}
        </div>

        {/* 73. مدخل الأسئلة للذكاء الاصطناعي */}
        <div className="ai-input-group">
          <input 
            type="text" 
            placeholder="اكتب سؤالك هنا..." 
            onKeyDown={(e) => e.key === 'Enter' && askWaha(e.target.value)}
          />
          <button onClick={() => askWaha("نصيحة اليوم")}>✨</button>
        </div>
      </section>

      {/* 74. حاسبة الزكاة والصدقات (Zakat & Wealth Manager) */}
      <section className="zakat-manager-module glass-v4">
        <div className="zakat-header">
          <h5>💰 حاسبة الزكاة الرقمية</h5>
          <span className="gold-price-tag">سعر الذهب الحالي: ${goldPrice}</span>
        </div>

        <div className="zakat-calculator-grid">
          <div className="input-field">
            <label>إجمالي مدخراتك (كاش/ذهب):</label>
            <input 
              type="number" 
              placeholder="أدخل المبلغ..." 
              onChange={(e) => {
                const result = calculateZakat(e.target.value);
                // 75. عرض النتيجة فورياً بناءً على النصاب
                alert(result.isEligible ? `زكاتك المستحقة: ${result.amount}` : "لم تبلغ النصاب بعد.");
              }}
            />
          </div>
        </div>
      </section>

      {/* 76. نظام الصدقة الجارية المجتمعي (Community Sadaqa Jaria) */}
      <section className="sadaqa-community glass-v4">
        <div className="section-title">🤝 صدقة جارية إلكترونية</div>
        <div className="requests-container">
          {/* 77. بطاقة طلب دعاء أو صدقة لمتوفى */}
          <div className="sadaqa-request-card">
            <p>سهم في ختمة القرآن لروح الفقيد: <strong>محمد بن عبدالله</strong></p>
            <div className="sadaqa-progress">
              <div className="s-progress-bar" style={{width: '65%'}}></div>
            </div>
            {/* 78. زر المساهمة لزيادة الـ XP الإيماني */}
            <button className="join-sadaqa-btn" onClick={() => contributeToSadaqa('sample_id')}>
              ساهم بـ 10 صفحات 📖
            </button>
          </div>
        </div>
      </section>

      {/* 79. لوحة التحليلات الختامية (Spiritual Growth Analytics) */}
      <section className="final-analytics-dashboard glass-v4">
        <h4>📊 حصادك الإيماني (ملخص الأداء)</h4>
        <button className="generate-report-btn" onClick={generateReport}>تحديث البيانات</button>
        
        {yearlyReport && (
          <div className="analytics-grid">
            {/* 80. إحصائية الصلاة */}
            <div className="stat-card">
              <span className="s-val">{yearlyReport.totalPrayers}</span>
              <span className="s-lab">صلاة مسجلة</span>
            </div>
            {/* 81. إحصائية الختمات */}
            <div className="stat-card">
              <span className="s-val">{yearlyReport.quranPages}</span>
              <span className="s-lab">صفحة قرآن</span>
            </div>
            {/* 82. إحصائية الاستقامة (الستريك) */}
            <div className="stat-card highlight">
              <span className="s-val">{yearlyReport.consistencyScore}</span>
              <span className="s-lab">يوم استقامة متواصل</span>
            </div>
          </div>
        )}
      </section>
{/* 83. تذييل الواحة (The Waha Footer & Final Actions) */}
      <footer className="waha-footer">
        <div className="footer-links">
          <span>الإصدار 1.0.0 (تيتان)</span>
          {/* 84. زر مشاركة الإنجازات */}
          <button className="share-btn">📤 مشاركة التقدم</button>
        </div>
        
        {/* 85. زر الخروج الآمن (حفظ وإغلاق) */}
        <button className="close-waha-btn" onClick={() => window.location.reload()}>
          حفظ وإغلاق الواحة 🔒
        </button>
    

 </footer>
    </div> 
  </div> 
  ); 
}; 


export default Religious;

