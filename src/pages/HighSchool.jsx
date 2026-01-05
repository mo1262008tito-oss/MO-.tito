import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion, onSnapshot } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Key, PlayCircle, ArrowRight, ShieldCheck, CheckCircle, XCircle } from "lucide-react";
import './HighSchool.css';

const HighSchool = () => {
  const [activeTab, setActiveTab] = useState("1");
  const [courses, setCourses] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // حالات للتحكم في النوافذ المنبثقة
  const [selectedCourse, setSelectedCourse] = useState(null); // الكورس المختار لعرض دروسه
  const [activeVideo, setActiveVideo] = useState(null); // الفيديو المشغل حالياً
  const [showActivation, setShowActivation] = useState(null); // العنصر المراد تفعيله (كورس أو فيديو)
  const [inputCode, setInputCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) { 
        fetchUserData(user.uid);
        fetchCourses();
      } else { setLoading(false); }
    });
    return () => unsubscribe();
  }, []);

  const fetchUserData = (uid) => {
    onSnapshot(doc(db, "users", uid), (doc) => {
      setUserData(doc.data());
      setLoading(false);
    });
  };

  const fetchCourses = () => {
    onSnapshot(collection(db, "courses_metadata"), (snap) => {
      setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  };

  // وظيفة التحقق: هل يمتلك الطالب حق الوصول لهذا الـ ID؟
  const canAccess = (itemId) => {
    if (!userData) return false;
    // الوصول يكون متاحاً إذا كان الـ ID موجود في مصفوفة enrolledContent أو الطالب لديه تفعيل شامل
    return userData.isSecondaryActive || (userData.enrolledContent && userData.enrolledContent.includes(itemId));
  };

  const handleVerifyCode = async () => {
    if (!inputCode) return alert("أدخل الكود أولاً");
    setVerifying(true);
    
    try {
      const q = query(
        collection(db, "activationCodes"), 
        where("code", "==", inputCode), 
        where("isUsed", "==", false),
        where("targetId", "==", showActivation.id) // التأكد أن الكود مخصص لهذا الكورس/الفيديو
      );
      
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const codeDoc = snap.docs[0];
        // 1. تحديث الكود كـ مستخدم
        await updateDoc(doc(db, "activationCodes", codeDoc.id), { 
          isUsed: true, 
          usedBy: auth.currentUser.uid 
        });
        
        // 2. إضافة الـ ID لقائمة محتوى الطالب
        await updateDoc(doc(db, "users", auth.currentUser.uid), { 
          enrolledContent: arrayUnion(showActivation.id) 
        });

        alert("تم التفعيل بنجاح! استمتع بالمشاهدة ✅");
        setShowActivation(null);
        setInputCode('');
      } else {
        alert("الكود غير صحيح، أو غير مخصص لهذا المحتوى، أو مستخدم مسبقاً.");
      }
    } catch (e) {
      alert("خطأ في الاتصال: " + e.message);
    }
    setVerifying(false);
  };

  if (loading) return <div className="cyber-loader">جاري تحميل الأكاديمية...</div>;

  return (
    <div className="secondary-page-root">
      {/* مشغل الفيديو */}
      <AnimatePresence>
        {activeVideo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="video-player-overlay">
            <div className="video-nav">
              <button onClick={() => setActiveVideo(null)} className="back-btn"><ArrowRight /> العودة</button>
              <h3>{activeVideo.title}</h3>
            </div>
            <iframe src={activeVideo.videoUrl.replace('/view', '/preview')} allow="autoplay" allowFullScreen></iframe>
          </motion.div>
        )}
      </AnimatePresence>

      {/* نافذة التفعيل بكود */}
      <AnimatePresence>
        {showActivation && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="activation-modal">
            <div className="modal-card glass-card">
                <XCircle className="close-icon" onClick={() => setShowActivation(null)} />
                <Lock size={40} color="#00f2ff" />
                <h3>تفعيل الوصول</h3>
                <p>أنت تحاول الوصول إلى: <strong>{showActivation.title}</strong></p>
                <div className="code-input-group">
                    <Key size={20} />
                    <input 
                      type="text" 
                      placeholder="أدخل كود التفعيل الخاص بهذا المحتوى" 
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value)}
                    />
                </div>
                <button onClick={handleVerifyCode} disabled={verifying} className="btn-confirm">
                    {verifying ? "جاري التحقق..." : "تفعيل الآن"}
                </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="page-header">
        <h1>منصة MAFA الثانوية</h1>
        <div className="grade-tabs">
          {["1", "2", "3"].map(num => (
            <button key={num} className={activeTab === num ? 'active' : ''} onClick={() => setActiveTab(num)}>
              الصف {num === "1" ? "الأول" : num === "2" ? "الثاني" : "الثالث"}
            </button>
          ))}
        </div>
      </header>

      <main className="courses-container">
        <div className="grid-grid">
          {courses.filter(c => c.grade === activeTab).map(course => (
            <motion.div whileHover={{ y: -5 }} key={course.id} className="secondary-course-card">
              <div className="card-banner" style={{backgroundImage: `url(${course.thumbnail || 'https://via.placeholder.com/300x180'})`}}>
                <div className="lock-badge">
                   {canAccess(course.id) ? <CheckCircle size={18} color="#00ff88"/> : <Lock size={18} color="#ffcc00"/>}
                </div>
              </div>
              <div className="card-info">
                <h3>{course.title}</h3>
                <p>👨‍🏫 {course.instructor} | 💰 {course.price} ج.م</p>
                
                {/* عرض الدروس داخل الكورس */}
                <div className="lessons-list-mini">
                    {course.lessons.map((lesson, idx) => (
                        <div key={lesson.id} className="lesson-item-row">
                            <span>{idx + 1}. {lesson.title}</span>
                            <button 
                                onClick={() => {
                                    // إذا كان الكورس مدفوع بالكامل، نفحص وصول الكورس
                                    // إذا كان الدفع لكل فيديو، نفحص وصول الفيديو
                                    const targetId = course.accessType === 'full' ? course.id : lesson.id;
                                    const targetTitle = course.accessType === 'full' ? course.title : lesson.title;

                                    if (canAccess(targetId)) {
                                        setActiveVideo(lesson);
                                    } else {
                                        setShowActivation({ id: targetId, title: targetTitle });
                                    }
                                }}
                                className="play-mini-btn"
                            >
                                <PlayCircle size={18} />
                            </button>
                        </div>
                    ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default HighSchool;
