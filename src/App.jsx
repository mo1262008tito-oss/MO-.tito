import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth, db } from './firebase';
import { doc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

// المكونات الأساسية
import Navbar from './components/Navbar';
import ParticlesBg from './components/ParticlesBg';

// الصفحات
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
import Library from './pages/Library';
// --- إضافة صفحة التفعيل الجديدة هنا ---
import ActivationPage from './pages/ActivationPage'; 

import './Global.css';

// مكون حماية المسارات الذكي
const ProtectedRoute = ({ children, isActive, loading, redirectPath = "/login" }) => {
  if (loading) return <div className="loading-overlay">جاري التحقق من الصلاحيات...</div>; 
  return isActive ? children : <Navigate to={redirectPath} />; 
};

function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        const unsubDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          }
          setLoading(false);
        }, (error) => {
          console.error("Firestore Error:", error);
          setLoading(false);
        });
        return () => unsubDoc();
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
      <Navbar user={user} userData={userData} />
      
      <main className="universal-page-container">
        <Routes>
          {/* 1. المسارات العامة */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/student-dash" />} />
          <Route path="/about" element={<About />} />
          <Route path="/religious" element={<Religious />} />
          <Route path="/library" element={<Library />} />
          <Route path="/highschool" element={<HighSchool />} />

          {/* 2. مسارات الطالب (يجب تسجيل الدخول) */}
          <Route path="/student-dash" element={
            <ProtectedRoute isActive={!!user} loading={loading}>
              <StudentDash />
            </ProtectedRoute>
          } />

          <Route path="/all-courses" element={
            <ProtectedRoute isActive={!!user} loading={loading}>
              <AllCourses />
            </ProtectedRoute>
          } />

          {/* --- مسار تفعيل الكورس (فودافون كاش / كود) --- */}
          <Route path="/activate/:courseId" element={
            <ProtectedRoute isActive={!!user} loading={loading}>
              <ActivationPage />
            </ProtectedRoute>
          } />

          <Route path="/course/:id" element={
            <ProtectedRoute isActive={!!user} loading={loading}>
              <CoursePlayer />
            </ProtectedRoute>
          } />

          {/* 3. مسار المعلم */}
          <Route path="/teacher-dash" element={
            <ProtectedRoute isActive={userData?.role === 'teacher' || userData?.role === 'admin'} loading={loading} redirectPath="/">
              <TeacherDash />
            </ProtectedRoute>
          } />
          
          {/* 4. مسار الإدارة */}
          <Route path="/admin" element={
            <ProtectedRoute isActive={userData?.role === 'admin'} loading={loading} redirectPath="/">
              <AdminDash />
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;

