'use client';

import React from 'react';

interface ResourceItem {
  id: string;
  title: string;
  description: string;
  url: string;
  type: 'website' | 'article' | 'video' | 'book' | 'tool' | 'other';
  domain?: string;
}

interface LessonResourcesProps {
  resources: ResourceItem[];
}

const LessonResources: React.FC<LessonResourcesProps> = ({ resources }) => {
  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'website':
        return (
          <svg viewBox="0 0 24 24" className="resource-icon website-icon">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        );
      case 'article':
        return (
          <svg viewBox="0 0 24 24" className="resource-icon article-icon">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h8c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
          </svg>
        );
      case 'video':
        return (
          <svg viewBox="0 0 24 24" className="resource-icon video-icon">
            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
          </svg>
        );
      case 'book':
        return (
          <svg viewBox="0 0 24 24" className="resource-icon book-icon">
            <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>
          </svg>
        );
      case 'tool':
        return (
          <svg viewBox="0 0 24 24" className="resource-icon tool-icon">
            <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" className="resource-icon default-icon">
            <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
          </svg>
        );
    }
  };

  const getResourceTypeLabel = (type: string) => {
    switch (type) {
      case 'website': return 'موقع ويب';
      case 'article': return 'مقال';
      case 'video': return 'فيديو';
      case 'book': return 'كتاب';
      case 'tool': return 'أداة';
      default: return 'مصدر';
    }
  };

  const handleResourceClick = (resource: ResourceItem) => {
    window.open(resource.url, '_blank', 'noopener,noreferrer');
  };

  const getDomainFromUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return 'رابط خارجي';
    }
  };

  if (!resources || resources.length === 0) {
    return (
      <div className="lesson-resources">
        <h3 className="resources-title">مصادر الدرس</h3>
        <div className="no-resources">
          <svg viewBox="0 0 24 24" className="no-resources-icon">
            <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
          </svg>
          <p>لا توجد مصادر إضافية لهذا الدرس</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lesson-resources">
      <h3 className="resources-title">مصادر الدرس</h3>
      <p className="resources-subtitle">مراجع ومصادر إضافية لتعميق فهمك للدرس</p>
      
      <div className="resources-list">
        {resources.map((resource) => (
          <div 
            key={resource.id} 
            className="resource-card"
            onClick={() => handleResourceClick(resource)}
          >
            <div className="resource-icon-container">
              {getResourceIcon(resource.type)}
            </div>
            
            <div className="resource-content">
              <div className="resource-header">
                <h4 className="resource-title">{resource.title}</h4>
                <span className="resource-type">{getResourceTypeLabel(resource.type)}</span>
              </div>
              
              <p className="resource-description">{resource.description}</p>
              
              <div className="resource-footer">
                <span className="resource-domain">
                  {resource.domain || getDomainFromUrl(resource.url)}
                </span>
                <svg viewBox="0 0 24 24" className="external-link-icon">
                  <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LessonResources;