'use client';

import React, { useState } from 'react';
import '../styles/auth.css';

interface NewPasswordFormProps {
  onBackToVerification?: () => void;
  onPasswordReset?: () => void;
}

const NewPasswordForm: React.FC<NewPasswordFormProps> = ({ 
  onBackToVerification,
  onPasswordReset
}) => {
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({
    newPassword: '',
    confirmPassword: '',
    general: ''
  });
  const [showPassword, setShowPassword] = useState({
    newPassword: false,
    confirmPassword: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
        general: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {
      newPassword: '',
      confirmPassword: '',
      general: ''
    };

    // Validate new password
    if (!formData.newPassword) {
      newErrors.newPassword = 'كلمة السر الجديدة مطلوبة';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'كلمة السر يجب أن تكون 8 أحرف على الأقل';
    }

    // Validate confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'تأكيد كلمة السر مطلوب';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'كلمات السر غير متطابقة';
    }

    setErrors(newErrors);
    return !newErrors.newPassword && !newErrors.confirmPassword;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      console.log('New password submitted:', formData.newPassword);
      // Navigate to login page after successful password reset
      window.location.href = '/auth';
    }
  };

  const togglePasswordVisibility = (field: 'newPassword' | 'confirmPassword') => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <div className="auth-form-container">
      {/* Logo */}
      <div className="auth-form-logo">
        <img src="/mahad_alofk2.png" alt="منصة أفق للتعليم عن بعد" />
      </div>

      {/* Form Content Container */}
      <div className="form-content new-password-content">
        {/* Title */}
        <h1 className="new-password-title">إعادة تعيين كلمة السر</h1>
        
        {/* Subtitle */}
        <p className="new-password-subtitle">
          أدخل كلمة السر الجديدة وتأكيدها لإكمال عملية إعادة التعيين
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="new-password-form">
          {/* New Password Field */}
          <div className="form-field">
            <label className="form-label">كلمة السر الجديدة</label>
            <div className="password-input-container">
              <input
                type={showPassword.newPassword ? 'text' : 'password'}
                name="newPassword"
                className={`form-input ${errors.newPassword ? 'error' : ''}`}
                placeholder="أدخل كلمة السر الجديدة..."
                value={formData.newPassword}
                onChange={handleInputChange}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => togglePasswordVisibility('newPassword')}
              >
                {showPassword.newPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.99902 3L20.999 21M9.8433 9.91364C9.32066 10.4536 8.99902 11.1892 8.99902 12C8.99902 13.6569 10.3422 15 11.999 15C12.8215 15 13.5667 14.669 14.1086 14.133M6.49902 6.64715C4.59972 7.90034 3.15305 9.78394 2.45703 12C3.73128 16.0571 7.52159 19 11.9992 19C13.9881 19 15.8414 18.4194 17.3988 17.4184M10.999 5.04939C11.328 5.01673 11.6617 5 11.9992 5C16.4769 5 20.2672 7.94291 21.5414 12C21.2607 12.894 20.8577 13.7338 20.3522 14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.45703 12C3.73128 7.94291 7.52159 5 11.9992 5C16.4769 5 20.2672 7.94291 21.5414 12C20.2672 16.0571 16.4769 19 11.9992 19C7.52159 19 3.73128 16.0571 2.45703 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M11.9992 15C13.6561 15 14.9992 13.6569 14.9992 12C14.9992 10.3431 13.6561 9 11.9992 9C10.3424 9 8.99924 10.3431 8.99924 12C8.99924 13.6569 10.3424 15 11.9992 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            </div>
            {errors.newPassword && <span className="error-message">{errors.newPassword}</span>}
          </div>

          {/* Confirm Password Field */}
          <div className="form-field">
            <label className="form-label">تأكيد كلمة السر</label>
            <div className="password-input-container">
              <input
                type={showPassword.confirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                placeholder="أعد إدخال كلمة السر..."
                value={formData.confirmPassword}
                onChange={handleInputChange}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => togglePasswordVisibility('confirmPassword')}
              >
                {showPassword.confirmPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.99902 3L20.999 21M9.8433 9.91364C9.32066 10.4536 8.99902 11.1892 8.99902 12C8.99902 13.6569 10.3422 15 11.999 15C12.8215 15 13.5667 14.669 14.1086 14.133M6.49902 6.64715C4.59972 7.90034 3.15305 9.78394 2.45703 12C3.73128 16.0571 7.52159 19 11.9992 19C13.9881 19 15.8414 18.4194 17.3988 17.4184M10.999 5.04939C11.328 5.01673 11.6617 5 11.9992 5C16.4769 5 20.2672 7.94291 21.5414 12C21.2607 12.894 20.8577 13.7338 20.3522 14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.45703 12C3.73128 7.94291 7.52159 5 11.9992 5C16.4769 5 20.2672 7.94291 21.5414 12C20.2672 16.0571 16.4769 19 11.9992 19C7.52159 19 3.73128 16.0571 2.45703 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M11.9992 15C13.6561 15 14.9992 13.6569 14.9992 12C14.9992 10.3431 13.6561 9 11.9992 9C10.3424 9 8.99924 10.3431 8.99924 12C8.99924 13.6569 10.3424 15 11.9992 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            </div>
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
          </div>

          {/* General Error */}
          {errors.general && <div className="error-message general-error">{errors.general}</div>}

          {/* Submit Button */}
          <button 
            type="submit" 
            className="reset-password-btn"
          >
            إعادة تعيين كلمة السر
          </button>
        </form>

        {/* Back Link */}
        <div className="back-to-verification">
          <a href="#" onClick={(e) => { e.preventDefault(); onBackToVerification?.(); }}>
            العودة إلى تأكيد الرمز
          </a>
        </div>
      </div>
    </div>
  );
};

export default NewPasswordForm;