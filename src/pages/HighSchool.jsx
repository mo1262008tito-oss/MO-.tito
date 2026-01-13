import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { 
  collection, getDocs, query, orderBy, limit, doc, onSnapshot 
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap, BookOpen, PlayCircle, Shield, 
  ChevronLeft, Star, Users, Layout, Search, Filter,
  Clock, Award, Flame, Zap, BarChart3, LayoutDashboard,
  Trophy, Bell, History, ArrowRightCircle, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import './HighSchool.css';
// ... أضف أيقونة المحفظة في الاستيرادات
import { Wallet, BellDot, PlusCircle } from 'lucide-react';

// داخل قسم الـ hero-main-card
<div className="hero-main-card glass">
  <div className="top-action-bar">
    <div className="hero-badge">
      <Flame size={16} className="flame-icon" />
      <span>أنت في المركز #{userData?.rank || '??'} هذا الأسبوع</span>
    </div>
    
    {/* مركز التنبيهات الجديد */}
    <div className="notification-bell" onClick={() => navigate('/notifications')}>
      <BellDot size={22} color={userData?.hasUnread ? "#ff4d4d" : "#fff"} />
      {userData?.hasUnread && <span className="red-dot"></span>}
    </div>
  </div>

  <h1>أكاديمية <span className="text-gradient">MAFA</span> الذكية</h1>
  
  <div className="search-bar-premium">
    {/* ... كود البحث كما هو */}
  </div>

  <div className="quick-stats-v2">
     <div className="q-stat xp"><Zap size={16}/> {userData?.points || 0} XP</div>
     <div className="q-stat streak"><Sparkles size={16}/> {userData?.streak || 0} يوم</div>
     
     {/* وحدة المحفظة الجديدة */}
     <div className="wallet-pill" onClick={() => navigate('/billing')}>
        <div className="wallet-info">
           <Wallet size={16} color="#00f2ff" />
           <span>{userData?.balance || 0} ج.م</span>
        </div>
        <button className="add-funds-btn" title="شحن الرصيد">
           <PlusCircle size={14} />
           <span>شحن</span>
        </button>
     </div>
  </div>
</div>
const HighSchool = () => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [topStudents, setTopStudents] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('الكل'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('latest'); 
  const navigate = useNavigate();

  // 1. جلب البيانات الشاملة
  useEffect(() => {
    const fetchPortalData = async () => {
      try {
        // جلب المناهج
        const courseQuery = query(collection(db, "courses_metadata"), orderBy("createdAt", "desc"));
        const courseSnap = await getDocs(courseQuery);
        const fetchedCourses = courseSnap.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          // محاكاة لنسبة الإنجاز (سيتم ربطها بـ Firebase في لوحة التحكم)
          progress: Math.floor(Math.random() * 85) 
        }));
        setCourses(fetchedCourses);
        setFilteredCourses(fetchedCourses);

        // جلب قائمة الأوائل (أفضل 3 طلاب)
        const leaderQuery = query(collection(db, "users"), orderBy("points", "desc"), limit(3));
        const leaderSnap = await getDocs(leaderQuery);
        setTopStudents(leaderSnap.docs.map(d => d.data()));

        setLoading(false);
      } catch (error) {
        console.error("Portal Error:", error);
        setLoading(false);
      }
    };

    // مراقبة بيانات المستخدم الحالية (XP, Streak)
    let unsubscribeUser = () => {};
    if (auth.currentUser) {
      unsubscribeUser = onSnapshot(doc(db, "users", auth.currentUser.uid), (doc) => {
        if (doc.exists()) setUserData(doc.data());
      });
    }

    fetchPortalData();
    return () => unsubscribeUser();
  }, []);

  // 2. محرك البحث والفلترة المتقدم
  useEffect(() => {
    let result = [...courses];

    // الفلترة حسب المرحلة
    if (activeTab !== 'الكل') {
      result = result.filter(c => 
        c.grade?.includes(activeTab) || c.category?.includes(activeTab)
      );
    }

    // البحث النصي
    if (searchTerm) {
      result = result.filter(c => 
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.instructor?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // الترتيب
    if (sortBy === 'lessons') {
      result.sort((a, b) => (b.lessons?.length || 0) - (a.lessons?.length || 0));
    } else {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    setFilteredCourses(result);
  }, [activeTab, searchTerm, courses, sortBy]);

  // شاشة التحميل الاحترافية
  if (loading) return (
    <div className="edu-loader-overlay">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="loader-content"
      >
        <div className="loader-ring">
          <Zap size={50} className="zap-icon" />
        </div>
        <h2 className="loading-text">جاري مزامنة محتواك التعليمي...</h2>
        <div className="loading-bar-container">
          <motion.div 
            initial={{ width: 0 }} 
            animate={{ width: '100%' }} 
            transition={{ duration: 2, repeat: Infinity }}
            className="loading-bar-fill" 
          />
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="edu-viewport rtl">
      
      {/* 🛡️ نظام الحماية الرقمي (Watermark) */}
      <div className="digital-watermark">
        <span>{auth.currentUser?.email || 'Student Access'}</span>
        <span>{new Date().toLocaleDateString()} — MAFA SECURITY</span>
      </div>

      {/* 🚀 قسم الهيرو (البطاقة الترحيبية + الأوائل) */}
      <section className="edu-hero-v3">
        <div className="hero-grid-bg"></div>
        <div className="hero-layout">
          
          {/* الجانب الأيمن: الترحيب والبحث */}
          <motion.div 
            initial={{ x: 100, opacity: 0 }} 
            animate={{ x: 0, opacity: 1 }} 
            className="hero-main-card glass"
          >
            <div className="hero-badge">
              <Flame size={16} className="flame-icon" />
              <span>أنت في المركز #{userData?.rank || '??'} هذا الأسبوع</span>
            </div>
            
            <h1>أكاديمية <span className="text-gradient">MAFA</span> الذكية</h1>
            <p>مرحباً {userData?.name || 'أيها البطل'}، واصل رحلة تعلمك اليوم واكتسب المزيد من النقاط.</p>
            
            <div className="search-bar-premium">
              <Search className="s-icon" size={20} />
              <input 
                type="text" 
                placeholder="ابحث عن مادة، مدرس، أو مراجعة..." 
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="filter-dropdown">
                 <Filter size={18} />
                 <select onChange={(e) => setSortBy(e.target.value)}>
                    <option value="latest">الأحدث أولاً</option>
                    <option value="lessons">الأكثر محتوى</option>
                 </select>
              </div>
            </div>

            <div className="quick-stats">
               <div className="q-stat"><Zap size={16}/> {userData?.points || 0} XP</div>
               <div className="q-stat"><Clock size={16}/> {userData?.hoursWatched || 0} ساعة</div>
               <div className="q-stat"><Sparkles size={16}/> {userData?.streak || 0} يوم</div>
            </div>
          </motion.div>

          {/* الجانب الأيسر: لوحة الأوائل المصغرة */}
          <motion.div 
            initial={{ x: -100, opacity: 0 }} 
            animate={{ x: 0, opacity: 1 }} 
            className="hero-side-card glass"
          >
             <div className="side-card-head">
               <Trophy size={20} color="#facc15" />
               <h3>قائمة المتصدرين</h3>
             </div>
             <div className="mini-leaderboard">
               {topStudents.map((student, index) => (
                 <div key={index} className={`mini-rank-item rank-${index + 1}`}>
                   <div className="rank-pos">{index + 1}</div>
                   <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${student.name}`} alt="avatar" />
                   <div className="rank-meta">
                     <p>{student.name?.split(' ')[0]}</p>
                     <span>{student.points} XP</span>
                   </div>
                   {index === 0 && <Award size={18} color="#facc15" className="winner-crown" />}
                 </div>
               ))}
             </div>
             <button onClick={() => navigate('/leaderboard')} className="view-full-rank">
               مشاهدة الترتيب الكامل <ChevronLeft size={16} />
             </button>
          </motion.div>
        </div>
      </section>

      {/* 🧭 شريط التنقل بين المراحل */}
      <nav className="edu-navigation-bar">
        <div className="nav-container">
          {['الكل', 'ابتدائي', 'اعدادي', 'ثانوي'].map((tab) => (
            <button 
              key={tab}
              className={`nav-item ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {activeTab === tab && <motion.div layoutId="active-pill" className="nav-bg" />}
              <span className="nav-text">{tab === 'الكل' ? 'كافة الأقسام' : `قسم ${tab}`}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* 📚 محتوى المناهج والدروس */}
      <main className="edu-container">
        
        {/* قسم "استكمال المشاهدة" الذكي */}
        <AnimatePresence>
          {userData?.lastCourse && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="resume-section"
            >
              <div className="section-header">
                <History size={18} color="#00f2ff" />
                <span>عد لمذاكرتك</span>
              </div>
              <div className="resume-card glass" onClick={() => navigate(`/course/${userData.lastCourseId}`)}>
                <div className="resume-left">
                   <div className="resume-icon"><PlayCircle size={30} /></div>
                   <div className="resume-text">
                     <h4>{userData.lastCourseTitle}</h4>
                     <p>توقفت عند: {userData.lastLessonTitle}</p>
                   </div>
                </div>
                <div className="resume-right">
                   <ArrowRightCircle size={24} className="jump-icon" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid-header">
          <div className="header-title">
            <BookOpen size={22} color="#00f2ff" />
            <h3>المناهج الدراسية ({filteredCourses.length})</h3>
          </div>
        </div>

        {/* شبكة الكورسات الاحترافية */}
        <div className="premium-grid">
          <AnimatePresence mode="popLayout">
            {filteredCourses.map((course, idx) => (
              <motion.div 
                key={course.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -8 }}
                className="course-card-v3"
                onClick={() => navigate(`/course/${course.id}`)}
              >
                <div className="card-top">
                  <img src={course.thumbnail || 'https://via.placeholder.com/400x225'} alt={course.title} />
                  <div className="card-badge">{course.grade}</div>
                  <div className="play-overlay">
                    <PlayCircle size={50} fill="#00f2ff" color="#000" />
                  </div>
                </div>

                <div className="card-body">
                  <h3 className="course-title">{course.title}</h3>
                  <div className="instructor-info">
                    <div className="mini-avatar">{course.instructor?.[0] || 'M'}</div>
                    <span>{course.instructor || "أ. محمود فرج"}</span>
                  </div>

                  {/* شريط الإنجاز الشخصي */}
                  <div className="personal-progress">
                    <div className="prog-labels">
                      <span>الإنجاز</span>
                      <span>{course.progress}%</span>
                    </div>
                    <div className="prog-bar-bg">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${course.progress}%` }} 
                        className="prog-bar-fill" 
                      />
                    </div>
                  </div>

                  <div className="card-footer">
                    <div className="f-item"><Clock size={14}/> {course.duration || 'دائم'}</div>
                    <div className="f-item"><LayoutDashboard size={14}/> {course.lessons?.length || 0} درس</div>
                    <button className="start-btn">دخول <ChevronLeft size={16}/></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* حالة عدم وجود نتائج */}
        {filteredCourses.length === 0 && (
          <div className="empty-state glass">
             <Search size={50} opacity={0.2} />
             <p>عذراً، لم نجد نتائج تطابق بحثك حالياً.</p>
             <button onClick={() => {setSearchTerm(''); setActiveTab('الكل');}} className="reset-btn">عرض الكل</button>
          </div>
        )}
      </main>

      <footer className="modern-footer glass">
          <div className="footer-content">
            <p>تطوير وإدارة <strong>TITO-TEC</strong> &copy; 2026</p>
            <div className="footer-badges">
              <Shield size={14}/> حماية المحتوى مفعلة
            </div>
          </div>
      </footer>
    </div>
  );
};

export default HighSchool;



