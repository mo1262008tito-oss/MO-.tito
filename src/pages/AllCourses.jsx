import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  doc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  increment 
} from 'firebase/firestore';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { 
  Search, GraduationCap, Code, Heart, Eye, Star, Clock, 
  Wallet, Zap, Play, X, Info, Trophy, ChevronLeft, 
  Filter, Bookmark, Share2, MessageSquare, Flame, 
  CheckCircle, PlayCircle, BarChart3, Settings, Bell
} from 'lucide-react';
import './AllCourses.css';

const AllCourses = () => {
  const navigate = useNavigate();
  
  // --- 1. إدارة حالات النظام (System States) ---
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('الكل');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [userProgress, setUserProgress] = useState({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sortType, setSortType] = useState('latest'); // latest, popular, rating
  const [stats, setStats] = useState({ totalXp: 0, completed: 0, balance: 0 });

  // --- 2. تعريف الأقسام والقوائم (Configurations) ---
  const categories = useMemo(() => [
    { id: 'all', name: 'الكل', icon: <BarChart3 />, color: '#ffffff', desc: 'كل المحتوى' },
    { id: 'edu', name: 'التعليمي', icon: <GraduationCap />, color: '#4facfe', desc: 'المناهج الدراسية' },
    { id: 'prog', name: 'البرمجي', icon: <Code />, color: '#00f2fe', desc: 'لغات العصر' },
    { id: 'rel', name: 'الديني', icon: <Heart />, color: '#43e97b', desc: 'علوم شرعية' },
    { id: 'social', name: 'فيديوهات تربوية', icon: <Eye />, color: '#fa709a', desc: 'تطوير وسلوك' }
  ], []);

  // --- 3. محرك جلب البيانات الحية (Data Engine) ---
  useEffect(() => {
    setLoading(true);
    let baseQuery = collection(db, 'courses');
    
    // الفلترة حسب القسم
    if (activeTab !== 'الكل') {
      baseQuery = query(baseQuery, where('category', '==', activeTab));
    }

    const unsubscribe = onSnapshot(baseQuery, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // إضافة بيانات افتراضية لو نقصت من الداتابيز لضمان عدم حدوث Error
        rating: doc.data().rating || 5.0,
        students: doc.data().students || 0,
        xpReward: doc.data().xpReward || 500,
        duration: doc.data().duration || '2h 30m'
      }));
      setCourses(docs);
      setLoading(false);
    }, (error) => {
      console.error("Critical Firebase Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeTab]);

  // جلب بيانات المستخدم المالية والتقدم
  useEffect(() => {
    if (auth.currentUser) {
      const userRef = doc(db, 'students', auth.currentUser.uid);
      const unsub = onSnapshot(userRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setStats({
            totalXp: data.xp || 0,
            completed: data.completedCourses?.length || 0,
            balance: data.balance || 0
          });
          setUserProgress(data.progress || {});
        }
      });
      return () => unsub();
    }
  }, []);

  // --- 4. معالجة المنطق (Business Logic) ---
  const filteredCourses = useMemo(() => {
    return courses
      .filter(c => c.title?.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        if (sortType === 'popular') return b.students - a.students;
        if (sortType === 'rating') return b.rating - a.rating;
        return 0; // default order
      });
  }, [courses, searchTerm, sortType]);

  const handleAction = useCallback((type, payload) => {
    switch(type) {
      case 'NAVIGATE_TO_EDU':
        navigate('/highschool');
        break;
      case 'OPEN_DETAILS':
        setSelectedCourse(payload);
        break;
      case 'CLOSE_DETAILS':
        setSelectedCourse(null);
        break;
      case 'START_COURSE':
        navigate(`/player/${payload.id}`);
        break;
      default: break;
    }
  }, [navigate]);

  // --- 5. المكونات الفرعية (Sub-Components) ---
  const SidebarItem = ({ cat }) => (
    <motion.button 
      whileHover={{ x: 10 }}
      whileTap={{ scale: 0.95 }}
      className={`sidebar-nav-link ${activeTab === cat.name ? 'active' : ''}`}
      onClick={() => cat.name === 'التعليمي' ? handleAction('NAVIGATE_TO_EDU') : setActiveTab(cat.name)}
      style={{ '--accent': cat.color }}
    >
      <span className="link-icon">{cat.icon}</span>
      {!sidebarCollapsed && (
        <div className="link-text">
          <strong>{cat.name}</strong>
          <small>{cat.desc}</small>
        </div>
      )}
    </motion.button>
  );

  return (
    <div className={`courses-super-app ${sidebarCollapsed ? 'collapsed' : ''}`}>
      
      {/* 1. الجانب الأيسر: نظام التنقل الاستراتيجي */}
      <aside className="app-sidebar-v4 glass-heavy">
        <div className="sidebar-header">
          <div className="brand-logo">
            <div className="logo-sq"><Zap fill="white" /></div>
            {!sidebarCollapsed && <span>STUDENT PRO</span>}
          </div>
          <button className="toggle-sidebar" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            <ChevronLeft style={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'none' }} />
          </button>
        </div>

        <nav className="sidebar-main-nav">
          <p className="nav-label">{!sidebarCollapsed ? 'الأقسام الرئيسية' : '•••'}</p>
          {categories.map(cat => <SidebarItem key={cat.id} cat={cat} />)}
        </nav>

        <div className="sidebar-extra">
          <div className="user-mini-card glass">
            <img src={auth.currentUser?.photoURL || 'https://ui-avatars.com/api/?name=User'} alt="avatar" />
            {!sidebarCollapsed && (
              <div className="u-meta">
                <p>{auth.currentUser?.displayName || 'طالب متميز'}</p>
                <span>مستوى 12</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* 2. منطقة العمل الرئيسية */}
      <main className="app-main-content">
        
        {/* هيدر التفاعل والبحث */}
        <header className="main-action-bar glass">
          <div className="search-engine-box">
            <Search className="search-icon" />
            <input 
              type="text" 
              placeholder="عما تبحث اليوم؟ (برمجة، فيزياء، تربية...)" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="search-shortcut">/</div>
          </div>

          <div className="header-utilities">
            <div className="utility-pill wallet">
              <Wallet size={18} />
              <span>{stats.balance.toFixed(2)} USDT</span>
            </div>
            <div className="utility-pill xp">
              <Trophy size={18} />
              <span>{stats.totalXp.toLocaleString()} XP</span>
            </div>
            <button className="icon-utility glass"><Bell size={20} /><span className="notif-dot"></span></button>
            <button className="icon-utility glass"><Settings size={20} /></button>
          </div>
        </header>

        <div className="content-scroll-v4">
          
          {/* قسم الترحيب والبانر */}
          <section className="welcome-hero-v4">
            <div className="hero-text">
              <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                أهلاً بك في فضاء <span className="gradient-text">{activeTab}</span>
              </motion.h1>
              <p>لديك اليوم {filteredCourses.length} كورس متاح. لقد أتممت {stats.completed} كورسات بنجاح حتى الآن، استمر في التقدم!</p>
            </div>
            <div className="hero-stats-row">
              <div className="h-stat"><strong>24</strong><span>ساعة تعلم</span></div>
              <div className="h-stat"><strong>+5</strong><span>أوسمة جديدة</span></div>
            </div>
          </section>

          {/* فلترة متقدمة */}
          <div className="filters-row">
            <div className="filter-group">
              <button className={`f-tab ${sortType === 'latest' ? 'active' : ''}`} onClick={() => setSortType('latest')}>الأحدث</button>
              <button className={`f-tab ${sortType === 'popular' ? 'active' : ''}`} onClick={() => setSortType('popular')}>الأكثر رواجاً</button>
              <button className={`f-tab ${sortType === 'rating' ? 'active' : ''}`} onClick={() => setSortType('rating')}>الأعلى تقييماً</button>
            </div>
            <div className="view-options">
              <Filter size={18} />
              <span>تصفية متقدمة</span>
            </div>
          </div>

          {/* شبكة الكورسات بتأثير الـ 3D */}
          <section className="courses-dynamic-grid">
            <AnimatePresence mode='popLayout'>
              {loading ? (
                Array(8).fill(0).map((_, i) => <div key={i} className="skeleton-v4" />)
              ) : filteredCourses.map((course, index) => (
                <motion.div 
                  key={course.id}
                  layoutId={course.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="course-card-v4 glass"
                  onClick={() => handleAction('OPEN_DETAILS', course)}
                >
                  <div className="card-top">
                    <img src={course.thumbnail} alt={course.title} loading="lazy" />
                    <div className="top-overlay">
                      <div className="badge-price">{course.price === 0 ? 'مجاني' : `${course.price} USDT`}</div>
                      {course.students > 100 && <div className="badge-hot"><Flame size={12} /> تريند</div>}
                    </div>
                  </div>
                  <div className="card-bottom">
                    <div className="card-meta-top">
                      <span className="c-tag">{course.category}</span>
                      <div className="c-rating"><Star size={12} fill="#f1c40f" /> {course.rating}</div>
                    </div>
                    <h3>{course.title}</h3>
                    <div className="card-metrics-v4">
                      <span><Clock size={14} /> {course.duration}</span>
                      <span><PlayCircle size={14} /> {course.lessonsCount || 10} درس</span>
                    </div>
                    <div className="card-footer-v4">
                      <div className="xp-gain">+{course.xpReward} XP</div>
                      <button className="quick-play"><Play size={16} fill="currentColor" /></button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </section>
        </div>
      </main>

      {/* 3. نافذة تفاصيل الكورس (The Master Detail Panel) */}
      <AnimatePresence>
        {selectedCourse && (
          <div className="mega-modal-overlay">
            <motion.div 
              className="course-full-details glass-heavy"
              layoutId={selectedCourse.id}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
            >
              <div className="detail-container">
                <button className="close-panel" onClick={() => handleAction('CLOSE_DETAILS')}><X /></button>
                
                <div className="detail-scrollable">
                  <div className="detail-visual">
                    <img src={selectedCourse.thumbnail} alt="" />
                    <div className="play-overlay-v4">
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        className="main-play-btn"
                        onClick={() => handleAction('START_COURSE', selectedCourse)}
                      >
                        <Play size={40} fill="currentColor" />
                      </motion.button>
                      <p>معاينة الكورس</p>
                    </div>
                  </div>

                  <div className="detail-body">
                    <div className="d-header">
                      <span className="d-badge">{selectedCourse.category}</span>
                      <h1>{selectedCourse.title}</h1>
                    </div>

                    <div className="d-stats-grid">
                      <div className="d-stat-item">
                        <Trophy color="#f1c40f" />
                        <div><strong>+{selectedCourse.xpReward}</strong><span>نقاط مكافأة</span></div>
                      </div>
                      <div className="d-stat-item">
                        <Clock color="#4facfe" />
                        <div><strong>{selectedCourse.duration}</strong><span>مدة الكورس</span></div>
                      </div>
                      <div className="d-stat-item">
                        <Star color="#ff7675" />
                        <div><strong>{selectedCourse.rating}</strong><span>تقييم الطلاب</span></div>
                      </div>
                    </div>

                    <div className="d-tabs">
                      <button className="d-tab-btn active">نظرة عامة</button>
                      <button className="d-tab-btn">المحتوى</button>
                      <button className="d-tab-btn">المراجعات</button>
                    </div>

                    <div className="d-content-text">
                      <h3>عن هذا الكورس</h3>
                      <p>{selectedCourse.description || 'هذا الكورس صمم خصيصاً لطلاب منصة Student Pro لضمان وصولهم لأعلى مستويات الاحتراف في هذا المجال.'}</p>
                      
                      <div className="learning-points">
                        <h4>ماذا ستتعلم؟</h4>
                        <ul>
                          <li><CheckCircle size={14} /> إتقان المفاهيم الأساسية والمتقدمة.</li>
                          <li><CheckCircle size={14} /> تطبيقات عملية ومشاريع حقيقية.</li>
                          <li><CheckCircle size={14} /> الحصول على شهادة إتمام معتمدة.</li>
                        </ul>
                      </div>
                    </div>

                    <div className="instructor-profile glass">
                      <img src="https://ui-avatars.com/api/?name=Teacher" alt="" />
                      <div className="inst-meta">
                        <h4>{selectedCourse.instructor || 'أستاذ المنصة المعتمد'}</h4>
                        <p>خبير في هذا المجال لأكثر من 10 سنوات</p>
                      </div>
                      <button className="follow-btn">متابعة</button>
                    </div>
                  </div>
                </div>

                <div className="detail-footer">
                  <div className="price-tag">
                    <small>سعر الكورس</small>
                    <strong>{selectedCourse.price === 0 ? 'مجاني تماماً' : `${selectedCourse.price} USDT`}</strong>
                  </div>
                  <div className="footer-btns">
                    <button className="share-btn glass"><Share2 size={20} /></button>
                    <button className="bookmark-btn glass"><Bookmark size={20} /></button>
                    <button className="purchase-btn" onClick={() => handleAction('START_COURSE', selectedCourse)}>
                      ابدأ التعلم الآن
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AllCourses;
