'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { orgHomeFor } from '@/components/org/OrgShell';

/** Sends each organisation to its own workspace. */
export default function OrgHome() {
  const router = useRouter();
  const { role, status, initialized } = useAuth();
  useEffect(() => {
    if (!initialized) return;
    if (status !== 'authenticated') router.replace('/login?next=%2Forg');
    else router.replace(orgHomeFor(role));
  }, [initialized, status, role, router]);
  return <div className="min-h-screen bg-navy-950" />;
}
