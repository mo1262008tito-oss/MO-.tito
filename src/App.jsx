import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

import Navbar from './components/Navbar'; 
import Home from './pages/Home';
import Login from './pages/Login';
import AdminDash from './pages/AdminDash';
import StudentDash from './pages/StudentDash';
import AllCourses from './pages/AllCourses';
import CoursePlayer from './pages/CoursePlayer';
import QuizSystem from './pages/QuizSystem';
import Wallet from './pages/Wallet';
import ActivationPage from './pages/ActivationPage';
import Religious from './pages/Religious';
import HighSchool from './pages/HighSchool';
import About from './pages/About';

const AppLayout = ({ user, children }) => {
  const location = useLocation();
  // إخفاء الناف بار في الهوم واللوجين
  const hideNavbarPaths = ['/', '/login'];
  const shouldShowNavbar = !hideNavbarPaths.includes(location.pathname);

  return (
    <>
      {shouldShowNavbar && <Navbar userData={user} />}
      <div className={shouldShowNavbar ? "main-content-active" : ""}>
        {children}
      </div>
    </>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner-neon"></div>
        <h1 className="glow-text">MaFa.Tec</h1>
      </div>
    );
  }

  // مصفوفة إيميلات الأدمن
  const adminEmails = ['mahmoudtito1262008@gmail.com', 'fathy@tito.com'];
  const isAdmin = user && adminEmails.includes(user.email?.toLowerCase());

  return (
    <Router>
      <AppLayout user={user}>
        <Routes>
          {/* 1. المسارات العامة (متاحة للكل ولا تسبب ريمكس) */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />

          {/* 2. مسارات الطالب (تأكد من مطابقة path مع روابط الـ Navbar) */}
          <Route path="/student-dash" element={user ? <StudentDash /> : <Navigate to="/login" />} />
          <Route path="/all-courses" element={user ? <AllCourses /> : <Navigate to="/login" />} />
          <Route path="/highschool" element={user ? <HighSchool /> : <Navigate to="/login" />} />
          <Route path="/library" element={user ? < library/>: <Navigate to="/login" />} />
          
          <Route path="/course/:id" element={user ? <CoursePlayer /> : <Navigate to="/login" />} />
          <Route path="/quiz/:id" element={user ? <QuizSystem /> : <Navigate to="/login" />} />
          <Route path="/wallet" element={user ? <Wallet /> : <Navigate to="/login" />} />
          <Route path="/activate" element={user ? <ActivationPage /> : <Navigate to="/login" />} />
          <Route path="/religious" element={user ? <Religious /> : <Navigate to="/login" />} />

          {/* 3. مسار الإدارة */}
          <Route 
            path="/admin" 
            element={isAdmin ? <AdminDash /> : <Navigate to="/" />} 
          />

          {/* 4. معالج الروابط الخطأ (قم بتعطيله مؤقتاً إذا استمرت المشكلة للتجربة) */}
          {/* <Route path="*" element={<Navigate to="/" />} /> */}
        </Routes>
      </AppLayout>
    </Router>
  );
}


export default App;
