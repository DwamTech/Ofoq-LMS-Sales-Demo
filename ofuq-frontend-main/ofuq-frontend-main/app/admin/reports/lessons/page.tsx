'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  PlayCircle,
  Search,
  Download,
  ArrowRight,
  RefreshCw,
  Eye,
  Clock,
  BarChart3,
  Trophy,
  BookOpen,
  Users,
} from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import AdminState from '@/components/admin/AdminState';
import { getReportsOverview } from '@/utils/reportsService';
import { exportCSV } from '@/utils/exportUtils';
import type { ReportLessonOverview } from '@/types/reports';
import styles from './LessonsReport.module.css';

const fmt = (v: unknown) => {
  if (v === null || v === undefined || v === '') return '-';
  if (typeof v === 'number') return v.toLocaleString('ar-EG');
  return String(v);
};

const formatSeconds = (value: unknown): string => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  if (hours > 0) return `${hours.toLocaleString('ar-EG')} س ${minutes.toLocaleString('ar-EG')} د`;
  return `${minutes.toLocaleString('ar-EG')} دقيقة`;
};

const getRankClass = (index: number) => {
  if (index === 0) return styles.rankGold;
  if (index === 1) return styles.rankSilver;
  if (index === 2) return styles.rankBronze;
  return styles.rankDefault;
};

export default function LessonsReportsIndexPage() {
  const router = useRouter();
  const [data, setData] = useState<ReportLessonOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getReportsOverview();
      setData(res.top_lessons || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحميل الدروس');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter(l =>
      (l.lesson_title as string || l.title || '')?.toLowerCase().includes(term) ||
      (l.course_title || '')?.toLowerCase().includes(term)
    );
  }, [data, searchTerm]);

  // Stats
  const totalLessons = data.length;
  const totalSessions = data.reduce((sum, l) => sum + (Number(l.sessions_count) || 0), 0);
  const totalWatchSeconds = data.reduce((sum, l) => sum + (Number(l.watch_duration_seconds) || Number(l.watch_seconds) || 0), 0);

  const handleExportAll = () => {
    exportCSV(
      `تقارير_الدروس_${new Date().toLocaleDateString('ar-EG')}`,
      ['الترتيب', 'الدرس', 'المقرر', 'الجلسات', 'وقت المشاهدة (ثانية)'],
      filteredData.map((l, i) => [
        i + 1,
        (l as any).lesson_title || l.title || '-',
        l.course_title || '-',
        (l as any).sessions_count ?? l.views ?? '-',
        (l as any).watch_duration_seconds ?? l.watch_seconds ?? '-',
      ])
    );
  };

  return (
    <AdminPage>
      <motion.div className={styles.page} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

        {/* ─── Hero ─── */}
        <div className={styles.hero}>
          <div className={styles.heroRow}>
            <div className={styles.heroText}>
              <h1>🎬 تقارير الدروس</h1>
              <p>متابعة أداء الدروس ونسب التفاعل والمشاهدات. الدروس مرتبة بحسب إجمالي وقت المشاهدة.</p>
            </div>
            <div className={styles.heroActions}>
              <button className={`${styles.heroBtn} ${styles.heroBtnPrimary}`} onClick={handleExportAll}>
                <Download size={18} />
                تصدير الكل
              </button>
              <button className={`${styles.heroBtn} ${styles.heroBtnSecondary}`} onClick={() => router.push('/admin/reports')}>
                <ArrowRight size={18} />
                العودة
              </button>
            </div>
          </div>
        </div>

        {/* ─── Stats ─── */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: '#f5f3ff', color: '#8b5cf6' }}>
              <PlayCircle size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{fmt(totalLessons)}</span>
              <span className={styles.statLabel}>الدروس المتتبعة</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: '#eff6ff', color: '#3b82f6' }}>
              <Users size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{fmt(totalSessions)}</span>
              <span className={styles.statLabel}>إجمالي الجلسات</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
              <Clock size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{formatSeconds(totalWatchSeconds)}</span>
              <span className={styles.statLabel}>إجمالي وقت المشاهدة</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: '#fffbeb', color: '#f59e0b' }}>
              <Trophy size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>
                {data[0] ? String((data[0] as any).lesson_title || data[0].title || '-').substring(0, 20) : '-'}
              </span>
              <span className={styles.statLabel}>الدرس الأكثر مشاهدة</span>
            </div>
          </div>
        </div>

        {/* ─── Toolbar ─── */}
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={18} color="#94a3b8" />
            <input
              type="text"
              placeholder="ابحث باسم الدرس أو المقرر..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button className={styles.toolbarBtn} onClick={loadData} title="تحديث البيانات">
            <RefreshCw size={16} />
          </button>
        </div>

        {/* ─── Content ─── */}
        {loading && !data.length ? <AdminState type="loading" /> : null}
        {!loading && error ? <AdminState type="error" message={error} onAction={loadData} actionLabel="إعادة المحاولة" /> : null}
        {!loading && !error && !data.length ? <AdminState type="empty" message="لا توجد بيانات دروس حالياً." /> : null}

        {filteredData.length > 0 && (
          <div className={styles.tableSection}>
            <div className={styles.tableHeader}>
              <div className={styles.tableTitle}>
                الدروس الأكثر تفاعلاً ومشاهدة
                <span className={styles.tableCount}>({fmt(filteredData.length)} درس)</span>
              </div>
            </div>

            <div style={{ overflowX: 'auto', opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: 50 }}>#</th>
                    <th>الدرس</th>
                    <th>الجلسات</th>
                    <th>وقت المشاهدة</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((lesson, index) => {
                    const lessonId = lesson.lesson_id || lesson.id;
                    const lessonTitle = (lesson as any).lesson_title || lesson.title || '-';
                    const sessions = (lesson as any).sessions_count ?? lesson.views ?? 0;
                    const watchSec = (lesson as any).watch_duration_seconds ?? lesson.watch_seconds ?? 0;

                    return (
                      <tr key={`${lessonId}-${index}`}>
                        <td>
                          <span className={`${styles.rankBadge} ${getRankClass(index)}`}>
                            {(index + 1).toLocaleString('ar-EG')}
                          </span>
                        </td>
                        <td>
                          <div className={styles.lessonCell}>
                            <div className={styles.lessonIcon}>
                              <PlayCircle size={20} />
                            </div>
                            <div>
                              <div className={styles.lessonTitle}>{lessonTitle}</div>
                              {lesson.course_title && (
                                <div className={styles.lessonCourse}>{lesson.course_title}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`${styles.badge} ${styles.badgePurple}`}>
                            {fmt(sessions)}
                          </span>
                        </td>
                        <td>
                          <span className={`${styles.badge} ${styles.badgeGreen}`}>
                            {formatSeconds(Number(watchSec))}
                          </span>
                        </td>
                        <td>
                          <div className={styles.rowActions}>
                            <button
                              className={`${styles.rowBtn} ${styles.rowBtnView}`}
                              onClick={() => router.push(`/admin/reports/lessons/${lessonId}`)}
                              title="التقرير المفصل"
                            >
                              <BarChart3 size={14} />
                              التقرير
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className={styles.footerInfo}>
              <span className={styles.footerText}>
                يتم عرض أكثر الدروس تفاعلاً. لعرض جميع دروس مقرر معين، يرجى زيارة تقرير المقرر.
              </span>
            </div>
          </div>
        )}

        {!loading && !error && data.length > 0 && filteredData.length === 0 && (
          <AdminState type="empty" message="لا توجد دروس تطابق معايير البحث." />
        )}

        {/* ─── CTA ─── */}
        <div className={styles.ctaBanner}>
          <span className={styles.ctaText}>
            📖 لعرض جميع دروس مقرر معين بالتفصيل، قم بزيارة تقارير المقررات واختر المقرر المطلوب.
          </span>
          <Link href="/admin/reports/courses" className={styles.ctaBtn}>
            <BookOpen size={18} />
            تصفح تقارير المقررات
          </Link>
        </div>

      </motion.div>
    </AdminPage>
  );
}
