'use client';

import React from 'react';

interface AttachmentItem {
  id: string;
  name: string;
  type: 'image' | 'pdf' | 'ppt' | 'word' | 'other';
  size: string;
  url: string;
  thumbnail?: string;
}

interface LessonAttachmentsProps {
  attachments: AttachmentItem[];
}

const LessonAttachments: React.FC<LessonAttachmentsProps> = ({ attachments }) => {
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return (
          <svg viewBox="0 0 24 24" className="file-icon image-icon">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
          </svg>
        );
      case 'pdf':
        return (
          <svg viewBox="0 0 24 24" className="file-icon pdf-icon">
            <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v1h-1.5V7h3v1.5zM9 9.5h1v-1H9v1z"/>
          </svg>
        );
      case 'ppt':
        return (
          <svg viewBox="0 0 24 24" className="file-icon ppt-icon">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h8c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
          </svg>
        );
      case 'word':
        return (
          <svg viewBox="0 0 24 24" className="file-icon word-icon">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h8c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" className="file-icon default-icon">
            <path d="M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h8c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z"/>
          </svg>
        );
    }
  };

  const handleDownload = (attachment: AttachmentItem) => {
    // Create a temporary link element to trigger download
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreview = (attachment: AttachmentItem) => {
    if (attachment.type === 'image') {
      // Open image in new tab for preview
      window.open(attachment.url, '_blank');
    } else if (attachment.type === 'pdf') {
      // Open PDF in new tab
      window.open(attachment.url, '_blank');
    } else {
      // For other file types, trigger download
      handleDownload(attachment);
    }
  };

  if (!attachments || attachments.length === 0) {
    return (
      <div className="lesson-attachments">
        <h3 className="attachments-title">مرفقات الدرس</h3>
        <div className="no-attachments">
          <svg viewBox="0 0 24 24" className="no-attachments-icon">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h8c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
          </svg>
          <p>لا توجد مرفقات لهذا الدرس</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lesson-attachments">
      <h3 className="attachments-title">مرفقات الدرس</h3>
      <div className="attachments-grid">
        {attachments.map((attachment) => (
          <div key={attachment.id} className="attachment-card">
            <div className="attachment-preview">
              {attachment.type === 'image' && attachment.thumbnail ? (
                <img 
                  src={attachment.thumbnail} 
                  alt={attachment.name}
                  className="attachment-thumbnail"
                />
              ) : (
                <div className="attachment-icon-container">
                  {getFileIcon(attachment.type)}
                </div>
              )}
            </div>
            
            <div className="attachment-info">
              <h4 className="attachment-name" title={attachment.name}>
                {attachment.name}
              </h4>
              <p className="attachment-size">{attachment.size}</p>
            </div>
            
            <div className="attachment-actions">
              <button 
                className="preview-btn"
                onClick={() => handlePreview(attachment)}
                title="معاينة"
              >
                <svg viewBox="0 0 24 24" className="action-icon">
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                </svg>
              </button>
              
              <button 
                className="download-btn"
                onClick={() => handleDownload(attachment)}
                title="تحميل"
              >
                <svg viewBox="0 0 24 24" className="action-icon">
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LessonAttachments;