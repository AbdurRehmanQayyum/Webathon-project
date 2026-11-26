import type { ComponentType } from 'react'
import { createBrowserRouter } from 'react-router'
import { AppLayout } from '@/app/layouts/AppLayout'
import { AuthLayout } from '@/app/layouts/AuthLayout'
import { BrandLoader } from '@/components/feedback/BrandLoader'
import { LoginPage } from '@/features/auth/LoginPage'
import { AccessDeniedPage, NotFoundPage } from '@/features/auth/StatusPages'
import { HomePage } from '@/features/feed/HomePage'
import { GuestOnly, RequireAuth, RequireRole } from './guards'
import { RouteError } from './RouteError'

// Pages beyond sign-in and the feed load on demand
function page<Name extends string>(load: () => Promise<Record<Name, ComponentType>>, name: Name) {
  return { lazy: async () => ({ Component: (await load())[name] }) }
}

const adminRoutes = [
  { index: true, ...page(() => import('@/features/administration/OverviewPage'), 'OverviewPage') },
  {
    path: 'requests',
    ...page(() => import('@/features/administration/RequestsAdminPage'), 'RequestsAdminPage'),
  },
  {
    path: 'clubs',
    ...page(() => import('@/features/administration/ClubsAdminPage'), 'ClubsAdminPage'),
  },
  { path: 'users', ...page(() => import('@/features/administration/UsersPage'), 'UsersPage') },
  {
    path: 'announcements',
    ...page(
      () => import('@/features/administration/AnnouncementsAdminPage'),
      'AnnouncementsAdminPage',
    ),
  },
  {
    path: 'events',
    ...page(() => import('@/features/administration/EventsAdminPage'), 'EventsAdminPage'),
  },
]

const memberRoutes = [
  { index: true, element: <HomePage /> },
  { path: 'clubs', ...page(() => import('@/features/clubs/ClubsPage'), 'ClubsPage') },
  {
    path: 'clubs/requests',
    ...page(() => import('@/features/clubs/ClubRequestsPage'), 'ClubRequestsPage'),
  },
  {
    path: 'clubs/:slug',
    ...page(() => import('@/features/clubs/ClubDetailPage'), 'ClubDetailPage'),
  },
  { path: 'posts/new', ...page(() => import('@/features/posts/CreatePostPage'), 'CreatePostPage') },
  {
    path: 'posts/:postId',
    ...page(() => import('@/features/posts/PostDetailPage'), 'PostDetailPage'),
  },
  {
    path: 'posts/:postId/edit',
    ...page(() => import('@/features/posts/EditPostPage'), 'EditPostPage'),
  },
  {
    path: 'announcements',
    ...page(() => import('@/features/announcements/AnnouncementsPage'), 'AnnouncementsPage'),
  },
  {
    path: 'announcements/:announcementId',
    ...page(
      () => import('@/features/announcements/AnnouncementDetailPage'),
      'AnnouncementDetailPage',
    ),
  },
  { path: 'events', ...page(() => import('@/features/events/EventsPage'), 'EventsPage') },
  {
    path: 'events/:eventId',
    ...page(() => import('@/features/events/EventDetailPage'), 'EventDetailPage'),
  },
  { path: 'bookmarks', ...page(() => import('@/features/posts/BookmarksPage'), 'BookmarksPage') },
  { path: 'search', ...page(() => import('@/features/search/SearchPage'), 'SearchPage') },
  { path: 'profile', ...page(() => import('@/features/profile/ProfilePage'), 'ProfilePage') },
  { path: 'users/:userId', ...page(() => import('@/features/profile/ProfilePage'), 'ProfilePage') },
  { path: 'settings', ...page(() => import('@/features/profile/SettingsPage'), 'SettingsPage') },
  {
    element: <RequireRole roles={['Admin', 'Moderator']} />,
    children: [
      {
        path: 'moderation',
        ...page(() => import('@/features/moderation/ModerationPage'), 'ModerationPage'),
      },
    ],
  },
  {
    element: <RequireRole roles={['Admin']} />,
    children: [
      {
        path: 'admin',
        ...page(() => import('@/features/administration/AdminLayout'), 'AdminLayout'),
        children: adminRoutes,
      },
    ],
  },
  { path: 'access-denied', element: <AccessDeniedPage /> },
  { path: '*', element: <NotFoundPage /> },
]

export const router = createBrowserRouter([
  {
    errorElement: <RouteError />,
    hydrateFallbackElement: <BrandLoader fullScreen label="Loading Campus Connect" />,
    children: [
      {
        element: <GuestOnly />,
        children: [
          {
            element: <AuthLayout />,
            children: [
              { path: 'login', element: <LoginPage /> },
              {
                path: 'register',
                ...page(() => import('@/features/auth/RegisterPage'), 'RegisterPage'),
              },
            ],
          },
        ],
      },
      { element: <RequireAuth />, children: [{ element: <AppLayout />, children: memberRoutes }] },
    ],
  },
])
