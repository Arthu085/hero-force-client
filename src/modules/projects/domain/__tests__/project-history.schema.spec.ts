import { describe, expect, it } from 'vitest';
import { projectHistoryEntrySchema } from '../project-history.schema';

const entry = {
  uuid: 'history-event',
  type: 'GOAL_PROGRESS_CHANGED',
  createdAt: '2026-01-02T12:00:00.000Z',
  actor: { uuid: 'actor', name: 'Ada' },
  goal: 'AGILITY',
  previousValues: { progress: 20 },
  newValues: { progress: 70 },
};

describe('project history response schema', () => {
  it('parses percentages and strips unrelated user data', () => {
    expect(
      projectHistoryEntrySchema.parse({
        ...entry,
        actor: { ...entry.actor, email: 'private@example.com', roles: [] },
      }),
    ).toEqual(entry);
  });

  it('accepts a removed actor and a cleared goal description', () => {
    expect(
      projectHistoryEntrySchema.parse({
        ...entry,
        type: 'GOAL_DESCRIPTION_CHANGED',
        actor: null,
        previousValues: { description: 'Ship weekly' },
        newValues: { description: null },
      }).newValues,
    ).toEqual({ description: null });
  });

  it.each([
    { type: 'AUDIT_LOG' },
    { goal: null },
    { previousValues: null },
    { previousValues: {} },
    { newValues: null },
    { newValues: {} },
    { createdAt: 'yesterday' },
    { goal: 'UNKNOWN_GOAL' },
    { newValues: { progress: 101 } },
    { newValues: { progress: -1 } },
    { newValues: { progress: 20.5 } },
  ])('rejects malformed event values %j', (invalid) => {
    expect(
      projectHistoryEntrySchema.safeParse({ ...entry, ...invalid }).success,
    ).toBe(false);
  });
});
