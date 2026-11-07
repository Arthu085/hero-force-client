import { PlusOutlined } from '@ant-design/icons';
import { Button, Flex, Typography } from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useListParams } from '@/shared/list/use-list-params';
import { useListSorting } from '@/shared/list/use-list-sorting';
import { projectFiltersShape } from '../../domain/project-form.schemas';
import {
  type ProjectDetail,
  projectSortBySchema,
} from '../../domain/project.schema';
import { useProjects } from '../../infra/projects.queries';
import { useProjectPermissions } from '../use-project-permissions';
import { ProjectFormModal } from './project-form.modal';
import { ProjectStatistics } from './project-statistics';
import { ProjectsFilters } from './projects-filters';
import { ProjectsTable } from './projects-table';

export const ProjectsDashboard = () => {
  const { t } = useTranslation();
  const { isAdmin, canManage } = useProjectPermissions();
  const listParams = useListParams(projectFiltersShape);
  const listSorting = useListSorting(projectSortBySchema);
  const { page, limit, filters } = listParams;
  const projectsQuery = useProjects({
    page,
    limit,
    ...filters,
    ...listSorting.sorting,
  });
  const [creating, setCreating] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectDetail | null>(
    null,
  );

  const hasFilters = Object.values(filters).some(Boolean);
  const emptyText = hasFilters
    ? t('projects.empty.filtered')
    : t(isAdmin ? 'projects.empty.all' : 'projects.empty.assigned');

  return (
    <Flex vertical gap="middle">
      <ProjectStatistics />
      <Flex justify="space-between" align="center" gap="middle" wrap>
        <Typography.Title level={3} style={{ margin: 0 }}>
          {t('projects.title')}
        </Typography.Title>
        {canManage('CREATE') && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreating(true)}
          >
            {t('projects.create.title')}
          </Button>
        )}
      </Flex>
      <ProjectsFilters listParams={listParams} canFilterByHero={isAdmin} />
      <ProjectsTable
        query={projectsQuery}
        listParams={listParams}
        listSorting={listSorting}
        canEdit={canManage('UPDATE')}
        canDelete={canManage('DELETE')}
        emptyText={emptyText}
        onEdit={setEditingProject}
      />
      <ProjectFormModal open={creating} onClose={() => setCreating(false)} />
      <ProjectFormModal
        open={editingProject !== null}
        project={editingProject}
        onClose={() => setEditingProject(null)}
      />
    </Flex>
  );
};
