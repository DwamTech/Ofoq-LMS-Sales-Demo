import { brand } from '@/lib/brand'
import HomeHeader from '../../components/HomeHeader';
import Footer from '../../components/Footer';
import CommunityMedia from '../../components/brand/CommunityMedia';
import { communityVideos } from '../../components/brand/communityMediaSources';
import { BookOpen, Briefcase, MessagesSquare, Mic } from 'lucide-react';
import styles from './Community.module.css';
export const dynamic = 'force-dynamic';
export default async function CommunityPage() {
  const available = {ar:false,en:false,fr:false};
  return <div><HomeHeader /><main className={styles.page}>
    <header className={styles.hero}><span className={styles.heroIcon} aria-hidden="true"><MessagesSquare size={30}/></span><p className={styles.eyebrow}>المحتوى والمجتمع</p><h1>مجتمع <em>{brand.name}</em></h1><p className={styles.description}>استكشف المحتوى التعليمي، وتابع مواد المجتمع عند توفرها.</p></header>
    <CommunityMedia available={available} />
    <section className={styles.topics} aria-label="أقسام المجتمع">{([['حقائب تدريبية', Briefcase], ['كتب ومناهج', BookOpen], ['محاضرات', Mic]] as const).map(([label, Icon]) => <div className={styles.topic} key={label}><span aria-hidden="true"><Icon size={26}/></span><h2>{label}</h2></div>)}</section>
  </main><Footer /></div>;
}
