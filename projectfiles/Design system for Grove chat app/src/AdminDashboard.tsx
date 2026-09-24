import { useState, useRef } from 'react'

// ─── Tokens — same palette, tighter density ───────────────────────
const GRAD    = 'linear-gradient(135deg, #00B2FF 0%, #B620E0 100%)'
const PRIMARY = '#0866FF'
const BG      = '#F4F5F7'          // slightly cooler admin bg
const CARD    = '#FFFFFF'
const TEXT    = '#050505'
const SUB     = '#3C3D40'          // slightly softer than pure black
const MUTED   = '#65676B'
const BORDER  = '#E4E6EB'
const DIVIDER = '#ECEEF2'
const SIDEBAR_BG = '#1C1E21'       // dark sidebar — utilitarian contrast
const SIDEBAR_HOVER = '#2D2F33'
const SIDEBAR_ACTIVE = '#3A3C42'
const SIDEBAR_TEXT = '#D0D2D6'
const SIDEBAR_MUTED = '#8A8C91'

// semantic
const SUCCESS = '#31A24C'
const WARNING = '#F7B928'
const ERROR   = '#FA383E'
const INFO    = PRIMARY

type AdminScreen = 'home' | 'users' | 'blogs' | 'communities' | 'roles'
type Breakpoint  = 'mobile' | 'tablet' | 'desktop'

// ─── Role system ─────────────────────────────────────────────────
type Role = 'super_admin' | 'content_mod' | 'community_mgr' | 'user'

const ROLE_META: Record<Role, { label: string; color: string; bg: string; gradient?: boolean }> = {
  super_admin:    { label: 'Super Admin',     color: '#fff',    bg: GRAD, gradient: true },
  content_mod:    { label: 'Content Mod',     color: '#fff',    bg: PRIMARY },
  community_mgr:  { label: 'Community Mgr',   color: '#fff',    bg: '#8B5CF6' },
  user:           { label: 'User',             color: MUTED,    bg: '#F0F2F5' },
}

function RoleBadge({ role, compact = false }: { role: Role; compact?: boolean }) {
  const m = ROLE_META[role]
  return (
    <span style={{
      background: m.bg, color: m.color,
      fontSize: compact ? 10 : 11, fontWeight: 600,
      borderRadius: 4, padding: compact ? '2px 6px' : '3px 8px',
      letterSpacing: 0.2, whiteSpace: 'nowrap', flexShrink: 0,
      display: 'inline-flex', alignItems: 'center',
    }}>{m.label}</span>
  )
}

type UserStatus = 'active' | 'suspended' | 'pending'
const STATUS_META: Record<UserStatus, { label: string; color: string; dot: string }> = {
  active:    { label: 'Active',    color: SUCCESS, dot: SUCCESS },
  suspended: { label: 'Suspended', color: ERROR,   dot: ERROR },
  pending:   { label: 'Pending',   color: WARNING,  dot: WARNING },
}

function StatusBadge({ status }: { status: UserStatus }) {
  const m = STATUS_META[status]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: m.color }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.dot, flexShrink: 0 }} />
      {m.label}
    </span>
  )
}

// ─── Data ─────────────────────────────────────────────────────────
const AVATAR_PALETTE = ['#0866FF','#B620E0','#00B2FF','#31A24C','#F7B928','#FA383E','#8B5CF6','#EC4899']
const ac = (name: string) => AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length]

interface User { id: string; name: string; email: string; role: Role; status: UserStatus; joined: string; posts: number }
interface Post  { id: string; title: string; author: string; date: string; likes: number; comments: number; pinned: boolean; tag: string }
interface Community { id: string; name: string; members: number; admins: string[]; created: string; posts: number; active: boolean }

const USERS: User[] = [
  { id: 'u1', name: 'Jordan Kim',    email: 'jordan@mychatapp.io',  role: 'super_admin',   status: 'active',    joined: 'Jan 3, 2024',  posts: 142 },
  { id: 'u2', name: 'Taylor Reeves', email: 'taylor@mychatapp.io',  role: 'content_mod',   status: 'active',    joined: 'Feb 14, 2024', posts: 87 },
  { id: 'u3', name: 'Alex Johnson',  email: 'alex@example.com',     role: 'community_mgr', status: 'active',    joined: 'Mar 1, 2024',  posts: 203 },
  { id: 'u4', name: 'Maria Garcia',  email: 'maria@example.com',    role: 'user',          status: 'active',    joined: 'Mar 18, 2024', posts: 56 },
  { id: 'u5', name: 'Ben Carter',    email: 'ben@example.com',      role: 'user',          status: 'suspended', joined: 'Apr 2, 2024',  posts: 14 },
  { id: 'u6', name: 'Sam Lee',       email: 'sam@example.com',      role: 'user',          status: 'active',    joined: 'Apr 20, 2024', posts: 31 },
  { id: 'u7', name: 'Robin Chen',    email: 'robin@example.com',    role: 'content_mod',   status: 'active',    joined: 'May 5, 2024',  posts: 67 },
  { id: 'u8', name: 'Dana Park',     email: 'dana@example.com',     role: 'user',          status: 'pending',   joined: 'Sep 10, 2024', posts: 0 },
]

const POSTS_DATA: Post[] = [
  { id: 'p1', title: 'Building Real-Time Chat with WebSockets', author: 'Jordan Kim',    date: 'Sep 18', likes: 342, comments: 47, pinned: true,  tag: 'Engineering' },
  { id: 'p2', title: 'Designing for Accessibility in Dark Mode',  author: 'Taylor Reeves',date: 'Sep 15', likes: 218, comments: 31, pinned: false, tag: 'Design' },
  { id: 'p3', title: 'The Psychology of Push Notifications',      author: 'Alex Johnson', date: 'Sep 12', likes: 189, comments: 22, pinned: true,  tag: 'Product' },
  { id: 'p4', title: 'Gradient Systems That Scale Across Products',author: 'Maria Garcia', date: 'Sep 9',  likes: 156, comments: 19, pinned: false, tag: 'Design' },
  { id: 'p5', title: 'Zero-Downtime Deployments at Scale',        author: 'Ben Carter',   date: 'Sep 6',  likes: 134, comments: 15, pinned: false, tag: 'Engineering' },
  { id: 'p6', title: 'Community Moderation at Human Scale',       author: 'Sam Lee',      date: 'Sep 2',  likes: 97,  comments: 28, pinned: false, tag: 'Community' },
]

const COMMUNITIES: Community[] = [
  { id: 'cm1', name: 'Design Guild',       members: 2840, admins: ['Taylor Reeves','Maria Garcia'], created: 'Jan 2024', posts: 312, active: true },
  { id: 'cm2', name: 'Engineering Hub',    members: 5120, admins: ['Jordan Kim'],                    created: 'Feb 2024', posts: 891, active: true },
  { id: 'cm3', name: 'Product Thinkers',   members: 1490, admins: ['Alex Johnson'],                  created: 'Mar 2024', posts: 204, active: true },
  { id: 'cm4', name: 'Random / Off-topic', members: 8930, admins: ['Sam Lee','Dana Park'],           created: 'Jan 2024', posts: 4201,active: true },
  { id: 'cm5', name: 'Job Board',          members: 720,  admins: ['Robin Chen'],                    created: 'May 2024', posts: 88,  active: false },
]

const ADMIN_USERS: { id: string; name: string; email: string; role: Role; lastActive: string }[] = [
  { id: 'a1', name: 'Jordan Kim',    email: 'jordan@mychatapp.io',  role: 'super_admin',   lastActive: '2h ago' },
  { id: 'a2', name: 'Taylor Reeves', email: 'taylor@mychatapp.io',  role: 'content_mod',   lastActive: '15m ago' },
  { id: 'a3', name: 'Alex Johnson',  email: 'alex@mychatapp.io',    role: 'community_mgr', lastActive: '1d ago' },
  { id: 'a4', name: 'Robin Chen',    email: 'robin@mychatapp.io',   role: 'content_mod',   lastActive: '3d ago' },
]

// ─── Shared micro-components ──────────────────────────────────────
function Av({ name, size = 28 }: { name: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: ac(name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
      {name.split(' ').map(n => n[0]).join('').slice(0, 2)}
    </div>
  )
}

function IconBtn({ title, color = MUTED, children, onClick }: { title: string; color?: string; children: React.ReactNode; onClick?: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background: hov ? '#F0F2F5' : 'transparent', border: 'none', borderRadius: 6, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: hov ? color : MUTED, transition: 'background 0.1s, color 0.1s', flexShrink: 0 }}>
      {children}
    </button>
  )
}

function SearchBar({ placeholder, value, onChange }: { placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 7, padding: '6px 10px', minWidth: 200 }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke={MUTED} strokeWidth="2"/><path d="M21 21l-4.35-4.35" stroke={MUTED} strokeWidth="2" strokeLinecap="round"/></svg>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ border: 'none', outline: 'none', fontSize: 13, color: TEXT, background: 'transparent', fontFamily: 'inherit', width: '100%' }} />
    </div>
  )
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 7, padding: '6px 10px', fontSize: 12, color: TEXT, cursor: 'pointer', outline: 'none', fontFamily: 'inherit', height: 32 }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function GradBtn({ label, small = false, onClick }: { label: string; small?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick}
      style={{ background: GRAD, color: '#fff', border: 'none', borderRadius: 7, padding: small ? '5px 12px' : '7px 16px', fontSize: small ? 12 : 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(8,102,255,0.2)' }}>
      {label}
    </button>
  )
}

function OutlineBtn({ label, small = false, onClick }: { label: string; small?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick}
      style={{ background: CARD, color: SUB, border: `1px solid ${BORDER}`, borderRadius: 7, padding: small ? '5px 12px' : '7px 16px', fontSize: small ? 12 : 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
      {label}
    </button>
  )
}

// ─── Table primitives ─────────────────────────────────────────────
function THead({ cols }: { cols: string[] }) {
  return (
    <thead>
      <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
        {cols.map((c, i) => (
          <th key={i} style={{ padding: '9px 12px', fontSize: 11, fontWeight: 700, color: MUTED, textAlign: 'left', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: 0.5, background: BG }}>
            {c}
          </th>
        ))}
      </tr>
    </thead>
  )
}

function TR({ children, selected }: { children: React.ReactNode; selected?: boolean }) {
  const [hov, setHov] = useState(false)
  return (
    <tr
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background: selected ? 'rgba(8,102,255,0.04)' : hov ? '#FAFBFC' : CARD, borderBottom: `1px solid ${DIVIDER}`, transition: 'background 0.08s' }}>
      {children}
    </tr>
  )
}

function TD({ children, muted = false, nowrap = false }: { children: React.ReactNode; muted?: boolean; nowrap?: boolean }) {
  return (
    <td style={{ padding: '9px 12px', fontSize: 13, color: muted ? MUTED : TEXT, verticalAlign: 'middle', whiteSpace: nowrap ? 'nowrap' : 'normal' }}>
      {children}
    </td>
  )
}

// ─── Stat card ────────────────────────────────────────────────────
function StatCard({ label, value, delta, deltaPositive, icon, accent }: {
  label: string; value: string; delta: string; deltaPositive: boolean; icon: React.ReactNode; accent: string
}) {
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: TEXT, lineHeight: 1.2, marginTop: 6 }}>{value}</div>
        </div>
        <div style={{ width: 38, height: 38, borderRadius: 9, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: 12, color: deltaPositive ? SUCCESS : ERROR, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
        <span>{deltaPositive ? '↑' : '↓'}</span>
        <span>{delta}</span>
        <span style={{ color: MUTED, fontWeight: 400 }}>vs last week</span>
      </div>
    </div>
  )
}

// ─── Section header ───────────────────────────────────────────────
function SectionHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, color: TEXT, margin: 0 }}>{title}</h2>
      {children && <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>{children}</div>}
    </div>
  )
}

// ─── Pagination ───────────────────────────────────────────────────
function Pagination({ page, total, perPage, onChange }: { page: number; total: number; perPage: number; onChange: (p: number) => void }) {
  const pages = Math.ceil(total / perPage)
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderTop: `1px solid ${BORDER}`, fontSize: 12, color: MUTED }}>
      <span>Showing {((page - 1) * perPage) + 1}–{Math.min(page * perPage, total)} of {total}</span>
      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={() => onChange(page - 1)} disabled={page === 1}
          style={{ background: page === 1 ? BG : CARD, border: `1px solid ${BORDER}`, borderRadius: 5, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: page === 1 ? 'default' : 'pointer', color: page === 1 ? MUTED : TEXT, fontSize: 13 }}>‹</button>
        {Array.from({ length: Math.min(pages, 5) }).map((_, i) => {
          const p = i + 1
          return (
            <button key={p} onClick={() => onChange(p)}
              style={{ background: p === page ? PRIMARY : CARD, color: p === page ? '#fff' : TEXT, border: `1px solid ${p === page ? PRIMARY : BORDER}`, borderRadius: 5, width: 28, height: 28, fontSize: 12, fontWeight: p === page ? 700 : 400, cursor: 'pointer' }}>{p}</button>
          )
        })}
        <button onClick={() => onChange(page + 1)} disabled={page === pages}
          style={{ background: page === pages ? BG : CARD, border: `1px solid ${BORDER}`, borderRadius: 5, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: page === pages ? 'default' : 'pointer', color: page === pages ? MUTED : TEXT, fontSize: 13 }}>›</button>
      </div>
    </div>
  )
}

// ─── Table wrapper ────────────────────────────────────────────────
function TableCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
          {children}
        </table>
      </div>
    </div>
  )
}

// ─── Sidebar nav ──────────────────────────────────────────────────
const NAV_ITEMS: { id: AdminScreen; label: string; icon: React.ReactNode; badge?: number }[] = [
  {
    id: 'home', label: 'Dashboard',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/></svg>,
  },
  {
    id: 'users', label: 'Users',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
    badge: 2,
  },
  {
    id: 'blogs', label: 'Blog Posts',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  },
  {
    id: 'communities', label: 'Communities',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  },
  {
    id: 'roles', label: 'Role Management',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  },
]

function Sidebar({ active, onNav, collapsed, onToggle }: {
  active: AdminScreen; onNav: (s: AdminScreen) => void; collapsed: boolean; onToggle: () => void
}) {
  const BOTTOM = [
    { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.8"/></svg>, label: 'Settings' },
    { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>, label: 'Sign Out' },
  ]

  return (
    <div style={{ width: collapsed ? 52 : 220, background: SIDEBAR_BG, display: 'flex', flexDirection: 'column', flexShrink: 0, transition: 'width 0.2s', overflow: 'hidden' }}>
      {/* Logo */}
      <div style={{ height: 52, borderBottom: `1px solid rgba(255,255,255,0.07)`, display: 'flex', alignItems: 'center', padding: collapsed ? '0 14px' : '0 16px', gap: 10, flexShrink: 0 }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M21 15H7L3 21V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        {!collapsed && <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', letterSpacing: -0.3 }}>MyChatApp <span style={{ color: SIDEBAR_MUTED, fontWeight: 400 }}>Admin</span></span>}
        <button onClick={onToggle} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', cursor: 'pointer', color: SIDEBAR_MUTED, padding: 2, display: 'flex', flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d={collapsed ? 'M9 18l6-6-6-6' : 'M15 18l-6-6 6-6'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>

      {/* Nav section label */}
      {!collapsed && (
        <div style={{ padding: '14px 16px 4px', fontSize: 10, fontWeight: 700, color: SIDEBAR_MUTED, textTransform: 'uppercase', letterSpacing: 1 }}>Navigation</div>
      )}

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_ITEMS.map(item => {
          const isActive = item.id === active
          return (
            <button key={item.id} onClick={() => onNav(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: collapsed ? '8px 10px' : '8px 10px',
                borderRadius: 7, border: 'none', cursor: 'pointer',
                background: isActive ? SIDEBAR_ACTIVE : 'transparent',
                color: isActive ? '#fff' : SIDEBAR_TEXT,
                textAlign: 'left', fontFamily: 'inherit', fontSize: 13,
                fontWeight: isActive ? 600 : 400, whiteSpace: 'nowrap',
                transition: 'background 0.1s',
                justifyContent: collapsed ? 'center' : 'flex-start',
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = SIDEBAR_HOVER }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
              <span style={{ color: isActive ? '#fff' : SIDEBAR_MUTED, flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
              {!collapsed && item.badge && (
                <span style={{ background: ERROR, color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 9999, minWidth: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{item.badge}</span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom */}
      {!collapsed && <div style={{ padding: '6px 8px', borderTop: `1px solid rgba(255,255,255,0.07)` }}>
        {BOTTOM.map(b => (
          <button key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 7, border: 'none', cursor: 'pointer', background: 'transparent', color: SIDEBAR_MUTED, textAlign: 'left', fontFamily: 'inherit', fontSize: 12, width: '100%' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = SIDEBAR_HOVER}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
            {b.icon}<span>{b.label}</span>
          </button>
        ))}
      </div>}
    </div>
  )
}

// ─── Top bar ──────────────────────────────────────────────────────
function TopBar({ screen, collapsed }: { screen: AdminScreen; collapsed: boolean }) {
  const labels: Record<AdminScreen, string> = {
    home: 'Dashboard', users: 'User Management', blogs: 'Blog Management',
    communities: 'Community Management', roles: 'Role Assignment',
  }
  return (
    <div style={{ height: 52, background: CARD, borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', flexShrink: 0 }}>
      <div>
        <span style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{labels[screen]}</span>
        <span style={{ fontSize: 12, color: MUTED, marginLeft: 8 }}>/ {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Notification bell */}
        <div style={{ position: 'relative' }}>
          <button style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 7, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke={MUTED} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <span style={{ position: 'absolute', top: 3, right: 3, width: 7, height: 7, borderRadius: '50%', background: ERROR, border: '1.5px solid #fff' }} />
        </div>
        {/* Admin badge + avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '4px 10px 4px 6px' }}>
          <Av name="Jordan Kim" size={24} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: TEXT, lineHeight: 1.2 }}>Jordan Kim</div>
            <div style={{ fontSize: 10, color: MUTED }}>Super Admin</div>
          </div>
          <RoleBadge role="super_admin" compact />
        </div>
      </div>
    </div>
  )
}

// ─── SCREEN 1: Dashboard Home ─────────────────────────────────────
function HomeScreen() {
  const stats = [
    { label: 'Total Users',         value: '24,891', delta: '+312 (1.3%)', deltaPositive: true,  accent: 'rgba(8,102,255,0.1)',   icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke={PRIMARY} strokeWidth="1.8" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke={PRIMARY} strokeWidth="1.8"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke={PRIMARY} strokeWidth="1.8" strokeLinecap="round"/></svg> },
    { label: 'Active Communities',  value: '1,204',  delta: '+24 (2.0%)', deltaPositive: true,  accent: 'rgba(139,92,246,0.1)', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#8B5CF6" strokeWidth="1.8"/><path d="M12 8v4l3 3" stroke="#8B5CF6" strokeWidth="1.8" strokeLinecap="round"/></svg> },
    { label: 'Posts This Week',     value: '3,742',  delta: '+841 (28%)', deltaPositive: true,  accent: 'rgba(0,178,255,0.1)',  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#00B2FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    { label: 'Pending Reports',     value: '17',     delta: '+5 (41%)',  deltaPositive: false, accent: 'rgba(250,56,62,0.08)', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke={ERROR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="9" x2="12" y2="13" stroke={ERROR} strokeWidth="1.8" strokeLinecap="round"/><line x1="12" y1="17" x2="12.01" y2="17" stroke={ERROR} strokeWidth="2" strokeLinecap="round"/></svg> },
  ]

  const recentActivity = [
    { user: 'Ben Carter',    action: 'Account suspended by Jordan Kim',    time: '8m ago',  type: 'warn' },
    { user: 'Dana Park',     action: 'New registration awaiting approval',  time: '22m ago', type: 'info' },
    { user: 'Robin Chen',    action: 'Promoted to Content Moderator',       time: '1h ago',  type: 'success' },
    { user: 'Design Guild',  action: 'Community flagged for review (3)',    time: '2h ago',  type: 'warn' },
    { user: 'Alex Johnson',  action: 'Post pinned: "WebSocket at Scale"',   time: '3h ago',  type: 'info' },
  ]

  const typeColor: Record<string, string> = { warn: WARNING, info: INFO, success: SUCCESS }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 40px' }}>
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
        {stats.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Recent activity */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Recent Activity</span>
            <button style={{ fontSize: 12, color: PRIMARY, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>View all</button>
          </div>
          <div>
            {recentActivity.map((a, i) => (
              <div key={i} style={{ padding: '10px 16px', display: 'flex', gap: 10, alignItems: 'flex-start', borderBottom: i < recentActivity.length - 1 ? `1px solid ${DIVIDER}` : 'none' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: typeColor[a.type], flexShrink: 0, marginTop: 5 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{a.user} </span>
                  <span style={{ fontSize: 13, color: MUTED }}>{a.action}</span>
                </div>
                <span style={{ fontSize: 11, color: MUTED, flexShrink: 0 }}>{a.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick stats table */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${BORDER}` }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Role Distribution</span>
          </div>
          <div style={{ padding: '8px 0' }}>
            {([
              { role: 'super_admin' as Role,   count: 2,   pct: 0.008 },
              { role: 'content_mod' as Role,   count: 14,  pct: 0.056 },
              { role: 'community_mgr' as Role, count: 38,  pct: 0.153 },
              { role: 'user' as Role,           count: 24837, pct: 0.783 },
            ]).map(r => (
              <div key={r.role} style={{ padding: '8px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
                <RoleBadge role={r.role} compact />
                <div style={{ flex: 1, height: 5, background: BG, borderRadius: 9999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${r.pct * 100}%`, background: ROLE_META[r.role].gradient ? GRAD : ROLE_META[r.role].bg, borderRadius: 9999 }} />
                </div>
                <span style={{ fontSize: 12, color: MUTED, flexShrink: 0, minWidth: 44, textAlign: 'right' }}>{r.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: '10px 16px', borderTop: `1px solid ${BORDER}` }}>
            <span style={{ fontSize: 11, color: MUTED }}>Total 24,891 registered accounts</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── SCREEN 2: User Management ────────────────────────────────────
function UsersScreen() {
  const [query, setQuery]     = useState('')
  const [roleF, setRoleF]     = useState('all')
  const [statusF, setStatusF] = useState('all')
  const [page, setPage]       = useState(1)
  const [selected, setSelected] = useState<string[]>([])
  const PER = 6

  const filtered = USERS.filter(u =>
    (roleF === 'all'   || u.role === roleF) &&
    (statusF === 'all' || u.status === statusF) &&
    (u.name.toLowerCase().includes(query.toLowerCase()) || u.email.toLowerCase().includes(query.toLowerCase()))
  )
  const paged = filtered.slice((page - 1) * PER, page * PER)

  const toggleSelect = (id: string) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 40px' }}>
      <SectionHeader title="Users">
        <SearchBar placeholder="Search by name or email…" value={query} onChange={v => { setQuery(v); setPage(1) }} />
        <Select value={roleF} onChange={v => { setRoleF(v); setPage(1) }} options={[{value:'all',label:'All Roles'},{value:'super_admin',label:'Super Admin'},{value:'content_mod',label:'Content Mod'},{value:'community_mgr',label:'Community Mgr'},{value:'user',label:'User'}]} />
        <Select value={statusF} onChange={v => { setStatusF(v); setPage(1) }} options={[{value:'all',label:'All Status'},{value:'active',label:'Active'},{value:'suspended',label:'Suspended'},{value:'pending',label:'Pending'}]} />
        <GradBtn label="+ Invite User" />
      </SectionHeader>

      {selected.length > 0 && (
        <div style={{ background: 'rgba(8,102,255,0.06)', border: `1px solid rgba(8,102,255,0.2)`, borderRadius: 8, padding: '8px 14px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
          <span style={{ fontWeight: 600, color: PRIMARY }}>{selected.length} selected</span>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: ERROR, fontFamily: 'inherit', fontSize: 12, fontWeight: 600 }}>Suspend all</button>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: ERROR, fontFamily: 'inherit', fontSize: 12, fontWeight: 600 }}>Delete all</button>
          <button onClick={() => setSelected([])} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: MUTED, fontFamily: 'inherit', fontSize: 12 }}>Clear</button>
        </div>
      )}

      <TableCard>
        <THead cols={['', 'User', 'Email', 'Role', 'Status', 'Posts', 'Joined', 'Actions']} />
        <tbody>
          {paged.map(u => (
            <TR key={u.id} selected={selected.includes(u.id)}>
              <TD nowrap>
                <input type="checkbox" checked={selected.includes(u.id)} onChange={() => toggleSelect(u.id)} style={{ cursor: 'pointer', accentColor: PRIMARY }} />
              </TD>
              <TD>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Av name={u.name} size={28} />
                  <span style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap' }}>{u.name}</span>
                </div>
              </TD>
              <TD muted nowrap>{u.email}</TD>
              <TD nowrap><RoleBadge role={u.role} /></TD>
              <TD nowrap><StatusBadge status={u.status} /></TD>
              <TD muted nowrap>{u.posts}</TD>
              <TD muted nowrap>{u.joined}</TD>
              <TD nowrap>
                <div style={{ display: 'flex', gap: 2 }}>
                  <IconBtn title="Edit" color={PRIMARY}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                  </IconBtn>
                  <IconBtn title={u.status === 'suspended' ? 'Unsuspend' : 'Suspend'} color={WARNING}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                  </IconBtn>
                  <IconBtn title="Delete" color={ERROR}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><polyline points="3,6 5,6 21,6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </IconBtn>
                </div>
              </TD>
            </TR>
          ))}
          {paged.length === 0 && (
            <tr><td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: MUTED, fontSize: 13 }}>No users match your filters.</td></tr>
          )}
        </tbody>
      </TableCard>

      <Pagination page={page} total={filtered.length} perPage={PER} onChange={setPage} />
    </div>
  )
}

// ─── SCREEN 3: Blog Management ────────────────────────────────────
function BlogsScreen() {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const PER = 6
  const filtered = POSTS_DATA.filter(p => p.title.toLowerCase().includes(query.toLowerCase()) || p.author.toLowerCase().includes(query.toLowerCase()))
  const paged = filtered.slice((page - 1) * PER, page * PER)

  const TAG_COLORS: Record<string, string> = { Engineering: PRIMARY, Design: '#8B5CF6', Product: SUCCESS, Community: WARNING }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 40px' }}>
      <SectionHeader title="Blog Posts">
        <SearchBar placeholder="Search posts…" value={query} onChange={v => { setQuery(v); setPage(1) }} />
        <GradBtn label="+ New Post" />
      </SectionHeader>

      <TableCard>
        <THead cols={['Post', 'Author', 'Tag', 'Date', '♥', '💬', 'Pinned', 'Actions']} />
        <tbody>
          {paged.map(p => (
            <TR key={p.id}>
              <TD>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', minWidth: 240 }}>
                  {/* Mini cover */}
                  <div style={{ width: 40, height: 32, borderRadius: 5, background: GRAD, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.8 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5z" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: TEXT, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', maxWidth: 280 }}>{p.title}</span>
                </div>
              </TD>
              <TD>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap' }}>
                  <Av name={p.author} size={22} />
                  <span style={{ fontSize: 12 }}>{p.author}</span>
                </div>
              </TD>
              <TD nowrap>
                <span style={{ background: `${TAG_COLORS[p.tag] ?? MUTED}18`, color: TAG_COLORS[p.tag] ?? MUTED, fontSize: 11, fontWeight: 600, borderRadius: 4, padding: '2px 7px' }}>{p.tag}</span>
              </TD>
              <TD muted nowrap>{p.date}</TD>
              <TD muted nowrap>{p.likes.toLocaleString()}</TD>
              <TD muted nowrap>{p.comments}</TD>
              <TD nowrap>
                <span style={{ fontSize: 11, fontWeight: 600, color: p.pinned ? SUCCESS : MUTED }}>
                  {p.pinned ? '📌 Pinned' : '—'}
                </span>
              </TD>
              <TD nowrap>
                <div style={{ display: 'flex', gap: 2 }}>
                  <IconBtn title="Edit" color={PRIMARY}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                  </IconBtn>
                  <IconBtn title={p.pinned ? 'Unpin' : 'Pin'} color={SUCCESS}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>
                  </IconBtn>
                  <IconBtn title="Delete" color={ERROR}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><polyline points="3,6 5,6 21,6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </IconBtn>
                </div>
              </TD>
            </TR>
          ))}
        </tbody>
      </TableCard>
      <Pagination page={page} total={filtered.length} perPage={PER} onChange={setPage} />
    </div>
  )
}

// ─── SCREEN 4: Community Management ──────────────────────────────
function ManageMembersModal({ community, onClose }: { community: Community; onClose: () => void }) {
  const members = USERS.slice(0, 5)
  const [roles, setRoles] = useState<Record<string, Role>>(() =>
    Object.fromEntries(members.map(m => [m.id, m.role]))
  )

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(3px)', padding: 24 }}>
      <div style={{ background: CARD, borderRadius: 12, width: '100%', maxWidth: 560, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>Manage Members</div>
            <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{community.name} · {community.members.toLocaleString()} members</div>
          </div>
          <button onClick={onClose} style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 6, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke={MUTED} strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '10px 20px', borderBottom: `1px solid ${DIVIDER}` }}>
          <SearchBar placeholder="Search members…" value="" onChange={() => {}} />
        </div>

        {/* Member list */}
        <div style={{ maxHeight: 320, overflowY: 'auto' }}>
          {members.map((m, i) => (
            <div key={m.id} style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: i < members.length - 1 ? `1px solid ${DIVIDER}` : 'none' }}>
              <Av name={m.name} size={30} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{m.name}</div>
                <div style={{ fontSize: 11, color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.email}</div>
              </div>
              <select
                value={roles[m.id]}
                onChange={e => setRoles(r => ({ ...r, [m.id]: e.target.value as Role }))}
                style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 600, color: TEXT, cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}>
                <option value="user">User</option>
                <option value="community_mgr">Community Mgr</option>
                <option value="content_mod">Content Mod</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: `1px solid ${BORDER}`, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <OutlineBtn label="Cancel" onClick={onClose} />
          <GradBtn label="Save Changes" onClick={onClose} />
        </div>
      </div>
    </div>
  )
}

function CommunitiesScreen() {
  const [query, setQuery] = useState('')
  const [managingCommunity, setManagingCommunity] = useState<Community | null>(null)

  const filtered = COMMUNITIES.filter(c => c.name.toLowerCase().includes(query.toLowerCase()))

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 40px' }}>
      <SectionHeader title="Communities">
        <SearchBar placeholder="Search communities…" value={query} onChange={setQuery} />
        <GradBtn label="+ Create Community" />
      </SectionHeader>

      <TableCard>
        <THead cols={['Community', 'Members', 'Admin(s)', 'Created', 'Posts', 'Status', 'Actions']} />
        <tbody>
          {filtered.map(c => (
            <TR key={c.id}>
              <TD>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: GRAD, flexShrink: 0 }} />
                  <span style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap' }}>{c.name}</span>
                </div>
              </TD>
              <TD muted nowrap>{c.members.toLocaleString()}</TD>
              <TD>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {c.admins.slice(0, 2).map(a => (
                    <div key={a} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Av name={a} size={20} />
                      <span style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{a.split(' ')[0]}</span>
                    </div>
                  ))}
                  {c.admins.length > 2 && <span style={{ fontSize: 11, color: MUTED }}>+{c.admins.length - 2}</span>}
                </div>
              </TD>
              <TD muted nowrap>{c.created}</TD>
              <TD muted nowrap>{c.posts.toLocaleString()}</TD>
              <TD nowrap>
                <span style={{ fontSize: 11, fontWeight: 600, color: c.active ? SUCCESS : MUTED, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.active ? SUCCESS : MUTED, display: 'inline-block' }} />
                  {c.active ? 'Active' : 'Inactive'}
                </span>
              </TD>
              <TD nowrap>
                <div style={{ display: 'flex', gap: 2 }}>
                  <IconBtn title="Manage Members" color={PRIMARY} onClick={() => setManagingCommunity(c)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                  </IconBtn>
                  <IconBtn title="Edit" color={WARNING}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                  </IconBtn>
                  <IconBtn title="Delete" color={ERROR}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><polyline points="3,6 5,6 21,6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </IconBtn>
                </div>
              </TD>
            </TR>
          ))}
        </tbody>
      </TableCard>

      {managingCommunity && <ManageMembersModal community={managingCommunity} onClose={() => setManagingCommunity(null)} />}
    </div>
  )
}

// ─── SCREEN 5: Role Assignment ────────────────────────────────────
function RolesScreen() {
  const [roles, setRoles] = useState<Record<string, Role>>(() =>
    Object.fromEntries(ADMIN_USERS.map(u => [u.id, u.role]))
  )
  const [saved, setSaved] = useState(false)

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2500) }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 40px' }}>
      {/* Warning banner */}
      <div style={{ background: 'rgba(250,56,62,0.05)', border: `1px solid rgba(250,56,62,0.2)`, borderRadius: 8, padding: '10px 14px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1 }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={ERROR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        <div>
          <span style={{ fontSize: 13, fontWeight: 700, color: ERROR }}>Super Admin Access Only</span>
          <span style={{ fontSize: 12, color: MUTED, marginLeft: 8 }}>Role changes take effect immediately and are logged to the audit trail.</span>
        </div>
      </div>

      <SectionHeader title="Admin Role Assignment">
        <GradBtn label={saved ? '✓ Saved' : 'Save All Changes'} onClick={handleSave} />
      </SectionHeader>

      {/* Role legend */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {(Object.entries(ROLE_META) as [Role, typeof ROLE_META[Role]][]).map(([role, meta]) => (
          <div key={role} style={{ display: 'flex', alignItems: 'center', gap: 6, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 7, padding: '6px 10px' }}>
            <RoleBadge role={role} compact />
            <span style={{ fontSize: 11, color: MUTED }}>—</span>
            <span style={{ fontSize: 11, color: MUTED }}>
              {role === 'super_admin'   ? 'Full access to all admin functions' :
               role === 'content_mod'   ? 'Can moderate posts and comments' :
               role === 'community_mgr' ? 'Can manage community memberships' :
               'Standard user, no admin access'}
            </span>
          </div>
        ))}
      </div>

      <TableCard>
        <THead cols={['Admin User', 'Email', 'Current Role', 'Assign New Role', 'Last Active', 'Actions']} />
        <tbody>
          {ADMIN_USERS.map(u => (
            <TR key={u.id}>
              <TD>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
                  <Av name={u.name} size={28} />
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</span>
                </div>
              </TD>
              <TD muted nowrap>{u.email}</TD>
              <TD nowrap><RoleBadge role={u.role} /></TD>
              <TD nowrap>
                <select
                  value={roles[u.id]}
                  onChange={e => setRoles(r => ({ ...r, [u.id]: e.target.value as Role }))}
                  style={{ background: roles[u.id] !== u.role ? 'rgba(8,102,255,0.06)' : BG, border: `1px solid ${roles[u.id] !== u.role ? PRIMARY : BORDER}`, borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 600, color: TEXT, cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}>
                  <option value="user">User</option>
                  <option value="community_mgr">Community Mgr</option>
                  <option value="content_mod">Content Mod</option>
                  <option value="super_admin">Super Admin</option>
                </select>
                {roles[u.id] !== u.role && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: PRIMARY }}>CHANGED</span>}
              </TD>
              <TD muted nowrap>{u.lastActive}</TD>
              <TD nowrap>
                <div style={{ display: 'flex', gap: 2 }}>
                  <IconBtn title="View audit log" color={PRIMARY}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><polyline points="10,9 9,9 8,9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                  </IconBtn>
                  <IconBtn title="Revoke admin access" color={ERROR}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                  </IconBtn>
                </div>
              </TD>
            </TR>
          ))}
        </tbody>
      </TableCard>

      {/* Audit log preview */}
      <div style={{ marginTop: 24 }}>
        <SectionHeader title="Recent Role Changes" />
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden' }}>
          {[
            { actor: 'Jordan Kim', target: 'Robin Chen',    from: 'user',         to: 'content_mod',   time: '1d ago' },
            { actor: 'Jordan Kim', target: 'Alex Johnson',  from: 'content_mod',  to: 'community_mgr', time: '5d ago' },
            { actor: 'Jordan Kim', target: 'Taylor Reeves', from: 'user',         to: 'content_mod',   time: '12d ago' },
          ].map((log, i, arr) => (
            <div key={i} style={{ padding: '10px 16px', display: 'flex', gap: 10, alignItems: 'center', borderBottom: i < arr.length - 1 ? `1px solid ${DIVIDER}` : 'none', fontSize: 12 }}>
              <Av name={log.actor} size={22} />
              <span style={{ color: TEXT, fontWeight: 600 }}>{log.actor}</span>
              <span style={{ color: MUTED }}>changed</span>
              <span style={{ color: TEXT, fontWeight: 600 }}>{log.target}</span>
              <span style={{ color: MUTED }}>from</span>
              <RoleBadge role={log.from as Role} compact />
              <span style={{ color: MUTED }}>to</span>
              <RoleBadge role={log.to as Role} compact />
              <span style={{ marginLeft: 'auto', color: MUTED, whiteSpace: 'nowrap' }}>{log.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Mobile card-per-row layout ───────────────────────────────────
function MobileUsers() {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 40px' }}>
      <SectionHeader title="Users">
        <SearchBar placeholder="Search…" value="" onChange={() => {}} />
      </SectionHeader>
      {USERS.map(u => (
        <div key={u.id} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '12px 14px', marginBottom: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
            <Av name={u.name} size={36} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{u.name}</div>
              <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{u.email}</div>
            </div>
            <StatusBadge status={u.status} />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            <RoleBadge role={u.role} />
            <span style={{ fontSize: 11, color: MUTED, background: BG, borderRadius: 4, padding: '2px 7px' }}>Joined {u.joined}</span>
            <span style={{ fontSize: 11, color: MUTED, background: BG, borderRadius: 4, padding: '2px 7px' }}>{u.posts} posts</span>
          </div>
          <div style={{ display: 'flex', gap: 6, paddingTop: 8, borderTop: `1px solid ${DIVIDER}` }}>
            <OutlineBtn label="Edit" small />
            <OutlineBtn label="Suspend" small />
            <button style={{ marginLeft: 'auto', background: 'rgba(250,56,62,0.07)', color: ERROR, border: `1px solid rgba(250,56,62,0.2)`, borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Device frame ─────────────────────────────────────────────────
function DeviceFrame({ bp, children }: { bp: Breakpoint; children: React.ReactNode }) {
  const C = {
    mobile:  { w: 390, h: 780, scale: 0.78, r: 44, chrome: false },
    tablet:  { w: 834, h: 680, scale: 0.7,  r: 12, chrome: true },
    desktop: { w: 1280,h: 680, scale: 0.63, r: 10, chrome: true },
  }[bp]
  const isMobile = bp === 'mobile'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {C.chrome && (
        <div style={{ width: C.w * C.scale, background: '#E0E2E6', borderRadius: `${C.r}px ${C.r}px 0 0`, padding: '9px 14px 8px', display: 'flex', alignItems: 'center', gap: 6, border: '1.5px solid #CCC', borderBottom: 'none' }}>
          {['#FA383E','#F7B928','#31A24C'].map((c,i) => <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
          <div style={{ flex: 1, background: '#fff', borderRadius: 6, height: 22, display: 'flex', alignItems: 'center', paddingLeft: 10, fontSize: 11, color: MUTED, marginLeft: 8 }}>mychatapp.io/admin</div>
        </div>
      )}
      <div style={{ width: C.w * C.scale, height: C.h * C.scale, border: isMobile ? '8px solid #1A1A1A' : '1.5px solid #CCC', borderTop: isMobile ? '8px solid #1A1A1A' : C.chrome ? 'none' : '1.5px solid #CCC', borderRadius: isMobile ? C.r : C.chrome ? `0 0 ${C.r}px ${C.r}px` : C.r, overflow: 'hidden', boxShadow: isMobile ? '0 24px 64px rgba(0,0,0,0.28)' : '0 8px 32px rgba(0,0,0,0.14)', background: BG, position: 'relative' }}>
        {isMobile && <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 90, height: 22, background: '#1A1A1A', borderRadius: '0 0 14px 14px', zIndex: 20 }} />}
        <div style={{ width: C.w, height: C.h, transform: `scale(${C.scale})`, transformOrigin: 'top left', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {isMobile && <div style={{ height: 36, flexShrink: 0, background: '#1C1E21', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', fontSize: 12, fontWeight: 600, color: '#fff' }}><span>9:41</span><span style={{ letterSpacing: 2 }}>●●●</span></div>}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>{children}</div>
        </div>
      </div>
      {isMobile && <div style={{ width: 100, height: 4, borderRadius: 2, background: '#1A1A1A', opacity: 0.4, marginTop: 6 }} />}
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────
export default function AdminDashboard() {
  const [bp, setBp] = useState<Breakpoint>('desktop')
  const [screen, setScreen] = useState<AdminScreen>('home')
  const [collapsed, setCollapsed] = useState(false)

  // auto-collapse sidebar on tablet
  const effectiveCollapsed = bp === 'tablet' ? true : collapsed

  const SCREENS: Record<AdminScreen, React.ReactNode> = {
    home:        <HomeScreen />,
    users:       bp === 'mobile' ? <MobileUsers /> : <UsersScreen />,
    blogs:       <BlogsScreen />,
    communities: <CommunitiesScreen />,
    roles:       <RolesScreen />,
  }

  const bpLabels: Record<Breakpoint, string> = {
    mobile: '390px — Mobile (graceful degradation)',
    tablet: '834px — Tablet (icon rail sidebar)',
    desktop: '1440px — Desktop (full sidebar)',
  }

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: BG, minHeight: '100vh' }}>
      {/* Control strip */}
      <div style={{ background: GRAD, padding: '18px 40px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>Admin Dashboard</h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: '3px 0 0' }}>5 screens · dense utilitarian layout · role-based access</p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Breakpoint */}
            <div style={{ display: 'flex', gap: 3, background: 'rgba(255,255,255,0.15)', borderRadius: 9999, padding: 4 }}>
              {(['mobile','tablet','desktop'] as Breakpoint[]).map(b => (
                <button key={b} onClick={() => { setBp(b); if (b === 'tablet') setCollapsed(true) }}
                  style={{ background: bp === b ? '#fff' : 'transparent', color: bp === b ? '#0866FF' : 'rgba(255,255,255,0.85)', border: 'none', borderRadius: 9999, padding: '5px 14px', fontSize: 13, fontWeight: bp === b ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize', transition: 'all 0.15s' }}>
                  {b}
                </button>
              ))}
            </div>
            {/* Screen */}
            <div style={{ display: 'flex', gap: 3, background: 'rgba(255,255,255,0.15)', borderRadius: 9999, padding: 4, flexWrap: 'wrap' }}>
              {NAV_ITEMS.map(n => (
                <button key={n.id} onClick={() => setScreen(n.id)}
                  style={{ background: screen === n.id ? '#fff' : 'transparent', color: screen === n.id ? '#0866FF' : 'rgba(255,255,255,0.85)', border: 'none', borderRadius: 9999, padding: '5px 10px', fontSize: 12, fontWeight: screen === n.id ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
                  {n.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Frame */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '36px 40px 80px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <DeviceFrame bp={bp}>
          {bp === 'mobile' ? (
            /* Mobile: hamburger drawer pattern — show only content, simplified */
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Mobile top bar */}
              <div style={{ height: 48, background: SIDEBAR_BG, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M21 15H7L3 21V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Admin</span>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <Av name="Jordan Kim" size={26} />
                  <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: 4 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><line x1="3" y1="6" x2="21" y2="6" stroke="white" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="12" x2="21" y2="12" stroke="white" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="18" x2="21" y2="18" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
                  </button>
                </div>
              </div>
              {/* Mobile sub-nav pill row */}
              <div style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: '8px 10px', display: 'flex', gap: 5, overflowX: 'auto' }}>
                {NAV_ITEMS.map(n => (
                  <button key={n.id} onClick={() => setScreen(n.id)}
                    style={{ background: screen === n.id ? PRIMARY : BG, color: screen === n.id ? '#fff' : MUTED, border: `1px solid ${screen === n.id ? PRIMARY : BORDER}`, borderRadius: 9999, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {n.label}
                  </button>
                ))}
              </div>
              {SCREENS[screen]}
            </div>
          ) : (
            <div style={{ display: 'flex', height: '100%' }}>
              <Sidebar active={screen} onNav={setScreen} collapsed={effectiveCollapsed} onToggle={() => setCollapsed(c => !c)} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <TopBar screen={screen} collapsed={effectiveCollapsed} />
                {SCREENS[screen]}
              </div>
            </div>
          )}
        </DeviceFrame>

        <p style={{ fontSize: 13, color: MUTED, textAlign: 'center' }}>
          {bpLabels[bp]} — use the controls above to switch screens and breakpoints
        </p>
      </div>
    </div>
  )
}
