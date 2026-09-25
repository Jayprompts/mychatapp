// The small Markdown subset posts are written in:
//   ## Heading · ### Subheading · **bold** · *italic* · `code` · [text](https://…) · - list · 1. list · > quote
// Parsed into plain data here and rendered as React elements (components/Markdown.tsx) — never as HTML.

export type Block =
  | { type: 'h2' | 'h3' | 'p' | 'quote'; text: string }
  | { type: 'ul' | 'ol'; items: string[] };

export function parseBlocks(source: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) blocks.push({ type: 'p', text: para.join('\n') });
    para = [];
  };

  for (const line of source.replace(/\r\n?/g, '\n').split('\n')) {
    if (!line.trim()) {
      flush();
      continue;
    }
    const last = blocks.at(-1);
    let m: RegExpExecArray | null;
    if ((m = /^(#{1,3})\s+(.*)$/.exec(line))) {
      flush();
      blocks.push({ type: m[1].length === 3 ? 'h3' : 'h2', text: m[2] });
    } else if ((m = /^\s*[-*•]\s+(.*)$/.exec(line))) {
      flush();
      if (last?.type === 'ul' && !para.length) last.items.push(m[1]);
      else blocks.push({ type: 'ul', items: [m[1]] });
    } else if ((m = /^\s*\d+[.)]\s+(.*)$/.exec(line))) {
      flush();
      if (last?.type === 'ol') last.items.push(m[1]);
      else blocks.push({ type: 'ol', items: [m[1]] });
    } else if ((m = /^>\s?(.*)$/.exec(line))) {
      flush();
      if (last?.type === 'quote') last.text += '\n' + m[1];
      else blocks.push({ type: 'quote', text: m[1] });
    } else {
      para.push(line);
    }
  }
  flush();
  return blocks;
}

export type Inline =
  | { type: 'text'; text: string }
  | { type: 'bold' | 'italic'; children: Inline[] }
  | { type: 'code'; text: string }
  | { type: 'link'; href: string; children: Inline[] }
  | { type: 'br' };

// Only real web/mail links become <a>; anything else (javascript:, data:…) stays as plain text.
export function safeHref(raw: string): string | null {
  try {
    const url = new URL(raw);
    return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

const INLINE = /\*\*(.+?)\*\*(?!\*)|\*(?!\s)(.+?)\*|`([^`\n]+)`|\[([^\]\n]+)\]\(([^)\s]+)\)|(https?:\/\/[^\s<]*[^\s<.,:;"')\]!?])/g;

export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  const pushText = (t: string) =>
    t.split('\n').forEach((part, i) => {
      if (i > 0) out.push({ type: 'br' });
      if (part) out.push({ type: 'text', text: part });
    });

  let last = 0;
  for (const m of text.matchAll(INLINE)) {
    pushText(text.slice(last, m.index));
    const [whole, bold, italic, code, linkText, linkUrl, bare] = m;
    if (bold !== undefined) out.push({ type: 'bold', children: parseInline(bold) });
    else if (italic !== undefined) out.push({ type: 'italic', children: parseInline(italic) });
    else if (code !== undefined) out.push({ type: 'code', text: code });
    else if (linkText !== undefined) {
      const href = safeHref(linkUrl);
      if (href) out.push({ type: 'link', href, children: parseInline(linkText) });
      else pushText(whole);
    } else if (bare !== undefined) {
      const href = safeHref(bare);
      if (href) out.push({ type: 'link', href, children: [{ type: 'text', text: bare }] });
      else pushText(whole);
    }
    last = m.index + whole.length;
  }
  pushText(text.slice(last));
  return out;
}

// ── Editor toolbar: edit the textarea's value around the current selection ──

export type Edit = { value: string; start: number; end: number };
export type Format = 'bold' | 'italic' | 'code' | 'link' | 'h2' | 'h3' | 'ul' | 'ol' | 'quote';

const WRAPS: Partial<Record<Format, [string, string, string]>> = {
  bold: ['**', '**', 'bold text'],
  italic: ['*', '*', 'italic text'],
  code: ['`', '`', 'code'],
};
const PREFIXES: Partial<Record<Format, string>> = { h2: '## ', h3: '### ', ul: '- ', quote: '> ' };

export function applyFormat(value: string, start: number, end: number, format: Format): Edit {
  const selected = value.slice(start, end);

  const wrap = WRAPS[format];
  if (wrap) {
    const [open, close, placeholder] = wrap;
    const inner = selected || placeholder;
    const next = value.slice(0, start) + open + inner + close + value.slice(end);
    return { value: next, start: start + open.length, end: start + open.length + inner.length };
  }

  if (format === 'link') {
    const label = selected || 'link text';
    const insert = `[${label}](https://)`;
    const urlStart = start + label.length + 3;
    return { value: value.slice(0, start) + insert + value.slice(end), start: urlStart, end: urlStart + 8 };
  }

  // Line formats: apply to every line the selection touches (toggle off if they all have it).
  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
  const lineEndIdx = value.indexOf('\n', end);
  const lineEnd = lineEndIdx === -1 ? value.length : lineEndIdx;
  const lines = value.slice(lineStart, lineEnd).split('\n');
  const strip = (l: string) => l.replace(/^(#{1,3}\s+|\s*[-*•]\s+|\s*\d+[.)]\s+|>\s?)/, '');
  const prefixFor = (i: number) => (format === 'ol' ? `${i + 1}. ` : PREFIXES[format]!);
  const has = (l: string, i: number) => (format === 'ol' ? /^\s*\d+[.)]\s+/.test(l) : l.startsWith(prefixFor(i)));
  const removing = lines.every(has);
  const changed = lines.map((l, i) => (removing ? strip(l) : prefixFor(i) + strip(l))).join('\n');

  const next = value.slice(0, lineStart) + changed + value.slice(lineEnd);
  return { value: next, start: lineStart, end: lineStart + changed.length };
}

// The text an automatic summary is taken from (headings skipped) — mirrors the server's autoExcerpt.
export const summarySource = (markdown: string) => plainText(markdown.replace(/^#{1,6}\s+.*$/gm, ''));

// Plain words (for length rules) — mirrors the server.
export function plainText(markdown: string): string {
  return markdown
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*(?:[-*]|\d+\.)\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}
