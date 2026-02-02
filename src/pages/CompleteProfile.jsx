import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Phone, MapPin, GraduationCap, Calendar, 
  CheckCircle2, ChevronLeft, ChevronRight, 
  UserCheck, Smartphone, School, Rocket, Save
} from 'lucide-react';

const CompleteProfile = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '', age: '', gender: 'ذكر',
    stage: 'ثانوي', grade: 'الصف الثالث الثانوي',
    phoneNumber: '', parentPhone: '',
    governorate: '', schoolName: '',
  });

  // --- منطق التنقل والحفظ ---
  const nextStep = () => setStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      await setDoc(doc(db, "users", user.uid), {
        ...formData,
        uid: user.uid,
        email: user.email,
        profileCompleted: true,
        isActivated: true, // تفعيل تلقائي أو اتركها false للمراجعة
        joinedAt: serverTimestamp(),
      }, { merge: true });
      navigate('/high-school');
    } catch (error) {
      alert("خطأ: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="complete-profile-wrapper">
      {/* 1. حقن الـ CSS داخل الصفحة */}
      <style>{`
        .complete-profile-wrapper {
          min-height: 100vh;
          background: #050505;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Cairo', sans-serif;
          padding: 20px;
          direction: rtl;
          position: relative;
          overflow: hidden;
        }

        /* الإضاءة الخلفية 3D */
        .complete-profile-wrapper::before {
          content: '';
          position: absolute;
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(248,113,113,0.15) 0%, transparent 70%);
          top: -100px; left: -100px;
          z-index: 0;
        }

        .main-card {
          width: 100%;
          max-width: 700px;
          background: rgba(20, 20, 20, 0.7);
          backdrop-filter: blur(30px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 40px;
          padding: 40px;
          position: relative;
          z-index: 10;
          box-shadow: 0 50px 100px rgba(0,0,0,0.8);
        }

        /* نظام الخطوات (Stepper) */
        .stepper-ui {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
          position: relative;
        }

        .step-node {
          width: 40px; height: 40px;
          background: #1a1a1a;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 5;
          transition: 0.4s;
          border: 1px solid rgba(255,255,255,0.1);
        }

        .step-node.active {
          background: #f87171;
          box-shadow: 0 0 20px rgba(248,113,113,0.5);
          border-color: #f87171;
        }

        /* تصميم المدخلات */
        .input-group {
          margin-bottom: 25px;
        }

        .input-group label {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          color: #aaa;
          margin-bottom: 12px;
          font-weight: 700;
        }

        .input-group input, .input-group select {
          width: 100%;
          height: 60px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 18px;
          padding: 0 20px;
          color: white;
          font-family: 'Cairo';
          outline: none;
          transition: 0.3s;
        }

        .input-group input:focus {
          border-color: #f87171;
          background: rgba(255,255,255,0.07);
        }

        /* أزرار التحكم */
        .footer-btns {
          display: flex;
          gap: 15px;
          margin-top: 30px;
        }

        .btn-next, .btn-submit {
          flex: 2;
          height: 60px;
          background: #f87171;
          border: none;
          border-radius: 18px;
          color: white;
          font-weight: 900;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: 0.3s;
        }

        .btn-prev {
          flex: 1;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: white;
          border-radius: 18px;
          cursor: pointer;
        }

        .btn-next:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 20px rgba(248,113,113,0.3);
        }

        @media (max-width: 768px) {
          .main-card { padding: 25px; border-radius: 30px; }
          .step-node { width: 35px; height: 35px; }
        }
      `}</style>

      {/* 2. هيكل الصفحة (JSX) */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="main-card"
      >
        {/* شريط التقدم */}
        <div className="stepper-ui">
          {[1, 2, 3].map(n => (
            <div key={n} className={`step-node ${step >= n ? 'active' : ''}`}>
              {step > n ? <CheckCircle2 size={18} /> : n}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: -20 }}>
              <h2 style={{marginBottom: '20px', fontWeight: 900}}>👤 البيانات الشخصية</h2>
              <div className="input-group">
                <label><User size={18}/> الاسم الرباعي</label>
                <input type="text" placeholder="محمد أحمد..." value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
              </div>
              <div className="input-group">
                <label><Calendar size={18}/> السن</label>
                <input type="number" placeholder="18" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 style={{marginBottom: '20px', fontWeight: 900}}>🎓 المسار التعليمي</h2>
              <div className="input-group">
                <label><MapPin size={18}/> المحافظة</label>
                <input type="text" placeholder="القاهرة" value={formData.governorate} onChange={e => setFormData({...formData, governorate: e.target.value})} />
              </div>
              <div className="input-group">
                <label><School size={18}/> اسم المدرسة</label>
                <input type="text" placeholder="مدرسة السعيدية" value={formData.schoolName} onChange={e => setFormData({...formData, schoolName: e.target.value})} />
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 style={{marginBottom: '20px', fontWeight: 900}}>📞 أرقام التواصل</h2>
              <div className="input-group">
                <label><Smartphone size={18}/> رقم الموبايل</label>
                <input type="tel" placeholder="010..." value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} />
              </div>
              <div className="input-group">
                <label><Phone size={18}/> رقم ولي الأمر</label>
                <input type="tel" placeholder="011..." value={formData.parentPhone} onChange={e => setFormData({...formData, parentPhone: e.target.value})} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="footer-btns">
          {step > 1 && <button className="btn-prev" onClick={prevStep}>السابق</button>}
          {step < 3 ? (
            <button className="btn-next" onClick={nextStep}>التالي <ChevronLeft size={18}/></button>
          ) : (
            <button className="btn-submit" onClick={handleSubmit} disabled={loading}>
              {loading ? "جاري الحفظ..." : "حفظ وإنهاء"} <Rocket size={18}/>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default CompleteProfile;
