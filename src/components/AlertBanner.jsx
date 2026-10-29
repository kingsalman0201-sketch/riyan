import React from 'react';
import './AlertBanner.css';
import { useLanguage } from '../context/LanguageContext';

const AlertBanner = () => {
  const { t } = useLanguage();

  return (
    <div className="alert-banner-container glass-panel">
      <div className="alert-badge">
        <span className="pulse-dot">🔴</span>
        <span className="badge-text">{t('alerts.live')}</span>
      </div>
      <div className="marquee-wrapper">
        <div className="marquee-content">
          <span className="alert-item">🌤️ {t('alerts.weather')}</span>
          <span className="alert-separator">|</span>
          <span className="alert-item">📈 {t('alerts.market')}</span>
          <span className="alert-separator">|</span>
          <span className="alert-item">📰 {t('alerts.news')}</span>
          
          {/* Duplicate for seamless loop */}
          <span className="alert-separator">|</span>
          <span className="alert-item">🌤️ {t('alerts.weather')}</span>
          <span className="alert-separator">|</span>
          <span className="alert-item">📈 {t('alerts.market')}</span>
          <span className="alert-separator">|</span>
          <span className="alert-item">📰 {t('alerts.news')}</span>
        </div>
      </div>
    </div>
  );
};

export default AlertBanner;
