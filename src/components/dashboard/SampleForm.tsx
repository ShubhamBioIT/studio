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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { SAMPLE_STATUS } from '@/lib/constants';
import type { Attachment, SampleStatus } from '@/types';
import { Progress } from '../ui/progress';

const formSchema = z.object({
  sample_id: z.string().min(1, 'Sample ID is required.'),
  project_name: z.string().min(1, 'Project name is required.'),
  description: z.string().optional(),
  status: z.enum(['pending', 'in-progress', 'completed', 'failed']),
  date_collected: z.date(),
  attachments: z.instanceof(FileList).optional(),
});

type SampleFormProps = {
  onClose: () => void;
};

export function SampleForm({ onClose }: SampleFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sample_id: '',
      project_name: '',
      description: '',
      status: 'pending',
      date_collected: new Date(),
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to add a sample.' });
        return;
    }
    setIsSubmitting(true);
    setUploadProgress(0);

    try {
        const fileAttachments: Attachment[] = [];
        if (values.attachments && values.attachments.length > 0) {
            for (let i = 0; i < values.attachments.length; i++) {
                const file = values.attachments[i];
                const storageRef = ref(storage, `samples/${values.sample_id}/${file.name}`);
                const uploadTask = uploadBytesResumable(storageRef, file);

                await new Promise<void>((resolve, reject) => {
                    uploadTask.on('state_changed',
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            setUploadProgress(progress);
                        },
                        (error) => {
                            console.error("Upload failed", error);
                            reject(error);
                        },
                        async () => {
                            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                            fileAttachments.push({
                                name: file.name,
                                url: downloadURL,
                                type: file.type,
                                size: file.size,
                            });
                            resolve();
                        }
                    );
                });
            }
        }
        setUploadProgress(100);

        await addDoc(collection(db, 'samples'), {
            ...values,
            date_collected: Timestamp.fromDate(values.date_collected),
            attachments: fileAttachments,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            collected_by: user.displayName || user.email,
            createdBy: {
                uid: user.uid,
                name: user.displayName || user.email,
            }
        });

        toast({ title: 'Success', description: 'Sample added successfully.' });
        form.reset();
        onClose();
    } catch (error) {
        console.error('Error adding document: ', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to add sample.' });
    } finally {
        setIsSubmitting(false);
        setUploadProgress(null);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
        <FormField
          control={form.control}
          name="sample_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sample ID</FormLabel>
              <FormControl><Input placeholder="e.g., SMPL-001" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="project_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Name</FormLabel>
              <FormControl><Input placeholder="e.g., Cancer-Genomics-2024" {...field} /></FormControl>
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(SAMPLE_STATUS).map(status => (
                    <SelectItem key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="date_collected"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date Collected</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
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
              <FormControl><Textarea placeholder="Brief description of the sample..." {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="attachments"
          render={({ field: { onChange, value, ...rest }}) => (
            <FormItem>
              <FormLabel>Attachments</FormLabel>
              <FormControl>
                <Input type="file" multiple onChange={(e) => onChange(e.target.files)} {...rest} />
              </FormControl>
              <FormDescription>Upload images, CSV, FASTA files, etc.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {isSubmitting && uploadProgress !== null && (
            <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{uploadProgress < 100 ? 'Uploading files...' : 'Finalizing...'}</p>
                <Progress value={uploadProgress} />
            </div>
        )}
        <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Sample'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
