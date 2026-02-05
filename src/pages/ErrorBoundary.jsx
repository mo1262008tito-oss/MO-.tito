import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // تحديث الحالة لكي تظهر واجهة الخطأ في الرندرة القادمة
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // يمكنك هنا إرسال الخطأ لخدمة مثل Sentry
    console.error("TITAN OS ERROR DETECTED:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // واجهة مستخدم مخصصة تظهر عند حدوث خطأ
      return (
        <div style={{ 
          padding: '40px', 
          backgroundColor: '#000', 
          color: '#ff4d4d', 
          height: '100vh', 
          direction: 'rtl',
          fontFamily: 'monospace'
        }}>
          <h1 style={{ borderBottom: '2px solid #ff4d4d', paddingBottom: '10px' }}>
            🚨 تم رصد انهيار في نظام تيتان
          </h1>
          <p style={{ color: '#fff', fontSize: '18px' }}>
            المشكلة غالباً في ملف: <span style={{ color: '#3b82f6' }}>{this.state.error?.message}</span>
          </p>
          <div style={{ 
            background: '#1a1a1a', 
            padding: '20px', 
            borderRadius: '10px', 
            overflowX: 'auto',
            color: '#aaa',
            fontSize: '12px'
          }}>
            <pre>{this.state.errorInfo?.componentStack}</pre>
          </div>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            إعادة تشغيل النظام
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
