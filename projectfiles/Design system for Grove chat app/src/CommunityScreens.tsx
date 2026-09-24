import { useState, useEffect } from 'react'

// ─── Tokens ──────────────────────────────────────────────────────
const GRAD     = 'linear-gradient(135deg, #00B2FF 0%, #B620E0 100%)'
const GRAD_MSG = 'linear-gradient(135deg, #0866FF 0%, #7B2FBE 100%)'
const PRIMARY  = '#0866FF'
const PURPLE   = '#8B5CF6'
const BG       = '#F7F8FA'
const CARD     = '#FFFFFF'
const TEXT     = '#050505'
const MUTED    = '#65676B'
const BORDER   = '#E4E6EB'
const SUCCESS  = '#31A24C'
const ERROR    = '#FA383E'
const WARNING  = '#F7B928'

type Breakpoint = 'mobile' | 'tablet' | 'desktop'
type Demo = 'discover' | 'my-communities' | 'create' | 'join-request' | 'community-info' | 'invite'

// ─── Avatar helpers ───────────────────────────────────────────────
const PALETTE = ['#0866FF','#B620E0','#00B2FF','#31A24C','#F7B928','#FA383E','#8B5CF6','#EC4899']
const ac = (n: string) => PALETTE[n.charCodeAt(0) % PALETTE.length]
function Av({ name, size = 32, online = false }: { name: string; size?: number; online?: boolean }) {
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div style={{ width: size, height: size, borderRadius: '50%', background: ac(name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.37, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
        {name.split(' ').map(w => w[0]).join('').slice(0, 2)}
      </div>
      {online && <div style={{ position: 'absolute', bottom: 0, right: 0, width: size * 0.28, height: size * 0.28, borderRadius: '50%', background: SUCCESS, border: '2px solid #fff' }} />}
    </div>
  )
}

// ─── Community data ───────────────────────────────────────────────
type JoinState = 'join' | 'joined' | 'requested'

interface Community {
  id: string
  name: string
  description: string
  members: number
  online: number
  category: string
  private: boolean
  coverGrad: string
  iconEmoji: string
  featured?: boolean
}

const COMMUNITIES: Community[] = [
  { id: 'dg', name: 'Design Guild',       description: 'A space for designers to share work, get feedback, and explore new tools together.', members: 3841, online: 142, category: 'Design', private: false, coverGrad: 'linear-gradient(135deg, #0866FF 0%, #7B2FBE 100%)', iconEmoji: '🎨', featured: true },
  { id: 'tw', name: 'TypeScript Weekly',  description: 'Deep dives into TypeScript patterns, releases, and practical tips for everyday engineers.', members: 12034, online: 489, category: 'Tech', private: false, coverGrad: 'linear-gradient(135deg, #3178C6 0%, #1A1A2E 100%)', iconEmoji: '🔷' },
  { id: 'fc', name: 'Football Collective',description: 'Live match threads, tactical analysis, transfer news, and weekly prediction leagues.', members: 28901, online: 1204, category: 'Sports', private: false, coverGrad: 'linear-gradient(135deg, #31A24C 0%, #1A4D2E 100%)', iconEmoji: '⚽', featured: true },
  { id: 'ig', name: 'Indie Game Dev',     description: 'Solo and small-team game developers sharing builds, seeking playtesters, and swapping tools.', members: 5672, online: 231, category: 'Gaming', private: false, coverGrad: 'linear-gradient(135deg, #FA383E 0%, #7B2FBE 100%)', iconEmoji: '🕹️' },
  { id: 'ux', name: 'UX Research Lab',    description: 'Share studies, findings, and methodologies. Private community — join requests are reviewed by admins.', members: 890, online: 34, category: 'Design', private: true, coverGrad: 'linear-gradient(135deg, #F7B928 0%, #FA383E 100%)', iconEmoji: '🔬' },
  { id: 'os', name: 'Open Source Hub',    description: 'Collaborate on OSS projects, find contributors, and celebrate merged PRs.', members: 7230, online: 310, category: 'Tech', private: false, coverGrad: 'linear-gradient(135deg, #00B2FF 0%, #0866FF 100%)', iconEmoji: '🌐' },
  { id: 'ru', name: 'Runners United',     description: 'Training plans, race recaps, gear reviews, and motivation from a global running community.', members: 4521, online: 67, category: 'Sports', private: false, coverGrad: 'linear-gradient(135deg, #F7B928 0%, #31A24C 100%)', iconEmoji: '🏃' },
  { id: 'rg', name: 'Retro Gaming Club',  description: 'All things classic — speedruns, collections, pixel art jams, and weekly retro quiz nights.', members: 2198, online: 89, category: 'Gaming', private: true, coverGrad: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)', iconEmoji: '👾' },
]

const CATEGORIES = ['All', 'Design', 'Tech', 'Gaming', 'Sports']

const MY_COMMUNITIES = [
  { id: 'dg', name: 'Design Guild',      preview: 'Jordan: Check this out 🔥',     unread: 3,  online: 142, coverGrad: 'linear-gradient(135deg, #0866FF 0%, #7B2FBE 100%)', iconEmoji: '🎨', time: '2m'  },
  { id: 'tw', name: 'TypeScript Weekly', preview: 'New post: Strict mode tips',     unread: 1,  online: 489, coverGrad: 'linear-gradient(135deg, #3178C6 0%, #1A1A2E 100%)', iconEmoji: '🔷', time: '1h'  },
  { id: 'fc', name: 'Football Collective',preview: 'Maria: Match thread is live ⚽', unread: 0,  online: 1204,coverGrad: 'linear-gradient(135deg, #31A24C 0%, #1A4D2E 100%)', iconEmoji: '⚽', time: '3h'  },
  { id: 'os', name: 'Open Source Hub',   preview: 'Alex merged a PR 🎉',            unread: 0,  online: 310, coverGrad: 'linear-gradient(135deg, #00B2FF 0%, #0866FF 100%)', iconEmoji: '🌐', time: 'Tue' },
]

const COMMUNITY_MEMBERS = [
  { name: 'Jordan Kim',    role: 'Owner',  online: true  },
  { name: 'Maria Garcia',  role: 'Admin',  online: true  },
  { name: 'Taylor Reeves', role: 'You',    online: true  },
  { name: 'Alex Chen',     role: 'Member', online: false },
  { name: 'Priya Sharma',  role: 'Member', online: true  },
  { name: 'Sam Okafor',    role: 'Member', online: false },
  { name: 'Riley Davis',   role: 'Member', online: false },
  { name: 'Casey Park',    role: 'Member', online: true  },
]

const PENDING_REQUESTS = [
  { name: 'Drew Nguyen',  mutual: 4 },
  { name: 'Blake Torres', mutual: 2 },
]

const CONTACTS = [
  { name: 'Riley Davis',  mutual: 14 },
  { name: 'Morgan Lee',   mutual: 8  },
  { name: 'Casey Park',   mutual: 7  },
  { name: 'Drew Nguyen',  mutual: 4  },
  { name: 'Blake Torres', mutual: 2  },
  { name: 'Sam Okafor',   mutual: 9  },
]

const ROLE_STYLE: Record<string, { color: string; bg: string }> = {
  Owner:  { color: '#B620E0', bg: 'rgba(182,32,224,0.08)' },
  Admin:  { color: PRIMARY,   bg: 'rgba(8,102,255,0.08)'  },
  You:    { color: SUCCESS,   bg: 'rgba(49,162,76,0.08)'  },
  Member: { color: MUTED,     bg: 'rgba(0,0,0,0.04)'      },
}

// ─── Shared community avatar ──────────────────────────────────────
function CommunityAv({ coverGrad, iconEmoji, size = 40, radius = 12 }: { coverGrad: string; iconEmoji: string; size?: number; radius?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: radius, background: coverGrad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.42, flexShrink: 0 }}>
      {iconEmoji}
    </div>
  )
}

// ─── Shared App shell  ────────────────────────────────────────────
function IconSidebar() {
  return (
    <div style={{ width: 70, background: CARD, borderRight: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0', gap: 4, flexShrink: 0 }}>
      <div style={{ width: 38, height: 38, borderRadius: 11, background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 18 }}>💬</span>
      </div>
      {[
        { icon: '💬', label: 'Chat',      active: false },
        { icon: '🔍', label: 'Explore',   active: true  },
        { icon: '👥', label: 'Groups',    active: false },
        { icon: '📰', label: 'Feed',      active: false },
        { icon: '👤', label: 'Profile',   active: false },
      ].map(({ icon, active }) => (
        <div key={icon} style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: active ? 'rgba(8,102,255,0.08)' : 'transparent', fontSize: 18 }}>
          {icon}
        </div>
      ))}
      <div style={{ marginTop: 'auto' }}><Av name="Taylor Reeves" size={34} online /></div>
    </div>
  )
}

function BottomTabBar({ active }: { active: string }) {
  const tabs = [
    { icon: '💬', label: 'Chat'    },
    { icon: '🔍', label: 'Explore' },
    { icon: '👥', label: 'Groups'  },
    { icon: '📰', label: 'Feed'    },
    { icon: '👤', label: 'Me'      },
  ]
  return (
    <div style={{ height: 56, background: CARD, borderTop: `1px solid ${BORDER}`, display: 'flex', flexShrink: 0 }}>
      {tabs.map(t => (
        <div key={t.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, color: t.label === active ? PRIMARY : MUTED }}>
          <span style={{ fontSize: 18 }}>{t.icon}</span>
          <span style={{ fontSize: 9, fontWeight: t.label === active ? 700 : 400 }}>{t.label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Shared header ────────────────────────────────────────────────
function PageHeader({ title, onBack, right, compact = false }: { title: string; onBack?: () => void; right?: React.ReactNode; compact?: boolean }) {
  return (
    <div style={{ padding: compact ? '10px 12px' : '12px 20px', background: CARD, borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
      {onBack && (
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 4, marginLeft: -4 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke={TEXT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      )}
      <span style={{ flex: 1, fontSize: compact ? 16 : 18, fontWeight: 700, color: TEXT }}>{title}</span>
      {right}
    </div>
  )
}

// ─── Toast ────────────────────────────────────────────────────────
function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div style={{ position: 'absolute', top: visible ? 14 : -60, left: '50%', transform: 'translateX(-50%)', zIndex: 200, background: '#1C1E21', color: '#fff', borderRadius: 9999, padding: '9px 18px', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', transition: 'top 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', display: 'flex', alignItems: 'center', gap: 8 }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke={SUCCESS} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      {message}
    </div>
  )
}

// ─── Join button ──────────────────────────────────────────────────
function JoinBtn({ state, isPrivate, onToggle, compact = false }: { state: JoinState; isPrivate: boolean; onToggle: () => void; compact?: boolean }) {
  const map = {
    join:      { label: 'Join',      bg: GRAD_MSG,    color: '#fff',  border: 'none'                             },
    joined:    { label: 'Joined ✓',  bg: CARD,         color: SUCCESS, border: `1.5px solid ${SUCCESS}`           },
    requested: { label: 'Requested', bg: 'rgba(247,185,40,0.1)', color: WARNING, border: `1.5px solid ${WARNING}` },
  }[state]
  return (
    <button onClick={onToggle}
      style={{ background: map.bg, color: map.color, border: map.border, borderRadius: 9999, padding: compact ? '5px 14px' : '6px 18px', fontSize: compact ? 12 : 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all 0.15s', boxShadow: state === 'join' ? '0 2px 10px rgba(8,102,255,0.25)' : 'none' }}>
      {isPrivate && state === 'join' ? 'Request' : map.label}
    </button>
  )
}

// ─── Community card ───────────────────────────────────────────────
function CommunityCard({ community, joinState, onToggle, compact = false }: { community: Community; joinState: JoinState; onToggle: () => void; compact?: boolean }) {
  return (
    <div style={{ background: CARD, borderRadius: 16, border: `1px solid ${BORDER}`, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', transition: 'box-shadow 0.15s' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 24px rgba(0,0,0,0.1)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'}>
      {/* Cover */}
      <div style={{ height: compact ? 64 : 80, background: community.coverGrad, position: 'relative', flexShrink: 0 }}>
        {community.private && (
          <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.45)', borderRadius: 9999, padding: '3px 9px', fontSize: 10, fontWeight: 700, color: '#fff', display: 'flex', gap: 4, alignItems: 'center', backdropFilter: 'blur(4px)' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" stroke="white" strokeWidth="2"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
            Private
          </div>
        )}
        {community.featured && (
          <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(247,185,40,0.9)', borderRadius: 9999, padding: '2px 9px', fontSize: 10, fontWeight: 700, color: '#fff' }}>⭐ Featured</div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: compact ? '10px 12px' : '12px 14px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        {/* Avatar + name row */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ width: compact ? 38 : 44, height: compact ? 38 : 44, borderRadius: 12, background: community.coverGrad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: compact ? 18 : 22, flexShrink: 0, border: '2px solid #fff', marginTop: -24, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
            {community.iconEmoji}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: compact ? 13 : 14, fontWeight: 700, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{community.name}</div>
            <div style={{ fontSize: 11, color: MUTED }}>
              {community.members.toLocaleString()} members
              {community.online > 0 && <span style={{ color: SUCCESS }}> · {community.online} online</span>}
            </div>
          </div>
        </div>

        {/* Category chip */}
        <span style={{ background: `${ac(community.category)}18`, color: ac(community.category), fontSize: 11, fontWeight: 700, borderRadius: 9999, padding: '2px 9px', alignSelf: 'flex-start', border: `1px solid ${ac(community.category)}30` }}>{community.category}</span>

        {/* Description */}
        <p style={{ margin: 0, fontSize: compact ? 12 : 13, color: MUTED, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }}>
          {community.description}
        </p>

        {/* Join button */}
        <JoinBtn state={joinState} isPrivate={community.private} onToggle={onToggle} compact={compact} />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 1. DISCOVER COMMUNITIES
// ═══════════════════════════════════════════════════════════════════
function DiscoverScreen({ bp }: { bp: Breakpoint }) {
  const [search, setSearch]   = useState('')
  const [cat, setCat]         = useState('All')
  const [joinStates, setJoinStates] = useState<Record<string, JoinState>>({})
  const isMobile = bp === 'mobile'
  const compact  = bp !== 'desktop'

  const cols = bp === 'desktop' ? 3 : bp === 'tablet' ? 2 : 1

  const filtered = COMMUNITIES.filter(c =>
    (cat === 'All' || c.category === cat) &&
    (c.name.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase()))
  )

  const toggleJoin = (id: string, isPrivate: boolean) => {
    setJoinStates(s => {
      const cur = s[id] ?? 'join'
      if (cur === 'join') return { ...s, [id]: isPrivate ? 'requested' : 'joined' }
      return { ...s, [id]: 'join' }
    })
  }

  return (
    <div style={{ display: 'flex', height: '100%', background: BG }}>
      {!compact && <IconSidebar />}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <PageHeader title="Discover Communities" compact={compact} right={
          <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(8,102,255,0.08)', cursor: 'pointer' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><line x1="4" y1="8" x2="20" y2="8" stroke={PRIMARY} strokeWidth="1.8" strokeLinecap="round"/><line x1="4" y1="16" x2="20" y2="16" stroke={PRIMARY} strokeWidth="1.8" strokeLinecap="round"/></svg>
          </div>
        } />

        {/* Search + filters */}
        <div style={{ padding: compact ? '10px 12px' : '12px 20px', background: CARD, borderBottom: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
          <div style={{ background: BG, borderRadius: 12, padding: '8px 14px', display: 'flex', gap: 8, alignItems: 'center', border: `1.5px solid ${BORDER}` }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke={MUTED} strokeWidth="1.8"/><path d="M21 21l-4.35-4.35" stroke={MUTED} strokeWidth="1.8" strokeLinecap="round"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search communities…"
              style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 14, color: TEXT, fontFamily: 'inherit', flex: 1 }} />
          </div>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCat(c)}
                style={{ background: cat === c ? GRAD_MSG : CARD, color: cat === c ? '#fff' : MUTED, border: `1.5px solid ${cat === c ? 'transparent' : BORDER}`, borderRadius: 9999, padding: '5px 14px', fontSize: 13, fontWeight: cat === c ? 700 : 500, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', transition: 'all 0.15s', flexShrink: 0 }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: compact ? '12px' : '20px' }}>
          {filtered.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: compact ? 10 : 16 }}>
              {filtered.map(c => (
                <CommunityCard key={c.id} community={c} compact={compact}
                  joinState={joinStates[c.id] ?? 'join'}
                  onToggle={() => toggleJoin(c.id, c.private)} />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 16px', color: MUTED }}>
              <div style={{ fontSize: 40, marginBottom: 14 }}>🔍</div>
              <p style={{ fontSize: 16, fontWeight: 600, color: TEXT, margin: '0 0 6px' }}>No communities found</p>
              <p style={{ fontSize: 14, margin: 0 }}>Try a different keyword or category</p>
            </div>
          )}
        </div>

        {isMobile && <BottomTabBar active="Explore" />}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 2. MY COMMUNITIES
// ═══════════════════════════════════════════════════════════════════
function MyCommunitiesScreen({ bp }: { bp: Breakpoint }) {
  const isMobile = bp === 'mobile'
  const compact  = bp !== 'desktop'

  return (
    <div style={{ display: 'flex', height: '100%', background: BG }}>
      {!compact && <IconSidebar />}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
        <PageHeader title="My Communities" compact={compact} right={
          <button style={{ background: GRAD_MSG, border: 'none', borderRadius: 9999, padding: '6px 14px', fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', gap: 6, alignItems: 'center' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
            Create
          </button>
        } />

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* My communities list */}
          {MY_COMMUNITIES.map(c => (
            <div key={c.id}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: compact ? '11px 14px' : '13px 20px', borderBottom: `1px solid ${BORDER}`, background: CARD, cursor: 'pointer', transition: 'background 0.1s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = BG}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = CARD}>
              <CommunityAv coverGrad={c.coverGrad} iconEmoji={c.iconEmoji} size={compact ? 46 : 52} radius={14} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: compact ? 14 : 15, fontWeight: 700, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                  <span style={{ fontSize: 11, color: MUTED, flexShrink: 0 }}>{c.time}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                  <span style={{ fontSize: 12, color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.preview}</span>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 5 }}>
                  <span style={{ fontSize: 11, color: SUCCESS, display: 'flex', alignItems: 'center', gap: 3 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: SUCCESS, display: 'inline-block' }} />
                    {c.online} online
                  </span>
                </div>
              </div>
              {c.unread > 0 && (
                <span style={{ background: GRAD, color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 9999, minWidth: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px', flexShrink: 0 }}>{c.unread}</span>
              )}
            </div>
          ))}

          {/* "Discover more" nudge */}
          <div style={{ padding: compact ? '14px 14px' : '18px 20px', display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(8,102,255,0.03)', borderBottom: `1px solid ${BORDER}`, cursor: 'pointer' }}>
            <div style={{ width: compact ? 46 : 52, height: compact ? 46 : 52, borderRadius: 14, background: 'rgba(8,102,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🔍</div>
            <div>
              <div style={{ fontSize: compact ? 14 : 15, fontWeight: 600, color: PRIMARY }}>Find more communities</div>
              <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>Browse communities based on your interests</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 'auto', flexShrink: 0 }}><path d="M9 18l6-6-6-6" stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </div>

        {/* FAB */}
        <div style={{ position: 'absolute', bottom: isMobile ? 68 : 20, right: 16, zIndex: 10 }}>
          <button style={{ background: GRAD_MSG, border: 'none', borderRadius: 9999, padding: '12px 20px', fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(8,102,255,0.35)', display: 'flex', gap: 8, alignItems: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
            Create Community
          </button>
        </div>

        {isMobile && <BottomTabBar active="Groups" />}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 3. CREATE COMMUNITY FLOW
// ═══════════════════════════════════════════════════════════════════
function CreateCommunityForm({ onClose, compact = false }: { onClose?: () => void; compact?: boolean }) {
  const [step, setStep]         = useState<1 | 2>(1)
  const [name, setName]         = useState('')
  const [desc, setDesc]         = useState('')
  const [isPrivate, setPrivate] = useState(false)
  const [created, setCreated]   = useState(false)

  const canNext = name.trim().length >= 3
  const preview = name.trim() || 'Community Name'

  if (created) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16, background: CARD }}>
        <div style={{ width: 72, height: 72, borderRadius: 22, background: GRAD_MSG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🎉</div>
        <h3 style={{ fontSize: 20, fontWeight: 700, color: TEXT, margin: 0, textAlign: 'center' }}>{name} is live!</h3>
        <p style={{ fontSize: 14, color: MUTED, textAlign: 'center', margin: 0, lineHeight: 1.55 }}>Your community has been created. Start by inviting people to join.</p>
        <button onClick={() => { setCreated(false); setStep(1); setName(''); setDesc(''); setPrivate(false) }}
          style={{ background: GRAD_MSG, border: 'none', borderRadius: 12, padding: '12px 32px', fontSize: 15, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(8,102,255,0.3)' }}>
          Invite People
        </button>
        {onClose && <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 14, color: MUTED, cursor: 'pointer', fontFamily: 'inherit' }}>Done</button>}
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: CARD, overflowY: 'auto' }}>
      {/* Step indicator */}
      <div style={{ padding: compact ? '12px 16px' : '14px 24px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        {[1, 2].map(s => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: step >= s ? GRAD_MSG : BORDER, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: step >= s ? '#fff' : MUTED, transition: 'background 0.2s' }}>
              {step > s ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg> : s}
            </div>
            <span style={{ fontSize: 12, fontWeight: step === s ? 700 : 400, color: step === s ? TEXT : MUTED }}>{s === 1 ? 'Details' : 'Settings'}</span>
            {s < 2 && <div style={{ width: compact ? 20 : 40, height: 2, borderRadius: 1, background: step > s ? GRAD_MSG : BORDER, transition: 'background 0.2s' }} />}
          </div>
        ))}
        {onClose && (
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke={MUTED} strokeWidth="2.5" strokeLinecap="round"/></svg>
          </button>
        )}
      </div>

      <div style={{ flex: 1, padding: compact ? '16px' : '24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {step === 1 ? (
          <>
            {/* Cover image upload */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: TEXT, display: 'block', marginBottom: 8 }}>Cover Image</label>
              <div style={{ height: compact ? 100 : 120, borderRadius: 14, background: name ? GRAD_MSG : BG, border: `2px dashed ${BORDER}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', transition: 'background 0.2s', position: 'relative', overflow: 'hidden' }}>
                {name
                  ? <div style={{ textAlign: 'center' }}><div style={{ fontSize: 36, marginBottom: 6 }}>🎨</div><span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Auto-preview</span></div>
                  : <>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke={MUTED} strokeWidth="1.5"/><circle cx="8.5" cy="8.5" r="1.5" stroke={MUTED} strokeWidth="1.5"/><path d="M21 15l-5-5L5 21" stroke={MUTED} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      <span style={{ fontSize: 13, color: MUTED }}>Upload cover photo</span>
                    </>
                }
              </div>
            </div>

            {/* Name */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: TEXT, display: 'block', marginBottom: 6 }}>Community Name <span style={{ color: ERROR }}>*</span></label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Indie Game Dev"
                style={{ width: '100%', border: `1.5px solid ${name.length >= 3 ? PRIMARY : BORDER}`, borderRadius: 12, padding: '11px 14px', fontSize: 14, color: TEXT, fontFamily: 'inherit', outline: 'none', background: CARD, boxSizing: 'border-box', transition: 'border-color 0.15s' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                {name.length > 0 && name.length < 3 && <span style={{ fontSize: 11, color: ERROR }}>At least 3 characters</span>}
                <span style={{ fontSize: 11, color: MUTED, marginLeft: 'auto' }}>{name.length}/50</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: TEXT, display: 'block', marginBottom: 6 }}>Description</label>
              <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="What's this community about? Tell people what to expect."
                rows={3}
                style={{ width: '100%', border: `1.5px solid ${BORDER}`, borderRadius: 12, padding: '11px 14px', fontSize: 14, color: TEXT, fontFamily: 'inherit', outline: 'none', background: CARD, resize: 'none', boxSizing: 'border-box', lineHeight: 1.5 }} />
              <span style={{ fontSize: 11, color: MUTED }}>{desc.length}/300</span>
            </div>
          </>
        ) : (
          <>
            {/* Privacy toggle */}
            <div style={{ background: BG, borderRadius: 16, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
              {[
                { value: false, label: 'Public', icon: '🌐', desc: 'Anyone can find and join this community.' },
                { value: true,  label: 'Private', icon: '🔒', desc: 'People must request to join. Admins review and approve each request before they can participate.' },
              ].map(opt => (
                <div key={opt.label} onClick={() => setPrivate(opt.value)}
                  style={{ display: 'flex', gap: 12, padding: '14px 16px', cursor: 'pointer', background: isPrivate === opt.value ? 'rgba(8,102,255,0.04)' : 'transparent', borderBottom: !opt.value ? `1px solid ${BORDER}` : 'none', transition: 'background 0.1s' }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{opt.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 3 }}>{opt.label}</div>
                    <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>{opt.desc}</div>
                  </div>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${isPrivate === opt.value ? PRIMARY : BORDER}`, background: isPrivate === opt.value ? PRIMARY : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2, transition: 'all 0.15s' }}>
                    {isPrivate === opt.value && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                  </div>
                </div>
              ))}
            </div>

            {/* Preview card */}
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ height: 60, background: canNext ? GRAD_MSG : BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 24 }}>{canNext ? '🎨' : '📋'}</span>
              </div>
              <div style={{ padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: canNext ? GRAD_MSG : BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginTop: -24, border: '2px solid #fff', boxShadow: '0 2px 6px rgba(0,0,0,0.1)', flexShrink: 0 }}>🎨</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: canNext ? TEXT : MUTED }}>{preview}</div>
                  <div style={{ fontSize: 12, color: MUTED }}>0 members · {isPrivate ? '🔒 Private' : '🌐 Public'}</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Nav buttons */}
      <div style={{ padding: compact ? '12px 16px' : '16px 24px', borderTop: `1px solid ${BORDER}`, display: 'flex', gap: 10, flexShrink: 0 }}>
        {step === 2 && (
          <button onClick={() => setStep(1)} style={{ flex: 1, padding: '12px', borderRadius: 12, border: `1.5px solid ${BORDER}`, background: CARD, fontSize: 14, fontWeight: 600, color: TEXT, cursor: 'pointer', fontFamily: 'inherit' }}>Back</button>
        )}
        <button
          onClick={() => step === 1 ? setStep(2) : setCreated(true)}
          disabled={!canNext}
          style={{ flex: step === 2 ? 2 : 1, padding: '12px', borderRadius: 12, border: 'none', background: canNext ? GRAD_MSG : BORDER, fontSize: 15, fontWeight: 700, color: canNext ? '#fff' : MUTED, cursor: canNext ? 'pointer' : 'not-allowed', fontFamily: 'inherit', boxShadow: canNext ? '0 4px 16px rgba(8,102,255,0.3)' : 'none', transition: 'all 0.15s' }}>
          {step === 1 ? 'Continue' : 'Create Community'}
        </button>
      </div>
    </div>
  )
}

function CreateCommunityDemo({ bp }: { bp: Breakpoint }) {
  const isMobile = bp === 'mobile'
  const compact  = bp !== 'desktop'

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: BG }}>
        <PageHeader title="Create Community" onBack={() => {}} compact />
        <CreateCommunityForm compact />
        <BottomTabBar active="Groups" />
      </div>
    )
  }

  // Tablet / Desktop: modal
  return (
    <div style={{ display: 'flex', height: '100%', background: BG }}>
      {!compact && <IconSidebar />}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {/* Faded background */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }} />
        <div style={{ position: 'relative', background: CARD, borderRadius: 20, width: compact ? 460 : 520, maxHeight: '90%', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.2)', zIndex: 1 }}>
          <div style={{ padding: '18px 20px 14px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: TEXT }}>Create a Community</h3>
          </div>
          <CreateCommunityForm compact={compact} />
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 4. JOIN REQUEST PENDING
// ═══════════════════════════════════════════════════════════════════
function JoinRequestDemo({ bp }: { bp: Breakpoint }) {
  const [cancelDone, setCancelDone] = useState(false)
  const [joinState, setJoinState]   = useState<JoinState>('requested')
  const isMobile = bp === 'mobile'
  const compact  = bp !== 'desktop'
  const community = COMMUNITIES.find(c => c.id === 'ux')!

  return (
    <div style={{ display: 'flex', height: '100%', background: BG }}>
      {!compact && <IconSidebar />}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <PageHeader title="Discover" compact={compact} onBack={isMobile ? () => {} : undefined} />
        <div style={{ flex: 1, overflowY: 'auto', padding: compact ? '12px' : '20px' }}>
          {/* Private community detail / card view */}
          <div style={{ background: CARD, borderRadius: 20, border: `1px solid ${BORDER}`, overflow: 'hidden', maxWidth: compact ? '100%' : 480, margin: '0 auto', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            {/* Cover */}
            <div style={{ height: compact ? 120 : 160, background: community.coverGrad, position: 'relative', display: 'flex', alignItems: 'flex-end', padding: '16px' }}>
              <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.45)', borderRadius: 9999, padding: '4px 11px', fontSize: 11, fontWeight: 700, color: '#fff', display: 'flex', gap: 5, alignItems: 'center', backdropFilter: 'blur(4px)' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" stroke="white" strokeWidth="2"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
                Private Community
              </div>
            </div>

            {/* Info */}
            <div style={{ padding: compact ? '0 16px 16px' : '0 20px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: community.coverGrad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginTop: -28, border: '3px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', flexShrink: 0 }}>
                  {community.iconEmoji}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: compact ? 17 : 20, fontWeight: 700, color: TEXT }}>{community.name}</h3>
                  <p style={{ margin: '3px 0 0', fontSize: 13, color: MUTED }}>{community.members.toLocaleString()} members</p>
                </div>
              </div>
              <p style={{ margin: '0 0 16px', fontSize: 14, color: MUTED, lineHeight: 1.6 }}>{community.description}</p>

              {/* Status banner */}
              {joinState === 'requested' && !cancelDone && (
                <div style={{ background: 'rgba(247,185,40,0.08)', border: `1.5px solid rgba(247,185,40,0.3)`, borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(247,185,40,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke={WARNING} strokeWidth="1.8"/><polyline points="12,6 12,12 16,14" stroke={WARNING} strokeWidth="1.8" strokeLinecap="round"/></svg>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 3 }}>Request pending approval</div>
                      <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>An admin will review your request. You'll get a notification when it's approved or declined.</div>
                    </div>
                  </div>
                  <button onClick={() => { setCancelDone(true); setJoinState('join') }}
                    style={{ marginTop: 12, background: 'transparent', border: `1.5px solid rgba(250,56,62,0.3)`, borderRadius: 9999, padding: '6px 16px', fontSize: 13, fontWeight: 600, color: ERROR, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Cancel Request
                  </button>
                </div>
              )}

              {cancelDone && (
                <div style={{ background: 'rgba(49,162,76,0.06)', border: `1.5px solid rgba(49,162,76,0.2)`, borderRadius: 14, padding: '12px 16px', marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: SUCCESS }}>✓ Request cancelled</div>
                  <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>You can send a new request anytime.</div>
                </div>
              )}

              {/* Members preview */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ display: 'flex' }}>
                  {['Jordan Kim', 'Maria Garcia', 'Alex Chen'].map((n, i) => (
                    <div key={n} style={{ marginLeft: i > 0 ? -10 : 0, border: '2px solid #fff', borderRadius: '50%', zIndex: 3 - i }}>
                      <Av name={n} size={28} />
                    </div>
                  ))}
                </div>
                <span style={{ fontSize: 12, color: MUTED }}>Jordan Kim, Maria Garcia +{community.members - 3} more</span>
              </div>

              <JoinBtn state={joinState} isPrivate compact={compact}
                onToggle={() => { if (joinState === 'join') { setCancelDone(false); setJoinState('requested') } }} />
            </div>
          </div>
        </div>
        {isMobile && <BottomTabBar active="Explore" />}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 5. COMMUNITY INFO & SETTINGS (member-facing)
// ═══════════════════════════════════════════════════════════════════
function CommunityInfoScreen({ bp }: { bp: Breakpoint }) {
  const [isAdmin] = useState(true)
  const [approved, setApproved] = useState<string[]>([])
  const [rejected, setRejected] = useState<string[]>([])
  const isMobile = bp === 'mobile'
  const compact  = bp !== 'desktop'

  const pending = PENDING_REQUESTS.filter(r => !approved.includes(r.name) && !rejected.includes(r.name))

  return (
    <div style={{ display: 'flex', height: '100%', background: BG }}>
      {!compact && <IconSidebar />}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <PageHeader title="Community Info" compact={compact} onBack={isMobile ? () => {} : undefined}
          right={isAdmin && (
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: PRIMARY, fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>Edit</button>
          )} />

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* Hero */}
          <div style={{ height: compact ? 120 : 160, background: COMMUNITIES[0].coverGrad, position: 'relative', flexShrink: 0 }}>
            {isAdmin && (
              <button style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: 9999, padding: '6px 12px', fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', gap: 5, alignItems: 'center', backdropFilter: 'blur(4px)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="white" strokeWidth="1.8" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>
                Edit Cover
              </button>
            )}
          </div>

          <div style={{ background: CARD, padding: compact ? '0 14px 14px' : '0 20px 20px', borderBottom: `1px solid ${BORDER}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
              <div style={{ width: 60, height: 60, borderRadius: 18, background: COMMUNITIES[0].coverGrad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginTop: -30, border: '3px solid #fff', boxShadow: '0 4px 14px rgba(0,0,0,0.15)', flexShrink: 0 }}>🎨</div>
              <button style={{ background: GRAD_MSG, border: 'none', borderRadius: 9999, padding: '8px 16px', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', gap: 6, alignItems: 'center', boxShadow: '0 2px 10px rgba(8,102,255,0.25)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="white" strokeWidth="1.8" strokeLinecap="round"/><circle cx="8.5" cy="7" r="4" stroke="white" strokeWidth="1.8"/><line x1="20" y1="8" x2="20" y2="14" stroke="white" strokeWidth="1.8" strokeLinecap="round"/><line x1="23" y1="11" x2="17" y2="11" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>
                Invite
              </button>
            </div>
            <h2 style={{ margin: '0 0 4px', fontSize: compact ? 18 : 20, fontWeight: 700, color: TEXT }}>Design Guild</h2>
            <p style={{ margin: '0 0 10px', fontSize: 13, color: MUTED }}>🌐 Public community · {COMMUNITIES[0].members.toLocaleString()} members · <span style={{ color: SUCCESS }}>{COMMUNITIES[0].online} online</span></p>
            <p style={{ margin: 0, fontSize: 13, color: TEXT, lineHeight: 1.6 }}>{COMMUNITIES[0].description}</p>
          </div>

          {/* Pending requests — admin only */}
          {isAdmin && pending.length > 0 && (
            <div style={{ margin: compact ? '10px 0 0' : '12px 0 0', background: CARD, borderBottom: `1px solid ${BORDER}` }}>
              <div style={{ padding: compact ? '10px 14px 6px' : '12px 20px 8px', display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: WARNING, textTransform: 'uppercase', letterSpacing: 0.8 }}>Join Requests</span>
                <span style={{ background: WARNING, color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 9999, minWidth: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{pending.length}</span>
              </div>
              {pending.map(r => (
                <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: compact ? '9px 14px' : '10px 20px', borderTop: `1px solid ${BORDER}` }}>
                  <Av name={r.name} size={36} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: MUTED }}>{r.mutual} mutual friends</div>
                  </div>
                  <div style={{ display: 'flex', gap: 7 }}>
                    <button onClick={() => setRejected(a => [...a, r.name])}
                      style={{ background: 'rgba(250,56,62,0.07)', border: `1px solid rgba(250,56,62,0.2)`, borderRadius: 9999, padding: '5px 14px', fontSize: 12, fontWeight: 600, color: ERROR, cursor: 'pointer', fontFamily: 'inherit' }}>Decline</button>
                    <button onClick={() => setApproved(a => [...a, r.name])}
                      style={{ background: GRAD_MSG, border: 'none', borderRadius: 9999, padding: '5px 14px', fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(8,102,255,0.25)' }}>Approve</button>
                  </div>
                </div>
              ))}
              {approved.length > 0 && (
                <div style={{ padding: compact ? '8px 14px' : '8px 20px', background: 'rgba(49,162,76,0.04)' }}>
                  <span style={{ fontSize: 12, color: SUCCESS }}>✓ Approved {approved.join(', ')}</span>
                </div>
              )}
            </div>
          )}

          {/* Members */}
          <div style={{ background: CARD, margin: compact ? '10px 0 0' : '12px 0 0', borderBottom: `1px solid ${BORDER}` }}>
            <div style={{ padding: compact ? '10px 14px 6px' : '12px 20px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8 }}>Members ({COMMUNITY_MEMBERS.length})</span>
              <span style={{ fontSize: 12, color: PRIMARY, fontWeight: 600, cursor: 'pointer' }}>See all</span>
            </div>
            {COMMUNITY_MEMBERS.map(m => (
              <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: compact ? '8px 14px' : '9px 20px', borderTop: `1px solid ${BORDER}` }}>
                <Av name={m.name} size={34} online={m.online} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{m.name}{m.role === 'You' ? ' (You)' : ''}</div>
                  <div style={{ fontSize: 11, color: MUTED, marginTop: 1 }}>{m.online ? 'Active now' : 'Last seen recently'}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: ROLE_STYLE[m.role].color, background: ROLE_STYLE[m.role].bg, borderRadius: 9999, padding: '2px 9px' }}>{m.role}</span>
              </div>
            ))}
          </div>

          {/* Shared media */}
          <div style={{ background: CARD, margin: compact ? '10px 0 0' : '12px 0 0', borderBottom: `1px solid ${BORDER}` }}>
            <div style={{ padding: compact ? '10px 14px 8px' : '12px 20px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8 }}>Shared Media</span>
              <span style={{ fontSize: 12, color: PRIMARY, fontWeight: 600, cursor: 'pointer' }}>See all</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3, padding: compact ? '0 14px 14px' : '0 20px 16px' }}>
              {[...Array(8)].map((_, i) => (
                <div key={i} style={{ aspectRatio: '1', borderRadius: 8, background: `hsl(${i * 40},60%,55%)`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                  {['🎨','🖼️','📸','🎭','✨','🌟','🎬','📐'][i]}
                </div>
              ))}
            </div>
          </div>

          {/* Leave */}
          <div style={{ padding: compact ? '14px 14px' : '16px 20px', background: CARD, margin: compact ? '10px 0 0' : '12px 0 0' }}>
            <button style={{ width: '100%', padding: '11px', borderRadius: 12, border: `1.5px solid rgba(250,56,62,0.3)`, background: 'rgba(250,56,62,0.06)', fontSize: 14, fontWeight: 600, color: ERROR, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke={ERROR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Leave Community
            </button>
          </div>
        </div>
        {isMobile && <BottomTabBar active="Explore" />}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 6. INVITE PEOPLE FLOW
// ═══════════════════════════════════════════════════════════════════
const INVITE_LINK = 'mychatapp.io/join/design-guild-k7x2p'

function InviteModal({ onClose, compact = false }: { onClose?: () => void; compact?: boolean }) {
  const [tab, setTab]           = useState<'contacts' | 'link'>('contacts')
  const [search, setSearch]     = useState('')
  const [selected, setSelected] = useState<string[]>(['Riley Davis'])
  const [copied, setCopied]     = useState(false)
  const [toastVisible, setToast] = useState(false)

  const filtered = CONTACTS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) &&
    !COMMUNITY_MEMBERS.some(m => m.name === c.name)
  )

  const toggle = (name: string) =>
    setSelected(s => s.includes(name) ? s.filter(n => n !== name) : [...s, name])

  const handleCopy = () => {
    setCopied(true)
    setToast(true)
    setTimeout(() => setToast(false), 2500)
    setTimeout(() => setCopied(false), 4000)
  }

  return (
    <div style={{ background: CARD, borderRadius: compact ? '20px 20px 0 0' : 20, width: compact ? '100%' : 420, maxHeight: compact ? '80vh' : '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.22)', position: 'relative' }}>
      <Toast message="Link copied to clipboard!" visible={toastVisible} />

      {/* Header */}
      <div style={{ padding: compact ? '14px 16px 10px' : '18px 20px 12px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
        {compact && <div style={{ width: 36, height: 4, borderRadius: 2, background: BORDER, margin: '0 auto 12px' }} />}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: TEXT }}>Invite People</h3>
          {onClose && (
            <button onClick={onClose} style={{ background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke={MUTED} strokeWidth="2.5" strokeLinecap="round"/></svg>
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: BG, borderRadius: 10, padding: 3, gap: 3 }}>
          {[
            { id: 'contacts', label: 'From Contacts' },
            { id: 'link',     label: 'Share Link'    },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as 'contacts' | 'link')}
              style={{ flex: 1, background: tab === t.id ? CARD : 'transparent', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 13, fontWeight: tab === t.id ? 700 : 500, color: tab === t.id ? TEXT : MUTED, cursor: 'pointer', fontFamily: 'inherit', boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'contacts' ? (
        <>
          {/* Selected pills */}
          {selected.length > 0 && (
            <div style={{ padding: '10px 16px', borderBottom: `1px solid ${BORDER}`, display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
              {selected.map(n => (
                <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(8,102,255,0.08)', border: `1.5px solid rgba(8,102,255,0.2)`, borderRadius: 9999, padding: '3px 8px 3px 5px' }}>
                  <Av name={n} size={18} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: PRIMARY }}>{n.split(' ')[0]}</span>
                  <button onClick={() => toggle(n)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke={PRIMARY} strokeWidth="2.5" strokeLinecap="round"/></svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Search */}
          <div style={{ padding: '10px 16px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
            <div style={{ background: BG, borderRadius: 10, padding: '7px 12px', display: 'flex', gap: 8, alignItems: 'center', border: `1.5px solid ${BORDER}` }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke={MUTED} strokeWidth="1.8"/><path d="M21 21l-4.35-4.35" stroke={MUTED} strokeWidth="1.8" strokeLinecap="round"/></svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contacts…"
                style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: TEXT, fontFamily: 'inherit', flex: 1 }} />
            </div>
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {COMMUNITY_MEMBERS.filter(m => m.name.toLowerCase().includes(search.toLowerCase())).map(m => (
              <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', opacity: 0.45 }}>
                <Av name={m.name} size={36} online={m.online} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: MUTED }}>Already a member</div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke={MUTED} strokeWidth="2" strokeLinecap="round"/></svg>
              </div>
            ))}
            {filtered.map(c => {
              const isSel = selected.includes(c.name)
              return (
                <button key={c.name} onClick={() => toggle(c.name)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', width: '100%', background: isSel ? 'rgba(8,102,255,0.04)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'background 0.1s' }}>
                  <Av name={c.name} size={36} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: MUTED }}>{c.mutual} mutual friends</div>
                  </div>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${isSel ? PRIMARY : BORDER}`, background: isSel ? PRIMARY : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                    {isSel && <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Send button */}
          <div style={{ padding: '12px 16px', borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
            <button disabled={selected.length === 0}
              style={{ width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: selected.length > 0 ? GRAD_MSG : BORDER, color: selected.length > 0 ? '#fff' : MUTED, fontSize: 15, fontWeight: 700, cursor: selected.length > 0 ? 'pointer' : 'not-allowed', fontFamily: 'inherit', boxShadow: selected.length > 0 ? '0 4px 16px rgba(8,102,255,0.3)' : 'none', transition: 'all 0.15s' }}>
              {selected.length > 0 ? `Send Invite to ${selected.length} person${selected.length > 1 ? 's' : ''}` : 'Select people to invite'}
            </button>
          </div>
        </>
      ) : (
        /* Share link tab */
        <div style={{ flex: 1, padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'rgba(8,102,255,0.04)', border: `1.5px solid rgba(8,102,255,0.15)`, borderRadius: 16, padding: '18px', textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: GRAD_MSG, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 22 }}>🔗</div>
            <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: TEXT }}>Share invite link</p>
            <p style={{ margin: 0, fontSize: 13, color: MUTED, lineHeight: 1.55 }}>Anyone with this link can join Design Guild (unless it's private and requires approval).</p>
          </div>

          {/* Link display */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: TEXT, display: 'block', marginBottom: 6 }}>Invite Link</label>
            <div style={{ background: BG, borderRadius: 12, border: `1.5px solid ${BORDER}`, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
              <span style={{ flex: 1, padding: '11px 14px', fontSize: 12, color: MUTED, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{INVITE_LINK}</span>
              <button onClick={handleCopy}
                style={{ background: copied ? SUCCESS : GRAD_MSG, border: 'none', borderRadius: 0, padding: '11px 16px', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0, transition: 'background 0.2s' }}>
                {copied ? '✓ Copied' : 'Copy Link'}
              </button>
            </div>
          </div>

          {/* Share options */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: TEXT, display: 'block', marginBottom: 8 }}>Share via</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { label: 'Messages', bg: GRAD_MSG, icon: '💬' },
                { label: 'Copy',     bg: '#1C1E21', icon: '📋' },
                { label: 'More',     bg: BG, icon: '•••', border: BORDER, textColor: TEXT },
              ].map(o => (
                <button key={o.label} onClick={o.label === 'Copy' ? handleCopy : undefined}
                  style={{ flex: 1, background: o.bg, border: o.border ? `1.5px solid ${o.border}` : 'none', borderRadius: 12, padding: '10px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <span style={{ fontSize: 18 }}>{o.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: o.textColor ?? '#fff' }}>{o.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Link expiry */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 14px', background: 'rgba(247,185,40,0.06)', border: `1px solid rgba(247,185,40,0.2)`, borderRadius: 12 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke={WARNING} strokeWidth="1.7"/><polyline points="12,6 12,12 16,14" stroke={WARNING} strokeWidth="1.7" strokeLinecap="round"/></svg>
            <span style={{ fontSize: 12, color: MUTED }}>This link expires in <strong style={{ color: TEXT }}>7 days</strong>. You can reset it anytime.</span>
          </div>
        </div>
      )}
    </div>
  )
}

function InviteDemo({ bp }: { bp: Breakpoint }) {
  const isMobile = bp === 'mobile'
  const compact  = bp !== 'desktop'

  if (isMobile) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <div style={{ flex: 1, overflowY: 'auto', background: BG, opacity: 0.3, pointerEvents: 'none' }}>
          <div style={{ padding: '12px' }}>
            {COMMUNITY_MEMBERS.slice(0, 3).map(m => (
              <div key={m.name} style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: `1px solid ${BORDER}` }}>
                <Av name={m.name} size={38} online={m.online} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{m.name}</div>
                  <div style={{ fontSize: 12, color: MUTED }}>{m.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 50 }}>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, top: -200, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }} />
          <InviteModal compact />
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100%', background: BG }}>
      {!compact && <IconSidebar />}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }} />
        <div style={{ position: 'relative', zIndex: 1, maxHeight: '90%' }}>
          <InviteModal compact={compact} />
        </div>
      </div>
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
  { id: 'discover',       label: 'Discover',        desc: 'Search + category chips · 3-col desktop / 2-col tablet / 1-col mobile grid with Join / Request states' },
  { id: 'my-communities', label: 'My Communities',  desc: 'Joined communities list with activity preview, unread indicators, online count, and Create FAB' },
  { id: 'create',         label: 'Create Community', desc: '2-step form: name + cover upload → Public/Private toggle · modal on desktop/tablet, full-screen on mobile' },
  { id: 'join-request',   label: 'Join Request',    desc: '"Request pending approval" banner with Cancel Request, and the full private community detail page' },
  { id: 'community-info', label: 'Community Info',  desc: 'Cover, stats, Invite button, admin Approve/Decline controls, member list with role badges, shared media grid' },
  { id: 'invite',         label: 'Invite People',   desc: 'Two-tab modal: contact multi-select with pills + share link with Copy button and confirmation toast' },
]

export default function CommunityScreens() {
  const [activeDemo, setActiveDemo] = useState<Demo>('discover')
  const current = DEMOS.find(d => d.id === activeDemo)!

  const renderDemo = (bp: Breakpoint) => {
    switch (activeDemo) {
      case 'discover':       return <DiscoverScreen bp={bp} />
      case 'my-communities': return <MyCommunitiesScreen bp={bp} />
      case 'create':         return <CreateCommunityDemo bp={bp} />
      case 'join-request':   return <JoinRequestDemo bp={bp} />
      case 'community-info': return <CommunityInfoScreen bp={bp} />
      case 'invite':         return <InviteDemo bp={bp} />
    }
  }

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: BG, minHeight: '100vh' }}>
      {/* Control strip */}
      <div style={{ background: GRAD, padding: '20px 40px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ marginBottom: 14 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 3px' }}>Community Screens</h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', margin: 0 }}>{current.desc}</p>
          </div>
          <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 4, flexWrap: 'wrap' }}>
            {DEMOS.map(d => (
              <button key={d.id} onClick={() => setActiveDemo(d.id)}
                style={{ background: activeDemo === d.id ? '#fff' : 'transparent', color: activeDemo === d.id ? '#050505' : 'rgba(255,255,255,0.9)', border: 'none', borderRadius: 9, padding: '5px 14px', fontSize: 12, fontWeight: activeDemo === d.id ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Frames */}
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
