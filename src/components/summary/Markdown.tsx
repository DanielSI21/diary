import { Fragment, type ReactNode } from 'react';

/**
 * Renderizador Markdown ligero (sin dependencias) pensado para el análisis del
 * día: encabezados, listas (con anidación por indentación), citas, separadores,
 * párrafos y formato inline (negrita, cursiva, código, enlaces y URLs sueltas).
 * El texto se guarda como Markdown crudo; aquí se muestra limpio y legible.
 */
export default function Markdown({ text, className }: { text: string; className?: string }) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  return <div className={`space-y-2 text-sm leading-relaxed ${className ?? ''}`}>{parseBlocks(lines)}</div>;
}

const LIST_RE = /^(\s*)([-*+]|\d+\.)\s+(.*)$/;

function isBlockStart(line: string): boolean {
  return (
    /^(#{1,6})\s+/.test(line) ||
    /^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line) ||
    /^\s*>\s?/.test(line) ||
    LIST_RE.test(line)
  );
}

function parseBlocks(lines: string[]): ReactNode[] {
  const out: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === '') {
      i++;
      continue;
    }

    // Encabezados
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      out.push(heading(h[1].length, h[2], key++));
      i++;
      continue;
    }

    // Separador horizontal
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      out.push(<hr key={key++} className="border-slate-200 dark:border-slate-700" />);
      i++;
      continue;
    }

    // Cita
    if (/^\s*>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^\s*>\s?/, ''));
        i++;
      }
      out.push(
        <blockquote
          key={key++}
          className="border-l-2 border-slate-300 pl-3 text-slate-500 dark:border-slate-600 dark:text-slate-400"
        >
          {parseBlocks(buf)}
        </blockquote>,
      );
      continue;
    }

    // Listas (con posible anidación por indentación)
    if (LIST_RE.test(line)) {
      const [node, next] = parseList(lines, i, key++);
      out.push(node);
      i = next;
      continue;
    }

    // Párrafo: líneas consecutivas que no inician otro bloque
    const buf: string[] = [];
    while (i < lines.length && lines[i].trim() !== '' && !isBlockStart(lines[i])) {
      buf.push(lines[i]);
      i++;
    }
    out.push(
      <p key={key++}>{renderInlineLines(buf)}</p>,
    );
  }

  return out;
}

function parseList(lines: string[], start: number, key: number): [ReactNode, number] {
  const base = LIST_RE.exec(lines[start])!;
  const baseIndent = base[1].length;
  const ordered = /\d+\./.test(base[2]);
  const items: ReactNode[] = [];
  let i = start;
  let ik = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === '') {
      // Permite líneas en blanco dentro de la lista si el siguiente ítem sigue al mismo nivel.
      let j = i + 1;
      while (j < lines.length && lines[j].trim() === '') j++;
      const next = j < lines.length ? LIST_RE.exec(lines[j]) : null;
      if (next && next[1].length >= baseIndent) {
        i = j;
        continue;
      }
      break;
    }

    const m = LIST_RE.exec(line);
    if (!m || m[1].length < baseIndent) break;
    if (m[1].length > baseIndent) break; // seguridad: lo gestiona el bloque hijo

    const content = m[3];
    i++;

    // Recoge líneas más indentadas (sublistas o continuación) para este ítem.
    const childLines: string[] = [];
    while (i < lines.length) {
      const l = lines[i];
      if (l.trim() === '') {
        let j = i + 1;
        while (j < lines.length && lines[j].trim() === '') j++;
        const lm = j < lines.length ? LIST_RE.exec(lines[j]) : null;
        if (lm && lm[1].length > baseIndent) {
          childLines.push('');
          i++;
          continue;
        }
        break;
      }
      const lm = LIST_RE.exec(l);
      const indent = l.length - l.trimStart().length;
      if ((lm && lm[1].length > baseIndent) || (!lm && indent > baseIndent)) {
        childLines.push(l);
        i++;
        continue;
      }
      break;
    }

    items.push(
      <li key={ik++}>
        {renderInline(content)}
        {childLines.length > 0 && parseBlocks(childLines)}
      </li>,
    );
  }

  return [
    ordered ? (
      <ol key={key} className="ml-5 list-decimal space-y-1 marker:text-slate-400">
        {items}
      </ol>
    ) : (
      <ul key={key} className="ml-5 list-disc space-y-1 marker:text-slate-400">
        {items}
      </ul>
    ),
    i,
  ];
}

function heading(level: number, text: string, key: number): ReactNode {
  const content = renderInline(text);
  if (level === 1) return <h1 key={key} className="mt-3 text-lg font-bold first:mt-0">{content}</h1>;
  if (level === 2) return <h2 key={key} className="mt-3 text-base font-semibold first:mt-0">{content}</h2>;
  if (level === 3)
    return (
      <h3 key={key} className="mt-2 text-sm font-semibold text-slate-600 first:mt-0 dark:text-slate-300">
        {content}
      </h3>
    );
  return (
    <h4 key={key} className="mt-2 text-sm font-medium text-slate-500 first:mt-0 dark:text-slate-400">
      {content}
    </h4>
  );
}

function renderInlineLines(lines: string[]): ReactNode {
  return lines.map((l, i) => (
    <Fragment key={i}>
      {renderInline(l)}
      {i < lines.length - 1 && <br />}
    </Fragment>
  ));
}

// Negrita, cursiva, código, enlaces [texto](url) y URLs sueltas.
// OJO: `renderInline` es recursiva (negrita/cursiva). Cada llamada DEBE crear su
// propio RegExp: un regex global a nivel de módulo comparte `lastIndex` entre las
// llamadas anidadas, corrompe el recorrido del bucle exterior y genera nodos sin
// fin (cuelgue / "Out of Memory").
const INLINE_SRC =
  '(\\*\\*[^*]+\\*\\*|__[^_]+__|\\*[^*\\n]+\\*|_[^_\\n]+_|`[^`]+`|\\[[^\\]]+\\]\\([^)]+\\)|https?:\\/\\/[^\\s)]+|www\\.[^\\s)]+)';

function renderInline(text: string): ReactNode[] {
  const re = new RegExp(INLINE_SRC, 'g');
  const nodes: ReactNode[] = [];
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    nodes.push(renderToken(m[0], key++));
    last = m.index + m[0].length;
    if (re.lastIndex === m.index) re.lastIndex++; // seguridad anti-bucle
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function renderToken(tok: string, key: number): ReactNode {
  if ((tok.startsWith('**') && tok.endsWith('**')) || (tok.startsWith('__') && tok.endsWith('__')))
    return <strong key={key}>{renderInline(tok.slice(2, -2))}</strong>;

  if (tok.startsWith('`') && tok.endsWith('`'))
    return (
      <code
        key={key}
        className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[0.85em] dark:bg-slate-800"
      >
        {tok.slice(1, -1)}
      </code>
    );

  const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(tok);
  if (link) return anchor(link[2], link[1], key);

  if (tok.startsWith('http')) return anchor(tok, tok, key);
  if (tok.startsWith('www.')) return anchor(`https://${tok}`, tok, key);

  if ((tok.startsWith('*') && tok.endsWith('*')) || (tok.startsWith('_') && tok.endsWith('_')))
    return <em key={key}>{renderInline(tok.slice(1, -1))}</em>;

  return tok;
}

function anchor(href: string, label: string, key: number): ReactNode {
  return (
    <a
      key={key}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="break-all text-blue-600 underline decoration-blue-400/50 hover:decoration-blue-600 dark:text-blue-400"
    >
      {label}
    </a>
  );
}
