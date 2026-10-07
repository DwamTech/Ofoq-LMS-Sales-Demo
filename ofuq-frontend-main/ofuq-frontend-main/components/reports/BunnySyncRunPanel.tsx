'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import { runBunnySync } from '@/utils/bunnyReportsService';
import type { BunnySyncRunData, BunnySyncRunRequest } from '@/types/bunnyReports';
import styles from './reports.module.css';
import { isDemoMode } from '@/utils/demoMode';

const syncTypeOptions: Array<{ value: BunnySyncRunRequest['sync_type']; label: string }> = [
  { value: 'video_details', label: 'تفاصيل الفيديوهات' },
  { value: 'usage', label: 'الاستهلاك' },
  { value: 'costs', label: 'التكاليف' },
  { value: 'health_check', label: 'فحص الصحة' },
];

interface BunnySyncRunPanelProps {
  onSuccess?: () => void;
}

const resultMessage = (result: BunnySyncRunData): string => {
  const status = result.status ? `الحالة: ${result.status}` : 'تم قبول الطلب';
  const id = result.sync_log_id ? ` - سجل #${result.sync_log_id}` : '';
  return `${status}${id}`;
};

export default function BunnySyncRunPanel({ onSuccess }: BunnySyncRunPanelProps) {
  const [syncType, setSyncType] = useState<BunnySyncRunRequest['sync_type']>('video_details');
  const [limit, setLimit] = useState(10);
  const [dryRun, setDryRun] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isDemoMode) return;
    setError(null);
    setSuccess(null);

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      setError('يجب أن يكون الحد بين 1 و 100.');
      return;
    }

    const confirmation = dryRun
      ? `تشغيل تجربة مزامنة (${syncType}) بحد ${limit}؟`
      : `سيتم تشغيل مزامنة فعلية (${syncType}) بحد ${limit}. هل أنت متأكد؟`;

    if (!window.confirm(confirmation)) {
      return;
    }

    try {
      setLoading(true);
      const result = await runBunnySync({ sync_type: syncType, dry_run: dryRun, limit });
      setSuccess(result.message ?? resultMessage(result));
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تشغيل المزامنة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={styles.syncRunPanel}>
      <div className={styles.sectionHeader}>
        <h2>تشغيل مزامنة Bunny</h2>
      </div>
      <form className={styles.filters} onSubmit={handleSubmit}>
        <label>
          <span>نوع المزامنة</span>
          <select disabled={isDemoMode}
            value={syncType}
            onChange={(event) => setSyncType(event.target.value as BunnySyncRunRequest['sync_type'])}
          >
            {syncTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>الحد</span>
          <input disabled={isDemoMode}
            max={100}
            min={1}
            type="number"
            value={limit}
            onChange={(event) => setLimit(Number(event.target.value))}
          />
        </label>
        <label className={styles.checkboxLabel}>
          <input disabled={isDemoMode} checked={dryRun} type="checkbox" onChange={(event) => setDryRun(event.target.checked)} />
          <span>تجربة فقط dry run</span>
        </label>
        <button disabled={loading || isDemoMode} title={isDemoMode ? 'غير متاح في النسخة التجريبية' : undefined} type="submit">
          {loading ? 'جاري التشغيل...' : 'تشغيل'}
        </button>
      </form>
      {error ? <div className={styles.inlineError}>{error}</div> : null}
      {success ? <div className={styles.inlineSuccess}>{success}</div> : null}
    </section>
  );
}
