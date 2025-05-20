/**
 * Interface definitions for the agent module
 */
import { ChatCompletionMessageParam } from 'openai/resources/chat';

/**
 * Represents the current state of a conversation
 */
export interface ConversationState {
  history: ChatCompletionMessageParam[];
  userMessages: string[];
  attemptCount: number;
  ticketSuggested: boolean;
}

/**
 * Response format for ticket creation analysis
 */
export interface TicketAnalysisResponse {
  needsTicket: boolean;
  ticketMessage?: string;
  existingTicketId?: string;
}

/**
 * Structure of a ticket returned from the validation process
 */
export interface ValidatedTicketResponse {
  isTicket: boolean;
  title?: string;
  description?: string;
  priority?: string;
  existingTicket?: {
    id?: string;
    ticketId?: string;
    title?: string;
    status?: string;
  };
}

/**
 * Result from creating a support ticket
 */
export interface TicketResult {
  success: boolean;
  message: string;
  ticket?: {
    ticketId: string;
    [key: string]: any;
  };
}

/**
 * OpenAI API response format for completions
 */
export interface CompletionResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string | null;
      tool_calls?: Array<{
        id: string;
        type: string;
        function: {
          name: string;
          arguments: string;
        };
      }>;
    };
    finish_reason: string;
  }>;
}

/**
 * Format for query results from vector store
 */
export interface QueryResult {
  ids: string[];
  documents: string[];
  metadatas: any[];
  urls?: string[];
}
