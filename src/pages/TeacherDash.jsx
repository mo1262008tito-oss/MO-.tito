import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";

const TeacherDash = () => {
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(false);

  // حقول إضافة كورس
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseImage, setNewCourseImage] = useState('');
  const [courseCategory, setCourseCategory] = useState('free'); // free (الكورسات) | paid (الثانوية)

  // حقول إضافة درس
  const [lessonTitle, setLessonTitle] = useState('');
  const [videoLink, setVideoLink] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [isPaidLesson, setIsPaidLesson] = useState(false);

  useEffect(() => {
    if (auth.currentUser) {
      // جلب الكورسات الخاصة بالمعلم
      const qCourses = query(collection(db, "courses"), where("instructorEmail", "==", auth.currentUser.email));
      const unsubCourses = onSnapshot(qCourses, (snap) => {
        setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      // جلب الدروس المرفوعة بواسطة المعلم
      const qLessons = query(collection(db, "lessons"), where("teacherEmail", "==", auth.currentUser.email));
      const unsubLessons = onSnapshot(qLessons, (snap) => {
        setLessons(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      return () => { unsubCourses(); unsubLessons(); };
    }
  }, []);

  const handleCreateCourse = async () => {
    if (!newCourseName) return alert("يرجى كتابة اسم الكورس");
    setLoading(true);
    try {
      await addDoc(collection(db, "courses"), {
        name: newCourseName,
        image: newCourseImage || "https://img.freepik.com/free-vector/online-tutorials-concept_52683-37453.jpg",
        instructor: auth.currentUser.displayName || "المعلم",
        instructorEmail: auth.currentUser.email,
        createdAt: serverTimestamp(),
        category: courseCategory // تحديد المكان (مجاني للعام، مدفوع للثانوية)
      });
      alert("✅ تم إنشاء الكورس بنجاح");
      setNewCourseName(''); setNewCourseImage('');
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  const handleUploadVideo = async () => {
    if (!videoLink || !selectedCourse || !lessonTitle) return alert("أكمل بيانات الدرس");
    setLoading(true);
    try {
      await addDoc(collection(db, "lessons"), {
        courseId: selectedCourse,
        title: lessonTitle,
        videoUrl: videoLink,
        isPaid: isPaidLesson,
        teacherEmail: auth.currentUser.email,
        createdAt: serverTimestamp()
      });
      alert("✅ تم نشر الدرس");
      setLessonTitle(''); setVideoLink('');
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  const handleDeleteLesson = async (id) => {
    if(window.confirm("هل تريد حذف هذا الدرس؟")) {
      await deleteDoc(doc(db, "lessons", id));
    }
  };

  return (
    <div style={{ direction: 'rtl', padding: '80px 5%', backgroundColor: '#0a0a0a', color: '#fff', minHeight: '100vh' }}>
      
      {/* رأس الصفحة */}
      <div style={{ background: 'linear-gradient(90deg, #1e3a8a, #3b82f6)', padding: '40px', borderRadius: '20px', marginBottom: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
        <h1>مرحباً، أ. {auth.currentUser?.displayName || 'المعلم'} 🍎</h1>
        <p>إحصائياتك: {courses.length} كورس | {lessons.length} درس منشور</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '25px' }}>
        
        {/* إضافة كورس */}
        <div className="glass-card" style={{ padding: '25px', background: '#161616', borderRadius: '15px', border: '1px solid #333' }}>
          <h3 style={{ color: '#60a5fa' }}>🛠️ إنشاء كورس جديد</h3>
          <input type="text" placeholder="اسم الكورس" style={inputStyle} value={newCourseName} onChange={e => setNewCourseName(e.target.value)} />
          <input type="text" placeholder="رابط الصورة" style={inputStyle} value={newCourseImage} onChange={e => setNewCourseImage(e.target.value)} />
          
          <label style={{ display: 'block', margin: '10px 0' }}>نوع الكورس (مكان الظهور):</label>
          <select style={inputStyle} value={courseCategory} onChange={e => setCourseCategory(e.target.value)}>
            <option value="free">كورس مجاني (يظهر في صفحة الكورسات)</option>
            <option value="paid">كورس مدفوع (يظهر في صفحة الثانوية)</option>
          </select>
          
          <button onClick={handleCreateCourse} disabled={loading} style={btnStyle(loading, '#3b82f6')}>
            {loading ? "جاري الحفظ..." : "إنشاء الكورس"}
          </button>
        </div>

        {/* إضافة درس */}
        <div className="glass-card" style={{ padding: '25px', background: '#161616', borderRadius: '15px', border: '1px solid #333' }}>
          <h3 style={{ color: '#fbbf24' }}>🎥 إضافة محتوى للطلاب</h3>
          <select style={inputStyle} value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
            <option value="">اختر الكورس المستهدف...</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input type="text" placeholder="عنوان الدرس" style={inputStyle} value={lessonTitle} onChange={e => setLessonTitle(e.target.value)} />
          <input type="text" placeholder="رابط الفيديو" style={inputStyle} value={videoLink} onChange={e => setVideoLink(e.target.value)} />
          
          <div style={{ margin: '10px 0' }}>
            <label><input type="checkbox" checked={isPaidLesson} onChange={e => setIsPaidLesson(e.target.checked)} /> درس يحتاج اشتراك (مدفوع)</label>
          </div>

          <button onClick={handleUploadVideo} disabled={loading} style={btnStyle(loading, '#fbbf24')}>
             نشر الدرس الآن
          </button>
        </div>
      </div>

      {/* إدارة الدروس الحالية */}
      <div style={{ marginTop: '40px' }}>
        <h3>📋 إدارة دروسك المنشورة:</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', background: '#111' }}>
            <thead>
              <tr style={{ background: '#222' }}>
                <th style={tdStyle}>عنوان الدرس</th>
                <th style={tdStyle}>الحالة</th>
                <th style={tdStyle}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {lessons.map(ls => (
                <tr key={ls.id} style={{ borderBottom: '1px solid #333' }}>
                  <td style={tdStyle}>{ls.title}</td>
                  <td style={tdStyle}>{ls.isPaid ? '💰 مدفوع' : '✅ مجاني'}</td>
                  <td style={tdStyle}>
                    <button onClick={() => handleDeleteLesson(ls.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>حذف</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Styles
const inputStyle = { width: '100%', padding: '12px', margin: '8px 0', background: '#000', border: '1px solid #333', color: '#fff', borderRadius: '8px' };
const btnStyle = (loading, color) => ({
  width: '100%', padding: '15px', marginTop: '10px', border: 'none', borderRadius: '8px',
  background: loading ? '#555' : color, color: '#000', fontWeight: 'bold', cursor: 'pointer'
});
const tdStyle = { padding: '15px', textAlign: 'right' };

export default TeacherDash;
