import { createBrowserRouter, Navigate } from 'react-router';
import { AppShell } from '@/components/layout/AppShell';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { PublicOnly, RequireAuth } from '@/features/auth/guards';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { WelcomePage } from '@/features/auth/pages/WelcomePage';
import { ChatsPage } from '@/pages/ChatsPage';
import { RequireStaff } from '@/features/admin/components/RequireStaff';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { RouteErrorPage } from '@/pages/RouteErrorPage';
import { SplashScreen } from '@/components/layout/SplashScreen';

// Chats, sign-in and the app frame load up front; every other page is its own chunk, fetched the
// first time it's opened (the router waits for it before switching, so there's no blank flash).
export const router = createBrowserRouter([
  {
    errorElement: <RouteErrorPage />,
    hydrateFallbackElement: <SplashScreen />, // first load straight onto a lazy page
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
          // The admin panel: its own layout, staff only (the server re-checks every request).
          {
            path: '/admin',
            element: <RequireStaff />,
            children: [
              {
                lazy: () => import('@/features/admin/components/AdminLayout').then((m) => ({ Component: m.AdminLayout })),
                children: [
                  { index: true, lazy: () => import('@/pages/admin/DashboardPage').then((m) => ({ Component: m.DashboardPage })) },
                  { path: 'users', lazy: () => import('@/pages/admin/UsersPage').then((m) => ({ Component: m.UsersPage })) },
                  {
                    element: <RequireStaff roles={['content_mod']} />,
                    children: [
                      { path: 'reports', lazy: () => import('@/pages/admin/ReportsPage').then((m) => ({ Component: m.ReportsPage })) },
                      { path: 'posts', lazy: () => import('@/pages/admin/PostsPage').then((m) => ({ Component: m.PostsPage })) },
                    ],
                  },
                  {
                    element: <RequireStaff roles={['community_mgr']} />,
                    children: [{ path: 'communities', lazy: () => import('@/pages/admin/CommunitiesAdminPage').then((m) => ({ Component: m.AdminCommunitiesPage })) }],
                  },
                  {
                    element: <RequireStaff roles={['super_admin']} />,
                    children: [
                      { path: 'roles', lazy: () => import('@/pages/admin/RolesPage').then((m) => ({ Component: m.RolesPage })) },
                      { path: 'audit', lazy: () => import('@/pages/admin/AuditPage').then((m) => ({ Component: m.AuditPage })) },
                    ],
                  },
                ],
              },
            ],
          },
          {
            element: <AppShell />,
            children: [
              { path: '/', element: <Navigate to="/chats" replace /> },
              // One route for the list and an open conversation (optional :conversationId), so the
              // chat list stays mounted while switching conversations.
              { path: '/chats/:conversationId?', element: <ChatsPage /> },
              { path: '/communities/:communityId?', lazy: () => import('@/pages/CommunitiesPage').then((m) => ({ Component: m.CommunitiesPage })) },
              { path: '/join/:code', lazy: () => import('@/pages/InvitePage').then((m) => ({ Component: m.InvitePage })) },
              { path: '/blog', lazy: () => import('@/pages/BlogPage').then((m) => ({ Component: m.BlogPage })) },
              // One route for new + edit, so creating the draft doesn't remount the editor.
              { path: '/blog/write/:postId?', lazy: () => import('@/pages/PostEditorPage').then((m) => ({ Component: m.PostEditorPage })) },
              { path: '/blog/:postId', lazy: () => import('@/pages/PostPage').then((m) => ({ Component: m.PostPage })) },
              { path: '/profile', lazy: () => import('@/pages/ProfilePage').then((m) => ({ Component: m.ProfilePage })) },
              { path: '/profile/edit', lazy: () => import('@/pages/EditProfilePage').then((m) => ({ Component: m.EditProfilePage })) },
              { path: '/settings', lazy: () => import('@/pages/SettingsPage').then((m) => ({ Component: m.SettingsPage })) },
              { path: '/notifications', lazy: () => import('@/pages/NotificationsPage').then((m) => ({ Component: m.NotificationsPage })) },
              { path: '/u/:username', lazy: () => import('@/pages/UserProfilePage').then((m) => ({ Component: m.UserProfilePage })) },
            ],
          },
        ],
      },

      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
