/**
 * Export data as a downloadable CSV file (UTF-8 with BOM for Arabic support in Excel).
 */
export function exportCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const BOM = '\uFEFF';
  const escape = (v: string | number) => {
    const str = String(v ?? '-');
    return str.includes(',') || str.includes('"') || str.includes('\n')
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  };

  const csv =
    BOM +
    headers.map(escape).join(',') +
    '\n' +
    rows.map(row => row.map(escape).join(',')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Trigger the browser print dialog.
 */
export function printReport(filename?: string) {
  const previousTitle = document.title;
  if (filename) document.title = filename;

  const restoreTitle = () => {
    document.title = previousTitle;
  };

  window.addEventListener('afterprint', restoreTitle, { once: true });
  window.print();
  window.setTimeout(restoreTitle, 1000);
}
