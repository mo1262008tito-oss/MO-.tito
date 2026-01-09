import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase'; 
import * as XLSX from 'xlsx';
// 1. إضافة استيراد مكتبة الأنميشن
import { motion, AnimatePresence } from 'framer-motion'; 
import { 
  collection, query, updateDoc, doc, addDoc, 
  onSnapshot, serverTimestamp, where, deleteDoc, orderBy, 
  arrayUnion, increment, writeBatch, limit 
} from "firebase/firestore";
// 2. إضافة أيقونة Eye الناقصة
import { 
  Users, Plus, Check, X, Bell, Unlock, Eye,
  DollarSign, LayoutDashboard, Trash2, Hash, 
  Video, Layers, Zap, ShieldBan, Send, 
  Search, Activity, FileText
} from 'lucide-react';

const AdminDash = () => {
  // ... (نفس الـ States الموجودة في كودك) ...

  // 3. إضافة الوظيفة التي كانت تسبب خطأ (handlePublishCourse)
  const handlePublishCourse = async () => {
    if(!courseForm.title || !courseForm.price) return alert("❌ أكمل بيانات الكورس");
    setLoading(true);
    try {
      await addDoc(collection(db, "courses_metadata"), {
        ...courseForm,
        createdAt: serverTimestamp(),
        studentsCount: 0
      });
      alert("✅ تم نشر الكورس بنجاح");
      setCourseForm({ title: '', price: '', thumbnail: '', grade: '1 ثانوي', subject: 'فيزياء', instructor: 'أ. محمود فرج' });
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  // ... (بقية الوظائف: resetUserDevices, toggleUserBan, إلخ) ...
const AdminDash = () => {
  // ==========================================
  // [1] حالات التحكم في الواجهة (Interface States)
  // ==========================================
  const [activeSection, setActiveSection] = useState('stats');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  // ==========================================
  // [2] حالات البيانات (Data States)
  // ==========================================
  const [stats, setStats] = useState({ 
    totalStudents: 0, totalCourses: 0, totalCodes: 0, 
    totalBooks: 0, pendingPayments: 0, totalEarnings: 0 
  });
  const [allUsers, setAllUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [books, setBooks] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // ==========================================
  // [3] حالات النماذج (Form States)
  // ==========================================
  const [courseForm, setCourseForm] = useState({
    title: '', price: '', thumbnail: '', grade: '1 ثانوي', subject: 'فيزياء', instructor: 'أ. محمود فرج'
  });
  const [notifForm, setNotifForm] = useState({ 
    title: '', message: '', target: 'all', type: 'info' 
  });
  const [codeForm, setCodeForm] = useState({ 
    count: 5, amount: 100, type: 'wallet', targetId: '' 
  });

  // ==========================================
  // [4] محرك البيانات الفوري (Real-time Engine)
  // ==========================================
  useEffect(() => {
    setLoading(true);
    const unsubscribers = [
      // مراقبة الطلاب وحساب الإحصائيات
      onSnapshot(collection(db, "users"), (s) => {
        const usersData = s.docs.map(d => ({id: d.id, ...d.data()}));
        setAllUsers(usersData);
        setStats(p => ({ ...p, totalStudents: s.size }));
      }),
      // مراقبة الكورسات
      onSnapshot(collection(db, "courses_metadata"), (s) => {
        setCourses(s.docs.map(d => ({id: d.id, ...d.data()})));
        setStats(p => ({ ...p, totalCourses: s.size }));
      }),
      // مراقبة طلبات الدفع المعلقة
      onSnapshot(query(collection(db, "payment_requests"), where("status", "==", "pending")), (s) => {
        setPaymentRequests(s.docs.map(d => ({id: d.id, ...d.data()})));
        setStats(p => ({ ...p, pendingPayments: s.size }));
      }),
      // مراقبة المكتبة
      onSnapshot(collection(db, "library_books"), (s) => {
        setBooks(s.docs.map(d => ({id: d.id, ...d.data()})));
        setStats(p => ({ ...p, totalBooks: s.size }));
      }),
      // مراقبة سجلات النظام
      onSnapshot(query(collection(db, "audit_logs"), orderBy("timestamp", "desc"), limit(50)), (s) => {
        setAuditLogs(s.docs.map(d => ({id: d.id, ...d.data()})));
      })
    ];

    setLoading(false);
    return () => unsubscribers.forEach(unsub => unsub());
  }, []);

  // ==========================================
  // [5] وظائف إدارة الطلاب (User Management)
  // ==========================================
  
  // تصفير أجهزة الطالب (Security Reset)
  const resetUserDevices = async (userId, userName) => {
    if(!window.confirm(`هل أنت متأكد من تصفير أجهزة ${userName}؟`)) return;
    try {
      await updateDoc(doc(db, "users", userId), { 
        deviceId: null, 
        secondDeviceId: null 
      });
      logActivity("تصفير أجهزة", `تم تصفير أجهزة الطالب: ${userName}`);
      alert("✅ تم تصفير الأجهزة بنجاح");
    } catch (e) { alert(e.message); }
  };

  // حظر / إلغاء حظر طالب
  const toggleUserBan = async (user) => {
    const newStatus = !user.isBanned;
    try {
      await updateDoc(doc(db, "users", user.id), { isBanned: newStatus });
      logActivity(newStatus ? "حظر مستخدم" : "إلغاء حظر", `المستخدم: ${user.name}`);
    } catch (e) { alert(e.message); }
  };

  // شحن محفظة يدوي
  const rechargeWalletManual = async (userId, amount) => {
    const val = parseInt(prompt("أدخل المبلغ المراد إضافته للمحفظة:", amount));
    if(!val || isNaN(val)) return;
    try {
      await updateDoc(doc(db, "users", userId), { 
        walletBalance: increment(val) 
      });
      alert(`✅ تم إضافة ${val} جنيهاً للمحفظة`);
    } catch (e) { alert(e.message); }
  };

  // ==========================================
  // [6] وظائف نظام الدفع (Payment Handling)
  // ==========================================

  const handleApprovePayment = async (request) => {
    setLoading(true);
    try {
      const batch = writeBatch(db);
      
      // 1. تفعيل الكورس للطالب
      const userRef = doc(db, "users", request.userId);
      batch.update(userRef, {
        enrolledContent: arrayUnion(request.courseId)
      });

      // 2. تحديث حالة طلب الدفع
      const reqRef = doc(db, "payment_requests", request.id);
      batch.update(reqRef, { 
        status: "approved", 
        approvedAt: serverTimestamp(),
        adminEmail: auth.currentUser.email
      });

      // 3. إرسال إشعار داخلي للطالب
      const notifRef = doc(collection(db, "users", request.userId, "notifications"));
      batch.set(notifRef, {
        title: "✅ تم تفعيل الكورس",
        message: `تمت الموافقة على اشتراكك في ${request.courseName}، يمكنك البدء الآن.`,
        timestamp: serverTimestamp(),
        type: 'success',
        read: false
      });

      await batch.commit();
      logActivity("موافقة دفع", `تفعيل كورس ${request.courseName} للطالب ${request.userName}`);
      alert("✅ تمت العملية بنجاح");
    } catch (e) {
      alert("❌ حدث خطأ أثناء التفعيل: " + e.message);
    }
    setLoading(false);
  };

  const handleRejectPayment = async (requestId) => {
    const reason = prompt("سبب الرفض (اختياري):");
    try {
      await updateDoc(doc(db, "payment_requests", requestId), { 
        status: "rejected",
        rejectReason: reason || "لم يتم توضيح السبب"
      });
      alert("❌ تم رفض الطلب");
    } catch (e) { alert(e.message); }
  };

  // ==========================================
  // [7] نظام الإشعارات (Notifications System)
  // ==========================================

  const broadcastNotification = async () => {
    if(!notifForm.title || !notifForm.message) return alert("❌ أكمل بيانات الرسالة");
    setLoading(true);
    try {
      const batch = writeBatch(db);
      
      if (notifForm.target === 'all') {
        // إرسال لكل الطلاب المسجلين
        allUsers.forEach(u => {
          const nRef = doc(collection(db, "users", u.id, "notifications"));
          batch.set(nRef, {
            title: notifForm.title,
            message: notifForm.message,
            type: notifForm.type,
            timestamp: serverTimestamp(),
            read: false
          });
        });
        await batch.commit();
        alert(`✅ تم إرسال الإشعار لـ ${allUsers.length} طالب`);
      } else {
        // إرسال لطالب محدد
        const nRef = doc(collection(db, "users", notifForm.target, "notifications"));
        await addDoc(collection(db, "users", notifForm.target, "notifications"), {
          title: notifForm.title,
          message: notifForm.message,
          type: notifForm.type,
          timestamp: serverTimestamp(),
          read: false
        });
        alert("✅ تم إرسال الإشعار الخاص");
      }
      setNotifForm({ title: '', message: '', target: 'all', type: 'info' });
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  // ==========================================
  // [8] إدارة الأكواد (Activation Codes)
  // ==========================================

  const generateBulkCodes = async () => {
    setLoading(true);
    try {
      const batch = writeBatch(db);
      const codesList = [];
      const timestamp = Date.now();

      for (let i = 0; i < codeForm.count; i++) {
        const rawCode = "TITO-" + Math.random().toString(36).substring(2, 10).toUpperCase();
        const codeRef = doc(collection(db, "activationCodes"));
        
        const codeData = {
          code: rawCode,
          type: codeForm.type,
          amount: codeForm.type === 'wallet' ? codeForm.amount : 0,
          targetId: codeForm.type === 'course' ? codeForm.targetId : null,
          isUsed: false,
          createdAt: serverTimestamp()
        };
        
        batch.set(codeRef, codeData);
        codesList.push({ "الكود": rawCode, "النوع": codeForm.type, "التاريخ": new Date().toLocaleDateString() });
      }

      await batch.commit();
      
      // تصدير ملف اكسيل
      const ws = XLSX.utils.json_to_sheet(codesList);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "ActivationCodes");
      XLSX.writeFile(wb, `Tito_Codes_${timestamp}.xlsx`);
      
      logActivity("توليد أكواد", `عدد الأكواد: ${codeForm.count}`);
      alert("✅ تم توليد الأكواد وتصدير ملف Excel");
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  // ==========================================
  // [9] الوظائف المساعدة (Helper Functions)
  // ==========================================

  const logActivity = async (action, details) => {
    await addDoc(collection(db, "audit_logs"), {
      admin: auth.currentUser.email,
      action,
      details,
      timestamp: serverTimestamp()
    });
  };

  const deleteDocument = async (coll, id, label) => {
    if(!window.confirm(`هل أنت متأكد من حذف (${label})؟ لا يمكن التراجع!`)) return;
    try {
      await deleteDoc(doc(db, coll, id));
      logActivity("حذف نهائي", `تم حذف ${label} من ${coll}`);
    } catch (e) { alert(e.message); }
  };

  // ==========================================
  // [10] واجهة المستخدم (JSX Layout)
  // ==========================================

  return (
    <div className="admin-nebula-wrapper">
      {/* شريط التحميل */}
      {loading && <div className="loading-bar"></div>}

      {/* القائمة الجانبية */}
      <nav className="admin-sidebar">
        <div className="admin-logo">
           <Zap color="#00f2ff" /> <span>TITO CMS v2.0</span>
        </div>
        <div className="nav-links">
           <button onClick={() => setActiveSection('stats')} className={activeSection === 'stats' ? 'active' : ''}>
             <LayoutDashboard size={20}/> الإحصائيات العامة
           </button>
           <button onClick={() => setActiveSection('payments')} className={activeSection === 'payments' ? 'active' : ''}>
             <DollarSign size={20}/> طلبات الدفع {paymentRequests.length > 0 && <span className="badge">{paymentRequests.length}</span>}
           </button>
           <button onClick={() => setActiveSection('users')} className={activeSection === 'users' ? 'active' : ''}>
             <Users size={20}/> إدارة الطلاب
           </button>
           <button onClick={() => setActiveSection('notifs')} className={activeSection === 'notifs' ? 'active' : ''}>
             <Bell size={20}/> مركز الإشعارات
           </button>
           <button onClick={() => setActiveSection('content')} className={activeSection === 'content' ? 'active' : ''}>
             <Layers size={20}/> محتوى الكورسات
           </button>
           <button onClick={() => setActiveSection('codes')} className={activeSection === 'codes' ? 'active' : ''}>
             <Hash size={20}/> الأكواد والمحفظة
           </button>
           <button onClick={() => setActiveSection('logs')} className={activeSection === 'logs' ? 'active' : ''}>
             <Activity size={20}/> سجلات النظام
           </button>
        </div>
        <div className="admin-profile-dock">
           <span>{auth.currentUser?.email}</span>
           <button onClick={() => auth.signOut()}><X size={16}/></button>
        </div>
      </nav>

      {/* المحتوى الرئيسي */}
      <main className="admin-viewport">
        
        {/* SECTION: الإحصائيات */}
        {activeSection === 'stats' && (
          <section className="fade-in">
            <h1 className="section-title">نظرة عامة على المنصة</h1>
            <div className="stats-card-grid">
              <div className="s-card">
                 <Users color="#00f2ff" />
                 <div><h4>{stats.totalStudents}</h4><p>طالب مسجل</p></div>
              </div>
              <div className="s-card">
                 <DollarSign color="#25D366" />
                 <div><h4>{stats.pendingPayments}</h4><p>طلبات دفع معلقة</p></div>
              </div>
              <div className="s-card">
                 <Video color="#7000ff" />
                 <div><h4>{stats.totalCourses}</h4><p>كورس دراسي</p></div>
              </div>
              <div className="s-card">
                 <Activity color="#ff007a" />
                 <div><h4>{auditLogs.length}</h4><p>عملية مسجلة</p></div>
              </div>
            </div>
            
            <div className="recent-activity-table">
               <h3>آخر العمليات الإدارية</h3>
               {auditLogs.map(log => (
                 <div key={log.id} className="log-row">
                    <span className="log-time">{log.timestamp?.toDate()?.toLocaleTimeString()}</span>
                    <span className="log-action">{log.action}</span>
                    <span className="log-details">{log.details}</span>
                 </div>
               ))}
            </div>
          </section>
        )}

        {/* SECTION: طلبات الدفع */}
        {activeSection === 'payments' && (
          <section className="fade-in">
            <h1 className="section-title">مراجعة إيصالات التحويل (Manual Pay)</h1>
            <div className="payment-requests-list">
              {paymentRequests.map(req => (
                <div key={req.id} className="pay-card glass">
                   <div className="pay-user-info">
                      <h3>{req.userName}</h3>
                      <p>المبلغ المطلوب: <b>{req.amount} EGP</b></p>
                      <p>الكورس: {req.courseName}</p>
                   </div>
                   <div className="pay-receipt">
                      <img src={req.receiptUrl} alt="Receipt" onClick={() => window.open(req.receiptUrl)} />
                      <p>إضغط على الصورة لتكبيرها</p>
                   </div>
                   <div className="pay-actions">
                      <button className="approve-btn" onClick={() => handleApprovePayment(req)}><Check /> تفعيل الكورس</button>
                      <button className="reject-btn" onClick={() => handleRejectPayment(req.id)}><X /> رفض الطلب</button>
                   </div>
                </div>
              ))}
              {paymentRequests.length === 0 && <div className="empty-msg">لا توجد طلبات دفع حالياً.</div>}
            </div>
          </section>
        )}

        {/* SECTION: إدارة الطلاب */}
        {activeSection === 'users' && (
          <section className="fade-in">
            <div className="section-header">
               <h1 className="section-title">قاعدة بيانات الطلاب</h1>
               <div className="search-box">
                  <Search size={18} />
                  <input placeholder="بحث بالاسم أو الإيميل..." onChange={e => setUserSearch(e.target.value)} />
               </div>
            </div>
            <table className="admin-data-table">
               <thead>
                 <tr>
                    <th>الطالب</th>
                    <th>المحفظة</th>
                    <th>الكورسات المشترك بها</th>
                    <th>الأجهزة</th>
                    <th>الإجراءات</th>
                 </tr>
               </thead>
               <tbody>
                 {allUsers.filter(u => u.name?.includes(userSearch) || u.email?.includes(userSearch)).map(user => (
                   <tr key={user.id}>
                      <td>
                         <div className="u-info"><b>{user.name}</b><br/><span>{user.email}</span></div>
                      </td>
                      <td>
                         <button onClick={() => rechargeWalletManual(user.id, user.walletBalance)} className="wallet-btn">
                           {user.walletBalance || 0} ج.م <Plus size={12}/>
                         </button>
                      </td>
                      <td>{user.enrolledContent?.length || 0} كورس</td>
                      <td>
                         <button className="reset-btn" onClick={() => resetUserDevices(user.id, user.name)}>
                           تصفير ({user.deviceId ? '1' : '0'}/2)
                         </button>
                      </td>
                      <td className="actions-cell">
                         <button className={`ban-btn ${user.isBanned ? 'active' : ''}`} onClick={() => toggleUserBan(user)}>
                            {user.isBanned ? <Unlock size={16}/> : <ShieldBan size={16}/>}
                         </button>
                         <button onClick={() => setSelectedUser(user)}><Eye size={16}/></button>
                      </td>
                   </tr>
                 ))}
               </tbody>
            </table>
          </section>
        )}

        {/* SECTION: الإشعارات */}
        {activeSection === 'notifs' && (
          <section className="fade-in">
            <h1 className="section-title">مركز بث الإشعارات</h1>
            <div className="notif-form-container glass">
               <div className="form-group">
                  <label>المستهدفين:</label>
                  <select value={notifForm.target} onChange={e => setNotifForm({...notifForm, target: e.target.value})}>
                     <option value="all">كل الطلاب المسجلين</option>
                     {allUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
               </div>
               <div className="form-group">
                  <label>نوع التنبيه:</label>
                  <div className="type-buttons">
                     <button className={notifForm.type === 'info' ? 'active' : ''} onClick={() => setNotifForm({...notifForm, type:'info'})}>إرشاد</button>
                     <button className={notifForm.type === 'warning' ? 'active' : ''} onClick={() => setNotifForm({...notifForm, type:'warning'})}>تنبيه</button>
                     <button className={notifForm.type === 'success' ? 'active' : ''} onClick={() => setNotifForm({...notifForm, type:'success'})}>نجاح</button>
                  </div>
               </div>
               <div className="form-group">
                  <label>عنوان الإشعار:</label>
                  <input value={notifForm.title} onChange={e => setNotifForm({...notifForm, title: e.target.value})} placeholder="مثال: موعد الحصة القادمة" />
               </div>
               <div className="form-group">
                  <label>نص الرسالة:</label>
                  <textarea value={notifForm.message} onChange={e => setNotifForm({...notifForm, message: e.target.value})} placeholder="اكتب تفاصيل الإشعار هنا..." rows="5" />
               </div>
               <button className="send-btn" onClick={broadcastNotification}><Send /> إرسال الإشعار الآن</button>
            </div>
          </section>
        )}

        {/* SECTION: المحتوى والأكواد */}
        {activeSection === 'content' && (
          <section className="fade-in">
             <div className="content-grid">
                <div className="content-form glass">
                   <h3>إضافة كورس جديد</h3>
                   <input placeholder="عنوان الكورس" onChange={e => setCourseForm({...courseForm, title: e.target.value})} />
                   <input placeholder="سعر الكورس" type="number" onChange={e => setCourseForm({...courseForm, price: e.target.value})} />
                   <input placeholder="رابط صورة الغلاف" onChange={e => setCourseForm({...courseForm, thumbnail: e.target.value})} />
                   <select onChange={e => setCourseForm({...courseForm, grade: e.target.value})}>
                      <option>1 ثانوي</option><option>2 ثانوي</option><option>3 ثانوي</option>
                   </select>
                   <button className="add-btn" onClick={handlePublishCourse}>نشر المحتوى</button>
                </div>
                
                <div className="content-list glass">
                   <h3>الكورسات المنشورة</h3>
                   {courses.map(c => (
                     <div key={c.id} className="c-item">
                        <span>{c.title} - {c.price} ج.م</span>
                        <button onClick={() => deleteDocument('courses_metadata', c.id, c.title)}><Trash2 size={14}/></button>
                     </div>
                   ))}
                </div>
             </div>
          </section>
        )}

        {/* SECTION: توليد الأكواد */}
        {activeSection === 'codes' && (
          <section className="fade-in">
             <h1 className="section-title">مولد الأكواد (إكسيل)</h1>
             <div className="code-gen-box glass">
                <div className="form-grid">
                   <div className="f-col">
                      <label>العدد المطلوب:</label>
                      <input type="number" value={codeForm.count} onChange={e => setCodeForm({...codeForm, count: parseInt(e.target.value)})} />
                   </div>
                   <div className="f-col">
                      <label>نوع الكود:</label>
                      <select value={codeForm.type} onChange={e => setCodeForm({...codeForm, type: e.target.value})}>
                         <option value="wallet">شحن محفظة</option>
                         <option value="course">تفعيل كورس</option>
                      </select>
                   </div>
                   {codeForm.type === 'wallet' ? (
                     <div className="f-col">
                        <label>المبلغ:</label>
                        <input type="number" value={codeForm.amount} onChange={e => setCodeForm({...codeForm, amount: parseInt(e.target.value)})} />
                     </div>
                   ) : (
                     <div className="f-col">
                        <label>اختر الكورس:</label>
                        <select onChange={e => setCodeForm({...codeForm, targetId: e.target.value})}>
                           <option value="">-- اختر --</option>
                           {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </select>
                     </div>
                   )}
                </div>
                <button className="gen-btn" onClick={generateBulkCodes}><FileText /> توليد وتصدير ملف Excel</button>
             </div>
          </section>
        )}

      </main>

      {/* مودال تفاصيل الطالب الإضافية */}
      <AnimatePresence>
         {selectedUser && (
           <motion.div className="admin-modal-overlay" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
              <motion.div className="admin-modal glass" initial={{scale:0.8}}>
                 <div className="modal-header">
                    <h2>ملف الطالب: {selectedUser.name}</h2>
                    <button onClick={() => setSelectedUser(null)}><X/></button>
                 </div>
                 <div className="modal-body">
                    <div className="info-section">
                       <p><b>الإيميل:</b> {selectedUser.email}</p>
                       <p><b>رقم الهاتف:</b> {selectedUser.phone || 'غير مسجل'}</p>
                       <p><b>الرصيد الحالي:</b> {selectedUser.walletBalance || 0} ج.م</p>
                       <p><b>تاريخ التسجيل:</b> {selectedUser.createdAt}</p>
                    </div>
                    <div className="courses-section">
                       <h4>الكورسات المشترك بها:</h4>
                       <ul>
                          {selectedUser.enrolledContent?.map(cid => (
                            <li key={cid}>{courses.find(c => c.id === cid)?.title || 'كورس محذوف'}</li>
                          ))}
                       </ul>
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

