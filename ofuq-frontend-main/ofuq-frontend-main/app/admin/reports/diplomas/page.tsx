'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  Search,
  ArrowRight,
  RefreshCw,
  BarChart3,
  CheckCircle,
  FileSpreadsheet,
  Layers,
} from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import AdminState from '@/components/admin/AdminState';
import Toast from '@/components/Toast';
import '@/styles/toast.css';
import { getAdminCategories, type Diploma } from '@/utils/categoryService';
import apiClient from '@/utils/apiClient';
import styles from './DiplomasReport.module.css';

/* ─── Types ─── */
interface CourseProgress {
  course_id: number;
  course_title: string;
  total_lessons: number;
  completed_lessons: number;
  progress_percentage: number;
}

interface Subscriber {
  enrollment_id: number;
  enrollment_status: string;
  enrolled_at: string;
  completed_at: string | null;
  user: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    nationality: string | null;
    qualification: string | null;
    media_work_sector: string | null;
    date_of_birth: string | null;
    previous_field: string | null;
    profile_picture: string | null;
    created_at: string;
  };
  overall_progress: number;
  courses: CourseProgress[];
}

interface DiplomaReport {
  diploma: {
    id: number;
    name: string;
    slug: string;
    description: string;
    total_courses: number;
    total_subscribers: number;
  };
  subscribers: Subscriber[];
}

/* ─── Helpers ─── */
const fmt = (v: unknown) => {
  if (v === null || v === undefined || v === '') return '-';
  if (typeof v === 'number') return v.toLocaleString('ar-EG');
  return String(v);
};

const statusText: Record<string, string> = {
  active: 'نشط',
  pending_payment: 'بانتظار الدفع',
  completed: 'مكتمل',
  cancelled: 'ملغي',
};

/* ─── Page ─── */
export default function DiplomaReportsPage() {
  const router = useRouter();
  const [diplomas, setDiplomas] = useState<Diploma[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('info');

  const showToast = (msg: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToastMessage(msg);
    setToastType(type);
    setToastVisible(true);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminCategories();
      setDiplomas(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'حدث خطأ غير متوقع';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredDiplomas = useMemo(() => {
    if (!searchQuery.trim()) return diplomas;
    const q = searchQuery.toLowerCase();
    return diplomas.filter(d =>
      d.name?.toLowerCase().includes(q) || d.description?.toLowerCase().includes(q)
    );
  }, [diplomas, searchQuery]);

  /* Stats */
  const totalDiplomas = diplomas.length;
  const publishedCount = diplomas.filter(d => d.is_published).length;
  const draftCount = diplomas.filter(d => !d.is_published).length;

  /* CSV Generator — preserves full subscriber + per‑course progress columns */
  const generateCSV = (report: DiplomaReport): string => {
    const { diploma, subscribers } = report;
    const courseHeaders = subscribers.length > 0 && subscribers[0].courses.length > 0
      ? subscribers[0].courses.map(c => `نسبة إنجاز: ${c.course_title}`)
      : [];

    const headers = [
      'رقم التسجيل', 'اسم الطالب', 'البريد الإلكتروني', 'رقم الهاتف',
      'الجنسية', 'المؤهل', 'قطاع العمل الإعلامي', 'تاريخ الميلاد',
      'المجال السابق', 'حالة التسجيل', 'تاريخ التسجيل', 'تاريخ الإكمال',
      'نسبة الإنجاز الكلية', ...courseHeaders,
    ];

    const rows = subscribers.map(sub => {
      const progs = sub.courses.map(c => `${c.progress_percentage}%`);
      return [
        sub.enrollment_id, sub.user.name, sub.user.email,
        sub.user.phone || '-', sub.user.nationality || '-',
        sub.user.qualification || '-', sub.user.media_work_sector || '-',
        sub.user.date_of_birth || '-', sub.user.previous_field || '-',
        statusText[sub.enrollment_status] || sub.enrollment_status,
        new Date(sub.enrolled_at).toLocaleDateString('ar-SA'),
        sub.completed_at ? new Date(sub.completed_at).toLocaleDateString('ar-SA') : '-',
        `${sub.overall_progress}%`, ...progs,
      ];
    });

    const info = [
      `اسم الدبلوم: ${diploma.name}`,
      `عدد المقررات: ${diploma.total_courses}`,
      `عدد المشتركين: ${diploma.total_subscribers}`,
      `تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')}`, '', '',
    ];

    return [
      info.join(','), '',
      headers.join(','),
      ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
  };

  const exportToExcel = async (diplomaId: number) => {
    try {
      setExportingId(diplomaId);
      showToast('جاري تحميل بيانات الدبلوم...', 'info');
      const res = await apiClient.get<{ success: boolean; data: DiplomaReport }>(
        `/admin/categories/${diplomaId}/subscribers`,
      );
      if (!res.data.success) throw new Error('فشل في جلب بيانات الدبلوم');
      const report = res.data.data;
      const csv = generateCSV(report);
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `تقرير_${report.diploma.name}_${new Date().toLocaleDateString('ar-SA')}.csv`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('تم تصدير التقرير بنجاح! ✅', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'فشل في تصدير التقرير', 'error');
    } finally {
      setExportingId(null);
    }
  };

  /* ─── Render ─── */
  return (
    <AdminPage>
      <motion.div className={styles.page} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

        {/* Hero */}
        <div className={styles.hero}>
          <div className={styles.heroRow}>
            <div className={styles.heroText}>
              <h1>🎓 استخراج تقارير الدبلومات</h1>
              <p>استخراج تقارير المشتركين ونسب الإنجاز لكل دبلوم بصيغة CSV جاهزة لبرنامج Excel.</p>
            </div>
            <div className={styles.heroActions}>
              <button className={`${styles.heroBtn} ${styles.heroBtnSecondary}`} onClick={() => router.push('/admin/reports')}>
                <ArrowRight size={18} />
                العودة للتقارير
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: '#f0fdfa', color: '#028faf' }}>
              <GraduationCap size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{fmt(totalDiplomas)}</span>
              <span className={styles.statLabel}>إجمالي الدبلومات</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
              <CheckCircle size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{fmt(publishedCount)}</span>
              <span className={styles.statLabel}>دبلومات منشورة</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: '#fffbeb', color: '#f59e0b' }}>
              <Layers size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{fmt(draftCount)}</span>
              <span className={styles.statLabel}>مسودات</span>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={18} color="#94a3b8" />
            <input
              type="text"
              placeholder="ابحث باسم الدبلومة..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button className={styles.toolbarBtn} onClick={loadData} title="تحديث">
            <RefreshCw size={16} />
            تحديث
          </button>
        </div>

        {/* States */}
        {loading && !diplomas.length ? <AdminState type="loading" /> : null}
        {!loading && error ? <AdminState type="error" message={error} onAction={loadData} actionLabel="إعادة المحاولة" /> : null}
        {!loading && !error && !diplomas.length ? <AdminState type="empty" message="لا توجد دبلومات متاحة." /> : null}

        {/* Table */}
        {filteredDiplomas.length > 0 && (
          <div className={styles.tableSection}>
            <div className={styles.tableHeader}>
              <div className={styles.tableTitle}>
                قائمة الدبلومات
                <span className={styles.tableCount}>({fmt(filteredDiplomas.length)} دبلومة)</span>
              </div>
            </div>

            <div style={{ overflowX: 'auto', opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: 50 }}>#</th>
                    <th>الدبلومة</th>
                    <th>الحالة</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDiplomas.map((diploma, i) => (
                    <tr key={diploma.id}>
                      <td>{(i + 1).toLocaleString('ar-EG')}</td>
                      <td>
                        <div className={styles.diplomaCell}>
                          <div className={styles.diplomaIcon}>
                            <GraduationCap size={20} />
                          </div>
                          <div>
                            <div className={styles.diplomaTitle}>{diploma.name}</div>
                            {diploma.description && (
                              <div className={styles.diplomaDesc}>{diploma.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${diploma.is_published ? styles.badgeGreen : styles.badgeYellow}`}>
                          {diploma.is_published ? 'منشور' : 'مسودة'}
                        </span>
                      </td>
                      <td>
                        <div className={styles.rowActions}>
                          <button
                            className={`${styles.rowBtn} ${styles.rowBtnExport}`}
                            onClick={() => exportToExcel(diploma.id)}
                            disabled={exportingId === diploma.id}
                          >
                            <FileSpreadsheet size={15} />
                            {exportingId === diploma.id ? 'جاري التصدير...' : 'استخراج CSV'}
                          </button>
                          <button
                            className={`${styles.rowBtn} ${styles.rowBtnView}`}
                            onClick={() => router.push(`/admin/reports/diplomas/${diploma.id}`)}
                          >
                            <BarChart3 size={15} />
                            التقرير المفصل
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.footerInfo}>
              <span className={styles.footerText}>
                يتم تصدير ملفات CSV بترميز UTF-8 مع BOM لدعم اللغة العربية في Excel مباشرة.
              </span>
            </div>
          </div>
        )}

        {!loading && !error && diplomas.length > 0 && filteredDiplomas.length === 0 && (
          <AdminState type="empty" message="لا توجد دبلومات تطابق البحث." />
        )}

      </motion.div>

      <Toast message={toastMessage} type={toastType} isVisible={toastVisible} onClose={() => setToastVisible(false)} />
    </AdminPage>
  );
}
