export interface ToolResult {
  success: boolean;
  [key: string]: any;
}
export interface CheckStatusArgs {
  service?: string;
}

export interface ToolCall {
  function: {
    name: string;
    arguments: string | Record<string, unknown>;
  };
}

export interface DocumentMetadata {
  fileName?: string;
  [key: string]: unknown;
}

export interface QueryResult {
  documents: string[];
  metadatas: DocumentMetadata[];
  ids: string[];
}

export interface ServiceStatus {
  status: 'operativo' | 'rendimiento_degradado' | 'caído';
  lastUpdated: string;
}

export interface ServiceStatuses {
  [key: string]: ServiceStatus;
}

export interface ToolSchema {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: string;
      properties: Record<string, unknown>;
      required: string[];
      additionalProperties: boolean;
    };
    strict: boolean;
  };
}

export interface Ticket {
  id: string;
  ticketId?: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  userId: string;
  priority: string;
}

export interface TicketsData {
  lastId: number;
  tickets: Ticket[];
}
