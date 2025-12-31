import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, onSnapshot, orderBy } from "firebase/firestore";

const CoursePlayer = () => {
  const { id } = useParams(); // ID الكورس من الرابط
  const navigate = useNavigate();
  
  const [courseData, setCourseData] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. جلب بيانات الكورس الأساسية
    const fetchCourse = async () => {
      const docSnap = await getDoc(doc(db, "courses", id));
      if (docSnap.exists()) {
        setCourseData(docSnap.data());
      }
    };

    // 2. جلب الدروس المرتبطة بهذا الكورس
    const q = query(
      collection(db, "lessons"), 
      where("courseId", "==", id),
      orderBy("createdAt", "asc") // ترتيب الدروس من الأقدم للأحدث
    );

    const unsubLessons = onSnapshot(q, (snap) => {
      const lessonsList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setLessons(lessonsList);
      if (lessonsList.length > 0) setCurrentLesson(lessonsList[0]); // تشغيل أول درس تلقائياً
      setLoading(false);
    });

    fetchCourse();
    return () => unsubLessons();
  }, [id]);

  if (loading) return <div className="loader">جاري تجهيز قاعة المحاضرات...</div>;

  return (
    <div className="player-container" style={{ direction: 'rtl', padding: '80px 20px' }}>
      
      {/* الهيدر العلوي */}
      <div className="player-header glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px' }}>
        <button className="back-btn" onClick={() => navigate('/student-dash')}>⬅ عودة للمكتبة</button>
        <div className="course-info-top" style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#f1c40f' }}>{courseData?.name}</h2>
          <span>المحاضر: {courseData?.instructor}</span>
        </div>
        <div className="progress-mini" style={{ width: '150px' }}>
          <span style={{ fontSize: '0.8rem' }}>مستوى الإنجاز</span>
          <div className="bar" style={{ background: '#333', height: '8px', borderRadius: '5px' }}>
            <div className="fill" style={{ width: '60%', background: '#2ecc71', height: '100%', borderRadius: '5px' }}></div>
          </div>
        </div>
      </div>

      <div className="main-player-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '20px', marginTop: '20px' }}>
        
        {/* منطقة الفيديو ووصف الدرس */}
        <section className="video-area">
          <div className="video-wrapper glass-card" style={{ position: 'relative', paddingTop: '56.25%', overflow: 'hidden' }}>
            {currentLesson ? (
              <iframe 
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                src={currentLesson.videoUrl.replace("watch?v=", "embed/")} 
                title={currentLesson.title}
                allowFullScreen
              ></iframe>
            ) : (
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                لا توجد دروس مرفوعة لهذا الكورس بعد.
              </div>
            )}
          </div>
          
          <div className="lesson-desc glass-card" style={{ marginTop: '20px', padding: '20px' }}>
            <h3 style={{ color: '#f1c40f' }}>📖 درس اليوم: {currentLesson?.title}</h3>
            <p style={{ marginTop: '10px', lineHeight: '1.8', color: '#ccc' }}>
              {currentLesson?.description || "لا يوجد وصف متاح لهذا الدرس حالياً."}
            </p>
            <div className="action-btns" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
               <button className="active-btn">📁 تحميل ملزمة الدرس</button>
               <button className="feature-btn">❓ اسأل المعلم</button>
            </div>
          </div>
        </section>

        {/* قائمة الدروس الجانبية */}
        <aside className="lessons-sidebar glass-card" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
          <h3 style={{ padding: '15px', borderBottom: '1px solid #333' }}>قائمة المحاضرات ({lessons.length})</h3>
          <div className="lessons-list">
            {lessons.map((lesson, index) => (
              <div 
                key={lesson.id} 
                className={`lesson-item ${currentLesson?.id === lesson.id ? 'active-lesson' : ''}`}
                style={{
                  padding: '15px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #222',
                  background: currentLesson?.id === lesson.id ? 'rgba(241, 196, 15, 0.1)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
                onClick={() => setCurrentLesson(lesson)}
              >
                <div className="lesson-num" style={{ color: '#f1c40f', fontWeight: 'bold' }}>{index + 1}</div>
                <div className="lesson-title">
                  <div style={{ fontSize: '0.9rem' }}>{lesson.title}</div>
                  <small style={{ color: '#666' }}>🕒 فيديو</small>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CoursePlayer;