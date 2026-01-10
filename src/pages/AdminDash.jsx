import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  db, auth, storage 
} from '../firebase'; 
import { 
  collection, query, updateDoc, doc, addDoc, onSnapshot, 
  serverTimestamp, where, deleteDoc, orderBy, arrayUnion, 
  increment, writeBatch, limit, getDocs, getDoc, setDoc, 
  runTransaction, arrayRemove, startAfter, endBefore
} from "firebase/firestore";
import { 
  getStorage, ref, uploadBytesResumable, getDownloadURL 
} from "firebase/storage";
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion'; 
import { 
  Users, Plus, Check, X, Bell, Unlock, Eye, BookOpen,
  DollarSign, LayoutDashboard, Trash2, Hash, Video, Layers, 
  Zap, ShieldBan, Send, Search, Activity, Smartphone, Heart, 
  TrendingUp, Download, ShieldCheck, Settings, Star, Clock,
  FileText, ShieldAlert, BarChart3, UserCheck, Percent, Gift,
  LogOut, ClipboardList, MonitorSmartphone, HelpCircle, Save, 
  Image as ImageIcon, FileUp, Filter, ChevronRight, Share2, 
  Database, HardDrive, RefreshCcw, Mail, Globe, Lock,
  Award, Target, Calendar, PieChart, MessageSquare, 
  ChevronDown, Edit3, Trash, UserPlus, Play, Info
} from 'lucide-react';

// --- CSS استيراد التنسيقات ---
import './AdminSystem.css';

const AdminSystem = () => {
  // ============================================================
  // [1] الحالات الأساسية للنظام (System Global States)
  // ============================================================
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [globalSearch, setGlobalSearch] = useState('');
  const [filterGrade, setFilterGrade] = useState('الكل');
  
  // ============================================================
  // [2] مستودعات البيانات (Data Repositories)
  // ============================================================
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [exams, setExams] = useState([]);
  const [books, setBooks] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [activationCodes, setActivationCodes] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [withdrawRequests, setWithdrawRequests] = useState([]);
  
  // إحصائيات النظام
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    pendingPayments: 0,
    courseSales: 0,
    examAttempts: 0,
    systemUptime: '99.9%'
  });

  // ============================================================
  // [3] كائنات النماذج التفصيلية (Detailed Form States)
  // ============================================================
  
  // نموذج الكورسات
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    instructor: 'أ. محمود فرج',
    price: '',
    discountPrice: '',
    thumbnail: '',
    grade: '1 ثانوي',
    subject: 'فيزياء',
    isPublished: true,
    features: [],
    requirements: '',
    level: 'Beginner',
    videoPlaylistId: ''
  });

  // نموذج الامتحانات المتطور
  const [examForm, setExamForm] = useState({
    title: '',
    courseId: '',
    duration: 60,
    passPercentage: 50,
    questions: [
      { id: 1, text: '', options: ['', '', '', ''], correct: 0, points: 5, type: 'mcq' }
    ],
    isActive: true,
    showResultsImmediately: true,
    preventBacktracking: false,
    randomizeQuestions: true
  });

  // نموذج الأكواد
  const [codeGenerator, setCodeGenerator] = useState({
    amount: 100,
    count: 10,
    prefix: 'TITO',
    type: 'wallet', // wallet | course | discount
    targetId: '',
    expiresAt: ''
  });

  // ============================================================
  // [4] نظام الربط مع قاعدة البيانات (Firestore Engine)
  // ============================================================
  
  useEffect(() => {
    setIsLoading(true);
    
    // 1. مراقبة المستخدمين
    const qUsers = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);
    });

    // 2. مراقبة الكورسات
    const qCourses = query(collection(db, "courses_metadata"), orderBy("createdAt", "desc"));
    const unsubCourses = onSnapshot(qCourses, (snapshot) => {
      setCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 3. مراقبة طلبات الدفع
    const qPayments = query(collection(db, "payment_requests"), orderBy("createdAt", "desc"));
    const unsubPayments = onSnapshot(qPayments, (snapshot) => {
      setPaymentRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 4. مراقبة الامتحانات
    const qExams = query(collection(db, "exams"), orderBy("createdAt", "desc"));
    const unsubExams = onSnapshot(qExams, (snapshot) => {
      setExams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 5. مراقبة الإحصائيات العامة
    const unsubStats = onSnapshot(doc(db, "system_info", "dashboard"), (doc) => {
      if (doc.exists()) setStats(prev => ({ ...prev, ...doc.data() }));
    });

    // 6. مراقبة سجل العمليات
    const qLogs = query(collection(db, "audit_logs"), orderBy("timestamp", "desc"), limit(50));
    const unsubLogs = onSnapshot(qLogs, (snapshot) => {
      setAuditLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    setIsLoading(false);

    return () => {
      unsubUsers(); unsubCourses(); unsubPayments(); 
      unsubExams(); unsubStats(); unsubLogs();
    };
  }, []);

  // ============================================================
  // [5] دوال معالجة المنطق (Business Logic Functions)
  // ============================================================

  // أداة تسجيل العمليات
  const recordAuditLog = async (actionType, message, severity = 'info') => {
    try {
      await addDoc(collection(db, "audit_logs"), {
        adminId: auth.currentUser?.uid || 'System',
        adminEmail: auth.currentUser?.email || 'System',
        action: actionType,
        details: message,
        severity: severity,
        timestamp: serverTimestamp(),
        ipAddress: 'Internal'
      });
    } catch (e) { console.error("Log failed", e); }
  };

  // معالجة رفع الملفات والصور
  const uploadAsset = (file, path) => {
    return new Promise((resolve, reject) => {
      if (!file) return resolve(null);
      const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        }, 
        (error) => reject(error), 
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            resolve(downloadURL);
          });
        }
      );
    });
  };

  // --- نظام إدارة الكورسات ---
  const saveCourse = async (e) => {
    e.preventDefault();
    if (!courseForm.title || !courseForm.price) return alert("❌ البيانات غير مكتملة");
    
    setIsLoading(true);
    try {
      const courseData = {
        ...courseForm,
        price: Number(courseForm.price),
        discountPrice: Number(courseForm.discountPrice || 0),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        salesCount: 0,
        averageRating: 0
      };

      if (courseForm.id) {
        await updateDoc(doc(db, "courses_metadata", courseForm.id), courseData);
        await recordAuditLog("Update Course", `تم تحديث الكورس: ${courseForm.title}`);
      } else {
        await addDoc(collection(db, "courses_metadata"), courseData);
        await recordAuditLog("Create Course", `تم إنشاء كورس جديد: ${courseForm.title}`);
      }

      setCourseForm({ title: '', description: '', price: '', grade: '1 ثانوي' });
      alert("✅ تمت العملية بنجاح");
    } catch (err) {
      alert("خطأ: " + err.message);
    }
    setIsLoading(false);
  };

  // --- نظام إدارة الامتحانات ---
  const addQuestionToForm = () => {
    setExamForm({
      ...examForm,
      questions: [
        ...examForm.questions,
        { id: Date.now(), text: '', options: ['', '', '', ''], correct: 0, points: 5, type: 'mcq' }
      ]
    });
  };

  const removeQuestion = (qId) => {
    setExamForm({
      ...examForm,
      questions: examForm.questions.filter(q => q.id !== qId)
    });
  };

  const handleExamSubmit = async () => {
    if (!examForm.title || !examForm.courseId) return alert("❌ أدخل عنوان الامتحان والكورس");
    setIsLoading(true);
    try {
      await addDoc(collection(db, "exams"), {
        ...examForm,
        createdAt: serverTimestamp(),
        totalPoints: examForm.questions.reduce((sum, q) => sum + q.points, 0)
      });
      alert("✅ تم نشر الامتحان بنجاح");
      setExamForm({ title: '', questions: [] });
    } catch (e) { alert(e.message); }
    setIsLoading(false);
  };

  // --- نظام الموافقة على المدفوعات (فودافون كاش) ---
  const processPaymentRequest = async (request, action) => {
    setIsLoading(true);
    try {
      await runTransaction(db, async (transaction) => {
        const reqRef = doc(db, "payment_requests", request.id);
        const userRef = doc(db, "users", request.userId);
        const statsRef = doc(db, "system_info", "dashboard");

        if (action === 'approve') {
          // 1. تحديث حالة الطلب
          transaction.update(reqRef, { status: 'approved', approvedAt: serverTimestamp() });
          
          // 2. إضافة المحتوى للطالب
          transaction.update(userRef, {
            enrolledContent: arrayUnion(request.courseId),
            totalSpent: increment(Number(request.amount))
          });

          // 3. تحديث الإحصائيات المالية
          transaction.update(statsRef, {
            totalRevenue: increment(Number(request.amount)),
            todayRevenue: increment(Number(request.amount)),
            courseSales: increment(1)
          });

          // 4. إرسال إشعار للطالب
          const notifRef = doc(collection(db, "users", request.userId, "notifications"));
          transaction.set(notifRef, {
            title: "تم تفعيل الاشتراك! 🎓",
            message: `لقد تم تفعيل اشتراكك في ${request.courseName} بنجاح. نتمنى لك دراسة ممتعة.`,
            type: "success",
            timestamp: serverTimestamp(),
            read: false
          });
          
          await recordAuditLog("Payment Approved", `تم قبول دفع ${request.amount} من ${request.userName}`);
        } else {
          transaction.update(reqRef, { status: 'rejected', rejectedAt: serverTimestamp() });
          await recordAuditLog("Payment Rejected", `تم رفض دفع من ${request.userName}`, 'warning');
        }
      });
      alert("✅ تمت معالجة الطلب");
    } catch (e) {
      alert("خطأ في المعاملة: " + e.message);
    }
    setIsLoading(false);
  };

  // --- نظام توليد الأكواد (Bulk Code Generator) ---
  const generateBulkCodes = async () => {
    if (!codeGenerator.amount || !codeGenerator.count) return;
    setIsLoading(true);
    const batch = writeBatch(db);
    const generatedData = [];

    try {
      for (let i = 0; i < codeGenerator.count; i++) {
        const randomCode = `${codeGenerator.prefix}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
        const newCodeRef = doc(collection(db, "activationCodes"));
        
        const codeData = {
          code: randomCode,
          value: Number(codeGenerator.amount),
          type: codeGenerator.type,
          isUsed: false,
          usedBy: null,
          targetId: codeGenerator.targetId || 'all',
          createdAt: serverTimestamp(),
          expiresAt: codeGenerator.expiresAt || null
        };

        batch.set(newCodeRef, codeData);
        generatedData.push({ "الكود": randomCode, "القيمة": codeGenerator.amount, "النوع": codeGenerator.type });
      }

      await batch.commit();
      
      // تصدير لـ Excel
      const worksheet = XLSX.utils.json_to_sheet(generatedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "الأكواد");
      XLSX.writeFile(workbook, `Tito_Codes_${Date.now()}.xlsx`);

      alert(`✅ تم توليد ${codeGenerator.count} كود بنجاح`);
    } catch (e) {
      alert("خطأ في التوليد: " + e.message);
    }
    setIsLoading(false);
  };

  // --- وظائف التحكم في الطلاب ---
  const resetUserDevice = async (userId) => {
    if (!window.confirm("هل تريد حقاً إعادة تعيين أجهزة هذا الطالب؟")) return;
    try {
      await updateDoc(doc(db, "users", userId), {
        deviceId: null,
        lastLogin: serverTimestamp(),
        loginAttempts: 0
      });
      alert("✅ تم تصفير الأجهزة بنجاح");
      await recordAuditLog("Security", `إعادة تعيين جهاز الطالب: ${userId}`);
    } catch (e) { alert(e.message); }
  };

  const banUser = async (userId, status) => {
    try {
      await updateDoc(doc(db, "users", userId), { isBanned: !status });
      await recordAuditLog("Security", `تغيير حالة حظر الطالب: ${userId} إلى ${!status}`);
    } catch (e) { alert(e.message); }
  };

  // ============================================================
  // [6] واجهات العرض (UI Rendering Components)
  // ============================================================

  // مكون بطاقة الإحصائيات
  const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className={`modern-stat-card ${color}`}>
      <div className="stat-icon-wrapper">
        <Icon size={24} />
      </div>
      <div className="stat-content">
        <h4>{title}</h4>
        <h3>{value}</h3>
        {trend && <span className="trend-label">+{trend}% من الأسبوع الماضي</span>}
      </div>
      <div className="stat-decoration"></div>
    </div>
  );

  return (
    <div className={`admin-app-layout ${isSidebarCollapsed ? 'sidebar-min' : ''}`}>
      
      {/* --- السايد بار --- */}
      <aside className="main-sidebar">
        <div className="sidebar-header">
          <div className="logo-area">
            <div className="logo-hex">T</div>
            {!isSidebarCollapsed && <h2>TITO <span>DASHBOARD</span></h2>}
          </div>
          <button className="collapse-toggle" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
            {isSidebarCollapsed ? <ChevronRight size={18}/> : <Layers size={18}/>}
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul className="nav-list">
            <li className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>
              <LayoutDashboard size={20} /> <span>لوحة التحكم</span>
            </li>
            <div className="nav-separator">الإدارة الأكاديمية</div>
            <li className={activeTab === 'courses' ? 'active' : ''} onClick={() => setActiveTab('courses')}>
              <Video size={20} /> <span>الكورسات</span>
            </li>
            <li className={activeTab === 'exams' ? 'active' : ''} onClick={() => setActiveTab('exams')}>
              <ClipboardList size={20} /> <span>الامتحانات</span>
            </li>
            <li className={activeTab === 'library' ? 'active' : ''} onClick={() => setActiveTab('library')}>
              <BookOpen size={20} /> <span>المكتبة</span>
            </li>
            <div className="nav-separator">إدارة الطلاب</div>
            <li className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>
              <Users size={20} /> <span>قاعدة الطلاب</span>
            </li>
            <li className={activeTab === 'payments' ? 'active' : ''} onClick={() => setActiveTab('payments')}>
              <DollarSign size={20} /> <span>المبيعات</span>
              {stats.pendingPayments > 0 && <span className="badge-count">{stats.pendingPayments}</span>}
            </li>
            <div className="nav-separator">أدوات متقدمة</div>
            <li className={activeTab === 'codes' ? 'active' : ''} onClick={() => setActiveTab('codes')}>
              <Hash size={20} /> <span>مولد الأكواد</span>
            </li>
            <li className={activeTab === 'marketing' ? 'active' : ''} onClick={() => setActiveTab('marketing')}>
              <Gift size={20} /> <span>الكوبونات</span>
            </li>
            <li className={activeTab === 'logs' ? 'active' : ''} onClick={() => setActiveTab('logs')}>
              <Activity size={20} /> <span>سجل النظام</span>
            </li>
          </ul>
        </nav>

        <div className="sidebar-bottom">
          <button className="profile-mini-card">
            <Settings size={18} />
            <span>الإعدادات</span>
          </button>
          <button className="logout-action" onClick={() => auth.signOut()}>
            <LogOut size={18} />
            <span>خروج</span>
          </button>
        </div>
      </aside>

      {/* --- المحتوى الرئيسي --- */}
      <main className="main-viewport">
        
        {/* هيدر المحتوى */}
        <header className="viewport-header">
          <div className="header-search">
            <Search size={18} />
            <input 
              placeholder="ابحث عن طالب، كود، أو معاملة..." 
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
            />
          </div>
          <div className="header-actions">
            <div className="notif-bell">
              <Bell size={22} />
              <span className="dot"></span>
            </div>
            <div className="admin-profile">
              <div className="admin-info">
                <span>أهلاً بك،</span>
                <strong>الأدمن</strong>
              </div>
              <img src="https://ui-avatars.com/api/?name=Admin&background=random" alt="Admin" />
            </div>
          </div>
        </header>

        {/* جسم المحتوى المتغير */}
        <div className="content-scroller">
          <AnimatePresence mode="wait">
            
            {/* 1. لوحة التحكم الرئيسية */}
            {activeTab === 'dashboard' && (
              <motion.section 
                key="dash" 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }}
                className="dashboard-section"
              >
                <div className="stats-grid">
                  <StatCard title="إجمالي الدخل" value={`${stats.totalRevenue} ج.م`} icon={TrendingUp} color="blue" trend="12" />
                  <StatCard title="طلاب نشطين" value={users.length} icon={Users} color="green" />
                  <StatCard title="طلبات معلقة" value={paymentRequests.filter(p=>p.status==='pending').length} icon={Clock} color="orange" />
                  <StatCard title="مبيعات الكورسات" value={stats.courseSales} icon={ShoppingBag} color="purple" />
                </div>

                <div className="dashboard-charts-row">
                  <div className="glass-panel main-chart-area">
                    <div className="panel-header">
                      <h3><Activity size={18}/> نشاط المنصة خلال 24 ساعة</h3>
                      <button className="icon-btn"><RefreshCcw size={16}/></button>
                    </div>
                    <div className="chart-placeholder">
                      {/* هنا يتم دمج Chart.js لاحقاً */}
                      <div className="dummy-chart">
                        {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                          <div key={i} className="bar" style={{ height: `${h}%` }}></div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="glass-panel activity-feed">
                    <div className="panel-header">
                      <h3><Bell size={18}/> آخر العمليات</h3>
                    </div>
                    <div className="feed-list">
                      {auditLogs.slice(0, 6).map(log => (
                        <div className={`feed-item ${log.severity}`} key={log.id}>
                          <div className="dot"></div>
                          <div className="text">
                            <p>{log.details}</p>
                            <span>{new Date(log.timestamp?.seconds * 1000).toLocaleTimeString('ar-EG')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.section>
            )}

            {/* 2. إدارة الكورسات */}
            {activeTab === 'courses' && (
              <motion.section key="courses" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="courses-manager">
                <div className="manager-header">
                  <h2>إدارة المحتوى التعليمي</h2>
                  <button className="add-btn" onClick={() => setCourseForm({title:'', price:'', grade:'1 ثانوي'})}>
                    <Plus size={18}/> إضافة كورس جديد
                  </button>
                </div>

                <div className="courses-layout">
                  <div className="course-form-card glass-panel">
                    <h3>بيانات الكورس</h3>
                    <form onSubmit={saveCourse} className="giant-form">
                      <div className="input-group">
                        <label>عنوان الكورس</label>
                        <input value={courseForm.title} onChange={e=>setCourseForm({...courseForm, title: e.target.value})} placeholder="مثال: مراجعة ليلة الامتحان" />
                      </div>
                      <div className="row">
                        <div className="input-group">
                          <label>السعر الأساسي</label>
                          <input type="number" value={courseForm.price} onChange={e=>setCourseForm({...courseForm, price: e.target.value})} />
                        </div>
                        <div className="input-group">
                          <label>المرحلة</label>
                          <select value={courseForm.grade} onChange={e=>setCourseForm({...courseForm, grade: e.target.value})}>
                            <option>1 ثانوي</option>
                            <option>2 ثانوي</option>
                            <option>3 ثانوي</option>
                          </select>
                        </div>
                      </div>
                      <div className="input-group">
                        <label>رابط الصورة المصغرة (Thumbnail)</label>
                        <div className="file-input-wrapper">
                          <input value={courseForm.thumbnail} onChange={e=>setCourseForm({...courseForm, thumbnail: e.target.value})} />
                          <button type="button"><ImageIcon size={18}/></button>
                        </div>
                      </div>
                      <div className="input-group">
                        <label>وصف تفصيلي</label>
                        <textarea rows="4" value={courseForm.description} onChange={e=>setCourseForm({...courseForm, description: e.target.value})} />
                      </div>
                      <button type="submit" className="submit-btn" disabled={isLoading}>
                        {isLoading ? 'جاري الحفظ...' : <><Save size={18}/> حفظ الكورس ونشره</>}
                      </button>
                    </form>
                  </div>

                  <div className="courses-grid">
                    {courses.map(course => (
                      <div className="course-item-card" key={course.id}>
                        <div className="card-thumb">
                          <img src={course.thumbnail || 'https://placehold.co/400x225'} alt="" />
                          <div className="card-badge">{course.grade}</div>
                        </div>
                        <div className="card-body">
                          <h4>{course.title}</h4>
                          <div className="price-tag">{course.price} ج.م</div>
                          <div className="stats">
                            <span><Users size={14}/> {course.salesCount} طالب</span>
                            <span><Star size={14}/> {course.averageRating}</span>
                          </div>
                          <div className="card-actions">
                            <button className="edit-btn" onClick={() => setCourseForm(course)}><Edit3 size={16}/></button>
                            <button className="del-btn" onClick={() => deleteDoc(doc(db, "courses_metadata", course.id))}><Trash2 size={16}/></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.section>
            )}

            {/* 3. إدارة الامتحانات (المنطق الأكبر) */}
            {activeTab === 'exams' && (
              <motion.section key="exams" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="exams-manager">
                <div className="exams-container">
                  <div className="exam-editor glass-panel">
                    <div className="editor-top">
                      <h3><Target size={20}/> محرر الامتحانات الذكي</h3>
                      <button className="main-btn" onClick={handleExamSubmit}>نشر الامتحان الآن</button>
                    </div>

                    <div className="exam-meta-inputs">
                      <input 
                        className="title-input" 
                        placeholder="اسم الامتحان (مثال: اختبار الشهر - فيزياء)" 
                        value={examForm.title}
                        onChange={e => setExamForm({...examForm, title: e.target.value})}
                      />
                      <div className="meta-row">
                        <select onChange={e => setExamForm({...examForm, courseId: e.target.value})}>
                          <option value="">اختر الكورس المرتبط</option>
                          {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </select>
                        <div className="num-input">
                          <label>الوقت (دقيقة)</label>
                          <input type="number" value={examForm.duration} onChange={e=>setExamForm({...examForm, duration: e.target.value})} />
                        </div>
                      </div>
                    </div>

                    <div className="questions-list">
                      {examForm.questions.map((q, index) => (
                        <div className="question-box" key={q.id}>
                          <div className="q-header">
                            <span>السؤال {index + 1}</span>
                            <button onClick={() => removeQuestion(q.id)}><X size={16}/></button>
                          </div>
                          <textarea 
                            placeholder="اكتب نص السؤال هنا..."
                            value={q.text}
                            onChange={e => {
                              const newQs = [...examForm.questions];
                              newQs[index].text = e.target.value;
                              setExamForm({...examForm, questions: newQs});
                            }}
                          />
                          <div className="options-grid">
                            {q.options.map((opt, oIdx) => (
                              <div className={`opt-input ${q.correct === oIdx ? 'correct' : ''}`} key={oIdx}>
                                <input 
                                  type="radio" 
                                  name={`correct-${q.id}`} 
                                  checked={q.correct === oIdx}
                                  onChange={() => {
                                    const newQs = [...examForm.questions];
                                    newQs[index].correct = oIdx;
                                    setExamForm({...examForm, questions: newQs});
                                  }}
                                />
                                <input 
                                  placeholder={`خيار ${oIdx + 1}`} 
                                  value={opt}
                                  onChange={e => {
                                    const newQs = [...examForm.questions];
                                    newQs[index].options[oIdx] = e.target.value;
                                    setExamForm({...examForm, questions: newQs});
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      <button className="add-q-btn" onClick={addQuestionToForm}>
                        <Plus size={18}/> إضافة سؤال جديد
                      </button>
                    </div>
                  </div>

                  <div className="exams-list-side">
                    <h3>الامتحانات المتاحة</h3>
                    {exams.map(ex => (
                      <div className="exam-mini-card" key={ex.id}>
                        <div className="info">
                          <h4>{ex.title}</h4>
                          <p>{ex.questions?.length} سؤال | {ex.duration} دقيقة</p>
                        </div>
                        <div className="actions">
                           <button className="btn-stat"><BarChart3 size={14}/></button>
                           <button className="btn-del" onClick={() => deleteDoc(doc(db, "exams", ex.id))}><Trash size={14}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.section>
            )}

            {/* 4. إدارة الطلاب وقاعدة البيانات */}
            {activeTab === 'users' && (
              <motion.section key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="users-manager">
                <div className="table-controls glass-panel">
                  <div className="left">
                    <div className="search-box">
                      <Search size={18}/>
                      <input placeholder="البحث عن طالب (بالاسم أو الهاتف)..." onChange={e => setGlobalSearch(e.target.value)} />
                    </div>
                    <select onChange={e => setFilterGrade(e.target.value)}>
                      <option>الكل</option>
                      <option>1 ثانوي</option>
                      <option>2 ثانوي</option>
                      <option>3 ثانوي</option>
                    </select>
                  </div>
                  <div className="right">
                    <button className="export-btn" onClick={() => {
                       const ws = XLSX.utils.json_to_sheet(users);
                       const wb = XLSX.utils.book_new();
                       XLSX.utils.book_append_sheet(wb, ws, "Students");
                       XLSX.writeFile(wb, "Student_Base.xlsx");
                    }}>
                      <Download size={18}/> تصدير البيانات
                    </button>
                  </div>
                </div>

                <div className="data-table-wrapper glass-panel">
                  <table className="pro-table">
                    <thead>
                      <tr>
                        <th>الطالب</th>
                        <th>المرحلة</th>
                        <th>رقم الهاتف</th>
                        <th>المحفظة</th>
                        <th>تاريخ الانضمام</th>
                        <th>الحالة</th>
                        <th>الأمان</th>
                        <th>الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.filter(u => 
                        (filterGrade === 'الكل' || u.grade === filterGrade) &&
                        (u.name?.includes(globalSearch) || u.phone?.includes(globalSearch))
                      ).map(user => (
                        <tr key={user.id}>
                          <td>
                            <div className="student-cell">
                              <div className="avatar-small">{user.name?.[0]}</div>
                              <div className="details">
                                <strong>{user.name}</strong>
                                <span>{user.email}</span>
                              </div>
                            </div>
                          </td>
                          <td><span className="grade-pill">{user.grade}</span></td>
                          <td>{user.phone}</td>
                          <td><strong>{user.walletBalance || 0} ج.م</strong></td>
                          <td>{user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : '-'}</td>
                          <td>
                            <span className={`status-badge ${user.isBanned ? 'banned' : 'active'}`}>
                              {user.isBanned ? 'محظور' : 'نشط'}
                            </span>
                          </td>
                          <td>
                             <button className="security-btn" title="تصفير الجهاز" onClick={() => resetUserDevice(user.id)}>
                               <Smartphone size={16}/>
                             </button>
                          </td>
                          <td className="actions-cell">
                             <button className="view-btn"><Eye size={16}/></button>
                             <button className="ban-btn" onClick={() => banUser(user.id, user.isBanned)}>
                               <ShieldBan size={16}/>
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.section>
            )}

            {/* 5. نظام المدفوعات والفوترة */}
            {activeTab === 'payments' && (
              <motion.section key="payments" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="payments-manager">
                <div className="payment-tabs">
                  <button className="active">الطلبات المعلقة ({paymentRequests.filter(p=>p.status==='pending').length})</button>
                  <button>تاريخ العمليات</button>
                  <button>إحصائيات المبيعات</button>
                </div>

                <div className="requests-grid">
                  {paymentRequests.filter(p => p.status === 'pending').map(req => (
                    <div className="payment-card glass-panel" key={req.id}>
                      <div className="card-top">
                        <div className="user-info">
                          <div className="avatar">{req.userName?.[0]}</div>
                          <div>
                            <h4>{req.userName}</h4>
                            <span>{req.userPhone}</span>
                          </div>
                        </div>
                        <div className="amount-badge">{req.amount} ج.م</div>
                      </div>
                      <div className="card-content">
                        <p><strong>المطلوب:</strong> تفعيل {req.courseName}</p>
                        <p><strong>الوسيلة:</strong> {req.paymentMethod || 'فودافون كاش'}</p>
                        <div className="receipt-preview" onClick={() => window.open(req.receiptUrl)}>
                           <img src={req.receiptUrl} alt="Receipt" />
                           <div className="overlay"><Eye/> تكبير الصورة</div>
                        </div>
                      </div>
                      <div className="card-footer">
                        <button className="approve-btn" onClick={() => processPaymentRequest(req, 'approve')}>
                          <Check size={18}/> قبول وتفعيل
                        </button>
                        <button className="reject-btn" onClick={() => processPaymentRequest(req, 'reject')}>
                          <X size={18}/> رفض الطلب
                        </button>
                      </div>
                    </div>
                  ))}
                  {paymentRequests.filter(p=>p.status==='pending').length === 0 && (
                    <div className="empty-state">
                      <ShieldCheck size={48}/>
                      <p>لا توجد طلبات معلقة حالياً. عمل ممتاز!</p>
                    </div>
                  )}
                </div>
              </motion.section>
            )}

            {/* 6. مولد الأكواد الذكي */}
            {activeTab === 'codes' && (
              <motion.section key="codes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="codes-generator-view">
                <div className="generator-layout">
                  <div className="generator-sidebar glass-panel">
                    <h3>إعدادات التوليد</h3>
                    <div className="pro-form">
                      <div className="input-group">
                        <label>قيمة الكود (ج.م)</label>
                        <input type="number" value={codeGenerator.amount} onChange={e=>setCodeGenerator({...codeGenerator, amount: e.target.value})} />
                      </div>
                      <div className="input-group">
                        <label>عدد الأكواد</label>
                        <input type="number" value={codeGenerator.count} onChange={e=>setCodeGenerator({...codeGenerator, count: e.target.value})} />
                      </div>
                      <div className="input-group">
                        <label>بادئة الكود (Prefix)</label>
                        <input value={codeGenerator.prefix} onChange={e=>setCodeGenerator({...codeGenerator, prefix: e.target.value})} />
                      </div>
                      <div className="input-group">
                        <label>نوع التفعيل</label>
                        <select value={codeGenerator.type} onChange={e=>setCodeGenerator({...codeGenerator, type: e.target.value})}>
                          <option value="wallet">شحن رصيد محفظة</option>
                          <option value="course">تفعيل كورس مباشر</option>
                        </select>
                      </div>
                      <button className="generate-btn" onClick={generateBulkCodes} disabled={isLoading}>
                         <Zap size={18}/> توليد وتحميل ملف Excel
                      </button>
                    </div>
                  </div>

                  <div className="codes-preview-panel glass-panel">
                    <div className="panel-header">
                      <h3><Clock size={18}/> آخر الأكواد التي تم توليدها</h3>
                      <button className="clear-btn">مسح السجل</button>
                    </div>
                    <div className="mini-table-wrapper">
                      <table className="mini-table">
                        <thead>
                          <tr><th>الكود</th><th>القيمة</th><th>النوع</th><th>الحالة</th></tr>
                        </thead>
                        <tbody>
                          {activationCodes.slice(0, 15).map(c => (
                            <tr key={c.id}>
                              <td><code>{c.code}</code></td>
                              <td>{c.value} ج.م</td>
                              <td>{c.type === 'wallet' ? 'محفظة' : 'كورس'}</td>
                              <td>{c.isUsed ? <span className="u-used">مستخدم</span> : <span className="u-free">نشط</span>}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </motion.section>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* --- شاشة التحميل العامة --- */}
      {isLoading && (
        <div className="global-loader">
          <div className="loader-content">
            <div className="spinner-ring"></div>
            <p>جاري مزامنة البيانات مع السحابة...</p>
            {uploadProgress > 0 && <div className="progress-bar" style={{width: `${uploadProgress}%`}}></div>}
          </div>
        </div>
      )}

      {/* --- تذييل الصفحة (Status Bar) --- */}
      <footer className="admin-status-bar">
        <div className="status-item">
          <div className="online-indicator"></div>
          <span>متصل بالسيرفر الرئيسي</span>
        </div>
        <div className="status-item">
          <Database size={14}/>
          <span>Firestore Engine V4.2</span>
        </div>
        <div className="status-item">
          <Clock size={14}/>
          <span>آخر تحديث: {new Date().toLocaleTimeString()}</span>
        </div>
        <div className="status-item build-tag">
          TITO-OS CORE BUILD 1002.4.0
        </div>
      </footer>

    </div>
  );
};


export default AdminSystem;

