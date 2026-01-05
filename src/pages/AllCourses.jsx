import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, arrayUnion, getDoc, increment, query, orderBy } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, BookOpen, User, Star, PlusCircle, LogIn, PlayCircle, ArrowRight, Layout, Lock } from 'lucide-react';
import './AllCourses.css';

const AllCourses = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('الكل');
  const [availableCourses, setAvailableCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userEnrolledIds, setUserEnrolledIds] = useState([]);

  // 1. جلب الكورسات وبيانات الطالب اللحظية
  useEffect(() => {
    // جلب الكورسات من المجموعة الجديدة metadata
    const q = query(collection(db, "courses_metadata"), orderBy("createdAt", "desc"));
    const unsubCourses = onSnapshot(q, (snapshot) => {
      const coursesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAvailableCourses(coursesData);
      setLoading(false);
    });

    // جلب الكورسات التي يمتلكها الطالب فعلياً لمنع تكرار الاشتراك
    if (auth.currentUser) {
      const unsubUser = onSnapshot(doc(db, "users", auth.currentUser.uid), (doc) => {
        if (doc.exists()) {
          setUserEnrolledIds(doc.data().enrolledContent || []);
        }
      });
      return () => { unsubCourses(); unsubUser(); };
    }

    return () => unsubCourses();
  }, []);

  // 2. منطق التصفية والبحث
  const filteredCourses = availableCourses.filter(course => 
    (filter === 'الكل' || course.grade === filter) && 
    (course.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     course.instructor?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // 3. دالة الاشتراك والتحقق من نوع الكورس
  const handleEnroll = async (course) => {
    const user = auth.currentUser;

    if (!user) {
      alert("⚠️ سجل دخولك أولاً لتتمكن من الوصول للمحتوى.");
      return navigate('/login');
    }

    // إذا كان الطالب مشتركاً بالفعل، يذهب للمشاهدة مباشرة
    if (userEnrolledIds.includes(course.id)) {
      return navigate(`/video-player/${course.id}`);
    }

    // إذا كان الكورس "مدفوع" (أي بسعر أكبر من 0) ولم يشترك الطالب بعد
    if (course.price > 0) {
      alert(`هذا الكورس مدفوع (السعر: ${course.price} ج.م). يرجى استخدام كود التفعيل أو طلب الشراء من لوحة التحكم.`);
      return navigate('/dashboard'); // توجيهه للوحة التحكم لشراء الكورس
    }

    // الاشتراك في الكورسات المجانية تلقائياً
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        enrolledContent: arrayUnion(course.id),
        points: increment(10) // مكافأة أكبر للاشتراك في كورس
      });
      
      navigate(`/video-player/${course.id}`); 
    } catch (error) {
      console.error("Error enrolling:", error);
      alert("حدث خطأ في تفعيل الكورس.");
    }
  };

  if (loading) return (
    <div className="loader-vortex">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
         <PlayCircle size={50} color="#00f2ff" />
      </motion.div>
      <p>جاري تحميل منصة MAFA التعليمية...</p>
    </div>
  );

  return (
    <div className="all-courses-root rtl-support">
      
      {/* هيدر التنقل العلوي */}
      {auth.currentUser && (
        <motion.div initial={{ y: -50 }} animate={{ y: 0 }} className="top-nav-bar">
          <button onClick={() => navigate('/dashboard')} className="back-to-dash">
            <Layout size={18} /> العودة للوحة التحكم الشخصية
          </button>
        </motion.div>
      )}

      <section className="library-header">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <h1 className="cyber-title">مستودع محاضرات MAFA</h1>
          <p className="subtitle">ابدأ رحلة التفوق الآن مع أقوى نظام تعليمي تفاعلي</p>
        </motion.div>
      </section>

      <div className="control-panel glass-card">
        <div className="search-box">
          <Search size={20} className="search-icon" />
          <input 
            type="text" 
            placeholder="ابحث عن كورس، درس، أو مدرس..." 
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
              {grade === 'الكل' ? 'الكل' : `الصف ${grade} الثانوي`}
            </button>
          ))}
        </div>
      </div>

      <main className="courses-grid">
        <AnimatePresence>
          {filteredCourses.map(course => {
            const isEnrolled = userEnrolledIds.includes(course.id);
            const isLocked = course.price > 0 && !isEnrolled;

            return (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={course.id} 
                className={`modern-course-card glass-card ${isLocked ? 'locked-style' : ''}`}
              >
                <div className="card-tag">
                  {course.grade} ثانوي {isLocked && <Lock size={12} style={{marginRight: '5px'}}/>}
                </div>
                
                <div className="card-visual" style={{ backgroundImage: `url(${course.thumbnail})` }}>
                  {!course.thumbnail && <PlayCircle size={50} color={isLocked ? "#64748b" : "#00f2ff"} />}
                  {isLocked && <div className="lock-overlay"><Lock size={40} /></div>}
                  {!isLocked && <div className="play-hint"><PlayCircle size={40} /></div>}
                </div>

                <div className="card-details">
                  <h3>{course.title}</h3>
                  <div className="instructor-info">
                    <User size={14} /> <span>{course.instructor || 'أ. محمود فرج'}</span>
                    <span className="lesson-count">{course.lessons?.length || 0} محاضرة</span>
                  </div>
                  
                  <div className="card-footer">
                    <div className="price-tag">
                      {course.price > 0 ? (
                        <span className="paid-price">{course.price} ج.م</span>
                      ) : (
                        <span className="free-label">مجاني</span>
                      )}
                    </div>
                    
                    <button 
                      className={`enroll-btn ${isLocked ? 'btn-lock' : ''}`} 
                      onClick={() => handleEnroll(course)}
                    >
                      {isEnrolled ? 'استمرار المشاهدة' : isLocked ? 'شراء الكورس' : 'ابدأ الآن'}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </main>

      {filteredCourses.length === 0 && (
        <div className="empty-state-v2">
          <BookOpen size={60} />
          <h3>لا توجد كورسات متاحة حالياً</h3>
          <p>سيتم إضافة المزيد من المحتوى قريباً، تابع لوحة التحكم</p>
        </div>
      )}
    </div>
  );
};

export default AllCourses;
