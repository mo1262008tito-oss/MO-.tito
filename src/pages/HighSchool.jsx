import React, { 
  useState, 
  useEffect, 
  useMemo, 
  useRef, 
  useCallback, 
  useLayoutEffect 
} from 'react';
import { useNavigate, Link } from 'react-router-dom';

// استيراد مكتبات Firebase الأساسية
import { db, auth, storage } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  getDoc, 
  updateDoc, 
  increment, 
  addDoc, 
  serverTimestamp, 
  limit, 
  arrayUnion, 
  runTransaction,
  writeBatch,
  getDocs
} from 'firebase/firestore';

// مكتبات الحركة والتصميم
import { motion, AnimatePresence, useScroll, useSpring, useTransform } from 'framer-motion';
import { 
  Zap, Star, Users, Clock, Lock, Unlock, Wallet, Sparkles, Trophy, 
  Search, Filter, Shield, HardDrive, CreditCard, Share2, Eye, 
  PlayCircle, AlertCircle, Menu, X, Bell, Settings, LogOut, 
  ChevronRight, Heart, MessageSquare, Info, BookOpen, GraduationCap,
  Award, Flame, Target, Rocket, Headphones, PenTool, Monitor, CheckCircle2,
  TrendingUp, Calendar, ChevronLeft, Bookmark, Crown, Gift, HelpCircle,
  LayoutDashboard, BellDot, ShieldCheck, UserCheck, Briefcase, FileText,
  MapPin, Phone, Mail, Globe, Cpu, Database, CloudLightning
} from 'lucide-react';
import './HighSchool.css';
// --- الثوابت والبيانات الثابتة للنظام (Constants) ---
const STAGES = ['ابتدائي', 'اعدادي', 'ثانوي'];
const GRADES = {
  'ابتدائي': ['الصف الأول', 'الصف الثاني', 'الصف الثالث', 'الصف الرابع', 'الصف الخامس', 'الصف السادس'],
  'اعدادي': ['الصف الأول الاعدادي', 'الصف الثاني الاعدادي', 'الصف الثالث الاعدادي'],
  'ثانوي': ['الصف الأول الثانوي', 'الصف الثاني الثانوي', 'الصف الثالث الثانوي']
};

const SUBJECTS = [
  'الكل', 'اللغة العربية', 'اللغة الإنجليزية', 'الرياضيات', 'الفيزياء', 
  'الكيمياء', 'الأحياء', 'التاريخ', 'الجغرافيا', 'الفلسفة'
];

/**
 * @component HighSchool
 * @version 3.0.0
 */
const HighSchool = () => {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  
  // 1. حالات إدارة المستخدم والأمان (User & Security States)
  const [userData, setUserData] = useState(null);
  const [isActivated, setIsActivated] = useState(false);
  const [isSecure, setIsSecure] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [watermarkPos, setWatermarkPos] = useState({ x: 10, y: 10 });

  // 2. حالات المحتوى والفلترة (Content & Filtering States)
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [educationStage, setEducationStage] = useState('ثانوي'); 
  const [currentGrade, setCurrentGrade] = useState('الصف الثالث الثانوي');
  const [branch, setBranch] = useState('عام'); // علمي | أدبي | عام
  const [activeTab, setActiveTab] = useState('الكل');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [loading, setLoading] = useState(true);

  // 3. حالات التفاعل والإشعارات (Interaction States)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [topStudents, setTopStudents] = useState([]);
  const [walletModal, setWalletModal] = useState(false);
  const [wishlist, setWishlist] = useState([]);
  const [systemStats, setSystemStats] = useState({ totalStudents: 0, totalCourses: 0 });

  // 4. نظام المؤثرات الحركية (Framer Motion Setup)
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const heroOpacity = useTransform(scrollYProgress, [0, 300], [1, 0]);
// -----------------------------------------------------------------
  // 5. محرك الأمان الفائق (Security Engine)
  // -----------------------------------------------------------------
  useEffect(() => {
    const preventIntrusion = (e) => {
      if (e.ctrlKey && (e.key === 'u' || e.key === 's' || e.key === 'i' || e.key === 'j' || e.key === 'p' || e.key === 'c')) {
        e.preventDefault();
        return false;
      }
      if (e.keyCode === 123) { e.preventDefault(); return false; }
    };

    const handleContextMenu = (e) => e.preventDefault();

    const detectDevTools = () => {
      const isDevToolsOpen = window.outerWidth - window.innerWidth > 160 || window.outerHeight - window.innerHeight > 160;
      setIsSecure(!isDevToolsOpen);
    };

    document.addEventListener('keydown', preventIntrusion);
    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('resize', detectDevTools);

    const wmInterval = setInterval(() => {
      setWatermarkPos({ x: Math.floor(Math.random() * 80) + 5, y: Math.floor(Math.random() * 80) + 5 });
    }, 10000);

    return () => {
      document.removeEventListener('keydown', preventIntrusion);
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('resize', detectDevTools);
      clearInterval(wmInterval);
    };
  }, []);

  // -----------------------------------------------------------------
  // 6. محرك مزامنة البيانات (Data Sync Engine)
  // -----------------------------------------------------------------
  useEffect(() => {
    let unsubUser, unsubCourses, unsubStats, unsubNotif, unsubLeaders;
    const user = auth.currentUser;

    if (!user) {
      setAuthLoading(false);
      navigate('/login');
      return;
    }

    const initializeDataSync = () => {
      // مراقبة بيانات المستخدم
      unsubUser = onSnapshot(doc(db, "users", user.uid), (snap) => {
        if (!snap.exists()) { navigate('/complete-profile'); return; }
        const data = snap.data();
        if (!data.profileCompleted) navigate('/complete-profile');
        else if (!data.isActivated) navigate('/activation-pending');
        else {
          setUserData({ id: snap.id, ...data });
          setEducationStage(data.stage || 'ثانوي');
          setCurrentGrade(data.grade || 'الصف الثالث الثانوي');
          setBranch(data.branch || 'عام');
          setWishlist(data.wishlist || []);
          setAuthLoading(false); 
        }
      });

      // جلب الكورسات
      const coursesQuery = query(
        collection(db, "courses_metadata"),
        where("stage", "==", educationStage),
        where("grade", "==", currentGrade),
        where("isPublic", "==", true),
        orderBy("createdAt", "desc")
      );
      unsubCourses = onSnapshot(coursesQuery, (snap) => {
        setCourses(snap.docs.map(d => ({ id: d.id, ...d.data(), rating: d.data().rating || 4.5, studentsCount: d.data().studentsCount || 0 })));
        setLoading(false);
      });

      // إحصائيات ولوحة الصدارة والإشعارات
      unsubStats = onSnapshot(doc(db, "system", "global_stats"), (snap) => snap.exists() && setSystemStats(snap.data()));
      
      const leaderQuery = query(collection(db, "users"), where("stage", "==", educationStage), orderBy("points", "desc"), limit(5));
      unsubLeaders = onSnapshot(leaderQuery, (snap) => setTopStudents(snap.docs.map(d => d.data())));

      const notifQuery = query(collection(db, "notifications"), where("userId", "==", user.uid), orderBy("createdAt", "desc"), limit(10));
      unsubNotif = onSnapshot(notifQuery, (snap) => setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    };

    initializeDataSync();

    return () => {
      unsubUser?.(); unsubCourses?.(); unsubStats?.(); unsubNotif?.(); unsubLeaders?.();
    };
  }, [educationStage, currentGrade, navigate]);
// -----------------------------------------------------------------
  // 7. محرك الفلترة والبحث (Filtering Engine)
  // -----------------------------------------------------------------
  useEffect(() => {
    let result = [...courses];

    // الفلترة بالبحث (مع حماية ضد النصوص الفارغة)
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase().trim();
      result = result.filter(c => 
        c.title?.toLowerCase().includes(lowerSearch) || 
        c.instructor?.toLowerCase().includes(lowerSearch) ||
        c.subject?.toLowerCase().includes(lowerSearch)
      );
    }

    // الفلترة بالتبويب (المادة)
    if (activeTab !== 'الكل') {
      result = result.filter(c => c.subject === activeTab);
    }

    // الفلترة بالتخصص (علمي/أدبي) إذا كان في ثانوي
    if (educationStage === 'ثانوي' && branch !== 'عام') {
      result = result.filter(c => c.branch === branch || c.branch === 'عام');
    }

    // الترتيب المنطقي
    if (sortBy === 'latest') result.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    if (sortBy === 'popular') result.sort((a, b) => (b.studentsCount || 0) - (a.studentsCount || 0));
    if (sortBy === 'rating') result.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    setFilteredCourses(result);
  }, [searchTerm, activeTab, courses, sortBy, educationStage, branch]);

  // -----------------------------------------------------------------
  // 8. منطق العمليات المالية (Wallet & Transactions)
  // -----------------------------------------------------------------
  const handlePurchase = async (course) => {
    if (!userData) return;

    // 1. التحقق من الملكية المسبقة
    if (userData.enrolledCourses?.includes(course.id)) {
      navigate(`/course-player/${course.id}`);
      return;
    }

    // 2. الكورس المجاني
    if (course.isFree) {
      await enrollStudent(course.id);
      return;
    }

    // 3. التحقق من الرصيد
    if ((userData.balance || 0) < course.price) {
      setWalletModal(true);
      return;
    }

    // 4. تنفيذ العملية عبر Firestore Transaction لضمان الدقة
    if (window.confirm(`تأكيد شراء كورس ${course.title} بسعر ${course.price} ج.م؟`)) {
      try {
        await runTransaction(db, async (transaction) => {
          const userRef = doc(db, "users", auth.currentUser.uid);
          const courseRef = doc(db, "courses_metadata", course.id);
          
          const userSnap = await transaction.get(userRef);
          if (!userSnap.exists()) throw "User does not exist";
          if (userSnap.data().balance < course.price) throw "Insufficient balance";

          transaction.update(userRef, {
            balance: increment(-course.price),
            enrolledCourses: arrayUnion(course.id),
            points: increment(50)
          });

          transaction.update(courseRef, {
            studentsCount: increment(1)
          });

          const logRef = doc(collection(db, "transactions"));
          transaction.set(logRef, {
            userId: auth.currentUser.uid,
            userName: userData.name,
            courseId: course.id,
            courseTitle: course.title,
            amount: course.price,
            type: 'purchase',
            timestamp: serverTimestamp()
          });
        });

        alert("تم الاشتراك بنجاح!");
      } catch (error) {
        console.error("Transaction Error:", error);
        alert("حدث خطأ أثناء الشراء، يرجى المحاولة لاحقاً.");
      }
    }
  };

  const enrollStudent = async (courseId) => {
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, { enrolledCourses: arrayUnion(courseId) });
      navigate(`/course-player/${courseId}`);
    } catch (e) {
      console.error("Enrollment Error:", e);
    }
  };

  // -----------------------------------------------------------------
  // 9. الدوال المساعدة (Helper Functions)
  // -----------------------------------------------------------------
  const toggleWishlist = async (courseId, e) => {
    e?.stopPropagation();
    if (!auth.currentUser) return;
    const userRef = doc(db, "users", auth.currentUser.uid);
    const isExist = wishlist.includes(courseId);
    
    await updateDoc(userRef, {
      wishlist: isExist ? wishlist.filter(id => id !== courseId) : arrayUnion(courseId)
    });
  };

  const getThemeColors = () => {
    if (educationStage === 'ابتدائي') return { main: '#4ade80', glow: 'rgba(74, 222, 128, 0.5)', bg: 'from-green-500/10 to-transparent' };
    if (educationStage === 'اعدادي') return { main: '#60a5fa', glow: 'rgba(96, 165, 250, 0.5)', bg: 'from-blue-500/10 to-transparent' };
    if (currentGrade === 'الصف الثالث الثانوي') return { main: '#f87171', glow: 'rgba(248, 113, 113, 0.5)', bg: 'from-red-500/10 to-transparent' };
    return { main: '#a78bfa', glow: 'rgba(167, 139, 250, 0.5)', bg: 'from-purple-500/10 to-transparent' };
  };

  const theme = getThemeColors();
  // -----------------------------------------------------------------
  // 10. مكونات الواجهة الصغيرة (Sub-components)
  // -----------------------------------------------------------------
  // --- 10. مكونات الواجهة الصغيرة (Sub-components) ---

  // شريط الإعلانات المتحرك
  const PromoBanner = () => (
    <div className="promo-banner bg-gradient-to-r from-yellow-500 to-orange-600 text-white overflow-hidden py-2 relative">
      <motion.div 
        animate={{ x: ['100%', '-100%'] }} 
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className="whitespace-nowrap flex items-center gap-10 font-bold"
      >
        <span>🎁 خصم 50% على اشتراك العام الكامل لطلاب تالتة ثانوي!</span>
        <span>🔥 انضم الآن لأكثر من {systemStats.totalStudents || 0} طالب مسجل</span>
        <span>🚀 بنك الأسئلة الجديد متاح الآن مجاناً للمشتركين</span>
      </motion.div>
    </div>
  );

  // الكارت الخاص بكل كورس
  const CourseCard = ({ course, index }) => {
    const isEnrolled = userData?.enrolledCourses?.includes(course.id);
    
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1 }}
        className="course-card-premium group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:border-white/20 transition-all duration-500"
      >
        <div className="relative h-52 overflow-hidden">
          <img 
            src={course.thumbnail} 
            alt={course.title} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60" />
          
          {/* شارات الكورس */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {course.isFree ? (
              <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">مجاني</span>
            ) : (
              <span className="text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg" style={{ background: theme.main }}>
                {course.price} ج.م
              </span>
            )}
            {course.isTrending && (
               <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                 <Flame size={10} /> تريند
               </span>
            )}
          </div>

          <button 
            onClick={(e) => toggleWishlist(course.id, e)}
            className="absolute top-4 right-4 p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-red-500 transition-colors"
          >
            <Heart size={18} fill={wishlist.includes(course.id) ? "currentColor" : "none"} />
          </button>

          <div 
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            onClick={() => handlePurchase(course)}
          >
            <div className="p-4 bg-white/20 backdrop-blur-xl rounded-full scale-50 group-hover:scale-100 transition-transform">
              <PlayCircle size={50} className="text-white" />
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <img src={course.instructorAvatar || "/default-avatar.png"} className="w-6 h-6 rounded-full border border-white/20" alt="" />
            <span className="text-gray-400 text-xs font-medium">{course.instructor}</span>
          </div>
          
          <h3 className="text-white font-bold text-lg mb-4 line-clamp-1 group-hover:text-primary transition-colors">
            {course.title}
          </h3>

          <div className="grid grid-cols-3 gap-2 mb-6">
            <div className="flex flex-col items-center p-2 bg-white/5 rounded-xl">
              <Users size={14} className="text-gray-400 mb-1" />
              <span className="text-white text-[10px]">{course.studentsCount}</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-white/5 rounded-xl">
              <Star size={14} className="text-yellow-500 mb-1" />
              <span className="text-white text-[10px]">{course.rating}</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-white/5 rounded-xl">
              <Clock size={14} className="text-gray-400 mb-1" />
              <span className="text-white text-[10px]">{course.duration}</span>
            </div>
          </div>

          {/* مؤشر التقدم */}
          {isEnrolled && (
            <div className="mb-4">
              <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                <span>تقدمك في المادة</span>
                <span>{userData.progress?.[course.id] || 0}%</span>
              </div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${userData.progress?.[course.id] || 0}%` }}
                  className="h-full"
                  style={{ background: theme.main }}
                />
              </div>
            </div>
          )}

          <button 
            onClick={() => handlePurchase(course)}
            className="w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
            style={{ 
              background: isEnrolled ? 'transparent' : theme.main,
              border: isEnrolled ? `1px solid ${theme.main}` : 'none',
              color: 'white',
              boxShadow: isEnrolled ? 'none' : theme.glow
            }}
          >
            {isEnrolled ? (
              <><Monitor size={18} /> متابعة التعلم</>
            ) : (
              <><Zap size={18} /> اشترك الآن</>
            )}
          </button>
        </div>
      </motion.div>
    );
  };
  // --- 11. ريندر الواجهة الرئيسية (Main Render) ---
  
  // حالة التحميل الكلي
  if (authLoading) return (
    <div className="h-screen w-full bg-[#0a0a0a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <motion.div 
          animate={{ rotate: 360, scale: [1, 1.2, 1] }} 
          transition={{ duration: 2, repeat: Infinity }}
          className="w-20 h-20 border-4 border-white/5 rounded-full"
          style={{ borderTopColor: theme.main }}
        />
        <p className="text-white font-bold tracking-widest animate-pulse">جاري تأمين الاتصال بـ MAFA ACADEMY...</p>
      </div>
    </div>
  );

  return (
    <div 
      className={`portal-container min-h-screen bg-[#0a0a0a] text-white selection:bg-white/10 ${!isSecure ? 'blur-3xl grayscale pointer-events-none' : ''}`}
      style={{ fontFamily: 'Cairo, sans-serif' }}
    >
      <PromoBanner />

      {/* ميزة العلامة المائية الذكية */}
      <div 
        className="fixed pointer-events-none z-[9999] opacity-[0.03] text-white font-bold text-sm select-none transition-all duration-1000"
        style={{ top: `${watermarkPos.y}%`, left: `${watermarkPos.x}%` }}
      >
        {userData?.email} <br /> {new Date().toLocaleString()}
      </div>

      {/* شريط التقدم العلوي */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 z-[1001] origin-left" 
        style={{ scaleX, background: theme.main }} 
      />

      {/* 🧭 الهيدر (Navbar) */}
      <header className="sticky top-0 z-[1000] bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          
          <div className="flex items-center gap-8">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
              <Menu size={26} />
            </button>
            <Link to="/" className="flex items-center gap-3 group">
              <div className="p-2 rounded-2xl rotate-3 group-hover:rotate-12 transition-transform" style={{ background: theme.main }}>
                <Rocket size={24} className="text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xl tracking-tighter leading-none">MAFA</span>
                <span className="text-[10px] font-bold text-gray-500 tracking-[0.2em]">ACADEMY</span>
              </div>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-1 bg-white/5 p-1.5 rounded-2xl border border-white/5">
            {STAGES.map(s => (
              <button
                key={s}
                onClick={() => setEducationStage(s)}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${educationStage === s ? 'bg-white text-black shadow-xl' : 'text-gray-400 hover:text-white'}`}
              >
                {s}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <div 
              className="hidden md:flex items-center gap-3 px-4 py-2 bg-white/5 rounded-2xl border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
              onClick={() => setWalletModal(true)}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${theme.main}20`, color: theme.main }}>
                <Wallet size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 font-bold">رصيد المحفظة</span>
                <span className="text-sm font-black">{userData?.balance || 0} ج.م</span>
              </div>
            </div>

            <div className="relative">
              <button 
                onClick={() => setShowNotifPanel(!showNotifPanel)}
                className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors relative"
              >
                <Bell size={22} />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 border-2 border-[#0a0a0a] rounded-full" />
                )}
              </button>
            </div>

<div className="flex items-center gap-3 pl-4 border-l border-white/10 ml-2">
               <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userData?.name || 'anonymous'}`} 
                className="w-10 h-10 rounded-2xl border-2 p-0.5"
                style={{ borderColor: theme.main }}
                alt="user"
               />
            </div>
          </div>
        </div>
      </header>

      {/* 🚀 قسم الهيرو (Hero Section) */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        {/* خلفيات متحركة مخصصة حسب المرحلة */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b ${theme.bg} blur-[120px] -z-10`} />
        
        <div className="max-w-[1400px] mx-auto px-6 grid lg:grid-cols-12 gap-16 items-center">
          
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-7"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-md rounded-full border border-white/10 mb-8">
              <Sparkles size={16} className="text-yellow-500" />
              <span className="text-xs font-bold text-gray-300">أهلاً بك في الجيل القادم من التعليم</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-black leading-[1.1] mb-8">
              طريقك للقمة <br /> 
              بدأ من <span className="text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(to right, ${theme.main}, #fff)` }}>MAFA</span>
            </h1>

            <p className="text-gray-400 text-lg md:text-xl max-w-2xl mb-12 leading-relaxed">
              تصفح الآن أفضل الكورسات التعليمية لـ <span className="text-white font-bold">{currentGrade}</span>. 
              أكثر من {systemStats.totalCourses || 0} كورس متخصص تم إعدادهم بواسطة نخبة من الخبراء.
            </p>

            <div className="flex flex-wrap gap-4 mb-12">
              <div className="flex -space-x-3">
                {[1,2,3,4].map(i => (
                  <img key={i} src={`https://i.pravatar.cc/150?u=student${i}`} className="w-12 h-12 rounded-full border-4 border-[#0a0a0a]" alt="student" />
                ))}
                <div className="w-12 h-12 rounded-full border-4 border-[#0a0a0a] flex items-center justify-center text-xs font-bold" style={{ background: theme.main }}>
                  +{Math.floor((systemStats.totalStudents || 0) / 1000)}k
                </div>
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-white font-bold">طلابنا المتميزين</span>
                <span className="text-gray-500 text-xs">نفتخر بكوننا جزءاً من نجاحهم</span>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1 group">
                <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-white transition-colors" />
                <input 
                  type="text" 
                  placeholder="ابحث عن مادة، مدرس، أو درس معين..."
                  className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl pr-14 pl-6 text-white outline-none focus:border-white/20 transition-all"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button 
                className="h-16 px-10 text-black font-black rounded-2xl hover:scale-105 active:scale-95 transition-all"
                style={{ backgroundColor: 'white' }}
              >
                بحث ذكي
              </button>
            </div>
          </motion.div>

          {/* لوحة الصدارة المصغرة */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-5 hidden lg:block"
          >
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px] p-8 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-10 opacity-10">
                  <Trophy size={150} style={{ color: theme.main }} />
               </div>
               
               <div className="flex items-center justify-between mb-8 relative z-10">
                  <h3 className="text-xl font-black flex items-center gap-3">
                    <Trophy className="text-yellow-500" />
                    أوائل المرحلة
                  </h3>
                  <button onClick={() => navigate('/leaderboard')} className="text-xs font-bold" style={{ color: theme.main }}>مشاهدة الكل</button>
               </div>

              <div className="space-y-4 relative z-10">
                  {topStudents.map((s, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center justify-between p-4 bg-white/5 rounded-3xl border border-white/5 hover:border-white/20 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${i === 0 ? 'bg-yellow-500 text-black' : 'bg-white/10 text-gray-400'}`}>
                          {i + 1}
                        </span>
                        <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${s.name}`} className="w-10 h-10 rounded-xl" alt="" />
                        <div className="flex flex-col">
                          <span className="text-sm font-bold group-hover:text-white transition-colors">{s.name}</span>
                          <span className="text-[10px] text-gray-500">طالب متميز</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-white">{s.points}</div>
                        <div className="text-[10px] text-gray-500">نقطة XP</div>
                      </div>
                    </motion.div>
                  ))}
               </div>

               <div className="mt-8 pt-8 border-t border-white/10 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">مركزك الحالي</span>
                    <span className="text-lg font-black" style={{ color: theme.main }}># {userData?.rank || '---'}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">نقاط الـ Streak</span>
                    <div className="flex items-center gap-2 text-orange-500">
                      <Flame size={18} fill="currentColor" />
                      <span className="text-lg font-black">{userData?.streak || 0}</span>
                    </div>
                  </div>
               </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 📚 قسم المحتوى التعليمي (Main Content) */}
      <main className="max-w-[1400px] mx-auto px-6 pb-40">
        
        {/* اختيار الصف الدراسي والفلترة */}
        <div className="flex flex-col gap-10 mb-20">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <h2 className="text-4xl font-black mb-4 flex items-center gap-4">
                <BookOpen style={{ color: theme.main }} />
                المناهج الدراسية
              </h2>
              <div className="flex flex-wrap gap-2">
                {GRADES[educationStage]?.map(g => (
                  <button
                    key={g}
                    onClick={() => setCurrentGrade(g)}
                    className={`px-5 py-2 rounded-2xl text-xs font-bold transition-all border ${currentGrade === g ? 'text-white shadow-lg' : 'bg-white/5 border-white/5 text-gray-400 hover:border-white/20'}`}
                    style={currentGrade === g ? { background: theme.main, borderColor: theme.main } : {}}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/5">
               <div className="flex items-center gap-2 px-4 py-2 bg-black/40 rounded-xl text-xs font-bold">
                 <Filter size={14} className="text-gray-500" />
                 <span className="text-gray-400 ml-2">ترتيب حسب:</span>
                 <select 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent outline-none text-white cursor-pointer"
                 >
                    <option value="latest" className="bg-[#0a0a0a]">الأحدث</option>
                    <option value="popular" className="bg-[#0a0a0a]">الأكثر شعبية</option>
                    <option value="rating" className="bg-[#0a0a0a]">الأعلى تقييماً</option>
                 </select>
               </div>
            </div>

        {educationStage === 'ثانوي' && (
              <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                <button 
                  onClick={() => setBranch('عام')}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${branch === 'عام' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
                >عام</button>
                <button 
                  onClick={() => setBranch('علمي')}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${branch === 'علمي' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
                >علمي</button>
                <button 
                  onClick={() => setBranch('أدبي')}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${branch === 'أدبي' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
                >أدبي</button>
              </div>
            )}
          </div>
        </div>

        {/* تبويبات المواد */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar">
          {SUBJECTS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-shrink-0 px-8 py-4 rounded-3xl text-sm font-bold transition-all ${activeTab === tab ? 'bg-white text-black scale-105 shadow-xl' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* عرض الكورسات */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="h-[450px] bg-white/5 rounded-[40px] animate-pulse" />
            ))}
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            <AnimatePresence mode='popLayout'>
              {filteredCourses.map((course, idx) => (
                <CourseCard key={course.id} course={course} index={idx} />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="flex flex-col items-center justify-center py-40 bg-white/5 rounded-[60px] border border-dashed border-white/10"
          >
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8">
              <AlertCircle size={40} className="text-gray-600" />
            </div>
            <h3 className="text-2xl font-black mb-2 text-white">لا توجد كورسات متاحة حالياً</h3>
            <p className="text-gray-500">جرب تغيير الفلتر أو البحث عن كلمة أخرى</p>
            <button 
              onClick={() => {setSearchTerm(''); setActiveTab('الكل');}}
              className="mt-8 px-8 py-3 bg-white text-black font-bold rounded-2xl hover:scale-105 transition-transform"
            >إعادة ضبط الفلاتر</button>
          </motion.div>
        )}

        {/* 🛠️ قسم الأدوات المساعدة (Smart Tools) */}
        <section className="mt-40 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          <div className="group p-10 bg-gradient-to-br from-purple-500/10 to-transparent backdrop-blur-xl border border-white/5 rounded-[50px] hover:border-purple-500/30 transition-all">
            <div className="w-16 h-16 bg-purple-500 rounded-3xl flex items-center justify-center mb-10 rotate-3 group-hover:rotate-12 transition-transform shadow-2xl shadow-purple-500/20">
              <PenTool size={30} className="text-white" />
            </div>
            <h4 className="text-2xl font-black mb-4">بنك الأسئلة الذكي</h4>
            <p className="text-gray-400 text-sm leading-relaxed mb-8">تدرب على آلاف الأسئلة بنظام MCQ الحديث مع تصحيح فوري وتحليل لنقاط قوتك وضعفك.</p>
            <button className="flex items-center gap-2 font-bold text-purple-400 group-hover:gap-4 transition-all">
              ابدأ الاختبارات الآن <ChevronLeft size={18} />
            </button>
          </div>

          <div className="group p-10 bg-gradient-to-br from-cyan-500/10 to-transparent backdrop-blur-xl border border-white/5 rounded-[50px] hover:border-cyan-500/30 transition-all">
            <div className="w-16 h-16 bg-cyan-500 rounded-3xl flex items-center justify-center mb-10 -rotate-3 group-hover:rotate-6 transition-transform shadow-2xl shadow-cyan-500/20">
              <Monitor size={30} className="text-white" />
            </div>
            <h4 className="text-2xl font-black mb-4">المكتبة الرقمية</h4>
            <p className="text-gray-400 text-sm leading-relaxed mb-8">تحميل الكتب الخارجية، مذكرات المدرسين، وملخصات القوانين بصيغة PDF عالية الجودة.</p>
            <button className="flex items-center gap-2 font-bold text-cyan-400 group-hover:gap-4 transition-all">
              تصفح الملفات <ChevronLeft size={18} />
            </button>
          </div>

          <div className="group p-10 bg-gradient-to-br from-orange-500/10 to-transparent backdrop-blur-xl border border-white/5 rounded-[50px] hover:border-orange-500/30 transition-all">
            <div className="w-16 h-16 bg-orange-500 rounded-3xl flex items-center justify-center mb-10 rotate-6 group-hover:rotate-12 transition-transform shadow-2xl shadow-orange-500/20">
              <Sparkles size={30} className="text-white" />
            </div>
            <h4 className="text-2xl font-black mb-4">مساعد MAFA الذكي</h4>
            <p className="text-gray-400 text-sm leading-relaxed mb-8">لديك سؤال صعب؟ صور السؤال وسيقوم مساعدنا الذكي بشرح الحل لك بالتفصيل في ثوانٍ.</p>
            <button className="flex items-center gap-2 font-bold text-orange-400 group-hover:gap-4 transition-all">
              تحدث مع المساعد <ChevronLeft size={18} />
            </button>
          </div>
        </section>
    </main>

        {/* 🦶 الفوتر (Footer) */}
      <footer className="bg-[#050505] border-t border-white/5 pt-32 pb-10">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20 mb-32">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-8">
                 <div className="p-2 rounded-xl" style={{ background: theme.main }}>
                   <Zap size={24} className="text-white" />
                 </div>
                 <h2 className="text-2xl font-black">MAFA ACADEMY</h2>
              </div>
              <p className="text-gray-500 leading-relaxed mb-10">
                منصة MAFA هي البيت الثاني لكل طالب يبحث عن التميز والنجاح. نستخدم أحدث تقنيات الذكاء الاصطناعي لتوفير تجربة تعليمية فريدة.
              </p>
              <div className="flex gap-4">
                <button className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-colors"><Share2 size={20}/></button>
                <button className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-colors"><MessageSquare size={20}/></button>
                <button className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-colors"><Info size={20}/></button>
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold mb-8 flex items-center gap-2">
                <LayoutDashboard size={18} style={{ color: theme.main }} />
                المراحل الدراسية
              </h4>
              <ul className="space-y-4 text-gray-500 font-medium text-sm">
                <li className="hover:text-white cursor-pointer transition-colors">المرحلة الثانوية</li>
                <li className="hover:text-white cursor-pointer transition-colors">الشهادة الإعدادية</li>
                <li className="hover:text-white cursor-pointer transition-colors">المرحلة الابتدائية</li>
                <li className="hover:text-white cursor-pointer transition-colors">كورسات اللغات</li>
                <li className="hover:text-white cursor-pointer transition-colors">مراجعات ليلة الامتحان</li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-8 flex items-center gap-2">
                <ShieldCheck size={18} style={{ color: theme.main }} />
                سياسات المنصة
              </h4>
              <ul className="space-y-4 text-gray-500 font-medium text-sm">
                <li className="hover:text-white cursor-pointer transition-colors">شروط الاستخدام</li>
                <li className="hover:text-white cursor-pointer transition-colors">سياسة الخصوصية</li>
                <li className="hover:text-white cursor-pointer transition-colors">حقوق الملكية الفكرية</li>
                <li className="hover:text-white cursor-pointer transition-colors">سياسة الاسترجاع</li>
                <li className="hover:text-white cursor-pointer transition-colors">تأمين الحسابات</li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-8 flex items-center gap-2">
                <Headphones size={18} style={{ color: theme.main }} />
                تواصل معنا
              </h4>
              <div className="space-y-6">
                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-white/10 transition-all">
                    <Phone size={20} className="text-gray-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">الخط الساخن</span>
                    <span className="text-sm font-bold">19000 - 01012345678</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-white/10 transition-all">
                    <Mail size={20} className="text-gray-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">الدعم الفني</span>
                    <span className="text-sm font-bold">support@mafa-academy.com</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 text-gray-600 text-xs font-bold">
            <p>© 2026 MAFA ACADEMY. جميع الحقوق محفوظة. تطوير TITo-TEC</p>
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-green-500" />
                <span>مؤمن بواسطة MAFA-PROTECT V3.0</span>
              </div>
              <div className="flex items-center gap-2">
                <UserCheck size={16} className="text-blue-500" />
                <span>معتمد من وزارة التربية والتعليم</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* 🧭 القائمة الجانبية (Sidebar) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[2000]" 
            />
            <motion.aside 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-[400px] bg-[#0a0a0a] border-l border-white/10 z-[2001] p-10 overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center justify-between mb-16">
                 <h2 className="text-2xl font-black">القائمة الرئيسية</h2>
                 <button onClick={() => setIsSidebarOpen(false)} className="p-3 bg-white/5 rounded-xl hover:bg-red-500/20 hover:text-red-500 transition-colors">
                    <X size={20} />
                 </button>
              </div>

              <div className="space-y-12">
                <div className="space-y-3">
                  <p className="text-[10px] text-gray-500 font-black tracking-widest uppercase mb-6">اللوحة الشخصية</p>
                  {[
                    { icon: <LayoutDashboard size={20}/>, label: 'لوحة التحكم', path: '/dashboard' },
                    { icon: <UserCheck size={20}/>, label: 'الملف الشخصي', path: '/profile' },
                    { icon: <Wallet size={20}/>, label: 'المحفظة والعمليات', path: '/wallet' }
                  ].map((item, i) => (
                    <button key={i} className="w-full flex items-center gap-4 p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all text-sm font-bold group">
                      <span className="group-hover:scale-110 transition-transform" style={{ color: theme.main }}>{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] text-gray-500 font-black tracking-widest uppercase mb-6">المواد الدراسية</p>
                  {[
                    { icon: <BookOpen size={20}/>, label: 'دوراتي الحالية', path: '/my-courses' },
                    { icon: <Monitor size={20}/>, label: 'المكتبة الرقمية', path: '/library' },
                    { icon: <PenTool size={20}/>, label: 'بنك الأسئلة', path: '/q-bank' }
                  ].map((item, i) => (
                    <button key={i} className="w-full flex items-center gap-4 p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all text-sm font-bold group">
                      <span className="group-hover:scale-110 transition-transform" style={{ color: theme.main }}>{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="pt-12 border-t border-white/5">
                  <button 
                    onClick={() => auth.signOut()}
                    className="w-full flex items-center gap-4 p-5 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 transition-all hover:text-white text-sm font-black shadow-lg shadow-red-500/10"
                  >
                    <LogOut size={20} /> تسجيل الخروج
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* 💰 مودال المحفظة (Wallet Modal) */}
      <AnimatePresence>
        {walletModal && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center px-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setWalletModal(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl" 
            />
            <motion.div 
              initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 50 }}
              className="relative w-full max-w-xl bg-[#111] border border-white/10 rounded-[50px] p-12 overflow-hidden shadow-2xl"
            >
              {/* زخرفة خلفية */}
              <div className="absolute top-0 right-0 p-10 opacity-5 -z-10">
                <Wallet size={200} style={{ color: theme.main }} />
              </div>

              <div className="flex items-center justify-between mb-12 relative z-10">
                 <h2 className="text-3xl font-black">اشحن محفظتك</h2>
                 <button 
                  onClick={() => setWalletModal(false)} 
                  className="p-3 bg-white/5 rounded-2xl hover:bg-red-500/20 hover:text-red-500 transition-colors"
                 >
                  <X />
                 </button>
              </div>

              <div className="bg-white/5 rounded-[40px] p-8 mb-10 border border-white/5 text-center shadow-inner">
                <p className="text-gray-500 text-sm font-bold mb-2">رصيدك الحالي</p>
                <h3 className="text-5xl font-black text-white">
                  {userData?.balance || 0} <span className="text-xl text-gray-500">ج.م</span>
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-12 relative z-10">
                 <button className="group flex flex-col items-center gap-4 p-8 bg-white/5 rounded-[32px] border border-white/5 hover:border-primary/50 transition-all hover:bg-white/[0.07]">
                    <CreditCard size={32} style={{ color: theme.main }} className="group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-black">بطاقة بنكية</span>
                 </button>
                 <button className="group flex flex-col items-center gap-4 p-8 bg-white/5 rounded-[32px] border border-white/5 hover:border-primary/50 transition-all hover:bg-white/[0.07]">
                    <CloudLightning size={32} style={{ color: theme.main }} className="group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-black">فودافون كاش</span>
                 </button>
                 <button className="group flex flex-col items-center gap-4 p-8 bg-white/5 rounded-[32px] border border-white/5 hover:border-primary/50 transition-all col-span-2 hover:bg-white/[0.07]">
                    <Cpu size={32} style={{ color: theme.main }} className="group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-black">شحن بواسطة كود (سنتر)</span>
                 </button>
              </div>

              <div className="flex items-start gap-4 p-6 bg-yellow-500/5 border border-yellow-500/20 rounded-3xl">
                <Info className="text-yellow-500 shrink-0 mt-1" size={20} />
                <p className="text-[11px] font-bold text-yellow-500/80 leading-relaxed">
                  عند شحن الرصيد، ستتمكن من تفعيل الكورسات فوراً. يرجى التأكد من اختيار وسيلة الدفع المناسبة لك. في حال واجهت مشكلة تواصل مع الدعم الفني للمنصة.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default HighSchool;





