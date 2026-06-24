interface Props {
  value: string; // 'HH:MM' o ''
  onChange: (value: string) => void;
  ariaLabel?: string;
  placeholder?: string;
  className?: string;
}

/**
 * Da formato a la entrada a 24h "HH:MM" mientras se escribe:
 *  - Solo dígitos; el ":" se inserta solo tras los 2 primeros.
 *  - Acota horas a 00–23 y minutos a 00–59.
 * Sin a.m/p.m y sin depender del idioma del sistema.
 */
function maskTime(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 4);
  if (d.length === 0) return '';
  let h = d.slice(0, 2);
  if (h.length === 2 && Number(h) > 23) h = '23';
  if (d.length <= 2) return h;
  let m = d.slice(2, 4);
  if (m.length === 2 && Number(m) > 59) m = '59';
  return `${h}:${m}`;
}

/** Campo de hora en formato 24h (HH:MM), apto para teclado numérico en móvil. */
export default function TimeInput({ value, onChange, ariaLabel, placeholder = 'HH:MM', className }: Props) {
  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]{2}:[0-9]{2}"
      maxLength={5}
      value={value}
      onChange={(e) => onChange(maskTime(e.target.value))}
      aria-label={ariaLabel}
      placeholder={placeholder}
      className={className}
    />
  );
}
