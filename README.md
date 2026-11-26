# Campus Connect

**Connect. Collaborate. Grow.** A community platform for Computer Science Department students:
topic clubs with discussion feeds, official announcements and a department event calendar.

## Features

- Student registration and cookie sign-in with Admin, Moderator and Student roles
- Clubs: browse, join, leave, request new clubs; admin approval, editing and moderator assignment
- Discussions: text and link posts, nested comments, votes, bookmarks, pinned posts
- Moderation limited to assigned clubs
- Official announcements with links and attachments, drafts and publishing
- Event calendar with monthly, agenda, upcoming and past views; cancellation with reason
- File storage with a local provider and Cloudflare R2 (S3 compatible)
- Live comments and notifications over SignalR
- Installable PWA, light and dark themes, desktop and mobile layouts

## Technology

| Area | Stack |
| --- | --- |
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS 4, React Router, TanStack Query, React Hook Form, Zod, Motion, Radix primitives |
| Backend | .NET 10, ASP.NET Core Web API, EF Core 10, FluentValidation, SignalR |
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
