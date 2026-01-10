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
 * TITO ACADEMY - FULL ADMINISTRATIVE ERP SYSTEM v5.0
 * File: AdminDash.jsx
 * Comprehensive Logic: Students, Courses, Exams, Finance, Logs, & Security.
 */

const AdminDash = () => {
  // ============================================================
  // [1] حالات النظام الأساسية (CORE SYSTEM STATES)
  // ============================================================
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('الكل');
  const [statusNotification, setStatusNotification] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // مستودعات البيانات الرئيسية
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [exams, setExams] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [systemStats, setSystemStats] = useState({
    totalRevenue: 0, studentCount: 0, activeExams: 0, 
    pendingPayments: 0, totalSales: 0, dailyActiveUsers: 0
  });

  // ============================================================
  // [2] نماذج الإدخال الممتدة (EXTENDED FORM STATES)
  // ============================================================
  
  // نموذج إدارة الكورسات والمحتوى
  const [courseForm, setCourseForm] = useState({
    id: null,
    title: '',
    description: '',
    instructor: 'أ. محمود فرج',
    price: '',
    discountPrice: '',
    grade: '1 ثانوي',
    thumbnail: '',
    isPublished: true,
    videoPlaylistId: '', // YouTube Playlist or Vimeo Folder
    requirements: '',
    objectives: '',
    createdAt: null
  });

  // نموذج محرر الامتحانات الشامل
  const [examForm, setExamForm] = useState({
    id: null,
    title: '',
    description: '',
    courseId: '',
    timeLimit: 60, // بالدقائق
    minPassingScore: 50,
    showResultsImmediately: true,
    shuffleQuestions: false,
    questions: [
      { 
        id: Date.now(), 
        text: '', 
        options: ['', '', '', ''], 
        correctIndex: 0, 
        points: 5,
        explanation: ''
      }
    ]
  });

  // نموذج الحسابات وتوليد الأكواد
  const [financeForm, setFinanceForm] = useState({
    codeCount: 50,
    codeValue: 100,
    prefix: 'TITO',
    batchName: '',
    expiryDate: ''
  });

  // ============================================================
  // [3] تتبع البيانات الحقيقي (REAL-TIME DATA SYNC)
  // ============================================================
  useEffect(() => {
    const unsubcribers = [];
    setIsLoading(true);

    try {
      // مزامنة المستخدمين (الطلاب)
      const qUsers = query(collection(db, "users"), orderBy("createdAt", "desc"));
      unsubcribers.push(onSnapshot(qUsers, (snap) => {
        setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }));

      // مزامنة الكورسات
      const qCourses = query(collection(db, "courses_metadata"), orderBy("createdAt", "desc"));
      unsubcribers.push(onSnapshot(qCourses, (snap) => {
        setCourses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }));

      // مزامنة الامتحانات
      const qExams = query(collection(db, "exams"), orderBy("createdAt", "desc"));
      unsubcribers.push(onSnapshot(qExams, (snap) => {
        setExams(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }));

      // مزامنة طلبات السداد
      const qPayments = query(collection(db, "payment_requests"), orderBy("createdAt", "desc"));
      unsubcribers.push(onSnapshot(qPayments, (snap) => {
        setPaymentRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }));

      // مزامنة الإحصائيات العامة من Dashboard Doc
      unsubcribers.push(onSnapshot(doc(db, "system_info", "dashboard"), (snap) => {
        if (snap.exists()) setSystemStats(snap.data());
      }));

      // مزامنة سجل العمليات الأمني
      const qLogs = query(collection(db, "audit_logs"), orderBy("timestamp", "desc"), limit(100));
      unsubcribers.push(onSnapshot(qLogs, (snap) => {
        setAuditLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }));

    } catch (error) {
      console.error("Critical Sync Error:", error);
    } finally {
      setIsLoading(false);
    }

    return () => unsubcribers.forEach(unsub => unsub());
  }, []);

  // ============================================================
  // [4] الدوال التنفيذية الكبرى (GRAND LOGIC FUNCTIONS)
  // ============================================================

  const triggerToast = (message, type = 'info') => {
    setStatusNotification({ message, type });
    setTimeout(() => setStatusNotification(null), 4000);
  };

  const createAuditLog = async (action, details, severity = 'low') => {
    await addDoc(collection(db, "audit_logs"), {
      admin: auth.currentUser?.email || 'Master_Admin',
      action,
      details,
      severity,
      timestamp: serverTimestamp(),
      ip: 'Static_IP' // يمكن تطويرها
    });
  };

  // --- إدارة الكورسات ---
  const handleSaveCourse = async (e) => {
    e.preventDefault();
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const coursePayload = {
        ...courseForm,
        price: Number(courseForm.price),
        discountPrice: Number(courseForm.discountPrice || 0),
        lastModified: serverTimestamp()
      };

      if (courseForm.id) {
        await updateDoc(doc(db, "courses_metadata", courseForm.id), coursePayload);
        await createAuditLog("تعديل محتوى", `تم تحديث الكورس: ${courseForm.title}`, 'medium');
        triggerToast("تم تحديث الكورس بنجاح", "success");
      } else {
        await addDoc(collection(db, "courses_metadata"), {
          ...coursePayload,
          createdAt: serverTimestamp(),
          enrolledStudents: 0
        });
        await createAuditLog("إضافة محتوى", `تم نشر كورس جديد: ${courseForm.title}`, 'high');
        triggerToast("تم نشر الكورس الجديد", "success");
      }
      
      setCourseForm({ id: null, title: '', price: '', grade: '1 ثانوي', instructor: 'أ. محمود فرج', isPublished: true });
    } catch (err) {
      triggerToast("خطأ في الحفظ: " + err.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteCourse = async (id, title) => {
    if (!window.confirm(`هل أنت متأكد من حذف كورس "${title}" نهائياً؟`)) return;
    try {
      await deleteDoc(doc(db, "courses_metadata", id));
      await createAuditLog("حذف كورس", `تم حذف كورس: ${title}`, 'danger');
      triggerToast("تم الحذف بنجاح", "success");
    } catch (err) {
      triggerToast("خطأ في الحذف", "error");
    }
  };

  // --- إدارة الامتحانات ---
  const handleAddQuestion = () => {
    setExamForm(prev => ({
      ...prev,
      questions: [...prev.questions, { 
        id: Date.now(), text: '', options: ['', '', '', ''], correctIndex: 0, points: 5 
      }]
    }));
  };

  const handleUpdateQuestion = (index, field, value) => {
    const updatedQuestions = [...examForm.questions];
    updatedQuestions[index][field] = value;
    setExamForm({ ...examForm, questions: updatedQuestions });
  };

  const handleSaveExam = async () => {
    if (!examForm.title || !examForm.courseId) {
      triggerToast("يرجى اختيار الكورس وعنوان الامتحان", "warning");
      return;
    }
    setIsProcessing(true);
    try {
      const examData = { ...examForm, updatedAt: serverTimestamp() };
      if (examForm.id) {
        await updateDoc(doc(db, "exams", examForm.id), examData);
      } else {
        await addDoc(collection(db, "exams"), { ...examData, createdAt: serverTimestamp() });
      }
      triggerToast("تم حفظ الامتحان في بنك الأسئلة", "success");
      setExamForm({ id: null, title: '', questions: [{ id: Date.now(), text: '', options: ['', '', '', ''], correctIndex: 0, points: 5 }] });
    } catch (e) {
      triggerToast(e.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- إدارة الطلاب والأمان ---
  const handleToggleBan = async (user) => {
    const newStatus = !user.isBanned;
    try {
      await updateDoc(doc(db, "users", user.id), { isBanned: newStatus });
      await createAuditLog(newStatus ? "حظر مستخدم" : "فك حظر", `المستخدم: ${user.name}`, 'medium');
      triggerToast(newStatus ? "تم حظر الطالب" : "تم فك الحظر", "info");
    } catch (e) { triggerToast("فشلت العملية", "error"); }
  };

  const handleResetDevice = async (userId, name) => {
    if (!window.confirm(`تصفير جهاز الطالب ${name}؟ سيتيح له ذلك تسجيل الدخول من هاتف جديد.`)) return;
    try {
      await updateDoc(doc(db, "users", userId), { deviceId: null });
      triggerToast("تم تصفير معرف الجهاز", "success");
    } catch (e) { triggerToast(e.message, "error"); }
  };

  // --- إدارة المبيعات والمدفوعات ---
  const handleProcessPayment = async (request, action) => {
    setIsProcessing(true);
    try {
      await runTransaction(db, async (transaction) => {
        const reqRef = doc(db, "payment_requests", request.id);
        const userRef = doc(db, "users", request.userId);
        const statsRef = doc(db, "system_info", "dashboard");

        if (action === 'approve') {
          transaction.update(reqRef, { status: 'approved', approvedAt: serverTimestamp() });
          transaction.update(userRef, { 
            enrolledContent: arrayUnion(request.courseId),
            totalSpent: increment(Number(request.amount))
          });
          transaction.update(statsRef, { 
            totalRevenue: increment(Number(request.amount)),
            totalSales: increment(1)
          });
          await createAuditLog("مبيعات", `قبول سداد ${request.amount}ج للطالب ${request.userName}`, 'high');
        } else {
          transaction.update(reqRef, { status: 'rejected', rejectedAt: serverTimestamp() });
        }
      });
      triggerToast("تمت معالجة الطلب بنجاح", "success");
    } catch (e) {
      triggerToast("خطأ في المعاملة المالية", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- توليد الأكواد وتصدير الإكسيل ---
  const handleGenerateActivationCodes = async () => {
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
          createdAt: serverTimestamp(),
          batch: financeForm.batchName || 'Default'
        };
        batch.set(codeRef, payload);
        codesData.push({ "الكود": uniqueCode, "القيمة": financeForm.codeValue, "الحالة": "غير مستخدم" });
      }

      await batch.commit();
      
      // إنشاء وتنزيل ملف Excel
      const ws = XLSX.utils.json_to_sheet(codesData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Codes_List");
      XLSX.writeFile(wb, `Tito_Codes_${financeForm.batchName || 'New'}.xlsx`);

      triggerToast("تم توليد الأكواد بنجاح", "success");
      await createAuditLog("توليد أكواد", `توليد ${financeForm.codeCount} كود شحن بقيمة ${financeForm.codeValue}`, 'high');
    } catch (e) {
      triggerToast(e.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // ============================================================
  // [5] هيكل الواجهة الرسومية (UI STRUCTURE)
  // ============================================================

  const filteredUsers = users.filter(u => 
    (u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.phone?.includes(searchQuery)) &&
    (gradeFilter === 'الكل' || u.grade === gradeFilter)
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
              <DollarSign size={22} /> {!isSidebarCollapsed && <span>المبيعات</span>}
              {paymentRequests.filter(p=>p.status==='pending').length > 0 && <span className="pulse-badge">!</span>}
            </li>
            <li className={activeTab === 'codes' ? 'active' : ''} onClick={() => setActiveTab('codes')}>
              <Hash size={22} /> {!isSidebarCollapsed && <span>أكواد الشحن</span>}
            </li>
            <div className="sidebar-sep">{!isSidebarCollapsed && 'الأمان'}</div>
            <li className={activeTab === 'logs' ? 'active' : ''} onClick={() => setActiveTab('logs')}>
              <Activity size={22} /> {!isSidebarCollapsed && <span>سجل العمليات</span>}
            </li>
          </ul>
        </nav>

        <div className="sidebar-ctrl">
           <button className="collapse-action" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
              {isSidebarCollapsed ? <ChevronRight size={20}/> : <ChevronLeft size={20}/>}
           </button>
           <button className="logout-action" onClick={() => auth.signOut()}>
              <LogOut size={20}/> {!isSidebarCollapsed && 'خروج'}
           </button>
        </div>
      </aside>

      {/* Main View Area */}
      <main className="tito-main-viewport">
        
        {/* Dynamic Header */}
        <header className="viewport-top-bar">
          <div className="header-search-area">
             <Search size={18} />
             <input 
               placeholder="البحث عن طالب، كورس، أو معاملة مالية..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
             />
          </div>
          <div className="header-meta">
             <div className="system-health">
                <div className="status-dot"></div>
                النظام يعمل بكفاءة
             </div>
             <div className="admin-profile-pill">
                <img src={`https://ui-avatars.com/api/?name=Admin&background=0369a1&color=fff`} alt="Admin" />
                <div className="pill-text">
                   <strong>مسؤول النظام</strong>
                   <span>أدمن رئيسي</span>
                </div>
             </div>
          </div>
        </header>

        {/* Content Container */}
        <div className="viewport-scroller">
          <AnimatePresence mode="wait">
            
            {/* --- TAB 1: DASHBOARD --- */}
            {activeTab === 'dashboard' && (
              <motion.div key="dash" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="tab-view">
                 <div className="welcome-banner">
                    <h1>أهلاً بك مجدداً، يا دكتور محمود 👋</h1>
                    <p>هذا ملخص لما حدث في منصتك التعليمية خلال الـ 24 ساعة الماضية.</p>
                 </div>

                 <div className="summary-cards-grid">
                    <div className="summary-card c-blue">
                       <div className="c-icon"><TrendingUp size={30}/></div>
                       <div className="c-data">
                          <span>إجمالي الدخل المحقق</span>
                          <h3>{systemStats.totalRevenue?.toLocaleString()} ج.م</h3>
                       </div>
                       <div className="c-trend">+12% من الأسبوع الماضي</div>
                    </div>
                    <div className="summary-card c-green">
                       <div className="c-icon"><Users size={30}/></div>
                       <div className="c-data">
                          <span>الطلاب المسجلين</span>
                          <h3>{users.length} طالب</h3>
                       </div>
                    </div>
                    <div className="summary-card c-orange">
                       <div className="c-icon"><ShoppingBag size={30}/></div>
                       <div className="c-data">
                          <span>إجمالي المبيعات</span>
                          <h3>{systemStats.totalSales} عملية</h3>
                       </div>
                    </div>
                    <div className="summary-card c-purple">
                       <div className="c-icon"><Trophy size={30}/></div>
                       <div className="c-data">
                          <span>الامتحانات المتاحة</span>
                          <h3>{exams.length} اختبار</h3>
                       </div>
                    </div>
                 </div>

                 <div className="dashboard-charts-layout">
                    <div className="glass-panel main-stats-panel">
                       <div className="panel-header">
                          <h3><Activity size={18}/> تحليل نشاط المنصة</h3>
                          <div className="panel-ctrls">
                             <button className="active">أسبوعي</button>
                             <button>شهري</button>
                          </div>
                       </div>
                       <div className="visual-bars">
                          {/* تمثيل بياني محاكي */}
                          {[40, 65, 50, 85, 90, 60, 95].map((val, idx) => (
                             <div key={idx} className="bar-wrapper">
                                <motion.div 
                                  initial={{ height: 0 }} 
                                  animate={{ height: `${val}%` }} 
                                  transition={{ delay: idx * 0.1 }}
                                  className="bar-fill"
                                ></motion.div>
                                <span className="bar-day">Day {idx+1}</span>
                             </div>
                          ))}
                       </div>
                    </div>

                    <div className="glass-panel side-logs-panel">
                       <div className="panel-header"><h3><ShieldAlert size={18}/> آخر العمليات الأمنية</h3></div>
                       <div className="logs-mini-feed">
                          {auditLogs.slice(0, 8).map(log => (
                             <div key={log.id} className={`log-item-mini ${log.severity}`}>
                                <div className="log-indicator"></div>
                                <div className="log-txt">
                                   <strong>{log.action}</strong>
                                   <p>{log.details}</p>
                                   <span>{log.timestamp?.toDate().toLocaleTimeString('ar-EG')}</span>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </motion.div>
            )}

            {/* --- TAB 2: COURSES --- */}
            {activeTab === 'courses' && (
              <motion.div key="courses" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="tab-view">
                 <div className="view-action-header">
                    <h2>إدارة المحتوى الدراسي</h2>
                    <button className="btn-add-new" onClick={() => setCourseForm({id: null, title: '', grade: '1 ثانوي', price: '', instructor: 'أ. محمود فرج'})}>
                       <Plus size={18}/> إنشاء كورس جديد
                    </button>
                 </div>

                 <div className="courses-management-grid">
                    <div className="glass-panel course-editor-box">
                       <h3>{courseForm.id ? 'تعديل بيانات الكورس' : 'تجهيز كورس جديد'}</h3>
                       <form onSubmit={handleSaveCourse} className="tito-standard-form">
                          <div className="form-field">
                             <label>عنوان الكورس</label>
                             <input value={courseForm.title} onChange={e=>setCourseForm({...courseForm, title: e.target.value})} required placeholder="مثال: الباب الأول - الكيمياء العضوية" />
                          </div>
                          <div className="form-field-row">
                             <div className="form-field">
                                <label>السعر (ج.م)</label>
                                <input type="number" value={courseForm.price} onChange={e=>setCourseForm({...courseForm, price: e.target.value})} required />
                             </div>
                             <div className="form-field">
                                <label>المرحلة الدراسية</label>
                                <select value={courseForm.grade} onChange={e=>setCourseForm({...courseForm, grade: e.target.value})}>
                                   <option>1 ثانوي</option>
                                   <option>2 ثانوي</option>
                                   <option>3 ثانوي</option>
                                </select>
                             </div>
                          </div>
                          <div className="form-field">
                             <label>معرف قائمة التشغيل (YouTube Playlist ID)</label>
                             <input value={courseForm.videoPlaylistId} onChange={e=>setCourseForm({...courseForm, videoPlaylistId: e.target.value})} placeholder="PLxxxxxxxxxxxxxx" />
                          </div>
                          <div className="form-field">
                             <label>وصف الكورس</label>
                             <textarea rows="4" value={courseForm.description} onChange={e=>setCourseForm({...courseForm, description: e.target.value})} placeholder="اكتب نبذة مختصرة عن محتويات هذا الكورس..." />
                          </div>
                          <button type="submit" className="form-submit-btn" disabled={isProcessing}>
                             {isProcessing ? <RefreshCcw className="spin"/> : <Save size={18}/>}
                             حفظ ونشر الكورس
                          </button>
                       </form>
                    </div>

                    <div className="courses-display-list">
                       {courses.map(course => (
                         <div key={course.id} className="modern-course-card">
                            <div className="c-card-img">
                               <img src={course.thumbnail || 'https://placehold.co/600x300/1e293b/ffffff?text=COURSE+THUMBNAIL'} alt="" />
                               <span className={`c-status-tag ${course.isPublished ? 'published' : 'draft'}`}>
                                  {course.isPublished ? 'نشط' : 'مسودة'}
                               </span>
                            </div>
                            <div className="c-card-body">
                               <div className="c-meta"><span>{course.grade}</span> <span>{course.price} ج.م</span></div>
                               <h4>{course.title}</h4>
                               <div className="c-actions-row">
                                  <button onClick={() => setCourseForm(course)} className="a-edit"><Edit3 size={16}/> تعديل</button>
                                  <button onClick={() => handleDeleteCourse(course.id, course.title)} className="a-delete"><Trash2 size={16}/></button>
                               </div>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
              </motion.div>
            )}

            {/* --- TAB 3: EXAMS (MCQ ENGINE) --- */}
            {activeTab === 'exams' && (
              <motion.div key="exams" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="tab-view">
                 <div className="exam-engine-layout">
                    <div className="glass-panel builder-panel">
                       <div className="builder-top">
                          <h2><ListPlus size={24}/> منشئ الامتحانات التفاعلي</h2>
                          <button className="btn-save-exam" onClick={handleSaveExam}>اعتماد الامتحان</button>
                       </div>

                       <div className="builder-settings">
                          <input 
                            className="exam-title-input" 
                            placeholder="اسم الامتحان (مثال: اختبار الشهر الأول)" 
                            value={examForm.title}
                            onChange={e=>setExamForm({...examForm, title: e.target.value})}
                          />
                          <div className="settings-row">
                             <select value={examForm.courseId} onChange={e=>setExamForm({...examForm, courseId: e.target.value})}>
                                <option value="">اربط الامتحان بكورس معين...</option>
                                {courses.map(c => <option key={c.id} value={c.id}>{c.title} ({c.grade})</option>)}
                             </select>
                             <div className="icon-input"><Timer size={16}/><input type="number" value={examForm.timeLimit} onChange={e=>setExamForm({...examForm, timeLimit: e.target.value})} /> دقيقة</div>
                             <div className="icon-input"><Award size={16}/><input type="number" value={examForm.minPassingScore} onChange={e=>setExamForm({...examForm, minPassingScore: e.target.value})} /> % للنجاح</div>
                          </div>
                       </div>

                       <div className="questions-scroll-area">
                          {examForm.questions.map((q, qIndex) => (
                             <div key={q.id} className="question-editor-card">
                                <div className="q-card-head">
                                   <span>السؤال رقم {qIndex + 1}</span>
                                   <button onClick={() => {
                                      const filtered = examForm.questions.filter((_, i) => i !== qIndex);
                                      setExamForm({...examForm, questions: filtered});
                                   }}><Trash size={16}/></button>
                                </div>
                                <textarea 
                                  placeholder="اكتب نص السؤال هنا..." 
                                  value={q.text} 
                                  onChange={e => handleUpdateQuestion(qIndex, 'text', e.target.value)}
                                />
                                <div className="options-input-grid">
                                   {q.options.map((opt, oIdx) => (
                                      <div key={oIdx} className={`option-field ${q.correctIndex === oIdx ? 'correct' : ''}`}>
                                         <input 
                                           type="radio" 
                                           name={`q-correct-${qIndex}`} 
                                           checked={q.correctIndex === oIdx}
                                           onChange={() => handleUpdateQuestion(qIndex, 'correctIndex', oIdx)}
                                         />
                                         <input 
                                           placeholder={`الاختيار ${oIdx + 1}`} 
                                           value={opt}
                                           onChange={e => {
                                              const newOpts = [...q.options];
                                              newOpts[oIdx] = e.target.value;
                                              handleUpdateQuestion(qIndex, 'options', newOpts);
                                           }}
                                         />
                                      </div>
                                   ))}
                                </div>
                             </div>
                          ))}
                          <button className="btn-add-question" onClick={handleAddQuestion}><Plus size={20}/> إضافة سؤال جديد</button>
                       </div>
                    </div>

                    <div className="exams-inventory-panel glass-panel">
                       <h3>بنك الامتحانات الحالي</h3>
                       <div className="inventory-list">
                          {exams.map(ex => (
                             <div key={ex.id} className="inventory-item">
                                <div className="ex-info">
                                   <strong>{ex.title}</strong>
                                   <span>{ex.questions.length} سؤال | {ex.timeLimit} دقيقة</span>
                                </div>
                                <div className="ex-ctrls">
                                   <button onClick={() => setExamForm(ex)}><Edit3 size={16}/></button>
                                   <button onClick={async () => { if(window.confirm("حذف؟")) await deleteDoc(doc(db, "exams", ex.id)) }}><Trash2 size={16}/></button>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </motion.div>
            )}

            {/* --- TAB 4: USERS --- */}
            {activeTab === 'users' && (
              <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="tab-view">
                 <div className="table-controls-bar glass-panel">
                    <div className="filters">
                       <div className="search-input-wrap">
                          <Search size={18}/>
                          <input placeholder="ابحث باسم الطالب أو رقم هاتفه..." onChange={e=>setSearchQuery(e.target.value)} />
                       </div>
                       <select className="grade-select" onChange={e=>setGradeFilter(e.target.value)}>
                          <option>الكل</option>
                          <option>1 ثانوي</option>
                          <option>2 ثانوي</option>
                          <option>3 ثانوي</option>
                       </select>
                    </div>
                    <button className="btn-excel" onClick={() => {
                       const excelData = users.map(u => ({ "الاسم": u.name, "الهاتف": u.phone, "المرحلة": u.grade, "الرصيد": u.wallet || 0 }));
                       const ws = XLSX.utils.json_to_sheet(excelData);
                       const wb = XLSX.utils.book_new();
                       XLSX.utils.book_append_sheet(wb, ws, "Students");
                       XLSX.writeFile(wb, "Tito_Academy_Students.xlsx");
                    }}>
                       <Download size={18}/> تصدير قاعدة البيانات
                    </button>
                 </div>

                 <div className="glass-panel main-table-wrapper">
                    <table className="tito-data-table">
                       <thead>
                          <tr>
                             <th>الطالب</th>
                             <th>المرحلة الدراسية</th>
                             <th>رقم الهاتف</th>
                             <th>رصيد المحفظة</th>
                             <th>الجهاز</th>
                             <th>الحالة</th>
                             <th>الإجراءات</th>
                          </tr>
                       </thead>
                       <tbody>
                          {filteredUsers.map(user => (
                            <tr key={user.id} className={user.isBanned ? 'row-banned' : ''}>
                               <td>
                                  <div className="user-profile-cell">
                                     <div className="u-initials" style={{background: user.isBanned ? '#ef4444' : '#0369a1'}}>
                                        {user.name?.charAt(0)}
                                     </div>
                                     <div className="u-names">
                                        <strong>{user.name}</strong>
                                        <span>{user.email}</span>
                                     </div>
                                  </div>
                               </td>
                               <td><span className="grade-pill">{user.grade}</span></td>
                               <td>{user.phone}</td>
                               <td><strong>{user.wallet || 0} ج.م</strong></td>
                               <td>
                                  <button className="btn-device-reset" onClick={() => handleResetDevice(user.id, user.name)}>
                                     <MonitorSmartphone size={16}/> {user.deviceId ? 'مسجل' : 'متاح'}
                                  </button>
                               </td>
                               <td>
                                  <span className={`status-pill ${user.isBanned ? 'banned' : 'active'}`}>
                                     {user.isBanned ? 'محظور' : 'نشط'}
                                  </span>
                               </td>
                               <td>
                                  <div className="actions-flex">
                                     <button className="a-btn ban" onClick={() => handleToggleBan(user)}>
                                        {user.isBanned ? <Unlock size={16}/> : <ShieldBan size={16}/>}
                                     </button>
                                     <button className="a-btn results"><BarChart3 size={16}/></button>
                                  </div>
                               </td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </motion.div>
            )}

            {/* --- TAB 5: PAYMENTS --- */}
            {activeTab === 'payments' && (
              <motion.div key="payments" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="tab-view">
                 <div className="payments-requests-grid">
                    {paymentRequests.filter(p => p.status === 'pending').map(request => (
                       <div key={request.id} className="payment-ticket glass-panel">
                          <div className="ticket-header">
                             <div className="amount-label">{request.amount} ج.م</div>
                             <div className="time-stamp"><Clock size={12}/> {request.createdAt?.toDate().toLocaleTimeString()}</div>
                          </div>
                          <div className="ticket-details">
                             <p><strong><Users size={14}/> الطالب:</strong> {request.userName}</p>
                             <p><strong><BookOpen size={14}/> الكورس:</strong> {request.courseName}</p>
                             <p><strong><Smartphone size={14}/> من رقم:</strong> {request.senderPhone}</p>
                          </div>
                          {request.screenshotUrl && (
                             <div className="ticket-proof">
                                <a href={request.screenshotUrl} target="_blank" rel="noreferrer">
                                   <ImageIcon size={14}/> مشاهدة إيصال الدفع
                                </a>
                             </div>
                          )}
                          <div className="ticket-actions">
                             <button className="btn-approve" onClick={() => handleProcessPayment(request, 'approve')}>
                                <CheckCircle2 size={18}/> قبول التفعيل
                             </button>
                             <button className="btn-reject" onClick={() => handleProcessPayment(request, 'reject')}>
                                <X size={18}/> رفض
                             </button>
                          </div>
                       </div>
                    ))}
                    {paymentRequests.filter(p=>p.status==='pending').length === 0 && (
                       <div className="empty-state-full">
                          <ShoppingBag size={64} />
                          <h3>لا توجد طلبات دفع معلقة حالياً</h3>
                          <p>سيظهر هنا أي طلب تفعيل كورس يقوم به الطلاب من تطبيقهم.</p>
                       </div>
                    )}
                 </div>
              </motion.div>
            )}

            {/* --- TAB 6: CODES --- */}
            {activeTab === 'codes' && (
              <motion.div key="codes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="tab-view">
                 <div className="codes-generator-container glass-panel">
                    <div className="gen-branding">
                       <Zap size={48} color="#f59e0b"/>
                       <h2>نظام توليد أكواد الشحن الذكي</h2>
                       <p>قم بتوليد أكواد محفظة لبيعها يدوياً للطلاب. سيتم تصدير ملف إكسيل تلقائياً فور التوليد.</p>
                    </div>

                    <div className="gen-form-layout">
                       <div className="form-group">
                          <label>عدد الأكواد المطلوبة</label>
                          <input type="number" value={financeForm.codeCount} onChange={e=>setFinanceForm({...financeForm, codeCount: e.target.value})} />
                       </div>
                       <div className="form-group">
                          <label>قيمة الكود الواحد (ج.م)</label>
                          <input type="number" value={financeForm.codeValue} onChange={e=>setFinanceForm({...financeForm, codeValue: e.target.value})} />
                       </div>
                       <div className="form-group">
                          <label>اسم الدفعة (للتنظيم)</label>
                          <input placeholder="مثال: دفعة شهر أكتوبر" value={financeForm.batchName} onChange={e=>setFinanceForm({...financeForm, batchName: e.target.value})} />
                       </div>
                       <div className="form-group">
                          <label>بادئة الكود (Prefix)</label>
                          <input value={financeForm.prefix} onChange={e=>setFinanceForm({...financeForm, prefix: e.target.value})} />
                       </div>
                    </div>
                    
                    <button className="btn-start-generation" onClick={handleGenerateActivationCodes} disabled={isProcessing}>
                       {isProcessing ? <RefreshCcw className="spin"/> : <Zap size={20}/>}
                       بدء توليد الأكواد وتصدير ملف Excel
                    </button>
                 </div>
              </motion.div>
            )}

            {/* --- TAB 7: LOGS --- */}
            {activeTab === 'logs' && (
               <motion.div key="logs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="tab-view">
                  <div className="glass-panel logs-viewer-panel">
                     <div className="panel-header">
                        <h3>سجل الرقابة والأمن الفيدرالي للمنصة</h3>
                        <button className="btn-clear-logs" onClick={() => triggerToast("غير مسموح بمسح السجلات لأسباب أمنية", "error")}>
                           <ShieldAlert size={16}/> حماية السجلات
                        </button>
                     </div>
                     <div className="full-audit-table">
                        <div className="audit-row header">
                           <div>التوقيت</div><div>المسؤول</div><div>الإجراء</div><div>التفاصيل</div><div>المستوى</div>
                        </div>
                        {auditLogs.map(log => (
                           <div key={log.id} className={`audit-row level-${log.severity}`}>
                              <div>{log.timestamp?.toDate().toLocaleString('ar-EG')}</div>
                              <div>{log.admin}</div>
                              <div><strong>{log.action}</strong></div>
                              <div>{log.details}</div>
                              <div><span className={`sev-tag ${log.severity}`}>{log.severity}</span></div>
                           </div>
                        ))}
                     </div>
                  </div>
               </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Global Floating Notification */}
        <AnimatePresence>
           {statusNotification && (
              <motion.div 
                initial={{ x: 400, opacity: 0 }} 
                animate={{ x: 0, opacity: 1 }} 
                exit={{ x: 400, opacity: 0 }} 
                className={`global-toast ${statusNotification.type}`}
              >
                 {statusNotification.type === 'success' ? <CheckCircle2 size={20}/> : <AlertCircle size={20}/>}
                 {statusNotification.message}
              </motion.div>
           )}
        </AnimatePresence>

        {/* Global Processing Loader */}
        {isProcessing && (
           <div className="tito-global-overlay">
              <div className="tito-loader-ring"></div>
              <p>جاري معالجة الطلب في خوادم السحابة...</p>
           </div>
        )}

      </main>
    </div>
  );
};

export default AdminDash;


