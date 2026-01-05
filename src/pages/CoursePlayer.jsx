import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { 
  doc, getDoc, collection, query, where, 
  onSnapshot, orderBy, updateDoc, increment, arrayUnion 
} from "firebase/firestore";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, CheckCircle, ChevronRight, MessageSquare, 
  BookOpen, Star, Info, List, ArrowRight, Save
} from 'lucide-react';
import './CoursePlayer.css';

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
    // 1. جلب بيانات الكورس والدروس
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

  // دالة الحماية وتحويل الرابط
  const getEmbedUrl = (url) => {
    if (!url) return "";
    let videoId = "";
    if (url.includes("v=")) videoId = url.split("v=")[1].split("&")[0];
    else if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1].split("?")[0];
    return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&iv_load_policy=3&autoplay=1`;
  };

  // تسجيل إتمام الدرس ومنح نقاط
  const markAsComplete = async (lessonId) => {
    if (!auth.currentUser) return;
    const userRef = doc(db, "users", auth.currentUser.uid);
    await updateDoc(userRef, {
      completedLessons: arrayUnion(lessonId),
      points: increment(20) // مكافأة الانتهاء من درس
    });
    alert("أحسنت! تم إضافة 20 نقطة XP لرصيدك 🌟");
  };

  if (loading) return (
    <div className="vortex-loading">
      <div className="scanner"></div>
      <p>جاري تهيئة قاعة المحاضرات...</p>
    </div>
  );

  return (
    <div className="smart-player-root">
      
      {/* العلامة المائية للحماية - يظهر إيميل الطالب بشكل خافت جداً ويتحرك */}
      <div className="watermark-overlay">
        <span>{auth.currentUser?.email} - MAFA Academy</span>
      </div>

      {/* الشريط العلوي */}
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
          <span>{auth.currentUser?.displayName}</span>
        </div>
      </nav>

      <div className="player-main-layout">
        
        {/* منطقة الفيديو والمحتوى */}
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
              {currentLesson?.description || "لا يوجد وصف لهذه المحاضرة، ركز في الشرح!"}
            </div>
          </div>

          {/* مفكرة الطالب الشخصية */}
          <div className="student-notes-area">
            <h3><MessageSquare size={18} /> مذكراتك الشخصية (تُحفظ سحابياً)</h3>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="اكتب أهم النقاط التي ذكرها المستر هنا..."
            ></textarea>
            <button className="save-notes"><Save size={16} /> حفظ الملاحظات</button>
          </div>
        </section>

        {/* قائمة الدروس الجانبية الذكية */}
        <aside className={`playlist-sidebar ${!isSidebarOpen ? 'closed' : ''}`}>
          <div className="sidebar-header">
            <h3>محتوى الكورس</h3>
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
                  <span><Play size={12} /> 45:00 دقيقة</span>
                </div>
                {currentLesson?.id === lesson.id && <div className="playing-wave"><span></span><span></span><span></span></div>}
              </motion.div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CoursePlayer;
