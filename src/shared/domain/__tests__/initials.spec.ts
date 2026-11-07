import { describe, expect, it } from 'vitest';
import { getInitials } from '../initials';

describe('getInitials', () => {
  it.each([
    ['Ada Lovelace', 'AL'],
    ['ada augusta king lovelace', 'AL'],
    ['  Turing  ', 'T'],
    ['', ''],
  ])('turns %j into %j', (name, initials) => {
    expect(getInitials(name)).toBe(initials);
  });
});
