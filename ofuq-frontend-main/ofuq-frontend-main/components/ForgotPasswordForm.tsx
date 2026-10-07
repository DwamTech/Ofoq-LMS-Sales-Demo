'use client';

import React, { useState } from 'react';
import styles from './ForgotPasswordForm.module.css';
import VerificationCodeForm from './VerificationCodeForm';

interface ForgotPasswordFormProps {
  onBackToLogin?: () => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [showVerification, setShowVerification] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle forgot password logic here
    console.log('Forgot password form submitted:', { email });
    
    // Show verification code form after successful submission
    setShowVerification(true);
  };

  const handleBackToForgotPassword = () => {
    setShowVerification(false);
  };

  // Show verification code form if email was submitted
  if (showVerification) {
    return (
      <VerificationCodeForm 
        onBackToForgotPassword={handleBackToForgotPassword}
        email={email}
      />
    );
  }

  return (
    <div className={styles.authFormContainer}>
      {/* Logo */}
      <div className={styles.authFormLogo}>
        <img src="/logo.png" alt="منصة أفق للتعليم عن بعد" />
      </div>

      {/* Form Content Container */}
      <div className={styles.formContent}>
        {/* Title */}
        <h1 className={styles.forgotPasswordTitle}>إعادة تعيين كلمة السر</h1>
        
        {/* Subtitle */}
        <p className={styles.forgotPasswordSubtitle}>
          أدخل عنوان البريد الإلكتروني المرتبط بحسابك وسنرسل لك تعليمات
          لإعادة تعيين كلمة السر
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.forgotPasswordForm}>
          <div className={styles.formField}>
            <label className={styles.formLabel}>البريد الإلكتروني</label>
            <input
              type="email"
              className={styles.formInput}
              placeholder="اكتب بريدك الإلكتروني..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button type="submit" className={styles.resetBtn}>
            إرسال رابط إعادة التعيين
          </button>
        </form>

        {/* Back to Login Link */}
        <div className={styles.backToLogin}>
          <a href="#" onClick={(e) => { e.preventDefault(); onBackToLogin?.(); }}>
            الرجوع إلى تسجيل الدخول
          </a>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;