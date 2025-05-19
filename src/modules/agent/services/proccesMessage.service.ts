import { Injectable } from '@nestjs/common';
import { LLMService } from '../../llm/services/llm.service';
import { ToolsRegistryService } from '../../tools/services/tools-registry.service';
import { ToolsExecutorService } from '../../tools/services/tools-executor.service';
import {
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
} from 'openai/resources/chat/completions';
import { AIRole } from 'src/modules/llm/enum/roles.enum';

interface AssistantMessage {
  content: string | null;
  tool_calls?: Array<ChatCompletionMessageToolCall>;
}

interface CompletionResponse {
  choices: Array<{
    message: AssistantMessage;
    history: ChatCompletionMessageParam[];
  }>;
}

@Injectable()
export class ChatService {
  private conversationHistory: Map<string, ChatCompletionMessageParam[]> =
    new Map();

  constructor(
    private readonly llmService: LLMService,
    private readonly toolsRegistryService: ToolsRegistryService,
    private readonly toolsExecutorService: ToolsExecutorService,
  ) {}

  async processMessage(
    conversationId: string = '1',
    message: string,
  ): Promise<{ message: string; history: ChatCompletionMessageParam[] }> {
    const history = this.conversationHistory.get(conversationId) || [];
    if (history.length === 0) {
      history.push({
        role: AIRole.SYSTEM,
        content:
          'Eres un asistente técnico especializado en el SmartHome Hub X1000. Tu objetivo es ayudar a los clientes a resolver sus dudas y problemas técnicos utilizando la documentación oficial. Si no puedes encontrar la respuesta en la documentación, ayuda al cliente a crear un ticket de soporte. Responde en un tono profesional pero amigable. Responde siempre en español. utiliza las herramientas que te proporcione el usuario para resolver el problema.',
      });
    }

    history.push({ role: AIRole.USER, content: message });

    const response = (await this.llmService.getCompletion(
      history,
      this.toolsRegistryService.getAllTools(),
    )) as CompletionResponse;

    const assistantMessage = response.choices[0].message;

    console.log(assistantMessage, 'assistantMessage');

    history.push({
      role: 'assistant',
      content: assistantMessage.content || null,
      tool_calls: assistantMessage.tool_calls,
    });

    if (
      !assistantMessage.tool_calls ||
      assistantMessage.tool_calls.length === 0
    ) {
      history.push({
        role: 'assistant',
        content: assistantMessage.content || null,
      });

      this.conversationHistory.set(conversationId, history);

      return {
        message: assistantMessage.content || '',
        history: history,
      };
    }

    console.log(
      `Ejecutando ${assistantMessage.tool_calls.length} llamadas a funciones`,
    );

    for (const toolCall of assistantMessage.tool_calls) {
      const result = await this.toolsExecutorService.executeToolCall(toolCall);

      history.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });
    }

    const finalResponse = (await this.llmService.getCompletion(
      history,
      null,
    )) as CompletionResponse;

    const finalMessage = finalResponse.choices[0].message;
    const finalContent =
      finalMessage.content ||
      'Lo siento, no pude procesar tu consulta correctamente.';

    history.push({
      role: 'assistant',
      content: finalContent,
    });

    this.conversationHistory.set(conversationId, history);

    return {
      message: finalContent,
      history: history,
    };
  }

  clearConversationHistory(conversationId: string): void {
    this.conversationHistory.delete(conversationId);
  }

  getConversationHistory(conversationId: string): ChatCompletionMessageParam[] {
    return this.conversationHistory.get(conversationId) || [];
  }
}
