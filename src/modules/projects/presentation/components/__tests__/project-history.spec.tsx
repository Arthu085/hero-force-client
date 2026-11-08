import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { ConfigProvider, theme } from 'antd';
import { afterEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { httpClient } from '@/core/http/http-client';
import i18n from '@/core/i18n/i18n.config';
import { createMatchMedia } from '@/test/match-media';
import { stubHttpRoutes, type StubResponse } from '@/test/http-stub';
import type { ProjectHistoryEntry } from '../../../domain/project-history.schema';
import { ProjectHistory } from '../project-history';

const progressEvent: ProjectHistoryEntry = {
  uuid: 'progress-event',
  type: 'GOAL_PROGRESS_CHANGED',
  createdAt: '2026-01-02T12:00:00.000Z',
  actor: { uuid: 'actor', name: 'Ada Lovelace' },
  goal: 'AGILITY',
  previousValues: { progress: 20 },
  newValues: { progress: 70 },
};

const creationEvent: ProjectHistoryEntry = {
  ...progressEvent,
  uuid: 'creation-event',
  type: 'PROJECT_CREATED',
  createdAt: '2026-01-01T12:00:00.000Z',
  goal: null,
  previousValues: null,
  newValues: {
    name: 'Web Shooter',
    description: 'Build a better web shooter.',
    responsible: { uuid: 'peter', name: 'Peter Parker' },
  },
};

const response = (
  entries: ProjectHistoryEntry[],
  { page = 1, total = entries.length } = {},
): StubResponse => ({
  status: 200,
  data: { data: entries, meta: { page, total, limit: 20 } },
});

const renderHistory = ({ dark = false } = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const content = (uuid: string) => (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        theme={{
          algorithm: dark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        }}
      >
        <ProjectHistory projectUuid={uuid} />
      </ConfigProvider>
    </QueryClientProvider>
  );
  const rendered = render(content('project-one'));

  return {
    queryClient,
    switchProject: () => rendered.rerender(content('project-two')),
  };
};

afterEach(async () => {
  await i18n.changeLanguage('pt-BR');
  window.matchMedia = createMatchMedia(1280);
});

describe('ProjectHistory', () => {
  it.each(['pt-BR', 'en'])(
    'shows localized event labels, actors, dates, and changes in %s',
    async (language) => {
      await i18n.changeLanguage(language);
      const events: ProjectHistoryEntry[] = [
        progressEvent,
        {
          ...progressEvent,
          uuid: 'description-event',
          type: 'GOAL_DESCRIPTION_CHANGED',
          previousValues: { description: 'Ship weekly' },
          newValues: { description: null },
          actor: null,
        },
        {
          ...creationEvent,
          uuid: 'reassignment-event',
          type: 'RESPONSIBLE_HERO_CHANGED',
          previousValues: {
            responsible: { uuid: 'grace', name: 'Grace Hopper' },
          },
          newValues: { responsible: { uuid: 'peter', name: 'Peter Parker' } },
        },
        {
          ...creationEvent,
          uuid: 'name-event',
          type: 'PROJECT_NAME_CHANGED',
          previousValues: { name: 'Old name' },
          newValues: { name: 'Web Shooter' },
        },
        {
          ...creationEvent,
          uuid: 'project-description-event',
          type: 'PROJECT_DESCRIPTION_CHANGED',
          previousValues: { description: 'Old description' },
          newValues: { description: 'New description' },
        },
        {
          ...creationEvent,
          uuid: 'deleted-event',
          type: 'PROJECT_DELETED',
          previousValues: creationEvent.newValues,
          newValues: null,
        },
        creationEvent,
      ];
      stubHttpRoutes(httpClient, {
        'GET /projects/project-one/history': response(events),
      });
      renderHistory();

      expect(await screen.findByText('20% → 70%')).toBeInTheDocument();
      for (const event of events) {
        expect(
          screen.getByText(i18n.t(`projects.history.events.${event.type}`), {
            exact: !event.goal,
          }),
        ).toBeInTheDocument();
      }
      expect(
        screen.getByText(
          `Ship weekly → ${i18n.t('projects.goals.noDescription')}`,
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Grace Hopper → Peter Parker'),
      ).toBeInTheDocument();
      expect(screen.getByText('Old name → Web Shooter')).toBeInTheDocument();
      expect(
        screen.getByText('Old description → New description'),
      ).toBeInTheDocument();
      expect(
        screen.getAllByText(
          i18n.t('projects.history.actor', { name: 'Ada Lovelace' }),
          { exact: false },
        ),
      ).toHaveLength(6);
      expect(
        screen.getByText(
          i18n.t('projects.history.actor', {
            name: i18n.t('projects.history.removedActor'),
          }),
          { exact: false },
        ),
      ).toBeInTheDocument();
      const dates = [...document.querySelectorAll('time')];
      expect(dates[0]).toHaveAttribute('datetime', progressEvent.createdAt);
      expect(dates[0]).toHaveTextContent(
        new Date(progressEvent.createdAt).toLocaleString(language),
      );
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    },
  );

  it('loads older events, deduplicates overlapping pages, and stops at the total', async () => {
    const requests = stubHttpRoutes(httpClient, {
      'GET /projects/project-one/history': (config) => {
        const { page, limit } = z
          .object({ page: z.number(), limit: z.number() })
          .parse(config.params);
        expect(limit).toBe(20);
        return page === 1
          ? response([progressEvent], { total: 21 })
          : response([progressEvent, creationEvent], { total: 21, page });
      },
    });
    renderHistory();
    fireEvent.click(
      await screen.findByRole('button', {
        name: i18n.t('projects.history.loadMore'),
      }),
    );

    expect(await screen.findByText('Web Shooter')).toBeInTheDocument();
    expect(screen.getByText('20% → 70%')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: i18n.t('projects.history.loadMore'),
      }),
    ).not.toBeInTheDocument();
    expect(requests).toHaveLength(2);
    const dates = [...document.querySelectorAll('time')];
    expect(dates.map((date) => date.getAttribute('datetime'))).toEqual([
      progressEvent.createdAt,
      creationEvent.createdAt,
    ]);
  });

  it('shows an initial loading state', () => {
    httpClient.defaults.adapter = () => new Promise(() => {});
    renderHistory();

    expect(
      screen.getByRole('status', { name: i18n.t('projects.history.loading') }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(i18n.t('projects.history.empty')),
    ).not.toBeInTheDocument();
  });

  it.each([false, true])(
    'shows the empty state in dark mode %s on a narrow screen',
    async (dark) => {
      window.matchMedia = createMatchMedia(375);
      stubHttpRoutes(httpClient, {
        'GET /projects/project-one/history': response([]),
      });
      renderHistory({ dark });

      expect(
        await screen.findByText(i18n.t('projects.history.empty')),
      ).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    },
  );

  it('retries an initial API failure', async () => {
    let failed = true;
    stubHttpRoutes(httpClient, {
      'GET /projects/project-one/history': () =>
        failed
          ? { status: 500, data: { message: 'History unavailable' } }
          : response([progressEvent]),
    });
    renderHistory();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'History unavailable',
    );
    expect(
      screen.queryByText(i18n.t('projects.history.empty')),
    ).not.toBeInTheDocument();
    failed = false;
    fireEvent.click(
      screen.getByRole('button', { name: i18n.t('projects.history.retry') }),
    );
    expect(await screen.findByText('20% → 70%')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('keeps loaded events when pagination fails and retries the failed page', async () => {
    let failed = true;
    stubHttpRoutes(httpClient, {
      'GET /projects/project-one/history': (config) => {
        const { page } = z.object({ page: z.number() }).parse(config.params);
        if (page === 1) return response([progressEvent], { total: 21 });
        return failed
          ? { status: 500, data: { message: 'Older events unavailable' } }
          : response([creationEvent], { total: 21, page });
      },
    });
    renderHistory();
    fireEvent.click(
      await screen.findByRole('button', {
        name: i18n.t('projects.history.loadMore'),
      }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Older events unavailable',
    );
    expect(screen.getByText('20% → 70%')).toBeInTheDocument();
    failed = false;
    fireEvent.click(
      screen.getByRole('button', { name: i18n.t('projects.history.retry') }),
    );
    expect(await screen.findByText('Web Shooter')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('does not retain another project’s entries when the project changes', async () => {
    const requests = stubHttpRoutes(httpClient, {
      'GET /projects/project-one/history': response([progressEvent]),
      'GET /projects/project-two/history': response([creationEvent]),
    });
    const { switchProject } = renderHistory();
    await screen.findByText('20% → 70%');
    switchProject();

    expect(screen.queryByText('20% → 70%')).not.toBeInTheDocument();
    expect(await screen.findByText('Web Shooter')).toBeInTheDocument();
    expect(requests).toHaveLength(2);
  });

  it('refreshes the timeline when the existing project query family is invalidated', async () => {
    let events: ProjectHistoryEntry[] = [creationEvent];
    stubHttpRoutes(httpClient, {
      'GET /projects/project-one/history': () => response(events),
    });
    const { queryClient } = renderHistory();
    await screen.findByText('Web Shooter');
    events = [progressEvent, creationEvent];

    await act(() => queryClient.invalidateQueries({ queryKey: ['projects'] }));
    await waitFor(() =>
      expect(screen.getByText('20% → 70%')).toBeInTheDocument(),
    );
  });
});
