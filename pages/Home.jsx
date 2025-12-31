import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase'; 
import { collection, limit, query, onSnapshot } from 'firebase/firestore';

const Home = () => {
  const navigate = useNavigate();
  const [dailyMessage, setDailyMessage] = useState({ text: '', type: '' });
  const [latestCourses, setLatestCourses] = useState([]);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);

  const messages = [
    { text: "وَأَن لَّيْسَ لِلْإِنسَانِ إلا مَا سَعَىٰ ✨", type: "spiritual" },
    { text: "برمج مستقبلك بعلمك، فالكود لا يعرف المستحيل 💻", type: "tech" },
    { text: "إِنَّ اللَّهَ لَا يُضِيعُ أَجْرَ مَنْ أَحْسَنَ عَمَلًا 🌿", type: "spiritual" },
    { text: "النجاح هو مجموع مجهودات صغيرة تتكرر كل يوم 🚀", type: "motivational" }
  ];

  useEffect(() => {
    setDailyMessage(messages[Math.floor(Math.random() * messages.length)]);
    const q = query(collection(db, "courses"), limit(3));
    const unsub = onSnapshot(q, (snap) => {
      setLatestCourses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    let timer = null;
    if (isActive && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0) {
      clearInterval(timer);
      setIsActive(false);
      setTimeLeft(25 * 60);
    }
    return () => { if(unsub) unsub(); clearInterval(timer); };
  }, [isActive, timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="home-wrapper" style={{ direction: 'rtl' }}>
      
      {/* قسم الـ Hero مع الرسالة الـ 3D */}
      <section className="hero-3d-section">
        <div className="welcome-3d-container">
          <h1 className="text-3d">   "حياك الله يا رفيق الدرب وباحث العلم.. حللت أهلاً ووطئت سهلاً في رحاب MaFa Tec. إنما العلم أدب قبل أن يكون طلباً، ونحن هنا نسعد بصحبتك لنبني معاً منارةً من المعرفة، تسمو بها الروح بفيزياء الكون، ويرتقي بها العقل بلغة العصر، ويطمئن بها القلب بنور الإيمان. تفضل يا أخي، فالعلم يشرف بك وبأمثالك."</h1>
          <p className="sub-text-3d">حيث يبدأ الإبداع وينتهي المستحيل.. MaFa Tec بوابتك للمستقبل</p>
        </div>
        
        <div className="daily-quote-card floating">
           <span className="badge">رسالة اليوم 💌</span>
           <p>{dailyMessage.text}</p>
        </div>
      </section>

      {/* عداد بومودورو */}
      <section className="pomodoro-container">
        <div className="square-card glass-card pomodoro-box">
          <h3>⏱️ مؤقت التركيز</h3>
          <div className="timer-num">{formatTime(timeLeft)}</div>
          <div className="timer-btns">
            <button className="start-btn" onClick={() => setIsActive(!isActive)}>
              {isActive ? 'إيقاف' : 'ابدأ الآن'}
            </button>
            <button className="reset-btn" onClick={() => {setIsActive(false); setTimeLeft(25*60)}}>إعادة</button>
          </div>
        </div>
      </section>

      {/* شبكة الكورسات المربعة */}
      <h2 className="section-title">✨ استكشف أحدث الكورسات</h2>
      <div className="square-grid">
        {latestCourses.map(course => (
          <div key={course.id} className="square-card glass-card floating-anim">
            <div className="course-icon">🚀</div>
            <h3>{course.name}</h3>
            <p>{course.instructor}</p>
            <button className="go-btn" onClick={() => navigate('/login')}>انطلق</button>
          </div>
        ))}
      </div>

      {/* قسم الشعارات المربعة */}
      <div className="square-grid motto-section">
        <div className="square-card glass-card motto-gold floating-slow">
           <h3>الإتقان</h3>
           <p>نعمل بصمت، ونترك الإتقان يتحدث عنّا.</p>
        </div>
        <div className="square-card glass-card motto-purple floating-slow-reverse">
           <h3>الهدف</h3>
           <p>بناء عقول تقود الأمة نحو القمة.</p>
        </div>
      </div>

    </div>
  );
};

export default Home;