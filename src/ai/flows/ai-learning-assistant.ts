'use server';
/**
 * @fileOverview An AI chatbot learning assistant for students.
 *
 * - aiLearningAssistant - A function that handles student queries for instant explanations, doubt clarification, and questions about course content.
 * - AILearningAssistantInput - The input type for the aiLearningAssistant function.
 * - AILearningAssistantOutput - The return type for the aiLearningAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

/**
 * Defines the input schema for the AI Learning Assistant chatbot.
 * @property {string} query - The student's question or request for explanation.
 */
const AILearningAssistantInputSchema = z.object({
  query: z.string().describe('The student\'s question or request for explanation.'),
});
export type AILearningAssistantInput = z.infer<typeof AILearningAssistantInputSchema>;

/**
 * Defines the output schema for the AI Learning Assistant chatbot.
 * @property {string} response - The AI's explanation or answer to the student's query.
 */
const AILearningAssistantOutputSchema = z.object({
  response: z.string().describe('The AI\'s explanation or answer to the student\'s query.'),
});
export type AILearningAssistantOutput = z.infer<typeof AILearningAssistantOutputSchema>;

/**
 * Defines the Genkit prompt for the AI Learning Assistant.
 * Instructs the AI to act as a helpful, educational chatbot for students.
 */
const aiLearningAssistantPrompt = ai.definePrompt({
  name: 'aiLearningAssistantPrompt',
  input: {schema: AILearningAssistantInputSchema},
  output: {schema: AILearningAssistantOutputSchema},
  prompt: `You are an AI chatbot learning assistant designed to help students.
Your primary goal is to provide clear, concise, and helpful explanations, clarify doubts, and answer questions about course content.
Maintain a supportive and educational tone.
If you don't know the answer, state that you cannot provide information on that topic.

Student's query: {{{query}}}

Your response:`,
});

/**
 * Defines the Genkit flow for the AI Learning Assistant.
 * This flow takes a student's query, processes it through the defined prompt,
 * and returns the AI's response.
 */
const aiLearningAssistantFlow = ai.defineFlow(
  {
    name: 'aiLearningAssistantFlow',
    inputSchema: AILearningAssistantInputSchema,
    outputSchema: AILearningAssistantOutputSchema,
  },
  async (input) => {
    const {output} = await aiLearningAssistantPrompt(input);
    return output!;
  }
);

/**
 * Wrapper function to invoke the AI Learning Assistant flow.
 * @param {AILearningAssistantInput} input - The student's query.
 * @returns {Promise<AILearningAssistantOutput>} The AI's generated response.
 */
export async function aiLearningAssistant(
  input: AILearningAssistantInput
): Promise<AILearningAssistantOutput> {
  return aiLearningAssistantFlow(input);
}
