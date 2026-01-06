import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { 
  doc, onSnapshot, updateDoc, arrayUnion, 
  increment, getDocs, collection, query, where, orderBy, limit, serverTimestamp 
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layout, Power, CheckCircle, Award, PlayCircle, Calendar, Trash2,
  BookOpen, Clock, Flame, Key, Trophy, ShoppingBag, GraduationCap, Zap, Target, Plus, Check, ListChecks
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
  const [studyDay, setStudyDay] = useState(""); // لجدول المذاكرة
  const [studySubject, setStudySubject] = useState("");
  const [pomoMode, setPomoMode] = useState('work'); // 'work' or 'break'

  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (auth.currentUser) {
      const unsub = onSnapshot(doc(db, "users", auth.currentUser.uid), (d) => {
        if (d.exists()) setStudent(d.data());
      });

      const fetchStore = async () => {
        const q = collection(db, "courses_metadata");
        const snap = await getDocs(q);
        setAvailableCourses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      };

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

  // --- منطق البومودورو المطور ---
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
      triggerNotif(isWork ? "انتهت جلسة التركيز! استحق استراحة ☕" : "انتهت الاستراحة، هيا بنا نعود! 💪", "success");
      if(isWork) handleGrantPoints(50);
      
      // التبديل التلقائي
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
    const userRef = doc(db, "users", auth.currentUser.uid);
    await updateDoc(userRef, { points: increment(pts) });
  };

  // --- نظام المهام (To-Do) المطور ---
  const addTask = async () => {
    if(!taskText.trim()) return;
    const ref = doc(db, "users", auth.currentUser.uid);
    await updateDoc(ref, { 
        tasks: arrayUnion({ id: Date.now(), text: taskText, completed: false, createdAt: new Date().toISOString() }) 
    });
    setTaskText("");
    triggerNotif("تمت إضافة المهمة للرادار 🚀");
  };

  const toggleTask = async (taskId) => {
    const updatedTasks = student.tasks.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    await updateDoc(doc(db, "users", auth.currentUser.uid), { tasks: updatedTasks });
    const task = student.tasks.find(t => t.id === taskId);
    if (task && !task.completed) {
      handleGrantPoints(15);
      triggerNotif("إنجاز رائع! +15 XP", "success");
    }
  };

  const deleteTask = async (taskId) => {
    const updatedTasks = student.tasks.filter(t => t.id !== taskId);
    await updateDoc(doc(db, "users", auth.currentUser.uid), { tasks: updatedTasks });
  };

  // --- نظام جدول المذاكرة ---
  const addStudySchedule = async () => {
    if(!studyDay || !studySubject) return triggerNotif("أكمل بيانات الجدول", "error");
    const ref = doc(db, "users", auth.currentUser.uid);
    await updateDoc(ref, { 
        studySchedule: arrayUnion({ id: Date.now(), day: studyDay, subject: studySubject }) 
    });
    setStudySubject("");
    triggerNotif("تم تحديث جدولك الأسبوعي 📅");
  };

  const getRank = (pts = 0) => {
    if (pts > 5000) return { title: "أسطورة فيزيائية", color: "#ff007a" };
    if (pts > 2000) return { title: "محارب متقدم", color: "#7000ff" };
    return { title: "طالب طموح", color: "#00f2ff" };
  };

  if (!student) return <div className="nebula-loading"><Zap className="spin-icon" size={40} color="#00f2ff" /><span>جاري شحن طاقة البطل...</span></div>;

  return (
    <div className={`student-nebula-root ${isActive ? 'focus-mode-active' : ''}`}>
      
      {/* التنبيهات */}
      <AnimatePresence>
        {notif.show && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 20, opacity: 1 }} exit={{ y: -50 }} className={`floating-notif-v2 ${notif.type}`}>
            {notif.type === 'success' ? <CheckCircle size={18}/> : <Zap size={18}/>}
            {notif.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <aside className="side-dock-v2">
        <div className="dock-brand"><div className="inner-glow"><Zap size={24} fill="#00f2ff" /></div></div>
        <nav className="dock-nav">
          <button className={activeTab === 'my-courses' ? 'active' : ''} onClick={() => setActiveTab('my-courses')}><Layout /><span className="tooltip">مكتبتي</span></button>
          <button className={activeTab === 'store' ? 'active' : ''} onClick={() => setActiveTab('store')}><ShoppingBag /><span className="tooltip">المتجر</span></button>
          <button className={activeTab === 'schedule' ? 'active' : ''} onClick={() => setActiveTab('schedule')}><Calendar /><span className="tooltip">الجدول</span></button>
          <button className={activeTab === 'leaderboard' ? 'active' : ''} onClick={() => setActiveTab('leaderboard')}><Trophy /><span className="tooltip">الأوائل</span></button>
        </nav>
        <div className="dock-footer">
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
              <h2>بطل الفيزياء: {student?.name?.split(' ')[0]} 🔥</h2>
              <div className="xp-container">
                 <div className="xp-bar-bg"><motion.div className="xp-bar-fill" animate={{width: `${(student?.points % 1000) / 10}%`}} /></div>
                 <span className="xp-counter">{student?.points} XP</span>
              </div>
            </div>
          </div>

          <div className="nebula-quick-activation">
             <Key size={18} />
             <input value={activationCode} onChange={(e)=>setActivationCode(e.target.value)} placeholder="كود تفعيل المحاضرة..." />
             <button onClick={() => {}}>تفعيل</button>
          </div>
        </header>

        <div className="nebula-grid-layout">
          <section className="main-viewport">
            <AnimatePresence mode="wait">
              {activeTab === 'my-courses' && (
                <motion.div key="courses" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="nebula-panel">
                  <div className="section-title"><BookOpen size={20} /> محاضراتي الدراسية</div>
                  <div className="courses-grid-v2">
                    {availableCourses.filter(c => student?.enrolledContent?.includes(c.id)).map(course => (
                      <div key={course.id} className="course-card-v2" onClick={() => navigate(`/video-player/${course.id}`)}>
                        <div className="card-media" style={{backgroundImage: `url(${course.thumbnail})`}}>
                          <div className="play-btn-v2"><PlayCircle /></div>
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

              {activeTab === 'schedule' && (
                <motion.div key="schedule" initial={{opacity:0}} animate={{opacity:1}} className="nebula-panel">
                   <div className="section-title"><Calendar size={20} /> مخطط المذاكرة الأسبوعي</div>
                   <div className="schedule-creator glass">
                      <select value={studyDay} onChange={e => setStudyDay(e.target.value)}>
                        <option value="">اختر اليوم</option>
                        {['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <input placeholder="اسم المادة أو الدرس..." value={studySubject} onChange={e => setStudySubject(e.target.value)} />
                      <button onClick={addStudySchedule}><Plus size={18} /> إضافة للجدول</button>
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
              
              {/* بقية التبويبات (Store & Leaderboard) تتبع نفس النمط */}
            </AnimatePresence>
          </section>

          <aside className="secondary-viewport">
            {/* بومودورو مطور */}
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

            {/* To-Do List مطورة */}
            <div className="todo-card-v2">
              <div className="todo-header">
                <div className="h-left"><ListChecks size={20} /> <span>قائمة المهام</span></div>
                <div className="h-right">{student?.tasks?.filter(t => t.completed).length || 0}/{student?.tasks?.length || 0}</div>
              </div>
              <div className="todo-input-v2">
                <input value={taskText} onChange={(e)=>setTaskText(e.target.value)} placeholder="أضف مهمة جديدة..." onKeyPress={(e) => e.key === 'Enter' && addTask()} />
                <button onClick={addTask}><Plus size={20}/></button>
              </div>
              <div className="todo-list-v2">
                {student?.tasks?.slice().reverse().map(t => (
                  <motion.div layout key={t.id} className={`todo-item-v2 ${t.completed ? 'done' : ''}`}>
                    <div className="check-box" onClick={() => toggleTask(t.id)}>{t.completed && <Check size={14}/>}</div>
                    <span className="t-text">{t.text}</span>
                    <button className="t-del" onClick={() => deleteTask(t.id)}><Trash2 size={14}/></button>
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

