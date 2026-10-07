'use client';

import React, { useState } from 'react';
import { uploadProfilePicture } from '../../utils/authService';
import { getBackendAssetUrl } from '../../utils/url';

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
}

interface ProfileTabProps {
  profileData: ProfileData;
  onProfileChange: (field: string, value: string) => void;
  onSave: (e: React.FormEvent) => void;
  isLoading?: boolean;
  profileImage: string | null;
  setProfileImage: (image: string | null) => void;
}

export default function ProfileTab({ 
  profileData, 
  onProfileChange, 
  onSave, 
  isLoading = false,
  profileImage,
  setProfileImage
}: ProfileTabProps) {
  const [showImageModal, setShowImageModal] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleImageClick = () => {
    setShowImageModal(true);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    setUploadError(null);

    try {
      // Show instant preview while upload is in progress
      const previewUrl = URL.createObjectURL(file);
      setProfileImage(previewUrl);

      // Upload the file to the backend
      const response = await uploadProfilePicture(file);
      
      // Update the profile image state with the new path
      const imageUrl = getBackendAssetUrl(response.path);
      setProfileImage(imageUrl);
      
      // Update localStorage to persist the change across the application
      const userData = localStorage.getItem('user_data');
      if (userData) {
        const parsedUserData = JSON.parse(userData);
        parsedUserData.profile_picture = response.path;
        localStorage.setItem('user_data', JSON.stringify(parsedUserData));
        
        // Dispatch custom event to notify other components of the update
        window.dispatchEvent(new CustomEvent('userDataUpdated'));
      }
      
      console.log('Profile picture uploaded successfully:', response);
    } catch (error: any) {
      console.error('Failed to upload profile picture:', error);
      setUploadError(error.message || 'فشل في رفع الصورة');
    } finally {
      setUploadLoading(false);
      // Clean up preview URL if we created one
      const current = profileImage;
      if (current && current.startsWith('blob:')) {
        try { URL.revokeObjectURL(current); } catch {}
      }
    }
  };

  const handleDeleteImage = () => {
    setProfileImage(null);
    
    // Update localStorage to remove the profile picture
    const userData = localStorage.getItem('user_data');
    if (userData) {
      const parsedUserData = JSON.parse(userData);
      parsedUserData.profile_picture = null;
      localStorage.setItem('user_data', JSON.stringify(parsedUserData));
      
      // Dispatch custom event to notify other components of the update
      window.dispatchEvent(new CustomEvent('userDataUpdated'));
    }
  };

  const closeModal = () => {
    setShowImageModal(false);
  };

  return (
    <>
      <div className="profile-section">
        <div className="profile-image-section">
          <div className="profile-image-container">
            <div className="profile-image" onClick={handleImageClick}>
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="profile-img" />
              ) : (
                <span className="profile-placeholder">👤</span>
              )}
              <div className="camera-icon">
                📷
              </div>
            </div>
          </div>
          <div className="profile-image-actions">
            <label className="image-button primary">
              {uploadLoading ? 'جاري الرفع...' : 'إضافة صورة جديدة'}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange}
                style={{ display: 'none' }}
                disabled={uploadLoading}
              />
            </label>
            <button 
              className="image-button secondary" 
              onClick={handleDeleteImage}
              disabled={uploadLoading}
            >
              مسح الصورة
            </button>
          </div>
          
          {/* Upload Error Message */}
          {uploadError && (
            <div className="error-message" style={{ 
              color: '#e74c3c', 
              fontSize: '14px', 
              marginTop: '10px',
              textAlign: 'center'
            }}>
              {uploadError}
            </div>
          )}
        </div>

        <form className="settings-form" onSubmit={onSave}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">الاسم الأول</label>
              <input 
                type="text" 
                className="form-input"
                value={profileData.firstName}
                onChange={(e) => onProfileChange('firstName', e.target.value)}
                placeholder="أدخل الاسم الأول"
                disabled={isLoading}
              />
            </div>
            <div className="form-group">
              <label className="form-label">الاسم الأخير</label>
              <input 
                type="text" 
                className="form-input"
                value={profileData.lastName}
                onChange={(e) => onProfileChange('lastName', e.target.value)}
                placeholder="أدخل الاسم الأخير"
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="form-group">
            <p className="form-hint">سيتم استخدام هذا الاسم كما هو في الشهادات المستلمة</p>
          </div>
        <div className="form-group">
          <label className="form-label">البريد الإلكتروني</label>
          <input 
            type="email" 
            className="form-input"
            value={profileData.email}
            readOnly
            placeholder="البريد الإلكتروني المسجل"
            disabled={isLoading}
          />
          <p className="form-hint">البريد الإلكتروني ثابت حسب التسجيل ولا يمكن تغييره هنا</p>
        </div>
          <button 
            type="submit" 
            className="save-button" 
            disabled={isLoading}
          >
            {isLoading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </form>
      </div>

      {/* Image Preview Modal */}
      {showImageModal && (
        <div className="image-modal-overlay" onClick={closeModal}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-button" onClick={closeModal}>
              ×
            </button>
            <div className="modal-image-container">
              {profileImage ? (
                <img src={profileImage} alt="Profile Preview" className="modal-image" />
              ) : (
                <div className="modal-placeholder">
                  <span className="modal-placeholder-icon">👤</span>
                  <p>لا توجد صورة شخصية</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}