'use client';

import { useEffect, useState } from 'react';
import { DEMO_READ_ONLY_MESSAGE, isDemoMode } from '@/utils/demoMode';

export default function DemoReadOnlyNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isDemoMode) return;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const show = () => {
      setVisible(true);
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => setVisible(false), 3500);
    };
    window.addEventListener('demo-read-only', show);
    return () => {
      window.removeEventListener('demo-read-only', show);
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  if (!visible) return null;
  return (
    <div role="alert" style={{ position: 'fixed', bottom: 24, left: 24, zIndex: 9999, padding: '12px 16px', borderRadius: 8, background: '#8a5300', color: '#fff', boxShadow: '0 4px 14px #0003' }}>
      {DEMO_READ_ONLY_MESSAGE}
    </div>
  );
}
