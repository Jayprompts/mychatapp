// Shows `text` with every match of `q` marked, trimmed around the first match when `around` is set.
export function Highlight({ text, q, around }: { text: string; q: string; around?: number }) {
  const term = q.trim().replace(/^@/, '');
  let shown = text;
  if (around && term) {
    const at = text.toLowerCase().indexOf(term.toLowerCase());
    if (at > around) shown = '…' + text.slice(at - around);
  }
  if (!term) return <>{shown}</>;
  const parts = shown.split(new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig'));
  return (
    <>
      {parts.map((part, i) =>
        i % 2 ? (
          <mark key={i} className="rounded-[3px] bg-primary/15 px-0.5 font-semibold text-inherit">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}
