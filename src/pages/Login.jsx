import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore'; // أضفنا setDoc
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); // حالة التحميل
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. تسجيل الدخول
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. جلب بيانات المستخدم من Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const role = userDoc.data().role;
        // التوجيه بناءً على الرتبة
        if (role === 'admin') navigate('/admin');
        else if (role === 'teacher') navigate('/teacher-dash');
        else navigate('/student-dash');
      } else {
        // 3. إذا كان المستخدم مسجل في Auth ولكن ليس له بيانات في Firestore (حالة نادرة)
        // نقوم بإنشاء بروفايل افتراضي له كطالب غير نشط
        await setDoc(userDocRef, {
          email: user.email,
          role: 'student',
          isActive: false, // لا يمكنه فتح الثانوي إلا بعد التفعيل
          createdAt: new Date()
        });
        navigate('/student-dash');
      }
    } catch (error) {
      // ترجمة بعض الأخطاء الشائعة
      let msg = "حدث خطأ ما";
      if (error.code === 'auth/user-not-found') msg = "هذا الحساب غير موجود";
      else if (error.code === 'auth/wrong-password') msg = "كلمة المرور غير صحيحة";
      alert(msg + ": " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-box glass-card floating">
        <h2 className="glitch">تسجيل الدخول</h2>
        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label>البريد الإلكتروني</label>
            <input 
              type="email" 
              placeholder="example@mail.com"
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="input-group">
            <label>كلمة المرور</label>
            <input 
              type="password" 
              placeholder="********"
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? "جاري الدخول..." : "دخول للمنصة"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;