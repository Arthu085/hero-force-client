import {
  AimOutlined,
  ArrowLeftOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Flex,
  Popconfirm,
  Row,
  Skeleton,
  Typography,
} from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router';
import { getApiErrorMessage } from '@/core/http/api-error';
import { AppRoutes } from '@/core/router/app-routes';
import { useFeedbackModal } from '@/shared/feedback/use-feedback-modal';
import type { ProjectDetail } from '../../domain/project.schema';
import { useDeleteProject, useProject } from '../../infra/projects.queries';
import { ProjectFormModal } from '../components/project-form.modal';
import { ProjectGoalsModal } from '../components/project-goals.modal';
import { ProjectHeroLabel } from '../components/project-hero-label';
import { ProjectProgress } from '../components/project-progress';
import { ProjectStatusTag } from '../components/project-status-tag';
import { useProjectPermissions } from '../use-project-permissions';

export const ProjectDetailsPage = () => {
  const { uuid = '' } = useParams();
  const { t } = useTranslation();
  const { data: project, isPending, error } = useProject(uuid);

  return (
    <Flex vertical gap="middle">
      <Link to={AppRoutes.PROJECTS}>
        <ArrowLeftOutlined /> {t('projects.details.back')}
      </Link>
      {isPending && <Skeleton active />}
      {error && (
        <Alert type="error" showIcon title={getApiErrorMessage(error)} />
      )}
      {project && <ProjectDetailsContent project={project} />}
    </Flex>
  );
};

const ProjectDetailsContent = ({ project }: { project: ProjectDetail }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { showError } = useFeedbackModal();
  const { canManage } = useProjectPermissions();
  const deleteMutation = useDeleteProject();
  const [editing, setEditing] = useState(false);
  const [editingGoals, setEditingGoals] = useState(false);

  const formatDate = (value: string) =>
    new Date(value).toLocaleString(i18n.language);

  return (
    <>
      <Flex justify="space-between" align="center" gap="middle" wrap>
        <Flex align="center" gap="small" wrap>
          <Typography.Title level={2} style={{ margin: 0 }}>
            {project.name}
          </Typography.Title>
          <ProjectStatusTag status={project.status} />
        </Flex>
        <Flex gap="small" wrap>
          {canManage('UPDATE') && (
            <Button icon={<EditOutlined />} onClick={() => setEditing(true)}>
              {t('projects.actions.editProject')}
            </Button>
          )}
          {canManage('DELETE') && (
            <Popconfirm
              title={t('projects.delete.title')}
              description={t('projects.delete.description', {
                name: project.name,
              })}
              okText={t('common.delete')}
              cancelText={t('common.cancel')}
              okButtonProps={{ danger: true }}
              onConfirm={() =>
                deleteMutation.mutate(project.uuid, {
                  onSuccess: () => {
                    void navigate(AppRoutes.PROJECTS, { replace: true });
                  },
                  onError: showError,
                })
              }
            >
              <Button
                danger
                icon={<DeleteOutlined />}
                loading={deleteMutation.isPending}
              >
                {t('common.delete')}
              </Button>
            </Popconfirm>
          )}
        </Flex>
      </Flex>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title={t('projects.details.overview')}
            style={{ height: '100%' }}
          >
            <Descriptions
              column={1}
              items={[
                {
                  key: 'description',
                  label: t('projects.fields.description'),
                  children: (
                    <Typography.Paragraph
                      style={{ margin: 0, whiteSpace: 'pre-line' }}
                    >
                      {project.description}
                    </Typography.Paragraph>
                  ),
                },
                {
                  key: 'responsible',
                  label: t('projects.fields.responsible'),
                  children: <ProjectHeroLabel hero={project.responsible} />,
                },
                {
                  key: 'createdAt',
                  label: t('projects.fields.createdAt'),
                  children: formatDate(project.createdAt),
                },
                {
                  key: 'updatedAt',
                  label: t('projects.fields.updatedAt'),
                  children: formatDate(project.updatedAt),
                },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title={t('projects.fields.progress')}
            style={{ height: '100%' }}
          >
            <Flex justify="center">
              <ProjectProgress
                type="circle"
                percent={project.progress}
                label={t('projects.progressOf', { name: project.name })}
              />
            </Flex>
          </Card>
        </Col>
      </Row>
      <Card
        title={t('projects.goals.title')}
        extra={
          canManage('UPDATE') && (
            <Button
              type="primary"
              icon={<AimOutlined />}
              onClick={() => setEditingGoals(true)}
            >
              {t('projects.actions.editGoals')}
            </Button>
          )
        }
      >
        <Flex vertical gap="large">
          {project.goals.map(({ goal, description, progress }) => (
            <Flex key={goal} vertical gap={4}>
              <Typography.Text strong>
                {t(`projects.goalTypes.${goal}`)}
              </Typography.Text>
              <ProjectProgress
                percent={progress}
                label={t('projects.goals.progressOf', {
                  goal: t(`projects.goalTypes.${goal}`),
                })}
              />
              <Typography.Text type="secondary">
                {description ?? t('projects.goals.noDescription')}
              </Typography.Text>
            </Flex>
          ))}
        </Flex>
      </Card>
      <ProjectFormModal
        open={editing}
        project={project}
        onClose={() => setEditing(false)}
      />
      <ProjectGoalsModal
        project={editingGoals ? project : null}
        onClose={() => setEditingGoals(false)}
      />
    </>
  );
};
