import { supabase } from '../lib/supabase';
import type { Tag } from '../types';

export async function listTags(includeInactive = false): Promise<Tag[]> {
  let query = supabase.from('tags').select('*').order('sort_order').order('name');
  if (!includeInactive) query = query.eq('active', true);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function createTag(input: {
  name: string;
  color: string;
  sort_order?: number;
}): Promise<Tag> {
  const { data, error } = await supabase
    .from('tags')
    .insert({ name: input.name.trim(), color: input.color, sort_order: input.sort_order ?? 0 })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTag(
  id: string,
  patch: Partial<Pick<Tag, 'name' | 'color' | 'active' | 'sort_order'>>,
): Promise<Tag> {
  const clean = { ...patch };
  if (typeof clean.name === 'string') clean.name = clean.name.trim();
  const { data, error } = await supabase.from('tags').update(clean).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteTag(id: string): Promise<void> {
  const { error } = await supabase.from('tags').delete().eq('id', id);
  if (error) throw error;
}
