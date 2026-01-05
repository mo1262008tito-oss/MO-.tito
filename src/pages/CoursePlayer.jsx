import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { 
  doc, getDoc, collection, query, where, 
  onSnapshot, orderBy, updateDoc, increment, arrayUnion 
} from "firebase/firestore";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, CheckCircle, ChevronRight, MessageSquare, 
  BookOpen, Star, Info, List, ArrowRight, Save, Award
} from 'lucide-react';
import './CoursePlayer.css';

// استيراد نظام الامتحانات الذي أنشأناه
import QuizSystem from './QuizSystem'; 

const CoursePlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [courseData, setCourseData] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const docSnap = await getDoc(doc(db, "courses", id));
      if (docSnap.exists()) setCourseData(docSnap.data());

      const q = query(
        collection(db, "lessons"), 
        where("courseId", "==", id),
        orderBy("createdAt", "asc")
      );

      const unsubLessons = onSnapshot(q, (snap) => {
        const lessonsList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setLessons(lessonsList);
        if (lessonsList.length > 0 && !currentLesson) setCurrentLesson(lessonsList[0]);
        setLoading(false);
      });

      return unsubLessons;
    };

    fetchData();
  }, [id]);

  const getEmbedUrl = (url) => {
    if (!url) return "";
    let videoId = "";
    if (url.includes("v=")) videoId = url.split("v=")[1].split("&")[0];
    else if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1].split("?")[0];
    return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&iv_load_policy=3&autoplay=1`;
  };

  const markAsComplete = async (lessonId) => {
    if (!auth.currentUser) return;
    const userRef = doc(db, "users", auth.currentUser.uid);
    await updateDoc(userRef, {
      completedLessons: arrayUnion(lessonId),
      points: increment(20)
    });
    alert("أحسنت! تم إتمام الدرس وإضافة 20 نقطة XP 🌟");
  };

  if (loading) return (
    <div className="vortex-loading">
      <div className="scanner"></div>
      <p>جاري تهيئة قاعة المحاضرات...</p>
    </div>
  );

  return (
    <div className="smart-player-root">
      
      {/* الحماية بالعلامة المائية */}
      <div className="watermark-overlay">
        <span>{auth.currentUser?.email} - MAFA Academy</span>
      </div>

      <nav className="player-nav">
        <button onClick={() => navigate(-1)} className="back-btn">
          <ArrowRight size={20} /> العودة للمكتبة
        </button>
        <div className="course-title-hub">
          <h2>{courseData?.title || courseData?.name}</h2>
          <span className="lesson-count">{lessons.length} دروس</span>
        </div>
        <div className="user-progress-mini">
          <Star size={18} color="#f1c40f" />
          <span>{auth.currentUser?.displayName || "طالب MAFA"}</span>
        </div>
      </nav>

      <div className="player-main-layout">
        
        <section className={`video-section ${!isSidebarOpen ? 'full-width' : ''}`}>
          <div className="video-wrapper-neon">
            <iframe 
              src={getEmbedUrl(currentLesson?.videoUrl)}
              allowFullScreen
              title={currentLesson?.title}
              onContextMenu={(e) => e.preventDefault()}
            ></iframe>
          </div>

          <div className="lesson-info-card">
            <div className="info-header">
              <div>
                <h1>{currentLesson?.title}</h1>
                <p><BookOpen size={16} /> المدرس: {courseData?.instructor || "أ. محمود فرج"}</p>
              </div>
              <button onClick={() => markAsComplete(currentLesson?.id)} className="complete-btn">
                <CheckCircle size={18} /> تم الانتهاء
              </button>
            </div>
            <div className="lesson-desc">
              {currentLesson?.description || "ركز في كل كلمة، القادم أهم!"}
            </div>
          </div>

          {/* نظام الامتحانات - يظهر هنا تلقائياً إذا وجدت أسئلة في قاعدة البيانات */}
          <AnimatePresence>
            {currentLesson?.quiz && currentLesson.quiz.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="quiz-section-container"
              >
                <div className="quiz-banner">
                  <Award size={24} color="#00f2ff" />
                  <h3>امتحان تقييم الفهم للدرس</h3>
                </div>
                <QuizSystem 
                  quizData={currentLesson.quiz} 
                  lessonId={currentLesson.id} 
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="student-notes-area">
            <h3><MessageSquare size={18} /> مذكراتك الشخصية</h3>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="سجل ملاحظاتك هنا أثناء المشاهدة..."
            ></textarea>
            <button className="save-notes"><Save size={16} /> حفظ الملاحظات</button>
          </div>
        </section>

        <aside className={`playlist-sidebar ${!isSidebarOpen ? 'closed' : ''}`}>
          <div className="sidebar-header">
            <h3>قائمة المحاضرات</h3>
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="toggle-sidebar">
              <List size={20} />
            </button>
          </div>
          <div className="lessons-scroller">
            {lessons.map((lesson, index) => (
              <motion.div 
                whileHover={{ x: -5 }}
                key={lesson.id}
                onClick={() => setCurrentLesson(lesson)}
                className={`lesson-item-box ${currentLesson?.id === lesson.id ? 'active' : ''}`}
              >
                <div className="lesson-index">{String(index + 1).padStart(2, '0')}</div>
                <div className="lesson-meta">
                  <h4>{lesson.title}</h4>
                  <span>{lesson.quiz ? `${lesson.quiz.length} أسئلة` : "فيديو فقط"}</span>
                </div>
                {currentLesson?.id === lesson.id && (
                  <div className="playing-wave">
                    <span></span><span></span><span></span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CoursePlayer;
