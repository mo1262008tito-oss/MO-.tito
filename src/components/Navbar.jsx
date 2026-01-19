import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, Home, BookOpen, Info, Menu, X } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // مصفوفة الروابط العامة
  const publicLinks = [
    { name: 'الرئيسية', path: '/', icon: <Home size={20}/> },
    { name: 'الكورسات', path: '/courses', icon: <BookOpen size={20}/> },
    { name: 'حولنا', path: '/about', icon: <Heart size={20}/> },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar-container" style={{ direction: 'rtl' }}>
      <div className="navbar-content">
        {/* شعار الموقع */}
        <Link to="/" className="navbar-logo">
          TITAN <span>EDU</span>
        </Link>

        {/* الروابط للشاشات الكبيرة */}
        <div className="navbar-links-desktop">
          {publicLinks.map((link) => (
            <Link 
              key={link.path} 
              to={link.path} 
              className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
            >
              {link.icon}
              {link.name}
            </Link>
          ))}
        </div>

        {/* زر الموبايل */}
        <button className="mobile-menu-btn" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* قائمة الموبايل */}
      {isOpen && (
        <div className="mobile-menu-overlay fade-in">
          {publicLinks.map((link) => (
            <Link 
              key={link.path} 
              to={link.path} 
              onClick={() => setIsOpen(false)}
              className={`mobile-link ${isActive(link.path) ? 'active' : ''}`}
            >
              {link.icon}
              {link.name}
            </Link>
          ))}
        </div>
      )}

      <style>{`
        .navbar-container {
          background: #1e293b;
          padding: 1rem 2rem;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          position: sticky;
          top: 0;
          z-index: 1000;
        }
        .navbar-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 1200px;
          margin: 0 auto;
        }
        .navbar-logo {
          font-size: 1.5rem;
          font-weight: bold;
          color: white;
          text-decoration: none;
        }
        .navbar-logo span { color: #3b82f6; }
        .navbar-links-desktop { display: flex; gap: 2rem; }
        .nav-link {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #94a3b8;
          text-decoration: none;
          transition: 0.3s;
        }
        .nav-link:hover, .nav-link.active { color: #3b82f6; }
        .mobile-menu-btn {
          display: none;
          background: none;
          border: none;
          color: white;
          cursor: pointer;
        }
        @media (max-width: 768px) {
          .navbar-links-desktop { display: none; }
          .mobile-menu-btn { display: block; }
        }
        .mobile-menu-overlay {
          position: absolute;
          top: 100%;
          right: 0;
          left: 0;
          background: #1e293b;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          border-bottom: 2px solid #3b82f6;
        }
      `}</style>
    </nav>
  );
};

export default Navbar;



