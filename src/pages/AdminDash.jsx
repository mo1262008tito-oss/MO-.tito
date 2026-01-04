import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, query, getDocs, updateDoc, doc, addDoc, 
  onSnapshot, serverTimestamp, where, deleteDoc, orderBy 
} from "firebase/firestore";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, BookOpen, CreditCard, Plus, Check, X, 
  BarChart3, Hash, Library, Trash2, ShieldCheck, Search,
  Settings, UserPlus, Lock, Unlock, DollarSign
} from 'lucide-react';
import './AdminDash.css';

const AdminDash = () => {
  const [activeSection, setActiveSection] = useState('stats');
  const [stats, setStats] = useState({ students: 0, courses: 0, pending: 0, totalIncome: 0 });
  const [payments, setPayments] = useState([]);
  const [generatedCodes, setGeneratedCodes] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const [newCourse, setNewCourse] = useState({ name: '', grade: '1', instructor: '', category: 'HighSchool' });

  useEffect(() => {
    // جلب البيانات الحية
    const unsubStudents = onSnapshot(collection(db, "users"), (s) => {
        setStats(prev => ({...prev, students: s.size}));
        setAllUsers(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubCourses = onSnapshot(collection(db, "courses"), (s) => setStats(prev => ({...prev, courses: s.size})));
    
    const unsubPay = onSnapshot(query(collection(db, "paymentRequests"), where("status", "==", "pending")), (s) => {
      setPayments(s.docs.map(d => ({ id: d.id, ...d.data() })));
      setStats(prev => ({...prev, pending: s.size}));
    });

    const unsubCodes = onSnapshot(query(collection(db, "activationCodes"), orderBy("createdAt", "desc")), (s) => {
      setGeneratedCodes(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubStudents(); unsubCourses(); unsubPay(); unsubCodes(); };
  }, []);

  // --- وظائف التحكم ---

  // 1. توليد كود تفعيل متطور
  const generateBatchCodes = async (count = 1) => {// داخل دالة توليد الكود في AdminDash
const [selectedLessonId, setSelectedLessonId] = useState(''); // لتخزين ID الدرس المختار

const generateLessonCode = async () => {
  if (!selectedLessonId) return alert("اختر الدرس أولاً");
  
  const code = "LESSON-" + Math.random().toString(36).substring(2, 8).toUpperCase();
  await addDoc(collection(db, "activationCodes"), {
    code,
    isUsed: false,
    type: "single_lesson",
    lessonId: selectedLessonId, // ربط الكود بدرس معين
    createdAt: serverTimestamp(),
  });
  alert("تم توليد كود للدرس بنجاح ✅");
};
    setLoading(true);
    for(let i=0; i < count; i++) {
        const code = "MAFA-" + Math.random().toString(36).substring(2, 9).toUpperCase();
        await addDoc(collection(db, "activationCodes"), {
          code,
          isUsed: false,
          usedBy: null,
          createdAt: serverTimestamp(),
          type: "FullAccess" // يمكن تغييره لـ MonthAccess مثلاً
        });
    }
    setLoading(false);
  };

  // 2. تفعيل/تعطيل طالب يدوياً
  const toggleUserAccess = async (userId, currentStatus) => {
    await updateDoc(doc(db, "users", userId), { 
        isSecondaryActive: !currentStatus 
    });
  };

  // 3. حذف كود تفعيل
  const deleteCode = async (codeId) => {
    if(window.confirm("هل تريد حذف هذا الكود؟")) {
        await deleteDoc(doc(db, "activationCodes", codeId));
    }
  };

  // 4. قبول الدفع وتفعيل الطالب
  const approvePayment = async (requestId, studentId) => {
    try {
      await updateDoc(doc(db, "paymentRequests", requestId), { status: "approved" });
      await updateDoc(doc(db, "users", studentId), { isSecondaryActive: true });
      alert("تم تفعيل حساب الطالب بنجاح ✅");
    } catch (e) { alert("خطأ: " + e.message); }
  };

  return (
    <div className="admin-container" style={{direction: 'rtl'}}>
      {/* Sidebar المطور */}
      <aside className="admin-sidebar">
        <div className="admin-profile">
          <div className="admin-avatar pulse-effect"><ShieldCheck size={40} /></div>
          <h3>القائد محمود</h3>
          <p className="status-online">متصل الآن</p>
        </div>
        
        <nav className="admin-nav">
          <button onClick={() => setActiveSection('stats')} className={activeSection === 'stats' ? 'active' : ''}><BarChart3 /> لوحة الإحصائيات</button>
          <button onClick={() => setActiveSection('users')} className={activeSection === 'users' ? 'active' : ''}><Users /> إدارة الطلاب</button>
          <button onClick={() => setActiveSection('payments')} className={activeSection === 'payments' ? 'active' : ''}>
            <CreditCard /> طلبات الدفع 
            {stats.pending > 0 && <span className="badge">{stats.pending}</span>}
          </button>
          <button onClick={() => setActiveSection('codes')} className={activeSection === 'codes' ? 'active' : ''}><Hash /> الأكواد المالية</button>
          <button onClick={() => setActiveSection('content')} className={activeSection === 'content' ? 'active' : ''}><Plus /> إضافة محتوى</button>
        </nav>
      </aside>

      <main className="admin-main-content">
        <AnimatePresence mode="wait">
          
          {/* قسم الإحصائيات */}
          {activeSection === 'stats' && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} className="stats-container">
              <div className="stats-grid">
                <div className="stat-card blue">
                    <Users size={30} />
                    <div className="info"><h3>{stats.students}</h3><p>طالب منضم</p></div>
                </div>
                <div className="stat-card purple">
                    <BookOpen size={30} />
                    <div className="info"><h3>{stats.courses}</h3><p>كورس مفعل</p></div>
                </div>
                <div className="stat-card orange">
                    <DollarSign size={30} />
                    <div className="info"><h3>{generatedCodes.filter(c => c.isUsed).length}</h3><p>مبيعات الأكواد</p></div>
                </div>
                <div className="stat-card red">
                    <CreditCard size={30} />
                    <div className="info"><h3>{stats.pending}</h3><p>طلبات معلقة</p></div>
                </div>
              </div>
            </motion.div>
          )}

          {/* قسم إدارة الطلاب (Access Control) */}
          {activeSection === 'users' && (
            <motion.div initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} className="admin-section">
              <div className="section-header">
                <h2>قائمة الطلاب والتحكم في الوصول</h2>
                <div className="search-box">
                    <Search size={18} />
                    <input type="text" placeholder="ابحث باسم الطالب..." onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              </div>
              <div className="users-table">
                <table>
                  <thead>
                    <tr>
                      <th>الطالب</th>
                      <th>البريد</th>
                      <th>حالة الثانوية</th>
                      <th>التحكم</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.filter(u => u.name?.includes(searchTerm)).map(user => (
                      <tr key={user.id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>
                            <span className={`status-tag ${user.isSecondaryActive ? 'active' : 'inactive'}`}>
                                {user.isSecondaryActive ? 'مفعل' : 'غير مفعل'}
                            </span>
                        </td>
                        <td>
                            <button className="toggle-access-btn" onClick={() => toggleUserAccess(user.id, user.isSecondaryActive)}>
                                {user.isSecondaryActive ? <Lock size={16} color="#ff4d4d"/> : <Unlock size={16} color="#2ecc71"/>}
                            </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* قسم الأكواد (Code Generator) */}
          {activeSection === 'codes' && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} className="admin-section">
              <div className="section-header">
                <h2>إدارة أكواد التفعيل المالي</h2>
                <div className="actions">
                    <button onClick={() => generateBatchCodes(5)} className="gen-btn-outline">توليد 5 أكواد</button>
                    <button onClick={() => generateBatchCodes(1)} className="gen-btn">كود واحد +</button>
                </div>
              </div>
              <div className="codes-grid">
                {generatedCodes.map(c => (
                  <div key={c.id} className={`code-card ${c.isUsed ? 'used' : 'unused'}`}>
                    <div className="code-header">
                        <code>{c.code}</code>
                        <button onClick={() => deleteCode(c.id)} className="del-btn"><Trash2 size={14}/></button>
                    </div>
                    <div className="code-footer">
                        <span>{c.isUsed ? `استخدمه: ${c.usedBy || 'طالب'}` : 'متاح للبيع'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
};

export default AdminDash;

