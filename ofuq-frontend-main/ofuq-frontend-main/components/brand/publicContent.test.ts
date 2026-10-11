import { artworkSubject, courseActionLabel, publicDescription, publicPrice } from './publicContent';
describe('public presentation integrity', () => {
  test.each(['OFOQ Sales Demo dataset', 'Seeder', 'Test data', 'Placeholder', 'Mock data', 'Development-only notes'])('removes implementation marker %s', marker => {
    const input = `محتوى تعليمي. ${marker}`;
    expect(publicDescription(input)).toBe('محتوى تعليمي.');
    expect(input).toContain(marker);
  });
  test('does not invent missing descriptions', () => expect(publicDescription(null)).toBe(''));
  test('strips HTML without inventing outcomes', () => expect(publicDescription('<p>درس بايثون</p>')).toBe('درس بايثون'));
  test('formats free prices', () => { expect(publicPrice(0)).toBe('مجاني'); expect(publicPrice(299, true)).toBe('مجاني'); });
  test('does not invent currency', () => expect(publicPrice(299)).toBe('٢٩٩'));
  test('invalid price is not advertised as free', () => expect(publicPrice('unknown')).toBe('السعر غير متاح'));
  const base = { allowed: false, authenticated: true, parentId: 0, parentEnrolled: false };
  test('anonymous action', () => expect(courseActionLabel({ ...base, authenticated: false })).toBe('سجّل الدخول للمتابعة'));
  test('accessible action', () => expect(courseActionLabel({ ...base, allowed: true })).toBe('واصل التعلم'));
  test('standalone action', () => expect(courseActionLabel(base)).toBe('التسجيل في المقرر'));
  test('parent action', () => expect(courseActionLabel({ ...base, parentId: 10 })).toBe('التسجيل في الدبلومة'));
  test('parent reconciliation', () => expect(courseActionLabel({ ...base, parentId: 10, parentEnrolled: true })).toBe('تحديث حالة الوصول'));
  test.each([['Python', 'python'], ['تحليل البيانات', 'data'], ['تصميم واجهات', 'design'], ['HTML', 'web'], ['معرفة', 'knowledge']])('subject artwork %s', (title, expected) => expect(artworkSubject(title)).toBe(expected));
});
