import { Link, useLocation } from 'react-router';
import { AudioLines, MessageCircle, Users } from 'lucide-react';
import { buttonClasses } from '@/components/ui/buttonClasses';
import { Logo, LogoMark } from '@/components/ui/Logo';

export function WelcomePage() {
  const location = useLocation(); // pass "where they were headed" along to login/register

  return (
    <div className="flex flex-col">
      {/* Mobile-only gradient hero (desktop has the brand panel, tablet the card) */}
      <div className="relative -mx-6 -mt-12 mb-8 flex h-56 items-center justify-center overflow-hidden bg-linear-145 from-[#00B2FF] via-[#6B40F0] to-[#B620E0] sm:hidden">
        <div className="absolute -top-10 -right-10 size-44 rounded-full bg-white/7" />
        <div className="absolute -bottom-5 -left-5 size-28 rounded-full bg-white/7" />
        <LogoMark size={72} className="relative shadow-none ring-2 ring-white/30" />
      </div>

      {/* Wrapper does the hiding: Logo's own inline-flex would override `hidden` */}
      <div className="mb-8 hidden sm:block">
        <Logo size={40} />
      </div>

      <h1 className="text-[30px] leading-tight font-bold tracking-tight text-text-primary sm:text-[32px]">
        Where your people gather.
      </h1>
      <p className="mt-3 text-base leading-relaxed text-text-secondary">
        Chat in real time, send voice notes, and grow your communities — all in one place.
      </p>

      <ul className="mt-6 flex flex-wrap gap-2">
        {[
          { icon: MessageCircle, label: 'Real-time chat' },
          { icon: AudioLines, label: 'Voice notes' },
          { icon: Users, label: 'Communities' },
        ].map(({ icon: Icon, label }) => (
          <li
            key={label}
            className="flex items-center gap-1.5 rounded-full bg-bg px-3.5 py-2 text-[13px] font-medium text-text-secondary sm:bg-surface-2 lg:bg-card"
          >
            <Icon size={14} className="text-primary" aria-hidden />
            {label}
          </li>
        ))}
      </ul>

      <div className="mt-10 flex flex-col gap-3">
        <Link to="/register" state={location.state} className={buttonClasses({ size: 'lg', fullWidth: true })}>
          Create account
        </Link>
        <Link
          to="/login"
          state={location.state}
          className={buttonClasses({ variant: 'secondary', size: 'lg', fullWidth: true })}
        >
          Log in
        </Link>
      </div>
    </div>
  );
}
