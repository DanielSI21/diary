import { useCallback, useEffect, useState } from 'react';
import type { EntryWithTag } from '../types';
import { listEntries } from '../services/entries';

export function useEntries(day: string) {
  const [entries, setEntries] = useState<EntryWithTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setEntries(await listEntries(day));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [day]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { entries, loading, error, refresh };
}
