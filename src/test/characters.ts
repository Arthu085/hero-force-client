import type { Character } from '@/modules/characters/domain/character.schema';

export const spiderMan: Character = {
  code: 'SPIDER_MAN',
  name: 'Spider-Man',
  universe: 'MARVEL',
  universeLabel: 'Marvel',
  avatarPath: '/characters/spider-man.svg',
};

export const hellboy: Character = {
  code: 'HELLBOY',
  name: 'Hellboy',
  universe: 'DARK_HORSE',
  universeLabel: 'Dark Horse',
  avatarPath: null,
};

export const characterCatalog = [spiderMan, hellboy];
