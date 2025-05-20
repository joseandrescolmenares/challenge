import { Injectable } from '@nestjs/common';
import { LLMService } from '../../llm/services/llm.service';
import { ToolsRegistryService } from '../../tools/services/tools-registry.service';
import { ToolsExecutorService } from '../../tools/services/tools-executor.service';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { AIRole } from 'src/modules/llm/enum/roles.enum';
import { VectorStoreService } from '../../embeddings/services/vector-store.service';
import { agentPrompt } from '../utils/prompts/agent.prompt';
import { ValidationsContext } from '../schema/validationsContext';
import {
  ConversationState,
  TicketAnalysisResponse,
  TicketResult,
  ValidatedTicketResponse,
  CompletionResponse,
} from '../interfaces/agent.interfaces';
import { agentValidationPrompt } from '../utils/prompts/agentValidation.prompt';

@Injectable()
export class ChatService {
  private conversationStates: Map<string, ConversationState> = new Map();
  private readonly USER_MESSAGES_TO_ANALYZE = 3;

  constructor(
    private readonly llmService: LLMService,
    private readonly toolsRegistryService: ToolsRegistryService,
    private readonly toolsExecutorService: ToolsExecutorService,
    private readonly vectorStoreService: VectorStoreService,
  ) {}

  async processMessage(
    conversationId: string = '1',
    message: string,
  ): Promise<{ message: string; history: ChatCompletionMessageParam[] }> {
    const state = this.getOrCreateConversationState(conversationId);
    const history = state.history;

    const documentation = await this.vectorStoreService.queryDocuments(message);

    if (history.length === 0) {
      history.push({
        role: AIRole.SYSTEM,
        content: agentPrompt(documentation).system,
      });
    }

    state.userMessages.push(message);

    if (
      state.userMessages.length >= this.USER_MESSAGES_TO_ANALYZE &&
      !state.ticketSuggested
    ) {
      const ticketAnalysis: TicketAnalysisResponse =
        await this.shouldSuggestTicketCreation(state.userMessages);

      if (ticketAnalysis.needsTicket && ticketAnalysis.ticketMessage) {
        state.ticketSuggested = true;

        history.push({
          role: AIRole.ASSISTANT,
          content: ticketAnalysis.ticketMessage,
        });

        this.updateConversationState(conversationId, state);

        return {
          message: ticketAnalysis.ticketMessage,
          history: history,
        };
      }
    }

    history.push({ role: AIRole.USER, content: message });

    const response = (await this.llmService.getCompletion(
      history,
      this.toolsRegistryService.getAllTools(),
    )) as CompletionResponse;

    const assistantMessage = response.choices[0].message;

    if (
      !assistantMessage.tool_calls ||
      assistantMessage.tool_calls.length === 0
    ) {
      history.push({
        role: AIRole.ASSISTANT,
        content: assistantMessage.content || null,
      });

      this.updateConversationState(conversationId, state);

      return {
        message: assistantMessage.content || '',
        history: history,
      };
    } else {
      history.push({
        role: AIRole.ASSISTANT,
        content: assistantMessage.content || null,
        tool_calls: assistantMessage.tool_calls,
      });
    }

    console.log(
      `Ejecutando ${assistantMessage.tool_calls.length} llamadas a funciones`,
    );

    for (const toolCall of assistantMessage.tool_calls) {
      const result = this.toolsExecutorService.executeToolCall(toolCall);

      history.push({
        role: AIRole.TOOL,
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
      role: AIRole.ASSISTANT,
      content: finalContent,
    });

    this.updateConversationState(conversationId, state);

    return {
      message: finalContent,
      history: history,
    };
  }

  private getOrCreateConversationState(
    conversationId: string,
  ): ConversationState {
    if (!this.conversationStates.has(conversationId)) {
      this.conversationStates.set(conversationId, {
        history: [],
        userMessages: [],
        attemptCount: 0,
        ticketSuggested: false,
      });
    }
    return this.conversationStates.get(conversationId)!;
  }

  private updateConversationState(
    conversationId: string,
    state: ConversationState,
  ): void {
    this.conversationStates.set(conversationId, state);
  }

  private async shouldSuggestTicketCreation(
    messages: string[],
  ): Promise<TicketAnalysisResponse> {
    const lastMessages = messages.slice(-this.USER_MESSAGES_TO_ANALYZE);

    const messagesFormatted = lastMessages
      .map((msg, i) => `Mensaje ${i + 1}: "${msg}"`)
      .join('\n');

    const promptMessages: ChatCompletionMessageParam[] = [
      {
        role: AIRole.SYSTEM,
        content: agentValidationPrompt(messages).system,
      },
      {
        role: AIRole.USER,
        content: agentValidationPrompt(
          messages,
          this.USER_MESSAGES_TO_ANALYZE,
          messagesFormatted,
        ).user,
      },
    ];

    try {
      const llmResponse = await this.llmService.getCompletion(
        promptMessages,
        null,
        'auto',
        ValidationsContext,
      );

      if (
        typeof llmResponse === 'object' &&
        'isTicket' in llmResponse &&
        'title' in llmResponse &&
        'description' in llmResponse &&
        'priority' in llmResponse
      ) {
        const validatedResponse =
          llmResponse as unknown as ValidatedTicketResponse;

        if (validatedResponse.isTicket) {
          const result = this.toolsExecutorService.createSupportTicket(
            validatedResponse.title,
            validatedResponse.description,
            validatedResponse.priority,
          ) as TicketResult;

          const ticketId =
            result.ticket &&
            typeof result.ticket === 'object' &&
            'ticketId' in result.ticket
              ? String(result.ticket.ticketId)
              : Date.now().toString().slice(-6);

          const ticketMessage = `Parece que estás enfrentando un problema persistente. He creado un ticket de soporte con el ID: #${ticketId}. Un técnico especializado revisará tu caso pronto y se pondrá en contacto contigo. Mientras tanto, puedo seguir ayudándote con otras consultas.`;

          return {
            needsTicket: true,
            ticketMessage: ticketMessage,
          };
        }
      }

      return { needsTicket: false };
    } catch (error) {
      console.error('Error al analizar mensajes para ticket:', error);
      return { needsTicket: false };
    }
  }

  clearConversationHistory(conversationId: string): void {
    this.conversationStates.delete(conversationId);
  }

  getConversationHistory(conversationId: string): ChatCompletionMessageParam[] {
    return this.conversationStates.get(conversationId)?.history || [];
  }
}
