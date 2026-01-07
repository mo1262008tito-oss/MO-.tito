import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase'; // ✅ تم إضافة auth هنا لإصلاح صلاحيات النشر
import { 
  collection, query, getDocs, updateDoc, doc, addDoc, 
  onSnapshot, serverTimestamp, where, deleteDoc, orderBy, arrayUnion, increment 
} from "firebase/firestore";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, BookOpen, Plus, Check, X, ShieldCheck, Search,
  Lock, Unlock, DollarSign, FileText, LayoutDashboard,
  PackagePlus, Download, Eye, Trash2, UserCheck, Wallet, ShieldAlert,
  Hash, Video, HelpCircle, Layers, ClipboardList, Book, Save, Star, Link, Clock, Copy, Zap, Bell, ShieldBan, MonitorPlay, Trash,
  BookMarked, Library
} from 'lucide-react'; 

import './AdminDash.css';

const AdminDash = () => {
  const [activeSection, setActiveSection] = useState('stats');
  const [addMode, setAddMode] = useState('full-course'); 
  const [stats, setStats] = useState({ students: 0, courses: 0, codes: 0, books: 0 });
  const [courses, setCourses] = useState([]);
  const [books, setBooks] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [generatedCodes, setGeneratedCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // --- حالات الكورسات المحدثة ---
  const [newCourse, setNewCourse] = useState({
    title: '', instructor: 'أ. محمود فرج', subject: 'فيزياء', 
    level: 'ثانوي', 
    grade: '1 ثانوي', 
    price: '', thumbnail: '', description: '', lessons: [] 
  });

  // --- حالة المكتبة (الكتب) ---
  const [newBook, setNewBook] = useState({
    title: '', level: 'ثانوي', grade: '1 ثانوي', pdfUrl: '', thumbnail: '', price: '0'
  });

  const [lessonForm, setLessonForm] = useState({
    title: '', videoUrl: '', pdfUrl: '', duration: '', targetCourseId: ''
  });

  const [codeSettings, setCodeSettings] = useState({ count: 10, targetId: '' });

  useEffect(() => {
    setLoading(true);
    const unsubUsers = onSnapshot(collection(db, "users"), (s) => {
        setAllUsers(s.docs.map(d => ({id: d.id, ...d.data()})));
        setStats(prev => ({...prev, students: s.size}));
    });

    const unsubCourses = onSnapshot(collection(db, "courses_metadata"), (s) => {
        setCourses(s.docs.map(d => ({id: d.id, ...d.data()})));
        setStats(prev => ({...prev, courses: s.size}));
    });

    const unsubBooks = onSnapshot(collection(db, "library_books"), (s) => {
        setBooks(s.docs.map(d => ({id: d.id, ...d.data()})));
        setStats(prev => ({...prev, books: s.size}));
    });

    const unsubCodes = onSnapshot(query(collection(db, "activationCodes"), orderBy("createdAt", "desc")), (s) => {
        const codes = s.docs.map(d => ({id: d.id, ...d.data()}));
        setGeneratedCodes(codes);
        setStats(prev => ({...prev, codes: s.size, usedCodes: codes.filter(c => c.isUsed).length}));
    });

    setLoading(false);
    return () => { unsubUsers(); unsubCourses(); unsubCodes(); unsubBooks(); };
  }, []);

  // --- وظائف النشر المحدثة ---
  const handlePublishCourse = async () => {
    if(!newCourse.title || !newCourse.price) return alert("❌ أكمل بيانات الكورس الأساسية");
    if(!auth.currentUser) return alert("❌ خطأ: لم يتم التعرف على هويتك كأدمن. سجل دخولك أولاً.");
    
    setLoading(true);
    try {
      await addDoc(collection(db, "courses_metadata"), {
        ...newCourse,
        adminId: auth.currentUser.uid, // ربط الطلب بـ UID الأدمن لتخطي الـ Rules
        createdAt: serverTimestamp(),
        studentsCount: 0
      });
      alert("🚀 تم نشر الكورس بنجاح لطلاب " + newCourse.level);
      setNewCourse({ title: '', instructor: 'أ. محمود فرج', subject: 'فيزياء', level: 'ثانوي', grade: '1 ثانوي', price: '', thumbnail: '', description: '', lessons: [] });
    } catch (e) { alert("خطأ في النشر: " + e.message); }
    setLoading(false);
  };

  const handleAddBook = async () => {
    if(!newBook.title || !newBook.pdfUrl) return alert("❌ أكمل بيانات الكتاب");
    if(!auth.currentUser) return alert("❌ سجل دخولك أولاً");

    setLoading(true);
    try {
      await addDoc(collection(db, "library_books"), {
        ...newBook,
        adminId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
      alert("📚 تم إضافة الكتاب للمكتبة بنجاح");
      setNewBook({ title: '', level: 'ثانوي', grade: '1 ثانوي', pdfUrl: '', thumbnail: '', price: '0' });
    } catch (e) { alert("خطأ: " + e.message); }
    setLoading(false);
  };

  const handleAddLesson = async () => {
    if(!lessonForm.targetCourseId || !lessonForm.title) return alert("❌ اختر الكورس وعنوان المحاضرة");
    setLoading(true);
    try {
        const courseRef = doc(db, "courses_metadata", lessonForm.targetCourseId);
        await updateDoc(courseRef, {
            lessons: arrayUnion({
                id: Date.now(),
                ...lessonForm,
                createdAt: new Date().toISOString()
            })
        });
        alert("✅ تم إضافة المحاضرة بنجاح");
        setLessonForm({ title: '', videoUrl: '', pdfUrl: '', duration: '', targetCourseId: '' });
    } catch (e) { alert("خطأ: " + e.message); }
    setLoading(false);
  };

  const generateMassCodes = async () => {
    if (!codeSettings.targetId) return alert("❌ اختر الكورس المستهدف أولاً!");
    setLoading(true);
    try {
      for (let i = 0; i < codeSettings.count; i++) {
        const code = "MAFA-" + Math.random().toString(36).substring(2, 9).toUpperCase();
        await addDoc(collection(db, "activationCodes"), {
          code,
          targetId: codeSettings.targetId,
          isUsed: false,
          adminId: auth.currentUser?.uid,
          createdAt: serverTimestamp()
        });
      }
      alert(`✅ تم توليد ${codeSettings.count} كود`);
    } catch (e) { console.error(e); alert("خطأ في توليد الأكواد: " + e.message); }
    setLoading(false);
  };

  const deleteItem = async (coll, id) => {
    if(window.confirm("هل أنت متأكد من الحذف نهائياً؟")) {
        try {
            await deleteDoc(doc(db, coll, id));
        } catch (e) { alert("خطأ في الحذف: " + e.message); }
    }
  };

  const gradeOptions = {
    'ابتدائي': ['1 ابتدائي', '2 ابتدائي', '3 ابتدائي', '4 ابتدائي', '5 ابتدائي', '6 ابتدائي'],
    'اعدادي': ['1 اعدادي', '2 اعدادي', '3 اعدادي'],
    'ثانوي': ['1 ثانوي', '2 ثانوي', '3 ثانوي']
  };

  return (
    <div className="admin-nebula-root">
      {loading && <div className="admin-loader-overlay"><div className="spinner"></div><span>جاري تحديث السحابة...</span></div>}

      <aside className="side-dock">
        <div className="dock-logo">
            <Zap className="neon-icon" fill="#00f2ff" /> 
            <span>TITO PANEL</span>
        </div>
        <nav className="dock-menu">
          <button onClick={() => setActiveSection('stats')} className={activeSection === 'stats' ? 'active' : ''}><LayoutDashboard /> الإحصائيات</button>
          <button onClick={() => setActiveSection('content')} className={activeSection === 'content' ? 'active' : ''}><Layers /> الكورسات</button>
          <button onClick={() => setActiveSection('library')} className={activeSection === 'library' ? 'active' : ''}><Library /> المكتبة</button>
          <button onClick={() => setActiveSection('codes')} className={activeSection === 'codes' ? 'active' : ''}><Hash /> منظومة الأكواد</button>
          <button onClick={() => setActiveSection('users')} className={activeSection === 'users' ? 'active' : ''}><Users /> شؤون الطلاب</button>
        </nav>
      </aside>

      <main className="main-content">
        {activeSection === 'stats' && (
          <motion.div initial={{y: 20, opacity:0}} animate={{y:0, opacity:1}} className="stats-wrapper">
            <div className="stats-grid">
                <StatCard icon={<Users />} label="طالب مسجل" value={stats.students} color="#00f2ff" />
                <StatCard icon={<Video />} label="كورس متاح" value={stats.courses} color="#7000ff" />
                <StatCard icon={<BookMarked />} label="كتاب بالمكتبة" value={stats.books} color="#00ff88" />
                <StatCard icon={<Hash />} label="كود مولّد" value={stats.codes} color="#ff007a" />
            </div>
            
            <div className="quick-view-section">
                <div className="glass-card">
                    <h3><MonitorPlay size={20}/> نظرة سريعة</h3>
                    <div className="mini-list">
                        {courses.slice(0, 5).map(c => (
                            <div key={c.id} className="mini-item">
                                <span>{c.title} <small>({c.level})</small></span>
                                <button onClick={() => deleteItem("courses_metadata", c.id)} className="text-red"><Trash size={16}/></button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          </motion.div>
        )}

        {activeSection === 'users' && (
            <div className="users-section glass">
                <div className="section-header">
                    <h3><Users /> تصنيف المشتركين</h3>
                    <div className="search-box">
                        <Search size={18} />
                        <input placeholder="ابحث عن طالب..." onChange={(e)=>setSearchTerm(e.target.value)} />
                    </div>
                </div>
                <div className="table-responsive">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>الطالب</th>
                                <th>المرحلة الدراسية</th>
                                <th>النقاط</th>
                                <th>الحالة</th>
                                <th>إجراء</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allUsers.filter(u => u.name?.toLowerCase().includes(searchTerm.toLowerCase())).map(user => (
                                <tr key={user.id}>
                                    <td>
                                        <div className="u-cell">
                                            <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${user.email}`} alt="" />
                                            <div>
                                                <p>{user.name}</p>
                                                <small>{user.email}</small>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${user.grade?.includes('ثانوي') ? 'sec' : 'prim'}`}>
                                            {user.grade || 'غير محدد'}
                                        </span>
                                    </td>
                                    <td><Star size={14} color="gold"/> {user.points || 0}</td>
                                    <td>
                                        <span className={`status-dot ${user.isSecondaryActive ? 'online' : 'offline'}`}></span>
                                        {user.isSecondaryActive ? 'نشط' : 'محظور'}
                                    </td>
                                    <td>
                                        <button className="icon-btn" onClick={async () => {
                                            const userRef = doc(db, "users", user.id);
                                            await updateDoc(userRef, { isSecondaryActive: !user.isSecondaryActive });
                                        }}>
                                            {user.isSecondaryActive ? <Lock size={16} color="#ff4b2b"/> : <Unlock size={16} color="#00ff88"/>}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {activeSection === 'content' && (
          <div className="content-manager">
             <div className="mode-tabs">
                <button className={addMode === 'full-course' ? 'active' : ''} onClick={()=>setAddMode('full-course')}>كورس جديد</button>
                <button className={addMode === 'single-lesson' ? 'active' : ''} onClick={()=>setAddMode('single-lesson')}>إضافة دروس</button>
             </div>

             {addMode === 'full-course' ? (
                 <div className="editor-container">
                    <div className="form-group">
                        <label>إعدادات الكورس لجميع المراحل</label>
                        <div className="input-row">
                            <input placeholder="عنوان الكورس" value={newCourse.title} onChange={e => setNewCourse({...newCourse, title: e.target.value})} />
                            <input placeholder="السعر (EGP)" type="number" value={newCourse.price} onChange={e => setNewCourse({...newCourse, price: e.target.value})} />
                        </div>
                        <div className="input-row">
                            <select value={newCourse.level} onChange={e => setNewCourse({...newCourse, level: e.target.value, grade: gradeOptions[e.target.value][0]})}>
                                <option value="ابتدائي">ابتدائي</option>
                                <option value="اعدادي">اعدادي</option>
                                <option value="ثانوي">ثانوي</option>
                            </select>
                            <select value={newCourse.grade} onChange={e => setNewCourse({...newCourse, grade: e.target.value})}>
                                {gradeOptions[newCourse.level].map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                        <input placeholder="رابط صورة الغلاف" value={newCourse.thumbnail} onChange={e => setNewCourse({...newCourse, thumbnail: e.target.value})} />
                        <textarea placeholder="وصف الكورس..." value={newCourse.description} onChange={e => setNewCourse({...newCourse, description: e.target.value})}></textarea>
                    </div>
                    <button className="publish-btn" onClick={handlePublishCourse}><PackagePlus /> نشر الكورس الآن</button>
                 </div>
             ) : (
                <div className="editor-container">
                    <div className="form-group">
                        <label>إضافة محاضرة جديدة</label>
                        <select className="full-select" value={lessonForm.targetCourseId} onChange={e => setLessonForm({...lessonForm, targetCourseId: e.target.value})}>
                            <option value="">اختر الكورس...</option>
                            {courses.map(c => <option key={c.id} value={c.id}>{c.title} ({c.grade})</option>)}
                        </select>
                        <input placeholder="عنوان المحاضرة" value={lessonForm.title} onChange={e => setLessonForm({...lessonForm, title: e.target.value})} />
                        <div className="input-row">
                            <input placeholder="رابط الفيديو" value={lessonForm.videoUrl} onChange={e => setLessonForm({...lessonForm, videoUrl: e.target.value})} />
                            <input placeholder="رابط PDF" value={lessonForm.pdfUrl} onChange={e => setLessonForm({...lessonForm, pdfUrl: e.target.value})} />
                        </div>
                    </div>
                    <button className="publish-btn blue" onClick={handleAddLesson}><MonitorPlay /> تحديث محتوى الكورس</button>
                </div>
             )}
          </div>
        )}

        {activeSection === 'library' && (
            <div className="content-manager">
                <div className="editor-container">
                    <div className="form-group">
                        <label>إضافة كتاب أو مذكرة للمكتبة</label>
                        <div className="input-row">
                            <input placeholder="اسم الكتاب" value={newBook.title} onChange={e => setNewBook({...newBook, title: e.target.value})} />
                            <input placeholder="السعر (0 للمجاني)" value={newBook.price} onChange={e => setNewBook({...newBook, price: e.target.value})} />
                        </div>
                        <div className="input-row">
                            <select value={newBook.level} onChange={e => setNewBook({...newBook, level: e.target.value, grade: gradeOptions[e.target.value][0]})}>
                                <option value="ابتدائي">ابتدائي</option>
                                <option value="اعدادي">اعدادي</option>
                                <option value="ثانوي">ثانوي</option>
                            </select>
                            <select value={newBook.grade} onChange={e => setNewBook({...newBook, grade: e.target.value})}>
                                {gradeOptions[newBook.level].map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                        <input placeholder="رابط الـ PDF" value={newBook.pdfUrl} onChange={e => setNewBook({...newBook, pdfUrl: e.target.value})} />
                        <input placeholder="رابط غلاف الكتاب" value={newBook.thumbnail} onChange={e => setNewBook({...newBook, thumbnail: e.target.value})} />
                    </div>
                    <button className="publish-btn" style={{background: '#00ff88', color: '#000'}} onClick={handleAddBook}><BookOpen /> إضافة للمكتبة</button>
                </div>

                <div className="glass-card" style={{marginTop: '20px'}}>
                    <h3>المكتبة الحالية ({books.length})</h3>
                    <div className="mini-list">
                        {books.map(b => (
                            <div key={b.id} className="mini-item">
                                <span>{b.title} <small>({b.grade})</small></span>
                                <button onClick={() => deleteItem("library_books", b.id)} className="text-red"><Trash size={16}/></button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {activeSection === 'codes' && (
            <div className="codes-manager">
                <div className="control-card glass">
                    <h3><Zap size={20} color="gold"/> توليد أكواد تفعيل</h3>
                    <div className="gen-form">
                        <input type="number" value={codeSettings.count} onChange={e => setCodeSettings({...codeSettings, count: parseInt(e.target.value)})} />
                        <select onChange={e => setCodeSettings({...codeSettings, targetId: e.target.value})}>
                            <option value="">اختر الكورس...</option>
                            {courses.map(c => <option key={c.id} value={c.id}>{c.title} ({c.grade})</option>)}
                        </select>
                        <button onClick={generateMassCodes} className="btn-gen">إنشاء الأكواد</button>
                    </div>
                </div>

                <div className="codes-display">
                    <div className="codes-grid">
                        {generatedCodes.slice(0, 24).map(code => (
                            <div key={code.id} className={`code-pill ${code.isUsed ? 'used' : ''}`}>
                                <code>{code.code}</code>
                                <button onClick={()=>navigator.clipboard.writeText(code.code)}><Copy size={12}/></button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}
      </main>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <div className="stat-card" style={{ '--card-color': color }}>
    <div className="stat-icon">{icon}</div>
    <div className="stat-info">
      <h3>{value}</h3>
      <p>{label}</p>
    </div>
  </div>
);

export default AdminDash;
