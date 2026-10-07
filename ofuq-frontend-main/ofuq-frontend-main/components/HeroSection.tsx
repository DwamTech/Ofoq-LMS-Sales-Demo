'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './HeroSection.module.css';
import { getGeneralStats, GeneralStats } from '../utils/statsService';

const HeroSection = () => {
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stats, setStats] = useState<GeneralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const fullText = 'مستقبلك';

  // جلب الإحصائيات من الباك إند
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const statsData = await getGeneralStats();
        setStats(statsData);
      } catch (error) {
        console.error('Error fetching stats:', error);
        // في حالة الخطأ، استخدم قيم افتراضية
        setStats({
          total_students: 200,
          happy_students: 200,
          total_courses: 0,
          positive_reviews: 0,
          average_rating: 0,
          active_students: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isDeleting && currentIndex < fullText.length) {
        setDisplayText(fullText.substring(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      } else if (isDeleting && currentIndex > 0) {
        setDisplayText(fullText.substring(0, currentIndex - 1));
        setCurrentIndex(currentIndex - 1);
      } else if (!isDeleting && currentIndex === fullText.length) {
        setTimeout(() => setIsDeleting(true), 2000);
      } else if (isDeleting && currentIndex === 0) {
        setIsDeleting(false);
      }
    }, isDeleting ? 100 : 200);

    return () => clearTimeout(timer);
  }, [currentIndex, isDeleting, fullText]);

  const studentProfiles = [
    '/profile.jpg',
    '/profile.jpg',
    '/profile.jpg',
    '/profile.jpg'
  ];

  const [heroSearch, setHeroSearch] = useState('');
  const router = useRouter();

  const handleHeroSearch = () => {
    const q = heroSearch.trim();
    if (q) {
      router.push(`/diploms?search=${encodeURIComponent(q)}`);
    } else {
      router.push('/diploms');
    }
  };

  return (
    <section className={styles['hero-section']}>
      <div className={styles['hero-container']}>
        {/* Main Content Grid */}
        <div className={styles['hero-content']}>
          {/* Left Side Content */}
          <div className={styles['hero-left']}>
            {/* Student Stats */}
            <div className={styles['student-stats']}>
              <div className={styles['stats-content']}>
                <span className={styles['student-count']}>
                  {loading ? '...' : `${stats?.total_students || 0}+`}
                </span>
                <span className={styles['student-label']}>طالب</span>
              </div>
              <div className={styles['student-profiles']}>
                {studentProfiles.map((profile, index) => (
                  <div key={index} className={styles['profile-avatar']} style={{ zIndex: studentProfiles.length - index }}>
                    <img src={profile} alt={`Student ${index + 1}`} />
                  </div>
                ))}
              </div>
            </div>

            {/* Certificate Badge */}
            <div className={styles['certificate-badge']}>
              تعلّم واحصل على الشهادات
            </div>

            {/* Main Title */}
            <div className={styles['hero-title']}>
              <h1>
                تعلم مهارة جديدة وغيّر{' '}
                <span className={styles['animated-text']}>
                  {displayText}
                  <span className={styles['cursor']}>|</span>
                </span>
              </h1>
            </div>

            {/* Subtitle */}
            <p className={styles['hero-subtitle']}>
              دروس مبسطة، محتوى عالي الجودة، ودعم مستمر لمساعدتك تحقق أهدافك
            </p>
          </div>

          {/* Right Side Content */}
          <div className={styles['hero-right']}>
            <div className={styles['hero-image-container']}>
              <img
                src="/hero-image.png"
                alt="Learning Illustration"
                className={styles['hero-image']}
              />

              {/* Course Stats */}
              <div className={styles['course-stats']}>
                <span className={styles['course-count']}>
                  {loading ? '...' : `${stats?.total_courses || 0}+`}
                </span>
                <span className={styles['course-label']}>دبلومات أفق</span>
              </div>
            </div>
          </div>
        </div>

        {/* Centered Search Section */}
        <div className={styles['hero-search-section']}>
          <div className={styles['smart-search']}>
            <div className={styles['search-container']}>
              <input
                type="text"
                placeholder="ابحث عن..."
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleHeroSearch(); }}
                className={styles['search-input']}
              />
              <button className={styles['search-button']} onClick={handleHeroSearch}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;