import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Check, Globe, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FormAlert } from '@/components/ui/FormAlert';
import { Modal } from '@/components/ui/Modal';
import { errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { useCreateCommunity } from '../api';
import { THEME_GRADIENTS } from '../themes';
import { COMMUNITY_CATEGORIES, COMMUNITY_ICONS, COMMUNITY_THEMES, type CommunityCategory, type CommunityDetail, type CommunityTheme } from '../types';
import { CommunityAvatar } from './CommunityAvatar';

const inputClass =
  'w-full rounded-md border-[1.5px] border-border bg-card px-4 py-2.5 text-[15px] text-text-primary outline-none placeholder:text-text-tertiary focus:border-primary focus:shadow-[0_0_0_3px_rgba(8,102,255,0.15)]';

// Two steps, per the design: Details (look, name, description) → Settings (category, public/private) → success.
export function CreateCommunityDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🌱');
  const [theme, setTheme] = useState<CommunityTheme>('grove');
  const [category, setCategory] = useState<CommunityCategory | ''>('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [created, setCreated] = useState<CommunityDetail | null>(null);
  const create = useCreateCommunity();
  const navigate = useNavigate();

  const reset = () => {
    setStep(1);
    setName('');
    setDescription('');
    setIcon('🌱');
    setTheme('grove');
    setCategory('');
    setVisibility('public');
    setCreated(null);
    create.reset();
  };
  const close = () => {
    reset();
    onClose();
  };
  const openCommunity = () => {
    const id = created?.id;
    close();
    if (id) navigate(`/communities/${id}`);
  };

  const nameOk = name.trim().length >= 3;

  return (
    <Modal open={open} onClose={close} title={created ? 'Community created' : 'Create a community'}>
      {created ? (
        <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
          <CommunityAvatar icon={created.icon} theme={created.theme} size={72} />
          <h3 className="text-xl font-bold text-text-primary">{created.name} is live! 🎉</h3>
          <p className="max-w-xs text-sm leading-relaxed text-text-secondary">
            Your community is ready. Open it to say hello and invite people from the info panel.
          </p>
          <Button onClick={openCommunity}>Open community</Button>
        </div>
      ) : (
        <div className="flex flex-col">
          {/* Step indicator */}
          <div className="flex items-center gap-3 border-b border-border px-5 py-3">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <span
                  className={cn(
                    'flex size-6 items-center justify-center rounded-full text-xs font-bold text-white',
                    step >= s ? 'gradient-message' : 'bg-border',
                  )}
                >
                  {step > s ? <Check size={12} strokeWidth={3} /> : s}
                </span>
                <span className={cn('text-xs', step === s ? 'font-bold text-text-primary' : 'text-text-secondary')}>
                  {s === 1 ? 'Details' : 'Settings'}
                </span>
                {s === 1 && <span className={cn('h-0.5 w-8 rounded-full', step > 1 ? 'gradient-message' : 'bg-border')} />}
              </div>
            ))}
          </div>

          {step === 1 ? (
            <div className="flex flex-col gap-4 p-5">
              {/* Live preview of the look */}
              <div className="overflow-hidden rounded-lg border border-border">
                <div className="h-16" style={{ background: THEME_GRADIENTS[theme] }} />
                <div className="flex items-center gap-3 px-4 py-3">
                  <CommunityAvatar icon={icon} theme={theme} size={44} className="relative -mt-9 ring-4 ring-card" />
                  <span className="truncate text-[15px] font-bold text-text-primary">{name.trim() || 'Community name'}</span>
                </div>
              </div>

              <fieldset>
                <legend className="mb-2 text-[13px] font-semibold text-text-primary">Cover colour</legend>
                <div className="flex gap-2">
                  {COMMUNITY_THEMES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTheme(t)}
                      aria-label={`${t} theme`}
                      aria-pressed={theme === t}
                      className={cn('size-9 rounded-full ring-offset-2 transition-shadow', theme === t && 'ring-2 ring-primary')}
                      style={{ background: THEME_GRADIENTS[t] }}
                    />
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-text-secondary">You can add a cover photo after creating it.</p>
              </fieldset>

              <fieldset>
                <legend className="mb-2 text-[13px] font-semibold text-text-primary">Icon</legend>
                <div className="grid grid-cols-8 gap-1.5">
                  {COMMUNITY_ICONS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setIcon(e)}
                      aria-label={`Icon ${e}`}
                      aria-pressed={icon === e}
                      className={cn('flex aspect-square items-center justify-center rounded-md text-xl transition-colors', icon === e ? 'bg-primary/12 ring-2 ring-primary/40' : 'hover:bg-bg')}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </fieldset>

              <label>
                <span className="mb-1.5 block text-[13px] font-semibold text-text-primary">
                  Community name <span className="text-error">*</span>
                </span>
                <input autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={50} placeholder="e.g. Indie Game Dev" className={inputClass} />
                <span className="mt-1 flex justify-between text-xs">
                  <span className="text-error">{name.length > 0 && !nameOk ? 'At least 3 characters' : ''}</span>
                  <span className="text-text-tertiary">{name.length}/50</span>
                </span>
              </label>

              <label>
                <span className="mb-1.5 block text-[13px] font-semibold text-text-primary">Description</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={300}
                  rows={3}
                  placeholder="What's this community about? Tell people what to expect."
                  className={cn(inputClass, 'resize-none')}
                />
                <span className="mt-1 block text-right text-xs text-text-tertiary">{description.length}/300</span>
              </label>

              <Button fullWidth disabled={!nameOk} onClick={() => setStep(2)}>
                Next
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4 p-5">
              <fieldset>
                <legend className="mb-2 text-[13px] font-semibold text-text-primary">Category</legend>
                <div className="flex flex-wrap gap-1.5">
                  {COMMUNITY_CATEGORIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      aria-pressed={category === c}
                      className={cn(
                        'rounded-full border-[1.5px] px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
                        category === c ? 'gradient-message border-transparent text-white' : 'border-border text-text-secondary hover:text-text-primary',
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="overflow-hidden rounded-lg border border-border">
                <legend className="sr-only">Who can join</legend>
                {[
                  { value: 'public' as const, icon: <Globe size={20} />, label: 'Public', desc: 'Anyone can find and join this community.' },
                  {
                    value: 'private' as const,
                    icon: <Lock size={20} />,
                    label: 'Private',
                    desc: 'People can find it, but must request to join. Admins approve each request.',
                  },
                ].map((opt, i) => (
                  <label
                    key={opt.value}
                    className={cn(
                      'flex cursor-pointer gap-3 px-4 py-3.5 transition-colors',
                      i > 0 && 'border-t border-border',
                      visibility === opt.value ? 'bg-primary/5' : 'hover:bg-bg',
                    )}
                  >
                    <input type="radio" name="visibility" className="sr-only" checked={visibility === opt.value} onChange={() => setVisibility(opt.value)} />
                    <span className="mt-0.5 text-primary">{opt.icon}</span>
                    <span className="flex-1">
                      <span className="block text-sm font-bold text-text-primary">{opt.label}</span>
                      <span className="block text-xs leading-relaxed text-text-secondary">{opt.desc}</span>
                    </span>
                    <span
                      className={cn(
                        'mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border-2',
                        visibility === opt.value ? 'border-primary bg-primary' : 'border-border',
                      )}
                      aria-hidden
                    >
                      {visibility === opt.value && <span className="size-2 rounded-full bg-white" />}
                    </span>
                  </label>
                ))}
              </fieldset>

              {create.isError && <FormAlert>{errorMessage(create.error)}</FormAlert>}

              <div className="flex gap-2.5">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  fullWidth
                  disabled={!category}
                  loading={create.isPending}
                  onClick={() =>
                    category &&
                    create.mutate(
                      { name: name.trim(), description: description.trim(), category, visibility, icon, theme },
                      { onSuccess: setCreated },
                    )
                  }
                >
                  {category ? 'Create community' : 'Pick a category'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
