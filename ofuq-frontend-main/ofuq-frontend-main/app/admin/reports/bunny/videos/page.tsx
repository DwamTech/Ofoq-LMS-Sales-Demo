'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminFormField from '@/components/admin/AdminFormField';
import AdminInput from '@/components/admin/AdminInput';
import AdminPagination from '@/components/admin/AdminPagination';
import AdminSelect from '@/components/admin/AdminSelect';
import AdminTable from '@/components/admin/AdminTable';
import AdminTableToolbar from '@/components/admin/AdminTableToolbar';
import FormActions from '@/components/admin/FormActions';
import BunnyReportsNav from '@/components/reports/BunnyReportsNav';
import ReportCards, { type ReportCardItem } from '@/components/reports/ReportCards';
import ReportState from '@/components/reports/ReportState';
import { AccuracyBadge, SyncStatusBadge } from '@/components/reports/Badges';
import { getBunnyVideosReport } from '@/utils/bunnyReportsService';
import type { BunnyPaginatedData, BunnyVideoFilters, BunnyVideoRow, BunnyVideoStatusSummary } from '@/types/bunnyReports';
import pageStyles from '../../Reports.module.css';
import reportStyles from '@/components/reports/reports.module.css';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const rowsFrom = (data: BunnyPaginatedData<BunnyVideoRow> | null): BunnyVideoRow[] => {
  if (!data) return [];
  return (data.data ?? data.items ?? data.rows ?? []).filter(isRecord) as BunnyVideoRow[];
};

const formatValue = (value: unknown): string | number => {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'number') return value.toLocaleString('ar-EG');
  if (typeof value === 'boolean') return value ? 'نعم' : 'لا';
  if (typeof value === 'string') return value;
  return '-';
};

const formatSeconds = (value: unknown): string => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const seconds = Math.floor(value % 60);
  if (hours) return `${hours}س ${minutes}د`;
  if (minutes) return `${minutes}د ${seconds}ث`;
  return `${seconds}ث`;
};

const formatBytes = (value: unknown): string => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
  if (value < 1024) return `${value.toLocaleString('ar-EG')} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let size = value / 1024;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toLocaleString('ar-EG', { maximumFractionDigits: size >= 10 ? 1 : 2 })} ${units[unitIndex]}`;
};

const formatDate = (value: unknown): string => {
  if (typeof value !== 'string' || !value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('ar-EG');
};

const videoStatus = (row: BunnyVideoRow): BunnyVideoStatusSummary => {
  if (isRecord(row.status)) return row.status as BunnyVideoStatusSummary;
  return { label: typeof row.status === 'string' ? row.status : null, sync_status: row.sync_status };
};

const buildCards = (rows: BunnyVideoRow[], total?: number | null): ReportCardItem[] => {
  const storage = rows.reduce((sum, row) => sum + (typeof row.storage_size_bytes === 'number' ? row.storage_size_bytes : 0), 0);
  const views = rows.reduce((sum, row) => sum + (typeof row.views === 'number' ? row.views : 0), 0);
  const watchTime = rows.reduce(
    (sum, row) => sum + (typeof row.total_watch_time_seconds === 'number' ? row.total_watch_time_seconds : 0),
    0
  );
  const synced = rows.filter((row) => videoStatus(row).sync_status === 'synced').length;

  return [
    { key: 'total', label: 'إجمالي الفيديوهات', value: formatValue(total ?? rows.length) },
    { key: 'synced', label: 'المتزامنة في الصفحة', value: formatValue(synced) },
    { key: 'storage', label: 'التخزين في الصفحة', value: formatBytes(storage) },
    { key: 'views', label: 'المشاهدات في الصفحة', value: formatValue(views) },
    { key: 'watch-time', label: 'وقت المشاهدة في الصفحة', value: formatSeconds(watchTime) },
  ];
};

export default function BunnyVideosReportPage() {
  const [filters, setFilters] = useState<BunnyVideoFilters>({ page: 1, per_page: 25 });
  const [draft, setDraft] = useState<BunnyVideoFilters>(filters);
  const [data, setData] = useState<BunnyPaginatedData<BunnyVideoRow> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const report = await getBunnyVideosReport(filters);
      setData(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحميل فيديوهات Bunny');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const rows = useMemo(() => rowsFrom(data), [data]);
  const cards = useMemo(() => buildCards(rows, data?.total), [rows, data?.total]);

  return (
    <div className={pageStyles.reportsPage}>
      <header className={pageStyles.header}>
        <div className={pageStyles.titleBlock}>
          <h1>فيديوهات Bunny</h1>
          <p>تفاصيل الفيديوهات المتزامنة من Bunny بدون عرض أي raw payload.</p>
        </div>
      </header>

      <BunnyReportsNav />

      <form
        className={reportStyles.filters}
        onSubmit={(event) => {
          event.preventDefault();
          setFilters({
            from: draft.from || undefined,
            to: draft.to || undefined,
            search: draft.search || undefined,
            status: draft.status || undefined,
            per_page: draft.per_page || 25,
            page: 1,
          });
        }}
      >
        <AdminFormField label="بحث" htmlFor="bunny-video-search">
          <AdminInput
            id="bunny-video-search"
            value={draft.search ?? ''}
            onChange={(event) => setDraft((prev) => ({ ...prev, search: event.target.value }))}
          />
        </AdminFormField>
        <AdminFormField label="حالة المزامنة" htmlFor="bunny-video-status">
          <AdminSelect
            id="bunny-video-status"
            value={draft.status ?? ''}
            onChange={(event) => setDraft((prev) => ({ ...prev, status: event.target.value }))}
          >
            <option value="">كل الحالات</option>
            <option value="synced">متزامن</option>
            <option value="failed">فشل</option>
            <option value="pending">قيد الانتظار</option>
          </AdminSelect>
        </AdminFormField>
        <AdminFormField label="من" htmlFor="bunny-video-from">
          <AdminInput
            id="bunny-video-from"
            type="date"
            value={draft.from ?? ''}
            onChange={(event) => setDraft((prev) => ({ ...prev, from: event.target.value }))}
          />
        </AdminFormField>
        <AdminFormField label="إلى" htmlFor="bunny-video-to">
          <AdminInput
            id="bunny-video-to"
            type="date"
            value={draft.to ?? ''}
            onChange={(event) => setDraft((prev) => ({ ...prev, to: event.target.value }))}
          />
        </AdminFormField>
        <AdminFormField label="لكل صفحة" htmlFor="bunny-video-per-page">
          <AdminInput
            id="bunny-video-per-page"
            max={100}
            min={5}
            type="number"
            value={draft.per_page ?? 25}
            onChange={(event) => setDraft((prev) => ({ ...prev, per_page: Number(event.target.value) || undefined }))}
          />
        </AdminFormField>
        <FormActions submitLabel="تطبيق" />
      </form>

      {loading ? <ReportState type="loading" /> : null}
      {!loading && error ? <ReportState type="error" message={error} onRetry={loadData} /> : null}
      {!loading && !error && !rows.length ? <ReportState type="empty" message="لا توجد فيديوهات Bunny ضمن الفلاتر الحالية." /> : null}

      {!loading && !error && rows.length ? (
        <main className={pageStyles.contentGrid}>
          <ReportCards cards={cards} />
          <section className={pageStyles.sectionGrid}>
            <AdminTableToolbar title="فيديوهات Bunny" />
            <AdminTable
              ariaLabel="فيديوهات Bunny"
              data={rows}
              getRowKey={(row, index) => row.id ?? row.video_guid ?? index}
              columns={[
                { key: 'title', header: 'الفيديو', render: (row) => formatValue(row.title) },
                { key: 'lesson', header: 'الدرس', render: (row) => formatValue(row.lesson?.lesson_title) },
                { key: 'video_guid', header: 'Video GUID' },
                {
                  key: 'status',
                  header: 'الحالة',
                  render: (row) => <SyncStatusBadge status={videoStatus(row).sync_status ?? videoStatus(row).label} />,
                },
                { key: 'duration_seconds', header: 'المدة', render: (row) => formatSeconds(row.duration_seconds) },
                { key: 'storage_size_bytes', header: 'التخزين', render: (row) => formatBytes(row.storage_size_bytes) },
                { key: 'views', header: 'المشاهدات' },
                {
                  key: 'average_watch_time_seconds',
                  header: 'متوسط المشاهدة',
                  render: (row) => formatSeconds(row.average_watch_time_seconds),
                },
                {
                  key: 'total_watch_time_seconds',
                  header: 'إجمالي المشاهدة',
                  render: (row) => formatSeconds(row.total_watch_time_seconds),
                },
                { key: 'last_synced_at', header: 'آخر مزامنة', render: (row) => formatDate(row.last_synced_at) },
                {
                  key: 'accuracy_level',
                  header: 'الدقة/المصدر',
                  render: (row) => <AccuracyBadge status={row.accuracy_level ?? row.data_source ?? 'unavailable'} />,
                },
              ]}
            />
            <AdminPagination
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
