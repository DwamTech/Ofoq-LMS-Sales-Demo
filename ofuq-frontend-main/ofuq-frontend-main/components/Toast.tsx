'use client';

import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'confirm';
  isVisible: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  duration?: number;
}

export default function Toast({
  message,
  type,
  isVisible,
  onClose,
  onConfirm,
  onCancel,
  duration = 5000
}: ToastProps) {
  useEffect(() => {
    if (isVisible && type !== 'confirm') {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose, type]);

  if (!isVisible) return null;

  // اختيار غلاف العرض: تأكيد = Overlay، غير ذلك = أعلى يمين
  const wrapperClass = type === 'confirm' ? 'toast-overlay' : 'toast-container';

  const getToastIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      case 'confirm':
        return '?';
      default:
        return 'ℹ';
    }
  };

  const getToastClass = () => {
    return `toast toast-${type} ${isVisible ? 'toast-visible' : ''}`;
  };

  return (
    <div className={wrapperClass}>
      <div className={getToastClass()}>
        <div className="toast-content">
          <div className="toast-icon">
            {getToastIcon()}
          </div>
          <div className="toast-message">
            {message}
          </div>
          {type !== 'confirm' && (
            <button className="toast-close" onClick={onClose}>
              ×
            </button>
          )}
        </div>
        
        {type === 'confirm' && (
          <div className="toast-actions">
            <button className="toast-btn toast-btn-confirm" onClick={onConfirm}>
              تأكيد
            </button>
            <button className="toast-btn toast-btn-cancel" onClick={onCancel}>
              إلغاء
            </button>
          </div>
        )}
      </div>
    </div>
  );
}