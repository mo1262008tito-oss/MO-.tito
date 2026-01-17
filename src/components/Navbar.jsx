import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  School, BookOpen, Heart, 
  Library, ShieldCheck, LogOut, GraduationCap, 
  Sparkles, LogIn, User, Wallet 
} from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import './Navbar.css';

// استلام userData و isAdmin من ملف App.js
const Navbar = ({ userData, isAdmin }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // 1. تحديد الصفحات التي يجب أن يختفي فيها الناف بار
  const hideNavbarOn = ['/', '/login'];
  if (hideNavbarOn.includes(location.pathname)) {
    return null;
  }

  const handleLogout = () => {
    signOut(auth).then(() => {
      navigate('/login');
    }).catch((error) => {
      console.error("خطأ في تسجيل الخروج:", error);
    });
  };

  // الروابط العامة المتاحة للجميع
  const publicLinks = [
    { name: 'التعليم المنهجي', path: '/highschool', icon: <School size={20}/> },
    { name: 'المكتبة', path: '/library', icon: <Library size={20}/> },
    { name: 'الكورسات', path: '/all-courses', icon: <BookOpen size={20}/> },
    { name: 'الواحة', path: '/religious', icon: <Heart size={20}/> },
  ];

  // الروابط الخاصة بالطالب فقط
  const privateLinks = [
    { name: 'لوحة الطالب', path: '/student-dash', icon: <GraduationCap size={20} /> },
    { name: 'المحفظة', path: '/wallet', icon: <Wallet size={20} /> },
  ];

  return (
    <nav className="super-nav neon-border">
      <div className="nav-container">
        
        {/* اللوجو */}
        <div className="brand-section" onClick={() => navigate('/student-dash')}>
          <div className="logo-glow">
            <Sparkles size={20} color="#fff" />
          </div>
          <span className="brand-name">MaFa <span className="text-primary">Tec</span></span>
        </div>

        {/* قائمة الروابط المركزية */}
        <ul className="nav-hub">
          {/* عرض الروابط العامة */}
          {publicLinks.map((link) => (
            <li key={link.path}>
              <Link to={link.path} className={`nav-item-glow ${location.pathname === link.path ? 'active' : ''}`}>
                {link.icon}
                <span>{link.name}</span>
              </Link>
            </li>
          ))}

          {/* عرض الروابط الخاصة إذا كان المستخدم مسجل دخول */}
          {userData && privateLinks.map((link) => (
            <li key={link.path}>
              <Link to={link.path} className={`nav-item-glow ${location.pathname === link.path ? 'active' : ''}`}>
                {link.icon}
                <span>{link.name}</span>
              </Link>
            </li>
          ))}

          {/* لوحة الإدارة - تظهر فقط للأدمن (أنت وفتحي) بناءً على الإيميل */}
          {isAdmin && (
            <li>
              <Link to="/admin" className="nav-item-glow admin-glow">
                <ShieldCheck size={20} color="#00f2fe" />
                <span style={{color: '#00f2fe', fontWeight: 'bold'}}>الإدارة</span>
              </Link>
            </li>
          )}
        </ul>

        {/* أزرار التحكم في الحساب */}
        <div className="nav-actions">
          {userData ? (
            <div className="user-control-group">
              <div className="profile-orb" onClick={() => navigate('/student-dash')} title="الملف الشخصي">
                 <User size={20} />
              </div>
              <button className="logout-glass" onClick={handleLogout} title="تسجيل الخروج">
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <button className="login-glow-btn" onClick={() => navigate('/login')}>
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
