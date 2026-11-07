import { z } from 'zod';

export const characterSchema = z.object({
  code: z.string().min(1),
  name: z.string(),
  universe: z.string().min(1),
  universeLabel: z.string(),
  avatarPath: z.string().nullable(),
});

export type Character = z.infer<typeof characterSchema>;
