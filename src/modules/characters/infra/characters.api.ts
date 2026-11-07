import { z } from 'zod';
import { parseApiData } from '@/core/http/api-envelope';
import { httpClient } from '@/core/http/http-client';
import { type Character, characterSchema } from '../domain/character.schema';

export const fetchCharacters = async (): Promise<Character[]> => {
  const response = await httpClient.get<unknown>('/characters');

  return parseApiData(z.array(characterSchema), response.data);
};
