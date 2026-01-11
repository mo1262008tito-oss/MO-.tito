import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase'; 
import { doc, getDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { 
  Heart, BookOpen, PlayCircle, Award, 
  ChevronLeft, Zap, Star, ShieldCheck, Sparkles
} from 'lucide-react';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("طالبنا المتميز");

  useEffect(() => {
    const fetchUser = async () => {
      const user = auth.currentUser;
      if (user) {
        // محاولة جلب الاسم من Firestore إذا لم يكن في الـ Profile
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().name) {
          setUserName(userDoc.data().name.split(' ')[0]);
        } else if (user.displayName) {
          setUserName(user.displayName.split(' ')[0]);
        }
      }
    };
    fetchUser();
  }, []);

  const portals = [
    {
      id: 1,
      title: "واحة الإيمان",
      desc: "غذاء الروح في محراب رقمي؛ أذكار، مواقيت، وتزكية نفس بلمسة تقنية.",
      icon: <Heart size={40} className="floating-icon" />,
      path: "/religious",
      color: "#00f2ff",
      badge: "تزكية"
    },
    {
      id: 2,
      title: "أكاديمية MaFa",
      desc: "هنا نصنع المبدعين.. رحلتك في الفيزياء والبرمجيات تبدأ من حيث ينتهي الآخرون.",
      icon: <PlayCircle size={40} className="floating-icon" />,
      path: "/highschool",
      color: "#ffcc00",
      badge: "احتراف"
    },
    {
      id: 3,
      title: "المكتبة الذكية",
      desc: "كنوز المعرفة بين يديك؛ كتب مختارة بعناية لتبني عقلاً ينير المستقبل.",
      icon: <BookOpen size={40} className="floating-icon" />,
      path: "/library",
      color: "#00ff88",
      badge: "ثقافة"
    }
  ];

  return (
    <div className="modern-home rtl">
      {/* عناصر الخلفية المتحركة */}
      <div className="cosmic-bg">
        <div className="nebula-1"></div>
        <div className="nebula-2"></div>
      </div>

      <main className="main-content">
        {/* قسم الترحيب الملكي */}
        <header className="hero-section">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="hero-card glass"
          >
            <div className="welcome-tag">
              <Sparkles size={16} /> منصتك المتكاملة
            </div>
            <h1>مرحباً بك يا <span className="name-gradient">{userName}</span></h1>
            
            {/* الرسالة التعريفية القوية */}
            <div className="manifesto">
              <p className="primary-msg">
                "نحن لا نقدم مجرد دروس، بل نبني <strong>جيلاً متزناً</strong> يمتلك ناصية العلم في يد، ونور الإيمان في القلب."
              </p>
              <div className="separator"></div>
              <p className="secondary-msg">
                في <strong>MaFa Tec</strong>، نؤمن أن التكنولوجيا وجدت لخدمة الروح والعقل معاً. اكتشف بواباتنا الذكية وابدأ رحلة التغيير الآن.
              </p>
            </div>

            <div className="hero-features">
              <span><ShieldCheck size={16}/> أمان تعليمي</span>
              <span><Award size={16}/> شهادات معتمدة</span>
              <span><Star size={16}/> دعم مستمر</span>
            </div>
          </motion.div>
        </header>

        {/* شبكة البوابات */}
        <section className="portal-grid">
          {portals.map((portal, idx) => (
            <motion.div 
              key={portal.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="portal-box"
              onClick={() => navigate(portal.path)}
              style={{ '--accent': portal.color }}
            >
              <div className="box-inner glass">
                <div className="box-top">
                  <div className="icon-wrapper" style={{ background: portal.color + '22' }}>
                    {portal.icon}
                  </div>
                  <span className="box-badge">{portal.badge}</span>
                </div>
                <h3>{portal.title}</h3>
                <p>{portal.desc}</p>
                <div className="box-action">
                  استكشف الآن <ChevronLeft size={18} />
                </div>
              </div>
            </motion.div>
          ))}
        </section>

        {/* تذييل الصفحة برسالة قصيرة */}
        <footer className="home-footer">
          <p>بني بكل ❤️ ليكون منارتك نحو القمة | <b>MaFa Tec 2026</b></p>
        </footer>
      </main>
    </div>
  );
};

export default Home;
