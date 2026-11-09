import type { ThemeMode } from '@/core/config/theme.config';
import { useThemeMode } from '@/core/theme/use-theme-mode';
import type { ProjectGoal } from '../../domain/project.schema';

type ProjectGoalType = ProjectGoal['goal'];

export interface GoalSeriesStyle {
  color: string;
  dash: string | undefined;
}

const seriesColors: Record<ThemeMode, Record<ProjectGoalType, string>> = {
  light: {
    AGILITY: '#2a78d6',
    DELIGHT: '#eb6834',
    EFFICIENCY: '#1baf7a',
    EXCELLENCE: '#eda100',
    TRANSPARENCY: '#e87ba4',
    AMBITION: '#008300',
  },
  dark: {
    AGILITY: '#3987e5',
    DELIGHT: '#d95926',
    EFFICIENCY: '#199e70',
    EXCELLENCE: '#c98500',
    TRANSPARENCY: '#d55181',
    AMBITION: '#008300',
  },
};

const seriesDashes: Record<ProjectGoalType, string | undefined> = {
  AGILITY: undefined,
  DELIGHT: '8 4',
  EFFICIENCY: '2 4',
  EXCELLENCE: '10 4 2 4',
  TRANSPARENCY: '4 4',
  AMBITION: '14 4 2 4 2 4',
};

export const useGoalSeriesStyle = () => {
  const colors = seriesColors[useThemeMode()];

  return (goal: ProjectGoalType): GoalSeriesStyle => ({
    color: colors[goal],
    dash: seriesDashes[goal],
  });
};
