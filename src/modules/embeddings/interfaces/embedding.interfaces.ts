import { AIProvider } from '../../llm/enum/roles.enum';
export interface EmbeddingModel {
  name: string;
  modelName: string;
  dimensions: number;
  provider: AIProvider;
}

export interface SearchResult {
  pageContent: string;
  metadata: Record<string, unknown>;
  score?: number;
}

export interface VectorStoreResult {
  results: {
    content: string;
    metadata: Record<string, any>;
    score: number;
  }[];
  totalResults: number;
}

export interface QueryResult {
  ids: string[];
  documents: string[];
  metadatas: Record<string, unknown>[];
  embeddings?: number[][];
  urls?: string[];
}

export interface DocMetadata {
  fileName: string;
  source: string;
  [key: string]: any;
}

export interface VectorStoreDataResult {
  totalChunks: number;
  fileName: string;
  message: string;
}

export interface EvaluationResponse {
  score: number;
  reasoning: string;
  relevanceAnalysis: {
    relevanceScore: number;
    comments: string;
  }[];
}

export interface EvaluationResult {
  query: string;
  results: {
    modelName: string;
    dimensions: number;
    evaluation: EvaluationResponse;
  }[];
  timestamp: string;
}

export interface DocMetadata {
  documentType: string;
  fileName: string;
  source: string;
  loc?: {
    index?: number;
    [key: string]: any;
  };
}
export interface VectorStoreDataResult {
  success: boolean;
  data?: {
    documents: (string | null)[];
    metadatas: Record<string, any>[];
  };
  error?: string;
  details?: string;
}
