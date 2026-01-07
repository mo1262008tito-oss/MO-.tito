
import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap, BookOpen, PlayCircle, Shield, 
  ChevronLeft, Star, Users, Layout, Search, Filter,
  Clock, Award, Flame, Zap, BarChart3, LayoutDashboard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import './HighSchool.css';

// تم تعديل الاسم هنا ليطابق التصدير في الأسفل واسم الملف
const HighSchool = () => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('الكل'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('latest'); 
  const navigate = useNavigate();

  // جلب البيانات من Firebase
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const q = query(collection(db, "courses_metadata"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          progress: Math.floor(Math.random() * 60) + 10 
        }));
        
        setCourses(data);
        setFilteredCourses(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching courses:", error);
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  // محرك البحث والفلترة
  useEffect(() => {
    let result = [...courses];

    if (activeTab !== 'الكل') {
      result = result.filter(c => 
        c.grade?.includes(activeTab) || 
        c.category?.includes(activeTab)
      );
    }

    if (searchTerm) {
      result = result.filter(c => 
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.instructor?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sortBy === 'lessons') {
      result.sort((a, b) => (b.lessons?.length || 0) - (a.lessons?.length || 0));
    }

    setFilteredCourses(result);
  }, [activeTab, searchTerm, courses, sortBy]);

  if (loading) return (
    <div className="edu-loader-overlay">
      <div className="loader-content">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }} 
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Zap size={60} color="#00f2ff" fill="#00f2ff" />
        </motion.div>
        <h2 className="loading-text">جاري تجهيز الفصول الدراسية...</h2>
      </div>
    </div>
  );

  return (
    <div className="edu-viewport rtl" onContextMenu={e => e.preventDefault()}>
      
      <div className="digital-watermark">
        <span>{auth.currentUser?.email || 'Guest User'}</span>
        <span>{new Date().toLocaleDateString()} - MAFA TEC</span>
      </div>

      <section className="edu-hero-v3">
        <div className="hero-grid-bg"></div>
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="hero-main-card glass"
        >
          <div className="hero-info">
            <span className="live-badge"><Flame size={14}/> متاح الآن لجميع المراحل</span>
            <h1>أكاديمية <span className="text-gradient">MAFA-TEC</span> التعليمية</h1>
            <p>منصة متكاملة تشمل (الابتدائي، الإعدادي، والثانوي) بأحدث تقنيات التعلم عن بعد.</p>
            
            <div className="hero-stats">
              <div className="h-stat"><BarChart3 size={18}/> <span>{filteredCourses.length} منهج متاح</span></div>
              <div className="h-stat"><Users size={18}/> <span>دعم تعليمي 24/7</span></div>
              <div className="h-stat"><Award size={18}/> <span>تقارير أداء شهرية</span></div>
            </div>
          </div>

          <div className="search-bar-premium">
            <Search className="s-icon" />
            <input 
              type="text" 
              placeholder="ابحث عن مادة، مدرس، أو صف دراسي..." 
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

      <nav className="edu-navigation-bar">
        {['الكل', 'ابتدائي', 'اعدادي', 'ثانوي'].map((tab) => (
          <button 
            key={tab}
            className={`nav-item ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {activeTab === tab && <motion.div layoutId="nav-bg" className="nav-bg" />}
            <span className="nav-text">{tab === 'الكل' ? 'كافة المراحل' : `قسم ال${tab}`}</span>
          </button>
        ))}
      </nav>

      <main className="edu-container">
        <div className="grid-header">
          <h3><BookOpen size={22} color="#00f2ff"/> المناهج الدراسية ({filteredCourses.length})</h3>
        </div>

        <div className="premium-grid">
          <AnimatePresence mode='popLayout'>
            {filteredCourses.map((course) => (
              <motion.div 
                key={course.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                whileHover={{ y: -10 }}
                className="course-card-v3"
                onClick={() => navigate(`/course/${course.id}`)}
              >
                <div className="card-top">
                  <img src={course.thumbnail || 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=400'} alt={course.title} />
                  <div className="card-badge">{course.grade || course.category}</div>
                  <div className="play-btn-circle"><PlayCircle fill="#00f2ff" color="#000" size={45} /></div>
                </div>

                <div className="card-body">
                  <h3 className="course-title">{course.title}</h3>
                  <div className="instructor">
                    <div className="avatar">{course.instructor ? course.instructor[0] : 'M'}</div>
                    <span>{course.instructor || "أ. محمود فرج"}</span>
                  </div>

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
                    <div className="footer-item"><Clock size={14}/> <span>{course.duration || 'مفتوح'}</span></div>
                    <div className="footer-item"><LayoutDashboard size={14}/> <span>{course.lessons?.length || 0} درس</span></div>
                    <button className="enter-btn">ابدأ الآن <ChevronLeft size={16}/></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredCourses.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon"><Search size={80} opacity={0.2}/></div>
            <h3>لم يتم إضافة مناهج لهذا القسم بعد</h3>
            <p>نعمل حالياً على توفير أقوى المحتويات التعليمية لهذا القسم، انتظرونا قريباً!</p>
          </div>
        )}
      </main>

      <footer className="modern-footer">
          <div className="footer-blur"></div>
          <p>تم التطوير بواسطة <b>TITO TECH</b> &copy; 2026</p>
          <div className="footer-links">
            <span>اتصل بنا</span>
            <span>عن الأكاديمية</span>
            <span>الشروط والأحكام</span>
          </div>
      </footer>
    </div>
  );
};

export default HighSchool;
﻿



