// Finds web links in plain message text (never HTML) and recognises links to Grove posts.

export const URL_PATTERN = /https?:\/\/[^\s<]*[^\s<.,:;"')\]!?]/g;

export type TextPart = { type: 'text'; text: string } | { type: 'link'; href: string; text: string; internalPath: string | null };

export function linkify(text: string): TextPart[] {
  const parts: TextPart[] = [];
  let last = 0;
  for (const m of text.matchAll(URL_PATTERN)) {
    let url: URL;
    try {
      url = new URL(m[0]);
    } catch {
      continue;
    }
    if (m.index > last) parts.push({ type: 'text', text: text.slice(last, m.index) });
    const internal = url.origin === window.location.origin;
    parts.push({ type: 'link', href: url.href, text: m[0], internalPath: internal ? url.pathname + url.search : null });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ type: 'text', text: text.slice(last) });
  return parts;
}

// The first link to a Grove blog post in a message, if any — shown as a preview card.
export function sharedPostId(text: string): string | null {
  for (const part of linkify(text)) {
    const m = part.type === 'link' && part.internalPath?.match(/^\/blog\/([a-f0-9]{24})\/?$/);
    if (m) return m[1];
  }
  return null;
}
