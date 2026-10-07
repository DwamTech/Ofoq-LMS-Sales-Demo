'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FiHelpCircle, FiPlay } from 'react-icons/fi';
import LoginForm from './LoginForm';
import VideoPopup from './VideoPopup';
import styles from './AuthPageContent.module.css';

const AuthPageContent: React.FC = () => {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') as 'login' | 'signup' | null;
  const [isVideoPopupOpen, setIsVideoPopupOpen] = useState(false);

  const videoUrl = 'https://player.mediadelivery.net/embed/513468/6477874c-67f9-4b72-bebc-a7d5679f342a';

  return (
    <div className={styles.authContainer}>
      <LoginForm initialTab={tab} />

      {/* Help Button moved below the form */}
      <button 
        className={styles.helpButton}
        onClick={() => setIsVideoPopupOpen(true)}
        aria-label="كيفية التسجيل في المنصة"
      >
        <FiPlay className={styles.playIcon} />
        <span>كيفية التسجيل في المنصة</span>
        <FiHelpCircle className={styles.helpIcon} />
      </button>
      
      <VideoPopup 
        isOpen={isVideoPopupOpen}
        onClose={() => setIsVideoPopupOpen(false)}
        videoUrl={videoUrl}
        title="كيفية التسجيل في المنصة"
      />
    </div>
  );
};

export default AuthPageContent;
