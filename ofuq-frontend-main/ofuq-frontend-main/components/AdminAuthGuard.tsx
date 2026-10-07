'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '../utils/authService';

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export default function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();

    // Check if user is not authenticated OR if user role is not admin or supervisor
    if (!user || !['admin', 'supervisor'].includes(user.role)) {
      router.replace('/auth');
      return;
    }

    setIsAuthorized(true);
    setIsLoading(false);
  }, [router]);

  // Show loading state during initial check to prevent hydration issues
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Only render children if user is authorized
  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}