import { Avatar, type AvatarProps } from 'antd';
import { getInitials } from '../domain/initials';

interface InitialsAvatarProps {
  name: string;
  src?: string | null;
  size?: AvatarProps['size'];
}

export const InitialsAvatar = ({ name, src, size }: InitialsAvatarProps) => (
  <Avatar size={size} src={src ?? undefined} alt="" aria-hidden>
    {getInitials(name)}
  </Avatar>
);
