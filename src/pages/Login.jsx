import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, Mail, Lock, User, Sparkles } from 'lucide-react';
import './Login.css';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        
        // إنشاء ملف الطالب في الفايرستور
        await setDoc(doc(db, "users", userCredential.user.uid), {
          uid: userCredential.user.uid,
          name: name,
          email: email,
          role: 'student', // القيمة الافتراضية طالب
          createdAt: new Date()
        });
        navigate('/');
      }
    } catch (error) {
      alert("عذراً، حدث خطأ: " + error.message);
    }
  };

  return (
    <div className="login-page">
      {/* العناصر العائمة في الخلفية */}
      <div className="floating-elements">
        <motion.div animate={{ y: [0, -50, 0] }} transition={{ duration: 6, repeat: Infinity }} className="blob blob-1"></motion.div>
        <motion.div animate={{ y: [0, 50, 0] }} transition={{ duration: 8, repeat: Infinity }} className="blob blob-2"></motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="login-container"
      >
        <div className="login-card">
          <div className="card-header">
            <div className="auth-logo">
              <Sparkles size={30} color="#00f2ff" />
            </div>
            <h2>{isLogin ? 'مرحباً بعودتك' : 'انضم إلينا'}</h2>
            <p>{isLogin ? 'سجل دخولك لمواصلة رحلة التعلم' : 'ابدأ رحلتك التعليمية والروحانية اليوم'}</p>
          </div>

          <form onSubmit={handleAuth} className="auth-form">
            {!isLogin && (
              <div className="input-group">
                <User className="input-icon" size={20} />
                <input 
                  type="text" 
                  placeholder="الاسم الكامل" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required 
                />
              </div>
            )}

            <div className="input-group">
              <Mail className="input-icon" size={20} />
              <input 
                type="email" 
                placeholder="البريد الإلكتروني" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>

            <div className="input-group">
              <Lock className="input-icon" size={20} />
              <input 
                type="password" 
                placeholder="كلمة المرور" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>

            <button type="submit" className="auth-submit">
              {isLogin ? <><LogIn size={20} /> دخول</> : <><UserPlus size={20} /> إنشاء حساب</>}
            </button>
          </form>

          <div className="auth-toggle">
            <span>{isLogin ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}</span>
            <button onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? 'سجل الآن' : 'سجل دخولك'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
