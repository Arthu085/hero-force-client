import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { InitialsAvatar } from '../initials-avatar';

describe('InitialsAvatar', () => {
  it('shows the image when a source is given', () => {
    const { container } = render(
      <InitialsAvatar name="Ada Lovelace" src="/characters/spider-man.svg" />,
    );

    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      '/characters/spider-man.svg',
    );
  });

  it('falls back to the initials without a source', () => {
    const { container } = render(
      <InitialsAvatar name="Ada Lovelace" src={null} />,
    );

    expect(container.querySelector('img')).toBeNull();
    expect(container).toHaveTextContent('AL');
  });
});
