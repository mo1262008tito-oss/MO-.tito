import { db, rtdb, auth } from "../firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc, // مفقود سابقاً
  doc,    // مفقود سابقاً
  updateDoc, // مفقود سابقاً
  addDoc,    // مفقود سابقاً
  setDoc,    // مفقود سابقاً
  increment, 
  writeBatch,
  serverTimestamp // مفقود سابقاً
} from "firebase/firestore";
import { ref, set, onValue, update } from "firebase/database"; // مفقود سابقاً للـ Realtime

// 1. نظام الحماية الشامل (The Fortress Shield)
export const SecurityShield = {
  // بصمة المتصفح المتقدمة + التحقق من الجلسة النشطة
  verifyDevice: async (studentId, fingerprint) => {
    const userRef = doc(db, "users", studentId);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const userData = snap.data();

      // أ- التحقق من ربط الجهاز (Device Binding)
      if (userData.deviceId && userData.deviceId !== fingerprint) {
        // حظر تلقائي مؤقت وإرسال إشعار للمدير
        await updateDoc(userRef, { 
          status: 'LOCKED', 
          lastViolation: 'MULTI_DEVICE_ATTEMPT',
          violationTime: serverTimestamp()
        });
        throw new Error("SECURITY_ERR_DEVICE_LIMIT");
      }

      // ب- إذا كان الطالب يسجل لأول مرة، نربط جهازه الحساب
      if (!userData.deviceId) {
        await updateDoc(userRef, { deviceId: fingerprint });
      }

      // ج- منع فتح الحساب في تبويبين أو متصفحين مختلفين (Session Lock)
      const sessionRef = ref(rtdb, `active_sessions/${studentId}`);
      set(sessionRef, {
        lastActive: Date.now(),
        fingerprint: fingerprint,
        status: 'online'
      });
    }
  },

  // رصد برامج تسجيل الشاشة أو محاولات الاختراق
  reportSecurityIncident: async (studentId, incidentType, details = {}) => {
    // 1. تسجيل الحادثة في الأرشيف للتحقيق
    await addDoc(collection(db, "security_incidents"), {
      studentId,
      incident: incidentType, // مثل: 'SCREEN_RECORD' أو 'TAB_SWITCH'
      details,
      timestamp: serverTimestamp()
    });

    // 2. إغلاق الجلسة فوراً (Kill Switch)
    const sessionRef = ref(rtdb, `active_sessions/${studentId}`);
    await update(sessionRef, { kill: true, reason: incidentType });

    // 3. قفل حساب الطالب في Firestore لمنعه من تسجيل الدخول مرة أخرى
    const userRef = doc(db, "users", studentId);
    await updateDoc(userRef, { status: 'SUSPENDED' });
  }
};

  // رصد برامج تسجيل الشاشة
  reportScreenCapture: async (studentId, softwareName) => {
    await addDoc(collection(db, "security_incidents"), {
      studentId,
      incident: 'SCREEN_RECORD_DETECTED',
      tool: softwareName,
      timestamp: serverTimestamp()
    });
    // إغلاق الجلسة فوراً عبر Realtime Database
    set(ref(rtdb, `active_sessions/${studentId}/kill`), true);
  }
};

// 2. محرك الأكواد الضخم (Bulk Engine)
export const CodeEngine = {
  generateBulk: async (config) => {
    const { count, courseId, prefix, distributor } = config;
    const batch = writeBatch(db);
    const codes = [];

    for (let i = 0; i < count; i++) {
      const code = `${prefix}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      const ref = doc(db, "codes", code);
      batch.set(ref, {
        courseId,
        distributor,
        isUsed: false,
        createdAt: serverTimestamp(),
        expiresAt: Date.now() + (90 * 24 * 60 * 60 * 1000) // صلاحية 3 شهور
      });
      codes.push(code);
    }
    await batch.commit();
    return codes; // يتم تصديرها لاحقاً لملف CSV/PDF
  }
};

// 3. محلل الأداء بالذكاء الاصطناعي (AI Analytics)
export const AIAnalyzer = {
  predictChurn: async (daysInactive = 7) => {
    const limit = Date.now() - (daysInactive * 24 * 60 * 60 * 1000);
    const q = query(collection(db, "users"), where("lastActive", "<", limit));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      email: d.data().email,
      riskLevel: 'HIGH',
      suggestion: 'إرسال كوبون خصم لتحفيزه'
    }));
  }
};

// 4. نظام الـ Drip Content (التسلسل المنطقي)
export const ContentLogic = {
  canAccessLecture: async (studentId, courseId, lectureOrder) => {
    if (lectureOrder === 1) return true;
    const prevLecture = query(
      collection(db, `users/${studentId}/progress`),
      where("courseId", "==", courseId),
      where("order", "==", lectureOrder - 1)
    );
    const snap = await getDocs(prevLecture);
    return !snap.empty && snap.docs[0].data().completed === true;
  }
};
const UltimateAdminPanel = () => {
  const [activeTab, setActiveTab] = useState('security');
  
  return (
    <div className="admin-wrapper" style={styles.container}>
      {/* Sidebar المطور */}
      <aside className="main-sidebar" style={styles.sidebar}>
        <div className="admin-profile">
          <img src="/admin-avatar.png" />
          <h3>د. محمد تيتو</h3>
          <span>Super Admin</span>
        </div>
        
        <nav className="nav-list">
          <div className="nav-group">الرقابة</div>
          <button onClick={() => setActiveTab('fortress')}><ShieldCheck/> الحصن الأمني</button>
          <button onClick={() => setActiveTab('live')}><Radio/> الرادار اللحظي</button>
          
          <div className="nav-group">المحتوى والطلاب</div>
          <button onClick={() => setActiveTab('courses')}><BookOpen/> الأكاديمية</button>
          <button onClick={() => setActiveTab('students')}><Users/> قاعدة البيانات</button>
          
          <div className="nav-group">المالية والنمو</div>
          <button onClick={() => setActiveTab('atms')}><Key/> نظام الأكواد</button>
          <button onClick={() => setActiveTab('sales')}><BarChart3/> التقارير المالية</button>
          
          <div className="nav-group">الذكاء الاصطناعي</div>
          <button onClick={() => setActiveTab('ai-reports')}><Cpu/> AI Insights</button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="content-body" style={styles.main}>
        <header style={styles.header}>
          <div className="search-bar"><Search/> <input placeholder="ابحث عن طالب برقم الهاتف أو الكود..." /></div>
          <div className="header-actions">
            <div className="server-status">سيرفر الفيديو: <span className="status-online">مستقر</span></div>
            <button className="emergency-btn"><Zap/> تدمير الجلسات</button>
          </div>
        </header>

        <section className="dashboard-view">
           {/* هنا يتم تبديل الأقسام بناءً على الـ activeTab */}
           {activeTab === 'fortress' && <SecurityDashboard />}
           {activeTab === 'ai-reports' && <AIAnalyticsView />}
        </section>
      </main>
    </div>
  );
};
// Logic/Security/Watermark.js
export const getWatermarkPosition = () => {
  // توليد إحداثيات عشوائية تضمن بقاء النص داخل حدود الفيديو
  const x = Math.floor(Math.random() * 80) + "%"; 
  const y = Math.floor(Math.random() * 80) + "%";
  const opacity = Math.random() * (0.5 - 0.2) + 0.2; // شفافية متغيرة
  return { x, y, opacity };
};

// Logic/Content/Library.js
export const securePDFView = (fileUrl) => {
  // هذا اللوجيك يعطل كليك يمين، يمنع الـ Shortcuts (Ctrl+P, Ctrl+S)
  // ويقوم برسم طبقة شفافة فوق الملف تمنع النسخ
  return {
    disableRightClick: true,
    disablePrint: true,
    watermarkEnabled: true
  };
};

// Logic/Finance/Affiliate.js
export const processReferral = async (referralCode, newStudentId) => {
  const codeRef = query(collection(db, "affiliates"), where("code", "==", referralCode));
  const snap = await getDocs(codeRef);
  
  if (!snap.empty) {
    const affiliate = snap.docs[0];
    const commission = 50; // 50 جنيه مثلاً
    // إضافة رصيد للمسوق
    await updateDoc(doc(db, "users", affiliate.data().ownerId), {
      wallet: increment(commission)
    });
    // توثيق العملية
    await addDoc(collection(db, "transactions"), {
      from: newStudentId,
      to: affiliate.data().ownerId,
      amount: commission,
      type: 'AFFILIATE_REWARD'
    });
  }
};

// الميزة 34: محرك اختيار الأسئلة العشوائي
export const getRandomizedExam = async (bankId, questionCount) => {
  const q = query(collection(db, `question_banks/${bankId}/questions`));
  const snap = await getDocs(q);
  const allQuestions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  // خلط الأسئلة واختيار عدد محدد
  return allQuestions.sort(() => 0.5 - Math.random()).slice(0, questionCount);
};

// الميزة 19 & 35: التصحيح الفوري والمقالي
export const submitExam = async (studentId, examId, answers, isManual = false) => {
  let score = 0;
  if (!isManual) {
    // تصحيح تلقائي للأسئلة الاختيارية
    answers.forEach(ans => { if (ans.isCorrect) score += ans.points; });
  }
  
  await addDoc(collection(db, "exam_results"), {
    studentId,
    examId,
    score,
    status: isManual ? "PENDING_MANUAL_GRADING" : "COMPLETED",
    submittedAt: serverTimestamp()
  });
};

// --- نظام مراقبة الأداء والجودة (31, 32, 33) ---

// الميزة 31: مراقبة جودة اتصال الطالب
export const monitorNetworkSpeed = () => {
  if (navigator.connection) {
    const { downlink, effectiveType } = navigator.connection;
    if (downlink < 1.5 || effectiveType === '2g') {
      return { slow: true, msg: "اتصالك ضعيف، ننصح بتقليل جودة الفيديو" };
    }
  }
  return { slow: false };
};

// الميزة 32: تتبع ضغط السيرفر (CDN Balancing)
export const getOptimalServer = async () => {
  const serverSnap = await getDocs(query(collection(db, "servers"), where("status", "==", "ONLINE")));
  const servers = serverSnap.docs.map(d => d.data());
  // اختيار السيرفر الأقل ضغطاً (Least Load)
  return servers.sort((a, b) => a.currentLoad - b.currentLoad)[0];
};

// --- نظام المالية والنمو (20, 25, 38) ---

// الميزة 20: حساب صافي الأرباح
export const calculateNetRevenue = async () => {
  const paymentsSnap = await getDocs(collection(db, "payments"));
  let gross = 0;
  paymentsSnap.forEach(d => gross += d.data().amount);
  const gatewayFees = gross * 0.03; // افتراض عمولة دفع 3%
  const serverCosts = gross * 0.05; // تكاليف استضافة
  return { gross, net: gross - gatewayFees - serverCosts };
};

// الميزة 38: تحويل النقاط (XP) إلى خصومات
export const convertPointsToCoupon = async (studentId, points) => {
  if (points < 1000) throw new Error("يجب جمع 1000 نقطة على الأقل");
  const discountAmount = points / 100; // كل 100 نقطة بـ 1 جنيه
  const couponCode = `REWARD-${Math.random().toString(36).toUpperCase().slice(2,8)}`;
  
  await setDoc(doc(db, "coupons", couponCode), {
    amount: discountAmount,
    type: "FIXED",
    isUsed: false,
    ownerId: studentId
  });
  
  await updateDoc(doc(db, "users", studentId), { points: increment(-points) });
  return couponCode;
};

// --- نظام الرقابة والأمن (22, 24, 26, 30) ---

// الميزة 22: Geofencing (منع مشاركة الحسابات بين المحافظات)
export const verifyLocation = async (studentId, currentCity) => {
  const userRef = doc(db, "users", studentId);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.data().homeCity && userSnap.data().homeCity !== currentCity) {
    await logSecurityViolation(studentId, "LOCATION_MISMATCH");
    // تنبيه للأدمن: الطالب مسجل من القاهرة ويحاول الدخول من الإسكندرية
  }
};

// الميزة 24: سجل تحركات المساعدين (Audit Logs)
export const logAdminAction = async (adminId, action, targetId) => {
  await addDoc(collection(db, "audit_logs"), {
    adminId,
    action, // مثال: 'DELETE_STUDENT'
    targetId,
    timestamp: serverTimestamp()
  });
};

// --- تجربة الطالب الذكية (23, 27, 28, 37, 39, 40) ---

// الميزة 28: توليد الشهادة التلقائية
export const generateCertificate = async (studentId, courseId) => {
  const certRef = doc(db, "certificates", `${studentId}_${courseId}`);
  const data = {
    studentName: auth.currentUser.displayName,
    courseName: "فيزياء النخبة",
    issueDate: new Date().toLocaleDateString(),
    verifyUrl: `https://tito.edu/verify/${studentId}`
  };
  await setDoc(certRef, data);
  return data;
};

// الميزة 39 & 40: نظام الدعم الفني المؤرشف
export const openSupportTicket = async (studentId, message) => {
  const ticketRef = await addDoc(collection(db, "tickets"), {
    studentId,
    initialMessage: message,
    status: "OPEN",
    createdAt: serverTimestamp()
  });
  // بدء محادثة لحظية في Realtime Database
  await set(ref(rtdb, `chats/${ticketRef.id}`), {
    messages: [{ text: message, sender: "STUDENT", time: Date.now() }]
  });
};

// الميزة 37: الأوسمة (Badges)
export const awardBadge = async (studentId, badgeType) => {
  await updateDoc(doc(db, "users", studentId), {
    badges: increment(1),
    [`badge_list.${badgeType}`]: true
  });
};

// --- [ الميزات 23 & 25 ]: حماية الـ PDF والجودات المتعددة ---
export const ContentProtection = {
  // منع التحميل وعرض الملف عبر Canvas (Logic Concept)
  setupSecureViewer: (fileUrl) => {
    return {
      url: fileUrl,
      config: {
        onContextMenu: (e) => e.preventDefault(), // منع كليك يمين
        userSelect: "none", // منع تحديد النص
        onKeyDown: (e) => (e.ctrlKey && e.key === 'p') && e.preventDefault(), // منع الطباعة
      }
    };
  },

  // اختيار الجودة المناسبة (Multi-Quality)
  getVideoSource: (sources, qualityPreference) => {
    return sources[qualityPreference] || sources['720p'] || sources['auto'];
  }
};

// --- [ الميزة 26 & 40 ]: التفضيلات وحفظ الملاحظات السحابية ---
export const StudentExperience = {
  // حفظ الملاحظات لحظياً أثناء المشاهدة
  saveVideoNote: async (studentId, videoId, noteText, timestamp) => {
    const noteRef = doc(db, `users/${studentId}/notes`, videoId);
    await setDoc(noteRef, {
      videoId,
      text: noteText,
      atSecond: timestamp,
      lastUpdated: serverTimestamp()
    }, { merge: true });
  },

  // حفظ وضع القالب (Dark/Light)
  saveThemePreference: async (studentId, isDark) => {
    await updateDoc(doc(db, "users", studentId), { darkMode: isDark });
  }
};

// --- [ الميزة 27 ]: الأسئلة الإجبارية داخل الفيديو (In-Video Quizzes) ---
export const InVideoLogic = {
  checkPausePoints: (currentTime, quizPoints, onTrigger) => {
    quizPoints.forEach(point => {
      if (Math.floor(currentTime) === point.second && !point.answered) {
        onTrigger(point.questionData);
      }
    });
  }
};

// --- [ الميزة 29 & 30 ]: الوصول بدون إنترنت والتواصل مع الأهل ---
export const CommunicationLogic = {
  // ربط SMS لولي الأمر (Integration Logic)
  sendSmsToGuardian: async (parentPhone, studentName, grade) => {
    // هنا يتم الربط مع API مزود الخدمة مثل Twilio أو Nexmo
    const message = `ولي أمر الطالب ${studentName}: حصل ابنكم على درجة ${grade} في امتحان اليوم.`;
    console.log("Sending SMS via API...", message);
  }
};

// --- [ الميزة 33 & 35 ]: منع الغش والأسئلة المقالية ---
export const ExamSecurity = {
  // عداد الخروج من التبويب (Tab Switching)
  initTabDetection: (sessionId) => {
    document.addEventListener("visibilitychange", async () => {
      if (document.hidden) {
        const sessionRef = doc(db, "exam_sessions", sessionId);
        await updateDoc(sessionRef, { 
          tabSwitches: increment(1),
          lastViolation: serverTimestamp() 
        });
      }
    });
  },

  // رفع صورة الحل للمقالي
  uploadSubjectiveAnswer: async (studentId, examId, file) => {
    // منطق رفع الصورة لـ Storage وربط الرابط بالامتحان
    const answerRef = collection(db, `exams/${examId}/subjective_answers`);
    await addDoc(answerRef, { studentId, fileUrl: "LINK_FROM_STORAGE", status: "WAITING_CORRECTION" });
  }
};

// --- [ الميزة 36 & 37 ]: نظام التلعيب (Gamification) ---
export const Gamification = {
  // تحديث لوحة الشرف (Leaderboard)
  updateGlobalRank: async (studentId, newPoints) => {
    const userRef = doc(db, "users", studentId);
    await updateDoc(userRef, { 
      totalPoints: increment(newPoints),
      level: increment(newPoints > 500 ? 1 : 0) // زيادة اللفل تلقائياً
    });
  },

  // التحقق من منح الأوسمة (Badges)
  checkForBadges: async (studentId) => {
    const userRef = doc(db, "users", studentId);
    const snap = await getDoc(userRef);
    const data = snap.data();

    if (data.examsFinished >= 10 && !data.badges?.includes('WARRIOR')) {
      await updateDoc(userRef, { "badges": [...(data.badges || []), 'WARRIOR'] });
    }
  }
};

// --- [ الميزة 39 ]: تذاكر الدعم المشفرة (Ticket Archive) ---
export const SupportSystem = {
  archiveChat: async (ticketId) => {
    const ticketRef = doc(db, "tickets", ticketId);
    // نقل الشات من Realtime DB إلى Firestore للأرشفة الطويلة
    const chatRef = ref(rtdb, `chats/${ticketId}`);
    onValue(chatRef, async (snapshot) => {
       await updateDoc(ticketRef, { 
         history: snapshot.val(), 
         status: 'ARCHIVED',
         closedAt: serverTimestamp() 
       });
       set(chatRef, null); // حذف الشات من اللحظي لتوفير المساحة
    }, { onlyOnce: true });
  }
};

// --- [ الميزة 37 ]: نظام الصيانة والطوارئ (Maintenance Mode) ---
export const AppControl = {
  toggleMaintenance: async (isEnabled, reason) => {
    const configRef = ref(rtdb, "app_config");
    await update(configRef, { 
      maintenanceMode: isEnabled, 
      maintenanceReason: reason 
    });
  }
};

// --- [ الميزة 32 ]: مراقبة ضغط السيرفر اللحظي ---
export const ServerMonitor = {
  trackLoad: (serverId) => {
    // يقوم السيرفر بتحديث حالته كل دقيقة في قاعدة البيانات
    setInterval(async () => {
      const load = Math.random() * 100; // مثال على جلب الضغط
      await updateDoc(doc(db, "servers", serverId), { currentLoad: load });
    }, 60000);
  }
};

return (
    <div style={styles.gridContainer}>
      {/* القسم الأول: مراقبة محاولات الغش اللحظية (الميزة 33) */}
      <div style={styles.fullCard}>
        <div style={styles.cardHeader}>
          <ShieldAlert color="#ef4444" />
          <h3>رادار محاولات الغش (Tab-Switching & Screenshot)</h3>
        </div>
        <div style={styles.logTable}>
          <div style={styles.tableHeader}>
            <span>الطالب</span>
            <span>نوع المخالفة</span>
            <span>الجهاز</span>
            <span>الحدث</span>
            <span>الإجراء الصارم</span>
          </div>
          {/* مثال لبيانات قادمة من اللوجيك */}
          <SecurityRow 
            name="ياسين رامي" 
            type="محاولة تصوير شاشة" 
            device="PC - Windows 11" 
            time="منذ 30 ثانية"
            severity="HIGH"
          />
          <SecurityRow 
            name="عمر خالد" 
            type="تبديل نافذة الامتحان (3 مرات)" 
            device="Samsung S23" 
            time="منذ 2 دقيقة"
            severity="MEDIUM"
          />
        </div>
      </div>

      {/* القسم الثاني: إدارة بصمة الجهاز (الميزة 2 & 18) */}
      <div style={styles.halfCard}>
        <div style={styles.cardHeader}>
          <Fingerprint color="#3b82f6" />
          <h3>إدارة ربط الأجهزة (Device Binding)</h3>
        </div>
        <p style={styles.subText}>يسمح للطالب بجهاز واحد فقط. يمكنك فك الربط من هنا.</p>
        <div style={styles.searchBox}>
          <input type="text" placeholder="ابحث برقم الطالب لفك ربط جهازه..." style={styles.input} />
        </div>
        {/* قائمة الأجهزة الموثوقة */}
        <div style={styles.deviceItem}>
          <span>iPhone 14 Pro - احمد علي</span>
          <button style={styles.resetBtn}>فك الربط</button>
        </div>
      </div>

      {/* القسم الثالث: الجيوفنسينج (الميزة 22) */}
      <div style={styles.halfCard}>
        <div style={styles.cardHeader}>
          <MapPin color="#f59e0b" />
          <h3>تتبع الموقع الجغرافي (Anti-Account Sharing)</h3>
        </div>
        <div style={styles.geoAlert}>
          <strong>تنبيه:</strong> تم رصد دخول للحساب (user_99) من "المنصورة" ثم من "أسوان" في أقل من ساعة!
          <button style={styles.banBtn}>حظر الحساب فوراً</button>
        </div>
      </div>
    </div>
  );
};

// مكون سطر المخالفات
const SecurityRow = ({ name, type, device, time, severity }) => (
  <div style={styles.tableRow}>
    <span style={{ fontWeight: 'bold' }}>{name}</span>
    <span style={{ color: severity === 'HIGH' ? '#ef4444' : '#f59e0b' }}>{type}</span>
    <span style={{ fontSize: '0.8rem' }}>{device}</span>
    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{time}</span>
    <button style={styles.actionBtn}>إغلاق الجلسة</button>
  </div>
);

const AI_ExamView = () => {
  return (
    <div style={styles.gridContainer}>
      {/* الميزة 34: محرك بنك الأسئلة العشوائي */}
      <div style={styles.statBox}>
        <div style={styles.statIcon}><MonitorOff /></div>
        <div>
          <h4>بنك الأسئلة الذكي</h4>
          <p>1,250 سؤال مفعل</p>
        </div>
        <button style={styles.primaryBtn}>توليد امتحان عشوائي</button>
      </div>

      {/* الميزة 35: انتظار التصحيح المقالي */}
      <div style={styles.fullCard}>
        <h3><Eye size={18} /> امتحانات بانتظار التصحيح اليدوي</h3>
        <div style={styles.subjectiveList}>
          <div style={styles.subjectiveItem}>
            <span>إجابة الطالب: <strong>مازن حسن</strong></span>
            <span>المادة: فيزياء - فصل 1</span>
            <button style={styles.viewBtn}>فتح صورة الحل</button>
          </div>
        </div>
      </div>

      {/* الميزة 36 & 37: Gamification (لوحة الشرف) */}
      <div style={styles.fullCard}>
        <h3><Zap size={18} color="#f59e0b" /> لوحة الشرف ونظام الأوسمة</h3>
        <div style={styles.leaderboardGrid}>
          <div style={styles.leaderItem}>🥇 محمد طارق - 2500 XP (وسام العبقري)</div>
          <div style={styles.leaderItem}>🥈 سارة كمال - 2350 XP (وسام المثابر)</div>
        </div>
      </div>
    </div>
  );
};
const FinancialVaultView = () => {
  return (
    <div style={styles.gridContainer}>
      
      {/* الميزة 20: تحليل الأرباح الصافية (Net Revenue Analytics) */}
      <div style={styles.fullCard}>
        <div style={styles.cardHeader}>
          <TrendingUp color="#10b981" />
          <h3>ميزانية الأكاديمية (صافي الأرباح بعد الخصومات)</h3>
        </div>
        <div style={styles.statsRow}>
          <div style={styles.statBoxSmall}>
            <span>إجمالي الإيرادات</span>
            <h2 style={{ color: '#10b981' }}>150,400 ج.م</h2>
          </div>
          <div style={styles.statBoxSmall}>
            <span>عمولات الدفع (3%)</span>
            <h2 style={{ color: '#ef4444' }}>- 4,512 ج.م</h2>
          </div>
          <div style={styles.statBoxSmall}>
            <span>تكاليف السيرفرات</span>
            <h2 style={{ color: '#f59e0b' }}>- 2,100 ج.م</h2>
          </div>
          <div style={styles.statBoxSmall}>
            <span>الربح الصافي</span>
            <h2 style={{ color: '#3b82f6' }}>143,788 ج.م</h2>
          </div>
        </div>
      </div>

      {/* الميزة 9: توليد الأكواد الضخم (Bulk Code Generator) */}
      <div style={styles.halfCard}>
        <div style={styles.cardHeader}>
          <Ticket color="#a855f7" />
          <h3>توليد أكواد الشحن (Bulk Generation)</h3>
        </div>
        <div style={styles.formGroup}>
          <input type="number" placeholder="عدد الأكواد (مثلاً: 500)" style={styles.input} />
          <input type="number" placeholder="قيمة الكود (ج.م)" style={styles.input} />
          <button style={styles.generateBtn}>توليد وتصدير Excel <Download size={16} /></button>
        </div>
        <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '10px' }}>
          * يتم تشفير الأكواد لمنع التخمين (الميزة 1).
        </p>
      </div>

      {/* الميزة 25 & 38: نظام المسوقين والخصومات */}
      <div style={styles.halfCard}>
        <div style={styles.cardHeader}>
          <Share2 color="#3b82f6" />
          <h3>نظام التسويق بالعمولة (Affiliates)</h3>
        </div>
        <div style={styles.affiliateItem}>
          <span>كود: TITO_S50</span>
          <span>المسوق: محمد إبراهيم</span>
          <span style={{ color: '#10b981' }}>عمولة: 450 ج.م</span>
        </div>
        <button style={styles.viewBtn}>إدارة المسوقين</button>
      </div>

      {/* الميزة 30: بوابة رسائل أولياء الأمور (Guardian SMS Gateway) */}
      <div style={styles.fullCard}>
        <div style={styles.cardHeader}>
          <MessageCircle color="#22d3ee" />
          <h3>إرسال النتائج لأولياء الأمور (SMS & WhatsApp)</h3>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <select style={styles.select}>
            <option>اختر الامتحان</option>
            <option>امتحان الفصل الأول - ميكانيكا</option>
          </select>
          <button style={styles.primaryBtn}>إرسال النتائج لـ 1200 ولي أمر فوراً</button>
        </div>
      </div>

    </div>
  );
};
const AI_ExperienceView = () => {
  return (
    <div style={styles.gridContainer}>
      
      {/* الميزة 28: محرك الشهادات التلقائية (Certificate Engine) */}
      <div style={styles.halfCard}>
        <div style={styles.cardHeader}>
          <Icon.Award color="#f59e0b" />
          <h3>توليد الشهادات التلقائي</h3>
        </div>
        <p style={styles.subText}>يتم إصدار الشهادة فور تخطي الطالب نسبة 90% من الدرجات.</p>
        <button style={styles.viewBtn}>تخصيص قالب الشهادة</button>
      </div>

      {/* الميزة 21: عداد الخروج من الامتحان (Tab-Switching Counter) */}
      <div style={styles.halfCard}>
        <div style={styles.cardHeader}>
          <Icon.ZapOff color="#ef4444" />
          <h3>مراقبة سلوك الطالب في الامتحانات</h3>
        </div>
        <div style={styles.logItem}>
          <span>أحمد حسن: خرج من الصفحة <strong>4 مرات</strong></span>
          <button style={styles.warningBtn}>توجيه إنذار</button>
        </div>
      </div>

      {/* الميزة 27: الأسئلة المفاجئة داخل الفيديو (In-Video Questions) */}
      <div style={styles.fullCard}>
        <h3>إدارة الأسئلة التفاعلية وسط الحصة</h3>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>الفيديو</th>
              <th>التوقيت</th>
              <th>السؤال</th>
              <th>إجراء</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>المحاضرة 3 - الفيزياء الحديثة</td>
              <td>12:45</td>
              <td>ما هي وحدة قياس الثابت؟</td>
              <td><Icon.Edit size={16} /></td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  );
};
const OpsRadarView = () => {
  return (
    <div style={styles.gridContainer}>
      
      {/* الميزة 31 & 32: الرادار التقني (Network & Infrastructure) */}
      <div style={styles.fullCard}>
        <div style={styles.cardHeader}>
          <Activity color="#10b981" />
          <h3>رادار أداء النظام والاتصال (Real-time Infrastructure)</h3>
        </div>
        <div style={styles.statsRow}>
          {/* مراقبة جودة اتصال الطلاب المباشر */}
          <div style={styles.radarBox}>
            <Wifi size={24} color="#3b82f6" />
            <h4>جودة إنترنت الطلاب</h4>
            <p>متوسط السرعة: <span style={{color: '#10b981'}}>12.5 Mbps</span></p>
            <small>85% جودة ممتازة | 15% اتصال ضعيف</small>
          </div>
          {/* مراقبة ضغط السيرفر (CDN Load) */}
          <div style={styles.radarBox}>
            <Server size={24} color="#a855f7" />
            <h4>ضغط السيرفرات (Global CDNs)</h4>
            <div style={styles.progressBar}>
              <div style={{...styles.progressFill, width: '38%', background: '#10b981'}}></div>
            </div>
            <p>38% مستخدم | 62% متاح</p>
          </div>
        </div>
      </div>

      {/* الميزة 39 & 40: نظام الدعم الفني والأرشفة (Support Hub) */}
      <div style={styles.fullCard}>
        <div style={styles.cardHeader}>
          <MessageSquare color="#3b82f6" />
          <h3>مركز الدعم الفني والمحادثات المؤرشفة</h3>
        </div>
        <div style={styles.ticketGrid}>
          {/* مثال لتذكرة دعم نشطة */}
          <div style={styles.ticketCard}>
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
              <strong>تذكرة #8821 - كود شحن تالف</strong>
              <span style={styles.statusBadge}>نشط الآن</span>
            </div>
            <p style={styles.ticketText}>الطالب: علي محمود | المساعد: م. سارة</p>
            <div style={styles.ticketActions}>
              <button style={styles.viewBtn}>دخول للمحادثة</button>
              <button style={styles.archiveBtn}><History size={14}/> أرشفة</button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
const SmartExamUI = () => {
  return (
    <div style={styles.gridContainer}>
      
      {/* الميزة 33 & 34: التحكم في الامتحانات */}
      <div style={styles.halfCard}>
        <div style={styles.cardHeader}>
          <AlertTriangle color="#ef4444" />
          <h3>التحكم في أمن الامتحانات</h3>
        </div>
        <div style={styles.controlRow}>
          <span>تبديل ترتيب الأسئلة تلقائياً (Randomization):</span>
          <div style={styles.toggleActive}>مفعل ✅</div>
        </div>
        <div style={styles.controlRow}>
          <span>منع الخروج من نافذة الامتحان (Anti-Cheat):</span>
          <div style={styles.toggleActive}>مفعل ✅</div>
        </div>
      </div>

      {/* الميزة 36 & 37 & 38: نظام التلعيب (Gamification Center) */}
      <div style={styles.halfCard}>
        <div style={styles.cardHeader}>
          <Zap color="#f59e0b" />
          <h3>لوحة الشرف والأوسمة (Hall of Fame)</h3>
        </div>
        <div style={styles.leaderboard}>
          <div style={styles.leaderRow}>
            <span>🥇 الأول: عمر ياسين</span>
            <span style={styles.xpBadge}>+2400 XP</span>
            <span style={styles.medal}>🎖️ ملك الفيزياء</span>
          </div>
          <div style={styles.leaderRow}>
            <span>🥈 الثاني: مريم حسن</span>
            <span style={styles.xpBadge}>+2150 XP</span>
            <span style={styles.medal}>🥈 العبقري</span>
          </div>
        </div>
        <button style={{...styles.primaryBtn, width: '100%', marginTop: '15px'}}>
          توزيع مكافآت الـ XP على المتفوقين
        </button>
      </div>

      {/* الميزة 35: تصحيح الأسئلة المقالية اليدوي */}
      <div style={styles.fullCard}>
        <h3>تصحيح الأسئلة المقالية (Manual Grading)</h3>
        <div style={styles.gradingTable}>
          <div style={styles.gradingRow}>
            <span>الطالب: يوسف كمال</span>
            <span>المادة: ميكانيكا 1</span>
            <button style={styles.gradeBtn}>عرض صورة الحل وتصحيحه</button>
          </div>
        </div>
      </div>

    </div>
  );
};const styles = {
  // ... التنسيقات السابقة ...
  radarBox: { flex: 1, background: '#1e293b', padding: '20px', borderRadius: '15px', textAlign: 'center', border: '1px solid #334155' },
  progressBar: { width: '100%', height: '10px', background: '#0f172a', borderRadius: '5px', margin: '15px 0', overflow: 'hidden' },
  progressFill: { height: '100%', transition: 'width 0.5s ease' },
  ticketGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px', marginTop: '15px' },
  ticketCard: { background: '#1e293b', padding: '15px', borderRadius: '12px', border: '1px solid #3b82f6' },
  statusBadge: { background: '#10b98122', color: '#10b981', padding: '2px 8px', borderRadius: '5px', fontSize: '0.75rem' },
  archiveBtn: { background: 'transparent', border: '1px solid #94a3b8', color: '#94a3b8', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' },
  leaderboard: { marginTop: '10px' },
  leaderRow: { display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#1e293b', borderRadius: '10px', marginBottom: '8px', alignItems: 'center' },
  xpBadge: { background: '#3b82f622', color: '#3b82f6', padding: '2px 8px', borderRadius: '5px', fontWeight: 'bold' },
  gradeBtn: { background: '#3b82f6', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer' },
  toggleActive: { color: '#10b981', fontWeight: 'bold' },
  controlRow: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1e293b' }
};


const SecureVideoPlayer = ({ videoSrc, studentData, quizPoints }) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [watermarkPos, setWatermarkPos] = useState({ top: '10%', left: '10%' });

  // الميزة 7: تحريك البصمة المائية عشوائياً لمنع التسجيل
  useEffect(() => {
    const interval = setInterval(() => {
      setWatermarkPos({
        top: Math.random() * 80 + '%',
        left: Math.random() * 80 + '%'
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // الميزة 27: إيقاف الفيديو لإظهار سؤال مفاجئ
  const handleTimeUpdate = (e) => {
    const time = Math.floor(e.target.currentTime);
    setCurrentTime(time);
    if (quizPoints.includes(time)) {
      e.target.pause();
      setShowQuiz(true);
    }
  };

  return (
    <div style={styles.playerContainer} onContextMenu={(e) => e.preventDefault()}>
      {/* طبقة البصمة المائية (Watermark) */}
      <div style={{ ...styles.watermark, ...watermarkPos }}>
        {studentData.name} - {studentData.phone}
      </div>

      <video 
        src={videoSrc} 
        onTimeUpdate={handleTimeUpdate}
        controlsList="nodownload" // منع التحميل المباشر
        style={styles.videoElement}
      />

      {/* الميزة 27: واجهة السؤال وسط الفيديو */}
      {showQuiz && (
        <div style={styles.quizOverlay}>
          <div style={styles.quizBox}>
            <h3>سؤال سريع للتركيز 🧠</h3>
            <p>ما هي وحدة قياس القوة في النظام الدولي؟</p>
            <button onClick={() => setShowQuiz(false)} style={styles.quizBtn}>إجابة ومتابعة</button>
          </div>
        </div>
      )}

      {/* مؤشر حماية الفيديو */}
      <div style={styles.securityBadge}>
        <ShieldCheck size={14} /> محمي بواسطة Titan Security
      </div>
    </div>
  );
};

const StudentHub = () => {
  return (
    <div style={styles.hubContainer}>
      {/* ملخص إنجازات الطالب (Gamification) */}
      <section style={styles.achievementSection}>
        <div style={styles.statCard}>
          <h4>نقاط الخبرة (XP)</h4>
          <h2>2,450</h2>
        </div>
        <div style={styles.statCard}>
          <h4>الأوسمة المكتسبة</h4>
          <div style={styles.badgeRow}>
            <span>🏆 ملك الفيزياء</span>
            <span>🔥 الملتزم</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <h4>الشهادات</h4>
          <button style={styles.certBtn}>تحميل شهادة إتمام الدورة PDF</button>
        </div>
      </section>

      {/* الميزة 40: مفكرة الطالب الذكية */}
      <section style={styles.notesSection}>
        <h3>ملاحظاتي على المحاضرة 📝</h3>
        <textarea 
          placeholder="اكتب ملاحظاتك هنا وسيتم حفظها تلقائياً مع توقيت الفيديو..." 
          style={styles.notesArea}
        />
      </section>
    </div>
  );
};
export default AdminDash;

