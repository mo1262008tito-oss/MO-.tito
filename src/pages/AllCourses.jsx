import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, BookOpen, User, Star, PlusCircle, LogIn, PlayCircle } from 'lucide-react';
import './AllCourses.css';

const AllCourses = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('الكل');
  const [availableCourses, setAvailableCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. جلب الكورسات من Firestore (مجموعة courses المجانية)
  useEffect(() => {
    // لاحظ أننا نسحب من مجموعة "courses" التي حددناها للمجاني في الأدمن
    const unsub = onSnapshot(collection(db, "courses"), (snapshot) => {
      const coursesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAvailableCourses(coursesData);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // 2. تصفية البحث (تم تعديل البحث ليشمل title بدلاً من name ليطابق الأدمن)
  const filteredCourses = availableCourses.filter(course => 
    (filter === 'الكل' || course.grade === filter) && // التصفية حسب الصف الدراسي 1 أو 2 أو 3
    (course.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     course.instructor?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // 3. دالة الاشتراك
  const handleEnroll = async (courseId, courseTitle) => {
    const user = auth.currentUser;

    if (!user) {
      alert("⚠️ يجب تسجيل الدخول أولاً لتتمكن من مشاهدة الكورس.");
      return navigate('/login');
    }

    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      // إضافة الكورس لمكتبة الطالب إذا لم يكن موجوداً
      if (userSnap.exists() && !userSnap.data().enrolledCourses?.includes(courseId)) {
        await updateDoc(userRef, {
          enrolledCourses: arrayUnion(courseId)
        });
      }
      
      alert(`🚀 تم فتح كورس "${courseTitle}" بنجاح.`);
      navigate(`/video-player/${courseId}`); // التوجه لصفحة المشاهدة
    } catch (error) {
      alert("حدث خطأ في الوصول للكورس.");
    }
  };

  if (loading) return (
    <div className="loader-container">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="loader-icon">⚙️</motion.div>
      <p>جاري تحميل الكورسات المجانية...</p>
    </div>
  );

  return (
    <div className="all-courses-root rtl-support">
      <section className="library-header">
        <motion.h1 initial={{ y: -20 }} animate={{ y: 0 }} className="glitch">
          📺 محاضرات MAFA المجانية
        </motion.h1>
        <p>محتوى تعليمي متاح للجميع بجودة احترافية</p>
      </section>

      <div className="control-panel glass-card">
        <div className="search-box">
          <Search size={20} />
          <input 
            type="text" 
            placeholder="ابحث عن درس أو مدرس..." 
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-group">
          <Filter size={18} />
          {['الكل', '1', '2', '3'].map(grade => (
            <button 
              key={grade} 
              className={filter === grade ? 'active' : ''} 
              onClick={() => setFilter(grade)}
            >
              {grade === 'الكل' ? 'كل الصفوف' : `ثانية ${grade} ث`}
            </button>
          ))}
        </div>
      </div>

      <main className="courses-grid">
        <AnimatePresence>
          {filteredCourses.map(course => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={course.id} 
              className="modern-course-card glass-card"
            >
              {/* التاج يظهر الصف الدراسي */}
              <div className="card-tag">الصف {course.grade} ثانوي</div>
              
              <div className="card-visual">
                {/* إذا كان هناك صورة Thumbnail من الأدمن تعرض، وإلا نعرض أيقونة افتراضية */}
                {course.thumbnail ? (
                  <img src={course.thumbnail} alt={course.title} className="course-thumb-img" />
                ) : (
                  <PlayCircle size={50} color="#00f2ff" />
                )}
              </div>

              <div className="card-details">
                <h3>{course.title}</h3>
                <div className="info-row">
                  <User size={14} /> <span>{course.instructor || 'القائد محمود'}</span>
                </div>
                
                <div className="card-footer">
                  <div className="free-badge">مجاني بالكامل</div>
                  <button className="action-btn" onClick={() => handleEnroll(course.id, course.title)}>
                    {auth.currentUser ? <PlayCircle size={18} /> : <LogIn size={18} />}
                    {auth.currentUser ? 'ابدأ المشاهدة' : 'سجل للدخول'}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </main>

      {filteredCourses.length === 0 && (
        <div className="empty-state">
          <BookOpen size={48} />
          <p>لا توجد كورسات مجانية مضافة لهذا الصف حالياً.</p>
        </div>
      )}
    </div>
  );
};

export default AllCourses;
