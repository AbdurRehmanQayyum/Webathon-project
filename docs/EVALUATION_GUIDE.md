# Evaluation guide

## Five minute demonstration

1. Sign in as the student. Open the feed, vote, bookmark, comment and reply.
2. Create a post with an image. Request a new club under Clubs.
3. Sign in as `admin`. Approve the request under Administration, then assign a moderator.
4. Publish an announcement and create, edit and cancel an event.
5. Sign in as `moderator`. Pin and remove content in an assigned club; note that other clubs are not
   listed and `/admin` is denied.
6. Open the app at phone width, switch theme and show the install option.

## Questions and answers

**Why these technologies?** React with TypeScript gives typed, reusable UI; TanStack Query handles
caching and invalidation; ASP.NET Core provides mature authentication, validation and hosting; SQL
Server enforces relational integrity.

**How are frontend components organised?** Shared primitives live in `components/`; each feature owns
its pages, API hooks, schemas and types in `features/<name>`.

**How does a request reach SQL Server?** Component → query hook → `api-client` → controller (auth,
CSRF, validation) → application service (rules, authorization) → `IAppDbContext` → EF Core → SQL
Server. DTO projections travel back.

**Why Database First?** The schema is explicit and reviewable in SQL, constraints are designed
deliberately, and the C# model is generated from what the database actually enforces.

**How does authentication work?** Passwords are hashed by ASP.NET Core Identity. Sign-in issues an
HttpOnly cookie with the user's claims. Each request re-checks that the account is active and its
security stamp is unchanged, so deactivation or a password change ends other sessions immediately.

**How does authorization work?** Policies restrict endpoints by role. Services then check the specific
resource: `ClubAccess` looks up `ClubModerators` and `ClubMembers`; authorship is checked for edits;
`FileAccessPolicy` covers files. The UI hides actions, but the server is the authority.

**How is a club request approved?** In one transaction: create the club, mark the request approved
only if it is still pending, add the requester as a member and queue a notification. A second
approval returns 409 and nothing is half-created.

**How do nested comments work?** Each comment may point to a parent through `ParentCommentId`. The API
returns a flat list; the client builds the tree, keeps placeholders for deleted parents and limits
indentation on small screens.

**How does data persist?** Everything is in SQL Server (files in object storage with metadata in SQL).
An integration test restarts the application and reads the data back.

**How do reusable components help?** One `Button`, `Modal`, `DataTable` or `FileUploader` defines
behaviour, accessibility and theme once, so pages stay small and consistent.

**How is security handled?** See the table in [ARCHITECTURE.md](ARCHITECTURE.md#security).

**How does the PWA work?** The service worker precaches static assets only and serves the app shell
offline. API data is never cached, so offline screens say the connection is lost and saving is paused.
A new version asks before reloading.

**What is real time?** SignalR tells clients that comments or notifications changed; they then re-read
through the normal API.

## Honest limits

- Registration does not verify student identity or email ownership; there is no password reset.
- Search uses SQL `LIKE` matching, not full-text search.
- Comment threads load up to 1,000 comments without paging.
- The R2 provider has not been exercised against a live bucket.
