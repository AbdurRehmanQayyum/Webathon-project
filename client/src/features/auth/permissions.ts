// Mirrors the server catalog; the API enforces every one of these
export const permissions = {
  createPosts: 'posts.create',
  reactToPosts: 'posts.react',
  createComments: 'comments.create',
  reactToComments: 'comments.react',
  joinClubs: 'clubs.join',
  requestClubs: 'clubs.request',
  uploadFiles: 'files.upload',
  moderatePosts: 'moderation.posts',
  moderateComments: 'moderation.comments',
  pinPosts: 'moderation.pin',
  manageAnnouncements: 'announcements.manage',
  manageEvents: 'events.manage',
  manageClubs: 'clubs.manage',
  reviewRequests: 'clubrequests.review',
  assignModerators: 'moderators.assign',
  manageUsers: 'users.manage',
  viewDashboard: 'dashboard.view',
  managePermissions: 'permissions.manage',
} as const

export type Permission = (typeof permissions)[keyof typeof permissions]
