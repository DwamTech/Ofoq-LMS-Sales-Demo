import { redirect } from 'next/navigation';
export default function LegacyLogin() { redirect('/auth?tab=login'); }
