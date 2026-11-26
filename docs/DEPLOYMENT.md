# Deployment

One ASP.NET Core application serves the API, the SignalR hub and the built React app from the same
origin.

## Build

```powershell
powershell -ExecutionPolicy Bypass -File scripts/publish.ps1
```

Output: `artifacts/publish`. For a self-contained Linux build add `-Runtime linux-x64`.
Development settings are removed from the output.

## Database

Run the scripts in `database/` against the production SQL Server (see
[database/README.md](../database/README.md)). Use a login limited to this database.

## Configuration (environment variables)

| Variable | Required |
| --- | --- |
| `ASPNETCORE_ENVIRONMENT=Production` | yes |
| `ConnectionStrings__CampusConnect` | yes |
| `AdminBootstrap__Email`, `AdminBootstrap__Password` (12+ characters), `AdminBootstrap__FullName` | first start |
| `DataProtection__KeysPath` (persistent folder) | recommended |
| `Storage__Provider=S3` and the R2 settings | recommended |
| `Registration__AllowedEmailDomains__0` | optional |

The bootstrap creates an administrator only when none exists. Remove the password variable afterwards.
Demo data and demo accounts are never created in Production.

## Hosting requirements

- **HTTPS is required.** Session and CSRF cookies are marked Secure. Behind a reverse proxy on the
  same host, forwarded headers are honoured; a proxy on another host must be added to the trusted
  list in `ForwardedHeadersOptions`.
- Enable WebSockets for SignalR (it falls back to other transports).
- With local storage, `Storage__LocalRootPath` must be a persistent disk; use R2 on ephemeral hosts.
- Run a single instance, or add a SignalR backplane and shared data protection keys.

## Verify

1. `GET /health` returns `Healthy`.
2. Sign in as the bootstrap administrator.
3. Reload a deep link such as `/events` (single-page app fallback).
4. Confirm the browser offers to install the app.

No external deployment has been performed from this repository.
