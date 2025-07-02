'use server';
/**
 * @fileOverview An AI flow to suggest tags for a lab sample based on its description.
 *
 * - suggestTags - A function that suggests tags for a sample.
 * - SuggestTagsInput - The input type for the suggestTags function.
 * - SuggestTagsOutput - The return type for the suggestTags function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const SuggestTagsInputSchema = z.object({
  description: z.string().describe('A description of the lab sample.'),
});
export type SuggestTagsInput = z.infer<typeof SuggestTagsInputSchema>;

const SuggestTagsOutputSchema = z.object({
  tags: z.array(z.string()).describe('An array of 5-7 relevant tags, such as gene names, techniques, or cell types.'),
});
export type SuggestTagsOutput = z.infer<typeof SuggestTagsOutputSchema>;

// The exported function that will be called from the UI
export async function suggestTags(input: SuggestTagsInput): Promise<SuggestTagsOutput> {
    return suggestTagsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTagsPrompt',
  input: {schema: SuggestTagsInputSchema},
  output: {schema: SuggestTagsOutputSchema},
  prompt: `You are an expert in bioinformatics and lab research. Based on the following sample description, suggest between 5 and 7 relevant tags. The tags could be gene names, scientific techniques, cell types, or study areas.

Sample Description:
"{{description}}"

Please provide your answer in the specified JSON format.`,
});

const suggestTagsFlow = ai.defineFlow(
  {
    name: 'suggestTagsFlow',
    inputSchema: SuggestTagsInputSchema,
    outputSchema: SuggestTagsOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
