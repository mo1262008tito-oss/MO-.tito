import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { db, auth, storage } from '../firebase'; 
import { 
  doc, onSnapshot, updateDoc, increment, collection, addDoc, 
  getDoc, runTransaction, query, where, orderBy, limit, 
  serverTimestamp, getDocs, setDoc, arrayUnion 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  ShieldCheck, Wallet as WalletIcon, ArrowRightLeft, Lock, Plus, 
  Star, Clock, Eye, EyeOff, Receipt, Smartphone, Landmark, 
  Award, Zap, History, BarChart3, Bell, ChevronRight, 
  ShieldAlert, Target, RefreshCw, Search, X, QrCode, Headphones, 
  Image as ImageIcon, Copy, Unlock, ArrowDownLeft, ArrowUpRight,
  Filter, Download, Share2, Info, CheckCircle2, AlertCircle, Settings,
  CreditCard, UserCheck, ShieldQuestion, Activity, TrendingUp, PiggyBank,
  UserPlus, LogOut, Terminal, Fingerprint, Cpu, Globe, Key
} from 'lucide-react';
import './Wallet.css';

// =========================================================================
// [ SECTION 1: GLOBAL CONSTANTS & CONFIGURATIONS ]
// =========================================================================
const SYSTEM_VERSION = "4.0.2-PLATINUM";
const MIN_TRANSFER_AMOUNT = 10;
const POINT_TO_CASH_RATIO = 100; // 100 points = 1 EGP
const RECHARGE_METHODS = {
  VODA: { id: 'voda', name: 'فودافون كاش ', color: '#e60000', number: '010XXXXXXXX' },
  INSTA: { id: 'insta', name: 'InstaPay', color: '#442266', handle: 'mafa@instapay' },
  FOWRY: { id: 'fawry', name: 'فوري', color: '#ffc107', code: '99821' }
};

const Wallet = () => {
  // =========================================================================
  // [ SECTION 2: ADVANCED STATE MANAGEMENT ]
  // =========================================================================
  
  // -- User States --
  const [user, setUser] = useState(null);
  const [isDataComplete, setIsDataComplete] = useState(true);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // -- Navigation States --
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeModal, setActiveModal] = useState(null);
  const [showBalance, setShowBalance] = useState(true);
  
  // -- Financial Data States --
  const [transactions, setTransactions] = useState([]);
  const [analytics, setAnalytics] = useState({
    monthlySpending: 0,
    monthlyIncome: 0,
    savingsRate: 0,
    categoryData: []
  });

  // -- Form States (Detailed) --
  const [transferData, setTransferData] = useState({
    recipientId: '',
    amount: '',
    note: '',
    pin: '',
    priority: 'normal'
  });

  const [rechargeData, setRechargeData] = useState({
    method: 'voda',
    amount: '',
    senderPhone: '',
    transactionId: '',
    receiptFile: null,
    previewUrl: null
  });

  const [vaultState, setVaultState] = useState({
    isLocked: true,
    balance: 0,
    targetAmount: 1000,
    tempPin: '',
    actionAmount: ''
  });

  // -- Security & UI States --
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [systemAlert, setSystemAlert] = useState(null);
  const [deviceInfo, setDeviceInfo] = useState({});

  // =========================================================================
  // [ SECTION 3: SYSTEM INITIALIZATION & DATA SYNC ]
  // =========================================================================

  useEffect(() => {
    const syncSystem = async () => {
      auth.onAuthStateChanged(async (currentUser) => {
        if (currentUser) {
          // 1. كشف بصمة الجهاز (Device Fingerprint) لمنع تعدد الحسابات
          const fingerprint = {
            ua: navigator.userAgent,
            lang: navigator.language,
            platform: navigator.platform,
            screen: `${window.screen.width}x${window.screen.height}`
          };
          setDeviceInfo(fingerprint);

          // 2. فحص حالة البيانات الإلزامية (Data Completion Gate)
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const data = userSnap.data();
            
            // التحقق من الحقول المطلوبة (الاسم، الهاتف، المرحلة، تفعيل الحساب)
            const requiredFields = ['fullName', 'phone', 'studentLevel', 'isActivated'];
            const incomplete = requiredFields.some(field => !data[field]);
            
            if (incomplete || data.isActivated === false) {
              setIsDataComplete(false);
              setActiveTab('onboarding');
            }

            setUser({ uid: currentUser.uid, ...data });
            
            // 3. مزامنة لحظية للمحفظة
            const unsubUser = onSnapshot(userRef, (snap) => {
              if (snap.exists()) {
                const updatedData = snap.data();
                setUser(prev => ({ ...prev, ...updatedData }));
                setVaultState(prev => ({ ...prev, balance: updatedData.vaultBalance || 0 }));
              }
            });

            // 4. مزامنة سجل العمليات (آخر 50 عملية)
            const qTransactions = query(
              collection(db, 'transactions'),
              where('userId', '==', currentUser.uid),
              orderBy('date', 'desc'),
              limit(50)
            );

            const unsubTrans = onSnapshot(qTransactions, (snap) => {
              const transList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              setTransactions(transList);
              calculateAnalytics(transList);
            });
         // 5. مزامنة الإشعارات غير المقروءة
            const qNotifs = query(
              collection(db, 'notifications'),
              where('userId', '==', currentUser.uid),
              where('read', '==', false),
              orderBy('createdAt', 'desc')
            );

            const unsubNotifs = onSnapshot(qNotifs, (snap) => {
              setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            });

            setLoading(false);
            return () => {
              unsubUser();
              unsubTrans();
              unsubNotifs();
            };
          } else {
            // معالجة حالة المستخدم الجديد كلياً
            handleNewUserSetup(currentUser);
          }
        } else {
          setLoading(false);
          // توجيه لتسجيل الدخول إذا لم يوجد مستخدم
        }
      });
    };

    syncSystem();
  }, []);

  // =========================================================================
  // [ SECTION 4: CORE LOGIC HELPER FUNCTIONS ]
  // =========================================================================

  const handleNewUserSetup = async (currentUser) => {
    const newMafaID = `MFA-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`;
    const initialData = {
      fullName: currentUser.displayName || "",
      email: currentUser.email,
      mafaID: newMafaID,
      balance: 0,
      vaultBalance: 0,
      points: 0,
      rank: "طالب مستجد",
      isActivated: false,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      deviceInfo: deviceInfo
    };
    await setDoc(doc(db, 'users', currentUser.uid), initialData);
    setUser({ uid: currentUser.uid, ...initialData });
    setIsDataComplete(false);
    setActiveTab('onboarding');
  };

  const calculateAnalytics = (data) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    
    let spending = 0;
    let income = 0;

    data.forEach(t => {
      const tDate = t.date?.toDate();
      if (tDate && tDate.getMonth() === currentMonth) {
        if (t.type === 'withdraw') spending += t.amount;
        if (t.type === 'deposit') income += t.amount;
      }
    });

    setAnalytics(prev => ({
      ...prev,
      monthlySpending: spending,
      monthlyIncome: income,
      savingsRate: income > 0 ? ((income - spending) / income) * 100 : 0
    }));
  };

  const showAlert = (title, message, type = 'info') => {
    setSystemAlert({ title, message, type });
    setTimeout(() => setSystemAlert(null), 5000);
  };

  // ميزة استباقية: فحص رصيد المحفظة قبل فتح أي مودال
  const secureOpenModal = (modalName) => {
    if (!isDataComplete) {
      showAlert("تنبيه أمني", "يجب إكمال بياناتك أولاً للوصول لهذه الميزة", "warning");
      return;
    }
    setActiveModal(modalName);
  };

  // تابع للجزء الثاني... (Logic العمليات المالية)

  // =========================================================================
// [ SECTION 5: FINANCIAL OPERATIONS LOGIC (P2P & VAULT) ]
// =========================================================================

  /**
   * ميزة 5: نظام البحث الذكي عن المستلم
   * يقوم بالتحقق من وجود الطالب في قاعدة البيانات واسترجاع حالته الأمنية
   */
  const handleRecipientSearch = useCallback(async (id) => {
    if (!id || id.length < 5) return;
    if (id === user?.mafaID) {
      setSearchResult('self');
      return;
    }
    
    setActionLoading(true);
    try {
      const q = query(collection(db, 'users'), where('mafaID', '==', id.trim().toUpperCase()));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const targetData = snap.docs[0].data();
        setSearchResult({
          uid: snap.docs[0].id,
          name: targetData.fullName,
          avatar: targetData.avatar,
          level: targetData.studentLevel,
          isVerified: targetData.isActivated
        });
      } else {
        setSearchResult('not_found');
      }
    } catch (err) {
      console.error("Search Error:", err);
      showAlert("خطأ في البحث", "تعذر الاتصال بقاعدة البيانات", "error");
    } finally {
      setActionLoading(false);
    }
  }, [user?.mafaID]);

  /**
   * ميزة 6: تنفيذ التحويل المالي (Atomic Transaction)
   * يضمن عدم ضياع الأموال في حال انقطاع الإنترنت أثناء العملية
   */
  const executeSecureTransfer = async () => {
    const amount = Number(transferData.amount);
    
    // الفحوصات الأمنية الأولية
    if (!searchResult || searchResult === 'not_found') return showAlert("تنبيه", "يرجى تحديد مستلم صالح أولاً", "warning");
    if (amount < MIN_TRANSFER_AMOUNT) return showAlert("فشل العملية", `الحد الأدنى للتحويل هو ${MIN_TRANSFER_AMOUNT} ج.م`, "error");
    if (amount > user.balance) return showAlert("رصيد غير كافٍ", "لا تمتلك رصيداً كافياً لإتمام هذه العملية", "error");
    if (transferData.pin !== (user.securityPin || "1234")) return showAlert("أمن النظام", "رمز الأمان الخاص بك غير صحيح", "error");

    setActionLoading(true);
    try {
      await runTransaction(db, async (transaction) => {
        const senderRef = doc(db, 'users', auth.currentUser.uid);
        const receiverRef = doc(db, 'users', searchResult.uid);
        
        // سجل العمليات (Logging)
        const senderTransRef = doc(collection(db, 'transactions'));
        const receiverTransRef = doc(collection(db, 'transactions'));

        // 1. خصم من الراسل
        transaction.update(senderRef, { 
          balance: increment(-amount),
          totalTransferred: increment(amount)
        });

        // 2. إضافة للمستلم
        transaction.update(receiverRef, { 
          balance: increment(amount),
          totalReceived: increment(amount)
        });

        // 3. توثيق العملية للطرفين
        const timestamp = serverTimestamp();
        transaction.set(senderTransRef, {
          userId: auth.currentUser.uid,
          title: `حوالة صادرة إلى ${searchResult.name}`,
          amount: amount,
          type: 'withdraw',
          category: 'transfer',
          recipientId: searchResult.uid,
          note: transferData.note,
          date: timestamp,
          status: 'completed'
        });

        transaction.set(receiverTransRef, {
          userId: searchResult.uid,
          title: `حوالة واردة من ${user.fullName}`,
          amount: amount,
          type: 'deposit',
          category: 'transfer',
          senderId: auth.currentUser.uid,
          note: transferData.note,
          date: timestamp,
          status: 'completed'
        });

        // 4. إرسال إشعار لحظي للمستلم
        const notificationRef = doc(collection(db, 'notifications'));
        transaction.set(notificationRef, {
          userId: searchResult.uid,
          title: "تم استلام أموال!",
          message: `قام ${user.fullName} بتحويل مبلغ ${amount} ج.م إلى محفظتك.`,
          type: 'payment',
          read: false,
          createdAt: timestamp
        });
      });

      showAlert("نجاح", `تم تحويل ${amount} ج.م بنجاح إلى ${searchResult.name}`, "success");
      setActiveModal(null);
      setTransferData({ recipientId: '', amount: '', note: '', pin: '', priority: 'normal' });
    } catch (err) {
      console.error("Transfer Error:", err);
      showAlert("فشل النظام", "حدث خطأ غير متوقع أثناء المعالجة المالية", "error");
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * ميزة 7: نظام الخزنة الذكية (The Vault OS)
   * ميكانيكا السحب والإيداع مع التأكد من قفل الأمان
   */
  const manageVault = async (type) => {
    const amount = Number(vaultState.actionAmount);
    if (amount <= 0) return;
    
    if (type === 'deposit' && user.balance < amount) return showAlert("المحفظة فارغة", "رصيدك في المحفظة لا يكفي للإيداع في الخزنة", "warning");
    if (type === 'withdraw' && user.vaultBalance < amount) return showAlert("الخزنة لا تكفي", "ليس لديك هذا المبلغ في مدخراتك حالياً", "warning");

    setActionLoading(true);
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const isDeposit = type === 'deposit';

      await updateDoc(userRef, {
        balance: increment(isDeposit ? -amount : amount),
        vaultBalance: increment(isDeposit ? amount : -amount)
      });

      // إضافة سجل العملية
      await addDoc(collection(db, 'transactions'), {
        userId: auth.currentUser.uid,
        title: isDeposit ? "إيداع في الخزنة" : "سحب من الخزنة",
        amount: amount,
        type: isDeposit ? 'withdraw' : 'deposit',
        category: 'vault',
        date: serverTimestamp()
      });

      setVaultState(prev => ({ ...prev, actionAmount: '' }));
      showAlert("تحديث الخزنة", `تمت عملية ${isDeposit ? 'الادخار' : 'السحب'} بنجاح`, "success");
    } catch (err) {
      showAlert("خطأ", "فشلت العملية، يرجى المحاولة لاحقاً", "error");
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * ميزة 8: معالجة طلبات الشحن المتقدمة
   * تتضمن رفع الصورة لـ Storage وتخزين الرابط في Firestore
   */
  const handleRechargeSubmission = async () => {
    if (!rechargeData.amount || !rechargeData.receiptFile) {
      return showAlert("بيانات ناقصة", "يجب إدخال المبلغ ورفع صورة الإيصال", "warning");
    }

    setActionLoading(true);
    try {
      // 1. رفع صورة الإيصال مع اسم فريد
      const fileExtension = rechargeData.receiptFile.name.split('.').pop();
      const fileName = `recharge_${auth.currentUser.uid}_${Date.now()}.${fileExtension}`;
      const storagePath = ref(storage, `receipts/${fileName}`);
      
      const uploadTask = await uploadBytes(storagePath, rechargeData.receiptFile);
      const downloadURL = await getDownloadURL(uploadTask.ref);

      // 2. إنشاء طلب الشحن في Firestore
      await addDoc(collection(db, 'rechargeRequests'), {
        userId: auth.currentUser.uid,
        userName: user.fullName,
        mafaID: user.mafaID,
        amount: Number(rechargeData.amount),
        method: rechargeData.method,
        senderPhone: rechargeData.senderPhone,
        transactionId: rechargeData.transactionId,
        receiptUrl: downloadURL,
        status: 'pending',
        timestamp: serverTimestamp(),
        deviceInfo: deviceInfo // ميزة أمنية لتتبع الجهاز الذي أرسل الطلب
      });

      showAlert("تم إرسال الطلب", "سيتم مراجعة طلبك وإضافة الرصيد خلال 15 دقيقة", "success");
      setActiveModal(null);
      setRechargeData({ method: 'voda', amount: '', senderPhone: '', transactionId: '', receiptFile: null, previewUrl: null });
    } catch (err) {
      console.error("Recharge Submission Error:", err);
      showAlert("فشل الرفع", "تعذر رفع الإيصال، تأكد من جودة الإنترنت", "error");
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * ميزة 9: تحويل النقاط (Rewards 2.0)
   * تحويل نقاط الولاء إلى كاش حقيقي في المحفظة
   */
  const convertLoyaltyPoints = async () => {
    if (user.points < 500) return showAlert("نقاط غير كافية", "يجب أن تمتلك 500 نقطة على الأقل للتحويل", "warning");

    setActionLoading(true);
    try {
      const cashAmount = user.points / POINT_TO_CASH_RATIO;
      const userRef = doc(db, 'users', auth.currentUser.uid);

      await runTransaction(db, async (transaction) => {
        transaction.update(userRef, {
          balance: increment(cashAmount),
          points: 0,
          totalPointsRedeemed: increment(user.points)
        });

        const transRef = doc(collection(db, 'transactions'));
        transaction.set(transRef, {
          userId: auth.currentUser.uid,
          title: "استبدال نقاط الولاء (Cashback)",
          amount: cashAmount,
          type: 'deposit',
          category: 'rewards',
          date: serverTimestamp()
        });
      });

      showAlert("مبروك!", `تم تحويل نقاطك إلى ${cashAmount} ج.م في محفظتك`, "success");
    } catch (err) {
      showAlert("خطأ", "فشلت عملية التحويل", "error");
    } finally {
      setActionLoading(false);
    }
  };


  // أضف هذا الجزء داخل مكون Wallet ليعمل سجل العمليات
  const renderTransactionItem = (item) => (
    <div key={item.id} className="transaction-item">
      <div className="trans-info">
        <div className={`trans-icon ${item.type}`}>
          {item.type === 'deposit' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
        </div>
        <div className="trans-text">
          <h5>{item.title}</h5>
          <p>{item.date?.toDate().toLocaleDateString('ar-EG')}</p>
        </div>
      </div>
      <div className={`trans-amount ${item.type === 'deposit' ? 'positive' : 'negative'}`}>
        {item.type === 'deposit' ? '+' : '-'}{item.amount} ج.م
      </div>
    </div>
  );
   
// تابع للجزء الثالث... (الواجهة الرسومية وتصميم البطاقة البلاتينية)

// =========================================================================
// [ SECTION 6: UI COMPONENTS - THE PLATINUM INTERFACE ]
// =========================================================================

  // مكون فرعي: شاشة إكمال البيانات (The Mandatory Onboarding)
  // تظهر هذه الشاشة إذا كانت قيمة isDataComplete تساوي false
  const OnboardingScreen = () => (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="onboarding-overlay"
    >
      <div className="onboarding-card">
        <div className="onboarding-header">
          <ShieldCheck size={48} className="text-gold" />
          <h2>تنشيط الحساب الأمني</h2>
          <p>أهلاً بك في منصة MAFA. يرجى إكمال بياناتك لتتمكن من استخدام المحفظة والخدمات.</p>
        </div>

        <div className="steps-indicator">
          {[1, 2, 3].map(step => (
            <div key={step} className={`step ${onboardingStep >= step ? 'active' : ''}`}>
              {onboardingStep > step ? <CheckCircle2 size={16} /> : step}
            </div>
          ))}
        </div>

        {onboardingStep === 1 && (
          <motion.div initial={{ x: 20 }} animate={{ x: 0 }} className="step-content">
            <h3>البيانات الأساسية</h3>
            <input 
              type="text" placeholder="الاسم الكامل (كما في البطاقة)" 
              onChange={(e) => setUser({...user, fullName: e.target.value})}
              value={user?.fullName || ''}
            />
            <input 
              type="tel" placeholder="رقم الهاتف (رقم هاتفك الاساسي )" 
              onChange={(e) => setUser({...user, phone: e.target.value})}
              value={user?.phone || ''}
            />
            <button onClick={() => setOnboardingStep(2)} className="next-btn">التالي</button>
          </motion.div>
        )}
{onboardingStep === 2 && (
  <motion.div initial={{ x: 20 }} animate={{ x: 0 }} className="step-content">
    <h3>اختيار السنة الدراسية</h3>
    <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '15px' }}>اختر صفك الدراسي من القائمة التالية</p>
    
    <div className="levels-scroll-area">
      {[
        // المرحلة الابتدائية
        { title: 'المرحلة الابتدائية', type: 'header' },
        { id: 'p1', title: 'الصف الأول الابتدائي', icon: '👶' },
        { id: 'p2', title: 'الصف الثاني الابتدائي', icon: '🎨' },
        { id: 'p3', title: 'الصف الثالث الابتدائي', icon: '📚' },
        { id: 'p4', title: 'الصف الرابع الابتدائي', icon: '✏️' },
        { id: 'p5', title: 'الصف الخامس الابتدائي', icon: '🧠' },
        { id: 'p6', title: 'الصف السادس الابتدائي', icon: '🌟' },

        // المرحلة الإعدادية
        { title: 'المرحلة الإعدادية', type: 'header' },
        { id: 'm1', title: 'الصف الأول الإعدادي', icon: '🧪' },
        { id: 'm2', title: 'الصف الثاني الإعدادي', icon: '📐' },
        { id: 'm3', title: 'الصف الثالث الإعدادي', icon: '🌍' },

        // المرحلة الثانوية
        { title: 'المرحلة الثانوية', type: 'header' },
        { id: 's1', title: 'الصف الأول الثانوي', icon: '⚡' },
        { id: 's2', title: 'الصف الثاني الثانوي', icon: '🎯' },
        { id: 's3', title: 'الصف الثالث الثانوي', icon: '🎓' }
      ].map((item, index) => (
        item.type === 'header' ? (
          <div key={`header-${index}`} className="level-section-header">{item.title}</div>
        ) : (
          <div 
            key={item.id} 
            className={`level-row-item ${user?.studentLevel === item.title ? 'selected' : ''}`}
            onClick={() => setUser({...user, studentLevel: item.title})}
          >
            <div className="level-row-icon-emoji">{item.icon}</div>
            <div className="level-row-info">
              <h4>{item.title}</h4>
            </div>
            <div className="level-row-radio">
              <div className={`radio-circle ${user?.studentLevel === item.title ? 'checked' : ''}`}></div>
            </div>
          </div>
        )
      ))}
    </div>

    <button 
      onClick={() => user?.studentLevel ? setOnboardingStep(3) : alert('يرجى اختيار صفك الدراسي')} 
      className={`next-btn ${!user?.studentLevel ? 'disabled' : ''}`}
      style={{ marginTop: '20px' }}
    >
      التالي
    </button>
  </motion.div>
)}

        {onboardingStep === 3 && (
          <motion.div initial={{ x: 20 }} animate={{ x: 0 }} className="step-content">
            <h3>إعداد الأمان</h3>
            <p>قم بإنشاء رمز PIN مكون من 4 أرقام للعمليات المالية</p>
            <div className="pin-input-group">
              <input 
                type="password" maxLength="4" placeholder="****" 
                className="pin-field"
                onChange={(e) => setUser({...user, securityPin: e.target.value})}
              />
            </div>
            <button 
              className="finish-btn" 
              onClick={async () => {
                setActionLoading(true);
                const userRef = doc(db, 'users', auth.currentUser.uid);
                await updateDoc(userRef, {
                  fullName: user.fullName,
                  phone: user.phone,
                  studentLevel: user.studentLevel,
                  securityPin: user.securityPin,
                  isActivated: true
                });
                setIsDataComplete(true);
                setActionLoading(false);
                showAlert("نجاح", "تم تفعيل حسابك بنجاح!", "success");
              }}
            >
              {actionLoading ? <RefreshCw className="spin" /> : "إنهاء وتفعيل الحساب"}
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );

  // مكون فرعي: البطاقة البلاتينية (The Visa Card UI)
  const PlatinumCard = () => {
    const { scrollY } = useScroll();
    const scale = useSpring(scrollY, { stiffness: 300, damping: 30 });

    return (
      <motion.div 
        className="platinum-card"
        whileHover={{ scale: 1.02, rotateY: 5 }}
        transition={{ type: "spring", stiffness: 400 }}
      >
        <div className="card-glass-effect"></div>
        <div className="card-header">
          <div className="chip-container">
            <div className="gold-chip"></div>
            <Fingerprint size={24} className="nfc-icon" />
          </div>
          <div className="brand-logo">MAFA<span>PLATINUM</span></div>
        </div>

        <div className="card-balance-section">
          <span className="balance-label">الرصيد المتاح</span>
          <div className="balance-amount">
            {showBalance ? (
              <h2>{user?.balance?.toLocaleString() || '0.00'} <small>EGP</small></h2>
            ) : (
              <h2>•••••••</h2>
            )}
            <button onClick={() => setShowBalance(!showBalance)} className="eye-toggle">
              {showBalance ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className="card-footer">
          <div className="card-holder">
            <span>صاحب البطاقة</span>
            <p>{user?.fullName || "جاري التحميل..."}</p>
          </div>
          <div className="card-id">
            <span>MAFA ID</span>
            <p>{user?.mafaID}</p>
          </div>
          <div className="card-type">
            <Award className="text-gold" />
          </div>
        </div>
      </motion.div>
    );
  };

  // مكون فرعي: شريط المهام السريع (Quick Actions)
  const QuickActions = () => (
    <div className="quick-actions-grid">
      <div className="action-item" onClick={() => secureOpenModal('transfer')}>
        <div className="action-icon purple"><ArrowUpRight /></div>
        <span>تحويل</span>
      </div>
      <div className="action-item" onClick={() => secureOpenModal('recharge')}>
        <div className="action-icon green"><Plus /></div>
        <span>شحن</span>
      </div>
      <div className="action-item" onClick={() => setActiveTab('analytics')}>
        <div className="action-icon blue"><BarChart3 /></div>
        <span>تقارير</span>
      </div>
      <div className="action-item" onClick={() => secureOpenModal('vault')}>
        <div className="action-icon gold"><Lock /></div>
        <span>الخزنة</span>
      </div>
    </div>
  );

  // =========================================================================
  // [ SECTION 7: RENDER CONTROLLER ]
  // =========================================================================

  if (loading) return (
    <div className="loader-container">
      <motion.div 
        animate={{ rotate: 360 }} 
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      >
        <RefreshCw size={48} className="text-purple" />
      </motion.div>
      <p>جاري فحص بروتوكولات الأمان...</p>
    </div>
  );

  return (
    <div className="wallet-master-container">
      {/* 1. نظام الحماية: منع الدخول إلا بعد إكمال البيانات */}
      {!isDataComplete && <OnboardingScreen />}

      {/* 2. نظام التنبيهات الذكي (Alerts) */}
      <AnimatePresence>
        {systemAlert && (
          <motion.div 
            className={`system-toast ${systemAlert.type}`}
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 20 }}
            exit={{ opacity: 0, y: -50 }}
          >
            {systemAlert.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <div className="toast-text">
              <h5>{systemAlert.title}</h5>
              <p>{systemAlert.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. الهيدر (Navbar) */}
      <nav className="platinum-nav">
        <div className="nav-profile-section">
          <div className="avatar-group">
            <img src={user?.avatar || 'https://via.placeholder.com/150'} alt="User" />
            {user?.isActivated && <div className="verified-status"><ShieldCheck size={12} /></div>}
          </div>
          <div className="nav-user-meta">
            <h4>{user?.fullName || "جاري التحميل..."}</h4>
            <div className="rank-badge">{user?.rank}</div>
          </div>
        </div>
        <div className="nav-actions">
          <div className="notif-icon" onClick={() => setActiveTab('notifications')}>
            <Bell size={24} />
            {notifications.length > 0 && <span className="notif-dot">{notifications.length}</span>}
          </div>
          <Settings size={24} className="settings-gear" />
        </div>
      </nav>

      {/* 4. محتوى التابات (Main Tabs) */}
      <main className="wallet-main-viewport">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* البطاقة البلاتينية */}
              <PlatinumCard />
              
              {/* أزرار الوصول السريع */}
              <QuickActions />

              {/* ميزة النقاط (اللوجيك ميزة 9) */}
              <div className="loyalty-card">
                <div className="loyalty-content">
                  <div className="star-ring"><Star fill="#FFD700" color="#FFD700" /></div>
                  <div className="loyalty-info">
                    <h3>{user?.points || 0} نقطة ولاء</h3>
                    <p>يمكنك تحويلها إلى {(user?.points / POINT_TO_CASH_RATIO).toFixed(2)} ج.م</p>
                  </div>
                </div>
                <button 
                  className="convert-points-btn" 
                  onClick={convertLoyaltyPoints}
                  disabled={actionLoading}
                >
                  {actionLoading ? <RefreshCw className="spin" /> : "استبدال الآن"}
                </button>
              </div>

              {/* ميزة الإحصائيات (اللوجيك ميزة 4) */}
              <div className="analytics-preview">
                <div className="stat-item">
                  <ArrowDownLeft color="#10b981" />
                  <div><span>دخل الشهر</span><p>{analytics.monthlyIncome} ج.م</p></div>
                </div>
                <div className="stat-item">
                  <ArrowUpRight color="#ef4444" />
                  <div><span>مصروف الشهر</span><p>{analytics.monthlySpending} ج.م</p></div>
                </div>
              </div>

              {/* سجل العمليات المصغر */}
              <div className="section-header">
                <h3>النشاط الأخير</h3>
                <button onClick={() => setActiveTab('history')}>عرض الكل</button>
              </div>
              <div className="mini-transactions">
                {transactions.slice(0, 5).map(renderTransactionItem)}
              </div>
            </motion.div>
          )}

          {/* ميزة الخزنة (اللوجيك ميزة 7) */}
          {activeTab === 'vault' && (
            <motion.div key="vault" className="vault-interface" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
              <div className="vault-safe-box">
                <Lock size={50} className="lock-icon" />
                <h2>خزنة MAFA الآمنة</h2>
                <div className="vault-balance-card">
                  <span>الرصيد المحمي</span>
                  <h1>{user?.vaultBalance?.toLocaleString()} <small>EGP</small></h1>
                </div>
                <div className="vault-inputs">
                  <input 
                    type="number" 
                    placeholder="المبلغ..." 
                    value={vaultState.actionAmount}
                    onChange={(e) => setVaultState({...vaultState, actionAmount: e.target.value})}
                  />
                  <div className="vault-btn-row">
                    <button onClick={() => manageVault('deposit')} className="v-btn-in">إيداع للخزنة</button>
                    <button onClick={() => manageVault('withdraw')} className="v-btn-out">سحب للمحفظة</button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 5. نظام المودالات (اللوجيك ميزات 5, 6, 8) */}
      <AnimatePresence>
        {activeModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal-sheet" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}>
              <div className="sheet-handle" onClick={() => setActiveModal(null)}></div>
              
              {/* مودال التحويل المالي (الميزات 5 و 6) */}
              {activeModal === 'transfer' && (
                <div className="modal-body">
                  <h3>تحويل مالي آمن</h3>
                  <div className="recipient-search-area">
                    <input 
                      type="text" 
                      placeholder="أدخل MAFA ID المستلم" 
                      onChange={(e) => handleRecipientSearch(e.target.value)}
                    />
                    {actionLoading && <RefreshCw className="spin" />}
                  </div>

                  {/* نتائج البحث من اللوجيك */}
                  {searchResult && searchResult !== 'not_found' && searchResult !== 'self' && (
                    <div className="search-success-card">
                      <img src={searchResult.avatar} alt="" />
                      <div className="res-meta">
                        <p>{searchResult.name}</p>
                        <span>{searchResult.level}</span>
                      </div>
                      <UserCheck color="#10b981" />
                    </div>
                  )}

                  <div className="amount-field">
                    <label>المبلغ</label>
                    <input type="number" placeholder="0.00" onChange={(e) => setTransferData({...transferData, amount: e.target.value})} />
                  </div>

                  <div className="pin-field">
                    <label>رمز PIN الأمني</label>
                    <input type="password" maxLength="4" placeholder="****" onChange={(e) => setTransferData({...transferData, pin: e.target.value})} />
                  </div>

                  <button className="main-action-btn" onClick={executeSecureTransfer}>تأكيد العملية</button>
                </div>
              )}

              {/* مودال الشحن (الميزة 8) */}
              {activeModal === 'recharge' && (
                <div className="modal-body">
                  <h3>شحن الرصيد</h3>
                  <div className="methods-grid">
                    {Object.values(RECHARGE_METHODS).map(m => (
                      <div 
                        key={m.id} 
                        className={`m-item ${rechargeData.method === m.id ? 'active' : ''}`}
                        onClick={() => setRechargeData({...rechargeData, method: m.id})}
                      >
                        {m.name}
                      </div>
                    ))}
                  </div>
                  <div className="upload-section" onClick={() => document.getElementById('file-up').click()}>
                    {rechargeData.previewUrl ? (
                      <img src={rechargeData.previewUrl} className="receipt-preview" />
                    ) : (
                      <><ImageIcon size={30} /><p>ارفع صورة الإيصال</p></>
                    )}
                    <input id="file-up" type="file" hidden onChange={(e) => {
                      const file = e.target.files[0];
                      setRechargeData({...rechargeData, receiptFile: file, previewUrl: URL.createObjectURL(file)});
                    }} />
                  </div>
                  <button className="main-action-btn" onClick={handleRechargeSubmission}>إرسال الطلب</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. شريط التنقل السفلي */}
      <footer className="platinum-bottom-nav">
        <div className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          <Smartphone /><span>الرئيسية</span>
        </div>
        <div className={`nav-tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          <History /><span>النشاط</span>
        </div>
        <div className="nav-tab-center" onClick={() => secureOpenModal('transfer')}>
          <div className="fab-plus"><Plus size={30} /></div>
        </div>
        <div className={`nav-tab ${activeTab === 'vault' ? 'active' : ''}`} onClick={() => setActiveTab('vault')}>
          <PiggyBank /><span>الخزنة</span>
        </div>
        <div className={`nav-tab ${activeTab === 'support' ? 'active' : ''}`} onClick={() => setActiveTab('support')}>
          <Headphones /><span>الدعم</span>
        </div>
      </footer>
    </div>
  );
// =========================================================================
// [ SECTION 9: STYLESHEET (INTEGRATED CSS) ]
// =========================================================================

const styles = `
  .wallet-master-container {
    background: #0a0a0c;
    min-height: 100vh;
    color: white;
    font-family: 'Tajawal', sans-serif;
    padding-bottom: 90px;
    direction: rtl;
  }

  /* Platinum Card Styling */
  .platinum-card {
    background: linear-gradient(135deg, #1a1a1a 0%, #3d3d3d 50%, #1a1a1a 100%);
    margin: 20px;
    border-radius: 24px;
    padding: 25px;
    height: 220px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 20px 40px rgba(0,0,0,0.4);
    border: 1px solid rgba(255,215,0,0.2);
  }

  .card-glass-effect {
    position: absolute;
    top: -50%; left: -50%;
    width: 200%; height: 200%;
    background: linear-gradient(45deg, transparent 20%, rgba(255,255,255,0.05) 50%, transparent 80%);
    animation: shine 6s infinite linear;
  }

  @keyframes shine {
    0% { transform: translateX(-30%) translateY(-30%); }
    100% { transform: translateX(30%) translateY(30%); }
  }

  /* Onboarding Styles */
  .onboarding-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.95);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .onboarding-card {
    background: #161618;
    width: 100%;
    max-width: 450px;
    border-radius: 30px;
    padding: 40px 30px;
    text-align: center;
    border: 1px solid #333;
  }

  .step-content input {
    width: 100%;
    padding: 15px;
    margin: 10px 0;
    background: #222;
    border: 1px solid #444;
    border-radius: 12px;
    color: white;
    font-size: 16px;
  }

  .next-btn, .finish-btn {
    width: 100%;
    padding: 15px;
    margin-top: 20px;
    background: #7c4dff;
    border: none;
    border-radius: 12px;
    color: white;
    font-weight: bold;
    cursor: pointer;
  }

  /* Navigation & Tabs */
  .bottom-nav {
    position: fixed;
    bottom: 0; width: 100%;
    height: 80px;
    background: rgba(22, 22, 24, 0.9);
    backdrop-filter: blur(15px);
    display: flex;
    justify-content: space-around;
    align-items: center;
    border-top: 1px solid #333;
  }

  .nav-tab {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: #888;
    transition: 0.3s;
  }

  .nav-tab.active {
    color: #7c4dff;
    transform: translateY(-5px);
  }

  /* Modal Styles */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.8);
    z-index: 1000;
    display: flex;
    align-items: flex-end;
  }

  .modal-content {
    background: #1c1c1e;
    width: 100%;
    border-radius: 30px 30px 0 0;
    padding: 30px;
    max-height: 90vh;
    overflow-y: auto;
  }

  .text-gold { color: #ffd700; }
  .spin { animation: spin 1s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

  return (
    <>
      <style>{styles}</style>
      <div className="wallet-wrapper">
        {/* استدعاء المكونات التي تم تعريفها في الأجزاء السابقة */}
        {renderMainContent()} 
        {renderModals()}
      </div>
    </>
  );
};

export default Wallet;
  
  



