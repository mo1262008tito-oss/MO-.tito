import React, { useState, useEffect, useRef } from 'react';
import { db, auth, storage } from '../firebase'; 
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion'; 
import { 
  collection, query, updateDoc, doc, addDoc, 
  onSnapshot, serverTimestamp, where, deleteDoc, orderBy, 
  arrayUnion, increment, writeBatch, limit, getDocs, getDoc, arrayRemove,
  setDoc
} from "firebase/firestore";
import { 
  Users, Plus, Check, X, Bell, Unlock, Eye,
  DollarSign, LayoutDashboard, Trash2, Hash, 
  Video, Layers, Zap, ShieldBan, Send, 
  Search, Activity, FileText, Ticket, Heart, 
  TrendingUp, UserPlus, Mail, Smartphone, Filter, Save, AlertTriangle,
  ChevronRight, ChevronLeft, Download, ShieldCheck, Settings, Database
} from 'lucide-react';

import './AdminDash.css';

const AdminDash = () => {
  // ==========================================
  // [1] الحالات الرئيسية (Main States)
  // ==========================================
  const [activeSection, setActiveSection] = useState('stats');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  // ==========================================
  // [2] تخزين البيانات (Data States)
  // ==========================================
  const [stats, setStats] = useState({ 
    totalStudents: 0, 
    totalCourses: 0, 
    totalCodes: 0, 
    totalRevenue: 0,
    netProfit: 0, 
    charityFund: 0, 
    opsFund: 0,
    activeSubscribers: 0
  });
  
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [activationCodes, setActivationCodes] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [systemSettings, setSystemSettings] = useState({});

  // ==========================================
  // [3] حالات النماذج (Form States)
  // ==========================================
  const [courseForm, setCourseForm] = useState({ 
    title: '', price: '', thumbnail: '', grade: '1 ثانوي', 
    subject: 'فيزياء', videoUrl: '', description: '', 
    instructor: 'أ. محمود فرج', isActive: true 
  });

  const [notifForm, setNotifForm] = useState({ 
    title: '', message: '', targetUserId: 'all', type: 'broadcast', 
    actionUrl: '', importance: 'normal' 
  });

  const [codeForm, setCodeForm] = useState({ 
    count: 10, amount: 0, type: 'wallet', targetCourseId: '', 
    prefix: 'TITO' 
  });

  const [couponForm, setCouponForm] = useState({ 
    code: '', discount: 10, expiry: '', limit: 50, minAmount: 0 
  });

  // ==========================================
  // [4] المحرك الفوري (Real-time Core Engine)
  // ==========================================
  useEffect(() => {
    setLoading(true);
    const unsubscribers = [
      // مراقبة المستخدمين
      onSnapshot(collection(db, "users"), (snapshot) => {
        const usersList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setUsers(usersList);
        setStats(prev => ({ ...prev, totalStudents: snapshot.size }));
      }),

      // مراقبة الكورسات
      onSnapshot(collection(db, "courses_metadata"), (snapshot) => {
        setCourses(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        setStats(prev => ({ ...prev, totalCourses: snapshot.size }));
      }),

      // مراقبة طلبات الدفع المعلقة
      onSnapshot(query(collection(db, "payment_requests"), where("status", "==", "pending")), (snapshot) => {
        setPaymentRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      }),

      // مراقبة الأكواد (آخر 200 كود)
      onSnapshot(query(collection(db, "activationCodes"), orderBy("createdAt", "desc"), limit(200)), (snapshot) => {
        setActivationCodes(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        setStats(prev => ({ ...prev, totalCodes: snapshot.size }));
      }),

      // مراقبة الكوبونات
      onSnapshot(collection(db, "coupons"), (snapshot) => {
        setCoupons(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      }),

      // مراقبة سجل العمليات
      onSnapshot(query(collection(db, "audit_logs"), orderBy("timestamp", "desc"), limit(50)), (snapshot) => {
        setAuditLogs(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      }),

      // مراقبة النظام المالي العام
      onSnapshot(doc(db, "system_info", "totals"), (docSnap) => {
        if (docSnap.exists()) {
          setStats(prev => ({ ...prev, ...docSnap.data() }));
        }
      })
    ];

    setLoading(false);
    return () => unsubscribers.forEach(unsub => unsub());
  }, []);

  // ==========================================
  // [5] الوظائف المالية الاحترافية (Financial Logic)
  // ==========================================
  const handlePaymentDecision = async (request, status) => {
    const confirmation = window.confirm(`هل أنت متأكد من ${status === 'approved' ? 'قبول' : 'رفض'} هذا الطلب؟`);
    if (!confirmation) return;

    setLoading(true);
    try {
      const batch = writeBatch(db);
      const requestRef = doc(db, "payment_requests", request.id);
      const userRef = doc(db, "users", request.userId);
      const financeRef = doc(db, "system_info", "totals");

      if (status === 'approved') {
        // حساب التوزيع المالي (معدل لزيادة ربحك)
        const totalAmount = Number(request.amount);
        const profit = 60;    // ربحك الصافي
        const charity = 10;   // صندوق الخير
        const ops = 55;       // تشغيل (مساعدين + تقني)
        const teacher = 125;  // نصيب المدرس

        // 1. تفعيل الكورس للطالب
        batch.update(userRef, {
          enrolledContent: arrayUnion(request.courseId),
          totalSpent: increment(totalAmount)
        });

        // 2. تحديث الخزنة المركزية
        batch.set(financeRef, {
          totalRevenue: increment(totalAmount),
          netProfit: increment(profit),
          charityFund: increment(charity),
          opsFund: increment(ops)
        }, { merge: true });

        // 3. تحديث حالة الطلب
        batch.update(requestRef, { 
          status: 'approved', 
          processedBy: auth.currentUser.email,
          processedAt: serverTimestamp() 
        });

        // 4. إرسال إشعار فوري بنجاح التفعيل
        const notifRef = doc(collection(db, "users", request.userId, "notifications"));
        batch.set(notifRef, {
          title: "✅ تم تفعيل الكورس",
          message: `تمت الموافقة على تحويلك بنجاح. كورس ${request.courseName} متاح لك الآن.`,
          timestamp: serverTimestamp(),
          type: 'success',
          read: false
        });

        await logActivity("دفع مقبول", `تم تفعيل ${request.courseName} لـ ${request.userName}`);
      } else {
        const reason = prompt("اذكر سبب الرفض للطالب:");
        batch.update(requestRef, { status: 'rejected', rejectReason: reason });
        
        // إشعار الرفض
        const notifRef = doc(collection(db, "users", request.userId, "notifications"));
        batch.set(notifRef, {
          title: "❌ تعذر تفعيل الكورس",
          message: `تم رفض طلب الدفع للسبب التالي: ${reason}`,
          timestamp: serverTimestamp(),
          type: 'error',
          read: false
        });
      }

      await batch.commit();
      alert("تمت معالجة الطلب بنجاح");
    } catch (error) {
      alert("خطأ في المعالجة: " + error.message);
    }
    setLoading(false);
  };

  // ==========================================
  // [6] إدارة الطلاب المتطورة (User Management)
  // ==========================================
  const toggleUserBan = async (user) => {
    const action = user.isBanned ? "فك حظر" : "حظر";
    if (!window.confirm(`هل تريد ${action} الطالب ${user.name}؟`)) return;
    
    try {
      await updateDoc(doc(db, "users", user.id), { isBanned: !user.isBanned });
      await logActivity(action, `تم ${action} الطالب ${user.email}`);
    } catch (e) { alert(e.message); }
  };

  const resetUserDevices = async (user) => {
    if (!window.confirm("سيتم تسجيل خروج الطالب من جميع الأجهزة، استمرار؟")) return;
    try {
      await updateDoc(doc(db, "users", user.id), { 
        deviceId: null, 
        secondDeviceId: null,
        lastReset: serverTimestamp()
      });
      alert("✅ تم تصفير الأجهزة بنجاح");
    } catch (e) { alert(e.message); }
  };

  // ==========================================
  // [7] إدارة المحتوى (Course Management)
  // ==========================================
  const saveCourse = async () => {
    if (!courseForm.title || !courseForm.price) return alert("أكمل البيانات الأساسية");
    setLoading(true);
    try {
      const courseData = {
        ...courseForm,
        price: Number(courseForm.price),
        updatedAt: serverTimestamp()
      };

      if (courseForm.id) {
        await updateDoc(doc(db, "courses_metadata", courseForm.id), courseData);
        alert("تم تحديث الكورس");
      } else {
        courseData.createdAt = serverTimestamp();
        courseData.studentsCount = 0;
        await addDoc(collection(db, "courses_metadata"), courseData);
        alert("تم إضافة الكورس بنجاح");
      }
      setCourseForm({ title: '', price: '', thumbnail: '', grade: '1 ثانوي', subject: 'فيزياء', videoUrl: '', description: '', instructor: 'أ. محمود فرج' });
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  const deleteCourse = async (id) => {
    if (!window.confirm("حذف الكورس سيؤدي لفقدان الطلاب للمحتوى. هل أنت متأكد؟")) return;
    try {
      await deleteDoc(doc(db, "courses_metadata", id));
      alert("تم الحذف");
    } catch (e) { alert(e.message); }
  };

  // ==========================================
  // [8] نظام توليد الأكواد (Code Generator)
  // ==========================================
  const generateCodes = async () => {
    setLoading(true);
    try {
      const batch = writeBatch(db);
      const exportData = [];
      
      for (let i = 0; i < codeForm.count; i++) {
        const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
        const finalCode = `${codeForm.prefix}-${randomStr}`;
        const codeRef = doc(collection(db, "activationCodes"));
        
        const data = {
          code: finalCode,
          type: codeForm.type,
          amount: Number(codeForm.amount),
          targetCourseId: codeForm.targetCourseId || null,
          isUsed: false,
          createdAt: serverTimestamp(),
          createdBy: auth.currentUser.email
        };

        batch.set(codeRef, data);
        exportData.push({
          "الكود": finalCode,
          "النوع": codeForm.type === 'wallet' ? 'شحن محفظة' : 'تفعيل كورس',
          "القيمة/الكورس": codeForm.type === 'wallet' ? codeForm.amount : codeForm.targetCourseId,
          "تاريخ التوليد": new Date().toLocaleString()
        });
      }

      await batch.commit();
      
      // تصدير إكسيل
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "TitoCodes");
      XLSX.writeFile(wb, `Codes_${codeForm.prefix}_${Date.now()}.xlsx`);

      alert(`تم توليد ${codeForm.count} كود وتصديرهم لملف Excel`);
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  // ==========================================
  // [9] نظام الإشعارات (Notification Center)
  // ==========================================
  const broadcastNotification = async () => {
    if (!notifForm.title || !notifForm.message) return alert("أكمل محتوى الإشعار");
    setLoading(true);
    try {
      if (notifForm.targetUserId === 'all') {
        const batch = writeBatch(db);
        users.forEach(u => {
          const ref = doc(collection(db, "users", u.id, "notifications"));
          batch.set(ref, {
            title: notifForm.title,
            message: notifForm.message,
            timestamp: serverTimestamp(),
            type: notifForm.type,
            importance: notifForm.importance,
            read: false
          });
        });
        await batch.commit();
        alert("تم إرسال إشعار جماعي لجميع الطلاب");
      } else {
        await addDoc(collection(db, "users", notifForm.targetUserId, "notifications"), {
          title: notifForm.title,
          message: notifForm.message,
          timestamp: serverTimestamp(),
          type: 'private',
          read: false
        });
        alert("تم إرسال الإشعار الخاص");
      }
      setNotifForm({ ...notifForm, title: '', message: '' });
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  // ==========================================
  // [10] وظائف مساعدة (Helpers)
  // ==========================================
  const logActivity = async (action, details) => {
    await addDoc(collection(db, "audit_logs"), {
      admin: auth.currentUser.email,
      action,
      details,
      timestamp: serverTimestamp()
    });
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.phone?.includes(searchTerm) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ==========================================
  // [11] واجهة العرض (Master UI Render)
  // ==========================================
  return (
    <div className={`admin-nebula-container ${!isSidebarOpen ? 'sidebar-closed' : ''}`}>
      {loading && <div className="master-loader"><div className="neon-spinner"></div></div>}

      {/* Side Navigation */}
      <aside className="master-sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo"><Zap size={24} fill="#00f2ff"/></div>
          <span className="brand-name">TITO ADMIN <small>PRO v3</small></span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-group">
            <label>الرئيسية</label>
            <button className={activeSection === 'stats' ? 'active' : ''} onClick={() => setActiveSection('stats')}>
              <LayoutDashboard size={20}/> <span>لوحة التحكم</span>
            </button>
            <button className={activeSection === 'payments' ? 'active' : ''} onClick={() => setActiveSection('payments')}>
              <DollarSign size={20}/> <span>المبيعات</span>
              {paymentRequests.length > 0 && <span className="sidebar-badge">{paymentRequests.length}</span>}
            </button>
          </div>

          <div className="nav-group">
            <label>الإدارة</label>
            <button className={activeSection === 'users' ? 'active' : ''} onClick={() => setActiveSection('users')}>
              <Users size={20}/> <span>الطلاب</span>
            </button>
            <button className={activeSection === 'content' ? 'active' : ''} onClick={() => setActiveSection('content')}>
              <Layers size={20}/> <span>الكورسات</span>
            </button>
          </div>

          <div className="nav-group">
            <label>الأدوات</label>
            <button className={activeSection === 'codes' ? 'active' : ''} onClick={() => setActiveSection('codes')}>
              <Hash size={20}/> <span>الأكواد</span>
            </button>
            <button className={activeSection === 'notifs' ? 'active' : ''} onClick={() => setActiveSection('notifs')}>
              <Bell size={20}/> <span>الإشعارات</span>
            </button>
            <button className={activeSection === 'marketing' ? 'active' : ''} onClick={() => setActiveSection('marketing')}>
              <Ticket size={20}/> <span>الكوبونات</span>
            </button>
          </div>
        </nav>

        <div className="sidebar-profile">
          <div className="admin-avatar">{auth.currentUser?.email[0].toUpperCase()}</div>
          <div className="admin-meta">
            <span>{auth.currentUser?.email.split('@')[0]}</span>
            <button onClick={() => auth.signOut()}>تسجيل الخروج</button>
          </div>
        </div>
      </aside>

      {/* Main Viewport */}
      <main className="master-viewport">
        
        {/* SECTION: STATISTICS */}
        {activeSection === 'stats' && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="stats-view">
            <div className="welcome-bar">
              <h1>مرحباً بك، تيتو 👋</h1>
              <p>إليك ملخص أداء المنصة اليوم</p>
            </div>

            <div className="stats-grid">
              <div className="stat-box revenue">
                <div className="stat-icon"><TrendingUp/></div>
                <div className="stat-info">
                  <h3>{stats.totalRevenue?.toLocaleString()} ج.م</h3>
                  <p>إجمالي المبيعات</p>
                </div>
              </div>
              <div className="stat-box profit">
                <div className="stat-icon"><ShieldCheck/></div>
                <div className="stat-info">
                  <h3>{stats.netProfit?.toLocaleString()} ج.م</h3>
                  <p>صافي ربحك</p>
                </div>
              </div>
              <div className="stat-box students">
                <div className="stat-icon"><Users/></div>
                <div className="stat-info">
                  <h3>{stats.totalStudents}</h3>
                  <p>طالب مسجل</p>
                </div>
              </div>
              <div className="stat-box charity">
                <div className="stat-icon"><Heart/></div>
                <div className="stat-info">
                  <h3>{stats.charityFund} ج.م</h3>
                  <p>بند الخير</p>
                </div>
              </div>
            </div>

            <div className="dashboard-columns">
              <div className="recent-activity-card glass">
                <h3><Activity size={18}/> آخر العمليات</h3>
                <div className="activity-list">
                  {auditLogs.map(log => (
                    <div key={log.id} className="activity-item">
                      <div className="act-dot"></div>
                      <div className="act-content">
                        <strong>{log.action}</strong>
                        <p>{log.details}</p>
                        <small>{log.timestamp?.toDate()?.toLocaleString('ar-EG')}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="fast-actions-card glass">
                <h3><Zap size={18}/> إجراءات سريعة</h3>
                <div className="action-btns">
                  <button onClick={() => setActiveSection('codes')}>توليد 50 كود</button>
                  <button onClick={() => setActiveSection('notifs')}>تنبيه هام للجميع</button>
                  <button onClick={() => window.open('/reports')}>تحميل تقرير مالي</button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* SECTION: USERS MANAGEMENT */}
        {activeSection === 'users' && (
          <div className="users-view fade-in">
            <div className="view-header">
              <h2>إدارة الطلاب والأمان</h2>
              <div className="search-bar">
                <Search size={18}/>
                <input 
                  placeholder="ابحث بالاسم، الهاتف، أو الإيميل..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="master-table-container glass">
              <table className="master-table">
                <thead>
                  <tr>
                    <th>الطالب</th>
                    <th>بيانات الاتصال</th>
                    <th>المحفظة</th>
                    <th>الحالة</th>
                    <th>الأجهزة</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id} className={user.isBanned ? 'row-banned' : ''}>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar">{user.name[0]}</div>
                          <div className="user-info">
                            <strong>{user.name}</strong>
                            <span>{user.grade || 'غير محدد'}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="contact-cell">
                          <p><Smartphone size={14}/> {user.phone}</p>
                          <small>{user.email}</small>
                        </div>
                      </td>
                      <td><span className="wallet-txt">{user.walletBalance || 0} ج.م</span></td>
                      <td>
                        <span className={`status-badge ${user.isBanned ? 'banned' : 'active'}`}>
                          {user.isBanned ? 'محظور' : 'نشط'}
                        </span>
                      </td>
                      <td>
                        <button className="reset-btn" onClick={() => resetUserDevices(user)}>
                          <Unlock size={14}/> {user.deviceId ? 'مرتبط' : 'مفتوح'}
                        </button>
                      </td>
                      <td className="actions-cell">
                        <button title="تفاصيل" onClick={() => setSelectedUser(user)}><Eye size={18}/></button>
                        <button title="حظر" className="ban-btn" onClick={() => toggleUserBan(user)}><ShieldBan size={18}/></button>
                        <button title="حذف" className="del-btn" onClick={() => manageUser(user, 'delete')}><Trash2 size={18}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECTION: PAYMENTS */}
        {activeSection === 'payments' && (
          <div className="payments-view fade-in">
            <h2>طلبات الدفع ({paymentRequests.length})</h2>
            <div className="payment-cards-grid">
              {paymentRequests.map(req => (
                <div key={req.id} className="payment-card glass">
                  <div className="pay-tag">{req.courseName}</div>
                  <div className="pay-body">
                    <div className="pay-user">
                      <strong>{req.userName}</strong>
                      <span>المبلغ: {req.amount} ج.م</span>
                    </div>
                    <div className="receipt-preview" onClick={() => window.open(req.receiptUrl)}>
                      <img src={req.receiptUrl} alt="وصل الدفع" />
                      <div className="zoom-overlay"><Eye/> تكبير</div>
                    </div>
                    <p className="pay-date">{req.createdAt?.toDate()?.toLocaleString()}</p>
                  </div>
                  <div className="pay-actions">
                    <button className="approve-btn" onClick={() => handlePaymentDecision(req, 'approved')}>
                      <Check size={18}/> قبول التفعيل
                    </button>
                    <button className="reject-btn" onClick={() => handlePaymentDecision(req, 'rejected')}>
                      <X size={18}/> رفض
                    </button>
                  </div>
                </div>
              ))}
              {paymentRequests.length === 0 && (
                <div className="empty-state">لا توجد طلبات معلقة حالياً ✅</div>
              )}
            </div>
          </div>
        )}

        {/* SECTION: CODES GENERATOR */}
        {activeSection === 'codes' && (
          <div className="codes-view fade-in">
            <div className="codes-container glass">
              <div className="codes-form">
                <h3><Hash/> توليد أكواد جديدة</h3>
                <div className="form-row">
                  <div className="input-group">
                    <label>عدد الأكواد</label>
                    <input type="number" value={codeForm.count} onChange={e => setCodeForm({...codeForm, count: e.target.value})} />
                  </div>
                  <div className="input-group">
                    <label>البادئة (Prefix)</label>
                    <input type="text" value={codeForm.prefix} onChange={e => setCodeForm({...codeForm, prefix: e.target.value.toUpperCase()})} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="input-group">
                    <label>نوع الكود</label>
                    <select value={codeForm.type} onChange={e => setCodeForm({...codeForm, type: e.target.value})}>
                      <option value="wallet">شحن محفظة</option>
                      <option value="course">تفعيل كورس مباشر</option>
                    </select>
                  </div>
                  {codeForm.type === 'wallet' ? (
                    <div className="input-group">
                      <label>المبلغ</label>
                      <input type="number" value={codeForm.amount} onChange={e => setCodeForm({...codeForm, amount: e.target.value})} />
                    </div>
                  ) : (
                    <div className="input-group">
                      <label>اختر الكورس</label>
                      <select onChange={e => setCodeForm({...codeForm, targetCourseId: e.target.value})}>
                        <option value="">-- اختر --</option>
                        {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                      </select>
                    </div>
                  )}
                </div>
                <button className="main-btn" onClick={generateCodes}><Download/> توليد وتصدير Excel</button>
              </div>

              <div className="codes-list-preview">
                <h3>آخر الأكواد المولدة</h3>
                <div className="mini-table-container">
                  <table className="mini-table">
                    <thead>
                      <tr>
                        <th>الكود</th>
                        <th>النوع</th>
                        <th>الحالة</th>
                        <th>حذف</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activationCodes.map(c => (
                        <tr key={c.id}>
                          <td><code>{c.code}</code></td>
                          <td>{c.type === 'wallet' ? `${c.amount}ج` : 'كورس'}</td>
                          <td>
                            <span className={`mini-badge ${c.isUsed ? 'used' : 'new'}`}>
                              {c.isUsed ? 'مستخدم' : 'متاح'}
                            </span>
                          </td>
                          <td><button onClick={() => deleteDoc(doc(db, "activationCodes", c.id))}><X size={14}/></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* USER DETAIL MODAL */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div 
            className="modal-backdrop"
            initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
          >
            <motion.div 
              className="user-modal glass"
              initial={{y: 50}} animate={{y: 0}}
            >
              <div className="modal-header">
                <h2>تفاصيل الطالب</h2>
                <button onClick={() => setSelectedUser(null)}><X/></button>
              </div>
              <div className="modal-body">
                <div className="user-profile-header">
                  <div className="big-avatar">{selectedUser.name[0]}</div>
                  <div className="user-main-info">
                    <h3>{selectedUser.name}</h3>
                    <p>{selectedUser.email}</p>
                  </div>
                </div>
                <div className="user-stats-row">
                  <div className="u-stat"><span>رصيد المحفظة</span><strong>{selectedUser.walletBalance || 0} ج.م</strong></div>
                  <div className="u-stat"><span>الكورسات</span><strong>{selectedUser.enrolledContent?.length || 0}</strong></div>
                  <div className="u-stat"><span>تاريخ التسجيل</span><strong>{selectedUser.createdAt?.toDate()?.toLocaleDateString()}</strong></div>
                </div>
                <div className="user-courses-list">
                  <h4>الكورسات المشترك بها:</h4>
                  {selectedUser.enrolledContent?.map(cid => (
                    <div key={cid} className="enrolled-item">
                      <Check size={14} color="#00f2ff"/> {courses.find(c => c.id === cid)?.title || 'كورس مجهول'}
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button className="secondary-btn" onClick={() => resetUserDevices(selectedUser)}>تصفير الأجهزة</button>
                <button className="danger-btn" onClick={() => toggleUserBan(selectedUser)}>
                  {selectedUser.isBanned ? 'فك الحظر' : 'حظر الطالب'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AdminDash;
