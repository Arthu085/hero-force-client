import { AuditOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { Badge, Button, Dropdown, Flex, type MenuProps } from 'antd';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { AppRoutes } from '@/core/router/app-routes';
import { useLogout, useSession } from '@/modules/auth/infra/auth.queries';
import { hasAdminRole } from '@/modules/authorization/domain/role.schema';
import { formatUserDisplayName } from '@/modules/users/domain/user.schema';
import { useOwnChangeRequests } from '@/modules/users/infra/user-change-requests.queries';
import { UserAvatar } from '@/modules/users/presentation/components/user-avatar';

export const UserMenu = () => {
  const { t } = useTranslation();
  const { data: user } = useSession();
  const { data: changeRequests = [] } = useOwnChangeRequests();
  const logoutMutation = useLogout();

  const userMenuItems: MenuProps['items'] = [
    {
      key: AppRoutes.ACCOUNT,
      icon: <UserOutlined />,
      label: <Link to={AppRoutes.ACCOUNT}>{t('account.title')}</Link>,
    },
    ...(user && hasAdminRole(user.roles)
      ? [
          {
            key: AppRoutes.CHANGE_REQUESTS,
            icon: <AuditOutlined />,
            label: (
              <Flex justify="space-between" align="center" gap="small">
                <Link to={AppRoutes.CHANGE_REQUESTS}>
                  {t('changeRequests.title')}
                </Link>
                <Badge count={changeRequests.length} size="small" />
              </Flex>
            ),
          },
        ]
      : []),
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('auth.logout'),
      disabled: logoutMutation.isPending,
      onClick: () => logoutMutation.mutate(),
    },
  ];

  return (
    <Dropdown menu={{ items: userMenuItems }} trigger={['click']}>
      <Button
        type="text"
        icon={user ? <UserAvatar user={user} size="small" /> : <UserOutlined />}
        loading={logoutMutation.isPending}
      >
        <Badge dot={changeRequests.length > 0} offset={[4, 0]}>
          {user && formatUserDisplayName(user)}
        </Badge>
      </Button>
    </Dropdown>
  );
};
