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

  const [filterQuery, setFilterQuery] = useState('');
const [selectedTransaction, setSelectedTransaction] = useState(null);
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
const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    setRechargeData(prev => ({
      ...prev,
      receiptFile: file,
      previewUrl: URL.createObjectURL(file)
    }));
  }
};

const shareReceipt = async () => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'إيصال عملية MAFA',
        text: `تمت عملية بنجاح بقيمة ${selectedTransaction.amount} ج.م`,
        url: window.location.href,
      });
    } catch (err) { console.log("Sharing failed", err); }
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
              {/* مودال التحويل المالي المطور والوحيد */}

              
{activeModal === 'transfer' && (
  <div className="modal-body">
    <div className="modal-header-modern">
      <ArrowUpRight className="header-icon-anim" />
      <h3>تحويل مالي آمن</h3>
      <p>أرسل الأموال فوراً وبأمان تام</p>
    </div>

    {/* منطقة البحث الذكي */}
    <div className="recipient-search-area">
      <label><Search size={16} /> ابحث عن المستلم</label>
      <div className="input-with-spinner">
        <input 
          type="text" 
          placeholder="أدخل MAFA ID المستلم..." 
          onChange={(e) => handleRecipientSearch(e.target.value)} 
        />
        {actionLoading && <RefreshCw className="spin-loader" size={18} />}
      </div>

      {/* عرض نتيجة البحث الذكي */}
      {searchResult && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }}
          className={`search-result-card ${searchResult === 'not_found' ? 'error' : 'success'}`}
        >
          {searchResult === 'not_found' ? (
            <div className="res-error"><AlertCircle size={20} /> المستخدم غير موجود</div>
          ) : searchResult === 'self' ? (
            <div className="res-error"><UserCheck size={20} /> لا يمكنك التحويل لنفسك</div>
          ) : (
            <div className="res-success-content">
              <img src={searchResult.avatar} alt="Avatar" className="res-avatar" />
              <div className="res-info">
                <h5>{searchResult.name}</h5>
                <span>{searchResult.level} • {searchResult.mafaId}</span>
              </div>
              <CheckCircle2 className="verified-icon" size={20} />
            </div>
          )}
        </motion.div>
      )}
    </div>

    {/* تفاصيل المبلغ والأمان */}
    <div className="secure-pin-section">
      <div className="amount-input-box">
        <span>المبلغ المراد تحويله</span>
        <input 
          type="number" 
          placeholder="0.00 EGP" 
          value={transferData.amount}
          onChange={(e) => setTransferData({...transferData, amount: e.target.value})}
        />
      </div>

      <div className="pin-code-box">
        <label>رمز PIN الأمني (4 أرقام)</label>
        <div className="pin-inputs-wrapper">
          <input 
            type="password" 
            maxLength="4" 
            placeholder="••••"
            className="pin-input-field"
            onChange={(e) => setTransferData({...transferData, pin: e.target.value})}
          />
          <Lock size={18} className="pin-lock-icon" />
        </div>
      </div>

      <button 
        className="execute-transfer-btn"
        disabled={!searchResult || searchResult === 'not_found' || !transferData.pin || actionLoading}
        onClick={executeSecureTransfer}
      >
        {actionLoading ? <RefreshCw className="spin" /> : "تأكيد التحويل الآن"}
      </button>
    </div>
  </div>
)}
              
{/* مودال التحويل المالي - جزء البحث */}
<div className="recipient-search-area">
  <label><Search size={16} /> ابحث عن المستلم</label>
  <div className="input-with-spinner">
    <input 
      type="text" 
      placeholder="أدخل MAFA ID المستلم..." 
      onChange={(e) => handleRecipientSearch(e.target.value)} 
    />
    {actionLoading && <RefreshCw className="spin-loader" size={18} />}
  </div>

  {/* عرض نتيجة البحث الذكي */}
  {searchResult && (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }} 
      animate={{ opacity: 1, scale: 1 }}
      className={`search-result-card ${searchResult === 'not_found' ? 'error' : 'success'}`}
    >
      {searchResult === 'not_found' ? (
        <div className="res-error"><AlertCircle size={20} /> المستخدم غير موجود</div>
      ) : searchResult === 'self' ? (
        <div className="res-error"><UserCheck size={20} /> لا يمكنك التحويل لنفسك</div>
      ) : (
        <div className="res-success-content">
          <img src={searchResult.avatar} alt="Avatar" className="res-avatar" />
          <div className="res-info">
            <h5>{searchResult.name}</h5>
            <span>{searchResult.level} • {searchResult.mafaId}</span>
          </div>
          <CheckCircle2 className="verified-icon" size={20} />
        </div>
      )}
    </motion.div>
  )}
</div>

              <div className="secure-pin-section">
  <div className="amount-input-box">
    <span>المبلغ المراد تحويله</span>
    <input 
      type="number" 
      placeholder="0.00 EGP" 
      value={transferData.amount}
      onChange={(e) => setTransferData({...transferData, amount: e.target.value})}
    />
  </div>

  <div className="pin-code-box">
    <label>رمز PIN الأمني (4 أرقام)</label>
    <div className="pin-inputs-wrapper">
      <input 
        type="password" 
        maxLength="4" 
        placeholder="••••"
        className="pin-input-field"
        onChange={(e) => setTransferData({...transferData, pin: e.target.value})}
      />
      <Lock size={18} className="pin-lock-icon" />
    </div>
    <p className="pin-hint">لا تشارك الرمز السري مع أحد</p>
  </div>

  <button 
    className="execute-transfer-btn"
    disabled={!searchResult || searchResult === 'not_found' || !transferData.pin}
    onClick={executeSecureTransfer}
  >
    {actionLoading ? <RefreshCw className="spin" /> : "تأكيد التحويل الآن"}
  </button>
</div>

              <div className="recharge-upload-container">
  <h3>تأكيد عملية الشحن</h3>
  <div className="method-selector">
    {Object.values(RECHARGE_METHODS).map(method => (
      <div 
        key={method.id}
        className={`method-card ${rechargeData.method === method.id ? 'active' : ''}`}
        onClick={() => setRechargeData({...rechargeData, method: method.id})}
      >
        <div className="method-dot" />
        <span>{method.name}</span>
      </div>
    ))}
  </div>

  {/* منطقة رفع الملفات والمعاينة */}
  <div 
    className="upload-dropzone"
    onClick={() => document.getElementById('receipt-input').click()}
  >
    {rechargeData.previewUrl ? (
      <div className="preview-wrapper">
        <img src={rechargeData.previewUrl} alt="Receipt Preview" />
        <div className="change-photo-overlay"><RefreshCw /> تغيير الصورة</div>
      </div>
    ) : (
      <div className="upload-placeholder">
        <ImageIcon size={40} />
        <p>اضغط لرفع صورة إيصال الدفع</p>
        <span>يدعم JPG, PNG (حد أقصى 5MB)</span>
      </div>
    )}
    <input 
      id="receipt-input" 
      type="file" 
      hidden 
      accept="image/*"
      onChange={handleFileChange} 
    />
  </div>

  <button 
    className="submit-recharge-btn"
    disabled={!rechargeData.receiptFile || actionLoading}
    onClick={handleRechargeSubmission}
  >
    {actionLoading ? "جاري الرفع..." : "إرسال الطلب للمراجعة"}
  </button>
</div>

              <div className="vault-master-card">
  <div className="vault-header">
    <div className="vault-title-group">
      <PiggyBank className="vault-icon" />
      <div>
        <h4>الخزنة الذكية</h4>
        <p>رصيد مدخر بعيداً عن العمليات اليومية</p>
      </div>
    </div>
    <div className="vault-badge-status">محمي</div>
  </div>

  <div className="vault-balance-display">
    <small>إجمالي المدخرات</small>
    <h2>{user?.vaultBalance?.toLocaleString() || 0} <span>EGP</span></h2>
  </div>

  <div className="vault-quick-actions">
    <div className="vault-input-wrap">
      <input 
        type="number" 
        placeholder="أدخل المبلغ..." 
        value={vaultState.actionAmount}
        onChange={(e) => setVaultState({...vaultState, actionAmount: e.target.value})}
      />
    </div>
    <div className="vault-buttons">
      <button onClick={() => manageVault('deposit')} className="btn-v-deposit">إيداع</button>
      <button onClick={() => manageVault('withdraw')} className="btn-v-withdraw">سحب</button>
    </div>
  </div>
</div>
{/* ميزة التفاعل: المهام اليومية لكسب النقاط */}
<div className="daily-quests-section">
  <div className="section-header">
    <h3>مهامك اليومية</h3>
    <div className="points-badge">+{user?.dailyBonusPoints || 0} اليوم</div>
  </div>
  
  <div className="quests-scroll">
    <div className={`quest-card ${user?.dailyLogin ? 'completed' : ''}`}>
      <div className="quest-icon"><CalendarCheck size={20} /></div>
      <div className="quest-info">
        <h5>تسجيل الدخول اليومي</h5>
        <p>احصل على 10 نقاط</p>
      </div>
      {user?.dailyLogin ? <CheckCircle2 className="text-success" /> : <ChevronLeft />}
    </div>

    <div className="quest-card">
      <div className="quest-icon"><Share2 size={20} /></div>
      <div className="quest-info">
        <h5>حول لصديق</h5>
        <p>احصل على 50 نقطة</p>
      </div>
      <button className="quest-action-btn">تنفيذ</button>
    </div>
  </div>
</div>
              {/* مودال الإشعارات التفصيلي */}
{activeTab === 'notifications' && (
  <motion.div className="notifications-page" initial={{ x: '100%' }} animate={{ x: 0 }}>
    <header className="page-header">
      <ArrowRight onClick={() => setActiveTab('dashboard')} />
      <h2>التنبيهات</h2>
      <button className="clear-all">مسح الكل</button>
    </header>

    <div className="notifications-list">
      {notifications.length > 0 ? (
        notifications.map(notif => (
          <div key={notif.id} className={`notif-item ${!notif.read ? 'unread' : ''}`}>
            <div className={`notif-type-icon ${notif.type}`}>
              {notif.type === 'receive' ? <ArrowDownLeft /> : <Bell />}
            </div>
            <div className="notif-content">
              <p>{notif.message}</p>
              <span>{notif.time}</span>
            </div>
            {!notif.read && <div className="unread-dot" />}
          </div>
        ))
      ) : (
        <div className="empty-notif">
          <BellOff size={50} />
          <p>لا توجد إشعارات جديدة</p>
        </div>
      )}
    </div>
  </motion.div>
)}
              {/* واجهة السجل مع الفلترة الذكية */}
<div className="history-filter-bar">
  <div className="search-box">
    <Search size={18} />
    <input 
      type="text" 
      placeholder="ابحث عن عملية..." 
      onChange={(e) => setFilterQuery(e.target.value)}
    />
  </div>
  <div className="filter-chips">
    <button className="f-chip active">الكل</button>
    <button className="f-chip">شحن</button>
    <button className="f-chip">تحويل</button>
    <button className="f-chip">سحب</button>
  </div>
</div>
              {/* شاشة التنبيه بالحساب غير المفعل */}
{!user?.isActivated && isDataComplete && (
  <div className="activation-warning-overlay">
    <div className="warning-card">
      <ShieldAlert size={60} className="text-gold" />
      <h2>حسابك قيد المراجعة</h2>
      <p>محفظتك جاهزة، لكنها تنتظر التفعيل من قبل الإدارة لتتمكن من إرسال واستقبال الأموال.</p>
      <div className="support-contact">
        <span>هل تواجه مشكلة؟</span>
        <button onClick={() => window.open('https://wa.me/yournumber')}>تواصل مع الدعم</button>
      </div>
    </div>
  </div>
)}
              {/* 1. تطوير حقل الـ PIN مع الملاحظات */}
<div className="transfer-note-area">
  <label>ملاحظة (اختياري)</label>
  <textarea 
    placeholder="اكتب سبب التحويل هنا..."
    onChange={(e) => setTransferData({...transferData, note: e.target.value})}
  />
</div>

{/* 2. شريط تقدم المستوى (Level Progress) */}
<div className="level-progress-card">
  <div className="level-info">
    <span>المستوى {user?.level}</span>
    <span>{user?.exp} / 1000 XP</span>
  </div>
  <div className="progress-bar-bg">
    <motion.div 
      className="progress-bar-fill"
      initial={{ width: 0 }}
      animate={{ width: `${(user?.exp / 1000) * 100}%` }}
    />
  </div>
  <p className="next-level-hint">باقي لك {1000 - user?.exp} نقطة للوصول للمستوى التالي!</p>
</div>
           {/* مودال تفاصيل العملية عند الضغط عليها في السجل */}
{selectedTransaction && (
  <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
    <div className="receipt-card-modal">
      <div className="receipt-header">
        <div className="status-badge-big success">عملية ناجحة</div>
        <h2>{selectedTransaction.amount} EGP</h2>
        <p>{selectedTransaction.type === 'send' ? 'تحويل مالي' : 'استلام أموال'}</p>
      </div>
      <div className="receipt-body">
        <div className="r-row"><span>المستلم:</span> <strong>{selectedTransaction.toName}</strong></div>
        <div className="r-row"><span>التاريخ:</span> <strong>{selectedTransaction.date}</strong></div>
        <div className="r-row"><span>رقم العملية:</span> <small>{selectedTransaction.id}</small></div>
      </div>
      <button className="share-receipt-btn" onClick={shareReceipt}>مشاركة الإيصال</button>
      <button className="close-receipt" onClick={() => setSelectedTransaction(null)}>إغلاق</button>
    </div>
  </motion.div>
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
/* تصميم حقل البحث والأنيميشن */
.input-with-spinner {
  position: relative;
  display: flex;
  align-items: center;
}

.spin-loader {
  position: absolute;
  left: 15px;
  color: var(--platinum-gold);
  animation: spin 1s linear infinite;
}

/* بطاقة نتيجة البحث */
.search-result-card {
  margin-top: 15px;
  padding: 12px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.search-result-card.success { border-color: #10b981; background: rgba(16, 185, 129, 0.05); }
.search-result-card.error { border-color: #ef4444; background: rgba(239, 68, 68, 0.05); }

.res-avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--platinum-gold);
}

.res-info h5 { margin: 0; color: white; font-size: 0.95rem; }
.res-info span { font-size: 0.75rem; color: #888; }

.verified-icon { color: #10b981; margin-right: auto; }

  /* شريط تقدم المستوى */
.level-progress-card {
  background: linear-gradient(135deg, #1e1e2e 0%, #11111d 100%);
  padding: 15px;
  border-radius: 16px;
  margin: 15px 0;
  border: 1px solid rgba(255, 215, 0, 0.1);
}

.progress-bar-bg {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  margin: 10px 0;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffd700, #ff9d00);
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

/* بطاقة المهام اليومية */
.daily-quests-section { margin-top: 25px; }
.quests-scroll { display: flex; flex-direction: column; gap: 10px; margin-top: 15px; }

.quest-card {
  background: rgba(255, 255, 255, 0.03);
  padding: 12px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 15px;
  transition: 0.3s;
}

.quest-card.completed { opacity: 0.6; background: rgba(16, 185, 129, 0.1); }
.quest-icon { padding: 8px; background: rgba(255, 215, 0, 0.1); border-radius: 10px; color: var(--platinum-gold); }

  /* Modal Styles */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.8);
    z-index: 1000;
    display: flex;
    align-items: flex-end;
  }
.receipt-card-modal {
  background: white;
  color: #1a1a1a;
  width: 90%;
  max-width: 350px;
  border-radius: 24px;
  padding: 25px;
  text-align: center;
  position: relative;
}

.receipt-header { border-bottom: 2px dashed #eee; padding-bottom: 20px; margin-bottom: 20px; }
.status-badge-big { 
  display: inline-block; 
  padding: 5px 15px; 
  border-radius: 20px; 
  font-size: 0.8rem; 
  margin-bottom: 10px; 
}
.status-badge-big.success { background: #e6f7f0; color: #10b981; }

.receipt-body .r-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 0.9rem;
}

.share-receipt-btn {
  width: 100%;
  padding: 12px;
  background: #1a1a1a;
  color: white;
  border-radius: 12px;
  margin-top: 20px;
  font-weight: bold;
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
  /* ==========================================================
   MAFA PLATINUM - FINAL ADD-ONS STYLES (Elite Features)
   ========================================================== */

/* 1. إيصال العملية الاحترافي (Transaction Receipt Modal) */
.receipt-card-modal {
    background: #ffffff;
    color: #1a1a1c;
    width: 92%;
    max-width: 380px;
    margin: auto;
    border-radius: 30px;
    padding: 35px 25px;
    text-align: center;
    position: relative;
    box-shadow: 0 25px 50px rgba(0,0,0,0.5);
    background-image: radial-gradient(circle at 2px 2px, #f0f0f0 1px, transparent 0);
    background-size: 20px 20px; /* شكل ورق الإيصالات الحقيقي */
}

.receipt-header .status-badge-big {
    display: inline-block;
    padding: 6px 16px;
    border-radius: 50px;
    font-size: 0.8rem;
    font-weight: 800;
    margin-bottom: 15px;
}

.status-badge-big.success { background: #dcfce7; color: #15803d; }

.receipt-header h2 {
    font-size: 2.5rem;
    font-weight: 900;
    margin: 5px 0;
    color: #000;
    letter-spacing: -1px;
}

.receipt-body {
    margin: 25px 0;
    border-top: 2px dashed #e5e7eb;
    border-bottom: 2px dashed #e5e7eb;
    padding: 20px 0;
}

.r-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    font-size: 0.95rem;
}

.r-row span { color: #6b7280; }
.r-row strong { color: #111827; font-weight: 700; }

.share-receipt-btn {
    width: 100%;
    background: #7c4dff;
    color: white;
    border: none;
    padding: 16px;
    border-radius: 16px;
    font-weight: 800;
    font-size: 1rem;
    cursor: pointer;
    transition: 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
}

/* 2. شريط تقدم المستوى (Level & XP Progress) */
.level-progress-card {
    margin: 20px;
    background: rgba(255, 255, 255, 0.03);
    padding: 18px;
    border-radius: 22px;
    border: 1px solid rgba(255, 255, 255, 0.05);
}

.level-info {
    display: flex;
    justify-content: space-between;
    font-weight: 700;
    font-size: 0.85rem;
    color: var(--primary-gold);
}

.progress-bar-bg {
    height: 10px;
    background: #1f1f23;
    border-radius: 20px;
    margin: 12px 0;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.05);
}

.progress-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #7c4dff, #ffd700);
    box-shadow: 0 0 15px rgba(124, 77, 255, 0.5);
}

/* 3. حالات الفراغ (Empty States) */
.empty-state-container {
    padding: 60px 20px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    color: #52525b;
}

.empty-illustration {
    margin-bottom: 20px;
    opacity: 0.3;
}

.empty-state-container h4 {
    color: #e4e4e7;
    margin-bottom: 8px;
    font-size: 1.1rem;
}

/* 4. حقل الملاحظات في التحويل (Transfer Notes) */
.transfer-note-area {
    margin-top: 15px;
}

.transfer-note-area label {
    font-size: 0.8rem;
    color: #71717a;
    display: block;
    margin-bottom: 8px;
}

.transfer-note-area textarea {
    width: 100%;
    background: #000;
    border: 1.5px solid #27272a;
    border-radius: 15px;
    color: white;
    padding: 12px;
    font-size: 0.9rem;
    resize: none;
    transition: 0.3s;
}

.transfer-note-area textarea:focus {
    border-color: #7c4dff;
    outline: none;
}

/* 5. وضع الخصوصية (Blur Effect) */
.privacy-active .balance-amount {
    filter: blur(8px);
    pointer-events: none;
    user-select: none;
}
/* ==========================================================
   MAFA PLATINUM - FINAL ARCHITECTURE (PART 4)
   ========================================================== */

/* 1. مركز الإشعارات (Notification Center) */
.notifications-page {
    position: fixed;
    inset: 0;
    background: #09090b;
    z-index: 5000;
    display: flex;
    flex-direction: column;
}

.page-header {
    padding: 25px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #1f1f23;
}

.notif-list {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
}

.notif-item {
    display: flex;
    gap: 15px;
    padding: 18px;
    border-radius: 20px;
    margin-bottom: 8px;
    background: rgba(255, 255, 255, 0.02);
    transition: 0.3s;
    position: relative;
}

.notif-item.unread {
    background: rgba(124, 77, 255, 0.08);
    border: 1px solid rgba(124, 77, 255, 0.1);
}

.notif-type-icon {
    width: 45px;
    height: 45px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.notif-type-icon.receive { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.notif-type-icon.system { background: rgba(124, 77, 255, 0.1); color: #7c4dff; }

.unread-dot {
    width: 8px;
    height: 8px;
    background: #7c4dff;
    border-radius: 50%;
    position: absolute;
    right: 15px;
    top: 20px;
}

/* 2. نظام المهام اليومية (Daily Quests) */
.quests-scroll {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 5px;
}

.quest-card {
    background: linear-gradient(90deg, #161618 0%, #09090b 100%);
    border: 1px solid #27272a;
    padding: 16px;
    border-radius: 20px;
    display: flex;
    align-items: center;
    gap: 15px;
    transition: 0.3s;
}

.quest-card.completed {
    border-color: #10b981;
    background: rgba(16, 185, 129, 0.05);
}

.quest-icon {
    background: #1f1f23;
    padding: 10px;
    border-radius: 12px;
    color: #ffd700;
}

.quest-info h5 { font-size: 0.95rem; margin: 0; color: #fff; }
.quest-info p { font-size: 0.75rem; color: #71717a; margin-top: 3px; }

/* 3. شريط الفلترة (Transaction Filter Bar) */
.history-filter-bar {
    padding: 15px 20px;
    background: #09090b;
    position: sticky;
    top: 0;
    z-index: 100;
}

.filter-chips {
    display: flex;
    gap: 10px;
    overflow-x: auto;
    padding: 10px 0;
    scrollbar-width: none;
}

.f-chip {
    padding: 8px 20px;
    background: #1f1f23;
    border-radius: 50px;
    border: 1px solid transparent;
    color: #a1a1aa;
    font-size: 0.85rem;
    white-space: nowrap;
    cursor: pointer;
}

.f-chip.active {
    background: rgba(124, 77, 255, 0.1);
    color: #7c4dff;
    border-color: #7c4dff;
    font-weight: 700;
}

/* 4. شاشة حماية التفعيل (Activation Guard) */
.activation-warning-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.95);
    backdrop-filter: blur(15px);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 25px;
}

.warning-card {
    background: #161618;
    border: 1px solid rgba(255, 215, 0, 0.2);
    border-radius: 35px;
    padding: 40px 25px;
    text-align: center;
    max-width: 400px;
    box-shadow: 0 0 50px rgba(0,0,0,0.5);
}

.warning-card h2 { margin: 20px 0 10px; color: #fff; }
.warning-card p { color: #a1a1aa; font-size: 0.9rem; line-height: 1.6; }

.support-contact {
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px solid #27272a;
}

.support-contact button {
    background: transparent;
    color: #ffd700;
    border: 1.5px solid #ffd700;
    padding: 12px 25px;
    border-radius: 15px;
    margin-top: 10px;
    font-weight: 700;
    cursor: pointer;
}

/* 5. تأثيرات الحركة (Micro-Interactions) */
.notif-item:active, .quest-card:active {
    transform: scale(0.98);
    background: rgba(255, 255, 255, 0.05);
}

/* أنيميشن الدخول للقوائم */
@keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}

.notif-item { animation: slideUp 0.4s ease forwards; }

/* 6. تنسيق البحث السريع (Quick Search Input) */
.search-box {
    background: #1f1f23;
    border-radius: 15px;
    display: flex;
    align-items: center;
    padding: 0 15px;
    border: 1px solid transparent;
}

.search-box:focus-within {
    border-color: #7c4dff;
}

.search-box input {
    background: transparent;
    border: none;
    padding: 12px;
    color: #fff;
    width: 100%;
}


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
  
  




