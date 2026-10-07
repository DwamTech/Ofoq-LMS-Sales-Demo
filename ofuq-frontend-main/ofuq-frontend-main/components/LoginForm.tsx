'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './LoginForm.module.css';
import ForgotPasswordForm from './ForgotPasswordForm';
import { signup, signin, googleAuth, handleGoogleCallback } from '../utils/authService';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import Link from 'next/link';
import PhoneInput from 'react-phone-number-input';
import flags from 'react-phone-number-input/flags';
import Select from 'react-select';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { parsePhoneNumber } from 'libphonenumber-js';
import nationalities from '../data/nationalities.json';

interface LoginFormProps {
  onTabChange?: (tab: 'login' | 'signup') => void;
  initialTab?: 'login' | 'signup' | null;
}

const LoginForm: React.FC<LoginFormProps> = ({ onTabChange, initialTab }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(initialTab || 'login');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  // جديد: تبديل وضع تسجيل الدخول بالبريد/الهاتف
  const [isLoginWithPhone, setIsLoginWithPhone] = useState(false);
  const [loginPhone, setLoginPhone] = useState<string | undefined>('');

  // جديد: حقول التسجيل للهاتف والجنسية
  const [signupPhone, setSignupPhone] = useState<string | undefined>('');
  const [nationality, setNationality] = useState<{ value: string; label: string } | null>(null);
  // جديد: موافقة السياسات في التسجيل
  const [acceptPolicies, setAcceptPolicies] = useState(false);

  const router = useRouter();

  // Check for Google OAuth callback on component mount
  useEffect(() => {
    const processGoogleCallback = async () => {
      try {
        const result = await handleGoogleCallback();
        if (result) {
          // Redirect based on role
          if (result.user.role === 'admin' || result.user.role === 'supervisor') {
            router.push('/admin');
          } else {
            router.push('/user');
          }
        }
      } catch (error: any) {
        console.error('Google callback error:', error);
        setError(error.message || 'فشل في معالجة تسجيل الدخول عبر Google');
      } finally {
        setIsGoogleLoading(false);
      }
    };

    processGoogleCallback();
  }, [router]);

  const handleTabChange = (tab: 'login' | 'signup') => {
    setActiveTab(tab);
    setShowForgotPassword(false); // Reset forgot password view when switching tabs
    setError(''); // Clear any errors when switching tabs
    onTabChange?.(tab);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setIsGoogleLoading(true);
      // Call the Google OAuth function
      googleAuth();
    } catch (error: any) {
      console.error('Google login error:', error);
      setError(error.message || 'فشل في تسجيل الدخول عبر Google');
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('[AuthForm] Submit clicked', { mode: activeTab });
      if (activeTab === 'signup') {
        // موافقة على الشروط وسياسة الخصوصية مطلوبة
        if (!acceptPolicies) {
          setError('يرجى الموافقة على شروط الاستخدام وسياسة الخصوصية');
          setIsLoading(false);
          return;
        }
        // Validate password confirmation
        if (password !== confirmPassword) {
          setError('كلمات السر غير متطابقة');
          console.log('[Signup] Password mismatch');
          setIsLoading(false);
          return;
        }

        // Validate password strength
        if (password.length < 6) {
          setError('كلمة السر يجب أن تكون 6 أحرف على الأقل');
          setIsLoading(false);
          return;
        }

        // Validate phone presence
        if (!signupPhone) {
          setError('يرجى إدخال رقم الهاتف');
          setIsLoading(false);
          return;
        }

        // Validate phone format and leading zero rule
        if (signupPhone && typeof signupPhone === 'string') {
          if (!isValidPhoneNumber(signupPhone)) {
            setError('رقم الهاتف غير صالح');
            setIsLoading(false);
            return;
          }
          const parsed = parsePhoneNumber(signupPhone);
          if (parsed && parsed.nationalNumber && parsed.nationalNumber.toString().startsWith('0')) {
            setError('رقم الهاتف لا يجب أن يبدأ بصفر');
            setIsLoading(false);
            return;
          }
        }

        // Validate nationality presence
        if (!nationality) {
          setError('يرجى اختيار الجنسية');
          setIsLoading(false);
          return;
        }

        const fullName = `${firstName} ${lastName}`.trim();
        console.log('[Signup] Full name composed', { fullName });
        console.log('[Signup] Calling signup API');
        const result = await signup({
          name: fullName,
          email,
          password,
          password_confirmation: confirmPassword,
          // جديد: حقول إضافية مطلوبة من الـ Backend
          phone: signupPhone,
          nationality: nationality.value,
        } as any);

        console.log('Signup successful:', result);
        // Redirect based on role
        if (result.user.role === 'admin' || result.user.role === 'supervisor') {
          console.log('[Signup] Routing to /admin');
          router.push('/admin');
        } else {
          console.log('[Signup] Routing to /user');
          router.push('/user');
        }
      } else {
        console.log('[Signin] Calling signin API');
        const loginValue = isLoginWithPhone ? loginPhone || '' : email;
        if (!loginValue) {
          setError(isLoginWithPhone ? 'يرجى إدخال رقم الهاتف' : 'يرجى إدخال البريد الإلكتروني');
          setIsLoading(false);
          return;
        }
        // Validate phone when logging in with phone
        if (isLoginWithPhone) {
          const phoneValue = loginPhone || '';
          if (!isValidPhoneNumber(phoneValue)) {
            setError('رقم الهاتف غير صالح');
            setIsLoading(false);
            return;
          }
          const parsed = parsePhoneNumber(phoneValue);
          if (parsed && parsed.nationalNumber && parsed.nationalNumber.toString().startsWith('0')) {
            setError('رقم الهاتف لا يجب أن يبدأ بصفر');
            setIsLoading(false);
            return;
          }
        }
        const result = await signin({
          login: loginValue,
          password,
        } as any);

        console.log('Signin successful:', result);
        // Redirect based on role
        if (result.user.role === 'admin' || result.user.role === 'supervisor') {
          console.log('[Signin] Routing to /admin');
          router.push('/admin');
        } else {
          console.log('[Signin] Routing to /user');
          router.push('/user');
        }
      }
    } catch (error: any) {
      console.log('Authentication Error:', error);

      // Enhanced error handling
      if (error.message.includes('email')) {
        setError('البريد الإلكتروني مستخدم بالفعل');
      } else if (error.message.includes('password')) {
        setError('كلمة السر غير صحيحة');
      } else if (error.message.includes('credentials')) {
        setError('بيانات تسجيل الدخول غير صحيحة');
      } else if (error.message.includes('validation')) {
        setError('يرجى التحقق من البيانات المدخلة');
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        setError('خطأ في الاتصال، يرجى المحاولة مرة أخرى');
      } else {
        setError(error.message || 'حدث خطأ أثناء المعالجة');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowForgotPassword(true);
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
  };

  // خيارات الجنسيات الأساسية (يمكن استبدالها لاحقًا بمصدر JSON كامل)
  const nationalityOptions = (nationalities as any[]).map((n: any) => ({ value: n.arabic_name, label: n.arabic_name }));

  // Show forgot password form if requested
  if (showForgotPassword) {
    return <ForgotPasswordForm onBackToLogin={handleBackToLogin} />;
  }

  return (
    <div className={styles.authFormContainer}>
      {/* Logo */}
      <div className={styles.authFormLogo}>
        <Link href={{ pathname: '/' }} >
          <img src="/logo.png" alt="منصة أفق للتعليم عن بعد" />
        </Link>
      </div>

      {/* Tabs */}
      <div className={styles.authTabs}>
        <button className={`${styles.authTab} ${activeTab === 'login' ? styles.active : ''}`} onClick={() => handleTabChange('login')}>تسجيل الدخول</button>
        <button className={`${styles.authTab} ${activeTab === 'signup' ? styles.active : ''}`} onClick={() => handleTabChange('signup')}>إنشاء حساب جديد</button>
      </div>

      <div className={styles.formContent}>
        {/* Google Login */}
        {/*
          تم إخفاء زر تسجيل الدخول عبر Google مؤقتًا بسبب عطل.
          لإعادة تفعيله لاحقًا، أزل هذا التعليق بعد حل المشكلة.
          <button className={styles.googleLoginBtn} onClick={handleGoogleLogin} disabled={isGoogleLoading}>
            <span className={styles.googleIcon} aria-hidden="true" />
            {isGoogleLoading ? 'جارٍ الاتصال بجوجل...' : 'تسجيل الدخول عبر Google'}
          </button>
        */}

        {/* Divider */}
        <div className={styles.divider}>
          <div className={styles.line}></div>
          <span className={styles.text}>أو</span>
          <div className={styles.line}></div>
        </div>

        {/* زر تبديل وضع الدخول */}
        {activeTab === 'login' && (
          <div className={styles.formField} style={{ textAlign: 'center', marginBottom: 12 }}>
            <button
              type="button"
              onClick={() => setIsLoginWithPhone((v) => !v)}
              style={{
                background: 'none',
                border: 'none',
                color: '#4142D0',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {isLoginWithPhone ? 'تسجيل الدخول عبر البريد الإلكتروني' : 'تسجيل الدخول عبر الهاتف'}
            </button>
          </div>
        )}

        {/* Login/Signup Form */}
        <form onSubmit={handleSubmit}>
          {/* Name Fields Row - Only show for signup */}
          {activeTab === 'signup' && (
            <div className={styles.nameFieldsRow}>
              <div className={styles.nameField}>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="الاسم الأول"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className={styles.nameField}>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="الاسم الأخير"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {/* Signup: Email */}
          {activeTab === 'signup' && (
            <div className={styles.formField}>
              <input
                type="email"
                className={styles.formInput}
                placeholder="البريد الإلكتروني"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          )}

          {/* Email or Phone input depending on mode */}
          {activeTab === 'login' && !isLoginWithPhone && (
            <div className={styles.formField}>
              <input
                type="email"
                className={styles.formInput}
                placeholder="البريد الإلكتروني"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          )}

          {activeTab === 'login' && isLoginWithPhone && (
            <div className={styles.formField}>
              <PhoneInput
                className={styles.phoneInput}
                flags={flags}
                defaultCountry="EG"
                international
                placeholder="رقم الهاتف"
                value={loginPhone}
                onChange={setLoginPhone}
              />
            </div>
          )}

          {/* Signup-only: phone + nationality row */}
          {activeTab === 'signup' && (
            <div className={styles.nameFieldsRow}>
              <div className={styles.nameField}>
                <PhoneInput
                  className={styles.phoneInput}
                  flags={flags}
                  defaultCountry="EG"
                  international
                  placeholder="رقم الهاتف"
                  value={signupPhone}
                  onChange={setSignupPhone}
                />
              </div>
              <div className={styles.nameField}>
                <Select
                  options={nationalityOptions}
                  placeholder="اختر الجنسية"
                  value={nationality}
                  onChange={(opt) => setNationality(opt)}
                  isClearable
                  styles={{
                    control: (base) => ({
                      ...base,
                      height: 60,
                      borderColor: '#E0E0E0',
                      borderRadius: 12,
                      direction: 'rtl',
                    }),
                    input: (base) => ({ ...base, direction: 'rtl' }),
                    menu: (base) => ({ ...base, direction: 'rtl' }),
                  }}
                />
              </div>
            </div>
          )}

          {/* Password */}
          <div className={styles.formField}>
            <div className={styles.passwordInputContainer}>
              <input
                type={showPassword ? 'text' : 'password'}
                className={styles.formInput}
                placeholder="كلمة السر"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className={styles.eyeIcon}
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? 'إخفاء كلمة السر' : 'إظهار كلمة السر'}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          {/* Confirm Password - Only for signup */}
          {activeTab === 'signup' && (
            <div className={styles.formField}>
              <div className={styles.passwordInputContainer}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={styles.formInput}
                  placeholder="تأكيد كلمة السر"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className={styles.eyeIcon}
                  onClick={toggleConfirmPasswordVisibility}
                  aria-label={showConfirmPassword ? 'إخفاء تأكيد كلمة السر' : 'إظهار تأكيد كلمة السر'}
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>
          )}

          {/* Forgot password link - Only in login */}
          {activeTab === 'login' && (
            <div className={styles.forgotPasswordLink}>
              <a href="#" onClick={handleForgotPasswordClick}>هل نسيت كلمة السر؟</a>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          {/* سياسات التسجيل - تظهر فقط في تبويب التسجيل */}
          {activeTab === 'signup' && (
            <div className={styles.policiesConsent}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={acceptPolicies}
                  onChange={(e) => setAcceptPolicies(e.target.checked)}
                />
                <span>
                  أوافق على <Link href="/terms" className={styles.policyLink}>شروط الاستخدام</Link> و{' '}
                  <Link href="/privacy" className={styles.policyLink}>سياسة الخصوصية</Link>
                </span>
              </label>
            </div>
          )}

          <button type="submit" className={styles.loginBtn} disabled={isLoading || isGoogleLoading || (activeTab === 'signup' && !acceptPolicies)}>
            {isLoading ? 'جاري المعالجة...' : (activeTab === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب')}
          </button>
        </form>

        {/* Footer Link */}
        <div className={styles.footerLink}>
          {activeTab === 'login' ? (
            <>
              ليس لديك حساب؟{' '}
              <a href="#" onClick={() => handleTabChange('signup')}>
                إنشاء حساب
              </a>
            </>
          ) : (
            <>
              لديك حساب بالفعل؟{' '}
              <a href="#" onClick={() => handleTabChange('login')}>
                تسجيل الدخول
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginForm;