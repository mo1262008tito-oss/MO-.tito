import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Heart, Home, BookOpen, Layout, ShieldCheck, 
  Menu, X, LogIn, Wallet, Library, GraduationCap, 
  Activity, BookCheck, ScrollText
} from 'lucide-react';

// استلام userData كـ props لمنع مشاكل الـ Offline التي تظهر في الكونسول
const Navbar = ({ user, userData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isAdmin = userData?.role === 'admin';

  const publicLinks = [
    { name: 'الرئيسية', path: '/', icon: <Home size={18}/> },
    { name: 'الكورسات', path: '/all-courses', icon: <BookOpen size={18}/> },
    { name: 'حولنا', path: '/about', icon: <Heart size={18}/> },
  ];

  const educationLinks = [
    { name: 'التعليم المنهجي', path: '/highschool', icon: <GraduationCap size={18}/> },
    { name: 'واحة الايمان', path: '/religious', icon: <ScrollText size={18}/> },
  ];

  const serviceLinks = [
    { name: 'لوحة الطالب', path: '/student-dash', icon: <Layout size={18}/> },
    { name: 'المكتبة', path: '/library', icon: <Library size={18}/> },
    { name: 'المحفظة', path: '/wallet', icon: <Wallet size={18}/> },

  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar-container" style={{ direction: 'rtl' }}>
      <div className="navbar-content">
        <Link to="/" className="navbar-logo">MaFa <span>Tac</span></Link>

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

          {!user && <Link to="/login" className="login-btn-nav"><LogIn size={18} /> دخول</Link>}
        </div>

        <button className="mobile-menu-btn" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isOpen && (
        <div className="mobile-menu-overlay fade-in">
          {[...publicLinks, ...educationLinks, ...(user ? serviceLinks : [])].map((link) => (
            <Link key={link.path} to={link.path} onClick={() => setIsOpen(false)} className={`mobile-link ${isActive(link.path) ? 'active' : ''}`}>
              {link.icon} {link.name}
            </Link>
          ))}
        </div>
      )}

      <style>{`
        .navbar-container { background: #0f172a; padding: 0.6rem 2rem; border-bottom: 1px solid rgba(255,255,255,0.08); position: sticky; top: 0; z-index: 1000; }
        .navbar-container::before, .navbar-container::after { display: none !important; } /* حذف الشعاع */
        .navbar-content { display: flex; justify-content: space-between; align-items: center; max-width: 1450px; margin: 0 auto; }
        .navbar-logo { font-size: 1.3rem; font-weight: 900; color: white; text-decoration: none; }
        .navbar-logo span { color: #3b82f6; }
        .navbar-links-desktop { display: flex; gap: 0.8rem; align-items: center; }
        .nav-link { display: flex; align-items: center; gap: 5px; color: #94a3b8; text-decoration: none; font-size: 0.8rem; padding: 5px 8px; border-radius: 6px; transition: 0.2s; }
        .nav-link:hover, .nav-link.active { color: white; background: rgba(59, 130, 246, 0.1); }
        .admin-highlight { color: #facc15 !important; border: 1px solid rgba(250, 204, 21, 0.3); }
        .login-btn-nav { background: #3b82f6; color: white; padding: 6px 15px; border-radius: 6px; text-decoration: none; font-size: 0.85rem; display: flex; gap: 6px; }
        .mobile-menu-btn { display: none; background: none; border: none; color: white; }
        @media (max-width: 1200px) { .navbar-links-desktop { display: none; } .mobile-menu-btn { display: block; } }
        .mobile-menu-overlay { position: absolute; top: 100%; right: 0; left: 0; background: #0f172a; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
      `}</style>
    </nav>
  );
};

export default Navbar;