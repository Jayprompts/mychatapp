import { useState, useRef } from 'react'

// ─── Tokens — match BlogFeed exactly ─────────────────────────────
const GRAD    = 'linear-gradient(135deg, #00B2FF 0%, #B620E0 100%)'
const PRIMARY = '#0866FF'
const BG      = '#F7F8FA'
const CARD    = '#FFFFFF'
const TEXT    = '#050505'
const MUTED   = '#65676B'
const BORDER  = '#E4E6EB'
const SUCCESS = '#31A24C'
const ERROR   = '#FA383E'
const TAG_COLORS: Record<string, { bg: string; color: string }> = {
  Engineering: { bg: 'rgba(8,102,255,0.08)',   color: PRIMARY   },
  Design:      { bg: 'rgba(182,32,224,0.08)',  color: '#B620E0' },
  Product:     { bg: 'rgba(49,162,76,0.08)',   color: '#31A24C' },
  Community:   { bg: 'rgba(247,185,40,0.1)',   color: '#B68A00' },
}

type Breakpoint = 'mobile' | 'tablet' | 'desktop'
type Demo = 'threaded-comments' | 'share-modal' | 'bookmarks' | 'report' | 'edit-delete' | 'image-gallery' | 'image-upload'

// ─── Avatar ───────────────────────────────────────────────────────
const AP = ['#0866FF','#B620E0','#00B2FF','#31A24C','#F7B928','#FA383E','#8B5CF6']
const ac = (n: string) => AP[n.charCodeAt(0) % AP.length]
function Av({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: ac(name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
      {name.split(' ').map(w => w[0]).join('').slice(0, 2)}
    </div>
  )
}

// ─── Tag chip ─────────────────────────────────────────────────────
function Tag({ label }: { label: string }) {
  const s = TAG_COLORS[label] ?? { bg: 'rgba(100,102,107,0.08)', color: MUTED }
  return <span style={{ ...s, fontSize: 11, fontWeight: 600, borderRadius: 9999, padding: '3px 9px' }}>{label}</span>
}

// ─── Post cover gradients ─────────────────────────────────────────
const COVERS = [
  'linear-gradient(135deg, #0866FF 0%, #7B2FBE 100%)',
  'linear-gradient(135deg, #00B2FF 0%, #0866FF 100%)',
  'linear-gradient(135deg, #B620E0 0%, #FA383E 100%)',
  'linear-gradient(135deg, #31A24C 0%, #00B2FF 100%)',
]

// ─── Shared action button ─────────────────────────────────────────
function ActionBtn({ icon, label, active, color, onClick }: { icon: React.ReactNode; label?: string | number; active?: boolean; color?: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: active ? (color ?? ERROR) : MUTED, padding: '5px 8px', borderRadius: 9999, fontFamily: 'inherit', transition: 'color 0.15s, background 0.1s' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = BG}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
      {icon}{label !== undefined && <span>{label}</span>}
    </button>
  )
}

// ─── Toast ────────────────────────────────────────────────────────
function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div style={{ position: 'fixed', top: visible ? 18 : -60, left: '50%', transform: 'translateX(-50%)', zIndex: 300, background: '#1C1E21', color: '#fff', borderRadius: 9999, padding: '9px 20px', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', transition: 'top 0.3s cubic-bezier(0.34,1.56,0.64,1)', display: 'flex', alignItems: 'center', gap: 8 }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke={SUCCESS} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      {message}
    </div>
  )
}

// ─── Shared confirm modal ─────────────────────────────────────────
function ConfirmModal({ title, body, confirmLabel, onCancel, onConfirm }: { title: string; body: string; confirmLabel: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onCancel} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)' }} />
      <div style={{ position: 'relative', background: CARD, borderRadius: 20, padding: '24px 24px 20px', maxWidth: 340, width: 'calc(100% - 48px)', boxShadow: '0 20px 60px rgba(0,0,0,0.22)', zIndex: 1 }}>
        <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(250,56,62,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><polyline points="3,6 5,6 21,6" stroke={ERROR} strokeWidth="1.8" strokeLinecap="round"/><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke={ERROR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: TEXT, margin: '0 0 8px', textAlign: 'center' }}>{title}</h3>
        <p style={{ fontSize: 14, color: MUTED, margin: '0 0 22px', textAlign: 'center', lineHeight: 1.55 }}>{body}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '11px', borderRadius: 12, border: `1.5px solid ${BORDER}`, background: CARD, fontSize: 14, fontWeight: 600, color: TEXT, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '11px', borderRadius: 12, border: 'none', background: ERROR, fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(250,56,62,0.35)' }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

// ─── Shared page scaffold ─────────────────────────────────────────
function PageShell({ bp, tab, children }: { bp: Breakpoint; tab: string; children: React.ReactNode }) {
  const isMobile = bp === 'mobile'
  const compact  = bp !== 'desktop'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: BG }}>
      {/* Top nav */}
      <div style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: compact ? '11px 14px' : '12px 24px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <span style={{ fontSize: compact ? 17 : 18, fontWeight: 700, color: TEXT, background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>MyChatApp</span>
        {!isMobile && (
          <div style={{ display: 'flex', gap: 4, marginLeft: 16 }}>
            {['Feed', 'Trending', 'Following', 'Saved'].map(t => (
              <button key={t} style={{ background: t === tab ? 'rgba(8,102,255,0.08)' : 'transparent', color: t === tab ? PRIMARY : MUTED, border: 'none', borderRadius: 9999, padding: '5px 14px', fontSize: 13, fontWeight: t === tab ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit' }}>{t}</button>
            ))}
          </div>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <button style={{ background: GRAD, border: 'none', borderRadius: 9999, padding: compact ? '6px 12px' : '6px 16px', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>Write</button>
          <Av name="Taylor Reeves" size={30} />
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>{children}</div>
      {isMobile && (
        <div style={{ height: 54, background: CARD, borderTop: `1px solid ${BORDER}`, display: 'flex', flexShrink: 0 }}>
          {['🏠','🔍','✏️','🔔','👤'].map((icon, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: i === 0 ? PRIMARY : MUTED, fontSize: 18 }}>{icon}</div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Bookmark icon ────────────────────────────────────────────────
function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? PRIMARY : 'none'}>
      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" stroke={filled ? PRIMARY : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ─── Like icon ────────────────────────────────────────────────────
function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? ERROR : 'none'}>
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke={filled ? ERROR : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ─── Comment icon ─────────────────────────────────────────────────
function CommentIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ─── Share icon ───────────────────────────────────────────────────
function ShareIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ─── Dot menu ─────────────────────────────────────────────────────
function DotMenu({ items, align = 'right' }: { items: { label: string; icon: React.ReactNode; danger?: boolean; onClick: () => void }[]; align?: 'left' | 'right' }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 9999, display: 'flex', alignItems: 'center', color: MUTED }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="5" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="19" r="1.3" fill="currentColor"/></svg>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <div style={{ position: 'absolute', [align]: 0, top: '100%', zIndex: 50, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.14)', overflow: 'hidden', minWidth: 180, marginTop: 4 }}>
            {items.map((item, i) => (
              <button key={i} onClick={() => { item.onClick(); setOpen(false) }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 500, color: item.danger ? ERROR : TEXT, textAlign: 'left', borderBottom: i < items.length - 1 ? `1px solid ${BORDER}` : 'none', transition: 'background 0.1s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = BG}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                <span style={{ color: item.danger ? ERROR : MUTED }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 1. THREADED COMMENT REPLIES
// ═══════════════════════════════════════════════════════════════════
interface CommentNode {
  id: string
  author: string
  body: string
  likes: number
  time: string
  mine?: boolean
  replies?: CommentNode[]
}

const COMMENT_TREE: CommentNode[] = [
  {
    id: 'c1', author: 'Jordan Kim', body: 'Really well written. The halation point is something I\'d never considered before — going to revisit our dark mode palette tomorrow.', likes: 14, time: '2h', replies: [
      { id: 'c1a', author: 'Taylor Reeves', body: 'Same! We found #E4E4E4 on #161616 to be the sweet spot for body copy after a lot of testing.', likes: 6, time: '1h', mine: true },
      { id: 'c1b', author: 'Maria Garcia',  body: 'Can confirm — we also ran user studies and pure white text caused complaints specifically from astigmatic users.', likes: 9, time: '55m' },
    ],
  },
  {
    id: 'c2', author: 'Alex Chen', body: 'Great post! One thing I\'d add: test your dark mode with Night Shift enabled on macOS — it shifts color temps and can break carefully chosen palette values.', likes: 22, time: '3h', replies: [
      { id: 'c2a', author: 'Taylor Reeves', body: 'Oh that\'s a brilliant catch, Alex. Adding that to our QA checklist right now.', likes: 4, time: '2h', mine: true },
    ],
  },
]

function ReplyComposer({ parentAuthor, onSubmit, onCancel, compact }: { parentAuthor: string; onSubmit: (text: string) => void; onCancel: () => void; compact: boolean }) {
  const [text, setText] = useState('')
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 8, padding: '10px 12px', background: 'rgba(8,102,255,0.03)', borderRadius: 12, border: `1.5px solid rgba(8,102,255,0.15)` }}>
      <Av name="Taylor Reeves" size={28} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: PRIMARY, fontWeight: 600, marginBottom: 4 }}>Replying to @{parentAuthor.split(' ')[0]}</div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          autoFocus
          placeholder={`Reply to ${parentAuthor.split(' ')[0]}…`}
          rows={2}
          style={{ width: '100%', border: `1.5px solid ${BORDER}`, borderRadius: 10, padding: '8px 12px', fontSize: compact ? 13 : 14, color: TEXT, fontFamily: 'inherit', resize: 'none', outline: 'none', background: CARD, boxSizing: 'border-box', lineHeight: 1.5 }}
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 6, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: MUTED, fontFamily: 'inherit', fontWeight: 600 }}>Cancel</button>
          <button onClick={() => { if (text.trim()) { onSubmit(text); setText('') } }}
            style={{ background: text.trim() ? GRAD : BORDER, border: 'none', borderRadius: 9999, padding: '5px 14px', fontSize: 13, fontWeight: 700, color: text.trim() ? '#fff' : MUTED, cursor: text.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit', transition: 'all 0.15s' }}>
            Reply
          </button>
        </div>
      </div>
    </div>
  )
}

function CommentThread({ node, depth = 0, compact }: { node: CommentNode; depth?: number; compact: boolean }) {
  const [liked, setLiked]       = useState(false)
  const [replying, setReplying] = useState(false)
  const [replies, setReplies]   = useState<CommentNode[]>(node.replies ?? [])

  const isOwn = node.mine

  return (
    <div style={{ marginLeft: depth > 0 ? (compact ? 24 : 32) : 0, marginTop: depth === 0 ? 0 : 10 }}>
      {/* Thread line for nested */}
      <div style={{ display: 'flex', gap: compact ? 8 : 10 }}>
        {depth > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
            <div style={{ width: 2, flex: 1, background: BORDER, borderRadius: 1 }} />
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: compact ? 8 : 10, alignItems: 'flex-start' }}>
            <Av name={node.author} size={depth > 0 ? 28 : 32} />
            <div style={{ flex: 1, background: isOwn ? 'rgba(8,102,255,0.04)' : BG, border: isOwn ? `1px solid rgba(8,102,255,0.12)` : `1px solid ${BORDER}`, borderRadius: 14, padding: compact ? '9px 12px' : '10px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{node.author}</span>
                  {isOwn && <span style={{ fontSize: 11, color: PRIMARY, fontWeight: 600, background: 'rgba(8,102,255,0.08)', borderRadius: 9999, padding: '1px 7px' }}>You</span>}
                  <span style={{ fontSize: 11, color: MUTED }}>{node.time} ago</span>
                </div>
                <DotMenu align="right" items={isOwn
                  ? [
                      { label: 'Edit', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>, onClick: () => {} },
                      { label: 'Delete', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><polyline points="3,6 5,6 21,6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>, danger: true, onClick: () => {} },
                    ]
                  : [
                      { label: 'Report comment', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="1.8"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2"/></svg>, danger: true, onClick: () => {} },
                    ]
                } />
              </div>
              <p style={{ margin: 0, fontSize: compact ? 13 : 14, color: TEXT, lineHeight: 1.6 }}>{node.body}</p>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 0, marginLeft: compact ? 36 : 42, marginTop: 3 }}>
            <ActionBtn icon={<HeartIcon filled={liked} />} label={node.likes + (liked ? 1 : 0)} active={liked} color={ERROR} onClick={() => setLiked(l => !l)} />
            <ActionBtn icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>} label="Reply" onClick={() => setReplying(r => !r)} />
          </div>

          {/* Inline reply composer */}
          {replying && (
            <div style={{ marginLeft: compact ? 36 : 42 }}>
              <ReplyComposer
                parentAuthor={node.author}
                compact={compact}
                onCancel={() => setReplying(false)}
                onSubmit={text => {
                  setReplies(r => [...r, { id: `new-${Date.now()}`, author: 'Taylor Reeves', body: text, likes: 0, time: 'just now', mine: true }])
                  setReplying(false)
                }}
              />
            </div>
          )}

          {/* Nested replies */}
          {replies.map(r => (
            <CommentThread key={r.id} node={r} depth={depth + 1} compact={compact} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ThreadedCommentsDemo({ bp }: { bp: Breakpoint }) {
  const compact = bp !== 'desktop'
  return (
    <PageShell bp={bp} tab="Feed">
      <div style={{ flex: 1, overflowY: 'auto', padding: compact ? '12px' : '20px 24px' }}>
        {/* Abbreviated post header */}
        <div style={{ background: CARD, borderRadius: 20, border: `1px solid ${BORDER}`, overflow: 'hidden', marginBottom: 14 }}>
          <div style={{ height: compact ? 90 : 110, background: COVERS[0] }} />
          <div style={{ padding: compact ? '12px 14px' : '14px 18px' }}>
            <h2 style={{ fontSize: compact ? 16 : 18, fontWeight: 700, color: TEXT, margin: '0 0 6px' }}>Dark Mode Accessibility — Beyond Simple Contrast</h2>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Av name="Taylor Reeves" size={24} />
              <span style={{ fontSize: 13, color: MUTED }}>Taylor Reeves · 2h ago · 5 min read</span>
            </div>
          </div>
        </div>

        {/* Comments section */}
        <div style={{ background: CARD, borderRadius: 20, border: `1px solid ${BORDER}`, padding: compact ? '14px' : '18px 20px' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: TEXT, margin: '0 0 16px', display: 'flex', gap: 8, alignItems: 'center' }}>
            <CommentIcon />
            Comments ({COMMENT_TREE.reduce((n, c) => n + 1 + (c.replies?.length ?? 0), 0)})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {COMMENT_TREE.map(c => <CommentThread key={c.id} node={c} compact={compact} />)}
          </div>
          <div style={{ marginTop: 16, padding: '10px 0', borderTop: `1px solid ${BORDER}` }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <Av name="Taylor Reeves" size={32} />
              <div style={{ flex: 1, background: BG, borderRadius: 12, padding: '9px 14px', fontSize: 13, color: MUTED, cursor: 'text', border: `1.5px solid ${BORDER}` }}>Write a comment…</div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 2. SHARE MODAL
// ═══════════════════════════════════════════════════════════════════
const CONVOS_FOR_SEND = [
  { name: 'Jordan Kim',     preview: 'Hey! Want to catch up?', time: '2m' },
  { name: 'Design Guild',   preview: 'Alex: Check this out 🔥', time: '1h' },
  { name: 'Maria Garcia',   preview: 'Thanks for sharing!', time: '3h' },
  { name: 'Alex Chen',      preview: 'Sounds good!', time: 'Tue' },
]

function ShareContent({ compact, onClose }: { compact: boolean; onClose: () => void }) {
  const [mode, setMode]   = useState<'main' | 'chat'>('main')
  const [toastVis, setToast] = useState(false)
  const [sent, setSent]   = useState<string | null>(null)

  const copyLink = () => {
    setToast(true)
    setTimeout(() => setToast(false), 2500)
  }

  if (mode === 'chat') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', maxHeight: compact ? '75vh' : '80vh', minWidth: compact ? undefined : 380 }}>
        <div style={{ padding: compact ? '14px 16px 10px' : '16px 20px 12px', borderBottom: `1px solid ${BORDER}`, display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
          <button onClick={() => setMode('main')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke={TEXT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: TEXT }}>Send via Message</h3>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke={MUTED} strokeWidth="2.5" strokeLinecap="round"/></svg>
          </button>
        </div>
        {/* Link preview strip */}
        <div style={{ padding: compact ? '10px 14px' : '12px 18px', background: 'rgba(8,102,255,0.04)', borderBottom: `1px solid ${BORDER}`, display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: COVERS[0], flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: TEXT, marginBottom: 2 }}>Dark Mode Accessibility…</div>
            <div style={{ fontSize: 11, color: MUTED }}>mychatapp.io/post/dark-mode-a11y</div>
          </div>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {CONVOS_FOR_SEND.map(c => (
            <button key={c.name} onClick={() => { setSent(c.name); setTimeout(onClose, 1200) }}
              style={{ display: 'flex', gap: 10, alignItems: 'center', width: '100%', padding: compact ? '10px 14px' : '11px 18px', background: sent === c.name ? 'rgba(49,162,76,0.06)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', borderBottom: `1px solid ${BORDER}`, transition: 'background 0.1s' }}>
              <Av name={c.name} size={40} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{c.name}</div>
                <div style={{ fontSize: 12, color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{c.preview}</div>
              </div>
              {sent === c.name
                ? <span style={{ fontSize: 12, fontWeight: 700, color: SUCCESS }}>✓ Sent</span>
                : <span style={{ background: 'rgba(8,102,255,0.08)', color: PRIMARY, border: `1px solid rgba(8,102,255,0.2)`, borderRadius: 9999, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>Send</span>}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: compact ? undefined : 360 }}>
      {/* Header */}
      <div style={{ padding: compact ? '14px 16px 10px' : '16px 20px 12px', borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        {compact && <div style={{ width: 36, height: 4, borderRadius: 2, background: BORDER, position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)' }} />}
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: TEXT }}>Share Post</h3>
        <button onClick={onClose} style={{ background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke={MUTED} strokeWidth="2.5" strokeLinecap="round"/></svg>
        </button>
      </div>

      <div style={{ padding: compact ? '14px 16px' : '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Post preview */}
        <div style={{ display: 'flex', gap: 10, padding: '10px 14px', background: BG, borderRadius: 14, border: `1px solid ${BORDER}` }}>
          <div style={{ width: 48, height: 48, borderRadius: 10, background: COVERS[0], flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Dark Mode Accessibility</div>
            <div style={{ fontSize: 12, color: MUTED }}>Taylor Reeves · 5 min read</div>
          </div>
        </div>

        {/* Action grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {[
            { icon: '📋', label: 'Copy Link', action: copyLink },
            { icon: '💬', label: 'Message',   action: () => setMode('chat') },
            { icon: '𝕏',  label: 'Twitter/X', action: () => {} },
            { icon: '🔗', label: 'More',      action: () => {} },
          ].map(o => (
            <button key={o.label} onClick={o.action}
              style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.1s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(8,102,255,0.04)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = BG}>
              <span style={{ fontSize: 22 }}>{o.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: TEXT }}>{o.label}</span>
            </button>
          ))}
        </div>

        {/* Copyable link row */}
        <div style={{ display: 'flex', gap: 0, background: BG, borderRadius: 12, border: `1.5px solid ${BORDER}`, overflow: 'hidden' }}>
          <span style={{ flex: 1, padding: '10px 14px', fontSize: 12, color: MUTED, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>mychatapp.io/post/dark-mode-a11y</span>
          <button onClick={copyLink} style={{ background: 'rgba(8,102,255,0.08)', border: 'none', padding: '10px 14px', fontSize: 13, fontWeight: 700, color: PRIMARY, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0, borderLeft: `1px solid ${BORDER}` }}>Copy</button>
        </div>
      </div>
      {/* Toast rendered inside modal bounds */}
      <Toast message="Link copied!" visible={toastVis} />
    </div>
  )
}

function ShareModalDemo({ bp }: { bp: Breakpoint }) {
  const [open, setOpen] = useState(true)
  const isMobile = bp === 'mobile'
  const compact  = bp !== 'desktop'

  return (
    <PageShell bp={bp} tab="Feed">
      {/* Faded feed behind */}
      <div style={{ flex: 1, overflowY: 'auto', padding: compact ? '12px' : '20px 24px', opacity: 0.3, pointerEvents: 'none' }}>
        {[0,1].map(i => (
          <div key={i} style={{ background: CARD, borderRadius: 20, border: `1px solid ${BORDER}`, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ height: compact ? 70 : 90, background: COVERS[i % COVERS.length] }} />
            <div style={{ padding: compact ? '10px 14px' : '12px 18px' }}>
              <div style={{ height: 16, background: BORDER, borderRadius: 4, width: '65%', marginBottom: 8 }} />
              <div style={{ height: 12, background: BORDER, borderRadius: 4, width: '40%' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Overlay */}
      {open && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 100, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center' }}>
          <div onClick={() => setOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)' }} />
          <div style={{ position: 'relative', background: CARD, borderRadius: isMobile ? '20px 20px 0 0' : 20, boxShadow: '0 24px 60px rgba(0,0,0,0.2)', width: isMobile ? '100%' : 'auto', zIndex: 1 }}>
            {isMobile && <div style={{ width: 36, height: 4, borderRadius: 2, background: BORDER, margin: '10px auto 0' }} />}
            <ShareContent compact={compact} onClose={() => setOpen(false)} />
          </div>
        </div>
      )}

      {!open && (
        <div style={{ position: 'absolute', bottom: isMobile ? 70 : 20, left: '50%', transform: 'translateX(-50%)' }}>
          <button onClick={() => setOpen(true)} style={{ background: 'rgba(8,102,255,0.1)', border: `1px solid rgba(8,102,255,0.2)`, borderRadius: 9999, padding: '8px 18px', fontSize: 13, fontWeight: 600, color: PRIMARY, cursor: 'pointer', fontFamily: 'inherit' }}>
            ↑ Open Share modal again
          </button>
        </div>
      )}
    </PageShell>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 3. BOOKMARKS / SAVED POSTS
// ═══════════════════════════════════════════════════════════════════
const SAMPLE_POSTS = [
  { id: '1', title: 'Dark Mode Accessibility — Beyond Simple Contrast', author: 'Taylor Reeves', excerpt: 'AA contrast ratios were designed for light backgrounds. On dark canvases, colors that pass can still cause halation.', tag: 'Engineering', cover: 0, readMin: 5,  date: 'Mar 12' },
  { id: '2', title: 'The New Wave of Typographic Layout',               author: 'Jordan Kim',    excerpt: 'Breaking out of the 12-column grid with variable fonts, optical sizing, and container queries.', tag: 'Design',      cover: 1, readMin: 4,  date: 'Mar 10' },
  { id: '3', title: 'What 3 Years of Continuous Discovery Taught Me',  author: 'Priya Sharma',  excerpt: 'Running ongoing research without burning out your team or annoying your users.', tag: 'Product',     cover: 2, readMin: 7,  date: 'Mar 8'  },
  { id: '4', title: 'Building Async-First Engineering Culture',         author: 'Alex Chen',     excerpt: 'Remote teams that thrive don\'t just use async tools — they build async habits.', tag: 'Engineering', cover: 3, readMin: 6,  date: 'Mar 5'  },
]

function PostCard({ post, bookmarked, onBookmark, compact }: { post: typeof SAMPLE_POSTS[0]; bookmarked: boolean; onBookmark: () => void; compact: boolean }) {
  const [liked, setLiked] = useState(false)
  return (
    <div style={{ background: CARD, borderRadius: 20, border: `1px solid ${BORDER}`, overflow: 'hidden', marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      <div style={{ height: compact ? 80 : 100, background: COVERS[post.cover] }} />
      <div style={{ padding: compact ? '12px 14px' : '14px 18px' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <Tag label={post.tag} />
          <span style={{ fontSize: 11, color: MUTED }}>{post.readMin} min read</span>
        </div>
        <h3 style={{ fontSize: compact ? 15 : 16, fontWeight: 700, color: TEXT, margin: '0 0 6px', lineHeight: 1.35 }}>{post.title}</h3>
        <p style={{ fontSize: compact ? 13 : 14, color: MUTED, margin: '0 0 12px', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.excerpt}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Av name={post.author} size={24} />
          <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{post.author}</span>
          <span style={{ fontSize: 12, color: MUTED }}>· {post.date}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
            <ActionBtn icon={<HeartIcon filled={liked} />} label={liked ? 43 : 42} active={liked} color={ERROR} onClick={() => setLiked(l => !l)} />
            <ActionBtn icon={<CommentIcon />} label={8} />
            {/* Bookmark button */}
            <button onClick={onBookmark}
              style={{ background: bookmarked ? 'rgba(8,102,255,0.08)' : 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: '5px 8px', borderRadius: 9999, color: bookmarked ? PRIMARY : MUTED, transition: 'all 0.15s' }}
              title={bookmarked ? 'Remove bookmark' : 'Save post'}>
              <BookmarkIcon filled={bookmarked} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SavedPostsScreen({ saved, onUnsave, compact }: { saved: Set<string>; onUnsave: (id: string) => void; compact: boolean }) {
  const savedPosts = SAMPLE_POSTS.filter(p => saved.has(p.id))
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: compact ? '12px' : '20px 24px' }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT, margin: '0 0 4px' }}>Saved Posts</h2>
      <p style={{ fontSize: 13, color: MUTED, margin: '0 0 16px' }}>{savedPosts.length} saved</p>
      {savedPosts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 16px', color: MUTED }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>🔖</div>
          <p style={{ fontSize: 15, fontWeight: 600, color: TEXT, margin: '0 0 6px' }}>No saved posts yet</p>
          <p style={{ fontSize: 13, margin: 0 }}>Tap the bookmark icon on any post to save it here</p>
        </div>
      )}
      {savedPosts.map(p => <PostCard key={p.id} post={p} compact={compact} bookmarked onBookmark={() => onUnsave(p.id)} />)}
    </div>
  )
}

function BookmarksDemo({ bp }: { bp: Breakpoint }) {
  const [saved, setSaved] = useState(new Set(['1', '3']))
  const [view, setView]   = useState<'feed' | 'saved'>('feed')
  const compact  = bp !== 'desktop'

  const toggle = (id: string) => setSaved(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })

  return (
    <PageShell bp={bp} tab={view === 'saved' ? 'Saved' : 'Feed'}>
      <div style={{ padding: compact ? '10px 14px' : '10px 24px', borderBottom: `1px solid ${BORDER}`, background: CARD, display: 'flex', gap: 8, flexShrink: 0 }}>
        {['feed', 'saved'].map(v => (
          <button key={v} onClick={() => setView(v as 'feed' | 'saved')}
            style={{ background: view === v ? 'rgba(8,102,255,0.08)' : 'transparent', color: view === v ? PRIMARY : MUTED, border: 'none', borderRadius: 9999, padding: '6px 14px', fontSize: 13, fontWeight: view === v ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', gap: 6, alignItems: 'center' }}>
            {v === 'saved' && <BookmarkIcon filled={view === 'saved'} />}
            {v === 'feed' ? 'Feed' : `Saved${saved.size > 0 ? ` (${saved.size})` : ''}`}
          </button>
        ))}
      </div>

      {view === 'feed' ? (
        <div style={{ flex: 1, overflowY: 'auto', padding: compact ? '12px' : '20px 24px' }}>
          {SAMPLE_POSTS.map(p => <PostCard key={p.id} post={p} compact={compact} bookmarked={saved.has(p.id)} onBookmark={() => toggle(p.id)} />)}
        </div>
      ) : (
        <SavedPostsScreen saved={saved} onUnsave={id => toggle(id)} compact={compact} />
      )}
    </PageShell>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 4. REPORT POST/COMMENT
// ═══════════════════════════════════════════════════════════════════
const REPORT_REASONS = ['Spam', 'Harassment', 'Misinformation', 'Hate speech', 'Violence', 'Other']

function ReportContent({ onClose, compact }: { onClose: () => void; compact: boolean }) {
  const [reason, setReason]   = useState<string | null>(null)
  const [details, setDetails] = useState('')
  const [submitted, setSubmit] = useState(false)

  if (submitted) {
    return (
      <div style={{ padding: compact ? '24px 16px' : '32px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(49,162,76,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke={SUCCESS} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <p style={{ fontSize: 16, fontWeight: 700, color: TEXT, margin: 0 }}>Report submitted</p>
        <p style={{ fontSize: 13, color: MUTED, margin: 0, lineHeight: 1.55 }}>Thanks for letting us know. We review all reports and take action on content that violates our guidelines.</p>
        <button onClick={onClose} style={{ marginTop: 6, background: BG, border: `1.5px solid ${BORDER}`, borderRadius: 12, padding: '10px 24px', fontSize: 14, fontWeight: 600, color: TEXT, cursor: 'pointer', fontFamily: 'inherit' }}>Done</button>
      </div>
    )
  }

  return (
    <>
      <div style={{ padding: compact ? '14px 16px 10px' : '16px 20px 12px', borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        {compact && <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', width: 36, height: 4, borderRadius: 2, background: BORDER }} />}
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: TEXT }}>Report Post</h3>
        <button onClick={onClose} style={{ background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke={MUTED} strokeWidth="2.5" strokeLinecap="round"/></svg>
        </button>
      </div>

      <div style={{ padding: compact ? '12px 16px' : '14px 20px', flex: 1, overflowY: 'auto' }}>
        <p style={{ margin: '0 0 12px', fontSize: 13, color: MUTED, lineHeight: 1.55 }}>Tell us what's wrong with this post. Your report is anonymous and will be reviewed by our team.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {REPORT_REASONS.map(r => (
            <button key={r} onClick={() => setReason(r)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', background: reason === r ? 'rgba(8,102,255,0.06)' : BG, border: `1.5px solid ${reason === r ? PRIMARY : BORDER}`, borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: reason === r ? 600 : 400, color: TEXT, textAlign: 'left', transition: 'all 0.12s' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${reason === r ? PRIMARY : BORDER}`, background: reason === r ? PRIMARY : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.12s' }}>
                {reason === r && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
              </div>
              {r}
            </button>
          ))}
        </div>

        {reason === 'Other' && (
          <textarea value={details} onChange={e => setDetails(e.target.value)} placeholder="Please describe the issue…" rows={3}
            style={{ width: '100%', border: `1.5px solid ${BORDER}`, borderRadius: 12, padding: '10px 14px', fontSize: 13, color: TEXT, fontFamily: 'inherit', resize: 'none', outline: 'none', boxSizing: 'border-box', lineHeight: 1.5 }} />
        )}
      </div>

      <div style={{ padding: compact ? '10px 16px' : '12px 20px', borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
        <button disabled={!reason}
          onClick={() => setSubmit(true)}
          style={{ width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: reason ? ERROR : BORDER, fontSize: 15, fontWeight: 700, color: reason ? '#fff' : MUTED, cursor: reason ? 'pointer' : 'not-allowed', fontFamily: 'inherit', boxShadow: reason ? '0 4px 16px rgba(250,56,62,0.3)' : 'none', transition: 'all 0.15s' }}>
          Submit Report
        </button>
      </div>
    </>
  )
}

function ReportDemo({ bp }: { bp: Breakpoint }) {
  const [open, setOpen] = useState(true)
  const isMobile = bp === 'mobile'
  const compact  = bp !== 'desktop'

  return (
    <PageShell bp={bp} tab="Feed">
      <div style={{ flex: 1, overflowY: 'auto', padding: compact ? '12px' : '20px 24px', opacity: 0.3, pointerEvents: 'none' }}>
        {SAMPLE_POSTS.slice(0, 2).map(p => (
          <div key={p.id} style={{ background: CARD, borderRadius: 20, border: `1px solid ${BORDER}`, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ height: compact ? 70 : 90, background: COVERS[p.cover] }} />
            <div style={{ padding: compact ? '10px 14px' : '12px 18px' }}>
              <div style={{ height: 15, background: BORDER, borderRadius: 4, width: '60%', marginBottom: 8 }} />
              <div style={{ height: 12, background: BORDER, borderRadius: 4, width: '40%' }} />
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 100, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center' }}>
          <div onClick={() => setOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)' }} />
          <div style={{ position: 'relative', background: CARD, borderRadius: isMobile ? '20px 20px 0 0' : 20, width: isMobile ? '100%' : 400, maxHeight: '85%', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.2)', zIndex: 1 }}>
            <ReportContent compact={compact} onClose={() => setOpen(false)} />
          </div>
        </div>
      )}
      {!open && (
        <div style={{ position: 'absolute', bottom: isMobile ? 70 : 20, left: '50%', transform: 'translateX(-50%)' }}>
          <button onClick={() => setOpen(true)} style={{ background: 'rgba(250,56,62,0.08)', border: `1px solid rgba(250,56,62,0.2)`, borderRadius: 9999, padding: '8px 18px', fontSize: 13, fontWeight: 600, color: ERROR, cursor: 'pointer', fontFamily: 'inherit' }}>↑ Re-open Report modal</button>
        </div>
      )}
    </PageShell>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 5. EDIT / DELETE OWN CONTENT
// ═══════════════════════════════════════════════════════════════════
function EditDeleteDemo({ bp }: { bp: Breakpoint }) {
  const [editing, setEditing]   = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deleted, setDeleted]   = useState<Set<string>>(new Set())
  const [saved, setSaved]       = useState<Record<string, string>>({})
  const compact = bp !== 'desktop'
  const isMobile = bp === 'mobile'

  const posts = [
    { id: 'p1', mine: true,  author: 'Taylor Reeves', tag: 'Engineering', title: 'Dark Mode Accessibility', excerpt: 'AA contrast ratios were designed with light backgrounds in mind.', cover: 0, date: 'Mar 12', readMin: 5, likes: 42, comments: 8 },
    { id: 'p2', mine: false, author: 'Jordan Kim',    tag: 'Design',      title: 'The New Wave of Typographic Layout', excerpt: 'Breaking out of the 12-column grid with variable fonts.', cover: 1, date: 'Mar 10', readMin: 4, likes: 31, comments: 5 },
  ]

  const [liked, setLiked] = useState<Record<string, boolean>>({})

  return (
    <PageShell bp={bp} tab="Feed">
      <div style={{ flex: 1, overflowY: 'auto', padding: compact ? '12px' : '20px 24px', position: 'relative' }}>
        {posts.map(p => {
          if (deleted.has(p.id)) return (
            <div key={p.id} style={{ background: BG, borderRadius: 20, border: `1px dashed ${BORDER}`, padding: '20px', textAlign: 'center', marginBottom: 12, color: MUTED }}>
              <span style={{ fontSize: 13, fontStyle: 'italic' }}>Post deleted</span>
            </div>
          )

          const isEditing = editing === p.id
          const currentTitle = saved[p.id] ?? p.title

          return (
            <div key={p.id} style={{ background: CARD, borderRadius: 20, border: `1.5px solid ${isEditing ? PRIMARY : BORDER}`, overflow: 'hidden', marginBottom: 12, boxShadow: isEditing ? '0 0 0 3px rgba(8,102,255,0.1)' : '0 1px 4px rgba(0,0,0,0.04)', transition: 'border-color 0.15s, box-shadow 0.15s' }}>
              {!isEditing && <div style={{ height: compact ? 80 : 100, background: COVERS[p.cover] }} />}
              <div style={{ padding: compact ? '12px 14px' : '14px 18px' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <Tag label={p.tag} />
                  <span style={{ fontSize: 11, color: MUTED }}>{p.readMin} min read</span>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, alignItems: 'center' }}>
                    {p.mine && <span style={{ fontSize: 11, color: PRIMARY, fontWeight: 600, background: 'rgba(8,102,255,0.08)', borderRadius: 9999, padding: '1px 7px' }}>Your post</span>}
                    <DotMenu align="right" items={p.mine
                      ? [
                          { label: 'Edit post', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>, onClick: () => { setEditing(p.id); setEditText(currentTitle) } },
                          { label: 'Delete post', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><polyline points="3,6 5,6 21,6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>, danger: true, onClick: () => setDeleting(p.id) },
                        ]
                      : [
                          { label: 'Report post', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="1.8"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2"/></svg>, danger: true, onClick: () => {} },
                          { label: 'Hide post', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>, onClick: () => {} },
                        ]
                    } />
                  </div>
                </div>

                {isEditing ? (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: PRIMARY, fontWeight: 600, marginBottom: 6 }}>✎ Editing title</div>
                    <input value={editText} onChange={e => setEditText(e.target.value)}
                      style={{ width: '100%', border: `1.5px solid ${PRIMARY}`, borderRadius: 10, padding: '9px 12px', fontSize: compact ? 14 : 15, fontWeight: 700, color: TEXT, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', boxShadow: '0 0 0 3px rgba(8,102,255,0.1)' }} />
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
                      <button onClick={() => setEditing(null)} style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 9999, padding: '6px 14px', fontSize: 13, fontWeight: 600, color: TEXT, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                      <button onClick={() => { setSaved(s => ({ ...s, [p.id]: editText })); setEditing(null) }} style={{ background: 'rgba(49,162,76,0.1)', border: `1px solid rgba(49,162,76,0.3)`, borderRadius: 9999, padding: '6px 14px', fontSize: 13, fontWeight: 700, color: SUCCESS, cursor: 'pointer', fontFamily: 'inherit' }}>Save changes</button>
                    </div>
                  </div>
                ) : (
                  <h3 style={{ fontSize: compact ? 15 : 16, fontWeight: 700, color: TEXT, margin: '0 0 6px', lineHeight: 1.35 }}>
                    {currentTitle}
                    {saved[p.id] && <span style={{ fontSize: 11, color: SUCCESS, fontWeight: 600, marginLeft: 6, background: 'rgba(49,162,76,0.08)', borderRadius: 9999, padding: '1px 7px' }}>edited</span>}
                  </h3>
                )}

                {!isEditing && <p style={{ fontSize: compact ? 13 : 14, color: MUTED, margin: '0 0 12px', lineHeight: 1.55 }}>{p.excerpt}</p>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Av name={p.author} size={24} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{p.author}</span>
                  <span style={{ fontSize: 12, color: MUTED }}>· {p.date}</span>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
                    <ActionBtn icon={<HeartIcon filled={!!liked[p.id]} />} label={p.likes + (liked[p.id] ? 1 : 0)} active={!!liked[p.id]} color={ERROR} onClick={() => setLiked(l => ({ ...l, [p.id]: !l[p.id] }))} />
                    <ActionBtn icon={<CommentIcon />} label={p.comments} />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {deleting && (
        <ConfirmModal
          title="Delete this post?"
          body="This post will be permanently removed for everyone. This action can't be undone."
          confirmLabel="Delete Post"
          onCancel={() => setDeleting(null)}
          onConfirm={() => { setDeleted(d => { const n = new Set(d); n.add(deleting!); return n }); setDeleting(null) }}
        />
      )}
    </PageShell>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 6. IMAGE GALLERY / LIGHTBOX
// ═══════════════════════════════════════════════════════════════════
const GALLERY_IMAGES = [
  { bg: 'linear-gradient(135deg, #0866FF 0%, #7B2FBE 100%)', emoji: '🏙️', caption: 'City skyline at dusk' },
  { bg: 'linear-gradient(145deg, #F7B928 0%, #FA383E 100%)', emoji: '🌅', caption: 'Golden hour' },
  { bg: 'linear-gradient(135deg, #31A24C 0%, #00B2FF 100%)', emoji: '🌿', caption: 'Nature walk' },
  { bg: 'linear-gradient(145deg, #8B5CF6 0%, #EC4899 100%)', emoji: '🎆', caption: 'Festival lights' },
]

function GalleryLightbox({ idx: initIdx, onClose }: { idx: number; onClose: () => void }) {
  const [idx, setIdx] = useState(initIdx)
  const img = GALLERY_IMAGES[idx]
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.96)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
        </button>
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600 }}>{idx + 1} / {GALLERY_IMAGES.length}</span>
        <button style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '0 50px' }}>
        {idx > 0 && <button onClick={() => setIdx(i => i - 1)} style={{ position: 'absolute', left: 10, background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>}
        <div style={{ width: '100%', aspectRatio: '4/3', maxWidth: 500, background: img.bg, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
          <span style={{ fontSize: 64 }}>{img.emoji}</span>
        </div>
        {idx < GALLERY_IMAGES.length - 1 && <button onClick={() => setIdx(i => i + 1)} style={{ position: 'absolute', right: 10, background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>}
      </div>

      <div style={{ padding: '8px 16px', textAlign: 'center', flexShrink: 0 }}>
        <p style={{ margin: '0 0 10px', fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{img.caption}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          {GALLERY_IMAGES.map((im, i) => (
            <div key={i} onClick={() => setIdx(i)} style={{ width: 48, height: 36, borderRadius: 8, background: im.bg, cursor: 'pointer', border: i === idx ? '2.5px solid #fff' : '2.5px solid transparent', opacity: i === idx ? 1 : 0.5, transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
              {im.emoji}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ImageGalleryDemo({ bp }: { bp: Breakpoint }) {
  const [lightbox, setLightbox] = useState<number | null>(null)
  const compact  = bp !== 'desktop'
  const isMobile = bp === 'mobile'
  const stripH   = compact ? 110 : 140

  return (
    <PageShell bp={bp} tab="Feed">
      <div style={{ flex: 1, overflowY: 'auto', padding: compact ? '12px' : '20px 24px', position: 'relative' }}>
        <div style={{ background: CARD, borderRadius: 20, border: `1px solid ${BORDER}`, overflow: 'hidden', marginBottom: 14 }}>
          {/* Cover + post meta */}
          <div style={{ padding: compact ? '14px' : '18px' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
              <Av name="Jordan Kim" size={36} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>Jordan Kim</div>
                <div style={{ fontSize: 12, color: MUTED }}>Mar 10 · 4 min read</div>
              </div>
              <div style={{ marginLeft: 'auto' }}><Tag label="Design" /></div>
            </div>
            <h2 style={{ fontSize: compact ? 16 : 18, fontWeight: 700, color: TEXT, margin: '0 0 8px' }}>Weekend Sketching — From Prompt to Pixel</h2>
            <p style={{ fontSize: compact ? 13 : 14, color: MUTED, margin: 0, lineHeight: 1.6 }}>I set myself a challenge: one sketch a day, no digital tools, for a week. Here's what came out — rough, honest, and surprisingly useful for ideation.</p>
          </div>

          {/* Horizontal image strip */}
          <div style={{ position: 'relative' }}>
            <div style={{ overflowX: 'auto', display: 'flex', gap: 8, padding: compact ? '0 14px 14px' : '0 18px 18px', scrollbarWidth: 'none' }}>
              {GALLERY_IMAGES.map((img, i) => (
                <div key={i} onClick={() => setLightbox(i)}
                  style={{ width: compact ? 160 : 200, height: stripH, borderRadius: 14, background: img.bg, flexShrink: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', transition: 'opacity 0.1s, transform 0.1s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.9'; (e.currentTarget as HTMLElement).style.transform = 'scale(1.01)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}>
                  <span style={{ fontSize: compact ? 36 : 44 }}>{img.emoji}</span>
                  {/* Expand icon overlay */}
                  <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.45)', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  {/* Image count badge on first item */}
                  {i === 0 && (
                    <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.55)', borderRadius: 9999, padding: '3px 9px', fontSize: 11, fontWeight: 700, color: '#fff', backdropFilter: 'blur(4px)' }}>
                      {GALLERY_IMAGES.length} photos
                    </div>
                  )}
                </div>
              ))}
            </div>
            {/* Scroll fade hint */}
            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 14, width: 40, background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.8))', pointerEvents: 'none', borderRadius: '0 0 0 0' }} />
          </div>

          <div style={{ padding: compact ? '0 14px 12px' : '0 18px 14px', display: 'flex', gap: 2 }}>
            <ActionBtn icon={<HeartIcon filled={false} />} label={31} color={ERROR} />
            <ActionBtn icon={<CommentIcon />} label={5} />
            <ActionBtn icon={<ShareIcon />} />
            <div style={{ marginLeft: 'auto' }}>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px 8px', borderRadius: 9999, color: MUTED }}><BookmarkIcon filled={false} /></button>
            </div>
          </div>
        </div>

        <div style={{ padding: '8px 12px', background: 'rgba(8,102,255,0.05)', border: `1px solid rgba(8,102,255,0.15)`, borderRadius: 12, fontSize: 12, color: PRIMARY, fontWeight: 500 }}>
          💡 Tap any photo in the strip to open the lightbox
        </div>

        {/* Lightbox */}
        {lightbox !== null && <GalleryLightbox idx={lightbox} onClose={() => setLightbox(null)} />}
      </div>
    </PageShell>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 7. IMAGE UPLOAD IN CREATE POST
// ═══════════════════════════════════════════════════════════════════
function ImageUploadDemo({ bp }: { bp: Breakpoint }) {
  const [coverState, setCoverState] = useState<'empty' | 'selected' | 'dragging'>('selected')
  const [body, setBody]             = useState("I set myself a challenge: one sketch a day, no digital tools, for a week.\n\nThe results surprised me...")
  const [title, setTitle]           = useState('Weekend Sketching — From Prompt to Pixel')
  const compact  = bp !== 'desktop'
  const isMobile = bp === 'mobile'

  return (
    <PageShell bp={bp} tab="Feed">
      <div style={{ flex: 1, overflowY: 'auto', padding: compact ? '12px' : '24px 32px', maxWidth: 720, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        {/* Back + Publish row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: compact ? 14 : 20 }}>
          <button style={{ display: 'flex', gap: 6, alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: MUTED, fontFamily: 'inherit' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Discard
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ background: BG, border: `1.5px solid ${BORDER}`, borderRadius: 9999, padding: '7px 16px', fontSize: 13, fontWeight: 600, color: TEXT, cursor: 'pointer', fontFamily: 'inherit' }}>Save draft</button>
            <button style={{ background: GRAD, border: 'none', borderRadius: 9999, padding: '7px 18px', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 12px rgba(8,102,255,0.3)' }}>Publish →</button>
          </div>
        </div>

        {/* Cover image upload zone */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>Cover Image</label>
            {coverState === 'selected' && (
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setCoverState('empty')} style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 9999, padding: '3px 11px', fontSize: 12, fontWeight: 600, color: MUTED, cursor: 'pointer', fontFamily: 'inherit' }}>Remove</button>
                <button style={{ background: 'rgba(8,102,255,0.08)', border: `1px solid rgba(8,102,255,0.2)`, borderRadius: 9999, padding: '3px 11px', fontSize: 12, fontWeight: 600, color: PRIMARY, cursor: 'pointer', fontFamily: 'inherit' }}>Replace</button>
              </div>
            )}
          </div>

          {coverState === 'selected' ? (
            /* Selected state — thumbnail preview */
            <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', height: compact ? 140 : 180, border: `2px solid ${PRIMARY}`, boxShadow: '0 0 0 3px rgba(8,102,255,0.12)' }}>
              <div style={{ height: '100%', background: COVERS[1], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 48 }}>🌅</span>
              </div>
              {/* Overlay controls */}
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', transition: 'background 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: 0 }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.35)'; (e.currentTarget as HTMLElement).style.opacity = '1' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0)'; (e.currentTarget as HTMLElement).style.opacity = '0' }}>
                <button onClick={() => setCoverState('empty')} style={{ background: 'rgba(250,56,62,0.85)', border: 'none', borderRadius: 9999, padding: '7px 14px', fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>Remove</button>
                <button style={{ background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: 9999, padding: '7px 14px', fontSize: 12, fontWeight: 700, color: TEXT, cursor: 'pointer', fontFamily: 'inherit' }}>Replace</button>
              </div>
              {/* Selected badge */}
              <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(49,162,76,0.9)', borderRadius: 9999, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: '#fff', display: 'flex', gap: 5, alignItems: 'center' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
                Cover selected
              </div>
              {/* File info */}
              <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(0,0,0,0.55)', borderRadius: 9999, padding: '3px 10px', fontSize: 11, color: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)' }}>
                golden-hour.jpg · 2.4 MB
              </div>
            </div>
          ) : coverState === 'dragging' ? (
            /* Dragging state */
            <div style={{ height: compact ? 140 : 180, borderRadius: 16, border: `2px dashed ${PRIMARY}`, background: 'rgba(8,102,255,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M16 12l-4-4-4 4M12 2v13" stroke={PRIMARY} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span style={{ fontSize: 14, fontWeight: 700, color: PRIMARY }}>Drop to upload</span>
            </div>
          ) : (
            /* Empty state */
            <div
              onClick={() => setCoverState('selected')}
              onDragEnter={() => setCoverState('dragging')}
              style={{ height: compact ? 140 : 180, borderRadius: 16, border: `2px dashed ${BORDER}`, background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = PRIMARY; (e.currentTarget as HTMLElement).style.background = 'rgba(8,102,255,0.03)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = BORDER; (e.currentTarget as HTMLElement).style.background = BG }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(8,102,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke={PRIMARY} strokeWidth="1.5"/><circle cx="8.5" cy="8.5" r="1.5" stroke={PRIMARY} strokeWidth="1.5"/><path d="M21 15l-5-5L5 21" stroke={PRIMARY} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: TEXT }}>Drop an image or click to upload</p>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: MUTED }}>PNG, JPG, WebP — up to 10 MB</p>
              </div>
              <button style={{ background: 'rgba(8,102,255,0.08)', border: `1px solid rgba(8,102,255,0.2)`, borderRadius: 9999, padding: '6px 16px', fontSize: 13, fontWeight: 600, color: PRIMARY, cursor: 'pointer', fontFamily: 'inherit' }}>Browse files</button>
            </div>
          )}
        </div>

        {/* Toggle between states */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, padding: '6px 0', borderBottom: `1px solid ${BORDER}` }}>
          <span style={{ fontSize: 12, color: MUTED, alignSelf: 'center', marginRight: 4 }}>Preview state:</span>
          {(['empty', 'selected'] as const).map(s => (
            <button key={s} onClick={() => setCoverState(s)}
              style={{ background: coverState === s ? 'rgba(8,102,255,0.08)' : 'transparent', border: `1px solid ${coverState === s ? PRIMARY : BORDER}`, borderRadius: 9999, padding: '3px 12px', fontSize: 12, fontWeight: coverState === s ? 700 : 400, color: coverState === s ? PRIMARY : MUTED, cursor: 'pointer', fontFamily: 'inherit' }}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Title */}
        <input value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Post title…"
          style={{ width: '100%', border: 'none', outline: 'none', fontSize: compact ? 20 : 24, fontWeight: 700, color: TEXT, fontFamily: 'inherit', background: 'transparent', padding: '0 0 12px', borderBottom: `1px solid ${BORDER}`, marginBottom: 16, boxSizing: 'border-box' }} />

        {/* Body */}
        <textarea value={body} onChange={e => setBody(e.target.value)}
          placeholder="Tell your story…"
          rows={compact ? 5 : 8}
          style={{ width: '100%', border: 'none', outline: 'none', fontSize: compact ? 14 : 15, color: TEXT, fontFamily: 'inherit', resize: 'none', background: 'transparent', lineHeight: 1.7, padding: 0, boxSizing: 'border-box' }} />
      </div>
    </PageShell>
  )
}

// ═══════════════════════════════════════════════════════════════════
// Device Frame
// ═══════════════════════════════════════════════════════════════════
function DeviceFrame({ bp, children }: { bp: Breakpoint; children: React.ReactNode }) {
  const C = { mobile: { w: 390, h: 780, scale: 0.80, mobile: true }, tablet: { w: 834, h: 680, scale: 0.70, mobile: false }, desktop: { w: 1280, h: 680, scale: 0.63, mobile: false } }[bp]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {!C.mobile && (
        <div style={{ width: C.w * C.scale, background: '#E8EAED', borderRadius: '12px 12px 0 0', padding: '10px 14px 8px', display: 'flex', alignItems: 'center', gap: 6, border: '1.5px solid #D0D3D8', borderBottom: 'none' }}>
          {['#FA383E','#F7B928','#31A24C'].map((c, i) => <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
          <div style={{ flex: 1, background: '#fff', borderRadius: 6, height: 22, display: 'flex', alignItems: 'center', paddingLeft: 10, fontSize: 11, color: MUTED, marginLeft: 8 }}>mychatapp.io</div>
        </div>
      )}
      <div style={{ width: C.w * C.scale, height: C.h * C.scale, border: C.mobile ? '8px solid #1C1C1E' : '1.5px solid #D0D3D8', borderTop: C.mobile ? '8px solid #1C1C1E' : 'none', borderRadius: C.mobile ? 36 : '0 0 8px 8px', overflow: 'hidden', boxShadow: C.mobile ? '0 20px 60px rgba(0,0,0,0.25)' : '0 8px 30px rgba(0,0,0,0.12)', background: BG, position: 'relative' }}>
        {C.mobile && <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 100, height: 24, background: '#1C1C1E', borderRadius: '0 0 16px 16px', zIndex: 10 }} />}
        <div style={{ width: C.w, height: C.h, transform: `scale(${C.scale})`, transformOrigin: 'top left', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
          {C.mobile && <div style={{ height: 44, background: '#1C1C1E', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}><span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>9:41</span><span style={{ fontSize: 11, color: '#fff', letterSpacing: 2 }}>●●●</span></div>}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>{children}</div>
        </div>
      </div>
      {C.mobile && <div style={{ width: 100, height: 4, borderRadius: 2, background: '#1C1C1E', opacity: 0.4, marginTop: 6 }} />}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// Main export
// ═══════════════════════════════════════════════════════════════════
const DEMOS: { id: Demo; label: string; desc: string }[] = [
  { id: 'threaded-comments', label: 'Threaded Comments', desc: 'Nested replies with thread lines, inline reply composer, per-reply Like/Reply, own vs others dot menu' },
  { id: 'share-modal',       label: 'Share Modal',       desc: 'Copy link · Twitter/X · Send via Message with a conversation picker and link preview strip' },
  { id: 'bookmarks',         label: 'Bookmarks',         desc: 'Bookmark toggle on PostCard + Saved Posts screen listing all bookmarked posts' },
  { id: 'report',            label: 'Report',            desc: 'Bottom sheet (mobile) / centered modal (desktop) with reason radio list and submit confirmation' },
  { id: 'edit-delete',       label: 'Edit & Delete',     desc: '"…" menu on own posts: inline title editor with Save, and Delete with shared confirm modal' },
  { id: 'image-gallery',     label: 'Image Gallery',     desc: 'Horizontal scrollable image strip in Post Detail + fullscreen Lightbox with thumbnails' },
  { id: 'image-upload',      label: 'Image Upload',      desc: 'Create Post cover upload: empty / selected / dragging states with Replace & Remove controls' },
]

export default function BlogInteractions() {
  const [activeDemo, setActiveDemo] = useState<Demo>('threaded-comments')
  const current = DEMOS.find(d => d.id === activeDemo)!

  const renderDemo = (bp: Breakpoint) => {
    switch (activeDemo) {
      case 'threaded-comments': return <ThreadedCommentsDemo bp={bp} />
      case 'share-modal':       return <ShareModalDemo bp={bp} />
      case 'bookmarks':         return <BookmarksDemo bp={bp} />
      case 'report':            return <ReportDemo bp={bp} />
      case 'edit-delete':       return <EditDeleteDemo bp={bp} />
      case 'image-gallery':     return <ImageGalleryDemo bp={bp} />
      case 'image-upload':      return <ImageUploadDemo bp={bp} />
    }
  }

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: BG, minHeight: '100vh' }}>
      <div style={{ background: 'linear-gradient(135deg, #050505 0%, #1C1E21 100%)', padding: '20px 40px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ marginBottom: 14 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 3px' }}>Blog Interactions</h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0 }}>{current.desc}</p>
          </div>
          <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 4, flexWrap: 'wrap' }}>
            {DEMOS.map(d => (
              <button key={d.id} onClick={() => setActiveDemo(d.id)}
                style={{ background: activeDemo === d.id ? '#fff' : 'transparent', color: activeDemo === d.id ? '#050505' : 'rgba(255,255,255,0.75)', border: 'none', borderRadius: 9, padding: '5px 14px', fontSize: 12, fontWeight: activeDemo === d.id ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '40px 40px 80px' }}>
        <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center' }}>
          {(['mobile', 'tablet', 'desktop'] as Breakpoint[]).map(bp => (
            <div key={bp} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <DeviceFrame bp={bp}>{renderDemo(bp)}</DeviceFrame>
              <span style={{ fontSize: 12, color: MUTED }}>{bp === 'mobile' ? '390px — Mobile' : bp === 'tablet' ? '834px — Tablet' : '1280px — Desktop'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
