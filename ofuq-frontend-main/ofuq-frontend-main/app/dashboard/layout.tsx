'use client';

import React, { useState } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import ProfileHeader from '@/components/ProfileHeader';
import AuthGuard from '@/components/AuthGuard';
import '@/styles/dashboard.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <AuthGuard>
      <div className="dashboard-layout" dir="rtl">
        <DashboardSidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />
        <div className="dashboard-main">
          <ProfileHeader />
          <main className="dashboard-content">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}