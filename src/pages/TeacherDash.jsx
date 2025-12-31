import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase'; // أضفنا auth هنا
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";

const TeacherDash = () => {
  const [courses, setCourses] = useState([]);
  const [videoLink, setVideoLink] = useState('');
  const [lessonTitle, setLessonTitle] = useState(''); // أضفنا حقل لعنوان الدرس
  const [selectedCourse, setSelectedCourse] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // جلب كورسات المعلم الحالي بناءً على إيميله أو اسمه المسجل في Auth
    if (auth.currentUser) {
      // يفضل البحث بالإيميل لأنه فريد لا يتكرر
      const q = query(
        collection(db, "courses"), 
        where("instructorEmail", "==", auth.currentUser.email)
      );

      const unsub = onSnapshot(q, (snap) => {
        setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return () => unsub();
    }
  }, []);

  const handleUploadVideo = async () => {
    if (!videoLink || !selectedCourse || !lessonTitle) {
      return alert("يرجى إكمال كافة البيانات: العنوان، الكورس، والرابط");
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "lessons"), {
        courseId: selectedCourse,
        title: lessonTitle,
        videoUrl: videoLink,
        teacherId: auth.currentUser.uid,
        createdAt: serverTimestamp() // استخدام وقت السيرفر لضمان الدقة
      });
      
      alert("✅ تم نشر الدرس بنجاح لطلابك");
      setVideoLink('');
      setLessonTitle('');
    } catch (error) {
      alert("خطأ أثناء النشر: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="admin-wrapper" style={{ direction: 'rtl', padding: '100px 5%' }}>
      <div className="hero-dash glass-card">
        <h1 className="glitch">منصة المعلم</h1>
        <p>أهلاً بك يا {auth.currentUser?.displayName || "دكتور"}، بانتظار إبداعك اليوم.</p>
      </div>

      <div className="main-player-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '25px', marginTop: '30px' }}>
        
        {/* نموذج إضافة الدرس */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '20px' }}>🎥 رفع محتوى تعليمي جديد</h3>
          <div className="login-form">
            <input 
              type="text" 
              placeholder="عنوان الدرس (مثلاً: حل تمارين الدرس الأول)" 
              className="search-input" 
              style={{width: '100%', marginBottom: '15px'}} 
              value={lessonTitle} 
              onChange={(e) => setLessonTitle(e.target.value)} 
            />

            <select 
              className="search-input" 
              style={{width: '100%', marginBottom: '15px', background: '#1a1a1a', color: '#fff'}} 
              onChange={(e) => setSelectedCourse(e.target.value)}
              value={selectedCourse}
            >
              <option value="">اختر الكورس المستهدف...</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <input 
              type="text" 
              placeholder="رابط الفيديو (YouTube / Vimeo / Drive)" 
              className="search-input" 
              style={{width: '100%', marginBottom: '15px'}} 
              value={videoLink} 
              onChange={(e) => setVideoLink(e.target.value)} 
            />

            <button 
              className="active-btn" 
              style={{width: '100%', opacity: loading ? 0.7 : 1}} 
              onClick={handleUploadVideo}
              disabled={loading}
            >
              {loading ? "جاري المعالجة..." : "نشر الدرس للطلاب الآن"}
            </button>
          </div>
        </div>

        {/* الجانب الإحصائي */}
        <div className="lessons-sidebar">
          <div className="glass-card">
            <h3 style={{color: '#f1c40f'}}>📊 ملخص نشاطك</h3>
            <div className="stat-card" style={{marginTop: '20px', textAlign: 'center'}}>
               <p>كورساتك المتاحة</p>
               <h2 style={{color: '#9b59b6', fontSize: '3rem'}}>{courses.length}</h2>
            </div>
          </div>
          
          <div className="glass-card" style={{marginTop: '20px', fontSize: '0.8rem', color: '#aaa'}}>
            <p>💡 نصيحة: تأكد أن روابط الفيديو عامة أو "Unlisted" ليتمكن الطلاب من مشاهدتها.</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TeacherDash;