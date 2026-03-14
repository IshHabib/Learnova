'use server';
/**
 * @fileOverview A Genkit flow for generating AI-powered teaching strategy suggestions.
 *
 * - suggestTeachingStrategies - A function that provides teaching strategy suggestions based on class performance analytics.
 * - SuggestTeachingStrategiesInput - The input type for the suggestTeachingStrategies function.
 * - SuggestTeachingStrategiesOutput - The return type for the suggestTeachingStrategies function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTeachingStrategiesInputSchema = z.object({
  classPerformanceAnalytics: z
    .string()
    .describe(
      'A detailed summary of class performance analytics, including areas of weakness, common misconceptions, and overall trends.'
    ),
});
export type SuggestTeachingStrategiesInput = z.infer<
  typeof SuggestTeachingStrategiesInputSchema
>;

const SuggestTeachingStrategiesOutputSchema = z.object({
  strategies: z
    .string()
    .describe(
      'AI-powered suggestions for teaching strategies to improve learning outcomes based on the provided analytics.'
    ),
});
export type SuggestTeachingStrategiesOutput = z.infer<
  typeof SuggestTeachingStrategiesOutputSchema
>;

export async function suggestTeachingStrategies(
  input: SuggestTeachingStrategiesInput
): Promise<SuggestTeachingStrategiesOutput> {
  return suggestTeachingStrategiesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTeachingStrategiesPrompt',
  input: {schema: SuggestTeachingStrategiesInputSchema},
  output: {schema: SuggestTeachingStrategiesOutputSchema},
  prompt: `You are an expert educational strategist and veteran teacher. Your goal is to analyze class performance data and provide actionable, highly structured teaching strategies.

IMPORTANT FORMATTING RULES:
- Use clear, bold headings for each section.
- Use bullet points for specific recommendations.
- START EVERY BULLET POINT ON A NEW LINE.
- Use double line breaks between different sections to ensure the report is easy to read.
- Maintain a professional, encouraging, and data-driven tone.

Here is the class performance data:
{{{classPerformanceAnalytics}}}

Based on this data, please provide detailed teaching strategies. Focus on:
1. Executive Summary of current trends.
2. Specific interventions for identified weak areas.
3. Diverse learning strategies (Visual, Auditory, Kinesthetic).
4. Suggested peer-grouping or study-group configurations.
5. Immediate next steps for the teacher.`,
});

const suggestTeachingStrategiesFlow = ai.defineFlow(
  {
    name: 'suggestTeachingStrategiesFlow',
    inputSchema: SuggestTeachingStrategiesInputSchema,
    outputSchema: SuggestTeachingStrategiesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
