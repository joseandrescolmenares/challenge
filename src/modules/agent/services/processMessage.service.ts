import { Injectable, Logger } from '@nestjs/common';
import { LLMService } from '../../llm/services/llm.service';
import { ToolsRegistryService } from '../../tools/services/tools-registry.service';
import { ToolsExecutorService } from '../../tools/services/tools-executor.service';
import { ChatCompletionMessageParam } from 'openai/resources/chat';
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
import { TicketsData } from 'src/modules/tools/interfaces/tool.interfaces';
import * as fs from 'fs';
import * as path from 'path';
import { ChatCompletionMessageToolCall } from 'openai/resources/chat';
import { OpenAIModel } from 'src/modules/llm/enum/model.enum';
@Injectable()
export class ChatService {
  private conversationStates: Map<string, ConversationState> = new Map();
  private readonly USER_MESSAGES_TO_ANALYZE = 5;
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly llmService: LLMService,
    private readonly toolsRegistryService: ToolsRegistryService,
    private readonly toolsExecutorService: ToolsExecutorService,
    private readonly vectorStoreService: VectorStoreService,
  ) {}

  /**
   * Processes a user message and generates a response
   * @param conversationId - Unique conversation identifier
   * @param message - User message content
   * @returns Response message and conversation history
   */
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
      try {
        const ticketAnalysis = await this.shouldSuggestTicketCreation(
          state.userMessages,
          conversationId,
        );

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
      } catch (error) {
        this.logger.error('Error analyzing ticket creation need:', error);
      }
    }

    history.push({ role: AIRole.USER, content: message });

    try {
      const response = (await this.llmService.getCompletion({
        messages: history,
        tools: this.toolsRegistryService.getAllTools(),
        toolChoice: 'auto',
        schema: null,
        maxTokens: null,
      })) as CompletionResponse;

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
          tool_calls:
            assistantMessage.tool_calls as ChatCompletionMessageToolCall[],
        });
      }

      this.logger.log(
        `Executing ${assistantMessage.tool_calls.length} tool calls`,
      );

      for (const toolCall of assistantMessage.tool_calls) {
        try {
          const result = this.toolsExecutorService.executeToolCall(toolCall);

          history.push({
            role: AIRole.TOOL,
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
          });
        } catch (error) {
          this.logger.error(
            `Error executing tool call: ${toolCall.function.name}`,
            error,
          );

          history.push({
            role: AIRole.TOOL,
            tool_call_id: toolCall.id,
            content: JSON.stringify({
              error: `Failed to execute tool: ${error || 'Unknown error'}`,
            }),
          });
        }
      }

      const finalResponse = (await this.llmService.getCompletion({
        messages: history,
        tools: null,
        toolChoice: 'auto',
      })) as CompletionResponse;

      const finalMessage = finalResponse.choices[0].message;
      const finalContent =
        finalMessage.content ||
        'Sorry, I could not process your query correctly.';

      history.push({
        role: AIRole.ASSISTANT,
        content: finalContent,
      });

      this.updateConversationState(conversationId, state);

      return {
        message: finalContent,
        history: history,
      };
    } catch (error) {
      this.logger.error('Error processing message:', error);

      const errorMessage =
        'Sorry, there was an error processing your request. Please try again later.';

      history.push({
        role: AIRole.ASSISTANT,
        content: errorMessage,
      });

      this.updateConversationState(conversationId, state);

      return {
        message: errorMessage,
        history: history,
      };
    }
  }

  /**
   * Gets or creates a conversation state for the given ID
   * @param conversationId - Unique conversation identifier
   * @returns Conversation state
   */
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

  /**
   * Updates the conversation state
   * @param conversationId - Unique conversation identifier
   * @param state - Updated conversation state
   */
  private updateConversationState(
    conversationId: string,
    state: ConversationState,
  ): void {
    this.conversationStates.set(conversationId, state);
  }

  /**
   * Analyzes user messages to determine if a support ticket should be created
   * @param messages - Array of user messages
   * @param conversationId - Unique conversation identifier
   * @returns Analysis result
   */
  private async shouldSuggestTicketCreation(
    messages: string[],
    conversationId: string,
  ): Promise<TicketAnalysisResponse> {
    const ticketsFilePath = path.join(process.cwd(), 'data', 'tickets.json');
    let ticketsData: TicketsData = { lastId: 0, tickets: [] };

    try {
      if (fs.existsSync(ticketsFilePath)) {
        const fileContent = fs.readFileSync(ticketsFilePath, 'utf8');
        ticketsData = JSON.parse(fileContent) as TicketsData;
      }

      const lastMessages = messages.slice(-this.USER_MESSAGES_TO_ANALYZE);
      const messagesFormatted = lastMessages
        .map((msg, i) => `Message ${i + 1}: "${msg}"`)
        .join('\n');

      const promptMessages: ChatCompletionMessageParam[] = [
        {
          role: AIRole.SYSTEM,
          content: agentValidationPrompt(
            messages,
            messagesFormatted,
            ticketsData.tickets,
          ).system,
        },
        {
          role: AIRole.USER,
          content: agentValidationPrompt(messages, messagesFormatted).user,
        },
      ];

      const llmResponse = await this.llmService.getCompletion({
        messages: promptMessages,
        tools: null,
        toolChoice: 'auto',
        schema: ValidationsContext,
        model: OpenAIModel.GPT4_1_NANO,
        maxTokens: null,
      });

      if (typeof llmResponse === 'object' && llmResponse !== null) {
        const validatedResponse =
          llmResponse as unknown as ValidatedTicketResponse;

        if (!validatedResponse.isTicket && validatedResponse.existingTicket) {
          const existingTicket = validatedResponse.existingTicket;
          const status = existingTicket.status || 'pending';
          const ticketId =
            existingTicket.id || existingTicket.ticketId || 'unknown';

          const existingTicketMessage = `He identificado que su problema es similar a uno ya reportado en nuestro sistema. El estado actual es: ${status.toUpperCase()}. Nuestro equipo técnico está trabajando en una solución.`;

          return {
            needsTicket: true,
            ticketMessage: existingTicketMessage,
            existingTicketId: String(ticketId),
          };
        }

        if (
          validatedResponse.isTicket &&
          validatedResponse.title &&
          validatedResponse.description &&
          validatedResponse.priority
        ) {
          const result = this.toolsExecutorService.createSupportTicket(
            validatedResponse.title,
            validatedResponse.description,
            validatedResponse.priority,
            conversationId,
          ) as TicketResult;

          let ticketId = 'unknown';

          if (result.success && result.ticket && 'ticketId' in result.ticket) {
            ticketId = String(result.ticket.ticketId);
          } else {
            ticketId = Date.now().toString().slice(-6);
          }

          const ticketMessage = `Parece que estás enfrentando un problema persistente. He creado un ticket de soporte con el ID: #${ticketId}. Un técnico especializado revisará tu caso pronto y se pondrá en contacto contigo. Mientras tanto, puedo seguir ayudándote con otras consultas.`;

          return {
            needsTicket: true,
            ticketMessage: ticketMessage,
          };
        }
      }

      return { needsTicket: false };
    } catch (error) {
      this.logger.error('Error analyzing messages for ticket creation:', error);
      return { needsTicket: false };
    }
  }

  /**
   * Clears the conversation history for a given conversation
   * @param conversationId - Unique conversation identifier
   */
  clearConversationHistory(conversationId: string): void {
    this.conversationStates.delete(conversationId);
  }

  /**
   * Gets the conversation history for a given conversation
   * @param conversationId - Unique conversation identifier
   * @returns Array of conversation messages
   */
  getConversationHistory(conversationId: string): ChatCompletionMessageParam[] {
    return this.conversationStates.get(conversationId)?.history || [];
  }
}
