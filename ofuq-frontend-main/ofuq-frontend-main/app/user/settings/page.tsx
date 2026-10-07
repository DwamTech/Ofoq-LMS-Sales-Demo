'use client';

import React, { useState, useEffect } from 'react';
import styles from './Settings.module.css';
import ProfileTab from '../../../components/settings/ProfileTab';
import PasswordTab from '../../../components/settings/PasswordTab';
import { getProfile, updateProfile, changePassword } from '../../../utils/authService';
import { getBackendAssetUrl } from '../../../utils/url';

export default function Settings() {
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Fetch profile data on component mount
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const profileResponse = await getProfile();
        
        // Safely split the name field into firstName and lastName
        const fullName = typeof profileResponse.name === 'string' ? profileResponse.name.trim() : '';
        const nameParts = fullName ? fullName.split(' ') : [];
        const firstName = nameParts.length > 0 ? nameParts[0] : '';
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
        
        setProfileData({
          firstName,
          lastName,
          email: (profileResponse as any).email ?? ''
        });
        
        // Set profile image if it exists
        if (profileResponse.profile_picture) {
          const imageUrl = getBackendAssetUrl(profileResponse.profile_picture);
          setProfileImage(imageUrl);
        }
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError(err instanceof Error ? err.message : 'حدث خطأ في جلب بيانات الملف الشخصي');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  const handleProfileChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  // أزلنا منطق التفضيلات بالكامل

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    setError(null);
    setSuccessMessage('');
    
    try {
      // Combine firstName and lastName into a single name string
      const combinedName = `${profileData.firstName} ${profileData.lastName}`.trim();
      
      // استدعاء تحديث الملف الشخصي بإرسال الاسم فقط (كما يدعم الباك إند)
      const updatedUser = await updateProfile({
        name: combinedName,
        email: ''
      });
      
      // Update localStorage with fresh user data
      if (typeof window !== 'undefined') {
        localStorage.setItem('user_data', JSON.stringify(updatedUser));
      }
      
      // Set success message
      setSuccessMessage('تم تحديث الملف الشخصي بنجاح');
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ في تحديث الملف الشخصي');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePassword = async () => {
    setError(null);
    setSuccessMessage('');

    // Basic validations
    if (!passwordData.currentPassword) {
      setError('يرجى إدخال كلمة المرور الحالية');
      return;
    }
    if (!passwordData.newPassword) {
      setError('يرجى إدخال كلمة المرور الجديدة');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('تأكيد كلمة المرور لا يطابق كلمة المرور الجديدة');
      return;
    }

    try {
      setIsLoading(true);
      await changePassword({
        current_password: passwordData.currentPassword,
        password: passwordData.newPassword,
        password_confirmation: passwordData.confirmPassword,
      });

      // Reset fields on success
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSuccessMessage('تم تغيير كلمة المرور بنجاح');

      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Error changing password:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ في تغيير كلمة المرور');
    } finally {
      setIsLoading(false);
    }
  };

  // لا توجد تفضيلات بعد الآن

  return (
    <div className={`dashboard-container settings-page ${styles.settingsPage}`}>
      <div className="settings-header">
        <h1 className="settings-title">الإعدادات</h1>
        <p className="settings-subtitle">إدارة إعدادات حسابك</p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="loading-container" style={{ textAlign: 'center', padding: '2rem' }}>
          <p>جاري تحميل بيانات الملف الشخصي...</p>
        </div>
      )}

      {/* Error Message - consolidated below in Error State */}

      {/* Success Message */}
      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="error-container" style={{ 
          backgroundColor: '#fee', 
          border: '1px solid #fcc', 
          borderRadius: '8px', 
          padding: '1rem', 
          margin: '1rem 0',
          color: '#c33'
        }}>
          <p>خطأ: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              marginTop: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#c33',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Content - only show when not loading and no error */}
      {!isLoading && !error && (
        <>
      {/* عرض موحد: تعديل الحساب وكلمة السر في نفس الصفحة */}
      <div className="combined-settings">
        <ProfileTab 
          profileData={profileData} 
          onProfileChange={handleProfileChange}
          onSave={handleProfileUpdate}
          isLoading={isLoading}
          profileImage={profileImage}
          setProfileImage={setProfileImage}
        />

        <div style={{ marginTop: '2rem' }}>
          <PasswordTab 
            passwordData={passwordData}
            onPasswordChange={handlePasswordChange}
            onSave={handleSavePassword}
          />
        </div>
      </div>
      </>
    )}
  </div>
);
}