import { env } from '@/core/config/env.config';
import { useThemeMode } from '@/core/theme/use-theme-mode';

type BrandLogoProps = {
  compact?: boolean;
};

export const BrandLogo = ({ compact = false }: BrandLogoProps) => {
  const mode = useThemeMode();
  const variant = compact ? 'logo-icon' : 'logo';
  const suffix = mode === 'dark' ? '-white' : '';

  return (
    <img
      src={`/${variant}${suffix}.svg`}
      alt={env.appName}
      width={compact ? 40 : 192}
      height={compact ? 40 : 48}
      style={{
        display: 'block',
        minWidth: 0,
        maxWidth: '100%',
        objectFit: 'contain',
      }}
    />
  );
};
