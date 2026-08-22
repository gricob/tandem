import { z } from 'zod';

export const deliverableSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().trim().optional(),
});

export type DeliverableFormValues = z.infer<typeof deliverableSchema>;

export const createUserStorySchema = z.object({
  formTemplateId: z.string().trim().min(1, 'Form template is required'),
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().trim().optional(),
});

export type CreateUserStoryFormValues = z.infer<typeof createUserStorySchema>;

export const createAcceptanceCriterionSchema = z.object({
  formTemplateId: z.string().trim().min(1, 'Form template is required'),
});

export type CreateAcceptanceCriterionFormValues = z.infer<
  typeof createAcceptanceCriterionSchema
>;
