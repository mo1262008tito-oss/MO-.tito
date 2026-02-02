import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '../firebase';
import { 
  collection, onSnapshot, query, where, orderBy, 
  doc, updateDoc, arrayUnion, increment, getDoc, 
  limit, startAfter, serverTimestamp 
} from 'firebase/firestore';
import { 
  Search, GraduationCap, Code, Heart, Eye, Star, Clock, 
  Wallet, Zap, Play, X, Trophy, ChevronLeft, 
  Filter, Bookmark, Share2, Flame, CheckCircle, 
  PlayCircle, BarChart3, Settings, Bell, Lock, 
  ShieldCheck, ArrowRight, UserCheck, CreditCard,
  Target, Award, BookOpen, Layers
} from 'lucide-react';
import './AllCourses.css';

// --- المكونات المساعدة للتحميل ---
const CourseSkeleton = () => <div className="shimmer-box" />;

const AllCourses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('الكل');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [userData, setUserData] = useState({ balance: 0, enrolled: [], xp: 0 });
  const [buyingStatus, setBuyingStatus] = useState({ id: null, loading: false });
  const [notifications, setNotifications] = useState([]);

  // 1. تعريف مصفوفة الأقسام الذكية
  const categories = useMemo(() => [
    { id: 'all', name: 'الكل', icon: <BarChart3 />, desc: 'جميع المسارات التعليمية', accent: '#ffffff' },
    { id: 'edu', name: 'التعليمي', icon: <GraduationCap />, desc: 'المواد الدراسية والمناهج', accent: '#4facfe' },
    { id: 'prog', name: 'البرمجي', icon: <Code />, desc: 'هندسة البرمجيات والذكاء الاصطناعي', accent: '#00f2fe' },
    { id: 'rel', name: 'الديني', icon: <Heart />, desc: 'العلوم الشرعية والتربوية', accent: '#43e97b' },
    { id: 'social', name: 'تربوي', icon: <Eye />, desc: 'تطوير الذات والسلوك الإنساني', accent: '#fa709a' }
  ], []);

  // 2. محرك جلب البيانات الحية (Real-Time Sync Engine)
  useEffect(() => {
    let unsubscribe;
    const fetchCourses = () => {
      setLoading(true);
      const q = query(collection(db, 'courses'), orderBy('createdAt', 'desc'));
      
      unsubscribe = onSnapshot(q, (snapshot) => {
        const loadedCourses = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          rating: doc.data().rating || (4.5 + Math.random() * 0.5).toFixed(1),
          students: doc.data().studentsCount || 0
        }));
        setCourses(loadedCourses);
        setLoading(false);
      }, (error) => {
        console.error("Firebase Error:", error);
        setLoading(false);
      });
    };

    const fetchUserData = () => {
      if (!auth.currentUser) return;
      const userRef = doc(db, 'users', auth.currentUser.uid);
      onSnapshot(userRef, (snap) => {
        if (snap.exists()) {
          setUserData({
            balance: snap.data().balance || 0,
            enrolled: snap.data().enrolledCourses || [],
            xp: snap.data().xp || 0,
            rank: snap.data().rank || 'طالب جديد'
          });
        }
      });
    };

    fetchCourses();
    fetchUserData();
    return () => unsubscribe && unsubscribe();
  }, []);

  // 3. منطق الفلترة المتقدم (Advanced Filtering Logic)
  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      const matchCategory = activeTab === 'الكل' || course.category === activeTab;
      const matchSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          course.description?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [courses, activeTab, searchTerm]);

  // 4. معالج العمليات المالية (Transaction Handler)
  const handlePurchase = async (course) => {
    if (!auth.currentUser) return navigate('/login');
    
    // التحقق من الملكية المسبقة
    if (userData.enrolled.includes(course.id)) {
      return navigate(`/player/${course.id}`);
    }

    // التحقق من الرصيد
    if (userData.balance < course.price) {
      return alert("رصيدك الحالي غير كافٍ. توجه لصفحة الشحن لتعبئة محفظتك.");
    }

    setBuyingStatus({ id: course.id, loading: true });

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const courseRef = doc(db, 'courses', course.id);

      // تنفيذ العملية (Atomic Update)
      await updateDoc(userRef, {
        balance: increment(-course.price),
        enrolledCourses: arrayUnion(course.id),
        lastActivity: serverTimestamp()
      });

      await updateDoc(courseRef, {
        studentsCount: increment(1)
      });

      // إضافة إشعار نجاح
      setNotifications(prev => [...prev, { id: Date.now(), text: `تم تفعيل كورس ${course.title} بنجاح!` }]);
      setSelectedCourse(null);
    } catch (err) {
      alert("حدث خطأ تقني أثناء معالجة الشراء. يرجى المحاولة لاحقاً.");
    } finally {
      setBuyingStatus({ id: null, loading: false });
    }
  };

  // 5. واجهة العرض (UI Render Engine)
  return (
    <div className="mafa-super-app">
      
      {/* Sidebar: Global Controller */}
      <aside className={`mafa-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-branding">
          <div className="logo-container"><Zap size={24} fill="white"/></div>
          {!isSidebarCollapsed && <h2 style={{fontWeight: 900, letterSpacing: '1px'}}>MAFA ACADEMY</h2>}
        </div>

        <nav className="nav-container">
          <p style={{fontSize: '11px', color: '#555', marginBottom: '15px', paddingRight: '15px'}}>المسارات الرئيسية</p>
          {categories.map(cat => (
            <motion.div 
              key={cat.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`nav-item ${activeTab === cat.name ? 'active' : ''}`}
              onClick={() => setActiveTab(cat.name)}
            >
              <span className="icon-v5">{cat.icon}</span>
              {!isSidebarCollapsed && (
                <div className="nav-txt">
                  <span style={{display: 'block', fontWeight: 800}}>{cat.name}</span>
                  <small style={{fontSize: '10px', opacity: 0.6}}>{cat.desc}</small>
                </div>
              )}
            </motion.div>
          ))}
        </nav>

        <div className="sidebar-footer" style={{padding: '20px', borderTop: '1px solid var(--border-subtle)'}}>
          <div className="wallet-card-v5 glass" style={{background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '25px'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px'}}>
                <Wallet size={18} color="var(--brand-primary)"/>
                {!isSidebarCollapsed && <span style={{fontSize: '12px', color: '#888'}}>رصيد المحفظة</span>}
              </div>
              {!isSidebarCollapsed && <h2 style={{fontWeight: 900}}>{userData.balance.toLocaleString()} <small>USDT</small></h2>}
          </div>
        </div>
      </aside>

      {/* Main View Engine */}
      <main className="content-engine">
        
        {/* Top Intelligence Bar */}
        <header className="global-top-bar">
          <div className="advanced-search-wrapper">
            <Search className="search-icon" style={{position: 'absolute', right: '25px', top: '50%', transform: 'translateY(-50%)', color: '#555'}} />
            <input 
              type="text" 
              placeholder="ابحث عن دروس، مهارات، أو مدربين..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="utility-stack" style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
            <div className="xp-badge" style={{display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--surface-card)', padding: '10px 20px', borderRadius: '15px'}}>
              <Trophy size={18} color="#f1c40f"/>
              <span style={{fontWeight: 900}}>{userData.xp} XP</span>
            </div>
            <button className="icon-btn-v5" style={{background: 'none', border: 'none', color: 'white', position: 'relative'}}>
              <Bell size={24} />
              <span style={{width: '8px', height: '8px', background: 'red', borderRadius: '50%', position: 'absolute', top: 0, right: 0}}></span>
            </button>
            <div className="profile-mini-v5" style={{display: 'flex', alignItems: 'center', gap: '12px', paddingRight: '20px', borderRight: '1px solid #222'}}>
               <div style={{textAlign: 'left'}}>
                  <p style={{fontSize: '14px', fontWeight: 800}}>{auth.currentUser?.displayName || 'طالب مجتهد'}</p>
                  <span style={{fontSize: '11px', color: 'var(--brand-primary)'}}>{userData.rank}</span>
               </div>
               <img src={auth.currentUser?.photoURL || 'https://via.placeholder.com/40'} alt="P" style={{width: '45px', height: '45px', borderRadius: '15px', objectFit: 'cover'}}/>
            </div>
          </div>
        </header>

        {/* Dynamic Content Viewport */}
        <div className="grid-viewport">
          
          <section className="hero-section-v5" style={{marginBottom: '50px'}}>
             <motion.h1 initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} style={{fontSize: '50px', fontWeight: 900, marginBottom: '15px'}}>
               مستقبل التعلم <span style={{color: 'var(--brand-primary)'}}>{activeTab}</span>
             </motion.h1>
             <p style={{color: '#888', maxWidth: '600px', fontSize: '18px', lineHeight: '1.6'}}>
               استكشف مكتبة ضخمة من الكورسات المصممة خصيصاً لتناسب احتياجاتك العلمية والعملية، بمحتوى حصري وجودة عالمية.
             </p>
          </section>

          {/* الكورسات الحية */}
          <div className="course-grid-v5">
            <AnimatePresence mode="popLayout">
              {loading ? (
                [1,2,3,4,5,6].map(i => <CourseSkeleton key={i} />)
              ) : filteredCourses.map((course, index) => (
                <motion.div 
                  layoutId={course.id}
                  key={course.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="modern-course-card"
                  onClick={() => setSelectedCourse(course)}
                >
                  <div className="card-visual-engine">
                    <img src={course.thumbnail} alt={course.title} />
                    <div className="price-tag-v5">
                      {course.price === 0 ? 'مجاني' : `${course.price} USDT`}
                    </div>
                    {userData.enrolled.includes(course.id) && (
                      <div className="enrolled-check" style={{position: 'absolute', bottom: '15px', right: '15px', background: '#10b981', padding: '8px', borderRadius: '50%'}}>
                        <ShieldCheck size={20} color="white"/>
                      </div>
                    )}
                  </div>

                  <div className="card-body-v5" style={{padding: '30px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '15px'}}>
                      <span style={{fontSize: '12px', fontWeight: 900, color: 'var(--brand-primary)', textTransform: 'uppercase'}}>{course.category}</span>
                      <div style={{display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px'}}><Star size={14} fill="#f1c40f" color="#f1c40f"/> {course.rating}</div>
                    </div>
                    <h3 style={{fontSize: '22px', fontWeight: 900, marginBottom: '20px', height: '60px', overflow: 'hidden'}}>{course.title}</h3>
                    
                    <div className="card-meta-v5" style={{display: 'flex', gap: '20px', marginBottom: '25px', color: '#666', fontSize: '14px'}}>
                       <span style={{display: 'flex', alignItems: 'center', gap: '8px'}}><Clock size={16}/> {course.duration}</span>
                       <span style={{display: 'flex', alignItems: 'center', gap: '8px'}}><PlayCircle size={16}/> {course.lessonsCount} درس</span>
                    </div>

                    <div className="card-footer-v5" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                       <div className="students-v5" style={{display: 'flex', alignItems: 'center', gap: '8px', color: '#888'}}>
                         <UserCheck size={16}/> <span>{course.students} طالب</span>
                       </div>
                       <motion.button 
                          whileHover={{ scale: 1.1 }}
                          className="quick-action-btn"
                          style={{width: '50px', height: '50px', background: 'white', border: 'none', borderRadius: '18px', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center'}}
                       >
                         <Play size={20} fill="#000" />
                       </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Right Details Panel Overlay */}
      <AnimatePresence>
        {selectedCourse && (
          <div className="side-details-overlay" onClick={() => setSelectedCourse(null)}>
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="details-panel-v5"
              onClick={e => e.stopPropagation()}
            >
              {/* Header Details */}
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '40px'}}>
                <button onClick={() => setSelectedCourse(null)} style={{background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '15px', borderRadius: '15px'}}><X size={24}/></button>
                <div style={{display: 'flex', gap: '15px'}}>
                  <button className="glass-icon-btn" style={{background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '15px', borderRadius: '15px'}}><Share2/></button>
                  <button className="glass-icon-btn" style={{background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '15px', borderRadius: '15px'}}><Bookmark/></button>
                </div>
              </div>

              <div className="main-detail-visual" style={{width: '100%', height: '300px', borderRadius: '30px', overflow: 'hidden', marginBottom: '35px'}}>
                <img src={selectedCourse.thumbnail} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
              </div>

              <div className="detail-info-engine">
                <span style={{color: 'var(--brand-primary)', fontWeight: 900}}>{selectedCourse.category}</span>
                <h1 style={{fontSize: '36px', fontWeight: 900, marginTop: '15px', lineHeight: '1.3'}}>{selectedCourse.title}</h1>
                
                <div className="fast-stats" style={{display: 'flex', gap: '30px', margin: '30px 0'}}>
                   <div style={{display: 'flex', gap: '10px'}}><Award color="#f1c40f"/> <span>شهادة معتمدة</span></div>
                   <div style={{display: 'flex', gap: '10px'}}><Target color="#4facfe"/> <span>مستوى متقدم</span></div>
                   <div style={{display: 'flex', gap: '10px'}}><BookOpen color="#fa709a"/> <span>ملحقات PDF</span></div>
                </div>

                <p style={{color: '#888', fontSize: '18px', lineHeight: '1.8', marginBottom: '40px'}}>
                  {selectedCourse.description || "هذا الكورس يمثل رحلة تعليمية شاملة، حيث سنغوص في أعماق المفاهيم الأساسية والمتقدمة، مع تطبيقات عملية ومشاريع واقعية لضمان وصولك لمرحلة الاحتراف المطلق."}
                </p>

                <div className="curriculum-preview" style={{background: 'rgba(255,255,255,0.02)', padding: '30px', borderRadius: '30px', marginBottom: '50px'}}>
                  <h4 style={{marginBottom: '20px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px'}}><Layers size={20}/> نظرة على محتوى الكورس</h4>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                    {[1, 2, 3].map(i => (
                      <div key={i} style={{display: 'flex', justifyContent: 'space-between', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '15px', fontSize: '14px'}}>
                         <span>الوحدة {i}: مقدمة في {selectedCourse.category}</span>
                         <Lock size={16} color="#555"/>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="purchase-action-container" style={{position: 'sticky', bottom: '0', background: '#0d0d0d', paddingTop: '20px', borderTop: '1px solid #222'}}>
                   <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px'}}>
                      <div>
                        <small style={{color: '#666', display: 'block'}}>سعر الاشتراك الكامل</small>
                        <strong style={{fontSize: '30px', color: 'var(--brand-primary)'}}>{selectedCourse.price === 0 ? 'مجاني تماماً' : `${selectedCourse.price} USDT`}</strong>
                      </div>
                      <div style={{textAlign: 'right'}}>
                        <small style={{color: '#666', display: 'block'}}>تقييم المحتوى</small>
                        <strong style={{fontSize: '20px'}}><Star fill="#f1c40f" color="#f1c40f" size={18}/> {selectedCourse.rating}</strong>
                      </div>
                   </div>

                   <button 
                    className="cta-button-v5"
                    disabled={buyingStatus.loading}
                    onClick={() => handlePurchase(selectedCourse)}
                   >
                     {buyingStatus.loading ? (
                        "جاري تأكيد العملية..."
                     ) : userData.enrolled.includes(selectedCourse.id) ? (
                        <>دخول لمنصة التعلم <ArrowRight/></>
                     ) : (
                        <>تفعيل الكورس والبدء الآن <CreditCard/></>
                     )}
                   </button>
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
