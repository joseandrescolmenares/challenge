import { Injectable } from '@nestjs/common';
import { VectorStoreService } from '../../embeddings/services/vector-store.service';

interface DocumentMetadata {
  documentType?: string;
  fileName?: string;
  [key: string]: any;
}

export interface ToolResult {
  success: boolean;
  [key: string]: any;
}

@Injectable()
export class ToolsExecutorService {
  constructor(private readonly vectorStoreService: VectorStoreService) {}

  async executeToolCall(toolCall: any): Promise<ToolResult> {
    try {
      const { name, arguments: args } = toolCall.function;
      const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args;

      switch (name) {
        case 'searchDocs':
          return await this.searchDocumentation(
            parsedArgs.query,
            parsedArgs.documentType,
            parsedArgs.limit,
          );
        case 'createTicket':
          return await this.createSupportTicket(
            parsedArgs.title,
            parsedArgs.description,
            parsedArgs.priority,
            parsedArgs.contactEmail,
          );
        case 'checkStatus':
          return await this.checkServiceStatus(parsedArgs.service);
        default:
          throw new Error(`Función desconocida: ${name}`);
      }
    } catch (error) {
      console.error('Error ejecutando la función:', error);
      return {
        success: false,
        error: 'Error al ejecutar la función',
        details: error.message,
      };
    }
  }

  private async searchDocumentation(
    query: string,
    documentType?: string,
    maxResults: number = 3,
  ): Promise<ToolResult> {
    console.log(
      `Buscando "${query}" en documentos${documentType ? ' de tipo ' + documentType : ''}`,
    );

    const results = await this.vectorStoreService.queryDocuments(
      query,
      maxResults || 3,
    );

    // Manejar caso donde no hay resultados
    if (!results.documents || results.documents.length === 0) {
      return {
        success: true,
        results: [],
        count: 0,
        query,
      };
    }

    // Filtrar los resultados por documentType si se especifica
    const filteredIndexes: number[] = [];

    if (documentType) {
      for (let i = 0; i < results.metadatas.length; i++) {
        const metadata = results.metadatas[i] as DocumentMetadata;
        if (
          metadata &&
          ((metadata.documentType && metadata.documentType === documentType) ||
            (metadata.fileName && metadata.fileName.includes(documentType)))
        ) {
          filteredIndexes.push(i);
        }
      }
    } else {
      // Si no hay filtro, incluir todos los índices
      for (let i = 0; i < results.metadatas.length; i++) {
        filteredIndexes.push(i);
      }
    }

    // Mapear los resultados filtrados
    const formattedResults = filteredIndexes.map((i) => ({
      document:
        (results.metadatas[i] as DocumentMetadata)?.documentType ||
        'desconocido',
      content: results.documents[i],
      metadata: results.metadatas[i] || {},
    }));

    return {
      success: true,
      results: formattedResults,
      count: formattedResults.length,
      query,
    };
  }

  private async createSupportTicket(
    title: string,
    description: string,
    priority: string = 'media',
    contactEmail?: string,
  ): Promise<ToolResult> {
    const ticketId = `TICKET-${Date.now().toString().slice(-6)}`;

    // Simulación de creación de ticket
    console.log(
      `Creando ticket ${ticketId}: "${title}" con prioridad ${priority}`,
    );

    // En una implementación real, esto se guardaría en una base de datos
    const ticket = {
      ticketId,
      title,
      description,
      priority,
      contactEmail,
      status: 'abierto',
      createdAt: new Date().toISOString(),
      estimatedResponse: this.getEstimatedResponse(priority),
    };

    return {
      success: true,
      ticket,
      message: `Ticket ${ticketId} creado correctamente. Un técnico se pondrá en contacto pronto.`,
    };
  }

  private getEstimatedResponse(priority: string): string {
    switch (priority) {
      case 'crítica':
        return '1 hora';
      case 'alta':
        return '4 horas';
      case 'media':
        return '24 horas';
      case 'baja':
        return '48 horas';
      default:
        return '24 horas';
    }
  }

  private async checkServiceStatus(
    service: string = 'all',
  ): Promise<ToolResult> {
    // Simulación de estado de servicios
    const statuses = {
      cloud: { status: 'operativo', lastUpdated: new Date().toISOString() },
      autenticación: {
        status: 'operativo',
        lastUpdated: new Date().toISOString(),
      },
      api: {
        status: 'rendimiento_degradado',
        lastUpdated: new Date().toISOString(),
      },
      conectividad: {
        status: 'operativo',
        lastUpdated: new Date().toISOString(),
      },
    };

    if (service === 'all') {
      return {
        success: true,
        services: statuses,
        overallStatus: this.calculateOverallStatus(statuses),
      };
    }

    if (!statuses[service]) {
      return {
        success: false,
        error: `Servicio desconocido: ${service}`,
        availableServices: Object.keys(statuses),
      };
    }

    return {
      success: true,
      service,
      ...statuses[service],
    };
  }

  private calculateOverallStatus(statuses: Record<string, any>): string {
    if (Object.values(statuses).some((s) => s.status === 'caído')) {
      return 'caído';
    }
    if (
      Object.values(statuses).some((s) => s.status === 'rendimiento_degradado')
    ) {
      return 'rendimiento_degradado';
    }
    return 'operativo';
  }
}
