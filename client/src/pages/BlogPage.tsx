import { Newspaper } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';

// Placeholder — the feed, post detail and editor arrive in Phase 6.
export function BlogPage() {
  return (
    <>
      <PageHeader title="Blog" />
      <div className="flex flex-1 items-center justify-center">
        <EmptyState icon={Newspaper} title="No posts yet" description="Be the first to share something with the community." />
      </div>
    </>
  );
}
