export type ReportScalar = string | number | boolean | null | undefined;

export interface ReportFilters {
  from?: string;
  to?: string;
  limit?: number;
  course_id?: number | string;
  category_id?: number | string;
  diploma_id?: number | string;
  status?: string;
  page?: number;
  per_page?: number;
  lessons_page?: number;
  students_page?: number;
  courses_page?: number;
}

export interface ReportSummaryCard {
  key?: string;
  label?: string;
  title?: string;
  value?: ReportScalar;
  description?: string | null;
  status?: string | null;
  accuracy?: string | null;
}

export interface ReportCostSummary {
  amount?: number | null;
  currency?: string | null;
  status?: 'estimated' | 'estimated_partial' | 'unavailable' | 'missing_settings' | string | null;
  accuracy?: 'estimated' | 'estimated_partial' | 'unavailable' | 'missing_settings' | string | null;
  accuracy_level?: 'estimated' | 'estimated_partial' | 'unavailable' | 'missing_settings' | string | null;
  label?: string | null;
  [key: string]: unknown;
}

export interface ReportPaginationMeta {
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

export interface PaginatedReportTable<T extends Record<string, unknown>> {
  data?: T[];
  items?: T[];
  rows?: T[];
  pagination?: ReportPaginationMeta;
  meta?: ReportPaginationMeta;
  current_page?: number | null;
  currentPage?: number | null;
  last_page?: number | null;
  lastPage?: number | null;
  per_page?: number | null;
  perPage?: number | null;
  total?: number | null;
  [key: string]: unknown;
}

export interface ReportStudentRow {
  id?: number | string;
  student_id?: number | string;
  student_name?: string | null;
  name?: string | null;
  email?: string | null;
  status?: string | null;
  progress?: number | null;
  progress_percentage?: number | null;
  watch_duration_seconds?: number | null;
  total_watch_seconds?: number | null;
  last_watched_at?: string | null;
  completed_at?: string | null;
  [key: string]: unknown;
}

export interface ReportLessonRow {
  id?: number | string;
  lesson_id?: number | string;
  lesson_title?: string | null;
  title?: string | null;
  course_title?: string | null;
  status?: string | null;
  progress?: number | null;
  progress_percentage?: number | null;
  watch_duration_seconds?: number | null;
  total_watch_seconds?: number | null;
  last_watched_at?: string | null;
  completed_at?: string | null;
  [key: string]: unknown;
}

export interface ReportCourseRow {
  id?: number | string;
  course_id?: number | string;
  course_title?: string | null;
  title?: string | null;
  enrolled_count?: number | null;
  started_count?: number | null;
  completed_count?: number | null;
  average_completion?: number | null;
  watch_duration_seconds?: number | null;
  total_watch_seconds?: number | null;
  estimated_cost?: number | null;
  [key: string]: unknown;
}

export interface ReportDiplomaRow {
  id?: number | string;
  category_id?: number | string;
  diploma_id?: number | string;
  name?: string | null;
  title?: string | null;
  status?: string | null;
  progress?: number | null;
  progress_percentage?: number | null;
  enrolled_count?: number | null;
  started_count?: number | null;
  completed_count?: number | null;
  average_completion?: number | null;
  watch_duration_seconds?: number | null;
  total_watch_seconds?: number | null;
  [key: string]: unknown;
}

export interface ReportEntityInfo {
  id?: number | string;
  name?: string | null;
  title?: string | null;
  email?: string | null;
  course_title?: string | null;
  category_name?: string | null;
  diploma_name?: string | null;
  [key: string]: unknown;
}

export type ReportEntitySummary = ReportEntityInfo;
export type ReportMetricCard = ReportSummaryCard;

export interface ReportDetailData {
  entity?: ReportEntityInfo;
  student?: ReportEntityInfo;
  lesson?: ReportEntityInfo;
  course?: ReportEntityInfo;
  diploma?: ReportEntityInfo;
  category?: ReportEntityInfo;
  summary?: Record<string, ReportScalar | ReportSummaryCard | ReportCostSummary>;
  activity?: Record<string, ReportScalar | ReportSummaryCard | ReportCostSummary>;
  cards?: ReportSummaryCard[];
  cost_summary?: ReportCostSummary;
  estimated_cost?: ReportCostSummary;
  estimated_bunny_cost?: ReportCostSummary;
  bunny_video_stat?: Record<string, ReportScalar>;
  bunny_video_stats?: Record<string, ReportScalar>;
  lesson_progress?: PaginatedReportTable<ReportLessonRow> | ReportLessonRow[];
  lessons?: PaginatedReportTable<ReportLessonRow> | ReportLessonRow[];
  students?: PaginatedReportTable<ReportStudentRow> | ReportStudentRow[];
  students_table?: PaginatedReportTable<ReportStudentRow> | ReportStudentRow[];
  lessons_summary?: PaginatedReportTable<ReportLessonRow> | ReportLessonRow[];
  diplomas?: Array<Record<string, unknown>>;
  courses_summary?: PaginatedReportTable<ReportCourseRow> | ReportCourseRow[];
  courses?: PaginatedReportTable<ReportCourseRow> | ReportCourseRow[];
  most_watched_lessons?: ReportLessonRow[];
  least_watched_lessons?: ReportLessonRow[];
  top_courses?: ReportCourseRow[];
  top_lessons?: ReportLessonRow[];
  [key: string]: unknown;
}

export interface StudentReportResponse {
  success?: boolean;
  data?: ReportDetailData;
  message?: string;
}

export interface LessonReportResponse {
  success?: boolean;
  data?: ReportDetailData;
  message?: string;
}

export interface CourseReportResponse {
  success?: boolean;
  data?: ReportDetailData;
  message?: string;
}

export interface DiplomaReportResponse {
  success?: boolean;
  data?: ReportDetailData;
  message?: string;
}

export interface ReportCourseOverview {
  id?: number | string;
  course_id?: number | string;
  title?: string;
  name?: string;
  students_count?: number | null;
  completed_count?: number | null;
  completion_rate?: number | null;
  watch_seconds?: number | null;
  [key: string]: unknown;
}

export interface ReportLessonOverview {
  id?: number | string;
  lesson_id?: number | string;
  title?: string;
  name?: string;
  course_title?: string | null;
  views?: number | null;
  completed_count?: number | null;
  average_progress?: number | null;
  watch_seconds?: number | null;
  [key: string]: unknown;
}

export interface ReportActivityOverview {
  id?: number | string;
  student_name?: string | null;
  entity_name?: string | null;
  activity_type?: string | null;
  occurred_at?: string | null;
  created_at?: string | null;
  status?: string | null;
  [key: string]: unknown;
}

export interface ReportsOverviewData {
  summary?: Record<string, ReportScalar | ReportSummaryCard | ReportCostSummary>;
  cards?: ReportSummaryCard[];
  top_courses?: ReportCourseOverview[];
  top_lessons?: ReportLessonOverview[];
  recent_activity?: ReportActivityOverview[];
  bunny_cost_summary?: ReportCostSummary;
  cost_summary?: ReportCostSummary;
  [key: string]: unknown;
}

export interface ReportsOverviewResponse {
  success?: boolean;
  data?: ReportsOverviewData;
  message?: string;
}

export interface BeneficiaryReportSummary {
  total_beneficiaries: number;
  diploma_beneficiaries: number;
  course_beneficiaries: number;
  completed_any_course: number;
  completed_any_diploma: number;
  completed_any_learning_path: number;
}

export interface BeneficiaryDiplomaRow {
  diploma_id: number;
  diploma_name: string;
  beneficiaries_count: number;
  completed_count: number;
  completion_rate: number;
  [key: string]: unknown;
}

export interface BeneficiaryCourseRow {
  course_id: number;
  course_name: string;
  diploma_name: string | null;
  beneficiaries_count: number;
  completed_count: number;
  completion_rate: number;
  [key: string]: unknown;
}

export interface BeneficiaryReportData {
  generated_at: string;
  filters: {
    from: string | null;
    to: string | null;
    period_definition: string;
  };
  summary: BeneficiaryReportSummary;
  diplomas: BeneficiaryDiplomaRow[];
  courses: BeneficiaryCourseRow[];
  [key: string]: unknown;
}

export interface BeneficiaryReportResponse {
  success?: boolean;
  data?: BeneficiaryReportData;
  message?: string;
}
