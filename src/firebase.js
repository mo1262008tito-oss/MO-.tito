import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth'; 
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database'; 
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: 'AIzaSyDhrGwUiLL_V8Wl2fceAE3rhonE4xQMJDg',
  authDomain: 'mafat-platform.firebaseapp.com',
  databaseURL: "https://mafat-platform-default-rtdb.firebaseio.com", 
  projectId: 'mafat-platform',
  storageBucket: 'mafat-platform.firebasestorage.app',
  messagingSenderId: '732155910926',
  appId: '1:732155910926:web:2d1910cf2f9c108d6dd55f',
  measurementId: 'G-MQNKFEQ4BC'
};

// تشغيل التطبيق
const app = initializeApp(firebaseConfig); 

// --- تصدير الخدمات لدعم مميزات المنصة ---

// 1. قاعدة بيانات Firestore:
// (تستخدم لتخزين: بيانات المستخدمين، تفاصيل الكورسات، بنك الأسئلة، سجل الدرجات، وطلبات الشحن)
export const db = getFirestore(app);

// 2. نظام المصادقة (Authentication):
// (يدعم: التسجيل بالإيميل، الدخول بجوجل، وحماية مسارات الأدمن)
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider(); // مضاف لدعم تسجيل دخول جوجل بسهولة

// 3. التخزين (Storage):
// (يستخدم لرفع: صور الكورسات، ملفات PDF المكتبة، فيديوهات الدروس، وصور البروفايل)
export const storage = getStorage(app);

// 4. قاعدة البيانات اللحظية (Realtime Database):
// (تستخدم لـ: العداد الجماعي للطلاب، حالة الـ Online، الإشعارات الفورية، وشات الدعم الفني)
export const rtdb = getDatabase(app); 

// 5. التحليلات (Analytics):
// (تستخدم لمتابعة: عدد الزوار، أكثر الكورسات طلباً، وأداء المنصة)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
