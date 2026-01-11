import React, { useState, useEffect, useMemo } from 'react';
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
  Bell, Settings, ChevronRight, Star, Heart, MessageSquare, Briefcase, Camera
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './StudentDash.css';

const StudentDash = () => {
  const navigate = useNavigate();
  
  // --- States الأساسية ---
  const [student, setStudent] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard'); 
  const [topStudents, setTopStudents] = useState([]);
  const [motivation, setMotivation] = useState("");
  
  // --- أنظمة التفاعل ---
  const [activationCode, setActivationCode] = useState("");
  const [newTask, setNewTask] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [toasts, setToasts] = useState([]);

  // --- نظام بومودورو ---
  const [timer, setTimer] = useState(1500);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  // مصفوفة الرسائل التحفيزية
  const quotes = useMemo(() => [
    "التميز ليس فعلاً، بل عادة.. استمر في دراستك!",
    "عقلك هو أقوى سلاح تملكه، قم بشحنه الآن.",
    "كل درس تنهيه اليوم يجعلك أقرب لحلمك غداً.",
    "لا تدرس لتعبر الامتحان، ادرس لتغير العالم.",
    "الرصيد الحقيقي هو العلم الذي تبنيه في عقلك."
  ], []);

  // ==========================================
  // [1] محرك البيانات والربط (Firebase Core)
  // ==========================================
  
  useEffect(() => {
    if (!auth.currentUser) return navigate('/login');

    // 1. مراقبة بيانات المستخدم حياً
    const unsubUser = onSnapshot(doc(db, "users", auth.currentUser.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setStudent(data);
        handleDailyBonus(data);
      } else {
        // إنشاء بروفايل جديد إذا لم يوجد
        initializeNewStudent();
      }
    });

    // 2. جلب الأوائل
    const qLeaders = query(collection(db, "users"), orderBy("points", "desc"), limit(5));
    const unsubLeaders = onSnapshot(qLeaders, (snap) => {
      setTopStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 3. اختيار رسالة تحفيزية
    setMotivation(quotes[Math.floor(Math.random() * quotes.length)]);

    return () => { unsubUser(); unsubLeaders(); };
  }, [navigate, quotes]);

  const initializeNewStudent = async () => {
    await setDoc(doc(db, "users", auth.currentUser.uid), {
      name: auth.currentUser.displayName || "طالب مجتهد",
      email: auth.currentUser.email,
      points: 100,
      walletBalance: 0,
      streak: 1,
      lastLoginDate: new Date().toDateString(),
      todoList: [],
      photoURL: null,
      createdAt: serverTimestamp()
    });
  };

  const handleDailyBonus = async (data) => {
    const today = new Date().toDateString();
    if (data.lastLoginDate !== today) {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        lastLoginDate: today,
        streak: increment(1),
        points: increment(50)
      });
      addToast("مكافأة دخول يومي: +50 نقطة ✨", "success");
    }
  };

  // ==========================================
  // [2] نظام رفع الصور (Avatar System)
  // ==========================================
  
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1024 * 1024 * 3) return addToast("الصورة كبيرة جداً (الأقصى 3MB)", "error");

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `profiles/${auth.currentUser.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateDoc(doc(db, "users", auth.currentUser.uid), { photoURL: url });
      addToast("تم تحديث صورتك الشخصية بنجاح!", "success");
    } catch (err) {
      addToast("حدث خطأ أثناء الرفع", "error");
    }
    setIsUploading(false);
  };

  // ==========================================
  // [3] نظام المحفظة (Wallet Logic)
  // ==========================================
  
  const handleRedeem = async () => {
    if (!activationCode.trim()) return;
    
    try {
      const q = query(collection(db, "activationCodes"), where("code", "==", activationCode), where("isUsed", "==", false));
      const snap = await getDocs(q);

      if (snap.empty) return addToast("كود خاطئ أو تم استخدامه", "error");

      const codeDoc = snap.docs[0];
      const val = codeDoc.data().value;

      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        walletBalance: increment(val),
        points: increment(100)
      });

      await updateDoc(doc(db, "activationCodes", codeDoc.id), {
        isUsed: true,
        usedBy: student.email,
        usedAt: serverTimestamp()
      });

      setActivationCode("");
      addToast(`تم شحن ${val} ج.م في محفظتك بنجاح 🚀`, "success");
    } catch (err) {
      addToast("فشل تفعيل الكود", "error");
    }
  };

  // ==========================================
  // [4] نظام المهام (To-Do Logic)
  // ==========================================
  
  const addTask = async () => {
    if (!newTask.trim()) return;
    const task = { id: Date.now(), text: newTask, completed: false };
    await updateDoc(doc(db, "users", auth.currentUser.uid), {
      todoList: arrayUnion(task)
    });
    setNewTask("");
    addToast("تمت إضافة المهمة بنجاح", "info");
  };

  const toggleTask = async (task) => {
    const updated = student.todoList.map(t => t.id === task.id ? {...t, completed: !t.completed} : t);
    await updateDoc(doc(db, "users", auth.currentUser.uid), { todoList: updated });
    if (!task.completed) {
      await updateDoc(doc(db, "users", auth.currentUser.uid), { points: increment(10) });
      addToast("+10 XP لإنجازك المهمة!", "success");
    }
  };

  const removeTask = async (task) => {
    await updateDoc(doc(db, "users", auth.currentUser.uid), { todoList: arrayRemove(task) });
  };

  // ==========================================
  // [5] نظام بومودورو والوقت
  // ==========================================
  
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    } else if (timer === 0) {
      setIsTimerRunning(false);
      addToast("انتهت جلسة التركيز! +50 نقطة مكافأة ☕", "success");
      updateDoc(doc(db, "users", auth.currentUser.uid), { points: increment(50) });
      setTimer(1500);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timer]);

  const formatTime = (time) => {
    const m = Math.floor(time / 60);
    const s = time % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // ==========================================
  // Helpers
  // ==========================================
  
  const addToast = (msg, type) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const getRankData = (pts) => {
    if (pts > 5000) return { label: "أسطوري", color: "#ff00ff" };
    if (pts > 2000) return { label: "ذهبي", color: "#fbbf24" };
    if (pts > 1000) return { label: "فضي", color: "#94a3b8" };
    return { label: "مبتدئ", color: "#00d2ff" };
  };

  // ==========================================
  // [6] واجهة المستخدم (UI)
  // ==========================================

  return (
    <div className="student-nebula-app">
      
      {/* التنبيهات المنبثقة */}
      <div className="toast-container">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div key={t.id} initial={{y: 50, opacity: 0}} animate={{y: 0, opacity: 1}} exit={{opacity: 0}} className={`nebula-toast ${t.type}`}>
              {t.type === 'success' ? <ShieldCheck color="#00ff88"/> : <Bell color="#00d2ff"/>}
              <span>{t.msg}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* سايدبار التنقل */}
      <aside className="nebula-sidebar">
        <div className="brand-zone">
          <div className="glow-logo">M</div>
          <h2 style={{fontSize: '16px', letterSpacing: '2px', marginTop: '15px'}}>STUDENT DASH</h2>
        </div>

        <nav className="nav-links-container">
          <button className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <Layout size={20}/> الرئيسية
          </button>
          <button className={`nav-btn ${activeTab === 'wallet' ? 'active' : ''}`} onClick={() => setActiveTab('wallet')}>
            <Wallet size={20}/> المحفظة
          </button>
          <button className={`nav-btn ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>
            <ListChecks size={20}/> المهام
          </button>
          <button className={`nav-btn ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => setActiveTab('leaderboard')}>
            <Trophy size={20}/> المتصدرين
          </button>
        </nav>

        <div className="pomo-mini-card nebula-card" style={{marginTop: 'auto', padding: '15px'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <span style={{fontSize: '18px', fontWeight: '800'}}>{formatTime(timer)}</span>
            <button onClick={() => setIsTimerRunning(!isTimerRunning)} style={{background: 'none', border: 'none', color: '#fff', cursor:'pointer'}}>
              {isTimerRunning ? <X size={20}/> : <PlayCircle size={20}/>}
            </button>
          </div>
          <button onClick={() => setFocusMode(true)} style={{width: '100%', marginTop: '10px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '10px', color: '#fff', padding: '5px'}}>تركيز كامل</button>
        </div>

        <button className="nav-btn" onClick={() => auth.signOut()} style={{marginTop: '20px', color: '#ff4b2b'}}>
          <Power size={20}/> خروج
        </button>
      </aside>

      {/* المحتوى الرئيسي */}
      <main className="nebula-main-layout">
        
        <header className="cosmic-header">
          <div className="user-profile-meta">
            <label className="avatar-orbital">
              <input type="file" hidden onChange={handlePhotoUpload} accept="image/*" />
              <img src={student?.photoURL || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${student?.name}`} alt="avatar" />
              {isUploading && <div className="orbital-loader"></div>}
              <div className="online-dot"></div>
              <div className="camera-overlay" style={{position:'absolute', inset: 0, display:'flex', alignItems:'center', justifyContent:'center', opacity: 0, hover: {opacity: 1}}}>
                <Camera size={20} />
              </div>
            </label>
            <div>
              <h3 style={{margin: 0}}>مرحباً، {student?.name} 👋</h3>
              <p style={{margin: 0, fontSize: '13px', color: 'var(--accent-blue)'}}><Sparkles size={14}/> {motivation}</p>
            </div>
          </div>

          <div style={{display: 'flex', gap: '15px'}}>
             <div className="nebula-card" style={{padding: '10px 20px', display: 'flex', gap: '10px', alignItems: 'center'}}>
                <Zap size={18} fill="#ffcc00" color="#ffcc00"/> {student?.points} XP
             </div>
             <div className="nebula-card" style={{padding: '10px 20px', display: 'flex', gap: '10px', alignItems: 'center'}}>
                <Flame size={18} fill="#ff4b2b" color="#ff4b2b"/> {student?.streak} أيام
             </div>
          </div>
        </header>

        <section className="tab-render-area">
          <AnimatePresence mode="wait">
            
            {/* التبويب 1: الرئيسية */}
            {activeTab === 'dashboard' && (
              <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="dashboard-grid">
                <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px'}}>
                  
                  <div className="nebula-card">
                    <h3><Target size={20}/> تقدمك التعليمي</h3>
                    <div style={{height: '10px', background: '#111', borderRadius: '10px', overflow:'hidden', marginTop: '20px'}}>
                      <div style={{width: `${(student?.points % 1000) / 10}%`, height: '100%', background: 'linear-gradient(90deg, #00d2ff, #9d50bb)', boxShadow: '0 0 15px #00d2ff'}}></div>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '10px'}}>
                      <span style={{color: getRankData(student?.points).color}}>{getRankData(student?.points).label}</span>
                      <span>{student?.points % 1000} / 1000 XP</span>
                    </div>
                  </div>

                  <div className="nebula-card" style={{textAlign: 'center'}}>
                    <h3>المحفظة</h3>
                    <div style={{fontSize: '32px', fontWeight: '800', margin: '10px 0'}}>{student?.walletBalance} <small>ج.م</small></div>
                    <button className="redeem-btn" onClick={() => setActiveTab('wallet')} style={{width: '100%'}}>إدارة الرصيد</button>
                  </div>

                </div>

                <div className="nebula-card" style={{marginTop: '20px'}}>
                  <h3><Clock size={20}/> آخر النشاطات</h3>
                  <div style={{color: '#666', textAlign: 'center', padding: '40px'}}>لا توجد دروس مكتملة اليوم. الوقت يمر، ابدأ الآن!</div>
                </div>
              </motion.div>
            )}

            {/* التبويب 2: المحفظة */}
            {activeTab === 'wallet' && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} className="wallet-view">
                <div className="nebula-card wallet-hero">
                  <Wallet size={60} color="var(--accent-blue)" style={{marginBottom: '20px'}}/>
                  <h2>محفظتي الذكية</h2>
                  <div className="balance-large">{student?.walletBalance} <small>EGP</small></div>
                  
                  <div className="redeem-box">
                    <input 
                      placeholder="أدخل كود الشحن (مثل: XXXX-XXXX)" 
                      value={activationCode}
                      onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
                    />
                    <button className="redeem-btn" onClick={handleRedeem}>شحن الآن</button>
                  </div>
                  <p style={{color: '#666', fontSize: '13px'}}>يمكنك شراء الكورسات والكتب باستخدام رصيد محفظتك مباشرة.</p>
                </div>
              </motion.div>
            )}

            {/* التبويب 3: المهام */}
            {activeTab === 'tasks' && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} className="todo-view">
                <div className="nebula-card">
                  <h3><ListChecks size={20}/> قائمة المهام الدراسية</h3>
                  <div className="redeem-box" style={{margin: '0 0 30px'}}>
                    <input 
                      placeholder="أضف مهمة جديدة... (مثلاً: مذاكرة الكيمياء)" 
                      value={newTask}
                      onChange={(e) => setNewTask(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTask()}
                    />
                    <button className="redeem-btn" onClick={addTask}><Plus /></button>
                  </div>

                  <div className="todo-wrapper">
                    {student?.todoList?.map((t) => (
                      <div key={t.id} className={`task-card ${t.completed ? 'completed' : ''}`}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer', flex: 1}} onClick={() => toggleTask(t)}>
                          {t.completed ? <CheckCircle color="var(--neon-green)"/> : <div style={{width: 20, height: 20, border: '2px solid #444', borderRadius: '50%'}}></div>}
                          <span>{t.text}</span>
                        </div>
                        <Trash2 size={18} color="#ff4b2b" style={{cursor: 'pointer'}} onClick={() => removeTask(t)}/>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* التبويب 4: الأوائل */}
            {activeTab === 'leaderboard' && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}}>
                <div className="nebula-card">
                  <h3><Trophy size={20}/> قائمة الشرف (أفضل 5 طلاب)</h3>
                  <div style={{marginTop: '20px'}}>
                    {topStudents.map((s, i) => (
                      <div key={s.id} className="task-card" style={{marginBottom: '10px', background: s.id === auth.currentUser.uid ? 'rgba(0, 210, 255, 0.1)' : ''}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                          <span style={{fontWeight: '800', width: '30px'}}>{i+1}</span>
                          <img src={s.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${s.name}`} alt="" style={{width: 40, height: 40, borderRadius: '50%'}}/>
                          <span>{s.name}</span>
                        </div>
                        <div style={{fontWeight: '800', color: 'var(--accent-blue)'}}>{s.points} XP</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </section>
      </main>

      {/* شاشة وضع التركيز الكامل */}
      <AnimatePresence>
        {focusMode && (
          <motion.div initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="focus-mode-active">
            <div className="big-timer">{formatTime(timer)}</div>
            <h2 style={{letterSpacing: '5px'}}>DEEP FOCUS MODE</h2>
            <p style={{color: '#666'}}>لا مشتتات، لا إشعارات.. فقط أنت ومستقبلك.</p>
            <button onClick={() => setFocusMode(false)} style={{marginTop: '40px', background: 'transparent', border: '1px solid #ff4b2b', color: '#ff4b2b', padding: '10px 40px', borderRadius: '15px', cursor: 'pointer'}}>إنهاء الجلسة</button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default StudentDash;
