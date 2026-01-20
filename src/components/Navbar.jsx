import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Heart, Home, BookOpen, Layout, ShieldCheck, 
  Menu, X, LogIn, Wallet, Library, GraduationCap, 
  Compass, Activity, BookCheck, ScrollText, Info
} from 'lucide-react';
import { auth, db } from '../firebase'; 
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'students', currentUser.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // 1. روابط عامة (تطابق: Home.jsx, AllCourses.jsx, About.jsx)
  const publicLinks = [
    { name: 'الرئيسية', path: '/', icon: <Home size={18}/> },
    { name: 'الكورسات', path: '/courses', icon: <BookOpen size={18}/> },
    { name: 'حولنا', path: '/about', icon: <Heart size={18}/> },
  ];

  // 2. روابط التعليم (تطابق: HighSchool.jsx, Religious.jsx)
  const educationLinks = [
    { name: 'االتعليم المنهجي', path: '/high-school', icon: <GraduationCap size={18}/> },
    { name: 'التعليم الديني', path: '/religious', icon: <ScrollText size={18}/> },
  ];

  // 3. روابط الخدمات (تطابق: StudentDash.jsx, Wallet.jsx, Library.jsx, ActivationPage.jsx, QuizSystem.jsx)
  const serviceLinks = [
    { name: 'لوحة الطالب', path: '/dashboard', icon: <Layout size={18}/> },
    { name: 'المكتبة', path: '/library', icon: <Library size={18}/> },
    { name: 'المحفظة', path: '/wallet', icon: <Wallet size={18}/> },
    { name: 'الاختبارات', path: '/quizzes', icon: <BookCheck size={18}/> },
    { name: 'شحن الرصيد', path: '/activate', icon: <Activity size={18}/> },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar-container" style={{ direction: 'rtl' }}>
      <div className="navbar-content">
        <Link to="/" className="navbar-logo">
          TITAN <span>EDU</span>
        </Link>

        {/* --- روابط الكمبيوتر (Desktop) --- */}
        <div className="navbar-links-desktop">
          {/* الروابط العامة والتعليم */}
          {[...publicLinks, ...educationLinks].map((link) => (
            <Link key={link.path} to={link.path} className={`nav-link ${isActive(link.path) ? 'active' : ''}`}>
              {link.icon} {link.name}
            </Link>
          ))}

          {/* روابط الخدمات (تظهر للمسجلين فقط) */}
          {user && serviceLinks.map((link) => (
            <Link key={link.path} to={link.path} className={`nav-link ${isActive(link.path) ? 'active' : ''}`}>
              {link.icon} {link.name}
            </Link>
          ))}

          {/* الإدارة (تطابق: AdminDash.jsx) */}
          {isAdmin && (
            <Link to="/admin" className="nav-link admin-highlight">
              <ShieldCheck size={18} /> لوحة الإدارة
            </Link>
          )}

          {!user && (
            <Link to="/login" className="login-btn-nav">
              <LogIn size={18} /> دخول
            </Link>
          )}
        </div>

        {/* زر القائمة للموبايل */}
        <button className="mobile-menu-btn" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* --- قائمة الموبايل --- */}
      {isOpen && (
        <div className="mobile-menu-overlay fade-in">
          {[...publicLinks, ...educationLinks, ...(user ? serviceLinks : [])].map((link) => (
            <Link 
              key={link.path} 
              to={link.path} 
              onClick={() => setIsOpen(false)}
              className={`mobile-link ${isActive(link.path) ? 'active' : ''}`}
            >
              {link.icon} {link.name}
            </Link>
          ))}
          
          {isAdmin && (
            <Link to="/admin" onClick={() => setIsOpen(false)} className="mobile-link admin-text">
              <ShieldCheck size={18} /> لوحة الإدارة
            </Link>
          )}

          {!user && (
            <Link to="/login" onClick={() => setIsOpen(false)} className="mobile-link login-text">
              <LogIn size={18} /> تسجيل الدخول
            </Link>
          )}
        </div>
      )}

      <style>{`
        .navbar-container { background: #0f172a; padding: 0.6rem 2rem; border-bottom: 1px solid rgba(255,255,255,0.08); position: sticky; top: 0; z-index: 1000; }
        .navbar-content { display: flex; justify-content: space-between; align-items: center; max-width: 1450px; margin: 0 auto; }
        .navbar-logo { font-size: 1.3rem; font-weight: 900; color: white; text-decoration: none; }
        .navbar-logo span { color: #3b82f6; }
        .navbar-links-desktop { display: flex; gap: 0.8rem; align-items: center; }
        .nav-link { display: flex; align-items: center; gap: 5px; color: #94a3b8; text-decoration: none; font-size: 0.8rem; padding: 5px 8px; border-radius: 6px; transition: 0.2s; }
        .nav-link:hover, .nav-link.active { color: white; background: rgba(59, 130, 246, 0.1); }
        .admin-highlight { color: #facc15 !important; border: 1px solid rgba(250, 204, 21, 0.3); }
        .login-btn-nav { background: #3b82f6; color: white; padding: 6px 15px; border-radius: 6px; text-decoration: none; font-size: 0.85rem; display: flex; gap: 6px; margin-right: 10px; }
        .mobile-menu-btn { display: none; background: none; border: none; color: white; }
        @media (max-width: 1200px) { .navbar-links-desktop { display: none; } .mobile-menu-btn { display: block; } }
        .mobile-menu-overlay { position: absolute; top: 100%; right: 0; left: 0; background: #0f172a; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; border-bottom: 3px solid #3b82f6; }
        .mobile-link { display: flex; align-items: center; gap: 10px; color: #cbd5e1; text-decoration: none; font-size: 1rem; }
        .admin-text { color: #facc15; }
      `}</style>
    </nav>
  );
};

export default Navbar;

