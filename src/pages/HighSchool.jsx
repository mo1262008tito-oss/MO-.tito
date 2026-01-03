import React, { useState, useEffect } from 'react';
import { db, auth, storage } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, addDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Key, UploadCloud, CheckCircle, GraduationCap, PlayCircle, Layers, ShieldCheck } from "lucide-react";
import './HighSchool.css';

const HighSchool = () => {
  const [hasAccess, setHasAccess] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(false);
  const [activeTab, setActiveTab] = useState("1"); // 1st, 2nd, or 3rd Secondary
  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        checkUserStatus(user.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const checkUserStatus = async (uid) => {
    // 1. التحقق من التفعيل
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists() && userDoc.data().isSecondaryActive) {
      setHasAccess(true);
      fetchCourses();
    } else {
      // 2. التحقق من وجود طلب معلق
      const q = query(collection(db, "paymentRequests"), 
                where("studentId", "==", uid), 
                where("status", "==", "pending"));
      const snap = await getDocs(q);
      if (!snap.empty) setPendingRequest(true);
    }
    setLoading(false);
  };

  const fetchCourses = () => {
    const q = query(collection(db, "courses"), where("category", "==", "HighSchool"));
    onSnapshot(q, (snap) => {
      setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  };

  const handleVerifyCode = async () => {
    if (!inputCode) return alert("يرجى إدخال الكود");
    const q = query(collection(db, "activationCodes"), where("code", "==", inputCode), where("isUsed", "==", false));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const codeDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, "activationCodes", codeDoc.id), { isUsed: true, usedBy: auth.currentUser.uid });
      await updateDoc(doc(db, "users", auth.currentUser.uid), { isSecondaryActive: true });
      setHasAccess(true);
    } else { alert("الكود غير صالح"); }
  };

  const handlePaymentUpload = async () => {
    if (!file) return alert("ارفع الصورة أولاً");
    setUploading(true);
    try {
      const storageRef = ref(storage, `payments/${auth.currentUser.uid}_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await addDoc(collection(db, "paymentRequests"), {
        studentId: auth.currentUser.uid,
        studentName: auth.currentUser.displayName || "طالب",
        screenshotUrl: url,
        status: "pending",
        timestamp: serverTimestamp()
      });
      setPendingRequest(true);
    } catch (e) { alert(e.message); }
    setUploading(false);
  };

  if (loading) return <div className="cyber-loader"><span></span> جاري فحص التصاريح...</div>;

  // واجهة قفل المحتوى (في حال عدم التفعيل)
  if (!hasAccess) {
    return (
      <div className="locker-wrapper">
        <motion.div initial={{y: 50, opacity: 0}} animate={{y: 0, opacity: 1}} className="locker-glass-card">
          <div className="locker-header">
            <div className="lock-shield"><Lock size={35} /></div>
            <h2>بوابة التعليم الثانوي</h2>
            <p>هذا المحتوى يتطلب تفعيل العضوية المميزة</p>
          </div>

          {pendingRequest ? (
            <div className="pending-status-ui">
              <CheckCircle size={60} color="#00ff88" />
              <h3>طلبك قيد المراجعة</h3>
              <p>تم استلام إيصال الدفع بنجاح. سنقوم بتفعيل حسابك خلال ساعات قليلة.</p>
            </div>
          ) : (
            <div className="activation-grid">
              <div className="act-card">
                <h3><Key size={18} /> تفعيل فوري</h3>
                <input type="text" placeholder="أدخل كود التفعيل" onChange={(e)=>setInputCode(e.target.value)} />
                <button className="primary-btn" onClick={handleVerifyCode}>تنشيط الحساب</button>
              </div>
              <div className="act-card">
                <h3><UploadCloud size={18} /> فودافون كاش</h3>
                <div className="payment-info">رقم التحويل: <span>010XXXXXXXX</span></div>
                <label className="custom-file-upload">
                  <input type="file" onChange={(e)=>setFile(e.target.files[0])} />
                  {file ? "✅ تم اختيار الصورة" : "ارفع إيصال التحويل"}
                </label>
                <button className="secondary-btn" onClick={handlePaymentUpload} disabled={uploading}>
                  {uploading ? "جاري الرفع..." : "إرسال الإيصال"}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  // واجهة المحتوى (بعد التفعيل)
  return (
    <div className="hs-content-page">
      <header className="hs-hero">
        <motion.h1 layoutId="title">أكاديمية MaFa للثانوي العام</motion.h1>
        <div className="tabs-container">
          {["1", "2", "3"].map(num => (
            <button 
              key={num} 
              className={`tab-btn ${activeTab === num ? 'active' : ''}`}
              onClick={() => setActiveTab(num)}
            >
              الصف {num === "1" ? "الأول" : num === "2" ? "الثاني" : "الثالث"}
            </button>
          ))}
        </div>
      </header>

      <main className="courses-grid-system">
        <AnimatePresence mode='wait'>
          <motion.div 
            key={activeTab}
            initial={{opacity: 0, x: 20}}
            animate={{opacity: 1, x: 0}}
            exit={{opacity: 0, x: -20}}
            className="grid-layout"
          >
            {courses.filter(c => c.grade === activeTab).length > 0 ? (
              courses.filter(c => c.grade === activeTab).map(course => (
                <div key={course.id} className="course-box-3d">
                   <div className="course-thumb" style={{backgroundImage: `url(${course.thumbnail})`}}>
                     <span className="tag">دروس تفاعلية</span>
                   </div>
                   <div className="course-body">
                     <h3>{course.name}</h3>
                     <p>{course.instructor}</p>
                     <button className="entry-btn">ابدأ الآن <PlayCircle size={16}/></button>
                   </div>
                </div>
              ))
            ) : (
              <div className="no-courses">سيتم إضافة الدروس قريباً لهذا الصف الدراسي 📚</div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default HighSchool;