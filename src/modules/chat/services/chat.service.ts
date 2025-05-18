import { Injectable } from '@nestjs/common';
import { LLMService } from '../../llm/services/llm.service';
import { ToolsRegistryService } from '../../tools/services/tools-registry.service';
import { ToolsExecutorService } from '../../tools/services/tools-executor.service';
import { ChatCompletionMessageToolCall } from 'openai/resources/chat/completions';

@Injectable()
export class ChatService {
  // En memoria para desarrollo, en producción usar una base de datos
  private conversations: Map<string, any[]> = new Map();

  constructor(
    private readonly llmService: LLMService,
    private readonly toolsRegistryService: ToolsRegistryService,
    private readonly toolsExecutorService: ToolsExecutorService,
  ) {}

  async processMessage(conversationId: string, message: string): Promise<any> {
    // Obtener o inicializar la conversación
    const conversation = this.getConversation(conversationId);

    // Añadir mensaje del usuario
    conversation.push({ role: 'user', content: message });

    // Obtener respuesta con posibles tool calls
    const completionResponse = await this.llmService.getCompletion(
      conversation,
      this.toolsRegistryService.getAllTools(),
    );

    const assistantMessage = completionResponse.choices[0].message;

    // Procesar tool calls si existen
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      console.log(
        `Ejecutando ${assistantMessage.tool_calls.length} llamadas a funciones`,
      );

      // Añadir mensaje del asistente con tool calls
      conversation.push(assistantMessage);

      // Ejecutar cada tool call
      const toolResults = await Promise.all(
        assistantMessage.tool_calls.map(
          async (toolCall: ChatCompletionMessageToolCall) => {
            const result =
              await this.toolsExecutorService.executeToolCall(toolCall);
            return {
              tool_call_id: toolCall.id,
              role: 'tool',
              name: toolCall.function.name,
              content: JSON.stringify(result),
            };
          },
        ),
      );

      // Añadir resultados al historial
      conversation.push(...toolResults);

      // Solicitar una nueva respuesta con los resultados
      const finalResponse = await this.llmService.getCompletion(conversation);
      const finalMessage = finalResponse.choices[0].message;

      // Añadir respuesta final
      conversation.push(finalMessage);

      // Guardar la conversación actualizada
      this.saveConversation(conversationId, conversation);

      return {
        message: finalMessage.content,
        conversationId,
      };
    }

    // Si no hay tool calls, simplemente devolver la respuesta
    conversation.push(assistantMessage);
    this.saveConversation(conversationId, conversation);

    return {
      message: assistantMessage.content,
      conversationId,
    };
  }

  getConversationHistory(conversationId: string): any[] {
    return this.getConversation(conversationId);
  }

  private getConversation(conversationId: string): any[] {
    if (!this.conversations.has(conversationId)) {
      this.conversations.set(conversationId, [
        {
          role: 'system',
          content: `Eres un asistente técnico especializado en el SmartHome Hub X1000.
Tu objetivo es ayudar a los clientes a resolver sus dudas y problemas técnicos utilizando la documentación oficial.
Si no puedes encontrar la respuesta en la documentación, ayuda al cliente a crear un ticket de soporte.
Responde en un tono profesional pero amigable.
Responde siempre en español.`,
        },
      ]);
    }
    return this.conversations.get(conversationId) || [];
  }

  private saveConversation(conversationId: string, messages: any[]): void {
    this.conversations.set(conversationId, messages);
  }
}
