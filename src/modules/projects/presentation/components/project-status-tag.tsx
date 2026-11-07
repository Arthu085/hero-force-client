import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { Tag } from 'antd';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { ProjectStatus } from '../../domain/project.schema';

const statusAppearance: Record<
  ProjectStatus,
  { color: string; icon: ReactNode }
> = {
  PENDING: { color: 'default', icon: <ClockCircleOutlined /> },
  IN_PROGRESS: { color: 'processing', icon: <SyncOutlined /> },
  COMPLETED: { color: 'success', icon: <CheckCircleOutlined /> },
};

interface ProjectStatusTagProps {
  status: ProjectStatus;
}

export const ProjectStatusTag = ({ status }: ProjectStatusTagProps) => {
  const { t } = useTranslation();

  return (
    <Tag
      color={statusAppearance[status].color}
      icon={statusAppearance[status].icon}
    >
      {t(`projects.status.${status}`)}
    </Tag>
  );
};
