import type { ReactNode } from 'react';
import { Outlet } from 'react-router';
import { AudioLines, MessageCircle, Users } from 'lucide-react';
import { Logo, LogoMark, Wordmark } from '@/components/ui/Logo';

// Auth screens, per the design:
//   mobile  (<640)   full-screen white form
//   tablet  (640+)   centered card on the soft background
//   desktop (1024+)  split screen — gradient brand panel left, form right
export function AuthLayout() {
  return (
    <div className="min-h-dvh bg-card sm:bg-bg lg:flex">
      <BrandPanel />
      <main className="flex min-h-dvh items-start justify-center px-6 py-12 sm:items-center sm:p-10 lg:w-[520px] lg:flex-none lg:p-14">
        <div className="w-full sm:max-w-[480px] sm:rounded-xl sm:bg-card sm:px-12 sm:py-10 sm:shadow-modal lg:max-w-[400px] lg:rounded-none lg:bg-transparent lg:p-0 lg:shadow-none">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

// Logo + page title used at the top of every auth form.
export function AuthHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-7">
      <Logo size={36} className="mb-6" />
      <h1 className="text-[26px] font-bold tracking-tight text-text-primary sm:text-[28px]">{title}</h1>
      <p className="mt-1.5 text-[15px] text-text-secondary">{subtitle}</p>
    </div>
  );
}

function BrandPanel() {
  return (
    <aside className="relative hidden flex-1 flex-col items-center justify-center overflow-hidden bg-linear-145 from-[#00B2FF] via-[#6B40F0] to-[#B620E0] p-16 lg:flex">
      {/* decorative circles */}
      <div className="absolute -top-20 -left-20 size-80 rounded-full bg-white/6" />
      <div className="absolute -right-16 -bottom-16 size-64 rounded-full bg-white/6" />
      <div className="absolute top-[40%] -right-10 size-44 rounded-full bg-white/4" />

      {/* mini chat illustration */}
      <div className="relative mb-12 h-52 w-60" aria-hidden>
        <div className="absolute top-1/2 left-1/2 flex w-40 -translate-x-1/2 -translate-y-1/2 flex-col gap-2.5 rounded-3xl border-[1.5px] border-white/20 bg-white/12 p-3.5 backdrop-blur-md">
          <Bubble>Hey! 👋</Bubble>
          <Bubble sent>Hey! How are you?</Bubble>
          <Bubble>Joining the design community tonight?</Bubble>
          <Bubble sent>Wouldn't miss it 🎉</Bubble>
        </div>
        <FloatingAvatar initials="AJ" className="top-0 left-1 size-9" />
        <FloatingAvatar initials="MG" className="top-5 -right-1 size-8" />
        <FloatingAvatar initials="BC" className="bottom-1 left-3 size-7" />
      </div>

      <div className="relative z-10 text-center">
        <div className="mb-4 flex items-center justify-center gap-3">
          <LogoMark size={44} className="shadow-none ring-2 ring-white/30" />
          <Wordmark height={28} className="text-white" />
        </div>
        <p className="mx-auto mb-8 max-w-[300px] text-lg leading-normal text-white/85">Where your people gather.</p>
        <ul className="flex flex-wrap items-center justify-center gap-2 text-[13px] font-medium text-white/90">
          <Feature icon={<MessageCircle size={14} />}>Real-time chat</Feature>
          <Feature icon={<AudioLines size={14} />}>Voice notes</Feature>
          <Feature icon={<Users size={14} />}>Communities</Feature>
        </ul>
      </div>
    </aside>
  );
}

function Bubble({ children, sent = false }: { children: string; sent?: boolean }) {
  return (
    <div
      className={
        sent
          ? 'max-w-[85%] self-end rounded-[12px_12px_3px_12px] bg-white/35 px-2.5 py-1.5 text-[10px] text-white'
          : 'max-w-[85%] self-start rounded-[12px_12px_12px_3px] bg-white/25 px-2.5 py-1.5 text-[10px] text-white/90'
      }
    >
      {children}
    </div>
  );
}

function FloatingAvatar({ initials, className }: { initials: string; className: string }) {
  return (
    <div
      className={`absolute flex items-center justify-center rounded-full border-2 border-white/40 bg-white/25 text-[11px] font-semibold text-white ${className}`}
    >
      {initials}
    </div>
  );
}

function Feature({ icon, children }: { icon: ReactNode; children: string }) {
  return (
    <li className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5">
      {icon}
      {children}
    </li>
  );
}
