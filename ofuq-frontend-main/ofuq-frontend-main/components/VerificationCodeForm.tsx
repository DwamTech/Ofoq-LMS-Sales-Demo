'use client';

import React, { useState, useRef, useEffect } from 'react';
import '../styles/auth.css';
import NewPasswordForm from './NewPasswordForm';

interface VerificationCodeFormProps {
  onBackToForgotPassword?: () => void;
  email?: string;
}

const VerificationCodeForm: React.FC<VerificationCodeFormProps> = ({ 
  onBackToForgotPassword, 
  email 
}) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [showNewPasswordForm, setShowNewPasswordForm] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus on last input when component mounts (rightmost for RTL)
    if (inputRefs.current[5]) {
      inputRefs.current[5].focus();
    }
  }, []);

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input (moving from right to left for RTL)
    if (value && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index < 5) {
      // Focus next input on backspace if current is empty (moving left to right)
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const verificationCode = code.join('');
    if (verificationCode.length === 6) {
      console.log('Verification code submitted:', verificationCode);
      // Navigate to new password form after successful verification
      setShowNewPasswordForm(true);
    }
  };

  const handleResendCode = () => {
    console.log('Resend code clicked');
    // Handle resend code logic here
  };

  const handleBackToVerification = () => {
    setShowNewPasswordForm(false);
    // Clear the code when going back
    setCode(['', '', '', '', '', '']);
  };

  const handlePasswordReset = () => {
    console.log('Password reset completed successfully');
    // Handle successful password reset (e.g., redirect to login)
    alert('تم إعادة تعيين كلمة السر بنجاح! سيتم توجيهك إلى صفحة تسجيل الدخول.');
    // You can add navigation logic here
  };

  // Show new password form if verification is complete
  if (showNewPasswordForm) {
    return (
      <NewPasswordForm 
        onBackToVerification={handleBackToVerification}
        onPasswordReset={handlePasswordReset}
      />
    );
  }

  return (
    <div className="auth-form-container">
      {/* Logo */}
      <div className="auth-form-logo">
        <img src="/mahad_alofk2.png" alt="منصة أفق للتعليم عن بعد" />
      </div>

      {/* Form Content Container */}
      <div className="form-content verification-content">
        {/* Title */}
        <h1 className="verification-title">تأكيد البريد الإلكتروني</h1>
        
        {/* Subtitle */}
        <p className="verification-subtitle">
          لقد أرسلنا رمز التحقق المكون من 6 أرقام إلى
          <br />
          <span className="email-highlight">{email || 'بريدك الإلكتروني'}</span>
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="verification-form">
          <div className="code-inputs-container">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                className="code-input"
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
              />
            ))}
          </div>

          <button 
            type="submit" 
            className="verify-btn"
            disabled={code.join('').length !== 6}
          >
            تأكيد الرمز
          </button>
        </form>

        {/* Resend Code */}
        <div className="resend-section">
          <p className="resend-text">لم تستلم الرمز؟</p>
          <button className="resend-btn" onClick={handleResendCode}>
            إعادة إرسال الرمز
          </button>
        </div>

        {/* Back Link */}
        <div className="back-to-forgot">
          <a href="#" onClick={(e) => { e.preventDefault(); onBackToForgotPassword?.(); }}>
            العودة إلى إعادة تعيين كلمة السر
          </a>
        </div>
      </div>
    </div>
  );
};

export default VerificationCodeForm;