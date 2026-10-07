"use client";

import React, { useState } from 'react';
import { useUpload } from '@/contexts/UploadContext';
import '@/styles/upload-manager.css';

export default function UploadManager() {
  const { uploads, pauseUpload, resumeUpload, cancelUpload, clearUpload, isManagerOpen, setIsManagerOpen } = useUpload();
  const [collapsed, setCollapsed] = useState(false);

  if (!isManagerOpen || uploads.length === 0) return null;

  const handleToggle = () => {
    setCollapsed(!collapsed);
  };

  const activeCount = uploads.filter(u => u.status === 'uploading').length;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    if (e.target.files && e.target.files.length > 0) {
      resumeUpload(id, e.target.files[0]);
    }
  };

  return (
    <div className={`manager-container ${collapsed ? 'collapsed' : ''}`}>
      <div className="header" onClick={collapsed ? handleToggle : undefined}>
        <div className="header-left">
          <span>⬆️ جاري الرفع ({activeCount})</span>
        </div>
        <button className="toggle-btn" onClick={(e) => { e.stopPropagation(); handleToggle(); }}>
          {collapsed ? '▲' : '▼'}
        </button>
      </div>

      {!collapsed && (
        <div className="upload-list">
          {uploads.map(upload => {
            const isFinished = upload.status === 'success';
            const isError = upload.status === 'error';
            const isAborted = upload.status === 'aborted';
            const isPaused = upload.status === 'paused';
            
            return (
              <div key={upload.id} className="upload-item">
                <div className="item-header">
                  <div className="item-title" title={upload.title}>
                    {upload.title}
                  </div>
                  <div className="item-actions">
                    {!isFinished && !isAborted && upload.status === 'uploading' && (
                      <button className="action-btn" title="إيقاف مؤقت" onClick={() => pauseUpload(upload.id)}>⏸</button>
                    )}
                    {!isFinished && !isAborted && isPaused && upload.file && (
                      <button className="action-btn" title="استئناف" onClick={() => resumeUpload(upload.id)}>▶</button>
                    )}
                    {!isFinished && !isAborted && (
                      <button className="action-btn cancel" title="إلغاء" onClick={() => cancelUpload(upload.id)}>✖</button>
                    )}
                    {(isFinished || isAborted) && (
                      <button className="action-btn" title="إزالة" onClick={() => clearUpload(upload.id)}>✓</button>
                    )}
                  </div>
                </div>

                <div className="progress-container">
                  <div 
                    className={`progress-bar ${upload.status}`} 
                    style={{ width: `${Math.max(0, upload.progress)}%` }}
                  />
                </div>

                <div className="status-text">
                  <span>
                    {upload.status === 'uploading' && 'جاري الرفع...'}
                    {upload.status === 'paused' && 'متوقف مؤقتاً'}
                    {upload.status === 'success' && 'اكتمل بنجاح!'}
                    {upload.status === 'error' && 'حدث خطأ'}
                    {upload.status === 'aborted' && 'تم الإلغاء'}
                  </span>
                  <span>{Math.round(upload.progress)}%</span>
                </div>

                {/* If the upload is paused but there's no file (e.g. they refreshed the page) */}
                {isPaused && !upload.file && (
                  <div>
                    <input 
                      type="file" 
                      id={`file-${upload.id}`} 
                      style={{ display: 'none' }} 
                      accept="video/*"
                      onChange={(e) => handleFileChange(e, upload.id)}
                    />
                    <label htmlFor={`file-${upload.id}`} className="needs-file-btn" style={{display: 'block', textAlign: 'center'}}>
                      اختر الملف لاستئناف الرفع
                    </label>
                  </div>
                )}
                {isError && (
                  <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>
                    {upload.error}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
