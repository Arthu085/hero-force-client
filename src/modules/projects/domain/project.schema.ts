import { z } from 'zod';
import { characterSchema } from '@/modules/characters/domain/character.schema';

export const PROJECT_PROGRESS_MIN = 0;
export const PROJECT_PROGRESS_MAX = 100;

export const projectStatusSchema = z.enum([
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
]);

export const projectGoalTypeSchema = z.enum([
  'AGILITY',
  'DELIGHT',
  'EFFICIENCY',
  'EXCELLENCE',
  'TRANSPARENCY',
  'AMBITION',
]);

export const projectSortBySchema = z.enum([
  'name',
  'status',
  'progress',
  'responsible',
  'createdAt',
  'updatedAt',
]);

const progressSchema = z
  .number()
  .int()
  .min(PROJECT_PROGRESS_MIN)
  .max(PROJECT_PROGRESS_MAX);

export const projectHeroSchema = z.object({
  uuid: z.string(),
  name: z.string(),
  character: characterSchema.nullable(),
});

export const projectListItemSchema = z.object({
  uuid: z.string(),
  name: z.string(),
  status: projectStatusSchema,
  statusLabel: z.string(),
  progress: progressSchema,
  responsible: projectHeroSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const projectGoalSchema = z.object({
  goal: projectGoalTypeSchema,
  goalLabel: z.string(),
  description: z.string().nullable(),
  progress: progressSchema,
});

export const projectDetailSchema = projectListItemSchema.extend({
  description: z.string(),
  goals: z.array(projectGoalSchema),
});

export const projectStatisticsSchema = z.object({
  total: z.number().int().nonnegative(),
  pending: z.number().int().nonnegative(),
  inProgress: z.number().int().nonnegative(),
  completed: z.number().int().nonnegative(),
  averageProgress: progressSchema,
});

export type ProjectStatus = z.infer<typeof projectStatusSchema>;
export type ProjectHero = z.infer<typeof projectHeroSchema>;
export type ProjectListItem = z.infer<typeof projectListItemSchema>;
export type ProjectGoal = z.infer<typeof projectGoalSchema>;
export type ProjectDetail = z.infer<typeof projectDetailSchema>;
export type ProjectStatistics = z.infer<typeof projectStatisticsSchema>;
