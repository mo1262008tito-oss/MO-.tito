import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase'; 
import { 
  collection, query, getDocs, updateDoc, doc, addDoc, 
  onSnapshot, serverTimestamp, where, deleteDoc, orderBy, arrayUnion, increment 
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
  BookMarked, Library, UserCircle, GraduationCap, Percent, TrendingUp, Settings, Smartphone, Image as ImageIcon, CheckCircle
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

  // --- نماذج الإدخال ---
  const [newCourse, setNewCourse] = useState({
    title: '', instructor: 'أ. محمود فرج', instructorImage: '', subject: 'فيزياء', level: 'ثانوي', grade: '1 ثانوي', 
    price: '', thumbnail: '', description: '', lessons: [], schedule: '' 
  });

  const [newBook, setNewBook] = useState({
    title: '', level: 'ثانوي', grade: '1 ثانوي', pdfUrl: '', thumbnail: '', price: '0', category: 'عامة'
  });

  const [lessonForm, setLessonForm] = useState({
    title: '', videoUrl: '', pdfUrl: '', duration: '', targetCourseId: '', isLocked: true, quizUrl: ''
  });

  const [teacherForm, setTeacherForm] = useState({
    name: '', subject: '', commission: 10, totalEarnings: 0
  });

  const [codeSettings, setCodeSettings] = useState({ count: 10, targetId: '', type: 'course', amount: 0 });

  // --- جلب البيانات (Real-time) ---
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
        setStats(prev => ({...prev, codes: s.size}));
    });

    const unsubTeachers = onSnapshot(collection(db, "teachers"), (s) => {
        setTeachers(s.docs.map(d => ({id: d.id, ...d.data()})));
    });

    const unsubPayments = onSnapshot(query(collection(db, "payment_requests"), where("status", "==", "pending")), (s) => {
        setPaymentRequests(s.docs.map(d => ({id: d.id, ...d.data()})));
    });

    setLoading(false);
    return () => { 
      unsubUsers(); unsubCourses(); unsubCodes(); unsubBooks(); unsubTeachers(); unsubPayments();
    };
  }, []);

  // --- وظائف الإدارة ---
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
      alert("✅ تم التفعيل بنجاح");
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  const handlePublishCourse = async () => {
    if(!newCourse.title || !newCourse.price) return alert("❌ أكمل بيانات الكورس الأساسية");
    setLoading(true);
    try {
      await addDoc(collection(db, "courses_metadata"), {
        ...newCourse,
        adminId: auth.currentUser?.uid, 
        createdAt: serverTimestamp(),
        studentsCount: 0
      });
      alert("🚀 تم نشر الكورس بنجاح");
      setNewCourse({ title: '', instructor: 'أ. محمود فرج', instructorImage: '', subject: 'فيزياء', level: 'ثانوي', grade: '1 ثانوي', price: '', thumbnail: '', description: '', lessons: [] });
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  const handleAddTeacher = async () => {
    try {
      await addDoc(collection(db, "teachers"), { ...teacherForm, createdAt: serverTimestamp() });
      alert("✅ تم إضافة المعلم للنظام");
    } catch (e) { alert(e.message); }
  };

  const generateMassCodes = async () => {
    if (!codeSettings.targetId && codeSettings.type === 'course') return alert("❌ اختر الكورس المستهدف!");
    setLoading(true);
    try {
      for (let i = 0; i < codeSettings.count; i++) {
        const code = "TITO-" + Math.random().toString(36).substring(2, 9).toUpperCase();
        await addDoc(collection(db, "activationCodes"), {
          code,
          targetId: codeSettings.targetId,
          type: codeSettings.type,
          amount: codeSettings.amount,
          isUsed: false,
          createdAt: serverTimestamp()
        });
      }
      alert(`✅ تم توليد ${codeSettings.count} كود بنجاح`);
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  const resetDevices = async (userId) => {
    if(window.confirm("هل أنت متأكد من إعادة تعيين أجهزة الطالب؟")) {
      await updateDoc(doc(db, "users", userId), { deviceId: null, secondDeviceId: null });
      alert("✅ تم تصفير الأجهزة بنجاح");
    }
  };

  const deleteItem = async (coll, id) => {
    if(window.confirm("حذف نهائي؟")) {
      await deleteDoc(doc(db, coll, id));
    }
  };

  const gradeOptions = {
    'ابتدائي': ['1 ابتدائي', '2 ابتدائي', '3 ابتدائي', '4 ابتدائي', '5 ابتدائي', '6 ابتدائي'],
    'اعدادي': ['1 اعدادي', '2 اعدادي', '3 اعدادي'],
    'ثانوي': ['1 ثانوي', '2 ثانوي', '3 ثانوي']
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
        <div className="dock-logo"><Zap className="neon-icon" fill="#00f2ff" /> <span>TITO PANEL V2</span></div>
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
        </nav>
      </aside>

      <main className="main-content">
        {activeSection === 'stats' && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="stats-wrapper">
            <div className="stats-grid">
                <StatCard icon={<Users />} label="طالب مسجل" value={stats.students} color="#00f2ff" />
                <StatCard icon={<TrendingUp />} label="أرباح الشهر" value="45,000 EGP" color="#00ff88" />
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

        {activeSection === 'payments' && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="payments-manager">
             <div className="section-header">
                <h3><ShieldCheck color="#00ff88"/> مراجعة تحويلات فودافون كاش</h3>
             </div>
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
                          <img src={req.receiptUrl} alt="إيصال" />
                          <div className="overlay-zoom"><Eye size={20}/></div>
                       </div>
                    </div>
                    <div className="req-footer">
                       <button className="approve-btn" onClick={() => handleApprovePayment(req)}><CheckCircle size={16}/> موافقة</button>
                       <button className="reject-btn" onClick={() => deleteItem('payment_requests', req.id)}><Trash size={16}/> رفض</button>
                    </div>
                  </div>
                ))}
                {paymentRequests.length === 0 && <p className="empty-state">لا توجد طلبات معلقة</p>}
             </div>
          </motion.div>
        )}

        {activeSection === 'teachers' && (
          <div className="content-manager">
            <div className="editor-container glass">
              <h3><UserCircle /> إضافة معلم للنظام</h3>
              <div className="input-row">
                <input placeholder="اسم المعلم" onChange={e => setTeacherForm({...teacherForm, name: e.target.value})} />
                <input placeholder="المادة" onChange={e => setTeacherForm({...teacherForm, subject: e.target.value})} />
                <input type="number" placeholder="النسبة %" onChange={e => setTeacherForm({...teacherForm, commission: e.target.value})} />
                <button className="publish-btn" onClick={handleAddTeacher}><Plus /> إضافة</button>
              </div>
            </div>
            <div className="table-responsive mt-4">
              <table className="admin-table">
                <thead>
                  <tr><th>المعلم</th><th>المادة</th><th>النسبة</th><th>إجمالي المستحقات</th><th>إجراء</th></tr>
                </thead>
                <tbody>
                  {teachers.map(t => (
                    <tr key={t.id}>
                      <td>{t.name}</td><td>{t.subject}</td><td>{t.commission}%</td>
                      <td className="green-text">{(t.totalEarnings || 0).toLocaleString()} EGP</td>
                      <td><button onClick={()=>deleteItem('teachers', t.id)} className="icon-btn red"><Trash2 size={16}/></button></td>
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
                <button className={addMode === 'single-lesson' ? 'active' : ''} onClick={()=>setAddMode('single-lesson')}>دروس واختبارات</button>
             </div>
             {addMode === 'full-course' ? (
                 <div className="editor-container glass">
                    <div className="form-group">
                        <div className="input-row">
                            <input placeholder="عنوان الكورس" value={newCourse.title} onChange={e => setNewCourse({...newCourse, title: e.target.value})} />
                            <input placeholder="السعر" type="number" value={newCourse.price} onChange={e => setNewCourse({...newCourse, price: e.target.value})} />
                        </div>
                        <div className="input-row">
                            <select onChange={e => setNewCourse({...newCourse, instructor: e.target.value})}>
                                {teachers.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                            </select>
                            <input placeholder="رابط الصورة" onChange={e => setNewCourse({...newCourse, instructorImage: e.target.value})} />
                        </div>
                        <div className="input-row">
                            <select value={newCourse.level} onChange={e => setNewCourse({...newCourse, level: e.target.value, grade: gradeOptions[e.target.value][0]})}>
                                <option value="ابتدائي">ابتدائي</option><option value="اعدادي">اعدادي</option><option value="ثانوي">ثانوي</option>
                            </select>
                            <select value={newCourse.grade} onChange={e => setNewCourse({...newCourse, grade: e.target.value})}>
                                {gradeOptions[newCourse.level].map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                        <textarea placeholder="الوصف..." value={newCourse.description} onChange={e => setNewCourse({...newCourse, description: e.target.value})}></textarea>
                    </div>
                    <button className="publish-btn" onClick={handlePublishCourse}><PackagePlus /> نشر الكورس</button>
                 </div>
             ) : (
                <div className="editor-container glass">
                    <select className="full-select" onChange={e => setLessonForm({...lessonForm, targetCourseId: e.target.value})}>
                        <option value="">اختر الكورس...</option>
                        {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                    <input placeholder="عنوان المحاضرة" onChange={e => setLessonForm({...lessonForm, title: e.target.value})} />
                    <div className="input-row">
                        <input placeholder="رابط الفيديو" onChange={e => setLessonForm({...lessonForm, videoUrl: e.target.value})} />
                        <input placeholder="رابط الاختبار" onChange={e => setLessonForm({...lessonForm, quizUrl: e.target.value})} />
                    </div>
                    <button className="publish-btn blue" onClick={() => alert("تم التحديث")}><MonitorPlay /> تحديث</button>
                </div>
             )}
          </div>
        )}

        {activeSection === 'codes' && (
            <div className="codes-manager">
                <div className="control-card glass">
                    <h3><Wallet size={20} color="gold"/> توليد أكواد</h3>
                    <div className="gen-form">
                        <input type="number" placeholder="العدد" onChange={e => setCodeSettings({...codeSettings, count: parseInt(e.target.value)})} />
                        <select onChange={e => setCodeSettings({...codeSettings, type: e.target.value})}>
                            <option value="course">تفعيل كورس</option>
                            <option value="wallet">شحن محفظة</option>
                        </select>
                        {codeSettings.type === 'course' ? (
                          <select onChange={e => setCodeSettings({...codeSettings, targetId: e.target.value})}>
                              <option value="">اختر الكورس...</option>
                              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                          </select>
                        ) : (
                          <input type="number" placeholder="المبلغ" onChange={e => setCodeSettings({...codeSettings, amount: parseInt(e.target.value)})} />
                        )}
                        <button onClick={generateMassCodes} className="btn-gen">إنشاء</button>
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

        {activeSection === 'users' && (
            <div className="users-section glass">
                <div className="section-header">
                    <h3><Users /> الطلاب</h3>
                    <div className="search-box">
                        <Search size={18} /><input placeholder="بحث..." onChange={(e)=>setSearchTerm(e.target.value)} />
                    </div>
                </div>
                <div className="table-responsive">
                    <table className="admin-table">
                        <thead>
                            <tr><th>الطالب</th><th>الهاتف</th><th>المحفظة</th><th>الأجهزة</th><th>إجراء</th></tr>
                        </thead>
                        <tbody>
                            {allUsers.filter(u => u.name?.includes(searchTerm)).map(user => (
                                <tr key={user.id}>
                                    <td>
                                        <div className="u-cell" onClick={() => setSelectedUser(user)}>
                                            <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${user.email}`} alt="" />
                                            <div><p>{user.name}</p><small>{user.email}</small></div>
                                        </div>
                                    </td>
                                    <td><p>{user.phone}</p><small>{user.parentPhone}</small></td>
                                    <td><span className="wallet-badge">{user.walletBalance || 0} EGP</span></td>
                                    <td><button className="reset-btn" onClick={() => resetDevices(user.id)}><Smartphone size={14}/> Reset</button></td>
                                    <td><div className="action-row">
                                        <button className="icon-btn" onClick={() => alert("إشعار")}><Bell size={16}/></button>
                                        <button className="icon-btn red" onClick={() => deleteItem('users', user.id)}><ShieldBan size={16}/></button>
                                    </div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {activeSection === 'library' && (
            <div className="content-manager">
                <div className="editor-container glass">
                    <h3><BookOpen /> إضافة للمكتبة</h3>
                    <div className="input-row">
                        <input placeholder="الاسم" onChange={e => setNewBook({...newBook, title: e.target.value})} />
                        <select onChange={e => setNewBook({...newBook, category: e.target.value})}>
                            <option value="عامة">مكتبة عامة</option><option value="كورس">ملحقات</option>
                        </select>
                    </div>
                    <button className="publish-btn green" onClick={() => alert("تم")}><Plus /> إضافة</button>
                </div>
                <div className="items-grid mt-4">
                    {books.map(b => (
                        <div key={b.id} className="item-card glass">
                            <img src={b.thumbnail} alt="" />
                            <div className="item-info"><h4>{b.title}</h4><button onClick={()=>deleteItem('library_books', b.id)}><Trash2 size={16}/></button></div>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </main>

      <AnimatePresence>
        {selectedUser && (
          <motion.div className="modal-overlay" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <div className="activity-modal glass">
                <div className="modal-header"><h3>نشاط: {selectedUser.name}</h3><button onClick={()=>setSelectedUser(null)}><X /></button></div>
                <div className="modal-body">
                    <div className="log-item"><Clock size={16}/> دخول: {selectedUser.lastLogin || 'N/A'}</div>
                    <div className="log-item"><Smartphone size={16}/> الجهاز: {selectedUser.deviceId || 'لا يوجد'}</div>
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
