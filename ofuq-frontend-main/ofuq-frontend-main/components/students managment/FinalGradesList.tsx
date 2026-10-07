'use client';

import React from 'react';

interface CourseItem {
  id: number;
  name: string;
  finalExamScore?: number;
  progress?: number;
}

export default function FinalGradesList({ courses }: { courses: CourseItem[] }) {
  return (
    <div className="sm-grades-list">
      {courses.map((c) => (
        <div key={c.id} className="sm-grade-item">
          <span className="sm-grade-name">{c.name}</span>
          <span className="sm-grade-score">
            {typeof c.finalExamScore === 'number' ? `${c.finalExamScore}%` : 'لم يجتازه بعد'}
          </span>
        </div>
      ))}
    </div>
  );
}