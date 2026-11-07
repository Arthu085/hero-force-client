import { z } from 'zod';
import i18n from '@/core/i18n/i18n.config';
import {
  EMAIL_MAX_LENGTH,
  emailSchema,
  loginFormSchema,
  newPasswordSchema,
} from '@/modules/auth/domain/auth.schemas';
import { recordStatusSchema } from '@/shared/domain/record-status.schema';
import type { ListFilters } from '@/shared/list/use-list-params';

export const USER_NAME_MAX_LENGTH = 150;

const required = () => i18n.t('validation.required');

const nameSchema = z
  .string({ error: required })
  .regex(/\S/, { error: required })
  .max(USER_NAME_MAX_LENGTH, {
    error: () => i18n.t('validation.maxLength', { max: USER_NAME_MAX_LENGTH }),
  });

const roleUuidsSchema = z
  .array(z.string(), { error: required })
  .min(1, { error: required });

const characterCodeSchema = z.string().min(1).nullable().default(null);

export const updateUserFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  roleUuids: roleUuidsSchema,
  characterCode: characterCodeSchema,
});

export const createUserFormSchema = updateUserFormSchema.extend({
  password: newPasswordSchema,
});

export const updateOwnProfileFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  characterCode: characterCodeSchema,
  currentPassword: loginFormSchema.shape.password.optional(),
});

export const changeOwnPasswordFormSchema = z.object({
  currentPassword: loginFormSchema.shape.password,
  newPassword: newPasswordSchema,
});

export const confirmNewPasswordSchema = (newPassword: unknown) =>
  z
    .string({ error: required })
    .min(1, { error: required })
    .refine((value) => value === newPassword, {
      error: () => i18n.t('validation.passwordMismatch'),
    });

export const registerFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: newPasswordSchema,
  characterCode: characterCodeSchema,
});

export const isSameEmail = (email: string, otherEmail: string) =>
  email.trim().toLowerCase() === otherEmail.trim().toLowerCase();

export const userFiltersShape = {
  name: z.string().max(USER_NAME_MAX_LENGTH),
  email: z.string().max(EMAIL_MAX_LENGTH),
  role: z.uuid(),
  status: recordStatusSchema,
};

export const defaultUserFilters: ListFilters<typeof userFiltersShape> = {
  status: 'ACTIVE',
};

export type UpdateUserForm = z.input<typeof updateUserFormSchema>;
export type CreateUserForm = z.input<typeof createUserFormSchema>;
export type RegisterForm = z.input<typeof registerFormSchema>;
export type UpdateOwnProfileForm = z.input<typeof updateOwnProfileFormSchema>;
export type ChangeOwnPasswordForm = z.infer<typeof changeOwnPasswordFormSchema>;
