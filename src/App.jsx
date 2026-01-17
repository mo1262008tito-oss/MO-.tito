import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

// 1. الاستيرادات (Import) - تأكد من وجود ملف Library.jsx في مجلد pages
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
import Library from './pages/Library'; // استيراد صفحة المكتبة

const AppLayout = ({ user, isAdmin, children }) => {
  const location = useLocation();
  const hideNavbarPaths = ['/', '/login'];
  const shouldShowNavbar = !hideNavbarPaths.includes(location.pathname);

  return (
    <>
      {/* تمرير isAdmin و userData للناف بار */}
      {shouldShowNavbar && <Navbar userData={user} isAdmin={isAdmin} />}
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

  // مصفوفة إيميلات الأدمن (أنت وفتحي)
  const adminEmails = ['mahmoud1262008tito@gmail.com', 'fathy@tito.com'];
  const isAdmin = user && adminEmails.includes(user.email?.toLowerCase());

  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner-neon"></div>
        <h1 className="glow-text">MaFa.Tec</h1>
      </div>
    );
  }

  return (
    <Router>
      <AppLayout user={user} isAdmin={isAdmin}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />

          {/* مسارات الطالب */}
          <Route path="/student-dash" element={user ? <StudentDash /> : <Navigate to="/login" />} />
          <Route path="/all-courses" element={user ? <AllCourses /> : <Navigate to="/login" />} />
          <Route path="/highschool" element={user ? <HighSchool /> : <Navigate to="/login" />} />
          
          {/* تصحيح مسار المكتبة */}
          <Route path="/library" element={user ? <Library /> : <Navigate to="/login" />} />
          
          <Route path="/course/:id" element={user ? <CoursePlayer /> : <Navigate to="/login" />} />
          <Route path="/quiz/:id" element={user ? <QuizSystem /> : <Navigate to="/login" />} />
          <Route path="/wallet" element={user ? <Wallet /> : <Navigate to="/login" />} />
          <Route path="/activate" element={user ? <ActivationPage /> : <Navigate to="/login" />} />
          <Route path="/religious" element={user ? <Religious /> : <Navigate to="/login" />} />

          {/* مسار الإدارة - محمي بـ isAdmin */}
          <Route 
            path="/admin" 
            element={isAdmin ? <AdminDash /> : <Navigate to="/" />} 
          />
        </Routes>
      </AppLayout>
    </Router>
  );
}

export default App;
