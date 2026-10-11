'use client';
import type { ReactNode } from 'react';
import SessionGuard from './SessionGuard';
export default function AuthGuard({ children }: { children: ReactNode }) { return <SessionGuard>{children}</SessionGuard>; }
