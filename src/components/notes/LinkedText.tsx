import { Fragment } from 'react';

// Detecta URLs (http/https) y dominios "www." pegados en el texto.
const URL_RE = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

/** Renderiza texto preservando saltos de línea y convirtiendo URLs en enlaces. */
export default function LinkedText({ text, className }: { text: string; className?: string }) {
  return (
    <span className={className}>
      {text.split('\n').map((line, li, lines) => (
        <Fragment key={li}>
          {linkifyLine(line)}
          {li < lines.length - 1 && <br />}
        </Fragment>
      ))}
    </span>
  );
}

function linkifyLine(line: string) {
  const parts = line.split(URL_RE);
  return parts.map((part, i) => {
    if (!part) return null;
    if (URL_RE.test(part)) {
      URL_RE.lastIndex = 0; // reset: el flag global mantiene estado entre tests
      const href = part.startsWith('http') ? part : `https://${part}`;
      return (
        <a
          key={i}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="break-all text-blue-600 underline decoration-blue-400/50 hover:decoration-blue-600 dark:text-blue-400"
        >
          {part}
        </a>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}
