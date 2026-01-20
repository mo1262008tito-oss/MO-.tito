import React, { useEffect, useMemo, useRef, useState } from "react";
// استيراد وظائف Firebase
import { 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  collection, doc, getDocs, query, where, orderBy, 
  onSnapshot, updateDoc, addDoc, deleteDoc, setDoc, increment, limit, arrayUnion 
} from "firebase/firestore";
import { 
  ref as storageRef, uploadBytesResumable, getDownloadURL 
} from "firebase/storage";

// استيراد المكتبات الخارجية
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Pin, Trash2, User, Mail, Lock, Phone, UserPlus, AlertCircle, Shield, Zap, Star 
} from 'lucide-react'; // تأكد من تثبيت lucide-react


// استيراد الإعدادات المركزية (هذا السطر الأهم لمنع التكرار)
import { auth, db, storage } from "../firebase"; 
import "./StudentDash.css";



// 1. مكون بطاقة الإحصائيات (StatCard)
const StatCard = ({ title, value, icon, hint, trend }) => (
  <motion.div 
    className="stat-card glass-v4"
    whileHover={{ y: -8, boxShadow: "0 12px 30px rgba(0,0,0,0.2)" }}
  >
    <div className="card-top">
      <span className="card-icon-bg">{icon}</span>
      <span className={`trend-tag ${trend}`}>{trend}</span>
    </div>
    <div className="card-body">
      <h3 className="card-value">{value}</h3>
      <p className="card-title">{title}</p>
    </div>
    <div className="card-hint">{hint}</div>
  </motion.div>
);

// 2. مكون قائمة المهام (TodoPanel)
const TodoPanel = ({ items, onAdd, onToggle, onDelete }) => {
  const [val, setVal] = useState("");
  return (
    <div className="todo-widget">
      <div className="todo-input-group">
        <input 
          type="text" 
          placeholder="أضف مهمة جديدة..." 
          value={val} 
          onChange={(e) => setVal(e.target.value)}
        />
        <button onClick={() => { if(val.trim()){ onAdd(val); setVal(""); } }}>➕</button>
      </div>
      <div className="todo-list-scroll">
        {items && items.map(item => (
          <div key={item.id} className={`todo-item ${item.done ? 'completed' : ''}`}>
            <input type="checkbox" checked={item.done} onChange={() => onToggle(item.id, item.done)} />
            <span className="todo-text">{item.text}</span>
            <button className="del-btn" onClick={() => onDelete(item.id)}>🗑️</button>
          </div>
        ))}
        {items.length === 0 && <p className="empty-msg">لا يوجد مهام اليوم!</p>}
      </div>
    </div>
  );
};


// 3. مكون قائمة المتصدرين (LeaderboardList)
const LeaderboardList = ({ items, currentUser }) => (
  <div className="leader-list">
    {items.map((user, idx) => (
      <div key={user.id} className={`leader-row ${user.id === currentUser ? 'highlight' : ''}`}>
        <div className="leader-rank">{idx + 1}</div>
        <div className="leader-info">
          <img src={user.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.id}`} alt="" />
          <span className="leader-name">{user.displayName || "طالب"}</span>
        </div>
        <div className="leader-xp">{user.xp || 0} XP</div>
      </div>
    ))}
  </div>
);

// 4. مكون الإشعارات (NotificationsList)
const NotificationsList = ({ items }) => (
  <div className="notif-list">
    {items.length > 0 ? items.map((n, i) => (
      <div key={i} className={`notif-item ${n.read ? 'read' : 'unread'}`}>
        <div className="notif-icon">📣</div>
        <div className="notif-text">
          <p>{n.message}</p>
          <small>{n.timestamp ? new Date(n.timestamp).toLocaleTimeString('ar-EG') : ""}</small>
        </div>
      </div>
    )) : <p className="empty-msg">لا توجد تنبيهات جديدة</p>}
  </div>
);const StudentDash = () => {
  const navigate = useNavigate();
  // حذفنا أسطر useMemo بالكامل لأننا استوردنا المتغيرات جاهزة في الأعلى
  const userRef = useRef(null); 

  // ... باقي الحالات (States)
  const notesRef = useRef(null);
  // --- حالات الطالب (Profile State) ---
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({
    displayName: "", email: "", avatarUrl: "",
    xp: 0, level: 1, streak: 0, balance: 0,
    badges: [], tasksCompleted: 0, hoursSpent: 0,
    coursesCompleted: 0, xpPercent: 0, isOnline: true, lastLoginDate: null
  });

  
  // --- حالات الواجهة (UI State) ---
  const [theme, setTheme] = useState("space-dark");
  const [dailyQuote, setDailyQuote] = useState("النجاح هو مجموع محاولات صغيرة تتكرر يوماً بعد يوم.");
  const [todos, setTodos] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [pomodoro, setPomodoro] = useState({ running: false, seconds: 1500, mode: "focus" });
  const [focusMode, setFocusMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [broadcasts, setBroadcasts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [learningPath, setLearningPath] = useState([
    { id: 1, title: "أساسيات البرمجة", status: "completed", xp: 100 },
    { id: 2, title: "هياكل البيانات", status: "in-progress", xp: 250 },
    { id: 3, title: "تطوير الويب المتقدم", status: "locked", xp: 500 }
  ]);
  const [mood, setMood] = useState("neutral");

  
  // --- دوال المساعدة ---
  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const renderAvatar = () => {
    if (profile.avatarUrl) return profile.avatarUrl;
    return `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.uid ?? "default"}`;
  };

  const calculateLevelProgress = () => {
    const xpPerLevel = 1000;
    return ((profile.xp % xpPerLevel) / xpPerLevel) * 100;
  };

// أضف State في الأعلى
const [showActivationModal, setShowActivationModal] = useState(false);

// الدالة المسببة للخطأ
const goToActivation = () => {
  // بدلاً من الانتقال لصفحة تانية، هنفتح نافذة فوق الصفحة الحالية (أشيك بكتير)
  setShowActivationModal(true);
};
  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
    if (currentUser) {
      setUser(currentUser);
    } else {
      navigate("/login");
    }
  });
  return () => unsubscribe();
}, []);


  // --- 1. إدارة الجلسة والتحقق من المستخدم ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        userRef.current = u;
        subscribeUserProfile(u.uid);
        checkStreak(u.uid); // ميزة 32
      } else {
        navigate("/login", { replace: true });
      }
    });
    return () => unsubscribe();
  }, [auth, navigate]);

  // --- 2. جلب البيانات الحية (Firestore Subscriptions) ---
  const subscribeUserProfile = (uid) => {
    const userDoc = doc(db, "students", uid);
    return onSnapshot(userDoc, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setProfile(p => ({ ...p, ...data }));
      }
    });
  };

  useEffect(() => {
    if (!user?.uid) return;
    // اشتراك المهام
    const unsubTodos = onSnapshot(collection(db, "students", user.uid, "todos"), (snap) => {
      setTodos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    // اشتراك المتصدرين
    const qLeader = query(collection(db, "students"), orderBy("xp", "desc"), limit(10));
    const unsubLeader = onSnapshot(qLeader, (snap) => {
      setLeaderboard(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    // اشتراك العمليات المالية
    const qTrans = query(collection(db, "students", user.uid, "transactions"), orderBy("timestamp", "desc"), limit(10));
    const unsubTrans = onSnapshot(qTrans, (snap) => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubTodos(); unsubLeader(); unsubTrans(); };
  }, [user?.uid, db]);

  // --- 3. نظام الـ XP المحمي ضد التكرار (Anti-Spam XP) ---
  const lastActionXP = useRef({ type: null, timestamp: 0 });
  const accumulateXP = async (amount, type) => { 
    const now = Date.now();
    if (lastActionXP.current.type === type && now - lastActionXP.current.timestamp < 20000) return;
    lastActionXP.current = { type, timestamp: now };
    if (user?.uid) {
      try {
        await updateDoc(doc(db, "students", user.uid), { xp: increment(amount) });
      } catch (e) { console.error("XP Error:", e); }
    }
  };

  
  // --- 4. إدارة المهام (CRUD To-Do) ---
  const addTodo = async (text) => {
    if (!text?.trim() || !user) return;
    await addDoc(collection(db, "students", user.uid, "todos"), { 
      text: text.trim(), done: false, createdAt: Date.now() 
    });
  };

  const toggleTodo = async (docId, currentStatus) => {
   await updateDoc(doc(db, "students", user.uid, "todos", docId), { done: !currentStatus });
    if (!currentStatus) accumulateXP(10, "todo_complete");
  };

  
  // --- 5. نظام الـ Pomodoro المطور ---
  useEffect(() => {
    if (!pomodoro.running) return;
    const t = setInterval(() => {
      setPomodoro(p => {
        if (p.seconds <= 1) {
          clearInterval(t);
          return { ...p, running: false, seconds: 0 };
        }
        return { ...p, seconds: p.seconds - 1 };
      });
    }, 1000);
    return () => clearInterval(t);
  }, [pomodoro.running]);

  const startPomodoro = (focusSeconds = 25 * 60) => setPomodoro({ running: true, seconds: focusSeconds, mode: "focus" });
  const stopPomodoro = () => setPomodoro({ running: false, seconds: 1500, mode: "focus" });

  // --- 6. نظام المتجر والشراء (Marketplace Engine) ---
  const [storeItems] = useState([
    { id: 'double_xp', name: 'مضاعف XP (ساعة)', price: 50, icon: '⚡' },
    { id: 'skip_task', name: 'تخطي مهمة واحدة', price: 150, icon: '🎫' },
    { id: 'premium_avatar', name: 'إطار أفاتار ذهبي', price: 300, icon: '👑' }
  ]);

  

  const buyItem = async (item) => {
    if (profile.balance < item.price) {
      alert("رصيدك لا يكفي! توجه لصفحة الشحن.");
      return;
    }
    const confirmBuy = window.confirm(`هل تريد شراء ${item.name}؟`);
    if (confirmBuy && user) {
      const userRef = doc(db, "students", user.uid);
      await updateDoc(userRef, {
        balance: increment(-item.price),
        inventory: arrayUnion({ ...item, boughtAt: Date.now() })
      });
      await addDoc(collection(db, "students", user.uid, "transactions"), {
        item: item.name, amount: item.price, type: "purchase", timestamp: Date.now()
      });
      accumulateXP(50, "purchase_bonus");
    }
  };

  // --- 7. محرك الحماية والنزاهة (Integrity Engine) ---
  useEffect(() => {
    const detectDevTools = () => {
      if (window.outerWidth - window.innerWidth > 160 || window.outerHeight - window.innerHeight > 160) {
        console.warn("Security Alert: System Monitor Active.");
      }
    };
    window.addEventListener("resize", detectDevTools);
    return () => window.removeEventListener("resize", detectDevTools);
  }, []);

  // --- 8. ميزة تتبع الجلسة الحية (Session Tracker) ---
  useEffect(() => {
    if (!user?.uid) return;
    const sessionStart = Date.now();
    const interval = setInterval(() => {
      const timeSpent = Math.floor((Date.now() - sessionStart) / 60000);
      if (timeSpent > 0 && timeSpent % 5 === 0) {
        updateDoc(doc(db, "students", user.uid), { hoursSpent: increment(0.08) });
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [user?.uid]);

  // --- 9. ميزة الالتزام اليومي (Streak Logic) ---
  const checkStreak = async (uid) => {
    const today = new Date().setHours(0, 0, 0, 0);
    const lastLogin = profile.lastLoginDate ? new Date(profile.lastLoginDate).setHours(0, 0, 0, 0) : null;
    const yesterday = today - 86400000;

    if (lastLogin === yesterday) {
      await updateDoc(doc(db, "students", uid), { streak: increment(1), lastLoginDate: today });
    } else if (lastLogin !== today) {
      await updateDoc(doc(db, "students", uid), { streak: 1, lastLoginDate: today });
    }
  };

  // --- 10. إرسال الأسئلة والملاحظات ---
  const sendQuestion = async (text) => {
    if (!text?.trim() || !user) return;
    await addDoc(collection(db, "students", user.uid, "questions"), {
      text: text.trim(), createdAt: Date.now(), status: "sent"
    });
  };

  const saveQuickNote = async (text) => {
    localStorage.setItem(`note_${user?.uid}`, text);
    if (user?.uid && text.length % 10 === 0) {
      await setDoc(doc(db, "students", user.uid, "private", "notes"), { content: text, lastUpdate: Date.now() }, { merge: true });
    }
  };

  const toggleDeepFocus = () => {
    if (!focusMode) {
      if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
      setFocusMode(true);
      startPomodoro(25 * 60);
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      setFocusMode(false);
      stopPomodoro();
    }
  };

  // --- 11) ميزة الـ Leaderboard المفلتر (Search Logic) ---
  const filteredLeaderboard = useMemo(() => {
    if (!searchTerm) return leaderboard;
    return leaderboard.filter(u => 
      u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [leaderboard, searchTerm]);

  // --- 12) ميزة الـ "Daily Rewards" (المطالبة بالهدية اليومية) ---
  const [canClaimDaily, setCanClaimDaily] = useState(false);
  useEffect(() => {
    const lastClaim = localStorage.getItem(`last_claim_${user?.uid}`);
    const today = new Date().toDateString();
    if (lastClaim !== today) setCanClaimDaily(true);
  }, [user?.uid]);

  const claimDailyReward = async () => {
    if (!canClaimDaily || !user) return;
    try {
      const userRef = doc(db, "students", user.uid);
      await updateDoc(userRef, { balance: increment(5) });
      localStorage.setItem(`last_claim_${user?.uid}`, new Date().toDateString());
      setCanClaimDaily(false);
      accumulateXP(30, "daily_reward_claim");
      alert("🎁 مبروك! حصلت على 5 USDT هدية يومية.");
    } catch (e) { console.error("Claim Error:", e); }
  };

  // --- 13) محرك تتبع المسار التعليمي (Roadmap Engine) ---
  const updatePathStatus = async (stepId, newStatus) => {
    setLearningPath(prev => prev.map(step => 
      step.id === stepId ? { ...step, status: newStatus } : step
    ));
    if (newStatus === "completed") {
      accumulateXP(200, "roadmap_step_complete");
      // تحديث في Firestore
      if(user) {
        await updateDoc(doc(db, "students", user.uid), {
          completedModules: arrayUnion(stepId),
          xp: increment(200)
        });
      }
    }
  };

  // --- 14) نظام معالجة الرصيد والشحن (Balance Logic) ---
  const handlePurchase = async (cost, itemName) => {
    if (profile.balance >= cost) {
      try {
        const userDoc = doc(db, "students", user.uid);
        await updateDoc(userDoc, {
          balance: increment(-cost),
          inventory: arrayUnion({ name: itemName, date: Date.now() })
        });
        await addDoc(collection(db, "students", user.uid, "transactions"), {
          type: "purchase",
          amount: cost,
          item: itemName,
          timestamp: Date.now()
        });
        accumulateXP(50, "purchase_bonus");
        alert("✅ تمت عملية الشراء بنجاح!");
      } catch (e) { console.error("Purchase Error:", e); }
    } else {
      alert("❌ عذراً، رصيدك الحالي لا يكفي. يرجى الشحن أولاً.");
      navigate("/activation");
    }
  };

  // --- 15) ميزة الـ "Mood Tracker" (تتبع الحالة النفسية) ---
  const updateMood = async (newMood) => {
    setMood(newMood);
    if (user?.uid) {
      await updateDoc(doc(db, "students", user.uid), {
        currentMood: newMood,
        lastMoodUpdate: Date.now()
      });
    }
  };

  // --- 16) ميزة تصدير تقرير الأداء (Performance Export) ---
  const exportProgressReport = () => {
    const reportData = {
      name: profile.displayName,
      totalXP: profile.xp,
      completedTasks: profile.tasksCompleted,
      studyHours: profile.hoursSpent,
      date: new Date().toLocaleDateString()
    };
    console.log("Generating Report PDF...", reportData);
    alert("📄 جاري تجهيز تقرير الأداء الشامل... سيتم التحميل فوراً.");
    window.print();
  };
useEffect(() => {
    let timeout;
    const resetTimer = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        console.log("User inactive for too long.");
        // هنا يمكنك إضافة navigate("/logout") مثلاً
      }, 1800000); 
    };

    resetTimer(); // تشغيل التايمر فور دخول الصفحة
    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer); // إضافة ضغطات المفاتيح لزيادة الدقة

    return () => {
      clearTimeout(timeout); // تنظيف التايمر عند مغادرة المكون
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
    };
  }, []);

  useEffect(() => {
    if (!db || !user) return; // التأكد من وجود الاتصال والمستخدم

    const qBroadcast = query(
      collection(db, "admin_broadcasts"),
      where("target", "in", ["all", "students"]),
      orderBy("timestamp", "desc"),
      limit(5)
    );

    const unsub = onSnapshot(qBroadcast, 
      (snapshot) => {
        setBroadcasts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, 
      (error) => {
        console.error("Broadcast Error:", error); // إضافة معالجة الأخطاء مهمة هنا
      }
    );

    return () => unsub();
  }, [user?.uid]); // التغيير بناءً على هوية المستخدم لضمان دقة البيانات

  // --- 19) ميزة الـ "Confetti" والإنجازات الجمالية ---
  const triggerCelebration = () => {
    const audio = new Audio('/sounds/achievement.mp3');
    audio.play().catch(e => console.log("Audio play blocked"));
    // هنا يمكن ربط مكتبة canvas-confetti
  };

  // --- 20) نظام إدارة الثيمات (Theme Engine) ---
  const toggleTheme = () => {
    const nextTheme = theme === "space-dark" ? "forest" : 
                       theme === "forest" ? "ocean" : "space-dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  // --- 21) ميزة البحث العالمي (Global Search) ---
  const performGlobalSearch = (val) => {
    setSearchTerm(val);
    if(val.length > 2) {
      console.log("Searching for:", val);
      // يمكن إضافة منطق البحث في الدروس هنا
    }
  };

  // --- 22) ميزة الـ "Back-to-Top" ---
  const [showBackToTop, setShowBackToTop] = useState(false);
  useEffect(() => {
    const checkScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", checkScroll);
    return () => window.removeEventListener("scroll", checkScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  // --- 23) ميزة الـ Marketplace (واجهة العرض) ---
  const MarketplaceSection = () => (
    <div className="marketplace-v2 glass-card">
      <div className="panel-header">
        <h3 className="panel-title-v3">سوق الأدوات (Store)</h3>
      </div>
      <div className="items-grid">
        {storeItems.map(item => (
          <div key={item.id} className="store-card">
            <span className="item-icon">{item.icon}</span>
            <div className="item-info">
              <span className="item-name">{item.name}</span>
              <button className="buy-btn" onClick={() => buyItem(item)}>
                {item.price} USDT
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // --- 24) ميزة الـ Roadmap (واجهة العرض) ---
  const RoadmapSection = () => (
    <div className="roadmap-v2 glass-card">
       <div className="panel-header">
         <h3 className="panel-title-v3">مسارك التعليمي</h3>
       </div>
       <div className="path-container">
         {learningPath.map((step) => (
           <div key={step.id} className={`path-step ${step.status}`}>
             <div className="step-circle">{step.status === 'completed' ? '✓' : step.id}</div>
             <div className="step-content">
               <h4>{step.title}</h4>
               <p>{step.xp} XP</p>
             </div>
           </div>
         ))}
       </div>
    </div>
  );

  // --- 25) ميزة الـ Stats Analytics (الرسم البياني) ---
  const PerformanceChart = () => (
    <div className="chart-placeholder-v2">
      {[40, 75, 90, 60, 85, 45, 70].map((h, i) => (
        <div key={i} className="bar-group">
          <div className="bar-visual" style={{ height: `${h}%` }}>
            <div className="bar-tooltip">{h}%</div>
          </div>
          <div className="bar-label">{['S','M','T','W','T','F','S'][i]}</div>
        </div>
      ))}
    </div>
  );
  if (!user) return <div className="loading">جاري تحميل المنصة...</div>;








  
  // --- بداية الـ JSX المعقد (The Massive Render Tree) ---
  return (
    <div className={`student-dash-root ${theme} ${focusMode ? "focus-active" : ""}`}>
      
      {/* 1) خلفية تفاعلية متحركة (Animated Background Layers) */}
      <div className="bg-animations">
        <div className="sphere sphere-1"></div>
        <div className="sphere sphere-2"></div>
        <div className="sphere sphere-3"></div>
        <div className="grid-overlay"></div>
      </div>

      {/* 2) وضع التركيز العميق (Deep Focus Overlay) */}
      <AnimatePresence>
        {focusMode && (
          <motion.div 
            className="focus-overlay-fixed"
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          >
            <div className="focus-content glass-heavy">
              <motion.div 
                initial={{ scale: 0.8 }} 
                animate={{ scale: 1 }} 
                className="focus-timer-container"
              >
                <h2 className="focus-title">وضع التركيز العميق نشط</h2>
                <div className="focus-timer-large pulse-animation">
                  {formatTime(pomodoro.seconds)}
                </div>
                <div className="focus-status-tag">تجنب الخروج من الصفحة لعدم خسارة الـ XP</div>
              </motion.div>

              <p className="focus-quote">"{dailyQuote}"</p>
              
              <div className="focus-actions">
                <button className="exit-focus-btn" onClick={toggleDeepFocus}>
                  إنهاء الجلسة والعودة للوحة التحكم
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3) الهيدر العلوي الذكي (Smart Dashboard Navigation) */}
      <nav className="dash-nav glass-nav">
        <div className="nav-profile-section">
          <div className="avatar-wrapper" onClick={() => navigate("/profile")}>
            <img src={renderAvatar()} alt="Student Profile" className="nav-avatar" />
            <motion.div 
              className="level-badge"
              initial={{ rotate: -20 }}
              animate={{ rotate: 0 }}
            >
              Lvl {profile.level}
            </motion.div>
          </div>
          <div className="nav-user-details">
            <span className="nav-name">{profile.displayName || "طالب العلم"}</span>
            <div className="xp-mini-container">
              <div className="xp-text-mini">{profile.xp % 1000} / 1000 XP</div>
              <div className="xp-bar-container">
                <motion.div 
                  className="xp-bar-fill" 
                  initial={{ width: 0 }}
                  animate={{ width: `${calculateLevelProgress()}%` }}
                  transition={{ duration: 1.5 }}
                ></motion.div>
              </div>
            </div>
          </div>
        </div>

        <div className="nav-actions-center">
          <div className="search-box-v2">
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              placeholder="ابحث عن دروس، مهام، أو زملاء..." 
              value={searchTerm}
              onChange={(e) => performGlobalSearch(e.target.value)}
            />
            {searchTerm && (
              <button className="clear-search" onClick={() => setSearchTerm("")}>✕</button>
            )}
          </div>
        </div>

        <div className="nav-controls-right">
          {canClaimDaily && (
            <motion.button 
              className="daily-gift-btn"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={claimDailyReward}
            >
              🎁 هدية!
            </motion.button>
          )}
          
          <div className="nav-stat-item wallet-trigger" onClick={() => navigate("/wallet")}>
            <span className="stat-icon">💰</span>
            <div className="stat-values">
              <span className="stat-amount">{profile.balance}</span>
              <span className="stat-unit">USDT</span>
            </div>
          </div>

          <button className="theme-toggle-btn" onClick={toggleTheme}>
            {theme === "space-dark" ? "🌙" : theme === "forest" ? "🌲" : "🌊"}
          </button>

          <div className="notification-wrapper">
            <button className="notification-bell">
              🔔 <span className="bell-dot">{notifications.length || broadcasts.length}</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="dashboard-content-layout">
        {/* 4) الشريط الجانبي (Advanced Sidebar) */}
        <aside className="dash-sidebar glass">
          <div className="sidebar-top">
             <div className="system-status">
                <span className={`status-indicator ${profile.isOnline ? 'online' : 'offline'}`}></span>
                {profile.isOnline ? 'متصل الآن' : 'غير متصل'}
             </div>
          </div>

          <div className="sidebar-menu">
            <button className="menu-item active" onClick={() => navigate("/dashboard")}>
              <span className="m-icon">🏠</span> الرئيسية
            </button>
            <button className="menu-item" onClick={() => navigate("/courses")}>
              <span className="m-icon">📚</span> دوراتي التدريبية
            </button>
            <button className="menu-item" onClick={() => navigate("/exams")}>
              <span className="m-icon">📝</span> الامتحانات
            </button>
            <button className="menu-item" onClick={() => navigate("/tasks")}>
              <span className="m-icon">🎯</span> المهام الإضافية
            </button>
            <button className="menu-item" onClick={() => navigate("/store")}>
              <span className="m-icon">🛒</span> المتجر الإلكتروني
            </button>
            <button className="menu-item highlight-gold" onClick={goToActivation}>
              <span className="m-icon">💳</span> شحن الرصيد
            </button>
          </div>
          
          <div className="sidebar-mood-tracker">
            <p>كيف حالك اليوم؟</p>
            <div className="mood-icons">
              <span onClick={() => updateMood('happy')} className={mood === 'happy' ? 'active' : ''}>😊</span>
              <span onClick={() => updateMood('neutral')} className={mood === 'neutral' ? 'active' : ''}>😐</span>
              <span onClick={() => updateMood('tired')} className={mood === 'tired' ? 'active' : ''}>😴</span>
            </div>
          </div>

          <div className="sidebar-footer">
            <div className="security-badge">
              <span className="shield-icon">🛡️</span>
              نظام الحماية نشط
            </div>
          </div>
        </aside>

        {/* 5) منطقة المحتوى الرئيسية (Main Viewport) */}
        <main className="main-viewport">
          <div className="content-grid-wrapper">
            
            {/* قسم الترحيب السريع */}
            <header className="welcome-banner glass-card">
               <div className="welcome-text">
                  <h1>مرحباً بك، {profile.displayName || "بطل المستقبل"}! 👋</h1>
                  <p>لديك {todos.filter(t=>!t.done).length} مهام متبقية لليوم. استعن بالله وابدأ!</p>
               </div>
               <div className="welcome-stats">
                  <div className="mini-stat">
                    <span className="label">ساعات الدراسة</span>
                    <span className="value">{profile.hoursSpent.toFixed(2)}h</span>
                  </div>
                  <div className="mini-stat">
                    <span className="label">المستوى الحالي</span>
                    <span className="value">{profile.level}</span>
                  </div>
               </div>
            </header>

            {/* صف الإحصائيات المتقدم (Advanced Stats Cards) */}
            <section className="stats-dashboard-row">
              <StatCard
                title="أيام الالتزام"
                value={profile.streak}
                icon="🔥"
                hint="استمر في التقدم!"
                trend={`+${profile.streak > 0 ? 1 : 0}`}
              />
              <StatCard
                title="نقاط الخبرة"
                value={profile.xp}
                icon="⭐"
                hint={`${1000 - (profile.xp % 1000)} XP للمستوى التالي`}
                trend="TOP"
              />
              <StatCard
                title="المهام المكتملة"
                value={profile.tasksCompleted}
                icon="✅"
                hint="من إجمالي المهام"
                trend="NEW"
              />
              <StatCard
                title="سجل المحفظة"
                value={`${profile.balance} $`}
                icon="💰"
                hint="الرصيد القابل للاستخدام"
                trend="LIVE"
              />
            </section>

            {/* 6) شبكة المحتوى المزدوجة (Main Dashboard Grid) */}
            <div className="dashboard-main-grid">
              
              {/* العمود الأيسر: المهام والتركيز */}
              <div className="grid-col-left">
                
                {/* نظام الطماطم (Pomodoro Widget) */}
                <section className="pomodoro-v3 glass-card">
                  <div className="panel-header">
                    <h3 className="panel-title-v3">⏳ مؤقت الإنجاز (Pomodoro)</h3>
                    <div className="pomodoro-modes">
                      <button className={pomodoro.seconds === 1500 ? "active" : ""} onClick={() => setPomodoro({running:false, seconds:1500, mode:"focus"})}>تركيز</button>
                      <button className={pomodoro.seconds === 300 ? "active" : ""} onClick={() => setPomodoro({running:false, seconds:300, mode:"break"})}>راحة</button>
                    </div>
                  </div>
                  <div className="timer-display-v2">
                    <svg className="timer-svg" viewBox="0 0 100 100">
                      <circle className="timer-bg" cx="50" cy="50" r="45" />
                      <motion.circle 
                        className="timer-progress" 
                        cx="50" cy="50" r="45" 
                        strokeDasharray="283"
                        initial={{ strokeDashoffset: 0 }}
                        animate={{ strokeDashoffset: 283 - (283 * pomodoro.seconds / (pomodoro.mode === "focus" ? 1500 : 300)) }}
                      />
                    </svg>
                    <div className="timer-text">{formatTime(pomodoro.seconds)}</div>
                  </div>
                  <div className="timer-controls">
                    {!pomodoro.running ? (
                      <button className="start-timer-btn" onClick={() => setPomodoro({...pomodoro, running: true})}>ابدأ الجلسة</button>
                    ) : (
                      <button className="pause-timer-btn" onClick={() => setPomodoro({...pomodoro, running: false})}>إيقاف مؤقت</button>
                    )}
                    <button className="reset-timer-btn" onClick={stopPomodoro}>إعادة تعيين</button>
                    <button className="deep-focus-trigger" onClick={toggleDeepFocus}>🚀 وضع التركيز العميق</button>
                  </div>
                </section>

                {/* لوحة المهام المتطورة (Advanced Tasks) */}
                <section className="tasks-panel-v3 glass-card">
                  <div className="panel-header">
                    <h3 className="panel-title-v3">🎯 قائمة المهام اليومية</h3>
                    <span className="task-count-badge">{todos.length} مهام</span>
                  </div>
                  <TodoPanel 
                    items={todos} 
                    onAdd={addTodo} 
                    onToggle={toggleTodo} 
                    onDelete={async (id) => {
                      await deleteDoc(doc(db, "students", user.uid, "todos", id));
                    }}
                  />
                  <div className="tasks-footer">
                    <p className="muted">أكمل المهام لربح XP إضافي ونقاط رصيد!</p>
                  </div>
                </section>

                {/* قسم المتجر المدمج (In-Dash Marketplace) */}
                <MarketplaceSection />
              </div>

              {/* العمود الأيمن: التفاعل والمجتمع */}
              <div className="grid-col-right">
                
                {/* قسم اسأل المعلم (Support Chat Interface) */}
                <section className="qa-panel-v3 glass-card">
                  <div className="panel-header">
                    <h3 className="panel-title-v3">💬 اسأل المعلم / الدعم</h3>
                    <span className="badge-live">Live</span>
                  </div>
                  <div className="qa-body">
                    <div className="qa-input-wrapper">
                      <textarea 
                        id="questionInput"
                        placeholder="اكتب استفسارك هنا وسيرد عليك المعلم..."
                        className="qa-textarea-v2"
                      />
                      <button 
                        className="send-qa-btn-v2"
                        onClick={() => {
                          const input = document.getElementById('questionInput');
                          sendQuestion(input.value);
                          input.value = "";
                        }}
                      >
                        إرسال الاستفسار
                      </button>
                    </div>
                    <div className="recent-questions-mini">
                      <p className="muted">آخر الأسئلة المرسلة تظهر في صفحة الدعم الفني.</p>
                    </div>
                  </div>
                </section>

                {/* لوحة المصدرين (Pro Leaderboard) */}
                <section className="leaderboard-panel-v3 glass-card">
                  <div className="panel-header">
                    <h3 className="panel-title-v3">👑 أوائل الأسبوع</h3>
                    <button className="view-all-link">مشاهدة الكل</button>
                  </div>
                  <div className="search-leaderboard-mini">
                    <input 
                      type="text" 
                      placeholder="ابحث عن صديق..." 
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <LeaderboardList items={filteredLeaderboard} currentUser={user?.uid} />
                </section>

                {/* الإشعارات والتنبيهات (Real-time Notifications) */}
                <section className="notifications-panel-v3 glass-card">
                  <div className="panel-header">
                    <h3 className="panel-title-v3">📢 آخر التنبيهات</h3>
                  </div>
                  <NotificationsList items={notifications} />
                  
                  {/* عرض البث الإداري (Admin Broadcasts) */}
                  <div className="admin-broadcasts-sub-section">
                    <h4 className="sub-title">إعلانات الإدارة</h4>
                    {broadcasts.map(msg => (
                      <div key={msg.id} className={`broadcast-mini-card ${msg.priority}`}>
                        <p>{msg.text}</p>
                        <small>{new Date(msg.timestamp).toLocaleDateString()}</small>
                      </div>
                    ))}
                  </div>
                </section>

                {/* قسم الأوسمة (Badges Showcase) */}
                <section className="badges-panel-v3 glass-card">
                  <div className="panel-header">
                    <h3 className="panel-title-v3">🏅 أوسمتي وإنجازاتي</h3>
                  </div>
                  <div className="badges-grid-v3">
                    {profile.badges.length > 0 ? profile.badges.map((badge, idx) => (
                      <motion.div 
                        key={idx} className="badge-item-v3"
                        whileHover={{ scale: 1.2, rotate: 10 }}
                      >
                        <div className="badge-icon-v3">🏆</div>
                        <span className="badge-name-v3">{badge}</span>
                      </motion.div>
                    )) : (
                      <div className="empty-state-v3">
                        <p>لا توجد أوسمة بعد. أكمل المسار التعليمي لربح أول وسام!</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>

            {/* 7) قسم تحليل الأداء والبيانات الضخمة (Analytics & Roadmap Row) */}
            <div className="analytics-roadmap-row">
               
               {/* تحليل الأداء البياني */}
               <section className="performance-section-v3 glass-card">
                  <div className="panel-header">
                    <h3 className="panel-title-v3">📈 تحليل الأداء التعليمي</h3>
                    <button className="export-report-btn" onClick={exportProgressReport}>تحميل تقرير PDF</button>
                  </div>
                  <div className="analytics-legend">
                    <span className="legend-item"><i className="dot-blue"></i> ساعات المذاكرة</span>
                    <span className="legend-item"><i className="dot-purple"></i> النقاط المكتسبة</span>
                  </div>
                  <PerformanceChart />
               </section>

               {/* خريطة الطريق التعليمية */}
               <section className="roadmap-section-v3 glass-card">
                  <RoadmapSection />
               </section>
            </div>

            {/* 8) المعاملات المالية الأخيرة (Transaction History) */}
            <section className="finance-log-section glass-card">
              <div className="panel-header">
                <h3 className="panel-title-v3">💳 سجل المحفظة الأخير</h3>
                <button onClick={goToActivation} className="top-up-btn-v2">شحن رصيد إضافي</button>
              </div>
              <div className="transactions-table-v2">
                <div className="table-header-v2">
                  <span>العملية</span>
                  <span>المبلغ</span>
                  <span>التاريخ</span>
                  <span>الحالة</span>
                </div>
                {transactions.map(t => (
                  <div key={t.id} className="table-row-v2">
                    <span className="t-name">{t.item || "شحن رصيد"}</span>
                    <span className={`t-amount ${t.type === 'purchase' ? 'red' : 'green'}`}>
                      {t.type === 'purchase' ? '-' : '+'}{t.amount} USDT
                    </span>
                    <span className="t-date">{new Date(t.timestamp).toLocaleDateString()}</span>
                    <span className="t-status">مكتمل ✅</span>
                  </div>
                ))}
                {transactions.length === 0 && <p className="empty-msg-v2">لا توجد عمليات مالية حالياً.</p>}
              </div>
            </section>

          </div>
   {/* 9) مكون الملاحظات الجانبي السريع (Quick Notes Floating) */}
<div className="quick-notes-overlay glass-heavy">
  <div className="notes-header">
    <div className="header-title">
      <Pin size={16} className="text-cyan-400" />
      <h4>ملاحظات سريعة</h4>
    </div>
    
    <button 
      onClick={async () => {
        if(window.confirm("هل تريد مسح جميع الملاحظات؟")) {
          // 1. مسح من التخزين المحلي
          localStorage.removeItem(`note_${user?.uid}`);
          // 2. تفريغ الحقل باستخدام المرجع (React Way)
          if(notesRef.current) notesRef.current.value = "";
          // 3. تحديث السحابة بنص فارغ
          await saveQuickNote("");
        }
      }}
      className="delete-note-btn"
      title="مسح الكل"
    >
      <Trash2 size={16} />
    </button>
  </div>
  
  <textarea 
    ref={notesRef} // ربط المرجع هنا
    defaultValue={localStorage.getItem(`note_${user?.uid}`) || ""} 
    onBlur={(e) => saveQuickNote(e.target.value)} // الحفظ عند الخروج من الحقل فقط لحماية الـ API
    placeholder="اكتب فكرة سريعة أو تذكير..."
    className="notes-textarea"
  />
  
  <div className="notes-footer">
    <div className="sync-status">
      <div className="pulse-dot"></div>
      <small>يتم المزامنة مع السحابة</small>
    </div>
  </div>
</div>
          {/* زر العودة للأعلى المطور */}
          <AnimatePresence>
            {showBackToTop && (
              <motion.button 
                className="back-to-top-v2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                onClick={scrollToTop}
              >
                ↑
              </motion.button>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* 10) الفوتر الاحترافي الشامل (The Professional Dashboard Footer) */}
      <footer className="student-pro-footer glass">
        <div className="footer-top-row">
          <div className="footer-brand">
            <h2 className="brand-logo-v3">STUDENT<span>PRO</span> OS</h2>
            <p>منصة التعلم الذكي المتكاملة لتطوير مهارات المستقبل.</p>
          </div>
          <div className="footer-links-grid">
            <div className="footer-col">
              <h4>المنصة</h4>
              <span>عن النظام</span>
              <span>تحديثات الإصدار</span>
              <span>خارطة الطريق</span>
            </div>
            <div className="footer-col">
              <h4>الدعم</h4>
              <span>مركز المساعدة</span>
              <span>الإبلاغ عن خلل</span>
              <span>تواصل معنا</span>
            </div>
            <div className="footer-col">
              <h4>قانوني</h4>
              <span>شروط الاستخدام</span>
              <span>سياسة الخصوصية</span>
              <span>حقوق الملكية</span>
            </div>
          </div>
        </div>
        <hr className="footer-divider" />
        <div className="footer-bottom-row">
          <div className="system-info-v3">
            <span className="v-tag">VERSION 3.5.0-STABLE</span>
            <span className="build-tag">BUILD_2024_PRO</span>
            <span className="latency-tag">Latency: 24ms</span>
          </div>
          <div className="copyright-text">
            © {new Date().getFullYear()} جميع الحقوق محفوظة لـ MaFa tac.
          </div>
          <div className="social-mini-links">
            <span>🌐</span> <span>🔗</span> <span>📧</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default StudentDash;













