import { Link } from 'react-router';
import { Flag, MessageSquare, TrendingDown, TrendingUp, Users, UsersRound, type LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAdminStats } from '@/features/admin/api';
import { describeAudit } from '@/features/admin/audit';
import { PageTitle } from '@/features/admin/components/ui';
import { useMe } from '@/features/auth/api';
import { formatAgo } from '@/lib/time';
import { cn } from '@/lib/cn';

function StatCard({ label, value, icon: Icon, accent, note, delta, to }: { label: string; value: number; icon: LucideIcon; accent: string; note: string; delta?: number; to?: string }) {
  const Box = to ? Link : 'div';
  return (
    <Box to={to!} className={cn('flex flex-col gap-3 rounded-[10px] border border-border bg-card p-4 shadow-[0_1px_4px_rgba(0,0,0,0.05)]', to && 'transition-colors hover:border-primary/40')}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.05em] text-text-secondary uppercase">{label}</p>
          <p className="mt-1.5 text-[28px] leading-none font-extrabold text-text-primary">{value.toLocaleString()}</p>
        </div>
        <span className={cn('flex size-[38px] items-center justify-center rounded-[9px] text-white', accent)}>
          <Icon size={18} />
        </span>
      </div>
      <p className="flex items-center gap-1 text-xs text-text-secondary">
        {delta !== undefined && delta !== 0 && (
          <span className={cn('flex items-center gap-0.5 font-semibold', delta > 0 ? 'text-success' : 'text-error')}>
            {delta > 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {delta > 0 ? '+' : ''}
            {delta}
          </span>
        )}
        {note}
      </p>
    </Box>
  );
}

// /admin — the numbers at a glance + what the admin team did recently.
export function DashboardPage() {
  const { data: s } = useAdminStats();
  const { data: me } = useMe();
  const canModerate = me?.role === 'super_admin' || me?.role === 'content_mod';
  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle title="Dashboard" description="How Grove is doing this week." />
      {s ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total users" value={s.users.total} icon={Users} accent="gradient-brand" delta={s.users.newThisWeek - s.users.newLastWeek} note={`${s.users.newThisWeek} joined this week`} />
          <StatCard label="Active communities" value={s.communities.active} icon={UsersRound} accent="bg-community" note={`with messages this week · ${s.communities.total} in total`} />
          <StatCard label="Posts this week" value={s.posts.thisWeek} icon={MessageSquare} accent="bg-primary" delta={s.posts.thisWeek - s.posts.lastWeek} note="vs last week" />
          <StatCard label="Pending reports" value={s.reports.open} icon={Flag} accent={s.reports.open ? 'bg-error' : 'bg-success'} note={s.reports.open ? 'waiting for a moderator' : 'all clear'} to={canModerate ? '/admin/reports' : undefined} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[118px] rounded-[10px]" />)}
        </div>
      )}

      <section className="mt-5 rounded-[10px] border border-border bg-card shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-[15px] font-bold text-text-primary">Recent admin activity</h2>
          {s && s.users.blocked > 0 && (
            <Link to="/admin/users?status=suspended" className="text-xs font-semibold text-primary hover:underline">
              {s.users.blocked} suspended or banned →
            </Link>
          )}
        </header>
        {s?.recent.length ? (
          <ul>
            {s.recent.map((e) => (
              <li key={e.id} className="flex items-baseline justify-between gap-3 border-b border-border px-4 py-2.5 text-[13px] last:border-0">
                <span className="min-w-0 text-text-secondary">
                  <strong className="font-semibold text-text-primary">{e.actorName.split(' (@')[0]}</strong> {describeAudit(e)}
                </span>
                <span className="shrink-0 text-xs text-text-tertiary">{formatAgo(e.createdAt)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-6 text-center text-[13px] text-text-secondary">{s ? 'Nothing yet — admin actions will show up here.' : 'Loading…'}</p>
        )}
      </section>
    </div>
  );
}
