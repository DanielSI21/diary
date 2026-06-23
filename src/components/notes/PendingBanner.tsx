import type { NoteWithTag } from '../../types';
import { setNoteDone } from '../../services/notes';
import LinkedText from './LinkedText';

interface Props {
  notes: NoteWithTag[]; // pendientes que vencen este día (no resueltos)
  onChanged: () => Promise<void>;
}

/** Aviso destacado en la vista del día: "Pendiente: …". */
export default function PendingBanner({ notes, onChanged }: Props) {
  if (notes.length === 0) return null;

  async function done(id: string) {
    await setNoteDone(id, true);
    await onChanged();
  }

  return (
    <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/30 dark:bg-amber-500/10">
      {notes.map((n) => (
        <div key={n.id} className="flex items-center gap-3 text-sm">
          <span className="shrink-0 font-semibold text-amber-700 dark:text-amber-400">Pendiente:</span>
          <LinkedText text={n.text} className="min-w-0 flex-1 break-words text-slate-700 dark:text-slate-200" />
          <button onClick={() => done(n.id)} className="btn-ghost shrink-0 text-xs">
            Hecho
          </button>
        </div>
      ))}
    </div>
  );
}
