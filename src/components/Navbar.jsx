import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Heart, Home, BookOpen, Layout, ShieldCheck, 
  Menu, X, LogIn, Wallet, Library, GraduationCap, 
  Activity, ScrollText, Headset, Trophy
} from 'lucide-react';

// استلام userData كـ props لمنع مشاكل الـ Offline التي تظهر في الكونسول
const Navbar = ({ user, userData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isAdmin = userData?.role === 'admin';

  // الروابط العامة
  const publicLinks = [
    { name: 'الرئيسية', path: '/', icon: <Home size={18}/> },
    { name: 'الكورسات', path: '/all-courses', icon: <BookOpen size={18}/> },
    { name: 'حولنا', path: '/about', icon: <Heart size={18}/> },
  ];

  // الروابط التعليمية
  const educationLinks = [
    { name: 'التعليم المنهجي', path: '/highschool', icon: <GraduationCap size={18}/> },
    { name: 'واحة الايمان', path: '/religious', icon: <ScrollText size={18}/> },
  ];

  // روابط الخدمات (تظهر فقط للمسجلين)
  const serviceLinks = [
    { name: 'لوحة الطالب', path: '/student-dash', icon: <Layout size={18}/> },
    { name: 'المكتبة', path: '/library', icon: <Library size={18}/> },
    { name: 'المحفظة', path: '/wallet', icon: <Wallet size={18}/> },
    { name: 'الدعم الفني', path: '/supportColossus', icon: <Headset size={18}/> }, // تم التصحيح هنا
    { name: 'صفحة التكريم', path: '/hallOfLegends', icon: <Trophy size={18}/> }, // تم التصحيح هنا
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar-container" style={{ direction: 'rtl' }}>
      <div className="navbar-content">
        {/* اللوجو */}
        <Link to="/" className="navbar-logo">MaFa <span>Tac</span></Link>

        {/* الروابط لنسخة الكمبيوتر */}
        <div className="navbar-links-desktop">
          {[...publicLinks, ...educationLinks].map((link) => (
            <Link key={link.path} to={link.path} className={`nav-link ${isActive(link.path) ? 'active' : ''}`}>
              {link.icon} {link.name}
            </Link>
          ))}

          {user && serviceLinks.map((link) => (
            <Link key={link.path} to={link.path} className={`nav-link ${isActive(link.path) ? 'active' : ''}`}>
              {link.icon} {link.name}
            </Link>
          ))}

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

      {/* القائمة الجانبية للموبايل */}
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
            <Link to="/admin" onClick={() => setIsOpen(false)} className="mobile-link admin-highlight">
              <ShieldCheck size={18} /> لوحة الإدارة
            </Link>
          )}

          {!user && (
            <Link to="/login" onClick={() => setIsOpen(false)} className="mobile-link login-trigger">
              <LogIn size={18} /> تسجيل الدخول
            </Link>
          )}
        </div>
      )}

      {/* تنسيقات الـ CSS المدمجة (Scoped) */}
      <style>{`
        .navbar-container { 
          background: #0f172a; 
          padding: 0.7rem 2rem; 
          border-bottom: 1px solid rgba(255,255,255,0.08); 
          position: sticky; 
          top: 0; 
          z-index: 1000; 
          backdrop-filter: blur(10px);
        }
        .navbar-content { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          max-width: 1450px; 
          margin: 0 auto; 
        }
        .navbar-logo { 
          font-size: 1.5rem; 
          font-weight: 900; 
          color: white; 
          text-decoration: none; 
          letter-spacing: 1px;
        }
        .navbar-logo span { color: #3b82f6; }
        
        .navbar-links-desktop { display: flex; gap: 0.5rem; align-items: center; }
        
        .nav-link { 
          display: flex; 
          align-items: center; 
          gap: 6px; 
          color: #94a3b8; 
          text-decoration: none; 
          font-size: 0.85rem; 
          padding: 8px 12px; 
          border-radius: 8px; 
          transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
        }
        
        .nav-link:hover, .nav-link.active { 
          color: white; 
          background: rgba(59, 130, 246, 0.15); 
        }

        .admin-highlight { 
          color: #facc15 !important; 
          border: 1px solid rgba(250, 204, 21, 0.2); 
          background: rgba(250, 204, 21, 0.05) !important;
        }

        .login-btn-nav { 
          background: #3b82f6; 
          color: white; 
          padding: 8px 20px; 
          border-radius: 8px; 
          text-decoration: none; 
          font-size: 0.9rem; 
          font-weight: 600;
          display: flex; 
          gap: 8px; 
          margin-right: 10px;
          transition: 0.3s;
        }
        .login-btn-nav:hover { background: #2563eb; transform: translateY(-1px); }

        .mobile-menu-btn { 
          display: none; 
          background: none; 
          border: none; 
          color: white; 
          cursor: pointer;
        }

        @media (max-width: 1150px) { 
          .navbar-links-desktop { display: none; } 
          .mobile-menu-btn { display: block; } 
        }

        .mobile-menu-overlay { 
          position: absolute; 
          top: 100%; 
          right: 0; 
          left: 0; 
          background: #0f172a; 
          padding: 1.5rem; 
          display: flex; 
          flex-direction: column; 
          gap: 0.8rem; 
          border-bottom: 2px solid #3b82f6;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.3);
        }

        .mobile-link {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #cbd5e1;
          text-decoration: none;
          padding: 12px;
          border-radius: 10px;
          background: rgba(255,255,255,0.03);
        }
        
        .mobile-link.active {
          background: rgba(59, 130, 246, 0.2);
          color: #3b82f6;
        }

        .fade-in {
          animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
