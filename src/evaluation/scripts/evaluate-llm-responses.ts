/**
 * Script para evaluar diferentes modelos de LLM y su calidad de respuesta
 *
 * Este script puede ser ejecutado independientemente del servidor NestJS:
 * npx ts-node src/evaluation/scripts/evaluate-llm-responses.ts
 */

import * as path from 'path';
import * as fs from 'fs';
import { EvaluatorService } from '../services/evaluator.service';
import { OpenAIModel } from '../../modules/llm/enum/model.enum';
import { LLMService } from '../../modules/llm/services/llm.service';
import {
  LLMEvaluationResponse,
  llmEvaluationResponseSchema,
} from '../schema/llm-evaluation.schema';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { VectorStoreService } from '../../modules/embeddings/services/vector-store.service';
import { agentPrompt } from '../../modules/agent/utils/prompts/agent.prompt';
import { AIRole } from '../../modules/llm/enum/roles.enum';
import { ConfigService } from '@nestjs/config';
import {
  EvaluationResult,
  ModelInfo,
  LLMResponse,
} from '../interfaces/evaluation.interfaces';
import { QueryResult } from '../../modules/embeddings/interfaces/embedding.interfaces';
import { evaluateAnswersPrompt } from '../utils/prompt/evaluateAnswers.utils.prompt';
import { MarkdownUtils } from 'src/utils/markdown-utils';
const TEST_QUERIES = [
  '¿Cómo configurar mi SmartHome Hub por primera vez?',
  '¿Qué hago si mi dispositivo no se conecta?',
  '¿Cuáles son los requisitos de red para el Hub?',
  'Problemas de compatibilidad con dispositivos Z-Wave',
  '¿Cómo actualizar el firmware?',
];

export const LLM_MODELS = [
  {
    name: 'GPT-4o-mini',
    modelName: OpenAIModel.GPT4O_MINI,
    provider: 'OpenAI',
    description: 'Modelo más reciente de OpenAI, versión mini',
  },
  {
    name: 'GPT-4-Nano',
    modelName: OpenAIModel.GPT4_1_NANO,
    provider: 'OpenAI',
    description: 'Modelo económico de OpenAI, versión nano',
  },
];

class ReportService {
  private results: EvaluationResult[] = [];

  constructor(private models: any[] = []) {}

  addResult(result: EvaluationResult): void {
    this.results.push(result);
  }

  saveReport(reportName: string): void {
    if (this.results.length === 0) {
      console.warn('No hay resultados para guardar');
      return;
    }

    const resultsPath = path.join(
      process.cwd(),
      'src',
      'evaluation',
      'results',
    );

    if (!fs.existsSync(resultsPath)) {
      fs.mkdirSync(resultsPath, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const jsonFilePath = path.join(
      resultsPath,
      `${reportName}-${timestamp}.json`,
    );

    const report = {
      generatedAt: new Date().toISOString(),
      models: this.models,
      results: this.results,
    };

    fs.writeFileSync(jsonFilePath, JSON.stringify(report, null, 2));
    console.log(`Reporte guardado en: ${jsonFilePath}`);
  }
}

class LLMResponseEvaluator {
  private evaluatorService: EvaluatorService;
  private llmService: LLMService;
  private vectorStoreService: VectorStoreService | null = null;
  private reportService: ReportService;
  private apiKey: string;
  private configService: ConfigService;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';

    if (!this.apiKey) {
      throw new Error(
        'OpenAI API key no encontrada. Configure OPENAI_API_KEY en el archivo .env',
      );
    }

    this.evaluatorService = new EvaluatorService();
    this.llmService = new LLMService();
    this.reportService = new ReportService(LLM_MODELS);

    try {
      this.configService = new ConfigService();
      this.vectorStoreService = new VectorStoreService(this.configService);
    } catch (initError) {
      console.warn(
        'No se pudo inicializar VectorStoreService, se usará documentación simulada' +
          initError,
      );
      this.vectorStoreService = null;
    }
  }

  private async getDocumentation(query: string): Promise<any> {
    if (this.vectorStoreService) {
      try {
        const result = await this.vectorStoreService.queryDocuments(query);
        return result || '';
      } catch (queryError) {
        console.warn(
          'Error al consultar documentos, usando documentación simulada:',
          queryError,
        );
      }
    }
  }

  async generateResponse(
    query: string,
    model: ModelInfo,
    documentation: QueryResult,
  ): Promise<string> {
    console.log(`Generando respuesta con el modelo ${model.name}...`);

    try {
      const messages: ChatCompletionMessageParam[] = [
        {
          role: AIRole.SYSTEM,
          content: agentPrompt(documentation).system,
        },
        {
          role: AIRole.USER,
          content: query,
        },
      ];

      const response = (await this.llmService.getCompletion({
        messages,
      })) as LLMResponse;

      if (response?.choices?.[0]?.message?.content) {
        return response.choices[0].message.content;
      }

      return 'No se pudo generar una respuesta';
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      console.error(`Error al generar respuesta con ${model.name}:`, error);
      return `Error al generar respuesta: ${errorMessage}`;
    }
  }

  async evaluateResponse(
    query: string,
    response: string,
    model: ModelInfo,
    documentation: QueryResult,
  ): Promise<LLMEvaluationResponse> {
    console.log(`Evaluando respuesta del modelo ${model.name}...`);

    const documentationArray = documentation.metadatas.map(
      (metadata: { fileName: string }) =>
        MarkdownUtils.getDocumentByName(metadata?.fileName),
    );

    try {
      const evaluationPrompt: ChatCompletionMessageParam[] = [
        {
          role: AIRole.SYSTEM,
          content: evaluateAnswersPrompt(query, response, documentationArray)
            .system,
        },
        {
          role: AIRole.USER,
          content: evaluateAnswersPrompt(query, response).user,
        },
      ];

      const result = await this.llmService.getCompletion({
        messages: evaluationPrompt,
        schema: llmEvaluationResponseSchema,
        model: OpenAIModel.GPTO3_MINI,
      });

      const typed = result as unknown as LLMEvaluationResponse;
      return {
        score: typed.score || 0,
        explanation: typed.explanation || '',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      console.error(`Error al evaluar respuesta:`, error);
      return {
        score: 0,
        explanation: `Error en la evaluación: ${errorMessage}`,
      };
    }
  }

  async runEvaluation(): Promise<void> {
    console.log('Iniciando evaluación con consultas de prueba...');

    for (const query of TEST_QUERIES) {
      console.log(`\nEvaluando consulta: "${query}"`);

      const queryResults: EvaluationResult = {
        query,
        results: [],
        timestamp: new Date().toISOString(),
      };

      for (const model of LLM_MODELS) {
        try {
          console.log(`Evaluando modelo ${model.name}...`);

          const documentation = (await this.getDocumentation(
            query,
          )) as QueryResult;

          const response = await this.generateResponse(
            query,
            model,
            documentation,
          );

          const evaluation = await this.evaluateResponse(
            query,
            response,
            model,
            documentation,
          );

          queryResults.results.push({
            modelName: model.name,
            modelInfo: model,
            response: response,
            evaluation,
          });

          console.log(`✅ Evaluación completada para ${model.name}`);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          console.error(
            `❌ Error evaluando modelo ${model.name}:`,
            errorMessage,
          );
        }
      }

      this.reportService.addResult(queryResults);
    }

    console.log('\nEvaluación completada.');
  }

  saveResults(): void {
    this.reportService.saveReport('evaluation-response');
    console.log('Los resultados de evaluación se han guardado correctamente');
  }
}

async function runLLMEvaluationProcess(): Promise<void> {
  console.log('Iniciando proceso de evaluación de respuestas de LLM');

  try {
    const evaluator = new LLMResponseEvaluator();
    await evaluator.runEvaluation();
    evaluator.saveResults();
  } catch (error) {
    console.error('Error en el proceso de evaluación:', error);
  }
}

if (require.main === module) {
  import('dotenv')
    .then((dotenv) => {
      dotenv.config();
      runLLMEvaluationProcess().catch(console.error);
    })
    .catch((err) => {
      console.error('Error al cargar dotenv:', err);
    });
}

export { LLMResponseEvaluator, runLLMEvaluationProcess };
