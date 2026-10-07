'use client';

import React from 'react';

interface InstructorProfileProps {
  instructorName: string;
  instructorImage: string;
  coursesCount: number;
  studentsCount: number;
  title?: string;
  bio?: string;
}

const InstructorProfile: React.FC<InstructorProfileProps> = ({
  instructorName,
  instructorImage,
  coursesCount,
  studentsCount,
  title,
  bio
}) => {
  return (
    <div className="instructor-profile">
      {/* Instructor Name and Description */}
      <div className="instructor-header">
        <h2 className="instructor-name">{instructorName}</h2>
        {title && (
          <p className="instructor-description">{title}</p>
        )}
      </div>

      {/* Instructor Image and Stats */}
      <div className="instructor-main-section">
        <div className="instructor-image-container">
          <img 
            src={instructorImage} 
            alt={instructorName}
            className="instructor-profile-image"
          />
        </div>
        
        <div className="instructor-stats">
          {/* Courses Count */}
          <div className="instructor-stat-item">
            <div className="stat-icon-container">
              <svg className="stat-icon" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{coursesCount} دورات</div>
            </div>
          </div>

          {/* Students Count */}
          <div className="instructor-stat-item">
            <div className="stat-icon-container">
              <svg className="stat-icon" viewBox="0 0 24 24">
                <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.5 7.5h-5A1.5 1.5 0 0 0 12.04 8.37L9.5 16H12v6h8zM12.5 11.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S11 9.17 11 10s.67 1.5 1.5 1.5zM5.5 6c1.11 0 2-.89 2-2s-.89-2-2-2-2 .89-2 2 .89 2 2 2zm2 16v-6H10l-2.54-7.63A1.5 1.5 0 0 0 6 7.5H1A1.5 1.5 0 0 0 -.46 8.37L-3 16h2.5v6h8z"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{studentsCount.toLocaleString()} طالب</div>
            </div>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="instructor-about">
        <h3 className="about-title">نبذة عنه:</h3>
        <p className="about-text">{bio || 'لا توجد نبذة متاحة'}</p>
      </div>

      <style jsx>{`
        .instructor-profile {
          direction: rtl;
          padding: 20px 0;
        }

        .instructor-header {
          margin-bottom: 30px;
        }

        .instructor-name {
          font-size: 28px;
          font-weight: bold;
          color: #333;
          margin: 0 0 10px 0;
          text-align: right;
        }

        .instructor-description {
          font-size: 16px;
          color: #666;
          margin: 0;
          line-height: 1.5;
          text-align: right;
        }

        .instructor-main-section {
          display: flex;
          gap: 30px;
          margin-bottom: 40px;
          align-items: flex-start;
        }

        .instructor-image-container {
          flex-shrink: 0;
        }

        .instructor-profile-image {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid #f0f0f0;
        }

        .instructor-stats {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .instructor-stat-item {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .stat-icon-container {
          width: 40px;
          height: 40px;
          background: #4142D0;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .stat-icon {
          width: 20px;
          height: 20px;
          fill: white;
        }

        .stat-content {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .stat-value {
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }

        .instructor-about {
          border-top: 1px solid #eee;
          padding-top: 30px;
        }

        .about-title {
          font-size: 20px;
          font-weight: bold;
          color: #333;
          margin: 0 0 15px 0;
          text-align: right;
        }

        .about-text {
          font-size: 16px;
          color: #666;
          line-height: 1.7;
          margin: 0;
          text-align: right;
        }

        @media (max-width: 768px) {
          .instructor-main-section {
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 20px;
          }

          .instructor-profile-image {
            width: 100px;
            height: 100px;
          }

          .instructor-stats {
            width: 100%;
          }

          .instructor-stat-item {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default InstructorProfile;
