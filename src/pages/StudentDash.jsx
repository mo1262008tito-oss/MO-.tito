import React, { useState, useEffect, useCallback } from 'react';
import { auth, db, storage } from '../firebase';
import { 
  doc, onSnapshot, updateDoc, arrayUnion, arrayRemove, increment, 
  getDocs, collection, query, where, orderBy, limit, serverTimestamp, setDoc 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layout, Power, CheckCircle, Award, PlayCircle, Clock, Flame, Key, Trophy, 
  ShoppingBag, BookOpen, Zap, Target, Plus, ListChecks, Wallet, ShieldCheck, 
  Image as ImageIcon, X, Monitor, Moon, Sun, Coffee, Brain, Sparkles, Trash2,
  Bell, Settings, ChevronRight, Star, Heart, MessageSquare, Briefcase
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './StudentDash.css';

const StudentDash = () => {
  const navigate = useNavigate();
  
  // 1. حالات البيانات (Data States)
  const [student, setStudent] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); 
  const [topStudents, setTopStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [motivation, setMotivation] = useState("");
  
  // 2. حالات التفاعل (Interaction States)
  const [activationCode, setActivationCode] = useState("");
  const [newTask, setNewTask] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [notif, setNotif] = useState({ show: false, msg: "", type: "info" });
  
  // 3. حالات بومودورو (Pomodoro Logic)
  const [timer, setTimer] = useState(1500); // 25 mins
  const [timerActive, setTimerActive] = useState(false);

  // مصفوفة الرسائل التحفيزية المتغيرة
  const quotes = [
    "النجاح ليس صدفة، بل هو عمل شاق وإصرار.",
    "كل سطر تذاكره اليوم هو لبنة في صرح نجاحك غداً.",
    "أنت أقوى مما تعتقد، استمر في المحاولة.",
    "لا يقاس النجاح بالموقع، بل بالصعاب التي تغلبت عليها.",
    "العقل مثل العضلة، كلما استخدمته أصبح أقوى."
  ];

  // ==========================================
  // محرك الربط بقاعدة البيانات (Firebase Engine)
  // ==========================================
  
  useEffect(() => {
    if (!auth.currentUser) return navigate('/login');

    // مراقبة بيانات الطالب الحية (Real-time Sync)
    const unsubStudent = onSnapshot(doc(db, "users", auth.currentUser.uid), (d) => {
      if (d.exists()) {
        const data = d.data();
        setStudent(data);
        // التحقق من نظام الـ Streak (الأيام المتتالية)
        checkStreak(data);
      } else {
        // إنشاء مستند جديد في حال عدم وجوده (Logic الأمان)
        initializeStudent();
      }
    });

    // جلب لوحة المتصدرين
    const fetchLeaders = () => {
      const q = query(collection(db, "users"), orderBy("points", "desc"), limit(6));
      onSnapshot(q, (snap) => {
        setTopStudents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    };

    // تغيير الرسالة التحفيزية عشوائياً
    setMotivation(quotes[Math.floor(Math.random() * quotes.length)]);

    fetchLeaders();
    return () => unsubStudent();
  }, [navigate]);

  const initializeStudent = async () => {
    await setDoc(doc(db, "users", auth.currentUser.uid), {
      name: auth.currentUser.displayName || "طالب جديد",
      email: auth.currentUser.email,
      points: 100,
      walletBalance: 0,
      streak: 1,
      lastLogin: serverTimestamp(),
      todoList: [],
      photoURL: null
    });
  };

  const checkStreak = async (userData) => {
    const today = new Date().toDateString();
    const lastLogin = userData.lastLoginDate;
    if (lastLogin !== today) {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        lastLoginDate: today,
        streak: increment(1),
        points: increment(20)
      });
      showToast("رائع! +20 نقطة لمداومتك اليومية ✨", "success");
    }
  };

  // ==========================================
  // نظام إدارة الصور (Photo Management)
  // ==========================================
  
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return showToast("حجم الصورة كبير جداً (الأقصى 2MB)", "error");

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `avatars/${auth.currentUser.uid}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      await updateDoc(doc(db, "users", auth.currentUser.uid), { photoURL: downloadURL });
      showToast("تم تحديث هويتك البصرية بنجاح!", "success");
    } catch (error) {
      showToast("خطأ في رفع الصورة", "error");
    }
    setIsUploading(false);
  };

  // ==========================================
  // نظام المحفظة والعملات (Wallet Logic)
  // ==========================================
  
  const handleRedeemCode = async () => {
    if (!activationCode.trim()) return;
    
    try {
      const q = query(collection(db, "activationCodes"), where("code", "==", activationCode), where("isUsed", "==", false));
      const snap = await getDocs(q);

      if (snap.empty) {
        showToast("هذا الكود غير صالح أو تم استخدامه مسبقاً", "error");
        return;
      }

      const codeDoc = snap.docs[0];
      const codeValue = codeDoc.data().value;

      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        walletBalance: increment(codeValue),
        points: increment(100)
      });

      await updateDoc(doc(db, "activationCodes", codeDoc.id), {
        isUsed: true,
        usedBy: student.email,
        usedAt: serverTimestamp()
      });

      setActivationCode("");
      showToast(`مبروك! تم شحن ${codeValue} ج.م في محفظتك 🚀`, "success");
    } catch (err) {
      showToast("حدث خطأ أثناء تفعيل الكود", "error");
    }
  };

  // ==========================================
  // نظام المهام (Task Management)
  // ==========================================
  
  const addTask = async () => {
    if (!newTask.trim()) return;
    const taskObj = { id: Date.now(), text: newTask, completed: false, createdAt: new Date() };
    await updateDoc(doc(db, "users", auth.currentUser.uid), {
      todoList: arrayUnion(taskObj)
    });
    setNewTask("");
    showToast("تمت إضافة المهمة بنجاح", "info");
  };

  const toggleTask = async (task) => {
    const updatedList = student.todoList.map(t => 
      t.id === task.id ? { ...t, completed: !t.completed } : t
    );
    await updateDoc(doc(db, "users", auth.currentUser.uid), { todoList: updatedList });
    if (!task.completed) {
      await updateDoc(doc(db, "users", auth.currentUser.uid), { points: increment(5) });
      showToast("+5 XP لإنجاز المهمة", "success");
    }
  };

  const deleteTask = async (task) => {
    await updateDoc(doc(db, "users", auth.currentUser.uid), {
      todoList: arrayRemove(task)
    });
  };

  // ==========================================
  // نظام بومودورو (Focus Timer)
  // ==========================================
  
  useEffect(() => {
    let interval = null;
    if (timerActive && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    } else if (timer === 0) {
      setTimerActive(false);
      showToast("انتهى وقت التركيز! خذ استراحة قصيرة ☕", "success");
      updateDoc(doc(db, "users", auth.currentUser.uid), { points: increment(50) });
    }
    return () => clearInterval(interval);
  }, [timerActive, timer]);

  const formatTime = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // ==========================================
  // الوظائف المساعدة
  // ==========================================
  
  const showToast = (msg, type) => {
    setNotif({ show: true, msg, type });
    setTimeout(() => setNotif({ show: false, msg: "", type: "info" }), 4000);
  };

  const getRank = (pts) => {
    if (pts > 5000) return { title: "أدميرال الفضاء", color: "#ff00ff" };
    if (pts > 2000) return { title: "محارب ذهبي", color: "#ffd700" };
    if (pts > 1000) return { title: "مستكشف فضي", color: "#c0c0c0" };
    return { title: "مبتدئ فضائي", color: "#00d2ff" };
  };

  // ==========================================
  // واجهة العرض (UI Render)
  // ==========================================

  return (
    <div className="student-nebula-app">
      
      {/* التنبيهات المنبثقة */}
      <AnimatePresence>
        {notif.show && (
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.5 }} className={`toast-popup ${notif.type}`}>
            {notif.type === 'success' ? <ShieldCheck /> : <Bell />}
            <span>{notif.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. السايدبار الذكي */}
      <aside className="nebula-sidebar">
        <div className="brand-section">
          <div className="brand-logo-glow">T</div>
          <h2 style={{letterSpacing: '2px', fontSize: '18px', marginTop: '15px'}}>TITO ACADEMY</h2>
        </div>

        <nav className="nav-links-container">
          <button className={`nav-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            <Layout size={20}/> <span>لوحة التحكم</span>
          </button>
          <button className={`nav-btn ${activeTab === 'wallet' ? 'active' : ''}`} onClick={() => setActiveTab('wallet')}>
            <Wallet size={20}/> <span>المحفظة الرقمية</span>
          </button>
          <button className={`nav-btn ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>
            <ListChecks size={20}/> <span>خطة المذاكرة</span>
          </button>
          <button className={`nav-btn ${activeTab === 'courses' ? 'active' : ''}`} onClick={() => setActiveTab('courses')}>
            <BookOpen size={20}/> <span>كورساتي</span>
          </button>
          <button className={`nav-btn ${activeTab === 'ranks' ? 'active' : ''}`} onClick={() => setActiveTab('ranks')}>
            <Trophy size={20}/> <span>قائمة الأوائل</span>
          </button>
        </nav>

        <div className="sidebar-footer" style={{marginTop: 'auto'}}>
          <div className="pomo-widget">
            <Clock size={16} color={var(--neon-cyan)} />
            <span>{formatTime(timer)}</span>
            <button onClick={() => setTimerActive(!timerActive)}>{timerActive ? <X size={14}/> : <PlayCircle size={14}/>}</button>
          </div>
          <button className="nav-btn exit-link" onClick={() => auth.signOut()} style={{width: '100%', color: '#ff4b2b'}}>
            <Power size={20}/> <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* 2. منطقة المحتوى */}
      <main className="nebula-main-stage">
        
        {/* الهيدر العلوي */}
        <header className="cosmic-header">
          <div className="user-profile-zone">
            <label className="avatar-orbital">
              <input type="file" hidden onChange={handleAvatarChange} />
              <img src={student?.photoURL || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${student?.name}`} alt="user" />
              {isUploading && <div className="orbital-loader"></div>}
              <div className="online-indicator"></div>
            </label>
            <div>
              <h3 style={{margin: 0, fontSize: '20px'}}>مرحباً بك، {student?.name?.split(' ')[0]} 👋</h3>
              <p style={{margin: 0, fontSize: '13px', color: var(--neon-cyan)}}><Sparkles size={14}/> {motivation}</p>
            </div>
          </div>

          <div className="header-actions">
            <div className="stat-pill">
              <Zap size={18} fill="#ffcc00" color="#ffcc00" />
              <span>{student?.points || 0} XP</span>
            </div>
            <div className="stat-pill">
              <Flame size={18} fill="#ff4b2b" color="#ff4b2b" />
              <span>{student?.streak || 0} يوم</span>
            </div>
          </div>
        </header>

        {/* التبديل بين التبويبات (Content Router) */}
        <div className="tab-content-area">
          <AnimatePresence mode='wait'>
            
            {/* التبويب الأول: الرئيسية */}
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} className="dashboard-grid-layout">
                <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px'}}>
                  
                  <div className="nebula-card hero-stats">
                    <div style={{display:'flex', justifyContent:'space-between'}}>
                      <h3>المستوى التعليمي</h3>
                      <span style={{color: getRank(student?.points).color}}>{getRank(student?.points).title}</span>
                    </div>
                    <div className="xp-progress-bar">
                      <div className="xp-fill" style={{width: `${(student?.points % 1000) / 10}%`}}></div>
                    </div>
                    <p style={{fontSize:'12px', color:'#888'}}>تحتاج إلى {1000 - (student?.points % 1000)} نقطة للرتبة التالية</p>
                  </div>

                  <div className="nebula-card quick-wallet">
                    <h4>الرصيد الحالي</h4>
                    <div className="balance-value">{student?.walletBalance || 0} <small>ج.م</small></div>
                    <button className="charge-btn" onClick={() => setActiveTab('wallet')}>شحن المحفظة</button>
                  </div>

                </div>

                <div className="nebula-card" style={{marginTop: '20px'}}>
                  <h3><Target size={20}/> نشاطك الأخير</h3>
                  <div className="activity-placeholder">
                    {/* هنا يمكن وضع رسم بياني أو سجل الدروس */}
                    <p>لا توجد بيانات دروس مكتملة اليوم. ابدأ الآن!</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* التبويب الثاني: المحفظة */}
            {activeTab === 'wallet' && (
              <motion.div key="wallet" initial={{opacity:0}} animate={{opacity:1}} className="wallet-tab-view">
                <div className="nebula-card wallet-hero">
                  <Wallet size={40} color={var(--neon-cyan)}/>
                  <h2>محفظة MaFa الرقمية</h2>
                  <div className="balance-large">{student?.walletBalance || 0} EGP</div>
                  
                  <div className="redeem-section">
                    <input 
                      type="text" 
                      placeholder="أدخل كود التفعيل هنا..." 
                      value={activationCode}
                      onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
                    />
                    <button onClick={handleRedeemCode}>تفعيل الكود</button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* التبويب الثالث: المهام */}
            {activeTab === 'tasks' && (
              <motion.div key="tasks" initial={{opacity:0}} animate={{opacity:1}} className="todo-tab-view">
                <div className="nebula-card todo-container">
                  <h3>قائمة المهام اليومية</h3>
                  <div className="task-entry">
                    <input 
                      type="text" 
                      placeholder="مثلاً: مراجعة الوحدة الأولى فيزياء..." 
                      value={newTask}
                      onChange={(e) => setNewTask(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTask()}
                    />
                    <button onClick={addTask} className="add-task-btn"><Plus /></button>
                  </div>

                  <div className="todo-list-wrapper">
                    {student?.todoList?.map((task) => (
                      <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                        <div style={{display:'flex', alignItems:'center', gap: '15px'}} onClick={() => toggleTask(task)}>
                          {task.completed ? <CheckCircle color="#00ff88"/> : <div className="circle-check"></div>}
                          <span>{task.text}</span>
                        </div>
                        <Trash2 size={18} color="#ff4b2b" style={{cursor:'pointer'}} onClick={() => deleteTask(task)}/>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* 3. شاشة وضع التركيز (Full Screen Focus) */}
      <AnimatePresence>
        {timerActive && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="focus-overlay">
            <div className="timer-big">{formatTime(timer)}</div>
            <p>ركز الآن.. العالم كله يمكنه الانتظار</p>
            <button onClick={() => setTimerActive(false)}><X /> إنهاء الجلسة</button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default StudentDash;
