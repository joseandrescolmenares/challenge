import { Injectable, Logger } from '@nestjs/common';
import { LLMService } from '../../llm/services/llm.service';
import { ToolsRegistryService } from '../../tools/services/tools-registry.service';
import { ToolsExecutorService } from '../../tools/services/tools-executor.service';
import { ChatCompletionMessageParam } from 'openai/resources/chat';
import { AIRole } from 'src/modules/llm/enum/roles.enum';
import { VectorStoreService } from '../../embeddings/services/vector-store.service';
import { agentPrompt } from '../utils/prompts/agent.prompt';
import {
  ConversationState,
  CompletionResponse,
} from '../interfaces/agent.interfaces';
import { ChatCompletionMessageToolCall } from 'openai/resources/chat';

@Injectable()
export class ChatService {
  private conversationStates: Map<string, ConversationState> = new Map();
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

    history.push({ role: AIRole.USER, content: message });
    state.userMessages.push(message);

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
}
