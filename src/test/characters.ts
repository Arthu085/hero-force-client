import type { Character } from '@/modules/characters/domain/character.schema';

export const spiderMan: Character = {
  code: 'SPIDER_MAN',
  name: 'Spider-Man',
  universe: 'MARVEL',
  universeLabel: 'Marvel',
  group: 'MARVEL',
  groupLabel: 'Marvel',
  avatarPath: '/characters/spider-man.svg',
};

export const batman: Character = {
  code: 'BATMAN',
  name: 'Batman',
  universe: 'DC',
  universeLabel: 'DC',
  group: 'DC',
  groupLabel: 'DC',
  avatarPath: '/characters/batman.svg',
};

export const hellboy: Character = {
  code: 'HELLBOY',
  name: 'Hellboy',
  universe: 'DARK_HORSE',
  universeLabel: 'Dark Horse',
  group: 'OTHERS',
  groupLabel: 'Outros',
  avatarPath: '/characters/hellboy.svg',
};

export const characterCatalog = [spiderMan, batman, hellboy];
