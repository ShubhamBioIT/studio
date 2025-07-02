'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import DashboardClient from '@/components/dashboard/DashboardClient';

export default function DashboardPage() {
  return (
    <AppLayout>
      <DashboardClient />
    </AppLayout>
  );
}
