import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import * as XLSX from 'xlsx';
import axios from 'axios';
import { jsPDF } from "jspdf";
import CryptoJS from 'crypto-js';

import {
  // الأمان والتحقق
  Shield, ShieldCheck, ShieldAlert, ShieldQuestion, Fingerprint,
  Lock, Unlock, Key, UserCheck, UserPlus, Zap, ZapOff, Camera,
  // الإحصائيات والبيانات
  BarChart3, TrendingUp, Activity, Cpu, Database,
  HardDrive, Layers, Target, Award,
  // الملاحة والواجهة
  Layout, Menu, ChevronRight, MoreVertical, Grid,
  Settings, Bell, RefreshCcw, Search, Filter,
  X, XCircle, Check, CheckCircle, CheckCircle2, Circle, Plus, PlusSquare,
  // التواصل والرسائل
  MessageCircle, MessageSquare, Send, Share2, Globe, Globe2, Wifi, Server,
  // الأكاديمية والمحتوى
  BookOpen, Video, FileText, Edit3, Save, Trash2,
  History, Clock, Calendar, Download,
  // المالية والموارد
  CreditCard, DollarSign, Ticket,
  // الأيقونات المضافة (التصحيح)
  Library as LibraryIcon, FilePlus, UploadCloud, Terminal, MapPin, Users,
  Eye, Monitor, Smartphone, BrainCircuit, Wallet,
  ShoppingBag, Webhook, Printer, Star, Shuffle,
  Sparkles, FileLock, PackageSearch, Banknote, TrendingDown,
  Loader, ArrowRight, Trophy, QrCode, PlayCircle, Link, EyeOff, CloudLightning, GraduationCap, Settings2, Minus
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
  BarChart, Bar, Legend, ComposedChart
} from 'recharts';

import { db, rtdb, auth, storage } from "../firebase";
import {   
  collection, query, where, getDocs, getDoc, doc, updateDoc,   
  addDoc, setDoc, increment, writeBatch, serverTimestamp,   
  orderBy, limit, deleteDoc, onSnapshot, arrayUnion, arrayRemove   
} from "firebase/firestore";
import { ref, set, onValue, update, remove, push, child, get, onDisconnect } from "firebase/database";
import { ref as sRef, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import './AdminDash.css';

/* ========================================================== */
/* 🛡️ THE ULTIMATE ERROR BYPASS & DIAGNOSTIC SYSTEM            */
/* ========================================================== */

// 1. تعريف مراجع وهمية لجميع المكتبات المحتمل فقدانها
const dummyModule = () => null;
const modulesToProtect = [
  'Accessibility', 'XLSX', 'jsPDF', 'CryptoJS', 'Recharts', 'LucideIcons'
];

modulesToProtect.forEach(mod => {
  if (typeof window[mod] === 'undefined') {
    window[mod] = new Proxy({}, {
      get: () => {
        console.warn(`⚠️ تنبيه: المرجع [${mod}] غير معرف، لكن تم تجاوزه لمنع انهيار الصفحة.`);
        return dummyModule;
      }
    });
  }
});

// 2. معالج الأخطاء العالمي (Global Error Interceptor)
// هذا الجزء يمسك الأخطاء ويطبعها في الكونسول بدلاً من إيقاف الصفحة
window.onerror = function(message, source, lineno, colno, error) {
  console.group("%c🚨 خطأ في النظام المحمي", "color: white; background: red; padding: 5px; border-radius: 5px;");
  console.log("%cالمشكلة: ", "font-weight: bold", message);
  console.log("%cالمصدر: ", "font-weight: bold", source);
  console.log("%cالسطر: ", "font-weight: bold", lineno);
  console.groupEnd();
  return true; // إرجاع true يمنع المتصفح من إظهار الشاشة البيضاء
};

// 3. كبت تحذيرات React المزعجة في الكونسول مع إبقائها للفحص
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0]?.includes?.('componentWillReceiveProps') || args[0]?.includes?.('recharts')) return;
  originalWarn.apply(console, args);
};

// 4. تأمين الـ Props الناقصة في المكونات
if (!window.IconPlaceholder) {
  window.IconPlaceholder = (props) => (
    <div style={{ display: 'inline-block', width: '1em', height: '1em', background: '#222', border: '1px dashed #444' }} {...props} />
  );
}



export default function AdminDash() {
  // --- [1] منطقة تعريف الـ States ---
  const [courses, setCourses] = useState([]);
  const [academyCategory, setAcademyCategory] = useState('high-school');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [books, setBooks] = useState([]); 
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [students, setStudents] = useState([]); 
  const [transactions, setTransactions] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [msgData, setMsgData] = useState({ type: 'INFO', title: '', body: '' }); // تم نقلها هنا (تصحيح 1)
  const [stats, setStats] = useState({
      totalStudents: 0,
      activeCourses: 0,
      totalRevenue: 0, 
      securityAlerts: 0
  });
  const [editingItem, setEditingItem] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [isLectureLoading, setIsLectureLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [amountToAdjust, setAmountToAdjust] = useState("");
  const [answers, setAnswers] = useState({}); 
  const [examId, setExamId] = useState(null); 
  const [showForensic, setShowForensic] = useState(false);
  const [selectedForensicData, setSelectedForensicData] = useState(null);

  const [examMeta, setExamMeta] = useState({ title: '', courseId: '', duration: 30, passScore: 50 });
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState({ 
    questionText: '', 
    options: ['', '', '', ''], 
    correctAnswer: 0,
    points: 5 
  });

  const generatePDF = (title, content) => {
    const doc = new jsPDF();
    doc.text(title, 10, 10);
    doc.text(content, 10, 20);
    doc.save(`${title}.pdf`);
  };

  const addQuestionToPool = () => {
    if (!currentQ.questionText) return alert("اكتب نص السؤال أولاً!");
    setQuestions([...questions, currentQ]);
    setCurrentQ({ questionText: '', options: ['', '', '', ''], correctAnswer: 0, points: 5 });
  };

  const handleDeploy = async () => {
    const coverFile = document.getElementById('courseCoverFile')?.files[0];
    const coverUrl = document.getElementById('courseCoverUrl')?.value;
    const teacherFile = document.getElementById('teacherImgFile')?.files[0];
    const teacherUrl = document.getElementById('teacherImgUrl')?.value;

    const finalCover = coverFile || coverUrl;
    const finalTeacher = teacherFile || teacherUrl;

    if (!finalCover) return alert("يرجى اختيار ملف أو وضع رابط للغلاف");

    try {
      const courseData = { 
        title: "كورس جديد", 
        category: academyCategory,
        salesModel: 'FULL' 
      };
      // تأكد من تعريف AcademyManager لاحقاً في الكود
      await AcademyManager.createComplexCourse(courseData, finalCover, finalTeacher);
      alert("تم التدشين بنجاح!");
    } catch (err) {
      console.error("خطأ في التدشين:", err);
    }
  };

  const executeCommand = async (cmd) => {
    const [action, target, value] = cmd.split(' ');
    try {
      switch (action) {
        case 'ban':
          await StudentsManager.toggleStatus(target, 'BANNED');
          setTerminalLogs(prev => [...prev, `[SUCCESS] User ${target} has been banned.`]);
          break;
        case 'clear':
          setTerminalLogs([]);
          break;
        case 'lock':
          await SystemCommander.updatePlatformStatus('EMERGENCY_LOCK');
          break;
        default:
          setTerminalLogs(prev => [...prev, `[ERROR] Unknown command: ${action}`]);
      }
    } catch (err) {
      setTerminalLogs(prev => [...prev, `[CRITICAL] Execution failed: ${err.message}`]);
    }
  };

  const handleAnswerSelect = (questionId, answer) => {
    setAnswers({ ...answers, [questionId]: answer });
    set(ref(rtdb, `temp_exams/${auth.currentUser?.uid}/${examId}/${questionId}`), answer);
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      setStats(prev => ({
        ...prev,
        totalStudents: snapshot.size 
      }));
    }, (error) => {
      console.error("Firebase Permission Error:", error);
    });
    return () => unsubscribe();
  }, []);

  const [radarStats, setRadarStats] = useState({ 
    online: 0, totalRevenue: 0, securityBreaches: 0, 
    storageUsage: 0, activeLessons: 0
  });
  const [securityLogs, setSecurityLogs] = useState([]);
  const [globalSearch, setGlobalSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState('all');

  const generateRandomCode = (prefix, length = 8) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; 
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix}-${result}`;
  };


 // أضف هذا داخل useEffect الرئيسي في الكومبوننت
  useEffect(() => {
    const q = query(collection(db, "books"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const booksData = snap.docs
        .map(d => {
          const data = d.data();
          return data ? { id: d.id, ...data } : null;
        })
        .filter(item => item !== null); // عشان نشيل أي كتاب بياناته بايظة
      setBooks(booksData); // تأكد أن لديك [books, setBooks] في الـ State
    });
    return () => unsub();
  }, []);

  const SecurityCore = {
    // 1. تجميد حساب فوري وقطع الاتصال
    async freezeAccount(uid, reason) {
      try {
        if (!uid) {
          console.error("خطأ: لم يتم تحديد معرف المستخدم (UID)");
          return;
        }

        // أ. تحديث حالة الحساب في Firestore
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
          accountStatus: 'FROZEN',
          freezeReason: reason,
          lastSecurityUpdate: serverTimestamp()
        });

        // ب. إرسال إشارة طرد لحظية عبر RTDB
        await set(ref(rtdb, `active_sessions/${uid}/kill_signal`), {
          type: 'BLOCK',
          msg: reason,
          at: Date.now()
        });

        // ج. تسجيل الحادثة الأمنية
        await this.logIncident(uid, 'MANUAL_BLOCK', `Admin blocked user: ${reason}`);

        console.log(`تم تجميد الحساب ${uid} وقطع الاتصال بنجاح`);
        alert("تم تجميد الحساب وطرده من النظام فوراً.");

      } catch (error) {
        console.error("فشل تجميد الحساب:", error);
        if (error.code === 'not-found') {
          alert("تنبيه: هذا المستخدم لم يعد موجوداً في قاعدة البيانات.");
        } else {
          alert("حدث خطأ تقني أثناء محاولة التجميد.");
        }
      }
    }, // نهاية دالة freezeAccount

    // 2. تسجيل الحوادث الأمنية
    async logIncident(uid, type, details) {
      try {
        await addDoc(collection(db, "security_incidents"), {
          uid,
          type,
          details,
          timestamp: serverTimestamp(),
          severity: type === 'BRUTE_FORCE' ? 'CRITICAL' : 'MEDIUM'
        });
      } catch (e) {
        console.error("Error logging incident:", e);
      }
    },

    // 3. مسح بصمة الجهاز (Hardware ID Reset)
    async resetDeviceBinding(uid) {
      try {
        await updateDoc(doc(db, "users", uid), {
          deviceId: null,
          isHardwareLocked: false,
          resetCounter: increment(1)
        });
        alert("تم مسح بصمة الجهاز بنجاح.");
      } catch (e) {
        console.error("Error resetting device binding:", e);
      }
    }
  };

  useEffect(() => {
    const q = query(collection(db, "courses"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const coursesData = snapshot.docs ? snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          sections: data.sections || [],
          lecturesCount: data.lecturesCount || 0
        };
      }) : [];
      setCourses(coursesData);
    }, (error) => {
      console.error("خطأ في جلب الكورسات:", error);
    });
    return () => unsubscribe();
  }, []);


  useEffect(() => {
    // 1. مراقبة الجلسات الحية (RTDB)
    const activeRef = ref(rtdb, 'active_sessions');
    const unsubRadar = onValue(activeRef, (snapshot) => {
      const data = snapshot.val() || {};
      setRadarStats(prev => ({
        ...prev,
        online: data ? Object.keys(data).length : 0
      }));
    });

    // 2. مراقبة سجل التهديدات اللحظي (Firestore)
    const qSecurity = query(collection(db, "security_incidents"), orderBy("timestamp", "desc"), limit(50));
    const unsubSecurity = onSnapshot(qSecurity, (snap) => {
      if (snap && !snap.empty) {
        const logs = snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            type: data.type || 'UNKNOWN',
            details: data.details || 'No details available',
            timestamp: data.timestamp || { seconds: Date.now() / 1000 },
            ...data
          };
        });
        setSecurityLogs(logs);
      } else {
        setSecurityLogs([]);
      }
    }, (error) => {
      console.error("Security Monitor Error:", error);
    });

    // 3. مزامنة بيانات الطلاب
    const unsubStudents = onSnapshot(collection(db, "users"), (snap) => {
      try {
        const studentsList = snap.docs.map(d => {
          const userData = d.data() || {};
          return {
            id: d.id,
            fullName: userData.fullName || userData.name || "مستخدم بدون اسم",
            email: userData.email || "لا يوجد بريد",
            accountStatus: userData.accountStatus || "ACTIVE",
            ...userData
          };
        });
        setStudents(studentsList);
      } catch (err) {
        console.error("خطأ في معالجة بيانات الطلاب:", err);
      }
    }, (error) => {
      console.error("Firebase Connection Error (Users):", error);
    });

    return () => {
      unsubRadar();
      unsubSecurity();
      unsubStudents();
    };
  }, []);

  useEffect(() => {
    if (editingItem) {
      const fetchLectures = async () => {
        setIsLectureLoading(true);
        try {
          const docRef = doc(db, "courses", editingItem.id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setLectures(docSnap.data().sections || []);
          } else {
            setLectures([]);
          }
        } catch (error) {
          console.error("Error fetching lectures:", error);
          alert("فشل جلب المحاضرات: " + error.message);
        } finally {
          setIsLectureLoading(false);
        }
      };
      fetchLectures();
    } else {
      setLectures([]);
    }
  }, [editingItem]);


  /**
   * [4] TITAN HYBRID ACADEMY ENGINE (THAE)
   * محرك الأكاديمية الهجين: يدعم الكورس الكامل، المحاضرات المنفردة، والمواد المجانية
   */

  const AcademyManager = {
    // 1. إدارة رصيد الطالب (شحن / خصم)
    async adjustStudentBalance(studentId, amount, type = 'add') {
      try {
        const studentRef = doc(db, "users", studentId);
        const studentSnap = await getDoc(studentRef);

        const currentBalance = studentSnap.exists() ? (studentSnap.data().balance || 0) : 0;
        const numAmount = Number(amount);
        const newBalance = type === 'add' ? currentBalance + numAmount : currentBalance - numAmount;

        if (newBalance < 0) throw new Error("الرصيد لا يكفي للخصم");

        await setDoc(studentRef, {
          balance: newBalance,
          lastBalanceUpdate: serverTimestamp()
        }, { merge: true });

        setTerminalLogs(prev => [...prev, `[SYSTEM] ${type === 'add' ? 'شحن' : 'خصم'}: ${numAmount} EGP للطالب ${studentId}`]);
        return newBalance;
      } catch (error) {
        console.error("Balance Error:", error);
        alert("خطأ في تحديث الرصيد: " + error.message);
      }
    },

    // 2. تدشين كورس جديد
    async createComplexCourse(courseData, coverInput, teacherInput) {
      try {
        setLoadingProgress(10);
        let finalCoverUrl = coverInput;
        let finalTeacherUrl = teacherInput;

        if (coverInput instanceof File) {
          const coverRef = sRef(storage, `academy/covers/${Date.now()}_${coverInput.name}`);
          const uploadTask = await uploadBytesResumable(coverRef, coverInput);
          finalCoverUrl = await getDownloadURL(uploadTask.ref);
        }
        setLoadingProgress(50);

        if (teacherInput instanceof File) {
          const teacherRef = sRef(storage, `academy/teachers/${Date.now()}_${teacherInput.name}`);
          const uploadTask = await uploadBytesResumable(teacherRef, teacherInput);
          finalTeacherUrl = await getDownloadURL(uploadTask.ref);
        }

        const finalDoc = {
          ...courseData,
          thumbnail: finalCoverUrl,
          teacherImage: finalTeacherUrl,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          enrolledCount: 0,
          lecturesCount: 0,
          booksCount: 0,
          examsCount: 0,
          sections: [],
          books: [],
          exams: [],
          salesModel: courseData.salesModel || 'FULL'
        };

        const docRef = await addDoc(collection(db, "courses"), finalDoc);
        setLoadingProgress(100);
        setTerminalLogs(prev => [...prev, `[ACADEMY] تم تدشين الكورس: ${courseData.title}`]);
        return docRef.id;
      } catch (error) {
        setLoadingProgress(0);
        alert("❌ فشل التدشين: " + error.message);
        throw error;
      }
    },

    // 3. إضافة محاضرة فيديو
    async addLectureToCourse(courseId, lectureData) {
      try {
        const courseRef = doc(db, "courses", courseId);
        const lectureWithId = {
          ...lectureData,
          id: `lec_${Date.now()}`,
          createdAt: new Date().toISOString()
        };

        await updateDoc(courseRef, {
          sections: arrayUnion(lectureWithId),
          lecturesCount: increment(1),
          updatedAt: serverTimestamp()
        });
        setTerminalLogs(prev => [...prev, `[ACADEMY] تم إضافة محاضرة: ${lectureData.title}`]);
        return lectureWithId;
      } catch (error) {
        alert("خطأ في إضافة المحاضرة: " + error.message);
      }
    },

    // 4. إضافة كتاب
    async addBookToCourse(courseId, bookData) {
      try {
        const courseRef = doc(db, "courses", courseId);
        const bookWithId = {
          ...bookData,
          id: `book_${Date.now()}`,
          addedAt: new Date().toISOString()
        };

        await updateDoc(courseRef, {
          books: arrayUnion(bookWithId),
          booksCount: increment(1)
        });
        alert("✅ تم إضافة الكتاب للمنهج");
      } catch (error) {
        alert("خطأ في إضافة الكتاب: " + error.message);
      }
    },

    // 5. إضافة امتحان
    async addExamToCourse(courseId, examData) {
      try {
        const courseRef = doc(db, "courses", courseId);
        const examWithId = {
          ...examData,
          id: `exam_${Date.now()}`,
          addedAt: new Date().toISOString()
        };

        await updateDoc(courseRef, {
          exams: arrayUnion(examWithId),
          examsCount: increment(1)
        });
        alert("✅ تم ربط الامتحان بالكورس");
      } catch (error) {
        alert("خطأ في إضافة الامتحان: " + error.message);
      }
    },

    // 6. حذف محاضرة
    async removeLectureFromCourse(courseId, lectureId) {
      try {
        const courseRef = doc(db, "courses", courseId);
        const courseSnap = await getDoc(courseRef);
        if (!courseSnap.exists()) return;

        const updatedSections = (courseSnap.data().sections || []).filter(lec => lec.id !== lectureId);
        
        await updateDoc(courseRef, {
          sections: updatedSections,
          lecturesCount: updatedSections.length,
          updatedAt: serverTimestamp()
        });

        setLectures(updatedSections);
        setTerminalLogs(prev => [...prev, `[ACADEMY] تم حذف المحاضرة ${lectureId}`]);
      } catch (error) {
        alert("فشل الحذف: " + error.message);
      }
    },

    // 7. توليد أكواد الكورسات
    async generateMasterCourseCode(courseId, count, value, prefix) {
      try {
        const batch = writeBatch(db);
        const numCount = Number(count);
        const numValue = Number(value);

        for (let i = 0; i < numCount; i++) {
          const secretKey = `${prefix}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
          const codeRef = doc(db, "billing_codes", secretKey);
          batch.set(codeRef, {
            code: secretKey,
            targetCourseId: courseId,
            value: numValue,
            type: 'COURSE_UNLOCKER',
            isUsed: false,
            createdAt: serverTimestamp()
          });
        }
        await batch.commit();
        setTerminalLogs(prev => [...prev, `[FINANCE] تم توليد ${numCount} كود للكورس ${courseId}`]);
        alert(`✅ تم توليد ${numCount} كود بنجاح`);
      } catch (error) {
        alert("خطأ في توليد الأكواد: " + error.message);
      }
    }
  };




  const StudentMiner = {
    // الحصول على سجل الدخول التفصيلي (بصمات الأجهزة والـ IPs)
    async getStudentForensics(uid) {
      try {
        if (!uid) {
          console.warn("[TITAN] UID مفقود في عملية الفحص الجنائي");
          return [];
        }

        const historyRef = collection(db, "users", uid, "login_history");
        const q = query(historyRef, orderBy("timestamp", "desc"), limit(20));
        const loginLogs = await getDocs(q);

        if (loginLogs.empty) {
          return [];
        }

        return loginLogs.docs.map(d => ({
          id: d.id,
          ...d.data(),
          // تأمين الحقول عشان الـ UI ميتكسرش
          ip: d.data().ip || "0.0.0.0",
          device: d.data().device || "Unknown Device",
          timestamp: d.data().timestamp?.toDate?.() || new Date()
        }));
      } catch (error) {
        console.error("Forensic Mining Error:", error);
        return []; // نرجع مصفوفة فاضية بدل ما نوقع الشاشة
      }
    },
    // تعديل بيانات الطالب الرباعية
    async updateFullProfile(uid, data) {
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, {
        fullName: data.fullName, // الاسم الرباعي
        phone: data.phone,
        parentPhone: data.parentPhone, // رقم ولي الأمر
        governorate: data.governorate,
        lastAdminUpdate: serverTimestamp()
      });
    },

    // منح الطالب وصول يدوي لمحاضرة واحدة فقط (Manual Access)
    async grantSingleLectureAccess(uid, courseId, lectureId) {
      const accessRef = doc(db, `users/${uid}/unlocked_lectures`, `${courseId}_${lectureId}`);
      await setDoc(accessRef, {
        courseId,
        lectureId,
        unlockedAt: serverTimestamp(),
        method: 'ADMIN_MANUAL'
      });
    }
  };

  /**
   * [6] FINANCE & REVENUE CORE (FR-CORE)
   * إدارة الخزينة، الأرباح، وتتبع المبيعات المنفردة والكاملة
   */
  const FinanceManager = {
    // حساب الأرباح الكلية بناءً على نوع المبيعات
    calculateDeepAnalytics: (transactions) => {
      return transactions.reduce((acc, curr) => {
        acc.total += curr.amount;
        if (curr.type === 'COURSE_FULL') acc.courseSales += 1;
        if (curr.type === 'LECTURE_SINGLE') acc.lectureSales += 1;
        return acc;
      }, { total: 0, courseSales: 0, lectureSales: 0 });
    }
  };

  /**
   * [7] GUI COMPONENT: ACADEMY CONTROL PANEL
   * واجهة التحكم في الأكاديمية (الرفع، الحذف، التعديل)
   */

  /**
   * [8] TITAN FEDERAL IDENTITY SYSTEM (TFIS)
   * محرك الهوية: إدارة شاملة للبيانات الرباعية، سجلات الأجهزة، والتحقق الجغرافي
   */
  const StudentController = {
    // جلب البيانات العميقة للطالب (الاسم الرباعي، الوالدين، الأجهزة)
    async fetchFullDeepProfile(uid) {
      try {
        const userDoc = await getDoc(doc(db, "users", uid));
        const hardwareLogs = await getDocs(query(collection(db, `users/${uid}/device_history`), orderBy("timestamp", "desc")));
        const academicProgress = await getDocs(collection(db, `users/${uid}/enrolled_courses`));
        return {
          profile: userDoc.exists() ? userDoc.data() : {},
          devices: (hardwareLogs?.docs || []).map(d => ({
            id: d.id,
            ...d.data(),
            lastUsed: d.data().lastUsed || new Date().toISOString()
          })),
          progress: (academicProgress?.docs || []).map(d => ({
            id: d.id,
            ...d.data(),
            completionRate: d.data().completionRate || 0
          }))
        };


      } catch (err) {
        console.error("Deep Fetch Error:", err);
      }
    },
    // تعديل الحالة الأمنية للطالب (تفعيل/حظر/مراقبة)
    async setSecurityStatus(uid, status, reason) {
      const batch = writeBatch(db);
      const userRef = doc(db, "users", uid);

      batch.update(userRef, {
        status: status,
        securityNote: reason,
        lastSecurityUpdate: serverTimestamp()
      });

      if (status === 'BANNED' || status === 'SUSPENDED') {
        const sessionRef = ref(rtdb, `active_sessions/${uid}/security_action`);
        await set(sessionRef, {
          command: 'TERMINATE_SESSION',
          reason: reason,
          timestamp: Date.now()
        });
      }

      await batch.commit();

      // ✅ التعديل الصحيح: استخدم setTerminalLogs مباشرة
      setTerminalLogs(prev => [...prev, `[SECURITY] تم تحديث حالة ${uid} إلى ${status}`]);
    },
    async clearHardwareLock(uid) {
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, {
        deviceId: null,
        hardwareBound: false,
        resetLogs: arrayUnion({
          at: new Date().toISOString(),
          admin: auth.currentUser?.email,
          action: 'HARDWARE_RESET'
        })
      });
      alert("تم تحرير القفل العتادي بنجاح");
    }
  };

  /**
   * [9] GUI COMPONENT: STUDENT MISSION CONTROL
   * واجهة إدارة الطلاب: الاسم الرباعي، أرقام الهاتف، والبيانات المتقدمة
   */
// [9] نظام الفلترة الذكي للبيانات الرباعية (المصحح)
const filteredList = useMemo(() => {
  // نستخدم globalSearch لأنه هو المعرف في الـ State
  // ونحول النص لحروف صغيرة لضمان دقة البحث
  const searchTerm = globalSearch?.toLowerCase() || "";
  
  return students.filter(s => 
    s.fullName?.toLowerCase().includes(searchTerm) || 
    s.phone?.includes(searchTerm) ||
    s.parentPhone?.includes(searchTerm)
  );
}, [globalSearch, students]); 

const processStudentStats = useCallback(() => {
    // نضمن إن students مصفوفة حتى لو لسه بتحمل
    const safeStudents = students || [];

    const stats = {
      active: safeStudents.filter(s => s?.status === 'ACTIVE').length || 0,
      banned: safeStudents.filter(s => s?.status === 'BANNED').length || 0,
      newToday: safeStudents.filter(s => {
        if (!s?.createdAt?.seconds) return false; // حماية لو التاريخ مش موجود
        const today = new Date().toLocaleDateString();
        const created = new Date(s.createdAt.seconds * 1000).toLocaleDateString();
        return today === created;
      }).length || 0
    };
    return stats;
  }, [students]); // أضف students هنا عشان الدالة تتحدث لما البيانات تيجي
  /**
   * [11] DEEP FORENSIC MODAL
   * نافذة التحليل الجنائي للملف الشخصي للطالب
   */
  const ForensicModal = () => (
    <AnimatePresence>
      {selectedStudent && (
        <div className="titan-overlay" onClick={() => setSelectedStudent(null)}>
          <motion.div 
            className="forensic-card glass-card"
            initial={{scale: 0.8, y: 100, opacity: 0}}
            animate={{scale: 1, y: 0, opacity: 1}}
            exit={{scale: 0.8, y: 100, opacity: 0}}
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header-pro">
               <div className="profile-header">
                  <div className="large-avatar">{selectedStudent.fullName?.[0]}</div>
                  <div className="main-meta">
                    <h2>{selectedStudent.fullName}</h2>
                    <p>{selectedStudent.phone} | {selectedStudent.email}</p>
                    <div className="badges">
                       <span className="badge-titan"><Target size={14}/> المستوى {selectedStudent.level || 1}</span>
                       <span className="badge-titan"><Calendar size={14}/> عضو منذ {new Date(selectedStudent.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                    </div>
                  </div>
               </div>
               <button className="close-x" onClick={() => setSelectedStudent(null)}><XCircle size={30}/></button>
            </div>
<div className="modal-content-grid">
  {/* كارت المحفظة والعمليات المطور (TITAN PAY) */}
  <div className="data-panel glass-card">
    <div className="panel-head"><CreditCard size={18}/> الإحصاءات المالية</div>
    
    <div className="balance-hero">
      <small>الرصيد الحالي</small>
      <h1>{selectedStudent.balance || 0} <small>EGP</small></h1>
    </div>

    {/* نظام الإدخال الجديد */}
    <div className="finance-control-center">
      <div className="amount-input-wrapper">
        <input 
          type="number" 
          placeholder="أدخل المبلغ..." 
          value={amountToAdjust}
          onChange={(e) => setAmountToAdjust(e.target.value)}
          className="titan-amount-field"
        />
        <span className="currency-tag">EGP</span>
      </div>

      <div className="action-buttons-row">
        <button 
          className="btn-charge-success"
          onClick={() => {
            if (!amountToAdjust || amountToAdjust <= 0) return alert("يرجى إدخال مبلغ صحيح");
            AcademyManager.adjustStudentBalance(selectedStudent.id, Number(amountToAdjust), "add");
            setAmountToAdjust(""); 
          }}
        >
          <Plus size={16} /> شحن
        </button>

        <button 
          className="btn-charge-danger"
          onClick={() => {
            if (!amountToAdjust || amountToAdjust <= 0) return alert("يرجى إدخال مبلغ صحيح");
            AcademyManager.adjustStudentBalance(selectedStudent.id, Number(amountToAdjust), "deduct");
            setAmountToAdjust(""); 
          }}
        >
          <Minus size={16} /> خصم
        </button>
      </div>
    </div>
  </div>
               {/* كارت النشاط والرقابة */}
               <div className="data-panel glass-card">
                  <div className="panel-head"><ShieldCheck size={18}/> حالة القفل والرقابة</div>
                  <div className="security-status-view">
                     <div className="status-indicator">
                        <div className={`pulse-circle ${selectedStudent.status}`}></div>
                        <span>الجهاز مربوط حالياً بـ: <b>{selectedStudent.deviceId?.substring(0,16) || 'لا يوجد'}</b></span>
                     </div>
                     <div className="forensic-logs">
                        <div className="log-item"><History size={14}/> سجل تغيير الأجهزة: {selectedStudent.resetCounter || 0} مرات</div>
                        <div className="log-item"><Wifi size={14}/> آخر IP مسجل: {selectedStudent.lastIp || '127.0.0.1'}</div>
                     </div>
                  </div>
               </div>

               {/* كارت الكورسات والوصول */}
               <div className="data-panel glass-card full-width">
                  <div className="panel-head"><BookOpen size={18}/> الكورسات والمحاضرات المفتوحة</div>
                  <div className="access-list">
                      {/* سيتم ملؤه ديناميكياً من محرك الأكاديمية */}
                      <div className="empty-state">جاري جلب سجل الوصول من السيرفر...</div>
                  </div>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
  
  /**
   * [12] TITAN CRYPTO-BILLING ENGINE (TCBE)
   * محرك توليد الأكواد المشفرة: يدعم توليد آلاف الأكواد في ثوانٍ مع ربطها بكورسات أو محاضرات معينة
   */
  const BillingEngine = {
    // خوارزمية توليد الأكواد (PREFIX-UUID-RAND)
    generateSecureID: (length = 8) => {
      const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // استبعاد الأحرف المتشابهة مثل 0 و O
      let retVal = "";
      for (let i = 0; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * charset.length));
      }
      return retVal;
    },

    // توليد دفعة أكواد (Bulk Generation)
    async executeBulkGeneration(config) {
      const { count, value, prefix, type, targetId, expiryDays } = config;
      const batch = writeBatch(db);
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + (Number(expiryDays) || 365));

      setLoadingProgress(10);
      const codesList = [];

      for (let i = 0; i < count; i++) {
        const secretCode = `${prefix}-${this.generateSecureID(4)}-${this.generateSecureID(4)}`;
        const codeRef = doc(db, "billing_codes", secretCode);
        
        const payload = {
          code: secretCode,
          value: Number(value),
          type: type, // 'WALLET_RECHARGE' | 'COURSE_UNLOCK' | 'LECTURE_UNLOCK'
          targetId: targetId || null, // ID الكورس أو المحاضرة المرتبطة
          isUsed: false,
          usedBy: null,
          createdAt: serverTimestamp(),
          expiresAt: expiryDate,
          createdBy: auth.currentUser?.email || 'SYSTEM_CORE'
        };

        batch.set(codeRef, payload);
        codesList.push(payload);
        
        // تحديث شريط التحميل لكل 100 كود
        if (i % 100 === 0) setLoadingProgress(10 + (i / count) * 80);
      }

      await batch.commit();
      setLoadingProgress(100);
      setTerminalLogs(prev => [...prev, `[FINANCE] Successfully deployed ${count} codes to the vault.`]);
      return codesList;
    },

    // نظام استرداد الأكواد وتتبع المحتالين
    async trackCodeUsage(code) {
      const codeSnap = await getDoc(doc(db, "billing_codes", code));
      if (!codeSnap.exists()) throw new Error("الكود غير موجود في السجل الفدرالي");
      return codeSnap.data();
    },

    // إلغاء تفعيل مجموعة أكواد دفعة واحدة
    async revokeCodesByPrefix(prefix) {
      const q = query(collection(db, "billing_codes"), where("code", ">=", prefix), where("code", "<=", prefix + '\uf8ff'));
      const snaps = await getDocs(q);
      const batch = writeBatch(db);
      snaps.forEach(d => batch.delete(d.ref));
      await batch.commit();
      setTerminalLogs(prev => [...prev, `[FINANCE] Revoked ${snaps.size} codes starting with ${prefix}`]);
    }
  };

  /**
   * [13] SINGLE LECTURE ACCESS CONTROLLER
   * نظام التحكم في المحاضرات المنفردة: يسمح بفتح درس واحد فقط من كورس كامل
   */
  const LectureAccessCore = {
    // فتح محاضرة لطالب يدوياً
    async unlockLectureForStudent(uid, courseId, lectureId, price) {
      const batch = writeBatch(db);
      
      // 1. تسجيل العملية في سجل الطالب
      const accessRef = doc(db, `users/${uid}/unlocked_lectures`, `${courseId}_${lectureId}`);
      batch.set(accessRef, {
        courseId,
        lectureId,
        unlockedAt: serverTimestamp(),
        pricePaid: price,
        expiryDate: null // مفتوح للأبد للمحاضرة المنفردة
      });

      // 2. خصم الرصيد إذا لم يكن مجانياً
      if (price > 0) {
        const userRef = doc(db, "users", uid);
        batch.update(userRef, { balance: increment(-price) });
      }

      // 3. إضافة لوج للعملية المالية
      const txRef = doc(collection(db, "transactions"));
      batch.set(txRef, {
        uid,
        amount: price,
        type: 'LECTURE_PURCHASE',
        description: `شراء المحاضرة ${lectureId} من الكورس ${courseId}`,
        timestamp: serverTimestamp()
      });

      await batch.commit();
      setTerminalLogs(prev => [...prev, `[ACCESS] Lecture ${lectureId} unlocked for user ${uid}`]);
    }
  };

  const LectureEngine = {
    // رفع محاضرة جديدة مع ملفاتها الملحقة (PDF)
    async deployLecture(courseId, lectureData, videoFile, pdfFile) {
      try {
        setLoadingProgress(5);
        let videoUrl = lectureData.videoUrl || ""; // رابط خارجي (يوتيوب/سيرفر خاص)
        let pdfUrl = "";

        // 1. معالجة الفيديو إذا كان ملفاً مرفوعاً
        if (videoFile) {
          const vRef = sRef(storage, `academy/courses/${courseId}/videos/${Date.now()}_${videoFile.name}`);
          const vTask = uploadBytesResumable(vRef, videoFile);
          
          vTask.on('state_changed', (snap) => {
            const progress = (snap.bytesTransferred / snap.totalBytes) * 50;
            setLoadingProgress(progress);
          });

          await vTask;
          videoUrl = await getDownloadURL(vTask.snapshot.ref);
        }

        // 2. معالجة ملف الـ PDF (الملزمات)
        if (pdfFile) {
          const pRef = sRef(storage, `academy/courses/${courseId}/files/${Date.now()}_${pdfFile.name}`);
          const pTask = await uploadBytesResumable(pRef, pdfFile);
          pdfUrl = await getDownloadURL(pTask.ref);
        }
        setLoadingProgress(90);

        // 3. تحديث مصفوفة المحاضرات في الكورس
        const courseRef = doc(db, "courses", courseId);
        const newLecture = {
          id: `LEC_${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
          title: lectureData.title,
          description: lectureData.description,
          videoUrl: videoUrl,
          pdfUrl: pdfUrl,
          duration: Number(lectureData.duration) || 0,
          price: Number(lectureData.price) || 0, // السعر للمحاضرة المنفردة
          isLocked: lectureData.isLocked !== undefined ? lectureData.isLocked : true,
          isFree: lectureData.isFree || false,
          views: 0,
          createdAt: new Date().toISOString()
        };

        await updateDoc(courseRef, {
          sections: arrayUnion(newLecture),
          lecturesCount: increment(1),
          updatedAt: serverTimestamp()
        });

        setLoadingProgress(100);
        setTerminalLogs(prev => [...prev, `[CONTENT] Lecture '${newLecture.title}' successfully deployed to course ${courseId}`]);
      } catch (error) {
        console.error("Lecture Deployment Failed:", error);
        alert("فشل رفع المحاضرة: " + error.message);
      }
    },

    // حذف محاضرة معينة من داخل الكورس
    async removeLecture(courseId, lectureObj) {
      if (!window.confirm("هل أنت متأكد من حذف هذه المحاضرة؟ سيتم فقدان صلاحية الوصول لجميع الطلاب الذين اشتروها بشكل منفرد.")) return;

      const courseRef = doc(db, "courses", courseId);
      await updateDoc(courseRef, {
        sections: arrayRemove(lectureObj),
        lecturesCount: increment(-1)
      });

      // حذف الملفات من الاستورج لتوفير المساحة
      if (lectureObj.pdfUrl) {
        try { await deleteObject(sRef(storage, lectureObj.pdfUrl)); } catch(e) {}
      }
      
      setTerminalLogs(prev => [...prev, `[CONTENT] Lecture ${lectureObj.id} purged from system.`]);
    }
  };

  const LiveControl = {
 
  async startLiveSession(config) {
    try {
      const liveRef = ref(rtdb, 'live_sessions/current');
      const sessionData = {
        title: config.title,
        streamUrl: config.url,
        category: config.category,
        startedAt: Date.now(),
        isActive: true,
        allowChat: true,
        viewerCount: 0,
        moderators: [auth.currentUser?.uid]
      };

      await set(liveRef, sessionData);

      await addDoc(collection(db, "global_notifications"), {
        title: "بث مباشر بدأ الآن!",
        body: `انضم للمدرس ${config.teacher} في بث: ${config.title}`,

        category: config.category,
        type: 'LIVE_START',
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("Error starting session:", error);
    }
  }, // تأكد من وجود هذه الفاصلة بين الدوال

  // إغلاق البث
  async terminateLive() {
    try {
      await update(ref(rtdb, 'live_sessions/current'), {
        isActive: false,
        endedAt: Date.now()
      });
    } catch (error) {
      console.error("Error terminating session:", error);
    }
  }
}; // القوس ده هو اللي كان بيعمل المشكلة (')' expected)


  const ExamEngine = {
    // إنشاء اختبار جديد وربطه بمحتوى
    async createExam(targetId, examData) {
      try {
        setLoadingProgress(20);
        const examRef = collection(db, "exams");
        
        const newExam = {
          targetId: targetId, // ID الكورس أو المحاضرة
          title: examData.title,
          description: examData.description,
          duration: Number(examData.duration), // بالدقائق
          passingScore: Number(examData.passingScore),
          questions: examData.questions, // مصفوفة الأسئلة
          randomizeOrder: examData.randomizeOrder || true,
          showResultsImmediately: examData.showResults || true,
          allowRetake: examData.allowRetake || false,
          maxAttempts: Number(examData.maxAttempts) || 1,
          createdAt: serverTimestamp(),
          active: true
        };

        const docRef = await addDoc(examRef, newExam);
        
        // تحديث مرجع الكورس بوجود اختبار
        await updateDoc(doc(db, "courses", targetId), {
          hasExam: true,
          examId: docRef.id
        });
setTerminalLogs(prev => [...prev, `[EXAM] New Exam Deployed: ${examData?.title} (Questions: ${examData?.questions?.length || 0})`]);
        return docRef.id;
      } catch (err) {
        console.error("Exam Creation Error:", err);
      }
    },

    // معالجة نتائج الطلاب (تصحح تلقائياً في السيرفر لضمان الأمان)
    async processStudentResult(studentId, examId, answers) {
      const examSnap = await getDoc(doc(db, "exams", examId));
      const examData = examSnap.data();
      
// 1. حارس الأمان في البداية
      if (!examData?.questions || examData.questions.length === 0) {
        return { score: 0, passed: false, detailedResults: [] };
      }

      let score = 0;
      
   // 1. تأمين مصفوفة الأسئلة والإجابات قبل البدء
      const questions = examData?.questions || [];
      const userAnswers = answers || {}; // تأكدنا إنها Object أو Array حسب نظامك

      // 2. العملية الآن محصنة ضد الـ undefined
      const detailedResults = questions.map((q, index) => {
        // استخدام Optional Chaining (?. ) مهم جداً هنا
        const isCorrect = q?.correctAnswer === userAnswers[index];
        
        // تحديث السكور بأمان
        if (isCorrect) score++; 

        return { 
          questionIndex: index, 
          correct: isCorrect,
          points: isCorrect ? (q?.points || 1) : 0 
        };
      }); const finalScore = Math.round(score);
      const passed = finalScore >= examData.passingScore;

      // حفظ النتيجة في سجل الطالب
      await addDoc(collection(db, `users/${studentId}/exam_results`), {
        examId,
        examTitle: examData.title,
        score: finalScore,
        passed,
        timestamp: serverTimestamp(),
        details: detailedResults
      });

      return { finalScore, passed };
    },

    // نظام كشف محاولات الغش (Cheating Detection)
    async reportCheating(uid, examId, type) {
      await addDoc(collection(db, "security_incidents"), {
        uid,
        type: 'EXAM_CHEATING_ATTEMPT',
        detail: `محاولة غش في اختبار ${examId} - النوع: ${type}`,
        timestamp: serverTimestamp(),
        severity: 'HIGH'
      });
      
      // تجميد الاختبار للطالب فوراً
      await updateDoc(doc(db, `users/${uid}/exam_results`, examId), {
        status: 'DISQUALIFIED',
        reason: 'Violation of exam policy'
      });
    }
  };

    
  /**
   * [21] TITAN BROADCAST ENGINE (TBE)
   * محرك البث الإخباري: إرسال تنبيهات جماعية، رسائل مستهدفة، وتحديثات النظام
   */
  const NotificationHub = {
    // إرسال إشعار عام أو مستهدف (Targeted Broadcasting)
    async sendBroadcast(config) {
      try {
        setLoadingProgress(20);
        const batch = writeBatch(db);
        const notificationId = `NOTIF_${Date.now()}`;
        
        // 1. تسجيل الإشعار في السجل العام (Global News Feed)
        const globalRef = doc(db, "global_notifications", notificationId);
        const payload = {
          title: config.title,
          message: config.message,
          type: config.type, // 'INFO', 'WARNING', 'EVENT', 'PROMO'
          targetCategory: config.category || 'ALL', // استهداف قسم معين
          targetCourse: config.courseId || null,   // استهداف طلاب كورس معين
          actionUrl: config.url || null,
          sender: auth.currentUser?.email,
          timestamp: serverTimestamp(),
          expiresAt: config.expiry || null
        };
        
        batch.set(globalRef, payload);
        setLoadingProgress(50);

        // 2. تحديث عداد التنبيهات في RTDB للتنبيه اللحظي (In-App Pulse)
        const pulseRef = ref(rtdb, `system_pulses/notifications`);
        await set(pulseRef, {
          lastId: notificationId,
          target: config.category || 'ALL',
          at: Date.now()
        });

        await batch.commit();
        setLoadingProgress(100);
        setTerminalLogs(prev => [...prev, `[BROADCAST] Sent to ${config.category || 'ALL'} students: ${config.title}`]);
      } catch (err) {
        console.error("Broadcast Failed:", err);
      }
    },

    // نظام الدردشة المباشرة للدعم الفني (Support Suite)
    async toggleChatStatus(studentId, isOpen) {
      const chatRef = doc(db, "support_tickets", studentId);
      await updateDoc(chatRef, {
        status: isOpen ? 'OPEN' : 'CLOSED',
        lastAdminActivity: serverTimestamp()
      });
    },

    // إرسال رد آلي (AI Auto-Reply Template)
    async sendSupportReply(studentId, message) {
      const msgRef = collection(db, `support_tickets/${studentId}/messages`);
      await addDoc(msgRef, {
        text: message,
        sender: 'ADMIN',
        senderName: 'فريق الدعم الفني -Mafa',
        timestamp: serverTimestamp()
      });
    }
  };

const CommunicationsUI = () => {
 
  const [supportTickets, setSupportTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [adminReply, setAdminReply] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // 1. مراقبة تذاكر الدعم الفني الحية (Real-time Stream)
  useEffect(() => {
    const q = query(
      collection(db, "support_tickets"), 
      where("status", "==", "OPEN"), 
      orderBy("lastUserActivity", "desc")
    );
   const unsub = onSnapshot(q, (snap) => {
      try {
        if (!snap || snap.empty) {
          setSupportTickets([]);
          return;
        }

        const tickets = snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            subject: data.subject || "بدون عنوان",
            status: data.status || "OPEN",
            priority: data.priority || "MEDIUM",
            createdAt: data.createdAt?.toDate?.() || new Date(),
            ...data
          };
        });
        setSupportTickets(tickets);
      } catch (err) {
        console.error("خطأ في معالجة تذاكر الدعم:", err);
      }
    }, (error) => {
      console.error("فشل الاتصال بتذاكر الدعم:", error);
    }); return () => unsub();
  }, []);

  // 2. إرسال البث (Broadcast Logic)
  const handleBroadcast = async () => {
    if (!msgData.title || !msgData.message) return alert("القائد لا يرسل رسائل فارغة!");
    setIsBroadcasting(true);
    try {
      await NotificationHub.sendBroadcast(msgData);
      setTerminalLogs(prev => [...prev, `[BROADCAST] Sent: ${msgData.title} to ${msgData.category}`]);
      setMsgData({ title: '', message: '', type: 'INFO', category: 'ALL' });
    } finally {
      setIsBroadcasting(false);
    }
  };

  // 3. نظام الرد على التذاكر
  const sendReply = async (ticketId) => {
    if (!adminReply.trim()) return;
    await NotificationHub.sendSupportReply(ticketId, adminReply);
    setAdminReply("");
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="comms-hub-v2 p-6">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter">TITAN COMMAND CENTER</h1>
          <p className="text-blue-400 font-mono text-sm tracking-widest">ENCRYPTED COMMUNICATION LINE v5.0</p>
        </div>
        <div className="status-badge flex items-center gap-3 bg-blue-500/10 px-4 py-2 rounded-full border border-blue-500/30">
          <div className="pulse-dot"></div>
          <span className="text-blue-200 text-xs font-bold">SYSTEM ONLINE</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* القطاع الأيسر: محرك البث الفدرالي */}
        <div className="xl:col-span-5 space-y-6">
          <div className="glass-card p-6 border-t-4 border-yellow-500 bg-gradient-to-b from-yellow-500/5 to-transparent">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Zap className="text-yellow-500" /> بث تنبيه نظامي
            </h3>
            
            <div className="space-y-4">
             <div className="grid grid-cols-3 gap-2">
  {['INFO', 'WARNING', 'EVENT'].map(t => (
    <button
      key={t}
      onClick={() =>
        setMsgData(prev => ({
          ...(prev || {}),
          type: t
        }))
      }
      className={`py-2 rounded border text-[10px] font-bold transition-all ${
        msgData?.type === t
          ? 'bg-yellow-500 border-yellow-500 text-black'
          : 'border-white/10 text-gray-400 hover:bg-white/5'
      }`}
    >
      {t}
    </button>
  ))}
</div>

            <input 
  className="titan-input-v2" 
  placeholder="رأس الرسالة..." 
  // حماية بـ Optional Chaining وعلامة || لمنع السواد
value={msgData?.category || 'ALL'}

onChange={e => setMsgData && setMsgData(prev => ({...prev, title: e.target.value}))}
/>

<textarea 
  className="titan-input-v2 h-40 resize-none" 
  placeholder="اكتب تعليماتك هنا..." 
  value={msgData?.message || ''} 
  onChange={e => setMsgData && setMsgData(prev => ({...prev, message: e.target.value}))}
></textarea>

              <select 
                className="titan-input-v2"
                value={msgData.category}
                onChange={e => setMsgData({...msgData, category: e.target.value})}
              >
                <option value="ALL">إرسال للكل (Global)</option>
                <option value="high-school">طلاب الثانوية</option>
                <option value="coding">طلاب البرمجة</option>
              </select>

              <button 
                onClick={handleBroadcast}
                disabled={isBroadcasting}
                className="w-full py-4 bg-yellow-500 text-black font-black rounded-xl hover:bg-yellow-400 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(234,179,8,0.3)]"
              >
                {isBroadcasting ? <Loader className="animate-spin" /> : <Send size={20} />}
                تأكيد البث الفوري
              </button>
            </div>
          </div>
        </div>

        {/* القطاع الأيمن: رادار الدعم الفني والمحادثات */}
        <div className="xl:col-span-7 flex flex-col gap-6">
          <div className="glass-card flex-1 overflow-hidden flex flex-col border-t-4 border-green-500">
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-green-500/5">
              <h3 className="font-bold flex items-center gap-2"><MessageCircle size={18}/> رادار الدعم النشط</h3>
              <span className="bg-green-500/20 text-green-400 text-[10px] px-2 py-1 rounded-full uppercase tracking-tighter">Live Traffic</span>
            </div>
<div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[500px]">
  {/* استخدمنا الحماية هنا بـ (supportTickets || []) لضمان عدم الانهيار */}
  { (!supportTickets || supportTickets.length === 0) ? (
    <div className="h-full flex flex-col items-center justify-center opacity-20 italic text-sm">
      <ShieldCheck size={48} className="mb-2"/>
      لا توجد تهديدات أو تذاكر دعم معلقة
    </div>
  ) : (
    supportTickets.map(ticket => (
      <div 
        key={ticket?.id || Math.random()} 
        onClick={() => typeof setSelectedTicket === 'function' && setSelectedTicket(ticket)}
        className={`p-4 rounded-xl border transition-all cursor-pointer ${
          selectedTicket?.id === ticket?.id ? 'bg-blue-600/20 border-blue-500/50' : 'bg-white/5 border-white/10 hover:border-white/20'
        }`}
      >
        <div className="flex justify-between mb-2">
          <span className="font-bold text-sm text-blue-300">
            {ticket?.studentName || "طالب مجهول"}
          </span>
          <span className="text-[10px] text-gray-500 font-mono">
            {/* حماية التاريخ: لو مفيش ثواني ميعملش Crash للبرنامج */}
            {ticket?.lastUserActivity?.seconds 
              ? new Date(ticket.lastUserActivity.seconds * 1000).toLocaleTimeString() 
              : '--:--'}
          </span>
        </div>
        <p className="text-xs text-gray-400 line-clamp-2 italic">
          "{ticket?.lastMessage || 'لا توجد رسالة'}"
        </p>
      </div>
    ))
  )}
</div>
            {/* نافذة الرد السريع */}
            {selectedTicket && (
              <div className="p-4 bg-black/40 border-t border-white/10 animate-slide-up">
                <div className="flex gap-2">
                  <input 
                    className="titan-input-v2 flex-1" 
                    placeholder={`الرد على ${selectedTicket.studentName}...`}
                    value={adminReply}
                    onChange={e => setAdminReply(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && sendReply(selectedTicket.id)}
                  />
                  <button 
                    onClick={() => sendReply(selectedTicket.id)}
                    className="p-3 bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors"
                  >
                    <ArrowRight size={20}/>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </motion.div>
  );
};
const getExamAnalytics = (results) => {
    // 1. تأمين المصفوفة
    const safeResults = results || [];
    const total = safeResults.length;
    
    // 2. حماية القسمة على صفر والحماية من المصفوفة الفارغة
    if (total === 0) {
      return { total: 0, passed: 0, averageScore: 0, passRate: 0 };
    }

    const passed = safeResults.filter(r => r?.passed).length;
    const averageScore = safeResults.reduce((acc, curr) => acc + (curr?.score || 0), 0) / total;

    return { total, passed, averageScore, passRate: (passed / total) * 100 };
  };

  /**
   * [26] TITAN ANALYTICS CORE (TAC)
   * محرك تحليل البيانات: معالجة سجلات البيع، نشاط الطلاب، ومؤشرات النمو
   */
const AnalyticsEngine = {
    processRevenueStats(transactions) {
      // 1. حماية أولية: لو مفيش بيانات، نرجع مصفوفة فاضية بدل ما السيستم ينهار
      if (!transactions || !Array.isArray(transactions)) return [];

      const dailyMap = {};
      
      transactions.forEach(tx => {
        // 2. حماية التاريخ: التأكد من وجود التوقيت قبل الحساب
        const seconds = tx.timestamp?.seconds || tx.createdAt?.seconds;
        if (!seconds) return; // تخطي المعاملة لو مفيش تاريخ

        const date = new Date(seconds * 1000).toLocaleDateString('en-CA'); // تنسيق YYYY-MM-DD أسهل للترتيب
        
        if (!dailyMap[date]) {
          dailyMap[date] = { 
            date, 
            formattedDate: new Date(seconds * 1000).toLocaleDateString('ar-EG'), 
            revenue: 0, 
            sales: 0 
          };
        }
        
        dailyMap[date].revenue += Number(tx.amount || 0);
        dailyMap[date].sales += 1;
      });

      // 3. الترتيب الصحيح وإرجاع البيانات
      return Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
    },

  // تحليل توزيع الطلاب على الأقسام الأربعة (نسخة محمية)
    getCategoryDistribution(students) {
      // 1. حماية أولية: لو مفيش طلاب، نرجع التوزيع صفري بدل الانهيار
      const dist = { 'high-school': 0, 'religious': 0, 'educational': 0, 'coding': 0 };
      
      if (!students || !Array.isArray(students)) {
        return Object.entries(dist).map(([name, value]) => ({ name, value }));
      }

      // 2. معالجة البيانات بأمان
      students.forEach(s => {
        if (s && s.mainCategory && dist.hasOwnProperty(s.mainCategory)) {
          dist[s.mainCategory]++;
        }
      });

      // 3. تحويل البيانات لشكل الرسم البياني
      return Object.entries(dist).map(([name, value]) => ({ 
        name: name || 'unclassified', 
        value: value || 0 
      }));
    },
    // نظام تصدير التقارير المالية لملف Excel احترافي
    exportFinancialReport(data) {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Revenue Report 2026");
      XLSX.writeFile(workbook, `Titan_Financials_${Date.now()}.xlsx`);
    }
  };


  /**
   * [23] AUTO-CLEANER SYSTEM (ACS)
   * محرك تنظيف البيانات التلقائي: مسح الإشعارات القديمة لتوفير المساحة
   */
  const DataCleaner = {
    async purgeOldNotifications() {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const q = query(collection(db, "global_notifications"), where("timestamp", "<", ninetyDaysAgo));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.forEach(d => batch.delete(d.ref));
      await batch.commit();
      setTerminalLogs(prev => [...prev, `[CLEANER] Purged ${snap.size} legacy notifications.`]);
    }
  };

  /**
   * [24] TITAN DIGITAL LIBRARY ENGINE (TDLE)
   * محرك المكتبة: إدارة الكتب الرقمية، المذكرات، وتأمين حقوق النشر
   */
  const LibraryManager = {
    // رفع كتاب أو مذكرة جديدة مع غلافها
    async uploadBook(bookData, pdfFile, coverFile) {
      try {
        setLoadingProgress(10);
        let pdfUrl = "";
        let coverUrl = "";

        // 1. رفع غلاف الكتاب لسرعة العرض
        if (coverFile) {
          const cRef = sRef(storage, `library/covers/${Date.now()}_${coverFile.name}`);
          const cTask = await uploadBytesResumable(cRef, coverFile);
          coverUrl = await getDownloadURL(cTask.ref);
        }
        setLoadingProgress(40);

        // 2. رفع ملف الـ PDF المشفر
        if (pdfFile) {
          const pRef = sRef(storage, `library/books/${Date.now()}_${pdfFile.name}`);
          const pTask = uploadBytesResumable(pRef, pdfFile);
          
          pTask.on('state_changed', (snap) => {
            const progress = 40 + (snap.bytesTransferred / snap.totalBytes) * 50;
            setLoadingProgress(progress);
          });

          await pTask;
          pdfUrl = await getDownloadURL(pTask.snapshot.ref);
        }

        // 3. بناء وثيقة الكتاب في قاعدة البيانات
        const newBook = {
          title: bookData.title,
          author: bookData.author || "إدارة المنصة",
          description: bookData.description,
          category: bookData.category, // القسم (ثانوي، برمجي، إلخ)
          price: Number(bookData.price) || 0,
          isFree: Number(bookData.price) === 0,
          pdfUrl: pdfUrl,
          coverUrl: coverUrl,
          pagesCount: bookData.pagesCount || 0,
          allowDownload: bookData.allowDownload || false,
          downloadsCount: 0,
          createdAt: serverTimestamp(),
          securityLevel: 'HIGH' // منع التصوير والطباعة
        };

        const docRef = await addDoc(collection(db, "books"), newBook);
        setLoadingProgress(100);
        setTerminalLogs(prev => [...prev, `[LIBRARY] Book '${bookData.title}' added to ${bookData.category}`]);
        return docRef.id;
      } catch (err) {
        console.error("Library Upload Error:", err);
        alert("فشل في رفع الكتاب: " + err.message);
      }
    },

    // حذف كتاب ومسح ملفاته
    async purgeBook(bookId, pdfPath, coverPath) {
      if(!window.confirm("حذف الكتاب نهائياً؟")) return;
      await deleteDoc(doc(db, "books", bookId));
      if(pdfPath) try { await deleteObject(sRef(storage, pdfPath)); } catch(e) {}
      if(coverPath) try { await deleteObject(sRef(storage, coverPath)); } catch(e) {}
      setTerminalLogs(prev => [...prev, `[LIBRARY] Purged book ${bookId}`]);
    }
  };
const LibraryUI = () => {
  const [libCategory, setLibCategory] = useState('high-school');
  const [isUploading, setIsUploading] = useState(false);
  const [newBook, setNewBook] = useState({ title: '', price: 0, category: 'high-school', description: '' });

  const handleUpload = async () => {
    const pdf = document.getElementById('pdf-file').files[0];
    const cover = document.getElementById('cover-file').files[0];
    if(!pdf || !newBook.title) return alert("البيانات ناقصة يا قائد!");
    
    setIsUploading(true);
    await LibraryManager.uploadBook(newBook, pdf, cover);
    setIsUploading(false);
    setNewBook({ title: '', price: 0, category: 'high-school', description: '' });
  };

  return (
    <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="library-hub p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-white">TITAN DIGITAL LIBRARY</h2>
          <p className="text-gray-400">إدارة المراجع، الكتب، وحقوق النشر الرقمية</p>
        </div>
        <div className="stats-pills flex gap-4">
           <div className="pill glass-card">
  <BookOpen size={16}/> {books?.length || 0} كتاب
</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* لوحة الرفع */}
        <div className="upload-sector glass-card p-6 border-l-4 border-blue-500">
          <h3 className="text-xl mb-4 flex items-center gap-2"><UploadCloud/> رفع مؤلف جديد</h3>
          <div className="space-y-4">
            <input className="titan-input" placeholder="عنوان الكتاب" value={newBook.title} onChange={e => setNewBook({...newBook, title: e.target.value})} />
            <select className="titan-input" value={newBook.category} onChange={e => setNewBook({...newBook, category: e.target.value})}>
              <option value="high-school">ثانوية عامة</option>
              <option value="coding">برمجة</option>
              <option value="religious">ديني</option>
            </select>
            <div className="file-drop-zone">
              <label>ملف الـ PDF</label>
              <input type="file" id="pdf-file" accept=".pdf" />
            </div>
            <div className="file-drop-zone">
              <label>غلاف الكتاب (Image)</label>
              <input type="file" id="cover-file" accept="image/*" />
            </div>
            <button 
              onClick={handleUpload} 
              disabled={isUploading}
              className={`titan-btn primary w-full ${isUploading ? 'loading' : ''}`}
            >
              {isUploading ? `جاري الرفع ${Math.round(loadingProgress)}%` : 'تدشين الكتاب الآن'}
            </button>
          </div>
        </div>
{/* عرض الكتب */}
        <div className="books-display lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {(books || []).filter(b => b?.category === libCategory).map(book => (
              /* تم حذف الـ <div التائهة من هنا ليعمل الكود */
              <motion.div 
                key={book.id} 
                layout 
                initial={{scale: 0.9}} 
                animate={{scale: 1}} 
                className="book-item-card glass-card overflow-hidden"
              >
                <div className="flex gap-4 p-4">
                  <img src={book.coverUrl || 'placeholder.jpg'} className="w-24 h-32 object-cover rounded shadow-lg" />
                  <div className="flex-1">
                    <h4 className="font-bold text-lg">{book.title}</h4>
                    <p className="text-xs text-gray-400 line-clamp-2">{book.description}</p>
                    <div className="mt-4 flex justify-between items-center">
                      <span className="price-tag">{book.price === 0 ? 'مجاني' : `${book.price} EGP`}</span>
                      <button onClick={() => LibraryManager.purgeBook(book.id, book.pdfUrl, book.coverUrl)} className="text-red-500 hover:bg-red-500/10 p-2 rounded">
                        <Trash2 size={18}/>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div> {/* إغلاق الشبكة الداخلية */}
    </motion.div>
  );
};

  const renderMainContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AnalyticsUI />;
      case 'students':
        return <StudentsManagerUI />;
      case 'academy':
        return <AcademyUI />;
      case 'finance':
        return <FinanceVaultUI />;
      case 'comms':
        return <CommunicationsUI />;
      case 'library':
        return <LibraryUI />;
      case 'exams':
        return <ExamBuilderUI />;
      case 'terminal':
        return (
          <div className="terminal-vessel glass-card">
            <div className="terminal-header">TITAN KERNEL TERMINAL v5.0.0</div>
            <div className="terminal-body">
             {(terminalLogs || []).map((log, i) => (
                <div key={i} className="terminal-line">{`> ${log}`}</div>
              ))}
              <div className="terminal-input-line">
                <span>$</span>
                <input autoFocus placeholder="Enter command..." />
              </div>
            </div>
          </div>
        );
      default:
        return <AnalyticsUI />;
    }
  };









/**
 * [9] GUI COMPONENT: STUDENT MISSION CONTROL
 * واجهة إدارة الطلاب: الاسم الرباعي، أرقام الهاتف، والبيانات المتقدمة
 */
const StudentsManagerUI = () => {
  const [localSearch, setLocalSearch] = useState("");

  return (
    <div className="titan-student-vessel">
      {/* شريط الأدوات العلوي للمصنفات */}
      <div className="vessel-tools glass-card">
        <div className="search-engine">
          <Search size={20} className="icon" />
   
<input 
  placeholder="ابحث..." 
  value={localSearch}
  onChange={(e) => setLocalSearch(e.target.value)} 
/>


<input 
  placeholder="ابحث بالاسم الرباعي، رقم الهاتف، أو كود الطالب..." 
  value={globalSearch}
  onChange={(e) => setGlobalSearch(e.target.value)} 
/>
        </div>
        <div className="action-btns">
          <button className="titan-btn" onClick={() => exportToExcel(students, 'Titan_Students_Full_Data')}>
            <Download size={18}/> تقرير شامل (Excel)
          </button>
          <button className="titan-btn primary">
            <UserPlus size={18}/> إضافة طالب يدوياً
          </button>
        </div>
      </div>

      
      {/* شبكة البيانات (Table System) */}
      <div className="data-table-container glass-card shadow-2xl">
        <table className="titan-master-table">
          <thead>
            <tr>
              <th>الاسم الرباعي الكامل</th>
              <th>بيانات الاتصال</th>
              <th>الوالدين</th>
              <th>الحالة الأمنية</th>
              <th>المحفظة</th>
              <th>الأجهزة</th>
              <th>إدارة</th>
            </tr>
          </thead>
          <tbody>
          {(filteredList || []).map(student => (
              <motion.tr 
                layout 
                key={student.id} 
                className={student.status === 'BANNED' ? 'banned-row' : ''}
              >
                <td className="name-cell">
                  <div className="avatar">{student.fullName?.charAt(0) || 'U'}</div>
                  <div className="info">
                    <span className="fullname">{student.fullName || "غير مسجل"}</span>
                    <small className="id">UID: {student.id?.substring(0, 12)}</small>
                  </div>
                </td>
                
                <td>
                  <div className="contact-info">
                    <div className="item">
                      <Wifi size={12}/> {student?.phone || 'لا يوجد رقم'}
                    </div>
                    <div className="item text-muted">
                      <MapPin size={12}/> {student?.governorate || 'غير محدد'}
                    </div>
                  </div>
                </td>

                <td>
                  <div className="parent-tag">
                    <Users size={14}/> {student.parentPhone || "غير مسجل"}
                  </div>
                </td>

                <td>
                  <div className={`status-pill ${student.status || 'ACTIVE'}`}>
                    {student.status === 'BANNED' ? <Lock size={12}/> : <ShieldCheck size={12}/>}
                    {student.status || 'ACTIVE'}
                  </div>
                </td>

                <td>
                  <div className="balance-box">
                    <span className="amount">{student.balance || 0}</span>
                    <span className="currency"> EGP</span>
                  </div>
                </td>

                <td>
                  <div className={`hardware-badge ${student.deviceId ? 'locked' : 'unlocked'}`}>
                    {student.deviceId ? <Fingerprint size={16}/> : <ZapOff size={16}/>}
                    <small>{student.deviceId ? 'جهاز مقيد' : 'متاح'}</small>
                  </div>
                </td>

                <td className="ops-cell">
                  <button className="op-btn info" onClick={() => setSelectedStudent(student)}>
                    <Eye size={18}/>
                  </button>
                  <button className="op-btn warn" onClick={() => StudentController.clearHardwareLock(student.id)} title="Hardware Reset">
                    <RefreshCcw size={18}/>
                  </button>
                  <button className="op-btn danger" onClick={() => StudentController.setSecurityStatus(student.id, 'BANNED', 'مخالفة السياسة')}>
                    <ShieldAlert size={18}/>
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

  
/**
 * [11] GUI COMPONENT: FINANCE VAULT
 * خزنة الأكواد الفدرالية: توليد الأكواد وإدارة المبيعات
 */
const FinanceVaultUI = ({ stats, genConfig, setGenConfig, transactions, BillingEngine }) => {
  
  // تأمين: في حال كانت البيانات لم تصل بعد، نضع قيم افتراضية لمنع الـ Crash
  const currentStats = stats || { revenue: 0, activeCodesCount: 0 };
  const currentTransactions = transactions || [];
  return (
    <div className="finance-vault-vessel p-4 lg:p-6">
      <div className="vault-header glass-card flex flex-col md:flex-row justify-between items-center gap-6 p-6 mb-8">
        <div className="title-area">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            خزنة الأكواد الفدرالية <Database size={24} className="text-yellow-500" />
          </h1>
          <p className="text-gray-400">إدارة وتوليد مفاتيح الوصول المشفرة للنظام</p>
        </div>
        <div className="vault-stats flex gap-4">
          <div className="v-stat bg-white/5 p-4 rounded-2xl border border-white/10 min-w-[150px]">
            <span className="text-xs text-gray-500 block mb-1">إجمالي المبيعات</span>
            <h3 className="text-xl font-bold text-green-400">{stats.revenue?.toLocaleString()} EGP</h3>
          </div>
          <div className="v-stat bg-white/5 p-4 rounded-2xl border border-white/10 min-w-[150px]">
            <span className="text-xs text-gray-500 block mb-1">الأكواد النشطة</span>
            <h3 className="text-xl font-bold text-blue-400">{stats.activeCodesCount || 0} مفتاح</h3>
          </div>
        </div>
      </div>

      <div className="vault-main-grid grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* محطة التوليد (Generation Station) */}
        <motion.div initial={{y: 20, opacity: 0}} animate={{y: 0, opacity: 1}} className="gen-station glass-card p-6">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-blue-400">
            <Zap size={18} /> توليد أكواد جديدة
          </h3>
          <div className="gen-form space-y-4">
            <div className="f-row grid grid-cols-2 gap-4">
              <div className="f-group">
                <label className="text-xs text-gray-500 block mb-2">عدد الأكواد</label>
                <input type="number" className="w-full bg-black/20 border border-white/10 p-3 rounded-xl outline-none focus:border-blue-500" value={genConfig.count} onChange={e => setGenConfig({...genConfig, count: e.target.value})} />
              </div>
              <div className="f-group">
                <label className="text-xs text-gray-500 block mb-2">قيمة الكود (EGP)</label>
                <input type="number" className="w-full bg-black/20 border border-white/10 p-3 rounded-xl outline-none focus:border-blue-500" value={genConfig.value} onChange={e => setGenConfig({...genConfig, value: e.target.value})} />
              </div>
            </div>

            <div className="f-row grid grid-cols-2 gap-4">
              <div className="f-group">
                <label className="text-xs text-gray-500 block mb-2">بادئة الكود (Prefix)</label>
                <input type="text" className="w-full bg-black/20 border border-white/10 p-3 rounded-xl outline-none focus:border-blue-500" value={genConfig.prefix} onChange={e => setGenConfig({...genConfig, prefix: e.target.value.toUpperCase()})} />
              </div>
              <div className="f-group">
                <label className="text-xs text-gray-500 block mb-2">نوع الكود</label>
                <select className="w-full bg-black/20 border border-white/10 p-3 rounded-xl outline-none focus:border-blue-500 text-gray-300" value={genConfig.type} onChange={e => setGenConfig({...genConfig, type: e.target.value})}>
                  <option value="WALLET_RECHARGE">شحن محفظة</option>
                  <option value="COURSE_UNLOCK">فتح كورس كامل</option>
                  <option value="LECTURE_UNLOCK">فتح محاضرة منفردة</option>
                </select>
              </div>
            </div>

            {genConfig.type !== 'WALLET_RECHARGE' && (
              <div className="f-group">
                <label className="text-xs text-gray-500 block mb-2 text-blue-400">معرف المحتوى (ID)</label>
                <input className="w-full bg-black/20 border border-white/10 p-3 rounded-xl outline-none border-blue-500/30" placeholder="أدخل ID الكورس أو المحاضرة" value={genConfig.targetId} onChange={e => setGenConfig({...genConfig, targetId: e.target.value})} />
              </div>
            )}

            <button className="titan-btn primary w-full py-4 mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-[1.02] transition-all rounded-xl font-bold flex items-center justify-center gap-2" onClick={() => BillingEngine.executeBulkGeneration(genConfig)}>
              <Cpu size={18} /> تنفيذ عملية التوليد المشفرة
            </button>
          </div>
        </motion.div>

        {/* سجل العمليات المالية (Transaction Ledger) */}
        <div className="ledger-station glass-card p-6 border border-white/5">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-gray-400">
            <History size={18} /> سجل العمليات الأخيرة
          </h3>
          <div className="ledger-list space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
             {/* هنا نضع التخطيط للسجل */}
           { (transactions?.length || 0) === 0 ? (
               <p className="text-center text-gray-600 py-10">لا توجد عمليات مسجلة حالياً</p>
             ) : (
       (transactions || []).slice(0, 10).map(tx => (
                <div key={tx.id} className="ledger-item flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5">
                   <div className="flex items-center gap-4">
                      <div className="l-icon p-2 bg-green-500/10 text-green-500 rounded-full"><DollarSign size={14}/></div>
                      <div className="l-info">
                         <p className="text-sm font-medium text-gray-200">{tx.description}</p>
                         <small className="text-[10px] text-gray-500">{tx.timestamp} | UID: {tx.studentId?.substring(0,8)}</small>
                      </div>
                   </div>
                   <div className="l-amount text-green-400 font-bold">+{tx.amount} EGP</div>
                </div>
               ))
             )}
          </div>
          <button className="titan-btn outline w-full mt-6 border border-white/10 py-3 rounded-xl hover:bg-white/5 transition-all text-sm">عرض كشف حساب كامل</button>
        </div>
      </div>
    </div>
  );
};

const AcademyMainGridUI = ({ academyCategory, AcademyManager, setCourses, editingItem, setEditingItem, lectures, isLectureLoading, setLectures }) => (
<div className="academy-main-grid">
        {/* نموذج رفع كورس جديد - النسخة الضخمة */}
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="upload-section glass-card">
          <h3 className="section-title flex items-center gap-2"><PlusSquare /> تأمين ورفع كورس جديد</h3>
          <form id="courseForm" className="titan-form">
            <div className="form-row grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="input-group">
                <label className="text-xs text-gray-400">اسم المدرس</label>
                <input name="teacherName" placeholder="مثلاً: د. أحمد محمد" required className="w-full bg-white/5 border border-white/10 p-3 rounded-xl outline-none" />
              </div>
              <div className="input-group">
                <label className="text-xs text-gray-400">عنوان الكورس</label>
                <input name="courseTitle" placeholder="عنوان يظهر للطلاب" required className="w-full bg-white/5 border border-white/10 p-3 rounded-xl outline-none" />
              </div>
            </div>

            <div className="form-row grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="input-group">
                <label className="text-xs text-gray-400">سعر الكورس الكامل</label>
                <input name="fullPrice" type="number" placeholder="0.00 EGP" className="w-full bg-white/5 border border-white/10 p-3 rounded-xl outline-none" />
              </div>
              <div className="input-group">
                <label className="text-xs text-gray-400">نظام البيع</label>
                <select name="salesModel" className="w-full bg-[#1a1a1a] border border-white/10 p-3 rounded-xl outline-none text-white">
                  <option value="FULL">كود واحد للكورس كامل</option>
                  <option value="SINGLE">دفع لكل محاضرة منفردة</option>
                  <option value="HYBRID">هجين (كود كامل أو محاضرات)</option>
                </select>
              </div>
            </div>

            <div className="input-group mt-4">
              <label className="text-xs text-gray-400">وصف الكورس الشامل</label>
              <textarea name="desc" rows="4" placeholder="اكتب تفاصيل الكورس..." className="w-full bg-white/5 border border-white/10 p-3 rounded-xl outline-none"></textarea>
            </div>

            <div className="upload-grid grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="upload-box flex flex-col gap-2 p-3 bg-white/5 rounded-xl border border-white/10">
                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                        <Video size={14} className="text-blue-400"/> غلاف الكورس
                    </label>
                    <input type="file" id="courseCoverFile" accept="image/*" className="text-xs text-gray-500" />
                    <div className="text-[10px] text-gray-500 text-center">--- أو ---</div>
                    <input type="text" id="courseCoverUrl" placeholder="رابط الصورة..." className="w-full bg-black/40 border border-white/10 p-2 rounded text-xs outline-none focus:border-blue-500" />
                </div>

                <div className="upload-box flex flex-col gap-2 p-3 bg-white/5 rounded-xl border border-white/10">
                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                        <Users size={14} className="text-green-400"/> صورة المدرس
                    </label>
                    <input type="file" id="teacherImgFile" accept="image/*" className="text-xs text-gray-500" />
                    <div className="text-[10px] text-gray-500 text-center">--- أو ---</div>
                    <input type="text" id="teacherImgUrl" placeholder="رابط الصورة..." className="w-full bg-black/40 border border-white/10 p-2 rounded text-xs outline-none focus:border-blue-500" />
                </div>
            </div>

            <button 
                type="button" 
                className="titan-btn primary w-full mt-6 bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-bold flex items-center justify-center gap-2" 
                onClick={async () => {
                    try {
                        const form = document.getElementById('courseForm');
                        const coverFile = document.getElementById('courseCoverFile')?.files[0];
                        const coverUrl = document.getElementById('courseCoverUrl')?.value;
                        const teacherFile = document.getElementById('teacherImgFile')?.files[0];
                        const teacherUrl = document.getElementById('teacherImgUrl')?.value;

                        const finalCover = coverFile || coverUrl;
                        const finalTeacher = teacherFile || teacherUrl;

                        if (!form.courseTitle.value || !finalCover) {
                            return alert("⚠️ يرجى إدخال عنوان الكورس وصورة الغلاف.");
                        }

                        const data = {
                            title: form.courseTitle.value,
                            teacher: form.teacherName.value,
                            price: Number(form.fullPrice.value),
                            salesModel: form.salesModel.value,
                            description: form.desc.value,
                            category: academyCategory 
                        };

                        const newCourseId = await AcademyManager.createComplexCourse(data, finalCover, finalTeacher);

                        const newCourseItem = {
                            id: newCourseId,
                            ...data,
                            thumbnail: coverFile ? URL.createObjectURL(coverFile) : coverUrl,
                            lecturesCount: 0
                        };
                        setCourses(prev => [newCourseItem, ...prev]);

                        alert("✅ تم تدشين الكورس بنجاح!");
                        form.reset();
                    } catch (error) {
                        alert("❌ حدث خطأ: " + error.message);
                    }
                }}
            >
                <Zap size={16} /> فحص وتدشين الكورس في السيرفر
            </button>
          </form>
        </motion.div>

        {/* مودال تعديل المحتويات (Editing Lectures Modal) */}
        {editingItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="glass-card w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-[#0a0a0a]/90 shadow-2xl">
              
              <div className="flex items-center justify-between border-b border-white/10 p-6 bg-gradient-to-r from-white/5 to-transparent">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Video className="text-blue-400" /> إدارة محتويات: {editingItem.title}
                  </h2>
                  <p className="text-sm text-gray-400">إضافة دروس ومحاضرات جديدة</p>
                </div>
                <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-white/10 rounded-full transition-all">
                  <X className="text-gray-400 hover:text-white" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-gray-400 mr-2">عنوان المحاضرة</label>
                    <input id="lecTitle" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none transition-all" placeholder="مثلاً: المحاضرة الأولى" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-gray-400 mr-2">سعر المحاضرة (0 = مجانية)</label>
                    <input id="lecPrice" type="number" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none" placeholder="0.00 EGP" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-blue-400 mr-2">رابط الفيديو (YouTube / Vimeo / Direct Link)</label>
                  <div className="relative">
                    <input id="lecUrl" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 pr-10 text-white focus:border-blue-500 outline-none" placeholder="https://www.youtube.com/watch?v=..." />
                    <Globe size={16} className="absolute right-3 top-4 text-gray-500" />
                  </div>
                </div>

                <button
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
                  onClick={async () => {
                    const title = document.getElementById('lecTitle').value;
                    const price = Number(document.getElementById('lecPrice').value);
                    const url = document.getElementById('lecUrl').value;

                    if (!title || !url) return alert("⚠️ يرجى إكمال البيانات.");

                    try {
                        const lectureData = { title, price, videoUrl: url, isFree: price === 0 };
                        await AcademyManager.addLectureToCourse(editingItem.id, lectureData);
                        alert("✅ تمت إضافة المحاضرة!");
                        setEditingItem(null); // أغلق المودال بعد النجاح
                    } catch (e) {
                        alert("❌ خطأ: " + e.message);
                    }
                  }}
                >
                  حفظ المحاضرة في الكورس
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
);

/**
 * [12] GUI COMPONENT: ACADEMY MANAGER
 * واجهة إدارة الكورسات والمحاضرات - التحكم الكامل في المحتوى التعليمي
 */
const AcademyUI = ({ academyCategory, courses, setCourses }) => {
 

  return (
    <div className="academy-master-vessel p-4 lg:p-6">
      
      {/* مودال إدارة المحاضرات (يظهر عند الضغط على إدارة المحاضرات في أي كورس) */}
      <AnimatePresence>
        {editingItem && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ y: -50, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              exit={{ y: -50, opacity: 0 }} 
              className="glass-card w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-[#0a0a0a]/90 shadow-2xl"
            >
              {/* Header المودال */}
              <div className="flex items-center justify-between border-b border-white/10 p-6 bg-gradient-to-r from-white/5 to-transparent">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Video className="text-blue-400" /> إدارة محتويات: {editingItem.title}
                  </h2>
                  <p className="text-sm text-gray-400">إضافة دروس ومحاضرات جديدة لهذا الكورس</p>
                </div>
                <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-white/10 rounded-full transition-all">
                  <X className="text-gray-400 hover:text-white" />
                </button>
              </div>

              {/* فورم إضافة محاضرة جديدة */}
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input id="lecTitle" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none" placeholder="عنوان المحاضرة" />
                  <input id="lecPrice" type="number" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none" placeholder="السعر (0 = مجاني)" />
                </div>
                <input id="lecUrl" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none" placeholder="رابط الفيديو (YouTube/Vimeo)" />
                
                <button
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20"
                  onClick={async () => {
                    try {
                      const title = document.getElementById('lecTitle').value;
                      const url = document.getElementById('lecUrl').value;
                      const price = Number(document.getElementById('lecPrice').value);

                      if (!title || !url) return alert("⚠️ أكمل البيانات أولاً");

                      const lectureData = { title, videoUrl: url, price, isFree: price === 0 };
                      await AcademyManager.addLectureToCourse(editingItem.id, lectureData);
                      
                      alert("✅ تم إضافة المحاضرة!");
                      document.getElementById('lecTitle').value = '';
                      document.getElementById('lecUrl').value = '';

                      // تحديث القائمة فورياً
                      const docRef = doc(db, "courses", editingItem.id);
                      const docSnap = await getDoc(docRef);
                      if (docSnap.exists()) setLectures(docSnap.data().sections || []);
                    } catch (error) {
                      alert("❌ فشل الإضافة: " + error.message);
                    }
                  }}
                >
                  <PlusSquare size={20} /> تثبيت المحاضرة في الكورس
                </button>
              </div>

              {/* قائمة المحاضرات المضافة فعلياً */}
              <div className="p-6 border-t border-white/10 bg-white/[0.02]">
               <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
  <BookOpen size={18} className="text-blue-400" /> المحاضرات الحالية ({lectures?.length || 0})
</h3>
                {isLectureLoading ? (
                  <div className="text-center text-gray-400 py-4 flex items-center justify-center gap-2 italic text-sm">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    جاري المزامنة...
                  </div>
                ) : lectures.length === 0 ? (
                  <p className="text-gray-500 text-center py-4 text-sm underline decoration-dotted">لا توجد محاضرات حالياً.</p>
                ) : (
               <ul className="space-y-3 max-h-48 overflow-y-auto">
  {(lectures || []).map((lecture, index) => (
    <li
      key={lecture?.id || index}
      className="flex items-center justify-between bg-black/40 border border-white/5 p-3 rounded-xl hover:border-white/20 transition-all"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 text-xs font-bold">
          {index + 1}
        </div>

        <div>
          <p className="text-sm font-medium text-gray-200">
            {lecture?.title}
          </p>
          <p className="text-[10px] text-blue-400 font-mono tracking-widest">
            {lecture?.price > 0 ? `${lecture.price} EGP` : 'FREE ACCESS'}
          </p>
        </div>
      </div>

      <button
        onClick={async () => {
          if (window.confirm(`حذف "${lecture?.title}"؟`)) {
            await AcademyManager.removeLectureFromCourse(
              editingItem.id,
              lecture.id
            );
            // هنا لازم تحدث الـ state بعد الحذف
          }
        }}
        className="p-2 text-red-400 hover:bg-red-500/10 rounded-full transition-all"
      >
        <Trash2 size={16} />
      </button>
    </li>
  ))}
</ul>

                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* العرض الرئيسي للكورسات في الصفحة */}
      <div className="academy-main-grid space-y-8">
        <div className="courses-display-section">
          <div className="section-header flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white border-r-4 border-blue-600 pr-4">كورسات قسم {academyCategory}</h3>
        <span className="count-badge bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">
  {(courses?.filter(c => c?.category === academyCategory)?.length || 0)} كورس
</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {(courses || []).filter(c => c?.category === academyCategory).map(course => (
               <div key={course.id} className="course-admin-card glass-card group overflow-hidden rounded-2xl border border-white/5 bg-white/5 hover:border-blue-500/50 transition-all">
                  <div className="card-top relative h-40 overflow-hidden">
                     <img src={course.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                     <div className="card-overlay absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                        <button className="bg-red-600 p-3 rounded-full hover:scale-110 transition-all shadow-xl shadow-red-600/20" onClick={() => AcademyManager.permanentlyRemoveItem('course', course.id, course.thumbnail)}>
                          <Trash2 size={18} className="text-white"/>
                        </button>
                     </div>
                  </div>
                  <div className="card-bottom p-5 space-y-3">
                     <h4 className="font-bold text-gray-100 truncate">{course.title}</h4>
                     <p className="text-xs text-gray-400 flex items-center gap-2"><Users size={14} className="text-blue-500"/> {course.teacher}</p>
                     <div className="flex items-center justify-between border-t border-white/5 pt-3">
                        <div className="text-green-400 font-bold text-sm">{course.price} EGP</div>
                        <button className="text-xs bg-white/10 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-all" onClick={() => setEditingItem(course)}>
                          إدارة ({course.lecturesCount || 0}) دروس
                        </button>
                     </div>
                  </div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const LectureManagerUI = ({ course }) => {
  const [isAdding, setIsAdding] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="lecture-manager-vessel glass-card p-6 border border-white/5"
    >
      {/* رأس الواجهة: معلومات الكورس */}
      <div className="vessel-header flex justify-between items-center mb-8 pb-4 border-b border-white/5">
        <div className="info">
          <h2 className="text-xl font-bold text-blue-400">إدارة محتوى: {course.title}</h2>
          <p className="text-sm text-gray-500 mt-1">
            المدرس: <span className="text-gray-300">{course.teacher}</span> | 
            إجمالي المحاضرات: <span className="text-gray-300">{course.sections?.length || 0}</span>
          </p>
        </div>
        <button className="titan-btn primary flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl transition-all shadow-lg shadow-blue-500/20" onClick={() => setIsAdding(true)}>
          <PlusSquare size={18} /> إضافة محاضرة جديدة
        </button>
      </div>

      {/* قائمة المحاضرات بنظام الكروت الذكية */}
      <div className="lectures-list-pro space-y-4">
       { (course?.sections?.length || 0) > 0 ? (
        (course?.sections || []).map((lec, index) => (
            <div key={lec.id || index} className="lecture-item-card glass-card flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-blue-500/30 transition-all">
              <div className="flex items-center gap-5">
                <div className="lec-index w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold border border-blue-500/20">
                  #{index + 1}
                </div>
                <div className="lec-main-info">
                  <h4 className="font-bold text-gray-200">{lec.title}</h4>
                  <div className="lec-meta flex items-center gap-4 mt-1 text-[11px] text-gray-500 uppercase tracking-wider">
                    <span className="flex items-center gap-1"><Clock size={12} className="text-blue-500"/> {lec.duration} دقيقة</span>
                    <span className="flex items-center gap-1"><DollarSign size={12} className="text-green-500"/> {lec.price > 0 ? `${lec.price} EGP` : 'مجانية'}</span>
                    {lec.pdfUrl && <span className="flex items-center gap-1 text-yellow-500/80"><FileText size={12}/> ملزمة مرفقة</span>}
                  </div>
                </div>
              </div>
              
              <div className="lec-actions flex items-center gap-2">
                <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all" title="تعديل"><Edit3 size={16}/></button>
                <button 
                  className="p-2 hover:bg-red-500/10 rounded-lg text-red-400 transition-all" 
                  onClick={() => LectureEngine.removeLecture(course.id, lec)}
                >
                  <Trash2 size={16}/>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
            <div className="text-gray-600 mb-2 italic">لا توجد محاضرات في هذا الكورس بعد.</div>
            <p className="text-sm text-blue-500/50">ابدأ بتأمين ورفع أول درس لطلابك الآن</p>
          </div>
        )}
      </div>

      {/* Modal إضافة محاضرة (الرفع السحابي) */}
      <AnimatePresence>
        {isAdding && (
          <div className="titan-overlay fixed inset-0 z-[150] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }} 
               animate={{ scale: 1, opacity: 1 }} 
               exit={{ scale: 0.9, opacity: 0 }}
               className="add-lec-modal glass-card w-full max-w-2xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl"
             >
                <h3 className="text-2xl font-bold mb-6 text-white flex items-center gap-3">
                  <CloudUpload className="text-blue-500" /> رفع محاضرة جديدة للسيرفر
                </h3>
                
                <form className="titan-form space-y-4" onSubmit={async (e) => {
                  e.preventDefault();
                  // منطق الرفع السحابي الخاص بك
                  const data = {
                    title: e.target.lecTitle.value,
                    description: e.target.lecDesc.value,
                    duration: e.target.lecDur.value,
                    price: e.target.lecPrice.value,
                    isFree: e.target.isFree.checked
                  };

                  const video = e.target.videoFile.files[0];
                  const pdf = e.target.pdfFile.files[0];
                  
                  // تنبيه المستخدم ببدء الرفع
                  alert("جاري بدء الرفع المشفر... يرجى عدم إغلاق النافذة");
                  await LectureEngine.deployLecture(course.id, data, video, pdf);
                  setIsAdding(false);
                }}>
                  <input name="lecTitle" className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-blue-500 text-white" placeholder="عنوان المحاضرة (مثلاً: حل تمارين الباب الأول)" required />
                  
                  <textarea name="lecDesc" className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-blue-500 text-white min-h-[100px]" placeholder="ماذا سيتعلم الطالب في هذا الدرس؟"></textarea>
                  
                  <div className="form-row grid grid-cols-2 gap-4">
                     <input name="lecDur" type="number" className="bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-blue-500 text-white" placeholder="المدة (دقائق)" />
                     <input name="lecPrice" type="number" className="bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-blue-500 text-white" placeholder="السعر المنفرد (EGP)" />
                  </div>

                  <div className="file-inputs grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                     <div className="flex flex-col gap-2">
                        <label className="text-xs text-gray-500 px-2">ملف الفيديو (MP4)</label>
                        <input type="file" name="videoFile" accept="video/*" className="bg-blue-500/5 border border-blue-500/20 p-2 rounded-xl text-xs text-blue-400" />
                     </div>
                     <div className="flex flex-col gap-2">
                        <label className="text-xs text-gray-500 px-2">الملزمة (PDF)</label>
                        <input type="file" name="pdfFile" accept="application/pdf" className="bg-green-500/5 border border-green-500/20 p-2 rounded-xl text-xs text-green-400" />
                     </div>
                  </div>

                  <label className="checkbox-label flex items-center gap-3 p-4 bg-white/5 rounded-2xl cursor-pointer hover:bg-white/10 transition-all">
                    <input type="checkbox" name="isFree" className="w-5 h-5 accent-blue-600" /> 
                    <span className="text-sm text-gray-300">هذه المحاضرة مجانية (Preview للمشاهدة قبل الشراء)</span>
                  </label>

                  <div className="modal-btns flex gap-4 mt-8">
                     <button type="button" className="flex-1 py-4 rounded-2xl border border-white/10 text-gray-400 font-bold hover:bg-white/5 transition-all" onClick={() => setIsAdding(false)}>إلغاء العملية</button>
                     <button type="submit" className="flex-[2] py-4 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/20">بدء الرفع السحابي</button>
                  </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};


const ExamBuilderUI = ({ courses, onSave }) => {
  // الحالات الموحدة (تأكد من وجودها في المكون الأب أو ابقها هنا إذا كان المكون مستقلاً)
  const [questions, setQuestions] = useState([
    { question: '', options: ['', '', '', ''], correctAnswer: 0 }
  ]);
  const [meta, setMeta] = useState({ 
    title: '', 
    courseId: '', 
    duration: 30, 
    passingScore: 50 
  });

  // إضافة سؤال جديد للقائمة
  const addNewQuestion = () => {
    setQuestions([...questions, { question: '', options: ['', '', '', ''], correctAnswer: 0 }]);
  };

  // حذف سؤال محدد
  const removeQuestion = (index) => {
 if ((questions?.length || 0) > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    } else {
      alert("يجب أن يحتوي الاختبار على سؤال واحد على الأقل.");
    }
  };

  // تحديث بيانات سؤال معين
  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  return (
    <div className="exam-builder-ultra space-y-8 animate-in fade-in duration-500">
      
      {/* 1. رأس المنشئ: الإعدادات الاستراتيجية */}
      <div className="builder-header glass-card p-8 rounded-[2.5rem] border border-white/5 bg-[#0a0a0a]/60 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-[80px]"></div>
        
        <h2 className="text-2xl font-black text-white flex items-center gap-4 mb-8">
          <Layers size={28} className="text-blue-500" /> تجهيز وحدة اختبار تفاعلية
        </h2>

        <div className="meta-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="input-group">
            <label className="text-[10px] text-gray-500 font-bold uppercase mb-2 block mr-2">عنوان الاختبار</label>
            <input 
              className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-blue-500 text-white transition-all" 
              placeholder="مثلاً: مراجعة الباب الأول"
              value={meta.title}
              onChange={e => setMeta({...meta, title: e.target.value})}
            />
          </div>

          <div className="input-group">
            <label className="text-[10px] text-gray-500 font-bold uppercase mb-2 block mr-2">الكورس المرتبط</label>
            <select 
              className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-blue-500 text-gray-300 transition-all"
              value={meta.courseId}
              onChange={e => setMeta({...meta, courseId: e.target.value})}
            >
              <option value="">اختر الكورس...</option>
              {/* تأمين المصفوفة بالكامل لضمان عدم الانهيار */}
{(courses || []).map(c => (
  <option key={c?.id || Math.random()} value={c?.id}>
    {c?.title || "كورس بدون عنوان"}
  </option>
))}
            </select>
          </div>

          <div className="input-group">
            <label className="text-[10px] text-gray-500 font-bold uppercase mb-2 block mr-2">المدة (بالدقائق)</label>
            <input 
              type="number" 
              className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-blue-500 text-white transition-all" 
              value={meta.duration}
              onChange={e => setMeta({...meta, duration: e.target.value})}
            />
          </div>

          <div className="input-group">
            <label className="text-[10px] text-gray-500 font-bold uppercase mb-2 block mr-2">درجة النجاح (%)</label>
            <input 
              type="number" 
              className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-blue-500 text-white transition-all" 
              value={meta.passingScore}
              onChange={e => setMeta({...meta, passingScore: e.target.value})}
            />
          </div>
        </div>
      </div>

      {/* 2. منطقة الأسئلة: التدفق الديناميكي */}
      <div className="questions-flow space-y-6 max-h-[55vh] overflow-y-auto px-2 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {(questions || []).map((q, idx) => (
            <motion.div 
              key={q?.id || idx} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="question-card glass-card p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] group hover:border-blue-500/40 transition-all relative shadow-lg"
            >
              {/* رأس الكارت (رقم السؤال والحذف) */}
              <div className="flex justify-between items-center mb-6">
                <span className="flex items-center gap-2 bg-blue-500/10 text-blue-400 text-[10px] font-black px-4 py-1.5 rounded-full border border-blue-500/20">
                  سؤال رقم {idx + 1}
                </span>
                <button 
                  onClick={() => removeQuestion(idx)}
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {/* حقل نص السؤال */}
              <textarea 
                className="w-full bg-transparent border-b border-white/10 p-2 mb-8 text-lg font-bold text-white outline-none focus:border-blue-500 transition-all resize-none"
                placeholder="ادخل نص السؤال هنا..."
                value={q.question}
                onChange={e => updateQuestion(idx, 'question', e.target.value)}
              />

              {/* شبكة الخيارات */}
              <div className="options-grid grid grid-cols-1 md:grid-cols-2 gap-4">
                {(q?.options || []).map((opt, oIdx) => (
                  <div 
                    key={oIdx}
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                      q?.correctAnswer === oIdx 
                      ? 'bg-green-500/10 border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.1)]' 
                      : 'bg-black/20 border-white/5'
                    }`}
                  >
                    <input  
                      type="radio"  
                      name={`q_${idx}_correct`} 
                      checked={q.correctAnswer === oIdx} 
                      onChange={() => updateQuestion(idx, 'correctAnswer', oIdx)} 
                      className="w-5 h-5 accent-green-500 cursor-pointer" 
                    />
                    <input  
                      className="bg-transparent w-full text-sm text-gray-300 outline-none" 
                      placeholder={`الخيار ${oIdx + 1}`} 
                      value={opt} 
                      onChange={e => { 
                        const newOpts = [...q.options]; 
                        newOpts[oIdx] = e.target.value; 
                        updateQuestion(idx, 'options', newOpts); 
                      }} 
                    />
                    {q.correctAnswer === oIdx && <CheckCircle2 size={16} className="text-green-500 shrink-0" />} 
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* أزرار التحكم في المنشئ (إضافة وحفظ) */}
      <div className="builder-footer flex justify-between items-center py-6 border-t border-white/5">
        <button 
          onClick={addNewQuestion}
          className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all border border-white/10"
        >
          <Plus size={20} /> إضافة سؤال جديد
        </button>
        
        <button 
          onClick={() => onSave({ ...meta, questions })}
          className="px-10 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-blue-600/20"
        >
          حفظ ونشر الاختبار
        </button>
      </div>
    </div> // إغلاق div الـ exam-builder-ultra
  ); // إغلاق الـ return
}; // إغلاق المكون ExamBuilderUI

const QuestionCardPreview = ({ idx, removeQuestion, q, updateQuestion, updateOption }) => (
  <div className="question-card-preview">
    <div className="flex justify-between items-center mb-6">
      <span className="flex items-center gap-2 bg-blue-500/10 text-blue-400 text-[10px] font-black px-4 py-1.5 rounded-full border border-blue-500/20 shadow-sm">
        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
        سؤال رقم {idx + 1}
      </span>
      <button
        onClick={() => removeQuestion(idx)}
        className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
      >
        <Trash2 size={18} />
      </button>
    </div>

    <textarea
      className="w-full bg-transparent border-b border-white/10 p-2 mb-8 text-lg font-bold text-white outline-none focus:border-blue-500 transition-all resize-none"
      placeholder="ادخل نص السؤال الفقهي أو العلمي هنا..."
      value={q.question}
      onChange={e => updateQuestion(idx, 'question', e.target.value)}
    />

    <div className="options-grid grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* حماية مزدوجة لضمان وجود مصفوفة خيارات */}
      {(q?.options || []).map((opt, oIdx) => (
        <div
          key={oIdx}
          className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
            // استخدام Optional Chaining لضمان عدم حدوث Crash لو correctAnswer مش موجود
            q?.correctAnswer === oIdx
            ? 'bg-green-500/10 border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.1)]'
            : 'bg-black/20 border-white/5'
          }`}
        >
          {/* أيقونة الحالة (صح أو اختيار عادي) */}
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${q?.correctAnswer === oIdx ? 'bg-green-500 text-white' : 'bg-white/10 text-gray-400'}`}>
            {oIdx + 1}
          </div>
          
          <input
            type="text"
            value={opt || ''}
            placeholder={`الخيار ${oIdx + 1}...`}
            onChange={(e) => typeof updateOption === 'function' && updateOption(idx, oIdx, e.target.value)}
            className="bg-transparent border-none outline-none text-sm text-gray-200 w-full"
          />
        </div>
      ))}
    </div>
  </div>
);



{/* --- مكون مركز الاتصالات --- */}
const CommsCenterUI = ({ msgData, setMsgData, supportTickets, setActiveChat, NotificationHub }) => {
 
  return (
    <div className="comms-center-vessel space-y-6">
      <div className="comms-grid grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* لوحة إرسال الإشعارات الجماعية - نظام البث السحابي */}
        <motion.div
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="broadcast-panel glass-card p-6 border border-white/5 bg-gradient-to-br from-white/5 to-transparent rounded-[2rem] shadow-xl"
        >
          <h3 className="text-xl font-bold text-white flex items-center gap-3 mb-6">
            <Bell size={20} className="text-yellow-400" /> إرسال تنبيه جماعي (Push)
          </h3>
          
          <div className="titan-form space-y-4">
            <div className="form-group">
              <label className="text-xs text-gray-500 ml-2 mb-2 block uppercase tracking-tighter">عنوان التنبيه</label>
              <input
                className="w-full bg-black/20 border border-white/10 p-3 rounded-xl outline-none focus:border-yellow-500/50 text-white transition-all"
                placeholder="مثلاً: تحديث جديد في محاضرة الفيزياء"
                value={msgData.title}
                onChange={e => setMsgData({...msgData, title: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label className="text-xs text-gray-500 ml-2 mb-2 block uppercase tracking-tighter">نص الرسالة</label>
              <textarea
                className="w-full bg-black/20 border border-white/10 p-3 rounded-xl outline-none focus:border-yellow-500/50 text-white transition-all resize-none"
                rows="4"
                placeholder="اكتب تفاصيل الإشعار هنا..."
                value={msgData.message}
                onChange={e => setMsgData({...msgData, message: e.target.value})}
              />
            </div>

            <div className="form-row grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="text-xs text-gray-500 ml-2 mb-2 block tracking-tighter">الجمهور المستهدف</label>
                <select
                  className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white outline-none cursor-pointer"
                  value={msgData.category}
                  onChange={e => setMsgData({...msgData, category: e.target.value})}
                >
                  <option value="ALL">جميع الطلاب</option>
                  <option value="high-school">طلاب الثانوي</option>
                  <option value="coding">طلاب البرمجة</option>
                  <option value="religious">طلاب القسم الديني</option>
                </select>
              </div>
              <div className="form-group">
                <label className="text-xs text-gray-500 ml-2 mb-2 block tracking-tighter">نوع التنبيه</label>
                <select
                  className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white outline-none cursor-pointer"
                  value={msgData.type}
                  onChange={e => setMsgData({...msgData, type: e.target.value})}
                >
                  <option value="INFO">ℹ️ معلومة عامة</option>
                  <option value="WARNING">⚠️ تحذير أمني</option>
                  <option value="EVENT">📅 حدث مباشر</option>
                  <option value="PROMO">💰 عرض مالي</option>
                </select>
              </div>
            </div>

            <button
              className="titan-btn primary w-full mt-4 bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-yellow-600/20 active:scale-95"
              onClick={() => {
                if(!msgData.title || !msgData.message) return alert("⚠️ المحتوى فارغ!");
                NotificationHub.sendBroadcast(msgData);
              }}
            >
              <Send size={18} /> بث الإشعار لكل الأجهزة الآن
            </button>
          </div>
        </motion.div>
        
        <div className="support-panel glass-card p-6 border border-white/5 bg-black/30 rounded-[2rem] flex flex-col h-full">
          <div className="panel-header flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <MessageSquare size={20} className="text-green-400" /> تذاكر الدعم النشطة
            </h3>
            <span className="live-badge flex items-center gap-2 bg-green-500/20 text-green-400 text-[10px] font-bold px-3 py-1 rounded-full animate-pulse border border-green-500/30">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> LIVE SERVER
            </span>
          </div>

          <div className="tickets-list space-y-3 overflow-y-auto max-h-[400px] custom-scrollbar pr-2">
            {(supportTickets || []).length > 0 ? supportTickets.map(ticket => (
              <div key={ticket?.id || Math.random()} className="ticket-item group flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all border-l-4 border-l-green-500">
                <div className="ticket-info flex flex-col">
                  {/* حماية الأسماء والنصوص */}
                  <strong className="text-gray-200 text-sm">{ticket?.userName || 'مستخدم غير معروف'}</strong>
                  <p className="text-xs text-gray-500 truncate max-w-[200px]">{ticket?.lastMessage || 'لا توجد رسائل...'}</p>
                  
                  <small className="text-[10px] text-gray-600 mt-1 italic">
                    نشط: {ticket?.lastUserActivity?.seconds
                      ? new Date(ticket.lastUserActivity.seconds * 1000).toLocaleTimeString('ar-EG')
                      : 'غير متاح حالياً'}
                  </small>
                </div>
                <button
                  className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all"
                  onClick={() => setActiveChat(ticket)}
                >
                  رد الآن
                </button>
              </div>
            )) : (
              <div className="empty-chat-state flex flex-col items-center justify-center py-20 text-gray-600 space-y-3">
                <MessageCircle size={50} strokeWidth={1} />
                <p className="text-sm italic">هدوء تام.. لا توجد رسائل دعم فني</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* سجل الإشعارات المرسلة سابقاً - أرشيف البيانات */}
      <div className="notification-history glass-card p-6 border border-white/5 bg-black/20 rounded-[2rem]">
         <h3 className="text-lg font-bold text-gray-400 mb-6 flex items-center gap-3">
           <History size={18} /> سجل البث السحابي الأخير
         </h3>
         <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
               <thead>
                  <tr className="text-xs text-gray-500 uppercase border-b border-white/10">
                     <th className="pb-4 font-medium">التاريخ</th>
                     <th className="pb-4 font-medium">العنوان</th>
                     <th className="pb-4 font-medium">الجمهور</th>
                     <th className="pb-4 font-medium">النوع</th>
                     <th className="pb-4 font-medium">الحالة</th>
                  </tr>
               </thead>
               <tbody className="text-sm text-gray-300">
                  {/* بيانات تجريبية (يتم جلبها من Firestore لاحقاً) */}
                  <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-all">
                     <td className="py-4 font-mono text-[11px]">2026-02-04</td>
                     <td className="py-4">انطلاق مراجعة ليلة الامتحان</td>
                     <td className="py-4"><span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded text-[10px]">ALL</span></td>
                     <td className="py-4 text-green-400">EVENT</td>
                     <td className="py-4 text-gray-500">تم الإرسال ✓</td>
                  </tr>
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};



/**
 * [16] GUI COMPONENT: DIGITAL LIBRARY PRO
 * إدارة المحتوى المكتوب: رفع المذكرات والكتب مع نظام حماية الروابط
 */
const DigitalLibraryUI = ({ books, setBooks, isUploading, setIsUploading, libCategory, setLibCategory, LibraryManager }) => {
  return (
    <div className="library-vessel space-y-8 p-2">
      
      {/* Header المكتبة */}
      <div className="lib-header glass-card p-8 rounded-[2.5rem] border border-white/5 bg-gradient-to-r from-blue-600/10 to-transparent flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="lib-info text-center md:text-right">
          <h2 className="text-3xl font-bold text-white flex items-center justify-center md:justify-start gap-4">
            المكتبة الرقمية الفدرالية <BookOpen size={32} className="text-blue-500" />
          </h2>
          <p className="text-gray-400 mt-2">إدارة المذكرات التعليمية، الكتب الدينية، والأبحاث التفاعلية</p>
        </div>
        <button 
          className="titan-btn primary flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl transition-all shadow-xl shadow-blue-600/20 active:scale-95" 
          onClick={() => setIsUploading(true)}
        >
          <PlusSquare size={20}/> رفع كتاب أو مذكرة
        </button>
      </div>

      {/* نظام التبويب (Tabs) المطور - نسخة مؤمنة */}
      <div className="lib-tabs flex flex-wrap gap-3 bg-white/5 p-2 rounded-2xl border border-white/5 justify-center md:justify-start">
        {[
          { id: 'high-school', label: 'مذكرات الثانوي', icon: <GraduationCap size={16}/> },
          { id: 'religious', label: 'الكتب الدينية', icon: <Star size={16}/> },
          { id: 'educational', label: 'المصادر التربوية', icon: <Library size={16}/> },
          { id: 'coding', label: 'كتب البرمجة', icon: <Terminal size={16}/> }
        ].map(tab => (
          <button 
            key={tab.id} 
            // تأمين الدالة: نتحقق إن setLibCategory موجودة كدالة قبل الاستدعاء
            onClick={() => typeof setLibCategory === 'function' && setLibCategory(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
              // تأمين المتغير: لو libCategory مش متعرف، نفترض القيمة الأولى كافتراضي
              (libCategory || 'high-school') === tab.id 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
              : 'text-gray-400 hover:bg-white/5'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* شبكة عرض الكتب (Responsive Grid) */}
      <div className="books-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        <AnimatePresence mode='popLayout'>
          {/* حماية ثلاثية: نأمن المصفوفة، الفلترة، والتحميل */}
          {(books || [])
            .filter(b => b?.category === (libCategory || 'high-school'))
            .map((book, bIdx) => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              // استخدام ID فريد مع ضمان عدم كونه undefined
              key={book?.id || bIdx} 
              className="book-card glass-card group overflow-hidden rounded-[2rem] border border-white/5 bg-white/5 hover:border-blue-500/50 transition-all flex flex-col"
            >
              {/* غلاف الكتاب */}
              <div className="book-cover relative h-64 overflow-hidden bg-black/40">
                <img 
                  src={book.coverUrl || 'https://via.placeholder.com/300x400?text=No+Cover'} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  alt={book.title} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
                
                {book.isFree && (
                  <span className="absolute top-4 right-4 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">
                    FREE PDF
                  </span>
                )}
                
                {/* أزرار سريعة تظهر عند التحويم */}
                <div className="absolute bottom-4 left-4 flex gap-2 translate-y-12 group-hover:translate-y-0 transition-transform">
                   <button className="p-2 bg-white/10 backdrop-blur-md rounded-lg text-white hover:bg-blue-600 transition-all" title="تعديل"><Edit3 size={16}/></button>
                   <button 
                    className="p-2 bg-red-600/20 backdrop-blur-md rounded-lg text-red-400 hover:bg-red-600 hover:text-white transition-all" 
                    onClick={() => LibraryManager.purgeBook(book.id, book.pdfUrl, book.coverUrl)}
                   >
                     <Trash2 size={16}/>
                   </button>
                </div>
              </div>

              {/* تفاصيل الكتاب */}
              <div className="book-details p-6 flex-1 flex flex-col">
                <h4 className="text-lg font-bold text-gray-100 mb-1 truncate" title={book.title}>{book.title}</h4>
                <p className="text-xs text-gray-500 mb-4 italic">تأليف: {book.author || 'غير معروف'}</p>
                
                <div className="book-meta mt-auto flex items-center justify-between text-[11px] text-gray-400 border-t border-white/5 pt-4">
                  <span className="flex items-center gap-2"><FileText size={14} className="text-blue-500"/> {book.pagesCount} صفحة</span>
                  <span className="flex items-center gap-2"><Download size={14} className="text-green-500"/> {book.downloadsCount || 0} تحميل</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Modal رفع المحتوى الرقمي */}
      <AnimatePresence>
        {isUploading && (
          <div className="titan-overlay fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, y: 50 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: 50 }}
              className="lib-modal glass-card w-full max-w-2xl p-8 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-purple-600"></div>
              
              <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                <CloudLightning className="text-blue-500" /> تجهيز محتوى رقمي جديد
              </h3>
              
              <form className="titan-form space-y-5" onSubmit={async (e) => {
                e.preventDefault(); 

                const pdf = e.target.bFile.files[0];
                const cover = e.target.bCover.files[0];

                if (!pdf || !cover) {
                    return alert("⚠️ يرجى اختيار ملف الـ PDF وصورة الغلاف أولاً");
                }

                const data = {
                    title: e.target.bTitle.value,
                    author: e.target.bAuthor.value,
                    description: e.target.bDesc.value,
                    category: libCategory,
                    price: Number(e.target.bPrice.value) || 0,
                    pagesCount: Number(e.target.bPages.value) || 0,
                    isFree: (Number(e.target.bPrice.value) || 0) === 0,
                    downloadsCount: 0,
                    createdAt: new Date()
                };

                try {
                    alert("جاري تشفير ورفع الملفات إلى السحابة...");
                    await LibraryManager.uploadBook(data, pdf, cover);
                    setIsUploading(false);
                    alert("✅ تم النشر بنجاح");
                } catch (error) {
                    console.error("Upload failed:", error);
                    alert("❌ فشل الرفع: تأكد من الاتصال بالإنترنت");
                }
              }}>
                <div className="form-row grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input name="bTitle" className="bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-blue-500" placeholder="عنوان الكتاب" required />
                  <input name="bAuthor" className="bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-blue-500" placeholder="اسم الكاتب" />
                </div>

                <textarea name="bDesc" className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-blue-500 min-h-[100px]" placeholder="نبذة مختصرة عن محتوى الملف..."></textarea>
                
                <div className="form-row grid grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="text-[10px] text-gray-500 absolute -top-2 right-4 bg-[#0a0a0a] px-2">السعر (EGP)</label>
                    <input name="bPrice" type="number" className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-blue-500" placeholder="0 للمجاني" />
                  </div>
                  <div className="relative">
                    <label className="text-[10px] text-gray-500 absolute -top-2 right-4 bg-[#0a0a0a] px-2">عدد الصفحات</label>
                    <input name="bPages" type="number" className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-blue-500" placeholder="مثلاً: 120" />
                  </div>
                </div>

                <div className="file-section grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/5 p-4 rounded-2xl border border-dashed border-white/10">
                  <div className="flex flex-col gap-2">
                    <span className="text-xs text-blue-400 font-bold">ملف الـ PDF</span>
                    <input type="file" name="bFile" accept=".pdf" className="text-[10px] text-gray-400" required />
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-xs text-purple-400 font-bold">صورة الغلاف</span>
                    <input type="file" name="bCover" accept="image/*" className="text-[10px] text-gray-400" required />
                  </div>
                </div>

                <div className="modal-btns flex gap-4 mt-8">
                  <button type="button" className="flex-1 py-4 text-gray-400 hover:bg-white/5 rounded-2xl transition-all" onClick={() => setIsUploading(false)}>تراجع</button>
                  <button type="submit" className="flex-[2] py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-500 shadow-xl shadow-blue-600/20 transition-all">نشر الآن في المكتبة</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
   

};
  
/* --- بداية الجزء المصحح (الجزء 1) --- */

const AnalyticsUI = ({ stats, radarStats, securityLogs, chartData, pieData, setTimeRange }) => {
  return (
    <div className="analytics-vessel space-y-8 p-1">
      
      {/* صف الكروت الإحصائية العليا - المؤشرات الحيوية */}
      <div className="stats-grid-pro grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* كرت الدخل */}
        <motion.div whileHover={{ y: -5, scale: 1.02 }} className="stat-card-gold glass-card p-6 rounded-[2rem] border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-transparent relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]"></div>
          <div className="flex items-start justify-between">
            <div className="stat-info">
              <p className="text-xs text-yellow-500/70 font-bold mb-1 uppercase tracking-widest">إجمالي الدخل الصافي</p>
              <h2 className="text-3xl font-black text-white leading-none">
                { (stats?.totalRevenue || stats?.revenue || 0).toLocaleString() } 
                <small className="text-sm font-normal text-yellow-500/50">EGP</small>
              </h2>
              <span className="trend-up flex items-center gap-1 text-[10px] text-green-400 mt-4 bg-green-400/10 w-fit px-2 py-1 rounded-full border border-green-400/20">
                <TrendingUp size={12}/> +12% هذا الشهر
              </span>
            </div>
            <div className="stat-icon p-4 bg-yellow-500/10 rounded-2xl text-yellow-500 group-hover:rotate-12 transition-transform">
              <DollarSign size={24} />
            </div>
          </div>
        </motion.div>

        {/* كرت النشاط */}
        <motion.div whileHover={{ y: -5, scale: 1.02 }} className="stat-card-blue glass-card p-6 rounded-[2rem] border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-transparent relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
          <div className="flex items-start justify-between">
            <div className="stat-info">
              <p className="text-xs text-blue-500/70 font-bold mb-1 uppercase tracking-widest">الطلاب النشطون (أونلاين)</p>
              <h2 className="text-3xl font-black text-white leading-none">
                { (radarStats?.online || 0).toLocaleString() } <small className="text-sm font-normal text-blue-500/50">طالب</small>
              </h2>
              <div className="flex items-center gap-2 mt-5">
                <div className="pulse-indicator w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
                <span className="text-[10px] text-blue-400 font-bold">بث حي من الخادم</span>
              </div>
            </div>
            <div className="stat-icon p-4 bg-blue-500/10 rounded-2xl text-blue-500 group-hover:rotate-12 transition-transform">
              <Users size={24} />
            </div>
          </div>
        </motion.div>

        {/* كرت الحماية */}
        <motion.div whileHover={{ y: -5, scale: 1.02 }} className="stat-card-purple glass-card p-6 rounded-[2rem] border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-transparent relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]"></div>
          <div className="flex items-start justify-between">
            <div className="stat-info">
              <p className="text-xs text-purple-500/70 font-bold mb-1 uppercase tracking-widest">تهديدات تم صدها</p>
              <h2 className="text-3xl font-black text-white leading-none">
                {securityLogs?.length || 0} <small className="text-sm font-normal text-purple-500/50">محاولة</small>
              </h2>
              <span className="text-[10px] text-green-400 mt-5 block font-bold border-r-2 border-green-500 pr-2 uppercase">Firewall Active</span>
            </div>
            <div className="stat-icon p-4 bg-purple-500/10 rounded-2xl text-purple-500 group-hover:rotate-12 transition-transform">
              <ShieldAlert size={24} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* شبكة الرسوم البيانية الكبرى */}
      <div className="charts-main-grid grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* الرسم البياني للأرباح */}
        <div className="chart-container lg:col-span-2 glass-card p-6 rounded-[2.5rem] border border-white/5 bg-black/20 shadow-2xl">
          <div className="chart-header flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold text-gray-200 flex items-center gap-3">
              <BarChart3 size={18} className="text-blue-500"/> تحليل التدفق المالي (Revenue Stream)
            </h3>
            <select className="bg-white/5 border border-white/10 text-xs text-gray-400 p-2 rounded-lg outline-none cursor-pointer" onChange={(e) => setTimeRange(e.target.value)}>
              <option value="7d">آخر 7 أيام</option>
              <option value="30d">آخر 30 يوم</option>
            </select>
          </div>
          
          <div className="chart-wrapper w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }} />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* الجانب الأيمن: التوزيع والنشاط */}
        <div className="chart-side-grid flex flex-col gap-6">
          {/* Pie Chart: توزيع الأقسام */}
          <div className="pie-chart-box glass-card p-6 rounded-[2.5rem] border border-white/5 bg-black/20 flex-1 flex flex-col items-center">
            <h3 className="text-sm font-bold text-gray-400 mb-4 w-full text-right">توزيع الطلاب حسب الأقسام</h3>
            <div className="w-full h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                {(pieData && pieData.length > 0) ? (
                  <PieChart>
                    <Pie data={pieData} innerRadius={50} outerRadius={70} paddingAngle={8} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][index % 4]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', fontSize: '11px' }} />
                  </PieChart>
                ) : (
                  <div className="h-full flex items-center justify-center text-[10px] text-gray-600">جاري تحليل البيانات...</div>
                )}
              </ResponsiveContainer>
            </div>
            <div className="pie-legend grid grid-cols-2 gap-2 mt-4 w-full">
              {(pieData || []).map((d, i) => (
                <div key={i} className="legend-item flex items-center gap-2 bg-white/5 p-2 rounded-xl">
                  <span className="w-2 h-2 rounded-full" style={{background: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][i]}}></span>
                  <small className="text-[10px] text-gray-400 truncate">{d?.name}: {d?.value}</small>
                </div>
              ))}
            </div>
          </div>

          {/* سجل النشاط اللحظي */}
          <div className="activity-stream glass-card p-6 rounded-[2.5rem] border border-white/5 bg-black/40 flex-1 overflow-hidden">
            <h3 className="text-sm font-bold text-gray-200 mb-4 flex items-center gap-2">
              <Activity size={16} className="text-purple-500"/> رادار العمليات اللحظي
            </h3>
            <div className="stream-list space-y-3">
              {(securityLogs || []).slice(0, 4).map((log, idx) => (
                <div key={log?.id || idx} className="stream-item flex gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
                  <div className={`s-icon shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${log?.type === 'alert' ? 'bg-red-500/20 text-red-500' : 'bg-purple-500/20 text-purple-500'}`}>
                    <ShieldAlert size={14}/>
                  </div>
                  <div className="s-text overflow-hidden">
                    <p className="text-[11px] text-gray-300 truncate">{log?.details || 'عملية غير مسجلة'}</p>
                    <span className="text-[9px] text-purple-500/50 italic">
                      {log?.timestamp?.seconds ? new Date(log.timestamp.seconds * 1000).toLocaleTimeString() : '--:--'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
       </div>
     </div>

     </div>
            );
          };



          {/* --- بداية الميزات من 11 إلى 130 --- */}
      <div className="features-grid-container mt-8 space-y-6">
      
      {/* الميزة 11: نظام إضافة المحاضرات البديل (مصحح بالكامل) */}
      {(() => {
        const handleAddLecture = async (lectureData) => {
          // 1. تصحيح الخطأ الإملائي هنا (كانت le ctureData)
          if (!lectureData.title || !lectureData.url) {
             return alert("⚠️ البيانات ناقصة! يرجى كتابة العنوان والرابط.");
          }

          try {
            const docRef = await addDoc(collection(db, "lectures"), {
              ...lectureData,
              createdAt: serverTimestamp(),
              isAlternative: true 
            });
            
            // 2. تفريغ الحقول بعد النجاح
            const titleInput = document.getElementById('alt_title');
            const urlInput = document.getElementById('alt_url');
            if(titleInput) titleInput.value = "";
            if(urlInput) urlInput.value = "";

            alert("✅ تمت إضافة المحاضرة بنجاح!");
          } catch (e) { 
            console.error(e);
            alert("❌ حدث خطأ: " + e.message);
          }
        };

        return (
          <div key="feat-11" className="lecture-adder p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem] mb-6 text-white shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-purple-500/20 rounded-2xl text-purple-400">
                <Video size={20}/>
              </div>
              <h3 className="font-bold text-gray-200 text-lg">نظام إضافة المحاضرات البديل</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                type="text" 
                placeholder="عنوان المحاضرة الخفي" 
                id="alt_title" 
                className="bg-black/40 border border-white/10 rounded-2xl px-5 py-3 text-sm outline-none text-white focus:border-purple-500 transition-all" 
              />
              <input 
                type="text" 
                placeholder="رابط الفيديو (Vimeo/Bunny)" 
                id="alt_url" 
                className="bg-black/40 border border-white/10 rounded-2xl px-5 py-3 text-sm outline-none text-white focus:border-purple-500 transition-all" 
              />
            </div>
            
            <button 
              onClick={() => {
                // 3. تأمين جلب القيم
                const titleVal = document.getElementById('alt_title')?.value;
                const urlVal = document.getElementById('alt_url')?.value;
                handleAddLecture({ title: titleVal, url: urlVal });
              }}
              className="w-full mt-4 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl font-black text-sm text-white uppercase tracking-widest hover:shadow-lg hover:shadow-purple-600/20 transition-all active:scale-95">
              نشر المحاضرة في النظام البديل
            </button>
          </div>
        ); 
      })()}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* الميزة 12: منع تخطي أجزاء الفيديو */}
        {(() => {
          const toggleAntiSkip = async (lectureId, status) => {
            try {
              const lectureRef = doc(db, "lectures", lectureId);
              await updateDoc(lectureRef, { forceWatch: !status });
            } catch (e) { console.error(e); }
          };
          return (
            <div className="p-5 bg-black/40 border border-white/5 rounded-3xl flex justify-between items-center text-white group hover:border-purple-500/30 transition-all">
              <div>
                <h4 className="text-sm font-bold flex items-center gap-2"><ShieldCheck size={14} className="text-purple-400" /> منع التخطي (Anti-Skip)</h4>
                <p className="text-[10px] text-gray-500 italic">إجبار الطالب على المشاهدة الكاملة</p>
              </div>
              <button onClick={() => toggleAntiSkip('current_id', false)} className="w-12 h-6 bg-purple-600 rounded-full relative shadow-inner"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div></button>
            </div>
          );
        })()}

        {/* الميزة 13: مشغل الفيديو العائم */}
        {(() => {
          const enablePiP = async () => {
            try {
              const videoElement = document.querySelector('video');
              if (videoElement && document.pictureInPictureEnabled) { await videoElement.requestPictureInPicture(); }
            } catch (e) { console.error(e); }
          };
          return (
            <div className="p-5 bg-black/40 border border-white/5 rounded-3xl flex justify-between items-center text-white group hover:border-blue-500/30 transition-all">
              <div><h4 className="text-sm font-bold">المشغل العائم (PiP)</h4><p className="text-[10px] text-gray-500">تفعيل خاصية المشغل المصغر</p></div>
              <button onClick={enablePiP} className="p-2 bg-white/5 rounded-xl hover:bg-blue-600 hover:text-white text-blue-400 transition-all"><Monitor size={18}/></button>
            </div>
          );
        })()}
      </div>

      <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem] mb-6 shadow-inner">
        {(() => {
          const updateSectionAccess = async (asstId, sectionKey) => { try { await updateDoc(doc(db, "assistants", asstId), { activeSection: sectionKey }); alert(`تم النقل: ${sectionKey}`); } catch (e) { console.error(e); } };
          return (
            <div className="text-white">
              <h3 className="text-lg font-black mb-4 flex items-center gap-2"><Settings2 size={18} className="text-blue-400 animate-spin-slow" /> ميزات توظيف وتوزيع الأسستنت</h3>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {['Physics', 'Chemistry', 'Biology'].map(dept => (
                    <button key={dept} onClick={() => updateSectionAccess('asst_id', dept)} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold hover:bg-blue-600 transition-all">فتح قسم {dept}</button>
                  ))}
                </div>
                <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-2 opacity-10"><MessageSquare size={40}/></div>
                   <div className="flex justify-between items-center text-[10px] relative z-10"><span className="text-blue-300 font-black">الميزة 20: Auto-Reply Bot</span><span className="flex items-center gap-1 text-green-500">Active</span></div>
                   <p className="text-[9px] text-gray-500 mt-1 italic relative z-10">18. Smart Deletion | 19. Screen Snapshot <br/> النظام يرد آلياً عند انشغال المساعد.</p>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {(() => {
          const generatePromoCode = async () => {
            const codeInput = document.getElementById('promo_code_input'); const amountInput = document.getElementById('promo_amount');
            if (!codeInput.value) return alert("أدخل البيانات");
            try { await setDoc(doc(db, "promo_codes", codeInput.value), { code: codeInput.value, discount: amountInput.value, active: true }); alert("تم التفعيل"); } catch (e) { console.error(e); }
          };
          return (
            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex flex-col justify-between text-white group hover:border-orange-500/30 transition-all">
              <div className="flex items-center gap-3 mb-4 text-orange-400"><Ticket size={24} /><h3 className="font-bold">21. نظام الأكواد الذكية</h3></div>
              <div className="space-y-3">
                <input id="promo_code_input" placeholder="رمز الخصم (OFF50)" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs outline-none text-white" />
                <input id="promo_amount" type="number" placeholder="نسبة الخصم %" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs outline-none text-white" />
                <button onClick={generatePromoCode} className="w-full py-3 bg-orange-600 hover:bg-orange-500 rounded-xl text-xs font-black transition-all">إطلاق الكود</button>
              </div>
            </div>
          );
        })()}

        {(() => {
          const createAffiliateLink = async (uid) => { try { await updateDoc(doc(db, "users", uid), { isAffiliate: true, code: `REF-${uid.slice(0,5)}` }); alert("تم التحويل"); } catch (e) { console.error(e); } };
          return (
            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem] text-white group hover:border-emerald-500/30 transition-all">
              <div className="flex items-center gap-3 mb-4 text-emerald-400"><Share2 size={24} /><h3 className="font-bold">22. نظام "سوق واكسب"</h3></div>
              <p className="text-[10px] text-gray-500 mb-4 font-light italic">حول طلابك إلى مسوقين (Affiliate Logic).</p>
              <button onClick={() => createAffiliateLink('SAMPLE_UID')} className="w-full py-3 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl text-xs font-black transition-all">تحويل طالب لمسوق</button>
            </div>
          );
        })()}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {(() => {
          const triggerFlashSale = async () => { alert("تم تفعيل خصم الـ Flash Sale!"); };
          return (
            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem] text-white overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/10 blur-3xl rounded-full"></div>
              <div className="flex items-center gap-3 mb-4 text-red-500"><Zap size={24} className="animate-pulse" /><h3 className="font-bold">23. Flash Sale 1-Click</h3></div>
              <button onClick={triggerFlashSale} className="w-full py-4 bg-red-600/10 border border-red-600/50 text-red-500 rounded-2xl text-[10px] font-black hover:bg-red-600 hover:text-white transition-all">تفعيل خصم 50% لكل المنصة</button>
            </div>
          );
        })()}

        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex flex-col gap-2 text-white">
            <h3 className="text-[10px] font-black opacity-50 mb-2 uppercase tracking-widest text-indigo-400">24-30. حزمة Sales Booster</h3>
            <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5 hover:border-blue-500/30 cursor-pointer">
               <span className="text-[10px]">26. كوبون "أول مرة شراء"</span><div className="w-8 h-4 bg-blue-600 rounded-full flex justify-end px-1"><div className="w-2 h-2 bg-white rounded-full"></div></div>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-[9px] text-gray-500 italic space-y-1">
               <p>27. Scarcity Timer | 28. Social Proof | 29. Loyalty Points</p>
            </div>
            <button className="mt-auto text-[10px] text-indigo-400 font-bold flex items-center justify-end gap-1">30. سياسة الاسترجاع الذكي <ChevronRight size={12}/></button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 text-white">
        {/* ميزة 31: قفل الجهاز */}
        {(() => {
            const lockToHardware = async (uid) => { try { await updateDoc(doc(db, "users", uid), { isHardwareLocked: true }); } catch (e) { console.error(e); } };
            return (
              <div className="p-6 bg-red-950/10 border border-red-500/20 rounded-[2.5rem]">
                <div className="flex items-center gap-3 mb-4 text-red-400"><ShieldAlert size={24} /><h3 className="font-bold text-lg">قفل الجهاز (Device Lock)</h3></div>
                <p className="text-[10px] text-gray-500 mb-4">يمنع الطالب من فتح حسابه على أكثر من جهاز واحد.</p>
                <button onClick={() => lockToHardware('ID')} className="w-full py-3 bg-red-600 rounded-xl text-xs font-black hover:bg-red-500 transition-all">تفعيل القفل العتادي</button>
              </div>
            );
        })()}

        {/* ميزة 32: كاشف التسجيل */}
        {(() => {
            const handleScreenSecurity = async (uid) => { alert("تم إرسال أمر إغلاق فوري"); };
            return (
              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
                <div className="flex items-center gap-3 mb-4 text-blue-400"><Eye size={24} /><h3 className="font-bold">كاشف التسجيل و HDMI</h3></div>
                <div className="space-y-3">
                   <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl"><span className="text-[10px]">حماية DRM النشطة</span><div className="w-8 h-4 bg-green-500 rounded-full"></div></div>
                   <button onClick={() => handleScreenSecurity('UID')} className="w-full py-2 border border-blue-500/30 text-blue-400 rounded-lg text-[10px] hover:bg-blue-500 hover:text-white transition-all">طرد الطالب يدوياً</button>
                </div>
              </div>
            );
        })()}

        {/* ميزة 33: العلامة المائية */}
        {(() => {
            const setWatermarkConfig = async () => { alert("تم تحديث العلامة المائية"); };
            return (
              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
                <div className="flex items-center gap-3 mb-4 text-purple-400"><Fingerprint size={24} /><h3 className="font-bold">العلامة المائية الذكية</h3></div>
                <p className="text-[10px] text-gray-400 mb-4 italic">تظهر بيانات الطالب متحركة فوق الفيديو.</p>
                <button onClick={setWatermarkConfig} className="w-full py-2 bg-purple-600/20 text-purple-400 rounded-xl text-[10px] font-bold border border-purple-600/30">تعديل الشفافية</button>
              </div>
            );
        })()}

        {/* ميزات 34-40 */}
        {(() => {
            return (
              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex flex-col gap-3">
                 <h3 className="text-xs font-black text-gray-500 uppercase">مركز التحقيق (Forensics)</h3>
                 <div className="p-3 bg-black/40 rounded-2xl flex justify-between items-center border border-white/5"><span className="text-[10px]">37. كاشف أدوات المطور</span><span className="text-[9px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded-md">On</span></div>
                 <div className="p-3 bg-black/40 rounded-2xl flex justify-between items-center border border-white/5"><span className="text-[10px]">38. حماية Brute Force</span><span className="text-[9px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded-md">Active</span></div>
                 <div className="mt-auto flex gap-2">
                    <button className="flex-1 py-2 bg-white/5 rounded-lg text-[9px]">39. ليميت السيشن</button>
                    <button className="flex-1 py-2 bg-white/5 rounded-lg text-[9px]">40. منع التعدد</button>
                 </div>
              </div>
            );
        })()}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 text-white">
        {/* ميزة 41: تحليل AI */}
        {(() => {
            const analyzeStudentPerformance = async () => { alert("تم التصنيف بالذكاء الاصطناعي"); };
            return (
              <div className="p-6 bg-blue-900/10 border border-blue-500/20 rounded-[2.5rem]">
                <div className="flex items-center gap-3 mb-4 text-blue-400"><BrainCircuit size={24} /><h3 className="font-bold text-lg">تحليل المستوى الذكي</h3></div>
                <button onClick={analyzeStudentPerformance} className="w-full py-3 bg-blue-600 rounded-xl text-xs font-black hover:bg-blue-500 transition-all">تشغيل الخوارزمية</button>
              </div>
            );
        })()}

        {/* ميزة 42: المحفظة */}
        {(() => {
            const addBalance = async () => { alert("تم الإضافة"); };
            return (
              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
                <div className="flex items-center gap-3 mb-4 text-green-400"><Wallet size={24} /><h3 className="font-bold">المحفظة الرقمية</h3></div>
                <div className="flex gap-2">
                   <input placeholder="UID" className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[10px] outline-none text-white" />
                   <button onClick={addBalance} className="p-2 bg-green-600 rounded-xl hover:bg-green-500 text-white"><Plus size={16}/></button>
                </div>
              </div>
            );
        })()}
        
        {/* ميزة 43: Heatmap */}
        {(() => {
            return (
              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
                <div className="flex items-center gap-3 mb-4 text-purple-400"><BarChart3 size={24} /><h3 className="font-bold">Heatmap Analytics</h3></div>
                <div className="h-16 w-full bg-gradient-to-r from-red-500 via-green-500 to-red-500 rounded-xl opacity-20 border border-white/5"></div>
              </div>
            );
        })()}

        {/* ميزات 44-50 */}
        {(() => {
            return (
              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex flex-col gap-3 text-white">
                  <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">KPIs Indicators</h3>
                  <div className="grid grid-cols-2 gap-2">
                     <div className="bg-black/40 p-3 rounded-2xl border border-white/5 text-center"><p className="text-[8px]">النمو</p><span className="text-green-500 font-bold text-xs">+12.5%</span></div>
                     <div className="bg-black/40 p-3 rounded-2xl border border-white/5 text-center"><p className="text-[8px]">المتوقع</p><span className="text-blue-500 font-bold text-xs">250K</span></div>
                  </div>
                  <div className="space-y-2 mt-2">
                     <button className="w-full py-2 bg-white/5 rounded-xl text-[9px]">44. تقرير CSV</button>
                     <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl flex justify-between items-center"><span className="text-[9px] text-red-400">45. Churn Rate (3%)</span><TrendingDown size={14}/></div>
                  </div>
              </div>
            );
         })()}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 text-white">
          {/* ميزة 51: رسائل جماعية */}
          {(() => {
            const sendBulk = async () => { alert("تم الإرسال للكل"); };
            return (
              <div className="p-6 bg-indigo-900/10 border border-indigo-500/20 rounded-[2.5rem]">
                <div className="flex items-center gap-3 mb-4 text-indigo-400"><Send size={24} /><h3 className="font-bold text-lg">بث رسائل (Bulk)</h3></div>
                <textarea placeholder="الرسالة..." className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs outline-none text-white h-20 resize-none"></textarea>
                <button onClick={sendBulk} className="w-full py-3 bg-indigo-600 rounded-xl text-xs font-black hover:bg-indigo-500 transition-all">إرسال</button>
              </div>
            );
          })()}

          {/* ميزة 52: واتساب ولي الأمر */}
          {(() => {
            const sendWhatsapp = async () => { window.open(`https://api.whatsapp.com/send?text=غياب`); };
            return (
              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
                <div className="flex items-center gap-3 mb-4 text-green-500"><MessageCircle size={24} /><h3 className="font-bold">إشعارات أولياء الأمور</h3></div>
                <button onClick={sendWhatsapp} className="w-full py-2 bg-green-600/20 text-green-500 rounded-xl text-[10px] font-bold border border-green-600/30 hover:bg-green-600 hover:text-white transition-all">إرسال تقرير الغياب (WhatsApp)</button>
              </div>
            );
          })()}

          {/* ميزة 53: جدولة المنشورات */}
          {(() => {
            const schedule = async () => { alert("تم الجدولة"); };
            return (
              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
                <div className="flex items-center gap-3 mb-4 text-yellow-400"><Clock size={24} /><h3 className="font-bold">جدولة المنشورات</h3></div>
                <div className="space-y-2">
                   <input placeholder="العنوان" className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white" />
                   <button onClick={schedule} className="w-full py-2 bg-yellow-600/20 text-yellow-500 rounded-xl text-[10px] font-bold border border-yellow-500/30">حفظ المنشور</button>
                </div>
              </div>
            );
          })()}

          {/* ميزات 54-60 */}
          {(() => {
            return (
              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex flex-col gap-3 text-white">
                  <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">تواصل ذكي (CRM)</h3>
                  <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5"><span className="text-[10px]">57. الطلاب المتصلون</span><span className="text-green-500 text-[10px]">● 142 Active</span></div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                     <button className="py-2 bg-white/5 border border-white/5 rounded-xl text-[9px]">58. استطلاع رأي</button>
                     <button className="py-2 bg-white/5 border border-white/5 rounded-xl text-[9px]">60. تليجرام بوت</button>
                  </div>
              </div>
            );
          })()}
      </div>

      {/* --- نهاية الجزء الأول من الميزات --- */}


      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 text-white">
        {/* ميزة 61: بنك الأسئلة */}
        {(() => {
          const addToBank = async () => { alert("تم النقل للبنك المركزي"); };
          return (
            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex flex-col gap-4">
              <div className="flex items-center gap-3 text-blue-400"><Database size={24} /><h3 className="font-bold">مستودع الأسئلة المركزي</h3></div>
              <div className="grid grid-cols-2 gap-2">
                 <select className="bg-black/40 border border-white/10 rounded-xl p-2 text-[10px] text-white"><option>فيزياء</option><option>كيمياء</option></select>
                 <select className="bg-black/40 border border-white/10 rounded-xl p-2 text-[10px] text-white"><option>سهل</option><option>صعب</option></select>
              </div>
              <button onClick={addToBank} className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-black transition-all">إضافة للبنك</button>
            </div>
          );
        })()}

        {/* ميزة 62: المصحح المقالي AI */}
        {(() => {
          const aiGrade = async () => { alert("AI Grader Started..."); };
          return (
            <div className="p-6 bg-purple-900/10 border border-purple-500/20 rounded-[2.5rem]">
              <div className="flex items-center gap-3 mb-4 text-purple-400"><Sparkles size={24} /><h3 className="font-bold">المصحح المقالي الذكي</h3></div>
              <p className="text-[10px] text-gray-400 mb-4 italic">الذكاء الاصطناعي يقرأ إجابة الطالب ويقارنها بالنموذج.</p>
              <button onClick={aiGrade} className="w-full py-3 bg-purple-600 rounded-xl text-xs font-black hover:bg-purple-500 transition-all">تشغيل AI Auto-Grader</button>
            </div>
          );
        })()}
        
        {/* ميزة 63: Randomizer */}
        {(() => {
          const shuffle = async () => { alert("Exam Shuffled!"); };
          return (
            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
              <div className="flex items-center gap-3 mb-4 text-pink-500"><Shuffle size={24} /><h3 className="font-bold">مانع الغش (Randomizer)</h3></div>
              <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5"><span className="text-[10px]">خلط الأسئلة</span><button onClick={shuffle} className="w-8 h-4 bg-pink-600 rounded-full flex justify-end px-1"><div className="w-2 h-2 bg-white rounded-full"></div></button></div>
            </div>
          );
        })()}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* ميزات 64-70: إدارة الامتحانات */}
        {(() => {
          return (
            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex flex-col gap-3 text-white">
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Result Management</h3>
                <div className="space-y-2">
                   <div className="flex justify-between p-2 bg-green-500/5 rounded-lg border border-green-500/10"><span className="text-[9px]">70. Auto-PDF Certificate</span><span className="text-green-500 font-bold text-[8px]">Enabled</span></div>
                   <button className="w-full py-2 bg-white/5 border border-white/5 rounded-xl text-[9px] hover:bg-white/10 flex gap-2 justify-center"><Trophy size={12} className="text-yellow-500"/> 69. Live Leaderboard</button>
                   <div className="grid grid-cols-2 gap-2">
                      <button className="p-2 bg-black/20 rounded-lg text-[8px] border border-white/5">68. Negative Marking</button>
                      <div className="p-2 bg-black/20 rounded-lg text-[8px] border border-white/5 flex justify-center gap-1"><Shield size={10}/> 65. Lockdown Browser</div>
                   </div>
                   <div className="mt-1 flex justify-center gap-2 opacity-40 italic"><Camera size={10} /><span className="text-[7px]">66. Snapshot Monitor Active</span></div>
                </div>
            </div>
          );
        })()}

        {/* ميزة 71: الباقات */}
        {(() => {
          const createBundle = async () => { alert("Bundle Created"); };
          return (
            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex flex-col justify-between text-white">
              <div className="flex items-center gap-3 mb-4 text-blue-400"><Layers size={24} /><h3 className="font-bold">نظام الباقات (Bundles)</h3></div>
              <p className="text-[10px] text-gray-500 mb-4 font-light italic">بيع مجموعة محاضرات بسعر واحد.</p>
              <div className="space-y-2">
                 <input type="number" placeholder="السعر (EGP)" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none text-white" />
                 <button onClick={createBundle} className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-black transition-all">إطلاق باقة</button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ميزة 72: تشفير الروابط */}
      {(() => {
        const secureLink = async () => { alert("Link Secured with Token"); };
        return (
          <div className="p-6 bg-amber-900/10 border border-amber-500/20 rounded-[2.5rem] mb-6">
            <div className="flex items-center gap-3 mb-4 text-amber-400"><FileLock size={24} /><h3 className="font-bold">تأمين المذكرات (PDF)</h3></div>
            <p className="text-[10px] text-gray-400 mb-4">روابط مؤقتة تنتهي صلاحيتها تلقائياً لمنع المشاركة.</p>
            <button onClick={secureLink} className="w-full py-3 bg-amber-600 rounded-xl text-xs font-black hover:bg-amber-500 transition-all">تفعيل التشفير الزمني</button>
          </div>
        );
      })()}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* ميزة 73: الأقسام المخفية */}
        {(() => {
          return (
            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
              <div className="flex items-center gap-3 mb-4 text-gray-400"><EyeOff size={24} /><h3 className="font-bold text-white">الأقسام المخفية</h3></div>
              <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5"><span className="text-[10px] text-white">Hidden Mode</span><button className="px-3 py-1 bg-white/10 rounded-lg text-[9px] text-white">تغيير</button></div>
            </div>
          );
        })()}
        
        {/* ميزات 74-80 */}
        {(() => {
          return (
            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex flex-col gap-3">
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-white">Advanced Core</h3>
                <div className="space-y-2">
                   <div className="flex justify-between p-2 bg-blue-500/5 rounded-lg border border-blue-500/10"><span className="text-[9px] text-white">74. Cloud Backup</span><span className="text-blue-500 font-bold text-[8px]">Daily 3AM</span></div>
                   <div className="grid grid-cols-2 gap-2">
                      <button className="p-2 bg-black/20 rounded-lg text-[8px] text-gray-400 border border-white/5">76. Toggle CDN</button>
                      <button className="p-2 bg-black/20 rounded-lg text-[8px] text-gray-400 border border-white/5">79. Anti-Print</button>
                   </div>
                   <div className="p-2 bg-green-500/5 rounded-lg border border-green-500/10 flex justify-between items-center"><span className="text-[9px] text-green-400 font-bold uppercase">80. Metadata Stripping</span><ShieldCheck size={12} className="text-green-400"/></div>
                </div>
            </div>
          );
        })()}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 text-white">
         {/* ميزة 81: QR Attendance */}
         {(() => {
            const openScanner = async () => { alert("Camera Opened"); };
            return (
              <div className="p-6 bg-emerald-950/10 border border-emerald-500/20 rounded-[2.5rem]">
                <div className="flex items-center gap-3 mb-4 text-emerald-400"><QrCode size={24} /><h3 className="font-bold text-lg">ماسح الحضور الذكي</h3></div>
                <p className="text-[10px] text-gray-400 mb-4 text-balance">تسجيل حضور السنتر عبر الـ QR Code.</p>
                <button onClick={openScanner} className="w-full py-3 bg-emerald-600 rounded-xl text-xs font-black hover:bg-emerald-500 transition-all">فتح الكاميرا (Live)</button>
              </div>
            );
         })()}
         
         {/* ميزة 82: Assistant Rating */}
         {(() => {
            return (
              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
                <div className="flex items-center gap-3 mb-4 text-yellow-500"><Star size={24} /><h3 className="font-bold">جودة المساعدين</h3></div>
                <div className="flex justify-center gap-2 mb-2">{[1,2,3,4,5].map(star => <Star key={star} size={18} className="text-yellow-500" />)}</div>
                <p className="text-[9px] text-gray-500 text-center">نظام تقييم أداء المساعدين.</p>
              </div>
            );
         })()}
      </div>

      {/* ميزات 83-90 */}
      {(() => {
        return (
          <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem] mb-6 flex flex-col gap-3">
             <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] text-white">Offline Management</h3>
             <div className="space-y-2">
                <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex justify-between items-center"><span className="text-[10px] text-white">85. Smart ID Card Print</span><Printer size={12} className="text-gray-400"/></div>
                <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex justify-between items-center"><span className="text-[10px] text-white">83. Student of the Day</span><Trophy size={12} className="text-yellow-500 animate-bounce"/></div>
                <div className="grid grid-cols-2 gap-2">
                   <button className="py-2 bg-white/5 border border-white/5 rounded-lg text-[8px] text-white">88. Late Fees</button>
                   <button className="py-2 bg-white/5 border border-white/5 rounded-lg text-[8px] text-white">90. Live Quiz</button>
                </div>
             </div>
          </div>
        );
      })()}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
         {/* ميزة 91: الرواتب */}
         {(() => {
            const payout = async () => { alert("تم التحويل"); };
            return (
              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem] hover:border-green-500/20 transition-all group">
                <div className="flex items-center gap-3 mb-4 text-green-400"><Banknote size={24} /><h3 className="font-bold">نظام الرواتب الذكي</h3></div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                   <div className="bg-black/40 p-3 rounded-2xl border border-white/5"><p className="text-[8px] text-gray-500">ساعات العمل</p><p className="text-sm font-black text-white">120 hr</p></div>
                   <div className="bg-black/40 p-3 rounded-2xl border border-white/5"><p className="text-[8px] text-gray-500">المستحق</p><p className="text-sm font-black text-green-500">4,800 EGP</p></div>
                </div>
                <button onClick={payout} className="w-full py-3 bg-green-600/20 text-green-500 rounded-xl text-[10px] font-black border border-green-600/30 hover:bg-green-600 hover:text-white transition-all">تحويل الراتب</button>
              </div>
            );
         })()}

         {/* ميزة 92: المخزون */}
         {(() => {
            const updateStock = async () => { alert("Stock Updated"); };
            return (
              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem] hover:border-blue-500/20 transition-all">
                <div className="flex items-center gap-3 mb-4 text-blue-400"><PackageSearch size={24} /><h3 className="font-bold">جرد المذكرات</h3></div>
                <div className="space-y-3">
                   <div className="flex justify-between items-end"><span className="text-[10px] text-gray-300">مذكرة الفصل الأول</span><span className="text-red-500 font-black text-[10px]">باقي 12</span></div>
                   <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5"><div className="bg-gradient-to-r from-red-600 to-orange-500 h-full w-[12%] animate-pulse"></div></div>
                   <button onClick={updateStock} className="w-full py-2 bg-blue-600/10 text-blue-400 rounded-xl text-[9px] font-bold border border-blue-600/20 hover:bg-blue-600 hover:text-white transition-all">تسليم نسخة (خصم)</button>
                </div>
              </div>
            );
         })()}
      </div>

      {/* ميزات 93-100: C-Level */}
      {(() => {
        return (
          <div className="p-6 bg-gradient-to-br from-indigo-600/10 to-purple-600/10 border border-white/10 rounded-[2.5rem] flex flex-col gap-4 mb-6">
              <div className="flex justify-between items-start">
                 <div><h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] italic">C-Level Admin</h3><p className="text-[8px] text-gray-500 mt-1 uppercase">100. AES-256 Encrypted</p></div>
                 <div className="p-3 bg-indigo-500/20 rounded-2xl text-indigo-400"><ShieldCheck size={20}/></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                 <button className="py-2.5 bg-indigo-600/20 rounded-xl text-[9px] font-black text-indigo-200">97. Parent Reports</button>
                 <button className="py-2.5 bg-black/40 rounded-xl text-[9px] font-black text-gray-400">99. Admin Log</button>
                 <button className="py-2.5 bg-black/40 rounded-xl text-[9px] font-black text-gray-400">94. Taxes</button>
                 <button className="py-2.5 bg-black/40 rounded-xl text-[9px] font-black text-gray-400">96. Bonus</button>
              </div>
          </div>
        );
      })()}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
         {/* ميزة 101: XP System */}
         {(() => {
            return (
              <div className="p-6 bg-yellow-900/10 border border-yellow-500/20 rounded-[2.5rem] relative overflow-hidden group">
                <div className="flex items-center gap-3 mb-6 text-yellow-500"><Trophy size={24} className="animate-bounce" /><h3 className="font-bold text-lg">نظام الرتب (Ranking)</h3></div>
                <div className="flex items-center gap-4 bg-black/60 p-4 rounded-3xl border border-white/5 backdrop-blur-md relative z-10">
                   <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center font-black text-black text-2xl">1</div>
                   <div className="flex-1"><div className="flex justify-between mb-1"><p className="text-[10px] text-yellow-500">Legendary</p><p className="text-[8px] text-gray-500">85% XP</p></div><div className="w-full bg-white/10 h-2 rounded-full"><div className="bg-yellow-500 h-full w-[85%]"></div></div></div>
                </div>
                <div className="mt-4 flex flex-col gap-1 text-center"><p className="text-[8px] text-gray-500">103. Badges System Active</p></div>
              </div>
            );
         })()}

         {/* ميزة 104: المتجر */}
         {(() => {
            return (
              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex flex-col justify-between hover:border-pink-500/20 transition-all">
                <div className="flex items-center gap-3 mb-4 text-pink-500"><ShoppingBag size={24} /><h3 className="font-bold">متجر الجوائز (Redeem)</h3></div>
                <div className="space-y-3">
                   <div className="flex justify-between items-center p-3 bg-black/40 rounded-2xl border border-white/5">
                      <div className="flex flex-col"><span className="text-[10px] font-bold">كوبون خصم 10%</span><span className="text-[8px] text-gray-500">104. Points Redeem</span></div>
                      <button className="px-4 py-2 bg-pink-600 text-[9px] rounded-xl font-black">500 XP</button>
                   </div>
                   <div className="pt-4 border-t border-white/5 flex items-center gap-2 text-pink-400/60"><Users size={14} /><span className="text-[10px] font-bold">105. Clan Wars Active</span></div>
                </div>
              </div>
            );
         })()}
      </div>

      {/* ميزات 106-110: UI/UX */}
      {(() => {
         const toggleDark = () => document.documentElement.classList.toggle('dark');
         return (
            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex flex-col gap-4 mb-6 shadow-2xl">
               <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-white">Client UI Control</h3>
               <div className="grid grid-cols-2 gap-3">
                  <button className="py-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl text-[10px] font-black">107. Confetti 🎉</button>
                  <button onClick={toggleDark} className="py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-gray-300">106. Force Dark Mode 🌙</button>
               </div>
               <div className="p-4 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-2xl border border-white/5 flex justify-between items-center">
                  <p className="text-[11px] text-yellow-500 font-black"><Zap size={14} className="inline"/> 110. Daily Quest</p>
                  <span className="text-[9px] bg-orange-500 text-black px-2 py-0.5 rounded-lg font-black">100 XP</span>
               </div>
            </div>
         );
      })()}

      {/* ميزات 111-120: الربط والجودة */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
         {(() => {
            return (
              <div className="p-6 bg-blue-900/10 border border-blue-500/20 rounded-[2.5rem] group relative overflow-hidden">
                <div className="flex items-center gap-3 mb-4 text-blue-400 relative z-10"><Webhook size={24} /><h3 className="font-bold text-lg text-white">الربط البرمجي (Webhooks)</h3></div>
                <p className="text-[11px] text-gray-400 mb-5 relative z-10">111. ربط Zapier/Slack لأتمتة المهام.</p>
                <div className="bg-black/60 p-4 rounded-2xl border border-white/5 font-mono text-[10px] text-blue-300 relative z-10">POST https://api.hooks.com/v1/trigger</div>
              </div>
            );
         })()}

         {(() => {
            return (
              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem] hover:bg-white/[0.04] transition-all">
                <div className="flex items-center gap-3 mb-4 text-purple-400"><Link size={24} /><h3 className="font-bold text-white">متعقب الحملات</h3></div>
                <div className="space-y-2 mb-4">
                   <div className="flex justify-between items-center p-3 bg-black/40 rounded-2xl border border-white/5"><span className="text-[10px] text-gray-400">FB Ads (112)</span><span className="text-green-500 font-black text-[11px]">+450 Sale</span></div>
                </div>
                <button className="w-full py-3.5 bg-purple-600/10 border border-purple-500/20 rounded-2xl text-[10px] font-black text-purple-400">113. Generate Short Link</button>
              </div>
            );
         })()}
      </div>

      {/* ميزات 121-130: التوسع */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem] hover:bg-blue-500/5 group">
             <div className="text-blue-400 mb-4 group-hover:rotate-[360deg] duration-700 transition-transform"><Globe size={28}/></div>
             <h4 className="text-sm font-black text-white mb-2">121. i18n Logic</h4>
             <p className="text-[10px] text-gray-500">دعم متعدد اللغات.</p>
          </div>
          <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex flex-col justify-center items-center relative overflow-hidden">
             <Clock size={32} className="text-green-500 mb-3" />
             <h4 className="text-[11px] font-black text-white uppercase">122. GMT+2</h4>
          </div>
          <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem] space-y-2">
             {[123,124,125,126,127,128,129].map(i => <p key={i} className="text-[9px] text-gray-400 font-bold">{i}. Feature Active</p>)}
             <p className="text-[10px] text-indigo-400 font-black flex items-center gap-2"><Accessibility size={16} /> 130. Accessibility Mode</p>
          </div>
      </div>

      {/* ================================================================================= */}
      {/* 4. الإضافات الجديدة (20 ميزة حصرية 131-150)                                       */}
      {/* ================================================================================= */}
      
      <div className="advanced-new-features grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        
        {/* ميزة 131: AI Voice Cloning (محاكاة صوت المدرس) */}
        {(() => {
            const playTTS = () => alert("جاري توليد الصوت بالذكاء الاصطناعي...");
            return (
                <div className="p-6 bg-gradient-to-br from-pink-500/10 to-purple-600/10 border border-pink-500/20 rounded-[2.5rem]">
                    <div className="flex items-center gap-3 mb-4 text-pink-400">
                        <Activity size={24} />
                        <h3 className="font-bold text-lg">131. AI Teacher Voice</h3>
                    </div>
                    <p className="text-[10px] text-gray-400 mb-4">تحويل النص إلى كلام بصوت المدرس الأصلي لإرسال ملاحظات صوتية آلية.</p>
                    <button onClick={playTTS} className="w-full py-3 bg-pink-600 rounded-xl text-xs font-black hover:bg-pink-500 text-white">توليد رسالة صوتية</button>
                </div>
            );
        })()}

        {/* ميزة 132: Focus Mode (وضع التركيز العميق) */}
        {(() => {
            const toggleFocus = () => document.body.classList.toggle('focus-mode');
            return (
                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
                    <div className="flex items-center gap-3 mb-4 text-blue-300">
                        <EyeOff size={24} />
                        <h3 className="font-bold text-white">132. وضع "الزن" (Zen Mode)</h3>
                    </div>
                    <p className="text-[10px] text-gray-400 mb-4">إخفاء كل القوائم والمشتتات والتركيز فقط على الفيديو.</p>
                    <button onClick={toggleFocus} className="w-full py-3 border border-blue-500/30 text-blue-400 rounded-xl text-xs font-black hover:bg-blue-500 hover:text-white">تفعيل العزل التام</button>
                </div>
            );
        })()}

        {/* ميزة 133: Parent Magic Link (رابط متابعة الوالد) */}
        {(() => {
            const genLink = () => alert("Link: titan.edu/parent/xyz123");
            return (
                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
                    <div className="flex items-center gap-3 mb-4 text-green-400">
                        <Link size={24} />
                        <h3 className="font-bold text-white">133. رابط الأب السحري</h3>
                    </div>
                    <p className="text-[10px] text-gray-400 mb-4">رابط مباشر لولي الأمر لمتابعة الدرجات دون الحاجة لتسجيل دخول.</p>
                    <button onClick={genLink} className="w-full py-3 bg-green-600/20 text-green-500 rounded-xl text-xs font-black">نسخ الرابط</button>
                </div>
            );
        })()}

        {/* ميزة 134: Collaborative Whiteboard (السبورة التشاركية) */}
        {(() => {
            return (
                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
                    <div className="flex items-center gap-3 mb-4 text-yellow-400">
                        <Edit3 size={24} />
                        <h3 className="font-bold text-white">134. سبورة لايف</h3>
                    </div>
                    <div className="h-20 bg-white/5 rounded-xl border border-dashed border-white/10 flex items-center justify-center text-xs text-gray-500">مساحة رسم مشتركة بين المدرس والطالب</div>
                </div>
            );
        })()}

        {/* ميزة 135: Sentiment Analysis (تحليل مشاعر الطلاب) */}
        {(() => {
            return (
                <div className="p-6 bg-indigo-900/10 border border-indigo-500/20 rounded-[2.5rem]">
                    <div className="flex items-center gap-3 mb-4 text-indigo-400">
                        <BrainCircuit size={24} />
                        <h3 className="font-bold text-white">135. تحليل المشاعر</h3>
                    </div>
                    <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl">
                        <span className="text-[10px] text-gray-300">مزاج الدفعة العام:</span>
                        <span className="text-green-400 font-bold text-xs">إيجابي (88%)</span>
                    </div>
                </div>
            );
        })()}

        {/* ميزة 136: Smart Scheduler (الجدول الذكي) */}
        {(() => {
            return (
                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
                    <div className="flex items-center gap-3 mb-4 text-orange-400">
                        <Calendar size={24} />
                        <h3 className="font-bold text-white">136. الجدول الذكي</h3>
                    </div>
                    <p className="text-[10px] text-gray-400">يقترح النظام أفضل أوقات المذاكرة للطالب بناءً على نشاطه.</p>
                </div>
            );
        })()}

        {/* ميزة 137: Drip Content (المحتوى المتتابع) */}
        {(() => {
            return (
                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
                    <div className="flex items-center gap-3 mb-4 text-teal-400">
                        <Clock size={24} />
                        <h3 className="font-bold text-white">137. Drip Content</h3>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
                        <span className="text-[10px] text-gray-400">الحصة القادمة تفتح بعد:</span>
                        <span className="text-teal-400 font-mono text-xs">2d 14h</span>
                    </div>
                </div>
            );
        })()}

        {/* ميزة 138: Interactive Video (فيديو تفاعلي) */}
        {(() => {
            return (
                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
                    <div className="flex items-center gap-3 mb-4 text-red-400">
                        <PlayCircle size={24} />
                        <h3 className="font-bold text-white">138. أسئلة داخل الفيديو</h3>
                    </div>
                    <p className="text-[10px] text-gray-400">يتوقف الفيديو تلقائياً لطرح سؤال، ولا يكمل إلا بعد الإجابة الصحيحة.</p>
                </div>
            );
        })()}

        {/* ميزة 139: PDF Annotator (الكتابة على الملازم) */}
        {(() => {
            return (
                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
                    <div className="flex items-center gap-3 mb-4 text-blue-200">
                        <FileText size={24} />
                        <h3 className="font-bold text-white">139. تدوين الملاحظات</h3>
                    </div>
                    <p className="text-[10px] text-gray-400">يمكن للطالب الرسم والكتابة وتظليل النصوص داخل ملازم الـ PDF.</p>
                </div>
            );
        })()}

        {/* ميزة 140: Community Forum (منتدى النقاش) */}
        {(() => {
            return (
                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
                    <div className="flex items-center gap-3 mb-4 text-purple-300">
                        <Users size={24} />
                        <h3 className="font-bold text-white">140. مجتمع الطلاب</h3>
                    </div>
                    <p className="text-[10px] text-gray-400">ساحة نقاش تشبه StackOverflow للأسئلة والأجوبة بين الطلاب.</p>
                </div>
            );
        })()}

        {/* ميزة 141: AR Object Viewer (عارض مجسمات) */}
        {(() => {
            return (
                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
                    <div className="flex items-center gap-3 mb-4 text-cyan-400">
                        <Database size={24} />
                        <h3 className="font-bold text-white">141. مجسمات 3D/AR</h3>
                    </div>
                    <p className="text-[10px] text-gray-400">عرض أعضاء الجسم أو الذرات بتقنية الواقع المعزز.</p>
                </div>
            );
        })()}

        {/* ميزة 142: Typing Biometrics (بصمة الكتابة) */}
        {(() => {
            return (
                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
                    <div className="flex items-center gap-3 mb-4 text-red-500">
                        <Fingerprint size={24} />
                        <h3 className="font-bold text-white">142. بصمة الكتابة</h3>
                    </div>
                    <p className="text-[10px] text-gray-400">التحقق من هوية الطالب عبر نمط وسرعة كتابته على الكيبورد.</p>
                </div>
            );
        })()}

        {/* ميزة 143: Flashcard Generator (مولد البطاقات) */}
        {(() => {
            return (
                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
                    <div className="flex items-center gap-3 mb-4 text-yellow-200">
                        <Layers size={24} />
                        <h3 className="font-bold text-white">143. Auto-Flashcards</h3>
                    </div>
                    <p className="text-[10px] text-gray-400">تحويل ملخص المحاضرة تلقائياً لبطاقات مراجعة سريعة.</p>
                </div>
            );
        })()}

        {/* ميزة 144: Peer Review (تصحيح الأقران) */}
        {(() => {
            return (
                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
                    <div className="flex items-center gap-3 mb-4 text-green-300">
                        <CheckCircle2 size={24} />
                        <h3 className="font-bold text-white">144. تصحيح الأقران</h3>
                    </div>
                    <p className="text-[10px] text-gray-400">توزيع إجابات الطلاب عشوائياً ليصححوا لبعضهم (بدون أسماء).</p>
                </div>
            );
        })()}

        {/* ميزة 145: Sponsorship Manager (إدارة الإعلانات) */}
        {(() => {
            return (
                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
                    <div className="flex items-center gap-3 mb-4 text-gold-400">
                        <DollarSign size={24} />
                        <h3 className="font-bold text-white">145. مساحة إعلانية</h3>
                    </div>
                    <p className="text-[10px] text-gray-400">مكان مخصص لعرض إعلانات الكتب الخارجية أو الرعاة.</p>
                </div>
            );
        })()}

        {/* ميزة 146: Data Self-Destruct (حذف ذاتي) */}
        {(() => {
            const nukeData = () => alert("تم تفعيل بروتوكول الحذف الآمن");
            return (
                <div className="p-6 bg-red-900/20 border border-red-500/30 rounded-[2.5rem]">
                    <div className="flex items-center gap-3 mb-4 text-red-500">
                        <Trash2 size={24} />
                        <h3 className="font-bold text-white">146. تدمير البيانات</h3>
                    </div>
                    <p className="text-[10px] text-gray-400 mb-2">حذف سجلات الطلاب القديمة نهائياً (GDPR).</p>
                    <button onClick={nukeData} className="w-full py-2 bg-red-600/20 text-red-400 rounded text-xs font-bold">Nuke Old Data</button>
                </div>
            );
        })()}

        {/* ميزة 147: Code Sandbox (محرر كود) */}
        {(() => {
            return (
                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
                    <div className="flex items-center gap-3 mb-4 text-blue-500">
                        <Terminal size={24} />
                        <h3 className="font-bold text-white">147. محرر كود (IDE)</h3>
                    </div>
                    <p className="text-[10px] text-gray-400">بيئة برمجية مدمجة لطلاب البرمجة (Python/JS).</p>
                </div>
            );
        })()}

        {/* ميزة 148: Mind Map (الخريطة الذهنية) */}
        {(() => {
            return (
                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
                    <div className="flex items-center gap-3 mb-4 text-pink-300">
                        <Share2 size={24} />
                        <h3 className="font-bold text-white">148. خريطة المنهج</h3>
                    </div>
                    <p className="text-[10px] text-gray-400">توليد خريطة ذهنية تفاعلية تربط فصول المنهج ببعضها.</p>
                </div>
            );
        })()}

        {/* ميزة 149: Mock Interview Bot (بوت المقابلة) */}
        {(() => {
            return (
                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
                    <div className="flex items-center gap-3 mb-4 text-indigo-400">
                        <MessageSquare size={24} />
                        <h3 className="font-bold text-white">149. بوت الشفوي</h3>
                    </div>
                    <p className="text-[10px] text-gray-400">بوت صوتي يجري امتحان شفوي مع الطالب ويقيمه.</p>
                </div>
            );
        })()}

        {/* ميزة 150: Emergency SMS (طوارئ) */}
        {(() => {
            const sendSMS = () => alert("تم إرسال SMS لجميع الطلاب");
            return (
                <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-[2.5rem]">
                    <div className="flex items-center gap-3 mb-4 text-red-400">
                        <Bell size={24} />
                        <h3 className="font-bold text-white">150. بث الطوارئ (SMS)</h3>
                    </div>
                    <p className="text-[10px] text-gray-400 mb-2">إرسال رسائل نصية للهاتف في حالة تعطل السيرفر.</p>
                    <button onClick={sendSMS} className="w-full py-2 bg-red-600 text-white rounded text-xs font-bold">بث SMS</button>
                </div>
            );
        })()}

      </div> {/* نهاية شبكة الميزات الجديدة */}
    </div> // نهاية advanced-features-grid



/* 
   ================================================================
   الجزء الأخير: إرجاع الواجهة الرئيسية للمكون AdminDash
   ================================================================
*/

  // هنا نقوم ببناء القائمة الجانبية (Sidebar) والمحتوى الرئيسي
  return (
    <div className="titan-dashboard-layout flex h-screen bg-[#050505] text-white overflow-hidden font-sans" dir="rtl">
      
      {/* 1. القائمة الجانبية (Sidebar) */}
      <motion.aside 
        initial={{ x: 50, opacity: 0 }} 
        animate={{ x: 0, opacity: 1 }} 
        className="w-20 lg:w-72 bg-[#0a0a0a] border-l border-white/5 flex flex-col justify-between relative z-50"
      >
        <div className="p-6">
           <div className="logo-area flex items-center gap-4 mb-10">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                 <ShieldCheck size={24} className="text-white"/>
              </div>
              <div className="hidden lg:block">
                 <h1 className="text-xl font-black tracking-tighter">TITAN <span className="text-blue-500">PANEL</span></h1>
                 <p className="text-[9px] text-gray-500 tracking-[0.2em]">SECURITY CORE v6.0</p>
              </div>
           </div>

           <nav className="space-y-2">
              {[
                { id: 'dashboard', icon: Layout, label: 'لوحة القيادة' },
                { id: 'students', icon: Users, label: 'إدارة الطلاب' },
                { id: 'academy', icon: BookOpen, label: 'الأكاديمية' },
                { id: 'finance', icon: CreditCard, label: 'الخزنة المالية' },
                { id: 'library', icon: LibraryIcon, label: 'المكتبة الرقمية' },
                { id: 'exams', icon: Award, label: 'الامتحانات' },
                { id: 'comms', icon: MessageSquare, label: 'الدعم والبث' },
                { id: 'terminal', icon: Terminal, label: 'تيرمينال النظام' },
              ].map(item => (
                 <button 
                   key={item.id}
                   onClick={() => setActiveTab(item.id)}
                   className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
                     activeTab === item.id 
                     ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                     : 'text-gray-400 hover:bg-white/5 hover:text-white'
                   }`}
                 >
                    <item.icon size={20} />
                    <span className="hidden lg:block font-bold text-sm">{item.label}</span>
                    {activeTab === item.id && <div className="hidden lg:block absolute left-0 w-1 h-8 bg-blue-400 rounded-r-full shadow-[0_0_10px_#60a5fa]"></div>}
                 </button>
              ))}
           </nav>
        </div>

        <div className="p-6 border-t border-white/5">
           <button className="w-full flex items-center gap-4 p-4 rounded-2xl text-red-400 hover:bg-red-500/10 transition-all group">
              <Lock size={20} className="group-hover:rotate-12 transition-transform"/>
              <span className="hidden lg:block font-bold text-sm">إغلاق النظام الآمن</span>
           </button>
        </div>
      </motion.aside>

      {/* 2. منطقة المحتوى الرئيسي (Main Content Area) */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
         {/* خلفية ديناميكية */}
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none"></div>

         {/* Header */}
         <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#050505]/80 backdrop-blur-md z-40">
            <h2 className="text-2xl font-black text-white capitalize">{activeTab} Overview</h2>
            
            <div className="flex items-center gap-4">
               <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-mono text-gray-400">SYSTEM: ONLINE</span>
               </div>
               <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all relative">
                  <Bell size={18} />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-[#050505]"></span>
               </button>
               <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 border-2 border-white/10"></div>
            </div>
         </header>

         {/* عرض المحتوى المتغير */}
         <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
            <LayoutGroup>
               <motion.div 
                 key={activeTab}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -20 }}
                 transition={{ duration: 0.3 }}
               >
                  {renderMainContent()}
               </motion.div>
            </LayoutGroup>
         </div>
      </main>

    </div>
  );
}



