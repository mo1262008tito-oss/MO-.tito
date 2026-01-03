import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const ADMIN_EMAIL = "admin@mafatec.com";
  const TEACHER_EMAIL = "teacher@mafatec.com";

  const createOrUpdateUserDB = async (user) => {
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      let role = 'student';
      if (user.email === ADMIN_EMAIL) role = 'admin';
      if (user.email === TEACHER_EMAIL) role = 'teacher';

      await setDoc(userDocRef, {
        uid: user.uid,
        displayName: user.displayName || "Explorer",
        email: user.email,
        photoURL: user.photoURL || "",
        role: role,
        isActive: true,
        createdAt: serverTimestamp(),
        progress: { completedLessons: [], overallPercentage: 0 },
        points: 0
      });
      return role;
    }
    return userDoc.data().role;
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const role = await createOrUpdateUserDB(result.user);
      navigate(role === 'admin' ? '/admin' : role === 'teacher' ? '/teacher-dash' : '/student-dash');
    } catch (error) { alert(error.message); }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let user;
      try {
        const res = await signInWithEmailAndPassword(auth, email, password);
        user = res.user;
      } catch {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        user = res.user;
      }
      const role = await createOrUpdateUserDB(user);
      navigate(role === 'admin' ? '/admin' : role === 'teacher' ? '/teacher-dash' : '/student-dash');
    } catch (error) { alert(error.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="future-login-wrapper">
      {/* دوائر الطاقة الطائرة في الخلفية */}
      <div className="energy-orb orb-1"></div>
      <div className="energy-orb orb-2"></div>

      <div className="floating-card-3d">
        <div className="card-content">
          <div className="brand-logo">
            <div className="logo-icon-3d">🚀</div>
            <h1 className="cyber-title">MAFA TEC</h1>
            <p className="cyber-subtitle">Future Learning Interface</p>
          </div>

          <button onClick={handleGoogleSignIn} className="google-futuristic-btn">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" />
            <span>Identity Sync with Google</span>
          </button>

          <div className="cyber-divider">
            <span>OR MANUAL ACCESS</span>
          </div>

          <form onSubmit={handleAuth} className="futuristic-form">
            <div className="cyber-input-wrapper">
              <input type="email" placeholder="Terminal Email" onChange={(e)=>setEmail(e.target.value)} required />
              <div className="input-glow"></div>
            </div>
            
            <div className="cyber-input-wrapper">
              <input type="password" placeholder="Access Code" onChange={(e)=>setPassword(e.target.value)} required />
              <div className="input-glow"></div>
            </div>

            <button type="submit" className="neon-submit-btn" disabled={loading}>
              {loading ? <div className="spinner"></div> : "INITIALIZE LOGIN"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;