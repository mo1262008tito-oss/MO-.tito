import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, query, getDocs, updateDoc, doc, addDoc, 
  onSnapshot, serverTimestamp, where, deleteDoc, orderBy 
} from "firebase/firestore";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, BookOpen, Plus, Check, X, ShieldCheck, Search,
  Lock, Unlock, DollarSign, FileText, LayoutDashboard,
  PackagePlus, Download, Eye, Trash2, UserCheck, Wallet, ShieldAlert
} from 'lucide-react';
import './AdminDash.css';

const AdminDash = () => {
  const [activeSection, setActiveSection] = useState('stats');
  const [stats, setStats] = useState({ students: 0, courses: 0, pending: 0, codes: 0, books: 0, income: 0 });
  const [payments, setPayments] = useState([]);
  const [generatedCodes, setGeneratedCodes] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  const [showImgModal, setShowImgModal] = useState(null);
  
  // لنموذج إضافة محتوى جديد
  const [newContent, setNewContent] = useState({ 
    title: '', grade: '1', instructor: '', url: '', type: 'course', thumbnail: '' 
  });
  
  // إعدادات الحماية (العلامة المائية)
  const [securitySettings, setSecuritySettings] = useState({ watermark: true });
  const [batchCount, setBatchCount] = useState(10);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), (s) => {
        setStats(prev => ({...prev, students: s.size}));
        setAllUsers(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubCourses = onSnapshot(collection(db, "courses"), (s) => setStats(prev => ({...prev, courses: s.size})));
    const unsubBooks = onSnapshot(collection(db, "library"), (s) => setStats(prev => ({...prev, books: s.size})));
    
    const unsubPay = onSnapshot(query(collection(db, "paymentRequests"), where("status", "==", "pending")), (s) => {
      setPayments(s.docs.map(d => ({ id: d.id, ...d.data() })));
      setStats(prev => ({...prev, pending: s.size}));
    });

    const unsubCodes = onSnapshot(query(collection(db, "activationCodes"), orderBy("createdAt", "desc")), (s) => {
      const docs = s.docs.map(d => ({ id: d.id, ...d.data() }));
      setGeneratedCodes(docs);
      setStats(prev => ({...prev, codes: s.size, income: docs.filter(c => c.isUsed).length * 100}));
    });

    return () => { unsubUsers(); unsubCourses(); unsubBooks(); unsubPay(); unsubCodes(); };
  }, []);

  // --- دالة إضافة كورس أو كتاب ---
  const handleAddContent = async (e) => {
    e.preventDefault();
    try {
      const collectionName = newContent.type === 'course' ? 'courses' : 'library';
      await addDoc(collection(db, collectionName), {
        ...newContent,
        createdAt: serverTimestamp(),
      });
      alert(`تم إضافة ${newContent.type === 'course' ? 'الكورس' : 'الكتاب'} بنجاح ✅`);
      setNewContent({ title: '', grade: '1', instructor: '', url: '', type: 'course', thumbnail: '' });
    } catch (error) {
      alert("خطأ في الإضافة: " + error.message);
    }
  };

  const exportCodes = () => {
    const unused = generatedCodes.filter(c => !c.isUsed).map(c => c.code).join('\n');
    const blob = new Blob([unused], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `أكواد_مافا_${new Date().toLocaleDateString()}.txt`;
    link.click();
  };

  const approvePayment = async (payId, userId) => {
    await updateDoc(doc(db, "paymentRequests", payId), { status: "approved" });
    await updateDoc(doc(db, "users", userId), { isSecondaryActive: true });
    alert("تم تفعيل حساب الطالب ✅");
  };

  const handleGenerateCodes = async (count) => {
    for(let i=0; i < count; i++) {
      const code = "MAFA-" + Math.random().toString(36).substring(2, 9).toUpperCase();
      await addDoc(collection(db, "activationCodes"), {
        code, isUsed: false, usedBy: null, createdAt: serverTimestamp(), type: "FullAccess"
      });
    }
    alert(`تم توليد ${count} كود`);
  };

  return (
    <div className="admin-app-wrapper" style={{direction: 'rtl'}}>
      <aside className="cyber-sidebar">
        <div className="brand">
          <ShieldCheck color="#00f2ff" size={32} />
          <span>MAFA CONTROL</span>
        </div>
        <nav className="side-nav">
          <button onClick={() => setActiveSection('stats')} className={activeSection === 'stats' ? 'active' : ''}><LayoutDashboard size={20}/> الإحصائيات</button>
          <button onClick={() => setActiveSection('users')} className={activeSection === 'users' ? 'active' : ''}><Users size={20}/> الطلاب</button>
          <button onClick={() => setActiveSection('content')} className={activeSection === 'content' ? 'active' : ''}><PackagePlus size={20}/> المحتوى</button>
          <button onClick={() => setActiveSection('payments')} className={activeSection === 'payments' ? 'active' : ''}>
            <Wallet size={20}/> الدفع {stats.pending > 0 && <span className="notif-pulse">{stats.pending}</span>}
          </button>
          <button onClick={() => setActiveSection('codes')} className={activeSection === 'codes' ? 'active' : ''}><Hash size={20}/> الأكواد</button>
        </nav>
      </aside>

      <main className="admin-body">
        <header className="top-bar">
          <div className="admin-welcome">
            <h2>لوحة القائد محمود</h2>
            <p>تحكم كامل في منصة MAFA التعليمية</p>
          </div>
          <div className="security-toggle-header">
             <span>حماية العلامة المائية:</span>
             <button 
                onClick={() => setSecuritySettings({watermark: !securitySettings.watermark})}
                className={securitySettings.watermark ? 'btn-secure-on' : 'btn-secure-off'}
             >
                {securitySettings.watermark ? <ShieldCheck size={18}/> : <ShieldAlert size={18}/>}
                {securitySettings.watermark ? "نشط" : "معطل"}
             </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {/* 1. الإحصائيات */}
          {activeSection === 'stats' && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} className="stats-container">
              <div className="stats-grid-pro">
                <StatCard icon={<Users/>} title="طلاب المنصة" value={stats.students} color="blue" />
                <StatCard icon={<BookOpen/>} title="الكورسات" value={stats.courses} color="purple" />
                <StatCard icon={<FileText/>} title="المكتبة" value={stats.books} color="green" />
                <StatCard icon={<DollarSign/>} title="مبيعات (ج.م)" value={stats.income} color="orange" />
              </div>
            </motion.div>
          )}

          {/* 2. إدارة المحتوى (إضافة كورس/كتاب) */}
          {activeSection === 'content' && (
            <motion.div initial={{opacity:0, y: 20}} animate={{opacity:1, y: 0}} className="section-card">
              <h3>📦 إضافة محتوى جديد (كورس / كتب)</h3>
              <form onSubmit={handleAddContent} className="admin-content-form">
                <div className="form-row">
                  <select value={newContent.type} onChange={(e)=>setNewContent({...newContent, type: e.target.value})}>
                    <option value="course">كورس فيديو</option>
                    <option value="book">كتاب / مذكرة (PDF)</option>
                  </select>
                  <input type="text" placeholder="عنوان المحتوى" required value={newContent.title} onChange={(e)=>setNewContent({...newContent, title: e.target.value})} />
                </div>
                <div className="form-row">
                  <select value={newContent.grade} onChange={(e)=>setNewContent({...newContent, grade: e.target.value})}>
                    <option value="1">أولى ثانوي</option>
                    <option value="2">ثانية ثانوي</option>
                    <option value="3">ثالثة ثانوي</option>
                  </select>
                  <input type="text" placeholder="اسم المدرس" value={newContent.instructor} onChange={(e)=>setNewContent({...newContent, instructor: e.target.value})} />
                </div>
                <input type="text" placeholder="رابط الفيديو أو ملف الـ PDF" required value={newContent.url} onChange={(e)=>setNewContent({...newContent, url: e.target.value})} />
                <input type="text" placeholder="رابط الصورة المصغرة (Thumbnail)" value={newContent.thumbnail} onChange={(e)=>setNewContent({...newContent, thumbnail: e.target.value})} />
                <button type="submit" className="btn-add-content"><Plus size={18}/> نشر المحتوى الآن</button>
              </form>
            </motion.div>
          )}

          {/* 3. الطلاب */}
          {activeSection === 'users' && (
            <div className="section-card">
              <div className="card-header">
                <h3>إدارة الطلاب</h3>
                <div className="filter-group">
                  <select onChange={(e)=>setFilterGrade(e.target.value)}><option value="all">كل الصفوف</option><option value="1">أولى</option><option value="2">ثانية</option><option value="3">ثالثة</option></select>
                  <div className="search-wrapper"><Search size={16}/><input placeholder="ابحث..." onChange={(e)=>setSearchTerm(e.target.value)}/></div>
                </div>
              </div>
              <table className="modern-table">
                <thead><tr><th>الطالب</th><th>الصف</th><th>الحالة</th><th>إجراء</th></tr></thead>
                <tbody>
                  {allUsers.filter(u => (filterGrade === 'all' || u.grade === filterGrade) && u.name?.toLowerCase().includes(searchTerm.toLowerCase())).map(user => (
                    <tr key={user.id}>
                      <td>{user.name} <br/> <small>{user.email}</small></td>
                      <td>{user.grade || "3"} ث</td>
                      <td><span className={`status-pill ${user.isSecondaryActive ? 'active' : 'locked'}`}>{user.isSecondaryActive ? 'نشط' : 'مقفل'}</span></td>
                      <td className="actions-cell">
                        <button onClick={() => updateDoc(doc(db,"users",user.id),{isSecondaryActive: !user.isSecondaryActive})} className="btn-table-icon">
                          {user.isSecondaryActive ? <Lock size={16}/> : <Unlock size={16}/>}
                        </button>
                        <button onClick={() => deleteDoc(doc(db,"users",user.id))} className="btn-delete"><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 4. الدفع والأكواد (تم دمج منطقك السابق) */}
          {activeSection === 'payments' && (
             <div className="section-card">
               <h3>طلبات الدفع المعلقة</h3>
               <div className="payments-grid">
                 {payments.map(p => (
                   <div key={p.id} className="payment-ticket">
                     <h4>{p.studentName}</h4>
                     <button onClick={() => setShowImgModal(p.screenshotUrl)} className="view-receipt"><Eye size={16}/> إيصال الدفع</button>
                     <div className="ticket-actions">
                       <button onClick={() => approvePayment(p.id, p.studentId)} className="btn-approve">تفعيل</button>
                       <button onClick={() => deleteDoc(doc(db,"paymentRequests",p.id))} className="btn-reject"><X size={16}/></button>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
          )}

          {activeSection === 'codes' && (
            <div className="section-card">
               <div className="card-header">
                 <h3>أكواد التفعيل</h3>
                 <div className="btn-group">
                   <button onClick={exportCodes} className="btn-export"><Download size={16}/> ملف الأكواد</button>
                   <button onClick={() => handleGenerateCodes(parseInt(batchCount))} className="btn-primary">توليد {batchCount} كود</button>
                   <input type="number" className="batch-input" value={batchCount} onChange={(e)=>setBatchCount(e.target.value)} />
                 </div>
               </div>
               <div className="codes-flow">
                 {generatedCodes.map(c => (
                   <div key={c.id} className={`mini-code-card ${c.isUsed ? 'is-used' : ''}`}>
                     <code>{c.code}</code>
                     {c.isUsed ? <UserCheck size={14}/> : <button onClick={()=>deleteDoc(doc(db,"activationCodes",c.id))}><Trash2 size={14}/></button>}
                   </div>
                 ))}
               </div>
            </div>
          )}
        </AnimatePresence>

        {showImgModal && (
          <div className="img-modal-overlay" onClick={() => setShowImgModal(null)}>
            <div className="modal-content"><img src={showImgModal} alt="إيصال" /></div>
          </div>
        )}
      </main>
    </div>
  );
};

const StatCard = ({icon, title, value, color}) => (
  <div className={`stat-card-new ${color}`}>
    <div className="s-icon">{icon}</div>
    <div className="s-data"><h4>{value}</h4><p>{title}</p></div>
  </div>
);

export default AdminDash;
