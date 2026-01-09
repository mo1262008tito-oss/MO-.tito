import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { 
  doc, onSnapshot, updateDoc, arrayUnion, 
  increment, getDocs, collection, query, where, orderBy, limit, addDoc 
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layout, Power, CheckCircle, Award, PlayCircle, Calendar, Trash2,
  BookOpen, Clock, Flame, Key, Trophy, ShoppingBag, GraduationCap, Zap, Target, Plus, Check, ListChecks,
  Wallet, ShieldCheck, MessageSquare, StickyNote, DownloadCloud, AlertTriangle, Image as ImageIcon, Send, Smartphone, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './StudentDash.css';

const StudentDash = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [activeTab, setActiveTab] = useState('my-courses'); 
  const [taskText, setTaskText] = useState("");
  const [notif, setNotif] = useState({ show: false, msg: "", type: "info" });
  const [availableCourses, setAvailableCourses] = useState([]);
  const [activationCode, setActivationCode] = useState("");
  const [topStudents, setTopStudents] = useState([]);
  
  // --- أنظمة التخطيط والوقت ---
  const [studyDay, setStudyDay] = useState(""); 
  const [studySubject, setStudySubject] = useState("");
  const [pomoMode, setPomoMode] = useState('work'); 
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);

  // --- أنظمة الدفع الجديدة ---
  const [showPaymentModal, setShowPaymentModal] = useState({ show: false, course: null });
  const [receiptImage, setReceiptImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (auth.currentUser) {
      // 1. مراقبة بيانات الطالب + فحص الأمان
      const unsub = onSnapshot(doc(db, "users", auth.currentUser.uid), (d) => {
        if (d.exists()) {
          const data = d.data();
          setStudent(data);
          checkSecurity(data);
        }
      });

      // 2. جلب متجر الكورسات
      const fetchStore = async () => {
        const q = collection(db, "courses_metadata");
        const snap = await getDocs(q);
        setAvailableCourses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      };

      // 3. لوحة الأوائل
      const fetchLeaders = () => {
        const q = query(collection(db, "users"), orderBy("points", "desc"), limit(10));
        onSnapshot(q, (snap) => {
          setTopStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
      };
      
      fetchStore();
      fetchLeaders();
      return () => unsub();
    }
  }, []);

  // --- [نظام الأمان] ---
  const checkSecurity = (userData) => {
    const currentDevice = navigator.userAgent; 
    if (userData.deviceId && userData.deviceId !== currentDevice) {
       if (userData.secondDeviceId && userData.secondDeviceId !== currentDevice) {
          triggerNotif("تنبيه أمني: لا يمكنك الدخول من جهاز ثالث!", "error");
       }
    }
  };

  // --- [نظام الشحن بالأكواد] ---
  const handleActivateCode = async () => {
    if(!activationCode) return;
    const q = query(collection(db, "activationCodes"), where("code", "==", activationCode), where("isUsed", "==", false));
    const snap = await getDocs(q);

    if(snap.empty) return triggerNotif("الكود غير صحيح أو مستخدم", "error");

    const codeDoc = snap.docs[0];
    const codeData = codeDoc.data();

    try {
      if(codeData.type === 'wallet') {
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
          walletBalance: increment(codeData.amount),
          transactions: arrayUnion({ type: 'charge', amount: codeData.amount, date: new Date().toISOString() })
        });
        triggerNotif(`تم شحن ${codeData.amount} جنيهاً!`, "success");
      } else {
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
          enrolledContent: arrayUnion(codeData.targetId)
        });
        triggerNotif("تم تفعيل الكورس بنجاح", "success");
      }
      await updateDoc(doc(db, "activationCodes", codeDoc.id), { isUsed: true, usedBy: auth.currentUser.email });
      setActivationCode("");
    } catch(e) { triggerNotif("حدث خطأ في التفعيل", "error"); }
  };

  // --- [نظام الشراء المطور] ---
  const buyCourse = async (course) => {
    const price = parseInt(course.price);
    if((student.walletBalance || 0) < price) {
      setShowPaymentModal({ show: true, course: course });
      return;
    }

    if(window.confirm(`هل تريد شراء ${course.title} بـ ${price} جنيه؟`)) {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        walletBalance: increment(-price),
        enrolledContent: arrayUnion(course.id),
        transactions: arrayUnion({ type: 'buy', item: course.title, amount: price, date: new Date().toISOString() })
      });
      triggerNotif("تم الشراء بنجاح، استمتع بالمذاكرة!", "success");
    }
  };

  // --- [نظام الدفع اليدوي وواتساب] ---
  const handleConfirmPayment = async () => {
    if (!receiptImage) return triggerNotif("يرجى إرفاق صورة الإيصال أولاً", "error");
    setIsUploading(true);
    try {
      await addDoc(collection(db, "payment_requests"), {
        userId: auth.currentUser.uid,
        userName: student.name,
        courseId: showPaymentModal.course.id,
        courseName: showPaymentModal.course.title,
        amount: showPaymentModal.course.price,
        receiptUrl: receiptImage,
        status: "pending",
        timestamp: new Date().toISOString()
      });

      const whatsappMsg = `طلب تفعيل كورس: ${showPaymentModal.course.title}%0Aاسم الطالب: ${student.name}%0Aالقيمة: ${showPaymentModal.course.price}`;
      window.open(`https://wa.me/201234567890?text=${whatsappMsg}`, '_blank'); // استبدل الرقم برقمك
      
      triggerNotif("تم إرسال الطلب للأدمن وفتح واتساب", "success");
      setShowPaymentModal({ show: false, course: null });
      setReceiptImage(null);
    } catch (e) { triggerNotif("خطأ في الإرسال", "error"); }
    finally { setIsUploading(false); }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setReceiptImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // --- [بومودورو والمهام] ---
  useEffect(() => {
    let interval = null;
    if (isActive && (minutes > 0 || seconds > 0)) {
      interval = setInterval(() => {
        if (seconds === 0) { setMinutes(m => m - 1); setSeconds(59); }
        else { setSeconds(s => s - 1); }
      }, 1000);
    } else if (minutes === 0 && seconds === 0) {
      setIsActive(false);
      const isWork = pomoMode === 'work';
      if(isWork) handleGrantPoints(50);
      setPomoMode(isWork ? 'break' : 'work');
      setMinutes(isWork ? 5 : 25);
    }
    return () => clearInterval(interval);
  }, [isActive, minutes, seconds, pomoMode]);

  const triggerNotif = (msg, type = "info") => {
    setNotif({ show: true, msg, type });
    setTimeout(() => setNotif(prev => ({ ...prev, show: false })), 4000);
  };

  const handleGrantPoints = async (pts) => {
    await updateDoc(doc(db, "users", auth.currentUser.uid), { points: increment(pts) });
  };

  const addTask = async () => {
    if(!taskText.trim()) return;
    await updateDoc(doc(db, "users", auth.currentUser.uid), { 
        tasks: arrayUnion({ id: Date.now(), text: taskText, completed: false, createdAt: new Date().toISOString() }) 
    });
    setTaskText("");
    triggerNotif("تمت إضافة المهمة 🚀");
  };

  const toggleTask = async (taskId) => {
    const updatedTasks = student.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
    await updateDoc(doc(db, "users", auth.currentUser.uid), { tasks: updatedTasks });
    if (!student.tasks.find(t => t.id === taskId).completed) {
      handleGrantPoints(15);
      triggerNotif("إنجاز رائع! +15 XP", "success");
    }
  };

  const addStudySchedule = async () => {
    if(!studyDay || !studySubject) return triggerNotif("أكمل بيانات الجدول", "error");
    await updateDoc(doc(db, "users", auth.currentUser.uid), { 
        studySchedule: arrayUnion({ id: Date.now(), day: studyDay, subject: studySubject }) 
    });
    setStudySubject("");
    triggerNotif("تم تحديث الجدول 📅");
  };

  const getRank = (pts = 0) => {
    if (pts > 5000) return { title: "أسطورة", color: "#ff007a" };
    if (pts > 2000) return { title: "محارب", color: "#7000ff" };
    return { title: "طالب طموح", color: "#00f2ff" };
  };

  if (!student) return <div className="nebula-loading">جاري التحميل...</div>;

  return (
    <div className={`student-nebula-root ${isActive ? 'focus-mode-active' : ''}`}>
      
      {/* التنبيهات */}
      <AnimatePresence>
        {notif.show && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 20, opacity: 1 }} exit={{ y: -50 }} className={`floating-notif-v2 ${notif.type}`}>
            {notif.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <aside className="side-dock-v2">
        <div className="dock-brand"><div className="inner-glow"><Zap size={24} fill="#00f2ff" /></div></div>
        <nav className="dock-nav">
          <button className={activeTab === 'my-courses' ? 'active' : ''} onClick={() => setActiveTab('my-courses')}><Layout /><span className="tooltip">مكتبتي</span></button>
          <button className={activeTab === 'store' ? 'active' : ''} onClick={() => setActiveTab('store')}><ShoppingBag /><span className="tooltip">المتجر</span></button>
          <button className={activeTab === 'wallet' ? 'active' : ''} onClick={() => setActiveTab('wallet')}><Wallet /><span className="tooltip">المحفظة</span></button>
          <button className={activeTab === 'schedule' ? 'active' : ''} onClick={() => setActiveTab('schedule')}><Calendar /><span className="tooltip">الجدول</span></button>
          <button className={activeTab === 'leaderboard' ? 'active' : ''} onClick={() => setActiveTab('leaderboard')}><Trophy /><span className="tooltip">الأوائل</span></button>
        </nav>
        <div className="dock-footer">
          <button className="support-btn" onClick={() => window.open('https://wa.me/201234567890')}><MessageSquare /></button>
          <button className="logout-btn" onClick={() => auth.signOut()}><Power /></button>
        </div>
      </aside>

      <main className="nebula-main">
        <header className="nebula-top-bar-v2">
          <div className="user-profile-info">
            <div className="avatar-container">
              <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${student?.email}`} alt="avatar" />
            </div>
            <div className="user-details">
              <h2>{getRank(student.points).title}: {student?.name?.split(' ')[0]} 🔥</h2>
              <div className="xp-container">
                 <div className="xp-bar-bg"><motion.div className="xp-bar-fill" style={{background: getRank(student.points).color}} animate={{width: `${(student?.points % 1000) / 10}%`}} /></div>
                 <span className="xp-counter">{student?.points} XP</span>
              </div>
            </div>
          </div>

          <div className="wallet-quick-view glass">
             <Wallet size={16} color="gold" />
             <span>{student.walletBalance || 0} EGP</span>
          </div>

          <div className="nebula-quick-activation">
              <Key size={18} />
              <input value={activationCode} onChange={(e)=>setActivationCode(e.target.value)} placeholder="كود تفعيل..." />
              <button onClick={handleActivateCode}>تفعيل</button>
          </div>
        </header>

        <div className="nebula-grid-layout">
          <section className="main-viewport">
            <AnimatePresence mode="wait">
              {activeTab === 'my-courses' && (
                <motion.div key="courses" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="nebula-panel">
                  <div className="section-title"><BookOpen size={20} /> محاضراتي الدراسية</div>
                  <div className="courses-grid-v2">
                    {availableCourses.filter(c => student?.enrolledContent?.includes(c.id)).map(course => (
                      <div key={course.id} className="course-card-v2" onClick={() => navigate(`/video-player/${course.id}`)}>
                        <div className="card-media" style={{backgroundImage: `url(${course.thumbnail})`}}>
                          <div className="play-btn-v2"><PlayCircle /></div>
                        </div>
                        <div className="card-body"><h4>{course.title}</h4><p>{course.subject}</p></div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'store' && (
                <motion.div key="store" initial={{opacity:0}} animate={{opacity:1}} className="nebula-panel">
                  <div className="section-title"><ShoppingBag size={20} /> متجر الكورسات</div>
                  <div className="courses-grid-v2">
                    {availableCourses.filter(c => !student?.enrolledContent?.includes(c.id)).map(course => (
                      <div key={course.id} className="course-card-v2 store-item">
                        <div className="card-media" style={{backgroundImage: `url(${course.thumbnail})`}}></div>
                        <div className="card-body">
                          <h4>{course.title}</h4>
                          <div className="price-tag">{course.price} EGP</div>
                          <button className="buy-btn" onClick={() => buyCourse(course)}>شراء الآن</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'wallet' && (
                <motion.div key="wallet" className="nebula-panel">
                   <div className="section-title"><Wallet size={20} /> محفظتي</div>
                   <div className="wallet-dashboard glass">
                      <h1>{student.walletBalance || 0} <small>EGP</small></h1>
                      <div className="transaction-history">
                        {student.transactions?.map((t, i) => (
                          <div key={i} className="t-row">
                            <span>{t.item || 'شحن'}</span>
                            <span className={t.type === 'charge' ? 'plus' : 'minus'}>{t.amount} EGP</span>
                          </div>
                        ))}
                      </div>
                   </div>
                </motion.div>
              )}

              {activeTab === 'schedule' && (
                <motion.div key="schedule" className="nebula-panel">
                   <div className="section-title"><Calendar size={20} /> الجدول الأسبوعي</div>
                   <div className="schedule-creator glass">
                      <select value={studyDay} onChange={e => setStudyDay(e.target.value)}>
                        <option value="">اليوم</option>
                        {['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <input placeholder="المادة..." value={studySubject} onChange={e => setStudySubject(e.target.value)} />
                      <button onClick={addStudySchedule}><Plus size={18} /></button>
                   </div>
                   <div className="schedule-grid">
                      {student?.studySchedule?.map(item => (
                        <div key={item.id} className="schedule-item"><span>{item.day}</span>: <b>{item.subject}</b></div>
                      ))}
                   </div>
                </motion.div>
              )}

              {activeTab === 'leaderboard' && (
                <motion.div key="leaders" className="nebula-panel">
                   <div className="section-title"><Trophy size={20} /> المتصدرين</div>
                   <div className="leaders-list">
                      {topStudents.map((s, index) => (
                        <div key={s.id} className={`leader-item ${index < 3 ? 'top-three' : ''}`}>
                           <span className="rank">#{index + 1}</span>
                           <span className="name">{s.name}</span>
                           <span className="pts">{s.points} XP</span>
                        </div>
                      ))}
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          <aside className="secondary-viewport">
            <div className={`pomo-card-v2 ${pomoMode}`}>
              <div className="pomo-timer">{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</div>
              <button className="pomo-ctrl" onClick={() => setIsActive(!isActive)}>{isActive ? 'إيقاف' : 'ابدأ'}</button>
            </div>

            <div className="todo-card-v2">
              <div className="todo-header"><ListChecks size={20} /> المهام</div>
              <div className="todo-input-v2">
                <input value={taskText} onChange={(e)=>setTaskText(e.target.value)} placeholder="أضف مهمة..." />
                <button onClick={addTask}><Plus size={20}/></button>
              </div>
              <div className="todo-list-v2">
                {student?.tasks?.slice().reverse().map(t => (
                  <div key={t.id} className={`todo-item-v2 ${t.completed ? 'done' : ''}`}>
                    <div className="check-box" onClick={() => toggleTask(t.id)}>{t.completed && <Check size={14}/>}</div>
                    <span>{t.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* مودال الدفع المطور */}
      <AnimatePresence>
        {showPaymentModal.show && (
          <motion.div className="payment-overlay" initial={{opacity:0}} animate={{opacity:1}}>
            <motion.div className="payment-modal glass" initial={{scale:0.9}}>
              <button className="close-btn" onClick={() => setShowPaymentModal({show:false})}><X/></button>
              <h3>تفعيل: {showPaymentModal.course.title}</h3>
              <p>رصيدك غير كافٍ، حول مبلغ <b>{showPaymentModal.course.price} ج.م</b> لـ 010XXXXXXXX وارفع الإيصال:</p>
              
              <label className="upload-box">
                <input type="file" accept="image/*" onChange={handleImageChange} hidden />
                {receiptImage ? <img src={receiptImage} className="preview-img" /> : <><ImageIcon size={30} /><p>ارفع صورة الإيصال</p></>}
              </label>

              <button className="confirm-pay-btn" onClick={handleConfirmPayment} disabled={isUploading}>
                {isUploading ? "جاري الإرسال..." : <><Send size={18}/> إرسال وتأكيد عبر واتساب</>}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentDash;
