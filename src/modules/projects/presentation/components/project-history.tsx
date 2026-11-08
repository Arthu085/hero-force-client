import {
  Alert,
  Button,
  Card,
  Empty,
  Flex,
  Skeleton,
  Timeline,
  Typography,
} from 'antd';
import { useTranslation } from 'react-i18next';
import { getApiErrorMessage } from '@/core/http/api-error';
import type { ProjectHistoryEntry } from '../../domain/project-history.schema';
import { useProjectHistory } from '../../infra/projects.queries';

export const ProjectHistory = ({ projectUuid }: { projectUuid: string }) => {
  const { t, i18n } = useTranslation();
  const {
    data,
    isPending,
    error,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
    refetch,
  } = useProjectHistory(projectUuid);
  const entries = [
    ...new Map(
      data?.pages.flatMap((page) =>
        page.data.map((entry) => [entry.uuid, entry] as const),
      ),
    ).values(),
  ];

  return (
    <Card title={t('projects.history.title')}>
      <Flex vertical gap="middle" aria-busy={isFetching}>
        {isPending && (
          <div role="status" aria-label={t('projects.history.loading')}>
            <Skeleton active />
          </div>
        )}
        {entries.length > 0 && (
          <Timeline
            items={entries.map((entry) => ({
              key: entry.uuid,
              content: (
                <Flex vertical gap={4} style={{ overflowWrap: 'anywhere' }}>
                  <Typography.Text strong>
                    {t(`projects.history.events.${entry.type}`)}
                    {entry.goal &&
                      ` · ${t(`projects.goalTypes.${entry.goal}`)}`}
                  </Typography.Text>
                  <Typography.Text type="secondary">
                    {t('projects.history.actor', {
                      name:
                        entry.actor?.name ?? t('projects.history.removedActor'),
                    })}
                    {' · '}
                    <time dateTime={entry.createdAt}>
                      {new Date(entry.createdAt).toLocaleString(i18n.language)}
                    </time>
                  </Typography.Text>
                  <ProjectHistoryChanges entry={entry} />
                </Flex>
              ),
            }))}
          />
        )}
        {!isPending && !error && entries.length === 0 && (
          <Empty description={t('projects.history.empty')} />
        )}
        {error && (
          <Alert
            type="error"
            showIcon
            title={getApiErrorMessage(error)}
            action={
              <Button
                loading={isFetching}
                onClick={() =>
                  isFetchNextPageError ? void fetchNextPage() : void refetch()
                }
              >
                {t('projects.history.retry')}
              </Button>
            }
          />
        )}
        {hasNextPage && !error && (
          <Button
            loading={isFetchingNextPage}
            onClick={() => void fetchNextPage()}
          >
            {t('projects.history.loadMore')}
          </Button>
        )}
      </Flex>
    </Card>
  );
};

const ProjectHistoryChanges = ({ entry }: { entry: ProjectHistoryEntry }) => {
  const { t } = useTranslation();

  if (entry.type === 'PROJECT_CREATED' || entry.type === 'PROJECT_DELETED') {
    const values =
      entry.type === 'PROJECT_CREATED' ? entry.newValues : entry.previousValues;

    return (
      <Flex vertical gap={4}>
        <Typography.Text>{values.name}</Typography.Text>
        <Typography.Text style={{ whiteSpace: 'pre-wrap' }}>
          {values.description}
        </Typography.Text>
        <Typography.Text>
          {t('projects.fields.responsible')}: {values.responsible.name}
        </Typography.Text>
      </Flex>
    );
  }

  const change = (before: string | null, after: string | null) => (
    <Typography.Text style={{ whiteSpace: 'pre-wrap' }}>
      {before ?? t('projects.goals.noDescription')} →{' '}
      {after ?? t('projects.goals.noDescription')}
    </Typography.Text>
  );

  switch (entry.type) {
    case 'PROJECT_NAME_CHANGED':
      return change(entry.previousValues.name, entry.newValues.name);
    case 'PROJECT_DESCRIPTION_CHANGED':
    case 'GOAL_DESCRIPTION_CHANGED':
      return change(
        entry.previousValues.description,
        entry.newValues.description,
      );
    case 'RESPONSIBLE_HERO_CHANGED':
      return change(
        entry.previousValues.responsible.name,
        entry.newValues.responsible.name,
      );
    case 'GOAL_PROGRESS_CHANGED':
      return change(
        `${entry.previousValues.progress}%`,
        `${entry.newValues.progress}%`,
      );
  }
};
