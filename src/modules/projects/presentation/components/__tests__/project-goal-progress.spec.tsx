import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { ConfigProvider, theme } from 'antd';
import { afterEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { httpClient } from '@/core/http/http-client';
import i18n from '@/core/i18n/i18n.config';
import { stubHttpRoutes, type StubResponse } from '@/test/http-stub';
import type {
  GoalProgressChange,
  ProjectGoalProgress as ProjectGoalProgressData,
} from '../../../domain/project-goal-progress.schema';
import {
  type ProjectGoal,
  projectGoalTypeSchema,
} from '../../../domain/project.schema';
import { ProjectGoalProgress } from '../project-goal-progress';

const route = 'GET /projects/project-one/history/goal-progress';
const firstChange = '2026-01-05T12:00:00.000Z';
const secondChange = '2026-01-20T12:00:00.000Z';

const progressData = ({
  period = '30d',
  recordedFrom = '2026-01-01T00:00:00.000Z',
  changes = {
    AGILITY: [
      { at: firstChange, previousProgress: 0, progress: 30 },
      { at: secondChange, previousProgress: 30, progress: 80 },
    ],
  },
}: {
  period?: ProjectGoalProgressData['period'];
  recordedFrom?: string | null;
  changes?: Partial<Record<ProjectGoal['goal'], GoalProgressChange[]>>;
} = {}): ProjectGoalProgressData => ({
  period,
  from: '2026-01-01T00:00:00.000Z',
  to: '2026-01-31T00:00:00.000Z',
  recordedFrom,
  goals: projectGoalTypeSchema.options.map((goal) => ({
    goal,
    goalLabel: goal,
    startProgress: recordedFrom === null ? null : 0,
    currentProgress: changes[goal]?.at(-1)?.progress ?? 0,
    changes: changes[goal] ?? [],
  })),
});

const response = (data: ProjectGoalProgressData): StubResponse => ({
  status: 200,
  data: { data, meta: {} },
});

const periodOf = (config: { params?: unknown }) =>
  z.object({ period: z.string() }).parse(config.params).period;

const renderProgress = ({ dark = false } = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        theme={{
          algorithm: dark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        }}
      >
        <ProjectGoalProgress projectUuid="project-one" />
      </ConfigProvider>
    </QueryClientProvider>,
  );

  return { queryClient };
};

const goalName = (goal: ProjectGoal['goal']) =>
  i18n.t(`projects.goalTypes.${goal}`);

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString(i18n.language, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

const findChart = () =>
  screen.findByRole('group', {
    name: i18n.t('projects.goalProgress.chartLabel'),
  });

const readout = () =>
  screen
    .getAllByRole('status')
    .find((element) => element.getAttribute('aria-live') === 'polite');

const expectedReadout = (
  date: string,
  values: [ProjectGoal['goal'], number][],
) =>
  i18n.t('projects.goalProgress.readout', {
    date: formatDateTime(date),
    values: values
      .map(([goal, progress]) => `${goalName(goal)} ${progress}%`)
      .join(', '),
  });

const legendButton = (goal: ProjectGoal['goal']) =>
  within(
    screen.getByRole('group', { name: i18n.t('projects.goalProgress.legend') }),
  ).getByRole('button', { name: goalName(goal) });

const OriginalResizeObserver = window.ResizeObserver;

afterEach(async () => {
  await i18n.changeLanguage('pt-BR');
  window.ResizeObserver = OriginalResizeObserver;
});

describe('ProjectGoalProgress', () => {
  it.each(['pt-BR', 'en'])(
    'shows the localized chart, period options, and six goals in %s',
    async (language) => {
      await i18n.changeLanguage(language);
      const requests = stubHttpRoutes(httpClient, {
        [route]: response(progressData()),
      });
      renderProgress();

      expect(await findChart()).toBeInTheDocument();
      expect(
        screen.getByText(i18n.t('projects.goalProgress.title')),
      ).toBeInTheDocument();
      expect(periodOf(requests[0])).toBe('30d');
      for (const period of ['7d', '30d', '90d', 'all'] as const) {
        expect(
          screen.getByText(i18n.t(`projects.goalProgress.periods.${period}`)),
        ).toBeInTheDocument();
      }
      for (const goal of projectGoalTypeSchema.options) {
        expect(legendButton(goal)).toHaveAttribute('aria-pressed', 'true');
      }
      expect(
        screen.getByRole('img', {
          name: i18n.t('projects.goalProgress.chartSummary', {
            from: formatDateTime('2026-01-01T00:00:00.000Z'),
            to: formatDateTime('2026-01-31T00:00:00.000Z'),
          }),
        }),
      ).toBeInTheDocument();
      expect(document.querySelectorAll('path')).toHaveLength(6);
      expect(
        screen.queryByText(i18n.t('projects.goalProgress.noChanges')),
      ).not.toBeInTheDocument();
    },
  );

  it('requests the selected period', async () => {
    const requests = stubHttpRoutes(httpClient, {
      [route]: (config) =>
        response(
          progressData({
            period: z.enum(['7d', '30d', '90d', 'all']).parse(periodOf(config)),
          }),
        ),
    });
    renderProgress();
    await findChart();

    for (const period of ['7d', '90d', 'all', '30d'] as const) {
      fireEvent.click(
        screen.getByText(i18n.t(`projects.goalProgress.periods.${period}`)),
      );
      await waitFor(() => expect(periodOf(requests.at(-1) ?? {})).toBe(period));
    }
    expect(requests.map(periodOf)).toEqual(['30d', '7d', '90d', 'all', '30d']);
  });

  it('moves between recorded instants with the keyboard and announces every visible goal', async () => {
    stubHttpRoutes(httpClient, { [route]: response(progressData()) });
    renderProgress();
    const chart = await findChart();
    const others = projectGoalTypeSchema.options
      .slice(1)
      .map((goal): [ProjectGoal['goal'], number] => [goal, 0]);

    fireEvent.keyDown(chart, { key: 'Home' });
    expect(readout()).toHaveTextContent(
      expectedReadout('2026-01-01T00:00:00.000Z', [['AGILITY', 0], ...others]),
    );
    fireEvent.keyDown(chart, { key: 'ArrowRight' });
    expect(readout()).toHaveTextContent(
      expectedReadout(firstChange, [['AGILITY', 30], ...others]),
    );
    fireEvent.keyDown(chart, { key: 'End' });
    expect(readout()).toHaveTextContent(
      expectedReadout('2026-01-31T00:00:00.000Z', [['AGILITY', 80], ...others]),
    );
    fireEvent.keyDown(chart, { key: 'ArrowLeft' });
    expect(readout()).toHaveTextContent(
      expectedReadout(secondChange, [['AGILITY', 80], ...others]),
    );
    fireEvent.keyDown(chart, { key: 'Escape' });
    expect(readout()).toBeEmptyDOMElement();
  });

  it('snaps the crosshair to the nearest change under the pointer', async () => {
    stubHttpRoutes(httpClient, { [route]: response(progressData()) });
    renderProgress();
    await findChart();
    const hitArea = document.querySelector('svg rect[fill="transparent"]');
    if (!hitArea) throw new Error('Chart hit area not found');

    fireEvent.pointerMove(hitArea, { clientX: 130, pointerType: 'mouse' });

    expect(readout()).toHaveTextContent(formatDateTime(firstChange));
    expect(readout()).toHaveTextContent(`${goalName('AGILITY')} 30%`);
    fireEvent.pointerLeave(hitArea, { pointerType: 'mouse' });
    expect(readout()).toBeEmptyDOMElement();
  });

  it('hides and shows a goal from the legend', async () => {
    stubHttpRoutes(httpClient, { [route]: response(progressData()) });
    renderProgress();
    const chart = await findChart();

    fireEvent.click(legendButton('AGILITY'));
    expect(legendButton('AGILITY')).toHaveAttribute('aria-pressed', 'false');
    expect(document.querySelectorAll('path')).toHaveLength(5);
    fireEvent.keyDown(chart, { key: 'End' });
    expect(readout()).not.toHaveTextContent(goalName('AGILITY'));
    expect(readout()).toHaveTextContent(`${goalName('DELIGHT')} 0%`);

    fireEvent.click(legendButton('AGILITY'));
    expect(legendButton('AGILITY')).toHaveAttribute('aria-pressed', 'true');
    expect(document.querySelectorAll('path')).toHaveLength(6);
  });

  it('lists the recorded changes in a table view', async () => {
    stubHttpRoutes(httpClient, { [route]: response(progressData()) });
    renderProgress();
    await findChart();

    fireEvent.click(
      screen.getByRole('button', {
        name: i18n.t('projects.goalProgress.showTable'),
      }),
    );

    const table = screen.getByRole('table');
    expect(within(table).getByText('0% → 30%')).toBeInTheDocument();
    expect(within(table).getByText('30% → 80%')).toBeInTheDocument();
    expect(within(table).getAllByText(goalName('AGILITY'))).toHaveLength(2);
    expect(table.querySelector('time')).toHaveAttribute(
      'datetime',
      firstChange,
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: i18n.t('projects.goalProgress.hideTable'),
      }),
    );
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('separates the unrecorded period of a legacy project from recorded values', async () => {
    stubHttpRoutes(httpClient, {
      [route]: response(
        progressData({
          recordedFrom: '2026-01-15T00:00:00.000Z',
          changes: {
            DELIGHT: [{ at: secondChange, previousProgress: 0, progress: 40 }],
          },
        }),
      ),
    });
    renderProgress();
    const chart = await findChart();

    expect(
      within(chart).getByText(i18n.t('projects.goalProgress.notRecorded')),
    ).toBeInTheDocument();
    expect(
      screen.getByText(i18n.t('projects.goalProgress.unknownLegend')),
    ).toBeInTheDocument();
    fireEvent.keyDown(chart, { key: 'Home' });
    expect(readout()).toHaveTextContent(
      formatDateTime('2026-01-15T00:00:00.000Z'),
    );
  });

  it('notes a period without progress changes but still draws the known lines', async () => {
    stubHttpRoutes(httpClient, {
      [route]: response(progressData({ changes: {} })),
    });
    renderProgress();
    await findChart();

    expect(
      screen.getByText(i18n.t('projects.goalProgress.noChanges')),
    ).toBeInTheDocument();
    expect(document.querySelectorAll('path')).toHaveLength(6);
    expect(
      screen.queryByRole('button', {
        name: i18n.t('projects.goalProgress.showTable'),
      }),
    ).not.toBeInTheDocument();
  });

  it('shows the empty state when the project has no recorded history', async () => {
    stubHttpRoutes(httpClient, {
      [route]: response(progressData({ recordedFrom: null, changes: {} })),
    });
    renderProgress();

    expect(
      await screen.findByText(i18n.t('projects.goalProgress.empty')),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('group', {
        name: i18n.t('projects.goalProgress.chartLabel'),
      }),
    ).not.toBeInTheDocument();
  });

  it('shows an initial loading state', () => {
    httpClient.defaults.adapter = () => new Promise(() => {});
    renderProgress();

    expect(
      screen.getByRole('status', {
        name: i18n.t('projects.goalProgress.loading'),
      }),
    ).toBeInTheDocument();
  });

  it('retries an API failure', async () => {
    let failed = true;
    stubHttpRoutes(httpClient, {
      [route]: () =>
        failed
          ? { status: 500, data: { message: 'Progress unavailable' } }
          : response(progressData()),
    });
    renderProgress();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Progress unavailable',
    );
    failed = false;
    fireEvent.click(
      screen.getByRole('button', {
        name: i18n.t('projects.goalProgress.retry'),
      }),
    );
    expect(await findChart()).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('refreshes when the project query family is invalidated', async () => {
    let data = progressData({ changes: {} });
    stubHttpRoutes(httpClient, { [route]: () => response(data) });
    const { queryClient } = renderProgress();
    await screen.findByText(i18n.t('projects.goalProgress.noChanges'));
    data = progressData();

    await act(() => queryClient.invalidateQueries({ queryKey: ['projects'] }));
    await waitFor(() =>
      expect(
        screen.queryByText(i18n.t('projects.goalProgress.noChanges')),
      ).not.toBeInTheDocument(),
    );
  });

  it.each([false, true])(
    'fits a narrow container in dark mode %s',
    async (dark) => {
      window.ResizeObserver = class {
        callback: ResizeObserverCallback;
        constructor(callback: ResizeObserverCallback) {
          this.callback = callback;
        }
        observe = (target: Element) =>
          this.callback(
            [
              {
                target,
                contentRect: new DOMRectReadOnly(0, 0, 320, 0),
                borderBoxSize: [],
                contentBoxSize: [],
                devicePixelContentBoxSize: [],
              },
            ],
            this,
          );
        unobserve = () => undefined;
        disconnect = () => undefined;
      };
      stubHttpRoutes(httpClient, { [route]: response(progressData()) });
      renderProgress({ dark });
      const chart = await findChart();

      const svg = within(chart).getByRole('img');
      expect(svg).toHaveAttribute('width', '320');
      expect(svg).toHaveAttribute('height', '220');
    },
  );
});
