import { Descriptions, Modal, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import { RoleTags } from '@/modules/authorization/presentation/components/role-tags';
import {
  formatUserDisplayName,
  type UserDetail,
} from '../../domain/user.schema';
import { UserAvatar } from './user-avatar';

interface UserDetailsModalProps {
  user: UserDetail | null;
  onClose: () => void;
}

export const UserDetailsModal = ({ user, onClose }: UserDetailsModalProps) => {
  const { t, i18n } = useTranslation();
  const dateTimeFormat = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  const formatDateTime = (value: string | null) =>
    value ? dateTimeFormat.format(new Date(value)) : '-';

  return (
    <Modal
      open={user !== null}
      title={t('users.details.title')}
      footer={null}
      onCancel={onClose}
      destroyOnHidden
    >
      {user && (
        <Descriptions
          column={1}
          size="small"
          items={[
            {
              label: t('users.fields.name'),
              children: (
                <Space size="small">
                  <UserAvatar user={user} size="small" />
                  {formatUserDisplayName(user)}
                </Space>
              ),
            },
            {
              label: t('users.fields.character'),
              children: user.character
                ? `${user.character.name} · ${user.character.universeLabel}`
                : '-',
            },
            { label: t('users.fields.email'), children: user.email },
            {
              label: t('users.fields.roles'),
              children: <RoleTags roles={user.roles} />,
            },
            { label: t('users.fields.status'), children: user.statusLabel },
            {
              label: t('users.fields.emailConfirmedAt'),
              children: formatDateTime(user.emailConfirmedAt),
            },
            {
              label: t('users.fields.createdBy'),
              children: user.creatorName ?? '-',
            },
            {
              label: t('users.fields.createdAt'),
              children: formatDateTime(user.createdAt),
            },
            {
              label: t('users.fields.updatedBy'),
              children: user.updaterName ?? '-',
            },
            {
              label: t('users.fields.updatedAt'),
              children: formatDateTime(user.updatedAt),
            },
          ]}
        />
      )}
    </Modal>
  );
};
