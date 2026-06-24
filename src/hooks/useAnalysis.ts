import { useCallback, useEffect, useState } from 'react';
import type { Analysis } from '../types';
import { deleteAnalysis, getAnalysis, saveAnalysis } from '../services/analyses';

/** Análisis guardado de un día (cargar, guardar, borrar). */
export function useAnalysis(day: string) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setAnalysis(await getAnalysis(day));
    } catch {
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  }, [day]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const save = useCallback(
    async (text: string) => {
      setAnalysis(await saveAnalysis(day, text));
    },
    [day],
  );

  const remove = useCallback(async () => {
    await deleteAnalysis(day);
    setAnalysis(null);
  }, [day]);

  return { analysis, loading, refresh, save, remove };
}
