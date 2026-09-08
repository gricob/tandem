import { z } from 'zod';

export const inviteSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email'),
  role: z.enum(['member', 'admin']),
});

export type InviteFormValues = z.infer<typeof inviteSchema>;
