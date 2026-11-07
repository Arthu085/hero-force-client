import { EyeOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { useHref, useLinkClickHandler } from 'react-router';
import { projectDetailsPath } from '@/core/router/app-routes';

interface ProjectDetailsButtonProps {
  uuid: string;
  name: string;
}

export const ProjectDetailsButton = ({
  uuid,
  name,
}: ProjectDetailsButtonProps) => {
  const { t } = useTranslation();
  const to = projectDetailsPath(uuid);
  const href = useHref(to);
  const followLink = useLinkClickHandler<HTMLElement>(to);

  return (
    <Tooltip title={t('projects.actions.viewDetails')}>
      <Button
        size="small"
        href={href}
        icon={<EyeOutlined />}
        aria-label={t('projects.actions.details', { name })}
        onClick={followLink}
      />
    </Tooltip>
  );
};
