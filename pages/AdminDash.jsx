import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase'; 
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  updateDoc, 
  query, 
  where 
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const AdminDash = () => {
  const [activeTab, setActiveTab] = useState('stats');
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState([]); // أضفنا الحالة لطلبات الدفع
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newCourse, setNewCourse] = useState({ name: '', instructor: '', price: '', category: 'علمي' });
  const navigate = useNavigate();

  // 1. جلب البيانات لحظياً
  useEffect(() => {
    const unsubCourses = onSnapshot(collection(db, "courses"), (snap) => {
      setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const q = query(collection(db, "users"), where("role", "==", "student"));
    const unsubStudents = onSnapshot(q, (snap) => {
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    // جلب طلبات الدفع المعلقة
    const qPay = query(collection(db, "paymentRequests"), where("status", "==", "pending"));
    const unsubPay = onSnapshot(qPay, (snap) => {
      setPaymentRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubCourses(); unsubStudents(); unsubPay(); };
  }, []);

  // 2. الدوال التنفيذية
  const generateActivationCode = async () => {
    const code = "MAFA-" + Math.random().toString(36).substring(2, 10).toUpperCase();
    try {
      await addDoc(collection(db, "activationCodes"), {
        code: code,
        isUsed: false,
        createdAt: new Date(),
        type: "high-school"
      });
      alert(`✅ تم إنشاء كود جديد: ${code}`);
    } catch (e) {
      console.error(e);
    }
  };

  const approvePayment = async (studentId, requestId) => {
    try {
      const userRef = doc(db, "users", studentId);
      await updateDoc(userRef, { isActive: true });
      const reqRef = doc(db, "paymentRequests", requestId);
      await updateDoc(reqRef, { status: "approved" });
      alert("✅ تم تفعيل حساب الطالب بنجاح!");
    } catch (e) {
      alert("خطأ في التفعيل");
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const userRef = doc(db, "users", id);
    await updateDoc(userRef, { isActive: !currentStatus });
  };

  const handleLogout = () => {
    signOut(auth).then(() => navigate('/login'));
  };

  const handleAddCourse = async () => {
    await addDoc(collection(db, "courses"), newCourse);
    setShowModal(false);
    setNewCourse({ name: '', instructor: '', price: '', category: 'علمي' });
  };

  return (
    <div className="admin-wrapper" style={{ direction: 'rtl', padding: '100px 5%', color: '#fff' }}>
      
      {/* الهيدر */}
      <div className="admin-header glass-card" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', padding: '20px' }}>
        <div>
          <h1 style={{ color: '#f1c40f' }}>⚙️ لوحة الإدارة العليا</h1>
          <p>إجمالي الطلاب: {students.length} | الكورسات: {courses.length}</p>
        </div>
        <div style={{display: 'flex', gap: '10px'}}>
            <button className="active-btn" onClick={generateActivationCode}>🎫 توليد كود شحن</button>
            <button className="active-btn" style={{background: '#e74c3c'}} onClick={handleLogout}>تسجيل الخروج</button>
        </div>
      </div>

      <div className="admin-layout" style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '20px' }}>
        
        {/* السايد بار */}
        <aside className="admin-sidebar glass-card">
          <ul style={{ listStyle: 'none', padding: '10px' }}>
            <li className={`side-item ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>📊 الإحصائيات</li>
            <li className={`side-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>👥 إدارة الطلاب</li>
            <li className={`side-item ${activeTab === 'courses' ? 'active' : ''}`} onClick={() => setActiveTab('courses')}>🎥 إدارة الكورسات</li>
            <li className={`side-item ${activeTab === 'payments' ? 'active' : ''}`} onClick={() => setActiveTab('payments')}>💳 المدفوعات ({paymentRequests.length})</li>
          </ul>
        </aside>

        {/* المحتوى الرئيسي */}
        <main className="admin-content">
          
          {/* تبويب الطلاب */}
          {activeTab === 'users' && (
            <div className="glass-card">
              <h3>👥 الطلاب المسجلين</h3>
              <table style={{ width: '100%', marginTop: '20px', textAlign: 'right', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ color: '#f1c40f', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{padding: '10px'}}>الاسم</th>
                    <th>الإيميل</th>
                    <th>الحالة</th>
                    <th>الإجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{padding: '15px 10px'}}>{s.name}</td>
                      <td>{s.email}</td>
                      <td>
                        <span style={{ color: s.isActive ? '#2ecc71' : '#e74c3c' }}>
                          {s.isActive ? 'نشط' : 'معلق'}
                        </span>
                      </td>
                      <td>
                        <button className="active-btn" style={{padding: '5px 10px', fontSize: '0.8rem'}} onClick={() => handleToggleStatus(s.id, s.isActive)}>
                          {s.isActive ? 'إيقاف' : 'تفعيل'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* تبويب المدفوعات */}
          {activeTab === 'payments' && (
            <div className="glass-card">
              <h3>💳 طلبات التفعيل المعلقة</h3>
              <div className="courses-grid" style={{marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                {paymentRequests.length > 0 ? paymentRequests.map(req => (
                  <div key={req.id} className="glass-card" style={{padding: '15px', border: '1px solid #f1c40f'}}>
                    <h4>الطالب: {req.studentName}</h4>
                    <p style={{fontSize: '0.8rem', color: '#aaa'}}>تاريخ الطلب: {req.createdAt?.toDate().toLocaleDateString()}</p>
                    <button className="active-btn" style={{width: '100%', marginTop: '10px'}} onClick={() => approvePayment(req.studentId, req.id)}>
                      ✅ تفعيل الطالب الآن
                    </button>
                  </div>
                )) : <p>لا توجد طلبات معلقة حالياً.</p>}
              </div>
            </div>
          )}

          {/* تبويب الكورسات */}
          {activeTab === 'courses' && (
            <div className="glass-card">
               <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <h3>📚 الكورسات الحالية</h3>
                  <button className="active-btn" onClick={() => setShowModal(true)}>+ كورس جديد</button>
               </div>
               <div className="courses-grid" style={{marginTop: '20px'}}>
                  {courses.map(c => (
                    <div key={c.id} className="glass-card" style={{padding: '10px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between'}}>
                      <span>{c.name} - {c.instructor}</span>
                      <span style={{color: '#2ecc71'}}>{c.price} ج.م</span>
                    </div>
                  ))}
               </div>
            </div>
          )}
        </main>
      </div>

      {/* مودال إضافة كورس (مبسط) */}
      {showModal && (
        <div className="modal-overlay" style={{position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000}}>
          <div className="glass-card" style={{width: '400px', padding: '30px'}}>
            <h3>إضافة كورس جديد</h3>
            <input type="text" placeholder="اسم الكورس" className="search-input" style={{width: '100%', margin: '10px 0'}} onChange={(e) => setNewCourse({...newCourse, name: e.target.value})} />
            <input type="text" placeholder="اسم المدرس" className="search-input" style={{width: '100%', margin: '10px 0'}} onChange={(e) => setNewCourse({...newCourse, instructor: e.target.value})} />
            <input type="number" placeholder="السعر" className="search-input" style={{width: '100%', margin: '10px 0'}} onChange={(e) => setNewCourse({...newCourse, price: e.target.value})} />
            <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
              <button className="active-btn" onClick={handleAddCourse}>حفظ</button>
              <button className="active-btn" style={{background: '#666'}} onClick={() => setShowModal(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDash;