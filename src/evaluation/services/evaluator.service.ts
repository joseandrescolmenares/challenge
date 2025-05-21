import { LLMService } from '../../modules/llm/services/llm.service';
import { EvaluationResponse, evaluationResponseSchema } from '../schema';
import { Document as LangchainDocument } from '@langchain/core/documents';
import { evaluatePrompt } from '../utils/prompt/evaluate.utils.prompt';
import { AIRole } from '../../modules/llm/enum/roles.enum';
import { OpenAIModel } from '../../modules/llm/enum/model.enum';
export class EvaluatorService {
  private llmService: LLMService;

  constructor() {
    this.llmService = new LLMService();
  }

  /**
   * Evaluates query results using LLM and structured schema
   * @param query Original query
   * @param results Retrieved documents
   * @param modelInfo Embedding model information
   * @returns Structured evaluation
   */
  async evaluateSearchResults(
    query: string,
    results: LangchainDocument[],
    modelInfo: { name: string; dimensions: number; modelName: string },
  ): Promise<EvaluationResponse> {
    const { systemPrompt, userPrompt } = evaluatePrompt(
      modelInfo,
      query,
      results,
    );

    try {
      const rawResponse = await this.llmService.getCompletion({
        messages: [
          { role: AIRole.SYSTEM, content: systemPrompt },
          { role: AIRole.USER, content: userPrompt },
        ],
        tools: null,
        toolChoice: 'auto',
        schema: evaluationResponseSchema,
        model: OpenAIModel.GPTO3_MINI,
      });

      let evaluation: EvaluationResponse;

      if ('parsed' in rawResponse) {
        evaluation = rawResponse.parsed as EvaluationResponse;
      } else if (
        'score' in rawResponse &&
        'reasoning' in rawResponse &&
        'relevanceAnalysis' in rawResponse
      ) {
        evaluation = rawResponse as EvaluationResponse;
      } else {
        console.warn(
          'Could not obtain a structured evaluation, using default value',
        );
        evaluation = {
          score: 5,
          reasoning: 'Could not generate a detailed evaluation.',
          relevanceAnalysis: results.map((_, i) => ({
            resultIndex: i,
            relevanceScore: 5,
            comments:
              'Default evaluation due to a problem with the structured response.',
          })),
        };
      }

      return evaluation;
    } catch (error) {
      console.error('Error evaluating with LLM:', error);
      return {
        score: 0,
        reasoning: `Evaluation error: ${error instanceof Error ? error.message : String(error)}`,
        relevanceAnalysis: results.map((_, i) => ({
          resultIndex: i,
          relevanceScore: 0,
          comments: 'Could not evaluate due to an error',
        })),
      };
    }
  }
}
