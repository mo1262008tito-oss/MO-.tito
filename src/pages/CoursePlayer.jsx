import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc, increment, arrayUnion, onSnapshot } from "firebase/firestore";
import { motion, AnimatePresence } from 'framer-motion';
import {  
  Play, CheckCircle, ChevronRight, MessageSquare,  
  BookOpen, Star, List, ArrowRight, Save, Award, Lock, Shield, 
  FileText, Download, Zap, Maximize2, Monitor
} from 'lucide-react';

import './CoursePlayer.css';

const CoursePlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // حالات النظام
  const [courseData, setCourseData] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [userPoints, setUserPoints] = useState(0);

  // 1. جلب البيانات اللحظية للكورس والطالب
  useEffect(() => {
    let unsubUser = () => {};

    const fetchInitialData = async () => {
      try {
        const docRef = doc(db, "courses_metadata", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setCourseData(data);
          // تشغيل أول محاضرة تلقائياً
          if (data.lessons && data.lessons.length > 0) {
            setCurrentLesson(data.lessons[0]);
          }
        } else {
          alert("⚠️ هذا المحتوى غير متاح حالياً.");
          navigate('/all-courses');
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
        console.error("Player Error:", error);
        setLoading(false);
      }
    };

    fetchInitialData();
    return () => unsubUser();
  }, [id, navigate]);

  // 2. معالج روابط الفيديو (دعم يوتيوب وغيره)
  const getEmbedUrl = (url) => {
    if (!url) return "";
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const vId = url.includes("v=") ? url.split("v=")[1].split("&")[0] : url.split("/").pop();
      return `https://www.youtube.com/embed/${vId}?rel=0&modestbranding=1&autoplay=1&showinfo=0`;
    }
    return url; // لدعم روابط السيرفرات الخاصة مستقبلاً
  };

  // 3. نظام إتمام الدروس والمكافآت
  const handleLessonComplete = async (lessonId) => {
    if (!auth.currentUser || completedLessons.includes(lessonId)) return;

    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        completedLessons: arrayUnion(lessonId),
        points: increment(100) // مكافأة كبيرة عند إتمام فيديو
      });
      alert("🎉 مبروك! حصلت على 100 نقطة إضافية لإنهاء المحاضرة.");
    } catch (e) {
      console.error("Update Error:", e);
    }
  };

  if (loading) return (
    <div className="vortex-container">
      <Zap className="spin-icon" size={60} color="#00f2ff" />
      <p>جاري تهيئة القاعة التعليمية...</p>
    </div>
  );

  return (
    <div className="mafa-player-env no-select rtl">
      {/* 🛡️ نظام الحماية: علامة مائية عشوائية تظهر لمنع التصوير */}
      <div className="dynamic-watermark">
        {auth.currentUser?.email} | IP: PROTECTED
      </div>

      {/* الهيدر العلوي */}
      <header className="player-top-nav glass">
        <div className="right-side">
          <button onClick={() => navigate('/all-courses')} className="icon-btn"><ArrowRight /></button>
          <div className="course-info">
            <h1>{courseData?.title}</h1>
            <span><Monitor size={14}/> {currentLesson?.title}</span>
          </div>
        </div>
        <div className="left-side">
          <div className="points-badge"><Award size={18}/> {userPoints} نقطة</div>
          <div className="user-pill">{auth.currentUser?.displayName?.split(' ')[0]}</div>
        </div>
      </header>

      <div className="player-body">
        {/* منطقة المشغل */}
        <section className={`main-stage ${!isSidebarOpen ? 'expanded' : ''}`}>
          <div className="video-viewport glass">
            <iframe 
              src={getEmbedUrl(currentLesson?.videoUrl)} 
              allowFullScreen 
              title="MAFA Video Player"
              onContextMenu={e => e.preventDefault()}
            ></iframe>
          </div>

          <div className="interaction-bar glass">
            <div className="lesson-text">
              <h2>{currentLesson?.title}</h2>
              <p>{currentLesson?.description || "استمتع بمشاهدة المحاضرة وقم بتدوين ملاحظاتك."}</p>
            </div>
            
            <div className="action-hub">
              {currentLesson?.pdfUrl && (
                <a href={currentLesson.pdfUrl} target="_blank" rel="noreferrer" className="btn-attachment">
                  <Download size={18} /> ملزمة الدرس
                </a>
              )}
              <button 
                className={`btn-complete ${completedLessons.includes(currentLesson?.id) ? 'active' : ''}`}
                onClick={() => handleLessonComplete(currentLesson?.id)}
              >
                {completedLessons.includes(currentLesson?.id) ? <CheckCircle /> : <Play />}
                {completedLessons.includes(currentLesson?.id) ? 'تم الإتمام' : 'اعتماد المشاهدة'}
              </button>
            </div>
          </div>

          {/* نوتة الطالب الذكية */}
          <div className="student-notes glass">
             <h3><FileText size={18}/> مفكرة المحاضرة</h3>
             <textarea placeholder="اكتب ملاحظاتك المهمة هنا... (يتم الحفظ تلقائياً قريباً)"></textarea>
          </div>
        </section>

        {/* قائمة الدروس الجانبية */}
        <aside className={`playlist-sidebar ${!isSidebarOpen ? 'collapsed' : ''}`}>
          <div className="sidebar-toggle" onClick={() => setSidebarOpen(!isSidebarOpen)}>
            <List size={20} /> {isSidebarOpen && "محتوى الكورس"}
          </div>
          
          <div className="lesson-items-container">
            {courseData?.lessons?.map((lesson, index) => (
              <div 
                key={index}
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
                    {lesson.pdfUrl && <span><FileText size={12}/> ملزمة</span>}
                  </div>
                </div>
                {currentLesson?.id === lesson.id && <div className="playing-pulse"></div>}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CoursePlayer;
