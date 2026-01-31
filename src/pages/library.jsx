import React, { useState, useEffect, useMemo, useRef } from 'react';
import { db, auth } from '../firebase';
import { 
  collection, onSnapshot, query, where, orderBy, 
  doc, updateDoc, increment, addDoc, serverTimestamp, 
  limit, getDocs 
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, BookOpen, FileText, DownloadCloud, Eye, Star, Clock, 
  Library as LibIcon, X, ChevronLeft, Bookmark, Share2, Info, 
  CheckCircle2, Filter, HardDrive, Layers, Globe, ArrowDownToLine, 
  TrendingUp, History, Heart, LayoutGrid, List, MessageSquare, 
  Send, AlertTriangle, Moon, Sun, Coffee, Award, Zap
} from 'lucide-react';
import './library.css';

const Library = () => {
  // --- 1. إدارة الحالات (States) ---
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('الكل');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [readingMode, setReadingMode] = useState('default'); // default, sepia, dark
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [userXP, setUserXP] = useState(0);

  // --- 2. الربط مع Firebase (المزامنة اللحظية) ---
  useEffect(() => {
    setLoading(true);
    const booksRef = collection(db, 'library');
    const q = activeFilter === 'الكل' 
      ? query(booksRef, orderBy('createdAt', 'desc'))
      : activeFilter === 'المفضلة' 
        ? query(booksRef, orderBy('createdAt', 'desc')) 
        : query(booksRef, where('category', '==', activeFilter));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        rating: doc.data().rating || 4.5,
        downloads: doc.data().downloads || 0,
        views: doc.data().views || 0,
        tags: doc.data().tags || []
      }));
      setBooks(data);
      setLoading(false);
    });

    // جلب البيانات المحلية (المفضلة والـ XP)
    const savedFavs = JSON.parse(localStorage.getItem('lib_favs') || '[]');
    const savedXP = parseInt(localStorage.getItem('user_xp') || '0');
    setFavorites(savedFavs);
    setUserXP(savedXP);

    return () => unsubscribe();
  }, [activeFilter]);

  // جلب تعليقات الكتاب المختار
  useEffect(() => {
    if (selectedBook) {
      const commentsRef = collection(db, 'library', selectedBook.id, 'comments');
      const q = query(commentsRef, orderBy('timestamp', 'desc'), limit(20));
      const unsubComments = onSnapshot(q, (snap) => {
        setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return () => unsubComments();
    }
  }, [selectedBook]);

  // --- 3. الوظائف المنطقية (Handlers) ---
  const handleDownload = async (book) => {
    try {
      const bookRef = doc(db, 'library', book.id);
      await updateDoc(bookRef, { downloads: increment(1) });
      
      // إضافة XP للمستخدم
      const newXP = userXP + 50;
      setUserXP(newXP);
      localStorage.setItem('user_xp', newXP.toString());
      
      window.open(book.pdfUrl, '_blank');
    } catch (err) { console.error(err); }
  };

  const postComment = async () => {
    if (!newComment.trim() || !selectedBook) return;
    const commentsRef = collection(db, 'library', selectedBook.id, 'comments');
    await addDoc(commentsRef, {
      text: newComment,
      user: auth.currentUser?.displayName || 'زائر تيتان',
      timestamp: serverTimestamp(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`
    });
    setNewComment('');
  };

  const toggleFavorite = (id) => {
    const newFavs = favorites.includes(id) 
      ? favorites.filter(f => f !== id) 
      : [...favorites, id];
    setFavorites(newFavs);
    localStorage.setItem('lib_favs', JSON.stringify(newFavs));
  };

  // خوارزمية الكتب المقترحة
  const relatedBooks = useMemo(() => {
    if (!selectedBook) return [];
    return books
      .filter(b => b.category === selectedBook.category && b.id !== selectedBook.id)
      .slice(0, 4);
  }, [selectedBook, books]);

  // --- 4. واجهة المستخدم (Render) ---
  return (
    <div className={`titan-lib-container mode-${readingMode} view-${viewMode}`}>
      
      {/* 1. نظام التنقل والبحث الاحترافي */}
      <header className="lib-header-v8 glass">
        <div className="top-bar">
          <div className="brand">
            <div className="pulse-orb"><Zap size={20} fill="#FFD700" /></div>
            <div>
              <h1>مكتبة تيتان المركزية <span>V2.0</span></h1>
              <div className="xp-badge"><Award size={14}/> {userXP} نقطة معرفة</div>
            </div>
          </div>
          
          <div className="header-actions">
            <div className="reading-modes-switch">
              <button onClick={() => setReadingMode('default')} title="الوضع العادي"><Sun size={18}/></button>
              <button onClick={() => setReadingMode('sepia')} title="وضع القراءة (Sepia)"><Coffee size={18}/></button>
              <button onClick={() => setReadingMode('dark')} title="الوضع المظلم"><Moon size={18}/></button>
            </div>
            <button className="request-btn" onClick={() => setIsRequesting(true)}>طلب كتاب</button>
          </div>
        </div>

        <div className="search-engine-v8 glass-heavy">
          <Search className="search-icon" />
          <input 
            type="text" 
            placeholder="ابحث في أكثر من 10,000 صفحة من المعرفة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="view-toggle">
            <LayoutGrid className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')} />
            <List className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')} />
          </div>
        </div>
      </header>

      <div className="lib-main-layout">
        {/* 2. الفلاتر الجانبية الذكية */}
        <aside className="lib-sidebar-v8">
          <div className="sb-group">
            <h3><Filter size={16}/> استكشاف الأقسام</h3>
            {['الكل', 'كتب دراسية', 'ملخصات برمجية', 'علوم دينية', 'تنمية ذاتية', 'المفضلة'].map(cat => (
              <button 
                key={cat} 
                className={`cat-btn ${activeFilter === cat ? 'active' : ''}`}
                onClick={() => setActiveFilter(cat)}
              >
                {cat}
                {cat === 'المفضلة' && <Heart size={12} fill="red" />}
              </button>
            ))}
          </div>

          <div className="sb-stats glass">
            <h4>إحصائياتك</h4>
            <div className="stat-row"><span>كتب محملة:</span> <b>{Math.floor(userXP/50)}</b></div>
            <div className="stat-row"><span>المفضلة:</span> <b>{favorites.length}</b></div>
            <div className="progress-mini">
              <div className="p-bar" style={{width: `${(userXP % 1000) / 10}%`}}></div>
            </div>
            <small>تبقي {(1000 - (userXP % 1000))} نقطة للمستوى التالي</small>
          </div>
        </aside>

        {/* 3. شبكة المحتوى الرئيسية */}
        <main className="lib-grid-v8">
          <AnimatePresence>
            {loading ? (
              [...Array(6)].map((_, i) => <div key={i} className="skeleton-v8 glass" />)
            ) : (
              books
                .filter(b => b.title.includes(searchQuery) && (activeFilter === 'الكل' || activeFilter === 'المفضلة' ? true : b.category === activeFilter))
                .filter(b => activeFilter === 'المفضلة' ? favorites.includes(b.id) : true)
                .map((book, idx) => (
                  <motion.div 
                    key={book.id}
                    layoutId={`card-${book.id}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -8 }}
                    className="book-card-v8 glass"
                    onClick={() => {
                      setSelectedBook(book);
                      updateDoc(doc(db, 'library', book.id), { views: increment(1) });
                    }}
                  >
                    <div className="card-cover">
                      <img src={book.coverImage} alt="" loading="lazy" />
                      <div className="card-badges">
                        <span className="b-type">PDF</span>
                        <button 
                          className={`b-fav ${favorites.includes(book.id) ? 'active' : ''}`}
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(book.id); }}
                        >
                          <Heart size={16} fill={favorites.includes(book.id) ? "red" : "none"} />
                        </button>
                      </div>
                    </div>
                    <div className="card-content">
                      <span className="c-tag">{book.category}</span>
                      <h3>{book.title}</h3>
                      <p>{book.author || 'إدارة تيتان'}</p>
                      <div className="card-footer">
                        <div className="f-stats">
                          <span><Eye size={12}/> {book.views}</span>
                          <span><DownloadCloud size={12}/> {book.downloads}</span>
                        </div>
                        <div className="f-rating"><Star size={12} fill="gold"/> {book.rating}</div>
                      </div>
                    </div>
                  </motion.div>
                ))
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* 4. لوحة التفاصيل العملاقة (The Mega Panel) */}
      <AnimatePresence>
        {selectedBook && (
          <div className="mega-modal-v8" onClick={() => setSelectedBook(null)}>
            <motion.div 
              className="modal-body-v8 glass-heavy"
              layoutId={`card-${selectedBook.id}`}
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-scroll-area">
                <div className="modal-top-section">
                  <div className="m-visual">
                    <img src={selectedBook.coverImage} alt="" />
                    <div className="m-actions">
                      <button className="main-dl-btn" onClick={() => handleDownload(selectedBook)}>
                        <DownloadCloud /> تحميل الآن (PDF)
                      </button>
                      <div className="sub-btns">
                        <button className="glass"><Share2 size={18}/></button>
                        <button className="glass" onClick={() => toggleFavorite(selectedBook.id)}>
                          <Heart size={18} fill={favorites.includes(selectedBook.id) ? "red" : "none"}/>
                        </button>
                        <button className="glass"><AlertTriangle size={18}/></button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="m-info">
                    <button className="m-close" onClick={() => setSelectedBook(null)}><X /></button>
                    <span className="m-category">{selectedBook.category}</span>
                    <h2>{selectedBook.title}</h2>
                    <div className="m-meta-grid">
                      <div className="m-m-item"><FileText size={16}/> <b>{selectedBook.pages}</b> صفحة</div>
                      <div className="m-m-item"><HardDrive size={16}/> <b>{selectedBook.size}</b></div>
                      <div className="m-m-item"><Globe size={16}/> <b>العربية</b></div>
                    </div>
                    <p className="m-desc">{selectedBook.description || "هذا الكتاب من المصادر الموثوقة لدينا..."}</p>
                    
                    {/* نظام التعليقات الحية */}
                    <div className="comments-section">
                      <h4><MessageSquare size={16}/> المناقشات ({comments.length})</h4>
                      <div className="comments-list">
                        {comments.map(c => (
                          <div key={c.id} className="comment-bubble glass">
                            <img src={c.avatar} alt="" />
                            <div className="c-text">
                              <header><b>{c.user}</b> <small>منذ قليل</small></header>
                              <p>{c.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="comment-input">
                        <input 
                          placeholder="أضف رأيك في هذا الكتاب..." 
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                        />
                        <button onClick={postComment}><Send size={18}/></button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* اقتراحات ذكية */}
                <div className="related-v8">
                  <h3>قد يهمك أيضاً 📚</h3>
                  <div className="related-grid-v8">
                    {relatedBooks.map(rb => (
                      <div key={rb.id} className="rel-card glass" onClick={() => setSelectedBook(rb)}>
                        <img src={rb.coverImage} alt="" />
                        <h5>{rb.title}</h5>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. مودال طلب الكتب (Request System) */}
      <AnimatePresence>
        {isRequesting && (
          <div className="request-modal-overlay glass-heavy" onClick={() => setIsRequesting(false)}>
            <motion.div 
              initial={{ y: 50, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }}
              className="request-form glass"
              onClick={e => e.stopPropagation()}
            >
              <h2>طلب مصدر تعليمي</h2>
              <p>إذا لم تجد كتاباً معيناً، أخبرنا وسنقوم بتوفيره لك في أقرب وقت.</p>
              <input type="text" placeholder="اسم الكتاب أو المؤلف" />
              <textarea placeholder="أي تفاصيل أخرى (السنة، الجزء...)" />
              <div className="form-btns">
                <button className="cancel" onClick={() => setIsRequesting(false)}>إلغاء</button>
                <button className="submit">إرسال الطلب</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Library;

