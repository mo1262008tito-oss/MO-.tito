import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; 
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database'; 
import { getAnalytics, isSupported } from "firebase/analytics"; 

/**
 * إعدادات الاتصال بمشروعك (Mafat Platform)
 */
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

// 1. تشغيل التطبيق الأساسي
const app = initializeApp(firebaseConfig); 

// 2. تهيئة Firestore بإعدادات الاتصال القوي (Experimental Force Long Polling)
// هذا التعديل هو الحل الجذري لمشكلة ERR_CONNECTION_CLOSED و ERR_QUIC_PROTOCOL_ERROR
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true, // يجبر الاتصال على العمل حتى في الشبكات الضعيفة أو المحجوبة
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) // يضمن عمل المكتبة حتى لو انقطع الإنترنت مؤقتاً
});

// 3. نظام المصادقة (Auth)
export const auth = getAuth(app);

// 4. التخزين السحابي (Storage)
export const storage = getStorage(app);

// 5. قاعدة البيانات اللحظية (RTDB)
export const rtdb = getDatabase(app); 

// 6. نظام التحليلات مع معالجة الأخطاء لعدم تعطيل الصفحة
export const analytics = typeof window !== 'undefined' 
  ? isSupported().then(yes => yes ? getAnalytics(app) : null).catch(() => null)
  : null;

export default app;
