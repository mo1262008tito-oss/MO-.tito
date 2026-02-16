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
/* ========================================================== */
    /* 🌌 THE COLOSSUS ARCHITECTURE - MEGA CSS UPDATE 2026       */
    /* ========================================================== */

    /* 1. إعدادات الصفحة الأساسية - Global Body Logic */
    body {
      background-color: var(--titan-bg);
      color: #fff;
      font-family: 'Cairo', sans-serif;
      overflow-x: hidden;
      cursor: crosshair; /* تغيير الماوس لنمط استهدافي */
    }

    .syncopate { font-family: 'Syncopate', sans-serif; }
    .orbitron { font-family: 'Orbitron', sans-serif; }

    /* 2. هندسة الأرضية الرقمية - Cyber Floor */
    .cyber-floor {
      position: fixed;
      bottom: 0; left: 0; width: 100%; height: 40vh;
      background: linear-gradient(to top, rgba(59, 130, 246, 0.05) 0%, transparent 100%);
      mask-image: radial-gradient(ellipse at center, black, transparent 80%);
      z-index: -1;
      perspective: 1000px;
    }

    .cyber-floor::after {
      content: '';
      position: absolute;
      inset: 0;
      background-image: 
        linear-gradient(rgba(59, 130, 246, 0.2) 1px, transparent 1px),
        linear-gradient(90deg, rgba(59, 130, 246, 0.2) 1px, transparent 1px);
      background-size: 50px 50px;
      transform: rotateX(45deg);
      animation: floor-flow 20s linear infinite;
    }

    @keyframes floor-flow {
      to { background-position: 0 1000px; }
    }

    /* 3. هندسة البطاقة العملاقة - Colossus Card Spec */
    .colossus-card {
      position: relative;
      background: var(--glass);
      backdrop-filter: blur(25px) saturate(200%);
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      transition: all 0.6s var(--ease-titan);
    }

    .colossus-card:hover {
      border-color: var(--titan-blue);
      transform: translateY(-10px) scale(1.02);
      box-shadow: 0 0 40px rgba(59, 130, 246, 0.2);
    }

    /* 4. وهج الإمبراطور (المركز الأول) - Emperor Glow */
    .emperor-glow {
      background: linear-gradient(135deg, rgba(251, 191, 36, 0.05) 0%, rgba(15, 23, 42, 0.9) 100%) !important;
      border: 1px solid rgba(251, 191, 36, 0.3) !important;
      z-index: 100;
    }

    .emperor-glow::before {
      content: '';
      position: absolute;
      inset: -2px;
      background: linear-gradient(45deg, var(--titan-gold), transparent, var(--titan-gold));
      border-radius: inherit;
      z-index: -1;
      animation: border-rotate 4s linear infinite;
      opacity: 0.5;
    }

    @keyframes border-rotate {
      0% { filter: hue-rotate(0deg); }
      100% { filter: hue-rotate(360deg); }
    }

    /* 5. تأثير الـ XP المتوهج - XP Shimmer Effect */
    .xp-shimmer {
      font-family: 'Orbitron', sans-serif;
      font-weight: 900;
      background: linear-gradient(90deg, #fff, var(--titan-blue), #fff);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: shimmer 3s linear infinite;
      filter: drop-shadow(0 0 10px rgba(59, 130, 246, 0.5));
    }

    @keyframes shimmer {
      to { background-position: 200% center; }
    }

    /* 6. رقائق الأوسمة - Badge Chips */
    .badge-chip {
      padding: 4px 12px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 100px;
      font-size: 9px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--titan-blue);
    }

    /* 7. شريط الأخبار المتحرك السفلي - Global Ticker Marquee */
    .animate-marquee {
      display: flex;
      animation: marquee 40s linear infinite;
    }

    @keyframes marquee {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }

    /* 8. هندسة المدخلات (Search Input) */
    input::placeholder {
      color: rgba(255, 255, 255, 0.2);
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 2px;
    }

    /* 9. نظام الجزيئات المتحركة (Background Blobs) */
    .blur-blob {
      filter: blur(150px);
      mix-blend-mode: screen;
      opacity: 0.3;
      animation: blob-float 20s infinite alternate;
    }

    @keyframes blob-float {
      from { transform: translate(0, 0) scale(1); }
      to { transform: translate(100px, 50px) scale(1.2); }
    }

    /* 10. تصميم الـ Scrollbar الحربي */
    ::-webkit-scrollbar {
      width: 5px;
    }
    ::-webkit-scrollbar-track {
      background: var(--titan-bg);
    }
    ::-webkit-scrollbar-thumb {
      background: var(--titan-blue);
      border-radius: 10px;
      box-shadow: var(--glow-blue);
    }

    /* 11. تأثير "النبض النيون" للأيقونات */
    .animate-pulse-cyan {
      animation: pulse-cyan 2s infinite;
    }

    @keyframes pulse-cyan {
      0% { filter: drop-shadow(0 0 2px var(--titan-blue)); }
      50% { filter: drop-shadow(0 0 15px var(--titan-blue)); }
      100% { filter: drop-shadow(0 0 2px var(--titan-blue)); }
    }

    /* 12. تحسينات الموبايل المتطرفة */
    @media (max-width: 768px) {
      .syncopate { font-size: 2.5rem !important; }
      .colossus-card { padding: 30px 15px !important; margin-top: 20px !important; }
      .emperor-glow { transform: scale(1) !important; }
      .container { padding: 0 20px !important; }
    }

    /* 13. نظام "توزيع الضوء" للحواف */
    .border-white\/5 {
      border-color: rgba(255, 255, 255, 0.05) !important;
    }

    /* 14. تأثير "اللمعان المعدني" للصور */
    img {
      filter: grayscale(20%) contrast(110%);
      transition: 0.5s;
    }
    .group:hover img {
      filter: grayscale(0%) contrast(120%);
      transform: scale(1.1);
    }

    /* 15. نظام الـ "View Arsenal" Button */
    button {
      position: relative;
      overflow: hidden;
    }
    button::after {
      content: '';
      position: absolute;
      top: -50%; left: -50%; width: 200%; height: 200%;
      background: linear-gradient(transparent, rgba(255,255,255,0.1), transparent);
      transform: rotate(45deg);
      transition: 0.5s;
    }
    button:hover::after {
      left: 100%;
    }
/* ========================================================== */
    /* 🛡️ THE TITAN COLOSSUS - ARCHITECTURE PHASE 2 (FINAL OVERLOAD) */
    /* ========================================================== */

    /* 1. نظام "توهج العرش" للمركز الأول - Emperor Sovereign Logic */
    .emperor-glow {
      position: relative;
      background: radial-gradient(circle at top right, rgba(251, 191, 36, 0.15), transparent 60%) !important;
      border: 2px solid rgba(251, 191, 36, 0.4) !important;
      box-shadow: 
        0 0 50px rgba(251, 191, 36, 0.1),
        inset 0 0 20px rgba(251, 191, 36, 0.05) !important;
    }

    .emperor-glow::after {
      content: 'SOVEREIGN UNIT';
      position: absolute;
      top: -15px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--titan-gold);
      color: #000;
      font-family: 'Orbitron', sans-serif;
      font-size: 8px;
      font-weight: 900;
      padding: 2px 12px;
      border-radius: 4px;
      letter-spacing: 2px;
      box-shadow: 0 0 15px var(--titan-gold);
    }

    /* 2. هندسة "الدرع الضوئي" للبطاقات - Colossus Card Mechanics */
    .colossus-card {
      overflow: hidden;
      backdrop-filter: blur(30px) saturate(180%) !important;
      -webkit-backdrop-filter: blur(30px) saturate(180%);
      border: 1px solid rgba(255, 255, 255, 0.08);
      transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1);
    }

    .colossus-card::before {
      content: '';
      position: absolute;
      top: -50%; left: -50%;
      width: 200%; height: 200%;
      background: conic-gradient(
        from 0deg,
        transparent 0%,
        rgba(59, 130, 246, 0.1) 25%,
        transparent 50%
      );
      animation: rotate-scanner 10s linear infinite;
      pointer-events: none;
    }

    @keyframes rotate-scanner {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* 3. تأثير "البريق المعدني" للنقاط - XP Shimmer Master */
    .xp-shimmer {
      font-family: 'Orbitron', sans-serif;
      font-weight: 900;
      font-size: 2.5rem;
      background: linear-gradient(
        to right, 
        #ffffff 20%, 
        var(--titan-cyan) 40%, 
        var(--titan-blue) 60%, 
        #ffffff 80%
      );
      background-size: 200% auto;
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: xp-wave 4s linear infinite;
      filter: drop-shadow(0 0 10px rgba(0, 242, 255, 0.3));
    }

    @keyframes xp-wave {
      to { background-position: 200% center; }
    }

    /* 4. نظام "الرقائق الرقمية" - Badge Chip Aesthetics */
    .badge-chip {
      background: rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(59, 130, 246, 0.3);
      padding: 6px 14px;
      font-family: 'Orbitron', sans-serif;
      font-size: 10px;
      font-weight: 700;
      color: var(--titan-cyan);
      text-transform: uppercase;
      letter-spacing: 1px;
      clip-path: polygon(10% 0, 100% 0, 90% 100%, 0% 100%);
      transition: 0.3s;
    }

    .badge-chip:hover {
      background: var(--titan-blue);
      color: #fff;
      box-shadow: 0 0 15px var(--titan-blue);
    }

    /* 5. ميكانيكا الـ "Search" المتقدمة - Tactical Search Engine */
    input[type="text"] {
      background: rgba(15, 23, 42, 0.8) !important;
      border: 1px solid rgba(59, 130, 246, 0.2) !important;
      color: #fff !important;
      font-family: 'Cairo', sans-serif;
      box-shadow: inset 0 2px 15px rgba(0,0,0,0.5);
      transition: all 0.4s var(--ease-titan);
    }

    input[type="text"]:focus {
      border-color: var(--titan-cyan) !important;
      box-shadow: 0 0 25px rgba(0, 242, 255, 0.15), inset 0 2px 15px rgba(0,0,0,0.5);
      transform: scale(1.02);
    }

    /* 6. نظام "شريط الأنباء" - Global Ticker Marquee Logic */
    .animate-marquee {
      display: inline-flex;
      white-space: nowrap;
      animation: marquee-move 60s linear infinite;
    }

    @keyframes marquee-move {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }

    /* 7. تأثير "النبض الحيوي" للأيقونات - Bio-Pulse FX */
    .animate-pulse {
      animation: titan-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    @keyframes titan-pulse {
      0%, 100% { opacity: 1; transform: scale(1); filter: brightness(1); }
      50% { opacity: .7; transform: scale(1.1); filter: brightness(1.5); }
    }

    /* 8. هندسة "الخلفية العميقة" - Deep Nebula Background */
    .fixed.top-0.left-0 {
      background: radial-gradient(circle at 50% 50%, #020617 0%, #000 100%);
    }

    /* 9. نظام الـ "Arsenal" Button - Tactical Button Spec */
    .group:hover .py-4 {
      background: linear-gradient(90deg, var(--titan-blue), var(--titan-purple)) !important;
      color: #fff !important;
      border-color: transparent !important;
      letter-spacing: 5px;
      box-shadow: 0 10px 30px rgba(59, 130, 246, 0.3);
    }

    /* 10. هندسة القائمة الجانبية (The Strivers) */
    .strivers-list-item {
      position: relative;
      background: linear-gradient(90deg, rgba(255,255,255,0.01) 0%, transparent 100%);
      border: 1px solid rgba(255,255,255,0.05);
      border-right: 4px solid transparent;
      transition: 0.4s;
    }

    .strivers-list-item:hover {
      border-right-color: var(--titan-blue);
      background: rgba(59, 130, 246, 0.05);
      padding-right: 40px !important;
    }

    /* 11. نظام "التعرف الرقمي" لصور المستخدمين */
    img.object-cover {
      filter: drop-shadow(0 0 10px rgba(0,0,0,0.5));
      mask-image: linear-gradient(to bottom, black 90%, transparent);
      -webkit-mask-image: linear-gradient(to bottom, black 90%, transparent);
    }

    /* 12. تأثير "الغبار الكوني" - Space Dust Particles */
    .container::after {
      content: "";
      position: fixed;
      inset: 0;
      background-image: radial-gradient(white 1px, transparent 1px);
      background-size: 100px 100px;
      opacity: 0.03;
      pointer-events: none;
      z-index: 1;
    }

    /* 13. تطوير الـ Navigation - Header Protocol */
    nav.backdrop-blur-3xl {
      background: rgba(1, 4, 9, 0.7) !important;
      border-bottom: 1px solid rgba(59, 130, 246, 0.1) !important;
    }

    /* 14. نظام "عداد المسافة" - Distance Gauge */
    .text-gray-600.uppercase {
      letter-spacing: 2px;
      color: var(--titan-blue) !important;
      opacity: 0.6;
    }

    /* 15. اللمسة النهائية - Final Alpha Border */
    * {
      scrollbar-width: thin;
      scrollbar-color: var(--titan-blue) transparent;
    }

    /* ========================================================== */
    /* 🚀 THE ULTIMATE 50 - TITAN COLOSSUS ARCHITECTURE (PART 12) */
    /* ========================================================== */

    /* [1-5] ميزات "التحكم السيادي" للهوية - Sovereign Identity */
    .emperor-glow .w-36 {
      box-shadow: 0 0 50px rgba(251, 191, 36, 0.4), inset 0 0 20px rgba(251, 191, 36, 0.5);
      filter: drop-shadow(0 0 10px var(--titan-gold));
      animation: identity-pulse 4s ease-in-out infinite;
    }
    @keyframes identity-pulse {
      0%, 100% { transform: scale(1); filter: brightness(1); }
      50% { transform: scale(1.05); filter: brightness(1.3); }
    }

    /* [6-10] هندسة الـ "Arsenal" Button - Tactical Interaction */
    .colossus-card button {
      position: relative;
      background: linear-gradient(90deg, rgba(59, 130, 246, 0.1), transparent);
      border: 1px solid rgba(59, 130, 246, 0.2);
      clip-path: polygon(0% 0%, 90% 0%, 100% 30%, 100% 100%, 10% 100%, 0% 70%);
      transition: 0.4s all var(--ease-titan);
    }
    .colossus-card button:hover {
      background: var(--titan-blue);
      box-shadow: 0 0 30px rgba(59, 130, 246, 0.5);
      letter-spacing: 3px;
      color: white;
    }

    /* [11-15] نظام الـ "Scan-Line" للبطاقات - Security Layer */
    .colossus-card::after {
      content: "";
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background: repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(59, 130, 246, 0.03) 1px, rgba(59, 130, 246, 0.03) 2px);
      pointer-events: none;
    }

    /* [16-20] هندسة "عداد المسافة" - Distance Gauge FX */
    .text-white.font-black {
      text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
      background: linear-gradient(to bottom, #fff, #64748b);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    /* [21-25] نظام "الزاوية الحربية" - Tactical Brackets */
    .colossus-card::before {
      content: "[ ]";
      position: absolute;
      top: 10px; left: 10px;
      font-family: 'Orbitron';
      color: var(--titan-blue);
      font-size: 10px;
      opacity: 0.3;
    }

    /* [26-30] ميزة "توهج الحافة المشتعل" - Edge Flare */
    .emperor-glow {
      border-image: conic-gradient(from 0deg, var(--titan-gold), transparent, var(--titan-gold)) 1;
      animation: border-flare-rotate 6s linear infinite;
    }
    @keyframes border-flare-rotate {
      to { filter: hue-rotate(360deg); }
    }

    /* [31-35] نظام "شريط الأنباء السفلي" - Hyper Marquee */
    .fixed.bottom-0 {
      background: rgba(59, 130, 246, 0.9);
      backdrop-filter: blur(10px);
      box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.5);
    }
    .animate-marquee span {
      text-shadow: 0 0 5px rgba(255,255,255,0.5);
    }

    /* [36-40] هندسة "أيقونة الصعود" - Striver Zap Effect */
    .striver-row .bg-blue-600 {
      box-shadow: 0 0 15px var(--titan-blue);
      animation: zap-spin 3s linear infinite;
    }
    @keyframes zap-spin {
      0% { transform: rotate(0deg) scale(1); }
      50% { transform: rotate(180deg) scale(1.2); }
      100% { transform: rotate(360deg) scale(1); }
    }

    /* [41-45] نظام "الخلفية العميقة" - Nebula Deep Space */
    .fixed.top-0.left-0 {
      background-image: 
        radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.05) 0%, transparent 40%),
        radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.05) 0%, transparent 40%);
    }

    /* [46-50] ميزة "الشفافية المتفاعلة" - Reactive Glass */
    .colossus-card {
      background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.4) 100%);
      transform-style: preserve-3d;
    }
    .colossus-card:hover .xp-shimmer {
      transform: translateZ(20px);
      transition: 0.3s;
    }

    /* إضافات دقيقة للكلاسات - Micro-Class Injection */
    .syncopate { letter-spacing: -0.05em; }
    .orbitron { letter-spacing: 2px; }
    .badge-chip { 
      background: rgba(59, 130, 246, 0.1) !important; 
      border-color: rgba(59, 130, 246, 0.3) !important;
    }
    .container { position: relative; z-index: 10; }
    
    /* تأثير "التحميل الرقمي" - Digital Load Trace */
    .w-20.h-1.bg-blue-600 {
      box-shadow: 0 0 20px var(--titan-blue);
      animation: width-grow 2s var(--ease-titan) forwards;
    }
    @keyframes width-grow { from { width: 0; } to { width: 80px; } }
    
   /* ========================================================== */
    /* 🧬 THE ABSOLUTE TERMINUS - FINAL GOD-MODE FEATURES        */
    /* ========================================================== */

    /* 1. نظام "التردد المغناطيسي" - Magnetic Hover Pull */
    /* يضيف إحساساً بأن البطاقات تنجذب للماوس بفيزيائية حقيقية */
    .colossus-card {
      transition: transform 0.4s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.4s ease;
      transform-origin: center;
    }

    /* 2. ميزة "تفكك البيانات" - Data Fragmentation (Glitch) */
    /* تظهر عند مرور الماوس على "LEGENDS" لتعطي إيحاءً بالاختراق الرقمي */
    .xp-shimmer:hover {
      animation: glitch-skew 0.3s cubic-bezier(.25, .46, .45, .94) both infinite;
    }
    @keyframes glitch-skew {
      0% { transform: skew(0deg); }
      20% { transform: skew(3deg); text-shadow: 2px 0 red; }
      40% { transform: skew(-3deg); text-shadow: -2px 0 blue; }
      60% { transform: skew(1deg); }
      100% { transform: skew(0deg); }
    }

    /* 3. هندسة "الزجاج المنصهر" - Molten Glass Effect */
    /* يجعل المركز الأول يبدو كأنه مغطى بطبقة من الكريستال السائل */
    .emperor-glow {
      background: rgba(15, 23, 42, 0.8) !important;
      backdrop-filter: blur(40px) contrast(150%) brightness(120%) !important;
    }

    /* 4. نظام "خطوط الارتفاع" - Grid Topography */
    /* يضيف خطوطاً أفقية دقيقة جداً تتحرك ببطء في الخلفية */
    .min-h-screen::before {
      content: "";
      position: fixed;
      inset: 0;
      background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), 
                  linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03));
      background-size: 100% 4px, 3px 100%;
      pointer-events: none;
      z-index: 1000;
      opacity: 0.1;
    }

    /* 5. ميزة "توهج البصمة" - Fingerprint Pulse */
    /* لجعل أيقونة البصمة في الـ Nav تبدو وكأنها تفحص المستخدم */
    .w-16.h-16.rounded-\[25px\] {
      box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
      animation: identity-pulse 2s infinite;
    }
    @keyframes identity-pulse {
      0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
      70% { box-shadow: 0 0 0 15px rgba(59, 130, 246, 0); }
      100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
    }

    /* 6. هندسة الـ "Badge" المتفجر - Reactive Level Badges */
    .badge-chip {
      position: relative;
      overflow: hidden;
    }
    .badge-chip::before {
      content: "";
      position: absolute;
      width: 100%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
      left: -100%;
      transition: 0.5s;
    }
    .badge-chip:hover::before {
      left: 100%;
    }

    /* 7. نظام "الظل العميق" للصور - Depth Perception */
    .w-36.h-36 img {
      filter: drop-shadow(0 10px 20px rgba(0,0,0,0.8));
      border: 1px solid rgba(255,255,255,0.1);
    }

    /* 8. ميزة "تلاشي المسافة" - Fade Distance UI */
    /* تجعل عداد النقاط المتبقية (XP Needed) ينبض باللون الأحمر إذا كان الفارق صغيراً */
    .text-white.font-black {
      transition: color 0.3s ease;
    }
    .strivers-list-item:hover .text-white.font-black {
      color: var(--titan-cyan);
    }

    /* 9. نظام "التحقق" - Verified Tick Animation */
    .badge-chip:nth-child(2) {
      color: #10b981;
      border-color: rgba(16, 185, 129, 0.3);
    }

    /* 10. هندسة الـ Search المتوهج - High-Focus Search */
    input:focus + .absolute.right-6 {
      color: var(--titan-cyan);
      transform: translateY(-50%) scale(1.2);
      transition: 0.3s;
    }

    /* 11. تأثير "الغبار السحري" عند التمرير - Scroll Dust */
    ::-webkit-scrollbar-thumb:hover {
      background: var(--titan-cyan);
      box-shadow: 0 0 20px var(--titan-cyan);
    }

    /* 12. ميزة "الاسم العملاق" - Giant Watermark Backdrop */
    /* تضع كلمة TITAN في الخلفية بشكل ضخم وباهت جداً */
    .container::before {
      content: "MAFA";
      position: fixed;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      font-size: 30vw;
      font-weight: 900;
      font-family: 'Syncopate';
      color: rgba(255,255,255,0.01);
      z-index: -2;
      pointer-events: none;
    }

    /* 13. نظام "توزيع الضوء" للأزرار الدائرية - Heart Button FX */
    button.h-14.w-14 {
      position: relative;
      background: rgba(239, 68, 68, 0.05);
      border: 1px solid rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }
    button.h-14.w-14:hover {
      background: #ef4444;
      color: #fff;
      box-shadow: 0 0 30px rgba(239, 68, 68, 0.4);
    }

    /* 14. هندسة الـ Footer النهائي - Secure Network UI */
    footer .opacity-10 svg {
      transition: 0.5s;
    }
    footer:hover .opacity-10 {
      opacity: 0.5;
    }
    footer:hover .opacity-10 svg {
      color: var(--titan-blue);
      transform: translateY(-10px);
    }

    /* 15. اللمسة الأخيرة - Cinematic Entrance */
    .min-h-screen {
      animation: cinematic-entry 1.5s var(--ease-titan);
    }
    @keyframes cinematic-entry {
      from { opacity: 0; filter: blur(20px) brightness(0); }
      to { opacity: 1; filter: blur(0) brightness(1); }
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
