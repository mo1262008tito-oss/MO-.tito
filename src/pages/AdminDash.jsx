import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import * as XLSX from 'xlsx';
import axios from 'axios';

// --- الجزء الكامل والنهائي للاستيرادات (TITAN OS CORE) ---
import {  
  // الأمان والتحقق
  Shield, ShieldCheck, ShieldAlert, ShieldQuestion, Fingerprint, 
  Lock, Unlock, Key, UserCheck, UserPlus, Zap, ZapOff,

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

  // الأيقونات الخاصة بالمكتبة والنظام (المصححة)
 Library as LibraryIcon, FilePlus, UploadCloud, Terminal, MapPin, Users,
  
  // إذا كنت تستخدم أيقونات بأسماء بديلة (Aliasing)
  CreditCard as CardIcon 
} from 'lucide-react';



// 2. مكتبات الرسم البياني
import {  
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,  
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,  
  BarChart, Bar, Legend, ComposedChart  
} from 'recharts';


// 3. استيراد خدمات Firebase
import { db, rtdb, auth, storage } from "../firebase";
import {  
  collection, query, where, getDocs, getDoc, doc, updateDoc,  
  addDoc, setDoc, increment, writeBatch, serverTimestamp,  
  orderBy, limit, deleteDoc, onSnapshot, arrayUnion, arrayRemove  
} from "firebase/firestore";
import { ref, set, onValue, update, remove, push, child, get, onDisconnect } from "firebase/database";
import { ref as sRef, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import './AdminDash.css';



export default function AdminDash() {
  // --- [1] منطقة تعريف الـ States (كلها في بداية المكون) ---
  const [courses, setCourses] = useState([]);
  const [academyCategory, setAcademyCategory] = useState('high-school');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [books, setBooks] = useState([]); 
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [students, setStudents] = useState([]); 
  const [transactions, setTransactions] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
const [stats, setStats] = useState({
    totalStudents: 0,
    activeCourses: 0,
    totalRevenue: 0, // تم التعديل هنا لتطابق الخطأ
    securityAlerts: 0
});
  const [editingItem, setEditingItem] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [isLectureLoading, setIsLectureLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [amountToAdjust, setAmountToAdjust] = useState("");
const [answers, setAnswers] = useState({}); // لحفظ إجابات الطالب
const [examId, setExamId] = useState(null); // لحفظ معرف الامتحان الحالي

const [showForensic, setShowForensic] = useState(false);
const [selectedForensicData, setSelectedForensicData] = useState(null);

  
  // States خاصة بمنشئ الاختبارات
  const [examMeta, setExamMeta] = useState({ title: '', courseId: '', duration: 30, passScore: 50 });
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState({ 
    questionText: '', 
    options: ['', '', '', ''], 
    correctAnswer: 0,
    points: 5 
  });

  // --- [2] منطقة الدوال المنطقية ---

  const addQuestionToPool = () => {
    if (!currentQ.questionText) return alert("اكتب نص السؤال أولاً!");
    setQuestions([...questions, currentQ]);
    setCurrentQ({ questionText: '', options: ['', '', '', ''], correctAnswer: 0, points: 5 });
  };

const handleDeploy = async () => {
  // جلب الملفات من الـ Input أو الـ State
  const coverFile = document.getElementById('courseCoverFile')?.files[0];
  const coverUrl = document.getElementById('courseCoverUrl')?.value;
  const teacherFile = document.getElementById('teacherImgFile')?.files[0];
  const teacherUrl = document.getElementById('teacherImgUrl')?.value;

  // تحديد المصدر (ملف مرفوع أو رابط خارجي)
  const finalCover = coverFile || coverUrl;
  const finalTeacher = teacherFile || teacherUrl;

  if (!finalCover) return alert("يرجى اختيار ملف أو وضع رابط للغلاف");

  try {
    const courseData = { 
      title: "كورس جديد", // يفضل جلب العنوان من State مربوط بـ Input
      category: academyCategory,
      salesModel: 'FULL' 
    };
    
    // استدعاء المانجر
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
      case 'ban': // مثال: ban user_id_123
        await StudentsManager.toggleStatus(target, 'BANNED');
        setTerminalLogs(prev => [...prev, `[SUCCESS] User ${target} has been banned.`]);
        break;
        
      case 'clear':
        setTerminalLogs([]);
        break;

      case 'lock': // قفل المنصة فوراً
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
  // حفظ محلي
  setAnswers({ ...answers, [questionId]: answer });
  
  // حفظ سحابي لحظي (الاسترداد)
  set(ref(rtdb, `temp_exams/${auth.currentUser.uid}/${examId}/${questionId}`), answer);
};
useEffect(() => {
  // جلب إحصائيات الطلاب حية (Real-time)
  const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
    setStats(prev => ({
      ...prev,
      totalStudents: snapshot.size // يحسب عدد المستخدمين في قاعدة البيانات
    }));
  }, (error) => {
    console.error("Firebase Permission Error:", error);
  });

  return () => unsubscribe();
}, []);
  // الرادار واللوجز
  const [radarStats, setRadarStats] = useState({ 
    online: 0, 
    totalRevenue: 0, 
    securityBreaches: 0, 
    storageUsage: 0,
    activeLessons: 0
  });
  const [securityLogs, setSecurityLogs] = useState([]);
  
  // محرك البحث والفرز
  const [globalSearch, setGlobalSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState('all');

// [1] محرك توليد الأكواد (المفقود في قسم الموارد المالية)
const generateRandomCode = (prefix, length = 8) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // بدون الحروف المتشابهة مثل O و 0
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
    const booksData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setBooks(booksData); // تأكد أن لديك [books, setBooks] في الـ State
  });
  return () => unsub();
}, []);

  const SecurityCore = {
    // تجميد حساب فوري
    async freezeAccount(uid, reason) {
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, {
        accountStatus: 'FROZEN',
        freezeReason: reason,
        lastSecurityUpdate: serverTimestamp()
      });
      // قطع الاتصال اللحظي
      await set(ref(rtdb, `active_sessions/${uid}/kill_signal`), {
        type: 'BLOCK',
        msg: reason,
        at: Date.now()
      });
      this.logIncident(uid, 'MANUAL_BLOCK', `Admin blocked user: ${reason}`);
    },

    // تسجيل الحوادث الأمنية
    async logIncident(uid, type, details) {
      await addDoc(collection(db, "security_incidents"), {
        uid,
        type,
        details,
        timestamp: serverTimestamp(),
        severity: type === 'BRUTE_FORCE' ? 'CRITICAL' : 'MEDIUM'
      });
    },

    // مسح بصمة الجهاز (Hardware ID Reset)
    async resetDeviceBinding(uid) {
      await updateDoc(doc(db, "users", uid), {
        deviceId: null,
        isHardwareLocked: false,
        resetCounter: increment(1)
      });
    }
  };

  useEffect(() => {
  const q = query(collection(db, "courses"), orderBy("createdAt", "desc"));
  
  // استخدام onSnapshot يجعل الواجهة تتحدث تلقائياً لحظة إضافة أي كورس أو محاضرة
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const coursesData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setCourses(coursesData);
  }, (error) => {
    console.error("خطأ في جلب الكورسات:", error);
  });

  return () => unsubscribe();
}, []);
  /**
   * [2] REAL-TIME RADAR INITIALIZATION
   * مراقبة السيرفر والطلاب في هذه اللحظة
   */
  useEffect(() => {
    // 1. مراقبة الجلسات الحية
    const activeRef = ref(rtdb, 'active_sessions');
    const unsubRadar = onValue(activeRef, (snapshot) => {
      const data = snapshot.val() || {};
setRadarStats(prev => ({ 
  ...prev, 
  online: data ? Object.keys(data).length : 0 
}));  

    // 2. مراقبة سجل التهديدات اللحظي
    const qSecurity = query(collection(db, "security_incidents"), orderBy("timestamp", "desc"), limit(50));
    const unsubSecurity = onSnapshot(qSecurity, (snap) => {
      setSecurityLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 3. مزامنة بيانات الطلاب (الاسم الرباعي والبيانات)
    const unsubStudents = onSnapshot(collection(db, "users"), (snap) => {
      setStudents(snap.docs.map(d => ({ 
        id: d.id, 
        fullName: d.data().fullName || d.data().name, // دعم الاسم الرباعي
        ...d.data() 
      })));
    });

    return () => { unsubRadar(); unsubSecurity(); unsubStudents(); };
  }, []);

  /**
   * [3] ACADEMY CONTENT CORE (AC-CORE)
   * إدارة الكورسات، المحاضرات، والكتب
   */

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
    setLectures([]); // تفريغ المحاضرات عند إغلاق النافذة
  }
}, [editingItem]); // هذا الـ Effect سيعمل كلما تغير الكورس المختار


  /**
   * [4] TITAN HYBRID ACADEMY ENGINE (THAE)
   * محرك الأكاديمية الهجين: يدعم الكورس الكامل، المحاضرات المنفردة، والمواد المجانية
   * الأقسام: (HIGH_SCHOOL, RELIGIOUS, EDUCATIONAL, CODING)
   */

const AcademyManager = {
  // 1. إدارة رصيد الطالب (شحن / خصم)
  async adjustStudentBalance(studentId, amount, type = 'add') {
    try {
      const studentRef = doc(db, "users", studentId);
      const studentSnap = await getDoc(studentRef);

      // نستخدم setDoc مع merge لضمان وجود المستند
      const currentBalance = studentSnap.exists() ? (studentSnap.data().balance || 0) : 0;
      const newBalance = type === 'add' ? currentBalance + amount : currentBalance - amount;

      if (newBalance < 0) throw new Error("الرصيد لا يكفي للخصم");

      await setDoc(studentRef, {
        balance: newBalance,
        lastBalanceUpdate: serverTimestamp()
      }, { merge: true });

      setTerminalLogs(prev => [...prev, `[SYSTEM] ${type === 'add' ? 'شحن' : 'خصم'}: ${amount} EGP للطالب ${studentId}`]);
      return newBalance;
    } catch (error) {
      console.error("Balance Error:", error);
      alert("خطأ في تحديث الرصيد: " + error.message);
    }
  },

  // 2. تدشين كورس جديد (هجين: ملفات أو روابط)
  async createComplexCourse(courseData, coverInput, teacherInput) {
    try {
      setLoadingProgress(10);
      let finalCoverUrl = coverInput;
      let finalTeacherUrl = teacherInput;

      // رفع الغلاف لو كان ملف
      if (coverInput instanceof File) {
        const coverRef = sRef(storage, `academy/covers/${Date.now()}_${coverInput.name}`);
        const uploadTask = await uploadBytesResumable(coverRef, coverInput);
        finalCoverUrl = await getDownloadURL(uploadTask.ref);
      }
      setLoadingProgress(50);

      // رفع صورة المدرس لو كانت ملف
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
        booksCount: 0, // عداد الكتب
        examsCount: 0,  // عداد الامتحانات
        sections: [],   // المحاضرات
        books: [],      // الكتب
        exams: [],      // الامتحانات
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
 
  }, // نهاية دالة addLectureToCourse




  // 4. إضافة كتاب (PDF / رابط خارجي) - جديد
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

  // 5. إضافة امتحان - جديد
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

      const updatedSections = courseSnap.data().sections.filter(lec => lec.id !== lectureId);
      
      await updateDoc(courseRef, {
        sections: updatedSections,
lecturesCount: (updatedSections?.length || 0),
        updatedAt: serverTimestamp()
      });

      setLectures(updatedSections);
      setTerminalLogs(prev => [...prev, `[ACADEMY] تم حذف المحاضرة ${lectureId}`]);
    } catch (error) {
      alert("فشل الحذف: " + error.message);
    }
  },

  // 7. توليد أكواد الكورسات (Master Keys)
  async generateMasterCourseCode(courseId, count, value, prefix) {
    try {
      const batch = writeBatch(db);
      for (let i = 0; i < count; i++) {
        const secretKey = `${prefix}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        const codeRef = doc(db, "billing_codes", secretKey);
        batch.set(codeRef, {
          code: secretKey,
          targetCourseId: courseId,
          value: Number(value),
          type: 'COURSE_UNLOCKER',
          isUsed: false,
          createdAt: serverTimestamp()
        });
      }
      await batch.commit();
      setTerminalLogs(prev => [...prev, `[FINANCE] تم توليد ${count} كود للكورس ${courseId}`]);
      alert(`✅ تم توليد ${count} كود بنجاح`);
    } catch (error) {
      alert("خطأ في توليد الأكواد: " + error.message);
    }
  }
};
  const StudentMiner = {
    // الحصول على سجل الدخول التفصيلي (بصمات الأجهزة والـ IPs)
    async getStudentForensics(uid) {
      const loginLogs = await getDocs(query(collection(db, `users/${uid}/login_history`), orderBy("timestamp", "desc"), limit(20)));
      return loginLogs.docs.map(d => d.data());
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
          profile: userDoc.data(),
          devices: hardwareLogs.docs.map(d => d.data()),
          progress: academicProgress.docs.map(d => d.data())
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

    
    // مسح سجل الأجهزة للسماح بدخول جهاز جديد (Hardware Reset)
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

  /**
   * [16] TITAN LIVE COMMAND (TLC)
   * محرك البث المباشر: إدارة الغرف، المحادثة الفورية، وحظر الطلاب أثناء البث
   */
  const LiveControl = {
    // بدء بث مباشر جديد
    async startLiveSession(config) {
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
      
      // إرسال تنبيه Push لكل الطلاب في هذا القسم
      await addDoc(collection(db, "global_notifications"), {
        title: "بث مباشر بدأ الآن!",
        body: `انضم للمدرس ${config.teacher} في بث: ${config.title}`,
        category: config.category,
        type: 'LIVE_START',
        timestamp: serverTimestamp()
      });
    },

    // إغلاق البث
    async terminateLive() {
      await update(ref(rtdb, 'live_sessions/current'), { 
        isActive: false, 
        endedAt: Date.now() 
      });
    }
  };


  /**
   * [18] TITAN EXAM ENGINE (TEE)
   * محرك الاختبارات: نظام التصحيح التلقائي، إدارة بنك الأسئلة، والرقابة على الغش
   */
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
      
      // 2. الآن نقوم بالعملية بأمان
      const detailedResults = examData.questions.map((q, index) => {
        const isCorrect = q?.correctAnswer === answers[index];
        if (isCorrect) score++; // لا تنسَ تحديث السكور هنا إذا كنت تحتاجه
        return { questionIndex: index, correct: isCorrect };
      });
      const finalScore = Math.round(score);
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
  const [msgData, setMsgData] = useState({ title: '', message: '', type: 'INFO', category: 'ALL' });
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
      setSupportTickets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
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
                    onClick={() => setMsgData({...msgData, type: t})}
                    className={`py-2 rounded border text-[10px] font-bold transition-all ${msgData.type === t ? 'bg-yellow-500 border-yellow-500 text-black' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <input 
                className="titan-input-v2" 
                placeholder="رأس الرسالة..." 
                value={msgData.title}
                onChange={e => setMsgData({...msgData, title: e.target.value})}
              />
              
              <textarea 
                className="titan-input-v2 h-40 resize-none" 
                placeholder="اكتب تعليماتك هنا..." 
                value={msgData.message}
                onChange={e => setMsgData({...msgData, message: e.target.value})}
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
              { (supportTickets?.length || 0) === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-20 italic text-sm">
                  <ShieldCheck size={48} className="mb-2"/>
                  لا توجد تهديدات أو تذاكر دعم معلقة
                </div>
              ) : (
                supportTickets.map(ticket => (
                  <motion.div 
                    layout
                    key={ticket.id} 
                    onClick={() => setSelectedTicket(ticket)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${selectedTicket?.id === ticket.id ? 'bg-blue-600/20 border-blue-500/50' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                  >
                    <div className="flex justify-between mb-2">
                      <span className="font-bold text-sm text-blue-300">{ticket.studentName || "طالب مجهول"}</span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {new Date(ticket.lastUserActivity?.seconds * 1000).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2 italic">"{ticket.lastMessage}"</p>
                  </motion.div>
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
    // معالجة البيانات وتحويلها لتنسيق صالح للرسم البياني (Recharts Format)
    processRevenueStats(transactions) {
      const dailyMap = {};
      transactions.forEach(tx => {
        const date = new Date(tx.timestamp?.seconds * 1000).toLocaleDateString('ar-EG');
        if (!dailyMap[date]) dailyMap[date] = { date, revenue: 0, sales: 0 };
        dailyMap[date].revenue += tx.amount || 0;
        dailyMap[date].sales += 1;
      });
      return Object.values(dailyMap).sort((a, b) => new Date(a.date) - new Date(b.date));
    },

    // تحليل توزيع الطلاب على الأقسام الأربعة
    getCategoryDistribution(students) {
      const dist = { 'high-school': 0, 'religious': 0, 'educational': 0, 'coding': 0 };
      students.forEach(s => {
        if (s.mainCategory) dist[s.mainCategory]++;
      });
      return Object.entries(dist).map(([name, value]) => ({ name, value }));
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
            {books.filter(b => b.category === libCategory).map(book => (
              <motion.div key={book.id} layout initial={{scale: 0.9}} animate={{scale: 1}} className="book-item-card glass-card overflow-hidden">
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
      </div>
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
              {terminalLogs.map((log, i) => (
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
            {filteredList.map(student => (
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
                    <div className="item"><Wifi size={12}/> {student.phone}</div>
                    <div className="item text-muted"><MapPin size={12}/> {student.governorate || 'غير محدد'}</div>
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
               transactions.slice(0, 10).map(tx => (
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
                  <ul className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                    {lectures.map((lecture, index) => (
                      <li key={lecture.id || index} className="flex items-center justify-between bg-black/40 border border-white/5 p-3 rounded-xl hover:border-white/20 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 text-xs font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-200">{lecture.title}</p>
                            <p className="text-[10px] text-blue-400 font-mono tracking-widest">{lecture.price > 0 ? `${lecture.price} EGP` : 'FREE ACCESS'}</p>
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            if (window.confirm(`حذف "${lecture.title}"؟`)) {
                              await AcademyManager.removeLectureFromCourse(editingItem.id, lecture.id);
                              // يفضل هنا أيضاً تحديث الـ state بعد الحذف
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
             {courses.filter(c => c.category === academyCategory).map(course => (
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


 /**
 * [13] GUI COMPONENT: LECTURE MANAGER PRO
 * واجهة إدارة محتوى الكورس: رفع الفيديوهات، الملازم، وتحديد الأسعار
 */
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
          course.sections.map((lec, index) => (
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
                  const toast = alert("جاري بدء الرفع المشفر... يرجى عدم إغلاق النافذة");
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

   /**
 * [MASTER COMPONENT] EXAM BUILDER ULTRA
 * محرك بناء الاختبارات الموحد: يجمع بين سهولة الإضافة وقوة التحكم الرقمي
 */
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
              {courses?.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
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
        <AnimatePresence>
          {questions.map((q, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="question-card glass-card p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] group hover:border-blue-500/40 transition-all relative shadow-lg"
            >
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
                {q.options.map((opt, oIdx) => (
                  <div 
                    key={oIdx}
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                      q.correctAnswer === oIdx 
                      ? 'bg-green-500/10 border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.1)]' 
                      : 'bg-black/20 border-white/5'
                    }`}
                  >
                    <div className="relative flex items-center justify-center">
                      <input 
                        type="radio" 
                        name={`q_${idx}_correct`}
                        checked={q.correctAnswer === oIdx}
                        onChange={() => updateQuestion(idx, 'correctAnswer', oIdx)}
                        className="w-5 h-5 accent-green-500 cursor-pointer relative z-10"
                      />
                    </div>
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

      {/* 3. التحكم النهائي: الأزرار الإجرائية */}
      <div className="builder-controls flex flex-col md:flex-row gap-4 items-center justify-between bg-black/40 p-6 rounded-[2.5rem] border border-white/5 shadow-xl">
        <button 
          onClick={addNewQuestion}
          className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 text-gray-200 font-bold rounded-2xl border border-white/10 transition-all active:scale-95"
        >
          <PlusSquare size={20} className="text-blue-500" /> إضافة سؤال جديد
        </button>

        <div className="flex gap-4 w-full md:w-auto">
          <button 
            className="flex-1 md:flex-none flex items-center justify-center gap-3 px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-xl shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50"
            disabled={!meta.title || questions.some(q => !q.question)}
            onClick={() => onSave?.(meta, questions)}
          >
            <CloudUpload size={20} /> حفظ ونشر الاختبار
          </button>
        </div>
      </div>
    </div>
  );
};

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

        {/* لوحة الدعم الفني المباشر - إدارة المحادثات */}
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
{(supportTickets?.length || 0) > 0 ? supportTickets.map(ticket => (              <div key={ticket.id} className="ticket-item group flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all border-l-4 border-l-green-500">
                <div className="ticket-info flex flex-col">
                  <strong className="text-gray-200 text-sm">{ticket.userName}</strong>
                  <p className="text-xs text-gray-500 truncate max-w-[200px]">{ticket.lastMessage}</p>
                  <small className="text-[10px] text-gray-600 mt-1 italic">
                    نشط: {new Date(ticket.lastUserActivity?.seconds * 1000).toLocaleTimeString()}
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

      {/* نظام التبويب (Tabs) المطور */}
      <div className="lib-tabs flex flex-wrap gap-3 bg-white/5 p-2 rounded-2xl border border-white/5 justify-center md:justify-start">
        {[
          { id: 'high-school', label: 'مذكرات الثانوي', icon: <GraduationCap size={16}/> },
          { id: 'religious', label: 'الكتب الدينية', icon: <Star size={16}/> },
          { id: 'educational', label: 'المصادر التربوية', icon: <Library size={16}/> },
          { id: 'coding', label: 'كتب البرمجة', icon: <Terminal size={16}/> }
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setLibCategory(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
              libCategory === tab.id 
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
          {books.filter(b => b.category === libCategory).map(book => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={book.id} 
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

/**
 * [17] GUI COMPONENT: ADVANCED ANALYTICS RADAR
 * لوحة مراقبة الأداء: تتبع الأرباح، نشاط الطلاب، والعمليات الأمنية
 */
const AnalyticsUI = ({ stats, radarStats, securityLogs, chartData, pieData, setTimeRange }) => {
  return (
    <div className="analytics-vessel space-y-8 p-1">
      
      {/* صف الكروت الإحصائية العليا - المؤشرات الحيوية */}
      <div className="stats-grid-pro grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* كرت الدخل */}
        <motion.div 
          whileHover={{ y: -5, scale: 1.02 }} 
          className="stat-card-gold glass-card p-6 rounded-[2rem] border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-transparent relative overflow-hidden group"
        >
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
        <motion.div 
          whileHover={{ y: -5, scale: 1.02 }} 
          className="stat-card-blue glass-card p-6 rounded-[2rem] border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-transparent relative overflow-hidden group"
        >
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
        <motion.div 
          whileHover={{ y: -5, scale: 1.02 }} 
          className="stat-card-purple glass-card p-6 rounded-[2rem] border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-transparent relative overflow-hidden group"
        >
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
        
        {/* الرسم البياني للأرباح - يأخذ مساحة أكبر */}
        <div className="chart-container lg:col-span-2 glass-card p-6 rounded-[2.5rem] border border-white/5 bg-black/20 shadow-2xl">
          <div className="chart-header flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold text-gray-200 flex items-center gap-3">
              <BarChart3 size={18} className="text-blue-500"/> تحليل التدفق المالي (Revenue Stream)
            </h3>
            <select 
              className="bg-white/5 border border-white/10 text-xs text-gray-400 p-2 rounded-lg outline-none focus:border-blue-500 transition-all cursor-pointer"
              onChange={(e) => setTimeRange(e.target.value)}
            >
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
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `${value} EGP`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }}
                  itemStyle={{ color: '#3b82f6', fontSize: '12px', fontWeight: 'bold' }}
                />
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
                <PieChart>
                  <Pie data={pieData} innerRadius={50} outerRadius={70} paddingAngle={8} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][index % 4]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="pie-legend grid grid-cols-2 gap-2 mt-4 w-full">
              {pieData.map((d, i) => (
                <div key={i} className="legend-item flex items-center gap-2 bg-white/5 p-2 rounded-xl">
                  <span className="w-2 h-2 rounded-full" style={{background: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][i]}}></span>
                  <small className="text-[10px] text-gray-400 truncate">{d.name}: {d.value}</small>
                </div>
              ))}
            </div>
          </div>

          {/* سجل النشاط اللحظي المطور */}
          <div className="activity-stream glass-card p-6 rounded-[2.5rem] border border-white/5 bg-black/40 flex-1 overflow-hidden">
             <h3 className="text-sm font-bold text-gray-200 mb-4 flex items-center gap-2">
               <Activity size={16} className="text-purple-500"/> رادار العمليات اللحظي
             </h3>
             <div className="stream-list space-y-3">
                {securityLogs.slice(0, 4).map((log, idx) => (
                  <div key={log.id || idx} className="stream-item flex gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.08] transition-all group">
                     <div className={`s-icon shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${log.type === 'alert' ? 'bg-red-500/20 text-red-500' : 'bg-purple-500/20 text-purple-500'}`}>
                        <ShieldAlert size={14}/>
                     </div>
                     <div className="s-text overflow-hidden">
                        <p className="text-[11px] text-gray-300 leading-tight truncate group-hover:text-clip group-hover:whitespace-normal">{log.details}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] text-gray-600 font-mono tracking-tighter uppercase">ID: {log.id?.substring(0,6) || 'SEC-00'}</span>
                          <span className="text-[9px] text-purple-500/50 italic">{new Date(log.timestamp?.seconds * 1000).toLocaleTimeString()}</span>
                        </div>
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


/**
 * [MASTER] TITAN ENTERPRISE OS - ADMIN CORE
 * الواجهة الرئيسية المركزية: دمج جميع الوحدات والتحكم في حالة النظام
 */
const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // دالة تحويل التبويبات (Content Router)
  const renderMainContent = () => {
    switch (activeTab) {
      case 'dashboard': return <AnalyticsUI stats={stats} radarStats={radarStats} securityLogs={securityLogs} chartData={chartData} pieData={pieData} />;
      case 'students':  return <StudentManagementUI students={students} />;
      case 'academy':   return <AcademyManagerUI courses={courses} lectures={lectures} />;
      case 'finance':   return <FinanceManagerUI codes={codes} stats={stats} />;
      case 'library':   return <DigitalLibraryUI books={books} />;
      case 'comms':     return <CommsCenterUI msgData={msgData} supportTickets={supportTickets} />;
      case 'terminal':  return <TerminalCore logs={terminalLogs} />;
      default:          return <AnalyticsUI />;
    }
  };

  return (
    <div className="titan-admin-container flex h-screen bg-[#050505] text-white font-['Tajawal'] overflow-hidden">
      
      {/* Sidebar - القائمة الجانبية الذكية بنمط Glassmorphism */}
      <aside className="titan-sidebar w-72 bg-white/[0.02] border-l border-white/5 flex flex-col p-6 backdrop-blur-2xl z-50 shadow-2xl">
        <div className="sidebar-logo flex items-center gap-4 mb-12">
          <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/30">
            <Shield className="text-white" size={28} />
          </div>
          <div className="logo-text">
            <span className="block text-xl font-black tracking-tighter leading-none">TITAN</span>
            <small className="text-[10px] text-blue-500 font-bold uppercase tracking-[0.2em]">Enterprise OS</small>
          </div>
        </div>

        <nav className="sidebar-nav flex-1 space-y-2">
          {[
            { id: 'dashboard', icon: <BarChart3 size={18}/>, label: 'لوحة القيادة' },
            { id: 'students', icon: <Users size={18}/>, label: 'إدارة الطلاب' },
            { id: 'academy', icon: <Video size={18}/>, label: 'الأكاديمية' },
            { id: 'finance', icon: <CreditCard size={18}/>, label: 'الخزنة والأكواد' },
            { id: 'library', icon: <BookOpen size={18}/>, label: 'المكتبة الرقمية' },
            { id: 'comms', icon: <Send size={18}/>, label: 'مركز الاتصالات' },
            { id: 'terminal', icon: <Terminal size={18}/>, label: 'النواة (Terminal)' },
          ].map(item => (
            <button 
              key={item.id} 
              className={`nav-item group relative w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 ${
                activeTab === item.id 
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' 
                : 'text-gray-500 hover:bg-white/5 hover:text-gray-200'
              }`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className="label text-sm font-bold">{item.label}</span>
              
              {activeTab === item.id && (
                <motion.div 
                  layoutId="activeNavIndicator" 
                  className="absolute left-[-24px] w-1.5 h-8 bg-blue-500 rounded-r-full shadow-[4px_0_15px_rgba(59,130,246,0.8)]" 
                />
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer pt-6 border-t border-white/5">
          <div className="user-profile flex items-center gap-3 p-3 bg-white/5 rounded-2xl mb-4">
            <div className="user-avatar-mini w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-black text-white">A</div>
            <div className="user-info">
              <span className="name block text-xs font-bold">المدير العام</span>
              <span className="role block text-[10px] text-green-500 font-medium">إذن وصول فائق ✓</span>
            </div>
          </div>
          <button 
            className="logout-btn w-full flex items-center justify-center gap-2 py-3 text-red-400 hover:bg-red-400/10 rounded-xl transition-all text-sm font-bold"
            onClick={() => auth.signOut()}
          >
            <ZapOff size={16} /> خروج آمن
          </button>
        </div>
      </aside>

      {/* Main Viewport - منطقة العرض المركزية */}
      <main className="titan-viewport flex-1 flex flex-col relative overflow-hidden bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent">
        
        {/* Header - العارضة العلوية */}
        <header className="viewport-header h-20 flex items-center justify-between px-10 border-b border-white/5 backdrop-blur-md bg-black/10 z-40">
          <div className="header-left">
            <h2 className="tab-title text-xl font-black text-white">
              {activeTab === 'dashboard' && 'نظرة عامة على النظام'}
              {activeTab === 'students' && 'قاعدة بيانات الطلاب الفدرالية'}
              {activeTab === 'academy' && 'إدارة المحتوى التعليمي'}
              {activeTab === 'finance' && 'إدارة الموارد المالية'}
              {activeTab === 'library' && 'المستودع الرقمي المركزي'}
              {activeTab === 'comms' && 'وحدة البث والاتصالات'}
              {activeTab === 'terminal' && 'نواة النظام (Root)'}
            </h2>
          </div>

          <div className="header-right flex items-center gap-6">
             <div className="live-status flex items-center gap-3 bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.1)]">
               <span className="pulse w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]"></span>
               <span className="text-xs font-bold text-green-500">{radarStats.online} طالب متصل الآن</span>
             </div>
             
             <div className="flex gap-2 border-r border-white/10 pr-6 mr-2">
               <button className="icon-btn-header p-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"><Bell size={20}/></button>
               <button 
                className="icon-btn-header p-2.5 text-red-500 hover:bg-red-500/10 rounded-xl transition-all shadow-lg hover:shadow-red-500/20" 
                onClick={() => {
                  if(window.confirm("⚠️ هل تريد تفعيل الإغلاق الطوارئ؟ سيتم طرد جميع المستخدمين فوراً!")) {
                    SystemCommander.updatePlatformStatus('EMERGENCY_LOCK');
                  }
                }}
               >
                 <Lock size={20}/>
               </button>
             </div>
          </div>
        </header>
{/* Content Area - منطقة المحتوى المتغيرة */}
        <section className="viewport-content flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar bg-[#050505]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {renderMainContent()}
            </motion.div>
          </AnimatePresence>
        </section>
      </main>

      {/* Overlays - النوافذ العائمة */}
      {/* تم إضافة شرط التحقق لضمان عدم حدوث Crash إذا لم تكن هناك بيانات فحص */}
      {showForensic && (
        <ForensicModal 
          isOpen={showForensic} 
          onClose={() => setShowForensic(false)} 
          data={selectedForensicData} 
        />
      )}

      {/* حاوية التنبيهات (Toasts) */}
      <div className="titan-toast-container fixed bottom-8 left-8 z-[999] flex flex-col gap-3">
        {/* تدار عبر مصفوفة تنبيهات في الـ Logic */}
      </div>
    </div>
  );
};

  // --- [قسم الـ Return النهائي] ---
  return (
    <div className="admin-dash-container flex min-h-screen bg-[#050505] text-white">
      {/* تأكد من وجود الـ Sidebar هنا أو استدعائه */}
      
      <main className="main-viewport flex-1 p-6">
        {renderMainContent()}
      </main>

      <div className="ledger-station w-64 border-l border-white/5 p-4 bg-white/5">
        <h4 className="text-xs font-bold mb-4 opacity-50 tracking-widest text-blue-400">RECENT TRANSACTIONS</h4>
        <div className="space-y-3">
         { (transactions?.length || 0) > 0 ? (
            transactions.slice(0, 5).map(tx => (
              <div key={tx.id} className="ledger-item p-3 bg-white/5 rounded-lg border border-white/5">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-green-400 font-bold">{tx.amount} EGP</span>
                </div>
                <small className="text-gray-500 block text-[10px] leading-tight">{tx.description}</small>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-600 text-center py-4">لا توجد عمليات حالية</p>
          )}
        </div>
      </div>

    </div>
  );
} 











