'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import '../styles/watch-progress.css';

interface Course {
  id: number;
  name: string;
  progress: number;
  image: string;
  category: string | { id: number; name: string; created_at?: string; updated_at?: string };
  instructor: {
    name: string;
    avatar: string;
  };
  has_final_exam?: boolean; // مؤشر وجود اختبار نهائي
}

interface CourseGridProps {
  courses?: Course[];
  showAll?: boolean;
}

export default function CourseGrid({
  courses = [],
  showAll = false
}: CourseGridProps) {
  const router = useRouter();

  const CourseCard = ({ course }: { course: Course }) => (
    <div
      className="course-card"
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/course-details/${course.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          router.push(`/course-details/${course.id}`);
        }
      }}
      style={{ cursor: 'pointer' }}
    >
      <div className="course-image">
        <img src={course.image} alt={course.name} />
        {course.has_final_exam && (
          <div className="exam-badge" title="يوجد اختبار نهائي">
            📝
          </div>
        )}
      </div>
      <div className="course-content">
        <h4 className="course-name">{course.name}</h4>
        <div className="progress-section">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${course.progress}%` }}
            ></div>
          </div>
          <p className="course-progress">{course.progress}% مكتمل</p>
        </div>
        <div className="instructor-info">
          <img src={course.instructor.avatar} alt={course.instructor.name} className="instructor-avatar" />
          <span className="instructor-name">{course.instructor.name}</span>
        </div>
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
          gap: 4px;
          z-index: 2;
          animation: fadeIn 0.3s ease-in;
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
        
        .course-image {
          position: relative;
        }
      `}</style>
    </div>
  );

  if (showAll) {
    return (
      <div className="modal-courses-grid">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    );
  }

  return (
    <div className="course-carousel">
      {courses.slice(0, 3).map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}

export type { Course };