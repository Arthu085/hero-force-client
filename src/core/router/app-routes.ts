import { generatePath } from 'react-router';

export const AppRoutes = {
  HOME: '/',
  PROJECT_DETAILS: '/projects/:uuid',
  USERS: '/users',
  ROLES: '/roles',
  ACCOUNT: '/account',
  CHANGE_REQUESTS: '/account/change-requests',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  CONFIRM_EMAIL: '/confirm-email',
  RESEND_CONFIRMATION: '/resend-confirmation',
  NOT_FOUND: '*',
} as const;

export const projectDetailsPath = (uuid: string) =>
  generatePath(AppRoutes.PROJECT_DETAILS, { uuid });
