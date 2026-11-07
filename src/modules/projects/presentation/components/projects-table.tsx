import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { type UseQueryResult, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Popconfirm,
  Space,
  type TableColumnsType,
  Typography,
} from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import type { z } from 'zod';
import type { PaginatedResponse } from '@/core/http/api-envelope';
import { projectDetailsPath } from '@/core/router/app-routes';
import { useFeedbackModal } from '@/shared/feedback/use-feedback-modal';
import { PaginatedTable } from '@/shared/list/paginated-table';
import type { ListParams } from '@/shared/list/use-list-params';
import type { ListSorting } from '@/shared/list/use-list-sorting';
import type { projectFiltersShape } from '../../domain/project-form.schemas';
import type {
  ProjectDetail,
  ProjectListItem,
  projectSortBySchema,
} from '../../domain/project.schema';
import { projectQuery, useDeleteProject } from '../../infra/projects.queries';
import { ProjectDetailsButton } from './project-details-button';
import { ProjectHeroLabel } from './project-hero-label';
import { ProjectProgress } from './project-progress';
import { ProjectStatusTag } from './project-status-tag';

interface ProjectsTableProps {
  query: UseQueryResult<PaginatedResponse<ProjectListItem>>;
  listParams: ListParams<typeof projectFiltersShape>;
  listSorting: ListSorting<z.infer<typeof projectSortBySchema>>;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (project: ProjectDetail) => void;
}

export const ProjectsTable = ({
  query,
  listParams,
  listSorting,
  canEdit,
  canDelete,
  onEdit,
}: ProjectsTableProps) => {
  const { t, i18n } = useTranslation();
  const { showError } = useFeedbackModal();
  const queryClient = useQueryClient();
  const { page, limit, setPagination } = listParams;
  const deleteMutation = useDeleteProject();
  const [loadingUuid, setLoadingUuid] = useState<string>();

  const openEdit = (uuid: string) => {
    setLoadingUuid(uuid);
    queryClient
      .fetchQuery(projectQuery(uuid))
      .then(onEdit, showError)
      .finally(() => setLoadingUuid(undefined));
  };

  const removeProject = (uuid: string) => {
    const isLastRowOfPage = query.data?.data.length === 1 && page > 1;

    deleteMutation.mutate(uuid, {
      onSuccess: () => {
        if (isLastRowOfPage) {
          setPagination(page - 1, limit);
        }
      },
      onError: showError,
    });
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString(i18n.language);

  const columns: TableColumnsType<ProjectListItem> = [
    {
      title: t('projects.fields.name'),
      dataIndex: 'name',
      ...listSorting.columnSorting('name'),
      render: (_, { uuid, name }) => (
        <Link to={projectDetailsPath(uuid)}>{name}</Link>
      ),
    },
    {
      title: t('projects.fields.responsible'),
      dataIndex: 'responsible',
      ...listSorting.columnSorting('responsible'),
      render: (_, { responsible }) => <ProjectHeroLabel hero={responsible} />,
    },
    {
      title: t('projects.fields.status'),
      dataIndex: 'status',
      ...listSorting.columnSorting('status'),
      render: (_, { status }) => <ProjectStatusTag status={status} />,
    },
    {
      title: t('projects.fields.progress'),
      dataIndex: 'progress',
      ...listSorting.columnSorting('progress'),
      render: (_, { name, progress }) => (
        <ProjectProgress
          percent={progress}
          label={t('projects.progressOf', { name })}
        />
      ),
    },
    {
      title: t('projects.fields.updatedAt'),
      dataIndex: 'updatedAt',
      ...listSorting.columnSorting('updatedAt'),
      render: (_, { updatedAt }) => (
        <Typography.Text type="secondary">
          {formatDate(updatedAt)}
        </Typography.Text>
      ),
    },
    {
      title: t('projects.fields.actions'),
      key: 'actions',
      render: (_, { uuid, name }) => (
        <Space>
          <ProjectDetailsButton uuid={uuid} name={name} />
          {canEdit && (
            <Button
              size="small"
              icon={<EditOutlined />}
              aria-label={t('projects.actions.edit', { name })}
              loading={loadingUuid === uuid}
              onClick={() => openEdit(uuid)}
            />
          )}
          {canDelete && (
            <Popconfirm
              title={t('projects.delete.title')}
              description={t('projects.delete.description', { name })}
              okText={t('common.delete')}
              cancelText={t('common.cancel')}
              okButtonProps={{ danger: true }}
              onConfirm={() => removeProject(uuid)}
            >
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                aria-label={t('projects.actions.delete', { name })}
                loading={
                  deleteMutation.isPending && deleteMutation.variables === uuid
                }
              />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <PaginatedTable
      query={query}
      listParams={listParams}
      rowKey="uuid"
      columns={columns}
      scroll={{ x: 'max-content' }}
      onChange={(_pagination, _filters, sorter, extra) => {
        if (extra.action === 'sort' && !Array.isArray(sorter)) {
          listSorting.setSorting(sorter.columnKey, sorter.order);
        }
      }}
    />
  );
};
