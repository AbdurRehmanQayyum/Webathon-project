# Evaluation guide

## Five minute demonstration

1. Show the landing page, then the three-step registration and interest picker.
2. As the student: open the "For you" feed, write a post with formatting, `@mention`, `#tag` and an
   attachment; preview it; comment, vote on comments and sort them.
3. Request a new club. Show suggested clubs and the notification centre.
4. As `admin`: approve the request, assign a moderator, create a user with a temporary password.
5. Change a permission under Roles & permissions and show its effect.
6. Publish an announcement; create an event with the clock picker; hover it in the calendar.
7. As `moderator`: pin and remove content in an assigned club; other clubs are not listed.
8. Narrow the window to phone width, switch theme and show the install option.

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

**How does authentication work?** Passwords are hashed by ASP.NET Core Identity. Sign-in issues a
signed JWT in an HttpOnly cookie, so scripts cannot read it. Each request re-checks that the account
is active and its security stamp is unchanged, so deactivation or a password change ends other
sessions immediately.

**How does authorization work?** Each endpoint requires a permission key; administrators edit which
role holds which key. Services then check the specific resource: `ClubAccess` looks up
`ClubModerators` and `ClubMembers`, authorship is checked for edits, and `FileAccessPolicy` covers
files. The UI hides actions, but the server is the authority.

**How is a club request approved?** In one transaction: create the club, mark the request approved
only if it is still pending, add the requester as a member and queue a notification. A second
approval returns 409 and nothing is half-created.

**How do nested comments work?** Each comment points to its parent and to its top-level thread. The
API pages whole threads in the chosen order; the client builds the tree, keeps placeholders for
deleted parents and limits indentation on small screens.

**Is the data end-to-end encrypted?** No, and it is deliberate: moderation, search, mentions and
recommendations need the server to read content. It is encrypted in transit (HTTPS) and the written
content is encrypted in the database with AES-256-GCM.

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
- Search uses SQL `LIKE` on titles, names and tags. Encrypted bodies are not searched.
- Recommendations are a weighted score, not a trained model.
- Files are not encrypted by the application.
