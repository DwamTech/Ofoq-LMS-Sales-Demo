'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Download, 
  GraduationCap, 
  PlayCircle, 
  Users, 
  Clock, 
  BarChart3, 
  BookOpen, 
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
import { getDiplomaReport } from '@/utils/reportsService';
import type { ReportDetailData, ReportFilters } from '@/types/reports';
import { exportCSV } from '@/utils/exportUtils';
import styles from './DiplomaReport.module.css';

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

export default function DiplomaReportPage() {
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
      const report = await getDiplomaReport(id, filters);
      setData(report);
    } catch (err) {
      setError(normalizeApiError(err, 'فشل تحميل تقرير الدبلومة'));
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
        <AdminPageHeader title="تقرير الدبلومة" breadcrumbs={[{ label: 'التقارير', href: '/admin/reports' }, { label: 'تقارير الدبلومات', href: '/admin/reports/diplomas' }]} />
        <AdminState type="loading" message="جاري تحميل بيانات الدبلومة..." />
      </AdminPage>
    );
  }

  if (error || !data || (!data.diploma && !data.category && !data.entity)) {
    return (
      <AdminPage>
        <AdminPageHeader title="تقرير الدبلومة" breadcrumbs={[{ label: 'التقارير', href: '/admin/reports' }, { label: 'تقارير الدبلومات', href: '/admin/reports/diplomas' }]} />
        <AdminState type="error" title="حدث خطأ" message={error?.message || 'تعذر العثور على الدبلومة'} onAction={loadData} />
      </AdminPage>
    );
  }

  const diploma = (data.diploma || data.category || data.entity) as Record<string, any>;
  const summary = data.summary as Record<string, any> ?? {};
  
  const topLessons = Array.isArray(data.top_lessons) ? data.top_lessons : (Array.isArray(data.most_watched_lessons) ? data.most_watched_lessons : []);
  
  // Paginated Data
  const studentsData = data.students as Record<string, any> ?? data.students_table ?? { data: [] };
  const students = Array.isArray(studentsData.data) ? studentsData.data : (Array.isArray(studentsData) ? studentsData : []);
  
  const coursesData = data.courses_summary as Record<string, any> ?? data.courses ?? data.top_courses ?? { data: [] };
  const courses = Array.isArray(coursesData.data) ? coursesData.data : (Array.isArray(coursesData) ? coursesData : []);

  return (
    <AdminPage>
      <AdminPageHeader 
        title="التقرير التفصيلي للدبلومة" 
        breadcrumbs={[
          { label: 'التقارير', href: '/admin/reports' }, 
          { label: 'تقارير الدبلومات', href: '/admin/reports/diplomas' },
          { label: String(diploma.name || diploma.title || 'دبلومة'), href: '#' }
        ]} 
        action={
          <button onClick={() => router.push('/admin/reports/diplomas')} className={styles.secondaryAction}>
            <ArrowRight size={18} />
            عودة للقائمة
          </button>
        }
      />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        
        {/* Profile Header */}
        <div className={styles.profileHeader}>
          <div className={styles.avatar}>
            <GraduationCap size={40} />
          </div>
          
          <div className={styles.diplomaInfo}>
            <h2 className={styles.diplomaName}>{diploma.name || diploma.title || 'بدون اسم'}</h2>
            <div className={styles.diplomaMeta}>
              <div className={styles.metaItem}>
                <BookOpen size={16} color="#028faf" /> 
                المقررات: {formatValue(summary.total_courses || courses.length)}
              </div>
              <div className={styles.metaItem}>
                <Eye size={16} color="#8b5cf6" /> 
                الجلسات: {formatValue(summary.total_watch_sessions)}
              </div>
              <span className={`${styles.statusBadge} ${diploma.is_published ? styles.statusPublished : styles.statusDraft}`}>
                {diploma.is_published ? 'منشور' : 'مسودة'}
              </span>
            </div>
          </div>

          <div className={styles.actions}>
            <button className={styles.primaryAction} onClick={() => router.push(`/admin/diplomas/${id}`)}>
              <Settings size={18} />
              إدارة الدبلومة
            </button>
            <button className={styles.secondaryAction} onClick={() => {
              const allStudents = students as any[];
              exportCSV(
                `تقرير_${diploma.name || diploma.title || 'دبلومة'}`,
                ['الطالب', 'البريد', 'الحالة', 'نسبة الإنجاز', 'مدة المشاهدة (ثانية)', 'تاريخ التخرج'],
                allStudents.map((s: any) => [
                  s.name || s.student_name || '-',
                  s.email || '-',
                  s.status || '-',
                  s.progress_percentage ?? s.progress ?? '-',
                  s.watch_duration_seconds ?? s.total_watch_seconds ?? '-',
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
              <span className={styles.statValue}>{formatValue(summary.enrolled_students_count ?? summary.total_students)}</span>
              <span className={styles.statLabel}>الطلاب المسجلين</span>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.iconWrapper} style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
              <CheckCircle size={24} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{formatValue(summary.completed_students_count ?? summary.total_graduates ?? 0)}</span>
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
              <span className={styles.statValue}>{formatValue(summary.average_completion_percentage ?? summary.average_progress ?? 0)}%</span>
              <span className={styles.statLabel}>متوسط نسبة الإنجاز</span>
            </div>
          </div>
        </div>

        {/* Graph Section */}
        {topLessons && topLessons.length > 0 && (
          <div className={styles.chartContainer}>
            <ReportChart 
              title="الدروس الأكثر تفاعلاً (بناءً على الجلسات)"
              data={topLessons.slice(0, 5)}
              xDataKey="lesson_title"
              yDataKey="sessions_count"
              yDataLabel="عدد الجلسات"
              color="#028faf"
            />
          </div>
        )}

        {/* Tables wrapped in sections */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            <BookOpen size={24} color="#028faf" />
            مقررات الدبلومة
          </div>
          <div style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
            <ReportTable
              title=""
              rows={courses}
              emptyMessage="لا يوجد مقررات مسجلة في هذه الدبلومة"
              columns={[
                { key: 'course_title', header: 'المقرر', render: (row) => formatValue(row.course_title || row.title || row.name) },
                { key: 'enrolled_count', header: 'المسجلون', render: (row) => formatValue(row.enrolled_count) },
                { key: 'started_count', header: 'بدأوا', render: (row) => formatValue(row.started_count) },
                { key: 'completed_count', header: 'مكتملون', render: (row) => formatValue(row.completed_count) },
                { key: 'average_completion', header: 'متوسط الإكمال', render: (row) => `${formatValue(row.average_completion ?? row.average_completion_percentage ?? row.progress_percentage)}%` },
                { key: 'total_watch_seconds', header: 'إجمالي المشاهدة', render: (row) => formatSeconds(row.total_watch_seconds ?? row.watch_duration_seconds) },
              ]}
            />
            {coursesData.pagination && (
              <ReportPagination 
                pagination={coursesData.pagination} 
                onPageChange={(p) => handlePageChange(p, 'courses_page')} 
                loading={loading}
              />
            )}
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            <Users size={24} color="#028faf" />
            طلاب الدبلومة
          </div>
          <div style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
            <ReportTable
              title=""
              rows={students}
              emptyMessage="لا يوجد طلاب مسجلين في هذه الدبلومة"
              columns={[
                { key: 'name', header: 'الطالب', render: (row) => formatValue(row.name || row.student_name) },
                { key: 'email', header: 'البريد الإلكتروني', render: (row) => formatValue(row.email) },
                { key: 'status', header: 'الحالة', render: (row) => translateStatus(row.status) },
                { key: 'progress_percentage', header: 'التقدم', render: (row) => `${formatValue(row.progress_percentage ?? row.progress)}%` },
                { key: 'watch_duration_seconds', header: 'مدة المشاهدة', render: (row) => formatSeconds(row.watch_duration_seconds ?? row.total_watch_seconds) },
                { key: 'completed_at', header: 'تاريخ الإكمال', render: (row) => formatDate(row.completed_at) },
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
            <PlayCircle size={24} color="#028faf" />
            أعلى الدروس تفاعلاً
          </div>
          <ReportTable
            title=""
            rows={topLessons.slice(0, 10)}
            emptyMessage="لا توجد بيانات كافية للدروس تفاعلاً"
            columns={[
              { key: 'lesson_title', header: 'الدرس', render: (row) => formatValue(row.lesson_title || row.title || row.name) },
              { key: 'course_title', header: 'المقرر', render: (row) => formatValue(row.course_title) },
              { key: 'sessions_count', header: 'الجلسات', render: (row) => formatValue(row.sessions_count) },
              { key: 'watch_duration_seconds', header: 'وقت المشاهدة', render: (row) => formatSeconds(row.total_watch_seconds ?? row.watch_duration_seconds) },
              { key: 'completed_count', header: 'مكتملون', render: (row) => formatValue(row.completed_count ?? row.completed_students_count) },
            ]}
          />
        </div>

      </motion.div>
    </AdminPage>
  );
}
