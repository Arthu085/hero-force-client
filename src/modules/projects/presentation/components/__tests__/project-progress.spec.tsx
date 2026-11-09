import { render, screen } from '@testing-library/react';
import type { ProgressProps } from 'antd';
import { describe, expect, it } from 'vitest';
import { PROJECT_PROGRESS_MAX } from '../../../domain/project.schema';
import { ProjectProgress } from '../project-progress';

const label = 'Goal progress';
const types: ProgressProps['type'][] = ['line', 'circle'];

describe('ProjectProgress', () => {
  it.each(types)('shows the percentage while in progress (%s)', (type) => {
    render(<ProjectProgress percent={42} label={label} type={type} />);

    const progress = screen.getByRole('progressbar', { name: label });
    expect(progress).toHaveTextContent('42%');
    expect(progress).not.toHaveClass('ant-progress-status-success');
  });

  it.each(types)(
    'shows the percentage instead of an icon when complete (%s)',
    (type) => {
      render(
        <ProjectProgress
          percent={PROJECT_PROGRESS_MAX}
          label={label}
          type={type}
        />,
      );

      const progress = screen.getByRole('progressbar', { name: label });
      expect(progress).toHaveTextContent(`${PROJECT_PROGRESS_MAX}%`);
      expect(progress).toHaveClass('ant-progress-status-success');
    },
  );
});
