'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import DashboardClient from '@/components/dashboard/DashboardClient';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

export default function DashboardPage() {
  const { user, loading, error } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if there's no loading, no user, AND no error.
    // This prevents the redirect loop when a permission error occurs.
    if (!loading && !user && !error) {
      router.push('/login');
    }
  }, [user, loading, error, router]);

  if (error) {
    const rules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    // Allow any authenticated user to read/write samples, projects, and workflows
    match /samples/{sampleId} {
      allow read, write: if request.auth != null;
    }
    match /projects/{projectId} {
      allow read, write: if request.auth != null;
    }
    match /workflows/{workflowId} {
      allow read, write: if request.auth != null;
    }
  }
}`;

    return (
      <AppLayout>
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Application Error: {error.name}</AlertTitle>
          <AlertDescription>
            <p>The application encountered an error while loading your data: <strong>{error.message}</strong></p>
            <p className="mt-2">
              This is often caused by incorrect <strong>Firestore Security Rules</strong>. By default, your database is locked down.
            </p>
            <p className="mt-2">
              Please go to your Firebase project, navigate to <strong>Firestore Database → Rules</strong>, and paste the following rules to grant access to authenticated users:
            </p>
            <pre className="mt-2 p-2 bg-muted rounded-md text-xs whitespace-pre-wrap">
              {rules}
            </pre>
          </AlertDescription>
        </Alert>
      </AppLayout>
    );
  }

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="w-full max-w-7xl p-8 space-y-8">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <DashboardClient />
    </AppLayout>
  );
}
