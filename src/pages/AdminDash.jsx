import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, BookOpen, FileText, Bell, ShieldCheck, Smartphone, 
  DollarSign, Settings, Plus, Trash2, Save, X, Zap, Search, 
  Download, Star, ImageIcon, Play, PlusCircle, CheckCircle, 
  AlertCircle, LogOut, Layout, UserPlus, HelpCircle, TrendingUp,
  ShieldAlert, ShoppingBag, MapPin, BarChart3
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

// --- المكون الرئيسي للوحة التحكم ---
const AdminDash = () => {
  // 1. القائمة الجانبية والحالات العامة
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusNotification, setStatusNotification] = useState(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // 2. بيانات الأنظمة (إحصائيات افتراضية)
  const [users] = useState([
    { id: 1, name: "ياسين علي", email: "yassin@tito.com", isBanned: false, status: 'نشط' },
    { id: 2, name: "أحمد محمد", email: "ahmed@tito.com", isBanned: true, status: 'محظور' },
  ]);

  const [courseForm, setCourseForm] = useState({
    title: '', price: '', category: 'الفيزياء', teacher: '', books: []
  });

  const chartData = [
    { day: 'السبت', sales: 4000, students: 240 },
    { day: 'الأحد', sales: 3000, students: 139 },
    { day: 'الاثنين', sales: 9000, students: 980 },
    { day: 'الثلاثاء', sales: 3908, students: 390 },
    { day: 'الأربعاء', sales: 4800, students: 480 },
    { day: 'الخميس', sales: 7000, students: 380 },
    { day: 'الجمعة', sales: 5000, students: 430 },
  ];

  // 3. الدوال البرمجية (Handlers)
  const triggerToast = (message, type) => {
    setStatusNotification({ message, type });
    setTimeout(() => setStatusNotification(null), 3000);
  };

  const handleAction = (taskName) => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      triggerToast(`تم تنفيذ ${taskName} بنجاح`, "success");
    }, 1000);
  };

  const calculateTotalRevenue = useMemo(() => {
    return users.length * 150 * 0.9; // افتراض أرباح
  }, [users]);

  // --- واجهة المستخدم ---
  return (
    <div className="admin-root-container" dir="rtl" style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'sans-serif' }}>
      
      {/* القائمة الجانبية المتقدمة */}
      <aside className="admin-sidebar" style={{ width: '280px', background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)', color: 'white', padding: '25px', position: 'sticky', top: 0, height: '100vh' }}>
        <div className="logo-section" style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '40px' }}>
          <div style={{ background: '#3b82f6', width: '45px', height: '45px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '22px' }}>T</div>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px' }}>تيتو أكاديمي</h3>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>لوحة التحكم الذكية v4.2</span>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { id: 'dashboard', label: 'الإحصائيات العامة', icon: <Layout size={20}/> },
            { id: 'courses', label: 'إدارة الكورسات', icon: <BookOpen size={20}/> },
            { id: 'users', label: 'شؤون الطلاب', icon: <Users size={20}/> },
            { id: 'exams', label: 'بنك الامتحانات', icon: <FileText size={20}/> },
            { id: 'finance', label: 'التقارير المالية', icon: <DollarSign size={20}/> },
            { id: 'support', label: 'الدعم الفني', icon: <HelpCircle size={20}/> },
            { id: 'security', label: 'الأمان والحماية', icon: <ShieldCheck size={20}/> },
            { id: 'store', label: 'المتجر والكتب', icon: <ShoppingBag size={20}/> },
            { id: 'settings', label: 'إعدادات المنصة', icon: <Settings size={20}/> }
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', borderRadius: '12px', border: 'none', 
                background: activeTab === item.id ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                color: activeTab === item.id ? '#60a5fa' : '#94a3b8', 
                cursor: 'pointer', textAlign: 'right', transition: '0.3s'
              }}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '15px', fontSize: '13px' }}>
          <p style={{ color: '#94a3b8', marginBottom: '10px' }}>حالة السيرفر: <span style={{ color: '#10b981' }}>مستقر</span></p>
          <button style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', background: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
            <LogOut size={16}/> تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* منطقة المحتوى الرئيسي */}
      <main className="main-layout" style={{ flex: 1, padding: '35px', overflowY: 'auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}>
          <div style={{ position: 'relative', width: '450px' }}>
            <Search style={{ position: 'absolute', right: '15px', top: '12px', color: '#64748b' }} size={20}/>
            <input 
              type="text" 
              placeholder="ابحث عن طالب، كود، أو معاملة مالية..." 
              style={{ width: '100%', padding: '12px 45px 12px 15px', borderRadius: '14px', border: '1px solid #e2e8f0', outline: 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ position: 'relative', cursor: 'pointer' }}>
              <Bell size={24} color="#64748b"/>
              <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '10px' }}>5</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'white', padding: '8px 15px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ textAlign: 'left' }}>
                <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>أ/ تيتو</p>
                <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>المدير التنفيذي</p>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#3b82f6' }}></div>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          
          {/* --- قسم الإحصائيات (Dashboard) --- */}
          {activeTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '25px', marginBottom: '35px' }}>
                {[
                  { label: 'إجمالي الطلاب', value: users.length, color: '#6366f1', icon: <Users/> },
                  { label: 'أرباح اليوم', value: '4,250 ج.م', color: '#10b981', icon: <DollarSign/> },
                  { label: 'مبيعات الأكواد', value: '1,120', color: '#f59e0b', icon: <Zap/> },
                  { label: 'ساعات المشاهدة', value: '14,500', color: '#3b82f6', icon: <Play/> }
                ].map((stat, i) => (
                  <div key={i} style={{ background: 'white', padding: '25px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '8px' }}>{stat.label}</p>
                      <h2 style={{ fontSize: '28px', margin: 0 }}>{stat.value}</h2>
                    </div>
                    <div style={{ padding: '12px', background: `${stat.color}15`, borderRadius: '15px', color: stat.color }}>{stat.icon}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '25px' }}>
                <div style={{ background: 'white', padding: '30px', borderRadius: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                    <h3>النمو المالي والطلابي</h3>
                    <select style={{ padding: '8px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <option>آخر 7 أيام</option>
                      <option>آخر شهر</option>
                    </select>
                  </div>
                  <div style={{ height: '350px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                        <YAxis hide />
                        <Tooltip contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }} />
                        <Area type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div style={{ background: 'white', padding: '30px', borderRadius: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                  <h3>توزيع الطلاب</h3>
                  <div style={{ height: '300px', marginTop: '20px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <Bar dataKey="students" radius={[10, 10, 10, 10]}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#e2e8f0'} />
                          ))}
                        </Bar>
                        <Tooltip cursor={{fill: 'transparent'}} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ marginTop: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <span>القاهرة</span><strong>45%</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                      <span>الإسكندرية</span><strong>22%</strong>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* --- قسم إدارة الكورسات --- */}
          {activeTab === 'courses' && (
            <motion.div key="courses" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h2>المنهج الدراسي والدروس</h2>
                <button onClick={() => setShowCourseModal(true)} style={{ background: '#3b82f6', color: 'white', padding: '12px 25px', borderRadius: '15px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold' }}>
                  <PlusCircle size={20}/> إضافة كورس جديد
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
                {[1, 2, 3].map(c => (
                  <div key={c} style={{ background: 'white', borderRadius: '25px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <div style={{ height: '180px', background: '#e2e8f0', position: 'relative' }}>
                      <div style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.5)', color: 'white', padding: '5px 12px', borderRadius: '20px', fontSize: '12px' }}>محاضرة فيديو</div>
                    </div>
                    <div style={{ padding: '20px' }}>
                      <h4 style={{ margin: '0 0 10px 0' }}>كورس الفيزياء الحديثة - الصف الثالث الثانوي</h4>
                      <div style={{ display: 'flex', gap: '15px', color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Play size={14}/> 24 درس</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Users size={14}/> 1.2k طالب</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>180 ج.م</span>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button style={{ padding: '8px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white' }}><Settings size={16}/></button>
                          <button style={{ padding: '8px', borderRadius: '10px', border: 'none', background: '#fee2e2', color: '#ef4444' }}><Trash2 size={16}/></button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* --- قسم الأمان والحماية (Security) --- */}
          {activeTab === 'security' && (
            <motion.div key="security" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                <div style={{ background: 'white', padding: '30px', borderRadius: '25px' }}>
                  <h3>التحكم في الوصول</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '25px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: '#f8fafc', borderRadius: '15px' }}>
                      <div>
                        <strong>منع تسجيل الشاشة</strong>
                        <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>يمنع الطلاب من استخدام برامج التسجيل</p>
                      </div>
                      <div style={{ width: '50px', height: '26px', background: '#10b981', borderRadius: '20px', position: 'relative' }}>
                        <div style={{ width: '20px', height: '20px', background: 'white', borderRadius: '50%', position: 'absolute', left: '26px', top: '3px' }}></div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: '#f8fafc', borderRadius: '15px' }}>
                      <div>
                        <strong>قفل الجهاز الواحد (Device Lock)</strong>
                        <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>منع فتح الحساب على أكثر من جهاز</p>
                      </div>
                      <div style={{ width: '50px', height: '26px', background: '#e2e8f0', borderRadius: '20px', position: 'relative' }}>
                        <div style={{ width: '20px', height: '20px', background: 'white', borderRadius: '50%', position: 'absolute', left: '4px', top: '3px' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ background: 'white', padding: '30px', borderRadius: '25px' }}>
                  <h3>قائمة الحظر السوداء</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                    <thead>
                      <tr style={{ textAlign: 'right', color: '#64748b', fontSize: '14px' }}>
                        <th style={{ padding: '10px' }}>الطالب</th>
                        <th>السبب</th>
                        <th>الإجراء</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.filter(u => u.isBanned).map(user => (
                        <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '15px 10px' }}>{user.name}</td>
                          <td><span style={{ color: '#ef4444', fontSize: '12px', background: '#fee2e2', padding: '3px 8px', borderRadius: '8px' }}>محاولة غش</span></td>
                          <td><button onClick={() => handleAction("فك الحظر")} style={{ border: 'none', background: 'none', color: '#3b82f6', cursor: 'pointer' }}>فك الحظر</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* --- قسم المالية (Finance) --- */}
          {activeTab === 'finance' && (
            <motion.div key="finance" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{ background: 'white', padding: '35px', borderRadius: '30px', marginBottom: '30px', textAlign: 'center' }}>
                <p style={{ color: '#64748b' }}>صافي الأرباح القابلة للسحب</p>
                <h1 style={{ fontSize: '48px', color: '#10b981', margin: '10px 0' }}>{calculateTotalRevenue.toLocaleString()} ج.م</h1>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                  <button style={{ padding: '12px 30px', borderRadius: '15px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: 'bold' }}>طلب سحب الأرباح</button>
                  <button style={{ padding: '12px 30px', borderRadius: '15px', border: '1px solid #e2e8f0', background: 'white' }}>تحميل تقرير PDF</button>
                </div>
              </div>
              <div style={{ background: 'white', padding: '30px', borderRadius: '25px' }}>
                <h3>آخر العمليات المالية</h3>
                <div style={{ marginTop: '20px' }}>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', gap: '15px' }}>
                        <div style={{ width: '45px', height: '45px', background: '#f0f9ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0ea5e9' }}><CreditCard size={20}/></div>
                        <div>
                          <strong>شراء كورس الفيزياء</strong>
                          <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>بواسطة: كود تفعيل #TX-99{i}</p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <span style={{ fontWeight: 'bold' }}>+150 ج.م</span>
                        <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>منذ {i} ساعة</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* نافذة إضافة كورس (Modal) */}
      <AnimatePresence>
        {showCourseModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              style={{ background: 'white', width: '650px', borderRadius: '30px', padding: '35px', position: 'relative' }}
            >
              <button onClick={() => setShowCourseModal(false)} style={{ position: 'absolute', top: '25px', left: '25px', border: 'none', background: '#f1f5f9', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}><X size={20}/></button>
              <h2 style={{ marginBottom: '30px' }}>إضافة كورس تعليمي جديد</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label>اسم الكورس</label>
                  <input style={{ padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }} placeholder="مثلاً: الكيمياء العضوية" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label>السعر (ج.م)</label>
                  <input type="number" style={{ padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }} placeholder="180" />
                </div>
                <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label>رابط فيديو المعاينة (اختياري)</label>
                  <input style={{ padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }} placeholder="Youtube or BunnyCDN link" />
                </div>
                <div style={{ gridColumn: 'span 2', background: '#f8fafc', padding: '20px', borderRadius: '20px' }}>
                  <h4 style={{ margin: '0 0 15px 0' }}>مرفقات الكورس (الكتب)</h4>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0' }} placeholder="اسم الكتاب" />
                    <button style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px' }}>رفع PDF</button>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => { handleAction("نشر الكورس"); setShowCourseModal(false); }} 
                style={{ width: '100%', marginTop: '30px', padding: '15px', borderRadius: '15px', border: 'none', background: '#10b981', color: 'white', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}
              >
                تفعيل ونشر الكورس الآن
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* التنبيهات (Toasts) */}
      <AnimatePresence>
        {statusNotification && (
          <motion.div 
            initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }}
            style={{ position: 'fixed', bottom: '30px', left: '30px', background: '#10b981', color: 'white', padding: '15px 25px', borderRadius: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '10px', zIndex: 1100 }}
          >
            <CheckCircle size={20}/> {statusNotification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* شاشة التحميل (Global Loader) */}
      {isProcessing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ width: '50px', height: '50px', border: '4px solid #f3f3f3', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      )}

    </div>
  );
};

export default AdminDash;
