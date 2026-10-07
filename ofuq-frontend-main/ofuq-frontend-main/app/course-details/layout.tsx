import React from 'react';

export default function CourseDetailsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ width: '100%', minHeight: '100vh' }}>
      {children}
    </div>
  );
}