'use client';

import React from 'react';

interface Preferences {
  notifications: boolean;
  darkMode: boolean;
  language: string;
}

interface PreferencesTabProps {
  preferences: Preferences;
  onPreferenceToggle: (field: string) => void;
  onLanguageChange: (language: string) => void;
  onSave: () => void;
}

export default function PreferencesTab({ 
  preferences, 
  onPreferenceToggle, 
  onLanguageChange, 
  onSave 
}: PreferencesTabProps) {
  return (
    <div className="preferences-section">
      <div className="preference-group">
        <h3 className="preference-title">الإشعارات والتنبيهات</h3>
        <div className="preference-item">
          <span className="preference-label">تفعيل الإشعارات</span>
          <div 
            className={`toggle-switch ${preferences.notifications ? 'active' : ''}`}
            onClick={() => onPreferenceToggle('notifications')}
          >
            <div className="toggle-slider"></div>
          </div>
        </div>
      </div>

      <div className="preference-group">
        <h3 className="preference-title">المظهر</h3>
        <div className="preference-item">
          <span className="preference-label">تفعيل المظهر الداكن</span>
          <div 
            className={`toggle-switch ${preferences.darkMode ? 'active' : ''}`}
            onClick={() => onPreferenceToggle('darkMode')}
          >
            <div className="toggle-slider"></div>
          </div>
        </div>
      </div>

      {/* <div className="preference-group">
        <h3 className="preference-title">اللغة</h3>
        <div className="preference-item">
          <span className="preference-label">اختر لغة الواجهة</span>
          <div className="language-selection">
            <button 
              className={`language-button ${preferences.language === 'ar' ? 'active' : ''}`}
              onClick={() => onLanguageChange('ar')}
            >
              العربية
            </button>
            <button 
              className={`language-button ${preferences.language === 'en' ? 'active' : ''}`}
              onClick={() => onLanguageChange('en')}
            >
              English
            </button>
          </div>
        </div>
      </div> */}

      <button type="button" className="save-button" onClick={onSave}>
        حفظ التغييرات
      </button>
    </div>
  );
}