import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { ArrowLeft, Ban, Flag, MessageCircle, UserX } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Menu, type MenuItem } from '@/components/ui/Menu';
import { buttonClasses } from '@/components/ui/buttonClasses';
import { useAuthorPosts } from '@/features/blog/api';
import { PostRow } from '@/features/blog/components/PostRow';
import { ReportDialog } from '@/features/blog/components/ReportDialog';
import type { ReportTarget } from '@/features/blog/types';
import { useOpenDirectChat } from '@/features/chat/api';
import { useProfile, useSetBlocked } from '@/features/profile/api';
import { ProfileHeader } from '@/features/profile/components/ProfileHeader';
import { ProfileSkeleton } from '@/features/profile/components/ProfileSkeleton';
import type { Profile } from '@/features/profile/types';
import { errorMessage } from '@/lib/api';
import { toast } from '@/lib/toast';

// /u/:username — someone else's profile (per the design): Message, ⋯ (block, report), recent posts.
export function UserProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const profile = useProfile(username?.toLowerCase());
  const back = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/chats'));

  if (profile.data?.isMe) return <Navigate to="/profile" replace />;
  return (
    <div className="mx-auto w-full max-w-2xl pb-10 sm:p-6">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/95 px-3 backdrop-blur sm:static sm:mb-4 sm:border-0 sm:bg-transparent sm:px-0">
        <button type="button" onClick={back} aria-label="Back" className="flex size-9 items-center justify-center rounded-full border-[1.5px] border-border bg-bg text-text-primary hover:bg-surface-2">
          <ArrowLeft size={18} />
        </button>
        <span className="truncate text-[15px] font-semibold text-text-primary">{profile.data?.displayName}</span>
      </header>
      {profile.isPending ? (
        <ProfileSkeleton />
      ) : profile.data ? (
        <Loaded profile={profile.data} />
      ) : (
        <EmptyState
          icon={UserX}
          title="User not found"
          description="This account doesn't exist, or it was deleted."
          action={<Link to="/chats" className={buttonClasses({ variant: 'secondary' })}>Back to chats</Link>}
        />
      )}
    </div>
  );
}

function Loaded({ profile: p }: { profile: Profile }) {
  const navigate = useNavigate();
  const open = useOpenDirectChat();
  const setBlocked = useSetBlocked();
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [reporting, setReporting] = useState<ReportTarget | null>(null);
  const posts = useAuthorPosts(p.id);
  const list = posts.data?.pages.flatMap((pg) => pg.posts) ?? [];
  const first = p.displayName.split(' ')[0];

  const items: MenuItem[] = [
    p.blocked === 'byMe'
      ? { label: `Unblock ${first}`, icon: <Ban size={16} />, onSelect: () => setBlocked.mutate({ userId: p.id, blocked: false }, { onSuccess: () => toast(`${first} unblocked`) }) }
      : { label: `Block ${first}`, icon: <Ban size={16} />, danger: true, onSelect: () => setConfirmBlock(true) },
    { label: 'Report user', icon: <Flag size={16} />, danger: true, onSelect: () => setReporting({ type: 'user', id: p.id }) },
  ];

  return (
    <>
      <ProfileHeader
        profile={p}
        actions={
          <>
            <Menu items={items} label="More options" className="rounded-full border-[1.5px] border-border bg-card" />
            <Button
              size="sm"
              variant="secondary"
              loading={open.isPending}
              disabled={!!p.blocked}
              onClick={() =>
                open.mutate(p.id, { onSuccess: (c) => navigate(`/chats/${c.id}`), onError: (e) => toast(errorMessage(e), 'error') })
              }
            >
              <MessageCircle size={16} /> Message
            </Button>
          </>
        }
      />

      {p.blocked && (
        <p className="mx-4 mt-4 rounded-lg border border-border bg-card px-4 py-3 text-sm text-text-secondary sm:mx-0">
          {p.blocked === 'byMe' ? `You blocked ${first}. You can't message each other until you unblock them.` : `You can't message ${first}.`}
        </p>
      )}

      <h2 className="mt-6 mb-3 px-4 text-sm font-bold text-text-primary sm:px-0">Recent posts</h2>
      <div className="flex flex-col gap-2.5 px-4 sm:px-0">
        {posts.isPending ? (
          Array.from({ length: 2 }, (_, i) => <div key={i} className="skeleton h-[70px] rounded-[14px]" />)
        ) : list.length ? (
          list.map((post) => <PostRow key={post.id} post={post} />)
        ) : (
          <p className="rounded-[14px] border border-dashed border-border px-4 py-6 text-center text-sm text-text-secondary">{first} hasn't published anything yet.</p>
        )}
        {posts.hasNextPage && (
          <Button variant="secondary" size="sm" className="self-center" onClick={() => void posts.fetchNextPage()} loading={posts.isFetchingNextPage}>
            Load more
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={confirmBlock}
        title={`Block ${p.displayName}?`}
        body={`${first} won't be able to message you, and won't find you in search. They aren't told. Groups you share aren't affected.`}
        confirmLabel="Block"
        loading={setBlocked.isPending}
        error={setBlocked.isError ? errorMessage(setBlocked.error) : null}
        onCancel={() => setConfirmBlock(false)}
        onConfirm={() =>
          setBlocked.mutate({ userId: p.id, blocked: true }, { onSuccess: () => (setConfirmBlock(false), toast(`${first} blocked`)) })
        }
      />
      <ReportDialog target={reporting} onClose={() => setReporting(null)} />
    </>
  );
}
