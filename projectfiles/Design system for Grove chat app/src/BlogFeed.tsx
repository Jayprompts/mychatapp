import { useState, useRef, useEffect } from 'react'

// ─── Tokens ───────────────────────────────────────────────────────
const GRAD    = 'linear-gradient(135deg, #00B2FF 0%, #B620E0 100%)'
const PRIMARY = '#0866FF'
const BG      = '#F7F8FA'
const CARD    = '#FFFFFF'
const TEXT    = '#050505'
const MUTED   = '#65676B'
const BORDER  = '#E4E6EB'

type Breakpoint  = 'mobile' | 'tablet' | 'desktop'
type FeedState   = 'normal' | 'skeleton' | 'empty'
type ActiveView  = 'feed' | 'detail' | 'create'
type FilterKey   = 'latest' | 'liked' | 'trending'

// ─── Data ─────────────────────────────────────────────────────────
interface Author { name: string; role: string }
interface Post {
  id: string
  title: string
  excerpt: string
  body: string
  cover: string
  coverColor: string
  author: Author
  likes: number
  comments: number
  date: string
  tag: string
  readMin: number
}

const avatarPalette = ['#0866FF','#B620E0','#00B2FF','#31A24C','#F7B928','#FA383E','#8B5CF6']
const avatarColor = (name: string) => avatarPalette[name.charCodeAt(0) % avatarPalette.length]

const COVERS = [
  { bg: 'linear-gradient(135deg,#00B2FF,#B620E0)', pattern: 'chat' },
  { bg: 'linear-gradient(135deg,#0866FF,#6B40F0)', pattern: 'dots' },
  { bg: 'linear-gradient(135deg,#31A24C,#00B2FF)', pattern: 'wave' },
  { bg: 'linear-gradient(135deg,#F7B928,#FA383E)', pattern: 'grid' },
  { bg: 'linear-gradient(135deg,#8B5CF6,#B620E0)', pattern: 'mesh' },
  { bg: 'linear-gradient(135deg,#FA383E,#F7B928)', pattern: 'ring' },
]

const POSTS: Post[] = [
  {
    id: '1', title: 'Building Real-Time Chat with WebSockets',
    excerpt: 'How we scaled MyChatApp to 2M concurrent users without a single dropped message — lessons from the trenches.',
    body: `We started with a naive polling approach that hammered our servers every two seconds. Here's what we learned moving to WebSockets.\n\n## The Problem With Polling\n\nEvery client was making HTTP requests on a fixed interval regardless of whether anything had changed. At 50k users that's manageable. At 500k it becomes a denial-of-service attack against your own infrastructure.\n\n## Enter WebSockets\n\nA persistent bidirectional connection means the server pushes updates exactly when they happen. No wasted requests, no unnecessary latency. The initial handshake costs one HTTP upgrade, and after that it's raw frames over TCP.\n\n## Scaling Horizontally\n\nThe tricky part is state. When a user connects to Server A and their friend is on Server B, you need a message bus between them. We chose Redis pub/sub for its simplicity and throughput — it handles our peak load of 140k messages per second with headroom to spare.\n\n## Lessons Learned\n\n- Heartbeat pings every 30s catch silent connection drops before users notice\n- Exponential backoff on reconnect prevents thundering herds after a deployment\n- Compress payloads with per-message deflate — 60% bandwidth reduction at scale`,
    cover: COVERS[0].bg, coverColor: COVERS[0].bg,
    author: { name: 'Jordan Kim', role: 'Principal Engineer' },
    likes: 342, comments: 47, date: 'Sep 18', tag: 'Engineering', readMin: 6,
  },
  {
    id: '2', title: 'Designing for Accessibility in Dark Mode',
    excerpt: 'Color contrast, focus states, and motion preferences — everything a designer needs to make dark UI truly accessible.',
    body: `Dark mode is table stakes in 2026. But making it *accessible* is an entirely different challenge.\n\n## Contrast Is Not Enough\n\nAA contrast ratios were designed with light backgrounds in mind. On a dark canvas, colors that pass the 4.5:1 threshold can still cause halation — a blurring effect where bright text seems to glow on dark backgrounds, particularly difficult for users with astigmatism.\n\n## The Halation Problem\n\nPure white (#FFFFFF) on pure black (#000000) has a 21:1 contrast ratio — technically perfect, practically brutal. We found #E8E8E8 on #121212 reads significantly better for body text across user studies.\n\n## Focus Indicators\n\nIn dark mode, the default blue focus ring (#0866FF) often disappears against dark blue UI. Use a high-contrast outline — white or yellow — plus an offset of at least 2px so it doesn't merge with the element border.\n\n## Reduced Motion\n\nIf your dark mode switch triggers a full-page transition, wrap it in a @media (prefers-reduced-motion: no-preference) query. Some users enable dark mode specifically because flashing light triggers migraines.`,
    cover: COVERS[1].bg, coverColor: COVERS[1].bg,
    author: { name: 'Taylor Reeves', role: 'Design Lead' },
    likes: 218, comments: 31, date: 'Sep 15', tag: 'Design', readMin: 5,
  },
  {
    id: '3', title: 'The Psychology of Push Notifications',
    excerpt: 'Why the most effective notification strategy is often silence — and how to build opt-in flows that users actually trust.',
    body: `There is a direct correlation between notification frequency and uninstall rate. We measured it.\n\n## What the Data Says\n\nAfter analyzing cohort behavior across six months: users who received more than 4 notifications per day had a 3.2× higher 30-day churn rate than users who received 1–2. Beyond 8 per day the relationship inverts — it plateaus because only power users remain, and they've already tuned everything out.\n\n## Designing the Permission Prompt\n\nThe native OS prompt is a one-shot gamble. You only get one chance per install. We now show a warm-up screen before ever triggering the system dialog: explain what we'll send, show an example, give users a "not now" option that doesn't permanently close the door.\n\n## Opt-In Architecture\n\nWe moved from a single "allow notifications" toggle to per-category controls: direct messages, community mentions, product updates. Users who configure their own preferences have a 4× lower opt-out rate than those who accept or reject wholesale.`,
    cover: COVERS[2].bg, coverColor: COVERS[2].bg,
    author: { name: 'Alex Johnson', role: 'Product Manager' },
    likes: 189, comments: 22, date: 'Sep 12', tag: 'Product', readMin: 4,
  },
  {
    id: '4', title: 'Gradient Systems That Scale Across Products',
    excerpt: 'From a single blue-to-purple to a full token-based gradient system — how we made our brand feel cohesive at every touchpoint.',
    body: `Our first gradient was a happy accident — a designer dragged two swatches and it felt right. Two years later we had 47 one-off gradients littered across every product. Here's how we fixed it.\n\n## The Problem With Ad-Hoc Gradients\n\nEvery new screen was a blank canvas. Designers picked colors that "felt right in context" without reference to the system. Users encountered six different blues in six different apps all claiming to be MyChatApp.\n\n## Defining the Gradient Primitives\n\nWe established three base gradients: Brand (blue→purple), Success (teal→green), Warm (amber→red). Every gradient in the product derives from one of these — angle and opacity can vary, but the stop colors are fixed tokens.\n\n## Gradient Tokens in Practice\n\nInstead of hardcoding \`linear-gradient(135deg, #00B2FF, #B620E0)\` everywhere, we expose \`--gradient-brand\` as a CSS custom property. Animation and theming become trivial when the source of truth is one variable.\n\n## When Not to Use Gradients\n\nGradients draw attention. Reserve them for primary actions, empty states, and brand moments. A page full of gradients is a page without hierarchy.`,
    cover: COVERS[3].bg, coverColor: COVERS[3].bg,
    author: { name: 'Maria Garcia', role: 'Brand Designer' },
    likes: 156, comments: 19, date: 'Sep 9', tag: 'Design', readMin: 5,
  },
  {
    id: '5', title: 'Zero-Downtime Deployments at Scale',
    excerpt: 'Blue-green, canary, feature flags — a pragmatic guide to shipping without the 3am alert.',
    body: `Every deployment is a controlled risk. The goal is to make the blast radius as small as possible while moving as fast as possible.\n\n## Blue-Green Deployments\n\nRun two identical production environments. Route traffic to Blue while deploying to Green. Swap the load balancer pointer in seconds. Rollback is instant — just swap back.\n\nThe cost: you're maintaining double the infrastructure at all times. For stateless services this is fine. For databases with schema migrations, it's a different story.\n\n## Canary Releases\n\nRoute 1% of traffic to the new version. Watch error rates and latency. If the canary is healthy after 10 minutes, ramp to 10%, then 50%, then 100%. If something goes wrong, kill the canary — 99% of users never noticed.\n\n## Feature Flags Are Not Deployments\n\nDecoupling deployment from release is the single biggest leverage point in modern software delivery. Deploy code dark. Enable it for internal users, then beta testers, then everyone. The feature flag is the release; the deployment is just moving bytes.`,
    cover: COVERS[4].bg, coverColor: COVERS[4].bg,
    author: { name: 'Ben Carter', role: 'Infrastructure Lead' },
    likes: 134, comments: 15, date: 'Sep 6', tag: 'Engineering', readMin: 7,
  },
  {
    id: '6', title: 'Community Moderation at Human Scale',
    excerpt: 'How we built a trust-and-safety system that actually respects users while keeping bad actors out.',
    body: `Automated moderation catches the easy cases. The hard ones require judgment — and building systems that make that judgment possible at scale.\n\n## The Spectrum of Harm\n\nNot all policy violations are equal. A spam account is different from a threat. A heated argument is different from coordinated harassment. Your response system needs to reflect this spectrum or you'll burn out moderators with nuance-free tooling.\n\n## Reviewer Queues\n\nWe cluster reports by severity and route them to appropriately trained moderators. Spam and self-harm go to specialists. Borderline content goes to senior reviewers with access to conversation context. Nothing goes to a single reviewer without a second-opinion flag.\n\n## Appeals and Transparency\n\nEvery action generates a notice with the specific policy cited and a path to appeal. Users who understand *why* they were actioned are 3× more likely to change behavior than those who receive an opaque ban.`,
    cover: COVERS[5].bg, coverColor: COVERS[5].bg,
    author: { name: 'Sam Lee', role: 'Trust & Safety' },
    likes: 97, comments: 28, date: 'Sep 2', tag: 'Community', readMin: 6,
  },
]

const COMMENTS = [
  { id: 'c1', author: { name: 'Maria Garcia', role: 'Brand Designer' }, text: 'This is exactly the deep-dive I needed. The Redis pub/sub section especially — we\'ve been debating this for weeks.', time: '2h', likes: 14 },
  { id: 'c2', author: { name: 'Sam Lee', role: 'Trust & Safety' }, text: 'Great writeup! One thing I\'d add — connection state management on the client side is equally gnarly. Any plans to cover that?', time: '3h', likes: 7 },
  { id: 'c3', author: { name: 'Ben Carter', role: 'Infrastructure Lead' }, text: 'The thundering herd point is so real. We got hit by that during a deploy before we added jitter. Painful lesson 😅', time: '5h', likes: 22 },
]

// ─── Tiny shared components ───────────────────────────────────────

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: avatarColor(name),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, color: '#fff',
    }}>
      {name.split(' ').map(n => n[0]).join('').slice(0, 2)}
    </div>
  )
}

function Tag({ label }: { label: string }) {
  const tagColors: Record<string, { bg: string; color: string }> = {
    Engineering: { bg: 'rgba(8,102,255,0.08)', color: PRIMARY },
    Design:      { bg: 'rgba(182,32,224,0.08)', color: '#B620E0' },
    Product:     { bg: 'rgba(49,162,76,0.08)', color: '#31A24C' },
    Community:   { bg: 'rgba(247,185,40,0.1)', color: '#B68A00' },
  }
  const style = tagColors[label] ?? { bg: 'rgba(100,102,107,0.08)', color: MUTED }
  return (
    <span style={{ ...style, fontSize: 11, fontWeight: 600, borderRadius: 9999, padding: '3px 9px' }}>{label}</span>
  )
}

function Sk({ w, h, radius = 8, circle = false }: { w: number | string; h: number; radius?: number; circle?: boolean }) {
  return <div className="skeleton" style={{ width: w, height: h, borderRadius: circle ? '50%' : radius, flexShrink: 0 }} />
}

function LikeBtn({ count, active, onToggle, compact = false }: {
  count: number; active: boolean; onToggle: () => void; compact?: boolean
}) {
  return (
    <button onClick={onToggle} style={{
      display: 'flex', alignItems: 'center', gap: 6,
      background: active ? GRAD : 'transparent',
      border: `1.5px solid ${active ? 'transparent' : BORDER}`,
      borderRadius: 9999,
      padding: compact ? '6px 12px' : '8px 18px',
      cursor: 'pointer', fontFamily: 'inherit',
      fontSize: compact ? 12 : 14, fontWeight: 600,
      color: active ? '#fff' : MUTED,
      transition: 'all 0.18s',
      boxShadow: active ? '0 4px 14px rgba(8,102,255,0.22)' : 'none',
    }}>
      <svg width={compact ? 14 : 16} height={compact ? 14 : 16} viewBox="0 0 24 24" fill={active ? '#fff' : 'none'}>
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
          stroke={active ? '#fff' : MUTED} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {count}
    </button>
  )
}

// ─── Cover illustration ───────────────────────────────────────────
function CoverArt({ gradient, pattern, height = 220, radius = 16 }: {
  gradient: string; pattern: string; height?: number; radius?: number
}) {
  const r = radius
  const svgContent: Record<string, React.ReactNode> = {
    chat: (
      <g opacity="0.25">
        <rect x="20" y="30" width="120" height="70" rx="16" fill="white"/>
        <rect x="30" y="44" width="60" height="10" rx="5" fill="white" opacity="0.6"/>
        <rect x="30" y="60" width="90" height="10" rx="5" fill="white" opacity="0.4"/>
        <rect x="30" y="76" width="70" height="10" rx="5" fill="white" opacity="0.3"/>
        <path d="M20 100l8 16h8V100" fill="white"/>
        <rect x="100" y="90" width="100" height="60" rx="16" fill="white"/>
        <rect x="112" y="104" width="50" height="8" rx="4" fill="white" opacity="0.6"/>
        <rect x="112" y="118" width="76" height="8" rx="4" fill="white" opacity="0.4"/>
        <path d="M200 150l-8 16h-8V150" fill="white"/>
      </g>
    ),
    dots: (
      <g opacity="0.2">
        {Array.from({length:7}).map((_,r)=>
          Array.from({length:9}).map((_,c)=>(
            <circle key={`${r}-${c}`} cx={24+c*26} cy={24+r*22} r="5" fill="white"/>
          ))
        )}
      </g>
    ),
    wave: (
      <g opacity="0.2">
        <path d="M0 60 Q40 30 80 60 Q120 90 160 60 Q200 30 240 60 V160 H0Z" fill="white"/>
        <path d="M0 90 Q40 60 80 90 Q120 120 160 90 Q200 60 240 90 V160 H0Z" fill="white" opacity="0.5"/>
      </g>
    ),
    grid: (
      <g opacity="0.15" stroke="white" strokeWidth="1.5">
        {Array.from({length:6}).map((_,i)=><line key={`h${i}`} x1="0" y1={i*30} x2="280" y2={i*30}/>)}
        {Array.from({length:10}).map((_,i)=><line key={`v${i}`} x1={i*32} y1="0" x2={i*32} y2="160"/>)}
      </g>
    ),
    mesh: (
      <g opacity="0.18">
        <circle cx="60" cy="60" r="50" stroke="white" strokeWidth="1.5" fill="none"/>
        <circle cx="160" cy="40" r="70" stroke="white" strokeWidth="1.5" fill="none"/>
        <circle cx="220" cy="110" r="40" stroke="white" strokeWidth="1.5" fill="none"/>
        <circle cx="40" cy="120" r="35" stroke="white" strokeWidth="1.5" fill="none"/>
      </g>
    ),
    ring: (
      <g opacity="0.2">
        <circle cx="140" cy="80" r="90" stroke="white" strokeWidth="20" fill="none"/>
        <circle cx="140" cy="80" r="50" stroke="white" strokeWidth="12" fill="none"/>
        <circle cx="140" cy="80" r="15" fill="white"/>
      </g>
    ),
  }

  return (
    <div style={{ height, background: gradient, borderRadius: radius, overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
      <svg viewBox="0 0 280 160" preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        {svgContent[pattern] ?? null}
      </svg>
    </div>
  )
}

function coverForPost(post: Post) {
  const idx = parseInt(post.id) - 1
  return COVERS[idx % COVERS.length]
}

// ─── Post card ────────────────────────────────────────────────────
function PostCard({ post, onClick, compact = false }: { post: Post; onClick: () => void; compact?: boolean }) {
  const cover = coverForPost(post)
  const [liked, setLiked] = useState(false)

  return (
    <div
      onClick={onClick}
      style={{
        background: CARD, borderRadius: 20,
        border: `1px solid ${BORDER}`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        overflow: 'hidden', cursor: 'pointer',
        display: 'flex', flexDirection: 'column',
        transition: 'transform 0.18s, box-shadow 0.18s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 10px 32px rgba(0,0,0,0.1)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)' }}
    >
      <CoverArt gradient={cover.bg} pattern={cover.pattern} height={compact ? 140 : 180} radius={0} />

      <div style={{ padding: compact ? '14px 16px' : '18px 20px', display: 'flex', flexDirection: 'column', gap: compact ? 8 : 10, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Tag label={post.tag} />
          <span style={{ fontSize: 11, color: MUTED }}>{post.readMin} min read</span>
        </div>

        <h3 style={{
          fontSize: compact ? 15 : 17, fontWeight: 700, color: TEXT,
          lineHeight: 1.35, margin: 0,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{post.title}</h3>

        <p style={{
          fontSize: compact ? 13 : 14, color: MUTED, lineHeight: 1.55, margin: 0,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{post.excerpt}</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 'auto', paddingTop: 4 }}>
          <Avatar name={post.author.name} size={28} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.author.name}</div>
            <div style={{ fontSize: 11, color: MUTED }}>{post.date}</div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button onClick={e => { e.stopPropagation(); setLiked(l => !l) }} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: liked ? '#FA383E' : MUTED, padding: 0, fontFamily: 'inherit' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill={liked ? '#FA383E' : 'none'}>
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke={liked ? '#FA383E' : MUTED} strokeWidth="1.8"/>
              </svg>
              {post.likes + (liked ? 1 : 0)}
            </button>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: MUTED }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M21 15H7L3 21V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke={MUTED} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {post.comments}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Skeleton card ────────────────────────────────────────────────
function SkeletonCard({ compact = false }: { compact?: boolean }) {
  return (
    <div style={{ background: CARD, borderRadius: 20, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
      <Sk w="100%" h={compact ? 140 : 180} radius={0} />
      <div style={{ padding: compact ? '14px 16px' : '18px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Sk w={70} h={20} radius={9999} />
          <Sk w={50} h={12} />
        </div>
        <Sk w="88%" h={compact ? 14 : 16} />
        <Sk w="65%" h={compact ? 14 : 16} />
        <Sk w="100%" h={12} />
        <Sk w="80%" h={12} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
          <Sk w={28} h={28} circle />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Sk w={90} h={11} />
            <Sk w={50} h={10} />
          </div>
          <Sk w={48} h={16} />
        </div>
      </div>
    </div>
  )
}

// ─── Featured hero card ───────────────────────────────────────────
function HeroCard({ post, onClick }: { post: Post; onClick: () => void }) {
  const cover = coverForPost(post)
  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: 24, overflow: 'hidden', cursor: 'pointer', position: 'relative',
        boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
        transition: 'transform 0.18s, box-shadow 0.18s',
        height: 320,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 48px rgba(0,0,0,0.18)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.14)' }}
    >
      <div style={{ position: 'absolute', inset: 0, background: cover.bg }}>
        <svg viewBox="0 0 800 320" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <g opacity="0.18">
            <circle cx="200" cy="160" r="180" stroke="white" strokeWidth="40" fill="none"/>
            <circle cx="600" cy="100" r="240" stroke="white" strokeWidth="30" fill="none"/>
            <circle cx="700" cy="280" r="100" fill="white"/>
            <circle cx="100" cy="300" r="60" fill="white" opacity="0.5"/>
          </g>
        </svg>
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '28px 28px 24px' }}>
        <Tag label={post.tag} />
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: '10px 0 8px', lineHeight: 1.25, textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>{post.title}</h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', margin: '0 0 16px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.excerpt}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar name={post.author.name} size={30} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{post.author.name}</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>· {post.date} · {post.readMin} min read</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 14 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(255,255,255,0.7)"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="white" strokeWidth="1.5"/></svg>
              {post.likes}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 15H7L3 21V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {post.comments}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Filter bar ───────────────────────────────────────────────────
const FILTERS: { id: FilterKey; label: string }[] = [
  { id: 'latest',   label: 'Latest' },
  { id: 'liked',    label: 'Most Liked' },
  { id: 'trending', label: 'Trending' },
]

function FilterBar({ active, onChange, compact = false }: { active: FilterKey; onChange: (f: FilterKey) => void; compact?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: compact ? 6 : 8, alignItems: 'center', flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: 2 }}>
      {FILTERS.map(f => {
        const isActive = f.id === active
        return (
          <button key={f.id} onClick={() => onChange(f.id)}
            style={{
              background: isActive ? GRAD : CARD,
              color: isActive ? '#fff' : MUTED,
              border: `1.5px solid ${isActive ? 'transparent' : BORDER}`,
              borderRadius: 9999,
              padding: compact ? '6px 14px' : '8px 18px',
              fontSize: compact ? 12 : 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
              whiteSpace: 'nowrap', flexShrink: 0,
              boxShadow: isActive ? '0 4px 14px rgba(8,102,255,0.22)' : 'none',
              transition: 'all 0.15s',
            }}>
            {f.label}
          </button>
        )
      })}
    </div>
  )
}

// ─── Blog Feed screen ─────────────────────────────────────────────
function FeedScreen({ bp, feedState, onOpen, onCreate }: {
  bp: Breakpoint; feedState: FeedState;
  onOpen: (post: Post) => void; onCreate: () => void;
}) {
  const [filter, setFilter] = useState<FilterKey>('latest')
  const isMobile  = bp === 'mobile'
  const isTablet  = bp === 'tablet'
  const isDesktop = bp === 'desktop'

  const cols = isMobile ? 1 : isTablet ? 2 : 3
  const compact = isMobile || isTablet

  const sorted = [...POSTS].sort((a, b) =>
    filter === 'liked' ? b.likes - a.likes :
    filter === 'trending' ? b.comments - a.comments : 0
  )

  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: isMobile ? '12px 16px' : '14px 24px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <span style={{ fontSize: isMobile ? 18 : 20, fontWeight: 700, color: TEXT }}>Blog</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <FilterBar active={filter} onChange={setFilter} compact={isMobile} />
            {!isMobile && (
              <button onClick={onCreate}
                style={{ background: GRAD, color: '#fff', border: 'none', borderRadius: 9999, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 14px rgba(8,102,255,0.2)', whiteSpace: 'nowrap' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.2" strokeLinecap="round"/></svg>
                Write Post
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: isMobile ? '16px' : '24px', flex: 1 }}>

        {feedState === 'empty' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center' }}>
            <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(0,178,255,0.1), rgba(182,32,224,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="url(#eg2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <defs><linearGradient id="eg2" x1="2" y1="2" x2="22" y2="22"><stop stopColor="#00B2FF"/><stop offset="1" stopColor="#B620E0"/></linearGradient></defs>
              </svg>
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: TEXT, margin: '0 0 10px' }}>No posts yet</h3>
            <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.6, margin: '0 0 28px', maxWidth: 300 }}>Be the first to share something with the community. Your ideas belong here.</p>
            <button onClick={onCreate} style={{ background: GRAD, color: '#fff', border: 'none', borderRadius: 9999, padding: '12px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(8,102,255,0.25)' }}>
              Write the First Post
            </button>
          </div>
        )}

        {feedState === 'skeleton' && (
          <>
            {/* Hero skeleton */}
            <Sk w="100%" h={isDesktop ? 320 : isMobile ? 220 : 260} radius={24} />
            <div style={{ height: 24 }} />
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16 }}>
              {Array.from({ length: cols * 2 }).map((_, i) => <SkeletonCard key={i} compact={compact} />)}
            </div>
          </>
        )}

        {feedState === 'normal' && (
          <>
            {/* Featured hero (desktop only) */}
            {isDesktop && (
              <>
                <HeroCard post={sorted[0]} onClick={() => onOpen(sorted[0])} />
                <div style={{ height: 28 }} />
              </>
            )}

            {/* Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: isMobile ? 14 : 18 }}>
              {(isDesktop ? sorted.slice(1) : sorted).map(post => (
                <PostCard key={post.id} post={post} onClick={() => onOpen(post)} compact={compact} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Mobile FAB */}
      {isMobile && (
        <button onClick={onCreate} style={{
          position: 'sticky', bottom: 20, alignSelf: 'flex-end', marginRight: 20,
          width: 52, height: 52, borderRadius: '50%',
          background: GRAD, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 6px 20px rgba(8,102,255,0.35)',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.2" strokeLinecap="round"/></svg>
        </button>
      )}
    </div>
  )
}

// ─── Post Detail screen ───────────────────────────────────────────
function PostDetail({ post, onBack, compact = false }: { post: Post; onBack: () => void; compact?: boolean }) {
  const [liked, setLiked] = useState(false)
  const [commentText, setCommentText] = useState('')
  const cover = coverForPost(post)

  const bodyParagraphs = post.body.split('\n\n')

  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', background: BG }}>
      {/* Back bar */}
      <div style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: compact ? '10px 16px' : '12px 24px', position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onBack} style={{ background: BG, border: `1.5px solid ${BORDER}`, borderRadius: 9999, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: TEXT }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <span style={{ fontSize: 14, fontWeight: 600, color: TEXT, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title}</span>
        <Tag label={post.tag} />
      </div>

      <div style={{ maxWidth: compact ? '100%' : 720, margin: '0 auto', width: '100%', padding: compact ? '0 0 40px' : '0 0 60px' }}>
        {/* Cover */}
        <CoverArt gradient={cover.bg} pattern={cover.pattern} height={compact ? 200 : 320} radius={compact ? 0 : 0} />

        <div style={{ padding: compact ? '20px 16px' : '32px 0' }}>
          {/* Title */}
          <h1 style={{ fontSize: compact ? 22 : 32, fontWeight: 800, color: TEXT, lineHeight: 1.2, margin: '0 0 16px', letterSpacing: -0.5 }}>{post.title}</h1>

          {/* Author row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${BORDER}` }}>
            <Avatar name={post.author.name} size={44} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: TEXT }}>{post.author.name}</div>
              <div style={{ fontSize: 13, color: MUTED }}>{post.author.role} · {post.date} · {post.readMin} min read</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <LikeBtn count={post.likes + (liked ? 1 : 0)} active={liked} onToggle={() => setLiked(l => !l)} compact={compact} />
            </div>
          </div>

          {/* Excerpt */}
          <p style={{ fontSize: compact ? 16 : 19, color: MUTED, fontStyle: 'italic', lineHeight: 1.65, margin: '0 0 24px', borderLeft: `3px solid transparent`, borderImage: `${GRAD} 1`, paddingLeft: 16 }}>{post.excerpt}</p>

          {/* Body */}
          <div style={{ fontSize: compact ? 15 : 16, color: TEXT, lineHeight: 1.75, display: 'flex', flexDirection: 'column', gap: 18 }}>
            {bodyParagraphs.map((para, i) => {
              if (para.startsWith('## ')) {
                return <h2 key={i} style={{ fontSize: compact ? 18 : 22, fontWeight: 700, color: TEXT, margin: '8px 0 0', lineHeight: 1.3 }}>{para.replace('## ', '')}</h2>
              }
              return <p key={i} style={{ margin: 0 }}>{para}</p>
            })}
          </div>

          {/* Bottom like + share */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 36, padding: '20px 0', borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
            <LikeBtn count={post.likes + (liked ? 1 : 0)} active={liked} onToggle={() => setLiked(l => !l)} compact={compact} />
            <span style={{ fontSize: 13, color: MUTED }}>{post.comments} comments</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              {['Twitter', 'Copy link'].map(a => (
                <button key={a} style={{ background: BG, border: `1.5px solid ${BORDER}`, borderRadius: 9999, padding: '7px 14px', fontSize: 12, fontWeight: 600, color: MUTED, cursor: 'pointer', fontFamily: 'inherit' }}>{a}</button>
              ))}
            </div>
          </div>

          {/* Comments */}
          <div style={{ marginTop: 32 }}>
            <h3 style={{ fontSize: compact ? 17 : 19, fontWeight: 700, color: TEXT, marginBottom: 20 }}>Comments ({post.comments})</h3>

            {/* Comment input */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'flex-start' }}>
              <Avatar name="Taylor Reeves" size={36} />
              <div style={{ flex: 1 }}>
                <textarea
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Share your thoughts…"
                  rows={3}
                  style={{
                    width: '100%', border: `1.5px solid ${commentText ? PRIMARY : BORDER}`,
                    borderRadius: 12, padding: '10px 14px',
                    fontSize: 14, color: TEXT, background: CARD,
                    outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: 1.5,
                    boxShadow: commentText ? '0 0 0 3px rgba(8,102,255,0.12)' : 'none',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                    boxSizing: 'border-box',
                  }}
                />
                {commentText && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                    <button onClick={() => setCommentText('')}
                      style={{ background: GRAD, color: '#fff', border: 'none', borderRadius: 9999, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      Post Comment
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Comment list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {COMMENTS.map(c => (
                <div key={c.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <Avatar name={c.author.name} size={36} />
                  <div style={{ flex: 1 }}>
                    <div style={{ background: CARD, borderRadius: 16, padding: '12px 16px', border: `1px solid ${BORDER}` }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{c.author.name}</span>
                        <span style={{ fontSize: 12, color: MUTED }}>{c.author.role}</span>
                      </div>
                      <p style={{ fontSize: 14, color: TEXT, lineHeight: 1.55, margin: 0 }}>{c.text}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 14, marginTop: 6, paddingLeft: 4 }}>
                      <span style={{ fontSize: 12, color: MUTED }}>{c.time} ago</span>
                      <button style={{ background: 'none', border: 'none', fontSize: 12, color: MUTED, cursor: 'pointer', fontFamily: 'inherit', padding: 0, fontWeight: 600 }}>Like ({c.likes})</button>
                      <button style={{ background: 'none', border: 'none', fontSize: 12, color: MUTED, cursor: 'pointer', fontFamily: 'inherit', padding: 0, fontWeight: 600 }}>Reply</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Rich text toolbar ────────────────────────────────────────────
function RichToolbar() {
  const [bold, setBold] = useState(false)
  const [italic, setItalic] = useState(false)
  const tools = [
    { label: 'B', style: { fontWeight: 800 }, active: bold, onToggle: () => setBold(b => !b) },
    { label: 'I', style: { fontStyle: 'italic' }, active: italic, onToggle: () => setItalic(i => !i) },
  ]
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '8px 12px', borderBottom: `1px solid ${BORDER}`, background: BG, flexWrap: 'wrap' }}>
      {tools.map(t => (
        <button key={t.label} onClick={t.onToggle}
          style={{
            background: t.active ? 'rgba(8,102,255,0.1)' : 'transparent',
            color: t.active ? PRIMARY : MUTED,
            border: `1px solid ${t.active ? 'rgba(8,102,255,0.25)' : 'transparent'}`,
            borderRadius: 6, width: 32, height: 30,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontFamily: 'inherit', fontSize: 14,
            ...t.style,
          }}>
          {t.label}
        </button>
      ))}
      {/* Link */}
      <button style={{ background: 'transparent', color: MUTED, border: '1px solid transparent', borderRadius: 6, width: 32, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
      </button>
      <div style={{ width: 1, height: 20, background: BORDER, margin: '0 4px' }} />
      {/* Heading */}
      <button style={{ background: 'transparent', color: MUTED, border: '1px solid transparent', borderRadius: 6, padding: '0 8px', height: 30, display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>H2</button>
      <button style={{ background: 'transparent', color: MUTED, border: '1px solid transparent', borderRadius: 6, padding: '0 8px', height: 30, display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>H3</button>
      <div style={{ width: 1, height: 20, background: BORDER, margin: '0 4px' }} />
      {/* Lists */}
      <button style={{ background: 'transparent', color: MUTED, border: '1px solid transparent', borderRadius: 6, width: 32, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
      </button>
      <button style={{ background: 'transparent', color: MUTED, border: '1px solid transparent', borderRadius: 6, width: 32, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M8 6h13M8 12h13M8 18h13M3 6l2 2-2 2M3 12l2 2-2 2M3 18l2 2-2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      <div style={{ width: 1, height: 20, background: BORDER, margin: '0 4px' }} />
      {/* Image */}
      <button style={{ background: 'transparent', color: MUTED, border: '1px solid transparent', borderRadius: 6, width: 32, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.8"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: MUTED }}>Auto-saved</span>
        <span style={{ fontSize: 11, color: '#31A24C', fontWeight: 600 }}>✓</span>
      </div>
    </div>
  )
}

// ─── Create Post screen ───────────────────────────────────────────
function CreatePostScreen({ onClose, onPublish, compact = false, isModal = false }: {
  onClose: () => void; onPublish: () => void; compact?: boolean; isModal?: boolean
}) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [coverIdx, setCoverIdx] = useState(0)
  const [coverHovered, setCoverHovered] = useState(false)
  const [selectedTag, setSelectedTag] = useState('Engineering')
  const cover = COVERS[coverIdx]
  const canPublish = title.trim().length > 0

  const TAGS = ['Engineering', 'Design', 'Product', 'Community']

  const inner = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: compact ? '12px 16px' : '14px 24px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 10, background: CARD, flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: BG, border: `1.5px solid ${BORDER}`, borderRadius: 9999, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: TEXT }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </button>
        <span style={{ fontSize: 16, fontWeight: 700, color: TEXT, flex: 1 }}>New Post</span>
        <button style={{ background: BG, color: MUTED, border: `1.5px solid ${BORDER}`, borderRadius: 9999, padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Save Draft</button>
        <button onClick={onPublish} disabled={!canPublish}
          style={{
            background: canPublish ? GRAD : BG,
            color: canPublish ? '#fff' : MUTED,
            border: `1.5px solid ${canPublish ? 'transparent' : BORDER}`,
            borderRadius: 9999, padding: '7px 20px', fontSize: 13, fontWeight: 600,
            cursor: canPublish ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
            boxShadow: canPublish ? '0 4px 14px rgba(8,102,255,0.22)' : 'none',
            transition: 'all 0.15s',
          }}>
          Publish →
        </button>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: compact ? '16px 16px' : '24px 24px' }}>
        {/* Cover image upload */}
        <div
          onMouseEnter={() => setCoverHovered(true)}
          onMouseLeave={() => setCoverHovered(false)}
          style={{ marginBottom: 20, borderRadius: 16, overflow: 'hidden', position: 'relative', cursor: 'pointer', height: compact ? 160 : 220 }}>
          <div style={{ position: 'absolute', inset: 0, background: cover.bg }}>
            <svg viewBox="0 0 280 160" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
              <g opacity="0.18"><circle cx="200" cy="80" r="160" stroke="white" strokeWidth="40" fill="none"/><circle cx="40" cy="140" r="80" fill="white" opacity="0.3"/></g>
            </svg>
          </div>
          <div style={{ position: 'absolute', inset: 0, background: coverHovered ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s', gap: 12 }}>
            {coverHovered ? (
              <>
                <button onClick={() => setCoverIdx(i => (i + 1) % COVERS.length)} style={{ background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: 9999, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: TEXT }}>Next gradient</button>
                <button style={{ background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: 9999, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: TEXT }}>Upload photo</button>
              </>
            ) : (
              <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 9999, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="white" strokeWidth="1.8"/><circle cx="8.5" cy="8.5" r="1.5" fill="white"/><path d="M21 15l-5-5L5 21" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>
                <span style={{ fontSize: 12, color: '#fff', fontWeight: 500 }}>Cover image</span>
              </div>
            )}
          </div>
        </div>

        {/* Tag picker */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {TAGS.map(t => (
            <button key={t} onClick={() => setSelectedTag(t)}
              style={{ background: selectedTag === t ? GRAD : BG, color: selectedTag === t ? '#fff' : MUTED, border: `1.5px solid ${selectedTag === t ? 'transparent' : BORDER}`, borderRadius: 9999, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
              {t}
            </button>
          ))}
        </div>

        {/* Title */}
        <textarea
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Post title…"
          rows={2}
          style={{
            width: '100%', border: 'none', outline: 'none', resize: 'none',
            fontSize: compact ? 22 : 28, fontWeight: 800, color: TEXT,
            lineHeight: 1.25, fontFamily: 'inherit', background: 'transparent',
            marginBottom: 16, padding: 0, boxSizing: 'border-box',
          }}
        />

        {/* Rich text editor */}
        <div style={{ background: CARD, border: `1.5px solid ${BORDER}`, borderRadius: 16, overflow: 'hidden' }}>
          <RichToolbar />
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Write your story…&#10;&#10;Use ## for headings, and the toolbar above for formatting."
            rows={compact ? 12 : 18}
            style={{
              width: '100%', border: 'none', outline: 'none', resize: 'none',
              fontSize: 15, color: TEXT, lineHeight: 1.75,
              fontFamily: 'inherit', background: 'transparent',
              padding: '16px 16px', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Publish strip */}
        <div style={{ marginTop: 20, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: compact ? '14px 16px' : '16px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>Ready to share?</div>
            <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>Your post will be visible to all community members.</div>
          </div>
          <button onClick={onPublish} disabled={!canPublish}
            style={{
              background: canPublish ? GRAD : BG,
              color: canPublish ? '#fff' : MUTED,
              border: `1.5px solid ${canPublish ? 'transparent' : BORDER}`,
              borderRadius: 9999, padding: '11px 28px',
              fontSize: 14, fontWeight: 600, cursor: canPublish ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit',
              boxShadow: canPublish ? '0 6px 18px rgba(8,102,255,0.25)' : 'none',
              whiteSpace: 'nowrap',
            }}>
            Publish Post
          </button>
        </div>
      </div>
    </div>
  )

  if (isModal) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(3px)', padding: 24 }}>
        <div style={{ background: CARD, borderRadius: 24, width: '100%', maxWidth: 680, maxHeight: '88vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}>
          {inner}
        </div>
      </div>
    )
  }
  return <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>{inner}</div>
}

// ─── Published toast ──────────────────────────────────────────────
function PublishedToast({ onDismiss }: { onDismiss: () => void }) {
  useEffect(() => { const t = setTimeout(onDismiss, 3000); return () => clearTimeout(t) }, [onDismiss])
  return (
    <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 300, animation: 'slideIn 0.25s ease-out' }}>
      <div style={{ background: CARD, borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.16)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, borderLeft: '4px solid #31A24C', minWidth: 280 }}>
        <span style={{ width: 28, height: 28, borderRadius: '50%', background: '#31A24C', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>✓</span>
        <span style={{ fontSize: 14, color: TEXT, fontWeight: 600 }}>Post published successfully!</span>
      </div>
    </div>
  )
}

// ─── Device frame ─────────────────────────────────────────────────
function DeviceFrame({ bp, children }: { bp: Breakpoint; children: React.ReactNode }) {
  const C = { mobile: { w: 390, h: 780, scale: 0.78, r: 44, chrome: false }, tablet: { w: 834, h: 680, scale: 0.7, r: 12, chrome: true }, desktop: { w: 1280, h: 680, scale: 0.63, r: 10, chrome: true } }[bp]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {C.chrome && (
        <div style={{ width: C.w * C.scale, background: '#E0E2E6', borderRadius: `${C.r}px ${C.r}px 0 0`, padding: '9px 14px 8px', display: 'flex', alignItems: 'center', gap: 6, border: '1.5px solid #CCC', borderBottom: 'none' }}>
          {['#FA383E','#F7B928','#31A24C'].map((c,i) => <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
          <div style={{ flex: 1, background: '#fff', borderRadius: 6, height: 22, display: 'flex', alignItems: 'center', paddingLeft: 10, fontSize: 11, color: MUTED, marginLeft: 8 }}>mychatapp.io/blog</div>
        </div>
      )}
      <div style={{ width: C.w * C.scale, height: C.h * C.scale, border: bp === 'mobile' ? '8px solid #1A1A1A' : '1.5px solid #CCC', borderTop: bp === 'mobile' ? '8px solid #1A1A1A' : C.chrome ? 'none' : '1.5px solid #CCC', borderRadius: bp === 'mobile' ? C.r : C.chrome ? `0 0 ${C.r}px ${C.r}px` : C.r, overflow: 'hidden', boxShadow: bp === 'mobile' ? '0 24px 64px rgba(0,0,0,0.26), inset 0 0 0 1px rgba(255,255,255,0.06)' : '0 8px 32px rgba(0,0,0,0.14)', background: BG, position: 'relative' }}>
        {bp === 'mobile' && <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 90, height: 22, background: '#1A1A1A', borderRadius: '0 0 14px 14px', zIndex: 20 }} />}
        <div style={{ width: C.w, height: C.h, transform: `scale(${C.scale})`, transformOrigin: 'top left', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {bp === 'mobile' && <div style={{ height: 36, flexShrink: 0, background: CARD, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', fontSize: 12, fontWeight: 600 }}><span>9:41</span><span style={{ letterSpacing: 2 }}>●●●</span></div>}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>{children}</div>
        </div>
      </div>
      {bp === 'mobile' && <div style={{ width: 100, height: 4, borderRadius: 2, background: '#1A1A1A', opacity: 0.4, marginTop: 6 }} />}
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────
export default function BlogFeed() {
  const [bp, setBp] = useState<Breakpoint>('desktop')
  const [feedState, setFeedState] = useState<FeedState>('normal')
  const [activeView, setActiveView] = useState<ActiveView>('feed')
  const [selectedPost, setSelectedPost] = useState<Post | null>(POSTS[0])
  const [showCreate, setShowCreate] = useState(false)
  const [showToast, setShowToast] = useState(false)

  const isMobile  = bp === 'mobile'
  const isDesktop = bp === 'desktop'

  const handleOpen = (post: Post) => { setSelectedPost(post); setActiveView('detail') }
  const handleBack = () => setActiveView('feed')
  const handleCreate = () => {
    if (isDesktop) { setShowCreate(true) }
    else { setActiveView('create') }
  }
  const handlePublish = () => {
    setShowCreate(false)
    setActiveView('feed')
    setShowToast(true)
  }

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: BG, minHeight: '100vh' }}>
      {/* Hero controls */}
      <div style={{ background: GRAD, padding: '20px 40px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>Blog & Feed</h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: '3px 0 0' }}>Feed · Post Detail · Create Post · 3 breakpoints</p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Breakpoint */}
            <div style={{ display: 'flex', gap: 3, background: 'rgba(255,255,255,0.15)', borderRadius: 9999, padding: 4 }}>
              {(['mobile','tablet','desktop'] as Breakpoint[]).map(b => (
                <button key={b} onClick={() => setBp(b)}
                  style={{ background: bp === b ? '#fff' : 'transparent', color: bp === b ? '#0866FF' : 'rgba(255,255,255,0.85)', border: 'none', borderRadius: 9999, padding: '5px 14px', fontSize: 13, fontWeight: bp === b ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize', transition: 'all 0.15s' }}>
                  {b}
                </button>
              ))}
            </div>
            {/* Feed state */}
            <div style={{ display: 'flex', gap: 3, background: 'rgba(255,255,255,0.15)', borderRadius: 9999, padding: 4 }}>
              {([{id:'normal',l:'Normal'},{id:'skeleton',l:'Loading'},{id:'empty',l:'Empty'}] as {id:FeedState;l:string}[]).map(s => (
                <button key={s.id} onClick={() => { setFeedState(s.id); setActiveView('feed') }}
                  style={{ background: feedState === s.id ? '#fff' : 'transparent', color: feedState === s.id ? '#0866FF' : 'rgba(255,255,255,0.85)', border: 'none', borderRadius: 9999, padding: '5px 12px', fontSize: 13, fontWeight: feedState === s.id ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                  {s.l}
                </button>
              ))}
            </div>
            {/* Screen */}
            <div style={{ display: 'flex', gap: 3, background: 'rgba(255,255,255,0.15)', borderRadius: 9999, padding: 4 }}>
              {([{id:'feed',l:'Feed'},{id:'detail',l:'Post Detail'},{id:'create',l:'Create'}] as {id:ActiveView;l:string}[]).map(s => (
                <button key={s.id} onClick={() => { setActiveView(s.id); if (s.id === 'create' && isDesktop) { setShowCreate(true); setActiveView('feed') } }}
                  style={{ background: activeView === s.id ? '#fff' : 'transparent', color: activeView === s.id ? '#0866FF' : 'rgba(255,255,255,0.85)', border: 'none', borderRadius: 9999, padding: '5px 12px', fontSize: 13, fontWeight: activeView === s.id ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                  {s.l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Frame */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '40px 40px 80px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <DeviceFrame bp={bp}>
          {/* Desktop modal overlay */}
          {showCreate && isDesktop && (
            <CreatePostScreen
              onClose={() => setShowCreate(false)}
              onPublish={handlePublish}
              compact={false}
              isModal
            />
          )}

          {activeView === 'feed' && (
            <FeedScreen bp={bp} feedState={feedState} onOpen={handleOpen} onCreate={handleCreate} />
          )}
          {activeView === 'detail' && selectedPost && (
            <PostDetail post={selectedPost} onBack={handleBack} compact={isMobile || bp === 'tablet'} />
          )}
          {activeView === 'create' && !isDesktop && (
            <CreatePostScreen onClose={handleBack} onPublish={handlePublish} compact={isMobile} />
          )}
        </DeviceFrame>

        <p style={{ fontSize: 13, color: MUTED, textAlign: 'center' }}>
          {({ mobile: '390px — Mobile', tablet: '834px — Tablet', desktop: '1440px — Desktop' }[bp])} — use the controls above to switch screens and states
        </p>
      </div>

      {showToast && <PublishedToast onDismiss={() => setShowToast(false)} />}
    </div>
  )
}
