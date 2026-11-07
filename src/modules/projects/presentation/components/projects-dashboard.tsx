import { PlusOutlined } from '@ant-design/icons';
import { Button, Flex, Typography } from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { hasAbility } from '@/modules/authorization/domain/ability.schema';
import { useAbilities } from '@/modules/authorization/infra/abilities.queries';
import { useListParams } from '@/shared/list/use-list-params';
import { useListSorting } from '@/shared/list/use-list-sorting';
import { projectFiltersShape } from '../../domain/project-form.schemas';
import {
  type ProjectDetail,
  projectSortBySchema,
} from '../../domain/project.schema';
import { useProjects } from '../../infra/projects.queries';
import { ProjectFormModal } from './project-form.modal';
import { ProjectStatistics } from './project-statistics';
import { ProjectsFilters } from './projects-filters';
import { ProjectsTable } from './projects-table';

export const ProjectsDashboard = () => {
  const { t } = useTranslation();
  const { data: abilities = [] } = useAbilities();
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

  const can = (action: 'CREATE' | 'UPDATE' | 'DELETE') =>
    hasAbility(abilities, { action, subject: 'PROJECT' });

  return (
    <Flex vertical gap="middle">
      <ProjectStatistics />
      <Flex justify="space-between" align="center" gap="middle" wrap>
        <Typography.Title level={3} style={{ margin: 0 }}>
          {t('projects.title')}
        </Typography.Title>
        {can('CREATE') && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreating(true)}
          >
            {t('projects.create.title')}
          </Button>
        )}
      </Flex>
      <ProjectsFilters
        listParams={listParams}
        canFilterByHero={can('UPDATE')}
      />
      <ProjectsTable
        query={projectsQuery}
        listParams={listParams}
        listSorting={listSorting}
        canEdit={can('UPDATE')}
        canDelete={can('DELETE')}
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
