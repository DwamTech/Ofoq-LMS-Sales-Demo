'use client';

import React from 'react';
import Link from 'next/link';

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PasswordTabProps {
  passwordData: PasswordData;
  onPasswordChange: (field: string, value: string) => void;
  onSave: () => void;
}

export default function PasswordTab({ passwordData, onPasswordChange, onSave }: PasswordTabProps) {
  return (
    <div className="password-section">
      <div className="password-notice">
        يجب أن تكون كلمة المرور الجديدة مختلفة عن كلمات المرور المستخدمة سابقًا
      </div>

      <form className="settings-form">
        <div className="form-group">
          <label className="form-label">كلمة المرور الحالية</label>
          <input 
            type="password" 
            className="form-input"
            value={passwordData.currentPassword}
            onChange={(e) => onPasswordChange('currentPassword', e.target.value)}
            placeholder="أدخل كلمة المرور الحالية"
          />
          <Link href="/auth" className="forgot-password-link">
            هل نسيت كلمة المرور؟
          </Link>
        </div>
        <div className="form-group">
          <label className="form-label">كلمة المرور الجديدة</label>
          <input 
            type="password" 
            className="form-input"
            value={passwordData.newPassword}
            onChange={(e) => onPasswordChange('newPassword', e.target.value)}
            placeholder="أدخل كلمة المرور الجديدة"
          />
        </div>
        <div className="form-group">
          <label className="form-label">تأكيد كلمة المرور الجديدة</label>
          <input 
            type="password" 
            className="form-input"
            value={passwordData.confirmPassword}
            onChange={(e) => onPasswordChange('confirmPassword', e.target.value)}
            placeholder="أعد إدخال كلمة المرور الجديدة"
          />
        </div>
        <button type="button" className="save-button" onClick={onSave}>
          حفظ التغييرات
        </button>
      </form>
    </div>
  );
}