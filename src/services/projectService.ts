import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { z } from 'zod';

export const CreateProjectServiceSchema = z.object({
  name: z.string().describe('The name of the new project.'),
  description: z.string().optional().describe('A brief description of the project.'),
  omics_type: z.enum(['Genomics', 'Transcriptomics', 'Proteomics', 'Multi-omics']).describe("The omics type of the project."),
  lead: z.string().describe("The name of the project lead."),
});

export async function createProject(
  projectData: z.infer<typeof CreateProjectServiceSchema>,
  createdBy: { uid: string; name: string | null }
): Promise<string> {
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }
  const docRef = await addDoc(collection(db, 'projects'), {
    ...projectData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy,
  });
  return docRef.id;
}
