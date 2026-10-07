'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import BunnyReportsNav from '@/components/reports/BunnyReportsNav';
import BunnySyncRunPanel from '@/components/reports/BunnySyncRunPanel';
import ReportPagination from '@/components/reports/ReportPagination';
import ReportState from '@/components/reports/ReportState';
import ReportTable from '@/components/reports/ReportTable';
import { SyncStatusBadge } from '@/components/reports/Badges';
import { getBunnySyncLogs } from '@/utils/bunnyReportsService';
import type { BunnyPaginatedData, BunnySyncLogFilters, BunnySyncLogRow } from '@/types/bunnyReports';
import pageStyles from '../../Reports.module.css';
import reportStyles from '@/components/reports/reports.module.css';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const rowsFrom = (data: BunnyPaginatedData<BunnySyncLogRow> | null): BunnySyncLogRow[] => {
  if (!data) return [];
  return (data.data ?? data.items ?? data.rows ?? []).filter(isRecord) as BunnySyncLogRow[];
};

const formatValue = (value: unknown): string | number => {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'number') return value.toLocaleString('ar-EG');
  if (typeof value === 'boolean') return value ? 'نعم' : 'لا';
  if (typeof value === 'string') return value;
  return '-';
};

const formatDate = (value: unknown): string => {
  if (typeof value !== 'string' || !value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('ar-EG');
};

const formatDurationMs = (value: unknown): string => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
  if (value < 1000) return `${value.toLocaleString('ar-EG')}ms`;
  return `${(value / 1000).toLocaleString('ar-EG', { maximumFractionDigits: 2 })}ث`;
};

const shortText = (value: unknown, max = 120): string => {
  if (typeof value !== 'string' || !value) return '-';
  return value.length > max ? `${value.slice(0, max)}...` : value;
};

const translateSyncType = (type: string | undefined | null) => {
  if (!type) return '-';
  const map: Record<string, string> = {
    health_check: 'فحص الحالة',
    video_details: 'تحديث الفيديوهات',
    usage: 'تحديث الاستهلاك',
    costs: 'حساب التكاليف'
  };
  return map[type] || type;
};

const translateStatus = (status: string | undefined | null) => {
  if (!status) return '-';
  const map: Record<string, string> = {
    running: 'قيد التشغيل',
    completed: 'مكتمل',
    completed_with_errors: 'مكتمل بأخطاء',
    completed_with_warnings: 'مكتمل بتحذيرات',
    failed: 'فشل'
  };
  return map[status] || status;
};

const metadataSummary = (row: BunnySyncLogRow): string => {
  const summary = row.metadata_summary;
  if (!summary) return '-';
  const count = typeof summary.keys_count === 'number' ? summary.keys_count : summary.keys?.length;
  const keys = Array.isArray(summary.keys) && summary.keys.length ? `: ${summary.keys.slice(0, 5).join(', ')}` : '';
  return count ? `${count.toLocaleString('ar-EG')} مفاتيح${keys}` : '-';
};

export default function BunnySyncLogsPage() {
  const [filters, setFilters] = useState<BunnySyncLogFilters>({ page: 1, per_page: 25 });
  const [draft, setDraft] = useState<BunnySyncLogFilters>(filters);
  const [data, setData] = useState<BunnyPaginatedData<BunnySyncLogRow> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const report = await getBunnySyncLogs(filters);
      setData(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحميل سجلات مزامنة Bunny');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const rows = useMemo(() => rowsFrom(data), [data]);

  return (
    <div className={pageStyles.reportsPage}>
      <header className={pageStyles.header}>
        <div className={pageStyles.titleBlock}>
          <h1>سجلات مزامنة خوادم الفيديو</h1>
          <p>متابعة عمليات المزامنة اليدوية والمجدولة وتفاصيل السجلات بشكل مبسط.</p>
        </div>
      </header>

      <BunnyReportsNav />
      <BunnySyncRunPanel onSuccess={loadData} />

      <form
        className={reportStyles.filters}
        onSubmit={(event) => {
          event.preventDefault();
          setFilters({
            sync_type: draft.sync_type || undefined,
            status: draft.status || undefined,
            per_page: draft.per_page || 25,
            page: 1,
          });
        }}
      >
        <label>
          <span>نوع المزامنة</span>
          <select
            value={draft.sync_type ?? ''}
            onChange={(event) => setDraft((prev) => ({ ...prev, sync_type: event.target.value }))}
          >
            <option value="">كل الأنواع</option>
            <option value="video_details">تفاصيل الفيديوهات</option>
            <option value="usage">الاستهلاك</option>
            <option value="costs">التكاليف</option>
            <option value="health_check">فحص الصحة</option>
          </select>
        </label>
        <label>
          <span>الحالة</span>
          <select value={draft.status ?? ''} onChange={(event) => setDraft((prev) => ({ ...prev, status: event.target.value }))}>
            <option value="">كل الحالات</option>
            <option value="running">قيد التشغيل</option>
            <option value="completed">مكتمل</option>
            <option value="completed_with_errors">مكتمل مع أخطاء</option>
            <option value="completed_with_warnings">مكتمل مع تحذيرات</option>
            <option value="failed">فشل</option>
          </select>
        </label>
        <label>
          <span>لكل صفحة</span>
          <input
            max={100}
            min={5}
            type="number"
            value={draft.per_page ?? 25}
            onChange={(event) => setDraft((prev) => ({ ...prev, per_page: Number(event.target.value) || undefined }))}
          />
        </label>
        <button type="submit">تطبيق</button>
      </form>

      {loading ? <ReportState type="loading" /> : null}
      {!loading && error ? <ReportState type="error" message={error} onRetry={loadData} /> : null}
      {!loading && !error && !rows.length ? <ReportState type="empty" message="لا توجد سجلات مزامنة ضمن الفلاتر الحالية." /> : null}

      {!loading && !error && rows.length ? (
        <main className={pageStyles.contentGrid}>
          <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <ReportTable
              title="سجلات المزامنة"
              rows={rows}
              columns={[
                { key: 'sync_type', header: 'النوع', render: (row) => translateSyncType(row.sync_type) },
                { key: 'status', header: 'الحالة', render: (row) => <SyncStatusBadge status={row.status} /> },
                { key: 'dry_run', header: 'تجربة فقط', render: (row) => formatValue(row.dry_run) },
                { key: 'limit', header: 'الحد' },
                { key: 'processed_count', header: 'معالج' },
                { key: 'succeeded_count', header: 'ناجح' },
                { key: 'failed_count', header: 'فشل' },
                { key: 'skipped_count', header: 'متجاوز' },
                { key: 'started_at', header: 'بدأت', render: (row) => formatDate(row.started_at) },
                { key: 'finished_at', header: 'انتهت', render: (row) => formatDate(row.finished_at) },
                { key: 'duration_ms', header: 'المدة', render: (row) => formatDurationMs(row.duration_ms) },
                { key: 'error_message', header: 'الخطأ', render: (row) => shortText(row.error_message) },
                { key: 'metadata_summary', header: 'ملخص metadata', render: (row) => metadataSummary(row) },
              ]}
            />
            <ReportPagination
              loading={loading}
              pagination={data}
              onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
            />
          </section>
        </main>
      ) : null}
    </div>
  );
}
