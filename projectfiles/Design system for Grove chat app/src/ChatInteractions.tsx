import { useState, useEffect, useRef } from 'react'

// ─── Tokens — identical to ChatExperience ─────────────────────────
const GRAD     = 'linear-gradient(135deg, #00B2FF 0%, #B620E0 100%)'
const GRAD_MSG = 'linear-gradient(135deg, #0866FF 0%, #7B2FBE 100%)'
const PRIMARY  = '#0866FF'
const BG       = '#F7F8FA'
const CARD     = '#FFFFFF'
const TEXT     = '#050505'
const MUTED    = '#65676B'
const BORDER   = '#E4E6EB'
const RECV_BG  = '#F0F0F0'
const SUCCESS  = '#31A24C'
const ERROR    = '#FA383E'
const SEND_R   = '18px 18px 4px 18px'
const RECV_R   = '18px 18px 18px 4px'

type Breakpoint = 'mobile' | 'tablet' | 'desktop'
type Demo = 'emoji-picker' | 'context-menu' | 'reactions' | 'reply' | 'edit-unsend' | 'attachment' | 'image-bubble' | 'link-preview' | 'voice-extras'

// ─── Avatar ───────────────────────────────────────────────────────
const PALETTE = ['#0866FF','#B620E0','#00B2FF','#31A24C','#F7B928','#FA383E','#8B5CF6','#EC4899']
const ac = (n: string) => PALETTE[n.charCodeAt(0) % PALETTE.length]

function Av({ name, size = 32, online = false }: { name: string; size?: number; online?: boolean }) {
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div style={{ width: size, height: size, borderRadius: '50%', background: ac(name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.37, fontWeight: 700, color: '#fff' }}>
        {name.split(' ').map(w => w[0]).join('').slice(0, 2)}
      </div>
      {online && <div style={{ position: 'absolute', bottom: 0, right: 0, width: size * 0.28, height: size * 0.28, borderRadius: '50%', background: SUCCESS, border: '2px solid #fff' }} />}
    </div>
  )
}

// ─── Bubble (matches ChatExperience exactly) ──────────────────────
interface BubbleProps {
  sent?: boolean
  text?: string
  time?: string
  read?: boolean
  children?: React.ReactNode
  reactions?: { emoji: string; count: number; mine?: boolean }[]
  replyTo?: { name: string; text: string }
  deleted?: boolean
  edited?: boolean
  compact?: boolean
}

function Bubble({ sent = true, text, time = '2:34 PM', read = false, children, reactions, replyTo, deleted, edited, compact }: BubbleProps) {
  if (deleted) {
    return (
      <div style={{ display: 'flex', justifyContent: sent ? 'flex-end' : 'flex-start', marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: MUTED, fontStyle: 'italic', padding: '8px 14px', background: 'rgba(0,0,0,0.04)', borderRadius: 12, border: `1px dashed ${BORDER}` }}>
          This message was deleted
        </span>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: sent ? 'flex-end' : 'flex-start', marginBottom: reactions ? 14 : 6, position: 'relative' }}>
      {/* Reply quote */}
      {replyTo && (
        <div style={{ maxWidth: compact ? 180 : 260, marginBottom: 4, background: sent ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.06)', borderRadius: 10, padding: '6px 10px', borderLeft: `3px solid ${sent ? 'rgba(255,255,255,0.5)' : PRIMARY}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: sent ? 'rgba(255,255,255,0.8)' : PRIMARY, marginBottom: 2 }}>{replyTo.name}</div>
          <div style={{ fontSize: 12, color: sent ? 'rgba(255,255,255,0.7)' : MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{replyTo.text}</div>
        </div>
      )}

      {/* The bubble */}
      <div style={{ position: 'relative' }}>
        <div style={{
          background: sent ? GRAD_MSG : RECV_BG,
          borderRadius: sent ? SEND_R : RECV_R,
          padding: children ? 0 : (compact ? '8px 12px' : '10px 14px'),
          maxWidth: compact ? 200 : 280,
          color: sent ? '#fff' : TEXT,
          overflow: 'hidden',
        }}>
          {children ?? (
            <>
              <p style={{ margin: 0, fontSize: compact ? 13 : 15, lineHeight: 1.5, wordBreak: 'break-word' }}>{text}</p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4, marginTop: 4 }}>
                {edited && <span style={{ fontSize: 10, opacity: 0.7 }}>edited</span>}
                <span style={{ fontSize: 11, opacity: 0.7 }}>{time}</span>
                {sent && (
                  <svg width="14" height="10" viewBox="0 0 16 11" fill="none">
                    <path d={read ? 'M1 5.5l4 4L15 1M5 9.5L9.5 5' : 'M1 5.5l4 4L15 1'} stroke={read ? '#93C5FD' : 'rgba(255,255,255,0.7)'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </>
          )}
        </div>

        {/* Reaction pills */}
        {reactions && reactions.length > 0 && (
          <div style={{ position: 'absolute', bottom: -18, [sent ? 'right' : 'left']: 4, display: 'flex', gap: 4 }}>
            {reactions.map((r, i) => (
              <div key={i} style={{ background: r.mine ? 'rgba(8,102,255,0.12)' : CARD, border: `1.5px solid ${r.mine ? PRIMARY : BORDER}`, borderRadius: 9999, padding: '2px 7px', display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', whiteSpace: 'nowrap' }}>
                <span>{r.emoji}</span>
                {r.count > 1 && <span style={{ fontSize: 11, fontWeight: 600, color: r.mine ? PRIMARY : MUTED }}>{r.count}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Shared chat chrome ───────────────────────────────────────────
function ChatHeader({ name, online = true, compact = false, onBack }: { name: string; online?: boolean; compact?: boolean; onBack?: () => void }) {
  return (
    <div style={{ padding: compact ? '10px 12px' : '12px 16px', borderBottom: `1px solid ${BORDER}`, background: CARD, display: 'flex', alignItems: 'center', gap: compact ? 8 : 10, flexShrink: 0 }}>
      {onBack && (
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 4, marginLeft: -4 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke={TEXT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      )}
      <Av name={name} size={compact ? 32 : 38} online={online} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: compact ? 14 : 15, fontWeight: 600, color: TEXT }}>{name}</div>
        <div style={{ fontSize: 12, color: online ? SUCCESS : MUTED, display: 'flex', alignItems: 'center', gap: 4 }}>
          {online && <span style={{ width: 6, height: 6, borderRadius: '50%', background: SUCCESS, display: 'inline-block' }} />}
          <span>Active now</span>
        </div>
      </div>
      {[
        <svg key="ph" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke={MUTED} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
        <svg key="vi" width="18" height="18" viewBox="0 0 24 24" fill="none"><polygon points="23,7 16,12 23,17 23,7" stroke={MUTED} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><rect x="1" y="5" width="15" height="14" rx="2" stroke={MUTED} strokeWidth="1.8"/></svg>,
        <svg key="mo" width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="5" r="1" stroke={MUTED} strokeWidth="2"/><circle cx="12" cy="12" r="1" stroke={MUTED} strokeWidth="2"/><circle cx="12" cy="19" r="1" stroke={MUTED} strokeWidth="2"/></svg>,
      ].map((icon, i) => (
        <button key={i} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: '50%', color: MUTED }}>
          {icon}
        </button>
      ))}
    </div>
  )
}

function ThreadArea({ children, compact = false }: { children: React.ReactNode; compact?: boolean }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: compact ? '12px' : '16px', display: 'flex', flexDirection: 'column', gap: 0, background: BG }}>
      {children}
    </div>
  )
}

// ─── Left sidebar (narrow icon rail, matches desktop layout) ──────
function IconSidebar() {
  const items = [
    <svg key="h" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21 15H7L3 21V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    <svg key="c" width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
    <svg key="e" width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
    <svg key="p" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/></svg>,
  ]
  return (
    <div style={{ width: 70, background: CARD, borderRight: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0', gap: 4, flexShrink: 0 }}>
      <div style={{ width: 38, height: 38, borderRadius: 11, background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 15H7L3 21V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
      </div>
      {items.map((icon, i) => (
        <div key={i} style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: i === 0 ? PRIMARY : MUTED, background: i === 0 ? 'rgba(8,102,255,0.08)' : 'transparent' }}>
          {icon}
        </div>
      ))}
      <div style={{ marginTop: 'auto' }}><Av name="Taylor Reeves" size={34} online /></div>
    </div>
  )
}

// ─── Abbreviated chat list panel ──────────────────────────────────
function ChatListCol({ compact = false }: { compact?: boolean }) {
  const convos = [
    { name: 'Jordan Kim',   preview: 'Hey! Want to catch up?',          unread: 2,  time: '2m' },
    { name: 'Design Guild', preview: 'Alex: Check this out 🔥',          unread: 0,  time: '1h' },
    { name: 'Maria Garcia', preview: 'Thanks for sharing!',               unread: 0,  time: '3h' },
  ]
  return (
    <div style={{ width: compact ? 280 : 320, borderRight: `1px solid ${BORDER}`, flexShrink: 0, display: 'flex', flexDirection: 'column', background: CARD }}>
      <div style={{ padding: '12px', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ background: BG, borderRadius: 10, padding: '7px 12px', display: 'flex', gap: 7, alignItems: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke={MUTED} strokeWidth="1.8"/><path d="M21 21l-4.35-4.35" stroke={MUTED} strokeWidth="1.8" strokeLinecap="round"/></svg>
          <span style={{ fontSize: 13, color: MUTED }}>Search conversations</span>
        </div>
      </div>
      {convos.map((c, i) => (
        <div key={c.name} style={{ display: 'flex', gap: 10, padding: '11px 14px', borderBottom: `1px solid ${BORDER}`, background: i === 0 ? 'rgba(8,102,255,0.04)' : 'transparent', cursor: 'pointer', alignItems: 'center' }}>
          <Av name={c.name} size={42} online={i === 0} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, fontWeight: i === 0 ? 700 : 600, color: TEXT }}>{c.name}</span>
              <span style={{ fontSize: 12, color: MUTED }}>{c.time}</span>
            </div>
            <div style={{ fontSize: 13, color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{c.preview}</div>
          </div>
          {c.unread > 0 && <span style={{ background: GRAD, color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 9999, minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{c.unread}</span>}
        </div>
      ))}
    </div>
  )
}

// ─── Shell wrapper ────────────────────────────────────────────────
function ChatShell({ bp, children }: { bp: Breakpoint; children: React.ReactNode }) {
  const isDesktop = bp === 'desktop'
  const isTablet  = bp === 'tablet'
  const isMobile  = bp === 'mobile'
  return (
    <div style={{ display: 'flex', height: '100%', background: BG }}>
      {isDesktop && <IconSidebar />}
      {!isMobile  && <ChatListCol compact={isTablet} />}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
        {children}
      </div>
    </div>
  )
}

// ─── Bottom tab bar (mobile) ──────────────────────────────────────
function BottomBar() {
  return (
    <div style={{ height: 56, background: CARD, borderTop: `1px solid ${BORDER}`, display: 'flex', flexShrink: 0 }}>
      {['Chat','Explore','Communities','Profile'].map((t, i) => (
        <div key={t} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, color: i === 0 ? PRIMARY : MUTED }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: i === 0 ? 'rgba(8,102,255,0.12)' : BORDER, opacity: 0.65 }} />
          <span style={{ fontSize: 9, fontWeight: i === 0 ? 700 : 400 }}>{t}</span>
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 1. EMOJI PICKER
// ═══════════════════════════════════════════════════════════════════
const EMOJI_DATA: Record<string, { icon: string; emojis: string[] }> = {
  smileys:  { icon: '😀', emojis: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤔','🫠'] },
  gestures: { icon: '👋', emojis: ['👋','🤚','✋','🖐','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','🤲','🙏','💪','🦾','🖕','🤜'] },
  hearts:   { icon: '❤️', emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','🫀','❤️‍🔥','❤️‍🩹','💯','✨','⭐','🌟','💫','⚡','🔥','🌈','🎉'] },
  objects:  { icon: '🎉', emojis: ['🎉','🎊','🎈','🎀','🎁','🏆','🥇','📱','💻','🎮','🎧','📷','🎵','🎹','🎸','🎤','📚','✏️','🔑','💡','🚀','🌍','🍕','🍔','🍰','☕','🍺','🎂','🧁','🍾'] },
}

function EmojiPicker({ onSelect, compact = false }: { onSelect: (e: string) => void; compact?: boolean }) {
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('smileys')
  const cats = Object.keys(EMOJI_DATA)

  const visible = search
    ? Object.values(EMOJI_DATA).flatMap(c => c.emojis).filter(e => e.includes(search))
    : EMOJI_DATA[cat]?.emojis ?? []

  return (
    <div style={{ background: CARD, borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: '0 8px 32px rgba(0,0,0,0.16)', width: compact ? 280 : 320, overflow: 'hidden' }}>
      {/* Search */}
      <div style={{ padding: '10px 12px', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ display: 'flex', gap: 8, background: BG, borderRadius: 10, padding: '7px 12px', alignItems: 'center' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke={MUTED} strokeWidth="1.8"/><path d="M21 21l-4.35-4.35" stroke={MUTED} strokeWidth="1.8" strokeLinecap="round"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search emoji…" style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: TEXT, fontFamily: 'inherit', flex: 1 }} />
        </div>
      </div>

      {/* Category tabs */}
      {!search && (
        <div style={{ display: 'flex', padding: '6px 8px', borderBottom: `1px solid ${BORDER}`, gap: 2 }}>
          {cats.map(c => (
            <button key={c} onClick={() => setCat(c)} title={c}
              style={{ flex: 1, background: cat === c ? 'rgba(8,102,255,0.08)' : 'transparent', border: 'none', borderRadius: 8, padding: '6px 4px', fontSize: 18, cursor: 'pointer', transition: 'background 0.1s' }}>
              {EMOJI_DATA[c].icon}
            </button>
          ))}
        </div>
      )}

      {/* Emoji grid */}
      <div style={{ padding: '8px', display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 2, maxHeight: 200, overflowY: 'auto' }}>
        {visible.map((emoji, i) => (
          <button key={i} onClick={() => onSelect(emoji)} style={{ background: 'transparent', border: 'none', borderRadius: 8, padding: '6px 4px', fontSize: 20, cursor: 'pointer', lineHeight: 1, transition: 'background 0.08s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = BG}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
            {emoji}
          </button>
        ))}
        {visible.length === 0 && <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 20, fontSize: 13, color: MUTED }}>No emoji found</div>}
      </div>

      {/* Recently used row */}
      {!search && (
        <div style={{ padding: '6px 8px 8px', borderTop: `1px solid ${BORDER}` }}>
          <div style={{ fontSize: 10, color: MUTED, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4, paddingLeft: 4 }}>Recently used</div>
          <div style={{ display: 'flex', gap: 2 }}>
            {['😂','👍','❤️','🔥','😭','🙏','😍','🤣'].map(e => (
              <button key={e} onClick={() => onSelect(e)} style={{ background: 'transparent', border: 'none', borderRadius: 8, padding: '4px', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>{e}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function EmojiPickerDemo({ bp }: { bp: Breakpoint }) {
  const [picked, setPicked] = useState('')
  const [open, setOpen] = useState(true)
  const isMobile = bp === 'mobile'
  const compact = bp !== 'desktop'

  return (
    <ChatShell bp={bp}>
      <ChatHeader name="Jordan Kim" online compact={compact} onBack={isMobile ? () => {} : undefined} />
      <ThreadArea compact={compact}>
        <Bubble sent={false} text="What are you thinking? 🤔" time="2:30 PM" compact={compact} />
        <Bubble sent text="Working on the new chat features 💬" time="2:31 PM" read compact={compact} />
        <Bubble sent={false} text="Sounds cool! Send me some emoji when you're done 😄" time="2:32 PM" compact={compact} />
        {picked && <Bubble sent text={picked} time="2:33 PM" compact={compact} />}
      </ThreadArea>

      {/* Input bar + emoji picker anchored above it */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {/* Emoji picker anchors above input */}
        {open && (
          <div style={{ position: 'absolute', bottom: '100%', left: isMobile ? 0 : 8, marginBottom: 6, zIndex: 50 }}>
            <EmojiPicker compact={compact} onSelect={e => { setPicked(e); setOpen(false) }} />
          </div>
        )}
        {/* Input bar */}
        <div style={{ padding: compact ? '8px 12px' : '10px 16px', borderTop: `1px solid ${BORDER}`, background: CARD, display: 'flex', alignItems: 'center', gap: compact ? 6 : 8 }}>
          <button onClick={() => setOpen(o => !o)} style={{ background: open ? 'rgba(8,102,255,0.08)' : 'none', border: open ? `1.5px solid rgba(8,102,255,0.2)` : 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke={open ? PRIMARY : MUTED} strokeWidth="1.8"/><path d="M8 13s1.5 2 4 2 4-2 4-2" stroke={open ? PRIMARY : MUTED} strokeWidth="1.8" strokeLinecap="round"/><line x1="9" y1="9" x2="9.01" y2="9" stroke={open ? PRIMARY : MUTED} strokeWidth="2" strokeLinecap="round"/><line x1="15" y1="9" x2="15.01" y2="9" stroke={open ? PRIMARY : MUTED} strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
          <div style={{ flex: 1, background: BG, borderRadius: 9999, padding: compact ? '7px 12px' : '9px 14px', display: 'flex', gap: 8, alignItems: 'center', border: `1.5px solid ${BORDER}` }}>
            <span style={{ fontSize: compact ? 13 : 15, color: MUTED }}>Aa</span>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2a10 10 0 11-8.66 15M12 2v10m0 0l4-4m-4 4l-4-4" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </div>
        </div>
      </div>
      {isMobile && <BottomBar />}
    </ChatShell>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 2. MESSAGE CONTEXT MENU
// ═══════════════════════════════════════════════════════════════════
const CTX_ITEMS_SENT     = ['React','Reply','Copy','Edit','Forward','Pin','Delete']
const CTX_ITEMS_RECEIVED = ['React','Reply','Copy','Forward','Pin']
const CTX_ICONS: Record<string, React.ReactNode> = {
  React:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.7"/><path d="M8 13s1.5 2 4 2 4-2 4-2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><line x1="9" y1="9" x2="9.01" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="15" y1="9" x2="15.01" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  Reply:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><polyline points="9,17 4,12 9,7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/><path d="M20 18v-2a4 4 0 00-4-4H4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>,
  Copy:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.7"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>,
  Edit:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>,
  Forward: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><polyline points="15,17 20,12 15,7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 18v-2a4 4 0 014-4h12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>,
  Pin:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 17v5M8.5 7.5l-2-2a1 1 0 010-1.41l1.41-1.41a1 1 0 011.41 0l.5.5M8.5 7.5L12 4l7 7-3.5 3.5M8.5 7.5L5 11l3 3 4-1.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Delete:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><polyline points="3,6 5,6 21,6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>,
}

// Floating popover (desktop/tablet)
function ContextMenuPopover({ sent, onClose }: { sent: boolean; onClose: () => void }) {
  const items = sent ? CTX_ITEMS_SENT : CTX_ITEMS_RECEIVED
  return (
    <div style={{ background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, boxShadow: '0 8px 32px rgba(0,0,0,0.16)', overflow: 'hidden', minWidth: 180 }}>
      {items.map((item, i) => (
        <button key={item} onClick={onClose}
          style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 500, color: item === 'Delete' ? ERROR : TEXT, borderBottom: i < items.length - 1 ? `1px solid ${BORDER}` : 'none', textAlign: 'left', transition: 'background 0.1s' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = BG}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
          <span style={{ color: item === 'Delete' ? ERROR : MUTED }}>{CTX_ICONS[item]}</span>
          {item}
        </button>
      ))}
    </div>
  )
}

// Bottom sheet (mobile)
function ContextMenuBottomSheet({ sent, onClose }: { sent: boolean; onClose: () => void }) {
  const items = sent ? CTX_ITEMS_SENT : CTX_ITEMS_RECEIVED
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 100 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: CARD, borderRadius: '20px 20px 0 0', paddingBottom: 20 }}>
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: BORDER, margin: '10px auto 14px' }} />
        {/* Quick reactions row */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 14, paddingBottom: 14, borderBottom: `1px solid ${BORDER}` }}>
          {['👍','❤️','😂','😮','😢','🙏'].map(e => (
            <button key={e} onClick={onClose} style={{ fontSize: 28, background: BG, border: `1px solid ${BORDER}`, borderRadius: 12, width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>{e}</button>
          ))}
        </div>
        {items.map((item, i) => (
          <button key={item} onClick={onClose}
            style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '13px 20px', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, fontWeight: 500, color: item === 'Delete' ? ERROR : TEXT, textAlign: 'left' }}>
            <span style={{ color: item === 'Delete' ? ERROR : MUTED }}>{CTX_ICONS[item]}</span>
            {item}
          </button>
        ))}
      </div>
    </div>
  )
}

function ContextMenuDemo({ bp }: { bp: Breakpoint }) {
  const [open, setOpen] = useState(true)
  const [sentMenu, setSentMenu] = useState(false)
  const isMobile = bp === 'mobile'
  const compact = bp !== 'desktop'

  return (
    <ChatShell bp={bp}>
      <ChatHeader name="Jordan Kim" online compact={compact} onBack={isMobile ? () => {} : undefined} />
      <ThreadArea compact={compact}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-end' }}>
          <Av name="Jordan Kim" size={28} />
          <div style={{ position: 'relative' }}>
            <div onContextMenu={e => { e.preventDefault(); setOpen(true); setSentMenu(false) }}
              style={{ background: RECV_BG, borderRadius: RECV_R, padding: compact ? '8px 12px' : '10px 14px', maxWidth: compact ? 190 : 250, cursor: 'context-menu' }}>
              <p style={{ margin: 0, fontSize: compact ? 13 : 15, color: TEXT }}>Hey! Want to catch up this weekend? 👋</p>
              <span style={{ fontSize: 11, color: MUTED, marginTop: 3, display: 'block' }}>2:30 PM</span>
            </div>
            {/* Popover — received message */}
            {open && !sentMenu && !isMobile && (
              <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 50, marginTop: 4 }}>
                <ContextMenuPopover sent={false} onClose={() => setOpen(false)} />
              </div>
            )}
          </div>
        </div>

        <Bubble sent={false} text="Let me know when you're free 🙂" time="2:31 PM" compact={compact} />

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6, position: 'relative' }}>
          <div onContextMenu={e => { e.preventDefault(); setOpen(true); setSentMenu(true) }}
            style={{ background: GRAD_MSG, borderRadius: SEND_R, padding: compact ? '8px 12px' : '10px 14px', maxWidth: compact ? 190 : 250, cursor: 'context-menu', color: '#fff' }}>
            <p style={{ margin: 0, fontSize: compact ? 13 : 15 }}>Sounds great! How about Saturday?</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4, marginTop: 4 }}>
              <span style={{ fontSize: 11, opacity: 0.7 }}>2:32 PM</span>
            </div>
          </div>
          {/* Popover — sent message, anchors right */}
          {open && sentMenu && !isMobile && (
            <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 50, marginTop: 4 }}>
              <ContextMenuPopover sent onClose={() => setOpen(false)} />
            </div>
          )}
        </div>

        <div style={{ marginTop: 8, padding: '8px 12px', background: CARD, borderRadius: 10, border: `1px solid ${BORDER}`, fontSize: 12, color: MUTED, display: 'flex', gap: 8 }}>
          <span>💡</span>
          <span>{isMobile ? 'Long-press a bubble to open the bottom sheet' : 'Right-click a bubble to open its context menu'}</span>
        </div>
      </ThreadArea>

      <div style={{ padding: compact ? '8px 12px' : '10px 16px', borderTop: `1px solid ${BORDER}`, background: CARD, display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><path d="M8 13s1.5 2 4 2 4-2 4-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="9" y1="9" x2="9.01" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="15" y1="9" x2="15.01" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></div>
        <div style={{ flex: 1, background: BG, borderRadius: 9999, padding: compact ? '7px 12px' : '9px 14px', fontSize: compact ? 13 : 15, color: MUTED, border: `1.5px solid ${BORDER}` }}>Aa</div>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 19V5m0 0l-7 7m7-7l7 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
      </div>

      {/* Mobile bottom sheet overlaid */}
      {isMobile && open && <ContextMenuBottomSheet sent={sentMenu} onClose={() => setOpen(false)} />}
      {isMobile && <BottomBar />}
    </ChatShell>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 3. REACTIONS
// ═══════════════════════════════════════════════════════════════════
const QUICK_REACT = ['👍','❤️','😂','😮','😢','🙏']

function ReactionPickerRow({ onPick, onMore }: { onPick: (e: string) => void; onMore: () => void }) {
  return (
    <div style={{ background: CARD, borderRadius: 9999, border: `1px solid ${BORDER}`, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', padding: '6px 10px', display: 'flex', gap: 4, alignItems: 'center' }}>
      {QUICK_REACT.map(e => (
        <button key={e} onClick={() => onPick(e)}
          style={{ fontSize: 22, background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 8, padding: '4px 6px', lineHeight: 1, transition: 'transform 0.1s' }}
          onMouseEnter={e2 => { (e2.currentTarget as HTMLElement).style.transform = 'scale(1.3)'; (e2.currentTarget as HTMLElement).style.background = BG }}
          onMouseLeave={e2 => { (e2.currentTarget as HTMLElement).style.transform = 'scale(1)'; (e2.currentTarget as HTMLElement).style.background = 'transparent' }}>
          {e}
        </button>
      ))}
      <button onClick={onMore} style={{ width: 30, height: 30, borderRadius: '50%', background: BG, border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke={MUTED} strokeWidth="1.8"/><path d="M12 8v8M8 12h8" stroke={MUTED} strokeWidth="1.8" strokeLinecap="round"/></svg>
      </button>
    </div>
  )
}

function ReactionsDemo({ bp }: { bp: Breakpoint }) {
  const [pickerMsg, setPickerMsg] = useState<string | null>('recv1')
  const [myReactions, setMyReactions] = useState<Record<string, string[]>>({ recv1: [] })
  const compact = bp !== 'desktop'
  const isMobile = bp === 'mobile'

  const addReaction = (msgId: string, emoji: string) => {
    setMyReactions(r => ({ ...r, [msgId]: [...(r[msgId] ?? []).filter(e => e !== emoji), emoji] }))
    setPickerMsg(null)
  }

  return (
    <ChatShell bp={bp}>
      <ChatHeader name="Jordan Kim" online compact={compact} onBack={isMobile ? () => {} : undefined} />
      <ThreadArea compact={compact}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 28 }}>
          <Av name="Jordan Kim" size={28} />
          <div style={{ position: 'relative' }}>
            {/* Reaction picker floats above the bubble */}
            {pickerMsg === 'recv1' && (
              <div style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: 6, zIndex: 50 }}>
                <ReactionPickerRow onPick={e => addReaction('recv1', e)} onMore={() => setPickerMsg(null)} />
              </div>
            )}
            <div onClick={() => setPickerMsg(p => p === 'recv1' ? null : 'recv1')}
              style={{ background: RECV_BG, borderRadius: RECV_R, padding: compact ? '8px 12px' : '10px 14px', maxWidth: compact ? 190 : 260, cursor: 'pointer', position: 'relative' }}>
              <p style={{ margin: 0, fontSize: compact ? 13 : 15, color: TEXT }}>Hey! Want to catch up? 👋</p>
              <span style={{ fontSize: 11, color: MUTED, marginTop: 3, display: 'block' }}>2:30 PM</span>
            </div>
            {/* Attached reactions */}
            {myReactions.recv1.length > 0 && (
              <div style={{ position: 'absolute', bottom: -16, left: 4, display: 'flex', gap: 4 }}>
                {myReactions.recv1.map(e => (
                  <div key={e} style={{ background: 'rgba(8,102,255,0.1)', border: `1.5px solid ${PRIMARY}`, borderRadius: 9999, padding: '2px 7px', fontSize: 13, cursor: 'pointer' }}>{e}</div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Already reacted bubbles */}
        <Bubble sent={false} text="Let me know when you're free! 🙂" time="2:31 PM"
          reactions={[{ emoji: '👍', count: 1, mine: true }, { emoji: '❤️', count: 3, mine: false }]}
          compact={compact} />

        <Bubble sent text="Saturday works perfectly! See you then 🎉" time="2:32 PM" read
          reactions={[{ emoji: '😂', count: 2, mine: false }]}
          compact={compact} />

        <div style={{ marginTop: 8, padding: '8px 12px', background: CARD, borderRadius: 10, border: `1px solid ${BORDER}`, fontSize: 12, color: MUTED }}>
          <span>💡 Tap the first bubble to toggle the quick-react row</span>
        </div>
      </ThreadArea>

      <div style={{ padding: compact ? '8px 12px' : '10px 16px', borderTop: `1px solid ${BORDER}`, background: CARD, display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
        <div style={{ flex: 1, background: BG, borderRadius: 9999, padding: compact ? '7px 12px' : '9px 14px', fontSize: compact ? 13 : 15, color: MUTED, border: `1.5px solid ${BORDER}` }}>Aa</div>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 19V5m0 0l-7 7m7-7l7 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
      </div>
      {isMobile && <BottomBar />}
    </ChatShell>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 4. REPLY PREVIEW
// ═══════════════════════════════════════════════════════════════════
function ReplyBar({ name, text, onCancel }: { name: string; text: string; onCancel: () => void }) {
  return (
    <div style={{ padding: '8px 14px', borderTop: `1px solid ${BORDER}`, background: 'rgba(8,102,255,0.04)', display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 3, height: 36, background: GRAD, borderRadius: 9999, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: PRIMARY }}>{name}</div>
        <div style={{ fontSize: 12, color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{text}</div>
      </div>
      <button onClick={onCancel} style={{ background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke={MUTED} strokeWidth="2.5" strokeLinecap="round"/></svg>
      </button>
    </div>
  )
}

function ReplyDemo({ bp }: { bp: Breakpoint }) {
  const [replying, setReplying] = useState(true)
  const compact = bp !== 'desktop'
  const isMobile = bp === 'mobile'

  return (
    <ChatShell bp={bp}>
      <ChatHeader name="Jordan Kim" online compact={compact} onBack={isMobile ? () => {} : undefined} />
      <ThreadArea compact={compact}>
        {/* Original messages */}
        <Bubble sent={false} text="Hey! Did you see the new design system updates?" time="2:28 PM" compact={compact} />
        <Bubble sent text="Yes! The gradient looks amazing 🔥" time="2:29 PM" read compact={compact} />

        {/* A received message we're replying to */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-end' }}>
          <Av name="Jordan Kim" size={28} />
          <div style={{ background: RECV_BG, borderRadius: RECV_R, padding: compact ? '8px 12px' : '10px 14px', maxWidth: compact ? 190 : 260 }}>
            <p style={{ margin: 0, fontSize: compact ? 13 : 15, color: TEXT }}>The new bubble radii are so much better! What do you think?</p>
            <span style={{ fontSize: 11, color: MUTED, marginTop: 3, display: 'block' }}>2:30 PM</span>
          </div>
        </div>

        {/* A reply that was already sent — shows the quote above it */}
        <Bubble sent text="Totally agree! The 18px radius feels much more polished 👌"
          time="2:31 PM" read compact={compact}
          replyTo={{ name: 'Jordan Kim', text: 'The new bubble radii are so much better! What do you think?' }} />

        <Bubble sent={false} text="Right? Can't wait to ship this 🚀" time="2:32 PM" compact={compact} />
      </ThreadArea>

      {/* Reply bar + input */}
      {replying && (
        <ReplyBar
          name="Jordan Kim"
          text="Right? Can't wait to ship this 🚀"
          onCancel={() => setReplying(false)}
        />
      )}
      <div style={{ padding: compact ? '8px 12px' : '10px 16px', borderTop: replying ? 'none' : `1px solid ${BORDER}`, background: CARD, display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
        <div style={{ flex: 1, background: replying ? 'rgba(8,102,255,0.04)' : BG, borderRadius: 9999, padding: compact ? '7px 12px' : '9px 14px', fontSize: compact ? 13 : 15, color: replying ? TEXT : MUTED, border: `1.5px solid ${replying ? PRIMARY : BORDER}`, display: 'flex', gap: 6, alignItems: 'center' }}>
          {replying && <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><polyline points="9,17 4,12 9,7" stroke={PRIMARY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M20 18v-2a4 4 0 00-4-4H4" stroke={PRIMARY} strokeWidth="2" strokeLinecap="round"/></svg>}
          {replying ? 'Replying…' : 'Aa'}
        </div>
        {!replying && <button onClick={() => setReplying(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: PRIMARY, fontFamily: 'inherit', fontWeight: 600 }}>↩ Reply</button>}
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 19V5m0 0l-7 7m7-7l7 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
      </div>
      {isMobile && <BottomBar />}
    </ChatShell>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 5. EDIT / UNSEND
// ═══════════════════════════════════════════════════════════════════
function EditUnsendDemo({ bp }: { bp: Breakpoint }) {
  const [editing, setEditing] = useState(true)
  const [editText, setEditText] = useState('Sounds great! Saturday works.')
  const [saved, setSaved] = useState(false)
  const compact = bp !== 'desktop'
  const isMobile = bp === 'mobile'

  return (
    <ChatShell bp={bp}>
      <ChatHeader name="Jordan Kim" online compact={compact} onBack={isMobile ? () => {} : undefined} />
      <ThreadArea compact={compact}>
        <Bubble sent={false} text="So are we meeting Saturday?" time="2:28 PM" compact={compact} />

        {/* Editing state */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: editing ? 4 : 6 }}>
          <div style={{ background: saved ? GRAD_MSG : 'rgba(8,102,255,0.06)', border: `2px solid ${PRIMARY}`, borderRadius: SEND_R, padding: compact ? '8px 12px' : '10px 14px', maxWidth: compact ? 210 : 290, boxShadow: editing ? '0 0 0 3px rgba(8,102,255,0.12)' : 'none' }}>
            {editing ? (
              <>
                <input value={editText} onChange={e => setEditText(e.target.value)}
                  autoFocus
                  style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: compact ? 13 : 15, color: TEXT, fontFamily: 'inherit', width: '100%', lineHeight: 1.5 }} />
                <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => setEditing(false)} style={{ background: 'rgba(0,0,0,0.07)', color: TEXT, border: 'none', borderRadius: 9999, padding: '4px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                  <button onClick={() => { setSaved(true); setEditing(false) }} style={{ background: GRAD, color: '#fff', border: 'none', borderRadius: 9999, padding: '4px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
                </div>
              </>
            ) : (
              <>
                <p style={{ margin: 0, fontSize: compact ? 13 : 15, color: '#fff' }}>{editText}</p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4, marginTop: 4 }}>
                  <span style={{ fontSize: 10, opacity: 0.7, color: '#fff' }}>edited</span>
                  <span style={{ fontSize: 11, opacity: 0.7, color: '#fff' }}>2:29 PM</span>
                </div>
              </>
            )}
          </div>
        </div>
        {editing && (
          <div style={{ textAlign: 'right', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: PRIMARY, fontWeight: 600 }}>✎ Editing message</span>
          </div>
        )}

        {/* Deleted / unsent message */}
        <Bubble sent deleted compact={compact} />
        <Bubble sent={false} text="No worries! Saturday at 3pm?" time="2:30 PM" compact={compact} />

        <div style={{ padding: '8px 12px', background: CARD, borderRadius: 10, border: `1px solid ${BORDER}`, fontSize: 12, color: MUTED, marginTop: 4 }}>
          <span>💡 Top bubble is in editing state. Middle is a deleted/unsent message placeholder.</span>
        </div>
      </ThreadArea>

      <div style={{ padding: compact ? '8px 12px' : '10px 16px', borderTop: `1px solid ${BORDER}`, background: CARD, display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
        <div style={{ flex: 1, background: BG, borderRadius: 9999, padding: compact ? '7px 12px' : '9px 14px', fontSize: compact ? 13 : 15, color: MUTED, border: `1.5px solid ${BORDER}` }}>Aa</div>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 19V5m0 0l-7 7m7-7l7 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
      </div>
      {isMobile && <BottomBar />}
    </ChatShell>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 6. ATTACHMENT PICKER
// ═══════════════════════════════════════════════════════════════════
const ATTACH_OPTIONS = [
  { icon: '🖼️', label: 'Photo & Video', color: 'rgba(139,92,246,0.12)', accent: '#8B5CF6' },
  { icon: '📷', label: 'Camera',        color: 'rgba(8,102,255,0.1)',   accent: PRIMARY  },
  { icon: '📎', label: 'File',          color: 'rgba(247,185,40,0.12)', accent: '#F7B928' },
  { icon: '📍', label: 'Location',      color: 'rgba(49,162,76,0.12)',  accent: SUCCESS  },
]

function AttachPicker({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ background: CARD, borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: '0 8px 32px rgba(0,0,0,0.14)', padding: 14, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, width: 220 }}>
      {ATTACH_OPTIONS.map(o => (
        <button key={o.label} onClick={onClose}
          style={{ background: o.color, border: `1.5px solid ${o.accent}20`, borderRadius: 14, padding: '14px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, cursor: 'pointer', transition: 'transform 0.1s' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1)'}>
          <span style={{ fontSize: 28 }}>{o.icon}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: o.accent }}>{o.label}</span>
        </button>
      ))}
    </div>
  )
}

function AttachmentDemo({ bp }: { bp: Breakpoint }) {
  const [open, setOpen] = useState(true)
  const compact = bp !== 'desktop'
  const isMobile = bp === 'mobile'

  return (
    <ChatShell bp={bp}>
      <ChatHeader name="Jordan Kim" online compact={compact} onBack={isMobile ? () => {} : undefined} />
      <ThreadArea compact={compact}>
        <Bubble sent={false} text="Can you share that photo from last time? 📸" time="2:30 PM" compact={compact} />
        <Bubble sent text="Sure, one sec!" time="2:31 PM" read compact={compact} />
      </ThreadArea>

      {/* Attach picker anchors above the input */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {open && (
          <div style={{ position: 'absolute', bottom: '100%', left: isMobile ? 8 : 50, marginBottom: 6, zIndex: 50 }}>
            {isMobile ? (
              /* Mobile: full-width bottom grid */
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '14px 14px 0 0', padding: 16, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, width: 'calc(100vw - 16px)', position: 'fixed', bottom: 56, left: 8 }}>
                {ATTACH_OPTIONS.map(o => (
                  <button key={o.label} onClick={() => setOpen(false)} style={{ background: o.color, border: 'none', borderRadius: 14, padding: '16px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <span style={{ fontSize: 28 }}>{o.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: o.accent }}>{o.label}</span>
                  </button>
                ))}
              </div>
            ) : <AttachPicker onClose={() => setOpen(false)} />}
          </div>
        )}
        <div style={{ padding: compact ? '8px 12px' : '10px 16px', borderTop: `1px solid ${BORDER}`, background: CARD, display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><path d="M8 13s1.5 2 4 2 4-2 4-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="9" y1="9" x2="9.01" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="15" y1="9" x2="15.01" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></div>
          <div style={{ flex: 1, background: BG, borderRadius: 9999, padding: compact ? '7px 12px' : '9px 14px', fontSize: compact ? 13 : 15, color: MUTED, border: `1.5px solid ${BORDER}`, display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Aa</span>
            <button onClick={() => setOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: open ? PRIMARY : MUTED }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 19V5m0 0l-7 7m7-7l7 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
        </div>
      </div>
      {isMobile && <BottomBar />}
    </ChatShell>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 7. IMAGE BUBBLE + LIGHTBOX
// ═══════════════════════════════════════════════════════════════════
// Simulated photo placeholders with gradient scenes
const PHOTOS = [
  { bg: 'linear-gradient(135deg, #00B2FF 0%, #7B2FBE 100%)', label: '🏙️ City', aspect: 4/3 },
  { bg: 'linear-gradient(145deg, #F7B928 0%, #FA383E 100%)', label: '🌅 Sunset', aspect: 3/2 },
  { bg: 'linear-gradient(135deg, #31A24C 0%, #00B2FF 100%)', label: '🌿 Nature', aspect: 1 },
]

function ImageBubble({ sent, photoIdx = 0, time = '2:32 PM', onOpen, compact = false }: {
  sent: boolean; photoIdx?: number; time?: string; onOpen?: () => void; compact?: boolean
}) {
  const photo = PHOTOS[photoIdx % PHOTOS.length]
  const maxW = compact ? 160 : 220
  const h = maxW / photo.aspect
  return (
    <div style={{ display: 'flex', justifyContent: sent ? 'flex-end' : 'flex-start', marginBottom: 6 }}>
      <div onClick={onOpen} style={{ borderRadius: sent ? SEND_R : RECV_R, overflow: 'hidden', maxWidth: maxW, cursor: onOpen ? 'pointer' : 'default', position: 'relative', boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
        <div style={{ width: maxW, height: h, background: photo.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 32 }}>{photo.label.split(' ')[0]}</span>
        </div>
        {/* Timestamp overlaid bottom-right, Messenger-style */}
        <div style={{ position: 'absolute', bottom: 6, right: 8, display: 'flex', alignItems: 'center', gap: 3 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: 600, textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>{time}</span>
          {sent && <svg width="14" height="10" viewBox="0 0 16 11" fill="none"><path d="M1 5.5l4 4L15 1M5 9.5L9.5 5" stroke="rgba(255,255,255,0.8)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        </div>
      </div>
    </div>
  )
}

function ImageLightbox({ photoIdx, photos, onClose }: { photoIdx: number; photos: typeof PHOTOS; onClose: () => void }) {
  const [current, setCurrent] = useState(photoIdx)
  const photo = photos[current]
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 200, display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
        </button>
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{current + 1} / {photos.length}</span>
        <button style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>

      {/* Photo */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {/* Prev arrow */}
        {current > 0 && (
          <button onClick={() => setCurrent(c => c - 1)} style={{ position: 'absolute', left: 12, background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        )}
        <div style={{ width: '75%', aspectRatio: `${photo.aspect}`, background: photo.bg, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
          <span style={{ fontSize: 56 }}>{photo.label.split(' ')[0]}</span>
        </div>
        {/* Next arrow */}
        {current < photos.length - 1 && (
          <button onClick={() => setCurrent(c => c + 1)} style={{ position: 'absolute', right: 12, background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', padding: '14px 16px', flexShrink: 0 }}>
        {photos.map((p, i) => (
          <div key={i} onClick={() => setCurrent(i)} style={{ width: 52, height: 40, borderRadius: 8, background: p.bg, cursor: 'pointer', border: i === current ? '2.5px solid #fff' : '2.5px solid transparent', opacity: i === current ? 1 : 0.55, transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 14 }}>{p.label.split(' ')[0]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ImageBubbleDemo({ bp }: { bp: Breakpoint }) {
  const [lightbox, setLightbox] = useState<number | null>(null)
  const compact = bp !== 'desktop'
  const isMobile = bp === 'mobile'

  return (
    <ChatShell bp={bp}>
      <ChatHeader name="Jordan Kim" online compact={compact} onBack={isMobile ? () => {} : undefined} />
      <div style={{ flex: 1, overflowY: 'auto', padding: compact ? '12px' : '16px', background: BG, position: 'relative' }}>
        <Bubble sent={false} text="Check out these shots from the weekend! 📸" time="2:28 PM" compact={compact} />

        {/* Received image bubbles */}
        {[0, 1].map(i => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-end' }}>
            {i === 0 && <Av name="Jordan Kim" size={28} />}
            {i > 0 && <div style={{ width: 28 }} />}
            <ImageBubble sent={false} photoIdx={i} compact={compact} onOpen={() => setLightbox(i)} />
          </div>
        ))}

        <Bubble sent text="Wow those are gorgeous! 😍" time="2:31 PM" read compact={compact} />

        {/* Sent image bubble */}
        <ImageBubble sent photoIdx={2} compact={compact} onOpen={() => setLightbox(2)} />

        <div style={{ padding: '8px 12px', background: CARD, borderRadius: 10, border: `1px solid ${BORDER}`, fontSize: 12, color: MUTED, marginTop: 4 }}>
          <span>💡 Tap any photo to open the lightbox viewer</span>
        </div>

        {/* Lightbox */}
        {lightbox !== null && <ImageLightbox photoIdx={lightbox} photos={PHOTOS} onClose={() => setLightbox(null)} />}
      </div>
      <div style={{ padding: compact ? '8px 12px' : '10px 16px', borderTop: `1px solid ${BORDER}`, background: CARD, display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
        <div style={{ flex: 1, background: BG, borderRadius: 9999, padding: compact ? '7px 12px' : '9px 14px', fontSize: compact ? 13 : 15, color: MUTED, border: `1.5px solid ${BORDER}` }}>Aa</div>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 19V5m0 0l-7 7m7-7l7 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
      </div>
      {isMobile && <BottomBar />}
    </ChatShell>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 8. LINK PREVIEW CARD
// ═══════════════════════════════════════════════════════════════════
interface LinkMsg { sent: boolean; text: string; url: string; title: string; domain: string; description: string; accentColor: string; time: string }

function LinkBubble({ msg, compact = false }: { msg: LinkMsg; compact: boolean }) {
  const maxW = compact ? 220 : 300
  return (
    <div style={{ display: 'flex', justifyContent: msg.sent ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
      <div style={{ maxWidth: maxW, display: 'flex', flexDirection: 'column', gap: 0, alignItems: msg.sent ? 'flex-end' : 'flex-start' }}>
        {/* Text bubble */}
        <div style={{ background: msg.sent ? GRAD_MSG : RECV_BG, borderRadius: msg.sent ? '18px 18px 0 18px' : '18px 18px 18px 0', padding: compact ? '8px 12px' : '10px 14px', color: msg.sent ? '#fff' : TEXT }}>
          <p style={{ margin: 0, fontSize: compact ? 13 : 15 }}>{msg.text}</p>
        </div>
        {/* Link preview card — uses same card style, no border-radius break */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: msg.sent ? '0 0 4px 14px' : '0 0 14px 4px', overflow: 'hidden', width: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          {/* Preview image */}
          <div style={{ height: compact ? 70 : 90, background: `linear-gradient(135deg, ${msg.accentColor}66, ${msg.accentColor}33)`, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: `1px solid ${BORDER}` }}>
            <div style={{ width: 48, height: 48, borderRadius: 10, background: msg.accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
          <div style={{ padding: compact ? '8px 10px' : '10px 12px' }}>
            <div style={{ fontSize: compact ? 11 : 12, fontWeight: 700, color: msg.accentColor, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>{msg.domain}</div>
            <div style={{ fontSize: compact ? 12 : 13, fontWeight: 700, color: TEXT, marginBottom: 4, lineHeight: 1.3 }}>{msg.title}</div>
            <div style={{ fontSize: compact ? 11 : 12, color: MUTED, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{msg.description}</div>
          </div>
        </div>
        {/* Timestamp below */}
        <div style={{ display: 'flex', justifyContent: msg.sent ? 'flex-end' : 'flex-start', gap: 4, marginTop: 4 }}>
          <span style={{ fontSize: 11, color: MUTED }}>{msg.time}</span>
          {msg.sent && <svg width="14" height="10" viewBox="0 0 16 11" fill="none"><path d="M1 5.5l4 4L15 1M5 9.5L9.5 5" stroke={PRIMARY} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        </div>
      </div>
    </div>
  )
}

const LINK_MSGS: LinkMsg[] = [
  {
    sent: false, text: 'Check this out — great article on WebSockets 👇',
    url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebSocket',
    title: 'WebSocket API — MDN Web Docs',
    domain: 'developer.mozilla.org',
    description: 'The WebSocket object provides the API for creating and managing a WebSocket connection to a server, as well as for sending and receiving data on the connection.',
    accentColor: '#0866FF', time: '2:28 PM',
  },
  {
    sent: true, text: 'Nice! Here\'s the React guide I mentioned:',
    url: 'https://react.dev/learn',
    title: 'Quick Start – React',
    domain: 'react.dev',
    description: 'Welcome to the React documentation! This page will give you an introduction to the 80% of React concepts that you will use on a daily basis.',
    accentColor: '#61DAFB', time: '2:30 PM',
  },
]

function LinkPreviewDemo({ bp }: { bp: Breakpoint }) {
  const compact = bp !== 'desktop'
  const isMobile = bp === 'mobile'
  return (
    <ChatShell bp={bp}>
      <ChatHeader name="Jordan Kim" online compact={compact} onBack={isMobile ? () => {} : undefined} />
      <ThreadArea compact={compact}>
        <Bubble sent={false} text="Want some resources on real-time messaging?" time="2:27 PM" compact={compact} />
        <Bubble sent text="Yes please! Send them over 🙏" time="2:28 PM" read compact={compact} />
        {LINK_MSGS.map((msg, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-end', justifyContent: msg.sent ? 'flex-end' : 'flex-start' }}>
            {!msg.sent && <Av name="Jordan Kim" size={28} />}
            <LinkBubble msg={msg} compact={compact} />
          </div>
        ))}
      </ThreadArea>
      <div style={{ padding: compact ? '8px 12px' : '10px 16px', borderTop: `1px solid ${BORDER}`, background: CARD, display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
        <div style={{ flex: 1, background: BG, borderRadius: 9999, padding: compact ? '7px 12px' : '9px 14px', fontSize: compact ? 13 : 15, color: MUTED, border: `1.5px solid ${BORDER}` }}>Aa</div>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 19V5m0 0l-7 7m7-7l7 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
      </div>
      {isMobile && <BottomBar />}
    </ChatShell>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 9. VOICE NOTE EXTRAS
// ═══════════════════════════════════════════════════════════════════
function WaveformScrubber({ compact, progress, onSeek }: { compact: boolean; progress: number; onSeek: (p: number) => void }) {
  const bars = 28
  const ref = useRef<HTMLDivElement>(null)
  const HEIGHTS = Array.from({ length: bars }, (_, i) => {
    const base = [3,5,8,12,10,14,16,18,14,10,8,12,16,20,18,14,10,8,12,16,14,10,8,6,4,8,12,6]
    return (base[i % base.length] ?? 8)
  })

  const handleClick = (e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    onSeek(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)))
  }

  return (
    <div ref={ref} onClick={handleClick} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: compact ? 1.5 : 2, cursor: 'pointer', position: 'relative', height: 28 }}>
      {HEIGHTS.map((h, i) => {
        const pct = i / bars
        const played = pct <= progress
        return (
          <div key={i} style={{ width: compact ? 2 : 2.5, height: h, borderRadius: 9999, background: played ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)', transition: 'background 0.1s', flexShrink: 0 }} />
        )
      })}
      {/* Scrubber dot */}
      <div style={{ position: 'absolute', left: `${progress * 100}%`, top: '50%', transform: 'translate(-50%, -50%)', width: 14, height: 14, borderRadius: '50%', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', pointerEvents: 'none', transition: 'left 0.1s' }} />
    </div>
  )
}

function VoiceNotePlus({ compact }: { compact: boolean }) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0.38)
  const [speed, setSpeed] = useState<1 | 1.5 | 2>(1)
  const SPEEDS: (1 | 1.5 | 2)[] = [1, 1.5, 2]

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => setProgress(p => { if (p >= 1) { setPlaying(false); return 0 } return p + 0.01 }), 80)
    return () => clearInterval(id)
  }, [playing])

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
      <div style={{ background: GRAD_MSG, borderRadius: SEND_R, padding: compact ? '8px 12px' : '10px 14px', maxWidth: compact ? 200 : 260 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 6 : 8 }}>
          {/* Play / pause */}
          <button onClick={() => setPlaying(p => !p)} style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            {playing
              ? <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
              : <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>}
          </button>

          {/* Waveform with scrubber */}
          <WaveformScrubber compact={compact} progress={progress} onSeek={setProgress} />
        </div>

        {/* Footer row: elapsed + speed + duration */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>
            {Math.round(progress * 32)}s / 0:32
          </span>
          {/* Speed toggle */}
          <div style={{ display: 'flex', gap: 0, background: 'rgba(255,255,255,0.15)', borderRadius: 6, overflow: 'hidden' }}>
            {SPEEDS.map(s => (
              <button key={s} onClick={() => setSpeed(s)}
                style={{ padding: compact ? '2px 5px' : '2px 7px', fontSize: 11, fontWeight: s === speed ? 700 : 400, background: s === speed ? 'rgba(255,255,255,0.3)' : 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
                {s}×
              </button>
            ))}
          </div>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>2:30 PM</span>
        </div>
      </div>
    </div>
  )
}

// Mic denied inline message
function MicDenied({ compact }: { compact: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: compact ? '10px 12px' : '12px 16px', background: 'rgba(250,56,62,0.05)', borderTop: `1px solid rgba(250,56,62,0.15)` }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(250,56,62,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="9" y="2" width="6" height="11" rx="3" stroke={ERROR} strokeWidth="1.8"/><path d="M5 10a7 7 0 0014 0" stroke={ERROR} strokeWidth="1.8" strokeLinecap="round"/><line x1="12" y1="19" x2="12" y2="22" stroke={ERROR} strokeWidth="1.8" strokeLinecap="round"/><path d="M2 2l20 20" stroke={ERROR} strokeWidth="1.8" strokeLinecap="round"/></svg>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: compact ? 12 : 13, fontWeight: 600, color: ERROR, marginBottom: 3 }}>Microphone access needed</div>
        <div style={{ fontSize: compact ? 11 : 12, color: MUTED, lineHeight: 1.5, marginBottom: 8 }}>
          To record voice notes, allow MyChatApp to access your microphone.
        </div>
        <button style={{ background: ERROR, color: '#fff', border: 'none', borderRadius: 9999, padding: compact ? '5px 12px' : '6px 16px', fontSize: compact ? 11 : 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(250,56,62,0.3)' }}>
          Grant Access
        </button>
      </div>
    </div>
  )
}

function VoiceExtrasDemo({ bp }: { bp: Breakpoint }) {
  const compact = bp !== 'desktop'
  const isMobile = bp === 'mobile'
  return (
    <ChatShell bp={bp}>
      <ChatHeader name="Jordan Kim" online compact={compact} onBack={isMobile ? () => {} : undefined} />
      <ThreadArea compact={compact}>
        <Bubble sent={false} text="Can you send me that voice note again? I missed it" time="2:28 PM" compact={compact} />

        {/* Received voice note (simple) */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-end' }}>
          <Av name="Jordan Kim" size={28} />
          <div style={{ background: RECV_BG, borderRadius: RECV_R, padding: compact ? '8px 12px' : '10px 14px', maxWidth: compact ? 200 : 260 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(8,102,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><polygon points="5,3 19,12 5,21" fill={PRIMARY}/></svg>
              </div>
              <div style={{ flex: 1, height: 3, borderRadius: 9999, background: BORDER, overflow: 'hidden' }}>
                <div style={{ width: '45%', height: '100%', background: PRIMARY, borderRadius: 9999 }} />
              </div>
              <span style={{ fontSize: 11, color: MUTED }}>0:32</span>
            </div>
            <span style={{ fontSize: 11, color: MUTED }}>2:29 PM</span>
          </div>
        </div>

        {/* Sent voice note with speed toggle + scrubber */}
        <VoiceNotePlus compact={compact} />

        <div style={{ padding: '8px 12px', background: CARD, borderRadius: 10, border: `1px solid ${BORDER}`, fontSize: 12, color: MUTED, marginTop: 4 }}>
          <span>💡 Tap the waveform to seek · toggle speed below the bars · play/pause with the button</span>
        </div>
      </ThreadArea>

      {/* Mic denied banner */}
      <MicDenied compact={compact} />

      {/* Input bar */}
      <div style={{ padding: compact ? '8px 12px' : '10px 16px', borderTop: `1px solid ${BORDER}`, background: CARD, display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><path d="M8 13s1.5 2 4 2 4-2 4-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="9" y1="9" x2="9.01" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="15" y1="9" x2="15.01" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></div>
        <div style={{ flex: 1, background: BG, borderRadius: 9999, padding: compact ? '7px 12px' : '9px 14px', fontSize: compact ? 13 : 15, color: MUTED, border: `1.5px solid ${BORDER}` }}>Aa</div>
        {/* Mic button with denied state */}
        <div title="Microphone access denied" style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(250,56,62,0.1)', border: `1.5px solid rgba(250,56,62,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'not-allowed' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="9" y="2" width="6" height="11" rx="3" stroke={ERROR} strokeWidth="1.8"/><path d="M5 10a7 7 0 0014 0" stroke={ERROR} strokeWidth="1.8" strokeLinecap="round"/><line x1="12" y1="19" x2="12" y2="22" stroke={ERROR} strokeWidth="1.8" strokeLinecap="round"/><path d="M2 2l20 20" stroke={ERROR} strokeWidth="1.8" strokeLinecap="round"/></svg>
        </div>
      </div>
      {isMobile && <BottomBar />}
    </ChatShell>
  )
}

// ═══════════════════════════════════════════════════════════════════
// Device frame
// ═══════════════════════════════════════════════════════════════════
function DeviceFrame({ bp, children }: { bp: Breakpoint; children: React.ReactNode }) {
  const C = {
    mobile:  { w: 390,  h: 780, scale: 0.80, mobile: true  },
    tablet:  { w: 834,  h: 680, scale: 0.70, mobile: false },
    desktop: { w: 1280, h: 680, scale: 0.63, mobile: false },
  }[bp]
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
  { id: 'emoji-picker',   label: 'Emoji Picker',       desc: 'Popover with category tabs, search, and recently used' },
  { id: 'context-menu',   label: 'Context Menu',        desc: 'Popover (desktop) · Bottom sheet with quick-react (mobile)' },
  { id: 'reactions',      label: 'Reaction Picker',     desc: 'Quick-react row · Attached reaction pills with counts' },
  { id: 'reply',          label: 'Reply Preview',       desc: 'Quoted-message bar above input · Reply rendering in thread' },
  { id: 'edit-unsend',    label: 'Edit & Unsend',       desc: 'Inline editing state · "Message was deleted" placeholder' },
  { id: 'attachment',     label: 'Attachment Picker',   desc: 'Photo/Video · Camera · File · Location grid popover' },
  { id: 'image-bubble',   label: 'Image Bubble',        desc: 'Photo messages with overlaid timestamp · Lightbox viewer' },
  { id: 'link-preview',   label: 'Link Preview',        desc: 'URL card with preview image, title, domain' },
  { id: 'voice-extras',   label: 'Voice Extras',        desc: 'Scrubber seek · Speed toggle 1×/1.5×/2× · Mic denied state' },
]

export default function ChatInteractions() {
  const [activeDemo, setActiveDemo] = useState<Demo>('emoji-picker')
  const current = DEMOS.find(d => d.id === activeDemo)!

  const renderDemo = (bp: Breakpoint) => {
    switch (activeDemo) {
      case 'emoji-picker':  return <EmojiPickerDemo bp={bp} />
      case 'context-menu':  return <ContextMenuDemo bp={bp} />
      case 'reactions':     return <ReactionsDemo bp={bp} />
      case 'reply':         return <ReplyDemo bp={bp} />
      case 'edit-unsend':   return <EditUnsendDemo bp={bp} />
      case 'attachment':    return <AttachmentDemo bp={bp} />
      case 'image-bubble':  return <ImageBubbleDemo bp={bp} />
      case 'link-preview':  return <LinkPreviewDemo bp={bp} />
      case 'voice-extras':  return <VoiceExtrasDemo bp={bp} />
    }
  }

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: BG, minHeight: '100vh' }}>
      {/* Control strip */}
      <div style={{ background: GRAD_MSG, padding: '20px 40px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 14 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>Chat Interaction Layer</h2>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: '3px 0 0' }}>{current.desc}</p>
            </div>
          </div>
          {/* Demo switcher — two rows on overflow */}
          <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 4, flexWrap: 'wrap' }}>
            {DEMOS.map(d => (
              <button key={d.id} onClick={() => setActiveDemo(d.id)}
                style={{ background: activeDemo === d.id ? '#fff' : 'transparent', color: activeDemo === d.id ? PRIMARY : 'rgba(255,255,255,0.85)', border: 'none', borderRadius: 9, padding: '5px 12px', fontSize: 12, fontWeight: activeDemo === d.id ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Device frames */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '40px 40px 80px' }}>
        <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center' }}>
          {(['mobile', 'tablet', 'desktop'] as Breakpoint[]).map(bp => (
            <div key={bp} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <DeviceFrame bp={bp}>{renderDemo(bp)}</DeviceFrame>
              <span style={{ fontSize: 12, color: MUTED }}>
                {bp === 'mobile' ? '390px — Mobile' : bp === 'tablet' ? '834px — Tablet' : '1280px — Desktop'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
