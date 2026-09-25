import { Users } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';

// Placeholder — Discover / My communities arrive in Phase 5.
export function CommunitiesPage() {
  return (
    <>
      <PageHeader title="Communities" />
      <div className="flex flex-1 items-center justify-center">
        <EmptyState
          icon={Users}
          title="No communities yet"
          description="Communities you join or create will show up here."
        />
      </div>
    </>
  );
}
