import { Navigate, Outlet, useLocation } from 'react-router';
import { SplashScreen } from '@/components/layout/SplashScreen';
import { errorMessage } from '@/lib/api';
import { pendingLoginReturn, useMe } from './api';
import { SessionExpiredModal } from './components/SessionExpiredModal';

type FromState = { from?: string; identifier?: string } | null;

// Wraps logged-in routes. Not logged in -> /welcome (remembering where they were headed).
export function RequireAuth() {
  const me = useMe();
  const location = useLocation();

  if (me.isPending) return <SplashScreen />;
  if (me.isError) return <SplashScreen error={errorMessage(me.error)} onRetry={() => me.refetch()} />;
  if (!me.data) {
    const back = pendingLoginReturn(); // came from "Session expired" → straight to the login form
    if (back) return <Navigate to="/login" replace state={back satisfies FromState} />;
    return <Navigate to="/welcome" replace state={{ from: location.pathname } satisfies FromState} />;
  }

  return (
    <>
      <Outlet />
      <SessionExpiredModal />
    </>
  );
}

// Wraps /welcome, /login, /register. Already logged in -> back to where they were headed (or /chats).
// This is also what moves the user into the app right after a successful login/register.
export function PublicOnly() {
  const me = useMe();
  const location = useLocation();

  if (me.isPending) return <SplashScreen />;
  if (me.data) {
    const from = (location.state as FromState)?.from;
    return <Navigate to={from && from !== '/' ? from : '/chats'} replace />;
  }

  return <Outlet />;
}
