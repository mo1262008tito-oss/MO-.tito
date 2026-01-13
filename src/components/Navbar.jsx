import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Home, School, BookOpen, Heart, Info, 
  Library, ShieldCheck, LogOut, GraduationCap, 
  Sparkles, LogIn, User, Wallet, MapPin 
} from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import './Navbar.css';

const Navbar = ({ userData }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // وظيفة تسجيل الخروج
  const handleLogout = () => {
    signOut(auth).then(() => {
      navigate('/login');
    }).catch((error) => {
      console.error("خطأ في تسجيل الخروج:", error);
    });
  };

  // 1. روابط متاحة للجميع (تظهر دائماً)
  const publicLinks = [
    { name: 'الرئيسية', path: '/', icon: <Home size={20}/> },
    { name: 'التعليم المنهجي', path: '/highschool', icon: <School size={20}/> },
    { name: 'المكتبة', path: '/library', icon: <Library size={20}/> },
    { name: 'الكورسات', path: '/all-courses', icon: <BookOpen size={20}/> },
    { name: 'الواحة', path: '/religious', icon: <Heart size={20}/> },
    { name: 'حولنا', path: '/about', icon: <Info size={20}/> },
  ];

  // 2. روابط "خاصة" (لا تظهر إلا بعد تسجيل الدخول)
  const privateLinks = [
    { name: 'لوحة الطالب', path: '/student-dash', icon: <GraduationCap size={20} /> },
    { name: 'المحفظة', path: '/wallet', icon: <Wallet size={20} /> },
    { name: 'أماكن تواجدنا', path: '/locations', icon: <MapPin size={20} /> },
  ];

  // منع ظهور الناف بار في صفحة الإدارة تماماً كما طلبت
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <nav className="super-nav">
      <div className="nav-container">
        
        {/* القسم الأيمن: اللوجو */}
        <div className="brand-section" onClick={() => navigate('/')}>
          <div className="logo-cube">
            <Sparkles size={18} color="#fff" />
          </div>
          <span className="brand-name">MaFa <span className="text-primary">Tec</span></span>
        </div>

        {/* القسم الأوسط: روابط التنقل */}
        <ul className="nav-hub">
          {/* الروابط العامة */}
          {publicLinks.map((link) => (
            <li key={link.path}>
              <Link to={link.path} className={`nav-item-3d ${location.pathname === link.path ? 'active' : ''}`}>
                <i>{link.icon}</i>
                <span>{link.name}</span>
              </Link>
            </li>
          ))}

          {/* روابط الطالب (تظهر فقط إذا كان مسجل دخول) */}
          {userData && privateLinks.map((link) => (
            <li key={link.path}>
              <Link to={link.path} className={`nav-item-3d ${location.pathname === link.path ? 'active' : ''}`}>
                <i>{link.icon}</i>
                <span>{link.name}</span>
              </Link>
            </li>
          ))}

          {/* رابط الإدارة (يظهر فقط للأدمن) */}
          {userData?.role === 'admin' && (
            <li>
              <Link to="/admin" className={`nav-item-3d admin-link ${location.pathname === '/admin' ? 'active' : ''}`}>
                <i><ShieldCheck size={20} /></i>
                <span>الإدارة</span>
              </Link>
            </li>
          )}
        </ul>

        {/* القسم الأيسر: الملف الشخصي وزر الدخول */}
        <div className="nav-actions">
          {userData ? (
            <div className="user-control-group">
              {/* عرض النقاط بشكل جمالي */}
              <div className="xp-tag">
                 <Sparkles size={14} className="gold-icon" />
                 <span>{userData.points || 0} XP</span>
              </div>
              
              {/* أيقونة الملف الشخصي */}
              <div className="profile-orb" onClick={() => navigate('/student-dash')} title="حسابي">
                 <User size={20} />
              </div>

              {/* زر تسجيل الخروج */}
              <button className="logout-btn" onClick={handleLogout} title="خروج">
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            /* زر تسجيل الدخول (يظهر فقط للزوار) */
            <button className="login-action-btn" onClick={() => navigate('/login')}>
              <LogIn size={18} />
              <span>دخول الطالب</span>
            </button>
          )}
        </div>

      </div>
    </nav>
  );
};

export default Navbar;
