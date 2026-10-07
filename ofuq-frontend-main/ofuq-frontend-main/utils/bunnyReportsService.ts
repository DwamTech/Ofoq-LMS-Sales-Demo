import apiClient from './apiClient';
import type {
  BunnyPaginatedData,
  BunnyReportFilters,
  BunnyReportsOverviewData,
  BunnyReportsOverviewResponse,
  BunnySyncLogFilters,
  BunnySyncLogRow,
  BunnySyncLogsResponse,
  BunnySyncRunData,
  BunnySyncRunRequest,
  BunnySyncRunResponse,
  BunnyVideoFilters,
  BunnyVideoRow,
  BunnyVideosReportResponse,
} from '@/types/bunnyReports';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const buildParams = (filters?: BunnyReportFilters) => ({
  ...(filters?.from ? { from: filters.from } : {}),
  ...(filters?.to ? { to: filters.to } : {}),
  ...(filters?.limit ? { limit: filters.limit } : {}),
});

const buildVideoParams = (filters?: BunnyVideoFilters) => ({
  ...(filters?.from ? { from: filters.from } : {}),
  ...(filters?.to ? { to: filters.to } : {}),
  ...(filters?.search ? { search: filters.search } : {}),
  ...(filters?.status ? { sync_status: filters.status } : {}),
  ...(filters?.page ? { page: filters.page } : {}),
  ...(filters?.per_page ? { per_page: filters.per_page } : {}),
});

const buildSyncLogParams = (filters?: BunnySyncLogFilters) => ({
  ...(filters?.sync_type ? { sync_type: filters.sync_type } : {}),
  ...(filters?.status ? { status: filters.status } : {}),
  ...(filters?.page ? { page: filters.page } : {}),
  ...(filters?.per_page ? { per_page: filters.per_page } : {}),
});

const unwrapData = <T extends Record<string, unknown>>(payload: unknown): T => {
  if (isRecord(payload) && isRecord(payload.data)) {
    return payload.data as T;
  }

  return isRecord(payload) ? (payload as T) : ({} as T);
};

const serviceError = (error: unknown, fallback: string): never => {
  const message =
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
      ? (error as { response: { data: { message: string } } }).response.data.message
      : fallback;
  throw new Error(message);
};

export async function getBunnyReportsOverview(
  filters?: BunnyReportFilters
): Promise<BunnyReportsOverviewData> {
  try {
    const response = await apiClient.get<BunnyReportsOverviewResponse | BunnyReportsOverviewData>(
      '/admin/bunny/reports/overview',
      { params: buildParams(filters), cacheTTL: 30 }
    );

    return unwrapData<BunnyReportsOverviewData>(response.data);
  } catch (error: unknown) {
    throw error;
  }
}

export async function getBunnyVideosReport(
  filters?: BunnyVideoFilters
): Promise<BunnyPaginatedData<BunnyVideoRow>> {
  try {
    const response = await apiClient.get<BunnyVideosReportResponse | BunnyPaginatedData<BunnyVideoRow>>(
      '/admin/bunny/reports/videos',
      { params: buildVideoParams(filters), cacheTTL: 30 }
    );

    return unwrapData<BunnyPaginatedData<BunnyVideoRow>>(response.data);
  } catch (error: unknown) {
    return serviceError(error, 'فشل تحميل تقرير فيديوهات Bunny');
  }
}

export async function getBunnySyncLogs(
  filters?: BunnySyncLogFilters
): Promise<BunnyPaginatedData<BunnySyncLogRow>> {
  try {
    const response = await apiClient.get<BunnySyncLogsResponse | BunnyPaginatedData<BunnySyncLogRow>>(
      '/admin/bunny/sync-logs',
      { params: buildSyncLogParams(filters), cacheTTL: 15 }
    );

    return unwrapData<BunnyPaginatedData<BunnySyncLogRow>>(response.data);
  } catch (error: unknown) {
    return serviceError(error, 'فشل تحميل سجلات مزامنة Bunny');
  }
}

export async function runBunnySync(payload: BunnySyncRunRequest): Promise<BunnySyncRunData> {
  const limit = Number(payload.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new Error('يجب أن يكون الحد بين 1 و 100');
  }

  try {
    const response = await apiClient.post<BunnySyncRunResponse | BunnySyncRunData>(
      '/admin/bunny/sync/run',
      {
        sync_type: payload.sync_type,
        dry_run: payload.dry_run,
        limit,
      }
    );

    return unwrapData<BunnySyncRunData>(response.data);
  } catch (error: unknown) {
    return serviceError(error, 'فشل تشغيل مزامنة Bunny');
  }
}
