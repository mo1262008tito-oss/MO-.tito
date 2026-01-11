import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebase';
import { 
  doc, onSnapshot, updateDoc, arrayUnion, increment, getDocs, 
  collection, query, where, orderBy, limit, addDoc, serverTimestamp, getDoc 
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layout, Power, CheckCircle, Award, PlayCircle, Calendar, Trash2, 
  BookOpen, Clock, Flame, Key, Trophy, ShoppingBag, GraduationCap, Zap, 
  Target, Plus, Check, ListChecks, Wallet, ShieldCheck, MessageSquare, 
  StickyNote, DownloadCloud, AlertTriangle, Image as ImageIcon, Send, 
  Smartphone, X, Monitor, Calculator, Moon, Sun, Lock, History, ExternalLink,
  Coffee, Brain, Star, BarChart3, BellRing, User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './StudentDash.css';

const StudentDash = () => {
  const navigate = useNavigate();
  // --- States الأساسية ---
  const [student, setStudent] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard'); 
  const [availableCourses, setAvailableCourses] = useState([]);
  const [topStudents, setTopStudents] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // --- أنظمة التفاعل ---
  const [activationCode, setActivationCode] = useState("");
  const [notif, setNotif] = useState({ show: false, msg: "", type: "info" });
  const [isUploading, setIsUploading] = useState(false);
  const [dailyTask, setDailyTask] = useState([]);

  // --- نظام بومودورو و Focus Mode ---
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  // --- ميزة إضافة كورس خارجي وملاحظات ---
  const [showExternalCourseModal, setShowExternalCourseModal] = useState(false);
  const [externalCourse, setExternalCourse] = useState({ title: '', url: '', platform: 'YouTube' });
  const [note, setNote] = useState("");

  // --- الماركة المائية المتحركة ---
  const [watermarkPos, setWatermarkPos] = useState({ top: '10%', left: '10%' });

  useEffect(() => {
    if (!auth.currentUser) return navigate('/login');

    // 1. مراقبة بيانات الطالب والـ Streak
    const unsub = onSnapshot(doc(db, "users", auth.currentUser.uid), (d) => {
      if (d.exists()) {
        const data = d.data();
        setStudent(data);
        handleSecurityAndStreak(data);
      }
    });

    // 2. جلب المحتوى المتاح
    const fetchContent = async () => {
      const q = collection(db, "courses_metadata");
      const snap = await getDocs(q);
      setAvailableCourses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    // 3. لوحة الأوائل
    const fetchLeaders = () => {
      const q = query(collection(db, "users"), orderBy("points", "desc"), limit(5));
      onSnapshot(q, (snap) => {
        setTopStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    };

    fetchContent();
    fetchLeaders();

    // مؤقت العلامة المائية
    const watermarkInterval = setInterval(() => {
        setWatermarkPos({
            top: `${Math.random() * 80 + 10}%`,
            left: `${Math.random() * 70 + 5}%`
        });
    }, 10000);

    return () => { unsub(); clearInterval(watermarkInterval); };
  }, []);

  // ==========================================
  // [1] محرك الأمان والـ Streak والمهام
  // ==========================================
  const handleSecurityAndStreak = async (userData) => {
    const today = new Date().toLocaleDateString('en-US');
    const currentDevice = navigator.userAgent;

    // تحديث الـ Streak والنقاط اليومية
    if (userData.lastLoginDate !== today) {
      let newStreak = (userData.streak || 0) + 1;
      const lastDate = userData.lastLoginDate ? new Date(userData.lastLoginDate) : null;
      if (lastDate) {
        const diff = Math.ceil(Math.abs(new Date() - lastDate) / (1000 * 60 * 60 * 24));
        if (diff > 1) newStreak = 1;
      }

      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        streak: newStreak,
        lastLoginDate: today,
        points: increment(20),
        dailyXP: 0 // تصفير الـ XP اليومي للمهام الجديدة
      });
      triggerNotif("تسجيل دخول يومي: +20 XP ✨", "success");
    }
  };

  // ==========================================
  // [2] نظام بومودورو (Pomodoro)
  // ==========================================
  useEffect(() => {
    let interval = null;
    if (isActive && (minutes > 0 || seconds > 0)) {
      interval = setInterval(() => {
        if (seconds === 0) {
          setMinutes(minutes - 1);
          setSeconds(59);
        } else {
          setSeconds(seconds - 1);
        }
      }, 1000);
    } else if (minutes === 0 && seconds === 0) {
      setIsActive(false);
      triggerNotif("انتهى وقت التركيز! خذ استراحة ☕", "success");
      updateDoc(doc(db, "users", auth.currentUser.uid), { points: increment(30) });
    }
    return () => clearInterval(interval);
  }, [isActive, minutes, seconds]);

  // ==========================================
  // [3] تفعيل الأكواد والمحفظة
  // ==========================================
  const handleActivateCode = async () => {
    if(!activationCode) return;
    try {
      const q = query(collection(db, "activationCodes"), where("code", "==", activationCode), where("isUsed", "==", false));
      const snap = await getDocs(q);

      if(snap.empty) return triggerNotif("كود غير صالح", "error");

      const codeDoc = snap.docs[0];
      const codeData = codeDoc.data();

      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        walletBalance: increment(codeData.value || 0),
        points: increment(100)
      });

      await updateDoc(doc(db, "activationCodes", codeDoc.id), { 
        isUsed: true, 
        usedBy: student.email,
        usedAt: serverTimestamp() 
      });

      setActivationCode("");
      triggerNotif(`تم شحن ${codeData.value} ج.م بنجاح!`, "success");
    } catch(e) { triggerNotif("فشل التفعيل", "error"); }
  };

  const triggerNotif = (msg, type = "info") => {
    setNotif({ show: true, msg, type });
    setTimeout(() => setNotif(prev => ({ ...prev, show: false })), 4000);
  };

  // ==========================================
  // [4] الرتبة (Rank Calculation)
  // ==========================================
  const getRank = (pts) => {
    if (pts > 2000) return { name: "أسطوري", color: "#ef4444" };
    if (pts > 1000) return { name: "ذهبي", color: "#facc15" };
    if (pts > 500) return { name: "فضي", color: "#94a3b8" };
    return { name: "مبتدئ", color: "#4ade80" };
  };

  return (
    <div className={`student-nebula-app ${isDarkMode ? 'dark-mode' : 'light-mode'} ${focusMode ? 'deep-focus' : ''}`}>
      
      {/* 1. العلامة المائية الأمنية */}
      <div className="security-watermark" style={{ top: watermarkPos.top, left: watermarkPos.left }}>
        {student?.name} - {student?.phone} - IP: {window.location.hostname}
      </div>

      {/* 2. الإشعارات العائمة */}
      <AnimatePresence>
        {notif.show && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 20, opacity: 1 }} exit={{ y: -50 }} className={`nebula-toast-alert ${notif.type}`}>
             {notif.type === 'success' ? <ShieldCheck size={20}/> : <AlertTriangle size={20}/>}
             <span>{notif.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. الـ Sidebar الذكي */}
      {!focusMode && (
        <nav className="nebula-sidebar">
          <div className="brand-zone">
            <div className="glow-logo">M</div>
            <span>Tito Academy</span>
          </div>

          <div className="nav-links-group">
            <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>
              <Layout size={20} /> <span>الرئيسية</span>
            </button>
            <button className={activeTab === 'my-courses' ? 'active' : ''} onClick={() => setActiveTab('my-courses')}>
              <BookOpen size={20} /> <span>مكتبتي</span>
            </button>
            <button className={activeTab === 'store' ? 'active' : ''} onClick={() => setActiveTab('store')}>
              <ShoppingBag size={20} /> <span>المتجر</span>
            </button>
            <button className={activeTab === 'leaderboard' ? 'active' : ''} onClick={() => setActiveTab('leaderboard')}>
              <Trophy size={20} /> <span>المتصدرين</span>
            </button>
            <button className={activeTab === 'tools' ? 'active' : ''} onClick={() => setActiveTab('tools')}>
              <Brain size={20} /> <span>أدوات الذكاء</span>
            </button>
          </div>

          <div className="sidebar-bottom">
            <div className="pomo-mini-widget">
               <Clock size={16} />
               <span>{minutes}:{seconds < 10 ? `0${seconds}` : seconds}</span>
               <button onClick={() => setIsActive(!isActive)}>{isActive ? <X size={14}/> : <PlayCircle size={14}/>}</button>
            </div>
            <button className="theme-toggle" onClick={() => setIsDarkMode(!isDarkMode)}>
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="logout-btn" onClick={() => auth.signOut()}><Power size={20} /></button>
          </div>
        </nav>
      )}

      {/* 4. المحتوى الرئيسي */}
      <div className="nebula-main-layout">
        <header className="nebula-top-bar">
          <div className="user-intro">
            <div className="avatar-area">
               <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student?.name}`} alt="avatar" />
               <div className="online-indicator"></div>
            </div>
            <div className="name-rank">
              <h4>يا مرحب، {student?.name?.split(' ')[0]} ✨</h4>
              <span style={{ color: getRank(student?.points).color }}>رتبة: {getRank(student?.points).name}</span>
            </div>
          </div>

          <div className="top-bar-stats">
            <div className="stat-item xp" title="نقاط الخبرة">
              <Zap size={18} fill="#fbbf24" />
              <span>{student?.points || 0} XP</span>
            </div>
            <div className="stat-item streak" title="أيام التوالي">
              <Flame size={18} fill="#f97316" />
              <span>{student?.streak || 0}</span>
            </div>
            <div className="stat-item wallet" onClick={() => setActiveTab('wallet')}>
              <Wallet size={18} />
              <span>{student?.walletBalance || 0} ج.م</span>
            </div>
            <div className="quick-action-code">
              <input 
                placeholder="كود شحن.." 
                value={activationCode} 
                onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
              />
              <button onClick={handleActivateCode}><Key size={16}/></button>
            </div>
          </div>
        </header>

        <div className="nebula-view-container">
          <AnimatePresence mode="wait">
            
            {/* --- لوحة التحكم الشاملة --- */}
            {activeTab === 'dashboard' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="dashboard-grid">
                
                {/* قسم شريط التقدم */}
                <div className="nebula-card hero-progress-card">
                  <div className="card-header">
                    <h3><Target size={20}/> مستواك التعليمي</h3>
                    <span>Level {Math.floor((student?.points || 0) / 100)}</span>
                  </div>
                  <div className="main-progress-bar">
                    <div className="progress-fill" style={{ width: `${(student?.points % 100)}%` }}></div>
                  </div>
                  <p>تحتاج إلى {(100 - (student?.points % 100))} XP للوصول للمستوى القادم</p>
                </div>

                {/* قسم المهام اليومية */}
                <div className="nebula-card daily-tasks-card">
                  <h3><ListChecks size={20}/> مهام اليوم</h3>
                  <div className="tasks-list">
                    <div className="task-item done">
                      <CheckCircle size={16} className="text-green-500" />
                      <span>تسجيل الدخول اليومي</span>
                      <small>+20 XP</small>
                    </div>
                    <div className="task-item">
                      <PlayCircle size={16} />
                      <span>مشاهدة محاضرة واحدة</span>
                      <small>+50 XP</small>
                    </div>
                  </div>
                </div>

                {/* بومودورو بلس */}
                <div className="nebula-card focus-card">
                  <h3><Coffee size={20}/> وضع التركيز</h3>
                  <div className="timer-display">
                    {minutes < 10 ? `0${minutes}` : minutes}:{seconds < 10 ? `0${seconds}` : seconds}
                  </div>
                  <div className="timer-controls">
                    <button onClick={() => setIsActive(!isActive)}>{isActive ? "إيقاف" : "بدء التركيز"}</button>
                    <button onClick={() => setFocusMode(true)}><Monitor size={16}/> شاشة كاملة</button>
                  </div>
                </div>

                {/* الأوائل المصغر */}
                <div className="nebula-card mini-leaderboard">
                  <h3><Trophy size={20}/> أفضل المحاربين</h3>
                  {topStudents.map((s, i) => (
                    <div key={s.id} className="mini-leader-item">
                      <span>#{i+1}</span>
                      <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${s.email}`} alt="" />
                      <p>{s.name}</p>
                      <strong>{s.points}</strong>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* --- مكتبة الكورسات --- */}
            {activeTab === 'my-courses' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="courses-view">
                <div className="view-header">
                  <h2>محتواي الدراسي ({availableCourses.filter(c => student?.enrolledContent?.includes(c.id)).length})</h2>
                  <button onClick={() => setShowExternalCourseModal(true)}><Plus size={18}/> إضافة كورس خارجي</button>
                </div>
                <div className="courses-flex-grid">
                  {availableCourses.filter(c => student?.enrolledContent?.includes(c.id)).map(course => (
                    <div key={course.id} className="nebula-course-card" onClick={() => navigate(`/player/${course.id}`)}>
                      <div className="course-poster" style={{backgroundImage: `url(${course.thumbnail})`}}>
                        <div className="badge">{course.grade}</div>
                        <PlayCircle className="play-ico" size={50} />
                      </div>
                      <div className="course-details">
                        <h4>{course.title}</h4>
                        <div className="course-stats">
                          <span><BookOpen size={14}/> 12 درس</span>
                          <span><Clock size={14}/> 5 ساعات</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* الكورسات الخارجية */}
                  {student?.externalCourses?.map(ext => (
                    <div key={ext.id} className="nebula-course-card external" onClick={() => window.open(ext.url, '_blank')}>
                      <div className="course-poster ext">
                        <ExternalLink size={40} />
                        <span className="source-tag">{ext.platform}</span>
                      </div>
                      <div className="course-details">
                        <h4>{ext.title}</h4>
                        <p>كورس خارجي مضاف</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* --- أدوات المذاكرة --- */}
            {activeTab === 'tools' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="tools-view">
                <div className="tools-grid">
                  <div className="nebula-card">
                    <h3><Calculator size={20}/> الآلة الحاسبة العلمية</h3>
                    <iframe src="https://www.desmos.com/scientific" width="100%" height="400px" style={{ borderRadius: '15px', border: 'none' }}></iframe>
                  </div>
                  <div className="nebula-card">
                    <h3><StickyNote size={20}/> الملاحظات السريعة</h3>
                    <textarea 
                      placeholder="اكتب ملاحظاتك هنا.. سيتم حفظها تلقائياً"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    ></textarea>
                    <button className="save-note-btn" onClick={() => triggerNotif("تم حفظ المسودة محلياً", "success")}>حفظ الآن</button>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* مودال الإضافة الخارجية */}
      <AnimatePresence>
        {showExternalCourseModal && (
          <div className="nebula-modal-overlay">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="nebula-modal">
              <div className="modal-header">
                <h3>إضافة محتوى خارجي</h3>
                <X onClick={() => setShowExternalCourseModal(false)} />
              </div>
              <input placeholder="عنوان الكورس" onChange={e => setExternalCourse({...externalCourse, title: e.target.value})} />
              <input placeholder="رابط اليوتيوب أو الدرايف" onChange={e => setExternalCourse({...externalCourse, url: e.target.value})} />
              <select onChange={e => setExternalCourse({...externalCourse, platform: e.target.value})}>
                <option>YouTube</option>
                <option>Google Drive</option>
                <option>External Website</option>
              </select>
              <button onClick={async () => {
                await updateDoc(doc(db, "users", auth.currentUser.uid), {
                  externalCourses: arrayUnion({...externalCourse, id: Date.now()})
                });
                setShowExternalCourseModal(false);
                triggerNotif("تمت إضافة المحتوى", "success");
              }}>تأكيد الإضافة</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* شاشة وضع التركيز العميق */}
      <AnimatePresence>
        {focusMode && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="deep-focus-layer">
            <div className="focus-timer">{minutes}:{seconds < 10 ? `0${seconds}` : seconds}</div>
            <p>لا شيء يهم الآن سوى مستقبلك.. ركز فقط</p>
            <button onClick={() => setFocusMode(false)}><X /> إنهاء الجلسة</button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default StudentDash;
