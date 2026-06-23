import { useCallback, useEffect, useState } from 'react';
import type { NoteWithTag } from '../types';
import { listAllNotes, listDueNotes, listNotes, type NoteKind } from '../services/notes';

/** Notas de un día concreto. */
export function useNotes(day: string) {
  const [notes, setNotes] = useState<NoteWithTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setNotes(await listNotes(day));
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

  return { notes, loading, error, refresh };
}

/** Todas las notas (vista global), con filtros. */
export function useAllNotes(kind: NoteKind, tagId: string | null) {
  const [notes, setNotes] = useState<NoteWithTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setNotes(await listAllNotes({ kind, tagId }));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [kind, tagId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { notes, loading, error, refresh };
}

/** Pendientes que vencen un día dado (banner de la vista del día). */
export function useDueNotes(day: string) {
  const [notes, setNotes] = useState<NoteWithTag[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setNotes(await listDueNotes(day));
    } catch {
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [day]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { notes, loading, refresh };
}
