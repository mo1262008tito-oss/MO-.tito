import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { db, auth, storage } from '../firebase'; 
import { 
  collection, query, updateDoc, doc, addDoc, onSnapshot, 
  serverTimestamp, where, deleteDoc, orderBy, arrayUnion, 
  increment, writeBatch, limit, getDocs, getDoc, setDoc, 
  runTransaction, arrayRemove
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion'; 
import { 
  Users, Plus, Check, X, Bell, Unlock, Eye, BookOpen,
  DollarSign, LayoutDashboard, Trash2, Hash, Video, Layers, 
  Zap, ShieldBan, Send, Search, Activity, Smartphone, Heart, 
  TrendingUp, Download, ShieldCheck, Settings, Star, Clock,
  FileText, ShieldAlert, BarChart3, UserCheck, Percent, Gift,
  LogOut, ClipboardList, MonitorSmartphone, HelpCircle, Save, 
  ImageIcon, FileUp, Filter, ChevronRight, Share2, 
  Database, HardDrive, RefreshCcw, Mail, Globe, Lock,
  Award, Target, Calendar, PieChart, MessageSquare, 
  ChevronDown, Edit3, Trash, UserPlus, Play, Info, ShoppingBag,
  CheckCircle2, AlertCircle, ListPlus, Timer, ChevronLeft,
  Briefcase, GraduationCap, Trophy, BarChart, Paperclip, MousePointer2
} from 'lucide-react';

import './AdminDash.css';

/**
 * TITO ACADEMY - ENTERPRISE ERP v6.0
 * الجزء الأول: إدارة الحالات والمزامنة ودوال العمليات الكبرى
 */

const AdminDash = () => {
  // ============================================================
  // [1] حالات النظام (SYSTEM STATES)
  // ============================================================
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('الكل');
  const [statusNotification, setStatusNotification] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // مستودعات البيانات
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [exams, setExams] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activationCodes, setActivationCodes] = useState([]);
  const [systemStats, setSystemStats] = useState({
    totalRevenue: 0, totalCosts: 0, totalSales: 0, 
    studentCount: 0, activeExams: 0, dailyActive: 0
  });

  // النماذج (Forms)
  const [courseForm, setCourseForm] = useState({
    id: null, title: '', description: '', instructor: 'أ. محمود فرج',
    price: '', productionCost: '', discountPrice: '', grade: '1 ثانوي',
    thumbnail: '', isPublished: true, videoPlaylistId: '', requirements: '', objectives: ''
  });

  const [examForm, setExamForm] = useState({
    id: null, title: '', description: '', courseId: '', timeLimit: 60,
    minPassingScore: 50, showResultsImmediately: true, shuffleQuestions: false,
    questions: [{ id: Date.now(), text: '', options: ['', '', '', ''], correctIndex: 0, points: 5, explanation: '' }]
  });

  const [financeForm, setFinanceForm] = useState({
    codeCount: 50, codeValue: 100, prefix: 'TITO', batchName: '', expiryDate: ''
  });

  // ============================================================
  // [2] دوال المزامنة الحقيقية (REAL-TIME DATA ENGINE)
  // ============================================================
  useEffect(() => {
    const unsubcribers = [];
    
    const initializeSync = async () => {
      try {
        // الطلاب
        const qUsers = query(collection(db, "users"), orderBy("createdAt", "desc"));
        unsubcribers.push(onSnapshot(qUsers, (snap) => {
          setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }));

        // الكورسات
        const qCourses = query(collection(db, "courses_metadata"), orderBy("createdAt", "desc"));
        unsubcribers.push(onSnapshot(qCourses, (snap) => {
          setCourses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }));

        // الإحصائيات المالية
        unsubcribers.push(onSnapshot(doc(db, "system_info", "dashboard"), (snap) => {
          if (snap.exists()) setSystemStats(snap.data());
        }));

        // سجل العمليات الأمني
        const qLogs = query(collection(db, "audit_logs"), orderBy("timestamp", "desc"), limit(100));
        unsubcribers.push(onSnapshot(qLogs, (snap) => {
          setAuditLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }));

        // طلبات الدفع المعلقة
        const qPayments = query(collection(db, "payment_requests"), orderBy("createdAt", "desc"));
        unsubcribers.push(onSnapshot(qPayments, (snap) => {
          setPaymentRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }));

        setIsLoading(false);
      } catch (error) {
        console.error("Sync Error:", error);
      }
    };

    initializeSync();
    return () => unsubcribers.forEach(unsub => unsub());
  }, []);

  // ============================================================
  // [3] ميزات الأمان المتقدمة (ADVANCED SECURITY LOGIC)
  // ============================================================
  
  const createAuditLog = async (action, details, severity = 'low') => {
    await addDoc(collection(db, "audit_logs"), {
      admin: auth.currentUser?.email || 'Master_Admin',
      action, details, severity,
      timestamp: serverTimestamp(),
      platform: 'Admin_Panel_v6'
    });
  };

  const handleToggleBan = async (user) => {
    const newStatus = !user.isBanned;
    try {
      await updateDoc(doc(db, "users", user.id), { isBanned: newStatus });
      await createAuditLog(newStatus ? "حظر مستخدم" : "فك حظر", `المستخدم: ${user.name} | ${user.phone}`, newStatus ? 'high' : 'medium');
      triggerToast(newStatus ? "تم حظر الحساب بنجاح" : "تم فك الحظر", "success");
    } catch (e) { triggerToast("فشلت العملية الأمنيّة", "error"); }
  };

  const handleResetDevice = async (userId, userName) => {
    if (!window.confirm(`تصفير أجهزة ${userName}؟ سيتمكن من الدخول من هاتف جديد فقط.`)) return;
    try {
      await updateDoc(doc(db, "users", userId), { 
        deviceId: null, 
        deviceHistory: [], 
        lastLogin: serverTimestamp() 
      });
      await createAuditLog("تصفير بصمة", `إعادة ضبط أجهزة الطالب: ${userName}`, 'medium');
      triggerToast("تم تصفير بصمة الجهاز بنجاح", "success");
    } catch (e) { triggerToast("خطأ في الاتصال بقاعدة البيانات", "error"); }
  };

  // ============================================================
  // [4] نظام الشهادات والنجاح (CERTIFICATE ENGINE)
  // ============================================================
  const issueCertificate = async (student, courseTitle) => {
    try {
      const certRef = collection(db, "certificates");
      const certId = `TITO-CERT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      await addDoc(certRef, {
        studentId: student.id,
        studentName: student.name,
        courseTitle: courseTitle,
        certSerial: certId,
        issuedAt: serverTimestamp(),
        grade: "امتياز",
        verified: true
      });
      
      await createAuditLog("إصدار شهادة", `شهادة نجاح لـ ${student.name} في ${courseTitle}`, 'low');
      triggerToast("تم توليد شهادة النجاح وإرسالها للطالب", "success");
    } catch (e) { triggerToast("خطأ في توليد الشهادة", "error"); }
  };

  // ============================================================
  // [5] إدارة المحتوى المطور (COURSE & FINANCE LOGIC)
  // ============================================================
  const triggerToast = (message, type = 'info') => {
    setStatusNotification({ message, type });
    setTimeout(() => setStatusNotification(null), 4000);
  };

  const calculateNetProfit = useMemo(() => {
    const revenue = systemStats.totalRevenue || 0;
    const costs = systemStats.totalCosts || 0;
    return revenue - costs;
  }, [systemStats]);

  // يتبع في الجزء الثاني...

  // ============================================================
  // [6] إدارة الكورسات والمحتوى (CONTENT MANAGEMENT)
  // ============================================================
  const handleSaveCourse = async (e) => {
    e.preventDefault();
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const coursePayload = {
        ...courseForm,
        price: Number(courseForm.price),
        productionCost: Number(courseForm.productionCost || 0),
        discountPrice: Number(courseForm.discountPrice || 0),
        lastModified: serverTimestamp()
      };

      if (courseForm.id) {
        // تحديث كورس موجود
        await updateDoc(doc(db, "courses_metadata", courseForm.id), coursePayload);
        await createAuditLog("تعديل كورس", `تعديل بيانات: ${courseForm.title}`, 'medium');
        triggerToast("تم تحديث بيانات الكورس بنجاح", "success");
      } else {
        // إضافة كورس جديد
        const docRef = await addDoc(collection(db, "courses_metadata"), {
          ...coursePayload,
          createdAt: serverTimestamp(),
          enrolledStudents: 0,
          ratings: [],
          totalRating: 0
        });
        
        // تحديث إجمالي التكاليف في الإحصائيات
        await updateDoc(doc(db, "system_info", "dashboard"), {
          totalCosts: increment(Number(courseForm.productionCost || 0))
        });

        await createAuditLog("إضافة كورس", `نشر كورس جديد: ${courseForm.title}`, 'high');
        triggerToast("تم نشر الكورس الجديد بنجاح", "success");
      }
      
      // إعادة ضبط النموذج
      setCourseForm({ 
        id: null, title: '', description: '', instructor: 'أ. محمود فرج', 
        price: '', productionCost: '', grade: '1 ثانوي', isPublished: true 
      });
    } catch (err) {
      triggerToast("خطأ في الحفظ: " + err.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteCourse = async (id, title) => {
    if (!window.confirm(`تحذير: هل أنت متأكد من حذف كورس "${title}"؟ سيؤدي ذلك لحذفه من عند جميع الطلاب!`)) return;
    try {
      await deleteDoc(doc(db, "courses_metadata", id));
      await createAuditLog("حذف محتوى", `حذف كورس: ${title}`, 'danger');
      triggerToast("تم حذف الكورس نهائياً", "success");
    } catch (err) {
      triggerToast("فشل الحذف", "error");
    }
  };

  // ============================================================
  // [7] إدارة المبيعات والعمليات المالية (FINANCIAL OPS)
  // ============================================================
  const handleProcessPayment = async (request, action) => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    try {
      await runTransaction(db, async (transaction) => {
        const reqRef = doc(db, "payment_requests", request.id);
        const userRef = doc(db, "users", request.userId);
        const statsRef = doc(db, "system_info", "dashboard");

        if (action === 'approve') {
          // 1. تحديث حالة الطلب
          transaction.update(reqRef, { 
            status: 'approved', 
            approvedAt: serverTimestamp(),
            processor: auth.currentUser?.email 
          });
          
          // 2. إضافة الكورس للطالب وتحديث إنفاقه
          transaction.update(userRef, { 
            enrolledContent: arrayUnion(request.courseId),
            totalSpent: increment(Number(request.amount)),
            notifications: arrayUnion({
              id: Date.now(),
              title: "تم تفعيل الكورس",
              body: `تمت الموافقة على اشتراكك في: ${request.courseName}`,
              time: new Date().toISOString()
            })
          });

          // 3. تحديث إحصائيات المنصة (الإيرادات والمبيعات)
          transaction.update(statsRef, { 
            totalRevenue: increment(Number(request.amount)),
            totalSales: increment(1)
          });

          await createAuditLog("قبول دفع", `تم قبول مبلغ ${request.amount} من ${request.userName}`, 'high');
        } else {
          // رفض الطلب
          transaction.update(reqRef, { status: 'rejected', rejectedAt: serverTimestamp() });
          await createAuditLog("رفض دفع", `تم رفض طلب دفع من ${request.userName}`, 'medium');
        }
      });
      triggerToast(action === 'approve' ? "تم التفعيل بنجاح" : "تم رفض الطلب", "info");
    } catch (e) {
      console.error(e);
      triggerToast("فشلت المعاملة المالية: " + e.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // ============================================================
  // [8] توليد أكواد التفعيل (VOUCHER GENERATOR)
  // ============================================================
  const handleGenerateActivationCodes = async () => {
    if (!financeForm.batchName) return triggerToast("يرجى تسمية الدفعة", "warning");
    
    setIsProcessing(true);
    const batch = writeBatch(db);
    const codesData = [];
    
    try {
      for (let i = 0; i < financeForm.codeCount; i++) {
        const uniqueCode = `${financeForm.prefix}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        const codeRef = doc(collection(db, "activationCodes"));
        
        const payload = {
          code: uniqueCode,
          value: Number(financeForm.codeValue),
          isUsed: false,
          usedBy: null,
          createdAt: serverTimestamp(),
          batch: financeForm.batchName,
          expiryDate: financeForm.expiryDate || null
        };
        
        batch.set(codeRef, payload);
        codesData.push({ 
          "الكود": uniqueCode, 
          "القيمة": financeForm.codeValue, 
          "الدفعة": financeForm.batchName,
          "تاريخ الإنشاء": new Date().toLocaleDateString('ar-EG') 
        });
      }

      await batch.commit();
      
      // تصدير لملف Excel فورياً
      const ws = XLSX.utils.json_to_sheet(codesData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Activation_Codes");
      XLSX.writeFile(wb, `Tito_Codes_${financeForm.batchName}.xlsx`);

      triggerToast(`تم توليد ${financeForm.codeCount} كود بنجاح`, "success");
      await createAuditLog("توليد أكواد", `إنشاء دفعة أكواد: ${financeForm.batchName}`, 'high');
    } catch (e) {
      triggerToast("خطأ في التوليد: " + e.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // ============================================================
  // [9] هيكل الواجهة الرسومية الرئيسي (UI LAYOUT)
  // ============================================================
  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      (u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.phone?.includes(searchQuery)) &&
      (gradeFilter === 'الكل' || u.grade === gradeFilter)
    );
  }, [users, searchQuery, gradeFilter]);

  if (isLoading) return (
    <div className="tito-loader-screen">
      <RefreshCcw className="spin-icon" size={48} />
      <p>جاري تحميل بيانات الأكاديمية...</p>
    </div>
  );

  return (
    <div className={`admin-full-wrapper ${isSidebarCollapsed ? 'sidebar-minified' : ''}`}>
      
      {/* Sidebar Navigation */}
      <aside className="tito-sidebar">
        <div className="sidebar-logo-container">
          <div className="logo-icon">T</div>
          {!isSidebarCollapsed && <h2>تيتو <span>أكاديمي</span></h2>}
        </div>

        <nav className="sidebar-links">
          <ul>
            <li className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>
              <LayoutDashboard size={22} /> {!isSidebarCollapsed && <span>لوحة الإحصائيات</span>}
            </li>
            
            <div className="sidebar-sep">{!isSidebarCollapsed && 'المنهج الدراسي'}</div>
            
            <li className={activeTab === 'courses' ? 'active' : ''} onClick={() => setActiveTab('courses')}>
              <Video size={22} /> {!isSidebarCollapsed && <span>الكورسات والمحتوى</span>}
            </li>
            
            <li className={activeTab === 'exams' ? 'active' : ''} onClick={() => setActiveTab('exams')}>
              <ClipboardList size={22} /> {!isSidebarCollapsed && <span>بنك الامتحانات</span>}
            </li>

            <div className="sidebar-sep">{!isSidebarCollapsed && 'الطلاب والمالية'}</div>
            
            <li className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>
              <Users size={22} /> {!isSidebarCollapsed && <span>قاعدة الطلاب</span>}
            </li>

            <li className={activeTab === 'payments' ? 'active' : ''} onClick={() => setActiveTab('payments')}>
              <DollarSign size={22} /> {!isSidebarCollapsed && <span>المبيعات والطلبات</span>}
              {paymentRequests.length > 0 && <span className="pulse-badge">{paymentRequests.length}</span>}
            </li>

            <li className={activeTab === 'codes' ? 'active' : ''} onClick={() => setActiveTab('codes')}>
              <Hash size={22} /> {!isSidebarCollapsed && <span>أكواد الشحن</span>}
            </li>

            <div className="sidebar-sep">{!isSidebarCollapsed && 'النظام'}</div>
            
            <li className={activeTab === 'logs' ? 'active' : ''} onClick={() => setActiveTab('logs')}>
              <Activity size={22} /> {!isSidebarCollapsed && <span>سجل العمليات</span>}
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-action" onClick={() => auth.signOut()}>
            <LogOut size={20}/> {!isSidebarCollapsed && 'تسجيل الخروج'}
          </button>
        </div>
      </aside>
{/* Main Viewport Content */}
      <main className="tito-main-viewport">
        {/* Top Header Bar */}
        <header className="viewport-top-bar">
          <div className="header-left">
            <button className="collapse-toggle" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
              <Layers size={20} />
            </button>
            <div className="breadcrumb">
              <span>تيتو أكاديمي</span>
              <ChevronLeft size={16} />
              <span className="current-path">{activeTab}</span>
            </div>
          </div>

          <div className="header-right">
            <div className="search-wrapper">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="ابحث عن طالب، كود، أو معاملة..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="notification-bell">
              <Bell size={22} />
              <span className="bell-dot"></span>
            </div>
            <div className="admin-profile">
              <div className="admin-info">
                <p className="admin-name">أ. محمود فرج</p>
                <p className="admin-role">المدير العام</p>
              </div>
              <img src="https://ui-avatars.com/api/?name=Mahmoud+Farag&background=0D8ABC&color=fff" alt="Admin" />
            </div>
          </div>
        </header>

        <div className="viewport-scroller">
          <AnimatePresence mode="wait">
            
            {/* 1. DASHBOARD TAB */}
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dash" 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="tab-content"
              >
                <div className="welcome-banner">
                  <div className="banner-text">
                    <h1>مرحباً بك، دكتور محمود 👋</h1>
                    <p>إليك ملخص أداء المنصة اليوم {new Date().toLocaleDateString('ar-EG')}</p>
                  </div>
                  <div className="banner-actions">
                    <button className="primary-btn"><Plus size={18}/> تقرير سريع</button>
                  </div>
                </div>

                <div className="stats-grid">
                  <div className="stat-card revenue">
                    <div className="stat-icon"><TrendingUp size={24}/></div>
                    <div className="stat-details">
                      <span>إجمالي الإيرادات</span>
                      <h3>{systemStats.totalRevenue?.toLocaleString()} ج.م</h3>
                      <p className="trend positive">+12% عن الشهر الماضي</p>
                    </div>
                  </div>
                  <div className="stat-card profit">
                    <div className="stat-icon"><DollarSign size={24}/></div>
                    <div className="stat-details">
                      <span>صافي الربح (بعد التكاليف)</span>
                      <h3>{calculateNetProfit.toLocaleString()} ج.م</h3>
                      <p className="trend positive">تغطية تكاليف بنسبة 100%</p>
                    </div>
                  </div>
                  <div className="stat-card users">
                    <div className="stat-icon"><Users size={24}/></div>
                    <div className="stat-details">
                      <span>الطلاب المسجلين</span>
                      <h3>{users.length} طالب</h3>
                      <p className="trend">نشط الآن: {systemStats.dailyActive || 0}</p>
                    </div>
                  </div>
                  <div className="stat-card sales">
                    <div className="stat-icon"><ShoppingBag size={24}/></div>
                    <div className="stat-details">
                      <span>إجمالي المبيعات</span>
                      <h3>{systemStats.totalSales} عملية</h3>
                      <p className="trend positive">معدل تحويل عالي</p>
                    </div>
                  </div>
                </div>

                <div className="visual-data-row">
                  <div className="glass-panel main-chart">
                    <div className="panel-header">
                      <h3><BarChart3 size={18}/> منحنى النمو المالي</h3>
                      <select><option>آخر 7 أيام</option><option>آخر شهر</option></select>
                    </div>
                    <div className="chart-placeholder">
                      {/* هنا يتم ربط مكتبة Recharts أو Chart.js لاحقاً */}
                      
                    </div>
                  </div>
                  <div className="glass-panel quick-logs">
                    <h3><Activity size={18}/> آخر حركات النظام</h3>
                    <div className="log-list">
                      {auditLogs.slice(0, 6).map(log => (
                        <div key={log.id} className={`log-item ${log.severity}`}>
                          <div className="log-bullet"></div>
                          <div className="log-info">
                            <p><strong>{log.action}:</strong> {log.details}</p>
                            <span>{log.timestamp?.toDate().toLocaleTimeString('ar-EG')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 2. EXAMS TAB (MCQ BUILDER) */}
            {activeTab === 'exams' && (
              <motion.div key="exams" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="tab-content">
                <div className="section-header">
                  <h2>بنك الاختبارات الذكي</h2>
                  <button className="primary-btn" onClick={() => setExamForm({
                    id: null, title: '', courseId: '', timeLimit: 60, minPassingScore: 50,
                    questions: [{ id: Date.now(), text: '', options: ['', '', '', ''], correctIndex: 0, points: 5 }]
                  })}>
                    <Plus size={18}/> إنشاء اختبار جديد
                  </button>
                </div>

                <div className="exam-builder-layout">
                  <div className="glass-panel exam-form-container">
                    <h3>{examForm.id ? 'تعديل اختبار' : 'إعداد اختبار جديد'}</h3>
                    <div className="tito-form-grid">
                      <div className="form-group full">
                        <label>عنوان الامتحان</label>
                        <input 
                          value={examForm.title} 
                          onChange={e => setExamForm({...examForm, title: e.target.value})} 
                          placeholder="مثال: اختبار شامل على الباب الأول"
                        />
                      </div>
                      <div className="form-group">
                        <label>الكورس المرتبط</label>
                        <select value={examForm.courseId} onChange={e => setExamForm({...examForm, courseId: e.target.value})}>
                          <option value="">اختر الكورس...</option>
                          {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>الوقت (بالدقائق)</label>
                        <input type="number" value={examForm.timeLimit} onChange={e => setExamForm({...examForm, timeLimit: e.target.value})}/>
                      </div>
                    </div>

                    <div className="questions-manager">
                      <h4>الأسئلة ({examForm.questions.length})</h4>
                      {examForm.questions.map((q, qIndex) => (
                        <div key={q.id} className="question-block">
                          <div className="q-header">
                            <span>سؤال {qIndex + 1}</span>
                            <button className="del-q" onClick={() => {
                              const newQ = examForm.questions.filter((_, i) => i !== qIndex);
                              setExamForm({...examForm, questions: newQ});
                            }}><Trash2 size={14}/></button>
                          </div>
                          <textarea 
                            placeholder="اكتب نص السؤال هنا..." 
                            value={q.text} 
                            onChange={e => {
                              const newQ = [...examForm.questions];
                              newQ[qIndex].text = e.target.value;
                              setExamForm({...examForm, questions: newQ});
                            }}
                          />
                          <div className="options-grid">
                            {q.options.map((opt, oIndex) => (
                              <div key={oIndex} className={`opt-input ${q.correctIndex === oIndex ? 'correct' : ''}`}>
                                <input 
                                  type="radio" 
                                  name={`q-${q.id}`} 
                                  checked={q.correctIndex === oIndex}
                                  onChange={() => {
                                    const newQ = [...examForm.questions];
                                    newQ[qIndex].correctIndex = oIndex;
                                    setExamForm({...examForm, questions: newQ});
                                  }}
                                />
                                <input 
                                  placeholder={`خيار ${oIndex + 1}`} 
                                  value={opt}
                                  onChange={e => {
                                    const newQ = [...examForm.questions];
                                    newQ[qIndex].options[oIndex] = e.target.value;
                                    setExamForm({...examForm, questions: newQ});
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      <button className="add-q-btn" onClick={() => setExamForm({
                        ...examForm, 
                        questions: [...examForm.questions, { id: Date.now(), text: '', options: ['', '', '', ''], correctIndex: 0, points: 5 }]
                      })}>+ إضافة سؤال آخر</button>
                    </div>
                    
                    <div className="form-actions">
                      <button className="save-btn" onClick={async () => {
                         setIsProcessing(true);
                         try {
                           if(examForm.id) await updateDoc(doc(db, "exams", examForm.id), examForm);
                           else await addDoc(collection(db, "exams"), {...examForm, createdAt: serverTimestamp()});
                           triggerToast("تم حفظ الامتحان بنجاح", "success");
                         } catch(e) { triggerToast("خطأ في الحفظ", "error"); }
                         finally { setIsProcessing(false); }
                      }}><Save size={18}/> حفظ الامتحان كمسودة</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 3. USERS MANAGEMENT TAB */}
            {activeTab === 'users' && (
              <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="tab-content">
                <div className="users-controls">
                   <div className="filter-group">
                      <div className={`filter-pill ${gradeFilter === 'الكل' ? 'active' : ''}`} onClick={() => setGradeFilter('الكل')}>الكل</div>
                      <div className={`filter-pill ${gradeFilter === '1 ثانوي' ? 'active' : ''}`} onClick={() => setGradeFilter('1 ثانوي')}>1 ثانوي</div>
                      <div className={`filter-pill ${gradeFilter === '2 ثانوي' ? 'active' : ''}`} onClick={() => setGradeFilter('2 ثانوي')}>2 ثانوي</div>
                      <div className={`filter-pill ${gradeFilter === '3 ثانوي' ? 'active' : ''}`} onClick={() => setGradeFilter('3 ثانوي')}>3 ثانوي</div>
                   </div>
                   <button className="export-btn" onClick={() => {
                      const ws = XLSX.utils.json_to_sheet(users);
                      const wb = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(wb, ws, "Students");
                      XLSX.writeFile(wb, "Tito_Academy_Students.xlsx");
                   }}><Download size={18}/> تصدير البيانات Excel</button>
                </div>

                <div className="glass-panel table-container">
                  <table className="tito-main-table">
                    <thead>
                      <tr>
                        <th>الطالب</th>
                        <th>بيانات الاتصال</th>
                        <th>المرحلة</th>
                        <th>تاريخ التسجيل</th>
                        <th>الأمان</th>
                        <th>الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(user => (
                        <tr key={user.id} className={user.isBanned ? 'row-banned' : ''}>
                          <td>
                            <div className="user-cell">
                               <img src={`https://ui-avatars.com/api/?name=${user.name}&background=random`} alt=""/>
                               <div>
                                 <p className="u-name">{user.name} {user.isBanned && <ShieldAlert size={14} color="red"/>}</p>
                                 <p className="u-id">ID: {user.id.substring(0,8)}</p>
                               </div>
                            </div>
                          </td>
                          <td>
                            <div className="contact-cell">
                               <p><Smartphone size={12}/> {user.phone}</p>
                               <p><Mail size={12}/> {user.email || 'لا يوجد بريد'}</p>
                            </div>
                          </td>
                          <td><span className="grade-badge">{user.grade}</span></td>
                          <td>{user.createdAt?.toDate().toLocaleDateString('ar-EG')}</td>
                          <td>
                             <div className="security-stats">
                                <span title="الأجهزة المرتبطة"><MonitorSmartphone size={16}/> {user.deviceId ? 1 : 0}/1</span>
                             </div>
                          </td>
                          <td className="actions-cell">
                            <div className="action-btns">
                              <button title="تصفير الجهاز" onClick={() => handleResetDevice(user.id, user.name)}><RefreshCcw size={16}/></button>
                              <button title="إصدار شهادة" onClick={() => issueCertificate(user, "الكيمياء العامة")}><Award size={16} color="#f59e0b"/></button>
                              <button title={user.isBanned ? "فك الحظر" : "حظر الطالب"} className="ban-toggle" onClick={() => handleToggleBan(user)}>
                                {user.isBanned ? <Unlock size={16} color="green"/> : <ShieldBan size={16} color="red"/>}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}


            {/* 7. PERFORMANCE & INSIGHTS TAB (الميزة الإضافية) */}
            {activeTab === 'insights' && (
              <motion.div key="insights" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="tab-content">
                <div className="insights-grid">
                  
                  {/* قسم الطلاب المتعثرين - نظام الإنذار المبكر */}
                  <div className="glass-panel risk-analysis">
                    <div className="panel-header">
                      <h3><ShieldAlert size={20} color="#ef4444"/> طلاب في دائرة الخطر</h3>
                      <span className="badge-count">تنبيه ذكي</span>
                    </div>
                    <p className="panel-sub">طلاب رسبوا في أكثر من 50% من الاختبارات الأخيرة</p>
                    <div className="risk-list">
                      {users.filter(u => (u.failCount || 0) > 2).map(student => (
                        <div key={student.id} className="risk-student-card">
                          <div className="risk-info">
                            <strong>{student.name}</strong>
                            <span>آخر درجة: {student.lastScore}%</span>
                          </div>
                          <button className="contact-student-btn" onClick={() => window.open(`https://wa.me/${student.phone}`)}>
                            <MessageSquare size={16}/> تواصل للمتابعة
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* قسم تحليل محتوى الفيديوهات - Heatmap */}
                  <div className="glass-panel video-insights">
                    <div className="panel-header">
                      <h3><Play size={20} color="#8b5cf6"/> تحليل مشاهدات الدروس</h3>
                    </div>
                    <div className="video-stats-container">
                      {courses.slice(0, 3).map(course => (
                        <div key={course.id} className="course-watch-stat">
                          <div className="watch-label">
                            <span>{course.title}</span>
                            <span>{course.avgWatchTime || 0}% إكمال</span>
                          </div>
                          <div className="progress-bar-bg">
                            <div className="progress-bar-fill" style={{width: `${course.avgWatchTime || 0}%`}}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* نظام الدعم الفني الداخلي */}
                  <div className="glass-panel support-center full-width">
                    <div className="panel-header">
                      <h3><HelpCircle size={20} color="#10b981"/> مركز استفسارات الطلاب</h3>
                    </div>
                    <div className="support-tickets">
                      <table className="tito-table">
                        <thead>
                          <tr>
                            <th>الطالب</th>
                            <th>الموضوع</th>
                            <th>الحالة</th>
                            <th>التوقيت</th>
                            <th>الإجراء</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* بيانات تجريبية لمحاكاة النظام */}
                          <tr>
                            <td>أحمد محمد</td>
                            <td>مشكلة في فتح فيديو "الكيمياء العضوية"</td>
                            <td><span className="status-pending">جاري المعالجة</span></td>
                            <td>منذ 5 دقائق</td>
                            <td><button className="reply-btn">رد الآن</button></td>
                          </tr>
                          <tr>
                            <td>سارة محمود</td>
                            <td>طلب استعادة كلمة المرور</td>
                            <td><span className="status-closed">تم الرد</span></td>
                            <td>منذ ساعتين</td>
                            <td><button className="view-btn">عرض المحادثة</button></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* قسم التقارير الشهرية التلقائية */}
                  <div className="glass-panel auto-reports">
                    <h3><FileText size={20}/> التقارير الذكية</h3>
                    <div className="report-actions">
                      <button className="report-btn-secondary" onClick={() => triggerToast("جاري إعداد تقرير مبيعات الشهر...", "info")}>
                        <Download size={16}/> تقرير المبيعات الشهري (PDF)
                      </button>
                      <button className="report-btn-secondary" onClick={() => triggerToast("جاري استخراج بيانات الغياب...", "info")}>
                        <Briefcase size={16}/> تقرير الالتزام والحضور (Excel)
                      </button>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}


            {/* 4. PAYMENTS & SALES TAB */}
            {activeTab === 'payments' && (
              <motion.div key="payments" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="tab-content">
                <div className="section-header">
                  <h2>طلبات الشراء المعلقة ({paymentRequests.length})</h2>
                  <div className="revenue-mini-stat">
                    <span>إجمالي تحصيل اليوم:</span>
                    <strong>{systemStats.dailyRevenue || 0} ج.م</strong>
                  </div>
                </div>

                <div className="requests-grid">
                  {paymentRequests.length === 0 ? (
                    <div className="empty-state">
                      <CheckCircle2 size={48} color="#10b981" />
                      <p>لا توجد طلبات معلقة حالياً. جميع الحسابات محدثة!</p>
                    </div>
                  ) : (
                    paymentRequests.map(req => (
                      <div key={req.id} className="payment-card">
                        <div className="card-priority-bar"></div>
                        <div className="payment-info">
                          <div className="user-brief">
                            <img src={`https://ui-avatars.com/api/?name=${req.userName}`} alt=""/>
                            <div>
                              <h4>{req.userName}</h4>
                              <span>{req.userPhone}</span>
                            </div>
                          </div>
                          <div className="course-brief">
                            <p>الكورس المطلوب:</p>
                            <strong>{req.courseName}</strong>
                            <span className="price-tag">{req.amount} ج.م</span>
                          </div>
                          {req.receiptImg && (
                            <a href={req.receiptImg} target="_blank" rel="noreferrer" className="receipt-link">
                              <ImageIcon size={14}/> عرض صورة التحويل
                            </a>
                          )}
                        </div>
                        <div className="payment-actions">
                          <button 
                            className="approve-btn" 
                            disabled={isProcessing}
                            onClick={() => handleProcessPayment(req, 'approve')}
                          >
                            {isProcessing ? '...' : <><Check size={18}/> قبول وتفعيل</>}
                          </button>
                          <button 
                            className="reject-btn"
                            disabled={isProcessing}
                            onClick={() => handleProcessPayment(req, 'reject')}
                          >
                            <X size={18}/> رفض
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* 5. ACTIVATION CODES TAB */}
            {activeTab === 'codes' && (
              <motion.div key="codes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="tab-content">
                <div className="codes-layout">
                  <div className="glass-panel code-gen-form">
                    <h3>توليد أكواد شحن جديدة</h3>
                    <div className="tito-form-grid">
                      <div className="form-group">
                        <label>اسم الدفعة (للتنظيم)</label>
                        <input 
                          placeholder="مثال: أكواد مكتبة الطالب" 
                          value={financeForm.batchName}
                          onChange={e => setFinanceForm({...financeForm, batchName: e.target.value})}
                        />
                      </div>
                      <div className="form-group">
                        <label>عدد الأكواد</label>
                        <input 
                          type="number" 
                          value={financeForm.codeCount}
                          onChange={e => setFinanceForm({...financeForm, codeCount: e.target.value})}
                        />
                      </div>
                      <div className="form-group">
                        <label>قيمة الكود (ج.م)</label>
                        <input 
                          type="number" 
                          value={financeForm.codeValue}
                          onChange={e => setFinanceForm({...financeForm, codeValue: e.target.value})}
                        />
                      </div>
                      <div className="form-group">
                        <label>بادئة الكود (Prefix)</label>
                        <input 
                          value={financeForm.prefix}
                          onChange={e => setFinanceForm({...financeForm, prefix: e.target.value.toUpperCase()})}
                        />
                      </div>
                    </div>
                    <button 
                      className="generate-btn" 
                      onClick={handleGenerateActivationCodes}
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'جاري التوليد...' : <><Zap size={18}/> توليد وتصدير Excel</>}
                    </button>
                  </div>

                  <div className="glass-panel codes-history">
                    <h3>آخر الأكواد المستعملة</h3>
                    <div className="recent-codes-list">
                       {/* يتم جلبها من مجموعة activationCodes حيث isUsed == true */}
                       <p className="hint-text">يتم تحديث القائمة تلقائياً عند شحن الطلاب للأكواد.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 6. AUDIT LOGS TAB */}
            {activeTab === 'logs' && (
              <motion.div key="logs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="tab-content">
                <div className="glass-panel logs-board">
                  <div className="panel-header">
                    <h3>سجل الرقابة الكامل (Audit Trail)</h3>
                    <button className="clear-btn" onClick={() => triggerToast("لا يمكن حذف السجل الأمني", "warning")}>
                      <ShieldAlert size={16}/> حماية السجلات مفعلة
                    </button>
                  </div>
                  <div className="logs-table-wrapper">
                    <table className="logs-table">
                      <thead>
                        <tr>
                          <th>التوقيت</th>
                          <th>المسؤول</th>
                          <th>العملية</th>
                          <th>التفاصيل</th>
                          <th>المستوى</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.map(log => (
                          <tr key={log.id}>
                            <td>{log.timestamp?.toDate().toLocaleString('ar-EG')}</td>
                            <td><span className="admin-badge">{log.admin}</span></td>
                            <td><strong>{log.action}</strong></td>
                            <td>{log.details}</td>
                            <td>
                              <span className={`severity-tag ${log.severity}`}>
                                {log.severity === 'high' ? 'خطير' : 'عادي'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* GLOBAL OVERLAYS */}
      {statusNotification && (
        <motion.div 
          initial={{ x: 100, opacity: 0 }} 
          animate={{ x: 0, opacity: 1 }} 
          className={`tito-toast-notification ${statusNotification.type}`}
        >
          {statusNotification.type === 'success' ? <CheckCircle2 size={20}/> : <AlertCircle size={20}/>}
          <span>{statusNotification.message}</span>
        </motion.div>
      )}

      {isProcessing && (
        <div className="global-processing-overlay">
          <div className="loader-content">
            <div className="spinner"></div>
            <p>جاري معالجة البيانات وتحديث السحابة...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDash;
