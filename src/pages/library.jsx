import React, { useState, useEffect, useMemo } from 'react';
import { db, auth } from '../firebase';
import { 
  collection, onSnapshot, query, where, orderBy, 
  doc, updateDoc, increment, addDoc, serverTimestamp, 
  limit 
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, FileText, DownloadCloud, Eye, Star, 
  X, Heart, Share2, MessageSquare, Send, 
  AlertTriangle, Moon, Sun, Coffee, Award, Zap,
  LayoutGrid, List, Filter, HardDrive, Globe
} from 'lucide-react';

// استيراد ملف الـ CSS الخاص بك
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
  const [readingMode, setReadingMode] = useState('default');
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [userXP, setUserXP] = useState(0);

  // --- 2. الربط مع Firebase مع معالجة الأخطاء ---
  useEffect(() => {
    let unsubscribe = () => {};
    
    try {
      setLoading(true);
      const booksRef = collection(db, 'library');
      
      // بناء الاستعلام مع مراعاة وجود Index في Firebase
      let q = query(booksRef, orderBy('createdAt', 'desc'));
      
      if (activeFilter !== 'الكل' && activeFilter !== 'المفضلة') {
        q = query(booksRef, where('category', '==', activeFilter));
      }

      unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          rating: doc.data().rating || 4.5,
          downloads: doc.data().downloads || 0,
          views: doc.data().views || 0
        }));
        setBooks(data);
        setLoading(false);
      }, (error) => {
        console.error("Firebase Snapshot Error:", error);
        setLoading(false); // إيقاف التحميل حتى عند الخطأ لفتح الصفحة
      });
    } catch (err) {
      console.error("Setup Error:", err);
      setLoading(false);
    }

    // جلب البيانات المحلية
    setFavorites(JSON.parse(localStorage.getItem('lib_favs') || '[]'));
    setUserXP(parseInt(localStorage.getItem('user_xp') || '0'));

    return () => unsubscribe();
  }, [activeFilter]);

  // جلب التعليقات
  useEffect(() => {
    if (selectedBook?.id) {
      const commentsRef = collection(db, 'library', selectedBook.id, 'comments');
      const q = query(commentsRef, orderBy('timestamp', 'desc'), limit(15));
      return onSnapshot(q, (snap) => {
        setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (err) => console.log("Comments error ignored"));
    }
  }, [selectedBook]);

  // --- 3. الوظائف المنطقية ---
  const handleDownload = async (book) => {
    try {
      window.open(book.pdfUrl, '_blank');
      const bookRef = doc(db, 'library', book.id);
      await updateDoc(bookRef, { downloads: increment(1) });
      const newXP = userXP + 50;
      setUserXP(newXP);
      localStorage.setItem('user_xp', newXP.toString());
    } catch (err) { console.error("Download update failed:", err); }
  };

  const toggleFavorite = (id) => {
    const newFavs = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id];
    setFavorites(newFavs);
    localStorage.setItem('lib_favs', JSON.stringify(newFavs));
  };

  const postComment = async () => {
    if (!newComment.trim() || !selectedBook) return;
    try {
      const commentsRef = collection(db, 'library', selectedBook.id, 'comments');
      await addDoc(commentsRef, {
        text: newComment,
        user: auth.currentUser?.displayName || 'طالب متميز',
        timestamp: serverTimestamp(),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${auth.currentUser?.uid || 'guest'}`
      });
      setNewComment('');
    } catch (err) { alert("فشل إرسال التعليق، تأكد من تسجيل الدخول"); }
  };

  // تصفية الكتب للبحث
  const filteredBooks = useMemo(() => {
    return books.filter(b => {
      const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFav = activeFilter === 'المفضلة' ? favorites.includes(b.id) : true;
      return matchesSearch && matchesFav;
    });
  }, [books, searchQuery, favorites, activeFilter]);

  // --- 4. واجهة المستخدم ---
  
  // صمام أمان التحميل
  if (loading) return (
    <div className="titan-lib-container" style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', background:'#0d0d0d'}}>
      <div className="pulse-orb"><Zap size={40} color="var(--brand-primary)" /></div>
      <p style={{color:'white', marginRight:'15px'}}>جاري فتح المكتبة العظمى...</p>
    </div>
  );

  return (
    <div className={`titan-lib-container mode-${readingMode} view-${viewMode}`} translate="no">
      
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
              <button onClick={() => setReadingMode('default')}><Sun size={18}/></button>
              <button onClick={() => setReadingMode('sepia')}><Coffee size={18}/></button>
              <button onClick={() => setReadingMode('dark')}><Moon size={18}/></button>
            </div>
            <button className="request-btn" onClick={() => setIsRequesting(true)}>طلب كتاب</button>
          </div>
        </div>

        <div className="search-engine-v8 glass-heavy">
          <Search className="search-icon" />
          <input 
            type="text" 
            placeholder="ابحث عن كتب، ملخصات، مصادر..."
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
        <aside className="lib-sidebar-v8">
          <div className="sb-group">
            <h3><Filter size={16}/> استكشاف الأقسام</h3>
            {['الكل', 'كتب دراسية', 'ملخصات برمجية', 'علوم دينية', 'تنمية ذاتية', 'المفضلة'].map(cat => (
              <button 
                key={cat} 
                className={`cat-btn ${activeFilter === cat ? 'active' : ''}`}
                onClick={() => setActiveFilter(cat)}
              >
                {cat} {cat === 'المفضلة' && <Heart size={12} fill="red" />}
              </button>
            ))}
          </div>
          
          <div className="sb-stats glass">
            <h4>إحصائياتك</h4>
            <div className="stat-row"><span>كتب محملة:</span> <b>{Math.floor(userXP/50)}</b></div>
            <div className="stat-row"><span>المفضلة:</span> <b>{favorites.length}</b></div>
          </div>
        </aside>

        <main className="lib-grid-v8">
          {filteredBooks.length === 0 ? (
            <div style={{color:'#555', textAlign:'center', gridColumn:'1/-1', padding:'50px'}}>لم يتم العثور على نتائج تطابق بحثك</div>
          ) : (
            <AnimatePresence>
              {filteredBooks.map((book) => (
                <motion.div 
                  key={book.id}
                  layout // تحريك ذكي بدون layoutId لتجنب خطأ الـ Node
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="book-card-v8 glass"
                  onClick={() => setSelectedBook(book)}
                >
                  <div className="card-cover">
                    <img src={book.coverImage} alt="" loading="lazy" />
                    <div className="card-badges">
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
                    <div className="card-footer">
                      <div className="f-stats">
                        <span><Eye size={12}/> {book.views}</span>
                        <span><DownloadCloud size={12}/> {book.downloads}</span>
                      </div>
                      <div className="f-rating"><Star size={12} fill="gold"/> {book.rating}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </main>
      </div>

      {/* مودال التفاصيل */}
      <AnimatePresence>
        {selectedBook && (
          <div className="mega-modal-v8" onClick={() => setSelectedBook(null)}>
            <motion.div 
              className="modal-body-v8 glass-heavy"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-scroll-area">
                <div className="modal-top-section">
                  <div className="m-visual">
                    <img src={selectedBook.coverImage} alt="" />
                    <button className="main-dl-btn" onClick={() => handleDownload(selectedBook)}>
                      <DownloadCloud /> تحميل الآن (PDF)
                    </button>
                  </div>
                  
                  <div className="m-info">
                    <button className="m-close" onClick={() => setSelectedBook(null)}><X /></button>
                    <span className="m-category">{selectedBook.category}</span>
                    <h2>{selectedBook.title}</h2>
                    <div className="m-meta-grid">
                      <div className="m-m-item"><FileText size={16}/> <b>{selectedBook.pages || '??'}</b> صفحة</div>
                      <div className="m-m-item"><HardDrive size={16}/> <b>{selectedBook.size || '2MB'}</b></div>
                      <div className="m-m-item"><Globe size={16}/> <b>العربية</b></div>
                    </div>
                    <p className="m-desc">{selectedBook.description || "كتاب قيم من مكتبتنا المركزية.."}</p>
                    
                    <div className="comments-section">
                      <h4><MessageSquare size={16}/> المناقشات ({comments.length})</h4>
                      <div className="comments-list">
                        {comments.map(c => (
                          <div key={c.id} className="comment-bubble glass">
                            <img src={c.avatar} alt="" />
                            <div className="c-text">
                              <header><b>{c.user}</b></header>
                              <p>{c.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="comment-input">
                        <input 
                          placeholder="أضف تعليقاً.." 
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                        />
                        <button onClick={postComment}><Send size={18}/></button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* مودال الطلب */}
      <AnimatePresence>
        {isRequesting && (
          <div className="request-modal-overlay glass-heavy" onClick={() => setIsRequesting(false)}>
            <motion.div 
              initial={{ y: 50 }} animate={{ y: 0 }}
              className="request-form glass"
              onClick={e => e.stopPropagation()}
            >
              <h2>طلب مصدر تعليمي</h2>
              <input type="text" placeholder="اسم الكتاب" />
              <textarea placeholder="تفاصيل إضافية.." />
              <div className="form-btns">
                <button className="cancel" onClick={() => setIsRequesting(false)}>إلغاء</button>
                <button className="submit" onClick={() => {alert("تم إرسال طلبك بنجاح"); setIsRequesting(false);}}>إرسال</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Library;


