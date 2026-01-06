import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap, BookOpen, PlayCircle, Shield, 
  ChevronLeft, Star, Users, Layout, Search, Filter,
  Clock, Award, Flame, Zap, BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import './HighSchool.css';

const HighSchool = () => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('الكل');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('latest'); // latest, popular, lessons
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const q = query(collection(db, "courses_metadata"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          progress: Math.floor(Math.random() * 100) // قيمة تجريبية - يمكن ربطها ببيانات المستخدم لاحقاً
        }));
        
        // تصفية ذكية للمراحل الدراسية
        const hsData = data.filter(c => 
          c.grade?.includes("ثانوي") || 
          c.category?.includes("ثانوي")
        );

        setCourses(hsData);
        setFilteredCourses(hsData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching courses:", error);
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  // محرك البحث والفلترة المطور
  useEffect(() => {
    let result = [...courses];

    if (activeTab !== 'الكل') {
      result = result.filter(c => c.grade === activeTab || c.category === activeTab);
    }

    if (searchTerm) {
      result = result.filter(c => 
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.instructor?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // نظام الترتيب
    if (sortBy === 'lessons') {
      result.sort((a, b) => (b.lessons?.length || 0) - (a.lessons?.length || 0));
    }

    setFilteredCourses(result);
  }, [activeTab, searchTerm, courses, sortBy]);

  if (loading) return (
    <div className="hs-loader-overlay">
      <div className="loader-content">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }} 
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Zap size={60} color="#00f2ff" fill="#00f2ff" />
        </motion.div>
        <h2 className="loading-text">جاري تحميل مستقبلك...</h2>
      </div>
    </div>
  );

  return (
    <div className="hs-viewport rtl" onContextMenu={e => e.preventDefault()}>
      
      {/* 🔒 حماية المحتوى الديناميكية */}
      <div className="digital-watermark">
        <span>{auth.currentUser?.email}</span>
        <span>{new Date().toLocaleDateString()}</span>
      </div>

      {/* 🚀 Hero Section */}
      <section className="hs-hero-v3">
        <div className="hero-grid-bg"></div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="hero-main-card glass"
        >
          <div className="hero-info">
            <span className="live-badge"><Flame size={14}/> مباشر الآن</span>
            <h1>أكاديمية <span className="text-gradient">تيتو</span> للفيزياء</h1>
            <p>انضم لـ {courses.length * 120}+ طالب يتفوقون يومياً باستخدام أحدث طرق الشرح التفاعلي.</p>
            
            <div className="hero-stats">
              <div className="h-stat"><BarChart3 size={18}/> <span>{courses.length} كورس</span></div>
              <div className="h-stat"><Users size={18}/> <span>دعم 24/7</span></div>
              <div className="h-stat"><Award size={18}/> <span>شهادات معتمدة</span></div>
            </div>
          </div>

          <div className="search-bar-premium">
            <Search className="s-icon" />
            <input 
              type="text" 
              placeholder="ابحث عن محاضرة، مادة، أو شهر معين..." 
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="filter-dropdown">
               <Filter size={18} />
               <select onChange={(e) => setSortBy(e.target.value)}>
                  <option value="latest">الأحدث</option>
                  <option value="lessons">الأكثر دروساً</option>
               </select>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 💠 Navigation Tabs */}
      <nav className="hs-navigation-bar">
        {['الكل', '1 ثانوي', '2 ثانوي', '3 ثانوي'].map((tab) => (
          <button 
            key={tab}
            className={`nav-item ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {activeTab === tab && <motion.div layoutId="nav-bg" className="nav-bg" />}
            <span className="nav-text">{tab}</span>
          </button>
        ))}
      </nav>

      {/* 📚 Course Grid */}
      <main className="hs-container">
        <div className="grid-header">
          <h3><BookOpen size={20} color="#00f2ff"/> المناهج المتاحة ({filteredCourses.length})</h3>
        </div>

        <div className="premium-grid">
          <AnimatePresence>
            {filteredCourses.map((course, index) => (
              <motion.div 
                key={course.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -10 }}
                className="course-card-v3"
                onClick={() => navigate(`/course/${course.id}`)}
              >
                <div className="card-top">
                  <img src={course.thumbnail || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=400'} alt="" />
                  <div className="card-badge">{course.grade || course.category}</div>
                  <div className="play-btn-circle"><PlayCircle fill="#00f2ff" color="#000" size={40} /></div>
                </div>

                <div className="card-body">
                  <h3 className="course-title">{course.title}</h3>
                  <div className="instructor">
                    <div className="avatar">M</div>
                    <span>{course.instructor || "أ. محمود فرج"}</span>
                  </div>

                  {/* شريط التقدم */}
                  <div className="progress-container">
                    <div className="progress-labels">
                      <span>الإنجاز</span>
                      <span>{course.progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${course.progress}%` }}
                        className="progress-fill" 
                      />
                    </div>
                  </div>

                  <div className="card-footer">
                    <div className="footer-item"><Clock size={14}/> <span>{course.duration || '12h'}</span></div>
                    <div className="footer-item"><LayoutDashboard size={14}/> <span>{course.lessons?.length || 0} درس</span></div>
                    <button className="enter-btn">دخول <ChevronLeft size={16}/></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredCourses.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon"><Search size={50}/></div>
            <h3>لا توجد نتائج تطابق بحثك</h3>
            <p>جرب كلمات بحث أخرى أو غير القسم المختار</p>
          </div>
        )}
      </main>

      <footer className="modern-footer">
         <div className="footer-blur"></div>
         <p>تم التطوير بواسطة <b>TITO TECH</b> &copy; 2026</p>
         <div className="footer-links">
            <span>سياسة الخصوصية</span>
            <span>الدعم الفني</span>
         </div>
      </footer>
    </div>
  );
};

export default HighSchool;

