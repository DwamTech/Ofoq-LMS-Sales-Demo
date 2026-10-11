'use client';
import LegacyFinalExam from './LegacyFinalExam';
import {StudentExamShowcase} from '@/components/student/StudentExam';
import {isDemoMode} from '@/utils/demoMode';
export default function Page({params}:{params:{courseId:string}}){return isDemoMode?<StudentExamShowcase courseId={Number(params.courseId)}/>:<LegacyFinalExam/>}
