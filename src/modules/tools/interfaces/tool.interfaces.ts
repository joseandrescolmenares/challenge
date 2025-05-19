export interface ToolResult {
  success: boolean;
  [key: string]: any;
}

/**
 * Resultado de una búsqueda en documentación
 */
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

/**
 * Argumentos para verificar el estado de servicios
 */
export interface CheckStatusArgs {
  service?: string;
}

/**
 * Estructura de una llamada a una herramienta
 */
export interface ToolCall {
  function: {
    name: string;
    arguments: string | Record<string, unknown>;
  };
}

/**
 * Metadatos de un documento
 */
export interface DocumentMetadata {
  fileName?: string;
  [key: string]: unknown;
}

/**
 * Resultado de una consulta a la base de vectores
 */
export interface QueryResult {
  documents: string[];
  metadatas: DocumentMetadata[];
  ids: string[];
}

/**
 * Estado de un servicio
 */
export interface ServiceStatus {
  status: 'operativo' | 'rendimiento_degradado' | 'caído';
  lastUpdated: string;
}

/**
 * Colección de estados de servicios
 */
export interface ServiceStatuses {
  [key: string]: ServiceStatus;
}

/**
 * Esquema de una herramienta
 */
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
