import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap, BookOpen, PlayCircle, Shield, 
  ChevronLeft, Star, Users, Layout, Search, Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import './HighSchool.css';

const HighSchool = () => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('الكل');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // 1. جلب البيانات من الفايربيس مع الحماية
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        // جلب كافة الكورسات التي تندرج تحت تصنيف الثانوي
        const q = query(collection(db, "courses_metadata"));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // تصفية الكورسات لتشمل فقط مراحل الثانوي
        const hsData = data.filter(c => 
          c.category?.includes("ثانوي") || 
          ["1 ثانوي", "2 ثانوي", "3 ثانوي"].includes(c.category)
        );

        setCourses(hsData);
        setFilteredCourses(hsData);
        setLoading(false);
      } catch (error) {
        console.error("Error:", error);
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  // 2. نظام الفلترة الذكي
  useEffect(() => {
    let result = courses;
    if (activeTab !== 'الكل') {
      result = result.filter(c => c.category === activeTab);
    }
    if (searchTerm) {
      result = result.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    setFilteredCourses(result);
  }, [activeTab, searchTerm, courses]);

  if (loading) return (
    <div className="hs-loader">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
        <GraduationCap size={50} color="#00f2ff" />
      </motion.div>
      <p>جاري تجهيز المناهج الثانوية...</p>
    </div>
  );

  return (
    <div className="hs-root no-select rtl" onContextMenu={e => e.preventDefault()}>
      {/* 🛡️ علامة مائية لحماية حقوقك */}
      <div className="hs-watermark">{auth.currentUser?.email} | MAFA-SECURE</div>

      {/* 🔝 الهيدر السينمائي */}
      <header className="hs-hero glass">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="hero-content"
        >
          <div className="badge"><Shield size={14}/> محتوى محمي وحصري</div>
          <h1>بوابة التعليم الثانوي <span className="neon-text">المطورة</span></h1>
          <p>تعلم بذكاء، تفوق بمتعة. كل ما تحتاجه من محاضرات واختبارات في مكان واحد.</p>
          
          <div className="search-box-v2 glass">
             <Search size={20} />
             <input 
               type="text" 
               placeholder="ابحث عن مادة أو مدرس..." 
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
        </motion.div>
      </header>

      {/* 📑 شريط التنقل بين الصفوف */}
      <nav className="hs-tabs glass">
        {['الكل', '1 ثانوي', '2 ثانوي', '3 ثانوي'].map((tab) => (
          <button 
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* 🗂️ شبكة الكورسات */}
      <main className="hs-main">
        <div className="courses-grid">
          <AnimatePresence>
            {filteredCourses.length > 0 ? filteredCourses.map((course, index) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.1 }}
                key={course.id} 
                className="hs-card glass-card"
                onClick={() => navigate(`/course/${course.id}`)}
              >
                <div className="card-thumb">
                  <img src={course.thumbnail || 'https://via.placeholder.com/400x225'} alt={course.title} />
                  <div className="overlay-play"><PlayCircle size={50} /></div>
                  <div className="category-tag">{course.category}</div>
                </div>
                
                <div className="card-info">
                  <h3>{course.title}</h3>
                  <div className="instructor-line">
                    <Users size={14} /> <span>{course.instructor || "مدرس المادة"}</span>
                  </div>
                  <div className="card-stats">
                    <span><BookOpen size={14}/> {course.lessons?.length || 0} درس</span>
                    <span><Star size={14} color="#ffd700"/> 4.9</span>
                  </div>
                  <button className="hs-enter-btn">
                    ابدأ التعلم الآن <ChevronLeft size={18} />
                  </button>
                </div>
              </motion.div>
            )) : (
              <div className="no-courses glass">
                <Layout size={40} />
                <p>لا توجد كورسات متاحة حالياً في هذا القسم.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* footer بسيط */}
      <footer className="hs-footer">
        <p>© 2026 منصة Mafa التعليمية - جميع الحقوق محفوظة</p>
      </footer>
    </div>
  );
};

export default HighSchool;

