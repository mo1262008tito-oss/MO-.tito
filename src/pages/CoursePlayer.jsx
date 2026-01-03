import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, onSnapshot, orderBy } from "firebase/firestore";

const CoursePlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [courseData, setCourseData] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // جلب بيانات الكورس
    const fetchCourse = async () => {
      const docSnap = await getDoc(doc(db, "courses", id));
      if (docSnap.exists()) {
        setCourseData(docSnap.data());
      }
    };

    // جلب الدروس بترتيب تصاعدي
    const q = query(
      collection(db, "lessons"), 
      where("courseId", "==", id),
      orderBy("createdAt", "asc")
    );

    const unsubLessons = onSnapshot(q, (snap) => {
      const lessonsList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setLessons(lessonsList);
      if (lessonsList.length > 0) setCurrentLesson(lessonsList[0]);
      setLoading(false);
    });

    fetchCourse();
    return () => unsubLessons();
  }, [id]);

  // دالة لتنظيف وتحويل رابط يوتيوب ليكون احترافياً
  const getEmbedUrl = (url) => {
    if (!url) return "";
    let videoId = "";
    if (url.includes("v=")) {
      videoId = url.split("v=")[1].split("&")[0];
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1].split("?")[0];
    }
    // rel=0 تمنع اقتراحات فيديوهات من قنوات أخرى
    // modestbranding=1 تخفي شعار يوتيوب من شريط التحكم
    // iv_load_policy=3 تخفي الملاحظات المزعجة فوق الفيديو
    return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&iv_load_policy=3&showinfo=0`;
  };

  // منع النقر الأيمن فوق منطقة الفيديو (حماية بسيطة)
  const preventContextMenu = (e) => {
    e.preventDefault();
  };

  if (loading) return <div className="loader">جاري تحميل المحتوى التعليمي...</div>;

  return (
    <div className="player-container" style={{ direction: 'rtl', padding: '20px', backgroundColor: '#121212', color: '#fff', minHeight: '100vh' }}>
      
      {/* الهيدر */}
      <div className="player-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', background: '#1e1e1e', padding: '15px', borderRadius: '10px' }}>
        <button onClick={() => navigate('/student-dash')} style={{ background: '#f1c40f', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>⬅ عودة للمكتبة</button>
        <div>
          <h2 style={{ margin: 0, color: '#f1c40f' }}>{courseData?.name}</h2>
          <small>المحاضر: {courseData?.instructor}</small>
        </div>
      </div>

      <div className="main-layout" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        
        {/* منطقة الفيديو */}
        <div style={{ flex: '1 1 600px' }}>
          <div 
            className="video-holder" 
            onContextMenu={preventContextMenu} // منع النقر اليمين
            style={{ position: 'relative', paddingTop: '56.25%', background: '#000', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
          >
            {currentLesson ? (
              <iframe 
                src={getEmbedUrl(currentLesson.videoUrl)}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={currentLesson.title}
              ></iframe>
            ) : (
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>لا يوجد فيديو متاح</div>
            )}
          </div>
          
          <div className="details" style={{ marginTop: '20px', background: '#1e1e1e', padding: '20px', borderRadius: '12px' }}>
            <h3 style={{ color: '#f1c40f' }}>{currentLesson?.title}</h3>
            <p style={{ color: '#bbb' }}>{currentLesson?.description || "لا يوجد وصف لهذا الدرس."}</p>
          </div>
        </div>

        {/* القائمة الجانبية */}
        <div style={{ flex: '1 1 300px', background: '#1e1e1e', borderRadius: '12px', maxHeight: '80vh', overflowY: 'auto' }}>
          <h3 style={{ padding: '20px', borderBottom: '1px solid #333', margin: 0 }}>محتوى الكورس</h3>
          {lessons.map((lesson, index) => (
            <div 
              key={lesson.id}
              onClick={() => setCurrentLesson(lesson)}
              style={{
                padding: '15px',
                cursor: 'pointer',
                borderBottom: '1px solid #222',
                background: currentLesson?.id === lesson.id ? '#2c2c2c' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: '0.3s'
              }}
            >
              <span style={{ color: currentLesson?.id === lesson.id ? '#f1c40f' : '#666' }}>{index + 1}.</span>
              <div>
                <div style={{ fontSize: '0.9rem', color: currentLesson?.id === lesson.id ? '#f1c40f' : '#fff' }}>{lesson.title}</div>
                <small style={{ color: '#555' }}>فيديو</small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CoursePlayer;