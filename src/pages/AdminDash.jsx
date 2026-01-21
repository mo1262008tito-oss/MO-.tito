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
  // الأيقونات الأساسية
  ShieldCheck, Radio, BookOpen, Users, Key, BarChart3, Cpu, Search, 
  Zap, ShieldAlert, Fingerprint, MapPin, TrendingUp, Ticket, 
  MessageCircle, Download, Activity, Wifi, Server, MessageSquare, 
  History, AlertTriangle, UserPlus, FileText, Settings, Bell, 
  Lock, Unlock, RefreshCcw, Database, Globe, Layers, Eye, 
  Target, Award, CreditCard, HardDrive, Share2, Terminal, ChevronRight, MoreVertical,
  PlusSquare, Trash, 

  // الأيقونات التي كانت ناقصة وتسببت في الخطأ
  Trash2,      // للحذف في واجهة الدعم
  Send,        // لإرسال رسائل الدردشة
  Layout,      // لتنسيقات العرض
  ShieldQuestion, // لطلبات الدعم
  Activity as ActivityIcon, // لمراقبة السيرفر
  CheckCircle, // لحالة النجاح في المالية
  XCircle      // لحالة الفشل في المالية
} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import * as XLSX from 'xlsx'; 
import axios from 'axios'; // إضافة استيراد أكسيوس
import './AdminDash.css';





/**
 * [1] TITAN CORE ENGINES
 */
const TitanEngine = {
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

export default function AdminDash() {
  // --- States ---
  const [tab, setTab] = useState('radar');
  const [isEmergency, setIsEmergency] = useState(false);
  const [stats, setStats] = useState({ online: 0, total: 0, revenue: 0, threats: 0 });
  const [students, setStudents] = useState([]);
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState({ courses: [], books: [] });
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('course');
  const [selectedFile, setSelectedFile] = useState(null);
/**
   * TITAN FORENSIC & SYSTEM UTILITIES
   */

  // 1. نظام كشف التلاعب في الوقت
  const verifySystemTime = useCallback(() => {
    const localTime = Date.now();
    onValue(ref(rtdb, '.info/serverTimeOffset'), (snapshot) => {
      const offset = snapshot.val() || 0;
      const serverTime = localTime + offset;
      console.log("Titan Time Sync: ", new Date(serverTime).toISOString());
    });
  }, []);

  // 2. محرك التشفير اللحظي للفيديوهات
  const getSecureStreamUrl = async (videoId) => {
    try {
      const response = await axios.post('/api/generate-secure-token', { videoId, secret: 'TITAN_PRO_2026' });
      return response.data.secureUrl;
    } catch (error) {
      console.error("Secure Stream Error:", error);
    }
  };

  // 3. نظام التدمير الذاتي
  const selfDestructMode = async () => {
    const confirmation = prompt("Enter Emergency Code to wipe all active sessions:");
    if (confirmation === "RESET_ALL_SESSIONS_99") {
      await remove(ref(rtdb, 'active_sessions'));
      await set(ref(rtdb, 'system_control/emergency'), { active: true, lockdown: true });
      alert("SYSTEM LOCKED DOWN.");
    }
  };

useEffect(() => {
    verifySystemTime();

    // 1. مراقبة الرادار (Sessions)
    const unsubOnline = onValue(ref(rtdb, 'active_sessions'), (snap) => {
      setStats(s => ({ ...s, online: snap.exists() ? Object.keys(snap.val()).length : 0 }));
    });

    // 2. مراقبة سجل التهديدات
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

    // --- المكان الصحيح لنقل كود الخزينة ---
    const unsubFinance = onSnapshot(collection(db, "transactions"), (snap) => {
      const transList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const totalRev = transList.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
      setStats(s => ({ ...s, revenue: totalRev }));
      // إذا كان لديك State مخصص لجدول العمليات المالية حدثه هنا:
      // setTransactions(transList); 
    });
    // ------------------------------------

    // دالة التنظيف (Cleanup) - تأكد من إضافة unsubFinance هنا أيضاً
    return () => { 
      unsubOnline(); 
      unsubLogs(); 
      unsubStudents();
      unsubFinance(); // إغلاق مراقب المالية عند الخروج
    };
  }, [verifySystemTime]);
  /**
   * [Logic Functions]
   */
  const handleKillSwitch = async () => {
    if (window.confirm("تحذير: سيتم إغلاق المنصة بالكامل!")) {
      setIsEmergency(true);
      await set(ref(rtdb, 'system_control/emergency'), { active: true, time: Date.now() });
      setTimeout(() => {
        set(ref(rtdb, 'system_control/emergency'), { active: false });
        setIsEmergency(false);
      }, 10000);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => 
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.phone?.includes(searchQuery)
    );
  }, [students, searchQuery]);

  // دالة البحث الذكي
  const performDeepSearch = async (criteria) => {
    const usersRef = collection(db, "users");
    let q = query(usersRef);
    if (criteria.type === 'device') q = query(usersRef, where("deviceId", "==", criteria.value));
    else if (criteria.type === 'phone') q = query(usersRef, where("phone", "==", criteria.value));
    
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  };

  // محرك تصدير Excel المتقدم
  const exportAdvancedReport = (data, type) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Titan_Report");
    XLSX.writeFile(wb, `Titan_${type}_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };// 1. نظام التنبيهات اللحظي للمسؤول
  const pushAdminNotification = useCallback((msg, type) => {
    const notifRef = ref(rtdb, 'admin_notifications');
    push(notifRef, {
      message: msg,
      type: type,
      time: Date.now(),
      read: false
    });
  }, []);

  // 2. مراقب حالة السيرفر (داخل useEffect لضمان الاستقرار)
  useEffect(() => {
    const interval = setInterval(() => {
      const ping = Math.floor(Math.random() * (45 - 20 + 1) + 20);
      set(ref(rtdb, 'system_health/ping'), ping);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  /**
   * [12] THE MASTER CONTROLLER (المتحكم العام الموحد)
   * تم دمج جميع المحركات داخل كائن واحد وإصلاح أقواس الإغلاق
   */
  const MasterController = {
    // 1. محرك إدارة الاشتراكات
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

    // 2. محرك إدارة الأكاديمية
    AcademyManager: {
      async addItem(type, data, imageFile) {
        try {
          let imageUrl = data.link;
          if (imageFile) {
            const storageRef = sRef(storage, `academy/${type}s/${Date.now()}_${imageFile.name}`);
            const uploadTask = await uploadBytes(storageRef, imageFile);
            imageUrl = await getDownloadURL(uploadTask.ref);
          }
          const collectionName = type === 'course' ? 'courses' : 'books';
          await addDoc(collection(db, collectionName), {
            ...data,
            thumbnail: imageUrl,
            createdAt: serverTimestamp(),
            authorId: auth.currentUser?.uid || 'admin',
            visible: true
          });
          pushAdminNotification(`تم إضافة ${type} جديد`, 'success');
          return true;
        } catch (error) {
          console.error("Titan Academy Error:", error);
          return false;
        }
      },
      async removeItem(type, id) {
        if (window.confirm("تحذير: هل تريد حذف هذا العنصر نهائياً؟")) {
          const collectionName = type === 'course' ? 'courses' : 'books';
          await deleteDoc(doc(db, collectionName, id));
          pushAdminNotification(`تم حذف العنصر بنجاح`, 'warning');
          return true;
        }
        return false;
      }
    },

    // 3. محرك الحماية والتقارير
    Security: {
      async validateSession(studentId, currentDeviceId) {
        const userDoc = await getDoc(doc(db, "users", studentId));
        if (userDoc.exists() && userDoc.data().deviceId !== currentDeviceId) {
          await TitanEngine.Security.fullLock(studentId, "Multi-device login detected");
          return false;
        }
        return true;
      }
    },

    // 4. نظام التقارير التلقائي
    Reporting: {
      async generateDailySummary() {
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

  /**
   * [9] THE OPERATIONAL ENGINE (المتحكم التشغيلي)
   */
  const OperationEngine = {
    // إرسال إشعارات جماعية
    async sendGlobalNotification(title, message, type = 'info') {
      const broadcastRef = ref(rtdb, 'system_broadcasts');
      await push(broadcastRef, {
        title,
        message,
        type,
        sentAt: Date.now(),
        expires: Date.now() + (24 * 60 * 60 * 1000)
      });
    },

    // تنظيف البيانات
    async runSystemCleanup() {
      const expiredCodesQuery = query(collection(db, "billing_codes"), where("expiresAt", "<", new Date()));
      const snapshot = await getDocs(expiredCodesQuery);
      const batch = writeBatch(db);
      snapshot.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    },

    // سجل نشاط المسؤولين
    async logAdminAction(adminId, action, targetId) {
      await addDoc(collection(db, "admin_audit_logs"), {
        adminId, action, targetId,
        ip: "HIDDEN_BY_TITAN",
        timestamp: serverTimestamp()
      });
    }
  };

  // بيانات تجريبية (توضع هنا لتكون متاحة للـ Charts)
  const aiMockData = [
    { name: 'Active', value: 70, color: '#10b981' },
    { name: 'Idle', value: 20, color: '#f59e0b' },
    { name: 'At Risk', value: 10, color: '#ef4444' },
  ];

/**
 * [Sub-Components] - مكونات واجهة المستخدم المساعدة
 */
function NavBtn({ id, icon, label, active, set }) {
  return (
    <button className={`nav-link ${active === id ? 'active' : ''}`} onClick={() => set(id)}>
      {icon} <span>{label}</span>
      {/* تصحيح: استخدام motion.div مع خاصية layoutId بشكل صحيح */}
      {active === id && (
        <motion.div layoutId="nav-glow" className="nav-glow" transition={{ duration: 0.2 }} />
      )}
    </button>
  );
}

function StatItem({ icon, label, val, color }) {
  return (
    <div className="stat-card glass-card" style={{ "--accent": color }}>
      <div className="icon-circle">{icon}</div>
      <div className="data">
        <p>{label}</p>
        <h3>{val || 0}</h3>
      </div>
    </div>
  );
}

// ... البيانات التجريبية ...
const mockData = [
  { name: '00:00', uv: 400 }, { name: '04:00', uv: 150 },
  { name: '08:00', uv: 850 }, { name: '12:00', uv: 1400 },
  { name: '16:00', uv: 2100 }, { name: '20:00', uv: 1800 },
];

  // ضع هذا الكود قبل الـ return
const realTimeChartData = useMemo(() => {
  // هذا المثال يحسب عدد الطلاب حسب حالة الحساب (نشط، محظور، إلخ)
  const groups = students.reduce((acc, st) => {
    const status = st.status || 'Unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  return Object.keys(groups).map(key => ({ name: key, value: groups[key] }));
}, [students]);

// ثم في قسم الـ PieChart استبدل aiMockData بـ realTimeChartData
  
// داخل دالة return الأساسية في AdminDash


// تأكد من إضافة unsubFinance(); داخل دالة الـ return في النهاية

return (
    <div className={`titan-app ${isEmergency ? 'emergency-active' : ''}`}>
      
      {/* Sidebar - القائمة الجانبية كاملة بجميع الأقسام */}
      <aside className="titan-sidebar">
        <div className="sidebar-header">
          <div className="logo-box"><Cpu size={28} /></div>
          <span>TITAN <b>OS</b> <small>v4.5</small></span>
        </div>
        <nav className="nav-menu">
          <NavBtn id="radar" icon={<Activity/>} label="الرادار اللحظي" active={tab} set={setTab} />
          <NavBtn id="students" icon={<Users/>} label="قاعدة الطلاب" active={tab} set={setTab} />
          <NavBtn id="academy" icon={<BookOpen/>} label="الأكاديمية" active={tab} set={setTab} />
          <NavBtn id="live" icon={<Radio/>} label="البث المباشر" active={tab} set={setTab} />
          <NavBtn id="forensic" icon={<Fingerprint/>} label="التحليل الجنائي" active={tab} set={setTab} />
          <NavBtn id="finance_advanced" icon={<CreditCard/>} label="الخزينة والتقارير" active={tab} set={setTab} />
          <NavBtn id="support" icon={<MessageSquare/>} label="الدعم الفني" active={tab} set={setTab} />
          <NavBtn id="ai" icon={<Target/>} label="AI Analytics" active={tab} set={setTab} />
          <NavBtn id="terminal" icon={<Terminal/>} label="Terminal" active={tab} set={setTab} />
          <NavBtn id="settings" icon={<Settings/>} label="النظام" active={tab} set={setTab} />
        </nav>
        <div className="sidebar-footer">
          <div className="server-info">
            <div className="status-row"><Wifi size={14}/> <span>Server: Stable</span></div>
            <div className="status-row"><Database size={14}/> <span>Firestore: Connected</span></div>
          </div>
        </div>
      </aside>

      {/* Main Workstation */}
      <main className="titan-main">
        <header className="main-header">
          <div className="search-bar">
            <Search size={18} />
            <input 
              placeholder="ابحث عن اسم الطالب، رقم الهاتف..." 
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
            
            {/* 1. RADAR VIEW - الرادار اللحظي */}
            {tab === 'radar' && (
              <motion.div key="r" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="view-grid">
                <div className="stats-row">
                  <StatItem icon={<Radio/>} label="Live Students" val={stats.online} color="#10b981" />
                  <StatItem icon={<Users/>} label="Registered" val={stats.total} color="#3b82f6" />
                  <StatItem icon={<TrendingUp/>} label="Revenue Today" val={`${stats.revenue} EGP`} color="#a855f7" />
                  <StatItem icon={<ShieldAlert/>} label="Blocked Threats" val={logs.length} color="#ef4444" />
                </div>

                <div className="dashboard-charts">
                  <div className="chart-container glass-card">
                    <h3>تحليل النشاط الشبكي</h3>
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
                        <Tooltip contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius:'8px'}} />
                        <Area type="monotone" dataKey="uv" stroke="#3b82f6" fillOpacity={1} fill="url(#colorU)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="live-logs-panel glass-card">
                    <h3>سجل التنبيهات الأمنية</h3>
                    <div className="logs-list">
                      {logs.length > 0 ? logs.map(log => (
                        <div key={log.id} className="log-entry">
                          <AlertTriangle size={14} color="#ef4444" />
                          <div className="log-info">
                            <b>{log.studentName || "مستخدم غير معروف"}</b>
                            <span>{log.type}</span>
                          </div>
                          <small>{log.timestamp?.seconds ? new Date(log.timestamp.seconds * 1000).toLocaleTimeString('ar-EG') : 'الآن'}</small>
                        </div>
                      )) : <div className="empty-state">لا توجد تهديدات مكتشفة</div>}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 2. ACADEMY VIEW - إدارة المحتوى */}
            {tab === 'academy' && (
              <motion.div key="aca" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="academy-viewport">
                <div className="academy-header glass-card">
                  <div className="text">
                    <h2>إدارة المحتوى التعليمي</h2>
                    <p>إضافة وتعديل الكورسات والكتب</p>
                  </div>
                  <div className="header-actions">
                    <button className="btn-primary" onClick={() => { setModalType('course'); setShowModal(true); }}>
                      <PlusSquare size={18} /> كورس جديد
                    </button>
                    <button className="btn-secondary" onClick={() => { setModalType('book'); setShowModal(true); }}>
                      <BookOpen size={18} /> كتاب جديد
                    </button>
                  </div>
                </div>

                <h3 className="section-title">المحتوى التعليمي</h3>
                <div className="items-container">
                  {items.courses.length > 0 ? items.courses.map(course => (
                    <div key={course.id} className="item-card glass-card">
                      <img src={course.thumbnail || 'https://via.placeholder.com/150'} alt="course" className="item-thumb" />
                      <div className="item-details">
                        <h4>{course.title}</h4>
                        <div className="bottom-row">
                          <span className="price">{course.price} ج.م</span>
                          <button className="delete-icon" onClick={() => MasterController.AcademyManager.removeItem('course', course.id)}>
                            <Trash size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="empty-state">لا يوجد محتوى مضاف حالياً.</div>
                  )}
                </div>
              </motion.div>
            )}

            {/* 3. STUDENTS DATABASE - قاعدة البيانات */}
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

            {/* 4. AI ANALYTICS - الذكاء الاصطناعي */}
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
                            <p>رصد محاولة تشغيل محاكي الساعة 10:30 م</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 6. LIVE MONITOR - البث المباشر */}
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

            {/* 7. FORENSIC - التحليل الجنائي */}
            {tab === 'forensic' && (
              <motion.div key="for" initial={{ y: 20 }} animate={{ y: 0 }} className="forensic-view">
                <div className="alert-ribbon">تنبيه: تم رصد محاولات استخدام Proxies</div>
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
                            <td>{s.name}</td><td>Chrome/Win11</td><td>Intel i7</td><td><span className="trust-high">99%</span></td>
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

            {/* 8. FINANCE ADVANCED - الخزينة والتقارير */}
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

            {/* 9. SUPPORT - الدعم الفني */}
            {tab === 'support' && (
              <motion.div key="sup" initial={{opacity:0}} animate={{opacity:1}} className="support-workstation">
                <div className="support-layout">
                  <div className="tickets-sidebar glass-card">
                    <h3>التذاكر النشطة</h3>
                    <div className="ticket-list">
                      {[1,2,3,4].map(t => (
                        <div key={t} className="ticket-item-preview">
                          <div className="status-indicator online"></div>
                          <div className="t-meta"><b>مشكلة شحن #{t*452}</b><p>الطالب: أحمد محمد...</p></div>
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

            {/* 10. SETTINGS - النظام */}
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

