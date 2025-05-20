/**
 * Interfaces relacionadas con embeddings y almacenamiento de vectores
 */
import { AIProvider } from '../../llm/enum/roles.enum';

/**
 * Modelo de embedding
 */
export interface EmbeddingModel {
  name: string;
  modelName: string;
  dimensions: number;
  provider: AIProvider;
}

/**
 * Resultado de búsqueda (para resultados individuales)
 */
export interface SearchResult {
  pageContent: string;
  metadata: Record<string, unknown>;
  score?: number;
}

/**
 * Resultado de una operación en el almacén de vectores (para la API)
 */
export interface VectorStoreResult {
  results: {
    content: string;
    metadata: Record<string, any>;
    score: number;
  }[];
  totalResults: number;
}

/**
 * Resultado de operaciones internas en la base de vectores
 */
export interface QueryResult {
  ids: string[];
  documents: string[];
  metadatas: Record<string, unknown>[];
  embeddings?: number[][];
  urls?: string[];
}

/**
 * Metadatos de documento
 */
export interface DocMetadata {
  fileName: string;
  source: string;
  [key: string]: any;
}

/**
 * Resultado de la carga de datos en el almacén de vectores
 */
export interface VectorStoreDataResult {
  totalChunks: number;
  fileName: string;
  message: string;
}

/**
 * Respuesta de evaluación con puntuación y análisis
 */
export interface EvaluationResponse {
  score: number;
  reasoning: string;
  relevanceAnalysis: {
    relevanceScore: number;
    comments: string;
  }[];
}

/**
 * Resultado de la evaluación
 */
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
