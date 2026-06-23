import { useCallback, useEffect, useState } from 'react';
import type { Tag } from '../types';
import { listTags } from '../services/tags';

export function useTags(includeInactive = false) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setTags(await listTags(includeInactive));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [includeInactive]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { tags, loading, error, refresh };
}
