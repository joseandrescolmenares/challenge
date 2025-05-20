import { z } from 'zod';

export const ValidationsContext = z.object({
  isTicket: z
    .boolean()
    .describe('Indica si se debe crear un ticket de soporte o no'),
  answer: z
    .string()
    .describe('Respuesta del usuario notificando que su caso fue escalado '),
  title: z.string().describe('Título del ticket'),
  description: z.string().describe('Descripción del ticket'),
  priority: z.string().describe('Prioridad del ticket'),
});
