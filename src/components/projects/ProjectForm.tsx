'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Project } from '@/types';

const formSchema = z.object({
  name: z.string().min(1, 'Project name is required.'),
  description: z.string().optional(),
  omics_type: z.enum(['Genomics', 'Transcriptomics', 'Proteomics', 'Multi-omics']),
  lead: z.string().min(1, 'Project lead is required.'),
});

type ProjectFormProps = {
  project?: Project | null;
  onClose: () => void;
};

export function ProjectForm({ project, onClose }: ProjectFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!project;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      omics_type: 'Genomics',
      lead: '',
    },
  });

  useEffect(() => {
    if (isEditMode && project) {
      form.reset({
        name: project.name,
        description: project.description || '',
        omics_type: project.omics_type,
        lead: project.lead,
      });
    } else {
      form.reset({
        name: '',
        description: '',
        omics_type: 'Genomics',
        lead: user?.displayName || '',
      });
    }
  }, [project, form, isEditMode, user]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !db) {
      toast({ variant: 'destructive', title: 'Error', description: 'User not logged in or Firebase not configured.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const dataToSave = {
        ...values,
        updatedAt: serverTimestamp(),
      };

      if (isEditMode) {
        const projectDocRef = doc(db, 'projects', project.id);
        await updateDoc(projectDocRef, dataToSave);
        toast({ title: 'Success', description: 'Project updated successfully.' });
      } else {
        await addDoc(collection(db, 'projects'), {
          ...dataToSave,
          createdAt: serverTimestamp(),
          createdBy: {
            uid: user.uid,
            name: user.displayName || user.email,
          },
        });
        toast({ title: 'Success', description: 'Project created successfully.' });
      }

      form.reset();
      onClose();
    } catch (error) {
      console.error('Error saving document: ', error);
      toast({ variant: 'destructive', title: 'Error', description: `Failed to ${isEditMode ? 'update' : 'create'} project.` });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4 max-h-[85vh] overflow-y-auto pr-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Name</FormLabel>
              <FormControl><Input placeholder="e.g., Human Brain Atlas" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="omics_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Omics Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Select omics type" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {['Genomics', 'Transcriptomics', 'Proteomics', 'Multi-omics'].map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="lead"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Lead</FormLabel>
              <FormControl><Input placeholder="e.g., Dr. Jane Doe" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl><Textarea placeholder="Brief description of the project goals, methods, and expected outcomes." {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Project')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
