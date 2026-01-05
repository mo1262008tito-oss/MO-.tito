import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, query, getDocs, updateDoc, doc, addDoc, 
  onSnapshot, serverTimestamp, where, deleteDoc, orderBy 
} from "firebase/firestore";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, BookOpen, Plus, Check, X, ShieldCheck, Search,
  Lock, Unlock, DollarSign, FileText, LayoutDashboard,
  PackagePlus, Download, Eye, Trash2, UserCheck, Wallet, ShieldAlert,
  Hash, Video, HelpCircle, Layers, ClipboardList, Book
} from 'lucide-react'; 

import './AdminDash.css';

const AdminDash = () => {
  const [activeSection, setActiveSection] = useState('stats');
  const [stats, setStats] = useState({ students: 0, courses: 0, pending: 0, codes: 0, books: 0 });
  const [payments, setPayments] = useState([]);
  const [generatedCodes, setGeneratedCodes] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [books, setBooks] = useState([]);
  
  // --- حالات الكورسات المتكاملة ---
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title: '', instructor: '', subject: 'فيزياء', grade: '1', 
    price: 0, thumbnail: '', accessType: 'full', lessons: [] 
  });
  const [currentLesson, setCurrentLesson] = useState({ id: Date.now(), title: '', videoUrl: '', quiz: [] });
  const [currentQuestion, setCurrentQuestion] = useState({ q: '', options: ['', '', '', ''], correct: 0 });

  // --- حالات الكتب والأكواد ---
  const [newBook, setNewBook] = useState({ title: '', grade: '1', url: '', thumbnail: '' });
  const [codeGenSettings, setCodeGenSettings] = useState({ count: 10, type: 'full_course', targetId: '' });

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), (s) => {
        setAllUsers(s.docs.map(d => ({ id: d.id, ...d.data() })));
        setStats(prev => ({...prev, students: s.size}));
    });
    const unsubCourses = onSnapshot(collection(db, "courses_metadata"), (s) => {
        setCourses(s.docs.map(d => ({id: d.id, ...d.data()})));
        setStats(prev => ({...prev, courses: s.size}));
    });
    const unsubBooks = onSnapshot(collection(db, "library"), (s) => {
        setBooks(s.docs.map(d => ({id: d.id, ...d.data()})));
        setStats(prev => ({...prev, books: s.size}));
    });
    const unsubPay = onSnapshot(query(collection(db, "paymentRequests"), where("status", "==", "pending")), (s) => {
      setPayments(s.docs.map(d => ({ id: d.id, ...d.data() })));
      setStats(prev => ({...prev, pending: s.size}));
    });
    const unsubCodes = onSnapshot(query(collection(db, "activationCodes"), orderBy("createdAt", "desc")), (s) => {
      setGeneratedCodes(s.docs.map(d => ({id: d.id, ...d.data()})));
    });

    return () => { unsubUsers(); unsubCourses(); unsubBooks(); unsubPay(); unsubCodes(); };
  }, []);

  // --- وظائف الكورسات ---
  const addQuestionToLesson = () => {
    setCurrentLesson({ ...currentLesson, quiz: [...currentLesson.quiz, currentQuestion] });
    setCurrentQuestion({ q: '', options: ['', '', '', ''], correct: 0 });
  };
  const addLessonToCourse = () => {
    setNewCourse({ ...newCourse, lessons: [...newCourse.lessons, { ...currentLesson, id: `les_${Date.now()}` }] });
    setCurrentLesson({ id: Date.now(), title: '', videoUrl: '', quiz: [] });
  };
  const saveFullCourse = async () => {
    await addDoc(collection(db, "courses_metadata"), { ...newCourse, createdAt: serverTimestamp() });
    alert("تم نشر الكورس المتكامل بنجاح!");
    setIsAddingCourse(false);
  };

  // --- وظائف الكتب ---
  const handleAddBook = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "library"), { ...newBook, createdAt: serverTimestamp() });
    alert("تم إضافة الكتاب للمكتبة");
    setNewBook({ title: '', grade: '1', url: '', thumbnail: '' });
  };

  // --- نظام توليد الأكواد الذكي ---
  const handleGenerateCodes = async () => {
    const { count, type, targetId } = codeGenSettings;
    if (!targetId && type !== 'general') return alert("برجاء اختيار الكورس أو المحاضرة المستهدفة");
    
    for(let i=0; i < count; i++) {
      const code = "MAFA-" + Math.random().toString(36).substring(2, 9).toUpperCase();
      await addDoc(collection(db, "activationCodes"), {
        code, 
        isUsed: false, 
        type, // 'full_course' or 'single_lesson'
        targetId, // ID الكورس أو ID الدرس
        createdAt: serverTimestamp()
      });
    }
    alert(`تم توليد ${count} كود بنجاح`);
  };

  return (
    <div className="admin-app-wrapper" style={{direction: 'rtl'}}>
      <aside className="cyber-sidebar">
        <div className="brand"><ShieldCheck color="#00f2ff" size={32} /><span>MAFA SYSTEM</span></div>
        <nav className="side-nav">
          <button onClick={() => setActiveSection('stats')} className={activeSection === 'stats' ? 'active' : ''}><LayoutDashboard size={20}/> الإحصائيات</button>
          <button onClick={() => setActiveSection('courses')} className={activeSection === 'courses' ? 'active' : ''}><Layers size={20}/> الكورسات</button>
          <button onClick={() => setActiveSection('books')} className={activeSection === 'books' ? 'active' : ''}><Book size={20}/> المكتبة</button>
          <button onClick={() => setActiveSection('users')} className={activeSection === 'users' ? 'active' : ''}><Users size={20}/> الطلاب</button>
          <button onClick={() => setActiveSection('payments')} className={activeSection === 'payments' ? 'active' : ''}><Wallet size={20}/> الدفع ({stats.pending})</button>
          <button onClick={() => setActiveSection('codes')} className={activeSection === 'codes' ? 'active' : ''}><Hash size={20}/> الأكواد</button>
        </nav>
      </aside>

      <main className="admin-body">
        <AnimatePresence mode="wait">
          
          {/* 1. الإحصائيات */}
          {activeSection === 'stats' && (
            <div className="stats-grid-pro">
              <StatCard icon={<Users/>} title="الطلاب" value={stats.students} color="blue" />
              <StatCard icon={<Layers/>} title="الكورسات" value={stats.courses} color="purple" />
              <StatCard icon={<Book/>} title="الكتب" value={stats.books} color="green" />
              <StatCard icon={<Wallet/>} title="طلبات معلقة" value={stats.pending} color="orange" />
            </div>
          )}

          {/* 2. إدارة الكورسات والدروس */}
          {activeSection === 'courses' && (
            <div className="section-card">
              <div className="card-header">
                <h3>📦 مستودع الكورسات</h3>
                {!isAddingCourse && <button className="btn-primary" onClick={() => setIsAddingCourse(true)}><Plus/> إنشاء كورس</button>}
              </div>

              {isAddingCourse ? (
                <div className="course-creator-box glass-card">
                  <div className="form-grid">
                    <input type="text" placeholder="عنوان الكورس" onChange={e => setNewCourse({...newCourse, title: e.target.value})} />
                    <select onChange={e => setNewCourse({...newCourse, grade: e.target.value})}><option value="1">1 ثانوي</option><option value="2">2 ثانوي</option><option value="3">3 ثانوي</option></select>
                    <input type="number" placeholder="السعر" onChange={e => setNewCourse({...newCourse, price: e.target.value})} />
                    <select onChange={e => setNewCourse({...newCourse, accessType: e.target.value})}><option value="full">كود يفتح الكورس كامل</option><option value="per_video">كود لكل محاضرة</option></select>
                  </div>

                  <div className="lesson-adder-section">
                    <h4>➕ إضافة محاضرة</h4>
                    <input type="text" placeholder="عنوان المحاضرة" value={currentLesson.title} onChange={e => setCurrentLesson({...currentLesson, title: e.target.value})} />
                    <input type="text" placeholder="رابط الفيديو" value={currentLesson.videoUrl} onChange={e => setCurrentLesson({...currentLesson, videoUrl: e.target.value})} />
                    
                    <div className="quiz-adder">
                        <h5>📝 أسئلة المحاضرة ({currentLesson.quiz.length})</h5>
                        <input type="text" placeholder="السؤال" value={currentQuestion.q} onChange={e => setCurrentQuestion({...currentQuestion, q: e.target.value})} />
                        <button onClick={addQuestionToLesson} className="btn-small">إضافة السؤال</button>
                    </div>
                    <button onClick={addLessonToCourse} className="btn-add-lesson">حفظ المحاضرة في الكورس</button>
                  </div>

                  <button className="btn-save-all" onClick={saveFullCourse}>نشر الكورس المتكامل ✅</button>
                  <button onClick={()=>setIsAddingCourse(false)}>إلغاء</button>
                </div>
              ) : (
                <div className="list-display">
                    {courses.map(c => <div key={c.id} className="item-row"><span>{c.title}</span> <span>{c.lessons.length} فيديو</span> <button onClick={()=>deleteDoc(doc(db,"courses_metadata",c.id))}><Trash2 size={16}/></button></div>)}
                </div>
              )}
            </div>
          )}

          {/* 3. إدارة المكتبة (الكتب) */}
          {activeSection === 'books' && (
            <div className="section-card">
               <h3>📚 إضافة كتب ومذكرات</h3>
               <form onSubmit={handleAddBook} className="form-grid">
                  <input type="text" placeholder="عنوان الكتاب" value={newBook.title} onChange={e => setNewBook({...newBook, title: e.target.value})} />
                  <input type="text" placeholder="رابط PDF" value={newBook.url} onChange={e => setNewBook({...newBook, url: e.target.value})} />
                  <button type="submit" className="btn-primary">نشر الكتاب</button>
               </form>
               <div className="list-display">
                  {books.map(b => <div key={b.id} className="item-row">{b.title} <button onClick={()=>deleteDoc(doc(db,"library",b.id))}><Trash2 size={16}/></button></div>)}
               </div>
            </div>
          )}

          {/* 4. إدارة الأكواد الذكية */}
          {activeSection === 'codes' && (
            <div className="section-card">
               <h3>🎫 نظام توليد الأكواد المخصصة</h3>
               <div className="code-gen-box">
                  <select onChange={e => setCodeGenSettings({...codeGenSettings, type: e.target.value})}>
                    <option value="full_course">كود يفتح كورس كامل</option>
                    <option value="single_lesson">كود يفتح محاضرة واحدة</option>
                  </select>

                  <select onChange={e => setCodeGenSettings({...codeGenSettings, targetId: e.target.value})}>
                    <option value="">-- اختر الهدف --</option>
                    {courses.map(c => (
                        <optgroup key={c.id} label={c.title}>
                            <option value={c.id}>الكورس كاملاً</option>
                            {c.lessons.map(l => <option key={l.id} value={l.id}>فيديو: {l.title}</option>)}
                        </optgroup>
                    ))}
                  </select>

                  <input type="number" value={codeGenSettings.count} onChange={e => setCodeGenSettings({...codeGenSettings, count: e.target.value})} />
                  <button onClick={handleGenerateCodes} className="btn-primary">توليد الأكواد</button>
               </div>

               <div className="codes-grid">
                  {generatedCodes.slice(0, 50).map(c => (
                    <div key={c.id} className={`code-tag ${c.isUsed ? 'used' : ''}`}>
                        {c.code} <small>{c.type === 'full_course' ? '📦' : '🎥'}</small>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {/* 5. الطلاب والدفع (كما في الكود السابق) */}
          {activeSection === 'users' && (
            <div className="section-card">
                <h3>إدارة الطلاب</h3>
                <table className="modern-table">
                    <thead><tr><th>الاسم</th><th>الحالة</th><th>إجراء</th></tr></thead>
                    <tbody>
                        {allUsers.map(u => (
                            <tr key={u.id}>
                                <td>{u.name}</td>
                                <td>{u.isSecondaryActive ? 'نشط' : 'معطل'}</td>
                                <td><button onClick={()=>updateDoc(doc(db,"users",u.id), {isSecondaryActive: !u.isSecondaryActive})}><Unlock/></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
};

const StatCard = ({icon, title, value, color}) => (
  <div className={`stat-card-new ${color}`}>
    <div className="s-icon">{icon}</div>
    <div className="s-data"><h4>{value}</h4><p>{title}</p></div>
  </div>
);

export default AdminDash;
