# Deployment (Windows x64 server)

One self-contained application serves the API, the SignalR hub and the React app from one domain.
The server needs SQL Server, IIS and the .NET 10 Hosting Bundle (for the IIS module). It does not
need Node.js or a separate .NET runtime for the app itself.

## 1. Settings

Edit `src/CampusConnect.Api/appsettings.Production.json` before publishing. The file is ignored by
git. If you are starting from a fresh clone, create it with this shape:

```json
{
  "AllowedHosts": "*",
  "ConnectionStrings": {
    "CampusConnect": "Server=.;Database=CampusConnectDB;Trusted_Connection=True;TrustServerCertificate=True"
  },
  "Jwt": { "Key": "<new-key.ps1 -Bytes 64>", "Issuer": "CampusConnect", "Audience": "CampusConnect" },
  "Encryption": { "Key": "<new-key.ps1 -Bytes 32>" },
  "AdminBootstrap": { "Email": "<admin email>", "FullName": "Head of Department", "Password": "<12+ characters>" },
  "DataProtection": { "KeysPath": "App_Data/keys" },
  "Storage": {
    "Provider": "S3",
    "Endpoint": "https://<ACCOUNT_ID>.r2.cloudflarestorage.com",
    "Region": "auto",
    "BucketName": "<bucket>",
    "AccessKeyId": "<access key id>",
    "SecretAccessKey": "<secret access key>",
    "PresignedUrlExpirationMinutes": 10
  }
}
```

The four storage values come from Cloudflare R2 (see [STORAGE.md](STORAGE.md)). Until they are set,
the app runs but uploads and file previews return "storage unavailable".

## 2. Build the packages

On the development machine:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/publish.ps1
```

| Zip in `artifacts/` | Contents |
| --- | --- |
| `CampusConnect-site.zip` | `CampusConnect.Api.exe`, the web app, `web.config`, production settings. **Contains secrets.** |
| `CampusConnect-database.zip` | `campusconnect-db.exe` (EF Core migration bundle), SQL scripts, `Setup.cmd` |

Add `-CleanInstall` to reinstall client packages first (stop the development web server for that).

## 3. Deploy to an existing IIS website

The server needs SQL Server (default instance), a website with its own application pool and an HTTPS
certificate, and the .NET 10 Hosting Bundle.

1. Stop the website.
2. Extract the site zip straight into the website folder.
3. Extract the database zip outside the website folder.
4. Right-click `Setup.cmd` and choose **Run as administrator**, as a SQL Server administrator.

`Setup.cmd` finds the website by its files, runs the database bundle with the connection string from
the production settings, gives the application pool account read and write access to the database,
allows writing to `App_Data` and `logs`, sets the pool to "No Managed Code", restarts the website and
checks `/health`. Use `Setup.cmd -SiteName <name>` if several websites contain the app.

**HTTPS is required.** Session cookies are secure-only; over plain HTTP the API answers
"This site requires HTTPS". A reverse proxy on the same host is trusted for forwarded headers; a
proxy on another host must be added to `ForwardedHeadersOptions`.

## 4. After installing

1. Sign in with the bootstrap administrator; you are asked to set a new password.
2. Remove the `AdminBootstrap:Password` value from the server settings.
3. Reload a deep link such as `/events`.
4. Upload an image to a post and preview it (confirms storage).
5. Confirm the browser offers to install the app.

## Keep safe

- Back up `Encryption:Key` separately from the database. Without it, stored content is unreadable.
- Changing `Jwt:Key` signs everyone out.
- Run one instance, or add a SignalR backplane and shared data protection keys.

## Verification status

On 26 November 2026 both zips were extracted on a development computer: the database bundle ran
against SQL Server, and the app served the web app and API over HTTPS in Production. `Setup.cmd` has
not been run on an IIS server.
