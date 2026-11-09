import { describe, expect, it } from 'vitest';
import {
  buildGoalProgressChart,
  clampProgress,
  progressAt,
} from '../goal-progress-chart';
import type {
  GoalProgressChange,
  ProjectGoalProgress,
} from '../project-goal-progress.schema';
import { type ProjectGoal, projectGoalTypeSchema } from '../project.schema';

const time = (value: string) => new Date(value).getTime();

const progressResponse = ({
  recordedFrom = '2026-01-01T00:00:00.000Z',
  start = 0,
  changes = {},
}: {
  recordedFrom?: string | null;
  start?: number;
  changes?: Partial<Record<ProjectGoal['goal'], GoalProgressChange[]>>;
} = {}): ProjectGoalProgress => ({
  period: '30d',
  from: '2026-01-01T00:00:00.000Z',
  to: '2026-01-31T00:00:00.000Z',
  recordedFrom,
  goals: projectGoalTypeSchema.options.map((goal) => ({
    goal,
    goalLabel: goal,
    startProgress: recordedFrom === null ? null : start,
    currentProgress: changes[goal]?.at(-1)?.progress ?? start,
    changes: changes[goal] ?? [],
  })),
});

describe('buildGoalProgressChart', () => {
  it('builds step points from the start value through each change to the end', () => {
    const chart = buildGoalProgressChart(
      progressResponse({
        changes: {
          AGILITY: [
            {
              at: '2026-01-05T00:00:00.000Z',
              previousProgress: 0,
              progress: 30,
            },
            {
              at: '2026-01-20T00:00:00.000Z',
              previousProgress: 30,
              progress: 80,
            },
          ],
        },
      }),
    );

    expect(chart.unknownRange).toBeNull();
    expect(chart.lines.map(({ goal }) => goal)).toEqual(
      projectGoalTypeSchema.options,
    );
    expect(chart.lines[0].points).toEqual([
      { time: time('2026-01-01T00:00:00.000Z'), progress: 0 },
      { time: time('2026-01-05T00:00:00.000Z'), progress: 30 },
      { time: time('2026-01-20T00:00:00.000Z'), progress: 80 },
      { time: time('2026-01-31T00:00:00.000Z'), progress: 80 },
    ]);
    expect(chart.lines[1].points).toEqual([
      { time: time('2026-01-01T00:00:00.000Z'), progress: 0 },
      { time: time('2026-01-31T00:00:00.000Z'), progress: 0 },
    ]);
    expect(chart.instants).toEqual([
      time('2026-01-01T00:00:00.000Z'),
      time('2026-01-05T00:00:00.000Z'),
      time('2026-01-20T00:00:00.000Z'),
      time('2026-01-31T00:00:00.000Z'),
    ]);
  });

  it('carries a known start value forward for unchanged goals', () => {
    const chart = buildGoalProgressChart(progressResponse({ start: 45 }));

    expect(chart.changes).toEqual([]);
    for (const line of chart.lines) {
      expect(line.points.map(({ progress }) => progress)).toEqual([45, 45]);
    }
  });

  it('keeps every change at the same timestamp in order and reports the final value there', () => {
    const at = '2026-01-10T00:00:00.000Z';
    const chart = buildGoalProgressChart(
      progressResponse({
        changes: {
          AGILITY: [
            { at, previousProgress: 0, progress: 50 },
            { at, previousProgress: 50, progress: 20 },
          ],
          DELIGHT: [{ at, previousProgress: 0, progress: 10 }],
        },
      }),
    );
    const [agility] = chart.lines;

    expect(agility.points.map(({ progress }) => progress)).toEqual([
      0, 50, 20, 20,
    ]);
    expect(progressAt(agility, time(at))).toBe(20);
    expect(progressAt(agility, time(at) - 1)).toBe(0);
    expect(
      chart.instants.filter((instant) => instant === time(at)),
    ).toHaveLength(1);
    expect(
      chart.changes.map(({ goal, previousProgress, progress }) => [
        goal,
        previousProgress,
        progress,
      ]),
    ).toEqual([
      ['AGILITY', 0, 50],
      ['AGILITY', 50, 20],
      ['DELIGHT', 0, 10],
    ]);
  });

  it('marks the period before tracking began as unknown for legacy projects', () => {
    const chart = buildGoalProgressChart(
      progressResponse({
        recordedFrom: '2026-01-15T00:00:00.000Z',
        start: 60,
        changes: {
          EXCELLENCE: [
            {
              at: '2026-01-15T00:00:00.000Z',
              previousProgress: 60,
              progress: 70,
            },
          ],
        },
      }),
    );

    expect(chart.unknownRange).toEqual({
      start: time('2026-01-01T00:00:00.000Z'),
      end: time('2026-01-15T00:00:00.000Z'),
    });
    const excellence = chart.lines[3];
    expect(progressAt(excellence, time('2026-01-10T00:00:00.000Z'))).toBeNull();
    expect(excellence.points.map(({ progress }) => progress)).toEqual([
      60, 70, 70,
    ]);
    expect(chart.instants[0]).toBe(time('2026-01-15T00:00:00.000Z'));
  });

  it('treats the whole range as unknown without recorded history', () => {
    const chart = buildGoalProgressChart(
      progressResponse({ recordedFrom: null }),
    );

    expect(chart.recordedFrom).toBeNull();
    expect(chart.unknownRange).toEqual({
      start: time('2026-01-01T00:00:00.000Z'),
      end: time('2026-01-31T00:00:00.000Z'),
    });
    expect(chart.lines).toEqual([]);
    expect(chart.instants).toEqual([]);
  });

  it('extends the end of the range to a change recorded after the generation time', () => {
    const chart = buildGoalProgressChart(
      progressResponse({
        changes: {
          AMBITION: [
            {
              at: '2026-01-31T00:00:01.000Z',
              previousProgress: 0,
              progress: 5,
            },
          ],
        },
      }),
    );

    expect(chart.to).toBe(time('2026-01-31T00:00:01.000Z'));
    expect(chart.lines[5].points.at(-1)).toEqual({
      time: time('2026-01-31T00:00:01.000Z'),
      progress: 5,
    });
  });

  it('clamps progress to the 0–100 range', () => {
    expect([clampProgress(-5), clampProgress(42), clampProgress(130)]).toEqual([
      0, 42, 100,
    ]);
  });
});
