import React, { useState } from 'react';

const Religious = () => {
  const [activeModal, setActiveModal] = useState(null);
  const [khatmaDays, setKhatmaDays] = useState(30);

  // دالة لحساب ورد اليوم بناءً على عدد الأيام
  const calculateKhatma = () => {
    const pages = 604;
    const dailyPages = Math.ceil(pages / khatmaDays);
    const parts = (dailyPages / 20).toFixed(1);
    return { dailyPages, parts };
  };

  const { dailyPages, parts } = calculateKhatma();

  return (
    <div className="religious-container" style={{ padding: '40px 5%', direction: 'rtl', color: '#fff' }}>
      
      <div className="about-header glass-card" style={{ textAlign: 'center', marginBottom: '40px', padding: '30px' }}>
        <h1 style={{ color: '#f1c40f' }}>🌙 الواحة الإيمانية</h1>
        <p>كل ما تحتاجه لغذائك الروحي في مكان واحد</p>
      </div>

      <div className="team-grid">
        {/* زر المصحف الإلكتروني */}
        <div className="member-card glass-card floating" onClick={() => setActiveModal('quran')}>
          <div style={{ fontSize: '50px' }}>📖</div>
          <h3>المصحف الإلكتروني</h3>
          <p>تصفح القرآن الكريم كاملاً بتصميم مريح للعين</p>
          <button className="login-btn-3d" style={{ marginTop: '10px' }}>فتح المصحف</button>
        </div>

        {/* زر الأذكار والأدعية */}
        <div className="member-card glass-card floating" onClick={() => setActiveModal('azkar')}>
          <div style={{ fontSize: '50px' }}>📿</div>
          <h3>الأذكار والأدعية</h3>
          <p>أذكار الصباح والمساء وأدعية مختارة</p>
          <button className="login-btn-3d" style={{ marginTop: '10px' }}>اقرأ الآن</button>
        </div>

        {/* زر موعظة اليوم */}
        <div className="member-card glass-card floating" onClick={() => setActiveModal('advice')}>
          <div style={{ fontSize: '50px' }}>💡</div>
          <h3>موعظة اليوم</h3>
          <p>رسالة يومية متجددة لتعزيز إيمانك</p>
          <button className="login-btn-3d" style={{ marginTop: '10px' }}>مشاهدة الموعظة</button>
        </div>
      </div>

      {/* حاسبة ختم القرآن التفاعلية */}
      <div className="mission-box glass-card" style={{ marginTop: '40px', padding: '30px' }}>
        <h2 style={{ color: '#f1c40f' }}>📅 خطة ختم القرآن التفاعلية</h2>
        <p>حدد عدد الأيام التي تريد الختم فيها:</p>
        
        <div style={{ margin: '20px 0' }}>
          <input 
            type="range" min="3" max="60" value={khatmaDays} 
            onChange={(e) => setKhatmaDays(e.target.value)}
            style={{ width: '80%', cursor: 'pointer' }}
          />
          <h3 style={{ color: '#9b59b6' }}>الختم خلال: {khatmaDays} يوم</h3>
        </div>

        <div className="khatma-result" style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '15px' }}>
          <p>لتحقيق هدفك، تحتاج لقراءة:</p>
          <h2 style={{ color: '#2ecc71' }}>{dailyPages} صفحة يومياً</h2>
          <span style={{ color: '#ccc' }}>(ما يعادل {parts} جزء تقريباً)</span>
        </div>
      </div>

      {/* --- النوافذ المنبثقة (Modals) --- */}
      {activeModal && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)} style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <div className="glass-card" onClick={(e) => e.stopPropagation()} style={{
            width: '90%', maxWidth: '600px', padding: '40px', textAlign: 'center', border: '1px solid #f1c40f'
          }}>
            <button onClick={() => setActiveModal(null)} style={{ float: 'left', background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            
            {activeModal === 'quran' && (
              <div>
                <h2>📖 المصحف الإلكتروني</h2>
                <p style={{ marginTop: '20px' }}>يتم الآن تحميل المكتبة القرآنية... يمكنك قريباً القراءة مباشرة من هنا.</p>
              </div>
            )}

            {activeModal === 'azkar' && (
              <div>
                <h2>📿 أذكار الصباح</h2>
                <p style={{ fontSize: '1.2rem', marginTop: '20px' }}>"أصبحنا وأصبح الملك لله والحمد لله، لا إله إلا الله وحده لا شريك له..."</p>
                <button className="login-btn-3d" style={{ marginTop: '20px' }}>الذكر التالي</button>
              </div>
            )}

            {activeModal === 'advice' && (
              <div>
                <h2>💡 موعظة اليوم</h2>
                <div style={{ padding: '20px', fontStyle: 'italic', fontSize: '1.3rem' }}>
                  "كن مع الله ولا تبالي، فمن وجد الله فماذا فقد؟ ومن فقد الله فماذا وجد؟"
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Religious;