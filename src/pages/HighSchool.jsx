import React, { useState, useEffect, useMemo, useRef } from 'react';
import { db, auth } from '../firebase';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  doc, 
  onSnapshot,
  where,
  updateDoc,
  increment
} from 'firebase/firestore';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { 
  GraduationCap, BookOpen, PlayCircle, Shield, 
  ChevronLeft, Star, Users, Layout, Search, Filter,
  Clock, Award, Flame, Zap, BarChart3, LayoutDashboard,
  Trophy, Bell, History, ArrowRightCircle, Sparkles,
  Wallet, BellDot, PlusCircle, CheckCircle2, AlertCircle,
  Menu, X, Share2, Heart, MessageSquare, Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import './HighSchool.css'; // تأكد من اسم الملف ومكانه

/**
 * @component HighSchool
 * @description البوابة التعليمية الشاملة - نظام هولوغرام متكامل
 */
const HighSchool = () => {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  
  // --- 1. حالات المستخدم والبيانات (State Management) ---
  const [userData, setUserData] = useState(null);
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [topStudents, setTopStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('الكل'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);

  // --- 2. التحكم في شريط التقدم العلوي (Scroll Progress) ---
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // --- 3. جلب بيانات المستخدم اللحظية (Real-time Sync) ---
  useEffect(() => {
    let unsubscribeUser = () => {};
    let unsubscribeNotifications = () => {};

    const setupRealtimeSync = () => {
      const user = auth.currentUser;
      if (user) {
        // مراقبة بيانات المستخدم (الرصيد، النقاط، الرتبة)
        unsubscribeUser = onSnapshot(doc(db, "users", user.uid), (snap) => {
          if (snap.exists()) {
            setUserData({ id: snap.id, ...snap.data() });
          }
        });

        // مراقبة الإشعارات غير المقروءة
        const notifQuery = query(
          collection(db, "notifications"), 
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc"),
          limit(5)
        );
        unsubscribeNotifications = onSnapshot(notifQuery, (snap) => {
          setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
      } else {
        // إذا لم يكن مسجلاً، يمكن توجيهه لصفحة الدخول
        // navigate('/login');
      }
    };

    setupRealtimeSync();
    return () => {
      unsubscribeUser();
      unsubscribeNotifications();
    };
  }, [navigate]);

  // --- 4. جلب المناهج والأوائل (Initial Fetch) ---
  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      try {
        // جلب الكورسات مع دعم الـ Metadata
        const q = query(collection(db, "courses_metadata"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const fetched = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // بيانات افتراضية لجمال التصميم إذا نقصت من الداتا بيز
          rating: doc.data().rating || (Math.random() * 2 + 3).toFixed(1),
          studentsCount: doc.data().studentsCount || Math.floor(Math.random() * 1000),
          progress: Math.floor(Math.random() * 100)
        }));
        
        setCourses(fetched);
        setFilteredCourses(fetched);

        // جلب الأوائل للوحة الصدارة
        const topQ = query(collection(db, "users"), orderBy("points", "desc"), limit(5));
        const topSnap = await getDocs(topQ);
        setTopStudents(topSnap.docs.map(d => d.data()));

      } catch (err) {
        console.error("Critical Error Loading HighSchool Data:", err);
      } finally {
        setTimeout(() => setLoading(false), 1500); // تأخير بسيط لجمال اللودر
      }
    };

    fetchContent();
  }, []);

  // --- 5. منطق البحث والفلترة الذكي (Filtering Engine) ---
  useEffect(() => {
    let result = courses.filter(course => {
      const matchesTab = activeTab === 'الكل' || course.grade === activeTab || course.category === activeTab;
      const matchesSearch = course.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            course.instructor?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesTab && matchesSearch;
    });

    // منطق الترتيب
    result.sort((a, b) => {
      if (sortBy === 'latest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'popular') return b.studentsCount - a.studentsCount;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0;
    });

    setFilteredCourses(result);
  }, [searchTerm, activeTab, courses, sortBy]);

  // --- 6. مكونات الأنيميشن (Motion Variants) ---
  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 }
    }
  };

  const cardAnim = {
    hidden: { y: 30, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
  };

  // --- 7. دوال المساعدة (Helper Functions) ---
  const handleLikeCourse = async (id) => {
    // منطق الإعجاب بكورس معين
    console.log("Liked Course:", id);
  };

  // --- 8. شاشة التحميل (Professional Loader) ---
  if (loading) return (
    <div className="mafa-loading-screen">
      <motion.div 
        animate={{ scale: [1, 1.2, 1], rotate: [0, 360] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="loader-logo"
      >
        <Zap size={60} color="#00f2ff" fill="#00f2ff" />
      </motion.div>
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        جاري تهيئة بيئة التعلم الذكية...
      </motion.h2>
      <div className="progress-bar-container">
        <motion.div 
          className="progress-bar-fill"
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 1.5 }}
        />
      </div>
    </div>
  );

  return (
    <div className="edu-portal-root rtl" ref={scrollRef}>
      {/* شريط التقدم العلوي */}
      <motion.div className="scroll-progress-bar" style={{ scaleX }} />

      {/* 🛡️ نظام الحماية المتقدم - علامة مائية متحركة */}
      <div className="security-layer">
        <div className="watermark-text">{auth.currentUser?.email} - {new Date().toLocaleTimeString()}</div>
        <div className="security-badge"><Shield size={12} /> SECURED BY MAFA-GUARD</div>
      </div>

      {/* 🧭 الهيدر العلوي (Floating Navbar) */}
      <header className="portal-header glass">
        <div className="header-left">
          <div className="menu-trigger" onClick={() => setIsSidebarOpen(true)}>
            <Menu size={24} />
          </div>
          <div className="brand" onClick={() => navigate('/')}>
            <Zap className="brand-icon" size={28} />
            <span className="brand-name">MAFA<span className="tech-v">v2.0</span></span>
          </div>
        </div>

        <div className="header-actions">
          {/* المحفظة الذكية */}
          <div className="action-item wallet-action" onClick={() => navigate('/Wallet')}>
            <div className="wallet-visual">
               <Wallet size={18} />
               <span className="balance-text">{userData?.balance || 0} ج.م</span>
            </div>
            <PlusCircle size={16} className="add-icon" />
          </div>

          {/* الإشعارات اللحظية */}
          <div className="action-item notif-action" onClick={() => setShowNotificationPanel(!showNotificationPanel)}>
            <Bell size={20} />
            {notifications.length > 0 && <span className="notif-badge">{notifications.length}</span>}
          </div>

          <div className="user-profile-mini" onClick={() => navigate('/profile')}>
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userData?.name}`} alt="user" />
          </div>
        </div>
      </header>

      {/* 🌑 لوحة الإشعارات الجانبية */}
      <AnimatePresence>
        {showNotificationPanel && (
          <motion.div 
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="notif-panel glass"
          >
            <div className="panel-header">
              <h3>التنبيهات</h3>
              <X size={20} onClick={() => setShowNotificationPanel(false)} />
            </div>
            <div className="notif-list">
              {notifications.length > 0 ? notifications.map(n => (
                <div key={n.id} className="notif-item unread">
                  <div className="notif-icon"><BellDot size={16} /></div>
                  <div className="notif-body">
                    <p>{n.message}</p>
                    <span>منذ {n.time || 'دقائق'}</span>
                  </div>
                </div>
              )) : <div className="no-notif">لا توجد تنبيهات جديدة</div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="portal-content">
        
        {/* 🚀 قسم الهيرو والترحيب (Hero Section) */}
        <section className="hero-banner-v4">
          <div className="hero-blur-bg"></div>
          <div className="hero-container">
            
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="hero-welcome-card glass-premium"
            >
              <div className="card-top-row">
                <div className="streak-pill">
                  <Flame size={18} />
                  <span>{userData?.streak || 0} يوم متواصل!</span>
                </div>
                <div className="rank-badge">
                  <Trophy size={16} />
                  <span>المركز #{userData?.rank || '??'}</span>
                </div>
              </div>

              <h1 className="main-title">أهلاً بك يا <span className="name-gradient">{userData?.name || 'طالبنا العزيز'}</span></h1>
              <p className="sub-title">لديك اليوم 3 دروس جديدة ومراجعة نهائية، ابدأ الآن!</p>

              <div className="search-box-v2">
                <Search className="search-icon" />
                <input 
                  type="text" 
                  placeholder="ماذا تريد أن تتعلم اليوم؟" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="search-btn">بحث</button>
              </div>

              <div className="stats-row">
                <div className="stat-unit">
                  <Zap className="stat-icon xp" />
                  <div className="stat-info">
                    <span className="val">{userData?.points || 0}</span>
                    <span className="lab">XP مجموع</span>
                  </div>
                </div>
                <div className="stat-unit">
                  <Clock className="stat-icon time" />
                  <div className="stat-info">
                    <span className="val">{userData?.hoursSpent || 0}</span>
                    <span className="lab">ساعة مذاكرة</span>
                  </div>
                </div>
                <div className="stat-unit">
                  <CheckCircle2 className="stat-icon done" />
                  <div className="stat-info">
                    <span className="val">{userData?.completedTasks || 0}</span>
                    <span className="lab">مهمة منجزة</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* لوحة الأوائل (Leaderboard Mini) */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="leaderboard-card glass"
            >
              <div className="l-header">
                <Trophy size={22} color="#facc15" />
                <h3>متصدرين MAFA</h3>
              </div>
              <div className="l-list">
                {topStudents.map((student, idx) => (
                  <div key={idx} className={`l-item rank-${idx + 1}`}>
                    <div className="l-rank">{idx + 1}</div>
                    <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${student.name}`} alt="avatar" />
                    <div className="l-meta">
                      <p>{student.name}</p>
                      <span>{student.points} XP</span>
                    </div>
                    {idx === 0 && <Sparkles className="l-crown" size={16} />}
                  </div>
                ))}
              </div>
              <button className="full-board-btn" onClick={() => navigate('/leaderboard')}>
                عرض القائمة الكاملة <ChevronLeft size={16} />
              </button>
            </motion.div>
          </div>
        </section>

        {/* 🧭 شريط التنقل بين المواد (Tabs) */}
        <div className="tabs-container">
          <div className="tabs-wrapper">
            {['الكل', 'الصف الأول', 'الصف الثاني', 'الصف الثالث', 'مراجعات'].map(tab => (
              <button 
                key={tab} 
                className={`tab-item ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
                {activeTab === tab && <motion.div layoutId="tab-bg" className="tab-indicator" />}
              </button>
            ))}
          </div>
          <div className="filter-tools">
            <select className="glass-select" onChange={(e) => setSortBy(e.target.value)}>
              <option value="latest">الأحدث أولاً</option>
              <option value="popular">الأكثر طلباً</option>
              <option value="rating">الأعلى تقييماً</option>
            </select>
          </div>
        </div>

        {/* 📚 شبكة الكورسات الاحترافية (Courses Grid) */}
        <section className="courses-section">
          <div className="section-title-box">
            <BookOpen size={24} />
            <h2>المناهج الدراسية المتاحة</h2>
          </div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="courses-grid"
          >
            <AnimatePresence>
              {filteredCourses.map((course, index) => (
                <motion.div 
                  key={course.id}
                  variants={cardAnim}
                  whileHover={{ y: -10 }}
                  className="course-card-v4 glass-card"
                  onClick={() => navigate(`/course/${course.id}`)}
                >
                  <div className="card-thumb">
                    <img src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500'} alt={course.title} />
                    <div className="badge-overlay">{course.grade}</div>
                    <div className="play-btn-overlay"><PlayCircle size={45} /></div>
                  </div>

                  <div className="card-content">
                    <div className="c-instructor">
                      <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${course.instructor}`} alt="inst" />
                      <span>{course.instructor || "أ. ج"}</span>
                    </div>
                    <h3 className="c-title">{course.title}</h3>
                    
                    <div className="c-meta-row">
                      <div className="c-meta"><Users size={14}/> {course.studentsCount}</div>
                      <div className="c-meta"><Star size={14} color="#facc15" fill="#facc15"/> {course.rating}</div>
                      <div className="c-meta"><Clock size={14}/> {course.duration || '12س'}</div>
                    </div>

                    {/* شريط التقدم الشخصي */}
                    <div className="c-progress-box">
                      <div className="prog-labels">
                        <span>إنجازك</span>
                        <span>{course.progress}%</span>
                      </div>
                      <div className="prog-bar-bg">
                        <motion.div 
                          className="prog-bar-fill" 
                          initial={{ width: 0 }}
                          whileInView={{ width: `${course.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="card-footer-btns">
                      <button className="enroll-btn-v2">
                        ابدأ المذاكرة الآن
                        <ChevronLeft size={18} />
                      </button>
                      <div className="f-action-icon" onClick={(e) => {e.stopPropagation(); handleLikeCourse(course.id);}}>
                        <Heart size={18} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {filteredCourses.length === 0 && (
            <div className="no-results glass">
              <AlertCircle size={40} />
              <h3>عذراً، لم نجد ما تبحث عنه!</h3>
              <p>جرب كلمات بحث مختلفة أو تصفح الأقسام الأخرى.</p>
              <button onClick={() => setSearchTerm('')} className="reset-search">عرض كل الكورسات</button>
            </div>
          )}
        </section>

        {/* 🏆 قسم الأدوات والمميزات الإضافية */}
        <section className="tools-grid">
           <div className="tool-card glass" onClick={() => navigate('/library')}>
              <div className="t-icon purple"><BookOpen /></div>
              <div className="t-text">
                 <h4>المكتبة الرقمية</h4>
                 <p>ملخصات، كتب، وخرائط ذهنية</p>
              </div>
           </div>
           <div className="tool-card glass" onClick={() => navigate('/QuizSystem')}>
              <div className="t-icon gold"><Award /></div>
              <div className="t-text">
                 <h4>بنك الأسئلة</h4>
                 <p>اختبر مستواك مع تصحيح تلقائي</p>
              </div>
           </div>
           <div className="tool-card glass" onClick={() => navigate('/support')}>
              <div className="t-icon cyan"><MessageSquare /></div>
              <div className="t-text">
                 <h4>الدعم الفني</h4>
                 <p>تواصل مع فريق العمل مباشرة</p>
              </div>
           </div>
        </section>

      </main>

      {/* 🦶 الفوتر الحديث */}
      <footer className="portal-footer-v2 glass">
        <div className="f-top">
          <div className="f-col">
            <div className="brand">
              <Zap size={24} />
              <span>MAFA ACADEMY</span>
            </div>
            <p>منصتك التعليمية الأولى للتميز الدراسي والتقني.</p>
          </div>
          <div className="f-links">
            <a href="#">الشروط والأحكام</a>
            <a href="#">سياسة الخصوصية</a>
            <a href="#">اتصل بنا</a>
          </div>
        </div>
        <div className="f-bottom">
          <p>جميع الحقوق محفوظة &copy; 2026 تم التطوير بواسطة <span className="Mahmoud">TITo-TEC</span></p>
          <div className="f-socials">
             <Share2 size={18} />
             <Shield size={18} />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HighSchool;