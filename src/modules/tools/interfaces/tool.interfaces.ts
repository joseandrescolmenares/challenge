export interface ToolResult {
  success: boolean;
  [key: string]: any;
}

export interface DocumentResult {
  documentId: string;
  fileName: string;
  title: string;
  relevance: string;
  excerpt: string;
  url: string;
}

export interface CreateTicketArgs {
  title: string;
  description: string;
  priority: string;
  contactEmail: string;
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
