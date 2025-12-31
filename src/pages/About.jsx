import React from 'react';

const About = () => {
  // روابط الصور التي أرسلتها
  const mahmoudImg = ""; // ضع رابط صورتك هنا
  const fathyImg = "https://lh3.googleusercontent.com/d/1X6v8H-m8_T5S4v7l2_8-Q_9U9U9U9U9V"; // ضع رابط صورة مستر فتحي هنا

  return (
    <div className="about-container" style={{ padding: '100px 5%', direction: 'rtl', color: '#fff' }}>
      
      {/* عنوان الصفحة بتأثير زجاجي */}
      <div className="about-header glass-card" style={{ textAlign: 'center', marginBottom: '50px', padding: '40px', border: '1px solid rgba(241, 196, 15, 0.3)' }}>
        <h1 className="glitch" style={{ color: '#f1c40f', fontSize: '2.8rem' }}>🚀 عائلة MaFa Tec</h1>
        <p style={{ fontSize: '1.2rem', color: '#ccc', marginTop: '15px', maxWidth: '800px', margin: '15px auto' }}>
          نحن لسنا مجرد منصة تعليمية، نحن حلم بدأ لدمج قوة التكنولوجيا بروعة العلم لنبني جيلاً يسبق عصره.
        </p>
      </div>

      <div className="team-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
        
        {/* كارت تعريف محمود (أنت) */}
        <div className="member-card glass-card floating">
          <div className="member-image-wrapper" style={{ textAlign: 'center', marginTop: '-50px' }}>
            <img 
              src={mahmoudImg} 
              alt="المطور محمود طه" 
              className="member-img" 
              style={{ 
                width: '150px', 
                height: '150px', 
                borderRadius: '50%', 
                border: '4px solid #9b59b6',
                boxShadow: '0 0 20px rgba(155, 89, 182, 0.5)',
                objectFit: 'cover',
                background: '#1a1a1a'
              }} 
            />
          </div>
          <div className="member-info" style={{ textAlign: 'center', padding: '20px' }}>
            <h2 style={{ color: '#9b59b6', marginTop: '10px' }}>محمود</h2>
            <h4 style={{ color: '#f1c40f', marginBottom: '15px', letterSpacing: '1px' }}>CTO | المؤسس التقني</h4>
            <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: '#ddd' }}>
              المسؤول عن البناء البرمجي للمنصة، يسعى لتحويل كل فكرة تعليمية إلى تجربة رقمية تفاعلية فريدة باستخدام أحدث لغات البرمجة.
            </p>
          </div>
        </div>

        {/* كارت تعريف مستر فتحي */}
        <div className="member-card glass-card floating" style={{ animationDelay: '0.2s' }}>
          <div className="member-image-wrapper" style={{ textAlign: 'center', marginTop: '-50px' }}>
            <img 
              src={fathyImg} 
              alt="فتحي وائل" 
              className="member-img" 
              style={{ 
                width: '150px', 
                height: '150px', 
                borderRadius: '50%', 
                border: '4px solid #f1c40f',
                boxShadow: '0 0 20px rgba(241, 196, 15, 0.5)',
                objectFit: 'cover',
                background: '#1a1a1a'
              }} 
            />
          </div>
          <div className="member-info" style={{ textAlign: 'center', padding: '20px' }}>
            <h2 style={{ color: '#9b59b6', marginTop: '10px' }}>مستر محمود فتحي</h2>
            <h4 style={{ color: '#f1c40f', marginBottom: '15px', letterSpacing: '1px' }}>الخبير التعليمي</h4>
            <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: '#ddd' }}>
              صاحب الرؤية والمادة العلمية، بخبرة سنوات في تبسيط أصعب المفاهيم العلمية، يقود الجانب الأكاديمي لإيصال الطلاب لقمة التفوق.
            </p>
          </div>
        </div>

      </div>

      {/* قسم التواصل السريع */}
      <div className="mission-box glass-card" style={{ marginTop: '50px', textAlign: 'center', padding: '30px', borderTop: '2px solid #f1c40f' }}>
        <h3 style={{ color: '#f1c40f', marginBottom: '10px' }}>🎯 رؤيتنا المشتركة</h3>
        <p style={{ fontStyle: 'italic', color: '#bbb' }}>
          "أن نمكن كل طالب من امتلاك أدوات العصر، ليكون عالماً في مجاله، ومبدعاً في فكره، ومتمسكاً بقيمه."
        </p>
      </div>

    </div>
  );
};

export default About;