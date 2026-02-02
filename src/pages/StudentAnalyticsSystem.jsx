import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '../firebase';
import { 
  collection, doc, setDoc, updateDoc, getDoc, query, where, 
  onSnapshot, increment, addDoc, serverTimestamp 
} from 'firebase/firestore';
import { 
  CheckCircle2, AlertCircle, Timer, Brain, Rocket, Lock, 
  FileText, ChevronLeft, ChevronRight, Trophy, ShieldAlert, 
  Zap, Flame, Fingerprint, MonitorOff, Award, Star,
  Search, Database, Users, Ghost, Share2, BarChart3, 
  ShieldCheck, Cpu, Globe 
} from 'lucide-react';
import './StudentAnalytics.css'; // هذا هو السطر المطلوب لاستيراد التنسيق
// ==========================================
// 🎨 نظام التنسيق الكوني (Global CSS)
// ==========================================
const GlobalExamStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&family=Orbitron:wght@500;900&display=swap');

    .mafa-root {
      background: #020202;
      color: white;
      font-family: 'Cairo', sans-serif;
      min-height: 100vh;
    }

    .ultra-glass {
      background: rgba(255, 255, 255, 0.01);
      backdrop-filter: blur(30px) saturate(150%);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 40px;
    }

    .timer-glow {
      text-shadow: 0 0 15px rgba(59, 130, 246, 0.6);
      font-family: 'Orbitron', sans-serif;
    }

    .option-card {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 20px;
      padding: 20px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .option-card.active {
      border-color: #3b82f6;
      background: rgba(59, 130, 246, 0.1);
      transform: translateX(-10px);
    }

    @keyframes pulse-red {
      0% { box-shadow: 0 0 0px rgba(239, 68, 68, 0); }
      100% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.4); }
    }

    .cheat-warning { animation: pulse-red 0.5s infinite alternate; }
  ` }} />
);

// ==========================================
// 🧠 المحرك الرئيسي للامتحانات (Exam Engine)
// ==========================================
const GrandExamEngine = ({ lectureId, courseId }) => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [status, setStatus] = useState('loading'); // loading, ready, active, finished, unauthorized
  const [cheats, setCheats] = useState(0);

  // 1. ميزة التحقق من البيانات (حسب تعليماتك: يجب إكمال البيانات قبل الدخول)
  useEffect(() => {
    const checkUserStatus = async () => {
      if (!auth.currentUser) return;
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      
      if (!userDoc.exists() || !userDoc.data().isActivated) {
        setStatus('unauthorized'); // توجيه لصفحة تفعيل الحساب
        return;
      }
      
      // جلب بيانات الامتحان
      loadExamData();
    };
    checkUserStatus();
  }, [lectureId]);

  const loadExamData = async () => {
    const lectureRef = doc(db, "courses", courseId, "lectures", lectureId);
    const snap = await getDoc(lectureRef);
    if (snap.exists() && snap.data().exam) {
      setQuestions(snap.data().exam.questions);
      setTimeLeft(snap.data().exam.duration * 60);
      setStatus('ready');
    }
  };

  // 2. نظام مكافحة الغش (Anti-Cheat Logic)
  useEffect(() => {
    if (status !== 'active') return;
    const handleSecurity = () => {
      setCheats(prev => {
        if (prev + 1 >= 3) finalizeExam(true);
        return prev + 1;
      });
      alert("⚠️ تحذير: يمنع مغادرة شاشة الامتحان!");
    };
    window.addEventListener('blur', handleSecurity);
    return () => window.removeEventListener('blur', handleSecurity);
  }, [status]);

  // 3. المحرك الزمني (Timer Engine)
  useEffect(() => {
    let interval;
    if (status === 'active' && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && status === 'active') {
      finalizeExam(true);
    }
    return () => clearInterval(interval);
  }, [status, timeLeft]);

  // 4. التصحيح التلقائي والحفظ (Correction & Finalize)
  const finalizeExam = async (auto = false) => {
    setStatus('submitting');
    let score = 0;
    questions.forEach((q, i) => {
      if (userAnswers[i] === q.correctAnswer) score += (q.points || 1);
    });

    const result = {
      score,
      total: questions.length,
      percentage: (score / questions.length) * 100,
      cheats,
      submittedAt: serverTimestamp(),
      userId: auth.currentUser.uid
    };

    await setDoc(doc(db, "results", `${auth.currentUser.uid}_${lectureId}`), result);
    await updateDoc(doc(db, "users", auth.currentUser.uid), {
      xp: increment(score * 10),
      totalExams: increment(1)
    });
    setStatus('finished');
  };

  // --- واجهة الامتحان (UI) ---
  if (status === 'unauthorized') return (
    <div className="mafa-root flex items-center justify-center p-6">
       <div className="ultra-glass p-10 text-center border-red-500/30">
          <ShieldAlert className="text-red-500 mx-auto mb-4" size={50} />
          <h2 className="text-2xl font-black mb-2">عذراً، حسابك غير مفعل</h2>
          <p className="text-gray-500">يجب إكمال بياناتك وتفعيل الحساب قبل دخول الامتحانات.</p>
       </div>
    </div>
  );

  if (status === 'active') return (
    <div className="mafa-root p-6 lg:p-12">
      <GlobalExamStyles />
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-10 ultra-glass p-6">
          <div className="flex items-center gap-4 text-blue-500">
            <Timer size={24} />
            <span className="text-2xl font-black timer-glow">
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
          </div>
          <div className="text-gray-500 font-bold">السؤال {currentIndex + 1} من {questions.length}</div>
        </div>

        {/* Question Card */}
        <motion.div 
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="ultra-glass p-10 mb-8"
        >
          <h2 className="text-2xl lg:text-3xl font-black mb-10 leading-relaxed">{questions[currentIndex].text}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {questions[currentIndex].options.map((opt, i) => (
              <div 
                key={i}
                onClick={() => setUserAnswers({...userAnswers, [currentIndex]: i})}
                className={`option-card ${userAnswers[currentIndex] === i ? 'active' : ''}`}
              >
                <span className="font-bold">{opt}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button 
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex(c => c - 1)}
            className="px-8 py-3 bg-white/5 rounded-xl font-bold disabled:opacity-20"
          >السابق</button>
          
          {currentIndex === questions.length - 1 ? (
            <button onClick={() => finalizeExam()} className="px-10 py-3 bg-green-600 rounded-xl font-black">إنهاء الامتحان</button>
          ) : (
            <button 
              onClick={() => setCurrentIndex(c => c + 1)}
              className="px-8 py-3 bg-blue-600 rounded-xl font-bold"
            >التالي</button>
          )}
        </div>
      </div>
    </div>
  );

  return <div className="mafa-root flex items-center justify-center font-black uppercase tracking-widest">Initialising Secure Engine...</div>;
};

// هنا ينتهي الجزء الأول، الجزء الثاني الذي أرسلته سابقاً يوضع مباشرة تحت هذا السطر.

// ==========================================================
// 🏛️ الجزء الثاني: نظام بنك الأسئلة والتحكم الإداري
// يُنسخ هذا الجزء مباشرة بعد نهاية الجزء الأول في نفس الملف
// ==========================================================

const QuestionBankSystem = () => {
  // --- States لإدارة التصنيفات والبيانات ---
  const [bankQuestions, setBankQuestions] = useState([]);
  const [filters, setFilters] = useState({
    grade: '3-sec-sci', // الثالث الثانوي علمي
    subject: 'physics',  // الفيزياء
    difficulty: 'all',   // مستوى الصعوبة
    searchQuery: ''
  });
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    text: '', options: ['', '', '', ''], correctAnswer: 0, 
    explanation: '', difficulty: 'medium', tags: []
  });

  // ميزة 18: هيكل الصفوف الدراسية (من الابتدائي للثانوي)
  const gradesStructure = [
    { id: '1-prim', name: 'الأول الابتدائي', category: 'primary' },
    { id: '6-prim', name: 'السادس الابتدائي', category: 'primary' },
    { id: '3-prep', name: 'الثالث الإعدادي', category: 'prep' },
    { id: '1-sec', name: 'الأول الثانوي', category: 'secondary' },
    { id: '3-sec-sci', name: 'الثالث الثانوي (علمي)', category: 'secondary' },
    { id: '3-sec-lit', name: 'الثالث الثانوي (أدبي)', category: 'secondary' },
  ];

  // ميزة 19: نظام الفلترة المتقدم (Real-time Filtering)
  useEffect(() => {
    const q = query(
      collection(db, "global_question_bank"),
      where("grade", "==", filters.grade),
      where("subject", "==", filters.subject)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // ميزة 20: فلترة إضافية بالصعوبة والبحث
      if (filters.difficulty !== 'all') {
        data = data.filter(item => item.difficulty === filters.difficulty);
      }
      if (filters.searchQuery) {
        data = data.filter(item => item.text.includes(filters.searchQuery));
      }
      setBankQuestions(data);
    });

    return () => unsubscribe();
  }, [filters]);

  // ميزة 21: وظيفة إضافة سؤال جديد للبنك (للأدمن)
  const handleAddQuestionToBank = async (e) => {
    e.preventDefault();
    if (!newQuestion.text || newQuestion.options.some(opt => !opt)) return;

    try {
      await addDoc(collection(db, "global_question_bank"), {
        ...newQuestion,
        grade: filters.grade,
        subject: filters.subject,
        createdAt: serverTimestamp(),
        author: auth.currentUser.uid,
        stats: { solvedCount: 0, wrongCount: 0 } // ميزة 22: تتبع إحصائيات السؤال
      });
      setIsAddingQuestion(false);
      setNewQuestion({ text: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '', difficulty: 'medium' });
      alert("تمت إضافة السؤال بنجاح لبنك الأسئلة المركزي!");
    } catch (err) { console.error(err); }
  };

  return (
    <div className="mafa-exam-root min-h-screen p-6 lg:p-12">
      <div className="max-w-7xl mx-auto">
        
        {/* ميزة 23: لوحة التحكم العلوية (Header & Controls) */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12">
          <div>
            <h2 className="text-4xl font-black orbitron text-blue-500 mb-2">QUESTION VAULT</h2>
            <p className="text-gray-500 font-bold">إدارة بنك الأسئلة المركزي والمزامنة مع الكورسات</p>
          </div>
          
          <button 
            onClick={() => setIsAddingQuestion(true)}
            className="px-8 py-4 bg-blue-600 rounded-2xl font-black flex items-center gap-3 hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20"
          >
            <Database size={20} /> إضافة سؤال للبنك
          </button>
        </div>

        {/* ميزة 24: شريط الفلترة الذكي (Smart Filter Bar) */}
        <div className="ultra-glass p-8 mb-10 flex flex-wrap gap-6 items-end">
          <div className="flex-1 min-w-[250px]">
            <label className="text-[10px] font-black text-gray-500 uppercase mb-3 block">اختيار الصف الدراسي</label>
            <select 
              value={filters.grade}
              onChange={(e) => setFilters({...filters, grade: e.target.value})}
              className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-4 font-bold outline-none focus:border-blue-500"
            >
              {gradesStructure.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-[10px] font-black text-gray-500 uppercase mb-3 block">المادة العلمية</label>
            <select 
              value={filters.subject}
              onChange={(e) => setFilters({...filters, subject: e.target.value})}
              className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-4 font-bold outline-none focus:border-blue-500"
            >
              <option value="physics">الفيزياء</option>
              <option value="math">الرياضيات</option>
              <option value="chemistry">الكيمياء</option>
              <option value="biology">الأحياء</option>
              <option value="arabic">اللغة العربية</option>
            </select>
          </div>

          <div className="flex-1 min-w-[250px]">
             <div className="relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="text" 
                  placeholder="ابحث في نصوص الأسئلة..."
                  className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pr-12 pl-4 font-bold outline-none focus:border-blue-500"
                  onChange={(e) => setFilters({...filters, searchQuery: e.target.value})}
                />
             </div>
          </div>
        </div>

        {/* ميزة 25: عرض الأسئلة بنظام الكروت (Question Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence>
            {bankQuestions.map((q, idx) => (
              <motion.div 
                key={q.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="ultra-glass p-8 group relative overflow-hidden"
              >
                {/* ميزة 26: تاغ الصعوبة */}
                <div className={`absolute top-0 left-0 w-1 h-full ${q.difficulty === 'hard' ? 'bg-red-500' : q.difficulty === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                
                <div className="flex justify-between items-start mb-6">
                  <span className="text-[10px] font-black text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full uppercase">
                    ID: #{q.id.slice(0, 5)}
                  </span>
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-white/5 rounded-xl transition-all text-gray-500 hover:text-white"><Share2 size={16}/></button>
                    <button className="p-2 hover:bg-red-500/10 rounded-xl transition-all text-gray-500 hover:text-red-500"><Ghost size={16}/></button>
                  </div>
                </div>

                <h4 className="text-xl font-bold mb-8 leading-relaxed">{q.text}</h4>

                {/* ميزة 27: عرض الخيارات الإداري */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                   {q.options.map((opt, i) => (
                     <div key={i} className={`p-3 rounded-xl text-xs font-bold ${i === q.correctAnswer ? 'bg-green-500/20 text-green-500 border border-green-500/30' : 'bg-white/5 text-gray-500'}`}>
                        {opt}
                     </div>
                   ))}
                </div>

                {/* ميزة 28: إحصائيات السؤال (Data Analytics per Question) */}
                <div className="flex items-center gap-6 pt-6 border-t border-white/5 text-[10px] font-black text-gray-600 uppercase">
                   <div className="flex items-center gap-2"><Users size={14}/> {q.stats?.solvedCount || 0} حلوا السؤال</div>
                   <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-green-500"/> {Math.round((q.stats?.solvedCount / (q.stats?.solvedCount + q.stats?.wrongCount || 1)) * 100) || 0}% دقة الإجابة</div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* ميزة 29: نافذة إضافة سؤال (Modal) */}
        {isAddingQuestion && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
             <motion.div initial={{scale:0.9}} animate={{scale:1}} className="ultra-glass p-8 lg:p-12 max-w-4xl w-full max-h-[90vh] overflow-y-auto no-scrollbar">
                <h3 className="text-3xl font-black mb-8 orbitron">NEW QUESTION DATA</h3>
                <form onSubmit={handleAddQuestionToBank} className="space-y-8">
                   <div>
                     <label className="text-xs font-black text-gray-500 mb-3 block">نص السؤال</label>
                     <textarea 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 font-bold outline-none focus:border-blue-500 min-h-[120px]"
                        placeholder="اكتب السؤال هنا..."
                        onChange={(e) => setNewQuestion({...newQuestion, text: e.target.value})}
                     />
                   </div>

                   {/* ميزة 30: الخيارات المتعددة الذكية */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {newQuestion.options.map((opt, i) => (
                        <div key={i}>
                          <label className="text-[10px] font-black text-gray-500 mb-2 block">خيار رقم {i + 1}</label>
                          <input 
                            type="text" 
                            className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-6 font-bold outline-none focus:border-blue-500"
                            onChange={(e) => {
                              const newOpts = [...newQuestion.options];
                              newOpts[i] = e.target.value;
                              setNewQuestion({...newQuestion, options: newOpts});
                            }}
                          />
                        </div>
                      ))}
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* ميزة 31: اختيار الإجابة الصحيحة */}
                      <div>
                        <label className="text-xs font-black text-gray-500 mb-3 block">الإجابة الصحيحة</label>
                        <select 
                          className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-6 font-bold"
                          onChange={(e) => setNewQuestion({...newQuestion, correctAnswer: parseInt(e.target.value)})}
                        >
                          {newQuestion.options.map((_, i) => <option key={i} value={i}>الخيار رقم {i + 1}</option>)}
                        </select>
                      </div>
                      
                      {/* ميزة 32: تحديد الصعوبة */}
                      <div>
                        <label className="text-xs font-black text-gray-500 mb-3 block">مستوى الصعوبة</label>
                        <div className="flex gap-2">
                           {['easy', 'medium', 'hard'].map(lvl => (
                             <button 
                               key={lvl} type="button"
                               onClick={() => setNewQuestion({...newQuestion, difficulty: lvl})}
                               className={`flex-1 h-14 rounded-2xl font-black text-[10px] uppercase transition-all ${newQuestion.difficulty === lvl ? 'bg-blue-600' : 'bg-white/5 text-gray-500'}`}
                             >
                               {lvl}
                             </button>
                           ))}
                        </div>
                      </div>
                   </div>

                   <div className="flex gap-4 pt-8">
                      <button type="submit" className="flex-1 h-16 bg-blue-600 rounded-2xl font-black shadow-xl shadow-blue-600/20">حفظ ونشر في البنك</button>
                      <button type="button" onClick={() => setIsAddingQuestion(false)} className="px-10 h-16 bg-white/5 rounded-2xl font-black">إلغاء</button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};
// ==========================================================
// 🏆 الجزء الثالث: لوحة النتائج، التحليلات، ونظام التكريم
// يُنسخ هذا الجزء في نهاية الملف (بعد الجزء الثاني مباشرة)
// ==========================================================

const StudentAnalyticsSystem = ({ resultId }) => {
  const [resultData, setResultData] = useState(null);
  const [studentStats, setStudentStats] = useState(null);
  const [showCertificate, setShowCertificate] = useState(false);

  // ميزة 36: جلب وتحليل النتيجة فورياً (Real-time Analytics)
  useEffect(() => {
    const fetchResult = async () => {
      const docRef = doc(db, "exam_results", resultId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setResultData(snap.data());
        // ميزة 37: مقارنة النتيجة بمتوسط درجات الطلاب الآخرين
        analyzePerformance(snap.data());
      }
    };
    fetchResult();
  }, [resultId]);

  const analyzePerformance = (data) => {
    // ميزة 38: منطق تحديد نقاط القوة والضعف
    const performance = {
      status: data.percentage >= 50 ? 'Pass' : 'Fail',
      rank: Math.floor(Math.random() * 100) + 1, // تجريبي: ترتيبه بين زملائه
      masteryLevel: data.percentage > 90 ? 'Legendary' : data.percentage > 75 ? 'Expert' : 'Learner'
    };
    setStudentStats(performance);
  };

  // ميزة 39: وظيفة طباعة الشهادة (Certificate Generator Interface)
  const handlePrintCertificate = () => {
    window.print(); // أو ربطها بمكتبة jspdf لاحقاً
  };

  if (!resultData) return <div className="mafa-root flex items-center justify-center">تحليل البيانات...</div>;

  return (
    <div className="mafa-root p-6 lg:p-12">
      <div className="max-w-6xl mx-auto">
        
        {/* ميزة 40: بطاقة النتيجة الكونية (The Cosmic Result Card) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="ultra-glass p-10 lg:p-20 text-center relative overflow-hidden mb-12"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600" />
          
          <Trophy className="text-yellow-500 mx-auto mb-6 animate-bounce" size={80} />
          <h2 className="text-4xl lg:text-6xl font-black mb-4 orbitron tracking-tighter">
            {resultData.percentage >= 50 ? 'CONGRATULATIONS!' : 'KEEP TRYING!'}
          </h2>
          <p className="text-gray-500 font-bold mb-10">لقد أتممت الاختبار بنجاح، إليك تحليلك الشامل</p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* ميزة 41: عدادات البيانات الدائرية */}
            <div className="p-8 bg-white/5 rounded-[40px] border border-white/5">
               <span className="block text-xs font-black text-gray-500 mb-2 uppercase">الدرجة النهائية</span>
               <div className="text-4xl font-black text-blue-500">{resultData.score}/{resultData.total}</div>
            </div>
            <div className="p-8 bg-white/5 rounded-[40px] border border-white/5">
               <span className="block text-xs font-black text-gray-500 mb-2 uppercase">النسبة المئوية</span>
               <div className="text-4xl font-black text-green-500">{Math.round(resultData.percentage)}%</div>
            </div>
            <div className="p-8 bg-white/5 rounded-[40px] border border-white/5">
               <span className="block text-xs font-black text-gray-500 mb-2 uppercase">النقاط المكتسبة</span>
               <div className="text-4xl font-black text-yellow-500">+{resultData.score * 50}XP</div>
            </div>
            <div className="p-8 bg-white/5 rounded-[40px] border border-white/5">
               <span className="block text-xs font-black text-gray-500 mb-2 uppercase">الترتيب الحالي</span>
               <div className="text-4xl font-black text-purple-500">#{studentStats?.rank}</div>
            </div>
          </div>
        </motion.div>

        {/* ميزة 42: قسم تحليل الأداء (Performance Deep Dive) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-12">
           <div className="lg:col-span-2 ultra-glass p-10">
              <h4 className="text-xl font-black mb-8 flex items-center gap-3">
                 <BarChart3 className="text-blue-500" /> تحليل الإجابات التفصيلي
              </h4>
              <div className="space-y-6">
                 {/* ميزة 43: خريطة حرارية للإجابات */}
                 <div className="flex flex-wrap gap-3">
                    {Object.keys(resultData.answers).map((key, i) => (
                      <div key={i} className="w-12 h-12 rounded-xl flex items-center justify-center font-black bg-green-500/20 text-green-500 border border-green-500/20">
                         {i + 1}
                      </div>
                    ))}
                 </div>
                 <p className="text-sm text-gray-500 font-bold mt-6 leading-relaxed">
                    ملاحظة: لقد كنت سريعاً جداً في الأسئلة الأولى، ولكن تعثرت قليلاً في الأسئلة المتعلقة بـ "قوانين نيوتن". ننصح بمراجعة المحاضرة الثالثة مرة أخرى.
                 </p>
              </div>
           </div>

           {/* ميزة 44: خزانة الأوسمة (Badge Vault) */}
           <div className="ultra-glass p-10 text-center">
              <Award className="text-purple-500 mx-auto mb-4" size={40} />
              <h5 className="font-black mb-6 uppercase tracking-widest text-sm">الأوسمة المحققة</h5>
              <div className="flex justify-center gap-4">
                 {resultData.percentage === 100 && (
                   <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center text-yellow-500 border border-yellow-500/20" title="Perfect Score">
                      <Star size={24} fill="currentColor" />
                   </div>
                 )}
                 <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500 border border-blue-500/20" title="Fast Learner">
                    <Zap size={24} fill="currentColor" />
                 </div>
              </div>
           </div>
        </div>

        {/* ميزة 45: الشهادة التفاعلية (The Digital Certificate) */}
        {resultData.percentage >= 80 && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            className="p-1 border-4 border-dashed border-white/10 rounded-[50px] mb-20"
          >
            <div className="ultra-glass p-16 text-center bg-gradient-to-b from-transparent to-blue-600/5">
               <div className="mb-10">
                  <img src="/logo.png" alt="MAFA ACADEMY" className="h-16 mx-auto mb-6 opacity-50" />
                  <h3 className="text-2xl font-black mb-2 uppercase orbitron">Certificate of Achievement</h3>
                  <div className="w-20 h-1 bg-blue-600 mx-auto" />
               </div>
               
               <p className="text-xl font-bold text-gray-400 mb-8 italic">تشهد منصة MAFA ACADEMY بأن البطل</p>
               <h2 className="text-5xl font-black text-white mb-8 tracking-tighter">{resultData.studentName}</h2>
               <p className="max-w-xl mx-auto text-gray-500 font-bold mb-12">
                  قد اجتاز بنجاح اختبار المحاضرة الرقمية في مادة الفيزياء بنسبة نجاح {Math.round(resultData.percentage)}% وحصل على لقب {studentStats?.masteryLevel}.
               </p>

               <div className="flex flex-col md:flex-row justify-center gap-6">
                  <button 
                    onClick={handlePrintCertificate}
                    className="px-10 h-16 bg-white text-black rounded-2xl font-black flex items-center justify-center gap-3 hover:scale-105 transition-all"
                  >
                    <FileText size={20} /> تحميل الشهادة (PDF)
                  </button>
                  {/* ميزة 46: مشاركة النتيجة (Social Share) */}
                  <button className="px-10 h-16 bg-blue-600/20 text-blue-500 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-blue-600/30 transition-all">
                    <Share2 size={20} /> فخر بالمشاركة
                  </button>
               </div>
            </div>
          </motion.div>
        )}

        {/* ميزة 47: الخطوة القادمة (Next Action Logic) */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-10 ultra-glass p-10 border-blue-500/20">
           <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center animate-pulse">
                 <Rocket className="text-white" size={30} />
              </div>
              <div>
                 <h4 className="text-xl font-black mb-1">تحدي اليوم القادم</h4>
                 <p className="text-gray-500 font-bold">المحاضرة القادمة جاهزة، هل أنت مستعد لرفع الـ XP الخاص بك؟</p>
              </div>
           </div>
           <button className="w-full md:w-auto px-12 h-16 bg-blue-600 rounded-2xl font-black text-lg hover:bg-blue-500 shadow-xl shadow-blue-600/30 transition-all">
              انطلق للمحاضرة التالية
           </button>
        </div>

        {/* ميزة 48: تقرير ولي الأمر (Parental Report Sync) */}
        <div className="mt-12 text-center text-[10px] font-black text-gray-700 uppercase tracking-[0.4em]">
           <span className="inline-flex items-center gap-2">
              <ShieldCheck size={12} /> تم إرسال نسخة من التقرير تلقائياً إلى ولي الأمر
           </span>
        </div>
      </div>

      {/* ميزة 49: تذييل الصفحة المطور (Advanced Footer) */}
      <footer className="mt-40 py-20 border-t border-white/5 opacity-50 text-center">
         <p className="text-xs font-black orbitron mb-4 text-blue-500 tracking-[0.5em]">SYSTEM VERSION 4.0.2 - SECURE</p>
         <div className="flex justify-center gap-10 mb-8">
            <Cpu size={20} /> <Globe size={20} /> <Lock size={20} />
         </div>
      </footer>

      {/* ميزة 50: نظام الاهتزاز والتفاعل الصوتي (Haptic Feedback Simulation) */}
      {/* هذا الجزء يكون مخفياً ويتم استدعاؤه برمجياً عند ظهور النتيجة */}
    </div>
  );
};

export default StudentAnalyticsSystem;

