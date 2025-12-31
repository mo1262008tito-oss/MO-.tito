import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // تغيير شكل الناف بار عند التمرير
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMenu = () => setIsOpen(false);

  return (
    <nav className={`nav-3d-wrapper ${scrolled ? 'nav-sticky' : ''}`}>
      <div className="nav-container-3d">
        
        {/* اللوجو بتأثير نيون وبارز */}
        <div className="logo-3d" onClick={() => { navigate('/'); closeMenu(); }}>
          <div className="logo-box">
            <span className="rocket">🚀</span>
            <span className="text">MaFa <span className="highlight">Tec</span></span>
          </div>
        </div>

        {/* الروابط بتأثير التنشيط الديناميكي */}
        <ul className={`nav-menu-3d ${isOpen ? 'mobile-open' : ''}`}>
          {[
            { name: 'الرئيسية', path: '/', icon: '🏠' },
            { name: 'لوحة الطالب', path: '/student-dash', icon: '📊' },
            { name: 'الثانوي العام', path: '/highschool', icon: '🏫' },
            { name: 'المكتبة', path: '/all-courses', icon: '📚' },
            { name: 'واحة الإيمان', path: '/religious', icon: '🌙' },
            { name: 'عن المنصة', path: '/about', icon: '✨' },
          ].map((link) => (
            <li key={link.path}>
              <Link 
                to={link.path} 
                onClick={closeMenu}
                className={location.pathname === link.path ? 'active-link' : ''}
              >
                <span className="link-icon">{link.icon}</span>
                {link.name}
              </Link>
            </li>
          ))}
        </ul>

        <div className="nav-btns-3d">
          <button className="btn-login-3d" onClick={() => navigate('/login')}>
            <span className="btn-text">دخول الطالب</span>
            <div className="btn-glow"></div>
          </button>
          
          <div className={`hamburger-3d ${isOpen ? 'is-active' : ''}`} onClick={() => setIsOpen(!isOpen)}>
            <span></span><span></span><span></span>
          </div>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;