import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';

// 1. استيراد صندوق الأمان
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ background: '#000', color: '#ff4d4d', height: '100vh', padding: '40px', direction: 'rtl' }}>
          <h1>🚨 عطل فني في تيتان</h1>
          <p>الخطأ: {this.state.error?.message}</p>
          <button onClick={() => window.location.reload()} style={{ padding: '10px', cursor: 'pointer' }}>إعادة المحاولة</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// استيراد المكونات
import Navbar from './components/Navbar';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import StudentDash from './pages/StudentDash.jsx';
import AdminDash from './pages/AdminDash.jsx';
import Wallet from './pages/Wallet.jsx';
import AllCourses from './pages/AllCourses.jsx';
import HighSchool from './pages/HighSchool.jsx';
import Religious from './pages/Religious.jsx';
import ActivationPage from './pages/ActivationPage.jsx';
import About from './pages/About.jsx';
import Library from './pages/Library.jsx'; // التصحيح النهائي هنا
import CompleteProfile from './pages/CompleteProfile';


import StudentAnalyticsSystem from './pages/StudentAnalyticsSystem.jsx';
import HallOfLegends from './pages/HallOfLegends.jsx';

import SupportColossus from './pages/SupportColossus.jsx';



import './Global.css';

function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const unsubDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
            setUserData({ needsCompletion: true });
          }
          setLoading(false);
        }, () => setLoading(false));
        return () => unsubDoc();
      } else {
        setUserData(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{backgroundColor: '#0f172a', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', direction: 'rtl'}}>
        <h2>جاري تشغيل نظام تيتان...</h2>
      </div>
    );
  }

  const isProfileIncomplete = user && userData && !userData.fullName; 

  return (
    <ErrorBoundary> {/* تغليف التطبيق بصندوق الأمان */}
      <BrowserRouter>
        <Navbar user={user} userData={userData} />
        
        <div style={{ position: 'relative', minHeight: '100vh', backgroundColor: '#0f172a' }}>
          <Routes>
            <Route path="/complete-profile" element={<CompleteProfile />} />
            <Route path="/" element={isProfileIncomplete ? <Navigate to="/complete-profile" /> : <Home />} />
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/student-dash" />} />
            <Route path="/all-courses" element={<AllCourses />} />
            <Route path="/about" element={<About />} />
            
            {/* الآن سيعمل هذا المسار بدون أخطاء */}
            <Route path="/library" element={<Library />} /> 

            <Route path="/student-dash" element={user ? <StudentDash userData={userData} /> : <Navigate to="/login" />} />
            <Route path="/wallet" element={user ? <Wallet userData={userData} /> : <Navigate to="/login" />} />
            <Route path="/activation" element={user ? <ActivationPage userData={userData} /> : <Navigate to="/login" />} />
            <Route path="/highschool" element={<HighSchool />} />
            <Route path="/religious" element={<Religious />} />
            <Route path="/admin" element={userData?.role === 'admin' ? <AdminDash /> : <Navigate to="/" />} />
             <Route path="/studentAnalyticsSystem" element={<StudentAnalyticsSystem />} />
              <Route path="/hallOfLegends" element={<HallOfLegends />} />
              <Route path="/supportColossus" element={<SupportColossus />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;



