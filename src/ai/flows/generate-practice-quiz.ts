'use server';
/**
 * @fileOverview A Genkit flow for generating practice quizzes for students.
 *
 * - generatePracticeQuiz - A function that handles the practice quiz generation process.
 * - GeneratePracticeQuizInput - The input type for the generatePracticeQuiz function.
 * - GeneratePracticeQuizOutput - The return type for the generatePracticeQuiz function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const QuestionTypeSchema = z.enum(['multiple_choice', 'true_false', 'open_ended']);

const GeneratePracticeQuizInputSchema = z.object({
  topic: z.string().describe('The main subject or topic for the quiz.'),
  context: z
    .string()
    .optional()
    .describe('Optional study material (notes, text, etc.) to base the quiz on.'),
  numQuestions: z
    .number()
    .int()
    .min(1)
    .max(10)
    .default(5)
    .describe('The desired number of questions in the quiz (between 1 and 10).'),
  questionType: QuestionTypeSchema.default('multiple_choice').describe(
    'The preferred type of questions for the quiz.'
  ),
});
export type GeneratePracticeQuizInput = z.infer<typeof GeneratePracticeQuizInputSchema>;

const QuestionSchema = z.object({
  type: QuestionTypeSchema.describe('The type of the question.'),
  questionText: z.string().describe('The text of the question.'),
  options: z
    .array(z.string())
    .optional()
    .describe('An array of possible answer options for multiple-choice questions.'),
  correctAnswer: z.string().describe('The correct answer to the question.'),
  explanation: z.string().describe('A brief explanation of why the answer is correct.'),
});

const GeneratePracticeQuizOutputSchema = z.object({
  quizTitle: z.string().describe('The title of the generated quiz.'),
  questions: z.array(QuestionSchema).describe('An array of quiz questions.'),
});
export type GeneratePracticeQuizOutput = z.infer<typeof GeneratePracticeQuizOutputSchema>;

export async function generatePracticeQuiz(
  input: GeneratePracticeQuizInput
): Promise<GeneratePracticeQuizOutput> {
  return generatePracticeQuizFlow(input);
}

const generatePracticeQuizPrompt = ai.definePrompt({
  name: 'generatePracticeQuizPrompt',
  input: {schema: GeneratePracticeQuizInputSchema},
  output: {schema: GeneratePracticeQuizOutputSchema},
  prompt: `You are an intelligent quiz generator designed to help students self-assess their knowledge.

Generate a practice quiz on the topic of '{{{topic}}}'.

If context is provided, base the questions on the provided study material. Otherwise, use general knowledge about the topic.

Generate exactly {{{numQuestions}}} questions.
All questions should be of the type '{{{questionType}}}'.

For 'multiple_choice' questions, provide 4 distinct options.
For every question, provide a clear 'explanation' for the correct answer.

Context (if available):
{{#if context}}
{{{context}}}
{{else}}
No specific context provided.
{{/if}}

Generate the quiz in JSON format according to the output schema provided.`,
});

const generatePracticeQuizFlow = ai.defineFlow(
  {
    name: 'generatePracticeQuizFlow',
    inputSchema: GeneratePracticeQuizInputSchema,
    outputSchema: GeneratePracticeQuizOutputSchema,
  },
  async input => {
    const {output} = await generatePracticeQuizPrompt(input);
    return output!;
  }
);
