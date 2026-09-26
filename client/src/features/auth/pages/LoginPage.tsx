import { Link, useLocation } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthHeader } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { FormAlert } from '@/components/ui/FormAlert';
import { Input } from '@/components/ui/Input';
import { errorMessage } from '@/lib/api';
import { useLogin } from '../api';
import { loginSchema } from '../schemas';

export function LoginPage() {
  const location = useLocation();
  const login = useLogin();

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

        {login.isError && <FormAlert>{errorMessage(login.error)}</FormAlert>}

        <Button type="submit" size="lg" fullWidth loading={login.isPending} className="mt-2">
          Log in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        Don&apos;t have an account?{' '}
        <Link to="/register" state={location.state} className="font-semibold text-primary hover:underline">
          Create one
        </Link>
      </p>
    </>
  );
}
