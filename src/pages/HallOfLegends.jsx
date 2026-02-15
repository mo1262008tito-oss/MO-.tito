import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useSpring, useTransform, useMotionValue } from 'framer-motion';
import { db, auth } from '../firebase';
import { 
  collection, query, orderBy, limit, onSnapshot, doc, updateDoc, increment 
} from 'firebase/firestore';
import { 
  Trophy, Crown, Zap, Flame, Star, ShieldCheck, Rocket, Cpu, 
  Target, Award, Globe, Heart, ChevronUp, Search, Sparkles, 
  Share2, Medal, UserCheck, TrendingUp, Radio, Fingerprint,
  ZapOff, Lock, Ghost, Box, Activity, Command
} from 'lucide-react';
// ==========================================================
// 🌌 THE TITAN COLOSSUS ULTIMATE CSS (MEGA EDITION 2026)
// ==========================================================
const TitanStyles = () => (
<style dangerouslySetInnerHTML={{ __html: `
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@200;400;700;900&family=Orbitron:wght@400;600;900&family=Syncopate:wght@400;700&display=swap');

    /* 1. المتغيرات المركزية - Global Variables */
    :root {
      --titan-blue: #3b82f6;
      --titan-cyan: #00f2ff;
      --titan-gold: #fbbf24;
      --titan-purple: #8b5cf6;
      --titan-red: #ef4444;
      --titan-bg: #010409;
      --glass: rgba(15, 23, 42, 0.7);
      --card-gradient: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%);
      --glow-blue: 0 0 20px rgba(59, 130, 246, 0.4);
      --glow-gold: 0 0 40px rgba(251, 191, 36, 0.4);
      --ease-titan: cubic-bezier(0.16, 1, 0.3, 1);
    }

    /* 2. الأساسيات - Core Base */
    body {
      background: var(--titan-bg);
      color: #fff;
      font-family: 'Cairo', sans-serif;
      overflow-x: hidden;
      cursor: crosshair;
      background-attachment: fixed;
    }

    /* 3. الإضاءة الخلفية المعقدة - Ambient Lighting */
    body::before {
      content: '';
      position: fixed;
      inset: 0;
      background: 
        radial-gradient(circle at 15% 15%, rgba(59, 130, 246, 0.08) 0%, transparent 40%),
        radial-gradient(circle at 85% 85%, rgba(139, 92, 246, 0.08) 0%, transparent 40%),
        radial-gradient(circle at 50% 50%, rgba(0, 242, 255, 0.03) 0%, transparent 60%);
      pointer-events: none;
      z-index: -2;
    }

    /* 4. محرك الهولوجرام - Ultra-HD Hologram Engine */
    .colossus-card {
      background: var(--card-gradient);
      backdrop-filter: blur(25px) saturate(160%);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 40px;
      position: relative;
      transition: all 0.7s var(--ease-titan);
      transform-style: preserve-3d;
      will-change: transform, box-shadow;
    }

    .colossus-card::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(120deg, transparent, rgba(255,255,255,0.05), transparent);
      transform: translateX(-100%);
      transition: 0.8s;
    }

    .colossus-card:hover {
      transform: translateY(-20px) scale(1.02) rotateX(5deg);
      border-color: var(--titan-blue);
      box-shadow: 0 40px 80px rgba(0,0,0,0.6), var(--glow-blue);
    }

    .colossus-card:hover::before {
      transform: translateX(100%);
    }

    /* 5. ميزة الإمبراطور (المركز الأول) - Sovereign Aura */
    .emperor-glow {
      border: 2px solid var(--titan-gold) !important;
      background: radial-gradient(circle at top, rgba(251, 191, 36, 0.15), transparent) !important;
    }

    .elite-border::after {
      content: '';
      position: absolute;
      inset: -4px;
      background: linear-gradient(45deg, var(--titan-gold), #f59e0b, var(--titan-gold));
      z-index: -1;
      border-radius: 45px;
      filter: blur(15px);
      opacity: 0.3;
      animation: pulse-aura 3s infinite alternate;
    }

    @keyframes pulse-aura {
      0% { opacity: 0.2; transform: scale(0.98); }
      100% { opacity: 0.5; transform: scale(1.02); }
    }

    /* 6. محرك الـ XP الماسي - Diamond XP Shimmer */
    .xp-shimmer {
      background: linear-gradient(90deg, #fff, var(--titan-cyan), var(--titan-gold), #fff);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: shimmer-xp 4s linear infinite;
      font-family: 'Orbitron', sans-serif;
      font-weight: 900;
      text-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
    }

    @keyframes shimmer-xp {
      to { background-position: 200% center; }
    }

    /* 7. الشبكة الأرضية التفاعلية - 3D Cyber Grid 2.0 */
    .cyber-floor {
      position: fixed;
      bottom: -150px;
      width: 250%;
      height: 600px;
      background-image: 
        linear-gradient(rgba(59, 130, 246, 0.15) 1px, transparent 1px),
        linear-gradient(90deg, rgba(59, 130, 246, 0.15) 1px, transparent 1px);
      background-size: 50px 50px;
      transform: perspective(1000px) rotateX(65deg) translateX(-20%);
      opacity: 0.2;
      z-index: -1;
      mask-image: linear-gradient(to top, black 20%, transparent 80%);
      animation: grid-move 20s linear infinite;
    }

    @keyframes grid-move {
      from { background-position: 0 0; }
      to { background-position: 0 50px; }
    }

    /* 8. استجابة الموبايل الخارقة - Ultra Responsive System */
    @media (max-width: 640px) {
      .syncopate { font-size: 2.2rem !important; }
      .colossus-card { padding: 25px !important; border-radius: 30px; }
      .container { padding: 0 20px !important; }
      .grid-cols-5 { grid-template-columns: 1fr !important; gap: 40px !important; }
      .emperor-glow { scale: 1 !important; margin-bottom: 50px; }
      .xp-shimmer { font-size: 1.8rem !important; }
      
      /* إخفاء العناصر الثقيلة في الموبايل */
      .bg-text-giant { display: none !important; }
      .cyber-floor { opacity: 0.1; }
    }

    /* 9. شاشات التابلت - Tablet Optimization */
    @media (min-width: 641px) and (max-width: 1024px) {
      .grid-cols-5 { grid-template-columns: repeat(2, 1fr) !important; gap: 30px; }
      .emperor-glow { grid-column: span 2; scale: 1.1 !important; }
    }

    /* 10. ذرات الغبار الكوني - Cosmic Dust Particles */
    .particle-bg {
      position: absolute;
      width: 3px;
      height: 3px;
      background: #fff;
      border-radius: 50%;
      box-shadow: 0 0 10px var(--titan-blue);
      pointer-events: none;
      z-index: 0;
      animation: float-particle var(--duration) linear infinite;
    }

    @keyframes float-particle {
      0% { transform: translateY(0) scale(0); opacity: 0; }
      20% { opacity: 0.8; }
      100% { transform: translateY(-100vh) scale(1.5); opacity: 0; }
    }

    /* 11. تأثير شريط الحالة - Status Bar FX */
    .status-pulse {
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 15px #10b981;
      animation: status-glow 1.5s infinite;
    }

    @keyframes status-glow {
      0% { transform: scale(1); opacity: 1; }
      100% { transform: scale(2.5); opacity: 0; }
    }

    /* 12. محرك حركة الصور - Avatar Physics */
    .avatar-wrapper img {
      transition: all 0.5s var(--ease-titan);
      filter: grayscale(20%) contrast(110%);
    }

    .colossus-card:hover .avatar-wrapper img {
      filter: grayscale(0%) contrast(120%);
      transform: scale(1.1) rotateZ(3deg);
    }

    /* 13. تأثير أزرار النخبة - Elite Button Mechanics */
    .support-btn {
      position: relative;
      overflow: hidden;
      z-index: 1;
    }

    .support-btn::before {
      content: '';
      position: absolute;
      top: 50%; left: 50%;
      width: 300%; height: 300%;
      background: radial-gradient(circle, var(--titan-blue), transparent 70%);
      transform: translate(-50%, -50%) scale(0);
      transition: 0.6s var(--ease-titan);
      z-index: -1;
    }

    .support-btn:hover::before {
      transform: translate(-50%, -50%) scale(1);
    }

    /* 14. تخصيص شريط التمرير - Scrollbar Master */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: var(--titan-bg); }
    ::-webkit-scrollbar-thumb { 
      background: linear-gradient(var(--titan-blue), var(--titan-purple)); 
      border-radius: 10px;
    }

    /* 15. تأثير الـ Glitch للنصوص - Text Glitch FX */
    .glitch-hover:hover {
      animation: glitch 0.3s cubic-bezier(.25,.46,.45,.94) both infinite;
    }

    @keyframes glitch {
      0% { transform: translate(0); }
      20% { transform: translate(-2px, 2px); }
      40% { transform: translate(-2px, -2px); }
      60% { transform: translate(2px, 2px); }
      80% { transform: translate(2px, -2px); }
      100% { transform: translate(0); }
    }

    /* 16. تأثير التحميل الشبكي - Loading Skeleton 2026 */
    .skeleton-box {
      background: linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.08), rgba(255,255,255,0.02));
      background-size: 200% 100%;
      animation: skeleton-load 1.5s infinite;
    }


/* ========================================================== */
    /* 🌌 TITAN EXPANSION PACK - PART 2 (THE FINAL 500+ LINES)    */
    /* ========================================================== */

    /* 17. نظام "توهج الحواف" الديناميكي - Edge Refraction */
    .colossus-card::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      padding: 2px;
      background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent 50%, rgba(59, 130, 246, 0.2));
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
    }

    /* 18. تأثير "البصمة الرقمية" للخلفية - Cyber DNA Pattern */
    .cyber-dna {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background-image: radial-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px);
      background-size: 30px 30px;
      z-index: -1;
    }

    /* 19. نظام الرتب المتقدم - Advanced Ranking Colors */
    .rank-1 { --rank-color: var(--titan-gold); --rank-shadow: rgba(251, 191, 36, 0.5); }
    .rank-2 { --rank-color: #e2e8f0; --rank-shadow: rgba(226, 232, 240, 0.4); }
    .rank-3 { --rank-color: #cd7f32; --rank-shadow: rgba(205, 127, 50, 0.4); }

    /* 20. شريط الطاقة المتفاعل - Power Progress Bar */
    .power-bar-container {
      width: 100%;
      height: 4px;
      background: rgba(255,255,255,0.05);
      border-radius: 10px;
      overflow: hidden;
      margin-top: 15px;
    }

    .power-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--titan-blue), var(--titan-cyan));
      box-shadow: 0 0 10px var(--titan-cyan);
      position: relative;
    }

    .power-bar-fill::after {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
      animation: bar-shine 2s infinite;
    }

    @keyframes bar-shine {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }

    /* 21. تأثير "العمق البصري" للأفاتار - Avatar Depth FX */
    .avatar-wrapper {
      position: relative;
      perspective: 1000px;
    }

    .avatar-wrapper .glow-ring {
      position: absolute;
      inset: -10px;
      border: 2px solid var(--titan-blue);
      border-radius: 40px;
      opacity: 0;
      transform: scale(0.8);
      transition: 0.5s var(--ease-titan);
    }

    .colossus-card:hover .glow-ring {
      opacity: 0.3;
      transform: scale(1.05) rotate(5deg);
      animation: ring-pulse 2s infinite alternate;
    }

    @keyframes ring-pulse {
      to { transform: scale(1.1) rotate(-5deg); opacity: 0.6; }
    }

    /* 22. هندسة الموبايل المتطرفة - Extreme Mobile Engineering */
    @media (max-width: 480px) {
      /* تحويل الهيدر لنظام مضغوط */
      header { padding-top: 60px !important; padding-bottom: 40px !important; }
      
      /* نظام بطاقات الموبايل السريع */
      .colossus-card {
        margin-bottom: 20px !important;
        padding: 20px !important;
        border-radius: 25px !important;
      }

      /* تحسين استجابة اللمس */
      .colossus-card:active {
        transform: scale(0.95) !important;
        background: rgba(59, 130, 246, 0.1);
      }

      /* نصوص الموبايل الذكية */
      .mobile-text-sm { font-size: 12px !important; }
      .mobile-hide { display: none !important; }
      
      /* جعل الشبكة الأرضية أكثر هدوءًا لتوفير البطارية */
      .cyber-floor { height: 200px; opacity: 0.05; }
    }

    /* 23. تأثير "تشتت الضوء" عند التمرير - Scroll Parallax Light */
    .parallax-blob {
      position: absolute;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(59, 130, 246, 0.05), transparent 70%);
      border-radius: 50%;
      pointer-events: none;
      z-index: -1;
    }

    /* 24. أنيميشن ظهور العناصر - Entrance Animations */
    .reveal-item {
      opacity: 0;
      transform: translateY(30px);
      animation: reveal-up 0.8s var(--ease-titan) forwards;
    }

    @keyframes reveal-up {
      to { opacity: 1; transform: translateY(0); }
    }

    /* 25. تأثير "الدرع الرقمي" - Digital Shield FX */
    .shield-icon {
      filter: drop-shadow(0 0 5px var(--titan-blue));
      animation: shield-float 3s ease-in-out infinite;
    }

    @keyframes shield-float {
      0%, 100% { transform: translateY(0) rotate(0); }
      50% { transform: translateY(-5px) rotate(5deg); }
    }

    /* 26. نظام الـ Tooltip السيبراني - Cyber Tooltip */
    [data-tooltip] {
      position: relative;
    }

    [data-tooltip]::after {
      content: attr(data-tooltip);
      position: absolute;
      bottom: 120%;
      left: 50%;
      transform: translateX(-50%) translateY(10px);
      background: var(--glass);
      backdrop-filter: blur(10px);
      padding: 8px 15px;
      border-radius: 10px;
      font-size: 10px;
      white-space: nowrap;
      opacity: 0;
      transition: 0.3s;
      border: 1px solid var(--titan-blue);
      pointer-events: none;
    }

    [data-tooltip]:hover::after {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }

    /* 27. تحسينات العرض العريض - Ultra-Wide Fixes */
    @media (min-width: 2000px) {
      .container { max-width: 1800px !important; }
      .colossus-card { zoom: 1.2; }
    }

    /* 28. تأثير "انفجار النيون" عند النقر - Click Blast FX */
    .click-effect {
      position: absolute;
      border: 2px solid var(--titan-blue);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      animation: ripple 0.6s linear;
      pointer-events: none;
    }

    @keyframes ripple {
      0% { width: 0; height: 0; opacity: 1; }
      100% { width: 200px; height: 200px; opacity: 0; }
    }

    /* 29. تفاصيل تذييل الصفحة - Footer Engineering */
    footer .link-glow:hover {
      color: var(--titan-cyan);
      text-shadow: 0 0 10px var(--titan-cyan);
      letter-spacing: 2px;
      transition: 0.4s;
    }

    /* 30. نظام "الوضع الليلي المتطرف" - Pure Black OLED Support */
    @media (prefers-color-scheme: dark) {
      body { background: #000; }
      .colossus-card { background: linear-gradient(135deg, rgba(255,255,255,0.02) 0%, transparent 100%); }
    }

    /* 31. تأثير "النبض المعلوماتي" للرتب - Rank Pulse */
    .rank-tag {
      padding: 4px 12px;
      background: rgba(255,255,255,0.05);
      border-radius: 20px;
      font-size: 10px;
      font-weight: 900;
      border: 1px solid rgba(255,255,255,0.1);
      transition: 0.3s;
    }

    .colossus-card:hover .rank-tag {
      background: var(--titan-blue);
      border-color: var(--titan-cyan);
      color: white;
    }
    /* ========================================================== */
    /* 🚀 TITAN KERNEL - PART 3 (THE FINAL SUPREMACY)             */
    /* ========================================================== */

    /* 32. نظام "النيون المتدفق" للحواف - Flowing Neon Border */
    .elite-border::before {
      content: '';
      position: absolute;
      inset: -2px;
      background: conic-gradient(from 0deg, 
        transparent, 
        var(--titan-blue), 
        var(--titan-cyan), 
        var(--titan-purple), 
        transparent 50%);
      animation: rotate-neon 4s linear infinite;
      border-radius: inherit;
      z-index: -1;
    }

    @keyframes rotate-neon {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* 33. تأثير "تداخل الطبقات" - Layered Parallax FX */
    .colossus-card > * {
      transform: translateZ(20px); /* دفع المحتوى للأمام في الفضاء الثلاثي الأبعاد */
    }

    /* 34. نظام الـ "Glow" الذكي للمؤشر - Smart Cursor Glow */
    .glow-cursor {
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%);
      position: fixed;
      top: var(--y);
      left: var(--x);
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 999;
      mix-blend-mode: screen;
    }

    /* 35. تحسينات الموبايل "المجهرية" - Micro-Mobile Optimization (iPhone SE / Fold) */
    @media (max-width: 380px) {
      .syncopate { font-size: 1.8rem !important; }
      .xp-shimmer { font-size: 1.5rem !important; }
      .colossus-card { padding: 15px !important; }
      .avatar-wrapper { width: 100px !important; height: 100px !important; }
      .badge-chip { font-size: 8px !important; padding: 3px 8px !important; }
    }

    /* 36. نظام "النبض المعلوماتي" للرتب - Rank Pulse (Dynamic) */
    .rank-icon-wrapper {
      position: relative;
      display: inline-block;
    }

    .rank-icon-wrapper::after {
      content: '';
      position: absolute;
      inset: -5px;
      border: 1px solid var(--rank-color, var(--titan-blue));
      border-radius: 50%;
      animation: icon-pulse 2s infinite;
      opacity: 0;
    }

    @keyframes icon-pulse {
      0% { transform: scale(1); opacity: 0.8; }
      100% { transform: scale(2); opacity: 0; }
    }

    /* 37. تأثير "زجاج السايبر" للمدخلات - Cyber Glass Input */
    .cyber-input {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      transition: all 0.4s var(--ease-titan);
    }

    .cyber-input:focus {
      border-color: var(--titan-blue);
      box-shadow: 0 0 20px rgba(59, 130, 246, 0.2);
      background: rgba(255, 255, 255, 0.05);
    }

    /* 38. نظام "الأوسمة المتوهجة" - Glowing Badges */
    .badge-mastery {
      position: relative;
      overflow: hidden;
      border: 1px solid var(--titan-cyan);
      box-shadow: inset 0 0 10px rgba(0, 242, 255, 0.2);
    }

    .badge-mastery::after {
      content: '';
      position: absolute;
      top: -100%;
      left: -100%;
      width: 300%;
      height: 300%;
      background: linear-gradient(45deg, transparent, rgba(0, 242, 255, 0.1), transparent);
      animation: badge-sweep 3s infinite;
    }

    @keyframes badge-sweep {
      0% { transform: translate(-100%, -100%) rotate(45deg); }
      100% { transform: translate(100%, 100%) rotate(45deg); }
    }

    /* 39. تأثير "التلاشي الشبكي" عند التمرير - Scroll Mesh Fade */
    .scroll-reveal {
      mask-image: linear-gradient(to bottom, 
        transparent, 
        black 10%, 
        black 90%, 
        transparent);
    }

    /* 40. نظام "التعرف على التوجه" - Horizontal Orientation Fix */
    @media (orientation: landscape) and (max-height: 500px) {
      .colossus-card { display: flex; align-items: center; text-align: right; gap: 20px; }
      .avatar-wrapper { width: 80px !important; height: 80px !important; margin: 0 !important; }
      header { padding: 20px 0 !important; }
    }

    /* 41. تأثير "العمق الحركي" للخلفية - Kinetic Background */
    .bg-mesh {
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      background: 
        radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.1) 0px, transparent 50%),
        radial-gradient(at 100% 0%, rgba(139, 92, 246, 0.1) 0px, transparent 50%);
      z-index: -3;
    }

    /* 42. تخصيصات الطباعة (للمحترفين) - Print Engine */
    @media print {
      body { background: white; color: black; }
      .colossus-card { border: 1px solid #eee; break-inside: avoid; }
      .cyber-floor, .particle-bg { display: none; }
    }

    /* 43. نظام "الاهتزاز الرقمي" عند الخطأ - Digital Jitter */
    .jitter-fx:hover {
      animation: jitter 0.2s infinite;
    }

    @keyframes jitter {
      0% { transform: translate(0,0); }
      25% { transform: translate(1px, -1px); }
      50% { transform: translate(-1px, 1px); }
      75% { transform: translate(1px, 1px); }
      100% { transform: translate(0,0); }
    }

    /* 44. تحسينات الـ Tooltip للموبايل */
    @media (hover: none) {
      [data-tooltip]::after { display: none; }
    }

    /* 45. نظام الألوان المتغيرة للـ XP بناءً على القوة */
    .xp-low { color: #94a3b8; }
    .xp-mid { color: var(--titan-cyan); }
    .xp-high { color: var(--titan-gold); text-shadow: 0 0 15px rgba(251, 191, 36, 0.5); }
    @keyframes skeleton-load {
      from { background-position: 150% 0; }
      to { background-position: -50% 0; }
    }
  ` }} />
);

// ==========================================================
// 🏆 THE MASTER COMPONENT: HALL OF LEGENDS (COLOSSUS)
// ==========================================================
const HallOfLegends = () => {
  const [bigFive, setBigFive] = useState([]);
  const [strivers, setStrivers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  // 📡 High-Frequency Data Sync
  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("xp", "desc"), limit(20));
    const unsub = onSnapshot(q, (snapshot) => {
      const allData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBigFive(allData.slice(0, 5));
      setStrivers(allData.slice(5, 15));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // 🖱️ Interaction Handler
  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    mouseX.set(clientX);
    mouseY.set(clientY);
  };

  const getRankData = (rank) => {
    const titles = {
      1: { title: "الإمبراطور الأعظم", color: "var(--titan-gold)", icon: <Crown size={40}/> },
      2: { title: "جنرال النخبة", color: "#e2e8f0", icon: <Trophy size={32}/> },
      3: { title: "قائد الفيلق", color: "#cd7f32", icon: <Medal size={32}/> },
      4: { title: "فارس تيتان", color: "#3b82f6", icon: <ShieldCheck size={28}/> },
      5: { title: "مقاتل النخبة", color: "#3b82f6", icon: <Target size={28}/> },
    };
    return titles[rank] || { title: "مقاتل صاعد", color: "#64748b", icon: <Zap size={20}/> };
  };

  return (
    <div className="min-h-screen relative overflow-hidden" onMouseMove={handleMouseMove}>
      <TitanStyles />
      <div className="cyber-floor" />
      
      {/* Dynamic Background Blobs */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[-1]">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[150px] rounded-full" />
      </div>

      {/* Spotlight Effect */}
      <motion.div 
        className="fixed w-[600px] h-[600px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none z-[-1]"
        style={{ left: mouseX, top: mouseY, transform: 'translate(-50%, -50%)' }}
      />

      {/* Top Navigation Protocol */}
      <nav className="p-10 flex justify-between items-center sticky top-0 z-[500] backdrop-blur-3xl border-b border-white/5">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-[25px] bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
            <Fingerprint className="text-blue-500" size={30} />
          </div>
          <div className="hidden sm:block">
            <h1 className="syncopate font-black text-2xl tracking-tighter">TITAN <span className="text-blue-500">COLOSSUS</span></h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.5em] mt-1">Global Honor Protocol 2.6.0</p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="bg-white/5 px-6 py-3 rounded-2xl border border-white/5 flex items-center gap-4">
            <Activity className="text-green-500 animate-pulse" size={18} />
            <div className="text-right">
               <p className="text-[9px] text-gray-500 font-black uppercase">Sync State</p>
               <p className="text-xs font-bold orbitron">LIVE_DATA</p>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6">
        
        {/* --- MEGA HERO SECTION --- */}
        <header className="py-32 text-center relative">
          <motion.div 
            initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white/5 border border-white/10 mb-10"
          >
            <Box size={14} className="text-blue-500" />
            <span className="orbitron text-[10px] font-black tracking-[0.3em] text-blue-400">AUTHORIZED ACCESS ONLY</span>
          </motion.div>
          
          <h2 className="syncopate text-6xl md:text-[140px] font-black leading-none mb-12 tracking-tighter">
            THE <span className="xp-shimmer">LEGENDS</span>
          </h2>
          
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
            <div className="p-6 rounded-3xl border border-white/5 bg-white/[0.02]">
               <h5 className="orbitron text-gray-500 text-[10px] mb-2 font-black">TOTAL ELIGIBLE</h5>
               <p className="text-3xl font-black orbitron">{strivers.length + bigFive.length + 100}+</p>
            </div>
            <div className="p-6 rounded-3xl border border-white/5 bg-white/[0.02]">
               <h5 className="orbitron text-gray-500 text-[10px] mb-2 font-black">SEASON STATUS</h5>
               <p className="text-3xl font-black orbitron text-blue-500">ACTIVE</p>
            </div>
            <div className="p-6 rounded-3xl border border-white/5 bg-white/[0.02]">
               <h5 className="orbitron text-gray-500 text-[10px] mb-2 font-black">RESET CLOCK</h5>
               <p className="text-3xl font-black orbitron">14D : 22H</p>
            </div>
          </div>
        </header>

        {/* --- THE BIG FIVE: SOVEREIGN GRID --- */}
        <section className="mb-60">
          <div className="flex flex-col items-center mb-24">
             <div className="w-20 h-1 bg-blue-600 rounded-full mb-6" />
             <h3 className="syncopate text-4xl font-black tracking-widest text-center">THE BIG FIVE</h3>
             <p className="text-gray-500 font-bold mt-4 uppercase text-xs tracking-[0.4em]">Elite Commanders of the Season</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
            {bigFive.map((student, index) => {
              const rank = getRankData(index + 1);
              return (
                <motion.div 
                  key={student.id}
                  initial={{ scale: 0.9, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`colossus-card p-10 rounded-[50px] text-center group ${index === 0 ? 'emperor-glow lg:scale-125 z-50' : 'mt-10 lg:mt-20'}`}
                >
                  <div className="absolute top-6 right-6 opacity-20 group-hover:opacity-100 transition-opacity">
                    {rank.icon}
                  </div>
                  
                  <div className="relative mb-8">
                    <div className={`w-36 h-36 mx-auto rounded-[45px] border-4 p-2 relative z-10 ${index === 0 ? 'border-titan-gold shadow-[0_0_30px_rgba(251,191,36,0.3)]' : 'border-white/10'}`}>
                      <img src={student.photoURL} className="w-full h-full object-cover rounded-[35px]" alt="" />
                    </div>
                    {index === 0 && <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border-2 border-dashed border-titan-gold/30 rounded-full scale-150" />}
                  </div>

                  <h4 className="orbitron font-black text-xl mb-2 truncate px-2">{student.displayName}</h4>
                  <p className="text-[10px] font-black tracking-[0.2em] mb-6" style={{ color: rank.color }}>{rank.title}</p>
                  
                  <div className="xp-shimmer text-3xl mb-8">{student.xp?.toLocaleString()}</div>
                  
                  <div className="flex flex-wrap justify-center gap-2 mb-8">
                    <span className="badge-chip">Level {Math.floor((student.xp || 0) / 1000)}</span>
                    <span className="badge-chip">Verified</span>
                  </div>

                  <motion.button 
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    className="w-full py-4 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                  >
                    View Arsenal
                  </motion.button>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* --- THE STRIVERS: RISING CLUB --- */}
        <section className="max-w-6xl mx-auto mb-60">
           <div className="colossus-card p-12 rounded-[60px] border-dashed border-white/10">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-10 mb-20">
                 <div className="text-center lg:text-right">
                    <h3 className="syncopate text-3xl font-black flex items-center gap-4 justify-center lg:justify-start">
                       <TrendingUp className="text-blue-500" size={32} /> THE STRIVERS
                    </h3>
                    <p className="text-gray-500 font-bold mt-2">عشرة فرسان يقتربون من كسر حاجز الـ Big Five</p>
                 </div>
                 
                 <div className="relative w-full lg:w-96">
                    <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-600" />
                    <input 
                      type="text" 
                      placeholder="بحث في البروتوكول..." 
                      className="w-full bg-black/40 border border-white/10 h-16 rounded-3xl pr-16 pl-6 font-bold focus:border-blue-500 outline-none transition-all"
                      onChange={(e) => setSearch(e.target.value)}
                    />
                 </div>
              </div>

              <div className="grid gap-6">
                <AnimatePresence>
                  {strivers.filter(s => s.displayName?.toLowerCase().includes(search.toLowerCase())).map((student, index) => (
                    <motion.div 
                      key={student.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-6 rounded-[30px] bg-white/[0.01] border border-white/5 group hover:bg-white/[0.03] transition-all"
                    >
                      <div className="flex items-center gap-8">
                        <span className="orbitron font-black text-2xl text-gray-800 w-12 text-center group-hover:text-blue-500 transition-colors">#{index + 6}</span>
                        <div className="relative">
                          <img src={student.photoURL} className="w-20 h-20 rounded-[25px] object-cover border border-white/10" alt="" />
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-[10px] font-black">
                            <Zap size={10} />
                          </div>
                        </div>
                        <div>
                          <h5 className="font-black text-xl mb-1">{student.displayName}</h5>
                          <div className="flex gap-4">
                            <span className="text-[10px] font-black text-gray-500 flex items-center gap-1 uppercase"><Command size={10}/> Striver Class</span>
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{student.xp} XP Points</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="hidden md:flex items-center gap-10">
                         <div className="text-right">
                            <p className="text-[9px] font-black text-gray-600 uppercase">Distance to Top 5</p>
                            <p className="text-xs font-black text-white">{Math.abs(student.xp - bigFive[4]?.xp)} XP Needed</p>
                         </div>
                         <button className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                            <Heart size={20} />
                         </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
           </div>
        </section>

        {/* --- GLOBAL TICKER --- */}
        <div className="fixed bottom-0 left-0 right-0 bg-blue-600 py-3 z-[1000] border-t border-white/20">
           <div className="flex whitespace-nowrap animate-marquee">
              {[...Array(20)].map((_, i) => (
                <span key={i} className="mx-16 text-[10px] font-black uppercase tracking-[0.5em] text-white orbitron">
                  System Authorized • Top {bigFive.length} Command the Season • Progress is Mandatory • Glory to the Hardworking •
                </span>
              ))}
           </div>
        </div>
      </div>

      {/* --- FOOTER EXCELLENCE --- */}
      <footer className="mt-40 py-40 border-t border-white/5 text-center relative">
         <div className="flex justify-center gap-12 mb-12 opacity-10">
            <Lock size={40} /> <Ghost size={40} /> <Cpu size={40} /> <ZapOff size={40} />
         </div>
         <p className="orbitron text-[11px] tracking-[1.5em] text-gray-700 mb-6 uppercase">MAFA ACADEMY SECURE NETWORK 2026</p>
         <div className="flex justify-center gap-2">
            <div className="w-1 h-1 bg-blue-600 rounded-full" />
            <div className="w-12 h-1 bg-blue-600 rounded-full" />
            <div className="w-1 h-1 bg-blue-600 rounded-full" />
         </div>
      </footer>

    </div>
  );
};

export default HallOfLegends;
