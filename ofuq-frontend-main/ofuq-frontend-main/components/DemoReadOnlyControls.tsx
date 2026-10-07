'use client';

import { useEffect } from 'react';
import { isDemoMode } from '@/utils/demoMode';

const mutationClass = /(?:save|submit|delete|danger|upload|sync|restore|publish|issue|permission|password)/i;

/**
 * Disables only controls that persist data. Navigation and controls that open
 * a form/modal remain usable so the demo can show the complete workflow.
 */
export default function DemoReadOnlyControls() {
  useEffect(() => {
    if (!isDemoMode) return;

    const apply = () => {
      document.querySelectorAll<HTMLButtonElement | HTMLInputElement>('[data-demo-mutation], button, input[type="submit"], input[type="file"]').forEach((element) => {
        if (element.hasAttribute('data-demo-allow')) return;

        const isSubmitButton = element instanceof HTMLButtonElement
          && (element.getAttribute('type') === 'submit' || (!element.hasAttribute('type') && element.form !== null));
        const isSubmitInput = element instanceof HTMLInputElement && element.type === 'submit';
        const isFileInput = element instanceof HTMLInputElement && element.type === 'file';
        const isMutationStyledControl = mutationClass.test(element.className);

        if (element.hasAttribute('data-demo-mutation') || isSubmitButton || isSubmitInput || isFileInput || isMutationStyledControl) {
          element.disabled = true;
          element.title = 'غير متاح في النسخة التجريبية';
          element.setAttribute('aria-disabled', 'true');
        }
      });
    };

    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
