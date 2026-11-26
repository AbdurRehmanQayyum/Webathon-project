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

You need four values: the **account ID** (for the endpoint), the **bucket name**, an **access key ID**
and a **secret access key**. In production put them in `appsettings.Production.json` (see
[DEPLOYMENT.md](DEPLOYMENT.md)).

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
| `Storage:MaxImageSize` | 5 MB |
| `Storage:MaxDocumentSize` | 10 MB |
| `Storage:MaxAudioSize` | 20 MB |
| `Storage:MaxVideoSize` | 50 MB |
| `Storage:UserQuota` | 500 MB per uploader |
| `Storage:AllowedFileTypes` | images, `.mp4 .webm .mp3 .wav .ogg .m4a .pdf .docx .pptx .xlsx .txt` |

The database caps any file at 100 MB. Removing entries from `AllowedFileTypes` narrows uploads.
Adding a type the server has no signature check for has no effect, so executables and SVG cannot be
enabled by configuration. Images, video, audio, PDF and text preview in the app; Office files
download.

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
- Posts, announcements and events accept up to 6 files each.
- Uploads go through the API (no direct-to-bucket upload) and are rate limited.
- If saving metadata fails, the uploaded object is deleted. Replacing an image deletes the old object.
  A failed object deletion is logged.
- The service worker caches no `/api` responses; attachment responses are `no-store`.

## Switching providers

Only one provider is active. Files uploaded with one provider are not copied automatically; copy the
objects with the same keys before switching, or start with an empty file set.

## Verification status

Local upload, replacement, download, deletion, authorization, quota and metadata persistence are
covered by integration tests.

The S3 provider was checked by hand on 26 November 2026 against a live Cloudflare R2 bucket with a
production build: image, audio, text, PDF and video uploads; authorized redirect to a signed URL;
identical bytes on download; range requests; inline and attachment responses; refusal of unsigned
and anonymous requests; deletion from the bucket; and image, audio and text previews in the browser
under the production Content Security Policy. Keep the bucket's public development URL disabled.
