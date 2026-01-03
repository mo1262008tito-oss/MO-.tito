import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Book, Download, Eye, Search, FileText } from 'lucide-react';
import './library.css';

const library = () => {
  const [books, setBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // جلب الكتب من مجموعة "library" في الفايربيس
    const q = query(collection(db, "library"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setBooks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="library-container">
      <header className="library-header">
        <motion.h1 initial={{ y: -20 }} animate={{ y: 0 }}>المكتبة الرقمية 📚</motion.h1>
        <p>مجموعتك الشاملة من الكتب والمذكرات بصيغة PDF</p>
        
        <div className="search-bar-wrapper">
          <Search className="search-icon" />
          <input 
            type="text" 
            placeholder="ابحث عن اسم الكتاب أو المذكرة..." 
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <div className="books-grid">
        {filteredBooks.map((book, index) => (
          <motion.div 
            className="book-card"
            key={book.id}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="book-cover">
              <FileText size={50} color="#00f2ff" />
              <div className="book-badge">{book.category || 'PDF'}</div>
            </div>
            
            <div className="book-info">
              <h3>{book.title}</h3>
              <p>المؤلف: {book.author || 'إدارة المنصة'}</p>
              
              <div className="book-actions">
                <a href={book.fileUrl} target="_blank" rel="noreferrer" className="view-btn">
                  <Eye size={18} /> معاينة
                </a>
                <a href={book.fileUrl} download className="download-btn">
                  <Download size={18} /> تحميل
                </a>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredBooks.length === 0 && (
        <div className="no-results">لا توجد كتب تطابق بحثك حالياً..</div>
      )}
    </div>
  );
};


export default Library;
