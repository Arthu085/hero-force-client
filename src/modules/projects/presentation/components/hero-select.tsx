import { Alert, Flex, Select, Spin } from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getApiErrorMessage } from '@/core/http/api-error';
import { formatUserDisplayName } from '@/modules/users/domain/user.schema';
import { UserAvatar } from '@/modules/users/presentation/components/user-avatar';
import type { ProjectHero } from '../../domain/project.schema';
import { useProjectHeroes } from '../../infra/projects.queries';

const HERO_OPTIONS_LIMIT = 50;

interface HeroSelectProps {
  id?: string;
  value?: string;
  onChange?: (value: string | undefined) => void;
  disabled?: boolean;
  allowClear?: boolean;
  knownHeroes?: readonly ProjectHero[];
}

export const HeroSelect = ({
  id,
  value,
  onChange,
  disabled,
  allowClear,
  knownHeroes = [],
}: HeroSelectProps) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const heroesQuery = useProjectHeroes(
    {
      page: 1,
      limit: HERO_OPTIONS_LIMIT,
      name: search.trim() || undefined,
    },
    { enabled: !disabled },
  );
  const heroes = new Map(
    [...knownHeroes, ...(heroesQuery.data?.data ?? [])].map((hero) => [
      hero.uuid,
      hero,
    ]),
  );

  return (
    <Flex vertical gap="small">
      <Select<string>
        id={id}
        value={value}
        onChange={(uuid) => onChange?.(uuid ?? undefined)}
        disabled={disabled}
        allowClear={allowClear}
        loading={heroesQuery.isFetching}
        status={heroesQuery.isError ? 'error' : undefined}
        placeholder={t('projects.heroSelect.placeholder')}
        showSearch={{
          filterOption: false,
          onSearch: setSearch,
        }}
        notFoundContent={
          heroesQuery.isPending ? <Spin size="small" /> : undefined
        }
        options={[...heroes.values()].map((hero) => ({
          value: hero.uuid,
          label: formatUserDisplayName(hero),
        }))}
        optionRender={({ value: uuid, label }) => {
          const hero = heroes.get(String(uuid));

          return (
            <Flex gap="small" align="center">
              {hero && <UserAvatar user={hero} size="small" />}
              {label}
            </Flex>
          );
        }}
        onBlur={() => setSearch('')}
      />
      {heroesQuery.isError && (
        <Alert
          type="error"
          showIcon
          title={getApiErrorMessage(heroesQuery.error)}
        />
      )}
    </Flex>
  );
};
