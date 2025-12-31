import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth, db } from './firebase';
import { doc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

// 1. استيراد المكونات الثابتة
import Navbar from './components/Navbar';
import ParticlesBg from './components/ParticlesBg';

// 2. استيراد الصفحات
import Home from './pages/Home';
import HighSchool from './pages/HighSchool';
import AdminDash from './pages/AdminDash';
import Login from './pages/Login';
import StudentDash from './pages/StudentDash';
import TeacherDash from './pages/TeacherDash';
import AllCourses from './pages/AllCourses'; 
import CoursePlayer from './pages/CoursePlayer';
import Religious from './pages/Religious';
import About from './pages/About';

import './Global.css';

// مكون حماية المسارات (يمنع دخول غير المشتركين)
const ProtectedRoute = ({ children, isActive, loading }) => {
  if (loading) return null; // انتظر حتى يتم التحقق من قاعدة البيانات
  return isActive ? children : <Navigate to="/highschool" />; 
};

function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // مراقبة حالة المستخدم وجلب بياناته من Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // جلب بيانات الطالب (نشط أم لا) لحظياً
        onSnapshot(doc(db, "users", currentUser.uid), (doc) => {
          setUserData(doc.data());
          setLoading(false);
        });
      } else {
        setUserData(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <Router>
      <ParticlesBg /> 
      <Navbar />
      
      <div className="main-content" style={{ minHeight: '90vh', position: 'relative', zIndex: 1 }}>
        <Routes>
          {/* المسارات المفتوحة للجميع */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/about" element={<About />} />
          <Route path="/religious" element={<Religious />} />

          {/* مسار التعليم الثانوي - هو نفسه سيحتوي على نموذج الكود إذا لم يكن مشتركاً */}
          <Route path="/highschool" element={<HighSchool />} />

          {/* مسارات محمية (لا تفتح إلا للمشتركين النشطين) */}
          <Route path="/all-courses" element={
            <ProtectedRoute isActive={userData?.isActive} loading={loading}>
              <AllCourses />
            </ProtectedRoute>
          } />
          
          <Route path="/course/:id" element={
            <ProtectedRoute isActive={userData?.isActive} loading={loading}>
              <CoursePlayer />
            </ProtectedRoute>
          } />

          {/* لوحات التحكم */}
          <Route path="/admin" element={<AdminDash />} />
          <Route path="/student-dash" element={<StudentDash />} />
          <Route path="/teacher-dash" element={<TeacherDash />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;