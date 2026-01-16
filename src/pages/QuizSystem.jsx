import React, { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../firebase';
import { doc, updateDoc, increment, arrayUnion, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Award, AlertTriangle, Lock, Download, RotateCcw } from 'lucide-react';
import './QuizSystem.css';
const QuizSystem = ({ quizData, lessonId, courseName }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [warningCount, setWarningCount] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [startTime] = useState(Date.now());

  // --- 1. نظام الحماية الذكي (Security System) ---
  
  const handleSecurityBreach = useCallback((reason) => {
    setWarningCount(prev => {
      if (prev >= 2) {
        setIsLocked(true);
        finishQuiz(score, true); // إنهاء إجباري بسبب الغش
        return prev;
      }
      alert(`تنبيه أمني: ${reason}. محاولة الغش قد تؤدي لإلغاء امتحانك.`);
      return prev + 1;
    });
  }, [score]);

  useEffect(() => {
    // منع القائمة اليمنى
    const preventRightClick = (e) => e.preventDefault();
    // منع الاختصارات (Ctrl+C, Ctrl+V, F12, Inspect element)
    const preventShortcuts = (e) => {
      if (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'u' || e.key === 's' || e.key === 'p') || e.keyCode === 123) {
        e.preventDefault();
        handleSecurityBreach("تم اكتشاف محاولة استخدام اختصارات لوحة المفاتيح");
      }
    };
    // كشف الخروج من التبويب (Tab Switching)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleSecurityBreach("تم اكتشاف مغادرة صفحة الامتحان");
      }
    };

    window.addEventListener('contextmenu', preventRightClick);
    window.addEventListener('keydown', preventShortcuts);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('contextmenu', preventRightClick);
      window.removeEventListener('keydown', preventShortcuts);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleSecurityBreach]);

  // --- 2. معالجة الإجابات ---

  const handleAnswer = (index) => {
    if (isLocked) return;

    const isCorrect = quizData[currentQuestion].correctAnswer === index;
    const nextScore = isCorrect ? score + 1 : score;

    if (currentQuestion + 1 < quizData.length) {
      setScore(nextScore);
      setCurrentQuestion(currentQuestion + 1);
    } else {
      finishQuiz(nextScore, false);
    }
  };

  const finishQuiz = async (finalScore, cheated = false) => {
    setShowResult(true);
    const totalQuestions = quizData.length;
    const missed = totalQuestions - finalScore;
    const canGetCertificate = missed <= 2; // شرطك: الدرجة النهائية أو نقص درجة/درجتين

    if (auth.currentUser) {
      const userRef = doc(db, "users", auth.currentUser.uid);
      const examData = {
        lessonId,
        score: finalScore,
        date: new Date().toISOString(),
        cheated,
        earnedCertificate: canGetCertificate && !cheated
      };

      await updateDoc(userRef, {
        examHistory: arrayUnion(examData),
        points: increment(canGetCertificate ? 100 : 10)
      });

      // إذا استحق الشهادة، سجلها في جدول الشهادات
      if (canGetCertificate && !cheated) {
        const certId = `CERT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        await setDoc(doc(db, "certificates", certId), {
          uid: auth.currentUser.uid,
          userName: auth.currentUser.displayName,
          courseName,
          date: new Date().toISOString(),
          score: `${finalScore}/${totalQuestions}`
        });
      }
    }
  };

  // --- 3. واجهة النتائج والشهادة ---

  if (showResult) {
    const isSuccess = (quizData.length - score) <= 2;
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="result-container">
        <div className={`result-card ${isLocked ? 'locked-border' : ''}`}>
          {isLocked ? (
            <div className="status-header error">
              <ShieldAlert size={48} />
              <h2>تم إلغاء الامتحان</h2>
              <p>بسبب مخالفة معايير الأمان (محاولة غش).</p>
            </div>
          ) : (
            <div className="status-header">
              <Award size={64} className={isSuccess ? "gold-glow" : ""} />
              <h2>{isSuccess ? "مبروك! تستحق الشهادة" : "نتيجة الامتحان"}</h2>
            </div>
          )}

          <div className="score-circle">
            <span className="big-score">{score}</span>
            <span className="total">/ {quizData.length}</span>
          </div>

          {isSuccess && !isLocked && (
            <motion.div whileHover={{ scale: 1.05 }} className="certificate-box">
              <div className="cert-preview">
                <h3>شهادة إتمام</h3>
                <p>نقر بأن الطالب <b>{auth.currentUser?.displayName}</b></p>
                <p>قد اجتاز دورة <b>{courseName}</b> بنجاح.</p>
              </div>
              <button className="download-btn" onClick={() => window.print()}>
                <Download size={18} /> تحميل الشهادة (PDF)
              </button>
            </motion.div>
          )}

          <button onClick={() => window.location.reload()} className="retry-btn">
            <RotateCcw size={18} /> العودة للمقرر
          </button>
        </div>
      </motion.div>
    );
  }

  // --- 4. واجهة الامتحان الرئيسية ---
  return (
    <div className="secure-quiz-layout select-none"> {/* منع اختيار النص عبر CSS */}
      <div className="exam-header">
        <div className="security-badge">
          <Lock size={14} /> بيئة امتحانية مؤمنة
        </div>
        <div className="warnings">
          التحذيرات: {warningCount} / 3
        </div>
      </div>

      <div className="progress-container">
        <div className="progress-text">السؤال {currentQuestion + 1} من {quizData.length}</div>
        <div className="progress-bar-bg">
          <motion.div 
            className="progress-bar-fill"
            initial={{ width: 0 }}
            animate={{ width: `${((currentQuestion + 1) / quizData.length) * 100}%` }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={currentQuestion}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="question-section"
        >
          <h2 className="question-text">{quizData[currentQuestion].question}</h2>
          <div className="options-list">
            {quizData[currentQuestion].options.map((option, idx) => (
              <button key={idx} onClick={() => handleAnswer(idx)} className="secure-option-btn">
                <span className="option-index">{String.fromCharCode(65 + idx)}</span>
                {option}
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default QuizSystem;