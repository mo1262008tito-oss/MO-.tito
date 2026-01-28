import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';

import { 
  LogIn, UserPlus, Mail, Lock, User, Sparkles, Phone, Users, 
  GraduationCap, CheckCircle, ArrowRight, Code, Heart, ShieldCheck, 
  Briefcase, MapPin, BookOpen, Fingerprint, Chrome, ShieldAlert, 
  Rocket, Eye, EyeOff, RefreshCcw, Globe, AlertTriangle, Shield,
  Cpu, MousePointer2, Zap, CloudLightning, Terminal, Languages,
  History, Smartphone, Database, Key, Layout
} from 'lucide-react';

// Firebase & Analytics
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  GoogleAuthProvider, 
  signInWithPopup,
  sendPasswordResetEmail,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { 
  doc, setDoc, getDoc, serverTimestamp, updateDoc, 
  increment, collection, addDoc, query, where, getDocs 
} from 'firebase/firestore';

/**
 * MaFa Smart Access Gateway v3.0 (2026 Edition)
 * نظام الدخول الذكي الموحد للمنصة العالمية
 */

const Login = () => {
  // --- 1. Advanced State Management ---
  const [isLogin, setIsLogin] = useState(true);
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [tempUser, setTempUser] = useState(null);
  const [authStep, setAuthStep] = useState(1); // نظام الخطوات المتعددة
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [deviceInfo, setDeviceInfo] = useState({});
  const [activeTab, setActiveTab] = useState('email'); // email or biometric
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const navigate = useNavigate();
  const controls = useAnimation();
  const formRef = useRef(null);

  // --- 2. Master Form Data ---
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    role: 'student',
    parentPhone: '',
    studentLevel: '',
    major: '',
    schoolName: '',
    governorate: '',
    gender: 'male',
    termsAccepted: true,
    newsletter: true,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: 'ar'
  });

  // --- 3. Constants & Intelligence Data ---
  const educationLevels = useMemo(() => [
    { 
        id: 'primary', 
        label: 'المرحلة الابتدائية', 
        levels: ['1 ابتدائي', '2 ابتدائي', '3 ابتدائي', '4 ابتدائي', '5 ابتدائي', '6 ابتدائي'],
        icon: <BookOpen size={16}/> 
    },
    { 
        id: 'middle', 
        label: 'المرحلة الإعدادية', 
        levels: ['1 إعدادي', '2 إعدادي', '3 إعدادي'],
        icon: <Zap size={16}/> 
    },
    { 
        id: 'high', 
        label: 'المرحلة الثانوية', 
        levels: ['1 ثانوي', '2 ثانوي', '3 ثانوي'],
        icon: <GraduationCap size={16}/> 
    }
  ], []);

  const governorates = [
    "القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "البحر الأحمر", "البحيرة", "الفيوم", "الغربية", "الإسماعيلية", "المنوفية", "المنيا", "القليوبية", "الوادي الجديد", "السويس", "الشرقية", "دمياط", "بورسعيد", "كفر الشيخ", "مطروح", "الأقصر", "قنا", "شمال سيناء", "جنوب سيناء", "بني سويف", "سوهاج", "أسيوط", "أسوان"
  ];

  // --- 4. Effects & System Init ---
  useEffect(() => {
    // ميزة: تسجيل بصمة الجهاز وتفاصيل النظام لأمان الحساب
    const captureDeviceInfo = async () => {
      const info = {
        browser: navigator.userAgent,
        platform: navigator.platform,
        screen: `${window.screen.width}x${window.screen.height}`,
        language: navigator.language
      };
      setDeviceInfo(info);
    };
    captureDeviceInfo();

    // ميزة: تأثير الخلفية التفاعلية مع حركة الماوس
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // --- 5. Real-time Intelligence Logic ---
  const checkPasswordStrength = (pass) => {
    let score = 0;
    if (pass.length > 8) score += 25;
    if (/[A-Z]/.test(pass)) score += 25;
    if (/[0-9]/.test(pass)) score += 25;
    if (/[^A-Za-z0-9]/.test(pass)) score += 25;
    setPasswordStrength(score);
  };

  const needsMajor = useMemo(() => 
    formData.studentLevel.includes('2 ثانوي') || formData.studentLevel.includes('3 ثانوي'), 
  [formData.studentLevel]);

  // --- 6. Event Handlers ---
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'password') checkPasswordStrength(value);
    
    // ميزة: الاهتزاز عند كتابة خاطئة في رقم الهاتف (محاكاة)
    if (name === 'phone' && value.length > 11) {
        toast.error("رقم الهاتف المصري 11 رقم فقط");
    }
  }, []);

  const validateForm = () => {
    const { name, phone, password, confirmPassword, role, studentLevel } = formData;
    
    if (!isLogin) {
      if (name.trim().split(/\s+/).length < 3) return "يجب إدخال اسمك الثلاثي باللغة العربية";
      if (!/^01[0125][0-9]{8}$/.test(phone)) return "رقم الهاتف غير صالح، تأكد من إدخال رقم مصري صحيح";
      if (password.length < 8) return "كلمة المرور ضعيفة، يجب أن تحتوي على 8 رموز على الأقل";
      if (password !== confirmPassword) return "كلمات المرور غير متطابقة، أعد المحاولة";
      if (role === 'student' && !studentLevel) return "يرجى اختيار السنة الدراسية لإكمال التسجيل";
    }
    return null;
  };

  // --- 7. Core Authentication Logic ---
  const saveUserData = async (uid, finalData, method = 'email') => {
    const userRef = doc(db, "users", uid);
    const securityPayload = {
      device: deviceInfo,
      ip_hints: "logged",
      login_method: method,
      timestamp: new Date().toISOString()
    };

    const payload = {
      uid,
      ...finalData,
      isAccountActive: true,
      accountStatus: 'verified',
      experiencePoints: 0,
      virtualBalance: 0,
      achievements: [],
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      rank: "طالب جديد",
      securityLogs: [securityPayload],
      preferences: {
        darkMode: true,
        notifications: true,
        autoPlay: false
      }
    };
    
    await setDoc(userRef, payload);
    // تحديث إحصائيات المنصة العالمية بذكاء
    const statsRef = doc(db, "system", "analytics");
    await updateDoc(statsRef, {
      totalRegistrations: increment(1),
      lastUserJoined: finalData.name,
      [`growth.${new Date().getMonth()}`]: increment(1)
    }).catch(() => {});
  };

  const executeAuth = async (e) => {
    if(e) e.preventDefault();
    const error = validateForm();
    if (error) {
        controls.start({ x: [-10, 10, -10, 10, 0], transition: { duration: 0.4 } });
        return toast.error(error);
    }

    setLoading(true);
    try {
      if (isLogin) {
        // ميزة: ضبط استمرارية الدخول للمستوى العالمي
        await setPersistence(auth, browserLocalPersistence);
        const userCred = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        
        // ميزة: التحقق من وجود بيانات كاملة قبل الدخول
        const userDoc = await getDoc(doc(db, "users", userCred.user.uid));
        if (!userDoc.exists() || !userDoc.data().phone) {
          setTempUser(userCred.user);
          setShowCompleteProfile(true);
          toast.success("يرجى استكمال بياناتك أولاً");
        } else {
          toast.success(`أهلاً بك مجدداً في رحلة التعلم 🚀`);
          navigate('/dashboard');
        }
      } else {
        const userCred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        await updateProfile(userCred.user, { displayName: formData.name });
        
        const finalPayload = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          governorate: formData.governorate,
          studentLevel: formData.studentLevel,
          major: needsMajor ? formData.major : 'عام',
          school: formData.schoolName,
          parentPhone: formData.parentPhone,
          bio: "عضو جديد في مجتمع MaFa التعليمي"
        };
        
        await saveUserData(userCred.user.uid, finalPayload);
        toast.success("تم إنشاء حسابك العالمي بنجاح! جاري التحضير...");
        setTimeout(() => navigate('/welcome-onboarding'), 1500);
      }
    } catch (err) {
      handleEnhancedErrors(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnhancedErrors = (err) => {
    console.error("Auth Error:", err.code);
    const errorMap = {
      'auth/email-already-in-use': 'هذا البريد الإلكتروني مستخدم بالفعل في حساب آخر.',
      'auth/invalid-credential': 'بيانات الدخول غير صحيحة، يرجى التأكد من البريد وكلمة المرور.',
      'auth/weak-password': 'كلمة المرور التي اخترتها سهلة التخمين جداً.',
      'auth/user-not-found': 'لم نجد حساباً بهذا البريد، هل تود إنشاء حساب جديد؟',
      'auth/too-many-requests': 'تم حظر المحاولات مؤقتاً لحماية حسابك، حاول لاحقاً.',
      'auth/network-request-failed': 'توجد مشكلة في اتصالك بالإنترنت، تحقق من الشبكة.'
    };
    toast.error(errorMap[err.code] || "حدث خطأ غير متوقع، فريق الدعم الفني يتابع المشكلة.");
  };

  const handleGoogleBridge = async () => {
    const provider = new GoogleAuthProvider();
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const userDoc = await getDoc(doc(db, "users", result.user.uid));

      if (userDoc.exists() && userDoc.data().phone) {
        toast.success(`مرحباً ${result.user.displayName}`);
        navigate('/dashboard');
      } else {
        setTempUser(result.user);
        setShowCompleteProfile(true);
        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} custom-toast`}>
            أكمل بياناتك لتفعيل المميزات العالمية 🌍
          </div>
        ));
      }
    } catch (err) {
      handleEnhancedErrors(err);
    } finally {
      setLoading(false);
    }
  };

  // --- 8. UI Rendering Components ---
  const renderProgressBar = () => (
    <div className="password-strength-meter">
      <div className="meter-label">قوة الأمان: {passwordStrength}%</div>
      <div className="meter-bg">
        <motion.div 
          className="meter-fill"
          initial={{ width: 0 }}
          animate={{ width: `${passwordStrength}%`, backgroundColor: passwordStrength > 75 ? '#10b981' : passwordStrength > 40 ? '#f59e0b' : '#ef4444' }}
        />
      </div>
    </div>
  );

  return (
    <div className="mafa-universe-auth">
      <Toaster position="bottom-right" reverseOrder={false} />
      
      {/* ميزة: خلفية سينمائية متحركة ثنائية الأبعاد */}
      <div className="dynamic-background">
        <div className="noise-overlay"></div>
        <motion.div 
          className="interactive-blob"
          animate={{
            x: mousePosition.x / 15,
            y: mousePosition.y / 15,
          }}
        />
        <div className="grid-pattern"></div>
      </div>

      <main className="auth-container">
        <AnimatePresence mode="wait">
          {!showCompleteProfile ? (
            <motion.div 
              key="auth-main"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-portal"
            >
              {/* القسم الجانبي (Branding) */}
              <div className="portal-branding">
                <div className="branding-content">
                  <motion.div 
                    initial={{ rotate: -10 }}
                    animate={{ rotate: 0 }}
                    className="brand-logo"
                  >
                    <Cpu size={48} className="text-white" />
                  </motion.div>
                  <h1>MaFa AI</h1>
                  <p>مستقبل التعليم الذكي بين يديك</p>
                  
                  <div className="features-mini-list">
                    <div className="f-item"><Shield size={14} /> تشفير عسكري للبيانات</div>
                    <div className="f-item"><Zap size={14} /> استجابة فائقة السرعة</div>
                    <div className="f-item"><Globe size={14} /> شهادات معتمدة دولياً</div>
                  </div>
                </div>
                <div className="branding-footer">
                  <span>© 2026 MaFa Edu Ecosystem</span>
                </div>
              </div>

              {/* قسم الاستمارات (Forms Section) */}
              <div className="portal-forms">
                <header className="form-header">
                  <div className="tab-switcher">
                    <button 
                      className={isLogin ? 'active' : ''} 
                      onClick={() => setIsLogin(true)}
                    >
                      <LogIn size={18} /> تسجيل الدخول
                    </button>
                    <button 
                      className={!isLogin ? 'active' : ''} 
                      onClick={() => setIsLogin(false)}
                    >
                      <UserPlus size={18} /> حساب جديد
                    </button>
                  </div>
                </header>

                <motion.form 
                  animate={controls}
                  onSubmit={executeAuth} 
                  className="smart-form"
                  ref={formRef}
                >
                  {!isLogin && (
                    <div className="form-grid signup-animation">
                      <div className="input-group full">
                        <label><User size={14} /> الاسم الكامل</label>
                        <input 
                          type="text" 
                          name="name" 
                          placeholder="الاسم الثلاثي أو الرباعي بالعربي"
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      
                      <div className="input-group">
                        <label><Phone size={14} /> هاتف واتساب</label>
                        <input 
                          type="tel" 
                          name="phone" 
                          placeholder="01xxxxxxxxx"
                          onChange={handleInputChange}
                          maxLength="11"
                          required
                        />
                      </div>

                      <div className="input-group">
                        <label><Globe size={14} /> المحافظة</label>
                        <select name="governorate" onChange={handleInputChange} required>
                          <option value="">اختر المكان...</option>
                          {governorates.map(gov => <option key={gov} value={gov}>{gov}</option>)}
                        </select>
                      </div>

                      <div className="input-group full">
                        <label><Briefcase size={14} /> نوع العضوية</label>
                        <div className="modern-chips">
                          {['student', 'teacher', 'parent'].map(r => (
                            <div 
                              key={r}
                              className={`chip ${formData.role === r ? 'selected' : ''}`}
                              onClick={() => setFormData({...formData, role: r})}
                            >
                              {r === 'student' ? 'طالب علم' : r === 'teacher' ? 'محاضر' : 'ولي أمر'}
                              {formData.role === r && <CheckCircle size={12} />}
                            </div>
                          ))}
                        </div>
                      </div>

                      {formData.role === 'student' && (
                        <>
                          <div className="input-group">
                            <label><GraduationCap size={14} /> السنة الدراسية</label>
                            <select name="studentLevel" onChange={handleInputChange} required>
                              <option value="">اختر سنتك...</option>
                              {educationLevels.map(group => (
                                <optgroup key={group.id} label={group.label}>
                                  {group.levels.map(l => <option key={l} value={l}>{l}</option>)}
                                </optgroup>
                              ))}
                            </select>
                          </div>
                          
                          <div className="input-group">
                            <label><Users size={14} /> هاتف ولي الأمر</label>
                            <input 
                              type="tel" 
                              name="parentPhone" 
                              placeholder="للطوارئ والنتائج"
                              onChange={handleInputChange}
                              required
                            />
                          </div>

                          {needsMajor && (
                            <div className="input-group full">
                              <label><BookOpen size={14} /> التخصص الدراسي</label>
                              <select name="major" className="highlight-select" onChange={handleInputChange} required>
                                <option value="">اختر الشعبة...</option>
                                <option value="علمي علوم">الشعبة العلمية (علوم)</option>
                                <option value="علمي رياضة">الشعبة العلمية (رياضيات)</option>
                                <option value="أدبي">الشعبة الأدبية</option>
                              </select>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  <div className="input-group full">
                    <label><Mail size={14} /> البريد الإلكتروني</label>
                    <input 
                      type="email" 
                      name="email" 
                      placeholder="name@example.com"
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="input-group full">
                    <label><Lock size={14} /> كلمة المرور</label>
                    <div className="password-wrapper">
                      <input 
                        type={showPass ? "text" : "password"} 
                        name="password" 
                        placeholder="••••••••"
                        onChange={handleInputChange}
                        required
                      />
                      <button 
                        type="button" 
                        className="eye-toggle"
                        onClick={() => setShowPass(!showPass)}
                      >
                        {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {!isLogin && renderProgressBar()}
                  </div>

                  {isLogin && (
                    <div className="form-options">
                      <label className="remember-me">
                        <input type="checkbox" defaultChecked /> تذكرني دائماً
                      </label>
                      <button 
                        type="button" 
                        className="forgot-pass"
                        onClick={() => setResetMode(true)}
                      >
                        فقدت الوصول للحساب؟
                      </button>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    className={`submit-btn ${loading ? 'loading' : ''}`}
                    disabled={loading}
                  >
                    {loading ? (
                      <RefreshCcw className="spin" />
                    ) : (
                      <>
                        <span>{isLogin ? 'تسجيل دخول آمن' : 'إنشاء الهوية التعليمية'}</span>
                        <ArrowRight size={20} />
                      </>
                    )}
                  </button>
                </motion.form>

                <div className="divider">
                  <span>أو عبر الأنظمة العالمية</span>
                </div>

                <div className="social-auth-grid">
                  <button className="social-btn google" onClick={handleGoogleBridge} disabled={loading}>
                    <Chrome size={20} />
                    Google Cloud
                  </button>
                  <button className="social-btn biometric" disabled>
                    <Fingerprint size={20} />
                    Face ID
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            /* واجهة إكمال البيانات الحرجة - المستوى الاحترافي */
            <motion.div 
              key="complete-profile"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="completion-portal"
            >
              <div className="completion-card">
                <div className="user-profile-preview">
                  <div className="avatar-shield">
                    <img src={tempUser?.photoURL || 'https://via.placeholder.com/150'} alt="User" />
                    <div className="status-badge"><ShieldCheck size={16}/></div>
                  </div>
                  <h3>مرحباً، {tempUser?.displayName?.split(' ')[0]}</h3>
                  <p>خطوة واحدة تفصلك عن المنصة العالمية</p>
                </div>

                <form className="completion-form" onSubmit={executeAuth}>
                  {/* يتم هنا تكرار الحقول المطلوبة فقط مثل الهاتف والمرحلة */}
                  <div className="compact-grid">
                    <div className="input-group">
                      <label>رقم الهاتف</label>
                      <input name="phone" placeholder="01xxxxxxxxx" onChange={handleInputChange} required />
                    </div>
                    <div className="input-group">
                      <label>السنة الدراسية</label>
                      <select name="studentLevel" onChange={handleInputChange} required>
                         <option value="">اختر...</option>
                         {educationLevels.map(g => (
                           <optgroup key={g.id} label={g.label}>
                             {g.levels.map(l => <option key={l} value={l}>{l}</option>)}
                           </optgroup>
                         ))}
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="activate-btn">تفعيل كامل الصلاحيات</button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <style jsx>{`
        /* CSS مدمج لضمان الشكل العالمي للمنصة */
        .mafa-universe-auth {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #050505;
          font-family: 'Tajawal', sans-serif;
          overflow: hidden;
          position: relative;
        }

        .dynamic-background {
          position: absolute;
          inset: 0;
          z-index: 1;
        }

        .interactive-blob {
          position: absolute;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%);
          border-radius: 50%;
          filter: blur(60px);
        }

        .glass-portal {
          position: relative;
          z-index: 10;
          width: 1000px;
          max-width: 95vw;
          min-height: 650px;
          background: rgba(15, 15, 20, 0.8);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 32px;
          display: grid;
          grid-template-columns: 380px 1fr;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .portal-branding {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          padding: 40px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          color: white;
        }

        .brand-logo {
          width: 80px;
          height: 80px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
        }

        .portal-forms {
          padding: 40px;
          background: #0f0f14;
          overflow-y: auto;
        }

        .tab-switcher {
          display: flex;
          gap: 10px;
          background: #1a1a24;
          padding: 6px;
          border-radius: 16px;
          margin-bottom: 30px;
        }

        .tab-switcher button {
          flex: 1;
          padding: 12px;
          border-radius: 12px;
          border: none;
          background: transparent;
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: 0.3s;
        }

        .tab-switcher button.active {
          background: #2d2d3d;
          color: white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }

        .smart-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-group.full { grid-column: span 2; }

        .input-group label {
          font-size: 13px;
          color: #94a3b8;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .input-group input, .input-group select {
          background: #1a1a24;
          border: 1px solid #2d2d3d;
          padding: 14px;
          border-radius: 12px;
          color: white;
          transition: 0.3s;
          outline: none;
        }

        .input-group input:focus {
          border-color: #6366f1;
          background: #242433;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
        }

        .modern-chips {
          display: flex;
          gap: 10px;
        }

        .chip {
          flex: 1;
          padding: 12px;
          background: #1a1a24;
          border: 1px solid #2d2d3d;
          border-radius: 12px;
          color: #94a3b8;
          text-align: center;
          cursor: pointer;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .chip.selected {
          background: rgba(99, 102, 241, 0.1);
          border-color: #6366f1;
          color: #6366f1;
        }

        .submit-btn {
          margin-top: 10px;
          padding: 16px;
          border-radius: 14px;
          border: none;
          background: #6366f1;
          color: white;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          cursor: pointer;
          transition: 0.3s;
        }

        .submit-btn:hover {
          background: #4f46e5;
          transform: translateY(-2px);
          box-shadow: 0 10px 20px -10px #4f46e5;
        }

        .social-auth-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .social-btn {
          padding: 14px;
          border-radius: 12px;
          border: 1px solid #2d2d3d;
          background: #1a1a24;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          transition: 0.2s;
        }

        .social-btn:hover { background: #242433; }

        .spin { animation: rotate 1s linear infinite; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        @media (max-width: 850px) {
          .glass-portal { grid-template-columns: 1fr; }
          .portal-branding { display: none; }
          .form-grid { grid-template-columns: 1fr; }
          .input-group.full { grid-column: span 1; }
        }
      `}</style>
    </div>
  );
};

export default Login;