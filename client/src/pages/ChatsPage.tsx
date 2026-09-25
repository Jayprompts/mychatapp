import { MessageCircle } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';

// Placeholder — the real chat list + conversation view arrive in Phase 3.
export function ChatsPage() {
  return (
    <>
      <PageHeader title="Chats" />
      <div className="flex flex-1 items-center justify-center">
        <EmptyState
          icon={MessageCircle}
          title="No conversations yet"
          description="Start a conversation and your messages will appear here."
        />
      </div>
    </>
  );
}
