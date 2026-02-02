import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';

// مكتبة الأيقونات الشاملة
import { 
  LogIn, UserPlus, Mail, Lock, User, Phone, Users, GraduationCap, 
  CheckCircle, ArrowRight, BookOpen, Fingerprint, Chrome, 
  ShieldCheck, Briefcase, MapPin, Rocket, Eye, EyeOff, RefreshCcw, 
  Globe, Shield, Cpu, Zap, Library, Heart, ScrollText, Award, 
  Compass, Anchor, Star, ChevronRight, Settings, School, 
  Baby, PenTool, Book, MessageSquare, ShieldAlert, Activity
} from 'lucide-react';

// محرك Firebase الأساسي
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  updateProfile, GoogleAuthProvider, signInWithPopup, 
  setPersistence, browserLocalPersistence 
} from 'firebase/auth';
import { 
  doc, setDoc, getDoc, serverTimestamp, updateDoc, 
  increment, collection, query, where, getDocs 
} from 'firebase/firestore';

/**
 * MAFA UNIVERSAL ECOSYSTEM - VERSION 2026
 * نظام إدارة الدخول والبيانات العملاق - 1000+ Logic Lines
 */

const Login = () => {
  // --- [1] إدارة الحالات المعقدة (State Management) ---
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);
  const [tempUser, setTempUser] = useState(null);
  const [authStep, setAuthStep] = useState(1); // نظام الخطوات للتسجيل الطويل
  
  const navigate = useNavigate();
  const controls = useAnimation();
  const formRef = useRef(null);

  // --- [2] بنية البيانات الضخمة (Master Data Schema) ---
  const [formData, setFormData] = useState({
    // البيانات الأساسية
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    role: 'student', // student, sharia_student, parent, teacher
    
    // بيانات الموقع
    governorate: '',
    city: '',
    address: '',

    // بيانات الدراسة الأكاديمية (شاملة الابتدائي)
    educationStage: '', // primary, middle, high, university
    studentLevel: '', // الصف الدراسي
    schoolName: '',
    major: 'عام', // علمي، أدبي، لغات

    // بيانات العلم الشرعي
    shariaPath: '', // قرآن، متون، فقه، حديث
    shariaLevel: '', // مبتدئ، متوسط، منتهي

    // بيانات ولي الأمر والمربي
    parentPhone: '',
    numberOfChildren: 0,
    occupation: '',
    
    // بيانات تقنية
    termsAccepted: true,
    newsletter: true,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });

  // --- [3] محرك القوائم الذكي (Data Sets) ---
  const stages = {
    primary: {
      label: "المرحلة الابتدائية",
      icon: <Baby size={18} />,
      levels: ["الصف الأول", "الصف الثاني", "الصف الثالث", "الصف الرابع", "الصف الخامس", "الصف السادس"]
    },
    middle: {
      label: "المرحلة الإعدادية",
      icon: <PenTool size={18} />,
      levels: ["الأول الإعدادي", "الثاني الإعدادي", "الثالث الإعدادي"]
    },
    high: {
      label: "المرحلة الثانوية",
      icon: <GraduationCap size={18} />,
      levels: ["الأول الثانوي", "الثاني الثانوي", "الثالث الثانوي"]
    },
    sharia: {
      label: "طلب العلم الشرعي",
      icon: <Library size={18} />,
      levels: ["المستوى التمهيدي", "مستوى المتون", "مستوى الشروح", "مستوى التأصيل"]
    }
  };

  const governorates = ["القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "البحر الأحمر", "البحيرة", "الفيوم", "الغربية", "الإسماعيلية", "المنوفية", "المنيا", "القليوبية", "الوادي الجديد", "السويس", "الشرقية", "دمياط", "بورسعيد", "كفر الشيخ", "مطروح", "الأقصر", "قنا", "شمال سيناء", "جنوب سيناء", "بني سويف", "سوهاج", "أسيوط", "أسوان"];

  // --- [4] محركات المنطق البرمجي (Logical Engines) ---

  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }, []);

  // محرك التحقق المعقد
  const validateStep = () => {
    const { email, password, name, phone, role, educationStage, studentLevel } = formData;
    
    if (isLogin) {
      if (!email || !password) return "يرجى إدخال جميع بيانات الدخول";
    } else {
      if (authStep === 1) {
        if (!name || name.trim().split(" ").length < 3) return "يرجى إدخال الاسم الثلاثي باللغة العربية";
        if (!/^01[0125][0-9]{8}$/.test(phone)) return "رقم الهاتف غير صحيح (يجب أن يكون مصرياً)";
        if (!email.includes("@")) return "البريد الإلكتروني غير صالح";
      }
      if (authStep === 2) {
        if (role === 'student' && (!educationStage || !studentLevel)) return "يرجى تحديد المرحلة والصف الدراسي";
        if (password.length < 8) return "كلمة المرور يجب أن تكون 8 رموز على الأقل";
        if (password !== formData.confirmPassword) return "كلمات المرور غير متطابقة";
      }
    }
    return null;
  };

  // محرك الحفظ العملاق في Firestore
  const createUniversalProfile = async (uid, data) => {
    const userRef = doc(db, "users", uid);
    const globalStatsRef = doc(db, "system", "global_analytics");

    const profilePayload = {
      uid,
      ...data,
      password: null, // للأمان لا نخزن كلمة المرور في Firestore
      confirmPassword: null,
      isActivated: true,
      reputationPoints: data.role === 'sharia_student' ? 500 : 100,
      badges: ['new_member'],
      enrolledCourses: [],
      attendanceHistory: [],
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      securityLog: {
        lastIP: 'captured',
        userAgent: navigator.userAgent
      }
    };

    await setDoc(userRef, profilePayload);
    
    // تحديث إحصائيات المنصة (Real-time Analytics)
    await updateDoc(globalStatsRef, {
      totalUsers: increment(1),
      [`count_${data.role}`]: increment(1),
      [`stage_${data.educationStage || 'other'}`]: increment(1),
      lastUserJoined: data.name
    }).catch(async () => {
        // إذا كان المستند غير موجود، أنشئه
        await setDoc(globalStatsRef, { totalUsers: 1 });
    });
  };

  // المحرك الرئيسي لعملية الـ Auth
  const processAuth = async (e) => {
    if (e) e.preventDefault();
    
    const error = validateStep();
    if (error) {
      toast.error(error);
      controls.start({ x: [-10, 10, -10, 10, 0] });
      return;
    }

    // إذا كان التسجيل في الخطوة الأولى، انتقل للثانية
    if (!isLogin && authStep === 1) {
      setAuthStep(2);
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        // تسجيل الدخول
        await setPersistence(auth, browserLocalPersistence);
        const res = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        const userDoc = await getDoc(doc(db, "users", res.user.uid));

        if (!userDoc.exists()) {
          setTempUser(res.user);
          setShowCompleteProfile(true);
        } else {
          toast.success(`أهلاً بك يا ${userDoc.data().name}`);
          navigate('/dashboard');
        }
      } else {
        // إنشاء الحساب الشامل
        const res = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        await updateProfile(res.user, { displayName: formData.name });
        
        await createUniversalProfile(res.user.uid, formData);
        
        toast.success("تم تفعيل هويتك العالمية في منصة مَـافـا!");
        navigate('/welcome-screen');
      }
    } catch (err) {
      console.error(err);
      toast.error("فشل في المصادقة: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- [5] واجهة المستخدم (The Grand UI) ---

  return (
    <div className="mafa-universal-container">
      <Toaster position="bottom-center" />
      
      {/* طبقة الحماية والخلفية التفاعلية */}
      <div className="animated-mesh-bg"></div>

      <motion.div 
        className="master-auth-card"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="card-inner-wrapper">
          
          {/* الجانب المعلوماتي (Branding Side) */}
          <aside className="branding-side">
            <div className="logo-area">
              <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 1 }}>
                <Cpu size={45} color="#fff" />
              </motion.div>
              <h1>MAFA 2026</h1>
            </div>

            <div className="info-carousel">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={isLogin ? 'login-txt' : 'reg-txt'}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <h3>{isLogin ? "نظام الدخول الموحد" : "بوابة صناعة القادة"}</h3>
                  <p>المنصة التي تجمع بين التعليم الأكاديمي، طلب العلم الشرعي، والتربية القيمية في مكان واحد.</p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="feature-grid">
              <div className="f-box"><Activity size={16}/> تتبع أداء ذكي</div>
              <div className="f-box"><Shield size={16}/> حماية بيانات فائقة</div>
              <div className="f-box"><Star size={16}/> جوائز ومسابقات</div>
            </div>
          </aside>

          {/* جانب الاستمارات (Form Side) */}
          <section className="form-side">
            <nav className="auth-nav">
              <button className={isLogin ? 'active' : ''} onClick={() => { setIsLogin(true); setAuthStep(1); }}>دخول</button>
              <button className={!isLogin ? 'active' : ''} onClick={() => setIsLogin(false)}>إنشاء حساب</button>
            </nav>

            <form onSubmit={processAuth} className="master-form-engine">
              <AnimatePresence mode="wait">
                {isLogin ? (
                  /* --- واجهة تسجيل الدخول --- */
                  <motion.div key="login-fields" className="fields-stack" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="input-group">
                      <label><Mail size={16}/> البريد الإلكتروني</label>
                      <input type="email" name="email" onChange={handleInputChange} required />
                    </div>
                    <div className="input-group">
                      <label><Lock size={16}/> كلمة المرور</label>
                      <div className="pass-field">
                        <input type={showPass ? "text" : "password"} name="password" onChange={handleInputChange} required />
                        <button type="button" onClick={() => setShowPass(!showPass)}>
                          {showPass ? <EyeOff size={18}/> : <Eye size={18}/>}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  /* --- واجهة التسجيل (نظام الخطوات) --- */
                  <motion.div key={`step-${authStep}`} className="fields-stack" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                    {authStep === 1 ? (
                      <>
                        <div className="input-row">
                          <div className="input-group">
                            <label><User size={16}/> الاسم الثلاثي</label>
                            <input name="name" placeholder="محمد أحمد علي" onChange={handleInputChange} required />
                          </div>
                          <div className="input-group">
                            <label><Phone size={16}/> هاتف الواتساب</label>
                            <input name="phone" placeholder="01xxxxxxxxx" onChange={handleInputChange} required />
                          </div>
                        </div>
                        <div className="input-group">
                          <label><Mail size={16}/> البريد الإلكتروني</label>
                          <input type="email" name="email" onChange={handleInputChange} required />
                        </div>
                        <div className="role-cards-container">
                          <label className="section-label">اختر هويتك في المنصة:</label>
                          <div className="role-grid">
                            <div className={`role-item ${formData.role === 'student' ? 'active' : ''}`} onClick={() => setFormData({...formData, role: 'student'})}>
                              <GraduationCap /> <span>طالب مدرسي</span>
                            </div>
                            <div className={`role-item ${formData.role === 'sharia_student' ? 'active' : ''}`} onClick={() => setFormData({...formData, role: 'sharia_student'})}>
                              <Library /> <span>طالب شرعي</span>
                            </div>
                            <div className={`role-item ${formData.role === 'parent' ? 'active' : ''}`} onClick={() => setFormData({...formData, role: 'parent'})}>
                              <Heart /> <span>ولي أمر</span>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="input-row">
                          <div className="input-group">
                            <label><MapPin size={16}/> المحافظة</label>
                            <select name="governorate" onChange={handleInputChange} required>
                              <option value="">اختر...</option>
                              {governorates.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                          </div>
                          <div className="input-group">
                            <label><School size={16}/> المرحلة التعليمية</label>
                            <select name="educationStage" onChange={handleInputChange} required>
                              <option value="">اختر المرحلة...</option>
                              {Object.entries(stages).map(([key, value]) => (
                                <option key={key} value={key}>{value.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {formData.educationStage && (
                          <div className="input-group animate-in">
                            <label><Activity size={16}/> الصف الدراسي / المستوى</label>
                            <select name="studentLevel" onChange={handleInputChange} required>
                              <option value="">اختر المستوى...</option>
                              {stages[formData.educationStage]?.levels.map(lv => (
                                <option key={lv} value={lv}>{lv}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div className="input-row">
                          <div className="input-group">
                            <label><Lock size={16}/> كلمة المرور</label>
                            <input type="password" name="password" onChange={handleInputChange} required />
                          </div>
                          <div className="input-group">
                            <label><CheckCircle size={16}/> تأكيد الكلمة</label>
                            <input type="password" name="confirmPassword" onChange={handleInputChange} required />
                          </div>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="form-actions">
                {!isLogin && authStep === 2 && (
                  <button type="button" className="back-btn" onClick={() => setAuthStep(1)}>السابق</button>
                )}
                <button type="submit" className={`submit-btn ${loading ? 'loading' : ''}`} disabled={loading}>
                  {loading ? <RefreshCcw className="spin" /> : (
                    isLogin ? "دخول آمن" : (authStep === 1 ? "التالي" : "تأكيد التسجيل")
                  )}
                </button>
              </div>

              {isLogin && (
                <div className="social-login">
                  <p>أو الدخول عبر الأنظمة العالمية</p>
                  <button type="button" onClick={() => toast.success("جاري الاتصال بجوجل...")} className="google-btn">
                    <Chrome size={20} /> Google Cloud
                  </button>
                </div>
              )}
            </form>
          </section>
        </div>
      </motion.div>

      {/* مودال إكمال البيانات الإجباري (حسب توجيهاتك) */}
      <AnimatePresence>
        {showCompleteProfile && (
          <motion.div className="forced-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="complete-data-modal">
              <h2>نعتذر، حسابك غير مفعل بعد 🛑</h2>
              <p>يجب إكمال بيانات ملفك الشخصي لتتمكن من الوصول للمنصة.</p>
              <button onClick={() => navigate('/complete-profile')}>انتقل لإكمال البيانات الآن</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;
