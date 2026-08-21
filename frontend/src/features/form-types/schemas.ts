import { z } from 'zod';
import type { FieldType } from './api';

export const fieldTypeOptions: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Text area' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Yes/No' },
  { value: 'select', label: 'Select (single choice)' },
  { value: 'multi_select', label: 'Multi-select (multiple choices)' },
  { value: 'date', label: 'Date' },
];

export function needsOptions(fieldType: FieldType): boolean {
  return fieldType === 'select' || fieldType === 'multi_select';
}

export const formTypeSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().trim().optional(),
});

export type FormTypeFormValues = z.infer<typeof formTypeSchema>;

export const fieldFormSchema = z
  .object({
    label: z.string().trim().min(1, 'Label is required'),
    fieldType: z.enum([
      'text',
      'textarea',
      'number',
      'boolean',
      'select',
      'multi_select',
      'date',
    ]),
    isRequired: z.boolean(),
    options: z.array(z.string().trim().min(1)),
  })
  .refine((data) => !needsOptions(data.fieldType) || data.options.length > 0, {
    message: 'Add at least one option',
    path: ['options'],
  });

export type FieldFormValues = z.infer<typeof fieldFormSchema>;
