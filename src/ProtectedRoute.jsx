import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

// نحن نمرر الـ user من ملف App.jsx كـ prop
const ProtectedRoute = ({ user }) => {
  
  // إذا لم يكن هناك مستخدم مسجل، يتم تحويله لصفحة الدخول
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // إذا كان مسجل، يتم عرض الصفحة المطلوبة (مثل المحفظة أو لوحة الطالب)
  return <Outlet />;
};

export default ProtectedRoute;
