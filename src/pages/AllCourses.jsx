import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, arrayUnion, increment, query, orderBy } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen, User, PlayCircle, ArrowRight, Layout, Lock, Zap, Clock } from 'lucide-react';
import './AllCourses.css';

const AllCourses = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('الكل');
  const [availableCourses, setAvailableCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userEnrolledIds, setUserEnrolledIds] = useState([]);


  
  useEffect(() => {
    const q = query(collection(db, "courses_metadata"), orderBy("createdAt", "desc"));
    const unsubCourses = onSnapshot(q, (snapshot) => {
      const coursesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAvailableCourses(coursesData);
      setLoading(false);
    });

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

  const filteredCourses = availableCourses.filter(course => 
    (filter === 'الكل' || course.grade === filter) && 
    (course.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     course.instructor?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleEnroll = async (course) => {
    const user = auth.currentUser;
    if (!user) {
      alert("⚠️ سجل دخولك أولاً لتتمكن من الوصول للمحتوى.");
      return navigate('/login');
    }

    if (userEnrolledIds.includes(course.id)) {
      return navigate(`/video-player/${course.id}`);
    }

    if (course.price > 0) {
      alert(`هذا الكورس مدفوع (السعر: ${course.price} ج.م). يرجى تفعيله من لوحة التحكم.`);
      return navigate('/dashboard');
    }

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        enrolledContent: arrayUnion(course.id),
        points: increment(10)
      });
      navigate(`/video-player/${course.id}`); 
    } catch (error) {
      console.error("Error enrolling:", error);
    }
  };

  if (loading) return (
    <div className="hs-loader-overlay">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
         <Zap size={60} color="#00f2ff" fill="#00f2ff" />
      </motion.div>
      <h2 className="loading-text">جاري فتح مكتبة المستقبل...</h2>
    </div>
  );

  return (
    <div className="hs-viewport">
      {/* خلفية نيون خفيفة مدمجة */}
      <div className="hero-grid-bg"></div>

      {/* شريط التنقل العلوي المدمج */}
      <header className="lib-header">
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="header-content">
          <button onClick={() => navigate('/dashboard')} className="glass-nav-btn">
            <Layout size={18} /> لوحة التحكم
          </button>
          <h1 className="text-gradient">مكتبة المحاضرات</h1>
        </motion.div>
      </header>

      {/* منطقة البحث والفلترة */}
      <div className="lib-controls-container">
        <div className="search-bar-premium">
          <Search size={20} className="s-icon" />
          <input 
            type="text" 
            placeholder="عن ماذا تبحث اليوم؟ (فيزياء، الباب الأول...)" 
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <nav className="hs-navigation-bar">
          {['الكل', '1', '2', '3'].map(grade => (
            <button 
              key={grade} 
              className={`nav-item ${filter === grade ? 'active' : ''}`} 
              onClick={() => setFilter(grade)}
            >
              {filter === grade && <motion.div layoutId="nav-bg" className="nav-bg" />}
              <span className="nav-text">{grade === 'الكل' ? 'جميع الصفوف' : `الصف ${grade} ثانوي`}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* شبكة الكورسات بتصميم مبهر */}
      <main className="hs-container">
        <div className="premium-grid">
          <AnimatePresence>
            {filteredCourses.map((course, index) => {
              const isEnrolled = userEnrolledIds.includes(course.id);
              const isLocked = course.price > 0 && !isEnrolled;

              return (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -10 }}
                  key={course.id} 
                  className={`course-card-v3 ${isLocked ? 'card-locked' : ''}`}
                  onClick={() => handleEnroll(course)}
                >
                  <div className="card-top">
                    <img src={course.thumbnail || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=400'} alt="" />
                    <div className="card-badge">
                      {course.grade} ثانوي {isLocked && <Lock size={12} />}
                    </div>
                    <div className="play-btn-circle">
                      {isLocked ? <Lock size={40} color="#fff" /> : <PlayCircle size={45} fill="#00f2ff" color="#000" />}
                    </div>
                  </div>

                  <div className="card-body">
                    <h3 className="course-title">{course.title}</h3>
                    
                    <div className="instructor-meta">
                      <div className="mini-avatar">{course.instructor ? course.instructor[0] : 'M'}</div>
                      <span>{course.instructor || 'أ. محمود فرج'}</span>
                    </div>

                    <div className="course-stats-row">
                      <div className="stat-item"><Clock size={14}/> 120 دقيقة</div>
                      <div className="stat-item"><Zap size={14}/> {course.lessons?.length || 0} درس</div>
                    </div>

                    <div className="card-footer">
                      <div className="price-info">
                        {course.price > 0 ? (
                          <span className="price-val">{course.price} <small>ج.م</small></span>
                        ) : (
                          <span className="free-badge">مجاني</span>
                        )}
                      </div>
                      <button className={`action-btn ${isEnrolled ? 'btn-enrolled' : ''}`}>
                        {isEnrolled ? 'مشاهدة' : isLocked ? 'شراء' : 'ابدأ'} <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filteredCourses.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="empty-state">
            <BookOpen size={80} opacity={0.2} />
            <h3>لم نجد أي محاضرات بهذا الاسم</h3>
            <p>جرب تغيير كلمات البحث أو اختر صفاً دراسياً آخر</p>
          </motion.div>
        )}
      </main>

      <footer className="modern-footer">
          <div className="footer-blur"></div>
          <p>أكاديمية MAFA التعليمية &copy; 2026 - تجربة تعلم ذكية</p>
      </footer>
    </div>
  );
};

export default AllCourses;

