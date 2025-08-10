'use server';

/**
 * @fileOverview AI-powered tag generator for notes.
 *
 * - generateNoteTags - A function that generates tags for a given note.
 * - GenerateNoteTagsInput - The input type for the generateNoteTags function.
 * - GenerateNoteTagsOutput - The return type for the generateNoteTags function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateNoteTagsInputSchema = z.object({
  noteContent: z.string().describe('The content of the note to generate tags for.'),
});
export type GenerateNoteTagsInput = z.infer<typeof GenerateNoteTagsInputSchema>;

const GenerateNoteTagsOutputSchema = z.object({
  tags: z.array(z.string()).describe('The generated tags for the note.'),
});
export type GenerateNoteTagsOutput = z.infer<typeof GenerateNoteTagsOutputSchema>;

export async function generateNoteTags(input: GenerateNoteTagsInput): Promise<GenerateNoteTagsOutput> {
  return generateNoteTagsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateNoteTagsPrompt',
  input: {schema: GenerateNoteTagsInputSchema},
  output: {schema: GenerateNoteTagsOutputSchema},
  prompt: `You are a tag generation expert. You will generate relevant tags for a given note content.

Note Content: {{{noteContent}}}

Tags:`,
});

const generateNoteTagsFlow = ai.defineFlow(
  {
    name: 'generateNoteTagsFlow',
    inputSchema: GenerateNoteTagsInputSchema,
    outputSchema: GenerateNoteTagsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
