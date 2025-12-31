import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from "firebase/firestore";

const SecondarySchool = () => {
  const [hasAccess, setHasAccess] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    const user = auth.currentUser;
    if (user) {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists() && userDoc.data().isActive) {
        setHasAccess(true);
      }
    }
    setLoading(false);
  };

  const handleVerifyCode = async () => {
    const q = query(collection(db, "activationCodes"), where("code", "==", inputCode), where("isUsed", "==", false));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const codeDoc = querySnapshot.docs[0];
      // 1. تحديث الكود ليصبح مستخدم
      await updateDoc(doc(db, "activationCodes", codeDoc.id), { isUsed: true });
      // 2. تفعيل حساب الطالب
      // داخل صفحة التفعيل عند الطالب
const handleFileUpload = async (e) => {
  const file = e.target.files[0];
  // هنا نرفع الصورة لـ Firebase Storage ثم نرسل طلباً لـ Firestore
  const paymentRef = collection(db, "paymentRequests");
  await addDoc(paymentRef, {
    studentId: auth.currentUser.uid,
    studentName: auth.currentUser.displayName,
    screenshotUrl: "رابط_الصورة", // يفضل رفعها لـ Storage أولاً
    status: "pending",
    timestamp: new Date()
  });
  alert("تم إرسال طلب التفعيل، انتظر مراجعة الإدارة.");
};
      await updateDoc(doc(db, "users", auth.currentUser.uid), { isActive: true });
      
      setHasAccess(true);
      alert("تم تفعيل الحساب بنجاح! استمتع بالكورسات.");
    } else {
      alert("الكود غير صحيح أو مستخدم من قبل.");
    }
  };

  if (loading) return <div className="loader">جاري التحقق...</div>;

  if (!hasAccess) {
    return (
      <div className="login-page-wrapper" style={{ direction: 'rtl' }}>
        <div className="login-box glass-card floating" style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#f1c40f' }}>⚠️ المحتوى مغلق</h2>
          <p>هذا القسم مخصص للطلاب المشتركين فقط.</p>
          <div className="login-form">
            <input 
              type="text" 
              placeholder="أدخل كود التفعيل هنا..." 
              className="search-input" 
              style={{ width: '100%', marginBottom: '15px' }}
              onChange={(e) => setInputCode(e.target.value)}
            />
            <button className="active-btn" style={{ width: '100%' }} onClick={handleVerifyCode}>
              تفعيل الآن
            </button>
            <p style={{ marginTop: '20px', fontSize: '0.8rem' }}>
              للحصول على الكود، يرجى التواصل مع الإدارة أو إتمام عملية الدفع.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-wrapper" style={{ padding: '100px 5%' }}>
      <h1 className="glitch">منصة التعليم الثانوي</h1>
      <div className="courses-grid">
        {/* هنا تضع الكورسات التي جلبناها سابقاً */}
        <p>مرحباً بك! المحتوى التعليمي متاح الآن لك.</p>
      </div>
    </div>
  );
};

export default SecondarySchool;