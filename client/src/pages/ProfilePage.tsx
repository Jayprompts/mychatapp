import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Bookmark, PenLine, Settings, Users } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { buttonClasses } from '@/components/ui/buttonClasses';
import { useMe } from '@/features/auth/api';
import { useMyPosts, useSavedPosts } from '@/features/blog/api';
import { PostRow } from '@/features/blog/components/PostRow';
import type { PostCard } from '@/features/blog/types';
import { useConversations } from '@/features/chat/api';
import { CommunityAvatar } from '@/features/communities/components/CommunityAvatar';
import { useProfile } from '@/features/profile/api';
import { AvatarCropDialog } from '@/features/profile/components/AvatarCropDialog';
import { ProfileHeader } from '@/features/profile/components/ProfileHeader';
import { ProfileSkeleton } from '@/features/profile/components/ProfileSkeleton';
import { cn } from '@/lib/cn';

const TABS = ['posts', 'communities', 'saved'] as const;
type Tab = (typeof TABS)[number];

// /profile — my profile (per the design): header with photo + stats, then Posts · Communities · Saved.
export function ProfilePage() {
  const { data: me } = useMe();
  const profile = useProfile(me?.username);
  const [params, setParams] = useSearchParams();
  const tab: Tab = TABS.includes(params.get('tab') as Tab) ? (params.get('tab') as Tab) : 'posts';
  const [editingPhoto, setEditingPhoto] = useState(false);

  return (
    <div className="mx-auto w-full max-w-2xl pb-8 sm:p-6">
      {profile.data ? (
        <ProfileHeader
          profile={profile.data}
          onAvatarClick={() => setEditingPhoto(true)}
          actions={
            <>
              <Link to="/settings" aria-label="Settings" className="flex size-10 items-center justify-center rounded-full border-[1.5px] border-border bg-card text-text-secondary transition-colors hover:text-text-primary">
                <Settings size={18} />
              </Link>
              <Link to="/profile/edit" className={buttonClasses({ size: 'sm' })}>
                Edit profile
              </Link>
            </>
          }
        />
      ) : (
        <ProfileSkeleton />
      )}

      <nav aria-label="Profile sections" className="mt-2 flex border-b-2 border-border bg-card px-2 sm:mt-5 sm:rounded-t-xl">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            aria-current={tab === t ? 'page' : undefined}
            onClick={() => setParams(t === 'posts' ? {} : { tab: t }, { replace: true })}
            className={cn(
              '-mb-0.5 flex-1 border-b-2 py-3 text-sm capitalize transition-colors',
              tab === t ? 'border-primary font-bold text-primary' : 'border-transparent font-medium text-text-secondary hover:text-text-primary',
            )}
          >
            {t}
          </button>
        ))}
      </nav>
      <div className="flex flex-col gap-2.5 px-4 pt-4 sm:px-0">
        {tab === 'posts' ? <MyPosts /> : tab === 'communities' ? <MyCommunities /> : <Saved />}
      </div>

      <AvatarCropDialog open={editingPhoto} onClose={() => setEditingPhoto(false)} />
    </div>
  );
}

function Rows({ posts, loading, empty }: { posts: PostCard[]; loading: boolean; empty: React.ReactNode }) {
  if (loading) return Array.from({ length: 3 }, (_, i) => <div key={i} className="skeleton h-[70px] rounded-[14px]" />);
  return posts.length ? posts.map((p) => <PostRow key={p.id} post={p} />) : empty;
}

function MyPosts() {
  const q = useMyPosts();
  return (
    <Rows
      posts={q.data?.pages.flatMap((p) => p.posts) ?? []}
      loading={q.isPending}
      empty={
        <EmptyState
          icon={PenLine}
          title="No posts yet"
          description="Share an idea, a guide or a story with everyone on Grove."
          action={<Link to="/blog/write" className={buttonClasses()}>Write a post</Link>}
        />
      }
    />
  );
}

function Saved() {
  const q = useSavedPosts();
  return (
    <Rows
      posts={q.data?.pages.flatMap((p) => p.posts) ?? []}
      loading={q.isPending}
      empty={<EmptyState icon={Bookmark} title="No saved posts yet" description="Tap the bookmark on any post to keep it here." />}
    />
  );
}

function MyCommunities() {
  const { data, isPending } = useConversations();
  const communities = (data ?? []).filter((c) => c.type === 'community' && c.community);
  if (isPending) return Array.from({ length: 3 }, (_, i) => <div key={i} className="skeleton h-[70px] rounded-[14px]" />);
  if (!communities.length) {
    return (
      <EmptyState
        icon={Users}
        title="No communities yet"
        description="Find your people in Discover, or start your own."
        action={<Link to="/communities?tab=discover" className={buttonClasses()}>Discover communities</Link>}
      />
    );
  }
  return communities.map((c) => (
    <Link key={c.id} to={`/communities/${c.community!.id}`} className="flex items-center gap-3 rounded-[14px] border border-border bg-card px-3.5 py-3 transition-colors hover:bg-bg">
      <CommunityAvatar icon={c.community!.icon} theme={c.community!.theme} size={44} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-text-primary">{c.name}</p>
        <p className="text-xs text-text-secondary">
          {c.members.length} {c.members.length === 1 ? 'member' : 'members'} · {c.myRole === 'member' ? 'Member' : c.myRole === 'owner' ? 'Owner' : 'Admin'}
        </p>
      </div>
    </Link>
  ));
}
