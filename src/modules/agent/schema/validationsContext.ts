import { z } from 'zod';

export const ValidationsContext = z.object({
  isTicket: z
    .boolean()
    .describe('Indicates whether a support ticket should be created or not'),

  title: z
    .string()
    .nullish()
    .describe('Ticket title (required if isTicket is true)'),

  description: z
    .string()
    .nullish()
    .describe('Ticket description (required if isTicket is true)'),

  priority: z
    .string()
    .nullish()
    .describe(
      'Ticket priority level: high, medium, or low (required if isTicket is true)',
    ),

  existingTicket: z
    .boolean()
    .describe(
      'Indicates whether the ticket already exists or if there is a similar one',
    ),

  existingTicketId: z
    .string()
    .nullish()
    .describe(
      'ID of the existing similar ticket (when existingTicket is true)',
    ),
});
