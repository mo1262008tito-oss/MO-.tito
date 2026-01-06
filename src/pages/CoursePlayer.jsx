import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc, increment, arrayUnion, onSnapshot } from "firebase/firestore";
import { motion, AnimatePresence } from 'framer-motion';
import {  
  Play, CheckCircle, ChevronRight, List, ArrowRight, Save, 
  Award, Lock, Shield, FileText, Download, Zap, Monitor, Clock 
} from 'lucide-react';

import './CoursePlayer.css';

const CoursePlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // حالات النظام (States)
  const [courseData, setCourseData] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [userPoints, setUserPoints] = useState(0);
  const [note, setNote] = useState("");
  const [notif, setNotif] = useState({ show: false, msg: "", type: "info" });

  // 1. نظام الحماية (Security System)
  useEffect(() => {
    const preventActions = (e) => {
      // منع النقر الأيمن
      if (e.type === 'contextmenu') e.preventDefault();
      // منع اختصارات التصوير والحفظ
      if (e.ctrlKey && (e.key === 'p' || e.key === 's' || e.key === 'u')) e.preventDefault();
      if (e.key === 'F12') e.preventDefault();
    };

    document.addEventListener('contextmenu', preventActions);
    document.addEventListener('keydown', preventActions);
    return () => {
      document.removeEventListener('contextmenu', preventActions);
      document.removeEventListener('keydown', preventActions);
    };
  }, []);

  // 2. جلب البيانات اللحظية
  useEffect(() => {
    let unsubUser = () => {};

    const fetchInitialData = async () => {
      try {
        const docRef = doc(db, "courses_metadata", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setCourseData(data);
          
          // استعادة آخر درس شاهده الطالب
          const lastSavedId = localStorage.getItem(`last_vid_${id}`);
          const initialLesson = data.lessons?.find(l => l.id === lastSavedId) || data.lessons?.[0];
          setCurrentLesson(initialLesson);
        } else {
          navigate('/student-dash');
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
      } catch (error) {
        console.error("Fetch Error:", error);
        setLoading(false);
      }
    };

    fetchInitialData();
    return () => unsubUser();
  }, [id, navigate]);

  // 3. إدارة الملاحظات (Notes Management)
  useEffect(() => {
    if (currentLesson) {
      const savedNote = localStorage.getItem(`note_${currentLesson.id}`);
      setNote(savedNote || "");
      localStorage.setItem(`last_vid_${id}`, currentLesson.id);
    }
  }, [currentLesson, id]);

  const triggerNotif = (msg, type = "info") => {
    setNotif({ show: true, msg, type });
    setTimeout(() => setNotif(prev => ({ ...prev, show: false })), 4000);
  };

  const handleSaveNote = () => {
    localStorage.setItem(`note_${currentLesson.id}`, note);
    triggerNotif("تم حفظ الملاحظة بنجاح 💾", "success");
  };

  // 4. معالج الفيديو
  const getEmbedUrl = (url) => {
    if (!url) return "";
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const vId = url.includes("v=") ? url.split("v=")[1].split("&")[0] : url.split("/").pop();
      return `https://www.youtube.com/embed/${vId}?rel=0&modestbranding=1&autoplay=1`;
    }
    return url;
  };

  // 5. إتمام الدرس
  const handleLessonComplete = async (lessonId) => {
    if (!auth.currentUser || completedLessons.includes(lessonId)) return;
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        completedLessons: arrayUnion(lessonId),
        points: increment(100)
      });
      triggerNotif("بطل! حصلت على 100 نقطة XP 🌟", "success");
    } catch (e) {
      triggerNotif("فشل في تحديث النقاط", "error");
    }
  };

  if (loading) return (
    <div className="vortex-container">
      <Zap className="spin-icon" size={50} color="#00f2ff" />
      <p>جاري تحضير القاعة التعليمية...</p>
    </div>
  );

  return (
    <div className="mafa-player-env no-select rtl">
      {/* Dynamic Watermark */}
      <div className="dynamic-watermark">
        {auth.currentUser?.email} — {new Date().toLocaleDateString('ar-EG')}
      </div>

      {/* Professional Toast Notification */}
      <AnimatePresence>
        {notif.show && (
          <motion.div 
            initial={{ x: 50, opacity: 0 }} 
            animate={{ x: 0, opacity: 1 }} 
            exit={{ x: 50 }} 
            className={`player-toast ${notif.type}`}
          >
            {notif.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="player-top-nav glass">
        <div className="right-side">
          <button onClick={() => navigate('/student-dash')} className="icon-btn"><ChevronRight /></button>
          <div className="course-info">
            <h1>{courseData?.title}</h1>
            <span><Monitor size={14}/> {currentLesson?.title}</span>
          </div>
        </div>
        <div className="left-side">
          <div className="points-badge"><Award size={18}/> {userPoints} XP</div>
        </div>
      </header>

      <div className="player-body">
        <section className={`main-stage ${!isSidebarOpen ? 'expanded' : ''}`}>
          <div className="video-viewport glass">
            <iframe 
              src={getEmbedUrl(currentLesson?.videoUrl)} 
              allowFullScreen 
              title="MAFA Education"
              onContextMenu={e => e.preventDefault()}
            ></iframe>
          </div>

          <div className="interaction-bar glass">
            <div className="lesson-text">
              <h2>{currentLesson?.title}</h2>
              <p>{currentLesson?.description || "شاهد المحاضرة بتركيز ودون ملاحظاتك."}</p>
            </div>
            
            <div className="action-hub">
              {currentLesson?.pdfUrl && (
                <a href={currentLesson.pdfUrl} target="_blank" rel="noreferrer" className="btn-attachment">
                  <Download size={18} /> تحميل الملزمة
                </a>
              )}
              <button 
                className={`btn-complete ${completedLessons.includes(currentLesson?.id) ? 'active' : ''}`}
                onClick={() => handleLessonComplete(currentLesson?.id)}
              >
                {completedLessons.includes(currentLesson?.id) ? <CheckCircle /> : <Play />}
                {completedLessons.includes(currentLesson?.id) ? 'تم الاعتماد' : 'تأكيد الحضور'}
              </button>
            </div>
          </div>

          <div className="student-notes glass">
             <div className="notes-head">
                <h3><FileText size={18}/> مفكرة المحاضرة</h3>
                <button onClick={handleSaveNote} className="btn-save-note"><Save size={14}/> حفظ</button>
             </div>
             <textarea 
               value={note}
               onChange={(e) => setNote(e.target.value)}
               placeholder="اكتب ملاحظاتك المهمة هنا..."
             ></textarea>
          </div>
        </section>

        <aside className={`playlist-sidebar ${!isSidebarOpen ? 'collapsed' : ''}`}>
          <div className="sidebar-toggle" onClick={() => setSidebarOpen(!isSidebarOpen)}>
            <List size={20} /> {isSidebarOpen && "محتوى الكورس"}
          </div>
          
          <div className="lesson-items-container">
            {courseData?.lessons?.map((lesson, index) => (
              <div 
                key={lesson.id}
                className={`lesson-card ${currentLesson?.id === lesson.id ? 'playing' : ''} ${completedLessons.includes(lesson.id) ? 'done' : ''}`}
                onClick={() => setCurrentLesson(lesson)}
              >
                <div className="status-icon">
                  {completedLessons.includes(lesson.id) ? <CheckCircle size={18} /> : <div className="circle-num">{index + 1}</div>}
                </div>
                <div className="lesson-meta">
                  <h4>{lesson.title}</h4>
                  <div className="sub-meta">
                    {lesson.duration && <span><Clock size={12}/> {lesson.duration}</span>}
                  </div>
                </div>
                {currentLesson?.id === lesson.id && <motion.div layoutId="pulse" className="playing-pulse" />}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CoursePlayer;
