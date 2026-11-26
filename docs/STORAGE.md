# File storage

Files are stored in object storage; SQL Server keeps only metadata in `Attachments`
(object key, original name, content type, extension, size, provider, uploader, timestamps,
soft-delete flag). Presigned URLs are never stored.

## Providers

`IFileStorageService` (Application) offers `Upload`, `Download`, `Delete`, `Exists` and
`GetPresignedUrl`.

| `Storage:Provider` | Class | Use |
| --- | --- | --- |
| `Local` (default) | `LocalStorageService` | Development. Files under `Storage:LocalRootPath`; the API streams them. |
| `S3` | `S3StorageService` | Cloudflare R2 or another S3-compatible service. |

The local provider returns no presigned URL, so the API streams the file after the same permission
check. With `S3`, `GET /api/files/{id}` answers authorized users with a redirect to a short-lived
presigned URL.

## Cloudflare R2

1. Create a **private** bucket (do not enable public access).
2. Create an API token with object read and write permission for that bucket.
3. Configure with user secrets or environment variables. Never commit these values.

```powershell
dotnet user-secrets set "Storage:Provider" "S3" --project src/CampusConnect.Api
```

```powershell
dotnet user-secrets set "Storage:Endpoint" "https://<account-id>.r2.cloudflarestorage.com" --project src/CampusConnect.Api
```

```powershell
dotnet user-secrets set "Storage:BucketName" "<bucket>" --project src/CampusConnect.Api
```

```powershell
dotnet user-secrets set "Storage:AccessKeyId" "<access-key-id>" --project src/CampusConnect.Api
```

```powershell
dotnet user-secrets set "Storage:SecretAccessKey" "<secret-access-key>" --project src/CampusConnect.Api
```

User secrets need `dotnet user-secrets init` once. In production use `Storage__Provider`,
`Storage__Endpoint` and so on.

Compatibility settings required by R2 are built in: payload signing and default checksum validation
are disabled on uploads, checksums are calculated only when required, path-style addressing is used
and the signing region is `auto`. Reference:
<https://developers.cloudflare.com/r2/examples/aws/aws-sdk-net/>.

If `S3` is selected with incomplete settings the application still starts; file requests return 503
and a warning is logged.

## Settings

| Setting | Default |
| --- | --- |
| `Storage:Region` | `auto` |
| `Storage:PresignedUrlExpirationMinutes` | 5 |
| `Storage:MaxFileSize` | 5 MB (hard database limit 10 MB) |
| `Storage:UserQuota` | 100 MB per uploader |
| `Storage:AllowedFileTypes` | `.png .jpg .jpeg .gif .webp .pdf .docx .pptx .xlsx .txt` |

Removing entries from `AllowedFileTypes` narrows uploads. Adding a type the server has no signature
check for has no effect, so executables and SVG cannot be enabled by configuration.

## Object keys

```
users/{userId}/avatars/{guid}
clubs/{clubId}/logos/{guid}
clubs/{clubId}/covers/{guid}
posts/{postId}/attachments/{guid}
announcements/{announcementId}/attachments/{guid}
events/{eventId}/attachments/{guid}
```

## Permissions

| File | Upload | View | Delete |
| --- | --- | --- | --- |
| Avatar | Owner | Signed in | Owner, admin |
| Club logo, cover | Club moderator, admin | Signed in | Club moderator, admin |
| Post attachment | Post author | Follows post visibility | Author, club moderator, admin |
| Announcement file | Admin | Published, or admin | Admin |
| Event file | Admin | Signed in | Admin |

## Safeguards

- Extension, declared MIME type and file signature must agree. Office files are opened and checked;
  macro projects are rejected.
- Posts, announcements and events accept up to 4 files each.
- Uploads go through the API (no direct-to-bucket upload) and are rate limited.
- If saving metadata fails, the uploaded object is deleted. Replacing an image deletes the old object.
  A failed object deletion is logged.
- The service worker caches no `/api` responses; attachment responses are `no-store`.

## Switching providers

Only one provider is active. Files uploaded with one provider are not copied automatically; copy the
objects with the same keys before switching, or start with an empty file set.

## Verification status

Local upload, replacement, download, deletion, authorization, quota and metadata persistence are
covered by integration tests. The S3 provider is tested offline for provider selection, authorized
redirect and presigned URL shape. **It has not been run against a live R2 bucket**; upload and delete
there should be verified once credentials are available.
