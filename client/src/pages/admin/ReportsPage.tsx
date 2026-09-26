import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router';
import { Ban, CircleCheck, FileText, MessageCircle, MessageSquare, ShieldAlert, Trash2, User, X, type LucideIcon } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useReportDetail, useReports, useResolveReport } from '@/features/admin/api';
import { ReasonDialog } from '@/features/admin/components/ReasonDialog';
import { AdminRoleBadge, FilterSelect, PageTitle, Pagination, StatusBadge, TableCard, td, th } from '@/features/admin/components/ui';
import type { ReportDetail, ReportTargetType } from '@/features/admin/types';
import { useMe } from '@/features/auth/api';
import { PostCover } from '@/features/blog/components/PostCover';
import { plainText } from '@/features/blog/markdown';
import { errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatAgo, formatPostDate } from '@/lib/time';
import { toast } from '@/lib/toast';

const TYPES: Record<ReportTargetType, { label: string; icon: LucideIcon }> = {
  post: { label: 'Post', icon: FileText },
  comment: { label: 'Comment', icon: MessageSquare },
  message: { label: 'Message', icon: MessageCircle },
  user: { label: 'User', icon: User },
};
const STATUSES = ['open', 'resolved', 'dismissed'] as const;
const RESOLUTION: Record<string, string> = { dismissed: 'Dismissed', removed: 'Content removed', warned: 'User warned', banned: 'User banned' };

// /admin/reports — the moderation queue (per the design): one row per reported thing, a drawer with it in context.
export function ReportsPage() {
  const [params, setParams] = useSearchParams();
  const status = (STATUSES.includes(params.get('status') as never) ? params.get('status') : 'open') as (typeof STATUSES)[number];
  const type = (params.get('type') ?? '') as ReportTargetType | '';
  const page = Number(params.get('page') ?? 1) || 1;
  const reports = useReports({ status, type: type || undefined, page });
  const [open, setOpen] = useState<{ type: ReportTargetType; id: string } | null>(null);
  const set = (k: string, v: string) =>
    setParams((p) => {
      if (v) p.set(k, v);
      else p.delete(k);
      if (k !== 'page') p.delete('page');
      return p;
    });

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle title="Reports" description="What people have flagged. Open a row to see it in context and decide." />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <nav className="flex rounded-md border border-border bg-card p-0.5" aria-label="Report status">
          {STATUSES.map((s) => (
            <button key={s} type="button" aria-pressed={status === s} onClick={() => set('status', s === 'open' ? '' : s)} className={cn('rounded px-3 py-1.5 text-[13px] font-semibold capitalize', status === s ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary')}>
              {s}
            </button>
          ))}
        </nav>
        <FilterSelect label="Type" value={type} onChange={(v) => set('type', v)} options={(Object.keys(TYPES) as ReportTargetType[]).map((t) => ({ value: t, label: TYPES[t].label }))} />
      </div>

      <TableCard footer={reports.data && <Pagination page={page} pageSize={reports.data.pageSize} total={reports.data.total} onPage={(p) => set('page', String(p))} />}>
        <table className={cn('w-full min-w-[720px] border-collapse', reports.isPlaceholderData && 'opacity-60')}>
          <thead>
            <tr className="border-b border-border">
              {['Reported', 'Author', 'Reasons', 'Reports', status === 'open' ? 'Latest' : 'Outcome'].map((h) => <th key={h} className={th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {(reports.data?.rows ?? []).map((r) => {
              const T = TYPES[r.targetType];
              return (
                <tr key={`${r.targetType}:${r.targetId}`} onClick={() => setOpen({ type: r.targetType, id: r.targetId })} className="cursor-pointer border-b border-row-line last:border-0 hover:bg-row-hover">
                  <td className={td}>
                    <button type="button" className="flex max-w-md items-center gap-2.5 text-left" aria-label={`Open report about ${T.label.toLowerCase()} ${r.snapshot}`}>
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-surface-2 text-text-secondary" title={T.label}><T.icon size={14} /></span>
                      <span className="line-clamp-2 text-text-primary">{r.snapshot || '(no text)'}</span>
                    </button>
                  </td>
                  <td className={cn(td, 'whitespace-nowrap')}>{r.author ? `@${r.author.username}` : 'Deleted user'}</td>
                  <td className={td}>
                    <span className="flex flex-wrap gap-1">
                      {r.reasons.map((x) => (
                        <span key={x.reason} className="rounded-[4px] bg-error/8 px-1.5 py-0.5 text-[11px] font-semibold text-error">
                          {x.reason}{x.count > 1 && ` ×${x.count}`}
                        </span>
                      ))}
                    </span>
                  </td>
                  <td className={cn(td, 'font-semibold')}>{r.count}</td>
                  <td className={cn(td, 'whitespace-nowrap text-text-secondary')}>{status === 'open' ? formatAgo(r.latest) : (RESOLUTION[r.resolution ?? ''] ?? '—')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {reports.data?.rows.length === 0 && (
          <div className="flex flex-col items-center px-4 py-12 text-center">
            <CircleCheck size={28} className="mb-2 text-success" />
            <p className="text-sm font-semibold text-text-primary">{status === 'open' ? 'All clear — nothing waiting for review' : `Nothing ${status} yet`}</p>
          </div>
        )}
      </TableCard>

      {open && <ReportDrawer target={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

type Action = 'dismiss' | 'remove' | 'warn' | 'ban';
const ACTIONS: Record<Action, { title: string; body: string; confirm: string; done: string; danger: boolean }> = {
  dismiss: { title: 'Dismiss these reports?', body: 'Nothing happens to the content or its author. The reports move to Dismissed.', confirm: 'Dismiss', done: 'Reports dismissed', danger: false },
  remove: { title: 'Remove this content?', body: 'It’s deleted for everyone and the author is told why (without your name). The reports are marked resolved.', confirm: 'Remove content', done: 'Content removed', danger: true },
  warn: { title: 'Warn the author?', body: 'They get a notice from “the Grove team” with your note. The content stays up.', confirm: 'Send warning', done: 'Warning sent', danger: false },
  ban: { title: 'Ban the author?', body: 'They’re signed out everywhere and can’t sign in. Your note is shown to them as the reason.', confirm: 'Ban user', done: 'User banned', danger: true },
};

function ReportDrawer({ target, onClose }: { target: { type: ReportTargetType; id: string }; onClose: () => void }) {
  const { data: me } = useMe();
  const detail = useReportDetail(target);
  const resolve = useResolveReport();
  const [action, setAction] = useState<Action | null>(null);
  const d = detail.data;
  const isOpen = !!d?.reports.some((r) => r.status === 'open');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !action && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, action]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end bg-black/35" onMouseDown={onClose}>
      <aside role="dialog" aria-label="Report details" onMouseDown={(e) => e.stopPropagation()} className="flex h-full w-full max-w-lg flex-col bg-card shadow-modal">
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="flex items-center gap-2 text-[15px] font-bold text-text-primary">
            <ShieldAlert size={17} className="text-error" /> Reported {TYPES[target.type].label.toLowerCase()}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex size-8 items-center justify-center rounded-full hover:bg-bg"><X size={17} /></button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {!d ? (
            <div className="flex flex-col gap-3"><Skeleton className="h-24 rounded-lg" /><Skeleton className="h-16 rounded-lg" /></div>
          ) : (
            <>
              <Context d={d} />
              {d.author && (
                <section className="mt-4 rounded-lg border border-border p-3">
                  <h3 className="mb-2 text-[11px] font-bold tracking-[0.06em] text-text-secondary uppercase">Author</h3>
                  <div className="flex items-center gap-2.5">
                    <Avatar name={d.author.displayName} src={d.author.avatarUrl} size={34} />
                    <div className="min-w-0 flex-1">
                      <Link to={`/u/${d.author.username}`} className="block truncate text-sm font-semibold hover:underline">{d.author.displayName}</Link>
                      <p className="truncate text-xs text-text-secondary">@{d.author.username} · joined {formatPostDate(d.author.createdAt)}</p>
                    </div>
                    <AdminRoleBadge role={d.author.role} />
                    {d.author.status !== 'active' && <StatusBadge status={d.author.status as 'suspended' | 'banned'} />}
                  </div>
                  <p className={cn('mt-2 text-xs', d.priorAboutAuthor ? 'font-semibold text-warning-ink' : 'text-text-secondary')}>
                    {d.priorAboutAuthor ? `${d.priorAboutAuthor} earlier report${d.priorAboutAuthor === 1 ? '' : 's'} about them led to action` : 'No earlier action against them'}
                  </p>
                </section>
              )}
              <section className="mt-4">
                <h3 className="mb-2 text-[11px] font-bold tracking-[0.06em] text-text-secondary uppercase">Reports ({d.reports.length})</h3>
                <ul className="flex flex-col gap-2">
                  {d.reports.map((r) => (
                    <li key={r.id} className="rounded-lg bg-bg px-3 py-2 text-[13px]">
                      <p><strong>{r.reporter?.displayName ?? 'Deleted user'}</strong> · <span className="font-semibold text-error">{r.reason}</span> · <span className="text-text-secondary">{formatAgo(r.createdAt)}</span></p>
                      {r.details && <p className="mt-0.5 text-text-secondary">“{r.details}”</p>}
                      {r.status !== 'open' && <p className="mt-0.5 text-xs text-text-tertiary">{RESOLUTION[r.resolution ?? ''] ?? r.status}{r.note && ` — ${r.note}`}</p>}
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </div>

        {d && isOpen && (
          <footer className="flex flex-wrap gap-2 border-t border-border p-3">
            <Button size="sm" variant="outline" onClick={() => setAction('dismiss')}><CircleCheck size={15} /> Dismiss</Button>
            {d.type !== 'user' && d.exists && <Button size="sm" variant="danger-outline" onClick={() => setAction('remove')}><Trash2 size={15} /> Remove content</Button>}
            {d.author && <Button size="sm" variant="outline" onClick={() => setAction('warn')}><ShieldAlert size={15} /> Warn user</Button>}
            {me?.role === 'super_admin' && d.author && d.author.role !== 'super_admin' && d.author.status !== 'banned' && (
              <Button size="sm" variant="danger" onClick={() => setAction('ban')}><Ban size={15} /> Ban user</Button>
            )}
          </footer>
        )}
      </aside>

      {action && (
        <ReasonNote
          action={action}
          loading={resolve.isPending}
          error={resolve.error ? errorMessage(resolve.error) : null}
          onCancel={() => (resolve.reset(), setAction(null))}
          onConfirm={(note) =>
            resolve.mutate(
              { ...target, action, note },
              { onSuccess: () => (toast(ACTIONS[action].done), setAction(null), onClose()) },
            )
          }
        />
      )}
    </div>,
    document.body,
  );
}

function ReasonNote({ action, loading, error, onCancel, onConfirm }: { action: Action; loading: boolean; error: string | null; onCancel: () => void; onConfirm: (note: string) => void }) {
  const a = ACTIONS[action];
  return <ReasonDialog open title={a.title} body={a.body} confirmLabel={a.confirm} withReason={action !== 'dismiss'} danger={a.danger} loading={loading} error={error} onCancel={onCancel} onConfirm={onConfirm} />;
}

// The reported thing, the way people saw it.
function Context({ d }: { d: ReportDetail }) {
  if (!d.exists || !d.content) {
    return <p className="rounded-lg border border-dashed border-border p-4 text-center text-[13px] text-text-secondary">This was already deleted. What it said when reported: “{d.reports[0]?.snapshot || '—'}”</p>;
  }
  const c = d.content;
  if (c.kind === 'post') {
    return (
      <article className="overflow-hidden rounded-lg border border-border">
        <PostCover coverUrl={c.coverUrl} theme={c.coverTheme} className="h-24" />
        <div className="p-3">
          <Link to={c.url} className="text-[15px] font-bold hover:underline">{c.title}</Link>
          <p className="mt-1 line-clamp-6 text-[13px] whitespace-pre-wrap text-text-secondary">{plainText(c.body)}</p>
        </div>
      </article>
    );
  }
  if (c.kind === 'comment') {
    return (
      <div className="rounded-lg border border-border p-3 text-[13px]">
        {c.post && <p className="mb-2 text-xs text-text-secondary">On the post <Link to={c.url} className="font-semibold text-primary hover:underline">“{c.post.title}”</Link></p>}
        {c.parent && <p className="mb-2 border-l-2 border-border pl-2 text-text-secondary">Replying to {c.parent.author?.displayName ?? 'someone'}: “{c.parent.body}”</p>}
        <p className="rounded-md bg-error/5 p-2 whitespace-pre-wrap text-text-primary ring-1 ring-error/20">{c.body}</p>
      </div>
    );
  }
  if (c.kind === 'message') {
    return (
      <div className="rounded-lg border border-border p-3">
        <p className="mb-2 text-xs text-text-secondary">In {c.conversation?.name ?? 'a chat'}</p>
        <ul className="flex flex-col gap-1.5 text-[13px]">
          {c.context.map((m) => (
            <li key={m.id} className={cn('rounded-md px-2 py-1.5', m.isTarget ? 'bg-error/5 ring-1 ring-error/25' : 'bg-bg')}>
              <strong>{m.sender}</strong> <span className="text-[11px] text-text-tertiary">{formatAgo(m.createdAt)}</span>
              <p className="whitespace-pre-wrap">{m.text}</p>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return <p className="rounded-lg border border-border p-3 text-[13px] text-text-secondary">The account itself was reported. They've published {c.posts} post{c.posts === 1 ? '' : 's'}.</p>;
}
