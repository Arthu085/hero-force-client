import type { AvatarProps } from 'antd';
import { InitialsAvatar } from '@/shared/components/initials-avatar';
import type { UserIdentity } from '../../domain/user.schema';

interface UserAvatarProps {
  user: UserIdentity;
  size?: AvatarProps['size'];
}

export const UserAvatar = ({ user, size }: UserAvatarProps) => (
  <InitialsAvatar
    name={user.name}
    src={user.character?.avatarPath}
    size={size}
  />
);
