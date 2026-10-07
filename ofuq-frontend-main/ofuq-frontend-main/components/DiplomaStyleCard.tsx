import React from 'react';
import Link from 'next/link';
import { FiPlay, FiUser } from 'react-icons/fi';
import styles from './DiplomaStyleCard.module.css';

interface DiplomaStyleCardProps {
  id: string;
  title: string;
  image: string;
  description?: string;
  category: string | { id: number; name: string; created_at?: string; updated_at?: string };
  instructorName: string;
  instructorAvatar?: string;
  price: number;
  priceText?: string;
  linkPath?: string;
}

const DiplomaStyleCard: React.FC<DiplomaStyleCardProps> = ({
  id,
  title,
  image,
  description,
  category,
  instructorName,
  instructorAvatar,
  price,
  priceText,
  linkPath = `/course-details/${id}`
}) => {
  const categoryName = typeof category === 'string' ? category : category?.name ?? 'عام';
  const displayPriceText = priceText || (price === 0 ? 'مجاني' : `${price} جنيه`);

  return (
    <Link href={linkPath} className={styles.courseCard}>
      <div className={styles.courseImageWrapper}>
        <img src={image} alt={title} className={styles.courseImage} />
        <div className={styles.courseOverlay}>
          <div className={styles.coursePlayButton}>
            <FiPlay />
          </div>
        </div>
        <div className={styles.courseBadge}>
          {displayPriceText}
        </div>
      </div>
      <div className={styles.courseContent}>
        <h3 className={styles.courseTitle}>{title}</h3>
        {description && (
          <p className={styles.courseDescription}>{description}</p>
        )}
        <div className={styles.courseMeta}>
          <div className={styles.courseInstructor}>
            <i className={styles.instructorIcon}>
              <FiUser />
            </i>
            <span>المحاضر: {instructorName}</span>
          </div>
        </div>
        <div className={styles.courseFooter}>
          <span className={styles.courseAction}>ابدأ التعلم</span>
          <i className={styles.arrowIcon}>←</i>
        </div>
      </div>
    </Link>
  );
};

export default DiplomaStyleCard;