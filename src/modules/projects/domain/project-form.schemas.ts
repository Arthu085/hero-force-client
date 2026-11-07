import { z } from 'zod';
import i18n from '@/core/i18n/i18n.config';
import type { ListFilters } from '@/shared/list/use-list-params';
import {
  PROJECT_PROGRESS_MAX,
  PROJECT_PROGRESS_MIN,
  projectGoalTypeSchema,
  projectStatusSchema,
} from './project.schema';

export const PROJECT_NAME_MAX_LENGTH = 150;
export const PROJECT_DESCRIPTION_MAX_LENGTH = 2000;
export const PROJECT_GOAL_DESCRIPTION_MAX_LENGTH = 500;

const required = () => i18n.t('validation.required');

const maxLength = (max: number) => () =>
  i18n.t('validation.maxLength', { max });

const requiredText = (max: number) =>
  z
    .string({ error: required })
    .regex(/\S/, { error: required })
    .max(max, { error: maxLength(max) });

export const projectFormSchema = z.object({
  name: requiredText(PROJECT_NAME_MAX_LENGTH),
  description: requiredText(PROJECT_DESCRIPTION_MAX_LENGTH),
  responsibleUuid: z.string({ error: required }).min(1, { error: required }),
});

export const projectGoalProgressSchema = z
  .number({ error: required })
  .int({ error: () => i18n.t('projects.validation.progress') })
  .min(PROJECT_PROGRESS_MIN, {
    error: () => i18n.t('projects.validation.progress'),
  })
  .max(PROJECT_PROGRESS_MAX, {
    error: () => i18n.t('projects.validation.progress'),
  });

export const projectGoalDescriptionSchema = z
  .string()
  .max(PROJECT_GOAL_DESCRIPTION_MAX_LENGTH, {
    error: maxLength(PROJECT_GOAL_DESCRIPTION_MAX_LENGTH),
  })
  .nullish()
  .transform((value) => (value?.trim() ? value : null));

export const projectGoalsFormSchema = z.object({
  goals: z.array(
    z.object({
      goal: projectGoalTypeSchema,
      description: projectGoalDescriptionSchema,
      progress: projectGoalProgressSchema,
    }),
  ),
});

export const projectFiltersShape = {
  name: z.string().max(PROJECT_NAME_MAX_LENGTH),
  status: projectStatusSchema,
  responsible: z.uuid(),
};

export type ProjectForm = z.input<typeof projectFormSchema>;
export type ProjectGoalsForm = z.input<typeof projectGoalsFormSchema>;
export type ProjectGoalsPayload = z.output<typeof projectGoalsFormSchema>;
export type ProjectFilters = ListFilters<typeof projectFiltersShape>;
