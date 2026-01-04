import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, onSnapshot, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion'; // تأكد من تثبيتها
import { Layout, Book, Target, Zap, Power, Box, Search, X, CheckCircle } from 'lucide-react'; // أيقونات احترافية
import './StudentDash.css';

const StudentDash = () => {
  const [student, setStudent] = useState(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [taskText, setTaskText] = useState("");
  const [notif, setNotif] = useState("");
  
  // Pomodoro
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const library = [
    { id: 'web1', name: 'Web Dev Mastery', desc: 'React & Firebase Ecosystem', icon: '🌐' },
    { id: 'ai1', name: 'AI Engineering', desc: 'Python & Neural Networks', icon: '🧠' },
    { id: 'ui1', name: 'UI/UX Design', desc: 'Futuristic Interface Design', icon: '🎨' }
  ];

  useEffect(() => {
    if (auth.currentUser) {
      const unsub = onSnapshot(doc(db, "users", auth.currentUser.uid), (d) => {
        if (d.exists()) setStudent(d.data());
      });
      return () => unsub();
    }
  }, []);

  // Timer Logic
  useEffect(() => {
    let interval = null;
    if (isActive && (minutes > 0 || seconds > 0)) {
      interval = setInterval(() => {
        if (seconds === 0) { setMinutes(m => m - 1); setSeconds(59); }
        else { setSeconds(s => s - 1); }
      }, 1000);
    } else if (minutes === 0 && seconds === 0) {
      setIsActive(false);
      triggerNotif("MISSION COMPLETE: FOCUS SESSION FINISHED");
    }
    return () => clearInterval(interval);
  }, [isActive, minutes, seconds]);

  const triggerNotif = (msg) => {
    setNotif(msg);
    setTimeout(() => setNotif(""), 4000);
  };

  const enroll = async (course) => {
    if (student.myCourses?.some(c => c.id === course.id)) return triggerNotif("MODULE ALREADY SYNCED");
    const ref = doc(db, "users", auth.currentUser.uid);
    await updateDoc(ref, { 
      myCourses: arrayUnion({ ...course, progress: 0 }),
      points: increment(50)
    });
    triggerNotif(`NEW MODULE ACQUIRED: ${course.name}`);
  };

  const addTask = async () => {
    if (!taskText) return;
    const ref = doc(db, "users", auth.currentUser.uid);
    await updateDoc(ref, { 
      tasks: arrayUnion({ id: Date.now(), text: taskText, completed: false }),
      points: increment(10)
    });
    setTaskText("");
    triggerNotif("MISSION LOGGED IN NEURAL LINK");
  };

  if (!student) return (
    <div className="loading-vortex">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
        <Zap size={50} color="#00f2ff" />
      </motion.div>
      <span>SYNCHRONIZING WITH SERVER...</span>
    </div>
  );

  return (
    <div className={`dash-main-root ${isActive ? 'focus-mode-active' : ''}`}>
      {/* Neural Link Notification */}
      <AnimatePresence>
        {notif && (
          <motion.div initial={{ x: 300 }} animate={{ x: 0 }} exit={{ x: 300 }} className="neural-notif">
            <Zap size={18} /> {notif}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="space-header">
        <div className="user-profile-section">
          <motion.div whileHover={{ scale: 1.1 }} className="avatar-orb">
            <img src={student.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} alt="avatar" />
            <div className="pulse-ring"></div>
          </motion.div>
          <div className="user-meta">
            <h2>{student.displayName} <span className="status-badge">ONLINE</span></h2>
            <p className="rank-title">SYSTEM ARCHITECT | LVL {Math.floor(student.points / 500) + 1}</p>
          </div>
        </div>

        <div className="global-stats-hub">
          <div className="stat-box">
            <span className="label">ENERGY (XP)</span>
            <span className="value">{student.points}</span>
            <div className="energy-bar"><motion.div initial={{ width: 0 }} animate={{ width: `${(student.points % 500) / 5}%` }} className="energy-fill" /></div>
          </div>
        </div>

        <button onClick={() => auth.signOut()} className="disconnect-btn">
          <Power size={20} /> <span>DISCONNECT</span>
        </button>
      </header>

      <div className="grid-layout">
        {/* Left Wing: Tools */}
        <aside className="left-wing">
          <motion.div whileHover={{ y: -5 }} className="glass-module pomodoro-v2">
            <h3><Target size={18} /> FOCUS CORE</h3>
            <div className={`timer-display ${isActive ? 'breathing' : ''}`}>
              {String(minutes).padStart(2,'0')}:<span>{String(seconds).padStart(2,'0')}</span>
            </div>
            <div className="timer-controls">
              <button onClick={() => setIsActive(!isActive)}>
                {isActive ? "ABORT" : "INITIATE"}
              </button>
              <button onClick={() => {setIsActive(false); setMinutes(25); setSeconds(0);}}>RESET</button>
            </div>
          </motion.div>

          <div className="glass-module missions-v2">
            <h3><Layout size={18} /> MISSION LOG</h3>
            <div className="input-vortex">
              <input value={taskText} onChange={(e)=>setTaskText(e.target.value)} placeholder="Type new mission..." />
              <button onClick={addTask}><Zap size={16}/></button>
            </div>
            <div className="mission-scroller custom-scroll">
              {student.tasks?.map(t => (
                <motion.div initial={{ x: -20 }} animate={{ x: 0 }} key={t.id} className="mission-node">
                  <CheckCircle size={14} className="node-icon" />
                  <span>{t.text}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </aside>

        {/* Center Wing: Knowledge Deck */}
        <main className="center-deck-v2">
          <div className="deck-nav">
            <h1>ACQUIRED KNOWLEDGE</h1>
            <button className="scan-trigger" onClick={() => setShowLibrary(true)}>
              <Search size={18} /> SCAN LIBRARY
            </button>
          </div>

          <div className="knowledge-grid">
            {student.myCourses?.map(c => (
              <motion.div 
                whileHover={{ scale: 1.02, rotateY: 5 }}
                key={c.id} 
                className="knowledge-card"
              >
                <div className="card-header">
                  <span className="icon-wrap">{c.icon || '📦'}</span>
                  <div className="meta">
                    <h4>{c.name}</h4>
                    <code>SYSTEM_ID: {c.id}</code>
                  </div>
                </div>
                <div className="sync-status">
                  <div className="sync-label">SYNC PROGRESS: {c.progress}%</div>
                  <div className="sync-bar"><div className="fill" style={{width: `${c.progress}%`}} /></div>
                </div>
                <button className="enter-btn">ENTER SIMULATION</button>
              </motion.div>
            ))}
          </div>
        </main>
      </div>

      {/* Library Overdrive Modal */}
      <AnimatePresence>
        {showLibrary && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="library-overlay"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 100 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, y: 100 }}
              className="library-modal"
            >
              <div className="modal-top">
                <h2>CENTRAL DATABASE</h2>
                <button onClick={()=>setShowLibrary(false)}><X /></button>
              </div>
              <div className="library-shelf">
                {library.map(l => (
                  <div key={l.id} className="shelf-item">
                    <div className="item-info">
                      <h3>{l.icon} {l.name}</h3>
                      <p>{l.desc}</p>
                    </div>
                    <button onClick={() => enroll(l)}>DOWNLOAD</button>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentDash;
