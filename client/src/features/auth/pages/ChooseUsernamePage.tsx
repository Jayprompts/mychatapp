import { Link, Navigate, useLocation } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthHeader } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { FormAlert } from '@/components/ui/FormAlert';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { ApiError, errorMessage } from '@/lib/api';
import { useCompleteOAuth, usePendingOAuth } from '../api';
import { GitHubIcon, GoogleIcon } from '../components/SocialButtons';
import { chooseUsernameSchema } from '../schemas';
import type { PendingOAuth } from '../types';

// /welcome/username — the one step after "Continue with Google/GitHub" for someone new to Grove:
// confirm their name and pick a username (changeable later in Edit profile). Then straight in.
export function ChooseUsernamePage() {
  const pending = usePendingOAuth();
  const from = (useLocation().state as { from?: string } | null)?.from;

  if (pending.isPending) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-12 rounded-md" />
        <Skeleton className="h-12 rounded-md" />
      </div>
    );
  }
  if (!pending.data) {
    return (
      <>
        <AuthHeader title="Let’s try that again" subtitle="That sign-in has expired or was already finished." />
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Back to log in
        </Link>
      </>
    );
  }
  // Where they were headed before Google/GitHub: <PublicOnly> takes them there once they're in.
  if (from !== pending.data.next) return <Navigate to="/welcome/username" replace state={{ from: pending.data.next }} />;
  return <ChooseForm pending={pending.data} />;
}

function ChooseForm({ pending }: { pending: PendingOAuth }) {
  const complete = useCompleteOAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(chooseUsernameSchema),
    defaultValues: { displayName: pending.name.slice(0, 50), username: pending.suggestion },
  });
  const serverError = complete.error instanceof ApiError ? complete.error.details?.username?.[0] : undefined;
  const provider = pending.provider === 'google' ? 'Google' : 'GitHub';

  return (
    <>
      <AuthHeader title="Choose your username" subtitle="Almost there — this is how people find and mention you on Grove." />

      <div className="mb-5 flex items-center gap-3 rounded-xl border border-border bg-bg px-4 py-3">
        {pending.picture ? (
          <img src={pending.picture} alt="" className="size-10 shrink-0 rounded-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-card">{pending.provider === 'google' ? <GoogleIcon /> : <GitHubIcon />}</span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text-primary">{pending.email}</p>
          <p className="flex items-center gap-1.5 text-xs text-text-secondary">
            {pending.provider === 'google' ? <GoogleIcon size={12} /> : <GitHubIcon size={12} />} Verified by {provider}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit((v) => complete.mutate(v))} noValidate className="flex flex-col gap-4">
        <Input label="Your name" autoComplete="name" error={errors.displayName?.message} {...register('displayName')} />
        <Input
          label="Username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoFocus
          hint="Letters, numbers, dots and underscores. You can change it later in Edit profile."
          error={errors.username?.message ?? serverError}
          {...register('username')}
        />
        {complete.isError && !serverError && <FormAlert>{errorMessage(complete.error)}</FormAlert>}
        <Button type="submit" size="lg" fullWidth loading={complete.isPending} className="mt-2">
          Continue
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        Not you?{' '}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Use a different account
        </Link>
      </p>
    </>
  );
}
