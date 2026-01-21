import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";

const TeacherDash = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  // حقول إضافة كورس جديد
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseImage, setNewCourseImage] = useState('');

  // حقول إضافة درس
  const [lessonTitle, setLessonTitle] = useState('');
  const [videoLink, setVideoLink] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [isPaid, setIsPaid] = useState(false); // هل الدرس مدفوع؟
  const [price, setPrice] = useState('');

  useEffect(() => {
    if (auth.currentUser) {
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

  // 1. وظيفة إضافة كورس جديد (مجاني)
  const handleCreateCourse = async () => {
    if (!newCourseName) return alert("يرجى كتابة اسم الكورس");
    setLoading(true);
    try {
      await addDoc(collection(db, "courses"), {
        name: newCourseName,
        image: newCourseImage || "https://via.placeholder.com/150",
        instructor: auth.currentUser.displayName || "المعلم",
        instructorEmail: auth.currentUser.email,
        createdAt: serverTimestamp(),
        type: 'free'
      });
      alert("✅ تم إنشاء الكورس بنجاح");
      setNewCourseName('');
      setNewCourseImage('');
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  // 2. وظيفة إضافة درس (عادي أو مدفوع بكود)
  const handleUploadVideo = async () => {
    if (!videoLink || !selectedCourse || !lessonTitle) {
      return alert("أكمل بيانات الدرس أولاً");
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "lessons"), {
        courseId: selectedCourse,
        title: lessonTitle,
        videoUrl: videoLink,
        isPaid: isPaid, 
        price: isPaid ? price : 0,
        requiresCode: isPaid, // يحتاج كود إذا كان مدفوعاً
        teacherId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
      
      alert(isPaid ? "✅ تم نشر الدرس المدفوع بنجاح" : "✅ تم نشر الدرس المجاني");
      setVideoLink('');
      setLessonTitle('');
      setPrice('');
      setIsPaid(false);
    } catch (error) { alert(error.message); }
    setLoading(false);
  };

  return (
    <div className="admin-wrapper" style={{ direction: 'rtl', padding: '100px 5%', backgroundColor: '#0f0f0f', color: '#fff' }}>
      
      <div className="hero-dash glass-card" style={{ textAlign: 'center', padding: '30px', borderRadius: '15px', background: 'linear-gradient(45deg, #1a1a1a, #2c3e50)' }}>
        <h1 style={{ color: '#f1c40f' }}>لوحة تحكم المعلم الذكية</h1>
        <p>أهلاً {auth.currentUser?.displayName} | يمكنك الآن إدارة الكورسات والدروس المدفوعة.</p>
      </div>

      <div className="main-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginTop: '30px' }}>
        
        {/* القسم الأول: إضافة كورس جديد */}
        <div className="glass-card" style={{ padding: '20px', border: '1px solid #333' }}>
          <h3 style={{ color: '#2ecc71' }}>🆕 إنشاء كورس جديد</h3>
          <input 
            type="text" placeholder="اسم الكورس الجديد" className="search-input" 
            style={{ width: '100%', margin: '10px 0', padding: '12px' }}
            value={newCourseName} onChange={(e) => setNewCourseName(e.target.value)}
          />
          <input 
            type="text" placeholder="رابط صورة الكورس (اختياري)" className="search-input" 
            style={{ width: '100%', margin: '10px 0', padding: '12px' }}
            value={newCourseImage} onChange={(e) => setNewCourseImage(e.target.value)}
          />
          <button className="active-btn" onClick={handleCreateCourse} disabled={loading} style={{ width: '100%', background: '#2ecc71' }}>
            إنشاء الكورس الآن
          </button>
        </div>

        {/* القسم الثاني: إضافة درس */}
        <div className="glass-card" style={{ padding: '20px', border: '1px solid #333' }}>
          <h3 style={{ color: '#f1c40f' }}>🎥 إضافة درس (مجاني/مدفوع)</h3>
          
          <input 
            type="text" placeholder="عنوان الدرس" className="search-input" 
            style={{ width: '100%', margin: '10px 0' }}
            value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)}
          />

          <select 
            className="search-input" style={{ width: '100%', margin: '10px 0', background: '#000', color: '#fff' }}
            onChange={(e) => setSelectedCourse(e.target.value)} value={selectedCourse}
          >
            <option value="">اختر الكورس...</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <input 
            type="text" placeholder="رابط الفيديو" className="search-input" 
            style={{ width: '100%', margin: '10px 0' }}
            value={videoLink} onChange={(e) => setVideoLink(e.target.value)}
          />

          <div style={{ margin: '15px 0', padding: '10px', background: '#1a1a1a', borderRadius: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input type="checkbox" checked={isPaid} onChange={(e) => setIsPaid(e.target.checked)} />
              هذا الدرس مدفوع (يتطلب كود تفعيل)
            </label>
            
            {isPaid && (
              <input 
                type="number" placeholder="سعر الدرس (جنيه/ريال)" className="search-input" 
                style={{ width: '100%', marginTop: '10px', border: '1px solid #f1c40f' }}
                value={price} onChange={(e) => setPrice(e.target.value)}
              />
            )}
          </div>

          <button className="active-btn" onClick={handleUploadVideo} disabled={loading} style={{ width: '100%' }}>
            {loading ? "جاري النشر..." : "نشر المحتوى"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default TeacherDash;