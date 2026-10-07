'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, BarChart3, Server, ArrowLeft, Users, BookOpen, Presentation, TrendingUp } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminState from '@/components/admin/AdminState';
import ReportCards, { type ReportCardItem } from '@/components/reports/ReportCards';
import ReportChart from '@/components/reports/ReportChart';
import ReportFilters from '@/components/reports/ReportFilters';
import ReportTable from '@/components/reports/ReportTable';
import { AccuracyBadge, CostBadge } from '@/components/reports/Badges';
import { normalizeApiError, type AdminNormalizedError } from '@/utils/adminError';
import { getReportsOverview } from '@/utils/reportsService';
import type {
  ReportActivityOverview,
  ReportCostSummary,
  ReportCourseOverview,
  ReportFilters as ReportFiltersValue,
  ReportLessonOverview,
  ReportsOverviewData,
} from '@/types/reports';
import styles from './Reports.module.css';

const HUB_CARDS = [
  {
    title: 'تقرير المستفيدين والإنجاز',
    description: 'ملخص إداري موحد للمستفيدين الفريدين ومن أكمل المسارات أو الدبلومات.',
    href: '/admin/reports/beneficiaries',
    icon: Users,
    color: '#059669',
    bg: '#ecfdf5',
  },
  {
    title: 'تقارير الطلاب',
    description: 'متابعة أداء الطلاب، نسب الإنجاز، وسجلات النشاط الفردية.',
    href: '/admin/reports/students',
    icon: Users,
    color: '#0ea5e9', // sky blue
    bg: '#f0f9ff',
  },
  {
    title: 'تقارير المقررات',
    description: 'إحصائيات التسجيل والمشاركة والتقدم في المقررات (الكورسات).',
    href: '/admin/reports/courses',
    icon: BookOpen,
    color: '#f43f5e', // rose
    bg: '#fff1f2',
  },
  {
    title: 'تقارير الدروس',
    description: 'تحليل مشاهدات الدروس، التفاعل، ونسب الإكمال لكل درس.',
    href: '/admin/reports/lessons',
    icon: Presentation,
    color: '#8b5cf6', // violet
    bg: '#f5f3ff',
  },
  {
    title: 'تقارير الدبلومات',
    description: 'تحليل أداء الدبلومات، أعداد المسجلين، ونسب التخرج.',
    href: '/admin/reports/diplomas',
    icon: GraduationCap,
    color: '#028faf',
    bg: '#f0f9ff',
  },
  {
    title: 'خوادم الفيديوهات',
    description: 'مراقبة استهلاك الباندويث وسجلات المزامنة مع BunnyCDN.',
    href: '/admin/reports/bunny',
    icon: Server,
    color: '#8b5cf6',
    bg: '#f5f3ff',
  },
  {
    title: 'تقارير الزيارات',
    description: 'إحصائيات تصفح المنصة، الأجهزة المستخدمة، والنشاط العام.',
    href: '/admin/reports/visits',
    icon: BarChart3,
    color: '#f59e0b',
    bg: '#fffbeb',
  },
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const formatValue = (value: unknown): string | number => {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'number') return value.toLocaleString('ar-EG');
  if (typeof value === 'boolean') return value ? 'نعم' : 'لا';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.length.toLocaleString('ar-EG');
  if (typeof value === 'object') {
    const obj = value as Record<string, any>;
    const localized = obj.ar || obj.en || obj.name || obj.title || obj.label;
    if (typeof localized === 'string') return localized;
    if (typeof localized === 'number') return localized.toLocaleString('ar-EG');
    return JSON.stringify(obj); // Temporary fallback to ensure no data is hidden
  }
  return '-';
};

const formatDate = (value: unknown): string => {
  if (typeof value !== 'string' || !value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('ar-EG');
};

const extractArray = <T extends Record<string, unknown>>(
  data: ReportsOverviewData,
  keys: string[]
): T[] => {
  for (const key of keys) {
    const value = data[key];
    if (Array.isArray(value)) return value.filter(isRecord) as T[];
  }
  return [];
};

const costValue = (cost?: ReportCostSummary): string => {
  if (!cost) return '-';
  const amount = typeof cost.amount === 'number' ? cost.amount.toLocaleString('ar-EG') : null;
  const currency = typeof cost.currency === 'string' ? cost.currency : '';
  return amount ? `${amount} ${currency}`.trim() : 'غير متاح';
};

const translateLabel = (key: string): string => {
  const map: Record<string, string> = {
    total_lessons: 'إجمالي الدروس',
    total_courses: 'إجمالي المقررات',
    total_diplomas: 'إجمالي الدبلومات',
    inactive_students: 'الطلاب غير النشطين',
    active_students: 'الطلاب النشطين',
    total_students: 'إجمالي الطلاب',
    completed_lessons_count: 'الدروس المكتملة',
    total_watch_duration_seconds: 'إجمالي المشاهدة (ثواني)',
    total_watch_sessions: 'جلسات المشاهدة',
    total_revenue: 'إجمالي الإيرادات',
    total_payments: 'إجمالي المدفوعات',
    active_courses: 'المقررات النشطة',
    active_lessons: 'الدروس النشطة',
  };
  return map[key.toLowerCase()] || key.replace(/_/g, ' ');
};

const deepFind = (obj: any, ...keys: string[]): any => {
  if (!obj || typeof obj !== 'object') return undefined;
  
  // First, check flat keys
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  
  // Second, check one level deep
  for (const val of Object.values(obj)) {
    if (typeof val === 'object' && val !== null) {
      for (const k of keys) {
        if ((val as Record<string, any>)[k] !== undefined && (val as Record<string, any>)[k] !== null) {
          return (val as Record<string, any>)[k];
        }
      }
    }
  }
  
  return undefined;
};

const buildCards = (data: ReportsOverviewData | null): ReportCardItem[] => {
  if (!data) return [];

  const cards: ReportCardItem[] = [];
  if (Array.isArray(data.cards)) {
    cards.push(
      ...data.cards.map((card, index) => ({
        key: card.key ?? `card-${index}`,
        label: card.label ?? card.title ?? `مؤشر ${index + 1}`,
        value: formatValue(card.value),
        description: card.description,
        status: card.status ?? card.accuracy ?? null,
        badgeType: card.accuracy ? ('accuracy' as const) : undefined,
      }))
    );
  }

  if (isRecord(data.summary)) {
    Object.entries(data.summary).forEach(([key, value]) => {
      if (isRecord(value)) {
        cards.push({
          key,
          label: String(value.label ?? value.title ?? key),
          value: formatValue(value.value ?? value.amount ?? '-'),
          description: typeof value.description === 'string' ? value.description : null,
          status: typeof value.status === 'string' ? value.status : null,
          badgeType: typeof value.status === 'string' ? 'accuracy' : undefined,
        });
        return;
      }

      cards.push({
        key,
        label: translateLabel(key),
        value: formatValue(value),
      });
    });
  }

  const cost = data.bunny_cost_summary ?? data.cost_summary;
  if (cost) {
    cards.push({
      key: 'bunny_cost_summary',
      label: cost.label ?? 'تكلفة Bunny التقديرية',
      value: costValue(cost),
      description: 'القيمة معروضة حسب حالة الدقة المتاحة من الـ API',
      status: cost.status ?? cost.accuracy ?? 'unavailable',
      badgeType: 'cost',
    });
  }

  return cards;
};

const hasOverviewData = (data: ReportsOverviewData | null) => {
  if (!data) return false;
  return (
    buildCards(data).length > 0 ||
    extractArray(data, ['top_courses', 'courses']).length > 0 ||
    extractArray(data, ['top_lessons', 'lessons']).length > 0 ||
    extractArray(data, ['recent_activity', 'activity']).length > 0
  );
};

export default function ReportsOverviewPage() {
  const [filters, setFilters] = useState<ReportFiltersValue>({ limit: 10 });
  const [data, setData] = useState<ReportsOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminNormalizedError | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const overview = await getReportsOverview(filters);
      setData(overview);
    } catch (err) {
      setError(normalizeApiError(err, 'فشل تحميل ملخص التقارير التعليمية'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const cards = useMemo(() => buildCards(data), [data]);
  const topCourses = useMemo(
    () => (data ? extractArray<ReportCourseOverview>(data, ['top_courses', 'courses']) : []),
    [data]
  );
  const topLessons = useMemo(
    () => (data ? extractArray<ReportLessonOverview>(data, ['top_lessons', 'lessons']) : []),
    [data]
  );
  const recentActivity = useMemo(
    () => (data ? extractArray<ReportActivityOverview>(data, ['recent_activity', 'activity']) : []),
    [data]
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div className={styles.reportsPage}>
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={styles.premiumHero}
      >
        <div className={styles.premiumHeroContent}>
          <span className={styles.premiumGreeting}>مرحباً بك في</span>
          <h1 className={styles.premiumTitle}>مركز الإحصائيات والتقارير</h1>
          <p className={styles.premiumSubtitle}>
            راقب أداء المنصة التعليمية، وتتبع الإيرادات ونسب إنجاز الطلاب في مكان واحد، 
            لاتخاذ قرارات مدعومة بالبيانات الحقيقية.
          </p>
        </div>
        <div className={styles.premiumAction}>
          <div className={styles.premiumActionIcon}>
            <TrendingUp size={28} />
          </div>
          <div className={styles.premiumActionText}>
            <h4>بيانات مباشرة</h4>
            <p>مؤشرات محدثة من سجلات المنصة</p>
          </div>
        </div>
      </motion.div>

      <header className={styles.header}>
        <div className={styles.titleBlock}>
          <h2>خصص نظرتك للبيانات</h2>
          <p>حدد النطاق الزمني وعدد النتائج لعرض مؤشرات أكثر دقة.</p>
        </div>
        <ReportFilters value={filters} onApply={setFilters} />
      </header>

      <section aria-label="أقسام التقارير الرئيسية">
        <h2 className={styles.hubSectionTitle}>الوصول السريع للتقارير</h2>
        <motion.div 
          className={styles.hubGrid}
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {HUB_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <motion.div key={card.href} variants={itemVariants}>
                <Link 
                  href={card.href} 
                  className={styles.hubCard}
                  style={{ '--card-color': card.color, '--icon-bg': card.bg } as React.CSSProperties}
                >
                  <div className={styles.hubIconWrapper}>
                    <Icon />
                  </div>
                  <h3 className={styles.hubTitle}>{card.title}</h3>
                  <p className={styles.hubDescription}>{card.description}</p>
                  <span className={styles.hubAction}>
                    عرض التقارير <ArrowLeft />
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {loading ? <AdminState type="loading" /> : null}
      {!loading && error ? (
        <AdminState
          type={error.type}
          message={error.message}
          actionLabel={error.sessionExpired ? 'تسجيل الدخول مجددًا' : 'إعادة المحاولة'}
          onAction={error.sessionExpired ? () => window.location.assign('/auth') : error.canRetry ? loadData : undefined}
        />
      ) : null}
      {!loading && !error && !hasOverviewData(data) ? (
        <AdminState type="empty" message="لم يرجع الـ API بيانات قابلة للعرض ضمن فلاتر البحث الحالية." />
      ) : null}

      {!loading && !error && hasOverviewData(data) ? (
        <main className={styles.contentGrid}>
          <ReportCards cards={cards} />

          {topCourses && topCourses.length > 0 && (
            <ReportChart 
              title="أعلى المقررات من حيث وقت المشاهدة"
              data={topCourses}
              xDataKey="course_title"
              yDataKey="sessions_count"
              yDataLabel="جلسات المشاهدة"
              color="#0ea5e9"
            />
          )}

          <div className={styles.verticalStack}>
            <ReportTable
              title="أعلى المقررات إقبالاً"
              rows={topCourses}
              columns={[
                { key: 'course_title', header: 'المقرر', render: (row) => formatValue(row.course_title) },
                { key: 'sessions_count', header: 'جلسات المشاهدة', render: (row) => formatValue(row.sessions_count) },
                { key: 'watch_duration_seconds', header: 'مدة المشاهدة', render: (row) => {
                  const seconds = Number(row.watch_duration_seconds);
                  if (!seconds || !Number.isFinite(seconds)) return '-';
                  const hours = Math.floor(seconds / 3600);
                  const mins = Math.floor((seconds % 3600) / 60);
                  if (hours > 0) return `${hours.toLocaleString('ar-EG')} س ${mins.toLocaleString('ar-EG')} د`;
                  return `${mins.toLocaleString('ar-EG')} دقيقة`;
                }},
              ]}
            />

            <div className={styles.divider} />

            <ReportTable
              title="أعلى الدروس مشاهدة"
              rows={topLessons}
              columns={[
                { key: 'lesson_title', header: 'الدرس', render: (row) => formatValue(row.lesson_title) },
                { key: 'sessions_count', header: 'جلسات المشاهدة', render: (row) => formatValue(row.sessions_count) },
                { key: 'watch_duration_seconds', header: 'مدة المشاهدة', render: (row) => {
                  const seconds = Number(row.watch_duration_seconds);
                  if (!seconds || !Number.isFinite(seconds)) return '-';
                  const hours = Math.floor(seconds / 3600);
                  const mins = Math.floor((seconds % 3600) / 60);
                  if (hours > 0) return `${hours.toLocaleString('ar-EG')} س ${mins.toLocaleString('ar-EG')} د`;
                  return `${mins.toLocaleString('ar-EG')} دقيقة`;
                }},
              ]}
            />

            <div className={styles.divider} />

            <ReportTable
              title="النشاط الأخير على المنصة"
              rows={recentActivity}
              columns={[
                { key: 'student_name', header: 'الطالب', render: (row) => formatValue(row.student_name) },
                { key: 'lesson_title', header: 'الدرس', render: (row) => formatValue(row.lesson_title) },
                { key: 'watched_seconds', header: 'مدة المشاهدة', render: (row) => {
                  const seconds = Number(row.watched_seconds);
                  if (!seconds || !Number.isFinite(seconds)) return '-';
                  const mins = Math.floor(seconds / 60);
                  const secs = seconds % 60;
                  return `${mins.toLocaleString('ar-EG')}:${secs.toString().padStart(2, '0')}`;
                }},
                {
                  key: 'last_event_at',
                  header: 'التاريخ',
                  render: (row) => formatDate(row.last_event_at),
                },
              ]}
            />
          </div>

          {data?.bunny_cost_summary || data?.cost_summary ? (
            <div className={styles.notice}>
              حالة تكلفة Bunny:{' '}
              <CostBadge status={(data.bunny_cost_summary ?? data.cost_summary)?.status ?? 'unavailable'} />{' '}
              دقة البيانات:{' '}
              <AccuracyBadge status={(data.bunny_cost_summary ?? data.cost_summary)?.accuracy ?? 'unavailable'} />
            </div>
          ) : null}
        </main>
      ) : null}
    </div>
  );
}
