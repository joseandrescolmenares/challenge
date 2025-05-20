import {
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
} from 'openai/resources/chat/completions';

export interface AssistantMessage {
  content: string | null;
  tool_calls?: Array<ChatCompletionMessageToolCall>;
}

export interface CompletionResponse {
  choices: Array<{
    message: AssistantMessage;
    history: ChatCompletionMessageParam[];
  }>;
}

export interface AssistantMessage {
  content: string | null;
  tool_calls?: Array<ChatCompletionMessageToolCall>;
}

export interface CompletionResponse {
  choices: Array<{
    message: AssistantMessage;
    history: ChatCompletionMessageParam[];
  }>;
}

export interface TicketAnalysisResponse {
  needsTicket: boolean;
  ticketMessage?: string;
}

export interface ValidatedTicketResponse {
  isTicket: boolean;
  answer: string;
  title: string;
  description: string;
  priority: string;
}

export interface TicketResult {
  success: boolean;
  ticket?: {
    ticketId: string;
    [key: string]: any;
  };
  message?: string;
}

export interface ConversationState {
  history: ChatCompletionMessageParam[];
  userMessages: string[];
  attemptCount: number;
  ticketSuggested: boolean;
  lastCreatedTicket?: string;
}
