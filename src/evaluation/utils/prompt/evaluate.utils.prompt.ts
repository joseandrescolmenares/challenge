import { Document as LangchainDocument } from '@langchain/core/documents';

export const evaluatePrompt = (
  modelInfo: { name: string; dimensions: number; modelName: string },
  query: string,
  results: LangchainDocument[],
) => {
  const systemPrompt = `You are an expert evaluator of semantic search systems.
Your job is to analyze the relevance of results returned for a query.
You must provide a structured and objective evaluation.`;

  const userPrompt = `
CONTEXT:
- We are evaluating a retrieval system that uses embeddings with ${modelInfo.dimensions} dimensions.
- The embedding model is: ${modelInfo.name} (${modelInfo.modelName}).
- The task is to evaluate if the returned results are relevant to the query.

USER QUERY:
"${query}"

RETURNED RESULTS (top ${results.length}):
${results.map((r, i) => `[${i + 1}] ${r.pageContent.substring(0, 300)}${r.pageContent.length > 300 ? '...' : ''}`).join('\n\n')}

EVALUATION INSTRUCTIONS:
1. Evaluate the overall relevance of the results on a scale of 1-10.
2. Provide detailed explanation of your evaluation.
3. For each individual result, evaluate its specific relevance.
4. Consider accuracy, relevance, and usefulness of the information for the user.

YOUR STRUCTURED EVALUATION:`;

  return { systemPrompt, userPrompt };
};
