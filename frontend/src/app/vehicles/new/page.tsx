'use client';

import React from 'react';
import { AppShell } from '@/components/layout/Shell';
import { AddCarFlow } from '@/components/vehicle/AddCarFlow';

export default function AddCarPage() {
  return (
    <AppShell>
      <AddCarFlow />
    </AppShell>
  );
}
