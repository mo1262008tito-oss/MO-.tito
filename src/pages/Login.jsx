import React, { useState, useEffect } from 'react';
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
  Code, Heart, ShieldCheck, Briefcase
} from 'lucide-react';
import './Login.css';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // --- حالات البيانات الأساسية ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('student'); // طالب، مبرمج، والد

  // --- حالات بيانات الرتب المخصصة ---
  const [parentPhone, setParentPhone] = useState(''); // خاص بالطالب
  const [studentLevel, setStudentLevel] = useState(''); // خاص بالطالب
  const [specialty, setSpecialty] = useState(''); // خاص بالمبرمج
  const [jobTitle, setJobTitle] = useState(''); // خاص بالوالد والمربي
  
  const [tempUser, setTempUser] = useState(null); // لحفظ بيانات جوجل مؤقتاً

  // --- 1. وظيفة تسجيل الدخول بجوجل ---
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
        // مستخدم جديد بجوجل أو لم يكمل بياناته
        setTempUser(user);
        setShowCompleteProfile(true);
      }
    } catch (error) {
      alert("خطأ في تسجيل جوجل: " + error.message);
    } finally { setLoading(false); }
  };

  // --- 2. وظيفة إنشاء حساب أو تسجيل دخول بريدي ---
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/student-dash');
      } else {
        // التحقق من إجبار البيانات حسب الرتبة
        validateFields();
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        
        const finalData = {
          name, email, phone, role,
          ...(role === 'student' && { parentPhone, level: studentLevel }),
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

  // --- 3. حفظ البيانات في Firestore ---
  const saveUserToFirestore = async (uid, data) => {
    await setDoc(doc(db, "users", uid), {
      uid,
      ...data,
      isAccountActive: true,
      createdAt: serverTimestamp(),
      points: 0,
      balance: 0
    });
  };

  const validateFields = () => {
    if (!phone) throw new Error("رقم الهاتف مطلوب");
    if (role === 'student' && !studentLevel) throw new Error("يرجى اختيار الصف الدراسي");
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
                <div className="logo-box"><Sparkles className="icon-neon" size={32} /></div>
                <h2>{isLogin ? 'دخول المنصة' : 'انضمام عضو جديد'}</h2>
                <p>{isLogin ? 'مرحباً بك مرة أخرى في MAFA' : 'اختر رتبتك وابدأ رحلتك معنا'}</p>
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
                <AnimatePresence>
                  {!isLogin && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}>
                      <div className="input-group">
                        <User className="input-icon" />
                        <input type="text" placeholder="الاسم الرباعي" value={name} onChange={(e)=>setName(e.target.value)} required />
                      </div>
                      <div className="input-group">
                        <Phone className="input-icon" />
                        <input type="tel" placeholder="رقم هاتفك" value={phone} onChange={(e)=>setPhone(e.target.value)} required />
                      </div>

                      {/* حقول متغيرة حسب الرتبة */}
                      {role === 'student' && (
                        <>
                          <div className="input-group">
                            <Users className="input-icon" />
                            <input type="tel" placeholder="رقم هاتف ولي الأمر" value={parentPhone} onChange={(e)=>setParentPhone(e.target.value)} required />
                          </div>
                          <div className="input-group">
                            <GraduationCap className="input-icon" />
                            <select value={studentLevel} onChange={(e)=>setStudentLevel(e.target.value)} required>
                              <option value="">اختر صفك الدراسي</option>
                              <option value="1">الأول الثانوي</option>
                              <option value="2">الثاني الثانوي</option>
                              <option value="3">الثالث الثانوي</option>
                            </select>
                          </div>
                        </>
                      )}

                      {role === 'dev' && (
                        <div className="input-group">
                          <Code className="input-icon" />
                          <input type="text" placeholder="مجال البرمجة (Web/App)" value={specialty} onChange={(e)=>setSpecialty(e.target.value)} required />
                        </div>
                      )}

                      {role === 'parent' && (
                        <div className="input-group">
                          <Briefcase className="input-icon" />
                          <input type="text" placeholder="المهنة / الصفة التربوية" value={jobTitle} onChange={(e)=>setJobTitle(e.target.value)} required />
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="input-group">
                  <Mail className="input-icon" />
                  <input type="email" placeholder="البريد الإلكتروني" value={email} onChange={(e)=>setEmail(e.target.value)} required />
                </div>
                <div className="input-group">
                  <Lock className="input-icon" />
                  <input type="password" placeholder="كلمة المرور" value={password} onChange={(e)=>setPassword(e.target.value)} required />
                </div>

                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'جاري المعالجة...' : (isLogin ? 'تسجيل دخول' : 'إنشاء الحساب الآن')}
                </button>
              </form>

              <div className="divider"><span>أو المتابعة عبر</span></div>

              <button onClick={handleGoogleSignIn} className="btn-google" type="button">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/layout/google.png" alt="google" />
                استخدام حساب جوجل
              </button>

              <div className="toggle-auth">
                <button onClick={() => setIsLogin(!isLogin)}>
                  {isLogin ? 'عضو جديد؟ سجل هنا' : 'بالفعل تملك حساباً؟ دخول'}
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="complete-profile" initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} className="login-container">
            <div className="login-card profile-complete">
              <div className="card-header">
                <ShieldCheck className="icon-success" size={40} />
                <h2>أهلاً {tempUser?.displayName}</h2>
                <p>خطوة أخيرة لتأمين حسابك وتحديد صلاحياتك</p>
              </div>

              <div className="role-selector-v2">
                {['student', 'dev', 'parent'].map((r) => (
                  <button key={r} className={role === r ? 'active' : ''} onClick={() => setRole(r)}>
                    {r === 'student' ? <GraduationCap size={16}/> : r === 'dev' ? <Code size={16}/> : <Heart size={16}/>}
                    {r === 'student' ? 'طالب' : r === 'dev' ? 'مبرمج' : 'مربي'}
                  </button>
                ))}
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                const finalData = {
                  name: tempUser.displayName, email: tempUser.email, phone, role,
                  ...(role === 'student' && { parentPhone, level: studentLevel }),
                  ...(role === 'dev' && { specialty }),
                  ...(role === 'parent' && { jobTitle })
                };
                await saveUserToFirestore(tempUser.uid, finalData);
                navigate('/student-dash');
              }} className="auth-form">
                <div className="input-group"><Phone className="input-icon" /><input type="tel" placeholder="رقم هاتفك" value={phone} onChange={(e)=>setPhone(e.target.value)} required /></div>
                
                {role === 'student' && (
                  <>
                    <div className="input-group"><Users className="input-icon" /><input type="tel" placeholder="رقم ولي الأمر" value={parentPhone} onChange={(e)=>setParentPhone(e.target.value)} required /></div>
                    <div className="input-group"><GraduationCap className="input-icon" />
                      <select value={studentLevel} onChange={(e)=>setStudentLevel(e.target.value)} required>
                        <option value="">اختر صفك</option>
                        <option value="1">1 ثانوي</option><option value="2">2 ثانوي</option><option value="3">3 ثانوي</option>
                      </select>
                    </div>
                  </>
                )}
                <button type="submit" className="btn-primary">حفظ وإكمال الدخول <ArrowRight size={18} /></button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;
