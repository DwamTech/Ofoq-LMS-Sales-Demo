import { brand } from '@/lib/brand'
import HomeHeader from '../../components/HomeHeader';
import Footer from '../../components/Footer';
import CommunityMedia from '../../components/brand/CommunityMedia';
import { communityVideos } from '../../components/brand/communityMediaSources';
import styles from '../../components/brand/PublicEducation.module.css';
export const dynamic = 'force-dynamic';
export default async function CommunityPage() {
  const statuses = await Promise.all(Object.entries(communityVideos).map(async ([language, url]) => {
    try {
      const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
      await response.body?.cancel();
      return [language, response.ok] as const;
    } catch { return [language, false] as const; }
  }));
  const available = Object.fromEntries(statuses) as Record<keyof typeof communityVideos, boolean>;
  return <div><HomeHeader /><main>
    <header className={styles.courseHero}><p>المحتوى والمجتمع</p><h1>مجتمع {brand.name}</h1><p>استكشف المحتوى التعليمي، وتابع مواد المجتمع عند توفرها.</p></header>
    <CommunityMedia available={available} />
    <section className={styles.communityTopics} aria-label="أقسام المجتمع"><span>حقائب تدريبية</span><span>كتب ومناهج</span><span>محاضرات</span></section>
  </main><Footer /></div>;
}
