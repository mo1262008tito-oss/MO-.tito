import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { 
  doc, onSnapshot, updateDoc, arrayUnion, 
  increment, getDocs, collection, query, where, orderBy, limit, serverTimestamp 
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layout, Book, Target, Zap, Power, Search, X, 
  CheckCircle, Award, Database, MessageSquare, PlayCircle,
  BookOpen, Star, Clock, Flame, ChevronLeft, Trash2, Key, Trophy, Bell, Settings, Coffee
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

      // 2. جلب كل الكورسات المتوفرة
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
      triggerNotif("انتهت جلسة التركيز! استحق استراحة ☕", "success");
      // منح الطالب نقاط لإنهاء جلسة تركيز
      handleGrantPoints(50);
    }
    return () => clearInterval(interval);
  }, [isActive, minutes, seconds]);

  const triggerNotif = (msg, type = "info") => {
    setNotif({ show: true, msg, type });
    setTimeout(() => setNotif({ ...notif, show: false }), 4000);
  };

  const handleGrantPoints = async (pts) => {
    const userRef = doc(db, "users", auth.currentUser.uid);
    await updateDoc(userRef, { points: increment(pts) });
  };

  const handleActivateCode = async () => {
    if (!activationCode) return;
    try {
        const q = query(collection(db, "activationCodes"), where("code", "==", activationCode), where("isUsed", "==", false));
        const snap = await getDocs(q);

        if (snap.empty) {
          triggerNotif("❌ الكود غير صحيح أو مستخدم مسبقاً", "error");
          return;
        }

        const codeDoc = snap.docs[0];
        const { targetId } = codeDoc.data();

        await updateDoc(doc(db, "users", auth.currentUser.uid), {
          enrolledContent: arrayUnion(targetId),
          points: increment(500)
        });

        await updateDoc(doc(db, "activationCodes", codeDoc.id), {
          isUsed: true,
          usedBy: auth.currentUser.email,
          activatedAt: serverTimestamp()
        });

        setActivationCode("");
        triggerNotif("🚀 تم تفعيل الكورس! تفقد مكتبتك الآن", "success");
    } catch (e) { triggerNotif("حدث خطأ في الاتصال", "error"); }
  };

  const addTask = async () => {
    if(!taskText.trim()) return;
    const ref = doc(db, "users", auth.currentUser.uid);
    await updateDoc(ref, { 
        tasks: arrayUnion({ id: Date.now(), text: taskText, completed: false }) 
    });
    setTaskText("");
    triggerNotif("تم إضافة مهمة جديدة 📝");
  };

  if (!student) return <div className="nebula-loading"><span>جاري مزامنة بيانات البطل...</span></div>;

  return (
    <div className={`student-nebula-root ${isActive ? 'focus-mode-active' : ''}`}>
      
      {/* 🔔 Smart Notification System */}
      <AnimatePresence>
        {notif.show && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 20, opacity: 1 }} exit={{ y: -50 }} className={`floating-notif ${notif.type}`}>
            {notif.type === 'success' ? <CheckCircle size={18}/> : <Zap size={18} />}
            {notif.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🛸 Navigation Sidebar */}
      <aside className="side-dock-v2">
        <div className="dock-brand"><Trophy className="brand-icon" /></div>
        <nav className="dock-nav">
          <button className={activeTab === 'my-courses' ? 'active' : ''} onClick={() => setActiveTab('my-courses')}><Layout /><span className="tooltip">مكتبتي</span></button>
          <button className={activeTab === 'store' ? 'active' : ''} onClick={() => setActiveTab('store')}><Database /><span className="tooltip">المتجر</span></button>
          <button className={activeTab === 'leaderboard' ? 'active' : ''} onClick={() => setActiveTab('leaderboard')}><Trophy /><span className="tooltip">الأوائل</span></button>
        </nav>
        <div className="dock-footer">
          <button className="settings-btn"><Settings /></button>
          <button className="logout-btn" onClick={() => auth.signOut()}><Power /></button>
        </div>
      </aside>

      <main className="nebula-main">
        {/* 🏆 Header Profile Hub */}
        <header className="nebula-top-bar">
          <div className="user-profile-info">
            <div className="avatar-wrapper">
              <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${student.email}`} alt="avatar" />
              <div className="streak-tag"><Flame size={12} fill="#ff4b2b" /> {student.streak || 1}</div>
            </div>
            <div className="user-details">
              <h2>مرحباً، {student.name.split(' ')[0]} 🔥</h2>
              <div className="level-system">
                <span className="lvl-text">مستوى {Math.floor((student.points || 0) / 1000) + 1}</span>
                <div className="lvl-progress-bar">
                   <motion.div initial={{width: 0}} animate={{width: `${(student.points % 1000) / 10}%`}} className="lvl-fill" />
                </div>
                <span className="xp-text">{student.points || 0} XP</span>
              </div>
            </div>
          </div>

          <div className="top-actions">
            <div className="activation-input-group">
                <Key size={16} className="key-icon" />
                <input value={activationCode} onChange={(e)=>setActivationCode(e.target.value)} placeholder="كود التفعيل..." />
                <button onClick={handleActivateCode}>تفعيل</button>
            </div>
            <div className="points-display">
                <Star size={18} fill="#ffd700" color="#ffd700" />
                <span>{student.points || 0}</span>
            </div>
          </div>
        </header>

        <div className="nebula-grid-content">
          {/* 📍 Left: Main Content Area */}
          <div className="content-primary">
            <AnimatePresence mode="wait">
              {activeTab === 'my-courses' && (
                <motion.div key="courses" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="tab-panel">
                  <div className="panel-header">
                    <h3><BookOpen /> محاضراتك المشترك بها</h3>
                  </div>
                  <div className="premium-courses-list">
                    {availableCourses.filter(c => student.enrolledContent?.includes(c.id)).length > 0 ? (
                        availableCourses.filter(c => student.enrolledContent?.includes(c.id)).map(course => (
                        <div key={course.id} className="nebula-course-card" onClick={() => navigate(`/video-player/${course.id}`)}>
                            <div className="c-thumb" style={{backgroundImage: `url(${course.thumbnail})`}}>
                                <div className="c-overlay"><PlayCircle size={40} /></div>
                            </div>
                            <div className="c-info">
                                <h4>{course.title}</h4>
                                <p>{course.instructor || "أ. محمود فرج"}</p>
                                <div className="c-meta">
                                    <span><Clock size={12}/> {course.duration || '2h'}</span>
                                    <span>المستوى: {course.grade || 'عام'}</span>
                                </div>
                            </div>
                        </div>
                        ))
                    ) : (
                        <div className="empty-state-card">لم تشترك في أي كورسات بعد.</div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'leaderboard' && (
                <motion.div key="leaderboard" initial={{opacity:0}} animate={{opacity:1}} className="tab-panel">
                  <div className="leaderboard-container glass">
                     <div className="leader-header">
                        <Award size={32} color="#ffd700" />
                        <h3>قائمة العباقرة</h3>
                     </div>
                     <div className="leader-list">
                        {topStudents.map((s, i) => (
                          <div key={s.id} className={`leader-row ${i < 3 ? `top-${i+1}` : ''} ${s.id === auth.currentUser.uid ? 'is-me' : ''}`}>
                             <div className="l-rank">
                                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}
                             </div>
                             <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${s.email}`} alt="" />
                             <div className="l-name">{s.name} {s.id === auth.currentUser.uid && '(أنت)'}</div>
                             <div className="l-pts">{s.points} XP</div>
                          </div>
                        ))}
                     </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 📍 Right: Toolset Sidebar */}
          <div className="content-secondary">
             {/* Pomodoro Timer */}
             <div className="nebula-tool-card pomodoro-v2">
                <div className="tool-head">
                    <Clock size={18} />
                    <span>مؤقت التركيز</span>
                </div>
                <div className="timer-main">
                    <svg className="timer-svg" viewBox="0 0 100 100">
                        <circle className="timer-bg" cx="50" cy="50" r="45" />
                        <motion.circle 
                            className="timer-progress" cx="50" cy="50" r="45" 
                            style={{ pathLength: (minutes * 60 + seconds) / (25 * 60) }}
                        />
                    </svg>
                    <div className="timer-digits">{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</div>
                </div>
                <div className="timer-btns">
                    <button onClick={() => setIsActive(!isActive)} className={isActive ? 'btn-pause' : 'btn-play'}>
                        {isActive ? 'إيقاف مؤقت' : 'ابدأ التركيز'}
                    </button>
                    <button onClick={() => {setIsActive(false); setMinutes(25); setSeconds(0);}} className="btn-reset">إعادة</button>
                </div>
             </div>

             {/* Missions / Tasks */}
             <div className="nebula-tool-card missions-v2">
                <div className="tool-head">
                    <Target size={18} />
                    <span>أهدافي اليومية</span>
                </div>
                <div className="mission-input">
                    <input value={taskText} onChange={(e)=>setTaskText(e.target.value)} placeholder="ماذا ستنجز اليوم؟" onKeyPress={(e) => e.key === 'Enter' && addTask()} />
                    <button onClick={addTask}><Plus size={18}/></button>
                </div>
                <div className="mission-list">
                    {student.tasks?.slice(-4).map(t => (
                        <div key={t.id} className={`m-item ${t.completed ? 'completed' : ''}`}>
                            <div className="m-check" onClick={() => {/* وظيفة التبديل */}}><CheckCircle size={16}/></div>
                            <span className="m-text">{t.text}</span>
                        </div>
                    ))}
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// أيقونة الزائد غير موجودة في الاستيراد، أضفتها هنا للاحتياط
const Plus = ({size}) => <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>;

export default StudentDash;

