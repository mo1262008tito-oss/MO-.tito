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
  Hash, Video, HelpCircle, Layers, ClipboardList, Book, Save, Star, Link, Clock, Copy, Zap
}
  from 'lucide-react'; 

import './AdminDash.css';

const AdminDash = () => {
  const [activeSection, setActiveSection] = useState('stats');
  const [addMode, setAddMode] = useState('full-course'); 
  const [stats, setStats] = useState({ students: 0, courses: 0, pending: 0, codes: 0, books: 0 });
  const [courses, setCourses] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [generatedCodes, setGeneratedCodes] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- حالات الكورسات المتكاملة ---
  const [newCourse, setNewCourse] = useState({
    title: '', instructor: 'أ. محمود فرج', subject: 'فيزياء', grade: '1 ثانوي', 
    price: 0, thumbnail: '', poster: '', description: '',
    features: '', requirements: '', lessons: [] 
  });

  // --- حالة المحاضرة المنفردة أو داخل كورس ---
  const [currentLesson, setCurrentLesson] = useState({ 
    title: '', videoUrl: '', description: '', pdfUrl: '', duration: '', quiz: [], targetCourseId: ''
  });

  const [currentQuestion, setCurrentQuestion] = useState({ 
    question: '', options: ['', '', '', ''], correctAnswer: 0 
  });

  // --- حالات نظام الأكواد ---
  const [codeSettings, setCodeSettings] = useState({ count: 10, targetId: '', type: 'full_course' });

  useEffect(() => {
    const unsubStats = onSnapshot(collection(db, "users"), (s) => setStats(prev => ({...prev, students: s.size})));
    const unsubCourses = onSnapshot(collection(db, "courses_metadata"), (s) => {
        setCourses(s.docs.map(d => ({id: d.id, ...d.data()})));
        setStats(prev => ({...prev, courses: s.size}));
    });
    const unsubUsers = onSnapshot(collection(db, "users"), (s) => setAllUsers(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubCodes = onSnapshot(query(collection(db, "activationCodes"), orderBy("createdAt", "desc")), (s) => {
        setGeneratedCodes(s.docs.map(d => ({id: d.id, ...d.data()})));
    });

    return () => { unsubStats(); unsubCourses(); unsubUsers(); unsubCodes(); };
  }, []);

  // --- وظائف نظام الأكواد (تسهيل التفعيل) ---
  const generateMassCodes = async () => {
    if (!codeSettings.targetId) return alert("❌ اختر الكورس المستهدف أولاً!");
    setLoading(true);
    try {
      for (let i = 0; i < codeSettings.count; i++) {
        const code = "MAFA-" + Math.random().toString(36).substring(2, 10).toUpperCase();
        await addDoc(collection(db, "activationCodes"), {
          code,
          targetId: codeSettings.targetId,
          type: codeSettings.type,
          isUsed: false,
          createdAt: serverTimestamp(),
          createdBy: "Admin"
        });
      }
      alert(`✅ تم توليد ${codeSettings.count} كود بنجاح`);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("📋 تم نسخ الكود!");
  };

  // --- وظائف الحفظ (كورس / محاضرة) ---
  const handleSaveFullCourse = async () => {
    if (!newCourse.title || newCourse.lessons.length === 0) return alert("❌ أكمل بيانات الكورس وأضف محاضرة واحدة على الأقل");
    setLoading(true);
    await addDoc(collection(db, "courses_metadata"), {
      ...newCourse,
      features: newCourse.features.split('،'),
      requirements: newCourse.requirements.split('،'),
      createdAt: serverTimestamp()
    });
    alert("🚀 تم نشر الكورس المتكامل بنجاح!");
    setNewCourse({ title: '', instructor: 'أ. محمود فرج', subject: 'فيزياء', grade: '1 ثانوي', price: 0, thumbnail: '', poster: '', description: '', features: '', requirements: '', lessons: [] });
    setLoading(false);
  };

  const handleAddSingleLesson = async () => {
    if (!currentLesson.targetCourseId) return alert("❌ اختر الكورس الذي تريد إضافة المحاضرة إليه");
    setLoading(true);
    const ref = doc(db, "courses_metadata", currentLesson.targetCourseId);
    await updateDoc(ref, {
      lessons: arrayUnion({ ...currentLesson, id: `L-${Date.now()}`, addedAt: new Date().toISOString() })
    });
    alert("✅ تمت إضافة المحاضرة بنجاح!");
    setCurrentLesson({ title: '', videoUrl: '', description: '', pdfUrl: '', duration: '', quiz: [], targetCourseId: '' });
    setLoading(false);
  };

  return (
    <div className="admin-nebula-root" style={{ direction: 'rtl' }}>
      {/* القائمة الجانبية الذكية */}
      <aside className="side-dock">
        <div className="dock-logo"><Zap color="#00f2ff" fill="#00f2ff" /> <span>MAFA PRO</span></div>
        <nav className="dock-menu">
          <button onClick={() => setActiveSection('stats')} className={activeSection === 'stats' ? 'active' : ''}><LayoutDashboard /> لوحة التحكم</button>
          <button onClick={() => setActiveSection('content')} className={activeSection === 'content' ? 'active' : ''}><Layers /> المحتوى التعليمي</button>
          <button onClick={() => setActiveSection('codes')} className={activeSection === 'codes' ? 'active' : ''}><Hash /> الأكواد والتفعيل</button>
          <button onClick={() => setActiveSection('users')} className={activeSection === 'users' ? 'active' : ''}><Users /> إدارة الطلاب</button>
        </nav>
      </aside>

      <main className="main-content">
        {/* 1. قسم الإحصائيات */}
        {activeSection === 'stats' && (
          <div className="stats-container">
            <StatBox icon={<Users />} label="إجمالي الطلاب" value={stats.students} color="cyan" />
            <StatBox icon={<Video />} label="الكورسات" value={stats.courses} color="purple" />
            <StatBox icon={<Hash />} label="أكواد مفعّلة" value={generatedCodes.filter(c => c.isUsed).length} color="green" />
            <StatBox icon={<Wallet />} label="أرباح تقديرية" value={stats.students * 150} color="gold" />
          </div>
        )}

        {/* 2. قسم المحتوى (الإضافة المتطورة) */}
        {activeSection === 'content' && (
          <div className="content-manager">
            <div className="mode-selector">
              <button onClick={() => setAddMode('full-course')} className={addMode === 'full-course' ? 'active' : ''}>كورس متكامل</button>
              <button onClick={() => setAddMode('single-lesson')} className={addMode === 'single-lesson' ? 'active' : ''}>إضافة محاضرة فقط</button>
            </div>

            {addMode === 'full-course' ? (
              <div className="form-card-pro glass">
                <h3>📝 إنشاء كورس جديد كلياً</h3>
                <div className="input-row">
                  <input placeholder="عنوان الكورس" onChange={e => setNewCourse({...newCourse, title: e.target.value})} />
                  <input placeholder="المعلم" value={newCourse.instructor} onChange={e => setNewCourse({...newCourse, instructor: e.target.value})} />
                  <select onChange={e => setNewCourse({...newCourse, grade: e.target.value})}>
                    <option>1 ثانوي</option><option>2 ثانوي</option><option>3 ثانوي</option>
                  </select>
                  <input type="number" placeholder="السعر" onChange={e => setNewCourse({...newCourse, price: e.target.value})} />
                </div>
                <textarea placeholder="وصف الكورس التسويقي..." onChange={e => setNewCourse({...newCourse, description: e.target.value})} />
                <div className="input-row">
                  <input placeholder="رابط Thumbnail (300x200)" onChange={e => setNewCourse({...newCourse, thumbnail: e.target.value})} />
                  <input placeholder="رابط البوستر الكبير" onChange={e => setNewCourse({...newCourse, poster: e.target.value})} />
                </div>
                <div className="input-row">
                  <input placeholder="المميزات (افصل بـ ،)" onChange={e => setNewCourse({...newCourse, features: e.target.value})} />
                  <input placeholder="المتطلبات (افصل بـ ،)" onChange={e => setNewCourse({...newCourse, requirements: e.target.value})} />
                </div>

                <div className="nested-lesson-form">
                   <h4>📺 إضافة محاضرة للكورس الحالي ({newCourse.lessons.length})</h4>
                   <div className="input-row">
                     <input placeholder="عنوان المحاضرة" value={currentLesson.title} onChange={e => setCurrentLesson({...currentLesson, title: e.target.value})} />
                     <input placeholder="رابط الفيديو" value={currentLesson.videoUrl} onChange={e => setCurrentLesson({...currentLesson, videoUrl: e.target.value})} />
                     <input placeholder="رابط PDF الملزمة" value={currentLesson.pdfUrl} onChange={e => setCurrentLesson({...currentLesson, pdfUrl: e.target.value})} />
                   </div>
                   <button className="btn-secondary" onClick={() => {
                     setNewCourse({...newCourse, lessons: [...newCourse.lessons, {...currentLesson, id: Date.now()}]});
                     setCurrentLesson({title: '', videoUrl: '', description: '', pdfUrl: '', duration: '', quiz: []});
                   }}><Plus size={16}/> حفظ المحاضرة مؤقتاً</button>
                </div>
                <button className="btn-primary-glow" onClick={handleSaveFullCourse} disabled={loading}>{loading ? "جاري الرفع..." : "نشر الكورس في المنصة"}</button>
              </div>
            ) : (
              <div className="form-card-pro glass">
                <h3>🚀 تحديث كورس قائم بمحاضرة جديدة</h3>
                <select className="full-width-select" onChange={e => setCurrentLesson({...currentLesson, targetCourseId: e.target.value})}>
                  <option value="">اختر الكورس المستهدف...</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title} ({c.grade})</option>)}
                </select>
                <div className="input-row">
                  <input placeholder="عنوان المحاضرة الجديدة" onChange={e => setCurrentLesson({...currentLesson, title: e.target.value})} />
                  <input placeholder="رابط الفيديو" onChange={e => setCurrentLesson({...currentLesson, videoUrl: e.target.value})} />
                  <input placeholder="رابط PDF" onChange={e => setCurrentLesson({...currentLesson, pdfUrl: e.target.value})} />
                </div>
                <button className="btn-primary-glow orange" onClick={handleAddSingleLesson} disabled={loading}>تحديث المنهج الآن</button>
              </div>
            )}
          </div>
        )}

        {/* 3. قسم الأكواد (التوليد والنسخ) */}
        {activeSection === 'codes' && (
          <div className="codes-manager">
            <div className="code-gen-card glass">
              <h3>🎫 مولد أكواد التفعيل الذكي</h3>
              <div className="input-row">
                <select onChange={e => setCodeSettings({...codeSettings, targetId: e.target.value})}>
                  <option value="">اختر الكورس المستهدف...</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
                <input type="number" placeholder="عدد الأكواد" onChange={e => setCodeSettings({...codeSettings, count: parseInt(e.target.value)})} />
                <button onClick={generateMassCodes} disabled={loading}><Hash /> توليد الأكواد</button>
              </div>
            </div>

            <div className="codes-table-container">
               <table className="codes-table">
                 <thead>
                   <tr>
                     <th>الكود</th>
                     <th>الكورس</th>
                     <th>الحالة</th>
                     <th>بواسطة</th>
                     <th>إجراء</th>
                   </tr>
                 </thead>
                 <tbody>
                   {generatedCodes.map(c => (
                     <tr key={c.id} className={c.isUsed ? 'used' : 'available'}>
                       <td className="code-text" onClick={() => copyToClipboard(c.code)}>{c.code} <Copy size={12}/></td>
                       <td>{courses.find(course => course.id === c.targetId)?.title || 'غير معروف'}</td>
                       <td>{c.isUsed ? <span className="status used">مستخدم</span> : <span className="status free">متاح</span>}</td>
                       <td>{c.usedBy || '---'}</td>
                       <td><button className="del-btn" onClick={() => deleteDoc(doc(db, "activationCodes", c.id))}><Trash2 size={14}/></button></td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const StatBox = ({ icon, label, value, color }) => (
  <div className={`stat-box ${color}`}>
    <div className="icon-wrap">{icon}</div>
    <div className="text-wrap">
      <span className="val">{value}</span>
      <span className="lab">{label}</span>
    </div>
  </div>
);

export default AdminDash;

