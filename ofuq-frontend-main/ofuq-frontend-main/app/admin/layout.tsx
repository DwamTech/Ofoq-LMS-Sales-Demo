'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import AdminAuthGuard from '@/components/AdminAuthGuard';
import UploadManager from '@/components/UploadManager';
import DemoBanner from '@/components/DemoBanner';
import DemoReadOnlyControls from '@/components/DemoReadOnlyControls';
import { UploadProvider } from '@/contexts/UploadContext';
import styles from './Admin.module.css';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  return (
    <AdminAuthGuard>
      <UploadProvider>
        <div className={styles["admin-dashboard"]}>
          <Header onToggleSidebar={toggleMobileSidebar} />
          <div className={styles["admin-content"]}>
            <Sidebar 
              isMobileOpen={isMobileSidebarOpen} 
              onClose={closeMobileSidebar}
            />
            <main className={styles["admin-main"]}>
              <DemoBanner />
              <DemoReadOnlyControls />
              {children}
            </main>
          </div>
          <UploadManager />
        </div>
      </UploadProvider>
    </AdminAuthGuard>
  );
}
