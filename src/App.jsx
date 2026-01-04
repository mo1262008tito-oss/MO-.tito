import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth, db } from './firebase';
import { doc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

// Components
import Navbar from './components/Navbar';
import ParticlesBg from './components/ParticlesBg';

// Pages
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

import './Global.css';

const ProtectedRoute = ({ children, isActive, loading, redirectPath = "/highschool" }) => {
  if (loading) return null; 
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
          setUserData(docSnap.data());
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
      
      {/* التعديل هنا: تمرير userData للـ Navbar ليتمكن من معرفة الصلاحيات */}
      <Navbar userData={userData} />
      
      <main className="universal-page-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/about" element={<About />} />
          <Route path="/religious" element={<Religious />} />
          <Route path="/highschool" element={<HighSchool />} />
          <Route path="/library" element={<Library />} />

          <Route path="/all-courses" element={
            <ProtectedRoute isActive={userData?.isSecondaryActive} loading={loading}>
              <AllCourses />
            </ProtectedRoute>
          } />

          <Route path="/course/:id" element={
            <ProtectedRoute isActive={userData?.isSecondaryActive} loading={loading}>
              <CoursePlayer />
            </ProtectedRoute>
          } />

          <Route path="/student-dash" element={
            <ProtectedRoute isActive={!!user} loading={loading} redirectPath="/login">
              <StudentDash />
            </ProtectedRoute>
          } />

          <Route path="/teacher-dash" element={
            <ProtectedRoute isActive={userData?.role === 'teacher'} loading={loading} redirectPath="/">
              <TeacherDash />
            </ProtectedRoute>
          } />
          
          <Route path="/admin" element={
            <ProtectedRoute isActive={userData?.role === 'admin'} loading={loading} redirectPath="/">
              <AdminDash />
            </ProtectedRoute>
          } />

          <Route path="/all-courses" element={
  <ProtectedRoute isActive={userData?.isSecondaryActive} loading={loading}>
    <AllCourses />
  </ProtectedRoute>
} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </Router>
  );
}


export default App;



