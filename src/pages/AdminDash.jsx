import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, query, getDocs, updateDoc, doc, addDoc, 
  onSnapshot, serverTimestamp, where, deleteDoc 
} from "firebase/firestore";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, BookOpen, CreditCard, Plus, Check, X, 
  BarChart3, Hash, Library, Trash2, ShieldCheck 
} from 'lucide-react';
import './AdminDash.css';

const AdminDash = () => {
  const [activeSection, setActiveSection] = useState('stats');
  const [stats, setStats] = useState({ students: 0, courses: 0, pending: 0 });
  const [payments, setPayments] = useState([]);
  const [generatedCodes, setGeneratedCodes] = useState([]);
  const [newCourse, setNewCourse] = useState({ name: '', grade: '1', instructor: '', category: 'HighSchool' });
  const [newBook, setNewBook] = useState({ title: '', author: '', fileUrl: '' });

  useEffect(() => {
    // 1. جلب الإحصائيات الحية
    const unsubStudents = onSnapshot(collection(db, "users"), (s) => setStats(prev => ({...prev, students: s.size})));
    const unsubCourses = onSnapshot(collection(db, "courses"), (s) => setStats(prev => ({...prev, courses: s.size})));
    
    // 2. جلب طلبات الدفع المعلقة
    const qPayments = query(collection(db, "paymentRequests"), where("status", "==", "pending"));
    const unsubPay = onSnapshot(qPayments, (s) => {
      setPayments(s.docs.map(d => ({ id: d.id, ...d.data() })));
      setStats(prev => ({...prev, pending: s.size}));
    });

    // 3. جلب الأكواد المولدة سابقاً
    const unsubCodes = onSnapshot(collection(db, "activationCodes"), (s) => {
      setGeneratedCodes(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubStudents(); unsubCourses(); unsubPay(); unsubCodes(); };
  }, []);

  // دالة توليد كود تفعيل عشوائي
  const generateCode = async () => {
    const code = "MAFA-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    await addDoc(collection(db, "activationCodes"), {
      code,
      isUsed: false,
      createdAt: serverTimestamp(),
      createdBy: "Admin"
    });
  };

  // دالة قبول الدفع وتفعيل حساب الطالب
  const approvePayment = async (requestId, studentId) => {
    try {
      await updateDoc(doc(db, "paymentRequests", requestId), { status: "approved" });
      await updateDoc(doc(db, "users", studentId), { isSecondaryActive: true });
      alert("تم تفعيل حساب الطالب بنجاح ✅");
    } catch (e) { alert("خطأ: " + e.message); }
  };

  // دالة إضافة كورس جديد
  const handleAddCourse = async () => {
    if (!newCourse.name) return;
    await addDoc(collection(db, "courses"), { ...newCourse, timestamp: serverTimestamp() });
    setNewCourse({ name: '', grade: '1', instructor: '', category: 'HighSchool' });
    alert("تم إضافة الكورس بنجاح 🚀");
  };

  return (
    <div className="admin-container">
      {/* Sidebar الداخلي للوحة التحكم */}
      <aside className="admin-sidebar">
        <div className="admin-profile">
          <div className="admin-avatar"><ShieldCheck size={40} /></div>
          <h3>القائد محمود</h3>
          <span>مدير المنصة</span>
        </div>
        <nav className="admin-nav">
          <button onClick={() => setActiveSection('stats')} className={activeSection === 'stats' ? 'active' : ''}><BarChart3 size={18} /> الإحصائيات</button>
          <button onClick={() => setActiveSection('payments')} className={activeSection === 'payments' ? 'active' : ''}><CreditCard size={18} /> طلبات الدفع ({stats.pending})</button>
          <button onClick={() => setActiveSection('codes')} className={activeSection === 'codes' ? 'active' : ''}><Hash size={18} /> مولد الأكواد</button>
          <button onClick={() => setActiveSection('content')} className={activeSection === 'content' ? 'active' : ''}><Plus size={18} /> إضافة محتوى</button>
        </nav>
      </aside>

      <main className="admin-main-content">
        <AnimatePresence mode="wait">
          {activeSection === 'stats' && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} key="stats" className="stats-grid">
              <div className="stat-card">
                <Users color="#00f2ff" />
                <div><h4>{stats.students}</h4><p>طالب مسجل</p></div>
              </div>
              <div className="stat-card">
                <BookOpen color="#a855f7" />
                <div><h4>{stats.courses}</h4><p>كورس متاح</p></div>
              </div>
              <div className="stat-card urgent">
                <CreditCard color="#ff4d4d" />
                <div><h4>{stats.pending}</h4><p>طلبات انتظار</p></div>
              </div>
            </motion.div>
          )}

          {activeSection === 'payments' && (
            <motion.div initial={{x:20, opacity:0}} animate={{x:0, opacity:1}} key="pay" className="admin-section">
              <h2 className="section-title">مراجعة التحويلات المالية</h2>
              <div className="payments-list">
                {payments.map(pay => (
                  <div key={pay.id} className="payment-row">
                    <div className="pay-info">
                      <strong>{pay.studentName}</strong>
                      <a href={pay.screenshotUrl} target="_blank" rel="noreferrer">عرض الإيصال 🖼️</a>
                    </div>
                    <div className="pay-actions">
                      <button onClick={() => approvePayment(pay.id, pay.studentId)} className="approve-btn"><Check size={16}/> قبول</button>
                      <button className="reject-btn"><X size={16}/> رفض</button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeSection === 'codes' && (
            <motion.div initial={{x:20, opacity:0}} animate={{x:0, opacity:1}} key="codes" className="admin-section">
              <div className="section-header">
                <h2>أكواد التفعيل المسبقة</h2>
                <button onClick={generateCode} className="gen-btn">توليد كود جديد +</button>
              </div>
              <div className="codes-table">
                {generatedCodes.map(c => (
                  <div key={c.id} className={`code-item ${c.isUsed ? 'used' : 'unused'}`}>
                    <code>{c.code}</code>
                    <span>{c.isUsed ? 'تم استخدامه' : 'متاح للبيع'}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeSection === 'content' && (
            <motion.div initial={{x:20, opacity:0}} animate={{x:0, opacity:1}} key="content" className="admin-section content-forms">
              <div className="form-box">
                <h3>إضافة كورس ثانوي</h3>
                <input type="text" placeholder="اسم الكورس" value={newCourse.name} onChange={e => setNewCourse({...newCourse, name: e.target.value})} />
                <select onChange={e => setNewCourse({...newCourse, grade: e.target.value})}>
                  <option value="1">الأول الثانوي</option>
                  <option value="2">الثاني الثانوي</option>
                  <option value="3">الثالث الثانوي</option>
                </select>
                <button onClick={handleAddCourse}>نشر الكورس</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default AdminDash;