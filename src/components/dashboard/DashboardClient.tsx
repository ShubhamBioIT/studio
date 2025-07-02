'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Sample, Project, Workflow } from '@/types';
import StatsCards from './StatsCards';
import StatusChart from './StatusChart';
import RecentProjects from './RecentProjects';
import RecentWorkflows from './RecentWorkflows';
import RecentSamples from './RecentSamples';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import AIAgent from './AIAgent';

export default function DashboardClient() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loadingStates, setLoadingStates] = useState({
    samples: true,
    projects: true,
    workflows: true,
  });
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loading = Object.values(loadingStates).some(Boolean);

  useEffect(() => {
    if (!db) {
      setFetchError("The application could not connect to Firebase. Please ensure your .env.local file is set up correctly.");
      setLoadingStates({ samples: false, projects: false, workflows: false });
      return;
    }

    const handleError = (key: string, error: Error) => {
        console.error(`Error fetching ${key}:`, error);
        setFetchError(`Failed to fetch ${key}. This is often due to Firestore Security Rules. Error: ${error.message}`);
        setLoadingStates(prev => ({...prev, [key]: false}));
    };

    const unsubSamples = onSnapshot(query(collection(db, 'samples'), orderBy('createdAt', 'desc')), (snapshot) => {
        setSamples(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sample)));
        setLoadingStates(prev => ({...prev, samples: false}));
    }, (error) => handleError('samples', error));

    const unsubProjects = onSnapshot(query(collection(db, 'projects'), orderBy('createdAt', 'desc')), (snapshot) => {
        setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
        setLoadingStates(prev => ({...prev, projects: false}));
    }, (error) => handleError('projects', error));
    
    const unsubWorkflows = onSnapshot(query(collection(db, 'workflows'), orderBy('createdAt', 'desc')), (snapshot) => {
        setWorkflows(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Workflow)));
        setLoadingStates(prev => ({...prev, workflows: false}));
    }, (error) => handleError('workflows', error));
    

    return () => {
      unsubSamples();
      unsubProjects();
      unsubWorkflows();
    };
  }, []);

  if (loading) {
    return (
        <div className="space-y-8">
            <div className="grid gap-4 md:grid-cols-3">
                <Skeleton className="h-28 rounded-lg" />
                <Skeleton className="h-28 rounded-lg" />
                <Skeleton className="h-28 rounded-lg" />
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="lg:col-span-1 space-y-4">
                    <Skeleton className="h-48 rounded-lg" />
                    <Skeleton className="h-48 rounded-lg" />
                </div>
                <div className="lg:col-span-2 space-y-4">
                    <Skeleton className="h-80 rounded-lg" />
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
    <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 ease-out">
      <div className="flex flex-1 flex-col gap-4 md:gap-8">
        <AIAgent />
        <StatsCards samples={samples} projects={projects} workflows={workflows} />
        
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-start">
            <div className="lg:col-span-1 space-y-4">
                <RecentProjects projects={projects.slice(0, 3)} />
                <RecentWorkflows workflows={workflows.slice(0, 3)} />
            </div>
            <div className="lg:col-span-2 space-y-4">
                <StatusChart samples={samples} />
                <RecentSamples samples={samples.slice(0, 5)} />
            </div>
        </div>
      </div>
    </div>
  );
}
