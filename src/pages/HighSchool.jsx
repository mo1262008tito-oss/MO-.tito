import React, { useState, useEffect, useRef, useMemo } from 'react';
import { db, auth, rtdb } from '../firebase';
import { 
  collection, getDocs, query, orderBy, limit, doc, onSnapshot, getDoc,
  updateDoc, increment, serverTimestamp, writeBatch 
} from 'firebase/firestore';
import { ref, set, onDisconnect } from "firebase/database";
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { 
  GraduationCap, BookOpen, PlayCircle, Shield, 
  ChevronLeft, Star, Search, Filter, Sparkles,
  Clock, Award, Flame, Zap, Trophy, Wallet, 
  PlusCircle, CheckCircle2, AlertCircle, Menu, X, 
  MessageSquare, Info, Lock, BarChart3, ArrowRightCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import './HighSchool.css'; 

const HighSchool = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [rechargeCode, setRechargeCode] = useState('');
  const [studentNote, setStudentNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // حالات الفلترة الجديدة
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [sortBy, setSortBy] = useState('latest');

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  const educationLevels = [
    { id: 'all', label: 'الكل' },
    { id: 'primary', label: 'الابتدائي' },
    { id: 'prep', label: 'الإعدادي' },
    { id: 'secondary', label: 'الثانوي' },
    { id: 'reviews', label: 'مراجعات' }
  ];

  // --- 1. نظام الحماية والرادار ---
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const presenceRef = ref(rtdb, `status/${user.uid}`);
    set(presenceRef, { state: 'online', last_changed: serverTimestamp(), name: user.displayName || 'طالب' });
    onDisconnect(presenceRef).set({ state: 'offline', last_changed: serverTimestamp() });

    const unsubUser = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.status === 'LOCKED') {
          auth.signOut();
          navigate('/login?error=account_locked');
        }
        setUserData({ id: snap.id, ...data });
        setStudentNote(data.personalNotes || '');
      }
    });

    const handleKeyDown = (e) => {
      if (e.ctrlKey && (e.key === 'u' || e.key === 'i' || e.key === 'j')) {
        e.preventDefault();
        alert("نظام تيتان: محاولة وصول غير مصرح بها.");
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unsubUser();
      set(presenceRef, { state: 'offline' });
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate]);

  // --- 2. جلب المحتوى والفلترة الذكية ---
  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "courses_metadata"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setCourses(fetched);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchContent();
  }, []);

  // محرك الفلترة (يحدث تلقائياً عند تغيير البحث أو المرحلة)
  useEffect(() => {
    let result = [...courses];
    if (selectedLevel !== 'all') {
      result = result.filter(c => c.level === selectedLevel);
    }
    if (searchTerm) {
      result = result.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    setFilteredCourses(result);
  }, [selectedLevel, searchTerm, courses]);

  // --- 3. العمليات (شحن وحفظ) ---
  const handleRecharge = async () => {
    if (!rechargeCode || isProcessing) return;
    setIsProcessing(true);
    try {
      const codeRef = doc(db, "prepaid_codes", rechargeCode);
      const codeSnap = await getDoc(codeRef);
      if (!codeSnap.exists() || codeSnap.data().isUsed) throw new Error("الكود غير صالح");

      const batch = writeBatch(db);
      batch.update(doc(db, "users", auth.currentUser.uid), {
        balance: increment(codeSnap.data().amount),
        points: increment(50)
      });
      batch.update(codeRef, { isUsed: true, usedBy: auth.currentUser.uid });
      await batch.commit();
      alert("تم الشحن بنجاح!");
      setShowWalletModal(false);
    } catch (e) { alert(e.message); }
    finally { setIsProcessing(false); }
  };

  const saveNote = async () => {
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), { personalNotes: studentNote });
      alert("تم الحفظ بالسحابة ☁️");
    } catch (e) { alert("فشل الحفظ"); }
  };

  if (loading) return <div className="mafa-loading-screen"><Zap className="spin-icon" /></div>;

  return (
    <div className="edu-portal-root rtl" onContextMenu={e => e.preventDefault()}>
      <motion.div className="scroll-progress-bar" style={{ scaleX }} />

      {/* العلامة المائية */}
      <div className="security-layer">
        <motion.div animate={{ x: [0, 200, 0], y: [0, 100, 0] }} transition={{ duration: 15, repeat: Infinity }} className="watermark-text">
          {userData?.name} - {userData?.phone}
        </motion.div>
      </div>

      <header className="portal-header glass">
        <div className="header-left">
          <Menu size={24} onClick={() => setIsSidebarOpen(true)} />
          <div className="brand"><Zap size={28} /> <span>TITAN v2.0</span></div>
        </div>
        <div className="header-actions">
          <div className="wallet-action" onClick={() => setShowWalletModal(true)}>
            <Wallet size={18} /> <span>{userData?.balance || 0} ج.م</span>
          </div>
          <img className="user-avatar" src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userData?.name}`} alt="avatar" />
        </div>
      </header>

      <main className="portal-content">
        {/* البانر الترحيبي */}
        <section className="hero-banner-v4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hero-welcome-card glass-premium">
            <div className="streak-pill"><Flame size={18} /> {userData?.streak || 0} يوم حماس</div>
            <h1>مرحباً، <span className="name-gradient">{userData?.name}</span></h1>
            <div className="search-box-v2">
              <Search />
              <input type="text" placeholder="ماذا تريد أن تتعلم اليوم؟" onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="stats-row">
              <div className="stat-unit"><Zap /><span className="val">{userData?.points}</span><span className="lab">نقطة</span></div>
              <div className="stat-unit"><Trophy /><span className="val">#{userData?.rank || '--'}</span><span className="lab">ترتيبي</span></div>
            </div>
          </motion.div>
        </section>

        {/* تصفية المراحل الدراسية */}
        <div className="discovery-header">
          <div className="levels-pills">
            {educationLevels.map((level) => (
              <button key={level.id} className={`pill-btn ${selectedLevel === level.id ? 'active' : ''}`} onClick={() => setSelectedLevel(level.id)}>
                {level.label}
              </button>
            ))}
          </div>
        </div>

        {/* شبكة المحاضرات */}
        <section className="courses-section">
          <div className="filters-row">
            <h3>المحاضرات المتاحة ({filteredCourses.length})</h3>
            <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="latest">الأحدث</option>
              <option value="rating">الأعلى تقييماً</option>
            </select>
          </div>

          <div className="courses-grid">
            <AnimatePresence mode="popLayout">
              {filteredCourses.map((course) => (
                <motion.div layout initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} key={course.id} className="course-card-v4 glass-card" onClick={() => navigate(`/course/${course.id}`)}>
                  <div className="card-thumb">
                    <img src={course.thumbnail} alt="" />
                    <div className="level-badge">{course.grade}</div>
                    {course.isLocked && <div className="lock-overlay"><Lock /></div>}
                  </div>
                  <div className="card-content">
                    <h3>{course.title}</h3>
                    <div className="prog-container">
                      <div className="prog-bar-bg"><div className="prog-bar-fill" style={{ width: `${course.progress}%` }} /></div>
                    </div>
                    <button className="enroll-btn-v2">استكمال التعلم <ArrowRightCircle size={18}/></button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>

        {/* الإحصائيات والمفكرة */}
        <div className="dashboard-footer-grid">
          <section className="analytics-dashboard glass">
            <h3><BarChart3 /> نشاطك التعليمي</h3>
            <div className="analytics-card">
              <span>نسبة الإنجاز</span>
              <div className="mini-progress"><div className="fill" style={{width: '68%'}}></div></div>
            </div>
          </section>

          <section className="student-notes-section glass">
            <h3><MessageSquare /> المفكرة الشخصية</h3>
            <textarea value={studentNote} onChange={(e) => setStudentNote(e.target.value)} placeholder="دون ملاحظاتك هنا..." />
            <button className="save-note-btn" onClick={saveNote}>حفظ التغييرات</button>
          </section>
        </div>
      </main>

      {/* مودال الشحن */}
      <AnimatePresence>
        {showWalletModal && (
          <div className="modal-overlay">
            <motion.div initial={{ y: 50 }} animate={{ y: 0 }} className="wallet-modal glass">
              <X className="close-modal" onClick={() => setShowWalletModal(false)} />
              <h3>شحن المحفظة</h3>
              <input type="text" placeholder="أدخل الكود هنا" onChange={(e) => setRechargeCode(e.target.value)} />
              <button onClick={handleRecharge} disabled={isProcessing}>تفعيل الآن</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="portal-footer-v2 glass">
        <p>جميع الحقوق محفوظة &copy; 2026 | تطوير TITAN-SYSTEM</p>
        <div className="f-socials"><Shield size={18} /> <Lock size={18} /></div>
      </footer>
    </div>
  );
};

export default HighSchool;
