import { useState } from 'react'
import AuthFlow from './AuthFlow'
import ChatExperience from './ChatExperience'
import BlogFeed from './BlogFeed'
import AdminDashboard from './AdminDashboard'
import ProfileAndSettings from './ProfileAndSettings'
import NotificationsAndSearch from './NotificationsAndSearch'
import ChatInteractions from './ChatInteractions'
import ConversationActions from './ConversationActions'
import CommunityScreens from './CommunityScreens'
import BlogInteractions from './BlogInteractions'
import AdminExtensions from './AdminExtensions'
import UIStates from './UIStates'

// ─── Color Palette ───────────────────────────────────────────────
const colors = [
  { label: 'Primary Blue', hex: '#0866FF', textDark: true },
  { label: 'Accent Start', hex: '#00B2FF', textDark: true },
  { label: 'Accent End', hex: '#B620E0', textDark: false },
  { label: 'App Background', hex: '#F7F8FA', textDark: true, border: true },
  { label: 'Card / Surface', hex: '#FFFFFF', textDark: true, border: true },
  { label: 'Text Primary', hex: '#050505', textDark: false },
  { label: 'Text Secondary', hex: '#65676B', textDark: false },
  { label: 'Border / Divider', hex: '#E4E6EB', textDark: true, border: true },
  { label: 'Success', hex: '#31A24C', textDark: false },
  { label: 'Warning', hex: '#F7B928', textDark: true },
  { label: 'Error', hex: '#FA383E', textDark: false },
]

// ─── Type Scale ───────────────────────────────────────────────────
const typeScale = [
  { name: 'H1', size: '28px', weight: '700', sample: 'Conversations that connect people' },
  { name: 'H2', size: '22px', weight: '600', sample: 'Your messages, your community' },
  { name: 'H3', size: '18px', weight: '600', sample: 'Recent chats and groups' },
  { name: 'Body', size: '15px', weight: '400', sample: 'Hey! Want to catch up this weekend? It\'s been a while.' },
  { name: 'Caption', size: '13px', weight: '400', sample: 'Delivered · 2:34 PM' },
  { name: 'Button', size: '15px', weight: '600', sample: 'Send Message' },
]

// ─── Spacing Scale ────────────────────────────────────────────────
const spacingScale = [4, 8, 12, 16, 24, 32, 48]

// ─── Section wrapper ─────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-16">
      <h2 style={{ fontSize: 22, fontWeight: 600, color: '#050505', marginBottom: 24, paddingBottom: 12, borderBottom: '1px solid #E4E6EB' }}>
        {title}
      </h2>
      {children}
    </section>
  )
}

// ─── Color Swatch ─────────────────────────────────────────────────
function Swatch({ label, hex, border }: { label: string; hex: string; textDark?: boolean; border?: boolean }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard?.writeText(hex); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
      style={{
        background: hex,
        border: border ? '1px solid #E4E6EB' : 'none',
        borderRadius: 12,
        overflow: 'hidden',
        width: '100%',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'transform 0.15s, box-shadow 0.15s',
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)' }}
    >
      <div style={{ height: 72 }} />
      <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.95)', borderTop: '1px solid #E4E6EB' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#050505' }}>{label}</div>
        <div style={{ fontSize: 12, color: '#65676B', marginTop: 2 }}>{copied ? '✓ Copied!' : hex}</div>
      </div>
    </button>
  )
}

function GradientSwatch() {
  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', gridColumn: 'span 2' }}>
      <div style={{ height: 72, background: 'linear-gradient(135deg, #00B2FF 0%, #B620E0 100%)' }} />
      <div style={{ padding: '10px 12px', background: '#fff', borderTop: '1px solid #E4E6EB' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#050505' }}>Accent Gradient</div>
        <div style={{ fontSize: 12, color: '#65676B', marginTop: 2 }}>linear-gradient(135deg, #00B2FF → #B620E0)</div>
      </div>
    </div>
  )
}

// ─── Buttons ─────────────────────────────────────────────────────
function ButtonShowcase() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'flex-start' }}>
      <div>
        <div style={{ fontSize: 13, color: '#65676B', marginBottom: 12, fontWeight: 500 }}>Primary (Gradient)</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="focus-ring" style={{ background: 'linear-gradient(135deg, #00B2FF, #B620E0)', color: '#fff', border: 'none', borderRadius: 9999, padding: '10px 24px', fontSize: 15, fontWeight: 600, cursor: 'pointer', minWidth: 160 }}>Send Message</button>
          <button style={{ background: 'linear-gradient(135deg, #00B2FF, #B620E0)', color: '#fff', border: 'none', borderRadius: 9999, padding: '10px 24px', fontSize: 15, fontWeight: 600, cursor: 'pointer', opacity: 0.85, transform: 'scale(0.98)', minWidth: 160 }}>Active</button>
          <button className="focus-ring" style={{ background: 'linear-gradient(135deg, #00B2FF, #B620E0)', color: '#fff', border: 'none', borderRadius: 9999, padding: '10px 24px', fontSize: 15, fontWeight: 600, cursor: 'pointer', outline: '2px solid #0866FF', outlineOffset: 2, minWidth: 160 }}>Focused</button>
          <button style={{ background: 'linear-gradient(135deg, #C0C2C9, #A0A2A9)', color: '#fff', border: 'none', borderRadius: 9999, padding: '10px 24px', fontSize: 15, fontWeight: 600, cursor: 'not-allowed', opacity: 0.6, minWidth: 160 }} disabled>Disabled</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
          {['Default', 'Active', 'Focus', 'Disabled'].map(s => <div key={s} style={{ fontSize: 12, color: '#65676B', height: 38, display: 'flex', alignItems: 'center' }}>{s}</div>)}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 13, color: '#65676B', marginBottom: 12, fontWeight: 500 }}>Secondary (Outline)</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="focus-ring" style={{ background: 'transparent', color: '#0866FF', border: '1.5px solid #0866FF', borderRadius: 9999, padding: '10px 24px', fontSize: 15, fontWeight: 600, cursor: 'pointer', minWidth: 160 }}>Follow</button>
          <button style={{ background: 'rgba(8,102,255,0.1)', color: '#0866FF', border: '1.5px solid #0866FF', borderRadius: 9999, padding: '10px 24px', fontSize: 15, fontWeight: 600, cursor: 'pointer', minWidth: 160 }}>Active</button>
          <button className="focus-ring" style={{ background: 'transparent', color: '#0866FF', border: '1.5px solid #0866FF', borderRadius: 9999, padding: '10px 24px', fontSize: 15, fontWeight: 600, cursor: 'pointer', outline: '2px solid #0866FF', outlineOffset: 2, minWidth: 160 }}>Focused</button>
          <button style={{ background: 'transparent', color: '#A0A2A9', border: '1.5px solid #C0C2C9', borderRadius: 9999, padding: '10px 24px', fontSize: 15, fontWeight: 600, cursor: 'not-allowed', opacity: 0.6, minWidth: 160 }} disabled>Disabled</button>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 13, color: '#65676B', marginBottom: 12, fontWeight: 500 }}>Text Button</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="focus-ring" style={{ background: 'transparent', color: '#0866FF', border: 'none', borderRadius: 9999, padding: '10px 16px', fontSize: 15, fontWeight: 600, cursor: 'pointer', minWidth: 140 }}>See All</button>
          <button style={{ background: 'rgba(8,102,255,0.08)', color: '#0866FF', border: 'none', borderRadius: 9999, padding: '10px 16px', fontSize: 15, fontWeight: 600, cursor: 'pointer', minWidth: 140 }}>Active</button>
          <button className="focus-ring" style={{ background: 'transparent', color: '#0866FF', border: 'none', borderRadius: 9999, padding: '10px 16px', fontSize: 15, fontWeight: 600, cursor: 'pointer', outline: '2px solid #0866FF', outlineOffset: 2, minWidth: 140 }}>Focused</button>
          <button style={{ background: 'transparent', color: '#A0A2A9', border: 'none', borderRadius: 9999, padding: '10px 16px', fontSize: 15, fontWeight: 600, cursor: 'not-allowed', opacity: 0.6, minWidth: 140 }} disabled>Disabled</button>
        </div>
      </div>
    </div>
  )
}

// ─── Input Fields ─────────────────────────────────────────────────
function InputShowcase() {
  const [showPw, setShowPw] = useState(false)
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, maxWidth: 740 }}>
      <div style={{ flex: '1 1 300px' }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: '#65676B', display: 'block', marginBottom: 6 }}>Default</label>
        <input placeholder="Search conversations…" style={{ width: '100%', border: '1.5px solid #E4E6EB', borderRadius: 12, padding: '11px 16px', fontSize: 15, color: '#050505', background: '#fff', outline: 'none', fontFamily: 'inherit' }} />
      </div>
      <div style={{ flex: '1 1 300px' }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: '#0866FF', display: 'block', marginBottom: 6 }}>Focused</label>
        <input placeholder="Search conversations…" defaultValue="Alex" style={{ width: '100%', border: '1.5px solid #0866FF', borderRadius: 12, padding: '11px 16px', fontSize: 15, color: '#050505', background: '#fff', outline: 'none', boxShadow: '0 0 0 3px rgba(8,102,255,0.15)', fontFamily: 'inherit' }} />
      </div>
      <div style={{ flex: '1 1 300px' }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: '#65676B', display: 'block', marginBottom: 6 }}>Filled</label>
        <input defaultValue="Alex Johnson" style={{ width: '100%', border: '1.5px solid #E4E6EB', borderRadius: 12, padding: '11px 16px', fontSize: 15, color: '#050505', background: '#fff', outline: 'none', fontFamily: 'inherit' }} />
      </div>
      <div style={{ flex: '1 1 300px' }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: '#FA383E', display: 'block', marginBottom: 6 }}>Error</label>
        <input defaultValue="invalid-email" style={{ width: '100%', border: '1.5px solid #FA383E', borderRadius: 12, padding: '11px 16px', fontSize: 15, color: '#050505', background: '#fff', outline: 'none', boxShadow: '0 0 0 3px rgba(250,56,62,0.12)', fontFamily: 'inherit' }} />
        <p style={{ fontSize: 12, color: '#FA383E', marginTop: 4 }}>Please enter a valid email address.</p>
      </div>
      <div style={{ flex: '1 1 300px' }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: '#A0A2A9', display: 'block', marginBottom: 6 }}>Disabled</label>
        <input defaultValue="Locked field" disabled style={{ width: '100%', border: '1.5px solid #E4E6EB', borderRadius: 12, padding: '11px 16px', fontSize: 15, color: '#A0A2A9', background: '#F7F8FA', outline: 'none', cursor: 'not-allowed', fontFamily: 'inherit' }} />
      </div>
      <div style={{ flex: '1 1 100%' }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: '#65676B', display: 'block', marginBottom: 6 }}>Message Composer</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#fff', border: '1.5px solid #E4E6EB', borderRadius: 9999, padding: '8px 8px 8px 16px' }}>
          <input placeholder="Aa" style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, color: '#050505', background: 'transparent', fontFamily: 'inherit' }} />
          <button style={{ background: 'linear-gradient(135deg, #00B2FF, #B620E0)', border: 'none', borderRadius: 9999, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────
function Avatar({ name, size = 40, online, away }: { name: string; size?: number; online?: boolean; away?: boolean }) {
  const avatarColors = ['#0866FF', '#B620E0', '#00B2FF', '#31A24C', '#F7B928']
  const color = avatarColors[name.charCodeAt(0) % avatarColors.length]
  return (
    <div style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
      <div style={{ width: size, height: size, borderRadius: 9999, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 600, color: '#fff', flexShrink: 0 }}>
        {name.split(' ').map(n => n[0]).join('').slice(0, 2)}
      </div>
      {(online || away) && (
        <span style={{ position: 'absolute', bottom: 1, right: 1, width: size * 0.28, height: size * 0.28, borderRadius: 9999, background: online ? '#31A24C' : '#F7B928', border: '2px solid #fff' }} />
      )}
    </div>
  )
}

function AvatarShowcase() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'flex-end' }}>
      {[
        { name: 'Alex Johnson', size: 24, label: '24px' },
        { name: 'Maria Garcia', size: 32, label: '32px' },
        { name: 'Ben Carter', size: 40, online: true, label: '40px Online' },
        { name: 'Sam Lee', size: 48, online: true, label: '48px Online' },
        { name: 'Jordan Kim', size: 56, away: true, label: '56px Away' },
        { name: 'Taylor Reeves', size: 64, label: '64px' },
      ].map(a => (
        <div key={a.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <Avatar {...a} />
          <span style={{ fontSize: 12, color: '#65676B' }}>{a.label}</span>
        </div>
      ))}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex' }}>
          {['Alex Johnson', 'Maria Garcia', 'Ben Carter'].map((n, i) => (
            <div key={n} style={{ marginLeft: i === 0 ? 0 : -10, zIndex: 3 - i }}>
              <Avatar name={n} size={40} />
            </div>
          ))}
        </div>
        <span style={{ fontSize: 12, color: '#65676B' }}>Group Stack</span>
      </div>
    </div>
  )
}

// ─── Badge / Pills ────────────────────────────────────────────────
function BadgeShowcase() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
      {[1, 7, 23, 99, '99+'].map(b => (
        <div key={b} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <span style={{ background: '#FA383E', color: '#fff', fontSize: 12, fontWeight: 700, borderRadius: 9999, minWidth: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px' }}>{b}</span>
          <span style={{ fontSize: 12, color: '#65676B' }}>{b}</span>
        </div>
      ))}
      <div style={{ width: 1, height: 40, background: '#E4E6EB', margin: '0 8px' }} />
      {[
        { label: 'Online', bg: 'rgba(49,162,76,0.12)', color: '#31A24C', dot: '#31A24C' },
        { label: 'Away', bg: 'rgba(247,185,40,0.12)', color: '#B68A00', dot: '#F7B928' },
        { label: 'Offline', bg: 'rgba(100,102,107,0.1)', color: '#65676B', dot: '#C0C2C9' },
        { label: 'New', bg: 'rgba(8,102,255,0.1)', color: '#0866FF' },
        { label: 'Admin', bg: '#0866FF', color: '#fff' },
      ].map(p => (
        <span key={p.label} style={{ background: p.bg, color: p.color, fontSize: 12, fontWeight: 600, borderRadius: 9999, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
          {p.dot && <span style={{ width: 6, height: 6, borderRadius: 9999, background: p.dot, flexShrink: 0 }} />}
          {p.label}
        </span>
      ))}
    </div>
  )
}

// ─── Card ─────────────────────────────────────────────────────────
function CardShowcase() {
  const [hovered, setHovered] = useState<string | null>(null)
  const conversations = [
    { name: 'Alex Johnson', msg: 'Sounds good! See you at 7pm 👋', time: '2m', unread: 3, online: true },
    { name: 'Design Team', msg: 'Jordan: Can we review the mockups?', time: '15m', unread: 0 },
    { name: 'Maria Garcia', msg: 'I sent you the files you asked for', time: '1h', unread: 0 },
  ]
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', overflow: 'hidden', width: 320 }}>
        <div style={{ padding: '16px 16px 8px', borderBottom: '1px solid #E4E6EB' }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Chats</div>
        </div>
        {conversations.map((c, i) => (
          <div key={c.name}
            onMouseEnter={() => setHovered(c.name)}
            onMouseLeave={() => setHovered(null)}
            style={{ padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center', background: hovered === c.name ? '#F7F8FA' : '#fff', cursor: 'pointer', borderBottom: i < conversations.length - 1 ? '1px solid #F0F2F5' : 'none' }}>
            <Avatar name={c.name} size={48} online={c.online} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 15, fontWeight: c.unread > 0 ? 600 : 400 }}>{c.name}</span>
                <span style={{ fontSize: 12, color: c.unread > 0 ? '#0866FF' : '#65676B', flexShrink: 0, marginLeft: 8 }}>{c.time}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                <span style={{ fontSize: 13, color: c.unread > 0 ? '#050505' : '#65676B', fontWeight: c.unread > 0 ? 500 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{c.msg}</span>
                {c.unread > 0 && <span style={{ background: '#FA383E', color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 9999, minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px', flexShrink: 0 }}>{c.unread}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', overflow: 'hidden', width: 280 }}>
        <div style={{ height: 80, background: 'linear-gradient(135deg, #00B2FF, #B620E0)' }} />
        <div style={{ padding: '0 20px 20px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: -32 }}><Avatar name="Taylor Reeves" size={64} online /></div>
          <div style={{ paddingTop: 40 }}>
            <div style={{ fontSize: 18, fontWeight: 600 }}>Taylor Reeves</div>
            <div style={{ fontSize: 13, color: '#65676B', marginTop: 2 }}>Product Designer · San Francisco</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button style={{ flex: 1, background: 'linear-gradient(135deg, #00B2FF, #B620E0)', color: '#fff', border: 'none', borderRadius: 9999, padding: '8px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Message</button>
              <button style={{ flex: 1, background: 'transparent', color: '#0866FF', border: '1.5px solid #0866FF', borderRadius: 9999, padding: '8px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Follow</button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', padding: 20, width: 320 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#65676B', marginBottom: 16 }}>Message Bubbles</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <Avatar name="Alex Johnson" size={28} />
            <div style={{ background: '#F0F2F5', borderRadius: '18px 18px 18px 4px', padding: '10px 14px', fontSize: 15 }}>Hey! Want to grab coffee?</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ background: 'linear-gradient(135deg, #00B2FF, #B620E0)', borderRadius: '18px 18px 4px 18px', padding: '10px 14px', fontSize: 15, color: '#fff' }}>Sounds great! 3pm ☕</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: 12, color: '#65676B' }}>✓ Delivered · 2:34 PM</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────
function ModalShowcase() {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button onClick={() => setOpen(true)} style={{ background: 'linear-gradient(135deg, #00B2FF, #B620E0)', color: '#fff', border: 'none', borderRadius: 9999, padding: '10px 24px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Open Modal</button>
      {open && (
        <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(2px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, boxShadow: '0 8px 40px rgba(0,0,0,0.16)', width: 400, maxWidth: '90vw', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E4E6EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 18, fontWeight: 600 }}>New Conversation</span>
              <button onClick={() => setOpen(false)} style={{ background: '#F0F2F5', border: 'none', borderRadius: 9999, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: '#65676B' }}>×</button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <input placeholder="Search people…" style={{ width: '100%', border: '1.5px solid #E4E6EB', borderRadius: 12, padding: '11px 16px', fontSize: 15, outline: 'none', fontFamily: 'inherit' }} />
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                {['Alex Johnson', 'Maria G.', 'Ben C.'].map(n => (
                  <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <Avatar name={n} size={40} online />
                    <span style={{ fontSize: 12 }}>{n.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #E4E6EB', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setOpen(false)} style={{ background: 'transparent', color: '#65676B', border: '1.5px solid #E4E6EB', borderRadius: 9999, padding: '9px 20px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button style={{ background: 'linear-gradient(135deg, #00B2FF, #B620E0)', color: '#fff', border: 'none', borderRadius: 9999, padding: '9px 20px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Open Chat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Navbar ───────────────────────────────────────────────────────
function NavbarShowcase() {
  return (
    <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
      <div style={{ padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', gap: 16, borderBottom: '1px solid #E4E6EB' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9999, background: 'linear-gradient(135deg, #00B2FF, #B620E0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 15H7L3 21V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, background: 'linear-gradient(135deg, #00B2FF, #B620E0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>MyChatApp</span>
        </div>
        <div style={{ flex: 1, maxWidth: 280 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F7F8FA', borderRadius: 9999, padding: '8px 14px' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="#65676B" strokeWidth="2"/><path d="M21 21L16.65 16.65" stroke="#65676B" strokeWidth="2" strokeLinecap="round"/></svg>
            <span style={{ fontSize: 14, color: '#65676B' }}>Search</span>
          </div>
        </div>
        <div style={{ flex: 1 }} />
        {['Chats', 'Groups', 'Calls'].map((n, i) => (
          <button key={n} style={{ background: i === 0 ? 'rgba(8,102,255,0.08)' : 'transparent', color: i === 0 ? '#0866FF' : '#65676B', border: 'none', borderRadius: 9999, padding: '6px 16px', fontSize: 14, fontWeight: i === 0 ? 600 : 400, cursor: 'pointer' }}>{n}</button>
        ))}
        <div style={{ position: 'relative' }}>
          <button style={{ background: '#F0F2F5', border: 'none', borderRadius: 9999, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="#050505" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <span style={{ position: 'absolute', top: 1, right: 1, width: 8, height: 8, background: '#FA383E', borderRadius: 9999, border: '2px solid #fff' }} />
        </div>
        <Avatar name="Taylor Reeves" size={36} online />
      </div>
      <div style={{ padding: '8px 16px', fontSize: 12, color: '#65676B', background: '#F7F8FA' }}>Desktop navbar (&gt;1024px)</div>
    </div>
  )
}

// ─── Bottom Tab Bar ───────────────────────────────────────────────
function BottomTabBarShowcase() {
  const [active, setActive] = useState('Chats')
  const tabs = [
    { label: 'Chats', badge: 3 },
    { label: 'Groups' },
    { label: 'Calls' },
    { label: 'Profile' },
  ]
  return (
    <div style={{ maxWidth: 390, margin: '0 auto' }}>
      <div style={{ background: '#fff', borderRadius: '0 0 20px 20px', borderTop: '1px solid #E4E6EB', boxShadow: '0 -2px 12px rgba(0,0,0,0.06)', display: 'flex', padding: '8px 0 12px' }}>
        {tabs.map(t => (
          <button key={t.label} onClick={() => setActive(t.label)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: active === t.label ? '#0866FF' : '#65676B', padding: '4px 0', position: 'relative', fontFamily: 'inherit' }}>
            {t.badge && active !== t.label && <span style={{ position: 'absolute', top: 2, left: '50%', marginLeft: 4, background: '#FA383E', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 9999, minWidth: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{t.badge}</span>}
            <span style={{ fontSize: 20 }}>●</span>
            <span style={{ fontSize: 11, fontWeight: active === t.label ? 600 : 400 }}>{t.label}</span>
          </button>
        ))}
      </div>
      <div style={{ textAlign: 'center', fontSize: 12, color: '#65676B', marginTop: 8 }}>Mobile bottom tab bar (&lt;640px)</div>
    </div>
  )
}

// ─── Sidebar ─────────────────────────────────────────────────────
function SidebarShowcase() {
  const [active, setActive] = useState('Chats')
  const items = ['Chats', 'Groups', 'Calls', 'Settings']
  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', width: 240, overflow: 'hidden' }}>
        <div style={{ padding: '16px 16px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #00B2FF, #B620E0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 15H7L3 21V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, background: 'linear-gradient(135deg, #00B2FF, #B620E0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>MyChatApp</span>
        </div>
        <nav style={{ padding: 8 }}>
          {items.map(item => (
            <button key={item} onClick={() => setActive(item)}
              style={{ width: '100%', padding: '10px 12px', border: 'none', borderRadius: 10, cursor: 'pointer', textAlign: 'left', background: active === item ? 'rgba(8,102,255,0.08)' : 'transparent', color: active === item ? '#0866FF' : '#050505', fontWeight: active === item ? 600 : 400, fontSize: 15, fontFamily: 'inherit', marginBottom: 2 }}>
              {item}{item === 'Chats' && <span style={{ float: 'right', background: '#FA383E', color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 9999, padding: '1px 6px' }}>5</span>}
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}

// ─── Toast ────────────────────────────────────────────────────────
function ToastShowcase() {
  const toasts = [
    { type: 'success', msg: 'Message sent successfully!', icon: '✓', border: '#31A24C' },
    { type: 'error', msg: 'Failed to send. Try again.', icon: '✕', border: '#FA383E' },
    { type: 'warning', msg: 'You are offline. Reconnecting…', icon: '⚠', border: '#F7B928' },
    { type: 'info', msg: 'Alex Johnson started a call.', icon: '📞', border: '#0866FF' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 380 }}>
      {toasts.map(t => (
        <div key={t.type} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', padding: '14px 16px', borderLeft: `4px solid ${t.border}` }}>
          <span style={{ width: 28, height: 28, borderRadius: 9999, background: t.border, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{t.icon}</span>
          <span style={{ fontSize: 14, color: '#050505', flex: 1, fontWeight: 500 }}>{t.msg}</span>
          <button style={{ background: 'none', border: 'none', color: '#65676B', cursor: 'pointer', fontSize: 18 }}>×</button>
        </div>
      ))}
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────
function EmptyStateShowcase() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
      <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', padding: 40, width: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: 9999, background: 'linear-gradient(135deg, rgba(0,178,255,0.12), rgba(182,32,224,0.12))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none"><path d="M21 15H7L3 21V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="url(#eg)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><defs><linearGradient id="eg" x1="3" y1="3" x2="21" y2="21"><stop stopColor="#00B2FF"/><stop offset="1" stopColor="#B620E0"/></linearGradient></defs></svg>
        </div>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No messages yet</div>
        <div style={{ fontSize: 14, color: '#65676B', lineHeight: 1.5, marginBottom: 24 }}>Start a conversation and your messages will appear here.</div>
        <button style={{ background: 'linear-gradient(135deg, #00B2FF, #B620E0)', color: '#fff', border: 'none', borderRadius: 9999, padding: '10px 24px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>New Chat</button>
      </div>
      <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', padding: 40, width: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: 9999, background: '#F7F8FA', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="#C0C2C9" strokeWidth="1.5"/><path d="M21 21L16.65 16.65" stroke="#C0C2C9" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </div>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No results found</div>
        <div style={{ fontSize: 14, color: '#65676B', lineHeight: 1.5 }}>Try a different name or keyword.</div>
      </div>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────
function SkeletonShowcase() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', padding: 16, width: 320 }}>
        <div className="skeleton" style={{ height: 20, width: 80, marginBottom: 20 }} />
        {[1, 2, 3].map(i => (
          <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
            <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 9999, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 12, width: '90%' }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', overflow: 'hidden', width: 280 }}>
        <div className="skeleton" style={{ height: 80, borderRadius: 0 }} />
        <div style={{ padding: 20 }}>
          <div className="skeleton" style={{ width: 64, height: 64, borderRadius: 9999, marginBottom: 12, marginTop: -20 }} />
          <div className="skeleton" style={{ height: 18, width: '65%', marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 13, width: '85%', marginBottom: 12 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="skeleton" style={{ height: 36, flex: 1, borderRadius: 9999 }} />
            <div className="skeleton" style={{ height: 36, flex: 1, borderRadius: 9999 }} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Responsive Shell ─────────────────────────────────────────────
function ResponsiveShell() {
  const [bp, setBp] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['mobile', 'tablet', 'desktop'] as const).map(b => (
          <button key={b} onClick={() => setBp(b)}
            style={{ background: bp === b ? 'linear-gradient(135deg, #00B2FF, #B620E0)' : '#F0F2F5', color: bp === b ? '#fff' : '#65676B', border: 'none', borderRadius: 9999, padding: '8px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize', fontFamily: 'inherit' }}>
            {b}
          </button>
        ))}
      </div>
      {bp === 'desktop' && (
        <div style={{ display: 'flex', border: '1.5px solid #E4E6EB', borderRadius: 16, overflow: 'hidden', height: 360 }}>
          <div style={{ width: 200, background: '#fff', borderRight: '1px solid #E4E6EB', padding: '12px 8px' }}>
            <div style={{ padding: '4px 8px', fontSize: 14, fontWeight: 700, marginBottom: 8, background: 'linear-gradient(135deg, #00B2FF, #B620E0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>MyChatApp</div>
            {['Chats ×5', 'Groups', 'Calls', 'Settings'].map((item, i) => (
              <div key={item} style={{ padding: '9px 8px', fontSize: 13, color: i === 0 ? '#0866FF' : '#050505', fontWeight: i === 0 ? 600 : 400, background: i === 0 ? 'rgba(8,102,255,0.07)' : 'transparent', borderRadius: 8, marginBottom: 2 }}>{item}</div>
            ))}
          </div>
          <div style={{ width: 260, background: '#F7F8FA', borderRight: '1px solid #E4E6EB' }}>
            <div style={{ padding: '13px 16px', borderBottom: '1px solid #E4E6EB', fontSize: 14, fontWeight: 600, background: '#fff' }}>Chats</div>
            {['Alex Johnson', 'Design Team', 'Maria Garcia'].map((n, i) => (
              <div key={n} style={{ padding: '11px 16px', display: 'flex', gap: 10, alignItems: 'center', background: i === 0 ? '#fff' : 'transparent', borderBottom: '1px solid #E4E6EB', cursor: 'pointer' }}>
                <Avatar name={n} size={36} online={i === 0} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: i === 0 ? 600 : 400 }}>{n}</div>
                  <div style={{ fontSize: 11, color: '#65676B' }}>Hey! Want to...</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ flex: 1, background: '#fff', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '11px 16px', borderBottom: '1px solid #E4E6EB', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar name="Alex Johnson" size={32} online />
              <div style={{ fontSize: 13, fontWeight: 600 }}>Alex Johnson</div>
            </div>
            <div style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 6 }}><Avatar name="Alex" size={22} /><div style={{ background: '#F0F2F5', borderRadius: '12px 12px 12px 3px', padding: '7px 10px', fontSize: 12 }}>Hey!</div></div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}><div style={{ background: 'linear-gradient(135deg, #00B2FF, #B620E0)', borderRadius: '12px 12px 3px 12px', padding: '7px 10px', fontSize: 12, color: '#fff' }}>3pm!</div></div>
            </div>
            <div style={{ padding: '8px 12px', borderTop: '1px solid #E4E6EB', display: 'flex', gap: 6 }}>
              <div style={{ flex: 1, background: '#F7F8FA', borderRadius: 9999, padding: '6px 12px', fontSize: 12, color: '#65676B' }}>Aa</div>
              <div style={{ width: 26, height: 26, borderRadius: 9999, background: 'linear-gradient(135deg, #00B2FF, #B620E0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
          </div>
        </div>
      )}
      {bp === 'tablet' && (
        <div style={{ display: 'flex', border: '1.5px solid #E4E6EB', borderRadius: 16, overflow: 'hidden', height: 360, maxWidth: 700 }}>
          <div style={{ width: 52, background: '#fff', borderRight: '1px solid #E4E6EB', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0', gap: 12 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9999, background: 'linear-gradient(135deg, #00B2FF, #B620E0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>💬</div>
            {['💬', '👥', '📞'].map((icon, i) => <div key={i} style={{ width: 36, height: 36, borderRadius: 10, background: i === 0 ? 'rgba(8,102,255,0.1)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{icon}</div>)}
          </div>
          <div style={{ width: 240, background: '#F7F8FA', borderRight: '1px solid #E4E6EB' }}>
            <div style={{ padding: '13px 16px', borderBottom: '1px solid #E4E6EB', fontSize: 14, fontWeight: 600, background: '#fff' }}>Chats</div>
            {['Alex Johnson', 'Design Team', 'Maria'].map((n, i) => (
              <div key={n} style={{ padding: '11px 16px', display: 'flex', gap: 10, alignItems: 'center', background: i === 0 ? '#fff' : 'transparent', borderBottom: '1px solid #E4E6EB' }}>
                <Avatar name={n} size={34} online={i === 0} />
                <div><div style={{ fontSize: 13, fontWeight: i === 0 ? 600 : 400 }}>{n}</div><div style={{ fontSize: 11, color: '#65676B' }}>Hey!</div></div>
              </div>
            ))}
          </div>
          <div style={{ flex: 1, background: '#fff', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '11px 14px', borderBottom: '1px solid #E4E6EB', fontSize: 13, fontWeight: 600 }}>Alex Johnson</div>
            <div style={{ flex: 1, padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 5 }}><Avatar name="Alex" size={20} /><div style={{ background: '#F0F2F5', borderRadius: '10px 10px 10px 3px', padding: '6px 9px', fontSize: 11 }}>Hey!</div></div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}><div style={{ background: 'linear-gradient(135deg, #00B2FF, #B620E0)', borderRadius: '10px 10px 3px 10px', padding: '6px 9px', fontSize: 11, color: '#fff' }}>3pm!</div></div>
            </div>
            <div style={{ padding: '8px 10px', borderTop: '1px solid #E4E6EB', display: 'flex', gap: 5 }}>
              <div style={{ flex: 1, background: '#F7F8FA', borderRadius: 9999, padding: '5px 10px', fontSize: 11, color: '#65676B' }}>Aa</div>
              <div style={{ width: 24, height: 24, borderRadius: 9999, background: 'linear-gradient(135deg, #00B2FF, #B620E0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
          </div>
        </div>
      )}
      {bp === 'mobile' && (
        <div style={{ maxWidth: 375, border: '1.5px solid #E4E6EB', borderRadius: 32, overflow: 'hidden', background: '#F7F8FA' }}>
          <div style={{ background: '#fff', padding: '10px 20px 0', display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600 }}><span>9:41</span><span>●●●</span></div>
          <div style={{ background: '#fff', padding: '8px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E4E6EB' }}>
            <span style={{ fontSize: 22, fontWeight: 700 }}>Chats</span>
            <Avatar name="Taylor Reeves" size={32} online />
          </div>
          <div style={{ background: '#fff' }}>
            {['Alex Johnson', 'Design Team', 'Maria Garcia'].map((n, i) => (
              <div key={n} style={{ padding: '12px 20px', display: 'flex', gap: 12, alignItems: 'center', borderBottom: '1px solid #F0F2F5' }}>
                <Avatar name={n} size={44} online={i === 0} />
                <div><div style={{ fontSize: 14, fontWeight: i === 0 ? 600 : 400 }}>{n}</div><div style={{ fontSize: 12, color: '#65676B' }}>Hey! Want to catch up?</div></div>
                {i === 0 && <span style={{ marginLeft: 'auto', background: '#FA383E', color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 9999, width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</span>}
              </div>
            ))}
          </div>
          <div style={{ background: '#fff', borderTop: '1px solid #E4E6EB', display: 'flex', padding: '8px 0 20px' }}>
            {[{ l: 'Chats', a: true }, { l: 'Groups' }, { l: 'Calls' }, { l: 'Profile' }].map(t => (
              <div key={t.l} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, color: t.a ? '#0866FF' : '#65676B', fontSize: 11, fontWeight: t.a ? 600 : 400, cursor: 'pointer' }}>
                <span style={{ fontSize: 18 }}>●</span>{t.l}
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{ marginTop: 12, fontSize: 12, color: '#65676B' }}>
        {bp === 'mobile' && 'Mobile (<640px): full-screen single-column, bottom tab bar'}
        {bp === 'tablet' && 'Tablet (640–1024px): icon sidebar + two-column split'}
        {bp === 'desktop' && 'Desktop (>1024px): persistent sidebar + list panel + chat detail'}
      </div>
    </div>
  )
}

// ─── Logo Mark ────────────────────────────────────────────────────
function LogoShowcase() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-end' }}>
      {[56, 40, 32, 24].map(s => (
        <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{ width: s, height: s, borderRadius: s * 0.3, background: 'linear-gradient(135deg, #00B2FF 0%, #B620E0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(8,102,255,0.3)' }}>
            <svg width={s * 0.55} height={s * 0.55} viewBox="0 0 24 24" fill="none"><path d="M21 15H7L3 21V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <span style={{ fontSize: 12, color: '#65676B' }}>{s}px</span>
        </div>
      ))}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #00B2FF 0%, #B620E0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(8,102,255,0.3)' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M21 15H7L3 21V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <span style={{ fontSize: 24, fontWeight: 700, background: 'linear-gradient(135deg, #00B2FF, #B620E0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>MyChatApp</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#050505', borderRadius: 16, padding: '12px 20px' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #00B2FF 0%, #B620E0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 15H7L3 21V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <span style={{ fontSize: 20, fontWeight: 700, background: 'linear-gradient(135deg, #00B2FF, #B620E0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>MyChatApp</span>
      </div>
    </div>
  )
}

// ─── Tab navigation ───────────────────────────────────────────────
type Tab = 'design-system' | 'auth-flow' | 'chat' | 'blog' | 'admin' | 'profile' | 'notif-search' | 'chat-interactions' | 'convo-actions' | 'communities' | 'blog-interactions' | 'admin-extensions' | 'ui-states'

// ─── Main App ─────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('design-system')

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#F7F8FA', minHeight: '100vh' }}>

      {/* Shared header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E4E6EB', padding: '0 48px', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', height: 56, display: 'flex', alignItems: 'center', gap: 24, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #00B2FF, #B620E0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 15H7L3 21V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, background: 'linear-gradient(135deg, #00B2FF, #B620E0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>MyChatApp</span>
          </div>

          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: 4, background: '#F0F2F5', borderRadius: 9999, padding: 4 }}>
            {([
              { id: 'design-system', label: 'Design System' },
              { id: 'auth-flow', label: 'Auth Flow' },
              { id: 'chat', label: 'Chat' },
              { id: 'blog', label: 'Blog' },
              { id: 'admin', label: 'Admin' },
              { id: 'profile', label: 'Profile & Settings' },
              { id: 'notif-search', label: 'Notifs & Search' },
              { id: 'chat-interactions', label: 'Chat Interactions' },
              { id: 'convo-actions', label: 'Convo Actions' },
              { id: 'communities', label: 'Communities' },
              { id: 'blog-interactions', label: 'Blog Interactions' },
              { id: 'admin-extensions', label: 'Admin Extensions' },
              { id: 'ui-states', label: 'UI States' },
            ] as { id: Tab; label: string }[]).map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                style={{ background: activeTab === t.id ? '#fff' : 'transparent', color: activeTab === t.id ? '#050505' : '#65676B', border: 'none', borderRadius: 9999, padding: '6px 16px', fontSize: 13, fontWeight: activeTab === t.id ? 600 : 400, cursor: 'pointer', boxShadow: activeTab === t.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s', fontFamily: 'inherit' }}>
                {t.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#65676B', fontWeight: 500 }}>{{ 'design-system': 'Design System', 'auth-flow': 'Auth Flow', 'chat': 'Chat Experience', 'blog': 'Blog & Feed', 'admin': 'Admin Dashboard', 'profile': 'Profile & Settings', 'notif-search': 'Notifications & Search', 'chat-interactions': 'Chat Interactions', 'convo-actions': 'Conversation Actions', 'communities': 'Community Screens', 'blog-interactions': 'Blog Interactions', 'admin-extensions': 'Admin Extensions', 'ui-states': 'UI States' }[activeTab]}</span>
            <span style={{ background: 'linear-gradient(135deg, #00B2FF, #B620E0)', color: '#fff', fontSize: 12, fontWeight: 600, borderRadius: 9999, padding: '3px 10px' }}>v1.0</span>
          </div>
        </div>
      </div>

      {activeTab === 'ui-states' ? <UIStates /> : activeTab === 'admin-extensions' ? <AdminExtensions /> : activeTab === 'blog-interactions' ? <BlogInteractions /> : activeTab === 'communities' ? <CommunityScreens /> : activeTab === 'convo-actions' ? <ConversationActions /> : activeTab === 'chat-interactions' ? <ChatInteractions /> : activeTab === 'notif-search' ? <NotificationsAndSearch /> : activeTab === 'profile' ? <ProfileAndSettings /> : activeTab === 'admin' ? <AdminDashboard /> : activeTab === 'blog' ? <BlogFeed /> : activeTab === 'chat' ? <ChatExperience /> : activeTab === 'auth-flow' ? <AuthFlow /> : (
        <>
          {/* Hero */}
          <div style={{ background: 'linear-gradient(135deg, #00B2FF 0%, #B620E0 100%)', padding: '60px 48px' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
              <h1 style={{ fontSize: 40, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: -0.5 }}>Design System</h1>
              <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.85)', margin: '12px 0 0' }}>MyChatApp — Color, typography, spacing, and components</p>
            </div>
          </div>

          {/* Design system content */}
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 48px 80px' }}>

            <Section title="Logo & Brand Mark"><LogoShowcase /></Section>

            <Section title="Color Palette">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 12 }}>
                <GradientSwatch />
                {colors.map(c => <Swatch key={c.hex} {...c} />)}
              </div>
              <p style={{ fontSize: 13, color: '#65676B', marginTop: 8 }}>Click any swatch to copy the hex value.</p>
            </Section>

            <Section title="Type Scale — Inter">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {typeScale.map((t, i) => (
                  <div key={t.name} style={{ display: 'flex', alignItems: 'baseline', gap: 24, padding: '20px 0', borderBottom: i < typeScale.length - 1 ? '1px solid #E4E6EB' : 'none' }}>
                    <div style={{ width: 100, flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</div>
                      <div style={{ fontSize: 12, color: '#65676B', marginTop: 2 }}>{t.size} / {t.weight === '700' ? 'Bold' : t.weight === '600' ? 'Semibold' : 'Regular'}</div>
                    </div>
                    <div style={{ fontSize: t.size, fontWeight: parseInt(t.weight), color: '#050505', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.sample}</div>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Spacing Scale">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-end' }}>
                {spacingScale.map(s => (
                  <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: s, height: s, background: 'linear-gradient(135deg, #00B2FF, #B620E0)', borderRadius: 4 }} />
                    <div style={{ fontSize: 12, color: '#65676B', textAlign: 'center' }}><div style={{ fontWeight: 600, color: '#050505' }}>{s}px</div></div>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Buttons"><ButtonShowcase /></Section>
            <Section title="Input Fields"><InputShowcase /></Section>
            <Section title="Avatars"><AvatarShowcase /></Section>
            <Section title="Badges & Status Pills"><BadgeShowcase /></Section>
            <Section title="Cards & Message Bubbles"><CardShowcase /></Section>
            <Section title="Modal / Dialog"><ModalShowcase /></Section>
            <Section title="Top Navbar"><NavbarShowcase /></Section>
            <Section title="Left Sidebar Navigation (Desktop)"><SidebarShowcase /></Section>
            <Section title="Bottom Tab Bar (Mobile)"><BottomTabBarShowcase /></Section>
            <Section title="Toast / Snackbar"><ToastShowcase /></Section>
            <Section title="Empty State Placeholder"><EmptyStateShowcase /></Section>
            <Section title="Loading Skeleton"><SkeletonShowcase /></Section>
            <Section title="Responsive Navigation Shell"><ResponsiveShell /></Section>
          </div>
        </>
      )}
    </div>
  )
}
