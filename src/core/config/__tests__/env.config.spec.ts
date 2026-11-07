import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('browser environment startup', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('VITE_APP_NAME', 'Hero Force');
    vi.stubEnv('VITE_APP_MARK', 'HF');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each([
    ['https://hero.example.com///', 'https://hero.example.com'],
    ['http://localhost:3000/', 'http://localhost:3000'],
  ])('starts with the normalized origin %s', async (value, origin) => {
    vi.stubEnv('VITE_API_URL', value);

    const { env } = await import('../env.config');

    expect(env.apiUrl).toBe(origin);
  });

  it.each([
    'https://hero.example.com/api',
    'http://hero.example.com',
    'https://user:password@hero.example.com',
    'https://hero.example.com?preview=true',
    'https://hero.example.com#section',
    'ftp://hero.example.com',
  ])('rejects %s before startup', async (value) => {
    vi.stubEnv('VITE_API_URL', value);

    await expect(import('../env.config')).rejects.toThrow(/VITE_API_URL/);
  });
});
