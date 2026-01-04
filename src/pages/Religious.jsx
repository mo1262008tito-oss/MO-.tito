import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, BookOpen, Radio, Compass, X, CheckCircle, 
  ListTodo, Play, Pause, RefreshCw, 
  Calculator, MapPin, Volume2, Trophy, Sparkles, 
  Activity, Clock, Heart, Plus, Trash2, Users, Star, Award, Book, MessageCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// استيراد أدوات Firebase (تأكد من إعداد ملف firebase.js في مشروعك)
import { db, rtdb } from '../firebase'; 
import { doc, getDoc, setDoc, updateDoc, collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { ref, onValue, increment, update } from "firebase/database";

import './Religious.css';

const Religious = ({ user }) => {
  const navigate = useNavigate();
  const audioRef = useRef(null);

  // --- 1. الحالة (State) - القديم + الجديد ---
  const [tasbih, setTasbih] = useState(() => Number(localStorage.getItem('n_t')) || 0);
  const [xp, setXp] = useState(() => Number(localStorage.getItem('n_x')) || 0);
  const [globalTasbih, setGlobalTasbih] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [nextPrayer, setNextPrayer] = useState({ name: "", time: "" });
  const [location, setLocation] = useState({ city: "جاري التحديد...", country: "" });
  const [dailyAyah, setDailyAyah] = useState({ text: "ألا بذكر الله تطمئن القلوب", ref: "سورة الرعد" });
  const [activePortal, setActivePortal] = useState(null);
  const [station, setStation] = useState({ n: "إذاعة القاهرة", u: "https://secure-stream.radio.net/radio/8273/stream.mp3" });
  const [notification, setNotification] = useState("");
  const [userHifz, setUserHifz] = useState(() => JSON.parse(localStorage.getItem('u_hifz')) || { surah: "الفاتحة", ayah: 1 });

  // --- ميزة إضافة عبادة جديدة (Todo List) ---
  const [newTask, setNewTask] = useState("");
  const [worshipTodo, setWorshipTodo] = useState(() => JSON.parse(localStorage.getItem('w_todo')) || [
    { id: 1, task: "قراءة ورد القرآن", done: false, points: 500 },
    { id: 2, task: "أذكار الصباح", done: false, points: 200 },
    { id: 3, task: "أذكار المساء", done: false, points: 200 },
    { id: 4, task: "صلاة الضحى", done: false, points: 300 },
    { id: 5, task: "الاستغفار (100 مرة)", done: false, points: 150 },
  ]);

  // --- 2. منطق المزامنة والإشعارات (التحديثات الحديثة) ---
  useEffect(() => {
    // 1. تحديث عداد الأمة العالمي من Realtime Database
    const globalRef = ref(rtdb, 'globalStats/tasbihCount');
    onValue(globalRef, (snapshot) => {
      setGlobalTasbih(snapshot.val() || 0);
    });

    // 2. جلب لوحة الشرف لحظياً من Firestore
    const q = query(collection(db, "users"), orderBy("xp", "desc"), limit(3));
    const unsubscribeLeaderboard = onSnapshot(q, (snapshot) => {
      const users = [];
      snapshot.forEach((doc) => users.push(doc.data()));
      setLeaderboard(users);
    });

    // 3. نظام إشعارات "ذكر الله" التلقائي (كل 10 دقائق)
    const messages = ["صلِّ على النبي ﷺ", "سبحان الله وبحمده", "استغفر الله العظيم", "لا حول ولا قوة إلا بالله"];
    const notifyInterval = setInterval(() => {
      setNotification(messages[Math.floor(Math.random() * messages.length)]);
      setTimeout(() => setNotification(""), 6000);
    }, 600000);

    return () => { unsubscribeLeaderboard(); clearInterval(notifyInterval); };
  }, []);

  // --- 3. منطق جلب آية عشوائية والطقس والموقع (القديم) ---
  useEffect(() => {
    fetch("https://api.alquran.cloud/v1/ayah/random")
      .then(res => res.json())
      .then(data => setDailyAyah({ text: data.data.text, ref: data.data.surah.name + " : " + data.data.numberInSurah }))
      .catch(() => setDailyAyah({ text: "ألا بذكر الله تطمئن القلوب", ref: "سورة الرعد" }));

    const getPrayers = async (lat, lng) => {
      try {
        const res = await fetch(`https://api.aladhan.com/v1/timingsByAddress?address=${lat},${lng}&method=5`);
        const data = await res.json();
        const timings = data.data.timings;
        setPrayerTimes(timings);
        setLocation({ city: "موقعك الحالي", country: data.data.meta.timezone });
        calculateNextPrayer(timings);
      } catch (err) { console.error("خطأ في الاتصال"); }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => getPrayers(pos.coords.latitude, pos.coords.longitude),
        () => {
          fetch(`https://api.aladhan.com/v1/timingsByCity?city=Cairo&country=Egypt&method=5`)
            .then(res => res.json())
            .then(data => {
              setPrayerTimes(data.data.timings);
              calculateNextPrayer(data.data.timings);
            });
        }
      );
    }
  }, []);

  const calculateNextPrayer = (timings) => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const prayers = [
      { name: "الفجر", time: timings.Fajr },
      { name: "الظهر", time: timings.Dhuhr },
      { name: "العصر", time: timings.Asr },
      { name: "المغرب", time: timings.Maghrib },
      { name: "العشاء", time: timings.Isha }
    ];
    const upcoming = prayers.find(p => {
      const [h, m] = p.time.split(':');
      return (parseInt(h) * 60 + parseInt(m)) > currentMinutes;
    }) || prayers[0];
    setNextPrayer(upcoming);
  };

  // --- 4. وظائف التحكم (التفاعل) ---
  const handleTasbih = () => {
    setTasbih(prev => prev + 1);
    setXp(prev => prev + 10);
    // تحديث العداد العالمي في Firebase
    update(ref(rtdb, 'globalStats'), { tasbihCount: increment(1) });
    if (navigator.vibrate) navigator.vibrate(50);
  };

  const getDhikrText = () => {
    const cycle = tasbih % 99;
    if (cycle < 33) return "سُبْحَانَ اللَّهِ";
    if (cycle < 66) return "الْحَمْدُ لِلَّهِ";
    return "اللَّهُ أَكْبَرُ";
  };

  const addNewWorship = () => {
    if (!newTask.trim()) return;
    const newEntry = { id: Date.now(), task: newTask, done: false, points: 150 };
    setWorshipTodo([...worshipTodo, newEntry]);
    setNewTask("");
  };

  const toggleTodo = (id, points) => {
    setWorshipTodo(prev => prev.map(t => (t.id === id && !t.done) ? (setXp(x => x + points), { ...t, done: true }) : t));
  };

  const handleHifzChange = (field, value) => {
    const updated = { ...userHifz, [field]: value };
    setUserHifz(updated);
    localStorage.setItem('u_hifz', JSON.stringify(updated));
  };

  // حفظ البيانات في LocalStorage
  useEffect(() => {
    localStorage.setItem('n_t', tasbih);
    localStorage.setItem('n_x', xp);
    localStorage.setItem('w_todo', JSON.stringify(worshipTodo));
  }, [tasbih, xp, worshipTodo]);

  return (
    <div className="rel-master-root">
      {/* إشعار عائم (Spiritual Notification) */}
      <AnimatePresence>
        {notification && (
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 30 }} exit={{ opacity: 0 }} className="spiritual-toast">
            <Sparkles size={18} color="#00f2ff" /> <span>{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="rel-nav">
        <button className="rel-back" onClick={() => navigate(-1)}><ArrowRight /> <span>العودة</span></button>
        <div className="rel-xp-status">
          <Trophy color="#f1c40f" size={20} />
          <div className="xp-text">
            <span>مقامك: {xp < 5000 ? "عابد" : xp < 15000 ? "قانت" : "صديق نوري"}</span>
            <div className="xp-mini-bar"><div className="fill" style={{ width: `${Math.min((xp / 20000) * 100, 100)}%` }}></div></div>
          </div>
        </div>
      </nav>

      <div className="rel-grid-container">
        {/* العمود الأيسر: لوحة الشرف والمواقيت */}
        <aside className="rel-col">
          <div className="rel-card leaderboard-card">
            <div className="card-header"><Award color="#00f2ff" /> <h3>لوحة شرف القانتين</h3></div>
            <div className="leader-list">
              {leaderboard.length > 0 ? leaderboard.map((u, i) => (
                <div key={i} className="leader-item">
                  <div className="rank">{i + 1}</div>
                  <div className="u-info">
                    <p>{u.name || "مستخدم مجهول"}</p>
                    <small>{u.xp} نقطة نور</small>
                  </div>
                </div>
              )) : <p className="loading-text">جاري التحميل...</p>}
            </div>
          </div>

          <div className="rel-card prayer-live">
            <div className="card-header"><Clock /> <h3>مواقيت الصلاة</h3></div>
            <div className="next-prayer-box">
              <small>الصلاة القادمة: {nextPrayer.name}</small>
              <h2 className="glow-text">{nextPrayer.time}</h2>
            </div>
            {prayerTimes && (
              <div className="prayer-list">
                {[
                  { id: 'Fajr', n: 'الفجر' },
                  { id: 'Dhuhr', n: 'الظهر' },
                  { id: 'Asr', n: 'العصر' },
                  { id: 'Maghrib', n: 'المغرب' },
                  { id: 'Isha', n: 'العشاء' }
                ].map(p => (
                  <div key={p.id} className={`prayer-item ${nextPrayer.name === p.n ? 'active-p' : ''}`}>
                    <span>{p.n}</span>
                    <span className="time">{prayerTimes[p.id]}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="location-tag"><MapPin size={12} /> {location.city}</div>
          </div>
        </aside>

        {/* المنتصف: عداد الأمة والسبحة */}
        <main className="rel-col-main">
          <motion.div className="global-counter-nexus" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="g-icon-wrap"><Users color="#00f2ff" /></div>
            <div className="g-data">
               <small>إجمالي تسبيحات المجتمع اليوم</small>
               <h2 className="glow-number">{globalTasbih.toLocaleString()}</h2>
            </div>
          </motion.div>

          <div className="tasbih-hub">
            <motion.div whileTap={{ scale: 0.9 }} className="main-bead" onClick={handleTasbih}>
              <div className="bead-content">
                <span className="count">{tasbih}</span>
                <span className="label">{getDhikrText()}</span>
              </div>
            </motion.div>
            <div className="bead-actions">
              <button onClick={() => setTasbih(0)}><RefreshCw size={14} /> صفر</button>
              <button onClick={() => alert("اتجاه القبلة: 135° جنوب شرق")}> <Compass size={14} /> القبلة</button>
            </div>
          </div>

          <div className="daily-inspiration">
            <Sparkles className="icon-gold" />
            <p>"{dailyAyah.text}"</p>
            <small>{dailyAyah.ref}</small>
          </div>
        </main>

        {/* العمود الأيمن: التودو ليست + متابعة الحفظ */}
        <aside className="rel-col">
          <div className="rel-card hifz-card">
             <div className="card-header"><Book color="#7000ff" /> <h3>متابعة الحفظ</h3></div>
             <div className="hifz-grid">
                <div className="hifz-input">
                   <label>آخر سورة</label>
                   <input type="text" value={userHifz.surah} onChange={(e) => handleHifzChange('surah', e.target.value)} />
                </div>
                <div className="hifz-input">
                   <label>آخر آية</label>
                   <input type="number" value={userHifz.ayah} onChange={(e) => handleHifzChange('ayah', e.target.value)} />
                </div>
             </div>
             <p className="hifz-note">سيتم مزامنة حفظك مع حسابك الشخصي</p>
          </div>

          <div className="rel-card todo-card">
            <div className="card-header"><ListTodo /> <h3>أورادي الخاصة</h3></div>
            <div className="add-task-box">
               <input type="text" placeholder="أضف عبادة.." value={newTask} onChange={(e) => setNewTask(e.target.value)} />
               <button onClick={addNewWorship}><Plus size={18}/></button>
            </div>
            <div className="todo-list custom-scroll">
              {worshipTodo.map(item => (
                <div key={item.id} className={`todo-item ${item.done ? 'done' : ''}`} onClick={() => toggleTodo(item.id, item.points)}>
                  <div className={`circle-check ${item.done ? 'checked' : ''}`}>
                    {item.done && <CheckCircle size={14} />}
                  </div>
                  <div className="todo-text">
                    <p>{item.task}</p>
                    <small>+{item.points} نقطة</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <footer className="rel-footer-nav">
        <button onClick={() => setActivePortal('quran')}><BookOpen /> المصحف</button>
        <button onClick={() => setActivePortal('azkar')}><Compass /> حصن المسلم</button>
        <button onClick={() => setActivePortal('khatma')}><Star /> الختمة</button>
        <button onClick={() => setActivePortal('qa')}><MessageCircle /> سؤال وجواب</button>
      </footer>
{/* بوابات الخدمات المتطورة */}
      <AnimatePresence>
        {activePortal && (
          <motion.div 
            className="portal-overlay" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={() => setActivePortal(null)} // إغلاق عند الضغط خارج المحتوى
          >
            <motion.div 
              className="portal-content" 
              initial={{ y: "100%" }} 
              animate={{ y: 0 }} 
              exit={{ y: "100%" }}
              onClick={(e) => e.stopPropagation()} // منع الإغلاق عند الضغط داخل النافذة
            >
              <div className="portal-header">
                <h3>
                  {activePortal === 'quran' && "المصحف الإلكتروني الكامل"}
                  {activePortal === 'khatma' && "جامع علوم القرآن والتفاسير"}
                  {activePortal === 'azkar' && "حصن المسلم والأذكار"}
                  {activePortal === 'qa' && "أسئلة وأجوبة في العقيدة والمنهج"}
                </h3>
                <button className="close-portal" onClick={() => setActivePortal(null)}><X /></button>
              </div>

              <div className="portal-body">
                <iframe 
                  src={
                    activePortal === 'quran' ? "https://quran.com" : 
                    activePortal === 'khatma' ? "https://tafsir.app/" : 
                    activePortal === 'qa' ? "https://islamqa.info/ar/categories/very-important/1/topics/1" : 
                    "https://www.azkary.com"
                  } 
                  title="islam-service-frame" 
                  loading="lazy"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

        </div>

  );

};



export default Religious;
