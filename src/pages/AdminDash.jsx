import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, BookOpen, FileText, Bell, ShieldCheck, Smartphone, 
  DollarSign, Settings, Plus, Trash2, Save, X, Zap, Search, 
  Download, Star, ImageIcon, Play, PlusCircle, FileText as FileIcon,
  CheckCircle, AlertCircle, Menu, LogOut, Layout, UserPlus, HelpCircle
} from 'lucide-react';

const AdminDash = () => {
  // --- 1. SETTINGS & STATES (الحالات والمؤشرات) ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusNotification, setStatusNotification] = useState(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  
  // بيانات الأنظمة المختلفة
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [exams, setExams] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  
  // حالات نظام الامتحانات
  const [selectedExam, setSelectedExam] = useState(null);
  const [newExamMode, setNewExamMode] = useState(false);
  const [examForm, setExamForm] = useState({
    title: '',
    timeLimit: 30,
    questions: [
      { id: Date.now(), text: '', options: ['', '', '', ''], correctIndex: 0 }
    ]
  });

  // حالات نظام الكورسات المطور
  const [newCourse, setNewCourse] = useState({
    title: '',
    price: '',
    category: 'education',
    activationType: 'single',
    teacherName: '',
    teacherImg: '',
    description: '',
    videoUrl: '',
    thumbnail: '',
    books: []
  });

  // حالات الإشعارات والجوانب المالية
  const [broadcast, setBroadcast] = useState({ title: '', message: '' });
  const calculateNetProfit = useMemo(() => users.length * 150, [users]);

  // --- 2. LOGIC HANDLERS (إدارة العمليات) ---
  const triggerToast = (message, type) => {
    setStatusNotification({ message, type });
    setTimeout(() => setStatusNotification(null), 3000);
  };

  const addNewQuestion = () => {
    const newQ = { id: Date.now(), text: '', options: ['', '', '', ''], correctIndex: 0 };
    setExamForm({ ...examForm, questions: [...examForm.questions, newQ] });
  };

  const updateQuestion = (id, field, value) => {
    const updated = examForm.questions.map(q => q.id === id ? { ...q, [field]: value } : q);
    setExamForm({ ...examForm, questions: updated });
  };

  const removeQuestion = (id) => {
    setExamForm({ ...examForm, questions: examForm.questions.filter(q => q.id !== id) });
  };

  const addNewBookRow = () => {
    setNewCourse({ ...newCourse, books: [...newCourse.books, { name: '', url: '' }] });
  };

  const updateBookData = (index, field, value) => {
    const updatedBooks = [...newCourse.books];
    updatedBooks[index][field] = value;
    setNewCourse({ ...newCourse, books: updatedBooks });
  };

  const removeBookRow = (index) => {
    setNewCourse({ ...newCourse, books: newCourse.books.filter((_, i) => i !== index) });
  };

  const handleSaveExam = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      triggerToast("تم حفظ التعديلات في بنك الأسئلة بنجاح", "success");
    }, 1500);
  };

  const handleSendBroadcast = () => {
    if(!broadcast.title || !broadcast.message) return triggerToast("برجاء ملء بيانات الإشعار", "error");
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      triggerToast("تم بث الإشعار لجميع الأجهزة النشطة", "success");
    }, 2000);
  };

  const submitNewCourse = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setShowCourseModal(false);
      triggerToast("تم نشر الكورس وتفعيل أنظمة الدفع", "success");
    }, 2500);
  };

  // --- 3. UI RENDER (واجهة المستخدم) ---
  return (
    <div className="admin-root-container" dir="rtl">
      
      {/* Sidebar - القائمة الجانبية كاملة */}
      <aside className="admin-sidebar">
        <div className="admin-logo-section">
          <div className="logo-premium">T</div>
          <div className="logo-text">
            <h3>تيتو أكاديمي</h3>
            <span>لوحة التحكم v4.2</span>
          </div>
        </div>
        <nav className="admin-nav-menu">
          <button className={activeTab === 'dashboard' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('dashboard')}><Layout size={20}/> الإحصائيات</button>
          <button className={activeTab === 'courses' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('courses')}><BookOpen size={20}/> الكورسات</button>
          <button className={activeTab === 'exams' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('exams')}><FileIcon size={20}/> الامتحانات</button>
          <button className={activeTab === 'notifications' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('notifications')}><Bell size={20}/> الإشعارات</button>
          <button className={activeTab === 'security' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('security')}><ShieldIcon size={20}/> الأمان</button>
          <button className={activeTab === 'finance' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('finance')}><DollarSign size={20}/> المالية</button>
          <button className={activeTab === 'logs' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('logs')}><Settings size={20}/> السجل الأمني</button>
        </nav>
      </aside>

      <main className="main-layout">
        <header className="admin-top-header">
           <div className="header-search">
              <Search size={18}/>
              <input type="text" placeholder="بحث سريع عن طالب، كورس، أو عملية ماليّة..." />
           </div>
           <div className="header-actions">
              <div className="admin-info-pill">
                 <div className="online-status"></div>
                 <span>المدير المسؤول: تيتو</span>
              </div>
              <button className="logout-btn"><LogOut size={18}/></button>
           </div>
        </header>

        <div className="dashboard-content">
          <AnimatePresence mode="wait">

            {/* 1. DASHBOARD OVERVIEW (الإحصائيات) */}
            {activeTab === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="tab-content">
                <div className="stats-cards-row">
                  <div className="glass-card stat-item">
                    <div className="icon-box purple"><Users size={24}/></div>
                    <div className="data"><h4>{users.length}</h4><p>إجمالي الطلاب</p></div>
                  </div>
                  <div className="glass-card stat-item">
                    <div className="icon-box blue"><BookOpen size={24}/></div>
                    <div className="data"><h4>{courses.length}</h4><p>الكورسات النشطة</p></div>
                  </div>
                  <div className="glass-card stat-item">
                    <div className="icon-box green"><DollarSign size={24}/></div>
                    <div className="data"><h4>{calculateNetProfit} ج.م</h4><p>أرباح الشهر</p></div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 2. COURSES MANAGEMENT (إدارة المنهج الدراسي) */}
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
                        <button className="edit-btn"><Settings size={16}/> تعديل</button>
                        <button className="delete-btn"><Trash2 size={16}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 3. EXAMS BANK (نظام الامتحانات التفاعلي) */}
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
                          <div className="exam-icon-box"><FileIcon size={18}/></div>
                          <div className="exam-info">
                            <strong>{exam.title}</strong>
                            <span>{exam.questions?.length || 0} سؤال - {exam.timeLimit} دقيقة</span>
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
                        <p>اختر امتحان من القائمة الجانبية أو أضف امتحاناً جديداً للبدء في التعديل</p>
                      </div>
                    )}
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
                      {auditLogs.length > 0 ? auditLogs.map(log => (
                        <tr key={log.id} className={`severity-${log.severity}`}>
                          <td>{log.admin}</td>
                          <td>{log.details}</td>
                          <td>{log.timestamp?.toDate().toLocaleString('ar-EG')}</td>
                          <td><span className="sev-pill">{log.severity}</span></td>
                        </tr>
                      )) : (
                        <tr><td colSpan="4" style={{textAlign: 'center', padding: '20px'}}>لا توجد سجلات حالياً</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* 11. BROADCAST NOTIFICATIONS (نظام الإشعارات الجماعية) */}
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
                        placeholder="مثال: تحديث جديد في المنهج"
                        onChange={(e) => setBroadcast({...broadcast, title: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>نص الرسالة</label>
                      <textarea 
                        rows="4" 
                        placeholder="اكتب تفاصيل التنبيه هنا..."
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

            {/* 12. SECURITY CONTROL (مركز التحكم في الحماية) */}
            {activeTab === 'security' && (
              <motion.div key="security" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="tab-content">
                <div className="security-grid">
                  <div className="glass-panel security-toggle-card">
                    <div className="toggle-info">
                      <h4><ShieldIcon size={20} color="#10b981"/> حماية تسجيل الشاشة</h4>
                      <p>منع الطلاب من تصوير الشاشة أو تسجيل المحاضرات.</p>
                    </div>
                    <div className="toggle-switch active"></div>
                  </div>
                  <div className="glass-panel security-toggle-card">
                    <div className="toggle-info">
                      <h4><Smartphone size={20} color="#3b82f6"/> قفل الجهاز الواحد</h4>
                      <p>منع فتح الحساب من أكثر من جهاز في نفس الوقت.</p>
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

            {/* 13. FINANCE (قسم التقارير المالية) */}
            {activeTab === 'finance' && (
              <motion.div key="finance" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="tab-content">
                <div className="finance-summary-row">
                  <div className="f-card">
                    <span>صافي أرباح الشهر (بعد الضرائب)</span>
                    <h3>{(calculateNetProfit * 0.9).toLocaleString()} ج.م</h3>
                  </div>
                </div>
                <div className="glass-panel transaction-history">
                  <h3>سجل المعاملات المالية</h3>
                  <table className="tito-table">
                    <thead>
                      <tr><th>رقم العملية</th><th>الطالب</th><th>المبلغ</th><th>الحالة</th></tr>
                    </thead>
                    <tbody>
                      <tr><td>#TX9901</td><td>ياسين علي</td><td>150 ج.م</td><td><span className="status-ok">ناجحة</span></td></tr>
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* 8. COURSE CREATOR MODAL (نظام إضافة الكورسات المطور) */}
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
                <div className="form-section">
                  <h3 className="section-label">1. تصنيف المحتوى ونوع الوصول</h3>
                  <div className="input-grid-3">
                    <div className="input-group">
                      <label>قسم المحتوى</label>
                      <select value={newCourse.category} onChange={(e) => setNewCourse({...newCourse, category: e.target.value})}>
                        <option value="education">تعليم أكاديمي</option>
                        <option value="religious">ديني وتربوي</option>
                        <option value="programming">برمجة وتقنية</option>
                        <option value="softskills">تنمية مهارات</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <label>نوع التفعيل المطلوب</label>
                      <select value={newCourse.activationType} onChange={(e) => setNewCourse({...newCourse, activationType: e.target.value})}>
                        <option value="single">كود فردي (للكورس كاملاً)</option>
                        <option value="lecture">كود محاضرة (حصة بحصتها)</option>
                        <option value="wallet">نظام المحفظة (خصم رصيد)</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <label>سعر الكورس (ج.م)</label>
                      <input type="number" placeholder="0.00" value={newCourse.price} onChange={(e) => setNewCourse({...newCourse, price: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3 className="section-label">2. بيانات المحاضر والتفاصيل</h3>
                  <div className="input-grid-2">
                    <div className="input-group">
                      <label>اسم المدرس / المحاضر</label>
                      <input placeholder="مثلاً: أ. محمود فرج" value={newCourse.teacherName} onChange={(e) => setNewCourse({...newCourse, teacherName: e.target.value})} />
                    </div>
                    <div className="input-group">
                      <label>رابط صورة المدرس</label>
                      <div className="image-upload-wrapper">
                        <input placeholder="رابط الصورة من السحابة" value={newCourse.teacherImg} onChange={(e) => setNewCourse({...newCourse, teacherImg: e.target.value})} />
                        <button className="gallery-btn"><ImageIcon size={18}/> المعرض</button>
                      </div>
                    </div>
                  </div>
                  <div className="input-group full-width">
                    <label>وصف الكورس الشامل</label>
                    <textarea rows="3" placeholder="اكتب هنا ما سيتم دراسته..." value={newCourse.description} onChange={(e) => setNewCourse({...newCourse, description: e.target.value})} />
                  </div>
                </div>

                <div className="form-section">
                  <h3 className="section-label">3. الوسائط والمرفقات (فيديو + كتب)</h3>
                  <div className="input-grid-2">
                    <div className="input-group">
                      <label>رابط الفيديو التعريفي (Trailer)</label>
                      <div className="url-input-box">
                        <Play size={16}/>
                        <input placeholder="Youtube or Bunnet Link" value={newCourse.videoUrl} onChange={(e) => setNewCourse({...newCourse, videoUrl: e.target.value})} />
                      </div>
                    </div>
                    <div className="input-group">
                      <label>صورة غلاف الكورس (Thumbnail)</label>
                      <div className="image-upload-wrapper">
                        <input placeholder="رابط غلاف الكورس" value={newCourse.thumbnail} onChange={(e) => setNewCourse({...newCourse, thumbnail: e.target.value})} />
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
                        <input placeholder="اسم الكتاب" value={book.name} onChange={(e) => updateBookData(bIndex, 'name', e.target.value)} />
                        <input placeholder="رابط PDF" value={book.url} onChange={(e) => updateBookData(bIndex, 'url', e.target.value)} />
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

      {/* 9. OVERLAYS & TOASTS (التنبيهات ومعالج البيانات) */}
      <AnimatePresence>
        {statusNotification && (
          <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }} className={`tito-toast ${statusNotification.type}`}>
             {statusNotification.type === 'success' ? <CheckCircle size={18}/> : <AlertCircle size={18}/>}
             {statusNotification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {isProcessing && (
        <div className="global-overlay">
           <div className="loader-v2"></div>
           <p>جاري التنفيذ وتحديث السحابة...</p>
        </div>
      )}

      {/* 10. DASHBOARD FOOTER (تذييل لوحة التحكم) */}
      <footer className="admin-footer-copyrights">
        <div className="footer-content">
          <div className="copy-text">
            <span>حقوق الإدارة محفوظة © 2024</span>
            <strong> تيتو أكاديمي - نظام الإدارة المتكامل</strong>
          </div>
          <div className="system-status-pills">
            <span className="pill shadow-sm">إصدار النظام v4.2.0</span>
            <span className="pill shadow-sm">خادم البيانات: متصل <div className="online-indicator"></div></span>
</div>
        </div>
      </footer>

      {/* 14. نظام إدارة أكواد التفعيل (Advanced Coupon System) */}
      <AnimatePresence>
        {activeTab === 'coupons' && (
          <motion.div 
            key="coupons" 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="tab-content"
          >
            <div className="coupon-dashboard-layout">
              <div className="glass-panel coupon-generator-card">
                <div className="panel-header">
                  <h3><Zap size={20} color="#8b5cf6"/> توليد أكواد تفعيل ذكية</h3>
                  <p>إنشاء كميات ضخمة من الأكواد المخصصة لكورسات أو باقات معينة.</p>
                </div>
                
                <div className="generator-form-grid">
                  <div className="input-group">
                    <label>الكمية المطلوب إنشاؤها</label>
                    <input type="number" placeholder="مثال: 100 كود" />
                  </div>
                  <div className="input-group">
                    <label>قيمة الكود (الرصيد)</label>
                    <input type="number" placeholder="150 ج.م" />
                  </div>
                  <div className="input-group">
                    <label>مرتبط بكورس محدد؟</label>
                    <select>
                      <option>عام (شحن رصيد محفظة)</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>تاريخ انتهاء الصلاحية</label>
                    <input type="date" />
                  </div>
                  <button className="generate-now-btn" onClick={() => setIsProcessing(true)}>
                    <Plus size={18}/> توليد الأكواد وتصديرها PDF
                  </button>
                </div>
              </div>

              <div className="glass-panel coupons-stats-grid">
                <div className="mini-stat">
                  <span>أكواد مستخدمة</span>
                  <h4>1,240</h4>
                </div>
                <div className="mini-stat">
                  <span>أكواد معلقة</span>
                  <h4>450</h4>
                </div>
                <div className="mini-stat">
                  <span>إجمالي القيمة الموزعة</span>
                  <h4>85,000 ج.م</h4>
                </div>
              </div>

              <div className="glass-panel coupons-table-container">
                <div className="table-controls">
                  <h4>آخر الأكواد المستخرجة</h4>
                  <div className="search-mini">
                    <Search size={14}/>
                    <input placeholder="ابحث عن كود محدد..." />
                  </div>
                </div>
                <table className="tito-table v2">
                  <thead>
                    <tr>
                      <th>الكود</th>
                      <th>النوع</th>
                      <th>الحالة</th>
                      <th>بواسطة</th>
                      <th>التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code className="coupon-code">TITO-XXXX-99</code></td>
                      <td>كورس كامل</td>
                      <td><span className="status-badge used">مستخدم</span></td>
                      <td>ياسين علي</td>
                      <td>2024/05/12</td>
                    </tr>
                    <tr>
                      <td><code className="coupon-code">TITO-XXXX-88</code></td>
                      <td>رصيد محفظة</td>
                      <td><span className="status-badge active">نشط</span></td>
                      <td>--</td>
                      <td>2024/05/15</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 15. مركز تحليل سلوك الطلاب (Student Analytics Hub) */}
      <AnimatePresence>
        {activeTab === 'analytics' && (
          <motion.div 
            key="analytics" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="tab-content"
          >
            <div className="analytics-header-row">
              <div className="glass-panel insight-card">
                <div className="insight-icon"><Users size={24}/></div>
                <div className="insight-data">
                  <span>معدل النشاط اليومي</span>
                  <h3>85%</h3>
                  <p className="trend-up">+12% عن الشهر الماضي</p>
                </div>
              </div>
              <div className="glass-panel insight-card">
                <div className="insight-icon"><Play size={24}/></div>
                <div className="insight-data">
                  <span>ساعات المشاهدة الكلية</span>
                  <h3>14,500 ساعة</h3>
                  <p className="trend-up">+5.2% معدل نمو</p>
                </div>
              </div>
              <div className="glass-panel insight-card">
                <div className="insight-icon"><HelpCircle size={24}/></div>
                <div className="insight-data">
                  <span>متوسط درجات الاختبارات</span>
                  <h3>78/100</h3>
                  <p className="trend-down">-2% تراجع طفيف</p>
                </div>
              </div>
            </div>

            <div className="analytics-charts-grid">
              <div className="glass-panel chart-placeholder-box">
                <div className="chart-header">
                  <h4>توزيع الطلاب حسب المحافظات</h4>
                  <Download size={16}/>
                </div>
                {/* هنا يتم ربط مكتبة Recharts أو Chart.js */}
                <div className="map-visual-placeholder">
                  <div className="region-bar" style={{width: '90%'}}><span>القاهرة</span><span>40%</span></div>
                  <div className="region-bar" style={{width: '60%'}}><span>الإسكندرية</span><span>25%</span></div>
                  <div className="region-bar" style={{width: '40%'}}><span>المنصورة</span><span>15%</span></div>
                  <div className="region-bar" style={{width: '30%'}}><span>أخرى</span><span>20%</span></div>
                </div>
              </div>

              <div className="glass-panel top-performing-students">
                <h4>أوائل المنصة (الأعلى تفاعلاً)</h4>
                <div className="top-students-list">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="top-student-row">
                      <div className="rank">#{i}</div>
                      <div className="student-pfp"></div>
                      <div className="student-info">
                        <strong>طالب رقم {i}</strong>
                        <span>أتمّ 12 كورس بنجاح</span>
                      </div>
                      <div className="score">99.2%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      </div>
        </div>
      </footer>

      {/* 14. نظام إدارة أكواد التفعيل (Advanced Coupon System) */}
      <AnimatePresence>
        {activeTab === 'coupons' && (
          <motion.div 
            key="coupons" 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="tab-content"
          >
            <div className="coupon-dashboard-layout">
              <div className="glass-panel coupon-generator-card">
                <div className="panel-header">
                  <h3><Zap size={20} color="#8b5cf6"/> توليد أكواد تفعيل ذكية</h3>
                  <p>إنشاء كميات ضخمة من الأكواد المخصصة لكورسات أو باقات معينة.</p>
                </div>
                
                <div className="generator-form-grid">
                  <div className="input-group">
                    <label>الكمية المطلوب إنشاؤها</label>
                    <input type="number" placeholder="مثال: 100 كود" />
                  </div>
                  <div className="input-group">
                    <label>قيمة الكود (الرصيد)</label>
                    <input type="number" placeholder="150 ج.م" />
                  </div>
                  <div className="input-group">
                    <label>مرتبط بكورس محدد؟</label>
                    <select>
                      <option>عام (شحن رصيد محفظة)</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>تاريخ انتهاء الصلاحية</label>
                    <input type="date" />
                  </div>
                  <button className="generate-now-btn" onClick={() => setIsProcessing(true)}>
                    <Plus size={18}/> توليد الأكواد وتصديرها PDF
                  </button>
                </div>
              </div>

              <div className="glass-panel coupons-stats-grid">
                <div className="mini-stat">
                  <span>أكواد مستخدمة</span>
                  <h4>1,240</h4>
                </div>
                <div className="mini-stat">
                  <span>أكواد معلقة</span>
                  <h4>450</h4>
                </div>
                <div className="mini-stat">
                  <span>إجمالي القيمة الموزعة</span>
                  <h4>85,000 ج.م</h4>
                </div>
              </div>

              <div className="glass-panel coupons-table-container">
                <div className="table-controls">
                  <h4>آخر الأكواد المستخرجة</h4>
                  <div className="search-mini">
                    <Search size={14}/>
                    <input placeholder="ابحث عن كود محدد..." />
                  </div>
                </div>
                <table className="tito-table v2">
                  <thead>
                    <tr>
                      <th>الكود</th>
                      <th>النوع</th>
                      <th>الحالة</th>
                      <th>بواسطة</th>
                      <th>التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code className="coupon-code">TITO-XXXX-99</code></td>
                      <td>كورس كامل</td>
                      <td><span className="status-badge used">مستخدم</span></td>
                      <td>ياسين علي</td>
                      <td>2024/05/12</td>
                    </tr>
                    <tr>
                      <td><code className="coupon-code">TITO-XXXX-88</code></td>
                      <td>رصيد محفظة</td>
                      <td><span className="status-badge active">نشط</span></td>
                      <td>--</td>
                      <td>2024/05/15</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 15. مركز تحليل سلوك الطلاب (Student Analytics Hub) */}
      <AnimatePresence>
        {activeTab === 'analytics' && (
          <motion.div 
            key="analytics" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="tab-content"
          >
            <div className="analytics-header-row">
              <div className="glass-panel insight-card">
                <div className="insight-icon"><Users size={24}/></div>
                <div className="insight-data">
                  <span>معدل النشاط اليومي</span>
                  <h3>85%</h3>
                  <p className="trend-up">+12% عن الشهر الماضي</p>
                </div>
              </div>
              <div className="glass-panel insight-card">
                <div className="insight-icon"><Play size={24}/></div>
                <div className="insight-data">
                  <span>ساعات المشاهدة الكلية</span>
                  <h3>14,500 ساعة</h3>
                  <p className="trend-up">+5.2% معدل نمو</p>
                </div>
              </div>
              <div className="glass-panel insight-card">
                <div className="insight-icon"><HelpCircle size={24}/></div>
                <div className="insight-data">
                  <span>متوسط درجات الاختبارات</span>
                  <h3>78/100</h3>
                  <p className="trend-down">-2% تراجع طفيف</p>
                </div>
              </div>
            </div>

            <div className="analytics-charts-grid">
              <div className="glass-panel chart-placeholder-box">
                <div className="chart-header">
                  <h4>توزيع الطلاب حسب المحافظات</h4>
                  <Download size={16}/>
                </div>
                {/* هنا يتم ربط مكتبة Recharts أو Chart.js */}
                <div className="map-visual-placeholder">
                  <div className="region-bar" style={{width: '90%'}}><span>القاهرة</span><span>40%</span></div>
                  <div className="region-bar" style={{width: '60%'}}><span>الإسكندرية</span><span>25%</span></div>
                  <div className="region-bar" style={{width: '40%'}}><span>المنصورة</span><span>15%</span></div>
                  <div className="region-bar" style={{width: '30%'}}><span>أخرى</span><span>20%</span></div>
                </div>
              </div>

              <div className="glass-panel top-performing-students">
                <h4>أوائل المنصة (الأعلى تفاعلاً)</h4>
                <div className="top-students-list">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="top-student-row">
                      <div className="rank">#{i}</div>
                      <div className="student-pfp"></div>
                      <div className="student-info">
                        <strong>طالب رقم {i}</strong>
                        <span>أتمّ 12 كورس بنجاح</span>
                      </div>
                      <div className="score">99.2%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

  {/* 20. نظام إدارة صلاحيات الطاقم الإداري (RBAC - Role Based Access Control) */}
      <AnimatePresence>
        {activeTab === 'permissions' && (
          <motion.div 
            key="permissions" 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="tab-content"
          >
            <div className="permissions-manager-layout">
              <div className="glass-panel admins-list-panel">
                <div className="panel-header">
                  <h3><Users size={20} color="#6366f1"/> مديري النظام والمشرفين</h3>
                  <button className="add-admin-btn" onClick={() => triggerToast("فتح نافذة إضافة مشرف جديد", "info")}>
                    <UserPlus size={18}/> إضافة مسؤول
                  </button>
                </div>
                <div className="admins-grid">
                  {[
                    { name: 'أحمد كمال', role: 'مشرف مالي', color: '#10b981' },
                    { name: 'سارة محمد', role: 'محرر محتوى', color: '#3b82f6' },
                    { name: 'خالد علي', role: 'دعم فني', color: '#f59e0b' }
                  ].map((admin, idx) => (
                    <div key={idx} className="admin-permission-card">
                      <div className="admin-avatar-box" style={{ backgroundColor: admin.color }}>{admin.name[0]}</div>
                      <div className="admin-info">
                        <strong>{admin.name}</strong>
                        <span className="role-tag">{admin.role}</span>
                      </div>
                      <button className="settings-mini-btn"><Settings size={14}/></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-panel roles-config-panel">
                <h4>تخصيص صلاحيات الرتبة المختارة</h4>
                <div className="permissions-checklist">
                  <div className="check-item disabled">
                    <input type="checkbox" checked readOnly />
                    <label>دخول لوحة التحكم (أساسي)</label>
                  </div>
                  <div className="check-item">
                    <input type="checkbox" id="p1" />
                    <label htmlFor="p1">إدارة الطلاب وحذف الحسابات</label>
                  </div>
                  <div className="check-item">
                    <input type="checkbox" id="p2" />
                    <label htmlFor="p2">الاطلاع على التقارير المالية والأرباح</label>
                  </div>
                  <div className="check-item">
                    <input type="checkbox" id="p3" />
                    <label htmlFor="p3">تعديل محتوى الكورسات والأسئلة</label>
                  </div>
                  <div className="check-item">
                    <input type="checkbox" id="p4" />
                    <label htmlFor="p4">بث الإشعارات الجماعية</label>
                  </div>
                  <div className="check-item">
                    <input type="checkbox" id="p5" />
                    <label htmlFor="p5">التحكم في إعدادات الأمان (حظر الأجهزة)</label>
                  </div>
                </div>
                <button className="save-permissions-btn"><Save size={18}/> حفظ الصلاحيات</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 21. نظام إعدادات المنصة والهوية البصرية (Platform Branding & Global Settings) */}
      <AnimatePresence>
        {activeTab === 'platform_settings' && (
          <motion.div 
            key="platform_settings" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="tab-content"
          >
            <div className="branding-settings-grid">
              <div className="glass-panel visual-identity">
                <h4><ImageIcon size={18}/> الهوية البصرية وشعار الأكاديمية</h4>
                <div className="logo-upload-zone">
                  <div className="current-logo-preview">T</div>
                  <div className="upload-controls">
                    <button className="upload-btn">تغيير الشعار (Logo)</button>
                    <button className="upload-btn secondary">تغيير الأيقونة (Favicon)</button>
                  </div>
                </div>
                <div className="color-picker-group">
                  <label>اللون الرئيسي للمنصة</label>
                  <div className="picker-row">
                    <input type="color" defaultValue="#3b82f6" />
                    <span>#3b82f6</span>
                  </div>
                </div>
              </div>

              <div className="glass-panel api-integrations">
                <h4><Zap size={18}/> ربط الخدمات الخارجية (APIs)</h4>
                <div className="api-form">
                  <div className="input-group">
                    <label>رابط خادم الفيديوهات (BunnyCDN/Vimeo)</label>
                    <input type="text" placeholder="https://video-api.provider.com/..." />
                  </div>
                  <div className="input-group">
                    <label>مفتاح بوابة الرسائل (SMS Gateway Key)</label>
                    <input type="password" value="************************" readOnly />
                  </div>
                  <div className="input-group">
                    <label>بوابة الدفع الإلكتروني (Paymob/Fawry)</label>
                    <select>
                      <option>نشط: فوري (Fawry Pay)</option>
                      <option>بيموب (Paymob)</option>
                      <option>كاش (Wallet Pay)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="glass-panel maintenance-mode-card">
                 <div className="status-header">
                    <div className="icon"><AlertCircle size={20} color="#ef4444"/></div>
                    <h4>وضع الصيانة العام</h4>
                 </div>
                 <p>تفعيل هذا الخيار سيغلق التطبيق والموقع أمام الطلاب مع إظهار رسالة "نحن في صيانة حالياً".</p>
                 <div className="danger-toggle">
                    <span>إغلاق المنصة مؤقتاً</span>
                    <div className="toggle-switch"></div>
                 </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 22. نظام الأرشفة الذكية والنسخ الاحتياطي (Auto Backup & Database Archiving) */}
      <AnimatePresence>
        {activeTab === 'backup' && (
          <motion.div 
            key="backup" 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="tab-content"
          >
            <div className="backup-manager-container glass-panel">
              <div className="backup-hero">
                <div className="backup-icon-anim"><Download size={40} color="#10b981"/></div>
                <h3>مركز تأمين البيانات</h3>
                <p>آخر نسخة احتياطية سحابية تم أخذها: <strong>اليوم الساعة 03:00 ص</strong></p>
              </div>
              
              <div className="backup-actions-row">
                <button className="action-card" onClick={() => setIsProcessing(true)}>
                  <Download size={24}/>
                  <span>تحميل نسخة SQL كاملة</span>
                </button>
                <button className="action-card" onClick={() => setIsProcessing(true)}>
                  <Users size={24}/>
                  <span>نسخ بيانات الطلاب فقط (CSV)</span>
                </button>
                <button className="action-card highlight">
                  <Zap size={24}/>
                  <span>بدء نسخة احتياطية الآن</span>
                </button>
              </div>

              <div className="backup-history">
                <h4>تاريخ النسخ الاحتياطية السابقة</h4>
                <div className="history-list">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="history-item">
                      <div className="h-info">
                        <strong>Backup_v4.2.0_2024_05_0{i}.zip</strong>
                        <span>الحجم: 145 MB • التوقيت: 12:00 م</span>
                      </div>
                      <button className="restore-btn">استعادة (Restore)</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

  {/* 23. نظام إنشاء شهادات التقدير (Certificate Builder) */}
      <AnimatePresence>
        {activeTab === 'certificates' && (
          <motion.div key="certificates" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="tab-content">
            <div className="certificate-manager glass-panel">
              <div className="panel-header">
                <h3><Star size={20} color="#eab308"/> نظام الشهادات الآلي</h3>
                <button className="add-btn-main"><Plus size={16}/> تصميم نموذج جديد</button>
              </div>
              <div className="cert-builder-layout">
                <div className="cert-preview-zone">
                  <div className="cert-template-mockup">
                    <div className="cert-header">شهادة إتمام دورة تعليمية</div>
                    <div className="cert-body">
                      <p>تشهد أكاديمية تيتو بأن الطالب:</p>
                      <h2 className="placeholder-name">[اسم الطالب يظهر هنا]</h2>
                      <p>قد اجتاز بنجاح كورس: <strong>الفيزياء الحديثة</strong></p>
                      <p>بتقدير عام: <strong>امتياز</strong></p>
                    </div>
                    <div className="cert-footer">ختم الأكاديمية الرسمي</div>
                  </div>
                </div>
                <div className="cert-settings-side">
                  <h4>إعدادات الشهادة</h4>
                  <div className="input-group">
                    <label>الحد الأدنى للدرجة لاستحقاق الشهادة (%)</label>
                    <input type="number" defaultValue="85" />
                  </div>
                  <div className="toggle-group">
                    <span>إرسال الشهادة تلقائياً للبريد</span>
                    <div className="toggle-switch active"></div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 24. نظام المتجر الداخلي والطلبات (Internal Store & Logistics) */}
      <AnimatePresence>
        {activeTab === 'store' && (
          <motion.div key="store" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="tab-content">
            <div className="store-management-grid">
              <div className="glass-panel products-list">
                <div className="panel-header">
                  <h3><BookIcon size={20}/> الكتب والمذكرات المطبوعة</h3>
                  <button className="mini-add-btn"><Plus size={14}/></button>
                </div>
                <div className="products-scroll-area">
                  {[1, 2, 3].map(p => (
                    <div key={p} className="product-item-admin">
                      <div className="p-img"></div>
                      <div className="p-info">
                        <strong>مذكرة المراجعة النهائية - كيمياء</strong>
                        <span>السعر: 85 ج.م • المخزون: 120 قطعة</span>
                      </div>
                      <button className="edit-btn"><Settings size={14}/></button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass-panel orders-tracking">
                <h4>طلبات الشحن الجديدة</h4>
                <div className="orders-list">
                  <div className="order-row-new">
                    <div className="order-user">أحمد صبحي - المنصورة</div>
                    <div className="order-status">جاري التجهيز</div>
                    <button className="track-btn">تفاصيل الشحن</button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 25. نظام إدارة الإعلانات والبنرات (Ad Manager) */}
      <AnimatePresence>
        {activeTab === 'ads' && (
          <motion.div key="ads" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="tab-content">
            <div className="ads-manager-container glass-panel">
              <div className="panel-header">
                <h3><ImageIcon size={20} color="#ec4899"/> إدارة بنرات الواجهة</h3>
                <button className="add-btn-main">إضافة إعلان جديد</button>
              </div>
              <div className="ads-grid-view">
                {[1, 2].map(ad => (
                  <div key={ad} className="ad-banner-card">
                    <div className="banner-preview">مساحة الإعلان {ad}</div>
                    <div className="banner-meta">
                      <strong>عرض خصم رمضان</strong>
                      <span>الحالة: نشط • المشاهدات: 4,500</span>
                    </div>
                    <div className="banner-actions">
                      <button className="stop-btn">إيقاف</button>
                      <button className="delete-btn"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- إغلاق جميع الحاويات الرئيسية للملف المفتوح --- */}
        </div> {/* نهاية dashboard-content */}
      </main> {/* نهاية main-layout */}
    </div> /* نهاية admin-root-container */
  );
};

// --- تعريف الدوال المساعدة المتبقية (Helpers) ---

const handleGlobalAction = (actionType) => {
  console.log(`Action Executed: ${actionType}`);
  // منطق الربط مع Firebase أو API
};

// --- التصدير النهائي للمكون المكتمل ---
export default AdminDash;


