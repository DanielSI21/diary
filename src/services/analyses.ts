import { supabase } from '../lib/supabase';
import type { Analysis } from '../types';

/** Análisis guardado de un día (o null si no existe). */
export async function getAnalysis(day: string): Promise<Analysis | null> {
  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .eq('day', day)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as Analysis | null;
}

/**
 * Crea o reemplaza el análisis del día (uno por día y usuario).
 * Si el texto queda vacío, elimina el análisis existente.
 */
export async function saveAnalysis(day: string, text: string): Promise<Analysis | null> {
  const trimmed = text.trim();
  if (!trimmed) {
    await deleteAnalysis(day);
    return null;
  }

  const existing = await getAnalysis(day);
  if (existing) {
    const { data, error } = await supabase
      .from('analyses')
      .update({ text: trimmed })
      .eq('id', existing.id)
      .select('*')
      .single();
    if (error) throw error;
    return data as Analysis;
  }

  const { data, error } = await supabase
    .from('analyses')
    .insert({ day, text: trimmed })
    .select('*')
    .single();
  if (error) throw error;
  return data as Analysis;
}

export async function deleteAnalysis(day: string): Promise<void> {
  const { error } = await supabase.from('analyses').delete().eq('day', day);
  if (error) throw error;
}
