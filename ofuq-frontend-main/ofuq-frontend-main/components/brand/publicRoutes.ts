/** Explicit scope: authentication, learning player, and dashboards retain their UI. */
export function isBrandedPublicRoute(path: string) {
  return path === '/' || /^\/(experience|about|courses|diploms|diplomas|course-details|community|search|verify-certificate|privacy|terms)(\/|$)/.test(path)
}
