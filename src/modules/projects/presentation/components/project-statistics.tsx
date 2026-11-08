import { Alert, Card, Col, Row, Statistic } from 'antd';
import { useTranslation } from 'react-i18next';
import { getApiErrorMessage } from '@/core/http/api-error';
import type { ProjectStatistics as ProjectStatisticsData } from '../../domain/project.schema';
import { useProjectStatistics } from '../../infra/projects.queries';

const indicators = [
  { key: 'total', labelKey: 'projects.statistics.total' },
  { key: 'pending', labelKey: 'projects.statistics.pending' },
  { key: 'inProgress', labelKey: 'projects.statistics.inProgress' },
  { key: 'completed', labelKey: 'projects.statistics.completed' },
] as const satisfies readonly {
  key: keyof ProjectStatisticsData;
  labelKey: string;
}[];

export const ProjectStatistics = () => {
  const { t } = useTranslation();
  const { data, isPending, error } = useProjectStatistics({ enabled: true });

  if (error) {
    return <Alert type="error" showIcon title={getApiErrorMessage(error)} />;
  }

  return (
    <Row gutter={[16, 16]}>
      {indicators.map(({ key, labelKey }) => (
        <Col key={key} xs={24} md={8} xl={4}>
          <Card size="small" style={{ height: '100%' }}>
            <Statistic
              title={t(labelKey)}
              value={data?.[key] ?? 0}
              loading={isPending}
            />
          </Card>
        </Col>
      ))}
      <Col xs={24} md={16} xl={8}>
        <Card size="small" style={{ height: '100%' }}>
          <Statistic
            title={t('projects.statistics.averageProgress')}
            value={data?.averageProgress ?? 0}
            suffix="%"
            loading={isPending}
          />
        </Card>
      </Col>
    </Row>
  );
};
