'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Workflow } from '@/types';
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
import { WorkflowsDataTable } from './WorkflowsDataTable';
import { WorkflowForm } from './WorkflowForm';

export default function WorkflowsClient() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [deletingWorkflow, setDeletingWorkflow] = useState<Workflow | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    if (!db) {
      setFetchError("The application could not connect to Firebase. Please ensure your .env.local file is set up correctly.");
      setLoading(false);
      return;
    }
    const q = query(collection(db, 'workflows'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const workflowsData: Workflow[] = [];
      querySnapshot.forEach((doc) => {
        workflowsData.push({ id: doc.id, ...doc.data() } as Workflow);
      });
      setWorkflows(workflowsData);
      setFetchError(null);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching workflows:", error);
      setFetchError(`Failed to fetch workflows. This is often due to Firestore Security Rules. Please ensure authenticated users have permission to read the 'workflows' collection. Error: ${error.message}`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddNew = () => {
    setEditingWorkflow(null);
    setIsSheetOpen(true);
  };

  const handleEdit = (workflow: Workflow) => {
    setEditingWorkflow(workflow);
    setIsSheetOpen(true);
  };

  const handleDelete = (workflow: Workflow) => {
    setDeletingWorkflow(workflow);
    setIsAlertOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!deletingWorkflow || !db) return;
    try {
        await deleteDoc(doc(db, 'workflows', deletingWorkflow.id));
        toast({
            title: "Workflow Deleted",
            description: `Workflow ${deletingWorkflow.name} has been successfully deleted.`,
        });
    } catch (error) {
        console.error("Error deleting workflow:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to delete the workflow.",
        });
    } finally {
        setIsAlertOpen(false);
        setDeletingWorkflow(null);
    }
  };

  const memoizedColumns = useMemo(() => getColumns({ onEdit: handleEdit, onDelete: handleDelete }), []);

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
        <WorkflowsDataTable columns={memoizedColumns} data={workflows} onAddNew={handleAddNew} />
      </div>
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{editingWorkflow ? 'Edit Workflow' : 'Create a New Workflow'}</SheetTitle>
            <SheetDescription>
                {editingWorkflow ? 'Update the details of the existing workflow.' : "Enter the details for the new workflow. Click save when you're done."}
            </SheetDescription>
          </SheetHeader>
          <WorkflowForm workflow={editingWorkflow} onClose={() => setIsSheetOpen(false)} />
        </SheetContent>
      </Sheet>
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the workflow
                    "{deletingWorkflow?.name}" and remove its data from our servers.
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
