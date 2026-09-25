// Human-friendly timestamps, formatted in the viewer's own locale.

const DAY = 24 * 60 * 60 * 1000;

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function daysAgo(date: Date, now = new Date()): number {
  return Math.round((startOfDay(now) - startOfDay(date)) / DAY);
}

/** "2:34 PM" */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/** Chat list: "2:34 PM" today, "Mon" this week, "12 Sep" this year, "12/09/2025" older. */
export function formatListTime(iso: string): string {
  const date = new Date(iso);
  const days = daysAgo(date);
  if (days === 0) return formatTime(iso);
  if (days < 7) return date.toLocaleDateString(undefined, { weekday: 'short' });
  if (date.getFullYear() === new Date().getFullYear()) {
    return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  }
  return date.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Date separator in a conversation: "Today", "Yesterday", "Monday", "12 September", "12 September 2025". */
export function formatDayLabel(iso: string): string {
  const date = new Date(iso);
  const days = daysAgo(date);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return date.toLocaleDateString(undefined, { weekday: 'long' });
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', ...(sameYear ? {} : { year: 'numeric' }) });
}

export function isSameDay(a: string, b: string): boolean {
  return startOfDay(new Date(a)) === startOfDay(new Date(b));
}

/** Chat header: "Active now", "Active 5m ago", "Active 3h ago", "Active yesterday", "Active 12 Sep". */
export function formatLastSeen(online: boolean, lastSeenAt: string | null): string {
  if (online) return 'Active now';
  if (!lastSeenAt) return 'Offline';
  const diff = Date.now() - new Date(lastSeenAt).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'Active just now';
  if (minutes < 60) return `Active ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Active ${hours}h ago`;
  if (daysAgo(new Date(lastSeenAt)) === 1) return 'Active yesterday';
  return `Active ${new Date(lastSeenAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`;
}

/** Blog dates: "18 Sep" this year, "18 Sep 2025" before. */
export function formatPostDate(iso: string): string {
  const date = new Date(iso);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }) });
}
