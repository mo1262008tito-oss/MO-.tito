import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; // 1. استيراد مكتبة المصادقة

const firebaseConfig = {
  apiKey: 'AIzaSyDhrGwUiLL_V8Wl2fceAE3rhonE4xQMJDg',
  authDomain: 'mafat-platform.firebaseapp.com',
  projectId: 'mafat-platform',
  storageBucket: 'mafat-platform.firebasestorage.app',
  messagingSenderId: '732155910926',
  appId: '1:732155910926:web:2d1910cf2f9c108d6dd55f',
  measurementId: 'G-MQNKFEQ4BC'
};

const app = initializeApp(firebaseConfig);

// 2. تعريف وتصدير auth و db
export const db = getFirestore(app);
export const auth = getAuth(app); // هذا السطر هو الذي يحل الخطأ