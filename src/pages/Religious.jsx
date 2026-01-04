import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, BookOpen, Radio, Compass, X, CheckCircle, 
  ListTodo, Play, Pause, RefreshCw, 
  Calculator, MapPin, Volume2, Trophy, Sparkles, 
  Activity, Clock, Heart, Plus, Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Religious.css';

const Religious = () => {
  const navigate = useNavigate();
  const audioRef = useRef(null);

  // --- 1. الحالة (State) ---
  const [tasbih, setTasbih] = useState(() => Number(localStorage.getItem('n_t')) || 0);
  const [xp, setXp] = useState(() => Number(localStorage.getItem('n_x')) || 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [nextPrayer, setNextPrayer] = useState({ name: "", time: "" });
  const [location, setLocation] = useState({ city: "جاري التحديد...", country: "" });
  const [dailyAyah, setDailyAyah] = useState({ text: "جاري تحميل آية اليوم...", ref: "" });
  const [activePortal, setActivePortal] = useState(null);
  const [station, setStation] = useState({ n: "إذاعة القاهرة", u: "https://secure-stream.radio.net/radio/8273/stream.mp3" });

  // --- ميزة إضافة عبادة جديدة ---
  const [newTask, setNewTask] = useState("");
  const [worshipTodo, setWorshipTodo] = useState(() => JSON.parse(localStorage.getItem('w_todo')) || [
    { id: 1, task: "قراءة ورد القرآن", done: false, points: 500 },
    { id: 2, task: "أذكار الصباح", done: false, points: 200 },
  ]);

  // --- 2. منطق جلب آية عشوائية ---
  useEffect(() => {
    fetch("https://api.alquran.cloud/v1/ayah/random")
      .then(res => res.json())
      .then(data => setDailyAyah({ text: data.data.text, ref: data.data.surah.name + " : " + data.data.numberInSurah }))
      .catch(() => setDailyAyah({ text: "ألا بذكر الله تطمئن القلوب", ref: "سورة الرعد" }));
  }, []);

  // --- 3. منطق تحديد الموقع ومواقيت الصلاة ---
  useEffect(() => {
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
            .then(data => setPrayerTimes(data.data.timings));
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

  // --- 4. وظائف التحكم في المهام والتسبيح ---
  const handleTasbih = () => {
    setTasbih(prev => prev + 1);
    setXp(prev => prev + 5);
    if (navigator.vibrate) navigator.vibrate(50); // اهتزاز خفيف
  };

  const getDhikrText = () => {
    if (tasbih < 33) return "سُبْحَانَ اللَّهِ";
    if (tasbih < 66) return "الْحَمْدُ لِلَّهِ";
    if (tasbih < 99) return "اللَّهُ أَكْبَرُ";
    return "لَا إِلَهَ إِلَّا اللَّهُ";
  };

  const addNewWorship = () => {
    if (!newTask.trim()) return;
    const newEntry = { id: Date.now(), task: newTask, done: false, points: 100 };
    setWorshipTodo([...worshipTodo, newEntry]);
    setNewTask("");
  };

  const toggleTodo = (id, points) => {
    setWorshipTodo(prev => prev.map(t => (t.id === id && !t.done) ? (setXp(x => x + points), { ...t, done: true }) : t));
  };

  useEffect(() => {
    localStorage.setItem('n_t', tasbih);
    localStorage.setItem('n_x', xp);
    localStorage.setItem('w_todo', JSON.stringify(worshipTodo));
  }, [tasbih, xp, worshipTodo]);

  return (
    <div className="rel-master-root">
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
        {/* العمود الأيسر */}
        <aside className="rel-col">
          <div className="rel-card prayer-live">
            <div className="card-header"><Clock /> <h3>مواقيت الصلاة</h3></div>
            <div className="next-prayer-box">
              <small>القادمة: {nextPrayer.name}</small>
              <h2 className="glow-text">{nextPrayer.time}</h2>
            </div>
            {prayerTimes && (
              <div className="prayer-list">
                {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map(id => (
                  <div key={id} className={`prayer-item ${nextPrayer.name === id ? 'active-p' : ''}`}>
                    <span>{id === 'Fajr' ? 'الفجر' : id === 'Dhuhr' ? 'الظهر' : id === 'Asr' ? 'العصر' : id === 'Maghrib' ? 'المغرب' : 'العشاء'}</span>
                    <span className="time">{prayerTimes[id]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rel-card">
            <div className="card-header"><Radio /> <h3>الإذاعة</h3></div>
            <select className="radio-select" onChange={(e) => setStation({ n: e.target.selectedOptions[0].text, u: e.target.value })}>
              <option value="https://secure-stream.radio.net/radio/8273/stream.mp3">إذاعة القاهرة</option>
              <option value="https://backup.qurango.net/radio/tarabeelsi">عبد الباسط</option>
            </select>
            <div className="player-controls">
              <button className="play-btn" onClick={() => isPlaying ? audioRef.current.pause() : audioRef.current.play()}>
                {isPlaying ? <Pause /> : <Play />}
              </button>
              <span className="station-name">{station.n}</span>
            </div>
            <audio ref={audioRef} src={station.u} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} />
          </div>
        </aside>

        {/* المنتصف: السبحة الذكية */}
        <main className="rel-col-main">
          <div className="tasbih-hub">
            <motion.div whileTap={{ scale: 0.95 }} className="main-bead" onClick={handleTasbih}>
              <div className="bead-content">
                <span className="count">{tasbih}</span>
                <span className="label">{getDhikrText()}</span>
              </div>
            </motion.div>
            <div className="bead-actions">
              <button onClick={() => setTasbih(0)}><RefreshCw size={14} /> صفر</button>
              <button onClick={() => alert("البوصلة: اتجاه القبلة 135 درجة جنوب شرق")}> <Compass size={14} /> القبلة</button>
            </div>
          </div>
          <div className="daily-inspiration">
            <Sparkles className="icon-gold" />
            <p>"{dailyAyah.text}"</p>
            <small>{dailyAyah.ref}</small>
          </div>
        </main>

        {/* العمود الأيمن: التودو ليست المتطورة */}
        <aside className="rel-col">
          <div className="rel-card todo-card">
            <div className="card-header"><ListTodo /> <h3>أورادي الخاصة</h3></div>
            
            <div className="add-task-box">
               <input type="text" placeholder="أضف عبادة جديدة.." value={newTask} onChange={(e) => setNewTask(e.target.value)} />
               <button onClick={addNewWorship}><Plus size={18}/></button>
            </div>

            <div className="todo-list custom-scroll">
              {worshipTodo.map(item => (
                <div key={item.id} className={`todo-item ${item.done ? 'done' : ''}`} onClick={() => toggleTodo(item.id, item.points)}>
                  <div className={`circle-check ${item.done ? 'checked' : ''}`}>
                    {item.done && <CheckCircle size={14} />}
                  </div>
                  <p>{item.task}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <footer className="rel-footer-nav">
        <button onClick={() => setActivePortal('quran')}><BookOpen /> المصحف</button>
        <button onClick={() => setActivePortal('azkar')}><Compass /> الأذكار</button>
        <button onClick={() => setActivePortal('zakat')}><Calculator /> الزكاة</button>
      </footer>

      <AnimatePresence>
        {activePortal && (
          <motion.div className="portal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="portal-content" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}>
              <div className="portal-header">
                <h3>{activePortal === 'quran' ? "المصحف" : "الخدمات الإسلامية"}</h3>
                <button onClick={() => setActivePortal(null)}><X /></button>
              </div>
              <iframe src={activePortal === 'quran' ? "https://quran.com" : "https://www.azkary.com"} title="islam-service" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Religious;
