import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FaRocket, FaCode, FaBook, FaWallet, FaUserShield, 
  FaChartLine, FaQuestionCircle, FaAward, FaCrown, FaUsers,
  FaDiscord, FaGithub, FaYoutube, FaTwitter, FaArrowRight,
  FaMicrochip, FaBrain, FaGem, FaSatellite
} from 'react-icons/fa';
import './Home.css';

/**
 * HOME ULTIMATE V4 - NEBULA EDITION
 * تم تصميم هذا الملف ليكون لوحة فنية تفاعلية تعتمد على الطبقات العميقة
 */

const Home = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  
  // --- 1. الـ Scroll Progress للتحكم في العناصر أثناء النزول ---
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "200%"]);

  // --- 2. State Management ---
  const [displayText, setDisplayText] = useState('');
  const [msgIndex, setMsgIndex] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState('highschool');
  const [isVisible, setIsVisible] = useState(false);

  // نصوص الهيرو المتغيرة
  const heroMessages = useMemo(() => [
    "مرحباً بك في مجرة التعليم الذكي 4.0",
    "حوّل شغفك بالبرمجة إلى أصول رقمية",
    "منظومة متكاملة لطلاب النخبة في مصر",
    "تعلم، نـافس، واستلم جوائزك بـ USDT"
  ], []);

  // --- 3. محرك الجاذبية البصري (Mouse Parallax) ---
  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const x = (clientX - window.innerWidth / 2) / 35;
    const y = (clientY - window.innerHeight / 2) / 35;
    setMousePos({ x, y });
  };

  // --- 4. تأثير الكتابة الذكي ---
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
        }, 3000);
      }
    }, 60);
    return () => clearInterval(typing);
  }, [msgIndex, heroMessages]);

  // --- 5. بيانات مصفوفة المستقبل (Data Grid) ---
  const ecosystem = [
    {
      id: 'gamification',
      title: "نظام التلعيب RPG",
      icon: <FaAward />,
      color: "from-purple-500 to-pink-500",
      details: "اجمع نقاط الـ XP، وارفع مستواك لفتح كورسات سرية وجوائز نادرة.",
      stats: "98% تحفيز"
    },
    {
      id: 'crypto',
      title: "اقتصاد المتعلم",
      icon: <FaGem />,
      color: "from-cyan-400 to-blue-600",
      details: "أول منصة في مصر تمنحك عملات رقمية (USDT) مقابل تفوقك الدراسي.",
      stats: "USDT Rewards"
    },
    {
      id: 'ai',
      title: "الذكاء الاصطناعي",
      icon: <FaBrain />,
      color: "from-green-400 to-emerald-600",
      details: "مساعد ذكي يحلل نقاط ضعفك ويضع لك خطة مذاكرة مخصصة يومياً.",
      stats: "AI Mentor"
    }
  ];

  // --- 6. المكونات الفرعية التفاعلية ---
  const FloatingParticle = ({ size, color, duration, delay }) => (
    <motion.div
      className="particle"
      style={{
        width: size,
        height: size,
        background: color,
        position: 'absolute',
        borderRadius: '50%',
        filter: 'blur(10px)',
        zIndex: 0
      }}
      animate={{
        y: [0, -100, 0],
        x: [0, 50, 0],
        opacity: [0.2, 0.5, 0.2]
      }}
      transition={{
        duration,
        repeat: Infinity,
        delay,
        ease: "easeInOut"
      }}
    />
  );

  return (
    <div className="home-v4-master" ref={containerRef} onMouseMove={handleMouseMove}>
      
      {/* 🌌 الخلفية الفضائية المتحركة */}
      <div className="nebula-bg">
        <div className="stars-layer"></div>
        <FloatingParticle size="300px" color="rgba(79, 172, 254, 0.15)" duration={15} delay={0} />
        <FloatingParticle size="400px" color="rgba(255, 0, 85, 0.1)" duration={20} delay={5} />
      </div>

      {/* 🛰️ Navbar Future Edition */}
      <nav className="nav-v4 glass-morphism">
        <div className="nav-container">
          <motion.div className="brand-v4" whileHover={{ scale: 1.05 }}>
            <div className="logo-glitch-wrapper">
              <FaSatellite className="main-logo-icon" />
              <span className="logo-text">NEBULA <small>PRO</small></span>
            </div>
          </motion.div>

          <div className="nav-links-v4">
            {['المسارات', 'المختبر', 'المتجر', 'المتصدرين'].map((link) => (
              <motion.a 
                key={link} 
                href={`#${link}`} 
                whileHover={{ y: -2, color: '#4facfe' }}
              >
                {link}
              </motion.a>
            ))}
          </div>

          <div className="nav-actions-v4">
            <button className="btn-login-v4" onClick={() => navigate('/login')}>
              <span>دخول النظام</span>
              <div className="btn-glow"></div>
            </button>
            <div className="menu-burger-v4" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <div className={`bar ${isMenuOpen ? 'active' : ''}`}></div>
            </div>
          </div>
        </div>
      </nav>

      {/* 🚀 Hero Section - THE IMPRESSION MAKER */}
      <section className="hero-v4">
        <div className="hero-grid">
          <motion.div 
            className="hero-text-content"
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
          >
            <div className="status-badge">
              <span className="pulse-dot"></span>
              نظام التشغيل: V4.0.2 - ONLINE
            </div>
            
            <h1 className="ultra-title">
              التعلم ليس مجرد <br />
              <span className="gradient-span">استيعاب</span>، بل <br />
              <span className="shining-text">غـزو للمستقبل</span>
            </h1>

            <div className="typing-container-v4">
              <p className="typed-msg">{displayText}<span className="cursor">|</span></p>
            </div>

            <p className="hero-sub-p">
              أول منظومة تعليمية هجينة تدمج بين المناهج المصرية الرسمية 
              وبين تقنيات تطوير الذات والبرمجة العالمية.
            </p>

            <div className="hero-buttons-v4">
              <button className="main-cta-v4" onClick={() => navigate('/onboarding')}>
                ابدأ رحلة الغزو الآن
                <FaRocket className="btn-icon" />
              </button>
              <button className="secondary-cta-v4">
                اكتشف المنهج
              </button>
            </div>

            <div className="hero-trust-badges">
              <div className="trust-item">
                <FaUsers /> <span>+25K طالب</span>
              </div>
              <div className="trust-divider"></div>
              <div className="trust-item">
                <FaCrown /> <span>الأول تقنياً</span>
              </div>
            </div>
          </motion.div>

          {/* 3D Visual Object (The Floating Dashboard) */}
          <motion.div 
            className="hero-3d-visual"
            style={{ 
              rotateX: mousePos.y, 
              rotateY: -mousePos.x,
              transformStyle: "preserve-3d" 
            }}
          >
            <div className="visual-core glass-v4">
              <div className="core-header">
                <div className="controls"><span className="r"></span><span className="y"></span><span className="g"></span></div>
                <div className="core-title">Mainframe_System.exe</div>
              </div>
              <div className="core-body">
                <div className="data-row">
                  <div className="data-label">نظام الحماية</div>
                  <div className="data-bar"><motion.div className="bar-fill" initial={{width: 0}} animate={{width: '94%'}}></motion.div></div>
                </div>
                <div className="data-row">
                  <div className="data-label">تزامن البيانات</div>
                  <div className="data-bar"><motion.div className="bar-fill purple" initial={{width: 0}} animate={{width: '80%'}}></motion.div></div>
                </div>
                <div className="visual-stats-grid">
                  <div className="v-stat-card">
                    <FaMicrochip className="v-icon" />
                    <span>8.4 GHz</span>
                  </div>
                  <div className="v-stat-card">
                    <FaChartLine className="v-icon" />
                    <span>+450% تفوق</span>
                  </div>
                </div>
              </div>
              {/* Floating Holograms */}
              <motion.div className="hologram h1" animate={{ y: [0, -20, 0] }} transition={{ repeat: Infinity, duration: 4 }}>
                <FaCode />
              </motion.div>
              <motion.div className="hologram h2" animate={{ y: [0, 20, 0] }} transition={{ repeat: Infinity, duration: 5, delay: 1 }}>
                <FaWallet />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 📊 Live Statistics Strip */}
      <section className="stats-v4">
        {[
          { label: "كورس تفاعلي", val: "850+", icon: <FaBook /> },
          { label: "ساعة محتوى", val: "12,000+", icon: <FaClock /> },
          { label: "جوائز وزعت", val: "$45,000", icon: <FaGem /> },
          { label: "معدل النجاح", val: "99.2%", icon: <FaChartLine /> }
        ].map((s, i) => (
          <div key={i} className="stat-unit-v4">
            <div className="s-icon-v4">{s.icon}</div>
            <div className="s-info-v4">
              <span className="s-val-v4">{s.val}</span>
              <span className="s-label-v4">{s.label}</span>
            </div>
          </div>
        ))}
      </section>

      {/* 🌌 Ecosystem Section (The 3 Cards) */}
      <section className="ecosystem-v4">
        <div className="section-head-v4">
          <h2 className="title-v4">النظام <span className="highlight">البيئي</span> للمنصة</h2>
          <p>أكثر من مجرد فيديوهات، نحن نبني مستقبلك الرقمي بالكامل</p>
        </div>

        <div className="eco-cards-container">
          {ecosystem.map((item, idx) => (
            <motion.div 
              key={item.id}
              className="eco-card-v4"
              whileHover={{ y: -15 }}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <div className={`eco-icon-wrapper ${item.color}`}>
                {item.icon}
              </div>
              <h3>{item.title}</h3>
              <p>{item.details}</p>
              <div className="eco-stats-badge">{item.stats}</div>
              <div className="eco-card-bg"></div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 🏫 Academic Stages - THE INTERACTIVE TABS */}
      <section className="stages-v4">
        <div className="stages-wrapper-v4 glass-heavy">
          <div className="stages-nav-v4">
            <button className={activeTab === 'primary' ? 'active' : ''} onClick={() => setActiveTab('primary')}>الأساسي</button>
            <button className={activeTab === 'highschool' ? 'active' : ''} onClick={() => setActiveTab('highschool')}>الثانوي</button>
            <button className={activeTab === 'dev' ? 'active' : ''} onClick={() => setActiveTab('dev')}>البرمجة</button>
          </div>

          <div className="stages-display-v4">
            <AnimatePresence mode="wait">
              <motion.div 
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="stage-info-card-v4"
              >
                <div className="stage-text-v4">
                  <h3>{activeTab === 'highschool' ? 'المسار الثانوي الاحترافي' : 'مسار المبدعين الصغار'}</h3>
                  <p>تغطية كاملة للمناهج الدراسية مع ربطها بسوق العمل البرمجي العالمي. لا تدرس الفيزياء فقط، بل برمج محاكي فيزياء خاص بك!</p>
                  <ul className="stage-features-v4">
                    <li><FaCheckCircle /> بنك أسئلة يضم 50,000 سؤال</li>
                    <li><FaCheckCircle /> مراجعات ليلة الامتحان بالذكاء الاصطناعي</li>
                    <li><FaCheckCircle /> شهادات معتمدة محلياً ودولياً</li>
                  </ul>
                  <button className="stage-btn-v4">استكشف المسار <FaArrowRight /></button>
                </div>
                <div className="stage-image-v4">
                  <div className="abstract-shape"></div>
                  <img src={activeTab === 'highschool' ? '/highschool.png' : '/junior.png'} alt="Stage" />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* 🏆 Leaderboard Preview - SOCIAL PROOF */}
      <section className="leaderboard-preview-v4">
        <div className="lb-header">
          <h2>قائمة <span className="highlight">العظماء</span> لهذا الأسبوع</h2>
          <p>كن من ضمن الـ 1% الأوائل واربح جوائز نقدية فورية</p>
        </div>
        <div className="lb-list-v4">
          {[
            { name: "أحمد محمد", xp: "15,400", rank: 1, img: "A" },
            { name: "سارة علي", xp: "14,200", rank: 2, img: "S" },
            { name: "محمود حسن", xp: "12,900", rank: 3, img: "M" }
          ].map((user) => (
            <div key={user.rank} className={`lb-item-v4 rank-${user.rank}`}>
              <div className="lb-rank">#{user.rank}</div>
              <div className="lb-user-img">{user.img}</div>
              <div className="lb-user-info">
                <h4>{user.name}</h4>
                <span>{user.xp} XP</span>
              </div>
              <div className="lb-badge-v4">{user.rank === 1 ? <FaCrown /> : <FaAward />}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 📩 Newsletter - THE CYBER BOX */}
      <section className="newsletter-v4">
        <div className="news-card-v4 glass-morphism">
          <div className="news-content">
            <h2>انضم إلى <span className="text-gradient">المستقبل</span></h2>
            <p>احصل على أحدث التحديثات، الدروس المجانية، وأكواد الخصم مباشرة</p>
            <div className="input-group-v4">
              <input type="email" placeholder="أدخل بريدك الإلكتروني التقني" />
              <button>اشترك الآن</button>
            </div>
          </div>
          <div className="news-visual">
            <FaRocket className="floating-rocket" />
          </div>
        </div>
      </section>

      {/* 🌌 Footer - THE FINAL IMPRESSION */}
      <footer className="footer-v4">
        <div className="footer-top-v4">
          <div className="f-col-v4 brand">
            <h3>NEBULA <small>PRO</small></h3>
            <p>نحن لا نبيع كورسات، نحن نصنع جيلاً قادراً على غزو المستقبل الرقمي بوعي وعلم وقوة تقنية.</p>
            <div className="social-row-v4">
              <FaDiscord /><FaGithub /><FaYoutube /><FaTwitter />
            </div>
          </div>
          <div className="f-col-v4">
            <h4>النظام</h4>
            <a href="#">الأمان والحماية</a>
            <a href="#">نظام المحفظة</a>
            <a href="#">قواعد البيانات</a>
            <a href="#">الذكاء الاصطناعي</a>
          </div>
          <div className="f-col-v4">
            <h4>الدعم</h4>
            <a href="#">مركز المساعدة</a>
            <a href="#">تواصل مع المعلم</a>
            <a href="#">بلاغات الغش</a>
            <a href="#">الأسئلة الشائعة</a>
          </div>
          <div className="f-col-v4">
            <h4>المكتب الرئيسي</h4>
            <p>القاهرة، مصر - مدينة نصر <br /> برج الطالب الذكي - الدور 40</p>
          </div>
        </div>
        <div className="footer-bottom-v4">
          <p>© 2026 جميع الحقوق محفوظة لشركة NEBULA TECH | صُمم بشغف للمستقبل</p>
          <div className="f-status-v4">
            <span className="online-dot"></span> الخوادم تعمل بكفاءة 100%
          </div>
        </div>
      </footer>

    </div>
  );
};

// مكونات أيقونات مفقودة لضمان التشغيل
const FaClock = () => <FaChartLine style={{transform: 'rotate(90deg)'}} />;
const FaCheckCircle = () => <div className="custom-check">✓</div>;

export default Home;
