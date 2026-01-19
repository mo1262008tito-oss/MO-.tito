import React, { useState, useEffect, useMemo, useRef } from 'react';
import { db, auth } from '../firebase';
import { 
  collection, onSnapshot, query, where, orderBy, 
  doc, getDoc, updateDoc, increment, arrayUnion, arrayRemove 
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, BookOpen, FileText, DownloadCloud, Eye, 
  Star, Clock, Library as LibIcon, X, ChevronLeft, 
  Bookmark, Share2, Info, CheckCircle2, Filter, 
  HardDrive, Layers, Globe, ArrowDownToLine, BookmarkPlus
} from 'lucide-react';
import './Library.css';

/**
 * Modern Library Component v5.0
 * يتميز بنظام فلترة مزدوج، معاينة ثلاثية الأبعاد، وربط حي مع Firestore
 */

const Library = () => {
  // --- 1. State Management (الحالات) ---
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('الكل');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [userFavorites, setUserFavorites] = useState([]);
  const [isReadingMode, setIsReadingMode] = useState(false);
  
  const scrollRef = useRef(null);

  // --- 2. Firebase Real-time Sync (مزامنة البيانات) ---
  useEffect(() => {
    setLoading(true);
    const booksRef = collection(db, 'library');
    
    // استعلام ذكي: إذا كان الفلتر 'الكل' لا نضع شرطاً
    const q = activeFilter === 'الكل' 
      ? query(booksRef, orderBy('createdAt', 'desc')) 
      : query(booksRef, where('category', '==', activeFilter), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // قيم افتراضية في حال نقص البيانات من المصدر
        pages: doc.data().pages || 'غير محدد',
        rating: doc.data().rating || 5.0,
        size: doc.data().size || 'MB 2.0',
        downloads: doc.data().downloads || 0,
        coverImage: doc.data().coverImage || 'https://via.placeholder.com/300x450?text=No+Cover'
      }));
      
      setBooks(data);
      setLoading(false);
    }, (error) => {
      console.error("Firebase Sync Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeFilter]);

  // جلب مفضلات المستخدم
  useEffect(() => {
    if (!auth.currentUser) return;
    const userRef = doc(db, 'students', auth.currentUser.uid);
    const unsub = onSnapshot(userRef, (doc) => {
      if (doc.exists()) setUserFavorites(doc.data().favorites || []);
    });
    return () => unsub();
  }, []);

  // --- 3. Business Logic (المنطق البرمجي) ---
  
  // البحث المتقدم والفلترة البرمجية
  const filteredResults = useMemo(() => {
    return books.filter(book => {
      const searchContent = `${book.title} ${book.author} ${book.description}`.toLowerCase();
      return searchContent.includes(searchQuery.toLowerCase());
    });
  }, [books, searchQuery]);

  // معالجة التحميل وزيادة العداد
  const handleDownload = async (book) => {
    try {
      if (!book.fileUrl) throw new Error("الملف غير متوفر");
      window.open(book.fileUrl, '_blank');
      const bookRef = doc(db, 'library', book.id);
      await updateDoc(bookRef, { downloads: increment(1) });
    } catch (err) {
      alert(err.message);
    }
  };

  // تبديل حالة المفضلة
  const toggleFavorite = async (bookId) => {
    if (!auth.currentUser) return alert("يرجى تسجيل الدخول أولاً");
    const userRef = doc(db, 'students', auth.currentUser.uid);
    const isFav = userFavorites.includes(bookId);
    
    await updateDoc(userRef, {
      favorites: isFav ? arrayRemove(bookId) : arrayUnion(bookId)
    });
  };

  const shareBook = (book) => {
    const shareData = {
      title: book.title,
      text: `تحميل كتاب ${book.title} من منصة التعليم`,
      url: window.location.href
    };
    if (navigator.share) navigator.share(shareData);
    else {
      navigator.clipboard.writeText(window.location.href);
      alert("تم نسخ رابط المكتبة");
    }
  };

  // --- 4. Sub-Components (المكونات الفرعية) ---

  const BookCard = ({ book, index }) => (
    <motion.div 
      layoutId={`book-${book.id}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="modern-book-card glass"
      onClick={() => setSelectedBook(book)}
    >
      <div className="book-cover-container">
        <img src={book.coverImage} alt={book.title} loading="lazy" />
        <div className="card-actions-overlay">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`fav-btn ${userFavorites.includes(book.id) ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); toggleFavorite(book.id); }}
          >
            <BookmarkPlus size={18} />
          </motion.button>
          <button className="preview-btn"><Eye size={18} /> معاينة</button>
        </div>
        <div className="format-tag">PDF</div>
      </div>
      
      <div className="book-content">
        <div className="content-header">
          <span className="cat-label">{book.category}</span>
          <div className="rating-tag"><Star size={12} fill="currentColor" /> {book.rating}</div>
        </div>
        <h3 className="book-title">{book.title}</h3>
        <p className="book-author">{book.author || 'إدارة المنصة'}</p>
        
        <div className="book-footer-stats">
          <span><FileText size={14} /> {book.pages} ص</span>
          <span><HardDrive size={14} /> {book.size}</span>
          <span><DownloadCloud size={14} /> {book.downloads}</span>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="modern-library-root">
      {/* 1. الهيدر التفاعلي */}
      <header className="library-hero glass">
        <div className="hero-inner">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="hero-badge"
          >
            <LibIcon size={16} /> مكتبة المستقبل الرقمية
          </motion.div>
          <h1>بوابتك نحو <span className="text-gradient">المعرفة اللامحدودة</span></h1>
          <p>تصفح وحمل مئات الكتب والملخصات التقنية والدراسية مجاناً وبأعلى جودة.</p>
          
          <div className="search-wrapper glass-heavy">
            <Search className="search-icon" />
            <input 
              type="text" 
              placeholder="عن ماذا تبحث اليوم؟ (اسم الكتاب، المؤلف...)" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <kbd className="search-kbd">⌘ K</kbd>
          </div>
        </div>
        <div className="hero-bg-decoration"></div>
      </header>

      {/* 2. نظام التصفية */}
      <nav className="filter-system">
        <div className="filter-scroll">
          {['الكل', 'كتب دراسية', 'ملخصات برمجية', 'علوم دينية', 'تنمية ذاتية', 'أبحاث'].map(cat => (
            <button 
              key={cat}
              className={`filter-chip ${activeFilter === cat ? 'active' : ''}`}
              onClick={() => setActiveFilter(cat)}
            >
              {cat === 'الكل' && <Filter size={14} style={{marginLeft: '5px'}} />}
              {cat}
            </button>
          ))}
        </div>
      </nav>

      {/* 3. شبكة العرض الرئيسية */}
      <main className="library-main-grid" ref={scrollRef}>
        <AnimatePresence mode='popLayout'>
          {loading ? (
            // Skeleton Loading
            [...Array(8)].map((_, i) => (
              <div key={i} className="skeleton-card glass animate-pulse">
                <div className="skeleton-image"></div>
                <div className="skeleton-text"></div>
                <div className="skeleton-text short"></div>
              </div>
            ))
          ) : filteredResults.length > 0 ? (
            filteredResults.map((book, idx) => (
              <BookCard key={book.id} book={book} index={idx} />
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="empty-state"
            >
              <div className="empty-icon-container">
                <BookOpen size={80} strokeWidth={1} />
              </div>
              <h2>لا توجد نتائج تطابق بحثك</h2>
              <p>جرّب استخدام كلمات دالة مختلفة أو تغيير القسم.</p>
              <button onClick={() => {setSearchQuery(''); setActiveFilter('الكل');}} className="reset-btn">
                إعادة ضبط البحث
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 4. مودال التفاصيل الاحترافي */}
      <AnimatePresence>
        {selectedBook && (
          <div className="detail-modal-backdrop" onClick={() => setSelectedBook(null)}>
            <motion.div 
              layoutId={`book-${selectedBook.id}`}
              className="detail-modal-card glass-heavy"
              onClick={e => e.stopPropagation()}
            >
              <button className="close-modal" onClick={() => setSelectedBook(null)}><X /></button>
              
              <div className="modal-grid">
                {/* الجزء البصري - كتاب 3D */}
                <div className="modal-visual-side">
                  <div className="book-presentation">
                    <div className="book-3d">
                      <img src={selectedBook.coverImage} alt="" className="front-cover" />
                      <div className="book-side"></div>
                    </div>
                  </div>
                  <div className="visual-stats">
                    <div className="v-stat"><Globe size={16} /> العربية</div>
                    <div className="v-stat"><Layers size={16} /> إصدار 2024</div>
                  </div>
                </div>

                {/* الجزء المعلوماتي */}
                <div className="modal-info-side">
                  <span className="modal-cat">{selectedBook.category}</span>
                  <h2>{selectedBook.title}</h2>
                  <div className="author-row">
                    <div className="author-avatar">{selectedBook.author?.[0] || 'A'}</div>
                    <div className="author-meta">
                      <strong>{selectedBook.author || 'إدارة المنصة'}</strong>
                      <span>مؤلف وباحث تعليمي</span>
                    </div>
                  </div>

                  <div className="modal-desc">
                    <h3>نبذة عن الكتاب</h3>
                    <p>{selectedBook.description || "هذا الكتاب يوفر شرحاً وافياً ومبسطاً للمفاهيم الأساسية، مع أمثلة تطبيقية تساعد الطالب على استيعاب المادة العلمية بكفاءة عالية."}</p>
                  </div>

                  <div className="feature-grid">
                    <div className="feat-card"><CheckCircle2 size={16} /> نسخة منقحة</div>
                    <div className="feat-card"><CheckCircle2 size={16} /> دعم القراءة الليلية</div>
                    <div className="feat-card"><CheckCircle2 size={16} /> روابط تفاعلية</div>
                  </div>

                  <div className="modal-actions">
                    <button className="primary-download-btn" onClick={() => handleDownload(selectedBook)}>
                      <ArrowDownToLine /> تحميل الكتاب مجاناً (PDF)
                    </button>
                    <div className="secondary-btns">
                      <button className="icon-btn glass" title="مشاركة" onClick={() => shareBook(selectedBook)}><Share2 /></button>
                      <button 
                        className={`icon-btn glass ${userFavorites.includes(selectedBook.id) ? 'active-fav' : ''}`} 
                        title="حفظ"
                        onClick={() => toggleFavorite(selectedBook.id)}
                      >
                        <Bookmark />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* قسم التوصيات داخل المودال */}
              <div className="modal-recommendations">
                <h4>قد يهمك أيضاً</h4>
                <div className="rec-list">
                  {books.filter(b => b.id !== selectedBook.id).slice(0, 4).map(b => (
                    <div key={b.id} className="rec-item glass" onClick={() => setSelectedBook(b)}>
                      <img src={b.coverImage} alt="" />
                      <div className="rec-text">
                        <h6>{b.title}</h6>
                        <span>{b.author}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. فوتر المكتبة */}
      <footer className="library-footer glass">
        <div className="footer-content">
          <div className="f-info">
            <h3>مكتبة MaFA</h3>
            <p>جميع الحقوق محفوظة © 2026. يتم تحديث الكتب أسبوعياً لضمان توفر أحدث المصادر العلمية.</p>
          </div>
          <div className="f-stats">
            <div className="f-stat-item">
              <strong>{books.length}</strong>
              <span>كتاب متاح</span>
            </div>
            <div className="f-stat-item">
              <strong>+15k</strong>
              <span>تحميل</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Library;

