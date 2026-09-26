import { Link, useLocation } from 'react-router';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthHeader } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { FormAlert } from '@/components/ui/FormAlert';
import { Input } from '@/components/ui/Input';
import { ApiError, errorMessage } from '@/lib/api';
import { useRegister } from '../api';
import { registerSchema, type RegisterValues } from '../schemas';
import { SocialButtons } from '../components/SocialButtons';

const SERVER_FIELDS = ['username', 'email', 'password'] as const;

export function RegisterPage() {
  const location = useLocation();
  const registerUser = useRegister();

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: '', email: '', password: '', confirmPassword: '', acceptTerms: false },
  });

  const acceptedTerms = useWatch({ control, name: 'acceptTerms' });

  const onSubmit = handleSubmit((values: RegisterValues) => {
    registerUser.mutate(
      // Server lowercases the username; the typed version becomes the display name ("Jay" -> @jay, "Jay").
      { username: values.username, displayName: values.username, email: values.email, password: values.password },
      {
        onError: (err) => {
          // Put server field errors (e.g. "That email is already taken") under the right input.
          if (err instanceof ApiError && err.details) {
            for (const field of SERVER_FIELDS) {
              const message = err.details[field]?.[0];
              if (message) setError(field, { message }, { shouldFocus: true });
            }
          }
        },
      },
    );
  });

  // Field-level errors are shown under inputs; only show the banner for anything else.
  const bannerError =
    registerUser.isError && !(registerUser.error instanceof ApiError && registerUser.error.details)
      ? errorMessage(registerUser.error)
      : null;

  return (
    <>
      <AuthHeader title="Create your account" subtitle="It's free and only takes a minute" />

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <Input
          label="Username"
          autoComplete="username"
          autoCapitalize="none"
          autoFocus
          placeholder="e.g. alexjohnson"
          hint="Letters, numbers, underscores and dots."
          error={errors.username?.message}
          {...register('username')}
        />
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          hint="8+ characters with at least one letter and one number."
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="Repeat your password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <label className="mt-1 flex cursor-pointer items-start gap-2.5 text-[13px] leading-normal text-text-secondary">
          <input type="checkbox" className="mt-0.5 size-[18px] shrink-0 cursor-pointer accent-primary" {...register('acceptTerms')} />
          <span>
            I agree to the <span className="font-medium text-primary">Terms of Service</span> and{' '}
            <span className="font-medium text-primary">Privacy Policy</span>
          </span>
        </label>
        {errors.acceptTerms && <p className="-mt-2 text-xs text-error">{errors.acceptTerms.message}</p>}

        {bannerError && <FormAlert>{bannerError}</FormAlert>}

        <Button type="submit" size="lg" fullWidth disabled={!acceptedTerms} loading={registerUser.isPending} className="mt-2">
          Create account
        </Button>
      </form>

      <SocialButtons divider="or sign up with" />

      <p className="mt-6 text-center text-sm text-text-secondary">
        Already have an account?{' '}
        <Link to="/login" state={location.state} className="font-semibold text-primary hover:underline">
          Log in
        </Link>
      </p>
    </>
  );
}
