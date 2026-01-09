import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { db, auth, storage } from '../firebase';
import { doc, updateDoc, arrayUnion, increment, addDoc, collection } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { CreditCard, Smartphone, CheckCircle, UploadCloud, MessageCircle, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import './Activation.css';

const ActivationPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const courseName = location.state?.title || "الكورس";

  const [activeTab, setActiveTab] = useState('card'); // 'card' or 'cash'
  const [activationCode, setActivationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState(null);

  // --- 1. منطق تفعيل الكود (إذا كان الطالب معه كرت) ---
  const handleCodeActivation = async () => {
    if (activationCode.length < 5) return alert("يرجى إدخال كود صحيح");
    setLoading(true);
    try {
      // هنا تضع منطق التحقق من الكود في قاعدة البيانات (سنبرمجها لاحقاً)
      // مثال بسيط للتفعيل المباشر:
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        enrolledContent: arrayUnion(courseId)
      });
      alert("تم تفعيل الكورس بنجاح!");
      navigate(`/video-player/${courseId}`);
    } catch (e) { alert("الكود غير صحيح أو مستخدم من قبل"); }
    setLoading(false);
  };

  // --- 2. منطق فودافون كاش (رفع إيصال) ---
  const handleCashPayment = async () => {
    if (!receipt) return alert("يرجى رفع صورة التحويل");
    setLoading(true);
    try {
      const storageRef = ref(storage, `receipts/${auth.currentUser.uid}_${Date.now()}`);
      await uploadBytes(storageRef, receipt);
      const url = await getDownloadURL(storageRef);

      await addDoc(collection(db, "payment_requests"), {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName,
        courseId,
        courseName,
        receiptUrl: url,
        status: 'pending',
        date: new Date().toISOString()
      });

      const msg = `تم التحويل لكورس: ${courseName}\nاسم الطالب: ${auth.currentUser.displayName}`;
      window.open(`https://wa.me/2010XXXXXXXX?text=${encodeURIComponent(msg)}`, '_blank');
      alert("تم إرسال الطلب بنجاح! انتظر تفعيل الأدمن.");
    } catch (e) { alert("خطأ في الرفع"); }
    setLoading(false);
  };

  return (
    <div className="activation-root">
      <motion.div initial={{y: 20, opacity: 0}} animate={{y: 0, opacity: 1}} className="activation-card">
        <h2>تفعيل كورس: {courseName}</h2>
        
        <div className="tab-switcher">
          <button className={activeTab === 'card' ? 'active' : ''} onClick={() => setActiveTab('card')}>
            <CreditCard size={18} /> كود تفعيل
          </button>
          <button className={activeTab === 'cash' ? 'active' : ''} onClick={() => setActiveTab('cash')}>
            <Smartphone size={18} /> فودافون كاش
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'card' ? (
            <div className="code-section">
              <p>أدخل كود التفعيل المطبوع على الكرت:</p>
              <input 
                type="text" 
                placeholder="Ex: XXXX-XXXX-XXXX" 
                value={activationCode}
                onChange={(e) => setActivationCode(e.target.value)}
              />
              <button className="btn-main" onClick={handleCodeActivation} disabled={loading}>
                {loading ? "جاري التفعيل..." : "تفعيل الآن"}
              </button>
            </div>
          ) : (
            <div className="cash-section">
              <div className="instruction-box">
                <p>حول المبلغ إلى رقم فودافون كاش:</p>
                <h3 className="phone-number">01514184033</h3>
                <span>بإسم: أ/ محمود فرج</span>
              </div>
              
              <div className="upload-zone">
                <input type="file" id="file" hidden onChange={(e) => setReceipt(e.target.files[0])} />
                <label htmlFor="file">
                  <UploadCloud size={30} />
                  {receipt ? receipt.name : "اضغط لرفع صورة إيصال التحويل"}
                </label>
              </div>

              <button className="btn-wa" onClick={handleCashPayment} disabled={loading}>
                <MessageCircle size={18} /> تأكيد وإرسال واتساب
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ActivationPage;
