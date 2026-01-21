import React from 'react';
import { motion } from 'framer-motion';
import { Github, Linkedin, Globe, Cpu, Rocket } from 'lucide-react';
import './About.css'; // تأكد من ربط الملف هنا

const About = () => {
  const mahmoudImg = "m2.png"; 
  const fathyImg = "m1.png"; 

  const cardVariants = {
    offscreen: { y: 50, opacity: 0 },
    onscreen: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", bounce: 0.4, duration: 0.8 }
    }
  };

  return (
    <div className="about-ultra-page">
      {/* جزيئات الخلفية المتحركة */}
      <div className="bg-animation">
        <div className="stars"></div>
        <div className="glowing-orb"></div>
      </div>

      <section className="hero-section">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1 }}
          className="hero-content"
        >
          <div className="tech-badge">Powered by MaFa Tec v2.0</div>
          <h1 className="main-title">نحن نصيغ <span className="gradient-text">المستقبل الرقمي</span></h1>
          <p className="hero-sub">اتحاد الخبرة الأكاديمية بالبراعة التقنية لصناعة تجربة تعليمية فريدة.</p>
        </motion.div>
      </section>

      <div className="team-container">
        {/* كارت محمود */}
        <motion.div 
          variants={cardVariants}
          initial="offscreen"
          whileInView="onscreen"
          viewport={{ once: true, amount: 0.3 }}
          className="ultra-card"
        >
          <div className="image-side">
            <div className="blob-bg"></div>
            <img src={mahmoudImg} alt="Mahmoud" className="member-img-3d" />
          </div>
          <div className="info-side">
            <div className="role-chip"><Cpu size={14}/> System Architect</div>
            <h2>محمود طه</h2>
           
            <p className="quote">"البرمجة ليست مجرد أكواد، بل هي فن حل المشكلات وتحويل الخيال إلى منصات تنبض بالحياة."</p>
            <div className="tech-stack">
              <div className="tech-item">React</div>
              <div className="tech-item">Node.js</div>
              <div className="tech-item">Firebase</div>
              <div className="tech-item">AI</div>
            </div>
            <div className="social-links">
               <Github className="s-icon" /> <Linkedin className="s-icon" /> <Globe className="s-icon" />
            </div>
          </div>
        </motion.div>

        {/* كارت مستر فتحي */}
        <motion.div 
          variants={cardVariants}
          initial="offscreen"
          whileInView="onscreen"
          viewport={{ once: true, amount: 0.3 }}
          className="ultra-card reverse"
        >
          <div className="image-side">
            <div className="blob-bg gold"></div>
            <img src={fathyImg} alt="Mr. Fathy" className="member-img-3d" />
          </div>
          <div className="info-side">
            <div className="role-chip gold"><Rocket size={14}/> Academic Director</div>
            <h2>فتحي وائل</h2>
            <p className="quote">"نبني العقول قبل المنصات، هدفنا هو خلق جيل تقني مسلح بالعلم والقدرة على الابتكار."</p>
            <div className="tech-stack">
              <div className="tech-item gold">Physics</div>
              <div className="tech-item gold">Strategy</div>
              <div className="tech-item gold">Mentorship</div>
            </div>
            <div className="social-links">
               <Linkedin className="s-icon" /> <Globe className="s-icon" />
            </div>
          </div>
        </motion.div>
      </div>

      <section className="stats-section">
        {[
          { h: "+10k", p: "سطر برمجي" },
          { h: "+500", p: "طالب متميز" },
          { h: "24/7", p: "دعم تقني" }
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <h3>{s.h}</h3>
            <p>{s.p}</p>
          </div>
        ))}
      </section>
    </div>
  );
};

export default About;