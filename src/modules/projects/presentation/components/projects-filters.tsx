import { Form, Input, Select } from 'antd';
import { useTranslation } from 'react-i18next';
import { ListFiltersForm } from '@/shared/list/list-filters-form';
import type { ListParams } from '@/shared/list/use-list-params';
import {
  PROJECT_NAME_MAX_LENGTH,
  type projectFiltersShape,
} from '../../domain/project-form.schemas';
import { projectStatusSchema } from '../../domain/project.schema';
import { HeroSelect } from './hero-select';

interface ProjectsFiltersProps {
  listParams: ListParams<typeof projectFiltersShape>;
  canFilterByHero: boolean;
}

export const ProjectsFilters = ({
  listParams,
  canFilterByHero,
}: ProjectsFiltersProps) => {
  const { t } = useTranslation();

  return (
    <ListFiltersForm listParams={listParams}>
      <Form.Item name="name" label={t('projects.fields.name')}>
        <Input maxLength={PROJECT_NAME_MAX_LENGTH} />
      </Form.Item>
      <Form.Item name="status" label={t('projects.fields.status')}>
        <Select
          allowClear
          placeholder={t('projects.filters.anyStatus')}
          options={projectStatusSchema.options.map((status) => ({
            value: status,
            label: t(`projects.status.${status}`),
          }))}
        />
      </Form.Item>
      {canFilterByHero && (
        <Form.Item name="responsible" label={t('projects.fields.responsible')}>
          <HeroSelect allowClear />
        </Form.Item>
      )}
    </ListFiltersForm>
  );
};
