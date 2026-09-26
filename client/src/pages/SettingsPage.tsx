import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { ArrowLeft, ChevronRight, KeyRound, LogOut, Mail, Monitor, MonitorSmartphone, Moon, Sun, Trash2 } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FormAlert } from '@/components/ui/FormAlert';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Switch } from '@/components/ui/Switch';
import { oauthConnectUrl, useAuthProviders, useLogout, useLogoutAll, useMe } from '@/features/auth/api';
import { GitHubIcon, GoogleIcon } from '@/features/auth/components/SocialButtons';
import { useUpdateNotificationPrefs } from '@/features/notifications/api';
import { desktopEnabled, desktopPermission, disableDesktop, enableDesktop } from '@/lib/desktopNotify';
import { needsHomeScreen, pushSupported } from '@/lib/push';
import type { OAuthProvider, User } from '@/features/auth/types';
import { useBlockedUsers, useChangeEmail, useChangePassword, useDeleteAccount, useSetBlocked, useUnlinkProvider, useUpdatePrivacy } from '@/features/profile/api';
import { ApiError, errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { setThemePref, useThemePref, type ThemePref } from '@/lib/theme';
import { formatPostDate } from '@/lib/time';
import { toast } from '@/lib/toast';

const fieldError = (err: unknown, f: string) => (err instanceof ApiError ? err.details?.[f]?.[0] : undefined);
const generalError = (err: unknown) => (err && !(err instanceof ApiError && err.details) ? errorMessage(err) : null);

// /settings — per the design: Account · Sign-in methods · Notifications · Privacy · Appearance · Sessions · Danger zone.
export function SettingsPage() {
  const { data: me } = useMe();
  const navigate = useNavigate();
  if (!me) return null;
  return (
    <div className="mx-auto w-full max-w-xl pb-12 sm:p-6">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/95 px-3 backdrop-blur sm:static sm:mb-4 sm:border-0 sm:bg-transparent sm:px-0">
        <button type="button" onClick={() => navigate('/profile')} aria-label="Back to profile" className="flex size-9 items-center justify-center rounded-full border-[1.5px] border-border bg-bg text-text-primary hover:bg-surface-2">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-bold text-text-primary">Settings</h1>
      </header>
      <div className="flex flex-col gap-4 px-4 pt-4 sm:px-0 sm:pt-0">
        <Account me={me} />
        <SignInMethods me={me} />
        <Section title="Notifications">
          <NotificationSettings me={me} />
        </Section>
        <Section title="Privacy">
          <Privacy me={me} />
        </Section>
        <Section title="Appearance">
          <Appearance />
        </Section>
        <Sessions />
        <DangerZone />
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl bg-card px-5 py-4 shadow-card">
      <h2 className="mb-1 text-[11px] font-bold tracking-[0.08em] text-text-secondary uppercase">{title}</h2>
      {children}
    </section>
  );
}

function Row({ icon, label, value, onClick }: { icon: ReactNode; label: string; value: string; onClick?: () => void }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag type={onClick ? 'button' : undefined} onClick={onClick} className="flex w-full items-center gap-3 border-b border-border py-3.5 text-left last:border-0">
      <span className="flex size-9 items-center justify-center rounded-[10px] bg-primary/8 text-primary">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium text-text-primary">{label}</span>
        <span className="block truncate text-[13px] text-text-secondary">{value}</span>
      </span>
      {onClick && <ChevronRight size={18} className="text-text-tertiary" />}
    </Tag>
  );
}

function Account({ me }: { me: User }) {
  const [dialog, setDialog] = useState<'email' | 'password' | null>(null);
  const blocked = useBlockedUsers();
  const unblock = useSetBlocked();
  const local = me.authProvider === 'local';

  return (
    <Section title="Account">
      {/* Google/GitHub-only accounts have no password to confirm an email change with (their email comes from the provider) */}
      <Row icon={<Mail size={17} />} label="Email address" value={me.email} onClick={local ? () => setDialog('email') : undefined} />
      {local && (
        <Row
          icon={<KeyRound size={17} />}
          label="Change password"
          value={me.passwordChangedAt ? `Last changed ${formatPostDate(me.passwordChangedAt)}` : 'Never changed'}
          onClick={() => setDialog('password')}
        />
      )}
      <div className="pt-3">
        <h3 className="mb-1 text-[13px] font-semibold text-text-secondary">Blocked users</h3>
        {blocked.data?.length ? (
          <ul>
            {blocked.data.map((u) => (
              <li key={u.id} className="flex items-center gap-2.5 border-b border-border py-2 last:border-0">
                <Avatar name={u.displayName} src={u.avatarUrl} size={34} />
                <span className="min-w-0 flex-1 truncate text-sm text-text-primary">{u.displayName}</span>
                <button
                  type="button"
                  disabled={unblock.isPending}
                  onClick={() => unblock.mutate({ userId: u.id, blocked: false }, { onSuccess: () => (void blocked.refetch(), toast(`${u.displayName} unblocked`)) })}
                  className="rounded-full bg-primary/8 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/12"
                >
                  Unblock
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-2 text-[13px] text-text-tertiary">{blocked.isPending ? 'Loading…' : 'Nobody — people you block show up here.'}</p>
        )}
      </div>
      <EmailDialog open={dialog === 'email'} onClose={() => setDialog(null)} current={me.email} />
      <PasswordDialog open={dialog === 'password'} onClose={() => setDialog(null)} />
    </Section>
  );
}

function EmailDialog({ open, onClose, current }: { open: boolean; onClose: () => void; current: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const change = useChangeEmail();
  const close = () => (setEmail(''), setPassword(''), change.reset(), onClose());
  return (
    <Modal open={open} onClose={close} title="Change email">
      <form
        className="flex flex-col gap-4 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          change.mutate({ email, password }, { onSuccess: () => (toast('Email updated'), close()) });
        }}
      >
        <p className="text-[13px] text-text-secondary">Currently {current}.</p>
        <Input label="New email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={fieldError(change.error, 'email')} required />
        <Input label="Your password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={fieldError(change.error, 'password')} required />
        {generalError(change.error) && <FormAlert>{generalError(change.error)}</FormAlert>}
        <Button type="submit" fullWidth loading={change.isPending} disabled={!email || !password}>
          Update email
        </Button>
      </form>
    </Modal>
  );
}

function PasswordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const change = useChangePassword();
  const close = () => (setForm({ current: '', next: '', confirm: '' }), change.reset(), onClose());
  const mismatch = form.confirm.length > 0 && form.next !== form.confirm;
  return (
    <Modal open={open} onClose={close} title="Change password">
      <form
        className="flex flex-col gap-4 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (mismatch) return;
          change.mutate(
            { currentPassword: form.current, newPassword: form.next },
            { onSuccess: () => (toast('Password changed — other devices were signed out'), close()) },
          );
        }}
      >
        <Input label="Current password" type="password" autoComplete="current-password" value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} error={fieldError(change.error, 'password')} required />
        <Input label="New password" type="password" autoComplete="new-password" value={form.next} onChange={(e) => setForm({ ...form, next: e.target.value })} error={fieldError(change.error, 'newPassword')} hint="At least 8 characters, with a letter and a number" required />
        <Input label="Confirm new password" type="password" autoComplete="new-password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} error={mismatch ? "Passwords don't match" : undefined} required />
        {generalError(change.error) && <FormAlert>{generalError(change.error)}</FormAlert>}
        <p className="text-xs text-text-secondary">For your security, every other device will be signed out.</p>
        <Button type="submit" fullWidth loading={change.isPending} disabled={!form.current || !form.next || mismatch}>
          Change password
        </Button>
      </form>
    </Modal>
  );
}

function NotificationSettings({ me }: { me: User }) {
  const update = useUpdateNotificationPrefs();
  const [desktop, setDesktop] = useState(desktopEnabled);
  const permission = desktopPermission();
  const set = (key: keyof User['notificationPrefs']) => (value: boolean) =>
    update.mutate({ [key]: value }, { onError: (e) => toast(errorMessage(e), 'error') });
  const p = me.notificationPrefs;
  return (
    <div className="divide-y divide-border">
      <Switch checked={p.messages} onChange={set('messages')} disabled={update.isPending} label="Messages & mentions" description="New message alerts, @mentions, and being added to groups" />
      <Switch checked={p.social} onChange={set('social')} disabled={update.isPending} label="Posts & comments" description="Likes, comments and replies on what you write" />
      <Switch checked={p.communities} onChange={set('communities')} disabled={update.isPending} label="Communities" description="People joining or asking to join, and your requests being approved" />
      <Switch
        checked={desktop}
        disabled={permission === 'unsupported' || permission === 'denied'}
        onChange={async (on) => {
          if (!on) {
            disableDesktop();
            setDesktop(false);
            return;
          }
          const granted = await enableDesktop();
          setDesktop(granted);
          if (!granted) toast('Your browser blocked notifications — allow them in its site settings', 'error', 4500);
        }}
        label="Notifications on this device"
        description={
          needsHomeScreen()
            ? 'On iPhone and iPad: tap Share → “Add to Home Screen”, open Grove from there, then turn this on.'
            : permission === 'unsupported'
              ? "This browser doesn't support notifications."
              : permission === 'denied'
                ? 'Blocked in this browser — allow notifications for this site in its settings, then come back.'
                : pushSupported()
                  ? 'Alerts when Grove is in another tab — or closed.'
                  : 'Alerts when Grove is open in another tab or window.'
        }
      />
    </div>
  );
}

function Privacy({ me }: { me: User }) {
  const update = useUpdatePrivacy();
  return (
    <Switch
      checked={me.showOnlineStatus}
      disabled={update.isPending}
      onChange={(showOnlineStatus) => update.mutate({ showOnlineStatus }, { onError: (e) => toast(errorMessage(e), 'error') })}
      label="Show online status"
      description={me.showOnlineStatus ? 'People can see when you’re active and when you were last seen.' : 'Hidden — nobody sees when you’re online or last seen.'}
    />
  );
}

const PROVIDER_NAME: Record<OAuthProvider, string> = { google: 'Google', github: 'GitHub' };
const LINK_ERRORS: Record<string, string> = {
  linked_elsewhere: 'That account is already connected to a different Grove account.',
  cancelled: 'Connecting was cancelled.',
  expired: 'That took too long — please try again.',
};

// Password, Google, GitHub: which ways you can sign in. Connect adds one (a trip to Google/GitHub and back);
// Disconnect removes one — never the last.
function SignInMethods({ me }: { me: User }) {
  const { data: available = [] } = useAuthProviders();
  const unlink = useUnlinkProvider();
  const [params, setParams] = useSearchParams();
  const shown = useRef('');

  // Back from Google/GitHub: say how it went (once), then tidy the address.
  useEffect(() => {
    const connected = params.get('connected') as OAuthProvider | null;
    const error = params.get('oauth_error');
    if ((!connected && !error) || shown.current === params.toString()) return;
    shown.current = params.toString();
    if (connected && PROVIDER_NAME[connected]) toast(`${PROVIDER_NAME[connected]} connected — you can sign in with it now`);
    if (error) toast(LINK_ERRORS[error] ?? 'Couldn’t connect that account. Please try again.', 'error');
    setParams({}, { replace: true });
  }, [params, setParams]);

  const providers = (['google', 'github'] as const).filter((p) => available.includes(p) || me.linkedProviders.includes(p));
  if (!providers.length) return null;
  const methods = (me.authProvider === 'local' ? 1 : 0) + me.linkedProviders.length;

  return (
    <Section title="Sign-in methods">
      <div className="flex items-center gap-3 border-b border-border py-3.5">
        <span className="flex size-9 items-center justify-center rounded-[10px] bg-primary/8 text-primary">
          <KeyRound size={17} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-medium text-text-primary">Password</span>
          <span className="block text-[13px] text-text-secondary">{me.authProvider === 'local' ? 'Email or username + password' : 'Not set — you sign in with ' + PROVIDER_NAME[me.authProvider]}</span>
        </span>
      </div>
      {providers.map((p) => {
        const linked = me.linkedProviders.includes(p);
        return (
          <div key={p} className="flex items-center gap-3 border-b border-border py-3.5 last:border-0">
            <span className="flex size-9 items-center justify-center rounded-[10px] bg-bg text-text-primary">{p === 'google' ? <GoogleIcon /> : <GitHubIcon />}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-medium text-text-primary">{PROVIDER_NAME[p]}</span>
              <span className={cn('block text-[13px]', linked ? 'text-success-ink' : 'text-text-secondary')}>{linked ? 'Connected' : 'Not connected'}</span>
            </span>
            {linked ? (
              <button
                type="button"
                disabled={methods <= 1 || unlink.isPending}
                title={methods <= 1 ? 'This is your only way to sign in' : undefined}
                onClick={() => unlink.mutate(p, { onSuccess: () => toast(`${PROVIDER_NAME[p]} disconnected`), onError: (e) => toast(errorMessage(e), 'error') })}
                className="rounded-full border-[1.5px] border-border px-3.5 py-1.5 text-[13px] font-semibold text-text-primary hover:bg-bg disabled:opacity-40"
              >
                Disconnect
              </button>
            ) : (
              available.includes(p) && (
                <a href={oauthConnectUrl(p)} className="rounded-full bg-primary/8 px-3.5 py-1.5 text-[13px] font-semibold text-primary-ink hover:bg-primary/12">
                  Connect
                </a>
              )
            )}
          </div>
        );
      })}
    </Section>
  );
}

const THEMES: { value: ThemePref; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

// Per the design: a segmented Light/Dark control (plus System, which follows the device).
function Appearance() {
  const pref = useThemePref();
  return (
    <div className="py-2">
      <p className="mb-2.5 text-[15px] font-medium text-text-primary">Theme</p>
      <div role="radiogroup" aria-label="Theme" className="flex rounded-[10px] border border-border bg-bg p-1">
        {THEMES.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={pref === value}
            onClick={() => setThemePref(value)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-[7px] py-2 text-sm transition-all',
              pref === value ? 'bg-card font-semibold text-text-primary shadow-[0_1px_4px_rgba(0,0,0,0.12)]' : 'font-medium text-text-secondary hover:text-text-primary',
            )}
          >
            <Icon size={15} aria-hidden /> {label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-text-secondary">{pref === 'system' ? 'Matches your device’s setting.' : 'Saved on this device.'}</p>
    </div>
  );
}

function Sessions() {
  const logoutAll = useLogoutAll();
  return (
    <Section title="Sessions">
      <div className="flex items-center gap-3 py-2">
        <span className="flex size-9 items-center justify-center rounded-[10px] bg-primary/8 text-primary">
          <MonitorSmartphone size={17} />
        </span>
        <p className="flex-1 text-[13px] text-text-secondary">Signed in on a device you don’t use any more? Sign out everywhere, including here.</p>
        <Button size="sm" variant="outline" loading={logoutAll.isPending} onClick={() => logoutAll.mutate()}>
          Log out all
        </Button>
      </div>
    </Section>
  );
}

function DangerZone() {
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const logout = useLogout();
  return (
    <section className="rounded-xl border-[1.5px] border-error/15 bg-error/4 px-5 py-5">
      <h2 className="mb-4 text-[11px] font-bold tracking-[0.08em] text-error uppercase">Danger zone</h2>
      <div className="flex flex-col gap-2.5">
        <button type="button" onClick={() => setConfirmLogout(true)} className="flex items-center gap-2.5 rounded-xl border-[1.5px] border-error/20 bg-error/6 px-4 py-3 text-left text-[15px] font-medium text-error hover:bg-error/10">
          <LogOut size={18} /> Log out
        </button>
        <button type="button" onClick={() => setDeleting(true)} className="flex items-center gap-2.5 rounded-xl bg-error-solid px-4 py-3 text-left text-[15px] font-semibold text-white shadow-[0_4px_12px_rgba(250,56,62,0.3)] hover:opacity-95">
          <Trash2 size={18} /> Delete account
        </button>
      </div>
      <ConfirmDialog
        open={confirmLogout}
        title="Log out?"
        body="You'll need your email and password to sign back in."
        confirmLabel="Log out"
        loading={logout.isPending}
        onCancel={() => setConfirmLogout(false)}
        onConfirm={() => logout.mutate()}
      />
      <DeleteAccountDialog open={deleting} onClose={() => setDeleting(false)} />
    </section>
  );
}

function DeleteAccountDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: me } = useMe();
  const needsPassword = me?.authProvider === 'local'; // Google/GitHub-only accounts have none
  const [typed, setTyped] = useState('');
  const [password, setPassword] = useState('');
  const del = useDeleteAccount();
  const close = () => (setTyped(''), setPassword(''), del.reset(), onClose());
  return (
    <Modal open={open} onClose={close} title="Delete your account?">
      <form
        className="flex flex-col gap-4 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          del.mutate(password); // on success the session ends and you land on the welcome screen
        }}
      >
        <div className="rounded-lg bg-error/6 px-4 py-3 text-[13px] leading-relaxed text-text-primary">
          <p className="font-semibold text-error">This can't be undone.</p>
          Your profile, posts, comments, likes and photos are deleted, and you leave every group and community.
          Messages you sent stay in other people's chats, shown as “Deleted user”.
        </div>
        <Input label='Type "DELETE" to confirm' value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="DELETE" autoComplete="off" />
        {needsPassword && (
          <Input label="Your password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={fieldError(del.error, 'password')} />
        )}
        {generalError(del.error) && <FormAlert>{generalError(del.error)}</FormAlert>}
        <Button type="submit" variant="danger" fullWidth loading={del.isPending} disabled={typed !== 'DELETE' || (needsPassword && !password)}>
          Delete my account
        </Button>
      </form>
    </Modal>
  );
}
