import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase'; // المسار حسب صورك في الـ src

// استيراد الصفحات حسب بنية المجلدات في صورك
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

  // شاشة تحميل بسيطة لمنع الانهيار أثناء التحقق من Firebase
  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader"></div>
        <p>جاري تشغيل محركات تيتو أكاديمي...</p>
      </div>
    );
  }

  // دالة حماية المسارات (عادي/أدمن)
  const ProtectedAdminRoute = ({ children }) => {
    const adminEmails = ['mahmoud@tito.com', 'fathy@tito.com'];
    if (!user || !adminEmails.includes(user.email?.toLowerCase())) {
      return <Navigate to="/login" />;
    }
    return children;
  };

  return (
    <Router>
      <Routes>
        {/* المسارات العامة */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/student-dash" />} />

        {/* مسارات الطالب */}
        <Route path="/student-dash" element={user ? <StudentDash /> : <Navigate to="/login" />} />
        <Route path="/courses" element={user ? <AllCourses /> : <Navigate to="/login" />} />
        <Route path="/course/:id" element={user ? <CoursePlayer /> : <Navigate to="/login" />} />
        <Route path="/quiz/:id" element={user ? <QuizSystem /> : <Navigate to="/login" />} />
        <Route path="/wallet" element={user ? <Wallet /> : <Navigate to="/login" />} />
        <Route path="/activate" element={user ? <ActivationPage /> : <Navigate to="/login" />} />
        
        {/* أقسام المحتوى الخاصة */}
        <Route path="/religious" element={user ? <Religious /> : <Navigate to="/login" />} />
        <Route path="/high-school" element={user ? <HighSchool /> : <Navigate to="/login" />} />

        {/* المسار المحمي للمديرين (محمود وفتحي) */}
        <Route 
          path="/admin" 
          element={
            <ProtectedAdminRoute>
              <AdminDash />
            </ProtectedAdminRoute>
          } 
        />

        {/* تحويل أي مسار خاطئ للرئيسية */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;

