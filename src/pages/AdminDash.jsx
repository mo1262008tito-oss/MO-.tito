
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
  Hash, Video, HelpCircle, Layers, ClipboardList, Book, Save
}
  from 'lucide-react'; 

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

  // حالة المحاضرة الحالية (يتم تصفيرها بعد إضافة المحاضرة للكورس)
  const [currentLesson, setCurrentLesson] = useState({ 
    id: Date.now(), 
    title: '', 
    videoUrl: '', 
    description: '',
    quiz: [] 
  });

  // حالة السؤال الحالي (يتم تصفيره بعد إضافة السؤال للمحاضرة)
  const [currentQuestion, setCurrentQuestion] = useState({ 
    question: '', 
    options: ['', '', '', ''], 
    correctAnswer: 0 
  });

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

  // --- وظائف إضافة الأسئلة (Quiz Logic) ---
  const handleOptionChange = (index, value) => {
    const updatedOptions = [...currentQuestion.options];
    updatedOptions[index] = value;
    setCurrentQuestion({ ...currentQuestion, options: updatedOptions });
  };

  const addQuestionToLesson = () => {
    if (!currentQuestion.question) return alert("اكتب السؤال أولاً!");
    setCurrentLesson({ ...currentLesson, quiz: [...currentLesson.quiz, currentQuestion] });
    // تصفير السؤال لإضافة سؤال جديد
    setCurrentQuestion({ question: '', options: ['', '', '', ''], correctAnswer: 0 });
  };

  const addLessonToCourse = () => {
    if (!currentLesson.title || !currentLesson.videoUrl) return alert("أكمل بيانات المحاضرة!");
    setNewCourse({ ...newCourse, lessons: [...newCourse.lessons, { ...currentLesson, id: `les_${Date.now()}` }] });
    // تصفير المحاضرة لإضافة محاضرة جديدة
    setCurrentLesson({ id: Date.now(), title: '', videoUrl: '', description: '', quiz: [] });
  };

  const saveFullCourse = async () => {
    if (newCourse.lessons.length === 0) return alert("أضف محاضرة واحدة على الأقل!");
    await addDoc(collection(db, "courses_metadata"), { ...newCourse, createdAt: serverTimestamp() });
    alert("تم نشر الكورس المتكامل بنجاح! 🚀");
    setIsAddingCourse(false);
    setNewCourse({ title: '', instructor: '', subject: 'فيزياء', grade: '1', price: 0, thumbnail: '', accessType: 'full', lessons: [] });
  };

  // --- وظائف الكتب والأكواد (كما هي مع تحسينات) ---
  const handleAddBook = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "library"), { ...newBook, createdAt: serverTimestamp() });
    alert("تم إضافة الكتاب للمكتبة");
    setNewBook({ title: '', grade: '1', url: '', thumbnail: '' });
  };

  const handleGenerateCodes = async () => {
    const { count, type, targetId } = codeGenSettings;
    if (!targetId) return alert("برجاء اختيار الكورس أو المحاضرة المستهدفة");
    
    for(let i=0; i < count; i++) {
      const code = "MAFA-" + Math.random().toString(36).substring(2, 9).toUpperCase();
      await addDoc(collection(db, "activationCodes"), {
        code, isUsed: false, type, targetId, createdAt: serverTimestamp()
      });
    }
    alert(`تم توليد ${count} كود بنجاح`);
  };

  return (
    <div className="admin-app-wrapper" style={{direction: 'rtl'}}>
      <aside className="cyber-sidebar">
        <div className="brand"><ShieldCheck color="#00f2ff" size={32} /><span>لوحة القائد محمود</span></div>
        <nav className="side-nav">
          <button onClick={() => setActiveSection('stats')} className={activeSection === 'stats' ? 'active' : ''}><LayoutDashboard size={20}/> الإحصائيات</button>
          <button onClick={() => setActiveSection('courses')} className={activeSection === 'courses' ? 'active' : ''}><Layers size={20}/> إدارة المحتوى</button>
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

          {/* 2. إدارة الكورسات والدروس مع نظام الامتحانات */}
          {activeSection === 'courses' && (
            <div className="section-card">
              <div className="card-header">
                <h3>📦 مستودع الكورسات والمحاضرات</h3>
                {!isAddingCourse && <button className="btn-primary" onClick={() => setIsAddingCourse(true)}><Plus/> إنشاء كورس جديد</button>}
              </div>

              {isAddingCourse ? (
                <div className="course-creator-box glass-card">
                  <div className="form-step">
                    <h4>1️⃣ بيانات الكورس الأساسية</h4>
                    <div className="form-grid">
                      <input type="text" placeholder="عنوان الكورس (مثال: فيزياء الحديثة)" onChange={e => setNewCourse({...newCourse, title: e.target.value})} />
                      <input type="text" placeholder="اسم المحاضر" onChange={e => setNewCourse({...newCourse, instructor: e.target.value})} />
                      <select onChange={e => setNewCourse({...newCourse, grade: e.target.value})}><option value="1">1 ثانوي</option><option value="2">2 ثانوي</option><option value="3">3 ثانوي</option></select>
                      <input type="number" placeholder="سعر الكورس" onChange={e => setNewCourse({...newCourse, price: e.target.value})} />
                    </div>
                  </div>

                  <div className="lesson-adder-section neon-border">
                    <h4>2️⃣ إضافة المحاضرات والأسئلة</h4>
                    <div className="lesson-inputs">
                      <input type="text" placeholder="عنوان المحاضرة" value={currentLesson.title} onChange={e => setCurrentLesson({...currentLesson, title: e.target.value})} />
                      <input type="text" placeholder="رابط فيديو اليوتيوب" value={currentLesson.videoUrl} onChange={e => setCurrentLesson({...currentLesson, videoUrl: e.target.value})} />
                      <textarea placeholder="وصف سريع للمحاضرة" value={currentLesson.description} onChange={e => setCurrentLesson({...currentLesson, description: e.target.value})}></textarea>
                    </div>

                    <div className="quiz-constructor">
                        <h5>📝 إنشاء امتحان لهذه المحاضرة ({currentLesson.quiz.length} أسئلة مضافة)</h5>
                        <div className="quiz-form-box">
                          <input type="text" placeholder="نص السؤال" value={currentQuestion.question} onChange={e => setCurrentQuestion({...currentQuestion, question: e.target.value})} />
                          <div className="options-input-grid">
                            {currentQuestion.options.map((opt, idx) => (
                              <div key={idx} className="option-row">
                                <span>{idx + 1}</span>
                                <input type="text" placeholder={`الاختيار ${idx+1}`} value={opt} onChange={e => handleOptionChange(idx, e.target.value)} />
                                <input type="radio" name="correct" checked={currentQuestion.correctAnswer === idx} onChange={() => setCurrentQuestion({...currentQuestion, correctAnswer: idx})} />
                              </div>
                            ))}
                          </div>
                          <button onClick={addQuestionToLesson} className="btn-add-q"><HelpCircle size={16}/> إضافة السؤال للامتحان</button>
                        </div>
                    </div>
                    
                    <button onClick={addLessonToCourse} className="btn-add-lesson"><Video size={18}/> حفظ المحاضرة داخل الكورس</button>
                  </div>

                  <div className="added-lessons-preview">
                    <h5>المحاضرات التي سيتم نشرها: {newCourse.lessons.length}</h5>
                    {newCourse.lessons.map((l, i) => (
                      <div key={i} className="mini-lesson-card">
                        {l.title} <small>({l.quiz.length} سؤال)</small>
                      </div>
                    ))}
                  </div>

                  <div className="final-actions">
                    <button className="btn-save-all" onClick={saveFullCourse}><Save/> نشر الكورس كاملاً للطالب</button>
                    <button className="btn-cancel" onClick={()=>setIsAddingCourse(false)}><X/> إلغاء</button>
                  </div>
                </div>
              ) : (
                <div className="list-display">
                    {courses.map(c => (
                      <div key={c.id} className="item-row">
                        <div className="c-info">
                          <strong>{c.title}</strong>
                          <span>{c.lessons?.length || 0} محاضرة</span>
                        </div>
                        <button className="btn-delete" onClick={()=>deleteDoc(doc(db,"courses_metadata",c.id))}><Trash2 size={18}/></button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* الأقسام الأخرى (كتب، أكواد، طلاب) تتبع نفس النمط المنظم */}
          {/* ... */}

        </AnimatePresence>
      </main>
    </div>
  );
};

const StatCard = ({icon, title, value, color}) => (
  <motion.div whileHover={{y: -5}} className={`stat-card-new ${color}`}>
    <div className="s-icon">{icon}</div>
    <div className="s-data"><h4>{value}</h4><p>{title}</p></div>
  </motion.div>
);

export default AdminDash;


