import { BrandLogo } from './BrandLogo'

/** Compatibility wrapper: all consumers share the new logo implementation. */
export function BrandMark({ compact = false, theme = 'auto' }: { compact?: boolean; theme?: 'auto' | 'light' | 'dark' | 'mono' }) {
  return <BrandLogo variant={compact ? 'compact' : 'primary'} theme={theme}/>
}
