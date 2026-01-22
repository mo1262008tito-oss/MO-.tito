import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import * as XLSX from 'xlsx';
import axios from 'axios';

// 1. استيراد جميع الأيقونات المستخدمة في الـ 10 أجزاء
import { 
  ShieldCheck, Radio, BookOpen, Users, Key, BarChart3, Cpu, Search, 
  Zap, ShieldAlert, Fingerprint, MapPin, TrendingUp, Ticket, 
  MessageCircle, Download, Activity, Wifi, Server, MessageSquare, 
  History, AlertTriangle, UserPlus, FileText, Settings, Bell, 
  Lock, Unlock, RefreshCcw, Database, Globe, Layers, Eye, 
  Target, Award, CreditCard, HardDrive, Share2, Terminal, ChevronRight, 
  MoreVertical, PlusSquare, Trash2, Send, Layout, ShieldQuestion, 
  CheckCircle, XCircle, Filter, Shield, Globe2, ZapOff, Video, 
  UserCheck, CreditCard as CardIcon, DollarSign, Calendar, Clock, Edit3, Save,
  LogOut, Menu, Check, X
} from 'lucide-react';


// 2. استيراد مكتبات الرسم البياني (Recharts)
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, 
  BarChart, Bar, Legend, ComposedChart 
} from 'recharts';

// 3. استيراد خدمات Firebase (تأكد من وجود ملف firebase.js)
import { db, rtdb, auth, storage } from "./firebase";
import { 
  collection, query, where, getDocs, getDoc, doc, updateDoc, 
  addDoc, setDoc, increment, writeBatch, serverTimestamp, 
  orderBy, limit, deleteDoc, onSnapshot, arrayUnion, arrayRemove 
} from "firebase/firestore";
import { ref, set, onValue, update, remove, push, child, get, onDisconnect } from "firebase/database";
import { ref as sRef, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import './AdminDash.css';

 * [TITAN ENTERPRISE OS - v5.0.0]
 * الجزء الأول: محرك الحماية الفدرالي ونظام إدارة الهوية
 */

export default function AdminDash() {
  // --- أنظمة الحالة المتقدمة (State Management) ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [academyCategory, setAcademyCategory] = useState('high-school'); // (high-school, religious, educational, coding)
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLiveMode, setIsLiveMode] = useState(true);
  
  // بيانات الطلاب
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  // بيانات الأكاديمية
  const [courses, setCourses] = useState([]);
  const [books, setBooks] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  
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

  /**
   * [1] FEDERAL SECURITY ENGINE (FSE)
   * المسؤول عن حماية المنصة من الاختراق وتعدد الحسابات
   */
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

  /**
   * [2] REAL-TIME RADAR INITIALIZATION
   * مراقبة السيرفر والطلاب في هذه اللحظة
   */
  useEffect(() => {
    // 1. مراقبة الجلسات الحية
    const activeRef = ref(rtdb, 'active_sessions');
    const unsubRadar = onValue(activeRef, (snapshot) => {
      const data = snapshot.val() || {};
      setRadarStats(prev => ({ ...prev, online: Object.keys(data).length }));
    });

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




  /**
   * [4] TITAN HYBRID ACADEMY ENGINE (THAE)
   * محرك الأكاديمية الهجين: يدعم الكورس الكامل، المحاضرات المنفردة، والمواد المجانية
   * الأقسام: (HIGH_SCHOOL, RELIGIOUS, EDUCATIONAL, CODING)
   */
  const AcademyManager = {
    // إعداد كورس جديد بهيكل معقد
    async createComplexCourse(courseData, coverFile, teacherFile) {
      try {
        setLoadingProgress(10);
        let coverUrl = "";
        let teacherUrl = "";

        // 1. رفع غلاف الكورس
        if (coverFile) {
          const coverRef = sRef(storage, `academy/courses/covers/${Date.now()}_${coverFile.name}`);
          const uploadTask = await uploadBytesResumable(coverRef, coverFile);
          coverUrl = await getDownloadURL(uploadTask.ref);
        }
        setLoadingProgress(40);

        // 2. رفع صورة المدرس
        if (teacherFile) {
          const teacherRef = sRef(storage, `academy/teachers/${Date.now()}_${teacherFile.name}`);
          const uploadTask = await uploadBytesResumable(teacherRef, teacherFile);
          teacherUrl = await getDownloadURL(uploadTask.ref);
        }
        setLoadingProgress(70);

        // 3. بناء وثيقة الكورس في Firestore
        const finalDoc = {
          ...courseData,
          thumbnail: coverUrl,
          teacherImage: teacherUrl,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          enrolledCount: 0,
          rating: 5.0,
          lecturesCount: 0,
          isPublic: true,
          // نظام البيع: FULL = الكورس كله بكود / SINGLE = كل محاضرة بسعر
          salesModel: courseData.salesModel || 'FULL', 
          sections: [], // هيكل المحاضرات
          totalDuration: 0
        };

        const docRef = await addDoc(collection(db, "courses"), finalDoc);
        setLoadingProgress(100);
        setTerminalLogs(prev => [...prev, `[ACADEMY] New Course Deployed: ${courseData.title} ID: ${docRef.id}`]);
        return docRef.id;
      } catch (error) {
        console.error("Course Deployment Failed:", error);
        throw error;
      }
    },

    // إضافة محاضرة (درس) داخل كورس معين مع تحديد سعرها المنفرد
    async addLectureToCourse(courseId, lectureData) {
      try {
        const courseRef = doc(db, "courses", courseId);
        const newLecture = {
          id: push(ref(rtdb)).key, // ID فريد للمحاضرة
          title: lectureData.title,
          videoUrl: lectureData.videoUrl,
          description: lectureData.description,
          price: Number(lectureData.price) || 0, // سعر المحاضرة إذا كانت منفردة
          isFree: lectureData.isFree || false,
          attachments: lectureData.attachments || [],
          duration: lectureData.duration || 0,
          createdAt: new Date().toISOString()
        };

        await updateDoc(courseRef, {
          sections: arrayUnion(newLecture),
          lecturesCount: increment(1),
          totalDuration: increment(newLecture.duration),
          updatedAt: serverTimestamp()
        });

        setTerminalLogs(prev => [...prev, `[ACADEMY] Lecture '${lectureData.title}' bound to Course ${courseId}`]);
      } catch (error) {
        console.error("Lecture Addition Failed:", error);
      }
    },

    // نظام "الكود الموحد": توليد كود يفتح كورس بالكامل بكل محتوياته
    async generateMasterCourseCode(courseId, count, value, prefix) {
      const batch = writeBatch(db);
      for (let i = 0; i < count; i++) {
        const secretKey = `${prefix}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        const codeRef = doc(db, "billing_codes", secretKey);
        batch.set(codeRef, {
          code: secretKey,
          targetCourseId: courseId,
          value: Number(value),
          type: 'COURSE_UNLOCKER', // كود لفتح كورس كامل
          isUsed: false,
          createdAt: serverTimestamp()
        });
      }
      await batch.commit();
      setTerminalLogs(prev => [...prev, `[FINANCE] Generated ${count} Master Unlock Keys for Course: ${courseId}`]);
    }
  };

  /**
   * [5] TITAN DATA MINING (STUDENT PROFILES)
   * نظام استخراج البيانات المتقدم: الاسم الرباعي، أرقام الهاتف، سجل الأجهزة
   */
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
  const AcademyUI = () => (
    <div className="academy-control-panel">
      {/* شريط اختيار القسم التعليمي */}
      <div className="category-scroller glass-card shadow-sm">
        {[
          { id: 'high-school', label: 'الثانوية العامة', icon: <Award /> },
          { id: 'religious', label: 'العلوم الدينية', icon: <BookOpen /> },
          { id: 'educational', label: 'التربوي', icon: <Users /> },
          { id: 'coding', label: 'البرمجة والتقنية', icon: <Cpu /> }
        ].map(cat => (
          <button 
            key={cat.id} 
            className={`cat-btn ${academyCategory === cat.id ? 'active' : ''}`}
            onClick={() => setAcademyCategory(cat.id)}
          >
            {cat.icon} <span>{cat.label}</span>
          </button>
        ))}
      </div>

      <div className="academy-main-grid">
        {/* نموذج رفع كورس جديد - النسخة الضخمة */}
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="upload-section glass-card">
          <h3 className="section-title"><PlusSquare /> تأمين ورفع كورس جديد</h3>
          <form id="courseForm" className="titan-form">
            <div className="form-row">
              <div className="input-group">
                <label>اسم المدرس</label>
                <input name="teacherName" placeholder="مثلاً: د. أحمد محمد" required />
              </div>
              <div className="input-group">
                <label>عنوان الكورس</label>
                <input name="courseTitle" placeholder="عنوان يظهر للطلاب" required />
              </div>
            </div>

            <div className="form-row">
              <div className="input-group">
                <label>سعر الكورس الكامل</label>
                <input name="fullPrice" type="number" placeholder="0.00 EGP" />
              </div>
              <div className="input-group">
                <label>نظام البيع</label>
                <select name="salesModel">
                  <option value="FULL">كود واحد للكورس كامل</option>
                  <option value="SINGLE">دفع لكل محاضرة منفردة</option>
                  <option value="HYBRID">هجين (كود كامل أو محاضرات)</option>
                </select>
              </div>
            </div>

            <div className="input-group">
              <label>وصف الكورس الشامل</label>
              <textarea name="desc" rows="4" placeholder="اكتب تفاصيل الكورس، المميزات، وعدد الساعات..."></textarea>
            </div>

            <div className="upload-grid">
               <div className="upload-box">
                  <label><Video size={14}/> غلاف الكورس</label>
                  <input type="file" id="courseCover" accept="image/*" />
               </div>
               <div className="upload-box">
                  <label><Users size={14}/> صورة المدرس</label>
                  <input type="file" id="teacherImg" accept="image/*" />
               </div>
            </div>

            <button type="button" className="titan-btn primary w-full mt-4" onClick={async () => {
              const form = document.getElementById('courseForm');
              const cover = document.getElementById('courseCover').files[0];
              const teacher = document.getElementById('teacherImg').files[0];
              
              const data = {
                title: form.courseTitle.value,
                teacher: form.teacherName.value,
                price: form.fullPrice.value,
                salesModel: form.salesModel.value,
                description: form.desc.value,
                category: academyCategory // القسم المختار حالياً
              };
              
              await AcademyManager.createComplexCourse(data, cover, teacher);
              alert("تم نشر الكورس وتأمينه في قسم " + academyCategory);
            }}>
              <Zap size={16} /> فحص وتدشين الكورس في السيرفر
            </button>
          </form>
        </motion.div>

        {/* عرض الكورسات الحالية للقسم المختار */}
        <div className="courses-display-section">
          <div className="section-header">
            <h3>كورسات قسم {academyCategory}</h3>
            <span className="count-badge">{courses.filter(c => c.category === academyCategory).length}</span>
          </div>
          
          <div className="courses-scroll-area">
             {courses.filter(c => c.category === academyCategory).map(course => (
               <div key={course.id} className="course-admin-card glass-card">
                  <div className="card-top">
                     <img src={course.thumbnail} className="course-img" alt="" />
                     <div className="card-overlay">
                        <button className="icon-btn danger" onClick={() => AcademyManager.permanentlyRemoveItem('course', course.id, course.thumbnail)}>
                          <Trash2 size={16}/>
                        </button>
                     </div>
                  </div>
                  <div className="card-bottom">
                     <h4>{course.title}</h4>
                     <p><Users size={14}/> {course.teacher}</p>
                     <div className="price-tag">{course.price} EGP</div>
                     <button className="titan-btn outline sm w-full" onClick={() => setEditingItem(course)}>
                        إدارة المحاضرات ({course.lecturesCount || 0})
                     </button>
                  </div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );




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
        status: status, // ACTIVE, BANNED, WATCHED, SUSPENDED
        securityNote: reason,
        lastSecurityUpdate: serverTimestamp()
      });

      // إرسال أمر طرد لحظي عبر RTDB إذا تم الحظر
      if (status === 'BANNED' || status === 'SUSPENDED') {
        const sessionRef = ref(rtdb, `active_sessions/${uid}/security_action`);
        await set(sessionRef, {
          command: 'TERMINATE_SESSION',
          reason: reason,
          timestamp: Date.now()
        });
      }

      await batch.commit();
      this.pushToTerminal(`[SECURITY] Status for ${uid} updated to ${status}`);
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
  const StudentsManagerUI = () => {
    const [viewMode, setViewMode] = useState('list'); // list or profile
    const [localSearch, setLocalSearch] = useState("");

    // نظام الفلترة الذكي للبيانات الرباعية
    const filteredList = useMemo(() => {
      return students.filter(s => 
        s.fullName?.includes(localSearch) || 
        s.phone?.includes(localSearch) ||
        s.parentPhone?.includes(localSearch)
      );
    }, [localSearch, students]);

    return (
      <div className="titan-student-vessel">
        {/* شريط الأدوات العلوي للمصنفات */}
        <div className="vessel-tools glass-card">
          <div className="search-engine">
            <Search size={20} className="icon" />
            <input 
              placeholder="ابحث بالاسم الرباعي، رقم الهاتف، أو كود الطالب..." 
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
          </div>
          <div className="action-btns">
            <button className="titan-btn" onClick={() => exportToExcel(students, 'Titan_Students_Full_Data')}>
              <Download size={18}/> تقرير شامل (Excel)
            </button>
            <button className="titan-btn primary"><UserPlus size={18}/> إضافة طالب يدوياً</button>
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
                <motion.tr layout key={student.id} className={student.status === 'BANNED' ? 'banned-row' : ''}>
                  <td className="name-cell">
                    <div className="avatar">{student.fullName?.charAt(0) || 'U'}</div>
                    <div className="info">
                      <span className="fullname">{student.fullName || "غير مسجل"}</span>
                      <small className="id">UID: {student.id.substring(0, 12)}</small>
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
                      <span className="currency">EGP</span>
                    </div>
                  </td>
                  <td>
                    <div className={`hardware-badge ${student.deviceId ? 'locked' : 'unlocked'}`}>
                      {student.deviceId ? <Fingerprint size={16}/> : <ZapOff size={16}/>}
                      <small>{student.deviceId ? 'جهاز مقيد' : 'متاح'}</small>
                    </div>
                  </td>
                  <td className="ops-cell">
                    <button className="op-btn info" onClick={() => setSelectedStudent(student)}><Eye size={18}/></button>
                    <button className="op-btn warn" onClick={() => StudentController.clearHardwareLock(student.id)} title="Hardware Reset"><RefreshCcw size={18}/></button>
                    <button className="op-btn danger" onClick={() => StudentController.setSecurityStatus(student.id, 'BANNED', 'مخالفة السياسة')}><ShieldAlert size={18}/></button>
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
   * [10] SMART FILTER SYSTEM
   * نظام معالجة استعلامات الطلاب المتقدمة
   */
  const processStudentStats = useCallback(() => {
    const stats = {
      active: students.filter(s => s.status === 'ACTIVE').length,
      banned: students.filter(s => s.status === 'BANNED').length,
      newToday: students.filter(s => {
        const today = new Date().toLocaleDateString();
        const created = new Date(s.createdAt?.seconds * 1000).toLocaleDateString();
        return today === created;
      }).length
    };
    return stats;
  }, [students]);

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
               {/* كارت المحفظة والعمليات */}
               <div className="data-panel glass-card">
                  <div className="panel-head"><CreditCard size={18}/> الإحصاءات المالية</div>
                  <div className="balance-hero">
                     <small>الرصيد الحالي</small>
                     <h1>{selectedStudent.balance || 0} <small>EGP</small></h1>
                  </div>
                  <div className="quick-actions">
                     <button className="titan-btn success sm" onClick={() => FinanceManager.adjustStudentBalance(selectedStudent.id, 100, "Admin Manual Deposit")}>+100</button>
                     <button className="titan-btn danger sm" onClick={() => FinanceManager.adjustStudentBalance(selectedStudent.id, -100, "Admin Manual Deduction")}>-100</button>
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

  /**
   * [14] GUI COMPONENT: FINANCE & VAULT COMMANDER
   * واجهة إدارة الخزينة وتوليد الأكواد المليونية
   */
  const FinanceVaultUI = () => {
    const [genConfig, setGenConfig] = useState({
      count: 10, value: 100, prefix: 'TITAN', type: 'WALLET_RECHARGE', targetId: '', expiry: 365
    });

    return (
      <div className="finance-vault-vessel">
        <div className="vault-header glass-card">
          <div className="title-area">
            <h1>خزنة الأكواد الفدرالية <Database size={24} /></h1>
            <p>إدارة وتوليد مفاتيح الوصول المشفرة للنظام</p>
          </div>
          <div className="vault-stats">
            <div className="v-stat">
              <span>إجمالي المبيعات</span>
              <h3>{stats.revenue?.toLocaleString()} EGP</h3>
            </div>
            <div className="v-stat">
              <span>الأكواد النشطة</span>
              <h3>{stats.activeCodesCount || 0} مفتاح</h3>
            </div>
          </div>
        </div>

        <div className="vault-main-grid">
          {/* محطة التوليد (Generation Station) */}
          <motion.div initial={{y: 20, opacity: 0}} animate={{y: 0, opacity: 1}} className="gen-station glass-card">
            <h3><Zap size={18} /> توليد أكواد جديدة</h3>
            <div className="gen-form">
              <div className="f-row">
                <div className="f-group">
                  <label>عدد الأكواد</label>
                  <input type="number" value={genConfig.count} onChange={e => setGenConfig({...genConfig, count: e.target.value})} />
                </div>
                <div className="f-group">
                  <label>قيمة الكود (EGP)</label>
                  <input type="number" value={genConfig.value} onChange={e => setGenConfig({...genConfig, value: e.target.value})} />
                </div>
              </div>

              <div className="f-row">
                <div className="f-group">
                  <label>بادئة الكود (Prefix)</label>
                  <input type="text" value={genConfig.prefix} onChange={e => setGenConfig({...genConfig, prefix: e.target.value.toUpperCase()})} />
                </div>
                <div className="f-group">
                  <label>نوع الكود</label>
                  <select value={genConfig.type} onChange={e => setGenConfig({...genConfig, type: e.target.value})}>
                    <option value="WALLET_RECHARGE">شحن محفظة</option>
                    <option value="COURSE_UNLOCK">فتح كورس كامل</option>
                    <option value="LECTURE_UNLOCK">فتح محاضرة منفردة</option>
                  </select>
                </div>
              </div>

              {genConfig.type !== 'WALLET_RECHARGE' && (
                <div className="f-group">
                  <label>معرف المحتوى (ID)</label>
                  <input placeholder="أدخل ID الكورس أو المحاضرة" value={genConfig.targetId} onChange={e => setGenConfig({...genConfig, targetId: e.target.value})} />
                </div>
              )}

              <button className="titan-btn primary w-full" onClick={() => BillingEngine.executeBulkGeneration(genConfig)}>
                <Cpu size={18} /> تنفيذ عملية التوليد المشفرة
              </button>
            </div>
          </motion.div>

          {/* سجل العمليات المالية (Transaction Ledger) */}
          <div className="ledger-station glass-card">
            <h3><History size={18} /> سجل العمليات الأخيرة</h3>
            <div className="ledger-list">
               {/* محاكاة لسجل العمليات */}
               {[1,2,3,4,5].map(i => (
                 <div key={i} className="ledger-item">
                    <div className="l-icon"><DollarSign size={14}/></div>
                    <div className="l-info">
                       <p>شحن محفظة عبر كود: <b>TITAN-X293-K92</b></p>
                       <small>منذ 5 دقائق | UID: 29302...</small>
                    </div>
                    <div className="l-amount text-success">+100 EGP</div>
                 </div>
               ))}
            </div>
            <button className="titan-btn outline w-full mt-4">عرض كشف حساب كامل</button>
          </div>
        </div>
      </div>
    );
  };


  /**
   * [15] TITAN CONTENT STREAMING ENGINE (TCSE)
   * محرك المحاضرات: إدارة الفيديوهات، الملفات الملحقة، ونظام الوصول الذكي
   */
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
   * [17] GUI COMPONENT: LECTURE & CONTENT MANAGER
   * واجهة إدارة المحاضرات (تظهر عند اختيار كورس معين)
   */
  const LectureManagerUI = ({ course }) => {
    const [isAdding, setIsAdding] = useState(false);

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lecture-manager-vessel glass-card">
        <div className="vessel-header">
          <div className="info">
            <h2>إدارة محتوى: {course.title}</h2>
            <p>المدرس: {course.teacher} | إجمالي المحاضرات: {course.sections?.length || 0}</p>
          </div>
          <button className="titan-btn primary" onClick={() => setIsAdding(true)}>
            <PlusSquare size={18} /> إضافة محاضرة جديدة
          </button>
        </div>

        <div className="lectures-list-pro">
          {course.sections && course.sections.length > 0 ? (
            course.sections.map((lec, index) => (
              <div key={lec.id} className="lecture-item-card glass-card">
                <div className="lec-index">#{index + 1}</div>
                <div className="lec-main-info">
                  <h4>{lec.title}</h4>
                  <div className="lec-meta">
                    <span><Clock size={12}/> {lec.duration} دقيقة</span>
                    <span><DollarSign size={12}/> {lec.price > 0 ? `${lec.price} EGP` : 'مجانية'}</span>
                    {lec.pdfUrl && <span className="text-primary"><FileText size={12}/> ملزمة مرفقة</span>}
                  </div>
                </div>
                <div className="lec-actions">
                  <button className="icon-btn" title="تعديل"><Edit3 size={16}/></button>
                  <button className="icon-btn danger" onClick={() => LectureEngine.removeLecture(course.id, lec)}>
                    <Trash2 size={16}/>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">لا توجد محاضرات في هذا الكورس بعد. ابدأ بإضافة أول درس!</div>
          )}
        </div>

        {/* Modal إضافة محاضرة */}
        <AnimatePresence>
          {isAdding && (
            <div className="titan-overlay">
               <motion.div initial={{ y: 50 }} animate={{ y: 0 }} className="add-lec-modal glass-card">
                  <h3>رفع محاضرة جديدة للسيرفر</h3>
                  <form className="titan-form" onSubmit={async (e) => {
                    e.preventDefault();
                    const data = {
                      title: e.target.lecTitle.value,
                      description: e.target.lecDesc.value,
                      duration: e.target.lecDur.value,
                      price: e.target.lecPrice.value,
                      isFree: e.target.isFree.checked
                    };
                    const video = e.target.videoFile.files[0];
                    const pdf = e.target.pdfFile.files[0];
                    await LectureEngine.deployLecture(course.id, data, video, pdf);
                    setIsAdding(false);
                  }}>
                    <input name="lecTitle" placeholder="عنوان المحاضرة" required />
                    <textarea name="lecDesc" placeholder="وصف المحاضرة (اختياري)"></textarea>
                    <div className="form-row">
                       <input name="lecDur" type="number" placeholder="المدة بالدقائق" />
                       <input name="lecPrice" type="number" placeholder="السعر المنفرد" />
                    </div>
                    <div className="file-inputs">
                       <label>الفيديو (MP4): <input type="file" name="videoFile" accept="video/*" /></label>
                       <label>الملزمة (PDF): <input type="file" name="pdfFile" accept="application/pdf" /></label>
                    </div>
                    <label className="checkbox-label">
                      <input type="checkbox" name="isFree" /> هذه المحاضرة مجانية (Preview)
                    </label>
                    <div className="modal-btns">
                       <button type="button" className="titan-btn outline" onClick={() => setIsAdding(false)}>إلغاء</button>
                       <button type="submit" className="titan-btn primary">بدء الرفع السحابي</button>
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

        setLoadingProgress(100);
        setTerminalLogs(prev => [...prev, `[EXAM] New Exam Deployed: ${examData.title} (Questions: ${examData.questions.length})`]);
        return docRef.id;
      } catch (err) {
        console.error("Exam Creation Error:", err);
      }
    },

    // معالجة نتائج الطلاب (تصحح تلقائياً في السيرفر لضمان الأمان)
    async processStudentResult(studentId, examId, answers) {
      const examSnap = await getDoc(doc(db, "exams", examId));
      const examData = examSnap.data();
      
      let score = 0;
      const detailedResults = examData.questions.map((q, index) => {
        const isCorrect = q.correctAnswer === answers[index];
        if (isCorrect) score += (100 / examData.questions.length);
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
   * [19] GUI COMPONENT: EXAM BUILDER & QUESTION BANK
   * واجهة بناء الاختبارات (Dynamic Form System)
   */
  const ExamBuilderUI = ({ targetId, onComplete }) => {
    const [questions, setQuestions] = useState([
      { question: '', options: ['', '', '', ''], correctAnswer: 0, type: 'MCQ' }
    ]);
    const [meta, setMeta] = useState({ title: '', duration: 30, passingScore: 50 });

    const addQuestion = () => {
      setQuestions([...questions, { question: '', options: ['', '', '', ''], correctAnswer: 0, type: 'MCQ' }]);
    };

    const handleSaveExam = async () => {
      if (!meta.title) return alert("يرجى إدخال عنوان الاختبار");
      await ExamEngine.createExam(targetId, { ...meta, questions });
      onComplete();
    };

    return (
      <div className="exam-builder-container glass-card shadow-2xl">
        <div className="builder-header">
          <h2><Layers size={22}/> منشئ الاختبارات التفاعلية</h2>
          <div className="meta-inputs">
            <input placeholder="عنوان الاختبار" onChange={e => setMeta({...meta, title: e.target.value})} />
            <input type="number" placeholder="المدة (دقائق)" onChange={e => setMeta({...meta, duration: e.target.value})} />
            <input type="number" placeholder="درجة النجاح %" onChange={e => setMeta({...meta, passingScore: e.target.value})} />
          </div>
        </div>

        <div className="questions-area">
          {questions.map((q, idx) => (
            <div key={idx} className="question-card glass-card">
              <div className="q-header">
                <span>سؤال {idx + 1}</span>
                <button className="del-btn" onClick={() => setQuestions(questions.filter((_, i) => i !== idx))}><Trash2 size={14}/></button>
              </div>
              <input 
                className="q-text" 
                placeholder="اكتب السؤال هنا..." 
                value={q.question}
                onChange={e => {
                  const newQ = [...questions];
                  newQ[idx].question = e.target.value;
                  setQuestions(newQ);
                }}
              />
              <div className="options-grid">
                {q.options.map((opt, oIdx) => (
                  <div key={oIdx} className={`opt-input ${q.correctAnswer === oIdx ? 'correct' : ''}`}>
                    <input 
                      type="radio" 
                      name={`correct_${idx}`} 
                      checked={q.correctAnswer === oIdx}
                      onChange={() => {
                        const newQ = [...questions];
                        newQ[idx].correctAnswer = oIdx;
                        setQuestions(newQ);
                      }}
                    />
                    <input 
                      placeholder={`خيار ${oIdx + 1}`} 
                      value={opt}
                      onChange={e => {
                        const newQ = [...questions];
                        newQ[idx].options[oIdx] = e.target.value;
                        setQuestions(newQ);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="builder-footer">
          <button className="titan-btn outline" onClick={addQuestion}><PlusSquare size={18}/> إضافة سؤال</button>
          <button className="titan-btn primary" onClick={handleSaveExam}><Save size={18}/> حفظ ونشر الاختبار</button>
        </div>
      </div>
    );
  };

  /**
   * [20] EXAM PERFORMANCE ANALYTICS
   * معالج بيانات نتائج الاختبارات للوحة المعلومات
   */
  const getExamAnalytics = (results) => {
    const total = results.length;
    const passed = results.filter(r => r.passed).length;
    const averageScore = results.reduce((acc, curr) => acc + curr.score, 0) / total;
    
    return {
      passRate: ((passed / total) * 100).toFixed(1),
      avg: averageScore.toFixed(1),
      totalAttempts: total
    };
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
        senderName: 'فريق الدعم الفني - تيتان',
        timestamp: serverTimestamp()
      });
    }
  };

  /**
   * [22] GUI COMPONENT: COMMUNICATIONS COMMAND CENTER
   * واجهة مركز الاتصالات وإدارة التنبيهات والرسائل
   */
  const CommunicationsUI = () => {
    const [msgData, setMsgData] = useState({ title: '', message: '', type: 'INFO', category: 'ALL' });
    const [supportTickets, setSupportTickets] = useState([]);

    useEffect(() => {
      // مراقبة تذاكر الدعم الفني المفتوحة
      const q = query(collection(db, "support_tickets"), where("status", "==", "OPEN"), orderBy("lastUserActivity", "desc"));
      const unsub = onSnapshot(q, (snap) => {
        setSupportTickets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return () => unsub();
    }, []);

    return (
      <div className="comms-center-vessel">
        <div className="comms-grid">
          {/* لوحة إرسال الإشعارات الجماعية */}
          <motion.div initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="broadcast-panel glass-card shadow-xl">
            <h3><Bell size={20} /> إرسال تنبيه جماعي (Push)</h3>
            <div className="titan-form">
              <div className="form-group">
                <label>عنوان التنبيه</label>
                <input 
                  placeholder="مثلاً: تحديث جديد في محاضرة الفيزياء" 
                  value={msgData.title}
                  onChange={e => setMsgData({...msgData, title: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>نص الرسالة</label>
                <textarea 
                  rows="4" 
                  placeholder="اكتب تفاصيل الإشعار هنا..."
                  value={msgData.message}
                  onChange={e => setMsgData({...msgData, message: e.target.value})}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>الجمهور المستهدف</label>
                  <select value={msgData.category} onChange={e => setMsgData({...msgData, category: e.target.value})}>
                    <option value="ALL">جميع الطلاب</option>
                    <option value="high-school">طلاب الثانوي</option>
                    <option value="coding">طلاب البرمجة</option>
                    <option value="religious">طلاب القسم الديني</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>نوع التنبيه</label>
                  <select value={msgData.type} onChange={e => setMsgData({...msgData, type: e.target.value})}>
                    <option value="INFO">معلومة عامة (أزرق)</option>
                    <option value="WARNING">تحذير أمني (أصفر)</option>
                    <option value="EVENT">حدث مباشر (أخضر)</option>
                    <option value="PROMO">عرض مالي (بنفسجي)</option>
                  </select>
                </div>
              </div>
              <button 
                className="titan-btn primary w-full mt-4" 
                onClick={() => NotificationHub.sendBroadcast(msgData)}
              >
                <Send size={18} /> بث الإشعار لكل الأجهزة الآن
              </button>
            </div>
          </motion.div>

          {/* لوحة الدعم الفني المباشر */}
          <div className="support-panel glass-card shadow-xl">
            <div className="panel-header">
              <h3><MessageSquare size={20} /> تذاكر الدعم النشطة ({supportTickets.length})</h3>
              <span className="live-badge">LIVE</span>
            </div>
            <div className="tickets-list">
              {supportTickets.length > 0 ? supportTickets.map(ticket => (
                <div key={ticket.id} className="ticket-item">
                  <div className="ticket-info">
                    <strong>{ticket.userName}</strong>
                    <p>{ticket.lastMessage?.substring(0, 40)}...</p>
                    <small>{new Date(ticket.lastUserActivity?.seconds * 1000).toLocaleTimeString()}</small>
                  </div>
                  <button className="titan-btn sm outline" onClick={() => setActiveChat(ticket)}>رد</button>
                </div>
              )) : (
                <div className="empty-chat-state">
                  <MessageCircle size={40} />
                  <p>لا توجد رسائل دعم فني حالياً</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* سجل الإشعارات المرسلة سابقاً */}
        <div className="notification-history glass-card mt-6">
           <h3><History size={18} /> سجل البث السحابي الأخير</h3>
           <div className="history-table-wrapper">
              <table className="titan-table">
                 <thead>
                    <tr>
                       <th>التاريخ</th>
                       <th>العنوان</th>
                       <th>الجمهور</th>
                       <th>النوع</th>
                       <th>المرسل</th>
                    </tr>
                 </thead>
                 <tbody>
                    {/* سيتم ملؤها من مجموعة global_notifications */}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    );
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

  /**
   * [25] GUI COMPONENT: DIGITAL LIBRARY HUB
   * واجهة إدارة المكتبة الرقمية والأبحاث
   */
  const LibraryUI = () => {
    const [libCategory, setLibCategory] = useState('high-school');
    const [isUploading, setIsUploading] = useState(false);

    return (
      <div className="library-vessel">
        <div className="lib-header glass-card">
          <div className="lib-info">
            <h2>المكتبة الرقمية الفدرالية <BookOpen size={24}/></h2>
            <p>إدارة المذكرات، الكتب، والأبحاث التفاعلية</p>
          </div>
          <button className="titan-btn primary" onClick={() => setIsUploading(true)}>
            <PlusSquare size={18}/> رفع كتاب جديد
          </button>
        </div>

        {/* أقسام المكتبة */}
        <div className="lib-tabs">
          {['high-school', 'religious', 'educational', 'coding'].map(tab => (
            <button 
              key={tab} 
              className={libCategory === tab ? 'active' : ''}
              onClick={() => setLibCategory(tab)}
            >
              {tab === 'high-school' && 'مذكرات الثانوي'}
              {tab === 'religious' && 'الكتب الدينية'}
              {tab === 'educational' && 'المصادر التربوية'}
              {tab === 'coding' && 'كتب البرمجة'}
            </button>
          ))}
        </div>

        {/* شبكة الكتب */}
        <div className="books-grid">
          {books.filter(b => b.category === libCategory).map(book => (
            <motion.div layout key={book.id} className="book-card glass-card">
              <div className="book-cover">
                <img src={book.coverUrl || 'placeholder.jpg'} alt="" />
                {book.isFree && <span className="free-badge">مجاني</span>}
              </div>
              <div className="book-details">
                <h4>{book.title}</h4>
                <p>تأليف: {book.author}</p>
                <div className="book-meta">
                  <span><FileText size={14}/> {book.pagesCount} صفحة</span>
                  <span><Download size={14}/> {book.downloadsCount}</span>
                </div>
                <div className="book-actions">
                  <button className="icon-btn" title="تعديل"><Edit3 size={16}/></button>
                  <button className="icon-btn danger" onClick={() => LibraryManager.purgeBook(book.id, book.pdfUrl, book.coverUrl)}>
                    <Trash2 size={16}/>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Modal الرفع */}
        <AnimatePresence>
          {isUploading && (
            <div className="titan-overlay">
              <motion.div initial={{scale: 0.9}} animate={{scale: 1}} className="lib-modal glass-card">
                <h3>تجهيز محتوى رقمي جديد</h3>
                <form className="titan-form" onSubmit={async (e) => {
                  e.preventDefault();
                  const data = {
                    title: e.target.bTitle.value,
                    author: e.target.bAuthor.value,
                    description: e.target.bDesc.value,
                    category: libCategory,
                    price: e.target.bPrice.value,
                    pagesCount: e.target.bPages.value
                  };
                  const pdf = e.target.bFile.files[0];
                  const cover = e.target.bCover.files[0];
                  await LibraryManager.uploadBook(data, pdf, cover);
                  setIsUploading(false);
                }}>
                  <div className="form-row">
                    <input name="bTitle" placeholder="عنوان الكتاب" required />
                    <input name="bAuthor" placeholder="اسم الكاتب" />
                  </div>
                  <textarea name="bDesc" placeholder="نبذة عن الكتاب..."></textarea>
                  <div className="form-row">
                    <input name="bPrice" type="number" placeholder="السعر (0 للمجاني)" />
                    <input name="bPages" type="number" placeholder="عدد الصفحات" />
                  </div>
                  <div className="file-section">
                    <label>ملف الـ PDF: <input type="file" name="bFile" accept=".pdf" required /></label>
                    <label>صورة الغلاف: <input type="file" name="bCover" accept="image/*" required /></label>
                  </div>
                  <div className="modal-btns">
                    <button type="button" className="titan-btn outline" onClick={() => setIsUploading(false)}>إلغاء</button>
                    <button type="submit" className="titan-btn primary">نشر في المكتبة</button>
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
   * [27] GUI COMPONENT: TITAN INTELLIGENCE DASHBOARD
   * واجهة لوحة التحكم التحليلية والذكاء الاصطناعي
   */
  const AnalyticsUI = () => {
    const [timeRange, setTimeRange] = useState('7d');
    const chartData = useMemo(() => AnalyticsEngine.processRevenueStats(transactions), [transactions]);
    const pieData = useMemo(() => AnalyticsEngine.getCategoryDistribution(students), [students]);

    return (
      <div className="analytics-vessel">
        {/* صف الكروت الإحصائية العليا */}
        <div className="stats-grid-pro">
          <motion.div whileHover={{y: -5}} className="stat-card-gold glass-card">
            <div className="stat-icon"><DollarSign /></div>
            <div className="stat-info">
              <small>إجمالي الدخل الصافي</small>
              <h2>{stats.totalRevenue?.toLocaleString()} <small>EGP</small></h2>
              <span className="trend-up"><TrendingUp size={12}/> +12% هذا الشهر</span>
            </div>
          </motion.div>

          <motion.div whileHover={{y: -5}} className="stat-card-blue glass-card">
            <div className="stat-icon"><Users /></div>
            <div className="stat-info">
              <small>الطلاب النشطون (أونلاين)</small>
              <h2>{radarStats.online} <small>طالب</small></h2>
              <div className="pulse-indicator"></div>
            </div>
          </motion.div>

          <motion.div whileHover={{y: -5}} className="stat-card-purple glass-card">
            <div className="stat-icon"><ShieldAlert /></div>
            <div className="stat-info">
              <small>تهديدات أمنية تم صدها</small>
              <h2>{securityLogs.length} <small>محاولة</small></h2>
              <span className="text-safe">النظام محمي بالكامل</span>
            </div>
          </motion.div>
        </div>

        {/* شبكة الرسوم البيانية الكبرى */}
        <div className="charts-main-grid">
          {/* رسم بياني لنمو الأرباح */}
          <div className="chart-container glass-card shadow-2xl">
            <div className="chart-header">
              <h3><BarChart3 size={18}/> تحليل التدفق المالي (Revenue Stream)</h3>
              <select onChange={(e) => setTimeRange(e.target.value)}>
                <option value="7d">آخر 7 أيام</option>
                <option value="30d">آخر 30 يوم</option>
              </select>
            </div>
            <div className="chart-wrapper" style={{ width: '100%', height: 350 }}>
              <ResponsiveContainer>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* توزيع الطلاب والنشاط */}
          <div className="chart-side-grid">
            <div className="pie-chart-box glass-card shadow-lg">
              <h3>توزيع الأقسام</h3>
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][index % 4]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="pie-legend">
                {pieData.map((d, i) => (
                  <div key={i} className="legend-item">
                    <span className="dot" style={{background: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][i]}}></span>
                    <small>{d.name}: {d.value}</small>
                  </div>
                ))}
              </div>
            </div>

            {/* سجل النشاط اللحظي (Activity Stream) */}
            <div className="activity-stream glass-card shadow-lg">
               <h3><Activity size={18}/> النشاط اللحظي</h3>
               <div className="stream-list">
                  {securityLogs.slice(0, 5).map(log => (
                    <div key={log.id} className="stream-item">
                       <div className="s-icon danger"><ShieldAlert size={14}/></div>
                       <div className="s-text">
                          <p>{log.details}</p>
                          <small>{new Date(log.timestamp?.seconds * 1000).toLocaleTimeString()}</small>
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
   * [28] TITAN SYSTEM MASTER CONFIG (TSMC)
   * إعدادات النظام الكلية: التحكم في حالة المنصة (Live/Maintenance/Locked)
   */
  const SystemCommander = {
    async updatePlatformStatus(status) {
      // status: 'OPERATIONAL' | 'MAINTENANCE' | 'EMERGENCY_LOCK'
      const settingsRef = doc(db, "system_config", "main_settings");
      await setDoc(settingsRef, {
        platformStatus: status,
        updatedBy: auth.currentUser?.email,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      // إرسال إشارة قتل فورية لجميع الجلسات في حالة القفل الطوارئ
      if (status === 'EMERGENCY_LOCK') {
        await set(ref(rtdb, 'system_pulses/global_kill_switch'), {
          active: true,
          at: Date.now()
        });
      }
      setTerminalLogs(prev => [...prev, `[SYSTEM] Platform status shifted to: ${status}`]);
    }
  };

  /**
   * [29] MAIN VIEWPORT DISPATCHER (The Router)
   * المحرك المسؤول عن عرض التبويب المختار وربطه بالمحرك الخاص به
   */
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
   * [30] FINAL ASSEMBLY RETURN
   * الهيكل النهائي الذي يجمع الـ Sidebar بالـ Viewport
   */
  return (
    <div className="titan-admin-container">
      {/* Sidebar - القائمة الجانبية الذكية */}
      <aside className="titan-sidebar">
        <div className="sidebar-logo">
          <Shield className="logo-icon" size={32} />
          <div className="logo-text">
            <span>TITAN</span>
            <small>Enterprise OS</small>
          </div>
        </div>

        <nav className="sidebar-nav">
          {[
            { id: 'dashboard', icon: <BarChart3 />, label: 'لوحة القيادة' },
            { id: 'students', icon: <Users />, label: 'إدارة الطلاب' },
            { id: 'academy', icon: <Video />, label: 'الأكاديمية' },
            { id: 'finance', icon: <CreditCard />, label: 'الخزنة والأكواد' },
            { id: 'library', icon: <BookOpen />, label: 'المكتبة الرقمية' },
            { id: 'comms', icon: <Send />, label: 'مركز الاتصالات' },
            { id: 'terminal', icon: <Terminal />, label: 'النواة (Terminal)' },
          ].map(item => (
            <button 
              key={item.id} 
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="icon">{item.icon}</span>
              <span className="label">{item.label}</span>
              {activeTab === item.id && <motion.div layoutId="activeNav" className="active-indicator" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar-mini">A</div>
            <div className="user-info">
              <span className="name">المدير العام</span>
              <span className="role">إذن وصول فائق</span>
            </div>
          </div>
          <button className="logout-btn" onClick={() => auth.signOut()}>
            <ZapOff size={18} /> خروج آمن
          </button>
        </div>
      </aside>

      {/* Main Viewport - منطقة العرض المركزية */}
      <main className="titan-viewport">
        <header className="viewport-header">
          <div className="header-left">
            <h2 className="tab-title">
              {activeTab === 'dashboard' && 'نظرة عامة على النظام'}
              {activeTab === 'students' && 'قاعدة بيانات الطلاب الفدرالية'}
              {activeTab === 'academy' && 'إدارة المحتوى التعليمي'}
            </h2>
          </div>
          <div className="header-right">
             <div className="live-status">
               <span className="pulse"></span>
               {radarStats.online} طالب متصل الآن
             </div>
             <button className="icon-btn-header"><Bell size={20}/></button>
             <button className="icon-btn-header" onClick={() => SystemCommander.updatePlatformStatus('EMERGENCY_LOCK')}><Lock size={20}/></button>
          </div>
        </header>

        <section className="viewport-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderMainContent()}
            </motion.div>
          </AnimatePresence>
        </section>
      </main>

      {/* المكونات العائمة (Overlays) */}
      <ForensicModal />
      
      {/* نظام التنبيهات السحابي (Toasts) */}
      <div className="titan-toast-container">
        {/* سيتم استدعاؤها عبر محرك الإشعارات */}
      </div>
    </div>
  );
}


