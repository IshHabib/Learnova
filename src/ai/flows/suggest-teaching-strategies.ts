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
  prompt: `You are an expert educational strategist and teacher. Your goal is to analyze class performance data and provide actionable teaching strategies to help students improve.

Here is the class performance data:
{{{classPerformanceAnalytics}}}

Based on this data, please provide detailed teaching strategies focusing on how to address the identified weaknesses and improve overall learning outcomes. Consider diverse learning styles and engagement techniques.`,
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
