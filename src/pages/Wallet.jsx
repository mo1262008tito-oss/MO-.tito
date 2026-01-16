import React, { useState, useEffect } from 'react';
import { db, auth, storage } from '../firebase';
import { 
  doc, onSnapshot, updateDoc, increment, 
  collection, addDoc, serverTimestamp, setDoc, getDoc,
  query, where, orderBy, limit 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet as WalletIcon, Coins, ArrowRightLeft, 
  History, ShieldCheck, Image as ImageIcon, 
  Zap, CreditCard, CheckCircle2, Plus, Info, Trophy,
  Key, Banknote, Smartphone, Receipt, AlertCircle,
  MessageSquare, ExternalLink, Download, Star, ChevronLeft
} from 'lucide-react';
import './Wallet.css';

const Wallet = () => {
  // --- States ---
  const [userData, setUserData] = useState({ balance: 0, xp: 0, level: 'مبتدئ' });
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [plans, setPlans] = useState([]);
  
  // Logic States
  const [promoCode, setPromoCode] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const XP_RATE = 20000;
  const MONEY_RATE = 10;
  const ADMIN_WHATSAPP = "201012345678"; // رقم الأدمن هنا

  useEffect(() => {
    if (!auth.currentUser) return;
    
    // جلب البيانات الأساسية
    const userRef = doc(db, 'students', auth.currentUser.uid);
    const unsubUser = onSnapshot(userRef, (snap) => {
      if (snap.exists()) setUserData(snap.data());
      setLoading(false);
    });

    // جلب العمليات مع فرز متقدم
    const q = query(collection(db, 'transactions'), 
      where('userId', '==', auth.currentUser.uid), 
      orderBy('timestamp', 'desc'), limit(10)
    );
    const unsubTrans = onSnapshot(q, (snap) => {
      setTransactions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubPlans = onSnapshot(collection(db, 'pricing_plans'), (snap) => {
      setPlans(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubUser(); unsubTrans(); unsubPlans(); };
  }, []);

  // --- دوال اللوجيك المطور ---

  // 1. إرسال تقرير مشكلة للواتساب
  const reportProblem = (type, details = "") => {
    const text = `⚠️ تقرير مشكلة في المحفظة%0Aالنوع: ${type}%0Aاسم الطالب: ${userData.displayName}%0Aكود الطالب: ${auth.currentUser.uid}%0Aتفاصيل إضافية: ${details}`;
    window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${text}`, '_blank');
  };

  // 2. تفعيل الأكواد الفوري
  const handleRedeem = async () => {
    if (!promoCode) return;
    setIsProcessing(true);
    try {
      const codeRef = doc(db, 'promo_codes', promoCode.trim());
      const snap = await getDoc(codeRef);
      
      if (snap.exists() && !snap.data().used) {
        await updateDoc(doc(db, 'students', auth.currentUser.uid), { balance: increment(snap.data().value) });
        await updateDoc(codeRef, { used: true, usedBy: auth.currentUser.uid });
        alert("✅ تم الشحن بنجاح!");
        setPromoCode('');
      } else {
        alert("❌ كود خاطئ أو مستخدم");
      }
    } catch (e) { alert("حدث خطأ في النظام"); }
    setIsProcessing(false);
  };

  if (loading) return <div className="wallet-loader-overlay">🚀 جاري تأمين المحفظة...</div>;

  return (
    <div className="modern-wallet-root">
      
      {/* هيدر بنمط Neumorphism و Glass */}
      <div className="wallet-main-header glass">
        <div className="user-profile-mini">
          <div className="avatar-wrapper">
             <img src={auth.currentUser.photoURL || "/default-avatar.png"} alt="user" />
             <div className="level-badge">{userData.level || 'برونزي'}</div>
          </div>
          <div className="welcome-txt">
            <h2>أهلاً، {userData.displayName?.split(' ')[0]}</h2>
            <p><Star size={12} fill="#ffd700" /> عضو مميز بالمنصة</p>
          </div>
        </div>
        
        <div className="balance-card-v8">
           <div className="main-bal">
              <small>إجمالي الرصيد</small>
              <h1>{userData.balance?.toFixed(2)} <span>EGP</span></h1>
           </div>
           <div className="bal-actions">
              <button onClick={() => setActiveTab('deposit')}><Plus size={16}/> شحن</button>
              <button onClick={() => setActiveTab('convert')} className="sec"><ArrowRightLeft size={16}/> تحويل</button>
           </div>
        </div>
      </div>

      {/* شريط التنقل السفلي الاحترافي */}
      <nav className="bottom-nav-v8 glass">
        <button className={activeTab === 'overview' ? 'active' : ''} onClick={()=>setActiveTab('overview')}><Zap /> <span>الرئيسية</span></button>
        <button className={activeTab === 'deposit' ? 'active' : ''} onClick={()=>setActiveTab('deposit')}><Smartphone /> <span>طرق الدفع</span></button>
        <button className={activeTab === 'promo' ? 'active' : ''} onClick={()=>setActiveTab('promo')}><Key /> <span>شحن كود</span></button>
        <button onClick={() => reportProblem("مشكلة عامة")}><MessageSquare /> <span>الدعم</span></button>
      </nav>

      <div className="wallet-content-area">
        <AnimatePresence mode="wait">
          
          {/* واجهة النظرة العامة */}
          {activeTab === 'overview' && (
            <motion.div key="ov" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="tab-container">
              
              {/* بطاقة المهام السريعة */}
              <div className="rewards-banner glass">
                <div className="reward-info">
                   <h3><Trophy size={18} color="#ffd700"/> هدايا الـ XP</h3>
                   <p>لديك {userData.xp} نقطة، استبدلهم الآن بأرصدة حقيقية!</p>
                </div>
                <button onClick={()=>setActiveTab('convert')}>استبدال <ChevronLeft size={14}/></button>
              </div>

              <div className="history-section">
                <div className="sec-title">
                  <h3>سجل العمليات</h3>
                  <button className="text-btn">عرض الكل</button>
                </div>
                {transactions.map(t => (
                  <div key={t.id} className="transaction-item glass">
                    <div className={`t-icon-box ${t.type}`}>
                       {t.type === 'deposit' ? <Smartphone size={18}/> : <ArrowRightLeft size={18}/>}
                    </div>
                    <div className="t-main-info">
                       <h4>{t.description || (t.type === 'convert' ? 'تحويل نقاط' : 'شحن رصيد')}</h4>
                       <small>{t.timestamp?.toDate().toLocaleString('ar-EG')}</small>
                    </div>
                    <div className="t-right">
                       <div className={`t-price ${t.amount > 0 ? 'plus' : 'minus'}`}>
                         {t.amount > 0 ? '+' : ''}{t.amount} ج.م
                       </div>
                       <button onClick={() => reportProblem("مشكلة في عملية دفع", `رقم العملية: ${t.id}`)} className="issue-btn"><AlertCircle size={12}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* واجهة شحن الرصيد المتطورة */}
          {activeTab === 'deposit' && (
            <motion.div key="dp" initial={{x:50, opacity:0}} animate={{x:0, opacity:1}} className="tab-container">
              <div className="payment-methods-grid-v8">
                 <div className="method-card-v8 glass">
                    <div className="m-icon"><Smartphone color="#ff4d4d"/></div>
                    <h4>فودافون كاش</h4>
                    <p>01012345678</p>
                    <button onClick={() => navigator.clipboard.writeText("01012345678")}>نسخ الرقم</button>
                 </div>
                 <div className="method-card-v8 glass">
                    <div className="m-icon"><Banknote color="#43e97b"/></div>
                    <h4>إنستا باي</h4>
                    <p>student@instapay</p>
                    <button onClick={() => navigator.clipboard.writeText("student@instapay")}>نسخ المعرف</button>
                 </div>
              </div>

              <div className="active-plans">
                <h3>باقات الشحن المتوفرة</h3>
                {plans.map(plan => (
                  <div key={plan.id} className="plan-item-v8 glass">
                    <div className="plan-info">
                       <h4>{plan.title}</h4>
                       <span className="price-tag">{plan.price} ج.م</span>
                    </div>
                    <div className="plan-actions">
                       <label className="upload-label">
                         <input type="file" hidden onChange={(e)=>setReceipt(e.target.files[0])} />
                         {receipt ? <CheckCircle2 size={18} color="#43e97b"/> : <ImageIcon size={18}/>}
                       </label>
                       <button className="pay-now-btn" onClick={() => {/* دالة الرفع */}}>شحن الآن</button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* واجهة الأكواد المسبقة الدفع */}
          {activeTab === 'promo' && (
            <motion.div key="pr" initial={{scale:0.9}} animate={{scale:1}} className="tab-container center-content">
               <div className="scratch-card-area glass">
                  <div className="card-header">
                     <Key size={30} color="#ffd700" />
                     <h2>كروت الشحن الفوري</h2>
                  </div>
                  <div className="input-group-v8">
                     <input 
                       type="text" 
                       placeholder="أدخل الكود هنا..." 
                       value={promoCode}
                       onChange={(e)=>setPromoCode(e.target.value.toUpperCase())}
                     />
                     <button disabled={isProcessing} onClick={handleRedeem}>
                       {isProcessing ? "جاري الشحن..." : "تفعيل الكود"}
                     </button>
                  </div>
                  <p className="footer-note">أكواد الشحن تُباع لدى السناتر المعتمدة</p>
               </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* زر الطوارئ العائم */}
      <motion.button 
        whileHover={{scale:1.1}} 
        whileTap={{scale:0.9}} 
        className="sos-button"
        onClick={() => reportProblem("مساعدة فورية")}
      >
        <MessageSquare color="white" />
      </motion.button>

    </div>
  );
};

export default Wallet;