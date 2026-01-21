import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth, storage } from '../firebase'; 
import { 
  doc, onSnapshot, updateDoc, increment, collection, addDoc, 
  getDoc, runTransaction, query, where, orderBy, limit, serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  ShieldCheck, Wallet as WalletIcon, ArrowRightLeft, Lock, Plus, 
  Star, Clock, Eye, EyeOff, Receipt, Smartphone, Landmark, 
  Award, Zap, History, BarChart3, Bell, ChevronRight, 
  ShieldAlert, Target, RefreshCw, Search, X, QrCode, Headphones, 
  Image as ImageIcon, Copy, Unlock, ArrowDownLeft, ArrowUpRight,
  Filter, Download, Share2, Info, CheckCircle2, AlertCircle , Settings
} from 'lucide-react';
import './Wallet.css';


const Wallet = () => {
  // ===================== [ States & Refs ] =====================
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [showBalance, setShowBalance] = useState(true);
  const [activeModal, setActiveModal] = useState(null);
  
  // Forms States
  const [transferForm, setTransferForm] = useState({ id: '', amount: '', note: '', pin: '' });
  const [rechargeForm, setRechargeForm] = useState({ amount: '', phone: '', img: null, method: 'voda' });
  const [vaultAction, setVaultAction] = useState({ type: 'deposit', amount: '' });
  const [vaultPIN, setVaultPIN] = useState('');
  const [isVaultLocked, setIsVaultLocked] = useState(true);

  
  // UI States
  const [notifications, setNotifications] = useState([]);
  const [searchID, setSearchID] = useState('');
  const [foundUser, setFoundUser] = useState(null);

  // ===================== [ Firebase Real-time Sync ] =====================
  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged(currentUser => {
      if (currentUser) {
        // 1. مراقبة بيانات المستخدم
        const unsubUser = onSnapshot(doc(db, 'users', currentUser.uid), (snap) => {
          if (snap.exists()) setUser(snap.data());
        });

        // 2. مراقبة العمليات المالية (آخر 50 عملية)
        const qTrans = query(
          collection(db, 'transactions'),
          where('userId', '==', currentUser.uid),
          orderBy('date', 'desc'),
          limit(50)
        );
        const unsubTrans = onSnapshot(qTrans, (snap) => {
          setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        return () => { unsubUser(); unsubTrans(); };
      }
    });
    return () => unsubAuth();
  }, []);

  // ===================== [ Core Banking Functions ] =====================

  // 1. نظام تحويل النقاط (Rewards System)
  const convertPoints = async () => {
    if (!user?.points || user.points < 500) return alert("الحد الأدنى للتحويل 500 نقطة");
    setLoading(true);
    try {
      const rewardMoney = (user.points / 100); // كل 100 نقطة بـ 1 جنيه
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        balance: increment(rewardMoney),
        points: 0
      });
      await addTransaction("تحويل مكافآت النقاط", rewardMoney, "deposit");
      alert(`تم إضافة ${rewardMoney} ج.م لرصيدك بنجاح!`);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

// تأكد من استيراد هذه الدوال في أعلى الملف إذا لم تكن موجودة
// import { db, storage, auth } from '../firebase/config'; 
// import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const handleConfirmPayment = async () => {
    // 1. التحقق من صحة البيانات المدخلة
    if (!rechargeForm.amount || Number(rechargeForm.amount) <= 0) {
        alert("يرجى إدخال مبلغ صحيح");
        return;
    }
    if (!rechargeForm.phone || rechargeForm.phone.length < 10) {
        alert("يرجى إدخال رقم هاتف صحيح");
        return;
    }
    if (!rechargeForm.img) {
        alert("يرجى رفع صورة إثبات التحويل (سكرين شوت)");
        return;
    }

    setLoading(true);

    try {
        let imageUrl = "";

        // 2. رفع الصورة إلى Firebase Storage
        const storageRef = ref(storage, `recharge_proofs/${auth.currentUser.uid}_${Date.now()}`);
        const uploadResult = await uploadBytes(storageRef, rechargeForm.img);
        imageUrl = await getDownloadURL(uploadResult.ref);

        // 3. تسجيل الطلب في قاعدة البيانات (Firestore)
        await addDoc(collection(db, "rechargeRequests"), {
            userId: auth.currentUser.uid,
            userName: auth.currentUser.displayName || "مستخدم مجهول",
            userEmail: auth.currentUser.email,
            amount: Number(rechargeForm.amount),
            senderPhone: rechargeForm.phone,
            paymentMethod: rechargeForm.method, // 'voda' أو 'insta'
            screenshotUrl: imageUrl,
            status: "pending", // حالة الطلب (قيد الانتظار)
            createdAt: serverTimestamp(),
            type: "recharge"
        });

        // 4. نجاح العملية
        alert("تم إرسال طلبك بنجاح! سيتم مراجعته وإضافة الرصيد لمحفظتك خلال دقائق.");
        
        // إغلاق المودال وتفريغ الفورم
        setActiveModal(null);
        setRechargeForm({ method: 'voda', amount: '', phone: '', img: null });

    } catch (error) {
        console.error("Error in handleConfirmPayment:", error);
        alert("حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مرة أخرى.");
    } finally {
        setLoading(false);
    }
};




  // 2. نظام التحويل P2P مع التحقق من المستلم
  const searchRecipient = async () => {
    if (searchID.length < 5) return;
    const docSnap = await getDoc(doc(db, 'users', searchID));
    if (docSnap.exists()) setFoundUser(docSnap.data());
    else setFoundUser('not_found');
  };

  const executeTransfer = async () => {
    const amt = Number(transferForm.amount);
    if (amt > user.balance) return alert("الرصيد لا يكفي!");
    if (!foundUser || foundUser === 'not_found') return alert("تأكد من المستلم");

    setLoading(true);
    try {
      await runTransaction(db, async (transaction) => {
        const senderRef = doc(db, 'users', auth.currentUser.uid);
        const receiverRef = doc(db, 'users', searchID);

        transaction.update(senderRef, { balance: increment(-amt) });
        transaction.update(receiverRef, { balance: increment(amt) });

        // سجل العملية للراسل
        const tSender = doc(collection(db, 'transactions'));
        transaction.set(tSender, {
          userId: auth.currentUser.uid,
          title: `حوالة مرسلة إلى ${foundUser.name}`,
          amount: amt, type: 'withdraw', date: serverTimestamp(),
          recipientId: searchID
        });

        // سجل العملية للمستلم
        const tReceiver = doc(collection(db, 'transactions'));
        transaction.set(tReceiver, {
          userId: searchID,
          title: `حوالة واردة من ${user.name}`,
          amount: amt, type: 'deposit', date: serverTimestamp(),
          senderId: auth.currentUser.uid
        });
      });
      setActiveModal(null);
      alert("تمت الحوالة بنجاح!");
    } catch (e) { alert("خطأ في العملية"); }
    setLoading(false);
  };

  // 3. نظام الخزنة (The Vault OS)
  const handleVaultMove = async () => {
    const amt = Number(vaultAction.amount);
    if (amt <= 0) return;
    const userRef = doc(db, 'users', auth.currentUser.uid);

    try {
      if (vaultAction.type === 'deposit') {
        if (user.balance < amt) return alert("المحفظة لا تكفي");
        await updateDoc(userRef, { balance: increment(-amt), vaultBalance: increment(amt) });
      } else {
        if (user.vaultBalance < amt) return alert("الخزنة لا تكفي");
        await updateDoc(userRef, { balance: increment(amt), vaultBalance: increment(-amt) });
      }
      setVaultAction({...vaultAction, amount: ''});
      alert("تم التحديث");
    } catch (e) { console.error(e); }
  };

  // دالة مساعدة لتسجيل العمليات
  const addTransaction = async (title, amount, type) => {
    await addDoc(collection(db, 'transactions'), {
      userId: auth.currentUser.uid,
      title, amount, type, date: serverTimestamp()
    });
  };

  // ===================== [ UI Components ] =====================

  return (
    <div className="mafa-banking-os">
      {/* Background Layer */}
      <div className="os-mesh-gradient"></div>

      <div className="os-container">
        {/* --- Top Global Bar --- */}
        <nav className="os-nav">
          <div className="os-profile">
            <div className="avatar-wrapper">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`} alt="user" />
              <div className="status-indicator"></div>
            </div>
            <div className="profile-info">
              <h4>{user?.name || "تحميل النظام..."}</h4>
              <span>{user?.studentLevel || "طالب معتمد"}</span>
            </div>
          </div>
          <div className="os-actions">
            <button className="icon-badge" onClick={() => setActiveModal('notifications')}>
              <Bell size={20} />
              {notifications.length > 0 && <span className="badge-count"></span>}
            </button>
            <button className="icon-badge"><Settings size={20} /></button>
          </div>
        </nav>

        {/* --- Dashboard Content --- */}
        {activeTab === 'dashboard' && (
          <motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="os-main">
            
            {/* 1. السلايدر البنكي (Cards Slider) */}
            <section className="balance-cards-slider">
              <div className="main-card-premium">
                <div className="card-glass-glow"></div>
                <div className="card-header">
                  <div className="brand">MaFa <span>PAY</span></div>
                  <Smartphone size={24} />
                </div>
                <div className="card-body">
                  <div className="balance-info">
                    <p>إجمالي الرصيد المتاح</p>
                    <div className="amount-display">
                      <h2>{showBalance ? `${(user?.balance || 0).toLocaleString()}` : '••••••'} <span>EGP</span></h2>
                      <button onClick={() => setShowBalance(!showBalance)}>
                        {showBalance ? <Eye size={22} /> : <EyeOff size={22} />}
                      </button>
                    </div>
                  </div>
                  <div className="card-chip-box">
                    <div className="chip"></div>
                    <QrCode size={30} opacity={0.5} />
                  </div>
                </div>
                <div className="card-footer">
                  <div className="card-holder">
                    <small>ID المستفيد</small>
                    <p>{auth.currentUser?.uid.slice(0, 16).toUpperCase()}</p>
                  </div>
                  <div className="card-type">PREMIUM</div>
                </div>
              </div>
            </section>

            {/* 2. أيقونات الوظائف (Grid) */}
            <section className="os-functions-grid">
              <div className="func-item" onClick={() => setActiveModal('recharge')}>
                <div className="f-icon c-blue"><Plus /></div>
                <span>شحن</span>
              </div>
              <div className="func-item" onClick={() => setActiveModal('transfer')}>
                <div className="f-icon c-purple"><ArrowRightLeft /></div>
                <span>تحويل</span>
              </div>
              <div className="func-item" onClick={() => setActiveTab('vault')}>
                <div className="f-icon c-gold"><Lock /></div>
                <span>الخزنة</span>
              </div>
              <div className="func-item" onClick={() => setActiveModal('p2p_request')}>
                <div className="f-icon c-green"><Download /></div>
                <span>طلب مال</span>
              </div>
              <div className="func-item" onClick={() => setActiveTab('analytics')}>
                <div className="f-icon c-red"><BarChart3 /></div>
                <span>تقارير</span>
              </div>
              <div className="func-item" onClick={() => setActiveModal('points')}>
                <div className="f-icon c-orange"><Award /></div>
                <span>مكافآت</span>
              </div>
            </section>

            {/* 3. الإحصائيات السريعة (Quick Stats) */}
            <section className="quick-stats-row">
              <div className="stat-pill">
                <Target size={16} />
                <span>مصروفات الشهر: <strong>450 ج.م</strong></span>
              </div>
              <div className="stat-pill" onClick={convertPoints}>
                <Star size={16} fill="#FFD700" />
                <span>نقاطك: <strong>{user?.points || 0}</strong></span>
              </div>
            </section>

            {/* 4. قائمة العمليات الاحترافية */}
            <section className="history-preview">
              <div className="h-header">
                <h3>آخر العمليات</h3>
                <button onClick={() => setActiveTab('history')}>عرض الكل <ChevronRight size={16} /></button>
              </div>
              <div className="os-trans-list">
                {transactions.slice(0, 6).map((t, i) => (
                  <motion.div 
                    key={t.id} 
                    initial={{ x: -20, opacity: 0 }} 
                    animate={{ x: 0, opacity: 1 }} 
                    transition={{ delay: i * 0.05 }}
                    className="os-trans-item"
                  >
                    <div className={`t-avatar ${t.type}`}>
                      {t.type === 'deposit' ? <ArrowDownLeft /> : <ArrowUpRight />}
                    </div>
                    <div className="t-content">
                      <div className="t-main">
                        <h6>{t.title}</h6>
                        <span className={t.type}>{t.type === 'deposit' ? '+' : '-'}{t.amount} ج.م</span>
                      </div>
                      <div className="t-sub">
                        <small>{t.date?.toDate().toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}</small>
                        <small>{t.id.slice(0, 8)}#</small>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          </motion.main>
        )}

        {/* --- Tab: The Vault (الخزنة الكاملة) --- */}
        {activeTab === 'vault' && (
          <motion.section initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="os-vault-page">
            <header className="page-header">
              <button onClick={() => setActiveTab('dashboard')}><ChevronRight /></button>
              <h3>خزنة التوفير الذكية</h3>
            </header>
            
            <div className="vault-hero-card">
              <div className={`vault-shield ${isVaultLocked ? 'locked' : 'unlocked'}`}>
                {isVaultLocked ? <Lock size={50} /> : <Unlock size={50} />}
              </div>
              <div className="vault-balance">
                <small>إجمالي المدخرات</small>
                <h1>{user?.vaultBalance || 0} <span>EGP</span></h1>
              </div>
            </div>

            {isVaultLocked ? (
              <div className="vault-auth-box glass">
                <p>أدخل رمز الأمان للتحكم في الخزنة</p>
                <div className="pin-input-group">
                  <input type="password" maxLength="4" placeholder="• • • •" onChange={(e) => setVaultPIN(e.target.value)} />
                </div>
                <button onClick={() => {
                  if(vaultPIN === (user?.vaultPIN || "1234")) setIsVaultLocked(false);
                  else alert("رمز خاطئ!");
                }}>فتح الخزنة</button>
              </div>
            ) : (
              <div className="vault-controls">
                <div className="control-tabs">
                  <button className={vaultAction.type === 'deposit' ? 'active' : ''} onClick={() => setVaultAction({...vaultAction, type: 'deposit'})}>إيداع</button>
                  <button className={vaultAction.type === 'withdraw' ? 'active' : ''} onClick={() => setVaultAction({...vaultAction, type: 'withdraw'})}>سحب</button>
                </div>
                <div className="amount-input glass">
                  <input 
                    type="number" 
                    placeholder="أدخل المبلغ..." 
                    value={vaultAction.amount} 
                    onChange={(e) => setVaultAction({...vaultAction, amount: e.target.value})} 
                  />
                </div>
                <button className="execute-vault-btn" onClick={handleVaultMove}>
                  {vaultAction.type === 'deposit' ? 'تأكيد الإيداع' : 'تأكيد السحب'}
                </button>
                <button className="lock-vault-btn" onClick={() => setIsVaultLocked(true)}>قفل الخزنة الآن</button>
              </div>
            )}
          </motion.section>
        )}

        {/* --- Floating Bottom Navigation --- */}
        <footer className="os-bottom-nav glass">
          <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>
            <WalletIcon size={22} />
            <span>المحفظة</span>
          </button>
          <button className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}>
            <History size={22} />
            <span>النشاط</span>
          </button>
          <div className="nav-center-scan" onClick={() => setActiveModal('recharge')}>
            <div className="scan-btn-inner">
              <Plus size={28} />
            </div>
          </div>
          <button className={activeTab === 'vault' ? 'active' : ''} onClick={() => setActiveTab('vault')}>
            <Lock size={22} />
            <span>الخزنة</span>
          </button>
          <button onClick={() => window.open('https://wa.me/201262008')}>
            <Headphones size={22} />
            <span>الدعم</span>
          </button>
        </footer>
      </div>

      {/* ===================== [ MODALS SYSTEM ] ===================== */}
      <AnimatePresence>
        {activeModal === 'transfer' && (
          <motion.div className="os-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="os-modal-card glass-heavy" initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}>
              <div className="modal-header">
                <h4>تحويل سريع</h4>
                <button onClick={() => setActiveModal(null)}><X /></button>
              </div>
              <div className="modal-body">
                <div className="search-recipient-box">
                  <label>ابحث عن الطالب (ID)</label>
                  <div className="search-input">
                    <input type="text" placeholder="مثلاً: 5vK9..." onChange={(e) => setSearchID(e.target.value)} />
                    <button onClick={searchRecipient}><Search size={18} /></button>
                  </div>
                </div>

                {foundUser && foundUser !== 'not_found' && (
                  <motion.div className="recipient-preview glass" initial={{ scale: 0.9 }}>
                    <CheckCircle2 size={20} color="#10b981" />
                    <span>تحويل إلى: <strong>{foundUser.name}</strong></span>
                  </motion.div>
                )}

                <div className="input-field">
                  <label>المبلغ</label>
                  <input type="number" placeholder="0.00" onChange={(e) => setTransferForm({...transferForm, amount: e.target.value})} />
                </div>
                
    
<div className="input-field">
                  <label>رسالة أو ملاحظة (اختياري)</label>
                  <input 
                    type="text" 
                    placeholder="مثلاً: رد سلفة، ثمن كورس..." 
                    onChange={(e) => setTransferForm({...transferForm, note: e.target.value})} 
                  />
                </div>

                <div className="transfer-summary glass">
                   <div className="summary-item">
                      <span>رسوم العملية</span>
                      <span className="free-tag">مجاني</span>
                   </div>
                   <div className="summary-item total">
                      <span>إجمالي الخصم</span>
                      <span>{transferForm.amount || 0} ج.م</span>
                   </div>
                </div>

                <div className="security-notice">
                   <ShieldAlert size={14} />
                   <p>بضغطك على تأكيد، فأنت توافق على نقل الأموال نهائياً.</p>
                </div>
                
                <button 
                  className={`os-btn-primary ${loading ? 'loading' : ''}`} 
                  onClick={executeTransfer} 
                  disabled={loading || !foundUser || foundUser === 'not_found'}
                >
                  {loading ? (
                    <div className="loader-element">
                      <RefreshCw className="spin" size={18} />
                      <span>جاري المعالجة...</span>
                    </div>
                  ) : (
                    <>
                      <ArrowUpRight size={18} />
                      <span>تأكيد وإرسال الأموال</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* --- 2. مودال شحن الرصيد (Advanced Recharge) --- */}
        {activeModal === 'recharge' && (
          <motion.div className="os-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="os-modal-card glass-heavy h-auto" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
              <div className="modal-header">
                <div className="title-with-icon">
                  <div className="icon-bg-small c-blue"><Plus size={18}/></div>
                  <h4>شحن الرصيد</h4>
                </div>
                <button onClick={() => setActiveModal(null)} className="close-modal-btn"><X /></button>
              </div>
              
              <div className="modal-body recharge-body">
                <div className="methods-selector">
                  <button 
                    className={`method-card ${rechargeForm.method === 'voda' ? 'active' : ''}`}
                    onClick={() => setRechargeForm({...rechargeForm, method: 'voda'})}
                  >
                    <Smartphone size={24} />
                    <span>فودافون كاش</span>
                  </button>
                  <button 
                    className={`method-card ${rechargeForm.method === 'insta' ? 'active' : ''}`}
                    onClick={() => setRechargeForm({...rechargeForm, method: 'insta'})}
                  >
                    <Landmark size={24} />
                    <span>InstaPay</span>
                  </button>
                </div>

                <div className="recharge-instructions glass">
                  <div className="ins-row">
                    <span>الرقم المحول إليه:</span>
                    <div className="copy-badge">
                      <strong>01262008</strong>
                      <button onClick={() => {
                        navigator.clipboard.writeText('01514184033');
                        alert("تم نسخ الرقم");
                      }}><Copy size={14} /></button>
                    </div>
                  </div>
                  <p className="ins-hint">قم بالتحويل أولاً ثم ارفع الصورة هنا.</p>
                </div>

                <div className="input-group-v2">
                  <div className="v2-field">
                    <label>المبلغ المحول</label>
                    <input 
                      type="number" 
                      placeholder="0.00" 
                      onChange={(e) => setRechargeForm({...rechargeForm, amount: e.target.value})}
                    />
                  </div>
                  <div className="v2-field">
                    <label>رقمك المحول منه</label>
                    <input 
                      type="text" 
                      placeholder="01x xxxx xxxx" 
                      onChange={(e) => setRechargeForm({...rechargeForm, phone: e.target.value})}
                    />
                  </div>
                </div>

                <div className="upload-section-v4">
                  <label className={`dropzone-v4 ${rechargeForm.img ? 'has-file' : ''}`}>
                    <input 
                      type="file" 
                      hidden 
                      accept="image/*" 
                      onChange={(e) => setRechargeForm({...rechargeForm, img: e.target.files[0]})} 
                    />
                    {rechargeForm.img ? (
                      <div className="file-info">
                        <CheckCircle2 color="#10b981" />
                        <span>{rechargeForm.img.name}</span>
                      </div>
                    ) : (
                      <>
                        <ImageIcon size={30} />
                        <span>ارفع سكرين شوت التحويل</span>
                      </>
                    )}
                  </label>
                </div>

                <button className="os-btn-primary recharge-btn" onClick={handleConfirmPayment} disabled={loading}>
                   {loading ? <RefreshCw className="spin" /> : "إرسال الطلب للمراجعة"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* --- 3. صفحة تحليل البيانات (Spending Analytics) --- */}
        {activeTab === 'analytics' && (
          <motion.section className="os-analytics-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <header className="page-header">
               <button onClick={() => setActiveTab('dashboard')}><ChevronRight /></button>
               <h3>إحصائيات ذكية</h3>
               <button className="export-btn"><Download size={18} /></button>
            </header>

            <div className="analytics-grid">
               <div className="chart-card-v4 glass">
                  <div className="chart-header">
                     <h5>توزيع المصروفات</h5>
                     <Filter size={14} />
                  </div>
                  <div className="visual-chart">
                     {/* محاكاة رسم بياني احترافي */}
                     <div className="progress-circle-v4">
                        <svg viewBox="0 0 36 36" className="circular-chart">
                          <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                          <path className="circle" strokeDasharray="60, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        </svg>
                        <div className="percentage">60%</div>
                     </div>
                     <div className="chart-legend">
                        <div className="l-item"><span className="dot c1"></span> كورسات</div>
                        <div className="l-item"><span className="dot c2"></span> امتحانات</div>
                        <div className="l-item"><span className="dot c3"></span> تحويلات</div>
                     </div>
                  </div>
               </div>

               <div className="insights-row">
                  <div className="insight-card glass">
                     <TrendingUp size={20} color="#10b981" />
                     <div className="i-info">
                        <small>أعلى إنفاق</small>
                        <h6>الفيزياء</h6>
                     </div>
                  </div>
                  <div className="insight-card glass">
                     <Award size={20} color="#fbbf24" />
                     <div className="i-info">
                        <small>توفير الشهر</small>
                        <h6>120 ج.م</h6>
                     </div>
                  </div>
               </div>

               <div className="spending-timeline glass">
                  <h5>الإنفاق الأسبوعي</h5>
                  <div className="bars-container">
                     {[40, 70, 45, 90, 65, 30, 50].map((h, i) => (
                       <div key={i} className="bar-wrapper">
                          <motion.div 
                            className="bar" 
                            initial={{ height: 0 }} 
                            animate={{ height: `${h}%` }}
                            transition={{ delay: i * 0.1 }}
                          ></motion.div>
                          <span>{['S','M','T','W','T','F','S'][i]}</span>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
          </motion.section>
        )}

        {/* --- 4. مودال المكافآت (Loyalty Points) --- */}
        {activeModal === 'points' && (
          <motion.div className="os-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <motion.div className="os-modal-card glass-heavy" initial={{ y: 50 }}>
               <div className="modal-header">
                  <h4>نظام المكافآت MaFa Club</h4>
                  <button onClick={() => setActiveModal(null)}><X /></button>
               </div>
               <div className="modal-body center-text">
                  <div className="points-master-card">
                     <Star size={50} fill="#fbbf24" color="#fbbf24" className="floating" />
                     <h2>{user?.points || 0}</h2>
                     <p>نقطة ولاء معتمدة</p>
                  </div>
                  
                  <div className="rewards-info glass">
                     <div className="r-row">
                        <span>قيمة النقاط الحالية:</span>
                        <strong>{(user?.points || 0) / 100} ج.م</strong>
                     </div>
                     <div className="r-row">
                        <span>المستوى القادم:</span>
                        <strong>Golden Student</strong>
                     </div>
                  </div>

                  <button 
                    className="os-btn-primary gold-gradient" 
                    onClick={convertPoints}
                    disabled={!user?.points || user.points < 500}
                  >
                     تحويل النقاط إلى رصيد كاش
                  </button>
                  <small className="hint">أقل كمية للتحويل هي 500 نقطة</small>
               </div>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

export default Wallet;
