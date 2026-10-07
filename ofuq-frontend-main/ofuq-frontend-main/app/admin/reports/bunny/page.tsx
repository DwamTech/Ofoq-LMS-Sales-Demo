'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminPage from '@/components/admin/AdminPage';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminState from '@/components/admin/AdminState';
import BunnyReportsNav from '@/components/reports/BunnyReportsNav';
import ReportCards, { type ReportCardItem } from '@/components/reports/ReportCards';
import ReportFilters from '@/components/reports/ReportFilters';
import ReportTable from '@/components/reports/ReportTable';
import { CostBadge, SyncStatusBadge } from '@/components/reports/Badges';
import { normalizeApiError, type AdminNormalizedError } from '@/utils/adminError';
import { getBunnyReportsOverview } from '@/utils/bunnyReportsService';
import type {
  BunnyReportsOverviewData,
  BunnyReportFilters,
  BunnySyncSummary,
  BunnyUsageSummary,
} from '@/types/bunnyReports';
import styles from '../Reports.module.css';

type SummaryRow = Record<string, unknown> & {
  id: string;
  label: string;
  value: string | number;
  status?: string | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const formatValue = (value: unknown): string | number => {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'number') return value.toLocaleString('ar-EG');
  if (typeof value === 'boolean') return value ? 'نعم' : 'لا';
  if (typeof value === 'string') return value;
  return '-';
};

const formatBytes = (value: unknown): string => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
  if (value < 1024) return `${value} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let size = value / 1024;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 10 ? 1 : 2)} ${units[unitIndex]}`;
};

const formatDate = (value: unknown): string => {
  if (typeof value !== 'string' || !value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('ar-EG');
};

const addUsageCards = (
  cards: ReportCardItem[],
  prefix: string,
  summary?: BunnyUsageSummary
) => {
  if (!summary) return;
  if (summary.storage_bytes !== undefined) {
    cards.push({
      key: `${prefix}-storage`,
      label: 'التخزين',
      value: formatBytes(summary.storage_bytes),
      description: 'إجمالي التخزين حسب آخر snapshot متاح',
    });
  }
  if (summary.bandwidth_bytes !== undefined || summary.traffic_bytes !== undefined) {
    cards.push({
      key: `${prefix}-bandwidth`,
      label: 'الاستهلاك',
      value: formatBytes(summary.bandwidth_bytes ?? summary.traffic_bytes),
      description: 'Bandwidth/traffic حسب البيانات المتاحة',
    });
  }
  if (summary.videos_count !== undefined) {
    cards.push({
      key: `${prefix}-videos`,
      label: 'الفيديوهات',
      value: formatValue(summary.videos_count),
    });
  }
  if (summary.views_count !== undefined) {
    cards.push({
      key: `${prefix}-views`,
      label: 'المشاهدات',
      value: formatValue(summary.views_count),
    });
  }
};

const translateLabel = (key: string): string => {
  const map: Record<string, string> = {
    total_videos: 'إجمالي الفيديوهات',
    total_storage: 'إجمالي مساحة التخزين',
    total_bandwidth: 'استهلاك الباندويث',
    total_views: 'إجمالي المشاهدات',
    sync_status: 'حالة المزامنة',
    last_sync: 'آخر مزامنة',
  };
  return map[key.toLowerCase()] || key.replace(/_/g, ' ');
};

const buildCards = (data: BunnyReportsOverviewData | null): ReportCardItem[] => {
  if (!data) return [];
  const cards: ReportCardItem[] = [];

  if (Array.isArray(data.cards)) {
    cards.push(
      ...data.cards.map((card, index) => ({
        key: card.key ?? `card-${index}`,
        label: translateLabel(card.label ?? card.title ?? `مؤشر ${index + 1}`),
        value: formatValue(card.value),
        description: card.description,
        status: card.status,
        badgeType: card.status ? ('sync' as const) : undefined,
      }))
    );
  }

  if (isRecord(data.summary)) {
    Object.entries(data.summary).forEach(([key, value]) => {
      if (isRecord(value)) {
        cards.push({
          key,
          label: translateLabel(String(value.label ?? value.title ?? key)),
          value: formatValue(value.value ?? value.amount ?? '-'),
          description: typeof value.description === 'string' ? value.description : null,
        });
        return;
      }

      cards.push({
        key,
        label: translateLabel(key),
        value: typeof value === 'string' && key.includes('bytes') ? formatBytes(Number(value)) : formatValue(value),
      });
    });
  }

  addUsageCards(cards, 'usage', data.usage);
  addUsageCards(cards, 'storage', data.storage);

  const cost = data.cost ?? data.cost_summary;
  if (cost) {
    cards.push({
      key: 'cost',
      label: 'التكلفة التقديرية',
      value:
        typeof cost.amount === 'number'
          ? `${cost.amount.toLocaleString('ar-EG')} ${cost.currency ?? ''}`.trim()
          : 'غير متاح',
      status: cost.status ?? cost.accuracy ?? 'unavailable',
      badgeType: 'cost',
    });
  }

  if (data.sync_summary?.last_status) {
    cards.push({
      key: 'sync-status',
      label: 'آخر مزامنة',
      value: formatDate(data.sync_summary.last_sync_at),
      status: data.sync_summary.last_status,
      badgeType: 'sync',
    });
  }

  return cards;
};

const recordToRows = (record: Record<string, unknown> | undefined, prefix: string): SummaryRow[] => {
  if (!record) return [];
  return Object.entries(record).map(([key, value]) => ({
    id: `${prefix}-${key}`,
    label: translateLabel(key),
    value: key.includes('bytes') ? formatBytes(value) : formatValue(value),
    status: isRecord(value) && typeof value.status === 'string' ? value.status : null,
  }));
};

const syncRows = (sync?: BunnySyncSummary): SummaryRow[] => {
  if (!sync) return [];
  return [
    { id: 'last_sync_at', label: 'آخر مزامنة', value: formatDate(sync.last_sync_at) },
    { id: 'last_status', label: 'الحالة', value: formatValue(sync.last_status), status: sync.last_status },
    { id: 'successful_syncs', label: 'مزامنات ناجحة', value: formatValue(sync.successful_syncs) },
    { id: 'failed_syncs', label: 'مزامنات فاشلة', value: formatValue(sync.failed_syncs) },
    { id: 'pending_syncs', label: 'قيد الانتظار', value: formatValue(sync.pending_syncs) },
  ].filter((row) => row.value !== '-');
};

const hasOverviewData = (data: BunnyReportsOverviewData | null) => {
  if (!data) return false;
  return Object.keys(data).length > 0;
};

export default function BunnyReportsOverviewPage() {
  const [filters, setFilters] = useState<BunnyReportFilters>({ limit: 10 });
  const [data, setData] = useState<BunnyReportsOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminNormalizedError | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const overview = await getBunnyReportsOverview(filters);
      setData(overview);
    } catch (err) {
      setError(normalizeApiError(err, 'فشل تحميل ملخص تقارير Bunny'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const cards = useMemo(() => buildCards(data), [data]);
  const videoRows = useMemo(() => recordToRows(data?.videos_summary, 'videos'), [data]);
  const syncSummaryRows = useMemo(() => syncRows(data?.sync_summary), [data]);

  return (
    <AdminPage>
      <AdminPageHeader
        title="تقارير Bunny"
        description="ملخص التخزين والاستهلاك والتكلفة وحالة المزامنة بدون تشغيل أي عملية sync."
        backHref="/admin/reports"
        backLabel="العودة للتقارير التعليمية"
      />

      <BunnyReportsNav />

      <ReportFilters value={filters} onApply={setFilters} />

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
        <AdminState type="empty" message="لا توجد بيانات Bunny قابلة للعرض ضمن فلاتر البحث الحالية." />
      ) : null}

      {!loading && !error && hasOverviewData(data) ? (
        <main className={styles.contentGrid}>
          <ReportCards cards={cards} />

          <div className={styles.notice}>
            حالة التكلفة:{' '}
            <CostBadge status={(data?.cost ?? data?.cost_summary)?.status ?? 'unavailable'} /> حالة المزامنة:{' '}
            <SyncStatusBadge status={data?.sync_summary?.last_status ?? 'unavailable'} />
          </div>

          <div className={styles.sectionGrid}>
            <ReportTable
              title="ملخص الفيديوهات"
              rows={videoRows}
              columns={[
                { key: 'label', header: 'المؤشر' },
                { key: 'value', header: 'القيمة' },
              ]}
            />

            <ReportTable
              title="ملخص المزامنة"
              rows={syncSummaryRows}
              columns={[
                { key: 'label', header: 'المؤشر' },
                {
                  key: 'value',
                  header: 'القيمة',
                  render: (row) =>
                    row.status ? <SyncStatusBadge status={String(row.status)} /> : formatValue(row.value),
                },
              ]}
            />
          </div>
        </main>
      ) : null}
    </AdminPage>
  );
}
