import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Camera, Trash2 } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { FormAlert } from '@/components/ui/FormAlert';
import { Input } from '@/components/ui/Input';
import { useMe } from '@/features/auth/api';
import type { User } from '@/features/auth/types';
import { useRemoveAvatar, useUpdateProfile, type ProfileInput } from '@/features/profile/api';
import { AvatarCropDialog } from '@/features/profile/components/AvatarCropDialog';
import { ApiError, errorMessage } from '@/lib/api';
import { toast } from '@/lib/toast';

// /profile/edit — per the design: photo, display name, username, bio, website, location.
export function EditProfilePage() {
  const { data: me } = useMe();
  if (!me) return null;
  return <EditForm me={me} />;
}

function EditForm({ me }: { me: User }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ displayName: me.displayName, username: me.username, bio: me.bio, website: me.website, location: me.location });
  const [photoOpen, setPhotoOpen] = useState(false);
  const update = useUpdateProfile();
  const removePhoto = useRemoveAvatar();
  const fieldError = (f: string) => (update.error instanceof ApiError ? update.error.details?.[f]?.[0] : undefined);
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const changes = Object.fromEntries(Object.entries(form).filter(([k, v]) => v.trim() !== (me[k as keyof typeof form] ?? ''))) as ProfileInput;
  const dirty = Object.keys(changes).length > 0;

  const save = () =>
    update.mutate(changes, {
      onSuccess: () => {
        toast('Profile saved');
        navigate('/profile');
      },
    });

  return (
    <div className="mx-auto w-full max-w-xl pb-10 sm:p-6">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/95 px-3 backdrop-blur sm:static sm:mb-4 sm:border-0 sm:bg-transparent sm:px-0">
        <button type="button" onClick={() => navigate('/profile')} aria-label="Back to profile" className="flex size-9 items-center justify-center rounded-full border-[1.5px] border-border bg-bg text-text-primary hover:bg-surface-2">
          <ArrowLeft size={18} />
        </button>
        <h1 className="flex-1 text-lg font-bold text-text-primary">Edit profile</h1>
        <Button size="sm" onClick={save} loading={update.isPending} disabled={!dirty}>
          Save
        </Button>
      </header>

      <div className="flex flex-col gap-5 bg-card p-5 sm:rounded-xl sm:p-6 sm:shadow-card">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => setPhotoOpen(true)} aria-label="Change profile photo" className="group relative rounded-full">
            <Avatar name={form.displayName || me.displayName} src={me.avatarUrl} size={80} className="rounded-full" />
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/35 text-white opacity-0 transition-opacity group-hover:opacity-100">
              <Camera size={22} />
            </span>
          </button>
          <div className="flex flex-col items-start gap-1.5">
            <button type="button" onClick={() => setPhotoOpen(true)} className="text-sm font-semibold text-primary hover:underline">
              {me.avatarUrl ? 'Change photo' : 'Add a photo'}
            </button>
            {me.avatarUrl && (
              <button
                type="button"
                disabled={removePhoto.isPending}
                onClick={() => removePhoto.mutate(undefined, { onSuccess: () => toast('Photo removed') })}
                className="flex items-center gap-1 text-[13px] font-medium text-error hover:underline"
              >
                <Trash2 size={13} /> Remove
              </button>
            )}
          </div>
        </div>

        <Input label="Display name" value={form.displayName} maxLength={50} onChange={(e) => set({ displayName: e.target.value })} error={fieldError('displayName')} placeholder="How should people know you?" />
        <Input
          label="Username"
          value={form.username}
          maxLength={30}
          onChange={(e) => set({ username: e.target.value.toLowerCase().replace(/\s/g, '') })}
          error={fieldError('username')}
          hint={`Your profile: ${window.location.host}/u/${form.username || 'username'}`}
        />
        <label className="flex flex-col gap-1.5">
          <span className="flex justify-between text-[13px] font-medium text-text-secondary">
            Bio <span className="font-normal text-text-tertiary">{form.bio.length}/160</span>
          </span>
          <textarea
            value={form.bio}
            maxLength={160}
            rows={3}
            onChange={(e) => set({ bio: e.target.value })}
            placeholder="Tell people about yourself…"
            className="resize-none rounded-md border-[1.5px] border-border bg-card px-4 py-3 text-[15px] text-text-primary outline-none placeholder:text-text-tertiary focus:border-primary focus:shadow-[0_0_0_3px_rgba(8,102,255,0.15)]"
          />
        </label>
        <Input label="Website" value={form.website} maxLength={100} onChange={(e) => set({ website: e.target.value })} error={fieldError('website')} placeholder="yourwebsite.com" />
        <Input label="Location" value={form.location} maxLength={60} onChange={(e) => set({ location: e.target.value })} error={fieldError('location')} placeholder="Where are you based?" />

        {update.isError && !(update.error instanceof ApiError && update.error.details) && <FormAlert>{errorMessage(update.error)}</FormAlert>}

        <div className="flex justify-end gap-2.5 border-t border-border pt-4">
          <Button variant="outline" onClick={() => navigate('/profile')}>
            Cancel
          </Button>
          <Button onClick={save} loading={update.isPending} disabled={!dirty}>
            Save changes
          </Button>
        </div>
      </div>

      <AvatarCropDialog open={photoOpen} onClose={() => setPhotoOpen(false)} />
    </div>
  );
}
