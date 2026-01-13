import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Clock, Search, ExternalLink, GraduationCap, BookOpen } from 'lucide-react';
import './CentersPage.css';

const CentersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCity, setFilterCity] = useState('الكل');

  // بيانات السناتر والمكتبات (يمكن جلبها من Firestore لاحقاً)
  const locations = [
    {
      id: 1,
      name: "سنتر النخبة التعليمي",
      type: "سنتر",
      city: "القاهرة",
      address: "مدينة نصر - حي السابع - بجوار مسجد الرحمة",
      phone: "01000000000",
      hours: "من 10 صباحاً إلى 10 مساءً",
      mapUrl: "https://goo.gl/maps/example1"
    },
    {
      id: 2,
      name: "مكتبة المتفوقين (توزيع أكواد)",
      type: "مكتبة",
      city: "الإسكندرية",
      address: "سموحة - شارع النقل والهندسة",
      phone: "01200000000",
      hours: "من 9 صباحاً إلى 11 مساءً",
      mapUrl: "https://goo.gl/maps/example2"
    },
    // أضف المزيد هنا...
  ];

  const filteredLocations = locations.filter(loc => 
    (filterCity === 'الكل' || loc.city === filterCity) &&
    (loc.name.includes(searchTerm) || loc.address.includes(searchTerm))
  );

  const cities = ['الكل', ...new Set(locations.map(l => l.city))];

  return (
    <div className="centers-page">
      {/* Header القسم العلوي */}
      <section className="hero-section">
        <motion.h1 initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          أماكن تواجدنا والسناتر المعتمدة
        </motion.h1>
        <p>يمكنك الحصول على أكواد الاشتراك وحضور المحاضرات من خلال المراكز التالية</p>
      </section>

      {/* Search & Filter نظام البحث والفلترة */}
      <div className="filter-container glass">
        <div className="search-box">
          <Search size={20} />
          <input 
            type="text" 
            placeholder="ابحث عن سنتر أو عنوان..." 
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="city-tabs">
          {cities.map(city => (
            <button 
              key={city}
              className={filterCity === city ? 'active' : ''}
              onClick={() => setFilterCity(city)}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* Locations Grid شبكة العرض */}
      <div className="locations-grid">
        {filteredLocations.map((loc) => (
          <motion.div 
            layout
            key={loc.id}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="location-card glass"
          >
            <div className="card-badge">
              {loc.type === 'سنتر' ? <GraduationCap size={16} /> : <BookOpen size={16} />}
              {loc.type}
            </div>
            
            <h3>{loc.name}</h3>
            
            <div className="info-item">
              <MapPin size={18} className="icon" />
              <span>{loc.address}</span>
            </div>
            
            <div className="info-item">
              <Phone size={18} className="icon" />
              <span dir="ltr">{loc.phone}</span>
            </div>

            <div className="info-item">
              <Clock size={18} className="icon" />
              <span>{loc.hours}</span>
            </div>

            <a href={loc.mapUrl} target="_blank" rel="noreferrer" className="map-link">
              عرض على الخريطة <ExternalLink size={16} />
            </a>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CentersPage;
