import { useState, type ReactNode } from 'react';

interface Props {
  /** Título de la sección. */
  title: string;
  /** Contenido extra a la derecha del título (contadores, controles…). */
  right?: ReactNode;
  /** Si arranca expandida (default true). */
  defaultOpen?: boolean;
  /** Clases para el contenedor del cuerpo (p. ej. `space-y-4`). */
  bodyClassName?: string;
  children: ReactNode;
}

/**
 * Tarjeta de sección con cabecera y cuerpo plegable. El botón de chevron (a la
 * derecha de la cabecera) expande/colapsa para ojear rápido otras secciones.
 */
export default function CollapsibleSection({
  title,
  right,
  defaultOpen = true,
  bodyClassName,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="card">
      <div className={`flex items-center justify-between gap-2 ${open ? 'mb-3' : ''}`}>
        <h2 className="font-semibold">{title}</h2>
        <div className="flex items-center gap-2">
          {right}
          <button
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? 'Colapsar sección' : 'Expandir sección'}
            className="rounded p-1 text-slate-400 hover:text-slate-700"
          >
            <svg
              className={`h-4 w-4 transition-transform ${open ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      {open && (bodyClassName ? <div className={bodyClassName}>{children}</div> : children)}
    </section>
  );
}
