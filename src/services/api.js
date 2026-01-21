import { db } from './firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

export const validateAccessCode = async (code) => {
  if (!code) {
    return { success: false, message: "Code cannot be empty." };
  }

  const codesRef = collection(db, "access_codes");
  // Query for the code, ensuring it is 'active'
  const q = query(codesRef, where("code", "==", code.toUpperCase()), where("status", "==", "active"));

  try {
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { success: false, message: "Invalid or already used code." };
    }

    // Found an active code
    const codeDoc = querySnapshot.docs[0];
    const docRef = doc(db, "access_codes", codeDoc.id);

    // Mark code as used
    await updateDoc(docRef, {
      status: 'used',
      usedBy: 'HighSchool_Access',
      usedAt: new Date()
    });

    return { success: true, message: "Access granted.", watermark: code.toUpperCase() };
    
  } catch (error) {
    console.error("Error validating access code: ", error);
    return { success: false, message: "Server error during verification." };
  }
};

export const getStudentProgress = () => {
  return {
    quranProgress: 45,
    studyProgress: 20,
    tasbihCount: 150
  };
};