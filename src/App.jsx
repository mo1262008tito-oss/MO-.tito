import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';

// استيراد المكونات
import Navbar from './components/Navbar';
import ProtectedRoute from './ProtectedRoute';

// استيراد الصفحات (تأكد من مطابقة أسماء الملفات تماماً)
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
import library from './pages/library.jsx';

// استيراد التنسيقات العامة
import './Global.css';

function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // حد أقصى للتحميل لضمان عدم بقاء الشاشة سوداء في حالة ضعف الإنترنت
    const timeout = setTimeout(() => {
      if (loading) setLoading(false);
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // جلب البيانات من جدول 'users'
        const userDocRef = doc(db, 'users', currentUser.uid);
        
        const unsubDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          }
          setLoading(false);
          clearTimeout(timeout);
        }, (error) => {
          console.error("خطأ في جلب بيانات Firestore:", error);
          setLoading(false);
          clearTimeout(timeout);
        });

        return () => unsubDoc();
      } else {
        setUserData(null);
        setLoading(false);
        clearTimeout(timeout);
      }
    });

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  if (loading) {
    return (
      <div style={{
        backgroundColor: '#0f172a',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        direction: 'rtl'
      }}>
        <h2>جاري تشغيل المنصة...</h2>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {/* تمرير البيانات للناف بار لضمان عرض الروابط الصحيحة */}
      <Navbar user={user} userData={userData} />
      
      {/* الحاوية الرئيسية بوضعية relative لحل مشكلة Framer Motion */}
      <div style={{ position: 'relative', minHeight: '100vh', backgroundColor: '#0f172a' }}>
        <Routes>
          {/* مسارات عامة (متاحة للجميع لمنع الطرد التلقائي للهوم) */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/student-dash" />} />
          <Route path="/all-courses" element={<AllCourses />} />
        {/* هنا التصحيح: نستخدم اسم المكون <About /> بدلاً من الـ div */}
<Route path="/about" element={<About />} />

{/* وهنا أيضاً: نستخدم <Library /> */}
<Route path="/library" element={<library />} />
            <Route path="/student-dash" element={<StudentDash userData={userData} />} />
            <Route path="/wallet" element={<Wallet userData={userData} />} />
            <Route path="/activation" element={<ActivationPage userData={userData} />} />
            <Route path="/highschool" element={<HighSchool />} />
            <Route path="/religious" element={<Religious />} />
           
            <Route path="/quizsystem" element={<div style={{color:'white', padding:'100px'}}>الاختبارات</div>} />

          {/* مسارات محمية (للطالب فقط) */}
          <Route element={<ProtectedRoute user={user} />}>
          </Route>

          {/* مسار الإدارة */}
          <Route 
            path="/admin" 
            element={userData?.role === 'admin' ? <AdminDash /> : <Navigate to="/" />} 
          />

          {/* تحويل أي مسار خطأ للرئيسية */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>

      <style>{`
        /* إخفاء الشعاع تماماً من جذوره */
        [class*="glow"], [class*="blob"], [class*="pulse"], .navbar-container::after {
            display: none !important;
            content: none !important;
        }
        /* ضمان عدم وجود مساحات بيضاء */
        body { background-color: #0f172a; margin: 0; }
      `}</style>
    </BrowserRouter>
  );
}


export default App;



