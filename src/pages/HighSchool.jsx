import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc, increment, arrayUnion, onSnapshot } from "firebase/firestore";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, CheckCircle, ChevronRight, MessageSquare, 
  BookOpen, Star, List, ArrowRight, Save, Award, Shield, 
  Unlock, Volume2, Maximize, Clock
} from 'lucide-react';

// استيراد المكونات الفرعية
import QuizSystem from './QuizSystem'; 
import './CoursePlayer.css';

const CoursePlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [courseData, setCourseData] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [progress, setProgress] = useState(0);

  // 1. جلب البيانات لحظياً (Real-time)
  useEffect(() => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }

    const unsubCourse = onSnapshot(doc(db, "courses_metadata", id), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setCourseData(data);
        if (!currentLesson && data.lessons?.length > 0) {
          setCurrentLesson(data.lessons[0]);
        }
      }
    });

    const unsubUser = onSnapshot(doc(db, "users", auth.currentUser.uid), (snap) => {
      if (snap.exists()) {
        const userData = snap.data();
        setCompletedLessons(userData.completedLessons || []);
      }
    });

    return () => { unsubCourse(); unsubUser(); };
  }, [id, currentLesson, navigate]);

  // 2. حساب نسبة الإنجاز
  useEffect(() => {
    if (courseData?.lessons?.length > 0) {
      const done = courseData.lessons.filter(l => completedLessons.includes(l.id)).length;
      setProgress(Math.round((done / courseData.lessons.length) * 100));
    }
  }, [completedLessons, courseData]);

  const getEmbedUrl = (url) => {
    if (!url) return "";
    const videoId = url.includes("v=") ? url.split("v=")[1].split("&")[0] : url.split("youtu.be/")[1]?.split("?")[0];
    return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&iv_load_policy=3&showinfo=0`;
  };

  const handleLessonComplete = async (lessonId) => {
    if (completedLessons.includes(lessonId)) return;
    const userRef = doc(db, "users", auth.currentUser.uid);
    await updateDoc(userRef, {
      completedLessons: arrayUnion(lessonId),
      points: increment(100) // مكافأة إنهاء الدرس
    });
  };

  if (loading && !courseData) return <div className="vortex-loading">جاري تحضير المحاضرة...</div>;

  return (
    <div className="smart-player-root no-select" onContextMenu={e => e.preventDefault()}>
      
      {/* العلامة المائية للحماية */}
      <div className="dynamic-watermark">
        {auth.currentUser?.email} — MAFA PROTECT
      </div>

      {/* شريط الإنجاز العلوي */}
      <div className="progress-top-bar" style={{ width: `${progress}%` }}></div>

      <nav className="player-nav">
        <div className="nav-right">
          <button onClick={() => navigate('/dashboard')} className="back-btn">
            <ArrowRight size={20} />
          </button>
          <div className="course-info-hub">
            <h2>{courseData?.title}</h2>
            <div className="sub-meta">
              <span><Clock size={12}/> {progress}% مكتمل</span>
              <span className="divider">|</span>
              <span>{courseData?.instructor}</span>
            </div>
          </div>
        </div>
        <div className="nav-left">
          <div className="xp-badge"><Award size={16}/> +100 XP</div>
        </div>
      </nav>

      <div className="player-main-layout">
        <section className={`content-area ${!isSidebarOpen ? 'expanded' : ''}`}>
          
          <div className="video-canvas">
            <div className="video-frame-neon">
              <iframe 
                src={getEmbedUrl(currentLesson?.videoUrl)}
                title="MAFA Video Player"
                allowFullScreen
              ></iframe>
            </div>
          </div>

          <div className="lesson-details-box glass-card">
            <div className="details-header">
              <h1>{currentLesson?.title}</h1>
              <button 
                className={`complete-action-btn ${completedLessons.includes(currentLesson?.id) ? 'active' : ''}`}
                onClick={() => handleLessonComplete(currentLesson?.id)}
              >
                {completedLessons.includes(currentLesson?.id) ? <CheckCircle /> : <Play />}
                {completedLessons.includes(currentLesson?.id) ? 'تم اجتياز الدرس' : 'تحديد كمكتمل'}
              </button>
            </div>
            <p className="description">{currentLesson?.description || "لا يوجد وصف لهذه المحاضرة."}</p>
          </div>

          {/* نظام الامتحانات المدمج */}
          <AnimatePresence mode="wait">
            {currentLesson?.quiz?.length > 0 && (
              <motion.div 
                key={currentLesson.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="quiz-wrapper"
              >
                <div className="quiz-header-tag">
                  <Unlock size={18} /> اختبر فهمك للمحاضرة
                </div>
                <QuizSystem 
                   quizData={currentLesson.quiz} 
                   lessonId={currentLesson.id}
                   onPass={() => handleLessonComplete(currentLesson.id)} 
                />
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <aside className={`playlist-sidebar ${!isSidebarOpen ? 'collapsed' : ''}`}>
          <div className="sidebar-top">
            <h3>قائمة المحاضرات</h3>
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="toggle-sidebar">
              <List size={20} />
            </button>
          </div>
          
          <div className="lesson-items-container">
            {courseData?.lessons?.map((lesson, idx) => (
              <div 
                key={lesson.id} 
                className={`lesson-card ${currentLesson?.id === lesson.id ? 'current' : ''} ${completedLessons.includes(lesson.id) ? 'done' : ''}`}
                onClick={() => setCurrentLesson(lesson)}
              >
                <div className="status-icon">
                  {completedLessons.includes(lesson.id) ? <CheckCircle size={18} /> : <span>{idx + 1}</span>}
                </div>
                <div className="lesson-text">
                  <h4>{lesson.title}</h4>
                  <p>{lesson.quiz?.length || 0} أسئلة تقييمية</p>
                </div>
                {currentLesson?.id === lesson.id && <motion.div layoutId="active-pill" className="active-pill" />}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CoursePlayer;
