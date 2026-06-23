import { supabase } from '../lib/supabase';
import type { NoteWithTag } from '../types';

const SELECT_WITH_TAG = '*, tag:tags(*)';

/** Tipo de nota para filtrar en la vista global. */
export type NoteKind = 'all' | 'note' | 'pending';

/** Notas de un día concreto (orden cronológico). */
export async function listNotes(day: string): Promise<NoteWithTag[]> {
  const { data, error } = await supabase
    .from('notes')
    .select(SELECT_WITH_TAG)
    .eq('day', day)
    .order('note_time');
  if (error) throw error;
  return (data ?? []) as NoteWithTag[];
}

/** Todas las notas (vista global), con filtros opcionales. Más reciente primero. */
export async function listAllNotes(filter: {
  kind?: NoteKind;
  tagId?: string | null;
} = {}): Promise<NoteWithTag[]> {
  let query = supabase
    .from('notes')
    .select(SELECT_WITH_TAG)
    .order('day', { ascending: false })
    .order('note_time', { ascending: false });

  if (filter.kind === 'pending') query = query.eq('pending', true);
  else if (filter.kind === 'note') query = query.eq('pending', false);
  if (filter.tagId) query = query.eq('tag_id', filter.tagId);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as NoteWithTag[];
}

/** Pendientes que vencen un día dado y aún no están resueltos. (Banner del día) */
export async function listDueNotes(day: string): Promise<NoteWithTag[]> {
  const { data, error } = await supabase
    .from('notes')
    .select(SELECT_WITH_TAG)
    .eq('pending', true)
    .eq('done', false)
    .eq('due_date', day)
    .order('note_time');
  if (error) throw error;
  return (data ?? []) as NoteWithTag[];
}

export async function createNote(input: {
  day: string;
  note_time: string; // 'HH:MM'
  text: string;
  tag_id: string | null;
  pending?: boolean;
  due_date?: string | null;
}): Promise<NoteWithTag> {
  const { data, error } = await supabase
    .from('notes')
    .insert({
      day: input.day,
      note_time: input.note_time,
      text: input.text.trim(),
      tag_id: input.tag_id,
      pending: input.pending ?? false,
      due_date: input.pending ? input.due_date ?? null : null,
    })
    .select(SELECT_WITH_TAG)
    .single();
  if (error) throw error;
  return data as NoteWithTag;
}

export async function updateNote(
  id: string,
  patch: Partial<{
    note_time: string;
    text: string;
    tag_id: string | null;
    pending: boolean;
    due_date: string | null;
    done: boolean;
    done_at: string | null;
  }>,
): Promise<NoteWithTag> {
  const clean = { ...patch };
  if (typeof clean.text === 'string') clean.text = clean.text.trim();
  const { data, error } = await supabase
    .from('notes')
    .update(clean)
    .eq('id', id)
    .select(SELECT_WITH_TAG)
    .single();
  if (error) throw error;
  return data as NoteWithTag;
}

/** Marca/desmarca un pendiente como hecho (sella la hora). */
export async function setNoteDone(id: string, done: boolean): Promise<NoteWithTag> {
  return updateNote(id, { done, done_at: done ? new Date().toISOString() : null });
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase.from('notes').delete().eq('id', id);
  if (error) throw error;
}

/** Notas de un mes, opcionalmente filtradas por etiqueta. (Calendario) */
export async function listMonthNotes(
  year: number,
  month: number, // 0-based
  tagId?: string | null,
): Promise<NoteWithTag[]> {
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const end =
    month === 11 ? `${year + 1}-01-01` : `${year}-${String(month + 2).padStart(2, '0')}-01`;

  let query = supabase
    .from('notes')
    .select(SELECT_WITH_TAG)
    .gte('day', start)
    .lt('day', end)
    .order('day')
    .order('note_time');
  if (tagId) query = query.eq('tag_id', tagId);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as NoteWithTag[];
}

/** Días del mes con notas. Para marcar el calendario. */
export async function listNoteDaysInMonth(
  year: number,
  month: number, // 0-based
): Promise<Set<string>> {
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const end =
    month === 11
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 2).padStart(2, '0')}-01`;

  const { data, error } = await supabase
    .from('notes')
    .select('day')
    .gte('day', start)
    .lt('day', end);
  if (error) throw error;

  const days = new Set<string>();
  for (const r of data ?? []) days.add((r as { day: string }).day);
  return days;
}
