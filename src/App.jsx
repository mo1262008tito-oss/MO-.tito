import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';

// استيراد المكونات
import Navbar from './components/Navbar';
import ProtectedRoute from './ProtectedRoute';


// استيراد الصفحات (المسارات بناءً على صورك)
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import StudentDash from './pages/StudentDash.jsx';
import AdminDash from './pages/AdminDash.jsx';
import Wallet from './pages/Wallet.jsx';
import AllCourses from './pages/AllCourses.jsx';
import HighSchool from './pages/HighSchool.jsx';
import Religious from './pages/Religious.jsx';
import ActivationPage from './pages/ActivationPage.jsx';

// التنسيقات العامة
import './Global.css';

function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // جلب بيانات المستخدم اللحظية من Firestore
        const userDocRef = doc(db, 'users', currentUser.uid);
        const unsubDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          }
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

  if (loading) {
    return <div className="loading-screen">جاري تحميل المنصة...</div>;
  }

  return (
    <BrowserRouter>
      {/* تمرير البيانات للـ Navbar للتحكم في ما يظهر للطالب */}
      <Navbar userData={userData} isAdmin={userData?.role === 'admin'} />
      
      <Routes>
        {/* المسارات العامة */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/student-dash" />} />
        
        {/* مسارات الطالب (محمية) */}
        <Route element={<ProtectedRoute user={user} />}>
          <Route path="/student-dash" element={<StudentDash userData={userData} />} />
          <Route path="/wallet" element={<Wallet userData={userData} />} />
          <Route path="/activation" element={<ActivationPage userData={userData} />} />
          <Route path="/all-courses" element={<AllCourses />} />
          <Route path="/highschool" element={<HighSchool />} />
          <Route path="/religious" element={<Religious />} />
        </Route>

        {/* مسار الأدمن (محمي بصلاحية الـ role) */}
        <Route 
          path="/admin" 
          element={userData?.role === 'admin' ? <AdminDash /> : <Navigate to="/" />} 
        />

        {/* إعادة توجيه لأي مسار غير معروف */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;


