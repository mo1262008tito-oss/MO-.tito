import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
// تم تصحيح الاستيراد هنا ليعمل على Vercel بدون أخطاء
import { 
  doc, 
  getDoc, 
  collection, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore'; 
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Key, CheckCircle, AlertCircle, 
  ChevronRight, Smartphone, Loader2, Copy, Check
} from 'lucide-react';
import './ActivationPage.css';

const ActivationPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [activeTab, setActiveTab] = useState('code'); 
  const [code, setCode] = useState('');
  const [receipt, setReceipt] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState({ type: '', msg: '' });

  const walletNumber = "01012345678"; // استبدله برقمك الحقيقي

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const docRef = doc(db, "courses_metadata", courseId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCourse({ id: docSnap.id, ...docSnap.data() });
        } else {
          setStatus({ type: 'error', msg: 'الكورس غير موجود' });
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };
    fetchCourse();
  }, [courseId]);

  const copyNumber = () => {
    navigator.clipboard.writeText(walletNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCodeActivation = async () => {
    if (!code) return setStatus({ type: 'error', msg: 'يرجى إدخال كود التفعيل' });
    setLoading(true);
    try {
      // هنا يتم استدعاء دالة التحقق من الأكواد (يمكنك ربطها بـ Firestore لاحقاً)
      setStatus({ type: 'success', msg: 'جاري التحقق من الكود وتفعيل المحتوى...' });
      setTimeout(() => navigate(`/course/${courseId}`), 2000);
    } catch (e) {
      setStatus({ type: 'error', msg: 'هذا الكود غير صالح أو تم استخدامه من قبل' });
    } finally {
      setLoading(false);
    }
  };

  const handleVodafoneSubmit = async (e) => {
    e.preventDefault();
    if (!receipt) return setStatus({ type: 'error', msg: 'يرجى إرفاق رابط الإيصال أو رقم التحويل' });
    if (!auth.currentUser) return setStatus({ type: 'error', msg: 'يجب تسجيل الدخول أولاً' });

    setLoading(true);
    try {
      await addDoc(collection(db, "payment_requests"), {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || "طالب مجهول",
        userEmail: auth.currentUser.email,
        courseId: courseId,
        courseName: course?.title,
        receiptUrl: receipt,
        amount: course?.price,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setStatus({ type: 'success', msg: 'تم إرسال طلبك! سيتم تفعيل الكورس فور مراجعة الإيصال' });
      setReceipt('');
    } catch (e) {
      setStatus({ type: 'error', msg: 'فشل إرسال الطلب، حاول مرة أخرى' });
    } finally {
      setLoading(false);
    }
  };

  if (!course && !status.msg) return (
    <div className="loader-container">
      <Loader2 className="spin-icon" size={40} />
      <p>جاري تحميل بيانات الكورس...</p>
    </div>
  );

  return (
    <div className="activation-root">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="activation-card glass"
      >
        <header className="activation-header">
          <button className="back-circle" onClick={() => navigate(-1)}>
            <ChevronRight />
          </button>
          <div className="course-info-mini">
            <h2>تفعيل الكورس</h2>
            <p>{course?.title}</p>
          </div>
        </header>

        <div className="price-badge">
          <span>المطلوب دفعه:</span>
          <strong>{course?.price} ج.م</strong>
        </div>

        <div className="tab-nav">
          <button 
            className={activeTab === 'code' ? 'active' : ''} 
            onClick={() => {setActiveTab('code'); setStatus({type:'', msg:''})}}
          >
            <Key size={18} /> كود تفعيل
          </button>
          <button 
            className={activeTab === 'vodafone' ? 'active' : ''} 
            onClick={() => {setActiveTab('vodafone'); setStatus({type:'', msg:''})}}
          >
            <Smartphone size={18} /> فودافون كاش
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'code' ? (
            <motion.div 
              key="code"
              initial={{ x: 10, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              exit={{ x: -10, opacity: 0 }}
              className="tab-panel"
            >
              <p className="hint-text">إذا قمت بشراء كرت تفعيل من السنتر، أدخل الكود هنا:</p>
              <input 
                type="text" 
                placeholder="XXXX-XXXX-XXXX" 
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="modern-input"
              />
              <button 
                className="action-btn" 
                onClick={handleCodeActivation} 
                disabled={loading}
              >
                {loading ? <Loader2 className="spin" /> : 'تفعيل الكورس الآن'}
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="vodafone"
              initial={{ x: 10, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              exit={{ x: -10, opacity: 0 }}
              className="tab-panel"
            >
              <div className="payment-steps">
                <div className="step">
                  <span className="step-num">1</span>
                  <p>حول مبلغ <strong>{course?.price} ج.م</strong> للرقم:</p>
                </div>
                
                <div className="number-box" onClick={copyNumber}>
                  <code>{walletNumber}</code>
                  {copied ? <Check size={16} color="#00ff88" /> : <Copy size={16} />}
                </div>

                <div className="step">
                  <span className="step-num">2</span>
                  <p>ارفع صورة التحويل أو اكتب رقم المحفظة المحول منها:</p>
                </div>
              </div>

              <form onSubmit={handleVodafoneSubmit}>
                <input 
                  type="text" 
                  placeholder="رابط الصورة أو رقم هاتفك" 
                  value={receipt}
                  onChange={(e) => setReceipt(e.target.value)}
                  className="modern-input"
                />
                <button 
                  type="submit" 
                  className="action-btn vcash" 
                  disabled={loading}
                >
                  {loading ? <Loader2 className="spin" /> : 'إرسال لـلمراجعة'}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {status.msg && (
          <motion.div 
            initial={{ y: 10, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }}
            className={`status-banner ${status.type}`}
          >
            {status.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {status.msg}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default ActivationPage;
