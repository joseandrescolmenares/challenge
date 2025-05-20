import { z } from 'zod';

export const ValidationsContext = z.object({
  isTicket: z
    .boolean()
    .describe('Indicates whether a support ticket should be created or not'),
  answer: z
    .string()
    .describe('User response notifying that their case has been escalated'),
  title: z.string().describe('Ticket title'),
  description: z.string().describe('Ticket description'),
  priority: z.string().describe('Ticket priority'),
  existingTicket: z
    .boolean()
    .describe(
      'Indicates whether the ticket already exists or if there is a similar one',
    ),
});
