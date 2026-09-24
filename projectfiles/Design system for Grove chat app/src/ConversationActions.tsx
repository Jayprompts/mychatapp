import { useState, useRef, useEffect } from 'react'

// ─── Tokens (same system as ChatExperience) ───────────────────────
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
const WARNING  = '#F7B928'
const SEND_R   = '18px 18px 4px 18px'
const RECV_R   = '18px 18px 18px 4px'

type Breakpoint = 'mobile' | 'tablet' | 'desktop'
type Demo = 'options-menu' | 'search-convo' | 'group-info' | 'add-people' | 'confirm-modals' | 'chat-list'

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

// ─── Group avatar stack ───────────────────────────────────────────
function AvatarStack({ names, size = 32 }: { names: string[]; size?: number }) {
  const visible = names.slice(0, 3)
  return (
    <div style={{ position: 'relative', width: size + (visible.length - 1) * (size * 0.55), height: size, flexShrink: 0 }}>
      {visible.map((n, i) => (
        <div key={n} style={{ position: 'absolute', left: i * (size * 0.55), zIndex: visible.length - i, border: '2px solid #fff', borderRadius: '50%' }}>
          <div style={{ width: size - 4, height: size - 4, borderRadius: '50%', background: ac(n), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: (size - 4) * 0.37, fontWeight: 700, color: '#fff' }}>
            {n[0]}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Pill icon button ─────────────────────────────────────────────
function IBtn({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{ background: active ? 'rgba(8,102,255,0.1)' : 'none', border: 'none', width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: active ? PRIMARY : MUTED, flexShrink: 0 }}>
      {children}
    </button>
  )
}

// ─── Shared conversation data ─────────────────────────────────────
const THREAD = [
  { id: 1, sent: false, text: 'Hey everyone! Ready for Saturday?', time: '2:10 PM' },
  { id: 2, sent: true,  text: 'Absolutely! I\'ve booked the venue already 🎉', time: '2:11 PM' },
  { id: 3, sent: false, text: 'Amazing! How many people are coming?', time: '2:12 PM' },
  { id: 4, sent: true,  text: 'Around 12 confirmed so far. Might grow to 15.', time: '2:13 PM' },
  { id: 5, sent: false, text: 'Perfect! Let me know if you need any help with the setup', time: '2:14 PM' },
  { id: 6, sent: true,  text: 'Would love that! Come an hour early if you can 🙏', time: '2:15 PM' },
  { id: 7, sent: false, text: 'Done! See you at 6pm then 🙌', time: '2:16 PM' },
]

const GROUP_MEMBERS = [
  { name: 'Jordan Kim',     role: 'Admin',  online: true  },
  { name: 'Maria Garcia',   role: 'Member', online: true  },
  { name: 'Alex Chen',      role: 'Member', online: false },
  { name: 'Priya Sharma',   role: 'Member', online: true  },
  { name: 'Sam Okafor',     role: 'Member', online: false },
  { name: 'Taylor Reeves',  role: 'You',    online: true  },
]

const ALL_CONTACTS = [
  { name: 'Alex Chen',     mutual: 12 },
  { name: 'Priya Sharma',  mutual: 8  },
  { name: 'Sam Okafor',    mutual: 5  },
  { name: 'Riley Davis',   mutual: 14 },
  { name: 'Morgan Lee',    mutual: 3  },
  { name: 'Casey Park',    mutual: 7  },
  { name: 'Drew Nguyen',   mutual: 9  },
  { name: 'Blake Torres',  mutual: 2  },
]

// ─── Shared shell pieces ──────────────────────────────────────────
function IconSidebar() {
  return (
    <div style={{ width: 70, background: CARD, borderRight: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0', gap: 4, flexShrink: 0 }}>
      <div style={{ width: 38, height: 38, borderRadius: 11, background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 15H7L3 21V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
      </div>
      {[
        <svg key="c" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21 15H7L3 21V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
        <svg key="s" width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
        <svg key="p" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/></svg>,
      ].map((icon, i) => (
        <div key={i} style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: i === 0 ? PRIMARY : MUTED, background: i === 0 ? 'rgba(8,102,255,0.08)' : 'transparent' }}>{icon}</div>
      ))}
      <div style={{ marginTop: 'auto' }}><Av name="Taylor Reeves" size={34} online /></div>
    </div>
  )
}

const CHAT_CONVOS = [
  { name: 'Design Guild',  preview: 'Alex: Check this out 🔥', time: '2m',  unread: 3,  pinned: true,  group: true  },
  { name: 'Jordan Kim',    preview: 'Ready for Saturday?',       time: '5m',  unread: 1,  pinned: true,  group: false },
  { name: 'Maria Garcia',  preview: 'Thanks for sharing!',        time: '1h',  unread: 0,  pinned: false, group: false },
  { name: 'Design Guild',  preview: 'Sam: See you at 6pm 🙌',    time: '2h',  unread: 0,  pinned: false, group: true  },
  { name: 'Alex Chen',     preview: 'Sounds good, let\'s go!',   time: '3h',  unread: 0,  pinned: false, group: false },
  { name: 'Priya Sharma',  preview: 'Sent a photo',               time: 'Tue', unread: 0,  pinned: false, group: false },
]

function ChatListPanel({ compact = false, showArchived = false, showPinned = true, onSelectConvo }: {
  compact?: boolean; showArchived?: boolean; showPinned?: boolean; onSelectConvo?: (name: string) => void
}) {
  const pinned  = showPinned  ? CHAT_CONVOS.filter(c => c.pinned)  : []
  const regular = CHAT_CONVOS.filter(c => !c.pinned)

  const Row = ({ c, isPinned }: { c: typeof CHAT_CONVOS[0]; isPinned?: boolean }) => (
    <div onClick={() => onSelectConvo?.(c.name)}
      style={{ display: 'flex', gap: 10, padding: '10px 14px', borderBottom: `1px solid ${BORDER}`, cursor: 'pointer', alignItems: 'center', background: 'transparent', transition: 'background 0.1s' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = BG}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
      {c.group ? <AvatarStack names={['Jordan Kim', 'Maria Garcia', 'Alex Chen']} size={42} /> : <Av name={c.name} size={42} online />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}>{c.name}</span>
            {isPinned && (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M12 17v5M8.5 7.5l-2-2a1 1 0 010-1.41l1.41-1.41a1 1 0 011.41 0l.5.5M8.5 7.5L12 4l7 7-3.5 3.5M8.5 7.5L5 11l3 3 4-1.5" stroke={MUTED} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            )}
          </div>
          <span style={{ fontSize: 11, color: MUTED, flexShrink: 0 }}>{c.time}</span>
        </div>
        <div style={{ fontSize: 13, color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{c.preview}</div>
      </div>
      {c.unread > 0 && <span style={{ background: GRAD, color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 9999, minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', flexShrink: 0 }}>{c.unread}</span>}
    </div>
  )

  return (
    <div style={{ width: compact ? 280 : 320, borderRight: `1px solid ${BORDER}`, flexShrink: 0, display: 'flex', flexDirection: 'column', background: CARD, height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '12px 14px', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>{showArchived ? 'Archived' : 'Messages'}</span>
          {!showArchived && (
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(8,102,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke={PRIMARY} strokeWidth="2" strokeLinecap="round"/></svg>
            </div>
          )}
        </div>
        <div style={{ background: BG, borderRadius: 10, padding: '7px 12px', display: 'flex', gap: 7, alignItems: 'center' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke={MUTED} strokeWidth="1.8"/><path d="M21 21l-4.35-4.35" stroke={MUTED} strokeWidth="1.8" strokeLinecap="round"/></svg>
          <span style={{ fontSize: 13, color: MUTED }}>Search</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Pinned section */}
        {pinned.length > 0 && !showArchived && (
          <>
            <div style={{ padding: '8px 14px 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M12 17v5M8.5 7.5l-2-2a1 1 0 010-1.41l1.41-1.41a1 1 0 011.41 0l.5.5M8.5 7.5L12 4l7 7-3.5 3.5M8.5 7.5L5 11l3 3 4-1.5" stroke={MUTED} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8 }}>Pinned</span>
            </div>
            {pinned.map((c, i) => <Row key={`p${i}`} c={c} isPinned />)}
            <div style={{ padding: '8px 14px 4px' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8 }}>All Messages</span>
            </div>
          </>
        )}
        {/* Regular / archived conversations */}
        {(showArchived ? CHAT_CONVOS : regular).map((c, i) => <Row key={`r${i}`} c={c} />)}
      </div>

      {/* Archive link */}
      {!showArchived && (
        <div style={{ padding: '10px 14px', borderTop: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: MUTED }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = BG}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4" stroke={MUTED} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span style={{ fontSize: 13, fontWeight: 500 }}>Archived Chats</span>
          <span style={{ marginLeft: 'auto', fontSize: 11, background: 'rgba(0,0,0,0.06)', borderRadius: 9999, padding: '2px 7px' }}>2</span>
        </div>
      )}
    </div>
  )
}

// ─── Confirmation Modal (shared pattern) ──────────────────────────
interface ConfirmProps {
  title: string
  body: string
  confirmLabel: string
  onCancel: () => void
  onConfirm: () => void
  danger?: boolean
}

function ConfirmModal({ title, body, confirmLabel, onCancel, onConfirm, danger = true }: ConfirmProps) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onCancel} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)' }} />
      <div style={{ position: 'relative', background: CARD, borderRadius: 20, padding: '24px 24px 20px', maxWidth: 340, width: 'calc(100% - 48px)', boxShadow: '0 20px 60px rgba(0,0,0,0.22)', zIndex: 1 }}>
        {/* Icon */}
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: danger ? 'rgba(250,56,62,0.1)' : 'rgba(247,185,40,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          {danger
            ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><polyline points="3,6 5,6 21,6" stroke={ERROR} strokeWidth="1.8" strokeLinecap="round"/><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke={ERROR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            : <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke={WARNING} strokeWidth="1.8" strokeLinecap="round"/><line x1="12" y1="9" x2="12" y2="13" stroke={WARNING} strokeWidth="1.8" strokeLinecap="round"/><line x1="12" y1="17" x2="12.01" y2="17" stroke={WARNING} strokeWidth="2.5" strokeLinecap="round"/></svg>
          }
        </div>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: TEXT, margin: '0 0 8px', textAlign: 'center' }}>{title}</h3>
        <p style={{ fontSize: 14, color: MUTED, margin: '0 0 22px', textAlign: 'center', lineHeight: 1.55 }}>{body}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel}
            style={{ flex: 1, padding: '11px', borderRadius: 12, border: `1.5px solid ${BORDER}`, background: CARD, fontSize: 14, fontWeight: 600, color: TEXT, cursor: 'pointer', fontFamily: 'inherit' }}>
            Cancel
          </button>
          <button onClick={onConfirm}
            style={{ flex: 1, padding: '11px', borderRadius: 12, border: 'none', background: danger ? ERROR : WARNING, fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 4px 16px ${danger ? 'rgba(250,56,62,0.35)' : 'rgba(247,185,40,0.35)'}` }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Options Menu items ───────────────────────────────────────────
interface MenuItem { label: string; icon: React.ReactNode; danger?: boolean; divider?: boolean }

const menuItems = (isGroup: boolean): MenuItem[] => [
  { label: 'Search in Conversation', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
  { label: 'Mute Notifications',     icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
  { label: 'Pin Conversation',       icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 17v5M8.5 7.5l-2-2a1 1 0 010-1.41l1.41-1.41a1 1 0 011.41 0l.5.5M8.5 7.5L12 4l7 7-3.5 3.5M8.5 7.5L5 11l3 3 4-1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { label: 'Archive',                icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>, divider: true },
  ...(isGroup ? [] : [{ label: 'Block / Report User', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>, danger: true }]),
  { label: 'Clear Chat History',     icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>, danger: true },
  { label: 'Delete Conversation',    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2zM18 9l-6 6M12 9l6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>, danger: true },
]

// ─── Options Menu popover ─────────────────────────────────────────
function OptionsPopover({ isGroup, onSelect, onClose }: { isGroup: boolean; onSelect: (l: string) => void; onClose: () => void }) {
  return (
    <div style={{ background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, boxShadow: '0 8px 32px rgba(0,0,0,0.16)', overflow: 'hidden', minWidth: 230 }}>
      {menuItems(isGroup).map((item, i, arr) => (
        <div key={item.label}>
          {item.divider && i > 0 && <div style={{ height: 1, background: BORDER, margin: '4px 0' }} />}
          <button onClick={() => { onSelect(item.label); onClose() }}
            style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 500, color: item.danger ? ERROR : TEXT, textAlign: 'left', transition: 'background 0.1s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = BG}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
            <span style={{ color: item.danger ? ERROR : MUTED }}>{item.icon}</span>
            {item.label}
          </button>
        </div>
      ))}
    </div>
  )
}

// ─── Options Bottom Sheet (mobile) ────────────────────────────────
function OptionsBottomSheet({ isGroup, onSelect, onClose }: { isGroup: boolean; onSelect: (l: string) => void; onClose: () => void }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 100 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: CARD, borderRadius: '20px 20px 0 0', paddingBottom: 24 }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: BORDER, margin: '10px auto 12px' }} />
        <div style={{ padding: '0 6px' }}>
          {menuItems(isGroup).map((item, i) => (
            <div key={item.label}>
              {item.divider && i > 0 && <div style={{ height: 1, background: BORDER, margin: '6px 14px' }} />}
              <button onClick={() => { onSelect(item.label); onClose() }}
                style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '13px 18px', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, fontWeight: 500, color: item.danger ? ERROR : TEXT, textAlign: 'left', borderRadius: 12 }}>
                <span style={{ color: item.danger ? ERROR : MUTED }}>{item.icon}</span>
                {item.label}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 1. CONVERSATION OPTIONS MENU
// ═══════════════════════════════════════════════════════════════════
function OptionsMenuDemo({ bp }: { bp: Breakpoint }) {
  const [open, setOpen] = useState(true)
  const [selected, setSelected] = useState('')
  const [confirm, setConfirm] = useState<string | null>(null)
  const isMobile = bp === 'mobile'
  const compact  = bp !== 'desktop'
  const isGroup  = true

  const handleSelect = (label: string) => {
    if (['Delete Conversation', 'Clear Chat History', 'Block / Report User'].includes(label)) {
      setConfirm(label)
    } else {
      setSelected(label)
    }
  }

  return (
    <div style={{ display: 'flex', height: '100%', background: BG }}>
      {!compact && <IconSidebar />}
      {!isMobile  && <ChatListPanel compact={compact} />}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
        {/* Chat header with ⋮ */}
        <div style={{ padding: compact ? '10px 12px' : '12px 16px', borderBottom: `1px solid ${BORDER}`, background: CARD, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {isMobile && <IBtn><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke={TEXT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></IBtn>}
          <AvatarStack names={['Jordan Kim', 'Maria Garcia', 'Alex Chen']} size={38} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: TEXT }}>Design Guild</div>
            <div style={{ fontSize: 12, color: MUTED }}>6 members · 3 online</div>
          </div>
          <IBtn><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><polygon points="23,7 16,12 23,17 23,7" stroke={MUTED} strokeWidth="1.8" strokeLinecap="round"/><rect x="1" y="5" width="15" height="14" rx="2" stroke={MUTED} strokeWidth="1.8"/></svg></IBtn>
          <IBtn><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 015.13 12.7 19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke={MUTED} strokeWidth="1.8" strokeLinecap="round"/></svg></IBtn>
          {/* More options button */}
          <div style={{ position: 'relative' }}>
            <IBtn active={open} onClick={() => setOpen(o => !o)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="5" r="1.3" fill={open ? PRIMARY : MUTED}/><circle cx="12" cy="12" r="1.3" fill={open ? PRIMARY : MUTED}/><circle cx="12" cy="19" r="1.3" fill={open ? PRIMARY : MUTED}/></svg>
            </IBtn>
            {/* Desktop popover */}
            {open && !isMobile && (
              <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 50, marginTop: 4 }}>
                <OptionsPopover isGroup={isGroup} onSelect={handleSelect} onClose={() => setOpen(false)} />
              </div>
            )}
          </div>
        </div>

        {/* Thread */}
        <div style={{ flex: 1, overflowY: 'auto', padding: compact ? '12px' : '16px', background: BG }}>
          {THREAD.map(m => (
            <div key={m.id} style={{ display: 'flex', justifyContent: m.sent ? 'flex-end' : 'flex-start', marginBottom: 6 }}>
              <div style={{ background: m.sent ? GRAD_MSG : RECV_BG, borderRadius: m.sent ? SEND_R : RECV_R, padding: compact ? '8px 12px' : '10px 14px', maxWidth: compact ? 190 : 260, color: m.sent ? '#fff' : TEXT }}>
                <p style={{ margin: 0, fontSize: compact ? 13 : 15 }}>{m.text}</p>
                <span style={{ fontSize: 11, opacity: 0.7, marginTop: 3, display: 'block', textAlign: 'right' }}>{m.time}</span>
              </div>
            </div>
          ))}
          {selected && (
            <div style={{ padding: '8px 12px', background: 'rgba(8,102,255,0.06)', borderRadius: 10, border: `1px solid rgba(8,102,255,0.15)`, fontSize: 13, color: PRIMARY, marginTop: 8 }}>
              ✓ Action: <strong>{selected}</strong>
            </div>
          )}
        </div>

        <div style={{ padding: compact ? '8px 12px' : '10px 16px', borderTop: `1px solid ${BORDER}`, background: CARD, display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          <div style={{ flex: 1, background: BG, borderRadius: 9999, padding: compact ? '7px 12px' : '9px 14px', fontSize: compact ? 13 : 15, color: MUTED, border: `1.5px solid ${BORDER}` }}>Aa</div>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 19V5m0 0l-7 7m7-7l7 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
        </div>

        {/* Mobile bottom sheet */}
        {isMobile && open && <OptionsBottomSheet isGroup={isGroup} onSelect={handleSelect} onClose={() => setOpen(false)} />}
        {/* Confirm modal */}
        {confirm && (
          <ConfirmModal
            title={confirm === 'Delete Conversation' ? 'Delete conversation?' : confirm === 'Clear Chat History' ? 'Clear chat history?' : 'Block this person?'}
            body={confirm === 'Delete Conversation' ? 'This conversation will be permanently removed for everyone. This can\'t be undone.' : confirm === 'Clear Chat History' ? 'All messages will be deleted from your view. This can\'t be undone.' : 'They won\'t be able to message you and you won\'t see their content.'}
            confirmLabel={confirm === 'Delete Conversation' ? 'Delete' : confirm === 'Clear Chat History' ? 'Clear' : 'Block'}
            onCancel={() => setConfirm(null)}
            onConfirm={() => { setSelected(confirm!); setConfirm(null) }}
          />
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 2. SEARCH IN CONVERSATION
// ═══════════════════════════════════════════════════════════════════
function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: 'rgba(8,102,255,0.25)', color: PRIMARY, borderRadius: 3, padding: '0 1px' }}>{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

function SearchConvoDemo({ bp }: { bp: Breakpoint }) {
  const [query, setQuery]       = useState('Saturday')
  const [matchIdx, setMatchIdx] = useState(0)
  const isMobile = bp === 'mobile'
  const compact  = bp !== 'desktop'

  const matches = THREAD
    .map((m, i) => ({ ...m, idx: i }))
    .filter(m => query && m.text.toLowerCase().includes(query.toLowerCase()))

  const currentMatchId = matches[matchIdx]?.id

  return (
    <div style={{ display: 'flex', height: '100%', background: BG }}>
      {!compact && <IconSidebar />}
      {!isMobile  && <ChatListPanel compact={compact} />}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
        {/* Search bar takes over the top */}
        <div style={{ padding: compact ? '8px 10px' : '10px 14px', borderBottom: `1px solid ${BORDER}`, background: CARD, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 4 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div style={{ flex: 1, background: BG, borderRadius: 9999, padding: compact ? '7px 12px' : '8px 14px', display: 'flex', gap: 8, alignItems: 'center', border: `1.5px solid ${PRIMARY}`, boxShadow: '0 0 0 3px rgba(8,102,255,0.1)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke={PRIMARY} strokeWidth="1.8"/><path d="M21 21l-4.35-4.35" stroke={PRIMARY} strokeWidth="1.8" strokeLinecap="round"/></svg>
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); setMatchIdx(0) }}
              placeholder="Search messages…"
              autoFocus
              style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: compact ? 13 : 14, color: TEXT, fontFamily: 'inherit', flex: 1 }}
            />
            {query && (
              <span style={{ fontSize: 12, color: MUTED, whiteSpace: 'nowrap' }}>
                {matches.length > 0 ? `${matchIdx + 1} of ${matches.length}` : '0 results'}
              </span>
            )}
          </div>
          {/* Up/Down navigation */}
          <div style={{ display: 'flex', gap: 2 }}>
            <IBtn onClick={() => setMatchIdx(i => Math.max(0, i - 1))}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 15l-6-6-6 6" stroke={matches.length > 0 ? TEXT : BORDER} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </IBtn>
            <IBtn onClick={() => setMatchIdx(i => Math.min(matches.length - 1, i + 1))}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke={matches.length > 0 ? TEXT : BORDER} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </IBtn>
          </div>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: PRIMARY, fontWeight: 600, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>Done</button>
        </div>

        {/* Thread with highlights */}
        <div style={{ flex: 1, overflowY: 'auto', padding: compact ? '12px' : '16px', background: BG }}>
          {THREAD.map(m => {
            const isMatch  = matches.some(mt => mt.id === m.id)
            const isCurrent = m.id === currentMatchId
            return (
              <div key={m.id} style={{ display: 'flex', justifyContent: m.sent ? 'flex-end' : 'flex-start', marginBottom: 6 }}>
                <div style={{
                  background: m.sent ? GRAD_MSG : RECV_BG,
                  borderRadius: m.sent ? SEND_R : RECV_R,
                  padding: compact ? '8px 12px' : '10px 14px',
                  maxWidth: compact ? 190 : 260,
                  color: m.sent ? '#fff' : TEXT,
                  outline: isCurrent ? `2.5px solid ${PRIMARY}` : isMatch ? `1.5px solid rgba(8,102,255,0.35)` : 'none',
                  outlineOffset: 2,
                  opacity: query && !isMatch ? 0.4 : 1,
                  transition: 'opacity 0.15s, outline 0.1s',
                }}>
                  <p style={{ margin: 0, fontSize: compact ? 13 : 15 }}>
                    {isMatch ? highlight(m.text, query) : m.text}
                  </p>
                  <span style={{ fontSize: 11, opacity: 0.7, marginTop: 3, display: 'block', textAlign: 'right' }}>{m.time}</span>
                </div>
              </div>
            )
          })}

          {query && matches.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: MUTED }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.3, margin: '0 auto 12px', display: 'block' }}><circle cx="11" cy="11" r="8" stroke={MUTED} strokeWidth="1.5"/><path d="M21 21l-4.35-4.35" stroke={MUTED} strokeWidth="1.5" strokeLinecap="round"/></svg>
              <p style={{ fontSize: 14, margin: 0 }}>No messages matching "{query}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 3. GROUP / COMMUNITY INFO
// ═══════════════════════════════════════════════════════════════════
const SHARED_MEDIA = [
  { bg: 'linear-gradient(135deg, #0866FF, #7B2FBE)', label: '🏙️' },
  { bg: 'linear-gradient(145deg, #F7B928, #FA383E)', label: '🌅' },
  { bg: 'linear-gradient(135deg, #31A24C, #00B2FF)', label: '🌿' },
  { bg: 'linear-gradient(135deg, #B620E0, #FA383E)', label: '🎨' },
  { bg: 'linear-gradient(135deg, #00B2FF, #31A24C)', label: '🚀' },
  { bg: 'linear-gradient(145deg, #8B5CF6, #0866FF)', label: '✨' },
]

const ROLE_COLORS: Record<string, string> = { Admin: PRIMARY, You: SUCCESS, Member: MUTED }

function GroupInfoPanel({ compact, onClose }: { compact: boolean; onClose?: () => void }) {
  const [confirmLeave, setConfirmLeave] = useState(false)

  return (
    <div style={{ width: compact ? '100%' : 320, height: '100%', borderLeft: compact ? 'none' : `1px solid ${BORDER}`, background: CARD, display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'relative', overflowY: 'auto' }}>
      {/* Group photo + name */}
      <div style={{ background: GRAD_MSG, padding: compact ? '28px 20px 20px' : '32px 20px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        {compact && onClose && (
          <div style={{ position: 'absolute', top: 12, left: 12 }}>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        )}
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🎨</div>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#fff' }}>Design Guild</h3>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>Group · 6 members</p>
        </div>
        {/* Add People button */}
        <button style={{ background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.35)', borderRadius: 9999, padding: '7px 18px', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="white" strokeWidth="1.8" strokeLinecap="round"/><circle cx="8.5" cy="7" r="4" stroke="white" strokeWidth="1.8"/><line x1="20" y1="8" x2="20" y2="14" stroke="white" strokeWidth="1.8" strokeLinecap="round"/><line x1="23" y1="11" x2="17" y2="11" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>
          Add People
        </button>
      </div>

      {/* Description */}
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>About</div>
        <p style={{ margin: 0, fontSize: 13, color: TEXT, lineHeight: 1.55 }}>A community of designers exploring new tools, sharing work, and growing together. Weekly check-ins every Wednesday.</p>
      </div>

      {/* Members */}
      <div style={{ padding: '12px 16px 8px', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8 }}>Members</span>
          <span style={{ fontSize: 12, color: PRIMARY, fontWeight: 600, cursor: 'pointer' }}>See all</span>
        </div>
        {GROUP_MEMBERS.map(m => (
          <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: `1px solid ${BORDER}` }}>
            <Av name={m.name} size={34} online={m.online} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{m.name}{m.role === 'You' ? ' (You)' : ''}</div>
              <div style={{ fontSize: 11, color: MUTED, marginTop: 1 }}>{m.online ? 'Active now' : 'Last seen recently'}</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: ROLE_COLORS[m.role] ?? MUTED, background: `${ROLE_COLORS[m.role] ?? MUTED}15`, borderRadius: 9999, padding: '2px 8px' }}>{m.role}</span>
          </div>
        ))}
      </div>

      {/* Shared media */}
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8 }}>Shared Media</span>
          <span style={{ fontSize: 12, color: PRIMARY, fontWeight: 600, cursor: 'pointer' }}>See all</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
          {SHARED_MEDIA.map((m, i) => (
            <div key={i} style={{ aspectRatio: '1', background: m.bg, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 20, transition: 'opacity 0.1s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.8'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}>
              {m.label}
            </div>
          ))}
        </div>
      </div>

      {/* Leave Group */}
      <div style={{ padding: '12px 16px', marginTop: 'auto' }}>
        <button onClick={() => setConfirmLeave(true)}
          style={{ width: '100%', padding: '11px', borderRadius: 12, border: `1.5px solid rgba(250,56,62,0.3)`, background: 'rgba(250,56,62,0.06)', fontSize: 14, fontWeight: 600, color: ERROR, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke={ERROR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Leave Group
        </button>
      </div>

      {confirmLeave && (
        <ConfirmModal
          title="Leave Design Guild?"
          body="You'll lose access to the group chat and won't receive further messages. You can be re-added by an admin."
          confirmLabel="Leave Group"
          onCancel={() => setConfirmLeave(false)}
          onConfirm={() => setConfirmLeave(false)}
        />
      )}
    </div>
  )
}

function GroupInfoDemo({ bp }: { bp: Breakpoint }) {
  const [showInfo, setShowInfo] = useState(true)
  const isMobile = bp === 'mobile'
  const compact  = bp !== 'desktop'

  // Mobile/tablet: fullscreen overlay; Desktop: right panel alongside chat
  if (isMobile && showInfo) {
    return (
      <div style={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
        <GroupInfoPanel compact onClose={() => setShowInfo(false)} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100%', background: BG }}>
      {!compact && <IconSidebar />}
      {!isMobile && <ChatListPanel compact={compact} />}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top bar — group name is tappable */}
        <div style={{ padding: compact ? '10px 12px' : '12px 16px', borderBottom: `1px solid ${BORDER}`, background: CARD, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {isMobile && <IBtn><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke={TEXT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></IBtn>}
          <div onClick={() => setShowInfo(true)} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flex: 1 }}>
            <AvatarStack names={['Jordan Kim', 'Maria Garcia', 'Alex Chen']} size={38} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: TEXT }}>Design Guild</div>
              <div style={{ fontSize: 12, color: MUTED }}>6 members · 3 online</div>
            </div>
          </div>
          <IBtn onClick={() => setShowInfo(o => !o)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke={showInfo ? PRIMARY : MUTED} strokeWidth="1.8"/><line x1="12" y1="8" x2="12" y2="12" stroke={showInfo ? PRIMARY : MUTED} strokeWidth="1.8" strokeLinecap="round"/><line x1="12" y1="16" x2="12.01" y2="16" stroke={showInfo ? PRIMARY : MUTED} strokeWidth="2.5" strokeLinecap="round"/></svg>
          </IBtn>
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: compact ? '12px' : '16px', background: BG }}>
            {THREAD.map(m => (
              <div key={m.id} style={{ display: 'flex', justifyContent: m.sent ? 'flex-end' : 'flex-start', marginBottom: 6 }}>
                <div style={{ background: m.sent ? GRAD_MSG : RECV_BG, borderRadius: m.sent ? SEND_R : RECV_R, padding: compact ? '8px 12px' : '10px 14px', maxWidth: compact ? 160 : 240, color: m.sent ? '#fff' : TEXT }}>
                  <p style={{ margin: 0, fontSize: compact ? 13 : 15 }}>{m.text}</p>
                  <span style={{ fontSize: 11, opacity: 0.7, marginTop: 3, display: 'block', textAlign: 'right' }}>{m.time}</span>
                </div>
              </div>
            ))}
          </div>
          {/* Desktop right panel */}
          {!isMobile && !compact && showInfo && <GroupInfoPanel compact={false} />}
          {compact && !isMobile && showInfo && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 80, display: 'flex', flexDirection: 'column' }}>
              <div onClick={() => setShowInfo(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />
              <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 300, zIndex: 1 }}>
                <GroupInfoPanel compact onClose={() => setShowInfo(false)} />
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: compact ? '8px 12px' : '10px 16px', borderTop: `1px solid ${BORDER}`, background: CARD, display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          <div style={{ flex: 1, background: BG, borderRadius: 9999, padding: compact ? '7px 12px' : '9px 14px', fontSize: compact ? 13 : 15, color: MUTED, border: `1.5px solid ${BORDER}` }}>Aa</div>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 19V5m0 0l-7 7m7-7l7 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 4. ADD PEOPLE TO CHAT
// ═══════════════════════════════════════════════════════════════════
function AddPeopleModal({ onClose, compact }: { onClose: () => void; compact: boolean }) {
  const [search, setSearch]     = useState('')
  const [selected, setSelected] = useState<string[]>(['Riley Davis'])

  const filtered = ALL_CONTACTS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) &&
    !GROUP_MEMBERS.some(m => m.name === c.name)
  )

  const toggle = (name: string) =>
    setSelected(s => s.includes(name) ? s.filter(n => n !== name) : [...s, name])

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 150, display: 'flex', alignItems: compact ? 'flex-end' : 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)' }} />
      <div style={{ position: 'relative', background: CARD, borderRadius: compact ? '20px 20px 0 0' : 20, width: compact ? '100%' : 400, maxHeight: '85%', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        {/* Header */}
        <div style={{ padding: compact ? '14px 16px 10px' : '18px 20px 12px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
          {compact && <div style={{ width: 36, height: 4, borderRadius: 2, background: BORDER, margin: '0 auto 12px' }} />}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: TEXT }}>Add People</h3>
            <button onClick={onClose} style={{ background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke={MUTED} strokeWidth="2.5" strokeLinecap="round"/></svg>
            </button>
          </div>

          {/* Selected pills */}
          {selected.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              {selected.map(n => (
                <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(8,102,255,0.1)', border: `1.5px solid rgba(8,102,255,0.25)`, borderRadius: 9999, padding: '4px 10px 4px 6px' }}>
                  <Av name={n} size={20} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: PRIMARY }}>{n.split(' ')[0]}</span>
                  <button onClick={() => toggle(n)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke={PRIMARY} strokeWidth="2.5" strokeLinecap="round"/></svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Search */}
          <div style={{ background: BG, borderRadius: 10, padding: '7px 12px', display: 'flex', gap: 8, alignItems: 'center', border: `1.5px solid ${BORDER}` }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke={MUTED} strokeWidth="1.8"/><path d="M21 21l-4.35-4.35" stroke={MUTED} strokeWidth="1.8" strokeLinecap="round"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contacts…" style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: TEXT, fontFamily: 'inherit', flex: 1 }} />
          </div>
        </div>

        {/* Contact list */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {GROUP_MEMBERS.length > 0 && (
            <div style={{ padding: '8px 16px 4px', fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8 }}>Already in group</div>
          )}
          {GROUP_MEMBERS.filter(m => m.name.toLowerCase().includes(search.toLowerCase())).map(m => (
            <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', opacity: 0.45 }}>
              <Av name={m.name} size={38} online={m.online} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{m.name}</div>
                <div style={{ fontSize: 12, color: MUTED }}>{m.role}</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          ))}

          {filtered.length > 0 && (
            <div style={{ padding: '8px 16px 4px', fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8 }}>Suggested</div>
          )}
          {filtered.map(c => {
            const isSelected = selected.includes(c.name)
            return (
              <button key={c.name} onClick={() => toggle(c.name)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', width: '100%', background: isSelected ? 'rgba(8,102,255,0.04)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'background 0.1s' }}>
                <Av name={c.name} size={38} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: MUTED }}>{c.mutual} mutual friends</div>
                </div>
                {/* Checkbox */}
                <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${isSelected ? PRIMARY : BORDER}`, background: isSelected ? PRIMARY : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                  {isSelected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
              </button>
            )
          })}
        </div>

        {/* Confirm button */}
        <div style={{ padding: '12px 16px', borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
          <button
            disabled={selected.length === 0}
            style={{ width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: selected.length > 0 ? GRAD_MSG : BORDER, color: selected.length > 0 ? '#fff' : MUTED, fontSize: 15, fontWeight: 700, cursor: selected.length > 0 ? 'pointer' : 'not-allowed', fontFamily: 'inherit', boxShadow: selected.length > 0 ? '0 4px 16px rgba(8,102,255,0.3)' : 'none', transition: 'all 0.15s' }}>
            {selected.length > 0 ? `Add ${selected.length} person${selected.length > 1 ? 's' : ''}` : 'Select people to add'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AddPeopleDemo({ bp }: { bp: Breakpoint }) {
  const [open, setOpen] = useState(true)
  const isMobile = bp === 'mobile'
  const compact  = bp !== 'desktop'

  return (
    <div style={{ display: 'flex', height: '100%', background: BG, position: 'relative' }}>
      {!compact && <IconSidebar />}
      {!isMobile  && <ChatListPanel compact={compact} />}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ padding: compact ? '10px 12px' : '12px 16px', borderBottom: `1px solid ${BORDER}`, background: CARD, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <AvatarStack names={['Jordan Kim', 'Maria Garcia', 'Alex Chen']} size={38} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: TEXT }}>Design Guild</div>
            <div style={{ fontSize: 12, color: MUTED }}>6 members</div>
          </div>
          <button onClick={() => setOpen(true)} style={{ background: GRAD_MSG, border: 'none', borderRadius: 9999, padding: '7px 14px', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', gap: 6, alignItems: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="white" strokeWidth="1.8" strokeLinecap="round"/><circle cx="8.5" cy="7" r="4" stroke="white" strokeWidth="1.8"/><line x1="20" y1="8" x2="20" y2="14" stroke="white" strokeWidth="1.8" strokeLinecap="round"/><line x1="23" y1="11" x2="17" y2="11" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>
            Add
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: compact ? '12px' : '16px', background: BG }}>
          {THREAD.slice(0, 4).map(m => (
            <div key={m.id} style={{ display: 'flex', justifyContent: m.sent ? 'flex-end' : 'flex-start', marginBottom: 6 }}>
              <div style={{ background: m.sent ? GRAD_MSG : RECV_BG, borderRadius: m.sent ? SEND_R : RECV_R, padding: compact ? '8px 12px' : '10px 14px', maxWidth: compact ? 190 : 250, color: m.sent ? '#fff' : TEXT }}>
                <p style={{ margin: 0, fontSize: compact ? 13 : 15 }}>{m.text}</p>
                <span style={{ fontSize: 11, opacity: 0.7, marginTop: 3, display: 'block', textAlign: 'right' }}>{m.time}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: compact ? '8px 12px' : '10px 16px', borderTop: `1px solid ${BORDER}`, background: CARD, display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          <div style={{ flex: 1, background: BG, borderRadius: 9999, padding: compact ? '7px 12px' : '9px 14px', fontSize: compact ? 13 : 15, color: MUTED, border: `1.5px solid ${BORDER}` }}>Aa</div>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 19V5m0 0l-7 7m7-7l7 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
        </div>
      </div>
      {open && <AddPeopleModal compact={isMobile} onClose={() => setOpen(false)} />}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 5. CONFIRMATION MODALS
// ═══════════════════════════════════════════════════════════════════
const CONFIRM_VARIANTS = [
  { id: 'delete-convo',  title: 'Delete conversation?',  body: 'This conversation will be permanently removed for everyone. This can\'t be undone.',      confirm: 'Delete',      danger: true  },
  { id: 'clear-history', title: 'Clear chat history?',   body: 'All messages will be deleted from your view. This can\'t be undone.',                       confirm: 'Clear',       danger: true  },
  { id: 'leave-group',   title: 'Leave Design Guild?',   body: 'You\'ll lose access to the group chat. You can be re-added by an admin later.',             confirm: 'Leave Group', danger: true  },
  { id: 'block-user',    title: 'Block Jordan Kim?',     body: 'They won\'t be able to send you messages and you won\'t see their content.',                 confirm: 'Block',       danger: true  },
]

function ConfirmModalsDemo({ bp }: { bp: Breakpoint }) {
  const [active, setActive] = useState<string | null>('delete-convo')
  const [done, setDone]     = useState<string | null>(null)
  const compact = bp !== 'desktop'

  const variant = CONFIRM_VARIANTS.find(v => v.id === active)

  return (
    <div style={{ height: '100%', background: BG, display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Faded chat background */}
      <div style={{ flex: 1, overflowY: 'auto', opacity: 0.35, pointerEvents: 'none' }}>
        <div style={{ padding: compact ? '12px' : '16px' }}>
          {THREAD.map(m => (
            <div key={m.id} style={{ display: 'flex', justifyContent: m.sent ? 'flex-end' : 'flex-start', marginBottom: 6 }}>
              <div style={{ background: m.sent ? GRAD_MSG : RECV_BG, borderRadius: m.sent ? SEND_R : RECV_R, padding: compact ? '8px 12px' : '10px 14px', maxWidth: compact ? 190 : 260, color: m.sent ? '#fff' : TEXT }}>
                <p style={{ margin: 0, fontSize: compact ? 13 : 15 }}>{m.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Overlay */}
      {variant && (
        <ConfirmModal
          title={variant.title}
          body={variant.body}
          confirmLabel={variant.confirm}
          danger={variant.danger}
          onCancel={() => { setActive(null); setDone(null) }}
          onConfirm={() => { setDone(variant.id); setActive(null) }}
        />
      )}

      {/* Control row */}
      <div style={{ padding: '10px 14px', borderTop: `1px solid ${BORDER}`, background: CARD, display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
        {CONFIRM_VARIANTS.map(v => (
          <button key={v.id} onClick={() => { setActive(v.id); setDone(null) }}
            style={{ background: done === v.id ? 'rgba(49,162,76,0.1)' : 'rgba(250,56,62,0.08)', border: `1px solid ${done === v.id ? SUCCESS : 'rgba(250,56,62,0.25)'}`, borderRadius: 8, padding: '5px 11px', fontSize: 12, fontWeight: 600, color: done === v.id ? SUCCESS : ERROR, cursor: 'pointer', fontFamily: 'inherit' }}>
            {done === v.id ? '✓ ' : ''}{v.confirm}
          </button>
        ))}
        {!variant && !done && (
          <span style={{ fontSize: 12, color: MUTED, alignSelf: 'center', marginLeft: 4 }}>↑ tap an action to preview the modal</span>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 6. CHAT LIST ENHANCEMENTS
// ═══════════════════════════════════════════════════════════════════
const ARCHIVED = [
  { name: 'Old Project Group', preview: 'Sam: We shipped it!',       time: 'Mar 3', unread: 0, group: true  },
  { name: 'Casey Park',        preview: 'Sure, talk soon! 👋',        time: 'Feb 14',unread: 0, group: false },
]

function ChatListDemo({ bp }: { bp: Breakpoint }) {
  const [view, setView] = useState<'main' | 'archived'>('main')
  const isMobile = bp === 'mobile'
  const compact  = bp !== 'desktop'

  return (
    <div style={{ display: 'flex', height: '100%', background: BG }}>
      {!compact && <IconSidebar />}
      <div style={{ width: compact ? '100%' : 320, borderRight: `1px solid ${BORDER}`, flexShrink: 0, display: 'flex', flexDirection: 'column', background: CARD }}>
        {/* Header */}
        <div style={{ padding: '12px 14px', borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            {view === 'archived' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={() => setView('main')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke={TEXT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <span style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>Archived</span>
              </div>
            ) : (
              <span style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>Messages</span>
            )}
            {view === 'main' && (
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(8,102,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke={PRIMARY} strokeWidth="2" strokeLinecap="round"/></svg>
              </div>
            )}
          </div>
          <div style={{ background: BG, borderRadius: 10, padding: '7px 12px', display: 'flex', gap: 7, alignItems: 'center' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke={MUTED} strokeWidth="1.8"/><path d="M21 21l-4.35-4.35" stroke={MUTED} strokeWidth="1.8" strokeLinecap="round"/></svg>
            <span style={{ fontSize: 13, color: MUTED }}>Search</span>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {view === 'main' && (
            <>
              {/* Pinned section */}
              <div style={{ padding: '8px 14px 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M12 17v5M8.5 7.5l-2-2a1 1 0 010-1.41l1.41-1.41a1 1 0 011.41 0l.5.5M8.5 7.5L12 4l7 7-3.5 3.5M8.5 7.5L5 11l3 3 4-1.5" stroke={MUTED} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8 }}>Pinned</span>
              </div>
              {CHAT_CONVOS.filter(c => c.pinned).map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 14px', borderBottom: `1px solid ${BORDER}`, cursor: 'pointer', alignItems: 'center', background: 'rgba(8,102,255,0.02)' }}>
                  {c.group ? <AvatarStack names={['Jordan Kim','Maria Garcia','Alex Chen']} size={42} /> : <Av name={c.name} size={42} online />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}>{c.name}</span>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M12 17v5M8.5 7.5l-2-2a1 1 0 010-1.41l1.41-1.41a1 1 0 011.41 0l.5.5M8.5 7.5L12 4l7 7-3.5 3.5M8.5 7.5L5 11l3 3 4-1.5" stroke={MUTED} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      <span style={{ fontSize: 11, color: MUTED }}>{c.time}</span>
                    </div>
                    <div style={{ fontSize: 13, color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{c.preview}</div>
                  </div>
                  {c.unread > 0 && <span style={{ background: GRAD, color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 9999, minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', flexShrink: 0 }}>{c.unread}</span>}
                </div>
              ))}
              {/* Divider + all messages */}
              <div style={{ padding: '8px 14px 4px' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8 }}>All Messages</span>
              </div>
              {CHAT_CONVOS.filter(c => !c.pinned).map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 14px', borderBottom: `1px solid ${BORDER}`, cursor: 'pointer', alignItems: 'center' }}>
                  {c.group ? <AvatarStack names={['Jordan Kim','Maria Garcia','Alex Chen']} size={42} /> : <Av name={c.name} size={42} online={!i} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 14, fontWeight: c.unread ? 700 : 600, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>{c.name}</span>
                      <span style={{ fontSize: 11, color: MUTED }}>{c.time}</span>
                    </div>
                    <div style={{ fontSize: 13, color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{c.preview}</div>
                  </div>
                  {c.unread > 0 && <span style={{ background: GRAD, color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 9999, minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', flexShrink: 0 }}>{c.unread}</span>}
                </div>
              ))}
            </>
          )}

          {view === 'archived' && (
            <>
              <div style={{ padding: '12px 14px 6px', fontSize: 13, color: MUTED, lineHeight: 1.55 }}>
                Archived conversations are hidden from your main list. They still receive messages.
              </div>
              {ARCHIVED.map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 14px', borderBottom: `1px solid ${BORDER}`, cursor: 'pointer', alignItems: 'center' }}>
                  {c.group ? <AvatarStack names={['Sam Okafor', 'Priya Sharma', 'Alex Chen']} size={42} /> : <Av name={c.name} size={42} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                      <span style={{ fontSize: 11, color: MUTED }}>{c.time}</span>
                    </div>
                    <div style={{ fontSize: 13, color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{c.preview}</div>
                  </div>
                  <button style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 600, color: TEXT, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>Unarchive</button>
                </div>
              ))}
              {ARCHIVED.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 16px', color: MUTED }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.3, margin: '0 auto 12px', display: 'block' }}><path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4" stroke={MUTED} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <p style={{ fontSize: 14, margin: 0 }}>No archived conversations</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Archive link (main list only) */}
        {view === 'main' && (
          <button onClick={() => setView('archived')}
            style={{ padding: '11px 14px', borderTop: `1px solid ${BORDER}`, borderLeft: 'none', borderRight: 'none', borderBottom: 'none', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', background: 'transparent', width: '100%', textAlign: 'left', fontFamily: 'inherit', transition: 'background 0.1s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = BG}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4" stroke={MUTED} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span style={{ fontSize: 13, fontWeight: 500, color: MUTED }}>Archived Chats</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, background: 'rgba(0,0,0,0.06)', borderRadius: 9999, padding: '2px 7px', color: TEXT }}>2</span>
          </button>
        )}
      </div>

      {/* Placeholder right panel */}
      {!isMobile && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: MUTED }}>
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.25 }}><path d="M21 15H7L3 21V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke={MUTED} strokeWidth="1.5" strokeLinecap="round"/></svg>
          <p style={{ fontSize: 14, margin: 0, fontWeight: 500 }}>Select a conversation</p>
          <p style={{ fontSize: 13, margin: 0 }}>Pinned chats appear at the top of the list</p>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// Device Frame
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
  { id: 'options-menu',   label: 'Options Menu',      desc: 'Dropdown (desktop) · Bottom sheet (mobile) — from the ⋮ icon in the top bar' },
  { id: 'search-convo',   label: 'Search in Chat',    desc: 'Search bar replaces top bar, highlights matches, up/down navigation with counter' },
  { id: 'group-info',     label: 'Group Info',        desc: 'Right panel (desktop) · Full-screen (mobile) — members, media grid, Leave Group' },
  { id: 'add-people',     label: 'Add People',        desc: 'Searchable multi-select contact modal with checkboxes and pill tokens' },
  { id: 'confirm-modals', label: 'Confirm Modals',    desc: 'Shared destructive-action pattern for Delete, Clear, Leave, and Block' },
  { id: 'chat-list',      label: 'Chat List',         desc: 'Pinned section with pin icon · Archived Chats screen with Unarchive action' },
]

export default function ConversationActions() {
  const [activeDemo, setActiveDemo] = useState<Demo>('options-menu')
  const current = DEMOS.find(d => d.id === activeDemo)!

  const renderDemo = (bp: Breakpoint) => {
    switch (activeDemo) {
      case 'options-menu':   return <OptionsMenuDemo bp={bp} />
      case 'search-convo':   return <SearchConvoDemo bp={bp} />
      case 'group-info':     return <GroupInfoDemo bp={bp} />
      case 'add-people':     return <AddPeopleDemo bp={bp} />
      case 'confirm-modals': return <ConfirmModalsDemo bp={bp} />
      case 'chat-list':      return <ChatListDemo bp={bp} />
    }
  }

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: BG, minHeight: '100vh' }}>
      {/* Control strip */}
      <div style={{ background: GRAD_MSG, padding: '20px 40px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ marginBottom: 14 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 3px' }}>Conversation Actions</h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: 0 }}>{current.desc}</p>
          </div>
          <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 4, flexWrap: 'wrap' }}>
            {DEMOS.map(d => (
              <button key={d.id} onClick={() => setActiveDemo(d.id)}
                style={{ background: activeDemo === d.id ? '#fff' : 'transparent', color: activeDemo === d.id ? PRIMARY : 'rgba(255,255,255,0.85)', border: 'none', borderRadius: 9, padding: '5px 14px', fontSize: 12, fontWeight: activeDemo === d.id ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
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
