import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  GoogleAuthProvider, 
  signInWithPopup 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, Mail, Lock, User, Sparkles } from 'lucide-react';
import './Login.css';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const navigate = useNavigate();

  // --- 1. دالة تسجيل الدخول بواسطة جوجل ---
  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // التحقق إذا كان المستخدم جديداً لإنشاء ملف له في قاعدة البيانات
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (!userDoc.exists()) {
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          role: 'student', // الرتبة الافتراضية
          createdAt: new Date(),
          photoURL: user.photoURL
        });
      }
      
      navigate('/'); // التوجه للصفحة الرئيسية بعد النجاح
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/invalid-credential') {
        alert("خطأ في بيانات الاعتماد. تأكد من تفعيل Google Sign-in في Firebase.");
      } else {
        alert("حدث خطأ أثناء تسجيل الدخول بجوجل: " + error.message);
      }
    }
  };

  // --- 2. دالة تسجيل الدخول / إنشاء حساب (البريد وكلمة المرور) ---
  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        // تسجيل دخول
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/');
      } else {
        // إنشاء حساب جديد
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // تحديث اسم المستخدم في الملف الشخصي
        await updateProfile(userCredential.user, { displayName: name });
        
        // إنشاء وثيقة المستخدم في Firestore
        await setDoc(doc(db, "users", userCredential.user.uid), {
          uid: userCredential.user.uid,
          name: name,
          email: email,
          role: 'student',
          createdAt: new Date()
        });
        navigate('/');
      }
    } catch (error) {
      if (error.code === 'auth/invalid-credential') {
        alert("عذراً، البريد الإلكتروني أو كلمة المرور غير صحيحة.");
      } else {
        alert("عذراً، حدث خطأ: " + error.message);
      }
    }
  };

  return (
    <div className="login-page">
      {/* الخلفية المتحركة */}
      <div className="floating-elements">
        <motion.div animate={{ y: [0, -50, 0] }} transition={{ duration: 6, repeat: Infinity }} className="blob blob-1"></motion.div>
        <motion.div animate={{ y: [0, 50, 0] }} transition={{ duration: 8, repeat: Infinity }} className="blob blob-2"></motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="login-container"
      >
        <div className="login-card">
          <div className="card-header">
            <div className="auth-logo">
              <Sparkles size={30} color="#00f2ff" />
            </div>
            <h2>{isLogin ? 'مرحباً بعودتك' : 'انضم إلينا'}</h2>
            <p>{isLogin ? 'سجل دخولك لمواصلة رحلة التعلم' : 'ابدأ رحلتك التعليمية والروحانية اليوم'}</p>
          </div>

          <form onSubmit={handleAuth} className="auth-form">
            {!isLogin && (
              <div className="input-group">
                <User className="input-icon" size={20} />
                <input 
                  type="text" 
                  placeholder="الاسم الكامل" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required 
                />
              </div>
            )}

            <div className="input-group">
              <Mail className="input-icon" size={20} />
              <input 
                type="email" 
                placeholder="البريد الإلكتروني" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>

            <div className="input-group">
              <Lock className="input-icon" size={20} />
              <input 
                type="password" 
                placeholder="كلمة المرور" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>

            <button type="submit" className="auth-submit">
              {isLogin ? <><LogIn size={20} /> دخول</> : <><UserPlus size={20} /> إنشاء حساب</>}
            </button>
          </form>

          {/* الفاصل الزخرفي */}
          <div className="auth-divider">
            <span>أو عبر</span>
          </div>

          {/* زر جوجل الجديد */}
          <button onClick={handleGoogleSignIn} className="google-auth-btn" type="button">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/layout/google.png" alt="Google" />
            تسجيل الدخول بواسطة Google
          </button>

          <div className="auth-toggle">
            <span>{isLogin ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}</span>
            <button onClick={() => setIsLogin(!isLogin)} type="button">
              {isLogin ? 'سجل الآن' : 'سجل دخولك'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;

