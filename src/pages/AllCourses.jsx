import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, arrayUnion, getDoc, increment } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, BookOpen, User, Star, PlusCircle, LogIn, PlayCircle, ArrowRight, Layout } from 'lucide-react';
import './AllCourses.css';

const AllCourses = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('الكل');
  const [availableCourses, setAvailableCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. جلب الكورسات المجانية لحظياً
  useEffect(() => {
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

  // 2. منطق التصفية والبحث
  const filteredCourses = availableCourses.filter(course => 
    (filter === 'الكل' || course.grade === filter) && 
    (course.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     course.instructor?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // 3. دالة الاشتراك والربط مع StudentDash
  const handleEnroll = async (courseId, courseTitle) => {
    const user = auth.currentUser;

    if (!user) {
      alert("⚠️ سجل دخولك أولاً لتتمكن من إضافة الكورس لمكتبتك.");
      return navigate('/login');
    }

    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      // إضافة الكورس لقائمة المحتوى المشترك فيه (enrolledContent) ليظهر في StudentDash
      if (userSnap.exists()) {
        await updateDoc(userRef, {
          enrolledContent: arrayUnion(courseId), // الربط مع الطالب
          points: increment(5) // مكافأة بسيطة للاستكشاف
        });
      }
      
      // التوجه لصفحة المشاهدة
      navigate(`/video-player/${courseId}`); 
    } catch (error) {
      console.error("Error enrolling:", error);
      alert("حدث خطأ في الوصول للمحتوى.");
    }
  };

  if (loading) return (
    <div className="loader-vortex">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
         <PlayCircle size={50} color="#00f2ff" />
      </motion.div>
      <p>جاري استدعاء المكتبة المجانية...</p>
    </div>
  );

  return (
    <div className="all-courses-root rtl-support">
      
      {/* هيدر التنقل العلوي للطلاب المسجلين */}
      {auth.currentUser && (
        <motion.div initial={{ y: -50 }} animate={{ y: 0 }} className="top-nav-bar">
          <button onClick={() => navigate('/dashboard')} className="back-to-dash">
            <Layout size={18} /> العودة للوحة التحكم الشخصية
          </button>
        </motion.div>
      )}

      <section className="library-header">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <h1 className="cyber-title">مكتبة MAFA المفتوحة</h1>
          <p className="subtitle">تعلم بدون قيود.. محاضرات مجانية بجودة فائقة</p>
        </motion.div>
      </section>

      <div className="control-panel glass-card">
        <div className="search-box">
          <Search size={20} className="search-icon" />
          <input 
            type="text" 
            placeholder="ابحث عن درس أو مدرس..." 
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-group">
          {['الكل', '1', '2', '3'].map(grade => (
            <button 
              key={grade} 
              className={filter === grade ? 'active' : ''} 
              onClick={() => setFilter(grade)}
            >
              {grade === 'الكل' ? 'الكل' : `ثانية ${grade} ث`}
            </button>
          ))}
        </div>
      </div>

      <main className="courses-grid">
        <AnimatePresence>
          {filteredCourses.map(course => (
            <motion.div 
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={course.id} 
              className="modern-course-card glass-card"
            >
              <div className="card-tag">المستوى {course.grade}</div>
              
              <div className="card-visual" style={{ backgroundImage: `url(${course.thumbnail})` }}>
                {!course.thumbnail && <PlayCircle size={50} color="#00f2ff" />}
                <div className="play-hint"><PlayCircle size={40} /></div>
              </div>

              <div className="card-details">
                <h3>{course.title}</h3>
                <div className="instructor-info">
                  <User size={14} /> <span>{course.instructor || 'أ. محمود فرج'}</span>
                </div>
                
                <div className="card-footer">
                  <span className="free-label">دخول مجاني</span>
                  <button className="enroll-btn" onClick={() => handleEnroll(course.id, course.title)}>
                    {auth.currentUser ? 'شاهد الآن' : 'سجل للدخول'}
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </main>

      {filteredCourses.length === 0 && (
        <div className="empty-state-v2">
          <BookOpen size={60} />
          <h3>لا توجد نتائج مطابقة</h3>
          <p>جرب تغيير كلمات البحث أو اختيار صف دراسي آخر</p>
        </div>
      )}
    </div>
  );
};

export default AllCourses;
