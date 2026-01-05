import React, { useState } from 'react';
import { db, auth } from '../firebase';
import { doc, updateDoc, increment, arrayUnion } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Award, RefreshCw, Zap } from 'lucide-react';

const QuizSystem = ({ quizData, lessonId }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);

  // التحقق من وجود بيانات لتجنب انهيار الموقع
  if (!quizData || quizData.length === 0) {
    return <div className="quiz-empty">لا يوجد أسئلة متاحة حالياً.</div>;
  }

  const handleAnswer = (index) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(index);
    const correct = quizData[currentQuestion].correctAnswer === index;
    setIsCorrect(correct);

    // تحديث النتيجة
    const newScore = correct ? score + 1 : score;
    if (correct) setScore(newScore);

    setTimeout(() => {
      if (currentQuestion + 1 < quizData.length) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setIsCorrect(null);
      } else {
        // نمرر النتيجة النهائية للدالة مباشرة لضمان الدقة
        finishQuiz(newScore);
      }
    }, 1200);
  };

  const finishQuiz = async (finalScore) => {
    setShowResult(true);
    const finalPercentage = (finalScore / quizData.length) * 100;

    // تفعيل الجائزة إذا نجح الطالب (أكبر من 50%)
    if (finalPercentage >= 50 && auth.currentUser) {
      try {
        const userRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userRef, {
          completedQuizzes: arrayUnion(lessonId),
          points: increment(50) 
        });
      } catch (error) {
        console.error("Error saving score:", error);
      }
    }
  };

  if (showResult) return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }} 
      animate={{ scale: 1, opacity: 1 }}
      className="quiz-result-card glass"
    >
      <Award size={60} color={score / quizData.length >= 0.5 ? "#00ff88" : "#ff4444"} />
      <h2>النتيجة النهائية</h2>
      <div className="score-display">{score} / {quizData.length}</div>
      <p>{(score / quizData.length) >= 0.5 ? "عمل رائع! استمر في التفوق 🚀" : "حاول مرة أخرى لتحسين مستواك 📚"}</p>
      <button onClick={() => window.location.reload()} className="retry-btn">
        <RefreshCw size={18} /> إعادة المحاولة
      </button>
    </motion.div>
  );

  return (
    <div className="quiz-container-v2 glass">
      <div className="quiz-progress">
        <span>سؤال {currentQuestion + 1} من {quizData.length}</span>
        <div className="progress-bar">
          <motion.div 
            className="progress-fill" 
            initial={{ width: 0 }}
            animate={{ width: `${((currentQuestion + 1) / quizData.length) * 100}%` }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={currentQuestion}
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -50, opacity: 0 }}
        >
          <h3 className="quiz-q-text">{quizData[currentQuestion].question}</h3>
          
          <div className="options-grid">
            {quizData[currentQuestion].options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                className={`option-btn ${
                  selectedAnswer === index 
                    ? (isCorrect ? 'correct-glow' : 'wrong-glow') 
                    : ''
                } ${selectedAnswer !== null && quizData[currentQuestion].correctAnswer === index ? 'correct-glow' : ''}`}
              >
                <div className="option-label">{String.fromCharCode(65 + index)}</div>
                {option}
                {selectedAnswer === index && (
                  isCorrect ? <CheckCircle className="stat-icon" /> : <XCircle className="stat-icon" />
                )}
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default QuizSystem;
