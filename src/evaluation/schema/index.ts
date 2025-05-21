import { z } from 'zod';

export const evaluationResponseSchema = z.object({
  score: z.number().describe('Score on a scale from 1 to 10'),
  reasoning: z.string().describe('Detailed explanation of the evaluation'),
  relevanceAnalysis: z
    .array(
      z.object({
        relevanceScore: z
          .number()
          .describe('Individual relevance score from 1 to 10'),
        comments: z.string().describe('Specific comments for this result'),
      }),
    )
    .describe('Relevance analysis for each individual result'),
});

export const evaluationPrompt = z.object({
  score: z.number().describe('Score on a scale from 1 to 10'),
  reasoning: z.string().describe('Detailed explanation of the evaluation'),
});

export type EvaluationResponse = z.infer<typeof evaluationResponseSchema>;
export type EvaluationPrompt = z.infer<typeof evaluationPrompt>;
