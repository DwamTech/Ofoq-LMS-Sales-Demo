'use client';

import { Suspense } from 'react';
import BackupManager from '../../../components/BackupManager';

export default function DatabaseBackupsPage() {
  return (
    <Suspense fallback={<div>جاري التحميل...</div>}>
      <BackupManager />
    </Suspense>
  );
}
