import { supabase } from '../lib/supabase';
import type { GoalWithTag } from '../types';

const SELECT_WITH_TAG = '*, tag:tags(*)';

export async function listGoals(day: string): Promise<GoalWithTag[]> {
  const { data, error } = await supabase
    .from('goals')
    .select(SELECT_WITH_TAG)
    .eq('day', day)
    .order('sort_order')
    .order('created_at');
  if (error) throw error;
  return (data ?? []) as GoalWithTag[];
}

export async function createGoal(input: {
  day: string;
  text: string;
  tag_id?: string | null;
  sort_order?: number;
}): Promise<GoalWithTag> {
  const { data, error } = await supabase
    .from('goals')
    .insert({
      day: input.day,
      text: input.text.trim(),
      tag_id: input.tag_id ?? null,
      sort_order: input.sort_order ?? 0,
    })
    .select(SELECT_WITH_TAG)
    .single();
  if (error) throw error;
  return data as GoalWithTag;
}

export async function updateGoal(
  id: string,
  patch: Partial<{
    text: string;
    completed: boolean;
    completion_percent: number;
    tag_id: string | null;
    sort_order: number;
  }>,
): Promise<GoalWithTag> {
  const clean = { ...patch };
  if (typeof clean.text === 'string') clean.text = clean.text.trim();
  const { data, error } = await supabase
    .from('goals')
    .update(clean)
    .eq('id', id)
    .select(SELECT_WITH_TAG)
    .single();
  if (error) throw error;
  return data as GoalWithTag;
}

export async function deleteGoal(id: string): Promise<void> {
  const { error } = await supabase.from('goals').delete().eq('id', id);
  if (error) throw error;
}

/** Objetivos CUMPLIDOS de un mes, opcionalmente filtrados por etiqueta. (Calendario) */
export async function listMonthCompletedGoals(
  year: number,
  month: number, // 0-based
  tagId?: string | null,
): Promise<GoalWithTag[]> {
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const end =
    month === 11 ? `${year + 1}-01-01` : `${year}-${String(month + 2).padStart(2, '0')}-01`;

  let query = supabase
    .from('goals')
    .select(SELECT_WITH_TAG)
    .eq('completed', true)
    .gte('day', start)
    .lt('day', end)
    .order('day');
  if (tagId) query = query.eq('tag_id', tagId);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as GoalWithTag[];
}
