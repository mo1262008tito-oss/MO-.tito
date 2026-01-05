import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { 
  doc, onSnapshot, updateDoc, arrayUnion, 
  increment, getDoc, collection, query, where, getDocs, orderBy, limit 
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layout, Book, Target, Zap, Power, Search, X, 
  CheckCircle, Award, Database, MessageSquare, 
  BookOpen, Star, Clock, Flame, ChevronLeft, Trash2, Key, Trophy
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './StudentDash.css';

const StudentDash = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [activeTab, setActiveTab] = useState('my-courses'); 
  const [taskText, setTaskText] = useState("");
  const [notif, setNotif] = useState("");
  const [availableCourses, setAvailableCourses] = useState([]);
  const [activationCode, setActivationCode] = useState("");
  const [topStudents, setTopStudents] = useState([]);
  
  // مؤقت البومودورو المحسن
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (auth.currentUser) {
      // 1. بيانات الطالب اللحظية
      const unsub = onSnapshot(doc(db, "users", auth.currentUser.uid), (d) => {
        if (d.exists()) setStudent(d.data());
      });

      // 2. جلب كل الكورسات
      const fetchStore = async () => {
        const q = collection(db, "courses_metadata");
        const snap = await getDocs(q);
        setAvailableCourses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      };

      // 3. جلب أوائل الطلبة (Leaderboard)
      const fetchLeaders = () => {
        const q = query(collection(db, "users"), orderBy("points", "desc"), limit(5));
        onSnapshot(q, (snap) => {
          setTopStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
      };
      
      fetchStore();
      fetchLeaders();
      return () => unsub();
    }
  }, []);

  // منطق المؤقت (Pomodoro)
  useEffect(() => {
    let interval = null;
    if (isActive && (minutes > 0 || seconds > 0)) {
      interval = setInterval(() => {
        if (seconds === 0) { setMinutes(m => m - 1); setSeconds(59); }
        else { setSeconds(s => s - 1); }
      }, 1000);
    } else if (minutes === 0 && seconds === 0) {
      setIsActive(false);
      triggerNotif("انتهت جلسة التركيز! استحققت استراحة ☕");
    }
    return () => clearInterval(interval);
  }, [isActive, minutes, seconds]);

  const triggerNotif = (msg) => {
    setNotif(msg);
    setTimeout(() => setNotif(""), 4000);
  };

  // تفعيل الكود (الربط مع نظام الأكواد)
  const handleActivateCode = async () => {
    if (!activationCode) return;
    const q = query(collection(db, "activationCodes"), where("code", "==", activationCode), where("isUsed", "==", false));
    const snap = await getDocs(q);

    if (snap.empty) {
      triggerNotif("❌ الكود غير صحيح أو مستخدم مسبقاً");
      return;
    }

    const codeDoc = snap.docs[0];
    const { targetId, type } = codeDoc.data();

    // تحديث بيانات الطالب
    const userRef = doc(db, "users", auth.currentUser.uid);
    await updateDoc(userRef, {
      enrolledContent: arrayUnion(targetId),
      points: increment(500) // مكافأة تفعيل كود
    });

    // إبطال الكود
    await updateDoc(doc(db, "activationCodes", codeDoc.id), {
      isUsed: true,
      usedBy: auth.currentUser.email
    });

    setActivationCode("");
    triggerNotif("🚀 تم تفعيل الكورس بنجاح! تفقد مكتبتك");
  };

  const toggleTask = async (taskId) => {
    const updatedTasks = student.tasks.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    await updateDoc(doc(db, "users", auth.currentUser.uid), { tasks: updatedTasks });
  };

  if (!student) return <div className="loading-screen">جاري شحن مصفوفة القائد...</div>;

  return (
    <div className={`student-nebula-root ${isActive ? 'focus-mode' : ''}`}>
      
      <AnimatePresence>
        {notif && (
          <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100 }} className="smart-alert">
            <Zap size={20} /> {notif}
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="side-dock">
        <div className="dock-logo"><Trophy color="#00f2ff" /></div>
        <button className={activeTab === 'my-courses' ? 'active' : ''} onClick={() => setActiveTab('my-courses')}><Layout /></button>
        <button className={activeTab === 'store' ? 'active' : ''} onClick={() => setActiveTab('store')}><Database /></button>
        <button className={activeTab === 'leaderboard' ? 'active' : ''} onClick={() => setActiveTab('leaderboard')}><Trophy size={20}/></button>
        <div className="dock-bottom">
          <button onClick={() => auth.signOut()}><Power color="#ff4b2b" /></button>
        </div>
      </nav>

      <main className="nebula-container">
        <header className="nebula-header">
          <div className="profile-hub">
            <div className="avatar-shield">
              <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${student.email}`} alt="user" />
            </div>
            <div className="name-plate">
              <h1>بطل الفيزياء، {student.name || 'قائد'}</h1>
              <div className="badges-row">
                <span className="rank-badge">المستوى {Math.floor((student.points || 0) / 500) + 1}</span>
                <span className="points-badge"><Star size={12} /> {student.points || 0} طاقة</span>
              </div>
            </div>
          </div>

          <div className="activation-mini-box">
             <input value={activationCode} onChange={(e)=>setActivationCode(e.target.value)} placeholder="أدخل كود التفعيل..." />
             <button onClick={handleActivateCode}><Key size={16}/> تفعيل</button>
          </div>
        </header>

        <div className="main-grid-layout">
          <section className="content-core">
            <AnimatePresence mode="wait">
              
              {activeTab === 'my-courses' && (
                <motion.div key="my-courses" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="section-title"><h2>📚 محاضراتي الحالية</h2></div>
                  <div className="courses-grid-v2">
                    {availableCourses.filter(c => student.enrolledContent?.includes(c.id)).map(course => (
                      <div key={course.id} className="course-nebula-card" onClick={() => navigate(`/video-player/${course.id}`)}>
                        <div className="card-thumb" style={{backgroundImage: `url(${course.thumbnail})`}}>
                          <div className="play-overlay"><PlayCircle /></div>
                        </div>
                        <div className="card-details">
                          <h3>{course.title}</h3>
                          <p>{course.instructor || 'أ. محمود فرج'}</p>
                          <div className="course-progress-mini">
                             <div className="bar"><div className="fill" style={{width: '40%'}}></div></div>
                             <span>40%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'leaderboard' && (
                <motion.div key="leader" className="leaderboard-panel glass-card">
                   <div className="section-title"><h2>🏆 لوحة الشرف</h2></div>
                   {topStudents.map((s, index) => (
                     <div key={s.id} className={`leader-item ${s.id === auth.currentUser.uid ? 'me' : ''}`}>
                        <span className="rank">#{index + 1}</span>
                        <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${s.email}`} alt="" />
                        <span className="name">{s.name}</span>
                        <span className="pts">{s.points} XP</span>
                     </div>
                   ))}
                </motion.div>
              )}

            </AnimatePresence>
          </section>

          <aside className="nebula-tools">
            {/* Pomodoro */}
            <div className="tool-card pomodoro-nebula">
              <h3><Clock size={18} /> جلسة التركيز العميق</h3>
              <div className="time-display">{String(minutes).padStart(2,'0')}:{String(seconds).padStart(2,'0')}</div>
              <div className="timer-controls">
                 <button onClick={() => setIsActive(!isActive)} className={isActive ? 'stop' : 'start'}>
                    {isActive ? 'إيقاف' : 'بدء'}
                 </button>
                 <button onClick={() => {setIsActive(false); setMinutes(25); setSeconds(0);}}>إعادة</button>
              </div>
            </div>

            {/* To-Do List */}
            <div className="tool-card mission-control">
              <h3><CheckCircle size={18} /> قائمة المهام</h3>
              <div className="task-input">
                <input value={taskText} onChange={(e)=>setTaskText(e.target.value)} placeholder="أضف مهمة.." />
                <button onClick={async () => {
                    const ref = doc(db, "users", auth.currentUser.uid);
                    await updateDoc(ref, { tasks: arrayUnion({ id: Date.now(), text: taskText, completed: false }) });
                    setTaskText("");
                }}><ChevronLeft /></button>
              </div>
              <div className="task-list">
                {student.tasks?.map(t => (
                  <div key={t.id} className={`task-item ${t.completed ? 'done' : ''}`} onClick={() => toggleTask(t.id)}>
                    <span>{t.text}</span>
                    {t.completed && <CheckCircle size={14} color="#00f2ff" />}
                  </div>
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
