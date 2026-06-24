import type { NoteWithTag } from '../../types';
import { setNoteDone } from '../../services/notes';
import { createGoal } from '../../services/goals';
import LinkedText from './LinkedText';

interface Props {
  day: string; // día de la vista (al que se asignará el objetivo)
  notes: NoteWithTag[]; // pendientes que vencen este día (no resueltos)
  onChanged: () => Promise<void>;
}

/** Aviso destacado en la vista del día: "Pendiente: …". */
export default function PendingBanner({ day, notes, onChanged }: Props) {
  if (notes.length === 0) return null;

  async function done(id: string) {
    await setNoteDone(id, true);
    await onChanged();
  }

  // Crea un objetivo de este día con el texto/etiqueta del pendiente y lo resuelve.
  async function convertToGoal(note: NoteWithTag) {
    await createGoal({ day, text: note.text, tag_id: note.tag_id });
    await setNoteDone(note.id, true);
    await onChanged();
  }

  return (
    <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/30 dark:bg-amber-500/10">
      {notes.map((n) => (
        <div key={n.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
          <span className="shrink-0 font-semibold text-amber-700 dark:text-amber-400">Pendiente:</span>
          <LinkedText text={n.text} className="min-w-0 flex-1 break-words text-slate-700 dark:text-slate-200" />
          <div className="flex shrink-0 gap-1">
            <button onClick={() => convertToGoal(n)} className="btn-ghost text-xs">
              Convertir en objetivo
            </button>
            <button onClick={() => done(n.id)} className="btn-ghost text-xs">
              Hecho
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
