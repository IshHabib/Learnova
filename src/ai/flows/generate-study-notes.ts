'use server';
/**
 * @fileOverview A Genkit flow that generates study notes based on a given topic or uploaded content.
 *
 * - generateStudyNotes - A function that handles the generation of study notes.
 * - GenerateStudyNotesInput - The input type for the generateStudyNotes function.
 * - GenerateStudyNotesOutput - The return type for the generateStudyNotes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateStudyNotesInputSchema = z
  .object({
    topic: z
      .string()
      .optional()
      .describe(
        'The specific topic for which to generate study notes. Either topic or contentDataUri must be provided.'
      ),
    contentDataUri: z
      .string()
      .optional()
      .describe(
        "Uploaded content (e.g., text document, image) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'. Either topic or contentDataUri must be provided."
      ),
  })
  .refine(input => input.topic || input.contentDataUri, {
    message: 'Either topic or contentDataUri must be provided.',
    path: ['topic', 'contentDataUri'],
  });

export type GenerateStudyNotesInput = z.infer<typeof GenerateStudyNotesInputSchema>;

const GenerateStudyNotesOutputSchema = z.object({
  notes: z.string().describe('The AI-generated study notes.'),
});
export type GenerateStudyNotesOutput = z.infer<typeof GenerateStudyNotesOutputSchema>;

export async function generateStudyNotes(input: GenerateStudyNotesInput): Promise<GenerateStudyNotesOutput> {
  return generateStudyNotesFlow(input);
}

const studyNotesPrompt = ai.definePrompt({
  name: 'studyNotesPrompt',
  input: {schema: GenerateStudyNotesInputSchema},
  output: {schema: GenerateStudyNotesOutputSchema},
  prompt: `You are an AI assistant specialized in creating concise and comprehensive study notes.

Generate detailed study notes based on the provided input. Focus on key concepts, important definitions, and core principles. The notes should be easy to understand and organized for effective learning.

{{#if topic}}
Topic: {{{topic}}}

Generate comprehensive study notes for the topic "{{{topic}}}".
{{/if}}

{{#if contentDataUri}}
Context Content: {{media url=contentDataUri}}

Generate comprehensive study notes based on the provided content. Extract the most important information and present it clearly.
{{/if}}

Ensure the notes are well-structured with headings and bullet points where appropriate.
`,
});

const generateStudyNotesFlow = ai.defineFlow(
  {
    name: 'generateStudyNotesFlow',
    inputSchema: GenerateStudyNotesInputSchema,
    outputSchema: GenerateStudyNotesOutputSchema,
  },
  async input => {
    const {output} = await studyNotesPrompt(input);
    if (!output) {
      throw new Error('Failed to generate study notes.');
    }
    return output;
  }
);
