import { useMemo } from 'react';
import { runSearch } from '../../utils/search';
import { useDebouncedValue } from '../../utils/useDebouncedValue';

export function useAppSearch(query: string, includePdfHits: boolean) {
  const debouncedQuery = useDebouncedValue(query, 180);
  const results = useMemo(
    () => runSearch(debouncedQuery, { includePdfHits }),
    [debouncedQuery, includePdfHits],
  );
  return { debouncedQuery, isUpdating: debouncedQuery !== query, results };
}
