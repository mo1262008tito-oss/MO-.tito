import React, { useState, useEffect, useMemo } from 'react';
import { db, auth, storage } from '../firebase';
import { 
  doc, onSnapshot, updateDoc, increment, 
  collection, addDoc, serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet as WalletIcon, Coins, ArrowRightLeft, 
  History, ShieldCheck, Image as ImageIcon, 
  Send, Zap, CreditCard, Gift, AlertCircle, 
  CheckCircle2, Plus, Info, PhoneCall
} from 'lucide-react';
import './Wallet.css';


const Wallet = () => {
  // --- 1. States Management ---
  const [userData, setUserData] = useState({ balance: 0, xp: 0 });
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exchangeAmount, setExchangeAmount] = useState('');
  const [uploading, setUploading] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, deposit, convert

  // ثابت التحويل
  const XP_RATE = 20000;
  const MONEY_RATE = 10;

  // --- 2. Real-time Data Fetching ---
  useEffect(() => {
    if (!auth.currentUser) return;

    // جلب بيانات الطالب (الرصيد والنقاط)
    const userRef = doc(db, 'students', auth.currentUser.uid);
    const unsubUser = onSnapshot(userRef, (snap) => {
      if (snap.exists()) setUserData(snap.data());
    });

    // جلب خطط الشحن من الإدارة
    const plansRef = collection(db, 'pricing_plans');
    const unsubPlans = onSnapshot(plansRef, (snap) => {
      setPlans(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => { unsubUser(); unsubPlans(); };
  }, []);

  // --- 3. Logic: XP to Money Converter ---
  const handleConversion = async () => {
    const amount = parseInt(exchangeAmount);
    if (isNaN(amount) || amount < XP_RATE) {
      alert(`الحد الأدنى للتحويل هو ${XP_RATE} نقطة`);
      return;
    }

    if (userData.xp < amount) {
      alert("رصيد نقاطك لا يكفي");
      return;
    }

    const moneyGained = (amount / XP_RATE) * MONEY_RATE;
    const userRef = doc(db, 'students', auth.currentUser.uid);

    try {
      await updateDoc(userRef, {
        xp: increment(-amount),
        balance: increment(moneyGained)
      });
      setExchangeAmount('');
      alert(`تم تحويل النقاط بنجاح! حصلت على ${moneyGained} جنيه`);
    } catch (err) {
      console.error(err);
    }
  };

  // --- 4. Logic: Vodafone Cash & WhatsApp Flow ---
  const handlePaymentSubmit = async (plan) => {
    if (!receipt) {
      alert("يرجى رفع صورة إيصال التحويل أولاً");
      return;
    }

    setUploading(true);
    try {
      // 1. رفع الصورة لـ Firebase Storage
      const storageRef = ref(storage, `receipts/${auth.currentUser.uid}_${Date.now()}`);
      await uploadBytes(storageRef, receipt);
      const downloadURL = await getDownloadURL(storageRef);

      // 2. تسجيل الطلب في Firestore للآدمن
      await addDoc(collection(db, 'payment_requests'), {
        userId: auth.currentUser.uid,
        userName: userData.name,
        planTitle: plan.title,
        amount: plan.price,
        receiptUrl: downloadURL,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      // 3. تحويل المستخدم للواتساب مع الرسالة والكود
      const message = `مرحباً آدمن STUDENT-PRO%0Aلقد قمت بدفع مبلغ ${plan.price} جنيهاً%0Aكود الخطة: ${plan.code}%0Aرقم الطالب: ${auth.currentUser.uid}`;
      window.open(`https://wa.me/201012345678?text=${message}`, '_blank'); // استبدل بالرقم الخاص بك

      alert("تم إرسال طلبك للآدمن، يرجى انتظار التفعيل");
      setReceipt(null);
    } catch (err) {
      alert("حدث خطأ أثناء العملية");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="super-wallet-container">
      {/* هيدر المحفظة */}
      <header className="wallet-header-v6 glass">
        <div className="w-info">
          <div className="w-icon-box"><WalletIcon size={30} /></div>
          <div>
            <h1>المحفظة المركزية</h1>
            <p>تحكم في أرصدتك، نقاطك، واشتراكاتك في مكان واحد</p>
          </div>
        </div>
        <div className="w-total-display">
          <div className="balance-box">
            <small>رصيدك الحالي</small>
            <div className="amount">{userData.balance?.toFixed(2)} <span>EGP</span></div>
          </div>
          <div className="xp-box">
            <small>نقاط XP</small>
            <div className="amount">{userData.xp?.toLocaleString()} <span>XP</span></div>
          </div>
        </div>
      </header>

      {/* شريط التنقل الداخلي */}
      <nav className="wallet-tabs">
        <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}><Zap size={18} /> نظرة عامة</button>
        <button className={activeTab === 'convert' ? 'active' : ''} onClick={() => setActiveTab('convert')}><ArrowRightLeft size={18} /> تحويل النقاط</button>
        <button className={activeTab === 'deposit' ? 'active' : ''} onClick={() => setActiveTab('deposit')}><CreditCard size={18} /> شحن الرصيد</button>
      </nav>

      <main className="wallet-main-content">
        <AnimatePresence mode='wait'>
          
          {/* 1. قسم نظرة عامة */}
          {activeTab === 'overview' && (
            <motion.section key="ov" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="overview-section">
              <div className="stats-cards">
                <div className="s-card glass">
                  <Trophy size={24} color="#f1c40f" />
                  <h4>مكافآت التعلم</h4>
                  <p>لقد جمعت نقاطاً بقيمة {((userData.xp / XP_RATE) * MONEY_RATE).toFixed(0)} جنيه تقريباً</p>
                </div>
                <div className="s-card glass">
                  <ShieldCheck size={24} color="#43e97b" />
                  <h4>أمان مالي</h4>
                  <p>جميع عملياتك مشفرة ومؤمنة بالكامل</p>
                </div>
              </div>

              <div className="history-table glass">
                <div className="h-header">
                  <h3>سجل العمليات الأخير</h3>
                  <button className="view-all">عرض الكل <History size={14} /></button>
                </div>
                <div className="h-list">
                  {/* تجريبي - يفضل جلبه من الكولكشن الخاص بالعمليات */}
                  <div className="h-item">
                    <div className="h-icon plus"><Plus size={16} /></div>
                    <div className="h-text"><strong>شحن رصيد - فودافون كاش</strong><small>12 يناير 2026</small></div>
                    <div className="h-amount">+150 EGP</div>
                  </div>
                  <div className="h-item">
                    <div className="h-icon convert"><ArrowRightLeft size={16} /></div>
                    <div className="h-text"><strong>تحويل نقاط XP</strong><small>10 يناير 2026</small></div>
                    <div className="h-amount">+10 EGP</div>
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {/* 2. قسم تحويل النقاط */}
          {activeTab === 'convert' && (
            <motion.section key="cv" initial={{x: 20, opacity:0}} animate={{x:0, opacity:1}} className="convert-section glass">
              <div className="convert-box">
                <div className="c-header">
                  <Coins size={40} color="#f1c40f" />
                  <h2>نظام استبدال النقاط</h2>
                  <p>كل {XP_RATE.toLocaleString()} نقطة تمنحك {MONEY_RATE} جنيه في محفظتك</p>
                </div>

                <div className="input-group-v6">
                  <label>أدخل عدد النقاط التي تريد تحويلها</label>
                  <input 
                    type="number" 
                    placeholder="مثال: 40000" 
                    value={exchangeAmount}
                    onChange={(e) => setExchangeAmount(e.target.value)}
                  />
                  <div className="preview-gain">
                    ستحصل على: <span>{(parseInt(exchangeAmount || 0) / XP_RATE * MONEY_RATE).toFixed(2)} EGP</span>
                  </div>
                </div>

                <button className="confirm-convert-btn" onClick={handleConversion}>
                  تأكيد التحويل الآن
                </button>

                <div className="info-alert">
                  <Info size={18} />
                  <p>تتم عملية التحويل فورياً ويتم خصم النقاط من رصيدك مباشرة.</p>
                </div>
              </div>
            </motion.section>
          )}

          {/* 3. قسم شحن الرصيد والخطط */}
          {activeTab === 'deposit' && (
            <motion.section key="dp" initial={{y: 20, opacity:0}} animate={{y:0, opacity:1}} className="deposit-section">
              <div className="payment-methods-grid">
                <div className="method-card active glass">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/a/af/Vodafone_Logo.png" alt="vodafone" />
                  <div>
                    <h4>فودافون كاش</h4>
                    <p>الرقم: 01012345678</p>
                  </div>
                  <CheckCircle2 className="check" />
                </div>
              </div>

              <div className="plans-grid">
                {plans.map(plan => (
                  <div key={plan.id} className="price-plan-card glass-heavy">
                    {plan.isPopular && <div className="popular-tag">الأكثر طلباً</div>}
                    <h3>{plan.title}</h3>
                    <div className="p-price">{plan.price} <span>EGP</span></div>
                    <ul className="p-features">
                      {plan.features?.map((f, i) => <li key={i}><CheckCircle2 size={14} /> {f}</li>)}
                    </ul>
                    
                    <div className="upload-receipt-area">
                      <input 
                        type="file" 
                        id={`file-${plan.id}`} 
                        hidden 
                        onChange={(e) => setReceipt(e.target.files[0])} 
                      />
                      <label htmlFor={`file-${plan.id}`} className="file-label">
                        {receipt ? <><CheckCircle2 size={16} /> تم اختيار الصورة</> : <><ImageIcon size={16} /> ارفع إيصال الدفع</>}
                      </label>
                    </div>

                    <button 
                      className="order-btn" 
                      disabled={uploading}
                      onClick={() => handlePaymentSubmit(plan)}
                    >
                      {uploading ? 'جاري المعالجة...' : 'اطلب الكود عبر واتساب'}
                    </button>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
};

export default Wallet;
