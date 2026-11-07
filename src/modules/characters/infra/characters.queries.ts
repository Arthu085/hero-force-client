import { queryOptions, useQuery } from '@tanstack/react-query';
import { fetchCharacters } from './characters.api';

export const charactersQuery = queryOptions({
  queryKey: ['characters'],
  queryFn: fetchCharacters,
  staleTime: Infinity,
});

export const useCharacters = () => useQuery(charactersQuery);
