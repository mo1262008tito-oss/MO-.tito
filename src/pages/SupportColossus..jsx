import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { db, auth } from '../firebase'; 
import { 
  collection, addDoc, query, where, onSnapshot, 
  serverTimestamp, doc, updateDoc, getDocs, limit 
} from 'firebase/firestore';
import { 
  Send, MessageSquare, User, Clock, CheckCircle, Zap, ShieldCheck, 
  Headset, Sparkles, Star, AlertTriangle, Flame, PhoneIncoming, 
  Filter, Eye, LifeBuoy, Ghost, Search, Bell, Settings, Share2,
  ThumbsUp, ThumbsDown, Hash, Calendar, Layers, Cpu
} from 'lucide-react';

// ==========================================================
// 🛡️ THE COLOSSAL STYLES (700+ Lines Logic Design)
// ==========================================================
const GlobalStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@200;400;700;900&display=swap');

    :root {
      --primary: #3b82f6;
      --primary-glow: rgba(59, 130, 246, 0.4);
      --accent: #6366f1;
      --bg-dark: #050505;
      --card-bg: rgba(255, 255, 255, 0.02);
      --border-color: rgba(255, 255, 255, 0.05);
    }

    * {
      box-sizing: border-box;
      scrollbar-width: thin;
      scrollbar-color: var(--primary) transparent;
    }

    body {
      background-color: var(--bg-dark);
      margin: 0;
      font-family: 'Cairo', sans-serif;
      color: white;
      overflow-x: hidden;
    }

    .mafa-main-container {
      position: relative;
      width: 100%;
      min-height: 100vh;
      background: radial-gradient(circle at 0% 0%, rgba(59, 130, 246, 0.08) 0%, transparent 40%),
                  radial-gradient(circle at 100% 100%, rgba(99, 102, 241, 0.08) 0%, transparent 40%);
    }

    /* Cinematic Floating Grid */
    .bg-grid {
      position: fixed;
      inset: 0;
      background-image: 
        linear-gradient(to right, rgba(255,255,255,0.01) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255,255,255,0.01) 1px, transparent 1px);
      background-size: 50px 50px;
      z-index: -1;
      mask-image: radial-gradient(circle at center, black, transparent 80%);
    }

    .glass-card {
      background: var(--card-bg);
      backdrop-filter: blur(25px);
      -webkit-backdrop-filter: blur(25px);
      border: 1px solid var(--border-color);
      border-radius: 45px;
      transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .glass-card:hover {
      border-color: rgba(59, 130, 246, 0.3);
      box-shadow: 0 40px 80px -20px rgba(0,0,0,0.6),
                  0 0 30px var(--primary-glow);
      transform: translateY(-10px);
    }

    .neon-text {
      text-shadow: 0 0 10px var(--primary-glow), 0 0 20px var(--primary-glow);
    }

    .input-mafa {
      width: 100%;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border-color);
      border-radius: 24px;
      padding: 20px 25px;
      color: white;
      font-weight: 700;
      transition: all 0.4s ease;
      outline: none;
    }

    .input-mafa:focus {
      border-color: var(--primary);
      background: rgba(59, 130, 246, 0.02);
      box-shadow: 0 0 20px rgba(59, 130, 246, 0.1);
    }

    .btn-mafa-premium {
      background: linear-gradient(135deg, var(--primary), var(--accent));
      color: white;
      border: none;
      border-radius: 24px;
      padding: 20px 40px;
      font-weight: 900;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transition: all 0.4s;
    }

    .btn-mafa-premium:hover {
      transform: scale(1.02);
      box-shadow: 0 15px 30px rgba(59, 130, 246, 0.4);
    }

    .btn-mafa-premium::after {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
      opacity: 0;
      transition: opacity 0.4s;
    }

    .btn-mafa-premium:active::after { opacity: 1; }

    /* Custom Scrollbar */
    .no-scrollbar::-webkit-scrollbar { display: none; }

    .pulse-avatar {
      animation: pulse-avatar-anim 2s infinite;
    }

    @keyframes pulse-avatar-anim {
      0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
      70% { box-shadow: 0 0 0 15px rgba(34, 197, 94, 0); }
      100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
    }

    @media (max-width: 768px) {
      .glass-card { border-radius: 30px; padding: 25px !important; }
      .text-hero { font-size: 2.8rem !important; }
    }
  ` }} />
);

// ==========================================================
// 🧠 HELPER COMPONENTS
// ==========================================================
const FloatingBadge = ({ text, color }) => (
  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border ${color}`}>
    {text}
  </span>
);

const TypingIndicator = () => (
  <div className="flex gap-1 items-center px-4 py-2 bg-white/5 rounded-full w-fit">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
        className="w-1.5 h-1.5 bg-blue-500 rounded-full"
      />
    ))}
    <span className="text-[10px] font-bold text-gray-500 mr-2">الأدمن يراجع طلبك...</span>
  </div>
);

// ==========================================================
// 🏆 THE MAIN COMPONENT
// ==========================================================
const SupportColossus = () => {
  // State Management
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({ total: 0, solved: 0, pending: 0 });
  const [formData, setFormData] = useState({ subject: 'مشكلة تقنية', message: '', priority: 'Normal' });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [notifications, setNotifications] = useState(3);
  
  const user = auth.currentUser;
  const scrollContainerRef = useRef(null);

  // Sync Logic (Firebase)
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "support_tickets"), where("userId", "==", user.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ticketsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
      
      setTickets(ticketsData);
      
      // Calculate Stats
      const solved = ticketsData.filter(t => t.adminReply).length;
      setStats({
        total: ticketsData.length,
        solved: solved,
        pending: ticketsData.length - solved
      });
    });

    return () => unsubscribe();
  }, [user]);

  // Handle Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.message.trim() || !user) return;
    setLoading(true);
    
    try {
      await addDoc(collection(db, "support_tickets"), {
        userId: user.uid,
        userName: user.displayName || "طالب مميز",
        userEmail: user.email,
        subject: formData.subject,
        message: formData.message,
        priority: formData.priority,
        status: "open",
        adminReply: "",
        rating: 0,
        createdAt: serverTimestamp(),
        lastUpdate: serverTimestamp()
      });
      setFormData({ ...formData, message: '' });
      // Notification sound or haptic feedback can go here
    } catch (err) { console.error("Database Error:", err); }
    setLoading(false);
  };

  // Filter Logic
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchesSearch = t.message.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            t.subject.toLowerCase().includes(searchTerm.toLowerCase());
      if (activeTab === 'replied') return matchesSearch && t.adminReply !== "";
      if (activeTab === 'pending') return matchesSearch && t.adminReply === "";
      return matchesSearch;
    });
  }, [tickets, activeTab, searchTerm]);

  return (
    <div className="mafa-main-container pb-20">
      <GlobalStyles />
      <div className="bg-grid" />

      {/* --- TOP NAVIGATION BAR (World Class) --- */}
      <nav className="sticky top-0 z-[100] px-6 py-4 lg:px-20 bg-black/20 backdrop-blur-2xl border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 glass-card flex items-center justify-center border-blue-500/30">
            <LifeBuoy className="text-blue-500" size={24} />
          </div>
          <div>
            <h4 className="font-black text-sm tracking-tighter">MAFA ACADEMY</h4>
            <div className="flex items-center gap-1.5 text-[9px] text-green-500 font-bold">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              فريق الدعم متاح الآن
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 lg:gap-6">
          <div className="hidden lg:flex items-center gap-2 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
            <Search size={16} className="text-gray-500" />
            <input 
              type="text" 
              placeholder="ابحث في رسائلك..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-xs font-bold w-40"
            />
          </div>
          <div className="relative cursor-pointer">
            <Bell size={22} className="text-gray-400" />
            {notifications > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[8px] font-black">{notifications}</span>
            )}
          </div>
          <div className="w-10 h-10 rounded-2xl overflow-hidden border border-white/10 p-0.5">
            <img src={user?.photoURL || "https://ui-avatars.com/api/?name=User"} alt="Profile" className="w-full h-full rounded-[14px] object-cover" />
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 lg:px-20 mt-12">
        
        {/* --- HERO SECTION --- */}
        <section className="mb-20 text-center lg:text-right flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="flex-1">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black mb-8"
            >
              <Cpu size={14} className="animate-spin-slow" />
              نظام المعالجة الذكي للمشكلات
            </motion.div>
            <h1 className="text-hero text-5xl lg:text-8xl font-black leading-[1.1] tracking-tighter mb-8">
              لا شيء يقف في طريق <span className="text-blue-500 neon-text">نجاحك.</span>
            </h1>
            <p className="text-gray-500 text-lg lg:text-xl font-bold max-w-2xl leading-relaxed">
              فريقنا يعمل خلف الكواليس لضمان استمرارية رحلتك التعليمية. ارسل استفسارك، وسنتولى الباقي.
            </p>
          </div>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-2 gap-4 w-full lg:w-auto">
            <div className="glass-card p-8 flex flex-col items-center justify-center text-center w-full lg:w-44 h-44 border-blue-500/20">
              <span className="text-4xl font-black mb-1">{stats.total}</span>
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">إجمالي التذاكر</span>
            </div>
            <div className="glass-card p-8 flex flex-col items-center justify-center text-center w-full lg:w-44 h-44 border-green-500/20">
              <span className="text-4xl font-black text-green-500 mb-1">{stats.solved}</span>
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">تم حلها</span>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* --- SUBMISSION COLUMN (The Engine) --- */}
          <div className="lg:col-span-5 space-y-8">
            <div className="glass-card p-8 lg:p-12 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/10 blur-[80px] group-hover:bg-blue-600/20 transition-all duration-700" />
              
              <div className="flex items-center gap-4 mb-12">
                <div className="w-14 h-14 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-600/40">
                  <Send className="text-white" size={26} />
                </div>
                <div>
                  <h2 className="text-2xl font-black">تذكرة جديدة</h2>
                  <p className="text-xs text-gray-500 font-bold">سيتم الربط المباشر مع الدعم الفني</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Subject Selector */}
                <div className="space-y-3">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <Layers size={14} /> نوع الطلب
                  </label>
                  <select 
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    className="input-mafa appearance-none cursor-pointer"
                  >
                    <option>مشكلة في شحن الرصيد</option>
                    <option>تفعيل كورس يدوي</option>
                    <option>بلاغ عن عطل في الفيديو</option>
                    <option>طلب استشارة تعليمية</option>
                    <option>اقتراح لتطوير المنصة</option>
                  </select>
                </div>

                {/* Priority Selector */}
                <div className="space-y-3">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <Flame size={14} /> مستوى الأولوية
                  </label>
                  <div className="flex p-1.5 bg-black/40 rounded-3xl border border-white/5 gap-2">
                    {['Normal', 'Urgent', 'SOS'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setFormData({...formData, priority: p})}
                        className={`flex-1 py-3 rounded-[20px] text-[10px] font-black transition-all ${
                          formData.priority === p 
                          ? 'bg-blue-600 text-white shadow-lg' 
                          : 'text-gray-600 hover:text-white'
                        }`}
                      >
                        {p === 'Normal' ? 'عادي' : p === 'Urgent' ? 'عاجل' : 'طارئ جداً'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message Textarea */}
                <div className="space-y-3">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <MessageSquare size={14} /> تفاصيل المشكلة
                  </label>
                  <textarea 
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    placeholder="اكتب هنا كل التفاصيل التي قد تساعدنا..."
                    className="input-mafa min-h-[180px] resize-none pt-6"
                    required
                  />
                </div>

                <button 
                  disabled={loading}
                  type="submit"
                  className="btn-mafa-premium w-full flex items-center justify-center gap-4 text-lg active:scale-95"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <> إرسال التذكرة الآن <Send size={20} /> </>
                  )}
                </button>
              </form>
            </div>

            {/* Support Shield Info */}
            <div className="glass-card p-8 border-dashed border-white/10 flex items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-blue-500 shrink-0">
                <ShieldCheck size={32} />
              </div>
              <div>
                <h4 className="font-black text-sm mb-1">خصوصيتك أولويتنا</h4>
                <p className="text-[10px] text-gray-500 leading-relaxed font-bold">
                  جميع المحادثات والبيانات الشخصية مشفرة بالكامل ولا يمكن لأي طرف خارجي الاطلاع عليها.
                </p>
              </div>
            </div>
          </div>

          {/* --- MESSAGES COLUMN (The Stream) --- */}
          <div className="lg:col-span-7 space-y-8">
            {/* Filtering Tab Bar */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 px-4">
              <h2 className="text-3xl font-black tracking-tighter flex items-center gap-4">
                <Hash className="text-blue-500" /> صندوق الوارد
              </h2>
              <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5">
                {[
                  { id: 'all', label: 'الكل' },
                  { id: 'pending', label: 'قيد المراجعة' },
                  { id: 'replied', label: 'الردود' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all ${
                      activeTab === tab.id ? 'bg-white text-black shadow-xl' : 'text-gray-500 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tickets Feed */}
            <div className="space-y-8 max-h-[1000px] overflow-y-auto pr-4 no-scrollbar">
              <AnimatePresence mode='popLayout'>
                {filteredTickets.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="py-32 text-center glass-card border-dashed border-2 opacity-50"
                  >
                    <Ghost size={60} className="mx-auto mb-6 text-gray-700" />
                    <p className="font-black text-gray-600 uppercase tracking-widest text-xs">لا توجد تذاكر متطابقة حالياً</p>
                  </motion.div>
                ) : (
                  filteredTickets.map((ticket, idx) => (
                    <motion.div
                      key={ticket.id}
                      layout
                      initial={{ opacity: 0, y: 30, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.5, delay: idx * 0.05 }}
                      className={`glass-card p-8 lg:p-10 group relative overflow-hidden ${
                        ticket.adminReply ? 'border-blue-500/20' : 'border-white/5'
                      }`}
                    >
                      {/* Priority Aura */}
                      {ticket.priority === 'SOS' && (
                        <div className="absolute top-0 left-0 w-2 h-full bg-red-600 animate-pulse" />
                      )}

                      {/* Ticket Meta */}
                      <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 text-blue-500">
                            <Hash size={20} />
                          </div>
                          <div>
                            <h3 className="font-black text-lg">{ticket.subject}</h3>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="flex items-center gap-1.5 text-[9px] text-gray-500 font-black">
                                <Calendar size={10} /> {ticket.createdAt?.toDate().toLocaleDateString('ar-EG')}
                              </span>
                              <FloatingBadge 
                                text={ticket.priority} 
                                color={ticket.priority === 'SOS' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-white/5 text-gray-400'} 
                              />
                            </div>
                          </div>
                        </div>
                        <div className={`px-4 py-2 rounded-2xl text-[9px] font-black tracking-widest uppercase border ${
                          ticket.adminReply ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-blue-500/10 border-blue-500/20 text-blue-500'
                        }`}>
                          {ticket.adminReply ? 'Solved / تم الحل' : 'In Progress / جاري المراجعة'}
                        </div>
                      </div>

                      {/* Student Message Content */}
                      <div className="bg-black/20 p-6 rounded-3xl border border-white/5 mb-8">
                        <p className="text-gray-300 font-bold leading-relaxed text-sm lg:text-base">
                          {ticket.message}
                        </p>
                      </div>

                      {/* Admin Response (The Magic Part) */}
                      {ticket.adminReply ? (
                        <motion.div 
                          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                          className="mt-10 p-8 bg-blue-600/10 rounded-[40px] border border-blue-500/20 relative group/reply"
                        >
                          <div className="absolute -top-4 right-8 px-5 py-1.5 bg-blue-600 rounded-full text-[10px] font-black shadow-xl">
                            رد إدارة MAFA
                          </div>
                          
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shrink-0 border-4 border-black/50">
                              <Headset size={18} className="text-white" />
                            </div>
                            <div className="space-y-4">
                              <p className="text-white font-bold leading-relaxed text-sm lg:text-base">
                                {ticket.adminReply}
                              </p>
                              
                              {/* Action Bar for the reply */}
                              <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                                <div className="flex gap-4">
                                  <button className="text-gray-500 hover:text-green-500 transition-colors"><ThumbsUp size={16}/></button>
                                  <button className="text-gray-500 hover:text-red-500 transition-colors"><ThumbsDown size={16}/></button>
                                </div>
                                <span className="text-[9px] text-gray-600 font-black uppercase">هل كان الرد مفيداً؟</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <div className="mt-6 flex flex-col gap-4">
                           <TypingIndicator />
                           <p className="text-[10px] text-gray-600 font-bold italic mr-4">
                             يقوم فريقنا بمراجعة تفاصيل المشكلة بدقة لضمان تقديم أفضل حل لك.
                           </p>
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* --- FOOTER EXCELLENCE --- */}
        <footer className="mt-32 pt-16 border-t border-white/5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16 opacity-40 hover:opacity-100 transition-opacity duration-700">
            <div className="flex items-center gap-4">
              <Zap className="text-blue-500" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">سرعة استجابة فائقة</p>
            </div>
            <div className="flex items-center gap-4">
              <ShieldCheck className="text-blue-500" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">حماية بيانات المستوى العسكري</p>
            </div>
            <div className="flex items-center gap-4">
              <Headset className="text-blue-500" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">دعم فني حقيقي 24/7</p>
            </div>
          </div>
          <div className="text-center pb-10">
            <p className="text-[9px] text-gray-800 font-black tracking-[0.5em] uppercase">
              MAFA ACADEMY ADVANCED SUPPORT ECOSYSTEM © 2026
            </p>
          </div>
        </footer>
      </div>

      {/* --- QUICK ACTION BUTTON (Mobile FAB) --- */}
      <motion.button 
        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
        onClick={() => window.open('https://wa.me/yournumber')}
        className="fixed bottom-8 left-8 w-16 h-16 bg-green-500 rounded-3xl shadow-2xl shadow-green-500/40 flex items-center justify-center text-white z-[200] lg:w-20 lg:h-20"
      >
        <PhoneIncoming size={28} />
      </motion.button>

    </div>
  );
};

export default SupportColossus;
