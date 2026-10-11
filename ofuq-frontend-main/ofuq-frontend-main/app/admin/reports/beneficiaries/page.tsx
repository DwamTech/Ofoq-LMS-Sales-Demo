'use client';
import { BrandLogo } from '@/components/brand/BrandLogo'
import { brand } from '@/lib/brand'

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Download,
  FileBarChart,
  GraduationCap,
  Info,
  Printer,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import AdminPage from '@/components/admin/AdminPage';
import AdminState from '@/components/admin/AdminState';
import ReportFilters from '@/components/reports/ReportFilters';
import ReportTable from '@/components/reports/ReportTable';
import { exportCSV } from '@/utils/exportUtils';
import { downloadBeneficiaryPdf, getBeneficiaryReport } from '@/utils/reportsService';
import type { BeneficiaryReportData, ReportFilters as ReportFiltersValue } from '@/types/reports';
import styles from './BeneficiaryReport.module.css';

const formatNumber = (value: number) => value.toLocaleString('ar-EG');

const formatDate = (value?: string | null) => {
  if (!value) return 'كل الفترات';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export default function BeneficiaryReportPage() {
  const [filters, setFilters] = useState<ReportFiltersValue>({});
  const [data, setData] = useState<BeneficiaryReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setData(await getBeneficiaryReport(filters));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحميل تقرير المستفيدين');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const cards = useMemo(() => {
    if (!data) return [];
    return [
      { label: 'إجمالي المستفيدين الفريدين', value: data.summary.total_beneficiaries, icon: Users, color: '#028faf', background: '#f0fdfa' },
      { label: 'أتموا أي مسار / مقرر', value: data.summary.completed_any_course, icon: BookOpen, color: '#2563eb', background: '#eff6ff' },
      { label: 'أتموا أي دبلومة', value: data.summary.completed_any_diploma, icon: GraduationCap, color: '#7c3aed', background: '#f5f3ff' },
      { label: 'إجمالي المكتملين الفريدين', value: data.summary.completed_any_learning_path, icon: CheckCircle2, color: '#059669', background: '#ecfdf5' },
    ];
  }, [data]);

  const periodLabel = data?.filters.from || data?.filters.to
    ? `${formatDate(data?.filters.from)} — ${formatDate(data?.filters.to)}`
    : 'منذ بداية المنصة وحتى الآن';

  const exportReport = () => {
    if (!data) return;

    const summaryRows: (string | number)[][] = [
      ['فترة التقرير', periodLabel, '', '', ''],
      ['تاريخ الإصدار', formatDate(data.generated_at), '', '', ''],
      ['', '', '', '', ''],
      ['المؤشر التنفيذي', 'القيمة', '', '', ''],
      ['إجمالي المستفيدين الفريدين', data.summary.total_beneficiaries, '', '', ''],
      ['مستفيدو الدبلومات', data.summary.diploma_beneficiaries, '', '', ''],
      ['مستفيدو المسارات / المقررات', data.summary.course_beneficiaries, '', '', ''],
      ['أتموا أي مسار / مقرر', data.summary.completed_any_course, '', '', ''],
      ['أتموا أي دبلومة', data.summary.completed_any_diploma, '', '', ''],
      ['إجمالي المكتملين الفريدين', data.summary.completed_any_learning_path, '', '', ''],
      ['', '', '', '', ''],
      ['تفصيل الدبلومات', '', '', ''],
      ['الدبلومة', 'عدد المستفيدين', 'عدد المكتملين', 'نسبة الإكمال'],
      ...data.diplomas.map((row) => [row.diploma_name, row.beneficiaries_count, row.completed_count, `${row.completion_rate}%`]),
      ['', '', '', '', ''],
      ['تفصيل المسارات / المقررات', '', '', ''],
      ['المسار / المقرر', 'الدبلومة', 'عدد المستفيدين', 'عدد المكتملين', 'نسبة الإكمال'],
      ...data.courses.map((row) => [row.course_name, row.diploma_name || '-', row.beneficiaries_count, row.completed_count, `${row.completion_rate}%`]),
    ];

    exportCSV(
      `تقرير_المستفيدين_${new Date().toLocaleDateString('ar-EG')}`,
      ['تقرير المستفيدين والإنجاز', '', '', '', ''],
      summaryRows
    );
  };

  const exportPdf = async () => {
    try {
      setExportingPdf(true);
      const pdf = await downloadBeneficiaryPdf(filters);
      const url = URL.createObjectURL(pdf);
      const link = document.createElement('a');
      link.href = url;
      link.download = `تقرير_المستفيدين_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'تعذر إنشاء ملف PDF. حاول مرة أخرى.';
      window.alert(message);
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <AdminPage size="full" className={styles.printDocument}>
      <div className={styles.printHeader}>
        <BrandLogo/>
        <div>
          <span>{brand.name}</span>
          <h1>تقرير المستفيدين والإنجاز</h1>
          <p>{periodLabel}</p>
        </div>
        <div className={styles.printMeta}>
          <span>تاريخ الإصدار</span>
          <strong>{formatDate(data?.generated_at)}</strong>
        </div>
      </div>

      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroMain}>
          <Link href="/admin/reports" className={styles.backLink}>
            <ArrowRight size={16} /> مركز التقارير
          </Link>
          <div className={styles.eyebrow}><Sparkles size={15} /> تقرير إداري موحّد</div>
          <h1>تقرير المستفيدين والإنجاز</h1>
          <p>رؤية واضحة لأعداد المستفيدين الفريدين، ومستوى إكمال الدبلومات والمسارات، مبنية على البيانات التاريخية الفعلية للمنصة.</p>
          <div className={styles.heroMeta}>
            <span><CalendarDays size={16} /> {periodLabel}</span>
            <span><ShieldCheck size={16} /> بدون تكرار المستفيد</span>
          </div>
        </div>
        <div className={styles.heroSide}>
          <div className={styles.heroIcon}><FileBarChart size={34} /></div>
          <span>آخر تحديث</span>
          <strong>{data ? formatDate(data.generated_at) : 'جاري التحميل...'}</strong>
        </div>
      </section>

      <div className={styles.actionBar}>
        <div className={styles.actionIntro}>
          <span className={styles.liveDot} />
          <div>
            <strong>بيانات مباشرة ومحدّثة</strong>
            <p>اختر فترة التسجيل المطلوبة ثم صدّر التقرير بالصيغة المناسبة.</p>
          </div>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.ghostButton} onClick={loadData} disabled={loading}>
            <RefreshCw size={17} className={loading ? styles.spinning : undefined} /> تحديث
          </button>
          <button type="button" className={styles.ghostButton} onClick={exportReport} disabled={!data}>
            <Download size={17} /> Excel / CSV
          </button>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={exportPdf}
            disabled={!data || exportingPdf}
          >
            <Printer size={17} className={exportingPdf ? styles.spinning : undefined} /> {exportingPdf ? 'جاري إعداد التقرير...' : 'تصدير PDF'}
          </button>
        </div>
      </div>

      <section className={styles.toolbar}>
        <div className={styles.toolbarTitle}>
          <span><CalendarDays size={19} /></span>
          <div>
            <h2>تخصيص نطاق التقرير</h2>
            <p>حدد فترة تسجيل المستفيدين، أو اتركها فارغة لعرض تاريخ المنصة بالكامل.</p>
          </div>
        </div>
        <ReportFilters value={filters} onApply={setFilters} showLimit={false} />
      </section>

      {loading && !data ? <AdminState type="loading" message="جاري احتساب البيانات التاريخية..." /> : null}
      {error ? <AdminState type="error" title="تعذر تحميل التقرير" message={error} onAction={loadData} /> : null}

      {data ? (
        <>
          <div className={styles.definition}>
            <Info size={18} />
            <p>{data.filters.period_definition} إجمالي الأعلى يحسب كل شخص مرة واحدة، بينما قد يظهر الشخص في أكثر من دبلومة داخل التفاصيل.</p>
          </div>

          <section className={styles.cards} aria-label="ملخص المستفيدين">
            {cards.map((card, index) => {
              const Icon = card.icon;
              return (
                <article className={styles.card} key={card.label} style={{ '--accent': card.color } as React.CSSProperties}>
                  <span className={styles.cardIcon} style={{ color: card.color, background: card.background }}><Icon size={23} /></span>
                  <div className={styles.cardContent}>
                    <span>{card.label}</span>
                    <strong>{formatNumber(card.value)}</strong>
                    <small>{index === 0 ? 'مستفيد غير مكرر' : 'مستفيد مكتمل'}</small>
                  </div>
                </article>
              );
            })}
          </section>

          <section className={styles.tables}>
            <div className={styles.reportSection}>
              <div className={styles.sectionIntro}>
                <span><GraduationCap size={21} /></span>
                <div><h2>أداء الدبلومات</h2><p>التسجيل والإكمال ونسبة التحويل لكل دبلومة.</p></div>
              </div>
              <ReportTable
                title=""
                rows={data.diplomas}
                emptyMessage="لا توجد دبلومات ضمن نطاق التقرير."
                columns={[
                  { key: 'diploma_name', header: 'الدبلومة' },
                  { key: 'beneficiaries_count', header: 'المستفيدون', render: (row) => <strong>{formatNumber(row.beneficiaries_count)}</strong> },
                  { key: 'completed_count', header: 'المكتملون', render: (row) => formatNumber(row.completed_count) },
                  { key: 'completion_rate', header: 'نسبة الإكمال', render: (row) => (
                    <div className={styles.rateCell}><span><i style={{ width: `${Math.min(row.completion_rate, 100)}%` }} /></span><strong>{formatNumber(row.completion_rate)}%</strong></div>
                  ) },
                ]}
              />
            </div>
            <div className={styles.reportSection}>
              <div className={styles.sectionIntro}>
                <span><BookOpen size={21} /></span>
                <div><h2>أداء المسارات والمقررات</h2><p>تفاصيل الإنجاز الأكاديمي داخل كل دبلومة.</p></div>
              </div>
              <ReportTable
                title=""
                rows={data.courses}
                emptyMessage="لا توجد مسارات أو مقررات ضمن نطاق التقرير."
                columns={[
                  { key: 'course_name', header: 'المسار / المقرر' },
                  { key: 'diploma_name', header: 'الدبلومة', render: (row) => row.diploma_name || '-' },
                  { key: 'beneficiaries_count', header: 'المستفيدون', render: (row) => <strong>{formatNumber(row.beneficiaries_count)}</strong> },
                  { key: 'completed_count', header: 'المكتملون', render: (row) => formatNumber(row.completed_count) },
                  { key: 'completion_rate', header: 'نسبة الإكمال', render: (row) => (
                    <div className={styles.rateCell}><span><i style={{ width: `${Math.min(row.completion_rate, 100)}%` }} /></span><strong>{formatNumber(row.completion_rate)}%</strong></div>
                  ) },
                ]}
              />
            </div>
          </section>

          <footer className={styles.reportFooter}>
            <span>{brand.name}</span>
            <span>تقرير داخلي — تم إنشاؤه آليًا من بيانات المنصة</span>
          </footer>
        </>
      ) : null}
    </AdminPage>
  );
}
