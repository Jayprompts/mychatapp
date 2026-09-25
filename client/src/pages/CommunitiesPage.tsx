import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { Compass, Plus, SearchX } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { buttonClasses } from '@/components/ui/buttonClasses';
import { useConversations } from '@/features/chat/api';
import { ChatView } from '@/features/chat/components/ChatView';
import { useCommunity } from '@/features/communities/api';
import { CommunityPreview } from '@/features/communities/components/CommunityPreview';
import { CreateCommunityDialog } from '@/features/communities/components/CreateCommunityDialog';
import { DiscoverView } from '@/features/communities/components/DiscoverView';
import { MyCommunitiesList } from '@/features/communities/components/MyCommunitiesList';
import { cn } from '@/lib/cn';

// /communities and /communities/:communityId
//   phone       tabs (My communities · Discover); a community opens full screen
//   tablet+     "My communities" column + Discover grid (or the open community) on the right
export function CommunitiesPage() {
  const { communityId } = useParams();
  const [params] = useSearchParams();
  const discoverTab = params.get('tab') === 'discover';
  const [creating, setCreating] = useState(false);
  const conversations = useConversations();
  const mine = (conversations.data ?? []).filter((c) => c.type === 'community');
  const open = communityId ? mine.find((c) => c.community?.id === communityId) : undefined;
  const showRight = !!communityId || discoverTab;

  const createButton = (
    <button
      type="button"
      onClick={() => setCreating(true)}
      aria-label="Create a community"
      className="gradient-brand flex size-10 items-center justify-center rounded-full text-white shadow-brand transition-transform hover:scale-105 active:scale-95"
    >
      <Plus size={20} strokeWidth={2.4} />
    </button>
  );

  return (
    <div className="flex min-h-0 flex-1">
      {/* My communities */}
      <section
        aria-label="My communities"
        className={cn('min-h-0 w-full flex-col border-border bg-card md:flex md:w-80 md:shrink-0 md:border-r lg:w-[360px]', showRight ? 'hidden' : 'flex')}
      >
        <header className="flex h-16 shrink-0 items-center justify-between px-4">
          <h1 className="text-[22px] font-bold tracking-tight text-text-primary">Communities</h1>
          {createButton}
        </header>
        <MobileTabs discover={false} />
        <Link
          to="/communities"
          className="mx-3 mb-2 hidden items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-semibold text-primary transition-colors hover:bg-primary/6 md:flex"
        >
          <span className="flex size-10 items-center justify-center rounded-[12px] bg-primary/10">
            <Compass size={20} />
          </span>
          Discover communities
        </Link>
        <div className="min-h-0 flex-1 overflow-y-auto pb-6">
          <MyCommunitiesList communities={mine} activeId={communityId} loading={conversations.isPending} />
        </div>
      </section>

      {/* Discover · a community */}
      <section aria-label="Community" className={cn('min-h-0 min-w-0 flex-1 flex-col bg-bg', showRight ? 'flex' : 'hidden md:flex')}>
        {communityId ? (
          open ? (
            <ChatView key={open.id} conversationId={open.id} />
          ) : (
            <CommunityRoute key={communityId} id={communityId} />
          )
        ) : (
          <>
            <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4 sm:px-5">
              <h2 className="text-[22px] font-bold tracking-tight text-text-primary">Discover</h2>
              <span className="md:hidden">{createButton}</span>
            </header>
            <MobileTabs discover />
            <DiscoverView />
          </>
        )}
      </section>

      <CreateCommunityDialog open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}

// Phones only: switch between the two lists.
function MobileTabs({ discover }: { discover: boolean }) {
  const tab = (active: boolean) =>
    cn('flex-1 border-b-2 pb-2.5 text-center text-sm font-semibold', active ? 'border-primary text-primary' : 'border-transparent text-text-secondary');
  return (
    <nav className="flex shrink-0 border-b border-border bg-card px-4 md:hidden" aria-label="Community lists">
      <Link to="/communities" className={tab(!discover)}>
        My communities
      </Link>
      <Link to="/communities?tab=discover" className={tab(discover)}>
        Discover
      </Link>
    </nav>
  );
}

// A community I'm not in (yet): preview + join. Becomes the chat as soon as I'm a member.
function CommunityRoute({ id }: { id: string }) {
  const community = useCommunity(id);
  if (community.isPending) {
    return (
      <div className="flex-1">
        <Skeleton className="h-44 rounded-none" />
        <div className="mx-auto max-w-xl px-6">
          <Skeleton className="-mt-10 size-20 rounded-[22px]" />
          <Skeleton className="mt-4 h-6 w-1/2" />
          <Skeleton className="mt-2 h-4 w-1/3" />
        </div>
      </div>
    );
  }
  if (!community.data) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <EmptyState
          icon={SearchX}
          title="Community not found"
          description="It may have been deleted."
          action={
            <Link to="/communities" className={buttonClasses({ variant: 'secondary' })}>
              Back to communities
            </Link>
          }
        />
      </div>
    );
  }
  if (community.data.myStatus === 'member' && community.data.conversationId) {
    return <ChatView key={community.data.conversationId} conversationId={community.data.conversationId} />;
  }
  return <CommunityPreview community={community.data} />;
}
