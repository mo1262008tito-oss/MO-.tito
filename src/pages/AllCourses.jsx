import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { 
  collection, onSnapshot, doc, updateDoc, arrayUnion, 
  increment, query, orderBy, getDoc 
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import {  
  Search, BookOpen, User, PlayCircle, ArrowRight, Layout,  
  Lock, Zap, Clock, BookMarked, MonitorPlay, Library, ChevronLeft, Unlock, Wallet 
} from 'lucide-react';
import './AllCourses.css';

const AllCourses = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentLevel, setCurrentLevel] = useState('ثانوي'); 
  const [activeGrade, setActiveGrade] = useState('الكل');
  const [viewMode, setViewMode] = useState('courses'); 
  
  const [courses, setCourses] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userEnrolledIds, setUserEnrolledIds] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0); // رصيد المحفظة

  const gradeOptions = {
    'ابتدائي': ['1 ابتدائي', '2 ابتدائي', '3 ابتدائي', '4 ابتدائي', '5 ابتدائي', '6 ابتدائي'],
    'اعدادي': ['1 اعدادي', '2 اعدادي', '3 اعدادي'],
    'ثانوي': ['1 ثانوي', '2 ثانوي', '3 ثانوي']
  };

  useEffect(() => {
    setLoading(true);
    
    // 1. جلب الكورسات
    const qCourses = query(collection(db, "courses_metadata"), orderBy("createdAt", "desc"));
    const unsubCourses = onSnapshot(qCourses, (snapshot) => {
      setCourses(snapshot.docs.map(d => ({ id: d.id, type: 'course', ...d.data() })));
    });

    // 2. جلب المكتبة
    const qBooks = query(collection(db, "library_books"), orderBy("createdAt", "desc"));
    const unsubBooks = onSnapshot(qBooks, (snapshot) => {
      setBooks(snapshot.docs.map(d => ({ id: d.id, type: 'book', ...d.data() })));
    });

    // 3. جلب بيانات المستخدم (المحفظة والاشتراكات)
    if (auth.currentUser) {
      const unsubUser = onSnapshot(doc(db, "users", auth.currentUser.uid), (snapshot) => {
        if (snapshot.exists()) {
          const userData = snapshot.data();
          setUserEnrolledIds(userData.enrolledContent || []);
          setWalletBalance(userData.walletBalance || 0);
        }
      });
      setLoading(false);
      return () => { unsubCourses(); unsubBooks(); unsubUser(); };
    }

    setLoading(false);
    return () => { unsubCourses(); unsubBooks(); };
  }, []);

  // دالة الشراء السريع من المحفظة
  const handleQuickPurchase = async (item) => {
    const price = parseInt(item.price);
    
    if (walletBalance < price) {
      alert(`❌ عذراً، رصيدك (${walletBalance} ج.م) غير كافٍ. يرجى شحن المحفظة أولاً.`);
      return;
    }

    const confirmPurchase = window.confirm(`هل تريد شراء "${item.title}" مقابل ${price} ج.م من رصيدك؟`);
    
    if (confirmPurchase) {
      try {
        const userRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userRef, {
          walletBalance: increment(-price),
          enrolledContent: arrayUnion(item.id),
          transactions: arrayUnion({
            type: 'course_purchase',
            amount: price,
            itemTitle: item.title,
            date: new Date().toISOString()
          })
        });
        alert("🎉 مبروك! تم فتح الكورس بنجاح.");
      } catch (error) {
        alert("حدث خطأ أثناء إتمام العملية. حاول مرة أخرى.");
      }
    }
  };

  const handleItemClick = async (item) => {
    if (!auth.currentUser) {
      alert("⚠️ يرجى تسجيل الدخول أولاً");
      return navigate('/login');
    }

    if (item.type === 'book') {
      window.open(item.pdfUrl, '_blank');
      return;
    }

    const isEnrolled = userEnrolledIds.includes(item.id);
    const isFree = !item.price || parseInt(item.price) === 0;

    if (isEnrolled || isFree) {
      // اشتراك تلقائي للمجاني
      if (isFree && !isEnrolled) {
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
          enrolledContent: arrayUnion(item.id)
        });
      }
      // التوجيه لصفحة الفيديو مع تمرير بيانات المرحلة
      navigate(`/video-player/${item.id}`, { state: { level: currentLevel, grade: item.grade } });
    } else {
      // إذا كان مدفوعاً وغير مشترك: خيارين (محفظة أو كود تفعيل)
      if (walletBalance >= parseInt(item.price)) {
        handleQuickPurchase(item);
      } else {
        navigate(`/activate/${item.id}`);
      }
    }
  };

  const getFilteredItems = () => {
    const baseList = viewMode === 'courses' ? courses : books;
    return baseList.filter(item => {
      const matchLevel = item.level === currentLevel;
      const matchGrade = activeGrade === 'الكل' || item.grade === activeGrade;
      const matchSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchLevel && matchGrade && matchSearch;
    });
  };

  if (loading) return <div className="hs-loader-overlay"><Zap className="spin" size={50} color="#00f2ff" /></div>;

  return (
    <div className="hs-viewport rtl">
      <div className="hero-grid-bg"></div>

      <header className="lib-header">
        <div className="header-content">
          <div className="wallet-status glass-effect">
            <Wallet size={18} color="#ffd700" />
            <span>رصيدي: {walletBalance} ج.م</span>
          </div>
          <h1 className="text-gradient">أكاديمية الفيزياء الحديثة</h1>
          <button onClick={() => navigate('/dashboard')} className="glass-nav-btn">
            لوحة التحكم <Layout size={18} />
          </button>
        </div>
      </header>

      <div className="lib-controls-container">
        {/* المرحلة الدراسية */}
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

        {/* نوع المحتوى */}
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
            placeholder={`ابحث في ${viewMode === 'courses' ? 'الكורسات' : 'المكتبة'}...`}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <nav className="hs-navigation-bar">
          <button className={`nav-item ${activeGrade === 'الكل' ? 'active' : ''}`} onClick={() => setActiveGrade('الكل')}>
            <span className="nav-text">الكل</span>
          </button>
          {gradeOptions[currentLevel].map(grade => (
            <button 
              key={grade} 
              className={`nav-item ${activeGrade === grade ? 'active' : ''}`} 
              onClick={() => setActiveGrade(grade)}
            >
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
              const canAfford = walletBalance >= parseInt(item.price);

              return (
                <motion.div 
                  layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -10 }} key={item.id} className={`course-card-v3 ${isEnrolled ? 'enrolled' : ''}`}
                  onClick={() => handleItemClick(item)}
                >
                  <div className="card-top">
                    <img src={item.thumbnail || 'https://via.placeholder.com/400x220'} alt="" />
                    <div className="card-badge">
                      {isLocked ? <Lock size={12} /> : <Unlock size={12} />} {item.grade}
                    </div>
                    <div className="play-btn-circle">
                      {isLocked ? (canAfford ? <Wallet size={30} color="#00f2ff" /> : <Lock size={30} />) : <PlayCircle size={45} fill="#00f2ff" color="#000" />}
                    </div>
                  </div>

                  <div className="card-body">
                    <h3 className="course-title">{item.title}</h3>
                    <div className="instructor-meta">
                      <div className="mini-avatar">M</div>
                      <span>أ. محمود فرج</span>
                    </div>

                    <div className="card-footer">
                      <div className="price-tag">
                        {parseInt(item.price) > 0 ? (
                          <span className="price-val">{item.price} <small>EGP</small></span>
                        ) : <span className="free-badge">مجاني</span>}
                      </div>
                      <button className={`action-btn ${isEnrolled ? 'btn-enrolled' : ''}`}>
                        {isEnrolled ? 'استكمال' : isLocked ? (canAfford ? 'شراء' : 'تفعيل') : 'ابدأ'} 
                        <ChevronLeft size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default AllCourses;

