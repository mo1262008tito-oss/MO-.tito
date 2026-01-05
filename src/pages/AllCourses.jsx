import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, BookOpen, User, Star, PlusCircle, LogIn } from 'lucide-react';
import './AllCourses.css';

const AllCourses = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('الكل');
  const [availableCourses, setAvailableCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. جلب الكورسات من Firestore
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

  // 2. تصفية البحث
  const filteredCourses = availableCourses.filter(course => 
    (filter === 'الكل' || course.category === filter) &&
    (course.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     course.instructor?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // 3. دالة الاشتراك (التحقق من الهوية)
  const handleEnroll = async (courseId, courseName) => {
    const user = auth.currentUser;

    // إذا لم يسجل دخول، نرسله لصفحة الدخول
    if (!user) {
      alert("⚠️ يجب تسجيل الدخول أولاً لتتمكن من إضافة الكورس لمكتبتك.");
      return navigate('/login');
    }

    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      // التحقق إذا كان الكورس مضافاً مسبقاً
      if (userSnap.exists() && userSnap.data().enrolledCourses?.includes(courseId)) {
        alert("هذا الكورس موجود بالفعل في مكتبتك!");
        return navigate('/student-dash');
      }

      await updateDoc(userRef, {
        enrolledCourses: arrayUnion(courseId)
      });
      
      alert(`🚀 تهانينا! تم إضافة "${courseName}" إلى لوحة التحكم الخاصة بك.`);
      navigate('/student-dash');
    } catch (error) {
      console.error("Enrollment error:", error);
      alert("حدث خطأ، تأكد من صلاحيات حسابك.");
    }
  };

  if (loading) return (
    <div className="loader-container">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="loader-icon">⚙️</motion.div>
      <p>جاري استدعاء البيانات المعرفية...</p>
    </div>
  );

  return (
    <div className="all-courses-root rtl-support">
      {/* هيدر الصفحة */}
      <section className="library-header">
        <motion.h1 initial={{ y: -20 }} animate={{ y: 0 }} className="glitch">
          🚀 مستودع MaFa Tec المعرفي
        </motion.h1>
        <p>تصفح بحرية، تعلم بذكاء، وابنِ مستقبلك</p>
      </section>

      {/* شريط البحث والتحكم */}
      <div className="control-panel glass-card">
        <div className="search-box">
          <Search size={20} />
          <input 
            type="text" 
            placeholder="ابحث عن مادة، مدرس، أو تخصص..." 
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-group">
          <Filter size={18} />
          {['الكل', 'علمي', 'أدبي', 'لغات'].map(cat => (
            <button 
              key={cat} 
              className={filter === cat ? 'active' : ''} 
              onClick={() => setFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* شبكة الكورسات */}
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
              <div className="card-tag">{course.category || 'عام'}</div>
              
              <div className="card-visual">
                <span className="emoji-icon">
                  {course.category === 'علمي' ? '🧪' : course.category === 'لغات' ? '🌍' : '📚'}
                </span>
              </div>

              <div className="card-details">
                <h3>{course.name}</h3>
                <div className="info-row">
                  <User size={14} /> <span>{course.instructor}</span>
                </div>
                <div className="info-row rating">
                  <Star size={14} fill="#f1c40f" /> <span>4.9 (مراجعة الطلاب)</span>
                </div>

                <div className="card-footer">
                  <div className="price-tag">{course.price} ج.م</div>
                  <button className="action-btn" onClick={() => handleEnroll(course.id, course.name)}>
                    {auth.currentUser ? <PlusCircle size={18} /> : <LogIn size={18} />}
                    {auth.currentUser ? 'إضافة للمكتبة' : 'سجل للدخول'}
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
          <p>لا توجد بيانات تطابق بحثك حالياً في هذا القطاع.</p>
        </div>
      )}
    </div>
  );
};

export default AllCourses;
