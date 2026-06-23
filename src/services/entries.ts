import { supabase } from '../lib/supabase';
import type { EntryWithTag } from '../types';

const SELECT_WITH_TAG = '*, tag:tags(*)';

export async function listEntries(day: string): Promise<EntryWithTag[]> {
  const { data, error } = await supabase
    .from('entries')
    .select(SELECT_WITH_TAG)
    .eq('day', day)
    .order('entry_time');
  if (error) throw error;
  return (data ?? []) as EntryWithTag[];
}

export async function createEntry(input: {
  day: string;
  entry_time: string; // 'HH:MM'
  end_time?: string | null; // 'HH:MM' opcional
  text: string;
  tag_id: string | null;
}): Promise<EntryWithTag> {
  const { data, error } = await supabase
    .from('entries')
    .insert({
      day: input.day,
      entry_time: input.entry_time,
      end_time: input.end_time ?? null,
      text: input.text.trim(),
      tag_id: input.tag_id,
    })
    .select(SELECT_WITH_TAG)
    .single();
  if (error) throw error;
  return data as EntryWithTag;
}

export async function updateEntry(
  id: string,
  patch: Partial<{
    entry_time: string;
    end_time: string | null;
    text: string;
    tag_id: string | null;
    goal_id: string | null;
  }>,
): Promise<EntryWithTag> {
  const clean = { ...patch };
  if (typeof clean.text === 'string') clean.text = clean.text.trim();
  const { data, error } = await supabase
    .from('entries')
    .update(clean)
    .eq('id', id)
    .select(SELECT_WITH_TAG)
    .single();
  if (error) throw error;
  return data as EntryWithTag;
}

export async function deleteEntry(id: string): Promise<void> {
  const { error } = await supabase.from('entries').delete().eq('id', id);
  if (error) throw error;
}

/** Vincula al objetivo todos los logs de ese día que comparten su etiqueta. */
export async function linkEntriesToGoal(
  day: string,
  tagId: string,
  goalId: string,
): Promise<void> {
  const { error } = await supabase
    .from('entries')
    .update({ goal_id: goalId })
    .eq('day', day)
    .eq('tag_id', tagId);
  if (error) throw error;
}

/** Logs de un mes, opcionalmente filtrados por etiqueta. (Calendario) */
export async function listMonthEntries(
  year: number,
  month: number, // 0-based
  tagId?: string | null,
): Promise<EntryWithTag[]> {
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const end =
    month === 11 ? `${year + 1}-01-01` : `${year}-${String(month + 2).padStart(2, '0')}-01`;

  let query = supabase
    .from('entries')
    .select(SELECT_WITH_TAG)
    .gte('day', start)
    .lt('day', end)
    .order('day')
    .order('entry_time');
  if (tagId) query = query.eq('tag_id', tagId);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as EntryWithTag[];
}

/** Días del mes (1..31) que tienen objetivos o entradas. Para marcar el calendario. */
export async function listActiveDaysInMonth(
  year: number,
  month: number, // 0-based
): Promise<Set<string>> {
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const end =
    month === 11
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 2).padStart(2, '0')}-01`;

  const [goalsRes, entriesRes] = await Promise.all([
    supabase.from('goals').select('day').gte('day', start).lt('day', end),
    supabase.from('entries').select('day').gte('day', start).lt('day', end),
  ]);
  if (goalsRes.error) throw goalsRes.error;
  if (entriesRes.error) throw entriesRes.error;

  const days = new Set<string>();
  for (const r of goalsRes.data ?? []) days.add((r as { day: string }).day);
  for (const r of entriesRes.data ?? []) days.add((r as { day: string }).day);
  return days;
}
