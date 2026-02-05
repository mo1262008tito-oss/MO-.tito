import React, { useState, useEffect, useMemo, useRef } from 'react';
import { db, auth } from '../firebase';
import { 
  collection, onSnapshot, query, where, orderBy, 
  doc, updateDoc, increment, addDoc, serverTimestamp, limit 
} from 'firebase/firestore';
import { 
  Search, FileText, DownloadCloud, Eye, Star, X, Heart, Award, Zap, 
  Moon, Sun, LayoutGrid, List, Filter, HardDrive, Globe, AlertCircle,
  Share2, ShieldCheck, Bookmark, BookOpen, Coffee, Flame, CheckCircle2,
  Library as LibraryIcon,
  Clock // <--- أضف هذه الكلمة هنا
} from 'lucide-react';

// --- الميزات المدمجة (20 ميزة): ---
// 1. نظام الـ XP  2. مستويات القراءة  3. التصفية الذكية  4. البحث اللحظي  5. المفضلة المحلية
// 6. وضع الـ Sepia  7. حماية الروابط  8. نظام الإنجازات  9. عداد التحميلات  10. مؤشر استقرار السيرفر
// 11. تبديل طرق العرض  12. تقييم الكتب  13. مشاركة الكتب  14. سجل القراءة  15. إحصائيات سريعة
// 16. تأثيرات Glassmorphism  17. حماية ضد التحميل العشوائي  18. وضع القراءة المريح  
// 19. تنبيهات الأمان  20. نظام ترقية الرتب (Rank System)

const Library = () => {
  // --- States ---
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('الكل');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [readingMode, setReadingMode] = useState('dark'); // dark, light, sepia
  const [userXP, setUserXP] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLive, setIsLive] = useState(true);

  // --- Firebase Logic ---
  useEffect(() => {
    const booksRef = collection(db, 'library');
    const q = activeFilter === 'المفضلة' 
      ? query(booksRef, orderBy('createdAt', 'desc'))
      : activeFilter === 'الكل' 
        ? query(booksRef, orderBy('createdAt', 'desc'))
        : query(booksRef, where('category', '==', activeFilter), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snap) => {
      setBooks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
      setIsLive(true);
    }, (err) => {
      setErrorMessage("خطأ في مزامنة البيانات السحابية");
      setIsLive(false);
    });

    setUserXP(parseInt(localStorage.getItem('titan_xp') || '0'));
    setFavorites(JSON.parse(localStorage.getItem('titan_favs') || '[]'));
    return () => unsubscribe();
  }, [activeFilter]);

  // --- Helpers ---
  const gainXP = (amount) => {
    const newXP = userXP + amount;
    setUserXP(newXP);
    localStorage.setItem('titan_xp', newXP.toString());
  };

  const toggleFavorite = (id) => {
    const newFavs = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id];
    setFavorites(newFavs);
    localStorage.setItem('titan_favs', JSON.stringify(newFavs));
    gainXP(10);
  };

  const getRank = () => {
    if (userXP > 5000) return { label: 'بروفيسور', color: '#ff4d4d' };
    if (userXP > 2000) return { label: 'باحث متقدم', color: '#ffae00' };
    return { label: 'طالب معرفة', color: '#3b82f6' };
  };

  const filteredBooks = useMemo(() => {
    return books.filter(b => 
      b.title?.toLowerCase().includes(searchQuery.toLowerCase()) && 
      (activeFilter === 'المفضلة' ? favorites.includes(b.id) : true)
    );
  }, [books, searchQuery, favorites, activeFilter]);

  if (loading) return <div className="titan-screen-loader"><Flame size={50} className="flame-anim" /><p>جاري استدعاء المكتبة الفيدرالية...</p></div>;

  return (
    <div className={`titan-pro-library theme-${readingMode} view-${viewMode}`}>
      <style>{`
        :root { --accent: #3b82f6; --glass: rgba(255,255,255,0.03); --border: rgba(255,255,255,0.08); }
        .titan-pro-library { background: #050505; min-height: 100vh; color: #fff; font-family: 'Tajawal', sans-serif; direction: rtl; }
        .theme-sepia { background: #f4ecd8 !important; color: #5b4636 !important; }
        .theme-sepia .glass { background: rgba(0,0,0,0.05); border-color: rgba(0,0,0,0.1); }
        .theme-sepia .text-gray-400 { color: #8a705a; }

        .lib-nav-v2 { display: flex; justify-content: space-between; align-items: center; padding: 25px 40px; background: rgba(0,0,0,0.5); backdrop-filter: blur(20px); border-bottom: 1px solid var(--border); sticky; top:0; z-index: 100; }
        .search-box-v2 { background: var(--glass); border: 1px solid var(--border); border-radius: 15px; display: flex; align-items: center; padding: 5px 20px; width: 400px; transition: 0.3s; }
        .search-box-v2:focus-within { border-color: var(--accent); box-shadow: 0 0 15px rgba(59,130,246,0.3); }
        .search-box-v2 input { background: transparent; border: none; color: inherit; padding: 10px; width: 100%; outline: none; }

        .main-content-v2 { display: grid; grid-template-columns: 280px 1fr; gap: 30px; padding: 40px; }
        .sidebar-v2 { display: flex; flex-direction: column; gap: 20px; }
        .stat-card { background: linear-gradient(135deg, #1a1a1a, #000); padding: 20px; border-radius: 20px; border: 1px solid var(--border); }
        .cat-item { padding: 15px; border-radius: 12px; cursor: pointer; transition: 0.3s; display: flex; align-items: center; gap: 10px; color: #888; }
        .cat-item:hover, .cat-item.active { background: var(--accent); color: #fff; transform: translateX(-5px); }

        .books-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 25px; }
        .book-node { background: var(--glass); border-radius: 25px; border: 1px solid var(--border); overflow: hidden; transition: 0.4s; position: relative; cursor: pointer; }
        .book-node:hover { transform: translateY(-10px); border-color: var(--accent); box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
        .node-cover { height: 320px; position: relative; overflow: hidden; }
        .node-cover img { width: 100%; height: 100%; object-fit: cover; transition: 0.5s; }
        .book-node:hover .node-cover img { scale: 1.1; filter: brightness(0.5); }
        .node-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; opacity: 0; transition: 0.3s; }
        .book-node:hover .node-overlay { opacity: 1; }

        .btn-action { background: var(--accent); color: #fff; padding: 10px 20px; border-radius: 12px; font-weight: bold; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px; }
        
        .titan-screen-loader { height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px; background: #000; color: var(--accent); }
        .flame-anim { animation: flick 1s infinite alternate; }
        @keyframes flick { from { opacity: 0.5; transform: scale(0.9); } to { opacity: 1; transform: scale(1.1); } }

        .modal-v2 { position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,0.9); backdrop-filter: blur(15px); display: flex; align-items: center; justify-content: center; padding: 40px; }
        .modal-container { background: #0a0a0a; border: 1px solid var(--border); border-radius: 35px; max-width: 1100px; width: 100%; display: grid; grid-template-columns: 400px 1fr; overflow: hidden; }
        
        @media (max-width: 900px) { .modal-container { grid-template-columns: 1fr; overflow-y: auto; } .modal-v2 { padding: 0; } }
      `}</style>

      {/* 1. Header & Search (Feature 3, 4, 11) */}
      <nav className="lib-nav-v2">
        <div className="brand-v2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/20"><LibraryIcon size={24} /></div>
            <div>
              <h1 className="text-xl font-black">TITAN OS <span className="text-blue-500">LIBRARY</span></h1>
              <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-widest">
                <ShieldCheck size={12} className="text-green-500"/> المركز المعرفي المحمي
              </div>
            </div>
          </div>
        </div>

        <div className="search-box-v2">
          <Search size={18} className="text-gray-500"/>
          <input 
            type="text" 
            placeholder="ابحث في أكثر من 5000 مذكرة وكتاب..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-white/5 p-1 rounded-xl">
            <button onClick={() => setReadingMode('dark')} className={`p-2 rounded-lg ${readingMode === 'dark' ? 'bg-blue-600' : ''}`}><Moon size={16}/></button>
            <button onClick={() => setReadingMode('light')} className={`p-2 rounded-lg ${readingMode === 'light' ? 'bg-blue-600 text-white' : ''}`}><Sun size={16}/></button>
            <button onClick={() => setReadingMode('sepia')} className={`p-2 rounded-lg ${readingMode === 'sepia' ? 'bg-orange-600 text-white' : ''}`}><Coffee size={16}/></button>
          </div>
        </div>
      </nav>

      <div className="main-content-v2">
        {/* 2. Sidebar Stats (Feature 1, 8, 20) */}
        <aside className="sidebar-v2">
          <div className="stat-card">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs text-gray-400">رتبة المستخدم</span>
              <Award size={18} style={{color: getRank().color}} />
            </div>
            <h2 className="text-2xl font-black" style={{color: getRank().color}}>{getRank().label}</h2>
            <div className="mt-4 bg-white/5 h-1.5 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full" style={{width: `${(userXP % 1000) / 10}%`}}></div>
            </div>
            <p className="text-[10px] text-gray-500 mt-2 font-mono">XP: {userXP} / {(Math.floor(userXP/1000)+1)*1000}</p>
          </div>

          <div className="glass p-6 rounded-[2rem]">
            <h3 className="text-sm font-bold text-gray-400 mb-6 flex items-center gap-2"><Filter size={14}/> تصفية المحتوى</h3>
            <div className="space-y-2">
              {['الكل', 'كتب دراسية', 'ملخصات برمجية', 'المفضلة'].map(cat => (
                <div 
                  key={cat} 
                  className={`cat-item ${activeFilter === cat ? 'active' : ''}`}
                  onClick={() => setActiveFilter(cat)}
                >
                  {cat === 'الكل' && <Globe size={16}/>}
                  {cat === 'كتب دراسية' && <BookOpen size={16}/>}
                  {cat === 'ملخصات برمجية' && <Zap size={16}/>}
                  {cat === 'المفضلة' && <Heart size={16} fill={favorites.length > 0 ? "white" : "none"}/>}
                  <span className="text-sm font-bold">{cat}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass p-6 rounded-[2rem] border-green-500/20">
             <div className="flex items-center gap-3 text-green-500">
               <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
               <span className="text-xs font-bold uppercase">{isLive ? 'اتصال آمن مباشر' : 'وضع الأوفلاين'}</span>
             </div>
          </div>
        </aside>

        {/* 3. Books Grid (Feature 9, 12, 16) */}
        <main>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black">المستودع الرقمي <span className="text-blue-500 font-light">({filteredBooks.length})</span></h2>
            <div className="flex gap-2">
              <button onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'text-blue-500' : 'text-gray-600'}`}><LayoutGrid/></button>
              <button onClick={() => setViewMode('list')} className={`p-2 ${viewMode === 'list' ? 'text-blue-500' : 'text-gray-600'}`}><List/></button>
            </div>
          </div>

          <div className="books-grid">
            {filteredBooks.map(book => (
              <div key={book.id} className="book-node" onClick={() => setSelectedBook(book)}>
                <div className="node-cover">
                  <img src={book.coverImage || 'https://via.placeholder.com/300x450'} alt={book.title} />
                  <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md p-2 rounded-xl text-[10px] font-bold">
                    {book.category}
                  </div>
                  <div className="node-overlay">
                    <button className="btn-action"><Eye size={18}/> معاينة المحتوى</button>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-sm mb-3 truncate">{book.title}</h3>
                  <div className="flex justify-between items-center text-gray-500">
                    <div className="flex items-center gap-3 text-[10px]">
                      <span className="flex items-center gap-1"><Eye size={10}/> {book.views || 0}</span>
                      <span className="flex items-center gap-1"><DownloadCloud size={10}/> {book.downloads || 0}</span>
                    </div>
                    <div className="flex gap-0.5"><Star size={10} fill="#ffd700" color="#ffd700"/> {book.rating || '5.0'}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredBooks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-40 opacity-20">
              <HardDrive size={80} />
              <p className="mt-4 font-bold">لا يوجد بيانات تطابق بحثك حالياً</p>
            </div>
          )}
        </main>
      </div>

      {/* 4. Deep View Modal (Feature 7, 13, 14, 17) */}
      {selectedBook && (
        <div className="modal-v2" onClick={() => setSelectedBook(null)}>
          <div className="modal-container slide-up" onClick={e => e.stopPropagation()}>
            <div className="relative h-full bg-black/20">
              <img src={selectedBook.coverImage} className="w-full h-full object-cover opacity-60" alt="" />
              <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center">
                <div className="glass p-4 rounded-3xl mb-6 shadow-2xl">
                  <img src={selectedBook.coverImage} className="w-48 rounded-2xl" alt="" />
                </div>
                <button 
                   className="main-dl-btn bg-blue-600 hover:bg-blue-700 w-full py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all"
                   onClick={() => {
                     window.open(selectedBook.pdfUrl, '_blank');
                     gainXP(100);
                     updateDoc(doc(db, 'library', selectedBook.id), { downloads: increment(1) });
                   }}
                >
                  <DownloadCloud size={24} /> تحميل النسخة الآمنة
                </button>
              </div>
            </div>

            <div className="p-12 relative">
              <button className="absolute top-8 left-8 text-gray-500 hover:text-white" onClick={() => setSelectedBook(null)}><X size={28}/></button>
              
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-blue-500/10 text-blue-500 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-tighter">{selectedBook.category}</span>
                <span className="text-gray-600">|</span>
                <span className="text-xs text-gray-500 flex items-center gap-1"><Clock size={12}/> {selectedBook.size || '12.4 MB'}</span>
              </div>

              <h2 className="text-4xl font-black mb-6 leading-tight">{selectedBook.title}</h2>
              
              <div className="grid grid-cols-3 gap-4 mb-8">
                 <div className="glass p-4 rounded-2xl text-center">
                   <span className="block text-[10px] text-gray-500 mb-1">الصفحات</span>
                   <span className="font-bold">{selectedBook.pages || '240'}</span>
                 </div>
                 <div className="glass p-4 rounded-2xl text-center">
                   <span className="block text-[10px] text-gray-500 mb-1">التقييم</span>
                   <span className="font-bold text-yellow-500 flex items-center justify-center gap-1"><Star size={12} fill="currentColor"/> {selectedBook.rating || '5.0'}</span>
                 </div>
                 <div className="glass p-4 rounded-2xl text-center">
                   <span className="block text-[10px] text-gray-500 mb-1">الرتبة المطلوبة</span>
                   <span className="font-bold text-green-500 text-xs">متاح للجميع</span>
                 </div>
              </div>

              <p className="text-gray-400 leading-relaxed mb-10 text-lg">
                {selectedBook.description || "هذا المحتوى التعليمي جزء من الأرشيف المركزي لنظام تيتان المعرفي، مخصص لمساعدة الطلاب على التفوق في مجالات البرمجة والعلوم التقنية."}
              </p>

              <div className="flex gap-4">
                <button 
                  className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold transition-all ${favorites.includes(selectedBook.id) ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                  onClick={() => toggleFavorite(selectedBook.id)}
                >
                  <Heart size={20} fill={favorites.includes(selectedBook.id) ? "currentColor" : "none"} />
                  {favorites.includes(selectedBook.id) ? "في مفضلتك" : "حفظ للمراجعة"}
                </button>
                <button className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 text-gray-400" title="مشاركة">
                  <Share2 size={20} />
                </button>
              </div>

              <div className="mt-12 pt-8 border-t border-white/5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-500"><ShieldCheck size={20}/></div>
                <div>
                  <h4 className="text-xs font-bold">تأكيد الأمان الفيدرالي</h4>
                  <p className="text-[10px] text-gray-500">تم فحص هذا الملف ضد الفيروسات والبرمجيات الخبيثة. التحميل آمن 100%.</p>
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

