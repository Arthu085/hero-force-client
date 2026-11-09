import type { ProjectGoalProgress } from './project-goal-progress.schema';
import {
  PROJECT_PROGRESS_MAX,
  PROJECT_PROGRESS_MIN,
  type ProjectGoal,
} from './project.schema';

type ProjectGoalType = ProjectGoal['goal'];

export interface GoalProgressPoint {
  time: number;
  progress: number;
}

export interface GoalProgressLine {
  goal: ProjectGoalType;
  points: GoalProgressPoint[];
}

export interface GoalProgressTimeRange {
  start: number;
  end: number;
}

export interface GoalProgressChangeRow {
  key: string;
  time: number;
  goal: ProjectGoalType;
  previousProgress: number;
  progress: number;
}

export interface GoalProgressChart {
  from: number;
  to: number;
  recordedFrom: number | null;
  unknownRange: GoalProgressTimeRange | null;
  lines: GoalProgressLine[];
  instants: number[];
  changes: GoalProgressChangeRow[];
}

export const clampProgress = (value: number) =>
  Math.min(PROJECT_PROGRESS_MAX, Math.max(PROJECT_PROGRESS_MIN, value));

const toTime = (value: string) => new Date(value).getTime();

const unknownRangeOf = (
  from: number,
  to: number,
  recordedFrom: number | null,
): GoalProgressTimeRange | null => {
  if (recordedFrom === null) return { start: from, end: to };
  return recordedFrom > from ? { start: from, end: recordedFrom } : null;
};

export const buildGoalProgressChart = (
  data: ProjectGoalProgress,
): GoalProgressChart => {
  const from = toTime(data.from);
  const changes: GoalProgressChangeRow[] = data.goals
    .flatMap(({ goal, changes: goalChanges }) =>
      goalChanges.map((change, index) => ({
        key: `${goal}-${index}`,
        time: toTime(change.at),
        goal,
        previousProgress: clampProgress(change.previousProgress),
        progress: clampProgress(change.progress),
      })),
    )
    .sort((left, right) => left.time - right.time);
  const lastChange = changes.at(-1)?.time ?? -Infinity;
  const to = Math.max(toTime(data.to), from, lastChange);
  const recordedFrom =
    data.recordedFrom === null
      ? null
      : Math.min(Math.max(toTime(data.recordedFrom), from), to);

  if (recordedFrom === null) {
    return {
      from,
      to,
      recordedFrom,
      unknownRange: unknownRangeOf(from, to, recordedFrom),
      lines: [],
      instants: [],
      changes: [],
    };
  }

  const lines = data.goals.map(({ goal, startProgress, changes }) => {
    const points: GoalProgressPoint[] = [
      {
        time: recordedFrom,
        progress: clampProgress(
          startProgress ?? changes[0]?.previousProgress ?? 0,
        ),
      },
      ...changes.map((change) => ({
        time: Math.max(toTime(change.at), recordedFrom),
        progress: clampProgress(change.progress),
      })),
    ];
    const last = points[points.length - 1];

    return { goal, points: [...points, { time: to, progress: last.progress }] };
  });

  return {
    from,
    to,
    recordedFrom,
    unknownRange: unknownRangeOf(from, to, recordedFrom),
    lines,
    instants: [
      ...new Set([recordedFrom, ...changes.map(({ time }) => time), to]),
    ].sort((left, right) => left - right),
    changes,
  };
};

export const progressAt = (
  line: GoalProgressLine,
  time: number,
): number | null => {
  let progress: number | null = null;

  for (const point of line.points) {
    if (point.time > time) break;
    progress = point.progress;
  }

  return progress;
};
