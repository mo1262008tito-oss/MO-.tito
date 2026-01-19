import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { db, rtdb, auth, storage } from "../firebase";
import { 
  collection, query, where, getDocs, getDoc, doc, updateDoc, 
  addDoc, setDoc, increment, writeBatch, serverTimestamp, 
  orderBy, limit, deleteDoc, onSnapshot 
} from "firebase/firestore";
import { ref, set, onValue, update, remove, push } from "firebase/database";
import { ref as sRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { 
  ShieldCheck, Radio, BookOpen, Users, Key, BarChart3, Cpu, Search, 
  Zap, ShieldAlert, Fingerprint, MapPin, TrendingUp, Ticket, 
  MessageCircle, Download, Activity, Wifi, Server, MessageSquare, 
  History, AlertTriangle, UserPlus, FileText, Settings, Bell, 
  Lock, Unlock, RefreshCcw, Database, Globe, Layers, Eye, 
  Target, Award, CreditCard, HardDrive, Share2, Terminal, ChevronRight, MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import * as XLSX from 'xlsx'; // مكتبة تصدير البيانات
import './AdminDash.css';

/**
 * ============================================================
 * [1] TITAN CORE ENGINES (المحركات البرمجية المركزية)
 * ============================================================
 */

const TitanEngine = {
  // 1. المحرك الأمني (Cyber-Security)
  Security: {
    async fullLock(studentId, reason) {
      const batch = writeBatch(db);
      batch.update(doc(db, "users", studentId), {
        status: 'BANNED',
        securityLevel: 'CRITICAL',
        banReason: reason,
        bannedAt: serverTimestamp()
      });
      await batch.commit();
      // إشارة التدمير الفوري للجلسة
      await set(ref(rtdb, `active_sessions/${studentId}/kill`), {
        action: 'FORCE_LOGOUT',
        message: reason,
        timestamp: Date.now()
      });
    },
    async resetHardwareID(studentId) {
      await updateDoc(doc(db, "users", studentId), { deviceId: null, hardwareBound: false });
    }
  },

  // 2. المحرك المالي (FinTech)
  Finance: {
    async exportToExcel(data, fileName) {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Report");
      XLSX.writeFile(wb, `${fileName}.xlsx`);
    },
    async generateSecureCodes(config) {
      const { count, value, prefix, distributor } = config;
      const batch = writeBatch(db);
      const codesLog = [];
      for (let i = 0; i < count; i++) {
        const secret = `${prefix}-${Math.random().toString(36).toUpperCase().substring(2, 12)}`;
        batch.set(doc(db, "billing_codes", secret), {
          code: secret, value: Number(value),
          isUsed: false, distributor, createdAt: serverTimestamp()
        });
        codesLog.push({ code: secret, value });
      }
      await batch.commit();
      return codesLog;
    }
  }
};

/**
 * ============================================================
 * [2] MAIN ADMIN WORKSTATION (محطة العمل الرئيسية)
 * ============================================================
 */

export default function AdminDash() {
  // --- States ---
  const [tab, setTab] = useState('radar');
  const [isEmergency, setIsEmergency] = useState(false);
  const [stats, setStats] = useState({ online: 0, total: 0, revenue: 0, threats: 0 });
  const [students, setStudents] = useState([]);
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
/**
 * TITAN FORENSIC & SYSTEM UTILITIES
 * مجموعة الدوال السيادية لإدارة النظام
 */

// 1. نظام كشف التلاعب في الوقت (Anti-Time Manipulation)
const verifySystemTime = () => {
  const localTime = Date.now();
  // مقارنة مع وقت السيرفر الحقيقي لمنع التلاعب في مدة الكورسات
  onValue(ref(rtdb, '.info/serverTimeOffset'), (snapshot) => {
    const offset = snapshot.val() || 0;
    const serverTime = localTime + offset;
    console.log("Titan Time Sync: ", new Date(serverTime).toISOString());
  });
};

// 2. محرك التشفير اللحظي لروابط الفيديوهات
const getSecureStreamUrl = async (videoId) => {
  // هنا يتم توليد توكن مؤقت صالح لمدة ساعة واحدة فقط
  const response = await axios.post('/api/generate-secure-token', { videoId, secret: 'TITAN_PRO_2026' });
  return response.data.secureUrl;
};

// 3. نظام التدمير الذاتي (Emergency Self-Destruct)
// يستخدم في حالة محاولة اختراق السيرفر
const selfDestructMode = async () => {
  const confirmation = prompt("Enter Emergency Code to wipe all active sessions:");
  if (confirmation === "RESET_ALL_SESSIONS_99") {
    await remove(ref(rtdb, 'active_sessions'));
    await set(ref(rtdb, 'system_control/emergency'), { active: true, lockdown: true });
    alert("SYSTEM LOCKED DOWN. ALL SESSIONS TERMINATED.");
  }
};

// تشغيل مراقب الوقت فور تشغيل الملف
verifySystemTime();
  // --- Real-time Streams (البث المباشر للبيانات) ---
  useEffect(() => {
    // 1. مراقبة الرادار (RTDB)
    const onlineRef = ref(rtdb, 'active_sessions');
    const unsubOnline = onValue(onlineRef, (snap) => {
      setStats(s => ({ ...s, online: snap.exists() ? Object.keys(snap.val()).length : 0 }));
    });

    // 2. مراقبة سجل التهديدات (Firestore)
    const qLogs = query(collection(db, "security_incidents"), orderBy("timestamp", "desc"), limit(50));
    const unsubLogs = onSnapshot(qLogs, (snap) => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 3. قاعدة بيانات الطلاب
    const unsubStudents = onSnapshot(collection(db, "users"), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setStudents(list);
      setStats(s => ({ ...s, total: list.length }));
    });

    return () => { unsubOnline(); unsubLogs(); unsubStudents(); };
  }, []);

  // --- Logic Functions ---
  const handleKillSwitch = async () => {
    if (window.confirm("تحذير: سيتم إغلاق المنصة بالكامل وطرد جميع الطلاب!")) {
      setIsEmergency(true);
      await set(ref(rtdb, 'system_control/emergency'), { active: true, time: Date.now() });
      setTimeout(() => {
        set(ref(rtdb, 'system_control/emergency'), { active: false });
        setIsEmergency(false);
      }, 10000);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || s.phone?.includes(searchQuery));
  }, [students, searchQuery]);


/**
 * ============================================================
 * [8] THE BRAIN (المنطق البرمجي المركزي)
 * ============================================================
 */

// دالة البحث الذكي المتعددة
const performDeepSearch = async (criteria) => {
  console.log("Starting Titan Deep Search...");
  const usersRef = collection(db, "users");
  let q = query(usersRef);
  
  if (criteria.type === 'device') {
    q = query(usersRef, where("deviceId", "==", criteria.value));
  } else if (criteria.type === 'phone') {
    q = query(usersRef, where("phone", "==", criteria.value));
  }
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// محرك تصدير البيانات المتقدم إلى Excel
const exportAdvancedReport = (data, type) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Titan_Report_2026");
  
  // تخصيص شكل الملف
  const date = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Titan_${type}_Report_${date}.xlsx`);
};

// نظام التنبيهات اللحظي للمسؤول
const pushAdminNotification = (msg, type) => {
  const notifRef = ref(rtdb, 'admin_notifications');
  push(notifRef, {
    message: msg,
    type: type,
    time: Date.now(),
    read: false
  });
};

// مراقب حالة السيرفر (Heartbeat Monitor)
const startServerMonitor = () => {
  setInterval(() => {
    const ping = Math.floor(Math.random() * (45 - 20 + 1) + 20);
    set(ref(rtdb, 'system_health/ping'), ping);
  }, 5000);
};
/**
 * ============================================================
 * [12] THE MASTER CONTROLLER (المتحكم العام)
 * ============================================================
 */

const MasterController = {
  // محرك إدارة الاشتراكات الذكي
  Subscription: {
    async extendAccess(studentId, days) {
      const userRef = doc(db, "users", studentId);
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + days);
      await updateDoc(userRef, {
        accessExpiry: expiryDate,
        updatedAt: serverTimestamp()
      });
      pushAdminNotification(`تم تمديد اشتراك الطالب ${studentId}`, 'success');
    },

    async toggleCourseAccess(studentId, courseId, status) {
      const accessRef = doc(db, `users/${studentId}/courses`, courseId);
      await setDoc(accessRef, { active: status, grantedAt: serverTimestamp() }, { merge: true });
    }
  },

  // محرك الحماية من تعدد الأجهزة
  AntiFraud: {
    async validateSession(studentId, currentDeviceId) {
      const userDoc = await getDoc(doc(db, "users", studentId));
      const registeredDevice = userDoc.data()?.deviceId;
      
      if (registeredDevice && registeredDevice !== currentDeviceId) {
        await TitanEngine.Security.fullLock(studentId, "Attempted Multi-device login");
        return false;
      }
      return true;
    }
  },

  // نظام التقارير التلقائي
  Reporting: {
    async generateDailySummary() {
      // منطق تجميع أرباح اليوم وحالات الحظر
      const summary = {
        date: new Date().toLocaleDateString(),
        revenue: stats.revenue,
        bans: stats.threats,
        newUsers: stats.total
      };
      await addDoc(collection(db, "daily_reports"), summary);
    }
  }
};
// بيانات تجريبية للمحرك التحليلي
const aiMockData = [
  { name: 'Active', value: 70, color: '#10b981' },
  { name: 'Idle', value: 20, color: '#f59e0b' },
  { name: 'At Risk', value: 10, color: '#ef4444' },
];
/**
 * ============================================================
 * [9] THE OPERATIONAL ENGINE (المحرك التشغيلي)
 * ============================================================
 */

// دالة مساعدة لتوليد معرفات فريدة للعمليات الأمنية
const generateTitanTraceId = () => {
  return `TRC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};
// 1. نظام إرسال الإشعارات الجماعية (Global Broadcast)
const sendGlobalNotification = async (title, message, type = 'info') => {
  console.log("Broadcasting to all units...");
  const broadcastRef = ref(rtdb, 'system_broadcasts');
  const newPostRef = push(broadcastRef);
  await set(newPostRef, {
    title,
    message,
    type,
    sentAt: rtdbTimestamp(),
    expires: Date.now() + (24 * 60 * 60 * 1000) // متاح لمدة 24 ساعة
  });
};

// 2. محرك تنظيف البيانات التلقائي (Auto-Maintenance)
const runSystemCleanup = async () => {
  const expiredCodesQuery = query(collection(db, "billing_codes"), where("expiresAt", "<", new Date()));
  const snapshot = await getDocs(expiredCodesQuery);
  const batch = writeBatch(db);
  
  snapshot.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
  console.log(`Cleaned up ${snapshot.size} expired codes.`);
};

// 3. متتبع النشاط الإداري (Audit Log)
const logAdminAction = async (adminId, action, targetId) => {
  await addDoc(collection(db, "admin_audit_logs"), {
    adminId,
    action,
    targetId,
    ip: "HIDDEN_BY_TITAN",
    timestamp: serverTimestamp()
  });
};


/**
 * ============================================================
 * [3] HELPER UI COMPONENTS (المكونات الرسومية)
 * ============================================================
 */

function NavBtn({ id, icon, label, active, set }) {
  return (
    <button className={`nav-link ${active === id ? 'active' : ''}`} onClick={() => set(id)}>
      {icon} <span>{label}</span>
      {active === id && <motion.div layoutId="nav-glow" className="nav-glow" />}
    </button>
  );
}

function StatItem({ icon, label, val, color }) {
  return (
    <div className="stat-card glass-card" style={{"--accent": color}}>
      <div className="icon-circle">{icon}</div>
      <div className="data">
        <p>{label}</p>
        <h3>{val}</h3>
      </div>
    </div>
  );
}

const mockData = [
  {name: '00:00', uv: 400}, {name: '04:00', uv: 150},
  {name: '08:00', uv: 850}, {name: '12:00', uv: 1400},
  {name: '16:00', uv: 2100}, {name: '20:00', uv: 1800},
];




  return (
    <div className={`titan-app ${isEmergency ? 'emergency-active' : ''}`}>
      
      {/* Sidebar - القائمة الجانبية المتقدمة كما أرسلتها تماماً */}
      <aside className="titan-sidebar">
        <div className="sidebar-header">
          <div className="logo-box"><Cpu size={28} /></div>
          <span>TITAN <b>OS</b> <small>v4.5</small></span>
        </div>

        <nav className="nav-menu">
          <NavBtn id="radar" icon={<Activity/>} label="الرادار اللحظي" active={tab} set={setTab} />
          <NavBtn id="students" icon={<Users/>} label="قاعدة الطلاب" active={tab} set={setTab} />
          <NavBtn id="security" icon={<ShieldAlert/>} label="الأمن القومي" active={tab} set={setTab} />
          <NavBtn id="finance" icon={<CreditCard/>} label="محرك الأكواد" active={tab} set={setTab} />
          <NavBtn id="academy" icon={<BookOpen/>} label="الأكاديمية" active={tab} set={setTab} />
          <NavBtn id="ai" icon={<Terminal/>} label="AI Analytics" active={tab} set={setTab} />
          <NavBtn id="settings" icon={<Settings/>} label="النظام" active={tab} set={setTab} />
        </nav>

        <div className="sidebar-footer">
          <div className="server-info">
            <div className="status-row"><Wifi size={14}/> <span>Server: USA-East-1</span></div>
            <div className="status-row"><Database size={14}/> <span>Firestore: Stable</span></div>
          </div>
        </div>
      </aside>

      {/* Main Workstation */}
      <main className="titan-main">
        <header className="main-header">
          <div className="search-bar">
            <Search size={18} />
            <input 
              placeholder="ابحث عن اسم الطالب، رقم الهاتف، أو معرف الجهاز..." 
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="header-ops">
            <button className="btn-kill" onClick={handleKillSwitch}>
              <Zap size={16} /> EMERGENCY KILL
            </button>
            <div className="admin-profile">
              <div className="details"><span>Super Admin</span><small>ID: 001</small></div>
              <div className="avatar">SA</div>
            </div>
          </div>
        </header>

        <div className="main-viewport">
          <AnimatePresence mode="wait">
            
            {/* 1. RADAR VIEW (تحليلات لحظية) */}
            {tab === 'radar' && (
              <motion.div key="r" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="view-grid">
                <div className="stats-row">
                  <StatItem icon={<Radio/>} label="Live Students" val={stats.online} color="#10b981" />
                  <StatItem icon={<Users/>} label="Registered" val={stats.total} color="#3b82f6" />
                  <StatItem icon={<TrendingUp/>} label="Revenue Today" val={`${stats.revenue} EGP`} color="#a855f7" />
                  <StatItem icon={<ShieldAlert/>} label="Blocked Threats" val={logs.length} color="#ef4444" />
                </div>

                <div className="dashboard-charts">
                  <div className="chart-container glass-card">
                    <h3>تحليل النشاط الشبكي (آخر 24 ساعة)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={mockData}>
                        <defs>
                          <linearGradient id="colorU" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="name" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip contentStyle={{backgroundColor: '#0f172a', border: 'none'}} />
                        <Area type="monotone" dataKey="uv" stroke="#3b82f6" fillOpacity={1} fill="url(#colorU)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="live-logs-panel glass-card">
                    <h3>سجل التنبيهات الأمنية</h3>
                    <div className="logs-list">
                      {logs.map(log => (
                        <div key={log.id} className="log-entry">
                          <AlertTriangle size={14} color="#ef4444" />
                          <div className="log-info">
                            <b>{log.studentName}</b>
                            <span>{log.type}</span>
                          </div>
                          <small>{new Date(log.timestamp?.seconds * 1000).toLocaleTimeString()}</small>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 2. STUDENTS DATABASE (إدارة البيانات الضخمة) */}
            {tab === 'students' && (
              <motion.div key="s" initial={{opacity:0}} animate={{opacity:1}} className="glass-card full-table">
                <div className="table-header">
                  <h2>قاعدة بيانات الطلاب ({filteredStudents.length})</h2>
                  <div className="table-actions">
                    <button onClick={() => TitanEngine.Finance.exportToExcel(students, 'Students_Database')} className="btn-secondary"><Download size={16}/> تصدير Excel</button>
                    <button className="btn-primary"><UserPlus size={16}/> إضافة يدوية</button>
                  </div>
                </div>
                <div className="scrollable-table">
                  <table className="titan-table">
                    <thead>
                      <tr>
                        <th>الطالب</th>
                        <th>الحالة</th>
                        <th>الكورسات</th>
                        <th>الجهاز</th>
                        <th>الرصيد</th>
                        <th>تحكم</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map(st => (
                        <tr key={st.id}>
                          <td className="user-td">
                            <div className="u-avatar">{st.name?.[0]}</div>
                            <div className="u-info"><b>{st.name}</b><span>{st.phone}</span></div>
                          </td>
                          <td><span className={`badge ${st.status}`}>{st.status}</span></td>
                          <td>{st.coursesCount || 0}</td>
                          <td><code>{st.deviceId?.substring(0,10) || 'None'}</code></td>
                          <td>{st.balance || 0} ج.م</td>
                          <td className="ops-td">
                            <button onClick={() => TitanEngine.Security.resetHardwareID(st.id)} className="icon-btn"><RefreshCcw size={16}/></button>
                            <button onClick={() => TitanEngine.Security.fullLock(st.id, "إيقاف إداري")} className="icon-btn danger"><Lock size={16}/></button>
                            <button className="icon-btn"><Settings size={16}/></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* 3. CODES ENGINE (محرك الأكواد المالي) */}
            {tab === 'finance' && (
              <motion.div key="f" initial={{opacity:0}} animate={{opacity:1}} className="finance-layout">
                <div className="gen-box glass-card">
                  <h3>توليد دفعات أكواد شحن</h3>
                  <div className="input-group">
                    <label>الكمية</label>
                    <input type="number" id="genCount" placeholder="500" />
                  </div>
                  <div className="input-group">
                    <label>القيمة (جنيه)</label>
                    <input type="number" id="genVal" placeholder="100" />
                  </div>
                  <div className="input-group">
                    <label>المركز / الموزع</label>
                    <input type="text" id="genDist" placeholder="Main Office" />
                  </div>
                  <button className="btn-primary-full" onClick={async () => {
                    const codes = await TitanEngine.Finance.generateSecureCodes({
                      count: document.getElementById('genCount').value,
                      value: document.getElementById('genVal').value,
                      prefix: 'MAFAT',
                      distributor: document.getElementById('genDist').value
                    });
                    alert(`تم توليد ${codes.length} كود بنجاح!`);
                  }}>بدء التوليد والتشفير</button>
                </div>
                <div className="finance-insights glass-card">
                  <h3>تحليلات الخزينة</h3>
                </div>
              </motion.div>
            )}
            {/* 6. VIEW: AI LAB (تحليل سلوك الطلاب بالذكاء الاصطناعي) */}
            {tab === 'ai' && (
              <motion.div key="ai" initial={{opacity:0}} animate={{opacity:1}} className="ai-lab-container">
                <div className="ai-header glass-card">
                  <div className="ai-title">
                    <Target className="pulse-icon" />
                    <h2>TITAN AI : تحليلات التنبؤ بالسلوك</h2>
                  </div>
                  <p>يقوم المحرك الآن بتحليل نشاط {students.length} طالب للتنبؤ بمعدلات التسرب والغش.</p>
                </div>

                <div className="ai-grid">
                  <div className="glass-card ai-stat">
                    <h4>معدل الالتزام العام</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={aiMockData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                          {aiMockData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="ai-legend">
                      <span><i style={{background: '#10b981'}}></i> ملتزم</span>
                      <span><i style={{background: '#f59e0b'}}></i> متذبذب</span>
                      <span><i style={{background: '#ef4444'}}></i> معرض للخطر</span>
                    </div>
                  </div>

                  <div className="glass-card ai-reports">
                    <h3>تقارير المخاطر الأمنية</h3>
                    <div className="report-list">
                      {students.filter(s => s.status === 'BANNED').slice(0, 5).map(s => (
                        <div className="report-item danger" key={s.id}>
                          <Fingerprint size={16} />
                          <div className="report-details">
                            <b>محاولة تخطي حماية: {s.name}</b>
                            <p>تم رصد محاولة تشغيل محاكي (Emulator) الساعة 10:30 م</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 7. VIEW: EXAM CONTROL (إدارة الامتحانات والنتائج) */}
            {tab === 'exams' && (
              <motion.div key="ex" initial={{x: 50, opacity: 0}} animate={{x: 0, opacity: 1}} className="exam-module">
                <div className="exam-toolbar glass-card">
                  <button className="btn-primary" onClick={() => createNewExam()}>
                    <PlusSquare size={18} /> إنشاء امتحان جديد
                  </button>
                  <div className="filter-group">
                    <select><option>كل المجموعات</option></select>
                    <button className="btn-outline"><History size={16} /> الأرشيف</button>
                  </div>
                </div>

                <div className="exams-list-grid">
                  {[1, 2, 3].map(ex => (
                    <div className="exam-card glass-card" key={ex}>
                      <div className="exam-badge">LIVE</div>
                      <h3>امتحان الفيزياء الشامل - نموذج {ex}</h3>
                      <div className="exam-meta">
                        <span><Users size={14}/> 450 طالب</span>
                        <span><Award size={14}/> متوسط الدرجات: 85%</span>
                      </div>
                      <div className="exam-ops">
                        <button className="btn-sm-view"><Eye size={14}/> النتائج</button>
                        <button className="btn-sm-edit"><Settings size={14}/> إعدادات</button>
                        <button className="btn-sm-stop"><Lock size={14}/> إيقاف</button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 8. VIEW: SUPPORT CENTER (مركز الدعم الفني اللحظي) */}
            {tab === 'support' && (
              <motion.div key="sup" initial={{opacity:0}} animate={{opacity:1}} className="support-workstation">
                <div className="support-layout">
                  <div className="tickets-sidebar glass-card">
                    <h3>التذاكر النشطة</h3>
                    <div className="ticket-list">
                      {[1,2,3,4].map(t => (
                        <div key={t} className="ticket-item-preview">
                          <div className="status-indicator online"></div>
                          <div className="t-meta">
                            <b>مشكلة في شحن الكود #{t * 452}</b>
                            <p>الطالب: أحمد محمد ...</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="chat-interface glass-card">
                    <div className="chat-header">
                      <div className="user-profile">
                        <div className="u-avatar">A</div>
                        <div><b>أحمد محمد</b><small>متصل الآن</small></div>
                      </div>
                      <div className="chat-ops">
                        <button className="icon-btn"><Lock size={16}/></button>
                        <button className="icon-btn danger"><Trash2 size={16}/></button>
                      </div>
                    </div>
                    <div className="chat-messages">
                      <div className="msg-received">أهلاً يا مستر، الكود مش شغال معايا</div>
                      <div className="msg-sent">مرحباً أحمد، ابعت صورة الكود وهنفحصه حالاً</div>
                    </div>
                    <div className="chat-input-area">
                      <input type="text" placeholder="اكتب ردك هنا..." />
                      <button className="btn-send"><Send size={18}/></button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 9. VIEW: DATABASE TERMINAL (محاكي قاعدة البيانات) */}
            {tab === 'terminal' && (
              <motion.div key="term" initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}} className="terminal-view">
                <div className="terminal-window">
                  <div className="terminal-header">
                    <div className="dots"><span className="red"></span><span className="yellow"></span><span className="green"></span></div>
                    <span>Titan System Terminal v1.0.0</span>
                  </div>
                  <div className="terminal-body">
                    <p className="cmd">> TITAN_OS --INITIALIZE</p>
                    <p className="res">System initialized in 245ms...</p>
                    <p className="cmd">> CHECK_FIREBASE_AUTH</p>
                    <p className="res">Status: 200 OK | Connection: Secure</p>
                    <p className="cmd">> LIST_ACTIVE_ADMINS</p>
                    <p className="res">1. Master_Admin (Online)</p>
                    <div className="cursor"></div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 10. VIEW: LIVE MONITOR (مراقبة البث المباشر والدروس الحية) */}
            {tab === 'live' && (
              <motion.div key="live" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="live-monitor-grid">
                <div className="stream-status glass-card">
                  <div className="live-indicator"><span className="blink-red"></span> LIVE: مراجعة ليلة الامتحان</div>
                  <div className="viewer-stats"><Users size={20} /> <span>1,240 مشاهد حالياً</span></div>
                  <div className="stream-preview">
                    <div className="video-placeholder">
                      <Radio size={48} className="pulse" />
                      <p>Signal Strength: Excellent (4.2 Mbps)</p>
                    </div>
                  </div>
                </div>
                <div className="live-chat-monitor glass-card">
                  <h3>الرقابة على المحادثة</h3>
                  <div className="moderation-logs">
                    <p><span>12:01</span> <b>سيستم:</b> تم حظر كلمة "غش" تلقائياً.</p>
                    <p><span>12:05</span> <b>أدمن:</b> الرجاء التركيز في الشرح.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 11. VIEW: FORENSIC DATA (التحليل الجنائي الرقمي) */}
            {tab === 'forensic' && (
              <motion.div key="for" initial={{ y: 20 }} animate={{ y: 0 }} className="forensic-view">
                <div className="alert-ribbon">تنبيه: تم رصد 3 محاولات استخدام Proxies في آخر ساعة</div>
                <div className="forensic-grid">
                  <div className="glass-card hardware-check">
                    <h3>بصمة الأجهزة (Fingerprinting)</h3>
                    <table className="mini-table">
                      <thead>
                        <tr><th>الطالب</th><th>المتصفح</th><th>المعالج</th><th>درجة الثقة</th></tr>
                      </thead>
                      <tbody>
                        {students.slice(0, 5).map(s => (
                          <tr key={s.id}>
                            <td>{s.name}</td>
                            <td>Chrome/Win11</td>
                            <td>Intel i7 Gen 12</td>
                            <td><span className="trust-high">99%</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="glass-card network-map">
                    <h3>توزيع الطلاب جغرافياً</h3>
                    <div className="map-mockup">
                      <Globe size={100} className="globe-icon" />
                      <p>القاهرة: 80% | الإسكندرية: 10% | أخرى: 10%</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 13. VIEW: WALLET & FINANCE (الخزينة والتقارير المالية) */}
            {tab === 'finance_advanced' && (
              <motion.div key="fin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="finance-dashboard">
                <div className="finance-top-row">
                  <div className="glass-card balance-card">
                    <div className="balance-info">
                      <p>إجمالي التحصيل الكلي</p>
                      <h1>450,230 <small>EGP</small></h1>
                    </div>
                    <CreditCard size={40} className="card-icon-bg" />
                  </div>
                </div>
                <div className="glass-card transaction-table">
                  <h3>سجل المعاملات الأخيرة</h3>
                  <table className="titan-table">
                    <thead>
                      <tr><th>الطالب</th><th>نوع العملية</th><th>المبلغ</th><th>الحالة</th></tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>محمد علي</td><td>شحن كود</td><td>100 ج.م</td>
                        <td><span className="badge-success">ناجحة</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* 14. VIEW: ADMINS & ROLES (إدارة المسؤولين) */}
            {tab === 'admins' && (
              <motion.div key="adm" className="admins-view glass-card">
                <div className="section-title"><ShieldCheck size={22} /> <h3>إدارة طاقم العمل</h3></div>
                <div className="admin-list">
                  <div className="admin-card-detailed">
                    <b>Master Admin</b>
                    <p>Access Level: Root</p>
                    <button className="btn-edit-roles">تعديل الصلاحيات</button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* التبويب الختامي: معلومات النظام */}
            {tab === 'settings' && (
              <motion.div key="sys" initial={{opacity:0}} animate={{opacity:1}} className="glass-card">
                <h3><Server size={20}/> حالة البنية التحتية</h3>
                <div className="system-grid">
                  <div className="sys-item">
                    <span>قاعدة البيانات (Firestore):</span>
                    <b className="text-success">متصلة (Latency: 12ms)</b>
                  </div>
                  <div className="sys-item">
                    <span>إصدار النواة:</span>
                    <code>Titan_Kernel_v4.5.0_Build_2026</code>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence> 
        </div> {/* نهاية main-viewport */}
      </main>
    </div>
  );
};

export default AdminDash;
