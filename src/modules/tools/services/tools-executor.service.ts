import { Injectable } from '@nestjs/common';
import { VectorStoreService } from '../../embeddings/services/vector-store.service';
import {
  CheckStatusArgs,
  ServiceStatuses,
  ToolCall,
  ToolResult,
} from '../interfaces/tool.interfaces';

@Injectable()
export class ToolsExecutorService {
  constructor(private readonly vectorStoreService: VectorStoreService) {}

  executeToolCall(toolCall: ToolCall): ToolResult {
    try {
      const { name, arguments: args } = toolCall.function;
      const parsedArgs: unknown =
        typeof args === 'string' ? JSON.parse(args) : args;

      switch (name) {
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

  private getDocumentTitle(fileName: string): string {
    // Convertir nombre de archivo a título legible
    const withoutExtension = fileName.replace(/\.[^/.]+$/, '');
    const withSpaces = withoutExtension.replace(/_/g, ' ');
    return withSpaces
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  public createSupportTicket(
    title: string,
    description: string,
    priority: string = 'media',
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
