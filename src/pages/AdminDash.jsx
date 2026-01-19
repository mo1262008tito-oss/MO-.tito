import React, { useState, useEffect, useCallback, useRef } from 'react';
import { db, rtdb, auth, storage } from "../firebase";
import { 
  collection, query, where, getDocs, getDoc, doc, updateDoc, 
  addDoc, setDoc, increment, writeBatch, serverTimestamp, 
  orderBy, limit, deleteDoc, onSnapshot 
} from "firebase/firestore";
import { ref, set, onValue, update, remove, push, serverTimestamp as rtdbTimestamp } from "firebase/database";
import { ref as sRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { 
  ShieldCheck, Radio, BookOpen, Users, Key, BarChart3, Cpu, Search, 
  Zap, ShieldAlert, Fingerprint, MapPin, TrendingUp, Ticket, 
  MessageCircle, Download, Activity, Wifi, Server, MessageSquare, 
  History, AlertTriangle, UserPlus, FileText, Settings, Bell, 
  Lock, Unlock, RefreshCcw, Database, Globe, Layers, Eye, 
  Target, Award, CreditCard, HardDrive, Share2, Terminal
} from 'lucide-react';
import './AdminDash.css';

/**
 * [1] المحرك الأمني (TITAN SECURITY)
 */
export const TitanSecurity = {
  lockToDevice: async (studentId, fingerprint) => {
    const userRef = doc(db, "users", studentId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data.deviceId && data.deviceId !== fingerprint) {
        await TitanSecurity.triggerAutoBan(studentId, "DEVICE_LOCK_VIOLATION");
        return false;
      }
      if (!data.deviceId) await updateDoc(userRef, { deviceId: fingerprint });
    }
    return true;
  },

  triggerAutoBan: async (studentId, reason) => {
    await updateDoc(doc(db, "users", studentId), { 
      status: 'BANNED', 
      banReason: reason,
      bannedAt: serverTimestamp() 
    });
    set(ref(rtdb, `active_sessions/${studentId}/kill`), {
      state: true,
      reason: reason,
      time: Date.now()
    });
  },

  reportScreenshot: async (studentId, info) => {
    await addDoc(collection(db, "security_incidents"), {
      studentId,
      type: 'SCREEN_CAPTURE_DETECTED',
      details: info,
      timestamp: serverTimestamp()
    });
  }
};

/**
 * [2] المحرك المالي وتوليد الأكواد (FINANCIAL OPS)
 */
export const FinOps = {
  generateBulkCodes: async (config) => {
    const { count, amount, prefix, distributor, courseId } = config;
    const batch = writeBatch(db);
    const codes = [];
    const numCount = parseInt(count);

    for (let i = 0; i < numCount; i++) {
      const secureCode = `${prefix}-${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
      const codeRef = doc(db, "billing_codes", secureCode);
      batch.set(codeRef, {
        code: secureCode,
        value: Number(amount),
        isUsed: false,
        courseId: courseId || 'all',
        distributor: distributor || 'system',
        createdAt: serverTimestamp(),
        expiresAt: Date.now() + (90 * 24 * 60 * 60 * 1000)
      });
      codes.push(secureCode);
    }
    await batch.commit();
    return codes;
  }
};

/**
 * [3] محرك إدارة المحتوى (ACADEMY ENGINE)
 */
export const AcademyOps = {
  addNewCourse: async (courseData, thumbnailFile) => {
    try {
      let imageUrl = "";
      if (thumbnailFile) {
        // استخدام sRef لمنع التضارب مع RTDB ref
        const imageRef = sRef(storage, `courses/thumbs/${Date.now()}_${thumbnailFile.name}`);
        const uploadTask = await uploadBytes(imageRef, thumbnailFile);
        imageUrl = await getDownloadURL(uploadTask.ref);
      }

      const courseRef = await addDoc(collection(db, "courses"), {
        ...courseData,
        thumbnail: imageUrl,
        createdAt: serverTimestamp(),
        studentsCount: 0,
        lessonsCount: 0,
        rating: 5.0,
        isVisible: true
      });
      return { success: true, id: courseRef.id };
    } catch (error) {
      console.error("Error adding course:", error);
      return { success: false, error };
    }
  },

  uploadBook: async (bookData, pdfFile) => {
    // استخدام sRef هنا أيضاً
    const fileRef = sRef(storage, `library/${Date.now()}_${pdfFile.name}`);
    await uploadBytes(fileRef, pdfFile);
    const downloadURL = await getDownloadURL(fileRef);

    return await addDoc(collection(db, "library"), {
      title: bookData.title,
      price: Number(bookData.price),
      courseLink: bookData.courseId,
      fileUrl: downloadURL,
      downloads: 0,
      timestamp: serverTimestamp()
    });
  }
};

const AdminDash = () => {
  // مكان الـ Refs الصحيح داخل المكون
  const codeCountRef = useRef();
  const codeValueRef = useRef();
  const distributorRef = useRef();

  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState({ online: 0, students: 0, revenue: 0, alerts: 0 });
  
  // ... باقي الحالات (States) والمستمعات (Listeners) ...
};/**
 * ============================================================
 * [BATCH 2] محرك إدارة الطلاب والرقابة (STUDENT CONTROL)
 * ============================================================
 */
export const StudentOps = {
  // 1. جلب بيانات طالب معين مع كورساته
  getStudentFullProfile: async (studentId) => {
    try {
      const userSnap = await getDoc(doc(db, "users", studentId));
      const subsSnap = await getDocs(collection(db, `users/${studentId}/subscriptions`));
      
      return {
        profile: userSnap.exists() ? userSnap.data() : null,
        courses: subsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      };
    } catch (error) {
      console.error("Error fetching student profile:", error);
      return null;
    }
  },

  // 2. فك ارتباط الجهاز
  resetDevice: async (studentId) => {
    try {
      await updateDoc(doc(db, "users", studentId), {
        deviceId: null,
        lastReset: serverTimestamp()
      });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  // 3. إضافة كورس لطالب يدوياً
  enrollStudentInCourse: async (studentId, courseId) => {
    const courseSnap = await getDoc(doc(db, "courses", courseId));
    if (!courseSnap.exists()) return;
    
    const courseData = courseSnap.data();
    await setDoc(doc(db, `users/${studentId}/subscriptions`, courseId), {
      courseName: courseData.title,
      enrolledAt: serverTimestamp(),
      expiryDate: Date.now() + (365 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
      paidAmount: 0 
    });
  }
};

/**
 * ============================================================
 * [BATCH 3] المحرك المالي والتحليلي (FINANCIAL & ANALYTICS)
 * ============================================================
 */
export const AnalyticsOps = {
  // 1. جلب ملخص المبيعات اليومي الحقيقي
  getDailyRevenue: async () => {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const q = query(
      collection(db, "transactions"), 
      where("timestamp", ">=", today)
    );
    
    const snap = await getDocs(q);
    let total = 0;
    snap.forEach(doc => total += Number(doc.data().amount || 0));
    return total;
  },

  // 2. جلب عدد الطلاب الكلي من الداتابيز
  getTotalStudents: async () => {
    const snap = await getDocs(collection(db, "users"));
    return snap.size;
  }
};

/**
 * ============================================================
 * [3] المكون الرئيسي: أدمن داش (THE MASTER ADMIN COMPONENT)
 * ============================================================
 */
const AdminDash = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState({ online: 0, students: 0, revenue: 0, alerts: 0 });
  const [securityLogs, setSecurityLogs] = useState([]);
  const [isEmergency, setIsEmergency] = useState(false);

  useEffect(() => {
    // 1. تحديث الإحصائيات العامة عند التحميل
    const fetchGeneralStats = async () => {
      const totalSt = await AnalyticsOps.getTotalStudents();
      const dailyRev = await AnalyticsOps.getDailyRevenue();
      setStats(prev => ({ ...prev, students: totalSt, revenue: dailyRev }));
    };
    fetchGeneralStats();

    // 2. مراقبة الطلاب المتصلين الآن (Realtime)
    const activeRef = ref(rtdb, 'active_sessions');
    const unsubOnline = onValue(activeRef, (snap) => {
      const count = snap.exists() ? Object.keys(snap.val()).length : 0;
      setStats(prev => ({ ...prev, online: count }));
    });

    // 3. مراقبة التنبيهات الأمنية (Firestore Snapshot)
    const q = query(collection(db, "security_incidents"), orderBy("timestamp", "desc"), limit(10));
    const unsubSecurity = onSnapshot(q, (snap) => {
      setSecurityLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setStats(prev => ({ ...prev, alerts: snap.size }));
    });

    return () => {
      unsubOnline();
      unsubSecurity();
    };
  }, []);

  // --- تدمير الجلسات الفعلي (Global Kill Switch) ---
  const killAllSessions = async () => {
    if (window.confirm("تحذير: هذا الإجراء سيطرد جميع الطلاب المسجلين حالياً. هل تريد المتابعة؟")) {
      setIsEmergency(true);
      try {
        // نضع علامة "طرد" في السيرفر الرئيسي يراقبها تطبيق الطالب
        await set(ref(rtdb, 'system_control/kill_all'), {
          triggerTime: Date.now(),
          active: true
        });
        
        // إعادة الحالة بعد 5 ثواني
        setTimeout(async () => {
          await set(ref(rtdb, 'system_control/kill_all'), { active: false });
          setIsEmergency(false);
        }, 5000);
      } catch (err) {
        console.error("Kill Switch Failed:", err);
        setIsEmergency(false);
      }
    }
  };

  return (
    <div className={`titan-admin-layout ${isEmergency ? 'emergency-mode' : ''}`}>
      {/* Sidebar - بقية الكود كما هو مع التأكد من الربط مع الـ States */}
      <aside className={`titan-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-brand">
          <div className="brand-icon"><Cpu size={28} /></div>
          <div className="brand-text">
            <h2>TITAN <span>OS</span></h2>
            <p>Control Center v4.2</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">المركز الرئيسي</div>
          <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
            <Activity size={18}/> الإحصائيات الحيوية
          </button>
          
          <div className="nav-section">الأمان والرقابة</div>
          <button className={activeTab === 'security' ? 'active' : ''} onClick={() => setActiveTab('security')}>
            <ShieldAlert size={18}/> سجل الاختراقات
          </button>
          {/* ... بقية الأزرار بنفس النمط ... */}
        </nav>
      </aside>

      <main className="titan-main-content">
        <header className="titan-header">
          <div className="header-search">
            <Search size={20} />
            <input placeholder="ابحث في النظام..." />
          </div>

          <div className="header-actions">
            <div className="status-indicator">
              <div className="pulse-dot"></div>
              <span>السيرفر: مستقر</span>
            </div>
            
            <button className="emergency-kill-btn" onClick={killAllSessions}>
              <Zap size={18} /> تدمير الجلسات
            </button>
          </div>
        </header>

        <div className="titan-viewport">
          {activeTab === 'overview' && (
            <div className="module-container fade-in">
              <div className="top-stats-grid">
                {/* كارت الطلاب الحقيقي */}
                <div className="glass-card">
                  <div className="card-icon blue"><Users /></div>
                  <div className="card-data">
                    <p>الطلاب المسجلين</p>
                    <h3>{stats.students.toLocaleString()}</h3>
                  </div>
                </div>

                {/* كارت المتصلين الآن الحقيقي */}
                <div className="glass-card">
                  <div className="card-icon green"><Radio /></div>
                  <div className="card-data">
                    <p>متصل الآن</p>
                    <h3>{stats.online}</h3>
                  </div>
                </div>

                {/* كارت الأرباح الحقيقي */}
                <div className="glass-card">
                  <div className="card-icon purple"><CreditCard /></div>
                  <div className="card-data">
                    <p>أرباح اليوم</p>
                    <h3>{stats.revenue.toLocaleString()} ج.م</h3>
                  </div>
                </div>

                {/* كارت التنبيهات الحقيقي */}
                <div className="glass-card">
                  <div className="card-icon red"><ShieldAlert /></div>
                  <div className="card-data">
                    <p>تنبيهات أمنية</p>
                    <h3>{stats.alerts}</h3>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
              <div className="main-charts-row">
                <div className="chart-card-large glass-card">
                  <div className="card-header">
                    <h3><Activity size={18}/> حركة المنصة (آخر 24 ساعة)</h3>
                    <select>
                      <option>عرض بالساعة</option>
                      <option>عرض باليوم</option>
                    </select>
                  </div>
                  <div className="chart-placeholder">
                    {/* هنا يتم ربط مكتبة Recharts أو Chart.js */}
                    <div className="visual-graph-mockup"></div>
                  </div>
                </div>

                <div className="side-list-card glass-card">
                  <div className="card-header">
                    <h3><History size={18}/> آخر العمليات</h3>
                  </div>
                  <div className="mini-logs">
                    <div className="log-item">
                      <div className="log-icon plus"><UserPlus size={14}/></div>
                      <div className="log-text">طالب جديد: <b>عمر علي</b> انضم للمنصة</div>
                      <span className="log-time">1د</span>
                    </div>
                    <div className="log-item">
                      <div className="log-icon code"><Key size={14}/></div>
                      <div className="log-text">توليد 500 كود بواسطة <b>أدمن 2</b></div>
                      <span className="log-time">14د</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. SECURITY MODULE */}
          {activeTab === 'security' && (
            <div className="module-container fade-in">
              <div className="security-header glass-card">
                <div className="title">
                  <ShieldCheck size={24} color="#10b981" />
                  <h2>نظام الحماية الاستباقي (Sentinel)</h2>
                </div>
                <div className="actions">
                  <button className="btn-outline">تحميل التقرير الكامل</button>
                  <button className="btn-danger">تصفير السجل</button>
                </div>
              </div>

              <div className="security-grid">
                <div className="logs-table-container glass-card">
                  <table className="titan-table">
                    <thead>
                      <tr>
                        <th>الطالب</th>
                        <th>نوع المخالفة</th>
                        <th>الجهاز</th>
                        <th>التوقيت</th>
                        <th>الموقع IP</th>
                        <th>إجراء صارم</th>
                      </tr>
                    </thead>
                    <tbody>
                      {securityLogs.map((log) => (
                        <tr key={log.id} className={log.type.includes('DETECTED') ? 'critical-row' : ''}>
                          <td><b>{log.studentName || 'مجهول'}</b></td>
                          <td>
                            <span className="violation-tag">
                              {log.type === 'SCREEN_RECORD' ? 'تصوير شاشة' : 'تبديل نافذة'}
                            </span>
                          </td>
                          <td>{log.device || 'متصفح'}</td>
                          <td>{new Date(log.timestamp?.seconds * 1000).toLocaleTimeString()}</td>
                          <td>192.168.1.1</td>
                          <td>
                            <button className="action-btn ban" onClick={() => TitanSecurity.triggerAutoBan(log.studentId, "MANUAL_BAN")}>
                              حظر نهائي
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

/* 3. CODES ENGINE MODULE (نظام توليد الأكواد والمالية) */
          {activeTab === 'codes' && (
            <div className="module-container fade-in">
              <div className="admin-card-header">
                <div className="header-info">
                  <Key size={24} className="icon-glow" />
                  <h2>محرك توليد الأكواد الضخم (Bulk Engine)</h2>
                </div>
              </div>

              <div className="form-grid">
                <div className="glass-card input-group">
                  <label>عدد الأكواد المطلوبة</label>
                  <input type="number" id="codeCount" placeholder="مثال: 500" className="titan-input" />
                  
                  <label>قيمة الكود (بالجنيه)</label>
                  <input type="number" id="codeValue" placeholder="100" className="titan-input" />

                  <label>المنصة / الموزع</label>
                  <input type="text" id="distributor" placeholder="سنتر النخبة" className="titan-input" />
                  
                  <button className="generate-btn" onClick={async () => {
                    const codes = await FinOps.generateBulkCodes({
                      count: document.getElementById('codeCount').value,
                      amount: document.getElementById('codeValue').value,
                      prefix: 'TITAN',
                      distributor: document.getElementById('distributor').value
                    });
                    alert(`تم توليد ${codes.length} كود بنجاح!`);
                  }}>
                    <Zap size={18} /> بدء التوليد والتشفير
                  </button>
                </div>

                <div className="glass-card stats-display">
                  <h3>إحصائيات الأكواد</h3>
                  <div className="mini-stat"><span>أكواد غير مستخدمة:</span> <strong>1,420</strong></div>
                  <div className="mini-stat"><span>أكواد تم تفعيلها اليوم:</span> <strong>85</strong></div>
                  <div className="mini-stat"><span>إجمالي قيمة الأكواد بالسوق:</span> <strong>120,500 ج.م</strong></div>
                  <button className="export-btn"><Download size={16} /> تصدير ملف Excel للطباعة</button>
                </div>
              </div>
            </div>
          )}

          /* 4. AI & ANALYTICS MODULE (مختبر الذكاء الاصطناعي) */
          {activeTab === 'ai' && (
            <div className="module-container fade-in">
              <div className="ai-layout">
                <div className="ai-sidebar glass-card">
                  <h3><Cpu size={20} /> TITAN AI Lab</h3>
                  <button className="ai-tool-btn active">التنبؤ بالرسوب/الانسحاب</button>
                  <button className="ai-tool-btn">تحليل وقت الذروة</button>
                  <button className="ai-tool-btn">توزيع درجات الطلاب</button>
                </div>

                <div className="ai-main-view">
                  <div className="glass-card prediction-box">
                    <div className="box-header">
                      <Target color="#ef4444" />
                      <h4>طلاب في منطقة الخطر (Risk Level: High)</h4>
                    </div>
                    <p>بناءً على نشاط الطلاب لآخر 7 أيام، هؤلاء الطلاب معرضون لترك المنصة:</p>
                    <div className="risk-list">
                      <div className="risk-item">
                        <span>محمد محمود (غائب منذ 12 يوم)</span>
                        <button className="action-btn message">إرسال تنبيه</button>
                      </div>
                      <div className="risk-item">
                        <span>سارة يوسف (لم تكمل 3 حصص متتالية)</span>
                        <button className="action-btn coupon">إرسال كوبون تحفيزي</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          /* 5. SUPPORT & TICKETS (نظام الدعم الفني اللحظي) */
          {activeTab === 'support' && (
            <div className="module-container fade-in">
              <div className="support-layout">
                <div className="tickets-list glass-card">
                  <h3>التذاكر النشطة</h3>
                  <div className="ticket-item urgent">
                    <div className="ticket-meta"><span>#8821</span> <span className="urgent-label">عاجل</span></div>
                    <p>مشكلة في تفعيل كود الشحن</p>
                    <small>بواسطة: علي عمر</small>
                  </div>
                  <div className="ticket-item">
                    <div className="ticket-meta"><span>#8819</span></div>
                    <p>الفيديو لا يعمل على المتصفح</p>
                    <small>بواسطة: منى أحمد</small>
                  </div>
                </div>

                <div className="chat-window glass-card">
                  <div className="chat-header">
                    <h4>محادثة: علي عمر</h4>
                    <button className="archive-btn"><History size={16} /> أرشفة</button>
                  </div>
                  <div className="chat-messages">
                    <div className="msg student">الكود مش راضي يشحن وبيقولي مستخدم قبل كدة</div>
                    <div className="msg admin">أهلاً بك يا علي، يرجى إرسال صورة الكود المطبوع</div>
                  </div>
                  <div className="chat-input">
                    <input type="text" placeholder="اكتب ردك هنا..." />
                    <button className="send-btn"><MessageCircle size={18} /></button>
                  </div>
                </div>
              </div>
            </div>
          )}

          /* 6. STUDENTS & DATABASE (إدارة قاعدة البيانات) */
          {activeTab === 'students' && (
            <div className="module-container fade-in">
              <div className="db-controls glass-card">
                <div className="filters">
                  <select className="titan-select"><option>كل الدفعات</option></select>
                  <select className="titan-select"><option>الحسابات النشطة</option></select>
                  <button className="primary-btn"><UserPlus size={18} /> إضافة طالب يدوي</button>
                </div>
              </div>
              <div className="student-table-container glass-card">
                 {/* جدول الطلاب الضخم */}
                 <table className="titan-table">
                    <thead>
                      <tr>
                        <th>الاسم</th>
                        <th>رقم الهاتف</th>
                        <th>المستوى</th>
                        <th>النقاط (XP)</th>
                        <th>آخر ظهور</th>
                        <th>تحكم</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><b>مازن حسن</b></td>
                        <td>01023456789</td>
                        <td>ثانية ثانوي</td>
                        <td><span className="xp-tag">1,250 XP</span></td>
                        <td>منذ 5 دقائق</td>
                        <td className="actions-cell">
                          <button className="icon-btn edit"><Settings size={14}/></button>
                          <button className="icon-btn unlock"><Unlock size={14}/></button>
                          <button className="icon-btn danger"><Lock size={14}/></button>
                        </td>
                      </tr>
                    </tbody>
                 </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* CSS STYLES (Titan UI Design System) */}
      <style>{`
        :root {
          --primary: #3b82f6;
          --danger: #ef4444;
          --success: #10b981;
          --bg-dark: #0f172a;
          --card-bg: rgba(30, 41, 59, 0.7);
          --glass-border: rgba(255, 255, 255, 0.1);
        }

        .titan-admin-layout {
          display: flex;
          height: 100vh;
          background: var(--bg-dark);
          color: white;
          font-family: 'Inter', sans-serif;
          direction: rtl;
        }

        .titan-sidebar {
          width: 280px;
          background: #1e293b;
          border-left: 1px solid var(--glass-border);
          display: flex;
          flex-direction: column;
          transition: 0.3s;
        }

        .sidebar-brand {
          padding: 30px;
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .brand-icon {
          background: var(--primary);
          padding: 8px;
          border-radius: 12px;
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
        }

        .sidebar-nav {
          flex: 1;
          padding: 0 15px;
          overflow-y: auto;
        }

        .nav-section {
          font-size: 11px;
          text-transform: uppercase;
          color: #64748b;
          margin: 25px 15px 10px;
          letter-spacing: 1px;
        }

        .sidebar-nav button {
          width: 100%;
          padding: 12px 15px;
          border: none;
          background: transparent;
          color: #94a3b8;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          border-radius: 10px;
          transition: 0.2s;
          margin-bottom: 5px;
        }

        .sidebar-nav button.active, .sidebar-nav button:hover {
          background: rgba(59, 130, 246, 0.1);
          color: white;
        }

        .titan-main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .titan-header {
          height: 70px;
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid var(--glass-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 30px;
        }

        .glass-card {
          background: var(--card-bg);
          backdrop-filter: blur(12px);
          border: 1px solid var(--glass-border);
          border-radius: 20px;
          padding: 20px;
        }

        .titan-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }

        .titan-table th {
          text-align: right;
          padding: 15px;
          color: #64748b;
          border-bottom: 1px solid var(--glass-border);
        }

        .titan-table td {
          padding: 15px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .violation-tag {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
        }

        .emergency-kill-btn {
          background: var(--danger);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 12px;
          cursor: pointer;
          font-weight: bold;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 0 15px rgba(239, 68, 68, 0.4);
        }

        .generate-btn {
          background: var(--primary);
          color: white;
          border: none;
          padding: 15px;
          border-radius: 12px;
          margin-top: 20px;
          cursor: pointer;
          font-weight: bold;
        }

        .xp-tag {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
          padding: 2px 8px;
          border-radius: 5px;
        }

        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }

        .pulse-dot {
          width: 8px;
          height: 8px;
          background: var(--success);
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default AdminDash;
