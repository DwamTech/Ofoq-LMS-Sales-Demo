'use client';
import {StudentExams} from '@/components/student/StudentExam';
import {isDemoMode} from '@/utils/demoMode';
import LegacyMyExams from './LegacyMyExams';
export default function Page(){return isDemoMode?<StudentExams/>:<LegacyMyExams/>}
