'use client';

import React, { ReactNode, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { LayoutDashboard, FlaskConical, Beaker, FileText, Terminal } from 'lucide-react';
import Logo from '../auth/Logo';
import { UserNav } from './UserNav';
import { Separator } from '../ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, error } = useAuth();

  useEffect(() => {
    // Only redirect if there's no loading, no user, AND no error.
    // This prevents the redirect loop when a permission error occurs.
    if (!loading && !user && !error) {
      router.push('/login');
    }
  }, [user, loading, error, router]);


  const renderContent = () => {
    if (loading || (!user && !error)) {
      return (
        <main className="flex-1 p-4 md:p-8">
          <div className="space-y-8">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </main>
      );
    }
    
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
        <main className="flex-1 p-4 md:p-8">
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
        </main>
      );
    }

    if (user) {
        return <main className="flex-1 p-4 md:p-8">{children}</main>;
    }
    
    return null; // Fallback, should be handled by useEffect redirect
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar>
            <SidebarHeader>
                <Logo />
            </SidebarHeader>
            <Separator className="my-2" />
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/'}>
                  <Link href="/">
                    <LayoutDashboard />
                    Dashboard
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith('/samples')}>
                  <Link href="/samples">
                    <Beaker />
                    Samples
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith('/workflows')}>
                  <Link href="/workflows">
                    <FlaskConical />
                    Workflows
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith('/projects')}>
                  <Link href="/projects">
                    <FileText />
                    Projects
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
            <header className="flex h-16 items-center border-b bg-background px-4 md:px-6">
                <SidebarTrigger className="md:hidden" />
                <div className="ml-auto flex items-center gap-4">
                  <UserNav />
                </div>
            </header>
            {renderContent()}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
