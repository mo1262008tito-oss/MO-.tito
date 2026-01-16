import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FaRocket, FaCode, FaBook, FaWallet, FaUserShield, 
  FaChartLine, FaQuestionCircle, FaAward, FaCrown, FaUsers 
} from 'react-icons/fa';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  
  // --- 1. حالة النظام والرسائل التفاعلية ---
  const [displayText, setDisplayText] = useState('');
  const [msgIndex, setMsgIndex] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [stats, setStats] = useState({ students: 0, courses: 0, xp: 0 });

  const heroMessages = useMemo(() => [
    "مرحباً بك في عصر التعليم الذكي 4.0",
    "حوّل شغفك بالبرمجة إلى واقع ملموس",
    "منظومة متكاملة لطلاب الثانوية العامة",
    "تعلم، نـافس، واربح جوائز حقيقية USDT"
  ], []);

  // --- 2. محرك العدادات الحية (Live Counters) ---
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        students: prev.students < 15400 ? prev.students + 127 : 15400,
        courses: prev.courses < 850 ? prev.courses + 12 : 850,
        xp: prev.xp < 1000000 ? prev.xp + 5400 : 1000000
      }));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // --- 3. محرك كتابة النصوص (Typewriter Engine) ---
  useEffect(() => {
    let i = 0;
    const currentMsg = heroMessages[msgIndex];
    const typing = setInterval(() => {
      setDisplayText(currentMsg.slice(0, i));
      i++;
      if (i > currentMsg.length) {
        clearInterval(typing);
        setTimeout(() => {
          setMsgIndex((prev) => (prev + 1) % heroMessages.length);
        }, 2500);
      }
    }, 70);
    return () => clearInterval(typing);
  }, [msgIndex, heroMessages]);

  // --- 4. معالجة حركة الماوس للـ 3D Parallax ---
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e) => {
    const x = (window.innerWidth / 2 - e.pageX) / 40;
    const y = (window.innerHeight / 2 - e.pageY) / 40;
    setRotate({ x, y });
  };

  // --- 5. بيانات المميزات الضخمة (Features Database) ---
  const features = [
    {
      title: "نظام التلعيب (Gamification)",
      desc: "نحن لا ندرّس فقط، بل نحوّل المنهج إلى رحلة RPG. اجمع الـ XP، ارفع مستواك، ونافس في قائمة المتصدرين العالمية لتربح أوسمة حقيقية.",
      icon: <FaAward />,
      color: "#ff0055"
    },
    {
      title: "الحماية ضد الغش (Anti-Cheat)",
      desc: "نظام ذكاء اصطناعي يراقب السلوك لضمان نزاهة الاختبارات. تشفير كامل لبياناتك ومحفظتك الرقمية باستخدام بروتوكولات حماية متطورة.",
      icon: <FaUserShield />,
      color: "#00d2ff"
    },
    {
      title: "المحفظة الذكية (Crypto-Wallet)",
      desc: "نظام مالي متكامل يدعم USDT. اشحن رصيدك عبر الأكواد، اشترك في الكورسات، أو استلم جوائزك المالية مباشرة في حسابك.",
      icon: <FaWallet />,
      color: "#43e97b"
    }
  ];

  return (
    <div className="home-ultimate-container" onMouseMove={handleMouseMove}>
      
      {/* هيدر التنقل الشفاف */}
      <nav className={`main-nav ${isMenuOpen ? 'open' : ''} glass`}>
        <div className="nav-logo">
          <FaRocket className="logo-icon" />
          <span>STUDENT-PRO <small>V3</small></span>
        </div>
        <div className="nav-links">
          <a href="#hero">الرئيسية</a>
          <a href="#features">المميزات</a>
          <a href="#stages">المراحل</a>
          <a href="#stats">الإحصائيات</a>
          <button className="nav-login-btn" onClick={() => navigate('/login')}>دخول المنصة</button>
        </div>
        <div className="menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <span></span><span></span><span></span>
        </div>
      </nav>

      {/* قسم الهيرو العملاق (Hero Core) */}
      <section id="hero" className="hero-section-v3">
        <div className="background-3d-layers">
          <motion.div 
            className="shape circle-1" 
            animate={{ x: rotate.x * 2, y: rotate.y * 2, rotate: 360 }}
            transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
          />
          <motion.div 
            className="shape cube-1" 
            animate={{ x: -rotate.x * 3, y: -rotate.y * 3, rotate: -360 }}
            transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
          />
          <div className="overlay-grid"></div>
        </div>

        <div className="hero-main-content">
          <motion.div 
            className="hero-badge"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            ⭐ المنصة التعليمية رقم #1 في الوطن العربي
          </motion.div>

          <h1 className="main-title">
            مستقبلك يبدأ من <br />
            <span className="text-gradient">نقرة واحدة</span>
          </h1>

          <div className="typewriter-box">
            <span className="typed-text">{displayText}</span>
            <span className="blinking-cursor">_</span>
          </div>

          <p className="hero-description">
            انضم لأكثر من 1500 طالب في أكبر تجمع تعليمي رقمي. نوفر لك شروحات تفاعلية، 
            امتحانات ذكية، وجوائز مالية حقيقية لتحفيزك على التفوق الدراسي والتقني.
          </p>

          <div className="hero-cta-group">
            <motion.button 
              className="cta-btn primary"
              whileHover={{ scale: 1.05, boxShadow: "0 0 20px #4facfe" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/register')}
            >
              سجل الآن مجاناً <FaUsers style={{marginRight: '10px'}} />
            </motion.button>
            
            <motion.button 
              className="cta-btn secondary"
              whileHover={{ backgroundColor: "rgba(255,255,255,0.1)" }}
              onClick={() => navigate('/about')}
            >
              مشاهدة العرض التجريبي
            </motion.button>
          </div>
        </div>

        <motion.div 
          className="hero-visual-card glass"
          style={{ transform: `perspective(1000px) rotateY(${rotate.x}deg) rotateX(${-rotate.y}deg)` }}
        >
          <div className="card-header-v3">
            <div className="dot red"></div><div className="dot yellow"></div><div className="dot green"></div>
          </div>
          <div className="card-body-v3">
            <div className="user-stats-demo">
              <div className="stat-circle">
                <svg viewBox="0 0 36 36" className="circular-chart">
                  <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="circle" strokeDasharray="85, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div className="percentage">85%</div>
              </div>
              <div className="stat-info">
                <h4>مستوى الإنجاز اليومي</h4>
                <p>لقد اجتزت 4 دروس بنجاح!</p>
              </div>
            </div>
            <div className="xp-gain-alert">
              <FaCrown className="crown-icon" />
              <span>+250 XP حصلت على وسام الاجتهاد</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* قسم الإحصائيات (Live Counters Section) */}
      <section id="stats" className="stats-strip glass">
        <div className="stat-box">
          <h3>+{stats.students.toLocaleString()}</h3>
          <p>طالب نشط</p>
        </div>
        <div className="stat-box divider">
          <h3>+{stats.courses.toLocaleString()}</h3>
          <p>دورة تدريبية</p>
        </div>
        <div className="stat-box divider">
          <h3>+{stats.xp.toLocaleString()}</h3>
          <p>نقطة خبرة مكتسبة</p>
        </div>
        <div className="stat-box">
          <h3>99.9%</h3>
          <p>نسبة رضا الطلاب</p>
        </div>
      </section>

      {/* قسم المميزات بنظام البطاقات التفاعلية (Features V3) */}
      <section id="features" className="features-grid-v3">
        <div className="section-title">
          <h2>لماذا نحن <span className="highlight">مختلفون؟</span></h2>
          <p>نحن لا نقدم محتوى فقط، نحن نصنع تجربة مستخدم لا تُنسى</p>
        </div>

        <div className="cards-container">
          {features.map((f, idx) => (
            <motion.div 
              key={idx}
              className="feature-card-v3 glass-heavy"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.2 }}
              onMouseEnter={() => setActiveFeature(idx)}
            >
              <div className="card-icon" style={{ backgroundColor: f.color }}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
              <div className="card-footer-v3">
                <span onClick={() => navigate('/features')}>اقرأ المزيد ➔</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* قسم بوكسات المراحل الدراسية (Study Stages) */}
      <section id="stages" className="stages-mega-section">
        <div className="stages-content">
          <div className="stages-text">
            <h2>اختر مرحلتك وابدأ <br /> <span className="text-gradient">رحلة الإبداع</span></h2>
            <p>سواء كنت في بداية مشوارك أو تستعد للجامعة، لدينا المسار المثالي لك.</p>
            
            <div className="stage-selector">
              <div className="stage-item-v3" onClick={() => navigate('/primary')}>
                <div className="stage-num">01</div>
                <div className="stage-info">
                  <h4>المرحلة الابتدائية</h4>
                  <p>تأسيس قوي بأساليب ممتعة</p>
                </div>
              </div>
              <div className="stage-item-v3" onClick={() => navigate('/preparatory')}>
                <div className="stage-num">02</div>
                <div className="stage-info">
                  <h4>المرحلة الإعدادية</h4>
                  <p>تطوير المهارات العلمية والبرمجية</p>
                </div>
              </div>
              <div className="stage-item-v3 active" onClick={() => navigate('/highschool')}>
                <div className="stage-num">03</div>
                <div className="stage-info">
                  <h4>المرحلة الثانوية</h4>
                  <p>تجهيز شامل لامتحانات الدولة والقدرات</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="stages-visual">
            <div className="floating-preview-ui glass-heavy">
              <img src="/dashboard-preview.png" alt="Preview" className="ui-img" />
              <div className="floating-tag t1">دروس حية 🔴</div>
              <div className="floating-tag t2">اختبارات 📝</div>
              <div className="floating-tag t3">جوائز 🎁</div>
            </div>
          </div>
        </div>
      </section>

      {/* قسم الأسئلة الشائعة (FAQ Interactive) */}
      <section className="faq-section-v3">
        <h2>هل لديك <span className="highlight">أسئلة؟</span></h2>
        <div className="faq-container">
          <details className="faq-item glass">
            <summary>كيف يمكنني سحب الجوائز المالية؟ <FaQuestionCircle /></summary>
            <div className="faq-answer">يمكنك سحب جوائزك عبر محفظة USDT أو تحويلها لرصيد داخل المنصة لشراء كورسات متقدمة.</div>
          </details>
          <details className="faq-item glass">
            <summary>هل المحتوى متاح مدى الحياة؟ <FaQuestionCircle /></summary>
            <div className="faq-answer">نعم، بمجرد شراء الكورس أو تفعيله بالكود، يظل في مكتبتك الخاصة للأبد.</div>
          </details>
          <details className="faq-item glass">
            <summary>ما هو نظام الـ XP؟ <FaQuestionCircle /></summary>
            <div className="faq-answer">هو نظام نقاط تجمعها عند مشاهدة الفيديوهات أو حل الاختبارات لترقية رتبتك في المنصة.</div>
          </details>
        </div>
      </section>

      {/* الفوتر التقني (The Cyber Footer) */}
      <footer className="mega-footer-v3">
        <div className="footer-grid-v3">
          <div className="footer-brand">
            <FaRocket className="f-logo" />
            <h3>STUDENT-PRO</h3>
            <p>المنصة التعليمية الرائدة في تقنيات التعلم عن بعد.</p>
          </div>
          <div className="footer-links">
            <h4>روابط سريعة</h4>
            <ul>
              <li>من نحن</li>
              <li>فريق العمل</li>
              <li>سياسة الخصوصية</li>
              <li>اتصل بنا</li>
            </ul>
          </div>
          <div className="footer-newsletter">
            <h4>اشترك في النشرة</h4>
            <div className="subscribe-box">
              <input type="email" placeholder="بريدك الإلكتروني" />
              <button>اشترك</button>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2024 جميع الحقوق محفوظة لمنصة Student-Pro | صنع بكل ❤️ للمستقبل</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;