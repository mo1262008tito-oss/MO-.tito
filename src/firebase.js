import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; 
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database'; // لدعم الإشعارات والبيانات اللحظية
import { getAnalytics } from "firebase/analytics"; // لمتابعة أداء الطلاب

const firebaseConfig = {
  apiKey: 'AIzaSyDhrGwUiLL_V8Wl2fceAE3rhonE4xQMJDg',
  authDomain: 'mafat-platform.firebaseapp.com',
  // جرب هذا الرابط، وإذا استمر الخطأ، انسخ الرابط المباشر من واجهة Firebase
  databaseURL: "https://mafat-platform-default-rtdb.firebaseio.com", 
  projectId: 'mafat-platform',
  storageBucket: 'mafat-platform.firebasestorage.app',
  messagingSenderId: '732155910926',
  appId: '1:732155910926:web:2d1910cf2f9c108d6dd55f',
  measurementId: 'G-MQNKFEQ4BC'
};
// تشغيل التطبيق
export const app = initializeApp(firebaseConfig); 

// --- تصدير الخدمات ---

// 1. قاعدة بيانات Firestore (للكورسات، الامتحانات، بيانات الطلاب)
export const db = getFirestore(app);

// 2. نظام المصادقة (تسجيل دخول الطلاب والأساتذة)
export const auth = getAuth(app);

// 3. التخزين (لرفع صور المكتبة، ملفات الـ PDF، وفيديوهات الكورسات)
export const storage = getStorage(app);

// 4. قاعدة البيانات اللحظية (للإشعارات، حالة الطالب "اونلاين"، والنتائج الفورية)
export const rtdb = getDatabase(app); 

// 5. التحليلات (اختياري - لمتابعة نمو المنصة)

export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
