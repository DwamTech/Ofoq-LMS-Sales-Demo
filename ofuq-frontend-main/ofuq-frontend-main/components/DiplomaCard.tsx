'use client';

import Link from 'next/link';
import styles from './DiplomaCard.module.css';

export interface DiplomaCardProps {
  id: string;
  name: string;
  description: string;
  image: string; // رابط الصورة الكامل أو النسبي
  price: number;
  isFree: boolean;
  slug: string; // يُستخدم للتوجيه إلى صفحة التفاصيل
  coursesCount?: number;
}

const truncate = (text: string, max: number = 140): string => {
  if (!text) return '';
  const clean = String(text).trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, Math.max(0, max - 1)) + '…';
};

const formatPrice = (amount: number): string => {
  const n = Number(amount || 0);
  return n.toLocaleString('ar-SA');
};

export default function DiplomaCard({
  id,
  name,
  description,
  image,
  price,
  isFree,
  slug,
  coursesCount,
}: DiplomaCardProps) {
  const href = `/diplomas/${slug}`; // رابط صفحة تفاصيل الدبلومة
  const imgSrc = image || '/logo.png'; // صورة افتراضية عند غياب الصورة
  const displayPrice = isFree ? 'مجاني' : `${formatPrice(price)} ر.س`;

  return (
    <Link href={href} prefetch={false} className={styles['diploma-card']} data-id={id}>
      <div className={styles['diploma-card-image-wrapper']}>
        <img className={styles['diploma-card-image']} src={imgSrc} alt={name} />
      </div>

      <div className={styles['diploma-card-content']}>
        <h3 className={styles['diploma-card-title']}>{name}</h3>
        <p className={styles['diploma-card-description']}>{truncate(description)}</p>

        <div className={styles['diploma-card-meta']}>
          <span className={styles['diploma-card-price']}>{displayPrice}</span>
          {typeof coursesCount === 'number' && (
            <span className={styles['diploma-card-courses']}>عدد المقررات: {coursesCount}</span>
          )}
        </div>

        <span className={styles['diploma-card-button']}>عرض التفاصيل</span>
      </div>
    </Link>
  );
}