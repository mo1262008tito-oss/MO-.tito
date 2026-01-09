import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase'; 
import * as XLSX from 'xlsx'; // تأكد من تثبيته عبر npm install xlsx
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
  BookMarked, Library, UserCircle, GraduationCap, Percent, TrendingUp, Settings, Smartphone, Image as ImageIcon, CheckCircle, Database
} from 'lucide-react'; 

import './AdminDash.css';

const AdminDash = () => {
  // --- حالات التحكم الأساسية ---
  const [activeSection, setActiveSection] = useState('stats');
  const [addMode, setAddMode] = useState('full-course'); 
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null); 

  // --- حالات البيانات ---
  const [stats, setStats] = useState({ students: 0, courses: 0, codes: 0, books: 0, revenue: 0 });
  const [courses, setCourses] = useState([]);
  const [books, setBooks] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [generatedCodes, setGeneratedCodes] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // --- نماذج الإدخال ---
  const [newCourse, setNewCourse] = useState({
    title: '', instructor: 'أ. محمود فرج', instructorImage: '', subject: 'فيزياء', level: 'ثانوي', grade: '1 ثانوي', 
    price: '', thumbnail: '', description: '', lessons: [], schedule: '' 
  });
  const [newBook, setNewBook] = useState({ title: '', level: 'ثانوي', grade: '1 ثانوي', pdfUrl: '', thumbnail: '', price: '0', category: 'عامة' });
  const [lessonForm, setLessonForm] = useState({ title: '', videoUrl: '', pdfUrl: '', duration: '', targetCourseId: '', isLocked: true, quizUrl: '' });
  const [teacherForm, setTeacherForm] = useState({ name: '', subject: '', commission: 10, totalEarnings: 0 });
  const [codeSettings, setCodeSettings] = useState({ count: 10, targetId: '', type: 'course', amount: 0 });

  // --- نظام جلب البيانات (Real-time Engine) ---
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
        setGeneratedCodes(s.docs.map(d => ({id: d.id, ...d.data()})));
        setStats(prev => ({...prev, codes: s.size}));
    });
    const unsubTeachers = onSnapshot(collection(db, "teachers"), (s) => {
        setTeachers(s.docs.map(d => ({id: d.id, ...d.data()})));
    });
    const unsubPayments = onSnapshot(query(collection(db, "payment_requests"), where("status", "==", "pending")), (s) => {
        setPaymentRequests(s.docs.map(d => ({id: d.id, ...d.data()})));
    });
    const unsubLogs = onSnapshot(query(collection(db, "audit_logs"), orderBy("timestamp", "desc")), (s) => {
        setAuditLogs(s.docs.slice(0, 50).map(d => ({id: d.id, ...d.data()})));
    });

    setLoading(false);
    return () => { 
      unsubUsers(); unsubCourses(); unsubCodes(); unsubBooks(); unsubTeachers(); unsubPayments(); unsubLogs();
    };
  }, []);

  // --- وظائف الحماية والرقابة المتقدمة ---
  const logAction = async (action, details) => {
    await addDoc(collection(db, "audit_logs"), {
      adminEmail: auth.currentUser?.email,
      action, details, timestamp: serverTimestamp()
    });
  };

  const handleToggleBan = async (userId, userName, currentStatus) => {
    if(window.confirm(`${currentStatus ? 'إلغاء حظر' : 'حظر'} الطالب ${userName}؟`)) {
        await updateDoc(doc(db, "users", userId), { isBanned: !currentStatus });
        logAction(currentStatus ? "إلغاء حظر" : "حظر طالب", `الطالب: ${userName}`);
    }
  };

  const resetDevices = async (userId, userName) => {
    if(window.confirm(`تصفير أجهزة الطالب ${userName}؟`)) {
      await updateDoc(doc(db, "users", userId), { deviceId: null, secondDeviceId: null, allowedDevices: [] });
      logAction("تصفير أجهزة", `الطالب: ${userName}`);
      alert("✅ تم التصفير بنجاح");
    }
  };

  // --- وظائف الإدارة المالية والمحتوى ---
  const handleApprovePayment = async (request) => {
    if(!window.confirm("تأكيد استلام المبلغ وتفعيل الطلب؟")) return;
    setLoading(true);
    try {
      const userRef = doc(db, "users", request.userId);
      if(request.type === 'wallet' || !request.courseId) {
        await updateDoc(userRef, { walletBalance: increment(Number(request.amount)) });
      } else {
        await updateDoc(userRef, { enrolledContent: arrayUnion(request.courseId) });
      }
      await updateDoc(doc(db, "payment_requests", request.id), { status: 'approved' });
      logAction("قبول دفع", `للطالب ${request.userName} بمبلغ ${request.amount}`);
      alert("✅ تم التفعيل بنجاح");
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  const generateMassCodes = async () => {
    if (!codeSettings.targetId && codeSettings.type === 'course') return alert("❌ اختر الكورس المستهدف!");
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
      
      // تصدير إكسيل
      const ws = XLSX.utils.json_to_sheet(codesToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Generated Codes");
      XLSX.writeFile(wb, `Tito_Codes_${targetName}.xlsx`);

      logAction("توليد أكواد", `تم إنشاء ${codeSettings.count} كود لـ ${targetName}`);
      alert(`✅ تم توليد الأكواد وتصدير ملف Excel`);
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  const handlePublishCourse = async () => {
    if(!newCourse.title || !newCourse.price) return alert("❌ أكمل بيانات الكورس الأساسية");
    setLoading(true);
    try {
      await addDoc(collection(db, "courses_metadata"), {
        ...newCourse, adminId: auth.currentUser?.uid, createdAt: serverTimestamp(), studentsCount: 0
      });
      logAction("نشر كورس", `عنوان: ${newCourse.title}`);
      alert("🚀 تم نشر الكورس بنجاح");
      setNewCourse({ title: '', instructor: 'أ. محمود فرج', instructorImage: '', subject: 'فيزياء', level: 'ثانوي', grade: '1 ثانوي', price: '', thumbnail: '', description: '', lessons: [] });
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  const deleteItem = async (coll, id, name) => {
    if(window.confirm(`حذف ${name} نهائياً؟`)) {
      await deleteDoc(doc(db, coll, id));
      logAction("حذف", `من ${coll}: ${name}`);
    }
  };

  const chartData = [
    { name: 'السبت', students: 400 }, { name: 'الأحد', students: 700 },
    { name: 'الاثنين', students: 1200 }, { name: 'الثلاثاء', students: 900 },
    { name: 'الأربعاء', students: 1500 }, { name: 'الخميس', students: 2100 },
    { name: 'الجمعة', students: 2400 },
  ];

  return (
    <div className="admin-nebula-root">
      {loading && <div className="admin-loader-overlay"><div className="spinner"></div></div>}

      <aside className="side-dock">
        <div className="dock-logo"><Zap className="neon-icon" fill="#00f2ff" /> <span>TITO PANEL PRO</span></div>
        <nav className="dock-menu">
          <button onClick={() => setActiveSection('stats')} className={activeSection === 'stats' ? 'active' : ''}><LayoutDashboard /> الإحصائيات</button>
          <button onClick={() => setActiveSection('payments')} className={activeSection === 'payments' ? 'active' : ''}>
            <DollarSign /> طلبات الدفع 
            {paymentRequests.length > 0 && <span className="notif-badge">{paymentRequests.length}</span>}
          </button>
          <button onClick={() => setActiveSection('teachers')} className={activeSection === 'teachers' ? 'active' : ''}><GraduationCap /> المعلمين</button>
          <button onClick={() => setActiveSection('content')} className={activeSection === 'content' ? 'active' : ''}><Layers /> الكورسات</button>
          <button onClick={() => setActiveSection('library')} className={activeSection === 'library' ? 'active' : ''}><Library /> المكتبة</button>
          <button onClick={() => setActiveSection('codes')} className={activeSection === 'codes' ? 'active' : ''}><Hash /> الأكواد والمحفظة</button>
          <button onClick={() => setActiveSection('users')} className={activeSection === 'users' ? 'active' : ''}><Users /> شؤون الطلاب</button>
          <button onClick={() => setActiveSection('logs')} className={activeSection === 'logs' ? 'active' : ''}><Database /> سجل النشاط</button>
        </nav>
      </aside>

      <main className="main-content">
        {activeSection === 'stats' && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="stats-wrapper">
            <div className="stats-grid">
                <StatCard icon={<Users />} label="طالب مسجل" value={stats.students} color="#00f2ff" />
                <StatCard icon={<TrendingUp />} label="أرباح الشهر" value={`${allUsers.reduce((a,b)=>a+(b.totalSpent||0),0).toLocaleString()} EGP`} color="#00ff88" />
                <StatCard icon={<Video />} label="كورس متاح" value={stats.courses} color="#7000ff" />
                <StatCard icon={<Hash />} label="كود فعال" value={stats.codes} color="#ff007a" />
            </div>
            <div className="chart-container glass">
              <h3>نمو المنصة (طلاب جدد)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#00f2ff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="name" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip contentStyle={{backgroundColor: '#111', border: '1px solid #333'}} />
                  <Area type="monotone" dataKey="students" stroke="#00f2ff" fillOpacity={1} fill="url(#colorStudents)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {activeSection === 'users' && (
            <div className="users-section glass">
                <div className="section-header">
                    <h3><Users /> الطلاب والرقابة</h3>
                    <div className="search-box">
                        <Search size={18} /><input placeholder="بحث..." onChange={(e)=>setSearchTerm(e.target.value)} />
                    </div>
                </div>
                <div className="table-responsive">
                    <table className="admin-table">
                        <thead>
                            <tr><th>الطالب</th><th>المحفظة</th><th>الأجهزة</th><th>الحماية</th><th>إجراء</th></tr>
                        </thead>
                        <tbody>
                            {allUsers.filter(u => u.name?.includes(searchTerm)).map(user => (
                                <tr key={user.id} className={user.isBanned ? 'row-banned' : ''}>
                                    <td>
                                        <div className="u-cell" onClick={() => setSelectedUser(user)}>
                                            <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${user.email}`} alt="" />
                                            <div><p>{user.name}</p><small>{user.email}</small></div>
                                        </div>
                                    </td>
                                    <td><span className="wallet-badge">{user.walletBalance || 0} EGP</span></td>
                                    <td><button className="reset-btn" onClick={() => resetDevices(user.id, user.name)}><Smartphone size={14}/> Reset</button></td>
                                    <td>
                                        <button className={`ban-btn-small ${user.isBanned ? 'unban' : 'ban'}`} onClick={() => handleToggleBan(user.id, user.name, user.isBanned)}>
                                            {user.isBanned ? <Unlock size={14}/> : <ShieldBan size={14}/>}
                                            {user.isBanned ? "فك الحظر" : "حظر"}
                                        </button>
                                    </td>
                                    <td><button className="icon-btn red" onClick={() => deleteItem('users', user.id, user.name)}><Trash size={16}/></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {activeSection === 'logs' && (
            <div className="logs-section glass">
                <h3><Database size={20}/> سجل نشاط النظام</h3>
                <div className="logs-list">
                    {auditLogs.map(log => (
                        <div key={log.id} className="log-item-nebula">
                            <span className="log-time">{log.timestamp?.toDate().toLocaleTimeString()}</span>
                            <span className="log-admin">{log.adminEmail}</span>
                            <span className="log-action">{log.action}</span>
                            <span className="log-details">{log.details}</span>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* ... بقية الأقسام (Payments, Teachers, Content, Library, Codes) كما هي في كودك الأصلي مع دمج وظائف الحذف والـ Log ... */}
        {activeSection === 'payments' && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="payments-manager">
             <div className="section-header"><h3><ShieldCheck color="#00ff88"/> مراجعة تحويلات فودافون كاش</h3></div>
             <div className="requests-grid">
                {paymentRequests.map(req => (
                  <div key={req.id} className="payment-request-card glass">
                    <div className="req-header">
                       <span className={`type-tag ${req.courseId ? 'course' : 'wallet'}`}>{req.courseId ? 'تفعيل كورس' : 'شحن محفظة'}</span>
                       <small>{new Date(req.date).toLocaleString('ar-EG')}</small>
                    </div>
                    <div className="req-body">
                       <strong>{req.userName}</strong>
                       <p>{req.courseName || `شحن: ${req.amount} ج.م`}</p>
                       <div className="receipt-preview" onClick={() => window.open(req.receiptUrl, '_blank')}>
                          <img src={req.receiptUrl} alt="إيصال" /><div className="overlay-zoom"><Eye size={20}/></div>
                       </div>
                    </div>
                    <div className="req-footer">
                       <button className="approve-btn" onClick={() => handleApprovePayment(req)}><CheckCircle size={16}/> موافقة</button>
                       <button className="reject-btn" onClick={() => deleteItem('payment_requests', req.id, 'طلب دفع')}><Trash size={16}/> رفض</button>
                    </div>
                  </div>
                ))}
             </div>
          </motion.div>
        )}

        {activeSection === 'codes' && (
            <div className="codes-manager">
                <div className="control-card glass">
                    <h3><Wallet size={20} color="gold"/> توليد أكواد وتصدير Excel</h3>
                    <div className="gen-form">
                        <input type="number" placeholder="العدد" onChange={e => setCodeSettings({...codeSettings, count: parseInt(e.target.value)})} />
                        <select onChange={e => setCodeSettings({...codeSettings, type: e.target.value})}>
                            <option value="course">تفعيل كورس</option><option value="wallet">شحن محفظة</option>
                        </select>
                        {codeSettings.type === 'course' ? (
                          <select onChange={e => setCodeSettings({...codeSettings, targetId: e.target.value})}>
                              <option value="">اختر الكورس...</option>
                              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                          </select>
                        ) : (
                          <input type="number" placeholder="المبلغ" onChange={e => setCodeSettings({...codeSettings, amount: parseInt(e.target.value)})} />
                        )}
                        <button onClick={generateMassCodes} className="btn-gen"><Download size={16}/> إنشاء وتحميل</button>
                    </div>
                </div>
                <div className="codes-display mt-4">
                    <div className="codes-grid">
                        {generatedCodes.slice(0, 30).map(code => (
                            <div key={code.id} className={`code-pill ${code.isUsed ? 'used' : ''}`}>
                                <code>{code.code}</code>
                                <small>{code.type === 'wallet' ? `${code.amount}EGP` : 'Course'}</small>
                                <button onClick={()=>navigator.clipboard.writeText(code.code)}><Copy size={12}/></button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}
      </main>

      {/* مودال نشاط الطالب */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div className="modal-overlay" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <div className="activity-modal glass">
                <div className="modal-header"><h3>نشاط: {selectedUser.name}</h3><button onClick={()=>setSelectedUser(null)}><X /></button></div>
                <div className="modal-body">
                    <div className="log-item"><Clock size={16}/> آخر ظهور: {selectedUser.lastLogin || 'غير متاح'}</div>
                    <div className="log-item"><Smartphone size={16}/> كود الجهاز الأساسي: {selectedUser.deviceId || 'لا يوجد'}</div>
                    <div className="log-item"><ShieldAlert size={16}/> حالة الحساب: {selectedUser.isBanned ? 'محظور' : 'نشط'}</div>
                </div>
            </div>
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
