'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import CourseGrid from './CourseGrid';
import type { Course as GridCourse } from './CourseGrid';
import '../styles/watch-progress.css';
import { getMyEnrolledCourses, getCourseProgressDetails } from '../utils/courseService';
import { getBackendAssetUrl } from '../utils/url';
import { isAuthenticated } from '../utils/authService';

interface WatchProgressProps {
  courses?: GridCourse[];
}

export default function WatchProgress({ courses: injected }: WatchProgressProps) {
  const [courses, setCourses] = useState<GridCourse[]>(injected || []);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (injected && injected.length > 0) return; // Use provided courses if available
      try {
        setLoading(true);
        setError(null);

        if (!isAuthenticated()) {
          setCourses([]);
          setLoading(false);
          return;
        }

        const enrolledResponse = await getMyEnrolledCourses();
        const enrolled = enrolledResponse.data;

        // Fetch progress details for all enrolled courses in parallel once
        const detailsArr = await Promise.all(
          enrolled.map((c) => getCourseProgressDetails(c.id))
        );

        // Map to grid course objects with clamped integer progress
        const withProgress: GridCourse[] = enrolled.map((c, idx) => {
          const d = detailsArr[idx];
          const progress = Math.max(0, Math.min(100, Math.round(Number(d?.overall_progress ?? 0))));
          return {
            id: Number(c.id),
            name: String(c.title ?? ''),
            progress,
            image: getBackendAssetUrl((c as any).cover_image_url ?? c.cover_image ?? ''),
            category: typeof c.category === 'string' ? c.category : (c.category?.name ?? 'عام'),
            instructor: {
              name: c.instructor?.name ?? '—',
              avatar: getBackendAssetUrl(c.instructor?.image ?? ''),
            },
          } as GridCourse;
        });

        // Determine started state using backend status or lesson progress
        const filtered = enrolled
          .map((c, idx) => {
            const details = detailsArr[idx];
            const progress = Math.max(0, Math.min(100, Math.round(Number(details?.overall_progress ?? 0))));
            const hasStarted = (details?.status === 'in_progress') || (Array.isArray(details?.lessons) && details!.lessons.some(l => l.status === 'in_progress' || l.status === 'completed'));
            const notCompleted = progress < 100;
            return { course: withProgress[idx], include: hasStarted && notCompleted };
          })
          .filter(x => x.include)
          .map(x => x.course);

        setCourses(filtered.slice(0, 3));
      } catch (err: any) {
        console.error('WatchProgress: failed to load', err);
        setError(err?.message ?? 'حدث خطأ أثناء تحميل متابعة المشاهدة');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [injected]);

  return (
    <div className="watch-progress">
      <div className="section-header">
        <h2 className="section-title">متابعة المشاهدة</h2>
        <Link href="/user/my_courses" prefetch={false} className="view-all-btn">
          عرض الكل
        </Link>
      </div>
      <div className="carousel-container">
        <div className="carousel-wrapper">
          {loading && <div className="loading-state">جاري التحميل...</div>}
          {error && !loading && <div className="error-state">{error}</div>}
          {!loading && !error && <CourseGrid courses={courses} showAll={false} />}
        </div>
      </div>
    </div>
  );
}