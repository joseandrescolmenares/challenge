export const createTicketSchema = {
  type: 'function',
  function: {
    name: 'createTicket',
    description: 'Creates a support ticket',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'The title of the ticket',
        },
        description: {
          type: 'string',
          description: 'The description of the ticket',
        },
        priority: {
          type: 'string',
          description: 'The priority of the ticket',
        },
      },
      required: ['title', 'description', 'priority'],
      additionalProperties: false,
    },
    strict: true,
  },
};
