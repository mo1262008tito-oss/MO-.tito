import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './Login.css'; // تأكد من إضافة التنسيقات التي أرسلتها لك

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // صلاحيات النظام
  const ADMIN_EMAIL = "admin@mafatec.com";
  const TEACHER_EMAIL = "teacher@mafatec.com";

  /**
   * إنشاء أو تحديث مستند المستخدم في Firestore
   * تم إضافة حقول الواحة (XP, Tasbih, Hifz) لضمان عمل المجتمع الديني
   */
  const createOrUpdateUserDB = async (user) => {
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      let role = 'student';
      if (user.email === ADMIN_EMAIL) role = 'admin';
      if (user.email === TEACHER_EMAIL) role = 'teacher';

      const initialData = {
        uid: user.uid,
        displayName: user.displayName || "مستكشف نوري",
        email: user.email,
        photoURL: user.photoURL || "",
        role: role,
        isActive: true,
        createdAt: serverTimestamp(),
        
        // --- بيانات التعليم والمنصة ---
        progress: { completedLessons: [], overallPercentage: 0 },
        points: 0,

        // --- بيانات الواحة والمجتمع (الإضافة الجديدة) ---
        xp: 0,                // نقاط النور للوحة الشرف
        totalTasbih: 0,        // إجمالي التسبيحات التاريخي
        lastHifz: {            // متابعة حفظ القرآن
          surah: "الفاتحة",
          ayah: 1
        },
        dailyWorship: []       // سجل العبادات اليومية
      };

      await setDoc(userDocRef, initialData);
      return role;
    }
    
    return userDoc.data().role;
  };

  // الدخول بواسطة جوجل
  const handleGoogleSignIn = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const role = await createOrUpdateUserDB(result.user);
      
      // التوجيه بناءً على الصلاحية
      if (role === 'admin') navigate('/admin');
      else if (role === 'teacher') navigate('/teacher-dash');
      else navigate('/student-dash');
      
    } catch (error) { 
      alert("خطأ في تسجيل الدخول بواسطة جوجل: " + error.message); 
    } finally {
      setLoading(false);
    }
  };

  // الدخول أو التسجيل اليدوي
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let user;
      try {
        // محاولة تسجيل الدخول أولاً
        const res = await signInWithEmailAndPassword(auth, email, password);
        user = res.user;
      } catch (signInError) {
        // إذا فشل (مستخدم جديد)، يتم إنشاء حساب
        if (signInError.code === 'auth/user-not-found' || signInError.code === 'auth/invalid-credential') {
          const res = await createUserWithEmailAndPassword(auth, email, password);
          user = res.user;
        } else {
          throw signInError;
        }
      }
      
      const role = await createOrUpdateUserDB(user);
      navigate(role === 'admin' ? '/admin' : role === 'teacher' ? '/teacher-dash' : '/student-dash');
      
    } catch (error) { 
      alert("حدث خطأ: " + error.message); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="future-login-wrapper">
      {/* دوائر الطاقة المتحركة في الخلفية */}
      <div className="energy-orb orb-1"></div>
      <div className="energy-orb orb-2"></div>

      <div className="floating-card-3d">
        <div className="card-content">
          <div className="brand-logo">
            <div className="logo-icon-3d">🚀</div>
            <h1 className="cyber-title">MAFA TEC</h1>
            <p className="cyber-subtitle">نظام التعلم المستقبلي</p>
          </div>

          <button onClick={handleGoogleSignIn} className="google-futuristic-btn" disabled={loading}>
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
            <span>Identity Sync with Google</span>
          </button>

          <div className="cyber-divider">
            <span>OR MANUAL ACCESS</span>
          </div>

          <form onSubmit={handleAuth} className="futuristic-form">
            <div className="cyber-input-wrapper">
              <input 
                type="email" 
                placeholder="Terminal Email" 
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
              <div className="input-glow"></div>
            </div>
            
            <div className="cyber-input-wrapper">
              <input 
                type="password" 
                placeholder="Access Code" 
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
              <div className="input-glow"></div>
            </div>

            <button type="submit" className="neon-submit-btn" disabled={loading}>
              {loading ? <div className="spinner"></div> : "INITIALIZE LOGIN"}
            </button>
          </form>
          
          <p className="auth-note">
            * سيتم إنشاء حساب جديد تلقائياً إذا لم تكن مسجلاً
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;


