import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, onSnapshot, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import './StudentDash.css';

const StudentDash = () => {
  const [student, setStudent] = useState(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [taskText, setTaskText] = useState("");
  
  // Pomodoro
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const library = [
    { id: 'web1', name: 'Web Dev Mastery', desc: 'React & Firebase' },
    { id: 'ai1', name: 'AI Engineering', desc: 'Python & ML' },
    { id: 'ui1', name: 'UI/UX Design', desc: 'Figma Pro' }
  ];

  useEffect(() => {
    // جلب البيانات مع التأكد من وجود مستخدم
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
    } else { clearInterval(interval); }
    return () => clearInterval(interval);
  }, [isActive, minutes, seconds]);

  const enroll = async (course) => {
    if (student.myCourses?.some(c => c.id === course.id)) return alert("Already in your storage!");
    const ref = doc(db, "users", auth.currentUser.uid);
    await updateDoc(ref, { 
      myCourses: arrayUnion({ ...course, progress: 0 }),
      points: increment(50) // مكافأة تسجيل
    });
  };

  const addTask = async () => {
    if (!taskText) return;
    const ref = doc(db, "users", auth.currentUser.uid);
    await updateDoc(ref, { 
      tasks: arrayUnion({ id: Date.now(), text: taskText, completed: false }),
      points: increment(10) // نقاط لكل مهمة
    });
    setTaskText("");
  };

  if (!student) return <div className="loading-screen">INITIALIZING NEURAL LINK...</div>;

  return (
    <div className="dash-container-refined">
      {/* Dynamic Background Particles (CSS handles this) */}
      <div className="stars"></div>

      <header className="main-nav">
        <div className="identity-tag">
          <div className="avatar-wrapper">
            <img src={student.photoURL || "https://via.placeholder.com/50"} alt="" />
            <div className="status-indicator"></div>
          </div>
          <div className="name-block">
            <h3>{student.displayName}</h3>
            <span className="rank-text">RANK: ELITE EXPLORER</span>
          </div>
        </div>

        <div className="xp-system">
          <div className="xp-label">XP LEVEL {Math.floor(student.points / 100) + 1}</div>
          <div className="xp-bar">
            <div className="xp-fill" style={{width: `${student.points % 100}%`}}></div>
          </div>
        </div>

        <button onClick={() => auth.signOut()} className="power-off-btn">LOGOUT</button>
      </header>

      <div className="dashboard-content">
        {/* Left Column: Pomodoro & Tasks */}
        <aside className="side-tools">
          <div className="glass-panel pomodoro-refined">
            <h5><i className="timer-icon"></i> FOCUS MODE</h5>
            <div className="digital-clock">
              {String(minutes).padStart(2,'0')}:<span>{String(seconds).padStart(2,'0')}</span>
            </div>
            <button className={`trigger-btn ${isActive ? 'active' : ''}`} onClick={() => setIsActive(!isActive)}>
              {isActive ? "PAUSE INTERFACE" : "ENGAGE FOCUS"}
            </button>
          </div>

          <div className="glass-panel todo-refined">
            <h5>ACTIVE MISSIONS</h5>
            <div className="task-input-group">
              <input value={taskText} onChange={(e)=>setTaskText(e.target.value)} placeholder="Transmit new task..." />
              <button onClick={addTask}>+</button>
            </div>
            <div className="task-scroller">
              {student.tasks?.map(t => (
                <div key={t.id} className="task-node">
                  <div className="node-dot"></div>
                  {t.text}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Center: Courses */}
        <main className="center-deck">
          <div className="deck-header">
            <h2>ACQUIRED MODULES</h2>
            <button className="scan-btn" onClick={() => setShowLibrary(true)}>SCAN FOR NEW COURSES</button>
          </div>

          <div className="modules-grid">
            {student.myCourses?.length > 0 ? student.myCourses.map(c => (
              <div key={c.id} className="module-card">
                <div className="card-glare"></div>
                <span className="module-id">ID: {c.id}</span>
                <h4>{c.name}</h4>
                <div className="progress-info">
                  <span>SYNC: {c.progress}%</span>
                  <div className="mini-bar"><div className="fill" style={{width: `${c.progress}%`}}></div></div>
                </div>
                <button className="launch-btn">INITIATE</button>
              </div>
            )) : (
              <div className="no-data">NO ACTIVE MODULES FOUND. PLEASE SCAN LIBRARY.</div>
            )}
          </div>
        </main>
      </div>

      {/* Library Modal */}
      {showLibrary && (
        <div className="modal-overlay blur-bg">
          <div className="modal-content futuristic-modal">
            <h2 className="glitch">GLOBAL KNOWLEDGE BASE</h2>
            <div className="lib-grid-refined">
              {library.map(l => (
                <div key={l.id} className="lib-card">
                  <h4>{l.name}</h4>
                  <p>{l.desc}</p>
                  <button onClick={() => enroll(l)}>SYNC TO PROFILE</button>
                </div>
              ))}
            </div>
            <button className="close-terminal-btn" onClick={()=>setShowLibrary(false)}>CLOSE TERMINAL</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDash;