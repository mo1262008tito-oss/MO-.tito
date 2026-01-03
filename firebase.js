import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; 
import { getStorage } from 'firebase/storage'; // 1. استيراد مكتبة التخزين

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

// 2. تعريف وتصدير الخدمات الأساسية
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app); // السطر الأهم لحل مشكلة الـ Storage