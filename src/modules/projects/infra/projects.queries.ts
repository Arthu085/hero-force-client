import {
  keepPreviousData,
  queryOptions,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { ApiResponse } from '@/core/http/api-envelope';
import { useApiSuccessMessage } from '@/shared/feedback/use-api-success-message';
import type { GoalProgressPeriod } from '../domain/project-goal-progress.schema';
import {
  createProject,
  deleteProject,
  fetchProject,
  fetchProjectGoalProgress,
  fetchProjectHistory,
  fetchProjectHeroes,
  fetchProjects,
  fetchProjectStatistics,
  type ProjectHeroListParams,
  type ProjectListParams,
  updateProject,
  updateProjectGoals,
} from './projects.api';

const projectsKey = ['projects'] as const;

export const projectQuery = (uuid: string) =>
  queryOptions({
    queryKey: [...projectsKey, 'detail', uuid],
    queryFn: () => fetchProject(uuid),
    staleTime: 0,
  });

export const useProject = (uuid: string) => useQuery(projectQuery(uuid));

export const useProjectHistory = (uuid: string) =>
  useInfiniteQuery({
    queryKey: [...projectsKey, 'history', uuid],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      fetchProjectHistory(uuid, { page: pageParam, limit: 20 }),
    getNextPageParam: ({ meta }) =>
      meta.page * meta.limit < meta.total ? meta.page + 1 : undefined,
    staleTime: 0,
  });

export const useProjectGoalProgress = (
  uuid: string,
  period: GoalProgressPeriod,
) =>
  useQuery({
    queryKey: [...projectsKey, 'goal-progress', uuid, period],
    queryFn: () => fetchProjectGoalProgress(uuid, period),
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey.includes(uuid) ? previous : undefined,
    staleTime: 0,
  });

export const useProjects = (
  params: ProjectListParams,
  { enabled = true }: { enabled?: boolean } = {},
) =>
  useQuery({
    queryKey: [...projectsKey, 'list', params],
    queryFn: () => fetchProjects(params),
    placeholderData: keepPreviousData,
    enabled,
  });

export const useProjectStatistics = ({ enabled }: { enabled: boolean }) =>
  useQuery({
    queryKey: [...projectsKey, 'statistics'],
    queryFn: fetchProjectStatistics,
    enabled,
  });

export const useProjectHeroes = (
  params: ProjectHeroListParams,
  { enabled }: { enabled: boolean },
) =>
  useQuery({
    queryKey: [...projectsKey, 'heroes', params],
    queryFn: () => fetchProjectHeroes(params),
    placeholderData: keepPreviousData,
    enabled,
  });

const useProjectMutation = <TVariables, TData>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
) => {
  const queryClient = useQueryClient();
  const showSuccessMessage = useApiSuccessMessage();

  return useMutation({
    mutationFn,
    onSuccess: async (response) => {
      showSuccessMessage(response);
      await queryClient.invalidateQueries({ queryKey: projectsKey });
    },
  });
};

export const useCreateProject = () => useProjectMutation(createProject);

export const useUpdateProject = () => useProjectMutation(updateProject);

export const useUpdateProjectGoals = () =>
  useProjectMutation(updateProjectGoals);

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  const showSuccessMessage = useApiSuccessMessage();

  return useMutation({
    mutationFn: deleteProject,
    onSuccess: async (response, uuid) => {
      showSuccessMessage(response);
      await queryClient.invalidateQueries({
        queryKey: projectsKey,
        predicate: ({ queryKey }) => !queryKey.includes(uuid),
      });
    },
  });
};
