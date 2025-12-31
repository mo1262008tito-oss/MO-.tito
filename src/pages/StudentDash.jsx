import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase'; // استيراد الربط
import { collection, onSnapshot, query, where } from 'firebase/firestore';

const StudentDash = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('my-courses');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. جلب الكورسات من Firebase
  useEffect(() => {
    // سنجلب الكورسات العامة حالياً، ويمكنك لاحقاً فلترتها لتعرض ما اشتراه الطالب فقط
    const unsubscribe = onSnapshot(collection(db, "courses"), (snapshot) => {
      const coursesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCourses(coursesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAction = (type) => {
    if(type === 'print') window.print();
    else if(type === 'tg') window.open('https://t.me/MaFa_Tec', '_blank');
    else alert(`جاري الانتقال إلى ${type}...`);
  };

  return (
    <div className="dashboard-wrapper" style={{ padding: '100px 5%', direction: 'rtl', color: '#fff' }}>
      
      {/* هيدر ترحيبي */}
      <header className="hero-dash glass-card">
        <div className="hero-content">
          <h1>مرحباً بك يا بطل 🚀</h1>
          <p>لديك {courses.length} كورسات متاحة حالياً، ابدأ رحلة التعلم!</p>
          <div className="hero-stats">
            <div className="stat-item"><span>{courses.length}</span> كورس مشترك</div>
            <div className="stat-item"><span>{auth.currentUser?.displayName || 'طالب جديد'}</span></div>
          </div>
        </div>
        <button className="upgrade-btn" onClick={() => navigate('/all-courses')}>تصفح كافة الكورسات</button>
      </header>

      {/* شريط الأزرار السريع */}
      <div className="quick-actions-bar" style={{ display: 'flex', gap: '15px', margin: '30px 0', flexWrap: 'wrap' }}>
        <button className="action-node" onClick={() => navigate('/highschool')}>🏫 ثانوي عام</button>
        <button className="action-node" onClick={() => handleAction('tg')}>💬 التليجرام</button>
        <button className="action-node special" onClick={() => alert('تم تفعيل وضع التركيز!')}>🌙 هدوء</button>
      </div>

      {/* قسم الكورسات */}
      <section className="courses-section">
        <div className="section-header">
          <h2>📚 رحلتي التعليمية</h2>
        </div>

        {loading ? (
          <p>جاري تحميل كورساتك من السحابة...</p>
        ) : (
          <div className="courses-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {courses.map(course => (
              <div key={course.id} className="course-card-premium glass-card" style={{ '--c': '#f1c40f' }}>
                <div className="course-icon">⚛️</div>
                <div className="course-info">
                  <h3>{course.name}</h3>
                  <p>المدرس: {course.instructor}</p>
                  <div className="progress-container" style={{ background: 'rgba(255,255,255,0.1)', height: '8px', borderRadius: '5px', margin: '15px 0' }}>
                    <div className="progress-bar" style={{ width: `10%`, background: '#f1c40f', height: '100%', borderRadius: '5px' }}></div>
                  </div>
                  <div className="course-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem' }}>السعر: {course.price} ج.م</span>
                    <button className="play-course-btn" onClick={() => navigate(`/course/${course.id}`)}>دخول ▶</button>
                  </div>
                </div>
              </div>
            ))}
            
            {/* كارت "أضف كورس جديد" */}
            <div className="course-card-premium glass-card add-new" onClick={() => navigate('/all-courses')} style={{ cursor: 'pointer', textAlign: 'center', border: '2px dashed #666' }}>
                <span style={{ fontSize: '3rem' }}>+</span>
                <p>استكشف المزيد</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default StudentDash;