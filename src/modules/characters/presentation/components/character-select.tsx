import { Alert, Flex, Select, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import { getApiErrorMessage } from '@/core/http/api-error';
import { InitialsAvatar } from '@/shared/components/initials-avatar';
import type { Character } from '../../domain/character.schema';
import { useCharacters } from '../../infra/characters.queries';

interface CharacterSelectProps {
  id?: string;
  value?: string | null;
  onChange?: (value: string | null) => void;
  disabled?: boolean;
}

interface CharacterGroup {
  label: string;
  title: string;
  options: { value: string; label: string }[];
}

const groupCharacters = (characters: Character[]) => {
  const groups = new Map<string, CharacterGroup>();

  for (const { code, name, group: key, groupLabel } of characters) {
    const group = groups.get(key) ?? {
      label: groupLabel,
      title: groupLabel,
      options: [],
    };

    group.options.push({ value: code, label: name });
    groups.set(key, group);
  }

  return [...groups.values()];
};

export const CharacterSelect = ({
  id,
  value,
  onChange,
  disabled,
}: CharacterSelectProps) => {
  const { t } = useTranslation();
  const { data: characters = [], isPending, error } = useCharacters();
  const charactersByCode = new Map(
    characters.map((character) => [character.code, character]),
  );

  return (
    <Flex vertical gap="small">
      <Select<string>
        id={id}
        value={value ?? undefined}
        onChange={(code) => onChange?.(code ?? null)}
        disabled={disabled || isPending || !!error}
        loading={isPending}
        status={error ? 'error' : undefined}
        allowClear
        showSearch={{ optionFilterProp: 'label' }}
        placeholder={t('characters.select.placeholder')}
        options={groupCharacters(characters)}
        optionRender={({ value, label }) => {
          const character = charactersByCode.get(String(value));

          return (
            <Space>
              <InitialsAvatar
                size="small"
                name={character?.name ?? ''}
                src={character?.avatarPath}
              />
              {label}
            </Space>
          );
        }}
      />
      {error && (
        <Alert type="error" showIcon title={getApiErrorMessage(error)} />
      )}
    </Flex>
  );
};
