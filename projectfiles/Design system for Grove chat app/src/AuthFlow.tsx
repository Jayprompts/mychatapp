import { useState, useRef } from 'react'

// ─── Shared primitives ────────────────────────────────────────────

type Breakpoint = 'mobile' | 'tablet' | 'desktop'
type Screen = 'welcome' | 'login' | 'register' | 'forgot' | 'forgot-sent' | 'email-verify' | 'profile-setup'
type FormState = 'empty' | 'filled' | 'error'

const BP_WIDTHS: Record<Breakpoint, number> = { mobile: 390, tablet: 834, desktop: 1440 }
const BP_LABELS: Record<Breakpoint, string> = { mobile: '390px — Mobile', tablet: '834px — Tablet', desktop: '1440px — Desktop' }

const EyeIcon = ({ open }: { open: boolean }) => open
  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#65676B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" stroke="#65676B" strokeWidth="1.8"/></svg>
  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" stroke="#65676B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
)

const GithubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#050505"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
)

const CheckCircleIcon = () => (
  <svg width="56" height="56" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" stroke="url(#cg)" strokeWidth="1.5"/><path d="M7.5 12l3 3 6-6" stroke="url(#cg2)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><defs><linearGradient id="cg" x1="1" y1="1" x2="23" y2="23"><stop stopColor="#00B2FF"/><stop offset="1" stopColor="#B620E0"/></linearGradient><linearGradient id="cg2" x1="7" y1="9" x2="17" y2="15"><stop stopColor="#00B2FF"/><stop offset="1" stopColor="#B620E0"/></linearGradient></defs></svg>
)

const LogoMark = ({ size = 40 }: { size?: number }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.28, background: 'linear-gradient(135deg, #00B2FF 0%, #B620E0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(8,102,255,0.3)', flexShrink: 0 }}>
    <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
      <path d="M21 15C21 15.53 20.79 16.04 20.41 16.41C20.04 16.79 19.53 17 19 17H7L3 21V5C3 4.47 3.21 3.96 3.59 3.59C3.96 3.21 4.47 3 5 3H19C19.53 3 20.04 3.21 20.41 3.59C20.79 3.96 21 4.47 21 5V15Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </div>
)

const GradientText = ({ children, size, weight = 700 }: { children: string; size: number; weight?: number }) => (
  <span style={{ fontSize: size, fontWeight: weight, background: 'linear-gradient(135deg, #00B2FF, #B620E0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{children}</span>
)

// ─── Input component ──────────────────────────────────────────────
interface InputProps {
  label: string
  type?: string
  value?: string
  placeholder?: string
  error?: string
  success?: boolean
  hint?: string
  showToggle?: boolean
  showPassword?: boolean
  onTogglePassword?: () => void
}

function Field({ label, type = 'text', value = '', placeholder = '', error, success, hint, showToggle, showPassword, onTogglePassword }: InputProps) {
  const borderColor = error ? '#FA383E' : success ? '#31A24C' : value ? '#0866FF' : '#E4E6EB'
  const shadow = error
    ? '0 0 0 3px rgba(250,56,62,0.12)'
    : success
    ? '0 0 0 3px rgba(49,162,76,0.12)'
    : value
    ? '0 0 0 3px rgba(8,102,255,0.13)'
    : 'none'

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: error ? '#FA383E' : '#65676B', display: 'block', marginBottom: 6 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={showToggle ? (showPassword ? 'text' : 'password') : type}
          defaultValue={value}
          placeholder={placeholder}
          readOnly
          style={{
            width: '100%',
            border: `1.5px solid ${borderColor}`,
            borderRadius: 12,
            padding: showToggle ? '12px 44px 12px 16px' : '12px 16px',
            fontSize: 15,
            color: value ? '#050505' : '#A0A2A9',
            background: '#fff',
            outline: 'none',
            boxShadow: shadow,
            fontFamily: 'inherit',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
        />
        {showToggle && (
          <button
            onClick={onTogglePassword}
            style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
            <EyeIcon open={!!showPassword} />
          </button>
        )}
        {success && !showToggle && (
          <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#31A24C', fontSize: 16 }}>✓</span>
        )}
      </div>
      {error && <p style={{ fontSize: 12, color: '#FA383E', marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}><span>⚠</span>{error}</p>}
      {hint && !error && <p style={{ fontSize: 12, color: '#65676B', marginTop: 5 }}>{hint}</p>}
    </div>
  )
}

// ─── Button ───────────────────────────────────────────────────────
function GradientBtn({ label, fullWidth = true, size = 'md' }: { label: string; fullWidth?: boolean; size?: 'sm' | 'md' | 'lg' }) {
  const py = size === 'lg' ? 14 : size === 'sm' ? 8 : 12
  return (
    <button style={{ width: fullWidth ? '100%' : 'auto', background: 'linear-gradient(135deg, #00B2FF, #B620E0)', color: '#fff', border: 'none', borderRadius: 9999, padding: `${py}px 24px`, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(8,102,255,0.25)', transition: 'opacity 0.15s, transform 0.1s' }}>
      {label}
    </button>
  )
}

function OutlineBtn({ label, icon, fullWidth = true }: { label: string; icon?: React.ReactNode; fullWidth?: boolean }) {
  return (
    <button style={{ width: fullWidth ? '100%' : 'auto', background: '#fff', color: '#050505', border: '1.5px solid #E4E6EB', borderRadius: 9999, padding: '11px 20px', fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'background 0.15s, border-color 0.15s' }}>
      {icon}{label}
    </button>
  )
}

function Divider({ label = 'or' }: { label?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
      <div style={{ flex: 1, height: 1, background: '#E4E6EB' }} />
      <span style={{ fontSize: 13, color: '#65676B', fontWeight: 500 }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: '#E4E6EB' }} />
    </div>
  )
}

// ─── Branded left panel (desktop split) ──────────────────────────
function BrandPanel() {
  return (
    <div style={{ flex: 1, background: 'linear-gradient(145deg, #00B2FF 0%, #6B40F0 50%, #B620E0 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60, position: 'relative', overflow: 'hidden' }}>
      {/* Decorative circles */}
      <div style={{ position: 'absolute', top: -80, left: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
      <div style={{ position: 'absolute', bottom: -60, right: -60, width: 260, height: 260, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
      <div style={{ position: 'absolute', top: '40%', right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

      {/* Floating chat bubbles illustration */}
      <div style={{ marginBottom: 48, position: 'relative', width: 240, height: 200 }}>
        {/* Central phone-like frame */}
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 140, height: 160, background: 'rgba(255,255,255,0.12)', borderRadius: 24, border: '1.5px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
          <div style={{ padding: '12px 12px 8px' }}>
            {/* Mini chat bubbles */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 10, alignItems: 'flex-end' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
              <div style={{ background: 'rgba(255,255,255,0.25)', borderRadius: '12px 12px 12px 3px', padding: '7px 10px', fontSize: 10, color: 'rgba(255,255,255,0.9)', maxWidth: 80 }}>Hey! 👋</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
              <div style={{ background: 'rgba(255,255,255,0.35)', borderRadius: '12px 12px 3px 12px', padding: '7px 10px', fontSize: 10, color: '#fff', maxWidth: 88 }}>Hey! How are you?</div>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', marginBottom: 10 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
              <div style={{ background: 'rgba(255,255,255,0.25)', borderRadius: '12px 12px 12px 3px', padding: '7px 10px', fontSize: 10, color: 'rgba(255,255,255,0.9)' }}>Great! 🎉</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ background: 'rgba(255,255,255,0.35)', borderRadius: '12px 12px 3px 12px', padding: '7px 10px', fontSize: 10, color: '#fff' }}>Same! 😊</div>
            </div>
          </div>
        </div>
        {/* Floating avatars */}
        {[
          { top: 0, left: 10, initials: 'AJ', color: 'rgba(255,255,255,0.3)', size: 36 },
          { top: 20, right: 10, initials: 'MG', color: 'rgba(255,255,255,0.25)', size: 32 },
          { bottom: 10, left: 20, initials: 'BC', color: 'rgba(255,255,255,0.2)', size: 28 },
        ].map((a, i) => (
          <div key={i} style={{ position: 'absolute', top: a.top, left: a.left, right: a.right, bottom: a.bottom, width: a.size, height: a.size, borderRadius: '50%', background: a.color, border: '2px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: a.size * 0.32, fontWeight: 600, color: '#fff' }}>{a.initials}</div>
        ))}
        {/* Notification badge */}
        <div style={{ position: 'absolute', top: 16, right: 16, background: '#FA383E', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.4)' }}>3</div>
      </div>

      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', marginBottom: 16 }}>
          <LogoMark size={44} />
          <span style={{ fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: -0.5 }}>MyChatApp</span>
        </div>
        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.85)', maxWidth: 300, lineHeight: 1.5, margin: '0 auto 32px' }}>Connect with the people who matter most</p>

        {/* Social proof dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
          <div style={{ display: 'flex' }}>
            {['AJ', 'MG', 'BC', 'TR'].map((i, idx) => (
              <div key={i} style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.3)', border: '2px solid rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: '#fff', marginLeft: idx === 0 ? 0 : -8 }}>{i}</div>
            ))}
          </div>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>+2.4M people chatting</span>
        </div>
      </div>
    </div>
  )
}

// ─── Screen implementations ───────────────────────────────────────

function WelcomeScreen({ bp, formState }: { bp: Breakpoint; formState: FormState }) {
  const isDesktop = bp === 'desktop'
  const isMobile = bp === 'mobile'

  const Form = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: isMobile ? '0 0 100px' : '0' }}>
      {!isDesktop && (
        <div style={{ marginBottom: 32 }}>
          <LogoMark size={isMobile ? 72 : 80} />
        </div>
      )}
      <GradientText size={isMobile ? 32 : 36}>MyChatApp</GradientText>
      <p style={{ fontSize: isMobile ? 16 : 17, color: '#65676B', marginTop: 12, marginBottom: isMobile ? 48 : 40, lineHeight: 1.55, maxWidth: 320 }}>
        Connect, share, and chat with the people who matter most to you.
      </p>

      {/* Illustration / feature highlights */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 40, justifyContent: 'center', flexWrap: 'wrap' }}>
        {[
          { icon: '💬', label: 'Real-time chat' },
          { icon: '👥', label: 'Group spaces' },
          { icon: '🔒', label: 'End-to-end encrypted' },
        ].map(f => (
          <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F7F8FA', borderRadius: 9999, padding: '8px 14px', fontSize: 13, color: '#65676B', fontWeight: 500 }}>
            <span>{f.icon}</span>{f.label}
          </div>
        ))}
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <GradientBtn label="Create Account" size="lg" />
        <button style={{ width: '100%', background: 'rgba(8,102,255,0.06)', color: '#0866FF', border: '1.5px solid rgba(8,102,255,0.2)', borderRadius: 9999, padding: '14px 24px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          Log In
        </button>
      </div>

      <p style={{ fontSize: 12, color: '#A0A2A9', marginTop: 24, lineHeight: 1.6 }}>
        By continuing, you agree to our{' '}
        <span style={{ color: '#0866FF', cursor: 'pointer' }}>Terms of Service</span>
        {' '}and{' '}
        <span style={{ color: '#0866FF', cursor: 'pointer' }}>Privacy Policy</span>
      </p>
    </div>
  )

  if (isDesktop) {
    return (
      <div style={{ display: 'flex', height: '100%' }}>
        <BrandPanel />
        <div style={{ flex: '0 0 520px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, background: '#F7F8FA' }}>
          <div style={{ width: '100%', maxWidth: 380 }}>
            <div style={{ marginBottom: 40, display: 'flex', alignItems: 'center', gap: 10 }}>
              <LogoMark size={40} />
              <GradientText size={22}>MyChatApp</GradientText>
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: '#050505', marginBottom: 12, letterSpacing: -0.5 }}>Welcome back</h1>
            <p style={{ fontSize: 16, color: '#65676B', marginBottom: 40, lineHeight: 1.5 }}>Chat with the people who matter most — join millions already connected.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <GradientBtn label="Create Account" size="lg" />
              <button style={{ width: '100%', background: '#fff', color: '#0866FF', border: '1.5px solid #E4E6EB', borderRadius: 9999, padding: '14px 24px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Log In</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (bp === 'tablet') {
    return (
      <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, background: '#F7F8FA' }}>
        {/* Gradient top band */}
        <div style={{ width: '100%', maxWidth: 480, height: 6, borderRadius: '9999px 9999px 0 0', background: 'linear-gradient(135deg, #00B2FF, #B620E0)' }} />
        <div style={{ background: '#fff', borderRadius: '0 0 20px 20px', boxShadow: '0 8px 40px rgba(0,0,0,0.1)', padding: 48, width: '100%', maxWidth: 480 }}>
          <Form />
        </div>
      </div>
    )
  }

  // Mobile
  return (
    <div style={{ minHeight: '100%', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* Gradient hero */}
      <div style={{ height: 280, background: 'linear-gradient(145deg, #00B2FF, #6B40F0, #B620E0)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ position: 'absolute', bottom: -20, left: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <LogoMark size={72} />
        </div>
      </div>
      {/* Rounded top content */}
      <div style={{ flex: 1, background: '#fff', borderRadius: '24px 24px 0 0', marginTop: -24, padding: '32px 24px', position: 'relative', zIndex: 1 }}>
        <Form />
      </div>
      {/* Fixed bottom CTA on mobile */}
      <div style={{ position: 'sticky', bottom: 0, background: '#fff', padding: '12px 24px 28px', borderTop: '1px solid #F0F2F5' }}>
        <GradientBtn label="Create Account" size="lg" />
        <button style={{ width: '100%', background: 'transparent', color: '#0866FF', border: 'none', borderRadius: 9999, padding: '12px 24px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginTop: 8 }}>Log In</button>
      </div>
    </div>
  )
}

function LoginScreen({ bp, formState }: { bp: Breakpoint; formState: FormState }) {
  const [showPw, setShowPw] = useState(false)
  const isMobile = bp === 'mobile'
  const isDesktop = bp === 'desktop'

  const hasError = formState === 'error'
  const hasFilled = formState === 'filled' || formState === 'error'

  const Form = () => (
    <div>
      {!isDesktop && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <LogoMark size={36} />
            <GradientText size={18}>MyChatApp</GradientText>
          </div>
          <h1 style={{ fontSize: isMobile ? 26 : 28, fontWeight: 700, color: '#050505', margin: 0 }}>Welcome back</h1>
          <p style={{ fontSize: 14, color: '#65676B', marginTop: 6 }}>Log in to your account</p>
        </div>
      )}

      <Field
        label="Email or Username"
        type="email"
        placeholder="you@example.com"
        value={hasFilled ? 'alex.j@notavalidemail' : ''}
        error={hasError ? 'Please enter a valid email address.' : undefined}
        success={!hasError && hasFilled}
      />
      <Field
        label="Password"
        type="password"
        placeholder="Enter your password"
        value={hasFilled ? 'MyPassword123' : ''}
        showToggle
        showPassword={showPw}
        onTogglePassword={() => setShowPw(p => !p)}
        error={hasError ? 'Incorrect password. Please try again.' : undefined}
        success={!hasError && hasFilled}
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20, marginTop: -8 }}>
        <span style={{ fontSize: 13, color: '#0866FF', fontWeight: 500, cursor: 'pointer' }}>Forgot password?</span>
      </div>

      {hasError && (
        <div style={{ background: 'rgba(250,56,62,0.06)', border: '1.5px solid rgba(250,56,62,0.25)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{ color: '#FA383E', fontSize: 16, flexShrink: 0 }}>⚠</span>
          <p style={{ fontSize: 13, color: '#FA383E', fontWeight: 500, margin: 0 }}>Your email or password is incorrect. Please try again or reset your password.</p>
        </div>
      )}

      <GradientBtn label="Log In" size="lg" />
      <Divider label="or continue with" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <OutlineBtn label="Continue with Google" icon={<GoogleIcon />} />
        <OutlineBtn label="Continue with GitHub" icon={<GithubIcon />} />
      </div>

      <p style={{ textAlign: 'center', fontSize: 14, color: '#65676B', marginTop: 24 }}>
        Don't have an account?{' '}
        <span style={{ color: '#0866FF', fontWeight: 600, cursor: 'pointer' }}>Create one</span>
      </p>
    </div>
  )

  if (isDesktop) {
    return (
      <div style={{ display: 'flex', height: '100%' }}>
        <BrandPanel />
        <div style={{ flex: '0 0 520px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, background: '#F7F8FA', overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: 400 }}>
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <LogoMark size={36} />
                <GradientText size={18}>MyChatApp</GradientText>
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: '#050505', margin: '0 0 8px' }}>Welcome back</h1>
              <p style={{ fontSize: 15, color: '#65676B', margin: 0 }}>Log in to your account</p>
            </div>
            <Form />
          </div>
        </div>
      </div>
    )
  }

  if (bp === 'tablet') {
    return (
      <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, background: '#F7F8FA' }}>
        <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 8px 40px rgba(0,0,0,0.1)', padding: '40px 48px', width: '100%', maxWidth: 480 }}>
          <Form />
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100%', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, padding: '48px 24px 24px' }}>
        <Form />
      </div>
    </div>
  )
}

function RegisterScreen({ bp, formState }: { bp: Breakpoint; formState: FormState }) {
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [termsChecked, setTermsChecked] = useState(formState === 'filled' || formState === 'error')
  const isMobile = bp === 'mobile'
  const isDesktop = bp === 'desktop'

  const hasError = formState === 'error'
  const hasFilled = formState === 'filled' || formState === 'error'
  const canSubmit = termsChecked

  const Form = () => (
    <div>
      {!isDesktop && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <LogoMark size={36} />
            <GradientText size={18}>MyChatApp</GradientText>
          </div>
          <h1 style={{ fontSize: isMobile ? 26 : 28, fontWeight: 700, color: '#050505', margin: 0 }}>Create your account</h1>
          <p style={{ fontSize: 14, color: '#65676B', marginTop: 6 }}>It's free and only takes a minute</p>
        </div>
      )}

      <Field
        label="Username"
        placeholder="e.g. alexjohnson"
        value={hasFilled ? 'alexjohnson' : ''}
        success={hasFilled && !hasError}
        error={hasError && !hasFilled ? 'Username is already taken.' : undefined}
        hint={!hasFilled ? 'Letters, numbers, and underscores only.' : undefined}
      />
      <Field
        label="Email Address"
        type="email"
        placeholder="you@example.com"
        value={hasFilled ? (hasError ? 'notanemail' : 'alex@example.com') : ''}
        error={hasError ? 'Please enter a valid email address.' : undefined}
        success={!hasError && hasFilled}
      />
      <Field
        label="Password"
        type="password"
        placeholder="At least 8 characters"
        value={hasFilled ? 'SecurePass99!' : ''}
        showToggle
        showPassword={showPw}
        onTogglePassword={() => setShowPw(p => !p)}
        success={!hasError && hasFilled}
        hint={!hasFilled ? 'Use 8+ characters, a number, and a symbol.' : undefined}
      />
      <Field
        label="Confirm Password"
        type="password"
        placeholder="Repeat your password"
        value={hasFilled ? (hasError ? 'WrongPass123' : 'SecurePass99!') : ''}
        showToggle
        showPassword={showConfirm}
        onTogglePassword={() => setShowConfirm(p => !p)}
        error={hasError ? 'Passwords do not match.' : undefined}
        success={!hasError && hasFilled}
      />

      {/* Terms of Service checkbox — required for form submission */}
      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 20, cursor: 'pointer' }}>
        <div
          onClick={() => setTermsChecked(c => !c)}
          style={{
            width: 20, height: 20, borderRadius: 5, flexShrink: 0, marginTop: 1,
            border: termsChecked ? '2px solid #0866FF' : '2px solid #D0D3D8',
            background: termsChecked ? '#0866FF' : '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s', cursor: 'pointer',
          }}>
          {termsChecked && (
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
        <span style={{ fontSize: 13, color: '#65676B', lineHeight: 1.5 }}>
          I agree to the{' '}
          <span style={{ color: '#0866FF', cursor: 'pointer', fontWeight: 500 }}>Terms of Service</span>
          {' '}and{' '}
          <span style={{ color: '#0866FF', cursor: 'pointer', fontWeight: 500 }}>Privacy Policy</span>
        </span>
      </label>

      <button
        disabled={!canSubmit}
        style={{
          width: '100%', border: 'none', borderRadius: 9999, padding: '14px 24px',
          fontSize: 15, fontWeight: 600, cursor: canSubmit ? 'pointer' : 'not-allowed',
          fontFamily: 'inherit',
          background: canSubmit ? 'linear-gradient(135deg, #00B2FF, #B620E0)' : '#E4E6EB',
          color: canSubmit ? '#fff' : '#A0A2A9',
          boxShadow: canSubmit ? '0 4px 16px rgba(8,102,255,0.25)' : 'none',
          transition: 'all 0.2s',
        }}>
        Create Account
      </button>
      <Divider label="or sign up with" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <OutlineBtn label="Continue with Google" icon={<GoogleIcon />} />
        <OutlineBtn label="Continue with GitHub" icon={<GithubIcon />} />
      </div>

      <p style={{ textAlign: 'center', fontSize: 14, color: '#65676B', marginTop: 24 }}>
        Already have an account?{' '}
        <span style={{ color: '#0866FF', fontWeight: 600, cursor: 'pointer' }}>Log in</span>
      </p>
    </div>
  )

  if (isDesktop) {
    return (
      <div style={{ display: 'flex', height: '100%' }}>
        <BrandPanel />
        <div style={{ flex: '0 0 520px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, background: '#F7F8FA', overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: 400 }}>
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <LogoMark size={36} />
                <GradientText size={18}>MyChatApp</GradientText>
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: '#050505', margin: '0 0 8px' }}>Create your account</h1>
              <p style={{ fontSize: 15, color: '#65676B', margin: 0 }}>Free forever. No credit card required.</p>
            </div>
            <Form />
          </div>
        </div>
      </div>
    )
  }

  if (bp === 'tablet') {
    return (
      <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, background: '#F7F8FA' }}>
        <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 8px 40px rgba(0,0,0,0.1)', padding: '40px 48px', width: '100%', maxWidth: 480 }}>
          <Form />
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100%', background: '#fff' }}>
      <div style={{ padding: '48px 24px 40px' }}>
        <Form />
      </div>
    </div>
  )
}

function ForgotScreen({ bp, formState }: { bp: Breakpoint; formState: FormState }) {
  const isMobile = bp === 'mobile'
  const isDesktop = bp === 'desktop'
  const isSent = formState === 'filled'
  const hasError = formState === 'error'

  const SentConfirmation = () => (
    <div style={{ textAlign: 'center' }}>
      {!isDesktop && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <LogoMark size={36} />
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <CheckCircleIcon />
      </div>
      <h1 style={{ fontSize: isMobile ? 24 : 26, fontWeight: 700, color: '#050505', marginBottom: 12 }}>Check your inbox</h1>
      <p style={{ fontSize: 15, color: '#65676B', lineHeight: 1.6, marginBottom: 32 }}>
        We sent a password reset link to{' '}
        <strong style={{ color: '#050505' }}>alex@example.com</strong>.
        It expires in 15 minutes.
      </p>

      <div style={{ background: '#F7F8FA', borderRadius: 16, padding: '16px 20px', marginBottom: 28, textAlign: 'left' }}>
        <p style={{ fontSize: 13, color: '#65676B', margin: 0, lineHeight: 1.6 }}>
          Didn't receive it? Check your spam folder or{' '}
          <span style={{ color: '#0866FF', cursor: 'pointer', fontWeight: 500 }}>resend the email</span>.
        </p>
      </div>

      <GradientBtn label="Back to Log In" />
    </div>
  )

  const Form = () => isSent ? <SentConfirmation /> : (
    <div>
      {!isDesktop && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <LogoMark size={36} />
            <GradientText size={18}>MyChatApp</GradientText>
          </div>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(8,102,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="20" height="16" rx="3" stroke="#0866FF" strokeWidth="1.8"/><path d="M2 7l10 7 10-7" stroke="#0866FF" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </div>
          <h1 style={{ fontSize: isMobile ? 26 : 28, fontWeight: 700, color: '#050505', margin: '0 0 8px' }}>Reset your password</h1>
          <p style={{ fontSize: 14, color: '#65676B' }}>We'll send a reset link to your email.</p>
        </div>
      )}

      <Field
        label="Email Address"
        type="email"
        placeholder="you@example.com"
        value={hasError ? 'notregistered@nope.com' : ''}
        error={hasError ? 'No account found with this email address.' : undefined}
      />

      {hasError && (
        <div style={{ background: 'rgba(250,56,62,0.06)', border: '1.5px solid rgba(250,56,62,0.2)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ color: '#FA383E', fontSize: 15, flexShrink: 0 }}>⚠</span>
          <p style={{ fontSize: 13, color: '#FA383E', fontWeight: 500, margin: 0 }}>
            No account exists with that email.{' '}
            <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Create an account instead?</span>
          </p>
        </div>
      )}

      <GradientBtn label="Send Reset Link" size="lg" />

      <p style={{ textAlign: 'center', fontSize: 14, color: '#65676B', marginTop: 24 }}>
        Remember your password?{' '}
        <span style={{ color: '#0866FF', fontWeight: 600, cursor: 'pointer' }}>Log in</span>
      </p>
    </div>
  )

  if (isDesktop) {
    return (
      <div style={{ display: 'flex', height: '100%' }}>
        <BrandPanel />
        <div style={{ flex: '0 0 520px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, background: '#F7F8FA' }}>
          <div style={{ width: '100%', maxWidth: 400 }}>
            {!isSent && (
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                  <LogoMark size={36} />
                  <GradientText size={18}>MyChatApp</GradientText>
                </div>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(8,102,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="20" height="16" rx="3" stroke="#0866FF" strokeWidth="1.8"/><path d="M2 7l10 7 10-7" stroke="#0866FF" strokeWidth="1.8" strokeLinecap="round"/></svg>
                </div>
                <h1 style={{ fontSize: 28, fontWeight: 700, color: '#050505', margin: '0 0 8px' }}>Reset your password</h1>
                <p style={{ fontSize: 15, color: '#65676B', margin: 0 }}>We'll send a reset link to your email address.</p>
              </div>
            )}
            <Form />
          </div>
        </div>
      </div>
    )
  }

  if (bp === 'tablet') {
    return (
      <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, background: '#F7F8FA' }}>
        <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 8px 40px rgba(0,0,0,0.1)', padding: '40px 48px', width: '100%', maxWidth: 480 }}>
          <Form />
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100%', background: '#fff' }}>
      <div style={{ padding: '48px 24px 40px' }}>
        <Form />
      </div>
    </div>
  )
}

// ─── Email Verification screen ────────────────────────────────────
function EmailVerifyScreen({ bp, formState }: { bp: Breakpoint; formState: FormState }) {
  const isMobile = bp === 'mobile'
  const isDesktop = bp === 'desktop'
  const [countdown, setCountdown] = useState(formState === 'filled' ? 0 : 47)
  const hasError = formState === 'error'
  // Simulate the 6-digit code boxes filled state
  const code = formState !== 'empty' ? ['4', '8', '2', '1', '9', formState === 'error' ? '✕' : '3'] : ['', '', '', '', '', '']

  const Content = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      {!isDesktop && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, alignSelf: 'flex-start' }}>
          <LogoMark size={32} />
          <GradientText size={16}>MyChatApp</GradientText>
        </div>
      )}

      {/* Email illustration */}
      <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg, rgba(0,178,255,0.1), rgba(182,32,224,0.1))', border: '1.5px solid rgba(8,102,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="4" width="20" height="16" rx="3" stroke="url(#eg1)" strokeWidth="1.8"/>
          <path d="M2 7l10 7 10-7" stroke="url(#eg2)" strokeWidth="1.8" strokeLinecap="round"/>
          <defs>
            <linearGradient id="eg1" x1="2" y1="4" x2="22" y2="20"><stop stopColor="#00B2FF"/><stop offset="1" stopColor="#B620E0"/></linearGradient>
            <linearGradient id="eg2" x1="2" y1="7" x2="22" y2="14"><stop stopColor="#00B2FF"/><stop offset="1" stopColor="#B620E0"/></linearGradient>
          </defs>
        </svg>
      </div>

      <h1 style={{ fontSize: isMobile ? 24 : 26, fontWeight: 700, color: '#050505', margin: '0 0 10px' }}>Check your email</h1>
      <p style={{ fontSize: 14, color: '#65676B', lineHeight: 1.6, marginBottom: 8, maxWidth: 320 }}>
        We sent a 6-digit verification code to
      </p>
      <p style={{ fontSize: 14, fontWeight: 600, color: '#050505', marginBottom: 32 }}>alex@example.com</p>

      {/* 6-digit code input */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
        {code.map((digit, i) => {
          const isErr = hasError && i === 5
          return (
            <div key={i} style={{
              width: 44, height: 52, borderRadius: 12,
              border: `2px solid ${isErr ? '#FA383E' : digit ? '#0866FF' : '#E4E6EB'}`,
              background: isErr ? 'rgba(250,56,62,0.05)' : digit ? 'rgba(8,102,255,0.04)' : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 700,
              color: isErr ? '#FA383E' : digit ? '#050505' : '#E4E6EB',
              boxShadow: digit && !isErr ? '0 0 0 3px rgba(8,102,255,0.12)' : isErr ? '0 0 0 3px rgba(250,56,62,0.12)' : 'none',
              transition: 'all 0.15s',
            }}>{digit || '·'}</div>
          )
        })}
      </div>

      {hasError && (
        <div style={{ background: 'rgba(250,56,62,0.06)', border: '1.5px solid rgba(250,56,62,0.25)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center', width: '100%', maxWidth: 340, boxSizing: 'border-box' }}>
          <span style={{ color: '#FA383E', fontSize: 15, flexShrink: 0 }}>⚠</span>
          <p style={{ fontSize: 13, color: '#FA383E', fontWeight: 500, margin: 0 }}>Incorrect code. Please try again.</p>
        </div>
      )}

      <button style={{
        width: '100%', maxWidth: 340, background: 'linear-gradient(135deg, #00B2FF, #B620E0)',
        color: '#fff', border: 'none', borderRadius: 9999, padding: '14px 24px',
        fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        boxShadow: '0 4px 16px rgba(8,102,255,0.25)', marginBottom: 20,
      }}>Verify Email</button>

      <div style={{ fontSize: 13, color: '#65676B' }}>
        {countdown > 0 ? (
          <>Resend code in <span style={{ color: '#050505', fontWeight: 600 }}>{countdown}s</span></>
        ) : (
          <span style={{ color: '#0866FF', fontWeight: 500, cursor: 'pointer' }}>Resend code</span>
        )}
      </div>

      <p style={{ fontSize: 13, color: '#65676B', marginTop: 32 }}>
        Wrong email?{' '}
        <span style={{ color: '#0866FF', fontWeight: 500, cursor: 'pointer' }}>Go back</span>
      </p>
    </div>
  )

  if (isDesktop) {
    return (
      <div style={{ display: 'flex', height: '100%' }}>
        <BrandPanel />
        <div style={{ flex: '0 0 520px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, background: '#F7F8FA' }}>
          <div style={{ width: '100%', maxWidth: 400 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
              <LogoMark size={36} />
              <GradientText size={18}>MyChatApp</GradientText>
            </div>
            <Content />
          </div>
        </div>
      </div>
    )
  }

  if (bp === 'tablet') {
    return (
      <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, background: '#F7F8FA' }}>
        <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 8px 40px rgba(0,0,0,0.1)', padding: '40px 48px', width: '100%', maxWidth: 480 }}>
          <Content />
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100%', background: '#fff' }}>
      <div style={{ padding: '48px 24px 40px' }}>
        <Content />
      </div>
    </div>
  )
}

// ─── Profile Setup screen ─────────────────────────────────────────
function ProfileSetupScreen({ bp, formState }: { bp: Breakpoint; formState: FormState }) {
  const isMobile = bp === 'mobile'
  const isDesktop = bp === 'desktop'
  const hasFilled = formState === 'filled' || formState === 'error'
  const hasAvatar = formState === 'filled'

  const Content = () => (
    <div>
      {!isDesktop && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <LogoMark size={32} />
            <GradientText size={16}>MyChatApp</GradientText>
          </div>
          <h1 style={{ fontSize: isMobile ? 24 : 26, fontWeight: 700, color: '#050505', margin: '0 0 6px' }}>Set up your profile</h1>
          <p style={{ fontSize: 14, color: '#65676B' }}>You can always change this later</p>
        </div>
      )}

      {/* Avatar upload area */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
        <div style={{ position: 'relative', marginBottom: 12 }}>
          {/* Avatar or gradient fallback */}
          <div style={{ width: 96, height: 96, borderRadius: '50%', background: hasAvatar ? 'linear-gradient(135deg, #00B2FF, #B620E0)' : 'linear-gradient(135deg, #F0F2F5, #E4E6EB)', border: '3px solid #fff', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {hasAvatar ? (
              <span style={{ fontSize: 36, fontWeight: 700, color: '#fff' }}>AJ</span>
            ) : (
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="#A0A2A9" strokeWidth="1.6"/><path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" stroke="#A0A2A9" strokeWidth="1.6" strokeLinecap="round"/></svg>
            )}
          </div>
          {/* Camera icon overlay */}
          <button style={{ position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #00B2FF, #B620E0)', border: '2.5px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="13" r="4" stroke="white" strokeWidth="1.8"/></svg>
          </button>
        </div>
        <span style={{ fontSize: 13, color: '#0866FF', fontWeight: 500, cursor: 'pointer' }}>
          {hasAvatar ? 'Change photo' : 'Upload a photo'}
        </span>
      </div>

      {/* Fields */}
      <Field
        label="Display Name"
        placeholder="How should people know you?"
        value={hasFilled ? 'Alex Johnson' : ''}
        success={hasFilled}
      />
      <Field
        label="Username"
        placeholder="e.g. alexjohnson"
        value="alexjohnson"
        success
        hint="mychatapp.io/@alexjohnson"
      />

      {/* Optional bio */}
      <div style={{ marginBottom: 28 }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: '#65676B', display: 'block', marginBottom: 6 }}>
          Bio <span style={{ fontWeight: 400, color: '#A0A2A9' }}>(optional)</span>
        </label>
        <textarea
          defaultValue={hasFilled ? 'Designer & builder. I love connecting people through great UX. 🚀' : ''}
          placeholder="Tell people a little about yourself…"
          readOnly
          style={{
            width: '100%', border: `1.5px solid ${hasFilled ? '#0866FF' : '#E4E6EB'}`, borderRadius: 12,
            padding: '12px 16px', fontSize: 15, color: hasFilled ? '#050505' : '#A0A2A9',
            background: '#fff', outline: 'none', resize: 'none', height: 90,
            fontFamily: 'inherit', lineHeight: 1.5,
            boxShadow: hasFilled ? '0 0 0 3px rgba(8,102,255,0.12)' : 'none',
            boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 5 }}>
          <span style={{ fontSize: 12, color: hasFilled ? '#0866FF' : '#A0A2A9' }}>
            {hasFilled ? '62' : '0'}/160
          </span>
        </div>
      </div>

      <GradientBtn label="Finish Setup →" size="lg" />

      <button style={{ width: '100%', background: 'transparent', color: '#65676B', border: 'none', borderRadius: 9999, padding: '12px 24px', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', marginTop: 10 }}>
        Skip for now
      </button>
    </div>
  )

  if (isDesktop) {
    return (
      <div style={{ display: 'flex', height: '100%' }}>
        <BrandPanel />
        <div style={{ flex: '0 0 520px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, background: '#F7F8FA', overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: 400 }}>
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <LogoMark size={36} />
                <GradientText size={18}>MyChatApp</GradientText>
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: '#050505', margin: '0 0 6px' }}>Set up your profile</h1>
              <p style={{ fontSize: 15, color: '#65676B', margin: 0 }}>You can always change this later</p>
            </div>
            <Content />
          </div>
        </div>
      </div>
    )
  }

  if (bp === 'tablet') {
    return (
      <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, background: '#F7F8FA' }}>
        <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 8px 40px rgba(0,0,0,0.1)', padding: '40px 48px', width: '100%', maxWidth: 480 }}>
          <Content />
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100%', background: '#fff' }}>
      <div style={{ padding: '48px 24px 40px' }}>
        <Content />
      </div>
    </div>
  )
}

// ─── Screen frame ─────────────────────────────────────────────────
interface FrameProps {
  bp: Breakpoint
  screen: Screen
  formState: FormState
  label: string
}

function ScreenFrame({ bp, screen, formState, label }: FrameProps) {
  const width = BP_WIDTHS[bp]
  const isMobile = bp === 'mobile'
  const isDesktop = bp === 'desktop'
  const frameHeight = isDesktop ? 680 : isMobile ? 760 : 700
  const scale = isDesktop ? 0.62 : isMobile ? 0.88 : 0.72

  const content: Record<Screen, React.ReactNode> = {
    welcome: <WelcomeScreen bp={bp} formState={formState} />,
    login: <LoginScreen bp={bp} formState={formState} />,
    register: <RegisterScreen bp={bp} formState={formState} />,
    forgot: <ForgotScreen bp={bp} formState={formState} />,
    'forgot-sent': <ForgotScreen bp={bp} formState="filled" />,
    'email-verify': <EmailVerifyScreen bp={bp} formState={formState} />,
    'profile-setup': <ProfileSetupScreen bp={bp} formState={formState} />,
  }

  const stateBadgeColor: Record<FormState, string> = {
    empty: '#65676B',
    filled: '#31A24C',
    error: '#FA383E',
  }
  const stateBadgeLabel: Record<FormState, string> = {
    empty: 'Empty',
    filled: screen === 'forgot-sent' ? 'Sent ✓' : 'Filled ✓',
    error: 'Error ✕',
  }
  const fs = screen === 'forgot-sent' ? 'filled' : formState

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Label row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#050505' }}>{label}</span>
        <span style={{ background: stateBadgeColor[fs], color: '#fff', fontSize: 11, fontWeight: 600, borderRadius: 9999, padding: '2px 8px' }}>
          {stateBadgeLabel[fs]}
        </span>
      </div>

      {/* Device frame */}
      <div style={{ position: 'relative' }}>
        {/* Browser chrome for tablet/desktop */}
        {!isMobile && (
          <div style={{
            width: width * scale,
            background: '#E8EAED',
            borderRadius: '12px 12px 0 0',
            padding: '10px 14px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            border: '1.5px solid #D0D3D8',
            borderBottom: 'none',
          }}>
            {['#FA383E', '#F7B928', '#31A24C'].map((c, i) => <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
            <div style={{ flex: 1, background: '#fff', borderRadius: 6, height: 22, display: 'flex', alignItems: 'center', paddingLeft: 8, fontSize: 11, color: '#65676B', marginLeft: 8 }}>mychatapp.io/auth</div>
          </div>
        )}

        {/* Screen viewport */}
        <div style={{
          width: width * scale,
          height: frameHeight * scale,
          border: isMobile ? '8px solid #1C1C1E' : '1.5px solid #D0D3D8',
          borderTop: isMobile ? '8px solid #1C1C1E' : 'none',
          borderRadius: isMobile ? 36 : '0 0 8px 8px',
          overflow: 'hidden',
          boxShadow: isMobile ? '0 20px 60px rgba(0,0,0,0.25), inset 0 0 0 1px rgba(255,255,255,0.1)' : '0 8px 30px rgba(0,0,0,0.12)',
          background: '#F7F8FA',
          position: 'relative',
        }}>
          {/* Mobile notch */}
          {isMobile && (
            <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 100, height: 24, background: '#1C1C1E', borderRadius: '0 0 16px 16px', zIndex: 10 }} />
          )}

          {/* Inner scaled content */}
          <div style={{
            width: width,
            height: frameHeight,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            overflow: 'hidden',
            position: 'relative',
          }}>
            {isMobile && <div style={{ height: 44 }} />}
            <div style={{ height: isMobile ? frameHeight - 44 : frameHeight, overflowY: 'auto' }}>
              {content[screen]}
            </div>
          </div>
        </div>

        {/* Mobile home indicator */}
        {isMobile && (
          <div style={{ position: 'absolute', bottom: -14, left: '50%', transform: 'translateX(-50%)', width: 120, height: 4, borderRadius: 2, background: '#1C1C1E', opacity: 0.5 }} />
        )}
      </div>

      <div style={{ marginTop: 16, fontSize: 12, color: '#65676B' }}>{BP_LABELS[bp]}</div>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────
export default function AuthFlow() {
  const screens: { id: Screen; label: string }[] = [
    { id: 'welcome', label: 'Welcome' },
    { id: 'login', label: 'Log In' },
    { id: 'register', label: 'Register' },
    { id: 'forgot', label: 'Forgot PW' },
    { id: 'forgot-sent', label: 'Reset Sent' },
    { id: 'email-verify', label: 'Verify Email' },
    { id: 'profile-setup', label: 'Profile Setup' },
  ]

  const formStates: { id: FormState; label: string }[] = [
    { id: 'empty', label: 'Empty' },
    { id: 'filled', label: 'Filled' },
    { id: 'error', label: 'Error' },
  ]

  const breakpoints: Breakpoint[] = ['mobile', 'tablet', 'desktop']

  const [activeScreen, setActiveScreen] = useState<Screen>('welcome')
  const [activeFormState, setActiveFormState] = useState<FormState>('empty')

  const resolvedFormState: FormState =
    activeScreen === 'forgot-sent' ? 'filled' : activeFormState

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#F7F8FA', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E4E6EB', padding: '0 40px', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', height: 56, display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LogoMark size={28} />
            <span style={{ fontWeight: 700, fontSize: 15, background: 'linear-gradient(135deg, #00B2FF, #B620E0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>MyChatApp</span>
            <span style={{ color: '#E4E6EB', marginLeft: 4 }}>·</span>
            <span style={{ fontSize: 13, color: '#65676B', fontWeight: 500 }}>Authentication Flow</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {/* Screen selector */}
            <div style={{ display: 'flex', gap: 4, background: '#F0F2F5', borderRadius: 9999, padding: 4 }}>
              {screens.map(s => (
                <button key={s.id} onClick={() => setActiveScreen(s.id)}
                  style={{ background: activeScreen === s.id ? '#fff' : 'transparent', color: activeScreen === s.id ? '#050505' : '#65676B', border: 'none', borderRadius: 9999, padding: '5px 12px', fontSize: 13, fontWeight: activeScreen === s.id ? 600 : 400, cursor: 'pointer', boxShadow: activeScreen === s.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                  {s.label}
                </button>
              ))}
            </div>

            {/* Form state selector */}
            {activeScreen !== 'forgot-sent' && (
              <div style={{ display: 'flex', gap: 4, background: '#F0F2F5', borderRadius: 9999, padding: 4 }}>
                {formStates.map(s => {
                  const isActive = activeFormState === s.id
                  const color = s.id === 'error' ? '#FA383E' : s.id === 'filled' ? '#31A24C' : '#65676B'
                  return (
                    <button key={s.id} onClick={() => setActiveFormState(s.id)}
                      style={{ background: isActive ? '#fff' : 'transparent', color: isActive ? color : '#65676B', border: 'none', borderRadius: 9999, padding: '5px 12px', fontSize: 13, fontWeight: isActive ? 600 : 400, cursor: 'pointer', boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s', fontFamily: 'inherit' }}>
                      {s.label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hero band */}
      <div style={{ background: 'linear-gradient(135deg, #00B2FF 0%, #B620E0 100%)', padding: '28px 40px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0 }}>
            {screens.find(s => s.id === activeScreen)?.label} Screen
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', margin: '4px 0 0' }}>
            Mobile · Tablet · Desktop — {resolvedFormState === 'filled' ? 'Filled state' : resolvedFormState === 'error' ? 'Error state' : 'Empty state'}
          </p>
        </div>
      </div>

      {/* Breakpoint frames */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '48px 40px 80px' }}>
        <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center' }}>
          {breakpoints.map(bp => (
            <ScreenFrame
              key={bp}
              bp={bp}
              screen={activeScreen}
              formState={resolvedFormState}
              label={screens.find(s => s.id === activeScreen)?.label ?? ''}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
