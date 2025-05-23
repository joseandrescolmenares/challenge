import { Injectable } from '@nestjs/common';
import { VectorStoreService } from '../../embeddings/services/vector-store.service';
import {
  CheckStatusArgs,
  ServiceStatuses,
  ToolCall,
  ToolResult,
  TicketsData,
  CreateTicketArgs,
} from '../interfaces/tool.interfaces';

import * as fs from 'fs';
import * as path from 'path';

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
        case 'createTicket': {
          const typedArgs = parsedArgs as CreateTicketArgs;
          return this.createSupportTicket(
            typedArgs.title,
            typedArgs.description,
            typedArgs.priority,
            typedArgs?.conversationId,
          );
        }
        default:
          throw new Error(`Unknown function: ${name}`);
      }
    } catch (error) {
      console.error('Error executing function:', error);
      return {
        success: false,
        error: 'Error executing function',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  }

  public createSupportTicket(
    title: string,
    description: string,
    priority: string = 'media',
    conversationId?: string,
  ): ToolResult {
    try {
      const ticketsFilePath = path.join(process.cwd(), 'data', 'tickets.json');

      let ticketsData: TicketsData = { tickets: [], lastId: 0 };
      if (fs.existsSync(ticketsFilePath)) {
        const fileContent = fs.readFileSync(ticketsFilePath, 'utf8');
        ticketsData = JSON.parse(fileContent) as TicketsData;
      }

      const newId = ticketsData.lastId + 1;
      const ticketId = `TK-${newId.toString().padStart(3, '0')}`;

      const newTicket = {
        id: ticketId,
        title: title || 'No title',
        description: description || 'No description',
        status: 'open',
        createdAt: new Date().toISOString(),
        userId: conversationId,
        priority: priority || 'medium',
      };
      ticketsData.tickets.push(newTicket as never);
      ticketsData.lastId = newId;

      fs.writeFileSync(
        ticketsFilePath,
        JSON.stringify(ticketsData, null, 2),
        'utf8',
      );
      return {
        success: true,
        ticket: {
          ticketId,
          ...newTicket,
        },
        message: `Ticket ${ticketId} creado correctamente. Un técnico se pondrá en contacto pronto.`,
      };
    } catch (error) {
      console.error('Error creating ticket:', error);
      return {
        success: false,
        error: 'Could not create ticket',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private checkServiceStatus(service: string = 'all'): ToolResult {
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
        error: `Unknown service: ${service}`,
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
