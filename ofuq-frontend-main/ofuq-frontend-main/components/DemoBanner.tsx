'use client';

import { isDemoMode } from '@/utils/demoMode';

export default function DemoBanner() {
  if (!isDemoMode) return null;

  return (
    <div
      role="status"
      style={{
        margin: '0 0 16px', padding: '10px 14px', borderRadius: 8,
        background: '#fff7e6', color: '#8a5300', border: '1px solid #f3d19c',
        fontSize: 14, fontWeight: 600,
      }}
    >
      نسخة تجريبية للعرض فقط — عمليات الإضافة والتعديل والحذف غير متاحة.
    </div>
  );
}
