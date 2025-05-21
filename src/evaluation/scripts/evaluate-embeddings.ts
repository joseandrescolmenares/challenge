/**
 * Script to evaluate different embedding models
 *
 * This script can be executed independently from the NestJS server:
 * npx ts-node src/evaluation/scripts/evaluate-embeddings.ts
 */

import * as path from 'path';
import { DocumentProcessorService } from '../services/document-processor.service';

import { EvaluatorService } from '../services/evaluator.service';
import { ReportService } from '../services/report.service';
import { EvaluationResponse } from '../schema';
import { AIProvider } from '../../modules/llm/enum/roles.enum';
import { EmbeddingModel } from 'src/modules/embeddings/interfaces/embedding.interfaces';
import { EmbeddingService } from '../services/embedding.service';

const TEST_QUERIES = [
  '¿Cómo configurar mi SmartHome Hub por primera vez?',
  '¿Qué hago si mi dispositivo no se conecta?',
  '¿Cuáles son los requisitos de red para el Hub?',
  'Problemas de compatibilidad con dispositivos Z-Wave',
  '¿Cómo actualizar el firmware?',
];

export const EMBEDDING_MODELS: EmbeddingModel[] = [
  {
    name: 'OpenAI_Small',
    modelName: 'text-embedding-3-small',
    dimensions: 1536,
    provider: AIProvider.OPENAI,
  },
  {
    name: 'Cohere_Medium',
    modelName: 'embed-multilingual-v3.0',
    dimensions: 768,
    provider: AIProvider.COHERE,
  },
];

class EmbeddingDimensionEvaluator {
  private documentProcessor: DocumentProcessorService;
  private embeddingService: EmbeddingService;
  private evaluatorService: EvaluatorService;
  private reportService: ReportService;
  private apiKeys: Record<string, string> = {};

  constructor() {
    this.apiKeys = {
      openai: process.env.OPENAI_API_KEY || '',
      cohere: process.env.COHERE_API_KEY || '',
    };

    if (!this.apiKeys.openai) {
      throw new Error(
        'OpenAI API key not found. Configure OPENAI_API_KEY in the .env file',
      );
    }

    this.documentProcessor = new DocumentProcessorService(500, 100);
    this.embeddingService = new EmbeddingService();
    this.evaluatorService = new EvaluatorService();
    this.reportService = new ReportService(EMBEDDING_MODELS);
  }

  async initialize(): Promise<void> {
    console.log('Initializing embedding models...');

    for (const model of EMBEDDING_MODELS) {
      try {
        await this.embeddingService.initializeModel(model, this.apiKeys);
      } catch (error) {
        console.error(`❌ Error initializing model ${model.name}:`, error);
      }
    }

    console.log('Initialization completed.');
  }

  async loadDocuments(): Promise<void> {
    console.log('Loading test documents into all models...');
    const docsPath = path.join(process.cwd(), 'data', 'docs');
    const documents = this.documentProcessor.loadDocumentsFromFolder(docsPath);
    for (const { file, content, documentType } of documents) {
      console.log(`Processing document: ${documentType}`);
      const metadata = { source: file, documentType };
      const chunks = await this.documentProcessor.splitDocumentIntoChunks(
        content,
        metadata,
      );

      for (const model of EMBEDDING_MODELS) {
        try {
          console.log(
            `Loading ${chunks.length} chunks into model ${model.name}...`,
          );

          const ids = chunks.map(
            (_, i) => `${documentType}-${i}-${Date.now()}`,
          );

          await this.embeddingService.addDocuments(model.name, chunks, { ids });
          console.log(`✅ Document ${file} loaded into model ${model.name}`);
        } catch (error) {
          console.error(
            `❌ Error loading document ${file} into model ${model.name}:`,
            error,
          );
        }
      }
    }

    console.log('Document loading completed.');
  }

  async runEvaluation(): Promise<void> {
    console.log('Starting evaluation with test queries...');

    for (const query of TEST_QUERIES) {
      console.log(`\nEvaluating query: "${query}"`);

      const queryResults: {
        query: string;
        results: Array<{
          modelName: string;
          dimensions: number;
          evaluation: EvaluationResponse;
        }>;
        timestamp: string;
      } = {
        query,
        results: [],
        timestamp: new Date().toISOString(),
      };

      for (const model of EMBEDDING_MODELS) {
        try {
          console.log(`Querying model ${model.name}...`);

          const searchResults = await this.embeddingService.similaritySearch(
            model.name,
            query,
            3,
          );

          const evaluation = await this.evaluatorService.evaluateSearchResults(
            query,
            searchResults,
            model,
          );

          queryResults.results.push({
            modelName: model.name,
            dimensions: model.dimensions,
            evaluation,
          });
        } catch (error) {
          console.error(`❌ Error evaluating model ${model.name}:`, error);
        }
      }

      this.reportService.addResult(queryResults);
    }

    console.log('\nEvaluation completed.');
  }

  saveResults(): void {
    this.reportService.saveResults();
    console.log('Evaluation process completed successfully');
  }
}

async function runEvaluationProcess(): Promise<void> {
  console.log('Starting embedding dimensions evaluation process');

  try {
    const evaluator = new EmbeddingDimensionEvaluator();
    await evaluator.initialize();
    await evaluator.loadDocuments();
    await evaluator.runEvaluation();
    evaluator.saveResults();
  } catch (error) {
    console.error('Error in evaluation process:', error);
  }
}

if (require.main === module) {
  import('dotenv')
    .then((dotenv) => {
      dotenv.config();
      runEvaluationProcess().catch(console.error);
    })
    .catch((err) => {
      console.error('Error loading dotenv:', err);
    });
}

export { EmbeddingDimensionEvaluator, runEvaluationProcess };
