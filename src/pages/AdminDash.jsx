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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import './AdminDash.css';

/**
 * ============================================================
 * [1] THE ENGINE CORE (المحركات البرمجية الجبارة)
 * ============================================================
 */

const TitanEngine = {
  // محرك الأمان الاستباقي
  Security: {
    async banStudent(id, reason, adminName) {
      const batch = writeBatch(db);
      batch.update(doc(db, "users", id), {
        status: 'BANNED',
        banReason: reason,
        bannedBy: adminName,
        bannedAt: serverTimestamp()
      });
      await batch.commit();
      // طرد لحظي عبر RTDB
      await set(ref(rtdb, `active_sessions/${id}/kill`), {
        signal: 'TERMINATE',
        reason: reason,
        timestamp: Date.now()
      });
    },
    async resetDevice(id) {
      await updateDoc(doc(db, "users", id), { deviceId: null, lastReset: serverTimestamp() });
    }
  },

  // محرك التوليد المالي الضخم
  Finance: {
    async generateCodes(config) {
      const { count, value, prefix, distributor, type } = config;
      const batch = writeBatch(db);
      const codesLog = [];
      for (let i = 0; i < count; i++) {
        const code = `${prefix}-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const ref = doc(db, "billing_codes", code);
        batch.set(ref, {
          code, value: Number(value), isUsed: false,
          distributor, type, createdAt: serverTimestamp()
        });
        codesLog.push(code);
      }
      await batch.commit();
      return codesLog;
    }
  },

  // محرك الأكاديمية والمحتوى
  Academy: {
    async createCourse(data, file) {
      let url = "";
      if (file) {
        const s = sRef(storage, `courses/${Date.now()}_${file.name}`);
        await uploadBytes(s, file);
        url = await getDownloadURL(s);
      }
      return await addDoc(collection(db, "courses"), { ...data, thumbnail: url, students: 0 });
    }
  }
};

/**
 * ============================================================
 * [2] THE MASTER COMPONENT (اللوحة الرئيسية)
 * ============================================================
 */

export default function AdminDash() {
  // --- States ---
  const [tab, setTab] = useState('radar');
  const [loading, setLoading] = useState(true);
  const [isEmergency, setIsEmergency] = useState(false);
  const [stats, setStats] = useState({ online: 0, totalUsers: 0, sales: 0, threats: 0 });
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [chartData, setChartData] = useState([]);

  // --- Real-time Listeners (النبض اللحظي للمنصة) ---
  useEffect(() => {
    // 1. مراقبة المتصلين الآن
    const unsubOnline = onValue(ref(rtdb, 'active_sessions'), (snap) => {
      setStats(s => ({ ...s, online: snap.exists() ? Object.keys(snap.val()).length : 0 }));
    });

    // 2. مراقبة سجل التهديدات الأمنية
    const qLogs = query(collection(db, "security_incidents"), orderBy("timestamp", "desc"), limit(50));
    const unsubLogs = onSnapshot(qLogs, (snap) => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setStats(s => ({ ...s, threats: snap.size }));
    });

    // 3. جلب بيانات المستخدمين
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setStats(s => ({ ...s, totalUsers: snap.size }));
      setLoading(false);
    });

    return () => { unsubOnline(); unsubLogs(); unsubUsers(); };
  }, []);

  // --- Emergency Functions ---
  const triggerKillSwitch = async () => {
    if (window.confirm("تحذير نووي: سيتم طرد جميع الطلاب وإغلاق المنصة حالاً!")) {
      setIsEmergency(true);
      await set(ref(rtdb, 'system_control/global_kill'), { status: true, time: Date.now() });
      setTimeout(() => setIsEmergency(false), 5000);
    }
  };

  return (
    <div className={`titan-root ${isEmergency ? 'emergency-active' : ''}`}>
      
      {/* Sidebar - القائمة الجانبية الذكية */}
      <aside className="titan-sidebar">
        <div className="brand">
          <div className="logo-glow"><Cpu size={30} /></div>
          <div className="brand-name">TITAN <span>PRO</span></div>
        </div>

        <nav className="nav-links">
          <NavBtn id="radar" icon={<Activity/>} label="الرادار اللحظي" active={tab} set={setTab} />
          <NavBtn id="users" icon={<Users/>} label="إدارة الجيوش (الطلاب)" active={tab} set={setTab} />
          <NavBtn id="security" icon={<ShieldAlert/>} label="الأمن القومي" active={tab} set={setTab} />
          <NavBtn id="finance" icon={<CreditCard/>} label="البنك المركزي" active={tab} set={setTab} />
          <NavBtn id="content" icon={<Layers/>} label="مخازن المحتوى" active={tab} set={setTab} />
          <NavBtn id="ai" icon={<Terminal/>} label="TITAN AI Lab" active={tab} set={setTab} />
        </nav>

        <div className="sidebar-bottom">
          <div className="system-health">
            <div className="health-bar"><div className="fill" style={{width: '98%'}}></div></div>
            <span>System Health: 98%</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="titan-container">
        <header className="titan-topbar">
          <div className="search-wrapper">
            <Search size={18} />
            <input placeholder="ابحث عن طالب، كود، أو IP..." />
          </div>

          <div className="topbar-actions">
            <div className="live-clock">{new Date().toLocaleTimeString()}</div>
            <button className="kill-btn" onClick={triggerKillSwitch}>
              <Zap size={16} /> KILL SWITCH
            </button>
            <div className="admin-badge">
              <div className="avatar">A</div>
              <span>Master Admin</span>
            </div>
          </div>
        </header>

        <div className="titan-content">
          <AnimatePresence mode="wait">
            
            {/* VIEW: RADAR (الرادار العام) */}
            {tab === 'radar' && (
              <motion.div key="radar" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0}}>
                <div className="stats-grid">
                  <QuickStat icon={<Wifi/>} label="المتصلين الآن" val={stats.online} color="#10b981" />
                  <QuickStat icon={<Users/>} label="إجمالي القاعدة" val={stats.totalUsers} color="#3b82f6" />
                  <QuickStat icon={<ShieldAlert/>} label="تهديدات محجوبة" val={stats.threats} color="#ef4444" />
                  <QuickStat icon={<TrendingUp/>} label="نمو اليوم" val="+14%" color="#f59e0b" />
                </div>

                <div className="visual-section">
                  <div className="chart-main glass-panel">
                    <h3>تحليل النشاط الشبكي</h3>
                    <div className="chart-container">
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={mockChartData}>
                          <defs>
                            <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="name" stroke="#64748b" />
                          <YAxis stroke="#64748b" />
                          <Tooltip contentStyle={{backgroundColor: '#0f172a', border: 'none'}} />
                          <Area type="monotone" dataKey="users" stroke="#3b82f6" fillOpacity={1} fill="url(#colorPv)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="log-sidebar glass-panel">
                    <h3>آخر العمليات الأمنية</h3>
                    <div className="mini-logs">
                      {logs.slice(0, 10).map(l => (
                        <div key={l.id} className="log-item">
                          <div className="log-dot"></div>
                          <div className="log-text">
                            <b>{l.studentName}</b> {l.type}
                            <span>{new Date(l.timestamp?.seconds * 1000).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* VIEW: USERS (إدارة الطلاب) */}
            {tab === 'users' && (
              <motion.div key="users" initial={{opacity:0}} animate={{opacity:1}} className="glass-panel">
                <div className="panel-header">
                  <h2>قاعدة بيانات الطلاب الاستراتيجية</h2>
                  <div className="actions">
                    <button className="btn-icon"><Download size={18}/></button>
                    <button className="btn-primary"><UserPlus size={18}/> إضافة طالب</button>
                  </div>
                </div>
                
                <div className="table-responsive">
                  <table className="titan-table">
                    <thead>
                      <tr>
                        <th>الطالب</th>
                        <th>الحالة</th>
                        <th>الجهاز المحمي</th>
                        <th>الرصيد</th>
                        <th>آخر ظهور</th>
                        <th>التحكم</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id}>
                          <td className="user-info">
                            <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${u.id}`} />
                            <div><b>{u.name}</b><span>{u.phone}</span></div>
                          </td>
                          <td><span className={`status-pill ${u.status}`}>{u.status}</span></td>
                          <td><code className="device-id">{u.deviceId ? u.deviceId.substring(0,12) : 'غير مرتبط'}</code></td>
                          <td>{u.balance || 0} ج.م</td>
                          <td>منذ 2د</td>
                          <td className="ops">
                            <button className="op-btn" onClick={() => TitanEngine.Security.resetDevice(u.id)} title="فك ارتباط الجهاز"><RefreshCcw size={16}/></button>
                            <button className="op-btn ban" onClick={() => TitanEngine.Security.banStudent(u.id, "مخالفة سياسة المنصة", "Admin")}><Lock size={16}/></button>
                            <button className="op-btn"><Settings size={16}/></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* VIEW: FINANCE (البنك المركزي) */}
            {tab === 'finance' && (
               <motion.div key="finance" initial={{opacity:0}} animate={{opacity:1}} className="finance-grid">
                  <div className="generator-card glass-panel">
                    <h3>توليد أكواد الشحن (Bulk Generation)</h3>
                    <div className="form-group">
                      <label>Prefix (بادئة الكود)</label>
                      <input type="text" placeholder="مثلاً MAFAT" id="prefix" />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>الكمية</label>
                        <input type="number" id="count" />
                      </div>
                      <div className="form-group">
                        <label>القيمة</label>
                        <input type="number" id="val" />
                      </div>
                    </div>
                    <button className="btn-primary-full" onClick={async () => {
                      const codes = await TitanEngine.Finance.generateCodes({
                        count: document.getElementById('count').value,
                        value: document.getElementById('val').value,
                        prefix: document.getElementById('prefix').value,
                        distributor: 'Main Office',
                        type: 'Wallet'
                      });
                      alert(`تم توليد ${codes.length} كود بنجاح`);
                    }}>توليد وتشفير الأكواد</button>
                  </div>

                  <div className="finance-stats glass-panel">
                    <h3>ملخص الخزينة</h3>
                    <div className="f-stat"><span>أرباح الشهر:</span> <b>125,000 ج.م</b></div>
                    <div className="f-stat"><span>أكواد مفعلة اليوم:</span> <b>412</b></div>
                    <div className="f-stat"><span>سيولة معلقة:</span> <b>18,200 ج.م</b></div>
                    <button className="btn-outline-full"><FileText size={16} /> استخراج تقرير مالي</button>
                  </div>
               </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

/**
 * ============================================================
 * [3] HELPER COMPONENTS (المكونات المساعدة)
 * ============================================================
 */

function NavBtn({ id, icon, label, active, set }) {
  return (
    <button className={`nav-btn ${active === id ? 'active' : ''}`} onClick={() => set(id)}>
      {icon} <span>{label}</span>
      {active === id && <motion.div layoutId="pill" className="active-pill" />}
    </button>
  );
}

function QuickStat({ icon, label, val, color }) {
  return (
    <div className="stat-card glass-panel" style={{"--accent": color}}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-data">
        <p>{label}</p>
        <h3>{val}</h3>
      </div>
    </div>
  );
}

const mockChartData = [
  {name: '00:00', users: 400}, {name: '04:00', users: 120},
  {name: '08:00', users: 900}, {name: '12:00', users: 1500},
  {name: '16:00', users: 2100}, {name: '20:00', users: 1800},
];
// التكملة البرمجية للمكونات الصغيرة التي تضمن استقرار الواجهة
const NavBtn = ({ id, icon, label, active, set }) => (
  <button 
    className={`nav-btn ${active === id ? 'active' : ''}`} 
    onClick={() => set(id)}
  >
    <div className="btn-content">
      {icon}
      <span>{label}</span>
    </div>
    {active === id && <motion.div layoutId="active-bg" className="active-bg" />}
  </button>
);

const QuickStat = ({ icon, label, val, color }) => (
  <div className="stat-card glass-panel" style={{ "--accent": color }}>
    <div className="stat-icon-wrapper" style={{ backgroundColor: `${color}22`, color: color }}>
      {icon}
    </div>
    <div className="stat-info">
      <p>{label}</p>
      <h3>{val}</h3>
    </div>
    <div className="stat-shimmer"></div>
  </div>
);

// تصدير المكون كافتراضي
export default AdminDash;
