import { BellOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useNotifications } from '../api';
import type { AppNotification } from '../types';
import { NotificationItem } from './NotificationItem';

const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();

// Today / Earlier groups, paging, and the design's "You're all caught up" empty state.
export function NotificationList({ onOpen }: { onOpen?: () => void }) {
  const q = useNotifications();
  const all = q.data?.pages.flatMap((p) => p.notifications) ?? [];

  if (q.isPending) {
    return (
      <div className="flex flex-col gap-4 p-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="size-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-3.5 w-4/5" />
              <Skeleton className="mt-2 h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (all.length === 0) {
    return (
      <div className="flex flex-col items-center px-8 py-12 text-center">
        <span className="mb-4 flex size-16 items-center justify-center rounded-full bg-primary/8 text-primary">
          <BellOff size={26} />
        </span>
        <p className="text-base font-bold text-text-primary">You're all caught up</p>
        <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">Likes, comments, mentions and community news will show up here.</p>
      </div>
    );
  }

  const groups: [string, AppNotification[]][] = [
    ['Today', all.filter((n) => isToday(n.updatedAt))],
    ['Earlier', all.filter((n) => !isToday(n.updatedAt))],
  ];
  return (
    <div>
      {groups.map(([label, items]) =>
        items.length ? (
          <section key={label} aria-label={label}>
            <h2 className="bg-bg px-4 pt-2.5 pb-1.5 text-[11px] font-bold tracking-[0.08em] text-text-secondary uppercase">{label}</h2>
            <div className="bg-card">
              {items.map((n) => (
                <NotificationItem key={n.id} n={n} onOpen={onOpen} />
              ))}
            </div>
          </section>
        ) : null,
      )}
      {q.hasNextPage && (
        <div className="flex justify-center p-3">
          <Button size="sm" variant="secondary" onClick={() => void q.fetchNextPage()} loading={q.isFetchingNextPage}>
            Load older
          </Button>
        </div>
      )}
    </div>
  );
}
