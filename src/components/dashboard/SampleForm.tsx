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
import { CalendarIcon, FileIcon, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { SAMPLE_STATUS } from '@/lib/constants';
import type { Attachment, Sample } from '@/types';
import { Progress } from '../ui/progress';
import { suggestTags } from '@/ai/flows/suggestTagsFlow';
import Link from 'next/link';

const formSchema = z.object({
  sample_id: z.string().min(1, 'Sample ID is required.'),
  project_name: z.string().min(1, 'Project name is required.'),
  description: z.string().optional(),
  status: z.enum(['pending', 'in-progress', 'completed', 'failed']),
  date_collected: z.date(),
  new_attachments: (typeof window === 'undefined' ? z.any() : z.instanceof(FileList).nullable()).optional(),
  tissue_type: z.string().optional(),
  extraction_method: z.string().optional(),
  storage_condition: z.string().optional(),
  tags: z.string().optional(),
  external_db_link: z.string().url().optional().or(z.literal('')),
});

type SampleFormProps = {
  sample?: Sample | null;
  onClose: () => void;
};

export function SampleForm({ sample, onClose }: SampleFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [currentAttachments, setCurrentAttachments] = useState<Attachment[]>([]);

  const isEditMode = !!sample;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sample_id: '',
      project_name: '',
      description: '',
      status: 'pending',
      date_collected: new Date(),
      new_attachments: null,
      tissue_type: '',
      extraction_method: '',
      storage_condition: '',
      tags: '',
      external_db_link: '',
    },
  });

  useEffect(() => {
    if (isEditMode && sample) {
      form.reset({
        sample_id: sample.sample_id,
        project_name: sample.project_name,
        description: sample.description || '',
        status: sample.status,
        date_collected: sample.date_collected.toDate(),
        new_attachments: null,
        tissue_type: sample.tissue_type || '',
        extraction_method: sample.extraction_method || '',
        storage_condition: sample.storage_condition || '',
        tags: sample.tags ? sample.tags.join(', ') : '',
        external_db_link: sample.external_db_link || '',
      });
      setCurrentAttachments(sample.attachments || []);
    } else {
        form.reset({
            sample_id: '',
            project_name: '',
            description: '',
            status: 'pending',
            date_collected: new Date(),
            new_attachments: null,
            tissue_type: '',
            extraction_method: '',
            storage_condition: '',
            tags: '',
            external_db_link: '',
        });
        setCurrentAttachments([]);
    }
  }, [sample, form, isEditMode]);

  const handleDeleteAttachment = (indexToDelete: number) => {
    setCurrentAttachments(prev => prev.filter((_, index) => index !== indexToDelete));
  };
  
  async function handleSuggestTags() {
    const description = form.getValues('description');
    if (!description) {
        toast({ variant: 'destructive', title: 'Description needed', description: 'Please enter a description first to get tag suggestions.' });
        return;
    }
    setIsSuggesting(true);
    try {
        const result = await suggestTags({ description });
        if (result.tags && result.tags.length > 0) {
            const newTags = result.tags.join(', ');
            const existingTags = form.getValues('tags');
            const combinedTags = existingTags ? `${existingTags}, ${newTags}` : newTags;
            const uniqueTags = Array.from(new Set(combinedTags.split(',').map(t => t.trim()).filter(Boolean))).join(', ');
            form.setValue('tags', uniqueTags, { shouldValidate: true });
            toast({ title: 'Success', description: 'AI-suggested tags have been added.' });
        } else {
            toast({ title: 'No suggestions', description: 'The AI could not find any relevant tags.' });
        }
    } catch (error) {
        console.error("Error suggesting tags:", error);
        toast({ variant: 'destructive', title: 'AI Error', description: 'Could not suggest tags. Please try again.' });
    } finally {
        setIsSuggesting(false);
    }
  }


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !db || !storage) {
        toast({ variant: 'destructive', title: 'Error', description: 'User not logged in or Firebase not configured.' });
        return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
        // --- Handle attachment deletions ---
        if (isEditMode && sample) {
            const originalUrls = sample.attachments.map(a => a.url);
            const currentUrls = currentAttachments.map(a => a.url);
            const deletedUrls = originalUrls.filter(url => !currentUrls.includes(url));

            for (const urlToDelete of deletedUrls) {
                try {
                    const fileRef = ref(storage, urlToDelete);
                    await deleteObject(fileRef);
                } catch (error: any) {
                    // Ignore not-found errors, file might already be deleted
                    if (error.code !== 'storage/object-not-found') {
                        console.error("Error deleting file from storage:", error);
                        // Optionally notify user, but continue the process
                    }
                }
            }
        }
        
        // --- Handle new attachment uploads ---
        const newUploadedAttachments: Attachment[] = [];
        if (values.new_attachments && values.new_attachments.length > 0) {
            for (let i = 0; i < values.new_attachments.length; i++) {
                const file = values.new_attachments[i];
                const storageRef = ref(storage, `samples/${values.sample_id}/${Date.now()}_${file.name}`);
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
                            newUploadedAttachments.push({
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

        const finalAttachments = [...currentAttachments, ...newUploadedAttachments];
        const tagsArray = values.tags ? values.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];

        const dataToSave = {
            ...values,
            tags: tagsArray,
            attachments: finalAttachments,
            date_collected: Timestamp.fromDate(values.date_collected),
            updatedAt: serverTimestamp(),
        };
        
        delete (dataToSave as any).new_attachments;

        if (isEditMode) {
            const sampleDocRef = doc(db, 'samples', sample.id);
            await updateDoc(sampleDocRef, dataToSave);
            toast({ title: 'Success', description: 'Sample updated successfully.' });
        } else {
            await addDoc(collection(db, 'samples'), {
                ...dataToSave,
                createdAt: serverTimestamp(),
                collected_by: user.displayName || user.email,
                createdBy: {
                    uid: user.uid,
                    name: user.displayName || user.email,
                }
            });
            toast({ title: 'Success', description: 'Sample added successfully.' });
        }

        form.reset();
        onClose();
    } catch (error) {
        console.error('Error saving document: ', error);
        toast({ variant: 'destructive', title: 'Error', description: `Failed to ${isEditMode ? 'update' : 'add'} sample.` });
    } finally {
        setIsSubmitting(false);
        setUploadProgress(null);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4 max-h-[85vh] overflow-y-auto pr-6">
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
              <Select onValueChange={field.onChange} value={field.value}>
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
              <FormControl><Textarea placeholder="Brief description of the sample, including source, conditions, and any observations..." {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags</FormLabel>
              <div className="flex items-center gap-2">
                <FormControl>
                    <Input placeholder="e.g., RNA-seq, HeLa, CRISPR" {...field} />
                </FormControl>
                <Button type="button" variant="outline" size="icon" onClick={handleSuggestTags} disabled={isSuggesting}>
                    {isSuggesting ? <span className="animate-spin">⚙️</span> : '✨'}
                    <span className="sr-only">Suggest Tags</span>
                </Button>
              </div>
              <FormDescription>Comma-separated tags. Click ✨ to get AI suggestions based on the description.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tissue_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tissue Type</FormLabel>
              <FormControl><Input placeholder="e.g., Brain, Liver" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="extraction_method"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Extraction Method</FormLabel>
              <FormControl><Input placeholder="e.g., Trizol, Qiagen Kit" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="storage_condition"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Storage Condition</FormLabel>
              <FormControl><Input placeholder="e.g., -80°C, FFPE" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="external_db_link"
          render={({ field }) => (
            <FormItem>
              <FormLabel>External Link</FormLabel>
              <FormControl><Input placeholder="e.g., https://www.ncbi.nlm.nih.gov/biosample/..." {...field} /></FormControl>
               <FormDescription>Link to an external database like NCBI BioSample.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {isEditMode && currentAttachments.length > 0 && (
            <div className="space-y-2">
                <FormLabel>Existing Attachments</FormLabel>
                <div className="space-y-2 rounded-md border p-2">
                    {currentAttachments.map((att, index) => (
                        <div key={index} className="flex items-center justify-between text-sm p-1 rounded-md hover:bg-muted/50">
                            <Link href={att.url} target="_blank" className="flex items-center gap-2 truncate" title={att.name}>
                                <FileIcon className="h-4 w-4 shrink-0" />
                                <span className="truncate">{att.name}</span>
                            </Link>
                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleDeleteAttachment(index)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                                <span className="sr-only">Delete attachment</span>
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        <FormField
          control={form.control}
          name="new_attachments"
          render={({ field: { onChange, value, ...rest }}) => (
            <FormItem>
              <FormLabel>{isEditMode ? 'Upload New Attachments' : 'Attachments'}</FormLabel>
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
                <p className="text-sm text-muted-foreground">{uploadProgress < 100 ? `Uploading files... ${Math.round(uploadProgress)}%` : 'Finalizing...'}</p>
                <Progress value={uploadProgress} />
            </div>
        )}
        <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Add Sample')}
            </Button>
        </div>
      </form>
    </Form>
  );
}
