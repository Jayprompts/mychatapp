import { useState, useEffect, useRef } from 'react'

// ─── Tokens ───────────────────────────────────────────────────────
const GRAD    = 'linear-gradient(135deg, #00B2FF 0%, #B620E0 100%)'
const PRIMARY = '#0866FF'
const BG      = '#F7F8FA'
const CARD    = '#FFFFFF'
const TEXT    = '#050505'
const SUB     = '#3C4043'
const MUTED   = '#65676B'
const BORDER  = '#E4E6EB'
const SUCCESS = '#31A24C'
const ERROR   = '#FA383E'
const WARNING = '#F7B928'
const SIDEBAR = '#1C1E21'

type Breakpoint = 'mobile' | 'tablet' | 'desktop'
type Demo = 'notifications' | 'toast' | 'push-permission' | 'search'

// ─── Avatar helper ────────────────────────────────────────────────
const PALETTE = ['#0866FF','#B620E0','#00B2FF','#31A24C','#F7B928','#FA383E','#8B5CF6','#EC4899']
const ac = (n: string) => PALETTE[n.charCodeAt(0) % PALETTE.length]

function Av({ name, size = 36, gradient }: { name: string; size?: number; gradient?: boolean }) {
  const bg = gradient ? GRAD : ac(name)
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.37, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
      {name.split(' ').map(w => w[0]).join('').slice(0, 2)}
    </div>
  )
}

// ─── Shared shell sidebar (matches ChatExperience) ────────────────
function Sidebar({ compact = false }: { compact?: boolean }) {
  const NAV = [
    { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><polyline points="9,22 9,12 15,12 15,22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>, label: 'Home',  active: false },
    { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21 15H7L3 21V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>, label: 'Chat',  active: true  },
    { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>, label: 'Communities', active: false },
    { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/></svg>, label: 'Profile', active: false },
  ]
  return (
    <div style={{ width: compact ? 60 : 220, background: SIDEBAR, display: 'flex', flexDirection: 'column', alignItems: compact ? 'center' : 'stretch', padding: compact ? '14px 0' : '14px 0', flexShrink: 0 }}>
      <div style={{ marginBottom: 20, padding: compact ? 0 : '0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 15H7L3 21V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
        </div>
        {!compact && <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>MyChatApp</span>}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, padding: '0 8px' }}>
        {NAV.map(n => (
          <div key={n.label} style={{ display: 'flex', alignItems: 'center', gap: compact ? 0 : 10, justifyContent: compact ? 'center' : 'flex-start', background: n.active ? 'rgba(255,255,255,0.1)' : 'transparent', color: n.active ? '#fff' : 'rgba(255,255,255,0.5)', borderRadius: 10, padding: compact ? '12px 0' : '10px 12px', cursor: 'pointer' }}>
            {n.icon}
            {!compact && <span style={{ fontSize: 13, fontWeight: n.active ? 600 : 400 }}>{n.label}</span>}
          </div>
        ))}
      </div>
      <div style={{ padding: compact ? '10px 0 0' : '10px 16px 0', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: compact ? 0 : 8, justifyContent: compact ? 'center' : 'flex-start' }}>
        <Av name="AJ" size={28} gradient />
        {!compact && <div><div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>Alex Johnson</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>@alexjohnson</div></div>}
      </div>
    </div>
  )
}

// ─── Top bar (with bell + search trigger) ─────────────────────────
function TopBar({ onBell, onSearch, bellOpen, searchOpen }: {
  onBell: () => void; onSearch: () => void; bellOpen?: boolean; searchOpen?: boolean
}) {
  return (
    <div style={{ height: 52, background: CARD, borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', flexShrink: 0, position: 'relative', zIndex: 20 }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>Chats</span>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {/* Search icon */}
        <button onClick={onSearch} style={{ width: 34, height: 34, borderRadius: '50%', background: searchOpen ? 'rgba(8,102,255,0.08)' : BG, border: `1px solid ${searchOpen ? PRIMARY : BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke={searchOpen ? PRIMARY : MUTED} strokeWidth="1.8"/><path d="M21 21l-4.35-4.35" stroke={searchOpen ? PRIMARY : MUTED} strokeWidth="1.8" strokeLinecap="round"/></svg>
        </button>
        {/* Bell icon */}
        <div style={{ position: 'relative' }}>
          <button onClick={onBell} style={{ width: 34, height: 34, borderRadius: '50%', background: bellOpen ? 'rgba(8,102,255,0.08)' : BG, border: `1px solid ${bellOpen ? PRIMARY : BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke={bellOpen ? PRIMARY : MUTED} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          {/* Unread badge */}
          {!bellOpen && <span style={{ position: 'absolute', top: 3, right: 3, width: 8, height: 8, borderRadius: '50%', background: ERROR, border: '1.5px solid #fff' }} />}
        </div>
        <Av name="Alex Johnson" size={30} />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 1. NOTIFICATION CENTER
// ═══════════════════════════════════════════════════════════════════

type Notif = {
  id: string; type: 'message' | 'join' | 'like' | 'comment' | 'mention'
  user: string; text: string; time: string; read: boolean
}

const NOTIFS: Notif[] = [
  { id: 'n1', type: 'message',  user: 'Jordan Kim',    text: 'Hey! Want to catch up this weekend? 👋',                 time: '2m ago',   read: false },
  { id: 'n2', type: 'mention',  user: 'Maria Garcia',  text: 'mentioned you in Design Guild: "Ask @alexjohnson"',      time: '14m ago',  read: false },
  { id: 'n3', type: 'like',     user: 'Taylor Reeves', text: 'liked your post "Building Real-Time Chat…"',             time: '1h ago',   read: false },
  { id: 'n4', type: 'join',     user: 'Sam Lee',       text: 'joined Engineering Hub — a community you manage',         time: '3h ago',   read: false },
  { id: 'n5', type: 'comment',  user: 'Ben Carter',    text: 'commented: "Great deep dive! Bookmarked for later."',    time: '5h ago',   read: true },
  { id: 'n6', type: 'like',     user: 'Robin Chen',    text: 'liked your post "Gradient Systems That Scale…"',         time: 'Yesterday', read: true },
  { id: 'n7', type: 'join',     user: 'Dana Park',     text: 'joined Design Guild — a community you manage',            time: 'Yesterday', read: true },
  { id: 'n8', type: 'message',  user: 'Alex Johnson',  text: 'Your weekly summary is ready — 38 new connections',     time: '2d ago',   read: true },
]

function notifIcon(type: Notif['type']) {
  const configs = {
    message: { bg: '#EEF3FF', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 15H7L3 21V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke={PRIMARY} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    mention: { bg: `rgba(182,32,224,0.1)`, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4" stroke="#B620E0" strokeWidth="1.8"/><path d="M16 12v1.5a2.5 2.5 0 005 0V12a9 9 0 10-5.39 8.19" stroke="#B620E0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    like:    { bg: `rgba(250,56,62,0.08)`, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke={ERROR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    comment: { bg: `rgba(49,162,76,0.1)`, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke={SUCCESS} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    join:    { bg: `rgba(247,185,40,0.12)`, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke={WARNING} strokeWidth="1.8" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke={WARNING} strokeWidth="1.8"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke={WARNING} strokeWidth="1.8" strokeLinecap="round"/></svg> },
  }
  const c = configs[type]
  return (
    <div style={{ width: 30, height: 30, borderRadius: '50%', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {c.icon}
    </div>
  )
}

function NotifRow({ n, onRead }: { n: Notif; onRead: (id: string) => void }) {
  return (
    <div
      onClick={() => onRead(n.id)}
      style={{ display: 'flex', gap: 10, padding: '12px 16px', cursor: 'pointer', background: n.read ? 'transparent' : 'rgba(8,102,255,0.03)', borderBottom: `1px solid ${BORDER}`, transition: 'background 0.1s', alignItems: 'flex-start' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = BG}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = n.read ? 'transparent' : 'rgba(8,102,255,0.03)'}
    >
      {/* Avatar stack */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <Av name={n.user} size={38} />
        <div style={{ position: 'absolute', bottom: -2, right: -2 }}>{notifIcon(n.type)}</div>
      </div>
      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, color: TEXT, margin: 0, lineHeight: 1.5 }}>
          <strong style={{ fontWeight: 700 }}>{n.user}</strong>{' '}
          <span style={{ color: SUB }}>{n.text}</span>
        </p>
        <span style={{ fontSize: 11, color: n.read ? MUTED : PRIMARY, fontWeight: n.read ? 400 : 600, marginTop: 3, display: 'block' }}>{n.time}</span>
      </div>
      {/* Unread dot */}
      {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: GRAD, flexShrink: 0, marginTop: 6 }} />}
    </div>
  )
}

// Dropdown panel (desktop/tablet)
function NotifDropdown({ notifs, onRead, onReadAll, onClose }: {
  notifs: Notif[]; onRead: (id: string) => void; onReadAll: () => void; onClose: () => void
}) {
  const unread = notifs.filter(n => !n.read).length
  return (
    <div style={{ position: 'absolute', top: '100%', right: 0, width: 360, background: CARD, borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: '0 12px 40px rgba(0,0,0,0.16)', zIndex: 100, overflow: 'hidden', marginTop: 8 }}>
      {/* Header */}
      <div style={{ padding: '14px 16px 10px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: TEXT }}>Notifications</span>
          {unread > 0 && (
            <span style={{ background: GRAD, color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 9999, padding: '1px 7px' }}>{unread}</span>
          )}
        </div>
        <button onClick={onReadAll} style={{ fontSize: 12, color: PRIMARY, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
          Mark all read
        </button>
      </div>

      {/* Tabs — Today / Earlier */}
      <div style={{ maxHeight: 440, overflowY: 'auto' }}>
        <div style={{ padding: '8px 16px 4px', fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8 }}>Today</div>
        {notifs.slice(0, 4).map(n => <NotifRow key={n.id} n={n} onRead={onRead} />)}
        <div style={{ padding: '10px 16px 4px', fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8 }}>Earlier</div>
        {notifs.slice(4).map(n => <NotifRow key={n.id} n={n} onRead={onRead} />)}
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 16px', borderTop: `1px solid ${BORDER}`, textAlign: 'center' }}>
        <button style={{ fontSize: 13, color: PRIMARY, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
          See all notifications →
        </button>
      </div>
    </div>
  )
}

// Full screen (mobile)
function NotifFullScreen({ notifs, onRead, onReadAll, onBack }: {
  notifs: Notif[]; onRead: (id: string) => void; onReadAll: () => void; onBack: () => void
}) {
  const unread = notifs.filter(n => !n.read).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: BG }}>
      {/* Header */}
      <div style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke={TEXT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>Notifications</span>
          {unread > 0 && <span style={{ marginLeft: 8, background: GRAD, color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 9999, padding: '1px 7px' }}>{unread}</span>}
        </div>
        <button onClick={onReadAll} style={{ fontSize: 12, color: PRIMARY, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
          Mark all read
        </button>
      </div>

      {unread === 0 ? (
        /* Empty state */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(8,102,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke={PRIMARY} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: TEXT, margin: '0 0 8px' }}>You're all caught up</h3>
          <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6, maxWidth: 240 }}>
            No new notifications. Check back when someone reaches out!
          </p>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: '10px 16px 4px', fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8, background: BG }}>Today</div>
          <div style={{ background: CARD }}>
            {notifs.slice(0, 4).map(n => <NotifRow key={n.id} n={n} onRead={onRead} />)}
          </div>
          <div style={{ padding: '10px 16px 4px', fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8, background: BG }}>Earlier</div>
          <div style={{ background: CARD }}>
            {notifs.slice(4).map(n => <NotifRow key={n.id} n={n} onRead={onRead} />)}
          </div>
        </div>
      )}
    </div>
  )
}

// Notification Center Demo — complete shell with dropdown/fullscreen
function NotificationCenterDemo({ bp }: { bp: Breakpoint }) {
  const [notifs, setNotifs] = useState<Notif[]>(NOTIFS)
  const [bellOpen, setBellOpen] = useState(true)  // open by default in demo
  const [showFull, setShowFull] = useState(bp === 'mobile')

  const markRead = (id: string) => setNotifs(ns => ns.map(n => n.id === id ? { ...n, read: true } : n))
  const markAll  = ()           => setNotifs(ns => ns.map(n => ({ ...n, read: true })))

  const isMobile  = bp === 'mobile'
  const isDesktop = bp === 'desktop'

  // Chat list for background (abbreviated)
  const chatList = ['Jordan Kim', 'Design Guild', 'Taylor Reeves', 'Engineering Hub', 'Maria Garcia']

  const ChatListBg = () => (
    <div style={{ flex: 1, overflowY: 'auto', background: CARD }}>
      {chatList.map((name, i) => (
        <div key={name} style={{ display: 'flex', gap: 10, padding: '12px 16px', borderBottom: `1px solid ${BORDER}`, alignItems: 'center', opacity: bellOpen && !isMobile ? 0.4 : 1, transition: 'opacity 0.2s' }}>
          <Av name={name} size={42} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{name}</div>
            <div style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>Hey! Want to catch up?</div>
          </div>
          {i < 2 && <span style={{ fontSize: 11, fontWeight: 700, background: GRAD, color: '#fff', borderRadius: 9999, padding: '2px 7px' }}>{i + 1}</span>}
        </div>
      ))}
    </div>
  )

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: BG }}>
        {showFull ? (
          <NotifFullScreen
            notifs={notifs}
            onRead={markRead}
            onReadAll={markAll}
            onBack={() => setShowFull(false)}
          />
        ) : (
          <>
            <TopBar
              onBell={() => setShowFull(true)}
              onSearch={() => {}}
              bellOpen={false}
            />
            <ChatListBg />
            {/* Mobile bottom tab */}
            <div style={{ background: CARD, borderTop: `1px solid ${BORDER}`, height: 56, display: 'flex', flexShrink: 0 }}>
              {['Home','Chat','Explore','Profile'].map((t, i) => (
                <div key={t} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, color: i === 1 ? PRIMARY : MUTED }}>
                  <div style={{ width: 20, height: 20, borderRadius: 4, background: i === 1 ? 'rgba(8,102,255,0.12)' : BORDER, opacity: 0.6 }} />
                  <span style={{ fontSize: 9, fontWeight: i === 1 ? 700 : 400 }}>{t}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  // Desktop / tablet — dropdown overlaid on the list column
  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <Sidebar compact={!isDesktop} />
      <div style={{ flex: isDesktop ? '0 0 320px' : '0 0 280px', display: 'flex', flexDirection: 'column', borderRight: `1px solid ${BORDER}`, position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          <TopBar onBell={() => setBellOpen(o => !o)} onSearch={() => {}} bellOpen={bellOpen} />
          {bellOpen && (
            <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 50, padding: '0 8px' }}>
              <NotifDropdown notifs={notifs} onRead={markRead} onReadAll={markAll} onClose={() => setBellOpen(false)} />
            </div>
          )}
        </div>
        <ChatListBg />
      </div>
      {/* Detail pane placeholder */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: BG, opacity: bellOpen ? 0.4 : 1, transition: 'opacity 0.2s' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(8,102,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M21 15H7L3 21V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke={PRIMARY} strokeWidth="1.8" strokeLinecap="round"/></svg>
          </div>
          <p style={{ fontSize: 14, color: MUTED }}>Select a conversation</p>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 2. IN-APP TOAST NOTIFICATION
// ═══════════════════════════════════════════════════════════════════

// Blog feed background (abbreviated)
function BlogBg({ dimmed }: { dimmed: boolean }) {
  const posts = ['Building Real-Time Chat with WebSockets','Designing for Accessibility in Dark Mode','The Psychology of Push Notifications']
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: BG, opacity: dimmed ? 0.65 : 1, transition: 'opacity 0.3s' }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, overflowX: 'auto' }}>
        {['All','Engineering','Design','Product','Community'].map((tag, i) => (
          <span key={tag} style={{ background: i === 0 ? GRAD : CARD, color: i === 0 ? '#fff' : MUTED, borderRadius: 9999, padding: '6px 14px', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', border: `1px solid ${i === 0 ? 'transparent' : BORDER}`, cursor: 'pointer', boxShadow: i === 0 ? '0 2px 8px rgba(8,102,255,0.2)' : 'none' }}>{tag}</span>
        ))}
      </div>
      {posts.map((title, i) => (
        <div key={title} style={{ background: CARD, borderRadius: 16, border: `1px solid ${BORDER}`, padding: '16px', marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ height: 100, borderRadius: 10, background: GRAD, marginBottom: 14, opacity: 0.8 }} />
          <div style={{ height: 14, borderRadius: 4, background: BORDER, marginBottom: 8, width: '85%' }} />
          <div style={{ height: 12, borderRadius: 4, background: BORDER, marginBottom: 8, width: '60%', opacity: 0.7 }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <Av name="Alex Johnson" size={20} />
            <span style={{ fontSize: 12, color: MUTED }}>Alex Johnson · Sep {18 - i}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

// The actual toast component with slide-in animation
function Toast({ name, preview, fromTop, onDismiss, visible }: {
  name: string; preview: string; fromTop: boolean; onDismiss: () => void; visible: boolean
}) {
  return (
    <div style={{
      position: 'absolute',
      top: fromTop ? (visible ? 60 : -100) : undefined,
      right: fromTop ? 'auto' : (visible ? 16 : -400),
      left: fromTop ? 12 : 'auto',
      width: fromTop ? 'calc(100% - 24px)' : 320,
      background: '#1C1E21',
      borderRadius: 14,
      padding: '12px 14px',
      display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
      zIndex: 200,
      transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
      border: '1px solid rgba(255,255,255,0.08)',
      overflow: 'hidden',
    }}>
      {/* Gradient left accent */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: GRAD, borderRadius: '14px 0 0 14px' }} />
      <div style={{ marginLeft: 4 }}>
        <Av name={name} size={38} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2 }}>New message from {name}</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{preview}</div>
      </div>
      <button onClick={onDismiss} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round"/></svg>
      </button>
    </div>
  )
}

function ToastDemo({ bp }: { bp: Breakpoint }) {
  const [toastVisible, setToastVisible] = useState(true)
  const [toastKey, setToastKey] = useState(0)
  const isMobile = bp === 'mobile'
  const isDesktop = bp === 'desktop'

  const reshow = () => { setToastVisible(false); setTimeout(() => { setToastKey(k => k + 1); setToastVisible(true) }, 300) }

  useEffect(() => { const t = setTimeout(() => setToastVisible(true), 600); return () => clearTimeout(t) }, [])

  return (
    <div style={{ display: 'flex', height: '100%', position: 'relative' }}>
      {!isMobile && <Sidebar compact={!isDesktop} />}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
        {/* Simulated top bar for context */}
        <div style={{ height: 50, background: CARD, borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', padding: '0 18px', gap: 10, flexShrink: 0 }}>
          <div style={{ width: 80, height: 14, borderRadius: 4, background: BORDER, opacity: 0.8 }} />
          <div style={{ flex: 1 }} />
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: BORDER }} />
        </div>
        <BlogBg dimmed={toastVisible} />
        {/* Toast overlay */}
        <Toast
          key={toastKey}
          name="Jordan Kim"
          preview="Hey! Want to catch up this weekend? 👋"
          fromTop={isMobile}
          onDismiss={() => setToastVisible(false)}
          visible={toastVisible}
        />
        {/* Re-trigger button */}
        <div style={{ position: 'absolute', bottom: isMobile ? 70 : 20, left: '50%', transform: 'translateX(-50%)', zIndex: 300 }}>
          <button onClick={reshow} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 9999, padding: '8px 18px', fontSize: 12, fontWeight: 600, color: PRIMARY, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            ↺ Replay toast
          </button>
        </div>
      </div>
      {/* Mobile bottom tabs */}
      {isMobile && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: CARD, borderTop: `1px solid ${BORDER}`, height: 56, display: 'flex' }}>
          {['Home','Chat','Blog','Profile'].map((t, i) => (
            <div key={t} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, color: i === 2 ? PRIMARY : MUTED }}>
              <div style={{ width: 20, height: 20, borderRadius: 4, background: i === 2 ? 'rgba(8,102,255,0.12)' : BORDER, opacity: 0.6 }} />
              <span style={{ fontSize: 9, fontWeight: i === 2 ? 700 : 400 }}>{t}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 3. PUSH NOTIFICATION PERMISSION SCREEN
// ═══════════════════════════════════════════════════════════════════

function PushPermissionDemo({ bp }: { bp: Breakpoint }) {
  const [state, setState] = useState<'idle' | 'allowed' | 'denied'>('idle')
  const isMobile = bp === 'mobile'

  const benefits = [
    { icon: '💬', title: 'Never miss a message', sub: 'Instant alerts when someone DMs you' },
    { icon: '🔔', title: 'Community activity',    sub: 'Stay in the loop on posts you care about' },
    { icon: '📣', title: 'Mentions & replies',    sub: 'Get notified when someone tags you' },
  ]

  const Screen = () => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '32px 28px 80px' : '40px 48px', background: BG, textAlign: 'center' }}>
      {state === 'allowed' ? (
        /* Allowed success */
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(49,162,76,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke={SUCCESS} strokeWidth="1.8" strokeLinecap="round"/><polyline points="22,4 12,14.01 9,11.01" stroke={SUCCESS} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: TEXT, margin: '0 0 10px' }}>You're all set! 🎉</h2>
          <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.6 }}>Notifications enabled. We'll let you know when something important happens.</p>
          <button onClick={() => setState('idle')} style={{ marginTop: 28, background: GRAD, color: '#fff', border: 'none', borderRadius: 9999, padding: '12px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(8,102,255,0.25)' }}>Continue to App</button>
        </div>
      ) : state === 'denied' ? (
        /* Denied soft-state */
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(247,185,40,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke={WARNING} strokeWidth="1.6" strokeLinecap="round"/></svg>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: TEXT, margin: '0 0 10px' }}>Notifications paused</h2>
          <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6, maxWidth: 280, margin: '0 auto 20px' }}>You can enable them any time from Settings → Notifications.</p>
          <button onClick={() => setState('idle')} style={{ background: CARD, color: PRIMARY, border: `1.5px solid ${PRIMARY}`, borderRadius: 9999, padding: '11px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Back</button>
        </div>
      ) : (
        /* Default permission prompt */
        <>
          {/* Illustration */}
          <div style={{ position: 'relative', marginBottom: 32 }}>
            <div style={{ width: 96, height: 96, borderRadius: '50%', background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', boxShadow: '0 12px 40px rgba(8,102,255,0.3)' }}>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            {/* Floating notification pill */}
            <div style={{ position: 'absolute', top: -10, right: -16, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '6px 10px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>JK</div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: TEXT }}>Jordan Kim</div>
                <div style={{ fontSize: 10, color: MUTED }}>Hey! 👋</div>
              </div>
            </div>
            <div style={{ position: 'absolute', bottom: -8, left: -20, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '6px 10px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: 14 }}>♥</span>
              <span style={{ fontSize: 11, color: MUTED }}>Maria liked your post</span>
            </div>
          </div>

          <h1 style={{ fontSize: isMobile ? 22 : 24, fontWeight: 700, color: TEXT, margin: '0 0 10px' }}>Never miss a message</h1>
          <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.6, maxWidth: 300, margin: '0 auto 28px' }}>
            Enable notifications to stay connected with the people and communities you care about.
          </p>

          {/* Benefit list */}
          <div style={{ width: '100%', maxWidth: 360, marginBottom: 32 }}>
            {benefits.map(b => (
              <div key={b.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', textAlign: 'left' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: CARD, border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{b.icon}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{b.title}</div>
                  <div style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>{b.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={() => setState('allowed')} style={{ width: '100%', background: GRAD, color: '#fff', border: 'none', borderRadius: 9999, padding: '14px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(8,102,255,0.25)' }}>
              Allow Notifications
            </button>
            <button onClick={() => setState('denied')} style={{ width: '100%', background: 'transparent', color: MUTED, border: 'none', borderRadius: 9999, padding: '12px', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
              Not now
            </button>
          </div>

          {/* Fine print */}
          <p style={{ fontSize: 12, color: MUTED, marginTop: 20, maxWidth: 280, lineHeight: 1.6 }}>
            You can change notification preferences at any time in Settings.
          </p>
        </>
      )}
    </div>
  )

  // Mobile: full screen
  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ height: 52, background: CARD, borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', padding: '0 16px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: 7, background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M21 15H7L3 21V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>MyChatApp</span>
          </div>
        </div>
        <Screen />
      </div>
    )
  }

  // Tablet/Desktop: centered card inside shell
  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {!isMobile && <Sidebar compact={bp !== 'desktop'} />}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: BG, padding: 32 }}>
        <div style={{ background: CARD, borderRadius: 20, border: `1px solid ${BORDER}`, boxShadow: '0 8px 40px rgba(0,0,0,0.1)', width: '100%', maxWidth: 520, overflow: 'hidden' }}>
          <Screen />
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 4. GLOBAL SEARCH
// ═══════════════════════════════════════════════════════════════════

type SearchTab = 'people' | 'messages' | 'posts' | 'communities'

const SEARCH_RESULTS = {
  people: [
    { name: 'Jordan Kim',    sub: '@jordankim · 142 mutual connections',     role: 'Super Admin' },
    { name: 'Maria Garcia',  sub: '@mariagarcia · Design Guild member',       role: '' },
    { name: 'Taylor Reeves', sub: '@taylorreeves · Content Moderator',        role: '' },
    { name: 'Robin Chen',    sub: '@robinchen · Engineering Hub member',      role: '' },
  ],
  messages: [
    { from: 'Jordan Kim',    text: 'Hey! Want to catch up this weekend? 👋',         time: '2m ago' },
    { from: 'Design Guild',  text: 'Alex Johnson: Great work on the gradient system', time: '1h ago' },
    { from: 'Taylor Reeves', text: 'Did you see the new Figma update? 👀',           time: '3h ago' },
  ],
  posts: [
    { title: 'Building Real-Time Chat with WebSockets', author: 'Jordan Kim',    date: 'Sep 18', likes: 342 },
    { title: 'Designing for Accessibility in Dark Mode',  author: 'Taylor Reeves', date: 'Sep 15', likes: 218 },
    { title: 'The Psychology of Push Notifications',      author: 'Alex Johnson',  date: 'Sep 12', likes: 189 },
  ],
  communities: [
    { name: 'Design Guild',     members: '2,840', tag: 'Design',      active: true },
    { name: 'Engineering Hub',  members: '5,120', tag: 'Engineering', active: true },
    { name: 'Product Thinkers', members: '1,490', tag: 'Product',     active: false },
  ],
}

const TAG_COLORS: Record<string, string> = {
  'Design': '#8B5CF6', 'Engineering': PRIMARY, 'Product': SUCCESS, 'Community': WARNING,
}

function SearchOverlay({ bp, query }: { bp: Breakpoint; query: string }) {
  const [activeTab, setActiveTab] = useState<SearchTab>('people')
  const isMobile = bp === 'mobile'
  const tabs: { id: SearchTab; label: string }[] = [
    { id: 'people',      label: 'People' },
    { id: 'messages',    label: 'Messages' },
    { id: 'posts',       label: 'Posts' },
    { id: 'communities', label: 'Communities' },
  ]
  const hasQuery = query.length > 0

  const renderResults = () => {
    if (!hasQuery) {
      // Recent searches / suggestions
      return (
        <div style={{ padding: '8px 0' }}>
          <div style={{ padding: '8px 18px', fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8 }}>Recent searches</div>
          {['Jordan Kim', 'Design Guild', 'WebSockets chat'].map(r => (
            <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', cursor: 'pointer' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: BORDER, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke={MUTED} strokeWidth="1.8"/><path d="M21 21l-4.35-4.35" stroke={MUTED} strokeWidth="1.8" strokeLinecap="round"/></svg>
              </div>
              <span style={{ fontSize: 14, color: TEXT }}>{r}</span>
              <div style={{ marginLeft: 'auto', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke={MUTED} strokeWidth="2" strokeLinecap="round"/></svg>
              </div>
            </div>
          ))}
          <div style={{ padding: '16px 18px 8px', fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8 }}>Trending in your communities</div>
          {['Figma variables deep-dive','WWDC 2026 highlights','Tailwind v5 beta'].map(t => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', cursor: 'pointer' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(8,102,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 14 }}>🔥</span>
              </div>
              <span style={{ fontSize: 14, color: TEXT }}>{t}</span>
            </div>
          ))}
        </div>
      )
    }

    switch (activeTab) {
      case 'people': return (
        <div>
          {SEARCH_RESULTS.people.map(p => (
            <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', cursor: 'pointer', borderBottom: `1px solid ${BORDER}` }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = BG}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
              <Av name={p.name} size={40} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{p.name}</div>
                <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{p.sub}</div>
              </div>
              <button style={{ background: GRAD, color: '#fff', border: 'none', borderRadius: 9999, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(8,102,255,0.2)', whiteSpace: 'nowrap' }}>
                Follow
              </button>
            </div>
          ))}
        </div>
      )
      case 'messages': return (
        <div>
          {SEARCH_RESULTS.messages.map(m => (
            <div key={m.from} style={{ display: 'flex', gap: 12, padding: '12px 18px', cursor: 'pointer', borderBottom: `1px solid ${BORDER}`, alignItems: 'flex-start' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = BG}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
              <Av name={m.from} size={38} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{m.from}</span>
                  <span style={{ fontSize: 11, color: MUTED }}>{m.time}</span>
                </div>
                <div style={{ fontSize: 13, color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.text}</div>
              </div>
            </div>
          ))}
        </div>
      )
      case 'posts': return (
        <div>
          {SEARCH_RESULTS.posts.map(p => (
            <div key={p.title} style={{ display: 'flex', gap: 12, padding: '12px 18px', cursor: 'pointer', borderBottom: `1px solid ${BORDER}`, alignItems: 'center' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = BG}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
              <div style={{ width: 48, height: 40, borderRadius: 8, background: GRAD, flexShrink: 0, opacity: 0.85 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                <div style={{ fontSize: 12, color: MUTED, marginTop: 3, display: 'flex', gap: 10 }}>
                  <span>{p.author}</span><span>·</span><span>{p.date}</span><span>·</span><span>♥ {p.likes}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )
      case 'communities': return (
        <div>
          {SEARCH_RESULTS.communities.map(c => (
            <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', cursor: 'pointer', borderBottom: `1px solid ${BORDER}` }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = BG}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: GRAD, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{c.name}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 3, alignItems: 'center' }}>
                  <span style={{ background: `${TAG_COLORS[c.tag] ?? MUTED}18`, color: TAG_COLORS[c.tag] ?? MUTED, fontSize: 11, fontWeight: 600, borderRadius: 4, padding: '1px 6px' }}>{c.tag}</span>
                  <span style={{ fontSize: 12, color: MUTED }}>{c.members} members</span>
                </div>
              </div>
              <button style={{ background: c.active ? CARD : GRAD, color: c.active ? PRIMARY : '#fff', border: `1.5px solid ${c.active ? PRIMARY : 'transparent'}`, borderRadius: 9999, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                {c.active ? 'Joined' : 'Join'}
              </button>
            </div>
          ))}
        </div>
      )
      default: return null
    }
  }

  const noResults = hasQuery && query.length > 3

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: CARD }}>
      {/* Search input bar */}
      <div style={{ padding: isMobile ? '10px 14px' : '12px 18px', borderBottom: `1px solid ${BORDER}`, background: CARD, flexShrink: 0, display: 'flex', gap: 10, alignItems: 'center' }}>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0, padding: 4 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke={TEXT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: BG, borderRadius: 12, padding: '9px 14px', border: `1.5px solid ${PRIMARY}`, boxShadow: '0 0 0 3px rgba(8,102,255,0.1)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke={PRIMARY} strokeWidth="1.8"/><path d="M21 21l-4.35-4.35" stroke={PRIMARY} strokeWidth="1.8" strokeLinecap="round"/></svg>
          <span style={{ fontSize: 15, color: query ? TEXT : MUTED, flex: 1 }}>{query || 'Search people, chats, posts…'}</span>
          {query && (
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: MUTED, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/></svg>
            </div>
          )}
        </div>
      </div>

      {/* Tabs (scrollable on mobile) */}
      {hasQuery && (
        <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER}`, overflowX: 'auto', flexShrink: 0, background: CARD }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{ flex: isMobile ? '0 0 auto' : 1, padding: '11px 16px', fontSize: 13, fontWeight: activeTab === t.id ? 700 : 500, color: activeTab === t.id ? PRIMARY : MUTED, background: 'none', border: 'none', borderBottom: `2px solid ${activeTab === t.id ? PRIMARY : 'transparent'}`, marginBottom: -1, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Results / suggestions */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {noResults && activeTab === 'people' && SEARCH_RESULTS.people.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: TEXT, margin: '0 0 8px' }}>No results found</h3>
            <p style={{ fontSize: 14, color: MUTED }}>Try a different search term</p>
          </div>
        ) : renderResults()}
      </div>
    </div>
  )
}

function GlobalSearchDemo({ bp }: { bp: Breakpoint }) {
  const [query, setQuery] = useState('design')
  const isMobile = bp === 'mobile'
  const isDesktop = bp === 'desktop'

  return (
    <div style={{ display: 'flex', height: '100%', position: 'relative' }}>
      {!isMobile && <Sidebar compact={!isDesktop} />}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
        {/* Faded background — chat list */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.2, pointerEvents: 'none' }}>
          <BlogBg dimmed={false} />
        </div>
        {/* Search overlay — full screen */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
          <SearchOverlay bp={bp} query={query} />
        </div>
      </div>
    </div>
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
          {C.mobile && (
            <div style={{ height: 44, background: '#1C1C1E', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>9:41</span>
              <span style={{ fontSize: 11, color: '#fff', letterSpacing: 2 }}>●●●</span>
            </div>
          )}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {children}
          </div>
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
  { id: 'notifications',   label: 'Notification Center', desc: 'Dropdown (desktop/tablet) · Full screen (mobile)' },
  { id: 'toast',           label: 'Toast Notification',  desc: 'Slide-in overlay · Dismissible · With replay' },
  { id: 'push-permission', label: 'Push Permission',     desc: 'Onboarding pre-prompt · Allow / Not now states' },
  { id: 'search',          label: 'Global Search',       desc: 'Full-screen overlay · Tabbed results · Empty state' },
]

export default function NotificationsAndSearch() {
  const [activeDemo, setActiveDemo] = useState<Demo>('notifications')

  const renderDemo = (bp: Breakpoint) => {
    switch (activeDemo) {
      case 'notifications':   return <NotificationCenterDemo bp={bp} />
      case 'toast':           return <ToastDemo bp={bp} />
      case 'push-permission': return <PushPermissionDemo bp={bp} />
      case 'search':          return <GlobalSearchDemo bp={bp} />
    }
  }

  const current = DEMOS.find(d => d.id === activeDemo)!

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: BG, minHeight: '100vh' }}>
      {/* Control strip */}
      <div style={{ background: GRAD, padding: '20px 40px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>Notifications & Search</h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: '3px 0 0' }}>{current.desc}</p>
          </div>
          <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 9999, padding: 4, flexWrap: 'wrap' }}>
            {DEMOS.map(d => (
              <button key={d.id} onClick={() => setActiveDemo(d.id)}
                style={{ background: activeDemo === d.id ? '#fff' : 'transparent', color: activeDemo === d.id ? PRIMARY : 'rgba(255,255,255,0.85)', border: 'none', borderRadius: 9999, padding: '6px 14px', fontSize: 13, fontWeight: activeDemo === d.id ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
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
              <DeviceFrame bp={bp}>
                {renderDemo(bp)}
              </DeviceFrame>
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
