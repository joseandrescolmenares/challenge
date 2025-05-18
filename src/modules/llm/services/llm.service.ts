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
  private readonly defaultModel = OpenAIModel.GPT4_1;

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
  async getCompletion<T = any>(
    messages: ChatCompletionMessageParam[],
    tools: ChatCompletionTool[] | null = null,
    toolChoice: ChatCompletionToolChoiceOption = 'auto',
    schema: z.ZodSchema<T> | null = null,
  ) {
    const params: ChatCompletionCreateParamsNonStreaming = {
      model: this.defaultModel,
      messages,
      temperature: 0.1,
      max_tokens: 1000,
    };

    if (tools && tools.length > 0) {
      params.tools = tools;
      params.tool_choice = toolChoice;
    }

    try {
      console.log('Requesting completion from OpenAI...');

      // Si se proporciona un esquema, usar el parseador de zod
      if (schema) {
        try {
          const parsed = await this.openai.beta.chat.completions.parse({
            model: this.defaultModel,
            messages,
            max_tokens: 1000,
            response_format: zodResponseFormat(schema, 'response'),
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
        // Caso estándar sin esquema
        const response = await this.openai.chat.completions.create(params);
        return response;
      }
    } catch (error) {
      console.error('Error en la llamada a OpenAI:', error);
      throw error;
    }
  }
}
