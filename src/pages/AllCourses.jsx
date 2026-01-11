import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { 
  collection, onSnapshot, doc, updateDoc, arrayUnion, 
  increment, query, orderBy, getDoc, serverTimestamp 
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import {  
  Search, BookOpen, User, PlayCircle, Layout, Heart,
  Lock, Zap, Clock, Library, ChevronLeft, Unlock, Wallet,
  Eye, Star, FileText, Share2, Info, CheckCircle2
} from 'lucide-react';
import './AllCourses.css';

const AllCourses = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentLevel, setCurrentLevel] = useState('ثانوي'); 
  const [activeGrade, setActiveGrade] = useState('الكل');
  const [viewMode, setViewMode] = useState('courses'); 
  
  const [courses, setCourses] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [showPreview, setShowPreview] = useState({ show: false, url: '', title: '' });

  const gradeOptions = {
    'ابتدائي': ['1 ابتدائي', '2 ابتدائي', '3 ابتدائي', '4 ابتدائي', '5 ابتدائي', '6 ابتدائي'],
    'اعدادي': ['1 اعدادي', '2 اعدادي', '3 اعدادي'],
    'ثانوي': ['1 ثانوي', '2 ثانوي', '3 ثانوي']
  };

  useEffect(() => {
    const unsubCourses = onSnapshot(query(collection(db, "courses_metadata"), orderBy("createdAt", "desc")), (snap) => {
      setCourses(snap.docs.map(d => ({ id: d.id, type: 'course', ...d.data() })));
    });

    const unsubBooks = onSnapshot(query(collection(db, "library_books"), orderBy("createdAt", "desc")), (snap) => {
      setBooks(snap.docs.map(d => ({ id: d.id, type: 'book', ...d.data() })));
    });

    if (auth.currentUser) {
      const unsubUser = onSnapshot(doc(db, "users", auth.currentUser.uid), (snap) => {
        if (snap.exists()) {
          setUser(snap.data());
          setWishlist(snap.data().wishlist || []);
        }
      });
      setLoading(false);
      return () => { unsubCourses(); unsubBooks(); unsubUser(); };
    }
    setLoading(false);
  }, []);

  // 1. إضافة للمفضلة
  const toggleWishlist = async (e, itemId) => {
    e.stopPropagation();
    const isAdded = wishlist.includes(itemId);
    await updateDoc(doc(db, "users", auth.currentUser.uid), {
      wishlist: isAdded ? wishlist.filter(id => id !== itemId) : arrayUnion(itemId)
    });
  };

  // 2. شراء سريع مطور (مع تسجيل عملية الشراء للأدمن)
  const handlePurchase = async (item) => {
    const price = parseInt(item.price);
    if ((user?.walletBalance || 0) < price) {
      return alert("رصيدك غير كافٍ، توجه لصفحة الشحن.");
    }

    if (window.confirm(`تأكيد شراء "${item.title}" بمبلغ ${price} ج.م؟`)) {
      try {
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
          walletBalance: increment(-price),
          enrolledContent: arrayUnion(item.id),
          transactions: arrayUnion({
            id: Date.now(),
            title: `شراء كورس: ${item.title}`,
            amount: -price,
            date: new Date().toISOString()
          })
        });
        alert("تم تفعيل الكورس! ابدأ المذاكرة الآن.");
      } catch (err) { alert("خطأ في العملية"); }
    }
  };

  const getFilteredItems = () => {
    const list = viewMode === 'courses' ? courses : books;
    return list.filter(item => 
      item.level === currentLevel && 
      (activeGrade === 'الكل' || item.grade === activeGrade) &&
      item.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return (
    <div className="all-courses-nebula">
      
      {/* هيدر المتجر المتطور */}
      <header className="store-header glass">
        <div className="header-main">
          <div className="user-stats">
            <div className="stat-item"><Wallet color="#fbbf24"/> {user?.walletBalance || 0} ج.م</div>
            <div className="stat-item"><Zap color="#f59e0b"/> {user?.points || 0} XP</div>
          </div>
          <h1>مكتبة المعرفة الحديثة</h1>
          <button className="back-dash" onClick={() => navigate('/dashboard')}>
            لوحتي <Layout size={18}/>
          </button>
        </div>
        
        {/* نظام الفرز الذكي */}
        <div className="filter-system">
           <div className="level-pills">
             {['ابتدائي', 'اعدادي', 'ثانوي'].map(l => (
               <button key={l} className={currentLevel === l ? 'active' : ''} onClick={() => setCurrentLevel(l)}>{l}</button>
             ))}
           </div>
           <div className="search-box">
             <Search size={18}/>
             <input placeholder="ابحث عن درس، مذكرة، مراجعة..." onChange={(e) => setSearchTerm(e.target.value)} />
           </div>
        </div>
      </header>

      <main className="store-grid-container">
        <div className="view-selector">
          <button className={viewMode === 'courses' ? 'active' : ''} onClick={() => setViewMode('courses')}>
            <PlayCircle size={18}/> الكورسات التعليمية
          </button>
          <button className={viewMode === 'library' ? 'active' : ''} onClick={() => setViewMode('library')}>
            <FileText size={18}/> بنك المذكرات (PDF)
          </button>
        </div>

        <div className="items-grid">
          <AnimatePresence>
            {getFilteredItems().map((item) => {
              const isEnrolled = user?.enrolledContent?.includes(item.id);
              const isFree = !item.price || item.price === "0";
              const inWishlist = wishlist.includes(item.id);

              return (
                <motion.div 
                  layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  key={item.id} className={`item-card ${isEnrolled ? 'owned' : ''}`}
                >
                  <div className="card-media">
                    <img src={item.thumbnail} alt={item.title} />
                    <button className={`wish-btn ${inWishlist ? 'active' : ''}`} onClick={(e) => toggleWishlist(e, item.id)}>
                      <Heart fill={inWishlist ? "#ff4757" : "none"} />
                    </button>
                    {item.isBestSeller && <div className="hot-tag">الأكثر طلباً 🔥</div>}
                  </div>

                  <div className="card-content">
                    <div className="item-meta">
                      <span className="grade-tag">{item.grade}</span>
                      <div className="rating"><Star size={12} fill="#ffb800"/> 4.9</div>
                    </div>
                    <h3>{item.title}</h3>
                    
                    <div className="card-footer">
                      <div className="price-info">
                        {isFree ? <span className="free">مجاني</span> : <span className="price">{item.price} ج.م</span>}
                      </div>
                      
                      {isEnrolled ? (
                        <button className="go-btn" onClick={() => navigate(`/video-player/${item.id}`)}>
                          استمرار <ChevronLeft size={16}/>
                        </button>
                      ) : (
                        <div className="action-btns">
                           {!isFree && (
                             <button className="preview-btn" title="معاينة" onClick={() => setShowPreview({show: true, url: item.previewUrl, title: item.title})}>
                               <Eye size={18}/>
                             </button>
                           )}
                           <button className="buy-btn" onClick={() => handlePurchase(item)}>
                             {isFree ? 'إضافة' : 'شراء'}
                           </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </main>

      {/* مودال المعاينة (Preview Modal) */}
      {showPreview.show && (
        <div className="preview-overlay" onClick={() => setShowPreview({show:false})}>
          <motion.div className="preview-modal" initial={{scale:0.9}} animate={{scale:1}} onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h4>معاينة: {showPreview.title}</h4>
              <button onClick={() => setShowPreview({show:false})}><X/></button>
            </div>
            <iframe src={showPreview.url} width="100%" height="400px" allowFullScreen></iframe>
            <p className="hint">هذا الفيديو للمعاينة فقط، اشترك لمشاهدة الكورس كاملاً.</p>
          </motion.div>
        </div>
      )}

    </div>
  );
};

export default AllCourses;
