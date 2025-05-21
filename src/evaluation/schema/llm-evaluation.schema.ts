import { z } from 'zod';

export const llmEvaluationResponseSchema = z.object({
  score: z
    .number()
    .min(0)
    .max(10)
    .describe('Overall response score from 0 to 10'),
  explanation: z
    .string()
    .describe('Evaluation explanation detailing why that score was given'),
});

export type LLMEvaluationResponse = z.infer<typeof llmEvaluationResponseSchema>;
