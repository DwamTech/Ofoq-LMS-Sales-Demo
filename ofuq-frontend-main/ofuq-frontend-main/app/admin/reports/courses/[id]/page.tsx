'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Download, 
  BookOpen, 
  PlayCircle, 
  Users, 
  Clock, 
  BarChart3, 
  Folder, 
  CheckCircle,
  Eye,
  Settings
} from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminState from '@/components/admin/AdminState';
import ReportTable from '@/components/reports/ReportTable';
import ReportPagination from '@/components/reports/ReportPagination';
import ReportChart from '@/components/reports/ReportChart';
import { normalizeApiError, type AdminNormalizedError } from '@/utils/adminError';
import { getCourseReport } from '@/utils/reportsService';
import type { ReportDetailData, ReportFilters } from '@/types/reports';
import { exportCSV } from '@/utils/exportUtils';
import styles from './CourseReport.module.css';

const formatSeconds = (value: unknown): string => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  if (hours > 0) return `${hours.toLocaleString('ar-EG')} س ${minutes.toLocaleString('ar-EG')} د`;
  return `${minutes.toLocaleString('ar-EG')} دقيقة`;
};

const formatDate = (value: unknown): string => {
  if (typeof value !== 'string' || !value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('ar-EG');
};

const formatValue = (value: unknown): string | number => {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'number') return value.toLocaleString('ar-EG');
  if (typeof value === 'boolean') return value ? 'نعم' : 'لا';
  if (typeof value === 'string') return value;
  return '-';
};

const statusMap: Record<string, string> = {
  not_started: 'لم يبدأ',
  in_progress: 'قيد التقدم',
  completed: 'مكتمل',
  active: 'نشط',
  pending: 'معلق',
  failed: 'راسب',
  blocked: 'محظور',
  graduated: 'متخرج',
};

const translateStatus = (value: unknown): string => {
  if (typeof value !== 'string' || !value) return '-';
  return statusMap[value.toLowerCase()] || value;
};

export default function CourseReportPage() {
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
      const report = await getCourseReport(id, filters);
      setData(report);
    } catch (err) {
      setError(normalizeApiError(err, 'فشل تحميل تقرير المقرر'));
    } finally {
      setLoading(false);
    }
  }, [id, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePageChange = (page: number, param: string) => {
    setFilters(prev => ({ ...prev, [param]: page }));
  };

  if (loading && !data) {
    return (
      <AdminPage>
        <AdminPageHeader title="تقرير المقرر" breadcrumbs={[{ label: 'التقارير', href: '/admin/reports' }, { label: 'تقارير المقررات', href: '/admin/reports/courses' }]} />
        <AdminState type="loading" message="جاري تحميل بيانات المقرر..." />
      </AdminPage>
    );
  }

  if (error || !data || !data.course) {
    return (
      <AdminPage>
        <AdminPageHeader title="تقرير المقرر" breadcrumbs={[{ label: 'التقارير', href: '/admin/reports' }, { label: 'تقارير المقررات', href: '/admin/reports/courses' }]} />
        <AdminState type="error" title="حدث خطأ" message={error?.message || 'تعذر العثور على المقرر'} onAction={loadData} />
      </AdminPage>
    );
  }

  const course = data.course as Record<string, any>;
  const summary = data.summary as Record<string, any> ?? {};
  
  const mostWatched = Array.isArray(data.most_watched_lessons) ? data.most_watched_lessons : [];
  const leastWatched = Array.isArray(data.least_watched_lessons) ? data.least_watched_lessons : [];
  
  // Paginated Data
  const studentsData = data.students as Record<string, any> ?? { data: [] };
  const students = Array.isArray(studentsData.data) ? studentsData.data : [];
  
  const lessonsData = data.lessons as Record<string, any> ?? { data: [] };
  const lessons = Array.isArray(lessonsData.data) ? lessonsData.data : [];

  return (
    <AdminPage>
      <AdminPageHeader 
        title="التقرير التفصيلي للمقرر" 
        breadcrumbs={[
          { label: 'التقارير', href: '/admin/reports' }, 
          { label: 'تقارير المقررات', href: '/admin/reports/courses' },
          { label: String(course.title || 'مقرر'), href: '#' }
        ]} 
        action={
          <button onClick={() => router.push('/admin/reports/courses')} className={styles.secondaryAction}>
            <ArrowRight size={18} />
            عودة للقائمة
          </button>
        }
      />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        
        {/* Profile Header */}
        <div className={styles.profileHeader}>
          <div className={styles.avatar}>
            <BookOpen size={40} />
          </div>
          
          <div className={styles.courseInfo}>
            <h2 className={styles.courseName}>{course.title || 'بدون اسم'}</h2>
            <div className={styles.courseMeta}>
              <div className={styles.metaItem}>
                <Folder size={16} color="#0ea5e9" /> 
                {course.category_name || 'بدون مسار'}
              </div>
              <div className={styles.metaItem}>
                <Eye size={16} color="#8b5cf6" /> 
                المشاهدات الكلية: {formatValue(course.total_views)}
              </div>
              <span className={`${styles.statusBadge} ${course.is_published ? styles.statusPublished : styles.statusDraft}`}>
                {course.is_published ? 'منشور' : 'مسودة'}
              </span>
            </div>
          </div>

          <div className={styles.actions}>
            <button className={styles.primaryAction} onClick={() => router.push(`/admin/courses/${id}`)}>
              <Settings size={18} />
              إدارة المقرر
            </button>
            <button className={styles.secondaryAction} onClick={() => {
              const allStudents = students as any[];
              exportCSV(
                `تقرير_${course.title || 'مقرر'}`,
                ['الطالب', 'البريد', 'الحالة', 'نسبة الإنجاز', 'مدة المشاهدة (ثانية)', 'تاريخ التخرج'],
                allStudents.map((s: any) => [
                  s.name || s.student_name || '-',
                  s.email || '-',
                  s.status || '-',
                  s.progress_percentage ?? '-',
                  s.watch_duration_seconds ?? '-',
                  s.completed_at || '-',
                ])
              );
            }}>
              <Download size={18} />
              تصدير
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className={styles.grid}>
          <div className={styles.statCard}>
            <div className={styles.iconWrapper} style={{ backgroundColor: '#f0f9ff', color: '#0ea5e9' }}>
              <Users size={24} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{formatValue(summary.enrolled_students_count)}</span>
              <span className={styles.statLabel}>الطلاب المسجلين</span>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.iconWrapper} style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
              <CheckCircle size={24} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{formatValue(summary.completed_students_count)}</span>
              <span className={styles.statLabel}>الطلاب الخريجين</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.iconWrapper} style={{ backgroundColor: '#f5f3ff', color: '#8b5cf6' }}>
              <Clock size={24} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{formatSeconds(summary.total_watch_duration_seconds)}</span>
              <span className={styles.statLabel}>إجمالي وقت المشاهدة</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.iconWrapper} style={{ backgroundColor: '#fffbeb', color: '#f59e0b' }}>
              <BarChart3 size={24} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{formatValue(summary.average_completion_percentage)}%</span>
              <span className={styles.statLabel}>متوسط نسبة الإنجاز</span>
            </div>
          </div>
        </div>

        {/* Graph Section */}
        {mostWatched && mostWatched.length > 0 && (
          <div className={styles.chartContainer}>
            <ReportChart 
              title="الدروس الأكثر تفاعلاً (بناءً على الجلسات)"
              data={mostWatched.slice(0, 5)}
              xDataKey="lesson_title"
              yDataKey="sessions_count"
              yDataLabel="عدد الجلسات"
              color="#f43f5e"
            />
          </div>
        )}

        {/* Tables wrapped in sections */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            <Users size={24} color="#f43f5e" />
            طلاب المقرر
          </div>
          <div style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
            <ReportTable
              title=""
              rows={students}
              emptyMessage="لا يوجد طلاب مسجلين في هذا المقرر"
              columns={[
                { key: 'name', header: 'الطالب', render: (row) => formatValue(row.name || row.student_name) },
                { key: 'email', header: 'البريد الإلكتروني', render: (row) => formatValue(row.email) },
                { key: 'status', header: 'الحالة', render: (row) => translateStatus(row.status) },
                { key: 'progress_percentage', header: 'نسبة الإنجاز', render: (row) => `${formatValue(row.progress_percentage)}%` },
                { key: 'watch_duration_seconds', header: 'مدة المشاهدة', render: (row) => formatSeconds(row.watch_duration_seconds) },
                { key: 'completed_at', header: 'تاريخ التخرج', render: (row) => formatDate(row.completed_at) },
              ]}
            />
            {studentsData.pagination && (
              <ReportPagination 
                pagination={studentsData.pagination} 
                onPageChange={(p) => handlePageChange(p, 'students_page')} 
                loading={loading}
              />
            )}
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            <PlayCircle size={24} color="#f43f5e" />
            الدروس (ملخص الأداء)
          </div>
          <div style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
            <ReportTable
              title=""
              rows={lessons}
              emptyMessage="لا يوجد دروس في هذا المقرر"
              columns={[
                { key: 'lesson_title', header: 'الدرس', render: (row) => formatValue(row.lesson_title || row.title) },
                { key: 'watch_sessions_count', header: 'جلسات المشاهدة', render: (row) => formatValue(row.watch_sessions_count) },
                { key: 'completed_students_count', header: 'الطلاب المكملين', render: (row) => formatValue(row.completed_students_count) },
                { key: 'watch_duration_seconds', header: 'إجمالي مدة المشاهدة', render: (row) => formatSeconds(row.watch_duration_seconds) },
              ]}
            />
            {lessonsData.pagination && (
              <ReportPagination 
                pagination={lessonsData.pagination} 
                onPageChange={(p) => handlePageChange(p, 'lessons_page')} 
                loading={loading}
              />
            )}
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            <BarChart3 size={24} color="#f43f5e" />
            الدروس الأقل مشاهدة (للتحسين)
          </div>
          <ReportTable
            title=""
            rows={leastWatched.slice(0, 10)}
            emptyMessage="لا توجد بيانات كافية للدروس الأقل مشاهدة"
            columns={[
              { key: 'lesson_title', header: 'الدرس', render: (row) => formatValue(row.lesson_title || row.title) },
              { key: 'sessions_count', header: 'الجلسات', render: (row) => formatValue(row.sessions_count) },
              { key: 'watch_duration_seconds', header: 'وقت المشاهدة', render: (row) => formatSeconds(row.watch_duration_seconds) },
            ]}
          />
        </div>

      </motion.div>
    </AdminPage>
  );
}
