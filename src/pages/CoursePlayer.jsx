import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc, increment, arrayUnion, onSnapshot, setDoc } from "firebase/firestore";
import { motion, AnimatePresence } from 'framer-motion';
import {  
  Play, CheckCircle, ChevronRight, List, Save, Mic, Square,
  Award, Lock, FileText, Download, Zap, Monitor, Clock, 
  MessageCircle, SkipForward, Volume2, Trash2, Timer, Target, 
  MousePointer2, ExternalLink, ShieldAlert
} from 'lucide-react';

import './CoursePlayer.css';

const CoursePlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const playerRef = useRef(null);

  // --- [1] حالات النظام الأساسية ---
  const [courseData, setCourseData] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [userPoints, setUserPoints] = useState(0);
  const [notif, setNotif] = useState({ show: false, msg: "", type: "info" });

  // --- [2] حالات الأدوات المتقدمة (Focus & Stats) ---
  const [sessionTime, setSessionTime] = useState(0); 
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const [note, setNote] = useState("");

  // --- [3] حالات التسجيل الصوتي ---
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);

  // --- [4] وظيفة التنبيهات (Helper) ---
  const triggerNotif = (msg, type = "info") => {
    setNotif({ show: true, msg, type });
    setTimeout(() => setNotif({ show: false, msg: "", type: "info" }), 3000);
  };

  // --- [5] نظام الحماية المتقدم (Security Logic) ---
  useEffect(() => {
    const preventActions = (e) => {
      if (e.type === 'contextmenu') e.preventDefault();
      if (e.ctrlKey && ['p', 's', 'u', 'c'].includes(e.key)) e.preventDefault();
      if (e.key === 'F12') e.preventDefault();
    };
    document.addEventListener('contextmenu', preventActions);
    document.addEventListener('keydown', preventActions);

    // تتبع الجلسة لمنع تعدد الحسابات
    let unsubSession = () => {};
    if (auth.currentUser) {
      const sessionRef = doc(db, "active_sessions", auth.currentUser.uid);
      const sessionId = Math.random().toString(36);
      setDoc(sessionRef, { lastActive: new Date(), sessionId }, { merge: true });

      unsubSession = onSnapshot(sessionRef, (s) => {
        if (s.exists() && s.data().sessionId !== sessionId) {
          alert("تنبيه أمني: تم فتح الحساب من جهاز آخر!");
          navigate('/login');
        }
      });
    }

    return () => {
      document.removeEventListener('contextmenu', preventActions);
      document.removeEventListener('keydown', preventActions);
      unsubSession();
    };
  }, [navigate]);

  // --- [6] جلب البيانات وتتبع وقت المذاكرة ---
  useEffect(() => {
    let unsubUser = () => {};
    const fetchData = async () => {
      try {
        const docRef = doc(db, "courses_metadata", id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setCourseData(data);
          const lastId = localStorage.getItem(`last_vid_${id}`);
          setCurrentLesson(data.lessons?.find(l => l.id === lastId) || data.lessons?.[0]);
        }
        if (auth.currentUser) {
          unsubUser = onSnapshot(doc(db, "users", auth.currentUser.uid), (s) => {
            if (s.exists()) {
              setCompletedLessons(s.data().completedLessons || []);
              setUserPoints(s.data().points || 0);
            }
          });
        }
        setLoading(false);
      } catch (e) { setLoading(false); }
    };

    fetchData();
    const timer = setInterval(() => setSessionTime(p => p + 1), 1000);
    return () => { unsubUser(); clearInterval(timer); };
  }, [id]);

  // --- [7] منطق الأدوات (Recording, Notes, Completing) ---
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder.current = new MediaRecorder(stream);
    mediaRecorder.current.ondataavailable = (e) => audioChunks.current.push(e.data);
    mediaRecorder.current.onstop = () => {
      const blob = new Blob(audioChunks.current, { type: 'audio/ogg; codecs=opus' });
      setAudioUrl(URL.createObjectURL(blob));
      audioChunks.current = [];
    };
    mediaRecorder.current.start();
    setIsRecording(true);
  };

  const addTimestampNote = () => {
    if (!note) return;
    const timeLabel = `${Math.floor(sessionTime / 60)}:${(sessionTime % 60).toString().padStart(2, '0')}`;
    setBookmarks([...bookmarks, { id: Date.now(), time: timeLabel, text: note }]);
    setNote("");
    triggerNotif("تم حفظ العلامة الزمنية 📍", "success");
  };

  const handleLessonComplete = async () => {
    if (!auth.currentUser || completedLessons.includes(currentLesson?.id)) return;
    await updateDoc(doc(db, "users", auth.currentUser.uid), {
      completedLessons: arrayUnion(currentLesson.id),
      points: increment(150)
    });
    triggerNotif("رائع! +150 نقطة لنورك المعرفي 🌟", "success");
  };

  if (loading) return <div className="player-loading"><Zap className="spin" size={40}/></div>;

  return (
    <div className={`nebula-player no-select ${isFocusMode ? 'focus-active' : ''}`}>
      {/* طبقة حماية مائية متغيرة */}
      <div className="moving-watermark" style={{ top: `${(sessionTime % 80) + 10}%` }}>
        {auth.currentUser?.email} - {new Date().toLocaleDateString()}
      </div>

      <header className="player-header glass">
        <div className="header-right">
          <button onClick={() => navigate(-1)} className="back-btn"><ChevronRight/></button>
          <div className="title-area">
            <h3>{courseData?.title}</h3>
            <p>{currentLesson?.title}</p>
          </div>
        </div>
        
        <div className="study-stats-bar">
           <div className="stat"><Clock size={14}/> {Math.floor(sessionTime / 60)}د مذاكرة</div>
           <div className="stat"><Target size={14} color={isFocusMode ? '#00f2ff' : '#666'}/></div>
           <button onClick={() => setIsFocusMode(!isFocusMode)} className="focus-btn">
             {isFocusMode ? 'إيقاف التركيز' : 'وضع التركيز'}
           </button>
        </div>

        <div className="header-left">
           <div className="xp-badge"><Award size={16}/> {userPoints} XP</div>
        </div>
      </header>

      <div className="player-main">
        <div className={`video-section ${!isSidebarOpen ? 'full-width' : ''}`}>
          <div className="iframe-wrapper glass">
            <iframe 
               src={`https://www.youtube.com/embed/${currentLesson?.videoUrl?.split('v=')[1] || currentLesson?.videoUrl?.split('/').pop()}?rel=0`}
               title="video" allowFullScreen
            ></iframe>
          </div>

          <div className="control-shelf glass">
             <div className="lesson-info">
                <h2>{currentLesson?.title}</h2>
                <div className="tags">
                   <span className="tag"><Monitor size={12}/> بجودة عالية</span>
                   <span className="tag"><ShieldAlert size={12}/> محتوى محمي</span>
                </div>
             </div>
             <div className="actions">
                <button className={`complete-btn ${completedLessons.includes(currentLesson?.id) ? 'done' : ''}`} onClick={handleLessonComplete}>
                   {completedLessons.includes(currentLesson?.id) ? <CheckCircle/> : <Play/>}
                   {completedLessons.includes(currentLesson?.id) ? 'تم الإنجاز' : 'إنهاء الدرس'}
                </button>
             </div>
          </div>

          <div className="interactive-tools-grid">
             {/* مفكرة الملاحظات والـ Bookmarks */}
             <div className="notes-area glass">
                <div className="tabs"><FileText size={16}/> الملاحظات الذكية</div>
                <textarea 
                  placeholder="اكتب ملاحظة هنا.. أو اربطها بزمن الفيديو بالأسفل" 
                  value={note} 
                  onChange={(e) => setNote(e.target.value)}
                ></textarea>
                <div className="notes-footer">
                   <button className="ts-btn" onClick={addTimestampNote}><MousePointer2 size={14}/> ربط بالوقت الحالي</button>
                   <div className="voice-box">
                      {!isRecording ? <Mic onClick={startRecording} className="mic-on"/> : <Square onClick={() => { mediaRecorder.current.stop(); setIsRecording(false); }} className="mic-off"/>}
                   </div>
                </div>
             </div>

             {/* عرض العلامات الزمنية المحفوظة */}
             <div className="bookmarks-display glass">
                <h4>العلامات المحفوظة</h4>
                <div className="bm-list">
                   {bookmarks.map(bm => (
                     <div key={bm.id} className="bm-card">
                        <span className="time-tag">{bm.time}</span>
                        <p>{bm.text}</p>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </div>

        <aside className={`playlist-sidebar ${!isSidebarOpen ? 'closed' : ''}`}>
          <div className="prog-container glass">
             <div className="prog-label">تقدمك في الدورة: {Math.round((completedLessons.length / (courseData?.lessons?.length || 1)) * 100)}%</div>
             <div className="prog-bar"><motion.div animate={{width: `${(completedLessons.length / (courseData?.lessons?.length || 1)) * 100}%`}} className="fill"></motion.div></div>
          </div>
          
          <div className="lessons-scroll">
             {courseData?.lessons?.map((les, i) => (
               <div key={les.id} className={`les-card ${currentLesson?.id === les.id ? 'active' : ''}`} onClick={() => setCurrentLesson(les)}>
                  <div className="idx">{completedLessons.includes(les.id) ? <CheckCircle size={14}/> : i + 1}</div>
                  <div className="det">
                     <h5>{les.title}</h5>
                     <span>{les.duration || '12:00'}</span>
                  </div>
               </div>
             ))}
          </div>
        </aside>
      </div>

      <AnimatePresence>
        {notif.show && (
          <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0}} className={`global-toast ${notif.type}`}>
            {notif.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CoursePlayer;