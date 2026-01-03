import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase'; // تأكد من المسار الصحيح لملف الفايربيس
import { motion } from 'framer-motion';
import { 
  Heart, BookOpen, PlayCircle, LayoutGrid, Award, 
  Settings, Users, ChevronLeft, Zap 
} from 'lucide-react';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("طالبنا المتميز");

  // جلب اسم المستخدم الحقيقي من Firebase
  useEffect(() => {
    const user = auth.currentUser;
    if (user && user.displayName) {
      setUserName(user.displayName);
    }
  }, []);

  const portals = [
    {
      id: 1,
      title: "واحة الإيمان",
      desc: "محراب رقمي متكامل للأذكار، مواقيت الصلاة، وتزكية النفس بأدوات ذكية.",
      icon: <Heart size={45} />,
      path: "/religious",
      color: "#00f2ff",
      badge: "روحانيات"
    },
    {
      id: 2,
      title: "أكاديمية MaFa",
      desc: "رحلة تعليمية في الفيزياء والبرمجيات بأسلوب تفاعلي يتجاوز الحدود.",
      icon: <PlayCircle size={45} />,
      path: "/highschool", // تم تعديله ليتوافق مع App.jsx
      color: "#ffcc00",
      badge: "تعليم"
    },
    {
      id: 3,
      title: "المكتبة الذكية",
      desc: "خزانة كنوز المعرفة الرقمية والكتب المختارة بعناية لتغذية عقلك.",
      icon: <BookOpen size={45} />,
      path: "/library",
      color: "#00ff88",
      badge: "معرفة"
    }
  ];

  return (
    <div className="modern-home">
      {/* 1. نظام العناصر العائمة */}
      <div className="ambient-background">
        <motion.div animate={{ y: [0, -20, 0] }} transition={{ duration: 5, repeat: Infinity }} className="f-icon tech-1">{"{ }"}</motion.div>
        <motion.div animate={{ y: [0, 20, 0] }} transition={{ duration: 7, repeat: Infinity }} className="f-icon deen-1">☪</motion.div>
        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 4, repeat: Infinity }} className="f-icon tech-2">JS</motion.div>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="f-icon deen-2">📖</motion.div>
      </div>

      <main className="main-content">
        {/* 2. قسم التحية الملكي */}
        <header className="hero-greeting">
          <motion.div 
            initial={{ opacity: 0, x: 50 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="greeting-text"
          >
            <div className="status-badge"><Zap size={14} /> متاح الآن للتعلم</div>
            <h1>مرحباً بك يا <span className="highlight">{userName}</span>،</h1>
            <p className="hero-msg">
              "حياك الله في رحاب MaFa Tec.. حيث يلتقي نور الإيمان بقوة التكنولوجيا لنبني معاً مستقبلاً يليق بك."
            </p>
          </motion.div>
        </header>

        {/* 3. شبكة البوابات الـ 3D */}
        <section className="portal-grid">
          {portals.map((portal) => (
            <motion.div 
              key={portal.id}
              className="portal-card-3d"
              whileHover={{ rotateY: -10, rotateX: 5, y: -10 }}
              onClick={() => navigate(portal.path)}
              style={{ '--accent': portal.color }}
            >
              <div className="card-inner">
                <div className="card-glow"></div>
                <div className="card-top">
                  <span className="p-badge">{portal.badge}</span>
                  <div className="p-icon">{portal.icon}</div>
                </div>
                <div className="card-body">
                  <h3>{portal.title}</h3>
                  <p>{portal.desc}</p>
                </div>
                <div className="card-footer">
                  <span>دخول الواحة</span>
                  <ChevronLeft size={20} className="arrow-icon" />
                </div>
              </div>
            </motion.div>
          ))}
        </section>
      </main>
    </div>
  );
};

export default Home;