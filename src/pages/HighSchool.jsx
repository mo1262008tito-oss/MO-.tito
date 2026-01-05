import React, { useState, useEffect } from 'react';
import { db, auth, storage } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, addDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Key, UploadCloud, CheckCircle, PlayCircle, ArrowRight, ShieldCheck, Wallet } from "lucide-react";
import './HighSchool.css';

const HighSchool = () => {
  const [hasAccess, setHasAccess] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(false);
  const [activeTab, setActiveTab] = useState("1");
  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null); // للفيديو المفتوح حالياً

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) { checkUserStatus(user.uid); } 
      else { setLoading(false); }
    });
    return () => unsubscribe();
  }, []);

  const checkUserStatus = async (uid) => {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists() && userDoc.data().isSecondaryActive) {
      setHasAccess(true);
      fetchCourses();
    } else {
      const q = query(collection(db, "paymentRequests"), where("studentId", "==", uid), where("status", "==", "pending"));
      const snap = await getDocs(q);
      if (!snap.empty) setPendingRequest(true);
    }
    setLoading(false);
  };

  const fetchCourses = () => {
    const q = query(collection(db, "courses"), where("type", "==", "secondary"));
    onSnapshot(q, (snap) => {
      setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  };

  const handleVerifyCode = async () => {
    if (!inputCode) return alert("أدخل الكود أولاً");
    const q = query(collection(db, "activationCodes"), where("code", "==", inputCode), where("isUsed", "==", false));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const codeDoc = snap.docs[0];
      await updateDoc(doc(db, "activationCodes", codeDoc.id), { isUsed: true, usedBy: auth.currentUser.uid });
      await updateDoc(doc(db, "users", auth.currentUser.uid), { isSecondaryActive: true });
      setHasAccess(true);
      fetchCourses();
    } else { alert("الكود غير صحيح أو مستخدم مسبقاً"); }
  };

  const handlePaymentUpload = async () => {
    if (!file) return alert("يرجى اختيار صورة الإيصال");
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
    } catch (e) { console.error(e); }
    setUploading(false);
  };

  if (loading) return <div className="cyber-loader"><span></span> جاري فحص الهوية...</div>;

  // 1. واجهة مشغل الفيديوهات (Google Drive)
  if (selectedVideo) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="video-player-overlay">
        <div className="video-nav">
          <button onClick={() => setSelectedVideo(null)} className="back-btn-video">
            <ArrowRight /> العودة للدروس
          </button>
          <h3>{selectedVideo.name}</h3>
        </div>
        <div className="iframe-wrapper">
          <iframe 
            src={selectedVideo.videoUrl.replace('/view', '/preview')} 
            allow="autoplay" 
            allowFullScreen
          ></iframe>
        </div>
      </motion.div>
    );
  }

  // 2. واجهة القفل (الدفع)
  if (!hasAccess) {
    return (
      <div className="locker-root">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="premium-lock-card glass-card">
          <div className="lock-icon-shield"><ShieldCheck size={50} /></div>
          <h2>منطقة النخبة الثانوية</h2>
          <p>اشترك الآن للوصول لأقوى الشروحات والمذكرات</p>

          {pendingRequest ? (
            <div className="waiting-ui">
              <div className="pulse-loader"></div>
              <h3>طلبك قيد المراجعة الفنية</h3>
              <p>يتم الآن فحص إيصال الدفع، انتظر تفعيل الحساب قريباً.</p>
            </div>
          ) : (
            <div className="payment-options">
              <div className="pay-method">
                <h4><Key size={18} /> كود تفعيل</h4>
                <input type="text" placeholder="أدخل كود السنتر" onChange={(e)=>setInputCode(e.target.value)} />
                <button onClick={handleVerifyCode} className="act-button">تنشيط الآن</button>
              </div>
              <div className="divider"><span>أو</span></div>
              <div className="pay-method">
                <h4><Wallet size={18} /> فودافون كاش</h4>
                <div className="vodafone-box">010XXXXXXXX</div>
                <input type="file" id="file-up" hidden onChange={(e)=>setFile(e.target.files[0])} />
                <label htmlFor="file-up" className="file-label">
                  {file ? "✅ تم اختيار الصورة" : "رفع صورة الإيصال"}
                </label>
                <button onClick={handlePaymentUpload} disabled={uploading} className="upload-button">
                  {uploading ? "جاري الرفع..." : "إرسال للمراجعة"}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  // 3. واجهة المحتوى (بعد التفعيل)
  return (
    <div className="secondary-page-root">
      <header className="page-header">
        <h1>أكاديمية MaFa Tec الثانوية</h1>
        <div className="grade-tabs">
          {["1", "2", "3"].map(num => (
            <button 
              key={num} 
              className={activeTab === num ? 'active' : ''} 
              onClick={() => setActiveTab(num)}
            >
              الصف {num === "1" ? "الأول" : num === "2" ? "الثاني" : "الثالث"}
            </button>
          ))}
        </div>
      </header>

      <main className="courses-container">
        <div className="grid-grid">
          {courses.filter(c => c.grade === activeTab).map(course => (
            <motion.div whileHover={{ y: -10 }} key={course.id} className="secondary-course-card">
              <div className="card-banner" style={{backgroundImage: `url(${course.thumbnail})`}}>
                <div className="play-overlay" onClick={() => setSelectedVideo(course)}>
                  <PlayCircle size={50} />
                </div>
              </div>
              <div className="card-info">
                <h3>{course.name}</h3>
                <p>👨‍🏫 {course.instructor}</p>
                <button onClick={() => setSelectedVideo(course)} className="watch-btn">مشاهدة الدرس</button>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default HighSchool;
