import {
  Alert,
  Button,
  Card,
  Empty,
  Flex,
  Segmented,
  Skeleton,
  Table,
  type TableColumnsType,
  theme,
  Typography,
} from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getApiErrorMessage } from '@/core/http/api-error';
import {
  buildGoalProgressChart,
  type GoalProgressChangeRow,
  type GoalProgressChart as GoalProgressChartData,
} from '../../domain/goal-progress-chart';
import {
  DEFAULT_GOAL_PROGRESS_PERIOD,
  type GoalProgressPeriod,
  goalProgressPeriodSchema,
} from '../../domain/project-goal-progress.schema';
import type { ProjectGoal } from '../../domain/project.schema';
import { useProjectGoalProgress } from '../../infra/projects.queries';
import { GoalProgressChart, GoalSeriesSwatch } from './goal-progress-chart';
import { useGoalSeriesStyle } from './goal-progress-series';

type ProjectGoalType = ProjectGoal['goal'];

export const ProjectGoalProgress = ({
  projectUuid,
}: {
  projectUuid: string;
}) => {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<GoalProgressPeriod>(
    DEFAULT_GOAL_PROGRESS_PERIOD,
  );
  const [showTable, setShowTable] = useState(false);
  const { data, isPending, error, isFetching, isPlaceholderData, refetch } =
    useProjectGoalProgress(projectUuid, period);
  const chart = data ? buildGoalProgressChart(data) : null;
  const hasChanges = !!chart && chart.changes.length > 0;

  return (
    <Card title={t('projects.goalProgress.title')}>
      <Flex vertical gap="middle" aria-busy={isFetching}>
        <Flex justify="space-between" align="center" gap="small" wrap>
          <Segmented<GoalProgressPeriod>
            aria-label={t('projects.goalProgress.period')}
            value={period}
            onChange={setPeriod}
            options={goalProgressPeriodSchema.options.map((value) => ({
              value,
              label: t(`projects.goalProgress.periods.${value}`),
            }))}
          />
          {hasChanges && !error && (
            <Button
              size="small"
              aria-expanded={showTable}
              onClick={() => setShowTable((shown) => !shown)}
            >
              {showTable
                ? t('projects.goalProgress.hideTable')
                : t('projects.goalProgress.showTable')}
            </Button>
          )}
        </Flex>
        {isPending && (
          <div role="status" aria-label={t('projects.goalProgress.loading')}>
            <Skeleton active />
          </div>
        )}
        {error && (
          <Alert
            type="error"
            showIcon
            title={getApiErrorMessage(error)}
            action={
              <Button loading={isFetching} onClick={() => void refetch()}>
                {t('projects.goalProgress.retry')}
              </Button>
            }
          />
        )}
        {chart &&
          !error &&
          (chart.recordedFrom === null ? (
            <Empty description={t('projects.goalProgress.empty')} />
          ) : (
            <div
              style={{
                opacity: isPlaceholderData ? 0.6 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              <GoalProgressContent
                chart={chart}
                showTable={showTable && hasChanges}
              />
            </div>
          ))}
      </Flex>
    </Card>
  );
};

const GoalProgressContent = ({
  chart,
  showTable,
}: {
  chart: GoalProgressChartData;
  showTable: boolean;
}) => {
  const { t } = useTranslation();
  const styleOf = useGoalSeriesStyle();
  const [hiddenGoals, setHiddenGoals] = useState<ReadonlySet<ProjectGoalType>>(
    () => new Set(),
  );

  const toggleGoal = (goal: ProjectGoalType) =>
    setHiddenGoals((current) => {
      const next = new Set(current);
      if (!next.delete(goal)) next.add(goal);
      return next;
    });

  return (
    <Flex vertical gap="middle">
      {chart.changes.length === 0 && (
        <Typography.Text type="secondary">
          {t('projects.goalProgress.noChanges')}
        </Typography.Text>
      )}
      <GoalProgressChart chart={chart} hiddenGoals={hiddenGoals} />
      <Flex
        wrap
        gap="small"
        role="group"
        aria-label={t('projects.goalProgress.legend')}
      >
        {chart.lines.map(({ goal }) => {
          const hidden = hiddenGoals.has(goal);
          return (
            <Button
              key={goal}
              size="small"
              type="text"
              aria-pressed={!hidden}
              icon={<GoalSeriesSwatch {...styleOf(goal)} />}
              onClick={() => toggleGoal(goal)}
              style={{ opacity: hidden ? 0.45 : 1 }}
            >
              {t(`projects.goalTypes.${goal}`)}
            </Button>
          );
        })}
      </Flex>
      {chart.unknownRange && <UnknownRangeKey />}
      {showTable && <GoalProgressTable changes={chart.changes} />}
    </Flex>
  );
};

const UnknownRangeKey = () => {
  const { t } = useTranslation();
  const { token } = theme.useToken();

  return (
    <Flex align="center" gap="small">
      <span
        aria-hidden
        style={{
          flex: 'none',
          width: 24,
          height: 12,
          border: `1px solid ${token.colorBorder}`,
          background: `repeating-linear-gradient(45deg, ${token.colorBorder} 0 2px, ${token.colorFillQuaternary} 2px 6px)`,
        }}
      />
      <Typography.Text type="secondary">
        {t('projects.goalProgress.unknownLegend')}
      </Typography.Text>
    </Flex>
  );
};

const GoalProgressTable = ({
  changes,
}: {
  changes: GoalProgressChangeRow[];
}) => {
  const { t, i18n } = useTranslation();
  const columns: TableColumnsType<GoalProgressChangeRow> = [
    {
      key: 'time',
      title: t('projects.goalProgress.table.date'),
      dataIndex: 'time',
      render: (time: number) => (
        <time dateTime={new Date(time).toISOString()}>
          {new Date(time).toLocaleString(i18n.language)}
        </time>
      ),
    },
    {
      key: 'goal',
      title: t('projects.goalProgress.table.goal'),
      dataIndex: 'goal',
      render: (goal: ProjectGoalType) => t(`projects.goalTypes.${goal}`),
    },
    {
      key: 'change',
      title: t('projects.goalProgress.table.change'),
      render: (_, { previousProgress, progress }) =>
        `${previousProgress}% → ${progress}%`,
    },
  ];

  return (
    <Table<GoalProgressChangeRow>
      size="small"
      rowKey="key"
      columns={columns}
      dataSource={changes}
      pagination={{ pageSize: 10, hideOnSinglePage: true }}
      scroll={{ x: 'max-content' }}
    />
  );
};
