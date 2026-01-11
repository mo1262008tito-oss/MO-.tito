import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebase';
import { 
  doc, onSnapshot, updateDoc, arrayUnion, increment, getDocs, 
  collection, query, where, orderBy, limit, addDoc, serverTimestamp 
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layout, Power, CheckCircle, Award, PlayCircle, Calendar, Trash2, 
  BookOpen, Clock, Flame, Key, Trophy, ShoppingBag, GraduationCap, Zap, 
  Target, Plus, Check, ListChecks, Wallet, ShieldCheck, MessageSquare, 
  StickyNote, DownloadCloud, AlertTriangle, Image as ImageIcon, Send, 
  Smartphone, X, Monitor, Calculator, Moon, Sun, Lock, History, ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './StudentDash.css';

const StudentDash = () => {
  const navigate = useNavigate();
  // --- States الأساسية ---
  const [student, setStudent] = useState(null);
  const [activeTab, setActiveTab] = useState('my-courses'); 
  const [availableCourses, setAvailableCourses] = useState([]);
  const [topStudents, setTopStudents] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // --- أنظمة التفاعل ---
  const [activationCode, setActivationCode] = useState("");
  const [notif, setNotif] = useState({ show: false, msg: "", type: "info" });
  const [showPaymentModal, setShowPaymentModal] = useState({ show: false, course: null });
  const [receiptImage, setReceiptImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // --- نظام بومودورو و Focus Mode ---
  const [pomoMode, setPomoMode] = useState('work'); 
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  // --- ميزة إضافة كورس خارجي ---
  const [showExternalCourseModal, setShowExternalCourseModal] = useState(false);
  const [externalCourse, setExternalCourse] = useState({ title: '', url: '', platform: 'YouTube' });

  useEffect(() => {
    if (!auth.currentUser) return navigate('/login');

    // 1. مراقبة بيانات الطالب + الـ Streak + الأمان
    const unsub = onSnapshot(doc(db, "users", auth.currentUser.uid), (d) => {
      if (d.exists()) {
        const data = d.data();
        setStudent(data);
        handleSecurityAndStreak(data);
      }
    });

    // 2. جلب متجر الكورسات (داخلي وخارجي)
    const fetchStore = async () => {
      const q = collection(db, "courses_metadata");
      const snap = await getDocs(q);
      setAvailableCourses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    // 3. لوحة الأوائل العالمية
    const fetchLeaders = () => {
      const q = query(collection(db, "users"), orderBy("points", "desc"), limit(10));
      onSnapshot(q, (snap) => {
        setTopStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    };

    fetchStore();
    fetchLeaders();
    return () => unsub();
  }, []);

  // ==========================================
  // [1] محرك الأمان والـ Streak اليومي
  // ==========================================
  const handleSecurityAndStreak = async (userData) => {
    const today = new Date().toLocaleDateString();
    const currentDevice = navigator.userAgent;

    // أ. فحص الأمان (جهازين كحد أقصى)
    if (userData.deviceId && userData.deviceId !== currentDevice) {
       if (userData.secondDeviceId && userData.secondDeviceId !== currentDevice) {
          // يمكن تفعيل الحظر التلقائي هنا
          triggerNotif("تنبيه أمني: تم رصد محاولة دخول من جهاز غير مسجل!", "error");
       }
    }

    // ب. تحديث الـ Streak (الشعلة)
    if (userData.lastLoginDate !== today) {
      const lastDate = new Date(userData.lastLoginDate);
      const diffTime = Math.abs(new Date() - lastDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let newStreak = (userData.streak || 0) + 1;
      if (diffDays > 1) newStreak = 1; // انطفأت الشعلة إذا غاب أكثر من يوم

      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        streak: newStreak,
        lastLoginDate: today,
        points: increment(10) // نقاط هدية الدخول اليومي
      });
    }
  };

  // ==========================================
  // [2] نظام الشراء وتفعيل الأكواد
  // ==========================================
  const handleActivateCode = async () => {
    if(!activationCode) return;
    try {
      const q = query(collection(db, "activationCodes"), where("code", "==", activationCode), where("isUsed", "==", false));
      const snap = await getDocs(q);

      if(snap.empty) return triggerNotif("كود غير صالح أو تم استخدامه مسبقاً", "error");

      const codeDoc = snap.docs[0];
      const codeData = codeDoc.data();

      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        walletBalance: increment(codeData.value || 0),
        enrolledContent: codeData.type === 'course' ? arrayUnion(codeData.targetId) : arrayUnion(),
        points: increment(50)
      });

      await updateDoc(doc(db, "activationCodes", codeDoc.id), { 
        isUsed: true, 
        usedBy: student.name,
        usedAt: serverTimestamp() 
      });

      setActivationCode("");
      triggerNotif("تم تفعيل الكود بنجاح! +50 XP", "success");
    } catch(e) { triggerNotif("خطأ في الاتصال بالسيرفر", "error"); }
  };

  // ==========================================
  // [3] ميزة الكورسات الخارجية
  // ==========================================
  const handleAddExternalCourse = async () => {
    if(!externalCourse.title || !externalCourse.url) return triggerNotif("أكمل البيانات", "error");
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        externalCourses: arrayUnion({ ...externalCourse, id: Date.now() })
      });
      setShowExternalCourseModal(false);
      triggerNotif("تمت إضافة الكورس الخارجي للوحتك", "success");
    } catch(e) { triggerNotif("فشل الإضافة", "error"); }
  };

  const triggerNotif = (msg, type = "info") => {
    setNotif({ show: true, msg, type });
    setTimeout(() => setNotif(prev => ({ ...prev, show: false })), 4000);
  };

  return (
    <div className={`nebula-theme ${isDarkMode ? 'dark' : 'light'} ${focusMode ? 'focus-mode' : ''}`}>
      
      {/* 1. شعار الشاشة (Overlay Notif) */}
      <AnimatePresence>
        {notif.show && (
          <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100 }} className={`nebula-toast ${notif.type}`}>
            {notif.type === 'success' ? <CheckCircle size={18}/> : <AlertTriangle size={18}/>}
            {notif.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. الـ Dock الجانبي (Sidebar) */}
      {!focusMode && (
        <aside className="nebula-side-dock">
          <div className="dock-logo">
            <div className="logo-glow">T</div>
          </div>
          
          <nav className="dock-menu">
            <button className={activeTab === 'my-courses' ? 'active' : ''} onClick={() => setActiveTab('my-courses')}>
              <Layout size={22} /><span className="label">مكتبتي</span>
            </button>
            <button className={activeTab === 'store' ? 'active' : ''} onClick={() => setActiveTab('store')}>
              <ShoppingBag size={22} /><span className="label">المتجر</span>
            </button>
            <button className={activeTab === 'leaderboard' ? 'active' : ''} onClick={() => setActiveTab('leaderboard')}>
              <Trophy size={22} /><span className="label">الأوائل</span>
            </button>
            <button className={activeTab === 'wallet' ? 'active' : ''} onClick={() => setActiveTab('wallet')}>
              <Wallet size={22} /><span className="label">المحفظة</span>
            </button>
            <button className={activeTab === 'tools' ? 'active' : ''} onClick={() => setActiveTab('tools')}>
              <Calculator size={22} /><span className="label">أدواتي</span>
            </button>
          </nav>

          <div className="dock-bottom">
            <button onClick={() => setIsDarkMode(!isDarkMode)}>
              {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
            </button>
            <button className="exit-btn" onClick={() => auth.signOut()}><Power size={22} /></button>
          </div>
        </aside>
      )}

      {/* 3. المحتوى الرئيسي */}
      <main className="nebula-content">
        <header className="nebula-header">
          <div className="header-left">
            <div className="student-profile">
               <div className="avatar-wrapper">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student?.email}`} alt="avatar" />
                  <div className="level-badge">{Math.floor((student?.points || 0) / 100)}</div>
               </div>
               <div className="welcome-text">
                  <h3>أهلاً، {student?.name?.split(' ')[0]} 👋</h3>
                  <div className="streak-tag">
                    <Flame size={16} fill={student?.streak > 0 ? "#ff8c00" : "#ccc"} />
                    <span>{student?.streak || 0} يوم متواصل</span>
                  </div>
               </div>
            </div>
          </div>

          <div className="header-right">
            <div className="stat-pill wallet-pill" onClick={() => setActiveTab('wallet')}>
              <Wallet size={16} />
              <span>{student?.walletBalance || 0} EGP</span>
            </div>
            <div className="stat-pill xp-pill">
              <Zap size={16} fill="#facc15" />
              <span>{student?.points || 0} XP</span>
            </div>
            <div className="quick-code-input">
              <input 
                placeholder="شحن كود..." 
                value={activationCode} 
                onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
              />
              <button onClick={handleActivateCode}><Key size={16}/></button>
            </div>
          </div>
        </header>

        <div className="nebula-viewport">
          <AnimatePresence mode="wait">
            
            {/* 1. مكتبة المحاضرات (تشمل الكورسات الخارجية) */}
            {activeTab === 'my-courses' && (
              <motion.div key="my-courses" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="tab-pane">
                <div className="pane-header">
                  <h2><BookOpen /> محاضراتي الدراسية</h2>
                  <button className="add-ext-btn" onClick={() => setShowExternalCourseModal(true)}>
                    <Plus size={18} /> إضافة كورس خارجي
                  </button>
                </div>

                <div className="courses-grid">
                  {/* الكورسات المشترك بها من المنصة */}
                  {availableCourses.filter(c => student?.enrolledContent?.includes(c.id)).map(course => (
                    <div key={course.id} className="nebula-card course-item" onClick={() => navigate(`/video-player/${course.id}`)}>
                      <div className="card-thumb" style={{backgroundImage: `url(${course.thumbnail})`}}>
                        <div className="play-overlay"><PlayCircle size={40} /></div>
                      </div>
                      <div className="card-info">
                        <h4>{course.title}</h4>
                        <div className="progress-mini">
                          <div className="bar"><div className="fill" style={{width: '60%'}}></div></div>
                          <span>60% مكتمل</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* الكورسات الخارجية (YouTube/Links) */}
                  {student?.externalCourses?.map(ext => (
                    <div key={ext.id} className="nebula-card external-item" onClick={() => window.open(ext.url, '_blank')}>
                      <div className="card-thumb ext-thumb">
                        <ExternalLink size={30} />
                        <span className="platform-tag">{ext.platform}</span>
                      </div>
                      <div className="card-info">
                        <h4>{ext.title}</h4>
                        <p>كورس خارجي مضاف يدوياً</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 2. أدوات المذاكرة (آلة حاسبة + جدول) */}
            {activeTab === 'tools' && (
              <motion.div key="tools" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="tab-pane">
                <div className="tools-layout">
                  <div className="nebula-card calculator-tool">
                    <h3><Calculator size={20} /> الآلة الحاسبة العلمية</h3>
                    <div className="calc-frame">
                      {/* يمكن استدعاء آلة حاسبة برمجية هنا */}
                      <p>مدمجة لراحتك أثناء حل المسائل</p>
                      <iframe src="https://www.desmos.com/scientific" title="calc" width="100%" height="300px"></iframe>
                    </div>
                  </div>

                  <div className="nebula-card study-schedule">
                    <h3><Calendar size={20} /> تنظيمي الأسبوعي</h3>
                    <div className="schedule-list">
                      {['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map(day => (
                        <div key={day} className="day-row">
                          <span>{day}</span>
                          <input placeholder="ماذا سنذاكر؟" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 3. لوحة الأوائل (Leaderboard) */}
            {activeTab === 'leaderboard' && (
              <motion.div key="leaders" className="tab-pane">
                <div className="leaderboard-container nebula-card">
                  <div className="podium">
                    {topStudents.slice(0, 3).map((s, i) => (
                      <div key={s.id} className={`podium-spot spot-${i+1}`}>
                        <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${s.email}`} alt="" />
                        <p className="name">{s.name}</p>
                        <p className="pts">{s.points} XP</p>
                        <div className="step">{i === 0 ? '1st' : i === 1 ? '2nd' : '3rd'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* الجزء الرابع: ميزات الأمان والإغلاق */}
      
      {/* العلامة المائية المتحركة (Anti-Screen Record) */}
      <div className="dynamic-watermark">
         <span>{student?.name} - {student?.phone}</span>
      </div>

      {/* مودال إضافة كورس خارجي */}
      <AnimatePresence>
        {showExternalCourseModal && (
          <div className="nebula-overlay">
            <motion.div className="nebula-modal" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
              <h3>إضافة كورس من مصدر خارجي</h3>
              <div className="form-group">
                <label>اسم الكورس</label>
                <input value={externalCourse.title} onChange={e => setExternalCourse({...externalCourse, title: e.target.value})} />
              </div>
              <div className="form-group">
                <label>رابط الكورس (YouTube / Drive)</label>
                <input value={externalCourse.url} onChange={e => setExternalCourse({...externalCourse, url: e.target.value})} />
              </div>
              <div className="modal-actions">
                <button className="confirm-btn" onClick={handleAddExternalCourse}>إضافة للمكتبة</button>
                <button className="cancel-btn" onClick={() => setShowExternalCourseModal(false)}>إلغاء</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Focus Mode Overlay */}
      {focusMode && (
        <div className="focus-exit-layer">
          <button onClick={() => {setFocusMode(false); setIsActive(false);}}>
            إنهاء جلسة التركيز <X size={16}/>
          </button>
        </div>
      )}

    </div>
  );
};

export default StudentDash;
