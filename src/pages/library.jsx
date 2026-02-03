import React, { useState, useEffect, useMemo } from 'react';
import { db, auth } from '../firebase';
import { 
  collection, onSnapshot, query, where, orderBy, 
  doc, updateDoc, increment, addDoc, serverTimestamp, 
  limit 
} from 'firebase/firestore';
import { 
  Search, FileText, DownloadCloud, Eye, Star, 
  X, Heart, MessageSquare, Send, 
  Moon, Sun, Award, Zap,
  LayoutGrid, List, Filter, HardDrive, Globe, AlertCircle
} from 'lucide-react';

// استيراد ملف الـ CSS الخاص بك
import './library.css';

const Library = () => {
  // --- 1. الحالات البرمجية ---
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('الكل');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [readingMode, setReadingMode] = useState('default'); // default, dark, sepia
  const [userXP, setUserXP] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  // --- 2. جلب البيانات (Firebase) ---
  useEffect(() => {
    let unsubscribe = () => {};
    setLoading(true);
    setErrorMessage("");

    // مؤقت أمان: إذا استغرق التحميل أكثر من 7 ثوانٍ، افتح الصفحة وأظهر تنبيه
    const safetyTimer = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setErrorMessage("الشبكة ضعيفة، جاري المحاولة في الخلفية...");
      }
    }, 7000);

    try {
      const booksRef = collection(db, 'library');
      let q = query(booksRef, orderBy('createdAt', 'desc'));
      
      if (activeFilter !== 'الكل' && activeFilter !== 'المفضلة') {
        q = query(booksRef, where('category', '==', activeFilter));
      }

      unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          title: doc.data().title || "بدون عنوان",
          category: doc.data().category || "عام",
          views: doc.data().views || 0,
          downloads: doc.data().downloads || 0,
          rating: doc.data().rating || 5
        }));
        
        setBooks(data);
        setLoading(false);
        setErrorMessage("");
        clearTimeout(safetyTimer);
      }, (err) => {
        console.error("Firestore Error:", err);
        setErrorMessage("عذراً، تعذر جلب البيانات من السيرفر.");
        setLoading(false);
      });
    } catch (err) {
      setLoading(false);
      setErrorMessage("حدث خطأ في إعدادات الاتصال.");
    }

    // جلب البيانات المحلية
    setFavorites(JSON.parse(localStorage.getItem('lib_favs') || '[]'));
    setUserXP(parseInt(localStorage.getItem('user_xp') || '0'));

    return () => {
      unsubscribe();
      clearTimeout(safetyTimer);
    };
  }, [activeFilter]);

  // --- 3. الوظائف المنطقية ---
  const handleDownload = async (book) => {
    if (!book.pdfUrl) return alert("رابط التحميل غير متوفر لهذا الكتاب");
    window.open(book.pdfUrl, '_blank');
    try {
      await updateDoc(doc(db, 'library', book.id), { downloads: increment(1) });
      const newXP = userXP + 50;
      setUserXP(newXP);
      localStorage.setItem('user_xp', newXP.toString());
    } catch (e) { console.error(e); }
  };

  const filteredBooks = useMemo(() => {
    return books.filter(b => {
      const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFav = activeFilter === 'المفضلة' ? favorites.includes(b.id) : true;
      return matchesSearch && matchesFav;
    });
  }, [books, searchQuery, favorites, activeFilter]);

  // --- 4. العرض البصري (UI) ---

  // شاشة التحميل الذكية
  if (loading) return (
    <div className="loading-state-v8" style={{background:'#0d0d0d', height:'100vh', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', color:'gold'}}>
      <div className="loader-icon-v8"><Zap size={48} className="zap-animate" /></div>
      <h2 style={{marginTop:'20px', fontFamily:'sans-serif'}}>فتح بوابات المعرفة...</h2>
    </div>
  );

  return (
    <div className={`titan-lib-container mode-${readingMode} view-${viewMode}`} translate="no">
      
      {/* الهيدر العلوي */}
      <header className="lib-header-v8 glass">
        <div className="top-bar">
          <div className="brand">
            <div className="logo-orb"><Zap size={22} fill="gold" /></div>
            <div>
              <h1>مكتبة تيتان المركزية <span>V2.0</span></h1>
              <div className="xp-badge"><Award size={14}/> {userXP} نقطة خبرة</div>
            </div>
          </div>
          
          <div className="header-actions">
            <div className="theme-switch">
              <button onClick={() => setReadingMode('default')} className={readingMode === 'default' ? 'active' : ''}><Sun size={18}/></button>
              <button onClick={() => setReadingMode('dark')} className={readingMode === 'dark' ? 'active' : ''}><Moon size={18}/></button>
            </div>
          </div>
        </div>

        <div className="search-engine-v8 glass-heavy">
          <Search className="search-icon" size={20} />
          <input 
            type="text" 
            placeholder="ابحث عن العناوين، المذكرات، أو الكورسات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="view-toggle">
            <LayoutGrid onClick={() => setViewMode('grid')} className={viewMode === 'grid' ? 'active' : ''} />
            <List onClick={() => setViewMode('list')} className={viewMode === 'list' ? 'active' : ''} />
          </div>
        </div>
      </header>

      <div className="lib-main-layout">
        {/* القائمة الجانبية */}
        <aside className="lib-sidebar-v8">
          <div className="sb-group">
            <h3><Filter size={16}/> التصنيفات</h3>
            {['الكل', 'كتب دراسية', 'ملخصات برمجية', 'المفضلة'].map(cat => (
              <button 
                key={cat} 
                className={`cat-btn ${activeFilter === cat ? 'active' : ''}`}
                onClick={() => setActiveFilter(cat)}
              >
                {cat} {cat === 'المفضلة' && <Heart size={12} fill={favorites.length > 0 ? "red" : "none"} />}
              </button>
            ))}
          </div>
          
          {errorMessage && (
            <div className="error-alert">
              <AlertCircle size={16} /> {errorMessage}
            </div>
          )}
        </aside>

        {/* شبكة الكتب */}
        <main className="lib-grid-v8">
          {filteredBooks.length === 0 ? (
            <div className="no-results">
              <Globe size={50} opacity={0.2} />
              <p>لا توجد بيانات متاحة حالياً</p>
            </div>
          ) : (
            filteredBooks.map((book) => (
              <div 
                key={book.id} 
                className="book-card-v8 glass fade-in"
                onClick={() => setSelectedBook(book)}
              >
                <div className="card-cover">
                  <img src={book.coverImage || 'https://via.placeholder.com/150'} alt={book.title} loading="lazy" />
                  <div className="card-badges">
                    <span className="b-tag">{book.category}</span>
                  </div>
                </div>
                <div className="card-content">
                  <h3>{book.title}</h3>
                  <div className="card-footer">
                    <div className="f-stats">
                      <span><Eye size={12}/> {book.views}</span>
                      <span><DownloadCloud size={12}/> {book.downloads}</span>
                    </div>
                    <div className="f-rating"><Star size={12} fill="gold" color="gold"/> {book.rating}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </main>
      </div>

      {/* نافذة التفاصيل (Modal) */}
      {selectedBook && (
        <div className="mega-modal-v8-overlay" onClick={() => setSelectedBook(null)}>
          <div className="modal-body-v8 glass-heavy slide-up" onClick={e => e.stopPropagation()}>
            <button className="m-close" onClick={() => setSelectedBook(null)}><X /></button>
            
            <div className="modal-content-grid">
              <div className="m-visual">
                <img src={selectedBook.coverImage} alt="" />
                <button className="main-dl-btn" onClick={() => handleDownload(selectedBook)}>
                  <DownloadCloud size={20} /> تحميل الملف (PDF)
                </button>
              </div>
              
              <div className="m-info">
                <span className="m-category">{selectedBook.category}</span>
                <h2>{selectedBook.title}</h2>
                
                <div className="m-meta-row">
                  <div className="m-meta-item"><FileText size={16}/> <b>{selectedBook.pages || 'غير محدد'}</b> صفحة</div>
                  <div className="m-meta-item"><HardDrive size={16}/> <b>{selectedBook.size || 'متغير'}</b></div>
                </div>

                <p className="m-desc">{selectedBook.description || "لا يوجد وصف متوفر لهذا الكتاب حالياً."}</p>
                
                <div className="m-footer-actions">
                   <button className={`fav-toggle ${favorites.includes(selectedBook.id) ? 'active' : ''}`} 
                           onClick={() => {
                             const newFavs = favorites.includes(selectedBook.id) 
                               ? favorites.filter(f => f !== selectedBook.id) 
                               : [...favorites, selectedBook.id];
                             setFavorites(newFavs);
                             localStorage.setItem('lib_favs', JSON.stringify(newFavs));
                           }}>
                     <Heart size={20} fill={favorites.includes(selectedBook.id) ? "red" : "none"} />
                     {favorites.includes(selectedBook.id) ? "في المفضلة" : "إضافة للمفضلة"}
                   </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Library;
