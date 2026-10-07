'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Users, 
  Search, 
  Download, 
  UserX, 
  Trash2, 
  FileText, 
  Eye, 
  Ban, 
  CheckCircle, 
  UserCheck, 
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Mail
} from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import AdminState from '@/components/admin/AdminState';
import { getStudentsStatus, blockUser, deleteUser, type StudentItem, type StudentsPagination, type StudentsStats } from '@/utils/studentsService';
import { exportCSV } from '@/utils/exportUtils';
import styles from './StudentsReport.module.css';

const fmt = (v: unknown) => {
  if (v === null || v === undefined || v === '') return '-';
  if (typeof v === 'number') return v.toLocaleString('ar-EG');
  return String(v);
};

export default function StudentsReportsIndexPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [data, setData] = useState<StudentItem[]>([]);
  const [pagination, setPagination] = useState<StudentsPagination | null>(null);
  const [stats, setStats] = useState<StudentsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getStudentsStatus(page, 20);
      setData(res.data);
      setPagination(res.pagination);
      if (res.stats) setStats(res.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحميل بيانات الطلاب');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Selection helpers
  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === data.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(data.map(s => s.id)));
    }
  };

  const isAllSelected = data.length > 0 && selected.size === data.length;

  // Filtered data
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter(s => 
      s.name?.toLowerCase().includes(term) || 
      s.email?.toLowerCase().includes(term)
    );
  }, [data, searchTerm]);

  // Export helpers
  const exportStudents = (students: StudentItem[]) => {
    exportCSV(
      `تقارير_الطلاب_${new Date().toLocaleDateString('ar-EG')}`,
      ['الاسم', 'البريد الإلكتروني', 'المقررات المسجلة', 'المقررات المكتملة', 'الدبلومات النشطة'],
      students.map(s => [
        s.name || '-',
        s.email || '-',
        s.total_courses ?? '-',
        s.completed_courses ?? '-',
        s.active_diplomas ?? '-',
      ])
    );
  };

  const handleBulkExport = () => {
    if (selected.size > 0) {
      const selectedStudents = data.filter(s => selected.has(s.id));
      exportStudents(selectedStudents);
    } else {
      exportStudents(data);
    }
  };

  const handleBulkBlock = async () => {
    if (!confirm(`هل أنت متأكد من تعليق ${selected.size} طالب؟`)) return;
    for (const id of selected) {
      try { await blockUser(id); } catch {}
    }
    setSelected(new Set());
    loadData();
  };

  const handleBulkDelete = async () => {
    if (!confirm(`تحذير: سيتم حذف ${selected.size} طالب نهائياً. هل أنت متأكد؟`)) return;
    for (const id of selected) {
      try { await deleteUser(id); } catch {}
    }
    setSelected(new Set());
    loadData();
  };

  // Row Actions
  const handleRowBlock = async (student: StudentItem) => {
    if (!confirm(`هل تريد تعليق حساب "${student.name}"؟`)) return;
    try {
      await blockUser(student.id);
      loadData();
    } catch {}
  };

  const handleRowDelete = async (student: StudentItem) => {
    if (!confirm(`تحذير: هل تريد حذف "${student.name}" نهائياً؟`)) return;
    try {
      await deleteUser(student.id);
      loadData();
    } catch {}
  };

  return (
    <AdminPage>
      <motion.div className={styles.page} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        
        {/* ─── Hero Banner ─── */}
        <div className={styles.hero}>
          <div className={styles.heroRow}>
            <div className={styles.heroText}>
              <h1>📊 تقارير الطلاب</h1>
              <p>متابعة شاملة لأداء الطلاب ومستوى تفاعلهم مع المقررات والدبلومات.</p>
            </div>
            <div className={styles.heroActions}>
              <button className={`${styles.heroBtn} ${styles.heroBtnPrimary}`} onClick={() => exportStudents(data)}>
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
            <div className={styles.statIcon} style={{ backgroundColor: '#f0f9ff', color: '#0ea5e9' }}>
              <Users size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{fmt(stats?.total_students ?? pagination?.total)}</span>
              <span className={styles.statLabel}>إجمالي الطلاب</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
              <UserCheck size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{fmt(stats?.active_students ?? '-')}</span>
              <span className={styles.statLabel}>الطلاب النشطين</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: '#fff1f2', color: '#e11d48' }}>
              <ShieldAlert size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{fmt(stats?.blocked_students ?? '-')}</span>
              <span className={styles.statLabel}>الطلاب الموقوفين</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: '#f5f3ff', color: '#8b5cf6' }}>
              <CheckCircle size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{fmt(pagination?.last_page)}</span>
              <span className={styles.statLabel}>عدد الصفحات</span>
            </div>
          </div>
        </div>

        {/* ─── Toolbar: Search + Bulk Actions ─── */}
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={18} color="#94a3b8" />
            <input 
              type="text" 
              placeholder="ابحث بالاسم أو البريد الإلكتروني..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className={styles.bulkActions}>
            {selected.size > 0 && (
              <>
                <span className={styles.selectionCount}>
                  تم تحديد {selected.size.toLocaleString('ar-EG')}
                </span>
                <button className={styles.bulkBtn} onClick={handleBulkExport}>
                  <Download size={16} />
                  تصدير المحدد
                </button>
                <button className={`${styles.bulkBtn} ${styles.bulkBtnDanger}`} onClick={handleBulkBlock}>
                  <Ban size={16} />
                  تعليق المحدد
                </button>
                <button className={`${styles.bulkBtn} ${styles.bulkBtnDanger}`} onClick={handleBulkDelete}>
                  <Trash2 size={16} />
                  حذف المحدد
                </button>
              </>
            )}
            <button className={styles.bulkBtn} onClick={loadData} title="تحديث البيانات">
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* ─── Table ─── */}
        {loading && !data.length ? <AdminState type="loading" /> : null}
        {!loading && error ? <AdminState type="error" message={error} onAction={loadData} actionLabel="إعادة المحاولة" /> : null}
        {!loading && !error && !data.length ? <AdminState type="empty" message="لا يوجد طلاب لعرض تقاريرهم." /> : null}

        {filteredData.length > 0 && (
          <div className={styles.tableSection}>
            <div className={styles.tableHeader}>
              <div className={styles.tableTitle}>
                قائمة الطلاب
                <span className={styles.tableCount}>({fmt(pagination?.total)} طالب)</span>
              </div>
            </div>

            <div style={{ overflowX: 'auto', opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>
                      <input 
                        type="checkbox" 
                        className={styles.checkbox}
                        checked={isAllSelected}
                        onChange={toggleAll}
                      />
                    </th>
                    <th>الطالب</th>
                    <th>المقررات</th>
                    <th>المقررات المكتملة</th>
                    <th>الدبلومات</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map(student => (
                    <tr 
                      key={student.id} 
                      className={selected.has(student.id) ? styles.selected : ''}
                    >
                      <td>
                        <input 
                          type="checkbox" 
                          className={styles.checkbox}
                          checked={selected.has(student.id)}
                          onChange={() => toggleSelect(student.id)}
                        />
                      </td>
                      <td>
                        <div className={styles.studentCell}>
                          <div className={styles.studentAvatar}>
                            {String(student.name || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className={styles.studentName}>{student.name}</div>
                            <div className={styles.studentEmail}>{student.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${styles.badgeBlue}`}>
                          {fmt(student.total_courses)}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${styles.badgeGreen}`}>
                          {fmt(student.completed_courses)}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${styles.badgePurple}`}>
                          {fmt(student.active_diplomas)}
                        </span>
                      </td>
                      <td>
                        <div className={styles.rowActions}>
                          <button 
                            className={`${styles.rowBtn} ${styles.rowBtnView}`}
                            onClick={() => router.push(`/admin/reports/students/${student.id}`)}
                            title="عرض التقرير المفصل"
                          >
                            <Eye size={14} />
                            التقرير
                          </button>
                          <button 
                            className={`${styles.rowBtn} ${styles.rowBtnBlock}`}
                            onClick={() => handleRowBlock(student)}
                            title="تعليق الحساب"
                          >
                            <Ban size={14} />
                          </button>
                          <button 
                            className={`${styles.rowBtn} ${styles.rowBtnDelete}`}
                            onClick={() => handleRowDelete(student)}
                            title="حذف الطالب"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ─── Pagination ─── */}
            {pagination && (
              <div className={styles.paginationWrap}>
                <div className={styles.paginationInfo}>
                  الصفحة {pagination.current_page.toLocaleString('ar-EG')} من {pagination.last_page.toLocaleString('ar-EG')} — الإجمالي {pagination.total.toLocaleString('ar-EG')} طالب
                </div>
                <div className={styles.paginationBtns}>
                  <button 
                    disabled={pagination.current_page <= 1 || loading}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    السابق
                  </button>
                  <button 
                    disabled={pagination.current_page >= pagination.last_page || loading}
                    onClick={() => setPage(p => p + 1)}
                  >
                    التالي
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </motion.div>
    </AdminPage>
  );
}
