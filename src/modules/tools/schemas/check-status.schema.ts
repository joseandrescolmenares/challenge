export const checkStatusSchema = {
  type: 'function',
  function: {
    name: 'checkStatus',
    description:
      'Verifica el estado actual de los servicios del SmartHome Hub X1000',
    parameters: {
      type: 'object',
      properties: {
        service: {
          type: 'string',
          description:
            'Servicio específico a verificar (ej: "cloud", "local", "all")',
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
