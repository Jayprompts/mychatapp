import { Link, useLocation, useSearchParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthHeader } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { FormAlert } from '@/components/ui/FormAlert';
import { Input } from '@/components/ui/Input';
import { errorMessage } from '@/lib/api';
import { useLogin } from '../api';
import { loginSchema } from '../schemas';
import { SocialButtons } from '../components/SocialButtons';

export function LoginPage() {
  const location = useLocation();
  const login = useLogin();
  const [params] = useSearchParams();
  const oauthError = oauthErrorText(params.get('oauth_error'), params.get('oauth_message'));

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    // Coming back from "Session expired": their username is already filled in.
    defaultValues: { identifier: (location.state as { identifier?: string } | null)?.identifier ?? '', password: '' },
  });

  // On success useLogin stores the user; <PublicOnly> then redirects into the app.
  const onSubmit = handleSubmit((values) => login.mutate(values));

  return (
    <>
      <AuthHeader title="Welcome back" subtitle="Log in to your account" />

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <Input
          label="Email or username"
          autoComplete="username"
          autoCapitalize="none"
          autoFocus
          placeholder="you@example.com"
          error={errors.identifier?.message}
          {...register('identifier')}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          error={errors.password?.message}
          {...register('password')}
        />

        {login.isError ? <FormAlert>{errorMessage(login.error)}</FormAlert> : oauthError && <FormAlert>{oauthError}</FormAlert>}

        <Button type="submit" size="lg" fullWidth loading={login.isPending} className="mt-2">
          Log in
        </Button>
      </form>

      <SocialButtons divider="or continue with" />

      <p className="mt-6 text-center text-sm text-text-secondary">
        Don&apos;t have an account?{' '}
        <Link to="/register" state={location.state} className="font-semibold text-primary hover:underline">
          Create one
        </Link>
      </p>
    </>
  );
}

// Coming back from Google/GitHub without signing in (?oauth_error=…): say what happened, plainly.
function oauthErrorText(code: string | null, message: string | null): string | null {
  switch (code) {
    case null:
      return null;
    case 'cancelled':
      return 'Sign-in was cancelled. You can try again, or log in with your password.';
    case 'blocked':
      return message || 'This account can’t sign in right now.';
    case 'email_in_use':
      return 'An account with this email already exists. Log in with your password — you can link Google or GitHub afterwards by signing in with an email they’ve verified.';
    case 'no_email':
      return 'We couldn’t get a verified email from that account. Verify your email with the provider (on GitHub: Settings → Emails), then try again.';
    case 'expired':
      return 'That sign-in took too long or was already used. Please try again.';
    case 'unavailable':
      return 'That sign-in option isn’t available right now.';
    default:
      return 'Something went wrong signing you in. Please try again.';
  }
}
