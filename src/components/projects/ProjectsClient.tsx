'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Project } from '@/types';
import { getColumns } from './columns';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { Terminal } from 'lucide-react';
import { ProjectsDataTable } from './ProjectsDataTable';
import { ProjectForm } from './ProjectForm';
import { useAuth } from '@/hooks/use-auth';

export default function ProjectsClient() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!db) {
      setFetchError("The application could not connect to Firebase. Please ensure your .env.local file is set up correctly.");
      setLoading(false);
      return;
    }
    const q = query(collection(db, 'projects'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const projectsData: Project[] = [];
      querySnapshot.forEach((doc) => {
        projectsData.push({ id: doc.id, ...doc.data() } as Project);
      });
      setProjects(projectsData);
      setFetchError(null);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching projects:", error);
      setFetchError(`Failed to fetch projects. This is often due to Firestore Security Rules. Please ensure authenticated users have permission to read the 'projects' collection. Error: ${error.message}`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddNew = () => {
    setEditingProject(null);
    setIsSheetOpen(true);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setIsSheetOpen(true);
  };

  const handleDelete = (project: Project) => {
    setDeletingProject(project);
    setIsAlertOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!deletingProject || !db) return;
    try {
        await deleteDoc(doc(db, 'projects', deletingProject.id));
        toast({
            title: "Project Deleted",
            description: `Project ${deletingProject.name} has been successfully deleted.`,
        });
    } catch (error) {
        console.error("Error deleting project:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to delete the project.",
        });
    } finally {
        setIsAlertOpen(false);
        setDeletingProject(null);
    }
  };

  const memoizedColumns = useMemo(() => getColumns({ onEdit: handleEdit, onDelete: handleDelete, currentUserUid: user?.uid }), [user]);

  if (loading) {
    return <Skeleton className="h-96 w-full" />;
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
    <>
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 ease-out">
        <ProjectsDataTable columns={memoizedColumns} data={projects} onAddNew={handleAddNew} />
      </div>
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{editingProject ? 'Edit Project' : 'Create a New Project'}</SheetTitle>
            <SheetDescription>
                {editingProject ? 'Update the details of the existing project.' : "Enter the details for the new project. Click save when you're done."}
            </SheetDescription>
          </SheetHeader>
          <ProjectForm project={editingProject} onClose={() => setIsSheetOpen(false)} />
        </SheetContent>
      </Sheet>
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the project
                    "{deletingProject?.name}" and remove its data from our servers.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete}>Continue</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
