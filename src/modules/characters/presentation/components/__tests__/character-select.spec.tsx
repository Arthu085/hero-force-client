import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Form } from 'antd';
import { describe, expect, it } from 'vitest';
import { httpClient } from '@/core/http/http-client';
import {
  batman,
  characterCatalog,
  hellboy,
  spiderMan,
} from '@/test/characters';
import { stubHttpRoutes, type StubResponse } from '@/test/http-stub';
import { CharacterSelect } from '../character-select';

const renderSelect = ({
  initialCode = null,
  response = { status: 200, data: { data: characterCatalog, meta: {} } },
}: { initialCode?: string | null; response?: StubResponse } = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  stubHttpRoutes(httpClient, { 'GET /characters': response });
  const values: (string | null)[] = [];
  render(
    <QueryClientProvider client={queryClient}>
      <Form
        initialValues={{ characterCode: initialCode }}
        onValuesChange={(_, all: { characterCode: string | null }) =>
          values.push(all.characterCode)
        }
      >
        <Form.Item name="characterCode" label="Character">
          <CharacterSelect />
        </Form.Item>
      </Form>
    </QueryClientProvider>,
  );
  return { values };
};

const combobox = () => screen.getByRole('combobox', { name: 'Character' });

describe('CharacterSelect', () => {
  it('lists the catalog grouped by the API group and selects a character', async () => {
    const { values } = renderSelect();
    await waitFor(() => expect(combobox()).toBeEnabled());

    fireEvent.mouseDown(combobox());

    await screen.findByTitle(spiderMan.groupLabel);
    const items = [
      ...document.querySelectorAll<HTMLElement>(
        '.ant-select-item-group, .ant-select-item-option',
      ),
    ].map((item) => item.title);
    expect(items).toEqual([
      spiderMan.groupLabel,
      spiderMan.name,
      batman.groupLabel,
      batman.name,
      hellboy.groupLabel,
      hellboy.name,
    ]);
    expect(
      screen.getByTitle(hellboy.name).querySelector('img'),
    ).toHaveAttribute('src', hellboy.avatarPath);
    fireEvent.click(screen.getByTitle(spiderMan.name));

    expect(values).toEqual([spiderMan.code]);
  });

  it('clears the selection to null', async () => {
    const { values } = renderSelect({ initialCode: spiderMan.code });
    await waitFor(() =>
      expect(document.querySelector('.ant-select-content')).toHaveTextContent(
        spiderMan.name,
      ),
    );

    const clear = document.querySelector('.ant-select-clear');
    if (!clear) throw new Error('Clear button is missing');
    fireEvent.mouseDown(clear);
    fireEvent.mouseUp(clear);
    fireEvent.click(clear);

    await waitFor(() => expect(values).toEqual([null]));
  });

  it('shows the API failure and disables the select', async () => {
    renderSelect({
      response: { status: 500, data: { message: 'Catalog unavailable.' } },
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Catalog unavailable.',
    );
    expect(combobox()).toBeDisabled();
  });
});
