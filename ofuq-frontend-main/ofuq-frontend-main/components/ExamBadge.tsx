import React from 'react';

interface ExamBadgeProps {
    hasFinalExam?: boolean;
    variant?: 'default' | 'compact';
}

/**
 * Badge يظهر للمقررات التي لديها اختبار نهائي
 */
export default function ExamBadge({ hasFinalExam = false, variant = 'default' }: ExamBadgeProps) {
    if (!hasFinalExam) return null;

    return (
        <>
            <div className={`exam-badge ${variant}`} title="يوجد اختبار نهائي">
                📝 {variant === 'default' && <span>اختبار نهائي</span>}
            </div>

            <style jsx>{`
        .exam-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
          display: flex;
          align-items: center;
          gap: 6px;
          z-index: 2;
          animation: fadeIn 0.3s ease-in;
          backdrop-filter: blur(4px);
          white-space: nowrap;
        }
        
        .exam-badge.compact {
          padding: 4px 8px;
          font-size: 16px;
          border-radius: 50%;
        }
        
        .exam-badge:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.6);
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
        </>
    );
}
