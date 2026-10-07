'use client';

import React from 'react';
import styles from './Skeleton.module.css';

// ============================================
// Base Skeleton Component
// ============================================

interface SkeletonProps {
    className?: string;
    width?: string | number;
    height?: string | number;
    borderRadius?: string | number;
    dark?: boolean;
    style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    width,
    height,
    borderRadius,
    dark = false,
    style = {},
}) => {
    return (
        <div
            className={`${dark ? styles['skeleton-dark'] : styles.skeleton} ${className}`}
            style={{
                width: typeof width === 'number' ? `${width}px` : width,
                height: typeof height === 'number' ? `${height}px` : height,
                borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
                ...style,
            }}
        />
    );
};

// ============================================
// Text Skeletons
// ============================================

interface SkeletonTextProps {
    lines?: number;
    width?: string;
    className?: string;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
    lines = 1,
    width = '100%',
    className = '',
}) => {
    return (
        <div className={className}>
            {Array.from({ length: lines }).map((_, i) => (
                <div
                    key={i}
                    className={`${styles.skeleton} ${styles['skeleton-text']}`}
                    style={{
                        width: i === lines - 1 && lines > 1 ? '70%' : width,
                    }}
                />
            ))}
        </div>
    );
};

export const SkeletonTitle: React.FC<{ width?: string; className?: string }> = ({
    width = '60%',
    className = '',
}) => (
    <div
        className={`${styles.skeleton} ${styles['skeleton-title']} ${className}`}
        style={{ width }}
    />
);

// ============================================
// Media Skeletons
// ============================================

export const SkeletonAvatar: React.FC<{
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}> = ({ size = 'md', className = '' }) => {
    const sizeClass = size === 'lg' ? styles['skeleton-avatar-lg'] : '';
    return (
        <div className={`${styles.skeleton} ${styles['skeleton-avatar']} ${sizeClass} ${className}`} />
    );
};

export const SkeletonImage: React.FC<{
    aspectRatio?: string;
    className?: string;
}> = ({ aspectRatio = '16/9', className = '' }) => (
    <div
        className={`${styles.skeleton} ${styles['skeleton-image']} ${className}`}
        style={{ aspectRatio }}
    />
);

export const SkeletonVideo: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`${styles['skeleton-video']} ${className}`} />
);

// ============================================
// Button Skeleton
// ============================================

export const SkeletonButton: React.FC<{
    width?: string | number;
    className?: string;
}> = ({ width = 120, className = '' }) => (
    <div
        className={`${styles.skeleton} ${styles['skeleton-button']} ${className}`}
        style={{ width: typeof width === 'number' ? `${width}px` : width }}
    />
);

// ============================================
// Breadcrumb Skeleton
// ============================================

export const SkeletonBreadcrumb: React.FC<{ items?: number }> = ({ items = 4 }) => (
    <div className={styles['skeleton-breadcrumb']}>
        {Array.from({ length: items }).map((_, i) => (
            <div
                key={i}
                className={`${styles.skeleton} ${styles['skeleton-breadcrumb-item']}`}
            />
        ))}
    </div>
);

// ============================================
// Navigation Skeleton
// ============================================

export const SkeletonNavigation: React.FC = () => (
    <div className={styles['skeleton-nav']}>
        <div className={`${styles.skeleton} ${styles['skeleton-nav-btn']}`} />
        <div className={`${styles.skeleton} ${styles['skeleton-nav-btn']}`} />
    </div>
);

// ============================================
// Course Card Skeleton
// ============================================

export const SkeletonCourseCard: React.FC = () => (
    <div className={styles['skeleton-course-card']}>
        <div className={`${styles.skeleton} ${styles['skeleton-course-card-image']}`} />
        <div className={styles['skeleton-course-card-content']}>
            <div className={`${styles.skeleton} ${styles['skeleton-course-card-title']}`} />
            <div className={styles['skeleton-course-card-meta']}>
                <div className={`${styles.skeleton} ${styles['skeleton-course-card-meta-item']}`} />
                <div className={`${styles.skeleton} ${styles['skeleton-course-card-meta-item']}`} />
                <div className={`${styles.skeleton} ${styles['skeleton-course-card-meta-item']}`} />
            </div>
            <div className={styles['skeleton-course-card-footer']}>
                <div className={`${styles.skeleton} ${styles['skeleton-course-card-price']}`} />
                <div className={`${styles.skeleton} ${styles['skeleton-course-card-btn']}`} />
            </div>
        </div>
    </div>
);

// ============================================
// Course Content Skeleton (Chapters & Lessons)
// ============================================

interface SkeletonCourseContentProps {
    chapters?: number;
    lessonsPerChapter?: number;
}

export const SkeletonCourseContent: React.FC<SkeletonCourseContentProps> = ({
    chapters = 3,
    lessonsPerChapter = 4,
}) => (
    <div className={styles['skeleton-course-content']}>
        {Array.from({ length: chapters }).map((_, chapterIndex) => (
            <div key={chapterIndex} className={styles['skeleton-chapter']}>
                <div className={styles['skeleton-chapter-header']}>
                    <div className={`${styles.skeleton} ${styles['skeleton-chapter-title']}`} />
                    <div className={`${styles.skeleton}`} style={{ width: 24, height: 24, borderRadius: 4 }} />
                </div>
                {Array.from({ length: lessonsPerChapter }).map((_, lessonIndex) => (
                    <div key={lessonIndex} className={styles['skeleton-lesson']}>
                        <div className={`${styles.skeleton} ${styles['skeleton-lesson-icon']}`} />
                        <div className={`${styles.skeleton} ${styles['skeleton-lesson-title']}`} />
                    </div>
                ))}
            </div>
        ))}
    </div>
);

// ============================================
// Grid Skeleton
// ============================================

interface SkeletonGridProps {
    count?: number;
    CardComponent?: React.FC;
}

export const SkeletonGrid: React.FC<SkeletonGridProps> = ({
    count = 6,
    CardComponent = SkeletonCourseCard,
}) => (
    <div className={styles['skeleton-grid']}>
        {Array.from({ length: count }).map((_, i) => (
            <CardComponent key={i} />
        ))}
    </div>
);

// ============================================
// Watch Page Skeleton
// ============================================

export const WatchPageSkeleton: React.FC = () => (
    <div className={styles['watch-skeleton-container']}>
        {/* Video Player */}
        <SkeletonVideo />

        {/* Breadcrumb */}
        <SkeletonBreadcrumb items={4} />

        {/* Navigation */}
        <SkeletonNavigation />

        {/* Course Content */}
        <SkeletonCourseContent chapters={2} lessonsPerChapter={3} />
    </div>
);

// ============================================
// Course Details Page Skeleton
// ============================================

export const CourseDetailsSkeleton: React.FC = () => (
    <div style={{ padding: '24px', background: '#f9fafb', minHeight: '100vh' }}>
        {/* Hero Section */}
        <div style={{ display: 'flex', gap: '32px', marginBottom: '32px', flexWrap: 'wrap' }}>
            <SkeletonImage className={styles.skeleton} aspectRatio="16/9" />
            <div style={{ flex: 1, minWidth: '300px' }}>
                <SkeletonTitle width="80%" />
                <SkeletonText lines={3} />
                <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                    <SkeletonButton width={150} />
                    <SkeletonButton width={100} />
                </div>
            </div>
        </div>

        {/* Stats */}
        <div className={styles['skeleton-stats']}>
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className={styles['skeleton-stat']}>
                    <div className={`${styles.skeleton} ${styles['skeleton-stat-value']}`} />
                    <div className={`${styles.skeleton} ${styles['skeleton-stat-label']}`} />
                </div>
            ))}
        </div>

        {/* Course Content */}
        <SkeletonCourseContent chapters={3} lessonsPerChapter={4} />
    </div>
);

// ============================================
// Diplomas Grid Skeleton
// ============================================

export const DiplomasGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
    <div style={{ padding: '24px' }}>
        <SkeletonTitle width="200px" />
        <SkeletonGrid count={count} />
    </div>
);

// ============================================
// Table Skeleton
// ============================================

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({
    rows = 5,
    cols = 4,
}) => (
    <div className={styles['skeleton-table']}>
        {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className={styles['skeleton-table-row']}>
                {Array.from({ length: cols }).map((_, colIndex) => (
                    <div key={colIndex} className={`${styles.skeleton} ${styles['skeleton-table-cell']}`} />
                ))}
            </div>
        ))}
    </div>
);

export default Skeleton;
