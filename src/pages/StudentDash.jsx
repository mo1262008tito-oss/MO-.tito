import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, onSnapshot, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout, Book, Target, Zap, Power, Search, X, CheckCircle, Award, Database } from 'lucide-react';
import './StudentDash.css';

const StudentDash = () => {
  const [student, setStudent] = useState(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [taskText, setTaskText] = useState("");
  const [notif, setNotif] = useState("");
  
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const library = [
    { id: 'web1', name: 'احتراف تطوير الويب', desc: 'بيئة React و Firebase المتكاملة', icon: '🌐' },
    { id: 'ai1', name: 'هندسة الذكاء الاصطناعي', desc: 'الشبكات العصبية ولغة بايثون', icon: '🧠' },
    { id: 'ui1', name: 'تصميم واجهات المستقبل', desc: 'تجربة المستخدم والواجهات الفضائية', icon: '🎨' }
  ];

  useEffect(() => {
    if (auth.currentUser) {
      const unsub = onSnapshot(doc(db, "users", auth.currentUser.uid), (d) => {
        if (d.exists()) setStudent(d.data());
      });
      return () => unsub();
    }
  }, []);

  useEffect(() => {
    let interval = null;
    if (isActive && (minutes > 0 || seconds > 0)) {
      interval = setInterval(() => {
        if (seconds === 0) { setMinutes(m => m - 1); setSeconds(59); }
        else { setSeconds(s => s - 1); }
      }, 1000);
    } else if (minutes === 0 && seconds === 0) {
      setIsActive(false);
      triggerNotif("اكتملت المهمة: انتهت جلسة التركيز بنجاح");
    }
    return () => clearInterval(interval);
  }, [isActive, minutes, seconds]);

  const triggerNotif = (msg) => {
    setNotif(msg);
    setTimeout(() => setNotif(""), 4000);
  };

  const enroll = async (course) => {
    if (student.myCourses?.some(c => c.id === course.id)) return triggerNotif("هذه الوحدة مدمجة بالفعل في ملفك");
    const ref = doc(db, "users", auth.currentUser.uid);
    await updateDoc(ref, { 
      myCourses: arrayUnion({ ...course, progress: 0 }),
      points: increment(50)
    });
    triggerNotif(`تم اكتساب وحدة جديدة: ${course.name}`);
  };

  const addTask = async () => {
    if (!taskText) return;
    const ref = doc(db, "users", auth.currentUser.uid);
    await updateDoc(ref, { 
      tasks: arrayUnion({ id: Date.now(), text: taskText, completed: false }),
      points: increment(10)
    });
    setTaskText("");
    triggerNotif("تم تسجيل المهمة في الرابط العصبي");
  };

  if (!student) return (
    <div className="loading-vortex">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
        <Zap size={50} color="#00f2ff" />
      </motion.div>
      <span>جاري المزامنة مع الخادم الرئيسي...</span>
    </div>
  );

  return (
    <div className={`dash-main-root rtl-support ${isActive ? 'focus-mode-active' : ''}`}>
      
      {/* إشعارات النظام */}
      <AnimatePresence>
        {notif && (
          <motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} className="neural-notif">
            <Zap size={18} /> {notif}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="space-header">
        <div className="user-profile-section">
          <motion.div whileHover={{ scale: 1.1 }} className="avatar-orb">
            <img src={student.photoURL || "https://api.dicebear.com/7.x/bottts/svg?seed=Felix"} alt="avatar" />
            <div className="pulse-ring"></div>
          </motion.div>
          <div className="user-meta">
            <h2>{student.displayName} <span className="status-badge">نشط الآن</span></h2>
            <p className="rank-title">مستكشف النظم | المستوى {Math.floor(student.points / 500) + 1}</p>
          </div>
        </div>

        <div className="global-stats-hub">
          <div className="stat-box">
            <span className="label">طاقة النور (XP)</span>
            <span className="value">{student.points}</span>
            <div className="energy-bar">
              <motion.div initial={{ width: 0 }} animate={{ width: `${(student.points % 500) / 5}%` }} className="energy-fill" />
            </div>
          </div>
        </div>

        <button onClick={() => auth.signOut()} className="disconnect-btn">
          <Power size={20} /> <span>قطع الاتصال</span>
        </button>
      </header>

      <div className="grid-layout">
        {/* الجناح الأيمن: الأدوات */}
        <aside className="right-wing">
          <motion.div whileHover={{ y: -5 }} className="glass-module pomodoro-v2">
            <h3><Target size={18} /> نواة التركيز</h3>
            <div className={`timer-display ${isActive ? 'breathing' : ''}`}>
              {String(minutes).padStart(2,'0')}:<span>{String(seconds).padStart(2,'0')}</span>
            </div>
            <div className="timer-controls">
              <button onClick={() => setIsActive(!isActive)}>
                {isActive ? "إيقاف المهمة" : "بدء التركيز"}
              </button>
              <button onClick={() => {setIsActive(false); setMinutes(25); setSeconds(0);}}>إعادة ضبط</button>
            </div>
          </motion.div>

          <div className="glass-module missions-v2">
            <h3><Layout size={18} /> سجل العمليات</h3>
            <div className="input-vortex">
              <input value={taskText} onChange={(e)=>setTaskText(e.target.value)} placeholder="أضف مهمة جديدة..." />
              <button onClick={addTask}><Zap size={16}/></button>
            </div>
            <div className="mission-scroller custom-scroll">
              {student.tasks?.map(t => (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={t.id} className="mission-node">
                  <CheckCircle size={14} className="node-icon" />
                  <span>{t.text}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </aside>

        {/* الجناح المركزي: الوحدات المعرفية */}
        <main className="center-deck-v2">
          <div className="deck-nav">
            <h1>الوحدات المكتسبة</h1>
            <button className="scan-trigger" onClick={() => setShowLibrary(true)}>
              <Database size={18} /> مسح المكتبة
            </button>
          </div>

          <div className="knowledge-grid">
            {student.myCourses?.map(c => (
              <motion.div whileHover={{ scale: 1.02 }} key={c.id} className="knowledge-card neon-border">
                <div className="card-header">
                  <span className="icon-wrap">{c.icon || '📦'}</span>
                  <div className="meta">
                    <h4>{c.name}</h4>
                    <code>معرف_النظام: {c.id}</code>
                  </div>
                </div>
                <div className="sync-status">
                  <div className="sync-label">مستوى المزامنة: {c.progress}%</div>
                  <div className="sync-bar"><div className="fill" style={{width: `${c.progress}%`}} /></div>
                </div>
                <button className="enter-btn">دخول المحاكاة</button>
              </motion.div>
            ))}
          </div>
        </main>
      </div>

      {/* مودال قاعدة البيانات */}
      <AnimatePresence>
        {showLibrary && (
          <div className="library-overlay">
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} className="library-modal">
              <div className="modal-top">
                <h2>قاعدة البيانات المركزية</h2>
                <button onClick={()=>setShowLibrary(false)}><X /></button>
              </div>
              <div className="library-shelf">
                {library.map(l => (
                  <div key={l.id} className="shelf-item">
                    <div className="item-info">
                      <h3>{l.icon} {l.name}</h3>
                      <p>{l.desc}</p>
                    </div>
                    <button onClick={() => enroll(l)}>تحميل البيانات</button>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentDash;
