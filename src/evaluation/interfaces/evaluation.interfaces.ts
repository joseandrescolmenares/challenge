import { LLMEvaluationResponse } from '../schema/llm-evaluation.schema';

export interface ModelInfo {
  name: string;
  modelName: string;
  provider: string;
  description: string;
}

export interface EvaluationResult {
  query: string;
  results: Array<{
    modelName: string;
    modelInfo: ModelInfo;
    response: string;
    evaluation: LLMEvaluationResponse;
  }>;
  timestamp: string;
}

export interface LLMResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}
