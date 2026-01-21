 import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { db, auth } from '../firebase';
import { 
  collection, getDocs, query, orderBy, limit, 
  doc, onSnapshot, where, updateDoc, increment,
  addDoc, serverTimestamp, getDoc
} from 'firebase/firestore';
import { motion, AnimatePresence, useScroll, useSpring, useTransform } from 'framer-motion';
import { 
  GraduationCap, BookOpen, PlayCircle, Shield, 
  ChevronLeft, Star, Users, Layout, Search, Filter,
  Clock, Award, Flame, Zap, LayoutDashboard,
  Trophy, Bell, History, ArrowRightCircle, Sparkles,
  Wallet, BellDot, PlusCircle, CheckCircle2, AlertCircle,
  Menu, X, Share2, Heart, MessageSquare, Info,
  Settings, LogOut, CreditCard, BookText, School,
  Target, Rocket, Headphones, PenTool, Monitor
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import './HighSchool.css'; 





/**
 * @component MAFA_Universal_Portal_v2
 * @description نظام الإدارة التعليمي المتكامل - يدعم جميع المراحل التعليمية بتقنيات الهولوغرام
 */
const HighSchool = () => {
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  
  // --- 1. إدارة الحالات (State Management) ---
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
  
  // الحالة الجديدة للمراحل التعليمية
  const [educationStage, setEducationStage] = useState('ثانوي'); // ابتدائي | اعدادي | ثانوي
  const [currentGrade, setCurrentGrade] = useState('الكل');

  // --- 2. التحكم في المؤثرات البصرية (Advanced Framer Motion) ---
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const opacityHero = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  
  // --- 3. نظام الحماية (Security System) ---
  useEffect(() => {
    const handleContextMenu = (e) => e.preventDefault();
    const handleKeyDown = (e) => {
      if (e.ctrlKey && (e.key === 'u' || e.key === 's' || e.key === 'p')) e.preventDefault();
    };
    
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // --- 4. مزامنة بيانات المستخدم والاشعارات (Real-time Engine) ---
  useEffect(() => {
    let unsubscribeUser = () => {};
    let unsubscribeNotif = () => {};

    const syncData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      // مزامنة الملف الشخصي
      unsubscribeUser = onSnapshot(doc(db, "users", user.uid), (snap) => {
        if (snap.exists()) {
          setUserData({ id: snap.id, ...snap.data() });
        }
      });

      // مزامنة الاشعارات
      const nQuery = query(
        collection(db, "notifications"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(10)
      );
      unsubscribeNotif = onSnapshot(nQuery, (snap) => {
        setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    };

    syncData();
    return () => { unsubscribeUser(); unsubscribeNotif(); };
  }, []);

  // --- 5. جلب البيانات بناءً على المرحلة (Data Fetching) ---
  const fetchEducationData = useCallback(async () => {
    setLoading(true);
    try {
      // جلب الكورسات بناءً على التعليم (ثانوي/اعدادي/ابتدائي)
      const q = query(
        collection(db, "courses_metadata"),
        where("stage", "==", educationStage),
        orderBy("createdAt", "desc")
      );
      
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        rating: d.data().rating || (Math.random() * 2 + 3).toFixed(1),
        studentsCount: d.data().studentsCount || Math.floor(Math.random() * 500) + 50
      }));
      
      setCourses(data);
      setFilteredCourses(data);

      // جلب لوحة الصدارة للمرحلة الحالية
      const leaderQ = query(
        collection(db, "users"),
        where("stage", "==", educationStage),
        orderBy("points", "desc"),
        limit(5)
      );
      const leaderSnap = await getDocs(leaderQ);
      setTopStudents(leaderSnap.docs.map(d => d.data()));

    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setTimeout(() => setLoading(false), 1200);
    }
  }, [educationStage]);

  useEffect(() => {
    fetchEducationData();
  }, [fetchEducationData]);

  // --- 6. نظام الفلترة والبحث الذكي (Filtering System) ---
  useEffect(() => {
    let result = courses.filter(c => {
      const matchSearch = c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.instructor?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchGrade = activeTab === 'الكل' || c.grade === activeTab;
      return matchSearch && matchGrade;
    });

    if (sortBy === 'popular') result.sort((a, b) => b.studentsCount - a.studentsCount);
    if (sortBy === 'rating') result.sort((a, b) => b.rating - a.rating);

    setFilteredCourses(result);
  }, [searchTerm, activeTab, courses, sortBy]);

  // --- 7. دوال التفاعل (Interaction Handlers) ---
  const handleStageChange = (stage) => {
    setEducationStage(stage);
    setActiveTab('الكل');
  };

  const toggleLike = async (courseId, e) => {
    e.stopPropagation();
    // هنا يوضع منطق Firebase للـ Like
    console.log("Liked:", courseId);
  };

  // --- 8. مكونات UI الفرعية (Sub-components) ---
  const Sidebar = () => (
    <motion.aside 
      initial={{ x: 300 }} 
      animate={{ x: 0 }} 
      exit={{ x: 300 }}
      className="portal-sidebar glass-heavy"
    >
      <div className="sidebar-header">
        <Zap size={30} className="text-cyan-400" />
        <h3>MAFA System</h3>
        <X onClick={() => setIsSidebarOpen(false)} />
      </div>
      <nav className="sidebar-nav">
        <div className="nav-group">
          <span>الرئيسية</span>
          <button onClick={() => navigate('/dashboard')}><LayoutDashboard size={18}/> لوحة التحكم</button>
          <button onClick={() => navigate('/courses')} className="active"><BookOpen size={18}/> دوراتي التعليمية</button>
        </div>
        <div className="nav-group">
          <span>الأدوات</span>
          <button onClick={() => navigate('/exams')}><PenTool size={18}/> بنك الامتحانات</button>
          <button onClick={() => navigate('/library')}><Monitor size={18}/> المكتبة الرقمية</button>
          <button onClick={() => navigate('/ai-chat')}><Sparkles size={18}/> مساعد AI</button>
        </div>
        <div className="nav-group">
          <span>الحساب</span>
          <button onClick={() => navigate('/wallet')}><Wallet size={18}/> المحفظة</button>
          <button onClick={() => navigate('/settings')}><Settings size={18}/> الإعدادات</button>
        </div>
      </nav>
      <div className="sidebar-footer">
        <button className="logout-btn"><LogOut size={18}/> تسجيل الخروج</button>
      </div>
    </motion.aside>
  );

  // --- 9. شاشة التحميل المطورة ---
  if (loading) return (
    <div className="mafa-loader-v2">
      <div className="loader-content">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity }}
          className="main-icon"
        >
          <Zap size={50} />
        </motion.div>
        <div className="loading-bar">
          <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 1 }} className="fill" />
        </div>
        <p>جاري تحميل محتوى {educationStage}...</p>
      </div>
    </div>
  );

  return (
    <div className={`portal-container stage-${educationStage}`} ref={scrollRef}>
      <motion.div className="scroll-progress" style={{ scaleX }} />
      
      {/* طبقة الحماية - العلامة المائية */}
      <div className="security-overlay">
        <span>{userData?.email}</span>
        <span>{new Date().toLocaleDateString()}</span>
        <span>MAFA-PROTECT-V2</span>
      </div>

      <AnimatePresence>
        {isSidebarOpen && <Sidebar />}
      </AnimatePresence>

      {/* 🧭 الهيدر العلوي - Floating Navbar */}
      <header className="main-header glass-premium">
        <div className="header-left">
          <button className="menu-btn" onClick={() => setIsSidebarOpen(true)}>
            <Menu />
          </button>
          <div className="logo" onClick={() => navigate('/')}>
            <div className="logo-icon"><Rocket /></div>
            <div className="logo-text">MAFA<span>ACADEMY</span></div>
          </div>
        </div>

        <div className="stage-selector glass">
          {['ابتدائي', 'اعدادي', 'ثانوي'].map(s => (
            <button 
              key={s} 
              className={educationStage === s ? 'active' : ''}
              onClick={() => handleStageChange(s)}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="header-right">
          <div className="user-stats glass" onClick={() => navigate('/wallet')}>
            <div className="stat">
               <Wallet size={16} />
               <span>{userData?.balance || 0} ج.م</span>
            </div>
            <div className="stat">
               <Flame size={16} />
               <span>{userData?.streak || 0}</span>
            </div>
          </div>

          <div className="notification-bell" onClick={() => setShowNotificationPanel(!showNotificationPanel)}>
            <Bell />
            {notifications.filter(n => !n.read).length > 0 && <span className="badge" />}
          </div>

          <div className="profile-trigger" onClick={() => navigate('/profile')}>
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userData?.name}`} alt="user" />
            <div className="online-indicator" />
          </div>
        </div>
      </header>

      {/* 🚀 قسم الهيرو والترحيب */}
      <section className="hero-section">
        <motion.div style={{ opacity: opacityHero }} className="hero-bg-effects">
          <div className="blob blob-1" />
          <div className="blob blob-2" />
        </motion.div>

        <div className="hero-grid">
          <motion.div 
            initial={{ x: 100, opacity: 0 }} 
            animate={{ x: 0, opacity: 1 }}
            className="hero-welcome"
          >
            <div className="badge-pill"><Sparkles size={14}/> نظام التعلم الذكي v2.0</div>
            <h1>أهلاً بك يا <span className="name-gradient">{userData?.name?.split(' ')[0] || 'طالبنا'}</span></h1>
            <p>أنت الآن تتصفح مناهج المرحلة <strong>{educationStage}</strong>. لديك اليوم {filteredCourses.length} كورسات متاحة ومهمة واحدة متبقية.</p>
            
            <div className="hero-search-bar glass">
              <Search />
              <input 
                type="text" 
                placeholder="ابحث عن مادة، مدرس، أو درس معين..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="btn-primary">بحث سريع</button>
            </div>

            <div className="quick-info">
              <div className="info-item">
                <Target />
                <span>هدف اليوم: 4 ساعات مذاكرة</span>
              </div>
              <div className="info-item">
                <Award />
                <span>المستوى الحالي: {userData?.level || 'مبتدئ'}</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="hero-leaderboard glass"
          >
            <div className="l-head">
              <Trophy className="text-yellow-400" />
              <h3>أوائل المرحلة {educationStage}</h3>
            </div>
            <div className="l-body">
              {topStudents.map((s, i) => (
                <div key={i} className="l-row">
                  <span className="rank">#{i+1}</span>
                  <img src={`https://api.dicebear.com/initials/svg?seed=${s.name}`} alt="" />
                  <div className="details">
                    <p>{s.name}</p>
                    <span>{s.points} XP</span>
                  </div>
                  {i === 0 && <Sparkles size={16} className="crown" />}
                </div>
              ))}
            </div>
            <button className="view-all" onClick={() => navigate('/leaderboard')}>
              عرض القائمة الكاملة <ArrowRightCircle size={16} />
            </button>
          </motion.div>
        </div>
      </section>

      {/* 📚 قسم المحتوى التعليمي */}
      <main className="content-area">
        <div className="content-filters">
          <div className="tabs glass">
            {['الكل', 'الصف الأول', 'الصف الثاني', 'الصف الثالث', 'مراجعات نهائية'].map(tab => (
              <button 
                key={tab} 
                className={activeTab === tab ? 'active' : ''}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
                {activeTab === tab && <motion.div layoutId="tab-underline" className="underline" />}
              </button>
            ))}
          </div>

          <div className="sort-box glass">
            <Filter size={18} />
            <select onChange={(e) => setSortBy(e.target.value)}>
              <option value="latest">المضاف حديثاً</option>
              <option value="popular">الأكثر تفاعلاً</option>
              <option value="rating">الأعلى تقييماً</option>
            </select>
          </div>
        </div>

        <section className="courses-grid">
          <AnimatePresence mode="popLayout">
            {filteredCourses.length > 0 ? (
              filteredCourses.map((course, idx) => (
                <motion.div
                  key={course.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.05 }}
                  className="course-card-premium glass"
                  onClick={() => navigate(`/course/${course.id}`)}
                >
                  <div className="card-thumb">
                    <img src={course.thumbnail} alt={course.title} />
                    <div className="overlay-tags">
                      <span className="tag-grade">{course.grade}</span>
                      <span className="tag-type">{course.category || 'فيديو'}</span>
                    </div>
                    <div className="play-overlay">
                      <PlayCircle size={50} />
                    </div>
                  </div>

                  <div className="card-info">
                    <div className="inst-meta">
                      <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${course.instructor}`} alt="" />
                      <span>{course.instructor}</span>
                    </div>
                    <h3>{course.title}</h3>
                    
                    <div className="stats-row">
                      <div className="stat"><Users size={14}/> {course.studentsCount}</div>
                      <div className="stat"><Star size={14} className="star-icon"/> {course.rating}</div>
                      <div className="stat"><Clock size={14}/> {course.duration || '10س'}</div>
                    </div>

                    <div className="progress-section">
                      <div className="prog-text">
                        <span>نسبة الإكمال</span>
                        <span>{course.progress || 0}%</span>
                      </div>
                      <div className="prog-bar">
                        <motion.div 
                          initial={{ width: 0 }}
                          whileInView={{ width: `${course.progress || 0}%` }}
                          className="prog-fill" 
                        />
                      </div>
                    </div>

                    <div className="card-actions">
                      <button className="enroll-btn">إبدأ التعلم الآن</button>
                      <button className="like-btn" onClick={(e) => toggleLike(course.id, e)}>
                        <Heart size={18} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="no-data-state glass">
                <AlertCircle size={50} />
                <h2>لا توجد كورسات متاحة حالياً</h2>
                <p>جرب تغيير فلاتر البحث أو المرحلة التعليمية</p>
                <button onClick={() => {setSearchTerm(''); setActiveTab('الكل');}} className="btn-secondary">إعادة ضبط</button>
              </div>
            )}
          </AnimatePresence>
        </section>

        {/* 🛠️ قسم الأدوات المساعدة (Tools) */}
        <section className="mega-tools-grid">
           <div className="mega-tool glass-premium" onClick={() => navigate('/exam-center')}>
              <div className="tool-icon bg-red-500/20 text-red-400"><PenTool /></div>
              <div className="tool-desc">
                <h4>مركز الامتحانات</h4>
                <p>أكثر من 50,000 سؤال بنظام الوزارة الجديد مع تصحيح ذكي.</p>
                <span className="tool-link">ابدأ الاختبار <ChevronLeft size={16}/></span>
              </div>
           </div>
           
           <div className="mega-tool glass-premium" onClick={() => navigate('/library')}>
              <div className="tool-icon bg-purple-500/20 text-purple-400"><BookText /></div>
              <div className="tool-desc">
                <h4>المكتبة الشاملة</h4>
                <p>تحميل الكتب الخارجية، الملخصات، والمذكرات بصيغة PDF.</p>
                <span className="tool-link">تصفح الكتب <ChevronLeft size={16}/></span>
              </div>
           </div>

           <div className="mega-tool glass-premium" onClick={() => navigate('/support')}>
              <div className="tool-icon bg-cyan-500/20 text-cyan-400"><Headphones /></div>
              <div className="tool-desc">
                <h4>الدعم والمساعدة</h4>
                <p>فريق تقني وتعليمي متواجد 24 ساعة لحل مشكلاتك.</p>
                <span className="tool-link">تواصل معنا <ChevronLeft size={16}/></span>
              </div>
           </div>
        </section>
      </main>

      {/* 🦶 الفوتر العملاق */}
      <footer className="portal-footer glass-heavy">
        <div className="f-content">
          <div className="f-brand">
             <div className="logo">
               <Zap size={30} fill="#00f2ff" />
               <h2>MAFA ACADEMY</h2>
             </div>
             <p>نحن نصنع مستقبلك التعليمي بأحدث تقنيات الذكاء الاصطناعي والتعلم التفاعلي. منصة MAFA هي بيتك الثاني للتميز.</p>
             <div className="social-links">
                <button><Share2 size={20}/></button>
                <button><MessageSquare size={20}/></button>
                <button><Info size={20}/></button>
             </div>
          </div>

          <div className="f-links-grid">
             <div className="link-col">
                <h4>المراحل</h4>
                <a href="#">الثانوية العامة</a>
                <a href="#">الشهادة الإعدادية</a>
                <a href="#">المرحلة الابتدائية</a>
             </div>
             <div className="link-col">
                <h4>المنصة</h4>
                <a href="#">من نحن</a>
                <a href="#">الأسئلة الشائعة</a>
                <a href="#">سياسة الخصوصية</a>
             </div>
             <div className="link-col">
                <h4>الدعم</h4>
                <a href="#">تواصل معنا</a>
                <a href="#">شحن الرصيد</a>
                <a href="#">الدعم الفني</a>
             </div>
          </div>
        </div>
        
        <div className="f-bottom">
           <p>جميع الحقوق محفوظة &copy; 2026 | تم التطوير بواسطة <span className="dev-name">TITo-TEC</span></p>
           <div className="trust-badges">
              <Shield size={16} /> مؤمن بواسطة MAFA-SHIELD
           </div>
        </div>
      </footer>
    </div>
  );
};

export default HighSchool;