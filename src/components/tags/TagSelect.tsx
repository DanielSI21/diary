import type { Tag } from '../../types';

interface Props {
  tags: Tag[];
  value: string | null;
  onChange: (tagId: string | null) => void;
  className?: string;
}

/** Selector nativo compacto. Ligero y accesible en móvil. */
export default function TagSelect({ tags, value, onChange, className }: Props) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      className={`input appearance-none ${className ?? ''}`}
    >
      <option value="">Sin etiqueta</option>
      {tags.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}
        </option>
      ))}
    </select>
  );
}
