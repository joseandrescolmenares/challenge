import { Injectable } from '@nestjs/common';
import { VectorStoreService } from '../../embeddings/services/vector-store.service';
import {
  CheckStatusArgs,
  CreateTicketArgs,
  DocumentResult,
  QueryResult,
  SearchDocsArgs,
  ServiceStatuses,
  ToolCall,
  ToolResult,
} from '../interfaces/tool.interfaces';

@Injectable()
export class ToolsExecutorService {
  constructor(private readonly vectorStoreService: VectorStoreService) {}

  async executeToolCall(toolCall: ToolCall): Promise<ToolResult> {
    try {
      const { name, arguments: args } = toolCall.function;
      const parsedArgs: unknown =
        typeof args === 'string' ? JSON.parse(args) : args;

      switch (name) {
        case 'searchDocs': {
          const typedArgs = parsedArgs as SearchDocsArgs;
          return this.searchDocumentation(
            typedArgs.query,
            typedArgs.documentType,
            typedArgs.limit,
          );
        }
        case 'createTicket': {
          const typedArgs = parsedArgs as CreateTicketArgs;
          return this.createSupportTicket(
            typedArgs.title,
            typedArgs.description,
            typedArgs.priority,
            typedArgs.contactEmail,
          );
        }
        case 'checkStatus': {
          const typedArgs = parsedArgs as CheckStatusArgs;
          return this.checkServiceStatus(typedArgs.service);
        }
        default:
          throw new Error(`Función desconocida: ${name}`);
      }
    } catch (error) {
      console.error('Error ejecutando la función:', error);
      return {
        success: false,
        error: 'Error al ejecutar la función',
        details: error instanceof Error ? error.message : String(error),
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

    const results = (await this.vectorStoreService.queryDocuments(
      query,
      maxResults || 3,
    )) as QueryResult;

    // Crear un array de resultados formateados a partir de los documentos y metadatos
    const formattedResults: DocumentResult[] = [];
    for (let i = 0; i < results.documents.length; i++) {
      const fileName =
        (results.metadatas[i]?.fileName as string) || 'documento.md';

      formattedResults.push({
        documentId: results.ids[i] || `doc-${i + 1}`,
        fileName: fileName,
        title: this.getDocumentTitle(fileName),
        relevance: (1 - i * 0.2).toFixed(2), // Simple relevance score based on order
        excerpt:
          results.documents[i].substring(0, 300) +
          (results.documents[i].length > 300 ? '...' : ''),
        url: `/docs/${fileName}`,
      });
    }

    return {
      success: true,
      results: formattedResults,
      totalResults: formattedResults.length,
      query: query,
      message:
        formattedResults.length > 0
          ? `He encontrado ${formattedResults.length} documento(s) que podrían responder a tu consulta.`
          : 'No encontré documentos relacionados con tu consulta. Por favor, intenta con términos diferentes.',
    };
  }

  private getDocumentTitle(fileName: string): string {
    // Convertir nombre de archivo a título legible
    const withoutExtension = fileName.replace(/\.[^/.]+$/, '');
    const withSpaces = withoutExtension.replace(/_/g, ' ');
    return withSpaces
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private createSupportTicket(
    title: string,
    description: string,
    priority: string = 'media',
    contactEmail?: string,
  ): ToolResult {
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
    };

    return {
      success: true,
      ticket,
      message: `Ticket ${ticketId} creado correctamente. Un técnico se pondrá en contacto pronto.`,
    };
  }

  private checkServiceStatus(service: string = 'all'): ToolResult {
    // Simulación de estado de servicios
    const statuses: ServiceStatuses = {
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

  private calculateOverallStatus(statuses: ServiceStatuses): string {
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
