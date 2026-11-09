import { describe, expect, it } from 'vitest';
import {
  goalProgressPeriodSchema,
  projectGoalProgressSchema,
} from '../project-goal-progress.schema';
import { projectGoalTypeSchema } from '../project.schema';

const response = {
  period: '30d',
  from: '2026-01-01T00:00:00.000Z',
  to: '2026-01-31T00:00:00.000Z',
  recordedFrom: '2026-01-01T00:00:00.000Z',
  goals: projectGoalTypeSchema.options.map((goal) => ({
    goal,
    goalLabel: goal,
    startProgress: 0,
    currentProgress: goal === 'AGILITY' ? 40 : 0,
    changes:
      goal === 'AGILITY'
        ? [
            {
              at: '2026-01-10T12:00:00.000Z',
              previousProgress: 0,
              progress: 40,
            },
          ]
        : [],
  })),
};

describe('project goal progress response schema', () => {
  it('parses the six goal series', () => {
    const parsed = projectGoalProgressSchema.parse(response);

    expect(parsed.goals).toHaveLength(6);
    expect(parsed.goals[0].changes).toEqual([
      { at: '2026-01-10T12:00:00.000Z', previousProgress: 0, progress: 40 },
    ]);
  });

  it('accepts a project without recorded history', () => {
    expect(
      projectGoalProgressSchema.safeParse({
        ...response,
        recordedFrom: null,
        goals: response.goals.map((goal) => ({
          ...goal,
          startProgress: null,
          changes: [],
        })),
      }).success,
    ).toBe(true);
  });

  it.each([
    { period: '1y' },
    { from: 'yesterday' },
    { recordedFrom: 'unknown' },
    { recordedFrom: null },
    {
      goals: response.goals.map((goal) => ({ ...goal, startProgress: null })),
    },
    {
      goals: response.goals.map((goal) => ({ ...goal, currentProgress: 101 })),
    },
    {
      goals: response.goals.map((goal) => ({
        ...goal,
        changes: [
          {
            at: '2026-01-10T12:00:00.000Z',
            previousProgress: 0,
            progress: 20.5,
          },
        ],
      })),
    },
    { goals: [{ ...response.goals[0], goal: 'UNKNOWN_GOAL' }] },
  ])('rejects malformed values %j', (invalid) => {
    expect(
      projectGoalProgressSchema.safeParse({ ...response, ...invalid }).success,
    ).toBe(false);
  });

  it('lists the supported periods in display order', () => {
    expect(goalProgressPeriodSchema.options).toEqual([
      '7d',
      '30d',
      '90d',
      'all',
    ]);
  });
});
