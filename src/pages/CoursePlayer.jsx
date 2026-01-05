import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc, increment, arrayUnion } from "firebase/firestore";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, CheckCircle, ChevronRight, MessageSquare, 
  BookOpen, Star, List, ArrowRight, Save, Award, Lock, Shield
} from 'lucide-react';

// استيراد نظام الامتحانات
import QuizSystem from './QuizSystem'; 
import './CoursePlayer.css';

const CoursePlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [courseData, setCourseData] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [completedLessons, setCompletedLessons] = useState([]);

  useEffect(() => {
    const fetchCourseAndUser = async () => {
      try {
        // 1. جلب بيانات الكورس من metadata (النظام الجديد)
        const docRef = doc(db, "courses_metadata", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setCourseData(data);
          // ضبط المحاضرة الأولى تلقائياً
          if (data.lessons && data.lessons.length > 0) {
            setCurrentLesson(data.lessons[0]);
          }
        } else {
          alert("الكورس غير موجود أو تم حذفه.");
          navigate('/all-courses');
        }

        // 2. جلب تقدم الطالب
        if (auth.currentUser) {
          const userSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
          if (userSnap.exists()) {
            setCompletedLessons(userSnap.data().completedLessons || []);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching course:", error);
        setLoading(false);
      }
    };

    fetchCourseAndUser();
  }, [id, navigate]);

  // تحويل رابط اليوتيوب لرابط Embed آمن
  const getEmbedUrl = (url) => {
    if (!url) return "";
    let videoId = "";
    if (url.includes("v=")) videoId = url.split("v=")[1].split("&")[0];
    else if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1].split("?")[0];
    return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&iv_load_policy=3&autoplay=1&disablekb=1`;
  };

  const markAsComplete = async (lessonId) => {
    if (!auth.currentUser || completedLessons.includes(lessonId)) return;
    
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        completedLessons: arrayUnion(lessonId),
        points: increment(50) // مكافأة لإنهاء الدرس
      });
      setCompletedLessons(prev => [...prev, lessonId]);
      alert("ممتاز! أتممت الدرس وحصلت على 50 نقطة 🏆");
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return (
    <div className="vortex-loading">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="loader-icon">
        <Shield size={50} color="#00f2ff" />
      </motion.div>
      <p>جاري فحص تصاريح الدخول للقاعة...</p>
    </div>
  );

  return (
    <div className="smart-player-root no-select">
      
      {/* 🛡️ العلامة المائية المتحركة للأمان */}
      <div className="watermark-overlay">
        <span>{auth.currentUser?.email}</span>
        <span>{new Date().toLocaleDateString()}</span>
      </div>

      <nav className="player-nav">
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          <ArrowRight size={20} /> لوحة التحكم
        </button>
        <div className="course-title-hub">
          <h2>{courseData?.title}</h2>
          <span className="lesson-count">{courseData?.lessons?.length || 0} محاضرات</span>
        </div>
        <div className="user-status">
          <Award size={18} color="#00f2ff" />
          <span>{auth.currentUser?.displayName || "طالب MAFA"}</span>
        </div>
      </nav>

      <div className="player-main-layout">
        <section className={`video-section ${!isSidebarOpen ? 'full-width' : ''}`}>
          
          <div className="video-container">
            <div className="video-wrapper-neon">
              <iframe 
                src={getEmbedUrl(currentLesson?.videoUrl)}
                allowFullScreen
                title={currentLesson?.title}
                onContextMenu={(e) => e.preventDefault()}
              ></iframe>
            </div>
          </div>

          <div className="lesson-info-card glass-card">
            <div className="info-header">
              <div>
                <h1>{currentLesson?.title}</h1>
                <p><BookOpen size={16} /> المحاضر: {courseData?.instructor}</p>
              </div>
              <button 
                onClick={() => markAsComplete(currentLesson?.id)} 
                className={`complete-btn ${completedLessons.includes(currentLesson?.id) ? 'done' : ''}`}
              >
                {completedLessons.includes(currentLesson?.id) ? <CheckCircle size={18} /> : <Play size={18} />}
                {completedLessons.includes(currentLesson?.id) ? 'مكتمل' : 'تحديد كمكتمل'}
              </button>
            </div>
            <div className="lesson-desc">
              {currentLesson?.description}
            </div>
          </div>

          {/* 📝 نظام الامتحانات المتصل بلوحة التحكم */}
          <AnimatePresence mode="wait">
            {currentLesson?.quiz && currentLesson.quiz.length > 0 && (
              <motion.div 
                key={currentLesson.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="quiz-section-container"
              >
                <div className="quiz-banner">
                  <Shield size={24} color="#00f2ff" />
                  <h3>امتحان تقييم المستوى - {currentLesson.title}</h3>
                </div>
                <QuizSystem 
                  quizData={currentLesson.quiz} 
                  lessonId={currentLesson.id} 
                />
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* 📋 قائمة المحاضرات الجانبية */}
        <aside className={`playlist-sidebar ${!isSidebarOpen ? 'closed' : ''}`}>
          <div className="sidebar-header">
            <h3>محتوى الكورس</h3>
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="toggle-sidebar">
              <List size={20} />
            </button>
          </div>
          <div className="lessons-scroller">
            {courseData?.lessons?.map((lesson, index) => (
              <div 
                key={index}
                onClick={() => setCurrentLesson(lesson)}
                className={`lesson-item-box ${currentLesson?.id === lesson.id ? 'active' : ''} ${completedLessons.includes(lesson.id) ? 'completed' : ''}`}
              >
                <div className="lesson-index">
                  {completedLessons.includes(lesson.id) ? <CheckCircle size={16} color="#10b981" /> : index + 1}
                </div>
                <div className="lesson-meta">
                  <h4>{lesson.title}</h4>
                  <span>{lesson.quiz?.length > 0 ? `${lesson.quiz.length} أسئلة` : "فيديو فقط"}</span>
                </div>
                {currentLesson?.id === lesson.id && <div className="live-indicator"></div>}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CoursePlayer;
