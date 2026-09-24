import { useState, useRef } from 'react'

// ─── Design Tokens ────────────────────────────────────────────────
const PRIMARY     = '#0866FF'
const BG          = '#F4F5F7'
const CARD        = '#FFFFFF'
const TEXT        = '#050505'
const SUB         = '#3C3D40'
const MUTED       = '#65676B'
const BORDER      = '#E4E6EB'
const DIVIDER     = '#ECEEF2'
const SIDEBAR_BG  = '#1C1E21'
const SIDEBAR_HOV = '#2D2F33'
const SIDEBAR_ACT = '#3A3C42'
const SIDEBAR_TXT = '#D0D2D6'
const SIDEBAR_MUT = '#8A8C91'
const SUCCESS     = '#31A24C'
const WARNING     = '#F7B928'
const ERROR       = '#FA383E'
const GRAD        = 'linear-gradient(135deg, #00B2FF 0%, #B620E0 100%)'

// ─── Types ────────────────────────────────────────────────────────
type Bp = 'mobile' | 'tablet' | 'desktop'
type DemoId = 'confirm-modals' | 'reports-queue' | 'audit-log' | 'sign-out' | 'account-settings' | 'bulk-actions'
type AdminScreen = 'home' | 'users' | 'blogs' | 'communities' | 'roles' | 'reports' | 'audit' | 'settings'

// ─── Shared micro-components ──────────────────────────────────────
const ac = (name: string) => {
  const p = ['#0866FF', '#B620E0', '#00B2FF', '#31A24C', '#F7B928', '#FA383E', '#8B5CF6', '#EC4899']
  return p[name.charCodeAt(0) % p.length]
}

function Av({ name, size = 28 }: { name: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: 9999, background: ac(name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 700, color: '#fff', flexShrink: 0, fontFamily: 'inherit' }}>
      {name.split(' ').map(n => n[0]).join('').slice(0, 2)}
    </div>
  )
}

function THead({ cols, hasCheck = false }: { cols: string[]; hasCheck?: boolean }) {
  return (
    <thead>
      <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
        {hasCheck && <th style={{ padding: '9px 12px', width: 36, background: BG }} />}
        {cols.map((c, i) => (
          <th key={i} style={{ padding: '9px 12px', fontSize: 11, fontWeight: 700, color: MUTED, textAlign: 'left', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: 0.5, background: BG }}>
            {c}
          </th>
        ))}
      </tr>
    </thead>
  )
}

function TR({ children, selected, onClick }: { children: React.ReactNode; selected?: boolean; onClick?: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <tr
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
      style={{ background: selected ? 'rgba(8,102,255,0.05)' : hov ? '#FAFBFC' : CARD, borderBottom: `1px solid ${DIVIDER}`, transition: 'background 0.08s', cursor: onClick ? 'pointer' : 'default' }}>
      {children}
    </tr>
  )
}

function TD({ children, muted = false, nowrap = false }: { children: React.ReactNode; muted?: boolean; nowrap?: boolean }) {
  return <td style={{ padding: '9px 12px', fontSize: 13, color: muted ? MUTED : TEXT, verticalAlign: 'middle', whiteSpace: nowrap ? 'nowrap' : 'normal' }}>{children}</td>
}

function TableCard({ children }: { children: React.ReactNode }) {
  return <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>{children}</div>
}

function CardHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div style={{ padding: '12px 16px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{title}</span>
      {right}
    </div>
  )
}

function Btn({ label, variant = 'secondary', small = false, onClick, disabled }: {
  label: string; variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; small?: boolean; onClick?: () => void; disabled?: boolean
}) {
  const [hov, setHov] = useState(false)
  const styles: React.CSSProperties = {
    border: 'none', borderRadius: 7, padding: small ? '5px 12px' : '7px 16px', fontSize: small ? 12 : 13, fontWeight: 500, cursor: disabled ? 'default' : 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'background 0.1s, opacity 0.1s', opacity: disabled ? 0.5 : 1,
    ...(variant === 'primary' ? { background: PRIMARY, color: '#fff' }
      : variant === 'danger' ? { background: hov ? '#d42b30' : ERROR, color: '#fff' }
      : variant === 'ghost' ? { background: 'transparent', color: MUTED, border: `1px solid ${BORDER}` }
      : { background: CARD, color: SUB, border: `1px solid ${BORDER}` })
  }
  return <button style={styles} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={onClick} disabled={disabled}>{label}</button>
}

function StatusBadge({ status }: { status: 'active' | 'suspended' | 'banned' | 'pending' }) {
  const m = { active: { label: 'Active', color: SUCCESS, dot: SUCCESS }, suspended: { label: 'Suspended', color: WARNING, dot: WARNING }, banned: { label: 'Banned', color: ERROR, dot: ERROR }, pending: { label: 'Pending', color: PRIMARY, dot: PRIMARY } }[status]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: m.color, background: `${m.color}18`, borderRadius: 9999, padding: '3px 8px' }}>
      <span style={{ width: 5, height: 5, borderRadius: 9999, background: m.dot }} />{m.label}
    </span>
  )
}

function RoleBadge({ role }: { role: 'super_admin' | 'content_mod' | 'community_mgr' | 'user' }) {
  const m = {
    super_admin:    { label: 'Super Admin', bg: GRAD, color: '#fff' },
    content_mod:    { label: 'Content Mod', bg: PRIMARY, color: '#fff' },
    community_mgr:  { label: 'Community Mgr', bg: '#8B5CF6', color: '#fff' },
    user:           { label: 'User', bg: '#F0F2F5', color: MUTED },
  }[role]
  return <span style={{ fontSize: 11, fontWeight: 600, borderRadius: 9999, padding: '3px 8px', background: m.bg, color: m.color, whiteSpace: 'nowrap' }}>{m.label}</span>
}

// ─── Admin Sidebar ────────────────────────────────────────────────
const NAV: { id: AdminScreen; label: string; icon: React.ReactNode; badge?: number }[] = [
  { id: 'home', label: 'Dashboard', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/></svg> },
  { id: 'users', label: 'Users', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.87" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
  { id: 'blogs', label: 'Blogs', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
  { id: 'communities', label: 'Communities', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" stroke="currentColor" strokeWidth="1.8"/></svg> },
  { id: 'reports', label: 'Reports', badge: 14, icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> },
  { id: 'audit', label: 'Audit Log', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8"/><path d="M14 2v6h6M8 13h8M8 17h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
  { id: 'roles', label: 'Role Assignment', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg> },
  { id: 'settings', label: 'Settings', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.8"/></svg> },
]

function Sidebar({ active, onNav, collapsed, onToggle, onSignOut }: {
  active: AdminScreen; onNav: (s: AdminScreen) => void; collapsed: boolean; onToggle: () => void; onSignOut: () => void
}) {
  return (
    <div style={{ width: collapsed ? 52 : 220, background: SIDEBAR_BG, display: 'flex', flexDirection: 'column', flexShrink: 0, transition: 'width 0.2s', overflow: 'hidden' }}>
      <div style={{ padding: '12px 10px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #2D2F33' }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 15H7L3 21V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        {!collapsed && <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', letterSpacing: -0.3 }}>MyChatApp <span style={{ color: SIDEBAR_MUT, fontWeight: 400 }}>Admin</span></span>}
        <button onClick={onToggle} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', cursor: 'pointer', color: SIDEBAR_MUT, padding: 2, display: 'flex', flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 6px' }}>
        {!collapsed && <div style={{ padding: '8px 6px 4px', fontSize: 10, fontWeight: 700, color: SIDEBAR_MUT, textTransform: 'uppercase', letterSpacing: 1 }}>Navigation</div>}
        {NAV.map(item => {
          const isActive = item.id === active
          return (
            <button key={item.id} onClick={() => onNav(item.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 7, border: 'none', cursor: 'pointer', width: '100%', marginBottom: 1, background: isActive ? SIDEBAR_ACT : 'transparent', fontFamily: 'inherit', transition: 'background 0.1s', justifyContent: collapsed ? 'center' : 'flex-start' }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = SIDEBAR_HOV }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
              <span style={{ color: isActive ? '#fff' : SIDEBAR_MUT, flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, color: isActive ? '#fff' : SIDEBAR_TXT, whiteSpace: 'nowrap', flex: 1 }}>{item.label}</span>}
              {!collapsed && item.badge && <span style={{ background: ERROR, color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 9999, padding: '1px 6px', marginLeft: 'auto' }}>{item.badge}</span>}
            </button>
          )
        })}
      </div>
      <div style={{ padding: '8px 6px', borderTop: '1px solid #2D2F33' }}>
        <button onClick={onSignOut} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 7, border: 'none', cursor: 'pointer', background: 'transparent', color: ERROR, textAlign: 'left', fontFamily: 'inherit', fontSize: 12, width: '100%', justifyContent: collapsed ? 'center' : 'flex-start' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(250,56,62,0.1)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  )
}

// ─── Confirm Modal ─────────────────────────────────────────────────
type ConfirmKind = 'suspend' | 'delete-user' | 'delete-post' | 'delete-community' | 'remove-member' | 'sign-out'

const CONFIRM_META: Record<ConfirmKind, { title: string; body: string; action: string; icon: React.ReactNode }> = {
  'suspend': {
    title: 'Suspend User',
    body: 'Alex Johnson will be unable to log in or use MyChatApp until unsuspended. Their content remains visible.',
    action: 'Suspend User',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke={ERROR} strokeWidth="1.8"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" stroke={ERROR} strokeWidth="1.8" strokeLinecap="round"/></svg>,
  },
  'delete-user': {
    title: 'Delete User Account',
    body: 'This will permanently delete Alex Johnson\'s account, all their posts, messages, and community memberships. This cannot be undone.',
    action: 'Delete Account',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><polyline points="3 6 5 6 21 6" stroke={ERROR} strokeWidth="1.8" strokeLinecap="round"/><path d="M19 6l-1 14H6L5 6" stroke={ERROR} strokeWidth="1.8" strokeLinejoin="round"/><path d="M10 11v6M14 11v6M9 6V4h6v2" stroke={ERROR} strokeWidth="1.8" strokeLinecap="round"/></svg>,
  },
  'delete-post': {
    title: 'Delete Post',
    body: '"How to build scalable APIs" by Alex Johnson will be permanently deleted along with all comments. This cannot be undone.',
    action: 'Delete Post',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><polyline points="3 6 5 6 21 6" stroke={ERROR} strokeWidth="1.8" strokeLinecap="round"/><path d="M19 6l-1 14H6L5 6" stroke={ERROR} strokeWidth="1.8" strokeLinejoin="round"/><path d="M10 11v6M14 11v6M9 6V4h6v2" stroke={ERROR} strokeWidth="1.8" strokeLinecap="round"/></svg>,
  },
  'delete-community': {
    title: 'Delete Community',
    body: '"Tech Enthusiasts" community will be permanently deleted. All 1,248 members will be notified and lose access immediately. This cannot be undone.',
    action: 'Delete Community',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke={ERROR} strokeWidth="1.8" strokeLinejoin="round"/><line x1="12" y1="9" x2="12" y2="13" stroke={ERROR} strokeWidth="1.8" strokeLinecap="round"/><line x1="12" y1="17" x2="12.01" y2="17" stroke={ERROR} strokeWidth="2" strokeLinecap="round"/></svg>,
  },
  'remove-member': {
    title: 'Remove Member',
    body: 'Alex Johnson will be removed from "Tech Enthusiasts" and notified. They can re-join unless the community is private.',
    action: 'Remove Member',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="4" stroke={ERROR} strokeWidth="1.8"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke={ERROR} strokeWidth="1.8" strokeLinecap="round"/><line x1="18" y1="8" x2="23" y2="13" stroke={ERROR} strokeWidth="1.8" strokeLinecap="round"/><line x1="23" y1="8" x2="18" y2="13" stroke={ERROR} strokeWidth="1.8" strokeLinecap="round"/></svg>,
  },
  'sign-out': {
    title: 'Sign Out',
    body: 'You will be signed out of the admin panel. Your session will end and you will need to log in again to continue.',
    action: 'Sign Out',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke={ERROR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  },
}

function ConfirmModal({ kind, onCancel, onConfirm }: { kind: ConfirmKind; onCancel: () => void; onConfirm: () => void }) {
  const meta = CONFIRM_META[kind]
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(2px)' }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{ background: CARD, borderRadius: 12, boxShadow: '0 8px 40px rgba(0,0,0,0.18)', width: 380, maxWidth: '90%', padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, borderRadius: 9999, background: 'rgba(250,56,62,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {meta.icon}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>{meta.title}</div>
          <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.55 }}>{meta.body}</div>
          <div style={{ fontSize: 12, color: ERROR, fontWeight: 500, background: 'rgba(250,56,62,0.06)', borderRadius: 6, padding: '6px 14px' }}>⚠ This action cannot be undone.</div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: `1px solid ${BORDER}`, paddingTop: 16 }}>
          <Btn label="Cancel" variant="ghost" onClick={onCancel} />
          <Btn label={meta.action} variant="danger" onClick={onConfirm} />
        </div>
      </div>
    </div>
  )
}

// ─── Reports / Moderation Queue ────────────────────────────────────
type ReportReason = 'spam' | 'hate-speech' | 'harassment' | 'misinformation' | 'nsfw' | 'off-topic'
type ReportStatus = 'pending' | 'reviewed' | 'actioned' | 'dismissed'

interface Report {
  id: string
  content: string
  contentType: 'post' | 'comment' | 'profile'
  author: string
  reporter: string
  reason: ReportReason
  date: string
  status: ReportStatus
}

const REPORTS: Report[] = [
  { id: 'r1', content: 'Earn $5000 a week working from home — GUARANTEED click this link now!', contentType: 'post', author: 'promo_bot_99', reporter: 'Alex Johnson', reason: 'spam', date: '2m ago', status: 'pending' },
  { id: 'r2', content: 'You people don\'t deserve to exist. Go back to where you came from.', contentType: 'comment', author: 'anon_user_22', reporter: 'Maria Garcia', reason: 'hate-speech', date: '15m ago', status: 'pending' },
  { id: 'r3', content: 'I know where you live. Better watch your back tonight.', contentType: 'comment', author: 'throwaway_acct', reporter: 'Ben Carter', reason: 'harassment', date: '1h ago', status: 'pending' },
  { id: 'r4', content: 'BREAKING: Scientists confirm vaccines cause autism — government hiding truth', contentType: 'post', author: 'truth_seeker_7', reporter: 'Jordan Kim', reason: 'misinformation', date: '2h ago', status: 'reviewed' },
  { id: 'r5', content: '[Explicit adult content description — image attachment]', contentType: 'post', author: 'explicit_acc', reporter: 'Taylor Reeves', reason: 'nsfw', date: '3h ago', status: 'actioned' },
  { id: 'r6', content: 'Buy crypto now! XYZ token will 100x by end of month!', contentType: 'comment', author: 'crypto_guru_x', reporter: 'Sam Lee', reason: 'spam', date: '5h ago', status: 'dismissed' },
]

const REASON_LABELS: Record<ReportReason, string> = {
  'spam': 'Spam', 'hate-speech': 'Hate Speech', 'harassment': 'Harassment',
  'misinformation': 'Misinformation', 'nsfw': 'NSFW Content', 'off-topic': 'Off-Topic'
}

const STATUS_COLORS: Record<ReportStatus, { bg: string; color: string; label: string }> = {
  pending:   { bg: 'rgba(247,185,40,0.12)', color: '#B68A00', label: 'Pending' },
  reviewed:  { bg: 'rgba(8,102,255,0.1)',   color: PRIMARY,   label: 'Reviewed' },
  actioned:  { bg: 'rgba(250,56,62,0.1)',   color: ERROR,     label: 'Actioned' },
  dismissed: { bg: '#F0F2F5',               color: MUTED,     label: 'Dismissed' },
}

function ReportsQueue({ bp }: { bp: Bp }) {
  const [selected, setSelected] = useState<Report | null>(null)
  const [filter, setFilter] = useState<ReportStatus | 'all'>('all')
  const [actionedRows, setActionedRows] = useState<Set<string>>(new Set())

  const filtered = REPORTS.filter(r => filter === 'all' || r.status === filter)

  const handleAction = (id: string, action: string) => {
    setActionedRows(prev => new Set([...prev, id]))
    if (selected?.id === id) setSelected(null)
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: MUTED, fontWeight: 500, marginRight: 4 }}>Filter:</span>
        {(['all', 'pending', 'reviewed', 'actioned', 'dismissed'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ background: filter === f ? PRIMARY : BG, color: filter === f ? '#fff' : SUB, border: `1px solid ${filter === f ? PRIMARY : BORDER}`, borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: filter === f ? 600 : 400, textTransform: 'capitalize' }}>
            {f === 'all' ? `All (${REPORTS.length})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${REPORTS.filter(r => r.status === f).length})`}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', gap: 0 }}>
        <div style={{ flex: selected && bp !== 'mobile' ? '0 0 55%' : 1, overflowX: 'auto' }}>
          <TableCard>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <THead cols={['Content Preview', 'Type', 'Reporter', 'Reason', 'Date', 'Status', 'Actions']} />
              <tbody>
                {filtered.map(r => {
                  const done = actionedRows.has(r.id)
                  const sc = STATUS_COLORS[r.status]
                  return (
                    <TR key={r.id} selected={selected?.id === r.id} onClick={() => setSelected(selected?.id === r.id ? null : r)}>
                      <TD><span style={{ fontSize: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', maxWidth: 220, lineHeight: 1.4, opacity: done ? 0.5 : 1 }}>{r.content}</span></TD>
                      <TD nowrap><span style={{ fontSize: 11, fontWeight: 600, color: MUTED, background: BG, borderRadius: 5, padding: '2px 7px', textTransform: 'capitalize' }}>{r.contentType}</span></TD>
                      <TD nowrap><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Av name={r.reporter} size={22} /><span style={{ fontSize: 12 }}>{r.reporter}</span></div></TD>
                      <TD nowrap><span style={{ fontSize: 12, color: ERROR, fontWeight: 500 }}>{REASON_LABELS[r.reason]}</span></TD>
                      <TD muted nowrap>{r.date}</TD>
                      <TD nowrap><span style={{ fontSize: 11, fontWeight: 600, borderRadius: 9999, padding: '3px 8px', background: sc.bg, color: sc.color }}>{sc.label}</span></TD>
                      <TD nowrap>
                        {done ? <span style={{ fontSize: 12, color: SUCCESS, fontWeight: 600 }}>✓ Done</span> : (
                          <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                            <Btn label="Dismiss" small variant="ghost" onClick={() => handleAction(r.id, 'dismiss')} />
                            <Btn label="Remove" small variant="danger" onClick={() => handleAction(r.id, 'remove')} />
                          </div>
                        )}
                      </TD>
                    </TR>
                  )
                })}
              </tbody>
            </table>
          </TableCard>
        </div>

        {selected && bp !== 'mobile' && (
          <div style={{ flex: '0 0 45%', borderLeft: `1px solid ${BORDER}`, background: CARD, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>Report Detail</span>
              <button onClick={() => setSelected(null)} style={{ background: BG, border: 'none', borderRadius: 6, width: 26, height: 26, cursor: 'pointer', color: MUTED, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>
            <div style={{ background: BG, borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>Reported Content</div>
              <div style={{ fontSize: 13, color: TEXT, lineHeight: 1.6 }}>{selected.content}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Author', val: selected.author },
                { label: 'Content Type', val: selected.contentType },
                { label: 'Reported By', val: selected.reporter },
                { label: 'Reason', val: REASON_LABELS[selected.reason] },
                { label: 'Submitted', val: selected.date },
                { label: 'Status', val: selected.status },
              ].map(f => (
                <div key={f.label} style={{ background: BG, borderRadius: 7, padding: '10px 12px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5 }}>{f.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: TEXT, marginTop: 3, textTransform: 'capitalize' }}>{f.val}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 2 }}>Quick Actions</div>
              {['Dismiss Report', 'Warn User', 'Remove Content', 'Ban User'].map((a, i) => (
                <button key={a} onClick={() => { setActionedRows(prev => new Set([...prev, selected.id])); setSelected(null) }} style={{ background: i === 3 ? ERROR : BG, color: i === 3 ? '#fff' : i === 2 ? ERROR : TEXT, border: `1px solid ${i === 2 ? ERROR : i === 3 ? ERROR : BORDER}`, borderRadius: 7, padding: '8px 12px', fontSize: 13, fontWeight: 500, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                  {a}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Audit Log ─────────────────────────────────────────────────────
interface AuditEntry {
  id: string
  admin: string
  adminRole: 'super_admin' | 'content_mod' | 'community_mgr'
  action: string
  target: string
  targetType: 'user' | 'post' | 'community' | 'system'
  timestamp: string
  severity: 'info' | 'warning' | 'critical'
}

const AUDIT_ENTRIES: AuditEntry[] = [
  { id: 'a1', admin: 'Sarah Chen', adminRole: 'super_admin', action: 'Deleted user account', target: 'spammer_bot_99', targetType: 'user', timestamp: 'Today, 2:34 PM', severity: 'critical' },
  { id: 'a2', admin: 'Marcus Williams', adminRole: 'content_mod', action: 'Removed post', target: '"Misleading vaccine info…"', targetType: 'post', timestamp: 'Today, 1:17 PM', severity: 'warning' },
  { id: 'a3', admin: 'Sarah Chen', adminRole: 'super_admin', action: 'Assigned role Content Mod', target: 'jordan.kim@email.com', targetType: 'user', timestamp: 'Today, 11:05 AM', severity: 'info' },
  { id: 'a4', admin: 'Lisa Tanaka', adminRole: 'community_mgr', action: 'Removed member', target: 'Tech Enthusiasts community', targetType: 'community', timestamp: 'Today, 9:42 AM', severity: 'warning' },
  { id: 'a5', admin: 'Marcus Williams', adminRole: 'content_mod', action: 'Warned user', target: 'anon_user_22', targetType: 'user', timestamp: 'Yesterday, 4:50 PM', severity: 'info' },
  { id: 'a6', admin: 'Sarah Chen', adminRole: 'super_admin', action: 'Deleted community', target: 'Crypto Scammers Hub', targetType: 'community', timestamp: 'Yesterday, 2:11 PM', severity: 'critical' },
  { id: 'a7', admin: 'Lisa Tanaka', adminRole: 'community_mgr', action: 'Approved join request', target: 'Developer Community', targetType: 'community', timestamp: 'Yesterday, 10:33 AM', severity: 'info' },
  { id: 'a8', admin: 'Marcus Williams', adminRole: 'content_mod', action: 'Dismissed report', target: 'Report #1048 — spam', targetType: 'system', timestamp: '2 days ago, 3:22 PM', severity: 'info' },
]

const SEVERITY_STYLE: Record<string, { color: string; bg: string; dot: string }> = {
  info:     { color: PRIMARY,  bg: 'rgba(8,102,255,0.08)',  dot: PRIMARY  },
  warning:  { color: '#B68A00', bg: 'rgba(247,185,40,0.1)',  dot: WARNING  },
  critical: { color: ERROR,    bg: 'rgba(250,56,62,0.08)',   dot: ERROR    },
}

function AuditLog({ bp }: { bp: Bp }) {
  const [adminFilter, setAdminFilter] = useState<string>('all')
  const [sevFilter,   setSevFilter]   = useState<string>('all')

  const admins = Array.from(new Set(AUDIT_ENTRIES.map(e => e.admin)))
  const filtered = AUDIT_ENTRIES.filter(e =>
    (adminFilter === 'all' || e.admin === adminFilter) &&
    (sevFilter === 'all' || e.severity === sevFilter)
  )

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: MUTED, fontWeight: 500 }}>Filter by admin:</span>
        {['all', ...admins].map(a => (
          <button key={a} onClick={() => setAdminFilter(a)} style={{ background: adminFilter === a ? PRIMARY : BG, color: adminFilter === a ? '#fff' : SUB, border: `1px solid ${adminFilter === a ? PRIMARY : BORDER}`, borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
            {a === 'all' ? 'All Admins' : a}
          </button>
        ))}
        <div style={{ width: 1, height: 20, background: BORDER, margin: '0 4px' }} />
        <span style={{ fontSize: 12, color: MUTED, fontWeight: 500 }}>Severity:</span>
        {['all', 'info', 'warning', 'critical'].map(s => (
          <button key={s} onClick={() => setSevFilter(s)} style={{ background: sevFilter === s ? PRIMARY : BG, color: sevFilter === s ? '#fff' : SUB, border: `1px solid ${sevFilter === s ? PRIMARY : BORDER}`, borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize' }}>
            {s === 'all' ? 'All' : s}
          </button>
        ))}
      </div>
      <TableCard>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <THead cols={['Admin', bp !== 'mobile' ? 'Role' : '', 'Action', 'Target', 'Timestamp', 'Severity'].filter(Boolean)} />
          <tbody>
            {filtered.map(e => {
              const sv = SEVERITY_STYLE[e.severity]
              return (
                <TR key={e.id}>
                  <TD nowrap><div style={{ display: 'flex', alignItems: 'center', gap: 7 }}><Av name={e.admin} size={24} /><span style={{ fontSize: 13 }}>{e.admin}</span></div></TD>
                  {bp !== 'mobile' && <TD nowrap><RoleBadge role={e.adminRole} /></TD>}
                  <TD><span style={{ fontSize: 13 }}>{e.action}</span></TD>
                  <TD muted><span style={{ fontSize: 12, fontStyle: 'italic' }}>{e.target}</span></TD>
                  <TD muted nowrap>{e.timestamp}</TD>
                  <TD nowrap>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: sv.color, background: sv.bg, borderRadius: 9999, padding: '3px 8px', textTransform: 'capitalize' }}>
                      <span style={{ width: 5, height: 5, borderRadius: 9999, background: sv.dot }} />{e.severity}
                    </span>
                  </TD>
                </TR>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: MUTED, fontSize: 13 }}>No entries match the current filters.</div>
        )}
      </TableCard>
    </div>
  )
}

// ─── Account Settings ──────────────────────────────────────────────
function AccountSettings() {
  const [name,     setName]     = useState('Sarah Chen')
  const [email,    setEmail]    = useState('sarah.chen@mychatapp.com')
  const [saved,    setSaved]    = useState(false)
  const [currPw,   setCurrPw]   = useState('')
  const [newPw,    setNewPw]    = useState('')
  const [confPw,   setConfPw]   = useState('')
  const [pwSaved,  setPwSaved]  = useState(false)
  const [pwError,  setPwError]  = useState('')

  const handleProfile = () => { setSaved(true); setTimeout(() => setSaved(false), 2500) }
  const handlePassword = () => {
    if (!currPw) { setPwError('Current password is required.'); return }
    if (newPw.length < 8) { setPwError('New password must be at least 8 characters.'); return }
    if (newPw !== confPw) { setPwError('Passwords do not match.'); return }
    setPwError(''); setPwSaved(true); setCurrPw(''); setNewPw(''); setConfPw('')
    setTimeout(() => setPwSaved(false), 2500)
  }

  const Field = ({ label, value, onChange, type = 'text', placeholder = '' }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 7, padding: '8px 10px', fontSize: 13, color: TEXT, outline: 'none', fontFamily: 'inherit' }} />
    </div>
  )

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 540 }}>
      <TableCard>
        <CardHeader title="Profile" />
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ position: 'relative' }}>
              <Av name="Sarah Chen" size={56} />
              <button style={{ position: 'absolute', bottom: 0, right: 0, background: PRIMARY, border: '2px solid #fff', borderRadius: 9999, width: 20, height: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: TEXT }}>{name}</div>
              <RoleBadge role="super_admin" />
            </div>
          </div>
          <Field label="Display Name" value={name} onChange={setName} />
          <Field label="Email Address" value={email} onChange={setEmail} type="email" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Btn label={saved ? '✓ Saved' : 'Save Changes'} variant={saved ? 'ghost' : 'primary'} onClick={handleProfile} />
            {saved && <span style={{ fontSize: 12, color: SUCCESS, fontWeight: 500 }}>Profile updated.</span>}
          </div>
        </div>
      </TableCard>

      <TableCard>
        <CardHeader title="Change Password" />
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Current Password" value={currPw} onChange={setCurrPw} type="password" placeholder="Enter current password" />
          <Field label="New Password" value={newPw} onChange={setNewPw} type="password" placeholder="Min. 8 characters" />
          <Field label="Confirm New Password" value={confPw} onChange={setConfPw} type="password" placeholder="Repeat new password" />
          {pwError && <div style={{ fontSize: 12, color: ERROR, fontWeight: 500 }}>{pwError}</div>}
          {pwSaved && <div style={{ fontSize: 12, color: SUCCESS, fontWeight: 500 }}>✓ Password changed successfully.</div>}
          <Btn label="Update Password" variant="primary" onClick={handlePassword} />
        </div>
      </TableCard>

      <TableCard>
        <CardHeader title="Sessions" />
        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { device: 'Chrome on macOS', location: 'San Francisco, CA', time: 'Active now', current: true },
            { device: 'Safari on iPhone 15', location: 'San Francisco, CA', time: '2 hours ago', current: false },
            { device: 'Chrome on Windows', location: 'New York, NY', time: '3 days ago', current: false },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 2 ? `1px solid ${DIVIDER}` : 'none' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: TEXT }}>{s.device} {s.current && <span style={{ fontSize: 11, color: SUCCESS, fontWeight: 600, background: 'rgba(49,162,76,0.1)', borderRadius: 9999, padding: '1px 6px' }}>Current</span>}</div>
                <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{s.location} · {s.time}</div>
              </div>
              {!s.current && <Btn label="Revoke" small variant="ghost" />}
            </div>
          ))}
        </div>
      </TableCard>
    </div>
  )
}

// ─── Bulk Actions ──────────────────────────────────────────────────
interface UserRow { id: string; name: string; email: string; status: 'active' | 'suspended' | 'banned'; role: 'super_admin' | 'content_mod' | 'community_mgr' | 'user'; joined: string; posts: number }
const BULK_USERS: UserRow[] = [
  { id: 'u1', name: 'Alex Johnson', email: 'alex@email.com', status: 'active', role: 'user', joined: 'Jan 12, 2024', posts: 47 },
  { id: 'u2', name: 'Maria Garcia', email: 'maria@email.com', status: 'active', role: 'content_mod', joined: 'Mar 3, 2024', posts: 89 },
  { id: 'u3', name: 'Ben Carter', email: 'ben@email.com', status: 'suspended', role: 'user', joined: 'Feb 14, 2024', posts: 12 },
  { id: 'u4', name: 'Jordan Kim', email: 'jordan@email.com', status: 'active', role: 'community_mgr', joined: 'Nov 28, 2023', posts: 134 },
  { id: 'u5', name: 'promo_bot_99', email: 'promo99@temp.io', status: 'active', role: 'user', joined: 'Sep 1, 2024', posts: 203 },
  { id: 'u6', name: 'Taylor Reeves', email: 'taylor@email.com', status: 'banned', role: 'user', joined: 'Apr 6, 2024', posts: 5 },
]

function BulkActions({ bp }: { bp: Bp }) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkDone, setBulkDone] = useState<{ action: string; count: number } | null>(null)
  const [confirmKind, setConfirmKind] = useState<ConfirmKind | null>(null)

  const toggleRow = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    setSelected(prev => prev.size === BULK_USERS.length ? new Set() : new Set(BULK_USERS.map(u => u.id)))
  }

  const executeBulk = (action: string) => {
    setBulkDone({ action, count: selected.size })
    setSelected(new Set())
    setConfirmKind(null)
    setTimeout(() => setBulkDone(null), 3000)
  }

  const allChecked = selected.size === BULK_USERS.length
  const someChecked = selected.size > 0 && !allChecked

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
      {selected.size > 0 && (
        <div style={{ background: PRIMARY, borderRadius: 8, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', flex: 1 }}>{selected.size} user{selected.size !== 1 ? 's' : ''} selected</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setConfirmKind('suspend')} style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>Suspend</button>
            <button onClick={() => setConfirmKind('delete-user')} style={{ background: 'rgba(250,56,62,0.85)', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
            <button onClick={() => setSelected(new Set())} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 6, padding: '5px 12px', fontSize: 12, color: 'rgba(255,255,255,0.75)', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          </div>
        </div>
      )}

      {bulkDone && (
        <div style={{ background: 'rgba(49,162,76,0.08)', border: `1px solid ${SUCCESS}`, borderRadius: 8, padding: '10px 16px', marginBottom: 12, fontSize: 13, color: SUCCESS, fontWeight: 500 }}>
          ✓ {bulkDone.action} applied to {bulkDone.count} user{bulkDone.count !== 1 ? 's' : ''}.
        </div>
      )}

      <TableCard>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
              <th style={{ padding: '9px 12px', width: 36, background: BG }}>
                <input type="checkbox" checked={allChecked} ref={el => { if (el) el.indeterminate = someChecked }} onChange={toggleAll} style={{ cursor: 'pointer', accentColor: PRIMARY }} />
              </th>
              {['User', bp !== 'mobile' ? 'Role' : '', bp !== 'mobile' ? 'Status' : '', bp !== 'mobile' ? 'Joined' : '', 'Posts', 'Actions'].filter(Boolean).map((c, i) => (
                <th key={i} style={{ padding: '9px 12px', fontSize: 11, fontWeight: 700, color: MUTED, textAlign: 'left', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: 0.5, background: BG }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BULK_USERS.map(u => {
              const isSel = selected.has(u.id)
              return (
                <TR key={u.id} selected={isSel}>
                  <td style={{ padding: '9px 12px' }}>
                    <input type="checkbox" checked={isSel} onChange={() => toggleRow(u.id)} style={{ cursor: 'pointer', accentColor: PRIMARY }} />
                  </td>
                  <TD>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Av name={u.name} size={28} />
                      <div><div style={{ fontSize: 13, fontWeight: 500 }}>{u.name}</div><div style={{ fontSize: 11, color: MUTED }}>{u.email}</div></div>
                    </div>
                  </TD>
                  {bp !== 'mobile' && <TD nowrap><RoleBadge role={u.role} /></TD>}
                  {bp !== 'mobile' && <TD nowrap><StatusBadge status={u.status} /></TD>}
                  {bp !== 'mobile' && <TD muted nowrap>{u.joined}</TD>}
                  <TD muted nowrap>{u.posts}</TD>
                  <TD nowrap>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <Btn label="View" small variant="ghost" />
                      <Btn label="Suspend" small variant="secondary" onClick={() => setConfirmKind('suspend')} />
                    </div>
                  </TD>
                </TR>
              )
            })}
          </tbody>
        </table>
      </TableCard>

      {confirmKind && (
        <ConfirmModal kind={confirmKind} onCancel={() => setConfirmKind(null)} onConfirm={() => executeBulk(confirmKind === 'suspend' ? 'Suspend' : 'Delete')} />
      )}
    </div>
  )
}

// ─── Admin layout shell ────────────────────────────────────────────
function AdminShell({ bp, screen, onNav, children, onSignOut }: {
  bp: Bp; screen: AdminScreen; onNav: (s: AdminScreen) => void; children: React.ReactNode; onSignOut: () => void
}) {
  const [collapsed, setCollapsed] = useState(bp !== 'desktop')

  const LABELS: Record<AdminScreen, string> = {
    home: 'Dashboard', users: 'User Management', blogs: 'Blog Management',
    communities: 'Community Management', roles: 'Role Assignment',
    reports: 'Reports & Moderation Queue', audit: 'Audit Log', settings: 'Account Settings',
  }

  return (
    <div style={{ display: 'flex', height: '100%', background: BG, overflow: 'hidden' }}>
      {bp !== 'mobile' && <Sidebar active={screen} onNav={onNav} collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} onSignOut={onSignOut} />}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ height: 48, background: CARD, borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {bp === 'mobile' && (
              <button onClick={() => setCollapsed(c => !c)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: MUTED, padding: 4 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            )}
            <span style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{LABELS[screen]}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Av name="Sarah Chen" size={28} />
            {!collapsed && bp !== 'mobile' && <span style={{ fontSize: 12, color: SUB, fontWeight: 500 }}>Sarah Chen</span>}
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </div>
      {bp === 'mobile' && collapsed === false && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 50, display: 'flex' }}>
          <div style={{ flex: 'none' }}><Sidebar active={screen} onNav={s => { onNav(s); setCollapsed(true) }} collapsed={false} onToggle={() => setCollapsed(true)} onSignOut={onSignOut} /></div>
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.4)' }} onClick={() => setCollapsed(true)} />
        </div>
      )}
    </div>
  )
}

// ─── Device Frame ──────────────────────────────────────────────────
function DeviceFrame({ bp, children }: { bp: Bp; children: React.ReactNode }) {
  const configs = { mobile: { w: 390, h: 780, scale: 0.80 }, tablet: { w: 834, h: 660, scale: 0.68 }, desktop: { w: 1280, h: 660, scale: 0.63 } }
  const { w, h, scale } = configs[bp]
  return (
    <div style={{ width: w * scale, height: h * scale, flexShrink: 0, borderRadius: bp === 'mobile' ? 32 * scale : 12 * scale, overflow: 'hidden', boxShadow: '0 4px 32px rgba(0,0,0,0.15)', position: 'relative' }}>
      <div style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: 'top left', position: 'relative', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  )
}

// ─── Demo Switcher ─────────────────────────────────────────────────
const DEMOS: { id: DemoId; label: string }[] = [
  { id: 'confirm-modals',   label: 'Confirm Modals' },
  { id: 'reports-queue',    label: 'Reports Queue' },
  { id: 'audit-log',        label: 'Audit Log' },
  { id: 'sign-out',         label: 'Sign Out Flow' },
  { id: 'account-settings', label: 'Account Settings' },
  { id: 'bulk-actions',     label: 'Bulk Actions' },
]

// ─── Confirm Modals Demo ───────────────────────────────────────────
function ConfirmModalsDemo({ bp }: { bp: Bp }) {
  const [screen, setScreen] = useState<AdminScreen>('users')
  const [activeKind, setActiveKind] = useState<ConfirmKind>('suspend')
  const [open, setOpen] = useState(false)
  const [doneKind, setDoneKind] = useState<ConfirmKind | null>(null)

  const kinds: ConfirmKind[] = ['suspend', 'delete-user', 'delete-post', 'delete-community', 'remove-member']
  const kindLabels: Record<ConfirmKind, string> = { 'suspend': 'Suspend User', 'delete-user': 'Delete User', 'delete-post': 'Delete Post', 'delete-community': 'Delete Community', 'remove-member': 'Remove Member', 'sign-out': 'Sign Out' }

  return (
    <AdminShell bp={bp} screen={screen} onNav={setScreen} onSignOut={() => {}}>
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 14, position: 'relative' }}>
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 10 }}>Trigger a confirmation modal</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            {kinds.map(k => (
              <button key={k} onClick={() => setActiveKind(k)} style={{ background: activeKind === k ? '#F0F2F5' : 'transparent', border: `1px solid ${activeKind === k ? TEXT : BORDER}`, borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: activeKind === k ? 600 : 400 }}>
                {kindLabels[k]}
              </button>
            ))}
          </div>
          <button onClick={() => setOpen(true)} style={{ background: ERROR, border: 'none', borderRadius: 7, padding: '8px 18px', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
            Open "{kindLabels[activeKind]}" modal
          </button>
        </div>

        {doneKind && (
          <div style={{ background: 'rgba(49,162,76,0.08)', border: `1px solid ${SUCCESS}`, borderRadius: 8, padding: '10px 16px', fontSize: 13, color: SUCCESS, fontWeight: 500 }}>
            ✓ Action confirmed: {kindLabels[doneKind]} was executed.
          </div>
        )}

        <TableCard>
          <CardHeader title="Users" right={<Btn label="+ Add User" small variant="primary" />} />
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <THead cols={['User', 'Status', 'Actions']} />
            <tbody>
              {BULK_USERS.slice(0, 4).map(u => (
                <TR key={u.id}>
                  <TD><div style={{ display: 'flex', alignItems: 'center', gap: 7 }}><Av name={u.name} size={26} /><span style={{ fontSize: 13 }}>{u.name}</span></div></TD>
                  <TD nowrap><StatusBadge status={u.status} /></TD>
                  <TD nowrap>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <Btn label="Suspend" small variant="secondary" onClick={() => { setActiveKind('suspend'); setOpen(true) }} />
                      <Btn label="Delete" small variant="danger" onClick={() => { setActiveKind('delete-user'); setOpen(true) }} />
                    </div>
                  </TD>
                </TR>
              ))}
            </tbody>
          </table>
        </TableCard>

        {open && <ConfirmModal kind={activeKind} onCancel={() => setOpen(false)} onConfirm={() => { setDoneKind(activeKind); setOpen(false); setTimeout(() => setDoneKind(null), 3000) }} />}
      </div>
    </AdminShell>
  )
}

// ─── Sign Out Demo ─────────────────────────────────────────────────
function SignOutDemo({ bp }: { bp: Bp }) {
  const [screen, setScreen] = useState<AdminScreen>('home')
  const [showConfirm, setShowConfirm] = useState(false)
  const [signedOut, setSignedOut] = useState(false)

  if (signedOut) {
    return (
      <div style={{ height: '100%', background: SIDEBAR_BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 9999, background: 'rgba(49,162,76,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke={SUCCESS} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Signed out successfully</div>
        <div style={{ fontSize: 13, color: SIDEBAR_MUT }}>You have been securely signed out.</div>
        <button onClick={() => setSignedOut(false)} style={{ background: PRIMARY, border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', marginTop: 8 }}>Sign Back In</button>
      </div>
    )
  }

  return (
    <AdminShell bp={bp} screen={screen} onNav={setScreen} onSignOut={() => setShowConfirm(true)}>
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 14, position: 'relative' }}>
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: TEXT, marginBottom: 6 }}>Sign Out Flow</div>
          <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.6 }}>Click the <strong>Sign Out</strong> button at the bottom of the sidebar to trigger the confirmation modal. Confirming ends your session and shows the signed-out screen.</div>
        </div>
        <TableCard>
          <CardHeader title="Dashboard" />
          <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[{ label: 'Total Users', val: '12,847' }, { label: 'Reports Pending', val: '14' }, { label: 'Posts Today', val: '238' }, { label: 'Active Now', val: '1,203' }].map(s => (
              <div key={s.label} style={{ background: BG, borderRadius: 8, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: TEXT, marginTop: 6 }}>{s.val}</div>
              </div>
            ))}
          </div>
        </TableCard>
        {showConfirm && <ConfirmModal kind="sign-out" onCancel={() => setShowConfirm(false)} onConfirm={() => { setShowConfirm(false); setSignedOut(true) }} />}
      </div>
    </AdminShell>
  )
}

// ─── Main Export ───────────────────────────────────────────────────
export default function AdminExtensions() {
  const [demo, setDemo] = useState<DemoId>('confirm-modals')
  const [bp, setBp] = useState<Bp>('desktop')

  function DemoContent({ bp }: { bp: Bp }) {
    const [screen, setScreen] = useState<AdminScreen>('reports')
    const [signOutOpen, setSignOutOpen] = useState(false)

    if (demo === 'confirm-modals') return <ConfirmModalsDemo bp={bp} />
    if (demo === 'sign-out') return <SignOutDemo bp={bp} />
    if (demo === 'account-settings') return (
      <AdminShell bp={bp} screen="settings" onNav={() => {}} onSignOut={() => {}}>
        <AccountSettings />
      </AdminShell>
    )
    if (demo === 'bulk-actions') return (
      <AdminShell bp={bp} screen="users" onNav={() => {}} onSignOut={() => {}}>
        <BulkActions bp={bp} />
      </AdminShell>
    )
    if (demo === 'reports-queue') return (
      <AdminShell bp={bp} screen="reports" onNav={s => setScreen(s)} onSignOut={() => setSignOutOpen(true)}>
        <ReportsQueue bp={bp} />
        {signOutOpen && <ConfirmModal kind="sign-out" onCancel={() => setSignOutOpen(false)} onConfirm={() => setSignOutOpen(false)} />}
      </AdminShell>
    )
    if (demo === 'audit-log') return (
      <AdminShell bp={bp} screen="audit" onNav={s => setScreen(s)} onSignOut={() => setSignOutOpen(true)}>
        <AuditLog bp={bp} />
        {signOutOpen && <ConfirmModal kind="sign-out" onCancel={() => setSignOutOpen(false)} onConfirm={() => setSignOutOpen(false)} />}
      </AdminShell>
    )
    return null
  }

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: SIDEBAR_BG, minHeight: '100vh' }}>
      {/* Control strip */}
      <div style={{ background: '#111316', borderBottom: '1px solid #2D2F33', padding: '12px 32px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginRight: 8, whiteSpace: 'nowrap' }}>Admin Extensions</span>
        <div style={{ display: 'flex', gap: 4, background: '#1C1E21', borderRadius: 8, padding: 3 }}>
          {DEMOS.map(d => (
            <button key={d.id} onClick={() => setDemo(d.id)}
              style={{ background: demo === d.id ? '#3A3C42' : 'transparent', color: demo === d.id ? '#fff' : SIDEBAR_MUT, border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: demo === d.id ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
              {d.label}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, background: '#1C1E21', borderRadius: 8, padding: 3 }}>
          {(['mobile', 'tablet', 'desktop'] as Bp[]).map(b => (
            <button key={b} onClick={() => setBp(b)}
              style={{ background: bp === b ? PRIMARY : 'transparent', color: bp === b ? '#fff' : SIDEBAR_MUT, border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: bp === b ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize' }}>
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Frames */}
      <div style={{ padding: '40px 32px', display: 'flex', gap: 40, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'flex-start', minHeight: 'calc(100vh - 56px)' }}>
        {bp === 'desktop' ? (
          <DeviceFrame bp="desktop"><DemoContent bp="desktop" /></DeviceFrame>
        ) : bp === 'tablet' ? (
          <DeviceFrame bp="tablet"><DemoContent bp="tablet" /></DeviceFrame>
        ) : (
          <DeviceFrame bp="mobile"><DemoContent bp="mobile" /></DeviceFrame>
        )}
      </div>
    </div>
  )
}
