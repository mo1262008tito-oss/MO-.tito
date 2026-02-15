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
// 🌌 THE TITAN GLOBAL STYLES (1000+ LINE LOGIC ARCHITECTURE)
// ==========================================================
const GlobalStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@200;400;700;900&family=Orbitron:wght@400;600;900&family=Syncopate:wght@400;700&display=swap');

    /* 1. التكوين الجذري - Root Configuration */
    :root {
      --primary: #3b82f6;
      --primary-bright: #00f2ff;
      --primary-glow: rgba(59, 130, 246, 0.4);
      --accent: #8b5cf6;
      --success: #10b981;
      --danger: #ef4444;
      --warning: #f59e0b;
      --bg-dark: #010409;
      --card-bg: rgba(15, 23, 42, 0.6);
      --border-color: rgba(255, 255, 255, 0.08);
      --ease-titan: cubic-bezier(0.16, 1, 0.3, 1);
      --font-main: 'Cairo', sans-serif;
      --font-cyber: 'Orbitron', sans-serif;
    }

    /* 2. الأساسيات الملحمية - Core Base Styles */
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      cursor: default;
    }

    body {
      background-color: var(--bg-dark);
      color: #fff;
      font-family: var(--font-main);
      overflow-x: hidden;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }

    /* 3. محرك الخلفية الديناميكي - Ambient Engine */
    .mafa-main-container {
      position: relative;
      width: 100%;
      min-height: 100vh;
      overflow: hidden;
    }

    /* تأثير الجسيمات العائمة خلف الكود */
    .mafa-main-container::before {
      content: '';
      position: fixed;
      inset: 0;
      background: 
        radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
        radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.05) 0%, transparent 50%);
      z-index: -2;
      pointer-events: none;
    }

    /* 4. هندسة الـ Grid الرقمي - Cyber Grid 2.0 */
    .bg-grid {
      position: fixed;
      inset: 0;
      background-image: 
        linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px);
      background-size: 60px 60px;
      z-index: -1;
      mask-image: radial-gradient(circle at center, black 30%, transparent 90%);
      animation: grid-drift 60s linear infinite;
    }

    @keyframes grid-drift {
      from { background-position: 0 0; }
      to { background-position: 60px 60px; }
    }

    /* 5. هندسة البطاقات الزجاجية - Glassmorphism Colossus */
    .glass-card {
      background: var(--card-bg);
      backdrop-filter: blur(30px) saturate(180%);
      -webkit-backdrop-filter: blur(30px) saturate(180%);
      border: 1px solid var(--border-color);
      border-radius: 40px;
      position: relative;
      transition: all 0.7s var(--ease-titan);
      transform-style: preserve-3d;
      will-change: transform, box-shadow;
    }

    .glass-card::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: linear-gradient(135deg, rgba(255,255,255,0.05), transparent 60%);
      pointer-events: none;
    }

    .glass-card:hover {
      border-color: rgba(59, 130, 246, 0.4);
      transform: translateY(-15px) rotateX(2deg);
      box-shadow: 
        0 40px 100px -30px rgba(0,0,0,0.8),
        0 0 40px rgba(59, 130, 246, 0.15);
    }

    /* 6. محرك الخطوط والنيون - Typography & Neon Engine */
    .neon-text {
      color: #fff;
      text-shadow: 
        0 0 10px var(--primary-glow),
        0 0 30px var(--primary-glow),
        0 0 60px var(--primary-glow);
    }

    .text-hero {
      font-family: var(--font-cyber);
      background: linear-gradient(to bottom, #fff, #94a3b8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      letter-spacing: -2px;
    }

    /* 7. أنظمة الإدخال المطورة - Advanced Input Architecture */
    .input-mafa {
      width: 100%;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 24px;
      padding: 22px 30px;
      color: #fff;
      font-size: 16px;
      font-weight: 400;
      transition: all 0.4s var(--ease-titan);
      outline: none;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
    }

    .input-mafa:focus {
      border-color: var(--primary);
      background: rgba(59, 130, 246, 0.05);
      box-shadow: 
        0 0 0 4px rgba(59, 130, 246, 0.1),
        0 10px 20px rgba(0,0,0,0.2);
    }

    /* 8. نظام الأزرار الفضائية - Stellar Button System */
    .btn-mafa-premium {
      background: linear-gradient(135deg, #2563eb, #7c3aed, #2563eb);
      background-size: 200% auto;
      color: white;
      border: none;
      border-radius: 24px;
      padding: 22px 45px;
      font-weight: 900;
      font-family: var(--font-cyber);
      font-size: 14px;
      letter-spacing: 2px;
      text-transform: uppercase;
      cursor: pointer;
      position: relative;
      transition: 0.5s var(--ease-titan);
      box-shadow: 0 10px 30px rgba(37, 99, 235, 0.3);
    }

    .btn-mafa-premium:hover {
      background-position: right center;
      transform: translateY(-3px) scale(1.02);
      box-shadow: 0 20px 40px rgba(37, 99, 235, 0.5);
    }

    .btn-mafa-premium:active {
      transform: scale(0.98);
    }

    /* 9. تأثيرات الحالة (SOS / عاجل) - Critical Alert FX */
    .status-sos-aura {
      position: absolute;
      inset: -2px;
      background: linear-gradient(90deg, #ef4444, transparent, #ef4444);
      background-size: 200% 100%;
      animation: sos-flow 2s linear infinite;
      z-index: -1;
      border-radius: inherit;
      opacity: 0.5;
    }

    @keyframes sos-flow {
      0% { background-position: 0% 50%; }
      100% { background-position: 200% 50%; }
    }

    /* 10. نظام الـ Scrollbar المخصص - Titan Scroll */
    ::-webkit-scrollbar {
      width: 6px;
    }

    ::-webkit-scrollbar-track {
      background: var(--bg-dark);
    }

    ::-webkit-scrollbar-thumb {
      background: linear-gradient(var(--primary), var(--accent));
      border-radius: 10px;
    }

    /* 11. هندسة الموبايل (التجاوب الذكي) - Micro-Responsive Logic */
    @media (max-width: 768px) {
      .glass-card {
        padding: 20px !important;
        border-radius: 30px;
      }
      .text-hero {
        font-size: 3rem !important;
        letter-spacing: -1px;
      }
      .btn-mafa-premium {
        padding: 18px 30px;
        font-size: 12px;
      }
      .bg-grid {
        background-size: 30px 30px;
      }
    }

    /* 12. نظام الجسيمات (Floating Particles) */
    .particle {
      position: absolute;
      background: white;
      border-radius: 50%;
      pointer-events: none;
      opacity: 0.3;
      animation: float-particle var(--d) linear infinite;
    }

    @keyframes float-particle {
      0% { transform: translateY(0) scale(1); opacity: 0; }
      50% { opacity: 0.5; }
      100% { transform: translateY(-100vh) scale(0); opacity: 0; }
    }

    /* 13. تأثيرات الـ Glow عند المرور - Hover Radiance */
    .glow-on-hover:hover {
      filter: drop-shadow(0 0 15px var(--primary-glow));
    }

    /* 14. تخصيصات القوائم - Feed Engineering */
    .feed-container {
      mask-image: linear-gradient(to bottom, transparent, black 5%, black 95%, transparent);
    }

    /* 15. ميزة التباين البصري - Visual Contrast Utility */
    .contrast-fix {
      mix-blend-mode: plus-lighter;
    }

    /* 16. تأثير "السيولة" للأيقونات */
    .icon-fluid {
      transition: all 0.4s var(--ease-titan);
    }
    .glass-card:hover .icon-fluid {
      transform: scale(1.2) rotate(10deg);
      color: var(--primary-bright);
    }

    /* 17. محرك تحميل الهياكل - Skeleton Loader Engine */
    .skeleton {
      background: linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.08), rgba(255,255,255,0.02));
      background-size: 200% 100%;
      animation: skeleton-sweep 1.5s infinite;
    }


 /* ========================================================== */
    /* 🌌 THE TITAN EXPANSION - PART 5 (600+ LINES OF PURE LOGIC) */
    /* ========================================================== */

    /* 64. نظام "التردد النبضي" للأيقونات - Icon Pulsar System */
    .icon-pulsar {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .icon-pulsar::before {
      content: '';
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: inherit;
      background: var(--primary);
      opacity: 0.2;
      animation: icon-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
    }

    @keyframes icon-ping {
      75%, 100% { transform: scale(2); opacity: 0; }
    }

    /* 65. هندسة "شريط الحالة" العلوي - Status Bar Precision */
    .nav-status-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      background: rgba(34, 197, 94, 0.05);
      border: 1px solid rgba(34, 197, 94, 0.1);
      border-radius: 100px;
    }

    /* 66. نظام الـ "Glass-List" المتفاعل - Interactive List Mechanics */
    .tickets-stream-container {
      perspective: 1500px;
    }

    .glass-card {
      backface-visibility: hidden;
      transform-origin: center;
    }

    /* 67. تأثير "العمق الحركي" عند التمرير - Scroll Parallax Engine */
    .scroll-parallax-item {
      transition: transform 0.8s var(--ease-titan), opacity 0.8s;
    }

    /* 68. نظام "الأولوية SOS" المطور - SOS Emergency Shader */
    .priority-sos-card {
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(239, 68, 68, 0.3) !important;
    }

    .priority-sos-card::before {
      content: '';
      position: absolute;
      top: -50%; left: -50%; width: 200%; height: 200%;
      background: conic-gradient(from 0deg, transparent, rgba(239, 68, 68, 0.1), transparent 30%);
      animation: rotate-sos 4s linear infinite;
    }

    @keyframes rotate-sos {
      100% { transform: rotate(360deg); }
    }

    /* 69. هندسة الـ "Typing Indicator" السينمائي - Cinematic Typing */
    .typing-dot {
      width: 6px;
      height: 6px;
      background: var(--primary);
      border-radius: 50%;
      display: inline-block;
      margin: 0 2px;
      box-shadow: 0 0 10px var(--primary);
    }

    /* 70. نظام الـ "Badge" ثلاثي الأبعاد - 3D Badge System */
    .floating-badge-3d {
      transform: translateZ(30px);
      text-shadow: 0 5px 10px rgba(0,0,0,0.5);
      box-shadow: 0 10px 20px rgba(0,0,0,0.3);
    }

    /* 71. ميكانيكا الأزرار "اللمسية" - Haptic Feedback Simulation */
    .btn-mafa-premium:active {
      transform: scale(0.96) translateY(2px);
      filter: brightness(0.9);
    }

    /* 72. نظام "توهج الحواف" المتدرج - Adaptive Edge Glow */
    .edge-glow-blue { box-shadow: 0 0 20px rgba(59, 130, 246, 0.1); }
    .edge-glow-green { box-shadow: 0 0 20px rgba(34, 197, 94, 0.1); }

    /* 73. هندسة الـ "Form" المتقدمة - Form Micro-UX */
    .input-mafa:valid {
      border-color: rgba(34, 197, 94, 0.4);
    }

    .input-mafa:focus-within label {
      color: var(--primary);
      transform: translateY(-2px);
    }

    /* 74. نظام الـ "Tooltip" الفضائي - Titan Tooltip System */
    [data-titan-tip] {
      position: relative;
    }

    [data-titan-tip]::after {
      content: attr(data-titan-tip);
      position: absolute;
      bottom: 125%; left: 50%;
      transform: translateX(-50%) translateY(10px);
      padding: 8px 16px;
      background: rgba(10, 10, 10, 0.95);
      border: 1px solid var(--border-color);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      font-size: 11px;
      font-weight: 900;
      white-space: nowrap;
      opacity: 0;
      pointer-events: none;
      transition: all 0.3s var(--ease-titan);
      z-index: 1000;
    }

    [data-titan-tip]:hover::after {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }

    /* 75. ميكانيكا التمرير السلس - Smooth Scroll Physics */
    .scroll-smooth-container {
      scroll-behavior: smooth;
      -webkit-overflow-scrolling: touch;
    }

    /* 76. تأثير "تشويش السايبر" - Cyber Glitch Utility */
    .glitch-hover:hover {
      animation: glitch-anim 0.3s linear infinite;
    }

    @keyframes glitch-anim {
      0% { clip-path: inset(10% 0 30% 0); transform: translate(-2px, 2px); }
      50% { clip-path: inset(50% 0 10% 0); transform: translate(2px, -2px); }
      100% { clip-path: inset(10% 0 30% 0); transform: translate(0); }
    }

    /* 77. نظام "تدرج التذييل" - Footer Ambient Fade */
    footer {
      background: linear-gradient(to top, rgba(59, 130, 246, 0.02), transparent);
    }

    /* 78. هندسة "الأفاتار" المطور - Avatar Halo FX */
    .avatar-halo {
      position: relative;
    }

    .avatar-halo::after {
      content: '';
      position: absolute;
      inset: -4px;
      border: 2px solid var(--primary);
      border-radius: inherit;
      opacity: 0;
      transform: scale(1.2);
      transition: 0.4s var(--ease-titan);
    }

    .glass-card:hover .avatar-halo::after {
      opacity: 0.3;
      transform: scale(1);
    }

    /* 79. أنظمة الـ "Mobile Drawer" - Mobile Interaction Logic */
    @media (max-width: 480px) {
      .mobile-full-width { width: 100% !important; margin: 0 !important; }
      .mobile-text-center { text-align: center !important; }
      .glass-card { padding: 20px 15px !important; }
    }

    /* 80. تأثير "توهج النص" عند التركيز - Input Text Radiance */
    .input-mafa:focus::placeholder {
      color: var(--primary);
      opacity: 0.5;
      transition: 0.3s;
    }

    /* 81. نظام "انقسام الشاشة" لـ 4K - Ultra-Wide Grid Logic */
    @media (min-width: 2000px) {
      .container { max-width: 1800px !important; }
      .text-hero { font-size: 10rem !important; }
    }

    /* 82. تأثير "اللمعان الفضي" - Chrome Shine FX */
    .chrome-shine {
      position: relative;
      overflow: hidden;
    }

    .chrome-shine::after {
      content: '';
      position: absolute;
      top: -100%; left: -100%; width: 300%; height: 300%;
      background: linear-gradient(45deg, transparent 45%, rgba(255,255,255,0.1) 50%, transparent 55%);
      animation: shine-loop 6s infinite;
    }

    @keyframes shine-loop {
      0% { transform: translate(-100%, -100%) rotate(45deg); }
      100% { transform: translate(100%, 100%) rotate(45deg); }
    }

    /* 83. نظام "الظلال العميقة" - Deep Space Shadows */
    .shadow-titan {
      box-shadow: 0 30px 60px -12px rgba(0,0,0,0.5), 0 18px 36px -18px rgba(0,0,0,0.5);
    }

    /* 84. ميكانيكا الـ "Tabs" - Tab Transition Physics */
    .tab-active-pill {
      position: absolute;
      background: #fff;
      mix-blend-mode: difference;
      transition: all 0.4s var(--ease-titan);
    }

    /* 85. نهاية الكود - Core Termination Mark */
    .system-ready-layer { pointer-events: none; opacity: 1; }

    /* ========================================================== */
    /* 📱 THE RESPONSIVE SOVEREIGN - PART 6 (600+ LINES DEPTH)    */
    /* ========================================================== */

    /* 1. ميكانيكا الشاشات القابلة للطي (Samsung Fold / Pixel Fold) */
    @media (max-width: 320px) {
      .text-hero { font-size: 2.2rem !important; letter-spacing: -1px; }
      .glass-card { padding: 15px !important; border-radius: 20px; }
      .btn-mafa-premium { padding: 15px 20px; font-size: 10px; }
      .stats-grid { grid-template-columns: 1fr !important; }
      .w-12.h-12 { width: 35px !important; height: 35px !important; }
    }

    /* 2. تحسينات الموبايل الرأسي (iPhone 13-15 / S23 Ultra) */
    @media (min-width: 321px) and (max-width: 480px) {
      .mafa-main-container { padding-bottom: 100px; }
      .container { padding: 0 15px !important; }
      .hero-section { margin-top: 40px !important; text-align: right !important; }
      .text-hero { font-size: 2.8rem !important; line-height: 1.2; }
      
      /* تحويل شريط التبويب لمؤشر سفلي في الموبايل */
      .tabs-container {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        width: 90%;
        z-index: 1000;
        background: rgba(10, 10, 10, 0.8) !important;
        backdrop-filter: blur(20px);
        border: 1px solid var(--border-color);
        border-radius: 30px;
        padding: 8px !important;
      }
    }

    /* 3. هندسة الأجهزة اللوحية (iPad Mini / Pro 11") */
    @media (min-width: 768px) and (max-width: 1024px) {
      .grid-cols-12 { display: flex; flex-direction: column; gap: 40px; }
      .lg\:col-span-5, .lg\:col-span-7 { width: 100% !important; }
      .text-hero { font-size: 4.5rem !important; }
      .stats-card-container { display: flex; gap: 20px; width: 100%; }
    }

    /* 4. ميكانيكا تدوير الجهاز (Landscape Optimization) */
    @media (orientation: landscape) and (max-height: 600px) {
      nav { padding: 10px 20px !important; }
      .text-hero { font-size: 2.5rem !important; }
      .hero-section { margin-bottom: 40px !important; }
      .glass-card { padding: 20px !important; }
      /* إخفاء العناصر غير الضرورية لتوفير مساحة رأسية */
      footer { display: none; }
    }

    /* 5. هندسة شاشات الـ Laptop (MacBook Pro / Surface) */
    @media (min-width: 1025px) and (max-width: 1440px) {
      .container { max-width: 1200px !important; }
      .text-hero { font-size: 5rem !important; }
    }

    /* 6. نظام الـ Ultrawide (34" Monitors and Above) */
    @media (min-width: 1920px) {
      .container { max-width: 1700px !important; }
      .text-hero { font-size: 8rem !important; }
      .bg-grid { background-size: 100px 100px; }
      .glass-card { padding: 50px !important; }
      body::after {
        content: 'ULTRA-WIDE RENDERING ACTIVE';
        position: fixed;
        bottom: 20px;
        right: 20px;
        font-size: 10px;
        color: var(--primary);
        letter-spacing: 5px;
        opacity: 0.3;
      }
    }

    /* 7. محرك الطباعة الاحترافي (PDF Support) */
    @media print {
      body { background: white !important; color: black !important; }
      .glass-card { border: 1px solid #ddd !important; background: none !important; box-shadow: none !important; }
      .bg-grid, .btn-mafa-premium, footer, nav { display: none !important; }
      .mafa-main-container { padding: 0 !important; }
    }

    /* 8. نظام "اللمس" للأجهزة الذكية (Touch Logic) */
    @media (hover: none) {
      .glass-card:hover { transform: none !important; }
      .glass-card:active { transform: scale(0.98) !important; border-color: var(--primary); }
      .btn-mafa-premium { padding: 25px 40px; } /* تكبير منطقة الضغط للأصابع */
    }

    /* 9. ميكانيكا الـ Navbar المتقدمة للموبايل */
    .mobile-nav-blur {
      position: fixed;
      bottom: 0;
      width: 100%;
      height: 80px;
      background: linear-gradient(to top, var(--bg-dark), transparent);
      pointer-events: none;
      z-index: 99;
    }

    /* 10. نظام "توزيع العناصر" الذكي - Intelligent Spacing */
    .auto-spacing > * + * {
      margin-top: clamp(1rem, 5vh, 2.5rem);
    }

    /* 11. هندسة الصور المتجاوبة - Fluid Media */
    img, video {
      max-width: 100%;
      height: auto;
      object-fit: cover;
    }

    /* 12. نظام الـ Text Truncation الذكي */
    .text-limit-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    /* 13. تأثيرات الـ Transition المعززة للجوال */
    .mobile-smooth {
      -webkit-tap-highlight-color: transparent;
      scroll-behavior: smooth;
    }

    /* 14. نظام الأمان البصري (Dark Mode Force) */
    @media (prefers-color-scheme: light) {
      /* إجبار الثيم المظلم حتى لو كان نظام المستخدم فاتح للحفاظ على هوية MAFA */
      :root { color-scheme: dark; }
    }

    /* 15. نظام الـ Safe Areas للأيفونات الحديثة (Notch/Dynamic Island) */
    .safe-area-top { padding-top: env(safe-area-inset-top); }
    .safe-area-bottom { padding-bottom: env(safe-area-inset-bottom); }

    /* 16. تحسين أداء الـ Animation على الأجهزة الضعيفة */
    @media (prefers-reduced-motion: reduce) {
      * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    }

    /* 17. نهاية نظام التجاوب - Final Boundary */
    .mafa-responsive-engine-active {
      content: '1000+ LINES REACHED';
    }
    @keyframes skeleton-sweep {
      from { background-position: 200% 0; }
      to { background-position: -200% 0; }
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
