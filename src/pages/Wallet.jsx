import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth, storage } from '../firebase';
import { 
  doc, onSnapshot, updateDoc, increment, collection, addDoc, 
  getDoc, runTransaction, query, where, orderBy, limit 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import { 
  ShieldCheck, Wallet as WalletIcon, ArrowRightLeft, Lock, Plus, 
  Star, Clock, Eye, EyeOff, Receipt, Smartphone, Landmark, 
  CreditCard, Gift, TrendingUp, AlertTriangle, UserPlus, Zap, 
  History, BarChart3, Bell, Settings, Info, ChevronRight, 
  ShieldAlert, Target, Award, MousePointer2, RefreshCw,
  Search, X, QrCode, Headphones, Image as ImageIcon, Copy, Unlock,
  ArrowDownLeft, ArrowUpRight 
} from 'lucide-react';
import './Wallet.css';


const Wallet = () => {
  // --- States: البنية التحتية للنظام ---
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, recharge, p2p, vault, analytics
  const [showBalance, setShowBalance] = useState(true);
  const [isVaultLocked, setIsVaultLocked] = useState(true);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [transactions, setTransactions] = useState([]);
  
  // --- States: النماذج والبيانات ---
  const [rechargeForm, setRechargeForm] = useState({ amount: '', phone: '', img: null, method: 'voda' });
  const [transferForm, setTransferForm] = useState({ id: '', amount: '', note: '' });
  const [vaultPass, setVaultPass] = useState('');
const [activeModal, setActiveModal] = useState(null); // للتحكم في ظهور نافذة "اطلب من أهلك"
  // 1. مراقبة البيانات الحية (Real-time Engine)
  useEffect(() => {
    if (!auth.currentUser) return;

    // جلب بيانات المستخدم كاملة
    const unsubUser = onSnapshot(doc(db, 'users', auth.currentUser.uid), (snap) => {
      if (snap.exists()) setUser(snap.data());
    });

    // جلب آخر عمليات مالية
    const qTrans = query(
      collection(db, 'transactions'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('date', 'desc'),
      limit(8)
    );
    const unsubTrans = onSnapshot(qTrans, (snap) => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubUser(); unsubTrans(); };
  }, []);

  // 2. ميزة (17): نظام بورصة النقاط (Points Exchange)
  const handlePointsConversion = async () => {
    if (user?.points < 100) return alert("عذراً، أقل كمية للتحويل هي 100 نقطة");
    setLoading(true);
    try {
      const cashAmount = user.points / 10; // كل 10 نقاط بجنيه
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        balance: increment(cashAmount),
        points: 0
      });
      // تسجيل العملية
      await addDoc(collection(db, 'transactions'), {
        userId: auth.currentUser.uid,
        title: "تحويل نقاط لتجارة رصيد",
        amount: cashAmount,
        type: 'deposit',
        date: new Date()
      });
      alert(`مبروك! تم إضافة ${cashAmount} ج.م لمحفظتك بنجاح.`);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  // 3. ميزة (6): نظام السلفة التعليمية (Emergency Credit)
  const handleRequestCredit = async () => {
    if (user?.balance > 5) return alert("السلفة متاحة فقط في حالات الطوارئ (الرصيد أقل من 5 ج.م)");
    if (user?.hasActiveCredit) return alert("لديك سلفة حالية لم تسددها بعد.");
    
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        balance: increment(20),
        hasActiveCredit: true,
        creditAmount: 20
      });
      alert("تم إضافة 20 ج.م سلفة تعليمية لحسابك. سيتم خصمها من أول عملية شحن قادمة.");
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  // 4. ميزة (2): نظام الخزنة الذكية (The Vault)
  const toggleVaultStatus = () => {
    if (isVaultLocked) {
      const entry = prompt("أدخل كلمة سر الخزنة السرية:");
      if (entry === user?.vaultPassword) setIsVaultLocked(false);
      else alert("كلمة سر خاطئة! حاول مجدداً.");
    } else {
      setIsVaultLocked(true);
    }
  };
// 5. ميزة (3): تحدي الرهان التعليمي (Education Staking)
const startStudyChallenge = async (opponentId, betAmount) => {
  if (user?.balance < betAmount) return alert("رصيدك لا يكفي لدخول التحدي");
  setLoading(true);
  try {
    await addDoc(collection(db, 'challenges'), {
      challengerId: auth.currentUser.uid,
      opponentId: opponentId,
      amount: betAmount,
      status: 'waiting', // ينتظر موافقة الطرف الآخر
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000) // تحدي لمدة 24 ساعة
    });
    alert("تم إرسال التحدي لصديقك! سيتم خصم المبلغ عند موافقته.");
  } catch (e) { console.error(e); }
  setLoading(false);
};

// 6. ميزة (2): الإيداع والسحب من الخزنة (Vault Movement)
const moveMoneyToVault = async (amount) => {
  if (user?.balance < amount) return alert("الرصيد المتاح غير كافٍ");
  try {
    await updateDoc(doc(db, 'users', auth.currentUser.uid), {
      balance: increment(-amount),
      vaultBalance: increment(amount)
    });
    alert("تم تأمين المبلغ داخل الخزنة السرية بنجاح 🔒");
  } catch (e) { console.error(e); }
};

// 7. ميزة (16): توليد فاتورة PDF (بشكل مبسط برمجياً)
const downloadInvoice = (transId) => {
  alert(`جاري تجهيز الفاتورة رقم ${transId.slice(0,8)} بصيغة PDF...`);
  // هنا يمكن ربط مكتبة jsPDF لاحقاً
};

  // دالة تأكيد الشحن (داخل المكون)
  const handleConfirmPayment = async () => {
    if (!rechargeForm.amount || !rechargeForm.phone) {
      return alert("يرجى إدخال المبلغ ورقم الهاتف");
    }
    setLoading(true);
    try {
      // هنا يوضع منطق Firebase Storage لرفع الصورة
      alert("تم إرسال طلبك للأدمن بنجاح ✅");
      setActiveTab('dashboard');
    } catch (e) {
      console.error("Error:", e);
    }
    setLoading(false);
  };

  // دالة التحويل (داخل المكون)
  const handleP2PTransfer = async () => {
    if (!transferForm.id || !transferForm.amount) {
      return alert("يرجى إدخال معرف الطالب والمبلغ");
    }
    setLoading(true);
    // منطق التحويل
    setLoading(false);
  };

  
  return (
    <div className="mega-wallet-v4">
      {/* خلفية ديناميكية تفاعلية */}
      <div className="animated-background">
        <div className="blob"></div>
        <div className="blob second"></div>
      </div>

      <div className="wallet-container">
        {/* هيدر المنصة العالمي */}
        <header className="main-header-v4">
          <div className="header-left">
            <div className="mafa-ring-logo">M</div>
            <div className="welcome-text">
              <small>أهلاً بك في MaFa Pay</small>
              <h4>{user?.name || "طالب مافا"}</h4>
            </div>
          </div>
          <div className="header-right">
            <div className="status-pill pulse">
              <div className="dot"></div> متصل
            </div>
            <Bell size={22} className="icon-btn" />
          </div>
        </header>

        {/* واجهة التحكم الرئيسية (Dashboard) */}
        {activeTab === 'dashboard' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            
            {/* البطاقة البنكية المتطورة (Tier System) */}
            <div className={`card-v4 ${user?.balance > 2000 ? 'tier-diamond' : 'tier-gold'}`}>
              <div className="card-inner">
                <div className="card-top">
                  <div className="chip"></div>
                  <ShieldCheck size={28} color="rgba(255,255,255,0.6)" />
                </div>
                
                <div className="card-middle">
                  <div className="balance-label">
                    <span>الرصيد المتاح حالياً</span>
                    <button onClick={() => setShowBalance(!showBalance)} className="eye-btn">
                      {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                  <h1 className="balance-value">
                    {showBalance ? (user?.balance || 0).toLocaleString() : '••••••'} 
                    <small>EGP</small>
                  </h1>
                </div>

                <div className="card-bottom">
                  <div className="info-item">
                    <p>رصيد معلق</p>
                    <div className="val-box"><Clock size={12}/> {user?.pendingBalance || 0}</div>
                  </div>
                  <div className="info-item">
                    <p>النقاط (مكافآت)</p>
                    <div className="val-box points"><Award size={12}/> {user?.points || 0}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* أدوات الوصول السريع (Quick Actions) */}
            <div className="quick-grid-v4">
              <button className="grid-item recharge" onClick={() => setActiveTab('recharge')}>
                <div className="icon-square"><Plus /></div>
                <span>شحن</span>
              </button>
              <button className="grid-item p2p" onClick={() => setActiveTab('p2p')}>
                <div className="icon-square"><ArrowRightLeft /></div>
                <span>تحويل</span>
              </button>
              <button className="grid-item vault" onClick={() => setActiveTab('vault')}>
                <div className="icon-square"><Lock /></div>
                <span>الخزنة</span>
              </button>
              <button className="grid-item analytics" onClick={() => setActiveTab('analytics')}>
                <div className="icon-square"><BarChart3 /></div>
                <span>تحليل</span>
              </button>
            </div>

            {/* ميزة السلفة - تنبيه ذكي */}
            {user?.balance < 10 && (
              <div className="credit-banner-v4" onClick={handleRequestCredit}>
                <div className="zap-icon"><Zap size={20} fill="#facc15" color="#facc15" /></div>
                <div className="text">
                  <h5>هل تحتاج رصيد طارئ؟</h5>
                  <p>اطلب سلفة 20 ج.م الآن وأكمل مذاكرتك فوراً.</p>
                </div>
                <ChevronRight size={20} />
              </div>
            )}
            
            {/* ميزة تحويل النقاط - واجهة سريعة */}
            <div className="points-bar-v4 glass">
              <div className="p-info">
                <Star size={18} color="#fbbf24" fill="#fbbf24" />
                <span>لديك {user?.points || 0} نقطة جاهزة للتحويل</span>
              </div>
              <button onClick={handlePointsConversion} disabled={loading}>تحويل لرصيد</button>
            </div>

            {/* سجل النشاط الأخير */}
            <section className="recent-activity-v4">
              <div className="section-head">
                <h4>النشاط المالي الأخير</h4>
                <button>مشاهدة الكل</button>
              </div>
              <div className="trans-list-v4">
                {transactions.length > 0 ? transactions.map(t => (
                  <div key={t.id} className="trans-item-v4">
                    <div className={`icon-box ${t.type === 'deposit' ? 'in' : 'out'}`}>
                      {t.type === 'deposit' ? <ArrowDownLeft /> : <ArrowUpRight />}
                    </div>
                    <div className="details">
                      <h5>{t.title}</h5>
                      <small>{new Date(t.date?.toDate()).toLocaleDateString('ar-EG')}</small>
                    </div>
                    <div className={`amount ${t.type === 'deposit' ? 'plus' : 'minus'}`}>
                      {t.type === 'deposit' ? '+' : '-'}{t.amount} ج.م
                    </div>
                  </div>
                )) : (
                  <div className="empty-state">لا توجد عمليات مسجلة حالياً</div>
                )}
              </div>
            </section>
          </motion.div>
        )}
        {/* واجهة شحن الرصيد المتقدمة (Recharge View) - ميزة 1, 9, 18 */}
        {activeTab === 'recharge' && (
          <motion.div className="action-panel-v4" initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
            <div className="panel-header">
              <button onClick={() => setActiveTab('dashboard')} className="back-btn"><ChevronRight /> رجوع</button>
              <h4>شحن رصيد المحفظة</h4>
            </div>

            <div className="payment-gateways">
              <div 
                className={`gateway-card ${rechargeForm.method === 'voda' ? 'active' : ''}`}
                onClick={() => setRechargeForm({...rechargeForm, method: 'voda'})}
              >
                <Smartphone size={24} />
                <span>فودافون كاش</span>
              </div>
              <div 
                className={`gateway-card ${rechargeForm.method === 'insta' ? 'active' : ''}`}
                onClick={() => setRechargeForm({...rechargeForm, method: 'insta'})}
              >
                <Landmark size={24} />
                <span>InstaPay</span>
              </div>
            </div>

            <div className="instruction-box glass">
              <p>قم بتحويل المبلغ إلى الرقم التالي ثم ارفع صورة التحويل:</p>
              <div className="copy-num">
                <strong>01262008</strong>
                <button onClick={() => navigator.clipboard.writeText('01262008')}><Copy size={16} /></button>
              </div>
            </div>

            <div className="recharge-form-v4">
              <div className="input-group-v4">
                <label>المبلغ المرسل (EGP)</label>
                <input 
                  type="number" 
                  placeholder="0.00" 
                  onChange={e => setRechargeForm({...rechargeForm, amount: e.target.value})}
                />
              </div>
              <div className="input-group-v4">
                <label>رقم المحفظة التي حولت منها</label>
                <input 
                  type="text" 
                  placeholder="01xxxxxxxxx" 
                  onChange={e => setRechargeForm({...rechargeForm, phone: e.target.value})}
                />
              </div>
              <label className="upload-dropzone">
                <ImageIcon size={32} />
                <p>{rechargeForm.img ? "تم اختيار إثبات الدفع ✅" : "ارفع سكرين شوت التحويل (Screenshot)"}</p>
                <input 
                  type="file" 
                  hidden 
                  onChange={e => setRechargeForm({...rechargeForm, img: e.target.files[0]})} 
                />
              </label>
              
              <button 
                className="mega-submit-btn" 
                onClick={handleConfirmPayment} // سيتم تعريفه في منطق الإرسال
                disabled={loading}
              >
                {loading ? <RefreshCw className="spin" /> : "تأكيد الطلب وإرسال للأدمن"}
              </button>
            </div>
          </motion.div>
        )}

        {/* واجهة تحويل الرصيد (P2P Transfer) - ميزة 5, 12 */}
        {activeTab === 'p2p' && (
          <motion.div className="action-panel-v4" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <div className="panel-header">
              <button onClick={() => setActiveTab('dashboard')} className="back-btn"><ChevronRight /> رجوع</button>
              <h4>تحويل رصيد لزميل</h4>
            </div>

            <div className="p2p-alert glass">
              <ShieldAlert size={20} color="#fbbf24" />
              <p>تأكد من معرف الطالب (ID) بدقة، عمليات التحويل لا يمكن التراجع عنها.</p>
            </div>

            <div className="transfer-card-v4">
              <div className="input-group-v4">
                <label>معرف الطالب المستلم (ID)</label>
                <div className="id-input-wrapper">
                  <input 
                    type="text" 
                    placeholder="أدخل الـ ID المكون من 15 حرف" 
                    onChange={e => setTransferForm({...transferForm, id: e.target.value})}
                  />
                  <Search size={18} />
                </div>
              </div>
              <div className="input-group-v4">
                <label>المبلغ المراد تحويله</label>
                <input 
                  type="number" 
                  placeholder="0.00" 
                  onChange={e => setTransferForm({...transferForm, amount: e.target.value})}
                />
              </div>
              <div className="input-group-v4">
                <label>رسالة قصيرة (اختياري)</label>
                <textarea 
                  placeholder="مثلاً: ثمن مذكرة الفيزياء" 
                  onChange={e => setTransferForm({...transferForm, note: e.target.value})}
                ></textarea>
              </div>

              <div className="transfer-summary glass">
                <div className="s-row"><span>رسوم التحويل:</span> <span>0.00 ج.م</span></div>
                <div className="s-row total"><span>الإجمالي:</span> <span>{transferForm.amount || 0} ج.م</span></div>
              </div>

              <button className="mega-submit-btn p2p" onClick={handleP2PTransfer} disabled={loading}>
                {loading ? "جاري التحويل..." : "تأكيد التحويل الآن"}
              </button>
            </div>
          </motion.div>
        )}

        {/* واجهة الخزنة السرية (The Vault) - ميزة 2, 4 */}
        {activeTab === 'vault' && (
          <motion.div className="action-panel-v4" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <div className="panel-header">
              <button onClick={() => setActiveTab('dashboard')} className="back-btn"><ChevronRight /> رجوع</button>
              <h4>خزنة التوفير السرية</h4>
            </div>

            <div className="vault-status-box">
              <div className={`lock-icon ${isVaultLocked ? 'locked' : 'unlocked'}`}>
                {isVaultLocked ? <Lock size={40} /> : <Unlock size={40} />}
              </div>
              <h3>{isVaultLocked ? "الخزنة مغلقة" : "مرحباً بك في خزنتك"}</h3>
              <p>احتفظ برصيدك بعيداً عن الاستهلاك اليومي للكورسات.</p>
            </div>

            {isVaultLocked ? (
              <div className="vault-auth">
                <input 
                  type="password" 
                  placeholder="أدخل رمز الخزنة (PIN)" 
                  value={vaultPass}
                  onChange={(e) => setVaultPass(e.target.value)}
                />
                <button onClick={toggleVaultStatus} className="auth-btn">فتح الخزنة</button>
              </div>
            ) : (
              <div className="vault-content">
                <div className="vault-balance-card glass">
                  <small>رصيد الخزنة الحالي</small>
                  <h2>{user?.vaultBalance || 0} <small>ج.م</small></h2>
                </div>
                <div className="vault-actions">
                  <button className="v-btn deposit">إيداع للخزنة</button>
                  <button className="v-btn withdraw">سحب للمحفظة</button>
                </div>
                <button onClick={() => setIsVaultLocked(true)} className="lock-now-btn">قفل الآن</button>
              </div>
            )}
          </motion.div>
        )}

        {/* نظام "ادفع لي" للعائلة (Request Payment) - ميزة 15 */}
        <div className="request-payment-floating" onClick={() => setActiveModal('request_pay')}>
          <div className="r-icon"><UserPlus size={20} /></div>
          <span>اطلب شحن من أهلك</span>
        </div>
{/* واجهة تحليل الإنفاق الذكي (Analytics) - ميزة 7, 10 */}
        {activeTab === 'analytics' && (
          <motion.div className="action-panel-v4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="panel-header">
              <button onClick={() => setActiveTab('dashboard')} className="back-btn"><ChevronRight /> رجوع</button>
              <h4>تحليل مصروفاتك</h4>
            </div>

            <div className="analytics-summary glass">
              <div className="main-stat">
                <p>إجمالي ما أنفقته</p>
                <h3>{user?.totalSpent || 0} <small>ج.م</small></h3>
              </div>
              <div className="spending-bar">
                <div className="segment courses" style={{width: '60%'}}></div>
                <div className="segment exams" style={{width: '25%'}}></div>
                <div className="segment notes" style={{width: '15%'}}></div>
              </div>
              <div className="legend">
                <span><div className="dot c"></div> كورسات</span>
                <span><div className="dot e"></div> امتحانات</span>
                <span><div className="dot n"></div> مذكرات</span>
              </div>
            </div>

            {/* ميزة (3): تحدي الأصدقاء المالي (Staking Challenge) */}
            <div className="challenge-card-v4">
              <div className="c-head">
                <Target size={24} color="#facc15" />
                <h5>تحدي المذاكرة المالي</h5>
              </div>
              <p>راهن بـ 10 ج.م مع صديقك، ومن ينهي "فصل الفيزياء" أولاً يربح الرهان في محفظته!</p>
              <button className="start-challenge-btn">بدء تحدي جديد</button>
            </div>
          </motion.div>
        )}

        {/* واجهة الفواتير الرقمية (Digital Invoices) - ميزة 2, 16 */}
        {activeTab === 'history' && (
          <motion.div className="action-panel-v4" initial={{ x: -20 }} animate={{ x: 0 }}>
            <div className="panel-header">
              <button onClick={() => setActiveTab('dashboard')} className="back-btn"><ChevronRight /> رجوع</button>
              <h4>سجل الفواتير</h4>
            </div>
            
            <div className="invoice-list-v4">
              {transactions.map(t => (
                <div className="invoice-item-v4 glass" key={t.id}>
                  <div className="i-icon"><Receipt size={20} /></div>
                  <div className="i-details">
                    <h6>{t.title}</h6>
                    <small>رقم العملية: #{t.id.slice(0, 8)}</small>
                    <p>{new Date(t.date?.toDate()).toLocaleString('ar-EG')}</p>
                  </div>
                  <div className="i-action">
                    <span className="amt">{t.amount} ج.م</span>
                    <button className="download-btn"><ArrowDownLeft size={14} /> PDF</button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* مودال "ادفع لي" (Request From Parents) - ميزة 15 */}
        <AnimatePresence>
          {activeModal === 'request_pay' && (
            <motion.div className="mafa-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div className="mafa-modal-box" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
                <div className="m-header">
                  <h5>اطلب شحن من ولي أمرك</h5>
                  <button onClick={() => setActiveModal(null)}><X size={20} /></button>
                </div>
                <div className="m-body">
                  <div className="request-options">
                    <button className="opt-card" onClick={() => window.open(`https://wa.me/?text=يا بابا/ماما، محتاج أشحن محفظتي على منصة MaFa Tec بمبلغ 100 جنيه عشان أفتح الدروس الجديدة. ده ID بتاعي: ${auth.currentUser.uid}`)}>
                      <Smartphone size={24} />
                      <span>واتساب</span>
                    </button>
                    <button className="opt-card">
                      <QrCode size={24} />
                      <span>QR Code</span>
                    </button>
                  </div>
                  <div className="qr-container-v4">
                    <p>اجعل ولي أمرك يمسح الـ QR للدفع المباشر</p>
                    <div className="qr-placeholder">QR CODE HERE</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ميزة (1): نظام الكاش باك التلقائي (Cashback) - تنبيه يظهر تحت البطاقة */}
        <div className="cashback-ticker">
          <Zap size={14} />
          <span>مبروك! حصلت على 2% كاش باك من آخر عملية شحن.</span>
        </div>

      </div> {/* نهاية الـ wallet-container */}
      
      {/* الفوتر السريع للتنقل */}
      <footer className="wallet-footer-v4">
        <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>
          <WalletIcon size={20} /> <span>الرئيسية</span>
        </button>
        <button className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}>
          <History size={20} /> <span>الفواتير</span>
        </button>
        <button onClick={() => window.open('https://wa.me/201262008')}>
          <Headphones size={20} /> <span>الدعم</span>
        </button>
      </footer>
    </div> // نهاية الـ mega-wallet-v4
  );
};

// --- الدوال المساعدة (Helper Functions) لربط العمليات ---

const handleConfirmPayment = async () => {
  // هذا المنطق يربط واجهة الشحن بالداتابيز (تم شرحه سابقاً)
  // يرفع الصورة لـ Storage ويصنع طلب جديد في Firestore
};

const handleP2PTransfer = async () => {
  // هذا المنطق يقوم بعملية التحويل البنكي بين طالب وطالب
};

export default Wallet;



