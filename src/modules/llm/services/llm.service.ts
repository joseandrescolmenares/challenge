import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import {
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionMessageParam,
  ChatCompletionTool,
  ChatCompletionToolChoiceOption,
} from 'openai/resources/chat/completions';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';
import { OpenAIModel } from '../enum/model.enum';
@Injectable()
export class LLMService {
  private openai: OpenAI;
  private readonly defaultModel = OpenAIModel.GPT4_1_NANO;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn(
        '⚠️ OPENAI_API_KEY no configurada. Algunas funciones podrían no estar disponibles.',
      );
    }

    this.openai = new OpenAI({
      apiKey,
    });
  }

  /**
   * Obtiene una respuesta del modelo LLM
   * @param messages Mensajes para el chat
   * @param tools Herramientas disponibles
   * @param toolChoice Opción de herramienta
   * @param schema Esquema zod para validación
   * @returns Respuesta del modelo
   */
  async getCompletion<T = any>({
    messages,
    tools,
    toolChoice,
    schema,
    model = this.defaultModel,
    maxTokens,
  }: {
    messages: ChatCompletionMessageParam[];
    tools?: ChatCompletionTool[] | null;
    toolChoice?: ChatCompletionToolChoiceOption;
    schema?: z.ZodSchema<T> | null;
    model?: OpenAIModel;
    maxTokens?: number | null;
  }) {
    const params: ChatCompletionCreateParamsNonStreaming = {
      model: model || this.defaultModel,
      messages,
      temperature: 0.1,
      max_tokens: maxTokens || 1000,
      store: true,
    };

    if (tools && tools.length > 0) {
      params.tools = tools;
      params.tool_choice = toolChoice;
    }

    try {
      if (schema) {
        try {
          const parsed = await this.openai.beta.chat.completions.parse({
            model: model || this.defaultModel,
            messages,
            ...(maxTokens ? { max_tokens: maxTokens } : {}),
            response_format: zodResponseFormat(schema, 'response'),
            store: true,
          });

          if (parsed.choices[0].finish_reason === 'length') {
            throw new Error(
              'Respuesta incompleta debido a la limitación de tokens',
            );
          }

          const response = parsed.choices[0].message;

          if (response.refusal) {
            return response.refusal as T;
          } else if (response.parsed) {
            return response.parsed as T;
          } else {
            throw new Error('No se recibió contenido en la respuesta');
          }
        } catch (error) {
          console.error('Error al analizar respuesta de OpenAI:', error);
          throw new Error('Error al procesar la respuesta estructurada');
        }
      } else {
        const response = await this.openai.chat.completions.create(params);
        return response;
      }
    } catch (error) {
      console.error('Error en la llamada a OpenAI:', error);
      throw error;
    }
  }
}
