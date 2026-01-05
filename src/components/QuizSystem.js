import React, { useState } from 'react';
import { db, auth } from '../firebase';
import { doc, updateDoc, increment, arrayUnion } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Award, RefreshCw } from 'lucide-react';

const QuizSystem = ({ quizData, lessonId }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);

  const handleAnswer = (index) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(index);
    const correct = quizData[currentQuestion].correctAnswer === index;
    setIsCorrect(correct);

    if (correct) setScore(score + 1);

    setTimeout(() => {
      if (currentQuestion + 1 < quizData.length) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setIsCorrect(null);
      } else {
        finishQuiz();
      }
    }, 1500);
  };

  const finishQuiz = async () => {
    setShowResult(true);
    const finalPercentage = (score / quizData.length) * 100;

    if (finalPercentage >= 50 && auth.currentUser) {
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        completedQuizzes: arrayUnion(lessonId),
        points: increment(50) // جائزة النجاح
      });
    }
  };

  if (showResult) return (
    <div className="quiz-result-card">
      <Award size={50} color="#00f2ff" />
      <h2>نتيجتك هي {score} من {quizData.length}</h2>
      <button onClick={() => window.location.reload()} className="action-btn">إعادة الاختبار</button>
    </div>
  );

  return (
    <div className="quiz-container-v2">
      <h3 className="quiz-q-text">{quizData[currentQuestion].question}</h3>
      <div className="options-grid">
        {quizData[currentQuestion].options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleAnswer(index)}
            className={`option-btn ${selectedAnswer === index ? (isCorrect ? 'correct' : 'wrong') : ''}`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuizSystem;
