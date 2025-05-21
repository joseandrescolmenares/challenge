import { ChatCompletionMessageParam } from 'openai/resources/chat';

export interface ConversationState {
  history: ChatCompletionMessageParam[];
  userMessages: string[];
  attemptCount: number;
  ticketSuggested: boolean;
}
export interface TicketAnalysisResponse {
  needsTicket: boolean;
  ticketMessage?: string;
  existingTicketId?: string;
}

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

export interface TicketResult {
  success: boolean;
  message: string;
  ticket?: {
    ticketId: string;
    [key: string]: any;
  };
}

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

export interface QueryResult {
  ids: string[];
  documents: string[];
  metadatas: any[];
  urls?: string[];
}
