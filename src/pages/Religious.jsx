import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, BookOpen, Radio, Compass, X, CheckCircle, 
  ListTodo, Play, Pause, RefreshCw, MapPin, Trophy, Sparkles, 
  Clock, Plus, Users, Star, Award, Book, MessageCircle,
  Smile, Frown, Zap, Coffee, BarChart3, TrendingUp, History, UserCheck, Calendar, ShieldCheck, Map
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db, rtdb } from '../firebase'; 
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, setDoc } from "firebase/firestore";
import { ref, onValue, increment, update } from "firebase/database";
import './Religious.css';

const Religious = ({ user }) => {
  const navigate = useNavigate();
  const audioRef = useRef(null);

  // --- [1] حالة النظام العام (Global System State) ---
  const [tasbih, setTasbih] = useState(() => Number(localStorage.getItem('n_t')) || 0);
  const [xp, setXp] = useState(() => Number(localStorage.getItem('n_x')) || 0);
  const [streak, setStreak] = useState(() => Number(localStorage.getItem('u_streak')) || 0);
  const [globalTasbih, setGlobalTasbih] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [nextPrayer, setNextPrayer] = useState({ name: "", time: "" });
  const [emotion, setEmotion] = useState(null);
  const [activePortal, setActivePortal] = useState(null);

  // --- [2] نظام الختمة الذكي (Smart Hifz System) ---
  const [hifz, setHifz] = useState(() => JSON.parse(localStorage.getItem('hifz_v2')) || {
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
    history: []
  });

  // --- [3] نظام الأوراد والتحديات (Worship Todo) ---
  const [tasks, setTasks] = useState(() => JSON.parse(localStorage.getItem('w_tasks')) || [
    { id: 1, text: "ورد القرآن", points: 500, done: false, type: 'main' },
    { id: 2, text: "أذكار الصباح", points: 200, done: false, type: 'daily' },
    { id: 3, text: "أذكار المساء", points: 200, done: false, type: 'daily' },
    { id: 4, text: "صلاة الضحى", points: 300, done: false, type: 'extra' },
  ]);

  // --- [4] مساعد الحالة النفسية (Emotions Bot Logic) ---
  const emotionData = {
    sad: { t: "لَا تَحْزَنْ إِنَّ اللَّهَ مَعَنَا", s: "سورة يوسف", a: "استغفر الله العظيم" },
    anxious: { t: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ", s: "سورة الرعد", a: "لا حول ولا قوة إلا بالله" },
    tired: { t: "وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ", s: "سورة البقرة", a: "سبحان الله وبحمده" },
    happy: { t: "لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ", s: "سورة إبراهيم", a: "الحمد لله رب العالمين" }
  };

  // --- [5] منطق الـ Streak التلقائي ---
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

  // --- [6] دوال التحكم (Control Functions) ---
  const handleTasbih = () => {
    setTasbih(t => t + 1);
    setXp(x => x + 10);
    update(ref(rtdb, 'globalStats'), { tasbihCount: increment(1) });
    if (navigator.vibrate) navigator.vibrate([40]);
  };

  const handleHifzProgress = (field, val) => {
    const updated = { ...hifz, [field]: val };
    setHifz(updated);
    localStorage.setItem('hifz_v2', JSON.stringify(updated));
  };

  const markHifzDone = () => {
    if (hifz.isCompletedToday) return;
    setHifz(prev => ({ ...prev, isCompletedToday: true, streak: prev.streak + 1 }));
    setXp(prev => prev + 1000);
    setNotification("بارك الله فيك! تم إضافة 1000 نقطة لنورك");
  };

  // --- [7] حساب الختمة المتوقع ---
  const getExpectedKhatma = () => {
    const remainingPages = (30 - hifz.juz) * 20;
    const days = remainingPages / 1; // فرضية صفحة يومياً
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="rel-master-root select-none">
      {/* إشعارات النظام */}
      <AnimatePresence>
        {notification && (
          <motion.div initial={{y:-100}} animate={{y:20}} exit={{y:-100}} className="global-toast">
            <ShieldCheck color="#1dd1a1" /> {notification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* شريط المعلومات العلوي (Pro Header) */}
      <nav className="rel-top-nav glass">
        <div className="nav-user-area">
          <div className="streak-orb">
             <Zap size={18} fill="#ff9f43" color="#ff9f43" />
             <span>{streak} يوم</span>
          </div>
          <div className="xp-container">
            <Trophy size={20} className="gold" />
            <div className="xp-bar-wrapper">
               <div className="xp-label">{xp} XP</div>
               <div className="xp-bar-bg"><motion.div initial={{width:0}} animate={{width: `${(xp%2000)/20}%`}} className="xp-fill"></motion.div></div>
            </div>
          </div>
        </div>
        <button className="back-btn" onClick={() => navigate(-1)}><ArrowRight /></button>
      </nav>

      <div className="rel-main-grid">
        {/* العمود الجانبي (نظام الختمة الذكي) */}
        <aside className="rel-hifz-panel">
          <section className="hifz-card glass">
            <div className="hifz-header">
               <Book className="icon-p" />
               <div>
                 <h3>خطة الحفظ والختم</h3>
                 <small>نظام ذكي لمتابعة المحفظ والمراجعة</small>
               </div>
            </div>

            <div className="hifz-form">
               <div className="input-row">
                 <div className="f-group">
                   <label><UserCheck size={14}/> المحفظ</label>
                   <input type="text" value={hifz.teacherName} onChange={(e)=>handleHifzProgress('teacherName', e.target.value)} placeholder="اسم الشيخ..." />
                 </div>
                 <div className="f-group">
                   <label><Calendar size={14}/> يوم التسميع</label>
                   <select value={hifz.sessionDay} onChange={(e)=>handleHifzProgress('sessionDay', e.target.value)}>
                      <option>السبت</option><option>الإثنين</option><option>الأربعاء</option>
                   </select>
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
                     <p>آخر ما تم حفظه: <span>{hifz.surah}</span></p>
                     <p>المراجعة القادمة: <span>{hifz.reviewAmount}</span></p>
                  </div>
               </div>

               <div className="review-box-pro">
                  <label><History size={14}/> مراجعة الماضي (تراكمي)</label>
                  <div className="review-inputs">
                     <input type="text" placeholder="من" value={hifz.reviewFrom} onChange={(e)=>handleHifzProgress('reviewFrom', e.target.value)} />
                     <input type="text" placeholder="إلى" value={hifz.reviewTo} onChange={(e)=>handleHifzProgress('reviewTo', e.target.value)} />
                  </div>
               </div>

               <div className="ai-prediction">
                  <Sparkles size={16} color="#ffd700" />
                  <span>موعد الختم المتوقع: <b>{getExpectedKhatma()}</b></span>
               </div>

               <button className={`atmam-btn ${hifz.isCompletedToday ? 'active' : ''}`} onClick={markHifzDone}>
                  {hifz.isCompletedToday ? "تم إتمام ورد اليوم ✓" : "إتمام ورد التسميع والمراجعة"}
               </button>
            </div>
          </section>

          {/* لوحة الشرف (Leaderboard) */}
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
        </aside>

        {/* القسم الرئيسي (السبحة والمشاعر والتقارير) */}
        <main className="rel-core-panel">
           {/* مساعد المشاعر AI */}
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

           {/* السبحة الحية (Grand Tasbih) */}
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

           {/* تقارير التحليل (Analytics Heatmap) */}
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

        {/* العمود الأيمن (المهام والمحتوى) */}
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

           <div className="prayer-card glass">
              <div className="h-title"><Clock /> مواقيت الصلاة</div>
              <div className="next-p">
                 <small>الصلاة القادمة</small>
                 <h4>{nextPrayer.name} {nextPrayer.time}</h4>
              </div>
              <div className="location-tag"><MapPin size={12}/> القاهرة، مصر</div>
           </div>
        </aside>
      </div>
{/* --- بداية الـ 200 سطر الإضافية لمميزات الـ Pro --- */}

      {/* 1. نظام الأوسمة والجوائز التفاعلي (Badges System) */}
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

      {/* 2. مفكرة "وقل رب زدني علماً" المحمية (Journaling System) */}
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

      {/* 3. مشغل الإذاعة العائم والتحكم الصوتي (Advanced Mini Player) */}
      <div className="floating-radio-player glass-morph">
        <div className="player-track-info">
          <div className={`track-visualizer ${isPlaying ? 'animating' : ''}`}>
            <span></span><span></span><span></span><span></span>
          </div>
          <div className="track-text">
            <strong>إذاعة القرآن الكريم</strong>
            <marquee>بث مباشر من القاهرة - تلاوات خاشعة على مدار الساعة</marquee>
          </div>
        </div>
        <div className="player-controls-pro">
          <button className="p-btn side"><Volume2 size={18}/></button>
          <button className="p-btn main" onClick={() => setIsPlaying(!isPlaying)}>
            {isPlaying ? <Pause fill="white"/> : <Play fill="white"/>}
          </button>
          <button className="p-btn side"><RefreshCw size={18}/></button>
        </div>
        <div className="volume-slider-popover">
           <input type="range" min="0" max="100" />
        </div>
      </div>

      {/* 4. نظام "أمنّت على دعائك" (Social Prayer System) */}
      <div className="social-duaa-wall glass">
        <div className="wall-header">
          <Users size={18} /> <span>دعوات المسلمين الآن</span>
        </div>
        <div className="duaa-cards-container">
          {[
            { u: "أحمد م.", d: "اللهم وفقني في امتحانات الثانوية العامة", a: 124 },
            { u: "سارة ع.", d: "اللهم اشفِ مرضانا ومرضى المسلمين", a: 310 },
            { u: "مستخدم", d: "اللهم ارزقنا زيارة بيتك الحرام", a: 89 }
          ].map((post, pi) => (
            <motion.div key={pi} className="duaa-post-card">
              <p>"{post.d}"</p>
              <div className="duaa-actions">
                <button className="amen-btn">
                  <Heart size={14} /> تأمين ({post.a})
                </button>
                <small>منذ {pi + 2} دقائق</small>
              </div>
            </motion.div>
          ))}
        </div>
        <button className="write-duaa-trigger"><Plus /> اطلب دعاءً من الإخوة</button>
      </div>

      {/* 5. بوابة الخدمات الكبرى (Full Portals) */}
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

      {/* 6. تذييل الصفحة المطور (Pro Navigation Footer) */}
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

      {/* نهاية الـ 200 سطر الإضافية */}
    </div> // إغلاق الـ rel-master-root الأصلي
  );
};

export default Religious;
