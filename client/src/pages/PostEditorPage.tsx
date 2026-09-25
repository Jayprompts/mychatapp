import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useBlocker, useNavigate, useParams } from 'react-router';
import {
  Bold,
  ChevronLeft,
  ChevronRight,
  Code,
  FileSearch,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormAlert } from '@/components/ui/FormAlert';
import { Skeleton } from '@/components/ui/Skeleton';
import { buttonClasses } from '@/components/ui/buttonClasses';
import { useDeletePost, usePost, usePostUpload, useRemovePostImage, useSavePost, useUpdatePost } from '@/features/blog/api';
import { Markdown } from '@/features/blog/components/Markdown';
import { PostCover } from '@/features/blog/components/PostCover';
import { applyFormat, plainText, summarySource, type Format } from '@/features/blog/markdown';
import { MAX_POST_IMAGES, POST_COVERS, POST_TAGS, type PostDetail, type PostInput, type PostTag, type PostCoverTheme } from '@/features/blog/types';
import { THEME_GRADIENTS } from '@/features/communities/themes';
import { errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatTime } from '@/lib/time';
import { toast } from '@/lib/toast';

// /blog/write (new) and /blog/write/:postId (edit). One route, so creating the draft (which puts its
// id in the URL) doesn't remount the editor mid-sentence.
export function PostEditorPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [createdId, setCreatedId] = useState<string | null>(null);
  const editingExisting = !!postId && postId !== createdId;
  const post = usePost(editingExisting ? postId : undefined);

  if (editingExisting && post.isPending) return <EditorSkeleton />;
  if (editingExisting && (!post.data || !post.data.canEdit)) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <EmptyState
          icon={FileSearch}
          title={post.data ? "You can only edit your own posts" : 'Post not found'}
          description={post.data ? 'Ask the author if something needs changing.' : 'It may have been deleted.'}
          action={
            <Link to="/blog" className={buttonClasses({ variant: 'secondary' })}>
              Back to the blog
            </Link>
          }
        />
      </div>
    );
  }
  return (
    <Editor
      key={editingExisting ? postId : 'new'}
      initial={editingExisting ? post.data! : null}
      onCreated={(id) => {
        setCreatedId(id);
        navigate(`/blog/write/${id}`, { replace: true });
      }}
    />
  );
}

type Fields = { title: string; body: string; excerpt: string; tag: PostTag; coverTheme: PostCoverTheme };
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

function Editor({ initial, onCreated }: { initial: PostDetail | null; onCreated: (id: string) => void }) {
  const navigate = useNavigate();
  const [id, setId] = useState<string | null>(initial?.id ?? null);
  const [fields, setFields] = useState<Fields>(() => ({
    title: initial?.title ?? '',
    body: initial?.body ?? '',
    excerpt: initial?.excerpt ?? '',
    tag: initial?.tag ?? 'Other',
    coverTheme: initial?.coverTheme ?? 'grove',
  }));
  const [showSummary, setShowSummary] = useState(!!initial?.excerpt && !summarySource(initial.body).startsWith(initial.excerpt.replace(/…$/, '')));
  const [dirty, setDirty] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>(initial ? 'saved' : 'idle');
  const [savedAt, setSavedAt] = useState<string | null>(initial?.updatedAt ?? null);
  const [mode, setMode] = useState<'write' | 'preview'>('write');
  const [error, setError] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const live = usePost(id ?? undefined).data; // cover, photos and status as the server has them
  const status = live?.status ?? initial?.status ?? 'draft';
  const isDraft = status === 'draft';

  const savePost = useSavePost();
  const coverUpload = usePostUpload('cover');
  const imageUpload = usePostUpload('images');
  const update = useUpdatePost(id ?? undefined);
  const removeImage = useRemovePostImage(id ?? undefined);
  const del = useDeletePost();

  // Refs for the async save queue (always the latest values, never a stale render's).
  const idRef = useRef(id);
  const fieldsRef = useRef(fields);
  const summaryTouched = useRef(false);
  const version = useRef(0);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const leaving = useRef(false);
  const dirtyRef = useRef(dirty);
  useEffect(() => {
    fieldsRef.current = fields;
    dirtyRef.current = dirty;
  }, [fields, dirty]);

  const change = (patch: Partial<Fields>) => {
    setFields((f) => ({ ...f, ...patch }));
    version.current++;
    setDirty(true);
    setError(null);
  };

  // Saves run one after another, so a fast typist can't create the draft twice.
  const save = useCallback(
    (extra: PostInput = {}) => {
      const run = async () => {
        const f = fieldsRef.current;
        const savingVersion = version.current;
        setSaveState('saving');
        try {
          const post = await savePost.mutateAsync({
            id: idRef.current,
            input: {
              title: f.title,
              body: f.body,
              tag: f.tag,
              coverTheme: f.coverTheme,
              ...(summaryTouched.current ? { excerpt: f.excerpt } : {}),
              ...extra,
            },
          });
          if (!idRef.current) {
            idRef.current = post.id;
            setId(post.id);
            onCreated(post.id);
          }
          if (version.current === savingVersion) setDirty(false);
          setSaveState('saved');
          setSavedAt(post.updatedAt);
          return post;
        } catch (err) {
          setSaveState('error');
          throw err;
        }
      };
      const next = queue.current.catch(() => undefined).then(run);
      queue.current = next;
      return next;
    },
    [savePost, onCreated],
  );

  // Drafts save themselves 1.5 s after you stop typing. Published posts only change when you press Update.
  useEffect(() => {
    if (!dirty || !isDraft) return;
    if (!idRef.current && !fields.title.trim() && !fields.body.trim()) return; // nothing worth keeping yet
    const t = setTimeout(() => void save().catch(() => undefined), 1500);
    return () => clearTimeout(t);
  }, [fields, dirty, isDraft, save]);

  // Leaving with unsaved work: drafts save first; published posts ask before discarding.
  const blocker = useBlocker(() => !leaving.current && dirtyRef.current);
  const flushing = useRef(false); // the effect re-runs while blocked — save and proceed only once
  useEffect(() => {
    if (blocker.state !== 'blocked' || !isDraft || flushing.current) return;
    flushing.current = true;
    save().then(
      () => {
        leaving.current = true;
        blocker.proceed();
      },
      () => {
        flushing.current = false;
        setConfirmDiscard(true);
      },
    );
  }, [blocker, isDraft, save]);
  const askDiscard = confirmDiscard || (blocker.state === 'blocked' && !isDraft);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const publish = async () => {
    const f = fieldsRef.current;
    const problem =
      f.title.trim().length < 3
        ? 'Give your post a title (at least 3 characters).'
        : plainText(f.body).length < 20
          ? 'Write a little more before publishing (at least 20 characters).'
          : null;
    if (problem) return setError(problem);
    try {
      const post = await save({ status: 'published' });
      toast(isDraft ? 'Post published 🎉' : 'Changes saved');
      leaving.current = true;
      navigate(`/blog/${post.id}`);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  // Photos need a post to belong to — the first upload creates the draft.
  const ensureId = async () => idRef.current ?? (await save()).id;
  const uploadCover = async (file: File) => {
    try {
      await coverUpload.mutateAsync({ postId: await ensureId(), file });
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };
  const photos = live?.images ?? [];
  const uploadImages = async (files: File[]) => {
    const room = MAX_POST_IMAGES - photos.length;
    if (files.length > room) toast(`A post can have up to ${MAX_POST_IMAGES} photos`, 'error');
    for (const file of files.slice(0, room)) {
      try {
        await imageUpload.mutateAsync({ postId: await ensureId(), file });
      } catch (err) {
        toast(errorMessage(err), 'error');
        break;
      }
    }
  };
  const move = (from: number, to: number) => {
    const order = photos.map((p) => p.id);
    [order[from], order[to]] = [order[to], order[from]];
    update.mutate({ imageOrder: order }, { onError: (e) => toast(errorMessage(e), 'error') });
  };

  // Toolbar + shortcuts work on the textarea's selection.
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const format = (f: Format) => {
    const el = bodyRef.current;
    if (!el) return;
    const r = applyFormat(el.value, el.selectionStart, el.selectionEnd, f);
    change({ body: r.value });
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(r.start, r.end);
    });
  };
  const galleryInput = useRef<HTMLInputElement>(null);
  const uploading = coverUpload.isPending || imageUpload.isPending;

  const saveLabel =
    saveState === 'saving'
      ? 'Saving…'
      : saveState === 'error'
        ? "Couldn't save"
        : dirty
          ? isDraft ? 'Unsaved changes' : 'Unsaved changes — press Update'
          : savedAt
            ? `${isDraft ? 'Draft saved' : 'Saved'} ${formatTime(savedAt)}`
            : '';

  return (
    <div className="flex flex-1 flex-col bg-bg">
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2.5 border-b border-border bg-card/95 px-3 backdrop-blur sm:px-5">
        <button
          type="button"
          onClick={() => navigate(id && !isDraft ? `/blog/${id}` : '/blog')}
          aria-label="Close editor"
          className="flex size-9 shrink-0 items-center justify-center rounded-full border-[1.5px] border-border bg-bg text-text-primary transition-colors hover:bg-surface-2"
        >
          <X size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] leading-tight font-bold text-text-primary">{initial || id ? (isDraft ? 'Edit draft' : 'Edit post') : 'New post'}</p>
          <p aria-live="polite" className={cn('truncate text-xs', saveState === 'error' ? 'text-error' : 'text-text-secondary')}>
            {saveLabel}
          </p>
        </div>
        {isDraft && (
          <span className="hidden sm:block">
            <Button
              variant="outline"
              size="sm"
              disabled={!dirty && !!id}
              loading={saveState === 'saving' && !savePost.variables?.input.status}
              onClick={() => void save().then(() => toast('Draft saved'), (e) => toast(errorMessage(e), 'error'))}
            >
              Save draft
            </Button>
          </span>
        )}
        <Button size="sm" onClick={() => void publish()} loading={saveState === 'saving' && !!savePost.variables?.input.status} disabled={uploading}>
          {isDraft ? 'Publish' : 'Update'}
        </Button>
      </header>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 p-4 pb-16 sm:p-6">
        {/* Cover */}
        <section aria-label="Cover" className="flex flex-col gap-3">
          <PostCover coverUrl={live?.coverUrl ?? null} theme={fields.coverTheme} className="h-40 rounded-2xl sm:h-56">
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/15">
              <label className="flex cursor-pointer items-center gap-1.5 rounded-full bg-white/90 px-4 py-2 text-[13px] font-semibold text-text-primary shadow transition-colors hover:bg-white">
                <ImagePlus size={15} /> {coverUpload.isPending ? 'Uploading…' : live?.coverUrl ? 'Replace photo' : 'Upload cover photo'}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={coverUpload.isPending}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (file) void uploadCover(file);
                  }}
                />
              </label>
              {live?.coverUrl && (
                <button
                  type="button"
                  onClick={() => update.mutate({ removeCover: true }, { onError: (e) => toast(errorMessage(e), 'error') })}
                  className="rounded-full bg-white/90 px-4 py-2 text-[13px] font-semibold text-error shadow transition-colors hover:bg-white"
                >
                  Remove
                </button>
              )}
            </div>
          </PostCover>
          <div className="flex items-center gap-2" role="radiogroup" aria-label="Cover colour">
            <span className="mr-1 text-[13px] font-semibold text-text-secondary">{live?.coverUrl ? 'Fallback colour' : 'Cover colour'}</span>
            {POST_COVERS.map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={fields.coverTheme === t}
                aria-label={`${t} cover`}
                onClick={() => change({ coverTheme: t })}
                className={cn('size-7 rounded-full ring-offset-2 ring-offset-bg transition-shadow', fields.coverTheme === t && 'ring-2 ring-primary')}
                style={{ background: THEME_GRADIENTS[t] }}
              />
            ))}
          </div>
        </section>

        {/* Topic */}
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Topic">
          {POST_TAGS.map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={fields.tag === t}
              onClick={() => change({ tag: t })}
              className={cn(
                'rounded-full border-[1.5px] px-3 py-1 text-xs font-semibold transition-colors',
                fields.tag === t ? 'gradient-brand border-transparent text-white' : 'border-border bg-card text-text-secondary hover:text-text-primary',
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Title + optional summary */}
        <div>
          <textarea
            value={fields.title}
            onChange={(e) => change({ title: e.target.value.replace(/\n/g, ' ') })}
            placeholder="Post title…"
            aria-label="Title"
            maxLength={140}
            rows={1}
            className="w-full resize-none bg-transparent text-[26px] leading-tight font-extrabold tracking-tight text-text-primary outline-none [field-sizing:content] placeholder:text-text-tertiary sm:text-[32px]"
          />
          {showSummary ? (
            <label className="mt-2 block">
              <span className="mb-1 flex justify-between text-xs font-semibold text-text-secondary">
                Summary <span className="font-normal text-text-tertiary">{fields.excerpt.length}/240</span>
              </span>
              <textarea
                value={fields.excerpt}
                onChange={(e) => {
                  summaryTouched.current = true;
                  change({ excerpt: e.target.value });
                }}
                maxLength={240}
                rows={2}
                placeholder="Shown on cards and under the title. Leave empty to use your opening lines."
                className="w-full resize-none rounded-md border-[1.5px] border-border bg-card px-3.5 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-tertiary focus:border-primary"
              />
            </label>
          ) : (
            <button type="button" onClick={() => setShowSummary(true)} className="mt-1 text-[13px] font-semibold text-primary hover:underline">
              + Add a summary
            </button>
          )}
        </div>

        {/* Body */}
        <div className="overflow-hidden rounded-2xl border-[1.5px] border-border bg-card focus-within:border-primary/50">
          <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-bg px-2 py-1.5" role="toolbar" aria-label="Formatting">
            <Tool label="Bold (⌘B)" onClick={() => format('bold')} disabled={mode === 'preview'}><Bold size={16} /></Tool>
            <Tool label="Italic (⌘I)" onClick={() => format('italic')} disabled={mode === 'preview'}><Italic size={16} /></Tool>
            <Tool label="Code" onClick={() => format('code')} disabled={mode === 'preview'}><Code size={16} /></Tool>
            <Tool label="Link (⌘K)" onClick={() => format('link')} disabled={mode === 'preview'}><Link2 size={16} /></Tool>
            <Divider />
            <Tool label="Heading" onClick={() => format('h2')} disabled={mode === 'preview'}><Heading2 size={17} /></Tool>
            <Tool label="Subheading" onClick={() => format('h3')} disabled={mode === 'preview'}><Heading3 size={17} /></Tool>
            <Divider />
            <Tool label="Bulleted list" onClick={() => format('ul')} disabled={mode === 'preview'}><List size={17} /></Tool>
            <Tool label="Numbered list" onClick={() => format('ol')} disabled={mode === 'preview'}><ListOrdered size={17} /></Tool>
            <Tool label="Quote" onClick={() => format('quote')} disabled={mode === 'preview'}><Quote size={16} /></Tool>
            <Divider />
            <Tool label="Add photos" onClick={() => galleryInput.current?.click()} disabled={photos.length >= MAX_POST_IMAGES || uploading}>
              <ImagePlus size={17} />
            </Tool>
            <div className="ml-auto flex rounded-full bg-surface-2 p-0.5 text-xs font-semibold">
              {(['write', 'preview'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={mode === m}
                  onClick={() => setMode(m)}
                  className={cn('rounded-full px-3 py-1 capitalize transition-colors', mode === m ? 'bg-card text-text-primary shadow-sm' : 'text-text-secondary')}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          {mode === 'write' ? (
            <textarea
              ref={bodyRef}
              value={fields.body}
              onChange={(e) => change({ body: e.target.value })}
              onKeyDown={(e) => {
                if (!(e.metaKey || e.ctrlKey)) return;
                const shortcut = ({ b: 'bold', i: 'italic', k: 'link' } as const)[e.key.toLowerCase() as 'b' | 'i' | 'k'];
                if (shortcut) {
                  e.preventDefault();
                  format(shortcut);
                }
              }}
              aria-label="Post body"
              placeholder={'Write your story…\n\nUse the toolbar for headings, lists, links and more.'}
              className="block min-h-[340px] w-full resize-y bg-transparent px-4 py-4 text-[15px] leading-[1.75] text-text-primary outline-none [field-sizing:content] placeholder:text-text-tertiary sm:px-5"
            />
          ) : (
            <div className="min-h-[340px] px-4 py-4 sm:px-5">
              {fields.body.trim() ? <Markdown source={fields.body} /> : <p className="text-sm text-text-tertiary">Nothing to preview yet.</p>}
            </div>
          )}
        </div>

        {/* Photos */}
        <section aria-label="Photos">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold text-text-primary">Photos</h2>
            <span className="text-xs text-text-secondary">
              {photos.length}/{MAX_POST_IMAGES} · shown as a gallery under your post
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
            {photos.map((img, i) => (
              <div key={img.id} className="group relative aspect-square overflow-hidden rounded-xl bg-surface-2">
                <img src={img.url} alt={`Photo ${i + 1}`} className="size-full object-cover" />
                <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between">
                  <PhotoButton label="Move left" disabled={i === 0} onClick={() => move(i, i - 1)}><ChevronLeft size={15} /></PhotoButton>
                  <PhotoButton label="Move right" disabled={i === photos.length - 1} onClick={() => move(i, i + 1)}><ChevronRight size={15} /></PhotoButton>
                </div>
                <PhotoButton
                  label={`Remove photo ${i + 1}`}
                  className="absolute top-1.5 right-1.5"
                  onClick={() => removeImage.mutate(img.id, { onError: (e) => toast(errorMessage(e), 'error') })}
                >
                  <X size={14} />
                </PhotoButton>
              </div>
            ))}
            {photos.length < MAX_POST_IMAGES && (
              <button
                type="button"
                onClick={() => galleryInput.current?.click()}
                disabled={uploading}
                className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border text-xs font-semibold text-text-secondary transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-60"
              >
                <ImagePlus size={20} />
                {imageUpload.isPending ? 'Uploading…' : 'Add photos'}
              </button>
            )}
          </div>
          <input
            ref={galleryInput}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            aria-label="Add photos"
            onChange={(e) => {
              const files = [...(e.target.files ?? [])];
              e.target.value = '';
              if (files.length) void uploadImages(files);
            }}
          />
        </section>

        {error && <FormAlert>{error}</FormAlert>}

        {/* Publish strip (per the design) */}
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card px-4 py-4 sm:px-5">
          <div className="min-w-48 flex-1">
            <p className="text-[13px] font-semibold text-text-primary">{isDraft ? 'Ready to share?' : 'Done editing?'}</p>
            <p className="mt-0.5 text-xs text-text-secondary">
              {isDraft ? 'Your post will be visible to everyone on Grove.' : 'Your changes go live as soon as you update.'}
            </p>
          </div>
          {id && isDraft && (
            <button type="button" onClick={() => setConfirmDelete(true)} className="flex items-center gap-1.5 text-[13px] font-semibold text-error hover:underline">
              <Trash2 size={14} /> Delete draft
            </button>
          )}
          <Button onClick={() => void publish()} disabled={uploading}>
            {isDraft ? 'Publish post' : 'Update post'}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={askDiscard}
        title={isDraft ? "Couldn't save your draft" : 'Discard your changes?'}
        body={isDraft ? 'Leave anyway and lose the latest changes?' : "Your edits haven't been saved. The published post stays as it was."}
        confirmLabel={isDraft ? 'Leave anyway' : 'Discard changes'}
        onCancel={() => {
          setConfirmDiscard(false);
          if (blocker.state === 'blocked') blocker.reset();
        }}
        onConfirm={() => {
          setConfirmDiscard(false);
          leaving.current = true;
          if (blocker.state === 'blocked') blocker.proceed();
        }}
      />
      <ConfirmDialog
        open={confirmDelete}
        title="Delete this draft?"
        body="The draft and its photos are deleted for good."
        confirmLabel="Delete draft"
        loading={del.isPending}
        error={del.isError ? errorMessage(del.error) : null}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          leaving.current = true;
          if (id) del.mutate(id);
        }}
      />
    </div>
  );
}

function Tool({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onMouseDown={(e) => e.preventDefault()} // keep the textarea's selection
      onClick={onClick}
      disabled={disabled}
      className="flex size-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-card hover:text-text-primary disabled:opacity-40"
    >
      {children}
    </button>
  );
}

const Divider = () => <span className="mx-1 h-5 w-px bg-border" aria-hidden />;

function PhotoButton({ label, onClick, disabled, className, children }: { label: string; onClick: () => void; disabled?: boolean; className?: string; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn('flex size-7 items-center justify-center rounded-full bg-black/55 text-white transition-opacity hover:bg-black/70 disabled:opacity-0', className)}
    >
      {children}
    </button>
  );
}

function EditorSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 p-4 sm:p-6">
      <Skeleton className="h-40 rounded-2xl sm:h-56" />
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-10 w-4/5" />
      <Skeleton className="h-80 rounded-2xl" />
    </div>
  );
}
