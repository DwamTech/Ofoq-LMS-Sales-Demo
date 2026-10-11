import { render, screen } from '@testing-library/react'
import { BrandLogo } from './BrandLogo'
import { BrandMark } from './BrandMark'
import { brand, publicBrandText } from '@/lib/brand'

describe('Public brand and approved raster logo', () => {
  test.each(['primary','compact','icon'] as const)('%s has the exact Arabic accessible name and no font dependency', variant => {
    const {container}=render(<BrandLogo variant={variant}/>);
    expect(screen.getByRole('img',{name:'منصتك التعليمية'})).toBeTruthy();
    expect(container.querySelector('img')?.getAttribute('src')).toBe(brand.assets.master);
    expect(container.querySelector('img')?.getAttribute('alt')).toBe('');
    expect(container.querySelector('svg')).toBeNull();
  });
  test('decorative mark does not duplicate a link name',()=>{render(<a href="/" aria-label={brand.name}><BrandLogo decorative/></a>);expect(screen.getByRole('link',{name:brand.name})).toBeTruthy();expect(screen.queryByRole('img')).toBeNull();});
  test('compatibility wrapper renders only the new logo',()=>{const {container}=render(<BrandMark compact/>);expect(container.querySelector('[data-brand-logo="compact"]')).toBeTruthy();});
  test.each(['light','dark','mono'] as const)('%s keeps the approved source and explicit theme',theme=>{const {container}=render(<BrandLogo theme={theme}/>);expect(container.querySelector('[data-brand-logo-theme]')?.getAttribute('data-brand-logo-theme')).toBe(theme);expect(container.querySelector('img')?.getAttribute('src')).toBe(brand.assets.master);});
  test('presentation alias leaves historical certificate references alone',()=>{expect(publicBrandText('Ofoq Demo Admin')).toBe('حساب عرض الإدارة');expect(publicBrandText('منصة أفق')).toContain(brand.name);expect(publicBrandText('OFOQ-C-0006')).toBe('OFOQ-C-0006');});
})
