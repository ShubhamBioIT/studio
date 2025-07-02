'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Sample } from '@/types';
import StatsCards from './StatsCards';
import StatusChart from './StatusChart';
import { SamplesDataTable } from './SamplesDataTable';
import { columns } from './columns';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

export default function DashboardClient() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) {
      setFetchError("The application could not connect to Firebase. Please ensure your .env.local file is set up correctly.");
      setLoading(false);
      return;
    }
    const q = query(collection(db, 'samples'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const samplesData: Sample[] = [];
      querySnapshot.forEach((doc) => {
        samplesData.push({ id: doc.id, ...doc.data() } as Sample);
      });
      setSamples(samplesData);
      setFetchError(null);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching samples:", error);
      setFetchError(`Failed to fetch samples. This is often due to Firestore Security Rules. Please ensure authenticated users have permission to read the 'samples' collection. Error: ${error.message}`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const memoizedColumns = useMemo(() => columns, []);

  if (loading) {
    return (
        <div className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-28 rounded-lg" />
                <Skeleton className="h-28 rounded-lg" />
                <Skeleton className="h-28 rounded-lg" />
                <Skeleton className="h-28 rounded-lg" />
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <Skeleton className="h-80 rounded-lg lg:col-span-1" />
                <div className="lg:col-span-2 space-y-4">
                    <Skeleton className="h-16 rounded-lg" />
                    <Skeleton className="h-64 rounded-lg" />
                </div>
            </div>
        </div>
    );
  }

  if (fetchError) {
    return (
      <Alert variant="destructive" className="mt-4">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Data Fetching Error</AlertTitle>
        <AlertDescription>
          {fetchError}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <StatsCards samples={samples} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
            <StatusChart samples={samples} />
        </div>
        <div className="lg:col-span-3">
          <SamplesDataTable columns={memoizedColumns} data={samples} />
        </div>
      </div>
    </div>
  );
}
