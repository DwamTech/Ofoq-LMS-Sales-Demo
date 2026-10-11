import type { User } from './authService';
import { experienceRoutes } from '@/lib/experienceRoutes';
import { localPreviewUser } from '@/lib/localPreview';

export type DemoPersona = 'student' | 'admin';
export const clearGatewaySession = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_data');
  localStorage.removeItem('ofoq_demo_session');
};
export async function validatedStoredIdentity(_signal?: AbortSignal): Promise<User | null> {
  return localPreviewUser();
}
export async function enterDemo(persona: DemoPersona, signal: AbortSignal): Promise<string> {
  signal.throwIfAborted();
  return experienceRoutes[persona];
}
