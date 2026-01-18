import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// 1. تصحيح المسار للعودة لمجلد src الرئيسي
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
  // --- States ---
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showBalance, setShowBalance] = useState(true);
  const [isVaultLocked, setIsVaultLocked] = useState(true);
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [rechargeForm, setRechargeForm] = useState({ amount: '', phone: '', img: null, method: 'voda' });
  const [transferForm, setTransferForm] = useState({ id: '', amount: '', note: '' });
  const [vaultPass, setVaultPass] = useState('');
  const [activeModal, setActiveModal] = useState(null);

  // --- 1. مراقبة البيانات الحية مع حماية ضد الـ Null ---
  useEffect(() => {
    // مراقبة حالة تسجيل الدخول أولاً
    const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        // جلب بيانات المستخدم
        const unsubUser = onSnapshot(doc(db, 'users', currentUser.uid), (snap) => {
          if (snap.exists()) setUser(snap.data());
        });

        // جلب العمليات المالية
        const qTrans = query(
          collection(db, 'transactions'),
          where('userId', '==', currentUser.uid),
          orderBy('date', 'desc'),
          limit(8)
        );
        const unsubTrans = onSnapshot(qTrans, (snap) => {
          setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        return () => { unsubUser(); unsubTrans(); };
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // --- 2. نظام بورصة النقاط ---
  const handlePointsConversion = async () => {
    if (!user?.points || user.points < 100) return alert("عذراً، أقل كمية للتحويل هي 100 نقطة");
    setLoading(true);
    try {
      const cashAmount = user.points / 10;
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        balance: increment(cashAmount),
        points: 0
      });
      await addDoc(collection(db, 'transactions'), {
        userId: auth.currentUser.uid,
        title: "تحويل نقاط لرصيد",
        amount: cashAmount,
        type: 'deposit',
        date: new Date()
      });
      alert(`مبروك! تم إضافة ${cashAmount} ج.م لمحفظتك.`);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  // --- 3. نظام السلفة التعليمية ---
  const handleRequestCredit = async () => {
    if (user?.balance > 5) return alert("السلفة متاحة فقط إذا كان رصيدك أقل من 5 ج.م");
    if (user?.hasActiveCredit) return alert("لديك سلفة حالية لم تسددها بعد.");
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        balance: increment(20),
        hasActiveCredit: true,
        creditAmount: 20
      });
      alert("تم إضافة 20 ج.م سلفة طوارئ.");
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  // --- 4. نظام الخزنة الذكية ---
  const toggleVaultStatus = () => {
    if (isVaultLocked) {
      const entry = prompt("أدخل كلمة سر الخزنة:");
      if (entry === user?.vaultPassword) setIsVaultLocked(false);
      else alert("كلمة سر خاطئة!");
    } else {
      setIsVaultLocked(true);
    }
  };

  // --- 5. تأكيد الشحن (ربط فعلي بـ Firebase Storage) ---
  const handleConfirmPayment = async () => {
    if (!rechargeForm.amount || !rechargeForm.img) {
      return alert("يرجى إدخال المبلغ ورفع صورة التحويل");
    }
    setLoading(true);
    try {
      // رفع الصورة
      const storageRef = ref(storage, `receipts/${auth.currentUser.uid}_${Date.now()}`);
      await uploadBytes(storageRef, rechargeForm.img);
      const photoURL = await getDownloadURL(storageRef);

      // تسجيل الطلب للأدمن
      await addDoc(collection(db, 'rechargeRequests'), {
        userId: auth.currentUser.uid,
        userName: user?.name,
        amount: Number(rechargeForm.amount),
        phone: rechargeForm.phone,
        screenshot: photoURL,
        status: 'pending',
        date: new Date()
      });

      alert("تم إرسال طلب الشحن للمراجعة ✅");
      setActiveTab('dashboard');
    } catch (e) { alert("فشل الإرسال: " + e.message); }
    setLoading(false);
  };
// --- 6. نظام التحويل P2P (المصحح) ---
const handleP2PTransfer = async () => {
  const amount = Number(transferForm.amount);
  if (!transferForm.id || amount <= 0) return alert("بيانات التحويل غير مكتملة");
  if (user?.balance < amount) return alert("رصيدك غير كافٍ");
  if (transferForm.id === auth.currentUser.uid) return alert("لا يمكنك التحويل لنفسك!");

  setLoading(true);
  try {
    const recipientRef = doc(db, 'users', transferForm.id);
    const recipientSnap = await getDoc(recipientRef);

    if (!recipientSnap.exists()) {
      throw new Error("معرف الطالب غير موجود");
    }

    await runTransaction(db, async (transaction) => {
      const senderRef = doc(db, 'users', auth.currentUser.uid);
      
      // إنشاء مرجع لوثيقة العملية الجديدة (بدل addDoc)
      const transRef = doc(collection(db, 'transactions'));

      transaction.update(senderRef, {
        balance: increment(-amount)
      });
      
      transaction.update(recipientRef, {
        balance: increment(amount)
      });

      // استخدام set داخل الـ transaction
      transaction.set(transRef, {
        userId: auth.currentUser.uid,
        recipientId: transferForm.id,
        title: `تحويل إلى ${recipientSnap.data().name}`,
        amount: amount,
        type: 'withdraw',
        date: new Date()
      });
    });

    alert("تم التحويل بنجاح 💸");
    setActiveTab('dashboard');
    setTransferForm({ id: '', amount: '', note: '' }); // تصفير الفورم
  } catch (e) { 
    alert("حدث خطأ: " + e.message); 
  }
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
              <button onClick={handlePointsConversion} disabled={loading}>
                {loading ? <RefreshCw className="spin" size={14}/> : "تحويل لرصيد"}
              </button>
            </div>

            {/* سجل النشاط الأخير */}
            <section className="recent-activity-v4">
              <div className="section-head">
                <h4>النشاط المالي الأخير</h4>
                <button onClick={() => setActiveTab('history')}>مشاهدة الكل</button>
              </div>
              <div className="trans-list-v4">
                {transactions.length > 0 ? transactions.map(t => (
                  <div key={t.id} className="trans-item-v4">
                    <div className={`icon-box ${t.type === 'deposit' ? 'in' : 'out'}`}>
                      {t.type === 'deposit' ? <ArrowDownLeft /> : <ArrowUpRight />}
                    </div>
                    <div className="details">
                      <h5>{t.title}</h5>
                      <small>{t.date?.toDate ? new Date(t.date.toDate()).toLocaleDateString('ar-EG') : 'قيد المعالجة'}</small>
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

        {/* واجهة شحن الرصيد المتقدمة */}
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
                <button onClick={() => {
                  navigator.clipboard.writeText('01262008');
                  alert("تم نسخ الرقم بنجاح");
                }}><Copy size={16} /></button>
              </div>
            </div>

            <div className="recharge-form-v4">
              <div className="input-group-v4">
                <label>المبلغ المرسل (EGP)</label>
                <input 
                  type="number" 
                  placeholder="0.00" 
                  value={rechargeForm.amount}
                  onChange={e => setRechargeForm({...rechargeForm, amount: e.target.value})}
                />
              </div>
              <div className="input-group-v4">
                <label>رقم المحفظة التي حولت منها</label>
                <input 
                  type="text" 
                  placeholder="01xxxxxxxxx" 
                  value={rechargeForm.phone}
                  onChange={e => setRechargeForm({...rechargeForm, phone: e.target.value})}
                />
              </div>
              <label className="upload-dropzone">
                <ImageIcon size={32} />
                <p>{rechargeForm.img ? `تم اختيار: ${rechargeForm.img.name}` : "ارفع سكرين شوت التحويل (Screenshot)"}</p>
                <input 
                  type="file" 
                  hidden 
                  accept="image/*"
                  onChange={e => setRechargeForm({...rechargeForm, img: e.target.files[0]})} 
                />
              </label>
              
              <button 
                className="mega-submit-btn" 
                onClick={handleConfirmPayment}
                disabled={loading}
              >
                {loading ? <RefreshCw className="spin" size={20} /> : "تأكيد الطلب وإرسال للأدمن"}
              </button>
            </div>
          </motion.div>
        )}

        {/* واجهة تحويل الرصيد (P2P Transfer) */}
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
                    value={transferForm.id}
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
                  value={transferForm.amount}
                  onChange={e => setTransferForm({...transferForm, amount: e.target.value})}
                />
              </div>
              <div className="input-group-v4">
                <label>رسالة قصيرة (اختياري)</label>
                <textarea 
                  placeholder="مثلاً: ثمن مذكرة الفيزياء" 
                  value={transferForm.note}
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

        {/* واجهة الخزنة السرية (The Vault) */}
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
                  <button className="v-btn deposit" onClick={() => alert("سيتم إضافة نظام الإيداع للخزنة قريباً")}>إيداع للخزنة</button>
                  <button className="v-btn withdraw" onClick={() => alert("سيتم إضافة نظام السحب من الخزنة قريباً")}>سحب للمحفظة</button>
                </div>
                <button onClick={() => setIsVaultLocked(true)} className="lock-now-btn">قفل الآن</button>
              </div>
            )}
          </motion.div>
        )}

        {/* نظام "ادفع لي" للعائلة */}
        <div className="request-payment-floating" onClick={() => setActiveModal('request_pay')}>
          <div className="r-icon"><UserPlus size={20} /></div>
          <span>اطلب شحن من أهلك</span>
        </div>

        {/* واجهة تحليل الإنفاق */}
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

            <div className="challenge-card-v4">
              <div className="c-head">
                <Target size={24} color="#facc15" />
                <h5>تحدي المذاكرة المالي</h5>
              </div>
              <p>راهن بـ 10 ج.م مع صديقك، ومن ينهي "فصل الفيزياء" أولاً يربح الرهان!</p>
              <button className="start-challenge-btn">بدء تحدي جديد</button>
            </div>
          </motion.div>
        )}

        {/* سجل الفواتير */}
        {activeTab === 'history' && (
          <motion.div className="action-panel-v4" initial={{ x: -20 }} animate={{ x: 0 }}>
            <div className="panel-header">
              <button onClick={() => setActiveTab('dashboard')} className="back-btn"><ChevronRight /> رجوع</button>
              <h4>سجل الفواتير</h4>
            </div>
            
            <div className="invoice-list-v4">
              {transactions.length > 0 ? transactions.map(t => (
                <div className="invoice-item-v4 glass" key={t.id}>
                  <div className="i-icon"><Receipt size={20} /></div>
                  <div className="i-details">
                    <h6>{t.title}</h6>
                    <small>رقم العملية: #{t.id.slice(0, 8)}</small>
                    <p>{t.date?.toDate ? new Date(t.date.toDate()).toLocaleString('ar-EG') : 'جاري التحميل'}</p>
                  </div>
                  <div className="i-action">
                    <span className="amt">{t.amount} ج.م</span>
                    <button className="download-btn"><ArrowDownLeft size={14} /> PDF</button>
                  </div>
                </div>
              )) : <div className="empty-state">لا توجد فواتير بعد.</div>}
            </div>
          </motion.div>
        )}

        {/* مودال "ادفع لي" */}
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
                    <button className="opt-card" onClick={() => window.open(`https://wa.me/?text=يا بابا، محتاج أشحن محفظتي بمبلغ 100ج لتفعيل الكورسات. كود الطالب الخاص بي هو: ${auth.currentUser?.uid}`)}>
                      <Smartphone size={24} />
                      <span>واتساب</span>
                    </button>
                    <button className="opt-card" onClick={() => alert("سيتم تفعيل الـ QR قريباً")}>
                      <QrCode size={24} />
                      <span>QR Code</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="cashback-ticker">
          <Zap size={14} />
          <span>مبروك! حصلت على 2% كاش باك من آخر عملية شحن.</span>
        </div>

      </div>
      
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
    </div>
  );
};

export default Wallet;




