'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Download,
  PlayCircle,
  Users,
  Clock,
  CheckCircle,
  Eye,
  BarChart3,
  BookOpen,
  Folder,
  Video,
  DollarSign,
} from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminState from '@/components/admin/AdminState';
import ReportTable from '@/components/reports/ReportTable';
import ReportPagination from '@/components/reports/ReportPagination';
import { normalizeApiError, type AdminNormalizedError } from '@/utils/adminError';
import { getLessonReport } from '@/utils/reportsService';
import { exportCSV } from '@/utils/exportUtils';
import type { ReportDetailData, ReportFilters } from '@/types/reports';
import styles from './LessonReport.module.css';

const formatSeconds = (value: unknown): string => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const secs = Math.floor(value % 60);
  if (hours > 0) return `${hours.toLocaleString('ar-EG')} س ${minutes.toLocaleString('ar-EG')} د`;
  if (minutes > 0) return `${minutes.toLocaleString('ar-EG')} د ${secs.toLocaleString('ar-EG')} ث`;
  return `${secs.toLocaleString('ar-EG')} ثانية`;
};

const formatDate = (value: unknown): string => {
  if (typeof value !== 'string' || !value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('ar-EG');
};

const formatValue = (value: unknown): string | number => {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'number') return value.toLocaleString('ar-EG');
  if (typeof value === 'string') return value;
  return '-';
};

const statusMap: Record<string, string> = {
  not_started: 'لم يبدأ',
  not_opened: 'لم يفتح',
  in_progress: 'قيد التقدم',
  completed: 'مكتمل',
  active: 'نشط',
};

const translateStatus = (v: unknown): string => {
  if (typeof v !== 'string' || !v) return '-';
  return statusMap[v.toLowerCase()] || v;
};

const videoStatusMap: Record<string, { label: string; cls: string }> = {
  ready: { label: 'جاهز', cls: 'statusReady' },
  processing: { label: 'قيد المعالجة', cls: 'statusProcessing' },
};

export default function LessonReportPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id ?? '');

  const [filters, setFilters] = useState<ReportFilters>({});
  const [data, setData] = useState<ReportDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminNormalizedError | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const report = await getLessonReport(id, filters);
      setData(report);
    } catch (err) {
      setError(normalizeApiError(err, 'فشل تحميل تقرير الدرس'));
    } finally {
      setLoading(false);
    }
  }, [id, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, students_page: page }));
  };

  if (loading && !data) {
    return (
      <AdminPage>
        <AdminPageHeader title="تقرير الدرس" breadcrumbs={[{ label: 'التقارير', href: '/admin/reports' }, { label: 'تقارير الدروس', href: '/admin/reports/lessons' }]} />
        <AdminState type="loading" message="جاري تحميل بيانات الدرس..." />
      </AdminPage>
    );
  }

  if (error || !data || !data.lesson) {
    return (
      <AdminPage>
        <AdminPageHeader title="تقرير الدرس" breadcrumbs={[{ label: 'التقارير', href: '/admin/reports' }, { label: 'تقارير الدروس', href: '/admin/reports/lessons' }]} />
        <AdminState type="error" title="حدث خطأ" message={error?.message || 'تعذر العثور على الدرس'} onAction={loadData} />
      </AdminPage>
    );
  }

  const lesson = data.lesson as Record<string, any>;
  const summary = data.summary as Record<string, any> ?? {};
  const bunnyStats = (data as any).bunny_video_stats as Record<string, any> ?? {};
  const bunnyCost = (data as any).estimated_bunny_cost as Record<string, any> ?? {};

  const studentsData = data.students as Record<string, any> ?? { data: [] };
  const students = Array.isArray(studentsData.data) ? studentsData.data : (Array.isArray(studentsData) ? studentsData : []);

  const videoStatus = videoStatusMap[lesson.video_status] || { label: lesson.video_status || '-', cls: 'statusOther' };

  const handleExport = () => {
    exportCSV(
      `تقرير_درس_${lesson.title || 'درس'}`,
      ['الطالب', 'البريد', 'الحالة', 'التقدم', 'مدة المشاهدة (ثانية)', 'آخر مشاهدة', 'تاريخ الإكمال'],
      students.map((s: any) => [
        s.student_name || s.name || '-',
        s.email || '-',
        translateStatus(s.status),
        s.progress_percentage ?? s.progress ?? '-',
        s.watch_duration_seconds ?? s.total_watch_seconds ?? '-',
        s.last_watched_at || '-',
        s.completed_at || '-',
      ])
    );
  };

  return (
    <AdminPage>
      <AdminPageHeader
        title="التقرير التفصيلي للدرس"
        breadcrumbs={[
          { label: 'التقارير', href: '/admin/reports' },
          { label: 'تقارير الدروس', href: '/admin/reports/lessons' },
          { label: String(lesson.title || 'درس'), href: '#' },
        ]}
        action={
          <button onClick={() => router.push('/admin/reports/lessons')} className={styles.secondaryAction}>
            <ArrowRight size={18} />
            عودة للقائمة
          </button>
        }
      />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

        {/* Profile Header */}
        <div className={styles.profileHeader}>
          <div className={styles.avatar}>
            <PlayCircle size={36} />
          </div>

          <div className={styles.lessonInfo}>
            <h2 className={styles.lessonName}>{lesson.title || 'بدون اسم'}</h2>
            <div className={styles.lessonMeta}>
              <div className={styles.metaItem}>
                <BookOpen size={16} color="#8b5cf6" />
                {lesson.course_title || 'بدون مقرر'}
              </div>
              <div className={styles.metaItem}>
                <Folder size={16} color="#0ea5e9" />
                {lesson.chapter_title || 'بدون فصل'}
              </div>
              <div className={styles.metaItem}>
                <Video size={16} color="#10b981" />
                <span className={`${styles.statusBadge} ${styles[videoStatus.cls]}`}>
                  {videoStatus.label}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            {lesson.course_id && (
              <Link href={`/admin/reports/courses/${lesson.course_id}`} className={styles.primaryAction}>
                <BarChart3 size={18} />
                تقرير المقرر
              </Link>
            )}
            <button className={styles.secondaryAction} onClick={handleExport}>
              <Download size={18} />
              تصدير
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className={styles.grid}>
          <div className={styles.statCard}>
            <div className={styles.iconWrapper} style={{ backgroundColor: '#f5f3ff', color: '#8b5cf6' }}>
              <Eye size={24} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{formatValue(summary.opened_students_count)}</span>
              <span className={styles.statLabel}>طلاب فتحوا الدرس</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.iconWrapper} style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
              <CheckCircle size={24} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{formatValue(summary.completed_students_count)}</span>
              <span className={styles.statLabel}>أكملوا الدرس</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.iconWrapper} style={{ backgroundColor: '#fff1f2', color: '#e11d48' }}>
              <Users size={24} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{formatValue(summary.enrolled_not_opened_count)}</span>
              <span className={styles.statLabel}>لم يفتحوا الدرس</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.iconWrapper} style={{ backgroundColor: '#f0f9ff', color: '#0ea5e9' }}>
              <Clock size={24} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{formatSeconds(summary.total_watch_duration_seconds)}</span>
              <span className={styles.statLabel}>إجمالي وقت المشاهدة</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.iconWrapper} style={{ backgroundColor: '#fffbeb', color: '#f59e0b' }}>
              <Clock size={24} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{formatSeconds(summary.average_watch_duration_seconds)}</span>
              <span className={styles.statLabel}>متوسط مدة المشاهدة</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.iconWrapper} style={{ backgroundColor: '#f5f3ff', color: '#7c3aed' }}>
              <BarChart3 size={24} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{formatValue(summary.watch_sessions_count)}</span>
              <span className={styles.statLabel}>عدد جلسات المشاهدة</span>
            </div>
          </div>
        </div>

        {/* Bunny Video Stats */}
        {bunnyStats && Object.keys(bunnyStats).length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              <Video size={24} color="#8b5cf6" />
              إحصائيات الفيديو (Bunny)
            </div>
            <div className={styles.bunnyGrid}>
              {bunnyStats.views != null && (
                <div className={styles.bunnyItem}>
                  <div className={styles.bunnyValue}>{formatValue(bunnyStats.views)}</div>
                  <div className={styles.bunnyLabel}>المشاهدات</div>
                </div>
              )}
              {bunnyStats.averageWatchTime != null && (
                <div className={styles.bunnyItem}>
                  <div className={styles.bunnyValue}>{formatSeconds(bunnyStats.averageWatchTime)}</div>
                  <div className={styles.bunnyLabel}>متوسط وقت المشاهدة</div>
                </div>
              )}
              {bunnyStats.totalWatchTime != null && (
                <div className={styles.bunnyItem}>
                  <div className={styles.bunnyValue}>{formatSeconds(bunnyStats.totalWatchTime)}</div>
                  <div className={styles.bunnyLabel}>إجمالي وقت المشاهدة</div>
                </div>
              )}
              {bunnyStats.length != null && (
                <div className={styles.bunnyItem}>
                  <div className={styles.bunnyValue}>{formatSeconds(bunnyStats.length)}</div>
                  <div className={styles.bunnyLabel}>مدة الفيديو</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Estimated Cost */}
        {bunnyCost && Object.keys(bunnyCost).length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              <DollarSign size={24} color="#f59e0b" />
              التكلفة التقديرية
            </div>
            <div className={styles.costGrid}>
              {bunnyCost.total_gb != null && (
                <div className={styles.costItem}>
                  <div className={styles.costValue}>{Number(bunnyCost.total_gb).toLocaleString('ar-EG', { maximumFractionDigits: 3 })} GB</div>
                  <div className={styles.costLabel}>إجمالي الاستهلاك</div>
                </div>
              )}
              {bunnyCost.estimated_cost_usd != null && (
                <div className={styles.costItem}>
                  <div className={styles.costValue}>${Number(bunnyCost.estimated_cost_usd).toLocaleString('en', { maximumFractionDigits: 4 })}</div>
                  <div className={styles.costLabel}>التكلفة بالدولار</div>
                </div>
              )}
              {bunnyCost.total_views != null && (
                <div className={styles.costItem}>
                  <div className={styles.costValue}>{formatValue(bunnyCost.total_views)}</div>
                  <div className={styles.costLabel}>إجمالي المشاهدات</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Students Table */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            <Users size={24} color="#8b5cf6" />
            طلاب الدرس
            {students.length > 0 && (
              <div style={{ marginRight: 'auto' }}>
                <button className={styles.secondaryAction} style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem' }} onClick={handleExport}>
                  <Download size={14} /> تصدير
                </button>
              </div>
            )}
          </div>
          <div style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
            <ReportTable
              title=""
              rows={students}
              emptyMessage="لا يوجد طلاب لعرض بياناتهم"
              columns={[
                { key: 'student_name', header: 'الطالب', render: (row) => formatValue(row.student_name ?? row.name) },
                { key: 'email', header: 'البريد', render: (row) => formatValue(row.email) },
                { key: 'status', header: 'الحالة', render: (row) => translateStatus(row.status) },
                { key: 'progress_percentage', header: 'التقدم', render: (row) => `${formatValue(row.progress_percentage ?? row.progress)}%` },
                { key: 'watch_duration_seconds', header: 'مدة المشاهدة', render: (row) => formatSeconds(row.watch_duration_seconds ?? row.total_watch_seconds) },
                { key: 'last_watched_at', header: 'آخر مشاهدة', render: (row) => formatDate(row.last_watched_at) },
                { key: 'completed_at', header: 'تاريخ الإكمال', render: (row) => formatDate(row.completed_at) },
              ]}
            />
            {studentsData.pagination && (
              <ReportPagination
                pagination={studentsData.pagination}
                onPageChange={handlePageChange}
                loading={loading}
              />
            )}
          </div>
        </div>

      </motion.div>
    </AdminPage>
  );
}
