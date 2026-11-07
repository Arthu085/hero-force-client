import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { Tag } from 'antd';
import type { ReactNode } from 'react';
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
  label: string;
}

export const ProjectStatusTag = ({ status, label }: ProjectStatusTagProps) => (
  <Tag
    color={statusAppearance[status].color}
    icon={statusAppearance[status].icon}
  >
    {label}
  </Tag>
);
