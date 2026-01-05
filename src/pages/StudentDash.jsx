import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { 
  doc, onSnapshot, updateDoc, arrayUnion, 
  increment, getDoc, collection, query, where, getDocs 
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layout, Book, Target, Zap, Power, Search, X, 
  CheckCircle, Award, Database, MessageSquare, 
  BookOpen, Star, Clock, Flame, ChevronLeft
} from 'lucide-react';
import './StudentDash.css';

const StudentDash = () => {
  const [student, setStudent] = useState(null);
  const [activeTab, setActiveTab] = useState('my-courses'); // my-courses, store, notes
  const [taskText, setTaskText] = useState("");
  const [notif, setNotif] = useState("");
  const [availableCourses, setAvailableCourses] = useState([]);
  
  // مؤقت البومودورو (Pomodoro)
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (auth.currentUser) {
      // 1. جلب بيانات الطالب وتحديثها لحظياً
      const unsub = onSnapshot(doc(db, "users", auth.currentUser.uid), (d) => {
        if (d.exists()) setStudent(d.data());
      });

      // 2. جلب الكورسات المتاحة في المنصة (المتجر)
      const fetchStore = async () => {
        const q = collection(db, "courses_metadata");
        const snap = await getDocs(q);
        setAvailableCourses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      };
      
      fetchStore();
      return () => unsub();
    }
  }, []);

  // منطق المؤقت
  useEffect(() => {
    let interval = null;
    if (isActive && (minutes > 0 || seconds > 0)) {
      interval = setInterval(() => {
        if (seconds === 0) { setMinutes(m => m - 1); setSeconds(59); }
        else { setSeconds(s => s - 1); }
      }, 1000);
    } else if (minutes === 0 && seconds === 0) {
      setIsActive(false);
      triggerNotif("انتهت جلسة التركيز! خذ استراحة قصيرة ☕");
    }
    return () => clearInterval(interval);
  }, [isActive, minutes, seconds]);

  const triggerNotif = (msg) => {
    setNotif(msg);
    setTimeout(() => setNotif(""), 4000);
  };

  const addTask = async () => {
    if (!taskText) return;
    const ref = doc(db, "users", auth.currentUser.uid);
    await updateDoc(ref, { 
      tasks: arrayUnion({ id: Date.now(), text: taskText, completed: false }),
      points: increment(10)
    });
    setTaskText("");
    triggerNotif("تمت إضافة المهمة للرابط العصبي 🧠");
  };

  if (!student) return <div className="loading-screen">جاري تحميل مصفوفة البيانات...</div>;

  return (
    <div className={`student-nebula-root ${isActive ? 'focus-mode' : ''}`}>
      
      {/* التنبيهات الذكية */}
      <AnimatePresence>
        {notif && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 20, opacity: 1 }} exit={{ y: -50 }} className="smart-alert">
            <Zap size={20} /> {notif}
          </motion.div>
        )}
      </AnimatePresence>

      {/* شريط الأدوات الجانبي - Sidebar */}
      <nav className="side-dock">
        <div className="dock-logo"><Zap color="#00f2ff" /></div>
        <button className={activeTab === 'my-courses' ? 'active' : ''} onClick={() => setActiveTab('my-courses')}><Layout /></button>
        <button className={activeTab === 'store' ? 'active' : ''} onClick={() => setActiveTab('store')}><Database /></button>
        <button className={activeTab === 'notes' ? 'active' : ''} onClick={() => setActiveTab('notes')}><BookOpen /></button>
        <div className="dock-bottom">
          <button onClick={() => auth.signOut()}><Power color="#ff4b2b" /></button>
        </div>
      </nav>

      {/* المحتوى الرئيسي */}
      <main className="nebula-container">
        
        {/* الهيدر العلوي */}
        <header className="nebula-header">
          <div className="profile-hub">
            <div className="avatar-shield">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.email}`} alt="user" />
            </div>
            <div className="name-plate">
              <h1>مرحباً، {student.name || 'أيها البطل'}</h1>
              <div className="badges-row">
                <span className="rank-badge"><Award size={14} /> مستوى {Math.floor((student.points || 0) / 100) + 1}</span>
                <span className="streak-badge"><Flame size={14} /> 5 أيام متواصلة</span>
              </div>
            </div>
          </div>

          <div className="xp-counter">
            <div className="xp-info"><span>طاقة المعرفة (XP)</span> <strong>{student.points || 0}</strong></div>
            <div className="xp-bar-outer"><div className="xp-bar-inner" style={{width: `${(student.points % 100)}%`}}></div></div>
          </div>
        </header>

        <div className="main-grid-layout">
          
          {/* المنطقة الوسطى - تتغير حسب التاب */}
          <section className="content-core">
            <AnimatePresence mode="wait">
              
              {/* تاب: كورساتي (الوحدات المفتوحة) */}
              {activeTab === 'my-courses' && (
                <motion.div key="my-courses" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="section-title"><h2><Layout /> الوحدات المكتسبة</h2></div>
                  <div className="courses-grid-v2">
                    {student.enrolledContent?.length > 0 ? (
                      availableCourses.filter(c => student.enrolledContent.includes(c.id)).map(course => (
                        <div key={course.id} className="course-nebula-card">
                          <div className="card-thumb" style={{backgroundImage: `url(${course.thumbnail})`}}>
                            <div className="progress-orb">{course.progress || 0}%</div>
                          </div>
                          <div className="card-details">
                            <h3>{course.title}</h3>
                            <p>{course.instructor}</p>
                            <button className="launch-btn" onClick={() => window.location.href='/high-school'}>دخول الوحدة <ChevronLeft size={16}/></button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state">
                        <Database size={50} />
                        <p>لا توجد كورسات مفعلة حالياً. اذهب للمتجر لتفعيل كود جديد.</p>
                        <button onClick={() => setActiveTab('store')}>استكشاف الكورسات</button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* تاب: المتجر (استكشاف) */}
              {activeTab === 'store' && (
                <motion.div key="store" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="section-title"><h2><Database /> مكتبة المنصة</h2></div>
                  <div className="store-grid">
                    {availableCourses.map(c => (
                      <div key={c.id} className="store-item">
                        <img src={c.thumbnail} alt={c.title} />
                        <div className="store-info">
                          <h4>{c.title}</h4>
                          <span>{c.price} ج.م</span>
                          <button onClick={() => window.location.href='/high-school'}>تفعيل بالكود</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </section>

          {/* الجناح الأيسر - أدوات المساعدة */}
          <aside className="nebula-tools">
            
            {/* مؤقت التركيز */}
            <div className="tool-card pomodoro-nebula">
              <h3><Target size={18} /> جلسة تركيز العميق</h3>
              <div className="timer-circles">
                <svg viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" className="bg"></circle>
                  <circle cx="50" cy="50" r="45" className="prog" style={{strokeDashoffset: 282 - (282 * (minutes * 60 + seconds)) / 1500}}></circle>
                </svg>
                <div className="time-text">{String(minutes).padStart(2,'0')}:{String(seconds).padStart(2,'0')}</div>
              </div>
              <button onClick={() => setIsActive(!isActive)} className={isActive ? 'stop' : 'start'}>
                {isActive ? 'إيقاف المحاكاة' : 'بدء التركيز'}
              </button>
            </div>

            {/* سجل المهام */}
            <div className="tool-card mission-control">
              <h3><CheckCircle size={18} /> قائمة المهام اليومية</h3>
              <div className="task-input">
                <input value={taskText} onChange={(e)=>setTaskText(e.target.value)} placeholder="ماذا ستنجز اليوم؟" />
                <button onClick={addTask}><Zap size={14}/></button>
              </div>
              <div className="task-list">
                {student.tasks?.slice(-5).map(t => (
                  <div key={t.id} className="task-item">
                    <div className="bullet"></div>
                    <span>{t.text}</span>
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
