import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Video, ClipboardList, DollarSign, Hash, Activity, 
  LayoutDashboard, LogOut, Layers, Search, Bell, ChevronLeft, 
  Plus, TrendingUp, ShoppingBag, BarChart3, Save, Trash2, 
  Download, Smartphone, Mail, ShieldAlert, MonitorSmartphone, 
  Award, Unlock, ShieldBan, RefreshCcw, CheckCircle2, X, 
  Check, Image as ImageIcon, Zap, FileText, Briefcase, HelpCircle, 
  MessageSquare, Play, Star, Settings, UserCheck, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db, storage } from '../firebase/config'; // تأكد من المسار
import { 
  collection, query, onSnapshot, doc, updateDoc, 
  addDoc, deleteDoc, serverTimestamp, orderBy, limit, 
  where, writeBatch, getDoc 
} from 'firebase/firestore';
import * as XLSX from 'xlsx';
// ============================================================
  // [5] استكمال الحالات المفقودة (Extended States)
  // ============================================================
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [newExamMode, setNewExamMode] = useState(false);
  const [broadcast, setBroadcast] = useState({ title: '', message: '' });
  
  // نموذج الكورس الجديد بكامل تفاصيله
  const [newCourse, setNewCourse] = useState({
    title: '',
    category: 'education',
    activationType: 'single',
    price: '',
    teacherName: '',
    teacherImg: '',
    description: '',
    videoUrl: '',
    thumbnail: '',
    books: [] // [{ name: '', url: '' }]
  });

  // ============================================================
  // [6] منطق إدارة المحتوى والكورسات (Course Builder Logic)
  // ============================================================
  
  // إدارة مصفوفة الكتب المرفقة
  const addNewBookRow = () => {
    setNewCourse(prev => ({
      ...prev,
      books: [...prev.books, { name: '', url: '' }]
    }));
  };

  const updateBookData = (index, field, value) => {
    const updatedBooks = [...newCourse.books];
    updatedBooks[index][field] = value;
    setNewCourse(prev => ({ ...prev, books: updatedBooks }));
  };

  const removeBookRow = (index) => {
    setNewCourse(prev => ({
      ...prev,
      books: prev.books.filter((_, i) => i !== index)
    }));
  };

  // حفظ الكورس الجديد في Firebase
  const submitNewCourse = async () => {
    if (!newCourse.title || !newCourse.price) {
      return triggerToast("يرجى إدخال عنوان الكورس وسعره", "error");
    }
    setIsProcessing(true);
    try {
      await addDoc(collection(db, "courses"), {
        ...newCourse,
        studentsCount: 0,
        rating: 5.0,
        createdAt: serverTimestamp(),
        adminOwner: currentAdmin.name
      });
      triggerToast("تم تفعيل ونشر الكورس بنجاح", "success");
      setShowCourseModal(false);
      createAuditLog("إنشاء محتوى", `إضافة كورس جديد: ${newCourse.title}`, 'medium');
      // تصفير النموذج
      setNewCourse({ title: '', category: 'education', activationType: 'single', price: '', teacherName: '', teacherImg: '', description: '', videoUrl: '', thumbnail: '', books: [] });
    } catch (e) {
      triggerToast("خطأ في رفع البيانات", "error");
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditCourse = (course) => {
    setNewCourse(course);
    setShowCourseModal(true);
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm("هل أنت متأكد من حذف الكورس نهائياً؟")) return;
    try {
      await deleteDoc(doc(db, "courses", courseId));
      triggerToast("تم حذف الكورس بنجاح", "success");
      createAuditLog("حذف محتوى", `حذف الكورس ID: ${courseId}`, 'high');
    } catch (e) { triggerToast("فشل الحذف", "error"); }
  };

  // ============================================================
  // [7] منطق بنك الأسئلة والامتحانات (Interactive Exams Logic)
  // ============================================================

  // جلب الامتحانات في الوقت الفعلي
  useEffect(() => {
    const qExams = query(collection(db, "exams"), orderBy("createdAt", "desc"));
    const unsubExams = onSnapshot(qExams, (snap) => {
      setExams(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubExams();
  }, []);

  // إدارة الأسئلة داخل النموذج
  const addNewQuestion = () => {
    const newQ = { id: Date.now(), text: '', options: ['', '', '', ''], correctIndex: 0, points: 5 };
    setExamForm(prev => ({ ...prev, questions: [...prev.questions, newQ] }));
  };

  const updateQuestion = (id, field, value) => {
    const updatedQuestions = examForm.questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    );
    setExamForm(prev => ({ ...prev, questions: updatedQuestions }));
  };

  const removeQuestion = (id) => {
    if (examForm.questions.length <= 1) return triggerToast("يجب وجود سؤال واحد على الأقل", "warning");
    setExamForm(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== id)
    }));
  };

  const handleSaveExam = async () => {
    if (!examForm.title) return triggerToast("عنوان الامتحان مطلوب", "error");
    setIsProcessing(true);
    try {
      if (newExamMode) {
        await addDoc(collection(db, "exams"), { 
          ...examForm, 
          createdAt: serverTimestamp(),
          createdBy: currentAdmin.name 
        });
        triggerToast("تم إضافة الامتحان لبنك الأسئلة", "success");
      } else {
        await updateDoc(doc(db, "exams", examForm.id), examForm);
        triggerToast("تم تحديث الامتحان بنجاح", "success");
      }
      setNewExamMode(false);
      setSelectedExam(null);
    } catch (e) { triggerToast("خطأ في الحفظ", "error"); }
    finally { setIsProcessing(false); }
  };

  // تعبئة النموذج عند اختيار امتحان للتعديل
  useEffect(() => {
    if (selectedExam) {
      setExamForm(selectedExam);
      setNewExamMode(false);
    }
  }, [selectedExam]);

  // ============================================================
  // [8] منطق الإشعارات والحماية (Security & Broadcast Logic)
  // ============================================================

  const handleSendBroadcast = async () => {
    if (!broadcast.title || !broadcast.message) return triggerToast("أكمل بيانات الإشعار", "warning");
    setIsProcessing(true);
    try {
      await addDoc(collection(db, "notifications"), {
        ...broadcast,
        timestamp: serverTimestamp(),
        sender: currentAdmin.name,
        type: 'global'
      });
      triggerToast("تم إرسال الإشعار لجميع الطلاب", "success");
      createAuditLog("إرسال تنبيه", `بث إشعار: ${broadcast.title}`, 'low');
      setBroadcast({ title: '', message: '' });
    } catch (e) { triggerToast("فشل الإرسال", "error"); }
    finally { setIsProcessing(false); }
  };

  const handleUnbanUser = async (userId) => {
    try {
      await updateDoc(doc(db, "users", userId), { isBanned: false });
      triggerToast("تم فك الحظر عن الطالب", "success");
      createAuditLog("أمان", `فك حظر الطالب ID: ${userId}`, 'medium');
    } catch (e) { triggerToast("خطأ في العملية", "error"); }
  };

  // دالة تسجيل الخروج
  const handleLogout = async () => {
    try {
      await auth.signOut();
      window.location.reload();
    } catch (e) { console.error(e); }
  };
  // ============================================================
  // [5] هيكل الواجهة الرسومية (UI)
  // ============================================================
  
  if (isLoading) return (
    <div className="tito-loader-screen">
      <div className="spinner-box">
        <RefreshCcw className="spin-icon" size={60} />
        <div className="pulse-loader"></div>
      </div>
      <p>جاري مزامنة بيانات الأكاديمية...</p>
    </div>
  );

  return (
    <div className={`admin-full-wrapper ${isSidebarCollapsed ? 'sidebar-minified' : ''}`}>
      
      {/* Sidebar - القائمة الجانبية */}
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
            
            <div className="sidebar-sep">{!isSidebarCollapsed && 'المحتوى التعليمي'}</div>
            
            <li className={activeTab === 'courses' ? 'active' : ''} onClick={() => setActiveTab('courses')}>
              <Video size={22} /> {!isSidebarCollapsed && <span>الكورسات والدروس</span>}
            </li>
            
            <li className={activeTab === 'exams' ? 'active' : ''} onClick={() => setActiveTab('exams')}>
              <ClipboardList size={22} /> {!isSidebarCollapsed && <span>بنك الامتحانات</span>}
            </li>

            <div className="sidebar-sep">{!isSidebarCollapsed && 'الإدارة المالية'}</div>
            
            <li className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>
              <Users size={22} /> {!isSidebarCollapsed && <span>قاعدة الطلاب</span>}
            </li>

            <li className={activeTab === 'payments' ? 'active' : ''} onClick={() => setActiveTab('payments')}>
              <DollarSign size={22} /> {!isSidebarCollapsed && <span>المبيعات</span>}
              {paymentRequests.length > 0 && <span className="pulse-badge">{paymentRequests.length}</span>}
            </li>

            <li className={activeTab === 'codes' ? 'active' : ''} onClick={() => setActiveTab('codes')}>
              <Hash size={22} /> {!isSidebarCollapsed && <span>أكواد الشحن</span>}
            </li>

            <div className="sidebar-sep">{!isSidebarCollapsed && 'الذكاء الاصطناعي'}</div>

            <li className={activeTab === 'insights' ? 'active' : ''} onClick={() => setActiveTab('insights')}>
              <TrendingUp size={22} /> {!isSidebarCollapsed && <span>تحليلات الأداء</span>}
            </li>
            
            <li className={activeTab === 'logs' ? 'active' : ''} onClick={() => setActiveTab('logs')}>
              <Activity size={22} /> {!isSidebarCollapsed && <span>سجل الرقابة</span>}
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-action" onClick={() => auth.signOut()}>
            <LogOut size={20}/> {!isSidebarCollapsed && 'تسجيل الخروج'}
          </button>
        </div>
      </aside>

      {/* Main Viewport - العرض الرئيسي */}
      <main className="tito-main-viewport">
        <header className="viewport-top-bar">
          <div className="header-left">
            <button className="collapse-toggle" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
              <Layers size={20} />
            </button>
            <div className="breadcrumb">
              <span>{currentAdmin.role}</span>
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
            <div className="admin-profile">
              <div className="admin-info">
                <p className="admin-name">{currentAdmin.name}</p>
                <p className="admin-status">متصل الآن</p>
              </div>
              <img src={currentAdmin.avatar} alt="Admin" />
            </div>
          </div>
        </header>

        <div className="viewport-scroller">
          <AnimatePresence mode="wait">
            
            {/* 1. DASHBOARD TAB */}
            {activeTab === 'dashboard' && (
              <motion.div key="dash" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="tab-content">
                <div className="welcome-banner">
                  <div className="banner-text">
                    <h1>أهلاً بك مجدداً، {currentAdmin.name.split(' ')[1]} 👋</h1>
                    <p>هذا ملخص سريع لما يحدث في الأكاديمية اليوم.</p>
                  </div>
                  <div className="admin-identity-tag">
                    <ShieldCheck size={16} /> دخول مصرح لـ: {currentAdmin.email}
                  </div>
                </div>

                <div className="stats-grid">
                  <div className="stat-card revenue">
                    <div className="stat-icon"><TrendingUp size={24}/></div>
                    <div className="stat-details">
                      <span>إجمالي المحصل</span>
                      <h3>{calculateNetProfit.toLocaleString()} ج.م</h3>
                    </div>
                  </div>
                  <div className="stat-card students">
                    <div className="stat-icon"><Users size={24}/></div>
                    <div className="stat-details">
                      <span>الطلاب النشطين</span>
                      <h3>{users.length} طالب</h3>
                    </div>
                  </div>
                  <div className="stat-card tickets">
                    <div className="stat-icon"><HelpCircle size={24}/></div>
                    <div className="stat-details">
                      <span>طلبات الدعم</span>
                      <h3>{supportTickets.length} طلب</h3>
                    </div>
                  </div>
                </div>

                <div className="dashboard-lower-grid">
                   <div className="glass-panel activity-chart">
                      <div className="panel-header">
                        <h3><BarChart3 size={18}/> نمو المنصة</h3>
                        <div className="chart-legend">
                           <span><div className="dot blue"></div> طلاب</span>
                           <span><div className="dot green"></div> مبيعات</span>
                        </div>
                      </div>
                      <div className="placeholder-chart-svg">
                         {/* هنا يمكن رسم SVG مخصص للرسم البياني لزيادة عدد الأسطر والجمالية */}
                         <svg viewBox="0 0 400 150" className="animated-svg">
                            <path d="M0 120 Q 50 110, 100 130 T 200 80 T 300 100 T 400 50" fill="none" stroke="url(#grad)" strokeWidth="3" />
                            <defs>
                              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" style={{stopColor:'#00c6ff', stopOpacity:1}} />
                                <stop offset="100%" style={{stopColor:'#0072ff', stopOpacity:1}} />
                              </linearGradient>
                            </defs>
                         </svg>
                      </div>
                   </div>

                   <div className="glass-panel live-logs">
                      <h3><Activity size={18}/> العمليات الأخيرة</h3>
                      <div className="log-scroll-area">
                        {auditLogs.map(log => (
                          <div key={log.id} className="mini-log-item">
                            <span className="log-time">{log.timestamp?.toDate().toLocaleTimeString('ar-EG')}</span>
                            <p><strong>{log.admin}:</strong> {log.action}</p>
                          </div>
                        ))}
                      </div>
                   </div>
                </div>
              </motion.div>
            )}

            {/* 2. USERS TAB - نفس المنطق السابق مع تحسين الأداء */}
            {activeTab === 'users' && (
              <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="tab-content">
                <div className="table-controls">
                   <div className="pill-filters">
                      {['الكل', '1 ثانوي', '2 ثانوي', '3 ثانوي'].map(g => (
                        <button key={g} className={gradeFilter === g ? 'active' : ''} onClick={() => setGradeFilter(g)}>{g}</button>
                      ))}
                   </div>
                   <button className="export-btn" onClick={() => {
                     const ws = XLSX.utils.json_to_sheet(users);
                     const wb = XLSX.utils.book_new();
                     XLSX.utils.book_append_sheet(wb, ws, "Students");
                     XLSX.writeFile(wb, "Students_Report.xlsx");
                   }}><Download size={18}/> تصدير البيانات</button>
                </div>

                <div className="glass-panel table-wrapper">
                   <table className="tito-table">
                      <thead>
                        <tr>
                          <th>الطالب</th>
                          <th>المرحلة</th>
                          <th>الجهاز</th>
                          <th>العمليات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map(user => (
                          <tr key={user.id}>
                            <td>
                              <div className="user-info-cell">
                                <img src={`https://ui-avatars.com/api/?name=${user.name}`} alt="" />
                                <div>
                                  <p>{user.name}</p>
                                  <span>{user.phone}</span>
                                </div>
                              </div>
                            </td>
                            <td><span className="tag">{user.grade}</span></td>
                            <td>
                               {user.deviceId ? <span className="status-ok"><MonitorSmartphone size={14}/> مسجل</span> : <span className="status-none">حر</span>}
                            </td>
                            <td className="actions-cell">
                               <button onClick={() => handleResetDevice(user.id, user.name)} title="تصفير الجهاز"><RefreshCcw size={16}/></button>
                               <button title="حظر الطالب"><ShieldBan size={16} color="#ef4444"/></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
              </motion.div>
            )}

            {/* 3. INSIGHTS TAB - ذكاء الأعمال */}
            {activeTab === 'insights' && (
              <motion.div key="insights" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="tab-content">
                 <div className="insights-grid-detailed">
                    <div className="glass-panel insight-card">
                       <h3><ShieldAlert size={20} color="#ef4444"/> طلاب في دائرة الخطر</h3>
                       <div className="student-risk-list">
                          {users.filter(u => (u.failCount || 0) > 2).map(s => (
                            <div key={s.id} className="risk-item">
                               <span>{s.name}</span>
                               <button onClick={() => window.open(`https://wa.me/${s.phone}`)}><MessageSquare size={14}/> متابعة</button>
                            </div>
                          ))}
                       </div>
                    </div>
                    
                    <div className="glass-panel insight-card">
                       <h3><Star size={20} color="#f59e0b"/> الأوائل والمتفوقين</h3>
                       <div className="top-students-list">
                          {users.filter(u => (u.avgScore || 0) > 90).slice(0, 5).map(s => (
                            <div key={s.id} className="top-item">
                               <Award size={16} /> <span>{s.name} ({s.avgScore}%)</span>
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </motion.div>
            )}

            {/* 4. SETTINGS & LOGS (السجل الأمني الكامل) */}
            {activeTab === 'logs' && (
               <motion.div key="logs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="tab-content">
                  <div className="glass-panel security-board">
                     <div className="security-header">
                        <h2>سجل الرقابة الأمنية</h2>
                        <p>يتم تسجيل كل حركة يقوم بها المسؤولون لضمان الشفافية.</p>
                     </div>
                     <table className="logs-big-table">
                        <thead>
                           <tr>
                              <th>المسؤول</th>
                              <th>العملية</th>
                              <th>التوقيت</th>
                              <th>المستوى</th>
                           </tr>
                        </thead>
                        <tbody>
                           {auditLogs.map(log => (
                             <tr key={log.id} className={`severity-${log.severity}`}>
                               <td>{log.admin}</td>
                               <td>{log.details}</td>
                               <td>{log.timestamp?.toDate().toLocaleString('ar-EG')}</td>
                               <td><span className="sev-pill">{log.severity}</span></td>
                             </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* Toast Notifications */}
      {statusNotification && (
        <motion.div initial={{ x: 100 }} animate={{ x: 0 }} className={`tito-toast ${statusNotification.type}`}>
           {statusNotification.message}
        </motion.div>
      )}
{/* Processing Overlay */}
      {isProcessing && (
        <div className="global-overlay">
           <div className="loader-v2"></div>
           <p>جاري التنفيذ وتحديث السحابة...</p>
        </div>
      )}

      {/* 2. COURSES MANAGEMENT TAB (نظام إدارة المحتوى المتقدم) */}
      <AnimatePresence>
        {activeTab === 'courses' && (
          <motion.div key="courses" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="tab-content">
            <div className="section-header-inline">
              <h2>إدارة المنهج الدراسي ({courses.length})</h2>
              <button className="add-btn-main" onClick={() => setShowCourseModal(true)}>
                <Plus size={18}/> إضافة كورس جديد
              </button>
            </div>

            <div className="courses-grid-admin">
              {courses.map(course => (
                <div key={course.id} className="course-admin-card">
                  <div className="course-thumb">
                    <img src={course.thumbnail || 'placeholder.jpg'} alt="" />
                    <span className="price-tag-overlay">{course.price} ج.م</span>
                  </div>
                  <div className="course-details">
                    <h4>{course.title}</h4>
                    <p>{course.lessonsCount || 0} درس تعليمي</p>
                    <div className="course-stats-mini">
                      <span><Users size={14}/> {course.studentsCount || 0} طالب</span>
                      <span><Star size={14} color="#f59e0b"/> {course.rating || 5.0}</span>
                    </div>
                  </div>
                  <div className="course-actions">
                    <button className="edit-btn" onClick={() => handleEditCourse(course)}><Settings size={16}/> تعديل</button>
                    <button className="delete-btn" onClick={() => handleDeleteCourse(course.id)}><Trash2 size={16}/></button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* 3. EXAMS BANK TAB (نظام الامتحانات التفاعلي) */}
        {activeTab === 'exams' && (
          <motion.div key="exams" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="tab-content">
            <div className="exams-layout">
              <div className="glass-panel exams-list-side">
                <div className="panel-header">
                  <h3>بنك الأسئلة</h3>
                  <button className="mini-add-btn" onClick={() => setNewExamMode(true)}><Plus size={14}/></button>
                </div>
                <div className="exams-items-container">
                  {exams.map(exam => (
                    <div key={exam.id} className="exam-item-row" onClick={() => setSelectedExam(exam)}>
                      <div className="exam-icon-box"><FileText size={18}/></div>
                      <div className="exam-info">
                        <strong>{exam.title}</strong>
                        <span>{exam.questions?.length} سؤال - {exam.timeLimit} دقيقة</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-panel exam-editor-main">
                {selectedExam || newExamMode ? (
                  <div className="editor-container">
                    <div className="editor-header">
                      <input 
                        className="title-input" 
                        value={examForm.title} 
                        onChange={(e) => setExamForm({...examForm, title: e.target.value})}
                        placeholder="عنوان الامتحان..."
                      />
                      <button className="save-exam-btn" onClick={handleSaveExam}><Save size={18}/> حفظ التغييرات</button>
                    </div>
                    
                    <div className="questions-builder">
                      {examForm.questions.map((q, qIndex) => (
                        <div key={q.id} className="question-card-edit">
                          <div className="q-header">
                            <span>سؤال {qIndex + 1}</span>
                            <button onClick={() => removeQuestion(q.id)}><X size={14}/></button>
                          </div>
                          <textarea 
                            value={q.text} 
                            onChange={(e) => updateQuestion(q.id, 'text', e.target.value)}
                            placeholder="اكتب نص السؤال هنا..."
                          />
                          <div className="options-grid-edit">
                            {q.options.map((opt, oIndex) => (
                              <div key={oIndex} className={`opt-input ${q.correctIndex === oIndex ? 'correct' : ''}`}>
                                <input 
                                  type="radio" 
                                  name={`correct-${q.id}`} 
                                  checked={q.correctIndex === oIndex}
                                  onChange={() => updateQuestion(q.id, 'correctIndex', oIndex)}
                                />
                                <input 
                                  value={opt} 
                                  onChange={(e) => {
                                    const newOpts = [...q.options];
                                    newOpts[oIndex] = e.target.value;
                                    updateQuestion(q.id, 'options', newOpts);
                                  }}
                                  placeholder={`اختيار ${oIndex + 1}`}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      <button className="add-q-btn" onClick={addNewQuestion}><Plus size={16}/> إضافة سؤال جديد</button>
                    </div>
                  </div>
                ) : (
                  <div className="empty-editor-state">
                    <img src="/exam-svg.png" alt="" />
                    <p>اختر امتحان من القائمة الجانبية أو أضف امتحاناً جديداً للبدء في التعديل</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
{/* 8. نظام إضافة الكورسات المطور (Advanced Course Creator) */}
<AnimatePresence>
  {showCourseModal && (
    <motion.div 
      className="fixed-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="course-creator-modal"
        initial={{ scale: 0.9, y: 50 }}
        animate={{ scale: 1, y: 0 }}
      >
        <div className="modal-header-premium">
          <div className="header-title">
            <PlusCircle size={24} color="#3b82f6"/>
            <h2>إنشاء محتوى تعليمي جديد</h2>
          </div>
          <button className="close-modal" onClick={() => setShowCourseModal(false)}><X size={24}/></button>
        </div>

        <div className="modal-body-scrollable">
          {/* القسم الأول: التصنيف والنوع */}
          <div className="form-section">
            <h3 className="section-label">1. تصنيف المحتوى ونوع الوصول</h3>
            <div className="input-grid-3">
              <div className="input-group">
                <label>قسم المحتوى</label>
                <select 
                  value={newCourse.category} 
                  onChange={(e) => setNewCourse({...newCourse, category: e.target.value})}
                >
                  <option value="education">تعليم أكاديمي</option>
                  <option value="religious">ديني وتربوي</option>
                  <option value="programming">برمجة وتقنية</option>
                  <option value="softskills">تنمية مهارات</option>
                </select>
              </div>
              <div className="input-group">
                <label>نوع التفعيل المطلوب</label>
                <select 
                  value={newCourse.activationType} 
                  onChange={(e) => setNewCourse({...newCourse, activationType: e.target.value})}
                >
                  <option value="single">كود فردي (للكورس كاملاً)</option>
                  <option value="lecture">كود محاضرة (حصة بحصتها)</option>
                  <option value="wallet">نظام المحفظة (خصم رصيد)</option>
                </select>
              </div>
              <div className="input-group">
                <label>سعر الكورس (ج.م)</label>
                <input 
                  type="number" 
                  placeholder="0.00"
                  value={newCourse.price}
                  onChange={(e) => setNewCourse({...newCourse, price: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* القسم الثاني: بيانات المدرس والوصف */}
          <div className="form-section">
            <h3 className="section-label">2. بيانات المحاضر والتفاصيل</h3>
            <div className="input-grid-2">
              <div className="input-group">
                <label>اسم المدرس / المحاضر</label>
                <input 
                  placeholder="مثلاً: أ. محمود فرج"
                  value={newCourse.teacherName}
                  onChange={(e) => setNewCourse({...newCourse, teacherName: e.target.value})}
                />
              </div>
              <div className="input-group">
                <label>رابط صورة المدرس</label>
                <div className="image-upload-wrapper">
                  <input 
                    placeholder="رابط الصورة أو ارفع من المعرض"
                    value={newCourse.teacherImg}
                    onChange={(e) => setNewCourse({...newCourse, teacherImg: e.target.value})}
                  />
                  <button className="gallery-btn"><ImageIcon size={18}/> المعرض</button>
                </div>
              </div>
            </div>
            <div className="input-group full-width">
              <label>وصف الكورس الشامل</label>
              <textarea 
                rows="3" 
                placeholder="اكتب هنا ما سيتم دراسته في هذا الكورس..."
                value={newCourse.description}
                onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
              />
            </div>
          </div>

          {/* القسم الثالث: الوسائط والكتب */}
          <div className="form-section">
            <h3 className="section-label">3. الوسائط والمرفقات (فيديو + كتب)</h3>
            <div className="input-grid-2">
              <div className="input-group">
                <label>رابط الفيديو التعريفي (Trailer)</label>
                <div className="url-input-box">
                  <Play size={16}/>
                  <input 
                    placeholder="Youtube, Vimeo, or Bunnet Link"
                    value={newCourse.videoUrl}
                    onChange={(e) => setNewCourse({...newCourse, videoUrl: e.target.value})}
                  />
                </div>
              </div>
              <div className="input-group">
                <label>صورة غلاف الكورس (Thumbnail)</label>
                <div className="image-upload-wrapper">
                  <input 
                    placeholder="رابط غلاف الكورس"
                    value={newCourse.thumbnail}
                    onChange={(e) => setNewCourse({...newCourse, thumbnail: e.target.value})}
                  />
                  <button className="gallery-btn"><ImageIcon size={18}/></button>
                </div>
              </div>
            </div>

            <div className="books-manager">
              <div className="books-header">
                <h4><BookOpen size={18}/> الكتب والمذكرات المرفقة</h4>
                <button className="add-book-pill" onClick={addNewBookRow}><Plus size={14}/> إضافة كتاب</button>
              </div>
              {newCourse.books.map((book, bIndex) => (
                <div key={bIndex} className="book-row-input">
                  <input 
                    placeholder="اسم الكتاب"
                    value={book.name}
                    onChange={(e) => updateBookData(bIndex, 'name', e.target.value)}
                  />
                  <input 
                    placeholder="رابط PDF"
                    value={book.url}
                    onChange={(e) => updateBookData(bIndex, 'url', e.target.value)}
                  />
                  <button onClick={() => removeBookRow(bIndex)}><Trash2 size={16}/></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer-actions">
          <div className="status-indicator">
            <div className="pulse-dot"></div>
            <span>سيتم النشر فوراً لجميع الطلاب</span>
          </div>
          <div className="btns">
            <button className="cancel-btn" onClick={() => setShowCourseModal(false)}>إلغاء</button>
            <button className="confirm-btn" onClick={submitNewCourse}>
              {isProcessing ? 'جاري الرفع...' : <><Zap size={18}/> تفعيل ونشر الكورس</>}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

{/* 11. نظام الإشعارات الجماعية */}
{activeTab === 'notifications' && (
  <motion.div key="notifications" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="tab-content">
    <div className="glass-panel broadcast-manager">
      <div className="panel-header">
        <h3><Bell size={20} color="#f59e0b"/> إرسال إشعار عام للطلاب</h3>
        <p>سيظهر هذا الإشعار لجميع الطلاب المسجلين فوراً.</p>
      </div>
      <div className="broadcast-form">
        <div className="form-group">
          <label>عنوان التنبيه</label>
          <input 
            placeholder="مثال: تحديث جديد"
            onChange={(e) => setBroadcast({...broadcast, title: e.target.value})}
          />
        </div>
        <div className="form-group">
          <label>نص الرسالة</label>
          <textarea 
            rows="4" 
            placeholder="اكتب تفاصيل التنبيه..."
            onChange={(e) => setBroadcast({...broadcast, message: e.target.value})}
          />
        </div>
        <button className="send-broadcast-btn" onClick={handleSendBroadcast}>
          <Zap size={18}/> إرسال الإشعار الآن
        </button>
      </div>
    </div>
  </motion.div>
)}

{/* 12. مركز التحكم في الحماية */}
{activeTab === 'security' && (
  <motion.div key="security" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="tab-content">
    <div className="security-grid">
      <div className="glass-panel security-toggle-card">
        <div className="toggle-info">
          <h4><ShieldCheck size={20} color="#10b981"/> حماية تسجيل الشاشة</h4>
          <p>منع الطلاب من تصوير الشاشة.</p>
        </div>
        <div className="toggle-switch active"></div>
      </div>
      <div className="glass-panel security-toggle-card">
        <div className="toggle-info">
          <h4><Smartphone size={20} color="#3b82f6"/> قفل الجهاز الواحد</h4>
          <p>إجبار الطالب على جهاز واحد فقط.</p>
        </div>
        <div className="toggle-switch active"></div>
      </div>
    </div>
    <div className="glass-panel banned-users-list">
       <h3>قائمة الطلاب المحظورين</h3>
       <table className="tito-table">
          <thead>
            <tr><th>الطالب</th><th>السبب</th><th>الإجراء</th></tr>
          </thead>
          <tbody>
            {users.filter(u => u.isBanned).map(bUser => (
              <tr key={bUser.id}>
                <td>{bUser.name}</td>
                <td><span className="reason-pill">محاولة غش</span></td>
                <td><button className="unban-btn">إلغاء الحظر</button></td>
              </tr>
            ))}
          </tbody>
       </table>
    </div>
  </motion.div>
)}

{/* 13. قسم التقارير المالية */}
{activeTab === 'finance' && (
  <motion.div key="finance" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="tab-content">
    <div className="finance-summary-row">
      <div className="f-card">
        <span>صافي أرباح الشهر</span>
        <h3>{(calculateNetProfit * 0.9).toLocaleString()} ج.م</h3>
      </div>
    </div>
    <div className="glass-panel transaction-history">
      <h3>سجل المعاملات</h3>
      <table className="tito-table">
        <tbody>
          <tr><td>#TX9901</td><td>ياسين علي</td><td>150 ج.م</td><td><span className="status-ok">ناجحة</span></td></tr>
        </tbody>
      </table>
    </div>
  </motion.div>
)}
{/* 9. نظام تفعيل الأكواد الذكي (Logic Handler) */}
      {/* ملاحظة: هذا الجزء عبارة عن المنطق البرمجي الذي يتم استدعاؤه عند الضغط على أزرار التفعيل */}
      
      {/* 10. تذييل لوحة التحكم (Dashboard Footer) */}
      <footer className="admin-footer-copyrights">
        <div className="footer-content">
          <div className="copy-text">
            <span>حقوق الإدارة محفوظة © 2024</span>
            <strong> تيتو أكاديمي - نظام الإدارة المتكامل</strong>
          </div>
          <div className="system-status-pills">
            <span className="pill shadow-sm">إصدار النظام v4.2.0</span>
            <span className="pill shadow-sm">
              خادم البيانات: متصل 
              <div className="online-indicator"></div>
            </span>
          </div>
        </div>
      </footer>

    </div> {/* إغلاق dashboard-content */}
  </main> {/* إغلاق main-layout */}
</div> /* إغلاق admin-root-container */
  );
};

// --- الدوال المساعدة (Helper Functions) ---
// يتم تعريفها هنا لتنظيم الكود أو استدعاؤها من ملفات خارجية

const handleUnbanUser = async (userId) => {
  try {
    console.log("جاري إلغاء حظر الطالب:", userId);
    // هنا يوضع كود Firebase: updateDoc(doc(db, "users", userId), { isBanned: false });
  } catch (error) {
    console.error("فشل في إلغاء الحظر:", error);
  }
};

// تصدير المكون النهائي
export default AdminDash;

