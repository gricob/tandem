import { z } from 'zod';

export const workstreamSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().trim().optional(),
});

export type WorkstreamFormValues = z.infer<typeof workstreamSchema>;

export const createDeliverableSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().trim().optional(),
});

export type CreateDeliverableFormValues = z.infer<
  typeof createDeliverableSchema
>;
