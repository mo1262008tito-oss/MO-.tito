
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';

// استيراد المكونات
import Navbar from './components/Navbar';
import ProtectedRoute from './ProtectedRoute';

// استيراد الصفحات (تم تصحيح Library لتصبح بحرف كبير)
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
import Library from './pages/Library.jsx'; // تم التصحيح هنا L كابيتال
import CompleteProfile from './pages/CompleteProfile';

// استيراد التنسيقات العامة
import './Global.css';

function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) setLoading(false);
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const unsubDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
            // إذا كان المستخدم مسجل جوجل ولكن ليس له سجل بيانات
            setUserData({ needsCompletion: true });
          }
          setLoading(false);
          clearTimeout(timeout);
        }, (error) => {
          setLoading(false);
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
      <div style={{backgroundColor: '#0f172a', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', direction: 'rtl'}}>
        <h2>جاري تشغيل المنصة...</h2>
      </div>
    );
  }

  // منطق التحقق: إذا سجل دخول ولم يكمل بياناته، يتم إجباره على صفحة الإكمال
  const isProfileIncomplete = user && userData && !userData.fullName; 

  return (
    <BrowserRouter>
      <Navbar user={user} userData={userData} />
      
      <div style={{ position: 'relative', minHeight: '100vh', backgroundColor: '#0f172a' }}>
        <Routes>
          {/* مسار إكمال البيانات الإجباري */}
          <Route path="/complete-profile" element={<CompleteProfile />} />

          {/* المسارات العامة */}
          <Route path="/" element={isProfileIncomplete ? <Navigate to="/complete-profile" /> : <Home />} />
          
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/student-dash" />} />
          
          <Route path="/all-courses" element={<AllCourses />} />
          <Route path="/about" element={<About />} />

          {/* تصحيح مسار المكتبة */}
          <Route path="/library" element={<Library />} /> 

          {/* مسارات الطلاب */}
          <Route path="/student-dash" element={user ? <StudentDash userData={userData} /> : <Navigate to="/login" />} />
          <Route path="/wallet" element={user ? <Wallet userData={userData} /> : <Navigate to="/login" />} />
          <Route path="/activation" element={user ? <ActivationPage userData={userData} /> : <Navigate to="/login" />} />
          
          <Route path="/highschool" element={<HighSchool />} />
          <Route path="/religious" element={<Religious />} />

          {/* مسار الإدارة */}
          <Route 
            path="/admin" 
            element={userData?.role === 'admin' ? <AdminDash /> : <Navigate to="/" />} 
          />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>

      <style>{`
        body { background-color: #0f172a; margin: 0; font-family: 'Cairo', sans-serif; }
        [class*="glow"], [class*="blob"] { display: none !important; }
      `}</style>
    </BrowserRouter>
  );
}

export default App;

