import type { Tag } from '../types';
import { normalizeHM } from './date';

/** Un log ya validado y listo para insertarse. */
export interface ParsedLog {
  entry_time: string; // 'HH:MM'
  end_time: string | null; // 'HH:MM' | null
  text: string;
  tag_id: string | null;
  tagName: string | null; // nombre original (para previsualización)
}

export interface ParseResult {
  logs: ParsedLog[];
  warnings: string[]; // problemas no fatales (tag no encontrado, fila omitida, …)
  error: string | null; // error fatal: no se pudo parsear nada
}

// Acepta varios nombres de campo (es/en) para ser tolerante con lo que
// devuelva el modelo. El primer alias presente y no vacío gana.
const START_KEYS = ['start', 'inicio', 'hora_inicial', 'hora_inicio', 'from', 'hora'];
const END_KEYS = ['end', 'fin', 'hora_final', 'hora_fin', 'to'];
const DESC_KEYS = ['description', 'descripcion', 'desc', 'text', 'texto', 'actividad', 'detalle'];
const TAG_KEYS = ['tag', 'etiqueta', 'categoria', 'category'];

function pick(obj: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number') return String(v);
  }
  return '';
}

/** Quita cercos de markdown (```json … ```) y texto suelto antes/después del JSON. */
function cleanRaw(raw: string): string {
  let s = raw.trim();
  // ```json … ``` o ``` … ```
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  // Si aún hay texto alrededor, recorta al primer [ o { y su cierre.
  const firstArr = s.indexOf('[');
  const firstObj = s.indexOf('{');
  const start =
    firstArr === -1 ? firstObj : firstObj === -1 ? firstArr : Math.min(firstArr, firstObj);
  if (start > 0) {
    const open = s[start];
    const close = open === '[' ? ']' : '}';
    const lastClose = s.lastIndexOf(close);
    if (lastClose > start) s = s.slice(start, lastClose + 1);
  }
  return s.trim();
}

function matchTag(name: string, tags: Tag[]): Tag | null {
  const n = name.trim().toLowerCase();
  if (!n) return null;
  return tags.find((t) => t.name.trim().toLowerCase() === n) ?? null;
}

/**
 * Parsea el texto/JSON que entrega ChatGPT o Claude a logs listos para guardar.
 * Es tolerante: acepta un array directo o `{ "logs": [...] }`, varios nombres
 * de campo, y cercos de markdown.
 */
export function parseLogs(raw: string, tags: Tag[]): ParseResult {
  const warnings: string[] = [];
  if (!raw.trim()) {
    return { logs: [], warnings, error: 'Pega el JSON con tus logs o sube un archivo.' };
  }

  let data: unknown;
  try {
    data = JSON.parse(cleanRaw(raw));
  } catch {
    return {
      logs: [],
      warnings,
      error: 'No es un JSON válido. Revisa que copiaste el contenido completo.',
    };
  }

  // Acepta [ … ] o { logs: [ … ] } / { entries: [ … ] }.
  let arr: unknown;
  if (Array.isArray(data)) arr = data;
  else if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>;
    arr = o.logs ?? o.entries ?? o.items;
  }
  if (!Array.isArray(arr)) {
    return {
      logs: [],
      warnings,
      error: 'El JSON debe ser una lista de logs (o un objeto con la clave "logs").',
    };
  }

  const logs: ParsedLog[] = [];
  arr.forEach((item, i) => {
    const n = i + 1;
    if (!item || typeof item !== 'object') {
      warnings.push(`Log #${n}: formato no reconocido, se omite.`);
      return;
    }
    const obj = item as Record<string, unknown>;

    const text = pick(obj, DESC_KEYS);
    if (!text) {
      warnings.push(`Log #${n}: sin descripción, se omite.`);
      return;
    }

    const startRaw = pick(obj, START_KEYS);
    const entry_time = normalizeHM(startRaw);
    if (!entry_time) {
      warnings.push(`Log #${n} («${text.slice(0, 30)}…»): hora de inicio inválida, se omite.`);
      return;
    }

    const endRaw = pick(obj, END_KEYS);
    let end_time: string | null = null;
    if (endRaw) {
      end_time = normalizeHM(endRaw);
      if (!end_time) {
        warnings.push(`Log #${n}: hora final inválida, se importa sin hora final.`);
      }
    }

    const tagName = pick(obj, TAG_KEYS) || null;
    let tag_id: string | null = null;
    if (tagName) {
      const tag = matchTag(tagName, tags);
      if (tag) tag_id = tag.id;
      else warnings.push(`Log #${n}: etiqueta «${tagName}» no existe, se importa sin etiqueta.`);
    }

    logs.push({ entry_time, end_time, text, tag_id, tagName });
  });

  // Orden cronológico para una previsualización coherente.
  logs.sort((a, b) => a.entry_time.localeCompare(b.entry_time));

  if (logs.length === 0 && warnings.length > 0) {
    return { logs, warnings, error: 'Ningún log se pudo importar. Revisa el formato.' };
  }
  return { logs, warnings, error: null };
}
