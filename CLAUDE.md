# Campus Connect

Community platform for CS Department students: React SPA, ASP.NET Core 10 API, SQL Server.

## Layout

- `src/CampusConnect.Domain`: scaffolded entities, enums, constants. No dependencies.
- `src/CampusConnect.Application`: services, DTOs, validators, abstractions. Depends on Domain.
- `src/CampusConnect.Infrastructure`: DbContext, storage, hashing, seeding.
- `src/CampusConnect.Api`: controllers, auth, middleware, SignalR hub, startup.
- `client/src`: `app/`, `components/`, `features/<name>/`, `services/`, `hooks/`, `lib/`, `styles/`.
- `database/`: numbered SQL scripts. `tools/`: database migration bundle. `tests/`: integration tests.
  `docs/`: documentation.

## Database rules (Database First)

- Change the schema only with a new idempotent script `database/NN_Name.sql`. No EF migrations.
- Re-scaffold after schema changes (command in `docs/DATABASE.md`). Never hand-edit scaffolded files;
  extend `CampusConnectDbContext` in `CampusConnectDbContext.Extensions.cs`.
- A new script also needs a class in `tools/CampusConnect.DbMigrator/Migrations`.
- Do not drop or recreate existing tables without explicit approval.
- Enums are `byte` columns; cast in queries: `(byte)ContentStatus.Published`.

## Backend conventions

- Controllers stay thin; rules live in Application services. Return DTOs, never entities.
- Throw `AppException` types; `GlobalExceptionHandler` maps them to Problem Details.
- Every request body with rules has a FluentValidation validator (applied by `ValidationFilter`).
- Authorize on the server: permission keys (`PermissionKeys`) as policies, `IClubAccess` for club
  scope, `FileAccessPolicy` for files.
- User HTML goes through `ContentProcessor`. Encrypted columns cannot be filtered in SQL.
- Never commit keys: `appsettings.Local.json` and `appsettings.Production.json` stay ignored.
- `AsNoTracking`, projections and pagination for reads; pass `CancellationToken` through.
- Short section comments only.

## Frontend conventions

- Strict TypeScript, no `any`. Server state in TanStack Query; filters in the URL.
- Feature code stays in `features/<name>`; shared primitives in `components/`.
- Use semantic tokens from `styles/tokens.css` (`bg-surface`, `text-muted`, `bg-primary`). No raw hex
  in components.
- Brand: `#8E1EA2` primary, `#C654C3` secondary, `#ED96D7` accent, `#FFC0DE` soft.
- Button classes set `display`, so hide a button responsively with a wrapper element.
- Pages are full width; pack uneven cards with `components/common/Masonry`.

## Commands

```powershell
dotnet run --project src/CampusConnect.Api    # API on http://localhost:5080
npm --prefix client run dev                   # SPA on http://localhost:5173
dotnet test                                   # needs SQL Server
npm --prefix client run lint
npm --prefix client run build
powershell -File scripts/publish.ps1
```

Stop the running API before building or testing; it locks the output assemblies.
