/**
 * Esquema para la herramienta de creación de tickets de soporte
 */
export const createTicketSchema = {
  type: 'function',
  function: {
    name: 'createTicket',
    description: 'Registra un ticket de soporte para problemas no resueltos',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Título del ticket que resume el problema',
        },
        description: {
          type: 'string',
          description: 'Descripción detallada del problema',
        },
        priority: {
          type: 'string',
          description: 'Prioridad del ticket',
          enum: ['baja', 'media', 'alta', 'crítica'],
          default: 'media',
        },
        contactEmail: {
          type: 'string',
          description: 'Email de contacto para seguimiento',
        },
      },
      required: ['title', 'description'],
    },
  },
};
