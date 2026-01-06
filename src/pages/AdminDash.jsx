import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, query, getDocs, updateDoc, doc, addDoc, 
  onSnapshot, serverTimestamp, where, deleteDoc, orderBy, arrayUnion, increment 
} from "firebase/firestore";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, BookOpen, Plus, Check, X, ShieldCheck, Search,
  Lock, Unlock, DollarSign, FileText, LayoutDashboard,
  PackagePlus, Download, Eye, Trash2, UserCheck, Wallet, ShieldAlert,
  Hash, Video, HelpCircle, Layers, ClipboardList, Book, Save, Star, Link, Clock, Copy, Zap, Bell, ShieldBan
} from 'lucide-react'; 

import './AdminDash.css';

const AdminDash = () => {
  const [activeSection, setActiveSection] = useState('stats');
  const [addMode, setAddMode] = useState('full-course'); 
  const [stats, setStats] = useState({ students: 0, courses: 0, codes: 0, revenue: 0 });
  const [courses, setCourses] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [generatedCodes, setGeneratedCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // --- حالات الكورسات ---
  const [newCourse, setNewCourse] = useState({
    title: '', instructor: 'أ. محمود فرج', subject: 'فيزياء', grade: '1 ثانوي', 
    price: 0, thumbnail: '', poster: '', description: '',
    features: '', requirements: '', lessons: [] 
  });

  // --- حالة المحاضرة والأسئلة ---
  const [currentLesson, setCurrentLesson] = useState({ 
    title: '', videoUrl: '', description: '', pdfUrl: '', duration: '', quiz: [], targetCourseId: ''
  });
  const [currentQuestion, setCurrentQuestion] = useState({ 
    question: '', options: ['', '', '', ''], correctAnswer: 0 
  });

  // --- نظام الأكواد ---
  const [codeSettings, setCodeSettings] = useState({ count: 10, targetId: '', type: 'full_course' });

  useEffect(() => {
    setLoading(true);
    // جلب الإحصائيات والطلاب
    const unsubUsers = onSnapshot(collection(db, "users"), (s) => {
        const usersData = s.docs.map(d => ({id: d.id, ...d.data()}));
        setAllUsers(usersData);
        setStats(prev => ({...prev, students: s.size}));
    });

    // جلب الكورسات
    const unsubCourses = onSnapshot(collection(db, "courses_metadata"), (s) => {
        setCourses(s.docs.map(d => ({id: d.id, ...d.data()})));
        setStats(prev => ({...prev, courses: s.size}));
    });

    // جلب الأكواد
    const unsubCodes = onSnapshot(query(collection(db, "activationCodes"), orderBy("createdAt", "desc")), (s) => {
        setGeneratedCodes(s.docs.map(d => ({id: d.id, ...d.data()})));
        setStats(prev => ({...prev, codes: s.size}));
    });

    setLoading(false);
    return () => { unsubUsers(); unsubCourses(); unsubCodes(); };
  }, []);

  // --- وظائف التحكم في المستخدمين ---
  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        isSecondaryActive: !currentStatus
      });
      alert("✅ تم تحديث حالة الطالب بنجاح");
    } catch (e) { console.error(e); }
  };

  // --- وظائف الأكواد ---
  const generateMassCodes = async () => {
    if (!codeSettings.targetId) return alert("❌ اختر الكورس المستهدف أولاً!");
    setLoading(true);
    try {
      for (let i = 0; i < codeSettings.count; i++) {
        const code = "MAFA-" + Math.random().toString(36).substring(2, 10).toUpperCase();
        await addDoc(collection(db, "activationCodes"), {
          code,
          targetId: codeSettings.targetId,
          isUsed: false,
          createdAt: serverTimestamp(),
          createdBy: "Admin"
        });
      }
      alert(`✅ تم توليد ${codeSettings.count} كود بنجاح`);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  // --- إضافة سؤال للمحاضرة ---
  const addQuestionToLesson = () => {
    if(!currentQuestion.question) return;
    setCurrentLesson({
        ...currentLesson,
        quiz: [...currentLesson.quiz, currentQuestion]
    });
    setCurrentQuestion({ question: '', options: ['', '', '', ''], correctAnswer: 0 });
    alert("❓ تم إضافة السؤال للمحاضرة");
  };

  return (
    <div className="admin-nebula-root">
      {/* سكرين التحميل */}
      {loading && <div className="admin-loader">جاري جلب البيانات من السحابة...</div>}

      <aside className="side-dock">
        <div className="dock-logo">
            <Zap className="neon-icon" /> 
            <span>تيتو أدمن</span>
        </div>
        <nav className="dock-menu">
          <button onClick={() => setActiveSection('stats')} className={activeSection === 'stats' ? 'active' : ''}><LayoutDashboard /> الإحصائيات</button>
          <button onClick={() => setActiveSection('content')} className={activeSection === 'content' ? 'active' : ''}><Layers /> المحتوى</button>
          <button onClick={() => setActiveSection('codes')} className={activeSection === 'codes' ? 'active' : ''}><Hash /> الأكواد</button>
          <button onClick={() => setActiveSection('users')} className={activeSection === 'users' ? 'active' : ''}><Users /> الطلاب</button>
        </nav>
      </aside>

      <main className="main-content">
        {/* 1. قسم الإحصائيات المطور */}
        {activeSection === 'stats' && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="stats-grid">
            <StatCard icon={<Users />} label="إجمالي الطلاب" value={stats.students} color="#00f2ff" />
            <StatCard icon={<Video />} label="الكورسات النشطة" value={stats.courses} color="#7000ff" />
            <StatCard icon={<Hash />} label="أكواد التفعيل" value={stats.codes} color="#ff007a" />
            <StatCard icon={<Wallet />} label="دخل المنصة (L.E)" value={allUsers.length * 100} color="#00ff88" />
          </motion.div>
        )}

        {/* 2. إدارة الطلاب (ميزة جديدة) */}
        {activeSection === 'users' && (
            <div className="users-section glass">
                <div className="section-header">
                    <h3><Users /> إدارة المشتركين</h3>
                    <div className="search-box">
                        <Search size={18} />
                        <input placeholder="ابحث باسم الطالب أو البريد..." onChange={(e)=>setSearchTerm(e.target.value)} />
                    </div>
                </div>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>الطالب</th>
                            <th>المستوى</th>
                            <th>الحالة</th>
                            <th>رقم ولي الأمر</th>
                            <th>إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allUsers.filter(u => u.name?.includes(searchTerm)).map(user => (
                            <tr key={user.id}>
                                <td>
                                    <div className="user-info">
                                        <span className="user-name">{user.name}</span>
                                        <span className="user-email">{user.email}</span>
                                    </div>
                                </td>
                                <td>{user.level || 'غير محدد'}</td>
                                <td>
                                    <span className={`badge ${user.isSecondaryActive ? 'active' : 'inactive'}`}>
                                        {user.isSecondaryActive ? 'مشترك' : 'غير نشط'}
                                    </span>
                                </td>
                                <td>{user.parentPhone || '---'}</td>
                                <td>
                                    <button onClick={() => toggleUserStatus(user.id, user.isSecondaryActive)} className="action-btn">
                                        {user.isSecondaryActive ? <ShieldBan color="red" /> : <ShieldCheck color="green" />}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {/* 3. قسم المحتوى */}
        {activeSection === 'content' && (
          <div className="content-area">
             <div className="tab-switch">
                <button className={addMode === 'full-course' ? 'active' : ''} onClick={()=>setAddMode('full-course')}>كورس جديد</button>
                <button className={addMode === 'single-lesson' ? 'active' : ''} onClick={()=>setAddMode('single-lesson')}>إضافة محاضرة</button>
             </div>

             {addMode === 'full-course' ? (
                 <div className="editor-card glass">
                    <div className="input-grid">
                        <input placeholder="اسم الكورس" onChange={e => setNewCourse({...newCourse, title: e.target.value})} />
                        <input placeholder="سعر الكورس" type="number" onChange={e => setNewCourse({...newCourse, price: e.target.value})} />
                        <select onChange={e => setNewCourse({...newCourse, grade: e.target.value})}>
                            <option>1 ثانوي</option><option>2 ثانوي</option><option>3 ثانوي</option>
                        </select>
                    </div>
                    
                    {/* نظام إضافة أسئلة المحاضرة داخل الكورس */}
                    <div className="quiz-builder">
                        <h4><ClipboardList /> إضافة بنك أسئلة للمحاضرة الحالية</h4>
                        <input placeholder="السؤال" value={currentQuestion.question} onChange={e=>setCurrentQuestion({...currentQuestion, question: e.target.value})} />
                        <div className="options-grid">
                            {currentQuestion.options.map((opt, i) => (
                                <input key={i} placeholder={`اختيار ${i+1}`} value={opt} onChange={e => {
                                    const newOpts = [...currentQuestion.options];
                                    newOpts[i] = e.target.value;
                                    setCurrentQuestion({...currentQuestion, options: newOpts});
                                }} />
                            ))}
                        </div>
                        <button onClick={addQuestionToLesson} className="btn-add-q">إضافة السؤال للبنك</button>
                    </div>

                    <button className="btn-save-all" onClick={() => alert("تم الحفظ بنجاح")}>نشر الكورس كاملاً</button>
                 </div>
             ) : (
                <div className="editor-card glass">
                    <h3>إضافة محاضرة لكورس موجود</h3>
                    <select className="full-select" onChange={e => setCurrentLesson({...currentLesson, targetCourseId: e.target.value})}>
                        <option>اختر الكورس...</option>
                        {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                    <input placeholder="عنوان المحاضرة" className="mt-10" />
                    <input placeholder="رابط الفيديو (Vimeo/Drive)" className="mt-10" />
                    <button className="btn-save-all">تحديث المحتوى</button>
                </div>
             )}
          </div>
        )}

        {/* 4. قسم الأكواد */}
        {activeSection === 'codes' && (
            <div className="codes-section glass">
                <div className="gen-box">
                    <input type="number" placeholder="عدد الأكواد" onChange={e => setCodeSettings({...codeSettings, count: parseInt(e.target.value)})} />
                    <select onChange={e => setCodeSettings({...codeSettings, targetId: e.target.value})}>
                        <option>اختر الكورس...</option>
                        {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                    <button onClick={generateMassCodes} className="btn-gen"><Zap size={18}/> توليد الآن</button>
                </div>
                <div className="codes-grid">
                    {generatedCodes.map(code => (
                        <div key={code.id} className={`code-card ${code.isUsed ? 'used' : ''}`}>
                            <span>{code.code}</span>
                            <button onClick={()=>navigator.clipboard.writeText(code.code)}><Copy size={14}/></button>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </main>
    </div>
  );
};

// مكون الكارت الصغير للإحصائيات
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
