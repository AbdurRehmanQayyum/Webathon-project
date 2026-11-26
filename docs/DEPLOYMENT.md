# Deployment (Windows x64 server)

One self-contained application serves the API, the SignalR hub and the React app from one domain.
The server needs SQL Server; it does not need .NET or Node.js.

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

## 2. Build

On the development machine:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/publish.ps1
```

| Output | Contents |
| --- | --- |
| `artifacts/publish/app` | `CampusConnect.Api.exe`, the web app and production settings |
| `artifacts/publish/database` | `campusconnect-db.exe` and the SQL scripts |

Stop a running development server first: the script reinstalls client packages.

## 3. Database

Copy both folders to the server. As a Windows user with permission to create databases:

```powershell
.\campusconnect-db.exe
```

It uses `Server=.` with Windows authentication, creates `CampusConnectDB` when missing and applies the
scripts that have not run yet. For another instance:

```powershell
.\campusconnect-db.exe --connection "Server=.\SQLEXPRESS;Database=CampusConnectDB;Trusted_Connection=True;TrustServerCertificate=True"
```

## 4. Give the app access to the database

The app signs in to SQL Server as the Windows account that runs it. For IIS with an application pool
named `CampusConnect`, run in SSMS (for a Windows service use that service account instead):

```sql
CREATE LOGIN [IIS APPPOOL\CampusConnect] FROM WINDOWS;
GO
USE CampusConnectDB;
CREATE USER [IIS APPPOOL\CampusConnect] FOR LOGIN [IIS APPPOOL\CampusConnect];
ALTER ROLE db_datareader ADD MEMBER [IIS APPPOOL\CampusConnect];
ALTER ROLE db_datawriter ADD MEMBER [IIS APPPOOL\CampusConnect];
```

## 5. Host with HTTPS

**HTTPS is required.** Session cookies are secure-only; over plain HTTP the API answers
"This site requires HTTPS".

**IIS:** install the ASP.NET Core Hosting Bundle and the WebSocket Protocol feature, point a site at
the `app` folder (application pool: "No Managed Code"), add an HTTPS binding with your certificate
and give the pool identity write access to `app\App_Data`.

**Windows service without IIS:** add a certificate endpoint to the production settings, for example

```json
"Kestrel": {
  "Endpoints": {
    "Https": {
      "Url": "https://*:443",
      "Certificate": { "Subject": "<your domain>", "Store": "My", "Location": "LocalMachine" }
    }
  }
}
```

then register the service:

```powershell
sc.exe create CampusConnect binPath= "C:\Apps\CampusConnect\CampusConnect.Api.exe" start= auto
```

A reverse proxy on the same host is trusted for forwarded headers. A proxy on another host must be
added to `ForwardedHeadersOptions`.

## 6. Verify

1. `GET /health` returns `Healthy`.
2. Sign in with the bootstrap administrator; you are asked to set a new password.
3. Remove the `AdminBootstrap:Password` value from the server settings.
4. Reload a deep link such as `/events`.
5. Upload an image to a post and preview it (confirms storage).
6. Confirm the browser offers to install the app.

## Keep safe

- Back up `Encryption:Key` separately from the database. Without it, stored content is unreadable.
- Changing `Jwt:Key` signs everyone out.
- Run one instance, or add a SignalR backplane and shared data protection keys.

No external deployment has been performed from this repository.
