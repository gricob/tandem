import { z } from 'zod';

export const deliverableSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().trim().optional(),
});

export type DeliverableFormValues = z.infer<typeof deliverableSchema>;
