import { useState, useRef, useEffect } from 'react'

// ─── Types ────────────────────────────────────────────────────────
type Breakpoint = 'mobile' | 'tablet' | 'desktop'
type ChatScreen = 'list' | 'dm' | 'group' | 'voice'
type ListState = 'normal' | 'empty' | 'skeleton'

// ─── Shared design tokens ─────────────────────────────────────────
const GRAD = 'linear-gradient(135deg, #00B2FF 0%, #B620E0 100%)'
const GRAD_MSG = 'linear-gradient(135deg, #0866FF 0%, #7B2FBE 100%)'
const BORDER = '#E4E6EB'
const BG = '#F7F8FA'
const CARD = '#FFFFFF'
const TEXT = '#050505'
const MUTED = '#65676B'

// ─── Tiny primitives ─────────────────────────────────────────────

const AVATAR_COLORS = ['#0866FF', '#B620E0', '#00B2FF', '#31A24C', '#F7B928', '#FA383E', '#8B5CF6']
function avatarColor(name: string) { return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length] }

function Avatar({
  name, size = 40, online, away, src
}: { name: string; size?: number; online?: boolean; away?: boolean; src?: string }) {
  return (
    <div style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: avatarColor(name),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.38, fontWeight: 700, color: '#fff', flexShrink: 0,
        overflow: 'hidden',
      }}>
        {src
          ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
      </div>
      {(online || away) && (
        <span style={{
          position: 'absolute', bottom: size > 32 ? 1 : 0, right: size > 32 ? 1 : 0,
          width: Math.max(8, size * 0.28), height: Math.max(8, size * 0.28),
          borderRadius: '50%', background: online ? '#31A24C' : '#F7B928',
          border: `${size > 32 ? 2 : 1.5}px solid #fff`, flexShrink: 0,
        }} />
      )}
    </div>
  )
}

function AvatarStack({ names, size = 28 }: { names: string[]; size?: number }) {
  const shown = names.slice(0, 3)
  return (
    <div style={{ display: 'flex' }}>
      {shown.map((n, i) => (
        <div key={n} style={{ marginLeft: i === 0 ? 0 : -(size * 0.35), zIndex: shown.length - i }}>
          <Avatar name={n} size={size} />
        </div>
      ))}
    </div>
  )
}

function UnreadBadge({ count }: { count: number }) {
  if (!count) return null
  return (
    <span style={{
      background: GRAD, color: '#fff',
      fontSize: 11, fontWeight: 700, borderRadius: 9999,
      minWidth: 20, height: 20, padding: '0 6px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, letterSpacing: -0.3,
    }}>{count > 99 ? '99+' : count}</span>
  )
}

function GradientBtn({ label, fullWidth = false, compact = false, icon }: {
  label: string; fullWidth?: boolean; compact?: boolean; icon?: React.ReactNode
}) {
  return (
    <button style={{
      width: fullWidth ? '100%' : 'auto',
      background: GRAD, color: '#fff', border: 'none',
      borderRadius: 9999, padding: compact ? '8px 16px' : '11px 24px',
      fontSize: compact ? 13 : 15, fontWeight: 600, cursor: 'pointer',
      fontFamily: 'inherit', display: 'flex', alignItems: 'center',
      justifyContent: 'center', gap: 8,
      boxShadow: '0 4px 16px rgba(8,102,255,0.22)',
    }}>
      {icon}{label}
    </button>
  )
}

// ─── Waveform bar ─────────────────────────────────────────────────
function Waveform({ bars = 24, playing = false, color = '#0866FF', small = false }: {
  bars?: number; playing?: boolean; color?: string; small?: boolean
}) {
  const heights = [3,5,8,12,7,15,10,6,14,9,4,11,13,7,5,12,9,15,6,10,8,4,11,7]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: small ? 1.5 : 2, height: small ? 20 : 32 }}>
      {Array.from({ length: bars }).map((_, i) => {
        const h = heights[i % heights.length]
        const maxH = small ? 18 : 30
        const minH = small ? 3 : 4
        const barH = minH + (h / 15) * (maxH - minH)
        return (
          <div key={i} style={{
            width: small ? 2 : 3, height: barH, borderRadius: 2,
            background: playing ? color : '#C0C2C9',
            opacity: playing ? 0.8 + (i % 3) * 0.07 : 0.6,
            transition: 'height 0.1s',
          }} />
        )
      })}
    </div>
  )
}

// ─── Recording waveform (animated) ───────────────────────────────
function LiveWaveform() {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 120)
    return () => clearInterval(id)
  }, [])
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 36 }}>
      {Array.from({ length: 20 }).map((_, i) => {
        const base = [4, 8, 14, 20, 16, 10, 22, 18, 12, 6, 20, 14, 8, 18, 24, 10, 16, 6, 20, 12]
        const animated = base[i] + Math.sin((tick + i) * 0.6) * 6
        const h = Math.max(4, Math.min(30, animated))
        return (
          <div key={i} style={{
            width: 3, height: h, borderRadius: 2,
            background: GRAD, transition: 'height 0.12s ease',
          }} />
        )
      })}
    </div>
  )
}

// ─── Skeleton block ───────────────────────────────────────────────
function Sk({ w, h, radius = 8, circle = false }: { w: number | string; h: number; radius?: number; circle?: boolean }) {
  return (
    <div className="skeleton" style={{
      width: w, height: h,
      borderRadius: circle ? '50%' : radius,
      flexShrink: 0,
    }} />
  )
}

// ─── Read receipt ─────────────────────────────────────────────────
function ReadReceipt({ read }: { read?: boolean }) {
  return (
    <svg width="16" height="10" viewBox="0 0 16 10" fill="none" style={{ flexShrink: 0 }}>
      {/* double tick */}
      <path d="M1 5l3 3 5-7" stroke={read ? '#0866FF' : '#A0A2A9'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 5l3 3 5-7" stroke={read ? '#0866FF' : '#A0A2A9'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ─── Typing indicator ─────────────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center', padding: '4px 2px' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 6, height: 6, borderRadius: '50%', background: MUTED,
          animation: `typingBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
    </div>
  )
}

// ─── Send button morph ────────────────────────────────────────────
function SendOrMic({ hasText }: { hasText: boolean }) {
  return (
    <div style={{
      width: 36, height: 36, borderRadius: '50%',
      background: hasText ? GRAD : BG,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', transition: 'background 0.2s, transform 0.1s',
      flexShrink: 0, border: hasText ? 'none' : `1.5px solid ${BORDER}`,
    }}>
      {hasText ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <rect x="9" y="2" width="6" height="12" rx="3" stroke={MUTED} strokeWidth="1.8"/>
          <path d="M5 10a7 7 0 0014 0M12 19v3M9 22h6" stroke={MUTED} strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      )}
    </div>
  )
}

// ─── Icon button ─────────────────────────────────────────────────
function IconBtn({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <button style={{
      background: active ? 'rgba(8,102,255,0.08)' : 'transparent',
      border: 'none', borderRadius: 9999, width: 36, height: 36,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', flexShrink: 0, color: active ? '#0866FF' : MUTED,
    }}>{children}</button>
  )
}

// ─── Sidebar nav icon ─────────────────────────────────────────────
function SidebarIcon({ icon, label, active, badge }: {
  icon: React.ReactNode; label: string; active?: boolean; badge?: number
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, position: 'relative', cursor: 'pointer', padding: '6px 0' }}>
      <div style={{
        width: 44, height: 44, borderRadius: 14,
        background: active ? 'rgba(8,102,255,0.12)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: active ? '#0866FF' : MUTED,
        transition: 'background 0.15s',
      }}>
        {icon}
      </div>
      <span style={{ fontSize: 10, color: active ? '#0866FF' : MUTED, fontWeight: active ? 600 : 400 }}>{label}</span>
      {badge ? (
        <span style={{
          position: 'absolute', top: 2, right: 4,
          background: '#FA383E', color: '#fff', fontSize: 9, fontWeight: 700,
          borderRadius: 9999, minWidth: 14, height: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px',
          border: '1.5px solid #fff',
        }}>{badge}</span>
      ) : null}
    </div>
  )
}

// ─── SVG icon set ─────────────────────────────────────────────────
const Icons = {
  chat: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M21 15H7L3 21V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  community: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  compass: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>,
  profile: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/></svg>,
  search: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  back: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  phone: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  video: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><polygon points="23,7 16,12 23,17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/><rect x="1" y="5" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/></svg>,
  more: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="5" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="19" r="1.5" fill="currentColor"/></svg>,
  emoji: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><path d="M8 13s1.5 2 4 2 4-2 4-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="9" cy="9.5" r="1" fill="currentColor"/><circle cx="15" cy="9.5" r="1" fill="currentColor"/></svg>,
  attach: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  plus: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>,
  pencil: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  play: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>,
  mic: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.8"/><path d="M5 10a7 7 0 0014 0M12 19v3M9 22h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  close: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  trash: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><polyline points="3,6 5,6 21,6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  users: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
}

// ─── Data ─────────────────────────────────────────────────────────
interface Conversation {
  id: string
  name: string
  lastMsg: string
  time: string
  unread: number
  online: boolean
  muted?: boolean
  group?: boolean
  members?: string[]
}

const CONVERSATIONS: Conversation[] = [
  { id: '1', name: 'Alex Johnson', lastMsg: 'Sounds good! See you at 7pm 👋', time: '2m', unread: 3, online: true },
  { id: '2', name: 'Design Team', lastMsg: 'Jordan: Can we review the mockups?', time: '15m', unread: 7, online: false, group: true, members: ['Maria Garcia', 'Jordan Kim', 'Sam Lee'] },
  { id: '3', name: 'Maria Garcia', lastMsg: 'I sent you the files ✓', time: '1h', unread: 0, online: true },
  { id: '4', name: 'Product Guild', lastMsg: 'Ben: Ship it! 🚀', time: '2h', unread: 0, online: false, group: true, members: ['Ben Carter', 'Taylor Reeves', 'Sam Lee', 'Jordan Kim'] },
  { id: '5', name: 'Sam Lee', lastMsg: 'haha yeah totally 😂', time: '3h', unread: 0, online: false },
  { id: '6', name: 'Jordan Kim', lastMsg: 'Are you free this weekend?', time: 'Mon', unread: 1, online: true },
  { id: '7', name: 'Ben Carter', lastMsg: 'Thanks! Will do.', time: 'Sun', unread: 0, online: false, muted: true },
]

interface Message {
  id: string
  text?: string
  sent: boolean
  time: string
  read?: boolean
  voice?: boolean
  duration?: string
  senderName?: string
  reaction?: string
}

const DM_MESSAGES: Message[] = [
  { id: '1', text: 'Hey! Are you free this weekend?', sent: false, time: '2:30 PM' },
  { id: '2', text: 'Yeah! What are you thinking? 😊', sent: true, time: '2:31 PM', read: true },
  { id: '3', text: 'Maybe we could grab coffee and then check out that new exhibition downtown?', sent: false, time: '2:32 PM' },
  { id: '4', voice: true, duration: '0:24', sent: false, time: '2:33 PM' },
  { id: '5', text: 'That sounds amazing, I\'ve been wanting to go there for ages 🎨', sent: true, time: '2:35 PM', read: true, reaction: '❤️' },
  { id: '6', text: 'Saturday at 11am? We could grab brunch first', sent: false, time: '2:36 PM' },
  { id: '7', text: 'Perfect! I know a great spot on 5th 🥐', sent: true, time: '2:37 PM', read: true },
  { id: '8', text: 'Can\'t wait! See you then 🎉', sent: false, time: '2:38 PM' },
]

const GROUP_MESSAGES: Message[] = [
  { id: '1', text: 'Hey everyone, I just pushed the new designs to Figma 👇', sent: false, time: '10:15 AM', senderName: 'Jordan Kim' },
  { id: '2', text: 'Oh nice! Looking good so far', sent: false, time: '10:17 AM', senderName: 'Sam Lee' },
  { id: '3', text: 'Love the new color palette. The gradient buttons especially 🔥', sent: true, time: '10:20 AM', read: true },
  { id: '4', voice: true, duration: '0:12', sent: false, time: '10:21 AM', senderName: 'Maria Garcia' },
  { id: '5', text: 'Agreed, should we schedule a review call?', sent: false, time: '10:22 AM', senderName: 'Jordan Kim' },
  { id: '6', text: 'Thursday 2pm works for me!', sent: true, time: '10:24 AM', read: false },
]

// ─── Message bubble ───────────────────────────────────────────────
function MessageBubble({
  msg, compact = false, showSender = false, senderName,
}: {
  msg: Message; compact?: boolean; showSender?: boolean; senderName?: string
}) {
  const { sent, text, voice, duration, time, read, reaction } = msg
  const name = senderName || msg.senderName || ''
  const [playing, setPlaying] = useState(false)

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: sent ? 'flex-end' : 'flex-start',
      marginBottom: 4,
    }}>
      {showSender && !sent && name && (
        <span style={{ fontSize: 12, fontWeight: 600, color: avatarColor(name), marginBottom: 4, marginLeft: 44 }}>{name}</span>
      )}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', maxWidth: '75%', flexDirection: sent ? 'row-reverse' : 'row' }}>
        {showSender && !sent && (
          <Avatar name={name || 'U'} size={32} />
        )}

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: sent ? 'flex-end' : 'flex-start', gap: 4 }}>
          {voice ? (
            <div style={{
              background: sent ? GRAD_MSG : '#F0F0F0',
              borderRadius: sent ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              padding: '10px 14px',
              display: 'flex', alignItems: 'center', gap: 10,
              minWidth: 160,
            }}>
              <button
                onClick={() => setPlaying(p => !p)}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: sent ? 'rgba(255,255,255,0.25)' : GRAD,
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', flexShrink: 0,
                }}>
                {playing
                  ? <svg width="10" height="12" viewBox="0 0 10 12" fill="white"><rect x="0" y="0" width="3.5" height="12" rx="1.5"/><rect x="6.5" y="0" width="3.5" height="12" rx="1.5"/></svg>
                  : Icons.play}
              </button>
              <div style={{ flex: 1 }}>
                <Waveform bars={20} playing={playing} color={sent ? '#fff' : '#0866FF'} small />
              </div>
              <span style={{ fontSize: 11, color: sent ? 'rgba(255,255,255,0.75)' : MUTED, flexShrink: 0 }}>{duration}</span>
            </div>
          ) : (
            <div style={{
              background: sent ? GRAD_MSG : '#F0F0F0',
              color: sent ? '#fff' : TEXT,
              borderRadius: sent ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              padding: compact ? '9px 13px' : '10px 14px',
              fontSize: compact ? 14 : 15, lineHeight: 1.45,
              maxWidth: '100%', wordBreak: 'break-word',
            }}>{text}</div>
          )}

          {reaction && (
            <div style={{
              background: '#fff', border: `1px solid ${BORDER}`,
              borderRadius: 9999, padding: '2px 7px', fontSize: 14,
              boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
              marginTop: -8, alignSelf: sent ? 'flex-end' : 'flex-start',
            }}>{reaction}</div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingRight: sent ? 0 : 4 }}>
            <span style={{ fontSize: 11, color: MUTED }}>{time}</span>
            {sent && <ReadReceipt read={read} />}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Date separator ───────────────────────────────────────────────
function DateSep({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '12px 0' }}>
      <div style={{ flex: 1, height: 1, background: BORDER }} />
      <span style={{ fontSize: 12, color: MUTED, fontWeight: 500 }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: BORDER }} />
    </div>
  )
}

// ─── Chat input bar ───────────────────────────────────────────────
function ChatInputBar({ compact = false }: { compact?: boolean }) {
  const [text, setText] = useState('')
  const hasText = text.trim().length > 0
  return (
    <div style={{
      padding: compact ? '8px 12px' : '10px 16px',
      borderTop: `1px solid ${BORDER}`,
      background: CARD,
      display: 'flex', alignItems: 'center', gap: compact ? 6 : 8,
    }}>
      <IconBtn>{Icons.emoji}</IconBtn>
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center',
        background: BG, borderRadius: 9999,
        padding: compact ? '7px 12px' : '9px 14px',
        gap: 8, border: `1.5px solid ${BORDER}`,
      }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Aa"
          style={{
            flex: 1, border: 'none', outline: 'none',
            fontSize: compact ? 13 : 15, background: 'transparent',
            fontFamily: 'inherit', color: TEXT,
          }}
        />
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, padding: 0, display: 'flex' }}>
          {Icons.attach}
        </button>
      </div>
      <SendOrMic hasText={hasText} />
    </div>
  )
}

// ─── Chat top bar ─────────────────────────────────────────────────
function ChatTopBar({
  name, online, group, memberCount, members, onBack, compact = false,
}: {
  name: string; online?: boolean; group?: boolean;
  memberCount?: number; members?: string[];
  onBack?: () => void; compact?: boolean;
}) {
  return (
    <div style={{
      padding: compact ? '10px 12px' : '12px 16px',
      borderBottom: `1px solid ${BORDER}`,
      background: CARD,
      display: 'flex', alignItems: 'center', gap: compact ? 8 : 10,
    }}>
      {onBack && (
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT, padding: 4, display: 'flex', marginLeft: -4 }}>
          {Icons.back}
        </button>
      )}
      {group && members ? (
        <AvatarStack names={members} size={compact ? 26 : 32} />
      ) : (
        <Avatar name={name} size={compact ? 34 : 38} online={online} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: compact ? 14 : 15, fontWeight: 600, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
        <div style={{ fontSize: 12, color: online ? '#31A24C' : MUTED, display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
          {group && members ? (
            <span>{memberCount} members</span>
          ) : (
            <>
              {online && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#31A24C', display: 'inline-block' }} />}
              <span>{online ? 'Active now' : 'Last seen 1h ago'}</span>
            </>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 0 }}>
        <IconBtn>{Icons.phone}</IconBtn>
        <IconBtn>{Icons.video}</IconBtn>
        <IconBtn>{Icons.more}</IconBtn>
      </div>
    </div>
  )
}

// ─── Screen: Chat List ────────────────────────────────────────────
function ChatListPanel({
  compact = false,
  onSelectConversation,
  selectedId,
  state = 'normal',
}: {
  compact?: boolean;
  onSelectConversation: (id: string) => void;
  selectedId?: string;
  state?: ListState;
}) {
  const [query, setQuery] = useState('')
  const filtered = CONVERSATIONS.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.lastMsg.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: CARD }}>
      {/* Header */}
      <div style={{ padding: compact ? '12px 12px 8px' : '16px 16px 8px', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: compact ? 8 : 12 }}>
          <span style={{ fontSize: compact ? 18 : 22, fontWeight: 700, color: TEXT }}>Chats</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <IconBtn>{Icons.pencil}</IconBtn>
            <IconBtn>{Icons.users}</IconBtn>
          </div>
        </div>
        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: BG, borderRadius: 9999,
          padding: compact ? '7px 12px' : '9px 14px',
          border: `1.5px solid ${BORDER}`,
        }}>
          <span style={{ color: MUTED, display: 'flex' }}>{Icons.search}</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search conversations…"
            style={{
              border: 'none', outline: 'none', background: 'transparent',
              fontSize: compact ? 13 : 14, color: TEXT, flex: 1, fontFamily: 'inherit',
            }}
          />
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {state === 'skeleton' && Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ padding: compact ? '10px 12px' : '12px 16px', display: 'flex', gap: 12, alignItems: 'center', borderBottom: `1px solid #F5F5F5` }}>
            <Sk w={compact ? 40 : 48} h={compact ? 40 : 48} circle />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Sk w="55%" h={13} />
              <Sk w="82%" h={11} />
            </div>
            <Sk w={28} h={10} radius={4} />
          </div>
        ))}

        {state === 'empty' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 40, textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(0,178,255,0.1), rgba(182,32,224,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M21 15H7L3 21V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="url(#eg)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><defs><linearGradient id="eg" x1="3" y1="3" x2="21" y2="21"><stop stopColor="#00B2FF"/><stop offset="1" stopColor="#B620E0"/></linearGradient></defs></svg>
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: TEXT, marginBottom: 8 }}>No conversations yet</div>
            <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.6, marginBottom: 24 }}>Start chatting with friends or join a community to get the conversation going.</div>
            <GradientBtn label="New Message" compact icon={Icons.pencil} />
          </div>
        )}

        {state === 'normal' && filtered.map(c => {
          const isSelected = c.id === selectedId
          return (
            <div
              key={c.id}
              onClick={() => onSelectConversation(c.id)}
              style={{
                padding: compact ? '10px 12px' : '12px 16px',
                display: 'flex', gap: compact ? 10 : 12, alignItems: 'center',
                background: isSelected ? 'rgba(8,102,255,0.06)' : 'transparent',
                cursor: 'pointer', transition: 'background 0.12s',
                borderBottom: `1px solid #F5F5F5`,
                borderLeft: isSelected ? '3px solid #0866FF' : '3px solid transparent',
              }}
              onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = BG }}
              onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              {c.group && c.members ? (
                <AvatarStack names={c.members} size={compact ? 38 : 46} />
              ) : (
                <Avatar name={c.name} size={compact ? 42 : 48} online={c.online} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: compact ? 13 : 15, fontWeight: c.unread > 0 ? 600 : 400, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                  <span style={{ fontSize: 11, color: c.unread > 0 ? '#0866FF' : MUTED, flexShrink: 0, fontWeight: c.unread > 0 ? 600 : 400 }}>{c.time}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2, gap: 8 }}>
                  <span style={{ fontSize: compact ? 12 : 13, color: c.unread > 0 ? TEXT : MUTED, fontWeight: c.unread > 0 ? 500 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: c.muted ? 0.6 : 1 }}>{c.muted ? '🔇 ' : ''}{c.lastMsg}</span>
                  <UnreadBadge count={c.unread} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Screen: DM Chat ──────────────────────────────────────────────
function DMChatPanel({ compact = false, onBack }: { compact?: boolean; onBack?: () => void }) {
  const c = CONVERSATIONS[0]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: CARD }}>
      <ChatTopBar name={c.name} online={c.online} onBack={onBack} compact={compact} />
      <div style={{ flex: 1, overflowY: 'auto', padding: compact ? '12px 12px' : '16px 16px', display: 'flex', flexDirection: 'column', gap: 2, background: BG }}>
        <DateSep label="Today" />
        {DM_MESSAGES.map(msg => (
          <MessageBubble key={msg.id} msg={msg} compact={compact} />
        ))}
        {/* Typing indicator */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginTop: 4 }}>
          <Avatar name={c.name} size={26} />
          <div style={{ background: '#F0F0F0', borderRadius: '18px 18px 18px 4px', padding: '10px 14px' }}>
            <TypingDots />
          </div>
        </div>
      </div>
      <ChatInputBar compact={compact} />
    </div>
  )
}

// ─── Screen: Group Chat ───────────────────────────────────────────
function GroupChatPanel({ compact = false, onBack }: { compact?: boolean; onBack?: () => void }) {
  const c = CONVERSATIONS[1]
  const [typingCount] = useState(2)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: CARD }}>
      <ChatTopBar
        name={c.name} group onBack={onBack}
        members={c.members} memberCount={c.members?.length}
        compact={compact}
      />
      <div style={{ flex: 1, overflowY: 'auto', padding: compact ? '12px 10px' : '16px 14px', display: 'flex', flexDirection: 'column', gap: 8, background: BG }}>
        <DateSep label="Today" />
        {GROUP_MESSAGES.map(msg => (
          <MessageBubble key={msg.id} msg={msg} compact={compact} showSender />
        ))}
        {/* Multi-person typing */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <div style={{ display: 'flex', marginLeft: 40 }}>
            <Avatar name="Jordan Kim" size={18} />
            <Avatar name="Maria Garcia" size={18} />
          </div>
          <div style={{ background: '#F0F0F0', borderRadius: '12px 12px 12px 3px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <TypingDots />
            <span style={{ fontSize: 11, color: MUTED }}>Jordan, Maria are typing…</span>
          </div>
        </div>
      </div>
      <ChatInputBar compact={compact} />
    </div>
  )
}

// ─── Screen: Voice Note UI ────────────────────────────────────────
function VoiceNotePanel({ compact = false }: { compact?: boolean }) {
  const [recState, setRecState] = useState<'idle' | 'recording' | 'preview'>('idle')
  const [time, setTime] = useState(0)
  useEffect(() => {
    if (recState !== 'recording') { setTime(0); return }
    const id = setInterval(() => setTime(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [recState])
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: CARD }}>
      <ChatTopBar name="Alex Johnson" online compact={compact} />

      {/* Thread with sent voice note */}
      <div style={{ flex: 1, overflowY: 'auto', padding: compact ? '12px' : '16px', background: BG, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <DateSep label="Today" />
        <MessageBubble msg={{ id: 'prev1', text: 'Send me that recording you mentioned', sent: false, time: '3:10 PM' }} compact={compact} />
        <MessageBubble msg={{ id: 'prev2', text: 'Sure! Give me a sec', sent: true, time: '3:11 PM', read: true }} compact={compact} />

        {/* (c) Sent voice note bubble */}
        <div style={{ marginTop: 8 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>(c) Sent voice note bubble</p>
          <MessageBubble
            msg={{ id: 'vn1', voice: true, duration: '0:24', sent: true, time: '3:12 PM', read: true }}
            compact={compact}
          />
        </div>
      </div>

      {/* Voice note states at bottom */}
      <div style={{ background: CARD, borderTop: `1px solid ${BORDER}` }}>
        {/* State labels */}
        <div style={{ padding: '10px 16px 0', display: 'flex', gap: 8 }}>
          {(['idle', 'recording', 'preview'] as const).map(s => (
            <button key={s} onClick={() => setRecState(s)}
              style={{
                background: recState === s ? GRAD : BG,
                color: recState === s ? '#fff' : MUTED,
                border: `1.5px solid ${recState === s ? 'transparent' : BORDER}`,
                borderRadius: 9999, padding: '4px 12px',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                textTransform: 'capitalize',
              }}>
              {s === 'idle' ? '(a) Idle' : s === 'recording' ? '(b) Recording' : '(c) Recorded'}
            </button>
          ))}
        </div>

        {/* (a) Idle */}
        {recState === 'idle' && (
          <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconBtn>{Icons.emoji}</IconBtn>
            <div style={{ flex: 1, background: BG, borderRadius: 9999, padding: '9px 14px', border: `1.5px solid ${BORDER}`, fontSize: 14, color: MUTED }}>Aa</div>
            <button onClick={() => setRecState('recording')} style={{
              width: 36, height: 36, borderRadius: '50%', background: BG,
              border: `1.5px solid ${BORDER}`, display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', color: MUTED,
            }}>
              {Icons.mic}
            </button>
          </div>
        )}

        {/* (b) Recording */}
        {recState === 'recording' && (
          <div style={{ padding: '12px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(250,56,62,0.04)', border: '1.5px solid rgba(250,56,62,0.15)', borderRadius: 16, padding: '12px 14px' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FA383E', animation: 'pulse 1s ease-in-out infinite', flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#FA383E', flexShrink: 0, minWidth: 36 }}>{fmt(time)}</span>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <LiveWaveform />
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setRecState('idle')} style={{ width: 32, height: 32, borderRadius: '50%', background: '#F0F0F0', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED }}>
                  {Icons.trash}
                </button>
                <button onClick={() => setRecState('preview')} style={{ width: 32, height: 32, borderRadius: '50%', background: GRAD, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <svg width="12" height="14" viewBox="0 0 24 24" fill="white"><rect x="4" y="2" width="4" height="20" rx="2"/><rect x="16" y="2" width="4" height="20" rx="2"/></svg>
                </button>
              </div>
            </div>
            <p style={{ fontSize: 11, color: MUTED, textAlign: 'center', marginTop: 6 }}>← Slide to cancel</p>
          </div>
        )}

        {/* (c) Preview before send */}
        {recState === 'preview' && (
          <div style={{ padding: '12px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: BG, border: `1.5px solid ${BORDER}`, borderRadius: 16, padding: '12px 14px' }}>
              <button style={{ width: 32, height: 32, borderRadius: '50%', background: GRAD, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                {Icons.play}
              </button>
              <div style={{ flex: 1 }}>
                <Waveform bars={22} playing color="#0866FF" small />
              </div>
              <span style={{ fontSize: 12, color: MUTED, flexShrink: 0 }}>0:{String(time || 24).padStart(2, '0')}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setRecState('idle')} style={{ width: 32, height: 32, borderRadius: '50%', background: '#F0F0F0', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED }}>
                  {Icons.trash}
                </button>
                <button onClick={() => setRecState('idle')} style={{ width: 32, height: 32, borderRadius: '50%', background: GRAD, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Empty chat detail panel ──────────────────────────────────────
function EmptyChatDetail() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: BG, gap: 16, padding: 40 }}>
      <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(0,178,255,0.12), rgba(182,32,224,0.12))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none"><path d="M21 15H7L3 21V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="url(#ecd)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><defs><linearGradient id="ecd" x1="3" y1="3" x2="21" y2="21"><stop stopColor="#00B2FF"/><stop offset="1" stopColor="#B620E0"/></linearGradient></defs></svg>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: TEXT }}>Your Messages</div>
        <div style={{ fontSize: 14, color: MUTED, marginTop: 6, lineHeight: 1.6 }}>Select a conversation from the left to start chatting.</div>
      </div>
      <GradientBtn label="New Message" icon={Icons.pencil} compact />
    </div>
  )
}

// ─── Screen router ────────────────────────────────────────────────
function renderChatPanel(screen: ChatScreen, opts: {
  compact?: boolean; onBack?: () => void
}) {
  switch (screen) {
    case 'dm': return <DMChatPanel {...opts} />
    case 'group': return <GroupChatPanel {...opts} />
    case 'voice': return <VoiceNotePanel compact={opts.compact} />
    default: return <EmptyChatDetail />
  }
}

// ─── Desktop layout (3-column) ────────────────────────────────────
function DesktopLayout({
  listState, chatScreen, selectedId, onSelectConversation, onSelectChat,
}: {
  listState: ListState; chatScreen: ChatScreen;
  selectedId: string; onSelectConversation: (id: string) => void;
  onSelectChat: (s: ChatScreen) => void;
}) {
  const sidebarItems = [
    { icon: Icons.chat, label: 'Chats', id: 'list', badge: 10 },
    { icon: Icons.community, label: 'Groups', id: 'community' },
    { icon: Icons.compass, label: 'Explore', id: 'explore' },
    { icon: Icons.profile, label: 'Profile', id: 'profile' },
  ]
  const [activeSide, setActiveSide] = useState('list')

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* Icon sidebar */}
      <div style={{ width: 70, background: CARD, borderRight: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0', gap: 4, flexShrink: 0 }}>
        {/* Logo */}
        <div style={{ width: 40, height: 40, borderRadius: 12, background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21 15H7L3 21V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        {sidebarItems.map(item => (
          <div key={item.id} onClick={() => setActiveSide(item.id)}>
            <SidebarIcon icon={item.icon} label={item.label} active={activeSide === item.id} badge={item.badge} />
          </div>
        ))}
        {/* Avatar at bottom */}
        <div style={{ marginTop: 'auto', paddingBottom: 8 }}>
          <Avatar name="Taylor Reeves" size={36} online />
        </div>
      </div>

      {/* Chat list */}
      <div style={{ width: 340, borderRight: `1px solid ${BORDER}`, flexShrink: 0, position: 'relative' }}>
        <ChatListPanel
          compact
          onSelectConversation={onSelectConversation}
          selectedId={selectedId}
          state={listState}
        />
        {/* FAB */}
        <button style={{
          position: 'absolute', bottom: 20, right: 16,
          width: 48, height: 48, borderRadius: '50%',
          background: GRAD, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(8,102,255,0.3)',
        }}>
          {Icons.plus}
        </button>
      </div>

      {/* Chat detail */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Sub-screen tabs for demo */}
        <div style={{ padding: '8px 16px', borderBottom: `1px solid ${BORDER}`, background: CARD, display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: MUTED, fontWeight: 500, marginRight: 4 }}>View:</span>
          {([
            { id: 'dm', label: '1-on-1 Chat' },
            { id: 'group', label: 'Group Chat' },
            { id: 'voice', label: 'Voice Notes' },
          ] as { id: ChatScreen; label: string }[]).map(s => (
            <button key={s.id} onClick={() => onSelectChat(s.id)}
              style={{
                background: chatScreen === s.id ? GRAD : BG,
                color: chatScreen === s.id ? '#fff' : MUTED,
                border: `1.5px solid ${chatScreen === s.id ? 'transparent' : BORDER}`,
                borderRadius: 9999, padding: '4px 12px',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}>
              {s.label}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {chatScreen === 'list' ? <EmptyChatDetail /> : renderChatPanel(chatScreen, { compact: false })}
        </div>
      </div>
    </div>
  )
}

// ─── Tablet layout (2-column) ─────────────────────────────────────
function TabletLayout({
  listState, chatScreen, selectedId, onSelectConversation, onSelectChat,
}: {
  listState: ListState; chatScreen: ChatScreen;
  selectedId: string; onSelectConversation: (id: string) => void;
  onSelectChat: (s: ChatScreen) => void;
}) {
  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* Chat list */}
      <div style={{ width: 300, borderRight: `1px solid ${BORDER}`, flexShrink: 0, position: 'relative' }}>
        <ChatListPanel compact onSelectConversation={onSelectConversation} selectedId={selectedId} state={listState} />
        <button style={{ position: 'absolute', bottom: 16, right: 12, width: 44, height: 44, borderRadius: '50%', background: GRAD, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(8,102,255,0.28)' }}>
          {Icons.plus}
        </button>
      </div>

      {/* Detail */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Sub tabs */}
        <div style={{ padding: '8px 14px', borderBottom: `1px solid ${BORDER}`, background: CARD, display: 'flex', gap: 5 }}>
          {([
            { id: 'dm', label: '1-on-1' },
            { id: 'group', label: 'Group' },
            { id: 'voice', label: 'Voice' },
          ] as { id: ChatScreen; label: string }[]).map(s => (
            <button key={s.id} onClick={() => onSelectChat(s.id)}
              style={{ background: chatScreen === s.id ? GRAD : BG, color: chatScreen === s.id ? '#fff' : MUTED, border: `1.5px solid ${chatScreen === s.id ? 'transparent' : BORDER}`, borderRadius: 9999, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              {s.label}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {chatScreen === 'list' ? <EmptyChatDetail /> : renderChatPanel(chatScreen, { compact: true })}
        </div>
      </div>
    </div>
  )
}

// ─── Mobile layout (single-column) ───────────────────────────────
function MobileLayout({
  listState, chatScreen, selectedId, onSelectConversation, onSelectChat,
}: {
  listState: ListState; chatScreen: ChatScreen;
  selectedId: string; onSelectConversation: (id: string) => void;
  onSelectChat: (s: ChatScreen) => void;
}) {
  const showChat = selectedId && chatScreen !== ('list' as ChatScreen)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {showChat ? (
        <>
          {/* Chat sub-tabs on mobile */}
          <div style={{ padding: '6px 12px', borderBottom: `1px solid ${BORDER}`, background: CARD, display: 'flex', gap: 4 }}>
            {([
              { id: 'dm', label: '1-on-1' },
              { id: 'group', label: 'Group' },
              { id: 'voice', label: 'Voice' },
            ] as { id: ChatScreen; label: string }[]).map(s => (
              <button key={s.id} onClick={() => onSelectChat(s.id)}
                style={{ background: chatScreen === s.id ? GRAD : BG, color: chatScreen === s.id ? '#fff' : MUTED, border: `1.5px solid ${chatScreen === s.id ? 'transparent' : BORDER}`, borderRadius: 9999, padding: '3px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                {s.label}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {renderChatPanel(chatScreen, {
              compact: true,
              onBack: () => onSelectConversation(''),
            })}
          </div>
        </>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
          <ChatListPanel
            onSelectConversation={(id) => { onSelectConversation(id); onSelectChat('dm') }}
            selectedId={selectedId}
            state={listState}
          />
          <button style={{ position: 'absolute', bottom: 20, right: 20, width: 52, height: 52, borderRadius: '50%', background: GRAD, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(8,102,255,0.35)' }}>
            {Icons.plus}
          </button>
        </div>
      )}

      {/* Bottom tab bar */}
      <div style={{ background: CARD, borderTop: `1px solid ${BORDER}`, display: 'flex', padding: '6px 0 18px', flexShrink: 0 }}>
        {[
          { icon: Icons.chat, label: 'Chats', badge: 10, id: 'chats' },
          { icon: Icons.community, label: 'Groups', id: 'groups' },
          { icon: Icons.compass, label: 'Explore', id: 'explore' },
          { icon: Icons.profile, label: 'Profile', id: 'profile' },
        ].map((t, i) => (
          <button key={t.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', color: i === 0 ? '#0866FF' : MUTED, fontFamily: 'inherit', position: 'relative', padding: '4px 0' }}>
            {t.badge && i !== 0 && <span style={{ position: 'absolute', top: 0, left: '55%', background: '#FA383E', color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 9999, minWidth: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>{t.badge}</span>}
            {t.icon}
            <span style={{ fontSize: 10, fontWeight: i === 0 ? 600 : 400 }}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Device frame ─────────────────────────────────────────────────
function DeviceFrame({ bp, children }: { bp: Breakpoint; children: React.ReactNode }) {
  const configs = {
    mobile: { w: 390, h: 780, scale: 0.78, rounded: 44, chrome: false, isMobile: true },
    tablet: { w: 834, h: 680, scale: 0.7, rounded: 12, chrome: true, isMobile: false },
    desktop: { w: 1280, h: 680, scale: 0.62, rounded: 10, chrome: true, isMobile: false },
  }
  const { w, h, scale, rounded, chrome, isMobile } = configs[bp]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {chrome && (
        <div style={{
          width: w * scale, background: '#E0E2E6', borderRadius: `${rounded}px ${rounded}px 0 0`,
          padding: '9px 14px 8px', display: 'flex', alignItems: 'center', gap: 6,
          border: `1.5px solid #CCC`, borderBottom: 'none',
        }}>
          {['#FA383E', '#F7B928', '#31A24C'].map((c, i) => <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
          <div style={{ flex: 1, background: '#fff', borderRadius: 6, height: 22, display: 'flex', alignItems: 'center', paddingLeft: 10, fontSize: 11, color: MUTED, marginLeft: 8 }}>mychatapp.io</div>
        </div>
      )}
      <div style={{
        width: w * scale, height: h * scale,
        border: isMobile ? `8px solid #1A1A1A` : `1.5px solid #CCC`,
        borderTop: isMobile ? `8px solid #1A1A1A` : (chrome ? 'none' : `1.5px solid #CCC`),
        borderRadius: isMobile ? rounded : (chrome ? `0 0 ${rounded}px ${rounded}px` : rounded),
        overflow: 'hidden',
        boxShadow: isMobile ? '0 24px 64px rgba(0,0,0,0.28), inset 0 0 0 1px rgba(255,255,255,0.06)' : '0 8px 32px rgba(0,0,0,0.14)',
        background: BG,
        position: 'relative',
      }}>
        {isMobile && (
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 90, height: 22, background: '#1A1A1A', borderRadius: '0 0 14px 14px', zIndex: 20 }} />
        )}
        <div style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: 'top left', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {isMobile && <div style={{ height: 36, flexShrink: 0, background: CARD, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', fontSize: 12, fontWeight: 600 }}><span>9:41</span><span style={{ letterSpacing: 2 }}>●●●</span></div>}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {children}
          </div>
        </div>
      </div>
      {isMobile && <div style={{ width: 100, height: 4, borderRadius: 2, background: '#1A1A1A', opacity: 0.4, marginTop: 6 }} />}
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────
export default function ChatExperience() {
  const [bp, setBp] = useState<Breakpoint>('desktop')
  const [listState, setListState] = useState<ListState>('normal')
  const [selectedId, setSelectedId] = useState('1')
  const [chatScreen, setChatScreen] = useState<ChatScreen>('dm')

  const handleSelectConv = (id: string) => {
    setSelectedId(id)
    if (id === '') setChatScreen('list')
  }

  const bpLabels: Record<Breakpoint, string> = {
    mobile: '390px — Mobile',
    tablet: '834px — Tablet',
    desktop: '1440px — Desktop',
  }

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: BG, minHeight: '100vh' }}>
      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.85); }
        }
      `}</style>

      {/* Hero band */}
      <div style={{ background: GRAD, padding: '20px 40px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>Chat Experience</h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: '3px 0 0' }}>4 screens · 3 breakpoints · voice notes · group chat</p>
          </div>

          {/* Controls row */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Breakpoint */}
            <div style={{ display: 'flex', gap: 3, background: 'rgba(255,255,255,0.15)', borderRadius: 9999, padding: 4 }}>
              {(['mobile', 'tablet', 'desktop'] as Breakpoint[]).map(b => (
                <button key={b} onClick={() => setBp(b)}
                  style={{ background: bp === b ? '#fff' : 'transparent', color: bp === b ? '#0866FF' : 'rgba(255,255,255,0.85)', border: 'none', borderRadius: 9999, padding: '5px 14px', fontSize: 13, fontWeight: bp === b ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize', transition: 'all 0.15s' }}>
                  {b}
                </button>
              ))}
            </div>
            {/* List state */}
            <div style={{ display: 'flex', gap: 3, background: 'rgba(255,255,255,0.15)', borderRadius: 9999, padding: 4 }}>
              {([
                { id: 'normal', label: 'Normal' },
                { id: 'skeleton', label: 'Loading' },
                { id: 'empty', label: 'Empty' },
              ] as { id: ListState; label: string }[]).map(s => (
                <button key={s.id} onClick={() => setListState(s.id)}
                  style={{ background: listState === s.id ? '#fff' : 'transparent', color: listState === s.id ? '#0866FF' : 'rgba(255,255,255,0.85)', border: 'none', borderRadius: 9999, padding: '5px 12px', fontSize: 13, fontWeight: listState === s.id ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Frame area */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '40px 40px 80px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <DeviceFrame bp={bp}>
          {bp === 'desktop' && (
            <DesktopLayout
              listState={listState} chatScreen={chatScreen}
              selectedId={selectedId}
              onSelectConversation={handleSelectConv}
              onSelectChat={setChatScreen}
            />
          )}
          {bp === 'tablet' && (
            <TabletLayout
              listState={listState} chatScreen={chatScreen}
              selectedId={selectedId}
              onSelectConversation={handleSelectConv}
              onSelectChat={setChatScreen}
            />
          )}
          {bp === 'mobile' && (
            <MobileLayout
              listState={listState} chatScreen={chatScreen}
              selectedId={selectedId}
              onSelectConversation={handleSelectConv}
              onSelectChat={setChatScreen}
            />
          )}
        </DeviceFrame>

        <p style={{ fontSize: 13, color: MUTED, textAlign: 'center' }}>
          {bpLabels[bp]} — use the controls above to switch breakpoints, list states, and chat types
        </p>
      </div>
    </div>
  )
}
