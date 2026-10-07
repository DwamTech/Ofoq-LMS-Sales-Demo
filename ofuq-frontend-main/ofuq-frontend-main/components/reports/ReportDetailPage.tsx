'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ReportCards, { type ReportCardItem } from './ReportCards';
import ReportFilters from './ReportFilters';
import ReportPagination from './ReportPagination';
import ReportState from './ReportState';
import ReportTable, { type ReportTableColumn } from './ReportTable';
import { AccuracyBadge, CostBadge } from './Badges';
import type {
  PaginatedReportTable,
  ReportCostSummary,
  ReportDetailData,
  ReportEntityInfo,
  ReportFilters as ReportFilterValue,
  ReportPaginationMeta,
} from '@/types/reports';
import pageStyles from '@/app/admin/reports/Reports.module.css';
import styles from './reports.module.css';

type ReportRow = Record<string, unknown>;

export interface ReportTableConfig {
  title: string;
  dataKeys: string[];
  columns: ReportTableColumn<ReportRow>[];
  emptyMessage?: string;
  pageParam?: 'page' | 'lessons_page' | 'students_page' | 'courses_page';
}

interface ReportDetailPageProps {
  title: string;
  description: string;
  entityKeys: string[];
  id: string;
  loadReport: (id: string, filters?: ReportFilterValue) => Promise<ReportDetailData>;
  tables: ReportTableConfig[];
  initialFilters?: ReportFilterValue;
  statusOptions?: Array<{ value: string; label: string }>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isPaginated = (value: unknown): value is PaginatedReportTable<ReportRow> =>
  isRecord(value) &&
  (Array.isArray(value.data) ||
    Array.isArray(value.items) ||
    Array.isArray(value.rows) ||
    isRecord(value.pagination) ||
    isRecord(value.meta));

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

const formatDate = (value: unknown): string => {
  if (typeof value !== 'string' || !value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('ar-EG');
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

export const reportFormatters = {
  value: formatValue,
  seconds: formatSeconds,
  date: formatDate,
  bytes: formatBytes,
};

const findFirst = (data: ReportDetailData, keys: string[]): unknown => {
  for (const key of keys) {
    if (data[key] !== undefined && data[key] !== null) return data[key];
  }
  return undefined;
};

const labelFor = (key: string): string => {
  const labels: Record<string, string> = {
    id: 'المعرف',
    name: 'الاسم',
    title: 'العنوان',
    email: 'البريد',
    course_title: 'المقرر',
    category_name: 'الدبلومة',
    diploma_name: 'الدبلومة',
    phone: 'الجوال',
    nationality: 'الجنسية',
    qualification: 'المؤهل',
    chapter_title: 'الفصل',
  };

  return labels[key] ?? key.replace(/_/g, ' ');
};

const rowsFrom = (value: unknown): ReportRow[] => {
  if (Array.isArray(value)) return value.filter(isRecord);
  if (isPaginated(value)) {
    const rows = value.data ?? value.items ?? value.rows ?? [];
    return rows.filter(isRecord);
  }
  return [];
};

const paginationFrom = (value: unknown): ReportPaginationMeta | null => {
  if (!isPaginated(value)) return null;
  if (isRecord(value.pagination)) return value.pagination;
  if (isRecord(value.meta)) return value.meta;
  return {
    current_page: value.current_page,
    last_page: value.last_page,
    per_page: value.per_page,
    total: value.total,
  };
};

const extractEntity = (data: ReportDetailData | null, keys: string[]): ReportEntityInfo | null => {
  if (!data) return null;
  for (const key of keys) {
    const value = data[key];
    if (isRecord(value)) return value as ReportEntityInfo;
  }
  if (isRecord(data.entity)) return data.entity;
  return null;
};

const costValue = (cost?: ReportCostSummary): string => {
  if (!cost) return '-';
  const amount = typeof cost.amount === 'number' ? cost.amount.toLocaleString('ar-EG') : null;
  const currency = typeof cost.currency === 'string' ? cost.currency : '';
  return amount ? `${amount} ${currency}`.trim() : 'غير متاح';
};

const formatMetricValue = (key: string, value: unknown): string | number => {
  if (key.includes('seconds')) return formatSeconds(value);
  if (key.includes('bytes')) return formatBytes(value);
  if (key.includes('percentage') || key.includes('rate')) {
    return typeof value === 'number' ? `${value.toLocaleString('ar-EG')}%` : formatValue(value);
  }
  return formatValue(value);
};

const buildCards = (data: ReportDetailData | null): ReportCardItem[] => {
  if (!data) return [];
  const cards: ReportCardItem[] = [];

  if (Array.isArray(data.cards)) {
    cards.push(
      ...data.cards.map((card, index) => ({
        key: card.key ?? `card-${index}`,
        label: card.label ?? card.title ?? `مؤشر ${index + 1}`,
        value: formatValue(card.value),
        description: card.description,
        status: card.status ?? card.accuracy ?? null,
        badgeType: card.accuracy ? ('accuracy' as const) : undefined,
      }))
    );
  }

  const addRecordCards = (record: Record<string, unknown>, prefix = '') => {
    Object.entries(record).forEach(([key, value]) => {
      if (isRecord(value)) {
        cards.push({
          key: `${prefix}${key}`,
          label: String(value.label ?? value.title ?? labelFor(key)),
          value: formatValue(value.value ?? value.amount),
          description: typeof value.description === 'string' ? value.description : null,
          status: typeof value.status === 'string' ? value.status : null,
          badgeType: typeof value.status === 'string' ? 'accuracy' : undefined,
        });
        return;
      }
      cards.push({ key: `${prefix}${key}`, label: labelFor(key), value: formatMetricValue(key, value) });
    });
  };

  if (isRecord(data.summary)) addRecordCards(data.summary);
  if (isRecord(data.activity)) addRecordCards(data.activity, 'activity-');

  const cost = data.cost_summary ?? data.estimated_cost ?? data.estimated_bunny_cost;
  if (cost) {
    cards.push({
      key: 'estimated-cost',
      label: cost.label ?? 'التكلفة التقديرية',
      value: costValue(cost),
      status: cost.status ?? cost.accuracy ?? cost.accuracy_level ?? 'unavailable',
      badgeType: 'cost',
    });
  }

  return cards;
};

const hasDetailData = (data: ReportDetailData | null, tables: ReportTableConfig[]) => {
  if (!data) return false;
  if (buildCards(data).length > 0) return true;
  return tables.some((table) => rowsFrom(findFirst(data, table.dataKeys)).length > 0);
};

export default function ReportDetailPage({
  title,
  description,
  entityKeys,
  id,
  loadReport,
  tables,
  initialFilters = { page: 1, per_page: 10 },
  statusOptions,
}: ReportDetailPageProps) {
  const [filters, setFilters] = useState<ReportFilterValue>(initialFilters);
  const [data, setData] = useState<ReportDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const report = await loadReport(id, filters);
      setData(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل التقرير');
    } finally {
      setLoading(false);
    }
  }, [filters, id, loadReport]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const entity = useMemo(() => extractEntity(data, entityKeys), [data, entityKeys]);
  const cards = useMemo(() => buildCards(data), [data]);
  const cost = data?.cost_summary ?? data?.estimated_cost ?? data?.estimated_bunny_cost;

  const handlePageChange = (page: number, pageParam: ReportTableConfig['pageParam'] = 'page') => {
    setFilters((prev) => ({ ...prev, [pageParam]: page }));
  };

  return (
    <div className={pageStyles.reportsPage}>
      <header className={pageStyles.header}>
        <div className={pageStyles.titleBlock}>
          <h1>{title}</h1>
          <p>{entity?.name ?? entity?.title ? `${entity.name ?? entity.title} - ${description}` : description}</p>
        </div>
        <Link className={styles.backLink} href="/admin/reports">
          رجوع إلى التقارير
        </Link>
      </header>

      {entity ? (
        <section className={styles.detailMeta}>
          {(
            [
              'id',
              'name',
              'title',
              'email',
              'phone',
              'nationality',
              'qualification',
              'chapter_title',
              'course_title',
              'category_name',
              'diploma_name',
            ] as const
          ).map((key) =>
            entity[key] !== undefined && entity[key] !== null && entity[key] !== '' ? (
              <div className={styles.metaItem} key={key}>
                <span className={styles.metaLabel}>{labelFor(key)}</span>
                <span className={styles.metaValue}>{formatValue(entity[key])}</span>
              </div>
            ) : null
          )}
        </section>
      ) : null}

      <ReportFilters
        value={filters}
        onApply={setFilters}
        showLimit={false}
        showPerPage
        statusOptions={statusOptions}
      />

      {loading ? <ReportState type="loading" /> : null}
      {!loading && error ? <ReportState type="error" message={error} onRetry={loadData} /> : null}
      {!loading && !error && !hasDetailData(data, tables) ? (
        <ReportState type="empty" message="لا توجد بيانات قابلة للعرض ضمن فلاتر البحث الحالية." />
      ) : null}

      {!loading && !error && hasDetailData(data, tables) ? (
        <main className={pageStyles.contentGrid}>
          <ReportCards cards={cards} />

          {cost ? (
            <div className={pageStyles.notice}>
              حالة التكلفة: <CostBadge status={cost.status ?? 'unavailable'} /> دقة البيانات:{' '}
              <AccuracyBadge status={cost.accuracy ?? cost.accuracy_level ?? cost.status ?? 'unavailable'} />
            </div>
          ) : null}

          {(data?.bunny_video_stat || data?.bunny_video_stats) &&
          isRecord(data.bunny_video_stat ?? data.bunny_video_stats) ? (
            <ReportTable
              title="ملخص Bunny للفيديو"
              rows={Object.entries(data.bunny_video_stat ?? data.bunny_video_stats ?? {}).map(([key, value]) => ({
                id: key,
                label: labelFor(key),
                value: formatMetricValue(key, value),
              }))}
              columns={[
                { key: 'label', header: 'المؤشر' },
                { key: 'value', header: 'القيمة' },
              ]}
            />
          ) : null}

          {tables.map((table) => {
            const source = data ? findFirst(data, table.dataKeys) : undefined;
            const rows = rowsFrom(source);
            const pagination = paginationFrom(source);
            return (
              <section className={pageStyles.sectionGrid} key={table.title}>
                <ReportTable
                  title={table.title}
                  rows={rows}
                  columns={table.columns}
                  emptyMessage={table.emptyMessage}
                />
                <ReportPagination
                  pagination={pagination}
                  loading={loading}
                  onPageChange={(page) => handlePageChange(page, table.pageParam)}
                />
              </section>
            );
          })}
        </main>
      ) : null}
    </div>
  );
}
