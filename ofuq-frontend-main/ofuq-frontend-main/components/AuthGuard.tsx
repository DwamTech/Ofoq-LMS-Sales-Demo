'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '../utils/authService';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [isMounted, setIsMounted] = React.useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Check if user is not authenticated
    if (!isAuthenticated()) {
      router.replace('/auth');
      return;
    }
  }, [router]);

  // Prevent hydration issues
  if (!isMounted) {
    return null;
  }

  // Only render children if user is authenticated
  if (!isAuthenticated()) {
    return null; // Prevent UI from flashing before redirect
  }

  return <>{children}</>;
}