import { createBrowserRouter, Navigate } from 'react-router';
import { AppShell } from '@/components/layout/AppShell';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { PublicOnly, RequireAuth } from '@/features/auth/guards';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { WelcomePage } from '@/features/auth/pages/WelcomePage';
import { BlogPage } from '@/pages/BlogPage';
import { PostEditorPage } from '@/pages/PostEditorPage';
import { PostPage } from '@/pages/PostPage';
import { ChatsPage } from '@/pages/ChatsPage';
import { CommunitiesPage } from '@/pages/CommunitiesPage';
import { InvitePage } from '@/pages/InvitePage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { EditProfilePage } from '@/pages/EditProfilePage';
import { ProfilePage } from '@/pages/ProfilePage';
import { SettingsPage } from '@/pages/SettingsPage';
import { UserProfilePage } from '@/pages/UserProfilePage';
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
              { path: '/communities/:communityId?', element: <CommunitiesPage /> },
              { path: '/join/:code', element: <InvitePage /> },
              { path: '/blog', element: <BlogPage /> },
              // One route for new + edit, so creating the draft doesn't remount the editor.
              { path: '/blog/write/:postId?', element: <PostEditorPage /> },
              { path: '/blog/:postId', element: <PostPage /> },
              { path: '/profile', element: <ProfilePage /> },
              { path: '/profile/edit', element: <EditProfilePage /> },
              { path: '/settings', element: <SettingsPage /> },
              { path: '/u/:username', element: <UserProfilePage /> },
            ],
          },
        ],
      },

      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
