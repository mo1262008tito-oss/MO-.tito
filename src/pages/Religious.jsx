import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, BookOpen, Radio, Compass, X, CheckCircle, 
  ListTodo, Play, Pause, RefreshCw, 
  Calculator, MapPin, Volume2, Trophy, Sparkles, 
  Activity, Clock, Heart
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
  
  const [worshipTodo, setWorshipTodo] = useState(() => JSON.parse(localStorage.getItem('w_todo')) || [
    { id: 1, task: "قراءة ورد القرآن", done: false, points: 500 },
    { id: 2, task: "أذكار الصباح", done: false, points: 200 },
    { id: 3, task: "أذكار المساء", done: false, points: 200 },
    { id: 4, task: "صلاة الضحى", done: false, points: 300 },
    { id: 5, task: "الاستغفار (100 مرة)", done: false, points: 150 },
  ]);

  const [activePortal, setActivePortal] = useState(null);
  const [station, setStation] = useState({ n: "إذاعة القاهرة", u: "https://secure-stream.radio.net/radio/8273/stream.mp3" });

  // --- 2. منطق تحديد الموقع ومواقيت الصلاة ---
  useEffect(() => {
    const getPrayers = async (lat, lng) => {
      try {
        const res = await fetch(`https://api.aladhan.com/v1/timingsByAddress?address=${lat},${lng}&method=5`);
        const data = await res.json();
        const timings = data.data.timings;
        setPrayerTimes(timings);
        setLocation({ city: "موقعك الحالي", country: data.data.meta.timezone });
        calculateNextPrayer(timings);
      } catch (err) {
        console.error("خطأ في الاتصال بالمؤذن الإلكتروني");
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => getPrayers(pos.coords.latitude, pos.coords.longitude),
        () => {
          // حالة احتياطية للقاهرة إذا رفض المستخدم الموقع
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

  // --- 3. التخزين المحلي والرسائل ---
  useEffect(() => {
    localStorage.setItem('n_t', tasbih);
    localStorage.setItem('n_x', xp);
    localStorage.setItem('w_todo', JSON.stringify(worshipTodo));
  }, [tasbih, xp, worshipTodo]);

  const toggleTodo = (id, points) => {
    const updated = worshipTodo.map(t => {
      if (t.id === id && !t.done) {
        setXp(prev => prev + points);
        return { ...t, done: true };
      }
      return t;
    });
    setWorshipTodo(updated);
  };

  return (
    <div className="rel-master-root">
      {/* الشريط العلوي */}
      <nav className="rel-nav">
        <button className="rel-back" onClick={() => navigate(-1)}><ArrowRight /> <span>العودة للمنصة</span></button>
        <div className="rel-xp-status">
          <Trophy color="#f1c40f" size={20} />
          <div className="xp-text">
            <span>مقامك: {xp < 5000 ? "عابد" : xp < 15000 ? "قانت" : "صديق نوري"}</span>
            <div className="xp-mini-bar"><div className="fill" style={{ width: `${Math.min((xp / 20000) * 100, 100)}%` }}></div></div>
          </div>
        </div>
      </nav>

      <div className="rel-grid-container">
        {/* العمود الأيسر: المواقيت والراديو */}
        <aside className="rel-col">
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

          <div className="rel-card">
            <div className="card-header"><Radio /> <h3>الإذاعات الحية</h3></div>
            <select className="radio-select" onChange={(e) => setStation({ n: e.target.selectedOptions[0].text, u: e.target.value })}>
              <option value="https://secure-stream.radio.net/radio/8273/stream.mp3">إذاعة القاهرة</option>
              <option value="https://backup.qurango.net/radio/tarabeelsi">عبد الباسط عبد الصمد</option>
              <option value="https://backup.qurango.net/radio/maher_al_muaiqly">ماهر المعيقلي</option>
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

        {/* المنتصف: السبحة */}
        <main className="rel-col-main">
          <div className="tasbih-hub">
            <motion.div 
              whileTap={{ scale: 0.9 }} 
              className="main-bead" 
              onClick={() => { setTasbih(t => t + 1); setXp(x => x + 10); }}
            >
              <div className="bead-content">
                <span className="count">{tasbih}</span>
                <span className="label">سُبْحَانَ اللَّهِ</span>
              </div>
            </motion.div>
            <div className="bead-actions">
              <button onClick={() => setTasbih(0)}><RefreshCw size={14} /> إعادة</button>
              <button onClick={() => alert("سيتم التنبيه عند كل 33")}> <Volume2 size={14} /> اهتزاز</button>
            </div>
          </div>
          <div className="daily-inspiration">
            <Sparkles className="icon-gold" />
            <p>"ألا بذكر الله تطمئن القلوب"</p>
          </div>
        </main>

        {/* العمود الأيمن: المهام والإحصائيات */}
        <aside className="rel-col">
          <div className="rel-card todo-card">
            <div className="card-header"><ListTodo /> <h3>ورد اليوم</h3></div>
            <div className="todo-list">
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
          <div className="rel-card stats-card">
            <div className="card-header"><Activity /> <h3>رصيد الإيمان</h3></div>
            <div className="stat-grid">
              <div className="stat-box"><h4>{tasbih}</h4><p>تسبيحة</p></div>
              <div className="stat-box"><h4>{xp}</h4><p>نقطة نور</p></div>
            </div>
          </div>
        </aside>
      </div>

      {/* شريط الخدمات السفلي */}
      <footer className="rel-footer-nav">
        <button onClick={() => setActivePortal('quran')}><BookOpen /> المصحف</button>
        <button onClick={() => setActivePortal('azkar')}><Compass /> الأذكار</button>
        <button onClick={() => setActivePortal('ahadith')}><Heart /> السُّنة</button>
        <button onClick={() => setActivePortal('zakat')}><Calculator /> الزكاة</button>
      </footer>

      {/* بوابات الخدمات */}
      <AnimatePresence>
        {activePortal && (
          <motion.div className="portal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="portal-content" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}>
              <div className="portal-header">
                <h3>{activePortal === 'quran' ? "المصحف" : activePortal === 'azkar' ? "حصن المسلم" : "صحيح السنة"}</h3>
                <button onClick={() => setActivePortal(null)}><X /></button>
              </div>
              <iframe 
                src={activePortal === 'quran' ? "https://quran.com" : activePortal === 'azkar' ? "https://www.azkary.com" : "https://sunnah.com"} 
                title="islam-service" 
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Religious;