import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; 
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database'; 
import { getAnalytics, isSupported } from "firebase/analytics"; 

/**
 * إعدادات الاتصال بمشروعك (Mafat Platform)
 * هذه المفاتيح تربط الكود البرمجي بالسيرفرات السحابية
 */
const firebaseConfig = {
  apiKey: 'AIzaSyDhrGwUiLL_V8Wl2fceAE3rhonE4xQMJDg',
  authDomain: 'mafat-platform.firebaseapp.com',
  // ملاحظة: تأكد من تطابق هذا الرابط مع الرابط في Realtime Database داخل لوحة Firebase
databaseURL: "https://mafat-platform.europe-west1.firebasedatabase.app", 
  projectId: 'mafat-platform',
  storageBucket: 'mafat-platform.firebasestorage.app',
  messagingSenderId: '732155910926',
  appId: '1:732155910926:web:2d1910cf2f9c108d6dd55f',
  measurementId: 'G-MQNKFEQ4BC'
};

// 1. تشغيل التطبيق الأساسي
const app = initializeApp(firebaseConfig); 

// 2. تصدير الخدمات لربطها بالأجزاء العشرة من المنصة

// قاعدة بيانات Firestore (تخزين الطلاب، الكورسات، المذكرات، والنتائج)
export const db = getFirestore(app);

// نظام المصادقة (إدارة دخول الأدمن والطلاب)
export const auth = getAuth(app);

// التخزين السحابي (رفع ملفات الـ PDF، الصور، وأغلفة الكتب)
export const storage = getStorage(app);

// قاعدة البيانات اللحظية (محرك الرادار، التنبيهات الفورية، وحالة الأونلاين)
export const rtdb = getDatabase(app); 

// نظام التحليلات (لمراقبة نشاط المنصة بشكل عام)
export const analytics = typeof window !== 'undefined' 
  ? isSupported().then(yes => yes ? getAnalytics(app) : null) 
  : null;

// تصدير التطبيق كافتراضي
export default app;

