import { useSearchParams } from 'react-router';
import { useAudit } from '@/features/admin/api';
import { AUDIT_ACTION_OPTIONS, describeAudit } from '@/features/admin/audit';
import { FilterSelect, PageTitle, Pagination, TableCard, td, th } from '@/features/admin/components/ui';
import { cn } from '@/lib/cn';

const when = (iso: string) => new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

// /admin/audit — Super Admin: every admin action, newest first, filterable by admin and by type.
export function AuditPage() {
  const [params, setParams] = useSearchParams();
  const actor = params.get('actor') ?? '';
  const action = params.get('action') ?? '';
  const page = Number(params.get('page') ?? 1) || 1;
  const log = useAudit({ actor: actor || undefined, action: action || undefined, page });
  const set = (k: string, v: string) =>
    setParams((p) => {
      if (v) p.set(k, v);
      else p.delete(k);
      if (k !== 'page') p.delete('page');
      return p;
    });

  return (
    <div className="mx-auto max-w-5xl">
      <PageTitle title="Audit log" description="Every action taken by the admin team, kept for accountability." />
      <div className="mb-3 flex flex-wrap gap-2">
        <FilterSelect label="Admin" value={actor} onChange={(v) => set('actor', v)} options={(log.data?.actors ?? []).map((a) => ({ value: a.id, label: a.name }))} />
        <FilterSelect label="Action" value={action} onChange={(v) => set('action', v)} options={AUDIT_ACTION_OPTIONS.map((o) => ({ value: o.value, label: o.label }))} />
      </div>
      <TableCard footer={log.data && <Pagination page={page} pageSize={log.data.pageSize} total={log.data.total} onPage={(p) => set('page', String(p))} />}>
        <table className={cn('w-full min-w-[640px] border-collapse', log.isPlaceholderData && 'opacity-60')}>
          <thead>
            <tr className="border-b border-border">
              {['When', 'Admin', 'Action'].map((h) => <th key={h} className={th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {(log.data?.entries ?? []).map((e) => (
              <tr key={e.id} className="border-b border-[#ECEEF2] last:border-0">
                <td className={cn(td, 'whitespace-nowrap text-text-secondary')}>{when(e.createdAt)}</td>
                <td className={cn(td, 'whitespace-nowrap font-semibold')}>{e.actorName}</td>
                <td className={td}>{describeAudit(e)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {log.data?.entries.length === 0 && <p className="px-4 py-10 text-center text-[13px] text-text-secondary">No admin actions match.</p>}
      </TableCard>
    </div>
  );
}
