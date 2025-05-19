export const searchDocsSchema = {
  type: 'function',
  function: {
    name: 'searchDocs',
    description: 'Busca información específica en la documentación técnica',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Consulta o términos de búsqueda',
        },
        documentType: {
          type: 'string',
          description:
            'Tipo específico de documento (ej: "instalacion", "manual", "configuracion")',
        },
        limit: {
          type: 'number',
          description: 'Número máximo de resultados a devolver',
        },
      },
      required: ['query', 'documentType', 'limit'],
      additionalProperties: false,
    },
    strict: true,
  },
};
