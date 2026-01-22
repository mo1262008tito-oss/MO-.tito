import React, { useState, useEffect, useMemo } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  GoogleAuthProvider, 
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { 
  LogIn, UserPlus, Mail, Lock, User, Sparkles, 
  Phone, Users, GraduationCap, CheckCircle, ArrowRight,
  Code, Heart, ShieldCheck, Briefcase, MapPin, BookOpen, Fingerprint
} from 'lucide-react';
import './Login.css';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // --- States ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('student');
  const [parentPhone, setParentPhone] = useState('');
  const [studentLevel, setStudentLevel] = useState('');
  const [major, setMajor] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [tempUser, setTempUser] = useState(null);

  const educationLevels = [
    { label: 'المرحلة الابتدائية', levels: ['1 ابتدائي', '2 ابتدائي', '3 ابتدائي', '4 ابتدائي', '5 ابتدائي', '6 ابتدائي'] },
    { label: 'المرحلة الإعدادية', levels: ['1 إعدادي', '2 إعدادي', '3 إعدادي'] },
    { label: 'المرحلة الثانوية', levels: ['1 ثانوي', '2 ثانوي', '3 ثانوي'] }
  ];

  const needsMajor = useMemo(() => studentLevel === '2 ثانوي' || studentLevel === '3 ثانوي', [studentLevel]);

  // --- 1. نظام المعالجة العالمي (Global Logic) ---
  const handleGlobalErrors = (error) => {
    const errorMap = {
      'auth/user-not-found': "لم نجد هذا الحساب.. جاري تحويلك لإنشاء حساب جديد ✨",
      'auth/wrong-password': "كلمة المرور غير صحيحة.. حاول مرة أخرى 🔐",
      'auth/invalid-credential': "بيانات الدخول غير دقيقة.. تأكد من بريدك 📧",
      'auth/popup-closed-by-user': "تم إغلاق نافذة جوجل.. يرجى المحاولة مرة أخرى",
      'auth/email-already-in-use': "هذا البريد مسجل بالفعل.. جرب الدخول المباشر",
      'custom/incomplete': "يرجى ملء جميع البيانات المطلوبة لتأمين حسابك",
    };

    if (error.code === 'auth/user-not-found') {
      toast.error(errorMap[error.code]);
      setTimeout(() => setIsLogin(false), 2000);
    } else {
      toast.error(errorMap[error.code] || "حدث خطأ في النظام.. يرجى التواصل مع الدعم");
    }
  };

  const saveUserToFirestore = async (uid, data) => {
    await setDoc(doc(db, "users", uid), {
      uid,
      ...data,
      isAccountActive: true,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      points: 0,
      balance: 0,
      searchName: data.name?.toLowerCase() || ""
    });
  };

  // --- 2. وظيفة جوجل (الدخول الذكي) ---
  const handleGoogleSignIn = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (userDoc.exists() && userDoc.data().phone) {
        toast.success(`مرحباً بعودتك يا ${user.displayName.split(' ')[0]} 🚀`);
        navigate('/student-dash');
      } else {
        // إذا كان الحساب جديداً أو بياناته ناقصة (لا نسمح بالدخول)
        setTempUser(user);
        setShowCompleteProfile(true);
        toast("خطوة أخيرة لتأمين حسابك المطور..", { icon: '🛡️' });
      }
    } catch (error) {
      handleGlobalErrors(error);
    } finally { setLoading(false); }
  };

  // --- 3. الوظيفة الرئيسية (يدوي) ---
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success("تم الدخول إلى عالم  MaFa بنجاح");
        navigate('/student-dash');
      } else {
        if (phone.length < 11) throw { code: 'custom/incomplete' };
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        
        const finalData = {
          name, email, phone, role,
          ...(role === 'student' && { parentPhone, level: studentLevel, major: needsMajor ? major : 'عام', schoolName }),
        };

        await saveUserToFirestore(userCredential.user.uid, finalData);
        toast.success("مبارك! تم إنشاء هويتك الرقمية بنجاح 🎓");
        navigate('/student-dash');
      }
    } catch (error) {
      handleGlobalErrors(error);
    } finally { setLoading(false); }
  };

  return (
    <div className="login-page">
      <Toaster position="top-center" toastOptions={{ duration: 4000, style: { background: '#1e293b', color: '#fff' } }} />
      <div className="bg-glow"></div>
      
      <AnimatePresence mode="wait">
        {!showCompleteProfile ? (
          <motion.div key="auth-card" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} className="login-container">
            <div className="login-card">
              <div className="card-header">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="logo-box">
                    <Sparkles className="icon-neon" size={32} />
                </motion.div>
                <h2>{isLogin ? 'نظام الدخول الذكي' : 'عضوية تيتان الجديدة'}</h2>
                <p>MAFA: Future of Education</p>
              </div>

              {!isLogin && (
                <div className="role-selector-v2">
                  <button className={role === 'student' ? 'active' : ''} onClick={() => setRole('student')}><GraduationCap size={16} /> طالب</button>
                  <button className={role === 'dev' ? 'active' : ''} onClick={() => setRole('dev')}><Code size={16} /> مبرمج</button>
                  <button className={role === 'parent' ? 'active' : ''} onClick={() => setRole('parent')}><Heart size={16} /> مربي</button>
                </div>
              )}

              <form onSubmit={handleAuth} className="auth-form">
                {!isLogin && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}>
                    <div className="input-group"><User className="input-icon" /><input type="text" placeholder="الاسم الرباعي" value={name} onChange={(e)=>setName(e.target.value)} required /></div>
                    <div className="input-group"><Phone className="input-icon" /><input type="tel" placeholder="رقم واتساب الشخصي" value={phone} onChange={(e)=>setPhone(e.target.value)} required /></div>
                    {role === 'student' && (
                      <>
                        <div className="input-group"><GraduationCap className="input-icon" /><select value={studentLevel} onChange={(e)=>setStudentLevel(e.target.value)} required><option value="">اختر السنة الدراسية</option>{educationLevels.map(group => (<optgroup key={group.label} label={group.label}>{group.levels.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}</optgroup>))}</select></div>
                        {needsMajor && (<div className="input-group"><BookOpen className="input-icon" /><select value={major} onChange={(e)=>setMajor(e.target.value)} required><option value="">اختر التخصص</option><option value="علمي علوم">علمي علوم</option><option value="علمي رياضة">علمي رياضة</option><option value="أدبي">أدبي</option></select></div>)}
                        <div className="input-group"><MapPin className="input-icon" /><input type="text" placeholder="المحافظة / المدرسة" value={schoolName} onChange={(e)=>setSchoolName(e.target.value)} required /></div>
                        <div className="input-group"><Users className="input-icon" /><input type="tel" placeholder="رقم ولي الأمر" value={parentPhone} onChange={(e)=>setParentPhone(e.target.value)} required /></div>
                      </>
                    )}
                  </motion.div>
                )}
                <div className="input-group"><Mail className="input-icon" /><input type="email" placeholder="البريد الإلكتروني" value={email} onChange={(e)=>setEmail(e.target.value)} required /></div>
                <div className="input-group"><Lock className="input-icon" /><input type="password" placeholder="كلمة المرور" value={password} onChange={(e)=>setPassword(e.target.value)} required /></div>
                
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? <div className="loader"></div> : (isLogin ? <><LogIn size={18}/> دخول النظام</> : <><UserPlus size={18}/> تسجيل الهوية</>)}
                </button>
              </form>

              <div className="divider"><span>أو المتابعة السريعة</span></div>
              <button onClick={handleGoogleSignIn} className="btn-google" type="button">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/layout/google.png" width="18" alt="google" />
                الدخول عبر حساب جوجل
              </button>

              <p className="toggle-text">
                {isLogin ? "لا تملك هوية رقمية؟" : "لديك حساب بالفعل؟"} 
                <span onClick={() => setIsLogin(!isLogin)}>{isLogin ? " أنشئها الآن" : " سجل دخولك"}</span>
              </p>
            </div>
          </motion.div>
        ) : (
          /* واجهة إكمال البيانات العالمية لمستخدمي جوجل */
          <motion.div key="complete" initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="login-container">
            <div className="login-card profile-complete">
               <div className="user-badge">
                  <img src={tempUser?.photoURL} alt="user" />
                  <Fingerprint className="badge-icon" />
               </div>
               <h3>مرحباً {tempUser?.displayName.split(' ')[0]}</h3>
               <p>أكمل البيانات الأساسية للوصول إلى لوحتك</p>
               <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (phone.length < 11) return toast.error("رقم الهاتف غير صحيح");
                  setLoading(true);
                  try {
                    const data = { 
                      name: tempUser.displayName, email: tempUser.email, phone, role,
                      ...(role === 'student' && { level: studentLevel, major: needsMajor ? major : 'عام', parentPhone, schoolName })
                    };
                    await saveUserToFirestore(tempUser.uid, data);
                    toast.success("تم تفعيل حسابك بنجاح!");
                    navigate('/student-dash');
                  } catch (err) { handleGlobalErrors(err); }
               }}>
                  <div className="input-group"><Phone className="input-icon" /><input type="tel" placeholder="رقم هاتفك للتفعيل" value={phone} onChange={(e)=>setPhone(e.target.value)} required /></div>
                  <div className="input-group"><GraduationCap className="input-icon" /><select value={studentLevel} onChange={(e)=>setStudentLevel(e.target.value)} required><option value="">اختر السنة الدراسية</option>{educationLevels.map(group => (<optgroup key={group.label} label={group.label}>{group.levels.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}</optgroup>))}</select></div>
                  <button type="submit" className="btn-primary" disabled={loading}>{loading ? "جاري التفعيل..." : "ابدأ رحلتك التعليمية"}</button>
               </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;
