export const checkStatusSchema = {
  type: 'function',
  function: {
    name: 'checkStatus',
    description: 'Checks the current status of SmartHome Hub X1000 services',
    parameters: {
      type: 'object',
      properties: {
        service: {
          type: 'string',
          description:
            'Specific service to check (e.g., "cloud", "local", "all")',
          enum: ['cloud', 'local', 'all'],
          default: 'all',
        },
      },
      required: ['service'],
      additionalProperties: false,
    },
    strict: true,
  },
};
