

// StudentDash.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { 
  getAuth, onAuthStateChanged 
} from "firebase/auth";
import { 
  getFirestore, collection, doc, getDocs, query, where, orderBy, onSnapshot, updateDoc, addDoc, deleteDoc, setDoc, increment
} from "firebase/firestore";
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

// تأسيس Firebase عند الاستدعاء
// افترض أن لديك firebaseConfig وتقوم بتهيئة Firebase خارج هذا الملف.
// إذا لم يكن هناك، استخدم import { firebaseApp } from "./firebase"; ثم استخدم:
// const db = getFirestore(firebaseApp);
import { firebaseApp } from "./firebase"; // تأكد من وجود هذا الملف في مشروعك ويصدر firebaseApp

const StudentDash = () => {
  // التهيئة العامة
  const navigate = useNavigate();
  const auth = useMemo(() => getAuth(firebaseApp), []);
  const db = useMemo(() => getFirestore(firebaseApp), []);
  const storage = useMemo(() => getStorage(firebaseApp), []);
  const userRef = useRef(null);

  // الحالة العامة للطالب
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({
    displayName: "",
    email: "",
    avatarUrl: "",
    xp: 0,
    level: 1,
    streak: 0,
    balance: 0,
    badges: [],
    tasksCompleted: 0,
    hoursSpent: 0,
    coursesCompleted: 0,
  });

  // حالات UI/UX
  const [theme, setTheme] = useState("space-dark"); // "space-dark" أو "midnight-blue"
  const [quotes, setQuotes] = useState([]);
  const [dailyQuote, setDailyQuote] = useState("");
  const [todos, setTodos] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [adminBroadcasts, setAdminBroadcasts] = useState([]);
  const [pomodoro, setPomodoro] = useState({ running: false, seconds: 1500, mode: "focus" });
  const [avatars, setAvatars] = useState({}); // placeholder لوثائق avatar مؤثرة
  const [notifications, setNotifications] = useState([]);
  const [focusMode, setFocusMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // تعيين التغييرات في التخطيط
  useEffect(() => {
    // ربط المصادقة والتأكد من تسجيل الدخول
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        userRef.current = u;
        // جلب بيانات المستخدم
        subscribeUserProfile(u.uid);
        // تسجيل المتابعة الأخرى
        subscribeLiveData(u.uid);
      } else {
        // إذا لم يكن مسجلاً، تحويل للمسار تسجيل الدخول
        navigate("/login", { replace: true });
      }
    });
    return () => unsubscribe();
  // eslint-disable-next-line
  }, []);

  // دالة جلب الملف الشخصي
  const subscribeUserProfile = async (uid) => {
    try {
      // ملف الطالب في Firestore
      const userDoc = doc(db, "students", uid);
      // تطبيق onSnapshot لمراقبة التحديثات
      onSnapshot(userDoc, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setProfile((p) => ({
            ...p,
            displayName: data.displayName || "",
            email: data.email || "",
            avatarUrl: data.avatarUrl || "",
            xp: data.xp ?? p.xp,
            level: data.level ?? p.level,
            streak: data.streak ?? p.streak,
            balance: data.balance ?? p.balance,
            badges: data.badges ?? p.badges,
            tasksCompleted: data.tasksCompleted ?? p.tasksCompleted,
            hoursSpent: data.hoursSpent ?? p.hoursSpent,
            coursesCompleted: data.coursesCompleted ?? p.coursesCompleted,
          }));
        }
      });

      // استعادة الصورة من Storage إذا لزم الأمر
      // يمكن أن تضيف آلية تحميل Avatar من Firestore إلى profile.avatarUrl
    } catch (e) {
      console.error("Error loading user profile:", e);
    }
  };

  // دالة اشتراك البيانات الحيّة
  const subscribeLiveData = (uid) => {
    // 1) Leaderboard (Top 5 by xp)
    const qLeaderboard = query(collection(db, "students"), orderBy("xp", "desc"), limit5);
  };

  // helper: تعريف limit5
  const limit5 = 5;

  // 2) Daily Quotes من مصفوفة ذكية نمطية
  useEffect(() => {
    // افترض أن لديك collection dailyQuotes أو مصفوفة مخزنة في Firestore أو في الكود
    // هنا نعطي fallback محلي
    const localQuotes = [
      "ابدأ اليوم بخطوة صغيرة نحو هدفك.",
      "التعلم المستمر يفتح أبواباً لا ترى.",
      "التحدي اليوم يجهزك لنجاح الغد.",
      "افعل الشيء الصحيح حتى لو كان صعباً.",
      "كل دقيقة تركيز تقربك من الإتقان."
    ];
    setQuotes(localQuotes);
    // اختيارQuote تلقائياً عند الدخول
    const idx = Math.floor(Math.random() * localQuotes.length);
    setDailyQuote(localQuotes[idx]);
  }, []);

  // 3) ToDo List مع حفظ في Firestore وXP عند الإكمال
  const addTodo = async (text) => {
    if (!text?.trim()) return;
    const newItem = { text: text.trim(), done: false, createdAt: Date.now(), xpReward: 10 };
    try {
      const colRef = collection(db, "students", user?.uid ?? "guest", "todos");
      await addDoc(colRef, newItem);
      // سيظهر عبر onSnapshot إذا كان تم الاشتراك
    } catch (e) {
      console.error("Add todo error:", e);
    }
  };

  const toggleTodo = async (docId, current) => {
    try {
      const docRef = doc(db, "students", user?.uid ?? "guest", "todos", docId);
      await updateDoc(docRef, { done: !current });
      // إضافة XP عند الإكمال
      if (!current) {
        accumulateXP(10, "todo_complete");
      }
    } catch (e) {
      console.error("Toggle todo error:", e);
    }
  };

  // 4) XP Logic محمي من التكرار (مثال بسيط)
  const lastActionXP = useRef({ type: null, timestamp: 0 });
  const accumulateXP = (amount, type) => {
    const now = Date.now();
    // منع التكرار لنفس العملية خلال 20 ثانية كحد أدنى
    if (lastActionXP.current.type === type && now - lastActionXP.current.timestamp < 20000) {
      return;
    }
    lastActionXP.current = { type, timestamp: now };
    // تحديث XP على Firestore
    if (user?.uid) {
      const userDoc = doc(db, "students", user.uid);
      // تحديث XP بشكل آمن
      // نستخدم updateDoc مع الحصول على current XP ثم زيادة
      // هنا نقرأ من قبل ثم نحدث
      await updateDoc(userDoc, { xp: increment(amount) });
      
  // 5) رفع صورة الأفاتار إلى Storage وتحديث Firestore
  const uploadAvatar = async (file) => {
    if (!file || !user?.uid) return;
    const storageRefUser = storageRef(storage, `avatars/${user.uid}_${Date.now()}`);
    const uploadTask = uploadBytesResumable(storageRefUser, file);
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        // يمكن إضافة progress indication
      },
      (error) => console.error("Avatar upload error:", error),
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((url) => {
          // حفظ url في Firestore
          updateDoc(doc(db, "students", user.uid), { avatarUrl: url });
          setProfile((p) => ({ ...p, avatarUrl: url }));
        });
      }
    );
  };

  // 6) محادثة: إرسال سؤال للمعلم
  const sendQuestion = async (text) => {
    if (!text?.trim()) return;
    try {
      const quesRef = collection(db, "students", user?.uid ?? "guest", "questions");
      await addDoc(quesRef, {
        text: text.trim(),
        createdAt: Date.now(),
        status: "sent",
        answered: false
      });
      // إشعار داخل التطبيق (يمكن ربط Push)
    } catch (e) {
      console.error("Send question error:", e);
    }
  };

  // 7) الإشعارات الحية
  useEffect(() => {
    if (!user?.uid) return;
    const notiCol = collection(db, "students", user.uid, "notifications");
    const unsubscribe = onSnapshot(notiCol, (snap) => {
      const items = [];
      snap.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
      setNotifications(items);
    });
    return () => unsubscribe();
  // eslint-disable-next-line
  }, [user?.uid]);

  // 8) لوحة الأوائل (Leaderboard) - top 5
  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "students"), orderBy("xp", "desc"));
    const unsub = onSnapshot(q, (sn) => {
      const list = [];
      sn.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setLeaderboard(list.slice(0, 5));
    });
    return () => unsub();
  // eslint-disable-next-line
  }, [db]);

  // 9) المحفظة والتوجيه إلى ActivationPage.jsx عند الشحن
  const goToActivation = () => {
    navigate("/activation");
  };

  // 10) Deep Focus – شاشة كاملة مع منع المشتتات
  const DeepFocusOverlay = () => (
    <AnimatePresence>
      {focusMode && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
            zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center",
            backdropFilter: "blur(2px)"
          }}
        >
          <div className="deep-focus-panel">
            <h3>Deep Focus Mode</h3>
            <p>Preserve focus. Time left: {formatTime(pomodoro.seconds)}</p>
            <button onClick={() => setFocusMode(false)}>Exit Focus</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // 11) Pomodoro timer
  useEffect(() => {
    if (!pomodoro.running) return;
    const t = setInterval(() => {
      setPomodoro((p) => {
        if (p.seconds <= 1) {
          clearInterval(t);
          // صدور صوت تنبيه أو إشعار
          return { ...p, running: false, seconds: 0 };
        }
        return { ...p, seconds: p.seconds - 1 };
      });
    }, 1000);
    return () => clearInterval(t);
  }, [pomodoro.running]);

  const startPomodoro = (focusSeconds = 25 * 60) => {
    setPomodoro({ running: true, seconds: focusSeconds, mode: "focus" });
  };
  const stopPomodoro = () => setPomodoro((p) => ({ ...p, running: false }));

  // 12).theme toggle
  const toggleTheme = () => {
    setTheme((t) => (t === "space-dark" ? "midnight-blue" : "space-dark"));
  };

  // 13) البحث داخل الدورات والمهام
  const filteredLeaderboard = useMemo(() => {
    if (!searchTerm) return leaderboard;
    const s = searchTerm.toLowerCase();
    return leaderboard.filter((r) => (r.displayName || "").toLowerCase().includes(s) || (r.email || "").toLowerCase().includes(s));
  }, [leaderboard, searchTerm]);

  // 14) سجل العمليات المالية (أحدث عمليات الشحن)
  const [transactions, setTransactions] = useState([]);
  useEffect(() => {
    if (!user?.uid) return;
    const tCol = collection(db, "students", user.uid, "transactions");
    const unsub = onSnapshot(tCol, (snap) => {
      const items = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
      setTransactions(items);
    });
    return () => unsub();
  // eslint-disable-next-line
  }, [user?.uid]);

  // 15) التحويل إلى ActivationPage عند الضغط "شحن"
  // 16) رسوم/تنبيهات انخفاض الرصيد عند التحقق قبل الشراء (مثال)
  const chargeBalance = async (amount) => {
    if (profile.balance >= amount) {
      // تنفيذ شراء/شحن
      await accumulateXP(5, "charge"); // كتمثيل
    } else {
      // إشعار انخفاض الرصيد
      alert("الرصيد غير كافٍ لشراء الكورس. الرجاء الشحن.");
    }
  };

  // 17) ملف avatar: استخدم DiceBear افتراضي إذا لم يوجد avatarUrl
  const renderAvatar = () => {
    const url = profile.avatarUrl;
    if (url) return url;
    // DiceBear neutral
    // يمكنك توليد باستخدام seed من user.id أو displayName
    const seed = user?.uid ?? "default";
    return `https://api.dicebear.com/7.x/identicon/svg?seed=${seed}`;
  };

  // helper: تنسيق الوقت
  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  // 18) سلة الأوسمة/Badges
  const earnedBadges = profile.badges ?? [];

  // 19) واجهات المكونات الفرعية كإدماج داخلي
  // قد تكون هناك مكونات خارجية. هنا كود داخلي بسيط لواجهة متكاملة
  return (
    <div className={`student-dash ${theme}`} style={{ minHeight: "100vh" }}>
      {/* 19-1: رأس الصفحة مع معلومات الطالب وتبديل الثيم */}
      <header className="sd-header glass">
        <div className="left">
          <img src={renderAvatar()} alt="avatar" className="avatar" />
          <div className="user-info">
            <div className="name">{profile.displayName || user?.email?.split("@")[0] || "طالب"}</div>
            <div className="subtitle">حالة الاتصال: <span className="online">نشط الآن</span></div>
          </div>
        </div>
        <div className="center">
          <input
            className="search"
            placeholder="ابحث في الكورسات والمهام..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="right">
          <button className="icon-btn" onClick={toggleTheme} title="تغيير الثيم">
            🌗
          </button>
          <button className="icon-btn" onClick={() => setFocusMode((f) => !f)} title="Deep Focus">
            ⏱
          </button>
          <button className="cta" onClick={() => navigate("/profile")}>الملف الشخصي</button>
        </div>
      </header>

      {/* 19-2: جسم الصفحة مقسم إلى شبكة 3-Column تقليدية مع Glassmorphism و3D */}
      <main className="sd-grid">
        {/* العمود 1: Streak، Level، XP، المحفظة، Pomodoro، Avatar */}
        <section className="card glass panel" aria-label="Overview">
          <div className="panel-title">النظرة الشاملة</div>

          <div className="stat-grid">
            <StatCard title="Streak" value={profile?.streak ?? 0} hint="أيام متتالية" />
            <StatCard title="XP" value={profile?.xp ?? 0} hint="نقاط الخبرة" />
            <StatCard title="المستوى" value={profile?.level ?? 1} hint="Level based on XP" />
          </div>

          <div className="wallet-row">
            <div className="wallet-label">المحفظة الذكية</div>
            <div className="wallet-balance">{profile.balance ?? 0} USDT</div>
            <button className="btn" onClick={goToActivation}>شحن</button>
          </div>

          <div className="avatar-row">
            <img src={renderAvatar()} alt="avatar-big" className="avatar-large" />
            <div className="avatar-actions">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => uploadAvatar(e.target.files[0])}
              />
              <span className="hint">يمكنك رفع صورة شخصية لعرضها كأفاتار.</span>
            </div>
          </div>

          <div className="pomodoro">
            <div className="pom-title">Pomodoro</div>
            <div className="pom-ctrls">
              <button onClick={() => startPomodoro()} className="btn">Start 25:00</button>
              <button onClick={stopPomodoro} className="btn secondary">Stop</button>
              <div className="timer">{formatTime(pomodoro.seconds)}</div>
            </div>
          </div>

          <DeepFocusOverlay />
        </section>

        {/* العمود 2: To-Do، Daily Quotes، Messages، Notifications */}
        <section className="card glass panel" aria-label="ToDo & Quotes">
          <div className="panel-title">مهام اليوم (To-Do)</div>
          <TodoPanel onAdd={addTodo} items={todos} onToggle={toggleTodo} />

          <div className="panel-divider" />

          <div className="panel-title">اقتباسات اليوم</div>
          <div className="quote-block">
            <em>“{dailyQuote}”</em>
          </div>

          <div className="panel-divider" />
          <div className="panel-title">الإشعارات</div>
          <NotificationsList items={notifications} />
        </section>

        {/* العمود 3: Leaderboard، Messages للمعلم، Tasks search & Badges & Focus */}
        <section className="card glass panel" aria-label="Leaderboard & Badges">
          <div className="panel-title">قائمة المتصدرين (Top 5)</div>
          <LeaderboardList items={filteredLeaderboard} />

          <div className="panel-divider" />
          <div className="panel-title">الأوسمة</div>
          <div className="badges">
            {earnedBadges.length === 0 ? (
              <span className="muted">لا توجد أوسمة حتى الآن.</span>
            ) : (
              earnedBadges.map((b, idx) => (
                <span key={idx} className="badge">{b}</span>
              ))
            )}
          </div>

          <div className="panel-divider" />
          <div className="panel-title">النشاطات</div>
          <div className="stats-chart">
            {/* CSS-based simple chart placeholder */}
            <div className="bar-row">
              <div className="bar" style={{ width: `${Math.min(100, profile.hoursSpent % 100)}%` }} />
              <span className="bar-label">ساعات الدراسة الأسبوعية</span>
            </div>
          </div>
        </section>
      </main>

      {/* 20) صندوق الاقتراحات والملاحظات للإدارة */}
      <FooterSuggestion onSubmit={(text) => {
        // إرسال اقتراح إلى الإدارة: تخزين في Firestore
        if (!text
                  {/* 20) صندوق الاقتراحات والملاحظات للإدارة */}  
      <FooterSuggestion onSubmit={(text) => {  
        // إرسال اقتراح إلى الإدارة: تخزين في Firestore  
        if (!text?.trim()) return;  
        if (!user?.uid) return;  
        (async () => {  
          try {  
            const suggCol = collection(db, "admin", "suggestions");  
            await addDoc(suggCol, {  
              userId: user.uid,  
              text: text.trim(),  
              createdAt: Date.now(),  
              status: "pending",  
            });  
            // ردة فعل بسيطة  
            alert("تم إرسال الاقتراح بنجاح للإدارة.");  
          } catch (e) {  
            console.error("Submit suggestion error:", e);  
          }  
        })();  
      }} />  

      {/* 21) التحليل الإحصائي: رسم بسيط باستخدام CSS-based (مثال أسبوعي) */}  
      <section className="card glass panel perf-panel" aria-label="Performance">  
        <div className="panel-title">تحليل الأداء (أسبوعي)</div>  
        <div className="perf-canvas">  
          <div className="line" />  
          <div className="line" style={{ height: "60%" }} />  
          <div className="line" style={{ height: "80%" }} />  
          <div className="line" style={{ height: `${Math.min(100, (profile.hoursSpent % 100))}%` }} />  
        </div>  
        <div className="perf-caption">ساعات: {profile.hoursSpent} | الدروس: {profile.coursesCompleted}</div>  
      </section>  

      {/* 22) حالة الاتصال: "نشط الآن" مع نبض متوهج */}  
      <section className="card glass panel status-panel" aria-label="Connection Status">  
        <div className="status-row">  
          <span className={`status-dot ${profile?.isOnline ? "online" : ""}`} />  
          <span className="status-label">{profile?.isOnline ? "نشط الآن" : "غير متصل"}</span>  
        </div>  
      </section>  

      {/* 23) الحماية: Redirect إذا لم يكن الطالب مسجلاً (موجود كخيار في useEffect) */}  
      {/* في هذا النموذج، إذا لم يوجد user ستتم إعادة التوجيه في onAuthStateChanged */}  

      {/* 24) المحفزات: شاشة "قوة الطالب" تقييماً حتى 100% وفق حلول الكويزات (اختيار بسيط) */}  
      <section className="card glass panel power-panel" aria-label="Power Meter">  
        <div className="panel-title">مؤشر القوة</div>  
        <div className="power-meter">  
         <div className="meter" style={{ width: `${Math.min(100, (profile.xpPercent ?? 0))}%` }} /> 
          <span className="meter-label">{Math.min(100, (profile.xpPercent ?? 0))}% القوة</span>  
        </div>  
      </section>  

      {/* 25) المفكرة السريعة: ملاحظات مؤقتة محفوظة في LocalStorage */}  
      <section className="card glass panel quick-notes" aria-label="Quick Notes">  
        <div className="panel-title">المفكرة السريعة (Local)</div>  
        <QuickNotesStorage />  
      </section>  

      {/* 26) تنبيه انخفاض الرصيد عند الشراء - يظهر داخل واجهة المحفظة تلقائياً عند الحاجة */}  

      {/* 27) مشاركة الإنجاز: زر وهمي لتجهيز صورة للإنجازات */}  
      <section className="card glass panel share-panel" aria-label="Share Progress">  
        <div className="panel-title">مشاركة الإنجاز</div>  
        <button className="cta" onClick={() => alert("تم تجهيز صورة الإنجاز للمشاركة.")}>  
          تجهيز صورة الإنجاز للمشاركة  
        </button>  
      </section>  

      {/* 28) التحميلات: عرض الملفات التي قام الطالب بتحميلها سابقاً */}  
      <section className="card glass panel
        أكيد. سأتابع من حيث انتهينا في النص البرمجي، وأكمل بناء ملف StudentDash.jsx مع بقية الأقسام والربط مع Firestore/Storage، ثم أرفق لك ملف CSS StudentDash.css لاحقاً بحسب طلبك. سأستخدم أسلوباً منظمًا مع مكوّنات فرعية داخل الملف لضمان الاستمرار والتوسع.

ملاحظة سريعة قبل الاستكمال:
- سأفترض وجود الأجزاء المخبأة مثل QuickNotesStorage وFooterSuggestion وNotificationsList وTodoPanel وLeaderboardList والأنماط الأساسية. إذا لم تكن هذه المكوّنات موجودة فعلياً في مشروعك، يمكنني إضافتها كدوال داخل الملف بنفس الأسلوب.
- الكود سيستمر من حيث توقفت عند "Section 28) التحميلات ..." وسيغلق الهيكل الرئيسي.

استكمال StudentDash.jsx (استمرار من مكان التوقف):

```jsx
      {/* 28) التحميلات: عرض الملفات التي قام الطالب بتحميلها سابقاً */}
      <section className="card glass panel" aria-label="Uploads">
        <div className="panel-title">التحميلات</div>
        <UploadsPanel uid={user?.uid} />
      </section>

      {/* 29) الدعم الفني المباشر: زر يفتح نافذة تواصل سريعة */}
      <SupportWidget />

      {/* 30) حالة النظام والتهيئة العامة: مؤشر اتصال ونظام حماية بسيط */}
      <section className="card glass panel system-status" aria-label="System Status">
        <div className="panel-title">حالة النظام</div>
        <div className="system-row">
          <span className={`status-dot online`} /> <span>النظام متصل بالمخدمات الحيوية</span>
        </div>
        <div className="system-row">
          <span className="muted">Theme:</span> <strong>{theme}</strong>
        </div>
        <div className="system-row">
          <span className="muted">المستخدم:</span> <span>{profile.displayName || user?.email?.split("@")[0]}</span>
        </div>
      </section>

      {/* نهاية صندوق الاقتراحات والاقسام - يمكن إضافة أقسام إضافية لاحقاً */}

      {/* النوافذ النشطة: مثال على أداة Notification Toastية بسيطة (إذا أردت) */}
      <AnimatePresence>
        {notifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="toast"
          >
            {notifications[0]?.text || "إشعار جديد"}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

// مكوّنات داخلية (إعدادات بسيطة داخل الملف لضمان التكامل)
const StatCard = ({ title, value, hint }) => (
  <div className="stat-card">
    <div className="stat-value">{value}</div>
    <div className="stat-title">{title}</div>
    <div className="stat-hint">{hint}</div>
  </div>
);

const TodoPanel = ({ onAdd, items = [], onToggle }) => {
  const [text, setText] = useState("");
  return (
    <div className="todo-panel">
      <div className="todo-inputs">
        <input
          placeholder="إضافة مهمة جديدة..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onAdd(text);
              setText("");
            }
          }}
        />
        <button className="btn" onClick={() => { onAdd(text); setText(""); }}>إضافة</button>
      </div>
      <div className="todo-list">
        {items.map((t, idx) => (
          <div key={idx} className="todo-item">
            <input
              type="checkbox"
              checked={t.done}
              onChange={() => onToggle(t.id, t.done)}
            />
            <span className={t.done ? "done" : ""}>{t.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const NotificationsList = ({ items = [] }) => (
  <div className="notifications">
    {items.length === 0 ? (
      <div className="muted">لا توجد إشعارات حالياً.</div>
    ) : (
      items.map((
     سأكمل من المكان الذي توقفت فيه في الكود السابق، مع الحفاظ على الأسلوب والهيكل الداخلي نفسه. سأستكمل مكوّنات الإشعارات والتحميلات والدعم الفني وبعض الأقسام المتبقية، ثم أنهي ملف StudentDash.jsx بشكل متكامل.

استمرار StudentDash.jsx (من الجزء الذي بدأته في النهاية السابقة):

```jsx
      {/* 29) الدعم الفني المباشر: زر يفتح نافذة تواصل سريعة */}
      <SupportWidget />

      {/* 30) حالة النظام والتهيئة العامة: مؤشر اتصال ونظام حماية بسيط */}
      <section className="card glass panel system-status" aria-label="System Status">
        <div className="panel-title">حالة النظام</div>
        <div className="system-row">
          <span className={`status-dot online`} /> <span>النظام متصل بالمخدمات الحيوية</span>
        </div>
        <div className="system-row">
          <span className="muted">Theme:</span> <strong>{theme}</strong>
        </div>
        <div className="system-row">
          <span className="muted">المستخدم:</span> <span>{profile.displayName || user?.email?.split("@")[0]}</span>
        </div>
      </section>

      {/* نهاية صندوق الاقتراحات والاقسام - يمكن إضافة أقسام إضافية لاحقاً */}

      {/* النوافذ النشطة: مثال على أداة Notification Toastية بسيطة (إذا أردت) */}
      <AnimatePresence>
        {notifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="toast"
          >
            {notifications[0]?.text || "إشعار جديد"}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

// مكوّنات داخلية (إعدادات بسيطة داخل الملف لضمان التكامل)
const StatCard = ({ title, value, hint }) => (
  <div className="stat-card">
    <div className="stat-value">{value}</div>
    <div className="stat-title">{title}</div>
    <div className="stat-hint">{hint}</div>
  </div>
);

const TodoPanel = ({ onAdd, items = [], onToggle }) => {
  const [text, setText] = useState("");
  return (
    <div className="todo-panel">
      <div className="todo-inputs">
        <input
          placeholder="إضافة مهمة جديدة..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onAdd(text);
              setText("");
            }
          }}
        />
        <button className="btn" onClick={() => { onAdd(text); setText(""); }}>إضافة</button>
      </div>
      <div className="todo-list">
        {items.map((t) => (
          <div key={t.id} className="todo-item">
            <input
              type="checkbox"
              checked={t.done}
              onChange={() => onToggle(t.id, t.done)}
            />
            <span className={t.done ? "done" : ""}>{t.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const NotificationsList = ({ items = [] }) => (
  <div className="notifications">
    {items.length === 0 ? (
      <div className="muted">لا توجد إشعارات حالياً.</div>
    ) : (
      items.map((n) => (
        <div key={n.id} className="notification-item">
          <span className="badge-dot" /> {n.text}
        </div>
      ))
    )}
  </div>
);

const LeaderboardList = ({ items = [] }) => (
  <div className="leaderboard">
    {items.map((u, idx) => (
      <div key={u.id} className={`leader-item ${idx < 3 ? "podium" : ""}`}>
        <span className="rank">{idx + 1}</span>
        <img className="avatar-sm" src={u.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${u.id}`} alt="avatar" />
        <span className="name">{u.displayName || u.email || "طالب" 


  أكيد. سأكمل من مكان توقفت عند قسم LeaderboardList وما تبعه حتى نهاية ملف StudentDash.jsx، مع الحفاظ على التنسيق ككود جاهز للنسخ. سأعيد جزءاً من الكود السابق كمقدمة ثم أكمل البناء حتى النهاية، مع مكوّنات داخلية إضافية وروابط Firestore/Storage كما طلبت.

مهمة: تقديم ملف React كامل في سطر واحد منسّق، جاهز للرفع، مع ملاحظات كافية لربط Firestore وStorage. الكود التالي يعتمد على وجود الاستيرادات والتهيئة الأساسية الموجودة في الأقسام السابقة (Firebase App، Firestore، Storage، Framer Motion، React Router). إذا احتجت لأي تعديلات لمسارات المسارات (ActivationPage، Profile)، يمكن تعديلها بسهولة.

StudentDash.jsx (إكمال من حيث توقفت وإلى النهاية)

```jsx
// تابع من حيث توقفت: LeaderboardList و بقية الأقسام
const LeaderboardList = ({ items = [] }) => (
  <div className="leaderboard">
    {items.map((u, idx) => (
      <div key={u.id} className={`leader-item ${idx < 3 ? "podium" : ""}`}>
        <span className="rank">{idx + 1}</span>
        <img className="avatar-sm" src={u.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${u.id}`} alt="avatar" />
        <span className="name">{u.displayName || u.email || "طالب"}</span>
        <span className="xp">{u.xp ?? 0} XP</span>
      </div>
    ))}
  </div>
);

const UploadsPanel = ({ uid }) => {
  // عرض قائمة التحميلات المخزنة عند الطالب من Firestore Storage /downloads
  const [files, setFiles] = useState([]);
  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(collection(doc(db, "students", uid), "uploads"), (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setFiles(list);
    });
    return () => unsub && unsub();
  // eslint-disable-next-line
  }, [uid]);
  return (
    <div className="uploads-panel">
      {files.length === 0 ? (
        <div className="muted">لا توجد ملفات محملة حتى الآن.</div>
      ) : (
        files.map((f) => (
          <div key={f.id} className="upload-item">
            <a href={f.url} target="_blank" rel="noreferrer">{f.name}</a>
            <span className="muted small">{new Date(f.createdAt).toLocaleDateString()}</span>
          </div>
        ))
      )}
    </div>
  );
};

const SupportWidget = () => {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  return (
    <div className="support-widget card glass panel" aria-label="Support">
      <div className="panel-title">دعم فني مباشر</div>
      <button className="btn" onClick={() => setOpen((o) => !o)}>
        {open ? "إغلاق" : "فتح"} نافذة الدعم
      </button>
      {open && (
        <div className="support-body">
          <textarea
            placeholder="اكتب مشكلتك هنا..."
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
          />
          <button
            className="btn"
            onClick={() => {
              // إرسال رسالة دعم افتراضية
              if (!msg.trim()) return;
              alert("تم إرسال تذكرة الدعم!");
              setMsg("");
              setOpen(false);
            }}
          >
            إرسال
          </button>
        </div>
      )}
    </div>
  );
};

// مۇعّدل: FooterSuggestion - صندوق الاقتراحات
const FooterSuggestion = ({ onSubmit }) => {
  const [text, setText] = useState("");
  return (
    <section className="card glass panel suggestion-panel" aria-label="Suggestions">
      <div className="panel-title">اقتراحات للإدارة</div>
      <div className="suggestion-inputs">
        <input
          placeholder="اكتب اقتراحك..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key
                سأكمل لك الملف StudentDash.jsx حتى النهاية من where توقفت. سأحرص على أن تكون جميع المكوّنات والربط مع Firestore/Storage مكتملة، مع الحفاظ على بنية داخلية قابلة للتوسعة. في هذا الجزء سأكفل استكمال الأقسام المتبقية والتعريفات الداخلية ونهاية الكود مع إغلاق جميع الأقسام والمكوّنات.

StudentDash.jsx (إكمال من مكان توقفت عند FooterSuggestion ومن ثم الاستمرار حتى النهاية)

```jsx
      {/* 30) الاقتراحات - FooterSuggestion ينتهي بنقطة الدخول للمشروع */}
      <FooterSuggestion onSubmit={(text) => {
        if (!text?.trim()) return;
        if (!user?.uid) return;
        (async () => {
          try {
            const suggCol = collection(db, "admin", "suggestions");
            await addDoc(suggCol, {
              userId: user.uid,
              text: text.trim(),
              createdAt: Date.now(),
              status: "pending",
            });
            alert("تم إرسال الاقتراح بنجاح للإدارة.");
          } catch (e) {
            console.error("Submit suggestion error:", e);
          }
        })();
      }} />

      {/* 31) التحليل الإحصائي: مخطط بسيط يستخدم CSS فقط */}
      <section className="card glass panel perf-panel" aria-label="Performance">
        <div className="panel-title">تحليل الأداء (أسبوعي)</div>
        <div className="perf-canvas">
          <div className="line" style={{ height: "20%" }} />
          <div className="line" style={{ height: "60%" }} />
          <div className="line" style={{ height: "40%" }} />
          <div className="line" style={{ height: `${Math.min(100, profile.hoursSpent % 100)}%` }} />
        </div>
        <div className="perf-caption">ساعات الدراسة: {profile.hoursSpent} | الدروس: {profile.coursesCompleted}</div>
      </section>

      {/* 32) المفكرة السريعة: مجلد ملاحظات محلياً (LocalStorage) مُدمج داخل الملف */}
      <section className="card glass panel quick-notes" aria-label="Quick Notes Local">
        <div className="panel-title">المفكرة السريعة (Local)</div>
        <QuickNotesStorage />
      </section>

      {/* 33) مشاركة الإنجاز: زر يتحول إلى مودال/نافذة مشاركة بسيط */}
      <section className="card glass panel share-panel" aria-label="Share Progress">
        <div className="panel-title">مشاركة الإنجاز</div>
        <button className="cta" onClick={() => alert("تم تجهيز صورة الإنجاز للمشاركة.")}>
          تجهيز صورة الإنجاز للمشاركة
        </button>
      </section>

      {/* 34) عرض التحميلات (Uploads) - إذا لم يعرض سابقاً */}
      <section className="card glass panel" aria-label="Uploads">
        <div className="panel-title">التحميلات</div>
        <UploadsPanel uid={user?.uid} />
      </section>

      {/* 35) الدعم الفني المباشر - توسيع نافذة الدعم إذا لم تكن مضافة سابقاً */}
      <SupportWidget />

      {/* 36) حالة النظام والتهيئة العامة */}
      <section className="card glass panel system-status" aria-label="System Status Final">
        <div className="panel-title">حالة النظام</div>
        <div className="system-row">
          <span className={`status-dot online`} /> النِظام متصل
        </div>
        <div className="system-row">
          <span className="muted">الثيم:</span> <strong>{theme}</strong>
        </div>
        <div className="system-row">
          <span className="muted">المستخدم:</span> <span>{profile.displayName || user?.email?.split("@")[0]}</span>
        </div>
      </section>

      {/* إغلاق البنية العامة */}
    </div>
  );
};

// مكوّنات داخلية إضافية لإتمام البناء
const QuickNotesStorage = () => {
  const STORAGE_KEY = "quick_notes";
  const [notes, setNotes] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setNotes(JSON.parse(raw));
    } catch {
      // تجاهل
    }
  }, []);

  useEffect(()



const QuickNotesStorage = () => {
  const STORAGE_KEY = "quick_notes";
  const [notes, setNotes] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setNotes(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  const addNote = () => {
    const t = text.trim();
    if (!t) return;
    const newNote = { id: Date.now().toString(), text: t, createdAt: Date.now() };
    setNotes((n) => [newNote, ...n]);
    setText("");
  };

  const removeNote = (id) => {
    setNotes((n) => n.filter((x) => x.id !== id));
  };

  return (
    <div className="quick-notes-panel">
      <div className="notes-input">
        <input
          placeholder="ملاحظة سريعة..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") addNote();
          }}
        />
        <button className="btn" onClick={addNote}>إضافة</button>
      </div>
      <div className="notes-list">
        {notes.length === 0 ? (
          <div className="muted">لا ملاحظات حتى الآن.</div>
        ) : (
          notes.map((n) => (
            <div key={n.id} className="note-item">
              <span>{n.text}</span>
              <button className="ghost" onClick={() => removeNote(n.id)}>إزالة</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// End of QuickNotesStorage

// Exports and main component closing
        
export default StudentDash;

        
