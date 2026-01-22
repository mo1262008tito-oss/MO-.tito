import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { db, rtdb, auth, storage } from "../firebase";
import { 
  collection, query, where, getDocs, getDoc, doc, updateDoc, 
  addDoc, setDoc, increment, writeBatch, serverTimestamp, 
  orderBy, limit, deleteDoc, onSnapshot 
} from "firebase/firestore";
import { ref, set, onValue, update, remove, push, child, get } from "firebase/database";
import { ref as sRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { 
  ShieldCheck, Radio, BookOpen, Users, Key, BarChart3, Cpu, Search, 
  Zap, ShieldAlert, Fingerprint, MapPin, TrendingUp, Ticket, 
  MessageCircle, Download, Activity, Wifi, Server, MessageSquare, 
  History, AlertTriangle, UserPlus, FileText, Settings, Bell, 
  Lock, Unlock, RefreshCcw, Database, Globe, Layers, Eye, 
  Target, Award, CreditCard, HardDrive, Share2, Terminal, ChevronRight, 
  MoreVertical, PlusSquare, Trash2, Send, Layout, ShieldQuestion, 
  CheckCircle, XCircle, Filter, Shield, Globe2, ZapOff, HardDriveDownload
} from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, 
  BarChart, Bar, Legend, ComposedChart 
} from 'recharts';
import * as XLSX from 'xlsx';
import axios from 'axios';
import './AdminDash.css';

/**
 * [TITAN ARCHITECTURE v4.5.0]
 * المحرك الأول: نظام الحماية والذكاء الأمني
 */

export default function AdminDash() {
  // --- STATE MANAGEMENT SYSTEM ---
  const [tab, setTab] = useState('radar');
  const [subTab, setSubTab] = useState('overview');
  const [isEmergency, setIsEmergency] = useState(false);
  const [stats, setStats] = useState({ 
    online: 0, total: 0, revenue: 0, threats: 0, 
    activeCourses: 0, pendingSupport: 0, serverLoad: 24 
  });
  const [students, setStudents] = useState([]);
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState({ courses: [], books: [], broadcasts: [] });
  const [notifications, setNotifications] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState(["[SYSTEM] Titan OS initialized...", "[AUTH] Admin session verified."]);

  // --- REFS FOR DEEP TRACKING ---
  const audioRef = useRef(null);
  const chartRef = useRef(null);

  /**
   * [1] SECURITY & FORENSIC ENGINE
   * محرك مخصص لإدارة الأمان وبصمات الأجهزة
   */
  const SecurityEngine = {
    // قفل الحساب تزامناً بين Firestore و Realtime
    async executeFullLock(studentId, reason) {
      const timestamp = Date.now();
      try {
        const batch = writeBatch(db);
        batch.update(doc(db, "users", studentId), {
          status: 'BANNED',
          securityLevel: 'CRITICAL',
          banReason: reason,
          bannedAt: serverTimestamp(),
          lastViolation: reason
        });

        // إضافة الحادثة لسجل التهديدات
        const incidentRef = doc(collection(db, "security_incidents"));
        batch.set(incidentRef, {
          userId: studentId,
          type: 'MANUAL_BAN',
          reason: reason,
          timestamp: serverTimestamp(),
          adminId: auth.currentUser?.uid || 'SYSTEM'
        });

        await batch.commit();

        // طرد فوري من الجلسة النشطة عبر RTDB
        await set(ref(rtdb, `active_sessions/${studentId}/kill`), {
          action: 'FORCE_LOGOUT',
          message: `تم حظر حسابك: ${reason}`,
          timestamp: timestamp
        });

        setTerminalLogs(prev => [...prev, `[SECURITY] User ${studentId} permanently banned.`]);
      } catch (error) {
        console.error("Lock Execution Failed:", error);
      }
    },

    // إعادة ضبط الهوية الرقمية للجهاز
    async resetHardwareFingerprint(studentId) {
      try {
        await updateDoc(doc(db, "users", studentId), { 
          deviceId: null, 
          hardwareBound: false,
          lastReset: serverTimestamp(),
          resetCount: increment(1)
        });
        
        // إرسال إشعار لحظي للطالب
        const notifRef = push(ref(rtdb, `user_notifications/${studentId}`));
        await set(notifRef, {
          title: "تحديث النظام",
          message: "تم إعادة تعيين بصمة جهازك بنجاح، يمكنك التسجيل من جهاز جديد الآن.",
          type: "info",
          time: Date.now()
        });

        setTerminalLogs(prev => [...prev, `[HARDWARE] Fingerprint reset for ${studentId}.`]);
      } catch (error) {
        console.error("Reset Failed:", error);
      }
    },

    // تحليل السلوك المشبوه
    async analyzeRiskFactor(userData) {
      let riskScore = 0;
      if (userData.resetCount > 3) riskScore += 40;
      if (userData.status === 'SUSPICIOUS') riskScore += 30;
      if (!userData.deviceId) riskScore += 10;
      
      return {
        score: riskScore,
        level: riskScore > 70 ? 'HIGH' : riskScore > 30 ? 'MEDIUM' : 'LOW'
      };
    }
  };

  /**
   * [2] SYSTEM INITIALIZATION (The Pulse)
   * تفعيل المراقبين اللحظيين لجميع أجزاء النظام
   */
  useEffect(() => {
    // مراقبة حالة السيرفر والاتصال
    const offsetRef = ref(rtdb, ".info/serverTimeOffset");
    onValue(offsetRef, (snap) => {
      const offset = snap.val() || 0;
      console.log(`[TIME-SYNC] Server Offset: ${offset}ms`);
    });

    // مراقبة الرادار اللحظي (Active Sessions)
    const unsubOnline = onValue(ref(rtdb, 'active_sessions'), (snap) => {
      const activeData = snap.exists() ? snap.val() : {};
      setStats(s => ({ ...s, online: Object.keys(activeData).length }));
      
      // تحليل البيانات اللحظية للموقع الجغرافي (افتراضي)
      setTerminalLogs(prev => [...prev, `[RADAR] Active users updated: ${Object.keys(activeData).length}`]);
    });

    // مراقبة سجل التهديدات (Security Incidents)
    const qLogs = query(collection(db, "security_incidents"), orderBy("timestamp", "desc"), limit(100));
    const unsubLogs = onSnapshot(qLogs, (snap) => {
      const incidents = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setLogs(incidents);
      setStats(s => ({ ...s, threats: incidents.length }));
    });

    // جلب الطلاب مع التحديث اللحظي
    const unsubStudents = onSnapshot(collection(db, "users"), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setStudents(list);
      setStats(s => ({ ...s, total: list.length }));
    });

    return () => {
      unsubOnline();
      unsubLogs();
      unsubStudents();
    };
  }, []);

  /**
   * [3] FINANCIAL ARCHITECTURE
   * إدارة الخزينة، الأكواد، والتقارير المالية المتقدمة
   */

  /**
   * [4] TITAN FINANCIAL & BILLING ENGINE
   * المحرك المالي: توليد الأكواد، إدارة الخزينة، وتتبع المعاملات
   */
  const FinanceEngine = {
    // توليد أكواد شحن مشفرة ومعقدة
    async generateAdvancedCodes(config) {
      const { count, value, prefix, distributor, expiryDays } = config;
      const batch = writeBatch(db);
      const generatedCodes = [];
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + (expiryDays || 30));

      for (let i = 0; i < count; i++) {
        // إنشاء كود معقد: PREFIX-XXXX-YYYY-ZZZZ
        const part1 = Math.random().toString(36).substring(2, 6).toUpperCase();
        const part2 = Math.random().toString(36).substring(2, 6).toUpperCase();
        const secretCode = `${prefix}-${part1}-${part2}`;
        
        const codeRef = doc(db, "billing_codes", secretCode);
        const codeData = {
          code: secretCode,
          value: Number(value),
          distributor: distributor || 'OFFICIAL',
          isUsed: false,
          usedBy: null,
          createdAt: serverTimestamp(),
          expiresAt: expiryDate,
          type: 'RECHARGE_CARD'
        };

        batch.set(codeRef, codeData);
        generatedCodes.push(codeData);
      }

      await batch.commit();
      setTerminalLogs(prev => [...prev, `[FINANCE] Generated ${count} secure codes worth ${count * value} EGP.`]);
      return generatedCodes;
    },

    // معالجة عمليات الدفع اليدوية أو تصحيح الأرصدة
    async adjustStudentBalance(studentId, amount, reason) {
      try {
        const userRef = doc(db, "users", studentId);
        await updateDoc(userRef, {
          balance: increment(amount),
          lastTransaction: {
            amount,
            reason,
            date: new Date().toISOString()
          }
        });

        // تسجيل العملية في دفتر الأستاذ العام
        await addDoc(collection(db, "transactions"), {
          userId: studentId,
          amount: amount,
          type: amount > 0 ? 'CREDIT' : 'DEBIT',
          reason: reason,
          timestamp: serverTimestamp(),
          status: 'COMPLETED'
        });

        pushAdminNotification(`تم تعديل رصيد الطالب بمقدار ${amount}`, 'success');
      } catch (error) {
        console.error("Balance Adjustment Failed:", error);
      }
    },

    // تصدير التقارير المالية لملفات Excel احترافية
    exportFinancialReport(transactions) {
      const worksheet = XLSX.utils.json_to_sheet(transactions);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Titan_Finance_Report");
      const dateStr = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `Titan_Finance_${dateStr}.xlsx`);
    }
  };

  /**
   * [5] ACADEMY & CONTENT MANAGEMENT ENGINE
   * إدارة الكورسات، الكتب، والمواد العلمية مع نظام رفع ملفات ذكي
   */
  const AcademyEngine = {
    // إضافة محتوى جديد (كورس أو كتاب) مع معالجة الصورة
    async uploadNewItem(type, formData, imageFile) {
      try {
        let finalThumbnail = formData.thumbnail;

        // إذا كان هناك ملف صورة، يتم رفعه أولاً
        if (imageFile) {
          const fileExtension = imageFile.name.split('.').pop();
          const fileName = `${type}_${Date.now()}.${fileExtension}`;
          const storagePath = sRef(storage, `academy/${type}s/${fileName}`);
          
          const uploadResult = await uploadBytes(storagePath, imageFile);
          finalThumbnail = await getDownloadURL(uploadResult.ref);
        }

        const collectionName = type === 'course' ? 'courses' : 'books';
        const docRef = await addDoc(collection(db, collectionName), {
          ...formData,
          thumbnail: finalThumbnail,
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp(),
          isVisible: true,
          enrolledCount: 0,
          author: "TITAN_ADMIN"
        });

        setTerminalLogs(prev => [...prev, `[ACADEMY] New ${type} added: ${formData.title}`]);
        return docRef.id;
      } catch (error) {
        console.error("Academy Upload Error:", error);
        throw error;
      }
    },

    // نظام منح الوصول (Access Control) للكورسات
    async grantCourseAccess(studentId, courseId, expiryDays = 365) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiryDays);

      const accessRef = doc(db, `users/${studentId}/enrolled_courses`, courseId);
      await setDoc(accessRef, {
        courseId: courseId,
        enrolledAt: serverTimestamp(),
        expiryDate: expiryDate,
        progress: 0,
        status: 'ACTIVE'
      });

      // إرسال إشعار لحظي عبر RTDB
      await set(ref(rtdb, `user_notifications/${studentId}/last_event`), {
        title: "تم تفعيل الكورس",
        message: "تم منحك صلاحية الوصول لكورس جديد بنجاح.",
        time: Date.now()
      });
    },

    // حذف محتوى نهائياً مع حذف الملفات المرتبطة به
    async permanentlyRemoveItem(type, itemId, thumbnailUrl) {
      if (!window.confirm("هل أنت متأكد من الحذف النهائي؟ لا يمكن التراجع!")) return;

      try {
        const collectionName = type === 'course' ? 'courses' : 'books';
        await deleteDoc(doc(db, collectionName, itemId));

        // حذف الصورة من التخزين إذا لم تكن رابطاً خارجياً
        if (thumbnailUrl && thumbnailUrl.includes('firebasestorage')) {
          const imageRef = sRef(storage, thumbnailUrl);
          await deleteObject(imageRef);
        }

        setTerminalLogs(prev => [...prev, `[ACADEMY] Item ${itemId} removed from ${type}s.`]);
      } catch (error) {
        console.error("Removal Failed:", error);
      }
    }
  };

  /**
   * [6] REAL-TIME MONITORING (The Heartbeat)
   * مراقبة الخزينة والأكاديمية والبيانات المالية لحظة بلحظة
   */
  useEffect(() => {
    // 1. مراقبة إجمالي الأرباح والعمليات المالية
    const unsubFinance = onSnapshot(collection(db, "transactions"), (snap) => {
      const transList = snap.docs.map(d => d.data());
      const total = transList.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
      setStats(s => ({ ...s, revenue: total }));
    });

    // 2. مراقبة محتوى الأكاديمية (تحديث الكورسات والكتب)
    const unsubCourses = onSnapshot(collection(db, "courses"), (snap) => {
      const cList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setItems(prev => ({ ...prev, courses: cList }));
      setStats(s => ({ ...s, activeCourses: cList.length }));
    });

    const unsubBooks = onSnapshot(collection(db, "books"), (snap) => {
      const bList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setItems(prev => ({ ...prev, books: bList }));
    });

    return () => {
      unsubFinance();
      unsubCourses();
      unsubBooks();
    };
  }, []);

  /**
   * [7] UI HANDLERS & LOGIC
   * دوال معالجة الواجهة والبحث المتقدم
   */
  const handleGlobalSearch = useCallback((query) => {
    setSearchQuery(query);
    // نظام البحث هنا يعمل بـ useMemo لتحسين الأداء
  }, []);

  /**
   * [8] LIVE SUPPORT & COMMUNICATION ENGINE
   * محرك الدعم الفني: إدارة الشات، تذاكر الدعم، والردود الذكية
   */
  const SupportEngine = {
    // إرسال رسالة من الأدمن للطالب (شات مباشر)
    async sendMessageToStudent(studentId, messageText) {
      if (!messageText.trim()) return;
      try {
        const chatRef = ref(rtdb, `support_chats/${studentId}/messages`);
        const newMessageRef = push(chatRef);
        await set(newMessageRef, {
          sender: 'ADMIN',
          text: messageText,
          timestamp: Date.now(),
          read: false
        });

        // تحديث حالة المحادثة الأخيرة لظهورها في القائمة
        await update(ref(rtdb, `support_chats/${studentId}/metadata`), {
          lastMessage: messageText,
          lastActive: Date.now(),
          adminRead: true,
          userRead: false
        });

        setTerminalLogs(prev => [...prev, `[SUPPORT] Message sent to student: ${studentId}`]);
      } catch (error) {
        console.error("Support Messaging Error:", error);
      }
    },

    // الرد على طلبات الدعم (Tickets) في Firestore
    async updateTicketStatus(ticketId, newStatus) {
      const ticketRef = doc(db, "support_tickets", ticketId);
      await updateDoc(ticketRef, {
        status: newStatus,
        resolvedAt: newStatus === 'RESOLVED' ? serverTimestamp() : null,
        updatedBy: auth.currentUser?.uid
      });
    }
  };

  /**
   * [9] BROADCAST & NOTIFICATION SYSTEM
   * نظام البث العام: إرسال تنبيهات لكل مستخدمي التطبيق في وقت واحد
   */
  const BroadcastSystem = {
    // إرسال إشعار عام (Global Announcement)
    async sendGlobalBroadcast(title, message, type = 'info', actionUrl = null) {
      try {
        const broadcastRef = ref(rtdb, 'system_broadcasts');
        const newPostRef = push(broadcastRef);
        
        const broadcastData = {
          id: newPostRef.key,
          title,
          message,
          type, // 'info' | 'warning' | 'emergency' | 'update'
          url: actionUrl,
          sentAt: Date.now(),
          expiresAt: Date.now() + (48 * 60 * 60 * 1000) // تنتهي بعد 48 ساعة تلقائياً
        };

        await set(newPostRef, broadcastData);

        // تسجيل العملية في Firestore للأرشيف
        await addDoc(collection(db, "admin_broadcast_logs"), {
          ...broadcastData,
          adminId: auth.currentUser?.email,
          timestamp: serverTimestamp()
        });

        setTerminalLogs(prev => [...prev, `[BROADCAST] Global alert sent: ${title}`]);
        pushAdminNotification(`تم إرسال البث العام بنجاح`, 'success');
      } catch (error) {
        console.error("Broadcast Error:", error);
      }
    },

    // مسح جميع البثوث القديمة
    async clearAllBroadcasts() {
      await remove(ref(rtdb, 'system_broadcasts'));
      setTerminalLogs(prev => [...prev, `[BROADCAST] All active broadcasts cleared.`]);
    }
  };

  /**
   * [10] LIVE STREAM & VIRTUAL CLASSROOM CONTROL
   * محرك التحكم في البث المباشر والرقابة على المحتوى
   */
  const LiveStreamEngine = {
    // تفعيل أو إيقاف وضع البث المباشر في المنصة
    async toggleLiveStatus(isLive, streamData = {}) {
      const liveRef = ref(rtdb, 'system_control/live_config');
      await set(liveRef, {
        isLive: isLive,
        streamUrl: streamData.url || "",
        title: streamData.title || "بث مباشر جديد",
        startTime: isLive ? Date.now() : null,
        viewerCount: 0
      });

      // إرسال تنبيه فوري لجميع الطلاب ببدء البث
      if (isLive) {
        await BroadcastSystem.sendGlobalBroadcast(
          "البث المباشر بدأ!", 
          `انضم الآن لمشاهدة: ${streamData.title}`, 
          'emergency'
        );
      }
    },

    // الرقابة اللحظية: حظر كلمات معينة في شات البث
    async updateChatFilter(forbiddenWords) {
      await set(ref(rtdb, 'system_control/chat_filters'), {
        bannedWords: forbiddenWords, // Array of strings
        lastUpdated: Date.now()
      });
    }
  };

  /**
   * [11] EMERGENCY & MASTER LOCK (Titan Kill-Switch)
   * نظام التدمير الذاتي والطوارئ القصوى
   */
  const handleEmergencyProtocol = async () => {
    const confirmation = prompt("تحذير أمني: أدخل كود الطوارئ (EMERGENCY_EXIT) لإيقاف المنصة بالكامل:");
    if (confirmation === "EMERGENCY_EXIT") {
      setIsEmergency(true);
      
      // 1. تفعيل وضع الإغلاق في RTDB لجميع المستخدمين
      await set(ref(rtdb, 'system_control/lockdown'), {
        active: true,
        reason: "صيانة طارئة - يرجى المحاولة لاحقاً",
        timestamp: Date.now()
      });

      // 2. قتل جميع الجلسات النشطة
      await remove(ref(rtdb, 'active_sessions'));

      setTerminalLogs(prev => [...prev, `[CRITICAL] SYSTEM LOCKDOWN ACTIVATED BY ADMIN.`]);
      alert("تم إغلاق المنصة بنجاح. لا يمكن لأي طالب الدخول الآن.");
    }
  };

  /**
   * [12] ADMINISTRATIVE SUBSYSTEMS
   * الأنظمة الفرعية لإدارة المساعدين واللوجز
   */
  const pushAdminNotification = (msg, type) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  // مراقب إشعارات السيرفر وطلبات الدعم الجديدة
  useEffect(() => {
    const unsubSupport = onSnapshot(
      query(collection(db, "support_tickets"), where("status", "==", "OPEN")), 
      (snap) => {
        setStats(s => ({ ...s, pendingSupport: snap.size }));
      }
    );

    return () => unsubSupport();
  }, []);

  /**
   * [13] DATA PROCESSING & ANALYTICS
   * معالجة البيانات قبل العرض (Filtering & Sorting)
   */

  /**
   * [14] TITAN AI ANALYTICS & PREDICTION ENGINE
   * محرك الذكاء الاصطناعي: تحليل أنماط التعلم، كشف محاولات الغش، والتنبؤ بالفشل الدراسي
   */
  const AIEngine = {
    // تحليل مخاطر الغش بناءً على سجل النشاط
    calculateRiskFactor: useCallback((student) => {
      let riskPoints = 0;
      
      // 1. عامل الأجهزة المتعددة
      if (student.resetCount > 2) riskPoints += 35;
      
      // 2. عامل الموقع الجغرافي المشبوه (تغيير الـ IP بشكل متكرر)
      if (student.ipLog && student.ipLog.length > 5) riskPoints += 25;
      
      // 3. عامل النشاط في أوقات غير معتادة
      const lastSeenHour = student.lastSeen ? new Date(student.lastSeen).getHours() : 12;
      if (lastSeenHour > 1 && lastSeenHour < 5) riskPoints += 15;

      return {
        score: riskPoints,
        label: riskPoints > 60 ? 'CRITICAL' : riskPoints > 30 ? 'SUSPICIOUS' : 'SAFE',
        color: riskPoints > 60 ? '#ef4444' : riskPoints > 30 ? '#f59e0b' : '#10b981'
      };
    }, []),

    // التنبؤ بمعدل إتمام الكورس (Completion Prediction)
    predictCompletionRate: (progress, enrollmentDate) => {
      const daysSinceEnrolled = (Date.now() - new Date(enrollmentDate).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceEnrolled === 0) return 0;
      const speed = progress / daysSinceEnrolled;
      const prediction = speed * 30; // توقع الإنجاز في خلال شهر
      return Math.min(Math.round(prediction), 100);
    }
  };

  /**
   * [15] ADVANCED DATA FILTERING (THE SEARCH CORE)
   * محرك البحث المتقدم والفلترة اللحظية لآلاف السجلات
   */
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = 
        s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.phone?.includes(searchQuery) ||
        s.id?.includes(searchQuery);
      
      if (subTab === 'banned') return matchesSearch && s.status === 'BANNED';
      if (subTab === 'at_risk') return matchesSearch && AIEngine.calculateRiskFactor(s).score > 50;
      return matchesSearch;
    });
  }, [students, searchQuery, subTab, AIEngine]);

  /**
   * [16] EXPORT UTILITIES
   * أدوات تصدير البيانات للجهات الإدارية
   */
  const exportToExcel = (data, fileName) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "TitanData");
    XLSX.writeFile(wb, `${fileName}_${Date.now()}.xlsx`);
  };

  /**
   * [17] MAIN RENDER LOGIC (THE WORKSTATION)
   * بداية بناء الواجهة الرسومية - نظام الطبقات (Layers)
   */
  
  // مكونات الواجهة المساعدة (Sub-Components)
  const SidebarLink = ({ id, icon, label }) => (
    <button 
      className={`nav-link ${tab === id ? 'active' : ''}`} 
      onClick={() => { setTab(id); setSubTab('overview'); }}
    >
      {icon} <span>{label}</span>
      {tab === id && <motion.div layoutId="active-pill" className="active-pill" />}
    </button>
  );

  const StatBox = ({ title, value, icon, trend, color }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="stat-box glass-card">
      <div className="stat-icon" style={{ backgroundColor: `${color}20`, color: color }}>{icon}</div>
      <div className="stat-content">
        <p>{title}</p>
        <h3>{value.toLocaleString()}</h3>
        {trend && <span className={`trend ${trend > 0 ? 'up' : 'down'}`}>{trend}% من الشهر الماضي</span>}
      </div>
    </motion.div>
  );

  return (
    <div className={`titan-admin-container ${isEmergency ? 'emergency-mode' : ''}`}>
      
      {/* 1. SIDEBAR NAVIGATION - القائمة الجانبية الذكية */}
      <aside className="titan-sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo"><Cpu size={32} /></div>
          <div className="brand-text">
            <h2>TITAN <span>OS</span></h2>
            <small>CORE ENGINE v4.5.0</small>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-group">
            <label>المراقبة والتحكم</label>
            <SidebarLink id="radar" icon={<Activity size={20}/>} label="الرادار اللحظي" />
            <SidebarLink id="forensic" icon={<Fingerprint size={20}/>} label="التحليل الجنائي" />
            <SidebarLink id="live" icon={<Radio size={20}/>} label="غرفة البث المباشر" />
          </div>

          <div className="nav-group">
            <label>إدارة المحتوى</label>
            <SidebarLink id="academy" icon={<BookOpen size={20}/>} label="الأكاديمية" />
            <SidebarLink id="students" icon={<Users size={20}/>} label="قاعدة الطلاب" />
            <SidebarLink id="support" icon={<MessageSquare size={20}/>} label="الدعم الفني" />
          </div>

          <div className="nav-group">
            <label>النظام والمالية</label>
            <SidebarLink id="finance" icon={<TrendingUp size={20}/>} label="الخزينة والتقارير" />
            <SidebarLink id="terminal" icon={<Terminal size={20}/>} label="Titan Terminal" />
            <SidebarLink id="settings" icon={<Settings size={20}/>} label="إعدادات المنصة" />
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="server-status">
            <div className="status-indicator online" />
            <div className="status-info">
              <p>حالة السيرفر: مستقر</p>
              <small>Ping: 24ms | Load: {stats.serverLoad}%</small>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. MAIN VIEWPORT - منطقة العمل الرئيسية */}
      <main className="titan-viewport">
        
        {/* HEADER - شريط الأدوات العلوي */}
        <header className="viewport-header">
          <div className="header-left">
            <div className="search-bar-advanced">
              <Search size={18} />
              <input 
                type="text" 
                placeholder="ابحث عن طالب، كورس، كود، أو عملية مالية..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <kbd>/</kbd>
            </div>
          </div>

          <div className="header-right">
            <button className="icon-btn" onClick={() => setIsTerminalOpen(!isTerminalOpen)}>
              <Terminal size={20} />
            </button>
            <button className="icon-btn notification-btn">
              <Bell size={20} />
              {stats.pendingSupport > 0 && <span className="badge">{stats.pendingSupport}</span>}
            </button>
            <div className="admin-divider" />
            <div className="admin-profile">
              <div className="profile-info">
                <span>Super Admin</span>
                <small>ID: 001 - Full Access</small>
              </div>
              <div className="profile-avatar">SA</div>
            </div>
            <button className="emergency-kill-switch" onClick={handleEmergencyProtocol}>
              <Zap size={18} />
              <span>KILL SWITCH</span>
            </button>
          </div>
        </header>

        {/* CONTENT - محتوى التبويبات المتغير */}
        <div className="viewport-content">
          <AnimatePresence mode="wait">
{/* --------------------------------------------------------- */}
            {/* [TAB 1: RADAR] - الرادار اللحظي ومراقبة السيرفر */}
            {/* --------------------------------------------------------- */}
            {tab === 'radar' && (
              <motion.div 
                key="radar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="radar-screen"
              >
                <div className="view-header">
                  <div>
                    <h1>الرادار اللحظي <span className="live-pulse" /></h1>
                    <p>مراقبة نشاط المستخدمين وحالة الخوادم الحالية</p>
                  </div>
                  <div className="view-actions">
                    <button className="titan-btn" onClick={() => exportToExcel(students, 'Active_Users')}><Download size={18}/> تصدير البيانات</button>
                    <button className="titan-btn primary" onClick={() => setSubTab('map')}><Globe size={18}/> خريطة النشاط</button>
                  </div>
                </div>

                <div className="stats-grid">
                  <StatBox title="متصل الآن" value={stats.online} icon={<Radio />} color="#10b981" trend={12} />
                  <StatBox title="إجمالي الطلاب" value={stats.total} icon={<Users />} color="#3b82f6" trend={5} />
                  <StatBox title="الخزينة (EGP)" value={stats.revenue} icon={<CreditCard />} color="#f59e0b" trend={18} />
                  <StatBox title="تنبيهات أمنية" value={stats.threats} icon={<ShieldAlert />} color="#ef4444" trend={-2} />
                </div>

                <div className="grid-main-layout">
                  <div className="chart-container glass-card shadow-lg">
                    <div className="card-header">
                      <h3>تحليل الكثافة الطلابية (24 ساعة)</h3>
                      <div className="header-tools">
                        <select className="titan-select"><option>اليوم</option><option>أسبوع</option></select>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={350}>
                      <AreaChart data={[{time:'00:00', v:120}, {time:'04:00', v:45}, {time:'08:00', v:300}, {time:'12:00', v:stats.online * 1.5}, {time:'16:00', v:890}, {time:'20:00', v:1200}, {time:'23:59', v:stats.online}]}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="time" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip contentStyle={{borderRadius:'12px', border:'none', boxShadow:'0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                        <Area type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="activity-feed glass-card">
                    <div className="card-header">
                      <h3>سجل العمليات الأخير</h3>
                      <Activity size={18} />
                    </div>
                    <div className="feed-list">
                      {logs.slice(0, 8).map((log, i) => (
                        <div key={i} className="feed-item">
                          <div className={`feed-icon ${log.type}`}><Shield size={14}/></div>
                          <div className="feed-info">
                            <p><b>{log.userId?.substring(0,8)}</b> {log.reason || log.type}</p>
                            <small>{new Date(log.timestamp?.seconds * 1000).toLocaleTimeString()}</small>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* --------------------------------------------------------- */}
            {/* [TAB 2: ACADEMY] - إدارة الكورسات والمكتبة */}
            {/* --------------------------------------------------------- */}
            {tab === 'academy' && (
              <motion.div key="academy" className="academy-manager">
                <div className="section-tabs">
                  <button className={subTab === 'overview' ? 'active' : ''} onClick={() => setSubTab('overview')}>جميع الكورسات</button>
                  <button className={subTab === 'books' ? 'active' : ''} onClick={() => setSubTab('books')}>المكتبة الرقمية</button>
                  <button className={subTab === 'add' ? 'active' : ''} onClick={() => setSubTab('add')}><PlusSquare size={16}/> إضافة محتوى</button>
                </div>

                <div className="items-grid">
                  <AnimatePresence>
                    {items.courses.map(course => (
                      <motion.div layout key={course.id} className="item-card glass-card shadow-sm hover-up">
                        <div className="card-thumb">
                          <img src={course.thumbnail} alt="" />
                          <div className="badge-overlay">{course.category || 'كورس'}</div>
                        </div>
                        <div className="card-body">
                          <h4>{course.title}</h4>
                          <div className="card-stats">
                            <span><Users size={14}/> {course.enrolledCount || 0}</span>
                            <span><CreditCard size={14}/> {course.price} EGP</span>
                          </div>
                          <div className="card-actions">
                            <button className="titan-btn sm outline"><Eye size={14}/></button>
                            <button className="titan-btn sm outline"><Settings size={14}/></button>
                            <button 
                              className="titan-btn sm danger outline" 
                              onClick={() => AcademyEngine.permanentlyRemoveItem('course', course.id, course.thumbnail)}
                            >
                              <Trash2 size={14}/>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {/* --------------------------------------------------------- */}
            {/* [TAB 3: STUDENTS] - إدارة قاعدة البيانات الضخمة */}
            {/* --------------------------------------------------------- */}
            {tab === 'students' && (
              <motion.div key="students" className="students-vault">
                <div className="vault-controls glass-card">
                  <div className="filter-group">
                    <button className={subTab === 'overview' ? 'active' : ''} onClick={() => setSubTab('overview')}>الكل ({students.length})</button>
                    <button className={subTab === 'at_risk' ? 'active' : ''} onClick={() => setSubTab('at_risk')}>تحت الرقابة</button>
                    <button className={subTab === 'banned' ? 'active' : ''} onClick={() => setSubTab('banned')}>المحظورين</button>
                  </div>
                  <div className="tool-group">
                    <button className="titan-btn" onClick={() => exportToExcel(students, 'Full_Student_List')}><Download size={18}/> تصدير Excel</button>
                  </div>
                </div>

                <div className="table-responsive glass-card shadow-lg">
                  <table className="titan-table">
                    <thead>
                      <tr>
                        <th>المستخدم</th>
                        <th>الحالة الأمنية</th>
                        <th>الرصيد الحالي</th>
                        <th>بصمة الجهاز</th>
                        <th>آخر ظهور</th>
                        <th style={{textAlign: 'center'}}>الإجراءات الإدارية</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map(student => {
                        const risk = AIEngine.calculateRiskFactor(student);
                        return (
                          <tr key={student.id}>
                            <td>
                              <div className="user-info-cell">
                                <div className="avatar" style={{backgroundColor: `${risk.color}20`, color: risk.color}}>{student.name?.charAt(0)}</div>
                                <div>
                                  <p className="m-0 font-bold">{student.name}</p>
                                  <small className="text-muted">{student.phone}</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="status-badge" style={{backgroundColor: risk.color}}>
                                {risk.label} ({risk.score}%)
                              </span>
                            </td>
                            <td><b className="text-success">{student.balance || 0} EGP</b></td>
                            <td>
                              <code className={`device-tag ${student.deviceId ? 'bound' : 'free'}`}>
                                {student.deviceId ? <Lock size={12}/> : <Unlock size={12}/>}
                                {student.deviceId ? student.deviceId.substring(0, 12) : 'غير مقيد'}
                              </code>
                            </td>
                            <td>{student.lastSeen ? new Date(student.lastSeen).toLocaleString('ar-EG') : 'غير متصل'}</td>
                            <td className="actions-cell">
                              <button className="action-icon info" onClick={() => setSelectedStudent(student)}><Eye size={18}/></button>
                              <button className="action-icon warning" onClick={() => SecurityEngine.resetHardwareFingerprint(student.id)} title="تصفير الجهاز"><RefreshCcw size={18}/></button>
                              <button className="action-icon danger" onClick={() => SecurityEngine.executeFullLock(student.id, 'انتهاك سياسة المنصة')}><ShieldAlert size={18}/></button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* --------------------------------------------------------- */}
            {/* [TAB 4: TERMINAL] - مركز القيادة البرمجي */}
            {/* --------------------------------------------------------- */}
            {tab === 'terminal' && (
              <motion.div key="terminal" className="terminal-container">
                <div className="terminal-window">
                  <div className="terminal-header">
                    <div className="dots"><span/><span/><span/></div>
                    <div className="title">TITAN_OS_TERMINAL - Root@Admin</div>
                  </div>
                  <div className="terminal-body">
                    {terminalLogs.map((log, i) => (
                      <div key={i} className="terminal-line">
                        <span className="prompt">>>></span> {log}
                      </div>
                    ))}
                    <div className="terminal-input-line">
                      <span className="prompt">>>></span>
                      <input 
                        autoFocus 
                        type="text" 
                        onKeyDown={(e) => {
                          if(e.key === 'Enter') {
                            setTerminalLogs([...terminalLogs, `Executing: ${e.target.value}...`, "Command not found. Access denied."]);
                            e.target.value = '';
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* --------------------------------------------------------- */}
      {/* [MODALS & OVERLAYS] - النوافذ العائمة والإشعارات */}
      {/* --------------------------------------------------------- */}
      <AnimatePresence>
        {notifications.map(n => (
          <motion.div 
            key={n.id} initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 300, opacity: 0 }}
            className={`titan-toast ${n.type}`}
          >
            {n.type === 'success' ? <CheckCircle size={18}/> : <AlertTriangle size={18}/>}
            <span>{n.msg}</span>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* نافذة تفاصيل الطالب المتقدمة */}
      {selectedStudent && (
        <div className="titan-modal-overlay" onClick={() => setSelectedStudent(null)}>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="student-detail-modal glass-card shadow-2xl" onClick={e => e.stopPropagation()}
          >
             <div className="modal-header">
                <h2>ملف الطالب الذكي</h2>
                <button className="close-btn" onClick={() => setSelectedStudent(null)}>×</button>
             </div>
             <div className="modal-body">
                <div className="profile-summary">
                   <div className="large-avatar">{selectedStudent.name[0]}</div>
                   <div className="summary-text">
                      <h3>{selectedStudent.name}</h3>
                      <p>{selectedStudent.email}</p>
                      <div className="tags">
                         <span className="tag">رصيد: {selectedStudent.balance} EGP</span>
                         <span className="tag">الأكواد المستخدمة: {selectedStudent.codesUsedCount || 0}</span>
                      </div>
                   </div>
                </div>
                <div className="detail-tabs">
                   <div className="detail-card">
                      <h4>السجل المالي</h4>
                      <div className="mini-list">
                         {/* سجل العمليات المالية للطالب */}
                         <div className="mini-item">شراء كورس فيزياء - <span className="text-danger">-200 EGP</span></div>
                         <div className="mini-item">شحن كود محفظة - <span className="text-success">+500 EGP</span></div>
                      </div>
                   </div>
                </div>
             </div>
          </motion.div>
        </div>
      )}
      {/* نافذة إضافة محتوى جديد (كورس أو كتاب) */}
{subTab === 'add' && (
  <div className="titan-modal-overlay">
    <motion.div initial={{y: 50, opacity: 0}} animate={{y: 0, opacity: 1}} className="add-content-modal glass-card">
      <div className="modal-header">
        <h2><PlusSquare /> إضافة محتوى جديد للنظام</h2>
        <button className="close-btn" onClick={() => setSubTab('overview')}>×</button>
      </div>
      
      <form onSubmit={async (e) => {
        e.preventDefault();
        const formData = {
          title: e.target.title.value,
          price: e.target.price.value,
          category: e.target.category.value,
          description: e.target.description.value,
          thumbnail: "" // سيتم معالجتها في المحرك
        };
        const file = e.target.image.files[0];
        const type = e.target.type.value; // 'course' or 'book'
        
        try {
          await AcademyEngine.uploadNewItem(type, formData, file);
          alert("تم الرفع بنجاح!");
          setSubTab('overview');
        } catch (err) {
          alert("خطأ في الرفع: " + err.message);
        }
      }}>
        <div className="form-grid">
          <div className="input-group">
            <label>نوع المحتوى</label>
            <select name="type">
              <option value="course">كورس فيديو</option>
              <option value="book">كتاب رقمي (PDF)</option>
            </select>
          </div>
          
          <div className="input-group">
            <label>عنوان المحتوى</label>
            <input name="title" required placeholder="مثلاً: فيزياء الصف الثالث الثانوي" />
          </div>

          <div className="input-group">
            <label>السعر (EGP)</label>
            <input name="price" type="number" required placeholder="0.00" />
          </div>

          <div className="input-group">
            <label>القسم / المادة</label>
            <input name="category" placeholder="فيزياء، كيمياء..." />
          </div>

          <div className="input-group full">
            <label>وصف قصير</label>
            <textarea name="description" rows="3"></textarea>
          </div>

          <div className="input-group full">
            <label>صورة الغلاف (Thumbnail)</label>
            <input type="file" name="image" accept="image/*" required />
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" className="titan-btn outline" onClick={() => setSubTab('overview')}>إلغاء</button>
          <button type="submit" className="titan-btn primary">بدء الرفع السحابي</button>
        </div>
      </form>
    </motion.div>
  </div>
)}

      <style>{`
        /* Titan CSS Core - 2026 Edition */
        .titan-admin-container { display: flex; height: 100vh; background: #f8fafc; font-family: 'Tajawal', sans-serif; direction: rtl; }
        .titan-sidebar { width: 280px; background: #0f172a; color: white; display: flex; flex-direction: column; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); border-left: 1px solid rgba(255,255,255,0.1); }
        .titan-viewport { flex: 1; overflow-y: auto; background: #f1f5f9; position: relative; }
        .viewport-header { height: 70px; background: white; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; padding: 0 30px; position: sticky; top: 0; z-index: 100; }
        .glass-card { background: rgba(255,255,255,0.9); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2); border-radius: 20px; padding: 25px; }
        .stat-box { display: flex; align-items: center; gap: 20px; }
        .stat-icon { width: 55px; height: 55px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
        .titan-table { width: 100%; border-collapse: separate; border-spacing: 0 8px; }
        .titan-table tr { background: white; transition: transform 0.2s; }
        .titan-table tr:hover { transform: scale(1.005); }
        .titan-table td, .titan-table th { padding: 18px; text-align: right; border-bottom: 1px solid #f1f5f9; }
        .status-badge { padding: 5px 12px; border-radius: 20px; color: white; font-size: 11px; font-weight: bold; }
        .action-icon { background: none; border: none; cursor: pointer; color: #64748b; transition: color 0.2s; margin: 0 5px; }
        .action-icon:hover { color: #0f172a; }
        .terminal-window { background: #1e1e1e; border-radius: 12px; font-family: 'Courier New', monospace; color: #4ade80; padding: 20px; height: 500px; display: flex; flex-direction: column; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
        .terminal-line { margin-bottom: 8px; font-size: 14px; }
        .terminal-input-line { display: flex; gap: 10px; }
        .terminal-input-line input { background: transparent; border: none; color: white; outline: none; flex: 1; font-family: inherit; }
        .titan-toast { position: fixed; bottom: 30px; right: 30px; padding: 15px 25px; border-radius: 12px; color: white; display: flex; align-items: center; gap: 12px; z-index: 1000; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2); }
        .titan-toast.success { background: #10b981; }
        .titan-toast.warning { background: #f59e0b; }
        /* تنسيق نافذة إضافة المحتوى */
.add-content-modal {
  width: 100%;
  max-width: 650px;
  margin: 50px auto;
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.3);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 20px;
}

.input-group.full { grid-column: span 2; }

.input-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
}

.input-group input, 
.input-group select, 
.input-group textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: white;
  transition: all 0.3s;
}

.input-group input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
  outline: none;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

.titan-btn.primary {
  background: #3b82f6;
  color: white;
  padding: 12px 25px;
  border-radius: 10px;
  font-weight: bold;
}
      `}</style>
    </div>
  );
}
            
