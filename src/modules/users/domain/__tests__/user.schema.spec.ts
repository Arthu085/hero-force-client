import { describe, expect, it } from 'vitest';
import { spiderMan } from '@/test/characters';
import { formatUserDisplayName } from '../user.schema';

describe('formatUserDisplayName', () => {
  it('adds the character name when the user has a character', () => {
    expect(
      formatUserDisplayName({ name: 'Ada Lovelace', character: spiderMan }),
    ).toBe('Ada Lovelace (Spider-Man)');
  });

  it('shows only the real name without a character', () => {
    expect(
      formatUserDisplayName({ name: 'Ada Lovelace', character: null }),
    ).toBe('Ada Lovelace');
  });
});
