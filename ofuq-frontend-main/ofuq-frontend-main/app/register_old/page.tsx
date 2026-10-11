import { redirect } from 'next/navigation';
export default function LegacyRegister() { redirect('/auth?tab=signup'); }
