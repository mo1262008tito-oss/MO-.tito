import React, { useState, useEffect, useCallback } from 'react';
import { db, auth, storage } from '../firebase'; 
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion'; 
import { 
  collection, query, updateDoc, doc, addDoc, 
  onSnapshot, serverTimestamp, where, deleteDoc, orderBy, 
  arrayUnion, increment, writeBatch, limit, getDocs, getDoc,
  setDoc, runTransaction
} from "firebase/firestore";
import { 
  Users, Plus, Check, X, Bell, Unlock, Eye, BookOpen,
  DollarSign, LayoutDashboard, Trash2, Hash, Video, Layers, 
  Zap, ShieldBan, Send, Search, Activity, Smartphone, Heart, 
  TrendingUp, Download, ShieldCheck, Settings, Star, Clock,
  FileText, ShieldAlert, BarChart3, UserCheck, Percent, Gift,
  LogOut, ClipboardList, MonitorSmartphone, HelpCircle
} from 'lucide-react';

import './AdminDash.css';

const AdminDash = () => {
  // ==========================================
  // [1] حالات النظام الأساسية (System States)
  // ==========================================
  const [activeSection, setActiveSection] = useState('stats');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // للمبيعات والطلاب

  // ==========================================
  // [2] مستودعات البيانات (Data Repositories)
  // ==========================================
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [books, setBooks] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [activationCodes, setActivationCodes] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [financialStats, setFinancialStats] = useState({
    totalRevenue: 0,
    netProfit: 0,
    charityFund: 0,
    opsFund: 0,
    totalSalesCount: 0
  });

  // ==========================================
  // [3] كائنات النماذج (Complex Form Objects)
  // ==========================================
  const [courseForm, setCourseForm] = useState({ 
    title: '', price: '', thumbnail: '', grade: '1 ثانوي', subject: 'فيزياء', 
    videoUrl: '', description: '', instructor: 'أ. محمود فرج', 
    isFree: false, folderName: '', tags: [] 
  });

  const [bookForm, setBookForm] = useState({ 
    title: '', price: 0, link: '', cover: '', grade: '1 ثانوي', 
    pages: '', description: '', isDownloadable: true 
  });

  const [notifForm, setNotifForm] = useState({ 
    title: '', message: '', type: 'broadcast', importance: 'normal', 
    targetGrade: 'all', actionLink: '' 
  });

  const [codeForm, setCodeForm] = useState({ 
    count: 10, amount: 0, type: 'wallet', targetCourseId: '', 
    prefix: 'TITO', expirationDays: 30 
  });

  const [couponForm, setCouponForm] = useState({
    code: '', discountPercent: 10, limit: 100, minPurchase: 0, expiryDate: ''
  });

  // ==========================================
  // [4] المحرك التشغيلي (Real-time Core Engine)
  // ==========================================
  useEffect(() => {
    setLoading(true);
    const syncDatabase = () => {
      const queries = [
        onSnapshot(collection(db, "users"), (snapshot) => {
          setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        }),
        onSnapshot(collection(db, "courses_metadata"), (snapshot) => {
          setCourses(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        }),
        onSnapshot(collection(db, "books"), (snapshot) => {
          setBooks(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        }),
        onSnapshot(query(collection(db, "payment_requests"), orderBy("createdAt", "desc")), (snapshot) => {
          setPaymentRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        }),
        onSnapshot(query(collection(db, "activationCodes"), orderBy("createdAt", "desc"), limit(150)), (snapshot) => {
          setActivationCodes(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        }),
        onSnapshot(query(collection(db, "audit_logs"), orderBy("timestamp", "desc"), limit(40)), (snapshot) => {
          setAuditLogs(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        }),
        onSnapshot(doc(db, "system_info", "totals"), (snapshot) => {
          if (snapshot.exists()) setFinancialStats(snapshot.data());
        }),
        onSnapshot(collection(db, "coupons"), (snapshot) => {
          setCoupons(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        })
      ];
      return queries;
    };

    const listeners = syncDatabase();
    setLoading(false);
    return () => listeners.forEach(unsub => unsub());
  }, []);

  // ==========================================
  // [5] نظام إدارة العمليات (Operations Logic)
  // ==========================================
  
  const logSystemAction = async (action, details) => {
    try {
      await addDoc(collection(db, "audit_logs"), {
        admin: auth.currentUser?.email || "System",
        action,
        details,
        timestamp: serverTimestamp(),
        ip: "Internal"
      });
    } catch (e) { console.error("Logging failed", e); }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!courseForm.title || !courseForm.price) return alert("❌ البيانات الأساسية ناقصة!");
    setLoading(true);
    try {
      const courseRef = await addDoc(collection(db, "courses_metadata"), {
        ...courseForm,
        price: Number(courseForm.price),
        createdAt: serverTimestamp(),
        studentsCount: 0,
        rating: 5,
        reviews: []
      });
      await logSystemAction("إضافة كورس", `تم إنشاء كورس جديد: ${courseForm.title}`);
      alert("✅ تم نشر الكورس بنجاح واصبح متاحاً للطلاب");
      setCourseForm({ title: '', price: '', thumbnail: '', grade: '1 ثانوي', subject: 'فيزياء', videoUrl: '', description: '', instructor: 'أ. محمود فرج' });
    } catch (err) { alert(err.message); }
    setLoading(false);
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, "books"), {
        ...bookForm,
        price: Number(bookForm.price),
        createdAt: serverTimestamp()
      });
      await logSystemAction("إضافة كتاب", `تم إضافة كتاب: ${bookForm.title}`);
      setBookForm({ title: '', price: 0, link: '', cover: '', grade: '1 ثانوي' });
      alert("✅ تمت إضافة الكتاب للمتجر");
    } catch (err) { alert(err.message); }
    setLoading(false);
  };

  // ==========================================
  // [6] المحرك المالي الذكي (Advanced Finance)
  // ==========================================
  
  const handlePaymentDecision = async (req, status, reason = "") => {
    const confirmation = window.confirm(`هل أنت متأكد من ${status === 'approved' ? 'قبول' : 'رفض'} هذا الطلب؟`);
    if (!confirmation) return;

    setLoading(true);
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, "users", req.userId);
        const reqRef = doc(db, "payment_requests", req.id);
        const financeRef = doc(db, "system_info", "totals");
        
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) throw "المستخدم غير موجود!";

        if (status === 'approved') {
          transaction.update(userRef, {
            enrolledContent: arrayUnion(req.courseId),
            totalSpent: increment(Number(req.amount))
          });
          transaction.update(financeRef, {
            totalRevenue: increment(Number(req.amount)),
            netProfit: increment(Number(req.amount) * 0.7), // نسبة الربح 70%
            totalSalesCount: increment(1)
          });
          transaction.update(reqRef, { 
            status: 'approved', 
            processedAt: serverTimestamp(),
            admin: auth.currentUser.email
          });
          
          // إشعار الطالب
          const notifRef = doc(collection(db, "users", req.userId, "notifications"));
          transaction.set(notifRef, {
            title: "✅ تمت الموافقة على طلبك",
            message: `كورس ${req.courseName} أصبح متاحاً لك الآن. مشاهدة ممتعة!`,
            type: "success",
            timestamp: serverTimestamp(),
            read: false
          });
        } else {
          transaction.update(reqRef, { 
            status: 'rejected', 
            rejectReason: reason,
            processedAt: serverTimestamp() 
          });
          const notifRef = doc(collection(db, "users", req.userId, "notifications"));
          transaction.set(notifRef, {
            title: "❌ تعذر تفعيل الكورس",
            message: `تم رفض طلبك للسبب: ${reason}. يرجى مراجعة الدعم الفني.`,
            type: "error",
            timestamp: serverTimestamp(),
            read: false
          });
        }
      });
      await logSystemAction(`معالجة دفع`, `${status}: ${req.userName}`);
      alert("✅ تمت العملية بنجاح وتحديث بيانات الطالب");
    } catch (e) { alert("❌ خطأ مالي: " + e.message); }
    setLoading(false);
  };

  // ==========================================
  // [7] نظام الإشعارات الجماعي (Mass Broadcast)
  // ==========================================
  
  const handleMassNotify = async () => {
    if (!notifForm.title || !notifForm.message) return alert("❌ المحتوى فارغ!");
    const confirmSend = window.confirm(`هل تريد إرسال الإشعار لـ ${users.length} طالب؟`);
    if (!confirmSend) return;

    setLoading(true);
    try {
      const batchSize = 400; // Firebase limit
      const batches = [];
      let currentBatch = writeBatch(db);
      let count = 0;

      for (const user of users) {
        if (notifForm.targetGrade !== 'all' && user.grade !== notifForm.targetGrade) continue;
        
        const nRef = doc(collection(db, "users", user.id, "notifications"));
        currentBatch.set(nRef, {
          ...notifForm,
          sender: "الإدارة",
          timestamp: serverTimestamp(),
          read: false
        });

        count++;
        if (count === batchSize) {
          batches.push(currentBatch.commit());
          currentBatch = writeBatch(db);
          count = 0;
        }
      }
      
      if (count > 0) batches.push(currentBatch.commit());
      await Promise.all(batches);
      
      await logSystemAction("إشعار جماعي", `إرسال: ${notifForm.title}`);
      alert("🚀 انطلق الإشعار بنجاح لجميع الهواتف!");
      setNotifForm({ title: '', message: '', type: 'broadcast', importance: 'normal', targetGrade: 'all' });
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  // ==========================================
  // [8] نظام توليد الأكواد (Code Factory)
  // ==========================================
  
  const generateCodesXLSX = async () => {
    if (!codeForm.amount || codeForm.count < 1) return alert("أدخل بيانات صحيحة");
    setLoading(true);
    try {
      const batch = writeBatch(db);
      const generatedData = [];
      
      for (let i = 0; i < codeForm.count; i++) {
        const uniqueID = Math.random().toString(36).substring(2, 9).toUpperCase();
        const finalCode = `${codeForm.prefix}-${uniqueID}`;
        const ref = doc(collection(db, "activationCodes"));
        
        const payload = {
          code: finalCode,
          amount: Number(codeForm.amount),
          type: codeForm.type,
          isUsed: false,
          createdAt: serverTimestamp(),
          createdBy: auth.currentUser.email,
          targetCourseId: codeForm.targetCourseId || 'all'
        };
        
        batch.set(ref, payload);
        generatedData.push({ "الكود": finalCode, "القيمة": codeForm.amount, "النوع": codeForm.type });
      }
      
      await batch.commit();
      
      const ws = XLSX.utils.json_to_sheet(generatedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Codes");
      XLSX.writeFile(wb, `TITO_CODES_${Date.now()}.xlsx`);
      
      await logSystemAction("توليد أكواد", `تم إنشاء ${codeForm.count} كود`);
      alert("✅ تم التوليد وتصدير ملف Excel بنجاح");
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  // ==========================================
  // [9] أدوات الطالب (Student Toolkit)
  // ==========================================
  
  const toggleUserLock = async (user) => {
    const newState = !user.isBanned;
    try {
      await updateDoc(doc(db, "users", user.id), { isBanned: newState });
      await logSystemAction(newState ? "حظر مستخدم" : "فك حظر", user.email);
    } catch (e) { alert(e.message); }
  };

  const clearDeviceAuth = async (userId) => {
    if (!window.confirm("هل أنت متأكد من تصفير الأجهزة؟")) return;
    try {
      await updateDoc(doc(db, "users", userId), {
        deviceId: null,
        secondDeviceId: null,
        lastDeviceReset: serverTimestamp()
      });
      alert("✅ الطالب يستطيع الآن الدخول من جهاز جديد");
    } catch (e) { alert(e.message); }
  };

  // ==========================================
  // [10] واجهة العرض الرئيسية (Master View)
  // ==========================================
  
  return (
    <div className={`admin-nebula-container ${!isSidebarOpen ? 'collapsed' : ''}`}>
      {loading && <div className="master-loader"><div className="neon-spinner"></div><p>جاري مزامنة السحابة...</p></div>}

      {/* Sidebar - القائمة الجانبية الضخمة */}
      <aside className="master-sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon"><Zap fill="#00f2ff" /></div>
          <div className="brand-text">
            <h2>TITO CORE</h2>
            <span>SYSTEM V4.0.1</span>
          </div>
        </div>

        <div className="nav-wrapper">
          <div className="nav-group">
            <span className="group-title">لوحة التحليل</span>
            <button className={activeSection === 'stats' ? 'active' : ''} onClick={() => setActiveSection('stats')}>
              <BarChart3 size={20}/> <span>الإحصائيات العامة</span>
            </button>
            <button className={activeSection === 'audit' ? 'active' : ''} onClick={() => setActiveSection('audit')}>
              <ClipboardList size={20}/> <span>سجل الرقابة</span>
            </button>
          </div>

          <div className="nav-group">
            <span className="group-title">إدارة الأفراد</span>
            <button className={activeSection === 'users' ? 'active' : ''} onClick={() => setActiveSection('users')}>
              <Users size={20}/> <span>قاعدة الطلاب</span>
            </button>
            <button className={activeSection === 'payments' ? 'active' : ''} onClick={() => setActiveSection('payments')}>
              <DollarSign size={20}/> <span>طلبات المبيعات</span>
              {paymentRequests.filter(r=>r.status==='pending').length > 0 && <span className="badge-pulse">!</span>}
            </button>
          </div>

          <div className="nav-group">
            <span className="group-title">المحتوى التعليمي</span>
            <button className={activeSection === 'content' ? 'active' : ''} onClick={() => setActiveSection('content')}>
              <Video size={20}/> <span>الكورسات والدروس</span>
            </button>
            <button className={activeSection === 'books' ? 'active' : ''} onClick={() => setActiveSection('books')}>
              <BookOpen size={20}/> <span>المكتبة والمتجر</span>
            </button>
          </div>

          <div className="nav-group">
            <span className="group-title">التسويق والأدوات</span>
            <button className={activeSection === 'codes' ? 'active' : ''} onClick={() => setActiveSection('codes')}>
              <Hash size={20}/> <span>مولد الأكواد</span>
            </button>
            <button className={activeSection === 'coupons' ? 'active' : ''} onClick={() => setActiveSection('coupons')}>
              <Percent size={20}/> <span>كوبونات الخصم</span>
            </button>
            <button className={activeSection === 'notifs' ? 'active' : ''} onClick={() => setActiveSection('notifs')}>
              <Bell size={20}/> <span>مركز الإشعارات</span>
            </button>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="admin-card">
            <div className="admin-avatar">{auth.currentUser?.email[0].toUpperCase()}</div>
            <div className="admin-info">
              <p>{auth.currentUser?.email.split('@')[0]}</p>
              <small>سوبر أدمن</small>
            </div>
            <button onClick={() => auth.signOut()} className="logout-btn"><LogOut size={16}/></button>
          </div>
        </div>
      </aside>

      {/* Content Area - مساحة المحتوى */}
      <main className="master-viewport">
        <header className="main-header">
          <div className="header-left">
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="toggle-btn">
              <Layers size={20}/>
            </button>
            <h1>{activeSection.toUpperCase()} DASHBOARD</h1>
          </div>
          <div className="header-right">
            <div className="server-status">
              <div className="status-dot"></div>
              <span>خادم Firebase: مستقر</span>
            </div>
            <button className="icon-btn-circle"><Settings size={20}/></button>
            <button className="icon-btn-circle"><HelpCircle size={20}/></button>
          </div>
        </header>

        <div className="view-container">
          
          {/* SECTION: STATISTICS (The Engine) */}
          {activeSection === 'stats' && (
            <div className="stats-view fade-in">
              <div className="stats-top-row">
                <div className="glass-card stat-main">
                  <div className="card-icon blue"><TrendingUp/></div>
                  <div className="card-data">
                    <p>إجمالي المبيعات (الخزنة)</p>
                    <h2>{financialStats.totalRevenue?.toLocaleString()} <small>ج.م</small></h2>
                    <span className="growth">+12.5% هذا الشهر</span>
                  </div>
                </div>
                <div className="glass-card stat-main">
                  <div className="card-icon green"><ShieldCheck/></div>
                  <div className="card-data">
                    <p>صافي الربح التقديري</p>
                    <h2>{financialStats.netProfit?.toLocaleString()} <small>ج.م</small></h2>
                    <span className="growth">+8.2% عن أمس</span>
                  </div>
                </div>
                <div className="glass-card stat-main">
                  <div className="card-icon purple"><Users/></div>
                  <div className="card-data">
                    <p>الطلاب المسجلين</p>
                    <h2>{users.length}</h2>
                    <span className="growth">+{users.filter(u => u.createdAt > Date.now() - 86400000).length} جديد</span>
                  </div>
                </div>
                <div className="glass-card stat-main">
                  <div className="card-icon gold"><MonitorSmartphone/></div>
                  <div className="card-data">
                    <p>الجلسات النشطة</p>
                    <h2>{Math.floor(users.length * 0.4)}</h2>
                    <span className="status">أونلاين الآن</span>
                  </div>
                </div>
              </div>

              <div className="stats-middle-grid">
                <div className="glass-card chart-placeholder">
                  <h3><BarChart3 size={18}/> توزيع الطلاب حسب الصف الدراسي</h3>
                  <div className="grade-dist">
                    {['1 ثانوي', '2 ثانوي', '3 ثانوي'].map(g => (
                      <div key={g} className="grade-bar-item">
                        <span>{g}</span>
                        <div className="bar-bg">
                          <div 
                            className="bar-fill" 
                            style={{width: `${(users.filter(u=>u.grade===g).length / users.length) * 100}%`}}
                          ></div>
                        </div>
                        <span>{users.filter(u=>u.grade===g).length} طالباً</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-card logs-mini">
                  <h3><Activity size={18}/> آخر الأنشطة البرمجية</h3>
                  <div className="mini-log-list">
                    {auditLogs.slice(0, 8).map(log => (
                      <div key={log.id} className="mini-log-item">
                        <Clock size={12}/>
                        <p><strong>{log.admin}</strong> {log.action}: {log.details}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: USERS (The Core) */}
          {activeSection === 'users' && (
            <div className="users-manager fade-in">
              <div className="manager-header">
                <div className="search-wrapper">
                  <Search size={20}/>
                  <input 
                    placeholder="ابحث عن طالب بالاسم، الهاتف، أو الإيميل الكودي..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="filter-tabs">
                  <button className={activeTab === 'all' ? 'active' : ''} onClick={()=>setActiveTab('all')}>الكل</button>
                  <button className={activeTab === 'active' ? 'active' : ''} onClick={()=>setActiveTab('active')}>نشطين</button>
                  <button className={activeTab === 'banned' ? 'active' : ''} onClick={()=>setActiveTab('banned')}>محظورين</button>
                </div>
              </div>

              <div className="table-container glass">
                <table className="master-table">
                  <thead>
                    <tr>
                      <th><UserCheck size={16}/> الطالب</th>
                      <th><Smartphone size={16}/> الاتصال</th>
                      <th><Layers size={16}/> المرحلة</th>
                      <th><DollarSign size={16}/> المحفظة</th>
                      <th><ShieldAlert size={16}/> الحالة</th>
                      <th><Settings size={16}/> العمليات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users
                      .filter(u => u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.phone?.includes(searchTerm))
                      .map(user => (
                      <tr key={user.id} className={user.isBanned ? 'banned-row' : ''}>
                        <td>
                          <div className="user-info-cell">
                            <div className="u-avatar">{user.name?.[0].toUpperCase()}</div>
                            <div className="u-text">
                              <strong>{user.name}</strong>
                              <small>{user.email}</small>
                            </div>
                          </div>
                        </td>
                        <td>{user.phone || '01xxxxxxxxx'}</td>
                        <td><span className="grade-tag">{user.grade || 'غير محدد'}</span></td>
                        <td><span className="wallet-amount">{(user.walletBalance || 0).toFixed(2)} ج.م</span></td>
                        <td>
                          <div className={`status-pill ${user.isBanned ? 'red' : 'green'}`}>
                            {user.isBanned ? 'محظور' : 'نشط'}
                          </div>
                        </td>
                        <td className="table-actions">
                          <button onClick={() => setSelectedUser(user)} className="act-btn blue" title="عرض الملف"><Eye size={18}/></button>
                          <button onClick={() => clearDeviceAuth(user.id)} className="act-btn purple" title="تصفير الأجهزة"><Unlock size={18}/></button>
                          <button onClick={() => toggleUserLock(user)} className={`act-btn ${user.isBanned ? 'green' : 'red'}`} title={user.isBanned ? 'فك الحظر' : 'حظر'}>
                            <ShieldBan size={18}/>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION: PAYMENTS (The Revenue) */}
          {activeSection === 'payments' && (
            <div className="payments-view fade-in">
              <div className="view-header">
                <h2>إدارة الفواتير والاشتراكات</h2>
                <div className="stats-mini">
                  <span>معلق: {paymentRequests.filter(r=>r.status==='pending').length}</span>
                  <span>مقبول: {paymentRequests.filter(r=>r.status==='approved').length}</span>
                </div>
              </div>

              <div className="payment-grid">
                <AnimatePresence>
                  {paymentRequests.map(req => (
                    <motion.div 
                      key={req.id} 
                      className={`payment-card glass ${req.status}`}
                      initial={{opacity: 0, scale: 0.9}}
                      animate={{opacity: 1, scale: 1}}
                    >
                      <div className="card-head">
                        <span className="course-name">{req.courseName}</span>
                        <span className="status-label">{req.status === 'pending' ? 'انتظار' : 'تمت'}</span>
                      </div>
                      <div className="card-body">
                        <div className="user-min">
                          <p>{req.userName}</p>
                          <small>{req.phone}</small>
                        </div>
                        <div className="amount-box">
                          <label>المبلغ</label>
                          <strong>{req.amount} ج.م</strong>
                        </div>
                        <div className="receipt-container" onClick={() => window.open(req.receiptUrl)}>
                          <img src={req.receiptUrl} alt="وصل الدفع" />
                          <div className="zoom-hint"><Search size={16}/> تكبير الوصل</div>
                        </div>
                      </div>
                      {req.status === 'pending' && (
                        <div className="card-actions">
                          <button className="approve" onClick={() => handlePaymentDecision(req, 'approved')}>
                            <Check size={18}/> تفعيل المشترك
                          </button>
                          <button className="reject" onClick={() => {
                            const r = prompt("سبب الرفض:");
                            if(r) handlePaymentDecision(req, 'rejected', r);
                          }}>
                            <X size={18}/> رفض
                          </button>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* SECTION: CONTENT (The Product) */}
          {activeSection === 'content' && (
            <div className="content-view fade-in">
              <div className="split-layout">
                <div className="form-column">
                  <div className="glass-card form-box">
                    <h3><Plus/> إضافة كورس جديد</h3>
                    <form onSubmit={handleCreateCourse} className="pro-form">
                      <div className="form-group">
                        <label>عنوان الكورس التجاري</label>
                        <input value={courseForm.title} onChange={e=>setCourseForm({...courseForm, title: e.target.value})} placeholder="مثال: مراجعة شهر أكتوبر - فيزياء" />
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>سعر التفعيل (ج.م)</label>
                          <input type="number" value={courseForm.price} onChange={e=>setCourseForm({...courseForm, price: e.target.value})} />
                        </div>
                        <div className="form-group">
                          <label>الصف الدراسي</label>
                          <select value={courseForm.grade} onChange={e=>setCourseForm({...courseForm, grade: e.target.value})}>
                            <option>1 ثانوي</option>
                            <option>2 ثانوي</option>
                            <option>3 ثانوي</option>
                          </select>
                        </div>
                      </div>
                      <div className="form-group">
                        <label>رابط الصورة المصغرة (Thumbnail URL)</label>
                        <input value={courseForm.thumbnail} onChange={e=>setCourseForm({...courseForm, thumbnail: e.target.value})} placeholder="https://..." />
                      </div>
                      <div className="form-group">
                        <label>رابط فيديو البرومو</label>
                        <input value={courseForm.videoUrl} onChange={e=>setCourseForm({...courseForm, videoUrl: e.target.value})} placeholder="YouTube or Vimeo link" />
                      </div>
                      <div className="form-group">
                        <label>وصف المحتوى</label>
                        <textarea value={courseForm.description} onChange={e=>setCourseForm({...courseForm, description: e.target.value})} rows="4"></textarea>
                      </div>
                      <button type="submit" className="main-submit-btn">
                        <Save size={20}/> حفظ ونشر الكورس
                      </button>
                    </form>
                  </div>
                </div>

                <div className="list-column">
                  <h3>الكورسات الحالية في المنصة ({courses.length})</h3>
                  <div className="course-list-grid">
                    {courses.map(c => (
                      <div key={c.id} className="course-mini-card glass">
                        <img src={c.thumbnail} alt="" />
                        <div className="c-info">
                          <h4>{c.title}</h4>
                          <p>{c.price} ج.م | {c.grade}</p>
                          <div className="c-stats">
                            <span><Users size={12}/> {c.studentsCount || 0}</span>
                            <span><Star size={12}/> {c.rating}</span>
                          </div>
                        </div>
                        <div className="c-actions">
                          <button className="edit-btn"><Settings size={14}/></button>
                          <button className="del-btn" onClick={() => deleteDoc(doc(db, "courses_metadata", c.id))}><Trash2 size={14}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: CODES (The Generator) */}
          {activeSection === 'codes' && (
            <div className="codes-manager fade-in">
              <div className="codes-config-card glass">
                <div className="card-header">
                  <h3><Gift size={22}/> محرك توليد أكواد الشحن والتفعيل</h3>
                  <p>الأكواد المولدة يتم تصديرها فوراً لملف Excel لسهولة الطباعة والتوزيع</p>
                </div>
                
                <div className="config-grid">
                  <div className="config-item">
                    <label>كمية الأكواد</label>
                    <input type="number" value={codeForm.count} onChange={e=>setCodeForm({...codeForm, count: e.target.value})} />
                  </div>
                  <div className="config-item">
                    <label>قيمة الكود (ج.م)</label>
                    <input type="number" value={codeForm.amount} onChange={e=>setCodeForm({...codeForm, amount: e.target.value})} />
                  </div>
                  <div className="config-item">
                    <label>بادئة الكود (Prefix)</label>
                    <input value={codeForm.prefix} onChange={e=>setCodeForm({...codeForm, prefix: e.target.value.toUpperCase()})} />
                  </div>
                  <div className="config-item">
                    <label>نوع الكود</label>
                    <select value={codeForm.type} onChange={e=>setCodeForm({...codeForm, type: e.target.value})}>
                      <option value="wallet">شحن رصيد محفظة</option>
                      <option value="course">تفعيل كورس معين</option>
                    </select>
                  </div>
                </div>
                
                {codeForm.type === 'course' && (
                  <div className="config-item full-width">
                    <label>اختر الكورس المستهدف</label>
                    <select onChange={e=>setCodeForm({...codeForm, targetCourseId: e.target.value})}>
                      <option value="">-- اختر من الكورسات المتاحة --</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.title} ({c.grade})</option>)}
                    </select>
                  </div>
                )}

                <button className="generate-trigger-btn" onClick={generateCodesXLSX}>
                  <Download size={20}/> بدء عملية التوليد والتصدير (Excel)
                </button>
              </div>

              <div className="recent-codes-table glass">
                <h4>آخر 100 كود تم إنشاؤه</h4>
                <table className="mini-table">
                  <thead>
                    <tr>
                      <th>الكود</th>
                      <th>القيمة</th>
                      <th>الحالة</th>
                      <th>بواسطة</th>
                      <th>تاريخ العمل</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activationCodes.map(code => (
                      <tr key={code.id}>
                        <td><code>{code.code}</code></td>
                        <td>{code.amount} ج.م</td>
                        <td>
                          <span className={`status-tag ${code.isUsed ? 'used' : 'available'}`}>
                            {code.isUsed ? 'مستخدم' : 'متاح'}
                          </span>
                        </td>
                        <td>{code.createdBy?.split('@')[0]}</td>
                        <td>{code.createdAt?.toDate()?.toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION: NOTIFICATIONS (The Messenger) */}
          {activeSection === 'notifs' && (
            <div className="notifs-manager fade-in">
              <div className="broadcast-card glass">
                <div className="b-header">
                  <Bell size={30} color="#00f2ff"/>
                  <div className="b-title">
                    <h3>مركز البث المباشر (Broadcast)</h3>
                    <p>إرسال إشعارات فورية تظهر كـ Pop-up في تطبيق الطلاب</p>
                  </div>
                </div>

                <div className="b-form">
                  <div className="form-group">
                    <label>عنوان التنبيه</label>
                    <input 
                      value={notifForm.title} 
                      onChange={e=>setNotifForm({...notifForm, title: e.target.value})} 
                      placeholder="مثال: تنبيه بخصوص الحصة القادمة"
                    />
                  </div>
                  <div className="form-group">
                    <label>نص الرسالة</label>
                    <textarea 
                      value={notifForm.message} 
                      onChange={e=>setNotifForm({...notifForm, message: e.target.value})} 
                      rows="6"
                      placeholder="اكتب تفاصيل الإشعار هنا..."
                    ></textarea>
                  </div>
                  
                  <div className="b-row">
                    <div className="form-group">
                      <label>الجمهور المستهدف</label>
                      <select value={notifForm.targetGrade} onChange={e=>setNotifForm({...notifForm, targetGrade: e.target.value})}>
                        <option value="all">كل الطلاب</option>
                        <option value="1 ثانوي">طلاب أولى ثانوي</option>
                        <option value="2 ثانوي">طلاب تانية ثانوي</option>
                        <option value="3 ثانوي">طلاب تالته ثانوي</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>الأهمية</label>
                      <select value={notifForm.importance} onChange={e=>setNotifForm({...notifForm, importance: e.target.value})}>
                        <option value="normal">عادية (رمادي)</option>
                        <option value="high">عالية (أصفر)</option>
                        <option value="urgent">قصوى (أحمر)</option>
                      </select>
                    </div>
                  </div>

                  <button className="send-notif-btn" onClick={handleMassNotify}>
                    <Send size={20}/> إرسال الإشعار لـ {notifForm.targetGrade === 'all' ? users.length : users.filter(u=>u.grade===notifForm.targetGrade).length} طالب الآن
                  </button>
                </div>
              </div>

              <div className="notif-history glass">
                <h3>سجل الإشعارات المرسلة</h3>
                <div className="history-list">
                   {/* سيتم جلب سجل الإشعارات العامة هنا لاحقاً */}
                   <div className="empty-notif">لا يوجد إشعارات سابقة في الذاكرة المؤقتة</div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* MODAL: STUDENT PROFILE (The 360 View) */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div className="modal-backdrop" initial={{opacity:0}} animate={{opacity:1}}>
            <motion.div className="user-modal-detailed glass" initial={{y: 50}} animate={{y:0}}>
              <div className="modal-header">
                <div className="u-main">
                  <div className="u-avatar-big">{selectedUser.name?.[0]}</div>
                  <div className="u-text">
                    <h3>{selectedUser.name}</h3>
                    <p>{selectedUser.email}</p>
                  </div>
                </div>
                <button className="close-modal" onClick={()=>setSelectedUser(null)}><X/></button>
              </div>

              <div className="modal-content-tabs">
                <div className="info-grid">
                  <div className="info-item">
                    <label>المحفظة</label>
                    <strong>{selectedUser.walletBalance || 0} ج.م</strong>
                  </div>
                  <div className="info-item">
                    <label>رقم الهاتف</label>
                    <strong>{selectedUser.phone}</strong>
                  </div>
                  <div className="info-item">
                    <label>تاريخ الانضمام</label>
                    <strong>{selectedUser.createdAt?.toDate()?.toLocaleDateString()}</strong>
                  </div>
                  <div className="info-item">
                    <label>الأجهزة</label>
                    <strong>{selectedUser.deviceId ? 'جهاز مسجل' : 'لا يوجد'}</strong>
                  </div>
                </div>

                <div className="courses-enrolled">
                  <h4>الكورسات المشترك بها:</h4>
                  <div className="enrolled-list">
                    {selectedUser.enrolledContent?.map(cid => (
                      <div key={cid} className="enrolled-tag">
                        <Check size={14}/> {courses.find(c=>c.id===cid)?.title || 'كورس مفعّل'}
                      </div>
                    ))}
                    {(!selectedUser.enrolledContent || selectedUser.enrolledContent.length === 0) && <p>لا يوجد كورسات مفعلة حالياً</p>}
                  </div>
                </div>

                <div className="modal-actions-footer">
                   <button className="action-btn purple-bg" onClick={() => clearDeviceAuth(selectedUser.id)}>تصفير الأجهزة</button>
                   <button className="action-btn red-bg" onClick={() => toggleUserLock(selectedUser)}>
                     {selectedUser.isBanned ? 'فك حظر الطالب' : 'حظر من المنصة'}
                   </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AdminDash;
