# API

Base path `/api`. JSON in and out; enums are strings. The full contract is served at
`/openapi/v1.json` in Development.

## Conventions

- Authentication: session cookie. Everything requires sign-in except `auth/csrf`, `auth/register`,
  `auth/login` and `auth/logout`.
- CSRF: call `GET /api/auth/csrf` and send the token as `X-CSRF-TOKEN` on POST, PUT and DELETE.
  Request a new token after the signed-in identity changes.
- Pagination: `pageNumber`, `pageSize` (1 to 100), `search`. Responses contain `items`, `pageNumber`,
  `pageSize`, `totalCount`, `totalPages`.
- Errors: Problem Details with `status`, `title` and optional `errors`.
- Status codes: 200, 201, 204, 400, 401, 403, 404, 409, 429, 500, 503.

## Endpoints

Access: **U** signed in, **M** club moderator or admin, **A** admin, **O** owner.

| Method and path | Access | Notes |
| --- | --- | --- |
| `GET auth/csrf`, `POST auth/register`, `POST auth/login`, `POST auth/logout` | public | |
| `GET auth/me`, `POST auth/change-password` | U | |
| `GET users/{id}`, `PUT users/me` | U | |
| `GET clubs`, `GET clubs/categories`, `GET clubs/{slug}` | U | `categoryId`, `joinedOnly`, `sort` |
| `POST`, `DELETE clubs/{id}/membership` | U | Join, leave |
| `POST club-requests`, `GET club-requests/mine` | U | Up to 3 pending |
| `GET posts` | U | `joinedOnly`, `clubId`, `authorId`, `sort=Recent\|Popular` |
| `GET posts/{id}`, `POST posts` | U | Posting needs membership |
| `PUT posts/{id}` | O | |
| `DELETE posts/{id}` | O, M | |
| `PUT posts/{id}/vote` | U | `{ "value": -1, 0 or 1 }` |
| `PUT`, `DELETE posts/{id}/bookmark` · `GET bookmarks` | U | |
| `GET`, `POST posts/{id}/comments` | U | Posting needs membership |
| `PUT comments/{id}` · `DELETE comments/{id}` | O · O, M | |
| `GET announcements`, `GET announcements/{id}` | U | Students see published only |
| `POST`, `PUT`, `DELETE announcements`, `PUT announcements/{id}/publication` | A | |
| `GET events`, `GET events/{id}` | U | `scope`, `category`, `status`, `from`, `to` |
| `POST events`, `PUT events/{id}`, `POST events/{id}/cancel` | A | |
| `GET notifications`, `POST notifications/{id}/read`, `POST notifications/read-all` | O | |
| `GET moderation/clubs`, `GET moderation/clubs/{id}/posts`, `.../comments` | M | |
| `PUT moderation/posts/{id}/pin`, `POST moderation/posts/{id}/remove`, `.../restore` | M | |
| `POST moderation/comments/{id}/remove`, `.../restore` | M | |
| `GET admin/overview`, `GET admin/users` | A | |
| `PUT admin/users/{id}/status`, `.../admin-role` | A | Not on yourself |
| `GET`, `POST admin/clubs` · `PUT admin/clubs/{id}`, `.../status` | A | |
| `PUT`, `DELETE admin/clubs/{id}/moderators/{userId}` | A | |
| `GET admin/club-requests`, `POST .../{id}/approve`, `.../reject` | A | |
| `POST users/me/avatar` | O | File upload |
| `POST clubs/{id}/logo`, `.../cover` | M | File upload |
| `POST posts/{id}/attachments` | O | File upload |
| `POST announcements/{id}/attachments`, `events/{id}/attachments` | A | File upload |
| `GET files/policy`, `GET files/{id}`, `DELETE files/{id}` | per resource | |

Uploads are `multipart/form-data` with one `file` field.

## Real-time hub

`/hubs/live` (cookie authenticated). Client methods: `WatchPost(postId)`, `UnwatchPost(postId)`.
Server events: `NotificationsChanged`, `CommentsChanged(postId)`.
