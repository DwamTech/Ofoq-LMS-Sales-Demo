'use client';
import type { ReactNode } from 'react';
import SessionGuard from './SessionGuard';
export default function AdminAuthGuard({ children }: { children: ReactNode }) { return <SessionGuard admin>{children}</SessionGuard>; }
