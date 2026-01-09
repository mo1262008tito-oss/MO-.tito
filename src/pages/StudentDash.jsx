import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { 
  doc, onSnapshot, updateDoc, arrayUnion, 
  increment, getDocs, collection, query, where, orderBy, limit, serverTimestamp, getDoc 
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layout, Power, CheckCircle, Award, PlayCircle, Calendar, Trash2,
  BookOpen, Clock, Flame, Key, Trophy, ShoppingBag, GraduationCap, Zap, Target, Plus, Check, ListChecks,
  Wallet, ShieldCheck, MessageSquare, StickyNote, DownloadCloud, AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './StudentDash.css';

const StudentDash = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [activeTab, setActiveTab] = useState('my-courses'); 
  const [taskText, setTaskText] = useState("");
  const [notif, setNotif] = useState({ show: false, msg: "", type: "info" });
  const [availableCourses, setAvailableCourses] = useState([]);
  const [activationCode, setActivationCode] = useState("");
  const [topStudents, setTopStudents] = useState([]);
  
  // --- أنظمة جديدة ---
  const [studyDay, setStudyDay] = useState(""); 
  const [studySubject, setStudySubject] = useState("");
  const [pomoMode, setPomoMode] = useState('work'); 
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (auth.currentUser) {
      // 1. مراقبة بيانات الطالب + فحص الأمان (الجهاز)
      const unsub = onSnapshot(doc(db, "users", auth.currentUser.uid), (d) => {
        if (d.exists()) {
          const data = d.data();
          setStudent(data);
          checkSecurity(data); // ميزة الأمان
        }
      });

      // 2. جلب المتجر
      const fetchStore = async () => {
        const q = collection(db, "courses_metadata");
        const snap = await getDocs(q);
        setAvailableCourses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      };

      // 3. لوحة الأوائل
      const fetchLeaders = () => {
        const q = query(collection(db, "users"), orderBy("points", "desc"), limit(10));
        onSnapshot(q, (snap) => {
          setTopStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
      };
      
      fetchStore();
      fetchLeaders();
      return () => unsub();
    }
  }, []);

  // --- [ميزة 1] نظام الأمان: فحص بصمة الجهاز ---
  const checkSecurity = (userData) => {
    // كود افتراضي للحصول على معرف الجهاز (في المتصفح نستخدم الـ User Agent كمثال بسيط)
    const currentDevice = navigator.userAgent; 
    if (userData.deviceId && userData.deviceId !== currentDevice) {
       if (userData.secondDeviceId && userData.secondDeviceId !== currentDevice) {
          triggerNotif("تنبيه أمني: لا يمكنك الدخول من جهاز ثالث!", "error");
          // auth.signOut(); // يمكنك تفعيل هذا السطر لطرده تلقائياً
       }
    }
  };

  // --- [ميزة 2] نظام المحفظة والشحن بالأكواد ---
  const handleActivateCode = async () => {
    if(!activationCode) return;
    setActivationCode("");
    
    // البحث عن الكود في قاعدة البيانات
    const q = query(collection(db, "activationCodes"), where("code", "==", activationCode), where("isUsed", "==", false));
    const snap = await getDocs(q);

    if(snap.empty) return triggerNotif("الكود غير صحيح أو مستخدم مسبقاً", "error");

    const codeDoc = snap.docs[0];
    const codeData = codeDoc.data();

    try {
      if(codeData.type === 'wallet') {
        // شحن رصيد
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
          walletBalance: increment(codeData.amount),
          transactions: arrayUnion({ type: 'charge', amount: codeData.amount, date: new Date().toISOString() })
        });
        triggerNotif(`تم شحن ${codeData.amount} جنيهاً بنجاح!`, "success");
      } else {
        // تفعيل كورس مباشر
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
          enrolledContent: arrayUnion(codeData.targetId)
        });
        triggerNotif("مبروك! تم تفعيل الكورس بنجاح", "success");
      }
      await updateDoc(doc(db, "activationCodes", codeDoc.id), { isUsed: true, usedBy: auth.currentUser.email });
    } catch(e) { triggerNotif("حدث خطأ في التفعيل", "error"); }
  };

  // --- [ميزة 3] شراء كورس من المحفظة ---
  const buyCourse = async (course) => {
    const price = parseInt(course.price);
    if(student.walletBalance < price) return triggerNotif("رصيدك غير كافٍ، اشحن محفظتك أولاً", "error");

    if(window.confirm(`هل تريد شراء ${course.title} بـ ${price} جنيه؟`)) {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        walletBalance: increment(-price),
        enrolledContent: arrayUnion(course.id),
        transactions: arrayUnion({ type: 'buy', item: course.title, amount: price, date: new Date().toISOString() })
      });
      triggerNotif("تم الشراء بنجاح، استمتع بالمذاكرة!", "success");
    }
  };

  // --- بومودورو والمهام (المنطق الأصلي مع تطوير النقاط) ---
  useEffect(() => {
    let interval = null;
    if (isActive && (minutes > 0 || seconds > 0)) {
      interval = setInterval(() => {
        if (seconds === 0) { setMinutes(m => m - 1); setSeconds(59); }
        else { setSeconds(s => s - 1); }
      }, 1000);
    } else if (minutes === 0 && seconds === 0) {
      setIsActive(false);
      const isWork = pomoMode === 'work';
      if(isWork) handleGrantPoints(50);
      setPomoMode(isWork ? 'break' : 'work');
      setMinutes(isWork ? 5 : 25);
    }
    return () => clearInterval(interval);
  }, [isActive, minutes, seconds, pomoMode]);

  const triggerNotif = (msg, type = "info") => {
    setNotif({ show: true, msg, type });
    setTimeout(() => setNotif(prev => ({ ...prev, show: false })), 4000);
  };

  const handleGrantPoints = async (pts) => {
    await updateDoc(doc(db, "users", auth.currentUser.uid), { points: increment(pts) });
  };

  const addTask = async () => {
    if(!taskText.trim()) return;
    await updateDoc(doc(db, "users", auth.currentUser.uid), { 
        tasks: arrayUnion({ id: Date.now(), text: taskText, completed: false, createdAt: new Date().toISOString() }) 
    });
    setTaskText("");
    triggerNotif("تمت إضافة المهمة للرادار 🚀");
  };

  const toggleTask = async (taskId) => {
    const updatedTasks = student.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
    await updateDoc(doc(db, "users", auth.currentUser.uid), { tasks: updatedTasks });
    if (!student.tasks.find(t => t.id === taskId).completed) {
      handleGrantPoints(15);
      triggerNotif("إنجاز رائع! +15 XP", "success");
    }
  };

  const addStudySchedule = async () => {
    if(!studyDay || !studySubject) return triggerNotif("أكمل بيانات الجدول", "error");
    await updateDoc(doc(db, "users", auth.currentUser.uid), { 
        studySchedule: arrayUnion({ id: Date.now(), day: studyDay, subject: studySubject }) 
    });
    setStudySubject("");
    triggerNotif("تم تحديث جدولك الأسبوعي 📅");
  };

  const getRank = (pts = 0) => {
    if (pts > 5000) return { title: "أسطورة فيزيائية", color: "#ff007a", icon: <Award /> };
    if (pts > 2000) return { title: "محارب متقدم", color: "#7000ff", icon: <Zap /> };
    return { title: "طالب طموح", color: "#00f2ff", icon: <Target /> };
  };

  if (!student) return <div className="nebula-loading"><Zap className="spin-icon" size={40} color="#00f2ff" /><span>جاري شحن طاقة البطل...</span></div>;

  return (
    <div className={`student-nebula-root ${isActive ? 'focus-mode-active' : ''}`}>
      
      {/* التنبيهات الملونة */}
      <AnimatePresence>
        {notif.show && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 20, opacity: 1 }} exit={{ y: -50 }} className={`floating-notif-v2 ${notif.type}`}>
            {notif.type === 'success' ? <CheckCircle size={18}/> : <AlertTriangle size={18}/>}
            {notif.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <aside className="side-dock-v2">
        <div className="dock-brand"><div className="inner-glow"><Zap size={24} fill="#00f2ff" /></div></div>
        <nav className="dock-nav">
          <button className={activeTab === 'my-courses' ? 'active' : ''} onClick={() => setActiveTab('my-courses')}><Layout /><span className="tooltip">مكتبتي</span></button>
          <button className={activeTab === 'store' ? 'active' : ''} onClick={() => setActiveTab('store')}><ShoppingBag /><span className="tooltip">المتجر</span></button>
          <button className={activeTab === 'wallet' ? 'active' : ''} onClick={() => setActiveTab('wallet')}><Wallet /><span className="tooltip">المحفظة</span></button>
          <button className={activeTab === 'schedule' ? 'active' : ''} onClick={() => setActiveTab('schedule')}><Calendar /><span className="tooltip">الجدول</span></button>
          <button className={activeTab === 'leaderboard' ? 'active' : ''} onClick={() => setActiveTab('leaderboard')}><Trophy /><span className="tooltip">الأوائل</span></button>
        </nav>
        <div className="dock-footer">
          <button className="support-btn" onClick={() => window.open('https://wa.me/YOUR_NUMBER')}><MessageSquare /></button>
          <button className="logout-btn" onClick={() => auth.signOut()}><Power /></button>
        </div>
      </aside>

      <main className="nebula-main">
        <header className="nebula-top-bar-v2">
          <div className="user-profile-info">
            <div className="avatar-container">
              <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${student?.email}`} alt="avatar" />
              <div className="online-indicator"></div>
            </div>
            <div className="user-details">
              <h2>{getRank(student.points).title}: {student?.name?.split(' ')[0]} 🔥</h2>
              <div className="xp-container">
                 <div className="xp-bar-bg"><motion.div className="xp-bar-fill" style={{background: getRank(student.points).color}} animate={{width: `${(student?.points % 1000) / 10}%`}} /></div>
                 <span className="xp-counter">{student?.points} XP</span>
              </div>
            </div>
          </div>

          <div className="wallet-quick-view glass">
             <Wallet size={16} color="gold" />
             <span>{student.walletBalance || 0} EGP</span>
          </div>

          <div className="nebula-quick-activation">
              <Key size={18} />
              <input value={activationCode} onChange={(e)=>setActivationCode(e.target.value)} placeholder="كود تفعيل أو شحن..." />
              <button onClick={handleActivateCode}>تفعيل</button>
          </div>
        </header>

        <div className="nebula-grid-layout">
          <section className="main-viewport">
            <AnimatePresence mode="wait">
              
              {/* تبويب محاضراتي */}
              {activeTab === 'my-courses' && (
                <motion.div key="courses" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="nebula-panel">
                  <div className="section-title"><BookOpen size={20} /> محاضراتي الدراسية</div>
                  <div className="courses-grid-v2">
                    {availableCourses.filter(c => student?.enrolledContent?.includes(c.id)).map(course => (
                      <div key={course.id} className="course-card-v2" onClick={() => navigate(`/video-player/${course.id}`)}>
                        <div className="card-media" style={{backgroundImage: `url(${course.thumbnail})`}}>
                          <div className="play-btn-v2"><PlayCircle /></div>
                          {student.watchedSeconds?.[course.id] && <div className="progress-tag">متابعة المشاهدة</div>}
                        </div>
                        <div className="card-body">
                          <h4>{course.title}</h4>
                          <p>{course.subject} - {course.grade}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* تبويب المتجر */}
              {activeTab === 'store' && (
                <motion.div key="store" initial={{opacity:0}} animate={{opacity:1}} className="nebula-panel">
                  <div className="section-title"><ShoppingBag size={20} /> متجر الكورسات</div>
                  <div className="courses-grid-v2">
                    {availableCourses.filter(c => !student?.enrolledContent?.includes(c.id)).map(course => (
                      <div key={course.id} className="course-card-v2 store-item">
                        <div className="card-media" style={{backgroundImage: `url(${course.thumbnail})`}}></div>
                        <div className="card-body">
                          <h4>{course.title}</h4>
                          <div className="price-tag">{course.price} EGP</div>
                          <button className="buy-btn" onClick={() => buyCourse(course)}>شراء الآن</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* تبويب المحفظة (الجديد) */}
              {activeTab === 'wallet' && (
                <motion.div key="wallet" initial={{opacity:0}} animate={{opacity:1}} className="nebula-panel">
                   <div className="section-title"><Wallet size={20} /> محفظتي المالية</div>
                   <div className="wallet-dashboard glass">
                      <div className="balance-big">
                        <small>الرصيد الحالي</small>
                        <h1>{student.walletBalance || 0} <small>EGP</small></h1>
                      </div>
                      <div className="transaction-history">
                        <h4>آخر العمليات</h4>
                        {student.transactions?.slice().reverse().map((t, i) => (
                          <div key={i} className="t-row">
                            <span>{t.type === 'charge' ? 'شحن رصيد' : `شراء ${t.item}`}</span>
                            <span className={t.type === 'charge' ? 'plus' : 'minus'}>
                              {t.type === 'charge' ? '+' : '-'}{t.amount} EGP
                            </span>
                          </div>
                        ))}
                      </div>
                   </div>
                </motion.div>
              )}

              {/* تبويب الجدول */}
              {activeTab === 'schedule' && (
                <motion.div key="schedule" initial={{opacity:0}} animate={{opacity:1}} className="nebula-panel">
                   <div className="section-title"><Calendar size={20} /> مخطط المذاكرة الأسبوعي</div>
                   <div className="schedule-creator glass">
                      <select value={studyDay} onChange={e => setStudyDay(e.target.value)}>
                        <option value="">اختر اليوم</option>
                        {['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <input placeholder="اسم المادة أو الدرس..." value={studySubject} onChange={e => setStudySubject(e.target.value)} />
                      <button onClick={addStudySchedule}><Plus size={18} /> إضافة</button>
                   </div>
                   <div className="schedule-grid">
                      {student?.studySchedule?.map(item => (
                        <div key={item.id} className="schedule-item">
                           <div className="s-day">{item.day}</div>
                           <div className="s-sub">{item.subject}</div>
                        </div>
                      ))}
                   </div>
                </motion.div>
              )}

              {/* تبويب المتفوقين */}
              {activeTab === 'leaderboard' && (
                <motion.div key="leaders" className="nebula-panel">
                   <div className="section-title"><Trophy size={20} /> لوحة شرف العباقرة</div>
                   <div className="leaders-list">
                      {topStudents.map((s, index) => (
                        <div key={s.id} className={`leader-item ${index < 3 ? 'top-three' : ''}`}>
                           <span className="rank">#{index + 1}</span>
                           <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${s.email}`} alt="" />
                           <span className="name">{s.name}</span>
                           <span className="pts">{s.points} XP</span>
                        </div>
                      ))}
                   </div>
                </motion.div>
              )}
              
            </AnimatePresence>
          </section>

          <aside className="secondary-viewport">
            {/* بومودورو */}
            <div className={`pomo-card-v2 ${pomoMode}`}>
              <div className="pomo-header">
                {pomoMode === 'work' ? <Target color="#ff4b2b" /> : <Clock color="#00f2ff" />}
                <span>{pomoMode === 'work' ? 'وقت التركيز' : 'وقت الاستراحة'}</span>
              </div>
              <div className="pomo-timer">{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</div>
              <button className="pomo-ctrl" onClick={() => setIsActive(!isActive)}>
                {isActive ? 'إيقاف مؤقت' : 'ابدأ الآن'}
              </button>
            </div>

            {/* مفكرة الطالب (جديد) */}
            <div className="todo-card-v2 notes-card">
              <div className="todo-header"><StickyNote size={18} /> <span>مفكرتي السريعة</span></div>
              <textarea placeholder="اكتب ملاحظة تهمك هنا..." className="notes-area"></textarea>
            </div>

            {/* قائمة المهام */}
            <div className="todo-card-v2">
              <div className="todo-header">
                <div className="h-left"><ListChecks size={20} /> <span>قائمة المهام</span></div>
                <div className="h-right">{student?.tasks?.filter(t => t.completed).length || 0}/{student?.tasks?.length || 0}</div>
              </div>
              <div className="todo-input-v2">
                <input value={taskText} onChange={(e)=>setTaskText(e.target.value)} placeholder="أضف مهمة..." onKeyPress={(e) => e.key === 'Enter' && addTask()} />
                <button onClick={addTask}><Plus size={20}/></button>
              </div>
              <div className="todo-list-v2">
                {student?.tasks?.slice().reverse().map(t => (
                  <motion.div layout key={t.id} className={`todo-item-v2 ${t.completed ? 'done' : ''}`}>
                    <div className="check-box" onClick={() => toggleTask(t.id)}>{t.completed && <Check size={14}/>}</div>
                    <span className="t-text">{t.text}</span>
                    <button className="t-del" onClick={() => {}}><Trash2 size={14}/></button>
                  </motion.div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default StudentDash;
