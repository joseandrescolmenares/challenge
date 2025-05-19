import { createTicketSchema } from './create-ticket.schema';
import { checkStatusSchema } from './check-status.schema';

export const functionSchemas = [createTicketSchema, checkStatusSchema];

export { createTicketSchema, checkStatusSchema };
