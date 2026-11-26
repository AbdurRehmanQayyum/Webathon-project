# Local setup

## Requirements

- .NET 10 SDK
- Node.js 22.22 or newer with npm
- SQL Server 2019 or newer (Express or Developer)
- SSMS or `sqlcmd`

## 1. Database

Run the scripts in `database/` in numeric order (see [database/README.md](../database/README.md)).

## 2. Configuration

`appsettings.Development.json` points to `.\SQLEXPRESS` with Windows authentication. To use another
server, override the connection string with user secrets so credentials stay out of source control:

```powershell
dotnet user-secrets init --project src/CampusConnect.Api
```

```powershell
dotnet user-secrets set "ConnectionStrings:CampusConnect" "Server=<server>;Database=CampusConnectDB;User Id=<user>;Password=<password>;TrustServerCertificate=True" --project src/CampusConnect.Api
```

Environment variables work too, with `__` as the separator: `ConnectionStrings__CampusConnect`.

| Setting | Default | Meaning |
| --- | --- | --- |
| `ConnectionStrings:CampusConnect` | local SQLEXPRESS (Development) | SQL Server connection |
| `Jwt:Key` | generated in Development | Base64 session signing key (64 bytes) |
| `Encryption:Key` | generated in Development | Base64 AES-256 key (32 bytes) for stored content |
| `Jwt:SessionHours`, `Jwt:RememberDays` | 8, 14 | Session lifetime |
| `Registration:AllowedEmailDomains` | empty (any) | Restrict registration, for example `["students.example.edu"]` |
| `Seed:Enabled`, `Seed:DemoPassword` | on in Development | Demo accounts and content |
| `AdminBootstrap:Email`, `:Password`, `:FullName` | unset | First administrator for a deployment |
| `RateLimiting:RequestsPerMinute` | 600 | Overall API limit per client |
| `RateLimiting:SensitivePermitsPerMinute` | 30 | Sign-in, registration, upload and request limits |
| `Cors:AllowedOrigins` | empty | Only needed if the SPA is served from another origin |
| `DataProtection:KeysPath` | platform default | Persistent folder for CSRF protection keys |
| `Storage:*` | local provider | See [STORAGE.md](STORAGE.md) |

Development keys are written to `src/CampusConnect.Api/appsettings.Local.json` (ignored by git) on
the first start. Create keys by hand with:

```powershell
powershell -File scripts/new-key.ps1 -Bytes 64
```

```powershell
powershell -File scripts/new-key.ps1 -Bytes 32
```

**Keep `Encryption:Key` safe.** Content written with it cannot be read with any other key.

No institutional email domain is assumed and student identity is not verified. Set
`Registration:AllowedEmailDomains` when the department provides its domain.

## 3. Run

```powershell
dotnet run --project src/CampusConnect.Api
```

```powershell
npm --prefix client install
```

```powershell
npm --prefix client run dev
```

- Web app: <http://localhost:5173>
- API: <http://localhost:5080/api>
- OpenAPI document (Development): <http://localhost:5080/openapi/v1.json>
- Health: <http://localhost:5080/health>

The Vite server proxies `/api`, `/hubs` and `/health` to the API. Set `API_PROXY_TARGET` to use a
different API address.

## Demo data

The first Development start creates demo accounts, clubs, posts, requests, announcements and events.
It is skipped when demo accounts already exist. Changing `Seed:DemoPassword` later does not change
accounts that were already created.

## Tests and checks

Stop the running API first, then:

```powershell
dotnet test
```

```powershell
npm --prefix client run lint
```

```powershell
npm --prefix client run build
```

Integration tests build a separate `CampusConnectDB_Tests` database on `.\SQLEXPRESS` from the SQL
scripts and never drop it. Set `CAMPUSCONNECT_TEST_CONNECTION` to use another server.

The app can be installed from <http://localhost:5173> in Chrome or Edge: use the install icon in the
address bar or the **Install app** button when the browser offers it.
