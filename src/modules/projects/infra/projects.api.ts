import { z } from 'zod';
import {
  type ApiResponse,
  type PaginatedResponse,
  parseApiData,
  parseApiResponse,
  parsePaginatedResponse,
} from '@/core/http/api-envelope';
import { httpClient } from '@/core/http/http-client';
import type { ListSortParams } from '@/shared/list/use-list-sorting';
import type {
  ProjectFilters,
  ProjectForm,
  ProjectGoalsPayload,
} from '../domain/project-form.schemas';
import {
  type ProjectHistoryEntry,
  projectHistoryEntrySchema,
} from '../domain/project-history.schema';
import {
  type ProjectDetail,
  projectDetailSchema,
  type ProjectHero,
  projectHeroSchema,
  type ProjectListItem,
  projectListItemSchema,
  type projectSortBySchema,
  type ProjectStatistics,
  projectStatisticsSchema,
} from '../domain/project.schema';

export type ProjectListParams = {
  page: number;
  limit: number;
} & ProjectFilters &
  ListSortParams<z.infer<typeof projectSortBySchema>>;

export interface ProjectHeroListParams {
  page: number;
  limit: number;
  name?: string;
}

export interface UpdateProjectPayload extends Partial<ProjectForm> {
  uuid: string;
}

export interface UpdateProjectGoalsPayload extends ProjectGoalsPayload {
  uuid: string;
}

export const fetchProjects = async (
  params: ProjectListParams,
): Promise<PaginatedResponse<ProjectListItem>> => {
  const response = await httpClient.get<unknown>('/projects', { params });

  return parsePaginatedResponse(projectListItemSchema, response.data);
};

export const fetchProject = async (uuid: string): Promise<ProjectDetail> => {
  const response = await httpClient.get<unknown>(`/projects/${uuid}`);

  return parseApiData(projectDetailSchema, response.data);
};

export const fetchProjectHistory = async (
  uuid: string,
  params: { page: number; limit: number },
): Promise<PaginatedResponse<ProjectHistoryEntry>> => {
  const response = await httpClient.get<unknown>(`/projects/${uuid}/history`, {
    params,
  });

  return parsePaginatedResponse(projectHistoryEntrySchema, response.data);
};

export const fetchProjectStatistics = async (): Promise<ProjectStatistics> => {
  const response = await httpClient.get<unknown>('/projects/statistics');

  return parseApiData(projectStatisticsSchema, response.data);
};

export const fetchProjectHeroes = async (
  params: ProjectHeroListParams,
): Promise<PaginatedResponse<ProjectHero>> => {
  const response = await httpClient.get<unknown>('/projects/heroes', {
    params,
  });

  return parsePaginatedResponse(projectHeroSchema, response.data);
};

export const createProject = async (
  payload: ProjectForm,
): Promise<ApiResponse<ProjectDetail>> => {
  const response = await httpClient.post<unknown>('/projects', payload);

  return parseApiResponse(projectDetailSchema, response.data);
};

export const updateProject = async ({
  uuid,
  ...payload
}: UpdateProjectPayload): Promise<ApiResponse<ProjectDetail>> => {
  const response = await httpClient.patch<unknown>(
    `/projects/${uuid}`,
    payload,
  );

  return parseApiResponse(projectDetailSchema, response.data);
};

export const updateProjectGoals = async ({
  uuid,
  goals,
}: UpdateProjectGoalsPayload): Promise<ApiResponse<ProjectDetail>> => {
  const response = await httpClient.patch<unknown>(`/projects/${uuid}/goals`, {
    goals,
  });

  return parseApiResponse(projectDetailSchema, response.data);
};

export const deleteProject = async (
  uuid: string,
): Promise<ApiResponse<null>> => {
  const response = await httpClient.delete<unknown>(`/projects/${uuid}`);

  return parseApiResponse(z.null(), response.data);
};
