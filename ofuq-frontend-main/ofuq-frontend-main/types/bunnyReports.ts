import type { ReportFilters, ReportScalar } from './reports';

export type BunnyReportFilters = ReportFilters;

export type BunnyCostStatusValue =
  | 'estimated'
  | 'estimated_partial'
  | 'unavailable'
  | 'missing_settings'
  | string;

export interface BunnyReportPaginationMeta {
  current_page?: number | null;
  currentPage?: number | null;
  page?: number | null;
  last_page?: number | null;
  lastPage?: number | null;
  total_pages?: number | null;
  per_page?: number | null;
  perPage?: number | null;
  total?: number | null;
  from?: number | null;
  to?: number | null;
  next_page_url?: string | null;
  prev_page_url?: string | null;
  [key: string]: unknown;
}

export interface BunnyPaginatedData<T extends Record<string, unknown>> {
  data?: T[];
  items?: T[];
  rows?: T[];
  pagination?: BunnyReportPaginationMeta;
  meta?: BunnyReportPaginationMeta;
  current_page?: number | null;
  currentPage?: number | null;
  last_page?: number | null;
  lastPage?: number | null;
  per_page?: number | null;
  perPage?: number | null;
  total?: number | null;
  from?: number | null;
  to?: number | null;
  [key: string]: unknown;
}

export interface BunnyVideoStatusSummary {
  code?: number | string | null;
  label?: string | null;
  sync_status?: string | null;
  [key: string]: unknown;
}

export interface BunnyVideoLessonSummary {
  lesson_id?: number | string | null;
  lesson_title?: string | null;
  course_id?: number | string | null;
  [key: string]: unknown;
}

export interface BunnyVideoRow {
  id?: number | string;
  lesson_id?: number | string | null;
  video_guid?: string | null;
  title?: string | null;
  status?: string | BunnyVideoStatusSummary | null;
  sync_status?: string | null;
  duration_seconds?: number | null;
  storage_size_bytes?: number | null;
  views?: number | null;
  average_watch_time_seconds?: number | null;
  total_watch_time_seconds?: number | null;
  thumbnail_url?: string | null;
  last_synced_at?: string | null;
  data_source?: string | null;
  accuracy_level?: string | null;
  lesson?: BunnyVideoLessonSummary | null;
  [key: string]: unknown;
}

export interface BunnySyncLogMetadataSummary {
  keys?: string[];
  keys_count?: number | null;
  [key: string]: unknown;
}

export interface BunnySyncLogRow {
  id?: number | string;
  sync_type?: string | null;
  status?: string | null;
  dry_run?: boolean | null;
  limit?: number | null;
  processed_count?: number | null;
  succeeded_count?: number | null;
  failed_count?: number | null;
  skipped_count?: number | null;
  started_at?: string | null;
  finished_at?: string | null;
  duration_ms?: number | null;
  message?: string | null;
  error_message?: string | null;
  metadata_summary?: BunnySyncLogMetadataSummary | null;
  [key: string]: unknown;
}

export interface BunnyVideoFilters extends BunnyReportFilters {
  status?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface BunnySyncLogFilters extends BunnyReportFilters {
  sync_type?: string;
  status?: string;
  dry_run?: boolean | string;
  page?: number;
  per_page?: number;
}

export interface BunnySyncRunRequest {
  sync_type: 'video_details' | 'usage' | 'costs' | 'health_check';
  dry_run: boolean;
  limit: number;
}

export interface BunnySyncRunData {
  accepted?: boolean;
  completed?: boolean;
  sync_type?: string | null;
  dry_run?: boolean | null;
  limit?: number | null;
  sync_log_id?: number | string | null;
  status?: string | null;
  message?: string | null;
  [key: string]: unknown;
}

export interface BunnyCostStatus {
  amount?: number | null;
  currency?: string | null;
  status?: BunnyCostStatusValue | null;
  accuracy?: BunnyCostStatusValue | null;
  [key: string]: unknown;
}

export interface BunnyUsageSummary {
  storage_bytes?: number | null;
  bandwidth_bytes?: number | null;
  traffic_bytes?: number | null;
  videos_count?: number | null;
  views_count?: number | null;
  [key: string]: unknown;
}

export interface BunnySyncSummary {
  last_sync_at?: string | null;
  last_status?: string | null;
  successful_syncs?: number | null;
  failed_syncs?: number | null;
  pending_syncs?: number | null;
  [key: string]: unknown;
}

export interface BunnyReportsOverviewData {
  summary?: Record<string, ReportScalar | BunnyCostStatus | BunnyUsageSummary | BunnySyncSummary>;
  usage?: BunnyUsageSummary;
  storage?: BunnyUsageSummary;
  cost?: BunnyCostStatus;
  cost_summary?: BunnyCostStatus;
  videos_summary?: Record<string, ReportScalar>;
  sync_summary?: BunnySyncSummary;
  cards?: Array<{
    key?: string;
    label?: string;
    title?: string;
    value?: ReportScalar;
    description?: string | null;
    status?: string | null;
  }>;
  [key: string]: unknown;
}

export interface BunnyReportsOverviewResponse {
  success?: boolean;
  data?: BunnyReportsOverviewData;
  message?: string;
}

export interface BunnyVideosReportResponse {
  success?: boolean;
  data?: BunnyPaginatedData<BunnyVideoRow>;
  message?: string;
}

export interface BunnySyncLogsResponse {
  success?: boolean;
  data?: BunnyPaginatedData<BunnySyncLogRow>;
  message?: string;
}

export interface BunnySyncRunResponse {
  success?: boolean;
  data?: BunnySyncRunData;
  message?: string;
}
