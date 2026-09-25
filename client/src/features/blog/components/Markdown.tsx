import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { parseBlocks, parseInline, type Inline } from '../markdown';

function renderInline(nodes: Inline[]): ReactNode[] {
  return nodes.map((n, i) => {
    switch (n.type) {
      case 'text':
        return n.text;
      case 'br':
        return <br key={i} />;
      case 'bold':
        return <strong key={i} className="font-semibold">{renderInline(n.children)}</strong>;
      case 'italic':
        return <em key={i}>{renderInline(n.children)}</em>;
      case 'code':
        return <code key={i} className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[0.9em]">{n.text}</code>;
      case 'link': {
        const internal = n.href.startsWith(window.location.origin);
        return (
          <a
            key={i}
            href={n.href}
            {...(internal ? {} : { target: '_blank', rel: 'noopener noreferrer nofollow ugc' })}
            className="font-medium text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary"
          >
            {renderInline(n.children)}
          </a>
        );
      }
    }
  });
}

// A post body, typeset for reading.
export function Markdown({ source, className }: { source: string; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-4 text-[16px] leading-[1.75] break-words text-text-primary sm:text-[17px]', className)}>
      {parseBlocks(source).map((b, i) => {
        switch (b.type) {
          case 'h2':
            return <h2 key={i} className="mt-4 text-xl leading-snug font-bold tracking-tight sm:text-[23px]">{renderInline(parseInline(b.text))}</h2>;
          case 'h3':
            return <h3 key={i} className="mt-2 text-lg leading-snug font-bold sm:text-xl">{renderInline(parseInline(b.text))}</h3>;
          case 'quote':
            return (
              <blockquote key={i} className="border-l-[3px] border-primary/40 pl-4 text-text-secondary italic">
                {renderInline(parseInline(b.text))}
              </blockquote>
            );
          case 'ul':
          case 'ol': {
            const List = b.type === 'ul' ? 'ul' : 'ol';
            return (
              <List key={i} className={cn('flex flex-col gap-1.5 pl-6', b.type === 'ul' ? 'list-disc' : 'list-decimal', 'marker:text-primary')}>
                {b.items.map((item, j) => <li key={j} className="pl-1">{renderInline(parseInline(item))}</li>)}
              </List>
            );
          }
          default:
            return <p key={i}>{renderInline(parseInline(b.text))}</p>;
        }
      })}
    </div>
  );
}
