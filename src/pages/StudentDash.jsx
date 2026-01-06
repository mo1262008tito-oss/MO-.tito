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
  BookOpen, Star, Clock, Flame, ChevronLeft, Trash2, Key, Trophy, Bell, Settings, Coffee, ShoppingBag, GraduationCap
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

      // 2. جلب كل الكورسات المتوفرة (المتجر)
      const fetchStore = async () => {
        const q = collection(db, "courses_metadata");
        const snap = await getDocs(q);
        setAvailableCourses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      };

      // 3. جلب أوائل الطلبة (Leaderboard)
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
      handleGrantPoints(50);
    }
    return () => clearInterval(interval);
  }, [isActive, minutes, seconds]);

  const triggerNotif = (msg, type = "info") => {
    setNotif({ show: true, msg, type });
    setTimeout(() => setNotif(prev => ({ ...prev, show: false })), 4000);
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
        triggerNotif("🚀 تم تفعيل الكورس بنجاح!", "success");
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

  const toggleTask = async (taskId) => {
    const updatedTasks = student.tasks.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    const ref = doc(db, "users", auth.currentUser.uid);
    await updateDoc(ref, { tasks: updatedTasks });
    if (!student.tasks.find(t => t.id === taskId).completed) {
      handleGrantPoints(10);
      triggerNotif("أحسنت! +10 نقاط XP", "success");
    }
  };

  // تحديد الرتبة بناءً على النقاط
  const getRank = (pts) => {
    if (pts > 5000) return { title: "أسطورة فيزيائية", color: "#ff007a" };
    if (pts > 2000) return { title: "محارب متقدم", color: "#7000ff" };
    return { title: "طالب طموح", color: "#00f2ff" };
  };

  if (!student) return <div className="nebula-loading"><span>جاري مزامنة بيانات البطل...</span></div>;

  return (
    <div className={`student-nebula-root ${isActive ? 'focus-mode-active' : ''}`}>
      
      <AnimatePresence>
        {notif.show && (
          <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100 }} className={`floating-notif ${notif.type}`}>
            {notif.type === 'success' ? <CheckCircle size={18}/> : <Zap size={18} />}
            {notif.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <aside className="side-dock-v2">
        <div className="dock-brand"><Zap size={28} fill="#00f2ff" /></div>
        <nav className="dock-nav">
          <button className={activeTab === 'my-courses' ? 'active' : ''} onClick={() => setActiveTab('my-courses')}><Layout /><span className="tooltip">مكتبتي</span></button>
          <button className={activeTab === 'store' ? 'active' : ''} onClick={() => setActiveTab('store')}><ShoppingBag /><span className="tooltip">المتجر</span></button>
          <button className={activeTab === 'leaderboard' ? 'active' : ''} onClick={() => setActiveTab('leaderboard')}><Trophy /><span className="tooltip">الأوائل</span></button>
        </nav>
        <div className="dock-footer">
          <button className="logout-btn" onClick={() => auth.signOut()}><Power /></button>
        </div>
      </aside>

      <main className="nebula-main">
        <header className="nebula-top-bar">
          <div className="user-profile-info">
            <div className="avatar-wrapper">
              <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${student.email}`} alt="avatar" />
              <div className="streak-tag"><Flame size={12} fill="#ff4b2b" /> {student.streak || 1}</div>
            </div>
            <div className="user-details">
              <h2>يا هلا، {student.name.split(' ')[0]} 👋</h2>
              <div className="level-system">
                <span className="lvl-text" style={{color: getRank(student.points).color}}>{getRank(student.points).title}</span>
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
                <input value={activationCode} onChange={(e)=>setActivationCode(e.target.value)} placeholder="أدخل كود الاشتراك..." />
                <button onClick={handleActivateCode}>تفعيل</button>
            </div>
          </div>
        </header>

        <div className="nebula-grid-content">
          <div className="content-primary">
            <AnimatePresence mode="wait">
              {activeTab === 'my-courses' && (
                <motion.div key="courses" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="tab-panel">
                  <div className="panel-header">
                    <h3><BookOpen size={20} /> محاضراتك الحالية</h3>
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
                                <div className="c-meta">
                                    <span><GraduationCap size={14}/> {course.grade}</span>
                                    <span><Clock size={14}/> {course.duration || 'ساعتان'}</span>
                                </div>
                            </div>
                        </div>
                        ))
                    ) : (
                        <div className="empty-state-card glass">
                            <p>أنت لم تشترك في أي كورسات بعد. ابدأ رحلتك الآن!</p>
                            <button onClick={() => setActiveTab('store')}>تصفح المتجر</button>
                        </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'store' && (
                <motion.div key="store" initial={{opacity:0}} animate={{opacity:1}} className="tab-panel">
                  <div className="panel-header"><h3><ShoppingBag size={20} /> متجر المحاضرات</h3></div>
                  <div className="premium-courses-list">
                    {availableCourses.map(course => (
                        <div key={course.id} className="nebula-course-card store-item">
                            <div className="c-thumb" style={{backgroundImage: `url(${course.thumbnail})`}}>
                                <div className="price-tag">{course.price} EGP</div>
                            </div>
                            <div className="c-info">
                                <h4>{course.title}</h4>
                                <p className="c-desc">{course.description?.substring(0, 60)}...</p>
                                <button className="buy-btn" onClick={() => triggerNotif("استخدم كود التفعيل للاشتراك", "info")}>تفاصيل الاشتراك</button>
                            </div>
                        </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'leaderboard' && (
                <motion.div key="leaderboard" initial={{opacity:0}} animate={{opacity:1}} className="tab-panel">
                  <div className="leaderboard-container glass">
                     <div className="leader-header"><h3><Trophy size={24} color="#ffd700" /> قائمة عباقرة الفيزياء</h3></div>
                     <div className="leader-list">
                        {topStudents.map((s, i) => (
                          <div key={s.id} className={`leader-row ${i < 3 ? `top-${i+1}` : ''} ${s.id === auth.currentUser.uid ? 'is-me' : ''}`}>
                             <div className="l-rank">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}</div>
                             <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${s.email}`} alt="" />
                             <div className="l-name">{s.name}</div>
                             <div className="l-pts">{s.points} XP</div>
                          </div>
                        ))}
                     </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="content-secondary">
             <div className="nebula-tool-card pomodoro-v2">
                <div className="tool-head"><Clock size={18} /><span>مؤقت التركيز (بومودورو)</span></div>
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
                        {isActive ? 'إيقاف' : 'ابدأ الآن'}
                    </button>
                    <button onClick={() => {setIsActive(false); setMinutes(25); setSeconds(0);}} className="btn-reset">إعادة</button>
                </div>
             </div>

             <div className="nebula-tool-card missions-v2">
                <div className="tool-head"><Target size={18} /><span>قائمة مهامي</span></div>
                <div className="mission-input">
                    <input value={taskText} onChange={(e)=>setTaskText(e.target.value)} placeholder="إضافة هدف جديد..." onKeyPress={(e) => e.key === 'Enter' && addTask()} />
                    <button onClick={addTask}><Plus size={18}/></button>
                </div>
                <div className="mission-list">
                    {student.tasks?.slice(-5).reverse().map(t => (
                        <div key={t.id} className={`m-item ${t.completed ? 'completed' : ''}`} onClick={() => toggleTask(t.id)}>
                            <div className="m-check">{t.completed ? <CheckCircle size={16} fill="#00ff80" color="#000"/> : <div className="circle-skeleton"></div>}</div>
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

const Plus = ({size}) => <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>;

export default StudentDash;
