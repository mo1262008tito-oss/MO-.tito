import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Home, School, BookOpen, Heart, Info, 
  Library, ShieldCheck, LogOut, GraduationCap, 
  Sparkles, LogIn, User
} from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import './Navbar.css';

const Navbar = ({ userData }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    signOut(auth).then(() => navigate('/login'));
  };

  // 1. قائمة الروابط للجميع
  const publicLinks = [
    { name: 'الرئيسية', path: '/', icon: <Home size={22}/> },
    { name: 'الثانوي', path: '/highschool', icon: <School size={22}/> },
    { name: 'المكتبة', path: '/library', icon: <Library size={22}/> },
    { name: 'الكورسات', path: '/all-courses', icon: <BookOpen size={22}/> },
    { name: 'الواحة', path: '/religious', icon: <Heart size={22}/> },
    { name: 'حولنا', path: '/about', icon: <Info size={22}/> },
  ];

  return (
    <nav className="super-nav">
      <div className="nav-container">
        
        {/* Logo Section */}
        <div className="brand-section" onClick={() => navigate('/')}>
          <div className="logo-cube">
            <Sparkles size={18} color="#fff" />
          </div>
          <span className="brand-name">MaFa <span style={{color: 'var(--primary)'}}>Tec</span></span>
        </div>

        {/* Navigation Hub */}
        <ul className="nav-hub">
          {publicLinks.map((link) => (
            <li key={link.path}>
              <Link to={link.path} className={`nav-item-3d ${location.pathname === link.path ? 'active' : ''}`}>
                <i>{link.icon}</i>
                <span>{link.name}</span>
              </Link>
            </li>
          ))}

          {/* لوحة الطالب - تظهر فقط للمسجلين */}
          {userData && (
            <li>
              <Link to="/student-dash" className={`nav-item-3d ${location.pathname === '/student-dash' ? 'active' : ''}`}>
                <i><GraduationCap size={22} /></i>
                <span>لوحتي</span>
              </Link>
            </li>
          )}

          {/* الإدارة - تظهر فقط للأدمن ومخفية تماماً عن غيره */}
          {userData?.role === 'admin' && (
            <li>
              <Link to="/admin" className={`nav-item-3d admin-link ${location.pathname === '/admin' ? 'active' : ''}`}>
                <i><ShieldCheck size={22} /></i>
                <span>الإدارة</span>
              </Link>
            </li>
          )}
        </ul>

        {/* Profile & Login Section */}
        <div className="nav-actions">
          {userData ? (
            <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
              <div className="profile-orb" onClick={() => navigate('/student-dash')}>
                 <User size={20} color="var(--primary)" />
              </div>
              <button className="exit-trigger" onClick={handleLogout} style={{background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer'}}>
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <button className="login-btn-3d" onClick={() => navigate('/login')}>
              <LogIn size={18} />
              <span className="login-text">دخول</span>
            </button>
          )}
        </div>

      </div>
    </nav>
  );
};

export default Navbar;
