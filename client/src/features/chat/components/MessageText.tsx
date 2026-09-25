import { Link } from 'react-router';
import { cn } from '@/lib/cn';
import { linkify } from '../linkify';

// Message text with clickable links. Grove links open in the app; others in a new tab.
export function MessageText({ text, mine }: { text: string; mine: boolean }) {
  const linkClass = cn('underline underline-offset-2 break-all', mine ? 'decoration-white/60 hover:decoration-white' : 'text-primary decoration-primary/40');
  return (
    <>
      {linkify(text).map((part, i) =>
        part.type === 'text' ? (
          part.text
        ) : part.internalPath ? (
          <Link key={i} to={part.internalPath} className={linkClass} onClick={(e) => e.stopPropagation()}>
            {part.text}
          </Link>
        ) : (
          <a key={i} href={part.href} target="_blank" rel="noopener noreferrer nofollow" className={linkClass} onClick={(e) => e.stopPropagation()}>
            {part.text}
          </a>
        ),
      )}
    </>
  );
}
