import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  increment 
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, BookOpen, FileText, DownloadCloud, Eye, 
  Star, Clock, Library as LibIcon, X, ChevronLeft, 
  Bookmark, Share2, Info, CheckCircle2, Filter, 
  HardDrive, Layers, Globe, ArrowDownToLine
} from 'lucide-react';
import './Library.css';

const Library = () => {
  // --- 1. State Management (إدارة حالات المكتبة) ---
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('الكل');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [stats, setStats] = useState({ downloads: 0, saved: 0 });
  const scrollRef = useRef(null);

  const handleDownload = async (book) => {
  if (!book.fileUrl) return alert("رابط التحميل غير متوفر حالياً");
  window.open(book.fileUrl, '_blank');
  
  // تحديث عدد التحميلات في فايربيز (اختياري)
  try {
    const bookRef = doc(db, 'library', book.id);
    await updateDoc(bookRef, { downloads: increment(1) });
  } catch (e) { console.error(e); }
};

const shareBook = (book) => {
  if (navigator.share) {
    navigator.share({
      title: book.title,
      text: `حمل كتاب ${book.title} من مكتبة المعرفة`,
      url: window.location.href,
    });
  } else {
    navigator.clipboard.writeText(window.location.href);
    alert("تم نسخ رابط المكتبة!");
  }
};
  
// --- 2. Firebase Integration (الربط المصلح) ---
  useEffect(() => {
    setLoading(true);
    const booksRef = collection(db, 'library');
    
    // تبسيط الاستعلام لتجنب مشاكل الـ Index في البداية
    const q = activeFilter === 'الكل' 
      ? query(booksRef) 
      : query(booksRef, where('category', '==', activeFilter));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        pages: doc.data().pages || '150+',
        rating: doc.data().rating || 4.9,
        size: doc.data().size || '4.2 MB',
        downloads: doc.data().downloads || 0
      }));

      // ترتيب البيانات برمجياً بدلاً منorderBy لضمان العمل فوراً
      const sortedData = data.sort((a, b) => b.createdAt - a.createdAt);
      
      setBooks(sortedData);
      setLoading(false);
    }, (error) => {
      console.error("Library Firebase Error:", error);
      setLoading(false);
      // تنبيه بسيط لك إذا كانت القاعدة فارغة
      if(error.code === 'permission-denied') {
        alert("تأكد من إعدادات القواعد (Rules) في فايربيز");
      }
    });
const filteredResults = useMemo(() => {
  return books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (book.author && book.author.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });
}, [books, searchQuery]);
    
    const filteredResults = useMemo(() => {
  return books.filter(book => {
    // 1. التأكد من مطابقة نص البحث
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (book.author && book.author.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // 2. التأكد من مطابقة القسم المختار
    const matchesCategory = activeFilter === 'الكل' || book.category === activeFilter;

    return matchesSearch && matchesCategory;
  });
}, [books, searchQuery, activeFilter]); // أضفنا activeFilter هنا لضمان التحديث عند تغيير القسم

  return (
    <div className="modern-library-root">
      
      {/* 1. الجانب العلوي: محرك البحث والبانر */}
      <section className="library-hero-section glass">
        <div className="hero-content">
          <motion.div 
            initial={{ y: -20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }}
            className="lib-badge"
          >
            <LibIcon size={16} /> مكتبة المعرفة الرقمية
          </motion.div>
          <h1>استكشف عالم <span className="gradient-text">الكتب والملخصات</span></h1>
          <p>أكثر من {books.length} مصدر تعليمي حصري متاح الآن للتحميل المجاني والمباشر.</p>
          
          <div className="search-bar-v5 glass-heavy">
            <Search className="s-icon" />
            <input 
              type="text" 
              placeholder="ابحث بالعنوان، المؤلف، أو الكلمات الدالة..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="k-shortcut">CTRL + F</div>
          </div>
        </div>
      </section>

      {/* 2. شريط الفلترة الذكي */}
      <nav className="library-filter-nav">
        {['الكل', 'كتب دراسية', 'ملخصات برمجية', 'علوم دينية', 'تنمية ذاتية', 'أبحاث'].map(cat => (
          <button 
            key={cat}
            className={`filter-btn ${activeFilter === cat ? 'active' : ''}`}
            onClick={() => setActiveFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </nav>

      {/* 3. شبكة الكتب (The Grid) */}
      <div className="library-grid-container" ref={scrollRef}>
        <AnimatePresence mode='popLayout'>
          {loading ? (
            Array(10).fill(0).map((_, i) => <div key={i} className="book-skeleton-card glass" />)
          ) : filteredResults.length > 0 ? (
            filteredResults.map((book, index) => (
              <motion.div 
                key={book.id}
                layoutId={book.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
                className="modern-book-card glass"
                onClick={() => setSelectedBook(book)}
              >
                <div className="book-cover-area">
                  <img src={book.coverImage} alt={book.title} loading="lazy" />
                  <div className="cover-overlay">
                    <button className="preview-trigger"><Eye /> معاينة</button>
                  </div>
                  <div className="file-type-badge">PDF</div>
                </div>
                
                <div className="book-info-area">
                  <div className="book-top-meta">
                    <span className="b-cat">{book.category}</span>
                    <span className="b-rating"><Star size={12} fill="gold" stroke="gold" /> {book.rating}</span>
                  </div>
                  <h3>{book.title}</h3>
                  <p className="b-author">تأليف: {book.author || 'إدارة المنصة'}</p>
                  
                  <div className="book-bottom-stats">
                    <div className="b-stat"><FileText size={14} /> {book.pages} صفحة</div>
                    <div className="b-stat"><HardDrive size={14} /> {book.size}</div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="no-results-v5">
              <BookOpen size={60} />
              <h2>عذراً، لم نجد ما تبحث عنه</h2>
              <p>حاول البحث بكلمات أخرى أو اختر قسماً مختلفاً</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. لوحة التفاصيل العملاقة (The Mega Detail Panel) */}
      <AnimatePresence>
        {selectedBook && (
          <div className="book-details-overlay" onClick={() => setSelectedBook(null)}>
            <motion.div 
              className="book-detail-panel glass-heavy"
              layoutId={selectedBook.id}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="close-panel-btn" onClick={() => setSelectedBook(null)}><X /></button>
              
              <div className="panel-scroll-content">
                <div className="panel-grid">
                  {/* الجانب البصري */}
                  <div className="panel-visual">
                    <div className="book-3d-wrapper">
                      <img src={selectedBook.coverImage} alt="" className="main-cover" />
                      <div className="book-spine"></div>
                    </div>
                    <div className="quick-info-chips">
                      <div className="chip"><Globe size={16} /> العربية</div>
                      <div className="chip"><Clock size={16} /> تحديث 2025</div>
                    </div>
                  </div>

                  {/* الجانب المعلوماتي */}
                  <div className="panel-info">
                    <span className="p-badge">{selectedBook.category}</span>
                    <h2>{selectedBook.title}</h2>
                    <div className="p-author-box">
                      <img src={`https://ui-avatars.com/api/?name=${selectedBook.author}&background=random`} alt="" />
                      <div>
                        <strong>{selectedBook.author}</strong>
                        <span>مؤلف معتمد في المنصة</span>
                      </div>
                    </div>

                    <div className="p-description">
                      <h3>عن هذا الإصدار</h3>
                      <p>{selectedBook.description || 'هذا الكتاب يمثل مرجعاً أساسياً في هذا المجال، حيث تم إعداده وتنسيقه ليناسب كافة المستويات العلمية مع تبسيط المعلومات المعقدة.'}</p>
                    </div>

                    <div className="p-features">
                      <div className="feat-item"><CheckCircle2 size={16} color="#43e97b" /> دقة عالية للنصوص</div>
                      <div className="feat-item"><CheckCircle2 size={16} color="#43e97b" /> متاح للطباعة</div>
                      <div className="feat-item"><CheckCircle2 size={16} color="#43e97b" /> متوافق مع الموبايل</div>
                    </div>

                    <div className="p-action-row">
                      <button className="download-full-btn" onClick={() => handleDownload(selectedBook)}>
                        <ArrowDownToLine /> تحميل الملف الآن (PDF)
                      </button>
                      <div className="secondary-actions">
                        <button className="s-btn glass" onClick={() => shareBook(selectedBook)}><Share2 /></button>
                        <button className="s-btn glass"><Bookmark /></button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* قسم إضافي: كتب مشابهة */}
                <div className="related-books-section">
                   <h4>كتب قد تهمك أيضاً 📚</h4>
                   <div className="related-grid">
                      {books.slice(0, 3).map(b => (
                        <div key={b.id} className="mini-related-card glass" onClick={() => setSelectedBook(b)}>
                           <img src={b.coverImage} alt="" />
                           <p>{b.title}</p>
                        </div>
                      ))}
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


export default Library;

