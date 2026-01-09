import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { 
  doc, getDoc, updateDoc, arrayUnion, 
  collection, addDoc, serverTimestamp 
} from 'firebase/timestamp'; 
import { motion } from 'framer-motion';
import { 
  Key, CreditCard, CheckCircle, AlertCircle, 
  ChevronRight, Smartphone, Image as ImageIcon, Loader2 
} from 'lucide-react';
import './ActivationPage.css';

const ActivationPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [activeTab, setActiveTab] = useState('code'); // 'code' or 'vodafone'
  const [code, setCode] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', msg: '' });

  useEffect(() => {
    const fetchCourse = async () => {
      const docRef = doc(db, "courses_metadata", courseId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setCourse(docSnap.data());
    };
    fetchCourse();
  }, [courseId]);

  // تفعيل باستخدام الكود
  const handleCodeActivation = async () => {
    if (!code) return setStatus({ type: 'error', msg: 'يرجى إدخال الكود أولاً' });
    setLoading(true);
    try {
      // هنا تضع منطق التحقق من الكود في قاعدة البيانات
      // كمثال مبسط:
      setStatus({ type: 'success', msg: 'تم تفعيل الكورس بنجاح! جاري التحويل...' });
      setTimeout(() => navigate(`/course/${courseId}`), 2000);
    } catch (e) {
      setStatus({ type: 'error', msg: 'الكود غير صحيح أو مستخدم مسبقاً' });
    }
    setLoading(false);
  };

  // تفعيل عبر فودافون كاش (إرسال طلب للأدمن)
  const handleVodafoneSubmit = async (e) => {
    e.preventDefault();
    if (!receipt) return setStatus({ type: 'error', msg: 'يرجى رفع صورة الإيصال' });
    
    setLoading(true);
    try {
      await addDoc(collection(db, "payment_requests"), {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || "طالب",
        courseId: courseId,
        courseName: course?.title,
        receiptUrl: receipt, // ملاحظة: يفضل رفعه لـ Storage أولاً
        status: 'pending',
        type: 'course_activation',
        date: new Date().toISOString()
      });
      setStatus({ type: 'success', msg: 'تم إرسال طلبك بنجاح، سيتم التفعيل خلال ساعات' });
    } catch (e) {
      setStatus({ type: 'error', msg: 'حدث خطأ أثناء إرسال الطلب' });
    }
    setLoading(false);
  };

  if (!course) return <div className="loader"><Loader2 className="spin" /></div>;

  return (
    <div className="activation-root">
      <motion.div 
        initial={{ y: 20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        className="activation-card glass"
      >
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ChevronRight /> عودة
        </button>

        <div className="course-brief">
          <img src={course.thumbnail} alt="" />
          <div>
            <h2>تفعيل كورس: {course.title}</h2>
            <p>السعر: {course.price} ج.م</p>
          </div>
        </div>

        <div className="tab-switcher">
          <button 
            className={activeTab === 'code' ? 'active' : ''} 
            onClick={() => setActiveTab('code')}
          >
            <Key size={18} /> كود تفعيل
          </button>
          <button 
            className={activeTab === 'vodafone' ? 'active' : ''} 
            onClick={() => setActiveTab('vodafone')}
          >
            <Smartphone size={18} /> فودافون كاش
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'code' ? (
            <div className="code-section">
              <input 
                type="text" 
                placeholder="أدخل الكود المكون من 8 أرقام" 
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
              />
              <button onClick={handleCodeActivation} disabled={loading}>
                {loading ? 'جاري التحقق...' : 'تفعيل الآن'}
              </button>
            </div>
          ) : (
            <form className="vodafone-section" onSubmit={handleVodafoneSubmit}>
              <div className="instruction-box">
                <p>1. قم بتحويل مبلغ <strong>{course.price} ج.م</strong></p>
                <p>2. إلى الرقم: <strong>010XXXXXXXX</strong></p>
                <p>3. ارفع صورة التحويل (سكرين شوت) أدناه</p>
              </div>
              <input 
                type="text" 
                placeholder="رابط صورة الإيصال (حالياً)" 
                onChange={(e) => setReceipt(e.target.value)}
              />
              <button type="submit" disabled={loading}>
                {loading ? 'جاري الإرسال...' : 'إرسال الإيصال للمراجعة'}
              </button>
            </form>
          )}
        </div>

        {status.msg && (
          <div className={`status-msg ${status.type}`}>
            {status.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {status.msg}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ActivationPage;
