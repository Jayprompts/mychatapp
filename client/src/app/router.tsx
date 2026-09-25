import { createBrowserRouter, Navigate } from 'react-router';
import { AppShell } from '@/components/layout/AppShell';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { PublicOnly, RequireAuth } from '@/features/auth/guards';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { WelcomePage } from '@/features/auth/pages/WelcomePage';
import { BlogPage } from '@/pages/BlogPage';
import { ChatsPage } from '@/pages/ChatsPage';
import { CommunitiesPage } from '@/pages/CommunitiesPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { RouteErrorPage } from '@/pages/RouteErrorPage';

export const router = createBrowserRouter([
  {
    errorElement: <RouteErrorPage />,
    children: [
      // Logged-out only
      {
        element: <PublicOnly />,
        children: [
          {
            element: <AuthLayout />,
            children: [
              { path: '/welcome', element: <WelcomePage /> },
              { path: '/login', element: <LoginPage /> },
              { path: '/register', element: <RegisterPage /> },
            ],
          },
        ],
      },

      // Logged-in only
      {
        element: <RequireAuth />,
        children: [
          {
            element: <AppShell />,
            children: [
              { path: '/', element: <Navigate to="/chats" replace /> },
              // One route for the list and an open conversation (optional :conversationId), so the
              // chat list stays mounted while switching conversations.
              { path: '/chats/:conversationId?', element: <ChatsPage /> },
              { path: '/communities', element: <CommunitiesPage /> },
              { path: '/blog', element: <BlogPage /> },
              { path: '/profile', element: <ProfilePage /> },
            ],
          },
        ],
      },

      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
