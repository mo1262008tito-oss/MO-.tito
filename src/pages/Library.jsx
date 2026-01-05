import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Download, Eye, FileText, ArrowRight, BookOpen, Clock } from 'lucide-react';
import './library.css';

const Library = () => {
  const [books, setBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingBook, setViewingBook] = useState(null); // الكتاب المفتوح حالياً

  useEffect(() => {
    const q = query(collection(db, "library"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setBooks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // واجهة قارئ الكتب
  if (viewingBook) {
    return (
      <motion.div 
        initial={{ opacity: 0, x: 50 }} 
        animate={{ opacity: 1, x: 0 }} 
        className="reader-mode"
      >
        <div className="reader-header">
          <button className="back-btn" onClick={() => setViewingBook(null)}>
            <ArrowRight size={20} /> العودة للمكتبة
          </button>
          <h2>{viewingBook.title}</h2>
          <a href={viewingBook.fileUrl} download className="minimal-download">
             <Download size={18} />
          </a>
        </div>
        <div className="pdf-viewer-container">
          <iframe 
            src={`${viewingBook.fileUrl}#toolbar=0`} 
            title="PDF Reader"
            width="100%" 
            height="100%"
          ></iframe>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="library-root rtl-support">
      <header className="lib-hero">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }}
          className="hero-content"
        >
          <h1>قاعدة البيانات المعرفية 📡</h1>
          <p>تصفح المخطوطات الرقمية والمذكرات العلمية</p>
          
          <div className="search-vortex-input">
            <Search className="s-icon" />
            <input 
              type="text" 
              placeholder="عن ماذا تبحث اليوم؟" 
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </motion.div>
      </header>

      <main className="books-shelf">
        <div className="shelf-label">
          <BookOpen size={20} />
          <span>المواد المتاحة ({filteredBooks.length})</span>
        </div>

        <div className="modern-books-grid">
          <AnimatePresence>
            {filteredBooks.map((book) => (
              <motion.div 
                layout
                key={book.id}
                className="futuristic-book-card"
                whileHover={{ y: -8 }}
              >
                <div className="card-top">
                  <div className="icon-box">
                    <FileText size={30} />
                  </div>
                  <span className="file-tag">{book.category || 'PDF'}</span>
                </div>
                
                <div className="card-mid">
                  <h3>{book.title}</h3>
                  <div className="meta-info">
                    <span><UserMini size={14}/> {book.author || 'المعلم'}</span>
                    <span><Clock size={14}/> {new Date(book.timestamp?.seconds * 1000).toLocaleDateString('ar-EG')}</span>
                  </div>
                </div>

                <div className="card-actions">
                  <button className="read-now" onClick={() => setViewingBook(book)}>
                    <Eye size={18} /> فتح الكتاب
                  </button>
                  <a href={book.fileUrl} download className="icon-only-download">
                    <Download size={18} />
                  </a>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

// أيقونة صغيرة مخصصة
const UserMini = ({size}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;

export default Library;
