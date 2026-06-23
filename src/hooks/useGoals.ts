import { useCallback, useEffect, useState } from 'react';
import type { GoalWithTag } from '../types';
import { listGoals } from '../services/goals';

export function useGoals(day: string) {
  const [goals, setGoals] = useState<GoalWithTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setGoals(await listGoals(day));
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

  return { goals, loading, error, refresh };
}
