import { z } from 'zod';
import {
  PROJECT_PROGRESS_MAX,
  PROJECT_PROGRESS_MIN,
  projectGoalTypeSchema,
} from './project.schema';

export const goalProgressPeriodSchema = z.enum(['7d', '30d', '90d', 'all']);

export type GoalProgressPeriod = z.infer<typeof goalProgressPeriodSchema>;

export const DEFAULT_GOAL_PROGRESS_PERIOD: GoalProgressPeriod = '30d';

const progressSchema = z
  .number()
  .int()
  .min(PROJECT_PROGRESS_MIN)
  .max(PROJECT_PROGRESS_MAX);

export const goalProgressChangeSchema = z.object({
  at: z.iso.datetime(),
  previousProgress: progressSchema,
  progress: progressSchema,
});

export const goalProgressSeriesSchema = z.object({
  goal: projectGoalTypeSchema,
  goalLabel: z.string(),
  startProgress: progressSchema.nullable(),
  currentProgress: progressSchema,
  changes: z.array(goalProgressChangeSchema),
});

export const projectGoalProgressSchema = z
  .object({
    period: goalProgressPeriodSchema,
    from: z.iso.datetime(),
    to: z.iso.datetime(),
    recordedFrom: z.iso.datetime().nullable(),
    goals: z.array(goalProgressSeriesSchema),
  })
  .refine(
    ({ recordedFrom, goals }) =>
      goals.every(
        ({ startProgress }) =>
          (startProgress === null) === (recordedFrom === null),
      ),
    {
      message: 'startProgress must be known exactly when recordedFrom is set',
      path: ['goals'],
    },
  );

export type GoalProgressChange = z.infer<typeof goalProgressChangeSchema>;
export type GoalProgressSeries = z.infer<typeof goalProgressSeriesSchema>;
export type ProjectGoalProgress = z.infer<typeof projectGoalProgressSchema>;
