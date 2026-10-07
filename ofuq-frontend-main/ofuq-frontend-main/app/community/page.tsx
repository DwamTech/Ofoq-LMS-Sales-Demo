"use client";
import { useState, Suspense } from 'react';
export const dynamic = 'force-dynamic';
import HomeHeader from '../../components/HomeHeader';
import Footer from '../../components/Footer';
import ScrollToTop from '../../components/ScrollToTop';
import SocialMediaFloat from '../../components/SocialMediaFloat';
import VideoSection from '../../components/VideoSection';
import styles from './CommunityVideo.module.css';
import { FaBriefcase, FaBookOpen, FaChalkboardTeacher } from 'react-icons/fa';

const VIDEOS = {
  ar: 'https://player.mediadelivery.net/embed/513468/701818a9-844a-4796-89d2-1baa1a3222c2',
  en: 'https://player.mediadelivery.net/embed/513468/74337ead-730d-4b91-9086-52fe40101620',
  fr: 'https://player.mediadelivery.net/embed/513468/390b70e3-387a-44ef-bb0a-0f7fed31f326',
} as const;

function CommunityContent() {
  const [lang, setLang] = useState<'ar' | 'en' | 'fr'>('ar');
  const titleMap: Record<typeof lang, string> = {
    ar: 'مجتمع أفق',
    en: 'Community of Ofuq',
    fr: 'Communauté d’Ofuq',
  } as const;

  return (
    <main>
      <h3 className={styles.sectionTitle}>{titleMap[lang]}</h3>
      
      <div className={styles.languageSwitchContainer}>
        <button
          type="button"
          className={`${styles.languageButton} ${lang === 'ar' ? styles.active : ''}`}
          onClick={() => setLang('ar')}
          role="tab"
          aria-selected={lang === 'ar'}
        >
          عربي
        </button>
        <button
          type="button"
          className={`${styles.languageButton} ${lang === 'en' ? styles.active : ''}`}
          onClick={() => setLang('en')}
          role="tab"
          aria-selected={lang === 'en'}
        >
          English
        </button>
        <button
          type="button"
          className={`${styles.languageButton} ${lang === 'fr' ? styles.active : ''}`}
          onClick={() => setLang('fr')}
          role="tab"
          aria-selected={lang === 'fr'}
        >
          Français
        </button>
      </div>

      <VideoSection videoUrl={VIDEOS[lang]} title={titleMap[lang]} useIframe />

      {/* Features Icons Section */}
      <section className={styles.featuresSection} aria-label="أقسام المجتمع" dir="rtl">
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard} role="button" tabIndex={0} aria-label="حقائب تدريبية">
            <div className={styles.featureIconWrap}>
              <FaBriefcase className={styles.featureIcon} aria-hidden="true" />
            </div>
            <h4 className={styles.featureTitle}>حقائب تدريبية</h4>
          </div>

          <div className={styles.featureCard} role="button" tabIndex={0} aria-label="كتب ومناهج">
            <div className={styles.featureIconWrap}>
              <FaBookOpen className={styles.featureIcon} aria-hidden="true" />
            </div>
            <h4 className={styles.featureTitle}>كتب ومناهج</h4>
          </div>

          <div className={styles.featureCard} role="button" tabIndex={0} aria-label="محاضرات">
            <div className={styles.featureIconWrap}>
              <FaChalkboardTeacher className={styles.featureIcon} aria-hidden="true" />
            </div>
            <h4 className={styles.featureTitle}>محاضرات</h4>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function CommunityPage() {
  return (
    <div>
      <HomeHeader />
      <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>جاري التحميل...</div>}>
        <CommunityContent />
      </Suspense>
      <Footer />
      <ScrollToTop />
      <SocialMediaFloat />
    </div>
  );
}