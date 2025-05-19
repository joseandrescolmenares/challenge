/**
 * Interfaces relacionadas con el agente y el manejo de mensajes
 */
import {
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
} from 'openai/resources/chat/completions';

/**
 * Mensaje del asistente
 */
export interface AssistantMessage {
  content: string | null;
  tool_calls?: Array<ChatCompletionMessageToolCall>;
}

/**
 * Respuesta de la completación
 */
export interface CompletionResponse {
  choices: Array<{
    message: AssistantMessage;
    history: ChatCompletionMessageParam[];
  }>;
}
