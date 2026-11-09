import { Progress, type ProgressProps } from 'antd';
import { PROJECT_PROGRESS_MAX } from '../../domain/project.schema';

interface ProjectProgressProps {
  percent: number;
  label: string;
  type?: ProgressProps['type'];
  size?: ProgressProps['size'];
}

export const ProjectProgress = ({
  percent,
  label,
  type = 'line',
  size,
}: ProjectProgressProps) => (
  <Progress
    type={type}
    size={size}
    percent={percent}
    status={percent === PROJECT_PROGRESS_MAX ? 'success' : 'normal'}
    format={() => `${percent}%`}
    aria-label={label}
    style={type === 'line' ? { minWidth: 120 } : undefined}
  />
);
