import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase'; 
import * as XLSX from 'xlsx';
import { 
  collection, query, getDocs, updateDoc, doc, addDoc, 
  onSnapshot, serverTimestamp, where, deleteDoc, orderBy, arrayUnion, increment, writeBatch 
} from "firebase/firestore";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { 
  Users, BookOpen, Plus, Check, X, ShieldCheck, Search,
  Lock, Unlock, DollarSign, FileText, LayoutDashboard,
  PackagePlus, Download, Eye, Trash2, UserCheck, Wallet, ShieldAlert,
  Hash, Video, HelpCircle, Layers, ClipboardList, Book, Save, Star, Link, Clock, Copy, Zap, Bell, ShieldBan, MonitorPlay, Trash,
  BookMarked, Library, UserCircle, GraduationCap, Percent, TrendingUp, Settings, Smartphone, ImageIcon, CheckCircle, Database
} from 'lucide-react'; 

import './AdminDash.css';

const AdminDash = () => {
  const [activeSection, setActiveSection] = useState('stats');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null); 

  // --- البيانات ---
  const [stats, setStats] = useState({ students: 0, courses: 0, codes: 0, books: 0 });
  const [courses, setCourses] = useState([]);
  const [books, setBooks] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [generatedCodes, setGeneratedCodes] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // --- النماذج ---
  const [newCourse, setNewCourse] = useState({
    title: '', instructor: 'أ. محمود فرج', subject: 'فيزياء', grade: '1 ثانوي', 
    price: '', thumbnail: '', description: '', lessons: [] 
  });
  const [newBook, setNewBook] = useState({ title: '', grade: '1 ثانوي', pdfUrl: '', thumbnail: '', price: '0' });
  const [teacherForm, setTeacherForm] = useState({ name: '', subject: '', commission: 10 });
  const [codeSettings, setCodeSettings] = useState({ count: 10, targetId: '', type: 'course', amount: 0 });

  // --- المحرك الفوري (Real-time Engine) ---
  useEffect(() => {
    const unsubscribers = [
      onSnapshot(collection(db, "users"), (s) => {
        setAllUsers(s.docs.map(d => ({id: d.id, ...d.data()})));
        setStats(p => ({...p, students: s.size}));
      }),
      onSnapshot(collection(db, "courses_metadata"), (s) => {
        setCourses(s.docs.map(d => ({id: d.id, ...d.data()})));
        setStats(p => ({...p, courses: s.size}));
      }),
      onSnapshot(collection(db, "library_books"), (s) => {
        setBooks(s.docs.map(d => ({id: d.id, ...d.data()})));
        setStats(p => ({...p, books: s.size}));
      }),
      onSnapshot(query(collection(db, "activationCodes"), orderBy("createdAt", "desc")), (s) => {
        setGeneratedCodes(s.docs.map(d => ({id: d.id, ...d.data()})));
        setStats(p => ({...p, codes: s.size}));
      }),
      onSnapshot(collection(db, "teachers"), (s) => {
        setTeachers(s.docs.map(d => ({id: d.id, ...d.data()})));
      }),
      onSnapshot(query(collection(db, "payment_requests"), where("status", "==", "pending")), (s) => {
        setPaymentRequests(s.docs.map(d => ({id: d.id, ...d.data()})));
      }),
      onSnapshot(query(collection(db, "audit_logs"), orderBy("timestamp", "desc")), (s) => {
        setAuditLogs(s.docs.slice(0, 20).map(d => ({id: d.id, ...d.data()})));
      })
    ];
    return () => unsubscribers.forEach(unsub => unsub());
  }, []);

  // --- الوظائف الإدارية ---
  const logAction = async (action, details) => {
    await addDoc(collection(db, "audit_logs"), {
      adminEmail: auth.currentUser?.email || "Admin",
      action, details, timestamp: serverTimestamp()
    });
  };

  const handlePublishCourse = async () => {
    if(!newCourse.title || !newCourse.price) return alert("❌ أكمل البيانات");
    setLoading(true);
    try {
      await addDoc(collection(db, "courses_metadata"), {
        ...newCourse, createdAt: serverTimestamp(), studentsCount: 0
      });
      logAction("نشر كورس", newCourse.title);
      alert("✅ تم النشر");
      setNewCourse({ title: '', instructor: 'أ. محمود فرج', subject: 'فيزياء', grade: '1 ثانوي', price: '', thumbnail: '', description: '', lessons: [] });
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  const handleAddBook = async () => {
    if(!newBook.title || !newBook.pdfUrl) return alert("❌ أكمل بيانات الكتاب");
    setLoading(true);
    try {
      await addDoc(collection(db, "library_books"), { ...newBook, createdAt: serverTimestamp() });
      logAction("إضافة كتاب", newBook.title);
      alert("✅ تمت الإضافة للمكتبة");
      setNewBook({ title: '', grade: '1 ثانوي', pdfUrl: '', thumbnail: '', price: '0' });
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  const handleAddTeacher = async () => {
    if(!teacherForm.name) return alert("❌ ادخل اسم المدرس");
    try {
      await addDoc(collection(db, "teachers"), { ...teacherForm, totalEarnings: 0 });
      logAction("إضافة مدرس", teacherForm.name);
      setTeacherForm({ name: '', subject: '', commission: 10 });
    } catch (e) { alert(e.message); }
  };

  const generateMassCodes = async () => {
    if (!codeSettings.targetId && codeSettings.type === 'course') return alert("❌ اختر الكورس!");
    setLoading(true);
    try {
      const batch = writeBatch(db);
      const codesToExport = [];
      const targetName = courses.find(c => c.id === codeSettings.targetId)?.title || "محفظة";

      for (let i = 0; i < codeSettings.count; i++) {
        const codeText = "TITO-" + Math.random().toString(36).substring(2, 9).toUpperCase();
        const codeRef = doc(collection(db, "activationCodes"));
        const data = {
          code: codeText, targetId: codeSettings.targetId, type: codeSettings.type,
          amount: codeSettings.amount, isUsed: false, createdAt: serverTimestamp()
        };
        batch.set(codeRef, data);
        codesToExport.push({ "الكود": codeText, "النوع": codeSettings.type, "المحتوى": targetName, "القيمة": codeSettings.amount });
      }
      await batch.commit();
      
      const ws = XLSX.utils.json_to_sheet(codesToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Codes");
      XLSX.writeFile(wb, `Tito_Codes_${Date.now()}.xlsx`);
      logAction("توليد أكواد", `عدد ${codeSettings.count}`);
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  const deleteItem = async (coll, id, name) => {
    if(window.confirm(`حذف ${name}؟`)) {
      await deleteDoc(doc(db, coll, id));
      logAction("حذف", `${coll}: ${name}`);
    }
  };

  return (
    <div className="admin-nebula-root">
      {loading && <div className="admin-loader-overlay"><div className="spinner"></div></div>}

      <aside className="side-dock">
        <div className="dock-logo"><Zap fill="#00f2ff" /> <span>TITO PANEL</span></div>
        <nav className="dock-menu">
          <button onClick={() => setActiveSection('stats')} className={activeSection === 'stats' ? 'active' : ''}><LayoutDashboard /> الإحصائيات</button>
          <button onClick={() => setActiveSection('content')} className={activeSection === 'content' ? 'active' : ''}><Layers /> الكورسات</button>
          <button onClick={() => setActiveSection('library')} className={activeSection === 'library' ? 'active' : ''}><Library /> المكتبة</button>
          <button onClick={() => setActiveSection('users')} className={activeSection === 'users' ? 'active' : ''}><Users /> الطلاب</button>
          <button onClick={() => setActiveSection('payments')} className={activeSection === 'payments' ? 'active' : ''}><DollarSign /> الدفع {paymentRequests.length > 0 && <span className="notif-badge">{paymentRequests.length}</span>}</button>
          <button onClick={() => setActiveSection('codes')} className={activeSection === 'codes' ? 'active' : ''}><Hash /> الأكواد</button>
          <button onClick={() => setActiveSection('teachers')} className={activeSection === 'teachers' ? 'active' : ''}><GraduationCap /> المدرسين</button>
          <button onClick={() => setActiveSection('logs')} className={activeSection === 'logs' ? 'active' : ''}><Database /> السجلات</button>
        </nav>
      </aside>

      <main className="main-content">
        {/* قسم الإحصائيات */}
        {activeSection === 'stats' && (
          <div className="stats-wrapper">
            <div className="stats-grid">
              <StatCard icon={<Users />} label="طالب" value={stats.students} color="#00f2ff" />
              <StatCard icon={<Video />} label="كورس" value={stats.courses} color="#7000ff" />
              <StatCard icon={<BookOpen />} label="كتاب" value={stats.books} color="#ff007a" />
              <StatCard icon={<Hash />} label="كود" value={stats.codes} color="#00ff88" />
            </div>
            <div className="chart-container glass">
               <h3>نشاط المنصة</h3>
               <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={[{n:'S', v:400}, {n:'M', v:700}, {n:'T', v:1000}]}>
                    <Area type="monotone" dataKey="v" stroke="#00f2ff" fill="rgba(0,242,255,0.1)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* قسم الكورسات */}
        {activeSection === 'content' && (
          <div className="content-manager glass">
            <div className="admin-form-grid">
              <input placeholder="عنوان الكورس" onChange={e => setNewCourse({...newCourse, title: e.target.value})} />
              <input placeholder="السعر" type="number" onChange={e => setNewCourse({...newCourse, price: e.target.value})} />
              <input placeholder="رابط الصورة (Thumbnail)" onChange={e => setNewCourse({...newCourse, thumbnail: e.target.value})} />
              <select onChange={e => setNewCourse({...newCourse, grade: e.target.value})}>
                <option>1 ثانوي</option><option>2 ثانوي</option><option>3 ثانوي</option>
              </select>
              <button className="btn-primary" onClick={handlePublishCourse}><PackagePlus /> نشر الكورس</button>
            </div>
            <div className="items-list mt-4">
              {courses.map(c => (
                <div key={c.id} className="item-card glass">
                  <span>{c.title} ({c.price} ج.م)</span>
                  <button onClick={() => deleteItem('courses_metadata', c.id, c.title)}><Trash2 size={16}/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* قسم المكتبة */}
        {activeSection === 'library' && (
          <div className="library-manager glass">
            <div className="admin-form-grid">
              <input placeholder="اسم الكتاب" onChange={e => setNewBook({...newBook, title: e.target.value})} />
              <input placeholder="رابط PDF" onChange={e => setNewBook({...newBook, pdfUrl: e.target.value})} />
              <button className="btn-primary" onClick={handleAddBook}><Plus /> إضافة للكتاب</button>
            </div>
            <div className="items-list mt-4">
              {books.map(b => (
                <div key={b.id} className="item-card glass">
                  <span>{b.title} - {b.grade}</span>
                  <button onClick={() => deleteItem('library_books', b.id, b.title)}><Trash2 size={16}/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* قسم شؤون الطلاب (الموجود سابقاً مع التحسين) */}
        {activeSection === 'users' && (
           <div className="users-section glass">
              <div className="section-header">
                <input className="search-input" placeholder="بحث باسم الطالب..." onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <table className="admin-table">
                <thead><tr><th>الطالب</th><th>المحفظة</th><th>الأجهزة</th><th>الإجراء</th></tr></thead>
                <tbody>
                  {allUsers.filter(u => u.name?.includes(searchTerm)).map(user => (
                    <tr key={user.id}>
                      <td onClick={() => setSelectedUser(user)} className="pointer">{user.name}</td>
                      <td>{user.walletBalance || 0} ج.م</td>
                      <td><button onClick={() => updateDoc(doc(db,"users",user.id), {deviceId:null})} className="btn-reset">تصفير</button></td>
                      <td>
                        <button className="btn-ban" onClick={() => updateDoc(doc(db,"users",user.id), {isBanned: !user.isBanned})}>
                          {user.isBanned ? <Unlock size={14}/> : <ShieldBan size={14}/>}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        )}

        {/* قسم الأكواد */}
        {activeSection === 'codes' && (
          <div className="codes-manager glass">
            <div className="gen-form">
              <input type="number" placeholder="العدد" onChange={e => setCodeSettings({...codeSettings, count: parseInt(e.target.value)})} />
              <select onChange={e => setCodeSettings({...codeSettings, type: e.target.value})}>
                <option value="course">كورس</option><option value="wallet">محفظة</option>
              </select>
              {codeSettings.type === 'course' && (
                <select onChange={e => setCodeSettings({...codeSettings, targetId: e.target.value})}>
                  <option>اختر الكورس</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              )}
              <button onClick={generateMassCodes} className="btn-primary">إنشاء Excel</button>
            </div>
          </div>
        )}

        {/* سجل النشاط */}
        {activeSection === 'logs' && (
          <div className="logs-view glass">
            {auditLogs.map(log => (
              <div key={log.id} className="log-row">
                <span className="time">{log.timestamp?.toDate().toLocaleTimeString()}</span>
                <span className="action">{log.action}</span>
                <span className="details">{log.details}</span>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* مودال تفاصيل الطالب */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div className="modal-overlay" onClick={()=>setSelectedUser(null)}>
            <motion.div className="activity-modal glass" onClick={e=>e.stopPropagation()}>
              <h3>تفاصيل: {selectedUser.name}</h3>
              <p>الإيميل: {selectedUser.email}</p>
              <p>رقم الهاتف: {selectedUser.phone || 'غير مسجل'}</p>
              <p>المحفظة: {selectedUser.walletBalance || 0} ج.م</p>
              <button onClick={()=>setSelectedUser(null)} className="btn-close">إغلاق</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <div className="stat-card" style={{ '--card-color': color }}>
    <div className="stat-icon">{icon}</div>
    <div className="stat-info"><h3>{value}</h3><p>{label}</p></div>
  </div>
);

export default AdminDash;
