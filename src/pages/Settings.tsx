import { useState, type FormEvent } from 'react';
import type { Tag } from '../types';
import { useTags } from '../hooks/useTags';
import { useTheme } from '../hooks/useTheme';
import { createTag, deleteTag, updateTag } from '../services/tags';

const PALETTE = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#64748b', '#0ea5e9',
];

export default function Settings() {
  const { theme, toggle } = useTheme();
  const { tags, loading, error, refresh } = useTags(true); // incluye inactivos
  const [name, setName] = useState('');
  const [color, setColor] = useState(PALETTE[0]);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function add(e: FormEvent) {
    e.preventDefault();
    const value = name.trim();
    if (!value) return;
    // Validación de duplicados (la BD también lo impide).
    if (tags.some((t) => t.name.toLowerCase() === value.toLowerCase())) {
      setFormError('Ya existe una etiqueta con ese nombre.');
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      await createTag({ name: value, color, sort_order: tags.length });
      setName('');
      await refresh();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const isDark = theme === 'dark';

  return (
    <div className="space-y-4">
      <h2 className="font-semibold">Apariencia</h2>
      <div className="card flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Modo oscuro</p>
          <p className="text-xs text-slate-400">
            {isDark ? 'Activado' : 'Desactivado'}
          </p>
        </div>
        <button
          role="switch"
          aria-checked={isDark}
          aria-label="Modo oscuro"
          onClick={toggle}
          className={`relative h-6 w-11 shrink-0 rounded-full transition ${
            isDark ? 'bg-slate-900 dark:bg-white' : 'bg-slate-300'
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition dark:bg-slate-900 ${
              isDark ? 'left-[1.375rem]' : 'left-0.5'
            }`}
          />
        </button>
      </div>

      <h2 className="font-semibold">Etiquetas</h2>

      <form onSubmit={add} className="card space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre de la etiqueta (ej. trabajo)"
          className="input"
        />
        <div className="flex flex-wrap gap-2">
          {PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`Color ${c}`}
              className={`h-7 w-7 rounded-full transition ${
                color === c ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white dark:ring-offset-slate-900' : ''
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        {formError && <p className="text-sm text-red-600">{formError}</p>}
        <button type="submit" disabled={busy || !name.trim()} className="btn-primary w-full">
          Crear etiqueta
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="space-y-2">
        {tags.map((t) => (
          <TagRow key={t.id} tag={t} onChanged={refresh} />
        ))}
        {!loading && tags.length === 0 && (
          <p className="text-sm text-slate-400">Aún no tienes etiquetas.</p>
        )}
      </div>
    </div>
  );
}

function TagRow({ tag, onChanged }: { tag: Tag; onChanged: () => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(tag.name);
  const [color, setColor] = useState(tag.color);

  async function save() {
    await updateTag(tag.id, { name, color });
    setEditing(false);
    await onChanged();
  }
  async function toggleActive() {
    await updateTag(tag.id, { active: !tag.active });
    await onChanged();
  }
  async function remove() {
    if (!confirm(`¿Eliminar la etiqueta "${tag.name}"? Los registros antiguos la conservarán como "Sin etiqueta".`))
      return;
    await deleteTag(tag.id);
    await onChanged();
  }

  return (
    <div className="card flex items-center gap-3 py-3">
      {editing ? (
        <>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-8 w-8 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input min-w-0 flex-1"
            autoFocus
          />
          <button onClick={save} className="btn-primary shrink-0">
            Guardar
          </button>
          <button onClick={() => setEditing(false)} className="btn-ghost shrink-0">
            Cancelar
          </button>
        </>
      ) : (
        <>
          <span className="h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: tag.color }} />
          <span className={`min-w-0 flex-1 truncate ${tag.active ? '' : 'text-slate-400 line-through'}`}>
            {tag.name}
            {!tag.active && <span className="ml-2 text-xs">(inactiva)</span>}
          </span>
          <button onClick={toggleActive} className="btn-ghost shrink-0 px-2 text-xs" title="Activar/desactivar">
            {tag.active ? 'Desactivar' : 'Activar'}
          </button>
          <button onClick={() => setEditing(true)} className="btn-ghost shrink-0 px-2 text-xs">
            Editar
          </button>
          <button onClick={remove} className="btn-ghost shrink-0 px-2 text-xs text-red-500">
            Eliminar
          </button>
        </>
      )}
    </div>
  );
}
