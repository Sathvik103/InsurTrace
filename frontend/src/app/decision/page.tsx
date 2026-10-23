'use client';

import React, { Suspense } from 'react';
import { AppShell } from '@/components/layout/Shell';
import { ClaimCheckFlow } from '@/components/claim-check/ClaimCheckFlow';

export default function ClaimDecisionPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="vs-shimmer mx-auto h-96 max-w-3xl rounded-[28px]" />}>
        <ClaimCheckFlow />
      </Suspense>
    </AppShell>
  );
}
