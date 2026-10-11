import React from 'react';
import Link from 'next/link';
import { ProgramArtwork } from './brand/ProgramArtwork';
import { publicPrice } from './brand/publicContent';
import styles from './CourseCard.module.css';

interface CourseCardProps {
  id: string;
  title: string;
  image: string;
  category: string | { id: number; name: string; created_at?: string; updated_at?: string };
  studentsCount: number;
  duration: string;
  lessonsCount: number;
  instructorName: string;
  instructorAvatar: string;
  price: number;
}

const CourseCard: React.FC<CourseCardProps> = ({
  id,
  title,
  image,
  category,
  studentsCount,
  duration,
  lessonsCount,
  instructorName,
  instructorAvatar,
  price
}) => {
  return (
    <Link href={`/course-details/${id}`} prefetch={false} className={styles['course-card-link']}>
      <div className={styles['course-card']}>
        <div className={styles['course-image']}>
          <ProgramArtwork title={title} image={image} identity={id} />
          <div className={styles['course-category']}>{typeof category === 'string' ? category : category?.name ?? 'عام'}</div>
        </div>

        <div className={styles['course-content']}>
          <h3 className={styles['course-title']}>{title}</h3>

          <div className={styles['course-stats']}>
            <div className={styles['stat-item']}>
              <svg className={styles['stat-icon']} viewBox="0 0 24 24">
                <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM4 18v-6h2.5l6 8h2L7 8H5.5l-2 2H2V8c0-1.1.9-2 2-2h3.5c.46 0 .91.17 1.28.46L10 7.5c.28-.28.72-.5 1.15-.5H15c1.1 0 2 .9 2 2 0 .34-.09 .66-.26 .94L15.5 12 19 16h-2.5l-2.5-3.5V18H4z" />
              </svg>
              <span>{studentsCount} طالب</span>
            </div>

            <div className={styles['stat-item']}>
              <svg className={styles['stat-icon']} viewBox="0 0 24 24">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
                <path d="M12.5 7H11v6l5.25 3.15 .75-1.23-4.5-2.67z" />
              </svg>
              <span>{duration}</span>
            </div>

            <div className={styles['stat-item']}>
              <svg className={styles['stat-icon']} viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1 .9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1 -.9 -2 -2 -2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
              </svg>
              <span>{lessonsCount} درس</span>
            </div>
          </div>

          <div className={styles['stats-separator']}></div>

          <div className={styles['instructor-info']}>
            <img src={instructorAvatar} alt={instructorName} className={styles['instructor-avatar']} />
            <span className={styles['instructor-name']}>{instructorName}</span>
          </div>

          <div className={styles['course-footer']}>
            <div className={styles['course-price']}>
              <span>{publicPrice(price)}</span>
            </div>

            <div className={styles['enroll-section']}>
              <span className={styles['enroll-text']}>تفاصيل المقرر</span>
              <div className={styles['enroll-arrow']}>
                <svg viewBox="0 0 24 24">
                  <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41 -1.41z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;
