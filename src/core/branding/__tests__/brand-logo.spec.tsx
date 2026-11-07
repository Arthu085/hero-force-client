import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { env } from '@/core/config/env.config';
import { setThemeMode } from '@/core/theme/use-theme-mode';
import { BrandLogo } from '../brand-logo';

beforeEach(() => {
  act(() => setThemeMode('light'));
});

describe('BrandLogo', () => {
  it.each([
    [false, 'logo'],
    [true, 'logo-icon'],
  ] as const)(
    'keeps compact %s branding accessible and legible as the theme changes',
    (compact, asset) => {
      render(<BrandLogo compact={compact} />);

      const image = screen.getByRole('img', { name: env.appName });
      expect(image).toHaveAttribute('src', `/${asset}.svg`);

      act(() => setThemeMode('dark'));

      expect(image).toHaveAttribute('src', `/${asset}-white.svg`);

      act(() => setThemeMode('light'));

      expect(image).toHaveAttribute('src', `/${asset}.svg`);
    },
  );
});
