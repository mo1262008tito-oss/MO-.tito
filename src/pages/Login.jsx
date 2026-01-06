import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  GoogleAuthProvider, 
  signInWithPopup,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { 
  LogIn, UserPlus, Mail, Lock, User, Sparkles, 
  Phone, Users, GraduationCap, CheckCircle, ArrowRight 
} from 'lucide-react';
import './Login.css';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // البيانات الأساسية
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // بيانات الملف الشخصي (للتسجيل الجديد أو إكمال بيانات جوجل)
  const [phone, setPhone] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [studentLevel, setStudentLevel] = useState('');
  const [tempUser, setTempUser] = useState(null); // لحفظ بيانات مستخدم جوجل مؤقتاً

  // --- 1. وظيفة تسجيل الدخول بجوجل ---
  const handleGoogleSignIn = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (userDoc.exists()) {
        // إذا كان المستخدم موجوداً مسبقاً ولديه بيانات كاملة
        if (userDoc.data().level) {
          navigate('/student-dash');
        } else {
          // إذا سجل بجوجل سابقاً لكنه لم يكمل بيانات الهاتف والصف
          setTempUser(user);
          setShowCompleteProfile(true);
        }
      } else {
        // مستخدم جديد تماماً عبر جوجل
        setTempUser(user);
        setShowCompleteProfile(true);
      }
    } catch (error) {
      alert("خطأ في تسجيل جوجل: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- 2. وظيفة إنشاء حساب / تسجيل دخول بريدي ---
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/student-dash');
      } else {
        if (!studentLevel) throw new Error("يرجى اختيار الصف الدراسي");
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        
        await saveUserToFirestore(userCredential.user.uid, {
          name, email, phone, parentPhone, level: studentLevel
        });
        navigate('/student-dash');
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- 3. وظيفة حفظ البيانات النهائية ---
  const saveUserToFirestore = async (uid, data) => {
    await setDoc(doc(db, "users", uid), {
      uid,
      name: data.name,
      email: data.email,
      phone: data.phone,
      parentPhone: data.parentPhone,
      level: data.level,
      role: 'student',
      isSecondaryActive: false,
      createdAt: serverTimestamp(),
      points: 0
    });
  };

  // --- 4. إكمال ملف مستخدم جوجل ---
  const handleCompleteGoogleProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await saveUserToFirestore(tempUser.uid, {
        name: tempUser.displayName,
        email: tempUser.email,
        phone,
        parentPhone,
        level: studentLevel
      });
      navigate('/student-dash');
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="bg-glow"></div>
      
      <AnimatePresence mode="wait">
        {!showCompleteProfile ? (
          <motion.div 
            key="auth-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, x: -100 }}
            className="login-container"
          >
            <div className="login-card">
              <div className="card-header">
                <div className="logo-box">
                  <Sparkles className="icon-neon" size={32} />
                </div>
                <h2>{isLogin ? 'مرحباً بك مجدداً' : 'إنشاء حساب جديد'}</h2>
                <p>{isLogin ? 'سجل دخولك لمتابعة دروسك' : 'ابدأ رحلتك التعليمية معنا الآن'}</p>
              </div>

              <form onSubmit={handleAuth} className="auth-form">
                {!isLogin && (
                  <>
                    <div className="input-group">
                      <User className="input-icon" />
                      <input type="text" placeholder="الاسم الكامل" value={name} onChange={(e)=>setName(e.target.value)} required />
                    </div>
                    <div className="input-group">
                      <Phone className="input-icon" />
                      <input type="tel" placeholder="رقم هاتفك" value={phone} onChange={(e)=>setPhone(e.target.value)} required />
                    </div>
                    <div className="input-group">
                      <Users className="input-icon" />
                      <input type="tel" placeholder="رقم ولي الأمر" value={parentPhone} onChange={(e)=>setParentPhone(e.target.value)} required />
                    </div>
                    <div className="input-group">
                      <GraduationCap className="input-icon" />
                      <select value={studentLevel} onChange={(e)=>setStudentLevel(e.target.value)} required>
                        <option value="">اختر صفك الدراسي</option>
                        <option value="1">الصف الأول الثانوي</option>
                        <option value="2">الصف الثاني الثانوي</option>
                        <option value="3">الصف الثالث الثانوي</option>
                      </select>
                    </div>
                  </>
                )}

                <div className="input-group">
                  <Mail className="input-icon" />
                  <input type="email" placeholder="البريد الإلكتروني" value={email} onChange={(e)=>setEmail(e.target.value)} required />
                </div>
                <div className="input-group">
                  <Lock className="input-icon" />
                  <input type="password" placeholder="كلمة المرور" value={password} onChange={(e)=>setPassword(e.target.value)} required />
                </div>

                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'جاري التحميل...' : (isLogin ? 'دخول آمن' : 'إنشاء الحساب')}
                </button>
              </form>

              <div className="divider"><span>أو عبر</span></div>

              <button onClick={handleGoogleSignIn} className="btn-google" type="button">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/layout/google.png" alt="" />
                متابعة باستخدام جوجل
              </button>

              <div className="toggle-auth">
                <button onClick={() => setIsLogin(!isLogin)}>
                  {isLogin ? 'لا تملك حساباً؟ انضم إلينا' : 'لديك حساب؟ سجل دخولك'}
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="complete-profile"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            className="login-container"
          >
            <div className="login-card profile-complete">
              <div className="card-header">
                <CheckCircle className="icon-success" size={40} />
                <h2>خطوة أخيرة يا بطل!</h2>
                <p>أهلاً {tempUser?.displayName}، نحتاج لبعض البيانات لإكمال ملفك</p>
              </div>

              <form onSubmit={handleCompleteGoogleProfile} className="auth-form">
                <div className="input-group">
                  <Phone className="input-icon" />
                  <input type="tel" placeholder="رقم هاتفك الشخصي" value={phone} onChange={(e)=>setPhone(e.target.value)} required />
                </div>
                <div className="input-group">
                  <Users className="input-icon" />
                  <input type="tel" placeholder="رقم هاتف ولي الأمر" value={parentPhone} onChange={(e)=>setParentPhone(e.target.value)} required />
                </div>
                <div className="input-group">
                  <GraduationCap className="input-icon" />
                  <select value={studentLevel} onChange={(e)=>setStudentLevel(e.target.value)} required>
                    <option value="">اختر صفك الدراسي</option>
                    <option value="1">الصف الأول الثانوي</option>
                    <option value="2">الصف الثاني الثانوي</option>
                    <option value="3">الصف الثالث الثانوي</option>
                  </select>
                </div>
                <button type="submit" className="btn-primary">
                  حفظ البيانات والدخول <ArrowRight size={18} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;

