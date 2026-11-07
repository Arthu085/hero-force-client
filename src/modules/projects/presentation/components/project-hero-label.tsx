import { Space } from 'antd';
import { formatUserDisplayName } from '@/modules/users/domain/user.schema';
import { UserAvatar } from '@/modules/users/presentation/components/user-avatar';
import type { ProjectHero } from '../../domain/project.schema';

interface ProjectHeroLabelProps {
  hero: ProjectHero;
}

export const ProjectHeroLabel = ({ hero }: ProjectHeroLabelProps) => (
  <Space size="small">
    <UserAvatar user={hero} size="small" />
    {formatUserDisplayName(hero)}
  </Space>
);
