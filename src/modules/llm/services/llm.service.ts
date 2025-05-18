import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import {
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionMessageParam,
  ChatCompletionTool,
  ChatCompletionToolChoiceOption,
} from 'openai/resources/chat/completions';

@Injectable()
export class LLMService {
  private openai: OpenAI;
  private readonly defaultModel = 'gpt-3.5-turbo';

  constructor() {
    this.openai = new OpenAI({
      apiKey: 'tu-api-key-aqui', // Reemplaza con tu API key o configura con variables de entorno
    });
  }

  async getCompletion(
    messages: ChatCompletionMessageParam[],
    tools: ChatCompletionTool[] | null = null,
    toolChoice: ChatCompletionToolChoiceOption = 'auto',
  ) {
    const params: ChatCompletionCreateParamsNonStreaming = {
      model: this.defaultModel,
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    };

    if (tools && tools.length > 0) {
      params.tools = tools;
      params.tool_choice = toolChoice;
    }

    try {
      console.log('Solicitando completado a OpenAI...');
      const response = await this.openai.chat.completions.create(params);
      return response;
    } catch (error) {
      console.error('Error en la llamada a OpenAI:', error);
      throw error;
    }
  }
}
