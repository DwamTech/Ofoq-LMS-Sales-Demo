'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Search,
  Download,
  ArrowRight,
  RefreshCw,
  Eye,
  Settings,
  Users,
  Star,
  BarChart3,
  Layers,
  CheckCircle
} from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import AdminState from '@/components/admin/AdminState';
import { getAllCourses, type Course } from '@/utils/courseService';
import { exportCSV } from '@/utils/exportUtils';
import styles from './CoursesReport.module.css';

const fmt = (v: unknown) => {
  if (v === null || v === undefined || v === '') return '-';
  if (typeof v === 'number') return v.toLocaleString('ar-EG');
  return String(v);
};

const statusMap: Record<string, string> = {
  published: 'منشور',
  draft: 'مسودة',
  archived: 'مؤرشف',
};

const translateStatus = (v: unknown): string => {
  if (typeof v !== 'string' || !v) return '-';
  return statusMap[v.toLowerCase()] || v;
};

export default function CoursesReportsIndexPage() {
  const router = useRouter();
  const [data, setData] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAllCourses();
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحميل المقررات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredData = useMemo(() => {
    let result = data;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c =>
        c.title?.toLowerCase().includes(term) ||
        c.category?.name?.toLowerCase().includes(term)
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter(c => c.status === statusFilter);
    }
    return result;
  }, [data, searchTerm, statusFilter]);

  // Stats
  const totalCourses = data.length;
  const publishedCount = data.filter(c => c.status === 'published').length;
  const draftCount = data.filter(c => c.status === 'draft').length;
  const totalStudents = data.reduce((sum, c) => sum + (c.students_count || 0), 0);

  // Export
  const handleExportAll = () => {
    exportCSV(
      `تقارير_المقررات_${new Date().toLocaleDateString('ar-EG')}`,
      ['المقرر', 'الدبلومة/القسم', 'الحالة', 'عدد الطلاب', 'التقييم'],
      filteredData.map(c => [
        c.title || '-',
        c.category?.name || '-',
        translateStatus(c.status),
        c.students_count ?? '-',
        c.rating ?? '-',
      ])
    );
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'published': return styles.badgeGreen;
      case 'draft': return styles.badgeYellow;
      case 'archived': return styles.badgeGray;
      default: return styles.badgeGray;
    }
  };

  return (
    <AdminPage>
      <motion.div className={styles.page} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

        {/* ─── Hero Banner ─── */}
        <div className={styles.hero}>
          <div className={styles.heroRow}>
            <div className={styles.heroText}>
              <h1>📚 تقارير المقررات</h1>
              <p>متابعة أداء جميع المقررات ومستوى التفاعل والتقدم الأكاديمي للطلاب.</p>
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

        {/* ─── Stats Cards ─── */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: '#fff1f2', color: '#f43f5e' }}>
              <BookOpen size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{fmt(totalCourses)}</span>
              <span className={styles.statLabel}>إجمالي المقررات</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
              <CheckCircle size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{fmt(publishedCount)}</span>
              <span className={styles.statLabel}>مقررات منشورة</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: '#fffbeb', color: '#f59e0b' }}>
              <Layers size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{fmt(draftCount)}</span>
              <span className={styles.statLabel}>مقررات مسودة</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: '#f0f9ff', color: '#0ea5e9' }}>
              <Users size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{fmt(totalStudents)}</span>
              <span className={styles.statLabel}>إجمالي التسجيلات</span>
            </div>
          </div>
        </div>

        {/* ─── Toolbar ─── */}
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={18} color="#94a3b8" />
            <input
              type="text"
              placeholder="ابحث باسم المقرر أو القسم..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className={styles.filterGroup}>
            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">جميع الحالات</option>
              <option value="published">منشور</option>
              <option value="draft">مسودة</option>
              <option value="archived">مؤرشف</option>
            </select>

            <button className={styles.toolbarBtn} onClick={loadData} title="تحديث البيانات">
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* ─── Content ─── */}
        {loading && !data.length ? <AdminState type="loading" /> : null}
        {!loading && error ? <AdminState type="error" message={error} onAction={loadData} actionLabel="إعادة المحاولة" /> : null}
        {!loading && !error && !data.length ? <AdminState type="empty" message="لا توجد مقررات لعرض تقاريرها." /> : null}

        {filteredData.length > 0 && (
          <div className={styles.tableSection}>
            <div className={styles.tableHeader}>
              <div className={styles.tableTitle}>
                قائمة المقررات
                <span className={styles.tableCount}>({fmt(filteredData.length)} مقرر)</span>
              </div>
            </div>

            <div style={{ overflowX: 'auto', opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>المقرر</th>
                    <th>الحالة</th>
                    <th>الطلاب</th>
                    <th>التقييم</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map(course => (
                    <tr key={course.id}>
                      <td>
                        <div className={styles.courseCell}>
                          <div className={styles.courseIcon}>
                            <BookOpen size={20} />
                          </div>
                          <div>
                            <div className={styles.courseTitle}>{course.title}</div>
                            <div className={styles.courseCategory}>{course.category?.name || 'بدون قسم'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${getStatusBadgeClass(course.status)}`}>
                          {translateStatus(course.status)}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${styles.badgeBlue}`}>
                          {fmt(course.students_count)}
                        </span>
                      </td>
                      <td>
                        <div className={styles.ratingCell}>
                          <Star size={14} fill="#f59e0b" />
                          {fmt(course.rating || course.average_rating)}
                        </div>
                      </td>
                      <td>
                        <div className={styles.rowActions}>
                          <button
                            className={`${styles.rowBtn} ${styles.rowBtnView}`}
                            onClick={() => router.push(`/admin/reports/courses/${course.id}`)}
                            title="التقرير المفصل"
                          >
                            <BarChart3 size={14} />
                            التقرير
                          </button>
                          <button
                            className={`${styles.rowBtn} ${styles.rowBtnEdit}`}
                            onClick={() => router.push(`/admin/courses/${course.id}`)}
                            title="إدارة المقرر"
                          >
                            <Settings size={14} />
                            إدارة
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.paginationWrap}>
              <div className={styles.paginationInfo}>
                إجمالي {fmt(filteredData.length)} مقرر
              </div>
            </div>
          </div>
        )}

        {!loading && !error && data.length > 0 && filteredData.length === 0 && (
          <AdminState type="empty" message="لا توجد مقررات تطابق معايير البحث الحالية." />
        )}

      </motion.div>
    </AdminPage>
  );
}
