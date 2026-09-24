import { useState, useEffect } from 'react'

// ─── Light tokens (reference) ────────────────────────────────────
const L = {
  bg:      '#F7F8FA',
  card:    '#FFFFFF',
  text:    '#050505',
  sub:     '#3C3D40',
  muted:   '#65676B',
  border:  '#E4E6EB',
  divider: '#F0F2F5',
}

// ─── Dark tokens ─────────────────────────────────────────────────
const D = {
  bg:      '#18191A',
  card:    '#242526',
  card2:   '#2D2F33',   // slightly elevated surface
  text:    '#E4E6EB',
  sub:     '#C8CAD0',
  muted:   '#B0B3B8',
  border:  '#3A3B3C',
  divider: '#2D2F33',
  input:   '#3A3B3C',
}

// ─── Shared ───────────────────────────────────────────────────────
const GRAD     = 'linear-gradient(135deg, #00B2FF 0%, #B620E0 100%)'
const PRIMARY  = '#0866FF'
const SUCCESS  = '#31A24C'
const WARNING  = '#F7B928'
const ERROR    = '#FA383E'

const SEND_R   = '18px 18px 4px 18px'
const RECV_R   = '18px 18px 18px 4px'

type Bp    = 'mobile' | 'tablet' | 'desktop'
type DemoId = 'dark-mode' | 'offline-banner' | 'failed-send' | '404' | 'session-expired' | 'skeletons'

const AVATAR_PAL = ['#0866FF','#B620E0','#00B2FF','#31A24C','#F7B928','#FA383E','#8B5CF6','#EC4899']
const ac = (name: string) => AVATAR_PAL[name.charCodeAt(0) % AVATAR_PAL.length]

function Av({ name, size = 36, online }: { name: string; size?: number; online?: boolean }) {
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div style={{ width: size, height: size, borderRadius: 9999, background: ac(name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.37, fontWeight: 700, color: '#fff', fontFamily: 'inherit' }}>
        {name.split(' ').map(n => n[0]).join('').slice(0, 2)}
      </div>
      {online && <span style={{ position: 'absolute', bottom: 1, right: 1, width: size * 0.28, height: size * 0.28, borderRadius: 9999, background: SUCCESS, border: '2px solid currentColor' }} />}
    </div>
  )
}

// ─── Skeleton shimmer ─────────────────────────────────────────────
function Skel({ w = '100%', h = 14, r = 6, dark = false }: { w?: number | string; h?: number; r?: number; dark?: boolean }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r, flexShrink: 0,
      background: dark
        ? 'linear-gradient(90deg, #2D2F33 25%, #3A3B3C 50%, #2D2F33 75%)'
        : 'linear-gradient(90deg, #E9EAEC 25%, #F3F4F6 50%, #E9EAEC 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
    }} />
  )
}

// ─── Device Frame ─────────────────────────────────────────────────
function DeviceFrame({ bp, children }: { bp: Bp; children: React.ReactNode }) {
  const cfgs = { mobile: { w: 390, h: 780, sc: 0.80 }, tablet: { w: 834, h: 660, sc: 0.68 }, desktop: { w: 1280, h: 660, sc: 0.63 } }
  const { w, h, sc } = cfgs[bp]
  return (
    <div style={{ width: w * sc, height: h * sc, flexShrink: 0, borderRadius: bp === 'mobile' ? 32 * sc : 12 * sc, overflow: 'hidden', boxShadow: '0 6px 40px rgba(0,0,0,0.22)', position: 'relative' }}>
      <div style={{ width: w, height: h, transform: `scale(${sc})`, transformOrigin: 'top left', position: 'relative', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 1. DARK MODE SCREENS
// ═══════════════════════════════════════════════════════════════════

function DarkChatList({ bp }: { bp: Bp }) {
  const [active, setActive] = useState('Alex Johnson')
  const convos = [
    { name: 'Alex Johnson', msg: 'Sounds great! See you at 7pm 👋', time: '2m', unread: 3, online: true },
    { name: 'Design Team', msg: 'Jordan: Can we review the mockups?', time: '15m', unread: 1 },
    { name: 'Maria Garcia', msg: 'I sent you the files 📎', time: '1h', unread: 0 },
    { name: 'Ben Carter', msg: 'Haha yeah, that was wild 😂', time: '3h', unread: 0 },
    { name: 'Tech Enthusiasts', msg: 'Sam: Anyone using Vite 8 yet?', time: 'Yesterday', unread: 0 },
    { name: 'Jordan Kim', msg: 'Can you review my PR?', time: 'Yesterday', unread: 0 },
  ]

  const iconSidebar = (
    <div style={{ width: 56, background: D.card2, borderRight: `1px solid ${D.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px 0', gap: 6, flexShrink: 0 }}>
      <div style={{ width: 32, height: 32, borderRadius: 10, background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 15H7L3 21V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      {['💬','👥','📞','🔔'].map((ic, i) => (
        <div key={i} style={{ width: 40, height: 40, borderRadius: 10, background: i === 0 ? 'rgba(8,102,255,0.18)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, cursor: 'pointer' }}>{ic}</div>
      ))}
      <div style={{ flex: 1 }} />
      <Av name="Taylor Reeves" size={32} online />
    </div>
  )

  const chatListCol = (
    <div style={{ width: bp === 'mobile' ? '100%' : 300, background: D.card, borderRight: bp !== 'mobile' ? `1px solid ${D.border}` : 'none', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${D.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: D.text }}>Chats</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {['🔍','✏️'].map((ic, i) => <button key={i} style={{ background: D.input, border: 'none', borderRadius: 8, width: 34, height: 34, fontSize: 14, cursor: 'pointer' }}>{ic}</button>)}
        </div>
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ background: D.input, borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke={D.muted} strokeWidth="2"/><path d="M21 21l-4.35-4.35" stroke={D.muted} strokeWidth="2" strokeLinecap="round"/></svg>
          <span style={{ fontSize: 13, color: D.muted }}>Search Messenger</span>
        </div>
      </div>
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {convos.map(c => (
          <div key={c.name} onClick={() => setActive(c.name)}
            style={{ padding: '10px 16px', display: 'flex', gap: 12, alignItems: 'center', background: active === c.name ? 'rgba(8,102,255,0.1)' : 'transparent', cursor: 'pointer', borderRadius: active === c.name ? 8 : 0, margin: active === c.name ? '0 4px' : 0 }}>
            <Av name={c.name} size={46} online={c.online} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: c.unread > 0 ? 700 : 500, color: D.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{c.name}</span>
                <span style={{ fontSize: 11, color: c.unread > 0 ? PRIMARY : D.muted, flexShrink: 0, marginLeft: 4 }}>{c.time}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                <span style={{ fontSize: 13, color: c.unread > 0 ? D.sub : D.muted, fontWeight: c.unread > 0 ? 500 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{c.msg}</span>
                {c.unread > 0 && <span style={{ background: PRIMARY, color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 9999, minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', flexShrink: 0 }}>{c.unread}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
      {bp === 'mobile' && (
        <div style={{ borderTop: `1px solid ${D.border}`, display: 'flex', padding: '8px 0 20px', background: D.card }}>
          {[{ l: 'Chats', a: true }, { l: 'Groups' }, { l: 'Calls' }, { l: 'Profile' }].map(t => (
            <div key={t.l} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, color: t.a ? PRIMARY : D.muted, fontSize: 11, fontWeight: t.a ? 700 : 400, cursor: 'pointer' }}>
              <span style={{ fontSize: 18 }}>●</span>{t.l}
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const chatDetail = bp !== 'mobile' ? (
    <div style={{ flex: 1, background: D.bg, display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 52, background: D.card, borderBottom: `1px solid ${D.border}`, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10 }}>
        <Av name={active} size={34} online />
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: D.text }}>{active}</div>
          <div style={{ fontSize: 11, color: SUCCESS }}>Active now</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {['📞','📹','ℹ️'].map((ic, i) => <button key={i} style={{ background: D.input, border: 'none', borderRadius: 8, width: 32, height: 32, fontSize: 13, cursor: 'pointer' }}>{ic}</button>)}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <Av name={active} size={26} />
          <div style={{ background: D.card2, color: D.text, borderRadius: RECV_R, padding: '10px 14px', fontSize: 14, maxWidth: 260 }}>Hey! Are you free this evening? 👋</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ background: GRAD, color: '#fff', borderRadius: SEND_R, padding: '10px 14px', fontSize: 14, maxWidth: 260 }}>Yep, what did you have in mind?</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <Av name={active} size={26} />
          <div style={{ background: D.card2, color: D.text, borderRadius: RECV_R, padding: '10px 14px', fontSize: 14, maxWidth: 260 }}>Sounds great! See you at 7pm 👋</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
          <div style={{ background: GRAD, color: '#fff', borderRadius: SEND_R, padding: '10px 14px', fontSize: 14 }}>Perfect, see you then! 🎉</div>
          <span style={{ fontSize: 11, color: D.muted }}>✓✓ Delivered · 2:34 PM</span>
        </div>
      </div>
      <div style={{ padding: '10px 14px', borderTop: `1px solid ${D.border}`, background: D.card, display: 'flex', gap: 8, alignItems: 'center' }}>
        <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 18 }}>+</button>
        <div style={{ flex: 1, background: D.input, borderRadius: 9999, padding: '8px 14px', fontSize: 14, color: D.muted }}>Aa</div>
        <button style={{ background: GRAD, border: 'none', borderRadius: 9999, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
    </div>
  ) : null

  return (
    <div style={{ height: '100%', background: D.bg, display: 'flex', overflow: 'hidden' }}>
      {bp !== 'mobile' && iconSidebar}
      {chatListCol}
      {chatDetail}
    </div>
  )
}

function DarkBlogFeed({ bp }: { bp: Bp }) {
  const posts = [
    { author: 'Sarah Chen', role: 'Senior Engineer', time: '2h', title: 'Building Scalable Real-Time Systems with WebSockets', excerpt: 'After 3 years running WebSocket infrastructure at scale, here\'s what I wish I knew from the start.', tag: 'Engineering', likes: 142, comments: 38, cover: 'photo-1518770660439-4636190af475' },
    { author: 'Marcus Williams', role: 'Product Designer', time: '5h', title: 'Why Dark Mode Isn\'t Just an Aesthetic Choice', excerpt: 'Dark mode affects readability, battery life, and — more importantly — accessibility for millions of users.', tag: 'Design', likes: 89, comments: 24, cover: 'photo-1555066931-4365d14bab8c' },
  ]

  const sidebar = bp === 'desktop' ? (
    <div style={{ width: 220, flexShrink: 0, background: D.card2, borderRight: `1px solid ${D.border}`, padding: '16px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px 14px' }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 15H7L3 21V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>MyChatApp</span>
      </div>
      {['Home','Explore','Following','Saved','Profile'].map((item, i) => (
        <div key={item} style={{ padding: '9px 10px', borderRadius: 8, background: i === 0 ? 'rgba(8,102,255,0.15)' : 'transparent', color: i === 0 ? PRIMARY : D.sub, fontSize: 13, fontWeight: i === 0 ? 600 : 400, cursor: 'pointer' }}>{item}</div>
      ))}
      <div style={{ flex: 1 }} />
      <div style={{ padding: '10px 10px', borderTop: `1px solid ${D.border}`, marginTop: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Av name="Taylor Reeves" size={32} online />
          <div><div style={{ fontSize: 12, fontWeight: 600, color: D.text }}>Taylor Reeves</div><div style={{ fontSize: 11, color: D.muted }}>@taylor</div></div>
        </div>
      </div>
    </div>
  ) : null

  return (
    <div style={{ height: '100%', background: D.bg, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {bp === 'mobile' && (
        <div style={{ background: D.card, borderBottom: `1px solid ${D.border}`, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: D.text }}>Feed</span>
          <button style={{ background: GRAD, border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>+ Post</button>
        </div>
      )}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        {sidebar}
        <div style={{ flex: 1, overflowY: 'auto', padding: bp === 'mobile' ? '0 0 20px' : '20px 24px' }}>
          {bp !== 'mobile' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: D.text, margin: 0 }}>Home Feed</h2>
              <button style={{ background: GRAD, border: 'none', borderRadius: 9999, padding: '8px 20px', fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>Write a post</button>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {posts.map(p => (
              <div key={p.title} style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ height: bp === 'mobile' ? 150 : 180, background: `url(https://images.unsplash.com/${p.cover}?w=800&h=300&fit=crop&auto=format) center/cover`, position: 'relative' }}>
                  <span style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 11, fontWeight: 600, borderRadius: 6, padding: '3px 8px', backdropFilter: 'blur(4px)' }}>{p.tag}</span>
                </div>
                <div style={{ padding: bp === 'mobile' ? '14px 16px' : '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <Av name={p.author} size={28} />
                    <div><div style={{ fontSize: 13, fontWeight: 600, color: D.text }}>{p.author}</div><div style={{ fontSize: 11, color: D.muted }}>{p.role} · {p.time}</div></div>
                  </div>
                  <h3 style={{ fontSize: bp === 'mobile' ? 15 : 17, fontWeight: 700, color: D.text, margin: '0 0 6px', lineHeight: 1.35 }}>{p.title}</h3>
                  <p style={{ fontSize: 13, color: D.muted, margin: '0 0 14px', lineHeight: 1.55 }}>{p.excerpt}</p>
                  <div style={{ display: 'flex', gap: 16, color: D.muted, fontSize: 13 }}>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: D.muted, display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontFamily: 'inherit' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>
                      {p.likes}
                    </button>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: D.muted, display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontFamily: 'inherit' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>
                      {p.comments}
                    </button>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: D.muted, display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontFamily: 'inherit', marginLeft: 'auto' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {bp === 'desktop' && (
          <div style={{ width: 240, flexShrink: 0, padding: '20px 16px', borderLeft: `1px solid ${D.border}`, overflowY: 'auto' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: D.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Trending Topics</div>
            {['#WebSockets','#DarkMode','#ReactNative','#OpenSource','#TypeScript'].map((t, i) => (
              <div key={t} style={{ padding: '8px 0', borderBottom: `1px solid ${D.border}`, cursor: 'pointer' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: PRIMARY }}>{t}</div>
                <div style={{ fontSize: 11, color: D.muted, marginTop: 2 }}>{[34,21,18,15,12][i]} posts today</div>
              </div>
            ))}
          </div>
        )}
      </div>
      {bp === 'mobile' && (
        <div style={{ borderTop: `1px solid ${D.border}`, background: D.card, display: 'flex', padding: '8px 0 20px' }}>
          {['Home','Search','Create','Saved','Profile'].map((t, i) => (
            <div key={t} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, color: i === 0 ? PRIMARY : D.muted, fontSize: 10, fontWeight: i === 0 ? 700 : 400, cursor: 'pointer' }}>
              <span style={{ fontSize: 17 }}>●</span>{t}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DarkProfile({ bp }: { bp: Bp }) {
  const [tab, setTab] = useState<'posts' | 'media'>('posts')
  const samplePosts = [
    { title: 'Understanding React 19 Concurrent Features', time: '3h', likes: 67, comments: 14 },
    { title: 'My Workflow for Rapid API Prototyping', time: '1d', likes: 31, comments: 8 },
    { title: 'Why I Switched from VS Code to Neovim', time: '3d', likes: 112, comments: 44 },
  ]

  const coverGrad = 'linear-gradient(135deg, #0866FF 0%, #B620E0 100%)'

  return (
    <div style={{ height: '100%', background: D.bg, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      {bp !== 'mobile' && (
        <div style={{ height: 48, background: D.card, borderBottom: `1px solid ${D.border}`, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, flexShrink: 0 }}>
          <button style={{ background: D.input, border: 'none', borderRadius: 7, width: 30, height: 30, fontSize: 14, cursor: 'pointer' }}>←</button>
          <span style={{ fontSize: 14, fontWeight: 700, color: D.text }}>Taylor Reeves</span>
        </div>
      )}
      <div style={{ height: bp === 'mobile' ? 160 : 200, background: coverGrad, flexShrink: 0 }} />
      <div style={{ background: D.card, borderBottom: `1px solid ${D.border}`, padding: bp === 'mobile' ? '0 16px 16px' : '0 32px 20px', position: 'relative', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: -(bp === 'mobile' ? 44 : 52), left: bp === 'mobile' ? 16 : 32 }}>
          <div style={{ width: bp === 'mobile' ? 80 : 96, height: bp === 'mobile' ? 80 : 96, borderRadius: 9999, background: ac('Taylor Reeves'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: bp === 'mobile' ? 28 : 34, fontWeight: 700, color: '#fff', border: `4px solid ${D.card}` }}>TR</div>
        </div>
        <div style={{ paddingTop: bp === 'mobile' ? 44 : 52 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
            <div>
              <div style={{ fontSize: bp === 'mobile' ? 18 : 22, fontWeight: 700, color: D.text }}>Taylor Reeves</div>
              <div style={{ fontSize: 13, color: D.muted }}>@taylor · Product Designer at MyChatApp</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ background: GRAD, border: 'none', borderRadius: 9999, padding: '7px 18px', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap' }}>Message</button>
              <button style={{ background: 'transparent', border: `1.5px solid ${D.border}`, borderRadius: 9999, padding: '7px 14px', fontSize: 13, fontWeight: 600, color: D.text, cursor: 'pointer' }}>Follow</button>
            </div>
          </div>
          <p style={{ fontSize: 13, color: D.sub, margin: '6px 0 12px', lineHeight: 1.55 }}>Building thoughtful interfaces. Design × Engineering. San Francisco, CA.</p>
          <div style={{ display: 'flex', gap: 20 }}>
            {[{ l: '247', k: 'Posts' }, { l: '2.4k', k: 'Followers' }, { l: '318', k: 'Following' }].map(s => (
              <div key={s.k}><span style={{ fontSize: 15, fontWeight: 700, color: D.text }}>{s.l}</span> <span style={{ fontSize: 13, color: D.muted }}>{s.k}</span></div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', borderBottom: `1px solid ${D.border}`, background: D.card, flexShrink: 0 }}>
        {(['posts', 'media'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '12px 0', fontSize: 14, fontWeight: tab === t ? 700 : 400, color: tab === t ? D.text : D.muted, background: 'transparent', border: 'none', cursor: 'pointer', borderBottom: tab === t ? `2px solid ${PRIMARY}` : '2px solid transparent', fontFamily: 'inherit', textTransform: 'capitalize' }}>
            {t === 'posts' ? 'Posts' : 'Media'}
          </button>
        ))}
      </div>
      <div style={{ padding: bp === 'mobile' ? '12px 0' : '16px 24px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {samplePosts.map(p => (
          <div key={p.title} style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: bp === 'mobile' ? 0 : 10, padding: '14px 16px', marginBottom: bp === 'mobile' ? 0 : 10, borderLeft: bp === 'mobile' ? 'none' : undefined, borderRight: bp === 'mobile' ? 'none' : undefined }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: D.text, marginBottom: 6 }}>{p.title}</div>
            <div style={{ display: 'flex', gap: 14, color: D.muted, fontSize: 12 }}>
              <span>{p.time} ago</span>
              <span>♥ {p.likes}</span>
              <span>💬 {p.comments}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DarkModeDemo({ bp }: { bp: Bp }) {
  const [screen, setScreen] = useState<'chat-list' | 'blog' | 'profile'>('chat-list')
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: D.bg }}>
      <div style={{ background: '#111', borderBottom: `1px solid ${D.border}`, display: 'flex', gap: 2, padding: '6px 10px', flexShrink: 0 }}>
        {([['chat-list','Chat List'], ['blog','Blog Feed'], ['profile','Profile']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setScreen(id)} style={{ background: screen === id ? D.card2 : 'transparent', color: screen === id ? D.text : D.muted, border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 11, fontWeight: screen === id ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit' }}>
            {label}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {screen === 'chat-list' && <DarkChatList bp={bp} />}
        {screen === 'blog' && <DarkBlogFeed bp={bp} />}
        {screen === 'profile' && <DarkProfile bp={bp} />}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 2. OFFLINE BANNER
// ═══════════════════════════════════════════════════════════════════

function OfflineBannerDemo({ bp }: { bp: Bp }) {
  const [offline, setOffline] = useState(true)
  const [reconnecting, setReconnecting] = useState(false)

  const handleToggle = () => {
    if (offline) {
      setReconnecting(true)
      setTimeout(() => { setReconnecting(false); setOffline(false) }, 1800)
    } else {
      setOffline(true)
    }
  }

  const convos = [
    { name: 'Alex Johnson', msg: 'Sounds great! See you at 7pm 👋', time: '2m', unread: 3, online: true },
    { name: 'Design Team', msg: 'Jordan: New mockups ready for review', time: '15m', unread: 0 },
    { name: 'Maria Garcia', msg: 'I sent you the file', time: '1h', unread: 0 },
  ]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: L.bg, position: 'relative', overflow: 'hidden' }}>
      {/* Offline banner */}
      <div style={{
        background: reconnecting ? 'rgba(49,162,76,0.95)' : 'rgba(179,125,0,0.95)',
        backdropFilter: 'blur(8px)',
        padding: '9px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        transition: 'background 0.4s',
        flexShrink: 0,
        zIndex: 10,
      }}>
        {reconnecting ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
            <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.4)" strokeWidth="2"/>
            <path d="M12 2a10 10 0 010 20" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.56 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        )}
        <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', flex: 1 }}>
          {reconnecting ? 'Reconnecting…' : "You're offline — messages will send when you're back online"}
        </span>
        {!reconnecting && (
          <button onClick={handleToggle} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 5, padding: '3px 10px', fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>Reconnect</button>
        )}
      </div>

      {/* App content beneath */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '10px 16px', borderBottom: `1px solid ${L.border}`, background: L.card, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: L.text }}>Chats</span>
          <button onClick={handleToggle} style={{ background: offline ? 'rgba(250,56,62,0.1)' : 'rgba(49,162,76,0.1)', border: `1px solid ${offline ? ERROR : SUCCESS}`, borderRadius: 7, padding: '5px 12px', fontSize: 12, fontWeight: 600, color: offline ? ERROR : SUCCESS, cursor: 'pointer', fontFamily: 'inherit' }}>
            {offline ? '● Offline' : '● Online'}
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {convos.map(c => (
            <div key={c.name} style={{ padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center', borderBottom: `1px solid ${L.divider}`, background: L.card, opacity: offline ? 0.7 : 1, transition: 'opacity 0.3s' }}>
              <Av name={c.name} size={44} online={c.online && !offline} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, fontWeight: c.unread > 0 ? 600 : 400, color: L.text }}>{c.name}</span>
                  <span style={{ fontSize: 12, color: L.muted }}>{c.time}</span>
                </div>
                <div style={{ fontSize: 13, color: L.muted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.msg}</div>
              </div>
              {c.unread > 0 && <span style={{ background: ERROR, color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 9999, minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{c.unread}</span>}
            </div>
          ))}
          {/* Queued message row */}
          {offline && (
            <div style={{ padding: '10px 16px', background: 'rgba(247,185,40,0.06)', borderBottom: `1px solid rgba(247,185,40,0.2)`, display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke={WARNING} strokeWidth="1.8"/><path d="M12 8v4M12 16h.01" stroke={WARNING} strokeWidth="1.8" strokeLinecap="round"/></svg>
              <span style={{ fontSize: 12, color: '#B68A00', fontWeight: 500 }}>1 message queued — will send when back online</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 3. FAILED-TO-SEND STATE
// ═══════════════════════════════════════════════════════════════════

function FailedSendDemo({ bp }: { bp: Bp }) {
  const [retrying, setRetrying] = useState<string | null>(null)
  const [retried, setRetried] = useState<Set<string>>(new Set())

  const retry = (id: string) => {
    setRetrying(id)
    setTimeout(() => {
      setRetrying(null)
      setRetried(prev => new Set([...prev, id]))
    }, 1400)
  }

  const messages = [
    { id: 'm1', text: 'Hey, are you free tomorrow?', sent: false, time: '2:31 PM', from: 'Alex Johnson', status: 'ok' as const },
    { id: 'm2', text: 'Yeah! What did you have in mind?', sent: true, time: '2:32 PM', status: 'ok' as const },
    { id: 'm3', text: 'Maybe grab lunch and check out that new place on Market Street?', sent: false, time: '2:33 PM', from: 'Alex Johnson', status: 'ok' as const },
    { id: 'm4', text: 'Sounds perfect, I\'ve been wanting to try that spot!', sent: true, time: '2:34 PM', status: 'failed' as const },
    { id: 'm5', text: 'Let me know what time works best for you 🙌', sent: true, time: '2:34 PM', status: 'failed' as const },
  ]

  return (
    <div style={{ height: '100%', background: L.bg, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ height: 52, background: L.card, borderBottom: `1px solid ${L.border}`, display: 'flex', alignItems: 'center', padding: '0 14px', gap: 10, flexShrink: 0 }}>
        <Av name="Alex Johnson" size={34} online />
        <div><div style={{ fontSize: 14, fontWeight: 600 }}>Alex Johnson</div><div style={{ fontSize: 11, color: SUCCESS }}>Active now</div></div>
      </div>

      {/* Error banner */}
      <div style={{ background: 'rgba(250,56,62,0.07)', borderBottom: `1px solid rgba(250,56,62,0.15)`, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke={ERROR} strokeWidth="1.8"/><line x1="12" y1="8" x2="12" y2="12" stroke={ERROR} strokeWidth="1.8" strokeLinecap="round"/><line x1="12" y1="16" x2="12.01" y2="16" stroke={ERROR} strokeWidth="2" strokeLinecap="round"/></svg>
        <span style={{ fontSize: 12, color: ERROR, fontWeight: 500, flex: 1 }}>Some messages failed to send. Check your connection.</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map(m => {
          const failed = m.status === 'failed' && !retried.has(m.id)
          const isRetrying = retrying === m.id
          const succeeded = retried.has(m.id)
          return (
            <div key={m.id} style={{ display: 'flex', flexDirection: m.sent ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end' }}>
              {!m.sent && <Av name={m.from!} size={26} />}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: m.sent ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, flexDirection: m.sent ? 'row-reverse' : 'row' }}>
                  {/* Failed exclamation */}
                  {m.sent && failed && !isRetrying && (
                    <div style={{ flexShrink: 0, width: 20, height: 20, borderRadius: 9999, background: ERROR, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="Tap to retry" onClick={() => retry(m.id)}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><line x1="12" y1="6" x2="12" y2="14" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/><line x1="12" y1="18" x2="12.01" y2="18" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/></svg>
                    </div>
                  )}
                  {m.sent && isRetrying && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="10" stroke={L.border} strokeWidth="2"/>
                      <path d="M12 2a10 10 0 010 20" stroke={PRIMARY} strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  )}
                  <div style={{
                    background: m.sent ? (failed ? '#F0F2F5' : succeeded ? GRAD : GRAD) : '#F0F0F0',
                    color: m.sent ? (failed ? L.muted : '#fff') : L.text,
                    borderRadius: m.sent ? SEND_R : RECV_R,
                    padding: '10px 14px',
                    fontSize: 14,
                    opacity: isRetrying ? 0.6 : 1,
                    border: failed ? `1.5px solid rgba(250,56,62,0.3)` : 'none',
                    transition: 'all 0.3s',
                  }}>{m.text}</div>
                </div>
                {m.sent && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: failed ? ERROR : L.muted }}>{m.time}</span>
                    {failed && !isRetrying && (
                      <button onClick={() => retry(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: ERROR, fontFamily: 'inherit', padding: 0, textDecoration: 'underline' }}>Tap to retry</button>
                    )}
                    {isRetrying && <span style={{ fontSize: 11, color: PRIMARY }}>Retrying…</span>}
                    {succeeded && <span style={{ fontSize: 11, color: SUCCESS }}>✓ Sent</span>}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ padding: '10px 14px', borderTop: `1px solid ${L.border}`, background: L.card, display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ flex: 1, background: '#F0F2F5', borderRadius: 9999, padding: '9px 14px', fontSize: 14, color: L.muted }}>Aa</div>
        <button style={{ background: GRAD, border: 'none', borderRadius: 9999, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 4. 404 SCREEN
// ═══════════════════════════════════════════════════════════════════

function NotFoundScreen({ bp }: { bp: Bp }) {
  return (
    <div style={{ height: '100%', background: L.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
      {/* Illustration */}
      <div style={{ position: 'relative', width: bp === 'mobile' ? 180 : 220, height: bp === 'mobile' ? 180 : 220, marginBottom: 32 }}>
        {/* Background circle */}
        <div style={{ position: 'absolute', inset: 0, borderRadius: 9999, background: 'linear-gradient(135deg, rgba(0,178,255,0.08) 0%, rgba(182,32,224,0.08) 100%)' }} />
        {/* Ghost bubble */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: bp === 'mobile' ? 110 : 130, height: bp === 'mobile' ? 110 : 130, borderRadius: '50% 50% 50% 50% / 50% 50% 40% 40%', background: 'linear-gradient(135deg, rgba(0,178,255,0.15) 0%, rgba(182,32,224,0.15) 100%)', border: '2px dashed rgba(8,102,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6 }}>
          {/* Eyes */}
          <div style={{ display: 'flex', gap: 18, marginBottom: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: 9999, background: GRAD }} />
            <div style={{ width: 10, height: 10, borderRadius: 9999, background: GRAD }} />
          </div>
          {/* Mouth wavy */}
          <svg width="36" height="14" viewBox="0 0 36 14"><path d="M2 4 Q9 12 18 7 Q27 2 34 10" fill="none" stroke="url(#mg)" strokeWidth="2.5" strokeLinecap="round"/><defs><linearGradient id="mg" x1="0" y1="0" x2="36" y2="0"><stop stopColor="#00B2FF"/><stop offset="1" stopColor="#B620E0"/></linearGradient></defs></svg>
        </div>
        {/* Floating 404 */}
        <div style={{ position: 'absolute', top: 8, right: 8, fontSize: bp === 'mobile' ? 28 : 36, fontWeight: 900, background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: -2 }}>404</div>
        {/* Floating dots */}
        {[[10, 50], [150, 20], [160, 140], [20, 140]].map(([x, y], i) => (
          <div key={i} style={{ position: 'absolute', left: x * (bp === 'mobile' ? 0.85 : 1), top: y * (bp === 'mobile' ? 0.85 : 1), width: [8, 5, 10, 6][i], height: [8, 5, 10, 6][i], borderRadius: 9999, background: GRAD, opacity: 0.4 }} />
        ))}
      </div>

      <h1 style={{ fontSize: bp === 'mobile' ? 22 : 28, fontWeight: 800, color: L.text, margin: '0 0 10px', letterSpacing: -0.5 }}>Page not found</h1>
      <p style={{ fontSize: bp === 'mobile' ? 14 : 15, color: L.muted, margin: '0 0 28px', lineHeight: 1.6, maxWidth: 320 }}>
        We looked everywhere but couldn't find what you're looking for. It may have been moved or deleted.
      </p>
      <div style={{ display: 'flex', flexDirection: bp === 'mobile' ? 'column' : 'row', gap: 10, width: bp === 'mobile' ? '100%' : 'auto' }}>
        <button style={{ background: GRAD, color: '#fff', border: 'none', borderRadius: 9999, padding: '11px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(8,102,255,0.25)' }}>
          Go back home
        </button>
        <button style={{ background: 'transparent', color: L.muted, border: `1.5px solid ${L.border}`, borderRadius: 9999, padding: '11px 24px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          Report issue
        </button>
      </div>

      {/* Breadcrumb hint */}
      <div style={{ marginTop: 32, fontSize: 12, color: L.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>mychatapp.com</span>
        <span>›</span>
        <span style={{ color: ERROR, textDecoration: 'line-through' }}>this-page-does-not-exist</span>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 5. SESSION EXPIRED MODAL
// ═══════════════════════════════════════════════════════════════════

function SessionExpiredDemo({ bp }: { bp: Bp }) {
  const [dismissed, setDismissed] = useState(false)
  const [loggingIn, setLoggingIn] = useState(false)

  const handleLogin = () => {
    setLoggingIn(true)
    setTimeout(() => { setLoggingIn(false); setDismissed(false) }, 1500)
  }

  return (
    <div style={{ height: '100%', background: L.bg, overflow: 'hidden', position: 'relative' }}>
      {/* Blurred content behind */}
      <div style={{ display: 'flex', height: '100%', filter: dismissed ? 'none' : 'blur(3px)', transition: 'filter 0.3s', userSelect: 'none', pointerEvents: 'none' }}>
        <div style={{ width: bp !== 'mobile' ? 280 : '100%', background: L.card, borderRight: `1px solid ${L.border}`, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${L.border}` }}>
            <span style={{ fontSize: 16, fontWeight: 700 }}>Chats</span>
          </div>
          {['Alex Johnson','Design Team','Maria Garcia'].map((n, i) => (
            <div key={n} style={{ padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center', borderBottom: `1px solid ${L.divider}` }}>
              <Av name={n} size={42} />
              <div><div style={{ fontSize: 14, fontWeight: 500 }}>{n}</div><div style={{ fontSize: 12, color: L.muted }}>Hey! Want to...</div></div>
            </div>
          ))}
        </div>
        {bp !== 'mobile' && <div style={{ flex: 1, background: L.bg }} />}
      </div>

      {/* Modal overlay */}
      {!dismissed && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(1px)', zIndex: 50 }}>
          <div style={{ background: L.card, borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', width: '100%', maxWidth: 380, overflow: 'hidden' }}>
            {/* Header gradient strip */}
            <div style={{ height: 6, background: GRAD }} />
            <div style={{ padding: bp === 'mobile' ? '24px 24px 28px' : '28px 32px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16 }}>
              {/* Icon */}
              <div style={{ width: 60, height: 60, borderRadius: 9999, background: 'rgba(247,185,40,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" stroke={WARNING} strokeWidth="1.8" strokeLinejoin="round"/><path d="M7 11V7a5 5 0 0110 0v4" stroke={WARNING} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="16" r="1.5" fill={WARNING}/></svg>
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: L.text, marginBottom: 6 }}>Session Expired</div>
                <div style={{ fontSize: 14, color: L.muted, lineHeight: 1.6, maxWidth: 280 }}>
                  Your session has expired for security. Please log in again to continue where you left off.
                </div>
              </div>
              {/* Info row */}
              <div style={{ background: L.bg, borderRadius: 10, padding: '10px 16px', width: '100%', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Av name="Taylor Reeves" size={28} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: L.text }}>Taylor Reeves</div>
                  <div style={{ fontSize: 11, color: L.muted }}>taylor@mychatapp.com</div>
                </div>
              </div>
              <button onClick={handleLogin} style={{ background: GRAD, color: '#fff', border: 'none', borderRadius: 9999, padding: '12px 32px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', width: '100%', opacity: loggingIn ? 0.7 : 1, transition: 'opacity 0.2s', boxShadow: '0 4px 16px rgba(8,102,255,0.25)' }}>
                {loggingIn ? 'Signing in…' : 'Log In'}
              </button>
              <button onClick={() => setDismissed(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: L.muted, fontFamily: 'inherit', textDecoration: 'underline', padding: 0 }}>Not you? Use a different account</button>
            </div>
          </div>
        </div>
      )}
      {dismissed && (
        <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: L.text, color: '#fff', borderRadius: 9999, padding: '10px 20px', fontSize: 13, fontWeight: 500, boxShadow: '0 4px 16px rgba(0,0,0,0.2)', whiteSpace: 'nowrap', zIndex: 50 }}>
          <button onClick={() => setDismissed(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', fontFamily: 'inherit', fontSize: 13, fontWeight: 600 }}>Show session expired modal again</button>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 6. LOADING SKELETONS
// ═══════════════════════════════════════════════════════════════════

function PostDetailSkeleton({ bp }: { bp: Bp }) {
  return (
    <div style={{ height: '100%', background: L.bg, overflowY: 'auto' }}>
      {/* Cover image skeleton */}
      <Skel w="100%" h={bp === 'mobile' ? 200 : 300} r={0} />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: bp === 'mobile' ? '20px 16px' : '32px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Tag + date */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Skel w={70} h={22} r={9999} />
          <Skel w={80} h={14} r={6} />
        </div>
        {/* Title */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Skel w="90%" h={28} r={8} />
          <Skel w="70%" h={28} r={8} />
        </div>
        {/* Author row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: `1px solid ${L.border}`, borderBottom: `1px solid ${L.border}` }}>
          <Skel w={40} h={40} r={9999} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Skel w={120} h={14} r={6} />
            <Skel w={80} h={12} r={6} />
          </div>
          <Skel w={90} h={32} r={9999} />
        </div>
        {/* Body paragraphs */}
        {[100, 95, 80, 100, 60, 90, 75, 100, 55, 85].map((w, i) => (
          <Skel key={i} w={`${w}%`} h={14} r={6} />
        ))}
        {/* Image in body */}
        <Skel w="100%" h={bp === 'mobile' ? 140 : 200} r={10} />
        {[95, 70, 100, 60].map((w, i) => <Skel key={i} w={`${w}%`} h={14} r={6} />)}
        {/* Comment section header */}
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Skel w={110} h={18} r={6} />
          {[0,1,2].map(i => (
            <div key={i} style={{ display: 'flex', gap: 10 }}>
              <Skel w={36} h={36} r={9999} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Skel w={100} h={13} r={6} />
                <Skel w="80%" h={13} r={6} />
                <Skel w="60%" h={13} r={6} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CreatePostSkeleton({ bp }: { bp: Bp }) {
  return (
    <div style={{ height: '100%', background: L.bg, overflowY: 'auto', padding: bp === 'mobile' ? '0' : '20px' }}>
      {bp !== 'mobile' && <Skel w={200} h={24} r={8} />}
      <div style={{ background: L.card, borderRadius: bp === 'mobile' ? 0 : 12, border: bp === 'mobile' ? 'none' : `1px solid ${L.border}`, marginTop: bp === 'mobile' ? 0 : 16, overflow: 'hidden' }}>
        {/* Cover image area */}
        <div style={{ position: 'relative' }}>
          <Skel w="100%" h={bp === 'mobile' ? 180 : 220} r={0} />
          <div style={{ position: 'absolute', bottom: 12, right: 12 }}>
            <Skel w={100} h={32} r={9999} />
          </div>
        </div>
        <div style={{ padding: bp === 'mobile' ? '20px 16px' : '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Author row */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Skel w={36} h={36} r={9999} />
            <Skel w={120} h={14} r={6} />
          </div>
          {/* Title input */}
          <Skel w="100%" h={42} r={8} />
          {/* Tag selector row */}
          <div style={{ display: 'flex', gap: 8 }}>
            {[80, 90, 70, 75].map((w, i) => <Skel key={i} w={w} h={28} r={9999} />)}
          </div>
          {/* Body area */}
          <Skel w="100%" h={160} r={10} />
          {/* Toolbar */}
          <div style={{ display: 'flex', gap: 8, paddingTop: 8, borderTop: `1px solid ${L.border}` }}>
            {[32, 32, 32, 32, 32, 32].map((_, i) => <Skel key={i} w={32} h={32} r={7} />)}
            <div style={{ flex: 1 }} />
            <Skel w={100} h={36} r={9999} />
          </div>
        </div>
      </div>
    </div>
  )
}

function AdminTableSkeleton({ bp }: { bp: Bp }) {
  const cols = bp === 'mobile' ? 3 : 6
  return (
    <div style={{ height: '100%', background: '#F4F5F7', display: 'flex', overflow: 'hidden' }}>
      {/* Sidebar skeleton */}
      {bp !== 'mobile' && (
        <div style={{ width: bp === 'desktop' ? 220 : 52, background: '#1C1E21', padding: '14px 8px', display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
          <div style={{ marginBottom: 14 }}><Skel w={bp === 'desktop' ? 140 : 32} h={28} r={8} dark /></div>
          {[1,2,3,4,5,6,7].map(i => <Skel key={i} w={bp === 'desktop' ? '90%' : 36} h={32} r={7} dark />)}
        </div>
      )}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{ height: 48, background: '#fff', borderBottom: '1px solid #E4E6EB', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <Skel w={140} h={16} r={6} />
          <div style={{ display: 'flex', gap: 8 }}><Skel w={32} h={32} r={9999} /><Skel w={80} h={32} r={9999} /></div>
        </div>
        {/* Stats row */}
        {bp !== 'mobile' && (
          <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{ background: '#fff', border: '1px solid #E4E6EB', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><Skel w={80} h={12} r={5} /><Skel w={28} h={28} r={7} /></div>
                <Skel w={70} h={28} r={7} />
                <Skel w={90} h={12} r={5} />
              </div>
            ))}
          </div>
        )}
        {/* Table */}
        <div style={{ flex: 1, padding: bp === 'mobile' ? '12px' : '0 16px 16px', overflowY: 'auto' }}>
          <div style={{ background: '#fff', border: '1px solid #E4E6EB', borderRadius: 10, overflow: 'hidden' }}>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 0, padding: '10px 12px', background: '#F4F5F7', borderBottom: '1px solid #E4E6EB' }}>
              {Array.from({ length: cols }).map((_, i) => <Skel key={i} w="80%" h={11} r={5} />)}
            </div>
            {/* Skeleton rows */}
            {Array.from({ length: 7 }).map((_, ri) => (
              <div key={ri} style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, padding: '12px', borderBottom: '1px solid #ECEEF2', alignItems: 'center', gap: 0 }}>
                {/* First col: avatar + name */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Skel w={28} h={28} r={9999} />
                  <Skel w={80} h={13} r={6} />
                </div>
                {Array.from({ length: cols - 1 }).map((_, ci) => (
                  <Skel key={ci} w={[80, 60, 50, 70, 90][ci % 5]} h={13} r={ci === 0 ? 9999 : 6} />
                ))}
              </div>
            ))}
            {/* Pagination skeleton */}
            <div style={{ padding: '10px 14px', borderTop: '1px solid #E4E6EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Skel w={120} h={12} r={6} />
              <div style={{ display: 'flex', gap: 4 }}>
                {[0,1,2,3].map(i => <Skel key={i} w={28} h={28} r={5} />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SkeletonDemo({ bp }: { bp: Bp }) {
  const [screen, setScreen] = useState<'post-detail' | 'create-post' | 'admin-table'>('post-detail')
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: L.bg, overflow: 'hidden' }}>
      <div style={{ background: L.card, borderBottom: `1px solid ${L.border}`, display: 'flex', gap: 2, padding: '8px 12px', flexShrink: 0 }}>
        {([['post-detail', 'Post Detail'], ['create-post', 'Create Post'], ['admin-table', 'Admin Table']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setScreen(id)} style={{ background: screen === id ? PRIMARY : 'transparent', color: screen === id ? '#fff' : L.muted, border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 11, fontWeight: screen === id ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit' }}>
            {label}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {screen === 'post-detail'  && <PostDetailSkeleton bp={bp} />}
        {screen === 'create-post'  && <CreatePostSkeleton bp={bp} />}
        {screen === 'admin-table'  && <AdminTableSkeleton bp={bp} />}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════
const DEMOS: { id: DemoId; label: string }[] = [
  { id: 'dark-mode',        label: '🌙 Dark Mode' },
  { id: 'offline-banner',   label: '📡 Offline Banner' },
  { id: 'failed-send',      label: '❌ Failed to Send' },
  { id: '404',              label: '🔍 404 Screen' },
  { id: 'session-expired',  label: '🔒 Session Expired' },
  { id: 'skeletons',        label: '💀 Skeletons' },
]

export default function UIStates() {
  const [demo, setDemo] = useState<DemoId>('dark-mode')
  const [bp,   setBp]   = useState<Bp>('desktop')

  function DemoContent({ bp }: { bp: Bp }) {
    if (demo === 'dark-mode')       return <DarkModeDemo bp={bp} />
    if (demo === 'offline-banner')  return <OfflineBannerDemo bp={bp} />
    if (demo === 'failed-send')     return <FailedSendDemo bp={bp} />
    if (demo === '404')             return <NotFoundScreen bp={bp} />
    if (demo === 'session-expired') return <SessionExpiredDemo bp={bp} />
    if (demo === 'skeletons')       return <SkeletonDemo bp={bp} />
    return null
  }

  const BG_STRIP = demo === 'dark-mode' ? '#0A0B0C' : '#1C1E21'

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: BG_STRIP, minHeight: '100vh' }}>
      <style>{`
        @keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>

      {/* Control strip */}
      <div style={{ background: '#111316', borderBottom: '1px solid #2D2F33', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: 9999, background: GRAD }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>UI States</span>
        </div>
        <div style={{ display: 'flex', gap: 3, background: '#1C1E21', borderRadius: 8, padding: 3, flexWrap: 'wrap' }}>
          {DEMOS.map(d => (
            <button key={d.id} onClick={() => setDemo(d.id)}
              style={{ background: demo === d.id ? '#3A3C42' : 'transparent', color: demo === d.id ? '#fff' : '#8A8C91', border: 'none', borderRadius: 6, padding: '5px 13px', fontSize: 12, fontWeight: demo === d.id ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
              {d.label}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 3, background: '#1C1E21', borderRadius: 8, padding: 3 }}>
          {(['mobile', 'tablet', 'desktop'] as Bp[]).map(b => (
            <button key={b} onClick={() => setBp(b)}
              style={{ background: bp === b ? PRIMARY : 'transparent', color: bp === b ? '#fff' : '#8A8C91', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: bp === b ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize' }}>
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Frames */}
      <div style={{ padding: '40px 24px', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 40, alignItems: 'flex-start', minHeight: 'calc(100vh - 56px)' }}>
        <DeviceFrame bp={bp}><DemoContent bp={bp} /></DeviceFrame>
      </div>
    </div>
  )
}
