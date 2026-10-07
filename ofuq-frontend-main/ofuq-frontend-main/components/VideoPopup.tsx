'use client';

import React, { useEffect } from 'react';
import { FiX, FiPlay } from 'react-icons/fi';
import styles from './VideoPopup.module.css';

interface VideoPopupProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title?: string;
}

const VideoPopup: React.FC<VideoPopupProps> = ({ isOpen, onClose, videoUrl, title }) => {
  // Close popup on Escape key press
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>
            <FiPlay className={styles.playIcon} />
            {title || 'كيفية التسجيل في المنصة'}
          </h3>
          <button 
            className={styles.closeButton} 
            onClick={onClose}
            aria-label="إغلاق"
          >
            <FiX />
          </button>
        </div>
        
        <div className={styles.videoContainer}>
          <iframe
            src={videoUrl}
            className={styles.video}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={title || 'كيفية التسجيل في المنصة'}
          />
        </div>
        
        <div className={styles.footer}>
          <p className={styles.footerText}>
            شاهد الفيديو لتتعلم كيفية التسجيل في المنصة بسهولة
          </p>
        </div>
      </div>
    </div>
  );
};

export default VideoPopup;