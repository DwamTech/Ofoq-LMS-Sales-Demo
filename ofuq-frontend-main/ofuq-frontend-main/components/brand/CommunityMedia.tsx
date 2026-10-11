"use client";
import { brand } from '@/lib/brand'
import { useState } from 'react';
import VideoSection from '../VideoSection';
import { ArrowUpLeft, VideoOff } from 'lucide-react';
import styles from './PublicEducation.module.css';

import { communityVideos } from './communityMediaSources';
type Language = keyof typeof communityVideos;
export default function CommunityMedia({ available }: { available: Record<Language, boolean> }) {
  const [language, setLanguage] = useState<Language>('ar');
  const languages: Language[] = ['ar', 'en', 'fr'];
  return <section className={styles.communityMedia}>
    <div role="tablist" aria-label="لغة الفيديو" className={styles.mediaTabs}>
      {languages.map((lang, index) => <button key={lang} id={`media-${lang}`} role="tab" type="button" aria-selected={language === lang} aria-controls="community-media" tabIndex={language === lang ? 0 : -1} onClick={() => setLanguage(lang)} onKeyDown={event => {
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : event.key === 'ArrowRight' ? (index + 1) % 3 : event.key === 'ArrowLeft' ? (index + 2) % 3 : -1;
        if (next >= 0) { event.preventDefault(); setLanguage(languages[next]); document.getElementById(`media-${languages[next]}`)?.focus(); }
      }}>{lang === 'ar' ? 'عربي' : lang === 'en' ? 'English' : 'Français'}</button>)}
    </div>
    <div id="community-media" role="tabpanel" aria-labelledby={`media-${language}`}>
      {available[language] ? <VideoSection key={language} videoUrl={communityVideos[language]} title={`مجتمع ${brand.name}`} useIframe /> : <div className={styles.unavailableMedia}>
        <span data-media-empty-icon aria-hidden="true"><VideoOff size={34}/></span>
        <h2>الفيديو غير متاح حاليًا</h2>
        <p>تعذّر الوصول إلى مصدر الفيديو الأصلي. يمكنك متابعة استكشاف البرامج التعليمية المتاحة.</p>
        <a href="/diploms">استكشف البرامج <ArrowUpLeft size={19} aria-hidden="true"/></a>
      </div>}
    </div>
  </section>;
}
