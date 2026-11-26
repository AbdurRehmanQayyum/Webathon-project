# API

Base path `/api`. JSON in and out; enums are strings. The full contract is served at
`/openapi/v1.json` in Development.

## Conventions

- Authentication: a signed JWT in an HttpOnly, SameSite=Strict cookie. Everything requires sign-in
  except `auth/csrf`, `auth/register`, `auth/login`, `auth/logout` and `clubs/categories`.
- CSRF: call `GET /api/auth/csrf` and send the token as `X-CSRF-TOKEN` on POST, PUT and DELETE.
  Request a new token after the signed-in identity changes.
- Pagination: `pageNumber`, `pageSize` (1 to 100), `search`. Responses contain `items`, `pageNumber`,
  `pageSize`, `totalCount`, `totalPages`.
- Rich text: bodies are HTML, sanitised on the server to a small allow-list.
- Errors: Problem Details with `status`, `title` and optional `errors` and `code`.
- Status codes: 200, 201, 204, 400, 401, 403, 404, 409, 413, 429, 500, 503.
- An account with a temporary password receives 403 `password_change_required` outside `auth`.

## Endpoints

Access: **U** signed in, **O** owner, otherwise the permission key that is required.

| Method and path | Access | Notes |
| --- | --- | --- |
| `GET auth/csrf`, `POST auth/register`, `POST auth/login`, `POST auth/logout` | public | `interestIds` on register |
| `GET auth/me`, `POST auth/change-password` | U | Includes `permissions` |
| `GET users/search`, `GET users/{id}`, `PUT users/me` | U | Search feeds mentions |
| `GET clubs`, `GET clubs/{slug}` · `GET clubs/categories` | U · public | `categoryId`, `joinedOnly`, `sort` |
| `POST`, `DELETE clubs/{id}/membership` | `clubs.join` to join | |
| `POST club-requests`, `GET club-requests/mine` | `clubs.request`, U | Up to 3 pending |
| `GET posts` | U | `joinedOnly`, `clubId`, `authorId`, `tag`, `sort=Recent\|Popular\|ForYou` |
| `GET posts/{id}` · `POST posts` | U · `posts.create` | Posting needs membership |
| `PUT posts/{id}` · `DELETE posts/{id}` | O · O, `moderation.posts` | |
| `PUT posts/{id}/vote` | `posts.react` | `{ "value": -1, 0 or 1 }` |
| `PUT`, `DELETE posts/{id}/bookmark` · `GET bookmarks` | U | |
| `GET posts/{id}/comments` | U | `sort=Recent\|Popular\|Oldest`; pages count threads |
| `POST posts/{id}/comments` | `comments.create` | |
| `PUT comments/{id}` · `DELETE comments/{id}` | O · O, `moderation.comments` | |
| `PUT comments/{id}/vote` | `comments.react` | |
| `GET tags`, `GET recommendations/clubs` | U | |
| `GET announcements`, `GET announcements/{id}` | U | Drafts need `announcements.manage` |
| `POST`, `PUT`, `DELETE announcements`, `PUT .../publication` | `announcements.manage` | |
| `GET events`, `GET events/{id}` | U | `scope`, `category`, `status`, `from`, `to` |
| `POST events`, `PUT events/{id}`, `POST events/{id}/cancel` | `events.manage` | |
| `GET notifications` | O | `category`, `unreadOnly` |
| `POST notifications/{id}/read`, `.../read-all`, `DELETE notifications/{id}`, `.../read` | O | |
| `GET moderation/clubs`, `.../{id}/posts`, `.../{id}/comments` | moderation permission | Assigned clubs only |
| `PUT moderation/posts/{id}/pin` | `moderation.pin` | |
| `POST moderation/posts/{id}/remove`, `.../restore` | `moderation.posts` | |
| `POST moderation/comments/{id}/remove`, `.../restore` | `moderation.comments` | |
| `GET admin/overview` | `dashboard.view` | |
| `GET`, `POST admin/users`, `PUT admin/users/{id}/status` | `users.manage` | Creating an admin needs an admin |
| `PUT admin/users/{id}/admin-role` | `users.manage`, admins only | Not on yourself |
| `GET admin/clubs` | `clubs.manage` or `moderators.assign` | |
| `POST admin/clubs`, `PUT admin/clubs/{id}`, `.../status` | `clubs.manage` | |
| `PUT`, `DELETE admin/clubs/{id}/moderators/{userId}` | `moderators.assign` | |
| `GET admin/club-requests`, `POST .../{id}/approve`, `.../reject` | `clubrequests.review` | |
| `GET admin/permissions`, `PUT admin/permissions/{roleId}` | `permissions.manage` (admin) | |
| `POST users/me/avatar`, `clubs/{id}/logo`, `.../cover` | O, club moderator | File upload |
| `POST posts\|announcements\|events/{id}/attachments` | author or manager, `files.upload` | File upload |
| `GET files/policy`, `GET files/{id}`, `DELETE files/{id}` | per resource | `?download=true`; ranges supported |

Uploads are `multipart/form-data` with one `file` field.

## Real-time hub

`/hubs/live` (cookie authenticated). Client methods: `WatchPost(postId)`, `UnwatchPost(postId)`.
Server events: `NotificationsChanged`, `CommentsChanged(postId)`.
