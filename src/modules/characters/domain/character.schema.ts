import { z } from 'zod';

export const characterSchema = z.object({
  code: z.string().min(1),
  name: z.string(),
  universe: z.string().min(1),
  universeLabel: z.string(),
  group: z.string().min(1),
  groupLabel: z.string(),
  avatarPath: z.string().nullable(),
});

export type Character = z.infer<typeof characterSchema>;
