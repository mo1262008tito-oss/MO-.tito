import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, arrayUnion, increment, query, orderBy } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, BookOpen, User, PlayCircle, ArrowRight, Layout, 
  Lock, Zap, Clock, BookMarked, MonitorPlay, Library, ChevronLeft, Unlock 
} from 'lucide-react';
import './AllCourses.css';

const AllCourses = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentLevel, setCurrentLevel] = useState('ثانوي'); // ابتدائي، اعدادي، ثانوي
  const [activeGrade, setActiveGrade] = useState('الكل');
  const [viewMode, setViewMode] = useState('courses'); // courses أو library
  
  const [courses, setCourses] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userEnrolledIds, setUserEnrolledIds] = useState([]);

  // خيارات الصفوف الدراسية
  const gradeOptions = {
    'ابتدائي': ['1 ابتدائي', '2 ابتدائي', '3 ابتدائي', '4 ابتدائي', '5 ابتدائي', '6 ابتدائي'],
    'اعدادي': ['1 اعدادي', '2 اعدادي', '3 اعدادي'],
    'ثانوي': ['1 ثانوي', '2 ثانوي', '3 ثانوي']
  };

  useEffect(() => {
    setLoading(true);
    
    // جلب الكورسات
    const qCourses = query(collection(db, "courses_metadata"), orderBy("createdAt", "desc"));
    const unsubCourses = onSnapshot(qCourses, (snapshot) => {
      setCourses(snapshot.docs.map(d => ({ id: d.id, type: 'course', ...d.data() })));
    });

    // جلب المكتبة
    const qBooks = query(collection(db, "library_books"), orderBy("createdAt", "desc"));
    const unsubBooks = onSnapshot(qBooks, (snapshot) => {
      setBooks(snapshot.docs.map(d => ({ id: d.id, type: 'book', ...d.data() })));
    });

    // جلب بيانات المستخدم (الكورسات المشترك بها)
    if (auth.currentUser) {
      const unsubUser = onSnapshot(doc(db, "users", auth.currentUser.uid), (doc) => {
        if (doc.exists()) {
          setUserEnrolledIds(doc.data().enrolledContent || []);
        }
      });
      setLoading(false);
      return () => { unsubCourses(); unsubBooks(); unsubUser(); };
    }

    setLoading(false);
    return () => { unsubCourses(); unsubBooks(); };
  }, []);

  // منطق الفلترة الموحد
  const getFilteredItems = () => {
    const baseList = viewMode === 'courses' ? courses : books;
    return baseList.filter(item => {
      const matchLevel = item.level === currentLevel;
      const matchGrade = activeGrade === 'الكل' || item.grade === activeGrade;
      const matchSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchLevel && matchGrade && matchSearch;
    });
  };

  // منطق الدخول (المجاني يفتح - المدفوع يطلب تفعيل)
  const handleItemClick = async (item) => {
    if (!auth.currentUser) {
      alert("⚠️ يرجى تسجيل الدخول أولاً");
      return navigate('/login');
    }

    if (item.type === 'book') {
      window.open(item.pdfUrl, '_blank');
      return;
    }

    const isFree = !item.price || parseInt(item.price) === 0;
    const isEnrolled = userEnrolledIds.includes(item.id);

    if (isFree || isEnrolled) {
      // إذا كان مجانياً ولم يشترك بعد، نشترك تلقائياً
      if (isFree && !isEnrolled) {
        try {
          await updateDoc(doc(db, "users", auth.currentUser.uid), {
            enrolledContent: arrayUnion(item.id),
            points: increment(5)
          });
        } catch (e) { console.error(e); }
      }
      navigate(`/video-player/${item.id}`);
    } else {
      // إذا كان مدفوعاً وغير مشترك
      navigate(`/activate/${item.id}`);
    }
  };

  if (loading) return (
    <div className="hs-loader-overlay">
      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity }}>
         <Zap size={60} color="#00f2ff" fill="#00f2ff" />
      </motion.div>
      <h2 className="loading-text">جاري تحضير المحتوى...</h2>
    </div>
  );

  return (
    <div className="hs-viewport rtl">
      <div className="hero-grid-bg"></div>

      <header className="lib-header">
        <div className="header-content">
          <button onClick={() => navigate('/dashboard')} className="glass-nav-btn">
            <Layout size={18} /> لوحة التحكم
          </button>
          <h1 className="text-gradient">أكاديمية MAFA-TEC</h1>
        </div>
      </header>

      <div className="lib-controls-container">
        {/* اختيار المرحلة الرئيسية */}
        <div className="level-tabs">
          {['ابتدائي', 'اعدادي', 'ثانوي'].map(level => (
            <button 
              key={level}
              className={currentLevel === level ? 'active' : ''}
              onClick={() => { setCurrentLevel(level); setActiveGrade('الكل'); }}
            >
              {level}
            </button>
          ))}
        </div>

        {/* اختيار نوع المحتوى */}
        <div className="view-mode-toggle">
          <button className={viewMode === 'courses' ? 'active' : ''} onClick={() => setViewMode('courses')}>
            <MonitorPlay size={18}/> الكورسات
          </button>
          <button className={viewMode === 'library' ? 'active' : ''} onClick={() => setViewMode('library')}>
            <Library size={18}/> المكتبة
          </button>
        </div>

        <div className="search-bar-premium">
          <Search size={20} className="s-icon" />
          <input 
            placeholder={`ابحث في ${viewMode === 'courses' ? 'الكورسات' : 'المكتبة'}...`}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* فلترة الصفوف الدراسية ديناميكياً */}
        <nav className="hs-navigation-bar">
          <button className={`nav-item ${activeGrade === 'الكل' ? 'active' : ''}`} onClick={() => setActiveGrade('الكل')}>
            {activeGrade === 'الكل' && <motion.div layoutId="nav-bg" className="nav-bg" />}
            <span className="nav-text">الكل</span>
          </button>
          {gradeOptions[currentLevel].map(grade => (
            <button 
              key={grade} 
              className={`nav-item ${activeGrade === grade ? 'active' : ''}`} 
              onClick={() => setActiveGrade(grade)}
            >
              {activeGrade === grade && <motion.div layoutId="nav-bg" className="nav-bg" />}
              <span className="nav-text">{grade}</span>
            </button>
          ))}
        </nav>
      </div>

      <main className="hs-container">
        <div className="premium-grid">
          <AnimatePresence mode='popLayout'>
            {getFilteredItems().map((item) => {
              const isEnrolled = userEnrolledIds.includes(item.id);
              const isLocked = item.type === 'course' && parseInt(item.price) > 0 && !isEnrolled;

              return (
                <motion.div 
                  layout
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  whileHover={{ y: -8 }}
                  key={item.id} 
                  className="course-card-v3"
                  onClick={() => handleItemClick(item)}
                >
                  <div className="card-top">
                    <img src={item.thumbnail || 'https://via.placeholder.com/400x220'} alt="" />
                    <div className="card-badge">
                      {item.grade} {isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                    </div>
                    <div className="play-btn-circle">
                      {isLocked ? <Lock size={30} color="#fff" /> : item.type === 'book' ? <BookOpen size={30} color="#fff" /> : <PlayCircle size={45} fill="#00f2ff" color="#000" />}
                    </div>
                  </div>

                  <div className="card-body">
                    <h3 className="course-title">{item.title}</h3>
                    
                    <div className="instructor-meta">
                      <div className="mini-avatar">{item.instructor ? item.instructor[0] : 'M'}</div>
                      <span>{item.instructor || 'أ. محمود فرج'}</span>
                    </div>

                    <div className="card-footer">
                      <div className="price-tag">
                        {parseInt(item.price) > 0 ? (
                          <span className="price-val">{item.price} <small>EGP</small></span>
                        ) : (
                          <span className="free-badge">مجاني</span>
                        )}
                      </div>
                      <button className={`action-btn ${isEnrolled ? 'btn-enrolled' : ''}`}>
                        {item.type === 'book' ? 'تحميل' : isEnrolled ? 'مشاهدة' : isLocked ? 'تفعيل' : 'ابدأ'} 
                        <ChevronLeft size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {getFilteredItems().length === 0 && (
          <div className="empty-state">
            <BookMarked size={80} opacity={0.1} />
            <h3>لا يوجد محتوى متاح حالياً</h3>
            <p>اختر مرحلة دراسية أخرى أو تأكد من كلمات البحث</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default AllCourses;
