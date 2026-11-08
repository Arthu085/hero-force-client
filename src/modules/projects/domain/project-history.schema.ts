import { z } from 'zod';
import {
  PROJECT_PROGRESS_MAX,
  PROJECT_PROGRESS_MIN,
  projectGoalTypeSchema,
} from './project.schema';

export const projectHistoryTypeSchema = z.enum([
  'PROJECT_CREATED',
  'PROJECT_NAME_CHANGED',
  'PROJECT_DESCRIPTION_CHANGED',
  'RESPONSIBLE_HERO_CHANGED',
  'GOAL_DESCRIPTION_CHANGED',
  'GOAL_PROGRESS_CHANGED',
  'PROJECT_DELETED',
]);

const historyUserSchema = z.object({
  uuid: z.string(),
  name: z.string(),
});

const entryFields = {
  uuid: z.string(),
  createdAt: z.iso.datetime(),
  actor: historyUserSchema.nullable(),
};

const projectValuesSchema = z.object({
  name: z.string(),
  description: z.string(),
  responsible: historyUserSchema,
});

const nameValuesSchema = z.object({ name: z.string() });
const descriptionValuesSchema = z.object({ description: z.string() });
const responsibleValuesSchema = z.object({ responsible: historyUserSchema });
const goalDescriptionValuesSchema = z.object({
  description: z.string().nullable(),
});
const progressValuesSchema = z.object({
  progress: z
    .number()
    .int()
    .min(PROJECT_PROGRESS_MIN)
    .max(PROJECT_PROGRESS_MAX),
});

export const projectHistoryEntrySchema = z.discriminatedUnion('type', [
  z.object({
    ...entryFields,
    type: z.literal('PROJECT_CREATED'),
    goal: z.null(),
    previousValues: z.null(),
    newValues: projectValuesSchema,
  }),
  z.object({
    ...entryFields,
    type: z.literal('PROJECT_NAME_CHANGED'),
    goal: z.null(),
    previousValues: nameValuesSchema,
    newValues: nameValuesSchema,
  }),
  z.object({
    ...entryFields,
    type: z.literal('PROJECT_DESCRIPTION_CHANGED'),
    goal: z.null(),
    previousValues: descriptionValuesSchema,
    newValues: descriptionValuesSchema,
  }),
  z.object({
    ...entryFields,
    type: z.literal('RESPONSIBLE_HERO_CHANGED'),
    goal: z.null(),
    previousValues: responsibleValuesSchema,
    newValues: responsibleValuesSchema,
  }),
  z.object({
    ...entryFields,
    type: z.literal('GOAL_DESCRIPTION_CHANGED'),
    goal: projectGoalTypeSchema,
    previousValues: goalDescriptionValuesSchema,
    newValues: goalDescriptionValuesSchema,
  }),
  z.object({
    ...entryFields,
    type: z.literal('GOAL_PROGRESS_CHANGED'),
    goal: projectGoalTypeSchema,
    previousValues: progressValuesSchema,
    newValues: progressValuesSchema,
  }),
  z.object({
    ...entryFields,
    type: z.literal('PROJECT_DELETED'),
    goal: z.null(),
    previousValues: projectValuesSchema,
    newValues: z.null(),
  }),
]);

export type ProjectHistoryEntry = z.infer<typeof projectHistoryEntrySchema>;
