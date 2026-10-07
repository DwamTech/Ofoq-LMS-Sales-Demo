'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Mail, 
  Download, 
  Ban, 
  BookOpen, 
  PlayCircle, 
  CheckCircle2, 
  Clock, 
  GraduationCap, 
  Activity, 
  MapPin, 
  Phone, 
  Award,
  ShieldCheck
} from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminState from '@/components/admin/AdminState';
import ReportTable from '@/components/reports/ReportTable';
import { normalizeApiError, type AdminNormalizedError } from '@/utils/adminError';
import { getStudentReport } from '@/utils/reportsService';
import { blockUser, unblockUser } from '@/utils/studentsService';
import { exportCSV } from '@/utils/exportUtils';
import type { ReportDetailData } from '@/types/reports';
import styles from './StudentReport.module.css';

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

export default function StudentReportPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id ?? '');

  const [data, setData] = useState<ReportDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminNormalizedError | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const report = await getStudentReport(id);
      setData(report);
      setIsBlocked(!!(report.student as any)?.is_blocked);
    } catch (err) {
      setError(normalizeApiError(err, 'فشل تحميل تقرير الطالب'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <AdminPage>
        <AdminPageHeader title="تقرير الطالب" breadcrumbs={[{ label: 'التقارير', href: '/admin/reports' }, { label: 'تقارير الطلاب', href: '/admin/reports/students' }]} />
        <AdminState type="loading" message="جاري تحميل ملف الطالب..." />
      </AdminPage>
    );
  }

  if (error || !data || !data.student) {
    return (
      <AdminPage>
        <AdminPageHeader title="تقرير الطالب" breadcrumbs={[{ label: 'التقارير', href: '/admin/reports' }, { label: 'تقارير الطلاب', href: '/admin/reports/students' }]} />
        <AdminState type="error" title="حدث خطأ" message={error?.message || 'تعذر العثور على الطالب'} onAction={loadData} />
      </AdminPage>
    );
  }

  const student = data.student as Record<string, any>;
  const activity = data.activity as Record<string, any> ?? {};
  
  // Extract Arrays Safely
  const lessons = Array.isArray(data.lessons?.data) ? data.lessons.data : (Array.isArray(data.lessons) ? data.lessons : []);
  const courses = Array.isArray(data.courses) ? data.courses : [];
  const diplomas = Array.isArray(data.diplomas) ? data.diplomas : [];

  // Real Actions
  const handleExportDiplomas = () => {
    exportCSV(
      `دبلومات_${student.name || 'طالب'}`,
      ['الدبلومة', 'الحالة', 'نسبة التقدم', 'تاريخ التسجيل', 'تاريخ الإكمال'],
      diplomas.map((d: any) => [
        d.name || d.title || '-',
        d.status || '-',
        d.progress_percentage ?? '-',
        d.enrolled_at || '-',
        d.completed_at || '-',
      ])
    );
  };

  const handleExportCourses = () => {
    exportCSV(
      `مقررات_${student.name || 'طالب'}`,
      ['المقرر', 'الحالة', 'الإنجاز', 'تاريخ الإكمال'],
      courses.map((c: any) => [
        c.title || c.course_title || '-',
        c.status || '-',
        c.progress_percentage ?? '-',
        c.completed_at || '-',
      ])
    );
  };

  const handleExportLessons = () => {
    exportCSV(
      `دروس_${student.name || 'طالب'}`,
      ['الدرس', 'الحالة', 'التقدم', 'مدة المشاهدة (ثانية)', 'آخر مشاهدة'],
      lessons.map((l: any) => [
        l.lesson_title || l.title || '-',
        l.status || '-',
        l.progress_percentage ?? '-',
        l.watch_duration_seconds ?? '-',
        l.last_watched_at || '-',
      ])
    );
  };

  const handleSendEmail = () => {
    if (student.email) {
      window.open(`mailto:${student.email}?subject=رسالة من إدارة منصة أفق`, '_blank');
    }
  };

  const handleToggleBlock = async () => {
    const action = isBlocked ? 'إلغاء تعليق' : 'تعليق';
    if (!confirm(`هل أنت متأكد من ${action} حساب "${student.name}"؟`)) return;
    try {
      if (isBlocked) {
        await unblockUser(Number(id));
      } else {
        await blockUser(Number(id));
      }
      setIsBlocked(!isBlocked);
    } catch {
      // silently handled
    }
  };

  return (
    <AdminPage>
      <AdminPageHeader 
        title="الملف التعليمي للطالب" 
        breadcrumbs={[
          { label: 'التقارير', href: '/admin/reports' }, 
          { label: 'تقارير الطلاب', href: '/admin/reports/students' },
          { label: String(student.name || 'طالب'), href: '#' }
        ]} 
        action={
          <button onClick={() => router.push('/admin/reports/students')} className={styles.secondaryAction}>
            <ArrowRight size={18} />
            عودة للقائمة
          </button>
        }
      />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        
        {/* Profile Header */}
        <div className={styles.profileHeader}>
          <div className={styles.avatar}>
            {String(student.name || '?').charAt(0).toUpperCase()}
          </div>
          
          <div className={styles.studentInfo}>
            <h2 className={styles.studentName}>{student.name || 'بدون اسم'}</h2>
            <div className={styles.studentMeta}>
              <div className={styles.metaItem}>
                <Mail size={16} /> {student.email || 'لا يوجد بريد'}
              </div>
              <div className={styles.metaItem}>
                <Phone size={16} /> {student.phone || 'لا يوجد هاتف'}
              </div>
              <div className={styles.metaItem}>
                <MapPin size={16} /> {student.nationality || 'غير محدد'}
              </div>
              <div className={styles.metaItem}>
                <Award size={16} /> {student.qualification || 'غير محدد'}
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <button className={styles.primaryAction} onClick={handleSendEmail}>
              <Mail size={18} />
              مراسلة
            </button>
            {isBlocked ? (
              <button className={styles.secondaryAction} onClick={handleToggleBlock}>
                <ShieldCheck size={18} />
                إلغاء التعليق
              </button>
            ) : (
              <button className={styles.dangerAction} onClick={handleToggleBlock}>
                <Ban size={18} />
                تعليق
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className={styles.grid}>
          <div className={styles.statCard}>
            <div className={styles.iconWrapper} style={{ backgroundColor: '#f0f9ff', color: '#0ea5e9' }}>
              <PlayCircle size={24} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{formatValue(activity.started_lessons_count)}</span>
              <span className={styles.statLabel}>دروس تم البدء بها</span>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.iconWrapper} style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
              <CheckCircle2 size={24} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{formatValue(activity.completed_lessons_count)}</span>
              <span className={styles.statLabel}>دروس مكتملة</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.iconWrapper} style={{ backgroundColor: '#f5f3ff', color: '#8b5cf6' }}>
              <Clock size={24} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{formatSeconds(activity.total_watch_duration_seconds)}</span>
              <span className={styles.statLabel}>إجمالي وقت المشاهدة</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.iconWrapper} style={{ backgroundColor: '#fffbeb', color: '#f59e0b' }}>
              <Activity size={24} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue} style={{ fontSize: '1.2rem' }}>{formatDate(activity.last_activity_at)}</span>
              <span className={styles.statLabel}>آخر نشاط مسجل</span>
            </div>
          </div>
        </div>

        {/* Diplomas Section */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            <GraduationCap size={24} color="#0ea5e9" />
            الدبلومات المسجلة
            {diplomas.length > 0 && (
              <div style={{ marginRight: 'auto', display: 'flex', gap: '0.5rem' }}>
                <button className={styles.secondaryAction} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={handleExportDiplomas}>
                  <Download size={14} /> تصدير
                </button>
              </div>
            )}
          </div>
          <ReportTable
            title=""
            rows={diplomas}
            emptyMessage="لم يسجل الطالب في أي دبلومة بعد"
            columns={[
              { key: 'name', header: 'الدبلومة', render: (row) => formatValue(row.name || row.title) },
              { key: 'status', header: 'الحالة', render: (row) => translateStatus(row.status) },
              { key: 'progress_percentage', header: 'نسبة التقدم', render: (row) => `${formatValue(row.progress_percentage)}%` },
              { key: 'enrolled_at', header: 'تاريخ التسجيل', render: (row) => formatDate(row.enrolled_at) },
              { key: 'completed_at', header: 'تاريخ الإكمال', render: (row) => formatDate(row.completed_at) },
            ]}
          />
        </div>

        {/* Courses Section */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            <BookOpen size={24} color="#0ea5e9" />
            المقررات (الكورسات)
            {courses.length > 0 && (
              <div style={{ marginRight: 'auto', display: 'flex', gap: '0.5rem' }}>
                <button className={styles.secondaryAction} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={handleExportCourses}>
                  <Download size={14} /> تصدير
                </button>
              </div>
            )}
          </div>
          <ReportTable
            title=""
            rows={courses}
            emptyMessage="لا يوجد مقررات مسجلة"
            columns={[
              { key: 'title', header: 'المقرر', render: (row) => formatValue(row.title || row.course_title) },
              { key: 'status', header: 'الحالة', render: (row) => translateStatus(row.status) },
              { key: 'progress_percentage', header: 'الإنجاز', render: (row) => `${formatValue(row.progress_percentage)}%` },
              { key: 'completed_at', header: 'تاريخ الإكمال', render: (row) => formatDate(row.completed_at) },
            ]}
          />
        </div>

        {/* Lessons Section */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            <PlayCircle size={24} color="#0ea5e9" />
            سجل مشاهدة الدروس
            {lessons.length > 0 && (
              <div style={{ marginRight: 'auto', display: 'flex', gap: '0.5rem' }}>
                <button className={styles.secondaryAction} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={handleExportLessons}>
                  <Download size={14} /> تصدير
                </button>
              </div>
            )}
          </div>
          <ReportTable
            title=""
            rows={lessons}
            emptyMessage="لم يشاهد الطالب أي درس حتى الآن"
            columns={[
              { key: 'lesson_title', header: 'الدرس', render: (row) => formatValue(row.lesson_title || row.title) },
              { key: 'status', header: 'الحالة', render: (row) => translateStatus(row.status) },
              { key: 'progress_percentage', header: 'التقدم', render: (row) => `${formatValue(row.progress_percentage)}%` },
              { key: 'watch_duration_seconds', header: 'مدة المشاهدة', render: (row) => formatSeconds(row.watch_duration_seconds) },
              { key: 'last_watched_at', header: 'آخر مشاهدة', render: (row) => formatDate(row.last_watched_at) },
            ]}
          />
        </div>

      </motion.div>
    </AdminPage>
  );
}
