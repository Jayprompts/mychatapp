import { useState, useRef } from 'react'

// ─── Design tokens (match existing system) ────────────────────────
const GRAD     = 'linear-gradient(135deg, #00B2FF 0%, #B620E0 100%)'
const PRIMARY  = '#0866FF'
const BG       = '#F7F8FA'
const CARD     = '#FFFFFF'
const TEXT     = '#050505'
const SUB      = '#3C4043'
const MUTED    = '#65676B'
const BORDER   = '#E4E6EB'
const SUCCESS  = '#31A24C'
const ERROR    = '#FA383E'
const WARNING  = '#F7B928'

// Sidebar icon colors to match ChatExperience
const ICON_SB  = '#1C1E21'
const ICON_SB_ACTIVE = '#0866FF'

type Breakpoint = 'mobile' | 'tablet' | 'desktop'
type ProfileView = 'my-profile' | 'edit-profile' | 'other-profile' | 'settings'

// ─── Shared primitives ────────────────────────────────────────────
const LogoMark = ({ size = 32 }: { size?: number }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.28, background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
    <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
      <path d="M21 15H7L3 21V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </div>
)

function GradBtn({ label, fullWidth = true, disabled = false, onClick }: { label: string; fullWidth?: boolean; disabled?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ width: fullWidth ? '100%' : 'auto', background: disabled ? '#E4E6EB' : GRAD, color: disabled ? MUTED : '#fff', border: 'none', borderRadius: 9999, padding: '12px 24px', fontSize: 15, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: disabled ? 'none' : '0 4px 16px rgba(8,102,255,0.25)', transition: 'all 0.2s' }}>
      {label}
    </button>
  )
}

function OutlineBtn({ label, fullWidth = false, danger = false, onClick }: { label: string; fullWidth?: boolean; danger?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{ width: fullWidth ? '100%' : 'auto', background: danger ? 'rgba(250,56,62,0.06)' : CARD, color: danger ? ERROR : SUB, border: `1.5px solid ${danger ? 'rgba(250,56,62,0.25)' : BORDER}`, borderRadius: 9999, padding: '11px 20px', fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
      {label}
    </button>
  )
}

// ─── Toggle switch ────────────────────────────────────────────────
function Toggle({ on, onChange, label, sub }: { on: boolean; onChange: () => void; label: string; sub?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: `1px solid ${BORDER}` }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 500, color: TEXT }}>{label}</div>
        {sub && <div style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>{sub}</div>}
      </div>
      <div onClick={onChange} style={{ width: 44, height: 24, borderRadius: 9999, background: on ? GRAD : '#D0D3D8', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background 0.2s', boxShadow: on ? '0 2px 8px rgba(8,102,255,0.3)' : 'none' }}>
        <div style={{ position: 'absolute', top: 3, left: on ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
      </div>
    </div>
  )
}

// ─── Field (matches AuthFlow) ─────────────────────────────────────
function Field({ label, type = 'text', value = '', placeholder = '', sub, multiline = false }: {
  label: string; type?: string; value?: string; placeholder?: string; sub?: string; multiline?: boolean
}) {
  const filled = value.length > 0
  const borderColor = filled ? PRIMARY : BORDER
  const shadow = filled ? '0 0 0 3px rgba(8,102,255,0.12)' : 'none'

  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: MUTED, display: 'block', marginBottom: 6 }}>{label}</label>
      {multiline ? (
        <textarea defaultValue={value} placeholder={placeholder} readOnly
          style={{ width: '100%', border: `1.5px solid ${borderColor}`, borderRadius: 12, padding: '12px 16px', fontSize: 15, color: filled ? TEXT : '#A0A2A9', background: CARD, outline: 'none', resize: 'none', height: 90, fontFamily: 'inherit', lineHeight: 1.5, boxShadow: shadow, boxSizing: 'border-box', transition: 'border-color 0.15s, box-shadow 0.15s' }} />
      ) : (
        <input type={type} defaultValue={value} placeholder={placeholder} readOnly
          style={{ width: '100%', border: `1.5px solid ${borderColor}`, borderRadius: 12, padding: '12px 16px', fontSize: 15, color: filled ? TEXT : '#A0A2A9', background: CARD, outline: 'none', fontFamily: 'inherit', boxShadow: shadow, boxSizing: 'border-box', transition: 'border-color 0.15s, box-shadow 0.15s' }} />
      )}
      {sub && <p style={{ fontSize: 12, color: MUTED, marginTop: 5 }}>{sub}</p>}
    </div>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────
function GradientAvatar({ initials, size = 80, editable = false, onClick }: { initials: string; size?: number; editable?: boolean; onClick?: () => void }) {
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div style={{ width: size, height: size, borderRadius: '50%', background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #fff', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
        <span style={{ fontSize: size * 0.36, fontWeight: 700, color: '#fff' }}>{initials}</span>
      </div>
      {editable && (
        <button onClick={onClick} style={{ position: 'absolute', bottom: 2, right: 2, width: 30, height: 30, borderRadius: '50%', background: GRAD, border: '2.5px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="13" r="4" stroke="white" strokeWidth="1.8"/></svg>
        </button>
      )}
    </div>
  )
}

// ─── Stat pill ────────────────────────────────────────────────────
function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '14px 24px', flex: 1 }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: TEXT, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: MUTED, marginTop: 4, fontWeight: 500 }}>{label}</div>
    </div>
  )
}

// ─── Section card wrapper ─────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: CARD, borderRadius: 16, border: `1px solid ${BORDER}`, padding: '20px 24px', marginBottom: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
      <h3 style={{ fontSize: 13, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8, margin: '0 0 16px' }}>{title}</h3>
      {children}
    </div>
  )
}

// ─── Avatar Upload & Crop Modal ───────────────────────────────────
function AvatarUploadModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [stage, setStage] = useState<'upload' | 'crop'>('upload')
  const [dragging, setDragging] = useState(false)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, backdropFilter: 'blur(4px)', padding: 24 }}>
      <div style={{ background: CARD, borderRadius: 20, width: '100%', maxWidth: 480, boxShadow: '0 24px 64px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '18px 24px 16px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: TEXT, margin: 0 }}>
            {stage === 'upload' ? 'Upload Photo' : 'Crop & Position'}
          </h2>
          <button onClick={onClose} style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke={MUTED} strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>

        {stage === 'upload' ? (
          <div style={{ padding: '28px 24px' }}>
            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); setStage('crop') }}
              onClick={() => setStage('crop')}
              style={{ border: `2px dashed ${dragging ? PRIMARY : BORDER}`, borderRadius: 16, padding: '40px 24px', textAlign: 'center', cursor: 'pointer', background: dragging ? 'rgba(8,102,255,0.04)' : BG, transition: 'all 0.15s' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(8,102,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke={PRIMARY} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <p style={{ fontSize: 15, fontWeight: 600, color: TEXT, margin: '0 0 6px' }}>Drop your photo here</p>
              <p style={{ fontSize: 13, color: MUTED, margin: '0 0 18px' }}>or click to browse files</p>
              <span style={{ background: 'rgba(8,102,255,0.08)', color: PRIMARY, fontSize: 13, fontWeight: 600, borderRadius: 9999, padding: '8px 18px' }}>Choose Photo</span>
            </div>
            <p style={{ fontSize: 12, color: MUTED, textAlign: 'center', marginTop: 14 }}>JPG, PNG, GIF · Max 5 MB · Square images work best</p>
          </div>
        ) : (
          <div style={{ padding: '24px 24px 0' }}>
            {/* Crop interface */}
            <div style={{ position: 'relative', width: '100%', paddingTop: '100%', background: 'linear-gradient(145deg, #1a1a2e, #16213e)', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
              {/* Simulated photo background */}
              <div style={{ position: 'absolute', inset: 0, background: GRAD, opacity: 0.7 }} />
              {/* Circular crop mask overlay */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* Darkened corners */}
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} />
                {/* Clear circle */}
                <div style={{ position: 'relative', width: '70%', paddingTop: '70%' }}>
                  <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid #fff', boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)', overflow: 'hidden', background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 64, fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>AJ</span>
                  </div>
                  {/* Drag handle indicators */}
                  {[{top:'50%',left:'-3px',cursor:'ew-resize'},{top:'-3px',left:'50%',cursor:'ns-resize'}].map((h,i) => (
                    <div key={i} style={{ position: 'absolute', width: 12, height: 12, borderRadius: '50%', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', transform: 'translate(-50%,-50%)', top: h.top, left: h.left, cursor: h.cursor }} />
                  ))}
                </div>
              </div>
            </div>
            {/* Zoom slider */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: MUTED, fontWeight: 500 }}>Zoom</span>
                <span style={{ fontSize: 12, color: PRIMARY, fontWeight: 600 }}>1.2×</span>
              </div>
              <div style={{ position: 'relative', height: 4, background: BORDER, borderRadius: 9999 }}>
                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '35%', background: GRAD, borderRadius: 9999 }} />
                <div style={{ position: 'absolute', top: '50%', left: '35%', transform: 'translate(-50%,-50%)', width: 16, height: 16, borderRadius: '50%', background: '#fff', border: `2px solid ${PRIMARY}`, boxShadow: '0 2px 8px rgba(8,102,255,0.3)', cursor: 'pointer' }} />
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: '14px 24px 20px', borderTop: `1px solid ${BORDER}`, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <OutlineBtn label="Cancel" onClick={stage === 'crop' ? () => setStage('upload') : onClose} />
          {stage === 'crop' && (
            <button onClick={onSave} style={{ background: GRAD, color: '#fff', border: 'none', borderRadius: 9999, padding: '11px 24px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(8,102,255,0.25)' }}>
              Save Photo
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Logout Confirmation Modal ────────────────────────────────────
function LogoutModal({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, backdropFilter: 'blur(4px)', padding: 24 }}>
      <div style={{ background: CARD, borderRadius: 20, width: '100%', maxWidth: 380, boxShadow: '0 24px 64px rgba(0,0,0,0.2)', padding: '28px 28px 24px' }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(250,56,62,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke={ERROR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT, textAlign: 'center', margin: '0 0 10px' }}>Log out?</h2>
        <p style={{ fontSize: 14, color: MUTED, textAlign: 'center', lineHeight: 1.6, margin: '0 0 24px' }}>
          Are you sure you want to log out of your MyChatApp account?
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, background: BG, color: TEXT, border: `1.5px solid ${BORDER}`, borderRadius: 9999, padding: '12px', fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={onClose} style={{ flex: 1, background: ERROR, color: '#fff', border: 'none', borderRadius: 9999, padding: '12px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(250,56,62,0.3)' }}>Log Out</button>
        </div>
      </div>
    </div>
  )
}

// ─── Delete Account Modal ─────────────────────────────────────────
function DeleteAccountModal({ onClose }: { onClose: () => void }) {
  const [typed, setTyped] = useState('')
  const confirmed = typed === 'DELETE'

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, backdropFilter: 'blur(4px)', padding: 24 }}>
      <div style={{ background: CARD, borderRadius: 20, width: '100%', maxWidth: 420, boxShadow: '0 24px 64px rgba(0,0,0,0.2)', padding: '28px 28px 24px' }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(250,56,62,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><polyline points="3,6 5,6 21,6" stroke={ERROR} strokeWidth="1.8" strokeLinecap="round"/><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke={ERROR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT, textAlign: 'center', margin: '0 0 10px' }}>Delete Account</h2>
        <p style={{ fontSize: 14, color: MUTED, textAlign: 'center', lineHeight: 1.6, margin: '0 0 20px' }}>
          This action is permanent. All your messages, posts, and data will be erased. This cannot be undone.
        </p>
        <div style={{ background: 'rgba(250,56,62,0.05)', border: `1.5px solid rgba(250,56,62,0.2)`, borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
          <p style={{ fontSize: 13, color: ERROR, fontWeight: 500, margin: '0 0 10px' }}>Type DELETE to confirm</p>
          <input
            value={typed}
            onChange={e => setTyped(e.target.value)}
            placeholder="DELETE"
            style={{ width: '100%', border: `1.5px solid ${confirmed ? ERROR : BORDER}`, borderRadius: 10, padding: '10px 14px', fontSize: 15, fontWeight: 600, color: TEXT, fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box', letterSpacing: 2 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, background: BG, color: TEXT, border: `1.5px solid ${BORDER}`, borderRadius: 9999, padding: '12px', fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button disabled={!confirmed} onClick={onClose} style={{ flex: 1, background: confirmed ? ERROR : '#E4E6EB', color: confirmed ? '#fff' : MUTED, border: 'none', borderRadius: 9999, padding: '12px', fontSize: 15, fontWeight: 600, cursor: confirmed ? 'pointer' : 'not-allowed', fontFamily: 'inherit', boxShadow: confirmed ? '0 4px 12px rgba(250,56,62,0.3)' : 'none', transition: 'all 0.2s' }}>
            Delete Account
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── GROUP B: My Profile screen ───────────────────────────────────
function MyProfileScreen({ onEdit, onSettings }: { onEdit: () => void; onSettings: () => void }) {
  const tabs = ['Posts', 'Communities', 'Saved']
  const [tab, setTab] = useState('Posts')

  const posts = [
    { title: 'Building Real-Time Chat with WebSockets', date: 'Sep 18', likes: 342, comments: 47 },
    { title: 'Gradient Systems That Scale', date: 'Sep 9', likes: 156, comments: 19 },
    { title: 'Community Moderation at Human Scale', date: 'Sep 2', likes: 97, comments: 28 },
  ]

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: BG }}>
      {/* Cover + avatar */}
      <div style={{ position: 'relative', height: 140, background: GRAD, flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ position: 'absolute', bottom: -20, left: 40, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
      </div>

      <div style={{ padding: '0 24px 24px', position: 'relative' }}>
        {/* Avatar row */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14, marginTop: -44 }}>
          <GradientAvatar initials="AJ" size={88} />
          <div style={{ display: 'flex', gap: 8, paddingBottom: 4 }}>
            <button onClick={onSettings} style={{ width: 36, height: 36, borderRadius: '50%', background: CARD, border: `1.5px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke={MUTED} strokeWidth="1.8"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke={MUTED} strokeWidth="1.8"/></svg>
            </button>
            <button onClick={onEdit} style={{ background: GRAD, color: '#fff', border: 'none', borderRadius: 9999, padding: '8px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(8,102,255,0.25)' }}>
              Edit Profile
            </button>
          </div>
        </div>

        {/* Name & bio */}
        <h1 style={{ fontSize: 22, fontWeight: 700, color: TEXT, margin: '0 0 2px' }}>Alex Johnson</h1>
        <p style={{ fontSize: 14, color: MUTED, margin: '0 0 8px' }}>@alexjohnson</p>
        <p style={{ fontSize: 15, color: SUB, lineHeight: 1.6, margin: '0 0 16px', maxWidth: 420 }}>
          Designer & builder. I love connecting people through great UX. 🚀
        </p>

        {/* Meta row */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
          {[
            { icon: '📅', text: 'Joined January 2024' },
            { icon: '🌐', text: 'alexjohnson.io' },
          ].map(m => (
            <span key={m.text} style={{ fontSize: 13, color: MUTED, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span>{m.icon}</span>{m.text}
            </span>
          ))}
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden', marginBottom: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
          <StatPill value="12" label="Communities" />
          <div style={{ width: 1, background: BORDER, alignSelf: 'stretch', margin: '12px 0' }} />
          <StatPill value="203" label="Posts" />
          <div style={{ width: 1, background: BORDER, alignSelf: 'stretch', margin: '12px 0' }} />
          <StatPill value="1.4K" label="Followers" />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: `2px solid ${BORDER}`, marginBottom: 20 }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ flex: 1, background: 'none', border: 'none', borderBottom: `2px solid ${t === tab ? PRIMARY : 'transparent'}`, marginBottom: -2, padding: '10px 0', fontSize: 14, fontWeight: t === tab ? 700 : 500, color: t === tab ? PRIMARY : MUTED, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
              {t}
            </button>
          ))}
        </div>

        {/* Posts */}
        {tab === 'Posts' && posts.map((p, i) => (
          <div key={i} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '14px 16px', marginBottom: 10, boxShadow: '0 1px 5px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: GRAD, flexShrink: 0, opacity: 0.85 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: TEXT, margin: '0 0 6px', lineHeight: 1.4 }}>{p.title}</p>
                <div style={{ display: 'flex', gap: 14, fontSize: 12, color: MUTED }}>
                  <span>{p.date}</span>
                  <span>♥ {p.likes}</span>
                  <span>💬 {p.comments}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        {tab !== 'Posts' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>{tab === 'Communities' ? '👥' : '🔖'}</div>
            <p style={{ fontSize: 15, color: MUTED }}>No {tab.toLowerCase()} yet</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── GROUP B: Edit Profile screen ─────────────────────────────────
function EditProfileScreen({ onBack, onAvatarEdit }: { onBack: () => void; onAvatarEdit: () => void }) {
  const [saved, setSaved] = useState(false)

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: BG }}>
      {/* Header */}
      <div style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={onBack} style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke={TEXT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: TEXT, margin: 0, flex: 1 }}>Edit Profile</h2>
        <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000) }}
          style={{ background: saved ? SUCCESS : GRAD, color: '#fff', border: 'none', borderRadius: 9999, padding: '8px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
          {saved ? '✓ Saved' : 'Save'}
        </button>
      </div>

      <div style={{ padding: '24px 20px 40px' }}>
        {/* Avatar section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28, padding: '20px', background: CARD, borderRadius: 16, border: `1px solid ${BORDER}` }}>
          <GradientAvatar initials="AJ" size={80} editable onClick={onAvatarEdit} />
          <button onClick={onAvatarEdit} style={{ marginTop: 10, fontSize: 13, color: PRIMARY, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            Change photo
          </button>
        </div>

        {/* Fields */}
        <div style={{ background: CARD, borderRadius: 16, border: `1px solid ${BORDER}`, padding: '20px', marginBottom: 14 }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8, margin: '0 0 16px' }}>Basic Info</h3>
          <Field label="Display Name" value="Alex Johnson" placeholder="How should people know you?" />
          <Field label="Username" value="alexjohnson" placeholder="e.g. alexjohnson" sub="mychatapp.io/@alexjohnson" />
          <div style={{ marginBottom: 0 }}>
            <Field label="Bio" value="Designer & builder. I love connecting people through great UX. 🚀" placeholder="Tell people about yourself…" multiline />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -12, marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: PRIMARY }}>62/160</span>
            </div>
          </div>
        </div>

        <div style={{ background: CARD, borderRadius: 16, border: `1px solid ${BORDER}`, padding: '20px' }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8, margin: '0 0 16px' }}>Contact</h3>
          <Field label="Website" value="alexjohnson.io" placeholder="yourwebsite.com" />
          <Field label="Location" value="" placeholder="Where are you based?" />
        </div>
      </div>
    </div>
  )
}

// ─── GROUP B: Other User's Profile ────────────────────────────────
function OtherUserProfileScreen() {
  const [following, setFollowing] = useState(false)

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: BG }}>
      {/* Cover */}
      <div style={{ height: 140, background: 'linear-gradient(135deg, #F7B928 0%, #FA383E 100%)', position: 'relative', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
      </div>

      <div style={{ padding: '0 24px 24px', position: 'relative' }}>
        {/* Avatar + actions */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14, marginTop: -44 }}>
          <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'linear-gradient(135deg, #F7B928, #FA383E)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #fff', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            <span style={{ fontSize: 32, fontWeight: 700, color: '#fff' }}>MG</span>
          </div>
          <div style={{ display: 'flex', gap: 8, paddingBottom: 4 }}>
            {/* More options */}
            <button style={{ width: 36, height: 36, borderRadius: '50%', background: CARD, border: `1.5px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="5" r="1" stroke={MUTED} strokeWidth="2"/><circle cx="12" cy="12" r="1" stroke={MUTED} strokeWidth="2"/><circle cx="12" cy="19" r="1" stroke={MUTED} strokeWidth="2"/></svg>
            </button>
            {/* Follow */}
            <button onClick={() => setFollowing(f => !f)}
              style={{ background: following ? CARD : GRAD, color: following ? TEXT : '#fff', border: following ? `1.5px solid ${BORDER}` : 'none', borderRadius: 9999, padding: '8px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', boxShadow: following ? 'none' : '0 4px 12px rgba(8,102,255,0.25)', transition: 'all 0.2s' }}>
              {following ? 'Following' : 'Follow'}
            </button>
            {/* Message */}
            <button style={{ background: CARD, color: PRIMARY, border: `1.5px solid ${PRIMARY}`, borderRadius: 9999, padding: '8px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Message
            </button>
          </div>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 700, color: TEXT, margin: '0 0 2px' }}>Maria Garcia</h1>
        <p style={{ fontSize: 14, color: MUTED, margin: '0 0 8px' }}>@mariagarcia</p>
        <p style={{ fontSize: 15, color: SUB, lineHeight: 1.6, margin: '0 0 16px', maxWidth: 420 }}>
          Product designer with a love for motion, typography, and crafting experiences that delight. ✨
        </p>

        {/* Blocked / report dropdown hint */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: MUTED }}>📅 Joined March 2024</span>
          <span style={{ fontSize: 13, color: MUTED }}>📍 San Francisco, CA</span>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden', marginBottom: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
          <StatPill value="8" label="Communities" />
          <div style={{ width: 1, background: BORDER, alignSelf: 'stretch', margin: '12px 0' }} />
          <StatPill value="56" label="Posts" />
          <div style={{ width: 1, background: BORDER, alignSelf: 'stretch', margin: '12px 0' }} />
          <StatPill value="892" label="Followers" />
        </div>

        {/* Recent posts preview */}
        <h3 style={{ fontSize: 14, fontWeight: 700, color: TEXT, margin: '0 0 12px' }}>Recent Posts</h3>
        {[
          'Designing for Accessibility in Dark Mode',
          'Gradient Systems That Scale Across Products',
        ].map((title, i) => (
          <div key={i} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '14px 16px', marginBottom: 10 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #F7B928, #FA383E)', flexShrink: 0, opacity: 0.9 }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: TEXT, margin: 0, lineHeight: 1.4 }}>{title}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── GROUP C: Settings screen ─────────────────────────────────────
function SettingsScreen({ onBack }: { onBack: () => void }) {
  const [notifMessages,   setNotifMessages  ] = useState(true)
  const [notifCommunity,  setNotifCommunity ] = useState(true)
  const [notifEmail,      setNotifEmail     ] = useState(false)
  const [privacyOnline,   setPrivacyOnline  ] = useState(true)
  const [appearance,      setAppearance     ] = useState<'light' | 'dark'>('light')
  const [showLogout,      setShowLogout     ] = useState(false)
  const [showDelete,      setShowDelete     ] = useState(false)

  const blockedUsers = ['Ben Carter', 'Unknown User']

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: BG }}>
      {/* Header */}
      <div style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={onBack} style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke={TEXT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: TEXT, margin: 0 }}>Settings</h2>
      </div>

      <div style={{ padding: '20px 20px 60px' }}>
        {/* Account */}
        <Section title="Account">
          {[
            { label: 'Email Address', value: 'alex@example.com', icon: '✉️' },
            { label: 'Change Password', value: 'Last changed 3 months ago', icon: '🔑' },
          ].map((item) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', padding: '13px 0', borderBottom: `1px solid ${BORDER}`, cursor: 'pointer' }}>
              <span style={{ fontSize: 18, marginRight: 12 }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 500, color: TEXT }}>{item.label}</div>
                <div style={{ fontSize: 13, color: MUTED, marginTop: 1 }}>{item.value}</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          ))}

          {/* Blocked users */}
          <div style={{ paddingTop: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: MUTED, marginBottom: 10 }}>Blocked Users</div>
            {blockedUsers.map((user) => (
              <div key={user} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${BORDER}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#E4E6EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: MUTED }}>{user[0]}</div>
                  <span style={{ fontSize: 14, color: TEXT }}>{user}</span>
                </div>
                <button style={{ background: 'rgba(8,102,255,0.08)', color: PRIMARY, border: 'none', borderRadius: 9999, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Unblock</button>
              </div>
            ))}
          </div>
        </Section>

        {/* Notifications */}
        <Section title="Notifications">
          <Toggle on={notifMessages}  onChange={() => setNotifMessages(v => !v)}  label="Message notifications"   sub="Push alerts for new DMs and mentions" />
          <Toggle on={notifCommunity} onChange={() => setNotifCommunity(v => !v)} label="Community notifications"  sub="Activity in your communities" />
          <div style={{ borderBottom: 'none' }}>
            <Toggle on={notifEmail}   onChange={() => setNotifEmail(v => !v)}     label="Email digests"            sub="Weekly summary of what you missed" />
          </div>
        </Section>

        {/* Privacy */}
        <Section title="Privacy">
          <div style={{ borderBottom: 'none' }}>
            <Toggle on={privacyOnline} onChange={() => setPrivacyOnline(v => !v)} label="Show online status" sub="Let others see when you were last active" />
          </div>
        </Section>

        {/* Appearance */}
        <Section title="Appearance">
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 15, fontWeight: 500, color: TEXT, marginBottom: 12 }}>Theme</div>
            <div style={{ display: 'flex', background: BG, borderRadius: 10, padding: 4, border: `1px solid ${BORDER}` }}>
              {(['light', 'dark'] as const).map(mode => (
                <button key={mode} onClick={() => setAppearance(mode)}
                  style={{ flex: 1, background: appearance === mode ? CARD : 'transparent', color: appearance === mode ? TEXT : MUTED, border: 'none', borderRadius: 7, padding: '9px 0', fontSize: 14, fontWeight: appearance === mode ? 600 : 500, cursor: 'pointer', fontFamily: 'inherit', boxShadow: appearance === mode ? '0 1px 4px rgba(0,0,0,0.12)' : 'none', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <span>{mode === 'light' ? '☀️' : '🌙'}</span>
                  <span style={{ textTransform: 'capitalize' }}>{mode}</span>
                </button>
              ))}
            </div>
            {appearance === 'dark' && (
              <p style={{ fontSize: 12, color: MUTED, marginTop: 8 }}>Dark mode will be fully applied in a future update.</p>
            )}
          </div>
        </Section>

        {/* Danger zone */}
        <div style={{ background: 'rgba(250,56,62,0.04)', border: `1.5px solid rgba(250,56,62,0.15)`, borderRadius: 16, padding: '20px 24px' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: ERROR, textTransform: 'uppercase', letterSpacing: 0.8, margin: '0 0 16px' }}>Danger Zone</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={() => setShowLogout(true)} style={{ background: 'rgba(250,56,62,0.06)', color: ERROR, border: `1.5px solid rgba(250,56,62,0.2)`, borderRadius: 12, padding: '12px 16px', fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke={ERROR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Log Out
            </button>
            <button onClick={() => setShowDelete(true)} style={{ background: ERROR, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 16px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 12px rgba(250,56,62,0.3)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><polyline points="3,6 5,6 21,6" stroke="white" strokeWidth="1.8" strokeLinecap="round"/><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {showLogout && <LogoutModal onClose={() => setShowLogout(false)} />}
      {showDelete && <DeleteAccountModal onClose={() => setShowDelete(false)} />}
    </div>
  )
}

// ─── Persistent app shell (mimics ChatExperience desktop/tablet shell) ───
function AppShell({ bp, view, onNav, children }: {
  bp: Breakpoint; view: ProfileView; onNav: (v: ProfileView) => void; children: React.ReactNode
}) {
  const isMobile = bp === 'mobile'
  const isDesktop = bp === 'desktop'

  const NAV = [
    { id: 'home',     icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><polyline points="9,22 9,12 15,12 15,22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>, label: 'Home' },
    { id: 'chat',     icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21 15H7L3 21V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>, label: 'Chat' },
    { id: 'my-profile', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/></svg>, label: 'Profile' },
    { id: 'explore',  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>, label: 'Explore' },
  ]

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
        {/* Bottom tab bar */}
        <div style={{ background: CARD, borderTop: `1px solid ${BORDER}`, display: 'flex', height: 56, flexShrink: 0 }}>
          {NAV.map(n => {
            const isActive = n.id === view || (n.id === 'my-profile' && (view === 'edit-profile' || view === 'settings'))
            return (
              <button key={n.id} onClick={() => onNav(n.id as ProfileView)}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', color: isActive ? PRIMARY : MUTED }}>
                {n.icon}
                <span style={{ fontSize: 9, fontWeight: isActive ? 700 : 500 }}>{n.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* Icon sidebar */}
      <div style={{ width: isDesktop ? 220 : 60, background: ICON_SB, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: isDesktop ? '14px 0' : '14px 0', flexShrink: 0 }}>
        {/* Logo */}
        <div style={{ marginBottom: 24, padding: isDesktop ? '0 16px' : 0, alignSelf: isDesktop ? 'stretch' : 'center' }}>
          {isDesktop ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <LogoMark size={28} />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: -0.3 }}>MyChatApp</span>
            </div>
          ) : <LogoMark size={28} />}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, width: '100%', padding: '0 8px' }}>
          {NAV.map(n => {
            const isActive = n.id === view || (n.id === 'my-profile' && (view === 'edit-profile' || view === 'settings'))
            return (
              <button key={n.id} onClick={() => onNav(n.id as ProfileView)}
                style={{ display: 'flex', alignItems: 'center', gap: isDesktop ? 10 : 0, justifyContent: isDesktop ? 'flex-start' : 'center', background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent', color: isActive ? '#fff' : 'rgba(255,255,255,0.55)', border: 'none', borderRadius: 10, padding: isDesktop ? '10px 12px' : '12px 0', width: '100%', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: isActive ? 600 : 400, transition: 'all 0.15s' }}>
                {n.icon}
                {isDesktop && <span>{n.label}</span>}
              </button>
            )
          })}
        </div>

        {/* Bottom: avatar */}
        <div style={{ padding: isDesktop ? '14px 16px 0' : '14px 0 0', alignSelf: isDesktop ? 'stretch' : 'center', borderTop: '1px solid rgba(255,255,255,0.08)', width: '100%', display: 'flex', justifyContent: isDesktop ? 'flex-start' : 'center', paddingLeft: isDesktop ? 16 : 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>AJ</div>
          {isDesktop && <div style={{ marginLeft: 10 }}><div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>Alex Johnson</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>@alexjohnson</div></div>}
        </div>
      </div>

      {/* Content panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: BG }}>
        {children}
      </div>
    </div>
  )
}

// ─── Device frame (reuses same pattern as AuthFlow / ChatExperience) ─────
function DeviceFrame({ bp, children }: { bp: Breakpoint; children: React.ReactNode }) {
  const dims = {
    mobile:  { w: 390, h: 780, scale: 0.82, mobile: true },
    tablet:  { w: 834, h: 680, scale: 0.70, mobile: false },
    desktop: { w: 1280, h: 680, scale: 0.63, mobile: false },
  }[bp]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Browser chrome */}
      {!dims.mobile && (
        <div style={{ width: dims.w * dims.scale, background: '#E8EAED', borderRadius: '12px 12px 0 0', padding: '10px 14px 8px', display: 'flex', alignItems: 'center', gap: 6, border: '1.5px solid #D0D3D8', borderBottom: 'none' }}>
          {['#FA383E','#F7B928','#31A24C'].map((c,i) => <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
          <div style={{ flex: 1, background: '#fff', borderRadius: 6, height: 22, display: 'flex', alignItems: 'center', paddingLeft: 10, fontSize: 11, color: MUTED, marginLeft: 8 }}>mychatapp.io/profile</div>
        </div>
      )}

      <div style={{
        width: dims.w * dims.scale,
        height: dims.h * dims.scale,
        border: dims.mobile ? '8px solid #1C1C1E' : '1.5px solid #D0D3D8',
        borderTop: dims.mobile ? '8px solid #1C1C1E' : 'none',
        borderRadius: dims.mobile ? 36 : '0 0 8px 8px',
        overflow: 'hidden',
        boxShadow: dims.mobile ? '0 20px 60px rgba(0,0,0,0.25)' : '0 8px 30px rgba(0,0,0,0.12)',
        background: BG, position: 'relative',
      }}>
        {dims.mobile && (
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 100, height: 24, background: '#1C1C1E', borderRadius: '0 0 16px 16px', zIndex: 10 }} />
        )}
        <div style={{ width: dims.w, height: dims.h, transform: `scale(${dims.scale})`, transformOrigin: 'top left', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
          {dims.mobile && <div style={{ height: 44, background: '#1C1C1E', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}><span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>9:41</span><span style={{ fontSize: 11, color: '#fff', letterSpacing: 2 }}>●●●</span></div>}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {children}
          </div>
        </div>
      </div>

      {dims.mobile && <div style={{ width: 100, height: 4, borderRadius: 2, background: '#1C1C1E', opacity: 0.4, marginTop: 6 }} />}
    </div>
  )
}

// ─── Screen selector for a given breakpoint ───────────────────────
function BpPreview({ bp, view, onViewChange }: { bp: Breakpoint; view: ProfileView; onViewChange: (v: ProfileView) => void }) {
  const [localView, setLocalView] = useState<ProfileView>(view)
  const [showAvatarModal, setShowAvatarModal] = useState(false)

  const navigate = (v: ProfileView) => { setLocalView(v); onViewChange(v) }

  const screenContent = () => {
    switch (localView) {
      case 'my-profile':
        return <MyProfileScreen onEdit={() => navigate('edit-profile')} onSettings={() => navigate('settings')} />
      case 'edit-profile':
        return <EditProfileScreen onBack={() => navigate('my-profile')} onAvatarEdit={() => setShowAvatarModal(true)} />
      case 'other-profile':
        return <OtherUserProfileScreen />
      case 'settings':
        return <SettingsScreen onBack={() => navigate('my-profile')} />
      default:
        return <MyProfileScreen onEdit={() => navigate('edit-profile')} onSettings={() => navigate('settings')} />
    }
  }

  return (
    <DeviceFrame bp={bp}>
      <AppShell bp={bp} view={localView} onNav={navigate}>
        {screenContent()}
      </AppShell>
      {showAvatarModal && (
        <AvatarUploadModal onClose={() => setShowAvatarModal(false)} onSave={() => setShowAvatarModal(false)} />
      )}
    </DeviceFrame>
  )
}

// ─── Main export ──────────────────────────────────────────────────
export default function ProfileAndSettings() {
  type NavView = ProfileView | 'avatar-modal'
  const SCREEN_OPTIONS: { id: ProfileView; label: string }[] = [
    { id: 'my-profile',    label: 'My Profile' },
    { id: 'edit-profile',  label: 'Edit Profile' },
    { id: 'other-profile', label: "Other's Profile" },
    { id: 'settings',      label: 'Settings' },
  ]

  const [activeView, setActiveView] = useState<ProfileView>('my-profile')

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: BG, minHeight: '100vh' }}>
      {/* Control strip */}
      <div style={{ background: GRAD, padding: '20px 40px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>Profile & Settings</h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: '3px 0 0' }}>
              Group B (Profile screens) · Group C (Settings) · Mobile · Tablet · Desktop
            </p>
          </div>
          <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 9999, padding: 4, flexWrap: 'wrap' }}>
            {SCREEN_OPTIONS.map(s => (
              <button key={s.id} onClick={() => setActiveView(s.id)}
                style={{ background: activeView === s.id ? '#fff' : 'transparent', color: activeView === s.id ? PRIMARY : 'rgba(255,255,255,0.85)', border: 'none', borderRadius: 9999, padding: '6px 14px', fontSize: 13, fontWeight: activeView === s.id ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
                {s.label}
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
              <BpPreview bp={bp} view={activeView} onViewChange={setActiveView} />
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
