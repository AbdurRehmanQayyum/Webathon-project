# Campus Connect

**Connect. Collaborate. Grow.** A community platform for Computer Science Department students:
topic clubs with discussion feeds, official announcements and a department event calendar.

## Features

- Public landing page, three-step registration with interests, installable PWA
- Admin, Moderator and Student roles with an editable permission matrix; admins create accounts
- Clubs: browse, join, leave, request; approval, editing and moderator assignment
- Rich text posts and comments with `@mentions`, `#tags`, votes, bookmarks and pinned posts
- Comment sorting (recent, popular, oldest) with server-side pagination
- Image, video, audio and document attachments with in-app preview and download
- Club recommendations and a "For you" feed based on interests, votes, comments and memberships
- Moderation limited to assigned clubs
- Official announcements, and an event calendar with hover details and a clock time picker
- Notification centre with category and unread filters; live updates over SignalR
- File storage with a local provider or Cloudflare R2 (S3 compatible)
- Written content encrypted in the database; responsive light and dark themes

## Technology

| Area | Stack |
| --- | --- |
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS 4, React Router, TanStack Query, React Hook Form, Zod, TipTap, Motion, Radix primitives |
| Backend | .NET 10, ASP.NET Core Web API, EF Core 10, FluentValidation, SignalR, JWT |
| Database | Microsoft SQL Server, Database First |

## Quick start

Requirements: .NET 10 SDK, Node.js 22.22 or newer, SQL Server (Express is enough), `sqlcmd` or SSMS.

1. Create the database:

```powershell
Get-ChildItem database\*.sql | Sort-Object Name | ForEach-Object { sqlcmd -S .\SQLEXPRESS -E -C -b -I -i $_.FullName }
```

2. Start the API (seeds demo data on first run in Development):

```powershell
dotnet run --project src/CampusConnect.Api
```

3. Start the web app in a second terminal:

```powershell
npm --prefix client install
```

```powershell
npm --prefix client run dev
```

Open <http://localhost:5173>.

On its first Development start the API creates `src/CampusConnect.Api/appsettings.Local.json` with
signing and encryption keys for your machine. The file is ignored by git. If your database already
holds encrypted content from another key, copy that key in before starting.

## Demo accounts

All demo accounts use the password in `Seed:DemoPassword`
(`src/CampusConnect.Api/appsettings.Development.json`). Seeding runs only in Development.

| Email | Role |
| --- | --- |
| `admin@campusconnect.test` | Admin, Head of Department |
| `headcr@campusconnect.test` | Admin, Head CR |
| `headgr@campusconnect.test` | Admin, Head GR |
| `moderator@campusconnect.test` | Moderator: AI Club, Data Science Community |
| `student@campusconnect.test` | Student |

## Documentation

- [Setup](docs/SETUP.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Database](docs/DATABASE.md)
- [API](docs/API.md)
- [Design system](docs/DESIGN_SYSTEM.md)
- [File storage](docs/STORAGE.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Evaluation guide](docs/EVALUATION_GUIDE.md)
