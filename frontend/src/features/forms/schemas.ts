import { z } from 'zod';

export const createFormSchema = z.object({
  formTemplateId: z.string().trim().min(1, 'Form template is required'),
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().trim().optional(),
});

export type CreateFormFormValues = z.infer<typeof createFormSchema>;

export const editFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().trim().optional(),
});

export type EditFormFormValues = z.infer<typeof editFormSchema>;
