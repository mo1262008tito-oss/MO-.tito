import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore';

const AllCourses = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('الكل');
  const [availableCourses, setAvailableCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. جلب الكورسات الحقيقية من قاعدة البيانات
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "courses"), (snapshot) => {
      const coursesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAvailableCourses(coursesData);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // 2. تصفية الكورسات
  const filteredCourses = availableCourses.filter(course => 
    (filter === 'الكل' || course.category === filter) &&
    (course.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     course.instructor.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // 3. دالة التسجيل في كورس (ربط الكورس بحساب الطالب)
  const handleEnroll = async (courseId, courseName) => {
    const user = auth.currentUser;
    if (!user) {
      alert("يرجى تسجيل الدخول أولاً للالتحاق بالكورسات");
      return navigate('/login');
    }

    try {
      const userRef = doc(db, "users", user.uid);
      // إضافة معرف الكورس إلى مصفوفة الكورسات الخاصة بالطالب في Firestore
      await updateDoc(userRef, {
        enrolledCourses: arrayUnion(courseId)
      });
      
      alert(`✅ تم الاشتراك في كورس "${courseName}" بنجاح!`);
      navigate('/student-dash');
    } catch (error) {
      console.error("Error enrolling:", error);
      alert("حدث خطأ أثناء الاشتراك، ربما تحتاج لتفعيل حسابك أولاً.");
    }
  };

  if (loading) return <div className="loader">جاري فتح المكتبة...</div>;

  return (
    <div style={{ padding: '100px 5%', direction: 'rtl', color: '#fff' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 className="glitch" style={{ fontSize: '2.5rem', color: '#f1c40f' }}>🚀 مكتبة MaFa Tec</h1>
        <p style={{ color: '#ccc' }}>استكشف المحتوى التعليمي وابدأ في بناء مستقبلك الآن</p>
      </div>

      {/* شريط البحث والفلترة */}
      <div className="glass-card" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', padding: '20px', marginBottom: '30px', alignItems: 'center', justifyContent: 'space-between' }}>
        <input 
          type="text" 
          placeholder="ابحث عن مادة أو مدرس..." 
          className="search-input"
          style={{ flex: 1, minWidth: '250px' }}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {['الكل', 'علمي', 'أدبي', 'لغات'].map(cat => (
            <button 
              key={cat} 
              className={`filter-btn ${filter === cat ? 'active' : ''}`}
              style={{
                padding: '8px 20px',
                borderRadius: '20px',
                border: '1px solid #f1c40f',
                background: filter === cat ? '#f1c40f' : 'transparent',
                color: filter === cat ? '#000' : '#fff',
                cursor: 'pointer'
              }}
              onClick={() => setFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* شبكة الكورسات */}
      <div className="courses-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px' }}>
        {filteredCourses.map(course => (
          <div key={course.id} className="all-course-card glass-card hover-up" style={{ position: 'relative', padding: '20px' }}>
            <div className="card-badge" style={{ position: 'absolute', top: '10px', right: '10px', background: '#f1c40f', color: '#000', padding: '2px 10px', borderRadius: '10px', fontSize: '0.7rem' }}>
              {course.category || 'عام'}
            </div>
            <div className="course-main-icon" style={{ fontSize: '3rem', textAlign: 'center', margin: '20px 0' }}>
              {course.category === 'علمي' ? '🧪' : course.category === 'لغات' ? '🌍' : '📚'}
            </div>
            <h3 style={{ marginBottom: '10px' }}>{course.name}</h3>
            <p style={{ color: '#aaa', fontSize: '0.9rem' }}>👨‍🏫 {course.instructor}</p>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '15px 0', fontSize: '0.8rem', color: '#f1c40f' }}>
              <span>⭐ 4.9</span>
              <span>👥 متاح للجميع</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px' }}>
              <span style={{ color: '#2ecc71', fontWeight: 'bold' }}>{course.price} ج.م</span>
              <button 
                className="enroll-btn" 
                style={{ 
                  background: '#f1c40f', 
                  color: '#000', 
                  border: 'none', 
                  padding: '8px 15px', 
                  borderRadius: '5px', 
                  fontWeight: 'bold', 
                  cursor: 'pointer' 
                }}
                onClick={() => handleEnroll(course.id, course.name)}
              >
                إضافة للمكتبة +
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {filteredCourses.length === 0 && (
        <div style={{ textAlign: 'center', marginTop: '50px', opacity: 0.5 }}>
          <p>لا توجد نتائج تطابق بحثك حالياً..</p>
        </div>
      )}
    </div>
  );
};

export default AllCourses;