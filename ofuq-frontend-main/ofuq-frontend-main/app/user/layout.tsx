'use client';

import React, { useState } from 'react';
import DashboardSidebar from '../../components/DashboardSidebar';
import ProfileHeader from '../../components/ProfileHeader';
import AuthGuard from '../../components/AuthGuard';
import DemoBanner from '@/components/DemoBanner';
import DemoReadOnlyControls from '@/components/DemoReadOnlyControls';
import '../../styles/dashboard.css';

export default function UserLayout({
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
      <div className="dashboard-layout">
        <DashboardSidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />
        <div className="dashboard-main">
          <ProfileHeader />
          <main className="dashboard-content">
            <DemoBanner />
            <DemoReadOnlyControls />
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
