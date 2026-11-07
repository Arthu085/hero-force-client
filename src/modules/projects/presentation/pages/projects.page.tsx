import { Flex, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { ProjectsDashboard } from '../components/projects-dashboard';

export const ProjectsPage = () => {
  const { t } = useTranslation();

  return (
    <Flex vertical gap="middle">
      <Typography.Title level={2} style={{ margin: 0 }}>
        {t('projects.dashboard.title')}
      </Typography.Title>
      <ProjectsDashboard />
    </Flex>
  );
};
