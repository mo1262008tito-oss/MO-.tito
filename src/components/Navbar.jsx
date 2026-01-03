import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Layout, School, BookOpen, Heart, Info, Sun, Moon, 
  LogIn, Library, ShieldCheck, LogOut, GraduationCap, Sparkles
} from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import './Navbar.css';

const Navbar = ({ userData }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.body.classList.toggle('light-theme');
  };

  const handleLogout = () => {
    signOut(auth).then(() => navigate('/login'));
  };

  const links = [
    { name: 'الرئيسية', path: '/', icon: <Layout size={22}/> },
    { name: 'الثانوي', path: '/highschool', icon: <School size={22}/> },
    { name: 'المكتبة', path: '/library', icon: <Library size={22}/> },
    { name: 'الكورسات', path: '/all-courses', icon: <BookOpen size={22}/> },
    { name: 'الواحة', path: '/religious', icon: <Heart size={22}/> },
  ];

  return (
    <nav className={`super-nav ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="nav-container">
        
        {/* Logo Section */}
        <div className="nav-brand" onClick={() => navigate('/')}>
          <div className="brand-logo-3d">
            <Sparkles size={18} className="sparkle-icon" />
          </div>
          <span className="brand-name">MaFa<span>Tec</span></span>
        </div>

        {/* Desktop & Mobile Menu */}
        <div className="nav-menu-wrapper">
          <ul className="nav-links-hub">
            {links.map((link) => (
              <li key={link.path}>
                <Link to={link.path} className={`nav-link-3d ${location.pathname === link.path ? 'active' : ''}`}>
                  <i className="icon-slot">{link.icon}</i>
                  <span className="label-slot">{link.name}</span>
                </Link>
              </li>
            ))}

            {/* الطالب - تظهر دائماً للمسجلين */}
            {userData && (
              <li>
                <Link to="/student-dash" className={`nav-link-3d student-dash-link ${location.pathname === '/student-dash' ? 'active' : ''}`}>
                  <i className="icon-slot"><GraduationCap size={22} /></i>
                  <span className="label-slot">لوحتي</span>
                </Link>
              </li>
            )}

            {/* الأدمن */}
            {userData?.role === 'admin' && (
              <li>
                <Link to="/admin" className="nav-link-3d admin-slot">
                  <i className="icon-slot"><ShieldCheck size={22} /></i>
                  <span className="label-slot">الإدارة</span>
                </Link>
              </li>
            )}
          </ul>
        </div>

        {/* Actions Section */}
        <div className="nav-extra">
          <button className="theme-trigger" onClick={toggleTheme}>
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {userData ? (
            <div className="user-hub">
              <div className="user-orb" onClick={() => navigate('/student-dash')}>
                {userData.name ? userData.name[0].toUpperCase() : 'S'}
              </div>
              <button className="exit-trigger" onClick={handleLogout}>
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button className="login-trigger-3d" onClick={() => navigate('/login')}>
              <LogIn size={18} />
              <span>دخول</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;