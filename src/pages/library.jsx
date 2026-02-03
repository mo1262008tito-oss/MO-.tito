

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
  Moon, Sun, Coffee, Award, Zap,
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
  const [errorStatus, setErrorStatus] = useState(null);

  // --- 2. الربط مع Firebase ---
  useEffect(() => {
    let unsubscribe = () => {};
    
    const fetchBooks = async () => {
      try {
        setLoading(true);
        setErrorStatus(null);
        const booksRef = collection(db, 'library');
        
        // بناء الاستعلام
        let q = query(booksRef, orderBy('createdAt', 'desc'));
        
        if (activeFilter !== 'الكل' && activeFilter !== 'المفضلة') {
          q = query(booksRef, where('category', '==', activeFilter));
        }

        unsubscribe = onSnapshot(q, (snapshot) => {
          if (snapshot.empty) {
            setErrorStatus("لا توجد كتب مضافة في هذا القسم حالياً.");
            setBooks([]);
          } else {
            const data = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              rating: doc.data().rating || 4.5,
              downloads: doc.data().downloads || 0,
              views: doc.data().views || 0
            }));
            setBooks(data);
            setErrorStatus(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("Firebase Error:", error);
          setErrorStatus(`فشل الاتصال: ${error.message}`);
          setLoading(false);
        });
      } catch (err) {
        setErrorStatus("حدث خطأ غير متوقع في الكود.");
        setLoading(false);
      }
    };

    fetchBooks();
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
      }, () => {});
    }
  }, [selectedBook]);

  // --- 3. الوظائف ---
  const handleDownload = async (book) => {
    try {
      window.open(book.pdfUrl, '_blank');
      await updateDoc(doc(db, 'library', book.id), { downloads: increment(1) });
      const newXP = userXP + 50;
      setUserXP(newXP);
      localStorage.setItem('user_xp', newXP.toString());
    } catch (err) { console.log(err); }
  };

  const toggleFavorite = (id) => {
    const newFavs = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id];
    setFavorites(newFavs);
    localStorage.setItem('lib_favs', JSON.stringify(newFavs));
  };

  const filteredBooks = useMemo(() => {
    return books.filter(b => {
      const title = b.title || "";
      const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFav = activeFilter === 'المفضلة' ? favorites.includes(b.id) : true;
      return matchesSearch && matchesFav;
    });
  }, [books, searchQuery, favorites, activeFilter]);

  // --- 4. واجهة المستخدم ---

  // 1. حالة التحميل (Loading)
  if (loading) return (
    <div style={{background:'#0d0d0d', height:'100vh', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', color:'white'}}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Zap size={40} color="gold"/></motion.div>
      <p style={{marginTop: '20px'}}>جاري استدعاء المعرفة...</p>
    </div>
  );

  return (
    <div className={`titan-lib-container mode-${readingMode} view-${viewMode}`} translate="no">
      <header className="lib-header-v8 glass">
        <div className="top-bar">
          <div className="brand">
            <Zap size={20} fill="#FFD700" />
            <div>
              <h1>مكتبة تيتان <span>V2.0</span></h1>
              <div className="xp-badge"><Award size={12}/> {userXP} XP</div>
            </div>
          </div>
          <div className="header-actions">
            <div className="reading-modes-switch">
              <button onClick={() => setReadingMode('default')}><Sun size={16}/></button>
              <button onClick={() => setReadingMode('dark')}><Moon size={16}/></button>
            </div>
            <button className="request-btn" onClick={() => setIsRequesting(true)}>طلب كتاب</button>
          </div>
        </div>

        <div className="search-engine-v8 glass-heavy">
          <Search className="search-icon" />
          <input 
            type="text" 
            placeholder="ابحث في المكتبة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="view-toggle">
            <LayoutGrid size={20} className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')} />
            <List size={20} className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')} />
          </div>
        </div>
      </header>

      <div className="lib-main-layout">
        <aside className="lib-sidebar-v8">
           <div className="sb-group">
            <h3>الأقسام</h3>
            {['الكل', 'كتب دراسية', 'ملخصات برمجية', 'المفضلة'].map(cat => (
              <button 
                key={cat} 
                className={`cat-btn ${activeFilter === cat ? 'active' : ''}`}
                onClick={() => setActiveFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </aside>

        <main className="lib-grid-v8">
          {/* عرض رسالة الخطأ أو مصفوفة فارغة في حالة الشاشة السوداء */}
          {errorStatus ? (
            <div className="error-display" style={{gridColumn:'1/-1', textAlign:'center', padding:'40px', color:'#888'}}>
              <Globe size={40} style={{marginBottom:'10px'}}/>
              <p>{errorStatus}</p>
              <button onClick={() => window.location.reload()} style={{marginTop:'10px', color:'gold', background:'none', border:'1px solid gold', padding:'5px 15px', borderRadius:'20px'}}>تحديث الصفحة</button>
            </div>
          ) : filteredBooks.length === 0 ? (
            <div style={{gridColumn:'1/-1', textAlign:'center', color:'#555', marginTop:'50px'}}>لا يوجد نتائج لبحثك</div>
          ) : (
            <AnimatePresence>
              {filteredBooks.map((book) => (
                <motion.div 
                  key={book.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="book-card-v8 glass"
                  onClick={() => setSelectedBook(book)}
                >
                  <div className="card-cover">
                    <img src={book.coverImage} alt="" />
                    <button className="b-fav" onClick={(e) => {e.stopPropagation(); toggleFavorite(book.id);}}>
                       <Heart size={16} fill={favorites.includes(book.id) ? "red" : "none"} color={favorites.includes(book.id) ? "red" : "white"}/>
                    </button>
                  </div>
                  <div className="card-content">
                    <h3>{book.title}</h3>
                    <div className="card-footer">
                       <span><Eye size={12}/> {book.views}</span>
                       <span className="f-rating"><Star size={12} fill="gold"/> {book.rating}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </main>
      </div>

      {/* المودال */}
      <AnimatePresence>
        {selectedBook && (
          <div className="mega-modal-v8" onClick={() => setSelectedBook(null)}>
            <motion.div 
              className="modal-body-v8 glass-heavy"
              initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.9 }}
              onClick={e => e.stopPropagation()}
            >
              <button className="m-close" onClick={() => setSelectedBook(null)}><X/></button>
              <div className="modal-scroll-area">
                <div className="modal-top-section">
                  <div className="m-visual">
                    <img src={selectedBook.coverImage} alt="" />
                    <button className="main-dl-btn" onClick={() => handleDownload(selectedBook)}>تحميل PDF</button>
                  </div>
                  <div className="m-info">
                    <h2>{selectedBook.title}</h2>
                    <p>{selectedBook.description || "لا يوجد وصف لهذا الكتاب حالياً."}</p>
                    {/* التعليقات */}
                    <div className="comments-section">
                        <div className="comment-input">
                          <input placeholder="اكتب تعليقك..." value={newComment} onChange={e => setNewComment(e.target.value)} />
                          <button onClick={async () => {
                             if(!newComment.trim()) return;
                             await addDoc(collection(db, 'library', selectedBook.id, 'comments'), {
                               text: newComment,
                               user: 'طالب تيتان',
                               timestamp: serverTimestamp(),
                               avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1'
                             });
                             setNewComment('');
                          }}><Send size={18}/></button>
                        </div>
                    </div>
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
