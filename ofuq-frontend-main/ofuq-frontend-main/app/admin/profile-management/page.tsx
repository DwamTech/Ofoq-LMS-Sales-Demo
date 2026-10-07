"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, updateProfile, changePassword, signout, uploadProfilePicture } from '../../../utils/authService';
import { getBackendAssetUrl } from '../../../utils/url';
import styles from './Settings.module.css';

export default function AdminProfileManagementPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string>('');
  const [profileError, setProfileError] = useState<string>('');

  // Profile picture states
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      if (user.profile_picture) {
        setProfileImage(getBackendAssetUrl(user.profile_picture));
      }
    }
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    setUploadError(null);

    try {
      // Show instant preview
      const previewUrl = URL.createObjectURL(file);
      setProfileImage(previewUrl);

      // Upload the file
      const response = await uploadProfilePicture(file);
      const imageUrl = getBackendAssetUrl(response.path);
      setProfileImage(imageUrl);

      // Update localStorage
      const userData = localStorage.getItem('user_data');
      if (userData) {
        const parsed = JSON.parse(userData);
        parsed.profile_picture = response.path;
        localStorage.setItem('user_data', JSON.stringify(parsed));
        window.dispatchEvent(new CustomEvent('userDataUpdated'));
      }
    } catch (error: any) {
      setUploadError(error.message || 'فشل في رفع الصورة');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setProfileMessage('');
    setProfileError('');
    setSavingProfile(true);
    try {
      await updateProfile({ name, email });
      // مزامنة التخزين المحلي بعد التحديث
      const user = getCurrentUser();
      if (typeof window !== 'undefined' && user) {
        localStorage.setItem('user_data', JSON.stringify({ ...user, name }));
      }
      setProfileMessage('تم حفظ بيانات الحساب بنجاح');
    } catch (error: any) {
      setProfileError(error.message || 'حدث خطأ أثناء حفظ البيانات');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordMessage('');
    setPasswordError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('يرجى ملء جميع حقول كلمة المرور');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('يجب أن تكون كلمة المرور الجديدة 8 أحرف على الأقل');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('تأكيد كلمة المرور لا يطابق الجديدة');
      return;
    }

    setChangingPassword(true);
    try {
      await changePassword({ current_password: currentPassword, password: newPassword, password_confirmation: confirmPassword });
      setPasswordMessage('تم تغيير كلمة المرور بنجاح. سيتم تسجيل خروجك لإعادة تسجيل الدخول.');
      // تسجيل الخروج لإبقاء الجلسة نظيفة بعد تغيير كلمة المرور
      await signout();
      router.replace('/auth');
    } catch (error: any) {
      setPasswordError(error.message || 'فشل في تغيير كلمة المرور');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className={styles["settingsPage"]} style={{ direction: 'rtl' }}>
      <div className="settings-header">
        <h1 className="settings-title">إدارة حساب الأدمن</h1>
        <p className="settings-subtitle">تعديل الاسم والصورة وكلمة المرور</p>
      </div>

      {/* Profile Picture Section */}
      <div className={styles["profileImageSection"]}>
        <h2 className="settings-title" style={{ fontSize: '1.6rem' }}>صورة الحساب</h2>
        <div className={styles["profileImageContainer"]}>
          {profileImage ? (
            <img src={profileImage} alt="Profile" className={styles["profileImg"]} />
          ) : (
            <span className={styles["profilePlaceholder"]}>👤</span>
          )}
        </div>
        <label className={styles["imageUploadButton"]}>
          {uploadLoading ? 'جاري الرفع...' : 'تغيير الصورة'}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            disabled={uploadLoading}
          />
        </label>
        {uploadError && (
          <div role="alert" style={{ color: '#c20000', marginTop: '12px', fontWeight: 600 }}>{uploadError}</div>
        )}
      </div>

      <div className="profile-section">
        <h2 className="settings-title" style={{ fontSize: '1.6rem' }}>بيانات الحساب</h2>
        <div className="form-group">
          <label className="form-label" htmlFor="name">الاسم</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="form-input"
            placeholder="اسم الأدمن"
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="email">البريد الإلكتروني</label>
          <input
            id="email"
            type="email"
            value={email}
            readOnly
            className="form-input"
            placeholder="البريد الإلكتروني"
          />
        </div>
        <button className="save-button" onClick={handleSaveProfile} disabled={savingProfile}>
          {savingProfile ? 'جارٍ الحفظ...' : 'حفظ البيانات'}
        </button>
        {profileMessage && (
          <div role="alert" style={{ color: '#0b7a28', marginTop: '12px', fontWeight: 600 }}>{profileMessage}</div>
        )}
        {profileError && (
          <div role="alert" style={{ color: '#c20000', marginTop: '12px', fontWeight: 600 }}>{profileError}</div>
        )}
      </div>

      <div className="password-section" style={{ marginTop: '24px' }}>
        <h2 className="settings-title" style={{ fontSize: '1.6rem' }}>تغيير كلمة المرور</h2>
        <div className="form-group">
          <label className="form-label" htmlFor="currentPassword">كلمة المرور الحالية</label>
          <input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="form-input"
            placeholder="أدخل كلمة المرور الحالية"
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="newPassword">كلمة المرور الجديدة</label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="form-input"
            placeholder="أدخل كلمة المرور الجديدة"
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="confirmPassword">تأكيد كلمة المرور</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="form-input"
            placeholder="أعد إدخال كلمة المرور الجديدة"
          />
        </div>
        <button className="save-button" onClick={handleChangePassword} disabled={changingPassword}>
          {changingPassword ? 'جارٍ التغيير...' : 'تغيير كلمة المرور'}
        </button>
        {passwordMessage && (
          <div role="alert" style={{ color: '#0b7a28', marginTop: '12px', fontWeight: 600 }}>{passwordMessage}</div>
        )}
        {passwordError && (
          <div role="alert" style={{ color: '#c20000', marginTop: '12px', fontWeight: 600 }}>{passwordError}</div>
        )}
      </div>
    </div>
  );
}