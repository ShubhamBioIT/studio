'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Sample } from '@/types';
import { SamplesDataTable } from '../dashboard/SamplesDataTable';
import { getColumns } from '../dashboard/columns';
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
import { SampleForm } from '../dashboard/SampleForm';
import { useToast } from '@/hooks/use-toast';
import { Terminal } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Beaker } from 'lucide-react';

export default function SamplesClient() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingSample, setEditingSample] = useState<Sample | null>(null);

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [deletingSample, setDeletingSample] = useState<Sample | null>(null);
  
  const { toast } = useToast();

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

  const handleAddNew = () => {
    setEditingSample(null);
    setIsSheetOpen(true);
  };

  const handleEdit = (sample: Sample) => {
    setEditingSample(sample);
    setIsSheetOpen(true);
  };

  const handleDelete = (sample: Sample) => {
    setDeletingSample(sample);
    setIsAlertOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!deletingSample || !db) return;
    try {
        await deleteDoc(doc(db, 'samples', deletingSample.id));
        toast({
            title: "Sample Deleted",
            description: `Sample ${deletingSample.sample_id} has been successfully deleted.`,
        });
    } catch (error) {
        console.error("Error deleting sample:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to delete the sample.",
        });
    } finally {
        setIsAlertOpen(false);
        setDeletingSample(null);
    }
  };


  const memoizedColumns = useMemo(() => getColumns({ onEdit: handleEdit, onDelete: handleDelete }), []);

  if (loading) {
    return (
        <Skeleton className="h-96 w-full" />
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
    <>
       <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Beaker />
                Samples
            </CardTitle>
            <CardDescription>
                Browse, add, and manage all experimental samples.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <SamplesDataTable columns={memoizedColumns} data={samples} onAddNew={handleAddNew} />
        </CardContent>
       </Card>
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{editingSample ? 'Edit Sample' : 'Add a New Sample'}</SheetTitle>
            <SheetDescription>
                {editingSample ? 'Update the details of the existing sample.' : "Enter the details of the new sample. Click save when you're done."}
            </SheetDescription>
          </SheetHeader>
          <SampleForm sample={editingSample} onClose={() => setIsSheetOpen(false)} />
        </SheetContent>
      </Sheet>
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the sample
                    "{deletingSample?.sample_id}" and remove its data from our servers.
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
