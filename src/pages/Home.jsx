import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import "./Home.css";

const Home = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  // مراقبة السكرول لتغيير شكل الهيدر
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="home-universe">
      {/* 1. الهيدر العائم الذكي */}
      <nav className={`smart-nav ${scrolled ? "scrolled" : ""}`}>
        <div className="nav-container">
          <div className="logo" onClick={() => navigate("/")}>
            MAFA<span>TEC</span>
          </div>
          <div className="menu-links">
            <a href="#features">المميزات</a>
            <a href="#roadmap">خارطة الطريق</a>
            <a href="#stats">إحصائيات</a>
            <button className="login-portal" onClick={() => navigate("/login")}>
              دخول المنصة 🔐
            </button>
          </div>
        </div>
      </nav>

      {/* 2. قسم البطولة (Hero Section) */}
      <section className="hero-viewport">
        <div className="cosmic-bg"></div>
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="hero-text-content"
        >
          <span className="top-badge">مستقبل التعليم بين يديك</span>
          <h1>تعلم بذكاء.. <br/> <span>في فضاء MAFA</span></h1>
          <p>المنصة رقم #1 في الوطن العربي التي تدمج التلعيب (Gamification) بالذكاء الاصطناعي لتجعل المذاكرة مغامرة ممتعة.</p>
          <div className="hero-btns">
            <button className="glow-btn-primary" onClick={() => navigate("/login")}>ابدأ رحلتك مجاناً</button>
            <button className="outline-btn" onClick={() => navigate("/about")}>شاهد العرض التجريبي</button>
          </div>
        </motion.div>
        
        {/* عنصر 3D عائم (Placeholder لعمل توازن بصري) */}
        <div className="floating-astronaut">👨‍🚀</div>
      </section>

      {/* 3. شريط الأرقام (Stats Bar) */}
      <section id="stats" className="stats-grid">
        <div className="stat-card"><h3>+50K</h3><p>ساعة تعليمية</p></div>
        <div className="stat-card"><h3>+12K</h3><p>طالب مفعل</p></div>
        <div className="stat-card"><h3>+200</h3><p>مدرس خبير</p></div>
        <div className="stat-card"><h3>98%</h3><p>نسبة الرضا</p></div>
      </section>

      {/* 4. خريطة الطريق (The Roadmap) */}
      <section id="roadmap" className="roadmap-section">
        <h2 className="section-title">رحلتك نحو القمة 🏔️</h2>
        <div className="roadmap-container">
          <div className="road-step">
            <div className="step-num">1</div>
            <h4>انضم للمجرة</h4>
            <p>أنشئ حسابك وابدأ بتحديد اهدافك الدراسية.</p>
          </div>
          <div className="road-step">
            <div className="step-num">2</div>
            <h4>اجمع الكريستالات</h4>
            <p>كل درس تنهيه يمنحك XP ونقاط شحن حقيقية.</p>
          </div>
          <div className="road-step">
            <div className="step-num">3</div>
            <h4>تصدر الترتيب</h4>
            <p>نافس زملاءك في قائمة المتصدرين العالمية.</p>
          </div>
        </div>
      </section>

      {/* 5. قسم المميزات (Smart Features) */}
      <section id="features" className="features-showcase">
        <div className="feat-box">
          <div className="feat-icon">🤖</div>
          <h3>مساعد ذكي 24/7</h3>
          <p>ذكاء اصطناعي يجيب على أسئلتك الدراسية في ثوانٍ.</p>
        </div>
        <div className="feat-box active">
          <div className="feat-icon">💰</div>
          <h3>نظام المحفظة</h3>
          <p>اشحن رصيدك بسهولة وفعل الكورسات بضغطة زر.</p>
        </div>
        <div className="feat-box">
          <div className="feat-icon">🏆</div>
          <h3>أوسمة الشرف</h3>
          <p>احصل على أوسمة نادرة تظهر في بروفايلك أمام الجميع.</p>
        </div>
      </section>

      {/* 6. الفوتر (The Smart Footer) */}
      <footer className="cosmic-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h2>MAFA TEC</h2>
            <p>نحن نصنع جيل المبدعين القادم.</p>
          </div>
          <div className="footer-links">
            <h4>روابط سريعة</h4>
            <a href="/privacy">سياسة الخصوصية</a>
            <a href="/terms">الشروط والأحكام</a>
            <a href="/support">الدعم الفني</a>
          </div>
          <div className="footer-social">
            <h4>تابعنا على</h4>
            <div className="social-icons">
              <span>FB</span><span>TW</span><span>IG</span>
            </div>
          </div>
        </div>
        <div className="copyright">كل الحقوق محفوظة © 2026 - صمم بواسطة MO-TITO</div>
      </footer>
    </div>
  );
};

export default Home;
