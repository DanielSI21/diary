export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  day: string; // YYYY-MM-DD
  text: string;
  completed: boolean;
  completion_percent: number; // 0-100, relevante cuando completed = true
  tag_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** Objetivo con su tag ya resuelto (join). */
export interface GoalWithTag extends Goal {
  tag: Tag | null;
}

export interface Entry {
  id: string;
  user_id: string;
  day: string; // YYYY-MM-DD
  entry_time: string; // HH:MM:SS
  end_time: string | null; // HH:MM:SS — opcional
  text: string;
  tag_id: string | null;
  goal_id: string | null; // objetivo del día al que se vinculó este log
  created_at: string;
  updated_at: string;
}

/** Entrada con su tag ya resuelto (join). */
export interface EntryWithTag extends Entry {
  tag: Tag | null;
}

export interface Note {
  id: string;
  user_id: string;
  day: string; // YYYY-MM-DD — día en que se registró la nota
  note_time: string; // HH:MM:SS — hora de inicio (como un log)
  text: string;
  tag_id: string | null;
  pending: boolean; // true = es un "pendiente"
  due_date: string | null; // YYYY-MM-DD — opcional, solo relevante si pending
  done: boolean; // pendiente resuelto
  done_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Nota con su tag ya resuelto (join). */
export interface NoteWithTag extends Note {
  tag: Tag | null;
}

/** Análisis del día (Markdown largo) generado externamente y guardado. */
export interface Analysis {
  id: string;
  user_id: string;
  day: string; // YYYY-MM-DD
  text: string;
  created_at: string;
  updated_at: string;
}

export interface TagSummary {
  tagId: string | null;
  name: string;
  color: string;
  minutes: number;
  percent: number;
}

export interface DaySummary {
  summaries: TagSummary[];
  totalMinutes: number;
}
