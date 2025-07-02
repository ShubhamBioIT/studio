import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { z } from 'zod';

export const CreateSampleServiceSchema = z.object({
  sample_id: z.string().describe("The unique identifier for the sample."),
  project_name: z.string().describe("The name of the project this sample belongs to."),
  description: z.string().optional().describe("A description of the sample."),
  status: z.enum(['pending', 'in-progress', 'completed', 'failed']).default('pending').describe("The status of the sample."),
});


export async function createSample(
  sampleData: z.infer<typeof CreateSampleServiceSchema>,
  createdBy: { uid: string; name: string | null },
  collected_by: string
): Promise<string> {
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }
  const docRef = await addDoc(collection(db, 'samples'), {
    ...sampleData,
    tags: [],
    attachments: [],
    date_collected: Timestamp.now(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy,
    collected_by,
  });
  return docRef.id;
}
