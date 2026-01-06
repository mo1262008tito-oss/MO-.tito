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
  Hash, Video, HelpCircle, Layers, ClipboardList, Book, Save, Star, Link, Clock, Copy, Zap, Bell, ShieldBan, MonitorPlay, Trash
} from 'lucide-react'; 

import './AdminDash.css';

const AdminDash = () => {
  const [activeSection, setActiveSection] = useState('stats');
  const [addMode, setAddMode] = useState('full-course'); 
  const [stats, setStats] = useState({ students: 0, courses: 0, codes: 0, usedCodes: 0 });
  const [courses, setCourses] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [generatedCodes, setGeneratedCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // --- حالات الكورسات ---
  const [newCourse, setNewCourse] = useState({
    title: '', instructor: 'أ. محمود فرج', subject: 'فيزياء', grade: '1 ثانوي', 
    price: '', thumbnail: '', description: '', lessons: [] 
  });

  // --- حالة المحاضرة ---
  const [lessonForm, setLessonForm] = useState({
    title: '', videoUrl: '', pdfUrl: '', duration: '', targetCourseId: ''
  });

  const [currentQuestion, setCurrentQuestion] = useState({ 
    question: '', options: ['', '', '', ''], correctAnswer: 0 
  });

  // --- نظام الأكواد ---
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

    const unsubCodes = onSnapshot(query(collection(db, "activationCodes"), orderBy("createdAt", "desc")), (s) => {
        const codes = s.docs.map(d => ({id: d.id, ...d.data()}));
        setGeneratedCodes(codes);
        setStats(prev => ({...prev, codes: s.size, usedCodes: codes.filter(c => c.isUsed).length}));
    });

    setLoading(false);
    return () => { unsubUsers(); unsubCourses(); unsubCodes(); };
  }, []);

  // --- وظيفة نشر كورس جديد ---
  const handlePublishCourse = async () => {
    if(!newCourse.title || !newCourse.price) return alert("❌ أكمل بيانات الكورس الأساسية");
    setLoading(true);
    try {
      await addDoc(collection(db, "courses_metadata"), {
        ...newCourse,
        createdAt: serverTimestamp(),
        studentsCount: 0
      });
      alert("🚀 تم نشر الكورس بنجاح وسيظهر لجميع الطلاب");
      setNewCourse({ title: '', instructor: 'أ. محمود فرج', subject: 'فيزياء', grade: '1 ثانوي', price: '', thumbnail: '', description: '', lessons: [] });
    } catch (e) { alert("خطأ في النشر: " + e.message); }
    setLoading(false);
  };

  // --- وظيفة إضافة محاضرة لكورس موجود ---
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
      const batch = [];
      for (let i = 0; i < codeSettings.count; i++) {
        const code = "MAFA-" + Math.random().toString(36).substring(2, 9).toUpperCase();
        batch.push(addDoc(collection(db, "activationCodes"), {
          code,
          targetId: codeSettings.targetId,
          isUsed: false,
          createdAt: serverTimestamp()
        }));
      }
      await Promise.all(batch);
      alert(`✅ تم توليد ${codeSettings.count} كود`);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const deleteCourse = async (id) => {
    if(window.confirm("هل أنت متأكد من حذف الكورس نهائياً؟")) {
        await deleteDoc(doc(db, "courses_metadata", id));
    }
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
          <button onClick={() => setActiveSection('content')} className={activeSection === 'content' ? 'active' : ''}><Layers /> إدارة المحتوى</button>
          <button onClick={() => setActiveSection('codes')} className={activeSection === 'codes' ? 'active' : ''}><Hash /> منظومة الأكواد</button>
          <button onClick={() => setActiveSection('users')} className={activeSection === 'users' ? 'active' : ''}><Users /> شؤون الطلاب</button>
        </nav>
      </aside>

      <main className="main-content">
        {/* --- الإحصائيات --- */}
        {activeSection === 'stats' && (
          <motion.div initial={{y: 20, opacity:0}} animate={{y:0, opacity:1}} className="stats-wrapper">
            <div className="stats-grid">
                <StatCard icon={<Users />} label="طالب مسجل" value={stats.students} color="#00f2ff" />
                <StatCard icon={<Video />} label="كورس متاح" value={stats.courses} color="#7000ff" />
                <StatCard icon={<Hash />} label="كود مولّد" value={stats.codes} color="#ff007a" />
                <StatCard icon={<Check />} label="كود مستخدم" value={stats.usedCodes} color="#00ff88" />
            </div>
            
            <div className="quick-view-section">
                <div className="glass-card">
                    <h3><MonitorPlay size={20}/> الكورسات الحالية</h3>
                    <div className="mini-list">
                        {courses.map(c => (
                            <div key={c.id} className="mini-item">
                                <span>{c.title}</span>
                                <div className="actions">
                                    <button onClick={() => deleteCourse(c.id)} className="text-red"><Trash size={16}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          </motion.div>
        )}

        {/* --- إدارة الطلاب --- */}
        {activeSection === 'users' && (
            <div className="users-section glass">
                <div className="section-header">
                    <h3><Users /> التحكم في المشتركين</h3>
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
                                <th>النقاط (XP)</th>
                                <th>الكورسات</th>
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
                                    <td><Star size={14} color="gold"/> {user.points || 0}</td>
                                    <td>{user.enrolledContent?.length || 0} كورس</td>
                                    <td>
                                        <span className={`status-dot ${user.isSecondaryActive ? 'online' : 'offline'}`}></span>
                                        {user.isSecondaryActive ? 'نشط' : 'محظور'}
                                    </td>
                                    <td>
                                        <button className="icon-btn" onClick={() => {/* وظيفة الحظر */}}>
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

        {/* --- إدارة المحتوى --- */}
        {activeSection === 'content' && (
          <div className="content-manager">
             <div className="mode-tabs">
                <button className={addMode === 'full-course' ? 'active' : ''} onClick={()=>setAddMode('full-course')}>إنشاء كورس متكامل</button>
                <button className={addMode === 'single-lesson' ? 'active' : ''} onClick={()=>setAddMode('single-lesson')}>إضافة محتوى لكورس</button>
             </div>

             {addMode === 'full-course' ? (
                 <div className="editor-container">
                    <div className="form-group">
                        <label>تفاصيل الكورس الأساسية</label>
                        <div className="input-row">
                            <input placeholder="عنوان الكورس (مثال: الباب الأول - الميكانيكا)" value={newCourse.title} onChange={e => setNewCourse({...newCourse, title: e.target.value})} />
                            <input placeholder="السعر (EGP)" type="number" value={newCourse.price} onChange={e => setNewCourse({...newCourse, price: e.target.value})} />
                        </div>
                        <div className="input-row">
                            <select value={newCourse.grade} onChange={e => setNewCourse({...newCourse, grade: e.target.value})}>
                                <option>1 ثانوي</option><option>2 ثانوي</option><option>3 ثانوي</option>
                            </select>
                            <input placeholder="رابط صورة الغلاف (URL)" value={newCourse.thumbnail} onChange={e => setNewCourse({...newCourse, thumbnail: e.target.value})} />
                        </div>
                        <textarea placeholder="وصف الكورس للطالب..." value={newCourse.description} onChange={e => setNewCourse({...newCourse, description: e.target.value})}></textarea>
                    </div>
                    <button className="publish-btn" onClick={handlePublishCourse}><PackagePlus /> نشر الكورس في المنصة الآن</button>
                 </div>
             ) : (
                <div className="editor-container">
                    <div className="form-group">
                        <label>إضافة محاضرة جديدة</label>
                        <select className="full-select" value={lessonForm.targetCourseId} onChange={e => setLessonForm({...lessonForm, targetCourseId: e.target.value})}>
                            <option value="">اختر الكورس المستهدف...</option>
                            {courses.map(c => <option key={c.id} value={c.id}>{c.title} ({c.grade})</option>)}
                        </select>
                        <input placeholder="عنوان المحاضرة" value={lessonForm.title} onChange={e => setLessonForm({...lessonForm, title: e.target.value})} />
                        <div className="input-row">
                            <input placeholder="رابط الفيديو" value={lessonForm.videoUrl} onChange={e => setLessonForm({...lessonForm, videoUrl: e.target.value})} />
                            <input placeholder="رابط PDF الملزمة" value={lessonForm.pdfUrl} onChange={e => setLessonForm({...lessonForm, pdfUrl: e.target.value})} />
                        </div>
                    </div>
                    <button className="publish-btn blue" onClick={handleAddLesson}><MonitorPlay /> تحديث محتوى الكورس</button>
                </div>
             )}
          </div>
        )}

        {/* --- الأكواد --- */}
        {activeSection === 'codes' && (
            <div className="codes-manager">
                <div className="control-card glass">
                    <h3><Zap size={20} color="gold"/> توليد أكواد تفعيل جماعية</h3>
                    <div className="gen-form">
                        <input type="number" value={codeSettings.count} onChange={e => setCodeSettings({...codeSettings, count: parseInt(e.target.value)})} />
                        <select onChange={e => setCodeSettings({...codeSettings, targetId: e.target.value})}>
                            <option value="">اختر الكورس...</option>
                            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </select>
                        <button onClick={generateMassCodes} className="btn-gen">إنشاء الأكواد</button>
                    </div>
                </div>

                <div className="codes-display">
                    <div className="table-header">آخر الأكواد التي تم توليدها</div>
                    <div className="codes-grid">
                        {generatedCodes.slice(0, 20).map(code => (
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
