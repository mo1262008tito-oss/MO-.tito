import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase'; 
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion'; 
import { 
  collection, query, updateDoc, doc, addDoc, 
  onSnapshot, serverTimestamp, where, deleteDoc, orderBy, 
  arrayUnion, increment, writeBatch, limit, getDocs
} from "firebase/firestore";
import { 
  Users, Plus, Check, X, Bell, Unlock, Eye,
  DollarSign, LayoutDashboard, Trash2, Hash, 
  Video, Layers, Zap, ShieldBan, Send, 
  Search, Activity, FileText, Ticket, Heart, TrendingUp
} from 'lucide-react';

import './AdminDash.css';

const AdminDash = () => {
  // ==========================================
  // [1] الحالات (States) - جميع الحالات الأصلية + الجديدة
  // ==========================================
  const [activeSection, setActiveSection] = useState('stats');
  const [loading, setLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  // حالات البيانات
  const [stats, setStats] = useState({ 
    totalStudents: 0, totalCourses: 0, totalCodes: 0, 
    totalBooks: 0, pendingPayments: 0, totalRevenue: 0,
    netProfit: 0, charityFund: 0, opsFund: 0
  });
  const [allUsers, setAllUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [coupons, setCoupons] = useState([]);

  // حالات النماذج (Forms)
  const [courseForm, setCourseForm] = useState({
    title: '', price: 250, thumbnail: '', grade: '1 ثانوي', subject: 'فيزياء', instructor: 'أ. محمود فرج'
  });
  const [notifForm, setNotifForm] = useState({ 
    title: '', message: '', target: 'all', type: 'info' 
  });
  const [codeForm, setCodeForm] = useState({ 
    count: 5, amount: 100, type: 'wallet', targetId: '' 
  });
  const [couponForm, setCouponForm] = useState({
    code: '', discount: 10, expiry: '', usageLimit: 50
  });

  // ==========================================
  // [2] محرك البيانات الفوري (Real-time Engine)
  // ==========================================
  useEffect(() => {
    setLoading(true);
    const unsubscribers = [
      onSnapshot(collection(db, "users"), (s) => {
        setAllUsers(s.docs.map(d => ({id: d.id, ...d.data()})));
        setStats(p => ({ ...p, totalStudents: s.size }));
      }),
      onSnapshot(collection(db, "courses_metadata"), (s) => {
        setCourses(s.docs.map(d => ({id: d.id, ...d.data()})));
        setStats(p => ({ ...p, totalCourses: s.size }));
      }),
      onSnapshot(query(collection(db, "payment_requests"), where("status", "==", "pending")), (s) => {
        setPaymentRequests(s.docs.map(d => ({id: d.id, ...d.data()})));
        setStats(p => ({ ...p, pendingPayments: s.size }));
      }),
      onSnapshot(query(collection(db, "audit_logs"), orderBy("timestamp", "desc"), limit(50)), (s) => {
        setAuditLogs(s.docs.map(d => ({id: d.id, ...d.data()})));
      }),
      onSnapshot(collection(db, "coupons"), (s) => {
        setCoupons(s.docs.map(d => ({id: d.id, ...d.data()})));
      }),
      // مراقبة الخزنة المالية
      onSnapshot(doc(db, "system_finance", "totals"), (d) => {
        if(d.exists()) {
          setStats(p => ({ ...p, ...d.data() }));
        }
      })
    ];
    setLoading(false);
    return () => unsubscribers.forEach(unsub => unsub());
  }, []);

  // ==========================================
  // [3] الوظائف المالية المطورة (Profit & Savings Logic)
  // ==========================================
  
  const handleApprovePayment = async (request) => {
    setLoading(true);
    try {
      const batch = writeBatch(db);
      
      // منطق الحساب المطور (لزيادة ربحك)
      // إذا كان الطالب "Affiliate" (جاء عن طريق كود زميله)
      const isAffiliate = request.referredBy ? true : false;
      
      const distribution = {
        teacher: isAffiliate ? 125 : 100,
        owner: 60,      // ربحك الصافي زاد
        charity: 10,    // بند الخير
        ops: 55,        // (أسيستنت 15 + صيانة 15 + ضرائب 10 + قانوني 15)
        marketing: isAffiliate ? 0 : 25 // إذا لم يكن هناك افلييت، تذهب للإعلانات
      };

      // 1. تفعيل المحتوى للطالب
      batch.update(doc(db, "users", request.userId), {
        enrolledContent: arrayUnion(request.courseId)
      });

      // 2. تحديث سجلات النظام المالية (لترى أرباحك الصافية)
      const financeRef = doc(db, "system_finance", "totals");
      batch.set(financeRef, {
        netProfit: increment(distribution.owner),
        charityFund: increment(distribution.charity),
        totalRevenue: increment(request.amount),
        opsFund: increment(distribution.ops)
      }, { merge: true });

      // 3. تحديث حالة الطلب
      batch.update(doc(db, "payment_requests", request.id), { 
        status: "approved", 
        approvedAt: serverTimestamp(),
        processedBy: auth.currentUser.email
      });

      // 4. إشعار للطالب بالنجاح (لتحسين تجربة المستخدم)
      const notifRef = doc(collection(db, "users", request.userId, "notifications"));
      batch.set(notifRef, {
        title: "🎊 مبروك! تم تفعيل الكورس",
        message: `يمكنك الآن مشاهدة ${request.courseName}. بالتوفيق!`,
        timestamp: serverTimestamp(),
        type: 'success'
      });

      await batch.commit();
      logActivity("تفعيل مالي", `تم تفعيل ${request.courseName} للطالب ${request.userName} وتوزيع الأرباح برمجياً`);
      alert("✅ تمت الموافقة وتوزيع الميزانية بنجاح");
    } catch (e) { alert("❌ خطأ مالي: " + e.message); }
    setLoading(false);
  };

  // ==========================================
  // [4] إدارة الكوبونات (Marketing Tools)
  // ==========================================
  
  const handleCreateCoupon = async () => {
    if(!couponForm.code || !couponForm.discount) return alert("❌ أكمل بيانات الكوبون");
    try {
      await addDoc(collection(db, "coupons"), {
        ...couponForm,
        active: true,
        createdAt: serverTimestamp(),
        usedCount: 0
      });
      alert("✅ تم إنشاء كوبون الخصم بنجاح");
      setCouponForm({ code: '', discount: 10, expiry: '', usageLimit: 50 });
    } catch (e) { alert(e.message); }
  };

  // ==========================================
  // [5] إدارة الأكواد والملفات (Bulk Actions)
  // ==========================================
  
  const generateBulkCodes = async () => {
    setLoading(true);
    try {
      const batch = writeBatch(db);
      const codesList = [];
      for (let i = 0; i < codeForm.count; i++) {
        const rawCode = "TITO-" + Math.random().toString(36).substring(2, 10).toUpperCase();
        const codeRef = doc(collection(db, "activationCodes"));
        const data = {
          code: rawCode,
          type: codeForm.type,
          amount: codeForm.type === 'wallet' ? codeForm.amount : 0,
          targetId: codeForm.targetId || null,
          isUsed: false,
          createdAt: serverTimestamp()
        };
        batch.set(codeRef, data);
        codesList.push({ "الكود": rawCode, "النوع": codeForm.type, "القيمة": data.amount });
      }
      await batch.commit();
      const ws = XLSX.utils.json_to_sheet(codesList);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Codes");
      XLSX.writeFile(wb, `Tito_Store_Codes_${Date.now()}.xlsx`);
      logActivity("توليد أكواد", `تم توليد ${codeForm.count} كود جديد`);
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  // ==========================================
  // [6] الوظائف المساعدة وإدارة الطلاب (Management)
  // ==========================================

  const logActivity = async (action, details) => {
    await addDoc(collection(db, "audit_logs"), {
      admin: auth.currentUser.email,
      action, details, timestamp: serverTimestamp()
    });
  };

  const resetDevices = async (uid, name) => {
    if(!window.confirm(`تصفير أجهزة ${name}؟`)) return;
    await updateDoc(doc(db, "users", uid), { deviceId: null, secondDeviceId: null });
    alert("✅ تم تصفير الأجهزة");
  };

  const handlePublishCourse = async () => {
    if(!courseForm.title || !courseForm.price) return alert("❌ بيانات ناقصة");
    setLoading(true);
    try {
      await addDoc(collection(db, "courses_metadata"), {
        ...courseForm,
        createdAt: serverTimestamp(),
        studentsCount: 0
      });
      alert("✅ تم النشر بنجاح");
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  // ==========================================
  // [7] الواجهة الرسومية (JSX)
  // ==========================================
  return (
    <div className="admin-nebula-wrapper">
      {loading && <div className="loading-overlay"><div className="spinner"></div></div>}
      
      {/* القائمة الجانبية المطورة */}
      <nav className="admin-sidebar">
        <div className="admin-logo">
          <Zap className="logo-icon" /> <span>TITO ADMIN <small>v3.0</small></span>
        </div>
        <div className="nav-links">
          <button onClick={() => setActiveSection('stats')} className={activeSection === 'stats' ? 'active' : ''}>
            <TrendingUp size={18}/> المالية والنمو
          </button>
          <button onClick={() => setActiveSection('payments')} className={activeSection === 'payments' ? 'active' : ''}>
            <DollarSign size={18}/> طلبات الدفع {paymentRequests.length > 0 && <span className="badge-count">{paymentRequests.length}</span>}
          </button>
          <button onClick={() => setActiveSection('users')} className={activeSection === 'users' ? 'active' : ''}>
            <Users size={18}/> الطلاب والأمان
          </button>
          <button onClick={() => setActiveSection('marketing')} className={activeSection === 'marketing' ? 'active' : ''}>
            <Ticket size={18}/> الكوبونات والعروض
          </button>
          <button onClick={() => setActiveSection('codes')} className={activeSection === 'codes' ? 'active' : ''}>
            <Hash size={18}/> الأكواد والمحفظة
          </button>
          <button onClick={() => setActiveSection('content')} className={activeSection === 'content' ? 'active' : ''}>
            <Layers size={18}/> المحتوى العلمي
          </button>
          <button onClick={() => setActiveSection('notifs')} className={activeSection === 'notifs' ? 'active' : ''}>
            <Bell size={18}/> مركز البث
          </button>
        </div>
        <div className="admin-footer-profile">
          <div className="avatar">{auth.currentUser?.email[0].toUpperCase()}</div>
          <div className="info">
            <span>مدير النظام</span>
            <p onClick={() => auth.signOut()}>تسجيل الخروج</p>
          </div>
        </div>
      </nav>

      {/* المحتوى الرئيسي */}
      <main className="admin-viewport">
        
        {/* القسم 1: المالية والنمو (Dashboard) */}
        {activeSection === 'stats' && (
          <section className="fade-in">
            <h1 className="section-title">إحصائيات الأداء المالي</h1>
            <div className="stats-card-grid">
              <div className="s-card revenue">
                <div className="card-icon"><DollarSign size={28}/></div>
                <div className="card-data">
                  <h4>{stats.totalRevenue?.toLocaleString()} ج.م</h4>
                  <p>إجمالي التدفق المالي</p>
                </div>
              </div>
              <div className="s-card profit">
                <div className="card-icon"><Zap size={28}/></div>
                <div className="card-data">
                  <h4>{stats.netProfit?.toLocaleString()} ج.م</h4>
                  <p>صافي أرباح المنصة (الأونر)</p>
                </div>
              </div>
              <div className="s-card charity">
                <div className="card-icon"><Heart size={28}/></div>
                <div className="card-data">
                  <h4>{stats.charityFund?.toLocaleString()} ج.م</h4>
                  <p>رصيد بند الخير</p>
                </div>
              </div>
              <div className="s-card ops">
                <div className="card-icon"><Activity size={28}/></div>
                <div className="card-data">
                  <h4>{stats.opsFund?.toLocaleString()} ج.م</h4>
                  <p>خزنة التشغيل والطوارئ</p>
                </div>
              </div>
            </div>

            <div className="dashboard-row">
              <div className="recent-logs glass">
                <h3><Activity size={18}/> سجل العمليات الأخيرة</h3>
                <div className="logs-list">
                  {auditLogs.map(log => (
                    <div key={log.id} className="log-item">
                      <span className="time">{log.timestamp?.toDate()?.toLocaleTimeString()}</span>
                      <span className="action">{log.action}</span>
                      <span className="details">{log.details}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* القسم 2: طلبات الدفع */}
        {activeSection === 'payments' && (
          <section className="fade-in">
            <h1 className="section-title">مراجعة التحويلات المالية</h1>
            <div className="payment-requests-grid">
              {paymentRequests.map(req => (
                <div key={req.id} className="pay-card glass">
                  <div className="pay-badge">{req.courseName}</div>
                  <div className="pay-content">
                    <h3>{req.userName}</h3>
                    <p className="price">{req.amount} EGP</p>
                    <div className="receipt-container">
                      <img src={req.receiptUrl} alt="Receipt" onClick={() => window.open(req.receiptUrl)} />
                      <div className="zoom-hint">انقر للتكبير</div>
                    </div>
                  </div>
                  <div className="pay-actions">
                    <button className="approve-btn" onClick={() => handleApprovePayment(req)}>
                      <Check size={18}/> تفعيل وتوزيع الربح
                    </button>
                    <button className="reject-btn" onClick={() => {
                      const msg = prompt("سبب الرفض:");
                      updateDoc(doc(db, "payment_requests", req.id), { status: 'rejected', reason: msg });
                    }}>
                      <X size={18}/> رفض
                    </button>
                  </div>
                </div>
              ))}
              {paymentRequests.length === 0 && <div className="empty-state">لا توجد طلبات دفع معلقة حالياً.</div>}
            </div>
          </section>
        )}

        {/* القسم 3: الكوبونات (الميزة الربحية الجديدة) */}
        {activeSection === 'marketing' && (
          <section className="fade-in">
            <h1 className="section-title">نظام العروض والكوبونات</h1>
            <div className="marketing-container glass">
              <div className="coupon-creator">
                <h3>إنشاء كوبون جديد</h3>
                <div className="form-grid">
                  <div className="f-group">
                    <label>كود الخصم</label>
                    <input placeholder="مثلاً: TITO20" value={couponForm.code} onChange={e => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})} />
                  </div>
                  <div className="f-group">
                    <label>نسبة الخصم %</label>
                    <input type="number" value={couponForm.discount} onChange={e => setCouponForm({...couponForm, discount: e.target.value})} />
                  </div>
                  <div className="f-group">
                    <label>تاريخ الانتهاء</label>
                    <input type="date" value={couponForm.expiry} onChange={e => setCouponForm({...couponForm, expiry: e.target.value})} />
                  </div>
                </div>
                <button className="main-btn" onClick={handleCreateCoupon}><Plus size={18}/> تنشيط الكوبون</button>
              </div>
              <div className="active-coupons">
                <h3>الكوبونات الفعالة</h3>
                <div className="coupon-table">
                  {coupons.map(c => (
                    <div key={c.id} className="coupon-row">
                      <span><b>{c.code}</b></span>
                      <span>خصم {c.discount}%</span>
                      <span className="usage">استخدم: {c.usedCount} مرة</span>
                      <button className="del-btn" onClick={() => deleteDoc(doc(db, "coupons", c.id))}><Trash2 size={16}/></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* القسم 4: إدارة الطلاب */}
        {activeSection === 'users' && (
          <section className="fade-in">
            <div className="section-header">
              <h1 className="section-title">إدارة حسابات الطلاب</h1>
              <div className="search-wrapper">
                <Search size={18} />
                <input placeholder="بحث بالاسم، الإيميل، أو الهاتف..." onChange={e => setUserSearch(e.target.value)} />
              </div>
            </div>
            <div className="users-table-container glass">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>الطالب</th>
                    <th>المحفظة</th>
                    <th>الكورسات</th>
                    <th>الأجهزة</th>
                    <th>التحكم</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.filter(u => u.name?.includes(userSearch) || u.email?.includes(userSearch)).map(user => (
                    <tr key={user.id}>
                      <td>
                        <div className="user-cell">
                          <span className="u-name">{user.name}</span>
                          <span className="u-email">{user.email}</span>
                        </div>
                      </td>
                      <td><div className="wallet-badge">{user.walletBalance || 0} ج.م</div></td>
                      <td>{user.enrolledContent?.length || 0} محتوى</td>
                      <td>
                        <button className={`device-btn ${user.deviceId ? 'locked' : ''}`} onClick={() => resetDevices(user.id, user.name)}>
                          {user.deviceId ? <Unlock size={14}/> : <Check size={14}/>} {user.deviceId ? 'تصفير' : 'مفتوح'}
                        </button>
                      </td>
                      <td className="actions">
                        <button className="view-btn" onClick={() => setSelectedUser(user)}><Eye size={16}/></button>
                        <button className={`ban-btn ${user.isBanned ? 'banned' : ''}`} onClick={() => updateDoc(doc(db, "users", user.id), { isBanned: !user.isBanned })}>
                          <ShieldBan size={16}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* القسم 5: الأكواد والمحتوى (مختصر للأهمية) */}
        {activeSection === 'codes' && (
          <section className="fade-in">
             <h1 className="section-title">مولد الأكواد التلقائي</h1>
             <div className="code-gen-wrapper glass">
                <div className="gen-form">
                  <div className="f-row">
                    <label>العدد المطلوب</label>
                    <input type="number" value={codeForm.count} onChange={e => setCodeForm({...codeForm, count: e.target.value})} />
                  </div>
                  <div className="f-row">
                    <label>نوع الكود</label>
                    <select value={codeForm.type} onChange={e => setCodeForm({...codeForm, type: e.target.value})}>
                      <option value="wallet">شحن رصيد محفظة</option>
                      <option value="course">تفعيل كورس مباشر</option>
                    </select>
                  </div>
                  {codeForm.type === 'wallet' ? (
                    <div className="f-row">
                      <label>المبلغ (EGP)</label>
                      <input type="number" value={codeForm.amount} onChange={e => setCodeForm({...codeForm, amount: e.target.value})} />
                    </div>
                  ) : (
                    <div className="f-row">
                      <label>اختر الكورس</label>
                      <select onChange={e => setCodeForm({...codeForm, targetId: e.target.value})}>
                        <option value="">-- اختر الكورس المستهدف --</option>
                        {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                      </select>
                    </div>
                  )}
                  <button className="gen-execute-btn" onClick={generateBulkCodes}><FileText size={18}/> توليد وتحميل Excel</button>
                </div>
             </div>
          </section>
        )}

      </main>

      {/* مودال تفاصيل الطالب (AnimatePresence) */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div className="modal-overlay" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <motion.div className="user-details-modal glass" initial={{scale:0.9, y:20}}>
               <div className="modal-header">
                  <h2>بروفايل الطالب: {selectedUser.name}</h2>
                  <button className="close-btn" onClick={() => setSelectedUser(null)}><X/></button>
               </div>
               <div className="modal-grid">
                  <div className="m-info">
                    <p><b>الهاتف:</b> {selectedUser.phone || 'غير مسجل'}</p>
                    <p><b>تاريخ الانضمام:</b> {selectedUser.createdAt?.toDate()?.toLocaleDateString()}</p>
                    <p><b>رصيد المحفظة:</b> {selectedUser.walletBalance || 0} ج.م</p>
                    <p><b>حالة الحساب:</b> {selectedUser.isBanned ? '🔴 محظور' : '🟢 نشط'}</p>
                  </div>
                  <div className="m-courses">
                    <h4>الكورسات المفعلة:</h4>
                    <div className="badge-container">
                      {selectedUser.enrolledContent?.map(cid => (
                        <span key={cid} className="c-badge">{courses.find(c => c.id === cid)?.title || 'كورس مجهول'}</span>
                      ))}
                    </div>
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
