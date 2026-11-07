import { Flex, theme, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import type { UserIdentity } from '../../domain/user.schema';
import { UserAvatar } from './user-avatar';

interface OwnProfilePreviewProps {
  user: UserIdentity;
}

const AVATAR_SIZE = { xs: 80, sm: 96, md: 96, lg: 104, xl: 112, xxl: 112 };

export const OwnProfilePreview = ({ user }: OwnProfilePreviewProps) => {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const { character } = user;

  return (
    <Flex
      component="section"
      aria-label={t('account.profile.preview')}
      align="center"
      gap="middle"
    >
      <UserAvatar user={user} size={AVATAR_SIZE} />
      <Flex vertical gap={token.marginXXS} style={{ minWidth: 0 }}>
        <Typography.Text strong style={{ fontSize: token.fontSizeLG }}>
          {user.name}
        </Typography.Text>
        {character ? (
          <>
            <Typography.Text>{character.name}</Typography.Text>
            <Typography.Text type="secondary">
              {character.universeLabel}
            </Typography.Text>
          </>
        ) : (
          <Typography.Text type="secondary">
            {t('account.profile.noCharacter')}
          </Typography.Text>
        )}
      </Flex>
    </Flex>
  );
};
