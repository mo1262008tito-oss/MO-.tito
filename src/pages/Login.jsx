import React, { useState, useEffect, useMemo } from 'react';
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
  Code, Heart, ShieldCheck, Briefcase, MapPin, BookOpen
} from 'lucide-react';
import './Login.css';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // --- الحالات الأساسية ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('student');

  // --- بيانات إضافية مميزة ---
  const [parentPhone, setParentPhone] = useState('');
  const [studentLevel, setStudentLevel] = useState('');
  const [major, setMajor] = useState(''); // علمي / أدبي
  const [schoolName, setSchoolName] = useState('');
  const [specialty, setSpecialty] = useState(''); // للمبرمجين
  const [jobTitle, setJobTitle] = useState(''); // للمربين
  const [tempUser, setTempUser] = useState(null);

  // --- تنظيم المراحل الدراسية ---
  const educationLevels = [
    { label: 'المرحلة الابتدائية', levels: ['1 ابتدائي', '2 ابتدائي', '3 ابتدائي', '4 ابتدائي', '5 ابتدائي', '6 ابتدائي'] },
    { label: 'المرحلة الإعدادية', levels: ['1 إعدادي', '2 إعدادي', '3 إعدادي'] },
    { label: 'المرحلة الثانوية', levels: ['1 ثانوي', '2 ثانوي', '3 ثانوي'] }
  ];

  // التحقق مما إذا كان الطالب يحتاج لاختيار تخصص (2 و 3 ثانوي فقط)
  const needsMajor = useMemo(() => {
    return studentLevel === '2 ثانوي' || studentLevel === '3 ثانوي';
  }, [studentLevel]);

  // --- وظيفة جوجل ---
  const handleGoogleSignIn = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (userDoc.exists() && userDoc.data().role) {
        navigate('/student-dash');
      } else {
        setTempUser(user);
        setShowCompleteProfile(true);
      }
    } catch (error) {
      alert("خطأ في جوجل: " + error.message);
    } finally { setLoading(false); }
  };

  // --- وظيفة الحفظ في Firestore ---
  const saveUserToFirestore = async (uid, data) => {
    await setDoc(doc(db, "users", uid), {
      uid,
      ...data,
      isAccountActive: true,
      createdAt: serverTimestamp(),
      points: 0,
      balance: 0,
      searchName: data.name.toLowerCase()
    });
  };

  // --- الوظيفة الرئيسية (دخول / تسجيل) ---
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/student-dash');
      } else {
        if (phone.length < 11) throw new Error("رقم الهاتف غير صحيح");
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        
        const finalData = {
          name, email, phone, role,
          ...(role === 'student' && { parentPhone, level: studentLevel, major: needsMajor ? major : 'عام', schoolName }),
          ...(role === 'dev' && { specialty }),
          ...(role === 'parent' && { jobTitle })
        };

        await saveUserToFirestore(userCredential.user.uid, finalData);
        navigate('/student-dash');
      }
    } catch (error) {
      alert(error.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="login-page">
      <div className="bg-glow"></div>
      
      <AnimatePresence mode="wait">
        {!showCompleteProfile ? (
          <motion.div 
            key="auth-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="login-container"
          >
            <div className="login-card">
              <div className="card-header">
                <div className="logo-box"><Sparkles className="icon-neon" size={32} /></div>
                <h2>{isLogin ? 'مرحباً بعودتك' : 'إنشاء حساب جديد'}</h2>
                <p>منصة MAFA التعليمية الشاملة</p>
              </div>

              {!isLogin && (
                <div className="role-selector-v2">
                  <button className={role === 'student' ? 'active' : ''} onClick={() => setRole('student')}>
                    <GraduationCap size={18} /> <span>طالب</span>
                  </button>
                  <button className={role === 'dev' ? 'active' : ''} onClick={() => setRole('dev')}>
                    <Code size={18} /> <span>مبرمج</span>
                  </button>
                  <button className={role === 'parent' ? 'active' : ''} onClick={() => setRole('parent')}>
                    <Heart size={18} /> <span>مربي</span>
                  </button>
                </div>
              )}

              <form onSubmit={handleAuth} className="auth-form">
                {!isLogin && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="input-group">
                      <User className="input-icon" size={18} />
                      <input type="text" placeholder="الاسم الكامل" value={name} onChange={(e)=>setName(e.target.value)} required />
                    </div>
                    
                    <div className="input-group">
                      <Phone className="input-icon" size={18} />
                      <input type="tel" placeholder="رقم هاتفك (WhatsApp)" value={phone} onChange={(e)=>setPhone(e.target.value)} required />
                    </div>

                    {role === 'student' && (
                      <>
                        <div className="input-group">
                          <GraduationCap className="input-icon" size={18} />
                          <select value={studentLevel} onChange={(e)=>setStudentLevel(e.target.value)} required>
                            <option value="">اختر الصف الدراسي</option>
                            {educationLevels.map(group => (
                              <optgroup key={group.label} label={group.label}>
                                {group.levels.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                              </optgroup>
                            ))}
                          </select>
                        </div>

                        {needsMajor && (
                          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="input-group">
                            <BookOpen className="input-icon" size={18} />
                            <select value={major} onChange={(e)=>setMajor(e.target.value)} required>
                              <option value="">تحديد التخصص</option>
                              <option value="علمي علوم">علمي علوم</option>
                              <option value="علمي رياضة">علمي رياضة</option>
                              <option value="أدبي">أدبي</option>
                            </select>
                          </motion.div>
                        )}

                        <div className="input-group">
                          <MapPin className="input-icon" size={18} />
                          <input type="text" placeholder="اسم المدرسة" value={schoolName} onChange={(e)=>setSchoolName(e.target.value)} required />
                        </div>

                        <div className="input-group">
                          <Users className="input-icon" size={18} />
                          <input type="tel" placeholder="رقم ولي الأمر" value={parentPhone} onChange={(e)=>setParentPhone(e.target.value)} required />
                        </div>
                      </>
                    )}
                  </motion.div>
                )}

                <div className="input-group">
                  <Mail className="input-icon" size={18} />
                  <input type="email" placeholder="البريد الإلكتروني" value={email} onChange={(e)=>setEmail(e.target.value)} required />
                </div>
                
                <div className="input-group">
                  <Lock className="input-icon" size={18} />
                  <input type="password" placeholder="كلمة المرور" value={password} onChange={(e)=>setPassword(e.target.value)} required />
                </div>

                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'جاري التحميل...' : (isLogin ? 'دخول' : 'تسجيل مجاني')}
                </button>
              </form>

              <div className="divider"><span>أو</span></div>
              <button onClick={handleGoogleSignIn} className="btn-google" type="button">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/layout/google.png" width="18" alt="" />
                المتابعة عبر جوجل
              </button>

              <p className="toggle-text">
                {isLogin ? "ليس لديك حساب؟" : "تملك حساباً بالفعل؟"}
                <span onClick={() => setIsLogin(!isLogin)}>{isLogin ? " أنشئ حسابك" : " سجل دخولك"}</span>
              </p>
            </div>
          </motion.div>
        ) : (
          /* واجهة إكمال البيانات لمستخدمي جوجل */
          <motion.div key="complete" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="login-container">
            <div className="login-card profile-complete">
               <h3>مرحباً {tempUser?.displayName.split(' ')[0]}!</h3>
               <p>أكمل بياناتك لتخصيص محتواك التعليمي</p>
               <form onSubmit={async (e) => {
                 e.preventDefault();
                 setLoading(true);
                 const data = { 
                   name: tempUser.displayName, email: tempUser.email, phone, role,
                   ...(role === 'student' && { level: studentLevel, major, parentPhone, schoolName })
                 };
                 await saveUserToFirestore(tempUser.uid, data);
                 navigate('/student-dash');
               }}>
                 {/* تكرار حقول الرتبة هنا مثل الأعلى لضمان الدقة */}
                 <div className="input-group"><Phone className="input-icon" /><input type="tel" placeholder="رقم هاتفك" value={phone} onChange={(e)=>setPhone(e.target.value)} required /></div>
                 <button type="submit" className="btn-primary">ابدأ الآن</button>
               </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;