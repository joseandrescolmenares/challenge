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
  private readonly defaultModel = OpenAIModel.GPT4O;

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
   * Gets a response from the LLM model
   * @param messages Messages for the chat
   * @param tools Available tools
   * @param toolChoice Tool option
   * @param schema Zod schema for validation
   * @returns Model response
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
            throw new Error('Incomplete response due to token limitation');
          }

          const response = parsed.choices[0].message;

          if (response.refusal) {
            return response.refusal as T;
          } else if (response.parsed) {
            return response.parsed as T;
          } else {
            throw new Error('No content received in the response');
          }
        } catch (error) {
          console.error('Error parsing OpenAI response:', error);
          throw new Error('Error processing structured response');
        }
      } else {
        const response = await this.openai.chat.completions.create(params);
        return response;
      }
    } catch (error) {
      console.error('Error in OpenAI call:', error);
      throw error;
    }
  }
}
