import { useState } from 'react';
import Markdown from './summary/Markdown';

interface Props {
  /** Texto del análisis (Markdown). */
  text: string;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Análisis adjunto a un log o nota: colapsado por defecto, expandible para leer.
 * Al expandir se renderiza el Markdown y aparecen las acciones editar/eliminar.
 */
export default function CollapsibleAnalysis({ text, onEdit, onDelete }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-1 rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/40">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-1.5 px-2 py-1.5 text-left text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
        aria-expanded={open}
      >
        <svg
          className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        Análisis
      </button>

      {open && (
        <div className="border-t border-slate-200 px-2 py-2 dark:border-slate-700">
          <Markdown text={text} className="break-words text-slate-700 dark:text-slate-200" />
          <div className="mt-2 flex gap-2">
            <button onClick={onEdit} className="btn-ghost text-xs">
              Editar
            </button>
            <button
              onClick={onDelete}
              className="btn-ghost text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
            >
              Eliminar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
