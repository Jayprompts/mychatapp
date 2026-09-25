import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { Link2Off } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormAlert } from '@/components/ui/FormAlert';
import { Skeleton } from '@/components/ui/Skeleton';
import { buttonClasses } from '@/components/ui/buttonClasses';
import { useInvitePreview, useJoinByInvite } from '@/features/communities/api';
import { CommunityAvatar, CommunityCover } from '@/features/communities/components/CommunityAvatar';
import { errorMessage } from '@/lib/api';
import { toast } from '@/lib/toast';

// /join/:code — someone shared an invite link (works even for private communities).
export function InvitePage() {
  const { code = '' } = useParams();
  const preview = useInvitePreview(code);
  const join = useJoinByInvite();
  const navigate = useNavigate();

  if (preview.isPending) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <Skeleton className="h-80 w-full max-w-md rounded-xl" />
      </div>
    );
  }
  if (!preview.data) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <EmptyState
          icon={Link2Off}
          title="Invite link not valid"
          description="It may have expired or been reset. Ask for a new link."
          action={
            <Link to="/communities?tab=discover" className={buttonClasses({ variant: 'secondary' })}>
              Browse communities
            </Link>
          }
        />
      </div>
    );
  }

  const c = preview.data;
  if (c.myStatus === 'member') return <Navigate to={`/communities/${c.id}`} replace />;

  return (
    <div className="flex flex-1 items-center justify-center overflow-y-auto p-4 sm:p-6">
      <div className="w-full max-w-md overflow-hidden rounded-xl bg-card shadow-modal">
        <CommunityCover coverUrl={c.coverUrl} theme={c.theme} className="h-28" />
        <div className="px-6 pb-6 text-center">
          <CommunityAvatar icon={c.icon} theme={c.theme} size={72} className="relative -mt-9 ring-4 ring-card" />
          <p className="mt-3 text-sm font-semibold text-primary">You've been invited to join</p>
          <h1 className="mt-1 text-xl font-bold text-text-primary">{c.name}</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {c.memberCount.toLocaleString()} {c.memberCount === 1 ? 'member' : 'members'} · {c.category}
            {c.visibility === 'private' && ' · Private'}
          </p>
          {c.description && <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-text-primary">{c.description}</p>}
          {join.isError && (
            <div className="mt-4 text-left">
              <FormAlert>{errorMessage(join.error)}</FormAlert>
            </div>
          )}
          <Button
            fullWidth
            className="mt-5"
            loading={join.isPending}
            onClick={() =>
              join.mutate(code, {
                onSuccess: (joined) => {
                  toast(`Welcome to ${joined.name} 🎉`);
                  navigate(`/communities/${joined.id}`, { replace: true });
                },
              })
            }
          >
            Join community
          </Button>
        </div>
      </div>
    </div>
  );
}
