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
import type { Workflow } from '@/types';

const formSchema = z.object({
  name: z.string().min(1, 'Workflow name is required.'),
  description: z.string().optional(),
  pipeline_type: z.enum(['RNA-seq', 'Variant Calling', 'CRISPR Screening', 'Other']),
  status: z.enum(['Draft', 'Active', 'Archived']),
  protocol_link: z.string().url().optional().or(z.literal('')),
});

type WorkflowFormProps = {
  workflow?: Workflow | null;
  onClose: () => void;
};

export function WorkflowForm({ workflow, onClose }: WorkflowFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!workflow;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      pipeline_type: 'RNA-seq',
      status: 'Draft',
      protocol_link: '',
    },
  });

  useEffect(() => {
    if (isEditMode && workflow) {
      form.reset({
        name: workflow.name,
        description: workflow.description || '',
        pipeline_type: workflow.pipeline_type,
        status: workflow.status,
        protocol_link: workflow.protocol_link || '',
      });
    } else {
        form.reset({
            name: '',
            description: '',
            pipeline_type: 'RNA-seq',
            status: 'Draft',
            protocol_link: '',
        });
    }
  }, [workflow, form, isEditMode]);

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
        const workflowDocRef = doc(db, 'workflows', workflow.id);
        await updateDoc(workflowDocRef, dataToSave);
        toast({ title: 'Success', description: 'Workflow updated successfully.' });
      } else {
        await addDoc(collection(db, 'workflows'), {
          ...dataToSave,
          createdAt: serverTimestamp(),
          createdBy: {
            uid: user.uid,
            name: user.displayName || user.email,
          },
        });
        toast({ title: 'Success', description: 'Workflow created successfully.' });
      }

      form.reset();
      onClose();
    } catch (error) {
      console.error('Error saving document: ', error);
      toast({ variant: 'destructive', title: 'Error', description: `Failed to ${isEditMode ? 'update' : 'create'} workflow.` });
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
              <FormLabel>Workflow Name</FormLabel>
              <FormControl><Input placeholder="e.g., Standard RNA-seq Pipeline" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="pipeline_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pipeline Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Select pipeline type" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {['RNA-seq', 'Variant Calling', 'CRISPR Screening', 'Other'].map(type => (
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
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {['Draft', 'Active', 'Archived'].map(type => (
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
          name="protocol_link"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Protocol Link</FormLabel>
              <FormControl><Input placeholder="https://example.com/protocol.pdf" {...field} /></FormControl>
              <FormDescription>Link to a protocol document or notebook.</FormDescription>
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
              <FormControl><Textarea placeholder="Brief description of the workflow, its purpose, and key steps." {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Workflow')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
