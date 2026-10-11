import { readFrontend } from './frontendStore'
import type { Diploma } from '@/utils/categoryService'
import type { Course } from '@/utils/courseService'
import type { Section } from '@/utils/sectionService'

export const useLocalCatalog = true

function programRecords(): Diploma[] {const {programs,sections,courses}=readFrontend();return programs.map(program => ({ ...program, courses_count:courses.filter(c=>c.category_id===program.id).length, section: sections.find(section => section.id === program.section_id) ?? null })) as Diploma[]}
function courseRecords(): Course[] {const {courses,sections}=readFrontend(),programs=programRecords();return courses.map(course => ({
  ...course, status: course.is_published===false?'draft':'published', lessons_count:course.chapters?.reduce((sum:number,ch:any)=>sum+(ch.lessons?.length??0),0)??0,
  section: sections.find(section => section.id === course.section_id) ?? null,
  category: { id: course.category_id, name: programs.find(program => program.id === course.category_id)?.name ?? '' },
})) as Course[]}

type Filters = { section?: string; section_id?: number; search?: string; category?: string; per_page?: number; sort?: string }
export function localPrograms(filters?: Filters): Diploma[] {
  const programs=programRecords();
  return structuredClone(programs.filter(program => (!filters?.section || program.section?.slug === filters.section) && (!filters?.section_id || program.section_id === filters.section_id) && (!filters?.search || `${program.name} ${program.description}`.includes(filters.search.trim()))))
}
export function localCourses(filters?: Filters): Course[] {
  const courses=courseRecords();
  let result = courses.filter(course => (!filters?.section || course.section?.slug === filters.section) && (!filters?.section_id || course.section_id === filters.section_id) && (!filters?.category || String(course.category_id) === filters.category) && (!filters?.search || `${course.title} ${course.description} ${course.instructor?.name}`.toLowerCase().includes(filters.search.trim().toLowerCase())))
  if (filters?.sort === 'latest') result = [...result].sort((a,b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
  return structuredClone(filters?.per_page ? result.slice(0, filters.per_page) : result)
}
export function localProgram(slug: string): (Diploma & { courses: Course[] }) | null {
  const programs=programRecords();
  const program = programs.find(item => item.slug === slug)
  return program ? { ...structuredClone(program), courses: localCourses({ category: String(program.id) }) } : null
}
export function localCourse(id: string | number): Course | null {
  const courses=courseRecords();
  const course = courses.find(item => item.id === Number(id))
  return course ? structuredClone(course) : null
}
export function localSections(): Section[] {
  const {sections:sectionData}=readFrontend(),programs=programRecords(),courses=courseRecords();
  return sectionData.map(section => ({ ...section, diplomas_count: programs.filter(program => program.section_id === section.id).length, courses_count: courses.filter(course => course.section_id === section.id).length })) as Section[]
}
