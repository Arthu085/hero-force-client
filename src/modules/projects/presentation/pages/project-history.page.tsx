import { ArrowLeftOutlined } from '@ant-design/icons';
import { Alert, Flex, Skeleton, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import { getApiErrorMessage } from '@/core/http/api-error';
import { projectDetailsPath } from '@/core/router/app-routes';
import { useProject } from '../../infra/projects.queries';
import { ProjectHistory } from '../components/project-history';

export const ProjectHistoryPage = () => {
  const { uuid = '' } = useParams();
  const { t } = useTranslation();
  const { data: project, isPending, error } = useProject(uuid);

  return (
    <Flex vertical gap="middle">
      <Link to={projectDetailsPath(uuid)}>
        <ArrowLeftOutlined aria-hidden /> {t('projects.history.back')}
      </Link>
      {isPending && <Skeleton active />}
      {error && (
        <Alert type="error" showIcon title={getApiErrorMessage(error)} />
      )}
      {project && (
        <>
          <Typography.Title level={2} style={{ margin: 0 }}>
            {t('projects.history.pageTitle', { name: project.name })}
          </Typography.Title>
          <ProjectHistory projectUuid={project.uuid} />
        </>
      )}
    </Flex>
  );
};
