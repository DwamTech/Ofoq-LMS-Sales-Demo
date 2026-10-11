import { brand } from '@/lib/brand'
import type { Metadata } from 'next';
import ExperienceGateway from '@/components/experience/ExperienceGateway';
import { getPublicDiplomas } from '@/utils/categoryService';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: `${brand.name} | اختر تجربتك`, description: `استكشف تجربة الطالب والإدارة من داخل ${brand.name}.` };
export default async function ExperiencePage() {
  const programs = await getPublicDiplomas().catch(() => []);
  const primary = programs.find(program => /python|بايثون/i.test(program.name)) || programs[0];
  const enabled = process.env.DEMO_ENTRY_ENABLED === 'true' && Boolean(process.env.DEMO_ENTRY_SIGNING_KEY && process.env.DEMO_ENTRY_API_URL && process.env.DEMO_ENTRY_FRONTEND_ORIGIN);
  return <ExperienceGateway enabled={enabled} program={primary ? { name: primary.name, courses: Number(primary.courses_count || 0) } : null}/>;
}
