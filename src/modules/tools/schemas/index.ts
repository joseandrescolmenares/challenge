import { searchDocsSchema } from './search-docs.schema';
import { createTicketSchema } from './create-ticket.schema';
import { checkStatusSchema } from './check-status.schema';

export const functionSchemas = [
  searchDocsSchema,
  createTicketSchema,
  checkStatusSchema,
];

export { searchDocsSchema, createTicketSchema, checkStatusSchema };
